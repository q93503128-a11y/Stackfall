import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const systems=read('src/systems-base.js');
const realm=read('src/realm-backgrounds.js');
const mirror=read('src/weapon-awakening-effects-a14-a19.js');
const weapons=read('src/weapons.js');
const guard=read('src/performance-guard.js');
const gpu=read('src/gpu-renderer.js');
const render=read('src/render.js');
const audio=read('src/runtime-config.js');
const feature=read('src/feature-pack.js');
const entities=read('src/render-entities.js');

const checks=[
 ['experience gem merge defines newPlayerD2 before any positive-value comparison',systems.includes('if(!amount)return null;\n  const newPlayerD2=')&&!systems.includes('return null,newPlayerD2=')],
 ['star tiles use bounded palette/stride keyed cache instead of one thrashing slot',realm.includes('const STAR_TILE_CACHE=new Map(),STAR_TILE_CACHE_LIMIT=4')&&realm.includes('STAR_TILE_CACHE.get(key)')&&realm.includes('STAR_TILE_CACHE.delete(oldest)')&&!realm.includes('STAR_TILE_CACHE.key!==key')],
 ['mirror reflection identifies removed hostile projectiles in linear passes',mirror.includes('const aliveAfter=new Set()')&&mirror.includes('aliveAfter.add(p.id)')&&mirror.includes('if(!aliveAfter.has(id))reflected.push(snap)')&&!mirror.includes("state.entities.enemyProjectiles.find(row=>row?.id===id)")],
 ['gate crossfeed amortizes scans and shares one candidate pass',weapons.includes('const gateCrossfeedCandidates=[]')&&weapons.includes('net.crossfeedScanCd=.055')&&weapons.includes('gateCrossfeedCandidates.push(p)')],
 ['beam damage uses spatial candidate broad phase',weapons.includes('forEachNearbyEnemyCandidate(cx,cy,queryRange')&&!weapons.includes('function applyRailBeam(x1,y1,x2,y2,width,damage,color,source,eliteBonus=1){state.entities.beams.push({x1,y1,x2,y2,life:.20,max:.20,color,width});for(const enemy of state.entities.enemies)')],
 ['ember and core burst damage use spatial candidate broad phase',feature.includes('forEachNearbyEnemyCandidate(x,y,radius+128')&&!feature.includes('for(const other of state.entities.enemies){\n      if(other===enemy||other.dead)continue;')],
 ['object pressure alone cannot enter emergency rendering',!guard.includes('if(!emergencyResolution&&pressureScore()>proactiveLimit)applyEmergencyResolution(true)')&&guard.includes('pressureScore()>proactiveLimit&&frameMs>26')],
 ['GPU degraded cadence remains at least 30 FPS and does not use the old 24 FPS cap',gpu.includes('cap=emergency?30:tier===2?40:tier===1?50:60')&&!gpu.includes('?24:')],
 ['simulation is fixed at 60 Hz and 2x speed scales accumulated simulation time rather than RAF count',render.includes('SIMULATION_STEP=1/60')&&render.includes("simulationAccumulator+frameDt*(state.gameSpeed===2?2:1)")&&render.includes('while(simulationAccumulator>=SIMULATION_STEP')&&!render.includes('const simulationSteps=state.gameSpeed===2?2:1')],
 ['dense strong-hit and pickup accents are rate limited without disabling weapon audio',audio.includes('audio.lastStrongHitAt=0')&&audio.includes('now-this.lastStrongHitAt>=42')&&audio.includes('audio.lastPickupAt=0')&&audio.includes('now-this.lastPickupAt<28')],
 ['offscreen beams shockwaves text and allied particles are culled before Canvas draw work',entities.includes('beamMargin=Math.max(80')&&entities.includes('Math.max(a.x,b.x)<-beamMargin')&&entities.includes('sx+r<-24')&&entities.includes('sx<-140||sx>vw+140')&&entities.includes('sx<-24-size||sx>vw+24+size')]
];

let failed=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}
console.log(`Checked ${checks.length} performance-audit regressions; failures=${failed}`);
if(failed)process.exit(1);
