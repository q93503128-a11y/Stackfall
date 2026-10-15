(()=>{
  const MODES=Object.freeze({ENDLESS:'endless',STAGE:'stage'});
  const ENDLESS=Object.freeze({
    mode:MODES.ENDLESS,
    finite:false,
    randomWorldEvents:true,
    allEnemyFamilies:true,
    apexIntervalSeconds:600
  });
  const validMode=mode=>mode===MODES.ENDLESS||mode===MODES.STAGE;
  const stageById=id=>typeof window.stackfallStageById==='function'?window.stackfallStageById(id):null;
  const normalize=(mode,stageId=null)=>{
    if(mode===MODES.STAGE){
      const stage=stageById(stageId);
      if(stage)return{mode:MODES.STAGE,stageId:stage.id};
    }
    return{mode:MODES.ENDLESS,stageId:null};
  };
  state.runSelection=normalize(state.runSelection?.mode,state.runSelection?.stageId);
  window.STACKFALL_RUN_MODES=MODES;
  window.STACKFALL_ENDLESS_CONFIG=ENDLESS;
  window.stackfallSetRunSelection=(mode,stageId=null)=>{
    if(!validMode(mode)||!['menu','gameover','stageComplete'].includes(state.mode))return false;
    if(mode===MODES.ENDLESS&&window.stackfallIsFeatureUnlocked?.('endless')===false)return false;
    const next=normalize(mode,stageId);
    if(mode===MODES.STAGE){
      if(next.mode!==MODES.STAGE)return false;
      const stage=stageById(next.stageId),status=window.stackfallStageStatus?.(stage)||stage?.status;
      if(!['available','cleared'].includes(status))return false;
    }
    state.runSelection=next;
    return true;
  };
  window.stackfallCurrentRunConfig=()=>{
    const selection=normalize(state.runSelection?.mode,state.runSelection?.stageId);
    state.runSelection=selection;
    if(selection.mode===MODES.ENDLESS)return ENDLESS;
    const stage=stageById(selection.stageId);
    return stage?Object.freeze({mode:MODES.STAGE,finite:true,randomWorldEvents:false,allEnemyFamilies:false,apexIntervalSeconds:null,stage}):ENDLESS;
  };
  window.stackfallIsEndlessRun=()=>window.stackfallCurrentRunConfig().mode===MODES.ENDLESS;
  window.stackfallIsStageRun=()=>window.stackfallCurrentRunConfig().mode===MODES.STAGE;

  if(typeof document!=='undefined'){
    // Apply the rebooted world/stage names before the player can open a stage run.
    if(!document.querySelector('script[data-world-reboot-metadata]')){
      const metadata=document.createElement('script');
      metadata.src='src/stage-world-reboot-metadata.js';
      metadata.dataset.worldRebootMetadata='true';
      document.head.appendChild(metadata);
    }
    // Stage 1 vertical-slice rework is isolated in its own late-binding script.
    // Load after legacy page-load installers so these hooks remain authoritative.
    const loadStageOneV2=()=>{
      if(document.querySelector('script[data-stage01-rework-v2]'))return;
      const script=document.createElement('script');
      script.src='src/stage01-rework-v2.js';
      script.dataset.stage01ReworkV2='true';
      document.head.appendChild(script);
    };
    if(document.readyState==='complete')setTimeout(loadStageOneV2,0);
    else window.addEventListener('load',()=>setTimeout(loadStageOneV2,0),{once:true});
  }
})();
