import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage13-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-13'"),next=catalog.indexOf("id:'stage-14'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 13 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 13 follows Stage 12 in constellation three',catalog.includes("id:'stage-13'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-12'}")],
 ['Stage 13 boss follows the authored 15-minute operation',catalog.includes("boss:{id:'deadband-overseer',spawnAt:900")&&catalog.includes("at:900,kind:'boss',variant:'deadband-overseer'")],
 ['Stage 13 introduces Relay Mite',catalog.includes("id:'relay-mite'")&&runtime.includes("'relay-mite':{")&&entities.includes("v==='relay-mite'")],
 ['Stage 13 owns its fixed signal incidents',['carrier-scan','static-fall','deadband-lock'].every(x=>catalog.includes(x))&&runtime.includes("variant==='static-fall'")&&runtime.includes("variant==='deadband-lock'")&&runtime.includes("tr('stage13.event.carrierScan')")],
 ['Stage 13 has a dedicated environment and boss',realm.includes('function drawStage13Background')&&elite.includes("f==='deadband-overseer'")],
 ['Stage 13 unlocks mine while preserving currency progression',block.includes("{type:'weapon',key:'mine'}")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 13 adapter loads after Stage 12',index.indexOf('src/stage12-runtime.js')<index.indexOf('src/stage13-runtime.js')],
 ['Stage 13 combat copy exists',lang.includes("'stage13.boss'")&&lang.includes("'stage13.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 13 contracts; failures=${failed}`);if(failed)process.exit(1);
