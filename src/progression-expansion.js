(function(){
  const numericTexts={
    magnet:{ko:['자석 코어','결정 흡수 범위 +34.'],en:['Magnet Core','Pickup range +34.']},
    echo:{ko:['에코 비콘','발사·설치형 장비 복제 확률 +7.5%.'],en:['Echo Beacon','Repeat chance for fired and deployed equipment +7.5%.']},
    power:{ko:['출력 증폭','모든 피해 +10%.'],en:['Power Amplifier','All damage +10%.']},
    haste:{ko:['가속 회로','장비 발동 주기 -10%.'],en:['Acceleration Circuit','Equipment interval -10%.']},
    vitality:{ko:['재생 장갑','최대 체력 +20, 즉시 체력 30 회복.'],en:['Regenerative Plating','Max health +20 and restore 30 health.']},
    speed:{ko:['벡터 부스터','이동 속도 +9%.'],en:['Vector Booster','Move speed +9%.']},
    crit:{ko:['취약점 해석','치명타 확률 +6%.'],en:['Weakness Analysis','Critical chance +6%.']},
    chain:{ko:['연쇄 과부하','연쇄 유지시간 +7%, 연쇄 피해 효율 증가.'],en:['Chain Overload','Chain duration +7%; chain damage efficiency increases.']},
    greed:{ko:['개척 계약','적 체력 +10%, 경험치 획득량 +30%.'],en:['Frontier Contract','Enemy health +10%, experience gained +30%.']},
    armor:{ko:['충격 흡수재','받는 피해 -7.5%.'],en:['Impact Absorber','Damage taken -7.5%.']}
  };
  for(const[key,row]of Object.entries(numericTexts)){if(PASSIVES[key])PASSIVES[key].desc=row.ko[1];if(PASSIVE_TEXT[key]){PASSIVE_TEXT[key].ko=row.ko;PASSIVE_TEXT[key].en=row.en;for(const code of['ja','zh-CN','es','fr'])PASSIVE_TEXT[key][code]=PASSIVE_TEXT[key][code]||row.en;}}

  const NEW_PASSIVES={
    chainDrive:{name:'연쇄 추진기',icon:'»',color:'#7ce8ff',desc:'연쇄 12회마다 장비 발동 주기 추가 단축.',max:12},
    chainBurst:{name:'연쇄 폭심',icon:'✹',color:'#ff7b9e',desc:'20연쇄마다 플레이어 중심 폭발.',max:8},
    chainRecovery:{name:'연쇄 회수',icon:'✚',color:'#74f2a7',desc:'30연쇄마다 최대 체력 비례 회복.',max:8},
    chainField:{name:'전리품 공명',icon:'⊙',color:'#ffcc5c',desc:'현재 연쇄에 따라 결정 흡수 범위 증가.',max:8},
    eliteHunter:{name:'거성 사냥꾼',icon:'♜',color:'#e6b2ff',desc:'중간보스·보스 피해 +15%.',max:6},
    pierce:{name:'관통 렌즈',icon:'⇢',color:'#b5f5ff',desc:'투사체 관통 +1.',max:4},
    regen:{name:'자가 복원',icon:'♻',color:'#88f0ad',desc:'4초마다 체력 2.5 회복.',max:6},
    wisdom:{name:'성운 통찰',icon:'✧',color:'#bba6ff',desc:'경험치 획득량 +10%.',max:8},
    overdrive:{name:'임계 과출력',icon:'▲',color:'#ff806f',desc:'체력 45% 미만일 때 피해 +14%.',max:5},
    projectileSize:{name:'광자 팽창',icon:'◉',color:'#8fe9ff',desc:'투사체·광선·공격 판정 크기 +10%.',max:6},
    range:{name:'심우주 조준기',icon:'⌖',color:'#8fd8ff',desc:'무기의 기본 조준·비행 사거리 +10%.',max:6}
  };
  Object.assign(PASSIVES,NEW_PASSIVES);
  const PT={
    chainDrive:{ko:['연쇄 추진기','연쇄 12회마다 장비 발동 주기 추가 단축.'],en:['Chain Thruster','Every 12 chain further reduces equipment intervals.']},
    chainBurst:{ko:['연쇄 폭심','20연쇄마다 플레이어 중심 폭발.'],en:['Chain Detonation','Every 20 chain triggers a player-centered blast.']},
    chainRecovery:{ko:['연쇄 회수','30연쇄마다 최대 체력 비례 회복.'],en:['Chain Recovery','Every 30 chain restores a portion of maximum health.']},
    chainField:{ko:['전리품 공명','현재 연쇄에 따라 결정 흡수 범위 증가.'],en:['Loot Resonance','Pickup range increases with current chain.']},
    eliteHunter:{ko:['거성 사냥꾼','중간보스·보스 피해 +15%.'],en:['Giant Hunter','Damage to mini-bosses and bosses +15%.']},
    pierce:{ko:['관통 렌즈','투사체 관통 +1.'],en:['Piercing Lens','Projectile pierce +1.']},
    regen:{ko:['자가 복원','4초마다 체력 2.5 회복.'],en:['Self Repair','Restores 2.5 health every 4 seconds.']},
    wisdom:{ko:['성운 통찰','경험치 획득량 +10%.'],en:['Nebula Insight','Experience gained +10%.']},
    overdrive:{ko:['임계 과출력','체력 45% 미만일 때 피해 +14%.'],en:['Critical Overdrive','Damage +14% below 45% health.']},
    projectileSize:{ko:['광자 팽창','투사체·광선·공격 판정 크기 +10%.'],en:['Photon Expansion','Projectile, beam, and attack size +10%.']},
    range:{ko:['심우주 조준기','무기의 기본 조준·비행 사거리 +10%.'],en:['Deep-Space Scope','Base targeting and travel range +10%.']}
  };
  for(const row of Object.values(PT))for(const code of['ja','zh-CN','es','fr'])row[code]=row.en;
  Object.assign(PASSIVE_TEXT,PT);

  const currentChain=()=>Math.max(0,Number(state.combo)||0);
  const legacyChainDamageBonus=()=>Math.min(.30,Math.floor(currentChain()/5)*.03);
  function scaledChainDamageBonus(stacks=stat('chain'),combo=currentChain()){
    const tiers=Math.floor(combo/5),raw=tiers*(.008+Math.max(0,stacks)*.0016);
    return raw>0?Math.log1p(raw*2.7)/2.7:0;
  }
  function scaledChainDurationMultiplier(stacks=stat('chain'),combo=currentChain()){
    const nebula=state.nebulaExtras?.chain||0,base=1+stacks*.07,momentum=1+Math.min(.14+stacks*.075,combo*stacks*.0018);
    return base*momentum*(1+nebula*.20);
  }
  function chainDriveBonus(stacks=stat('chainDrive'),combo=currentChain()){
    if(!stacks)return 0;const tiers=Math.floor(combo/12),perTier=.002+stacks*.0012,softMax=.04+stacks*.025;return Math.min(softMax,tiers*perTier);
  }
  window.chainDamageBonus=scaledChainDamageBonus;window.chainDurationMultiplier=scaledChainDurationMultiplier;window.chainDriveBonus=chainDriveBonus;

  const baseHaste=hasteMult;
  hasteMult=function progressionHaste(){return Math.max(.16,baseHaste()*(1-chainDriveBonus()));};
  const baseMagnet=magnetRange;
  magnetRange=function progressionMagnet(){const stacks=stat('chainField'),bonus=stacks?Math.min(30+stacks*24,currentChain()*(.18+stacks*.12)):0;return baseMagnet()+bonus;};
  const baseWeaponRange=weaponRange;
  weaponRange=function progressionWeaponRange(key){return baseWeaponRange(key)*(1+stat('range')*.10);};
  xpMult=function progressionXp(){return 1+stat('greed')*.30+stat('wisdom')*.10;};
  const baseDamage=damageMult;
  damageMult=function progressionDamage(){const normalized=baseDamage()/Math.max(.001,1+legacyChainDamageBonus()),overdrive=player.hp/player.maxHp<.45?1+stat('overdrive')*.14:1;return normalized*(1+scaledChainDamageBonus())*overdrive;};
  const baseProjectile=spawnPlayerProjectile;
  spawnPlayerProjectile=function progressionProjectile(data){const next={...data};next.pierce=(Number.isFinite(next.pierce)?next.pierce:0)+stat('pierce');next.r=(Number.isFinite(next.r)?next.r:4)*(1+stat('projectileSize')*.10);return baseProjectile(next);};
  const baseDeal=dealDamage;
  dealDamage=function progressionEliteDamage(enemy,amount,opts={}){if(enemy&&(enemy.type==='mini'||enemy.type==='boss'))amount*=1+stat('eliteHunter')*.15;return baseDeal(enemy,amount,opts);};
  const baseUpdatePlayer=updatePlayer;
  updatePlayer=function progressionPlayer(dt){baseUpdatePlayer(dt);const n=stat('regen');if(!n)return;player.regenTimer=(player.regenTimer||4)-dt;if(player.regenTimer<=0){player.regenTimer+=4;player.hp=Math.min(player.maxHp,player.hp+n*2.5);}};

  prismStage=function focusedPrismStage(heat,prismN){const first=prismN>=4?.68:.88,second=prismN>=6?1.55:prismN>=4?1.78:2.18;return heat>=second?2:heat>=first?1:0;};
  prismMultiplier=function focusedPrismMultiplier(stage,prismN){return stage===2?(prismN>=6?4.6:prismN>=5?4.35:4.1):stage===1?1.9:1;};
  updateFocusedPrisms=function rebuiltFocusedPrisms(dt,prismN){
    const count=prismN>=6?3:prismN>=2?2:1,positions=prismPositions(count),range=weaponRange('prism'),locks=player.prismLocks||(player.prismLocks=[]),used=new Set(),size=weaponSizeMultiplier(),stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();locks.length=count;
    for(let i=0;i<count;i++){
      const pos=positions[i],lock=locks[i]||(locks[i]={targetId:null,heat:0,tick:0,visual:0,augmentCd:0}),current=enemyById(lock.targetId),valid=current&&Math.hypot(current.x-pos.x,current.y-pos.y)<=range;
      let target=valid?current:nearestEnemy(pos.x,pos.y,range,e=>!used.has(e.id));if(!target)target=nearestEnemy(pos.x,pos.y,range);
      if(!target){lock.targetId=null;lock.heat=Math.max(0,lock.heat-dt*2.5);continue;}
      if(lock.targetId===target.id)lock.heat=Math.min(3.2,lock.heat+dt);else{lock.targetId=target.id;lock.heat=0;lock.tick=0;}
      used.add(target.id);lock.tick-=dt;lock.visual-=dt;lock.augmentCd-=dt;const stage=prismStage(lock.heat,prismN),mult=prismMultiplier(stage,prismN),color=stage===2?'#fff1a8':stage===1?'#ff9c72':'#c8b3ff',width=(2.7+stage*2.1+prismN*.16)*size;
      if(lock.tick<=0){lock.tick=.18;dealDamage(target,(2.6+prismN*.86)*mult,{color,source:'prism-focus'});}
      if(lock.visual<=0){lock.visual=stressed?.11:.075;state.entities.beams.push({x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,life:stressed?.13:.11,max:stressed?.13:.11,color,width});}
      if(state.weaponAugments?.prism&&stage===2&&lock.augmentCd<=0){
        lock.augmentCd=1.15;const a=Math.atan2(target.y-pos.y,target.x-pos.x)+Math.PI/2,len=150+prismN*8,x1=target.x-Math.cos(a)*len,y1=target.y-Math.sin(a)*len,x2=target.x+Math.cos(a)*len,y2=target.y+Math.sin(a)*len;
        state.entities.beams.push({x1,y1,x2,y2,life:.20,max:.20,color:'#fff6d7',width:3.1*size});
        for(const e of state.entities.enemies)if(!e.dead&&segmentDistance(e.x,e.y,x1,y1,x2,y2)<e.r+7*size)dealDamage(e,10+prismN*2.5,{color:'#fff4dc',source:'prism-overheat-line',canCrit:false});
        areaDamage(target.x,target.y,48*size,6+prismN*1.5,'#ffba72');
      }
    }
    trimOldest(state.entities.beams,entityCap('beams'));
  };
  firePrism=function focusedPrismEcho(prismN,echoed=false){const positions=prismPositions(prismN>=6?3:prismN>=2?2:1),range=weaponRange('prism'),size=weaponSizeMultiplier();for(const pos of positions){const target=nearestEnemy(pos.x,pos.y,range);if(!target)continue;dealDamage(target,(7+prismN*2.4)*(echoed?.62:1),{color:echoed?COLORS.pink:'#f2d5ff',source:'prism-echo'});state.entities.beams.push({x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,life:.16,max:.16,color:echoed?COLORS.pink:'#f2d5ff',width:(3.2+prismN*.18)*size});}trimOldest(state.entities.beams,entityCap('beams'));};
  if(WEAPON_TEXT.prism){WEAPON_TEXT.prism.ko=['성좌 프리즘','소환 / 집속 광선','공전 프리즘이 한 표적을 추적하며 오래 조준할수록 3단계로 강해지는 집속 광선을 유지한다.'];WEAPON_TEXT.prism.en=['Constellation Prism','Summon / Focus Beam','Orbiting prisms maintain a three-stage beam that intensifies while a target remains locked.'];}

  let chainEffectGuard=false;
  const baseKill=killEnemy;
  killEnemy=function progressionKill(enemy,opts={}){
    baseKill(enemy,opts);if(chainEffectGuard||!enemy)return;
    const chain=currentChain(),burst=stat('chainBurst'),recovery=stat('chainRecovery');
    if(burst&&chain>0&&chain%20===0){const radius=78+burst*7+Math.min(74,chain*.65),damage=12+burst*5+chain*(.18+burst*.035)+state.level*.22;chainEffectGuard=true;areaDamage(player.x,player.y,radius,damage,'#ff7b9e');chainEffectGuard=false;}
    if(recovery&&chain>0&&chain%30===0){const fraction=Math.min(.04+recovery*.025,recovery*.004+chain*.0002);player.hp=Math.min(player.maxHp,player.hp+player.maxHp*fraction);shockwave(player.x,player.y,'#74f2a7',82+Math.min(65,chain*.45),.32,2.4);}
  };

  window.updateEncounterDirector=function updateEncounterDirector(dt){
    if((state.nextApexAt||Infinity)-state.time<38)return;
    state.encounterTimer=(state.encounterTimer??58)-dt;if(state.encounterTimer>0)return;
    const active=state.entities.enemies.filter(e=>!e.dead&&(e.type==='mini'||e.type==='boss')).length;
    if(active>=4){state.encounterTimer=10;return;}
    const step=(state.encounterStep||0)%3;
    if(step<2)spawnEnemy('mini');else spawnEnemy('boss');
    state.encounterStep=(step+1)%3;state.encounterTimer=Math.max(38,56-Math.min(18,state.time/240));
  };
  updateSpawning=function progressionSpawning(dt){
    if(typeof updateApexSystems==='function'&&updateApexSystems(dt))return;
    if(typeof worldEventBlocksSpawning==='function'&&worldEventBlocksSpawning())return;
    state.spawnTimer-=dt;const elapsed=Math.max(0,state.time||0),compact=compactDevice(),rate=Math.max(compact?.55:.48,1.48/(1+elapsed/310));
    if(state.spawnTimer<=0){state.spawnTimer=rate;const count=1+Math.min(compact?1:2,Math.floor(elapsed/260));for(let i=0;i<count;i++)spawnEnemy('normal');}
    updateEncounterDirector(dt);
  };

  function choiceText(c){const weaponLike=c.kind==='weapon'||c.kind==='core';return weaponLike?weaponText(c.key):passiveText(c.key);}
  function normalizeChoice(c){if(!c||!['core','weapon','passive'].includes(c.kind)||!c.key)return null;const source=c.kind==='passive'?PASSIVES[c.key]:WEAPONS[c.key];if(!source)return null;return{...source,...c,color:c.color||source.color||'#aeeeff',icon:c.icon||source.icon||'✦'};}
  function collectChoices(count){const result=[],seen=new Set(),take=list=>{for(const item of list||[]){const c=normalizeChoice(item);if(!c)continue;const id=`${c.kind}:${c.key}`;if(seen.has(id))continue;seen.add(id);result.push(c);if(result.length>=count)break;}};take(rollChoices(Math.max(9,count*3)));if(result.length<count){const fallback=[],coreCount=weaponCount('core');if(coreCount<6)fallback.push({kind:'core',key:'core',...WEAPONS.core,weight:1});for(const[key,w]of Object.entries(WEAPONS)){if(key==='core'||w.starter===false)continue;const owned=weaponCount(key),slots=state.weaponSlots.length;if(owned<6&&(owned>0||slots<6))fallback.push({kind:'weapon',key,...w,weight:1});}for(const[key,p]of Object.entries(PASSIVES))if(stat(key)<p.max)fallback.push({kind:'passive',key,...p,weight:1});take(fallback.sort(()=>Math.random()-.5));}return result.slice(0,count);}
  function applyChoiceSafely(c){if(c.kind==='core'){const after=weaponCount('core')+1;state.weaponStacks.core=after;showStackEffect?.('core',after);return;}if(c.kind==='weapon'){const before=weaponCount(c.key),after=before+1;state.weaponStacks[c.key]=after;if(before===0&&!state.weaponSlots.includes(c.key))state.weaponSlots.push(c.key);showStackEffect?.(c.key,after);if(c.key==='bulwark'){player.maxHp+=8;player.hp=Math.min(player.maxHp,player.hp+8);}return;}state.passives[c.key]=stat(c.key)+1;if(c.key==='vitality'){player.maxHp+=20;player.hp=Math.min(player.maxHp,player.hp+30);}if(c.key==='stellarLife'){const ratio=player.hp/Math.max(1,player.maxHp);player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.08));player.hp=Math.max(1,Math.min(player.maxHp,Math.round(player.maxHp*ratio)));}}
  function finishChoiceSafely(){state.choiceOpening=false;state.choiceLocked=false;ui.choice.classList.add('hidden');ui.choiceCards.innerHTML='';state.mode='playing';renderLoadout();updateHUD();syncAbilityLedgerVisibility?.();setTimeout(()=>{if(state.mode==='playing')tryLevelUp?.();},0);}
  function buildChoiceCard(c){const weaponLike=c.kind==='weapon'||c.kind==='core',text=choiceText(c),current=weaponLike?weaponCount(c.key):stat(c.key),next=weaponLike?stackEffectText(c.key,current+1):null,el=document.createElement('button');el.type='button';el.className='choice-card';el.style.setProperty('--card-accent',c.color);el.style.setProperty('--card-glow',hexToRgba(c.color,.22));const type=c.kind==='core'?tr('choice.basic'):c.kind==='weapon'?tr('choice.equipment'):tr('choice.passive'),countLabel=weaponLike?tr('choice.stack'):tr('choice.owned');el.innerHTML=`<span class="type">${type}</span><span class="stack-info">${countLabel} ${current} → ${current+1}</span><div class="big-icon">${c.icon}</div><h3>${text.name}</h3><p>${text.desc}</p>${next?`<div class="resonance-preview"><b>${current+1} · ${next.name}</b><span>${next.desc}</span></div>`:''}`;el.addEventListener('click',()=>selectChoice(c),{once:true});return el;}
  openChoices=function openChoicesStable(){if(state.choiceOpening||state.choiceLocked||state.mode==='gameover'||state.mode==='menu')return;closeAbilityLedger?.(true);state.choiceOpening=true;ui.choice.classList.add('hidden');ui.choiceCards.innerHTML='';try{const choices=collectChoices(3);if(!choices.length){finishChoiceSafely();return;}const fragment=document.createDocumentFragment();for(const c of choices)fragment.appendChild(buildChoiceCard(c));ui.choiceCards.appendChild(fragment);state.choiceLocked=false;state.mode='choice';ui.choiceTitle.textContent=`${tr('choice.title')} ${state.level}`;ui.choiceKicker.textContent=tr('choice.kicker');ui.choice.classList.remove('hidden');audio.level();syncAbilityLedgerVisibility?.();}catch(error){console.error('[Stackfall] level-up choices failed',error);state.choiceLocked=false;state.mode='playing';ui.choice.classList.add('hidden');ui.choiceCards.innerHTML='';}finally{state.choiceOpening=false;}};
  selectChoice=function selectChoiceStable(c){if(state.choiceLocked||state.mode!=='choice')return;state.choiceLocked=true;for(const button of ui.choiceCards.querySelectorAll('button'))button.disabled=true;try{applyChoiceSafely(c);}catch(error){console.error('[Stackfall] choice application failed',error,c);}finally{finishChoiceSafely();}};

  applyLanguage();renderStarterOptions();renderLoadout();updateHUD();
})();