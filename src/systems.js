function spawnEnemy(elite=false) {
  const a = Math.random()*TAU;
  const radius = Math.min(Math.max(vw,vh)*.5, 650) + rand(40,130);
  const fastChance = clamp(.08 + state.time/300, .08, .38);
  const tankChance = clamp((state.time-45)/240, 0, .24);
  const type = elite ? 'elite' : Math.random()<tankChance ? 'tank' : Math.random()<fastChance ? 'fast' : 'grunt';
  const cfg = {
    grunt: { r:13, hp:22, speed:50, damage:6, color:'#7769ff', xp:3 },
    fast: { r:10, hp:16, speed:78, damage:5, color:'#ff4f9a', xp:3 },
    tank: { r:21, hp:76, speed:32, damage:10, color:'#ff9f43', xp:8 },
    elite: { r:29, hp:280, speed:40, damage:15, color:'#ffcc5c', xp:28 },
  }[type];
  const hp = cfg.hp * enemyHpMult() * (elite ? 1 + state.time/180 : 1);
  state.entities.enemies.push({
    id: state.nextId++, type,
    x:player.x+Math.cos(a)*radius, y:player.y+Math.sin(a)*radius,
    r:cfg.r, hp, maxHp:hp, speed:cfg.speed*(1+state.time/750), damage:cfg.damage,
    color:cfg.color, xp:cfg.xp, hit:0, dead:false, phase:Math.random()*TAU, elite
  });
}

function spawnParticle(x,y,color,count=6,speed=120,size=3) {
  for(let i=0;i<count;i++) {
    const a=Math.random()*TAU, s=rand(speed*.35,speed);
    state.entities.particles.push({
      x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:rand(.22,.55),max:.55,size:rand(size*.5,size),color
    });
  }
}
function addText(x,y,text,color='#fff',size=13) {
  state.entities.texts.push({x,y,text,color,size,life:.65,max:.65,vy:-35});
}
function shockwave(x,y,color,maxR=100,life=.35,width=3) {
  state.entities.shockwaves.push({x,y,r:6,maxR,life,max:life,color,width});
}

function dealDamage(enemy, amount, opts={}) {
  if (!enemy || enemy.dead) return;
  const critChance = .05 + stat('crit')*.05;
  const crit = opts.canCrit !== false && Math.random() < critChance;
  amount *= damageMult() * (crit ? 1.8 : 1);
  enemy.hp -= amount;
  enemy.hit = .09;
  const color = crit ? COLORS.amber : (opts.color || COLORS.white);
  addText(enemy.x, enemy.y-enemy.r, Math.round(amount), color, crit ? 17 : 12);
  spawnParticle(enemy.x, enemy.y, color, crit ? 7 : 3, crit ? 155 : 90, crit ? 4 : 2.5);
  if (crit) { state.camera.shake += 2.5; audio.hit(true); } else audio.hit(false);
  if (enemy.hp <= 0) killEnemy(enemy, opts);
}

function killEnemy(enemy, opts={}) {
  enemy.dead = true;
  state.kills++;
  state.combo++;
  state.comboTimer = 2.15 * (1 + stat('chain')*.15);
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  const burst = enemy.elite ? 22 : enemy.type==='tank' ? 12 : 7;
  spawnParticle(enemy.x,enemy.y,enemy.color,burst,enemy.elite?250:165,enemy.elite?6:4);
  shockwave(enemy.x,enemy.y,enemy.color,enemy.elite?170:enemy.type==='tank'?90:52,enemy.elite?.55:.28,enemy.elite?5:2);
  if (enemy.elite) {
    state.camera.shake += 15;
    state.hitStop = .12;
    state.flash = .18;
    audio.resonance();
  } else if (state.combo % 25 === 0) {
    state.camera.shake += 7;
    state.hitStop = .045;
  }
  const gemCount = enemy.elite ? 7 : enemy.type==='tank' ? 3 : 1;
  for(let i=0;i<gemCount;i++) {
    state.entities.gems.push({
      x:enemy.x+rand(-10,10),y:enemy.y+rand(-10,10),
      vx:rand(-45,45),vy:rand(-45,45),r:enemy.elite?6:4,
      value:enemy.xp/gemCount,life:30,pulse:Math.random()*TAU
    });
  }
  if (weaponCount('blade')>=6 && opts.source==='blade' && state.combo%6===0) {
    areaDamage(enemy.x,enemy.y,120,38,COLORS.cyan);
  }
}

