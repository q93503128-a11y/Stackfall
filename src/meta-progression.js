(()=>{
  let DEV_PROFILE=false;try{DEV_PROFILE=new URLSearchParams(location.search).get('dev')==='1';}catch{}
  const STORAGE_KEY=DEV_PROFILE?'stackfall.meta.dev.v1':'stackfall.meta.v1';
  const PROFILE_NAME_KEY='stackfall.profileName.v1';
  window.stackfallMetaStorageProfile=DEV_PROFILE?'developer':'player';
  const INITIAL_WEAPONS=Object.freeze(['blade','ember','bulwark','gravity']);
  const CURRENCY_KEYS=Object.freeze(['stardust','coreShard']);
  const BOSS_RECORD_KEYS=Object.freeze(['mini','boss','apex','void','crash']);
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
  function canonicalClearedStages(value){const saved=new Set(sanitizeList(value)),accepted=[];for(const stage of [...(window.STACKFALL_STAGE_CATALOG||[])].sort((a,b)=>a.order-b.order)){if(!saved.has(stage.id))continue;const previous=stage.requirements?.previous;if(previous&&!accepted.includes(previous))continue;accepted.push(stage.id);}return accepted;}
  function progressionUnlockedWeapons(clearedStages){const unlocked=new Set(INITIAL_WEAPONS);for(const stage of window.STACKFALL_STAGE_CATALOG||[]){if(!clearedStages.includes(stage.id))continue;for(const reward of stage.rewards||[])if(reward.type==='weapon'&&WEAPONS[reward.key])unlocked.add(reward.key);}return[...unlocked];}
  function progressionUnlockedFeatures(clearedStages){const unlocked=new Set();for(const stage of window.STACKFALL_STAGE_CATALOG||[]){if(!clearedStages.includes(stage.id))continue;for(const reward of stage.rewards||[])if(reward.type==='feature'&&FEATURE_DEFS[reward.key])unlocked.add(reward.key);}return[...unlocked];}
  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'),sharedProfileName=sanitizeProfileName(localStorage.getItem(PROFILE_NAME_KEY)||saved.profileName);
      const clearedStages=canonicalClearedStages(saved.clearedStages),unlocked=progressionUnlockedWeapons(clearedStages),unlockedFeatures=progressionUnlockedFeatures(clearedStages);
      const currencies={stardust:0,coreShard:0,...sanitizeMap(saved.currencies)};
      for(const key of CURRENCY_KEYS)currencies[key]=sanitizeNumber(currencies[key]);
      const upgrades=sanitizeMap(saved.upgrades);
      for(const key of Object.keys(upgrades))upgrades[key]=sanitizeNumber(upgrades[key]);
      const savedBossRecords=sanitizeMap(saved.bossRecords),bossRecords={mini:0,boss:0,apex:0,void:0,crash:0};
      const hasBossBreakdown=BOSS_RECORD_KEYS.some(key=>Object.prototype.hasOwnProperty.call(savedBossRecords,key));
      for(const key of BOSS_RECORD_KEYS)bossRecords[key]=sanitizeNumber(savedBossRecords[key]);
      if(!hasBossBreakdown)bossRecords.apex=sanitizeNumber(saved.lifetime?.bosses);
      const bossTotal=BOSS_RECORD_KEYS.reduce((sum,key)=>sum+bossRecords[key],0);
      return{
        version:6,
        profileName:sharedProfileName,
        unlockedWeapons:unlocked,
        unlockedFeatures,
        clearedStages,
        bestStageTimes:sanitizeMap(saved.bestStageTimes),
        stageClearCounts:sanitizeMap(saved.stageClearCounts),
        currencies,
        upgrades,
        bossRecords,
        lifetime:{runs:sanitizeNumber(saved.lifetime?.runs),kills:sanitizeNumber(saved.lifetime?.kills),bosses:bossTotal}
      };
    }catch{
      return{version:6,profileName:'',unlockedWeapons:[...INITIAL_WEAPONS],unlockedFeatures:[],clearedStages:[],bestStageTimes:{},stageClearCounts:{},currencies:{stardust:0,coreShard:0},upgrades:{},bossRecords:{mini:0,boss:0,apex:0,void:0,crash:0},lifetime:{runs:0,kills:0,bosses:0}};
    }
  }
  const meta=load();
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(meta));if(meta.profileName)localStorage.setItem(PROFILE_NAME_KEY,meta.profileName);}catch{}syncFeatureEntries();window.renderStackfallMetaUi?.();}
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
    const firstClear=!meta.clearedStages.includes(stageId);
    if(firstClear)meta.clearedStages.push(stageId);
    meta.stageClearCounts=meta.stageClearCounts||{};
    const clearCount=sanitizeNumber(meta.stageClearCounts[stageId])+1;meta.stageClearCounts[stageId]=clearCount;
    const previous=Number(meta.bestStageTimes[stageId]),time=Math.max(0,Number(timeSeconds)||0),best=!Number.isFinite(previous)||time<previous;
    if(best)meta.bestStageTimes[stageId]=time;
    const newWeapons=[],newFeatures=[],currencyReward={stardust:0,coreShard:0};
    for(const reward of stage.rewards||[]){
      if(reward.type==='weapon'&&unlockWeapon(reward.key))newWeapons.push(reward.key);
      if(reward.type==='feature'&&firstClear&&FEATURE_DEFS[reward.key]&&!meta.unlockedFeatures.includes(reward.key)){meta.unlockedFeatures.push(reward.key);newFeatures.push(reward.key);}
      if(reward.type==='currency'&&(!reward.firstClearOnly||firstClear)){
        const multiplier=reward.key==='stardust'?(window.stackfallCurrencyMultiplier?.()||1):1;
        const amount=Math.max(0,Math.floor((Number(reward.amount)||0)*multiplier));
        if(amount){meta.currencies[reward.key]=currency(reward.key)+amount;currencyReward[reward.key]=(currencyReward[reward.key]||0)+amount;}
      }
    }
    const repeatClearCount=Math.max(0,clearCount-1);
    if(stageId==='stage-01'&&repeatClearCount>0&&repeatClearCount%3===0){
      meta.currencies.coreShard=currency('coreShard')+1;
      currencyReward.coreShard=(currencyReward.coreShard||0)+1;
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
    meta.bossRecords=meta.bossRecords&&typeof meta.bossRecords==='object'?meta.bossRecords:{mini:0,boss:0,apex:0,void:0,crash:0};
    for(const recordKey of BOSS_RECORD_KEYS)meta.bossRecords[recordKey]=sanitizeNumber(meta.bossRecords[recordKey]);
    meta.bossRecords[key]++;meta.lifetime.bosses=BOSS_RECORD_KEYS.reduce((sum,recordKey)=>sum+sanitizeNumber(meta.bossRecords[recordKey]),0);save();return key;
  }
  function recordRun(kills=0){meta.lifetime.runs=sanitizeNumber(meta.lifetime.runs)+1;meta.lifetime.kills=sanitizeNumber(meta.lifetime.kills)+sanitizeNumber(kills);save();}
  window.STACKFALL_INITIAL_WEAPONS=INITIAL_WEAPONS;
  window.STACKFALL_CURRENCY_KEYS=CURRENCY_KEYS;
  window.STACKFALL_BOSS_RECORD_KEYS=BOSS_RECORD_KEYS;
  window.STACKFALL_FEATURE_DEFS=FEATURE_DEFS;
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
  window.stackfallRefreshFeatureUi=()=>{syncFeatureEntries();window.renderStackfallGalaxyMap?.();window.renderStackfallMetaUi?.();window.stackfallSyncAwakeningCoreHud?.();};
  syncFeatureEntries();save();
})();