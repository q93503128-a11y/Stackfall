// Simplified Atropos director. The core owns timing; this file exposes reviewed four-pattern state.
(()=>{
  window.stackfallAtroposDirectorDiagnostics=()=>{
    const d=window.stackfallAtroposSimpleDiagnostics?.();
    return{active:!!d?.active,version:'simple-four-pattern-v1',phase:d?.phase||0,attack:d?.attack||null,cooldown:d?.cooldown||0,patterns:['charge','devour','tail','worldBite']};
  };
  window.stackfallAtroposPrototypeAttackState='simple-four-pattern-v1';
})();
