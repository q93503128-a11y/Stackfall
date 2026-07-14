const sf2ActiveOnlyUpdateEffects=updateEffects;
updateEffects=function updateEffectsWithoutPausedCurveDamage(dt){
  if(state.mode==='playing'){
    sf2ActiveOnlyUpdateEffects(dt);
    return;
  }
  const heldCurves=state.entities.curves;
  state.entities.curves=[];
  sf2ActiveOnlyUpdateEffects(dt);
  state.entities.curves=heldCurves;
};
