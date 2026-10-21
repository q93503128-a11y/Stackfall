(function(){
  'use strict';
  const profiles=Object.freeze({
    easy:Object.freeze({key:'easy',enemyHp:.82,enemyDamage:.78,enemySpeed:.94,rangedChance:.72,rewardMultiplier:.85}),
    normal:Object.freeze({key:'normal',enemyHp:1,enemyDamage:1,enemySpeed:1,rangedChance:1,rewardMultiplier:1}),
    hard:Object.freeze({key:'hard',enemyHp:1.42,enemyDamage:1.36,enemySpeed:1.14,rangedChance:1.35,rewardMultiplier:1.40}),
    'very-hard':Object.freeze({key:'very-hard',enemyHp:1.80,enemyDamage:1.60,enemySpeed:1.20,rangedChance:1.55,rewardMultiplier:1.70})
  });
  let saved='normal';try{saved=localStorage.getItem('stackfall:difficulty')||'normal';}catch{}
  const difficultyFeatureKey=key=>key==='hard'?'hard':key==='very-hard'?'very-hard':null;
  const difficultyUnlocked=key=>{const feature=difficultyFeatureKey(key);return !feature||window.stackfallIsFeatureUnlocked?.(feature)!==false;};
  state.selectedDifficulty=profiles[state.selectedDifficulty]?state.selectedDifficulty:profiles[saved]?saved:'normal';if(!difficultyUnlocked(state.selectedDifficulty))state.selectedDifficulty='normal';
  window.stackfallDifficultyProfiles=profiles;
  window.stackfallDifficultyConfig=()=>profiles[state.selectedDifficulty]||profiles.normal;
  window.stackfallDifficultyRewardMultiplier=()=>Math.max(.5,Number(window.stackfallDifficultyConfig().rewardMultiplier)||1);
  function veryHardEscalation(t=state.time||0){
    const minutes=Math.max(0,t-240)/60;
    if(state.selectedDifficulty!=='very-hard'||minutes<=0)return{minutes,hp:1,damage:1,speed:1};
    return{minutes,hp:1+minutes*.008+Math.pow(minutes,1.08)*.0025,damage:1+minutes*.016+Math.pow(minutes,1.10)*.0045,speed:1+minutes*.0055+Math.pow(minutes,1.06)*.0017};
  }
  window.stackfallVeryHardEscalation=veryHardEscalation;

  const copy={
    ko:{title:'난이도',easy:['쉬움','적 체력·피해 감소 · 성진 -15%'],normal:['보통','기준 난이도 · 성진 100%'],hard:['어려움','강화된 적 · 성진 +40%'],'very-hard':['매우 어려움','시간이 지날수록 더 빠르게 강화 · 성진 +70%']},
    en:{title:'DIFFICULTY',easy:['EASY','Lower enemy health and damage · Stardust -15%'],normal:['NORMAL','Baseline difficulty · Stardust 100%'],hard:['HARD','Stronger enemies · Stardust +40%'],'very-hard':['VERY HARD','Enemy scaling accelerates over time · Stardust +70%']},
    ja:{title:'難易度',easy:['簡単','敵が弱化 · スターダスト -15%'],normal:['普通','基準難易度 · スターダスト 100%'],hard:['難しい','敵が強化 · スターダスト +40%'],'very-hard':['非常に難しい','時間経過で敵の強化が加速 · スターダスト +70%']},
    'zh-CN':{title:'难度',easy:['简单','敌人较弱 · 星尘 -15%'],normal:['普通','标准难度 · 星尘 100%'],hard:['困难','敌人强化 · 星尘 +40%'],'very-hard':['非常困难','敌人会随时间更快强化 · 星尘 +70%']},
    es:{title:'DIFICULTAD',easy:['FÁCIL','Enemigos más débiles · Polvo estelar -15%'],normal:['NORMAL','Dificultad base · Polvo estelar 100%'],hard:['DIFÍCIL','Enemigos reforzados · Polvo estelar +40%'],'very-hard':['MUY DIFÍCIL','La fuerza enemiga aumenta más rápido · Polvo estelar +70%']},
    fr:{title:'DIFFICULTÉ',easy:['FACILE','Ennemis affaiblis · Poussière -15 %'],normal:['NORMAL','Difficulté de base · Poussière 100 %'],hard:['DIFFICILE','Ennemis renforcés · Poussière +40 %'],'very-hard':['TRÈS DIFFICILE','La puissance ennemie accélère avec le temps · Poussière +70 %']}
  };
  const picker=document.createElement('div');picker.className='difficulty-picker';picker.innerHTML='<div class="difficulty-copy"><span id="difficultyLabel"></span><small id="difficultyDesc"></small></div><div id="difficultyOptions" class="difficulty-options" role="radiogroup" aria-labelledby="difficultyLabel"></div>';
  const difficultyMount=document.querySelector('#sortieDifficultyMount');if(difficultyMount)difficultyMount.appendChild(picker);else ui.start.insertAdjacentElement('beforebegin',picker);
  const style=document.createElement('style');style.textContent='.difficulty-picker{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;margin:0 0 14px;padding:11px 12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(4,8,22,.56)}.difficulty-copy{min-width:112px}.difficulty-copy span{display:block;color:#ff9aca;font-size:9px;font-weight:900;letter-spacing:.16em}.difficulty-copy small{display:block;margin-top:5px;color:#9faac8;font-size:9px}.difficulty-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.difficulty-option{min-height:46px;padding:7px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.035);color:#dfe6fa;cursor:pointer}.difficulty-option strong{display:block;font-size:11px}.difficulty-option small{display:block;margin-top:3px;color:#7f8dac;font-size:8px}.difficulty-option.locked{opacity:.38;cursor:not-allowed;filter:saturate(.35)}.difficulty-option.selected{border-color:var(--difficulty-color);background:color-mix(in srgb,var(--difficulty-color) 13%,rgba(7,11,27,.94));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--difficulty-color) 18%,transparent),0 0 18px color-mix(in srgb,var(--difficulty-color) 12%,transparent)}@media(max-width:680px){.difficulty-picker{grid-template-columns:1fr}.difficulty-copy{min-width:0}.difficulty-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.difficulty-option{min-height:42px}}';document.head.appendChild(style);
  function difficultyText(){const lang=GAME_SETTINGS?.language||'ko';return copy[lang]||copy.en;}
  function renderDifficulty(){
    const text=difficultyText(),root=document.querySelector('#difficultyOptions'),current=profiles[state.selectedDifficulty]?state.selectedDifficulty:'normal',colors={easy:'#74f2a7',normal:'#7ce8ff',hard:'#ff7b8d','very-hard':'#c58cff'};
    document.querySelector('#difficultyLabel').textContent=text.title;document.querySelector('#difficultyDesc').textContent=text[current][1];root.innerHTML='';
    for(const key of['easy','normal','hard','very-hard']){const button=document.createElement('button'),featureKey=difficultyFeatureKey(key),locked=!!featureKey&&!difficultyUnlocked(key);button.type='button';button.className='difficulty-option'+(key===current?' selected':'')+(locked?' locked':'');button.style.setProperty('--difficulty-color',colors[key]);button.dataset.difficulty=key;button.disabled=locked;button.setAttribute('role','radio');button.setAttribute('aria-checked',key===current?'true':'false');button.innerHTML=`<strong>${text[key][0]}</strong><small>${locked?((featureKey&&window.stackfallFeatureAchievementCondition?.(featureKey))||'Achievement required'):text[key][1]}</small>`;button.onclick=()=>{if(locked)return;state.selectedDifficulty=key;try{localStorage.setItem('stackfall:difficulty',key);}catch{}audio.pickup();renderDifficulty();};root.appendChild(button);}
  }
  window.renderStackfallDifficulty=renderDifficulty;
  const baseStarterRender=renderStarterOptions;renderStarterOptions=function difficultyAwareStarterRender(){baseStarterRender();renderDifficulty();};

  const baseEnemyConfig=enemyConfig;
  enemyConfig=function difficultyEnemyConfig(type){const c=baseEnemyConfig(type),d=window.stackfallDifficultyConfig(),r=veryHardEscalation();c.hp*=.88*d.enemyHp*r.hp;c.damage*=.94*d.enemyDamage*r.damage;c.speed*=.98*d.enemySpeed*r.speed;return c;};

  const baseNova=fireNovaPulse;
  fireNovaPulse=function augmentedNovaPulse(stacks,echoed=false){const x=player.x,y=player.y,size=weaponSizeMultiplier(),radius=(145+(stacks>=2?38:0)+(stacks>=5?18:0))*size;baseNova(stacks,echoed);if(state.weaponAugments?.nova&&!echoed)scheduleWeaponAction(420,()=>{for(const enemy of state.entities.enemies){if(enemy.dead)continue;const dx=x-enemy.x,dy=y-enemy.y,d=Math.hypot(dx,dy)||1;if(d<radius*1.05){const pull=(42+stacks*4)*enemyControlFactor(enemy);enemy.x+=dx/d*pull;enemy.y+=dy/d*pull;}}areaDamage(x,y,radius*.58,12+stacks*3.5,'#fff0c8','nova-implosion',{shake:false});shockwave(x,y,'#ffbd69',radius*.68,.38,2.6);});};

  // Ion, drone, spiral and mirror augments are owned by their final combat wrappers.

  const baseKill=killEnemy;let arcRicochetGuard=false;
  killEnemy=function augmentedArcKill(enemy,opts={}){const wasAlive=enemy&&!enemy.dead,x=enemy?.x||0,y=enemy?.y||0,source=String(opts.source||'');baseKill(enemy,opts);if(arcRicochetGuard||!wasAlive||!enemy?.dead||!state.weaponAugments?.arc||!['arc','arc-return'].includes(source))return;const range=weaponRange('arc'),killRange2=(range*1.25)**2,playerRange2=range*range;let eligible=0;for(const e of state.entities.enemies){if(!e||e.dead||e===enemy)continue;const dx=e.x-x,dy=e.y-y;if(dx*dx+dy*dy>killRange2)continue;const px=e.x-player.x,py=e.y-player.y;if(px*px+py*py<=playerRange2)eligible++;}if(!eligible)return;let pick=Math.floor(Math.random()*eligible),target=null;for(const e of state.entities.enemies){if(!e||e.dead||e===enemy)continue;const dx=e.x-x,dy=e.y-y;if(dx*dx+dy*dy>killRange2)continue;const px=e.x-player.x,py=e.y-player.y;if(px*px+py*py>playerRange2)continue;if(pick--===0){target=e;break;}}if(!target)return;arcRicochetGuard=true;try{fireBoomerang(target,Math.max(1,weaponCount('arc')),false,{x,y},true);}finally{arcRicochetGuard=false;}};

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
