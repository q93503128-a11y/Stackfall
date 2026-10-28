// Simplified Atropos pattern 1: straight charge.
(()=>{
  const start=()=>window.stackfallAtroposSimpleStart?.('charge')===true;
  window.stackfallTriggerAtroposCharge=start;
  window.stackfallTriggerAtroposGiantCrossing=start; // compatibility
  window.stackfallTriggerAtroposTailSever=()=>false;
  window.stackfallAtroposChargeDiagnostics=()=>{const d=window.stackfallAtroposSimpleDiagnostics?.();return{active:d?.attack==='charge',stage:d?.attack==='charge'?(d.attackAge<.68?'warn':d.attackAge<1.30?'dash':'recover'):'idle',age:d?.attack==='charge'?d.attackAge:0};};
  window.stackfallAtroposCombatDiagnostics=()=>({crossing:window.stackfallAtroposChargeDiagnostics?.(),tail:null});
})();
