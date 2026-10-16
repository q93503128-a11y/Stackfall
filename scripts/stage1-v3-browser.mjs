import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.STACKFALL_PLAYWRIGHT||'playwright');
const out=resolve('test-results/stage1-v3');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.STACKFALL_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
const configs=[{name:'desktop',width:1440,height:900,gpu:true},{name:'mobile',width:390,height:844,gpu:false}];
const all=[];
try{
  for(const cfg of configs){
    const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    if(!cfg.gpu)await page.route(/pixi/i,r=>r.abort());
    await page.goto('http://127.0.0.1:8000/?dev=1&stage1-v5=1',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>typeof stackfallStageOneReworkDiagnostics==='function'&&stackfallStageOneReworkDiagnostics().installed===true&&typeof stackfallStageOneMotionV3==='function'&&stackfallStageOneMotionV3().installed===true&&typeof stackfallStageOneMotionV4==='function'&&stackfallStageOneMotionV4().installed===true&&typeof stackfallStageOneMotionV5==='function'&&stackfallStageOneMotionV5().installed===true,{timeout:12000});
    // v3/v4 retry their late bindings for several seconds. Let those windows expire,
    // then require v5 to be the stable outermost visual renderer before capturing evidence.
    await page.waitForTimeout(4200);
    await page.waitForFunction(()=>window.drawCollapseWardenBody?.name==='drawBossV5'&&window.drawStageOneWardenArena?.name==='drawArenaV5'&&stackfallStageOneMotionV5().installed===true,{timeout:6000});
    await page.evaluate(()=>{GAME_SETTINGS.audio.master=false;GAME_SETTINGS.autoLevelChoice=true;stackfallDeveloperTest.setInvincible(true);stackfallDeveloperTest.setLevelUpsDisabled(true);});
    const shot=async name=>{await page.evaluate(()=>{ui.bossNotice?.classList.add('hidden');updateHUD();draw();});await page.screenshot({path:resolve(out,`${cfg.name}-${name}.png`)});};
    await page.evaluate(()=>{stackfallDeveloperTest.jumpStageBoss('stage-01');ui.bossNotice?.classList.add('hidden');});await shot('boss-minus5');
    await page.evaluate(()=>{state.time=300;updateSpawning(1/60);if(state.realmTransition)updateRealmTransition(10);ui.bossNotice?.classList.add('hidden');state.mode='paused';});
    await shot('boss-idle');
    const idlePerf=await page.evaluate(()=>{const a=[];for(let i=0;i<90;i++){const t=performance.now();draw();a.push(performance.now()-t);}a.sort((x,y)=>x-y);return{p50:a[45],p95:a[85],max:a.at(-1),v3:stackfallStageOneMotionV3(),v4:stackfallStageOneMotionV4(),v5:stackfallStageOneMotionV5()};});
    const start=await page.evaluate(()=>{
      clearStagePhysicalObjects();clearPendingCombatActions();
      const e=state.entities.enemies.find(x=>x.kind==='stage-boss'&&x.eventKind==='stage-01');if(!e)throw new Error('stage1 boss missing');
      const a=state.stageBossArena;e.hp=e.maxHp*.90;e.stagePhase=1;a.phase=1;e.stageGateCoreOpen=false;e.stageGateOpenedAt=state.time-2;
      e.attackLockUntil=0;e.stageRamWindupUntil=0;e.stageRamUntil=0;e.stageRamRecoilAt=-999;e.stageAction='';e.stageMotionX=0;e.stageMotionY=0;e.stageBodyAngle=0;
      e.stageOneV2={anchor:1,attackIndex:3,nextAttackAt:state.time,token:0,safeLane:null,safeLaneUntil:0};
      e.x=a.x;e.y=a.y-a.halfH*.35;player.x=a.x;player.y=a.y;state.mode='paused';updateStageBossSkill(e,1/60);e.stageOneV2.nextAttackAt=state.time+999;
      return{combat:stackfallStageOneReworkDiagnostics(),motion:stackfallStageOneMotionV3(),v4:stackfallStageOneMotionV4(),v5:stackfallStageOneMotionV5(),time:state.time};
    });
    if(start.combat.activePattern!=='ram')throw new Error(`ram fixture: expected ram, got ${start.combat.activePattern}`);
    const samples=[],times=[.08,.32,.72,1.06,1.28,1.55,1.94,2.18,2.48],labels=['lock','compress','pullback','ignite','commit-a','commit-b','impact','recoil','recover'];let elapsed=0;
    for(let i=0;i<times.length;i++){
      const at=times[i],sample=await page.evaluate(dt=>{
        const e=state.entities.enemies.find(x=>x.kind==='stage-boss'&&x.eventKind==='stage-01');let maxStep=0;
        for(let i=0;i<Math.max(1,Math.round(dt*60));i++){
          const x=e.x,y=e.y;state.time+=1/60;updateEnemies(1/60);updateEffects(1/60);maxStep=Math.max(maxStep,Math.hypot(e.x-x,e.y-y));
        }
        draw();return{maxStep,x:e.x,y:e.y,time:state.time,objects:stagePhysicalObjects().length,motion:stackfallStageOneMotionV3(),v4:stackfallStageOneMotionV4(),v5:stackfallStageOneMotionV5(),combat:stackfallStageOneReworkDiagnostics()};
      },at-elapsed);elapsed=at;samples.push({at,label:labels[i],...sample});await shot(`ram-${String(i+1).padStart(2,'0')}-${labels[i]}`);
    }
    // A separate phase-2 still verifies that damage is structural/asymmetric rather than a palette swap.
    await page.evaluate(()=>{
      const e=state.entities.enemies.find(x=>x.kind==='stage-boss'&&x.eventKind==='stage-01');
      e.stagePhase=2;state.stageBossArena.phase=2;e.stageAction='';e.stageRamWindupUntil=0;e.stageRamUntil=0;e.stageRamRecoilAt=-999;e.stageOneV2.ram=null;state.time+=1;draw();
    });
    await shot('boss-phase2-damaged');
    const expected=['ram-lock','ram-compress','ram-pullback','ram-ignite','ram-commit','ram-commit','ram-recoil','ram-recoil','ram-recover'];
    const phases=samples.map(s=>s.motion.phase),phaseOk=expected.every((x,i)=>phases[i]===x);
    const runtime=await page.evaluate(()=>({motion:stackfallStageOneMotionV3(),v4:stackfallStageOneMotionV4(),v5:stackfallStageOneMotionV5(),runtime:stackfallRuntimeDiagnostics(),renderer:stackfallRendererInfo(),outer:{boss:window.drawCollapseWardenBody?.name,arena:window.drawStageOneWardenArena?.name}}));
    const ok=errors.length===0&&runtime.runtime.errorCount===0&&phaseOk&&runtime.v4.installed===true&&runtime.v5.installed===true&&runtime.outer.boss==='drawBossV5'&&runtime.outer.arena==='drawArenaV5'&&samples.every(s=>s.objects<=6)&&runtime.motion.maxDrawMs<20&&runtime.v4.maxDrawMs<20&&runtime.v5.maxDrawMs<20;
    all.push({cfg,ok,errors,idlePerf,start,samples,expected,phaseOk,runtime});await context.close();
  }
}finally{await browser.close();}
writeFileSync(resolve(out,'results.json'),JSON.stringify({ok:all.every(x=>x.ok),results:all},null,2));
for(const r of all)console.log(r.ok?'PASS':'FAIL',r.cfg.name,JSON.stringify({errors:r.errors,idlePerf:r.idlePerf,phaseOk:r.phaseOk,phases:r.samples.map(s=>s.motion.phase),times:r.samples.map(s=>+s.time.toFixed(3)),v3MaxDrawMs:r.runtime.motion.maxDrawMs,v4MaxDrawMs:r.runtime.v4.maxDrawMs,v5MaxDrawMs:r.runtime.v5.maxDrawMs,outer:r.runtime.outer}));
if(!all.every(x=>x.ok))process.exitCode=1;
