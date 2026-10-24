(function(){
  'use strict';

  const PIXI_VERSION='8.19.0';
  const PIXI_URL=`https://cdn.jsdelivr.net/npm/pixi.js@${PIXI_VERSION}/dist/pixi.min.js`;
  const PIXI_INTEGRITY='sha384-brfu63ZHzOfumoqQXzA4Wo7k9kQOaJ68C/E7+Uc8lgQB42dOOjA+urOyy/sOnKPq';


  const canvasDrawAlliedEffects=drawAlliedEffects;
  const canvasDrawForegroundEffects=drawForegroundEffects;
  const canvasDrawEnemyProjectiles=drawEnemyProjectiles;
  const canvasDrawBeamEffects=typeof drawBeamEffects==='function'?drawBeamEffects:null;
  const canvasDrawStars=typeof drawStars==='function'?drawStars:null;
  const baseSpawnParticle=spawnParticle;
  const baseUpdateEffects=updateEffects;

  let app=null;
  let initStarted=false;
  let pixiLoaded=false;
  let webglReady=false;
  let contextLost=false;
  let contextLossCount=0;
  let contextRestoreCount=0;
  let rendererState='loading';
  let lastFailure='';
  let tickerFrames=0;
  let gpuSyncAvgMs=0;
  let gpuSyncMaxMs=0;
  let gpuSyncSamples=0;
  let firstGpuFrame=false;
  let initDeadline=performance.now()+3600;
  let visibleParticleSprites=0;
  let particleTexture=null;
  let hostileTexture=null;
  let vignetteTexture=null;
  let textureGeneration=0;
  let texturesCreated=0;
  let texturesDestroyed=0;
  const particleSprites=[];
  const hostileSprites=[];
  let postVignetteSprite=null;
  let postFlashSprite=null;
  let particleLayer=null;
  let hostileLayer=null;
  let postLayer=null;
  let tickerRegistered=false;
  let tickerRegistrationCount=0;
  let contextListenerRegistrationCount=0;
  const rendererGeneration=window.__stackfallRendererGeneration=(window.__stackfallRendererGeneration||0)+1;
  let gpuCanvasReady=false;
  let gpuFrameRateCap=0;
  const warned=new Set();
  const tintCache=new Map();
  const TINT_CACHE_LIMIT=96;

  const sparklesEnabled=()=>GAME_SETTINGS.sparkles!==false;
  const USE_GPU_PLAYER_PROJECTILES=false;
  const USE_GPU_PLAYER_BEAMS=false;

  function resizeGpuCombatLayer(){if(!app?.renderer)return;const compact=matchMedia('(pointer:coarse)').matches||innerWidth<760,scale=clamp(Number(window.stackfallResolutionScale)||1,.30,1),pixels=Math.max(1,window.innerWidth*window.innerHeight),large=pixels>=1300000,cap=compact?1.15:large?1.15:1.40,areaScale=!compact&&large?.90:1,resolution=Math.max(.30,Math.min(window.devicePixelRatio||1,cap)*scale*areaScale);app.renderer.resize(window.innerWidth,window.innerHeight,resolution);const surface=safeGpuCanvas();if(surface){surface.style.width=`${window.innerWidth}px`;surface.style.height=`${window.innerHeight}px`;}}
  window.resizeGpuCombatLayer=resizeGpuCombatLayer;
  window.drawForegroundCombat=function drawForegroundCombat(){
    if(state.mode==='menu')return;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.save();ctx.translate(state.camera.shakeX||0,state.camera.shakeY||0);
    runDrawStage('drawTelegraphsForeground',drawTelegraphs);if(typeof drawMapEvents==='function')runDrawStage('drawMapEventsForeground',drawMapEvents);runDrawStage('drawEnemiesForeground',drawEnemies);if(typeof drawBeamEffects==='function')runDrawStage('drawBeamEffectsForeground',drawBeamEffects);runDrawStage('drawEnemyProjectilesForeground',drawEnemyProjectiles);runDrawStage('drawMagnetFieldForeground',drawMagnetField);runDrawStage('drawChronoFieldForeground',drawChronoField);runDrawStage('drawPlayerForeground',drawPlayer);runDrawStage('drawEffectsForeground',canvasDrawForegroundEffects);ctx.restore();ctx.setTransform(dpr,0,0,dpr,0,0);
    if(state.mode==='stageVictory'&&typeof drawStageVictoryCinematic==='function')runDrawStage('drawStageVictoryCinematicForeground',drawStageVictoryCinematic);
    if(typeof drawRealmCinematicOverlay==='function')runDrawStage('drawRealmCinematicOverlayForeground',drawRealmCinematicOverlay);
  };

  function setRendererState(next){
    rendererState=next;
    document.documentElement.dataset.stackfallRenderer=next==='active'?'pixi-webgl':'canvas2d';
  }
  function warnOnce(key,message,error){
    if(warned.has(key))return;
    warned.add(key);
    console.warn(message,error||'');
  }
  function cacheTint(key,value){
    if(tintCache.size>=TINT_CACHE_LIMIT&&!tintCache.has(key))tintCache.delete(tintCache.keys().next().value);
    tintCache.set(key,value);return value;
  }
  function parseColor(value,fallback=0xffffff){
    if(typeof value!=='string')return fallback;
    const text=value.trim(),cached=tintCache.get(text);if(cached!==undefined)return cached;
    if(/^#[0-9a-f]{6}$/i.test(text))return cacheTint(text,Number.parseInt(text.slice(1),16));
    if(/^#[0-9a-f]{3}$/i.test(text)){const r=Number.parseInt(text[1],16),g=Number.parseInt(text[2],16),b=Number.parseInt(text[3],16);return cacheTint(text,(r*17<<16)|(g*17<<8)|(b*17));}
    const rgb=text.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if(rgb)return cacheTint(text,(clamp(Number(rgb[1]),0,255)<<16)|(clamp(Number(rgb[2]),0,255)<<8)|clamp(Number(rgb[3]),0,255));
    return fallback;
  }
  function makeTexture(size,soft=true){
    const surface=document.createElement('canvas');
    surface.width=surface.height=size;
    const g=surface.getContext('2d'),c=size/2;
    if(soft){
      const grad=g.createRadialGradient(c,c,0,c,c,c);
      grad.addColorStop(0,'rgba(255,255,255,1)');
      grad.addColorStop(.30,'rgba(255,255,255,.96)');
      grad.addColorStop(.68,'rgba(255,255,255,.36)');
      grad.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=grad;
    }else g.fillStyle='#fff';
    g.beginPath();g.arc(c,c,soft?c:c*.72,0,Math.PI*2);g.fill();
    return PIXI.Texture.from(surface);
  }
  function makeVignetteTexture(size=384){
    const surface=document.createElement('canvas');surface.width=surface.height=size;const g=surface.getContext('2d'),c=size/2,gradient=g.createRadialGradient(c,c,size*.13,c,c,size*.52);
    gradient.addColorStop(0,'rgba(0,0,0,0)');gradient.addColorStop(.58,'rgba(0,0,0,.04)');gradient.addColorStop(1,'rgba(0,1,8,.58)');g.fillStyle=gradient;g.fillRect(0,0,size,size);return PIXI.Texture.from(surface);
  }
  function makeHostileTexture(){
    const surface=document.createElement('canvas');surface.width=112;surface.height=64;const g=surface.getContext('2d'),cx=60,cy=32;
    g.translate(cx,cy);g.fillStyle='#fff';g.strokeStyle='rgba(255,255,255,.82)';g.lineWidth=2;g.shadowColor='#fff';g.shadowBlur=10;
    g.beginPath();g.moveTo(34,0);g.quadraticCurveTo(5,-14,-22,0);g.quadraticCurveTo(5,14,34,0);g.closePath();g.fill();g.stroke();
    g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.94)';g.beginPath();g.ellipse(16,-3,6,3,0,0,Math.PI*2);g.fill();
    return PIXI.Texture.from(surface);
  }
  function destroyTexture(texture){
    if(!texture||texture===PIXI.Texture.WHITE)return;
    try{texture.destroy(true);texturesDestroyed++;}catch(error){console.error('[Stackfall] texture cleanup failed',error);}
  }
  function rebuildTextures(){
    for(const pool of [particleSprites,hostileSprites])for(const sprite of pool)if(sprite)sprite.texture=PIXI.Texture.WHITE;
    if(postVignetteSprite)postVignetteSprite.texture=PIXI.Texture.WHITE;
    destroyTexture(particleTexture);destroyTexture(hostileTexture);destroyTexture(vignetteTexture);
    particleTexture=makeTexture(40,true);hostileTexture=makeHostileTexture();vignetteTexture=makeVignetteTexture();texturesCreated+=3;textureGeneration++;
    for(const sprite of particleSprites)if(sprite)sprite.texture=particleTexture;
    if(postVignetteSprite)postVignetteSprite.texture=vignetteTexture;
  }
  function syncPostEffects(){
    if(!app||contextLost||!postVignetteSprite||!postFlashSprite)return;const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;
    postVignetteSprite.visible=state.mode!=='menu'&&tier===0;postVignetteSprite.x=vw/2;postVignetteSprite.y=vh/2;postVignetteSprite.width=vw;postVignetteSprite.height=vh;postVignetteSprite.alpha=1;
    const flash=sparklesEnabled()?Math.max(0,Number(state.flash)||0):0;postFlashSprite.visible=state.mode!=='menu'&&flash>=.18;postFlashSprite.x=vw/2;postFlashSprite.y=vh/2;postFlashSprite.width=vw;postFlashSprite.height=vh;postFlashSprite.alpha=Math.min(.42,flash*.72);
  }
  function syncHostileProjectileSprites(){
    if(!app||contextLost||rendererState!=='active'){hideUnused(hostileSprites,0);return;}
    const list=state.entities.enemyProjectiles||[];let used=0;
    for(let i=0;i<list.length;i++){
      const p=list[i];if(p?.visual==='ion-globule')continue;if(!p||p.life<=0||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
      const x=p.x-player.x+vw/2,y=p.y-player.y+vh/2;if(x<-64||x>vw+64||y<-64||y>vh+64)continue;
      const r=Math.max(2.4,Math.min(13,Number(p.r)||4)),sprite=ensureSprite(hostileSprites,used++,hostileLayer,hostileTexture||PIXI.Texture.WHITE);
      sprite.visible=true;sprite.x=Math.round(x);sprite.y=Math.round(y);sprite.rotation=Number.isFinite(p.heading)?p.heading:Math.atan2(p.vy||0,p.vx||0);sprite.tint=parseColor(p.color,0xff6c91);sprite.alpha=.96;sprite.width=r*5.0;sprite.height=r*2.65;
    }
    hideUnused(hostileSprites,used);
  }
  function ensureSprite(pool,index,layer,texture){
    let sprite=pool[index];
    if(!sprite){
      sprite=new PIXI.Sprite(texture);
      sprite.anchor.set(.5);
      sprite.visible=false;
      layer.addChild(sprite);
      pool[index]=sprite;
    }
    if(sprite.texture!==texture)sprite.texture=texture;
    return sprite;
  }
  function hideUnused(pool,start){
    for(let i=start;i<pool.length;i++)pool[i].visible=false;
  }
  function canvasReady(force=false){
    if(gpuCanvasReady&&!force)return true;
    const canvas=safeGpuCanvas();
    if(!canvas||!document.body.contains(canvas))return false;
    const rect=canvas.getBoundingClientRect();
    gpuCanvasReady=canvas.width>0&&canvas.height>0&&rect.width>0&&rect.height>0;return gpuCanvasReady;
  }
  function safeGpuCanvas(){
    try{return app?.canvas||null;}catch{return null;}
  }
  function rendererLooksGpu(){
    const renderer=app?.renderer;
    if(!renderer)return false;
    const name=String(renderer.constructor?.name||renderer.name||'');
    return /webgl|gpu/i.test(name)||!!renderer.gl||!!renderer.context?.gl||!!renderer.runners;
  }
  function activeGpuProjectiles(){return rendererState==='active'&&app&&!contextLost&&canvasReady();}
  function syncGpuFrameBudget(){if(!app?.ticker)return;const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,emergency=typeof stackfallEmergencyRendering==='function'&&stackfallEmergencyRendering(),cap=emergency?30:tier===2?40:tier===1?50:60;if(cap===gpuFrameRateCap)return;gpuFrameRateCap=cap;app.ticker.maxFPS=cap;}
  function countRenderableProjectiles(){
    const list=state.entities.projectiles||[];
    let count=0;
    for(const p of list){
      if(!p||p.life<=0||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
      const x=p.x-player.x+vw/2,y=p.y-player.y+vh/2;
      if(x<-120||x>vw+120||y<-120||y>vh+120)continue;
      count++;
    }
    return count;
  }
  function syncParticleSprites(){
    visibleParticleSprites=0;
    if(!app||contextLost)return;
    if(!sparklesEnabled()||GAME_SETTINGS.hideProjectiles===true||state.mode==='menu'){hideUnused(particleSprites,0);return;}
    const list=state.entities.particles||[];
    let used=0;
    const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,limit=Math.min(list.length,tier===2?24:tier===1?72:compactDevice()?120:220),rotationBase=performance.now()*.002;
    for(let i=0;i<limit;i++){
      const p=list[i];
      if(!p||p.life<=0||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
      const x=p.x-player.x+vw/2,y=p.y-player.y+vh/2;
      if(x<-40||x>vw+40||y<-40||y>vh+40)continue;
      const sprite=ensureSprite(particleSprites,used++,particleLayer,particleTexture);
      const size=Math.max(1,Math.min(9,Number(p.size)||2));
      sprite.visible=true;sprite.x=Math.round(x);sprite.y=Math.round(y);
      sprite.tint=parseColor(p.color,0xffffff);
      sprite.alpha=clamp((Number(p.life)||0)/Math.max(.001,Number(p.max)||Number(p.life)||1),0,.85);
      sprite.width=sprite.height=size*(p.star?4.1:3.2);
      sprite.rotation=p.star?(rotationBase+i*.73):0;
    }
    visibleParticleSprites=used;
    hideUnused(particleSprites,used);
  }
  function evaluateReadiness(){
    if(!app||contextLost||!['warming-up','active'].includes(rendererState))return;
    // Player projectiles are Canvas-owned; their GPU sprite count cannot gate readiness.
    if(pixiLoaded&&webglReady&&canvasReady()&&tickerFrames>0&&firstGpuFrame){setRendererState('active');return;}
    if(performance.now()>initDeadline)disableGpuRenderer('warm-up timed out');
  }
  function syncGpuLayer(){
    const sample=(tickerFrames%30)===0,start=sample?performance.now():0;
    try{
      tickerFrames++;
      firstGpuFrame=true;
      const canvas=safeGpuCanvas();
      syncGpuFrameBudget();
      if(canvas)canvas.style.display=state.mode==='menu'||contextLost?'none':'block';
      if(app?.stage)app.stage.position.set(state.camera.shakeX||0,state.camera.shakeY||0);
      syncParticleSprites();
      syncHostileProjectileSprites();
      syncPostEffects();
      evaluateReadiness();
    }catch(error){
      disableGpuRenderer('frame update failed',error);
    }finally{
      if(sample){const elapsed=performance.now()-start;gpuSyncSamples++;gpuSyncAvgMs+=((elapsed-gpuSyncAvgMs)/Math.min(gpuSyncSamples,90));gpuSyncMaxMs=Math.max(gpuSyncMaxMs*.995,elapsed);}
    }
  }
  function disableGpuRenderer(reason,error){
    lastFailure=reason;
    const canvas=safeGpuCanvas();
    if(canvas)canvas.style.display='none';
    
    hideUnused(particleSprites,0);
    setRendererState(contextLost?'context-lost':initStarted&&!app?'failed':'canvas-fallback');
    warnOnce(reason,`[Stackfall] PixiJS renderer disabled: ${reason}`,error);
  }
  async function initPixi(){
    if(initStarted||!window.PIXI?.Application)return;
    initStarted=true;pixiLoaded=true;setRendererState('warming-up');initDeadline=performance.now()+3600;
    try{
      app=new PIXI.Application();
      await app.init({
        resizeTo:window,
        backgroundAlpha:0,
        antialias:false,
        autoDensity:true,
        resolution:(()=>{const compact=matchMedia('(pointer:coarse)').matches||innerWidth<760,pixels=Math.max(1,window.innerWidth*window.innerHeight),large=pixels>=1300000,cap=compact?1.15:large?1.15:1.40,areaScale=!compact&&large?.90:1;return Math.max(.30,Math.min(window.devicePixelRatio||1,cap)*clamp(Number(window.stackfallResolutionScale)||1,.30,1)*areaScale);})(),
        preference:'webgl',
        powerPreference:'default',
        failIfMajorPerformanceCaveat:false,
        autoStart:true,
        sharedTicker:false
      });
      webglReady=rendererLooksGpu();
      if(!webglReady)throw new Error('GPU renderer unavailable');
      const canvas=app.canvas,existing=document.querySelector('#gpuCombatLayer');if(existing&&existing!==canvas)existing.remove();canvas.id='gpuCombatLayer';
      Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',display:'block',pointerEvents:'none',touchAction:'none',zIndex:'1',background:'transparent'});
      canvas.setAttribute('aria-hidden','true');
      const gameCanvas=document.querySelector('#game');
      gameCanvas.style.zIndex='0';
      gameCanvas.insertAdjacentElement('afterend',canvas);

      particleLayer=new PIXI.Container();
      hostileLayer=new PIXI.Container();
      postLayer=new PIXI.Container();
      app.stage.addChild(particleLayer);
      app.stage.addChild(hostileLayer);
      app.stage.addChild(postLayer);
      rebuildTextures();
      postVignetteSprite=new PIXI.Sprite(vignetteTexture);postVignetteSprite.anchor.set(.5);postLayer.addChild(postVignetteSprite);
      postFlashSprite=new PIXI.Sprite(PIXI.Texture.WHITE);postFlashSprite.anchor.set(.5);postFlashSprite.tint=0xe1f2ff;postLayer.addChild(postFlashSprite);
      for(let i=0;i<240;i++)ensureSprite(particleSprites,i,particleLayer,particleTexture);
      hideUnused(particleSprites,0);

      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;gpuCanvasReady=false;contextLossCount++;lastFailure='WebGL context lost';hideUnused(particleSprites,0);canvas.style.display='none';setRendererState('context-lost');});
      canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;gpuCanvasReady=false;contextRestoreCount++;lastFailure='';firstGpuFrame=false;rebuildTextures();app.start();setRendererState('warming-up');resizeGpuCombatLayer();if(canvasReady(true))canvas.style.display='block';});
      contextListenerRegistrationCount++;
      if(!tickerRegistered){app.ticker.add(syncGpuLayer,undefined,PIXI.UPDATE_PRIORITY.HIGH);tickerRegistered=true;tickerRegistrationCount++;}
      evaluateReadiness();
    }catch(error){
      disableGpuRenderer('initialization failed',error);
      setRendererState('failed');
    }
  }
  function loadPixi(){
    if(window.PIXI?.Application){initPixi();return;}
    const pending=document.querySelector('script[data-stackfall-pixi]');if(pending){pending.addEventListener('load',initPixi,{once:true});return;}
    const script=document.createElement('script');
    script.src=PIXI_URL;
    script.integrity=PIXI_INTEGRITY;
    script.crossOrigin='anonymous';
    script.async=true;
    script.dataset.stackfallPixi=PIXI_VERSION;
    script.addEventListener('load',initPixi,{once:true});
    script.addEventListener('error',()=>{lastFailure='PixiJS download failed';setRendererState('failed');warnOnce('download','[Stackfall] PixiJS download failed; Canvas 2D fallback remains active.');},{once:true});
    document.head.appendChild(script);
  }
  spawnParticle=function sparkleAwareParticleSpawn(...args){
    if(!sparklesEnabled())return;
    return baseSpawnParticle(...args);
  };
  updateEffects=function sparkleAwareEffectUpdate(dt){
    const result=baseUpdateEffects(dt);
    if(!sparklesEnabled()&&state.entities?.particles)state.entities.particles.length=0;
    return result;
  };
  drawAlliedEffects=function hybridAlliedEffectDraw(){
    if(activeGpuProjectiles()||!sparklesEnabled()){if(typeof drawPostRosterWeaponEntities==='function')drawPostRosterWeaponEntities();return;}
    return canvasDrawAlliedEffects();
  };
  const AUTHORED_HOSTILE_BUFFER=[];
  drawEnemyProjectiles=function hybridEnemyProjectileDraw(){if(!activeGpuProjectiles())return canvasDrawEnemyProjectiles();const original=state.entities.enemyProjectiles;AUTHORED_HOSTILE_BUFFER.length=0;for(const p of original)if(p?.visual==='ion-globule')AUTHORED_HOSTILE_BUFFER.push(p);state.entities.enemyProjectiles=AUTHORED_HOSTILE_BUFFER;try{return canvasDrawEnemyProjectiles();}finally{state.entities.enemyProjectiles=original;}};
  if(canvasDrawBeamEffects)drawBeamEffects=function hybridBeamDraw(){return canvasDrawBeamEffects();};
  if(canvasDrawStars){
    drawStars=function sparkleAwareStars(palette=['#f6f8ff','#8fe9ff','#cdbfff'],density=1){
      if(sparklesEnabled())return canvasDrawStars(palette,density);
      try{
        for(let li=0;li<STAR_LAYERS.length;li++){
          const layer=STAR_LAYERS[li],tile=layer.size,ox=player.x*layer.parallax,oy=player.y*layer.parallax,step=Math.max(1,Math.round(1/Math.max(.01,density*.72)));
          for(let i=0;i<layer.stars.length;i+=step){
            const star=layer.stars[i],x=wrap(star.x-ox,tile)-100,y=wrap(star.y-oy,tile)-100;
            if(x<-4||x>vw+4||y<-4||y>vh+4)continue;
            ctx.globalAlpha=star.a*.62;ctx.fillStyle=star.hue>.84?palette[2]:star.hue>.56?palette[1]:palette[0];
            ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,star.r*.85),Math.max(1,star.r*.85));
          }
        }
        ctx.globalAlpha=1;
      }catch{return canvasDrawStars(palette,Math.min(.35,density));}
    };
  }

  window.stackfallRendererInfo=()=>({
    status:rendererState,
    backend:rendererState==='active'?'PixiJS WebGL + single Canvas':'Canvas 2D',
    version:PIXI_VERSION,
    fallback:rendererState!=='active',
    pixiLoaded,
    webglReady,
    contextLost,
    contextLossCount,
    contextRestoreCount,
    rendererGeneration,
    tickerRegistered,
    tickerRegistrationCount,
    contextListenerRegistrationCount,
    tickerFrames,
    gpuSync:{avgMs:gpuSyncAvgMs,maxMs:gpuSyncMaxMs,samples:gpuSyncSamples},
    firstGpuFrame,
    particleSprites:{pool:particleSprites.length,visible:visibleParticleSprites},
    hostileSprites:{pool:hostileSprites.length,visible:hostileSprites.filter(sprite=>sprite?.visible).length},
    canvasLayers:{auxiliaryForeground:false},
    textures:{generation:textureGeneration,created:texturesCreated,destroyed:texturesDestroyed,live:[particleTexture,hostileTexture,vignetteTexture].filter(Boolean).length},
    projectileCount:countRenderableProjectiles(),
    playerVisuals:{projectiles:'canonical-canvas',beams:'canvas',gpuProjectiles:USE_GPU_PLAYER_PROJECTILES,gpuBeams:USE_GPU_PLAYER_BEAMS},
    hierarchy:['game-canvas','gpu-hostile-particles','html-ui'],
    dpr,
    renderScale:Number(window.stackfallResolutionScale)||1,
    shake:{x:state.camera.shakeX||0,y:state.camera.shakeY||0,frame:state.renderFrame},
    baseCanvas:{width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight},
    gpuCanvas:safeGpuCanvas()?{width:safeGpuCanvas().width,height:safeGpuCanvas().height,cssWidth:safeGpuCanvas().clientWidth,cssHeight:safeGpuCanvas().clientHeight,display:safeGpuCanvas().style.display}:null,
    lastFailure
  });
  setRendererState('loading');
  loadPixi();
})();
