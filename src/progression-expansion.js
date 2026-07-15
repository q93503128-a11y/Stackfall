(function(){
  STACK_EFFECTS.core=[['초기 점화','기본 광자탄 자동 발사.'],['쌍발 코어','발사 개수 +1.'],['코어 관통','투사체 관통 +1.'],['펄스 폭발','명중 지점의 소형 범위 폭발.'],['삼중 코어','발사 개수 +1.'],['항성 펄스','6회마다 대형 관통 광자탄 발사.']];
  STACK_EFFECTS.ember=[['첫 별','폭발성 별빛 탄환 발사.'],['쌍성 사격','발사 개수 +1.'],['성핵 관통','투사체 관통 +1.'],['성운 분열','명중 시 별가루 3개 분열.'],['삼중 성렬','발사 개수 +1.'],['초신성 탄두','7회마다 대형 관통 초신성탄 발사.']];
  STACK_EFFECTS.comet=[['결정 장창','관통 혜성 창 발사.'],['이중 궤적','발사 개수 +1.'],['심층 관통','창 크기와 관통 횟수 증가.'],['혜성 파편','관통 지점의 파편 4개 방출.'],['잔광 궤도','비행 경로의 짧은 지속 피해.'],['대충돌','소멸 지점의 대형 범위 폭발.']];
  STACK_EFFECTS.arc=[['성운 비행','곡선 왕복 칼날 발사.'],['쌍곡선','발사 개수 +1.'],['광폭 선회','근거리 곡률과 칼날 크기 증가.'],['귀환 절단','직선 귀환과 두 번째 타격.'],['잔광 띠','왕복 경로의 짧은 지속 피해.'],['삼중 나선','발사 개수 +1.']];
  STACK_EFFECTS.blade=[['월광 기동','지속형 광자 칼날 공전.'],['쌍월 궤도','칼날 개수 +1.'],['가속 궤도','공전 속도와 공격 반경 증가.'],['성흔 파동','적중 지점의 관통 절단파 발사.'],['삼월식','칼날 개수 +1.'],['천체 분쇄기','연쇄 처치 6회마다 별빛 폭발.']];
  STACK_EFFECTS.prism=[['단일 프리즘','공전 프리즘과 관통 광선.'],['쌍둥이 프리즘','프리즘 개수 +1.'],['광폭 굴절','광선 폭과 경로 판정 증가.'],['성좌 연결','프리즘 사이 연결 광선의 접촉 피해.'],['다중 초점','프리즘당 광선 개수 +1.'],['천구 의식','프리즘 개수 +1.']];
  STACK_EFFECTS.gravity=[['특이점 씨앗','중력 우물 주기적 생성.'],['조석 고정','흡입 반경과 흡입력 증가.'],['장수 특이점','중력 우물 지속시간 증가.'],['붕괴핵','중심부 지속 피해.'],['압축 붕괴','중심 피해와 흡입력 추가 증가.'],['쌍둥이 특이점','우물 개수 +1.']];

  const baseTexts={
    magnet:{ko:['자석 코어','결정 흡수 범위 +34'],en:['Magnet Core','Pickup range +34']},
    echo:{ko:['에코 비콘','발사·설치형 장비 발동을 복제하고 지속형 칼날에 잔상 타격 추가.'],en:['Echo Beacon','Repeats fired and deployed equipment activations; persistent blades gain echo strikes.']},
    power:{ko:['출력 증폭','모든 피해 +16%'],en:['Power Amplifier','All damage +16%']},
    haste:{ko:['가속 회로','공격 주기 10% 단축'],en:['Acceleration Circuit','Attack interval -10%']},
    vitality:{ko:['재생 장갑','최대 체력 +20, 즉시 체력 30 회복'],en:['Regenerative Plating','Max health +20 and immediately restore 30 health']},
    speed:{ko:['벡터 부스터','이동 속도 +9%'],en:['Vector Booster','Move speed +9%']},
    crit:{ko:['취약점 해석','치명타 확률 +6%'],en:['Weakness Analysis','Critical chance +6%']},
    chain:{ko:['연쇄 과부하','현재 연쇄가 높을수록 유지시간과 피해 증가.'],en:['Chain Overload','Higher current chain increases duration and damage.']},
    greed:{ko:['개척 계약','적 체력 +4%, 경험치 +22%'],en:['Frontier Contract','Enemy health +4%, experience +22%']},
    armor:{ko:['충격 흡수재','받는 피해 -7.5%'],en:['Impact Absorber','Damage taken -7.5%']}
  };
  for(const[key,rows]of Object.entries(baseTexts)){
    if(PASSIVE_TEXT[key]){PASSIVE_TEXT[key].ko=rows.ko;PASSIVE_TEXT[key].en=rows.en;}
    if(PASSIVES[key])PASSIVES[key].desc=rows.ko[1];
  }

  const NEW_PASSIVES={
    chainDrive:{name:'연쇄 추진기',icon:'»',color:'#7ce8ff',desc:'현재 연쇄가 높을수록 공격 주기 단축',max:6},
    chainBurst:{name:'연쇄 폭심',icon:'✹',color:'#ff7b9e',desc:'15연쇄마다 현재 연쇄에 비례한 중심 폭발',max:6},
    chainRecovery:{name:'연쇄 회수',icon:'✚',color:'#74f2a7',desc:'20연쇄마다 현재 연쇄에 비례한 체력 회복',max:5},
    chainField:{name:'전리품 공명',icon:'⊙',color:'#ffcc5c',desc:'현재 연쇄에 비례한 자석 범위 증가',max:6},
    eliteHunter:{name:'거성 사냥꾼',icon:'♜',color:'#e6b2ff',desc:'중간보스와 보스 피해 +12%',max:6},
    pierce:{name:'관통 렌즈',icon:'⇢',color:'#b5f5ff',desc:'투사체 관통 +1',max:4},
    regen:{name:'자가 복원',icon:'♻',color:'#88f0ad',desc:'4초마다 체력 2.5 회복',max:6},
    wisdom:{name:'성운 통찰',icon:'✧',color:'#bba6ff',desc:'경험치 획득량 +10%',max:8},
    overdrive:{name:'임계 과출력',icon:'▲',color:'#ff806f',desc:'체력 45% 미만일 때 피해 +14%',max:5},
    projectileSize:{name:'광자 팽창',icon:'◉',color:'#8fe9ff',desc:'플레이어 투사체 크기 +10%',max:6}
  };
  Object.assign(PASSIVES,NEW_PASSIVES);
  const PT={
    chainDrive:{ko:['연쇄 추진기','현재 연쇄 10회마다 공격 주기 단축량 증가'],en:['Chain Thruster','Attack interval reduction grows every 10 current chain']},
    chainBurst:{ko:['연쇄 폭심','15연쇄마다 플레이어 중심 폭발. 범위와 피해가 현재 연쇄에 비례'],en:['Chain Detonation','Every 15 chain triggers a player-centered blast scaling in radius and damage']},
    chainRecovery:{ko:['연쇄 회수','20연쇄마다 현재 연쇄에 비례한 최대 체력 회복'],en:['Chain Recovery','Every 20 chain restores max-health percentage scaling with current chain']},
    chainField:{ko:['전리품 공명','현재 연쇄에 비례해 자석 범위 증가'],en:['Loot Resonance','Pickup radius increases with current chain']},
    eliteHunter:{ko:['거성 사냥꾼','중간보스와 보스 피해 +12%'],en:['Giant Hunter','Damage to mini-bosses and bosses +12%']},
    pierce:{ko:['관통 렌즈','투사체 관통 +1'],en:['Piercing Lens','Projectile pierce +1']},
    regen:{ko:['자가 복원','4초마다 체력 2.5 회복'],en:['Self Repair','Restores 2.5 health every 4 seconds']},
    wisdom:{ko:['성운 통찰','경험치 획득량 +10%'],en:['Nebula Insight','Experience gained +10%']},
    overdrive:{ko:['임계 과출력','체력 45% 미만일 때 피해 +14%'],en:['Critical Overdrive','Damage +14% below 45% health']},
    projectileSize:{ko:['광자 팽창','플레이어 투사체 크기 +10%'],en:['Photon Expansion','Player projectile size +10%']}
  };
  for(const[key,row]of Object.entries(PT)){row.ja=row.en;row['zh-CN']=row.en;row.es=row.en;row.fr=row.en;}
  Object.assign(PASSIVE_TEXT,PT);

  const currentChain=()=>Math.max(0,Number(state.combo)||0);
  const legacyChainDamageBonus=()=>Math.min(.30,Math.floor(currentChain()/5)*.03);
  function scaledChainDamageBonus(){
    const stacks=stat('chain'),tiers=Math.floor(currentChain()/5);
    return tiers?Math.min(.48,tiers*(.02+stacks*.003)):0;
  }
  function scaledChainDurationMultiplier(){
    const stacks=stat('chain'),combo=currentChain(),nebula=state.nebulaExtras?.chain||0;
    const base=1+stacks*.10,momentum=1+Math.min(.80,combo*stacks*.005);
    return Math.min(3.2,base*momentum*(1+nebula*.28));
  }
  window.chainDamageBonus=scaledChainDamageBonus;
  window.chainDurationMultiplier=scaledChainDurationMultiplier;

  const baseHaste=hasteMult;
  hasteMult=function(){
    const tiers=Math.floor(currentChain()/10),chainBoost=Math.min(.48,tiers*stat('chainDrive')*.012);
    return Math.max(.14,baseHaste()*(1-chainBoost));
  };
  const baseMagnet=magnetRange;
  magnetRange=function(){
    const stacks=stat('chainField'),bonus=Math.min(180,currentChain()*(.55+stacks*.38));
    return baseMagnet()+(stacks?bonus:0);
  };
  const baseXp=xpMult;
  xpMult=function(){return baseXp()*(1+stat('wisdom')*.10);};
  const baseDamage=damageMult;
  damageMult=function(){
    const normalized=baseDamage()/Math.max(.001,1+legacyChainDamageBonus());
    const overdrive=player.hp/player.maxHp<.45?1+stat('overdrive')*.14:1;
    return normalized*(1+scaledChainDamageBonus())*overdrive;
  };
  const baseProjectile=spawnPlayerProjectile;
  spawnPlayerProjectile=function(data){
    const next={...data};
    next.pierce=(Number.isFinite(next.pierce)?next.pierce:0)+stat('pierce');
    next.r=(Number.isFinite(next.r)?next.r:4)*(1+stat('projectileSize')*.10);
    return baseProjectile(next);
  };
  const baseDeal=dealDamage;
  dealDamage=function(enemy,amount,opts={}){
    if(enemy&&(enemy.type==='mini'||enemy.type==='boss'))amount*=1+stat('eliteHunter')*.12;
    return baseDeal(enemy,amount,opts);
  };
  const baseUpdatePlayer=updatePlayer;
  updatePlayer=function(dt){
    baseUpdatePlayer(dt);
    const n=stat('regen');if(!n)return;
    player.regenTimer=(player.regenTimer||4)-dt;
    if(player.regenTimer<=0){player.regenTimer+=4;player.hp=Math.min(player.maxHp,player.hp+n*2.5);}
  };

  let chainEffectGuard=false;
  const baseKill=killEnemy;
  killEnemy=function(enemy,opts={}){
    baseKill(enemy,opts);
    if(chainEffectGuard||!enemy)return;
    const chain=currentChain(),burst=stat('chainBurst'),recovery=stat('chainRecovery');
    if(burst&&chain>0&&chain%15===0){
      const radius=90+burst*10+Math.min(100,chain*1.4);
      const damage=18+burst*8+chain*(.55+burst*.16)+state.level*.5;
      chainEffectGuard=true;areaDamage(player.x,player.y,radius,damage,'#ff7b9e');chainEffectGuard=false;
    }
    if(recovery&&chain>0&&chain%20===0){
      const fraction=Math.min(.28,recovery*(.012+chain*.0007));
      player.hp=Math.min(player.maxHp,player.hp+player.maxHp*fraction);
      shockwave(player.x,player.y,'#74f2a7',94+Math.min(90,chain),.34,2.6);
    }
  };

  window.updateEncounterDirector=function(dt){
    const elites=state.entities.enemies.filter(e=>!e.dead&&(e.type==='mini'||e.type==='boss'));
    if(elites.length){state.encounterWasActive=true;return;}
    if((state.nextApexAt||Infinity)-state.time<55)return;
    if(state.encounterWasActive){state.encounterWasActive=false;state.encounterTimer=Math.max(32,45-Math.min(13,state.time/180));return;}
    state.encounterTimer=(state.encounterTimer??58)-dt;if(state.encounterTimer>0)return;
    const step=(state.encounterStep||0)%3;
    if(step<2){const count=state.time>=900?2:1;for(let i=0;i<count;i++)spawnEnemy('mini');}
    else{spawnEnemy('boss');const escorts=state.time>=2400?2:state.time>=1200?1:0;for(let i=0;i<escorts;i++)spawnEnemy('mini');}
    state.encounterStep=(step+1)%3;state.encounterWasActive=true;state.encounterTimer=Infinity;
  };
  updateSpawning=function(dt){
    if(typeof updateApexSystems==='function'&&updateApexSystems(dt))return;
    if(typeof worldEventBlocksSpawning==='function'&&worldEventBlocksSpawning())return;
    state.spawnTimer-=dt;
    const elapsed=Math.max(0,state.time||0),compact=compactDevice();
    const rate=Math.max(compact?.46:.38,1.58/(1+elapsed/260));
    if(state.spawnTimer<=0){
      state.spawnTimer=rate;
      const count=1+Math.min(compact?2:3,Math.floor(elapsed/240));
      for(let i=0;i<count;i++)spawnEnemy('normal');
    }
    updateEncounterDirector(dt);
  };

  function choiceText(c){const weaponLike=c.kind==='weapon'||c.kind==='core';return weaponLike?weaponText(c.key):passiveText(c.key);}
  function normalizeChoice(c){
    if(!c||!['core','weapon','passive'].includes(c.kind)||!c.key)return null;
    const source=c.kind==='passive'?PASSIVES[c.key]:WEAPONS[c.key];
    if(!source)return null;
    return{...source,...c,color:c.color||source.color||'#aeeeff',icon:c.icon||source.icon||'✦'};
  }
  function collectChoices(count){
    const result=[],seen=new Set();
    const take=list=>{for(const item of list||[]){const c=normalizeChoice(item);if(!c)continue;const id=`${c.kind}:${c.key}`;if(seen.has(id))continue;seen.add(id);result.push(c);if(result.length>=count)break;}};
    take(rollChoices(Math.max(9,count*3)));
    if(result.length<count){
      const fallback=[];
      const coreCount=weaponCount('core');
      if(coreCount<6)fallback.push({kind:'core',key:'core',...WEAPONS.core,weight:1});
      for(const[key,w]of Object.entries(WEAPONS)){
        if(key==='core'||w.starter===false)continue;
        const owned=weaponCount(key),slots=state.weaponSlots.length;
        if(owned<6&&(owned>0||slots<6))fallback.push({kind:'weapon',key,...w,weight:1});
      }
      for(const[key,p]of Object.entries(PASSIVES))if(stat(key)<p.max)fallback.push({kind:'passive',key,...p,weight:1});
      take(fallback.sort(()=>Math.random()-.5));
    }
    return result.slice(0,count);
  }
  function applyChoiceSafely(c){
    if(c.kind==='core'){
      const after=weaponCount('core')+1;state.weaponStacks.core=after;
      if(typeof showStackEffect==='function')showStackEffect('core',after);return;
    }
    if(c.kind==='weapon'){
      const before=weaponCount(c.key),after=before+1;state.weaponStacks[c.key]=after;
      if(before===0&&!state.weaponSlots.includes(c.key))state.weaponSlots.push(c.key);
      if(typeof showStackEffect==='function')showStackEffect(c.key,after);
      if(c.key==='bulwark'){player.maxHp+=8;player.hp=Math.min(player.maxHp,player.hp+8);}return;
    }
    state.passives[c.key]=stat(c.key)+1;
    if(c.key==='vitality'){player.maxHp+=20;player.hp=Math.min(player.maxHp,player.hp+30);}
    if(c.key==='stellarLife'){
      const ratio=player.hp/Math.max(1,player.maxHp);
      player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.08));
      player.hp=Math.max(1,Math.min(player.maxHp,Math.round(player.maxHp*ratio)));
    }
  }
  function finishChoiceSafely(){
    state.choiceOpening=false;state.choiceLocked=false;
    ui.choice.classList.add('hidden');ui.choiceCards.innerHTML='';state.mode='playing';
    renderLoadout();updateHUD();
    if(typeof syncAbilityLedgerVisibility==='function')syncAbilityLedgerVisibility();
    setTimeout(()=>{if(state.mode==='playing'&&typeof tryLevelUp==='function')tryLevelUp();},0);
  }
  function buildChoiceCard(c){
    const weaponLike=c.kind==='weapon'||c.kind==='core',text=choiceText(c),current=weaponLike?weaponCount(c.key):stat(c.key);
    const next=weaponLike?stackEffectText(c.key,current+1):null,el=document.createElement('button');
    el.type='button';el.className='choice-card';
    el.style.setProperty('--card-accent',c.color);el.style.setProperty('--card-glow',hexToRgba(c.color,.22));
    const type=c.kind==='core'?tr('choice.basic'):c.kind==='weapon'?tr('choice.equipment'):tr('choice.passive');
    const countLabel=weaponLike?tr('choice.stack'):tr('choice.owned');
    el.innerHTML=`<span class="type">${type}</span><span class="stack-info">${countLabel} ${current} → ${current+1}</span><div class="big-icon">${c.icon}</div><h3>${text.name}</h3><p>${text.desc}</p>${next?`<div class="resonance-preview"><b>${current+1} · ${next.name}</b><span>${next.desc}</span></div>`:''}`;
    el.addEventListener('click',()=>selectChoice(c),{once:true});
    return el;
  }
  openChoices=function openChoicesStable(){
    if(state.choiceOpening||state.choiceLocked||state.mode==='gameover'||state.mode==='menu')return;
    if(typeof closeAbilityLedger==='function')closeAbilityLedger(true);
    state.choiceOpening=true;ui.choice.classList.add('hidden');ui.choiceCards.innerHTML='';
    try{
      const choices=collectChoices(3);
      if(!choices.length){finishChoiceSafely();return;}
      const fragment=document.createDocumentFragment();
      for(const c of choices)fragment.appendChild(buildChoiceCard(c));
      ui.choiceCards.appendChild(fragment);
      state.choiceLocked=false;state.mode='choice';
      ui.choiceTitle.textContent=`${tr('choice.title')} ${state.level}`;ui.choiceKicker.textContent=tr('choice.kicker');
      ui.choice.classList.remove('hidden');audio.level();
      if(typeof syncAbilityLedgerVisibility==='function')syncAbilityLedgerVisibility();
    }catch(error){
      console.error('[Stackfall] level-up choices failed',error);
      state.choiceLocked=false;state.mode='playing';ui.choice.classList.add('hidden');ui.choiceCards.innerHTML='';
    }finally{state.choiceOpening=false;}
  };
  selectChoice=function selectChoiceStable(c){
    if(state.choiceLocked||state.mode!=='choice')return;
    state.choiceLocked=true;for(const button of ui.choiceCards.querySelectorAll('button'))button.disabled=true;
    try{applyChoiceSafely(c);}
    catch(error){console.error('[Stackfall] choice application failed',error,c);}
    finally{finishChoiceSafely();}
  };

  applyLanguage();renderStarterOptions();renderLoadout();updateHUD();
})();
