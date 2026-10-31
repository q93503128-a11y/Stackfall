(()=>{
  const MODES=Object.freeze({ENDLESS:'endless',STAGE:'stage'});
  const ACTIVE_STAGE_RUNTIMES=Object.freeze([]);
  const ENDLESS_PROGRESSION_SCRIPTS=Object.freeze(['src/endless-progression-v2.js','src/achievement-profile-entry-v2.js','src/achievement-card-ui-rollback-v2.js']);
  const ENDLESS_SYSTEM_SCRIPTS=Object.freeze(['src/enemy-director-v1.js','src/event-guide-refinement-v1.js']);
  const SHARED_STAGE_RUNTIME_STYLES=Object.freeze([]);
  const SHARED_STAGE_RUNTIME_SCRIPTS=Object.freeze([]);
  const STAGE_RUNTIME_SCRIPTS=Object.freeze({});
  const ENDLESS=Object.freeze({
    mode:MODES.ENDLESS,
    finite:false,
    randomWorldEvents:true,
    allEnemyFamilies:true,
    apexIntervalSeconds:600
  });
  const normalize=()=>({mode:MODES.ENDLESS,stageId:null});
  state.runSelection=normalize();
  window.STACKFALL_RUN_MODES=MODES;
  window.STACKFALL_STAGE_MODE_ENABLED=false;
  window.STACKFALL_ACTIVE_STAGE_RUNTIMES=ACTIVE_STAGE_RUNTIMES;
  window.STACKFALL_ENDLESS_PROGRESSION_SCRIPTS=ENDLESS_PROGRESSION_SCRIPTS;
  window.STACKFALL_ENDLESS_SYSTEM_SCRIPTS=ENDLESS_SYSTEM_SCRIPTS;
  window.STACKFALL_SHARED_STAGE_RUNTIME_STYLES=SHARED_STAGE_RUNTIME_STYLES;
  window.STACKFALL_SHARED_STAGE_RUNTIME_SCRIPTS=SHARED_STAGE_RUNTIME_SCRIPTS;
  window.STACKFALL_STAGE_RUNTIME_SCRIPTS=STAGE_RUNTIME_SCRIPTS;
  window.STACKFALL_ENDLESS_CONFIG=ENDLESS;
  window.stackfallHasStageRuntime=()=>false;
  window.stackfallSetRunSelection=(mode)=>{
    if(mode!==MODES.ENDLESS||!['menu','gameover','stageComplete'].includes(state.mode))return false;
    if(window.stackfallIsFeatureUnlocked?.('endless')===false)return false;
    state.runSelection=normalize();
    return true;
  };
  window.stackfallCurrentRunConfig=()=>{
    state.runSelection=normalize();
    return ENDLESS;
  };
  window.stackfallIsEndlessRun=()=>true;
  window.stackfallIsStageRun=()=>false;

  const installStageStatusGate=()=>{
    const baseStatus=window.stackfallStageStatus;
    if(typeof baseStatus!=='function'||baseStatus.__stackfallRuntimeGate===true)return;
    const gatedStatus=()=> 'planned';
    gatedStatus.__stackfallRuntimeGate=true;
    window.stackfallStageStatus=gatedStatus;
    window.renderStackfallGalaxyMap?.();
  };

  const findLoadedScript=src=>[...document.scripts].find(script=>script.getAttribute('src')===src)||null;
  const ensureScript=src=>new Promise((resolve,reject)=>{
    const existing=findLoadedScript(src);
    if(existing){
      if(existing.dataset.stackfallStageRuntimeLoaded==='true'){resolve();return;}
      existing.addEventListener('load',()=>{existing.dataset.stackfallStageRuntimeLoaded='true';resolve();},{once:true});
      existing.addEventListener('error',()=>reject(new Error('Failed to load Endless runtime script: '+src)),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.src=src;
    script.dataset.stackfallStageRuntime='true';
    script.addEventListener('load',()=>{script.dataset.stackfallStageRuntimeLoaded='true';resolve();},{once:true});
    script.addEventListener('error',()=>reject(new Error('Failed to load Endless runtime script: '+src)),{once:true});
    document.head.appendChild(script);
  });
  const loadEndlessRuntime=async()=>{
    for(const src of ENDLESS_PROGRESSION_SCRIPTS)await ensureScript(src);
    for(const src of ENDLESS_SYSTEM_SCRIPTS)await ensureScript(src);
  };
  const boot=()=>{
    installStageStatusGate();
    loadEndlessRuntime().catch(error=>{
      console.error(error);
      window.stackfallRuntimeDiagnostics?.('endless-runtime-loader',error);
    });
  };
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }
})();