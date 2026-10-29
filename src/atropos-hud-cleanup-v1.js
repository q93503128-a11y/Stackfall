// Chronophage HUD cleanup: phase changes are communicated visually, not with P1/P2/P3/P4 text.
(()=>{
  if(window.stackfallAtroposHudCleanup==='v1')return;
  window.stackfallAtroposHudCleanup='v1';
  const FORM='chronophage';
  function clean(){
    const e=state?.entities?.enemies?.find?.(x=>!x?.dead&&(x.apexForm||x.eliteForm)===FORM);if(!e)return;
    const name=typeof bossName==='function'?bossName(FORM):'시간포식자 아트로포스';
    for(const row of document.querySelectorAll('#multiBossBars .multi-boss-row')){
      if(!(row.textContent||'').includes(name))continue;
      const kind=row.querySelector('span b');if(kind)kind.textContent=GAME_SETTINGS.language==='ko'?'초월체':'APEX';
    }
  }
  const baseUpdateHUD=typeof updateHUD==='function'?updateHUD:null;
  if(baseUpdateHUD)updateHUD=function updateHudWithoutAtroposPhaseText(){const result=baseUpdateHUD();clean();return result;};
  window.stackfallAtroposHudCleanupNow=clean;
  queueMicrotask(clean);
})();
