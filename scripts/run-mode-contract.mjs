import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),modes=read('src/run-modes.js'),core=read('src/core.js'),events=read('src/map-event-expansion.js');
const checks=[
 ['stage catalog loads after core and before run modes',index.indexOf('src/core.js')<index.indexOf('src/stage-catalog.js')&&index.indexOf('src/stage-catalog.js')<index.indexOf('src/run-modes.js')],
 ['default run selection falls back to Endless',modes.includes("return{mode:MODES.ENDLESS,stageId:null}")&&modes.includes('state.runSelection=normalize')],
 ['Endless remains non-finite with random events and all enemy families',modes.includes('finite:false')&&modes.includes('randomWorldEvents:true')&&modes.includes('allEnemyFamilies:true')],
 ['Endless apex cadence remains ten minutes',modes.includes('apexIntervalSeconds:600')&&core.includes('nextApexAt:600')],
 ['stage runs are finite and opt out of random world events',modes.includes('finite:true')&&modes.includes('randomWorldEvents:false')&&modes.includes('allEnemyFamilies:false')],
 ['stage 1 shell targets ten minutes',catalog.includes("id:'stage-01'")&&catalog.includes('estimatedMinutes:10')],
 ['stage catalog has fixed-event and discovery fields',catalog.includes('fixedEvents:')&&catalog.includes('discoveries:freeze')],
 ['run mode foundation does not override resetGame',!modes.includes('resetGame=')&&!catalog.includes('resetGame=')],
 ['current random event runtime remains untouched until stage runtime integration',events.includes('function updateMapEvents')&&!modes.includes('updateMapEvents=')]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} run mode contracts; failures=${failed}`);if(failed)process.exit(1);
