// Branch-only damage model for the World Devourer Atropos prototype.
// Keep player HP investment meaningful: Atropos attacks scale from the boss' normal Apex damage,
// never from player.maxHp. All damage still flows through the canonical hurtPlayer pipeline.
(()=>{
  if(typeof hurtPlayer!=='function')return;
  const baseHurtPlayer=hurtPlayer;
  const apexBaseDamage=e=>Math.max(7,(Number(e?.damage)||0)*.40);
  const DAMAGE_MULTIPLIERS=Object.freeze({giantCrossing:.95,tailSever:1.05,tailRupture:.72,voidMaw:1.35,devourerRing:1.10,pastTrajectory:.92,worldDevour:1.75});
  const patternDamage=(e,key)=>apexBaseDamage(e)*(DAMAGE_MULTIPLIERS[key]??1);
  window.stackfallAtroposPatternDamage=patternDamage;
  function worldDevourerDamage(e){
    if(!e||e.apexForm!=='chronophage'||!e.atroposReborn?.worldDevourer)return null;
    const s=e.atroposReborn.worldDevourer;
    if(s.worldDevourPrototype)return patternDamage(e,'worldDevour');
    if(s.pastPrototype)return patternDamage(e,'pastTrajectory');
    if(s.ringPrototype)return patternDamage(e,'devourerRing');
    if(s.mawPrototype)return patternDamage(e,'voidMaw');
    if(s.tailSeverPrototype)return patternDamage(e,s.tailSeverPrototype.scarResolved?'tailRupture':'tailSever');
    if(s.crossingPrototype)return patternDamage(e,'giantCrossing');
    return null;
  }
  hurtPlayer=function worldDevourerDamageGate(damage,source,...rest){
    const replacement=worldDevourerDamage(source);
    return baseHurtPlayer(replacement==null?damage:replacement,source,...rest);
  };
  window.stackfallAtroposDamageDiagnostics=()=>({
    model:'boss-damage-scaled-v1',
    usesPlayerMaxHp:false,
    base:'max(7, boss.damage * 0.40)',
    multipliers:{...DAMAGE_MULTIPLIERS}
  });
})();
