import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),modes=read('src/run-modes.js'),core=read('src/core.js'),render=read('src/render.js'),runtime=read('src/stage-runtime.js'),meta=read('src/meta-progression.js'),events=read('src/map-event-expansion.js');
const checks=[
 ['stage catalog loads after core and before run modes',index.indexOf('src/core.js')<index.indexOf('src/stage-catalog.js')&&index.indexOf('src/stage-catalog.js')<index.indexOf('src/run-modes.js')],
 ['meta progression loads after the complete weapon registry',index.indexOf('src/runtime-config.js')<index.indexOf('src/meta-progression.js')&&index.indexOf('src/meta-progression.js')<index.indexOf('src/weapons.js')],
 ['default run selection falls back to Endless',modes.includes("return{mode:MODES.ENDLESS,stageId:null}")&&modes.includes('state.runSelection=normalize')],
 ['main menu Endless start explicitly selects Endless',render.includes("window.stackfallSetRunSelection?.('endless')")&&render.includes('audio.init();resetGame()')],
 ['Endless remains non-finite with random events and all enemy families',modes.includes('finite:false')&&modes.includes('randomWorldEvents:true')&&modes.includes('allEnemyFamilies:true')],
 ['Endless apex cadence remains ten minutes',modes.includes('apexIntervalSeconds:600')&&core.includes('nextApexAt:600')],
 ['stage runs are finite and opt out of random world events',modes.includes('finite:true')&&modes.includes('randomWorldEvents:false')&&modes.includes('allEnemyFamilies:false')],
 ['Stage 1 is a finite ten minute operation',catalog.includes("id:'stage-01'")&&catalog.includes('durationSeconds:600')&&catalog.includes('estimatedMinutes:10')],
 ['stage selection is guarded by progression status',modes.includes("!['available','cleared'].includes(status)")&&modes.includes('stackfallStageStatus')],
 ['stage runtime loads after the final Endless spawning override',index.indexOf('src/render.js')<index.indexOf('src/stage-runtime.js')],
 ['stage runtime owns stage spawning without editing the Endless event implementation',runtime.includes('updateSpawning=function stageAwareSpawning')&&runtime.includes('if(isStage()){updateStage(dt);return;}')&&events.includes('function updateMapEvents')],
 ['run mode model itself does not override resetGame',!modes.includes('resetGame=')&&!catalog.includes('resetGame=')],
 ['fresh meta progression starts with four weapons',meta.includes("['blade','ember','bulwark','gravity']")]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} run mode contracts; failures=${failed}`);if(failed)process.exit(1);
