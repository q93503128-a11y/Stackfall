// Branch-only combat director for World Devourer Atropos.
// Keeps phase unlocks, but prevents a fixed six-pattern script and blocks oppressive pairings.
(()=>{
  const phaseOf=e=>{const h=e.hp/Math.max(1,e.maxHp);return h<.25?4:h<.50?3:h<.75?2:1;};
  const serpentOf=e=>e?.atroposReborn?.worldDevourer||null;
  const activeName=s=>s?.worldDevourPrototype?'world':s?.pastPrototype?'past':s?.ringPrototype?'ring':s?.mawPrototype?'maw':s?.tailSeverPrototype?'tail':s?.crossingPrototype?'crossing':null;
  const WEIGHTS={
    1:{crossing:55,tail:45},
    2:{crossing:36,tail:30,maw:19,ring:15},
    3:{crossing:31,tail:26,maw:17,ring:13,past:13},
    4:{crossing:29,tail:24,maw:15,ring:11,past:12,world:9}
  };
  const BASIC=new Set(['crossing','tail']);
  const forbiddenAfter={
    maw:new Set(['maw','ring','world']),
    ring:new Set(['ring','maw','world']),
    past:new Set(['past','ring']),
    world:new Set(['world','past','ring','maw'])
  };
  function seededRoll(e,s){
    s.directorSerial=(s.directorSerial||0)+1;
    const x=Math.sin((Number(e?.id)||1)*12.9898+s.directorSerial*78.233+(Number(e?.apexPhase)||1)*19.19)*43758.5453;
    return x-Math.floor(x);
  }
  function candidates(e,s,previous){
    const phase=phaseOf(e),weights=WEIGHTS[phase],deny=forbiddenAfter[previous]||new Set(),out=[];
    s.attacksSinceWorld=Number.isFinite(s.attacksSinceWorld)?s.attacksSinceWorld:99;
    for(const [name,weight] of Object.entries(weights)){
      if(name===previous||deny.has(name))continue;
      if(name==='world'&&s.attacksSinceWorld<4)continue;
      out.push({name,weight});
    }
    if(!out.length)for(const name of BASIC)if(name!==previous&&weights[name])out.push({name,weight:weights[name]});
    return out;
  }
  function chooseNext(e,s,previous){
    const phase=phaseOf(e),pool=candidates(e,s,previous);
    if(phase===4&&s.attacksSinceWorld>=7&&!['maw','ring','world'].includes(previous))return'world';
    const total=pool.reduce((n,p)=>n+p.weight,0);let r=seededRoll(e,s)*Math.max(1,total);
    for(const item of pool){r-=item.weight;if(r<=0)return item.name;}
    return pool.at(-1)?.name||'crossing';
  }
  const baseCombat=window.stackfallUpdateWorldDevourerCombat||window.stackfallUpdateWorldDevourerCrossing;
  if(typeof baseCombat!=='function')return;
  window.stackfallUpdateWorldDevourerCombat=function updateWorldDevourerDirectedCombat(e,dt){
    const s=serpentOf(e);if(!s)return baseCombat(e,dt);
    const before=activeName(s),result=baseCombat(e,dt),after=activeName(s);
    if(before&&!after){
      s.lastCompletedPrototypeAttack=before;
      if(before==='world')s.attacksSinceWorld=0;else s.attacksSinceWorld=(s.attacksSinceWorld||0)+1;
      s.nextPrototypeAttack=chooseNext(e,s,before);
      const phase=phaseOf(e),factor=[1,.97,.92,.87][phase-1];
      if(Number.isFinite(s.prototypeAttackCd))s.prototypeAttackCd=Math.max(.78,s.prototypeAttackCd*factor);
      const history=s.directorHistory||(s.directorHistory=[]);history.push({from:before,to:s.nextPrototypeAttack,phase});if(history.length>18)history.shift();
    }
    return result;
  };
  window.stackfallUpdateWorldDevourerCrossing=window.stackfallUpdateWorldDevourerCombat;
  window.stackfallAtroposDirectorDiagnostics=()=>{
    const e=state.entities.enemies?.find(x=>!x?.dead&&x.apexForm==='chronophage')||null,s=serpentOf(e);
    return{phase:e?phaseOf(e):null,active:activeName(s),next:s?.nextPrototypeAttack||null,last:s?.lastCompletedPrototypeAttack||null,attacksSinceWorld:s?.attacksSinceWorld??null,history:s?.directorHistory?.slice(-12)||[]};
  };
  window.stackfallAtroposPrototypeAttackState='directed-six-pattern-cycle-v1';
})();
