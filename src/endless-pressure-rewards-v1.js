(()=>{
  'use strict';
  if(window.stackfallEndlessPressureRewardsV1==='v1')return;
  window.stackfallEndlessPressureRewardsV1='v1';

  const DESKTOP_ENEMY_CAP=136,DESKTOP_NORMAL_TARGET_CAP=124;
  const baseEntityCap=entityCap;
  entityCap=function endlessPressureEntityCap(kind){
    if(kind==='enemies'&&typeof compactDevice==='function'&&!compactDevice())return DESKTOP_ENEMY_CAP;
    return baseEntityCap(kind);
  };
  window.stackfallDesktopEnemyCap=DESKTOP_ENEMY_CAP;

  function pressureRuntime(){
    let rt=state.endlessPressureV1;
    if(!rt||rt.runSerial!==state.runSerial)rt=state.endlessPressureV1={runSerial:state.runSerial,overflowCd:.25,overflowSpawned:0};
    return rt;
  }
  function desiredTarget(profile,time=state.time||0){
    if(!profile||compactDevice()||profile.boss||time<900)return profile?.target||0;
    const normalCap=Math.max(24,entityCap('enemies')-7);
    let extra;
    if(time<1200)extra=Math.floor((time-900)/30);
    else extra=12+Math.floor((time-1200)/180)*4;
    return Math.min(normalCap,DESKTOP_NORMAL_TARGET_CAP,(profile.target||0)+Math.max(0,extra));
  }
  function liveNormalCount(){let count=0;for(const enemy of state.entities.enemies)if(enemy&&!enemy.dead&&enemy.kind==='normal'&&!enemy.eventKind)count++;return count;}

  function installDirectorPressure(){
    const baseDirector=window.stackfallEnemyDirectorV1;
    if(!baseDirector?.updateSpawning)return false;
    if(baseDirector.__stackfallPressureV1)return true;
    function updatePressureSpawning(dt){
      const result=baseDirector.updateSpawning(dt),profile=baseDirector.profile(),time=state.time||0,target=desiredTarget(profile,time);
      if(compactDevice()||profile?.boss||time<900)return result;
      const rt=pressureRuntime();rt.overflowCd-=dt;let live=liveNormalCount();
      if(rt.overflowCd<=0&&live<target){
        const deficit=target-live,batch=Math.min(deficit,deficit>=12?2:1);let spawned=0;
        for(let i=0;i<batch;i++){const enemy=spawnEnemy('normal');if(!enemy)break;enemy.endlessPressureOverflow=true;spawned++;live++;}
        rt.overflowSpawned+=spawned;
        rt.overflowCd=spawned?Math.max(.14,.27-Math.min(.08,(time-900)/9000)):.20;
      }else if(rt.overflowCd<=0)rt.overflowCd=.18;
      return result;
    }
    function pressureProfile(){const base=baseDirector.profile();return{...base,baseTarget:base.target,target:desiredTarget(base,state.time||0),swarmExtended:true};}
    function pressureSnapshot(){const snapshot=baseDirector.snapshot?.()||{},profile=pressureProfile(),rt=pressureRuntime();return{...snapshot,baseTarget:profile.baseTarget,target:profile.target,swarmExtended:true,desktopEnemyCap:DESKTOP_ENEMY_CAP,overflowSpawned:rt.overflowSpawned};}
    const extended=Object.freeze({...baseDirector,version:`${baseDirector.version}+pressure-v1`,__stackfallPressureV1:true,updateSpawning:updatePressureSpawning,profile:pressureProfile,snapshot:pressureSnapshot});
    window.stackfallEnemyDirectorV1=extended;
    window.stackfallEnemyDirectorProfile=pressureProfile;
    window.stackfallEnemyDirectorSnapshot=pressureSnapshot;
    return true;
  }

  function grantDreadnoughtBonus(){
    const granted=Math.max(0,Number(window.stackfallGrantCurrency?.('coreShard',1))||0);
    if(granted){
      state.runCurrencyEarned=state.runCurrencyEarned||{stardust:0,coreShard:0};
      state.runCurrencyEarned.coreShard=(state.runCurrencyEarned.coreShard||0)+granted;
      const prompt=document.querySelector('#worldEventPrompt');
      if(prompt)prompt.textContent=GAME_SETTINGS.language==='ko'?`기함 격파 보너스: 코어 조각 +${granted} · 하나를 선택하세요`:`Dreadnought bonus: Core Shard +${granted} · Choose one`;
      updateHUD?.();
    }
    return granted;
  }
  function dreadnoughtCompletionReady(ev){
    if(!ev||ev.type!=='crash'||ev.dreadnought!==true||ev.__dreadnoughtBonusGranted)return false;
    if(!Array.isArray(ev.waves)||ev.wave<ev.waves.length-1||ev.remaining>0)return false;
    return !state.entities.enemies.some(enemy=>enemy&&!enemy.dead&&enemy.eventKind==='crash');
  }
  function installDreadnoughtReward(){
    const baseUpdateMapEvents=window.updateMapEvents;
    if(typeof baseUpdateMapEvents!=='function')return false;
    if(baseUpdateMapEvents.__stackfallDreadnoughtRewardV1)return true;
    const wrapped=function updateMapEventsWithDreadnoughtBonus(dt){
      const event=state.mapEventActive,completionReady=dreadnoughtCompletionReady(event);
      const result=baseUpdateMapEvents(dt);
      if(completionReady&&state.mapEventActive!==event&&state.mode==='worldEvent'){
        event.__dreadnoughtBonusGranted=true;
        grantDreadnoughtBonus();
      }
      return result;
    };
    wrapped.__stackfallDreadnoughtRewardV1=true;
    window.updateMapEvents=wrapped;
    try{updateMapEvents=wrapped;}catch{}
    return true;
  }
  function installRuntimeExtensions(){
    const director=installDirectorPressure(),dreadnought=installDreadnoughtReward();
    window.stackfallEndlessPressureInstallState={director,dreadnought};
    return director&&dreadnought;
  }

  installRuntimeExtensions();
  if(document.readyState==='complete')queueMicrotask(installRuntimeExtensions);
  else window.addEventListener('load',installRuntimeExtensions,{once:true});

  window.stackfallEndlessPressureDiagnostics=()=>{
    installRuntimeExtensions();
    return{version:'v1',desktopEnemyCap:DESKTOP_ENEMY_CAP,normalTargetCap:DESKTOP_NORMAL_TARGET_CAP,compactUnchanged:compactDevice(),installState:{...window.stackfallEndlessPressureInstallState},director:window.stackfallEnemyDirectorSnapshot?.()||null,dreadnoughtBonus:'coreShard:1'};
  };
})();
