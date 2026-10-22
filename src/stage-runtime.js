(()=>{
  const VICTORY_DURATION=2.85,registry=new Map();
  const objective=document.querySelector('#stageObjective'),completeScreen=document.querySelector('#stageCompleteScreen'),completeTitle=document.querySelector('#stageCompleteTitle'),completeName=document.querySelector('#stageCompleteName'),completeTime=document.querySelector('#stageCompleteTime'),completeKills=document.querySelector('#stageCompleteKills'),completeReward=document.querySelector('#stageCompleteReward'),completeMap=document.querySelector('#stageCompleteMapBtn'),completeMenu=document.querySelector('#stageCompleteMenuBtn');
  const localized=value=>value?.[GAME_SETTINGS.language]||value?.en||value?.ko||'';
  function registerStageRuntime(id,definition){if(!id||!definition||registry.has(id))throw new Error('Duplicate or invalid stage runtime: '+id);registry.set(String(id),Object.freeze({...definition,id:String(id)}));}
  function currentStageId(){return window.stackfallIsStageRun?.()===true?state.runSelection?.stageId||null:null;}
  function isStage(id=null){const current=currentStageId();return !!current&&(!id||current===id);}
  function stageRuntime(){return isStage()?state.stageRun:null;}
  function stageDefinition(id=currentStageId()){return id?registry.get(id)||null:null;}
  function environmentFamily(stage){
    if(stage?.constellationId==='constellation-02')return'bloom';
    if(stage?.constellationId==='constellation-03')return'array';
    return'route';
  }
  function stageEnvironmentCombatScale(context){
    const order=Math.max(1,Math.min(18,Number(context?.order)||1)),progress=clamp(Number(context?.progress)||0,0,1);
    const start=order<=3?.56:order<=6?.70:order<=12?.82:.92,end=order<=3?.90:order<=6?1.00:order<=12?1.10:1.22;
    const damage=start+(end-start)*Math.pow(progress,.78),speed=(order<=3?.86:order<=6?.92:order<=12?.98:1.04)+(order>=13?progress*.05:progress*.03),warning=order<=3?1.20-progress*.12:order<=6?1.10-progress*.08:order<=12?1.04-progress*.06:Math.max(.88,1.00-progress*.10);
    return{damage,speed,warning};
  }
  window.stackfallStageEnvironmentCombatScale=stageEnvironmentCombatScale;
  function withStageEnvironment(event,api,action){
    const previous=state.stageEnvironmentTelegraphContext||null;
    state.stageEnvironmentTelegraphContext={family:environmentFamily(api?.stage),stageId:api?.stage?.id||null,variant:event?.variant||'environment',ambient:!!event?.ambient,order:Number(api?.stage?.order)||1,progress:clamp(Number(api?.progress)||0,0,1)};
    try{return action?.();}finally{state.stageEnvironmentTelegraphContext=previous;}
  }
  function clearStageUi(){objective?.classList.add('hidden');completeScreen?.classList.add('hidden');state.stageVictory=null;state.stageEnvironmentTelegraphContext=null;}
  function spawnStageEnemy(stageId,variant,origin=null){
    const def=stageDefinition(stageId),data=def?.variants?.[variant];if(!def||!data||!makeEnemyRoom('normal'))return null;
    const cfg=enemyConfig(data.type),angle=Math.random()*TAU,radius=Math.min(Math.max(vw,vh)*.52,Number(def.spawnRadius)||700)+rand(Number(def.spawnRadiusMin)||50,Number(def.spawnRadiusMax)||130),enemy={
      id:state.nextId++,type:data.type,kind:'stage',variant:null,stageVariant:variant,eventKind:stageId,name:tr(data.name),
      x:origin?.x??player.x+Math.cos(angle)*radius,y:origin?.y??player.y+Math.sin(angle)*radius,
      r:cfg.r*data.r,hp:cfg.hp*data.hp,maxHp:0,speed:cfg.speed*data.speed,damage:cfg.damage*data.damage,color:data.color,xp:cfg.xp*data.xp,
      hit:0,dead:false,phase:Math.random()*TAU,skillCd:999,burstCd:999,pulseCd:999,rangedCd:data.type==='ranged'?rand(data.rangedMin??.75,data.rangedMax??1.28):999,
      strafeDir:Math.random()<.5?-1:1,dash:0,dashX:0,dashY:0
    };
    enemy.maxHp=enemy.hp;state.entities.enemies.push(enemy);return enemy;
  }
  function spawnStageBurst(stageId,variant,count){
    const def=stageDefinition(stageId),radiusMin=Number(def?.burstRadiusMin)||610,radiusMax=Number(def?.burstRadiusMax)||790;
    for(let i=0;i<count;i++){const a=i/Math.max(1,count)*TAU+Math.random()*.18,r=rand(radiusMin,radiusMax);spawnStageEnemy(stageId,variant,{x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r});}
  }
  function chooseVariant(pool){let roll=Math.random(),sum=0;for(const[variant,weight]of pool){sum+=weight;if(roll<=sum)return variant;}return pool.at(-1)?.[0]||null;}
  const STAGE_ENCOUNTER_POOLS=Object.freeze({
    route:Object.freeze({mini:Object.freeze(['knight','warden','executioner','colossus']),boss:Object.freeze(['eclipse','pulsar','heliarch','tempest'])}),
    bloom:Object.freeze({mini:Object.freeze(['harvester','mirror','colossus','warden']),boss:Object.freeze(['seraph','leviathan','archivist'])}),
    array:Object.freeze({mini:Object.freeze(['executioner','warden','colossus','harvester','mirror']),boss:Object.freeze(['nullengine','tempest','pulsar','archivist'])})
  });
  const STAGE_ENCOUNTER_CYCLES=Object.freeze([0,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,7,8]);
  function buildStageEncounterSchedule(order){
    const cycles=STAGE_ENCOUNTER_CYCLES[Math.max(1,Math.min(18,Math.floor(Number(order)||1)))]||1,total=cycles*3,start=order<=2?.22:order<=6?.15:order<=12?.11:.08,end=.89,out=[];
    for(let index=0;index<total;index++)out.push(Object.freeze({kind:index%3===2?'boss':'mini',at:total===1?start:start+(end-start)*(index/(total-1))}));
    return Object.freeze(out);
  }
  const STAGE_ENCOUNTER_SCHEDULES=Object.freeze(Object.fromEntries(Array.from({length:18},(_,i)=>[i+1,buildStageEncounterSchedule(i+1)])));
  function stageEncounterPlan(stage){return STAGE_ENCOUNTER_SCHEDULES[Math.max(1,Number(stage?.order)||1)]||STAGE_ENCOUNTER_SCHEDULES[1];}
  const STAGE_WORLD_EVENT_PLAN=Object.freeze({
    // First appearances: S1 Vault, S3 Crash, S4 Distress, S6 Meteor, S8 Predator, S10 Void, S12 Relay, S14 Storm.
    1:Object.freeze([{at:.34,type:'vault'},{at:.72,type:'vault'}]),
    2:Object.freeze([{at:.26,type:'vault'},{at:.63,type:'vault'}]),
    3:Object.freeze([{at:.20,type:'vault'},{at:.50,type:'crash'},{at:.78,type:'vault'}]),
    4:Object.freeze([{at:.20,type:'distress'},{at:.49,type:'vault'},{at:.76,type:'crash'}]),
    5:Object.freeze([{at:.18,type:'vault'},{at:.46,type:'distress'},{at:.74,type:'crash'}]),
    6:Object.freeze([{at:.14,type:'meteor'},{at:.34,type:'vault'},{at:.55,type:'crash'},{at:.77,type:'distress'}]),
    7:Object.freeze([{at:.16,type:'distress'},{at:.43,type:'meteor'},{at:.72,type:'vault'}]),
    8:Object.freeze([{at:.14,type:'predator'},{at:.34,type:'crash'},{at:.56,type:'meteor'},{at:.78,type:'vault'}]),
    9:Object.freeze([{at:.15,type:'predator'},{at:.37,type:'distress'},{at:.59,type:'crash'},{at:.80,type:'meteor'}]),
    10:Object.freeze([{at:.13,type:'void'},{at:.33,type:'vault'},{at:.54,type:'predator'},{at:.76,type:'crash'}]),
    11:Object.freeze([{at:.13,type:'meteor'},{at:.32,type:'void'},{at:.52,type:'distress'},{at:.74,type:'predator'}]),
    12:Object.freeze([{at:.11,type:'relay'},{at:.28,type:'vault'},{at:.46,type:'crash'},{at:.64,type:'void'},{at:.81,type:'meteor'}]),
    13:Object.freeze([{at:.12,type:'relay'},{at:.31,type:'predator'},{at:.51,type:'void'},{at:.73,type:'crash'}]),
    14:Object.freeze([{at:.10,type:'storm'},{at:.27,type:'relay'},{at:.44,type:'distress'},{at:.62,type:'meteor'},{at:.80,type:'vault'}]),
    15:Object.freeze([{at:.10,type:'storm'},{at:.25,type:'relay'},{at:.41,type:'crash'},{at:.58,type:'predator'},{at:.76,type:'void'}]),
    16:Object.freeze([{at:.09,type:'relay'},{at:.23,type:'storm'},{at:.38,type:'vault'},{at:.54,type:'meteor'},{at:.70,type:'predator'},{at:.83,type:'crash'}]),
    17:Object.freeze([{at:.08,type:'storm'},{at:.21,type:'relay'},{at:.34,type:'distress'},{at:.48,type:'meteor'},{at:.62,type:'void'},{at:.77,type:'crash'}]),
    18:Object.freeze([{at:.07,type:'vault'},{at:.19,type:'relay'},{at:.31,type:'storm'},{at:.43,type:'crash'},{at:.55,type:'predator'},{at:.67,type:'meteor'},{at:.79,type:'void'}])
  });
  function stageWorldEventPlan(stage){return STAGE_WORLD_EVENT_PLAN[Math.max(1,Math.min(18,Number(stage?.order)||1))]||STAGE_WORLD_EVENT_PLAN[1];}
  function updateStageWorldEvents(run,progress){
    if(!run||run.bossSpawned||state.mapEventActive||state.entities.mapEvents?.length)return;
    const plan=stageWorldEventPlan(run.stage);run.worldEventsTriggered=run.worldEventsTriggered||{};
    for(let index=0;index<plan.length;index++){
      const entry=plan[index];if(progress<entry.at||run.worldEventsTriggered[index])continue;
      if(window.stackfallSpawnAuthoredMapEvent?.(entry.type)){run.worldEventsTriggered[index]=true;run.lastWorldEvent={...entry,index};}
      break;
    }
  }
  function stageEncounterConcurrency(stage){const order=Math.max(1,Number(stage?.order)||1);return Math.min(5,3+Math.floor((order-1)/6));}
  function activeStageEncounterCount(){
    const groups=new Set();
    for(const enemy of state.entities.enemies)if(enemy&&!enemy.dead&&enemy.stageEncounter===true)groups.add(enemy.twinGroup||enemy.id);
    return groups.size;
  }
  function nextStageEncounterForm(run,kind){
    const family=environmentFamily(run?.stage),pool=STAGE_ENCOUNTER_POOLS[family]?.[kind]||STAGE_ENCOUNTER_POOLS.route[kind];
    run.encounterBags=run.encounterBags||{};const key=family+':'+kind;let bag=run.encounterBags[key];
    if(!bag?.length){bag=[...pool];for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}run.encounterBags[key]=bag;}
    return bag.pop();
  }
  function stageEncounterMembers(enemy){return enemy?.twinGroup?state.entities.enemies.filter(member=>member&&!member.dead&&member.twinGroup===enemy.twinGroup):enemy?[enemy]:[];}
  function spawnStageEncounter(entry,index){
    const run=stageRuntime();if(!run||run.bossSpawned||!entry||activeStageEncounterCount()>=stageEncounterConcurrency(run.stage))return null;
    const kind=entry.kind==='boss'?'boss':'mini',form=nextStageEncounterForm(run,kind),enemy=window.stackfallSpawnEliteForm?.(kind,form)||spawnEnemy(kind);if(!enemy)return null;
    const order=Math.max(1,Number(run.stage.order)||1),finale=order%6===0,progress=clamp(Number(entry.at)||0,0,1);
    const hpScale=kind==='boss'?(.48+Math.min(.14,(order-1)*.007)+progress*.10+(finale?.05:0)):(.82+Math.min(.12,(order-1)*.006)+progress*.06+(finale?.04:0));
    const damageScale=kind==='boss'?(.78+Math.min(.12,(order-1)*.006)+(finale?.04:0)):(.90+Math.min(.10,(order-1)*.005)+(finale?.03:0));
    for(const member of stageEncounterMembers(enemy)){
      member.kind=kind==='mini'?'stage-mini':'stage-boss-encounter';member.bossCategory=kind==='boss'?'boss':member.bossCategory;member.eventKind=run.stage.id;member.stageEncounter=true;member.stageEncounterType=kind;member.stageEncounterFamily=environmentFamily(run.stage);member.stageEncounterIndex=index;member.controlImmune=false;
      member.hp*=hpScale;member.maxHp=member.hp;member.damage*=damageScale;if(kind==='mini')member.xp*=1.10;
    }
    showBossNotice(enemy.name,kind==='boss'?'STAGE BOSS':finale?'CONSTELLATION GUARD':'STAGE MID-BOSS');return enemy;
  }
  function updateStageEncounters(run,progress){
    if(state.mapEventActive||state.entities.mapEvents?.length)return;
    const plan=stageEncounterPlan(run.stage);run.encountersTriggered=run.encountersTriggered||{};
    for(let index=0;index<plan.length;index++){const entry=plan[index];if(progress<entry.at||run.encountersTriggered[index])continue;if(activeStageEncounterCount()>=stageEncounterConcurrency(run.stage))break;const spawned=spawnStageEncounter(entry,index);if(spawned)run.encountersTriggered[index]=true;break;}
  }
  function liveNonBossCount(){
    let active=0;for(const enemy of state.entities.enemies)if(enemy&&!enemy.dead&&enemy.kind!=='stage-boss')active++;return active;
  }
  function stageSpawnBudget(stage,progress,base){
    const order=Math.max(1,Number(stage?.order)||1),compact=compactDevice(),tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;
    const hardwareFactor=tier===2?.80:tier===1?.92:1,ceiling=(compact?28+order*1.10+progress*5:34+order*1.50+progress*6)*hardwareFactor;
    const floorRate=Math.max(.38,.62-(order-1)*.014),cap=Math.max(20,Math.min(Number(base.cap)||38,Math.round(ceiling))),rate=Math.max(floorRate,(Number(base.rate)||1)*(1-progress*.06)),count=Math.max(1,Math.min(2,Math.floor(Number(base.count)||1)));
    return{cap,rate,count,tier,order};
  }
  function apiFor(run=stageRuntime()){const stageId=run?.stage?.id,stage=run?.stage,progress=stage?clamp((state.time||0)/Math.max(1,stage.boss?.spawnAt||stage.durationSeconds||600),0,1):0;return{run,stage,progress,definition:stageDefinition(stageId),isActive:()=>isStage(stageId)&&state.mode==='playing',spawnEnemy:(variant,origin)=>spawnStageEnemy(stageId,variant,origin),spawnBurst:(variant,count)=>spawnStageBurst(stageId,variant,count),localized};}
  window.stackfallStageBodyShapes=e=>stageDefinition(e?.eventKind)?.production?.shapes?.(e)||e?.stageBodyShapes||[];
  function spawnStageBoss(options={}){
    const run=stageRuntime(),def=stageDefinition();if(!run||!def||run.bossSpawned||state.mapEventActive||state.entities.mapEvents?.length||!makeEnemyRoom('boss'))return null;
    const profile=typeof def.bossProfile==='function'?def.bossProfile(run):def.bossProfile;if(!profile)return null;
    const cfg=enemyConfig('boss'),stage=run.stage,angle=profile.angle??-Math.PI/2,radius=Math.min(Math.max(vw,vh)*.50,profile.spawnRadius||660),e={
      id:state.nextId++,type:'boss',kind:'stage-boss',bossCategory:stage.boss?.rank==='apex'?'apex':'boss',stageApex:stage.boss?.rank==='apex',stageBossTier:Number(stage.order)%6===0?'constellation':'stage',variant:profile.form,eliteForm:profile.form,eventKind:stage.id,eventVariant:profile.eventVariant,name:localized(stage.boss?.name)||tr(profile.nameKey),
      x:player.x+Math.cos(angle)*radius,y:player.y+Math.sin(angle)*radius,r:profile.hitRadius??profile.r,visualR:profile.r,contactR:profile.contactRadius??profile.r,hp:cfg.hp*profile.hp,maxHp:0,speed:cfg.speed*profile.speed,damage:cfg.damage*profile.damage,color:profile.color,xp:cfg.xp*profile.xp,
      hit:0,dead:false,phase:Math.random()*TAU,skillCd:profile.skillCd,burstCd:profile.burstCd,pulseCd:profile.pulseCd,rangedCd:999,strafeDir:1,dash:0,dashX:0,dashY:0,stagePhase:1,controlImmune:true
    };
    if(e.stageBossTier==='constellation'){e.hp*=1.18;e.damage*=1.06;e.skillCd*=.92;e.burstCd*=.92;e.pulseCd*=.92;}e.maxHp=e.hp;
    def.production?.initialize?.(e,apiFor(run));if(def.production){const shapes=def.production.shapes(e),points=shapes.flatMap(s=>s.points||[]);run.bodyQueryPadding=Math.max(155,...points.map(p=>Math.hypot(p.x-e.x,p.y-e.y)+100));}state.entities.enemies.push(e);state.bossActiveId=e.id;state.bossIndex++;run.bossSpawned=true;run.bossId=e.id;run.bossSnapshot={id:e.id,x:e.x,y:e.y,color:e.color,kind:'stage-boss'};
    if(!options.suppressNotice)showBossNotice(e.name,e.stageApex?'APEX ENTITY':tr(profile.warningKey));audio.boss();if(!def.production)shockwave(e.x,e.y,e.color,profile.spawnShockwave||195,.74,5);return e;
  }
  function beginProductionBossIntro(event){
    const run=stageRuntime(),production=stageDefinition()?.production;if(!production||!run||run.bossSpawned||run.bossIntroPending||activeStageEncounterCount()>0)return false;
    run.bossIntroPending=true;ui.bossNotice.classList.add('hidden');document.querySelector('.stage-environment-notice')?.classList.remove('show');if(event?.id)run.eventsTriggered[event.id]=true;clearStagePhysicalObjects();clearPendingCombatActions();clearRunUiActions?.();window.closeMapEventOverlays?.();state.mapEventActive=null;state.entities.mapEvents.length=0;
    for(const enemy of state.entities.enemies)enemy.dead=true;state.entities.enemies.length=0;clearEnemyProjectiles();for(const key of['telegraphs','beams','wells'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;
    run.productionEntry=StageCraft.entryPoint(production);
    const profile=stageDefinition()?.bossProfile,apex=run.stage.boss?.rank==='apex';if(apex)audio.apexIntro?.(profile?.form||run.stage.boss?.id);else audio.stageAttack?.(run.stage.id,'intro');audio.syncAmbient?.(true);
    startRealmTransition(run.stage.id,{duration:production.entryDuration||3.2,owner:run.stage.id+'-boss-entry',title:localized(run.stage.boss.name),subtitle:production.subtitle||(apex?'APEX ENTITY':'FINAL TARGET'),onComplete:()=>{if(stageRuntime()!==run)return;run.bossIntroPending=false;spawnStageBoss({suppressNotice:true});}});return true;
  }
  window.stackfallStageProduction=id=>stageDefinition(id)?.production;
  function triggerStageEvent(event){
    const run=stageRuntime(),def=stageDefinition();if(!run||!def||run.eventsTriggered[event.id])return;const api=apiFor(run);
    if(event.kind==='boss'){if(stageDefinition()?.production){beginProductionBossIntro(event);return;}if(spawnStageBoss())run.eventsTriggered[event.id]=true;return;}
    run.eventsTriggered[event.id]=true;
    if(event.kind==='wave'){const label=def.waveLabel?.(event,api);if(label)showBossNotice(label,tr(def.fixedEventKey));spawnStageBurst(run.stage.id,event.variant,event.count||4);return;}
    if(event.kind==='hazard'){withStageEnvironment(event,api,()=>def.hazard?.(event,api));return;}
    def.event?.(event,api);
  }
  function updateObjective(run){
    if(!objective)return;const boss=run.bossId?state.entities.enemies.find(e=>!e.dead&&e.id===run.bossId):null;
    if(!boss){objective.classList.add('hidden');return;}const def=stageDefinition(run.stage.id);objective.textContent=tr(def?.objectiveKey||'stage01.objective.boss');objective.classList.remove('hidden');
  }
  function updateAmbientGimmick(run,def){
    const gimmick=run.stage.gimmick;if(!gimmick||run.bossSpawned||run.productionEnvironment?.quiet)return;
    if(!Number.isFinite(run.gimmickNextAt))run.gimmickNextAt=Math.max(1,Number(gimmick.startAt)||45);
    if(state.time<run.gimmickNextAt)return;
    const api=apiFor(run),progress=api.progress,cycle=(run.gimmickCycle||0)+1,hazards=run.stage.fixedEvents.filter(event=>event.kind==='hazard'),waves=run.stage.fixedEvents.filter(event=>event.kind==='wave');
    run.gimmickCycle=cycle;
    const interval=Math.max(16,Number(gimmick.interval)||40),accelerate=clamp(Number(gimmick.accelerate)||0,0,.5);
    run.gimmickNextAt=state.time+Math.max(14,interval*(1-progress*accelerate));
    if(hazards.length){const source=hazards[(cycle-1)%hazards.length],event={...source,id:'gimmick-'+cycle,ambient:true};withStageEnvironment(event,api,()=>def.hazard?.(event,api));}
    const waveEvery=Math.max(0,Math.floor(Number(gimmick.waveEvery)||0));
    if(waveEvery&&waves.length&&cycle%waveEvery===0){const source=waves[(Math.floor(cycle/waveEvery)-1)%waves.length],count=Math.max(2,Math.round((source.count||4)*(.66+progress*.34)));spawnStageBurst(run.stage.id,source.variant,count);}
  }
  function updateStage(dt){
    const run=stageRuntime(),def=stageDefinition();if(!run||!def||run.completed)return;def.production?.environment?.(run,dt);updateObjective(run);updateStagePhysicalObjects(dt);
    if(run.devBossPreview===true){
      const bossAt=Math.max(0,Number(run.stage?.boss?.spawnAt||run.stage?.durationSeconds||60));
      if((state.time||0)<bossAt)return;
      run.devBossPreview=false;
    }
    if(run.bossSpawned){
      const boss=state.entities.enemies.find(enemy=>enemy&&enemy.id===run.bossId);
      if(!boss||boss.dead)ensureStageVictory(boss||run.bossSnapshot||null);
      return;
    }
    if(state.mapEventActive)return;
    const progress=clamp(state.time/Math.max(1,run.stage.boss.spawnAt),0,1);
    updateStageWorldEvents(run,progress);
    for(const event of run.stage.fixedEvents)if(state.time>=event.at&&!run.eventsTriggered[event.id])triggerStageEvent(event);
    if(run.bossIntroPending||state.mode==='cinematic')return;
    if(!run.bossSpawned&&state.time>=run.stage.boss.spawnAt){
      if(def.production){beginProductionBossIntro(run.stage.fixedEvents.find(event=>event.kind==='boss'));return;}
      spawnStageBoss();
    }
    if(run.bossSpawned)return;
    updateAmbientGimmick(run,def);
    updateStageEncounters(run,progress);
    const active=liveNonBossCount(),authoredTime=progress*600,base=def.spawnProfile?.(authoredTime,apiFor(run))||{cap:38,rate:1,count:1},spawn=stageSpawnBudget(run.stage,progress,base);
    run.lastSpawnBudget={...spawn,active,progress};
    state.spawnTimer-=dt;if(state.spawnTimer>0||active>=spawn.cap)return;state.spawnTimer=Math.max(.25,spawn.rate);
    const pool=def.poolAt?.(authoredTime,apiFor(run))||[];for(let i=0;i<spawn.count;i++){const variant=chooseVariant(pool);if(variant)spawnStageEnemy(run.stage.id,variant);}
  }
  function finalizeStageComplete(){
    const run=stageRuntime();if(!run||run.resultShown)return;run.resultShown=true;const clearTime=run.completedAt||state.time;state.stageVictory=null;state.mode='stageComplete';state.runSerial++;state.pendingActions.length=0;clearRunUiActions?.();ui.touch.classList.add('hidden');ui.hud.classList.add('hidden');objective?.classList.add('hidden');
    const coreCashout=window.stackfallCashOutAwakeningCores?.()||{cores:0,stardust:0},result=window.stackfallRecordStageClear?.(run.stage.id,clearTime)||{newWeapons:[],newFeatures:[],currency:{}};window.stackfallRecordRun?.(state.kills||0);completeTitle.textContent=tr('stageClear.title');completeName.textContent=localized(run.stage.title);completeTime.textContent=formatTime(clearTime);completeKills.textContent=String(state.kills);
    const rewards=[];if(result.newWeapons.length)rewards.push(tr('stageClear.unlock')+' · '+result.newWeapons.map(key=>weaponText(key).name).join(', '));if(result.newFeatures?.length)rewards.push('SYSTEM UNLOCK · '+result.newFeatures.map(key=>window.stackfallFeatureName?.(key)||key).join(', '));if(result.currency?.stardust)rewards.push('✦ '+tr('currency.stardust')+' +'+result.currency.stardust);if(coreCashout.stardust)rewards.push('✦ '+tr('currency.stardust')+' +'+coreCashout.stardust+' · CORE ×'+coreCashout.cores);if(result.currency?.coreShard)rewards.push('◆ '+tr('currency.coreShard')+' +'+result.currency.coreShard);completeReward.textContent=rewards.length?rewards.join('   ·   '):tr('stageClear.rewardDone');
    window.renderStackfallMetaUi?.();window.stackfallRenderRunDamageResults?.('stage');completeScreen.classList.remove('hidden');window.renderStackfallGalaxyMap?.();audio.resonance();
  }
  function beginStageVictory(enemy){
    const run=stageRuntime();if(!run||run.completed||!enemy)return;clearStagePhysicalObjects();if(stageDefinition()?.production){beginProductionVictory(run,enemy);return;}run.completed=true;run.completedAt=state.time;run.victoryStarted=true;state.stageVictory={stageId:run.stage?.id||null,x:enemy.x,y:enemy.y,color:enemy.color||'#aeb9ff',elapsed:0,duration:VICTORY_DURATION,pulseA:false,pulseB:false};if(state.stageBossArena?.stageId===run.stage?.id)state.stageBossArena.locked=false;state.mode='stageVictory';state.pendingActions.length=0;clearRunUiActions?.();state.bossActiveId=null;ui.bossBar.classList.add('hidden');document.querySelector('#bossBarExtras')?.replaceChildren();objective?.classList.add('hidden');clearEnemyProjectiles();state.entities.telegraphs.length=0;state.entities.beams.length=0;for(const key of['vacuumSeeds','phaseMines','guidedMissiles','gateNetworks'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;
    for(const other of state.entities.enemies){if(other!==enemy&&!other.dead){other.dead=true;spawnParticle(other.x,other.y,other.color||'#9aa7ff',4,120,3);}}state.camera.shake=Math.max(state.camera.shake,24);state.flash=Math.max(state.flash,.34);shockwave(enemy.x,enemy.y,'#eef2ff',220,.90,8);spawnParticle(enemy.x,enemy.y,'#ffffff',54,410,9);spawnParticle(enemy.x,enemy.y,enemy.color||'#9aa7ff',42,300,7);
  }
  function beginProductionVictory(run,enemy){
    const production=stageDefinition()?.production;run.completed=true;run.completedAt=state.time;run.victoryStarted=true;production.environment?.(run,0);
    state.stageVictory={stageId:run.stage.id,x:enemy.x,y:enemy.y,elapsed:0,duration:production.victoryDuration||3.6,production:true,body:{...enemy,dead:false,hit:0}};
    state.mode='stageVictory';clearPendingCombatActions();clearRunUiActions?.();state.bossActiveId=null;if(state.stageBossArena)state.stageBossArena.locked=false;
    clearEnemyProjectiles();for(const key of['telegraphs','beams','wells','guidedMissiles','gateNetworks','texts'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;
    for(const e of state.entities.enemies)e.dead=true;updateHUD?.();ui.bossNotice.classList.add('hidden');document.querySelector('.stage-environment-notice')?.classList.remove('show');state.camera.shake=6;state.flash=0;production.defeat?.(enemy,run);
  }
  function ensureStageVictory(enemy=null){
    const run=stageRuntime();if(!run||run.completed||!run.bossSpawned)return false;
    const liveBoss=state.entities.enemies.find(candidate=>candidate&&!candidate.dead&&candidate.kind==='stage-boss'&&(!run.bossId||candidate.id===run.bossId));
    if(liveBoss)return false;
    const defeated=enemy&&enemy.kind==='stage-boss'?enemy:run.bossSnapshot||{x:player.x,y:player.y,color:'#aeb9ff',kind:'stage-boss'};
    beginStageVictory(defeated);return true;
  }
  window.handleStageBossDefeated=function handleStageBossDefeated(enemy){
    const run=stageRuntime();if(!run||run.completed||!enemy||enemy.kind!=='stage-boss')return false;
    if(run.bossId&&enemy.id!==run.bossId)return ensureStageVictory(enemy);
    beginStageVictory(enemy);return true;
  };
  window.stackfallEnsureStageVictory=ensureStageVictory;
  window.updateStageVictoryCinematic=function(dt){const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;v.elapsed+=dt;if(v.production){if(v.elapsed>=v.duration)finalizeStageComplete();return;}if(!v.pulseA&&v.elapsed>=.48){v.pulseA=true;shockwave(v.x,v.y,'#9aa7ff',340,.85,7);spawnParticle(v.x,v.y,'#b7c5ff',24,260,6);state.camera.shake=Math.max(state.camera.shake,18);state.flash=Math.max(state.flash,.22);}if(!v.pulseB&&v.elapsed>=1.18){v.pulseB=true;shockwave(v.x,v.y,'#ffffff',470,1.05,5);state.camera.shake=Math.max(state.camera.shake,11);state.flash=Math.max(state.flash,.16);}if(v.elapsed>=v.duration)finalizeStageComplete();};
  window.drawStageVictoryCinematic=function(){const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;if(v.production){stageDefinition(v.stageId)?.production?.drawVictory?.(v);return;}const p=worldToScreen(v.x,v.y),progress=clamp(v.elapsed/v.duration,0,1),burst=clamp(v.elapsed/.85,0,1),fade=1-clamp((v.elapsed-2.25)/.60,0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(p.x,p.y);for(let i=0;i<14;i++){const a=i/14*TAU+v.elapsed*.34,inner=24+burst*25,outer=58+burst*(125+(i%4)*16);ctx.globalAlpha=(.62-progress*.30)*fade;ctx.strokeStyle=i%3===0?'#ffffff':i%2?'#91a6ff':'#c0a8ff';ctx.lineWidth=1.2+(i%3)*.8;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}ctx.globalAlpha=Math.max(0,.9-progress*.45)*fade;const glow=ctx.createRadialGradient(0,0,0,0,0,120+burst*90);glow.addColorStop(0,'rgba(255,255,255,.95)');glow.addColorStop(.12,'rgba(190,210,255,.78)');glow.addColorStop(.42,'rgba(121,132,255,.22)');glow.addColorStop(1,'rgba(92,65,180,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,120+burst*90,0,TAU);ctx.fill();ctx.restore();ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';const reveal=clamp((v.elapsed-.70)/.50,0,1)*fade;ctx.globalAlpha=reveal;ctx.shadowBlur=28;ctx.shadowColor='#9aa7ff';ctx.fillStyle='#f4f7ff';ctx.font=`900 ${Math.round(clamp(vw*.04,28,54))}px "Black Han Sans",sans-serif`;ctx.fillText(v.elapsed<1.55?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw/2,vh*.27);ctx.restore();};
  window.stackfallRegisterStageRuntime=registerStageRuntime;window.stackfallStageRuntimeRegistry=registry;window.stackfallSpawnStageEnemy=spawnStageEnemy;window.stackfallSpawnStageBurst=spawnStageBurst;window.stackfallBeginStageVictory=beginStageVictory;window.stackfallStageBalanceDiagnostics=()=>{const run=stageRuntime();return run?{stageId:run.stage?.id,family:environmentFamily(run.stage),encounterPlan:stageEncounterPlan(run.stage).map(entry=>({...entry})),encountersTriggered:{...(run.encountersTriggered||{})},activeEncounters:activeStageEncounterCount(),encounterConcurrency:stageEncounterConcurrency(run.stage),worldEventPlan:stageWorldEventPlan(run.stage).map(entry=>({...entry})),worldEventsTriggered:{...(run.worldEventsTriggered||{})},spawnBudget:{...(run.lastSpawnBudget||{})},bossTier:Number(run.stage?.order)%6===0?'constellation':'stage'}:null;};

  window.updateStageBossSkill=function(enemy,dt){
    const def=stageDefinition(enemy?.eventKind);if(def?.production?.combat)def.production.combat(enemy,dt,apiFor(stageRuntime()));
  };
  const ENDLESS_FAMILY_CACHE={registrySize:-1,route:[],bloom:[],array:[]};
  function rebuildEndlessFamilyCache(){
    if(ENDLESS_FAMILY_CACHE.registrySize===registry.size)return ENDLESS_FAMILY_CACHE;
    ENDLESS_FAMILY_CACHE.registrySize=registry.size;ENDLESS_FAMILY_CACHE.route.length=0;ENDLESS_FAMILY_CACHE.bloom.length=0;ENDLESS_FAMILY_CACHE.array.length=0;
    const seen={route:new Set(),bloom:new Set(),array:new Set()};
    for(const[stageId,def]of registry){const order=Math.max(1,Number(window.stackfallStageById?.(stageId)?.order)||Number(String(stageId).slice(-2))||1),family=order<=6?'route':order<=12?'bloom':'array';for(const variant of Object.keys(def?.variants||{})){if(seen[family].has(variant))continue;seen[family].add(variant);ENDLESS_FAMILY_CACHE[family].push({stageId,variant,family});}}
    return ENDLESS_FAMILY_CACHE;
  }
  function endlessFamilySpawnRef(elapsed=state.time||0){
    const pools=rebuildEndlessFamilyCache(),families=elapsed>=420?['route','bloom','array']:elapsed>=240?['route','bloom']:elapsed>=75?['route']:[];
    if(!families.length)return null;const family=families[Math.floor(Math.random()*families.length)],pool=pools[family];return pool?.length?pool[Math.floor(Math.random()*pool.length)]:null;
  }
  function endlessFamilySpawnChance(elapsed=state.time||0){return elapsed<75?0:elapsed<240?.22:elapsed<420?.32:.42;}
  const baseSpawnEnemyForEndlessFamilies=spawnEnemy;
  spawnEnemy=function endlessFamilySpawn(kind='normal'){
    if(kind==='normal'&&window.stackfallIsEndlessRun?.()===true&&state.mode==='playing'&&!state.mapEventActive&&!state.bossActiveId&&!state.pendingApexForm&&!state.apexActiveId&&Math.random()<endlessFamilySpawnChance()){
      const ref=endlessFamilySpawnRef();if(ref){const enemy=spawnStageEnemy(ref.stageId,ref.variant);if(enemy){enemy.kind='normal';enemy.eventKind=null;enemy.endlessFamily=ref.family;return enemy;}}
    }
    return baseSpawnEnemyForEndlessFamilies(kind);
  };
  window.stackfallEndlessFamilyDiagnostics=()=>{const pools=rebuildEndlessFamilyCache();return{thresholds:{route:75,bloom:240,array:420},counts:{route:pools.route.length,bloom:pools.bloom.length,array:pools.array.length},unlockGated:false};};
  const baseSpawning=updateSpawning;updateSpawning=function stageAwareSpawning(dt){if(isStage()){updateStage(dt);return;}baseSpawning(dt);};
  const baseReset=resetGame;resetGame=function stageAwareReset(){const config=window.stackfallCurrentRunConfig?.();baseReset();clearStagePhysicalObjects();clearStageUi();state.stageBossArena=null;if(config?.mode!=='stage'){state.stageRun=null;return;}const stage=config.stage,def=stageDefinition(stage?.id);if(!stage||!def){state.stageRun=null;return;}state.stageRun={stage,eventsTriggered:{},worldEventsTriggered:{},encountersTriggered:{},encounterBags:{},bossSpawned:false,bossId:null,bossSnapshot:null,completed:false,completedAt:null,resultShown:false,lastSpawnBudget:null,lastWorldEvent:null};state.nextApexAt=Infinity;state.mapEventActive=null;state.entities.mapEvents.length=0;state.entities.enemies.length=0;clearEnemyProjectiles();state.realmTheme=def.theme||('stage-'+String(stage.order).padStart(2,'0'));state.spawnTimer=def.initialSpawnTimer??.7;for(const variant of def.startingVariants||[])spawnStageEnemy(stage.id,variant);showBossNotice(localized(stage.title),'STAGE '+String(stage.order).padStart(2,'0'));updateObjective(state.stageRun);def.onStart?.(apiFor(state.stageRun));};

  function resetStageBossStateForDeveloper(run){
    if(!run)return;
    run.bossSpawned=false;run.bossId=null;run.bossSnapshot=null;run.completed=false;run.completedAt=null;run.victoryStarted=false;run.resultShown=false;
    const bossEvent=run.stage?.fixedEvents?.find(event=>event.kind==='boss');
    if(bossEvent&&run.eventsTriggered)delete run.eventsTriggered[bossEvent.id];
    state.stageVictory=null;run.bossIntroPending=false;clearStagePhysicalObjects();
  }
  window.stackfallDevSpawnStageBossNow=function(stageId=null){
    const requested=window.stackfallStageById?.(stageId)||window.stackfallCurrentRunConfig?.()?.stage;
    if(!requested||!stageDefinition(requested.id))return{ok:false,reason:'stage-missing'};
    const current=window.stackfallCurrentRunConfig?.(),sameStage=current?.mode==='stage'&&current.stage?.id===requested.id&&state.stageRun?.stage?.id===requested.id&&!state.stageRun?.completed;
    if(!sameStage){state.runSelection={mode:'stage',stageId:requested.id};resetGame();}
    const run=stageRuntime();
    if(!run||run.stage?.id!==requested.id)return{ok:false,reason:'stage-runtime-missing'};
    clearPendingCombatActions();clearRunUiActions?.();window.closeMapEventOverlays?.();closeAbilityLedger?.(true);
    state.mapEventActive=null;if(Array.isArray(state.entities.mapEvents))state.entities.mapEvents.length=0;if(Array.isArray(state.rewardQueue))state.rewardQueue.length=0;
    for(const key of ['enemies','enemyProjectiles','projectiles','curves','wells','beams','particles','shockwaves','telegraphs','gems','texts','vacuumSeeds','phaseMines','guidedMissiles','gateNetworks']){
      const list=state.entities[key];if(Array.isArray(list))list.length=0;
    }
    state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;state.apexArena=null;state.stageBossArena=null;
    resetStageBossStateForDeveloper(run);
    // A boss preview cancels pending startup choices before their microtask runs.
    state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;if(ui.choiceCards)ui.choiceCards.innerHTML='';
    const bossAt=Math.max(0,Number(run.stage.boss?.spawnAt||run.stage.durationSeconds||60)),previewSeconds=5;
    run.devBossPreview=true;run.devBossPreviewStartedAt=bossAt-previewSeconds;
    run.eventsTriggered=run.eventsTriggered||{};
    for(const event of run.stage.fixedEvents||[])if(event.kind!=='boss'&&Number(event.at)<=bossAt)run.eventsTriggered[event.id]=true;
    run.worldEventsTriggered=run.worldEventsTriggered||{};for(let i=0;i<stageWorldEventPlan(run.stage).length;i++)run.worldEventsTriggered[i]=true;
    run.encountersTriggered=run.encountersTriggered||{};for(let i=0;i<stageEncounterPlan(run.stage).length;i++)run.encountersTriggered[i]=true;
    run.gimmickNextAt=Infinity;
    state.mode='playing';state.time=Math.max(0,bossAt-previewSeconds);state.spawnTimer=Infinity;
    ui.choice?.classList.add('hidden');ui.pauseScreen?.classList.add('hidden');ui.gameOver?.classList.add('hidden');document.querySelector('#worldEventScreen')?.classList.add('hidden');document.querySelector('#bossRewardScreen')?.classList.add('hidden');document.querySelector('#apexRewardScreen')?.classList.add('hidden');
    stageDefinition(requested.id)?.production?.environment?.(run,0);updateObjective(run);return{ok:true,stageId:requested.id,previewSeconds,bossAt,startAt:state.time};
  };
  completeMap?.addEventListener('click',()=>{completeScreen.classList.add('hidden');showMainMenu();window.openStackfallGalaxyMap?.();});completeMenu?.addEventListener('click',()=>{completeScreen.classList.add('hidden');showMainMenu();});

})();
