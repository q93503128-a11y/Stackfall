// Simplified Atropos pattern 3: tail sweep.
(()=>{
  const start=()=>window.stackfallAtroposSimpleStart?.('tail')===true;
  window.stackfallTriggerAtroposTailSweep=start;
  window.stackfallTriggerAtroposDevourerRing=start; // compatibility
  window.stackfallAtroposTailDiagnostics=()=>{const d=window.stackfallAtroposSimpleDiagnostics?.();const age=d?.attack==='tail'?d.attackAge:0;return{active:d?.attack==='tail',stage:d?.attack==='tail'?(age<.72?'warn':age<1.28?'sweep':'recover'):'idle',age};};
  window.stackfallAtroposRingDiagnostics=window.stackfallAtroposTailDiagnostics;
})();
