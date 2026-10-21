(()=>{
  const PROFILE=window.stackfallMetaStorageProfile==='developer'?'developer':'player';
  const STORAGE_KEY=PROFILE==='developer'?'stackfall.endless.progression.dev.v1':'stackfall.endless.progression.v1';
  const BASELINE_FEATURES=Object.freeze(['endless','core-development']);
  const SURVIVAL_MILESTONES=Object.freeze([300,600,900,1200,1800,2700,3600]);
  const ACHIEVEMENTS=Object.freeze([
    Object.freeze({id:'survive-3m',weapon:'comet',kind:'survive',value:3,test:(run)=>run.time>=180}),
    Object.freeze({id:'mini-1',weapon:'prism',kind:'mini',value:1,test:(run,meta)=>(meta.bossRecords?.mini||0)>=1}),
    Object.freeze({id:'level-10',weapon:'chrono',kind:'level',value:10,test:(run)=>run.level>=10}),
    Object.freeze({id:'chain-20',weapon:'arc',kind:'chain',value:20,test:(run)=>run.maxCombo>=20}),
    Object.freeze({id:'run-kills-200',weapon:'ion',kind:'runKills',value:200,test:(run)=>run.kills>=200}),
    Object.freeze({id:'boss-1',weapon:'nova',kind:'boss',value:1,test:(run,meta)=>(meta.bossRecords?.boss||0)>=1}),
    Object.freeze({id:'survive-5m',weapon:'drone',kind:'survive',value:5,test:(run)=>run.time>=300}),
    Object.freeze({id:'run-kills-400',weapon:'rail',kind:'runKills',value:400,test:(run)=>run.kills>=400}),
    Object.freeze({id:'level-20',weapon:'spiral',kind:'level',value:20,test:(run)=>run.level>=20}),
    Object.freeze({id:'chain-50',weapon:'mirror',kind:'chain',value:50,test:(run)=>run.maxCombo>=50}),
    Object.freeze({id:'lifetime-kills-1000',weapon:'vacuum',kind:'lifetimeKills',value:1000,test:(run,meta)=>(meta.lifetime?.kills||0)>=1000}),
    Object.freeze({id:'mini-10',weapon:'mine',kind:'mini',value:10,test:(run,meta)=>(meta.bossRecords?.mini||0)>=10}),
    Object.freeze({id:'survive-10m',weapon:'missile',kind:'survive',value:10,test:(run)=>run.time>=600}),
    Object.freeze({id:'apex-1',weapon:'gate',kind:'apex',value:1,test:(run,meta)=>(meta.bossRecords?.apex||0)>=1})
  ]);
  const FEATURE_ACHIEVEMENTS=Object.freeze([
    Object.freeze({id:'feature-special-ability',feature:'special-ability',kind:'boss',value:1,test:(run,meta)=>(meta.bossRecords?.boss||0)>=1}),
    Object.freeze({id:'feature-awakening',feature:'awakening',kind:'survive',value:10,test:(run)=>run.time>=600}),
    Object.freeze({id:'feature-hard',feature:'hard',kind:'apex',value:1,test:(run,meta)=>(meta.bossRecords?.apex||0)>=1}),
    Object.freeze({id:'feature-choice-4',feature:'choice-4',kind:'level',value:25,test:(run)=>run.level>=25}),
    Object.freeze({id:'feature-start-level-3',feature:'start-level-3',kind:'survive',value:15,test:(run)=>run.time>=900}),
    Object.freeze({id:'feature-core-development-iii',feature:'core-development-iii',kind:'apex',value:3,test:(run,meta)=>(meta.bossRecords?.apex||0)>=3}),
    Object.freeze({id:'feature-multiplicity-protocol',feature:'multiplicity-protocol',kind:'survive',value:30,test:(run)=>run.time>=1800})
  ]);
  const ALL_ACHIEVEMENTS=Object.freeze([...ACHIEVEMENTS,...FEATURE_ACHIEVEMENTS]);
  const byWeapon=new Map(ACHIEVEMENTS.map(row=>[row.weapon,row]));
  const byFeature=new Map(FEATURE_ACHIEVEMENTS.map(row=>[row.feature,row]));
  const sanitizeStrings=value=>Array.isArray(value)?[...new Set(value.filter(item=>typeof item==='string'))]:[];
  const sanitizeNumbers=value=>Array.isArray(value)?[...new Set(value.map(Number).filter(Number.isFinite).map(n=>Math.max(0,Math.floor(n))))]:[];
  const sanitizeNumber=value=>Math.max(0,Number(value)||0);

  function loadProgress(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return{
        version:2,
        completed:sanitizeStrings(saved.completed),
        weaponUnlocks:sanitizeStrings(saved.weaponUnlocks),
        featureUnlocks:sanitizeStrings(saved.featureUnlocks),
        survivalMilestones:sanitizeNumbers(saved.survivalMilestones),
        bestSurvival:sanitizeNumber(saved.bestSurvival),
        bestLevel:Math.max(1,Math.floor(sanitizeNumber(saved.bestLevel)||1)),
        bestCombo:Math.floor(sanitizeNumber(saved.bestCombo)),
        bestRunKills:Math.floor(sanitizeNumber(saved.bestRunKills))
      };
    }catch{
      return{version:2,completed:[],weaponUnlocks:[],featureUnlocks:[],survivalMilestones:[],bestSurvival:0,bestLevel:1,bestCombo:0,bestRunKills:0};
    }
  }
  const progress=loadProgress();
  function saveProgress(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch{}}
  function language(){return GAME_SETTINGS?.language||'ko';}
  const CONDITION_TEMPLATES={
    ko:{survive:n=>`무한모드 ${n}분 생존`,mini:n=>`중간보스 누적 ${n}회 처치`,level:n=>`한 판에서 Lv.${n} 도달`,chain:n=>`한 판에서 연쇄 ${n} 달성`,runKills:n=>`한 판에서 적 ${n}마리 처치`,boss:n=>`보스 누적 ${n}회 처치`,lifetimeKills:n=>`적 누적 ${n}마리 처치`,apex:n=>`초월체 ${n}회 처치`},
    en:{survive:n=>`Survive ${n}m in Endless`,mini:n=>`Defeat ${n} mini-boss${n===1?'':'es'}`,level:n=>`Reach Lv.${n} in one run`,chain:n=>`Reach ${n} Chain in one run`,runKills:n=>`Defeat ${n} enemies in one run`,boss:n=>`Defeat ${n} boss${n===1?'':'es'}`,lifetimeKills:n=>`Defeat ${n} enemies total`,apex:n=>`Defeat ${n} Apex`},
    ja:{survive:n=>`エンドレスで${n}分生存`,mini:n=>`中ボスを累計${n}体撃破`,level:n=>`1回の出撃でLv.${n}到達`,chain:n=>`1回の出撃でチェイン${n}`,runKills:n=>`1回の出撃で敵${n}体撃破`,boss:n=>`ボスを累計${n}体撃破`,lifetimeKills:n=>`敵を累計${n}体撃破`,apex:n=>`超越体を${n}体撃破`},
    'zh-CN':{survive:n=>`无尽模式生存${n}分钟`,mini:n=>`累计击败${n}个中型首领`,level:n=>`单局达到Lv.${n}`,chain:n=>`单局达到${n}连击`,runKills:n=>`单局击败${n}个敌人`,boss:n=>`累计击败${n}个首领`,lifetimeKills:n=>`累计击败${n}个敌人`,apex:n=>`击败${n}个超越体`},
    es:{survive:n=>`Sobrevive ${n} min. en Infinito`,mini:n=>`Derrota ${n} minijefe(s)`,level:n=>`Alcanza Nv.${n} en una partida`,chain:n=>`Alcanza cadena ${n} en una partida`,runKills:n=>`Derrota ${n} enemigos en una partida`,boss:n=>`Derrota ${n} jefe(s)`,lifetimeKills:n=>`Derrota ${n} enemigos en total`,apex:n=>`Derrota ${n} Ápice`},
    fr:{survive:n=>`Survivez ${n} min en Sans fin`,mini:n=>`Battez ${n} mini-boss`,level:n=>`Atteignez Niv.${n} en une partie`,chain:n=>`Atteignez une chaîne de ${n}`,runKills:n=>`Battez ${n} ennemis en une partie`,boss:n=>`Battez ${n} boss`,lifetimeKills:n=>`Battez ${n} ennemis au total`,apex:n=>`Battez ${n} Apex`}
  };
  function conditionText(row){const set=CONDITION_TEMPLATES[language()]||CONDITION_TEMPLATES.en;return(set[row.kind]||CONDITION_TEMPLATES.en[row.kind])?.(row.value)||row.id;}
  const UI_TEXT={
    ko:{stage:'스테이지 모드는 추후 업데이트됩니다.',progress:(a,b)=>`${a} / ${b} 해금`,condition:'획득 조건',unlocked:'업적 보상 해금',milestone:'생존 기록 보상',achievementKicker:'ACHIEVEMENTS',achievementTitle:'업적',achievementDesc:'무한모드에서 목표를 달성해 장비와 기능을 해금합니다.',achievementSummary:(a,b)=>`${a} / ${b} 완료`,weaponRewards:'장비 해금',featureRewards:'기능 해금',complete:'완료',locked:'미완료',reward:'보상'},
    en:{stage:'Stage mode will return in a future update.',progress:(a,b)=>`${a} / ${b} unlocked`,condition:'Unlock',unlocked:'ACHIEVEMENT REWARD',milestone:'SURVIVAL RECORD',achievementKicker:'ACHIEVEMENTS',achievementTitle:'Achievements',achievementDesc:'Complete Endless objectives to unlock weapons and features.',achievementSummary:(a,b)=>`${a} / ${b} complete`,weaponRewards:'Weapon unlocks',featureRewards:'Feature unlocks',complete:'COMPLETE',locked:'INCOMPLETE',reward:'Reward'},
    ja:{stage:'ステージモードは今後のアップデートで追加されます。',progress:(a,b)=>`${a} / ${b} 解放`,condition:'獲得条件',unlocked:'実績報酬',milestone:'生存記録報酬',achievementKicker:'ACHIEVEMENTS',achievementTitle:'実績',achievementDesc:'エンドレスの目標を達成して装備と機能を解放します。',achievementSummary:(a,b)=>`${a} / ${b} 完了`,weaponRewards:'装備解放',featureRewards:'機能解放',complete:'完了',locked:'未完了',reward:'報酬'},
    'zh-CN':{stage:'关卡模式将在后续更新中开放。',progress:(a,b)=>`${a} / ${b} 已解锁`,condition:'解锁条件',unlocked:'成就奖励',milestone:'生存记录奖励',achievementKicker:'ACHIEVEMENTS',achievementTitle:'成就',achievementDesc:'完成无尽模式目标，解锁武器和功能。',achievementSummary:(a,b)=>`${a} / ${b} 完成`,weaponRewards:'武器解锁',featureRewards:'功能解锁',complete:'完成',locked:'未完成',reward:'奖励'},
    es:{stage:'El modo Etapas volverá en una futura actualización.',progress:(a,b)=>`${a} / ${b} desbloqueadas`,condition:'Desbloqueo',unlocked:'RECOMPENSA DE LOGRO',milestone:'RÉCORD DE SUPERVIVENCIA',achievementKicker:'ACHIEVEMENTS',achievementTitle:'Logros',achievementDesc:'Cumple objetivos de Infinito para desbloquear armas y funciones.',achievementSummary:(a,b)=>`${a} / ${b} completados`,weaponRewards:'Armas',featureRewards:'Funciones',complete:'COMPLETADO',locked:'INCOMPLETO',reward:'Recompensa'},
    fr:{stage:'Le mode Étapes reviendra dans une prochaine mise à jour.',progress:(a,b)=>`${a} / ${b} débloquées`,condition:'Déblocage',unlocked:'RÉCOMPENSE DE SUCCÈS',milestone:'RECORD DE SURVIE',achievementKicker:'ACHIEVEMENTS',achievementTitle:'Succès',achievementDesc:'Atteignez des objectifs en Sans fin pour débloquer armes et fonctions.',achievementSummary:(a,b)=>`${a} / ${b} terminés`,weaponRewards:'Armes',featureRewards:'Fonctions',complete:'TERMINÉ',locked:'INCOMPLET',reward:'Récompense'}
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
  function restoreAchievementRewards(){
    const meta=window.stackfallMeta||{},acquiredFeatures=new Set(meta.unlockedFeatures||[]);
    let changed=false;
    for(const id of progress.completed){
      const weaponRow=ACHIEVEMENTS.find(entry=>entry.id===id);
      if(weaponRow&&!progress.weaponUnlocks.includes(weaponRow.weapon)){progress.weaponUnlocks.push(weaponRow.weapon);changed=true;}
      const featureRow=FEATURE_ACHIEVEMENTS.find(entry=>entry.id===id);
      if(featureRow&&!progress.featureUnlocks.includes(featureRow.feature)){progress.featureUnlocks.push(featureRow.feature);changed=true;}
    }
    for(const row of FEATURE_ACHIEVEMENTS){
      if(acquiredFeatures.has(row.feature)){
        if(!progress.featureUnlocks.includes(row.feature)){progress.featureUnlocks.push(row.feature);changed=true;}
        if(!progress.completed.includes(row.id)){progress.completed.push(row.id);changed=true;}
      }
    }
    for(const key of progress.weaponUnlocks)if(WEAPONS?.[key])window.stackfallUnlockWeapon?.(key);
    for(const key of progress.featureUnlocks)grantFeature(key);
    if(changed)saveProgress();
    window.renderStackfallDifficulty?.();
  }
  function snapshotRun(){return{time:Math.max(0,Number(state.time)||0),kills:Math.max(0,Math.floor(Number(state.kills)||0)),level:Math.max(1,Math.floor(Number(state.level)||1)),maxCombo:Math.max(0,Math.floor(Number(state.maxCombo)||0))};}
  function rememberRunBest(run){
    progress.bestSurvival=Math.max(progress.bestSurvival,run.time);
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
    const meta=window.stackfallMeta||{},newUnlocks=[];rememberRunBest(run);
    for(const row of ALL_ACHIEVEMENTS){
      if(progress.completed.includes(row.id)||!row.test(run,meta))continue;
      progress.completed.push(row.id);
      if(row.weapon){
        const wasUnlocked=window.stackfallIsWeaponUnlocked?.(row.weapon)===true;
        if(!progress.weaponUnlocks.includes(row.weapon))progress.weaponUnlocks.push(row.weapon);
        if(!wasUnlocked&&window.stackfallUnlockWeapon?.(row.weapon))newUnlocks.push(row);
      }else if(row.feature){
        const wasUnlocked=window.stackfallIsFeatureAcquired?.(row.feature)===true;
        if(!progress.featureUnlocks.includes(row.feature))progress.featureUnlocks.push(row.feature);
        if(!wasUnlocked&&grantFeature(row.feature))newUnlocks.push(row);
      }
    }
    saveProgress();return newUnlocks;
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
    if(row.weapon){const text=weaponText(row.weapon);return{icon:WEAPONS[row.weapon]?.icon||'✦',name:text.name,type:uiText().weaponRewards};}
    return{icon:'◆',name:window.stackfallFeatureName?.(row.feature)||row.feature,type:uiText().featureRewards};
  }
  function achievementProgress(row){
    const meta=window.stackfallMeta||{},current=(()=>{
      if(row.kind==='survive')return Math.floor(progress.bestSurvival/60);
      if(row.kind==='level')return progress.bestLevel;
      if(row.kind==='chain')return progress.bestCombo;
      if(row.kind==='runKills')return progress.bestRunKills;
      if(row.kind==='lifetimeKills')return Math.floor(meta.lifetime?.kills||0);
      if(row.kind==='mini'||row.kind==='boss'||row.kind==='apex')return Math.floor(meta.bossRecords?.[row.kind]||0);
      return 0;
    })();
    return`${Math.min(current,row.value)} / ${row.value}`;
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
    const hardButton=document.querySelector('.difficulty-option[data-difficulty="hard"]');
    if(hardButton?.disabled){
      const small=hardButton.querySelector('small'),condition=featureAchievementCondition('hard');
      if(small&&condition)small.textContent=condition;
    }
    const lock=document.querySelector('#upgradeLockReason');
    if(lock&&/STAGE\s*16|CLEAR STAGE 16|스테이지\s*16/i.test(lock.textContent||'')){
      const condition=featureAchievementCondition('core-development-iii');
      if(condition)lock.textContent=language()==='ko'?`3차 돌파 · ${condition}`:`BREAKTHROUGH III · ${condition}`;
    }
    const rows=document.querySelectorAll('#unlockManagementList .unlock-feature-row');
    for(const row of rows){
      const name=row.querySelector('strong'),meta=row.querySelector('small');if(!name||!meta)continue;
      const key=FEATURE_ACHIEVEMENTS.find(entry=>(window.stackfallFeatureName?.(entry.feature)||entry.feature)===name.textContent)?.feature;
      if(key)meta.textContent=language()==='ko'?'업적 보상':'Achievement reward';
    }
  }
  function installLegacyLockCopyPatches(){
    const difficultyRoot=document.querySelector('#difficultyOptions');
    if(difficultyRoot&&!difficultyRoot.dataset.achievementCopyWatch){
      difficultyRoot.dataset.achievementCopyWatch='true';
      new MutationObserver(()=>queueMicrotask(refreshLegacyLockCopy)).observe(difficultyRoot,{childList:true,subtree:true,characterData:true});
    }
    if(typeof renderUnlockManagement==='function'&&!renderUnlockManagement.__achievementCopyPatched){
      const base=renderUnlockManagement,wrapped=function(){base();refreshLegacyLockCopy();};wrapped.__achievementCopyPatched=true;renderUnlockManagement=wrapped;
    }
    if(typeof renderUpgradeUi==='function'&&!renderUpgradeUi.__achievementCopyPatched){
      const base=renderUpgradeUi,wrapped=function(){const result=base();refreshLegacyLockCopy();return result;};wrapped.__achievementCopyPatched=true;renderUpgradeUi=wrapped;
    }
    refreshLegacyLockCopy();
  }

  const style=document.createElement('style');style.textContent=`
    #stageMapBtn.stage-sealed{cursor:not-allowed;filter:saturate(.45);opacity:.72}#stageMapBtn.stage-sealed>i{font-style:normal;font-size:22px;opacity:.88}#stageMapBtn.stage-sealed:hover{transform:none}
    .hub-mode-card.achievement-card:before{background:radial-gradient(circle at 18% 20%,rgba(116,242,167,.16),transparent 35%),radial-gradient(circle at 88% 82%,rgba(124,232,255,.14),transparent 38%)}.achievement-card .hub-mode-kicker{color:#8fffc8}
    .starter-head{position:relative}.starter-unlock-progress{position:absolute;right:0;top:0;font-style:normal;font-size:10px;font-weight:900;letter-spacing:.06em;color:#9fb0d4}
    .starter-option.locked{position:relative;cursor:not-allowed;opacity:.64;filter:saturate(.42);overflow:hidden}.starter-option.locked .starter-icon{opacity:.55}.starter-option.locked .starter-label{opacity:.82}.starter-lock{position:absolute;right:7px;top:6px;font-size:12px;filter:grayscale(1)}.starter-condition{display:block;width:100%;margin-top:4px;color:#aab4cd;font-size:8px;line-height:1.25;white-space:normal}.starter-option.locked:hover{transform:none}
    .endless-achievement-unlocks{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:10px 0 2px}.endless-achievement-unlocks>span{width:100%;text-align:center;font-size:9px;font-weight:900;letter-spacing:.12em;color:#8fffe0}.endless-achievement-unlocks>b{display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid rgba(143,255,224,.24);background:rgba(18,44,55,.48);font-size:11px}.endless-achievement-unlocks i{font-style:normal;color:#dffcff}
    .achievement-screen{z-index:52;padding:18px;background:rgba(2,4,13,.82);backdrop-filter:blur(14px)}.achievement-modal{width:min(1040px,95vw);max-height:92vh;display:grid;grid-template-rows:auto minmax(0,1fr);padding:24px;border-radius:24px;overflow:hidden}.achievement-heading{display:grid;grid-template-columns:minmax(0,1fr) 210px 44px;gap:18px;align-items:center;padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,.08)}.achievement-heading>div:first-child>span{color:#8fffc8;font-size:9px;font-weight:900;letter-spacing:.20em}.achievement-heading h2{margin:4px 0 0;font:38px/1 "Black Han Sans",sans-serif}.achievement-heading p{margin:7px 0 0;color:#8c9abd;font-size:10px}.achievement-heading>button{width:44px;height:44px;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(7,11,29,.82);color:#fff;font-size:25px;cursor:pointer}.achievement-total{display:grid;gap:7px}.achievement-total>b{text-align:right;color:#dffdf2;font-size:12px}.achievement-total>i{height:6px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}.achievement-total>i>span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#74f2a7,#7ce8ff);box-shadow:0 0 12px rgba(116,242,167,.28)}
    .achievement-body{min-height:0;overflow:auto;padding:18px 4px 4px}.achievement-section+.achievement-section{margin-top:22px}.achievement-section-head{display:flex;justify-content:space-between;align-items:center;margin:0 2px 9px}.achievement-section-head strong{font-size:11px;letter-spacing:.07em}.achievement-section-head span{color:#8292b6;font-size:9px;font-weight:900}.achievement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.achievement-row{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:10px;align-items:center;min-height:88px;padding:12px;border:1px solid rgba(255,255,255,.075);border-radius:14px;background:rgba(5,9,24,.58);opacity:.78}.achievement-row.complete{border-color:rgba(116,242,167,.20);background:linear-gradient(135deg,rgba(18,53,46,.42),rgba(6,11,27,.64));opacity:1}.achievement-reward-icon{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.04);font-size:14px}.achievement-row.complete .achievement-reward-icon{border-color:rgba(116,242,167,.28);color:#9affc5;background:rgba(116,242,167,.08)}.achievement-copy{min-width:0}.achievement-copy>span{display:block;color:#7890b7;font-size:7px;font-weight:900;letter-spacing:.10em}.achievement-copy>strong{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f1f7ff;font-size:12px}.achievement-copy>p{margin:5px 0 0;color:#9ba8c6;font-size:9px}.achievement-status{text-align:right}.achievement-status>b{display:block;color:#8795b5;font-size:8px}.achievement-status>small{display:block;margin-top:5px;color:#b6c3df;font-size:9px;font-weight:900}.achievement-row.complete .achievement-status>b{color:#8fffc1}
    @media(max-width:760px){.achievement-modal{padding:16px}.achievement-heading{grid-template-columns:1fr 40px;gap:11px}.achievement-total{grid-column:1/-1;grid-row:2}.achievement-total>b{text-align:left}.achievement-heading>button{grid-column:2;grid-row:1;width:40px;height:40px}.achievement-grid{grid-template-columns:1fr}.achievement-body{padding-top:14px}.achievement-row{min-height:80px}.hub-mode-card.achievement-card{grid-column:1}}
  `;document.head.appendChild(style);

  const baseEndGame=endGame;
  endGame=function endlessProgressionEndGame(){
    if(state.mode==='gameover')return;
    const endless=isEndless(),run=snapshotRun();let survivalReward=0;if(endless){rememberRunBest(run);survivalReward=claimSurvivalMilestones(run.time);}
    baseEndGame();
    const unlocked=endless?evaluateAchievements(run):[];renderAchievementUnlocks(unlocked);renderAchievementUi();
    if(survivalReward>0)window.renderStackfallMetaUi?.();
  };
  const baseShowMainMenu=showMainMenu;
  showMainMenu=function endlessProgressionMainMenu(){baseShowMainMenu();applyStageSeal();finalRenderStarterOptions();renderAchievementUi();};
  const baseApplyLanguage=applyLanguage;
  applyLanguage=function endlessProgressionLanguage(){baseApplyLanguage();applyStageSeal();finalRenderStarterOptions();renderAchievementUi();window.renderStackfallDifficulty?.();};
  renderStarterOptions=finalRenderStarterOptions;
  window.addEventListener('keydown',e=>{const screen=document.querySelector('#achievementScreen');if(e.code==='Escape'&&screen&&!screen.classList.contains('hidden')){e.preventDefault();e.stopImmediatePropagation();closeAchievements();}},true);

  ensureBaselineFeatures();restoreAchievementRewards();applyStageSeal();finalRenderStarterOptions();ensureAchievementUi();installLegacyLockCopyPatches();renderAchievementUi();renderAchievementUnlocks([]);window.renderStackfallMetaUi?.();
  window.STACKFALL_ENDLESS_ACHIEVEMENTS=ACHIEVEMENTS;
  window.STACKFALL_ENDLESS_FEATURE_ACHIEVEMENTS=FEATURE_ACHIEVEMENTS;
  window.STACKFALL_ENDLESS_SURVIVAL_MILESTONES=SURVIVAL_MILESTONES;
  window.stackfallFeatureAchievementCondition=featureAchievementCondition;
  window.stackfallEndlessProgression=Object.freeze({storageKey:STORAGE_KEY,progress,achievements:ALL_ACHIEVEMENTS,weaponAchievements:ACHIEVEMENTS,featureAchievements:FEATURE_ACHIEVEMENTS,survivalMilestones:SURVIVAL_MILESTONES,conditionText,featureAchievementCondition,evaluateAchievements,claimSurvivalMilestones,renderStarterOptions:finalRenderStarterOptions,applyStageSeal,renderAchievements:renderAchievementUi,openAchievements});
})();
