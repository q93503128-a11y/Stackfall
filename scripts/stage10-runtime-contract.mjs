import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage10-runtime.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js'),weapons=read('src/weapons.js');
const checks=[
 ['Stage 10 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 10 follows Stage 9',catalog.includes("id:'stage-10'")&&catalog.includes("requirements:{previous:'stage-09'}")],
 ['Stage 10 boss follows the authored 15-minute operation',catalog.includes("boss:{id:'mirrorpetal-halo',spawnAt:900")&&catalog.includes("at:900,kind:'boss',variant:'mirrorpetal-halo'")],
 ['Stage 10 deliberately reuses the living-nebula roster',!catalog.includes("stage10.enemy.")&&['rootlance','spiral-pod','abyss-spore'].every(x=>runtime.includes(x))],
 ['Stage 10 owns mirror petal echo bloom and reflection cage',['mirror-petal','echo-bloom','reflection-cage'].every(x=>catalog.includes(x)&&runtime.includes(x))],
 ['Stage 10 has dedicated environment and boss',realm.includes('function drawStage10Background')&&elite.includes("f==='mirrorpetal-halo'")],
 ['Stage 10 unlocks Reflective Constellation',catalog.includes("rewards:[{type:'weapon',key:'mirror'}")&&weapons.includes("WEAPONS.mirror={name:'반사 성좌'")],
 ['Stage 10 adapter loads after Stage 9',index.indexOf('src/stage09-runtime.js')<index.indexOf('src/stage10-runtime.js')],
 ['Stage 10 copy exists in six languages',(lang.match(/'stage10\.boss'/g)||[]).length>=6&&(lang.match(/'stage10\.objective\.boss'/g)||[]).length>=6]
];let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 10 contracts; failures=${failed}`);if(failed)process.exit(1);
