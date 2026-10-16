(()=>{
  const STAGE_ID='stage-01';
  const registry=window.stackfallStageRuntimeRegistry,base=registry?.get(STAGE_ID);
  if(!base?.production)return;
  const priorProduction=base.production;
  const production=Object.freeze({...priorProduction,
    worldStatic(){return false;},
    drawWorld(){
      // Production stages are composited over drawThemeRaw() by realm-backgrounds.
      // Draw only Stage 1's live world-space decoration here; do not redraw the
      // base galaxy. This also keeps Route Shard Sweep telegraphs camera-anchored.
      drawStageConstellationField(STAGE_ID);
    }
  });
  registry.set(STAGE_ID,Object.freeze({...base,production}));
})();
