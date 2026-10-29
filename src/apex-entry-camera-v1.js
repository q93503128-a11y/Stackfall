// Apex entry camera reveal.
// During the existing apex-entry cinematic the camera pans to the manifestation point,
// the Apex appears at a safe distance, then the camera returns to the player before combat resumes.
(()=>{
  if(window.stackfallApexEntryCamera==='v1')return;
  window.stackfallApexEntryCamera='v1';

  const camera={active:false,realX:0,realY:0,camX:0,camY:0,mix:0,form:null};
  const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const lerp=(a,b,t)=>a+(b-a)*t;
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
    const p=clamp((Number(tr?.elapsed)||0)/Math.max(.001,Number(tr?.duration)||1),0,1);
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
    e.apexEntryCameraPlaced=true;e.apexEntryManifestX=p.x;e.apexEntryManifestY=p.y;
    return e;
  }

  const baseDraw=typeof draw==='function'?draw:null;
  if(baseDraw){
    draw=function drawWithApexEntryCamera(){
      const tr=entryTransition();
      if(!tr){camera.active=false;camera.mix=0;camera.form=null;return baseDraw();}
      const arena=state.apexArena,form=entryForm(tr),focus=manifestationPoint(form,arena),mix=panMix(tr),realX=player.x,realY=player.y;
      placeBossSafely(form,arena);
      camera.active=mix>.001;camera.realX=realX;camera.realY=realY;camera.camX=lerp(realX,focus.x,mix);camera.camY=lerp(realY,focus.y,mix);camera.mix=mix;camera.form=form;
      if(!camera.active)return baseDraw();
      player.x=camera.camX;player.y=camera.camY;
      try{return baseDraw();}finally{player.x=realX;player.y=realY;camera.active=false;}
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

  window.stackfallApexEntryCameraDiagnostics=()=>{const tr=entryTransition(),arena=state.apexArena,form=entryForm(tr);return{version:'v1',active:!!tr,form,mix:tr?panMix(tr):0,focus:manifestationPoint(form,arena),boss:(()=>{const e=findApex();return e?{x:e.x,y:e.y,safeUntil:e.contactSafeUntil||0,placed:!!e.apexEntryCameraPlaced}:null;})()};};
})();
