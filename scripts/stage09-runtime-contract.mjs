import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage09-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js'),weapons=read('src/weapons.js');
const checks=[
 ['Stage 9 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 9 follows Stage 8 in constellation two',catalog.includes("id:'stage-09'")&&catalog.includes("requirements:{previous:'stage-08'}")],
 ['Stage 9 boss follows the authored 9-minute operation',catalog.includes("boss:{id:'helix-nursery',spawnAt:540")&&catalog.includes("at:540,kind:'boss',variant:'helix-nursery'")],
 ['Stage 9 introduces Spiral Pod',catalog.includes("{id:'spiral-pod',type:'ranged',unlockAt:125}")&&runtime.includes("'spiral-pod':{type:'ranged'")&&entities.includes("v==='spiral-pod'")],
 ['Stage 9 has helix seed-orbit and vortex incidents',['helix-sweep','seed-orbit','bloom-vortex'].every(x=>catalog.includes(x)&&runtime.includes(x))],
 ['Stage 9 has dedicated environment and boss',realm.includes('function drawStage09Background')&&elite.includes("f==='helix-nursery'")],
 ['Stage 9 unlocks Galactic Spiral',catalog.includes("rewards:[{type:'weapon',key:'spiral'}")&&weapons.includes("WEAPONS.spiral={name:'은하 나선'")],
 ['Stage 9 adapter loads after Stage 8',index.indexOf('src/stage08-runtime.js')<index.indexOf('src/stage09-runtime.js')],
 ['Stage 9 copy exists in six languages',(lang.match(/'stage09\.enemy\.spiralPod'/g)||[]).length>=6&&(lang.match(/'stage09\.objective\.boss'/g)||[]).length>=6]
];let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 9 contracts; failures=${failed}`);if(failed)process.exit(1);
