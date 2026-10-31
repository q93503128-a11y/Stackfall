(()=>{
  'use strict';

  const PROFILE=window.stackfallMetaStorageProfile==='developer'?'developer':'player';
  const STORAGE_KEY=PROFILE==='developer'?'stackfall.endless.progression.dev.v1':'stackfall.endless.progression.v1';
  const BASELINE_FEATURES=Object.freeze(['endless','core-development']);
  const APEX_FORMS=Object.freeze(['chronophage','starforge','lastconstellation']);
  const reward=(type,key,amount=1)=>Object.freeze({type,key,amount});
  const weapon=key=>reward('unlock_weapon',key);
  const feature=key=>reward('unlock_feature',key);
  const stardust=amount=>reward('currency','stardust',amount);
  const shard=(amount=1)=>reward('currency','coreShard',amount);
  const achievement=(id,kind,value,nameKo,nameEn,descKo,descEn,rewards=[],format='number')=>Object.freeze({
    id,kind,value,name:Object.freeze({ko:nameKo,en:nameEn}),desc:Object.freeze({ko:descKo,en:descEn}),rewards:Object.freeze(rewards),format
  });

  const ACHIEVEMENTS=Object.freeze([
    achievement('first-run','runs',1,'첫 항해','First Voyage','출격을 한 번 마친다.','Finish one run.',[stardust(40)]),
    achievement('survive-3m','survive',180,'3분 생존','Three Minutes','엔드리스에서 3분 생존한다.','Survive 3 minutes in Endless.',[weapon('comet')],'time'),
    achievement('mini-1','mini',1,'중간보스 격파','Mini-Boss Down','중간보스를 처음 격파한다.','Defeat your first mini-boss.',[weapon('prism')]),
    achievement('level-10','level',10,'레벨 10','Level 10','한 출격에서 레벨 10에 도달한다.','Reach level 10 in one run.',[weapon('chrono')]),
    achievement('chain-20','chain',20,'연쇄 20','Chain 20','한 출격에서 20 연쇄를 달성한다.','Reach a 20 chain in one run.',[weapon('arc')]),
    achievement('run-kills-200','runKills',200,'200기 격추','Two Hundred','한 출격에서 적 200기를 처치한다.','Defeat 200 enemies in one run.',[weapon('ion')]),
    achievement('boss-1','boss',1,'보스 격파','Boss Down','보스를 처음 격파한다.','Defeat your first boss.',[weapon('nova'),feature('special-ability')]),
    achievement('survive-5m','survive',300,'5분 생존','Five Minutes','엔드리스에서 5분 생존한다.','Survive 5 minutes in Endless.',[weapon('drone'),shard(1)],'time'),
    achievement('run-kills-400','runKills',400,'400기 격추','Four Hundred','한 출격에서 적 400기를 처치한다.','Defeat 400 enemies in one run.',[weapon('rail')]),
    achievement('level-20','level',20,'레벨 20','Level 20','한 출격에서 레벨 20에 도달한다.','Reach level 20 in one run.',[weapon('spiral')]),
    achievement('chain-50','chain',50,'연쇄 50','Chain 50','한 출격에서 50 연쇄를 달성한다.','Reach a 50 chain in one run.',[weapon('mirror')]),
    achievement('lifetime-kills-1000','lifetimeKills',1000,'누적 1,000기','One Thousand','적을 누적 1,000기 처치한다.','Defeat 1,000 enemies in total.',[weapon('vacuum')]),
    achievement('mini-10','mini',10,'중간보스 10회','Ten Mini-Bosses','중간보스를 누적 10회 격파한다.','Defeat 10 mini-bosses.',[weapon('mine')]),
    achievement('survive-10m','survive',600,'10분 생존','Ten Minutes','엔드리스에서 10분 생존한다.','Survive 10 minutes in Endless.',[weapon('missile'),feature('awakening'),shard(1)],'time'),
    achievement('apex-1','apex',1,'초월체 격파','Apex Down','초월체를 처음 격파한다.','Defeat your first Apex.',[weapon('gate'),feature('hard')]),
    achievement('level-25','level',25,'레벨 25','Level 25','한 출격에서 레벨 25에 도달한다.','Reach level 25 in one run.',[feature('choice-4')]),
    achievement('survive-15m','survive',900,'15분 생존','Fifteen Minutes','엔드리스에서 15분 생존한다.','Survive 15 minutes in Endless.',[feature('start-level-3')],'time'),
    achievement('hard-15m','hardSurvive',900,'어려움 15분','Hard 15','어려움 난이도에서 15분 생존한다.','Survive 15 minutes on Hard.',[feature('very-hard')],'time'),
    achievement('apex-3','apex',3,'초월체 3회','Three Apexes','초월체를 누적 3회 격파한다.','Defeat 3 Apexes.',[feature('core-development-iii')]),
    achievement('survive-30m','survive',1800,'30분 생존','Thirty Minutes','엔드리스에서 30분 생존한다.','Survive 30 minutes in Endless.',[feature('multiplicity-protocol')],'time'),
    achievement('run-kills-1000','runKills',1000,'한 판 1,000기','One Run, One Thousand','한 출격에서 적 1,000기를 처치한다.','Defeat 1,000 enemies in one run.',[stardust(250)]),
    achievement('lifetime-kills-5000','lifetimeKills',5000,'누적 5,000기','Five Thousand','적을 누적 5,000기 처치한다.','Defeat 5,000 enemies in total.',[stardust(350)]),
    achievement('level-35','level',35,'레벨 35','Level 35','한 출격에서 레벨 35에 도달한다.','Reach level 35 in one run.',[stardust(250)]),
    achievement('level-50','level',50,'레벨 50','Level 50','한 출격에서 레벨 50에 도달한다.','Reach level 50 in one run.',[stardust(500)]),
    achievement('chain-100','chain',100,'연쇄 100','Chain 100','한 출격에서 100 연쇄를 달성한다.','Reach a 100 chain in one run.',[stardust(300)]),
    achievement('weapon-stack-6','weaponStack',6,'완전 공명','Full Resonance','장비 하나를 6중첩까지 올린다.','Reach 6 stacks on one weapon.',[stardust(250)]),
    achievement('three-maxed-weapons','maxedWeapons',3,'삼중 공명','Triple Resonance','한 출격에서 서로 다른 장비 3개를 6중첩으로 만든다.','Reach 6 stacks on three different weapons in one run.',[stardust(500)]),
    achievement('six-weapons','filledWeapons',6,'완전 전개','Full Deployment','한 출격에서 장비 6종을 동시에 보유한다.','Hold six different weapons in one run.',[stardust(300)]),
    achievement('kill-burst-100','killBurst',1,'쓸어버려','Sweep','30초 안에 적 100기를 처치한다.','Defeat 100 enemies within 30 seconds.',[stardust(350)]),
    achievement('boss-no-hit','bossNoHit',1,'흠집 하나 없이','Untouched','보스 하나를 피해를 받지 않고 격파한다.','Defeat a boss without taking damage during the fight.',[stardust(300),shard(1)]),
    achievement('boss-fast-15','bossFast',1,'15초 컷','Fifteen-Second Finish','보스를 등장 후 15초 안에 격파한다.','Defeat a boss within 15 seconds of its appearance.',[stardust(300)]),
    achievement('apex-trinity','apexForms',3,'세 초월체','All Three','아트로포스, 오메가, 무명의 마지막 성좌를 각각 격파한다.','Defeat Atropos, Omega, and the Nameless Last Constellation.',[stardust(500),shard(2)]),
    achievement('apex-10','apex',10,'초월체 10회','Ten Apexes','초월체를 누적 10회 격파한다.','Defeat 10 Apexes.',[stardust(800),shard(2)]),
    achievement('legacy-max','legacyStack',3,'유산 완전 계승','Legacy Complete','한 종류의 초월체 고유 유산을 3중첩까지 올린다.','Reach 3 stacks of one Apex legacy.',[stardust(400),shard(1)]),
    achievement('core-max','coreStack',3,'동력핵 포화','Core Saturation','초월 동력핵을 3중첩까지 올린다.','Reach 3 Transcendence Core stacks.',[stardust(400),shard(1)]),
    achievement('very-hard-15m','veryHardSurvive',900,'매우 어려움 15분','Very Hard 15','매우 어려움 난이도에서 15분 생존한다.','Survive 15 minutes on Very Hard.',[stardust(600),shard(1)],'time'),
    achievement('survive-45m','survive',2700,'45분 생존','Forty-Five Minutes','엔드리스에서 45분 생존한다.','Survive 45 minutes in Endless.',[stardust(700),shard(1)],'time'),
    achievement('lifetime-kills-20000','lifetimeKills',20000,'누적 20,000기','Twenty Thousand','적을 누적 20,000기 처치한다.','Defeat 20,000 enemies in total.',[stardust(1000)]),
    achievement('void-1','void',1,'균열 돌파','Rift Breaker','공허 균열 보스를 격파한다.','Defeat a Void Rift boss.',[stardust(300)]),
    achievement('crash-1','crash',1,'격리함 격파','Dreadnought Down','추락한 우주선의 격리함 보스를 격파한다.','Defeat the crashed-starship dreadnought.',[stardust(300)])
  ]);

  const ACHIEVEMENT_IDS=new Set(ACHIEVEMENTS.map(row=>row.id));
  const byWeapon=new Map();
  const byFeature=new Map();
  for(const row of ACHIEVEMENTS)for(const item of row.rewards){
    if(item.type==='unlock_weapon')byWeapon.set(item.key,row);
    if(item.type==='unlock_feature')byFeature.set(item.key,row);
  }

  const sanitizeStrings=value=>Array.isArray(value)?[...new Set(value.filter(item=>typeof item==='string'))]:[];
  const sanitizeNumber=value=>Math.max(0,Number(value)||0);
  const sanitizeNumberMap=value=>{
    const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
    for(const[key,raw]of Object.entries(value)){const n=Math.max(0,Math.floor(Number(raw)||0));if(n)out[key]=n;}return out;
  };
  const language=()=>GAME_SETTINGS?.language||'ko';
  const localized=value=>value?.[language()]||value?.en||value?.ko||'';
  const UI={
    ko:{achievements:'업적',achievementToast:'업적 달성',reward:'보상',complete:'달성',expand:'세부 보기',survival:'최고 생존 시간',level:'최고 런 레벨',combo:'최대 연쇄',runKills:'한 런 최다 처치',weapons:'해금 장비',runs:'총 출격',kills:'누적 처치',stardust:'성진',shard:'코어 조각',unlocked:'해금'},
    en:{achievements:'Achievements',achievementToast:'ACHIEVEMENT COMPLETE',reward:'Reward',complete:'COMPLETE',expand:'View details',survival:'Best Survival',level:'Best Run Level',combo:'Best Chain',runKills:'Best Run Kills',weapons:'Weapons Unlocked',runs:'Total Runs',kills:'Lifetime Kills',stardust:'Stardust',shard:'Core Shard',unlocked:'Unlocked'}
  };
  const text=()=>UI[language()]||UI.en;

  function normalizeApexForms(value){const raw=value&&typeof value==='object'?value:{},out={};for(const key of APEX_FORMS)out[key]=Math.max(0,Math.floor(Number(raw[key])||0));return out;}
  function loadProgress(){
    let saved={};try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{}
    return{
      version:4,
      completed:sanitizeStrings(saved.completed).filter(id=>ACHIEVEMENT_IDS.has(id)),
      weaponUnlocks:sanitizeStrings(saved.weaponUnlocks),
      featureUnlocks:sanitizeStrings(saved.featureUnlocks),
      rewardClaims:sanitizeStrings(saved.rewardClaims),
      bestSurvival:sanitizeNumber(saved.bestSurvival),
      bestHardSurvival:sanitizeNumber(saved.bestHardSurvival),
      bestVeryHardSurvival:sanitizeNumber(saved.bestVeryHardSurvival),
      bestLevel:Math.max(1,Math.floor(sanitizeNumber(saved.bestLevel)||1)),
      bestCombo:Math.floor(sanitizeNumber(saved.bestCombo)),
      bestRunKills:Math.floor(sanitizeNumber(saved.bestRunKills)),
      stats:{
        apexForms:normalizeApexForms(saved.stats?.apexForms||saved.apexForms),
        maxWeaponStack:Math.floor(sanitizeNumber(saved.stats?.maxWeaponStack)),
        maxedWeapons:Math.floor(sanitizeNumber(saved.stats?.maxedWeapons)),
        filledWeapons:Math.floor(sanitizeNumber(saved.stats?.filledWeapons)),
        maxApexLegacyStack:Math.floor(sanitizeNumber(saved.stats?.maxApexLegacyStack)),
        maxApexCoreStack:Math.floor(sanitizeNumber(saved.stats?.maxApexCoreStack)),
        killBurst:Math.floor(sanitizeNumber(saved.stats?.killBurst)),
        bossNoHit:Math.floor(sanitizeNumber(saved.stats?.bossNoHit)),
        bossFast:Math.floor(sanitizeNumber(saved.stats?.bossFast))
      },
      materials:sanitizeNumberMap(saved.materials),
      cosmetics:sanitizeStrings(saved.cosmetics),
      titles:sanitizeStrings(saved.titles)
    };
  }
  const progress=loadProgress();
  function saveProgress(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch{}}

  function ensureBaselineFeatures(){
    const meta=window.stackfallMeta;if(!meta)return;
    meta.unlockedFeatures=Array.isArray(meta.unlockedFeatures)?meta.unlockedFeatures:[];
    let changed=false;for(const key of BASELINE_FEATURES)if(!meta.unlockedFeatures.includes(key)){meta.unlockedFeatures.push(key);changed=true;}
    if(changed)window.stackfallSaveMeta?.();
    const start=document.querySelector('#startBtn');if(start){start.disabled=false;start.classList.remove('locked');start.title='';}
  }
  function grantFeature(key){
    const meta=window.stackfallMeta;if(!meta||!window.STACKFALL_FEATURE_DEFS?.[key])return false;
    meta.unlockedFeatures=Array.isArray(meta.unlockedFeatures)?meta.unlockedFeatures:[];
    if(meta.unlockedFeatures.includes(key))return false;
    meta.unlockedFeatures.push(key);window.stackfallSaveMeta?.();window.stackfallRefreshFeatureUi?.();window.renderStackfallDifficulty?.();return true;
  }
  const rewardClaimId=(row,index)=>`${row.id}:${index}`;
  function rewardSettled(item){
    if(item.type==='unlock_weapon')return window.stackfallIsWeaponUnlocked?.(item.key)===true;
    if(item.type==='unlock_feature')return window.stackfallIsFeatureAcquired?.(item.key)===true;
    return false;
  }
  function applyReward(row,item,index,{restoring=false}={}){
    const claimId=rewardClaimId(row,index),claimed=progress.rewardClaims.includes(claimId);if(claimed)return false;
    let granted=false,settled=false;
    if(item.type==='unlock_weapon'){
      if(!progress.weaponUnlocks.includes(item.key))progress.weaponUnlocks.push(item.key);
      const before=window.stackfallIsWeaponUnlocked?.(item.key)===true;if(!before)window.stackfallUnlockWeapon?.(item.key);settled=window.stackfallIsWeaponUnlocked?.(item.key)===true;granted=!before&&settled;
    }else if(item.type==='unlock_feature'){
      if(!progress.featureUnlocks.includes(item.key))progress.featureUnlocks.push(item.key);
      const before=window.stackfallIsFeatureAcquired?.(item.key)===true;if(!before)grantFeature(item.key);settled=window.stackfallIsFeatureAcquired?.(item.key)===true;granted=!before&&settled;
    }else if(item.type==='currency'){
      const amount=Math.max(1,Math.floor(Number(item.amount)||1));granted=(window.stackfallGrantCurrency?.(item.key,amount)||0)>0;settled=granted;
    }
    if(settled)progress.rewardClaims.push(claimId);
    return restoring?false:granted;
  }

  const runSeconds=()=>Math.max(0,Number.isFinite(Number(state.runTime))?Number(state.runTime):Number(state.time)||0);
  function snapshotRun(){return{time:runSeconds(),kills:Math.max(0,Math.floor(Number(state.kills)||0)),level:Math.max(1,Math.floor(Number(state.level)||1)),maxCombo:Math.max(0,Math.floor(Number(state.maxCombo)||0)),difficulty:String(state.selectedDifficulty||'normal')};}
  function captureRunStats(run=snapshotRun()){
    progress.bestSurvival=Math.max(progress.bestSurvival,run.time);
    if(run.difficulty==='hard')progress.bestHardSurvival=Math.max(progress.bestHardSurvival,run.time);
    if(run.difficulty==='very-hard')progress.bestVeryHardSurvival=Math.max(progress.bestVeryHardSurvival,run.time);
    progress.bestLevel=Math.max(progress.bestLevel,run.level);
    progress.bestCombo=Math.max(progress.bestCombo,run.maxCombo);
    progress.bestRunKills=Math.max(progress.bestRunKills,run.kills);
    const stacks=Object.entries(state.weaponStacks||{}).filter(([key,value])=>key!=='core'&&Number(value)>0).map(([,value])=>Math.max(0,Math.floor(Number(value)||0)));
    progress.stats.maxWeaponStack=Math.max(progress.stats.maxWeaponStack,...stacks,0);
    progress.stats.maxedWeapons=Math.max(progress.stats.maxedWeapons,stacks.filter(value=>value>=6).length);
    progress.stats.filledWeapons=Math.max(progress.stats.filledWeapons,stacks.length);
    progress.stats.maxApexLegacyStack=Math.max(progress.stats.maxApexLegacyStack,...Object.values(state.apexBoons||{}).map(value=>Math.max(0,Math.floor(Number(value)||0))),0);
    progress.stats.maxApexCoreStack=Math.max(progress.stats.maxApexCoreStack,Math.max(0,Math.floor(Number(state.apexCoreStacks)||0)));
  }
  function isEndless(){return(window.stackfallCurrentRunConfig?.().mode||state.runSelection?.mode||'endless')==='endless';}
  function currentValue(row,run=snapshotRun()){
    const meta=window.stackfallMeta||{},activeRun=isEndless()&&state.mode==='playing';
    switch(row.kind){
      case'runs':return Math.floor(meta.lifetime?.runs||0);
      case'survive':return Math.max(progress.bestSurvival,run.time);
      case'hardSurvive':return Math.max(progress.bestHardSurvival,run.difficulty==='hard'?run.time:0);
      case'veryHardSurvive':return Math.max(progress.bestVeryHardSurvival,run.difficulty==='very-hard'?run.time:0);
      case'level':return Math.max(progress.bestLevel,run.level);
      case'chain':return Math.max(progress.bestCombo,run.maxCombo);
      case'runKills':return Math.max(progress.bestRunKills,run.kills);
      case'lifetimeKills':return Math.floor(meta.lifetime?.kills||0)+(activeRun?run.kills:0);
      case'mini':return Math.floor(meta.bossRecords?.mini||0);
      case'boss':return Math.floor(meta.bossRecords?.boss||0);
      case'apex':return Math.floor(meta.bossRecords?.apex||0);
      case'void':return Math.floor(meta.bossRecords?.void||0);
      case'crash':return Math.floor(meta.bossRecords?.crash||0);
      case'weaponStack':return progress.stats.maxWeaponStack;
      case'maxedWeapons':return progress.stats.maxedWeapons;
      case'filledWeapons':return progress.stats.filledWeapons;
      case'killBurst':return progress.stats.killBurst;
      case'bossNoHit':return progress.stats.bossNoHit;
      case'bossFast':return progress.stats.bossFast;
      case'apexForms':return APEX_FORMS.reduce((sum,key)=>sum+(progress.stats.apexForms[key]>0?1:0),0);
      case'legacyStack':return progress.stats.maxApexLegacyStack;
      case'coreStack':return progress.stats.maxApexCoreStack;
      default:return 0;
    }
  }
  function evaluateAchievements(run=snapshotRun(),{silent=false}={}){
    captureRunStats(run);const rows=[];
    for(const row of ACHIEVEMENTS){
      if(progress.completed.includes(row.id)||currentValue(row,run)<row.value)continue;
      progress.completed.push(row.id);for(let i=0;i<row.rewards.length;i++)applyReward(row,row.rewards[i],i);rows.push(row);
    }
    if(rows.length)saveProgress();if(rows.length&&!silent)announceAchievements(rows);return rows;
  }
  function restoreProgression(){
    ensureBaselineFeatures();const meta=window.stackfallMeta||{};
    for(const key of progress.weaponUnlocks)if(WEAPONS?.[key]&&!window.stackfallIsWeaponUnlocked?.(key))window.stackfallUnlockWeapon?.(key);
    for(const key of progress.featureUnlocks)if(window.STACKFALL_FEATURE_DEFS?.[key]&&!window.stackfallIsFeatureAcquired?.(key))grantFeature(key);
    for(const row of ACHIEVEMENTS){
      const unlocks=row.rewards.filter(item=>item.type==='unlock_weapon'||item.type==='unlock_feature');
      if(unlocks.length&&unlocks.every(rewardSettled)&&!progress.completed.includes(row.id))progress.completed.push(row.id);
    }
    for(const row of ACHIEVEMENTS)if(progress.completed.includes(row.id))for(let i=0;i<row.rewards.length;i++)applyReward(row,row.rewards[i],i,{restoring:true});
    captureRunStats({time:0,kills:0,level:1,maxCombo:0,difficulty:'normal'});evaluateAchievements({time:0,kills:0,level:1,maxCombo:0,difficulty:'normal'},{silent:true});saveProgress();
  }

  function formatValue(value,format){const n=Math.max(0,Math.floor(Number(value)||0));if(format!=='time')return n.toLocaleString();const m=Math.floor(n/60),s=n%60;return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function rewardLabel(item){
    if(item.type==='unlock_weapon')return `${text().unlocked} · ${weaponText(item.key).name}`;
    if(item.type==='unlock_feature')return `${text().unlocked} · ${window.stackfallFeatureName?.(item.key)||item.key}`;
    if(item.type==='currency')return `${item.key==='coreShard'?text().shard:text().stardust} +${Math.max(1,Math.floor(Number(item.amount)||1)).toLocaleString()}`;
    return text().reward;
  }
  const rewardSummary=row=>row.rewards.map(rewardLabel).join(' · ');
  function rowProgress(row){const value=currentValue(row);return`${formatValue(Math.min(value,row.value),row.format)} / ${formatValue(row.value,row.format)}`;}

  function ensureToastRoot(){let root=document.querySelector('#achievementToastStackV2');if(root)return root;root=document.createElement('div');root.id='achievementToastStackV2';root.className='achievement-toast-stack-v2';root.setAttribute('aria-live','polite');document.querySelector('#app')?.appendChild(root);return root;}
  function announceAchievements(rows){
    const root=ensureToastRoot();for(const row of rows){const toast=document.createElement('div');toast.className='achievement-toast-v2';toast.innerHTML=`<i>◇</i><div><span>${text().achievementToast}</span><strong>${localized(row.name)}</strong><small>${rewardSummary(row)}</small></div>`;root.appendChild(toast);requestAnimationFrame(()=>toast.classList.add('show'));setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),220);},3200);while(root.children.length>3)root.firstElementChild?.remove();}
    try{audio.pickup();}catch{}
  }
  function renderResultUnlocks(rows=[]){
    const modal=document.querySelector('#gameOverScreen .result-modal');if(!modal)return;let root=document.querySelector('#endlessAchievementUnlocks');if(!root){root=document.createElement('div');root.id='endlessAchievementUnlocks';root.className='endless-achievement-unlocks hidden';document.querySelector('#resultCurrencyReward')?.insertAdjacentElement('afterend',root);}
    if(!rows.length){root.classList.add('hidden');root.innerHTML='';return;}root.classList.remove('hidden');root.innerHTML=rows.map(row=>`<b><i>◇</i><span>${localized(row.name)}</span><small>${rewardSummary(row)}</small></b>`).join('');
  }

  function ensureProfileAchievements(){
    const modal=document.querySelector('#profileScreen .profile-modal');if(!modal)return null;let details=document.querySelector('#profileAchievementDetails');if(details)return details;
    details=document.createElement('details');details.id='profileAchievementDetails';details.className='profile-details profile-achievement-details';details.innerHTML='<summary><span id="profileAchievementTitle">업적</span><small id="profileAchievementSummary">0 / 0</small></summary><div class="profile-achievement-progress"><i id="profileAchievementFill"></i></div><div id="profileAchievementList" class="profile-achievement-list"></div>';
    const stageDetails=[...modal.querySelectorAll('.profile-details')].find(node=>node.querySelector('#profileStageClearGrid'));if(stageDetails)stageDetails.insertAdjacentElement('beforebegin',details);else modal.appendChild(details);return details;
  }
  function renderProfileAchievements(){
    const details=ensureProfileAchievements();if(!details)return;const complete=ACHIEVEMENTS.filter(row=>progress.completed.includes(row.id)).length,title=details.querySelector('#profileAchievementTitle'),summary=details.querySelector('#profileAchievementSummary'),fill=details.querySelector('#profileAchievementFill'),list=details.querySelector('#profileAchievementList');
    if(title)title.textContent=text().achievements;if(summary)summary.textContent=`${complete} / ${ACHIEVEMENTS.length}`;if(fill)fill.style.width=`${ACHIEVEMENTS.length?complete/ACHIEVEMENTS.length*100:0}%`;if(!list)return;
    list.innerHTML=ACHIEVEMENTS.map(row=>{const done=progress.completed.includes(row.id);return`<article class="profile-achievement-card${done?' complete':''}"><i>◇</i><div><strong>${localized(row.name)}</strong><p>${localized(row.desc)}</p><small>${text().reward} · ${rewardSummary(row)}</small></div><b>${done?text().complete:rowProgress(row)}</b></article>`;}).join('');
  }

  function applyStageSeal(){
    const entry=document.querySelector('#stageMapBtn');if(!entry)return;entry.disabled=true;entry.classList.add('locked','stage-sealed');entry.setAttribute('aria-disabled','true');const icon=entry.querySelector(':scope > i');if(icon){icon.textContent='🔒';icon.setAttribute('aria-hidden','true');}
  }
  function ensureStarterProgress(){const head=ui?.starterOptions?.previousElementSibling;if(!head?.classList.contains('starter-head'))return null;let el=head.querySelector('.starter-unlock-progress');if(!el){el=document.createElement('em');el.className='starter-unlock-progress';head.appendChild(el);}return el;}
  function finalRenderStarterOptions(){
    if(!ui?.starterOptions)return;const entries=Object.entries(WEAPONS).filter(([,item])=>item.starter!==false&&!item.basic),unlockedEntries=entries.filter(([key])=>window.stackfallIsWeaponUnlocked?.(key)!==false);ui.starterOptions.innerHTML='';
    for(const[key,item]of entries){const unlocked=window.stackfallIsWeaponUnlocked?.(key)!==false,copy=weaponText(key),row=byWeapon.get(key),el=document.createElement('button');el.type='button';el.className='starter-option'+(unlocked&&key===state.selectedStarter?' selected':'')+(unlocked?'':' locked');el.style.setProperty('--starter-color',item.color);el.style.setProperty('--starter-glow',hexToRgba(item.color,unlocked?.16:.07));el.setAttribute('role','radio');el.setAttribute('aria-checked',unlocked&&key===state.selectedStarter?'true':'false');el.disabled=!unlocked;const condition=row?localized(row.desc):'';el.title=unlocked?`${copy.name} · ${copy.role}`:`${copy.name} · ${condition}`;el.innerHTML=`<span class="starter-icon">${item.icon}</span><span class="starter-label">${copy.name}</span>${unlocked?'':`<span class="starter-lock" aria-hidden="true">🔒</span><small class="starter-condition">${condition}</small>`}`;if(unlocked)el.onclick=()=>selectStarter(key);ui.starterOptions.appendChild(el);}
    const allowed=WEAPONS[state.selectedStarter]&&WEAPONS[state.selectedStarter].starter!==false&&window.stackfallIsWeaponUnlocked?.(state.selectedStarter)!==false,fallback=unlockedEntries[0]?.[0]||'blade';state.selectedStarter=allowed?state.selectedStarter:fallback;const selected=weaponText(state.selectedStarter);ui.starterName.textContent=selected.name;ui.starterDesc.textContent=`${selected.role} · ${selected.desc}`;const counter=ensureStarterProgress();if(counter)counter.textContent=`${unlockedEntries.length} / ${entries.length}`;
  }
  function featureAchievementCondition(key){const row=byFeature.get(key);return row?localized(row.desc):'';}

  function formatProfileTime(seconds){const n=Math.max(0,Math.floor(Number(seconds)||0)),m=Math.floor(n/60),s=n%60;return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function renderEndlessProfile(){
    const screen=document.querySelector('#profileScreen');if(!screen)return;const meta=window.stackfallMeta||{},weaponEntries=Object.entries(WEAPONS||{}).filter(([,item])=>item.starter!==false&&!item.basic),unlockedWeapons=weaponEntries.filter(([key])=>window.stackfallIsWeaponUnlocked?.(key)!==false).length,completed=ACHIEVEMENTS.filter(row=>progress.completed.includes(row.id)).length;
    const rows=[['#profileDetailClears',text().survival,formatProfileTime(progress.bestSurvival)],['#profileDetailStageClears',text().level,progress.bestLevel],['#profileDetailRuns',text().combo,progress.bestCombo],['#profileDetailKills',text().runKills,progress.bestRunKills],['#profileDetailBosses',text().weapons,`${unlockedWeapons} / ${weaponEntries.length}`],['#profileDetailWeapons',text().achievements,`${completed} / ${ACHIEVEMENTS.length}`]];
    for(const[selector,label,value]of rows){const valueEl=screen.querySelector(selector),labelEl=valueEl?.parentElement?.querySelector('span');if(labelEl)labelEl.textContent=label;if(valueEl)valueEl.textContent=String(value);}
    const grid=screen.querySelector('.profile-boss-grid');if(grid){let runs=grid.querySelector('#profileEndlessRuns'),kills=grid.querySelector('#profileEndlessKills');if(!runs){const row=document.createElement('div');row.innerHTML='<span></span><b id="profileEndlessRuns">0</b>';grid.prepend(row);runs=row.querySelector('b');}if(!kills){const row=document.createElement('div');row.innerHTML='<span></span><b id="profileEndlessKills">0</b>';runs.parentElement.insertAdjacentElement('afterend',row);kills=row.querySelector('b');}runs.parentElement.querySelector('span').textContent=text().runs;runs.textContent=String(meta.lifetime?.runs||0);kills.parentElement.querySelector('span').textContent=text().kills;kills.textContent=String(meta.lifetime?.kills||0);}
    renderProfileAchievements();
  }

  let killTimes=[],bossAttempt=null,poll=0;
  function regularBoss(enemy){return!!(enemy&&!enemy.dead&&enemy.type==='boss'&&enemy.kind!=='apex'&&enemy.kind!=='void'&&enemy.eventVariant!=='dreadnought'&&enemy.eventKind!=='crash');}
  function findRegularBoss(){return(state.entities?.enemies||[]).find(regularBoss)||null;}
  function ensureBossAttempt(){const boss=findRegularBoss();if(!boss){bossAttempt=null;return null;}if(bossAttempt?.enemy!==boss)bossAttempt={enemy:boss,startedAt:runSeconds(),hit:false};return bossAttempt;}

  const baseResetGame=resetGame;
  resetGame=function achievementResetGame(){killTimes=[];bossAttempt=null;poll=0;const result=baseResetGame(...arguments);return result;};
  const baseHurtPlayer=hurtPlayer;
  hurtPlayer=function achievementHurtPlayer(){const attempt=ensureBossAttempt(),before=Number(player.hp)||0,result=baseHurtPlayer(...arguments);if(attempt&&(Number(player.hp)||0)<before)attempt.hit=true;return result;};
  const baseKillEnemy=killEnemy;
  killEnemy=function achievementKillEnemy(enemy,opts={}){
    const alive=enemy&&!enemy.dead,form=String(enemy?.apexForm||enemy?.eliteForm||''),attempt=bossAttempt?.enemy===enemy?{...bossAttempt}:null,result=baseKillEnemy(enemy,opts);if(!alive||!enemy?.dead||!isEndless())return result;
    const now=runSeconds();killTimes.push(now);while(killTimes.length&&killTimes[0]<now-30)killTimes.shift();if(killTimes.length>=100)progress.stats.killBurst=1;
    if(APEX_FORMS.includes(form))progress.stats.apexForms[form]=(progress.stats.apexForms[form]||0)+1;
    if(attempt&&regularBoss({...enemy,dead:false})){if(!attempt.hit)progress.stats.bossNoHit=1;if(now-attempt.startedAt<=15)progress.stats.bossFast=1;bossAttempt=null;}
    return result;
  };
  const baseUpdatePlayer=updatePlayer;
  updatePlayer=function achievementUpdatePlayer(dt){const result=baseUpdatePlayer(dt);if(state.mode!=='playing'||!isEndless())return result;poll-=dt;if(poll>0)return result;poll=.35;ensureBossAttempt();const rows=evaluateAchievements(snapshotRun());if(rows.length){renderEndlessProfile();window.renderStackfallMetaUi?.();}return result;};
  const baseEndGame=endGame;
  endGame=function achievementEndGame(){if(state.mode==='gameover')return;const endless=isEndless(),run=snapshotRun(),result=baseEndGame(...arguments);if(endless){captureRunStats(run);const rows=evaluateAchievements(run,{silent:true});renderResultUnlocks(rows);if(rows.length)announceAchievements(rows);saveProgress();renderEndlessProfile();}return result;};

  const baseShowMainMenu=showMainMenu;
  showMainMenu=function achievementMainMenu(){const result=baseShowMainMenu(...arguments);applyStageSeal();finalRenderStarterOptions();renderEndlessProfile();return result;};
  const baseApplyLanguage=applyLanguage;
  applyLanguage=function achievementLanguage(){const result=baseApplyLanguage(...arguments);applyStageSeal();finalRenderStarterOptions();renderEndlessProfile();window.renderStackfallDifficulty?.();return result;};
  renderStarterOptions=finalRenderStarterOptions;

  const baseRenderMetaUi=window.renderStackfallMetaUi;
  if(typeof baseRenderMetaUi==='function'&&!baseRenderMetaUi.__achievementV2){const wrapped=function(){const result=baseRenderMetaUi();renderEndlessProfile();return result;};wrapped.__achievementV2=true;window.stackfallRenderMetaUi=wrapped;}
  document.querySelector('#hubProfile')?.addEventListener('click',()=>queueMicrotask(renderEndlessProfile));
  document.querySelector('#profileNameSaveBtn')?.addEventListener('click',()=>queueMicrotask(renderEndlessProfile));

  const style=document.createElement('style');style.textContent=`
    #stageMapBtn.stage-sealed{cursor:not-allowed;filter:saturate(.45);opacity:.72}#stageMapBtn.stage-sealed>i{font-style:normal;font-size:22px;opacity:.88}#stageMapBtn.stage-sealed:hover{transform:none}
    .starter-head{position:relative}.starter-unlock-progress{position:absolute;right:0;top:0;font-style:normal;font-size:10px;font-weight:900;letter-spacing:.06em;color:#9fb0d4}.starter-option.locked{position:relative;cursor:not-allowed;opacity:.64;filter:saturate(.42);overflow:hidden}.starter-lock{position:absolute;right:7px;top:6px;font-size:12px;filter:grayscale(1)}.starter-condition{display:block;width:100%;margin-top:4px;color:#aab4cd;font-size:8px;line-height:1.25;white-space:normal}.starter-option.locked:hover{transform:none}
    .achievement-toast-stack-v2{position:fixed;right:18px;top:76px;z-index:58;display:grid;gap:8px;width:min(340px,calc(100vw - 28px));pointer-events:none}.achievement-toast-v2{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:center;padding:11px 12px;border:1px solid rgba(143,255,224,.25);border-radius:13px;background:linear-gradient(135deg,rgba(12,34,42,.95),rgba(6,10,25,.95));box-shadow:0 10px 28px rgba(0,0,0,.30);opacity:0;transform:translateX(20px);transition:opacity .2s ease,transform .2s ease}.achievement-toast-v2.show{opacity:1;transform:translateX(0)}.achievement-toast-v2>i{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(143,255,224,.22);border-radius:10px;background:rgba(116,242,167,.07);color:#dcfff1;font-style:normal;font-size:17px}.achievement-toast-v2 span{display:block;color:#8fffc8;font-size:8px;font-weight:900;letter-spacing:.13em}.achievement-toast-v2 strong{display:block;margin-top:2px;color:#f4fffb;font-size:13px}.achievement-toast-v2 small{display:block;margin-top:3px;color:#9eacc6;font-size:8px;line-height:1.35}
    .endless-achievement-unlocks{display:grid;gap:6px;margin:10px 0 2px}.endless-achievement-unlocks>b{display:grid;grid-template-columns:20px 1fr;gap:2px 8px;align-items:center;padding:8px 10px;border:1px solid rgba(143,255,224,.20);background:rgba(18,44,55,.38);font-size:11px}.endless-achievement-unlocks>b>i{grid-row:1/3;font-style:normal;color:#dffcff}.endless-achievement-unlocks>b>small{color:#92a5c5;font-size:8px;font-weight:600}
    .profile-achievement-progress{height:5px;margin:12px 0 14px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}.profile-achievement-progress>i{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#74f2a7,#7ce8ff);transition:width .25s ease}.profile-achievement-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.profile-achievement-card{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center;min-height:88px;padding:11px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:rgba(5,9,24,.54);opacity:.74}.profile-achievement-card.complete{opacity:1;border-color:rgba(116,242,167,.20);background:linear-gradient(135deg,rgba(18,53,46,.35),rgba(6,11,27,.58))}.profile-achievement-card>i{display:grid;place-items:center;width:32px;height:32px;border:1px solid rgba(255,255,255,.10);border-radius:9px;font-style:normal;color:#aab7d0}.profile-achievement-card.complete>i{border-color:rgba(116,242,167,.30);color:#9affc5}.profile-achievement-card>div{min-width:0}.profile-achievement-card strong{display:block;color:#f2f6ff;font-size:11px}.profile-achievement-card p{margin:4px 0;color:#9ba8c6;font-size:8px;line-height:1.45}.profile-achievement-card small{display:block;color:#7f93b8;font-size:7px;line-height:1.4}.profile-achievement-card>b{color:#b5c3dd;font-size:8px;white-space:nowrap}.profile-achievement-card.complete>b{color:#8fffc1}
    @media(max-width:760px){.achievement-toast-stack-v2{right:50%;top:70px;transform:translateX(50%);width:min(320px,calc(100vw - 20px))}.achievement-toast-v2{transform:translateY(-10px)}.achievement-toast-v2.show{transform:translateY(0)}.profile-achievement-list{grid-template-columns:1fr}.profile-achievement-card{min-height:82px}}
  `;document.head.appendChild(style);

  restoreProgression();applyStageSeal();finalRenderStarterOptions();renderResultUnlocks([]);renderEndlessProfile();window.renderStackfallMetaUi?.();

  const weaponAchievements=ACHIEVEMENTS.filter(row=>row.rewards.some(item=>item.type==='unlock_weapon'));
  const featureAchievements=ACHIEVEMENTS.filter(row=>row.rewards.some(item=>item.type==='unlock_feature'));
  window.STACKFALL_ENDLESS_ACHIEVEMENTS=ACHIEVEMENTS;
  window.STACKFALL_ENDLESS_FEATURE_ACHIEVEMENTS=featureAchievements;
  window.STACKFALL_ENDLESS_SURVIVAL_MILESTONES=Object.freeze([]);
  window.stackfallFeatureAchievementCondition=featureAchievementCondition;
  window.stackfallEndlessProgression=Object.freeze({storageKey:STORAGE_KEY,progress,achievements:ACHIEVEMENTS,weaponAchievements,featureAchievements,survivalMilestones:[],conditionText:row=>localized(row.desc),featureAchievementCondition,evaluateAchievements,claimSurvivalMilestones:()=>0,applyReward,renderStarterOptions:finalRenderStarterOptions,applyStageSeal,renderAchievements:renderProfileAchievements,renderProfile:renderEndlessProfile,openAchievements:()=>{document.querySelector('#hubProfile')?.click();queueMicrotask(()=>{const details=ensureProfileAchievements();if(details)details.open=true;});},showAchievementToasts:announceAchievements});
})();