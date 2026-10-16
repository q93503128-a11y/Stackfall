(()=>{
  'use strict';
  if(window.__stackfallStage01VisualRebootLoaded)return;
  window.__stackfallStage01VisualRebootLoaded=true;

  // Stage 1 production combat/art is owned by stage01-complete.js and
  // stage01-closure-art.js. This file remains only because the loader chain
  // predates those modules; it must not restore any discarded frontier/CAD art.
  const baseStageConstellationField=window.drawStageConstellationField;
  if(typeof baseStageConstellationField==='function'){
    window.drawStageConstellationField=function stage01CompatibilityField(theme){
      if(String(theme||'')==='stage-01'){
        const production=window.stackfallStageProduction?.('stage-01');
        if(production?.drawWorld){production.drawWorld();return;}
        if(typeof drawSpaceBackground==='function'){drawSpaceBackground();return;}
      }
      return baseStageConstellationField.apply(this,arguments);
    };
  }

  window.stackfallStage01RebootDiagnostics=()=>({
    style:'compatibility-shim',
    liveOwner:'stage01-complete+stage01-closure-art',
    discardedFrontierArt:false
  });
})();
