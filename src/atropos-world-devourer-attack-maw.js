// Simplified Atropos pattern 2: short suction then bite.
(()=>{
  const start=()=>window.stackfallAtroposSimpleStart?.('devour')===true;
  window.stackfallTriggerAtroposDevour=start;
  window.stackfallTriggerAtroposVoidMaw=start; // compatibility
  window.stackfallAtroposDevourDiagnostics=()=>{const d=window.stackfallAtroposSimpleDiagnostics?.();const age=d?.attack==='devour'?d.attackAge:0;return{active:d?.attack==='devour',stage:d?.attack==='devour'?(age<.75?'warn':age<1.50?'suction':age<1.84?'bite':'recover'):'idle',age};};
  window.stackfallAtroposMawDiagnostics=window.stackfallAtroposDevourDiagnostics;
})();
