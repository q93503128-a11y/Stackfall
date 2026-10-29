// Last Constellation reset v1.
// Clean combat slate: legacy patterns stay disabled while production structure owns phase progression.
(()=>{
  if(window.stackfallLastConstellationReset==='v1')return;
  window.stackfallLastConstellationReset='v1';
  const FORM='lastconstellation';
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const phaseOnly=(e,dt)=>{
    e.apexElapsed=(e.apexElapsed||0)+Math.max(0,Number(dt)||0);
    // v2 structure advances only when every exposed node in the current layer is destroyed.
    e.apexPhase=Math.max(1,Math.min(4,Number(e.lcStructure?.phase)||Number(e.apexPhase)||1));e.timeLock=0;
    e.skillCd=999;e.burstCd=999;e.pulseCd=999;e.signatureCd=999;e.apexVariantCd=999;e.apexSetpieceCd=999;
    e.constellationSweep=null;e.teleportQueued=false;
  };

  // Remove the screen-space constellation drawing/pentagram. Keep only the authored dark star field.
  if(typeof drawConstellationApex==='function'){
    drawConstellationApex=function drawConstellationBackdropOnly(){
      drawCachedBackdrop('apex-constellation',paintConstellationBackdrop);
      drawStars(CONSTELLATION_STAR_PALETTE,1);
    };
  }

  // Suppress every legacy Last Constellation combat producer while preserving structural phase progression.
  const baseApexBossSkill=typeof apexBossSkill==='function'?apexBossSkill:null;
  if(baseApexBossSkill)apexBossSkill=function lastConstellationNoPatterns(e,dt){if(isLC(e)){phaseOnly(e,dt);return;}return baseApexBossSkill(e,dt);};
  const baseApexPhaseDirector=typeof apexPhaseDirector==='function'?apexPhaseDirector:null;
  if(baseApexPhaseDirector)apexPhaseDirector=function lastConstellationNoDirector(e,dt){if(isLC(e))return;return baseApexPhaseDirector(e,dt);};
  const baseBossAntiIdleSkill=typeof bossAntiIdleSkill==='function'?bossAntiIdleSkill:null;
  if(baseBossAntiIdleSkill)bossAntiIdleSkill=function lastConstellationNoAntiIdle(e,dt){if(isLC(e))return;return baseBossAntiIdleSkill(e,dt);};

  let cleaned=false;
  function cleanupLegacyObjects(){
    const e=state.entities.enemies?.find(isLC);if(!e)return;
    if(!cleaned){cleaned=true;clearPendingCombatActions?.();}
    e.constellationSweep=null;e.teleportQueued=false;
    if(Array.isArray(state.entities.telegraphs))state.entities.telegraphs=state.entities.telegraphs.filter(t=>!String(t?.impactStyle||'').includes('constellation')&&t?.impactStyle!=='teleport-arrival');
    for(const key of['enemyProjectiles','hostileProjectiles','enemyBullets']){
      const arr=state.entities?.[key];if(!Array.isArray(arr))continue;
      for(let i=arr.length-1;i>=0;i--){const p=arr[i],tag=String(p?.visual||p?.style||p?.kind||p?.type||'');if(tag.includes('constellation'))arr.splice(i,1);}
    }
    for(const m of state.entities.enemies||[])if(m?.eventKind==='apex-herald')m.dead=true;
  }
  const baseUpdateEnemies=typeof updateEnemies==='function'?updateEnemies:null;
  if(baseUpdateEnemies)updateEnemies=function updateEnemiesWithConstellationReset(dt){cleanupLegacyObjects();return baseUpdateEnemies(dt);};

  window.stackfallLastConstellationResetDiagnostics=()=>{const e=state.entities.enemies?.find(isLC)||null;return{version:'v1',active:!!e,phase:e?.lcStructure?.phase||e?.apexPhase||null,patternsSuppressed:true,screenSpaceConstellationBackground:false,phaseSource:e?.lcStructure?'node-destruction':'pending-structure'};};
})();