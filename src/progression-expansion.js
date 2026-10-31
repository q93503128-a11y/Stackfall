(function(){
  const NEW_PASSIVES={
    chainDrive:{name:'연쇄 추진기',icon:'»',color:'#7ce8ff',desc:'12연쇄마다 장비 발동 주기 추가 단축.',max:12},
    chainBurst:{name:'연쇄 폭심',icon:'✹',color:'#ff7b9e',desc:'20연쇄마다 플레이어 중심 폭발.',max:8},
    chainRecovery:{name:'연쇄 회수',icon:'✚',color:'#74f2a7',desc:'30연쇄마다 최대 체력 비례 회복.',max:8},
    chainField:{name:'전리품 공명',icon:'⊙',color:'#ffcc5c',desc:'현재 연쇄에 따라 결정 흡수 범위 증가.',max:8},
    eliteHunter:{name:'거성 사냥꾼',icon:'♜',color:'#e6b2ff',desc:'중간보스·보스 피해 +15%.',max:6},
    pierce:{name:'관통 렌즈',icon:'⇢',color:'#b5f5ff',desc:'투사체 관통 +1.',max:4},
    regen:{name:'자가 복원',icon:'♻',color:'#88f0ad',desc:'초당 체력 1 회복.',max:6},
    wisdom:{name:'성운 통찰',icon:'✧',color:'#bba6ff',desc:'경험치 획득량 +10%.',max:8},
    overdrive:{name:'임계 과출력',icon:'▲',color:'#ff806f',desc:'체력 45% 미만일 때 피해 +14%.',max:5},
    projectileSize:{name:'광자 팽창',icon:'◉',color:'#8fe9ff',desc:'투사체·광선·공격 판정 크기 +10%.',max:6},
    range:{name:'심우주 조준기',icon:'⌖',color:'#8fd8ff',desc:'무기의 기본 조준·비행 사거리 +10%.',max:6}
  };
  Object.assign(PASSIVES,NEW_PASSIVES);
  PASSIVES.chain.desc='연쇄 유지시간과 연쇄 피해 증가.';
  const PT={
    chain:{ko:['연쇄 과부하','연쇄 유지시간과 연쇄 피해 증가.'],en:['Chain Overload','Increases chain duration and chain damage.']},
    chainDrive:{ko:['연쇄 추진기','12연쇄마다 장비 발동 주기 추가 단축.'],en:['Chain Thruster','Every 12 chain further reduces equipment intervals.']},
    chainBurst:{ko:['연쇄 폭심','20연쇄마다 플레이어 중심 폭발.'],en:['Chain Detonation','Every 20 chain triggers a player-centered blast.']},
    chainRecovery:{ko:['연쇄 회수','30연쇄마다 최대 체력 비례 회복.'],en:['Chain Recovery','Every 30 chain restores a portion of maximum health.']},
    chainField:{ko:['전리품 공명','현재 연쇄에 따라 결정 흡수 범위 증가.'],en:['Loot Resonance','Pickup range increases with current chain.']},
    eliteHunter:{ko:['거성 사냥꾼','중간보스·보스 피해 +15%.'],en:['Giant Hunter','Damage to mini-bosses and bosses +15%.']},
    pierce:{ko:['관통 렌즈','투사체 관통 +1.'],en:['Piercing Lens','Projectile pierce +1.']},
    regen:{ko:['자가 복원','초당 체력 1 회복.'],en:['Self Repair','Restores 1 health per second.']},
    wisdom:{ko:['성운 통찰','경험치 획득량 +10%.'],en:['Nebula Insight','Experience gained +10%.']},
    overdrive:{ko:['임계 과출력','체력 45% 미만일 때 피해 +14%.'],en:['Critical Overdrive','Damage +14% below 45% health.']},
    projectileSize:{ko:['광자 팽창','투사체·광선·공격 판정 크기 +10%.'],en:['Photon Expansion','Projectile, beam, and attack size +10%.']},
    range:{ko:['심우주 조준기','무기의 기본 조준·비행 사거리 +10%.'],en:['Deep-Space Scope','Base targeting and travel range +10%.']}
  };
  for(const row of Object.values(PT))for(const code of['ja','zh-CN','es','fr'])row[code]=row.en;
  Object.assign(PASSIVE_TEXT,PT);

  const VITALITY_MAX_HP=28,VITALITY_INSTANT_HEAL=46,STELLAR_LIFE_MULT=1.12;
  function applyVitalityGrowth(stacks=1){const count=Math.max(0,Math.floor(Number(stacks)||0));if(!count)return;player.maxHp+=VITALITY_MAX_HP*count;player.hp=Math.min(player.maxHp,player.hp+VITALITY_INSTANT_HEAL*count);}
  function applyStellarLifeGrowth(stacks=1){const count=Math.max(0,Math.floor(Number(stacks)||0));if(!count)return;const ratio=player.hp/Math.max(1,player.maxHp);for(let i=0;i<count;i++)player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*STELLAR_LIFE_MULT));player.hp=Math.max(1,Math.min(player.maxHp,Math.round(player.maxHp*ratio)));}
  window.stackfallHealthGrowth=Object.freeze({vitalityMaxHp:VITALITY_MAX_HP,vitalityHeal:VITALITY_INSTANT_HEAL,stellarLifeMultiplier:STELLAR_LIFE_MULT});
  window.applyStackfallVitalityGrowth=applyVitalityGrowth;
  window.applyStackfallStellarLifeGrowth=applyStellarLifeGrowth;

  const currentChain=()=>Math.max(0,Number(state.combo)||0);
  const apexCoreMultiplier=()=>Math.pow(1.10,Math.max(0,Math.min(3,Math.floor(Number(state.apexCoreStacks)||0))));
  const curvedStackPower=(stacks,base=.55,growth=1.06,exponent=1.20)=>stacks>0?base+Math.pow(Math.max(0,stacks-1),exponent)*growth:0;
  function chainDurationBonus(){const n=stat('chain');if(!n)return 0;return .04+Math.max(0,n-1)*.08+Math.max(0,n-4)*.02;}
  window.chainDurationMultiplier=function chainDurationMultiplier(){return(1+chainDurationBonus())*(1+(state.nebulaExtras?.chain||0)*.20);};
  window.chainDamageBonus=function chainDamageBonus(){const tiers=Math.min(12,Math.floor(currentChain()/5)),n=stat('chain'),perTier=.010+(n?(.003+n*.006):0),cap=.10+n*.06;return Math.min(cap,tiers*perTier);};
  function chainDriveReduction(){const n=stat('chainDrive'),milestones=Math.min(5,Math.floor(currentChain()/12));if(!n||!milestones)return 0;const perMilestone=.008+n*.0055;return Math.min(.38,milestones*perMilestone);}
  window.weaponCycleMultiplier=function weaponCycleMultiplier(){return 1-chainDriveReduction();};
  const baseDamageMult=damageMult;
  damageMult=function progressionDamageMult(){return baseDamageMult()*(1+chainDamageBonus())*apexCoreMultiplier();};
  const baseHasteMult=hasteMult;
  hasteMult=function progressionHasteMult(){return Math.max(.18,baseHasteMult()*weaponCycleMultiplier()/apexCoreMultiplier());};

  const baseMagnet=magnetRange;
  magnetRange=function progressionMagnet(){const stacks=stat('chainField'),power=curvedStackPower(stacks);if(!power)return baseMagnet();const bonus=Math.min(20+power*28,currentChain()*(.10+power*.10));return baseMagnet()+bonus;};
  const baseWeaponRange=weaponRange;
  weaponRange=function progressionWeaponRange(key){return baseWeaponRange(key)*(1+stat('range')*.10);};
  xpMult=function progressionXp(){return 1+stat('greed')*.30+stat('wisdom')*.10;};
  registerPlayerUpdateInterceptor('progression-expansion.js:progressionPlayer',function progressionPlayer(next,dt){next(dt);const n=stat('regen');if(n&&dt>0)player.hp=Math.min(player.maxHp,player.hp+n*dt);});

  let chainEffectGuard=false;
  function applyChainMilestones(chain,x=player.x,y=player.y){const burst=stat('chainBurst'),recovery=stat('chainRecovery');if(burst&&chain>0&&chain%20===0){const power=curvedStackPower(burst,.48,1.18,1.22),radius=72+power*8+Math.min(82,chain*.68),damage=8+power*6.2+chain*(.14+power*.018)+state.level*.22;chainEffectGuard=true;areaDamage(x,y,radius,damage,'#ff7b9e','nova-chain-burst');chainEffectGuard=false;}if(recovery&&chain>0&&chain%30===0){const power=curvedStackPower(recovery,.80,1.08,1.16),fraction=Math.min(.30,.025+power*.018+Math.min(.10,chain*.00035));player.hp=Math.min(player.maxHp,player.hp+player.maxHp*fraction);shockwave(player.x,player.y,'#74f2a7',82+power*9+Math.min(76,chain*.46),.38,3.0);}}
  window.registerStackfallBossChainDamage=function registerStackfallBossChainDamage(enemy,amount){if(chainEffectGuard||!enemy||amount<=0||!['mini','boss'].includes(enemy.type))return;const duration=2.15*chainDurationMultiplier();state.comboTimer=Math.max(state.comboTimer,duration*.62);const threshold=Math.max(72,enemy.maxHp*.018);state.bossChainDamage=(state.bossChainDamage||0)+amount;let advances=0;while(state.bossChainDamage>=threshold&&advances<3){state.bossChainDamage-=threshold;state.combo++;state.comboTimer=duration;state.maxCombo=Math.max(state.maxCombo,state.combo);applyChainMilestones(state.combo,enemy.x,enemy.y);advances++;}};
  const baseKill=killEnemy;
  killEnemy=function progressionKill(enemy,opts={}){baseKill(enemy,opts);if(chainEffectGuard||!enemy)return;applyChainMilestones(currentChain(),enemy.x,enemy.y);};

  window.updateEncounterDirector=function updateEncounterDirector(dt){
    if((state.nextApexAt||Infinity)-state.time<38)return;
    state.encounterTimer=(state.encounterTimer??58)-dt;if(state.encounterTimer>0)return;
    const active=state.entities.enemies.filter(e=>!e.dead&&(e.type==='mini'||e.type==='boss')).length;
    if(active>=4){state.encounterTimer=10;return;}
    const step=(state.encounterStep||0)%3;
    if(step<2)spawnEnemy('mini');else spawnEnemy('boss');
    state.encounterStep=(step+1)%3;state.encounterTimer=Math.max(38,56-Math.min(18,state.time/240));
  };
  function choiceText(c){const weaponLike=c.kind==='weapon'||c.kind==='core';return weaponLike?weaponText(c.key):passiveText(c.key);}
  function normalizeChoice(c){if(!c||!['core','weapon','passive'].includes(c.kind)||!c.key)return null;if(c.kind==='weapon'&&window.stackfallIsWeaponUnlocked&&!window.stackfallIsWeaponUnlocked(c.key))return null;if(c.kind==='passive'&&window.stackfallIsPassiveChoiceUnlocked&&!window.stackfallIsPassiveChoiceUnlocked(c.key))return null;const source=c.kind==='passive'?PASSIVES[c.key]:WEAPONS[c.key];if(!source)return null;if(c.kind==='passive'&&source.eventOnly&&window.stackfallIsFeatureUnlocked?.('multiplicity-protocol')!==true)return null;return{...source,...c,color:c.color||source.color||'#aeeeff',icon:c.icon||source.icon||'✦'};}
  function collectChoices(count){const result=[],seen=new Set(),take=list=>{for(const item of list||[]){const c=normalizeChoice(item);if(!c)continue;const id=`${c.kind}:${c.key}`;if(seen.has(id))continue;seen.add(id);result.push(c);if(result.length>=count)break;}};take(rollChoices(Math.max(9,count*3)));if(result.length<count){const fallback=[],coreCount=weaponCount('core');if(coreCount<6)fallback.push({kind:'core',key:'core',...WEAPONS.core,weight:1});for(const[key,w]of Object.entries(WEAPONS)){if(key==='core'||w.starter===false||(window.stackfallIsWeaponUnlocked&&!window.stackfallIsWeaponUnlocked(key)))continue;const owned=weaponCount(key),slots=state.weaponSlots.length,limit=window.stackfallEquipmentSlotLimit?.()||4;if(owned<6&&(owned>0||slots<limit))fallback.push({kind:'weapon',key,...w,weight:1});}for(const[key,p]of Object.entries(PASSIVES))if((!p.eventOnly||window.stackfallIsFeatureUnlocked?.('multiplicity-protocol')===true)&&stat(key)<p.max&&(!window.stackfallIsPassiveChoiceUnlocked||window.stackfallIsPassiveChoiceUnlocked(key)))fallback.push({kind:'passive',key,...p,weight:1});take(fallback.sort(()=>Math.random()-.5));}return result.slice(0,count);}
  function applyChoiceSafely(c){if(c.kind==='core'){const after=weaponCount('core')+1;state.weaponStacks.core=after;showStackEffect?.('core',after);return;}if(c.kind==='weapon'){const before=weaponCount(c.key),after=before+1;state.weaponStacks[c.key]=after;if(before===0&&!state.weaponSlots.includes(c.key))state.weaponSlots.push(c.key);showStackEffect?.(c.key,after);if(c.key==='bulwark'){player.maxHp+=8;player.hp=Math.min(player.maxHp,player.hp+8);}return;}state.passives[c.key]=stat(c.key)+1;if(c.key==='vitality')applyVitalityGrowth(1);if(c.key==='stellarLife')applyStellarLifeGrowth(1);}
  function continueStartLevelBonus(){
    const remaining=Math.max(0,Math.floor(Number(state.startLevelBonusRemaining)||0));if(!remaining||state.mode!=='playing')return false;
    state.startLevelBonusRemaining=remaining-1;state.level=Math.max(1,Math.floor(Number(state.level)||1))+1;state.xpNeed=levelXpRequirement(state.level);updateHUD?.();openChoices();return true;
  }
  window.stackfallBeginStartLevelBonus=function beginStartLevelBonus(count=3){
    const amount=Math.max(0,Math.floor(Number(count)||0));state.startLevelBonusRemaining=amount;if(!amount)return false;
    queueMicrotask(()=>{if(state.mode==='playing')continueStartLevelBonus();});return true;
  };
  function finishChoiceSafely(){state.choiceOpening=false;state.choiceLocked=false;ui.choice.classList.add('hidden');ui.choiceCards.innerHTML='';ui.choiceCards.classList.remove('four-choice');state.mode='playing';renderLoadout();updateHUD();syncAbilityLedgerVisibility?.();queueMicrotask(()=>{if(state.mode!=='playing')return;if(continueStartLevelBonus())return;tryLevelUp?.();});}
  function buildChoiceCard(c){const weaponLike=c.kind==='weapon'||c.kind==='core',text=choiceText(c),current=weaponLike?weaponCount(c.key):stat(c.key),next=weaponLike?stackEffectText(c.key,current+1):null,el=document.createElement('button');el.type='button';el.className='choice-card';el.style.setProperty('--card-accent',c.color);el.style.setProperty('--card-glow',hexToRgba(c.color,.22));const type=c.kind==='core'?tr('choice.basic'):c.kind==='weapon'?tr('choice.equipment'):tr('choice.passive'),status=current>0?tr('choice.upgrade'):tr('choice.new'),role=weaponLike?(text.role||tr('choice.attackRole')):tr('choice.growthRole');el.innerHTML=`<span class="choice-meta"><span class="type">${type}</span><span class="choice-status">${status}</span></span><span class="stack-info"><small>${tr('choice.current')}</small><b>${current}</b><i>→</i><small>${tr('choice.next')}</small><strong>${current+1}</strong></span><div class="choice-body"><div class="big-icon">${c.icon}</div><div class="choice-copy"><span class="role-tag">${role}</span><h3>${text.name}</h3><p>${text.desc}</p></div></div>${next?`<div class="resonance-preview"><b>${current+1} · ${next.name}</b><span>${next.desc}</span></div>`:''}`;el.addEventListener('click',()=>selectChoice(c),{once:true});return el;}
  openChoices=function openChoicesStable(){if(state.choiceOpening||state.choiceLocked||state.mode==='gameover'||state.mode==='menu')return;closeAbilityLedger?.(true);state.choiceOpening=true;ui.choice.classList.add('hidden');ui.choiceCards.innerHTML='';try{const choices=collectChoices(window.stackfallIsFeatureUnlocked?.('choice-4')===true?4:3);if(!choices.length){finishChoiceSafely();return;}state.choiceLocked=false;state.mode='choice';if(GAME_SETTINGS.autoLevelChoice===true){window.stackfallShowAutoChoice?.(choices[0]);selectChoice(choices[0]);return;}ui.choiceCards.classList.toggle('four-choice',choices.length===4);const fragment=document.createDocumentFragment();for(const c of choices)fragment.appendChild(buildChoiceCard(c));ui.choiceCards.appendChild(fragment);ui.choiceTitle.textContent=`${tr('choice.title')} ${state.level}`;ui.choiceKicker.textContent=tr('choice.kicker');ui.choice.classList.remove('hidden');audio.level();syncAbilityLedgerVisibility?.();}catch(error){console.error('[Stackfall] level-up choices failed',error);state.choiceLocked=false;state.mode='playing';ui.choice.classList.add('hidden');ui.choiceCards.innerHTML='';}finally{state.choiceOpening=false;}};
  selectChoice=function selectChoiceStable(c){if(state.choiceLocked||state.mode!=='choice')return;state.choiceLocked=true;for(const button of ui.choiceCards.querySelectorAll('button'))button.disabled=true;try{applyChoiceSafely(c);}catch(error){console.error('[Stackfall] choice application failed',error,c);}finally{finishChoiceSafely();}};

  applyLanguage();renderStarterOptions();renderLoadout();updateHUD();
})();