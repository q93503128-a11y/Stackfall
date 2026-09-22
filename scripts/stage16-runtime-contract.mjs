import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage16-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-16'"),next=catalog.indexOf("id:'stage-17'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 16 follows Stage 15 in constellation three',catalog.includes("id:'stage-16'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-15'}")],
 ['Stage 16 boss arrives at ten minutes',catalog.includes("boss:{id:'null-beacon',spawnAt:600")&&catalog.includes("at:600,kind:'boss',variant:'null-beacon'")],
 ['Stage 16 deliberately reuses established Silent Array enemies',!catalog.includes("stage16.enemy.")&&['relay-mite','jammer-kite','packet-lancer'].every(x=>runtime.includes(x))],
 ['Stage 16 owns its fixed signal incidents',['dead-zone','blind-cross','null-sweep'].every(x=>catalog.includes(x)&&runtime.includes(x))],
 ['Stage 16 has a dedicated environment and boss',realm.includes('function drawStage16Background')&&elite.includes("f==='null-beacon'")],
 ['Stage 16 uses currency progression without inventing a weapon',!block.includes("type:'weapon'")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 16 adapter loads after Stage 15',index.indexOf('src/stage15-runtime.js')<index.indexOf('src/stage16-runtime.js')],
 ['Stage 16 combat copy exists',lang.includes("'stage16.boss'")&&lang.includes("'stage16.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 16 contracts; failures=${failed}`);if(failed)process.exit(1);
