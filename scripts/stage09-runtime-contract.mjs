import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage09-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js'),weapons=read('src/weapons.js');
const checks=[
 ['Stage 9 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 9 follows Stage 8 in constellation two',catalog.includes("id:'stage-09'")&&catalog.includes("requirements:{previous:'stage-08'}")],
 ['Stage 9 boss follows the authored 9-minute operation',catalog.includes("boss:{id:'helix-nursery',spawnAt:540")&&catalog.includes("at:540,kind:'boss',variant:'helix-nursery'")],
 ['Stage 9 introduces Spiral Pod',stageDefinition(9).enemySet.some(e=>e.id==='spiral-pod'&&e.type==='ranged'&&e.unlockAt===80)&&runtime.includes("'spiral-pod':{type:'ranged'")&&entities.includes("v==='spiral-pod'")&&entities.includes('g.moveTo(-r*.18,-r*.90)')],
 ['Stage 9 turns helix seed-orbit and vortex incidents into physical seeds and germs',stageHazardsWork(9,['helix-sweep','seed-orbit','bloom-vortex'])],
 ['Stage 9 has dedicated environment and boss',stageWorldRenderer(9,realm)&&elite.includes("f==='helix-nursery'")],
 ['Stage 9 owns twisted asymmetric anatomy and structural dehiscence',runtime.includes('shapes:nurseryShapes')&&runtime.includes('StageCraft.phase(e,[.50],api)')&&runtime.includes('open*34')],
 ['Stage 9 owns crossing seed paths and real rolling body sweeps',runtime.includes('nurserySeedPath')&&runtime.includes('sweepShapes')&&runtime.includes('nursery-body-turnover')&&!runtime.includes('rawLine(')&&!runtime.includes('addCircle(')],
 ['Stage 9 has a quiet evolving seedbed and authored music',runtime.includes('env.quiet=state.time>=510')&&runtime.includes('env.darkJoin=')&&runtime.includes("music:'nursery'")&&read('src/runtime-config.js').includes('seedbed:{')],
 ['Stage 9 reveals only a precursor before Stage 10 first void',runtime.includes('first full void event stays in S10')&&read('src/stage-runtime.js').includes("10:Object.freeze([{at:.13,type:'void'}")],
 ['Stage 9 owns matching entry and unraveling victory',runtime.includes('drawEntry:nurseryEntry')&&runtime.includes('drawVictory:nurseryVictory')&&runtime.includes('entryDuration:4.0')&&runtime.includes('victoryDuration:4.7')],
 ['Stage 9 unlocks Galactic Spiral',catalog.includes("rewards:[{type:'weapon',key:'spiral'}")&&read('src/runtime-config.js').includes("WEAPONS.spiral={name:'은하 나선'")],
 ['Stage 9 adapter loads after Stage 8',index.indexOf('src/stage08-runtime.js')<index.indexOf('src/stage09-runtime.js')],
 ['Stage 9 copy exists in six languages',(lang.match(/'stage09\.enemy\.spiralPod'/g)||[]).length>=6&&(lang.match(/'stage09\.objective\.boss'/g)||[]).length>=6]
];let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 9 contracts; failures=${failed}`);if(failed)process.exit(1);
