from pathlib import Path

root = Path('.')
patterns_path = root / 'src/boss-patterns.js'
patterns = patterns_path.read_text(encoding='utf-8')
start = patterns.index('function voidBossSkill(e,dt){')
end = patterns.index('function fireRingWithGaps(', start)

new_block = r'''function voidLineThrough(cx,cy,angle,half,width,damage,color,life=.95,impactStyle='void-lane'){
  const ux=Math.cos(angle),uy=Math.sin(angle);
  rawLine(cx-ux*half,cy-uy*half,cx+ux*half,cy+uy*half,width,damage,color,life,impactStyle);
}
function voidLanePair(cx,cy,angle,half,offset,width,damage,color,life=.95,impactStyle='void-lane'){
  const nx=-Math.sin(angle),ny=Math.cos(angle);
  voidLineThrough(cx+nx*offset,cy+ny*offset,angle,half,width,damage,color,life,impactStyle);
  voidLineThrough(cx-nx*offset,cy-ny*offset,angle,half,width,damage,color,life,impactStyle);
}
function voidVolleyFrom(e,x,y,target,count,spread,speed,damage,color,r=5.2){
  const base=Math.atan2(target.y-y,target.x-x),visual=enemyProjectileVisualFor(e,'fan');
  for(let i=0;i<count;i++)spawnEnemyProjectile(x,y,base+(i-(count-1)/2)*spread,speed,damage,color,r,6,visual);
}
function voidMawHunger(e,d){
  e.mawHungerStep=(e.mawHungerStep||0)+1;
  const target=predictedPlayer(145),angle=Math.atan2(target.y-e.y,target.x-e.x),nx=-Math.sin(angle),ny=Math.cos(angle),distance=Math.hypot(target.x-e.x,target.y-e.y),length=Math.max(300,distance+90);
  rawLine(e.x,e.y,e.x+Math.cos(angle)*length,e.y+Math.sin(angle)*length,74,d*.82,'#b878ff',.76,'void-maw-hunger');
  rawLine(e.x+nx*58,e.y+ny*58,e.x+nx*58+Math.cos(angle)*length,e.y+ny*58+Math.sin(angle)*length,10,0,'#e8ceff',.76,'void-maw-edge');
  rawLine(e.x-nx*58,e.y-ny*58,e.x-nx*58+Math.cos(angle)*length,e.y-ny*58+Math.sin(angle)*length,10,0,'#e8ceff',.76,'void-maw-edge');
  const tx=target.x,ty=target.y;
  bossLater(e,620,()=>{
    let eaten=0;
    for(const projectile of state.entities.projectiles){
      if(eaten>=10)break;
      if(projectile&&projectile.life>0&&Math.hypot(projectile.x-e.x,projectile.y-e.y)<285){projectile.life=0;eaten++;}
    }
    e.mawLastDevoured=eaten;
    if(eaten)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*Math.min(.035,eaten*.0035));
    const aim=Math.atan2(ty-e.y,tx-e.x);e.dash=.46;e.dashX=Math.cos(aim)*485;e.dashY=Math.sin(aim)*485;
    bossLater(e,250,()=>{
      addCircle(tx,ty,68,d*1.08,'#713dd0',.72);
      if(eaten>0)voidVolleyFrom(e,e.x,e.y,{x:player.x,y:player.y},Math.min(6,2+Math.ceil(eaten/2)),.15,205,d*(.48+Math.min(.24,eaten*.025)),'#bb82ff',5.8);
    });
  });
}
function voidMawRupture(e,d){
  const target=predictedPlayer(70);
  for(let i=1;i<=3;i++){
    const t=i/3,x=e.x+(target.x-e.x)*t,y=e.y+(target.y-e.y)*t;
    addCircle(x,y,48+i*7,d*(.62+i*.11),'#713dd0',.78+i*.14);
  }
}
function voidOracleOmen(e,d){
  e.oracleOmenStep=(e.oracleOmenStep||0)+1;
  const step=e.oracleOmenStep,target=predictedPlayer(130+Math.min(100,step%3*35)),motionX=target.x-player.x,motionY=target.y-player.y,motion=Math.hypot(motionX,motionY),angle=motion>.01?Math.atan2(motionY,motionX):Math.atan2(player.y-e.y,player.x-e.x),ux=Math.cos(angle),uy=Math.sin(angle);
  for(let i=-1;i<=1;i++)addCircle(target.x+ux*i*76,target.y+uy*i*76,42+Math.abs(i)*4,d*(i===0?.88:.70),'#d6a8ff',.82+(i+1)*.13);
  if(step%3===0){
    bossLater(e,240,()=>{
      voidLineThrough(target.x,target.y,angle+.58,285,18,d*.72,'#c58aff',.88,'void-oracle-cross');
      voidLineThrough(target.x,target.y,angle-.58,285,18,d*.72,'#a86df0',.98,'void-oracle-cross');
    });
  }
}
function voidOracleProphecy(e,d){
  const target=predictedPlayer(215),angle=Math.atan2(target.y-e.y,target.x-e.x);
  voidLineThrough(target.x,target.y,angle,330,22,d*.86,'#e4c8ff',1.02,'void-oracle-prophecy');
  bossLater(e,260,()=>voidLineThrough(target.x,target.y,angle+Math.PI/2,300,18,d*.72,'#a86df0',.92,'void-oracle-prophecy'));
}
function voidOracleGapRing(e,d){
  const gap=Math.atan2(player.y-e.y,player.x-e.x),step=e.oracleOmenStep||0;
  fireRingWithGaps(e,20,138,d*.68,'#a86df0',-step*.21,gap,.34,5.4);
}
function voidWeaverLoom(e,d){
  e.weaverLoomStep=(e.weaverLoomStep||0)+1;
  const step=e.weaverLoomStep,target=predictedPlayer(72),angle=.24+step*Math.PI/3,nx=-Math.sin(angle),ny=Math.cos(angle),ux=Math.cos(angle),uy=Math.sin(angle),offset=104;
  voidLanePair(target.x,target.y,angle,335,offset,18,d*.72,'#8d5ddb',1.08,'void-weaver-thread');
  voidLineThrough(target.x,target.y,angle+Math.PI/2,155,12,d*.40,'#7446c8',1.22,'void-weaver-cross-thread');
  bossLater(e,500,()=>{
    const visual=enemyProjectileVisualFor(e,'ring');
    for(const lane of[-1,1]){
      const sx=target.x-ux*300+nx*offset*lane,sy=target.y-uy*300+ny*offset*lane;
      for(const spread of[-.045,.045])spawnEnemyProjectile(sx,sy,angle+spread,178,d*.58,'#9a6ce0',5.4,5.2,visual);
    }
  });
}
function voidWeaverNeedles(e,d){
  const target=predictedPlayer(110),base=Math.atan2(target.y-e.y,target.x-e.x),visual=enemyProjectileVisualFor(e,'fan');
  for(let i=-3;i<=3;i++)spawnEnemyProjectile(e.x,e.y,base+i*.10,166+Math.abs(i)*10,d*.58,'#7446c8',5.2,6.2,visual);
}
function voidGraveMarkers(e,d){
  e.graveMarkerStep=(e.graveMarkerStep||0)+1;
  const step=e.graveMarkerStep,target=predictedPlayer(86),base=step*1.17,markers=[{x:target.x,y:target.y}];
  for(const side of[-1,1])markers.push({x:target.x+Math.cos(base+side*1.12)*128,y:target.y+Math.sin(base+side*1.12)*128});
  markers.forEach((marker,index)=>{
    addCircle(marker.x,marker.y,58+index*4,d*(.72+index*.08),'#6960ad',1.02+index*.13);
    bossLater(e,760+index*120,()=>{
      const visual=enemyProjectileVisualFor(e,'ring'),offset=base+index*.38;
      for(let i=0;i<4;i++)spawnEnemyProjectile(marker.x,marker.y,offset+i*TAU/4,126+index*8,d*.54,'#8c82ce',5.8,6.4,visual);
    });
  });
}
function voidGraveSentinels(e){
  const live=state.entities.enemies.filter(other=>other!==e&&!other.dead&&other.eventKind==='void-minion').length,room=Math.max(0,3-live),count=Math.min(2,room);
  if(count>0)summonMinions(e,count,'tank');
  e.graveSentinelCount=count;
}
function voidGraveCorridor(e,d){
  const target=predictedPlayer(70),angle=(e.graveMarkerStep||0)*.61+.18;
  voidLanePair(target.x,target.y,angle,350,116,24,d*.78,'#8c82ce',1.20,'void-grave-wall');
}
function voidParadoxCrossfire(e,twin,d){
  e.paradoxBeat=(e.paradoxBeat||0)+1;
  const target=predictedPlayer(115),axis=Math.atan2(twin.y-e.y,twin.x-e.x),nx=-Math.sin(axis),ny=Math.cos(axis);
  rawLine(e.x,e.y,target.x+nx*72,target.y+ny*72,18,d*.72,'#d69cff',.90,'void-paradox-crossfire');
  rawLine(twin.x,twin.y,target.x-nx*72,target.y-ny*72,18,d*.72,'#78cfff',.98,'void-paradox-crossfire');
  bossLater(e,500,()=>{
    if(twin.dead)return;
    voidVolleyFrom(e,e.x,e.y,target,3,.11,205,d*.54,'#d69cff',5.2);
    voidVolleyFrom(twin,twin.x,twin.y,target,3,.11,205,d*.54,'#78cfff',5.2);
  });
}
function voidParadoxSwap(e,twin,d){
  const ax=e.x,ay=e.y,bx=twin.x,by=twin.y;
  rawLine(ax,ay,bx,by,26,d*.86,'#f1dcff',1.02,'void-paradox-axis');
  bossLater(e,720,()=>{
    if(twin.dead)return;
    e.x=bx;e.y=by;twin.x=ax;twin.y=ay;e.paradoxSwapCount=(e.paradoxSwapCount||0)+1;
    shockwave(e.x,e.y,'#d69cff',88,.34,3);shockwave(twin.x,twin.y,'#78cfff',88,.34,3);
    voidVolleyFrom(e,e.x,e.y,{x:player.x,y:player.y},4,.13,192,d*.48,'#d69cff',5.1);
    voidVolleyFrom(twin,twin.x,twin.y,{x:player.x,y:player.y},4,.13,192,d*.48,'#78cfff',5.1);
  });
}
function voidParadoxFrame(e,twin,d){
  const target=predictedPlayer(76),axis=Math.atan2(twin.y-e.y,twin.x-e.x);
  voidLanePair(target.x,target.y,axis,315,104,17,d*.64,'#d69cff',1.06,'void-paradox-frame');
  voidLanePair(target.x,target.y,axis+Math.PI/2,270,104,17,d*.64,'#78cfff',1.16,'void-paradox-frame');
}
function voidParadoxSolo(e,d){
  e.paradoxBeat=(e.paradoxBeat||0)+1;
  const step=e.paradoxBeat,angle=step*2.399,destination={x:player.x+Math.cos(angle)*330,y:player.y+Math.sin(angle)*330};
  addCircle(destination.x,destination.y,e.r+32,0,'#d69cff',.74);
  bossLater(e,580,()=>{
    e.x=destination.x;e.y=destination.y;shockwave(e.x,e.y,'#d69cff',80,.32,2.6);
    voidVolleyFrom(e,e.x,e.y,{x:player.x,y:player.y},5,.12,202,d*.62,'#d69cff',5.3);
  });
}

function voidBossSkill(e,dt){
  const k=skillScale(e);e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;const d=Math.max(5,e.damage*.47),f=e.eliteForm;
  if(f==='maw'){
    if(e.skillCd<=0){e.skillCd=5.15;voidMawHunger(e,d);}
    if(e.burstCd<=0){e.burstCd=7.65;voidMawRupture(e,d);}
    if(e.pulseCd<=0){e.pulseCd=10.6;const gap=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,14,116,d*.48,'#713dd0',e.phase*.08,gap,.48,5.8);}
  }else if(f==='oracle'){
    if(e.skillCd<=0){e.skillCd=3.55;voidOracleOmen(e,d);}
    if(e.burstCd<=0){e.burstCd=7.20;voidOracleProphecy(e,d);}
    if(e.pulseCd<=0){e.pulseCd=10.15;voidOracleGapRing(e,d);}
  }else if(f==='weaver'){
    if(e.skillCd<=0){e.skillCd=4.05;voidWeaverLoom(e,d);}
    if(e.burstCd<=0){e.burstCd=7.10;voidWeaverNeedles(e,d);}
    if(e.pulseCd<=0){e.pulseCd=10.4;webAroundPlayer(6,210,d*.68,'#8d5ddb');}
  }else if(f==='grave'){
    if(e.skillCd<=0){e.skillCd=4.65;voidGraveMarkers(e,d);}
    if(e.burstCd<=0){e.burstCd=9.25;voidGraveSentinels(e);}
    if(e.pulseCd<=0){e.pulseCd=10.85;voidGraveCorridor(e,d);}
  }else if(f==='paradox'){
    const twin=nearbyTwin(e),side=e.twinSide||1;
    if(twin&&side>0)return;
    if(!twin){
      if(e.skillCd<=0){e.skillCd=3.85;voidParadoxSolo(e,d);}
      if(e.burstCd<=0)e.burstCd=7.4;
      if(e.pulseCd<=0)e.pulseCd=9.8;
      return;
    }
    if(e.skillCd<=0){e.skillCd=4.10;voidParadoxCrossfire(e,twin,d);}
    if(e.burstCd<=0){e.burstCd=8.15;voidParadoxSwap(e,twin,d);}
    if(e.pulseCd<=0){e.pulseCd=10.7;voidParadoxFrame(e,twin,d);}
  }
}

'''
patterns = patterns[:start] + new_block + patterns[end:]
patterns_path.write_text(patterns, encoding='utf-8')

