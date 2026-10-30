(()=>{
  let DEV_PROFILE=false;try{DEV_PROFILE=new URLSearchParams(location.search).get('dev')==='1';}catch{}
  const STORAGE_KEY=DEV_PROFILE?'stackfall.meta.dev.v1':'stackfall.meta.v1';
  const PROFILE_NAME_KEY='stackfall.profileName.v1';
  window.stackfallMetaStorageProfile=DEV_PROFILE?'developer':'player';
  const INITIAL_WEAPONS=Object.freeze(['blade','ember','bulwark','gravity']);
  const CURRENCY_KEYS=Object.freeze(['stardust','coreShard']);
  const BOSS_RECORD_KEYS=Object.freeze(['mini','boss','apex','void','crash']);
  const APEX_FORM_KEYS=Object.freeze(['chronophage','starforge','lastconstellation']);
  const FEATURE_DEFS=Object.freeze({
    'core-development':Object.freeze({ko:'코어 성장',en:'Core Development'}),
    awakening:Object.freeze({ko:'무기 각성',en:'Weapon Awakening'}),
    'special-ability':Object.freeze({ko:'보스 특수능력',en:'Boss Special Abilities'}),
    endless:Object.freeze({ko:'엔드리스 원정',en:'Endless Expedition'}),
    hard:Object.freeze({ko:'어려움 난이도',en:'Hard Difficulty'}),
    'very-hard':Object.freeze({ko:'매우 어려움 난이도',en:'Very Hard Difficulty',ja:'非常に難しい難易度','zh-CN':'非常困难',es:'Dificultad muy difícil',fr:'Difficulté très difficile'}),
    'choice-4':Object.freeze({ko:'4중 재구성',en:'Four-way Reconstruction'}),
    'start-level-3':Object.freeze({ko:'선행 재구성 +3',en:'Advanced Start +3',ja:'先行再構成 +3','zh-CN':'先行重构 +3',es:'Inicio avanzado +3',fr:'Départ avancé +3'}),
    'core-development-iii':Object.freeze({ko:'코어 성장 3차 돌파',en:'Core Development III',ja:'コア成長 第3突破','zh-CN':'核心成长 III',es:'Desarrollo del núcleo III',fr:'Développement du cœur III'}),
    'multiplicity-protocol':Object.freeze({ko:'다중 투영 프로토콜',en:'Multiplicity Protocol'})
  });
  const sanitizeList=value=>Array.isArray(value)?[...new Set(value.filter(item=>typeof item==='string'))]:[];
  const sanitizeNumber=value=>Math.max(0,Math.floor(Number(value)||0));
  const sanitizeMap=value=>value&&typeof value==='object'&&!Array.isArray(value)?{...value}:{};
  const sanitizeProfileName=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,16);
  const createBossRecords=()=>({mini:0,boss:0,apex:0,void:0,crash:0});
  const bossTotal=records=>BOSS_RECORD_KEYS.reduce((sum,key)=>sum+sanitizeNumber(records?.[key]),0);
  const normalizeCurrencies=value=>{
    const currencies={stardust:0,coreShard:0,...sanitizeMap(value)};
    for(const key of CURRENCY_KEYS)currencies[key]=sanitizeNumber(currencies[key]);
    return currencies;
  };
  const normalizeUpgrades=value=>{
    const upgrades=sanitizeMap(value);
    for(const key of Object.keys(upgrades))upgrades[key]=sanitizeNumber(upgrades[key]);
    return upgrades;
  };
  const normalizeBossRecords=(value,legacyBosses=0)=>{
    const savedBossRecords=sanitizeMap(value),bossRecords=createBossRecords();
    const hasBossBreakdown=BOSS_RECORD_KEYS.some(key=>Object.prototype.hasOwnProperty.call(savedBossRecords,key));
    for(const key of BOSS_RECORD_KEYS)bossRecords[key]=sanitizeNumber(savedBossRecords[key]);
    if(!hasBossBreakdown)bossRecords.apex=sanitizeNumber(legacyBosses);
    return bossRecords;
  };
  const stageClearTotal=m=>{
    const counts=sanitizeMap(m?.stageClearCounts),sum=Object.values(counts).reduce((total,value)=>total+sanitizeNumber(value),0);
    return Math.max(sanitizeList(m?.clearedStages).length,sum);
  };
  const unlockedWeaponCount=m=>sanitizeList(m?.unlockedWeapons).filter(key=>key!=='core'&&WEAPONS?.[key]).length;
  const totalWeaponCount=()=>Object.keys(window.stackfallAwakeningDefs||WEAPONS||{}).filter(key=>key!=='core'&&WEAPONS?.[key]).length;
  const totalUpgradeLevels=m=>Object.values(sanitizeMap(m?.upgrades)).reduce((sum,value)=>sum+sanitizeNumber(value),0);
  const achievement=(id,category,goal,progress,nameKo,nameEn,descKo,descEn,format='number')=>Object.freeze({id,category,goal,progress,name:Object.freeze({ko:nameKo,en:nameEn}),desc:Object.freeze({ko:descKo,en:descEn}),format});
  const ACHIEVEMENT_DEFS=Object.freeze([
    achievement('first-sortie','expedition',1,m=>m.lifetime?.runs||0,'첫 점화','First Ignition','첫 출격을 마친다.','Finish your first sortie.'),
    achievement('sorties-10','expedition',10,m=>m.lifetime?.runs||0,'항로 개척자','Route Pioneer','출격 10회를 기록한다.','Complete 10 sorties.'),
    achievement('sorties-50','expedition',50,m=>m.lifetime?.runs||0,'항로의 베테랑','Route Veteran','출격 50회를 기록한다.','Complete 50 sorties.'),
    achievement('stage-first','expedition',1,m=>sanitizeList(m.clearedStages).length,'첫 좌표','First Coordinate','은하 작전 스테이지를 처음 클리어한다.','Clear a Galactic Operation stage.'),
    achievement('stage-06','expedition',1,m=>sanitizeList(m.clearedStages).includes('stage-06')?1:0,'파편의 항로 정복','Shardway Conquered','STAGE 6을 클리어한다.','Clear Stage 6.'),
    achievement('stage-12','expedition',1,m=>sanitizeList(m.clearedStages).includes('stage-12')?1:0,'심연의 개화 정복','Abyssal Bloom Conquered','STAGE 12를 클리어한다.','Clear Stage 12.'),
    achievement('stage-18','expedition',1,m=>sanitizeList(m.clearedStages).includes('stage-18')?1:0,'침묵 중계망 정복','Silent Array Conquered','STAGE 18을 클리어한다.','Clear Stage 18.'),
    achievement('stage-clears-25','expedition',25,m=>stageClearTotal(m),'반복 항해','Repeated Expedition','스테이지 누적 클리어 25회를 기록한다.','Record 25 total stage clears.'),

    achievement('kills-100','combat',100,m=>m.lifetime?.kills||0,'첫 백 격추','First Hundred','적 100기를 처치한다.','Defeat 100 enemies.'),
    achievement('kills-1000','combat',1000,m=>m.lifetime?.kills||0,'천체 청소부','Celestial Sweeper','적 1,000기를 처치한다.','Defeat 1,000 enemies.'),
    achievement('kills-10000','combat',10000,m=>m.lifetime?.kills||0,'항로 절멸자','Route Annihilator','적 10,000기를 처치한다.','Defeat 10,000 enemies.'),
    achievement('boss-first','combat',1,m=>m.lifetime?.bosses||0,'큰 놈도 쓰러진다','Bigger They Fall','보스급 적을 처음 처치한다.','Defeat your first boss-class enemy.'),
    achievement('boss-10','combat',10,m=>m.lifetime?.bosses||0,'보스 사냥꾼','Boss Hunter','보스급 적을 10회 처치한다.','Defeat 10 boss-class enemies.'),
    achievement('boss-50','combat',50,m=>m.lifetime?.bosses||0,'괴물들의 재난','Calamity of Monsters','보스급 적을 50회 처치한다.','Defeat 50 boss-class enemies.'),
    achievement('combo-50','combat',50,m=>m.achievementStats?.maxCombo||0,'연쇄 50','Chain 50','한 출격에서 연쇄 50을 기록한다.','Reach a 50 chain in one sortie.'),
    achievement('combo-100','combat',100,m=>m.achievementStats?.maxCombo||0,'끊기지 않는 궤도','Unbroken Orbit','한 출격에서 연쇄 100을 기록한다.','Reach a 100 chain in one sortie.'),

    achievement('apex-first','apex',1,m=>m.bossRecords?.apex||0,'초월체 격파','Apex Down','초월체를 처음 격파한다.','Defeat your first Apex.'),
    achievement('apex-3','apex',3,m=>m.bossRecords?.apex||0,'세 번의 초월','Three Transcendences','초월체를 3회 격파한다.','Defeat 3 Apexes.'),
    achievement('apex-10','apex',10,m=>m.bossRecords?.apex||0,'초월체 사냥꾼','Apex Hunter','초월체를 10회 격파한다.','Defeat 10 Apexes.'),
    achievement('chronophage-first','apex',1,m=>m.achievementStats?.apexForms?.chronophage||0,'시간을 삼킨 자','Time Devoured','시간포식자 아트로포스를 격파한다.','Defeat Atropos, Chronophage.'),
    achievement('starforge-first','apex',1,m=>m.achievementStats?.apexForms?.starforge||0,'마지막 항성을 끄다','Extinguish the Last Star','종말 항성 오메가를 격파한다.','Defeat Omega, the Last Starforge.'),
    achievement('constellation-first','apex',1,m=>m.achievementStats?.apexForms?.lastconstellation||0,'이름 없는 별자리의 끝','End of the Nameless','무명의 마지막 성좌를 격파한다.','Defeat the Nameless Last Constellation.'),
    achievement('apex-trinity','apex',3,m=>APEX_FORM_KEYS.reduce((sum,key)=>sum+((m.achievementStats?.apexForms?.[key]||0)>0?1:0),0),'세 종말의 증명','Proof of Three Ends','세 종류의 초월체를 모두 격파한다.','Defeat all three Apex forms.'),
    achievement('legacy-max','apex',3,m=>m.achievementStats?.maxApexLegacyStack||0,'유산 완전 계승','Legacy Complete','한 종류의 초월체 고유 유산을 3스택까지 올린다.','Reach 3 stacks of one Apex legacy.'),

    achievement('weapons-8','arsenal',8,m=>unlockedWeaponCount(m),'무기고 확장','Expanded Arsenal','장비 8종을 해금한다.','Unlock 8 pieces of equipment.'),
    achievement('weapons-14','arsenal',14,m=>unlockedWeaponCount(m),'성간 무기고','Interstellar Arsenal','장비 14종을 해금한다.','Unlock 14 pieces of equipment.'),
    achievement('weapons-all','arsenal',()=>Math.max(1,totalWeaponCount()),m=>unlockedWeaponCount(m),'완전 무장','Fully Armed','현재 존재하는 모든 장비를 해금한다.','Unlock every equipment item currently available.'),
    achievement('upgrade-10','arsenal',10,m=>totalUpgradeLevels(m),'코어 개조 I','Core Retrofit I','코어 성장 누적 레벨 10을 달성한다.','Reach 10 total Core Development levels.'),
    achievement('upgrade-30','arsenal',30,m=>totalUpgradeLevels(m),'코어 개조 II','Core Retrofit II','코어 성장 누적 레벨 30을 달성한다.','Reach 30 total Core Development levels.'),
    achievement('slot-5','arsenal',1,m=>sanitizeNumber(m.upgrades?.slot5),'다섯 번째 궤도','Fifth Orbit','장비 슬롯 5를 해금한다.','Unlock equipment slot 5.'),
    achievement('slot-6','arsenal',1,m=>sanitizeNumber(m.upgrades?.slot6),'완전한 전개','Full Deployment','장비 슬롯 6을 해금한다.','Unlock equipment slot 6.'),
    achievement('weapon-stack-6','arsenal',6,m=>m.achievementStats?.maxWeaponStack||0,'공명 완성','Resonance Complete','한 출격에서 장비 하나를 6스택까지 올린다.','Reach 6 stacks on one equipment item in a sortie.'),

    achievement('endless-10','mastery',600,m=>m.achievementStats?.bestEndlessTime||0,'10분의 항해','Ten-Minute Voyage','엔드리스에서 10분 생존한다.','Survive 10 minutes in Endless.', 'time'),
    achievement('endless-20','mastery',1200,m=>m.achievementStats?.bestEndlessTime||0,'20분의 심연','Twenty-Minute Abyss','엔드리스에서 20분 생존한다.','Survive 20 minutes in Endless.', 'time'),
    achievement('endless-40','mastery',2400,m=>m.achievementStats?.bestEndlessTime||0,'끝없는 항로','The Endless Route','엔드리스에서 40분 생존한다.','Survive 40 minutes in Endless.', 'time'),
    achievement('level-30','mastery',30,m=>m.achievementStats?.maxLevel||0,'레벨 30','Level 30','한 출격에서 레벨 30에 도달한다.','Reach level 30 in one sortie.'),
    achievement('level-50','mastery',50,m=>m.achievementStats?.maxLevel||0,'과잉 성장','Overgrowth','한 출격에서 레벨 50에 도달한다.','Reach level 50 in one sortie.')
  ]);
  const ACHIEVEMENT_IDS=new Set(ACHIEVEMENT_DEFS.map(def=>def.id));
  const normalizeAchievements=value=>{
    const raw=sanitizeMap(value),unlocked=sanitizeMap(raw.unlocked),clean={};
    for(const [id,time] of Object.entries(unlocked))if(ACHIEVEMENT_IDS.has(id))clean[id]=Math.max(1,Math.floor(Number(time)||1));
    return{unlocked:clean};
  };
  const normalizeAchievementStats=value=>{
    const raw=sanitizeMap(value),forms=sanitizeMap(raw.apexForms),apexForms={};
    for(const key of APEX_FORM_KEYS)apexForms[key]=sanitizeNumber(forms[key]);
    return{
      apexForms,
      bestEndlessTime:sanitizeNumber(raw.bestEndlessTime),
      maxLevel:sanitizeNumber(raw.maxLevel),
      maxCombo:sanitizeNumber(raw.maxCombo),
      maxWeaponStack:sanitizeNumber(raw.maxWeaponStack),
      maxApexLegacyStack:sanitizeNumber(raw.maxApexLegacyStack)
    };
  };
  const createDefaultMeta=()=>({version:8,profileName:'',unlockedWeapons:[...INITIAL_WEAPONS],unlockedFeatures:[],clearedStages:[],bestStageTimes:{},stageClearCounts:{},currencies:{stardust:0,coreShard:0},upgrades:{},bossRecords:createBossRecords(),achievements:{unlocked:{}},achievementStats:normalizeAchievementStats({}),lifetime:{runs:0,kills:0,bosses:0}});
  function canonicalClearedStages(value){const saved=new Set(sanitizeList(value)),accepted=[];for(const stage of [...(window.STACKFALL_STAGE_CATALOG||[])].sort((a,b)=>a.order-b.order)){if(!saved.has(stage.id))continue;const previous=stage.requirements?.previous;if(previous&&!accepted.includes(previous))continue;accepted.push(stage.id);}return accepted;}
  function progressionUnlockedWeapons(clearedStages,savedWeapons=[]){
    const unlocked=new Set(INITIAL_WEAPONS);
    for(const key of sanitizeList(savedWeapons))if(key!=='core'&&WEAPONS?.[key])unlocked.add(key);
    for(const stage of window.STACKFALL_STAGE_CATALOG||[]){if(!clearedStages.includes(stage.id))continue;for(const reward of stage.rewards||[])if(reward.type==='weapon'&&WEAPONS?.[reward.key])unlocked.add(reward.key);}
    return[...unlocked];
  }
  function progressionUnlockedFeatures(clearedStages,savedFeatures=[]){
    const unlocked=new Set(sanitizeList(savedFeatures).filter(key=>FEATURE_DEFS[key]));
    for(const stage of window.STACKFALL_STAGE_CATALOG||[]){if(!clearedStages.includes(stage.id))continue;for(const reward of stage.rewards||[])if(reward.type==='feature'&&FEATURE_DEFS[reward.key])unlocked.add(reward.key);}
    return[...unlocked];
  }
  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'),sharedProfileName=sanitizeProfileName(localStorage.getItem(PROFILE_NAME_KEY)||saved.profileName);
      const clearedStages=canonicalClearedStages(saved.clearedStages),unlocked=progressionUnlockedWeapons(clearedStages,saved.unlockedWeapons),unlockedFeatures=progressionUnlockedFeatures(clearedStages,saved.unlockedFeatures);
      const currencies=normalizeCurrencies(saved.currencies),upgrades=normalizeUpgrades(saved.upgrades),bossRecords=normalizeBossRecords(saved.bossRecords,saved.lifetime?.bosses);
      return{
        version:8,
        profileName:sharedProfileName,
        unlockedWeapons:unlocked,
        unlockedFeatures,
        clearedStages,
        bestStageTimes:sanitizeMap(saved.bestStageTimes),
        stageClearCounts:sanitizeMap(saved.stageClearCounts),
        currencies,
        upgrades,
        bossRecords,
        achievements:normalizeAchievements(saved.achievements),
        achievementStats:normalizeAchievementStats(saved.achievementStats),
        lifetime:{runs:sanitizeNumber(saved.lifetime?.runs),kills:sanitizeNumber(saved.lifetime?.kills),bosses:bossTotal(bossRecords)}
      };
    }catch{
      return createDefaultMeta();
    }
  }
  const meta=load();
  let achievementUiReady=false,achievementFilter='all';
  const achievementToastQueue=[];
  const achievementById=id=>ACHIEVEMENT_DEFS.find(def=>def.id===id)||null;
  const achievementGoal=def=>Math.max(1,Math.floor(Number(typeof def.goal==='function'?def.goal(meta):def.goal)||1));
  const achievementProgress=def=>Math.max(0,Math.floor(Number(def.progress(meta))||0));
  const achievementUnlocked=id=>Object.prototype.hasOwnProperty.call(meta.achievements?.unlocked||{},id);
  const localizedAchievement=value=>value?.[GAME_SETTINGS?.language]||value?.en||value?.ko||'';
  const achievementUiText=()=>{
    const lang=GAME_SETTINGS?.language||'ko';
    if(lang==='en')return{title:'Achievements',expand:'View details',all:'ALL',expedition:'EXPEDITION',combat:'COMBAT',apex:'APEX',arsenal:'ARSENAL',mastery:'MASTERY',unlocked:'UNLOCKED',locked:'IN PROGRESS',toast:'ACHIEVEMENT UNLOCKED'};
    if(lang==='ja')return{title:'実績',expand:'詳細を見る',all:'すべて',expedition:'遠征',combat:'戦闘',apex:'超越体',arsenal:'兵装',mastery:'熟練',unlocked:'達成',locked:'進行中',toast:'実績解除'};
    if(lang==='zh-CN')return{title:'成就',expand:'查看详情',all:'全部',expedition:'远征',combat:'战斗',apex:'超越体',arsenal:'武装',mastery:'精通',unlocked:'已完成',locked:'进行中',toast:'成就解锁'};
    if(lang==='es')return{title:'Logros',expand:'Ver detalles',all:'TODOS',expedition:'EXPEDICIÓN',combat:'COMBATE',apex:'ÁPEX',arsenal:'ARSENAL',mastery:'MAESTRÍA',unlocked:'COMPLETADO',locked:'EN PROGRESO',toast:'LOGRO DESBLOQUEADO'};
    if(lang==='fr')return{title:'Succès',expand:'Voir les détails',all:'TOUS',expedition:'EXPÉDITION',combat:'COMBAT',apex:'APEX',arsenal:'ARSENAL',mastery:'MAÎTRISE',unlocked:'ACCOMPLI',locked:'EN COURS',toast:'SUCCÈS DÉBLOQUÉ'};
    return{title:'업적',expand:'세부 보기',all:'전체',expedition:'원정',combat:'전투',apex:'초월체',arsenal:'무장',mastery:'숙련',unlocked:'달성',locked:'진행 중',toast:'업적 달성'};
  };
  const categoryGlyph=category=>({expedition:'◇',combat:'✦',apex:'✹',arsenal:'⬡',mastery:'★'})[category]||'◇';
  const formatAchievementValue=(value,format)=>{
    const n=Math.max(0,Math.floor(Number(value)||0));if(format!=='time')return n.toLocaleString();const m=Math.floor(n/60),s=n%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };
  function showAchievementToast(def){
    if(!def)return;if(!achievementUiReady){achievementToastQueue.push(def.id);return;}
    const stack=document.querySelector('#achievementToastStack');if(!stack)return;const text=achievementUiText(),toast=document.createElement('div');toast.className='achievement-toast';toast.innerHTML=`<i>${categoryGlyph(def.category)}</i><div><small>${text.toast}</small><strong>${localizedAchievement(def.name)}</strong></div>`;stack.appendChild(toast);requestAnimationFrame(()=>toast.classList.add('show'));setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),260);},3600);
  }
  function evaluateAchievements({notify=true}={}){
    meta.achievements=normalizeAchievements(meta.achievements);const newly=[];
    for(const def of ACHIEVEMENT_DEFS){if(achievementUnlocked(def.id))continue;if(achievementProgress(def)<achievementGoal(def))continue;meta.achievements.unlocked[def.id]=Date.now();newly.push(def);}
    if(notify)for(const def of newly)showAchievementToast(def);return newly;
  }
  function persistMeta(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(meta));if(meta.profileName)localStorage.setItem(PROFILE_NAME_KEY,meta.profileName);}catch{}syncFeatureEntries();window.renderStackfallMetaUi?.();window.renderStackfallAchievements?.();}
  function save(options={}){if(options.evaluateAchievements!==false)evaluateAchievements({notify:options.notifyAchievements!==false});persistMeta();}
  function captureRunAchievementStats(){
    const stats=meta.achievementStats=normalizeAchievementStats(meta.achievementStats);
    stats.maxLevel=Math.max(stats.maxLevel,sanitizeNumber(state?.level));stats.maxCombo=Math.max(stats.maxCombo,sanitizeNumber(state?.maxCombo),sanitizeNumber(state?.combo));
    let weaponMax=0;for(const value of Object.values(state?.weaponStacks||{}))weaponMax=Math.max(weaponMax,sanitizeNumber(value));stats.maxWeaponStack=Math.max(stats.maxWeaponStack,weaponMax);
    let legacyMax=0;for(const value of Object.values(state?.apexBoons||{}))legacyMax=Math.max(legacyMax,sanitizeNumber(value));stats.maxApexLegacyStack=Math.max(stats.maxApexLegacyStack,legacyMax);
    if(window.stackfallIsEndlessRun?.()===true)stats.bestEndlessTime=Math.max(stats.bestEndlessTime,sanitizeNumber(state?.time));
  }
  function setProfileName(value){meta.profileName=sanitizeProfileName(value);try{if(meta.profileName)localStorage.setItem(PROFILE_NAME_KEY,meta.profileName);else localStorage.removeItem(PROFILE_NAME_KEY);}catch{}save();return meta.profileName;}
  const TOGGLEABLE_FEATURES=Object.freeze(new Set(['awakening','special-ability','choice-4','start-level-3','multiplicity-protocol']));
  function isWeaponUnlocked(key){return key==='core'||meta.unlockedWeapons.includes(key);}
  function isFeatureAcquired(key){return DEV_PROFILE||meta.unlockedFeatures?.includes(key);}
  function isFeatureUnlocked(key){return isFeatureAcquired(key)&&(!TOGGLEABLE_FEATURES.has(key)||GAME_SETTINGS?.unlocks?.[key]!==false);}
  function isPassiveChoiceUnlocked(key){if(key==='multiplicity')return isFeatureUnlocked('multiplicity-protocol');return true;}
  function featureName(key){const def=FEATURE_DEFS[key];return def?.[GAME_SETTINGS?.language]||def?.en||def?.ko||key;}
  function syncFeatureEntries(){
    const endless=document.querySelector('#startBtn');if(endless){const unlocked=isFeatureUnlocked('endless');endless.disabled=!unlocked;endless.classList.toggle('locked',!unlocked);endless.title='';}
  }
  function unlockWeapon(key){
    if(!WEAPONS[key]||isWeaponUnlocked(key))return false;
    meta.unlockedWeapons.push(key);save();
    if(typeof renderStarterOptions==='function')renderStarterOptions();
    return true;
  }
  function currency(key){return sanitizeNumber(meta.currencies?.[key]);}
  function grantCurrency(key,amount){
    if(!CURRENCY_KEYS.includes(key))return 0;
    const add=sanitizeNumber(amount);if(!add)return 0;
    meta.currencies[key]=currency(key)+add;save();return add;
  }
  function spendCurrency(cost={}){
    for(const key of CURRENCY_KEYS)if(currency(key)<sanitizeNumber(cost[key]))return false;
    for(const key of CURRENCY_KEYS)meta.currencies[key]=currency(key)-sanitizeNumber(cost[key]);
    save();return true;
  }
  function upgradeLevel(key){return sanitizeNumber(meta.upgrades?.[key]);}
  function setUpgradeLevel(key,level){if(typeof key!=='string'||!key)return false;meta.upgrades[key]=sanitizeNumber(level);save();return true;}
  function stageStatus(stage){
    if(!stage)return'locked';
    if(meta.clearedStages.includes(stage.id))return'cleared';
    const previous=stage.requirements?.previous;
    if(previous&&!meta.clearedStages.includes(previous))return'locked';
    return stage.status||'planned';
  }
  function recordStageClear(stageId,timeSeconds){
    const stage=window.stackfallStageById?.(stageId);if(!stage)return{newWeapons:[],firstClear:false,best:false,currency:{}};
    captureRunAchievementStats();const firstClear=!meta.clearedStages.includes(stageId);
    if(firstClear)meta.clearedStages.push(stageId);
    meta.stageClearCounts=meta.stageClearCounts||{};
    const clearCount=sanitizeNumber(meta.stageClearCounts[stageId])+1;meta.stageClearCounts[stageId]=clearCount;
    const previous=Number(meta.bestStageTimes[stageId]),time=Math.max(0,Number(timeSeconds)||0),best=!Number.isFinite(previous)||time<previous;
    if(best)meta.bestStageTimes[stageId]=time;
    const newWeapons=[],newFeatures=[],currencyReward={stardust:0,coreShard:0};
    for(const reward of stage.rewards||[]){
      if(reward.type==='weapon'&&unlockWeapon(reward.key))newWeapons.push(reward.key);
      if(reward.type==='feature'&&firstClear&&FEATURE_DEFS[reward.key]&&!meta.unlockedFeatures.includes(reward.key)){meta.unlockedFeatures.push(reward.key);newFeatures.push(reward.key);}
      if(reward.type==='currency'&&reward.key!=='coreShard'&&(!reward.firstClearOnly||firstClear)){
        const multiplier=reward.key==='stardust'?(window.stackfallCurrencyMultiplier?.()||1):1;
        const amount=Math.max(0,Math.floor((Number(reward.amount)||0)*multiplier));
        if(amount){meta.currencies[reward.key]=currency(reward.key)+amount;currencyReward[reward.key]=(currencyReward[reward.key]||0)+amount;}
      }
    }
    save();
    return{newWeapons,newFeatures,firstClear,best,bestTime:meta.bestStageTimes[stageId],clearCount,currency:currencyReward};
  }
  function bossRecordCategory(enemy){
    if(!enemy)return null;
    if(enemy.eventVariant==='dreadnought'||enemy.kind==='crash-boss')return'crash';
    if(enemy.kind==='void'||enemy.eventKind==='void')return'void';
    if(enemy.kind==='apex'||enemy.bossCategory==='apex')return'apex';
    if(enemy.type==='mini')return'mini';
    if(enemy.type==='boss')return'boss';
    return null;
  }
  function recordBossDefeat(enemy){
    const key=bossRecordCategory(enemy);if(!key)return null;
    meta.bossRecords=normalizeBossRecords(meta.bossRecords);meta.bossRecords[key]++;
    if(key==='apex'){
      const form=String(enemy?.apexForm||enemy?.eliteForm||'');
      if(APEX_FORM_KEYS.includes(form)){meta.achievementStats=normalizeAchievementStats(meta.achievementStats);meta.achievementStats.apexForms[form]++;}
    }
    meta.lifetime.bosses=bossTotal(meta.bossRecords);save();return key;
  }
  function recordRun(kills=0){captureRunAchievementStats();meta.lifetime.runs=sanitizeNumber(meta.lifetime.runs)+1;meta.lifetime.kills=sanitizeNumber(meta.lifetime.kills)+sanitizeNumber(kills);save();}

  function ensureAchievementStyle(){
    if(document.querySelector('#stackfallAchievementStyle'))return;const style=document.createElement('style');style.id='stackfallAchievementStyle';style.textContent=`
      .achievement-details>summary b{margin-left:7px;color:#8feaff;font-size:9px}.achievement-toolbar{display:flex;gap:5px;overflow-x:auto;padding:0 10px 8px;scrollbar-width:thin}.achievement-filter{flex:0 0 auto;padding:5px 8px;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:rgba(255,255,255,.035);color:#8392b5;font-size:7px;font-weight:900;cursor:pointer}.achievement-filter.active{border-color:rgba(124,232,255,.30);background:rgba(124,232,255,.08);color:#bff5ff}.achievement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:0 10px 10px}.achievement-card{position:relative;display:grid;grid-template-columns:42px minmax(0,1fr);gap:9px;min-height:78px;padding:10px;border:1px solid rgba(255,255,255,.06);border-radius:11px;background:rgba(4,8,22,.55);overflow:hidden}.achievement-card.unlocked{border-color:rgba(124,232,255,.18);background:linear-gradient(135deg,rgba(124,232,255,.065),rgba(158,121,255,.035))}.achievement-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:radial-gradient(circle,rgba(124,232,255,.12),rgba(83,73,168,.05));color:#7787aa;font-size:20px;text-shadow:0 0 10px currentColor}.achievement-card.unlocked .achievement-icon{color:#bdf5ff;border-color:rgba(124,232,255,.22);box-shadow:0 0 18px rgba(124,232,255,.08)}.achievement-copy{min-width:0}.achievement-copy small{display:block;color:#66769b;font-size:6px;font-weight:900;letter-spacing:.11em}.achievement-copy strong{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#dce7fb;font-size:10px}.achievement-copy p{margin:3px 0 0;color:#7d8daf;font-size:7px;line-height:1.45}.achievement-progress{grid-column:1/-1;display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;margin-top:1px}.achievement-progress>i{height:3px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden}.achievement-progress>i:after{content:'';display:block;width:var(--achievement-progress,0%);height:100%;background:linear-gradient(90deg,#789dff,#7ce8ff);box-shadow:0 0 7px rgba(124,232,255,.32)}.achievement-progress span{color:#7383a7;font-size:7px;font-weight:800}.achievement-card.unlocked .achievement-progress span{color:#8feaff}.achievement-toast-stack{position:fixed;right:18px;bottom:18px;z-index:90;display:grid;gap:8px;pointer-events:none}.achievement-toast{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:10px;width:min(330px,calc(100vw - 36px));padding:10px 12px;border:1px solid rgba(124,232,255,.28);border-radius:14px;background:linear-gradient(135deg,rgba(10,18,42,.96),rgba(18,12,38,.96));box-shadow:0 16px 45px rgba(0,0,0,.42),0 0 24px rgba(124,232,255,.08);opacity:0;transform:translateY(12px) scale(.98);transition:opacity .22s,transform .22s}.achievement-toast.show{opacity:1;transform:none}.achievement-toast>i{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:rgba(124,232,255,.08);color:#c8f7ff;font-style:normal;font-size:20px;text-shadow:0 0 12px currentColor}.achievement-toast small{display:block;color:#8feaff;font-size:7px;font-weight:900;letter-spacing:.14em}.achievement-toast strong{display:block;margin-top:3px;color:#f4f8ff;font-size:11px}@media(max-width:650px){.achievement-grid{grid-template-columns:1fr}.achievement-toast-stack{right:10px;bottom:10px}.achievement-card{min-height:72px}}`;
    document.head.appendChild(style);
  }
  function ensureAchievementUi(){
    if(achievementUiReady)return true;const modal=document.querySelector('#profileScreen .profile-modal');if(!modal)return false;ensureAchievementStyle();
    let details=document.querySelector('#profileAchievements');if(!details){
      details=document.createElement('details');details.id='profileAchievements';details.className='profile-details achievement-details';details.innerHTML='<summary><span id="profileAchievementTitle"></span><small id="profileAchievementExpand"></small></summary><div id="achievementToolbar" class="achievement-toolbar"></div><div id="profileAchievementGrid" class="achievement-grid"></div>';
      const stageDetails=[...modal.querySelectorAll('.profile-details')].at(-1);modal.insertBefore(details,stageDetails||null);
    }
    if(!document.querySelector('#achievementToastStack')){const stack=document.createElement('div');stack.id='achievementToastStack';stack.className='achievement-toast-stack';stack.setAttribute('aria-live','polite');document.body.appendChild(stack);}
    achievementUiReady=true;window.renderStackfallAchievements=renderAchievements;renderAchievements();
    while(achievementToastQueue.length){const id=achievementToastQueue.shift();showAchievementToast(achievementById(id));}
    return true;
  }
  function renderAchievements(){
    if(!ensureAchievementUi())return;const text=achievementUiText(),unlockedCount=Object.keys(meta.achievements?.unlocked||{}).filter(id=>ACHIEVEMENT_IDS.has(id)).length,title=document.querySelector('#profileAchievementTitle'),expand=document.querySelector('#profileAchievementExpand'),toolbar=document.querySelector('#achievementToolbar'),grid=document.querySelector('#profileAchievementGrid');if(!title||!toolbar||!grid)return;
    title.innerHTML=`${text.title}<b>${unlockedCount} / ${ACHIEVEMENT_DEFS.length}</b>`;if(expand)expand.textContent=text.expand;
    const categories=['all','expedition','combat','apex','arsenal','mastery'];toolbar.innerHTML='';for(const category of categories){const button=document.createElement('button');button.type='button';button.className='achievement-filter'+(achievementFilter===category?' active':'');button.textContent=text[category]||category;button.addEventListener('click',()=>{achievementFilter=category;renderAchievements();});toolbar.appendChild(button);}
    grid.innerHTML='';const rows=achievementFilter==='all'?ACHIEVEMENT_DEFS:ACHIEVEMENT_DEFS.filter(def=>def.category===achievementFilter);
    for(const def of rows){const unlocked=achievementUnlocked(def.id),goal=achievementGoal(def),progress=Math.min(goal,achievementProgress(def)),pct=unlocked?100:Math.min(100,progress/goal*100),card=document.createElement('div');card.className='achievement-card'+(unlocked?' unlocked':'');card.innerHTML=`<div class="achievement-icon" aria-hidden="true">${categoryGlyph(def.category)}</div><div class="achievement-copy"><small>${text[def.category]||def.category}</small><strong>${localizedAchievement(def.name)}</strong><p>${localizedAchievement(def.desc)}</p></div><div class="achievement-progress" style="--achievement-progress:${pct.toFixed(1)}%"><i></i><span>${unlocked?text.unlocked:`${formatAchievementValue(progress,def.format)} / ${formatAchievementValue(goal,def.format)}`}</span></div>`;grid.appendChild(card);}
  }
  function initializeAchievementsAfterLoad(){
    ensureAchievementUi();evaluateAchievements({notify:false});persistMeta();renderAchievements();
  }

  window.STACKFALL_INITIAL_WEAPONS=INITIAL_WEAPONS;
  window.STACKFALL_CURRENCY_KEYS=CURRENCY_KEYS;
  window.STACKFALL_BOSS_RECORD_KEYS=BOSS_RECORD_KEYS;
  window.STACKFALL_FEATURE_DEFS=FEATURE_DEFS;
  window.STACKFALL_ACHIEVEMENTS=ACHIEVEMENT_DEFS;
  window.stackfallMeta=meta;
  window.stackfallSaveMeta=save;
  window.stackfallSetProfileName=setProfileName;
  window.stackfallIsWeaponUnlocked=isWeaponUnlocked;
  window.stackfallIsFeatureAcquired=isFeatureAcquired;
  window.stackfallIsFeatureUnlocked=isFeatureUnlocked;
  window.stackfallIsPassiveChoiceUnlocked=isPassiveChoiceUnlocked;
  window.stackfallFeatureName=featureName;
  window.stackfallFeatureToggleable=key=>TOGGLEABLE_FEATURES.has(key);
  window.stackfallUnlockWeapon=unlockWeapon;
  window.stackfallCurrency=currency;
  window.stackfallGrantCurrency=grantCurrency;
  window.stackfallSpendCurrency=spendCurrency;
  window.stackfallUpgradeLevel=upgradeLevel;
  window.stackfallSetUpgradeLevel=setUpgradeLevel;
  window.stackfallRecordRun=recordRun;
  window.stackfallRecordBossDefeat=recordBossDefeat;
  window.stackfallStageStatus=stageStatus;
  window.stackfallRecordStageClear=recordStageClear;
  window.stackfallAchievementProgress=id=>{const def=achievementById(id);return def?{progress:achievementProgress(def),goal:achievementGoal(def),unlocked:achievementUnlocked(id)}:null;};
  window.stackfallEvaluateAchievements=()=>{const newly=evaluateAchievements({notify:true});persistMeta();return newly.map(def=>def.id);};
  window.stackfallRefreshFeatureUi=()=>{syncFeatureEntries();window.renderStackfallGalaxyMap?.();window.renderStackfallMetaUi?.();window.stackfallSyncAwakeningCoreHud?.();window.renderStackfallAchievements?.();};
  syncFeatureEntries();save({evaluateAchievements:false});
  if(document.readyState==='complete')queueMicrotask(initializeAchievementsAfterLoad);else window.addEventListener('load',initializeAchievementsAfterLoad,{once:true});
})();