// Chronophage-only combat escalation pass.
// Four readable mechanics only: Space Cut, anti-idle scar, clock hand, and time field.
// Omega and Last Constellation are intentionally untouched here.
(()=>{
  if(window.stackfallAtroposCombatEscalation==='v1')return;
  window.stackfallAtroposCombatEscalation='v1';

  const FORM='chronophage',CLOCK_STEPS=12,CLOCK_STEP=TAU/CLOCK_STEPS;
  const isAtropos=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const phaseOf=e=>Math.max(1,Math.min(4,Number(e?.apexPhase)||1));
  const cutCounts=[0,1,2,3,4];
  const volleyCooldown=[0,4.85,4.10,3.45,3.05];
  const stillThreshold=[0,1.20,.92,.62,0];
  const antiIdleCooldown=[0,3.05,2.58,2.08,1.72];
  const handStepSeconds=[0,0,2.0,1.0,.50];
  const fieldCooldown=[0,0,0,3.0,1.65];
  const p4Offsets=[.18,-.94,1.22,-.48];

  const cutProfiles={
    1:[{warn:.52,lock:.78,impact:1.20,finish:2.05,delay:0}],
    2:[{warn:.40,lock:.64,impact:1.02,finish:1.42,delay:.12},{warn:.12,lock:.34,impact:.70,finish:1.02,delay:0}],
    3:[{warn:.32,lock:.55,impact:.92,finish:1.30,delay:.09},{warn:.10,lock:.30,impact:.64,finish:.96,delay:.16},{warn:.08,lock:.28,impact:.62,finish:.94,delay:0}],
    4:[{warn:.22,lock:.44,impact:.80,finish:1.14,delay:.07},{warn:.06,lock:.26,impact:.60,finish:.90,delay:.22},{warn:.12,lock:.38,impact:.78,finish:1.07,delay:.08},{warn:.05,lock:.24,impact:.58,finish:.87,delay:0}]
  };

  const mod12=n=>(n%CLOCK_STEPS+CLOCK_STEPS)%CLOCK_STEPS;
  const easeTick=t=>1-Math.pow(1-clamp(t,0,1),3);
  function historyPoint(e,back){const h=e.clockworkPlayerHistory||[];return h[Math.max(0,h.length-1-back)]||{x:player.x,y:player.y};}
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
  function profileFor(phase,index){const list=cutProfiles[phase]||cutProfiles[1];return list[Math.min(index,list.length-1)];}
  function beginVolley(e){
    const r=e.atroposReborn;if(!r)return;const phase=phaseOf(e),total=cutCounts[phase];
    r.spaceCutVolley={phase,total,index:0,startedAt:state.time||0};r.spaceCutChainDelay=0;startRebornAtroposSlash(e);
  }

  startRebornAtroposSlash=function startEscalatedAtroposSlash(e){
    ensureRebornAtropos(e);const r=e.atroposReborn;if(!r)return;
    if(!r.spaceCutVolley){const phase=phaseOf(e);r.spaceCutVolley={phase,total:cutCounts[phase],index:0,startedAt:state.time||0};}
    const volley=r.spaceCutVolley,phase=phaseOf(e),index=Math.min(volley.index,cutCounts[phase]-1),profile=profileFor(phase,index),target=cutTarget(e,phase,index),angle=cutAngle(e,target,phase,index),ux=Math.cos(angle),uy=Math.sin(angle),half=Math.max(760,Math.hypot(vw,vh)*.56);
    r.attackSerial=(r.attackSerial||0)+1;
    r.slash={age:0,angle,targetX:target.x,targetY:target.y,x1:target.x-ux*half,y1:target.y-uy*half,x2:target.x+ux*half,y2:target.y+uy*half,lockPlayed:false,impactPlayed:false,chainIndex:index,chainTotal:volley.total,warningStart:profile.warn,lockAt:profile.lock,impactAt:profile.impact,finishAt:profile.finish,nextDelay:profile.delay,phaseAtStart:phase,p4Distorted:phase===4&&!!e.atroposP4TimeStopDone};
    if(typeof audio?.tone==='function')audio.tone(68+index*9,.20,'sawtooth',.018,18-index*8);
  };

  updateRebornAtroposSlash=function updateEscalatedAtroposSlash(e,dt){
    const r=e.atroposReborn,slash=r?.slash;if(!slash)return;slash.age+=dt;
    const lockAt=Number(slash.lockAt)||.78,impactAt=Number(slash.impactAt)||1.20,finishAt=Number(slash.finishAt)||2.05;
    if(slash.age>=lockAt&&!slash.lockPlayed){slash.lockPlayed=true;if(typeof audio?.tone==='function')audio.tone(116+slash.chainIndex*10,.10,'square',.018,-32);state.camera.shake=Math.max(state.camera.shake,2.4+slash.chainIndex*.45);}
    if(slash.age>=impactAt&&!slash.impactPlayed){
      slash.impactPlayed=true;const width=36+(slash.phaseAtStart>=3?2:0),dist=segmentDistance(player.x,player.y,slash.x1,slash.y1,slash.x2,slash.y2),follow=slash.chainIndex>0,damageScale=follow?(slash.phaseAtStart>=4?.68:.76):1;
      if(dist<=width+player.r&&player.invuln<=0)hurtPlayer(Math.max(8,e.damage*.52*damageScale),e);
      state.camera.shake=Math.max(state.camera.shake,follow?8.4:11);state.hitStop=Math.max(state.hitStop,follow?.032:.048);state.flash=Math.max(state.flash,follow?.018:.025);audio.hit(true);
      if(typeof audio?.tone==='function')audio.tone(48+slash.chainIndex*5,.21,'sawtooth',.038,-14);
      const mx=(slash.x1+slash.x2)*.5,my=(slash.y1+slash.y2)*.5;shockwave(mx,my,slash.phaseAtStart>=4?'#ffffff':'#dffef8',follow?142:180,follow?.30:.40,follow?3.0:3.8);
      const particles=follow?9:14;for(let i=0;i<particles;i++){const q=(i+.5)/particles,x=atroposLerp(slash.x1,slash.x2,q),y=atroposLerp(slash.y1,slash.y2,q);spawnParticle(x+rand(-22,22),y+rand(-22,22),i%3?'#bffdf3':'#ffffff',1,rand(34,72),rand(2,4));}
    }
    if(slash.age<finishAt)return;r.slash=null;const volley=r.spaceCutVolley;
    if(volley&&volley.index+1<volley.total){volley.index++;r.spaceCutChainDelay=Math.max(.02,Number(slash.nextDelay)||.08);}
    else{r.spaceCutVolley=null;r.spaceCutChainDelay=0;r.slashCd=volleyCooldown[phaseOf(e)];}
  };

  updateRebornAtropos=function updateEscalatedRebornAtropos(e,dt){
    ensureRebornAtropos(e);const r=e.atroposReborn;r.introAge+=dt;e.apexElapsed=(e.apexElapsed||0)+dt;
    const health=e.hp/Math.max(1,e.maxHp);e.apexPhase=health<.25?4:health<.50?3:health<.75?2:1;e.timeLock=0;
    if(r.introAge<1.15){r.slashCd=Math.max(r.slashCd,1.0);return;}
    if(!r.introSettled){r.introSettled=true;audio.tone(42,.30,'sawtooth',.028,10);state.camera.shake=Math.max(state.camera.shake,3);}
    updateRebornAtroposSlash(e,dt);if(r.slash)return;
    if(e.atroposPhaseTransition||e.atroposPendingPhase||e.atroposP4TimeStopActive){r.spaceCutVolley=null;r.spaceCutChainDelay=0;r.slashCd=Math.max(r.slashCd||0,.85);return;}
    if(r.spaceCutVolley){r.spaceCutChainDelay=(r.spaceCutChainDelay||0)-dt;if(r.spaceCutChainDelay<=0)startRebornAtroposSlash(e);return;}
    r.slashCd-=dt;if(r.slashCd<=0)beginVolley(e);
  };

  drawAtroposSpaceCut=function drawEscalatedAtroposSpaceCut(e){
    const slash=e.atroposReborn?.slash;if(!slash)return;const warningStart=Number(slash.warningStart)??.52,impactAt=Number(slash.impactAt)||1.20,finishAt=Number(slash.finishAt)||1.70;if(slash.age<warningStart||slash.age>finishAt)return;
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

  const baseBossAntiIdleEscalation=typeof bossAntiIdleSkill==='function'?bossAntiIdleSkill:null;
  if(baseBossAntiIdleEscalation){
    bossAntiIdleSkill=function bossAntiIdleAtroposEscalation(e,dt){
      if(!isAtropos(e))return baseBossAntiIdleEscalation(e,dt);if(e.atroposPhaseTransition||e.atroposP4TimeStopActive)return;const phase=phaseOf(e);
      e.antiIdleSampleCd=(e.antiIdleSampleCd||0)-dt;e.antiIdleCd=(e.antiIdleCd??antiIdleCooldown[phase])-dt;
      if(e.antiIdleSampleCd<=0){e.antiIdleSampleCd=.20;const lx=Number.isFinite(e.antiIdlePlayerX)?e.antiIdlePlayerX:player.x,ly=Number.isFinite(e.antiIdlePlayerY)?e.antiIdlePlayerY:player.y,moved=Math.hypot(player.x-lx,player.y-ly);e.antiIdleStill=moved<7?(e.antiIdleStill||0)+.20:Math.max(0,(e.antiIdleStill||0)-.60);e.antiIdlePlayerX=player.x;e.antiIdlePlayerY=player.y;}
      if(e.antiIdleCd>0)return;if(phase<4&&(e.antiIdleStill||0)<stillThreshold[phase])return;
      e.antiIdleStill=phase>=4?0:.18;e.antiIdleCd=antiIdleCooldown[phase];const d=Math.max(4,e.damage*.30),x=player.x,y=player.y,base=(e.phase||0)*.13;
      chronophageScar(x,y,72+phase*3,d*1.02,'#79ffe1',phase>=4?.62:.76,base+(phase>=4?.42:0));
      const secondDelay=phase>=4?145:Math.max(150,260-phase*20);bossLater(e,secondDelay,()=>{if(e.dead)return;chronophageScar(player.x,player.y,86+phase*3,d*.62,'#c6fff4',phase>=4?.58:.70,base+(phase>=4?-1.02:.88));});
      if(phase>=4)bossLater(e,410,()=>{if(e.dead||e.atroposP4TimeStopActive)return;const p=historyPoint(e,6);chronophageScar(p.x,p.y,74,d*.46,'#9fffea',.66,base+1.36);});
    };
  }

  function ensureAtroposArena(e){
    let arena=state.apexArena;if(!arena||arena.form!==FORM){arena={x:e.x,y:e.y,r:compactDevice()?338:510,form:FORM,createdAt:state.time||0};state.apexArena=arena;}
    if(!e.atroposArenaAligned){arena.x=e.x;arena.y=e.y;arena.r=Math.max(arena.r||0,compactDevice()?338:510);e.atroposArenaAligned=true;}
    return arena;
  }
  function updateArenaBoundary(e,dt){
    const arena=ensureAtroposArena(e),dx=arena.x-player.x,dy=arena.y-player.y,d=Math.hypot(dx,dy)||1,excess=Math.max(0,d-arena.r);e.atroposBoundaryOutside=excess;
    if(excess<=0||e.atroposP4TimeStopActive)return;
    const pullSpeed=42+Math.min(280,excess*2.15),step=Math.min(excess+5,pullSpeed*dt);player.x+=dx/d*step;player.y+=dy/d*step;
    if(Math.random()<dt*(5+Math.min(8,excess*.04)))spawnParticle(player.x+rand(-12,12),player.y+rand(-12,12),'#79ffe1',1,34,2.1);
  }

  function initClockHand(e,phase){
    const arena=ensureAtroposArena(e),pa=Math.atan2(player.y-arena.y,player.x-arena.x),safeIndex=mod12(Math.round(pa/CLOCK_STEP)+4),angle=safeIndex*CLOCK_STEP;
    e.atroposClockHand={phase,index:safeIndex,angle,renderAngle:angle,fromAngle:angle,toAngle:angle,moveAge:1,moveDuration:.16,stepTimer:handStepSeconds[phase],active:true,burstSteps:0,breakAfter:0,offTimer:0};
  }
  function stepClockHand(e,hand,phase){
    const dir=phase>=4?-1:1;hand.fromAngle=hand.renderAngle;hand.index=mod12(hand.index+dir);hand.toAngle=hand.fromAngle+dir*CLOCK_STEP;hand.angle=hand.toAngle;hand.moveAge=0;hand.moveDuration=phase>=4?.12:.16;hand.stepTimer=handStepSeconds[phase];
    if(typeof audio?.tone==='function')audio.tone(phase>=4?92:108,.075,'square',.012,phase>=4?-26:-16);
    if(phase>=4){hand.burstSteps++;if(hand.burstSteps>=3){hand.burstSteps=0;hand.breakAfter=.18;}}
  }
  function updateClockHand(e,dt,phase){
    if(phase<2){e.atroposClockHand=null;return;}if(!e.atroposClockHand||e.atroposClockHand.phase!==phase)initClockHand(e,phase);const hand=e.atroposClockHand;
    hand.moveAge=Math.min(hand.moveDuration,hand.moveAge+dt);const q=easeTick(hand.moveDuration?hand.moveAge/hand.moveDuration:1);hand.renderAngle=hand.fromAngle+(hand.toAngle-hand.fromAngle)*q;
    e.atroposHandHitCd=Math.max(0,(e.atroposHandHitCd||0)-dt);
    if(phase>=4&&hand.breakAfter>0){hand.breakAfter-=dt;if(hand.breakAfter<=0){hand.active=false;hand.offTimer=2.0;} }
    if(phase>=4&&hand.offTimer>0){hand.offTimer-=dt;if(hand.offTimer<=0){hand.offTimer=0;hand.active=true;hand.stepTimer=.16;}return;}
    hand.active=true;hand.stepTimer-=dt;if(hand.stepTimer<=0)stepClockHand(e,hand,phase);
    if(!hand.active)return;const arena=ensureAtroposArena(e),len=arena.r*.93,x2=arena.x+Math.cos(hand.renderAngle)*len,y2=arena.y+Math.sin(hand.renderAngle)*len,width=phase>=4?24:phase===3?22:20;
    if(e.atroposHandHitCd<=0&&segmentDistance(player.x,player.y,arena.x,arena.y,x2,y2)<=width+player.r&&player.invuln<=0){hurtPlayer(Math.max(5,e.damage*(phase>=4?.18:.15)),e);e.atroposHandHitCd=.28;state.camera.shake=Math.max(state.camera.shake,3.0);}
  }

  function clampFieldPoint(arena,p,r){const dx=p.x-arena.x,dy=p.y-arena.y,d=Math.hypot(dx,dy)||1,limit=Math.max(80,arena.r-r-30);if(d<=limit)return p;return{x:arena.x+dx/d*limit,y:arena.y+dy/d*limit};}
  function chooseFieldPoint(e,phase){
    const arena=ensureAtroposArena(e),cycle=e.atroposFieldCycle||0,recent=historyPoint(e,3),vx=player.x-recent.x,vy=player.y-recent.y;let p;e.atroposFieldCycle=cycle+1;
    if(cycle%4===1)p={x:player.x+clamp(vx*2,-105,105),y:player.y+clamp(vy*2,-105,105)};
    else if(cycle%4===2)p={x:(player.x+arena.x)*.5,y:(player.y+arena.y)*.5};
    else if(cycle%4===3)p={x:player.x+Math.cos((e.phase||0)*.7)*72,y:player.y+Math.sin((e.phase||0)*.7)*72};
    else p={x:player.x,y:player.y};
    return clampFieldPoint(arena,p,phase>=4?90:82);
  }
  function spawnTimeField(e,phase){
    if(phase<3)return false;const p=chooseFieldPoint(e,phase),warn=phase>=4?.48:.58,active=phase>=4?1.15:1.35,r=phase>=4?90:82;
    e.atroposTimeFields=e.atroposTimeFields||[];e.atroposTimeFields.push({x:p.x,y:p.y,r,age:0,warn,active,total:warn+active,tick:.05,phase,seed:Math.random()*TAU});
    if(typeof audio?.tone==='function')audio.tone(126,.12,'sine',.011,-22);return true;
  }
  function nextFieldCooldown(e,phase){if(phase<4)return fieldCooldown[phase];return clamp(fieldCooldown[4]+Math.sin((e.phase||0)*.83)*.24,1.35,1.90);}
  function updateTimeFields(e,dt,phase){
    const fields=e.atroposTimeFields||(e.atroposTimeFields=[]);for(const f of fields){f.age+=dt;if(f.age<f.warn||f.age>=f.total)continue;f.tick-=dt;if(f.tick<=0){f.tick=phase>=4?.28:.34;if(Math.hypot(player.x-f.x,player.y-f.y)<=f.r+player.r&&player.invuln<=0){hurtPlayer(Math.max(4,e.damage*(phase>=4?.14:.12)),e);state.camera.shake=Math.max(state.camera.shake,1.8);}}if(Math.random()<dt*5)spawnParticle(f.x+rand(-f.r*.55,f.r*.55),f.y+rand(-f.r*.55,f.r*.55),'#9fffea',1,26,1.8);}
    e.atroposTimeFields=fields.filter(f=>f.age<f.total);
    if(phase<3)return;e.atroposFieldCd=(e.atroposFieldCd??(phase===3?.85:.70))-dt;if(e.atroposFieldCd<=0){const cap=phase>=4?2:1;if(e.atroposTimeFields.length<cap)spawnTimeField(e,phase);e.atroposFieldCd=nextFieldCooldown(e,phase);}
  }
  function syncMechanicPhase(e,phase){
    if(e.atroposMechanicPhase===phase)return;e.atroposMechanicPhase=phase;e.atroposClockHand=null;e.atroposTimeFields=[];e.atroposFieldCd=phase===3?.85:phase===4?.70:99;e.atroposHandHitCd=0;
  }
  function updateArenaMechanics(e,dt){
    updateArenaBoundary(e,dt);if(e.atroposPhaseTransition||e.atroposPendingPhase||e.atroposP4TimeStopActive){e.atroposTimeFields=[];return;}
    const phase=phaseOf(e);syncMechanicPhase(e,phase);updateClockHand(e,dt,phase);updateTimeFields(e,dt,phase);
  }

  function drawArenaBoundary(e,arena){
    const p=atroposScreenPoint(arena.x,arena.y),phase=phaseOf(e),outside=e.atroposBoundaryOutside||0,pulse=.5+.5*Math.sin(performance.now()/240);
    ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='rgba(57,202,191,.028)';ctx.beginPath();ctx.arc(0,0,arena.r,0,TAU);ctx.fill();
    ctx.strokeStyle=outside>0?`rgba(223,255,249,${.42+.22*pulse})`:'rgba(121,255,225,.24)';ctx.lineWidth=outside>0?5.2:3.2;ctx.shadowBlur=outside>0?18:10;ctx.shadowColor='#79ffe1';ctx.beginPath();ctx.arc(0,0,arena.r,0,TAU);ctx.stroke();ctx.shadowBlur=0;
    for(let i=0;i<12;i++){const a=i/CLOCK_STEPS*TAU,inner=arena.r-(i%3===0?16:10),outer=arena.r+(i%3===0?7:3);ctx.globalAlpha=phase>=2?(i%3===0?.40:.24):.18;ctx.strokeStyle=phase>=4&&i%2?'#ffffff':'#79ffe1';ctx.lineWidth=i%3===0?2:1.2;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}
    ctx.restore();
  }
  function drawClockHand(e,arena){
    const hand=e.atroposClockHand;if(!hand?.active||phaseOf(e)<2||e.atroposPhaseTransition||e.atroposP4TimeStopActive)return;const center=atroposScreenPoint(arena.x,arena.y),len=arena.r*.93,a=hand.renderAngle,x=Math.cos(a)*len,y=Math.sin(a)*len,phase=phaseOf(e);
    ctx.save();ctx.translate(center.x,center.y);ctx.lineCap='round';ctx.shadowColor=phase>=4?'#ffffff':'#79ffe1';ctx.shadowBlur=18;ctx.globalAlpha=.16;ctx.strokeStyle=phase>=4?'#ffffff':'#79ffe1';ctx.lineWidth=phase>=4?22:18;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=.80;ctx.lineWidth=3.6;ctx.strokeStyle=phase>=4?'#f2fffc':'#bffdf3';ctx.beginPath();ctx.moveTo(-Math.cos(a)*24,-Math.sin(a)*24);ctx.lineTo(x,y);ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle=phase>=4?'#ffffff':'#cffff7';ctx.beginPath();ctx.arc(0,0,8.5,0,TAU);ctx.fill();ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-13,-7);ctx.lineTo(-9,0);ctx.lineTo(-13,7);ctx.closePath();ctx.fill();ctx.restore();
    const warn=hand.stepTimer<=.36&&!hand.offTimer&&!hand.breakAfter,next=a+(phase>=4?-CLOCK_STEP:CLOCK_STEP),rr=arena.r*.97;if(warn){ctx.globalAlpha=.55+.28*Math.sin(performance.now()/65);ctx.strokeStyle=phase>=4?'#ffffff':'#79ffe1';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(Math.cos(next)*(rr-18),Math.sin(next)*(rr-18));ctx.lineTo(Math.cos(next)*(rr+9),Math.sin(next)*(rr+9));ctx.stroke();}
    ctx.restore();
  }
  function drawTimeFields(e){
    for(const f of e.atroposTimeFields||[]){const p=atroposScreenPoint(f.x,f.y),warning=f.age<f.warn,active=!warning&&f.age<f.total,q=warning?clamp(f.age/f.warn,0,1):clamp((f.age-f.warn)/f.active,0,1),dir=f.phase>=4?-1:1,rot=f.seed+dir*Math.max(0,f.age-f.warn)*4.4;
      ctx.save();ctx.translate(p.x,p.y);ctx.lineCap='round';if(warning){ctx.globalAlpha=.18+.34*q;ctx.strokeStyle='#79ffe1';ctx.lineWidth=1.5+q*1.4;ctx.setLineDash([9,7]);ctx.lineDashOffset=-(state.time||0)*20;ctx.beginPath();ctx.arc(0,0,f.r,0,TAU);ctx.stroke();ctx.setLineDash([]);}else if(active){ctx.fillStyle='rgba(74,222,207,.085)';ctx.globalAlpha=.82;ctx.beginPath();ctx.arc(0,0,f.r,0,TAU);ctx.fill();ctx.strokeStyle=f.phase>=4?'#eafffb':'#79ffe1';ctx.globalAlpha=.58;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,f.r,0,TAU);ctx.stroke();}
      ctx.strokeStyle=f.phase>=4?'#ffffff':'#bffdf3';for(let i=0;i<12;i++){const a=i/12*TAU,inn=f.r-(i%3===0?12:7),out=f.r+(i%3===0?3:0);ctx.globalAlpha=warning?.18+.26*q:.38;ctx.lineWidth=i%3===0?1.8:1;ctx.beginPath();ctx.moveTo(Math.cos(a)*inn,Math.sin(a)*inn);ctx.lineTo(Math.cos(a)*out,Math.sin(a)*out);ctx.stroke();}
      if(active){ctx.rotate(rot);ctx.globalAlpha=.72;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-f.r*.12,0);ctx.lineTo(f.r*.68,0);ctx.stroke();ctx.rotate(-rot*1.7);ctx.globalAlpha=.46;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(f.r*.46,0);ctx.stroke();}
      ctx.restore();
    }
  }

  const baseDrawApexArena=typeof window.drawApexArena==='function'?window.drawApexArena:null;
  window.drawApexArena=function drawAtroposApexArena(){
    if(baseDrawApexArena)baseDrawApexArena();const e=state.entities.enemies.find(isAtropos);if(!e)return;const arena=ensureAtroposArena(e);drawArenaBoundary(e,arena);drawTimeFields(e);drawClockHand(e,arena);
  };

  const baseApexBossSkillEscalation=typeof apexBossSkill==='function'?apexBossSkill:null;
  function startP4Stop(e,tr){
    if(tr.p4TimeStop)return;tr.duration=3.0;tr.age=0;tr.p4TimeStop={startedAt:performance.now(),durationMs:3000,freezePhase:Number(e.phase)||0};e.clockworkVisualPhase=4;e.atroposP4TimeStopActive=true;e.atroposP4TimeStopDone=false;e.atroposP4FreezePhase=tr.p4TimeStop.freezePhase;e.atroposTimeFields=[];e.atroposClockHand=null;
    if(e.atroposReborn){e.atroposReborn.spaceCutVolley=null;e.atroposReborn.spaceCutChainDelay=0;e.atroposReborn.slash=null;e.atroposReborn.slashCd=Math.max(e.atroposReborn.slashCd||0,1.2);}
    state.hitStop=Math.max(state.hitStop,.12);state.camera.shake=Math.max(state.camera.shake,5.5);state.flash=Math.max(state.flash,.055);if(typeof audio?.tone==='function'){audio.tone(52,.42,'sawtooth',.025,-18);audio.tone(104,.22,'square',.014,-44);}
  }
  function syncP4StopBefore(e){
    const tr=e.atroposPhaseTransition;if(!tr||tr.phase!==4)return;if(!tr.p4TimeStop)startP4Stop(e,tr);const stop=tr.p4TimeStop,elapsed=Math.max(0,(performance.now()-stop.startedAt)/1000);tr.duration=3.0;tr.age=Math.min(tr.duration,elapsed);if(elapsed<3){e.atroposP4TimeStopActive=true;state.hitStop=Math.max(state.hitStop,.10);}else{e.atroposP4TimeStopActive=false;e.atroposP4TimeStopDone=true;state.hitStop=0;tr.age=tr.duration;}
  }
  if(baseApexBossSkillEscalation){
    apexBossSkill=function apexBossSkillWithAtroposTimeStop(e,dt){
      if(!isAtropos(e))return baseApexBossSkillEscalation(e,dt);syncP4StopBefore(e);const result=baseApexBossSkillEscalation(e,dt);const tr=e.atroposPhaseTransition;if(tr?.phase===4)syncP4StopBefore(e);else if(e.atroposP4TimeStopActive){e.atroposP4TimeStopActive=false;e.atroposP4TimeStopDone=true;state.hitStop=0;}updateArenaMechanics(e,dt);return result;
    };
  }

  const baseDrawEliteShapeEscalation=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(baseDrawEliteShapeEscalation){
    drawEliteShape=function drawEliteShapeWithP4Reverse(e){
      if(!isAtropos(e)||!e.atroposP4TimeStopActive)return baseDrawEliteShapeEscalation(e);const tr=e.atroposPhaseTransition,stop=tr?.p4TimeStop,actual=e.phase,elapsed=stop?Math.max(0,(performance.now()-stop.startedAt)/1000):0,base=Number(e.atroposP4FreezePhase)||actual||0;e.phase=base-elapsed*18.5;try{return baseDrawEliteShapeEscalation(e);}finally{e.phase=actual;}
    };
  }

  window.stackfallAtroposCombatEscalationDiagnostics=()=>{
    const e=state.entities.enemies.find(isAtropos)||null;if(!e)return null;const r=e.atroposReborn||{},phase=phaseOf(e),slash=r.slash,arena=state.apexArena,hand=e.atroposClockHand;
    return{version:window.stackfallAtroposCombatEscalation,phase,cutCount:cutCounts[phase],volleyCooldown:volleyCooldown[phase],stillThreshold:stillThreshold[phase],antiIdleCooldown:antiIdleCooldown[phase],arena:arena?{x:arena.x,y:arena.y,r:arena.r,outside:e.atroposBoundaryOutside||0}:null,clockHand:hand?{phase:hand.phase,index:hand.index,angle:hand.renderAngle,stepSeconds:handStepSeconds[phase],active:!!hand.active,burstSteps:hand.burstSteps,offTimer:hand.offTimer,breakAfter:hand.breakAfter}:null,timeFields:(e.atroposTimeFields||[]).map(f=>({x:f.x,y:f.y,r:f.r,age:f.age,warn:f.warn,active:f.active,total:f.total,phase:f.phase})),fieldCooldown:fieldCooldown[phase]||0,antiIdleStill:e.antiIdleStill||0,antiIdleCd:e.antiIdleCd??null,p4TimeStopActive:!!e.atroposP4TimeStopActive,p4TimeStopDone:!!e.atroposP4TimeStopDone,transition:e.atroposPhaseTransition?{phase:e.atroposPhaseTransition.phase,age:e.atroposPhaseTransition.age,duration:e.atroposPhaseTransition.duration,timeStop:!!e.atroposPhaseTransition.p4TimeStop}:null,volley:r.spaceCutVolley?{...r.spaceCutVolley}:null,slash:slash?{age:slash.age,index:slash.chainIndex,total:slash.chainTotal,warningStart:slash.warningStart,impactAt:slash.impactAt,finishAt:slash.finishAt,angle:slash.angle,p4Distorted:!!slash.p4Distorted}:null};
  };

  if(window.stackfallDeveloperTest?.enabled){
    window.stackfallDeveloperTest.atroposForceClockStep=function(){const e=state.entities.enemies.find(isAtropos);if(!e||phaseOf(e)<2||e.atroposPhaseTransition)return false;if(!e.atroposClockHand)initClockHand(e,phaseOf(e));e.atroposClockHand.stepTimer=0;return true;};
    window.stackfallDeveloperTest.atroposSpawnTimeField=function(){const e=state.entities.enemies.find(isAtropos);if(!e||phaseOf(e)<3||e.atroposPhaseTransition)return false;return spawnTimeField(e,phaseOf(e));};
  }
})();
