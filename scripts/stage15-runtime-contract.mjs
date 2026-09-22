import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage15-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-15'"),next=catalog.indexOf("id:'stage-16'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 15 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 15 follows Stage 14 in constellation three',catalog.includes("id:'stage-15'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-14'}")],
 ['Stage 15 boss follows the authored 18-minute operation',catalog.includes("boss:{id:'multiplex-engine',spawnAt:1080")&&catalog.includes("at:1080,kind:'boss',variant:'multiplex-engine'")],
 ['Stage 15 introduces Packet Lancer',catalog.includes("id:'packet-lancer'")&&runtime.includes("'packet-lancer':{")&&entities.includes("v==='packet-lancer'")],
 ['Stage 15 owns its fixed signal incidents',['multiplex-lanes','burst-switch','checksum-storm'].every(x=>catalog.includes(x)&&runtime.includes(x))],
 ['Stage 15 has a dedicated environment and boss',realm.includes('function drawStage15Background')&&elite.includes("f==='multiplex-engine'")],
 ['Stage 15 uses currency progression without inventing a weapon',!block.includes("type:'weapon'")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 15 adapter loads after Stage 14',index.indexOf('src/stage14-runtime.js')<index.indexOf('src/stage15-runtime.js')],
 ['Stage 15 combat copy exists',lang.includes("'stage15.boss'")&&lang.includes("'stage15.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 15 contracts; failures=${failed}`);if(failed)process.exit(1);
