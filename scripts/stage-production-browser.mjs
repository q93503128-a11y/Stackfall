import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.STACKFALL_PLAYWRIGHT||'playwright');
const order=Number(process.argv.find(s=>s.startsWith('--stage='))?.split('=')[1]||1),id='stage-'+String(order).padStart(2,'0');
const output=resolve('test-results','production-'+id);mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.STACKFALL_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required','--mute-audio']});
const results=[];
try{
  for(const config of[{name:'desktop-gpu',width:1440,height:900,gpu:true},{name:'desktop-fallback',width:1440,height:900,gpu:false},{name:'mobile-fallback',width:390,height:844,gpu:false}]){
    const context=await browser.newContext({viewport:{width:config.width,height:config.height}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    if(!config.gpu)await page.route(/pixi/i,r=>r.abort());
    await page.goto('http://127.0.0.1:8000/?dev=1&build-check=production',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.stackfallDeveloperTest?.enabled===true);
    const initial=await page.evaluate(id=>{
      GAME_SETTINGS.audio.master=false;window.__stackfallLoopGeneration++;stackfallDeveloperTest.startStage(id);stackfallDeveloperTest.setLevelUpsDisabled(true);stackfallDeveloperTest.setInvincible(true);
      if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);state.time=20;updateSpawning(0);updateHUD();state.mode='paused';draw();
      return{renderer:stackfallRendererInfo(),time:state.time};
    },id);
    await page.screenshot({path:resolve(output,config.name+'-early.png')});
    await page.evaluate(()=>{state.mode='playing';state.time=state.stageRun.stage.boss.spawnAt*.84;updateSpawning(0);updateHUD();state.mode='paused';draw();});
    await page.screenshot({path:resolve(output,config.name+'-late.png')});
    let hazard=null;
    if(order===2){hazard=await page.evaluate(id=>{state.mode='playing';clearStagePhysicalObjects();clearPendingCombatActions();stackfallStageRuntimeRegistry.get(id).hazard({variant:'ion-shear'},{run:state.stageRun,progress:.5,isActive:()=>true});for(let i=0;i<74;i++){state.time+=1/60;updatePendingActions(1/60);updateStagePhysicalObjects(1/60);}const objects=stagePhysicalObjects();draw();return{count:objects.length,active:objects.some(o=>o.kind==='ion-front'&&o.active),bounded:objects.length<=STAGE_PHYSICAL_LIMIT};},id);await page.screenshot({path:resolve(output,config.name+'-ion-front.png')});}
    const preview=await page.evaluate(id=>{
      const result=stackfallDeveloperTest.jumpStageBoss(id),start=state.time;
      for(let i=0;i<299;i++){state.time=start+(i+1)/60;updatePlayer(1/60);updateSpawning(1/60);}
      const before={time:state.time,mode:state.mode,boss:state.stageRun.bossSpawned,enemies:state.entities.enemies.length,objects:stagePhysicalObjects().length};
      state.time=result.bossAt;updateSpawning(1/60);
      const trigger={mode:state.mode,pending:state.stageRun.bossIntroPending,owner:state.realmTransition?.owner};
      if(state.realmTransition)updateRealmTransition(state.realmTransition.duration*.5);draw();
      return{result,before,trigger};
    },id);
    await page.screenshot({path:resolve(output,config.name+'-entrance.png')});
    const combat=await page.evaluate(order=>{
      if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);
      const boss=state.entities.enemies.find(e=>e.kind==='stage-boss');if(!boss)return{error:'missing final boss'};
      const checks=[],check=(ok,name)=>checks.push({ok:!!ok,name});
      check(state.mode==='playing','entrance returns to gameplay');check(state.entities.enemies.filter(e=>e.kind==='stage-boss').length===1,'single boss spawn');
      if(order===1){
        const shapes=stackfallStageBodyShapes(boss),jaw=shapes[1];check(enemyCircleOverlap(boss,jaw.x,jaw.y,2),'outer jaw receives weapon hits');check(!enemyCircleOverlap(boss,boss.x,boss.y+75*(boss.stageBodyScale||1),2),'open gate has no phantom hitbox');
        const hp=boss.hp;state.entities.projectiles.push({x:jaw.x-180,y:jaw.y,vx:24000,vy:0,r:3,damage:20,life:1,pierce:0,source:'core'});updateProjectiles(1/60);check(boss.hp<hp,'swept fast weapon hits outer jaw');
      }
      stackfallSetGameSpeed(2);check(state.gameSpeed===2,'x2 control preserves fixed simulation steps');
      const kinds=new Set(),actions=new Set();let maxObjects=0,maxTravel=0;
      for(let i=0;i<2400;i++){
        const dt=1/60;state.time+=dt;player.stagePreviousX=player.x;player.stagePreviousY=player.y;updatePendingActions(dt);updateSpawning(dt);const ox=boss.x,oy=boss.y;updateEnemies(dt);maxTravel=Math.max(maxTravel,Math.hypot(boss.x-ox,boss.y-oy));updateTelegraphs(dt);updateEnemyProjectiles(dt);updateEffects(dt);maxObjects=Math.max(maxObjects,stagePhysicalObjects().length);for(const o of stagePhysicalObjects())kinds.add(o.kind);if(boss.stageAction)actions.add(boss.stageAction);
        if(i===1200)boss.hp=boss.maxHp*.47;if(order>=2&&i===1800)boss.hp=boss.maxHp*.25;
      }
      check(maxObjects<=STAGE_PHYSICAL_LIMIT,'bounded physical objects');check(maxTravel<40,'visible movement without coordinate jumps');if(order===1){check(boss.stagePhase===2&&boss.stageGateCoreOpen,'48 percent opens body and phase');for(const kind of['salvage','bulkhead','girder'])check(kinds.has(kind),'director executes '+kind);check(actions.has('ram'),'director executes body ram');}
      if(order===2){check(boss.visualR===64&&boss.r===92&&boss.contactR===64,'visual hit and contact radii stay separate');check(boss.stagePhase===3&&boss.stageNebulaCoreOpen,'two structural phase transitions');for(const action of['lobe','inhale','exhale','current'])check(actions.has(action),'director executes '+action);check(state.stageRun.nebula.depth===1,'seekable deep trench environment');if(vw<760)check(Math.abs(boss.x-player.x)+92<vw*.5,'entire mobile boss stays in view');}
      if(order>=3){const production=stackfallStageProduction(boss.eventKind);check(boss.stageProduction,'authored anatomy owner');check(audio.musicSceneForState()===production.music,'dedicated boss music scene');const calls=[],allowed=audio.allowed,play=audio.playChannel;audio.allowed=()=>true;audio.playChannel=(...args)=>calls.push(args);try{audio.stageAttack(boss.eventKind,'verify-cue');}finally{audio.allowed=allowed;audio.playChannel=play;}check(calls.length===2&&calls.every(c=>Number.isFinite(c[1])&&c[2]>0),'authored audio cue reaches both oscillator voices');check(boss.stagePhase>=2,'structural phase transition');check(state.stageRun.productionEnvironment.progress===1,'seekable final environment');for(const action of production.actions)check(actions.has(action),'director executes '+action);const shapes=stackfallStageBodyShapes(boss);check(shapes.length>0&&shapes.every(s=>s.kind==='polygon'&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))),'finite authored body geometry');const point=shapes[0].points[0];check(enemyCircleOverlap(boss,point.x,point.y,2),'visible outer anatomy takes hits');check(enemySegmentOverlap(boss,point.x-300,point.y,point.x+300,point.y,3),'fast weapon segment hits anatomy');}
      updateHUD();state.mode='paused';draw();
      return{checks,kinds:[...kinds],actions:[...actions],maxObjects,maxTravel,boss:{x:boss.x,y:boss.y,phase:boss.stagePhase},runtime:stackfallRuntimeDiagnostics()};
    },order);
    await page.screenshot({path:resolve(output,config.name+'-phase2.png')});
    if(order>=3){for(let action=0;action<3;action++){await page.evaluate(action=>{const boss=state.entities.enemies.find(e=>e.kind==='stage-boss');state.mode='playing';clearStagePhysicalObjects();clearPendingCombatActions();boss.cycle=action+2;boss.attackCd=0;for(let i=0;i<96;i++){state.time+=1/60;updatePendingActions(1/60);updateEnemies(1/60);updateStagePhysicalObjects(1/60);}ui.bossNotice.classList.add('hidden');updateHUD();state.mode='paused';draw();},action);await page.screenshot({path:resolve(output,config.name+'-attack-'+action+'.png')});}}
    const victory=await page.evaluate(()=>{const boss=state.entities.enemies.find(e=>e.kind==='stage-boss');state.mode='playing';dealDamage(boss,boss.hp*10,{source:'core',canCrit:false});const start=state.mode;updateStageVictoryCinematic(1.4);let victoryDraws=0;const authoredDraw=drawStageVictoryCinematic;drawStageVictoryCinematic=()=>{victoryDraws++;authoredDraw();};draw();drawStageVictoryCinematic=authoredDraw;return{start,victoryDraws,bossBar:{classes:ui.bossBar.className,display:getComputedStyle(ui.bossBar).display,multiDisplay:getComputedStyle(document.querySelector('#multiBossBars')).display},duration:state.stageVictory?.duration,runtime:stackfallRuntimeDiagnostics()};});
    await page.screenshot({path:resolve(output,config.name+'-victory.png')});
    const complete=await page.evaluate(()=>{updateStageVictoryCinematic(10);return{mode:state.mode,musicScene:audio.musicSceneForState(),errors:stackfallRuntimeDiagnostics().errors};});
    const rendererMatches=config.gpu?initial.renderer.status==='active':initial.renderer.fallback===true;
    const ok=(!hazard||hazard.active&&hazard.bounded)&&rendererMatches&&preview.before.mode==='playing'&&!preview.before.boss&&preview.before.enemies===0&&preview.before.objects===0&&preview.trigger.mode==='cinematic'&&combat.checks?.every(c=>c.ok)&&victory.start==='stageVictory'&&victory.victoryDraws===1&&victory.bossBar.display==='none'&&victory.bossBar.multiDisplay==='none'&&complete.mode==='stageComplete'&&complete.musicScene===null&&complete.errors.length===0&&errors.length===0;
    results.push({name:config.name,ok,initial,hazard,preview,combat,victory,complete,errors});
    await context.close();
  }
}finally{await browser.close();}
writeFileSync(resolve(output,'results.json'),JSON.stringify({id,ok:results.every(r=>r.ok),results},null,2));
for(const r of results)console.log(r.ok?'PASS':'FAIL',r.name,JSON.stringify({errors:r.errors,renderer:r.initial.renderer.backend,checks:r.combat.checks?.filter(c=>!c.ok),runtime:r.complete.errors,preview:r.preview,combatError:r.combat.error}));
if(results.some(r=>!r.ok))process.exitCode=1;