function areaDamage(x,y,r,damage,color) {
  shockwave(x,y,color,r,.3,4);
  state.camera.shake += 4;
  for(const e of state.entities.enemies) {
    if(!e.dead && (e.x-x)**2+(e.y-y)**2 < (r+e.r)**2) {
      dealDamage(e,damage,{color,source:'area'});
    }
  }
}

function spawnCoreShot(target, echoed=false) {
  if(!target) return;
  const a=Math.atan2(target.y-player.y,target.x-player.x);
  state.entities.projectiles.push({
    x:player.x,y:player.y,
    vx:Math.cos(a)*450,vy:Math.sin(a)*450,
    r:4.5,life:1.45,maxLife:1.45,
    damage:echoed?5.5:8,
    color:echoed?COLORS.pink:'#d7f8ff',
    pierce:0,source:echoed?'core-echo':'core'
  });
}

function updateWeapons(dt) {
  player.angle += dt * (2.1 + weaponCount('blade')*.12) / hasteMult();

  player.coreCd -= dt;
  if(player.coreCd<=0){
    player.coreCd=1.05*hasteMult();
    const target=nearestEnemy(player.x,player.y);
    if(target){
      spawnCoreShot(target);
      echoTrigger(()=>spawnCoreShot(target,true));
    }
  }

  const bladeN = weaponCount('blade');
  if (bladeN) {
    player.bladeTick -= dt;
    if (player.bladeTick <= 0) {
      player.bladeTick = .105 * hasteMult();
      const count = bladeN>=2 ? 2 : 1;
      const orbit = bladeN>=6 ? 104 : 77;
      const bladeR = bladeN>=6 ? 24 : 19;
      for (const e of state.entities.enemies) {
        if(e.dead) continue;
        for(let i=0;i<count;i++) {
          const a=player.angle+i*Math.PI;
          const bx=player.x+Math.cos(a)*orbit;
          const by=player.y+Math.sin(a)*orbit;
          if((e.x-bx)**2+(e.y-by)**2 < (e.r+bladeR)**2) {
            dealDamage(e, 11+bladeN*4, {color:COLORS.cyan,source:'blade'});
            if(bladeN>=4) {
              const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;
              state.entities.projectiles.push({
                x:e.x,y:e.y,vx:dx/d*440,vy:dy/d*440,
                r:7,life:.25,maxLife:.25,damage:10+bladeN*2,
                color:COLORS.cyan,pierce:2,source:'wave'
              });
            }
            break;
          }
        }
      }
    }
  }

  const emberN = weaponCount('ember');
  if (emberN) {
    player.emberCd -= dt;
    if(player.emberCd<=0) {
      player.emberCd = (.72 - Math.min(.28,emberN*.035))*hasteMult();
      const target = nearestEnemy(player.x,player.y);
      if(target) {
        const base=Math.atan2(target.y-player.y,target.x-player.x);
        const shots=emberN>=2?2:1;
        for(let i=0;i<shots;i++) {
          const a=base+(i-(shots-1)/2)*.17;
          state.entities.projectiles.push({
            x:player.x,y:player.y,vx:Math.cos(a)*510,vy:Math.sin(a)*510,
            r:emberN>=6&&state.kills%10===0?13:6,
            life:1.4,maxLife:1.4,damage:14+emberN*4,
            color:COLORS.red,pierce:emberN>=6?7:0,
            source:'ember',split:emberN>=4
          });
        }
        echoTrigger(()=>{
          const a=base+rand(-.1,.1);
          state.entities.projectiles.push({
            x:player.x,y:player.y,vx:Math.cos(a)*500,vy:Math.sin(a)*500,
            r:5,life:1.3,maxLife:1.3,damage:11+emberN*3,
            color:COLORS.pink,pierce:0,source:'echo'
          });
        });
      }
    }
  }

  const gravN=weaponCount('gravity');
  if(gravN) {
    player.wellCd-=dt;
    if(player.wellCd<=0) {
      player.wellCd=(5.7-Math.min(2.2,gravN*.3))*hasteMult();
      const count=gravN>=6?2:1;
      for(let i=0;i<count;i++) {
        const a=player.angle+i*Math.PI;
        const d=count===2?150:105;
        state.entities.wells.push({
          x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,
          r:gravN>=2?185:135,
          life:gravN>=4?3.8:2.7,max:gravN>=4?3.8:2.7,
          strength:gravN>=2?430:280,
          damage:gravN>=4?9+gravN*2:0,tick:0,color:COLORS.violet
        });
      }
    }
  }

  const bulwarkN=weaponCount('bulwark');
  if(bulwarkN>=6) {
    player.fortressCd-=dt;
    if(player.fortressCd<=0) {
      player.fortressCd=8;
      player.shield=Math.min(35,player.shield+20);
      shockwave(player.x,player.y,COLORS.green,150,.5,5);
    }
  }
}

