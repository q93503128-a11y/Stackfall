(function(){
  const CELL=160;
  const grid=new Map();
  const enemyIndex=new Map();
  const lowPrioritySources=new Set(['star-spark','comet-fragment','arc-strong-shard','comet-afterimage','arc-shard','drone-burst','spiral-bolt','echo-spiral','mirror-counter','core-nova']);
  const projectileSpriteCache=new Map();
  const enemySpriteCache=new Map();
  const projectilePool=window.stackfallProjectilePool=window.stackfallProjectilePool||[];
  let heavyFrame=false;
  let frameMs=16.7;
  let slowDebt=0;
  let performanceTier=0;
  let emergencyResolution=false;
  let resolutionDropTime=0;
  let resolutionRecoverTime=0;

  const gridKey=(x,y)=>(x*73856093)^(y*19349663);
  const roundPixel=value=>Math.round(value);
  function safeColor(value,fallback='#ffffff'){
    if(typeof value!=='string')return fallback;
    const text=value.trim();
    if(/^#[0-9a-f]{6}$/i.test(text))return text;
    if(/^#[0-9a-f]{3}$/i.test(text))return`#${text.slice(1).split('').map(v=>v+v).join('')}`;
    return CSS.supports?.('color',text)?text:fallback;
  }
  function colorAlpha(value,alpha='55'){
    const color=safeColor(value);
    return /^#[0-9a-f]{6}$/i.test(color)?`${color}${alpha}`:color;
  }

  function pressureScore(){
    return state.entities.enemies.length+state.entities.projectiles.length*.34+state.entities.enemyProjectiles.length*.20+state.entities.particles.length*.10+state.entities.beams.length*.22+(state.entities.curves?.length||0)*1.45;
  }
  function pressureTier(){
    const value=pressureScore(),compact=compactDevice();
    return value>(compact?190:285)?2:value>(compact?135:210)?1:0;
  }
  function tier(){return Math.max(performanceTier,pressureTier());}
  function applyEmergencyResolution(enabled){
    if(enabled===emergencyResolution)return;
    emergencyResolution=enabled;
    window.stackfallResolutionScale=enabled?.80:1;
    resize();
  }
  function syncResolution(dt){
    const shouldDrop=performanceTier===2&&frameMs>29;
    if(shouldDrop){
      resolutionDropTime+=dt;resolutionRecoverTime=0;
      if(resolutionDropTime>1.8)applyEmergencyResolution(true);
    }else if(emergencyResolution){
      resolutionDropTime=0;
      if(frameMs<18&&slowDebt<4)resolutionRecoverTime+=dt;else resolutionRecoverTime=0;
      if(resolutionRecoverTime>7){applyEmergencyResolution(false);resolutionRecoverTime=0;}
    }else{
      resolutionDropTime=0;resolutionRecoverTime=0;
    }
  }
  function observeFrame(dt){
    const ms=clamp((Number(dt)||.0167)*1000,4,50);
    frameMs=frameMs*.92+ms*.08;
    if(frameMs>27)slowDebt=Math.min(140,slowDebt+2.2);
    else if(frameMs>21)slowDebt=Math.min(140,slowDebt+.65);
    else slowDebt=Math.max(0,slowDebt-1.4);
    performanceTier=frameMs>33||slowDebt>82?2:frameMs>23.5||slowDebt>28?1:0;
    syncResolution(dt);
  }
  function stressed(){return tier()>0;}
  function rebuildEnemyGrid(){
    grid.clear();enemyIndex.clear();
    for(const e of state.entities.enemies){
      if(!e||e.dead)continue;
      enemyIndex.set(e.id,e);
      const cx=Math.floor(e.x/CELL),cy=Math.floor(e.y/CELL),key=gridKey(cx,cy),bucket=grid.get(key);
      if(bucket)bucket.push(e);else grid.set(key,[e]);
    }
  }
  function forEachNearbyEnemy(x,y,range,visit){
    const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),reach=Math.max(1,Math.ceil(range/CELL));
    for(let yy=cy-reach;yy<=cy+reach;yy++)for(let xx=cx-reach;xx<=cx+reach;xx++){
      const bucket=grid.get(gridKey(xx,yy));if(!bucket)continue;
      for(let i=0;i<bucket.length;i++)visit(bucket[i]);
    }
  }
  function compactInPlace(list,keep,onDiscard=null){
    let write=0;
    for(let read=0;read<list.length;read++){
      const item=list[read];
      if(keep(item))list[write++]=item;else onDiscard?.(item);
    }
    list.length=write;
    return list;
  }
  function getEnemyById(id){return enemyIndex.get(id)||null;}

  window.stackfallPerformanceStressed=stressed;
  window.stackfallPerformanceTier=()=>tier();
  window.performanceNearbyEnemies=(x,y,range=96)=>{
    if(!grid.size)rebuildEnemyGrid();
    const out=[];forEachNearbyEnemy(x,y,range,e=>out.push(e));return out;
  };

  entityCap=function adaptiveEntityCap(kind){
    const compact=compactDevice(),level=tier();
    const normal=compact?{enemies:58,gems:68,playerProjectiles:150,enemyProjectiles:180,particles:150,texts:30,shockwaves:34,telegraphs:38,beams:48}:{enemies:84,gems:96,playerProjectiles:230,enemyProjectiles:280,particles:240,texts:52,shockwaves:54,telegraphs:62,beams:78};
    const reduced=compact?{enemies:52,gems:58,playerProjectiles:118,enemyProjectiles:148,particles:105,texts:22,shockwaves:26,telegraphs:32,beams:36}:{enemies:74,gems:82,playerProjectiles:180,enemyProjectiles:226,particles:168,texts:36,shockwaves:42,telegraphs:50,beams:58};
    const critical=compact?{enemies:44,gems:48,playerProjectiles:88,enemyProjectiles:112,particles:70,texts:14,shockwaves:18,telegraphs:26,beams:24}:{enemies:64,gems:66,playerProjectiles:132,enemyProjectiles:170,particles:112,texts:24,shockwaves:30,telegraphs:42,beams:40};
    return(level===2?critical:level===1?reduced:normal)[kind]||100;
  };

  const baseSpawnPlayerProjectile=spawnPlayerProjectile;
  spawnPlayerProjectile=function guardedProjectileSpawn(data){
    const source=String(data?.source||''),list=state.entities.projectiles,cap=entityCap('playerProjectiles');
    if(list.length>=cap){
      if(lowPrioritySources.has(source))return null;
      let disposable=-1;
      for(let i=0;i<list.length;i++)if(lowPrioritySources.has(String(list[i]?.source||''))){disposable=i;break;}
      const removed=disposable>=0?list.splice(disposable,1)[0]:list.shift();
      if(removed&&projectilePool.length<320)projectilePool.push(removed);
    }
    return baseSpawnPlayerProjectile(data);
  };

  const baseSpawnParticle=spawnParticle;
  spawnParticle=function guardedParticleSpawn(x,y,color,count=6,speed=120,size=3){
    const cap=entityCap('particles'),room=Math.max(0,cap-state.entities.particles.length);if(room<=0)return;
    const level=tier(),scale=level===2?.20:level===1?.55:1,actual=Math.ceil(count*scale);if(actual<=0)return;
    return baseSpawnParticle(x,y,color,Math.min(room,Math.max(1,actual)),speed,size);
  };

  const baseAudioHit=audio.hit.bind(audio);let lastLightHit=0;
  audio.hit=function budgetedHit(strong=false){
    const now=performance.now();if(!strong&&stressed()&&now-lastLightHit<52)return;if(!strong)lastLightHit=now;return baseAudioHit(strong);
  };

  function makeSurface(width,height){
    const surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):document.createElement('canvas');
    surface.width=width;surface.height=height;return surface;
  }
  function trimCache(cache,max=192){
    if(cache.size<=max)return;
    const remove=cache.size-max;let count=0;
    for(const key of cache.keys()){cache.delete(key);if(++count>=remove)break;}
  }
  function projectileKind(p,enemy=false){
    if(enemy)return'enemy';
    const source=String(p.source||'');
    if(source.includes('comet'))return'comet';
    if(['ember','echo-star','core','core-echo','star-spark'].includes(source))return'star';
    return'orb';
  }
  function projectileSprite(p,enemy=false){
    const kind=projectileKind(p,enemy),radius=Math.max(2,Math.min(22,Math.round((p.r||4)*2)/2)),color=safeColor(p.color,enemy?'#ff6ccf':COLORS.white),key=`${kind}|${radius}|${color}`;
    let entry=projectileSpriteCache.get(key);if(entry)return entry;
    const trail=kind==='comet'?82:kind==='star'?42:enemy?32:28,pad=kind==='comet'?40:26,width=Math.ceil(trail+radius*4+pad*2),height=Math.ceil(radius*6+pad*2),surface=makeSurface(width,height),g=surface.getContext('2d'),cx=trail+pad+radius,cy=height/2;
    g.clearRect(0,0,width,height);g.lineCap='round';
    const trailGradient=g.createLinearGradient(pad,cy,cx,cy);trailGradient.addColorStop(0,'rgba(0,0,0,0)');trailGradient.addColorStop(.45,colorAlpha(color));trailGradient.addColorStop(1,color);g.strokeStyle=trailGradient;g.lineWidth=Math.max(2,radius*.8);g.beginPath();g.moveTo(pad,cy);g.lineTo(cx,cy);g.stroke();
    g.shadowColor=color;g.shadowBlur=kind==='comet'?28:enemy?16:18;
    if(kind==='comet'){
      const coma=g.createRadialGradient(cx,cy,0,cx,cy,radius*1.8);coma.addColorStop(0,'#ffffff');coma.addColorStop(.38,color);coma.addColorStop(1,'rgba(181,245,255,0)');g.fillStyle=coma;g.beginPath();g.arc(cx,cy,radius*1.8,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(cx+radius*.18,cy,radius*.62,0,TAU);g.fill();
    }else if(kind==='star'||kind==='enemy'){
      g.fillStyle=kind==='enemy'?color:'#ffffff';g.strokeStyle=color;g.lineWidth=kind==='enemy'?2:0;
      const points=kind==='enemy'?5:4,outer=radius*1.42,inner=radius*.42;g.beginPath();for(let i=0;i<points*2;i++){const a=i*Math.PI/points,r=i%2?inner:outer,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();if(kind==='enemy')g.stroke();
    }else{
      g.fillStyle=color;g.beginPath();g.arc(cx,cy,radius,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(cx-radius*.2,cy-radius*.25,Math.max(1,radius*.34),0,TAU);g.fill();
    }
    g.shadowBlur=0;entry={surface,anchorX:cx,anchorY:cy};projectileSpriteCache.set(key,entry);trimCache(projectileSpriteCache);return entry;
  }
  function drawSpriteRotated(entry,x,y,angle){
    ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(entry.surface,-entry.anchorX,-entry.anchorY);ctx.rotate(-angle);ctx.translate(-x,-y);
  }
  function drawCachedProjectiles(list,enemy=false){
    for(let i=0;i<list.length;i++){
      const p=list[i];if(!p||p.life<=0)continue;
      const sx=p.x-player.x+vw/2,sy=p.y-player.y+vh/2;if(sx<-120||sx>vw+120||sy<-120||sy>vh+120)continue;
      const entry=projectileSprite(p,enemy),angle=enemy?(p.phase||0):Math.atan2(p.vy||0,p.vx||0);drawSpriteRotated(entry,roundPixel(sx),roundPixel(sy),angle);
    }
  }

  function enemySprite(e){
    const phaseBucket=e.type==='grunt'?Math.floor(((e.phase||0)%TAU+TAU)%TAU/TAU*12):0,radius=Math.max(7,Math.min(28,Math.round(e.r||13))),color=safeColor(e.hit?'#ffffff':e.color,'#7769ff'),key=`${e.type}|${radius}|${color}|${phaseBucket}`;
    let entry=enemySpriteCache.get(key);if(entry)return entry;
    const pad=34,size=(radius+pad)*2,surface=makeSurface(size,size),g=surface.getContext('2d'),cx=size/2,cy=size/2;
    g.clearRect(0,0,size,size);g.translate(cx,cy);g.shadowColor=color;g.shadowBlur=13;g.fillStyle=color;g.strokeStyle=color;
    if(e.type==='fast'){
      const tail=g.createLinearGradient(-radius*3,0,radius,0);tail.addColorStop(0,'rgba(255,79,154,0)');tail.addColorStop(1,'rgba(255,79,154,.55)');g.fillStyle=tail;g.beginPath();g.moveTo(-radius*3,-3);g.lineTo(radius*.2,-5);g.lineTo(radius*.2,5);g.lineTo(-radius*3,3);g.fill();g.fillStyle=color;g.beginPath();g.moveTo(radius*1.55,0);g.lineTo(-radius*.75,radius*.78);g.lineTo(-radius*.22,0);g.lineTo(-radius*.75,-radius*.78);g.closePath();g.fill();
    }else if(e.type==='tank'){
      g.lineWidth=3.5;for(let ring=0;ring<2;ring++){g.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU,rr=radius-ring*7,x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();ring?g.fill():g.stroke();}
    }else if(e.type==='ranged'){
      const radial=g.createRadialGradient(-radius*.25,-radius*.25,1,0,0,radius);radial.addColorStop(0,'#e7fbff');radial.addColorStop(.45,color);radial.addColorStop(1,'#12345a');g.fillStyle=radial;g.beginPath();g.moveTo(radius*1.05,0);g.lineTo(0,-radius*.82);g.lineTo(-radius*.92,0);g.lineTo(0,radius*.82);g.closePath();g.fill();g.strokeStyle='rgba(210,248,255,.65)';g.lineWidth=1.2;g.stroke();
    }else{
      const orb=g.createRadialGradient(-radius*.3,-radius*.35,1,0,0,radius);orb.addColorStop(0,'#c7c0ff');orb.addColorStop(.45,color);orb.addColorStop(1,'#2b216b');g.fillStyle=orb;g.beginPath();g.arc(0,0,radius,0,TAU);g.fill();g.globalAlpha=.44;g.strokeStyle='#c4d2ff';g.lineWidth=1;g.beginPath();g.ellipse(0,0,radius*1.38,radius*.42,phaseBucket/12*TAU,0,TAU);g.stroke();for(let i=0;i<3;i++){const a=phaseBucket/12*TAU+i*TAU/3;g.fillStyle='#a6b8ff';g.beginPath();g.arc(Math.cos(a)*radius*1.22,Math.sin(a)*radius*.52,1.7,0,TAU);g.fill();}
    }
    g.globalAlpha=1;g.shadowBlur=0;g.fillStyle='rgba(2,4,15,.72)';g.beginPath();g.arc(0,0,Math.max(3,radius*.22),0,TAU);g.fill();entry={surface,anchorX:cx,anchorY:cy};enemySpriteCache.set(key,entry);trimCache(enemySpriteCache,160);return entry;
  }
  function drawCachedEnemies(){
    for(const e of state.entities.enemies){
      if(!e||e.dead)continue;const sx=e.x-player.x+vw/2,sy=e.y-player.y+vh/2,elite=e.type==='mini'||e.type==='boss';
      if(sx<-180||sx>vw+180||sy<-180||sy>vh+180){if(elite)drawEliteEdgeIndicator(sx,sy,e);continue;}
      if(elite){ctx.save();ctx.translate(sx,sy);const pulse=1+Math.sin(e.phase)*.05;ctx.scale(pulse,pulse);ctx.shadowBlur=e.kind==='apex'?58:e.type==='boss'?44:30;ctx.shadowColor=e.color;ctx.strokeStyle=e.hit?'#fff':e.color;ctx.fillStyle=e.hit?'#fff':e.color;drawEliteShape(e);ctx.restore();}
      else{
        const entry=enemySprite(e),angle=e.type==='fast'||e.type==='ranged'?Math.atan2(player.y-e.y,player.x-e.x):e.type==='tank'?(e.phase||0)*.08:0;drawSpriteRotated(entry,roundPixel(sx),roundPixel(sy),angle);
      }
      if(elite||e.hp<e.maxHp){const width=clamp(e.r*2.15,28,e.kind==='apex'?170:e.type==='boss'?132:92),barY=sy-e.r*1.28-17;ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(roundPixel(sx-width/2),roundPixel(barY),Math.ceil(width),5);ctx.fillStyle=e.color;ctx.fillRect(roundPixel(sx-width/2),roundPixel(barY),Math.ceil(width*clamp(e.hp/e.maxHp,0,1)),5);}
    }
  }
  function drawEliteEdgeIndicator(px,py,e){
    const cx=vw/2,cy=vh/2,dx=px-cx,dy=py-cy,margin=72,bottom=vh-150,scales=[];
    if(dx>0)scales.push((vw-margin-cx)/dx);else if(dx<0)scales.push((margin-cx)/dx);if(dy>0)scales.push((bottom-cy)/dy);else if(dy<0)scales.push((margin-cy)/dy);
    const scale=Math.min(...scales.filter(v=>v>0)),x=cx+dx*scale,y=cy+dy*scale,a=Math.atan2(dy,dx);ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=e.kind==='apex'?'#fff0a8':e.kind==='void'||e.eventKind==='void'?'#c38cff':e.type==='boss'?'#ff78bd':'#8fdcff';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-7);ctx.lineTo(-5,0);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.restore();
  }

  const fullDrawBackground=drawBackground,fullDrawEffects=drawEffects;
  function themeVisual(theme){if(theme==='void')return{base:'#070311',stars:['#d7c7ff','#8f65de','#65409d']};if(theme==='apex-chrono')return{base:'#031116',stars:['#e7ffff','#79ffe1','#6aa9c9']};if(theme==='apex-forge')return{base:'#140704',stars:['#fff3d1','#ffb04e','#ff6a3d']};if(theme==='apex-constellation')return{base:'#030716',stars:['#ffffff','#b7c9ff','#8b85ff']};return{base:'#02040d',stars:['#f6f8ff','#8fe9ff','#cdbfff']};}
  drawBackground=function optimizedBackground(){
    if(tier()<2||state.realmTransition)return fullDrawBackground();
    const visual=themeVisual(state.realmTheme||'space');ctx.fillStyle=visual.base;ctx.fillRect(0,0,vw,vh);if(typeof drawStars==='function')drawStars(visual.stars,.24);
  };
  drawProjectiles=function cachedPlayerProjectiles(){if(GAME_SETTINGS.hideProjectiles===true)return;drawCachedProjectiles(state.entities.projectiles,false);};
  drawEnemyProjectiles=function cachedEnemyProjectiles(){drawCachedProjectiles(state.entities.enemyProjectiles,true);};
  drawEnemies=function cachedEnemyRenderer(){drawCachedEnemies();};

  function minimalEffects(){
    for(const s of state.entities.shockwaves){if(!s||s.life<=0)continue;const x=s.x-player.x+vw/2,y=s.y-player.y+vh/2;ctx.globalAlpha=clamp(s.life/Math.max(.001,s.max||s.life),0,1);ctx.strokeStyle=s.color||COLORS.white;ctx.lineWidth=Math.min(4,s.width||2);ctx.beginPath();ctx.arc(roundPixel(x),roundPixel(y),s.r||0,0,TAU);ctx.stroke();}
    ctx.globalAlpha=1;
    if(GAME_SETTINGS.damageNumbers!==false){for(const text of state.entities.texts){if(!text||text.life<=0)continue;const x=text.x-player.x+vw/2,y=text.y-player.y+vh/2;ctx.globalAlpha=clamp(text.life/Math.max(.001,text.max||text.life),0,1);ctx.fillStyle=text.color||'#fff';ctx.font=`800 ${Math.max(10,Math.min(18,text.size||12))}px IBM Plex Sans KR,sans-serif`;ctx.textAlign='center';ctx.fillText(String(text.text??''),roundPixel(x),roundPixel(y));}}
    ctx.globalAlpha=1;
  }
  drawEffects=function optimizedEffects(){if(GAME_SETTINGS.hideProjectiles===true||tier()===2)return minimalEffects();return fullDrawEffects();};

  updateProjectiles=function spatialProjectileUpdate(dt){
    observeFrame(dt);rebuildEnemyGrid();heavyFrame=tier()>0;
    const spawned=[],particleCap=entityCap('particles'),projectileCap=entityCap('playerProjectiles');
    for(let index=0;index<state.entities.projectiles.length;index++){
      const p=state.entities.projectiles[index];
      if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.life)){if(p)p.life=0;continue;}
      if(p.life<=0)continue;
      p.vx=Number.isFinite(p.vx)?p.vx:0;p.vy=Number.isFinite(p.vy)?p.vy:0;p.r=Number.isFinite(p.r)?Math.max(.5,p.r):3;p.damage=Number.isFinite(p.damage)?p.damage:0;
      updateHomingProjectile(p,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.trailTick=(p.trailTick||0)-dt;
      if(Number.isFinite(p.maxRange)){const ox=Number.isFinite(p.originX)?p.originX:player.x,oy=Number.isFinite(p.originY)?p.originY:player.y;if((p.x-ox)**2+(p.y-oy)**2>p.maxRange*p.maxRange)p.life=0;}
      const source=String(p.source||'');p.source=source;const cometTrail=source.includes('comet'),trailSource=cometTrail||['ember','echo-star','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter'].includes(source);
      if(p.life>0&&p.trailTick<=0&&trailSource&&state.entities.particles.length<particleCap&&!heavyFrame&&GAME_SETTINGS.hideProjectiles!==true){p.trailTick=compactDevice()?.09:cometTrail?.052:.075;state.entities.particles.push({x:p.x-p.vx*.018,y:p.y-p.vy*.018,vx:rand(-10,10),vy:rand(-10,10),life:cometTrail?.26:.16,max:cometTrail?.26:.16,size:cometTrail?rand(1.8,3.2):rand(.9,2),color:p.color||COLORS.white,star:true});}
      if(p.life>0&&p.trailDamage){p.trailDamageCd=(p.trailDamageCd||0)-dt;if(p.trailDamageCd<=0){p.trailDamageCd=heavyFrame?.38:.24;const rr=24+weaponCount('comet')*2;forEachNearbyEnemy(p.x,p.y,rr+76,e=>{if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+rr)**2)dealDamage(e,2.6+weaponCount('comet')*.85,{color:COLORS.comet,source:'comet-trail',canCrit:false});});}}
      if(p.life>0)forEachNearbyEnemy(p.x,p.y,p.r+86,e=>{
        if(p.life<=0||e.dead||p.hitIds?.has(e.id))return;
        if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){
          dealDamage(e,p.damage,{color:p.color,source});if(!p.hitIds)p.hitIds=new Set();p.hitIds.add(e.id);
          if(p.split&&(p.splitCount||0)<(heavyFrame?1:2)&&spawned.length<(heavyFrame?10:24)){p.splitCount=(p.splitCount||0)+1;for(let i=0;i<3;i++){const a=Math.atan2(p.vy,p.vx)+(i-1)*.58;spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*350,vy:Math.sin(a)*350,r:3.1,life:.58,maxRange:210,damage:p.damage*.30,color:'#ffb3d0',pierce:0,source:'star-spark'});}}
          if(p.fragment&&(p.fragmentCount||0)<(heavyFrame?1:2)&&spawned.length<(heavyFrame?10:24)){p.fragmentCount=(p.fragmentCount||0)+1;for(let i=0;i<4;i++){const a=i/4*TAU+Math.atan2(p.vy,p.vx);spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*285,vy:Math.sin(a)*285,r:3.4,life:.60,maxRange:190,damage:p.damage*.22,color:'#d9fbff',pierce:0,source:'comet-fragment'});}}
          if(p.pierce>0)p.pierce--;else p.life=0;
        }
      });
      if(p.life<=0&&p.explode&&!p.exploded){p.exploded=true;areaDamage(p.x,p.y,118,20+weaponCount('comet')*3.8,COLORS.comet);}
      if((p.x-player.x)**2+(p.y-player.y)**2>4410000)p.life=0;
    }
    for(const projectile of spawned)spawnPlayerProjectile(projectile);
    compactInPlace(state.entities.projectiles,p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y),p=>{if(p&&projectilePool.length<320){p.hitIds?.clear?.();projectilePool.push(p);}});
    while(state.entities.projectiles.length>projectileCap){const removed=state.entities.projectiles.shift();if(removed&&projectilePool.length<320)projectilePool.push(removed);}
  };

  updateWells=function spatialWellUpdate(dt){
    if(!grid.size)rebuildEnemyGrid();const list=state.entities.wells;
    for(let i=0;i<list.length;i++){
      const w=list[i];if(!normalizeWell(w)){w.life=0;continue;}w.life-=dt;w.tick-=dt;
      if(w.damage>0&&w.tick<=0){w.tick=tier()===2?.46:tier()===1?.38:.32;const rr=w.r*.42;forEachNearbyEnemy(w.x,w.y,rr+78,e=>{if(!e.dead&&(e.x-w.x)**2+(e.y-w.y)**2<(rr+e.r)**2)dealDamage(e,w.damage,{color:w.color,source:'well',canCrit:false});});}
    }
    compactInPlace(list,w=>w&&w.life>0&&Number.isFinite(w.x)&&Number.isFinite(w.y));const maxWells=tier()===2?7:tier()===1?9:11;if(list.length>maxWells)list.splice(0,list.length-maxWells);
  };

  const quad=(a,b,c,t)=>{const u=1-t;return{x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};},ease=t=>t*t*(3-2*t);
  function startReturn(p){if(p.stage==='return')return;p.stage='return';p.stageTime=0;p.returnLife=0;if(p.stacks>=4)p.hitIds.clear();p.history.length=0;}
  sf2UpdateCurves=function naturalBoomerangUpdate(dt){
    heavyFrame=tier()>0;if(!grid.size)rebuildEnemyGrid();const curves=state.entities.curves;
    for(let i=0;i<curves.length;i++){
      const p=curves[i];if(!p||p.dead)continue;p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;
      if(p.stage==='outbound'||p.stage==='approach'){
        const live=getEnemyById(p.targetId);
        if(live&&Math.hypot(live.x-player.x,live.y-player.y)<=weaponRange('arc')*1.2){const base=Math.atan2(live.y-p.start.y,live.x-p.start.x),normal={x:-Math.sin(base),y:Math.cos(base)},desired={x:live.x+normal.x*(p.lateral||0),y:live.y+normal.y*(p.lateral||0)};p.targetPoint.x=lerp(p.targetPoint.x,desired.x,.22);p.targetPoint.y=lerp(p.targetPoint.y,desired.y,.22);const mid={x:(p.start.x+p.targetPoint.x)/2,y:(p.start.y+p.targetPoint.y)/2},distance=Math.hypot(p.targetPoint.x-p.start.x,p.targetPoint.y-p.start.y),curve=(38+Math.min(70,distance*.09)+(p.stacks>=3?24:0))*(p.side||1);p.control={x:lerp(p.control?.x??mid.x,mid.x+normal.x*curve,.18),y:lerp(p.control?.y??mid.y,mid.y+normal.y*curve,.18)};}
        const t=ease(clamp(p.stageTime/Math.max(.001,p.stageDuration),0,1)),pos=quad(p.start,p.control||p.c1,p.targetPoint,t);p.x=pos.x;p.y=pos.y;let struck=false;
        forEachNearbyEnemy(p.x,p.y,p.r+80,e=>{if(struck||e.dead||p.hitIds.has(e.id))return;if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){p.hitIds.add(e.id);dealDamage(e,p.damage,{color:p.color,source:'arc'});struck=true;}});
        if(struck||t>=1||Math.hypot(p.x-player.x,p.y-player.y)>weaponRange('arc')*1.2)startReturn(p);
      }else{
        p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d2=dx*dx+dy*dy,d=Math.sqrt(d2)||1,speed=780+p.stacks*38+(p.stacks>=4?100:0);p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);
        forEachNearbyEnemy(p.x,p.y,p.r+80,e=>{if(e.dead||p.hitIds.has(e.id))return;if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){p.hitIds.add(e.id);dealDamage(e,p.damage*(p.returnDamageMult||1),{color:p.color,source:'arc-return'});}});
        if(d2<(player.r+13)**2||p.returnLife>1.35)p.dead=true;
      }
      p.history.push({x:p.x,y:p.y});if(p.history.length>(heavyFrame?7:14))p.history.shift();p.trailCd-=dt;
      if(p.trailDamage&&p.trailCd<=0){p.trailCd=heavyFrame?.30:.18;const rr=20+p.stacks*2;forEachNearbyEnemy(p.x,p.y,rr+72,e=>{if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+rr)**2)dealDamage(e,1.8+p.stacks*.65,{color:p.color,source:'arc-trail',canCrit:false});});}
    }
    compactInPlace(curves,p=>p&&!p.dead);const maxCurves=tier()===2?16:tier()===1?23:32;if(curves.length>maxCurves)curves.splice(0,curves.length-maxCurves);
  };

  const baseUpdateEffects=updateEffects;
  updateEffects=function updateEffectsWithBudget(dt){
    baseUpdateEffects(dt);trimOldest(state.entities.particles,entityCap('particles'));trimOldest(state.entities.shockwaves,entityCap('shockwaves'));trimOldest(state.entities.beams,entityCap('beams'));const maxCurves=tier()===2?16:tier()===1?23:32;if(state.entities.curves?.length>maxCurves)state.entities.curves.splice(0,state.entities.curves.length-maxCurves);
  };

  const baseGravityLens=drawGravityLens;
  drawGravityLens=function drawBudgetedGravityLens(w,p,alpha,t){
    if(tier()<2)return baseGravityLens(w,p,alpha,t);
    const echoed=!!w.echoed||w.color===COLORS.pink,visual=Math.min(118,50+w.r*.25),horizon=Math.min(23,10+w.r*.052);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;ctx.rotate(-.17);ctx.strokeStyle=echoed?'#ff668f':'#ffb15d';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,0,visual*.68,visual*.14,0,0,TAU);ctx.stroke();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,horizon,0,TAU);ctx.fill();ctx.restore();
  };

  drawEquippedOrbits=function separatedEquipmentOrbits(x,y,t){
    const size=weaponSizeMultiplier(),level=tier(),bladeN=weaponCount('blade');
    if(bladeN){const count=bladeN>=5?3:bladeN>=2?2:1,orbit=orbitRadiusFor('blade');for(let i=0;i<count;i++){const a=player.angle+i*TAU/count,bx=x+Math.cos(a)*orbit,by=y+Math.sin(a)*orbit;ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);ctx.scale(size,size);ctx.shadowBlur=level===2?0:18;ctx.shadowColor=COLORS.cyan;ctx.fillStyle='#a7f5ff';ctx.beginPath();ctx.moveTo(-4,-28);ctx.bezierCurveTo(19,-12,17,14,-2,27);ctx.bezierCurveTo(7,10,3,-8,-4,-28);ctx.fill();ctx.restore();}}
    const bulwarkN=weaponCount('bulwark');if(bulwarkN){const count=Math.min(4,1+Math.floor((bulwarkN-1)/2)),orbit=orbitRadiusFor('bulwark');for(let i=0;i<count;i++){const a=-t*.00055+i*TAU/count;ctx.save();ctx.translate(x+Math.cos(a)*orbit,y+Math.sin(a)*orbit);ctx.rotate(a+Math.PI/2);ctx.strokeStyle='rgba(116,242,167,.82)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,5);ctx.lineTo(0,-8);ctx.lineTo(7,5);ctx.lineTo(0,9);ctx.closePath();ctx.stroke();ctx.restore();}}
    const prismN=weaponCount('prism');if(prismN){const count=prismN>=6?3:prismN>=2?2:1;for(const p of prismPositions(count)){const s=worldToScreen(p.x,p.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-p.a+t*.00057);ctx.scale(size,size);ctx.fillStyle='#d2c3ff';ctx.shadowBlur=level===2?0:15;ctx.shadowColor='#c2a7ff';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.restore();}}
    const droneN=weaponCount('drone');if(droneN){for(const pos of meteorDronePositions(droneN)){const s=worldToScreen(pos.x,pos.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(pos.a+Math.PI/2);ctx.fillStyle='#0b2630';ctx.strokeStyle='#baffea';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,6);ctx.lineTo(0,3);ctx.lineTo(-8,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}
  };

  if(PASSIVES.power){PASSIVES.power.desc='모든 피해 +10%.';if(PASSIVE_TEXT.power){PASSIVE_TEXT.power.ko=['출력 증폭',PASSIVES.power.desc];PASSIVE_TEXT.power.en=['Power Amplifier','All damage +10%.'];}}
  if(PASSIVES.greed){PASSIVES.greed.desc='적 체력 +10%, 경험치 획득량 +30%.';if(PASSIVE_TEXT.greed){PASSIVE_TEXT.greed.ko=['개척 계약',PASSIVES.greed.desc];PASSIVE_TEXT.greed.en=['Frontier Contract','Enemy health +10%, experience gained +30%.'];}}
  if(PASSIVES.wisdom){PASSIVES.wisdom.desc='경험치 획득량 +10%.';if(PASSIVE_TEXT.wisdom){PASSIVE_TEXT.wisdom.ko=['성운 통찰',PASSIVES.wisdom.desc];PASSIVE_TEXT.wisdom.en=['Nebula Insight','Experience gained +10%.'];}}
  if(PASSIVES.eliteHunter){PASSIVES.eliteHunter.desc='중간보스·보스 피해 +15%.';if(PASSIVE_TEXT.eliteHunter){PASSIVE_TEXT.eliteHunter.ko=['거성 사냥꾼',PASSIVES.eliteHunter.desc];PASSIVE_TEXT.eliteHunter.en=['Giant Hunter','Damage to mini-bosses and bosses +15%.'];}}

  enemyHpMult=function balancedEnemyHpMultiplier(){const minutes=Math.max(0,(state.time||0)/60),timeScale=1+(state.time||0)/390+Math.pow(minutes,1.25)*.035;return timeScale*(1+stat('greed')*.10);};
  xpMult=function balancedExperienceMultiplier(){return 1+stat('greed')*.30+stat('wisdom')*.10;};
})();

;(function(){
  const previousCooldownInfo=sf2CooldownInfo;
  sf2CooldownInfo=function completeCooldownInfo(key){
    const n=Math.max(1,weaponCount(key)),h=hasteMult();let remaining=0,max=1;
    if(key==='ion'){remaining=player.ionCd||0;max=(2.35-Math.min(.62,n*.07))*h;}
    else if(key==='nova'){remaining=player.novaCd||0;max=(4.9-Math.min(1.25,n*.16))*h;}
    else if(key==='drone'){remaining=player.droneCd||0;max=(1.62-Math.min(.42,n*.055))*(n>=5?.82:1)*h;}
    else if(key==='rail'){remaining=player.railCd||0;max=(4.15-Math.min(.92,n*.13))*h;}
    else if(key==='spiral'){remaining=player.spiralCd||0;max=(3.05-Math.min(.82,n*.11))*h;}
    else if(key==='mirror'){remaining=player.mirrorCd||0;max=(5.35-Math.min(1.35,n*.18))*h;}
    else if(key==='prism')return{ratio:0,remaining:0};
    else return previousCooldownInfo(key);
    return{ratio:clamp(remaining/Math.max(.001,max),0,1),remaining:Math.max(0,remaining)};
  };
})();
