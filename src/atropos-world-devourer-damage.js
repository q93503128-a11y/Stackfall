// Branch-only damage model for the World Devourer Atropos prototype.
// Keep player HP investment meaningful: Atropos attacks scale from the boss' normal Apex damage,
// never from player.maxHp. All damage still flows through the canonical hurtPlayer pipeline.
(()=>{
  if(typeof hurtPlayer!=='function')return;
  const baseHurtPlayer=hurtPlayer;
  const apexBaseDamage=e=>Math.max(7,(Number(e?.damage)||0)*.40);
  function worldDevourerDamage(e){
    if(!e||e.apexForm!=='chronophage'||!e.atroposReborn?.worldDevourer)return null;
    const s=e.atroposReborn.worldDevourer,d=apexBaseDamage(e);
    if(s.worldDevourPrototype)return d*1.75;
    if(s.pastPrototype)return d*.92;
    if(s.ringPrototype)return d*1.10;
    if(s.mawPrototype)return d*1.35;
    if(s.tailSeverPrototype)return d*(s.tailSeverPrototype.scarResolved?.72:1.05);
    if(s.crossingPrototype)return d*.95;
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
    multipliers:{giantCrossing:.95,tailSever:1.05,tailRupture:.72,voidMaw:1.35,devourerRing:1.10,pastTrajectory:.92,worldDevour:1.75}
  });
})();
