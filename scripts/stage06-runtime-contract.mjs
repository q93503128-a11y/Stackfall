import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage06-runtime.js'),shared=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),space=read('src/render-space.js'),lang=read('src/language-pack.js'),weapons=read('src/weapons.js');
const checks=[
 ['Stage 6 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&shared.includes('updateAmbientGimmick(run,def)')],
 ['Stage 6 completes constellation one after Stage 5',catalog.includes("id:'stage-06'")&&catalog.includes("constellationId:'constellation-01'")&&catalog.includes("requirements:{previous:'stage-05'}")],
 ['Stage 6 boss follows the authored 7.5-minute operation',catalog.includes("boss:{id:'shardway-nexus',spawnAt:450")&&catalog.includes("at:450,kind:'boss',variant:'shardway-nexus'")],
 ['Stage 6 deliberately reuses established common enemies rather than forcing a new trash family',!catalog.includes("stage06.enemy.")&&['glass-wing','phase-drifter','conduit-leech'].every(token=>runtime.includes(token))],
 ['Stage 6 remixes convergence timefold and route-collapse incidents',stageHazardsWork(6,['convergence-cross','timefold-grid','route-collapse'])],
 ['Stage 6 remains a registered adapter without shared wrapper overrides',runtime.includes("stackfallRegisterStageRuntime('stage-06'")&&!runtime.includes('updateSpawning=function')&&!runtime.includes('resetGame=function')],
 ['Stage 6 has a dedicated convergence environment',runtime.includes("theme:'stage-06'")&&stageWorldRenderer(6,realm)&&space.includes('/^stage-\\d{2}$/')],
 ['Shardway Nexus has a dedicated boss silhouette',elite.includes("f==='shardway-nexus'")&&elite.includes('for(let arm=0;arm<6;arm++)')],
 ['Stage 6 boss uses the shared stage dispatcher',bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&shared.includes('window.updateStageBossSkill=function')&&runtime.includes("eventVariant:'stage06-nexus'")],
 ['Stage 6 boss is the authored three-phase Route convergence finale',runtime.includes('bossSkill:null')&&shared.includes("'stage-06':[.70,.35]")&&shared.includes("e.stageFinaleMode='route-convergence'")&&shared.includes("'route-fold'")],
 ['Stage 6 unlocks Supernova Coil and progression currency',catalog.includes("rewards:[{type:'weapon',key:'nova'}")&&catalog.includes("key:'stardust',amount:360")&&read('src/runtime-config.js').includes("WEAPONS.nova={name:'초신성 코일'")],
 ['Stage 6 adapter loads after Stage 5',index.indexOf('src/stage05-runtime.js')<index.indexOf('src/stage06-runtime.js')],
 ['all supported languages include Stage 6 combat copy',(lang.match(/'stage06\.boss'/g)||[]).length>=6&&(lang.match(/'stage06\.objective\.boss'/g)||[]).length>=6]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 6 contracts; failures=${failed}`);if(failed)process.exit(1);