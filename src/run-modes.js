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

  // Stage 1's base realm renderer used to borrow sprites and pose helpers from
  // the rejected production-art layer. Keep only runtime geometry compatibility;
  // no rejected visual asset or renderer is restored here.
  if(!window.FRONTIER_ART)window.FRONTIER_ART=Object.freeze({});
  if(typeof window.frontierSprite!=='function')window.frontierSprite=()=>false;
  if(typeof window.stageOneArtPose!=='function')window.stageOneArtPose=e=>{
    const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
    const kick=(age,start,amount)=>{const t=age-start;return t<0?0:amount*Math.sin(t*18)*Math.exp(-t*5.2);};
    const now=state.time||0,age=Math.max(0,now-(e.stageActionAt??-10)),open=e.stageGateCoreOpen?ease((now-(e.stageGateOpenedAt??-10))/.82):0;
    const parts=[[0,-19-open*14,124,58,-.012],[-143-open*31,31,42,78,-.13-open*.035],[140+open*28,22,44,69,.11+open*.045],[9,22+open*5,28,27,.015]];
    const wind=ease(age/.82),release=1-ease((age-1.62)/.9);
    if(e.stageAction==='salvage'){const q=wind*release;parts[2][0]-=15*q;parts[2][1]-=43*q;parts[2][4]+=.42*q;parts[1][1]+=16*q;parts[1][4]-=.12*q;parts[0][0]-=8*q;parts[0][1]+=kick(age,.82,7);}
    if(e.stageAction==='bulkhead'){const q=ease(age/.74)*(1-ease((age-2.08)/.78));parts[1][0]+=30*q;parts[2][0]-=33*q;parts[1][1]-=23*q;parts[2][1]-=19*q;parts[1][4]+=.19*q;parts[2][4]-=.17*q;parts[0][1]+=kick(age,1.28,8);}
    if(e.stageAction==='ram'){const load=ease(age/.94)*(1-ease((age-1.82)/.6));parts[0][1]+=15*load;parts[1][0]+=30*load;parts[2][0]-=27*load;parts[1][1]-=35*load;parts[2][1]-=31*load;parts[1][4]+=.25*load;parts[2][4]-=.22*load;parts[0][1]+=kick(age,1.74,10);}
    if(e.stageAction==='girder'){const q=ease(age/.84)*(1-ease((age-1.64)/.74));parts[1][0]-=13*q;parts[2][1]-=45*q;parts[2][4]-=.52*q;parts[0][0]+=kick(age,1.54,8);}
    if(e.stageEntryProgress!=null){const q=1-ease((e.stageEntryProgress-.10)/.84);parts[0][1]-=46*q;parts[1][0]-=112*q;parts[2][0]+=118*q;parts[1][1]-=58*q;parts[2][1]-=43*q;}
    if(e.stageDefeatAge!=null){const q=ease(e.stageDefeatAge/1.35);parts[1][0]-=75*q;parts[1][1]+=84*q;parts[1][4]-=.70*q;parts[2][0]+=83*q;parts[2][1]+=72*q;parts[2][4]+=.82*q;parts[3][1]+=25*q;parts[0][1]+=19*q;}
    return parts;
  };

  if(typeof document!=='undefined'&&!document.querySelector('script[data-world-reboot-metadata]')){
    const metadata=document.createElement('script');
    metadata.src='src/stage-world-reboot-metadata.js';
    metadata.dataset.worldRebootMetadata='true';
    document.head.appendChild(metadata);
  }
})();
