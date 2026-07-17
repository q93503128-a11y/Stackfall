import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/boss-catalog.js'),core=read('src/core.js'),render=read('src/render.js'),bosses=read('src/bosses.js'),patterns=read('src/boss-patterns.js'),events=read('src/map-event-expansion.js'),difficulty=read('src/difficulty-augment-expansion.js'),endgame=read('src/endgame-balance-expansion.js'),smoke=read('scripts/browser-smoke.mjs');
const checks=[
 ['apex interval is 480 game seconds',catalog.includes('APEX_INTERVAL_SECONDS=480')&&core.includes('nextApexAt:480')&&core.includes('state.nextApexAt=480')],
 ['paused wall clock cannot advance apex',!render.includes('state.apexClock=')&&!render.includes('updateApexPriority')&&!catalog.includes('state.apexClock=0')],
 ['apex scheduling uses game time',bosses.includes('createdAt:state.time||0')&&bosses.includes('state.nextApexAt=(state.time||0)+30')&&bosses.includes('(state.time||0)>=(state.nextApexAt||APEX_INTERVAL_SECONDS)')&&events.includes('(state.nextApexAt||Infinity)-(state.time||0)')],
 ['pause smoke checks apex invariant',smoke.includes('pausedApexDue')&&smoke.includes('!cooldown.pausedApexDue')],
 ['boss anti idle targeting exists',patterns.includes('function bossAntiIdleSkill')&&patterns.includes('e.antiIdleStill')&&bosses.includes('bossAntiIdleSkill(enemy,dt)')],
 ['three distinct apex signatures',['chronophageSignature','starforgeSignature','constellationSignature'].every(name=>patterns.includes(`function ${name}`))],
 ['apex has health and time phases',patterns.includes('health<.25?4:health<.50?3:health<.75?2:1')&&patterns.includes('e.apexElapsed>=240?4')],
 ['overall base difficulty slightly reduced',difficulty.includes('c.hp*=.88*d.enemyHp')&&difficulty.includes('c.damage*=.94*d.enemyDamage')&&difficulty.includes('c.speed*=.98*d.enemySpeed')],
 ['hard late scaling increased progressively',endgame.includes("hardLate=hard?(minutes*.009+Math.pow(minutes,1.08)*.0025):0")&&endgame.includes("hardLate=hard?(minutes*.004+Math.pow(minutes,1.06)*.0015):0")],
 ['first apex raw stats softened',catalog.includes('enemy.hp*=hpScale*1.80')&&catalog.includes('enemy.damage*=damageScale*1.18')],
 ['balance audit reports 480',endgame.includes("APEX_INTERVAL_SECONDS==='number'?APEX_INTERVAL_SECONDS:480")]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} apex contracts; failures=${failed}`);if(failed)process.exit(1);
