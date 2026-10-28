// Simplified Atropos damage model. All damage remains boss-scaled and uses the normal hurtPlayer pipeline.
(()=>{
  const apexBaseDamage=e=>Math.max(7,(Number(e?.damage)||0)*.40);
  const DAMAGE_MULTIPLIERS=Object.freeze({charge:.95,devour:1.25,tail:1.05,worldBite:1.55,giantCrossing:.95,voidMaw:1.25,tailSever:1.05,worldDevour:1.55});
  window.stackfallAtroposPatternDamage=(e,key)=>apexBaseDamage(e)*(DAMAGE_MULTIPLIERS[key]??1);
  window.stackfallAtroposDamageDiagnostics=()=>({model:'simple-boss-damage-v1',usesPlayerMaxHp:false,base:'max(7, boss.damage * 0.40)',multipliers:{...DAMAGE_MULTIPLIERS},globalHurtPlayerOverride:false});
})();
