// Past Trajectory was removed with the oversized Atropos prototype. Keep compatibility hooks only.
(()=>{
  window.stackfallTriggerAtroposPastTrajectory=()=>false;
  window.stackfallAtroposPastDiagnostics=()=>({active:false,stage:'removed',age:0});
})();
