(function(){
  const CELL=160,grid=new Map(),lowPrioritySources=new Set(['star-spark','comet-fragment','arc-strong-shard','comet-afterimage','arc-shard']);
  const gridKey=(x,y)=>(x*73856093)^(y*19349663);
  let heavyFrame=false;
  function rebuildEnemyGrid(){
    grid.clear();
    for(const e of state.entities.enemies){if(!e||e.dead)continue;const cx=Math.floor(e.x/CELL),cy=Math.floor(e.y/CELL),key=gridKey(cx,cy),bucket=grid.get(key);if(bucket)bucket.push(e);else grid.set(key,[e]);}
  }
  function forEachNearbyEnemy(x,y,range,visit){
    const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),reach=Math.max(1,Math.ceil(range/CELL));
    for(let yy=cy-reach;yy<=cy+reach;yy++)for(let xx=cx-reach;xx<=cx+reach;xx++){const bucket=grid.get(gridKey(xx,yy));if(!bucket)continue;for(let i=0;i<bucket.length;i++)visit(bucket[i]);}
  }
  function pressureScore(){return state.entities.enemies.length+state.entities.projectiles.length*.34+state.entities.particles.length*.10+state.entities.beams.length*.16+(state.entities.curves?.length||0)*1.4;}
  function stressed(){return heavyFrame||pressureScore()>(compactDevice()?130:195);}
  function compactInPlace(list,keep){let write=0;for(let read=0;read<list.length;read++){const item=list[read];if(keep(item))list[write++]=item;}list.length=write;return list;}
  window.performanceNearbyEnemies=(x,y,range=96)=>{const out=[];forEachNearbyEnemy(x,y,range,e=>out.push(e));return out;};

  entityCap=function adaptiveEntityCap(kind){
    const compact=compactDevice(),heavy=stressed();
    const normal=compact?{enemies:72,gems:86,playerProjectiles:165,enemyProjectiles:225,particles:225,texts:46,shockwaves:52,telegraphs:44,beams:62}:{enemies:104,gems:128,playerProjectiles:260,enemyProjectiles:340,particles:320,texts:78,shockwaves:82,telegraphs:76,beams:94};
    const reduced=compact?{enemies:66,gems:72,playerProjectiles:120,enemyProjectiles:175,particles:145,texts:30,shockwaves:34,telegraphs:36,beams:42}:{enemies:94,gems:104,playerProjectiles:185,enemyProjectiles:255,particles:205,texts:50,shockwaves:54,telegraphs:60,beams:66};
    return(heavy?reduced:normal)[kind]||140;
  };

  const baseSpawnPlayerProjectile=spawnPlayerProjectile;
  spawnPlayerProjectile=function guardedProjectileSpawn(data){
    const source=String(data?.source||''),list=state.entities.projectiles,cap=entityCap('playerProjectiles');
    if(list.length>=cap){if(lowPrioritySources.has(source))return null;let disposable=-1;for(let i=0;i<list.length;i++)if(lowPrioritySources.has(String(list[i]?.source||''))){disposable=i;break;}if(disposable>=0)list.splice(disposable,1);else list.shift();}
    return baseSpawnPlayerProjectile(data);
  };
  const baseSpawnParticle=spawnParticle;
  spawnParticle=function guardedParticleSpawn(x,y,color,count=6,speed=120,size=3){const cap=entityCap('particles'),room=Math.max(0,cap-state.entities.particles.length);if(room<=0)return;const scale=stressed()?.38:1;return baseSpawnParticle(x,y,color,Math.min(room,Math.max(1,Math.ceil(count*scale))),speed,size);};

  updateProjectiles=function spatialProjectileUpdate(dt){
    rebuildEnemyGrid();heavyFrame=pressureScore()>(compactDevice()?130:195);
    const spawned=[],particleCap=entityCap('particles'),projectileCap=entityCap('playerProjectiles');
    for(let index=0;index<state.entities.projectiles.length;index++){
      const p=state.entities.projectiles[index];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.life)){if(p)p.life=0;continue;}if(p.life<=0)continue;
      p.vx=Number.isFinite(p.vx)?p.vx:0;p.vy=Number.isFinite(p.vy)?p.vy:0;p.r=Number.isFinite(p.r)?Math.max(.5,p.r):3;p.damage=Number.isFinite(p.damage)?p.damage:0;updateHomingProjectile(p,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.trailTick=(p.trailTick||0)-dt;
      const source=String(p.source||'');p.source=source;const cometTrail=source.includes('comet'),trailSource=cometTrail||['ember','echo-star','core','core-echo','star-spark','wave'].includes(source);
      if(p.trailTick<=0&&trailSource&&state.entities.particles.length<particleCap&&!heavyFrame){p.trailTick=compactDevice()?.065:cometTrail?.032:.050;state.entities.particles.push({x:p.x-p.vx*.018,y:p.y-p.vy*.018,vx:rand(-14,14),vy:rand(-14,14),life:cometTrail?.34:.22,max:cometTrail?.34:.22,size:cometTrail?rand(2,4.2):rand(1.1,2.7),color:p.color||COLORS.white,star:true});}
      if(p.trailDamage){p.trailDamageCd=(p.trailDamageCd||0)-dt;if(p.trailDamageCd<=0){p.trailDamageCd=heavyFrame?.30:.18;const rr=25+weaponCount('comet')*2,limit=(rr+78)*(rr+78);forEachNearbyEnemy(p.x,p.y,rr+78,e=>{if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<Math.min(limit,(e.r+rr)**2))dealDamage(e,3+weaponCount('comet')*1.2,{color:COLORS.comet,source:'comet-trail',canCrit:false});});if(!heavyFrame)shockwave(p.x,p.y,'rgba(181,245,255,.55)',rr,.20,1.2);}}
      if(p.life>0){
        forEachNearbyEnemy(p.x,p.y,p.r+88,e=>{if(p.life<=0||e.dead||p.hitIds?.has(e.id))return;if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){dealDamage(e,p.damage,{color:p.color,source});if(!p.hitIds)p.hitIds=new Set();p.hitIds.add(e.id);if(p.split&&(p.splitCount||0)<(heavyFrame?1:2)&&spawned.length<36&&state.entities.projectiles.length+spawned.length<projectileCap){p.splitCount=(p.splitCount||0)+1;for(let i=0;i<3;i++){const a=Math.atan2(p.vy,p.vx)+(i-1)*.58;spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*350,vy:Math.sin(a)*350,r:3.2,life:.62,damage:p.damage*.34,color:'#ffb3d0',pierce:0,source:'star-spark'});}}if(p.fragment&&(p.fragmentCount||0)<(heavyFrame?1:2)&&spawned.length<36&&state.entities.projectiles.length+spawned.length<projectileCap){p.fragmentCount=(p.fragmentCount||0)+1;for(let i=0;i<4;i++){const a=i/4*TAU+Math.atan2(p.vy,p.vx);spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*285,vy:Math.sin(a)*285,r:3.5,life:.65,damage:p.damage*.25,color:'#d9fbff',pierce:0,source:'comet-fragment'});}}if(p.pierce>0)p.pierce--;else p.life=0;}});
      }
      if(p.life<=0&&p.explode&&!p.exploded){p.exploded=true;areaDamage(p.x,p.y,125,24+weaponCount('comet')*4.5,COLORS.comet);}if((p.x-player.x)**2+(p.y-player.y)**2>4410000)p.life=0;
    }
    for(let i=0;i<spawned.length;i++)spawnPlayerProjectile(spawned[i]);compactInPlace(state.entities.projectiles,p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y));trimOldest(state.entities.projectiles,projectileCap);
  };

  updateWells=function spatialWellUpdate(dt){
    if(!grid.size)rebuildEnemyGrid();const list=state.entities.wells;
    for(let i=0;i<list.length;i++){const w=list[i];if(!normalizeWell(w)){w.life=0;continue;}w.life-=dt;w.tick-=dt;if(w.damage>0&&w.tick<=0){w.tick=stressed()?.40:.30;const rr=w.r*.42;forEachNearbyEnemy(w.x,w.y,rr+78,e=>{if(!e.dead&&(e.x-w.x)**2+(e.y-w.y)**2<(rr+e.r)**2)dealDamage(e,w.damage,{color:w.color,source:'well',canCrit:false});});}}
    compactInPlace(list,w=>w&&w.life>0&&Number.isFinite(w.x)&&Number.isFinite(w.y));if(list.length>12)list.splice(0,list.length-12);
  };

  const quad=(a,b,c,t)=>{const u=1-t;return{x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};};
  const ease=t=>t*t*(3-2*t),enemyById=id=>state.entities.enemies.find(e=>e.id===id&&!e.dead)||null;
  function startReturn(p){if(p.stage==='return')return;p.stage='return';p.stageTime=0;p.returnLife=0;if(p.stacks>=4)p.hitIds.clear();p.history.length=0;}
  sf2UpdateCurves=function naturalBoomerangUpdate(dt){
    heavyFrame=pressureScore()>(compactDevice()?130:195);if(!grid.size)rebuildEnemyGrid();
    const curves=state.entities.curves;
    for(let i=0;i<curves.length;i++){
      const p=curves[i];if(!p||p.dead)continue;p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;
      if(p.stage==='outbound'||p.stage==='approach'){
        const live=enemyById(p.targetId);if(live){const base=Math.atan2(live.y-p.start.y,live.x-p.start.x),normal={x:-Math.sin(base),y:Math.cos(base)},desired={x:live.x+normal.x*(p.lateral||0),y:live.y+normal.y*(p.lateral||0)};p.targetPoint.x=lerp(p.targetPoint.x,desired.x,.22);p.targetPoint.y=lerp(p.targetPoint.y,desired.y,.22);const mid={x:(p.start.x+p.targetPoint.x)/2,y:(p.start.y+p.targetPoint.y)/2},distance=Math.hypot(p.targetPoint.x-p.start.x,p.targetPoint.y-p.start.y),curve=(42+Math.min(78,distance*.10)+(p.stacks>=3?28:0))*(p.side||1);p.control={x:lerp(p.control?.x??mid.x,mid.x+normal.x*curve,.18),y:lerp(p.control?.y??mid.y,mid.y+normal.y*curve,.18)};}
        const t=ease(clamp(p.stageTime/Math.max(.001,p.stageDuration),0,1)),pos=quad(p.start,p.control||p.c1,p.targetPoint,t);p.x=pos.x;p.y=pos.y;
        let struck=false;forEachNearbyEnemy(p.x,p.y,p.r+82,e=>{if(struck||e.dead||p.hitIds.has(e.id))return;if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){p.hitIds.add(e.id);dealDamage(e,p.damage,{color:p.color,source:'arc'});if(!heavyFrame)shockwave(p.x,p.y,p.color,34+p.stacks*3,.18,2);struck=true;}});if(struck||t>=1)startReturn(p);
      }else{
        p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d2=dx*dx+dy*dy,d=Math.sqrt(d2)||1,speed=760+p.stacks*38+(p.stacks>=4?110:0);p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);
        forEachNearbyEnemy(p.x,p.y,p.r+82,e=>{if(e.dead||p.hitIds.has(e.id))return;if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){p.hitIds.add(e.id);dealDamage(e,p.damage*(p.returnDamageMult||1),{color:p.color,source:'arc-return'});if(!heavyFrame)shockwave(p.x,p.y,p.color,34+p.stacks*3,.18,2);}});if(d2<(player.r+13)**2||p.returnLife>1.45)p.dead=true;
      }
      p.history.push({x:p.x,y:p.y});if(p.history.length>(heavyFrame?12:22))p.history.shift();p.trailCd-=dt;if(p.trailDamage&&p.trailCd<=0){p.trailCd=heavyFrame?.23:.13;const rr=22+p.stacks*2;forEachNearbyEnemy(p.x,p.y,rr+76,e=>{if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+rr)**2)dealDamage(e,2.2+p.stacks*.85,{color:p.color,source:'arc-trail',canCrit:false});});if(!heavyFrame)state.entities.shockwaves.push({x:p.x,y:p.y,r:3,maxR:24+p.stacks*2,life:.18,max:.18,color:'rgba(105,255,224,.46)',width:1.2});}if(!heavyFrame&&Math.random()<.42&&state.entities.particles.length<entityCap('particles'))state.entities.particles.push({x:p.x,y:p.y,vx:rand(-16,16),vy:rand(-16,16),life:.24,max:.24,size:rand(1.3,2.8),color:p.color,star:true});
    }
    compactInPlace(curves,p=>p&&!p.dead);if(curves.length>32)curves.splice(0,curves.length-32);
  };

  const baseUpdateEffects=updateEffects;
  updateEffects=function updateEffectsWithBudget(dt){baseUpdateEffects(dt);trimOldest(state.entities.particles,entityCap('particles'));trimOldest(state.entities.shockwaves,entityCap('shockwaves'));trimOldest(state.entities.beams,entityCap('beams'));if(state.entities.curves?.length>32)state.entities.curves.splice(0,state.entities.curves.length-32);};
})();
