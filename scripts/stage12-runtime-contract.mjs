import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage12-runtime.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 12 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&runtime.includes('hazard(event,api)')],
 ['Stage 12 closes constellation two after Stage 11',catalog.includes("id:'stage-12'")&&catalog.includes("constellationId:'constellation-02'")&&catalog.includes("requirements:{previous:'stage-11'}")],
 ['Stage 12 boss follows the authored 10.5-minute operation',catalog.includes("boss:{id:'abyssal-bloomheart',spawnAt:630")&&catalog.includes("at:630,kind:'boss',variant:'abyssal-bloomheart'")],
 ['Stage 12 reuses all major constellation-two enemy identities',['abyss-spore','rootlance','spiral-pod','husk-warden'].every(x=>runtime.includes(x))],
 ['Stage 12 owns convergence spiral and overgrowth incidents',stageHazardsWork(12,['bloomheart-cross','vascular-spiral','abyssal-overgrowth'])],
 ['Stage 12 has dedicated finale environment and boss',stageWorldRenderer(12,realm)&&elite.includes("f==='abyssal-bloomheart'")],
 ['Stage 12 finale grants two first-clear Core Shards',catalog.includes("id:'stage-12'")&&catalog.includes("key:'coreShard',amount:2,firstClearOnly:true")],
 ['Stage 12 adapter loads after Stage 11',index.indexOf('src/stage11-runtime.js')<index.indexOf('src/stage12-runtime.js')],
 ['Stage 12 copy exists in six languages',(lang.match(/'stage12\.boss'/g)||[]).length>=6&&(lang.match(/'stage12\.objective\.boss'/g)||[]).length>=6]
];let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 12 contracts; failures=${failed}`);if(failed)process.exit(1);
