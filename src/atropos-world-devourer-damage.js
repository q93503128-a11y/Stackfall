// Branch-only damage model for the World Devourer Atropos prototype.
// Player durability remains meaningful: all six patterns scale from normal Apex boss damage and
// still enter the canonical hurtPlayer pipeline at the attack site.
(()=>{
  const apexBaseDamage=e=>Math.max(7,(Number(e?.damage)||0)*.40);
  const DAMAGE_MULTIPLIERS=Object.freeze({giantCrossing:.95,tailSever:1.05,tailRupture:.72,voidMaw:1.35,devourerRing:1.10,pastTrajectory:.92,worldDevour:1.75});
  const patternDamage=(e,key)=>apexBaseDamage(e)*(DAMAGE_MULTIPLIERS[key]??1);
  window.stackfallAtroposPatternDamage=patternDamage;
  window.stackfallAtroposDamageDiagnostics=()=>({model:'boss-damage-scaled-v2-direct',usesPlayerMaxHp:false,base:'max(7, boss.damage * 0.40)',multipliers:{...DAMAGE_MULTIPLIERS},globalHurtPlayerOverride:false});
})();
