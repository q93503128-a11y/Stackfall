// Endless Apex cinematic cleanup v1.
// Apex introductions use Stackfall's canonical DOM boss notice only.
// On Apex defeat, keep the victory text but suppress the decorative foreground signature.
(()=>{
  if(window.stackfallApexEntryCleanup==='v1')return;
  window.stackfallApexEntryCleanup='v1';

  const isApexEntry=()=>state?.realmTransition?.owner==='apex-entry';
  const isApexExit=()=>state?.realmTransition?.owner==='apex-exit';
  const baseDrawRealmCinematicOverlay=typeof drawRealmCinematicOverlay==='function'?drawRealmCinematicOverlay:null;
  const baseDrawTransitionSignature=typeof drawTransitionSignature==='function'?drawTransitionSignature:null;

  if(baseDrawTransitionSignature){
    drawTransitionSignature=function drawTransitionSignatureWithoutApexExitWriggle(tr,p,fade){
      if(isApexExit())return;
      return baseDrawTransitionSignature(tr,p,fade);
    };
  }

  if(baseDrawRealmCinematicOverlay){
    drawRealmCinematicOverlay=function drawRealmCinematicOverlayWithoutDuplicateApexCard(){
      // Entry keeps the realm/background transition, camera pan, bossNotice, shake and
      // boss-specific manifestation. Only the duplicate canvas card is removed.
      if(isApexEntry())return;
      // Exit still shows the canonical defeat title/subtitle; the foreground signature
      // is suppressed separately above so no decorative shape wriggles in front.
      return baseDrawRealmCinematicOverlay();
    };
  }

  window.stackfallApexEntryCleanupDiagnostics=()=>({
    version:'v1',
    entryActive:isApexEntry(),
    exitActive:isApexExit(),
    duplicateEntryCanvasOverlaySuppressed:true,
    apexExitForegroundSignatureSuppressed:true,
    canonicalBossNotice:!!ui?.bossNotice
  });
})();
