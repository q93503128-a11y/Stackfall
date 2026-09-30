import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage07-runtime.js'),shared=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),space=read('src/render-space.js'),lang=read('src/language-pack.js'),weapons=read('src/weapons.js'),meta=read('src/meta-progression.js');
const checks=[
 ['Stage 7 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 7 starts constellation two only after Stage 6',catalog.includes("id:'constellation-02'")&&catalog.includes("id:'stage-07'")&&catalog.includes("constellationId:'constellation-02'")&&catalog.includes("requirements:{previous:'stage-06'}")],
 ['Stage 7 boss follows the authored 8-minute operation',catalog.includes("boss:{id:'nightbloom-matriarch',spawnAt:480")&&catalog.includes("at:480,kind:'boss',variant:'nightbloom-matriarch'")],
 ['Stage 7 introduces Abyss Spore on the campaign schedule',stageDefinition(7).enemySet.some(e=>e.id==='abyss-spore'&&e.type==='ranged'&&e.unlockAt===80)&&runtime.includes("'abyss-spore':{type:'ranged'")],
 ['Stage 7 owns root cage spore rain and black bloom incidents',stageHazardsWork(7,['root-cage','spore-rain','black-bloom'])],
 ['Stage 7 remains a registered adapter without shared wrapper overrides',runtime.includes("stackfallRegisterStageRuntime('stage-07'")&&!runtime.includes('updateSpawning=function')&&!runtime.includes('resetGame=function')],
 ['Stage 7 has a dedicated living-nebula environment',runtime.includes("theme:'stage-07'")&&stageWorldRenderer(7,realm)&&space.includes('/^stage-\\d{2}$/')],
 ['Abyss Spore has a dedicated common-enemy silhouette',entities.includes("v==='abyss-spore'")&&entities.includes('for(let petal=0;petal<5;petal++)')],
 ['Nightbloom Matriarch has a dedicated boss silhouette',elite.includes("f==='nightbloom-matriarch'")&&elite.includes('for(let petal=0;petal<8;petal++)')],
 ['Stage 7 boss uses the shared stage dispatcher',bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&shared.includes('window.updateStageBossSkill=function')&&runtime.includes("eventVariant:'stage07-matriarch'")],
 ['Stage 7 boss uses authored predatory chase and pounce',runtime.includes('bossSkill:null')&&shared.includes("'stage-07':[.48]")&&shared.includes("phase===2?1.34:.94")&&shared.includes("'stage-07':(e,api,p,c,d,q,l)=>{addCircle")],
 ['Stage 7 unlocks Meteor Drones and progression currency',catalog.includes("rewards:[{type:'weapon',key:'drone'}")&&catalog.includes("key:'stardust',amount:410")&&read('src/runtime-config.js').includes("WEAPONS.drone={name:'유성 드론'")],
 ['all weapon definitions load before meta progression rebuilds unlocked weapons',index.indexOf('src/weapons.js')<index.indexOf('src/meta-progression.js')&&meta.includes('version:4')],
 ['Stage 7 adapter loads after Stage 6',index.indexOf('src/stage06-runtime.js')<index.indexOf('src/stage07-runtime.js')],
 ['all supported languages include Stage 7 combat copy',(lang.match(/'stage07\.enemy\.abyssSpore'/g)||[]).length>=6&&(lang.match(/'stage07\.objective\.boss'/g)||[]).length>=6]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 7 contracts; failures=${failed}`);if(failed)process.exit(1);