// Starforge Omega production reset v1.
// Legacy Omega attacks are disabled so the boss can use the replacement production combat slate.
// This pass owns only the stripped forge backdrop, living stellar core, armor-shell progression,
// phase-driven plate shedding, and the core->armor entry assembly.
(()=>{
  if(window.stackfallOmegaProduction==='v1')return;
  window.stackfallOmegaProduction='v1';

  const FORM='starforge',PLATE_COUNT=8;
  const PHASE_PLATES={
    1:[0,1,2,3,4,5,6,7],
    2:[0,1,2,4,5,6],
    3:[0,2,4,6],
    4:[]
  };
  const INNER_PLATES={1:6,2:4,3:2,4:0};
  const ASSEMBLY_ORDER=[0,4,2,6,1,5,3,7];
  const isOmega=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const clamp01=v=>clamp(v,0,1);
  const easeOut=t=>1-Math.pow(1-clamp01(t),3);
  const entryTransition=()=>{const tr=state.realmTransition;return tr?.owner==='apex-entry'&&(state.apexArena?.form||state.pendingApexForm||tr?.form)===FORM?tr:null;};

  function currentOmega(){return state.entities.enemies?.find(isOmega)||null;}
  function computePhase(e,dt){
    e.apexElapsed=(e.apexElapsed||0)+dt;
    const health=e.hp/Math.max(1,e.maxHp),healthPhase=health<.25?4:health<.50?3:health<.75?2:1;
    const timePhase=e.apexElapsed>=240?4:e.apexElapsed>=180?3:e.apexElapsed>=105?2:1;
    const phase=Math.max(healthPhase,timePhase);
    if((e.apexPhase||1)!==phase){
      e.omegaPreviousPhase=e.apexPhase||1;
      e.omegaPhaseVisualStartedAt=performance.now();
      e.apexPhase=phase;
      e.apexPhaseEntered=phase;
      state.camera.shake=Math.max(state.camera.shake,11.8+phase*.8);
      state.flash=Math.max(state.flash,.025+phase*.008);
      if(typeof shockwave==='function')shockwave(e.x,e.y,'#ff7040',105+phase*18,.32,2.4+phase*.3);
      if(typeof audio?.tone==='function')audio.tone(58+phase*5,.22,'sawtooth',.018,-12);
    }else e.apexPhase=phase;
    return phase;
  }
  function clearLegacyOmegaState(e){
    e.forgeTidalCore=null;e.apexSetpieceCd=999;e.apexVariantCd=999;e.signatureCd=999;e.skillCd=999;e.burstCd=999;e.pulseCd=999;e.apexFrenzyCd=999;
  }

  // Disable the old shared Omega pattern grammar. omega-combat-v1 owns the replacement attacks.
  const baseApexBossSkill=typeof apexBossSkill==='function'?apexBossSkill:null;
  if(baseApexBossSkill){
    apexBossSkill=function omegaResetApexBossSkill(e,dt){
      if(!isOmega(e))return baseApexBossSkill(e,dt);
      computePhase(e,dt);e.timeLock=0;clearLegacyOmegaState(e);
    };
  }
  const baseApexPhaseDirector=typeof apexPhaseDirector==='function'?apexPhaseDirector:null;
  if(baseApexPhaseDirector){
    apexPhaseDirector=function omegaResetPhaseDirector(e,dt){
      if(!isOmega(e))return baseApexPhaseDirector(e,dt);
      e.apexPhaseEntered=e.apexPhase||1;clearLegacyOmegaState(e);
    };
  }
  const baseApexVariantAttack=typeof apexVariantAttack==='function'?apexVariantAttack:null;
  if(baseApexVariantAttack){
    apexVariantAttack=function omegaResetVariantAttack(e,phase){if(isOmega(e))return;return baseApexVariantAttack(e,phase);};
  }
  const baseBossAntiIdleSkill=typeof bossAntiIdleSkill==='function'?bossAntiIdleSkill:null;
  if(baseBossAntiIdleSkill){
    bossAntiIdleSkill=function omegaResetAntiIdle(e,dt){if(isOmega(e))return;return baseBossAntiIdleSkill(e,dt);};
  }

  // Remove the screen-locked hex/ray overlay. Keep only the warm stellar backdrop and stars.
  if(typeof drawForgeApex==='function'){
    drawForgeApex=function drawCleanForgeApex(){
      drawCachedBackdrop('apex-forge-clean',paintForgeBackdrop);
      drawStars(FORGE_STAR_PALETTE,.55);
    };
  }

  function activePlateSet(phase){return new Set(PHASE_PLATES[Math.max(1,Math.min(4,phase))]||PHASE_PLATES[1]);}
  function innerPlateCount(phase){return INNER_PLATES[Math.max(1,Math.min(4,phase))]??0;}
  function previousPlateSet(e){return activePlateSet(e.omegaPreviousPhase||Math.max(1,(e.apexPhase||1)-1));}
  function plateTransition(e){
    if(!Number.isFinite(e.omegaPhaseVisualStartedAt))return 1;
    return clamp01((performance.now()-e.omegaPhaseVisualStartedAt)/850);
  }
  function assemblyState(e=currentOmega()){
    const started=Number(e?.apexEntryRevealStartedAt);
    if(!Number.isFinite(started))return{active:!!entryTransition(),core:0,plates:0,elapsed:0};
    const elapsed=Math.max(0,(performance.now()-started)/1000);
    const core=easeOut(clamp01(elapsed/.42));
    const plates=easeOut(clamp01((elapsed-.58)/.72));
    return{active:!!entryTransition()||elapsed<1.34,core,plates,elapsed};
  }
  function plateAssemblyAmount(index,platesProgress){
    const order=ASSEMBLY_ORDER.indexOf(index),segment=1/PLATE_COUNT;
    return easeOut(clamp01((platesProgress-order*segment)/(segment*1.8)));
  }

  function drawSolarProminence(e,t,phaseHeat,index){
    const a=index/7*TAU-t*.11+(index%2)*.17,base=e.r*(.48+phaseHeat*.06),lift=e.r*(.18+phaseHeat*.16)*(1+.18*Math.sin(t*3.1+index*1.9));
    ctx.save();ctx.rotate(a);ctx.globalAlpha=.20+phaseHeat*.18;ctx.strokeStyle=index%2?'#ff7a31':'#ffd06a';ctx.lineWidth=2+phaseHeat*1.3;ctx.shadowColor='#ff4a18';ctx.shadowBlur=8+phaseHeat*10;
    ctx.beginPath();ctx.arc(base,0,lift,-1.15,1.15);ctx.stroke();ctx.restore();
  }
  function drawInnerContainment(e,t,assembly,phase){
    const count=innerPlateCount(phase);if(!count)return;
    const amount=assembly.active?assembly.plates:1;if(amount<=.001)return;
    const transition=plateTransition(e),previous=INNER_PLATES[e.omegaPreviousPhase||phase]??count,visible=Math.min(previous,count+Math.ceil((previous-count)*(1-transition)));
    for(let i=0;i<visible;i++){
      const retained=i<count,fade=retained?1:1-transition,a=i/Math.max(1,visible)*TAU-t*.045+(i%2?.08:-.05),rr=e.r*(.66+(retained?0:.16*transition));
      ctx.save();ctx.rotate(a);ctx.globalAlpha=fade*amount;ctx.fillStyle=i%2?'rgba(67,10,8,.82)':'rgba(38,6,5,.86)';ctx.strokeStyle=i%2?'#ff7c3d':'#ffd27a';ctx.lineWidth=2.2;
      ctx.beginPath();ctx.moveTo(rr,-e.r*.10);ctx.lineTo(rr+e.r*.28,-e.r*.07);ctx.lineTo(rr+e.r*.37,0);ctx.lineTo(rr+e.r*.28,e.r*.07);ctx.lineTo(rr,e.r*.10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
  }
  function drawSolarCore(e,t,assembly,phase){
    const pulse=.5+.5*Math.sin(t*3.2),phaseHeat=(phase-1)/3,scale=(.34+.66*assembly.core)*(1+phaseHeat*.14),surfaceR=e.r*(.56+phaseHeat*.05);
    ctx.save();ctx.scale(scale,scale);

    const haloR=e.r*(1.14+phaseHeat*.34+.06*pulse),halo=ctx.createRadialGradient(0,0,e.r*.12,0,0,haloR);
    halo.addColorStop(0,'rgba(255,255,242,.98)');halo.addColorStop(.15,'rgba(255,229,104,.90)');halo.addColorStop(.39,`rgba(255,103,31,${.62+.16*pulse})`);halo.addColorStop(.70,`rgba(187,28,9,${.25+.16*phaseHeat})`);halo.addColorStop(1,'rgba(110,5,0,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,haloR,0,TAU);ctx.fill();

    ctx.save();ctx.rotate(-t*(.22+.08*phaseHeat));const tongues=18;ctx.beginPath();
    for(let i=0;i<tongues*2;i++){const a=i/(tongues*2)*TAU,outer=i%2===0,wave=.5+.5*Math.sin(t*(4.4+phaseHeat*2)+i*1.73),rr=outer?e.r*(.76+phaseHeat*.18+wave*.16):e.r*(.54+((i>>1)%3)*.025),x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fillStyle=`rgba(255,70,21,${.52+.18*pulse+.10*phaseHeat})`;ctx.shadowColor='#ff4317';ctx.shadowBlur=14+phaseHeat*12;ctx.fill();ctx.restore();ctx.shadowBlur=0;

    const core=ctx.createRadialGradient(-e.r*.17,-e.r*.18,e.r*.025,0,0,surfaceR);
    core.addColorStop(0,'#fffef3');core.addColorStop(.12,'#fff2a0');core.addColorStop(.34,'#ffc13f');core.addColorStop(.58,'#ff641f');core.addColorStop(.79,'#bf2410');core.addColorStop(1,'#4a0502');
    ctx.fillStyle=core;ctx.shadowColor='#ff4b1f';ctx.shadowBlur=22+phase*4;ctx.beginPath();ctx.arc(0,0,surfaceR,0,TAU);ctx.fill();ctx.shadowBlur=0;

    ctx.save();ctx.beginPath();ctx.arc(0,0,surfaceR*.97,0,TAU);ctx.clip();ctx.rotate(t*.13);
    for(let i=0;i<6;i++){const y=(i-2.5)*e.r*.15+Math.sin(t*2.1+i*1.4)*e.r*.045;ctx.globalAlpha=.15+.08*((i+phase)%3);ctx.strokeStyle=i%2?'#fff1a0':'#ff8c34';ctx.lineWidth=e.r*(.035+.008*(i%3));ctx.beginPath();ctx.ellipse(0,y,e.r*(.46-.025*(i%2)),e.r*.10,.10*Math.sin(t+i),0,TAU);ctx.stroke();}
    for(let i=0;i<5;i++){const a=i*1.27+t*(i%2?.028:-.019),rr=e.r*(.18+.055*(i%3)),sr=e.r*(.035+.012*(i%2));ctx.globalAlpha=.20+.09*phaseHeat;ctx.fillStyle='#6b1208';ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr*.78,sr,0,TAU);ctx.fill();}ctx.restore();

    for(let i=0;i<7;i++)drawSolarProminence(e,t,phaseHeat,i);
    ctx.globalAlpha=.48+.22*pulse;ctx.strokeStyle='#ffd476';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,surfaceR*(1.06+.018*pulse),0,TAU);ctx.stroke();drawInnerContainment(e,t,assembly,phase);ctx.restore();
  }
  function drawArmorPlate(e,index,t,amount,alpha=1,outward=0,drift=0){
    if(amount<=.001||alpha<=.001)return;
    const combat=window.stackfallOmegaCombatPlateTransform?.(e,index);if(combat){outward+=Number(combat.outward)||0;drift+=Number(combat.drift)||0;alpha*=Number.isFinite(combat.alpha)?combat.alpha:1;}
    const a=index/PLATE_COUNT*TAU+t*.025+drift,finalInner=e.r*.45,spawnInner=e.r*2.45,inner=spawnInner+(finalInner-spawnInner)*amount+outward;
    const long=index%2===0,outer=inner+e.r*(long?1.68:1.28),half=e.r*.42;
    ctx.save();ctx.rotate(a);ctx.globalAlpha=alpha*amount;ctx.fillStyle=long?'#3d0d07':'#190706';ctx.strokeStyle=long?'#ffe09a':'#ff6a32';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(inner,-half*.42);ctx.lineTo(outer-e.r*.32,-half);ctx.lineTo(outer,0);ctx.lineTo(outer-e.r*.32,half);ctx.lineTo(inner,half*.42);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function drawOmegaBody(e){
    const t=e.phase||0,phase=Math.max(1,Math.min(4,e.apexPhase||1)),assembly=assemblyState(e),active=activePlateSet(phase),prev=previousPlateSet(e),transition=plateTransition(e);ctx.save();drawSolarCore(e,t,assembly,phase);
    for(let i=0;i<PLATE_COUNT;i++){const assemble=assembly.active?plateAssemblyAmount(i,assembly.plates):1;if(active.has(i))drawArmorPlate(e,i,t,assemble,1);if(!active.has(i)&&prev.has(i)&&transition<1){const q=easeOut(transition);drawArmorPlate(e,i,t,1,1-q,e.r*q*.88,(i%2?1:-1)*q*.16);}}ctx.restore();
  }

  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(baseDrawEliteShape)drawEliteShape=function drawOmegaProductionShape(e){if(isOmega(e))return drawOmegaBody(e);return baseDrawEliteShape(e);};

  function cleanOmegaHud(){const e=currentOmega();if(!e)return;const name=typeof bossName==='function'?bossName(FORM):'종말 항성 오메가';for(const row of document.querySelectorAll('#multiBossBars .multi-boss-row')){if(!(row.textContent||'').includes(name))continue;const kind=row.querySelector('span b');if(kind)kind.textContent=GAME_SETTINGS.language==='ko'?'초월체':'APEX';}}
  const baseUpdateHUD=typeof updateHUD==='function'?updateHUD:null;if(baseUpdateHUD)updateHUD=function updateHudWithoutOmegaPhase(){const result=baseUpdateHUD();cleanOmegaHud();return result;};

  window.stackfallOmegaProductionDiagnostics=()=>{const e=currentOmega(),a=assemblyState(e);if(!e)return null;const phase=Math.max(1,Math.min(4,e.apexPhase||1));return{version:'v1',phase,activePlates:[...activePlateSet(phase)],plateCount:activePlateSet(phase).size,innerPlateCount:innerPlateCount(phase),entry:{active:a.active,elapsed:a.elapsed,core:a.core,plates:a.plates},legacyAttacksDisabled:true,forgeTidalCore:!!e.forgeTidalCore};};
})();
