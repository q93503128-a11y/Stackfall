window.STACKFALL_BUILD_SHA="sha256-7bff664e040b45d0b25efec709b6ca33ab2a02005ac753755a5c14c5b859c07a";
window.STACKFALL_BUILD_ASSETS=["favicon.svg","feature-pack.css","googlea1b39620fd8849c7.html","index.html","settings.css","site.webmanifest","src/ability-ledger-audit.js","src/apex-entry-camera-v1.js","src/apex-identity-combat-v1.js","src/apex-run-clock.js","src/atropos-combat-escalation-v1.js","src/atropos-hud-cleanup-v1.js","src/atropos-phase-production-v1.js","src/atropos-production-polish-v2.js","src/atropos-time-shear-v1.js","src/bootstrap.js","src/boss-body-parts.js","src/boss-catalog.js","src/boss-patterns.js","src/bosses.js","src/build-audit-ui.js","src/canonical-weapon-visuals.js","src/combat-balance-refinement.js","src/combat-guidance-refinement.js","src/community-feedback-refinement.js","src/core.js","src/dark-cosmic-polish.js","src/dev-tools-endless.js","src/dev-tools.js","src/difficulty-augment-expansion.js","src/elite-renderers.js","src/endgame-balance-expansion.js","src/endless-progression.js","src/feature-pack.js","src/gpu-renderer.js","src/interface.js","src/language-pack.js","src/map-event-expansion.js","src/meta-progression.js","src/meta-upgrades.js","src/performance-guard.js","src/progression-expansion.js","src/realm-backgrounds.js","src/render-entities.js","src/render-space.js","src/render.js","src/reward-refinement.js","src/run-damage-stats.js","src/run-modes.js","src/runtime-config.js","src/runtime-controls.js","src/settings.js","src/sortie-prep.js","src/stage-catalog.js","src/stage-constellation-backgrounds.js","src/stage-craft.js","src/stage-map.js","src/stage-physical-objects.js","src/stage-runtime.js","src/stage01-polish.js","src/stage01-remodel.js","src/systems-base.js","src/systems.js","src/targeting-motion-refinement.js","src/weapon-awakening-effects-a1-a7.js","src/weapon-awakening-effects-a14-a19.js","src/weapon-awakening-effects-a8-a13.js","src/weapon-awakening.js","src/weapons.js","stage-runtime.css","styles.css"];
window.addEventListener('load',()=>{
  const loadApexEntryCamera=()=>{
    if(document.querySelector('script[data-apex-entry-camera-v1]'))return;
    const cameraScript=document.createElement('script');cameraScript.src='src/apex-entry-camera-v1.js';cameraScript.dataset.apexEntryCameraV1='1';document.body.appendChild(cameraScript);
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
  loadApexEntryCamera();
  if(!document.querySelector('script[data-apex-identity-combat-v1]')){const script=document.createElement('script');script.src='src/apex-identity-combat-v1.js';script.dataset.apexIdentityCombatV1='1';script.onload=loadAtroposPhase;document.body.appendChild(script);}else loadAtroposPhase();
  setTimeout(loadAtroposPhase,0);
},{once:true});
