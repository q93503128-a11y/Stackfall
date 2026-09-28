(()=>{
  let DEV_PROFILE=false;try{DEV_PROFILE=new URLSearchParams(location.search).get('dev')==='1';}catch{}
  const STORAGE_KEY=DEV_PROFILE?'stackfall.meta.dev.v1':'stackfall.meta.v1';
  window.stackfallMetaStorageProfile=DEV_PROFILE?'developer':'player';
  const INITIAL_WEAPONS=Object.freeze(['blade','ember','bulwark','gravity']);
  const CURRENCY_KEYS=Object.freeze(['stardust','coreShard']);
  const sanitizeList=value=>Array.isArray(value)?[...new Set(value.filter(item=>typeof item==='string'))]:[];
  const sanitizeNumber=value=>Math.max(0,Math.floor(Number(value)||0));
  const sanitizeMap=value=>value&&typeof value==='object'&&!Array.isArray(value)?{...value}:{};
  function canonicalClearedStages(value){const saved=new Set(sanitizeList(value)),accepted=[];for(const stage of [...(window.STACKFALL_STAGE_CATALOG||[])].sort((a,b)=>a.order-b.order)){if(!saved.has(stage.id))continue;const previous=stage.requirements?.previous;if(previous&&!accepted.includes(previous))continue;accepted.push(stage.id);}return accepted;}
  function progressionUnlockedWeapons(clearedStages){const unlocked=new Set(INITIAL_WEAPONS);for(const stage of window.STACKFALL_STAGE_CATALOG||[]){if(!clearedStages.includes(stage.id))continue;for(const reward of stage.rewards||[])if(reward.type==='weapon'&&WEAPONS[reward.key])unlocked.add(reward.key);}return[...unlocked];}
  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      const clearedStages=canonicalClearedStages(saved.clearedStages),unlocked=progressionUnlockedWeapons(clearedStages);
      const currencies={stardust:0,coreShard:0,...sanitizeMap(saved.currencies)};
      for(const key of CURRENCY_KEYS)currencies[key]=sanitizeNumber(currencies[key]);
      const upgrades=sanitizeMap(saved.upgrades);
      for(const key of Object.keys(upgrades))upgrades[key]=sanitizeNumber(upgrades[key]);
      return{
        version:4,
        unlockedWeapons:unlocked,
        clearedStages,
        bestStageTimes:sanitizeMap(saved.bestStageTimes),
        stageClearCounts:sanitizeMap(saved.stageClearCounts),
        currencies,
        upgrades,
        lifetime:{runs:sanitizeNumber(saved.lifetime?.runs),kills:sanitizeNumber(saved.lifetime?.kills),bosses:sanitizeNumber(saved.lifetime?.bosses)}
      };
    }catch{
      return{version:4,unlockedWeapons:[...INITIAL_WEAPONS],clearedStages:[],bestStageTimes:{},stageClearCounts:{},currencies:{stardust:0,coreShard:0},upgrades:{},lifetime:{runs:0,kills:0,bosses:0}};
    }
  }
  const meta=load();
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(meta));}catch{}window.renderStackfallMetaUi?.();}
  function isWeaponUnlocked(key){return key==='core'||meta.unlockedWeapons.includes(key);}
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
    const newWeapons=[],currencyReward={stardust:0,coreShard:0};
    for(const reward of stage.rewards||[]){
      if(reward.type==='weapon'&&unlockWeapon(reward.key))newWeapons.push(reward.key);
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
    meta.lifetime.bosses=sanitizeNumber(meta.lifetime.bosses)+1;
    save();
    return{newWeapons,firstClear,best,bestTime:meta.bestStageTimes[stageId],clearCount,currency:currencyReward};
  }
  function recordRun(kills=0){meta.lifetime.runs=sanitizeNumber(meta.lifetime.runs)+1;meta.lifetime.kills=sanitizeNumber(meta.lifetime.kills)+sanitizeNumber(kills);save();}
  window.STACKFALL_INITIAL_WEAPONS=INITIAL_WEAPONS;
  window.STACKFALL_CURRENCY_KEYS=CURRENCY_KEYS;
  window.stackfallMeta=meta;
  window.stackfallSaveMeta=save;
  window.stackfallIsWeaponUnlocked=isWeaponUnlocked;
  window.stackfallUnlockWeapon=unlockWeapon;
  window.stackfallCurrency=currency;
  window.stackfallGrantCurrency=grantCurrency;
  window.stackfallSpendCurrency=spendCurrency;
  window.stackfallUpgradeLevel=upgradeLevel;
  window.stackfallSetUpgradeLevel=setUpgradeLevel;
  window.stackfallRecordRun=recordRun;
  window.stackfallStageStatus=stageStatus;
  window.stackfallRecordStageClear=recordStageClear;
  save();
})();