import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage13-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-13'"),next=catalog.indexOf("id:'stage-14'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 13 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 13 follows Stage 12 in constellation three',catalog.includes("id:'stage-13'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-12'}")],
 ['Stage 13 boss follows the authored 11-minute operation',catalog.includes("boss:{id:'deadband-overseer',spawnAt:660")&&catalog.includes("at:660,kind:'boss',variant:'deadband-overseer'")],
 ['Stage 13 introduces Relay Mite',catalog.includes("id:'relay-mite'")&&runtime.includes("'relay-mite':{")&&entities.includes("v==='relay-mite'")],
 ['Stage 13 owns its fixed signal incidents',stageHazardsWork(13,['carrier-scan','static-fall','deadband-lock'])],
 ['Stage 13 owns asymmetric receiver hardware and persistent opening',runtime.includes('shapes:relayShapes')&&runtime.includes('StageCraft.phase(e,[.57],api)')&&runtime.includes('e.relayOpenAt??=state.time')],
 ['Stage 13 uses physical comb and continuous three-leg forwarding',runtime.includes("kind:'receiver-comb-scan'")&&runtime.includes('relayPacketPose')&&runtime.includes('o.sweepShapes')&&!runtime.includes('rawLine(')&&!runtime.includes('addCircle(')],
 ['Stage 13 owns listening cadence world and music',runtime.includes('listen=time%period>period-1.8')&&runtime.includes('env.quiet=state.time>=630')&&runtime.includes("music:'deadband'")&&read('src/runtime-config.js').includes('deadrelay:{')],
 ['Stage 13 assembles and retracts the same receiver',runtime.includes('drawEntry:relayEntry')&&runtime.includes('drawVictory:relayVictory')&&runtime.includes('victoryDuration:4.4')],
 ['Stage 13 has a dedicated environment and boss',stageWorldRenderer(13,realm)&&elite.includes("f==='deadband-overseer'")],
 ['Stage 13 unlocks mine while preserving currency progression',block.includes("{type:'weapon',key:'mine'}")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 13 adapter loads after Stage 12',index.indexOf('src/stage12-runtime.js')<index.indexOf('src/stage13-runtime.js')],
 ['Stage 13 combat copy exists',lang.includes("'stage13.boss'")&&lang.includes("'stage13.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 13 contracts; failures=${failed}`);if(failed)process.exit(1);