function echoTrigger(fn) {
  const n=weaponCount('echo');
  if(!n) return;
  const chance=n>=6?.72:n>=4?.46:n>=2?.30:.16;
  if(Math.random()<chance) {
    fn();
    if(n>=4&&Math.random()<.35) setTimeout(fn,70);
  }
}

function nearestEnemy(x,y) {
  let best=null,bd=Infinity;
  for(const e of state.entities.enemies) {
    if(e.dead) continue;
    const d=(e.x-x)**2+(e.y-y)**2;
    if(d<bd){bd=d;best=e;}
  }
  return best;
}

function updatePlayer(dt) {
  let x=0,y=0;
  if(state.input.keys.has('KeyA')||state.input.keys.has('ArrowLeft'))x--;
  if(state.input.keys.has('KeyD')||state.input.keys.has('ArrowRight'))x++;
  if(state.input.keys.has('KeyW')||state.input.keys.has('ArrowUp'))y--;
  if(state.input.keys.has('KeyS')||state.input.keys.has('ArrowDown'))y++;
  x+=state.input.touchX;
  y+=state.input.touchY;
  const len=Math.hypot(x,y);
  if(len>0){x/=Math.max(1,len);y/=Math.max(1,len);}
  const speed=player.speed*(1+stat('speed')*.07);
  player.x+=x*speed*dt;
  player.y+=y*speed*dt;
  player.invuln=Math.max(0,player.invuln-dt);
  player.hitPulse=Math.max(0,player.hitPulse-dt);
}

function updateEnemies(dt) {
  const gravWells=state.entities.wells;
  for(const e of state.entities.enemies) {
    if(e.dead)continue;
    e.hit=Math.max(0,e.hit-dt);
    e.phase+=dt*3;
    let dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;
    let vx=dx/d*e.speed,vy=dy/d*e.speed;
    for(const w of gravWells) {
      const wx=w.x-e.x,wy=w.y-e.y,wd=Math.hypot(wx,wy)||1;
      if(wd<w.r){
        const f=(1-wd/w.r)*w.strength;
        vx+=wx/wd*f;
        vy+=wy/wd*f;
      }
    }
    e.x+=vx*dt;
    e.y+=vy*dt;
    if(d<player.r+e.r+2 && player.invuln<=0) hurtPlayer(e.damage,e);
  }
  state.entities.enemies=state.entities.enemies.filter(e=>!e.dead);
}

function hurtPlayer(amount, enemy) {
  const hadDefense = weaponCount('bulwark')>0 || stat('armor')>0 || player.shield>0;
  amount*=1-damageReduction();
  if(player.shield>0){
    const used=Math.min(player.shield,amount);
    player.shield-=used;
    amount-=used;
  }
  if(amount>0)player.hp-=amount;
  player.invuln=.9;
  player.hitPulse=.22;
  state.camera.shake+=8;
  state.flash=.11;
  audio.hurt();
  spawnParticle(player.x,player.y,COLORS.red,10,170,4);
  if(hadDefense) shockwave(player.x,player.y,COLORS.green,78,.24,3);
  const dx=enemy.x-player.x,dy=enemy.y-player.y,d=Math.hypot(dx,dy)||1;
  enemy.x+=dx/d*48;
  enemy.y+=dy/d*48;
  if(weaponCount('bulwark')>=4) {
    areaDamage(player.x,player.y,115,24+weaponCount('bulwark')*4,COLORS.green);
  }
  if(player.hp<=0) endGame();
}

