(function(){
  'use strict';

  const PIXI_VERSION='8.19.0';
  const PIXI_URL=`https://cdn.jsdelivr.net/npm/pixi.js@${PIXI_VERSION}/dist/pixi.min.js`;
  const PIXI_INTEGRITY='sha384-brfu63ZHzOfumoqQXzA4Wo7k9kQOaJ68C/E7+Uc8lgQB42dOOjA+urOyy/sOnKPq';

  const canvasDrawProjectiles=drawProjectiles;
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
  let firstProjectileSpriteSeen=false;
  let projectileWarmupDeadline=0;
  let initDeadline=performance.now()+3600;
  let visibleProjectileSprites=0;
  let visibleParticleSprites=0;
  let lastProjectileCount=0;
  let projectileTextures={};
  let solidTexture=null;
  let particleTexture=null;
  let emergencyRingTexture=null;
  let emergencyArrowTexture=null;
  let hostileTexture=null;
  let vignetteTexture=null;
  let textureGeneration=0;
  let texturesCreated=0;
  let texturesDestroyed=0;
  const projectileSprites=[];
  const particleSprites=[];
  const hostileSprites=[];
  const beamGlowSprites=[];
  const beamCoreSprites=[];
  let postVignetteSprite=null;
  let postFlashSprite=null;
  const emergencyEnemySprites=[];
  const emergencyHostileSprites=[];
  const emergencyCueSprites=[];
  const emergencyPlayerSprites=[];
  const emergencyGuidanceSprites=[];
  let projectileLayer=null;
  let particleLayer=null;
  let beamGlowLayer=null;
  let beamCoreLayer=null;
  let hostileLayer=null;
  let postLayer=null;
  let emergencyEnemyLayer=null;
  let emergencyHostileLayer=null;
  let emergencyCueLayer=null;
  let emergencyPlayerLayer=null;
  let emergencyGuidanceLayer=null;
  let tickerRegistered=false;
  let tickerRegistrationCount=0;
  let contextListenerRegistrationCount=0;
  const rendererGeneration=window.__stackfallRendererGeneration=(window.__stackfallRendererGeneration||0)+1;
  let foregroundCanvas=null;
  let foregroundCtx=null;
  let foregroundVignette=null;
  let foregroundVignetteKey='';
  let gpuCanvasReady=false;
  let gpuFrameRateCap=0;
  let emergencyEliteGuidance=0;
  let emergencyEventGuidance=0;
  let emergencyGuidanceBoundsValid=true;
  const warned=new Set();

  const sparklesEnabled=()=>GAME_SETTINGS.sparkles!==false;
  const shouldShowAlliedVisuals=()=>GAME_SETTINGS.hideProjectiles!==true&&state.mode!=='menu';

  function resizeForegroundCanvas(){}
  function resizeGpuCombatLayer(){if(!app?.renderer)return;const scale=clamp(Number(window.stackfallResolutionScale)||1,.30,1),pixels=Math.max(1,window.innerWidth*window.innerHeight),large=pixels>=1300000,cap=compactDevice()?1.15:large?1.15:1.40,areaScale=!compactDevice()&&large?.90:1,resolution=Math.max(.30,Math.min(window.devicePixelRatio||1,cap)*scale*areaScale);app.renderer.resize(window.innerWidth,window.innerHeight,resolution);const surface=safeGpuCanvas();if(surface){surface.style.width=`${window.innerWidth}px`;surface.style.height=`${window.innerHeight}px`;}}
  window.resizeForegroundCanvas=resizeForegroundCanvas;
  window.resizeGpuCombatLayer=resizeGpuCombatLayer;
  window.drawForegroundCombat=function drawForegroundCombat(){
    if(state.mode==='menu')return;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.save();ctx.translate(state.camera.shakeX||0,state.camera.shakeY||0);
    runDrawStage('drawTelegraphsForeground',drawTelegraphs);if(typeof drawMapEvents==='function')runDrawStage('drawMapEventsForeground',drawMapEvents);runDrawStage('drawEnemiesForeground',drawEnemies);if(typeof drawBeamEffects==='function')runDrawStage('drawBeamEffectsForeground',drawBeamEffects);runDrawStage('drawEnemyProjectilesForeground',drawEnemyProjectiles);runDrawStage('drawMagnetFieldForeground',drawMagnetField);runDrawStage('drawChronoFieldForeground',drawChronoField);runDrawStage('drawPlayerForeground',drawPlayer);runDrawStage('drawEffectsForeground',canvasDrawForegroundEffects);ctx.restore();ctx.setTransform(dpr,0,0,dpr,0,0);
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
  function makeRingTexture(size=96){
    const surface=document.createElement('canvas');surface.width=surface.height=size;const g=surface.getContext('2d'),c=size/2;g.strokeStyle='#fff';g.lineWidth=4;g.beginPath();g.arc(c,c,c-5,0,Math.PI*2);g.stroke();return PIXI.Texture.from(surface);
  }
  function makeArrowTexture(width=72,height=48){
    const surface=document.createElement('canvas');surface.width=width;surface.height=height;const g=surface.getContext('2d'),cy=height/2;g.fillStyle='#fff';g.shadowColor='#fff';g.shadowBlur=8;g.beginPath();g.moveTo(width-5,cy);g.lineTo(width*.40,5);g.lineTo(width*.48,cy-7);g.lineTo(6,cy-7);g.lineTo(6,cy+7);g.lineTo(width*.48,cy+7);g.lineTo(width*.40,height-5);g.closePath();g.fill();return PIXI.Texture.from(surface);
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
  function makeProjectileTexture(kind){
    const width=kind==='comet'?192:kind==='ember'?96:kind==='core'?104:kind==='shard'?84:72,height=kind==='comet'?72:72,surface=document.createElement('canvas');surface.width=width;surface.height=height;const g=surface.getContext('2d'),cx=width/2,cy=height/2;g.translate(cx,cy);g.fillStyle='#fff';g.strokeStyle='rgba(255,255,255,.86)';g.lineCap='round';g.lineJoin='round';
    if(kind==='comet'){const len=width*.45,h=height*.18,grad=g.createLinearGradient(-len,0,len,0);grad.addColorStop(0,'rgba(255,255,255,0)');grad.addColorStop(.3,'rgba(255,255,255,.42)');grad.addColorStop(.72,'#fff');g.fillStyle=grad;g.beginPath();g.moveTo(-len,-h*.18);g.lineTo(len*.18,-h*.32);g.lineTo(len*.56,-h);g.lineTo(len,0);g.lineTo(len*.56,h);g.lineTo(len*.18,h*.32);g.lineTo(-len,h*.18);g.closePath();g.fill();g.lineWidth=2;g.beginPath();g.moveTo(-len*.58,0);g.lineTo(len*.78,0);g.stroke();}
    else if(kind==='ember'){g.rotate(Math.PI/12);g.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=i%2?13:29,x=Math.cos(a)*r,y=Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();g.globalCompositeOperation='destination-out';g.beginPath();g.arc(0,0,7,0,Math.PI*2);g.fill();g.globalCompositeOperation='source-over';g.lineWidth=2;g.beginPath();g.arc(0,0,34,-.8,.9);g.stroke();}
    else if(kind==='core'){g.beginPath();g.moveTo(39,0);g.lineTo(0,-18);g.lineTo(-34,0);g.lineTo(0,18);g.closePath();g.fill();g.lineWidth=2;g.beginPath();g.moveTo(-46,0);g.lineTo(46,0);g.moveTo(0,-27);g.lineTo(0,27);g.stroke();}
    else if(kind==='shard'){g.beginPath();g.moveTo(34,0);g.lineTo(-8,-15);g.lineTo(-30,0);g.lineTo(-8,15);g.closePath();g.fill();}
    else{const grad=g.createRadialGradient(0,0,0,0,0,30);grad.addColorStop(0,'#fff');grad.addColorStop(.36,'rgba(255,255,255,.94)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.beginPath();g.arc(0,0,30,0,Math.PI*2);g.fill();}
    return PIXI.Texture.from(surface);
  }
  function destroyTexture(texture){
    if(!texture||texture===PIXI.Texture.WHITE)return;
    try{texture.destroy(true);texturesDestroyed++;}catch(error){console.error('[Stackfall] texture cleanup failed',error);}
  }
  function rebuildTextures(){
    const safeTexture=PIXI.Texture.WHITE;for(const pool of[projectileSprites,particleSprites,hostileSprites,beamGlowSprites,beamCoreSprites,emergencyEnemySprites,emergencyHostileSprites,emergencyCueSprites,emergencyPlayerSprites,emergencyGuidanceSprites])for(const sprite of pool)if(sprite)sprite.texture=safeTexture;
    for(const texture of Object.values(projectileTextures))destroyTexture(texture);destroyTexture(solidTexture);destroyTexture(particleTexture);destroyTexture(emergencyRingTexture);destroyTexture(emergencyArrowTexture);destroyTexture(hostileTexture);destroyTexture(vignetteTexture);
    projectileTextures={generic:makeProjectileTexture('generic'),core:makeProjectileTexture('core'),ember:makeProjectileTexture('ember'),comet:makeProjectileTexture('comet'),shard:makeProjectileTexture('shard')};solidTexture=makeTexture(48,false);particleTexture=makeTexture(40,true);emergencyRingTexture=makeRingTexture();emergencyArrowTexture=makeArrowTexture();hostileTexture=makeHostileTexture();vignetteTexture=makeVignetteTexture();texturesCreated+=Object.keys(projectileTextures).length+6;textureGeneration++;
    for(const sprite of projectileSprites)if(sprite)sprite.texture=projectileTextures.generic;for(const sprite of particleSprites)if(sprite)sprite.texture=particleTexture;if(postVignetteSprite)postVignetteSprite.texture=vignetteTexture;
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
      const p=list[i];if(!p||p.life<=0||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
      const x=p.x-player.x+vw/2,y=p.y-player.y+vh/2;if(x<-64||x>vw+64||y<-64||y>vh+64)continue;
      const r=Math.max(2.4,Math.min(13,Number(p.r)||4)),sprite=ensureSprite(hostileSprites,used++,hostileLayer,hostileTexture||solidTexture);
      sprite.visible=true;sprite.x=Math.round(x);sprite.y=Math.round(y);sprite.rotation=Math.atan2(p.vy||0,p.vx||0);sprite.tint=parseColor(p.color,0xff6c91);sprite.alpha=.96;sprite.width=r*5.0;sprite.height=r*2.65;
    }
    hideUnused(hostileSprites,used);
  }
  function syncBeamSprites(){
    if(!app||contextLost||rendererState!=='active'){hideUnused(beamGlowSprites,0);hideUnused(beamCoreSprites,0);return;}
    let used=0;for(const beam of state.entities.beams||[]){
      if(!beam||beam.life<=0)continue;const x1=beam.x1-player.x+vw/2,y1=beam.y1-player.y+vh/2,x2=beam.x2-player.x+vw/2,y2=beam.y2-player.y+vh/2,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);if(!Number.isFinite(len)||len<.5)continue;
      const alpha=clamp(beam.life/Math.max(.001,beam.max||beam.life),0,1),angle=Math.atan2(dy,dx),cx=(x1+x2)/2,cy=(y1+y2)/2,color=parseColor(beam.color,0xffffff),width=Math.max(.7,Number(beam.width)||1);
      const glow=ensureSprite(beamGlowSprites,used,beamGlowLayer,solidTexture);glow.visible=true;glow.x=cx;glow.y=cy;glow.rotation=angle;glow.tint=color;glow.alpha=alpha*.20;glow.width=len;glow.height=width*6.4;
      const core=ensureSprite(beamCoreSprites,used,beamCoreLayer,solidTexture);core.visible=true;core.x=cx;core.y=cy;core.rotation=angle;core.tint=color;core.alpha=alpha*.94;core.width=len;core.height=width;
      used++;
    }hideUnused(beamGlowSprites,used);hideUnused(beamCoreSprites,used);
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
  function syncGpuFrameBudget(){if(!app?.ticker)return;const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,emergency=typeof stackfallEmergencyRendering==='function'&&stackfallEmergencyRendering(),cap=emergency||tier===2?24:tier===1?40:60;if(cap===gpuFrameRateCap)return;gpuFrameRateCap=cap;app.ticker.maxFPS=cap;}
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
  function projectileVisual(source){const s=String(source||'');if(s.includes('comet')&&!s.includes('fragment'))return{kind:'comet',texture:projectileTextures.comet,width:8.6,height:3.15,alpha:.98};if(s==='ember'||s==='echo-star')return{kind:'ember',texture:projectileTextures.ember,width:4.7,height:4.1,alpha:.96};if(s==='core'||s==='core-echo'||s==='core-nova')return{kind:'core',texture:projectileTextures.core,width:4.35,height:2.65,alpha:.93};if(s.includes('fragment')||s.includes('shard')||s.includes('lance')||s.includes('mirror'))return{kind:'shard',texture:projectileTextures.shard,width:4.4,height:2.45,alpha:.92};return{kind:'generic',texture:projectileTextures.generic||solidTexture,width:3.8,height:2.5,alpha:.90};}
  function syncProjectileSprites(){
    visibleProjectileSprites=0;if(!app||contextLost)return;const visible=shouldShowAlliedVisuals();if(!visible){hideUnused(projectileSprites,0);return;}const list=state.entities.projectiles||[],tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,visualLimit=tier===2?48:tier===1?96:Infinity;let used=0;
    for(let i=0;i<list.length&&used<visualLimit;i++){const p=list[i];if(!p||p.life<=0||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;const x=p.x-player.x+vw/2,y=p.y-player.y+vh/2;if(x<-150||x>vw+150||y<-150||y>vh+150)continue;const speed=Math.hypot(p.vx||0,p.vy||0),radius=Math.max(1.5,Math.min(24,Number(p.r)||4)),visual=projectileVisual(p.source),sprite=ensureSprite(projectileSprites,used++,projectileLayer,visual.texture||solidTexture);sprite.visible=true;sprite.x=Math.round(x);sprite.y=Math.round(y);sprite.rotation=Math.atan2(p.vy||0,p.vx||0);sprite.tint=parseColor(p.color,0xffffff);sprite.alpha=sparklesEnabled()?visual.alpha:Math.min(.9,visual.alpha);sprite.width=Math.max(4,radius*visual.width+(visual.kind==='generic'?Math.min(18,speed*.012):0));sprite.height=Math.max(3.5,radius*visual.height);}
    visibleProjectileSprites=used;if(used>0)firstProjectileSpriteSeen=true;hideUnused(projectileSprites,used);
  }
  function syncParticleSprites(){
    visibleParticleSprites=0;
    if(!app||contextLost)return;
    if(!sparklesEnabled()||GAME_SETTINGS.hideProjectiles===true||state.mode==='menu'){hideUnused(particleSprites,0);return;}
    const list=state.entities.particles||[];
    let used=0;
    const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,limit=Math.min(list.length,tier===2?24:tier===1?72:compactDevice()?120:220);
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
  function emergencyRenderingActive(){return!!(app&&!contextLost&&rendererState==='active'&&typeof stackfallEmergencyRendering==='function'&&stackfallEmergencyRendering());}
  window.stackfallCanUseSimplifiedGpuFrame=emergencyRenderingActive;
  window.stackfallGpuEmergencyAvailable=()=>!!(app&&!contextLost&&rendererState==='active');
  function syncEmergencySprites(){
    const active=emergencyRenderingActive();
    emergencyEliteGuidance=0;emergencyEventGuidance=0;emergencyGuidanceBoundsValid=true;
    if(!active){hideUnused(emergencyEnemySprites,0);hideUnused(emergencyHostileSprites,0);hideUnused(emergencyCueSprites,0);hideUnused(emergencyPlayerSprites,0);hideUnused(emergencyGuidanceSprites,0);return;}
    const bottomGap=compactDevice()?180:154,left=76,right=vw-76,top=82,bottom=vh-bottomGap,cx=vw/2,cy=vh/2;
    let guidanceUsed=0;
    const outsideGuidanceFrame=(x,y)=>x<=left||x>=right||y<=top||y>=bottom;
    const guide=(worldX,worldY,color,kind)=>{if(guidanceUsed>=16||!Number.isFinite(worldX)||!Number.isFinite(worldY))return;const dx=worldX-player.x,dy=worldY-player.y;if(Math.abs(dx)+Math.abs(dy)<.001)return;let scale=Infinity;if(dx>0)scale=Math.min(scale,(right-cx)/dx);else if(dx<0)scale=Math.min(scale,(left-cx)/dx);if(dy>0)scale=Math.min(scale,(bottom-cy)/dy);else if(dy<0)scale=Math.min(scale,(top-cy)/dy);if(!Number.isFinite(scale)||scale<=0)return;const x=clamp(cx+dx*scale,left,right),y=clamp(cy+dy*scale,top,bottom),sprite=ensureSprite(emergencyGuidanceSprites,guidanceUsed++,emergencyGuidanceLayer,emergencyArrowTexture);sprite.visible=true;sprite.x=Math.round(x);sprite.y=Math.round(y);sprite.width=42;sprite.height=28;sprite.tint=parseColor(color,0xffffff);sprite.rotation=Math.atan2(dy,dx);sprite.alpha=.96;emergencyGuidanceBoundsValid=emergencyGuidanceBoundsValid&&sprite.x>=left&&sprite.x<=right&&sprite.y>=top&&sprite.y<=bottom;if(kind==='event')emergencyEventGuidance++;else emergencyEliteGuidance++;};
    let enemyUsed=0;
    for(const enemy of state.entities.enemies||[]){
      if(!enemy||enemy.dead)continue;const x=enemy.x-player.x+vw/2,y=enemy.y-player.y+vh/2;if(!Number.isFinite(x)||!Number.isFinite(y))continue;const elite=enemy.type==='mini'||enemy.type==='boss';if(elite&&outsideGuidanceFrame(x,y))guide(enemy.x,enemy.y,enemy.kind==='apex'?'#fff0a8':enemy.kind==='void'||enemy.eventKind==='void'?'#c38cff':enemy.type==='mini'?'#8fdcff':'#ff78bd','elite');const r=Math.max(5,Math.min(68,Number(enemy.r)||13));if(enemyUsed>=140||x<-90||x>vw+90||y<-90||y>vh+90)continue;
      const sprite=ensureSprite(emergencyEnemySprites,enemyUsed++,emergencyEnemyLayer,solidTexture);sprite.visible=true;sprite.x=Math.round(x);sprite.y=Math.round(y);sprite.tint=parseColor(enemy.color,enemy.type==='boss'?0xff6ccf:0x8b79ff);sprite.alpha=enemy.hit>0?.98:.84;sprite.width=sprite.height=r*2;sprite.rotation=(Number(enemy.phase)||0)*.12;
    }
    hideUnused(emergencyEnemySprites,enemyUsed);
    let hostileUsed=0;
    for(const shot of state.entities.enemyProjectiles||[]){
      if(!shot||shot.life<=0||hostileUsed>=190)continue;const x=shot.x-player.x+vw/2,y=shot.y-player.y+vh/2,r=Math.max(2,Math.min(14,Number(shot.r)||4));if(x<-40||x>vw+40||y<-40||y>vh+40)continue;
      const sprite=ensureSprite(emergencyHostileSprites,hostileUsed++,emergencyHostileLayer,solidTexture);sprite.visible=true;sprite.x=Math.round(x);sprite.y=Math.round(y);sprite.tint=parseColor(shot.color,0xff4d91);sprite.alpha=.94;sprite.width=r*3.4;sprite.height=r*1.6;sprite.rotation=Math.atan2(shot.vy||0,shot.vx||0);
    }
    hideUnused(emergencyHostileSprites,hostileUsed);
    const hero=ensureSprite(emergencyPlayerSprites,0,emergencyPlayerLayer,projectileTextures.core||solidTexture);hero.visible=state.mode!=='menu';hero.x=Math.round(vw/2);hero.y=Math.round(vh/2);hero.tint=0xdffbff;hero.alpha=player.invuln>0&&Math.floor((state.time||0)*18)%2?.52:1;hero.width=46;hero.height=30;hero.rotation=Number(player.facingAngle)||0;hideUnused(emergencyPlayerSprites,1);
    let cueUsed=0;
    const cue=(texture,x,y,width,height,color,rotation=0,alpha=.68)=>{if(cueUsed>=96||!Number.isFinite(x)||!Number.isFinite(y))return;const sprite=ensureSprite(emergencyCueSprites,cueUsed++,emergencyCueLayer,texture);sprite.visible=true;sprite.x=Math.round(x-player.x+vw/2);sprite.y=Math.round(y-player.y+vh/2);sprite.width=Math.max(1,width);sprite.height=Math.max(1,height);sprite.tint=parseColor(color,0xffffff);sprite.rotation=rotation;sprite.alpha=alpha;};
    const arena=state.mapEventActive?.arena||state.apexArena;if(arena?.r)cue(emergencyRingTexture,arena.x,arena.y,arena.r*2,arena.r*2,state.mapEventActive?.dreadnought?'#ff9a62':'#b7c9ff',0,.56);
    for(const well of state.entities.wells||[])if(well?.life>0)cue(emergencyRingTexture,well.x,well.y,(well.r||40)*2,(well.r||40)*2,well.color||'#b792ff',0,.42);
    for(const mark of state.entities.telegraphs||[]){if(!mark||mark.life<=0)continue;if(mark.type==='circle')cue(emergencyRingTexture,mark.x,mark.y,(mark.r||24)*2,(mark.r||24)*2,mark.color||'#ff6c93',0,.82);else{const length=Math.max(1,mark.length||120),a=mark.a||0;cue(PIXI.Texture.WHITE,mark.x+Math.cos(a)*length/2,mark.y+Math.sin(a)*length/2,length,Math.max(2,mark.width||4),mark.color||'#ff6c93',a,.68);}}
    for(const beam of state.entities.beams||[]){if(!beam||beam.life<=0)continue;const length=Math.hypot(beam.x2-beam.x1,beam.y2-beam.y1),a=Math.atan2(beam.y2-beam.y1,beam.x2-beam.x1);cue(PIXI.Texture.WHITE,(beam.x1+beam.x2)/2,(beam.y1+beam.y2)/2,length,Math.max(1.5,beam.width||2),beam.color||'#ffffff',a,.88);}
    for(const marker of state.entities.mapEvents||[]){if(!marker||marker.consumed)continue;const color=marker.type==='crash'?'#ff9a62':marker.type==='void'?'#b792ff':'#77efff',x=marker.x-player.x+vw/2,y=marker.y-player.y+vh/2;if(!state.mapEventActive&&outsideGuidanceFrame(x,y))guide(marker.x,marker.y,color,'event');else cue(emergencyRingTexture,marker.x,marker.y,58,58,color,0,.86);}
    hideUnused(emergencyCueSprites,cueUsed);
    hideUnused(emergencyGuidanceSprites,guidanceUsed);
  }
  function evaluateReadiness(){
    if(!app||contextLost||!['warming-up','active'].includes(rendererState))return;
    const visualsEnabled=shouldShowAlliedVisuals();
    const renderable=visualsEnabled?countRenderableProjectiles():0;
    lastProjectileCount=countRenderableProjectiles();
    const baseReady=pixiLoaded&&webglReady&&canvasReady()&&tickerFrames>0&&firstGpuFrame;
    if(baseReady&&renderable===0){projectileWarmupDeadline=0;setRendererState('active');return;}
    if(!visualsEnabled){projectileWarmupDeadline=0;if(baseReady)setRendererState('active');return;}
    if(renderable>0&&!firstProjectileSpriteSeen&&!projectileWarmupDeadline)projectileWarmupDeadline=performance.now()+900;
    if(baseReady&&renderable>0&&visibleProjectileSprites>0){setRendererState('active');return;}
    if(rendererState==='active'&&renderable>0&&visibleProjectileSprites===0){setRendererState('warming-up');projectileWarmupDeadline=performance.now()+900;return;}
    if(!firstGpuFrame&&performance.now()>initDeadline){disableGpuRenderer('warm-up timed out');return;}
    if(renderable>0&&!firstProjectileSpriteSeen&&projectileWarmupDeadline&&performance.now()>projectileWarmupDeadline)disableGpuRenderer('projectile sprite warm-up timed out');
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
      syncProjectileSprites();
      syncBeamSprites();
      syncHostileProjectileSprites();
      syncPostEffects();
      syncEmergencySprites();
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
        resolution:(()=>{const pixels=Math.max(1,window.innerWidth*window.innerHeight),large=pixels>=1300000,cap=compactDevice()?1.15:large?1.15:1.40,areaScale=!compactDevice()&&large?.90:1;return Math.max(.30,Math.min(window.devicePixelRatio||1,cap)*clamp(Number(window.stackfallResolutionScale)||1,.30,1)*areaScale);})(),
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

      emergencyCueLayer=new PIXI.Container();
      emergencyEnemyLayer=new PIXI.Container();
      particleLayer=new PIXI.Container();
      projectileLayer=new PIXI.Container();
      beamGlowLayer=new PIXI.Container();
      beamCoreLayer=new PIXI.Container();
      hostileLayer=new PIXI.Container();
      postLayer=new PIXI.Container();
      emergencyHostileLayer=new PIXI.Container();
      emergencyPlayerLayer=new PIXI.Container();
      emergencyGuidanceLayer=new PIXI.Container();
      app.stage.addChild(emergencyCueLayer);
      app.stage.addChild(emergencyEnemyLayer);
      app.stage.addChild(particleLayer);
      app.stage.addChild(projectileLayer);
      app.stage.addChild(beamGlowLayer);
      app.stage.addChild(beamCoreLayer);
      app.stage.addChild(hostileLayer);
      app.stage.addChild(emergencyHostileLayer);
      app.stage.addChild(emergencyPlayerLayer);
      app.stage.addChild(emergencyGuidanceLayer);
      app.stage.addChild(postLayer);
      rebuildTextures();
      postVignetteSprite=new PIXI.Sprite(vignetteTexture);postVignetteSprite.anchor.set(.5);postLayer.addChild(postVignetteSprite);
      postFlashSprite=new PIXI.Sprite(PIXI.Texture.WHITE);postFlashSprite.anchor.set(.5);postFlashSprite.tint=0xe1f2ff;postLayer.addChild(postFlashSprite);
      for(let i=0;i<240;i++){ensureSprite(projectileSprites,i,projectileLayer,projectileTextures.generic);ensureSprite(particleSprites,i,particleLayer,particleTexture);}
      for(let i=0;i<16;i++)ensureSprite(emergencyGuidanceSprites,i,emergencyGuidanceLayer,emergencyArrowTexture);
      hideUnused(projectileSprites,0);hideUnused(particleSprites,0);hideUnused(emergencyGuidanceSprites,0);

      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;gpuCanvasReady=false;contextLossCount++;lastFailure='WebGL context lost';hideUnused(projectileSprites,0);hideUnused(particleSprites,0);canvas.style.display='none';setRendererState('context-lost');});
      canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;gpuCanvasReady=false;contextRestoreCount++;lastFailure='';firstGpuFrame=false;firstProjectileSpriteSeen=false;projectileWarmupDeadline=0;rebuildTextures();app.start();setRendererState('warming-up');resizeGpuCombatLayer();if(canvasReady(true))canvas.style.display='block';});
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
  drawAlliedEffects=function hybridAlliedEffectDraw(){
    if(activeGpuProjectiles()||!sparklesEnabled()){if(typeof drawPostRosterWeaponEntities==='function')drawPostRosterWeaponEntities();if(typeof window.stackfallDrawCometWindups==='function')window.stackfallDrawCometWindups();return;}
    return canvasDrawAlliedEffects();
  };
  drawEnemyProjectiles=function hybridEnemyProjectileDraw(){if(activeGpuProjectiles())return;return canvasDrawEnemyProjectiles();};
  if(canvasDrawBeamEffects)drawBeamEffects=function hybridBeamDraw(){if(activeGpuProjectiles())return;return canvasDrawBeamEffects();};
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
    firstProjectileSpriteSeen,
    projectileSprites:{pool:projectileSprites.length,visible:visibleProjectileSprites},
    particleSprites:{pool:particleSprites.length,visible:visibleParticleSprites},
    hostileSprites:{pool:hostileSprites.length,visible:hostileSprites.filter(sprite=>sprite?.visible).length},
    beamSprites:{glowPool:beamGlowSprites.length,corePool:beamCoreSprites.length,visible:beamCoreSprites.filter(sprite=>sprite?.visible).length},
    canvasLayers:{auxiliaryForeground:false},
    textures:{generation:textureGeneration,created:texturesCreated,destroyed:texturesDestroyed,live:Object.values(projectileTextures).filter(Boolean).length+[solidTexture,particleTexture,emergencyRingTexture,emergencyArrowTexture].filter(Boolean).length},
    emergencySimplified:emergencyRenderingActive(),
    emergencySprites:{enemies:emergencyEnemySprites.filter(sprite=>sprite.visible).length,hostile:emergencyHostileSprites.filter(sprite=>sprite.visible).length,cues:emergencyCueSprites.filter(sprite=>sprite.visible).length,player:emergencyPlayerSprites.filter(sprite=>sprite.visible).length,guidance:emergencyGuidanceSprites.filter(sprite=>sprite.visible).length},
    emergencyGuidance:{eliteArrows:emergencyEliteGuidance,eventArrows:emergencyEventGuidance,boundsValid:emergencyGuidanceBoundsValid,pool:emergencyGuidanceSprites.length},
    projectileVisuals:{generic:'orb',core:'diamond-pulse',ember:'explosive-sigil',comet:'crystal-lance',shard:'angular-shard'},
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
