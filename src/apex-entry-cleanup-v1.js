// Endless Apex entry cleanup v1.
// Apex introductions use Stackfall's canonical DOM boss notice only.
// The generic realm-transition canvas signature/title used to duplicate the name,
// cover the manifestation, and obscure boss-specific entry animation.
(()=>{
  if(window.stackfallApexEntryCleanup==='v1')return;
  window.stackfallApexEntryCleanup='v1';

  const isApexEntry=()=>state?.realmTransition?.owner==='apex-entry';
  const baseDrawRealmCinematicOverlay=typeof drawRealmCinematicOverlay==='function'?drawRealmCinematicOverlay:null;

  if(baseDrawRealmCinematicOverlay){
    drawRealmCinematicOverlay=function drawRealmCinematicOverlayWithoutDuplicateApexCard(){
      // Keep the realm/background transition, camera pan, bossNotice, shake and the
      // boss-specific manifestation. Only remove the duplicate canvas icon/title card.
      if(isApexEntry())return;
      return baseDrawRealmCinematicOverlay();
    };
  }

  window.stackfallApexEntryCleanupDiagnostics=()=>({
    version:'v1',
    active:isApexEntry(),
    duplicateCanvasOverlaySuppressed:true,
    canonicalBossNotice:!!ui?.bossNotice
  });
})();
