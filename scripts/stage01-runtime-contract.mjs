import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/stage-catalog.js'),meta=read('src/meta-progression.js'),runtime=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),render=read('src/render.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),index=read('index.html'),iface=read('src/interface.js'),feature=read('src/feature-pack.js'),progression=read('src/progression-expansion.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 1 boss enters at exactly ten minutes',catalog.includes('durationSeconds:600')&&catalog.includes("spawnAt:600")&&catalog.includes("at:600,kind:'boss'")],
 ['Stage 1 introduces four dedicated enemy variants',['shardling','dart','bombardier','bulwark'].every(id=>catalog.includes("id:'"+id+"'"))&&['shardling','dart','bombardier','bulwark'].every(id=>runtime.includes(id))],
 ['Stage 1 fixed timeline reaches the boss at 600 seconds',["at:90","at:210","at:300","at:420","at:500","at:600"].every(token=>catalog.includes(token))],
 ['Stage runtime never clears because a timer expired',!runtime.includes('state.time>=run.stage.durationSeconds')&&!runtime.includes('state.time>=run.stage.durationSeconds&&')],
 ['Stage runtime bypasses Endless spawning and Apex scheduling',runtime.includes('updateSpawning=function stageAwareSpawning')&&runtime.includes('if(isStage()){updateStage(dt);return;}')&&runtime.includes('state.nextApexAt=Infinity')],
 ['random world-event updates are suppressed during stage runs',runtime.includes('window.updateMapEvents=function stageAwareMapEvents(dt){if(isStage())return;')],
 ['boss countdown is hidden before the boss actually exists',runtime.includes("if(!boss){objective.classList.add('hidden');return;}")&&!runtime.includes("stage01.objective.next")],
 ['Stage 1 boss uses its own skill route',bosses.includes("enemy.eventVariant==='stage01-warden'")&&runtime.includes('window.updateStage01BossSkill=function')],
 ['boss death starts a victory cinematic instead of the result modal',bosses.includes("enemy.kind==='stage-boss'")&&runtime.includes('beginStageVictory(enemy)')&&runtime.includes("state.mode='stageVictory'")],
 ['victory cinematic advances and renders before result',render.includes("state.mode==='stageVictory'")&&render.includes('updateStageVictoryCinematic')&&render.includes('drawStageVictoryCinematic')],
 ['result appears only after the victory duration',runtime.includes('if(v.elapsed>=v.duration)finalizeStageComplete()')&&runtime.includes("state.mode='stageComplete'")],
 ['clear records persistent progression, currencies, and comet unlock',catalog.includes("{type:'weapon',key:'comet'}")&&catalog.includes("{type:'currency',key:'stardust',amount:140}")&&catalog.includes("{type:'currency',key:'coreShard',amount:1,firstClearOnly:true}")&&runtime.includes('stackfallRecordStageClear')&&runtime.includes('result.currency?.stardust')&&meta.includes('unlockWeapon(reward.key)')],
 ['fresh players have exactly four named starter unlocks',meta.includes("INITIAL_WEAPONS=Object.freeze(['blade','ember','bulwark','gravity'])")],
 ['locked weapons are filtered from starter and level-up pools',iface.includes('stackfallIsWeaponUnlocked')&&feature.includes('stackfallIsWeaponUnlocked')&&progression.includes('stackfallIsWeaponUnlocked')],
 ['Stage 1 enemy silhouettes have dedicated renderer',entities.includes('function drawStageEnemyBody')&&['shardling','dart','bombardier','bulwark'].every(id=>entities.includes("v==='"+id+"'"))],
 ['Collapse Warden has a dedicated boss silhouette',elite.includes("f==='collapse-warden'")],
 ['Collapse Frontier has a dedicated ruined-space realm',runtime.includes("state.realmTheme='stage-01'")&&realm.includes("theme==='stage-01'")&&realm.includes('function drawStage01Background')&&realm.includes('gateR')],
 ['Stage clear UI and cinematic copy are localized',index.includes('id="stageCompleteScreen"')&&runtime.includes('stageClear.targetDown')&&(lang.match(/'stageClear\.targetDown'/g)||[]).length>=6],
 ['stage runtime loads after final render spawning override',index.indexOf('src/render.js')<index.indexOf('src/stage-runtime.js')]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 1 contracts; failures=${failed}`);if(failed)process.exit(1);
