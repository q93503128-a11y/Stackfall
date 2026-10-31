function updatePlayer(dt){
  player.stagePreviousX=player.x;player.stagePreviousY=player.y;
  let x=0,y=0;if(state.input.keys.has('KeyA')||state.input.keys.has('ArrowLeft'))x--;if(state.input.keys.has('KeyD')||state.input.keys.has('ArrowRight'))x++;if(state.input.keys.has('KeyW')||state.input.keys.has('ArrowUp'))y--;if(state.input.keys.has('KeyS')||state.input.keys.has('ArrowDown'))y++;x+=state.input.touchX;y+=state.input.touchY;const len=Math.hypot(x,y);if(len>0){x/=Math.max(1,len);y/=Math.max(1,len);}
  const navigation=1+(state.nebulaExtras?.navigation||0)*.08,speed=player.speed*(1+stat('speed')*.09)*navigation,targetVX=x*speed,targetVY=y*speed,response=1-Math.exp(-dt*14);player.moveVX=lerp(player.moveVX||0,targetVX,response);player.moveVY=lerp(player.moveVY||0,targetVY,response);player.moveIntensity=lerp(player.moveIntensity||0,len>0?clamp(speed/360,.28,1):0,1-Math.exp(-dt*(len>0?9:5)));if(len>.08)player.facingAngle=Math.atan2(y,x);player.x+=targetVX*dt;player.y+=targetVY*dt;player.invuln=Math.max(0,player.invuln-dt);player.hitPulse=Math.max(0,player.hitPulse-dt);
  window.updateEventBarrier?.(dt);
  if(typeof updateMapEventPlayer==='function')updateMapEventPlayer(dt);
}
function updateHomingProjectile(p,dt){
  if(!p.homingTargetId&&!p.homingReacquire)return;
  let target=p.homingTargetId?enemyById(p.homingTargetId):null;
  if(!target&&p.homingReacquire!==false){target=nearestEnemy(p.x,p.y);p.homingTargetId=target?.id||null;}
  if(!target)return;
  const speed=Math.max(1,Math.hypot(p.vx,p.vy)),current=Math.atan2(p.vy,p.vx),desired=Math.atan2(target.y-p.y,target.x-p.x);
  const delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current)),turn=Math.max(.1,Number(p.homingTurn)||6.4),next=current+clamp(delta,-turn*dt,turn*dt);
  p.vx=Math.cos(next)*speed;p.vy=Math.sin(next)*speed;
}
const PROJECTILE_TRAIL_SOURCES=new Set(['ember','echo-star','comet','echo-comet','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter']);
const PROJECTILE_SPAWN_FALLBACK_BUFFER=[],PROJECTILE_COLLISION_FALLBACK_BUFFER=[];
function updateProjectiles(dt){
  const spawned=PROJECTILE_SPAWN_FALLBACK_BUFFER,collisionCandidates=PROJECTILE_COLLISION_FALLBACK_BUFFER;spawned.length=0;collisionCandidates.length=0;
  for(const p of state.entities.projectiles){
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.life)){if(p)p.life=0;continue;}if(p.life<=0)continue;
    p.vx=Number.isFinite(p.vx)?p.vx:0;p.vy=Number.isFinite(p.vy)?p.vy:0;p.r=Number.isFinite(p.r)?Math.max(.5,p.r):3;p.damage=Number.isFinite(p.damage)?p.damage:0;p.source=String(p.source||'');
    if(p.spiralMotion){
      const lastX=p.x,lastY=p.y,originX=Number.isFinite(p.spiralOriginX)?p.spiralOriginX:p.originX,originY=Number.isFinite(p.spiralOriginY)?p.spiralOriginY:p.originY;
      p.spiralAngle=(Number(p.spiralAngle)||0)+(Number(p.spiralAngularSpeed)||0)*dt;p.spiralRadius=Math.max(0,(Number(p.spiralRadius)||0)+(Number(p.spiralRadialSpeed)||0)*dt);
      p.x=originX+Math.cos(p.spiralAngle)*p.spiralRadius;p.y=originY+Math.sin(p.spiralAngle)*p.spiralRadius;
      if(dt>1e-5){p.vx=(p.x-lastX)/dt;p.vy=(p.y-lastY)/dt;}
    }else{updateHomingProjectile(p,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;}
    p.life-=dt;p.trailTick=(p.trailTick||0)-dt;
    if(Number.isFinite(p.maxRange)){const ox=Number.isFinite(p.originX)?p.originX:player.x,oy=Number.isFinite(p.originY)?p.originY:player.y;if((p.x-ox)**2+(p.y-oy)**2>p.maxRange*p.maxRange)p.life=0;}
    if(p.life>0&&p.trailTick<=0&&PROJECTILE_TRAIL_SOURCES.has(p.source)){const cometTrail=p.source.includes('comet'),trailLife=cometTrail?.42:.25;p.trailTick=compactDevice()?.055:cometTrail?.024:.045;if(state.entities.particles.length<entityCap('particles')&&GAME_SETTINGS.hideProjectiles!==true)state.entities.particles.push(acquireParticleObject(p.x-p.vx*.018,p.y-p.vy*.018,rand(-12,12),rand(-12,12),trailLife,trailLife,cometTrail?rand(2,5):rand(1.2,3.2),p.color||COLORS.white,true));}
    const candidates=typeof performanceNearbyEnemies==='function'?performanceNearbyEnemies(p.x,p.y,p.r+150,collisionCandidates):state.entities.enemies;
    for(const e of candidates){
      if(p.life<=0||e.dead||p.hitIds?.has(e.id))continue;
      if(enemyCircleOverlap(e,p.x,p.y,p.r)){
        dealDamage(e,p.damage,{color:p.color,source:p.source});if(!p.hitIds)p.hitIds=new Set();p.hitIds.add(e.id);
        if(p.split){const splitAngle=Math.atan2(p.vy,p.vx);for(let i=0;i<3;i++){const a=splitAngle+(i-1)*.58;spawned.push(acquireProjectileSpawnDescriptor(p.x,p.y,Math.cos(a)*350,Math.sin(a)*350,3.2,.62,210,p.damage*.34,'#ffb3d0','star-spark'));}}
        if(p.fragment){const fragmentAngle=Math.atan2(p.vy,p.vx);for(let i=0;i<4;i++){const a=i/4*TAU+fragmentAngle;spawned.push(acquireProjectileSpawnDescriptor(p.x,p.y,Math.cos(a)*285,Math.sin(a)*285,3.5,.65,190,p.damage*.25,'#d9fbff','comet-fragment'));}}
        if(p.pierce>0)p.pierce--;else p.life=0;
      }
    }
    if(p.life<=0&&p.explode&&!p.exploded){p.exploded=true;areaDamage(p.x,p.y,115,22+weaponCount('comet')*4,COLORS.comet,'comet-burst');}
  }
  for(const p of spawned){spawnPlayerProjectile(p);recycleProjectileSpawnDescriptor(p);}spawned.length=0;compactInPlace(state.entities.projectiles,p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&((p.x-player.x)**2+(p.y-player.y)**2)<4410000);trimOldest(state.entities.projectiles,entityCap('playerProjectiles'));
}
function normalizeWell(w){if(!w||!Number.isFinite(w.x)||!Number.isFinite(w.y))return false;w.r=Number.isFinite(w.r)?clamp(w.r,24,320):120;w.life=Number.isFinite(w.life)?w.life:0;w.max=Number.isFinite(w.max)&&w.max>0?w.max:Math.max(.1,w.life);w.strength=Number.isFinite(w.strength)?clamp(w.strength,0,900):0;w.damage=Number.isFinite(w.damage)?Math.max(0,w.damage):0;w.tick=Number.isFinite(w.tick)?w.tick:0;w.color=typeof w.color==='string'?w.color:COLORS.violet;return w.life>0;}
function updateWells(dt){return updateWellBodies(dt);}
function updateWellBodies(dt){const wells=state.entities.wells;for(const w of wells){if(!normalizeWell(w)){if(w)w.life=0;continue;}w.life-=dt;w.tick-=dt;if(w.damage>0&&w.tick<=0){w.tick=.3;const hitRadius=w.r*.42;forEachNearbyEnemyCandidate(w.x,w.y,hitRadius+130,e=>{if(!e.dead&&enemyCircleOverlap(e,w.x,w.y,hitRadius))dealDamage(e,w.damage,{color:w.color,source:'well',canCrit:false});});}}compactInPlace(wells,w=>w&&w.life>0);}
function keepLiveGem(g){return experienceGemActive(g);}
function updateGems(dt){
  const range=Math.max(24,Number(magnetRange())||74),range2=range*range,magnetStacks=stat('magnet'),eventMagnet=state.nebulaBoosts?.magnet||0,pullSpeed=1+magnetStacks*.22+eventMagnet*.10,gems=state.entities.gems,drag=Math.pow(.04,dt),pickupRange=player.r+10;
  for(const g of gems){
    if(!experienceGemActive(g))continue;
    if(!Number.isFinite(g.x)||!Number.isFinite(g.y)){g.active=false;continue;}
    g.pulse=Number.isFinite(g.pulse)?g.pulse+dt*5:dt*5;g.vx=Number.isFinite(g.vx)?g.vx:0;g.vy=Number.isFinite(g.vy)?g.vy:0;g.r=Number.isFinite(g.r)?clamp(g.r,2,14):4;g.value=Number.isFinite(g.value)?Math.max(0,g.value):0;
    const dx=player.x-g.x,dy=player.y-g.y,d2=dx*dx+dy*dy;
    if(g.forceCollect===true){
      const d=Math.sqrt(d2)||1,targetSpeed=Math.min(8000,900+d*1.6),steer=1-Math.exp(-dt*11);g.vx=lerp(g.vx,dx/d*targetSpeed,steer);g.vy=lerp(g.vy,dy/d*targetSpeed,steer);
    }else{
      g.vx*=drag;g.vy*=drag;if(d2<range2){const d=Math.sqrt(d2)||1,force=(270+(range-d)*(7.5+magnetStacks*.55))*pullSpeed;g.vx+=dx/d*force*dt;g.vy+=dy/d*force*dt;}
    }
    g.x+=g.vx*dt;g.y+=g.vy*dt;
    const collectDx=player.x-g.x,collectDy=player.y-g.y;if(collectDx*collectDx+collectDy*collectDy<pickupRange*pickupRange){g.active=false;gainXp(g.value*xpMult());audio.pickup();spawnParticle(g.x,g.y,COLORS.cyan,3,70,2);}
  }
  compactInPlace(gems,keepLiveGem);compressExperience();
}
function tryLevelUp(){if(state.mode!=='playing'||state.choiceLocked||state.xp<state.xpNeed)return false;state.xp-=state.xpNeed;state.level++;state.xpNeed=levelXpRequirement(state.level);openChoices();return true;}
function gainXp(v){const amount=Number(v);if(!Number.isFinite(amount)||amount<=0)return;state.xp+=amount;tryLevelUp();}
function validEffectNumber(value){return typeof value==='number'&&Number.isFinite(value);}
function keepParticleEffect(p){return!!(p&&p.life>0&&validEffectNumber(p.x)&&validEffectNumber(p.y)&&validEffectNumber(p.max)&&p.max>0);}
function keepTextEffect(t){return!!(t&&t.life>0&&validEffectNumber(t.x)&&validEffectNumber(t.y)&&validEffectNumber(t.max)&&t.max>0);}
function keepShockwaveEffect(s){return!!(s&&s.life>0&&validEffectNumber(s.x)&&validEffectNumber(s.y)&&validEffectNumber(s.r)&&validEffectNumber(s.max)&&s.max>0);}
function keepBeamEffect(b){return!!(b&&b.life>0&&validEffectNumber(b.x1)&&validEffectNumber(b.y1)&&validEffectNumber(b.x2)&&validEffectNumber(b.y2)&&validEffectNumber(b.max)&&b.max>0);}
function updateEffects(dt){
  const particles=state.entities.particles,texts=state.entities.texts,shockwaves=state.entities.shockwaves,beams=state.entities.beams,particleDrag=Math.pow(.08,dt),shockwaveEase=1-Math.pow(.001,dt);
  for(const p of particles){if(!p||!validEffectNumber(p.x)||!validEffectNumber(p.y)||!validEffectNumber(p.vx)||!validEffectNumber(p.vy)||!validEffectNumber(p.life)||!validEffectNumber(p.max)||!validEffectNumber(p.size)||p.max<=0||p.size<0){if(p)p.life=0;continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=particleDrag;p.vy*=particleDrag;p.life-=dt;}
  compactInPlace(particles,keepParticleEffect,recycleParticleObject);
  for(const t of texts){if(!t||!validEffectNumber(t.x)||!validEffectNumber(t.y)||!validEffectNumber(t.vy)||!validEffectNumber(t.life)||!validEffectNumber(t.max)||!validEffectNumber(t.size)||t.max<=0||t.size<0){if(t)t.life=0;continue;}t.y+=t.vy*dt;t.life-=dt;}
  compactInPlace(texts,keepTextEffect,recycleTextEffect);
  for(const wave of shockwaves){if(!wave||!validEffectNumber(wave.x)||!validEffectNumber(wave.y)||!validEffectNumber(wave.r)||!validEffectNumber(wave.maxR)||!validEffectNumber(wave.life)||!validEffectNumber(wave.max)||!validEffectNumber(wave.width)||wave.max<=0||wave.maxR<0||wave.r<0||wave.width<0){if(wave)wave.life=0;continue;}wave.life-=dt;wave.r=lerp(wave.r,wave.maxR,shockwaveEase);}
  compactInPlace(shockwaves,keepShockwaveEffect,recycleShockwaveEffect);
  for(const beam of beams){if(!beam||!validEffectNumber(beam.x1)||!validEffectNumber(beam.y1)||!validEffectNumber(beam.x2)||!validEffectNumber(beam.y2)||!validEffectNumber(beam.life)||!validEffectNumber(beam.max)||!validEffectNumber(beam.width)||beam.max<=0||beam.width<0){if(beam)beam.life=0;continue;}beam.life-=dt;}
  compactInPlace(beams,keepBeamEffect,recycleBeamEffect);
  trimPooledEffects(particles,entityCap('particles'),recycleParticleObject);trimPooledEffects(texts,entityCap('texts'),recycleTextEffect);trimPooledEffects(shockwaves,entityCap('shockwaves'),recycleShockwaveEffect);trimOldest(state.entities.telegraphs,entityCap('telegraphs'));trimBeamEffects(beams,entityCap('beams'));state.camera.shake=Math.max(0,state.camera.shake-dt*36);state.flash=Math.max(0,state.flash-dt);
}
const BOOMERANG_NEARBY_BUFFER=[];
function boomerangEase(t){return t*t*(3-2*t);}
function validBoomerangPoint(point){return!!(point&&validEffectNumber(point.x)&&validEffectNumber(point.y));}
function validBoomerang(p){return!!(p&&(p.stage==='outbound'||p.stage==='return')&&validEffectNumber(p.x)&&validEffectNumber(p.y)&&validEffectNumber(p.lastX)&&validEffectNumber(p.lastY)&&validEffectNumber(p.stageTime)&&validEffectNumber(p.stageDuration)&&validEffectNumber(p.returnLife)&&validEffectNumber(p.r)&&validEffectNumber(p.damage)&&validEffectNumber(p.stacks)&&validEffectNumber(p.trailCd)&&p.stageDuration>0&&p.r>0&&validBoomerangPoint(p.start)&&validBoomerangPoint(p.control)&&validBoomerangPoint(p.targetPoint)&&p.hitIds instanceof Set&&Array.isArray(p.history)&&p.history.length>0);}
function startBoomerangReturn(p){if(p.stage==='return')return;p.stage='return';p.stageTime=0;p.returnLife=0;if(p.stacks>=4)p.hitIds.clear();p.historyStart=0;p.historyCount=0;}
function pushBoomerangHistory(p,limit){const history=p.history,capacity=history.length;if(!capacity)return;let index;if((p.historyCount||0)<limit){index=((p.historyStart||0)+(p.historyCount||0))%capacity;p.historyCount=(p.historyCount||0)+1;}else{index=p.historyStart||0;p.historyStart=(index+1)%capacity;}history[index].x=p.x;history[index].y=p.y;}
function boomerangCandidates(x,y,range){if(typeof performanceNearbyEnemies==='function')return performanceNearbyEnemies(x,y,range,BOOMERANG_NEARBY_BUFFER);return state.entities.enemies;}
function keepLiveBoomerang(p){return!!(p&&!p.dead);}
function updateBoomerangs(dt){
  const curves=state.entities.curves,stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
  for(const p of curves){if(!validBoomerang(p)||p.dead){if(p)p.dead=true;continue;}p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;if(p.stage==='outbound'){
      const live=enemyById(p.targetId);if(live&&Math.hypot(live.x-player.x,live.y-player.y)<=weaponRange('arc')*1.2){const base=Math.atan2(live.y-p.start.y,live.x-p.start.x),normalX=-Math.sin(base),normalY=Math.cos(base),desiredX=live.x+normalX*(p.lateral||0),desiredY=live.y+normalY*(p.lateral||0);p.targetPoint.x=lerp(p.targetPoint.x,desiredX,.22);p.targetPoint.y=lerp(p.targetPoint.y,desiredY,.22);const midX=(p.start.x+p.targetPoint.x)/2,midY=(p.start.y+p.targetPoint.y)/2,distance=Math.hypot(p.targetPoint.x-p.start.x,p.targetPoint.y-p.start.y),curve=(38+Math.min(70,distance*.09)+(p.stacks>=3?24:0))*(p.side||1);p.control.x=lerp(p.control.x,midX+normalX*curve,.18);p.control.y=lerp(p.control.y,midY+normalY*curve,.18);}
      const t=boomerangEase(clamp(p.stageTime/Math.max(.001,p.stageDuration),0,1)),u=1-t;p.x=u*u*p.start.x+2*u*t*p.control.x+t*t*p.targetPoint.x;p.y=u*u*p.start.y+2*u*t*p.control.y+t*t*p.targetPoint.y;let struck=false;const nearby=boomerangCandidates(p.x,p.y,p.r+80);for(let i=0;i<nearby.length&&!struck;i++){const e=nearby[i];if(!e||e.dead||p.hitIds.has(e.id))continue;if(enemyCircleOverlap(e,p.x,p.y,p.r)){p.hitIds.add(e.id);dealDamage(e,p.damage,{color:p.color,source:p.ricochet?'arc-ricochet':'arc'});struck=true;}}if(struck||t>=1||Math.hypot(p.x-player.x,p.y-player.y)>weaponRange('arc')*1.2)startBoomerangReturn(p);
    }else{p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d2=dx*dx+dy*dy,d=Math.sqrt(d2)||1,speed=780+p.stacks*38+(p.stacks>=4?100:0);p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);{const nearby=boomerangCandidates(p.x,p.y,p.r+80);for(let i=0;i<nearby.length;i++){const e=nearby[i];if(!e||e.dead||p.hitIds.has(e.id))continue;if(enemyCircleOverlap(e,p.x,p.y,p.r)){p.hitIds.add(e.id);dealDamage(e,p.damage*(p.returnDamageMult||1),{color:p.color,source:p.ricochet?'arc-ricochet-return':'arc-return'});}}}if(d2<(player.r+13)**2||p.returnLife>1.35)p.dead=true;}
    pushBoomerangHistory(p,stressed?7:14);p.trailCd-=dt;if(p.trailDamage&&p.trailCd<=0){p.trailCd=.18;const rr=20+p.stacks*2;{const nearby=boomerangCandidates(p.x,p.y,rr+72);for(let i=0;i<nearby.length;i++){const e=nearby[i];if(e&&!e.dead&&enemyCircleOverlap(e,p.x,p.y,rr))dealDamage(e,1.8+p.stacks*.65,{color:p.color,source:'arc-trail',canCrit:false});}}}
  }
  compactInPlace(curves,keepLiveBoomerang);trimOldest(curves,32);
}
function updateSpawning(dt){if(typeof updateApexSystems==='function'&&updateApexSystems(dt))return;if(typeof worldEventBlocksSpawning==='function'&&worldEventBlocksSpawning())return;if(window.stackfallEnemyDirectorV1?.updateSpawning?.(dt)===true)return;state.spawnTimer-=dt;const elapsed=Math.max(0,state.time||0),compact=compactDevice(),rate=Math.max(compact?.46:.38,1.58/(1+elapsed/130));if(state.spawnTimer<=0){state.spawnTimer=rate;const count=1+Math.min(compact?2:3,Math.floor(elapsed/120));for(let i=0;i<count;i++)spawnEnemy('normal');}if(typeof updateEncounterDirector==='function')updateEncounterDirector(dt);}
