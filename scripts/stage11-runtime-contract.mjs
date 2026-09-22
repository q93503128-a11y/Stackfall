import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage11-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 11 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 11 follows Stage 10',catalog.includes("id:'stage-11'")&&catalog.includes("requirements:{previous:'stage-10'}")],
 ['Stage 11 boss follows the authored 17-minute operation',catalog.includes("boss:{id:'seedvault-custodian',spawnAt:1020")&&catalog.includes("at:1020,kind:'boss',variant:'seedvault-custodian'")],
 ['Stage 11 introduces Husk Warden',catalog.includes("{id:'husk-warden',type:'tank',unlockAt:130}")&&runtime.includes("'husk-warden':{type:'tank'")&&entities.includes("v==='husk-warden'")],
 ['Stage 11 owns husk crush seed mortar and living bulkhead',['husk-crush','seed-mortar','living-bulkhead'].every(x=>catalog.includes(x)&&runtime.includes(x))],
 ['Stage 11 has dedicated environment and boss',realm.includes('function drawStage11Background')&&elite.includes("f==='seedvault-custodian'")],
 ['Stage 11 uses currency-only progression after all current weapon unlocks',catalog.includes("id:'stage-11'")&&!catalog.slice(catalog.indexOf("id:'stage-11'"),catalog.indexOf("id:'stage-12'")).includes("type:'weapon'")],
 ['Stage 11 adapter loads after Stage 10',index.indexOf('src/stage10-runtime.js')<index.indexOf('src/stage11-runtime.js')],
 ['Stage 11 copy exists in six languages',(lang.match(/'stage11\.enemy\.huskWarden'/g)||[]).length>=6&&(lang.match(/'stage11\.objective\.boss'/g)||[]).length>=6]
];let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 11 contracts; failures=${failed}`);if(failed)process.exit(1);