function updateProjectiles(dt) {
  for(const p of state.entities.projectiles) {
    p.x+=p.vx*dt;
    p.y+=p.vy*dt;
    p.life-=dt;
    for(const e of state.entities.enemies){
      if(e.dead||p.hitId===e.id)continue;
      if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){
        dealDamage(e,p.damage,{color:p.color,source:p.source});
        p.hitId=e.id;
        if(p.split){
          for(let i=0;i<3;i++){
            const a=Math.atan2(p.vy,p.vx)+(i-1)*.55;
            state.entities.projectiles.push({
              x:p.x,y:p.y,vx:Math.cos(a)*330,vy:Math.sin(a)*330,
              r:3,life:.55,maxLife:.55,damage:p.damage*.32,
              color:'#ff9a68',pierce:0,source:'ember-spark'
            });
          }
        }
        if(p.pierce>0)p.pierce--;
        else{p.life=0;break;}
      }
    }
  }
  state.entities.projectiles=state.entities.projectiles.filter(p=>p.life>0);
}

function updateWells(dt) {
  for(const w of state.entities.wells){
    w.life-=dt;
    w.tick-=dt;
    if(w.damage&&w.tick<=0){
      w.tick=.3;
      for(const e of state.entities.enemies){
        if(!e.dead&&(e.x-w.x)**2+(e.y-w.y)**2<(w.r*.42+e.r)**2){
          dealDamage(e,w.damage,{color:w.color,source:'well',canCrit:false});
        }
      }
    }
  }
  state.entities.wells=state.entities.wells.filter(w=>w.life>0);
}

function updateGems(dt) {
  const range=magnetRange();
  const magnetStacks=stat('magnet');
  for(const g of state.entities.gems){
    g.life-=dt;
    g.pulse+=dt*5;
    g.x+=g.vx*dt;
    g.y+=g.vy*dt;
    g.vx*=Math.pow(.04,dt);
    g.vy*=Math.pow(.04,dt);
    const dx=player.x-g.x,dy=player.y-g.y,d=Math.hypot(dx,dy)||1;
    if(d<range){
      const force=260+(range-d)*(7+magnetStacks*.35);
      g.vx+=dx/d*force*dt;
      g.vy+=dy/d*force*dt;
    }
    if(d<player.r+10){
      g.life=0;
      gainXp(g.value*xpMult());
      audio.pickup();
      spawnParticle(g.x,g.y,COLORS.cyan,3,70,2);
    }
  }
  state.entities.gems=state.entities.gems.filter(g=>g.life>0);
}

function gainXp(v) {
  state.xp+=v;
  if(state.xp>=state.xpNeed){
    state.xp-=state.xpNeed;
    state.level++;
    state.xpNeed=Math.floor(state.xpNeed*1.22+7);
    openChoices();
  }
}

function updateEffects(dt) {
  for(const p of state.entities.particles){
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    p.vx*=Math.pow(.08,dt);p.vy*=Math.pow(.08,dt);
    p.life-=dt;
  }
  state.entities.particles=state.entities.particles.filter(p=>p.life>0);
  for(const t of state.entities.texts){t.y+=t.vy*dt;t.life-=dt;}
  state.entities.texts=state.entities.texts.filter(t=>t.life>0);
  for(const s of state.entities.shockwaves){s.life-=dt;s.r=lerp(s.r,s.maxR,1-Math.pow(.001,dt));}
  state.entities.shockwaves=state.entities.shockwaves.filter(s=>s.life>0);
  state.camera.shake=Math.max(0,state.camera.shake-dt*32);
  state.flash=Math.max(0,state.flash-dt);
}

function updateSpawning(dt) {
  state.spawnTimer-=dt;
  state.eliteTimer-=dt;
  let rate;
  if(state.time<20) rate=1.25;
  else if(state.time<50) rate=.98-(state.time-20)*.008;
  else rate=Math.max(.18,.74-(state.time-50)*.0045);
  if(state.spawnTimer<=0){
    state.spawnTimer=rate;
    const count=1+Math.floor(state.time/105);
    for(let i=0;i<count;i++)spawnEnemy(false);
  }
  if(state.eliteTimer<=0){
    state.eliteTimer=Math.max(20,36-state.time*.025);
    spawnEnemy(true);
  }
}
