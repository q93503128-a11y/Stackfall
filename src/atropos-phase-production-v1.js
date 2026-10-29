// Chronophage-only production phase pass.
// Scope is deliberately isolated: do not alter Omega or Last Constellation behavior here.
(()=>{
  if(window.stackfallAtroposPhaseProduction==='v1')return;
  window.stackfallAtroposPhaseProduction='v1';

  const FORM='chronophage';
  const PHASE_NAMES={1:'CLOCKWORK',2:'TEMPORAL ECHO',3:'SPLIT TIMELINE',4:'CAUSALITY REVERSED'};
  const baseApexBossSkillProduction=typeof apexBossSkill==='function'?apexBossSkill:null;
  const baseDrawEliteShapeProduction=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(!baseApexBossSkillProduction||!baseDrawEliteShapeProduction)return;

  function isAtropos(e){return!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);}
  function phaseFromHealth(e){const h=e.hp/Math.max(1,e.maxHp);return h<.25?4:h<.50?3:h<.75?2:1;}
  function historyPoint(e,back){const h=e.clockworkPlayerHistory||[];return h[Math.max(0,h.length-1-back)]||{x:player.x,y:player.y};}
  function scar(e,p,r,damage,life,angle,color='#9fffea'){if(typeof chronophageScar==='function')chronophageScar(p.x,p.y,r,damage,color,life,angle);}
  function safeLater(e,delay,fn){if(typeof bossLater==='function')bossLater(e,delay,fn);else setTimeout(()=>{if(!e.dead)fn();},delay);}
  function pulse(e,r=125,alpha=.34,width=2.5,color='#79ffe1'){if(typeof shockwave==='function')shockwave(e.x,e.y,color,r,alpha,width);}

  // P2: replay two positions the player occupied roughly 1-2 seconds ago.
  function fireTemporalEcho(e,showcase=false){
    const pOld=historyPoint(e,10),pRecent=historyPoint(e,5),d=Math.max(6,e.damage*(showcase?.18:.22)),base=(e.phase||0)*.10;
    scar(e,pOld,56,d,.88,base-.42,'#79ffe1');
    safeLater(e,190,()=>scar(e,pRecent,62,d*.92,.76,base+.58,'#bffdf3'));
    pulse(e,84,.20,1.7,'#79ffe1');
    e.atroposLastPattern='temporal-echo';
  }

  // P3: present and past timelines intersect at a derived midpoint instead of merely adding density.
  function fireSplitTimeline(e,showcase=false){
    const past=historyPoint(e,12),now={x:player.x,y:player.y},mid={x:(past.x+now.x)*.5,y:(past.y+now.y)*.5};
    const dx=now.x-past.x,dy=now.y-past.y,a=Math.atan2(dy,dx),perp=a+Math.PI*.5,d=Math.max(6,e.damage*(showcase?.17:.21));
    scar(e,past,60,d*.82,.92,a-.24,'#79ffe1');
    safeLater(e,170,()=>scar(e,now,58,d,.74,perp+.18,'#e7fffb'));
    safeLater(e,330,()=>scar(e,mid,72,d*.76,.66,a+Math.PI*.78,'#aaffef'));
    pulse(e,102,.24,2.0,'#aaffef');
    e.atroposLastPattern='split-timeline';
  }

  // P4: warnings are authored oldest -> newest, but their lifetimes make them resolve newest -> oldest.
  // This is the phase's core rule change; warning readability remains intact even though causality flips.
  function fireCausalityReversal(e,showcase=false){
    const points=[historyPoint(e,15),historyPoint(e,10),historyPoint(e,5),{x:player.x,y:player.y}],
      lives=[1.36,1.08,.78,.50],d=Math.max(6,e.damage*(showcase?.14:.18)),base=(e.phase||0)*.09;
    points.forEach((p,i)=>safeLater(e,i*120,()=>{
      const angle=base+i*.71+(i%2?Math.PI*.28:-Math.PI*.18);
      scar(e,p,56+i*4,d*(.82+i*.05),lives[i],angle,i===3?'#ffffff':i%2?'#bffdf3':'#79ffe1');
    }));
    pulse(e,118,.30,2.4,'#dffff9');
    e.atroposLastPattern='causality-reversal';
  }

  function availablePatterns(phase){
    if(phase<=1)return[];
    if(phase===2)return['temporal-echo'];
    if(phase===3)return['temporal-echo','split-timeline'];
    return['temporal-echo','split-timeline','causality-reversal'];
  }
  function firePatternByName(e,name,showcase=false){
    if(name==='temporal-echo')return fireTemporalEcho(e,showcase);
    if(name==='split-timeline')return fireSplitTimeline(e,showcase);
    if(name==='causality-reversal')return fireCausalityReversal(e,showcase);
  }

  function startPhaseTransition(e,phase){
    const previous=Math.max(1,e.clockworkVisualPhase||phase-1);
    e.atroposPhaseTransition={phase,previous,age:0,duration:1.12,mid:false,showcaseQueued:false};
    e.atroposPatternCd=99;
    if(e.atroposReborn)e.atroposReborn.slashCd=Math.max(e.atroposReborn.slashCd||0,1.55);
    if(typeof showBossNotice==='function')showBossNotice((typeof bossName==='function'?bossName(FORM):'시간포식자 아트로포스')+' · PHASE '+phase,PHASE_NAMES[phase]);
    pulse(e,126+phase*16,.34+phase*.025,2.4+phase*.25,'#79ffe1');
    state.camera.shake=Math.max(state.camera.shake,4.5+phase*1.2);
    state.flash=Math.max(state.flash,.045+phase*.012);
    if(typeof audio?.tone==='function')audio.tone(64+phase*11,.26,'sawtooth',.020,-12);
  }

  function finishPhaseTransition(e,tr){
    e.clockworkVisualPhase=tr.phase;
    e.atroposPhaseTransition=null;
    e.atroposPatternCd=tr.phase===2?5.3:tr.phase===3?4.8:4.4;
    if(e.atroposReborn)e.atroposReborn.slashCd=Math.max(e.atroposReborn.slashCd||0,2.05);
    safeLater(e,180,()=>{
      if(e.dead)return;
      if(tr.phase===2)fireTemporalEcho(e,true);
      else if(tr.phase===3)fireSplitTimeline(e,true);
      else fireCausalityReversal(e,true);
    });
  }

  function updatePhaseTransition(e,dt){
    const tr=e.atroposPhaseTransition;if(!tr)return false;
    tr.age+=dt;
    if(e.atroposReborn)e.atroposReborn.slashCd=Math.max(e.atroposReborn.slashCd||0,.45);
    const p=Math.min(1,tr.age/tr.duration);
    if(Math.random()<dt*(5+tr.phase*1.5)){
      const a=Math.random()*TAU,rr=e.r*(1.15+Math.random()*.85),x=e.x+Math.cos(a)*rr,y=e.y+Math.sin(a)*rr;
      if(typeof spawnParticle==='function')spawnParticle(x,y,tr.phase>=4?'#ffffff':'#9fffea',1,34+tr.phase*8,2.3+tr.phase*.25);
    }
    if(!tr.mid&&p>=.46){
      tr.mid=true;e.clockworkVisualPhase=tr.phase;
      pulse(e,168+tr.phase*20,.42,3.2+tr.phase*.35,tr.phase>=4?'#ffffff':'#bffdf3');
      state.camera.shake=Math.max(state.camera.shake,6+tr.phase*1.5);
      state.hitStop=Math.max(state.hitStop,.025+tr.phase*.004);
      state.flash=Math.max(state.flash,.065+tr.phase*.016);
      if(typeof audio?.tone==='function')audio.tone(92+tr.phase*16,.16,'square',.018,-28);
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
    // Let a committed space-cut finish. The new phase begins on a clean combat beat.
    if(e.atroposReborn?.slash)return;
    const phase=e.atroposPendingPhase;e.atroposPendingPhase=null;startPhaseTransition(e,phase);
  }

  function updatePatternDirector(e,dt){
    const phase=Math.max(1,e.apexPhase||1);
    if(phase<2||e.atroposPendingPhase||e.atroposPhaseTransition)return;
    if(e.atroposReborn?.slash)return;
    if((state.entities.telegraphs?.length||0)>58)return;
    e.atroposPatternCd=(e.atroposPatternCd??6.1)-dt;
    if(e.atroposPatternCd>0)return;
    const patterns=availablePatterns(phase),cycle=(e.atroposPatternCycle||0)%patterns.length,name=patterns[cycle];
    e.atroposPatternCycle=(e.atroposPatternCycle||0)+1;
    firePatternByName(e,name,false);
    e.atroposPatternCd=phase===2?6.7:phase===3?6.0:5.35;
  }

  function updateAtroposProduction(e,dt){
    const phase=Math.max(1,Math.min(4,e.apexPhase||phaseFromHealth(e)));
    queuePhaseTransition(e,phase);
    maybeBeginPendingTransition(e);
    if(updatePhaseTransition(e,dt))return;
    updatePatternDirector(e,dt);
  }

  // Suppress the earlier lightweight echo/phase notice layer, then run the full production director
  // after the accepted Reborn space-cut update. This does not change Omega/Constellation branches.
  apexBossSkill=function apexBossSkillWithAtroposProduction(e,dt){
    if(!isAtropos(e))return baseApexBossSkillProduction(e,dt);
    const desired=phaseFromHealth(e);
    e.clockworkIdentityPhase=desired;
    e.clockworkEchoCd=1e9;
    const result=baseApexBossSkillProduction(e,dt);
    e.clockworkEchoCd=1e9;
    updateAtroposProduction(e,dt);
    return result;
  };

  // Phase-specific visual evolution is an overlay on the approved clockwork silhouette. The base
  // renderer is temporarily given clockworkVisualPhase so the visible morph waits for the transition.
  function drawPhaseOverlay(e,t){
    const phase=Math.max(1,e.clockworkVisualPhase||e.apexPhase||1),tr=e.atroposPhaseTransition;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(phase>=2){
      const rr=e.r*1.73,rot=t*(phase>=4?-.050:-.028)+.44;
      ctx.rotate(rot);ctx.globalAlpha=phase===2?.24:phase===3?.31:.38;ctx.strokeStyle=phase>=4?'#eafffb':'#79ffe1';ctx.lineWidth=1.45;
      for(let seg=0;seg<6;seg++){if(seg===2||phase>=4&&seg===5)continue;ctx.beginPath();ctx.arc(0,0,rr,seg/6*TAU+.14,(seg+1)/6*TAU-.12);ctx.stroke();}
      for(let i=0;i<12;i+=2){const a=i/12*TAU,inner=rr-e.r*.045,outer=rr+e.r*(phase>=3?.075:.055);ctx.globalAlpha=(phase===2?.20:.30)*(i%4===0?1.35:1);ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}
    }
    if(phase>=3){
      ctx.globalAlpha=phase===3?.25:.36;ctx.strokeStyle='#bffdf3';ctx.fillStyle='rgba(159,255,234,.10)';
      const count=phase>=4?6:4;
      for(let i=0;i<count;i++){const a=.35+i*TAU/count-t*(i%2?.030:-.021),rr=e.r*(1.55+(i%3)*.16),s=e.r*(.06+(i%2)*.025);ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(a+.7);ctx.beginPath();ctx.moveTo(-s,-s*.42);ctx.lineTo(s*.85,-s*.18);ctx.lineTo(s*.36,s*.52);ctx.lineTo(-s*.72,s*.34);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
      // Detached broken hand segment: a visible sign that the dial no longer shares one chronology.
      const a=t*.19+1.84;ctx.save();ctx.rotate(a);ctx.globalAlpha=phase===3?.30:.43;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.r*.52,0);ctx.lineTo(e.r*1.08,0);ctx.stroke();ctx.restore();
    }
    if(phase>=4){
      // Two displaced outer arcs create a subtle phase-split silhouette rather than more solid mass.
      for(const side of[-1,1]){ctx.save();ctx.translate(side*e.r*.045,-side*e.r*.022);ctx.rotate(-t*.032+side*.10);ctx.globalAlpha=.24;ctx.strokeStyle=side<0?'#79ffe1':'#ffffff';ctx.lineWidth=1.25;ctx.setLineDash([e.r*.15,e.r*.11]);ctx.beginPath();ctx.arc(0,0,e.r*1.98,.18+side*.22,TAU-.32+side*.12);ctx.stroke();ctx.restore();}
      ctx.setLineDash([]);
      // Future/past hand ghosts straddle the current long hand.
      for(const shift of[-.16,.17]){const a=t*.31-.72+shift;ctx.save();ctx.rotate(a);ctx.globalAlpha=.16;ctx.strokeStyle=shift<0?'#79ffe1':'#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-e.r*.16,0);ctx.lineTo(e.r*1.46,0);ctx.stroke();ctx.restore();}
    }
    if(tr){
      const p=Math.min(1,tr.age/tr.duration),wave=Math.sin(Math.PI*p),rr=e.r*(2.12-.38*p);
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
      availablePatterns:availablePatterns(e.apexPhase||1),lastPattern:e.atroposLastPattern||null,patternCycle:e.atroposPatternCycle||0,patternCd:e.atroposPatternCd??null,
      spaceCutActive:!!e.atroposReborn?.slash,bodyParts:Array.isArray(e.bodyParts)?e.bodyParts.length:0
    }:null;
  };

  if(window.stackfallDeveloperTest?.enabled){
    window.stackfallDeveloperTest.atroposSetPhase=function atroposSetPhase(phase){
      const e=state.entities.enemies.find(isAtropos);if(!e)return false;phase=Math.max(1,Math.min(4,phase|0));e.hp=e.maxHp*({1:.95,2:.70,3:.45,4:.20}[phase]);return true;
    };
    window.stackfallDeveloperTest.atroposFirePattern=function atroposFirePattern(name){
      const e=state.entities.enemies.find(isAtropos);if(!e||!availablePatterns(e.apexPhase||1).includes(name))return false;firePatternByName(e,name,true);return true;
    };
  }
})();
