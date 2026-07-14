function bossSkill(enemy, dt) {
  enemy.skillCd-=dt; enemy.burstCd-=dt; enemy.pulseCd-=dt;
  if(enemy.type==='mini') {
    if(enemy.skillCd<=0) {
      enemy.skillCd=3.4;
      for(let i=0;i<7;i++) spawnEnemyProjectile(enemy.x,enemy.y,i/7*TAU+enemy.phase*.15,145,7,'#c79cff',5,5);
      shockwave(enemy.x,enemy.y,'#c79cff',100,.45,3);
    }
    if(enemy.burstCd<=0) {
      enemy.burstCd=6.4;
      const a=Math.atan2(player.y-enemy.y,player.x-enemy.x);
      enemy.dash=.55; enemy.dashX=Math.cos(a)*360; enemy.dashY=Math.sin(a)*360;
      state.entities.telegraphs.push({type:'line',x:enemy.x,y:enemy.y,a,length:260,width:26,life:.55,max:.55,color:'#e7c4ff'});
    }
    return;
  }
  if(enemy.type!=='boss') return;
  if(enemy.skillCd<=0) {
    enemy.skillCd=enemy.variant==='seraph'?2.2:2.8;
    const base=Math.atan2(player.y-enemy.y,player.x-enemy.x);
    const shots=enemy.variant==='seraph'?7:5;
    for(let i=0;i<shots;i++) {
      const spread=(i-(shots-1)/2)*(enemy.variant==='seraph'?.16:.12);
      spawnEnemyProjectile(enemy.x,enemy.y,base+spread,215,9,enemy.variant==='seraph'?'#9fffea':'#ff72cb',6,5);
    }
  }
  if(enemy.burstCd<=0) {
    enemy.burstCd=enemy.variant==='seraph'?4.6:5.4;
    const count=enemy.variant==='seraph'?18:14;
    for(let i=0;i<count;i++) {
      const a=i/count*TAU+enemy.phase*.2;
      spawnEnemyProjectile(enemy.x,enemy.y,a,enemy.variant==='seraph'?175:150,8,enemy.variant==='seraph'?'#b8fff0':'#c78cff',5.5,6);
    }
    shockwave(enemy.x,enemy.y,enemy.color,180,.7,5);
  }
  if(enemy.pulseCd<=0) {
    enemy.pulseCd=8.0;
    const tx=player.x+rand(-45,45),ty=player.y+rand(-45,45);
    state.entities.telegraphs.push({type:'circle',x:tx,y:ty,r:105,life:1.15,max:1.15,damage:18,color:'#ff72cb'});
  }
}

function updateEnemies(dt) {
  const gravWells=state.entities.wells;
  const chronoN=weaponCount('chrono');
  const chronoRadius=145+chronoN*18;
  for(const e of state.entities.enemies) {
    if(e.dead)continue;
    e.hit=Math.max(0,e.hit-dt); e.phase+=dt*3;
    bossSkill(e,dt);
    let dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;
    let speed=e.speed;
    if(chronoN&&d<chronoRadius) speed*=Math.max(.32,1-(.10+chronoN*.07));
    let vx=dx/d*speed,vy=dy/d*speed;
    for(const w of gravWells) {
      const wx=w.x-e.x,wy=w.y-e.y,wd=Math.hypot(wx,wy)||1;
      if(wd<w.r){const f=(1-wd/w.r)*w.strength;vx+=wx/wd*f;vy+=wy/wd*f;}
    }
    if(e.dash>0){e.dash-=dt;vx+=e.dashX;vy+=e.dashY;}
    e.x+=vx*dt; e.y+=vy*dt;
    if(d<player.r+e.r+2 && player.invuln<=0) hurtPlayer(e.damage,e);
  }
  state.entities.enemies=state.entities.enemies.filter(e=>!e.dead);
}

function hurtPlayer(amount, source) {
  const hadDefense = weaponCount('bulwark')>0 || stat('armor')>0 || player.shield>0;
  amount*=1-damageReduction();
  if(player.shield>0){const used=Math.min(player.shield,amount);player.shield-=used;amount-=used;}
  if(amount>0)player.hp-=amount;
  player.invuln=.9; player.hitPulse=.22; state.camera.shake+=8; state.flash=.11; audio.hurt();
  spawnParticle(player.x,player.y,COLORS.red,10,170,4);
  if(hadDefense) shockwave(player.x,player.y,COLORS.green,78,.24,3);
  if(source&&Number.isFinite(source.x)&&Number.isFinite(source.y)) {
    const dx=source.x-player.x,dy=source.y-player.y,d=Math.hypot(dx,dy)||1;
    if(source.type&&state.entities.enemies.includes(source)){source.x+=dx/d*48;source.y+=dy/d*48;}
  }
  if(weaponCount('bulwark')>=4) areaDamage(player.x,player.y,115,24+weaponCount('bulwark')*4,COLORS.green);
  if(player.hp<=0) endGame();
}

function updateEnemyProjectiles(dt) {
  for(const p of state.entities.enemyProjectiles) {
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.phase+=dt*4;
    const d=Math.hypot(player.x-p.x,player.y-p.y);
    if(d<player.r+p.r&&player.invuln<=0){p.life=0;hurtPlayer(p.damage,p);}
  }
  state.entities.enemyProjectiles=state.entities.enemyProjectiles.filter(p=>p.life>0);
}

function updateTelegraphs(dt) {
  for(const t of state.entities.telegraphs) {
    t.life-=dt;
    if(t.life<=0&&!t.triggered){
      t.triggered=true;
      if(t.type==='circle'){
        shockwave(t.x,t.y,t.color,t.r,.35,6);
        if(Math.hypot(player.x-t.x,player.y-t.y)<t.r+player.r&&player.invuln<=0) hurtPlayer(t.damage,t);
      }
    }
  }
  state.entities.telegraphs=state.entities.telegraphs.filter(t=>t.life>-.12);
}