contract_path = root / 'scripts/void-boss-contract.mjs'
contract_path.write_text(r'''import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/boss-catalog.js'),patterns=read('src/boss-patterns.js'),systems=read('src/systems-base.js'),renderers=read('src/elite-renderers.js'),events=read('src/map-event-expansion.js'),realm=read('src/realm-backgrounds.js'),design=read('docs/GAME_DESIGN.md'),wiki=read('docs/WIKI.md'),readme=read('README.md');
const voidStart=patterns.indexOf('function voidBossSkill(e,dt){'),voidEnd=patterns.indexOf('function fireRingWithGaps(',voidStart),voidRuntime=patterns.slice(voidStart,voidEnd);
const checks=[
 ['void pool exposes all five bosses',catalog.includes("void:['maw','oracle','weaver','grave','paradox']")],
 ['boss bags use Fisher-Yates rather than random sort',catalog.includes('function shuffledBossPool')&&catalog.includes('Math.floor(Math.random()*(i+1))')&&!catalog.includes("bag=[...pool].sort(()=>Math.random()-.5)")],
 ['bag refills avoid immediate repeats across resets',catalog.includes('state.lastBossForms=state.lastBossForms||{}')&&catalog.includes('bag[bag.length-1]===lastForm')&&catalog.includes('state.lastBossForms[kind]=form')],
 ['five void patterns remain distinct',['maw','oracle','weaver','grave','paradox'].every(form=>patterns.includes(`f==='${form}'`))],
 ['void combat owns five dedicated movement questions',['voidMawHunger','voidOracleOmen','voidWeaverLoom','voidGraveMarkers','voidParadoxCrossfire'].every(name=>patterns.includes(`function ${name}`))],
 ['maw hunger is telegraphed and never directly rewrites player position',patterns.includes("'void-maw-hunger'")&&!voidRuntime.includes('player.x+=')&&!voidRuntime.includes('player.y+=')&&!voidRuntime.includes('player.x=')&&!voidRuntime.includes('player.y=')],
 ['maw devour healing is capped and tied to hunger',patterns.includes('Math.min(.035,eaten*.0035)')&&patterns.includes('e.mawLastDevoured=eaten')],
 ['oracle owns prediction sequence and intentional safe-gap ring',patterns.includes('e.oracleOmenStep=')&&patterns.includes('voidOracleGapRing')&&patterns.includes('fireRingWithGaps(e,20,138')],
 ['weaver owns rotating loom corridors',patterns.includes('e.weaverLoomStep=')&&patterns.includes('voidLanePair(target.x,target.y,angle,335,offset')&&patterns.includes("'void-weaver-thread'")],
 ['grave uses bounded sentinels instead of five-tank spam',patterns.includes('Math.max(0,3-live)')&&patterns.includes('Math.min(2,room)')&&!voidRuntime.includes("summonMinions(e,5,'tank')")],
 ['grave owns deterministic territory markers and corridor walls',patterns.includes('e.graveMarkerStep=')&&patterns.includes("'void-grave-wall'")],
 ['paradox twin coordinator owns synchronized crossfire swap and frame',patterns.includes('if(twin&&side>0)return')&&patterns.includes('voidParadoxCrossfire(e,twin,d)')&&patterns.includes('voidParadoxSwap(e,twin,d)')&&patterns.includes('voidParadoxFrame(e,twin,d)')],
 ['paradox survivor has deterministic solo fallback',patterns.includes('function voidParadoxSolo')&&patterns.includes('angle=step*2.399')],
 ['paradox still creates a real twin',systems.includes("const ELITE_SPAWN_KINDS=new Set(['mini','boss','void','apex']),ELITE_TWIN_FORMS=new Set(['mirror','paradox'])")&&systems.includes('ELITE_TWIN_FORMS.has(enemy.eliteForm)')&&systems.includes('twinSide=-1')&&systems.includes('twinSide:1')],
 ['oracle and paradox no longer reuse another boss silhouette',renderers.includes("f==='oracle'")&&renderers.includes("f==='paradox'")&&!renderers.includes("f==='archivist'||f==='oracle'")&&!renderers.includes("f==='mirror'||f==='paradox'")],
 ['maw and weaver use different silhouette geometry',renderers.includes("f==='maw'")&&renderers.includes("ctx.ellipse(0,0,e.r*1.18,e.r*.78")&&renderers.includes("f==='weaver'")&&renderers.includes('for(let i=0;i<8;i++){const a=i/8*TAU')],
 ['oracle and paradox projectiles have distinct visual families',catalog.includes("if(form==='oracle')return'rune'")&&catalog.includes("if(form==='paradox')return'mirror'")],
 ['void event publishes selected boss form',events.includes('state.mapEventActive.bossForm=boss.eliteForm||null')],
 ['void realm reacts to all five boss forms',realm.includes('function voidBossForm')&&['maw','oracle','weaver','grave','paradox'].every(form=>realm.includes(`form==='${form}'`))],
 ['canonical docs describe the five combat identities',[readme,design,wiki].every(doc=>doc.includes('HUNGER / PROPHECY / LOOM / GRAVE / PARADOX'))]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} void boss contracts; failures=${failed}`);if(failed)process.exit(1);
''', encoding='utf-8')

