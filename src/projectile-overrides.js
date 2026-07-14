updateEnemies=function updateEnemiesWithTemporalLock(dt){
  const gravWells=state.entities.wells,chronoN=weaponCount('chrono'),chronoRadius=145+chronoN*18;
  for(const e of state.entities.enemies){
    if(e.dead)continue;e.hit=Math.max(0,e.hit-dt);e.phase+=dt*3;bossSkill(e,dt);
    let dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1,speed=e.speed;
    if(chronoN&&d<chronoRadius)speed*=Math.max(.28,1-(.10+chronoN*.07));
    if((e.timeLock||0)>0){e.timeLock=Math.max(0,e.timeLock-dt);speed*=e.type==='boss'?.42:e.type==='mini'?.24:.08;}
    let vx=dx/d*speed,vy=dy/d*speed;const control=typeof enemyControlFactor==='function'?enemyControlFactor(e):1;
    for(const w of gravWells){const wx=w.x-e.x,wy=w.y-e.y,wd=Math.hypot(wx,wy)||1;if(wd<w.r){const force=(1-wd/w.r)*w.strength*control;vx+=wx/wd*force;vy+=wy/wd*force;}}
    if(e.dash>0){e.dash-=dt;vx+=e.dashX;vy+=e.dashY;}e.x+=vx*dt;e.y+=vy*dt;if(d<player.r+e.r+2&&player.invuln<=0)hurtPlayer(e.damage,e);
  }
  state.entities.enemies=state.entities.enemies.filter(e=>!e.dead);
};

updateProjectiles=function updateProjectilesWithStackEffects(dt){
  const spawned=[],particleCap=entityCap('particles');
  for(const p of state.entities.projectiles){
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.trailTick=(p.trailTick||0)-dt;const source=p.source||'';
    const trailSource=['ember','echo-star','comet','echo-comet','core','core-echo','star-spark','wave'].includes(source);
    if(p.trailTick<=0&&trailSource&&state.entities.particles.length<particleCap){p.trailTick=compactDevice()?.055:source.includes('comet')?.024:.042;state.entities.particles.push({x:p.x-p.vx*.018,y:p.y-p.vy*.018,vx:rand(-14,14),vy:rand(-14,14),life:source.includes('comet')?.42:.25,max:source.includes('comet')?.42:.25,size:source.includes('comet')?rand(2.2,5.2):rand(1.2,3.2),color:p.color,star:true});}
    if(p.trailDamage){p.trailDamageCd=(p.trailDamageCd||0)-dt;if(p.trailDamageCd<=0){p.trailDamageCd=.18;const rr=25+weaponCount('comet')*2;for(const e of state.entities.enemies)if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+rr)**2)dealDamage(e,3+weaponCount('comet')*1.2,{color:COLORS.comet,source:'comet-trail',canCrit:false});shockwave(p.x,p.y,'rgba(181,245,255,.55)',rr,.20,1.2);}}
    for(const e of state.entities.enemies){if(e.dead||p.hitIds?.has(e.id))continue;if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){dealDamage(e,p.damage,{color:p.color,source:p.source});if(!p.hitIds)p.hitIds=new Set();p.hitIds.add(e.id);if(p.split)for(let i=0;i<3;i++){const a=Math.atan2(p.vy,p.vx)+(i-1)*.58;spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*350,vy:Math.sin(a)*350,r:3.2,life:.62,damage:p.damage*.34,color:'#ffb3d0',pierce:0,source:'star-spark'});}if(p.fragment)for(let i=0;i<4;i++){const a=i/4*TAU+Math.atan2(p.vy,p.vx);spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*285,vy:Math.sin(a)*285,r:3.5,life:.65,damage:p.damage*.25,color:'#d9fbff',pierce:0,source:'comet-fragment'});}if(p.pierce>0)p.pierce--;else{p.life=0;break;}}}
    if(p.life<=0&&p.explode&&!p.exploded){p.exploded=true;areaDamage(p.x,p.y,125,24+weaponCount('comet')*4.5,COLORS.comet);}
    if(Math.hypot(p.x-player.x,p.y-player.y)>2100)p.life=0;
  }
  for(const p of spawned)spawnPlayerProjectile(p);state.entities.projectiles=state.entities.projectiles.filter(p=>p.life>0);trimOldest(state.entities.projectiles,entityCap('playerProjectiles'));
};

const baseUpdateEffects=updateEffects;
updateEffects=function updateEffectsWithBeams(dt){baseUpdateEffects(dt);for(const beam of state.entities.beams)beam.life-=dt;state.entities.beams=state.entities.beams.filter(beam=>beam.life>0);trimOldest(state.entities.beams,entityCap('beams'));};