import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage17-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-17'"),next=catalog.indexOf("id:'stage-18'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 17 follows Stage 16 in constellation three',catalog.includes("id:'stage-17'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-16'}")],
 ['Stage 17 boss arrives at ten minutes',catalog.includes("boss:{id:'protocol-custodian',spawnAt:600")&&catalog.includes("at:600,kind:'boss',variant:'protocol-custodian'")],
 ['Stage 17 introduces Cipher Warden',catalog.includes("id:'cipher-warden'")&&runtime.includes("'cipher-warden':{")&&entities.includes("v==='cipher-warden'")],
 ['Stage 17 owns its fixed signal incidents',['parity-mortar','cipher-walls','protocol-seal'].every(x=>catalog.includes(x)&&runtime.includes(x))],
 ['Stage 17 has a dedicated environment and boss',realm.includes('function drawStage17Background')&&elite.includes("f==='protocol-custodian'")],
 ['Stage 17 uses currency progression without inventing a weapon',!block.includes("type:'weapon'")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 17 adapter loads after Stage 16',index.indexOf('src/stage16-runtime.js')<index.indexOf('src/stage17-runtime.js')],
 ['Stage 17 combat copy exists',lang.includes("'stage17.boss'")&&lang.includes("'stage17.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 17 contracts; failures=${failed}`);if(failed)process.exit(1);
