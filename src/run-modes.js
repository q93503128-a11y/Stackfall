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
  const loadStageOnePolish=()=>{
    if(typeof document==='undefined'||document.querySelector('script[data-stackfall-stage01-polish]'))return;
    const polish=document.createElement('script');polish.src='src/stage01-polish.js';polish.dataset.stackfallStage01Polish='true';document.head.appendChild(polish);
  };
  const loadStageOneRemodel=()=>{
    if(typeof document==='undefined')return;
    const existing=document.querySelector('script[data-stackfall-stage01-remodel]');
    if(existing){if(window.stackfallStageRuntimeRegistry?.get('stage-01'))loadStageOnePolish();else existing.addEventListener('load',loadStageOnePolish,{once:true});return;}
    const script=document.createElement('script');script.src='src/stage01-remodel.js';script.dataset.stackfallStage01Remodel='true';script.addEventListener('load',loadStageOnePolish,{once:true});document.head.appendChild(script);
  };
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installStageStatusGate();loadStageOneRemodel();},{once:true});
    else{installStageStatusGate();loadStageOneRemodel();}
  }
})();
