(function(){
  'use strict';
  const profiles=Object.freeze({
    easy:Object.freeze({key:'easy',enemyHp:.82,enemyDamage:.78,enemySpeed:.94,rangedChance:.72}),
    normal:Object.freeze({key:'normal',enemyHp:1,enemyDamage:1,enemySpeed:1,rangedChance:1}),
    hard:Object.freeze({key:'hard',enemyHp:1.32,enemyDamage:1.30,enemySpeed:1.12,rangedChance:1.28})
  });
  let saved='normal';try{saved=localStorage.getItem('stackfall:difficulty')||'normal';}catch{}
  state.selectedDifficulty=profiles[state.selectedDifficulty]?state.selectedDifficulty:profiles[saved]?saved:'normal';
  window.stackfallDifficultyProfiles=profiles;
  window.stackfallDifficultyConfig=()=>profiles[state.selectedDifficulty]||profiles.normal;

  const copy={
    ko:{title:'난이도',easy:['쉬움','적 체력·피해 감소'],normal:['보통','기준 난이도'],hard:['어려움','더 강하고 빠른 적']},
    en:{title:'DIFFICULTY',easy:['EASY','Lower enemy health and damage'],normal:['NORMAL','Baseline difficulty'],hard:['HARD','Stronger and faster enemies']},
    ja:{title:'難易度',easy:['簡単','敵の体力・攻撃力が低下'],normal:['普通','基準難易度'],hard:['難しい','より強く速い敵']},
    'zh-CN':{title:'难度',easy:['简单','降低敌人生命与伤害'],normal:['普通','标准难度'],hard:['困难','敌人更强更快']},
    es:{title:'DIFICULTAD',easy:['FÁCIL','Menos vida y daño enemigo'],normal:['NORMAL','Dificultad de referencia'],hard:['DIFÍCIL','Enemigos más fuertes y rápidos']},
    fr:{title:'DIFFICULTÉ',easy:['FACILE','Vie et dégâts ennemis réduits'],normal:['NORMAL','Difficulté de référence'],hard:['DIFFICILE','Ennemis plus forts et rapides']}
  };
  const picker=document.createElement('div');picker.className='difficulty-picker';picker.innerHTML='<div class="difficulty-copy"><span id="difficultyLabel"></span><small id="difficultyDesc"></small></div><div id="difficultyOptions" class="difficulty-options" role="radiogroup" aria-labelledby="difficultyLabel"></div>';
  ui.start.insertAdjacentElement('beforebegin',picker);
  const style=document.createElement('style');style.textContent='.difficulty-picker{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;margin:0 0 14px;padding:11px 12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(4,8,22,.56)}.difficulty-copy{min-width:112px}.difficulty-copy span{display:block;color:#ff9aca;font-size:9px;font-weight:900;letter-spacing:.16em}.difficulty-copy small{display:block;margin-top:5px;color:#9faac8;font-size:9px}.difficulty-options{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.difficulty-option{min-height:46px;padding:7px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.035);color:#dfe6fa;cursor:pointer}.difficulty-option strong{display:block;font-size:11px}.difficulty-option small{display:block;margin-top:3px;color:#7f8dac;font-size:8px}.difficulty-option.selected{border-color:var(--difficulty-color);background:color-mix(in srgb,var(--difficulty-color) 13%,rgba(7,11,27,.94));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--difficulty-color) 18%,transparent),0 0 18px color-mix(in srgb,var(--difficulty-color) 12%,transparent)}@media(max-width:680px){.difficulty-picker{grid-template-columns:1fr}.difficulty-copy{min-width:0}.difficulty-options{gap:5px}.difficulty-option{min-height:42px}}';document.head.appendChild(style);
  function difficultyText(){const lang=GAME_SETTINGS?.language||'ko';return copy[lang]||copy.en;}
  function renderDifficulty(){
    const text=difficultyText(),root=document.querySelector('#difficultyOptions'),current=profiles[state.selectedDifficulty]?state.selectedDifficulty:'normal',colors={easy:'#74f2a7',normal:'#7ce8ff',hard:'#ff7b8d'};
    document.querySelector('#difficultyLabel').textContent=text.title;document.querySelector('#difficultyDesc').textContent=text[current][1];root.innerHTML='';
    for(const key of['easy','normal','hard']){const button=document.createElement('button');button.type='button';button.className='difficulty-option'+(key===current?' selected':'');button.style.setProperty('--difficulty-color',colors[key]);button.dataset.difficulty=key;button.setAttribute('role','radio');button.setAttribute('aria-checked',key===current?'true':'false');button.innerHTML=`<strong>${text[key][0]}</strong><small>${text[key][1]}</small>`;button.onclick=()=>{state.selectedDifficulty=key;try{localStorage.setItem('stackfall:difficulty',key);}catch{}audio.pickup();renderDifficulty();};root.appendChild(button);}
  }
  window.renderStackfallDifficulty=renderDifficulty;
  const baseStarterRender=renderStarterOptions;renderStarterOptions=function difficultyAwareStarterRender(){baseStarterRender();renderDifficulty();};

  const baseEnemyConfig=enemyConfig;
  enemyConfig=function difficultyEnemyConfig(type){const c=baseEnemyConfig(type),d=window.stackfallDifficultyConfig();c.hp*=.88*d.enemyHp;c.damage*=.94*d.enemyDamage;c.speed*=.98*d.enemySpeed;return c;};

  const baseIon=fireIonChain;
  fireIonChain=function augmentedIonChain(stacks,echoed=false){baseIon(stacks,echoed);if(state.weaponAugments?.ion&&!echoed)scheduleWeaponAction(115,()=>baseIon(stacks,true));};

  const baseNova=fireNovaPulse;
  fireNovaPulse=function augmentedNovaPulse(stacks,echoed=false){const x=player.x,y=player.y,size=weaponSizeMultiplier(),radius=(145+(stacks>=2?38:0)+(stacks>=5?18:0))*size;baseNova(stacks,echoed);if(state.weaponAugments?.nova&&!echoed)scheduleWeaponAction(420,()=>{for(const enemy of state.entities.enemies){if(enemy.dead)continue;const dx=x-enemy.x,dy=y-enemy.y,d=Math.hypot(dx,dy)||1;if(d<radius*1.05){const pull=(42+stacks*4)*enemyControlFactor(enemy);enemy.x+=dx/d*pull;enemy.y+=dy/d*pull;}}areaDamage(x,y,radius*.58,12+stacks*3.5,'#fff0c8','nova-implosion',{shake:false});shockwave(x,y,'#ffbd69',radius*.68,.38,2.6);});};

  const baseDrone=fireMeteorDrones;
  fireMeteorDrones=function augmentedMeteorDrones(stacks,echoed=false){const target=state.entities.enemies.filter(e=>!e.dead&&Math.hypot(e.x-player.x,e.y-player.y)<=weaponRange('drone')).sort((a,b)=>b.hp-a.hp)[0],targetId=target?.id;baseDrone(stacks,echoed);if(state.weaponAugments?.drone&&!echoed&&targetId)scheduleWeaponAction(360,()=>{const live=enemyById(targetId);if(!live)return;areaDamage(live.x,live.y,72+stacks*6,16+stacks*4.2,'#d8fff1','drone-meteor');shockwave(live.x,live.y,'#8fffd0',96+stacks*7,.42,3.2);});};

  const baseRail=fireRailgun;
  fireRailgun=function augmentedRailgun(stacks,echoed=false){const target=nearestWeaponTarget('rail'),x=player.x,y=player.y,a=target?Math.atan2(target.y-y,target.x-x):player.angle,length=weaponRange('rail');baseRail(stacks,echoed);if(state.weaponAugments?.rail&&!echoed&&target)scheduleWeaponAction(190,()=>{for(const [index,f]of[.34,.58,.82].entries()){const px=x+Math.cos(a)*length*f,py=y+Math.sin(a)*length*f;scheduleWeaponAction(index*70,()=>{areaDamage(px,py,38+stacks*3,11+stacks*3.1,'#b7e7ff','rail-fracture');shockwave(px,py,'#eaf8ff',52+stacks*4,.24,1.8);});}});};

  const baseSpiral=fireGalacticSpiral;
  fireGalacticSpiral=function augmentedGalacticSpiral(stacks,echoed=false){baseSpiral(stacks,echoed);if(!state.weaponAugments?.spiral||echoed)return;const phase=(player.spiralPhase||0)+Math.PI,arms=stacks>=6?4:stacks>=4?3:stacks>=2?2:1;for(let step=0;step<3;step++)scheduleWeaponAction(270+step*68,()=>{for(let arm=0;arm<arms;arm++){const a=phase+arm*TAU/arms-step*.38*(arm%2?-1:1),target=nearestWeaponTarget('spiral');spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*(330+stacks*16),vy:Math.sin(a)*(330+stacks*16),r:3.9+stacks*.2,life:1.35,maxRange:weaponRange('spiral'),damage:6+stacks*1.75,color:'#f3d4ff',pierce:stacks>=5?1:0,source:'spiral-counter',homingTargetId:target?.id,homingReacquire:true,homingTurn:2.1});}});};

  const baseMirror=fireReflector;
  fireReflector=function augmentedReflector(stacks,echoed=false){const radius=Math.min(weaponRange('mirror'),(210+stacks*24)*weaponSizeMultiplier()),shots=state.weaponAugments?.mirror&&!echoed?state.entities.enemyProjectiles.filter(p=>p&&p.life>0&&Math.hypot(p.x-player.x,p.y-player.y)<radius).slice(0,6).map(p=>({x:p.x,y:p.y,r:p.r})):[];baseMirror(stacks,echoed);for(const shot of shots){const target=nearestEnemy(shot.x,shot.y,weaponRange('mirror'));if(!target)continue;const base=Math.atan2(target.y-shot.y,target.x-shot.x);for(const offset of[-.13,.13]){const a=base+offset;spawnPlayerProjectile({x:shot.x,y:shot.y,vx:Math.cos(a)*(470+stacks*16),vy:Math.sin(a)*(470+stacks*16),r:Math.max(3.8,(shot.r||4)*.72),life:1.05,maxRange:weaponRange('mirror'),damage:7+stacks*2.2,color:'#d7fff4',pierce:1,source:'mirror-twin-reflect'});}}};

  const baseKill=killEnemy;let arcRicochetGuard=false;
  killEnemy=function augmentedArcKill(enemy,opts={}){const wasAlive=enemy&&!enemy.dead,x=enemy?.x||0,y=enemy?.y||0,source=String(opts.source||'');baseKill(enemy,opts);if(arcRicochetGuard||!wasAlive||!enemy?.dead||!state.weaponAugments?.arc||!['arc','arc-return'].includes(source))return;const range=weaponRange('arc'),candidates=state.entities.enemies.filter(e=>!e.dead&&e!==enemy&&Math.hypot(e.x-x,e.y-y)<=range*1.25&&Math.hypot(e.x-player.x,e.y-player.y)<=range);if(!candidates.length)return;const target=candidates[Math.floor(Math.random()*candidates.length)];arcRicochetGuard=true;try{fireBoomerang(target,Math.max(1,weaponCount('arc')),false,{x,y},true);}finally{arcRicochetGuard=false;}};

  function openingRangedChance(t=state.time||0){const difficulty=window.stackfallDifficultyConfig().rangedChance,base=clamp((t-90)/900,0,.09)+clamp((t-300)/500,0,.04),firstBossActive=state.entities.enemies.some(e=>e&&!e.dead&&e.type==='boss'&&e.firstBoss);if(!firstBossActive)return base*difficulty;const rangedAlive=state.entities.enemies.reduce((sum,e)=>sum+(!e?.dead&&e.type==='ranged'?1:0),0);return rangedAlive>=2?0:base*difficulty*.45;}
  window.stackfallRangedSpawnChance=openingRangedChance;
  function convertOpeningRanged(enemy,t){const cfg=enemyConfig('grunt'),threat=1+Math.floor(t/60),speedScale=1+Math.min(.55,t/1500)+Math.min(.20,Math.max(0,threat-1)*.012);Object.assign(enemy,{type:'grunt',name:cfg.name,r:cfg.r,hp:cfg.hp,maxHp:cfg.hp,speed:cfg.speed*speedScale,damage:cfg.damage,color:cfg.color,xp:cfg.xp,rangedCd:999});}
  const openingSpawnEnemy=spawnEnemy;
  spawnEnemy=function openingBalancedSpawn(kind='normal'){const t=state.time||0,firstBoss=kind==='boss'&&(state.bossIndex||0)===0,targetRangedChance=kind==='normal'?openingRangedChance(t):0,enemy=openingSpawnEnemy(kind);if(!enemy)return enemy;if(firstBoss&&enemy.type==='boss'){enemy.firstBoss=true;enemy.hp*=.78;enemy.maxHp=enemy.hp;enemy.damage*=.72;enemy.speed*=.92;enemy.skillCd+=1.25;enemy.burstCd+=1.60;enemy.pulseCd+=1.80;}if(kind==='normal'&&enemy.type==='ranged'){const originalChance=clamp((t-55)/650,0,.13)*window.stackfallDifficultyConfig().rangedChance,keep=originalChance>0&&Math.random()<clamp(targetRangedChance/originalChance,0,1);if(!keep)convertOpeningRanged(enemy,t);}return enemy;};
  const openingFireFan=fireFan;fireFan=function openingBossFan(e,count,spread,speed,damage,color,r=5.5){const shots=e.firstBoss?Math.max(3,Math.ceil(count*.72)):count;return openingFireFan(e,shots,spread,e.firstBoss?speed*.90:speed,e.firstBoss?damage*.88:damage,color,r);};
  const openingFireRing=fireRing;fireRing=function openingBossRing(e,count,speed,damage,color,offset=0,r=5.2){const shots=e.firstBoss?Math.max(6,Math.ceil(count*.72)):count;return openingFireRing(e,shots,e.firstBoss?speed*.90:speed,e.firstBoss?damage*.88:damage,color,offset,r);};
  const openingSummonMinions=summonMinions;summonMinions=function openingBossSummons(e,count=4,kind='grunt'){return openingSummonMinions(e,e.firstBoss?Math.min(1,count):count,kind);};
  const openingNormalBossSkill=normalBossSkill;normalBossSkill=function openingBossCadence(e,dt){return openingNormalBossSkill(e,e.firstBoss?dt/1.22:dt);};

  renderDifficulty();
})();