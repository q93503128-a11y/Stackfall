// Apex entry camera reveal.
// During the existing apex-entry cinematic the camera pans to the manifestation point,
// the Apex appears at a safe distance, then the camera returns to the player before combat resumes.
(()=>{
  if(window.stackfallApexEntryCamera==='v1')return;
  window.stackfallApexEntryCamera='v1';

  const camera={active:false,realX:0,realY:0,camX:0,camY:0,mix:0,form:null,serial:null,focusX:0,focusY:0,focusLocked:false};
  const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const entryProgress=tr=>clamp((Number(tr?.elapsed)||0)/Math.max(.001,Number(tr?.duration)||1),0,1);
  function entryTransition(){const tr=state.realmTransition;return tr?.owner==='apex-entry'?tr:null;}
  function entryForm(tr){return state.apexArena?.form||state.pendingApexForm||tr?.form||null;}
  function manifestationPoint(form,arena){
    if(!arena)return{x:player.x,y:player.y};
    const r=Math.max(260,Number(arena.r)||486);
    if(form==='chronophage')return{x:arena.x,y:arena.y-r*.62};
    if(form==='starforge')return{x:arena.x+r*.54,y:arena.y-r*.28};
    return{x:arena.x-r*.60,y:arena.y+r*.12};
  }
  function panMix(tr){
    const p=entryProgress(tr);
    if(p<.26)return ease(p/.26);
    if(p<.72)return 1;
    return 1-ease((p-.72)/.28);
  }
  function findApex(){return state.entities.enemies?.find(e=>!e?.dead&&(e.kind==='apex'||e.apexForm))||null;}
  function placeBossSafely(form,arena){
    const e=findApex();if(!e||e.apexEntryCameraPlaced)return e;
    const p=manifestationPoint(form,arena);
    e.x=p.x;e.y=p.y;e.speed=Math.max(0,Number(e.speed)||0);
    e.contactSafeUntil=Math.max(Number(e.contactSafeUntil)||0,(state.time||0)+2.25);
    if(form==='chronophage'&&e.atroposReborn){
      e.atroposReborn.anchorX=p.x;e.atroposReborn.anchorY=p.y;e.speed=0;
    }
    e.apexEntryCameraPlaced=true;e.apexEntryManifestX=p.x;e.apexEntryManifestY=p.y;e.apexEntryRevealStarted=false;
    return e;
  }
  function resetCameraForTransition(tr,form,arena){
    const serial=tr?.serial??tr?.startedAt??tr;
    if(camera.serial===serial)return;
    camera.serial=serial;camera.form=form;camera.focusLocked=false;
    if(arena&&form){const p=manifestationPoint(form,arena);camera.focusX=p.x;camera.focusY=p.y;camera.focusLocked=true;}
  }
  function resolvedFocus(form,arena,realX,realY){
    if(!camera.focusLocked&&arena&&form){const p=manifestationPoint(form,arena);camera.focusX=p.x;camera.focusY=p.y;camera.focusLocked=true;}
    return camera.focusLocked?{x:camera.focusX,y:camera.focusY}:{x:realX,y:realY};
  }
  function bossShouldRender(tr,e,mix){
    if(!e)return false;
    if(e.apexEntryRevealStarted)return true;
    // Do not expose the entity during the first frames of creation. Reveal once the camera is
    // already settled on the manifestation point, then keep it visible for the rest of the scene.
    if(entryProgress(tr)>=.30&&mix>=.985){e.apexEntryRevealStarted=true;return true;}
    return false;
  }
  function renderWithoutBoss(boss,action){
    const list=state.entities?.enemies;
    if(!boss||!Array.isArray(list))return action();
    const index=list.indexOf(boss);if(index<0)return action();
    list.splice(index,1);
    try{return action();}finally{list.splice(Math.min(index,list.length),0,boss);}
  }

  const baseDraw=typeof draw==='function'?draw:null;
  if(baseDraw){
    draw=function drawWithApexEntryCamera(){
      const tr=entryTransition();
      if(!tr){camera.active=false;camera.mix=0;camera.form=null;camera.serial=null;camera.focusLocked=false;return baseDraw();}
      const arena=state.apexArena,form=entryForm(tr),realX=player.x,realY=player.y;
      resetCameraForTransition(tr,form,arena);
      const focus=resolvedFocus(form,arena,realX,realY),mix=panMix(tr),boss=placeBossSafely(form,arena),showBoss=bossShouldRender(tr,boss,mix);
      camera.active=mix>.001;camera.realX=realX;camera.realY=realY;camera.camX=lerp(realX,focus.x,mix);camera.camY=lerp(realY,focus.y,mix);camera.mix=mix;camera.form=form;
      const render=()=>{
        if(!camera.active)return baseDraw();
        player.x=camera.camX;player.y=camera.camY;
        try{return baseDraw();}finally{player.x=realX;player.y=realY;camera.active=false;}
      };
      return showBoss?render():renderWithoutBoss(boss,render);
    };
  }

  const baseDrawPlayer=typeof drawPlayer==='function'?drawPlayer:null;
  if(baseDrawPlayer){
    drawPlayer=function drawPlayerWithApexEntryCamera(){
      if(!camera.active)return baseDrawPlayer();
      ctx.save();ctx.translate(camera.realX-camera.camX,camera.realY-camera.camY);
      try{return baseDrawPlayer();}finally{ctx.restore();}
    };
  }

  // Reinforce the safe spawn position each cinematic frame after the midpoint has created the boss.
  const raf=()=>{
    const tr=entryTransition();if(tr){const form=entryForm(tr),arena=state.apexArena,e=placeBossSafely(form,arena);if(e&&form==='chronophage'&&e.atroposReborn&&e.apexEntryManifestX!=null){e.atroposReborn.anchorX=e.apexEntryManifestX;e.atroposReborn.anchorY=e.apexEntryManifestY;e.x=e.apexEntryManifestX;e.y=e.apexEntryManifestY;}}
    requestAnimationFrame(raf);
  };requestAnimationFrame(raf);

  window.stackfallApexEntryCameraDiagnostics=()=>{const tr=entryTransition(),arena=state.apexArena,form=entryForm(tr),e=findApex();return{version:'v1',active:!!tr,form,mix:tr?panMix(tr):0,progress:tr?entryProgress(tr):0,focus:camera.focusLocked?{x:camera.focusX,y:camera.focusY}:manifestationPoint(form,arena),boss:e?{x:e.x,y:e.y,safeUntil:e.contactSafeUntil||0,placed:!!e.apexEntryCameraPlaced,revealed:!!e.apexEntryRevealStarted}:null};};
})();
