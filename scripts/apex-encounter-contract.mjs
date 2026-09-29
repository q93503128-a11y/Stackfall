import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/boss-catalog.js'),core=read('src/core.js'),render=read('src/render.js'),eliteRenderers=read('src/elite-renderers.js'),bosses=read('src/bosses.js'),patterns=read('src/boss-patterns.js'),events=read('src/map-event-expansion.js'),difficulty=read('src/difficulty-augment-expansion.js'),endgame=read('src/endgame-balance-expansion.js'),combat=read('src/combat-balance-refinement.js'),smoke=read('scripts/browser-smoke.mjs');
const checks=[
 ['apex interval is 600 game seconds',catalog.includes('APEX_INTERVAL_SECONDS=600')&&core.includes('nextApexAt:600')&&core.includes('state.nextApexAt=600')],
 ['paused wall clock cannot advance apex',!render.includes('state.apexClock=')&&!catalog.includes('state.apexClock=0')],
 ['apex scheduling uses game time',bosses.includes('createdAt:state.time||0')&&bosses.includes('(state.time||0)>=(state.nextApexAt||APEX_INTERVAL_SECONDS)')&&events.includes('(state.nextApexAt||Infinity)-(state.time||0)')],
 ['pause smoke checks apex invariant',smoke.includes('pausedApexDue')&&smoke.includes('!cooldown.pausedApexDue')],
 ['boss anti idle targeting exists',patterns.includes('function bossAntiIdleSkill')&&bosses.includes('bossAntiIdleSkill(enemy,dt)')],
 ['three distinct apex signatures',['chronophageSignature','starforgeSignature','constellationSignature'].every(name=>patterns.includes(`function ${name}`))],
 ['three distinct apex silhouettes',['drawChronophageApex','drawStarforgeApex','drawLastConstellationApex'].every(name=>eliteRenderers.includes(`function ${name}`))],
 ['apex has four phases',patterns.includes('health<.25?4:health<.50?3:health<.75?2:1')&&patterns.includes('e.apexElapsed>=240?4')],
 ['apex ignores player build strength',!catalog.includes('apexPlayerGrowthScale')&&!catalog.includes('weaponTotal')&&!catalog.includes('passiveTotal')],
 ['apex escalates cumulatively by appearance',catalog.includes('function cumulativeApexFactor')&&catalog.includes('function apexEscalationForCycle')&&catalog.includes('2.40,.34')&&catalog.includes('1.58,.15')&&catalog.includes('state.apexCount||0')],
 ['appearance escalation has no finite appearance cap',!catalog.includes('Math.min(10,cycle)')&&catalog.includes('for(let i=0;i<cycle;i++')&&catalog.includes('if(value>=1e120)return 1e120')],
 ['first apex has extreme fixed base strength',catalog.includes('enemy.hp*=7.60*escalation.hp')&&catalog.includes('enemy.damage*=2.15*escalation.damage')&&catalog.includes('enemy.skillCd*=.52/escalation.pattern')],
 ['phase transitions and variants',bosses.includes('function apexPhaseTransition')&&bosses.includes('function apexVariantAttack')&&bosses.includes('PHASE ${phase}')],
 ['tracking beam begins away from player',bosses.includes('aim+side*(.92+phase*.07)')&&bosses.includes('warmup:.90')],
 ['tracking beam visibly follows instead of snapping',bosses.includes("turnRate=beam.warmup>0?.48:.72")&&bosses.includes('angleToward(beam.angle,target,turnRate*dt)')],
 ['tracking beam render is throttled',bosses.includes('beam.visual-=dt')&&bosses.includes('beam.visual=stressed?.070:.040')],
 ['persistent gravity furnace set piece',bosses.includes('function startForgeTidalCore')&&bosses.includes('function updateForgeTidalCore')&&bosses.includes('player.x+=dx/d*pull*dt')],
 ['temporary herald summon set piece',bosses.includes('function summonConstellationHeralds')&&bosses.includes("eventKind='apex-herald'")&&bosses.includes('apexSummonLife')],
 ['live rotating sweep set piece',bosses.includes('function startConstellationSweep')&&bosses.includes('function updateConstellationSweep')&&bosses.includes('sweep.angle+=dt')],
 ['sweep and constellation network render are throttled',bosses.includes('sweep.visual=stressed?.075:.045')&&bosses.includes('network.visual=stressed?.085:.050')],
 ['set pieces accelerate with appearance pressure',bosses.includes('function apexSetpieceDirector')&&bosses.includes('Math.pow(pressure,.16)')&&bosses.includes('Math.pow(pressure,.18)')],
 ['apex phase visible in HUD',combat.includes('초월체 · P${phase}')&&combat.includes('APEX · P${phase}')],
 ['distinctive apex legacies',bosses.includes('function updateChronophageLegacy')&&bosses.includes('function updateStarforgeLegacy')&&bosses.includes('function updateConstellationLegacy')],
 ['last constellation legacy is not a shield tick',bosses.includes("source:'apex-constellation-lattice'")&&bosses.includes('projectile.life=0')&&!bosses.includes('player.shield=Math.min(cap,player.shield+gain)')],
 ['overall base difficulty slightly reduced',difficulty.includes('c.hp*=.88*d.enemyHp')&&difficulty.includes('c.damage*=.94*d.enemyDamage')&&difficulty.includes('c.speed*=.98*d.enemySpeed')],
 ['hard late scaling increased progressively',endgame.includes("hardLate=hard?(minutes*.014+Math.pow(minutes,1.08)*.0040):0")&&endgame.includes("hardLate=hard?(minutes*.0065+Math.pow(minutes,1.06)*.0022):0")],
 ['balance audit reports 600',endgame.includes("APEX_INTERVAL_SECONDS==='number'?APEX_INTERVAL_SECONDS:600")]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} apex contracts; failures=${failed}`);if(failed)process.exit(1);
