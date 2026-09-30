import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const dev=read('src/dev-tools.js'),stage=read('src/stage-runtime.js');
const checks=[
  ['Stage boss button targets the selected Stage',dev.includes("jumpStageBoss(stage.value)")&&dev.includes("stackfallDevSpawnStageBossNow(target.id)")],
  ['developer Stage boss spawn is direct instead of a time-jump surrogate',stage.includes('window.stackfallDevSpawnStageBossNow=function')&&stage.includes('const boss=spawnStageBoss()')&&!dev.includes("state.time=Math.max(state.time||0,Number(cfg.stage.boss")],
  ['direct boss spawn can switch into the requested Stage test run',stage.includes("state.runSelection={mode:'stage',stageId:requested.id};resetGame()")],
  ['direct boss spawn clears map-event blockers delayed combat and queued reward UI',stage.includes('clearPendingCombatActions();clearRunUiActions?.();window.closeMapEventOverlays?.();closeAbilityLedger?.(true)')&&stage.includes('state.mapEventActive=null')&&stage.includes('state.rewardQueue.length=0')],
  ['direct boss spawn clears prior combat actors before creating the target',stage.includes("['enemies','enemyProjectiles','projectiles'")&&stage.includes('state.bossActiveId=null;state.apexActiveId=null')],
  ['manual combat cleanup cannot leave a phantom Stage boss victory',dev.includes('run.bossSpawned=false;run.bossId=null;run.bossSnapshot=null')&&dev.includes('state.stageVictory=null')],
  ['manual combat cleanup clears stale map-event state',dev.includes('window.closeMapEventOverlays?.();state.mapEventActive=null')],
  ['developer actions expose visible success or failure feedback',dev.includes("let devActionMessage='준비됨'")&&dev.includes("setDevAction(result?.ok?")&&dev.includes("result?.reason||'unknown'")]
];
let failed=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}
console.log(`Checked ${checks.length} developer-tool contracts; failures=${failed}`);
if(failed)process.exit(1);
