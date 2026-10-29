// Starforge Omega production reset v1.
// Old Omega attacks are intentionally disabled so the boss can be rebuilt from a clean combat slate.
// This pass owns only the stripped forge backdrop, red stellar core, armor-shell progression,
// phase-driven plate shedding, and the core->armor entry assembly.
(()=>{
  if(window.stackfallOmegaProduction==='v1')return;
  window.stackfallOmegaProduction='v1';

  const FORM='starforge',PLATE_COUNT=8;
  const PHASE_PLATES={
    1:[0,1,2,3,4,5,6,7],
    2:[0,1,2,4,5,6],
    3:[0,2,4,6],
    4:[1,5]
  };
  const ASSEMBLY_ORDER=[0,4,2,6,1,5,3,7];
  const isOmega=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const clamp01=v=>clamp(v,0,1);
  const easeOut=t=>1-Math.pow(1-clamp01(t),3);
  const entryTransition=()=>{const tr=state.realmTransition;return tr?.owner==='apex-entry'&&(state.apexArena?.form||state.pendingApexForm||tr?.form)===FORM?tr:null;};
  const entryProgress=()=>{const tr=entryTransition();return tr?clamp01((Number(tr.elapsed)||0)/Math.max(.001,Number(tr.duration)||1)):1;};

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

  // Clean combat slate: Omega intentionally has no attacks until the replacement pattern pass.
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
  function previousPlateSet(e){return activePlateSet(e.omegaPreviousPhase||Math.max(1,(e.apexPhase||1)-1));}
  function plateTransition(e){
    if(!Number.isFinite(e.omegaPhaseVisualStartedAt))return 1;
    return clamp01((performance.now()-e.omegaPhaseVisualStartedAt)/850);
  }
  function assemblyState(){
    const tr=entryTransition();
    if(!tr)return{active:false,core:1,plates:1,progress:1};
    const p=entryProgress(),q=clamp01((p-.30)/.37);
    return{active:true,progress:p,core:easeOut(clamp01(q/.30)),plates:easeOut(clamp01((q-.24)/.76))};
  }
  function plateAssemblyAmount(index,platesProgress){
    const order=ASSEMBLY_ORDER.indexOf(index),segment=1/PLATE_COUNT;
    return easeOut(clamp01((platesProgress-order*segment)/(segment*1.8)));
  }
  function drawSolarCore(e,t,assembly,phase){
    const pulse=.5+.5*Math.sin(t*3.2),phaseHeat=(phase-1)/3,scale=(.34+.66*assembly.core)*(1+phaseHeat*.12);
    ctx.save();ctx.scale(scale,scale);
    const haloR=e.r*(1.04+phaseHeat*.18),halo=ctx.createRadialGradient(0,0,e.r*.10,0,0,haloR);
    halo.addColorStop(0,'rgba(255,255,235,.95)');halo.addColorStop(.18,'rgba(255,221,102,.82)');halo.addColorStop(.48,`rgba(255,87,28,${.48+.14*pulse})`);halo.addColorStop(1,'rgba(130,8,0,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,haloR,0,TAU);ctx.fill();

    // Uneven flame crown makes the center read as a contained red sun, not a gauge.
    ctx.save();ctx.rotate(-t*.24);ctx.fillStyle=`rgba(255,90,28,${.48+.22*pulse})`;
    const flames=14;
    ctx.beginPath();
    for(let i=0;i<flames*2;i++){
      const a=i/(flames*2)*TAU,outer=i%2===0,ecc=outer?e.r*(.76+phaseHeat*.10):e.r*(.53+((i>>1)%3)*.035),rr=outer?ecc*(.92+.16*Math.sin(t*4.4+i*1.7)):ecc;
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.fill();ctx.restore();

    const core=ctx.createRadialGradient(-e.r*.18,-e.r*.20,e.r*.04,0,0,e.r*.58);
    core.addColorStop(0,'#fffef0');core.addColorStop(.18,'#ffe369');core.addColorStop(.48,'#ff5b20');core.addColorStop(.78,'#a71508');core.addColorStop(1,'#300200');
    ctx.fillStyle=core;ctx.shadowColor='#ff4b1f';ctx.shadowBlur=18+phase*3;
    ctx.beginPath();ctx.arc(0,0,e.r*.54,0,TAU);ctx.fill();ctx.shadowBlur=0;
    ctx.globalAlpha=.52+.24*pulse;ctx.strokeStyle='#ffd27a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,e.r*(.59+.025*pulse),0,TAU);ctx.stroke();
    ctx.restore();
  }
  function drawArmorPlate(e,index,t,amount,alpha=1,outward=0,drift=0){
    if(amount<=.001||alpha<=.001)return;
    const a=index/PLATE_COUNT*TAU+t*.025+drift,finalInner=e.r*.45,spawnInner=e.r*2.45,inner=spawnInner+(finalInner-spawnInner)*amount+outward;
    const long=index%2===0,outer=inner+e.r*(long?1.68:1.28),half=e.r*.42;
    ctx.save();ctx.rotate(a);ctx.globalAlpha=alpha*amount;ctx.fillStyle=long?'#3d0d07':'#190706';ctx.strokeStyle=long?'#ffe09a':'#ff6a32';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(inner,-half*.42);ctx.lineTo(outer-e.r*.32,-half);ctx.lineTo(outer,0);ctx.lineTo(outer-e.r*.32,half);ctx.lineTo(inner,half*.42);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function drawOmegaBody(e){
    const t=e.phase||0,phase=Math.max(1,Math.min(4,e.apexPhase||1)),assembly=assemblyState(),active=activePlateSet(phase),prev=previousPlateSet(e),transition=plateTransition(e);
    ctx.save();
    drawSolarCore(e,t,assembly,phase);

    for(let i=0;i<PLATE_COUNT;i++){
      const assemble=assembly.active?plateAssemblyAmount(i,assembly.plates):1;
      if(active.has(i))drawArmorPlate(e,i,t,assemble,1);
      if(!active.has(i)&&prev.has(i)&&transition<1){
        const q=easeOut(transition);drawArmorPlate(e,i,t,1,1-q,e.r*q*.88,(i%2?1:-1)*q*.16);
      }
    }
    ctx.restore();
  }

  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(baseDrawEliteShape){
    drawEliteShape=function drawOmegaProductionShape(e){if(isOmega(e))return drawOmegaBody(e);return baseDrawEliteShape(e);};
  }

  // Phase is communicated by shell exposure, not P1/P2/P3/P4 text.
  function cleanOmegaHud(){
    const e=currentOmega();if(!e)return;
    const name=typeof bossName==='function'?bossName(FORM):'종말 항성 오메가';
    for(const row of document.querySelectorAll('#multiBossBars .multi-boss-row')){
      if(!(row.textContent||'').includes(name))continue;
      const kind=row.querySelector('span b');if(kind)kind.textContent=GAME_SETTINGS.language==='ko'?'초월체':'APEX';
    }
  }
  const baseUpdateHUD=typeof updateHUD==='function'?updateHUD:null;
  if(baseUpdateHUD)updateHUD=function updateHudWithoutOmegaPhase(){const result=baseUpdateHUD();cleanOmegaHud();return result;};

  window.stackfallOmegaProductionDiagnostics=()=>{
    const e=currentOmega(),a=assemblyState();if(!e)return null;
    const phase=Math.max(1,Math.min(4,e.apexPhase||1));
    return{version:'v1',phase,activePlates:[...activePlateSet(phase)],plateCount:activePlateSet(phase).size,entry:{active:a.active,progress:a.progress,core:a.core,plates:a.plates},legacyAttacksDisabled:true,forgeTidalCore:!!e.forgeTidalCore};
  };
})();
