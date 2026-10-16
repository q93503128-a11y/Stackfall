(()=>{
  'use strict';
  if(window.__stackfallStage01EntryCopyLoaded)return;
  window.__stackfallStage01EntryCopyLoaded=true;
  const base=drawRealmCinematicOverlay;
  drawRealmCinematicOverlay=function stage01PortableEntryCopy(){
    const tr=state.realmTransition;
    if(!(window.stackfallIsStageRun?.()===true&&state.runSelection?.stageId==='stage-01'&&tr?.owner==='stage-01-boss-entry'))return base();
    const oldLanguage=GAME_SETTINGS.language,oldTitle=tr.title;
    try{
      // Canvas rendering in headless/Linux environments cannot guarantee Korean glyph fallback.
      // Keep the encounter localized everywhere else, but make the cinematic stamp portable.
      GAME_SETTINGS.language='en';
      tr.title='CLOSURE ENTITY';
      return base();
    }finally{
      GAME_SETTINGS.language=oldLanguage;
      tr.title=oldTitle;
    }
  };
  window.stackfallStage01EntryCopyDiagnostics=()=>({loaded:true,title:'CLOSURE ENTITY',subtitle:'THE BROKEN ROUTE LOCKS ITSELF'});
})();