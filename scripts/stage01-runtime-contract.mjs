import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/stage-catalog.js'),meta=read('src/meta-progression.js'),runtime=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),render=read('src/render.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),space=read('src/render-space.js'),index=read('index.html'),iface=read('src/interface.js'),feature=read('src/feature-pack.js'),progression=read('src/progression-expansion.js'),lang=read('src/language-pack.js');
const authoredStageIds=[...catalog.matchAll(/id:'(stage-\d{2})'/g)].map(match=>match[1]),adapterFiles=fs.readdirSync('src').filter(name=>/^stage\d{2}-runtime\.js$/.test(name)).sort(),adapters=adapterFiles.map(name=>({id:'stage-'+name.match(/^stage(\d{2})-runtime\.js$/)[1],source:read('src/'+name)})),adapterById=new Map(adapters.map(row=>[row.id,row.source])),forbiddenAdapterOwners=['updateSpawning=function','resetGame=function','window.updateMapEvents=function','window.handleStageBossDefeated=function'];
const checks=[
 ['Stage 1 boss enters at exactly ten minutes',catalog.includes('durationSeconds:600')&&catalog.includes("spawnAt:600")&&catalog.includes("at:600,kind:'boss'")],
 ['Stage 1 introduces four dedicated enemy variants',['shardling','dart','bombardier','bulwark'].every(id=>catalog.includes("id:'"+id+"'"))&&['shardling','dart','bombardier','bulwark'].every(id=>runtime.includes(id))],
 ['Stage 1 fixed timeline reaches the boss at 600 seconds',[90,210,300,420,500,600].every(n=>catalog.includes('at:'+n))],
 ['Stage 1 owns a persistent recurring map gimmick',catalog.includes("gimmick:{startAt:45,interval:38,waveEvery:4,accelerate:0.16}")&&runtime.includes('updateAmbientGimmick(run,def)')],
 ['shared stage runtime never clears because a timer expired',!runtime.includes('state.time>=run.stage.durationSeconds')],
 ['one shared runtime owns spawn reset map-event and boss-death routing',runtime.includes('updateSpawning=function stageAwareSpawning')&&runtime.includes('resetGame=function stageAwareReset')&&runtime.includes('window.updateMapEvents=function stageAwareMapEvents')&&runtime.includes('window.handleStageBossDefeated=function')&&adapters.every(row=>forbiddenAdapterOwners.every(token=>!row.source.includes(token)))],
 ['stage adapters match every authored Stage 2+ entry',adapters.length===Math.max(0,authoredStageIds.length-1)&&authoredStageIds.slice(1).every(id=>adapterById.has(id))],
 ['stage adapters register their own id and theme only',authoredStageIds.slice(1).every(id=>{const source=adapterById.get(id)||'',refs=[...new Set(source.match(/stage-\d{2}/g)||[])];return source.includes("stackfallRegisterStageRuntime('"+id+"'")&&source.includes("theme:'"+id+"'")&&refs.every(ref=>ref===id);})],
 ['stage adapters register instead of wrapping shared systems',runtime.includes("registerStageRuntime('stage-01'")&&authoredStageIds.slice(1).every(id=>(adapterById.get(id)||'').includes("stackfallRegisterStageRuntime('"+id+"'"))],
 ['stage runs bypass Endless spawning and Apex scheduling',runtime.includes('if(isStage()){updateStage(dt);return;}')&&runtime.includes('state.nextApexAt=Infinity')],
 ['boss countdown is hidden before the boss actually exists',runtime.includes("if(!boss){objective.classList.add('hidden');return;}")],
 ['all stage bosses route through one dispatcher',bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&runtime.includes('window.updateStageBossSkill=function')],
 ['boss death starts shared victory cinematic',bosses.includes("enemy.kind==='stage-boss'")&&runtime.includes('beginStageVictory(enemy)')&&runtime.includes("state.mode='stageVictory'")],
 ['victory cinematic advances and renders before result',render.includes("state.mode==='stageVictory'")&&render.includes('updateStageVictoryCinematic')&&render.includes('drawStageVictoryCinematic')],
 ['result appears only after victory duration',runtime.includes('if(v.elapsed>=v.duration)finalizeStageComplete()')&&runtime.includes("state.mode='stageComplete'")],
 ['clear records persistent progression and comet unlock',catalog.includes("{type:'weapon',key:'comet'}")&&runtime.includes('stackfallRecordStageClear')&&meta.includes('unlockWeapon(reward.key)')],
 ['locked weapons remain filtered from acquisition pools',iface.includes('stackfallIsWeaponUnlocked')&&feature.includes('stackfallIsWeaponUnlocked')&&progression.includes('stackfallIsWeaponUnlocked')],
 ['Stage 1 enemy silhouettes remain dedicated',entities.includes('function drawStageEnemyBody')&&['shardling','dart','bombardier','bulwark'].every(id=>entities.includes("v==='"+id+"'"))],
 ['Collapse Warden has a dedicated boss silhouette',elite.includes("f==='collapse-warden'")],
 ['stage realm themes survive realm normalization',runtime.includes("theme:'stage-01'")&&realm.includes("theme==='stage-01'")&&space.includes('/^stage-\\d{2}$/')],
 ['Stage clear UI and cinematic copy are localized',runtime.includes('stageClear.targetDown')&&(lang.match(/'stageClear\.targetDown'/g)||[]).length>=6],
 ['shared stage runtime loads after final render spawning override',index.indexOf('src/render.js')<index.indexOf('src/stage-runtime.js')]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 1/shared runtime contracts; failures=${failed}`);if(failed)process.exit(1);
