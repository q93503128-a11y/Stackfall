(function(){
  const screen=document.querySelector('#abilityLedgerScreen');
  if(!screen)return;

  const compact=()=>matchMedia('(pointer:coarse)').matches||innerWidth<760;
  let lastStableMode=['playing','paused'].includes(state.mode)?state.mode:'playing';

  const style=document.createElement('style');
  style.textContent=`
    #abilityLedgerScreen{background:rgba(2,5,17,.78)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    #abilityLedgerScreen .ledger-shell{box-shadow:0 30px 90px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.06)}
  `;
  document.head.appendChild(style);

  function reconcileLedgerMode(){
    const hidden=screen.classList.contains('hidden');
    if(hidden){
      if(state.mode==='abilityView')state.mode=lastStableMode;
      if(state.mode==='playing'||state.mode==='paused')lastStableMode=state.mode;
      return;
    }

    if(state.mode==='abilityView')state.mode=lastStableMode;
    if(state.mode==='playing'||state.mode==='paused')lastStableMode=state.mode;

    if(!['playing','paused','abilityView'].includes(state.mode)){
      screen.classList.add('hidden');
      return;
    }

    if(lastStableMode==='playing'&&compact()&&!ui.hud.classList.contains('hidden'))ui.touch.classList.remove('hidden');
  }

  const observer=new MutationObserver(reconcileLedgerMode);
  observer.observe(screen,{attributes:true,attributeFilter:['class']});

  const previousSync=window.syncAbilityLedgerVisibility;
  window.syncAbilityLedgerVisibility=function syncAbilityLedgerLiveGuard(){
    reconcileLedgerMode();
    if(typeof previousSync==='function')previousSync();
    reconcileLedgerMode();
  };

  const previousClose=window.closeAbilityLedger;
  window.closeAbilityLedger=function closeAbilityLedgerLiveGuard(force=false){
    if(typeof previousClose==='function')previousClose(force);
    screen.classList.add('hidden');
    if(state.mode==='abilityView')state.mode=lastStableMode;
    if(lastStableMode==='paused')ui.pauseScreen.classList.remove('hidden');
    else if(compact()&&!ui.hud.classList.contains('hidden'))ui.touch.classList.remove('hidden');
  };

  const previousReset=window.resetAbilityLedger;
  window.resetAbilityLedger=function resetAbilityLedgerLiveGuard(){
    screen.classList.add('hidden');
    if(state.mode==='abilityView')state.mode='playing';
    lastStableMode=state.mode==='paused'?'paused':'playing';
    if(typeof previousReset==='function')previousReset();
  };

  function frameGuard(){
    reconcileLedgerMode();
    requestAnimationFrame(frameGuard);
  }
  requestAnimationFrame(frameGuard);
})();