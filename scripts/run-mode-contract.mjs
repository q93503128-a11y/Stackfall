import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),modes=read('src/run-modes.js'),core=read('src/core.js'),render=read('src/render.js'),sortie=read('src/sortie-prep.js'),runtime=read('src/stage-runtime.js'),meta=read('src/meta-progression.js'),events=read('src/map-event-expansion.js');
const checks=[
 ['stage catalog loads after core and before run modes',index.indexOf('src/core.js')<index.indexOf('src/stage-catalog.js')&&index.indexOf('src/stage-catalog.js')<index.indexOf('src/run-modes.js')],
 ['meta progression loads after runtime weapon definitions',index.indexOf('src/runtime-config.js')<index.indexOf('src/meta-progression.js')&&index.indexOf('src/weapons.js')<index.indexOf('src/meta-progression.js')],
 ['default run selection falls back to Endless',modes.includes("return{mode:MODES.ENDLESS,stageId:null}")&&modes.includes('state.runSelection=normalize')],
 ['all Stage runtimes are disabled while the stage redesign is reset',modes.includes('ACTIVE_STAGE_RUNTIMES=Object.freeze([])')&&modes.includes('stage&&hasStageRuntime(stage.id)')&&modes.includes("stage&&!hasStageRuntime(stage.id)?'planned':baseStatus(stage)")],
 ['main menu Endless choice opens preparation instead of starting immediately',render.includes("openStackfallSortiePrep?.('endless'")&&!render.includes("ui.start.onclick=()=>{window.stackfallSetRunSelection?.('endless');audio.init();resetGame();}")],
 ['sortie launch is the shared point that starts gameplay',sortie.includes('audio.init();resetGame()')&&sortie.includes('stackfallSetRunSelection?.(mode,stageId)')],
 ['Endless remains non-finite with random events and all enemy families',modes.includes('finite:false')&&modes.includes('randomWorldEvents:true')&&modes.includes('allEnemyFamilies:true')],
 ['Endless is campaign-gated without gating its random events',modes.includes("stackfallIsFeatureUnlocked?.('endless')===false")&&catalog.includes("type:'feature',key:'endless'")&&events.includes("EVENT_CLOCK_KEYS=['vault','crash','void','distress','meteor','predator','relay','storm']")&&events.includes('EVENT_TYPES=Object.freeze([...EVENT_CLOCK_KEYS])')],
 ['Hard unlock is separate from run mode and belongs to Stage 6 progression',catalog.includes("type:'feature',key:'hard'")],
 ['Endless apex cadence is ten minutes',modes.includes('apexIntervalSeconds:600')&&core.includes('nextApexAt:600')],
 ['stage run configuration remains finite and isolated for future runtimes',modes.includes('finite:true')&&modes.includes('randomWorldEvents:false')&&modes.includes('allEnemyFamilies:false')],
 ['stage catalog remains data-only while every authored runtime is planned',catalog.includes("id:'stage-01'")&&modes.includes('ACTIVE_STAGE_RUNTIMES=Object.freeze([])')&&modes.includes("stage&&!hasStageRuntime(stage.id)?'planned':baseStatus(stage)")],
 ['stage selection is guarded by progression status',modes.includes("!['available','cleared'].includes(status)")&&modes.includes('stackfallStageStatus')],
 ['stage runtime loads after the final Endless spawning override',index.indexOf('src/render.js')<index.indexOf('src/stage-runtime.js')],
 ['stage runtime owns future stage spawning without editing the Endless event implementation',runtime.includes('updateSpawning=function stageAwareSpawning')&&runtime.includes('if(isStage()){updateStage(dt);return;}')&&events.includes('function updateMapEvents')],
 ['run mode model itself does not override resetGame',!modes.includes('resetGame=')&&!catalog.includes('resetGame=')],
 ['fresh meta progression starts with four weapons',meta.includes("['blade','ember','bulwark','gravity']")]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} run mode contracts; failures=${failed}`);if(failed)process.exit(1);
