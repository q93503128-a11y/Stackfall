import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage05-runtime.js'),shared=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),space=read('src/render-space.js'),lang=read('src/language-pack.js'),weapons=read('src/weapons.js');
const checks=[
 ['Stage 5 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&shared.includes('updateAmbientGimmick(run,def)')],
 ['Stage 5 exists after Stage 4 in constellation one',catalog.includes("id:'stage-05'")&&catalog.includes("constellationId:'constellation-01'")&&catalog.includes("requirements:{previous:'stage-04'}")],
 ['Stage 5 boss follows the authored 7-minute operation',catalog.includes("boss:{id:'dipole-crown',spawnAt:420")&&catalog.includes("at:420,kind:'boss',variant:'dipole-crown'")],
 ['Stage 5 introduces Conduit Leech on the campaign schedule',stageDefinition(5).enemySet.some(e=>e.id==='conduit-leech'&&e.type==='tank'&&e.unlockAt===65)&&runtime.includes("'conduit-leech':{type:'tank'")],
 ['Stage 5 owns magnetic arc polarity and collapse incidents',stageHazardsWork(5,['magnetic-arc','pole-reversal','magnetar-collapse'])],
 ['Stage 5 remains a registered adapter without shared wrapper overrides',runtime.includes("stackfallRegisterStageRuntime('stage-05'")&&!runtime.includes('updateSpawning=function')&&!runtime.includes('resetGame=function')],
 ['Stage 5 has a dedicated magnetar environment',runtime.includes("theme:'stage-05'")&&stageWorldRenderer(5,realm)&&space.includes('/^stage-\\d{2}$/')],
 ['Conduit Leech has a dedicated common-enemy silhouette',entities.includes("v==='conduit-leech'")&&entities.includes('for(let seg=0;seg<6;seg++)')],
 ['Dipole Crown has a dedicated boss silhouette',elite.includes("f==='dipole-crown'")&&elite.includes('for(let arc=0;arc<3+phase;arc++)')],
 ['Stage 5 boss uses the shared stage dispatcher',bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&shared.includes('window.updateStageBossSkill=function')&&runtime.includes("eventVariant:'stage05-crown'")],
 ['Stage 5 boss has multi-phase dipole pressure and Conduit Leech summons',runtime.includes('hp<.27?3:hp<.60?2:1')&&runtime.includes("api.spawnBurst('conduit-leech'")&&runtime.includes('axes=phase===3?4:phase===2?3:2')],
 ['Stage 5 unlocks Ion Chain and progression currency',catalog.includes("rewards:[{type:'weapon',key:'ion'}")&&catalog.includes("key:'stardust',amount:300")&&catalog.includes("key:'coreShard',amount:1,firstClearOnly:true")&&read('src/runtime-config.js').includes("WEAPONS.ion={name:'이온 사슬'")],
 ['Stage 5 adapter is loaded after Stage 4',index.indexOf('src/stage04-runtime.js')<index.indexOf('src/stage05-runtime.js')],
 ['all supported languages include Stage 5 combat copy',(lang.match(/'stage05\.enemy\.conduitLeech'/g)||[]).length>=6&&(lang.match(/'stage05\.objective\.boss'/g)||[]).length>=6]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 5 contracts; failures=${failed}`);if(failed)process.exit(1);