import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/stage-catalog.js'),meta=read('src/meta-progression.js'),runtime=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),index=read('index.html'),iface=read('src/interface.js'),feature=read('src/feature-pack.js'),progression=read('src/progression-expansion.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 1 lasts 600 seconds and boss enters at 540',catalog.includes('durationSeconds:600')&&catalog.includes("spawnAt:540")&&catalog.includes("at:540,kind:'boss'")],
 ['Stage 1 introduces four dedicated enemy variants',['shardling','dart','bombardier','bulwark'].every(id=>catalog.includes("id:'"+id+"'"))&&['shardling','dart','bombardier','bulwark'].every(id=>runtime.includes(id))],
 ['Stage 1 fixed timeline contains two waves, two collapse pulses, guard line and boss',["at:90","at:210","at:300","at:420","at:500","at:540"].every(token=>catalog.includes(token))],
 ['Stage runtime bypasses Endless spawning and Apex scheduling',runtime.includes('updateSpawning=function stageAwareSpawning')&&runtime.includes('if(isStage()){updateStage(dt);return;}')&&runtime.includes('state.nextApexAt=Infinity')],
 ['random world-event updates are suppressed during stage runs',runtime.includes('window.updateMapEvents=function stageAwareMapEvents(dt){if(isStage())return;')],
 ['Stage 1 boss uses its own skill route',bosses.includes("enemy.eventVariant==='stage01-warden'")&&runtime.includes('window.updateStage01BossSkill=function')],
 ['Stage 1 boss death routes to stage completion',bosses.includes("enemy.kind==='stage-boss'")&&runtime.includes('window.handleStageBossDefeated=function')&&runtime.includes('completeStage(enemy)')],
 ['clear records persistent progression and unlocks comet',catalog.includes("rewards:[{type:'weapon',key:'comet'}]")&&runtime.includes('stackfallRecordStageClear')&&meta.includes('unlockWeapon(reward.key)')],
 ['fresh players have exactly four named starter unlocks',meta.includes("INITIAL_WEAPONS=Object.freeze(['blade','ember','bulwark','gravity'])")],
 ['locked weapons are filtered from starter and level-up pools',iface.includes('stackfallIsWeaponUnlocked')&&feature.includes('stackfallIsWeaponUnlocked')&&progression.includes('stackfallIsWeaponUnlocked')],
 ['Stage 1 enemy silhouettes have dedicated renderer',entities.includes('function drawStageEnemyBody')&&['shardling','dart','bombardier','bulwark'].every(id=>entities.includes("v==='"+id+"'"))],
 ['Collapse Warden has a dedicated boss silhouette',elite.includes("f==='collapse-warden'")],
 ['Collapse Frontier has a dedicated realm theme',runtime.includes("state.realmTheme='stage-01'")&&realm.includes("theme==='stage-01'")&&realm.includes('function drawStage01Background')],
 ['Stage clear UI is wired and localized',index.includes('id="stageCompleteScreen"')&&index.includes('id="stageCompleteReward"')&&runtime.includes('stageCompleteScreen')&&(lang.match(/'stageClear\.title'/g)||[]).length>=6],
 ['stage runtime loads after final render spawning override',index.indexOf('src/render.js')<index.indexOf('src/stage-runtime.js')]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 1 contracts; failures=${failed}`);if(failed)process.exit(1);
