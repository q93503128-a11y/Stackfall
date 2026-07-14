function enemyConfig(type) {
  const scale = enemyHpMult();
  const configs = {
    grunt: { r:13, hp:22, speed:50, damage:6, color:'#7769ff', xp:3, name:'공허 유체' },
    fast: { r:11, hp:17, speed:82, damage:5, color:'#ff4f9a', xp:3, name:'추적 혜성' },
    tank: { r:22, hp:82, speed:31, damage:10, color:'#ff9f43', xp:8, name:'성간 보루' },
    mini: { r:34, hp:420, speed:43, damage:14, color:'#d4a6ff', xp:42, name:'균열의 기사' },
    boss: { r:58, hp:1850, speed:30, damage:18, color:'#ff72cb', xp:160, name:'일식의 군주' }
  };
  const c = configs[type];
  const tierMult = type==='mini' ? 1+state.time/210 : type==='boss' ? 1+state.time/160 : 1;
  return {...c, hp:c.hp*scale*tierMult};
}

function spawnEnemy(kind='normal') {
  const a = Math.random()*TAU;
  const radius = Math.min(Math.max(vw,vh)*.52, 690) + rand(50,150);
  let type;
  if(kind==='mini') type='mini';
  else if(kind==='boss') type='boss';
  else {
    const fastChance = clamp(.08 + state.time/300, .08, .38);
    const tankChance = clamp((state.time-45)/240, 0, .24);
    type = Math.random()<tankChance ? 'tank' : Math.random()<fastChance ? 'fast' : 'grunt';
  }
  const cfg = enemyConfig(type);
  const variant = type==='boss' ? (state.bossIndex%2===0?'eclipse':'seraph') : null;
  const enemy = {
    id: state.nextId++, type, variant, name: type==='boss' && variant==='seraph' ? '성운의 세라프' : cfg.name,
    x:player.x+Math.cos(a)*radius, y:player.y+Math.sin(a)*radius,
    r:cfg.r, hp:cfg.hp, maxHp:cfg.hp, speed:cfg.speed*(1+state.time/800), damage:cfg.damage,
    color:cfg.color, xp:cfg.xp, hit:0, dead:false, phase:Math.random()*TAU,
    skillCd:type==='boss'?2.4:type==='mini'?3.2:999,
    burstCd:type==='boss'?5.4:type==='mini'?6.2:999,
    pulseCd:type==='boss'?8.2:999,
    dash:0, dashX:0, dashY:0
  };
  state.entities.enemies.push(enemy);
  if(type==='boss') {
    state.bossActiveId=enemy.id;
    state.bossIndex++;
    showBossNotice(enemy.name,'BOSS APPROACHING');
    audio.boss();
  } else if(type==='mini') showBossNotice(enemy.name,'RIFT DETECTED');
  return enemy;
}

function spawnParticle(x,y,color,count=6,speed=120,size=3) {
  for(let i=0;i<count;i++) {
    const a=Math.random()*TAU, s=rand(speed*.35,speed);
    state.entities.particles.push({
      x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:rand(.22,.62),max:.62,size:rand(size*.5,size),color,
      star:Math.random()<.28
    });
  }
}
function addText(x,y,text,color='#fff',size=13) {
  state.entities.texts.push({x,y,text,color,size,life:.72,max:.72,vy:-35});
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
  addText(enemy.x, enemy.y-enemy.r, Math.round(amount), color, crit ? 18 : 12);
  spawnParticle(enemy.x, enemy.y, color, crit ? 8 : 3, crit ? 165 : 95, crit ? 4.5 : 2.5);
  if (crit) { state.camera.shake += 2.5; audio.hit(true); } else audio.hit(false);
  if (enemy.hp <= 0) killEnemy(enemy, opts);
}

function killEnemy(enemy, opts={}) {
  enemy.dead = true;
  state.kills++;
  state.combo++;
  state.comboTimer = 2.15 * (1 + stat('chain')*.15);
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  const isBoss=enemy.type==='boss', isMini=enemy.type==='mini';
  const burst = isBoss ? 48 : isMini ? 28 : enemy.type==='tank' ? 12 : 7;
  spawnParticle(enemy.x,enemy.y,enemy.color,burst,isBoss?340:isMini?275:165,isBoss?8:isMini?6:4);
  shockwave(enemy.x,enemy.y,enemy.color,isBoss?300:isMini?190:enemy.type==='tank'?90:52,isBoss?.9:isMini?.62:.28,isBoss?8:isMini?6:2);
  if (isBoss || isMini) {
    state.camera.shake += isBoss?22:15;
    state.hitStop = isBoss?.18:.12;
    state.flash = isBoss?.30:.18;
    audio.resonance();
  } else if (state.combo % 25 === 0) {
    state.camera.shake += 7;
    state.hitStop = .045;
  }
  const gemCount = isBoss ? 24 : isMini ? 10 : enemy.type==='tank' ? 3 : 1;
  for(let i=0;i<gemCount;i++) {
    state.entities.gems.push({
      x:enemy.x+rand(-18,18),y:enemy.y+rand(-18,18),
      vx:rand(-75,75),vy:rand(-75,75),r:isBoss?7:isMini?6:4,
      value:enemy.xp/gemCount,life:35,pulse:Math.random()*TAU
    });
  }
  if(isBoss) {
    state.bossActiveId=null;
    ui.bossBar.classList.add('hidden');
  }
  if (weaponCount('blade')>=6 && opts.source==='blade' && state.combo%6===0) {
    areaDamage(enemy.x,enemy.y,130,42,COLORS.cyan);
  }
}

function areaDamage(x,y,r,damage,color) {
  shockwave(x,y,color,r,.34,4);
  state.camera.shake += 4;
  for(const e of state.entities.enemies) {
    if(!e.dead && (e.x-x)**2+(e.y-y)**2 < (r+e.r)**2) {
      dealDamage(e,damage,{color,source:'area'});
    }
  }
}

function spawnPlayerProjectile(data) {
  state.entities.projectiles.push({trailTick:0,maxLife:data.life,...data});
}
function spawnEnemyProjectile(x,y,a,speed,damage,color='#ff6ccf',r=6,life=5) {
  state.entities.enemyProjectiles.push({
    x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage,color,r,life,maxLife:life,phase:Math.random()*TAU
  });
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
