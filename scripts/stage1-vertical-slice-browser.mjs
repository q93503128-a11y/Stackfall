// Deterministic visual scenes supplement real UI play and the shared browser suite.
// DEV invulnerability/HP seeking are test fixtures, never gameplay defaults.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.STACKFALL_PLAYWRIGHT||'playwright');
const output=resolve('test-results/stage1-vertical-slice');mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.STACKFALL_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio','--autoplay-policy=no-user-gesture-required']});
const results=[];
try{for(const config of [{name:'desktop-gpu',width:1440,height:900,gpu:true},{name:'small-gpu',width:1280,height:720,gpu:true},{name:'desktop-canvas',width:1440,height:900,gpu:false},{name:'mobile-canvas',width:390,height:844,gpu:false}]){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height}}),page=await context.newPage(),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>{if(r.url().startsWith('http://127.0.0.1:8000/'))errors.push(r.url());});
  if(!config.gpu)await page.route(/pixi/i,r=>r.abort());
  await page.goto('http://127.0.0.1:8000/?dev=1&build-check=slice',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>stackfallStageOneArtInfo().loaded.length===8);
  await page.evaluate(()=>{GAME_SETTINGS.audio.master=false;GAME_SETTINGS.autoLevelChoice=true;window.__stackfallLoopGeneration++;stackfallDeveloperTest.setInvincible(true);stackfallDeveloperTest.setLevelUpsDisabled(true);});
  const shot=async name=>{await page.evaluate(()=>{if(!ui.choice.classList.contains('hidden'))throw new Error('Visual fixture obscured by choice UI');updateHUD();draw();});await page.screenshot({path:resolve(output,config.name+'-'+name+'.png')});};
  for(const time of [0,20,45,135,220]){
    const scene=await page.evaluate(time=>{stackfallDeveloperTest.startStage('stage-01');if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);state.mode='playing';state.time=time;updateSpawning(0);ui.bossNotice.classList.add('hidden');const objects=stagePhysicalObjects();return{time,count:objects.length,incident:state.stageRun.frontier.incident,origins:objects.map(o=>({x:o.fromX,y:o.fromY}))};},time);
    if(time===45){checks.push({name:'first ambient incident occupies a world route at 45s',ok:scene.count>0&&!!scene.incident});
      const movement=await page.evaluate(()=>{const o=stagePhysicalObjects()[0],before={x:o.fromX,y:o.fromY};player.x+=120;player.y-=90;updateSpawning(0);return Math.hypot(o.fromX-before.x,o.fromY-before.y);});checks.push({name:'route incident origin stays fixed while pilot moves',ok:movement===0});await shot('45-world-movement');
      await page.evaluate(()=>{player.x-=120;player.y+=90;for(let i=0;i<115;i++){state.time+=1/60;updateStagePhysicalObjects(1/60);}ui.bossNotice.classList.add('hidden');});
    }
    await shot(String(time).padStart(3,'0'));
  }
  await page.evaluate(()=>{stackfallDeveloperTest.jumpStageBoss('stage-01');ui.bossNotice.classList.add('hidden');});await shot('295');
  await page.evaluate(()=>{state.time=300;updateSpawning(1/60);updateRealmTransition(1.6);});await shot('entrance');
  await page.evaluate(()=>{updateRealmTransition(10);ui.bossNotice.classList.add('hidden');});await shot('phase1');
  for(const fixture of [{name:'salvage',cycle:0,phase:1},{name:'bulkhead',cycle:1,phase:1},{name:'ram',cycle:2,phase:1},{name:'girder',cycle:3,phase:2},{name:'moving-passage',cycle:1,phase:2}]){
    await page.evaluate(f=>{clearStagePhysicalObjects();clearPendingCombatActions();const e=state.entities.enemies.find(e=>e.kind==='stage-boss');e.hp=e.maxHp*(f.phase===1?.9:.47);e.stagePhase=f.phase;e.stageGateCoreOpen=f.phase===2;e.stageGateOpenedAt=state.time-2;e.stageOneAttackCycle=f.cycle;e.stageOneAttackCd=0;e.attackLockUntil=0;e.stageRamWindupUntil=0;e.stageRamUntil=0;e.stageAction='';e.stageMotionX=e.stageMotionY=0;e.stageBodyAngle=0;const arena=state.stageBossArena;e.x=arena.x;e.y=arena.y-arena.halfH*.35;player.x=arena.x;player.y=arena.y;state.mode='playing';updateStageBossSkill(e,1/60);ui.bossNotice.classList.add('hidden');},fixture);
    let elapsed=0;const samples=[];
    for(const time of [.55,1.3,1.7,2.25,3.0]){
      const sample=await page.evaluate(seconds=>{const e=state.entities.enemies.find(e=>e.kind==='stage-boss');let maxStep=0;for(let i=0;i<Math.round(seconds*60);i++){const x=e.x,y=e.y;state.time+=1/60;updatePendingActions(1/60);updateSpawning(1/60);updateEnemies(1/60);updateEffects(1/60);maxStep=Math.max(maxStep,Math.hypot(e.x-x,e.y-y));}ui.bossNotice.classList.add('hidden');const shapes=stackfallStageBodyShapes(e);return{action:e.stageAction,maxStep,objects:stagePhysicalObjects().length,pose:shapes.map(s=>({part:s.part,x:s.x,y:s.y,a:s.a})),bounds:shapes.flatMap(s=>s.points).map(p=>({x:p.x-player.x+vw/2,y:p.y-player.y+vh/2}))};},time-elapsed);elapsed=time;samples.push(sample);await shot(fixture.name+'-'+time.toFixed(2));
    }
    checks.push({name:fixture.name+' uses continuous motion and bounded hardware',ok:samples.every(s=>s.maxStep<40&&s.objects<=6)});
    checks.push({name:fixture.name+' has changing articulated anatomy',ok:JSON.stringify(samples[0].pose)!==JSON.stringify(samples[4].pose)});
    if(fixture.name==='moving-passage')checks.push({name:'mobile body stays inside viewport',ok:config.width>=760||samples.every(s=>s.bounds.every(p=>p.x>=4&&p.x<=config.width-4&&p.y>=180&&p.y<=config.height-105))});
  }
  await page.evaluate(()=>{const e=state.entities.enemies.find(e=>e.kind==='stage-boss');e.stagePhase=1;e.hp=e.maxHp*.47;updateStageBossSkill(e,1/60);});await shot('phase-transition');
  const proof=await page.evaluate(()=>{const e=state.entities.enemies.find(e=>e.kind==='stage-boss'),objects=stagePhysicalObjects();clearStagePhysicalObjects();const o=addStagePhysicalObject({kind:'bulkhead',ownerId:e.id,fromX:player.x-160,fromY:player.y,toX:player.x,toY:player.y,x:player.x-160,y:player.y,hw:50,hh:27,angle:0,a:0,warn:.8,travel:.48,hold:1,damage:10}),hurt=hurtPlayer;let hits=0;hurtPlayer=()=>hits++;player.invuln=0;const at={x:player.x,y:player.y};try{for(let i=0;i<100;i++){player.stagePreviousX=player.x;player.stagePreviousY=player.y;updateStagePhysicalObjects(1/60);}}finally{hurtPlayer=hurt;}const displaced=Math.hypot(player.x-at.x,player.y-at.y);clearStagePhysicalObjects();return{hits,displaced};});
  checks.push({name:'solid structure causes real damage and route displacement',ok:proof.hits>0&&proof.displaced>0});
  const victory=await page.evaluate(()=>{const e=state.entities.enemies.find(e=>e.kind==='stage-boss');dealDamage(e,e.hp*10,{source:'core',canCrit:false});return state.mode;});checks.push({name:'actual boss damage owns victory',ok:victory==='stageVictory'});
  await page.evaluate(()=>updateStageVictoryCinematic(.8));await shot('victory-early');await page.evaluate(()=>updateStageVictoryCinematic(1.5));await shot('victory-open');
  const stats=await page.evaluate(()=>{const times=[];for(let i=0;i<90;i++){const t=performance.now();draw();times.push(performance.now()-t);}times.sort((a,b)=>a-b);return{renderer:stackfallRendererInfo(),art:stackfallStageOneArtInfo(),drawP50:times[45],drawP95:times[85],runtime:stackfallRuntimeDiagnostics()};});
  checks.push({name:'eight bounded textures loaded and runtime clean',ok:stats.art.loaded.length===8&&stats.runtime.errorCount===0});
  checks.push({name:'renderer path matches requested backend',ok:config.gpu?stats.renderer.status==='active':stats.renderer.fallback});
  results.push({config,ok:checks.every(c=>c.ok)&&errors.length===0,checks,errors,stats,proof});await context.close();
}}
finally{await browser.close();}
writeFileSync(resolve(output,'results.json'),JSON.stringify({ok:results.every(r=>r.ok),results},null,2));
for(const r of results)console.log(r.ok?'PASS':'FAIL',r.config.name,JSON.stringify({failures:r.checks.filter(c=>!c.ok),errors:r.errors,p50:r.stats.drawP50,p95:r.stats.drawP95}));
if(results.some(r=>!r.ok))process.exitCode=1;
