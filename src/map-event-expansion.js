(function(){
  const compact=()=>matchMedia('(pointer: coarse)').matches||innerWidth<760;
  const lang=()=>GAME_SETTINGS.language||'ko';
  const L={
    ko:{
      voidName:'공허 균열',voidDesc:'균열 너머의 존재에게 도전.',enter:'균열 진입',enterDesc:'공허 포식자와 전투.',leave:'떠난다',leaveDesc:'균열을 닫고 이동.',voidBoss:'공허 포식자',
      crashName:'추락한 우주선',crashDesc:'파손된 방어 시스템의 강제 교전.',crashWave:'방어 시스템 가동',salvage:'잔해 회수',
      vaultName:'성운 보관소',vaultDesc:'보관된 성운 에너지의 능력 강화.',choose:'하나를 선택하세요',
      passive:'회수 모듈',passiveDesc:'무작위 패시브 중첩 +1.',weapon:'무기 공명',weaponDesc:'보유 무기 중첩 +1.',repair:'함선 코어',repairDesc:'최대 체력 +6, 체력 완전 회복, 보호막 +15.',
      power:'출력 보정',powerDesc:'모든 피해 +7%.',haste:'시간 보정',hasteDesc:'공격 주기 -6%.',magnet:'중력 보정',magnetDesc:'자석 범위 +32.'
    },
    en:{
      voidName:'VOID RIFT',voidDesc:'Challenge the presence beyond the rift.',enter:'ENTER RIFT',enterDesc:'Fight the Void Devourer.',leave:'LEAVE',leaveDesc:'Seal the rift and move on.',voidBoss:'Void Devourer',
      crashName:'CRASHED STARSHIP',crashDesc:'Forced combat against a damaged defense system.',crashWave:'DEFENSE SYSTEM ACTIVE',salvage:'RECOVER WRECKAGE',
      vaultName:'NEBULA VAULT',vaultDesc:'Enhance an ability with stored nebula energy.',choose:'Choose one',
      passive:'Recovery Module',passiveDesc:'Random passive stack +1.',weapon:'Weapon Resonance',weaponDesc:'Owned weapon stack +1.',repair:'Ship Core',repairDesc:'Max HP +6, full heal, shield +15.',
      power:'Output Calibration',powerDesc:'All damage +7%.',haste:'Time Calibration',hasteDesc:'Attack interval -6%.',magnet:'Gravity Calibration',magnetDesc:'Pickup radius +32.'
    },
    ja:{
      voidName:'虚空の亀裂',voidDesc:'亀裂の向こう側の存在に挑戦。',enter:'亀裂へ入る',enterDesc:'虚空の捕食者と戦闘。',leave:'立ち去る',leaveDesc:'亀裂を閉じて移動。',voidBoss:'虚空の捕食者',
      crashName:'墜落宇宙船',crashDesc:'破損した防衛システムとの強制戦闘。',crashWave:'防衛システム起動',salvage:'残骸回収',
      vaultName:'星雲保管庫',vaultDesc:'保管された星雲エネルギーで能力強化。',choose:'1つ選択',
      passive:'回収モジュール',passiveDesc:'ランダムパッシブ重複+1。',weapon:'武器共鳴',weaponDesc:'所持武器重複+1。',repair:'船体コア',repairDesc:'最大HP+6、全回復、シールド+15。',
      power:'出力補正',powerDesc:'全ダメージ+7%。',haste:'時間補正',hasteDesc:'攻撃間隔-6%。',magnet:'重力補正',magnetDesc:'回収範囲+32。'
    },
    'zh-CN':{
      voidName:'虚空裂隙',voidDesc:'挑战裂隙另一侧的存在。',enter:'进入裂隙',enterDesc:'与虚空吞噬者战斗。',leave:'离开',leaveDesc:'关闭裂隙并离开。',voidBoss:'虚空吞噬者',
      crashName:'坠毁飞船',crashDesc:'与损坏的防御系统强制交战。',crashWave:'防御系统启动',salvage:'回收残骸',
      vaultName:'星云储藏库',vaultDesc:'使用储存的星云能量强化能力。',choose:'选择一项',
      passive:'回收模块',passiveDesc:'随机被动叠加+1。',weapon:'武器共鸣',weaponDesc:'已持有武器叠加+1。',repair:'飞船核心',repairDesc:'最大生命+6，完全恢复，护盾+15。',
      power:'输出校准',powerDesc:'全部伤害+7%。',haste:'时间校准',hasteDesc:'攻击间隔-6%。',magnet:'重力校准',magnetDesc:'拾取范围+32。'
    },
    es:{
      voidName:'GRIETA DEL VACÍO',voidDesc:'Desafía a la presencia tras la grieta.',enter:'ENTRAR',enterDesc:'Lucha contra el Devorador del Vacío.',leave:'MARCHARSE',leaveDesc:'Sella la grieta y continúa.',voidBoss:'Devorador del Vacío',
      crashName:'NAVE ESTRELLADA',crashDesc:'Combate forzado contra el sistema defensivo dañado.',crashWave:'SISTEMA DEFENSIVO ACTIVO',salvage:'RECUPERAR RESTOS',
      vaultName:'BÓVEDA NEBULAR',vaultDesc:'Mejora una habilidad con energía nebular almacenada.',choose:'Elige uno',
      passive:'Módulo Recuperado',passiveDesc:'Acumulación de pasiva aleatoria +1.',weapon:'Resonancia de Arma',weaponDesc:'Acumulación de arma poseída +1.',repair:'Núcleo de Nave',repairDesc:'Vida máxima +6, curación total, escudo +15.',
      power:'Calibración de Potencia',powerDesc:'Todo el daño +7%.',haste:'Calibración Temporal',hasteDesc:'Intervalo de ataque -6%.',magnet:'Calibración Gravitatoria',magnetDesc:'Radio de recogida +32.'
    },
    fr:{
      voidName:'FAILLE DU NÉANT',voidDesc:'Défiez la présence derrière la faille.',enter:'ENTRER',enterDesc:'Affrontez le Dévoreur du Néant.',leave:'PARTIR',leaveDesc:'Scellez la faille et poursuivez.',voidBoss:'Dévoreur du Néant',
      crashName:'VAISSEAU ÉCRASÉ',crashDesc:'Combat forcé contre un système de défense endommagé.',crashWave:'SYSTÈME DE DÉFENSE ACTIF',salvage:'RÉCUPÉRER L’ÉPAVE',
      vaultName:'COFFRE NÉBULAIRE',vaultDesc:'Renforcez une capacité avec l’énergie stockée.',choose:'Choisissez-en une',
      passive:'Module Récupéré',passiveDesc:'Cumul passif aléatoire +1.',weapon:'Résonance d’Arme',weaponDesc:'Cumul d’une arme possédée +1.',repair:'Cœur du Vaisseau',repairDesc:'PV max +6, soin complet, bouclier +15.',
      power:'Calibrage de Puissance',powerDesc:'Tous les dégâts +7 %.',haste:'Calibrage Temporel',hasteDesc:'Intervalle d’attaque -6 %.',magnet:'Calibrage Gravitationnel',magnetDesc:'Portée de collecte +32.'
    }
  };
  const tx=k=>(L[lang()]||L.en)[k];

  state.mapRewardTimer=Infinity;
  state.entities.mapRewards=state.entities.mapRewards||[];
  state.entities.mapRewards.length=0;
  document.querySelector('#mapRewardScreen')?.classList.add('hidden');

  state.entities.mapEvents=state.entities.mapEvents||[];
  state.mapEventTimer=52;
  state.mapEventActive=null;
  state.mapEventDeck=[];
  state.nebulaBoosts=state.nebulaBoosts||{power:0,haste:0,magnet:0};

  const overlay=document.createElement('section');
  overlay.id='worldEventScreen';overlay.className='overlay hidden';
  overlay.innerHTML='<div class="world-event-shell"><div class="choice-head"><p id="worldEventKicker">SIGNAL</p><h2 id="worldEventTitle"></h2><span id="worldEventPrompt"></span></div><div id="worldEventCards" class="world-event-cards"></div></div>';
  document.querySelector('#app').appendChild(overlay);
  const style=document.createElement('style');style.textContent=`
    #worldEventScreen{z-index:67;background:radial-gradient(circle at 50% 43%,rgba(55,69,150,.42),rgba(2,4,14,.95));backdrop-filter:blur(10px)}
    .world-event-shell{width:min(980px,95vw)}.world-event-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.world-event-card{min-height:220px;padding:20px;text-align:left;color:#f6f9ff;border:1px solid color-mix(in srgb,var(--event-color) 38%,rgba(255,255,255,.1));border-radius:20px;background:linear-gradient(145deg,rgba(27,37,79,.98),rgba(6,9,25,.99));box-shadow:0 22px 58px rgba(0,0,0,.44);cursor:pointer;transition:.18s;position:relative;overflow:hidden}.world-event-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 0%,color-mix(in srgb,var(--event-color) 20%,transparent),transparent 48%)}.world-event-card:hover{transform:translateY(-5px);border-color:var(--event-color)}.world-event-card>*{position:relative}.world-event-card span{display:block;font-size:40px;color:var(--event-color);text-shadow:0 0 24px var(--event-color)}.world-event-card b{display:block;font-size:20px;margin:15px 0 8px}.world-event-card p{margin:0;color:#abb7d5;font-size:12px;line-height:1.6}@media(max-width:720px){.world-event-cards{grid-template-columns:1fr;max-height:66vh;overflow:auto}.world-event-card{min-height:140px}}
  `;document.head.appendChild(style);

  function scheduleNext(min=76,max=108){state.mapEventTimer=rand(min,max);state.mapEventActive=null;state.entities.mapEvents.length=0;}
  function refillDeck(){state.mapEventDeck=['void','crash','vault'].sort(()=>Math.random()-.5);}
  function nextType(){if(!state.mapEventDeck.length)refillDeck();return state.mapEventDeck.pop();}
  function spawnMarker(){
    const type=nextType(),a=Math.random()*TAU,d=rand(720,930);
    state.entities.mapEvents=[{type,x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,pulse:0}];
  }
  function eventMeta(type){
    if(type==='void')return{name:tx('voidName'),desc:tx('voidDesc'),color:'#b36bff',icon:'◉'};
    if(type==='crash')return{name:tx('crashName'),desc:tx('crashDesc'),color:'#ff9a62',icon:'⌁'};
    return{name:tx('vaultName'),desc:tx('vaultDesc'),color:'#75eaff',icon:'◇'};
  }
  function card(icon,name,desc,color,action){return{icon,name,desc,color,action};}
  function openCards(title,prompt,cards,kicker='SIGNAL'){
    state.mode='worldEvent';ui.touch.classList.add('hidden');overlay.classList.remove('hidden');
    document.querySelector('#worldEventKicker').textContent=kicker;document.querySelector('#worldEventTitle').textContent=title;document.querySelector('#worldEventPrompt').textContent=prompt;
    const root=document.querySelector('#worldEventCards');root.innerHTML='';
    for(const c of cards){const el=document.createElement('button');el.className='world-event-card';el.style.setProperty('--event-color',c.color);el.innerHTML=`<span>${c.icon}</span><b>${c.name}</b><p>${c.desc}</p>`;el.onclick=()=>{overlay.classList.add('hidden');c.action();};root.appendChild(el);}
  }
  function randomPassive(){
    const keys=Object.keys(PASSIVES).filter(k=>stat(k)<PASSIVES[k].max);if(!keys.length)return false;
    const key=keys[Math.floor(Math.random()*keys.length)];state.passives[key]=(state.passives[key]||0)+1;
    if(key==='vitality'){player.maxHp+=15;player.hp=Math.min(player.maxHp,player.hp+15);}return true;
  }
  function randomOwnedWeapon(){
    const keys=Object.keys(state.weaponStacks).filter(k=>weaponCount(k)>0&&weaponCount(k)<6);if(!keys.length)return false;
    const key=keys[Math.floor(Math.random()*keys.length)];state.weaponStacks[key]=(state.weaponStacks[key]||0)+1;return true;
  }
  function finishChoice(){state.mode='playing';renderLoadout();updateHUD();scheduleNext();if(compact())ui.touch.classList.remove('hidden');audio.level();}

  function openVault(){
    const cards=[
      card('▲',tx('power'),tx('powerDesc'),'#ff7f9f',()=>{state.nebulaBoosts.power++;finishChoice();}),
      card('◎',tx('haste'),tx('hasteDesc'),'#8fffe0',()=>{state.nebulaBoosts.haste++;finishChoice();}),
      card('⊕',tx('magnet'),tx('magnetDesc'),'#ffdc75',()=>{state.nebulaBoosts.magnet++;finishChoice();})
    ];
    openCards(tx('vaultName'),tx('choose'),cards,'NEBULA VAULT');
  }
  function openSalvage(){
    const cards=[
      card('◆',tx('passive'),tx('passiveDesc'),'#c8a8ff',()=>{randomPassive();finishChoice();}),
      card('✦',tx('weapon'),tx('weaponDesc'),'#89eaff',()=>{randomOwnedWeapon()||randomPassive();finishChoice();}),
      card('✚',tx('repair'),tx('repairDesc'),'#7df0ac',()=>{player.maxHp+=6;player.hp=player.maxHp;player.shield=Math.min(60,player.shield+15);finishChoice();})
    ];
    openCards(tx('salvage'),tx('choose'),cards,'SALVAGE');
  }
  function startVoidBoss(){
    state.mode='playing';if(compact())ui.touch.classList.remove('hidden');
    const boss=spawnEnemy('boss');
    if(!boss){scheduleNext(22,30);return;}
    boss.eventKind='void';boss.name=tx('voidBoss');boss.variant='eclipse';boss.color='#a85cff';boss.hp*=1.18;boss.maxHp=boss.hp;boss.damage*=1.08;boss.speed*=1.04;
    state.mapEventActive={type:'void',bossId:boss.id};showBossNotice(boss.name,'VOID RIFT');
  }
  function openVoidChoice(){
    openCards(tx('voidName'),tx('voidDesc'),[
      card('◉',tx('enter'),tx('enterDesc'),'#b36bff',startVoidBoss),
      card('×',tx('leave'),tx('leaveDesc'),'#8a96b8',()=>{state.mode='playing';scheduleNext(46,68);if(compact())ui.touch.classList.remove('hidden');})
    ],'VOID RIFT');
  }

  function spawnCrashUnit(){
    const e=spawnEnemy('normal');if(!e)return false;
    e.eventKind='crash';e.color=e.type==='fast'?'#ffb06a':e.type==='tank'?'#ff805d':'#f0a06e';e.hp*=1.08;e.maxHp=e.hp;e.speed*=1.04;e.xp*=1.15;return true;
  }
  function startCrash(){
    const base=7+Math.min(5,Math.floor(state.time/150));
    state.mapEventActive={type:'crash',wave:0,waves:[base,base+2,base+4],remaining:base,spawnCd:0,between:0};
    showBossNotice(tx('crashName'),tx('crashWave'));shockwave(player.x,player.y,'#ff9a62',150,.65,5);
  }
  function updateCrash(dt){
    const ev=state.mapEventActive;if(!ev||ev.type!=='crash')return;
    const alive=state.entities.enemies.filter(e=>!e.dead&&e.eventKind==='crash').length;
    if(ev.remaining>0){ev.spawnCd-=dt;if(ev.spawnCd<=0){ev.spawnCd=.14;if(spawnCrashUnit())ev.remaining--;}}
    else if(alive===0){
      ev.between-=dt;
      if(ev.between<=0){ev.wave++;if(ev.wave>=ev.waves.length){state.mapEventActive=null;openSalvage();return;}ev.remaining=ev.waves[ev.wave];ev.between=1.35;showBossNotice(`${tx('crashName')} ${ev.wave+1}/3`,tx('crashWave'));}
    }
  }

  function triggerMarker(marker){
    if(state.entities.enemies.some(e=>!e.dead&&(e.type==='mini'||e.type==='boss')))return;
    state.entities.mapEvents.length=0;
    if(marker.type==='void')openVoidChoice();else if(marker.type==='crash')startCrash();else openVault();
  }
  function updateEvents(dt){
    if(state.mode!=='playing')return;
    updateCrash(dt);
    if(state.mapEventActive)return;
    state.mapEventTimer-=dt;
    if(state.mapEventTimer<=0&&!state.entities.mapEvents.length&&!state.entities.enemies.some(e=>!e.dead&&(e.type==='mini'||e.type==='boss')))spawnMarker();
    for(const marker of state.entities.mapEvents){marker.pulse+=dt;if(Math.hypot(marker.x-player.x,marker.y-player.y)<55+player.r){triggerMarker(marker);break;}}
  }

  const baseUpdateGems=updateGems;updateGems=function(dt){baseUpdateGems(dt);updateEvents(dt);};
  const baseUpdateSpawning=updateSpawning;updateSpawning=function(dt){if(state.mapEventActive&&(state.mapEventActive.type==='crash'||state.mapEventActive.type==='void'))return;baseUpdateSpawning(dt);};
  const baseKill=killEnemy;killEnemy=function(enemy,opts={}){const voidKill=enemy?.eventKind==='void';baseKill(enemy,opts);if(voidKill){state.mapEventActive=null;state.encounterTimer=Math.max(28,state.encounterTimer||0);scheduleNext(88,118);}};

  const baseDamage=damageMult;damageMult=function(){return baseDamage()*(1+(state.nebulaBoosts?.power||0)*.07);};
  const baseHaste=hasteMult;hasteMult=function(){return Math.max(.20,baseHaste()*(1-(state.nebulaBoosts?.haste||0)*.06));};
  const baseMagnet=magnetRange;magnetRange=function(){return baseMagnet()+(state.nebulaBoosts?.magnet||0)*32;};

  function drawMarkerShape(marker,p,t){
    const meta=eventMeta(marker.type);ctx.save();ctx.translate(p.x,p.y);ctx.shadowBlur=26;ctx.shadowColor=meta.color;ctx.strokeStyle=meta.color;ctx.fillStyle=meta.color;ctx.lineWidth=2;
    if(marker.type==='void'){
      ctx.rotate(t*.8);for(let i=0;i<3;i++){ctx.globalAlpha=.75-i*.18;ctx.beginPath();ctx.ellipse(0,0,20+i*8,8+i*3,i*.8,0,TAU);ctx.stroke();}ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(0,0,11,0,TAU);ctx.fill();
    }else if(marker.type==='crash'){
      ctx.rotate(-.35+Math.sin(t*1.2)*.05);ctx.beginPath();ctx.moveTo(-25,11);ctx.lineTo(21,-8);ctx.lineTo(13,15);ctx.lineTo(-7,19);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(-18,6);ctx.lineTo(-31,-10);ctx.moveTo(4,2);ctx.lineTo(22,-21);ctx.stroke();
    }else{
      ctx.rotate(t*.45);ctx.strokeRect(-18,-18,36,36);ctx.rotate(-t*.9);ctx.beginPath();ctx.moveTo(0,-29);ctx.lineTo(21,0);ctx.lineTo(0,29);ctx.lineTo(-21,0);ctx.closePath();ctx.stroke();
    }
    ctx.restore();
  }
  const baseDrawGems=drawGems;drawGems=function(){
    baseDrawGems();const t=performance.now()/1000;
    for(const marker of state.entities.mapEvents){
      const p=worldToScreen(marker.x,marker.y),meta=eventMeta(marker.type),on=p.x>65&&p.x<vw-65&&p.y>65&&p.y<vh-65;
      if(on)drawMarkerShape(marker,p,t);
      else{const cx=vw/2,cy=vh/2,dx=p.x-cx,dy=p.y-cy,a=Math.atan2(dy,dx),margin=43,scale=Math.min((vw/2-margin)/Math.max(1,Math.abs(dx)),(vh/2-margin)/Math.max(1,Math.abs(dy))),x=cx+dx*scale,y=cy+dy*scale;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=meta.color;ctx.shadowBlur=18;ctx.shadowColor=meta.color;ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-9,-8);ctx.lineTo(-5,0);ctx.lineTo(-9,8);ctx.closePath();ctx.fill();ctx.restore();}
    }
  };

  if(typeof bossDisplayName==='function'){
    const baseBossName=bossDisplayName;bossDisplayName=function(enemy){return enemy?.eventKind==='void'?tx('voidBoss'):baseBossName(enemy);};
  }
  const baseToggle=togglePause;togglePause=function(force){if(state.mode==='worldEvent')return;baseToggle(force);};
  const baseReset=resetGame;resetGame=function(){baseReset();state.mapRewardTimer=Infinity;state.entities.mapRewards.length=0;state.entities.mapEvents.length=0;state.mapEventTimer=52;state.mapEventActive=null;state.mapEventDeck=[];state.nebulaBoosts={power:0,haste:0,magnet:0};overlay.classList.add('hidden');};
  const baseMenu=showMainMenu;showMainMenu=function(){overlay.classList.add('hidden');state.entities.mapEvents.length=0;state.mapEventActive=null;return baseMenu();};
  const baseEnd=endGame;endGame=function(){overlay.classList.add('hidden');state.mapEventActive=null;return baseEnd();};
})();
