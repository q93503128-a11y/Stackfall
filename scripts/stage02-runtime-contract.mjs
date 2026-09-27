import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage02-runtime.js'),shared=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),space=read('src/render-space.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 2 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&shared.includes('updateAmbientGimmick(run,def)')],
 ['Stage 2 exists and unlocks after Stage 1',catalog.includes("id:'stage-02'")&&catalog.includes("requirements:{previous:'stage-01'}")],
 ['Stage 2 boss follows the authored 5.5-minute operation',catalog.includes("boss:{id:'nebula-heart',spawnAt:330")&&catalog.includes("at:330,kind:'boss',variant:'nebula-heart'")],
 ['Stage 2 introduces Nebula Wisp while reusing the established roster',catalog.includes("{id:'nebula-wisp',type:'ranged'")&&['shardling','dart','bombardier','bulwark'].every(id=>catalog.includes("id:'"+id+"'"))],
 ['Stage 2 owns its fixed incident timeline',[65,120,185,250,295,330].every(n=>catalog.includes('at:'+n))],
 ['Stage 2 is a registered adapter with no wrapper chain',runtime.includes("stackfallRegisterStageRuntime('stage-02'")&&!runtime.includes('updateSpawning=function')&&!runtime.includes('resetGame=function')&&!runtime.includes('window.updateMapEvents=function')],
 ['Stage 2 has its own nebula-space environment',runtime.includes("theme:'stage-02'")&&stageWorldRenderer(2,realm)&&space.includes('/^stage-\\d{2}$/')],
 ['Nebula Wisp has a dedicated common-enemy silhouette',entities.includes("v==='nebula-wisp'")],
 ['Nebula Heart has a dedicated boss silhouette',elite.includes("f==='nebula-heart'")],
 ['Nebula Heart uses the shared stage-boss dispatcher',bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&shared.includes('window.updateStageBossSkill=function')&&runtime.includes("eventVariant:'stage02-heart'")],
 ['Nebula Heart keeps multi-phase shears and wisp summons',runtime.includes('hp<.32?3:hp<.66?2:1')&&runtime.includes("api.spawnBurst('nebula-wisp'")&&runtime.includes('rawLine(p.x-dx*half')],
 ['Stage 2 defeat reuses the shared staged victory cinematic',shared.includes('window.handleStageBossDefeated=function')&&shared.includes('beginStageVictory(enemy)')],
 ['Stage 2 unlocks Nebula Boomerang and progression currency',catalog.includes("rewards:[{type:'weapon',key:'arc'}")&&catalog.includes("key:'stardust',amount:180")],
 ['Stage 2 adapter loads after the shared stage runtime',index.indexOf('src/stage-runtime.js')<index.indexOf('src/stage02-runtime.js')],
 ['all supported languages include Stage 2 combat copy',(lang.match(/'stage02\.enemy\.wisp'/g)||[]).length>=6&&(lang.match(/'stage02\.objective\.boss'/g)||[]).length>=6]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 2 contracts; failures=${failed}`);if(failed)process.exit(1);