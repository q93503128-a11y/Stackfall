import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const dev=read('src/dev-tools.js'),stage=read('src/stage-runtime.js'),endless=read('src/dev-tools-endless.js'),controls=read('src/runtime-controls.js'),render=read('src/render.js');
const checks=[
  ['developer preview cancels startup choices before their microtask',stage.includes('state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;')],
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
  ['developer actions expose visible success or failure feedback',dev.includes("let devActionMessage='준비됨'")&&dev.includes("setDevAction(result?.ok?")&&dev.includes("result?.reason||'unknown'")],
  ['Stage and Endless developer tools are visually separated',endless.includes('STAGE TOOLS')&&endless.includes('ENDLESS TOOLS')&&endless.includes('dev-stage-section')&&endless.includes('dev-endless-section')],
  ['Endless developer tools expose only the canonical three world events',[
    "'vault','성운 보관소'","'crash','추락한 우주선'","'void','공허 균열'"
  ].every(token=>endless.includes(token))&&!["'distress','조난 신호'","'meteor','유성 광맥'","'predator','포식성 성운'","'relay','중계기 복구'","'storm','항성 폭풍의 눈'"].some(token=>endless.includes(token))],
  ['runtime canonical world-event list matches developer source',controls.includes("Object.freeze(['vault','crash','void'])")&&endless.includes("['vault','성운 보관소'],['crash','추락한 우주선'],['void','공허 균열']")],
  ['Endless developer tools can spawn mini boss boss void boss and apex',endless.includes("spawnElite('mini'")&&endless.includes("spawnElite('boss'")&&endless.includes("spawnElite('void'")&&endless.includes('spawnApex(apexSelect.value)')],
  ['developer apex spawn uses the normal Apex encounter director',endless.includes('state.bossBags.apex=[form]')&&endless.includes('updateApexSystems(0,true)')],
  ['developer tools can force Apex phases 1 through 4',endless.includes('PHASE 4 · TERMINAL')&&endless.includes('apexElapsed=settings.time')&&endless.includes('applyEndlessApexPhase')],
  ['runtime speed control accepts 1x through 10x in half-step increments',controls.includes('Math.min(10')&&controls.includes('Math.round(bounded*2)/2')&&endless.includes('min="1" max="10" step="0.5"')],
  ['simulation loop has enough fixed steps for true 10x at normal frame cadence',render.includes('MAX_SIMULATION_STEPS=12')&&render.includes('simulationAccumulator+frameDt*gameSpeed')&&render.includes("window.stackfallGameSpeed==='function'")],
  ['Endless extension only loads in explicit developer mode',controls.includes("get('dev')==='1'")&&controls.includes("extension.src='src/dev-tools-endless.js'")]
];
let failed=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}
console.log(`Checked ${checks.length} developer-tool contracts; failures=${failed}`);
if(failed)process.exit(1);
