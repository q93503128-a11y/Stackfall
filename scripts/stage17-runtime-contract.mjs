import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage17-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-17'"),next=catalog.indexOf("id:'stage-18'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 17 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 17 follows Stage 16 in constellation three',catalog.includes("id:'stage-17'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-16'}")],
 ['Stage 17 boss follows the authored 14-minute operation',catalog.includes("boss:{id:'protocol-custodian',spawnAt:840")&&catalog.includes("at:840,kind:'boss',variant:'protocol-custodian'")],
 ['Stage 17 introduces Cipher Warden',catalog.includes("id:'cipher-warden'")&&runtime.includes("'cipher-warden':{")&&entities.includes("v==='cipher-warden'")],
 ['Stage 17 owns its fixed signal incidents',stageHazardsWork(17,['parity-mortar','cipher-walls','protocol-seal'])],
 ['Stage 17 preserves asymmetric keyed anatomy and sliding shield',runtime.includes('shapes:protocolShapes')&&runtime.includes('StageCraft.phase(e,[.54],api)')&&runtime.includes('e.shieldOpenAt??=state.time')],
 ['Stage 17 locks recorded movement and leaves the opposite real exit',runtime.includes('e.routeHistory.length>20')&&runtime.includes('open:(blocked+2)%4')&&runtime.includes('o.sectionsAt=t=>protocolFrame')&&runtime.includes('o.sweepShapes=()=>')],
 ['Stage 17 owns actual reciprocating saw and curved keys',runtime.includes('custodian-reciprocating-saw')&&runtime.includes('parity-key-mortar')&&!runtime.includes('rawLine(')&&!runtime.includes('addCircle(')],
 ['Stage 17 owns lock silence and reverse latch shutdown',runtime.includes('env.quiet=state.time>=800')&&runtime.includes("music:'custody'")&&runtime.includes('drawVictory:protocolVictory')&&read('src/runtime-config.js').includes('cipherkeep:{')],
 ['Stage 17 has a dedicated environment and boss',stageWorldRenderer(17,realm)&&elite.includes("f==='protocol-custodian'")],
 ['Stage 17 unlocks gate while preserving currency progression',block.includes("{type:'weapon',key:'gate'}")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 17 adapter loads after Stage 16',index.indexOf('src/stage16-runtime.js')<index.indexOf('src/stage17-runtime.js')],
 ['Stage 17 combat copy exists',lang.includes("'stage17.boss'")&&lang.includes("'stage17.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 17 contracts; failures=${failed}`);if(failed)process.exit(1);
