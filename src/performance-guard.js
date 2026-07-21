(function(){
  const CELL=160;
  const grid=new Map();
  const enemyIndex=new Map();
  const gridBucketPool=[];
  const lowPrioritySources=new Set(['star-spark','comet-fragment','arc-strong-shard','comet-afterimage','arc-shard','drone-burst','spiral-bolt','echo-spiral','mirror-counter','core-nova']);
  const projectileSpriteCache=new Map();
  const enemySpriteCache=new Map();
  const gemSpriteCache=new Map();
  const projectilePool=window.stackfallProjectilePool=window.stackfallProjectilePool||[];
  let heavyFrame=false;
  let frameMs=16.7;
  let slowDebt=0;
  let performanceTier=0;
  let emergencyResolution=false;
  let resolutionDropTime=0;
  let resolutionRecoverTime=0;
  let lastObservedAt=performance.now();

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
  function tier(){return performanceTier;}
  function applyEmergencyResolution(enabled){
    if(enabled===emergencyResolution)return;
    emergencyResolution=enabled;
    const simplifiedGpu=enabled&&typeof stackfallGpuEmergencyAvailable==='function'&&stackfallGpuEmergencyAvailable();
    const nextScale=enabled&&!simplifiedGpu?.30:1,scaleChanged=(Number(window.stackfallResolutionScale)||1)!==nextScale;
    window.stackfallResolutionScale=nextScale;
    if(scaleChanged)resize();
  }
  function syncResolution(dt){
    const shouldDrop=frameMs>38&&slowDebt>=.4;
    if(shouldDrop){
      resolutionDropTime+=dt;resolutionRecoverTime=0;
      if(resolutionDropTime>.35)applyEmergencyResolution(true);
    }else if(emergencyResolution){
      resolutionDropTime=0;
      if(frameMs<23&&slowDebt<.7)resolutionRecoverTime+=dt;else resolutionRecoverTime=0;
      if(resolutionRecoverTime>5){applyEmergencyResolution(false);resolutionRecoverTime=0;}
    }else{
      resolutionDropTime=0;resolutionRecoverTime=0;
    }
  }
  function observeFrame(dt){
    const fallbackSeconds=clamp(Number(dt)||.0167,.004,.25),now=performance.now(),elapsed=now-lastObservedAt;lastObservedAt=now;
    const ms=elapsed>350?fallbackSeconds*1000:clamp(elapsed,4,200),seconds=clamp(ms/1000,.004,.20);
    frameMs=frameMs*.94+ms*.06;
    if(frameMs>42)slowDebt=Math.min(12,slowDebt+seconds*2.4);
    else if(frameMs>31)slowDebt=Math.min(12,slowDebt+seconds);
    else if(frameMs<24)slowDebt=Math.max(0,slowDebt-seconds*1.8);
    else slowDebt=Math.max(0,slowDebt-seconds*.45);
    performanceTier=slowDebt>=5.5?2:slowDebt>=2?1:0;
    syncResolution(seconds);
    const proactiveLimit=compactDevice()?140:180;
    if(!emergencyResolution&&pressureScore()>proactiveLimit)applyEmergencyResolution(true);
  }
  function stressed(){return tier()>0;}
  function rebuildEnemyGrid(){
    for(const bucket of grid.values()){bucket.length=0;if(gridBucketPool.length<192)gridBucketPool.push(bucket);}grid.clear();enemyIndex.clear();
    for(const e of state.entities.enemies){
      if(!e||e.dead)continue;
      enemyIndex.set(e.id,e);
      const cx=Math.floor(e.x/CELL),cy=Math.floor(e.y/CELL),key=gridKey(cx,cy),bucket=grid.get(key);
      if(bucket)bucket.push(e);else{const next=gridBucketPool.pop()||[];next.push(e);grid.set(key,next);}
    }
  }
  function forEachNearbyEnemy(x,y,range,visit){
    const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),reach=Math.max(1,Math.ceil(range/CELL));
    for(let yy=cy-reach;yy<=cy+reach;yy++)for(let xx=cx-reach;xx<=cx+reach;xx++){
      const bucket=grid.get(gridKey(xx,yy));if(!bucket)continue;
      for(let i=0;i<bucket.length;i++)visit(bucket[i]);
    }
  }
  function getEnemyById(id){if(!grid.size)rebuildEnemyGrid();const indexed=enemyIndex.get(id);if(indexed&&!indexed.dead)return indexed;for(const enemy of state.entities.enemies)if(enemy?.id===id&&!enemy.dead){enemyIndex.set(id,enemy);return enemy;}return null;}
  function nearestIndexedEnemies(x,y,count,excluded=null,maxRange=Infinity){
    if(!grid.size)rebuildEnemyGrid();
    const limit=Number.isFinite(maxRange)?maxRange*maxRange:Infinity,out=[],distances=[],visit=e=>{
      if(!e||e.dead||excluded?.has(e.id))return;const distance=(e.x-x)**2+(e.y-y)**2;if(distance>limit)return;
      let index=distances.length;while(index>0&&distances[index-1]>distance)index--;out.splice(index,0,e);distances.splice(index,0,distance);if(out.length>count){out.pop();distances.pop();}
    };
    if(Number.isFinite(maxRange))forEachNearbyEnemy(x,y,maxRange,visit);else for(const enemy of enemyIndex.values())visit(enemy);
    return out;
  }
  function nearestIndexedEnemy(x,y,maxRange=Infinity,predicate=null){
    if(!grid.size)rebuildEnemyGrid();let best=null,bestDistance=Number.isFinite(maxRange)?maxRange*maxRange:Infinity;
    const visit=e=>{if(!e||e.dead||(predicate&&!predicate(e)))return;const distance=(e.x-x)**2+(e.y-y)**2;if(distance<bestDistance){bestDistance=distance;best=e;}};
    if(Number.isFinite(maxRange))forEachNearbyEnemy(x,y,maxRange,visit);else for(const enemy of enemyIndex.values())visit(enemy);return best;
  }

  window.stackfallPerformanceStressed=stressed;
  window.stackfallPerformanceTier=()=>tier();
  window.stackfallEmergencyRendering=()=>emergencyResolution;
  window.stackfallPerformanceDiagnostics=()=>({tier:tier(),measuredTier:performanceTier,pressureTier:pressureTier(),pressureScore:pressureScore(),frameMs,slowDebt,emergencyResolution,resolutionScale:Number(window.stackfallResolutionScale)||1,gridBuckets:grid.size,pooledGridBuckets:gridBucketPool.length});
  window.rebuildEnemyIndex=rebuildEnemyGrid;
  window.getEnemyById=getEnemyById;
  window.performanceNearestEnemy=nearestIndexedEnemy;
  window.performanceNearestEnemies=nearestIndexedEnemies;
  window.performanceForEachNearbyEnemy=(x,y,range,visit)=>{if(!grid.size)rebuildEnemyGrid();forEachNearbyEnemy(x,y,range,visit);};
  window.performanceNearbyEnemies=(x,y,range=96,out=[])=>{
    if(!grid.size)rebuildEnemyGrid();
    out.length=0;forEachNearbyEnemy(x,y,range,e=>out.push(e));return out;
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
  audio.hit=function budgetedHit(strong=false,source=''){
    const now=performance.now();if(!strong&&stressed()&&now-lastLightHit<52)return;if(!strong)lastLightHit=now;return baseAudioHit(strong,source);
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
    if(enemy)return p.visual==='missile'?'missile':'enemy';
    const source=String(p.source||'');
    if(source.includes('comet'))return'comet';
    if(['ember','echo-star','core','core-echo','star-spark'].includes(source))return'star';
    return'orb';
  }
  function projectileSprite(p,enemy=false){
    const kind=projectileKind(p,enemy),radius=Math.max(2,Math.min(22,Math.round((p.r||4)*2)/2)),color=safeColor(p.color,enemy?'#ff6ccf':COLORS.white),key=`${kind}|${radius}|${color}`;
    let entry=projectileSpriteCache.get(key);if(entry)return entry;
    const trail=kind==='comet'?82:kind==='star'?42:kind==='missile'?34:enemy?14:28,pad=kind==='comet'?40:26,width=Math.ceil(trail+radius*4+pad*2),height=Math.ceil(radius*6+pad*2),surface=makeSurface(width,height),g=surface.getContext('2d'),cx=trail+pad+radius,cy=height/2;
    g.clearRect(0,0,width,height);g.lineCap='round';
    const trailGradient=g.createLinearGradient(pad,cy,cx,cy);trailGradient.addColorStop(0,'rgba(0,0,0,0)');trailGradient.addColorStop(.45,colorAlpha(color));trailGradient.addColorStop(1,color);g.strokeStyle=trailGradient;g.lineWidth=Math.max(2,radius*.8);g.beginPath();g.moveTo(pad,cy);g.lineTo(cx,cy);g.stroke();
    g.shadowColor=color;g.shadowBlur=kind==='comet'?28:enemy?7:18;
    if(kind==='comet'){
      const coma=g.createRadialGradient(cx,cy,0,cx,cy,radius*1.8);coma.addColorStop(0,'#ffffff');coma.addColorStop(.38,color);coma.addColorStop(1,'rgba(181,245,255,0)');g.fillStyle=coma;g.beginPath();g.arc(cx,cy,radius*1.8,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(cx+radius*.18,cy,radius*.62,0,TAU);g.fill();
    }else if(kind==='missile'){
      g.fillStyle='#ffdec4';g.strokeStyle=color;g.lineWidth=1.4;g.beginPath();g.moveTo(cx+radius*2.25,cy);g.lineTo(cx+radius*.58,cy-radius*.62);g.lineTo(cx-radius*1.08,cy-radius*.52);g.lineTo(cx-radius*.82,cy);g.lineTo(cx-radius*1.08,cy+radius*.52);g.lineTo(cx+radius*.58,cy+radius*.62);g.closePath();g.fill();g.stroke();g.fillStyle=color;g.beginPath();g.moveTo(cx-radius*.72,cy-radius*.34);g.lineTo(cx-radius*1.55,cy-radius*.92);g.lineTo(cx-radius*1.18,cy);g.lineTo(cx-radius*1.55,cy+radius*.92);g.lineTo(cx-radius*.72,cy+radius*.34);g.closePath();g.fill();g.fillStyle='#fff7bc';g.beginPath();g.moveTo(cx-radius*1.08,cy-radius*.24);g.lineTo(cx-radius*2.15,cy);g.lineTo(cx-radius*1.08,cy+radius*.24);g.closePath();g.fill();
    }else if(kind==='enemy'){
      g.fillStyle=color;g.strokeStyle='rgba(255,238,244,.72)';g.lineWidth=1.2;g.beginPath();g.moveTo(cx+radius*1.75,cy);g.quadraticCurveTo(cx+radius*.25,cy-radius*.62,cx-radius*.92,cy);g.quadraticCurveTo(cx+radius*.25,cy+radius*.62,cx+radius*1.75,cy);g.closePath();g.fill();g.stroke();g.fillStyle='rgba(255,255,255,.84)';g.beginPath();g.ellipse(cx+radius*.72,cy-radius*.12,Math.max(1,radius*.28),Math.max(.7,radius*.15),0,0,TAU);g.fill();
    }else if(kind==='star'){
      g.fillStyle='#ffffff';const points=4,outer=radius*1.42,inner=radius*.42;g.beginPath();for(let i=0;i<points*2;i++){const a=i*Math.PI/points,r=i%2?inner:outer,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();
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
      const entry=projectileSprite(p,enemy),angle=Math.atan2(p.vy||0,p.vx||0);drawSpriteRotated(entry,roundPixel(sx),roundPixel(sy),angle);
    }
  }

  function gemSprite(radius){const key=Math.max(2,Math.min(18,Math.round(radius*2)/2));let entry=gemSpriteCache.get(key);if(entry)return entry;const pad=12,size=Math.ceil((key+pad)*2),surface=makeSurface(size,size),g=surface.getContext('2d'),c=size/2;g.translate(c,c);g.shadowColor='#72e69a';g.shadowBlur=7;g.fillStyle='#72e69a';g.strokeStyle='#dfffe9';g.lineWidth=1.1;g.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,x=Math.cos(a)*key,y=Math.sin(a)*key;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();g.stroke();g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.86)';g.beginPath();g.arc(-key*.18,-key*.2,Math.max(.8,key*.2),0,TAU);g.fill();entry={surface,anchorX:c,anchorY:c};gemSpriteCache.set(key,entry);trimCache(gemSpriteCache,32);return entry;}
  drawGems=function cachedGemRenderer(){const list=state.entities.gems||[];for(let i=0;i<list.length;i++){const gem=list[i];if(!gem||gem.life<=0)continue;const sx=gem.x-player.x+vw/2,sy=gem.y-player.y+vh/2;if(sx<-32||sx>vw+32||sy<-32||sy>vh+32)continue;const entry=gemSprite(gem.r||4);ctx.drawImage(entry.surface,roundPixel(sx-entry.anchorX),roundPixel(sy-entry.anchorY));}};

  function enemySprite(e){
    const phaseBucket=e.type==='grunt'?Math.floor(((e.phase||0)%TAU+TAU)%TAU/TAU*12):0,radius=Math.max(7,Math.min(28,Math.round(e.r||13))),color=safeColor(e.hit?'#ffffff':e.color,'#7769ff'),key=`${e.type}|${e.eventKind||e.variant||'base'}|${radius}|${color}|${phaseBucket}`;
    let entry=enemySpriteCache.get(key);if(entry)return entry;
    const pad=34,size=(radius+pad)*2,surface=makeSurface(size,size),g=surface.getContext('2d'),cx=size/2,cy=size/2;
    g.clearRect(0,0,size,size);g.translate(cx,cy);g.shadowColor=color;g.shadowBlur=13;g.fillStyle=color;g.strokeStyle=color;
    if(e.type==='fast'){
      const tail=g.createLinearGradient(-radius*3,0,radius,0);tail.addColorStop(0,'rgba(255,79,154,0)');tail.addColorStop(1,'rgba(255,79,154,.55)');g.fillStyle=tail;g.beginPath();g.moveTo(-radius*3,-3);g.lineTo(radius*.2,-5);g.lineTo(radius*.2,5);g.lineTo(-radius*3,3);g.fill();g.fillStyle=color;g.beginPath();g.moveTo(radius*1.55,0);g.lineTo(-radius*.75,radius*.78);g.lineTo(-radius*.22,0);g.lineTo(-radius*.75,-radius*.78);g.closePath();g.fill();
    }else if(e.type==='tank'){
      drawTankBody(g,e,radius,false);
    }else if(e.type==='ranged'){
      const radial=g.createRadialGradient(-radius*.25,-radius*.25,1,0,0,radius);radial.addColorStop(0,'#e7fbff');radial.addColorStop(.45,color);radial.addColorStop(1,'#12345a');g.fillStyle=radial;g.beginPath();g.moveTo(radius*1.05,0);g.lineTo(0,-radius*.82);g.lineTo(-radius*.92,0);g.lineTo(0,radius*.82);g.closePath();g.fill();g.strokeStyle='rgba(210,248,255,.65)';g.lineWidth=1.2;g.stroke();
    }else{
      const orb=g.createRadialGradient(-radius*.3,-radius*.35,1,0,0,radius);orb.addColorStop(0,'#c7c0ff');orb.addColorStop(.45,color);orb.addColorStop(1,'#2b216b');g.fillStyle=orb;g.beginPath();g.arc(0,0,radius,0,TAU);g.fill();g.globalAlpha=.44;g.strokeStyle='#c4d2ff';g.lineWidth=1;g.beginPath();g.ellipse(0,0,radius*1.38,radius*.42,phaseBucket/12*TAU,0,TAU);g.stroke();for(let i=0;i<3;i++){const a=phaseBucket/12*TAU+i*TAU/3;g.fillStyle='#a6b8ff';g.beginPath();g.arc(Math.cos(a)*radius*1.22,Math.sin(a)*radius*.52,1.7,0,TAU);g.fill();}
    }
    if(e.type!=='tank'){g.globalAlpha=1;g.shadowBlur=0;g.fillStyle='rgba(2,4,15,.72)';g.beginPath();g.arc(0,0,Math.max(3,radius*.22),0,TAU);g.fill();}entry={surface,anchorX:cx,anchorY:cy};enemySpriteCache.set(key,entry);trimCache(enemySpriteCache,160);return entry;
  }
  function drawCachedEnemies(){
    for(const e of state.entities.enemies){
      if(!e||e.dead)continue;const sx=e.x-player.x+vw/2,sy=e.y-player.y+vh/2,elite=e.type==='mini'||e.type==='boss';
      if(sx<-180||sx>vw+180||sy<-180||sy>vh+180)continue;
      if(elite){ctx.save();ctx.translate(sx,sy);const pulse=1+Math.sin(e.phase)*.05;ctx.scale(pulse,pulse);ctx.shadowBlur=e.kind==='apex'?58:e.type==='boss'?44:30;ctx.shadowColor=e.color;ctx.strokeStyle=e.hit?'#fff':e.color;ctx.fillStyle=e.hit?'#fff':e.color;drawEliteShape(e);ctx.restore();}
      else{
        const entry=enemySprite(e),angle=e.type==='fast'||e.type==='ranged'||e.type==='tank'&&e.eventKind==='crash'?Math.atan2(player.y-e.y,player.x-e.x):e.type==='tank'?(e.phase||0)*.035:0;drawSpriteRotated(entry,roundPixel(sx),roundPixel(sy),angle);
      }
      if(!elite&&e.hp<e.maxHp){const width=clamp(e.r*2.15,28,e.kind==='apex'?170:e.type==='boss'?132:92),barY=sy-e.r*1.28-17;ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(roundPixel(sx-width/2),roundPixel(barY),Math.ceil(width),5);ctx.fillStyle=e.color;ctx.fillRect(roundPixel(sx-width/2),roundPixel(barY),Math.ceil(width*clamp(e.hp/e.maxHp,0,1)),5);}
    }
  }


  const fullDrawEffects=drawEffects,fullDrawEnemyProjectiles=drawEnemyProjectiles;
  // Realm backgrounds remain on the canonical renderer so performance-tier oscillation cannot swap maps mid-run.
  drawProjectiles=function cachedPlayerProjectiles(){if(GAME_SETTINGS.hideProjectiles===true)return;drawCachedProjectiles(state.entities.projectiles,false);};
  drawEnemyProjectiles=function cachedEnemyProjectiles(){drawCachedProjectiles(state.entities.enemyProjectiles,true);};
  drawEnemies=function cachedEnemyRenderer(){drawCachedEnemies();};

  function minimalEffects(){
    for(const s of state.entities.shockwaves){if(!s||s.life<=0)continue;const x=s.x-player.x+vw/2,y=s.y-player.y+vh/2;ctx.globalAlpha=clamp(s.life/Math.max(.001,s.max||s.life),0,1);ctx.strokeStyle=s.color||COLORS.white;ctx.lineWidth=Math.min(4,s.width||2);ctx.beginPath();ctx.arc(roundPixel(x),roundPixel(y),s.r||0,0,TAU);ctx.stroke();}
    ctx.globalAlpha=1;
    if(GAME_SETTINGS.damageNumbers!==false){for(const text of state.entities.texts){if(!text||text.life<=0)continue;const x=text.x-player.x+vw/2,y=text.y-player.y+vh/2;ctx.globalAlpha=clamp(text.life/Math.max(.001,text.max||text.life),0,1);ctx.fillStyle=text.color||'#fff';ctx.font=`800 ${Math.max(10,Math.min(18,text.size||12))}px IBM Plex Sans KR,sans-serif`;ctx.textAlign='center';ctx.fillText(String(text.text??''),roundPixel(x),roundPixel(y));}}
    ctx.globalAlpha=1;
  }
  drawEffects=function optimizedEffects(includeParticles=true){if(GAME_SETTINGS.hideProjectiles===true||tier()===2)return minimalEffects();return fullDrawEffects(includeParticles);};

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
      if(p.life>0&&p.trailDamage){p.trailDamageCd=(p.trailDamageCd||0)-dt;if(p.trailDamageCd<=0){p.trailDamageCd=.24;const rr=24+weaponCount('comet')*2;forEachNearbyEnemy(p.x,p.y,rr+76,e=>{if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+rr)**2)dealDamage(e,2.6+weaponCount('comet')*.85,{color:COLORS.comet,source:'comet-trail',canCrit:false});});}}
      if(p.life>0)forEachNearbyEnemy(p.x,p.y,p.r+86,e=>{
        if(p.life<=0||e.dead||p.hitIds?.has(e.id))return;
        if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){
          dealDamage(e,p.damage,{color:p.color,source});if(!p.hitIds)p.hitIds=new Set();p.hitIds.add(e.id);
          if(p.split&&(p.splitCount||0)<2&&spawned.length<24){p.splitCount=(p.splitCount||0)+1;for(let i=0;i<3;i++){const a=Math.atan2(p.vy,p.vx)+(i-1)*.58;spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*350,vy:Math.sin(a)*350,r:3.1,life:.58,maxRange:210,damage:p.damage*.30,color:'#ffb3d0',pierce:0,source:'star-spark'});}}
          if(p.fragment&&(p.fragmentCount||0)<2&&spawned.length<24){p.fragmentCount=(p.fragmentCount||0)+1;for(let i=0;i<4;i++){const a=i/4*TAU+Math.atan2(p.vy,p.vx);spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*285,vy:Math.sin(a)*285,r:3.4,life:.60,maxRange:190,damage:p.damage*.22,color:'#d9fbff',pierce:0,source:'comet-fragment'});}}
          if(p.pierce>0)p.pierce--;else p.life=0;
        }
      });
      if(p.life<=0&&p.explode&&!p.exploded){p.exploded=true;areaDamage(p.x,p.y,118,20+weaponCount('comet')*3.8,COLORS.comet,'comet-burst');}
      if((p.x-player.x)**2+(p.y-player.y)**2>4410000)p.life=0;
    }
    for(const projectile of spawned)spawnPlayerProjectile(projectile);
    compactInPlace(state.entities.projectiles,p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y),p=>{if(p&&projectilePool.length<320){p.hitIds?.clear?.();projectilePool.push(p);}});
    while(state.entities.projectiles.length>projectileCap){const removed=state.entities.projectiles.shift();if(removed&&projectilePool.length<320)projectilePool.push(removed);}
  };

  updateWells=function spatialWellUpdate(dt){
    if(!grid.size)rebuildEnemyGrid();const list=state.entities.wells;
    for(let i=0;i<list.length;i++){
      const w=list[i];if(!w||!normalizeWell(w)){if(w)w.life=0;continue;}w.life-=dt;w.tick-=dt;
      if(w.damage>0&&w.tick<=0){w.tick=.30;const rr=w.r*.42;forEachNearbyEnemy(w.x,w.y,rr+78,e=>{if(!e.dead&&(e.x-w.x)**2+(e.y-w.y)**2<(rr+e.r)**2)dealDamage(e,w.damage,{color:w.color,source:'well',canCrit:false});});}
    }
    compactInPlace(list,w=>w&&w.life>0&&Number.isFinite(w.x)&&Number.isFinite(w.y));const maxWells=tier()===2?7:tier()===1?9:11;if(list.length>maxWells)list.splice(0,list.length-maxWells);
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
