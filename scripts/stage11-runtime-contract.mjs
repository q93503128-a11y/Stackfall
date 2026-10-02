import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage11-runtime.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 11 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 11 follows Stage 10',catalog.includes("id:'stage-11'")&&catalog.includes("requirements:{previous:'stage-10'}")],
 ['Stage 11 boss follows the authored 10-minute operation',catalog.includes("boss:{id:'seedvault-custodian',spawnAt:600")&&catalog.includes("at:600,kind:'boss',variant:'seedvault-custodian'")],
 ['Stage 11 introduces Husk Warden',stageDefinition(11).enemySet.some(e=>e.id==='husk-warden'&&e.type==='tank'&&e.unlockAt===75)&&runtime.includes("'husk-warden':{type:'tank'")&&entities.includes("v==='husk-warden'")],
 ['Stage 11 owns physical husk crush seed mortar and living bulkhead',stageHazardsWork(11,['husk-crush','seed-mortar','living-bulkhead'])],
 ['Stage 11 owns layered carapace and structural exposure',runtime.includes('shapes:vaultShapes')&&runtime.includes('StageCraft.phase(e,[.55],api)')&&runtime.includes('open*(i%2?25:39)')],
 ['Stage 11 uses curved mortar and actual stamping anatomy sweeps',runtime.includes('vaultSeedPose')&&runtime.includes('custodian-foot-stamp')&&runtime.includes('sweepShapes')&&!runtime.includes('rawLine(')&&!runtime.includes('addCircle(')],
 ['Stage 11 owns continuous husk ridges quiet progression and music',runtime.includes('startX+i*160')&&runtime.includes('env.quiet=state.time>=570')&&runtime.includes("music:'custodian'")&&read('src/runtime-config.js').includes('seedhusk:{')],
 ['Stage 11 owns matched entry and cascading husk defeat',runtime.includes('drawEntry:vaultEntry')&&runtime.includes('drawVictory:vaultVictory')&&runtime.includes('entryDuration:4.1')&&runtime.includes('victoryDuration:4.9')],
 ['Stage 11 has dedicated environment and boss',stageWorldRenderer(11,realm)&&elite.includes("f==='seedvault-custodian'")],
 ['Stage 11 unlocks Vacuum Bloom while preserving currency progression',catalog.includes("id:'stage-11'")&&catalog.slice(catalog.indexOf("id:'stage-11'"),catalog.indexOf("id:'stage-12'")).includes("{type:'weapon',key:'vacuum'}")&&catalog.includes("key:'stardust',amount:590")],
 ['Stage 11 adapter loads after Stage 10',index.indexOf('src/stage10-runtime.js')<index.indexOf('src/stage11-runtime.js')],
 ['Stage 11 copy exists in six languages',(lang.match(/'stage11\.enemy\.huskWarden'/g)||[]).length>=6&&(lang.match(/'stage11\.objective\.boss'/g)||[]).length>=6]
];let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 11 contracts; failures=${failed}`);if(failed)process.exit(1);
