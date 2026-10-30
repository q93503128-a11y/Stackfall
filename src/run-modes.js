(()=>{
  const MODES=Object.freeze({ENDLESS:'endless',STAGE:'stage'});
  const ACTIVE_STAGE_RUNTIMES=Object.freeze(['stage-01']);
  const ENDLESS_PROGRESSION_SCRIPTS=Object.freeze(['src/endless-progression-v2.js','src/achievement-profile-entry-v2.js','src/achievement-card-ui-rollback-v2.js','src/endless-combat-ux-fixes-v2.js']);
  const SHARED_STAGE_RUNTIME_STYLES=Object.freeze(['stage-runtime.css']);
  const SHARED_STAGE_RUNTIME_SCRIPTS=Object.freeze([
    'src/stage-constellation-backgrounds.js'
  ]);
  const STAGE_RUNTIME_SCRIPTS=Object.freeze({
    'stage-01':Object.freeze(['src/stage01-remodel.js','src/stage01-polish.js'])
  });
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
  window.STACKFALL_ENDLESS_PROGRESSION_SCRIPTS=ENDLESS_PROGRESSION_SCRIPTS;
  window.STACKFALL_SHARED_STAGE_RUNTIME_STYLES=SHARED_STAGE_RUNTIME_STYLES;
  window.STACKFALL_SHARED_STAGE_RUNTIME_SCRIPTS=SHARED_STAGE_RUNTIME_SCRIPTS;
  window.STACKFALL_STAGE_RUNTIME_SCRIPTS=STAGE_RUNTIME_SCRIPTS;
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

  const findLoadedStyle=href=>[...document.querySelectorAll('link[rel="stylesheet"]')].find(link=>link.getAttribute('href')===href)||null;
  const ensureStyle=href=>new Promise((resolve,reject)=>{
    const existing=findLoadedStyle(href);if(existing){resolve();return;}
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.stackfallStageRuntime='true';
    link.addEventListener('load',()=>resolve(),{once:true});link.addEventListener('error',()=>reject(new Error('Failed to load stage runtime stylesheet: '+href)),{once:true});document.head.appendChild(link);
  });
  const findLoadedScript=src=>[...document.scripts].find(script=>script.getAttribute('src')===src)||null;
  const ensureScript=src=>new Promise((resolve,reject)=>{
    const existing=findLoadedScript(src);
    if(existing){
      if(existing.dataset.stackfallStageRuntimeLoaded==='true'){resolve();return;}
      existing.addEventListener('load',()=>{existing.dataset.stackfallStageRuntimeLoaded='true';resolve();},{once:true});
      existing.addEventListener('error',()=>reject(new Error('Failed to load stage runtime script: '+src)),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.src=src;
    script.dataset.stackfallStageRuntime='true';
    script.addEventListener('load',()=>{script.dataset.stackfallStageRuntimeLoaded='true';resolve();},{once:true});
    script.addEventListener('error',()=>reject(new Error('Failed to load stage runtime script: '+src)),{once:true});
    document.head.appendChild(script);
  });
  const loadEndlessProgression=async()=>{
    for(const src of ENDLESS_PROGRESSION_SCRIPTS)await ensureScript(src);
  };
  const loadActiveStageRuntimes=async()=>{
    for(const href of SHARED_STAGE_RUNTIME_STYLES)await ensureStyle(href);
    for(const src of SHARED_STAGE_RUNTIME_SCRIPTS)await ensureScript(src);
    for(const stageId of ACTIVE_STAGE_RUNTIMES){
      const scripts=STAGE_RUNTIME_SCRIPTS[stageId]||[];
      for(const src of scripts)await ensureScript(src);
    }
    window.renderStackfallGalaxyMap?.();
  };
  const boot=()=>{
    installStageStatusGate();
    loadEndlessProgression().catch(error=>{
      console.error(error);
      window.stackfallRuntimeDiagnostics?.('endless-progression-loader',error);
    });
    loadActiveStageRuntimes().catch(error=>{
      console.error(error);
      window.stackfallRuntimeDiagnostics?.('stage-runtime-loader',error);
    });
  };
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }
})();