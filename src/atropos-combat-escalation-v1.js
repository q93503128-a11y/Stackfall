// Chronophage-only combat escalation pass.
// Builds on the approved clockwork visual, production phase director and temporal-shear language.
// Omega and Last Constellation are intentionally untouched here.
(()=>{
  if(window.stackfallAtroposCombatEscalation==='v1')return;
  window.stackfallAtroposCombatEscalation='v1';

  const FORM='chronophage';
  const isAtropos=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const phaseOf=e=>Math.max(1,Math.min(4,Number(e?.apexPhase)||1));
  const cutCounts=[0,1,2,3,4];
  const volleyCooldown=[0,4.85,4.10,3.45,3.05];
  const stillThreshold=[0,1.20,.92,.62,0];
  const antiIdleCooldown=[0,3.05,2.58,2.08,1.72];
  const p4Offsets=[.18,-.94,1.22,-.48];

  const cutProfiles={
    1:[{warn:.52,lock:.78,impact:1.20,finish:2.05,delay:0}],
    2:[{warn:.40,lock:.64,impact:1.02,finish:1.42,delay:.12},{warn:.12,lock:.34,impact:.70,finish:1.02,delay:0}],
    3:[{warn:.32,lock:.55,impact:.92,finish:1.30,delay:.09},{warn:.10,lock:.30,impact:.64,finish:.96,delay:.16},{warn:.08,lock:.28,impact:.62,finish:.94,delay:0}],
    4:[{warn:.22,lock:.44,impact:.80,finish:1.14,delay:.07},{warn:.06,lock:.26,impact:.60,finish:.90,delay:.22},{warn:.12,lock:.38,impact:.78,finish:1.07,delay:.08},{warn:.05,lock:.24,impact:.58,finish:.87,delay:0}]
  };

  function historyPoint(e,back){
    const h=e.clockworkPlayerHistory||[];
    return h[Math.max(0,h.length-1-back)]||{x:player.x,y:player.y};
  }
  function cutTarget(e,phase,index){
    if(phase<4||!e.atroposP4TimeStopDone)return{x:player.x,y:player.y};
    if(index===1)return historyPoint(e,5);
    if(index===3)return historyPoint(e,9);
    return{x:player.x,y:player.y};
  }
  function cutAngle(e,target,phase,index){
    let angle=Math.atan2(target.y-e.y,target.x-e.x);
    const serial=(e.atroposReborn?.attackSerial||0)+1,side=serial%2?1:-1;
    if(phase===1)angle+=side*.11;
    else if(phase===2)angle+=index===0?side*.10:side*.58;
    else if(phase===3)angle+=[side*.08,side*.64,-side*.86][index]||0;
    else angle+=(p4Offsets[index]||0)*side+Math.sin((e.phase||0)*.19+index)*.08;
    return angle;
  }
  function profileFor(phase,index){
    const list=cutProfiles[phase]||cutProfiles[1];return list[Math.min(index,list.length-1)];
  }
  function beginVolley(e){
    const r=e.atroposReborn;if(!r)return;
    const phase=phaseOf(e),total=cutCounts[phase];
    r.spaceCutVolley={phase,total,index:0,startedAt:state.time||0};
    r.spaceCutChainDelay=0;
    startRebornAtroposSlash(e);
  }

  // Replace the old single-cut constructor. Every follow-up recomputes the target and direction,
  // so higher phases feel like repeated executions rather than parallel warning strips.
  startRebornAtroposSlash=function startEscalatedAtroposSlash(e){
    ensureRebornAtropos(e);
    const r=e.atroposReborn;if(!r)return;
    if(!r.spaceCutVolley){const phase=phaseOf(e);r.spaceCutVolley={phase,total:cutCounts[phase],index:0,startedAt:state.time||0};}
    const volley=r.spaceCutVolley,phase=phaseOf(e),index=Math.min(volley.index,cutCounts[phase]-1),profile=profileFor(phase,index),target=cutTarget(e,phase,index),angle=cutAngle(e,target,phase,index),ux=Math.cos(angle),uy=Math.sin(angle),half=Math.max(760,Math.hypot(vw,vh)*.56);
    r.attackSerial=(r.attackSerial||0)+1;
    r.slash={
      age:0,angle,targetX:target.x,targetY:target.y,
      x1:target.x-ux*half,y1:target.y-uy*half,x2:target.x+ux*half,y2:target.y+uy*half,
      lockPlayed:false,impactPlayed:false,chainIndex:index,chainTotal:volley.total,
      warningStart:profile.warn,lockAt:profile.lock,impactAt:profile.impact,finishAt:profile.finish,
      nextDelay:profile.delay,phaseAtStart:phase,p4Distorted:phase===4&&!!e.atroposP4TimeStopDone
    };
    if(typeof audio?.tone==='function')audio.tone(68+index*9,.20,'sawtooth',.018,18-index*8);
  };

  updateRebornAtroposSlash=function updateEscalatedAtroposSlash(e,dt){
    const r=e.atroposReborn,slash=r?.slash;if(!slash)return;
    slash.age+=dt;
    const lockAt=Number(slash.lockAt)||.78,impactAt=Number(slash.impactAt)||1.20,finishAt=Number(slash.finishAt)||2.05;
    if(slash.age>=lockAt&&!slash.lockPlayed){
      slash.lockPlayed=true;
      if(typeof audio?.tone==='function')audio.tone(116+slash.chainIndex*10,.10,'square',.018,-32);
      state.camera.shake=Math.max(state.camera.shake,2.4+slash.chainIndex*.45);
    }
    if(slash.age>=impactAt&&!slash.impactPlayed){
      slash.impactPlayed=true;
      const width=36+(slash.phaseAtStart>=3?2:0),dist=segmentDistance(player.x,player.y,slash.x1,slash.y1,slash.x2,slash.y2),follow=slash.chainIndex>0,damageScale=follow?(slash.phaseAtStart>=4?.68:.76):1;
      if(dist<=width+player.r&&player.invuln<=0)hurtPlayer(Math.max(8,e.damage*.52*damageScale),e);
      state.camera.shake=Math.max(state.camera.shake,follow?8.4:11);
      state.hitStop=Math.max(state.hitStop,follow?.032:.048);
      state.flash=Math.max(state.flash,follow?.018:.025);
      audio.hit(true);
      if(typeof audio?.tone==='function')audio.tone(48+slash.chainIndex*5,.21,'sawtooth',.038,-14);
      const mx=(slash.x1+slash.x2)*.5,my=(slash.y1+slash.y2)*.5;
      shockwave(mx,my,slash.phaseAtStart>=4?'#ffffff':'#dffef8',follow?142:180,follow?.30:.40,follow?3.0:3.8);
      const particles=follow?9:14;
      for(let i=0;i<particles;i++){
        const q=(i+.5)/particles,x=atroposLerp(slash.x1,slash.x2,q),y=atroposLerp(slash.y1,slash.y2,q);
        spawnParticle(x+rand(-22,22),y+rand(-22,22),i%3?'#bffdf3':'#ffffff',1,rand(34,72),rand(2,4));
      }
    }
    if(slash.age<finishAt)return;
    r.slash=null;
    const volley=r.spaceCutVolley;
    if(volley&&volley.index+1<volley.total){
      volley.index++;
      r.spaceCutChainDelay=Math.max(.02,Number(slash.nextDelay)||.08);
    }else{
      r.spaceCutVolley=null;r.spaceCutChainDelay=0;r.slashCd=volleyCooldown[phaseOf(e)];
    }
  };

  updateRebornAtropos=function updateEscalatedRebornAtropos(e,dt){
    ensureRebornAtropos(e);
    const r=e.atroposReborn;r.introAge+=dt;e.apexElapsed=(e.apexElapsed||0)+dt;
    const health=e.hp/Math.max(1,e.maxHp);e.apexPhase=health<.25?4:health<.50?3:health<.75?2:1;e.timeLock=0;
    if(r.introAge<1.15){r.slashCd=Math.max(r.slashCd,1.0);return;}
    if(!r.introSettled){r.introSettled=true;audio.tone(42,.30,'sawtooth',.028,10);state.camera.shake=Math.max(state.camera.shake,3);}
    updateRebornAtroposSlash(e,dt);
    if(r.slash)return;
    if(e.atroposPhaseTransition||e.atroposPendingPhase||e.atroposP4TimeStopActive){
      r.spaceCutVolley=null;r.spaceCutChainDelay=0;r.slashCd=Math.max(r.slashCd||0,.85);return;
    }
    if(r.spaceCutVolley){
      r.spaceCutChainDelay=(r.spaceCutChainDelay||0)-dt;
      if(r.spaceCutChainDelay<=0)startRebornAtroposSlash(e);
      return;
    }
    r.slashCd-=dt;
    if(r.slashCd<=0)beginVolley(e);
  };

  // Dynamic Space Cut drawing mirrors the per-slash timing above. P4 keeps readable warning time,
  // but irregular follow-up timing and orientation make the restored chronology feel wrong.
  drawAtroposSpaceCut=function drawEscalatedAtroposSpaceCut(e){
    const slash=e.atroposReborn?.slash;if(!slash)return;
    const warningStart=Number(slash.warningStart)??.52,impactAt=Number(slash.impactAt)||1.20,finishAt=Number(slash.finishAt)||1.70;
    if(slash.age<warningStart||slash.age>finishAt)return;
    const a=atroposScreenPoint(slash.x1,slash.y1),b=atroposScreenPoint(slash.x2,slash.y2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    ctx.save();ctx.lineCap='round';
    if(slash.age<impactAt){
      const q=clamp((slash.age-warningStart)/Math.max(.05,impactAt-warningStart),0,1),p4=!!slash.p4Distorted;
      ctx.globalAlpha=.09+.24*q;ctx.strokeStyle=p4?(slash.chainIndex%2?'#ffffff':'#79ffe1'):'#bffdf3';ctx.lineWidth=1.1+q*1.6;ctx.setLineDash(p4?[15,11,4,18]:[28,36]);ctx.lineDashOffset=-(state.time||0)*(p4?(slash.chainIndex%2?-22:29):14);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.045+.09*q;ctx.strokeStyle='#79ffe1';ctx.lineWidth=8+slash.chainIndex*1.5;ctx.stroke();
      const ticks=4+slash.chainIndex;ctx.globalAlpha=.22+.30*q;ctx.lineWidth=1.1;for(let i=1;i<=ticks;i++){const f=i/(ticks+1),x=a.x+dx*f,y=a.y+dy*f,span=8+(i%2)*5;ctx.beginPath();ctx.moveTo(x-nx*span,y-ny*span);ctx.lineTo(x+nx*span,y+ny*span);ctx.stroke();}
    }else{
      const elapsed=slash.age-impactAt,remaining=Math.max(.05,finishAt-impactAt),open=elapsed<.12?atroposEaseOut(elapsed/.12):clamp((finishAt-slash.age)/Math.min(.22,remaining),0,1),gap=8+open*23;
      ctx.globalAlpha=.50;ctx.strokeStyle='#000207';ctx.lineWidth=gap*2.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=.86;ctx.strokeStyle='#effffb';ctx.shadowColor='#79ffe1';ctx.shadowBlur=14;ctx.lineWidth=2.6;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(a.x+nx*gap*side,a.y+ny*gap*side);ctx.lineTo(b.x+nx*gap*side,b.y+ny*gap*side);ctx.stroke();}ctx.shadowBlur=0;ctx.globalAlpha=.27;ctx.strokeStyle='#8fffe0';ctx.lineWidth=1.3;for(let i=1;i<11;i+=2){const q=i/12,x=a.x+dx*q,y=a.y+dy*q,span=12+open*18;ctx.beginPath();ctx.moveTo(x-nx*span,y-ny*span);ctx.lineTo(x+nx*span*.42,y+ny*span*.42);ctx.stroke();}
    }
    ctx.restore();
  };

  // Chronophage anti-idle pressure scales per phase. In P4 it becomes a periodic temporal pursuit:
  // movement no longer disables it, but it is still suppressed during the three-second time stop.
  const baseBossAntiIdleEscalation=typeof bossAntiIdleSkill==='function'?bossAntiIdleSkill:null;
  if(baseBossAntiIdleEscalation){
    bossAntiIdleSkill=function bossAntiIdleAtroposEscalation(e,dt){
      if(!isAtropos(e))return baseBossAntiIdleEscalation(e,dt);
      if(e.atroposPhaseTransition||e.atroposP4TimeStopActive)return;
      const phase=phaseOf(e);
      e.antiIdleSampleCd=(e.antiIdleSampleCd||0)-dt;e.antiIdleCd=(e.antiIdleCd??antiIdleCooldown[phase])-dt;
      if(e.antiIdleSampleCd<=0){
        e.antiIdleSampleCd=.20;const lx=Number.isFinite(e.antiIdlePlayerX)?e.antiIdlePlayerX:player.x,ly=Number.isFinite(e.antiIdlePlayerY)?e.antiIdlePlayerY:player.y,moved=Math.hypot(player.x-lx,player.y-ly);
        e.antiIdleStill=moved<7?(e.antiIdleStill||0)+.20:Math.max(0,(e.antiIdleStill||0)-.60);e.antiIdlePlayerX=player.x;e.antiIdlePlayerY=player.y;
      }
      if(e.antiIdleCd>0)return;
      if(phase<4&&(e.antiIdleStill||0)<stillThreshold[phase])return;
      e.antiIdleStill=phase>=4?0:.18;e.antiIdleCd=antiIdleCooldown[phase];
      const d=Math.max(4,e.damage*.30),x=player.x,y=player.y,base=(e.phase||0)*.13;
      chronophageScar(x,y,72+phase*3,d*1.02,'#79ffe1',phase>=4?.62:.76,base+(phase>=4?.42:0));
      const secondDelay=phase>=4?145:Math.max(150,260-phase*20);
      bossLater(e,secondDelay,()=>{if(e.dead)return;chronophageScar(player.x,player.y,86+phase*3,d*.62,'#c6fff4',phase>=4?.58:.70,base+(phase>=4?-1.02:.88));});
      if(phase>=4)bossLater(e,410,()=>{if(e.dead||e.atroposP4TimeStopActive)return;const p=historyPoint(e,6);chronophageScar(p.x,p.y,74,d*.46,'#9fffea',.66,base+1.36);});
    };
  }

  // P4 transition: freeze the simulation for three real seconds. The phase director still receives
  // zero-dt ticks, allowing us to advance its transition from wall-clock time while all gameplay is frozen.
  const baseApexBossSkillEscalation=typeof apexBossSkill==='function'?apexBossSkill:null;
  function startP4Stop(e,tr){
    if(tr.p4TimeStop)return;
    tr.duration=3.0;tr.age=0;tr.p4TimeStop={startedAt:performance.now(),durationMs:3000,freezePhase:Number(e.phase)||0};
    e.clockworkVisualPhase=4;e.atroposP4TimeStopActive=true;e.atroposP4TimeStopDone=false;e.atroposP4FreezePhase=tr.p4TimeStop.freezePhase;
    if(e.atroposReborn){e.atroposReborn.spaceCutVolley=null;e.atroposReborn.spaceCutChainDelay=0;e.atroposReborn.slash=null;e.atroposReborn.slashCd=Math.max(e.atroposReborn.slashCd||0,1.2);}
    state.hitStop=Math.max(state.hitStop,.12);state.camera.shake=Math.max(state.camera.shake,5.5);state.flash=Math.max(state.flash,.055);
    if(typeof audio?.tone==='function'){audio.tone(52,.42,'sawtooth',.025,-18);audio.tone(104,.22,'square',.014,-44);}
  }
  function syncP4StopBefore(e){
    const tr=e.atroposPhaseTransition;if(!tr||tr.phase!==4)return;
    if(!tr.p4TimeStop)startP4Stop(e,tr);
    const stop=tr.p4TimeStop,elapsed=Math.max(0,(performance.now()-stop.startedAt)/1000);
    tr.duration=3.0;tr.age=Math.min(tr.duration,elapsed);
    if(elapsed<3){e.atroposP4TimeStopActive=true;state.hitStop=Math.max(state.hitStop,.10);}
    else{e.atroposP4TimeStopActive=false;e.atroposP4TimeStopDone=true;state.hitStop=0;tr.age=tr.duration;}
  }
  if(baseApexBossSkillEscalation){
    apexBossSkill=function apexBossSkillWithAtroposTimeStop(e,dt){
      if(!isAtropos(e))return baseApexBossSkillEscalation(e,dt);
      syncP4StopBefore(e);
      const result=baseApexBossSkillEscalation(e,dt);
      const tr=e.atroposPhaseTransition;
      if(tr?.phase===4){syncP4StopBefore(e);}
      else if(e.atroposP4TimeStopActive){e.atroposP4TimeStopActive=false;e.atroposP4TimeStopDone=true;state.hitStop=0;}
      if(e.atroposP4TimeStopDone&&phaseOf(e)===4&&!e.atroposPhaseTransition&&Number.isFinite(e.atroposPatternCd)){
        const irregular=4.15+Math.sin((e.phase||0)*.71)*.52;e.atroposPatternCd=Math.min(e.atroposPatternCd,irregular);
      }
      return result;
    };
  }

  // During P4 stop the simulation phase is frozen, so render the approved clock with a synthetic
  // backwards phase. This makes hands/rings visibly race backwards without advancing combat state.
  const baseDrawEliteShapeEscalation=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(baseDrawEliteShapeEscalation){
    drawEliteShape=function drawEliteShapeWithP4Reverse(e){
      if(!isAtropos(e)||!e.atroposP4TimeStopActive)return baseDrawEliteShapeEscalation(e);
      const tr=e.atroposPhaseTransition,stop=tr?.p4TimeStop,actual=e.phase,elapsed=stop?Math.max(0,(performance.now()-stop.startedAt)/1000):0,base=Number(e.atroposP4FreezePhase)||actual||0;
      e.phase=base-elapsed*18.5;
      try{return baseDrawEliteShapeEscalation(e);}finally{e.phase=actual;}
    };
  }

  window.stackfallAtroposCombatEscalationDiagnostics=()=>{
    const e=state.entities.enemies.find(isAtropos)||null;if(!e)return null;const r=e.atroposReborn||{},phase=phaseOf(e),slash=r.slash;
    return{version:window.stackfallAtroposCombatEscalation,phase,cutCount:cutCounts[phase],volleyCooldown:volleyCooldown[phase],stillThreshold:stillThreshold[phase],antiIdleCooldown:antiIdleCooldown[phase],antiIdleStill:e.antiIdleStill||0,antiIdleCd:e.antiIdleCd??null,p4TimeStopActive:!!e.atroposP4TimeStopActive,p4TimeStopDone:!!e.atroposP4TimeStopDone,transition:e.atroposPhaseTransition?{phase:e.atroposPhaseTransition.phase,age:e.atroposPhaseTransition.age,duration:e.atroposPhaseTransition.duration,timeStop:!!e.atroposPhaseTransition.p4TimeStop}:null,volley:r.spaceCutVolley?{...r.spaceCutVolley}:null,slash:slash?{age:slash.age,index:slash.chainIndex,total:slash.chainTotal,warningStart:slash.warningStart,impactAt:slash.impactAt,finishAt:slash.finishAt,angle:slash.angle,p4Distorted:!!slash.p4Distorted}:null};
  };
})();
