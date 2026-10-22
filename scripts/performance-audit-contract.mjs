import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n?/g,'\n');
const systems=read('src/systems-base.js');
const runtimeSystems=read('src/systems.js');
const bosses=read('src/bosses.js');
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
 ['missed render frames use bounded 60 Hz catch-up without spiral while retaining developer 10x headroom',render.includes('frameDt=Math.min(.1,')&&render.includes('MAX_SIMULATION_STEPS=12')&&render.includes('MAX_REALTIME_CATCHUP_STEPS=4')&&render.includes('maxSimulationSteps=gameSpeed>1?MAX_SIMULATION_STEPS:MAX_REALTIME_CATCHUP_STEPS')&&render.includes('simulationAccumulator%=SIMULATION_STEP')&&render.includes('dt=SIMULATION_STEP')],
 ['cached elite path uses one raster glow before live authored geometry',guard.includes('drawCachedEnemyGlow(ctx,')&&guard.includes('ctx.shadowBlur=0;ctx.shadowColor=e.color;')],
 ['authored terrain cache is transparent bounded, camera-compensated and invalidates on camera or stage changes',realm.includes('STAGE_WORLD_FRAME_CACHE.size>=3')&&realm.includes("getContext('2d',{alpha:true})")&&realm.includes('entry.signature!==signature')&&realm.includes('ctx.clearRect(0,0,vw,vh);production.drawWorld()')&&realm.includes('entry.x-player.x')&&realm.includes('drawThemeRaw(theme);')],
 ['material cache retains full-resolution authored materials within 64 MiB',read('src/stage-craft.js').includes('stageMaterialRasterBytes+entry.bytes>64*1024*1024')&&read('src/stage-craft.js').includes('dpr*scale')],

 ['experience gem merge defines newPlayerD2 before any positive-value comparison',systems.includes('if(!amount)return null;\n  const newPlayerD2=')&&!systems.includes('return null,newPlayerD2=')],
 ['star tiles use bounded palette/stride keyed cache instead of one thrashing slot',realm.includes('const STAR_TILE_CACHE=new Map(),STAR_TILE_CACHE_LIMIT=4')&&realm.includes('STAR_TILE_CACHE.get(key)')&&realm.includes('STAR_TILE_CACHE.delete(oldest)')&&!realm.includes('STAR_TILE_CACHE.key!==key')],
 ['mirror reflection identifies removed hostile projectiles in linear passes',mirror.includes('const aliveAfter=new Set()')&&mirror.includes('aliveAfter.add(p.id)')&&mirror.includes('if(!aliveAfter.has(id))reflected.push(snap)')&&!mirror.includes("state.entities.enemyProjectiles.find(row=>row?.id===id)")],
 ['gate crossfeed amortizes scans and shares one candidate pass',weapons.includes('const gateCrossfeedCandidates=[]')&&weapons.includes('net.crossfeedScanCd=.055')&&weapons.includes('gateCrossfeedCandidates.push(p)')],
 ['beam damage uses spatial candidate broad phase',weapons.includes('forEachNearbyEnemyCandidate(cx,cy,queryRange')&&!weapons.includes('function applyRailBeam(x1,y1,x2,y2,width,damage,color,source,eliteBonus=1){state.entities.beams.push({x1,y1,x2,y2,life:.20,max:.20,color,width});for(const enemy of state.entities.enemies)')],
 ['ember and core burst damage use spatial candidate broad phase',feature.includes('forEachNearbyEnemyCandidate(x,y,radius+128')&&!feature.includes('for(const other of state.entities.enemies){\n      if(other===enemy||other.dead)continue;')],
 ['object pressure alone cannot enter emergency rendering',!guard.includes('if(!emergencyResolution&&pressureScore()>proactiveLimit)applyEmergencyResolution(true)')&&guard.includes('pressureScore()>proactiveLimit&&frameMs>26')],
 ['GPU degraded cadence remains at least 30 FPS and does not use the old 24 FPS cap',gpu.includes('cap=emergency?30:tier===2?40:tier===1?50:60')&&!/cap\s*=.*\?24:/.test(gpu)],
 ['GPU hot loops cache tint parsing, reuse simulated hostile heading, and sample particle rotation clock once',gpu.includes('const tintCache=new Map()')&&gpu.includes('Number.isFinite(p.heading)?p.heading:Math.atan2')&&gpu.includes('rotationBase=performance.now()*.002')&&!gpu.includes('p.star?(performance.now()*.002+i*.73):0')],
 ['enemy projectile lifetime culling avoids per-projectile sqrt',bosses.includes('cullDx*cullDx+cullDy*cullDy>3610000')&&!bosses.includes('Math.hypot(player.x-p.x,player.y-p.y)>1900')],
 ['gem magnet update avoids sqrt until a gem enters magnet range',runtimeSystems.includes('const dx=player.x-g.x,dy=player.y-g.y,d2=dx*dx+dy*dy')&&runtimeSystems.includes('if(d2<range2){const d=Math.sqrt(d2)||1')],
 ['spawnParticle reuses only its own standard particle objects through a bounded pool',systems.includes("const STACKFALL_PARTICLE_POOL_MARK=Symbol('stackfallParticlePool'),PARTICLE_OBJECT_POOL=[],PARTICLE_OBJECT_POOL_LIMIT=520")&&systems.includes('state.entities.particles.push(acquireParticleObject(')&&runtimeSystems.includes('compactInPlace(particles,keepParticleEffect,recycleParticleObject)')],
 ['player projectile hot loop uses a stable trail-source Set and squared lifetime culling',runtimeSystems.includes('const PROJECTILE_TRAIL_SOURCES=new Set(')&&runtimeSystems.includes('PROJECTILE_TRAIL_SOURCES.has(p.source)')&&runtimeSystems.includes('((p.x-player.x)**2+(p.y-player.y)**2)<4410000')&&!runtimeSystems.includes("['ember','echo-star','comet','echo-comet','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter'].includes(p.source)")&&!runtimeSystems.includes('Math.hypot(p.x-player.x,p.y-player.y)<2100')],
 ['spatial projectile runtime reuses pooled trail particles and a stable trail-source Set',guard.includes('const PROJECTILE_TRAIL_SOURCE_SET=new Set(')&&guard.includes('PROJECTILE_TRAIL_SOURCE_SET.has(source)')&&guard.includes('state.entities.particles.push(acquireParticleObject(')&&!guard.includes("trailSource=cometTrail||['ember','echo-star','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter'].includes(source)")],
 ['simulation remains fixed at 60 Hz while runtime speed scales accumulated simulation time up to developer 10x',render.includes('SIMULATION_STEP=1/60')&&render.includes("typeof window.stackfallGameSpeed==='function'?window.stackfallGameSpeed()")&&render.includes('simulationAccumulator+frameDt*gameSpeed')&&render.includes('while(simulationAccumulator>=SIMULATION_STEP')&&!render.includes('const simulationSteps=state.gameSpeed===2?2:1')],
 ['dense strong-hit and pickup accents are rate limited without disabling weapon audio',audio.includes('audio.lastStrongHitAt=0')&&audio.includes('now-this.lastStrongHitAt>=42')&&audio.includes('audio.lastPickupAt=0')&&audio.includes('now-this.lastPickupAt<28')],
 ['offscreen beams shockwaves text and allied particles are culled before Canvas draw work',entities.includes('beamMargin=Math.max(80')&&entities.includes('Math.max(a.x,b.x)<-beamMargin')&&entities.includes('sx+r<-24')&&entities.includes('sx<-140||sx>vw+140')&&entities.includes('sx<-24-size||sx>vw+24+size')]
];

let failed=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}
console.log(`Checked ${checks.length} performance-audit regressions; failures=${failed}`);
if(failed)process.exit(1);
