import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage08-runtime.js'),shared=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),space=read('src/render-space.js'),lang=read('src/language-pack.js'),weapons=read('src/weapons.js');
const checks=[
 ['Stage 8 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 8 follows Stage 7 inside constellation two',catalog.includes("id:'stage-08'")&&catalog.includes("constellationId:'constellation-02'")&&catalog.includes("requirements:{previous:'stage-07'}")],
 ['Stage 8 boss follows the authored 8.5-minute operation',catalog.includes("boss:{id:'abyssal-rootcrown',spawnAt:510")&&catalog.includes("at:510,kind:'boss',variant:'abyssal-rootcrown'")],
 ['Stage 8 introduces Rootlance on the campaign schedule',stageDefinition(8).enemySet.some(e=>e.id==='rootlance'&&e.type==='fast'&&e.unlockAt===90)&&runtime.includes("rootlance:{type:'fast'")],
 ['Stage 8 owns sap geyser vascular rail and arterial rupture incidents',stageHazardsWork(8,['sap-geyser','vascular-rail','arterial-rupture'])],
 ['Stage 8 remains a registered adapter without shared wrapper overrides',runtime.includes("stackfallRegisterStageRuntime('stage-08'")&&!runtime.includes('updateSpawning=function')&&!runtime.includes('resetGame=function')],
 ['Stage 8 has a dedicated living-vessel ravine environment',runtime.includes("theme:'stage-08'")&&stageWorldRenderer(8,realm)&&space.includes('/^stage-\\d{2}$/')],
 ['Rootlance has a dedicated common-enemy silhouette',entities.includes("v==='rootlance'")&&entities.includes("r*1.58")],
 ['Abyssal Rootcrown has a dedicated boss silhouette',elite.includes("f==='abyssal-rootcrown'")&&elite.includes('for(let root=0;root<7;root++)')],
 ['Stage 8 boss uses the shared stage dispatcher',bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&shared.includes('window.updateStageBossSkill=function')&&runtime.includes("eventVariant:'stage08-rootcrown'")],
 ['Stage 8 boss has multi-phase vascular rails and late Rootlance summons',runtime.includes('hp<.23?3:hp<.55?2:1')&&runtime.includes("phase===3?'rootlance':'abyss-spore'")&&runtime.includes('rails=phase===3?5:phase===2?4:3')],
 ['Stage 8 unlocks Interstellar Rail and progression currency',catalog.includes("rewards:[{type:'weapon',key:'rail'}")&&catalog.includes("key:'stardust',amount:460")&&read('src/runtime-config.js').includes("WEAPONS.rail={name:'성간 레일'")],
 ['Stage 8 adapter loads after Stage 7',index.indexOf('src/stage07-runtime.js')<index.indexOf('src/stage08-runtime.js')],
 ['all supported languages include Stage 8 combat copy',(lang.match(/'stage08\.enemy\.rootlance'/g)||[]).length>=6&&(lang.match(/'stage08\.objective\.boss'/g)||[]).length>=6]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 8 contracts; failures=${failed}`);if(failed)process.exit(1);