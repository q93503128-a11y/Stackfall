import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.STACKFALL_PLAYWRIGHT||'playwright');
const out=resolve('test-results/stage1-v2');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.STACKFALL_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
const configs=[{name:'desktop',width:1440,height:900,gpu:true},{name:'mobile',width:390,height:844,gpu:false}];
const all=[];
try{
  for(const cfg of configs){
    const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    if(!cfg.gpu)await page.route(/pixi/i,r=>r.abort());
    await page.goto('http://127.0.0.1:8000/?dev=1&stage1-v2=1',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>typeof stackfallStageOneReworkDiagnostics==='function'&&stackfallStageOneReworkDiagnostics().installed===true,{timeout:10000});
    await page.evaluate(()=>{GAME_SETTINGS.audio.master=false;GAME_SETTINGS.autoLevelChoice=true;stackfallDeveloperTest.setInvincible(true);stackfallDeveloperTest.setLevelUpsDisabled(true);});
    const shot=async name=>{await page.evaluate(()=>{ui.bossNotice?.classList.add('hidden');updateHUD();draw();});await page.screenshot({path:resolve(out,`${cfg.name}-${name}.png`)});};
    const startAt=async time=>page.evaluate(t=>{stackfallDeveloperTest.startStage('stage-01');if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);state.mode='playing';state.time=t;updateSpawning(0);ui.bossNotice?.classList.add('hidden');return stackfallStageOneReworkDiagnostics();},time);
    await startAt(0);await shot('world-000');
    await startAt(135);await shot('world-135');
    await startAt(220);await shot('world-220');
    const perf=await page.evaluate(()=>{
      stackfallDeveloperTest.startStage('stage-01');if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);state.mode='playing';state.time=135;
      const sample=(x,y)=>{player.x=x;player.y=y;const a=[];for(let i=0;i<100;i++){const t=performance.now();draw();a.push(performance.now()-t);}a.sort((x,y)=>x-y);return{p50:a[50],p95:a[95],max:a.at(-1),diag:stackfallStageOneReworkDiagnostics()};};
      return{near:sample(0,0),between:sample(0,230)};
    });
    await page.evaluate(()=>{stackfallDeveloperTest.jumpStageBoss('stage-01');ui.bossNotice?.classList.add('hidden');});await shot('boss-minus5');
    await page.evaluate(()=>{state.time=300;updateSpawning(1/60);if(state.realmTransition)updateRealmTransition(1.8);});await shot('boss-entry');
    await page.evaluate(()=>{if(state.realmTransition)updateRealmTransition(10);ui.bossNotice?.classList.add('hidden');});await shot('boss-idle');
    const fixture=async(spec)=>{
      const begin=await page.evaluate(s=>{
        clearStagePhysicalObjects();clearPendingCombatActions();
        const e=state.entities.enemies.find(x=>x.kind==='stage-boss'&&x.eventKind==='stage-01');if(!e)throw new Error('stage1 boss missing');
        const a=state.stageBossArena;e.hp=e.maxHp*(s.phase===1?.90:.47);e.stagePhase=s.phase;a.phase=s.phase;e.stageGateCoreOpen=s.phase===2;e.stageGateOpenedAt=state.time-2;
        e.attackLockUntil=0;e.stageRamWindupUntil=0;e.stageRamUntil=0;e.stageAction='';e.stageMotionX=0;e.stageMotionY=0;e.stageBodyAngle=0;
        e.stageOneV2={anchor:1,attackIndex:s.attackIndex,nextAttackAt:state.time,token:0,safeLane:null,safeLaneUntil:0};
        e.x=a.x;e.y=a.y-a.halfH*.35;player.x=a.x;player.y=a.y;state.mode='playing';updateStageBossSkill(e,1/60);return stackfallStageOneReworkDiagnostics();
      },spec);
      if(begin.activePattern!==spec.expected)throw new Error(`${spec.name}: expected ${spec.expected}, got ${begin.activePattern}`);
      const frames=[];let elapsed=0;
      for(const at of spec.times){
        const sample=await page.evaluate(dt=>{
          const e=state.entities.enemies.find(x=>x.kind==='stage-boss'&&x.eventKind==='stage-01');let maxStep=0;
          for(let i=0;i<Math.max(1,Math.round(dt*60));i++){const x=e.x,y=e.y;state.time+=1/60;updatePendingActions(1/60);updateSpawning(1/60);updateEnemies(1/60);updateEffects(1/60);maxStep=Math.max(maxStep,Math.hypot(e.x-x,e.y-y));}
          return{maxStep,objects:stagePhysicalObjects().length,action:e.stageAction,diag:stackfallStageOneReworkDiagnostics(),x:e.x,y:e.y};
        },at-elapsed);elapsed=at;frames.push(sample);await shot(`${spec.name}-${at.toFixed(2)}`);
      }
      return{begin,frames};
    };
    const patterns={};
    patterns.lane=await fixture({name:'lane',phase:1,attackIndex:0,expected:'lane',times:[.35,.9,1.35,2.0]});
    patterns.tow=await fixture({name:'tow',phase:1,attackIndex:1,expected:'tow',times:[.35,.9,1.45,2.1]});
    patterns.compress=await fixture({name:'compress',phase:1,attackIndex:2,expected:'compress',times:[.35,.95,1.5,2.2]});
    patterns.ram=await fixture({name:'ram',phase:1,attackIndex:3,expected:'ram',times:[.35,.95,1.25,1.55,2.0]});
    patterns.reroute=await fixture({name:'reroute',phase:2,attackIndex:0,expected:'reroute',times:[.35,.9,1.45,2.1]});
    const runtime=await page.evaluate(()=>({diag:stackfallStageOneReworkDiagnostics(),runtime:stackfallRuntimeDiagnostics(),renderer:stackfallRendererInfo()}));
    const ok=errors.length===0&&runtime.runtime.errorCount===0&&perf.near.diag.spriteBudget<=10&&perf.near.p95<Math.max(55,perf.between.p95*2.6+8)&&Object.values(patterns).every(p=>p.frames.every(f=>f.objects<=6));
    all.push({cfg,ok,errors,perf,patterns,runtime});await context.close();
  }
}finally{await browser.close();}
writeFileSync(resolve(out,'results.json'),JSON.stringify({ok:all.every(x=>x.ok),results:all},null,2));
for(const r of all)console.log(r.ok?'PASS':'FAIL',r.cfg.name,JSON.stringify({errors:r.errors,near:r.perf.near,between:r.perf.between,patterns:Object.fromEntries(Object.entries(r.patterns).map(([k,v])=>[k,v.frames.map(f=>({maxStep:f.maxStep,objects:f.objects,action:f.action}))]))}));
if(!all.every(x=>x.ok))process.exitCode=1;
