function updatePlayer(dt) {
  let x=0,y=0;
  if(state.input.keys.has('KeyA')||state.input.keys.has('ArrowLeft'))x--;
  if(state.input.keys.has('KeyD')||state.input.keys.has('ArrowRight'))x++;
  if(state.input.keys.has('KeyW')||state.input.keys.has('ArrowUp'))y--;
  if(state.input.keys.has('KeyS')||state.input.keys.has('ArrowDown'))y++;
  x+=state.input.touchX; y+=state.input.touchY;
  const len=Math.hypot(x,y);
  if(len>0){x/=Math.max(1,len);y/=Math.max(1,len);}
  const speed=player.speed*(1+stat('speed')*.07);
  player.x+=x*speed*dt; player.y+=y*speed*dt;
  player.invuln=Math.max(0,player.invuln-dt);
  player.hitPulse=Math.max(0,player.hitPulse-dt);
}

function updateProjectiles(dt) {
  const spawned=[];
  for(const p of state.entities.projectiles) {
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; p.trailTick-=dt;
    if(p.trailTick<=0 && ['ember','echo-star','comet','echo-comet','core','core-echo','prism','echo-prism'].includes(p.source)) {
      p.trailTick=p.source.includes('comet')?.018:.035;
      state.entities.particles.push({
        x:p.x-p.vx*.018,y:p.y-p.vy*.018,vx:rand(-12,12),vy:rand(-12,12),
        life:p.source.includes('comet')?.42:.25,max:p.source.includes('comet')?.42:.25,
        size:p.source.includes('comet')?rand(2,5):rand(1.2,3.2),color:p.color,star:true
      });
    }
    for(const e of state.entities.enemies){
      if(e.dead||p.hitIds?.has(e.id))continue;
      if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){
        dealDamage(e,p.damage,{color:p.color,source:p.source});
        if(!p.hitIds)p.hitIds=new Set(); p.hitIds.add(e.id);
        if(p.split){
          for(let i=0;i<3;i++){
            const a=Math.atan2(p.vy,p.vx)+(i-1)*.58;
            spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*350,vy:Math.sin(a)*350,r:3.2,life:.62,damage:p.damage*.34,color:'#ffb3d0',pierce:0,source:'star-spark'});
          }
        }
        if(p.fragment){
          for(let i=0;i<4;i++){
            const a=i/4*TAU+Math.atan2(p.vy,p.vx);
            spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*285,vy:Math.sin(a)*285,r:3.5,life:.65,damage:p.damage*.25,color:'#d9fbff',pierce:0,source:'comet-fragment'});
          }
        }
        if(p.pierce>0)p.pierce--;else{p.life=0;break;}
      }
    }
    if(p.life<=0&&p.explode&&!p.exploded){p.exploded=true;areaDamage(p.x,p.y,115,22+weaponCount('comet')*4,COLORS.comet);}
  }
  for(const p of spawned) spawnPlayerProjectile(p);
  state.entities.projectiles=state.entities.projectiles.filter(p=>p.life>0);
}

function updateWells(dt) {
  for(const w of state.entities.wells){
    w.life-=dt;w.tick-=dt;
    if(w.damage&&w.tick<=0){
      w.tick=.3;
      for(const e of state.entities.enemies){
        if(!e.dead&&(e.x-w.x)**2+(e.y-w.y)**2<(w.r*.42+e.r)**2) dealDamage(e,w.damage,{color:w.color,source:'well',canCrit:false});
      }
    }
  }
  state.entities.wells=state.entities.wells.filter(w=>w.life>0);
}

function updateGems(dt) {
  const range=magnetRange(),magnetStacks=stat('magnet');
  for(const g of state.entities.gems){
    g.life-=dt;g.pulse+=dt*5;g.x+=g.vx*dt;g.y+=g.vy*dt;
    g.vx*=Math.pow(.04,dt);g.vy*=Math.pow(.04,dt);
    const dx=player.x-g.x,dy=player.y-g.y,d=Math.hypot(dx,dy)||1;
    if(d<range){const force=260+(range-d)*(7+magnetStacks*.35);g.vx+=dx/d*force*dt;g.vy+=dy/d*force*dt;}
    if(d<player.r+10){g.life=0;gainXp(g.value*xpMult());audio.pickup();spawnParticle(g.x,g.y,COLORS.cyan,3,70,2);}
  }
  state.entities.gems=state.entities.gems.filter(g=>g.life>0);
}

function gainXp(v) {
  state.xp+=v;
  if(state.xp>=state.xpNeed){state.xp-=state.xpNeed;state.level++;state.xpNeed=Math.floor(state.xpNeed*1.22+7);openChoices();}
}

function updateEffects(dt) {
  for(const p of state.entities.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy*=Math.pow(.08,dt);p.life-=dt;}
  state.entities.particles=state.entities.particles.filter(p=>p.life>0);
  for(const t of state.entities.texts){t.y+=t.vy*dt;t.life-=dt;}
  state.entities.texts=state.entities.texts.filter(t=>t.life>0);
  for(const s of state.entities.shockwaves){s.life-=dt;s.r=lerp(s.r,s.maxR,1-Math.pow(.001,dt));}
  state.entities.shockwaves=state.entities.shockwaves.filter(s=>s.life>0);
  state.camera.shake=Math.max(0,state.camera.shake-dt*32);state.flash=Math.max(0,state.flash-dt);
}

function updateSpawning(dt) {
  state.spawnTimer-=dt;state.miniBossTimer-=dt;state.bossTimer-=dt;
  let rate;
  if(state.time<20) rate=1.25;
  else if(state.time<50) rate=.98-(state.time-20)*.008;
  else rate=Math.max(.18,.74-(state.time-50)*.0045);
  if(state.spawnTimer<=0){
    state.spawnTimer=rate;
    const count=1+Math.floor(state.time/105);
    for(let i=0;i<count;i++)spawnEnemy('normal');
  }
  const activeBoss=state.entities.enemies.some(e=>!e.dead&&e.type==='boss');
  const activeMini=state.entities.enemies.some(e=>!e.dead&&e.type==='mini');
  if(state.miniBossTimer<=0&&!activeBoss&&!activeMini){state.miniBossTimer=55;spawnEnemy('mini');}
  if(state.bossTimer<=0&&!activeBoss&&!activeMini){state.bossTimer=120;spawnEnemy('boss');}
}