section = r'''

## Void Rift combat identities — HUNGER / PROPHECY / LOOM / GRAVE / PARADOX

The five active Void Rift bosses share the same dark-cosmic event family but must ask different movement questions instead of reusing one ring/fan/circle cadence.

- **Maw / Abyssal Devourer — HUNGER:** clearly telegraphs a committed feeding lane, consumes a capped number of nearby player projectiles during that visible window, then lunges along the committed line. It never silently rewrites player coordinates.
- **Oracle / Void Oracle — PROPHECY:** marks projected movement with staggered future seals and crossing prophecy lines. Its dense ring has intentional escape gaps, so changing direction beats prediction rather than raw bullet density.
- **Weaver / Lightless Weaver — LOOM:** rotates paired thread lanes and a cross-thread to create readable corridors; slow shuttle projectiles travel through the authored weave. The enclosing web is an occasional signature, not the whole rotation.
- **Grave / Lord of the Star Grave — GRAVE:** occupies territory with three deliberate grave markers, delayed cardinal shard eruptions, and paired burial walls. Void sentinels are capped at three live units and summoned at most two at a time.
- **Paradox / Paradox Twins — PARADOX:** the α twin coordinates shared crossfire, position swap, and mirrored frame attacks with β so the pair behaves as one encounter. If one twin dies, the survivor falls back to a deterministic solo rift pattern instead of breaking the fight.

Readability rule: Void attacks may be visually intense, but their warning geometry, safe-space logic, and cadence must remain legible against Stackfall's existing cosmic battlefield. Do not turn Void bosses into puzzle intermissions, long invulnerability phases, or full-screen opaque bullet spam.
'''
for relative in ['README.md','docs/GAME_DESIGN.md','docs/WIKI.md']:
    path=root/relative
    text=path.read_text(encoding='utf-8')
    if '## Void Rift combat identities — HUNGER / PROPHECY / LOOM / GRAVE / PARADOX' not in text:
        text=text.rstrip()+section+'\n'
        path.write_text(text,encoding='utf-8')

print('Void Rift combat identity transformation applied')
