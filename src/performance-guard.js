(function(){
  const CELL=144,grid=new Map(),lowPrioritySources=new Set(['star-spark','comet-fragment','arc-strong-shard','comet-afterimage']);
  const gridKey=(x,y)=>`${Math.floor(x/CELL)},${Math.floor(y/CELL)}`;
  function rebuildEnemyGrid(){
    grid.clear();
    for(const e of state.entities.enemies){if(!e||e.dead)continue;const key=gridKey(e.x,e.y),bucket=grid.get(key);if(bucket)bucket.push(e);else grid.set(key,[e]);}
  }
  function nearbyEnemies(x,y,range=96){
    const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),reach=Math.max(1,Math.ceil(range/CELL)),out=[];
    for(let yy=cy-reach;yy<=cy+reach;yy++)for(let xx=cx-reach;xx<=cx+reach;xx++){const bucket=grid.get(`${xx},${yy}`);if(bucket)out.push(...bucket);}
    return out;
  }
  window.performanceNearbyEnemies=nearbyEnemies;
  function pressureScore(){return state.entities.enemies.length+state.entities.projectiles.length*.34+state.entities.particles.length*.10+state.entities.beams.length*.16+(state.entities.curves?.length||0)*1.4;}
  function stressed(){return pressureScore()>(compactDevice()?135:205);}

  entityCap=function adaptiveEntityCap(kind){
    const compact=compactDevice(),heavy=stressed();
    const normal=compact?{enemies:72,gems:86,playerProjectiles:170,enemyProjectiles:235,particles:245,texts:48,shockwaves:58,telegraphs:44,beams:68}:{enemies:104,gems:132,playerProjectiles:280,enemyProjectiles:360,particles:360,texts:86,shockwaves:92,telegraphs:78,beams:105};
    const reduced=compact?{enemies:68,gems:76,playerProjectiles:135,enemyProjectiles:190,particles:175,texts:36,shockwaves:42,telegraphs:38,beams:50}:{enemies:96,gems:112,playerProjectiles:215,enemyProjectiles:290,particles:255,texts:60,shockwaves:66,telegraphs:64,beams:78};
    return(heavy?reduced:normal)[kind]||150;
  };

  const baseSpawnPlayerProjectile=spawnPlayerProjectile;
  spawnPlayerProjectile=function guardedProjectileSpawn(data){
    const source=String(data?.source||''),list=state.entities.projectiles,cap=entityCap('playerProjectiles');
    if(list.length>=cap){
      if(lowPrioritySources.has(source))return null;
      const disposable=list.findIndex(p=>lowPrioritySources.has(String(p.source||'')));
      if(disposable>=0)list.splice(disposable,1);else list.shift();
    }
    return baseSpawnPlayerProjectile(data);
  };
  const baseSpawnParticle=spawnParticle;
  spawnParticle=function guardedParticleSpawn(x,y,color,count=6,speed=120,size=3){
    const cap=entityCap('particles'),room=Math.max(0,cap-state.entities.particles.length);if(room<=0)return;
    const scale=stressed()?.48:1;return baseSpawnParticle(x,y,color,Math.min(room,Math.max(1,Math.ceil(count*scale))),speed,size);
  };

  updateProjectiles=function spatialProjectileUpdate(dt){
    rebuildEnemyGrid();
    const spawned=[],particleCap=entityCap('particles'),projectileCap=entityCap('playerProjectiles'),heavy=stressed();
    for(const p of state.entities.projectiles){
      if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.life)){if(p)p.life=0;continue;}if(p.life<=0)continue;
      p.vx=Number.isFinite(p.vx)?p.vx:0;p.vy=Number.isFinite(p.vy)?p.vy:0;p.r=Number.isFinite(p.r)?Math.max(.5,p.r):3;p.damage=Number.isFinite(p.damage)?p.damage:0;
      updateHomingProjectile(p,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.trailTick=(p.trailTick||0)-dt;const source=String(p.source||'');p.source=source;
      const cometTrail=source.includes('comet'),trailSource=cometTrail||['ember','echo-star','core','core-echo','star-spark','wave'].includes(source);
      if(p.trailTick<=0&&trailSource&&state.entities.particles.length<particleCap){p.trailTick=heavy?(cometTrail?.07:.10):(compactDevice()?.055:cometTrail?.027:.045);state.entities.particles.push({x:p.x-p.vx*.018,y:p.y-p.vy*.018,vx:rand(-14,14),vy:rand(-14,14),life:cometTrail?.38:.23,max:cometTrail?.38:.23,size:cometTrail?rand(2.0,4.6):rand(1.1,2.9),color:p.color||COLORS.white,star:true});}
      if(p.trailDamage){p.trailDamageCd=(p.trailDamageCd||0)-dt;if(p.trailDamageCd<=0){p.trailDamageCd=heavy?.25:.18;const rr=25+weaponCount('comet')*2;for(const e of nearbyEnemies(p.x,p.y,rr+72))if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+rr)**2)dealDamage(e,3+weaponCount('comet')*1.2,{color:COLORS.comet,source:'comet-trail',canCrit:false});if(!heavy)shockwave(p.x,p.y,'rgba(181,245,255,.55)',rr,.20,1.2);}}
      if(p.life>0){
        const candidates=nearbyEnemies(p.x,p.y,p.r+88);
        for(const e of candidates){
          if(e.dead||p.hitIds?.has(e.id))continue;
          if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){
            dealDamage(e,p.damage,{color:p.color,source});if(!p.hitIds)p.hitIds=new Set();p.hitIds.add(e.id);
            if(p.split&&(p.splitCount||0)<(heavy?1:2)&&spawned.length<48&&state.entities.projectiles.length+spawned.length<projectileCap){p.splitCount=(p.splitCount||0)+1;for(let i=0;i<3;i++){const a=Math.atan2(p.vy,p.vx)+(i-1)*.58;spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*350,vy:Math.sin(a)*350,r:3.2,life:.62,damage:p.damage*.34,color:'#ffb3d0',pierce:0,source:'star-spark'});}}
            if(p.fragment&&(p.fragmentCount||0)<(heavy?1:2)&&spawned.length<48&&state.entities.projectiles.length+spawned.length<projectileCap){p.fragmentCount=(p.fragmentCount||0)+1;for(let i=0;i<4;i++){const a=i/4*TAU+Math.atan2(p.vy,p.vx);spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*285,vy:Math.sin(a)*285,r:3.5,life:.65,damage:p.damage*.25,color:'#d9fbff',pierce:0,source:'comet-fragment'});}}
            if(p.pierce>0)p.pierce--;else{p.life=0;break;}
          }
        }
      }
      if(p.life<=0&&p.explode&&!p.exploded){p.exploded=true;areaDamage(p.x,p.y,125,24+weaponCount('comet')*4.5,COLORS.comet);}
      if(Math.hypot(p.x-player.x,p.y-player.y)>2100)p.life=0;
    }
    for(const p of spawned)spawnPlayerProjectile(p);
    state.entities.projectiles=state.entities.projectiles.filter(p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y));trimOldest(state.entities.projectiles,projectileCap);
  };

  updateWells=function spatialWellUpdate(dt){
    if(!grid.size)rebuildEnemyGrid();const valid=[];
    for(const w of state.entities.wells){if(!normalizeWell(w))continue;w.life-=dt;w.tick-=dt;if(w.damage>0&&w.tick<=0){w.tick=stressed()?.38:.30;const rr=w.r*.42;for(const e of nearbyEnemies(w.x,w.y,rr+78))if(!e.dead&&(e.x-w.x)**2+(e.y-w.y)**2<(rr+e.r)**2)dealDamage(e,w.damage,{color:w.color,source:'well',canCrit:false});}if(w.life>0)valid.push(w);}
    state.entities.wells=valid.slice(-12);
  };

  const quad=(a,b,c,t)=>{const u=1-t;return{x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};};
  const ease=t=>t*t*(3-2*t),enemyById=id=>state.entities.enemies.find(e=>e.id===id&&!e.dead)||null;
  function cubicPoint(a,b,c,d,t){const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};}
  sf2UpdateCurves=function spatialBoomerangUpdate(dt){
    const heavy=stressed();
    for(const p of state.entities.curves){
      if(p.dead)continue;p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;
      if(p.stage==='approach'){
        const live=enemyById(p.targetId);if(live){p.targetPoint.x=lerp(p.targetPoint.x,live.x,.10);p.targetPoint.y=lerp(p.targetPoint.y,live.y,.10);}
        const tt=ease(clamp(p.stageTime/p.stageDuration,0,1)),pos=cubicPoint(p.start,p.c1,p.c2,p.targetPoint,tt);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){const angle=Math.atan2(p.targetPoint.y-p.start.y,p.targetPoint.x-p.start.x),dir={x:Math.cos(angle),y:Math.sin(angle)},passDistance=Math.hypot(p.passPoint.x-p.targetPoint.x,p.passPoint.y-p.targetPoint.y);p.passPoint={x:p.targetPoint.x+dir.x*passDistance,y:p.targetPoint.y+dir.y*passDistance};p.stage='pass';p.stageTime=0;p.stageDuration=.20+Math.min(.09,p.stacks*.01);p.passStart={...p.targetPoint};p.passControl={x:lerp(p.targetPoint.x,p.passPoint.x,.54),y:lerp(p.targetPoint.y,p.passPoint.y,.54)};}
      }else if(p.stage==='pass'){
        const tt=ease(clamp(p.stageTime/p.stageDuration,0,1)),pos=quad(p.passStart,p.passControl,p.passPoint,tt);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){const outward=Math.atan2(p.passPoint.y-p.passStart.y,p.passPoint.x-p.passStart.x),dir={x:Math.cos(outward),y:Math.sin(outward)},normal={x:-dir.y,y:dir.x},side=Math.sign((p.turnPoint.x-p.passPoint.x)*normal.x+(p.turnPoint.y-p.passPoint.y)*normal.y)||1,passDistance=Math.hypot(p.passPoint.x-p.targetPoint.x,p.passPoint.y-p.targetPoint.y);p.turnPoint={x:p.targetPoint.x+dir.x*(passDistance+46+p.stacks*4),y:p.targetPoint.y+dir.y*(passDistance+46+p.stacks*4)};p.turnControl={x:p.passPoint.x+dir.x*32+normal.x*side*(148+p.stacks*14),y:p.passPoint.y+dir.y*32+normal.y*side*(148+p.stacks*14)};p.stage='turn';p.stageTime=0;p.stageDuration=.27+Math.min(.08,p.stacks*.012);p.turnStart={...p.passPoint};}
      }else if(p.stage==='turn'){
        const tt=ease(clamp(p.stageTime/p.stageDuration,0,1)),pos=quad(p.turnStart,p.turnControl,p.turnPoint,tt);p.x=pos.x;p.y=pos.y;if(p.stageTime>=p.stageDuration){p.stage='return';p.stageTime=0;p.returnLife=0;p.hitIds.clear();p.history.length=0;}
      }else{
        p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy)||1,speed=690+p.stacks*34+(p.returnSpeedBonus||0);p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);if(d<player.r+13||p.returnLife>1.8)p.dead=true;
      }
      p.history.push({x:p.x,y:p.y});if(p.history.length>(heavy?18:30))p.history.shift();p.trailCd-=dt;
      if(p.trailDamage&&p.trailCd<=0){p.trailCd=heavy?.18:.11;if(!heavy)state.entities.shockwaves.push({x:p.x,y:p.y,r:3,maxR:24+p.stacks*2,life:.20,max:.20,color:'rgba(105,255,224,.46)',width:1.2});const rr=22+p.stacks*2;for(const e of nearbyEnemies(p.x,p.y,rr+76))if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+rr)**2)dealDamage(e,2.2+p.stacks*.85,{color:p.color,source:'arc-trail',canCrit:false});}
      for(const e of nearbyEnemies(p.x,p.y,p.r+82)){if(e.dead||p.hitIds.has(e.id))continue;if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){p.hitIds.add(e.id);const returning=p.stage==='return';dealDamage(e,p.damage*(returning?(p.returnDamageMult||1):1),{color:p.color,source:returning?'arc-return':'arc'});if(!heavy)shockwave(p.x,p.y,p.color,36+p.stacks*3,.20,2);}}
      if(Math.random()<(heavy?.26:.62)&&state.entities.particles.length<entityCap('particles'))state.entities.particles.push({x:p.x,y:p.y,vx:rand(-18,18),vy:rand(-18,18),life:.26,max:.26,size:rand(1.4,3.2),color:p.color,star:true});
    }
    state.entities.curves=state.entities.curves.filter(p=>!p.dead).slice(-36);
  };

  const baseUpdateEffects=updateEffects;
  updateEffects=function updateEffectsWithBudget(dt){baseUpdateEffects(dt);trimOldest(state.entities.particles,entityCap('particles'));trimOldest(state.entities.shockwaves,entityCap('shockwaves'));trimOldest(state.entities.beams,entityCap('beams'));if(state.entities.curves?.length>36)state.entities.curves.splice(0,state.entities.curves.length-36);};
})();
