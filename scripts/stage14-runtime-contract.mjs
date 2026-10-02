import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage14-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const start=catalog.indexOf("id:'stage-14'"),next=catalog.indexOf("id:'stage-15'",start+1),block=catalog.slice(start,next<0?catalog.length:next);
const checks=[
 ['Stage 14 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 14 follows Stage 13 in constellation three',catalog.includes("id:'stage-14'")&&catalog.includes("constellationId:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-13'}")],
 ['Stage 14 boss follows the authored 11.5-minute operation',catalog.includes("boss:{id:'noise-harvester',spawnAt:690")&&catalog.includes("at:690,kind:'boss',variant:'noise-harvester'")],
 ['Stage 14 introduces Jammer Kite',catalog.includes("id:'jammer-kite'")&&runtime.includes("'jammer-kite':{")&&entities.includes("v==='jammer-kite'")],
 ['Stage 14 owns its fixed signal incidents',stageHazardsWork(14,['noise-grid','carrier-break','whiteout-lanes'])],
 ['Stage 14 owns unequal vibrating baffles and persistent two-phase opening',runtime.includes('shapes:noiseShapes')&&runtime.includes('StageCraft.phase(e,[.66,.31],api)')&&runtime.includes('e.bafflesOpenAt??=state.time')],
 ['Stage 14 owns real cancellation and organic residue cells',runtime.includes('this.cancelled=t>=.8')&&runtime.includes('!this.cancelled')&&runtime.includes('growing-residue-cell')&&!runtime.includes('rawLine(')&&!runtime.includes('addCircle(')],
 ['Stage 14 owns noise progression music and staged baffle failure',runtime.includes('env.quiet=state.time>=660')&&runtime.includes("music:'harvester'")&&runtime.includes('drawVictory:noiseVictory')&&read('src/runtime-config.js').includes('staticnarrows:{')],
 ['Stage 14 keeps foil motion continuous through three pauses',runtime.includes('motion:foilProgress')&&runtime.includes('[.19,.28,.28,.28]')&&runtime.includes('[.76,.85,.81,.81]')],
 ['Stage 14 has a dedicated environment and boss',stageWorldRenderer(14,realm)&&elite.includes("f==='noise-harvester'")],
 ['Stage 14 uses currency progression without inventing a weapon',!block.includes("type:'weapon'")&&block.includes("key:'stardust'")&&block.includes("key:'coreShard'")],
 ['Stage 14 adapter loads after Stage 13',index.indexOf('src/stage13-runtime.js')<index.indexOf('src/stage14-runtime.js')],
 ['Stage 14 combat copy exists',lang.includes("'stage14.boss'")&&lang.includes("'stage14.objective.boss'")]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 14 contracts; failures=${failed}`);if(failed)process.exit(1);
