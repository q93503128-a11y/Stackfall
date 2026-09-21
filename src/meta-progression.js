(()=>{
  const STORAGE_KEY='stackfall.meta.v1';
  const INITIAL_WEAPONS=Object.freeze(['blade','ember','bulwark','gravity']);
  const sanitizeList=value=>Array.isArray(value)?[...new Set(value.filter(item=>typeof item==='string'))]:[];
  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      const unlocked=[...new Set([...INITIAL_WEAPONS,...sanitizeList(saved.unlockedWeapons)])].filter(key=>key==='core'||WEAPONS[key]);
      return{
        version:1,
        unlockedWeapons:unlocked,
        clearedStages:sanitizeList(saved.clearedStages),
        bestStageTimes:{...(saved.bestStageTimes||{})}
      };
    }catch{
      return{version:1,unlockedWeapons:[...INITIAL_WEAPONS],clearedStages:[],bestStageTimes:{}};
    }
  }
  const meta=load();
  function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(meta));}catch{}}
  function isWeaponUnlocked(key){return key==='core'||meta.unlockedWeapons.includes(key);}
  function unlockWeapon(key){
    if(!WEAPONS[key]||isWeaponUnlocked(key))return false;
    meta.unlockedWeapons.push(key);save();
    if(typeof renderStarterOptions==='function')renderStarterOptions();
    return true;
  }
  function stageStatus(stage){
    if(!stage)return'locked';
    if(meta.clearedStages.includes(stage.id))return'cleared';
    const previous=stage.requirements?.previous;
    if(previous&&!meta.clearedStages.includes(previous))return'locked';
    return stage.status||'planned';
  }
  function recordStageClear(stageId,timeSeconds){
    const stage=window.stackfallStageById?.(stageId);if(!stage)return{newWeapons:[],firstClear:false,best:false};
    const firstClear=!meta.clearedStages.includes(stageId);
    if(firstClear)meta.clearedStages.push(stageId);
    const previous=Number(meta.bestStageTimes[stageId]),time=Math.max(0,Number(timeSeconds)||0),best=!Number.isFinite(previous)||time<previous;
    if(best)meta.bestStageTimes[stageId]=time;
    const newWeapons=[];
    for(const reward of stage.rewards||[])if(reward.type==='weapon'&&unlockWeapon(reward.key))newWeapons.push(reward.key);
    save();
    return{newWeapons,firstClear,best,bestTime:meta.bestStageTimes[stageId]};
  }
  window.STACKFALL_INITIAL_WEAPONS=INITIAL_WEAPONS;
  window.stackfallMeta=meta;
  window.stackfallSaveMeta=save;
  window.stackfallIsWeaponUnlocked=isWeaponUnlocked;
  window.stackfallUnlockWeapon=unlockWeapon;
  window.stackfallStageStatus=stageStatus;
  window.stackfallRecordStageClear=recordStageClear;
})();
