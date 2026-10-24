import {join} from 'node:path';

export async function apexFoundationBrowserQa(page,scenario,{evaluate,waitFor,check,sleep,capture,screenshotDir}){
  const name=page.name,probe=expr=>evaluate(page,expr);
  const setup=await probe(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);window.stackfallSetGameSpeed?.(1,{silent:true});if(state.realmTransition)cancelRealmTransition('space');state.mode='playing';GAME_SETTINGS.audio.master=false;state.spawnTimer=state.encounterTimer=99999;return{clock:stackfallApexClockDiagnostics(),mode:state.mode,speed:stackfallGameSpeed(),dev:api.enabled};})()`);
  scenario.observations.initial=setup;check(setup.dev&&setup.clock&&!setup.clock.paused,'developer runtime or clock diagnostics missing',name);
  await sleep(500);const ordinary=await probe('stackfallApexClockDiagnostics()');scenario.observations.ordinaryTimer=ordinary;

  for(const form of ['chronophage','starforge','lastconstellation']){
    if(form!=='chronophage')await probe('stackfallDeveloperTest.startEndless()');
    const invoked=await probe(`stackfallDeveloperTest.spawnEndlessApex(${JSON.stringify(form)})`);
    check(invoked?.ok===true,`${form} dev start failed: ${JSON.stringify(invoked)}`,name);
    const active=await waitFor(page,"state.apexActiveId&&state.mode==='playing'",9000,80);
    check(!!active,`${form} never reached active combat`,name);if(!active)break;
    const before=await probe('({clock:stackfallApexClockDiagnostics(),boss:state.entities.enemies.find(e=>e.id===state.apexActiveId)})');
    if(form==='chronophage'){
      const arena=await probe(`(()=>{const e=state.entities.enemies.find(x=>x.id===state.apexActiveId);state.apexArena={x:e.x,y:e.y,r:100,form:'chronophage'};const ax=state.apexArena.x;player.x=ax+500;player.y=state.apexArena.y;updateMapEventPlayer(0);const x=player.x;return{x,expected:ax+500,r:state.apexArena.r};})()`);
      scenario.observations.freeMovement=arena;check(Math.abs(arena.x-arena.expected)<.01,'player was clamped by an Apex arena boundary',name);
      const partFixture=await probe(`(()=>{const result=stackfallDeveloperTest.defineMultipartFixture([{key:'left',label:'PART A',dx:-155,dy:0,r:38},{key:'shoulder',label:'PART B',dx:0,dy:0,r:54},{key:'right',label:'PART C',dx:155,dy:0,r:38}]);const e=state.entities.enemies.find(x=>x.id===state.apexActiveId);return{result,parts:stackfallBossPartDiagnostics(),sameOwner:e.bodyParts.every(p=>p.owner===e),separateCoordinates:new Set(e.bodyParts.map(p=>String(p.x)+','+String(p.y))).size};})()`);
      scenario.observations.multipart=partFixture;check(partFixture.result.ok&&partFixture.parts.parts.length===3&&partFixture.sameOwner&&partFixture.separateCoordinates===3,'multipart fixture did not create distinct visible targets on one owner',name);
      const targeting=await probe(`(()=>{const e=state.entities.enemies.find(x=>x.id===state.apexActiveId),p=e.bodyParts[0],target=nearestEnemy(p.x,p.y,500,x=>x.id===e.id);return{targetId:target?.id,partId:p.id,isPart:target?.bodyPart===true,correctOwner:target?.owner===e};})()`);
      scenario.observations.targeting=targeting;check(targeting.isPart&&targeting.correctOwner,'auto targeting selected the abstract boss center instead of an active part',name);
      const inactive=await probe(`(()=>{const e=state.entities.enemies.find(x=>x.id===state.apexActiveId),old=e.bodyParts[0];old.active=false;const m={id:state.nextId++,x:old.x-80,y:old.y,vx:600,vy:0,targetId:old.id,n:6,reacquired:false,age:.1,ignition:0,damage:12,baseDamage:12,r:5,life:3,max:3,terminal:false};state.entities.guidedMissiles.push(m);updateGuidedMissiles(.01);return{oldId:old.id,newId:m.targetId,nextIsActive:e.bodyParts.some(p=>p.id===m.targetId&&p.active),activeIds:e.bodyParts.filter(p=>p.active).map(p=>p.id)};})()`);
      scenario.observations.homingHandoff=inactive;check(inactive.newId!==inactive.oldId&&inactive.nextIsActive,'guided missile failed to hand off an inactive part target',name);
      const overlap=await probe(`(()=>{const e=state.entities.enemies.find(x=>x.id===state.apexActiveId);defineBossBodyParts(e,[{key:'a',dx:120,dy:0,r:52},{key:'b',dx:120,dy:0,r:52}]);rebuildEnemyIndex();e.hp=e.maxHp=1e8;const pos=e.bodyParts[0],base=dealDamage;let calls=0;dealDamage=function(target,...args){if(bossPartOwner(target)===e)calls++;return base(target,...args);};try{areaDamage(pos.x,pos.y,70,20,'#fff','foundation-overlap',{shake:false});}finally{dealDamage=base;}return{calls,damage:1e8-e.hp,ownerId:e.id,overlaps:enemyCircleOverlap(e,pos.x,pos.y,0)};})()`);
      scenario.observations.duplicateAoE=overlap;check(overlap.calls===1&&overlap.damage>0&&overlap.overlaps,'one AoE applied duplicate shared HP damage across collocated parts',name);
      const attackPaths=await probe(`(()=>{const e=state.entities.enemies.find(x=>x.id===state.apexActiveId),p=e.bodyParts[0],base=dealDamage,counts={pierce:0,rail:0,mine:0,blade:0};e.hp=e.maxHp=1e8;function tracked(tag){dealDamage=function(target,...args){if(bossPartOwner(target)===e&&String(args[1]?.source||'').includes(tag))counts[tag]++;return base(target,...args);};}try{tracked('pierce');state.entities.projectiles.push({x:p.x,y:p.y,vx:0,vy:0,r:6,life:1,maxRange:1000,damage:10,pierce:5,hitIds:new Set(),source:'foundation-pierce'});rebuildEnemyIndex();updateProjectiles(.016);tracked('rail');applyRailBeam(p.x-100,p.y,p.x+100,p.y,24,12,'#fff','rail');tracked('mine');detonatePhaseMine({x:p.x,y:p.y,n:1,life:1,radius:90,damage:14,phantom:false});dealDamage=base;defineBossBodyParts(e,[{key:'blade',dx:0,dy:0,r:58}]);const blade=e.bodyParts[0];state.weaponSlots=['blade'];state.weaponStacks={...state.weaponStacks,blade:1};state.apexArena=null;player.x=blade.x-orbitRadiusFor('blade');player.y=blade.y;player.angle=0;player.bladeTick=0;tracked('blade');updateWeapons(.016);}finally{dealDamage=base;}return counts;})()`);
      scenario.observations.attackPaths=attackPaths;check(attackPaths.pierce===1&&attackPaths.rail===1&&attackPaths.mine===1&&attackPaths.blade===1,'piercing, beam, mine or melee path did not route one hit to the shared boss',name);
      await capture(page,join(screenshotDir,'apex-foundation-debug-parts.png')).then(path=>scenario.screenshots.push(path));
    }
    await sleep(520);const after=await probe(`(()=>{const b=state.entities.enemies.find(e=>e.id===state.apexActiveId);return{clock:stackfallApexClockDiagnostics(),elapsed:b?.apexElapsed,skillCd:b?.skillCd};})()`);
    scenario.observations[`${form}-pausedClock`]=after;
    check(after.clock.paused&&Math.abs(after.clock.runTime-before.clock.runTime)<.08,'run progression timer advanced during active Apex combat',name);
    check(after.clock.simulationTime>before.clock.simulationTime+.35&&after.elapsed>before.boss.apexElapsed+.35,`${form} combat simulation/cooldowns stopped with progression timer`,name);
    await probe("killEnemy(state.entities.enemies.find(e=>e.id===state.apexActiveId),{source:'foundation-qa'})");
    const reward=await waitFor(page,"state.mode==='apexReward'&&!document.querySelector('#apexRewardScreen').classList.contains('hidden')",7000,80);
    check(!!reward,`${form} victory did not reach reward`,name);const rewardClock=await probe('stackfallApexClockDiagnostics()');check(rewardClock.paused,'run timer resumed on Apex reward screen',name);
    await probe("document.querySelector('#apexRewardConfirmBtn')?.click()");
    await sleep(450);const resumed=await probe('stackfallApexClockDiagnostics()');check(!resumed.paused&&resumed.runTime>rewardClock.runTime+.30,'run timer did not resume after reward selection',name);
    scenario.observations[`${form}-rewardResume`]={rewardClock,resumed};
  }
  const beforePause=await probe('stackfallApexClockDiagnostics()');await probe('togglePause(true)');await sleep(320);const whilePaused=await probe('stackfallApexClockDiagnostics()');await probe('togglePause(false)');scenario.observations.pauseMenu={beforePause,whilePaused};check(whilePaused.paused===false&&whilePaused.runTime===beforePause.runTime,'pause menu changed or advanced the Apex progression clock unexpectedly',name);
  await probe("window.stackfallSetGameSpeed?.(2,{silent:true})");const beforeScaled=await probe('stackfallApexClockDiagnostics()');await sleep(500);const pause=await probe(`(()=>{const c=stackfallApexClockDiagnostics();return{speed:stackfallGameSpeed(),before:${JSON.stringify(beforeScaled)},clock:c};})()`);scenario.observations.gameSpeed=pause;check(pause.speed===2&&pause.clock.runTime>beforeScaled.runTime+.65,'run timer did not advance at x2 simulation speed',name);
  const diagnostics=await probe('stackfallRuntimeDiagnostics()');check(diagnostics.errorCount===0,'Apex foundation runtime generated errors',name);
}
