window.STACKFALL_BUILD_SHA="sha256-2f2786c4960fc0802e7100b8f4dfd11f692eded9a52567abd315c5b7368b7efa";
window.STACKFALL_BUILD_ASSETS=["favicon.svg","feature-pack.css","googlea1b39620fd8849c7.html","index.html","settings.css","site.webmanifest","src/ability-ledger-audit.js","src/apex-constellation-legacy-v2.js","src/apex-entry-camera-v1.js","src/apex-entry-cleanup-v1.js","src/apex-identity-combat-v1.js","src/apex-reward-balance-v1.js","src/apex-run-clock.js","src/apex-starforge-legacy-v2.js","src/atropos-combat-escalation-v1.js","src/atropos-hud-cleanup-v1.js","src/atropos-phase-production-v1.js","src/atropos-production-polish-v2.js","src/atropos-time-shear-v1.js","src/atropos-visual-v5.js","src/bootstrap.js","src/boss-body-parts.js","src/boss-catalog.js","src/boss-patterns.js","src/bosses.js","src/build-audit-ui.js","src/canonical-weapon-visuals.js","src/combat-balance-refinement.js","src/combat-guidance-refinement.js","src/community-feedback-refinement.js","src/core.js","src/dark-cosmic-polish.js","src/dev-tools-endless.js","src/dev-tools.js","src/difficulty-augment-expansion.js","src/elite-renderers.js","src/endgame-balance-expansion.js","src/endless-progression.js","src/feature-pack.js","src/field-pickups.js","src/gpu-renderer.js","src/interface.js","src/language-pack.js","src/last-constellation-combat-v2.js","src/last-constellation-hit-routing-v1.js","src/last-constellation-presentation-v3.js","src/last-constellation-production-v1.js","src/last-constellation-reset-v1.js","src/map-event-expansion.js","src/meta-progression.js","src/meta-upgrades.js","src/omega-combat-v1.js","src/omega-production-v1.js","src/performance-guard.js","src/player-hit-invulnerability-v2.js","src/progression-expansion.js","src/realm-backgrounds.js","src/render-entities.js","src/render-space.js","src/render.js","src/reward-refinement.js","src/run-damage-stats.js","src/run-modes.js","src/runtime-config.js","src/runtime-controls.js","src/settings.js","src/sortie-prep.js","src/stage-catalog.js","src/stage-constellation-backgrounds.js","src/stage-craft.js","src/stage-map.js","src/stage-physical-objects.js","src/stage-runtime.js","src/stage01-polish.js","src/stage01-remodel.js","src/systems-base.js","src/systems.js","src/targeting-motion-refinement.js","src/weapon-awakening-effects-a1-a7.js","src/weapon-awakening-effects-a14-a19.js","src/weapon-awakening-effects-a8-a13.js","src/weapon-awakening.js","src/weapons.js","stage-runtime.css","styles.css"];
window.addEventListener('load',()=>{
  const loadApexConstellationLegacy=()=>{
    if(window.stackfallConstellationLegacy==='v2'||document.querySelector('script[data-apex-constellation-legacy-v2]'))return;
    if(window.stackfallApexLegacyMaxStacks!==3){setTimeout(loadApexConstellationLegacy,35);return;}
    const legacyScript=document.createElement('script');legacyScript.src='src/apex-constellation-legacy-v2.js';legacyScript.dataset.apexConstellationLegacyV2='1';document.body.appendChild(legacyScript);
  };
  const loadApexStarforgeLegacy=()=>{
    if(window.stackfallStarforgeLegacy==='v2'||document.querySelector('script[data-apex-starforge-legacy-v2]'))return;
    if(window.stackfallApexLegacyMaxStacks!==3){setTimeout(loadApexStarforgeLegacy,35);return;}
    const legacyScript=document.createElement('script');legacyScript.src='src/apex-starforge-legacy-v2.js';legacyScript.dataset.apexStarforgeLegacyV2='1';document.body.appendChild(legacyScript);
  };
  const loadApexRewardBalance=()=>{
    if(document.querySelector('script[data-apex-reward-balance-v1]')){loadApexStarforgeLegacy();loadApexConstellationLegacy();return;}
    const balanceScript=document.createElement('script');balanceScript.src='src/apex-reward-balance-v1.js';balanceScript.dataset.apexRewardBalanceV1='1';balanceScript.onload=()=>{loadApexStarforgeLegacy();loadApexConstellationLegacy();};document.body.appendChild(balanceScript);
  };
  const loadApexEntryCleanup=()=>{
    if(document.querySelector('script[data-apex-entry-cleanup-v1]'))return;
    const cleanupScript=document.createElement('script');cleanupScript.src='src/apex-entry-cleanup-v1.js';cleanupScript.dataset.apexEntryCleanupV1='1';document.body.appendChild(cleanupScript);
  };
  const loadApexEntryCamera=()=>{
    if(document.querySelector('script[data-apex-entry-camera-v1]'))return;
    const cameraScript=document.createElement('script');cameraScript.src='src/apex-entry-camera-v1.js';cameraScript.dataset.apexEntryCameraV1='1';document.body.appendChild(cameraScript);
  };
  const loadOmegaCombat=()=>{
    if(document.querySelector('script[data-omega-combat-v1]'))return;
    if(window.stackfallOmegaProduction!=='v1'){setTimeout(loadOmegaCombat,35);return;}
    const combatScript=document.createElement('script');combatScript.src='src/omega-combat-v1.js';combatScript.dataset.omegaCombatV1='1';document.body.appendChild(combatScript);
  };
  const loadOmegaProduction=()=>{
    if(document.querySelector('script[data-omega-production-v1]')){loadOmegaCombat();return;}
    if(window.stackfallApexIdentityCombat!=='v1'||window.stackfallApexVisualRestore!=='pre-9af0cdec-2026-07-20'){setTimeout(loadOmegaProduction,35);return;}
    const omegaScript=document.createElement('script');omegaScript.src='src/omega-production-v1.js';omegaScript.dataset.omegaProductionV1='1';omegaScript.onload=loadOmegaCombat;document.body.appendChild(omegaScript);
  };
  const loadAtroposHud=()=>{
    if(document.querySelector('script[data-atropos-hud-cleanup-v1]'))return;
    const hudScript=document.createElement('script');hudScript.src='src/atropos-hud-cleanup-v1.js';hudScript.dataset.atroposHudCleanupV1='1';document.body.appendChild(hudScript);
  };
  const loadAtroposPolish=()=>{
    if(document.querySelector('script[data-atropos-production-polish-v2]')){loadAtroposHud();return;}
    if(window.stackfallAtroposCombatEscalation!=='v1'){setTimeout(loadAtroposPolish,35);return;}
    const polishScript=document.createElement('script');polishScript.src='src/atropos-production-polish-v2.js';polishScript.dataset.atroposProductionPolishV2='1';polishScript.onload=loadAtroposHud;document.body.appendChild(polishScript);
  };
  const loadAtroposEscalation=()=>{
    if(document.querySelector('script[data-atropos-combat-escalation-v1]')){loadAtroposPolish();return;}
    if(window.stackfallAtroposPhaseProduction!=='v1'||window.stackfallAtroposTimeShear!=='v1'){setTimeout(loadAtroposEscalation,35);return;}
    const combatScript=document.createElement('script');combatScript.src='src/atropos-combat-escalation-v1.js';combatScript.dataset.atroposCombatEscalationV1='1';combatScript.onload=loadAtroposPolish;document.body.appendChild(combatScript);
  };
  const loadAtroposShear=()=>{
    if(document.querySelector('script[data-atropos-time-shear-v1]')){loadAtroposEscalation();return;}
    if(window.stackfallAtroposPhaseProduction!=='v1'){setTimeout(loadAtroposShear,35);return;}
    const shearScript=document.createElement('script');shearScript.src='src/atropos-time-shear-v1.js';shearScript.dataset.atroposTimeShearV1='1';shearScript.onload=loadAtroposEscalation;document.body.appendChild(shearScript);
  };
  const loadAtroposPhase=()=>{
    if(document.querySelector('script[data-atropos-phase-production-v1]')){loadAtroposShear();return;}
    if(window.stackfallApexIdentityCombat!=='v1'||window.stackfallApexVisualRestore!=='pre-9af0cdec-2026-07-20'){setTimeout(loadAtroposPhase,35);return;}
    const phaseScript=document.createElement('script');phaseScript.src='src/atropos-phase-production-v1.js';phaseScript.dataset.atroposPhaseProductionV1='1';phaseScript.onload=loadAtroposShear;document.body.appendChild(phaseScript);
  };
  loadApexRewardBalance();
  loadApexEntryCleanup();
  loadApexEntryCamera();
  if(!document.querySelector('script[data-apex-identity-combat-v1]')){
    const script=document.createElement('script');script.src='src/apex-identity-combat-v1.js';script.dataset.apexIdentityCombatV1='1';script.onload=()=>{loadOmegaProduction();loadAtroposPhase();};document.body.appendChild(script);
  }else{loadOmegaProduction();loadAtroposPhase();}
  setTimeout(loadApexRewardBalance,0);
  setTimeout(loadOmegaProduction,0);
  setTimeout(loadAtroposPhase,0);
},{once:true});
