(()=>{
  const PROFILE=window.stackfallMetaStorageProfile==='developer'?'developer':'player';
  const STORAGE_KEY=PROFILE==='developer'?'stackfall.endless.progression.dev.v1':'stackfall.endless.progression.v1';
  const BASELINE_FEATURES=Object.freeze(['endless','core-development']);
  const SURVIVAL_MILESTONES=Object.freeze([300,600,900,1200,1800,2700,3600]);
  const freezeReward=(type,key,amount=1)=>Object.freeze({type,key,amount});
  const weaponReward=key=>Object.freeze([freezeReward('unlock_weapon',key)]);
  const featureReward=key=>Object.freeze([freezeReward('unlock_feature',key)]);
  const ACHIEVEMENTS=Object.freeze([
    Object.freeze({id:'survive-3m',rewards:weaponReward('comet'),kind:'survive',value:3,test:(run)=>run.time>=180}),
    Object.freeze({id:'mini-1',rewards:weaponReward('prism'),kind:'mini',value:1,test:(run,meta)=>(meta.bossRecords?.mini||0)>=1}),
    Object.freeze({id:'level-10',rewards:weaponReward('chrono'),kind:'level',value:10,test:(run)=>run.level>=10}),
    Object.freeze({id:'chain-20',rewards:weaponReward('arc'),kind:'chain',value:20,test:(run)=>run.maxCombo>=20}),
    Object.freeze({id:'run-kills-200',rewards:weaponReward('ion'),kind:'runKills',value:200,test:(run)=>run.kills>=200}),
    Object.freeze({id:'boss-1',rewards:weaponReward('nova'),kind:'boss',value:1,test:(run,meta)=>(meta.bossRecords?.boss||0)>=1}),
    Object.freeze({id:'survive-5m',rewards:weaponReward('drone'),kind:'survive',value:5,test:(run)=>run.time>=300}),
    Object.freeze({id:'run-kills-400',rewards:weaponReward('rail'),kind:'runKills',value:400,test:(run)=>run.kills>=400}),
    Object.freeze({id:'level-20',rewards:weaponReward('spiral'),kind:'level',value:20,test:(run)=>run.level>=20}),
    Object.freeze({id:'chain-50',rewards:weaponReward('mirror'),kind:'chain',value:50,test:(run)=>run.maxCombo>=50}),
    Object.freeze({id:'lifetime-kills-1000',rewards:weaponReward('vacuum'),kind:'lifetimeKills',value:1000,test:(run,meta)=>(meta.lifetime?.kills||0)+(run.kills||0)>=1000}),
    Object.freeze({id:'mini-10',rewards:weaponReward('mine'),kind:'mini',value:10,test:(run,meta)=>(meta.bossRecords?.mini||0)>=10}),
    Object.freeze({id:'survive-10m',rewards:weaponReward('missile'),kind:'survive',value:10,test:(run)=>run.time>=600}),
    Object.freeze({id:'apex-1',rewards:weaponReward('gate'),kind:'apex',value:1,test:(run,meta)=>(meta.bossRecords?.apex||0)>=1})
  ]);
  const FEATURE_ACHIEVEMENTS=Object.freeze([
    Object.freeze({id:'feature-special-ability',rewards:featureReward('special-ability'),kind:'boss',value:1,test:(run,meta)=>(meta.bossRecords?.boss||0)>=1}),
    Object.freeze({id:'feature-awakening',rewards:featureReward('awakening'),kind:'survive',value:10,test:(run)=>run.time>=600}),
    Object.freeze({id:'feature-hard',rewards:featureReward('hard'),kind:'apex',value:1,test:(run,meta)=>(meta.bossRecords?.apex||0)>=1}),
    Object.freeze({id:'feature-very-hard',rewards:featureReward('very-hard'),kind:'hardSurvive',value:15,test:(run)=>run.difficulty==='hard'&&run.time>=900}),
    Object.freeze({id:'feature-choice-4',rewards:featureReward('choice-4'),kind:'level',value:25,test:(run)=>run.level>=25}),
    Object.freeze({id:'feature-start-level-3',rewards:featureReward('start-level-3'),kind:'survive',value:15,test:(run)=>run.time>=900}),
    Object.freeze({id:'feature-core-development-iii',rewards:featureReward('core-development-iii'),kind:'apex',value:3,test:(run,meta)=>(meta.bossRecords?.apex||0)>=3}),
    Object.freeze({id:'feature-multiplicity-protocol',rewards:featureReward('multiplicity-protocol'),kind:'survive',value:30,test:(run)=>run.time>=1800})
  ]);
  const ALL_ACHIEVEMENTS=Object.freeze([...ACHIEVEMENTS,...FEATURE_ACHIEVEMENTS]);
  const rewardOf=(row,type)=>row?.rewards?.find(reward=>reward.type===type)||null;
  const byWeapon=new Map(ACHIEVEMENTS.map(row=>[rewardOf(row,'unlock_weapon')?.key,row]).filter(([key])=>key));
  const byFeature=new Map(FEATURE_ACHIEVEMENTS.map(row=>[rewardOf(row,'unlock_feature')?.key,row]).filter(([key])=>key));
  const sanitizeStrings=value=>Array.isArray(value)?[...new Set(value.filter(item=>typeof item==='string'))]:[];
  const sanitizeNumbers=value=>Array.isArray(value)?[...new Set(value.map(Number).filter(Number.isFinite).map(n=>Math.max(0,Math.floor(n))))]:[];
  const sanitizeNumber=value=>Math.max(0,Number(value)||0);
  const sanitizeNumberMap=value=>{
    const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
    for(const[key,raw]of Object.entries(value)){const amount=Math.max(0,Math.floor(Number(raw)||0));if(amount)out[key]=amount;}return out;
  };

  function loadProgress(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return{
        version:3,
        completed:sanitizeStrings(saved.completed),
        weaponUnlocks:sanitizeStrings(saved.weaponUnlocks),
        featureUnlocks:sanitizeStrings(saved.featureUnlocks),
        rewardClaims:sanitizeStrings(saved.rewardClaims),
        survivalMilestones:sanitizeNumbers(saved.survivalMilestones),
        bestSurvival:sanitizeNumber(saved.bestSurvival),
        bestHardSurvival:sanitizeNumber(saved.bestHardSurvival),
        bestLevel:Math.max(1,Math.floor(sanitizeNumber(saved.bestLevel)||1)),
        bestCombo:Math.floor(sanitizeNumber(saved.bestCombo)),
        bestRunKills:Math.floor(sanitizeNumber(saved.bestRunKills)),
        materials:sanitizeNumberMap(saved.materials),
        cosmetics:sanitizeStrings(saved.cosmetics),
        titles:sanitizeStrings(saved.titles)
      };
    }catch{
      return{version:3,completed:[],weaponUnlocks:[],featureUnlocks:[],rewardClaims:[],survivalMilestones:[],bestSurvival:0,bestHardSurvival:0,bestLevel:1,bestCombo:0,bestRunKills:0,materials:{},cosmetics:[],titles:[]};
    }
  }
  const progress=loadProgress();
  function saveProgress(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch{}}
  function language(){return GAME_SETTINGS?.language||'ko';}
  const CONDITION_TEMPLATES={
    ko:{survive:n=>`무한모드 ${n}분 생존`,hardSurvive:n=>`어려움 난이도에서 ${n}분 생존`,mini:n=>`중간보스 누적 ${n}회 처치`,level:n=>`한 판에서 Lv.${n} 도달`,chain:n=>`한 판에서 연쇄 ${n} 달성`,runKills:n=>`한 판에서 적 ${n}마리 처치`,boss:n=>`보스 누적 ${n}회 처치`,lifetimeKills:n=>`적 누적 ${n}마리 처치`,apex:n=>`초월체 ${n}회 처치`},
    en:{survive:n=>`Survive ${n}m in Endless`,hardSurvive:n=>`Survive ${n}m on Hard`,mini:n=>`Defeat ${n} mini-boss${n===1?'':'es'}`,level:n=>`Reach Lv.${n} in one run`,chain:n=>`Reach ${n} Chain in one run`,runKills:n=>`Defeat ${n} enemies in one run`,boss:n=>`Defeat ${n} boss${n===1?'':'es'}`,lifetimeKills:n=>`Defeat ${n} enemies total`,apex:n=>`Defeat ${n} Apex`},
    ja:{survive:n=>`エンドレスで${n}分生存`,hardSurvive:n=>`難しい難易度で${n}分生存`,mini:n=>`中ボスを累計${n}体撃破`,level:n=>`1回の出撃でLv.${n}到達`,chain:n=>`1回の出撃でチェイン${n}`,runKills:n=>`1回の出撃で敵${n}体撃破`,boss:n=>`ボスを累計${n}体撃破`,lifetimeKills:n=>`敵を累計${n}体撃破`,apex:n=>`超越体を${n}体撃破`},
    'zh-CN':{survive:n=>`无尽模式生存${n}分钟`,hardSurvive:n=>`困难难度生存${n}分钟`,mini:n=>`累计击败${n}个中型首领`,level:n=>`单局达到Lv.${n}`,chain:n=>`单局达到${n}连击`,runKills:n=>`单局击败${n}个敌人`,boss:n=>`累计击败${n}个首领`,lifetimeKills:n=>`累计击败${n}个敌人`,apex:n=>`击败${n}个超越体`},
    es:{survive:n=>`Sobrevive ${n} min. en Infinito`,hardSurvive:n=>`Sobrevive ${n} min. en Difícil`,mini:n=>`Derrota ${n} minijefe(s)`,level:n=>`Alcanza Nv.${n} en una partida`,chain:n=>`Alcanza cadena ${n} en una partida`,runKills:n=>`Derrota ${n} enemigos en una partida`,boss:n=>`Derrota ${n} jefe(s)`,lifetimeKills:n=>`Derrota ${n} enemigos en total`,apex:n=>`Derrota ${n} Ápice`},
    fr:{survive:n=>`Survivez ${n} min en Sans fin`,hardSurvive:n=>`Survivez ${n} min en Difficile`,mini:n=>`Battez ${n} mini-boss`,level:n=>`Atteignez Niv.${n} en une partie`,chain:n=>`Atteignez une chaîne de ${n}`,runKills:n=>`Battez ${n} ennemis en une partie`,boss:n=>`Battez ${n} boss`,lifetimeKills:n=>`Battez ${n} ennemis au total`,apex:n=>`Battez ${n} Apex`}
  };
  function conditionText(row){const set=CONDITION_TEMPLATES[language()]||CONDITION_TEMPLATES.en;return(set[row.kind]||CONDITION_TEMPLATES.en[row.kind])?.(row.value)||row.id;}
  const UI_TEXT={
    ko:{achievementToast:'업적 달성',stage:'스테이지 모드는 추후 업데이트됩니다.',progress:(a,b)=>`${a} / ${b} 해금`,condition:'획득 조건',unlocked:'업적 보상 해금',milestone:'생존 기록 보상',achievementKicker:'ACHIEVEMENTS',achievementTitle:'업적',achievementDesc:'무한모드에서 목표를 달성해 장비와 기능을 해금합니다.',achievementSummary:(a,b)=>`${a} / ${b} 완료`,weaponRewards:'장비 해금',featureRewards:'기능 해금',complete:'완료',locked:'미완료',reward:'보상'},
    en:{achievementToast:'ACHIEVEMENT COMPLETE',stage:'Stage mode will return in a future update.',progress:(a,b)=>`${a} / ${b} unlocked`,condition:'Unlock',unlocked:'ACHIEVEMENT REWARD',milestone:'SURVIVAL RECORD',achievementKicker:'ACHIEVEMENTS',achievementTitle:'Achievements',achievementDesc:'Complete Endless objectives to unlock weapons and features.',achievementSummary:(a,b)=>`${a} / ${b} complete`,weaponRewards:'Weapon unlocks',featureRewards:'Feature unlocks',complete:'COMPLETE',locked:'INCOMPLETE',reward:'Reward'},
    ja:{achievementToast:'実績達成',stage:'ステージモードは今後のアップデートで追加されます。',progress:(a,b)=>`${a} / ${b} 解放`,condition:'獲得条件',unlocked:'実績報酬',milestone:'生存記録報酬',achievementKicker:'ACHIEVEMENTS',achievementTitle:'実績',achievementDesc:'エンドレスの目標を達成して装備と機能を解放します。',achievementSummary:(a,b)=>`${a} / ${b} 完了`,weaponRewards:'装備解放',featureRewards:'機能解放',complete:'完了',locked:'未完了',reward:'報酬'},
    'zh-CN':{achievementToast:'成就完成',stage:'关卡模式将在后续更新中开放。',progress:(a,b)=>`${a} / ${b} 已解锁`,condition:'解锁条件',unlocked:'成就奖励',milestone:'生存记录奖励',achievementKicker:'ACHIEVEMENTS',achievementTitle:'成就',achievementDesc:'完成无尽模式目标，解锁武器和功能。',achievementSummary:(a,b)=>`${a} / ${b} 完成`,weaponRewards:'武器解锁',featureRewards:'功能解锁',complete:'完成',locked:'未完成',reward:'奖励'},
    es:{achievementToast:'LOGRO COMPLETADO',stage:'El modo Etapas volverá en una futura actualización.',progress:(a,b)=>`${a} / ${b} desbloqueadas`,condition:'Desbloqueo',unlocked:'RECOMPENSA DE LOGRO',milestone:'RÉCORD DE SUPERVIVENCIA',achievementKicker:'ACHIEVEMENTS',achievementTitle:'Logros',achievementDesc:'Cumple objetivos de Infinito para desbloquear armas y funciones.',achievementSummary:(a,b)=>`${a} / ${b} completados`,weaponRewards:'Armas',featureRewards:'Funciones',complete:'COMPLETADO',locked:'INCOMPLETO',reward:'Recompensa'},
    fr:{achievementToast:'SUCCÈS DÉBLOQUÉ',stage:'Le mode Étapes reviendra dans une prochaine mise à jour.',progress:(a,b)=>`${a} / ${b} débloquées`,condition:'Déblocage',unlocked:'RÉCOMPENSE DE SUCCÈS',milestone:'RECORD DE SURVIE',achievementKicker:'ACHIEVEMENTS',achievementTitle:'Succès',achievementDesc:'Atteignez des objectifs en Sans fin pour débloquer armes et fonctions.',achievementSummary:(a,b)=>`${a} / ${b} terminés`,weaponRewards:'Armes',featureRewards:'Fonctions',complete:'TERMINÉ',locked:'INCOMPLET',reward:'Récompense'}
  };
  const PROFILE_TEXT={
    ko:{survival:'최고 생존 시간',level:'최고 런 레벨',combo:'최대 연쇄',runKills:'한 런 최다 처치',weapons:'무기 해금',achievements:'업적 진행',runs:'총 출격',kills:'누적 처치'},
    en:{survival:'Best Survival',level:'Best Run Level',combo:'Best Chain',runKills:'Best Run Kills',weapons:'Weapons Unlocked',achievements:'Achievements',runs:'Total Runs',kills:'Lifetime Kills'},
    ja:{survival:'最高生存時間',level:'最高ランレベル',combo:'最大チェイン',runKills:'1回の最多撃破',weapons:'武器解放',achievements:'実績進行',runs:'総出撃',kills:'累計撃破'},
    'zh-CN':{survival:'最长生存时间',level:'最高单局等级',combo:'最高连击',runKills:'单局最多击败',weapons:'武器解锁',achievements:'成就进度',runs:'总出击',kills:'累计击败'},
    es:{survival:'Mejor supervivencia',level:'Mejor nivel',combo:'Mejor cadena',runKills:'Máx. bajas por partida',weapons:'Armas desbloqueadas',achievements:'Logros',runs:'Partidas',kills:'Bajas totales'},
    fr:{survival:'Meilleure survie',level:'Meilleur niveau',combo:'Meilleure chaîne',runKills:'Éliminations par partie',weapons:'Armes débloquées',achievements:'Succès',runs:'Sorties',kills:'Éliminations totales'}
  };
  function uiText(){return UI_TEXT[language()]||UI_TEXT.en;}

  function ensureBaselineFeatures(){
    const meta=window.stackfallMeta;if(!meta)return;
    meta.unlockedFeatures=Array.isArray(meta.unlockedFeatures)?meta.unlockedFeatures:[];
    let changed=false;
    for(const key of BASELINE_FEATURES)if(!meta.unlockedFeatures.includes(key)){meta.unlockedFeatures.push(key);changed=true;}
    if(changed)window.stackfallSaveMeta?.();
    const start=document.querySelector('#startBtn');if(start){start.disabled=false;start.classList.remove('locked');start.title='';}
    window.renderStackfallMetaUi?.();
  }
  function grantFeature(key){
    const meta=window.stackfallMeta;if(!meta||!window.STACKFALL_FEATURE_DEFS?.[key])return false;
    meta.unlockedFeatures=Array.isArray(meta.unlockedFeatures)?meta.unlockedFeatures:[];
    if(meta.unlockedFeatures.includes(key))return false;
    meta.unlockedFeatures.push(key);
    window.stackfallSaveMeta?.();
    window.stackfallRefreshFeatureUi?.();
    window.renderStackfallDifficulty?.();
    return true;
  }
  const rewardClaimId=(row,index)=>`${row.id}:${index}`;
  function applyReward(row,reward,index,{restoring=false}={}){
    if(!reward||!row)return false;
    const claimId=rewardClaimId(row,index),claimed=progress.rewardClaims.includes(claimId),amount=Math.max(1,Math.floor(Number(reward.amount)||1));
    let newlyGranted=false,settled=false;
    if(reward.type==='unlock_weapon'){
      const key=reward.key;if(!key||!WEAPONS?.[key])return false;
      if(!progress.weaponUnlocks.includes(key))progress.weaponUnlocks.push(key);
      const before=window.stackfallIsWeaponUnlocked?.(key)===true;
      if(!before)window.stackfallUnlockWeapon?.(key);
      newlyGranted=!before&&window.stackfallIsWeaponUnlocked?.(key)===true;settled=window.stackfallIsWeaponUnlocked?.(key)===true;
    }else if(reward.type==='unlock_feature'){
      const key=reward.key;if(!key||!window.STACKFALL_FEATURE_DEFS?.[key])return false;
      if(!progress.featureUnlocks.includes(key))progress.featureUnlocks.push(key);
      const before=window.stackfallIsFeatureAcquired?.(key)===true;
      if(!before)grantFeature(key);
      newlyGranted=!before&&window.stackfallIsFeatureAcquired?.(key)===true;settled=window.stackfallIsFeatureAcquired?.(key)===true;
    }else if(reward.type==='currency'){
      if(claimed)return false;
      newlyGranted=(window.stackfallGrantCurrency?.(reward.key,amount)||0)>0;settled=newlyGranted;
    }else if(reward.type==='material'){
      if(claimed)return false;
      progress.materials[reward.key]=(progress.materials[reward.key]||0)+amount;newlyGranted=true;settled=true;
    }else if(reward.type==='cosmetic'){
      if(claimed)return false;
      if(!progress.cosmetics.includes(reward.key))progress.cosmetics.push(reward.key);newlyGranted=true;settled=true;
    }else if(reward.type==='title'){
      if(claimed)return false;
      if(!progress.titles.includes(reward.key))progress.titles.push(reward.key);newlyGranted=true;settled=true;
    }
    if(settled&&!claimed)progress.rewardClaims.push(claimId);
    return restoring?false:newlyGranted;
  }
  function restoreAchievementRewards(){
    const meta=window.stackfallMeta||{};let changed=false;const claimCount=progress.rewardClaims.length;
    for(const key of progress.weaponUnlocks){const row=byWeapon.get(key);if(row&&!progress.completed.includes(row.id)){progress.completed.push(row.id);changed=true;}}
    for(const key of progress.featureUnlocks){const row=byFeature.get(key);if(row&&!progress.completed.includes(row.id)){progress.completed.push(row.id);changed=true;}}
    for(const row of ACHIEVEMENTS){const key=rewardOf(row,'unlock_weapon')?.key;if(key&&(meta.unlockedWeapons||[]).includes(key)){if(!progress.weaponUnlocks.includes(key)){progress.weaponUnlocks.push(key);changed=true;}if(!progress.completed.includes(row.id)){progress.completed.push(row.id);changed=true;}}}
    for(const row of FEATURE_ACHIEVEMENTS){const key=rewardOf(row,'unlock_feature')?.key;if(key&&(meta.unlockedFeatures||[]).includes(key)){if(!progress.featureUnlocks.includes(key)){progress.featureUnlocks.push(key);changed=true;}if(!progress.completed.includes(row.id)){progress.completed.push(row.id);changed=true;}}}
    for(const row of ALL_ACHIEVEMENTS)if(progress.completed.includes(row.id))row.rewards.forEach((reward,index)=>applyReward(row,reward,index,{restoring:true}));
    if(changed||progress.rewardClaims.length!==claimCount)saveProgress();
    window.renderStackfallDifficulty?.();
  }
  function snapshotRun(){return{time:Math.max(0,Number(state.time)||0),kills:Math.max(0,Math.floor(Number(state.kills)||0)),level:Math.max(1,Math.floor(Number(state.level)||1)),maxCombo:Math.max(0,Math.floor(Number(state.maxCombo)||0)),difficulty:String(state.selectedDifficulty||'normal')};}
  function rememberRunBest(run){
    progress.bestSurvival=Math.max(progress.bestSurvival,run.time);
    if(run.difficulty==='hard')progress.bestHardSurvival=Math.max(progress.bestHardSurvival||0,run.time);
    progress.bestLevel=Math.max(progress.bestLevel,run.level);
    progress.bestCombo=Math.max(progress.bestCombo,run.maxCombo);
    progress.bestRunKills=Math.max(progress.bestRunKills,run.kills);
  }
  function isEndless(){return(window.stackfallCurrentRunConfig?.().mode||state.runSelection?.mode||'endless')==='endless';}
  function claimSurvivalMilestones(seconds){
    const time=Math.max(0,Number(seconds)||0);progress.bestSurvival=Math.max(progress.bestSurvival,time);
    const claimed=[];
    for(const mark of SURVIVAL_MILESTONES)if(time>=mark&&!progress.survivalMilestones.includes(mark)){progress.survivalMilestones.push(mark);claimed.push(mark);}
    saveProgress();
    if(!claimed.length)return 0;
    const granted=window.stackfallGrantCurrency?.('coreShard',claimed.length)||0;
    if(granted){state.runCurrencyEarned=state.runCurrencyEarned||{stardust:0,coreShard:0};state.runCurrencyEarned.coreShard=(state.runCurrencyEarned.coreShard||0)+granted;}
    return granted;
  }
  function evaluateAchievements(run){
    const meta=window.stackfallMeta||{},newCompletions=[];let changed=false;rememberRunBest(run);
    for(const row of ALL_ACHIEVEMENTS){
      if(progress.completed.includes(row.id)||!row.test(run,meta))continue;
      progress.completed.push(row.id);changed=true;newCompletions.push(row);
      row.rewards.forEach((reward,index)=>applyReward(row,reward,index));
    }
    if(changed)saveProgress();return newCompletions;
  }

  function applyStageSeal(){
    const entry=document.querySelector('#stageMapBtn');if(!entry)return;
    entry.disabled=true;entry.classList.add('locked','stage-sealed');entry.setAttribute('aria-disabled','true');entry.title=uiText().stage;
    const copy=entry.querySelector('p');if(copy)copy.textContent=uiText().stage;
    const icon=entry.querySelector(':scope > i');if(icon){icon.textContent='🔒';icon.setAttribute('aria-hidden','true');}
  }
  function ensureStarterProgress(){
    const head=ui?.starterOptions?.previousElementSibling;if(!head?.classList.contains('starter-head'))return null;
    let el=head.querySelector('.starter-unlock-progress');if(!el){el=document.createElement('em');el.className='starter-unlock-progress';head.appendChild(el);}return el;
  }
  function finalRenderStarterOptions(){
    if(!ui?.starterOptions)return;
    const entries=Object.entries(WEAPONS).filter(([,weapon])=>weapon.starter!==false&&!weapon.basic),unlockedEntries=entries.filter(([key])=>!window.stackfallIsWeaponUnlocked||window.stackfallIsWeaponUnlocked(key));
    ui.starterOptions.innerHTML='';
    for(const[key,weapon]of entries){
      const unlocked=!window.stackfallIsWeaponUnlocked||window.stackfallIsWeaponUnlocked(key),text=weaponText(key),row=byWeapon.get(key),el=document.createElement('button');
      el.type='button';el.className='starter-option'+(unlocked&&key===state.selectedStarter?' selected':'')+(unlocked?'':' locked');el.style.setProperty('--starter-color',weapon.color);el.style.setProperty('--starter-glow',hexToRgba(weapon.color,unlocked?.16:.07));el.setAttribute('role','radio');el.setAttribute('aria-checked',unlocked&&key===state.selectedStarter?'true':'false');el.setAttribute('aria-disabled',unlocked?'false':'true');el.disabled=!unlocked;
      const condition=row?conditionText(row):uiText().condition;
      el.title=unlocked?`${text.name} · ${text.role}`:`${text.name} · ${condition}`;
      el.innerHTML=`<span class="starter-icon">${weapon.icon}</span><span class="starter-label">${text.name}</span>${unlocked?'':`<span class="starter-lock" aria-hidden="true">🔒</span><small class="starter-condition">${condition}</small>`}`;
      if(unlocked)el.onclick=()=>selectStarter(key);ui.starterOptions.appendChild(el);
    }
    const allowed=WEAPONS[state.selectedStarter]&&WEAPONS[state.selectedStarter].starter!==false&&window.stackfallIsWeaponUnlocked?.(state.selectedStarter)!==false,fallback=unlockedEntries[0]?.[0]||'blade';state.selectedStarter=allowed?state.selectedStarter:fallback;
    const selected=weaponText(state.selectedStarter);ui.starterName.textContent=selected.name;ui.starterDesc.textContent=`${selected.role} · ${selected.desc}`;
    const progressEl=ensureStarterProgress();if(progressEl)progressEl.textContent=uiText().progress(unlockedEntries.length,entries.length);
  }
  function rewardInfo(row){
    const reward=row?.rewards?.[0];if(!reward)return{icon:'◆',name:uiText().reward,type:uiText().reward};
    if(reward.type==='unlock_weapon'){const text=weaponText(reward.key);return{icon:WEAPONS[reward.key]?.icon||'✦',name:text.name,type:uiText().weaponRewards};}
    if(reward.type==='unlock_feature')return{icon:'◆',name:window.stackfallFeatureName?.(reward.key)||reward.key,type:uiText().featureRewards};
    if(reward.type==='currency')return{icon:reward.key==='coreShard'?'◆':'✦',name:`${reward.key} +${reward.amount||1}`,type:uiText().reward};
    return{icon:'◆',name:reward.key||uiText().reward,type:uiText().reward};
  }
  function achievementProgress(row){
    const meta=window.stackfallMeta||{},current=(()=>{
      if(row.kind==='survive')return Math.floor(progress.bestSurvival/60);
      if(row.kind==='hardSurvive')return Math.floor((progress.bestHardSurvival||0)/60);
      if(row.kind==='level')return progress.bestLevel;
      if(row.kind==='chain')return progress.bestCombo;
      if(row.kind==='runKills')return progress.bestRunKills;
      if(row.kind==='lifetimeKills')return Math.floor(meta.lifetime?.kills||0)+(isEndless()&&state.mode==='playing'?Math.max(0,Math.floor(Number(state.kills)||0)):0);
      if(row.kind==='mini'||row.kind==='boss'||row.kind==='apex')return Math.floor(meta.bossRecords?.[row.kind]||0);
      return 0;
    })();
    return`${Math.min(current,row.value)} / ${row.value}`;
  }
  function ensureAchievementToastRoot(){
    let root=document.querySelector('#achievementToastStack');if(root)return root;
    root=document.createElement('div');root.id='achievementToastStack';root.className='achievement-toast-stack';root.setAttribute('aria-live','polite');root.setAttribute('aria-atomic','false');document.querySelector('#app')?.appendChild(root);return root;
  }
  function showAchievementToasts(rows=[]){
    if(!rows.length)return;const root=ensureAchievementToastRoot();
    for(const row of rows){
      const reward=rewardInfo(row),toast=document.createElement('div');toast.className='achievement-toast';toast.innerHTML=`<i>${reward.icon}</i><div><span>${uiText().achievementToast}</span><strong>${reward.name}</strong><small>${conditionText(row)}</small></div>`;root.appendChild(toast);
      requestAnimationFrame(()=>toast.classList.add('show'));setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),240);},3200);
      while(root.children.length>3)root.firstElementChild?.remove();
    }
    try{audio.pickup();}catch{}
  }
  function renderAchievementUnlocks(rows=[]){
    const modal=document.querySelector('#gameOverScreen .result-modal');if(!modal)return;
    let root=document.querySelector('#endlessAchievementUnlocks');if(!root){root=document.createElement('div');root.id='endlessAchievementUnlocks';root.className='endless-achievement-unlocks hidden';document.querySelector('#resultCurrencyReward')?.insertAdjacentElement('afterend',root);}
    if(!rows.length){root.classList.add('hidden');root.innerHTML='';return;}
    root.classList.remove('hidden');root.innerHTML=`<span>${uiText().unlocked}</span>${rows.map(row=>{const reward=rewardInfo(row);return`<b><i>${reward.icon}</i>${reward.name}</b>`;}).join('')}`;
  }
  function ensureAchievementUi(){
    const hub=document.querySelector('.hub-panel');if(!hub)return;
    let entry=document.querySelector('#achievementHubBtn');
    if(!entry){
      entry=document.createElement('button');entry.id='achievementHubBtn';entry.className='hub-mode-card achievement-card';entry.type='button';
      (document.querySelector('#upgradeHubBtn')||hub.lastElementChild)?.insertAdjacentElement('afterend',entry);
      entry.addEventListener('click',openAchievements);
    }
    let screen=document.querySelector('#achievementScreen');
    if(!screen){
      screen=document.createElement('section');screen.id='achievementScreen';screen.className='overlay achievement-screen hidden';screen.setAttribute('aria-labelledby','achievementTitle');
      screen.innerHTML=`<div class="achievement-modal glass"><div class="achievement-heading"><div><span id="achievementKicker"></span><h2 id="achievementTitle"></h2><p id="achievementDesc"></p></div><div class="achievement-total"><b id="achievementTotal"></b><i><span id="achievementTotalFill"></span></i></div><button id="achievementCloseBtn" type="button" aria-label="Close">×</button></div><div id="achievementBody" class="achievement-body"></div></div>`;
      document.querySelector('#app')?.appendChild(screen);
      screen.querySelector('#achievementCloseBtn')?.addEventListener('click',closeAchievements);
      screen.addEventListener('pointerdown',e=>{if(e.target===screen)closeAchievements();});
    }
  }
  function renderAchievementSection(title,rows){
    const done=rows.filter(row=>progress.completed.includes(row.id)).length;
    return`<section class="achievement-section"><div class="achievement-section-head"><strong>${title}</strong><span>${done} / ${rows.length}</span></div><div class="achievement-grid">${rows.map(row=>{
      const complete=progress.completed.includes(row.id),reward=rewardInfo(row);
      return`<article class="achievement-row${complete?' complete':''}"><div class="achievement-reward-icon">${complete?'✓':'🔒'}</div><div class="achievement-copy"><span>${reward.type}</span><strong>${reward.icon} ${reward.name}</strong><p>${conditionText(row)}</p></div><div class="achievement-status"><b>${complete?uiText().complete:uiText().locked}</b><small>${complete?`${row.value} / ${row.value}`:achievementProgress(row)}</small></div></article>`;
    }).join('')}</div></section>`;
  }
  function renderAchievementUi(){
    ensureAchievementUi();
    const entry=document.querySelector('#achievementHubBtn'),screen=document.querySelector('#achievementScreen'),text=uiText();
    if(entry)entry.innerHTML=`<span class="hub-mode-kicker">${text.achievementKicker}</span><strong>${text.achievementTitle}</strong><p>${text.achievementDesc}</p><i>★</i>`;
    if(!screen)return;
    const complete=ALL_ACHIEVEMENTS.filter(row=>progress.completed.includes(row.id)).length,total=ALL_ACHIEVEMENTS.length;
    screen.querySelector('#achievementKicker').textContent=text.achievementKicker;
    screen.querySelector('#achievementTitle').textContent=text.achievementTitle;
    screen.querySelector('#achievementDesc').textContent=text.achievementDesc;
    screen.querySelector('#achievementTotal').textContent=text.achievementSummary(complete,total);
    screen.querySelector('#achievementTotalFill').style.width=`${total?complete/total*100:0}%`;
    screen.querySelector('#achievementBody').innerHTML=renderAchievementSection(text.weaponRewards,ACHIEVEMENTS)+renderAchievementSection(text.featureRewards,FEATURE_ACHIEVEMENTS);
  }
  let achievementReturnFocus=null;
  function openAchievements(){
    ensureAchievementUi();renderAchievementUi();const screen=document.querySelector('#achievementScreen');if(!screen)return;
    achievementReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;screen.classList.remove('hidden');screen.querySelector('#achievementCloseBtn')?.focus();try{audio.pickup();}catch{}
  }
  function closeAchievements(){
    const screen=document.querySelector('#achievementScreen');if(!screen)return;screen.classList.add('hidden');
    if(achievementReturnFocus?.isConnected)achievementReturnFocus.focus();achievementReturnFocus=null;
  }
  function featureAchievementCondition(key){const row=byFeature.get(key);return row?conditionText(row):'';}

  function refreshLegacyLockCopy(){
    for(const key of['hard','very-hard']){
      const button=document.querySelector(`.difficulty-option[data-difficulty="${key}"]`);
      if(button?.disabled){const small=button.querySelector('small'),condition=featureAchievementCondition(key);if(small&&condition&&small.textContent!==condition)small.textContent=condition;}
    }
    const lock=document.querySelector('#upgradeLockReason');
    if(lock&&/STAGE\s*16|CLEAR STAGE 16|스테이지\s*16/i.test(lock.textContent||'')){
      const condition=featureAchievementCondition('core-development-iii');
      if(condition){const next=language()==='ko'?`3차 돌파 · ${condition}`:`BREAKTHROUGH III · ${condition}`;if(lock.textContent!==next)lock.textContent=next;}
    }
    const rows=document.querySelectorAll('#unlockManagementList .unlock-feature-row');
    for(const row of rows){
      const name=row.querySelector('strong'),meta=row.querySelector('small');if(!name||!meta)continue;
      const key=FEATURE_ACHIEVEMENTS.find(entry=>(window.stackfallFeatureName?.(rewardOf(entry,'unlock_feature')?.key)||rewardOf(entry,'unlock_feature')?.key)===name.textContent)?.rewards?.[0]?.key;
      if(key){const next=language()==='ko'?'업적 보상':'Achievement reward';if(meta.textContent!==next)meta.textContent=next;}
    }
  }
  function installLegacyLockCopyPatches(){
    const difficultyRoot=document.querySelector('#difficultyOptions');
    if(difficultyRoot&&!difficultyRoot.dataset.achievementCopyWatch){difficultyRoot.dataset.achievementCopyWatch='true';difficultyRoot.addEventListener('click',()=>queueMicrotask(refreshLegacyLockCopy));}
    if(typeof renderUnlockManagement==='function'&&!renderUnlockManagement.__achievementCopyPatched){const base=renderUnlockManagement,wrapped=function(){base();refreshLegacyLockCopy();};wrapped.__achievementCopyPatched=true;renderUnlockManagement=wrapped;}
    if(typeof renderUpgradeUi==='function'&&!renderUpgradeUi.__achievementCopyPatched){const base=renderUpgradeUi,wrapped=function(){const result=base();refreshLegacyLockCopy();return result;};wrapped.__achievementCopyPatched=true;renderUpgradeUi=wrapped;}
    refreshLegacyLockCopy();
  }

  function formatProfileTime(seconds){const total=Math.max(0,Math.floor(Number(seconds)||0)),m=Math.floor(total/60),s=total%60;return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function renderEndlessProfile(){
    const screen=document.querySelector('#profileScreen');if(!screen)return;
    const text=PROFILE_TEXT[language()]||PROFILE_TEXT.en,meta=window.stackfallMeta||{};
    const weaponEntries=Object.entries(WEAPONS||{}).filter(([,weapon])=>weapon.starter!==false&&!weapon.basic),unlockedWeapons=weaponEntries.filter(([key])=>window.stackfallIsWeaponUnlocked?.(key)!==false).length;
    const completed=ALL_ACHIEVEMENTS.filter(row=>progress.completed.includes(row.id)).length;
    const rows=[
      ['#profileDetailClears',text.survival,formatProfileTime(progress.bestSurvival)],
      ['#profileDetailStageClears',text.level,progress.bestLevel],
      ['#profileDetailRuns',text.combo,progress.bestCombo],
      ['#profileDetailKills',text.runKills,progress.bestRunKills],
      ['#profileDetailBosses',text.weapons,`${unlockedWeapons} / ${weaponEntries.length}`],
      ['#profileDetailWeapons',text.achievements,`${completed} / ${ALL_ACHIEVEMENTS.length}`]
    ];
    for(const[selector,label,value]of rows){const valueEl=screen.querySelector(selector),labelEl=valueEl?.parentElement?.querySelector('span');if(labelEl)labelEl.textContent=label;if(valueEl)valueEl.textContent=String(value);}
    const combatGrid=screen.querySelector('.profile-boss-grid');
    if(combatGrid){
      let runsValue=combatGrid.querySelector('#profileEndlessRuns');
      if(!runsValue){const row=document.createElement('div');row.innerHTML='<span></span><b id="profileEndlessRuns">0</b>';combatGrid.prepend(row);runsValue=row.querySelector('#profileEndlessRuns');}
      let killsValue=combatGrid.querySelector('#profileEndlessKills');
      if(!killsValue){const row=document.createElement('div');row.innerHTML='<span></span><b id="profileEndlessKills">0</b>';runsValue?.parentElement?.insertAdjacentElement('afterend',row);killsValue=row.querySelector('#profileEndlessKills');}
      const runsLabel=runsValue?.parentElement?.querySelector('span'),killsLabel=killsValue?.parentElement?.querySelector('span');
      if(runsLabel)runsLabel.textContent=text.runs;if(runsValue)runsValue.textContent=String(meta.lifetime?.runs||0);
      if(killsLabel)killsLabel.textContent=text.kills;if(killsValue)killsValue.textContent=String(meta.lifetime?.kills||0);
    }
  }
  const baseRenderMetaUi=window.renderStackfallMetaUi;
  if(typeof baseRenderMetaUi==='function'&&!baseRenderMetaUi.__endlessProfile){
    const wrapped=function(){const result=baseRenderMetaUi();renderEndlessProfile();return result;};wrapped.__endlessProfile=true;window.renderStackfallMetaUi=wrapped;
  }
  document.querySelector('#hubProfile')?.addEventListener('click',()=>queueMicrotask(renderEndlessProfile));
  document.querySelector('#profileNameSaveBtn')?.addEventListener('click',()=>queueMicrotask(renderEndlessProfile));

  const style=document.createElement('style');style.textContent=`
    #stageMapBtn.stage-sealed{cursor:not-allowed;filter:saturate(.45);opacity:.72}#stageMapBtn.stage-sealed>i{font-style:normal;font-size:22px;opacity:.88}#stageMapBtn.stage-sealed:hover{transform:none}
    @media(min-width:761px){.hub-mode-card.upgrade-card{grid-column:auto;min-height:170px}.hub-mode-card.upgrade-card strong{font-size:clamp(28px,3.1vw,42px)}}
    .hub-mode-card.achievement-card:before{background:radial-gradient(circle at 18% 20%,rgba(116,242,167,.16),transparent 35%),radial-gradient(circle at 88% 82%,rgba(124,232,255,.14),transparent 38%)}.achievement-card .hub-mode-kicker{color:#8fffc8}
    .starter-head{position:relative}.starter-unlock-progress{position:absolute;right:0;top:0;font-style:normal;font-size:10px;font-weight:900;letter-spacing:.06em;color:#9fb0d4}
    .starter-option.locked{position:relative;cursor:not-allowed;opacity:.64;filter:saturate(.42);overflow:hidden}.starter-option.locked .starter-icon{opacity:.55}.starter-option.locked .starter-label{opacity:.82}.starter-lock{position:absolute;right:7px;top:6px;font-size:12px;filter:grayscale(1)}.starter-condition{display:block;width:100%;margin-top:4px;color:#aab4cd;font-size:8px;line-height:1.25;white-space:normal}.starter-option.locked:hover{transform:none}
    .endless-achievement-unlocks{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:10px 0 2px}.endless-achievement-unlocks>span{width:100%;text-align:center;font-size:9px;font-weight:900;letter-spacing:.12em;color:#8fffe0}.endless-achievement-unlocks>b{display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid rgba(143,255,224,.24);background:rgba(18,44,55,.48);font-size:11px}.endless-achievement-unlocks i{font-style:normal;color:#dffcff}
    .achievement-toast-stack{position:fixed;right:18px;top:76px;z-index:48;display:grid;gap:8px;width:min(330px,calc(100vw - 28px));pointer-events:none}.achievement-toast{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:center;padding:11px 12px;border:1px solid rgba(143,255,224,.25);border-radius:13px;background:linear-gradient(135deg,rgba(12,34,42,.94),rgba(6,10,25,.94));box-shadow:0 10px 28px rgba(0,0,0,.26),0 0 20px rgba(116,242,167,.08);opacity:0;transform:translateX(20px);transition:opacity .2s ease,transform .2s ease}.achievement-toast.show{opacity:1;transform:translateX(0)}.achievement-toast>i{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(143,255,224,.22);border-radius:10px;background:rgba(116,242,167,.07);color:#dcfff1;font-style:normal;font-size:16px}.achievement-toast>div{min-width:0}.achievement-toast span{display:block;color:#8fffc8;font-size:8px;font-weight:900;letter-spacing:.13em}.achievement-toast strong{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4fffb;font-size:12px}.achievement-toast small{display:block;margin-top:3px;color:#9eacc6;font-size:8px}.achievement-screen{z-index:52;padding:18px;background:rgba(2,4,13,.82);backdrop-filter:blur(14px)}.achievement-modal{width:min(1040px,95vw);max-height:92vh;display:grid;grid-template-rows:auto minmax(0,1fr);padding:24px;border-radius:24px;overflow:hidden}.achievement-heading{display:grid;grid-template-columns:minmax(0,1fr) 210px 44px;gap:18px;align-items:center;padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,.08)}.achievement-heading>div:first-child>span{color:#8fffc8;font-size:9px;font-weight:900;letter-spacing:.20em}.achievement-heading h2{margin:4px 0 0;font:38px/1 "Black Han Sans",sans-serif}.achievement-heading p{margin:7px 0 0;color:#8c9abd;font-size:10px}.achievement-heading>button{width:44px;height:44px;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(7,11,29,.82);color:#fff;font-size:25px;cursor:pointer}.achievement-total{display:grid;gap:7px}.achievement-total>b{text-align:right;color:#dffdf2;font-size:12px}.achievement-total>i{height:6px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}.achievement-total>i>span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#74f2a7,#7ce8ff);box-shadow:0 0 12px rgba(116,242,167,.28)}
    .achievement-body{min-height:0;overflow:auto;padding:18px 4px 4px}.achievement-section+.achievement-section{margin-top:22px}.achievement-section-head{display:flex;justify-content:space-between;align-items:center;margin:0 2px 9px}.achievement-section-head strong{font-size:11px;letter-spacing:.07em}.achievement-section-head span{color:#8292b6;font-size:9px;font-weight:900}.achievement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.achievement-row{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:10px;align-items:center;min-height:88px;padding:12px;border:1px solid rgba(255,255,255,.075);border-radius:14px;background:rgba(5,9,24,.58);opacity:.78}.achievement-row.complete{border-color:rgba(116,242,167,.20);background:linear-gradient(135deg,rgba(18,53,46,.42),rgba(6,11,27,.64));opacity:1}.achievement-reward-icon{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.04);font-size:14px}.achievement-row.complete .achievement-reward-icon{border-color:rgba(116,242,167,.28);color:#9affc5;background:rgba(116,242,167,.08)}.achievement-copy{min-width:0}.achievement-copy>span{display:block;color:#7890b7;font-size:7px;font-weight:900;letter-spacing:.10em}.achievement-copy>strong{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f1f7ff;font-size:12px}.achievement-copy>p{margin:5px 0 0;color:#9ba8c6;font-size:9px}.achievement-status{text-align:right}.achievement-status>b{display:block;color:#8795b5;font-size:8px}.achievement-status>small{display:block;margin-top:5px;color:#b6c3df;font-size:9px;font-weight:900}.achievement-row.complete .achievement-status>b{color:#8fffc1}
    @media(max-width:760px){.achievement-toast-stack{right:50%;top:70px;transform:translateX(50%);width:min(320px,calc(100vw - 20px))}.achievement-toast{transform:translateY(-10px)}.achievement-toast.show{transform:translateY(0)}.achievement-modal{padding:16px}.achievement-heading{grid-template-columns:1fr 40px;gap:11px}.achievement-total{grid-column:1/-1;grid-row:2}.achievement-total>b{text-align:left}.achievement-heading>button{grid-column:2;grid-row:1;width:40px;height:40px}.achievement-grid{grid-template-columns:1fr}.achievement-body{padding-top:14px}.achievement-row{min-height:80px}.hub-mode-card.achievement-card{grid-column:1}}
  `;document.head.appendChild(style);

  let liveAchievementPoll=0;
  const baseAchievementUpdatePlayer=updatePlayer;
  updatePlayer=function endlessAchievementUpdatePlayer(dt){
    baseAchievementUpdatePlayer(dt);if(state.mode!=='playing'||!isEndless())return;liveAchievementPoll-=dt;if(liveAchievementPoll>0)return;liveAchievementPoll=.4;
    const completed=evaluateAchievements(snapshotRun());if(!completed.length)return;showAchievementToasts(completed);renderAchievementUi();renderEndlessProfile();window.renderStackfallMetaUi?.();
  };

  const baseEndGame=endGame;
  endGame=function endlessProgressionEndGame(){
    if(state.mode==='gameover')return;
    const endless=isEndless(),run=snapshotRun();let survivalReward=0,completed=[];
    if(endless){rememberRunBest(run);survivalReward=claimSurvivalMilestones(run.time);completed=evaluateAchievements(run);}
    baseEndGame();
    renderAchievementUnlocks(completed);renderAchievementUi();renderEndlessProfile();
    if(survivalReward>0)window.renderStackfallMetaUi?.();
  };
  const baseShowMainMenu=showMainMenu;
  showMainMenu=function endlessProgressionMainMenu(){baseShowMainMenu();applyStageSeal();finalRenderStarterOptions();renderAchievementUi();renderEndlessProfile();};
  const baseApplyLanguage=applyLanguage;
  applyLanguage=function endlessProgressionLanguage(){baseApplyLanguage();applyStageSeal();finalRenderStarterOptions();renderAchievementUi();renderEndlessProfile();window.renderStackfallDifficulty?.();};
  renderStarterOptions=finalRenderStarterOptions;
  window.addEventListener('keydown',e=>{const screen=document.querySelector('#achievementScreen');if(e.code==='Escape'&&screen&&!screen.classList.contains('hidden')){e.preventDefault();e.stopImmediatePropagation();closeAchievements();}},true);

  ensureBaselineFeatures();restoreAchievementRewards();applyStageSeal();finalRenderStarterOptions();ensureAchievementUi();installLegacyLockCopyPatches();renderAchievementUi();renderAchievementUnlocks([]);renderEndlessProfile();window.renderStackfallMetaUi?.();
  window.STACKFALL_ENDLESS_ACHIEVEMENTS=ACHIEVEMENTS;
  window.STACKFALL_ENDLESS_FEATURE_ACHIEVEMENTS=FEATURE_ACHIEVEMENTS;
  window.STACKFALL_ENDLESS_SURVIVAL_MILESTONES=SURVIVAL_MILESTONES;
  window.stackfallFeatureAchievementCondition=featureAchievementCondition;
  window.stackfallEndlessProgression=Object.freeze({storageKey:STORAGE_KEY,progress,achievements:ALL_ACHIEVEMENTS,weaponAchievements:ACHIEVEMENTS,featureAchievements:FEATURE_ACHIEVEMENTS,survivalMilestones:SURVIVAL_MILESTONES,conditionText,featureAchievementCondition,evaluateAchievements,claimSurvivalMilestones,applyReward,renderStarterOptions:finalRenderStarterOptions,applyStageSeal,renderAchievements:renderAchievementUi,renderProfile:renderEndlessProfile,openAchievements,showAchievementToasts});
})();