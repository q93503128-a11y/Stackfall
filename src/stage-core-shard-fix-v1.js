(()=>{
  'use strict';
  const base=window.stackfallRecordStageClear;
  if(typeof base!=='function'||base.__stackfallCoreShardFirstClearFix)return;

  function coreShardReward(stage,firstClear){
    if(!stage||!firstClear)return 0;
    return (stage.rewards||[]).reduce((sum,reward)=>{
      if(reward?.type!=='currency'||reward.key!=='coreShard')return sum;
      if(reward.firstClearOnly&&!firstClear)return sum;
      return sum+Math.max(0,Math.floor(Number(reward.amount)||0));
    },0);
  }

  function recordStageClearWithCoreShard(stageId,timeSeconds){
    const before=window.stackfallCurrency?.('coreShard')||0;
    const result=base(stageId,timeSeconds);
    if(!result?.firstClear)return result;

    const stage=window.stackfallStageById?.(stageId),expected=coreShardReward(stage,true),reported=Math.max(0,Math.floor(Number(result.currency?.coreShard)||0));
    const missing=Math.max(0,expected-reported);
    if(missing>0){
      const granted=window.stackfallGrantCurrency?.('coreShard',missing)||0;
      if(granted>0)result.currency={...(result.currency||{}),coreShard:reported+granted};
    }
    const after=window.stackfallCurrency?.('coreShard')||before;
    if(expected>0&&after<before+expected)console.error('[Stackfall] Core Shard first-clear reward did not settle',stageId,{before,after,expected});
    return result;
  }
  recordStageClearWithCoreShard.__stackfallCoreShardFirstClearFix=true;
  window.stackfallRecordStageClear=recordStageClearWithCoreShard;
})();
