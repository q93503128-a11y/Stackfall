import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const dev=read('src/dev-tools.js'),stage=read('src/stage-runtime.js');
const checks=[
  ['Stage boss button targets the selected Stage',dev.includes("jumpStageBoss(stage.value)")&&dev.includes("stackfallDevSpawnStageBossNow(target.id)")],
  ['Stage boss button starts five seconds before the authored boss trigger',dev.includes('Stage 보스 5초 전')&&stage.includes('previewSeconds=5')&&stage.includes('state.time=Math.max(0,bossAt-previewSeconds)')],
  ['developer Stage boss preview uses the normal authored trigger instead of direct spawning',stage.includes('window.stackfallDevSpawnStageBossNow=function')&&stage.includes('run.devBossPreview=true')&&!stage.includes('const boss=spawnStageBoss();\n    if(!boss)return{ok:false,reason:\'spawn-blocked\'')],
  ['developer Stage boss preview can switch into the requested Stage test run',stage.includes("state.runSelection={mode:'stage',stageId:requested.id};resetGame()")],
  ['developer Stage boss preview clears map-event blockers delayed combat and queued reward UI',stage.includes('clearPendingCombatActions();clearRunUiActions?.();window.closeMapEventOverlays?.();closeAbilityLedger?.(true)')&&stage.includes('state.mapEventActive=null')&&stage.includes('state.rewardQueue.length=0')],
  ['developer Stage boss preview clears prior combat actors before countdown',stage.includes("['enemies','enemyProjectiles','projectiles'")&&stage.includes('state.bossActiveId=null;state.apexActiveId=null')],
  ['developer Stage boss preview suppresses overdue fixed world and encounter events',stage.includes("if(event.kind!=='boss'&&Number(event.at)<=bossAt)run.eventsTriggered[event.id]=true")&&stage.includes('stageWorldEventPlan(run.stage).length')&&stage.includes('stageEncounterPlan(run.stage).length')],
  ['developer Stage boss preview pauses ordinary Stage spawning until the boss threshold',stage.includes('if(run.devBossPreview===true)')&&stage.includes("if((state.time||0)<bossAt)return")&&stage.includes('run.devBossPreview=false')],
  ['manual combat cleanup cannot leave a phantom Stage boss victory',dev.includes('run.bossSpawned=false;run.bossId=null;run.bossSnapshot=null')&&dev.includes('state.stageVictory=null')],
  ['manual combat cleanup clears stale map-event state',dev.includes('window.closeMapEventOverlays?.();state.mapEventActive=null')],
  ['developer actions expose visible success or failure feedback',dev.includes("let devActionMessage='준비됨'")&&dev.includes("setDevAction(result?.ok?")&&dev.includes("result?.reason||'unknown'")]
];
let failed=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}
console.log(`Checked ${checks.length} developer-tool contracts; failures=${failed}`);
if(failed)process.exit(1);
