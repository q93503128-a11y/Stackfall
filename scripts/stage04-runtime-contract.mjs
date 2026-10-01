import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage04-runtime.js'),shared=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),space=read('src/render-space.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 4 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&shared.includes('updateAmbientGimmick(run,def)')],
 ['Stage 4 exists after Stage 3 in constellation one',catalog.includes("id:'stage-04'")&&catalog.includes("constellationId:'constellation-01'")&&catalog.includes("requirements:{previous:'stage-03'}")],
 ['Stage 4 boss follows the authored 6.5-minute operation',catalog.includes("boss:{id:'zero-hour-regulator',spawnAt:390")&&catalog.includes("at:390,kind:'boss',variant:'zero-hour-regulator'")],
 ['Stage 4 introduces Phase Drifter on the campaign schedule',stageDefinition(4).enemySet.some(e=>e.id==='phase-drifter'&&e.type==='ranged'&&e.unlockAt===60)&&runtime.includes("'phase-drifter':{type:'ranged'")],
 ['Stage 4 owns second-hand stasis and zero-hour incidents',stageHazardsWork(4,['second-hand-cut','stasis-burst','zero-hour-lattice'])],
 ['Stage 4 remains a registered adapter without shared wrapper overrides',runtime.includes("stackfallRegisterStageRuntime('stage-04'")&&!runtime.includes('updateSpawning=function')&&!runtime.includes('resetGame=function')],
 ['Stage 4 has a dedicated stasis corridor environment',runtime.includes("theme:'stage-04'")&&stageWorldRenderer(4,realm)&&space.includes('/^stage-\\d{2}$/')],
 ['Phase Drifter has a dedicated common-enemy silhouette',entities.includes("v==='phase-drifter'")&&entities.includes("g.setLineDash(ring?[5,5]:[])")],
 ['Zero-Hour Regulator has a dedicated boss silhouette',runtime.includes('shapes:clockShapes')&&runtime.includes('WEIGHT=')&&elite.includes('stackfallStageProduction')],
 ['Stage 4 boss uses the shared stage dispatcher',bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&shared.includes('window.updateStageBossSkill=function')&&runtime.includes("eventVariant:'stage04-regulator'")],
 ['Stage 4 boss uses authored history orbit and rewind scars',runtime.includes('StageCraft.phase(e,[.68,.30],api)')&&runtime.includes('history.length>64')&&runtime.includes('e.replay=history.slice(-22).reverse()')&&runtime.includes('o.sweepShapes=dt=>')],
 ['Stage 4 unlocks Chrono Ring and progression currency',catalog.includes("rewards:[{type:'weapon',key:'chrono'}")&&catalog.includes("key:'stardust',amount:260")&&catalog.includes("key:'coreShard',amount:1,firstClearOnly:true")],
 ['Stage 4 adapter is loaded after Stage 3',index.indexOf('src/stage03-runtime.js')<index.indexOf('src/stage04-runtime.js')],
 ['all supported languages include Stage 4 combat copy',(lang.match(/'stage04\.enemy\.phaseDrifter'/g)||[]).length>=6&&(lang.match(/'stage04\.objective\.boss'/g)||[]).length>=6]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 4 contracts; failures=${failed}`);if(failed)process.exit(1);