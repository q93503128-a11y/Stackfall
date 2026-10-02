import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage18-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-18'"),next=catalog.indexOf("id:'stage-19'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 18 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 18 follows Stage 17 in constellation three',catalog.includes("id:'stage-18'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-17'}")],
 ['Stage 18 boss follows the authored 15-minute operation',catalog.includes("boss:{id:'silence-mainframe',spawnAt:900")&&catalog.includes("at:900,kind:'boss',variant:'silence-mainframe'")],
 ['Stage 18 deliberately reuses established Silent Array enemies',!catalog.includes("stage18.enemy.")&&['relay-mite','jammer-kite','packet-lancer'].every(x=>runtime.includes(x))],
 ['Stage 18 owns its fixed signal incidents',stageHazardsWork(18,['multiplex-cross','blind-grid','silence-collapse'])],
 ['Stage 18 owns archive anatomy and persistent off-center core exposure',runtime.includes('shapes:mainframeShapes')&&runtime.includes('StageCraft.phase(e,[.74,.36],api)')&&runtime.includes('e.stageCoreExposed=true')&&runtime.includes('e.coreOpenAt??=state.time')],
 ['Stage 18 rewrites actual thick coordinate terrain continuously',runtime.includes('rewritten-coordinate-land')&&runtime.includes('run.rewritePlan')&&runtime.includes('mainframeBasis(plan,t)')&&runtime.includes('o.sweepShapes=dt=>')],
 ['Stage 18 reassigns addresses and executes through real chamber anatomy',runtime.includes('reassigned-address-volume')&&runtime.includes('mainframe-execution-chamber')&&runtime.includes('unbound-archive-leaf')&&!runtime.includes('rawLine(')&&!runtime.includes('addCircle(')],
 ['Stage 18 owns final record silence and ordered archive shutdown',runtime.includes('env.quiet=state.time>=855')&&runtime.includes("music:'mainframe'")&&runtime.includes('victoryDuration:6.2')&&read('src/runtime-config.js').includes('lastaddress:{')],
 ['Stage 18 has a dedicated environment and boss',stageWorldRenderer(18,realm)&&elite.includes("f==='silence-mainframe'")],
 ['Stage 18 uses currency progression without inventing a weapon',!block.includes("type:'weapon'")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 18 adapter loads after Stage 17',index.indexOf('src/stage17-runtime.js')<index.indexOf('src/stage18-runtime.js')],
 ['Stage 18 combat copy exists',lang.includes("'stage18.boss'")&&lang.includes("'stage18.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 18 contracts; failures=${failed}`);if(failed)process.exit(1);
