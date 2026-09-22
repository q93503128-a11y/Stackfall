import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage18-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-18'"),next=catalog.indexOf("id:'stage-19'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 18 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 18 follows Stage 17 in constellation three',catalog.includes("id:'stage-18'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-17'}")],
 ['Stage 18 boss follows the authored 15-minute operation',catalog.includes("boss:{id:'silence-mainframe',spawnAt:900")&&catalog.includes("at:900,kind:'boss',variant:'silence-mainframe'")],
 ['Stage 18 deliberately reuses established Silent Array enemies',!catalog.includes("stage18.enemy.")&&['relay-mite','jammer-kite','packet-lancer'].every(x=>runtime.includes(x))],
 ['Stage 18 owns its fixed signal incidents',['multiplex-cross','blind-grid','silence-collapse'].every(x=>catalog.includes(x)&&runtime.includes(x))],
 ['Stage 18 has a dedicated environment and boss',realm.includes('function drawStage18Background')&&elite.includes("f==='silence-mainframe'")],
 ['Stage 18 uses currency progression without inventing a weapon',!block.includes("type:'weapon'")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 18 adapter loads after Stage 17',index.indexOf('src/stage17-runtime.js')<index.indexOf('src/stage18-runtime.js')],
 ['Stage 18 combat copy exists',lang.includes("'stage18.boss'")&&lang.includes("'stage18.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 18 contracts; failures=${failed}`);if(failed)process.exit(1);
