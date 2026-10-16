(()=>{
  const MODES=Object.freeze({ENDLESS:'endless',STAGE:'stage'});
  const ACTIVE_STAGE_RUNTIMES=Object.freeze(['stage-01']);
  const ENDLESS=Object.freeze({
    mode:MODES.ENDLESS,
    finite:false,
    randomWorldEvents:true,
    allEnemyFamilies:true,
    apexIntervalSeconds:600
  });
  const validMode=mode=>mode===MODES.ENDLESS||mode===MODES.STAGE;
  const stageById=id=>typeof window.stackfallStageById==='function'?window.stackfallStageById(id):null;
  const hasStageRuntime=id=>ACTIVE_STAGE_RUNTIMES.includes(String(id||''));
  const normalize=(mode,stageId=null)=>{
    if(mode===MODES.STAGE){
      const stage=stageById(stageId);
      if(stage&&hasStageRuntime(stage.id))return{mode:MODES.STAGE,stageId:stage.id};
    }
    return{mode:MODES.ENDLESS,stageId:null};
  };
  state.runSelection=normalize(state.runSelection?.mode,state.runSelection?.stageId);
  window.STACKFALL_RUN_MODES=MODES;
  window.STACKFALL_ACTIVE_STAGE_RUNTIMES=ACTIVE_STAGE_RUNTIMES;
  window.STACKFALL_ENDLESS_CONFIG=ENDLESS;
  window.stackfallHasStageRuntime=hasStageRuntime;
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

  const installStageStatusGate=()=>{
    const baseStatus=window.stackfallStageStatus;
    if(typeof baseStatus!=='function'||baseStatus.__stackfallRuntimeGate===true)return;
    const gatedStatus=stage=>stage&&!hasStageRuntime(stage.id)?'planned':baseStatus(stage);
    gatedStatus.__stackfallRuntimeGate=true;
    window.stackfallStageStatus=gatedStatus;
    window.renderStackfallGalaxyMap?.();
  };
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installStageStatusGate,{once:true});
    else installStageStatusGate();
  }

  // Stage 1's base realm renderer used to borrow sprites from the rejected
  // production-art layer. Keep the base renderer callable while that art is
  // intentionally absent; the next approved Stage 1 art pass will own visuals.
  if(!window.FRONTIER_ART)window.FRONTIER_ART=Object.freeze({});
  if(typeof window.frontierSprite!=='function')window.frontierSprite=()=>false;

  if(typeof document!=='undefined'&&!document.querySelector('script[data-world-reboot-metadata]')){
    const metadata=document.createElement('script');
    metadata.src='src/stage-world-reboot-metadata.js';
    metadata.dataset.worldRebootMetadata='true';
    document.head.appendChild(metadata);
  }
})();
