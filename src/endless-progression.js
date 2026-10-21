(()=>{
  const PROFILE=window.stackfallMetaStorageProfile==='developer'?'developer':'player';
  const STORAGE_KEY=PROFILE==='developer'?'stackfall.endless.progression.dev.v1':'stackfall.endless.progression.v1';
  const BASELINE_FEATURES=Object.freeze(['endless','core-development']);
  const SURVIVAL_MILESTONES=Object.freeze([300,600,900,1200,1800,2700,3600]);
  const INITIAL_WEAPONS=new Set(window.STACKFALL_INITIAL_WEAPONS||['blade','ember','bulwark','gravity']);
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
  const byWeapon=new Map(ACHIEVEMENTS.map(row=>[row.weapon,row]));
  const sanitizeStrings=value=>Array.isArray(value)?[...new Set(value.filter(item=>typeof item==='string'))]:[];
  const sanitizeNumbers=value=>Array.isArray(value)?[...new Set(value.map(Number).filter(Number.isFinite).map(n=>Math.max(0,Math.floor(n))))]:[];
  function loadProgress(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return{version:1,completed:sanitizeStrings(saved.completed),weaponUnlocks:sanitizeStrings(saved.weaponUnlocks),survivalMilestones:sanitizeNumbers(saved.survivalMilestones),bestSurvival:Math.max(0,Number(saved.bestSurvival)||0)};
    }catch{return{version:1,completed:[],weaponUnlocks:[],survivalMilestones:[],bestSurvival:0};}
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
    ko:{stage:'스테이지 모드는 추후 업데이트됩니다.',progress:(a,b)=>`${a} / ${b} 해금`,condition:'획득 조건',unlocked:'장비 해금',milestone:'생존 기록 보상'},
    en:{stage:'Stage mode will return in a future update.',progress:(a,b)=>`${a} / ${b} unlocked`,condition:'Unlock',unlocked:'WEAPON UNLOCKED',milestone:'SURVIVAL RECORD'},
    ja:{stage:'ステージモードは今後のアップデートで追加されます。',progress:(a,b)=>`${a} / ${b} 解放`,condition:'獲得条件',unlocked:'武器解放',milestone:'生存記録報酬'},
    'zh-CN':{stage:'关卡模式将在后续更新中开放。',progress:(a,b)=>`${a} / ${b} 已解锁`,condition:'解锁条件',unlocked:'武器解锁',milestone:'生存记录奖励'},
    es:{stage:'El modo Etapas volverá en una futura actualización.',progress:(a,b)=>`${a} / ${b} desbloqueadas`,condition:'Desbloqueo',unlocked:'ARMA DESBLOQUEADA',milestone:'RÉCORD DE SUPERVIVENCIA'},
    fr:{stage:'Le mode Étapes reviendra dans une prochaine mise à jour.',progress:(a,b)=>`${a} / ${b} débloquées`,condition:'Déblocage',unlocked:'ARME DÉBLOQUÉE',milestone:'RECORD DE SURVIE'}
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
  function restoreAchievementWeapons(){
    let changed=false;
    for(const id of progress.completed){const row=ACHIEVEMENTS.find(entry=>entry.id===id);if(row&&!progress.weaponUnlocks.includes(row.weapon)){progress.weaponUnlocks.push(row.weapon);changed=true;}}
    for(const key of progress.weaponUnlocks)if(WEAPONS?.[key])window.stackfallUnlockWeapon?.(key);
    if(changed)saveProgress();
  }
  function snapshotRun(){return{time:Math.max(0,Number(state.time)||0),kills:Math.max(0,Math.floor(Number(state.kills)||0)),level:Math.max(1,Math.floor(Number(state.level)||1)),maxCombo:Math.max(0,Math.floor(Number(state.maxCombo)||0))};}
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
    const meta=window.stackfallMeta||{},newUnlocks=[];
    for(const row of ACHIEVEMENTS){
      if(progress.completed.includes(row.id)||!row.test(run,meta))continue;
      progress.completed.push(row.id);
      const wasUnlocked=window.stackfallIsWeaponUnlocked?.(row.weapon)===true;
      if(!progress.weaponUnlocks.includes(row.weapon))progress.weaponUnlocks.push(row.weapon);
      if(!wasUnlocked&&window.stackfallUnlockWeapon?.(row.weapon))newUnlocks.push(row);
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
  function renderAchievementUnlocks(rows=[]){
    const modal=document.querySelector('#gameOverScreen .result-modal');if(!modal)return;
    let root=document.querySelector('#endlessAchievementUnlocks');if(!root){root=document.createElement('div');root.id='endlessAchievementUnlocks';root.className='endless-achievement-unlocks hidden';document.querySelector('#resultCurrencyReward')?.insertAdjacentElement('afterend',root);}
    if(!rows.length){root.classList.add('hidden');root.innerHTML='';return;}
    root.classList.remove('hidden');root.innerHTML=`<span>${uiText().unlocked}</span>${rows.map(row=>{const text=weaponText(row.weapon);return`<b><i>${WEAPONS[row.weapon]?.icon||'✦'}</i>${text.name}</b>`;}).join('')}`;
  }

  const style=document.createElement('style');style.textContent=`
    #stageMapBtn.stage-sealed{cursor:not-allowed;filter:saturate(.45);opacity:.72}#stageMapBtn.stage-sealed>i{font-style:normal;font-size:22px;opacity:.88}#stageMapBtn.stage-sealed:hover{transform:none}
    .starter-head{position:relative}.starter-unlock-progress{position:absolute;right:0;top:0;font-style:normal;font-size:10px;font-weight:900;letter-spacing:.06em;color:#9fb0d4}
    .starter-option.locked{position:relative;cursor:not-allowed;opacity:.64;filter:saturate(.42);overflow:hidden}.starter-option.locked .starter-icon{opacity:.55}.starter-option.locked .starter-label{opacity:.82}.starter-lock{position:absolute;right:7px;top:6px;font-size:12px;filter:grayscale(1)}.starter-condition{display:block;width:100%;margin-top:4px;color:#aab4cd;font-size:8px;line-height:1.25;white-space:normal}.starter-option.locked:hover{transform:none}
    .endless-achievement-unlocks{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:10px 0 2px}.endless-achievement-unlocks>span{width:100%;text-align:center;font-size:9px;font-weight:900;letter-spacing:.12em;color:#8fffe0}.endless-achievement-unlocks>b{display:flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid rgba(143,255,224,.24);background:rgba(18,44,55,.48);font-size:11px}.endless-achievement-unlocks i{font-style:normal;color:#dffcff}
  `;document.head.appendChild(style);

  const baseEndGame=endGame;
  endGame=function endlessProgressionEndGame(){
    if(state.mode==='gameover')return;
    const endless=isEndless(),run=snapshotRun();let survivalReward=0;if(endless)survivalReward=claimSurvivalMilestones(run.time);
    baseEndGame();
    const unlocked=endless?evaluateAchievements(run):[];renderAchievementUnlocks(unlocked);
    if(survivalReward>0)window.renderStackfallMetaUi?.();
  };
  const baseShowMainMenu=showMainMenu;
  showMainMenu=function endlessProgressionMainMenu(){baseShowMainMenu();applyStageSeal();finalRenderStarterOptions();};
  const baseApplyLanguage=applyLanguage;
  applyLanguage=function endlessProgressionLanguage(){baseApplyLanguage();applyStageSeal();finalRenderStarterOptions();};
  renderStarterOptions=finalRenderStarterOptions;

  ensureBaselineFeatures();restoreAchievementWeapons();applyStageSeal();finalRenderStarterOptions();renderAchievementUnlocks([]);window.renderStackfallMetaUi?.();
  window.STACKFALL_ENDLESS_ACHIEVEMENTS=ACHIEVEMENTS;
  window.STACKFALL_ENDLESS_SURVIVAL_MILESTONES=SURVIVAL_MILESTONES;
  window.stackfallEndlessProgression=Object.freeze({storageKey:STORAGE_KEY,progress,achievements:ACHIEVEMENTS,survivalMilestones:SURVIVAL_MILESTONES,conditionText,evaluateAchievements,claimSurvivalMilestones,renderStarterOptions:finalRenderStarterOptions,applyStageSeal});
})();
