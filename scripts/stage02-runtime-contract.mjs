import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage02-runtime.js'),stage1=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 2 exists and unlocks after Stage 1',catalog.includes("id:'stage-02'")&&catalog.includes("requirements:{previous:'stage-01'}")],
 ['Stage 2 boss arrives at exactly ten minutes',catalog.includes("boss:{id:'nebula-heart',spawnAt:600")&&catalog.includes("at:600,kind:'boss',variant:'nebula-heart'")],
 ['Stage 2 reuses common enemies and introduces only Nebula Wisp as the new common variant',catalog.includes("{id:'shardling'")&&catalog.includes("{id:'dart'")&&catalog.includes("{id:'bombardier'")&&catalog.includes("{id:'bulwark'")&&catalog.includes("{id:'nebula-wisp',type:'ranged'")],
 ['Stage 2 owns a fixed incident timeline',[120,220,330,450,530,600].every(n=>catalog.includes('at:'+n))&&catalog.includes("variant:'ion-shear'")&&catalog.includes("variant:'deep-shear'")],
 ['Stage 2 never clears from timer expiration',!runtime.includes('durationSeconds')&&!runtime.includes("state.mode='stageComplete'")],
 ['Stage 2 suppresses Endless Apex and random world events',runtime.includes('state.nextApexAt=Infinity')&&runtime.includes('stage02AwareMapEvents(dt){if(isStage())return;')],
 ['Stage 2 has its own nebula-space environment',runtime.includes("state.realmTheme='stage-02'")&&realm.includes('function drawStage02Background')&&realm.includes("theme==='stage-02'")],
 ['Nebula Wisp has a dedicated common-enemy silhouette',entities.includes("v==='nebula-wisp'")&&entities.includes("g.quadraticCurveTo(-r*.82")],
 ['Nebula Heart has a dedicated boss silhouette',elite.includes("f==='nebula-heart'")&&elite.includes('for(let petal=0;petal<5;petal++)')],
 ['Nebula Heart has a dedicated routed boss pattern',bosses.includes("enemy.eventVariant==='stage02-heart'")&&runtime.includes('window.updateStage02BossSkill=function')],
 ['Nebula Heart uses multi-phase shears and wisp summons',runtime.includes('hp<.32?3:hp<.66?2:1')&&runtime.includes("spawnBurst('nebula-wisp'")&&runtime.includes("rawLine(p.x-dx*half")],
 ['Stage 2 boss defeat reuses the shared staged victory cinematic',stage1.includes('window.stackfallBeginStageVictory=beginStageVictory')&&runtime.includes('window.stackfallBeginStageVictory?.(enemy)')],
 ['Stage 2 unlocks Nebula Boomerang and progression currency',catalog.includes("rewards:[{type:'weapon',key:'arc'}")&&catalog.includes("key:'stardust',amount:180")&&catalog.includes("key:'coreShard',amount:1,firstClearOnly:true")],
 ['Stage 2 runtime loads after the shared stage runtime',index.indexOf('src/stage-runtime.js')<index.indexOf('src/stage02-runtime.js')],
 ['all supported languages include Stage 2 combat copy',(lang.match(/'stage02\.enemy\.wisp'/g)||[]).length>=6&&(lang.match(/'stage02\.objective\.boss'/g)||[]).length>=6]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 2 contracts; failures=${failed}`);if(failed)process.exit(1);
