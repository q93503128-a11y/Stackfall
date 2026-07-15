(function(){
  'use strict';

  const PIXI_VERSION='8.19.0';
  const PIXI_URL=`https://cdn.jsdelivr.net/npm/pixi.js@${PIXI_VERSION}/dist/pixi.min.js`;
  const PIXI_INTEGRITY='sha384-brfu63ZHzOfumoqQXzA4Wo7k9kQOaJ68C/E7+Uc8lgQB42dOOjA+urOyy/sOnKPq';

  const canvasDrawProjectiles=drawProjectiles;
  const canvasDrawEffects=drawEffects;
  const canvasDrawEnemies=drawEnemies;
  const canvasDrawStars=typeof drawStars==='function'?drawStars:null;
  const baseSpawnParticle=spawnParticle;
  const baseUpdateEffects=updateEffects;

  let app=null;
  let active=false;
  let initStarted=false;
  let contextLost=false;
  let projectileTexture=null;
  let solidTexture=null;
  let particleTexture=null;
  const projectileSprites=[];
  const particleSprites=[];
  let projectileLayer=null;
  let particleLayer=null;

  const sparklesEnabled=()=>GAME_SETTINGS.sparkles!==false;
  const shouldShowAlliedVisuals=()=>GAME_SETTINGS.hideProjectiles!==true&&state.mode!=='menu';

  function parseColor(value,fallback=0xffffff){
    if(typeof value!=='string')return fallback;
    const text=value.trim();
    if(/^#[0-9a-f]{6}$/i.test(text))return Number.parseInt(text.slice(1),16);
    if(/^#[0-9a-f]{3}$/i.test(text)){
      const [r,g,b]=text.slice(1).split('').map(v=>v+v);
      return Number.parseInt(`${r}${g}${b}`,16);
    }
    const rgb=text.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if(rgb)return(clamp(Number(rgb[1]),0,255)<<16)|(clamp(Number(rgb[2]),0,255)<<8)|clamp(Number(rgb[3]),0,255);
    return fallback;
  }

  function makeTexture(size,soft=true){
    const surface=document.createElement('canvas');
    surface.width=surface.height=size;
    const g=surface.getContext('2d');
    const c=size/2;
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

  function syncProjectileSprites(){
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
      sprite.alpha=sparklesEnabled()?(comet?.98:.90):.82;
      sprite.width=Math.max(radius*2.8,comet?radius*8.2:star?radius*5.2:radius*3.8+Math.min(22,speed*.018));
      sprite.height=Math.max(3.5,radius*(comet?3.5:star?3.0:2.5));
    }
    hideUnused(projectileSprites,used);
  }

  function syncParticleSprites(){
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
    hideUnused(particleSprites,used);
  }

  function syncGpuLayer(){
    try{
      syncParticleSprites();
      syncProjectileSprites();
      if(app?.canvas)app.canvas.style.display=state.mode==='menu'?'none':'block';
    }catch(error){
      disableGpuRenderer('frame update failed',error);
    }
  }

  function disableGpuRenderer(reason,error){
    if(!active&&!app)return;
    active=false;
    if(app?.canvas)app.canvas.style.display='none';
    hideUnused(projectileSprites,0);hideUnused(particleSprites,0);
    console.warn(`[Stackfall] PixiJS renderer disabled: ${reason}`,error||'');
  }

  async function initPixi(){
    if(initStarted||!window.PIXI?.Application)return;
    initStarted=true;
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
      if(!/WebGL/i.test(app.renderer?.constructor?.name||''))throw new Error('WebGL renderer unavailable');
      const canvas=app.canvas;
      canvas.id='gpuCombatLayer';
      Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',display:'block',pointerEvents:'none',touchAction:'none',zIndex:'1'});
      canvas.setAttribute('aria-hidden','true');
      const gameCanvas=document.querySelector('#game');
      gameCanvas.style.zIndex='0';
      gameCanvas.insertAdjacentElement('afterend',canvas);

      particleLayer=new PIXI.Container();
      projectileLayer=new PIXI.Container();
      app.stage.addChild(particleLayer);
      app.stage.addChild(projectileLayer);
      projectileTexture=makeTexture(64,true);
      solidTexture=makeTexture(48,false);
      particleTexture=makeTexture(40,true);

      canvas.addEventListener('webglcontextlost',event=>{
        event.preventDefault();contextLost=true;disableGpuRenderer('WebGL context lost');
      });
      canvas.addEventListener('webglcontextrestored',()=>{
        contextLost=false;active=true;canvas.style.display='block';
      });
      app.ticker.add(syncGpuLayer,undefined,PIXI.UPDATE_PRIORITY.HIGH);
      active=true;
      document.documentElement.dataset.stackfallRenderer='pixi-webgl';
    }catch(error){
      disableGpuRenderer('initialization failed',error);
      document.documentElement.dataset.stackfallRenderer='canvas2d';
    }
  }

  function loadPixi(){
    if(window.PIXI?.Application){initPixi();return;}
    const script=document.createElement('script');
    script.src=PIXI_URL;
    script.integrity=PIXI_INTEGRITY;
    script.crossOrigin='anonymous';
    script.async=true;
    script.dataset.stackfallPixi=PIXI_VERSION;
    script.addEventListener('load',initPixi,{once:true});
    script.addEventListener('error',()=>{document.documentElement.dataset.stackfallRenderer='canvas2d';console.warn('[Stackfall] PixiJS download failed; Canvas 2D fallback remains active.');},{once:true});
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

  drawProjectiles=function hybridProjectileDraw(){
    if(active)return;
    if(sparklesEnabled())return canvasDrawProjectiles();
    for(const p of state.entities.projectiles){
      if(!p||p.life<=0)continue;
      const x=p.x-player.x+vw/2,y=p.y-player.y+vh/2;
      if(x<-50||x>vw+50||y<-50||y>vh+50)continue;
      const speed=Math.hypot(p.vx||0,p.vy||0)||1,nx=(p.vx||0)/speed,ny=(p.vy||0)/speed,r=Math.max(2,Number(p.r)||4);
      ctx.strokeStyle=typeof p.color==='string'?p.color:'#fff';ctx.lineWidth=Math.max(1.5,r*.55);ctx.beginPath();ctx.moveTo(x-nx*r*3,y-ny*r*3);ctx.lineTo(x,y);ctx.stroke();
      ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(x,y,r*.72,0,TAU);ctx.fill();
    }
  };

  drawEffects=function hybridEffectDraw(){
    if(!active&&sparklesEnabled())return canvasDrawEffects();
    const particles=state.entities.particles;
    state.entities.particles=[];
    try{return canvasDrawEffects();}finally{state.entities.particles=particles;}
  };

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

  function drawStableTankOverlay(){
    for(const e of state.entities.enemies){
      if(!e||e.dead||e.type!=='tank')continue;
      const p=worldToScreen(e.x,e.y);
      if(p.x<-100||p.x>vw+100||p.y<-100||p.y>vh+100)continue;
      const r=e.r;
      ctx.save();ctx.translate(p.x,p.y);
      if(e.eventKind==='crash'){
        ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x));
        ctx.fillStyle=e.hit?'#fff':'#23131a';ctx.strokeStyle=e.hit?'#fff':'#ff9a62';ctx.lineWidth=2.6;
        ctx.beginPath();ctx.moveTo(r*1.28,0);ctx.lineTo(r*.42,-r*.82);ctx.lineTo(-r*.58,-r*.68);ctx.lineTo(-r*1.20,-r*.18);ctx.lineTo(-r*.92,0);ctx.lineTo(-r*1.20,r*.18);ctx.lineTo(-r*.58,r*.68);ctx.lineTo(r*.42,r*.82);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#ffd08f';ctx.fillRect(r*.04,-r*.17,r*.65,r*.34);ctx.strokeStyle='#ff5f52';ctx.beginPath();ctx.moveTo(-r*.52,-r*.36);ctx.lineTo(-r*.95,-r*.78);ctx.moveTo(-r*.52,r*.36);ctx.lineTo(-r*.95,r*.78);ctx.stroke();
      }else{
        ctx.rotate((e.phase||0)*.035);
        ctx.shadowBlur=sparklesEnabled()?14:0;ctx.shadowColor='#ff8a3d';
        ctx.fillStyle=e.hit?'#fff':'#241311';ctx.strokeStyle=e.hit?'#fff':'#ff9f43';ctx.lineWidth=2.8;
        ctx.beginPath();
        for(let i=0;i<12;i++){const a=i/12*TAU,rr=r*(i%2?.84:1.16)*(1+Math.sin(i*4.1)*.045),x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
        ctx.closePath();ctx.fill();ctx.stroke();
        for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*TAU/3+(e.phase||0)*.012);ctx.fillStyle=i%2?'#a94d26':'#d86c2f';ctx.beginPath();ctx.moveTo(r*.18,-r*.18);ctx.lineTo(r*.98,-r*.44);ctx.lineTo(r*.76,r*.06);ctx.lineTo(r*.20,r*.20);ctx.closePath();ctx.fill();ctx.restore();}
        const core=ctx.createRadialGradient(-r*.12,-r*.18,1,0,0,r*.44);core.addColorStop(0,'#fff0be');core.addColorStop(.30,'#ffb84e');core.addColorStop(1,'#50160f');ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,r*.42,0,TAU);ctx.fill();
        ctx.fillStyle='#17080a';ctx.beginPath();ctx.moveTo(-r*.20,-r*.10);ctx.lineTo(r*.28,0);ctx.lineTo(-r*.20,r*.10);ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }
  }

  drawEnemies=function stableEnemyIdentityDraw(){
    canvasDrawEnemies();
    drawStableTankOverlay();
  };

  window.stackfallRendererInfo=()=>({backend:active?'PixiJS WebGL':'Canvas 2D',version:active?PIXI_VERSION:null,fallback:!active});
  loadPixi();
})();