// Apex entry camera reveal.
// During the existing apex-entry cinematic the camera pans to the manifestation point,
// pressure builds before the reveal, the Apex appears at a safe distance, then the camera returns.
(()=>{
  if(window.stackfallApexEntryCamera==='v1')return;
  window.stackfallApexEntryCamera='v1';

  const camera={active:false,realX:0,realY:0,camX:0,camY:0,mix:0,form:null,serial:null,focusX:0,focusY:0,focusLocked:false,buildupPlayed:false,impactPlayed:false,noticeTouched:false};
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
    e.apexEntryCameraPlaced=true;e.apexEntryManifestX=p.x;e.apexEntryManifestY=p.y;e.apexEntryRevealStarted=false;e.apexEntryRevealStartedAt=null;e.apexEntryRevealImpactPlayed=false;
    return e;
  }
  function resetCameraForTransition(tr,form,arena){
    const serial=tr?.serial??tr?.startedAt??tr;
    if(camera.serial===serial)return;
    camera.serial=serial;camera.form=form;camera.focusLocked=false;camera.buildupPlayed=false;camera.impactPlayed=false;
    if(arena&&form){const p=manifestationPoint(form,arena);camera.focusX=p.x;camera.focusY=p.y;camera.focusLocked=true;}
  }
  function resolvedFocus(form,arena,realX,realY){
    if(!camera.focusLocked&&arena&&form){const p=manifestationPoint(form,arena);camera.focusX=p.x;camera.focusY=p.y;camera.focusLocked=true;}
    return camera.focusLocked?{x:camera.focusX,y:camera.focusY}:{x:realX,y:realY};
  }
  function revealColor(form){return form==='chronophage'?'#79ffe1':form==='starforge'?'#ffb04e':'#b7c9ff';}
  function syncEntryNotice(tr){
    const el=ui?.bossNotice,kicker=ui?.bossNoticeKicker?.textContent||'';
    if(!el||!String(kicker).includes('APEX'))return;
    const p=entryProgress(tr);camera.noticeTouched=true;
    el.style.transition='opacity 220ms ease-out';
    if(p<.72){el.classList.remove('hidden');el.style.opacity='1';}
    else if(p<.90){el.classList.remove('hidden');el.style.opacity=String(clamp(1-(p-.72)/.18,0,1));}
    else el.style.opacity='0';
  }
  function clearEntryNotice(){
    if(!camera.noticeTouched)return;const el=ui?.bossNotice;
    if(el){el.classList.add('hidden');el.style.opacity='';el.style.transition='';}
    camera.noticeTouched=false;
  }
  function updateRevealPressure(tr,boss,form,mix){
    const p=entryProgress(tr);
    if(p>=.20&&p<.30&&mix>.72){
      const q=clamp((p-.20)/.10,0,1);
      state.camera.shake=Math.max(state.camera.shake,11.2+q*3.0+Math.sin(performance.now()/38)*.65);
      if(!camera.buildupPlayed){camera.buildupPlayed=true;if(typeof audio?.tone==='function'){audio.tone(34,.42,'sawtooth',.021,8);audio.tone(68,.26,'sine',.010,-18);}}
    }
    if(!boss?.apexEntryRevealStarted)return;
    if(!camera.impactPlayed){
      camera.impactPlayed=true;boss.apexEntryRevealImpactPlayed=true;
      state.camera.shake=Math.max(state.camera.shake,15.5);state.flash=Math.max(state.flash,.035);
      if(typeof shockwave==='function')shockwave(boss.x,boss.y,revealColor(form),128,.38,3.2);
      if(typeof audio?.tone==='function'){audio.tone(46,.28,'sawtooth',.034,-14);audio.tone(92,.16,'square',.014,-28);}
    }
  }
  function bossShouldRender(tr,e,mix){
    if(!e)return false;
    if(e.apexEntryRevealStarted)return true;
    if(entryProgress(tr)>=.30&&mix>=.985){e.apexEntryRevealStarted=true;e.apexEntryRevealStartedAt=performance.now();return true;}
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
      if(!tr){clearEntryNotice();camera.active=false;camera.mix=0;camera.form=null;camera.serial=null;camera.focusLocked=false;return baseDraw();}
      const arena=state.apexArena,form=entryForm(tr),realX=player.x,realY=player.y;
      resetCameraForTransition(tr,form,arena);syncEntryNotice(tr);
      const focus=resolvedFocus(form,arena,realX,realY),mix=panMix(tr),boss=placeBossSafely(form,arena),showBoss=bossShouldRender(tr,boss,mix);
      updateRevealPressure(tr,boss,form,mix);
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

  const raf=()=>{
    const tr=entryTransition();if(tr){const form=entryForm(tr),arena=state.apexArena,e=placeBossSafely(form,arena);if(e&&form==='chronophage'&&e.atroposReborn&&e.apexEntryManifestX!=null){e.atroposReborn.anchorX=e.apexEntryManifestX;e.atroposReborn.anchorY=e.apexEntryManifestY;e.x=e.apexEntryManifestX;e.y=e.apexEntryManifestY;}}
    requestAnimationFrame(raf);
  };requestAnimationFrame(raf);

  window.stackfallApexEntryCameraDiagnostics=()=>{const tr=entryTransition(),arena=state.apexArena,form=entryForm(tr),e=findApex();return{version:'v1',active:!!tr,form,mix:tr?panMix(tr):0,progress:tr?entryProgress(tr):0,focus:camera.focusLocked?{x:camera.focusX,y:camera.focusY}:manifestationPoint(form,arena),buildupPlayed:camera.buildupPlayed,impactPlayed:camera.impactPlayed,boss:e?{x:e.x,y:e.y,safeUntil:e.contactSafeUntil||0,placed:!!e.apexEntryCameraPlaced,revealed:!!e.apexEntryRevealStarted,revealStartedAt:e.apexEntryRevealStartedAt||null}:null};};
})();
