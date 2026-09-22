import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage14-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-14'"),next=catalog.indexOf("id:'stage-15'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 14 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 14 follows Stage 13 in constellation three',catalog.includes("id:'stage-14'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-13'}")],
 ['Stage 14 boss follows the authored 11.5-minute operation',catalog.includes("boss:{id:'noise-harvester',spawnAt:690")&&catalog.includes("at:690,kind:'boss',variant:'noise-harvester'")],
 ['Stage 14 introduces Jammer Kite',catalog.includes("id:'jammer-kite'")&&runtime.includes("'jammer-kite':{")&&entities.includes("v==='jammer-kite'")],
 ['Stage 14 owns its fixed signal incidents',['noise-grid','carrier-break','whiteout-lanes'].every(x=>catalog.includes(x)&&runtime.includes(x))],
 ['Stage 14 has a dedicated environment and boss',realm.includes('function drawStage14Background')&&elite.includes("f==='noise-harvester'")],
 ['Stage 14 uses currency progression without inventing a weapon',!block.includes("type:'weapon'")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 14 adapter loads after Stage 13',index.indexOf('src/stage13-runtime.js')<index.indexOf('src/stage14-runtime.js')],
 ['Stage 14 combat copy exists',lang.includes("'stage14.boss'")&&lang.includes("'stage14.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 14 contracts; failures=${failed}`);if(failed)process.exit(1);
