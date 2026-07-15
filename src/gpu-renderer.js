(function(){
  'use strict';

  const PIXI_VERSION='8.19.0';
  const PIXI_URL=`https://cdn.jsdelivr.net/npm/pixi.js@${PIXI_VERSION}/dist/pixi.min.js`;
  const PIXI_INTEGRITY='sha384-brfu63ZHzOfumoqQXzA4Wo7k9kQOaJ68C/E7+Uc8lgQB42dOOjA+urOyy/sOnKPq';

  const canvasDrawProjectiles=drawProjectiles;
  const canvasDrawAlliedEffects=drawAlliedEffects;
  const canvasDrawForegroundEffects=drawForegroundEffects;
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
  let firstGpuFrame=false;
  let firstProjectileSpriteSeen=false;
  let projectileWarmupDeadline=0;
  let initDeadline=performance.now()+3600;
  let visibleProjectileSprites=0;
  let visibleParticleSprites=0;
  let lastProjectileCount=0;
  let projectileTexture=null;
  let solidTexture=null;
  let particleTexture=null;
  let textureGeneration=0;
  let texturesCreated=0;
  let texturesDestroyed=0;
  const projectileSprites=[];
  const particleSprites=[];
  let projectileLayer=null;
  let particleLayer=null;
  let tickerRegistered=false;
  let tickerRegistrationCount=0;
  let contextListenerRegistrationCount=0;
  const rendererGeneration=window.__stackfallRendererGeneration=(window.__stackfallRendererGeneration||0)+1;
  let foregroundCanvas=null;
  let foregroundCtx=null;
  const warned=new Set();

  const sparklesEnabled=()=>GAME_SETTINGS.sparkles!==false;
  const shouldShowAlliedVisuals=()=>GAME_SETTINGS.hideProjectiles!==true&&state.mode!=='menu';

  function ensureForegroundCanvas(){
    foregroundCanvas=document.querySelector('#combatForeground')||document.createElement('canvas');foregroundCanvas.id='combatForeground';foregroundCanvas.setAttribute('aria-hidden','true');Object.assign(foregroundCanvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',display:'block',pointerEvents:'none',touchAction:'none',zIndex:'2',background:'transparent'});if(!foregroundCanvas.isConnected)canvas.insertAdjacentElement('afterend',foregroundCanvas);foregroundCtx=foregroundCanvas.getContext('2d',{alpha:true});resizeForegroundCanvas();
  }
  function resizeForegroundCanvas(){if(!foregroundCanvas||!foregroundCtx)return;const width=Math.max(1,Math.floor(vw*dpr)),height=Math.max(1,Math.floor(vh*dpr));if(foregroundCanvas.width!==width)foregroundCanvas.width=width;if(foregroundCanvas.height!==height)foregroundCanvas.height=height;foregroundCtx.setTransform(dpr,0,0,dpr,0,0);}
  window.resizeForegroundCanvas=resizeForegroundCanvas;
  window.drawForegroundCombat=function drawForegroundCombat(){
    if(!foregroundCanvas||!foregroundCtx)return;resizeForegroundCanvas();foregroundCanvas.style.display=state.mode==='menu'?'none':'block';foregroundCtx.setTransform(1,0,0,1,0,0);foregroundCtx.clearRect(0,0,foregroundCanvas.width,foregroundCanvas.height);if(state.mode==='menu')return;
    const previousCtx=ctx;ctx=foregroundCtx;try{ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.save();ctx.translate(state.camera.shakeX||0,state.camera.shakeY||0);runDrawStage('drawTelegraphsForeground',drawTelegraphs);if(typeof drawMapEvents==='function')runDrawStage('drawMapEventsForeground',drawMapEvents);runDrawStage('drawEnemiesForeground',drawEnemies);if(typeof drawBeamEffects==='function')runDrawStage('drawBeamEffectsForeground',drawBeamEffects);runDrawStage('drawEnemyProjectilesForeground',drawEnemyProjectiles);runDrawStage('drawMagnetFieldForeground',drawMagnetField);runDrawStage('drawChronoFieldForeground',drawChronoField);runDrawStage('drawPlayerForeground',drawPlayer);runDrawStage('drawEffectsForeground',canvasDrawForegroundEffects);ctx.restore();ctx.setTransform(dpr,0,0,dpr,0,0);const performanceTier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;if(performanceTier===0){const vignette=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.18,vw/2,vh/2,Math.max(vw,vh)*.74);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,1,8,.58)');ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);}else if(performanceTier===1){ctx.fillStyle='rgba(0,1,8,.08)';ctx.fillRect(0,0,vw,vh);}if(sparklesEnabled()&&state.flash>0){ctx.fillStyle=`rgba(225,242,255,${Math.min(.42,state.flash*.72)})`;ctx.fillRect(0,0,vw,vh);}if(typeof drawRealmCinematicOverlay==='function')runDrawStage('drawRealmCinematicOverlayForeground',drawRealmCinematicOverlay);}finally{ctx=previousCtx;}
  };
  ensureForegroundCanvas();

  function setRendererState(next){
    rendererState=next;
    document.documentElement.dataset.stackfallRenderer=next==='active'?'pixi-webgl':'canvas2d';
  }
  function warnOnce(key,message,error){
    if(warned.has(key))return;
    warned.add(key);
    console.warn(message,error||'');
  }
  function parseColor(value,fallback=0xffffff){
    if(typeof value!=='string')return fallback;
    const text=value.trim();
    if(/^#[0-9a-f]{6}$/i.test(text))return Number.parseInt(text.slice(1),16);
    if(/^#[0-9a-f]{3}$/i.test(text)){const [r,g,b]=text.slice(1).split('').map(v=>v+v);return Number.parseInt(`${r}${g}${b}`,16);}
    const rgb=text.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if(rgb)return(clamp(Number(rgb[1]),0,255)<<16)|(clamp(Number(rgb[2]),0,255)<<8)|clamp(Number(rgb[3]),0,255);
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
  function destroyTexture(texture){
    if(!texture||texture===PIXI.Texture.WHITE)return;
    try{texture.destroy(true);texturesDestroyed++;}catch(error){console.error('[Stackfall] texture cleanup failed',error);}
  }
  function rebuildTextures(){
    const safeTexture=PIXI.Texture.WHITE;
    for(const sprite of projectileSprites)if(sprite)sprite.texture=safeTexture;
    for(const sprite of particleSprites)if(sprite)sprite.texture=safeTexture;
    destroyTexture(projectileTexture);destroyTexture(solidTexture);destroyTexture(particleTexture);
    projectileTexture=makeTexture(64,true);solidTexture=makeTexture(48,false);particleTexture=makeTexture(40,true);
    texturesCreated+=3;textureGeneration++;
    const projectileReplacement=sparklesEnabled()?projectileTexture:solidTexture;
    for(const sprite of projectileSprites)if(sprite)sprite.texture=projectileReplacement;
    for(const sprite of particleSprites)if(sprite)sprite.texture=particleTexture;
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
  function canvasReady(){
    const canvas=safeGpuCanvas();
    if(!canvas||!document.body.contains(canvas))return false;
    const rect=canvas.getBoundingClientRect();
    return canvas.width>0&&canvas.height>0&&rect.width>0&&rect.height>0;
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
  function activeGpuProjectiles(){
    return rendererState==='active'&&app&&!contextLost&&canvasReady();
  }
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
  function syncProjectileSprites(){
    visibleProjectileSprites=0;
    if(!app||contextLost)return;
    const visible=shouldShowAlliedVisuals();
    if(!visible){hideUnused(projectileSprites,0);return;}
    const list=state.entities.projectiles||[];
    let used=0;
    for(let i=0;i<list.length;i++){
      const p=list[i];
      if(!p||p.life<=0||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
      const x=p.x-player.x+vw/2,y=p.y-player.y+vh/2;
      if(x<-120||x>vw+120||y<-120||y>vh+120)continue;
      const source=String(p.source||''),speed=Math.hypot(p.vx||0,p.vy||0),radius=Math.max(1.5,Math.min(24,Number(p.r)||4));
      const comet=source.includes('comet'),star=['ember','echo-star','core','core-echo','star-spark'].includes(source);
      const texture=sparklesEnabled()?projectileTexture:solidTexture;
      const sprite=ensureSprite(projectileSprites,used++,projectileLayer,texture);
      sprite.visible=true;
      sprite.x=Math.round(x);sprite.y=Math.round(y);
      sprite.rotation=Math.atan2(p.vy||0,p.vx||0);
      sprite.tint=parseColor(p.color,0xffffff);
      sprite.alpha=sparklesEnabled()?(comet?.98:.90):.88;
      sprite.width=Math.max(radius*2.8,comet?radius*8.2:star?radius*5.2:radius*3.8+Math.min(22,speed*.018));
      sprite.height=Math.max(3.5,radius*(comet?3.5:star?3.0:2.5));
    }
    visibleProjectileSprites=used;
    if(used>0)firstProjectileSpriteSeen=true;
    hideUnused(projectileSprites,used);
  }
  function syncParticleSprites(){
    visibleParticleSprites=0;
    if(!app||contextLost)return;
    if(!sparklesEnabled()||GAME_SETTINGS.hideProjectiles===true||state.mode==='menu'){hideUnused(particleSprites,0);return;}
    const list=state.entities.particles||[];
    let used=0;
    const limit=Math.min(list.length,compactDevice()?120:220);
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
      sprite.rotation=p.star?(performance.now()*.002+i*.73):0;
    }
    visibleParticleSprites=used;
    hideUnused(particleSprites,used);
  }
  function evaluateReadiness(){
    if(!app||contextLost||!['warming-up','active'].includes(rendererState))return;
    const visualsEnabled=shouldShowAlliedVisuals();
    const renderable=visualsEnabled?countRenderableProjectiles():0;
    lastProjectileCount=countRenderableProjectiles();
    const baseReady=pixiLoaded&&webglReady&&canvasReady()&&tickerFrames>0&&firstGpuFrame;
    if(!visualsEnabled){projectileWarmupDeadline=0;return;}
    if(renderable>0&&!firstProjectileSpriteSeen&&!projectileWarmupDeadline)projectileWarmupDeadline=performance.now()+900;
    if(baseReady&&renderable>0&&visibleProjectileSprites>0){setRendererState('active');return;}
    if(rendererState==='active'&&renderable>0&&visibleProjectileSprites===0){setRendererState('warming-up');projectileWarmupDeadline=performance.now()+900;return;}
    if(!firstGpuFrame&&performance.now()>initDeadline){disableGpuRenderer('warm-up timed out');return;}
    if(renderable>0&&!firstProjectileSpriteSeen&&projectileWarmupDeadline&&performance.now()>projectileWarmupDeadline)disableGpuRenderer('projectile sprite warm-up timed out');
  }
  function syncGpuLayer(){
    try{
      tickerFrames++;
      firstGpuFrame=true;
      const canvas=safeGpuCanvas();
      if(canvas)canvas.style.display=state.mode==='menu'||contextLost?'none':'block';
      if(app?.stage)app.stage.position.set(state.camera.shakeX||0,state.camera.shakeY||0);
      syncParticleSprites();
      syncProjectileSprites();
      evaluateReadiness();
    }catch(error){
      disableGpuRenderer('frame update failed',error);
    }
  }
  function disableGpuRenderer(reason,error){
    lastFailure=reason;
    const canvas=safeGpuCanvas();
    if(canvas)canvas.style.display='none';
    hideUnused(projectileSprites,0);hideUnused(particleSprites,0);
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
        resolution:Math.min(window.devicePixelRatio||1,1.5),
        preference:'webgl',
        powerPreference:'high-performance',
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
      projectileLayer=new PIXI.Container();
      app.stage.addChild(particleLayer);
      app.stage.addChild(projectileLayer);
      rebuildTextures();

      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;contextLossCount++;lastFailure='WebGL context lost';hideUnused(projectileSprites,0);hideUnused(particleSprites,0);canvas.style.display='none';setRendererState('context-lost');});
      canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;contextRestoreCount++;lastFailure='';firstGpuFrame=false;firstProjectileSpriteSeen=false;projectileWarmupDeadline=0;rebuildTextures();app.renderer.resize(window.innerWidth,window.innerHeight);app.start();setRendererState('warming-up');if(canvasReady())canvas.style.display='block';});
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
  function drawMinimalAlliedProjectiles(){
    for(const p of state.entities.projectiles){
      if(!p||p.life<=0)continue;
      const x=p.x-player.x+vw/2,y=p.y-player.y+vh/2;
      if(x<-50||x>vw+50||y<-50||y>vh+50)continue;
      const speed=Math.hypot(p.vx||0,p.vy||0)||1,nx=(p.vx||0)/speed,ny=(p.vy||0)/speed,r=Math.max(2,Number(p.r)||4);
      ctx.strokeStyle=typeof p.color==='string'?p.color:'#fff';ctx.lineWidth=Math.max(1.5,r*.55);ctx.beginPath();ctx.moveTo(x-nx*r*3,y-ny*r*3);ctx.lineTo(x,y);ctx.stroke();
      ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(x,y,r*.72,0,TAU);ctx.fill();
    }
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
  drawProjectiles=function hybridProjectileDraw(){
    if(activeGpuProjectiles())return;
    if(sparklesEnabled())return canvasDrawProjectiles();
    drawMinimalAlliedProjectiles();
  };
  drawAlliedEffects=function hybridAlliedEffectDraw(){if(activeGpuProjectiles()||!sparklesEnabled())return;return canvasDrawAlliedEffects();};
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
    backend:rendererState==='active'?'PixiJS WebGL':'Canvas 2D',
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
    firstGpuFrame,
    firstProjectileSpriteSeen,
    projectileSprites:{pool:projectileSprites.length,visible:visibleProjectileSprites},
    particleSprites:{pool:particleSprites.length,visible:visibleParticleSprites},
    textures:{generation:textureGeneration,created:texturesCreated,destroyed:texturesDestroyed,live:[projectileTexture,solidTexture,particleTexture].filter(Boolean).length},
    projectileCount:countRenderableProjectiles(),
    hierarchy:['game-background','gpu-allied','combat-foreground','html-ui'],
    dpr,
    renderScale:Number(window.stackfallResolutionScale)||1,
    shake:{x:state.camera.shakeX||0,y:state.camera.shakeY||0,frame:state.renderFrame},
    baseCanvas:{width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight},
    foregroundCanvas:foregroundCanvas?{width:foregroundCanvas.width,height:foregroundCanvas.height,cssWidth:foregroundCanvas.clientWidth,cssHeight:foregroundCanvas.clientHeight,display:foregroundCanvas.style.display}:null,
    gpuCanvas:safeGpuCanvas()?{width:safeGpuCanvas().width,height:safeGpuCanvas().height,cssWidth:safeGpuCanvas().clientWidth,cssHeight:safeGpuCanvas().clientHeight,display:safeGpuCanvas().style.display}:null,
    lastFailure
  });
  setRendererState('loading');
  loadPixi();
})();
