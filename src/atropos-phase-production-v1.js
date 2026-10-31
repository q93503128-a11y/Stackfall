// Chronophage-only production phase pass.
// Scope is deliberately isolated: do not alter Omega or Last Constellation behavior here.
(()=>{
  if(window.stackfallAtroposPhaseProduction==='v1')return;
  window.stackfallAtroposPhaseProduction='v1';

  const FORM='chronophage';
  const baseDrawEliteShapeProduction=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(!baseDrawEliteShapeProduction)return;

  function isAtropos(e){return!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);}
  function phaseFromHealth(e){const h=e.hp/Math.max(1,e.maxHp);return h<.25?4:h<.50?3:h<.75?2:1;}
  function pulse(e,r=125,alpha=.34,width=2.5,color='#79ffe1'){if(typeof shockwave==='function')shockwave(e.x,e.y,color,r,alpha,width);}

  function startPhaseTransition(e,phase){
    const previous=Math.max(1,e.clockworkVisualPhase||phase-1),duration=phase===2?.92:phase===3?1.02:1.12;
    e.atroposPhaseTransition={phase,previous,age:0,duration,mid:false};
    if(e.atroposReborn)e.atroposReborn.slashCd=Math.max(e.atroposReborn.slashCd||0,1.55);
    // No PHASE text or subtitle. The player reads the state change from the clock itself.
    pulse(e,132+phase*18,.30+phase*.026,2.2+phase*.28,phase>=4?'#ffffff':'#79ffe1');
    state.camera.shake=Math.max(state.camera.shake,3.8+phase*1.1);
    state.flash=Math.max(state.flash,.036+phase*.012);
    if(typeof audio?.tone==='function')audio.tone(62+phase*12,.24,'sawtooth',.018,-10-phase*2);
  }

  function finishPhaseTransition(e,tr){
    e.clockworkVisualPhase=tr.phase;
    e.atroposPhaseTransition=null;
    e.atroposMechanicPhaseChanged=tr.phase;
    if(e.atroposReborn)e.atroposReborn.slashCd=Math.max(e.atroposReborn.slashCd||0,tr.phase>=4?1.35:1.75);
  }

  function updatePhaseTransition(e,dt){
    const tr=e.atroposPhaseTransition;if(!tr)return false;
    tr.age+=dt;
    if(e.atroposReborn)e.atroposReborn.slashCd=Math.max(e.atroposReborn.slashCd||0,.45);
    const p=Math.min(1,tr.age/Math.max(.001,tr.duration));
    if(Math.random()<dt*(4.5+tr.phase*1.5)){
      const a=Math.random()*TAU,rr=e.r*(1.15+Math.random()*.95),x=e.x+Math.cos(a)*rr,y=e.y+Math.sin(a)*rr;
      if(typeof spawnParticle==='function')spawnParticle(x,y,tr.phase>=4?'#ffffff':'#9fffea',1,32+tr.phase*8,2.2+tr.phase*.25);
    }
    if(!tr.mid&&p>=.46){
      tr.mid=true;e.clockworkVisualPhase=tr.phase;
      pulse(e,172+tr.phase*20,.36+tr.phase*.02,3.0+tr.phase*.35,tr.phase>=4?'#ffffff':'#bffdf3');
      state.camera.shake=Math.max(state.camera.shake,5.5+tr.phase*1.35);
      state.hitStop=Math.max(state.hitStop,.020+tr.phase*.004);
      state.flash=Math.max(state.flash,.052+tr.phase*.014);
      if(typeof audio?.tone==='function')audio.tone(90+tr.phase*16,.14,'square',.016,-28);
    }
    if(p>=1){finishPhaseTransition(e,tr);return false;}
    return true;
  }

  function queuePhaseTransition(e,phase){
    if(!e.atroposPhaseSeen){e.atroposPhaseSeen=phase;e.clockworkVisualPhase=phase;return;}
    if(phase<=e.atroposPhaseSeen)return;
    e.atroposPhaseSeen=phase;e.atroposPendingPhase=phase;
  }

  function maybeBeginPendingTransition(e){
    if(!e.atroposPendingPhase||e.atroposPhaseTransition)return;
    if(e.atroposReborn?.slash)return;
    const phase=e.atroposPendingPhase;e.atroposPendingPhase=null;startPhaseTransition(e,phase);
  }

  function updateAtroposProduction(e,dt){
    const phase=Math.max(1,Math.min(4,e.apexPhase||phaseFromHealth(e)));
    queuePhaseTransition(e,phase);
    maybeBeginPendingTransition(e);
    updatePhaseTransition(e,dt);
  }

  // The canonical Chronophage service owns ordering; this file contributes only phase setup/finalization.
  const atroposPhaseService=registerApexCombatService(FORM);
  atroposPhaseService.phaseBefore=function atroposPhaseBefore(e){const desired=phaseFromHealth(e);e.clockworkIdentityPhase=desired;e.clockworkEchoCd=1e9;};
  atroposPhaseService.phaseAfter=function atroposPhaseAfter(e,dt){e.clockworkEchoCd=1e9;updateAtroposProduction(e,dt);};

  function drawPhaseOverlay(e,t){
    const phase=Math.max(1,e.clockworkVisualPhase||e.apexPhase||1),tr=e.atroposPhaseTransition;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(phase>=2){
      const rr=e.r*1.73,rot=t*(phase>=4?-.050:-.028)+.44;
      ctx.rotate(rot);ctx.globalAlpha=phase===2?.24:phase===3?.31:.38;ctx.strokeStyle=phase>=4?'#eafffb':'#79ffe1';ctx.lineWidth=1.45;
      for(let seg=0;seg<6;seg++){if(seg===2||(phase>=4&&seg===5))continue;ctx.beginPath();ctx.arc(0,0,rr,seg/6*TAU+.14,(seg+1)/6*TAU-.12);ctx.stroke();}
      for(let i=0;i<12;i+=2){const a=i/12*TAU,inner=rr-e.r*.045,outer=rr+e.r*(phase>=3?.075:.055);ctx.globalAlpha=(phase===2?.20:.30)*(i%4===0?1.35:1);ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}
    }
    if(phase>=3){
      ctx.globalAlpha=phase===3?.25:.36;ctx.strokeStyle='#bffdf3';ctx.fillStyle='rgba(159,255,234,.10)';
      const count=phase>=4?6:4;
      for(let i=0;i<count;i++){const a=.35+i*TAU/count-t*(i%2?.030:-.021),rr=e.r*(1.55+(i%3)*.16),s=e.r*(.06+(i%2)*.025);ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(a+.7);ctx.beginPath();ctx.moveTo(-s,-s*.42);ctx.lineTo(s*.85,-s*.18);ctx.lineTo(s*.36,s*.52);ctx.lineTo(-s*.72,s*.34);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
      const a=t*.19+1.84;ctx.save();ctx.rotate(a);ctx.globalAlpha=phase===3?.30:.43;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.r*.52,0);ctx.lineTo(e.r*1.08,0);ctx.stroke();ctx.restore();
    }
    if(phase>=4){
      for(const side of[-1,1]){ctx.save();ctx.translate(side*e.r*.045,-side*e.r*.022);ctx.rotate(-t*.032+side*.10);ctx.globalAlpha=.24;ctx.strokeStyle=side<0?'#79ffe1':'#ffffff';ctx.lineWidth=1.25;ctx.setLineDash([e.r*.15,e.r*.11]);ctx.beginPath();ctx.arc(0,0,e.r*1.98,.18+side*.22,TAU-.32+side*.12);ctx.stroke();ctx.restore();}
      ctx.setLineDash([]);
      for(const shift of[-.16,.17]){const a=t*.31-.72+shift;ctx.save();ctx.rotate(a);ctx.globalAlpha=.16;ctx.strokeStyle=shift<0?'#79ffe1':'#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-e.r*.16,0);ctx.lineTo(e.r*1.46,0);ctx.stroke();ctx.restore();}
    }
    if(tr){
      const p=Math.min(1,tr.age/Math.max(.001,tr.duration)),wave=Math.sin(Math.PI*p),rr=e.r*(2.12-.38*p);
      ctx.globalAlpha=.20+.48*wave;ctx.strokeStyle=tr.phase>=4?'#ffffff':'#bffdf3';ctx.lineWidth=1.4+2.2*wave;ctx.setLineDash([12,8]);ctx.lineDashOffset=-t*36;ctx.beginPath();ctx.arc(0,0,rr,0,TAU);ctx.stroke();ctx.setLineDash([]);
      for(let i=0;i<12;i++){const a=i/12*TAU+(p-.5)*.16,inner=e.r*(1.15+.18*wave),outer=e.r*(1.55+.42*wave);ctx.globalAlpha=.10+.32*wave;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}
    }
    ctx.restore();
  }

  drawEliteShape=function drawEliteShapeWithAtroposPhaseProduction(e){
    if(!isAtropos(e))return baseDrawEliteShapeProduction(e);
    const actual=e.apexPhase,visual=Math.max(1,e.clockworkVisualPhase||actual||1);
    e.apexPhase=visual;
    try{baseDrawEliteShapeProduction(e);}finally{e.apexPhase=actual;}
    drawPhaseOverlay(e,e.phase||0);
  };

  window.stackfallAtroposPhaseDiagnostics=()=>{
    const e=state.entities.enemies.find(isAtropos)||null;
    return e?{
      version:window.stackfallAtroposPhaseProduction,
      phase:e.apexPhase||1,visualPhase:e.clockworkVisualPhase||e.apexPhase||1,seen:e.atroposPhaseSeen||1,pending:e.atroposPendingPhase||null,
      transition:e.atroposPhaseTransition?{phase:e.atroposPhaseTransition.phase,previous:e.atroposPhaseTransition.previous,age:e.atroposPhaseTransition.age,duration:e.atroposPhaseTransition.duration,mid:!!e.atroposPhaseTransition.mid}:null,
      attackGrammar:['space-cut','anti-idle-scar',...(e.apexPhase>=2?['clock-hand']:[]),...(e.apexPhase>=3?['time-field']:[])],
      spaceCutActive:!!e.atroposReborn?.slash,bodyParts:Array.isArray(e.bodyParts)?e.bodyParts.length:0
    }:null;
  };

  if(window.stackfallDeveloperTest?.enabled){
    window.stackfallDeveloperTest.atroposSetPhase=function atroposSetPhase(phase){
      const e=state.entities.enemies.find(isAtropos);if(!e)return false;phase=Math.max(1,Math.min(4,phase|0));e.hp=e.maxHp*({1:.95,2:.70,3:.45,4:.20}[phase]);return true;
    };
  }
})();
