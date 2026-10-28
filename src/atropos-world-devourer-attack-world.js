// Simplified Atropos pattern 4: moderate World Bite signature attack.
(()=>{
  const start=()=>window.stackfallAtroposSimpleStart?.('world')===true;
  window.stackfallTriggerAtroposWorldBite=start;
  window.stackfallTriggerAtroposWorldDevour=start; // compatibility
  window.stackfallAtroposWorldBiteDiagnostics=()=>{const d=window.stackfallAtroposSimpleDiagnostics?.();const age=d?.attack==='world'?d.attackAge:0;return{active:d?.attack==='world',stage:d?.attack==='world'?(age<1.05?'warn':age<1.52?'bite':'recover'):'idle',age};};
  window.stackfallAtroposWorldDevourDiagnostics=window.stackfallAtroposWorldBiteDiagnostics;
})();
