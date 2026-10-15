// Deterministic Stage 1 visual/performance scenes supplement real UI play.
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
  await page.waitForFunction(()=>typeof stackfallStageOneReworkDiagnostics==='function'&&stackfallStageOneReworkDiagnostics().installed===true);
  await page.evaluate(()=>{GAME_SETTINGS.audio.master=false;GAME_SETTINGS.autoLevelChoice=true;window.__stackfallLoopGeneration++;stackfallDeveloperTest.setInvincible(true);stackfallDeveloperTest.setLevelUpsDisabled(true);});
  const shot=async name=>{await page.evaluate(()=>{if(!ui.choice.classList.contains('hidden'))throw new Error('Visual fixture obscured by choice UI');updateHUD();draw();});await page.screenshot({path:resolve(output,config.name+'-'+name+'.png')});};

  // Environment progression: verify the rebooted world still supports seekable Stage 1 incidents.
  for(const time of [0,20,45,135,220]){
    const scene=await page.evaluate(time=>{stackfallDeveloperTest.startStage('stage-01');if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);state.mode='playing';state.time=time;updateSpawning(0);ui.bossNotice.classList.add('hidden');const objects=stagePhysicalObjects();return{time,count:objects.length,incident:state.stageRun.frontier.incident,origins:objects.map(o=>({x:o.fromX,y:o.fromY})),rework:stackfallStageOneReworkDiagnostics()};},time);
    if(time===45){checks.push({name:'first ambient incident occupies a world route at 45s',ok:scene.count>0&&!!scene.incident});
      const movement=await page.evaluate(()=>{const o=stagePhysicalObjects()[0],before={x:o.fromX,y:o.fromY};player.x+=120;player.y-=90;updateSpawning(0);return Math.hypot(o.fromX-before.x,o.fromY-before.y);});checks.push({name:'route incident origin stays fixed while pilot moves',ok:movement===0});await shot('45-world-movement');
      await page.evaluate(()=>{player.x-=120;player.y+=90;for(let i=0;i<115;i++){state.time+=1/60;updateStagePhysicalObjects(1/60);}ui.bossNotice.classList.add('hidden');});
    }
    await shot(String(time).padStart(3,'0'));
  }

  // Route-proximity regression: the old giant deck SVG field spiked when the pilot approached it.
  // Sample the new navigation-corridor world near the primary lane and between corridors.
  const corridorPerf=await page.evaluate(()=>{
    stackfallDeveloperTest.startStage('stage-01');if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);state.mode='playing';state.time=135;
    state.entities.enemies.length=0;state.entities.projectiles.length=0;state.entities.effects.length=0;
    const sampleAt=(x,y)=>{player.x=x;player.y=y;const times=[];for(let i=0;i<80;i++){const t=performance.now();draw();times.push(performance.now()-t);}times.sort((a,b)=>a-b);return{p50:times[40],p95:times[75],diag:stackfallStageOneReworkDiagnostics()};};
    return{near:sampleAt(0,0),between:sampleAt(0,230)};
  });
  checks.push({name:'Stage 1 v2 corridor hook is installed',ok:corridorPerf.near.diag.installed&&corridorPerf.near.diag.version==='lockline-v2'});
  checks.push({name:'corridor sprite budget stays sparse',ok:corridorPerf.near.diag.spriteBudget<=10&&corridorPerf.between.diag.spriteBudget<=10});
  // Browser/CI load varies, so guard catastrophic route-local regressions rather than a fragile absolute 60fps threshold.
  checks.push({name:'route proximity does not cause a catastrophic local spike',ok:corridorPerf.near.p95<Math.max(55,corridorPerf.between.p95*2.6+8)});
  await shot('corridor-near');

  await page.evaluate(()=>{stackfallDeveloperTest.jumpStageBoss('stage-01');ui.bossNotice.classList.add('hidden');});await shot('295');
  await page.evaluate(()=>{state.time=300;updateSpawning(1/60);updateRealmTransition(1.6);});await shot('entrance');
  await page.evaluate(()=>{updateRealmTransition(10);ui.bossNotice.classList.add('hidden');});await shot('phase1');

  // V2 patterns are selected through the new attack-index grammar, not legacy stageOneAttackCycle.
  const fixtures=[
    {name:'lane-closure',attackIndex:0,phase:1,expected:'lane'},
    {name:'cargo-tow',attackIndex:1,phase:1,expected:'tow'},
    {name:'moving-compression',attackIndex:2,phase:1,expected:'compress'},
    {name:'committed-ram',attackIndex:3,phase:1,expected:'ram'},
    {name:'switchyard-reroute',attackIndex:0,phase:2,expected:'reroute'}
  ];
  for(const fixture of fixtures){
    const start=await page.evaluate(f=>{
      clearStagePhysicalObjects();clearPendingCombatActions();const e=state.entities.enemies.find(e=>e.kind==='stage-boss');
      e.hp=e.maxHp*(f.phase===1?.9:.47);e.stagePhase=f.phase;e.stageGateCoreOpen=f.phase===2;e.stageGateOpenedAt=state.time-2;
      e.attackLockUntil=0;e.stageRamWindupUntil=0;e.stageRamUntil=0;e.stageAction='';e.stageMotionX=e.stageMotionY=0;e.stageBodyAngle=0;
      e.stageOneV2={anchor:1,attackIndex:f.attackIndex,nextAttackAt:state.time,token:0,safeLane:null,safeLaneUntil:0};
      const arena=state.stageBossArena;arena.phase=f.phase;e.x=arena.x;e.y=arena.y-arena.halfH*.35;player.x=arena.x;player.y=arena.y;state.mode='playing';
      updateStageBossSkill(e,1/60);ui.bossNotice.classList.add('hidden');
      return stackfallStageOneReworkDiagnostics();
    },fixture);
    checks.push({name:fixture.name+' selects intended v2 pattern',ok:start.activePattern===fixture.expected});
    let elapsed=0;const samples=[];
    for(const time of [.35,.85,1.3,1.75,2.35,3.0]){
      const sample=await page.evaluate(seconds=>{const e=state.entities.enemies.find(e=>e.kind==='stage-boss');let maxStep=0;for(let i=0;i<Math.round(seconds*60);i++){const x=e.x,y=e.y;state.time+=1/60;updatePendingActions(1/60);updateSpawning(1/60);updateEnemies(1/60);updateEffects(1/60);maxStep=Math.max(maxStep,Math.hypot(e.x-x,e.y-y));}ui.bossNotice.classList.add('hidden');const shapes=stackfallStageBodyShapes(e);return{action:e.stageAction,maxStep,objects:stagePhysicalObjects().length,pose:shapes.map(s=>({part:s.part,x:s.x,y:s.y,a:s.a})),bounds:shapes.flatMap(s=>s.points).map(p=>({x:p.x-player.x+vw/2,y:p.y-player.y+vh/2})),rework:stackfallStageOneReworkDiagnostics()};},time-elapsed);elapsed=time;samples.push(sample);await shot(fixture.name+'-'+time.toFixed(2));
    }
    checks.push({name:fixture.name+' uses bounded hardware',ok:samples.every(s=>s.objects<=6)});
    checks.push({name:fixture.name+' has articulated body motion',ok:JSON.stringify(samples[0].pose)!==JSON.stringify(samples.at(-1).pose)});
    if(fixture.expected==='ram')checks.push({name:'committed ram visibly accelerates without teleporting',ok:samples.some(s=>s.maxStep>2)&&samples.every(s=>s.maxStep<32)});
    if(fixture.expected==='reroute')checks.push({name:'phase 2 reroute keeps mobile body in readable viewport',ok:config.width>=760||samples.every(s=>s.bounds.every(p=>p.x>=-8&&p.x<=config.width+8&&p.y>=165&&p.y<=config.height-90))});
  }

  await page.evaluate(()=>{const e=state.entities.enemies.find(e=>e.kind==='stage-boss');e.stagePhase=1;e.hp=e.maxHp*.47;e.attackLockUntil=0;updateStageBossSkill(e,1/60);});await shot('phase-transition');
  const proof=await page.evaluate(()=>{const e=state.entities.enemies.find(e=>e.kind==='stage-boss');clearStagePhysicalObjects();addStagePhysicalObject({kind:'bulkhead',ownerId:e.id,fromX:player.x-160,fromY:player.y,toX:player.x,toY:player.y,x:player.x-160,y:player.y,hw:50,hh:27,angle:0,a:0,warn:.8,travel:.48,hold:1,damage:10});const hurt=hurtPlayer;let hits=0;hurtPlayer=()=>hits++;player.invuln=0;const at={x:player.x,y:player.y};try{for(let i=0;i<100;i++){player.stagePreviousX=player.x;player.stagePreviousY=player.y;updateStagePhysicalObjects(1/60);}}finally{hurtPlayer=hurt;}const displaced=Math.hypot(player.x-at.x,player.y-at.y);clearStagePhysicalObjects();return{hits,displaced};});
  checks.push({name:'solid structure causes real damage and route displacement',ok:proof.hits>0&&proof.displaced>0});
  const victory=await page.evaluate(()=>{const e=state.entities.enemies.find(e=>e.kind==='stage-boss');dealDamage(e,e.hp*10,{source:'core',canCrit:false});return state.mode;});checks.push({name:'actual boss damage owns victory',ok:victory==='stageVictory'});
  await page.evaluate(()=>updateStageVictoryCinematic(.8));await shot('victory-early');await page.evaluate(()=>updateStageVictoryCinematic(1.5));await shot('victory-open');
  const stats=await page.evaluate(()=>{const times=[];for(let i=0;i<90;i++){const t=performance.now();draw();times.push(performance.now()-t);}times.sort((a,b)=>a-b);return{renderer:stackfallRendererInfo(),art:stackfallStageOneArtInfo(),rework:stackfallStageOneReworkDiagnostics(),drawP50:times[45],drawP95:times[85],runtime:stackfallRuntimeDiagnostics()};});
  checks.push({name:'eight bounded textures loaded and runtime clean',ok:stats.art.loaded.length===8&&stats.runtime.errorCount===0});
  checks.push({name:'renderer path matches requested backend',ok:config.gpu?stats.renderer.status==='active':stats.renderer.fallback});
  results.push({config,ok:checks.every(c=>c.ok)&&errors.length===0,checks,errors,stats,corridorPerf,proof});await context.close();
}}
finally{await browser.close();}
writeFileSync(resolve(output,'results.json'),JSON.stringify({ok:results.every(r=>r.ok),results},null,2));
for(const r of results)console.log(r.ok?'PASS':'FAIL',r.config.name,JSON.stringify({failures:r.checks.filter(c=>!c.ok),errors:r.errors,p50:r.stats.drawP50,p95:r.stats.drawP95,corridor:r.corridorPerf,rework:r.stats.rework}));
if(results.some(r=>!r.ok))process.exitCode=1;
