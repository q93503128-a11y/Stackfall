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
  function stageOneArena(run=stageRuntime()){
    if(!run||run.stage?.id!=='stage-01')return null;
    const compact=compactDevice(),halfW=compact?Math.max(138,Math.min(vw*.41,205)):Math.max(280,Math.min(vw*.34,470)),halfH=compact?Math.max(215,Math.min(vh*.34,310)):Math.max(210,Math.min(vh*.34,300));
    const existing=state.stageBossArena;if(existing?.stageId==='stage-01'){existing.halfW=halfW;existing.halfH=halfH;return existing;}
    return state.stageBossArena={stageId:'stage-01',x:player.x,y:player.y,halfW,halfH,phase:1,locked:true,createdAt:state.time||0};
  }
  function clampStageOnePlayer(){
    const arena=state.stageBossArena;if(!arena||arena.stageId!=='stage-01')return;
    const shrink=arena.phase>=2?24:0,margin=player.r+12,hw=Math.max(105,arena.halfW-shrink-margin),hh=Math.max(135,arena.halfH-shrink-margin);
    player.x=clamp(player.x,arena.x-hw,arena.x+hw);player.y=clamp(player.y,arena.y-hh,arena.y+hh);
  }
  window.stackfallClampStageBossToArena=function(enemy){
    const arena=state.stageBossArena;if(!enemy||enemy.eventKind!=='stage-01'||arena?.stageId!=='stage-01')return;
    const shrink=arena.phase>=2?24:0,hw=Math.max(110,arena.halfW-shrink-enemy.r*.62),hh=Math.max(120,arena.halfH-shrink-enemy.r*.62);
    enemy.x=clamp(enemy.x,arena.x-hw,arena.x+hw);enemy.y=clamp(enemy.y,arena.y-hh,arena.y+hh);
  };
  function spawnStageBoss(options={}){
    const run=stageRuntime(),def=stageDefinition();if(!run||!def||run.bossSpawned||state.mapEventActive||state.entities.mapEvents?.length||!makeEnemyRoom('boss'))return null;
    const profile=typeof def.bossProfile==='function'?def.bossProfile(run):def.bossProfile;if(!profile)return null;
    const cfg=enemyConfig('boss'),stage=run.stage,angle=profile.angle??-Math.PI/2,radius=Math.min(Math.max(vw,vh)*.50,profile.spawnRadius||660),arena=stage.id==='stage-01'?stageOneArena(run):null,e={
      id:state.nextId++,type:'boss',kind:'stage-boss',bossCategory:'apex',stageBossTier:Number(stage.order)%6===0?'constellation':'stage',variant:profile.form,eliteForm:profile.form,eventKind:stage.id,eventVariant:profile.eventVariant,name:localized(stage.boss?.name)||tr(profile.nameKey),
      x:arena?arena.x:player.x+Math.cos(angle)*radius,y:arena?arena.y-arena.halfH*.60:player.y+Math.sin(angle)*radius,r:profile.r,hp:cfg.hp*profile.hp,maxHp:0,speed:cfg.speed*profile.speed,damage:cfg.damage*profile.damage,color:profile.color,xp:cfg.xp*profile.xp,
      hit:0,dead:false,phase:Math.random()*TAU,skillCd:profile.skillCd,burstCd:profile.burstCd,pulseCd:profile.pulseCd,rangedCd:999,strafeDir:1,dash:0,dashX:0,dashY:0,stagePhase:1,controlImmune:true
    };
    if(e.stageBossTier==='constellation'){e.hp*=1.18;e.damage*=1.06;e.skillCd*=.92;e.burstCd*=.92;e.pulseCd*=.92;}e.maxHp=e.hp;
    if(stage.id==='stage-01'){e.stageOneAttackCd=1.7;e.contactSafeUntil=(state.time||0)+1.2;e.stageGateCoreOpen=false;stabilizeRealmTheme?.('stage-01-warden');}
    state.entities.enemies.push(e);state.bossActiveId=e.id;state.bossIndex++;run.bossSpawned=true;run.bossId=e.id;run.bossSnapshot={id:e.id,x:e.x,y:e.y,color:e.color,kind:'stage-boss'};
    if(!options.suppressNotice)showBossNotice(e.name,tr(profile.warningKey));audio.boss();shockwave(e.x,e.y,e.color,profile.spawnShockwave||195,.74,5);return e;
  }
  function beginStageOneBossIntro(event){
    const run=stageRuntime();if(!run||run.stage?.id!=='stage-01'||run.bossSpawned||run.bossIntroPending)return false;
    run.bossIntroPending=true;if(event?.id)run.eventsTriggered[event.id]=true;clearPendingCombatActions();clearRunUiActions?.();window.closeMapEventOverlays?.();state.mapEventActive=null;if(Array.isArray(state.entities.mapEvents))state.entities.mapEvents.length=0;
    for(const enemy of state.entities.enemies||[]){if(!enemy?.dead){enemy.dead=true;spawnParticle(enemy.x,enemy.y,enemy.color||'#8395d8',enemy.type==='boss'||enemy.type==='mini'?10:3,130,3);}}
    compactInPlace(state.entities.enemies,e=>e&&!e.dead);for(const key of['enemyProjectiles','telegraphs','beams','wells'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;
    const arena=stageOneArena(run);arena.x=player.x;arena.y=player.y;arena.phase=1;arena.locked=true;state.camera.shake=Math.max(state.camera.shake,8);state.flash=Math.max(state.flash,.08);
    audio.tone?.(76,.42,'sawtooth',.030,46);audio.tone?.(52,.65,'triangle',.020,-8);
    startRealmTransition('stage-01-warden',{duration:3.05,owner:'stage-01-boss-entry',title:localized(run.stage.boss?.name)||'붕괴의 전초 수호자',subtitle:GAME_SETTINGS.language==='ko'?'항로 봉쇄 프로토콜 가동':'ROUTE LOCKDOWN PROTOCOL',onMidpoint:()=>{
      const current=stageRuntime();if(!current||current!==run)return;const boss=spawnStageBoss({suppressNotice:true});if(boss){boss.x=arena.x;boss.y=arena.y-arena.halfH*.60;boss.contactSafeUntil=(state.time||0)+1.35;shockwave(boss.x,boss.y,'#e9eeff',245,.78,6);spawnParticle(boss.x,boss.y,'#aeb9ff',28,220,5);audio.tone?.(94,.50,'sawtooth',.036,-30);}
    },onComplete:()=>{if(stageRuntime()===run){run.bossIntroPending=false;stabilizeRealmTheme?.('stage-01-warden');if(!run.bossSpawned)spawnStageBoss();}}});
    return true;
  }
  function triggerStageEvent(event){
    const run=stageRuntime(),def=stageDefinition();if(!run||!def||run.eventsTriggered[event.id])return;const api=apiFor(run);
    if(event.kind==='boss'){if(run.stage.id==='stage-01'){beginStageOneBossIntro(event);return;}if(spawnStageBoss())run.eventsTriggered[event.id]=true;return;}
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
    const gimmick=run.stage.gimmick;if(!gimmick||run.bossSpawned)return;
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
    const run=stageRuntime(),def=stageDefinition();if(!run||!def||run.completed)return;updateObjective(run);
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
    if(!run.bossSpawned&&state.time>=run.stage.boss.spawnAt){if(run.stage.id==='stage-01')beginStageOneBossIntro(run.stage.fixedEvents.find(event=>event.kind==='boss'));else spawnStageBoss();}
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
    const run=stageRuntime();if(!run||run.completed||!enemy)return;run.completed=true;run.completedAt=state.time;run.victoryStarted=true;state.stageVictory={stageId:run.stage?.id||null,x:enemy.x,y:enemy.y,color:enemy.color||'#aeb9ff',elapsed:0,duration:VICTORY_DURATION,pulseA:false,pulseB:false};if(state.stageBossArena?.stageId===run.stage?.id)state.stageBossArena.locked=false;state.mode='stageVictory';state.pendingActions.length=0;clearRunUiActions?.();state.bossActiveId=null;ui.bossBar.classList.add('hidden');objective?.classList.add('hidden');state.entities.enemyProjectiles.length=0;state.entities.telegraphs.length=0;state.entities.beams.length=0;for(const key of['vacuumSeeds','phaseMines','guidedMissiles','gateNetworks'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;
    for(const other of state.entities.enemies){if(other!==enemy&&!other.dead){other.dead=true;spawnParticle(other.x,other.y,other.color||'#9aa7ff',4,120,3);}}state.camera.shake=Math.max(state.camera.shake,24);state.flash=Math.max(state.flash,.34);shockwave(enemy.x,enemy.y,'#eef2ff',220,.90,8);spawnParticle(enemy.x,enemy.y,'#ffffff',54,410,9);spawnParticle(enemy.x,enemy.y,enemy.color||'#9aa7ff',42,300,7);
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
  window.updateStageVictoryCinematic=function(dt){const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;v.elapsed+=dt;if(!v.pulseA&&v.elapsed>=.48){v.pulseA=true;shockwave(v.x,v.y,'#9aa7ff',340,.85,7);spawnParticle(v.x,v.y,'#b7c5ff',24,260,6);state.camera.shake=Math.max(state.camera.shake,18);state.flash=Math.max(state.flash,.22);}if(!v.pulseB&&v.elapsed>=1.18){v.pulseB=true;shockwave(v.x,v.y,'#ffffff',470,1.05,5);state.camera.shake=Math.max(state.camera.shake,11);state.flash=Math.max(state.flash,.16);}if(v.elapsed>=v.duration)finalizeStageComplete();};
  window.drawStageVictoryCinematic=function(){const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;const p=worldToScreen(v.x,v.y),progress=clamp(v.elapsed/v.duration,0,1),burst=clamp(v.elapsed/.85,0,1),fade=1-clamp((v.elapsed-2.25)/.60,0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(p.x,p.y);for(let i=0;i<14;i++){const a=i/14*TAU+v.elapsed*.34,inner=24+burst*25,outer=58+burst*(125+(i%4)*16);ctx.globalAlpha=(.62-progress*.30)*fade;ctx.strokeStyle=i%3===0?'#ffffff':i%2?'#91a6ff':'#c0a8ff';ctx.lineWidth=1.2+(i%3)*.8;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}ctx.globalAlpha=Math.max(0,.9-progress*.45)*fade;const glow=ctx.createRadialGradient(0,0,0,0,0,120+burst*90);glow.addColorStop(0,'rgba(255,255,255,.95)');glow.addColorStop(.12,'rgba(190,210,255,.78)');glow.addColorStop(.42,'rgba(121,132,255,.22)');glow.addColorStop(1,'rgba(92,65,180,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,120+burst*90,0,TAU);ctx.fill();ctx.restore();ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';const reveal=clamp((v.elapsed-.70)/.50,0,1)*fade;ctx.globalAlpha=reveal;ctx.shadowBlur=28;ctx.shadowColor='#9aa7ff';ctx.fillStyle='#f4f7ff';ctx.font=`900 ${Math.round(clamp(vw*.04,28,54))}px "Black Han Sans",sans-serif`;ctx.fillText(v.elapsed<1.55?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw/2,vh*.27);ctx.restore();};
  window.stackfallRegisterStageRuntime=registerStageRuntime;window.stackfallStageRuntimeRegistry=registry;window.stackfallSpawnStageEnemy=spawnStageEnemy;window.stackfallSpawnStageBurst=spawnStageBurst;window.stackfallBeginStageVictory=beginStageVictory;window.stackfallStageBalanceDiagnostics=()=>{const run=stageRuntime();return run?{stageId:run.stage?.id,family:environmentFamily(run.stage),encounterPlan:stageEncounterPlan(run.stage).map(entry=>({...entry})),encountersTriggered:{...(run.encountersTriggered||{})},activeEncounters:activeStageEncounterCount(),encounterConcurrency:stageEncounterConcurrency(run.stage),worldEventPlan:stageWorldEventPlan(run.stage).map(entry=>({...entry})),worldEventsTriggered:{...(run.worldEventsTriggered||{})},spawnBudget:{...(run.lastSpawnBudget||{})},bossTier:Number(run.stage?.order)%6===0?'constellation':'stage'}:null;};

  function stageBossSignatureAlive(e,api){return!!(e&&!e.dead&&e.kind==='stage-boss'&&api?.isActive?.());}
  function stageBossSigLine(x1,y1,x2,y2,width,damage,color,life=.92){rawLine(x1,y1,x2,y2,width,damage,color,life,'boss-line');}
  function stageBossLineHit(x1,y1,x2,y2,width,damage){
    if(player.invuln>0)return false;
    const dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy;if(len2<=.001)return false;
    const t=clamp(((player.x-x1)*dx+(player.y-y1)*dy)/len2,0,1),px=x1+dx*t,py=y1+dy*t;
    if(Math.hypot(player.x-px,player.y-py)>Math.max(4,width*.5)+player.r)return false;
    hurtPlayer(Math.max(1,damage),'stage-apex-technique');return true;
  }
  function stageBossActualBeam(x1,y1,x2,y2,width,damage,color,style='blaster',bend=0){
    if(state.entities.beams.length>=entityCap('beams'))state.entities.beams.shift();
    state.entities.beams.push({x1,y1,x2,y2,life:.30,max:.30,color,width:Math.max(4,width),stageBossAttack:style,bend});
    if(damage>0)stageBossLineHit(x1,y1,x2,y2,width,damage);shockwave(x1,y1,color,34+width*.9,.28,2.4);
  }
  function stageBossVisibleTravel(e,x,y,duration=.68,maxSpeed=920){
    const dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy)||1,time=Math.max(.28,duration),speed=Math.min(maxSpeed,d/time);e.dash=time;e.dashX=dx/d*speed;e.dashY=dy/d*speed;e.contactSafeUntil=Math.max(e.contactSafeUntil||0,(state.time||0)+.16);shockwave(e.x,e.y,e.color||'#cbd5ff',72,.26,2.2);return true;
  }
  function stageOneLater(e,api,ms,fn){scheduleWeaponAction(ms,()=>{if(stageBossSignatureAlive(e,api))fn();});}
  function stageOneDebrisTelegraph(x,y,r,damage,color,life){
    if(state.entities.telegraphs.length>=entityCap('telegraphs'))state.entities.telegraphs.shift();state.entities.telegraphs.push({type:'circle',x,y,r,life,max:life,damage,color,impactStyle:'stage1-debris',phase:Math.random()*TAU});
  }
  function stageOneDebrisSalvo(e,api,phase,cycle,damage,pred,later=(ms,fn)=>stageOneLater(e,api,ms,fn)){
    const arena=stageOneArena(api.run),shots=phase>=2?5:4,spread=Math.min(210,arena?.halfW*.62||190),baseX=clamp(pred.x,arena.x-spread,arena.x+spread);
    for(let i=0;i<shots;i++){const offset=(i-(shots-1)/2)*(phase>=2?58:66),tx=clamp(baseX+offset,arena.x-arena.halfW+48,arena.x+arena.halfW-48),ty=clamp(pred.y+(i%2?42:-30),arena.y-arena.halfH+54,arena.y+arena.halfH-54),r=32+(i%2)*5;
      stageOneDebrisTelegraph(tx,ty,r,damage*(.66+(i%2)*.08),i%2?'#8395d8':'#c2cbef',.74+i*.08);
    }
    e.stageDebrisVolleyAt=state.time||0;audio.tone?.(142,.12,'square',.012,-32);
  }
  function stageOneShutterClamp(e,api,phase,cycle,damage,pred,later=(ms,fn)=>stageOneLater(e,api,ms,fn)){
    const arena=stageOneArena(api.run),lanes=phase>=2?5:4,safe=Math.abs(cycle+phase)%lanes,usable=arena.halfH*1.46,spacing=usable/Math.max(1,lanes-1);
    for(let lane=0;lane<lanes;lane++){if(lane===safe)continue;const y=arena.y-usable*.5+lane*spacing,x1=arena.x-arena.halfW+18,x2=arena.x+arena.halfW-18;rawLine(x1,y,x2,y,Math.max(10,spacing*.28),0,'#ffcf70',.82+lane*.035,'boss-charge');later(790+lane*55,()=>stageBossActualBeam(x1,y,x2,y,Math.max(20,spacing*.34),damage*.70,'#aeb9ff','shutter'));}
    showBossNotice(GAME_SETTINGS.language==='ko'?'격벽 폐쇄':'BULKHEAD CLOSURE',GAME_SETTINGS.language==='ko'?'안전 통로 확보':'FIND THE OPEN LANE');
  }
  function stageOneBreachRam(e,api,phase,cycle,damage,pred,later=(ms,fn)=>stageOneLater(e,api,ms,fn)){
    const arena=stageOneArena(api.run),tx=clamp(pred.x,arena.x-arena.halfW+54,arena.x+arena.halfW-54),ty=clamp(pred.y,arena.y-arena.halfH+54,arena.y+arena.halfH-54),aim=Math.atan2(ty-e.y,tx-e.x),length=Math.min(760,Math.hypot(arena.halfW*2,arena.halfH*2)),width=e.r*1.42;
    rawLine(e.x,e.y,e.x+Math.cos(aim)*length,e.y+Math.sin(aim)*length,width,0,'#ffcf70',1.02,'boss-charge');e.stageRamWindupUntil=(state.time||0)+1.02;e.stageRamAngle=aim;e.contactSafeUntil=Math.max(e.contactSafeUntil||0,(state.time||0)+.82);
    later(980,()=>{const liveAim=Math.atan2(ty-e.y,tx-e.x);e.stageRamAngle=liveAim;e.stageRamUntil=(state.time||0)+.72;e.dash=.72;e.dashX=Math.cos(liveAim)*(610+phase*65);e.dashY=Math.sin(liveAim)*(610+phase*65);e.contactSafeUntil=state.time||0;shockwave(e.x,e.y,'#ffcf70',92,.32,4);spawnParticle(e.x,e.y,'#d7ddf5',12,190,4);audio.tone?.(70,.30,'sawtooth',.030,80);});
  }
  const STAGE_APEX_UNIQUE_TECHNIQUES=Object.freeze({
    'stage-01':(e,api,phase,cycle,d,pred,later)=>stageOneShutterClamp(e,api,phase,cycle,d,pred,later),
    'stage-02':(e,api,phase,cycle,d,pred,later)=>{
      addCircle(e.x,e.y,118+phase*18,0,'#ff91dc',.58);later(580,()=>{const dx=e.x-player.x,dy=e.y-player.y,dist=Math.hypot(dx,dy)||1;if(dist<560){player.x+=dx/dist*(48+phase*13);player.y+=dy/dist*(48+phase*13);}shockwave(e.x,e.y,'#ffc0eb',210+phase*28,.42,4);const lobes=5+phase;for(let i=0;i<lobes;i++){const a=i*TAU/lobes+cycle*.19,x=e.x+Math.cos(a)*(112+phase*9),y=e.y+Math.sin(a)*(112+phase*9),aim=Math.atan2(player.y-y,player.x-x);spawnEnemyProjectile(x,y,aim,220+phase*18,d*.52,i%2?'#ffc0eb':'#8cecff',5,4.8,'seed-shell');}addCircle(player.x,player.y,62+phase*7,d*.92,'#ff75cb',.48);});
    },
    'stage-03':(e,api,phase,cycle,d,pred,later)=>{
      const rr=235+phase*18,pts=Array.from({length:3},(_,i)=>{const a=-Math.PI/2+i*TAU/3+cycle*.18;return{x:pred.x+Math.cos(a)*rr,y:pred.y+Math.sin(a)*rr};});
      for(let i=0;i<3;i++){const p=pts[i],q=pts[(i+1)%3];rawLine(p.x,p.y,q.x,q.y,7,0,i===1?'#a8f4ff':'#dfb2ff',.70+i*.08,'boss-charge');}
      later(720,()=>{for(let i=0;i<3;i++){const p=pts[i],q=pts[(i+1)%3];stageBossActualBeam(p.x,p.y,q.x,q.y,14+phase*2,d*.62,i===1?'#a8f4ff':'#dfb2ff','prism');const aim=Math.atan2(player.y-p.y,player.x-p.x);spawnEnemyProjectile(p.x,p.y,aim,255+phase*18,d*.52,'#ffffff',4.4,4.4,'needle');}});
    },
    'stage-04':(e,api,phase,cycle,d,pred,later)=>{
      const now={x:player.x,y:player.y},past=e.stageTimeEcho||now;e.stageTimeEcho=now;addCircle(past.x,past.y,54+phase*5,d*.72,'#8fffe0',.82);addCircle(now.x,now.y,42+phase*4,d*.84,'#a4bfff',.62);
      later(520,()=>{const hands=4+phase;for(let i=0;i<hands;i++){const a=i*TAU/hands+cycle*.31;stageBossActualBeam(e.x,e.y,e.x+Math.cos(a)*620,e.y+Math.sin(a)*620,15+phase,d*.56,i%2?'#8fffe0':'#a4bfff','clock');}});
    },
    'stage-05':(e,api,phase,cycle,d,pred,later)=>{
      const aim=Math.atan2(pred.y-e.y,pred.x-e.x),nx=-Math.sin(aim),ny=Math.cos(aim),sep=165+phase*18,left={x:pred.x+nx*sep,y:pred.y+ny*sep},right={x:pred.x-nx*sep,y:pred.y-ny*sep};
      addCircle(left.x,left.y,36,0,'#79f7ff',.62);addCircle(right.x,right.y,36,0,'#b9a8ff',.62);rawLine(left.x,left.y,right.x,right.y,9,0,'#e9ffff',.72,'boss-charge');
      later(650,()=>{stageBossActualBeam(left.x,left.y,right.x,right.y,22+phase*2,d*.78,'#e9ffff','polarity');const side=cycle%2?1:-1;player.x+=nx*side*(52+phase*16);player.y+=ny*side*(52+phase*16);for(const p of[left,right]){const a=Math.atan2(player.y-p.y,player.x-p.x);spawnEnemyProjectile(p.x,p.y,a,245,d*.48,p===left?'#79f7ff':'#b9a8ff',5,4.8,'storm');}});
    },
    'stage-06':(e,api,phase,cycle,d,pred,later)=>{
      e.stageFinaleMode='route-convergence';const center={x:(e.x+pred.x)*.5,y:(e.y+pred.y)*.5},arms=6;
      for(let step=0;step<2+Math.floor(phase/2);step++)later(step*270,()=>{for(let i=0;i<arms;i++){const a=i*TAU/arms+cycle*.19+step*.22,x1=center.x+Math.cos(a)*390,y1=center.y+Math.sin(a)*390,x2=center.x-Math.cos(a)*390,y2=center.y-Math.sin(a)*390;stageBossActualBeam(x1,y1,x2,y2,15+phase*2,d*.54,i%3===0?'#ffcf8a':i%2?'#8af6ff':'#c7a7ff','convergence');}});
      later(720,()=>{api.spawnBurst(cycle%2?'conduit-leech':'phase-drifter',1+phase);addCircle(player.x,player.y,58+phase*8,d*.86,'#ffffff',.44);});
    },
    'stage-07':(e,api,phase,cycle,d,pred,later)=>{
      let prey=null,best=Infinity;for(const m of state.entities.enemies){if(m===e||m.dead||m.type==='boss'||m.type==='mini')continue;const dd=(m.x-e.x)**2+(m.y-e.y)**2;if(dd<best){best=dd;prey=m;}}
      if(prey){rawLine(e.x,e.y,prey.x,prey.y,7,0,'#79dfc8',.62,'boss-root');later(620,()=>{if(prey.dead)return;const tx=prey.x,ty=prey.y;prey.dead=true;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*(.025+phase*.008));stageBossVisibleTravel(e,tx,ty,.66,900);shockwave(tx,ty,'#bd79ff',105,.38,3.5);});}
      for(let i=0;i<3+phase;i++){const a=i/(3+phase)*TAU+cycle*.23,x=pred.x+Math.cos(a)*(105+phase*14),y=pred.y+Math.sin(a)*(105+phase*14);addCircle(x,y,38+phase*3,d*.62,i%2?'#bd79ff':'#79dfc8',.72+i*.06);}
      later(540,()=>{const aim=Math.atan2(player.y-e.y,player.x-e.x);for(let seed=-1;seed<=1;seed++)spawnEnemyProjectile(e.x,e.y,aim+seed*.09,238+phase*14,d*.48,seed?'#79dfc8':'#f1d9ff',5.2,4.8,'seed-shell');addCircle(player.x,player.y,46+phase*5,d*.74,'#bd79ff',.44);});
    },
    'stage-08':(e,api,phase,cycle,d,pred,later)=>{
      const roots=3+Math.floor(phase/2);for(let root=0;root<roots;root++){const side=root-(roots-1)/2,base=Math.atan2(pred.y-e.y,pred.x-e.x)+side*.30,pts=[{x:e.x,y:e.y}];for(let k=1;k<=4;k++){const dist=105*k,curve=Math.sin(k*1.7+cycle)*42*(side||1);pts.push({x:e.x+Math.cos(base)*dist-Math.sin(base)*curve,y:e.y+Math.sin(base)*dist+Math.cos(base)*curve});}for(let k=0;k<pts.length-1;k++)rawLine(pts[k].x,pts[k].y,pts[k+1].x,pts[k+1].y,9,0,'#ff7fa8',.62,'boss-root');later(620+root*70,()=>{for(let k=0;k<pts.length-1;k++)stageBossActualBeam(pts[k].x,pts[k].y,pts[k+1].x,pts[k+1].y,16+phase,d*.48,'#ff9fbd','tentacle',side||1);});}
    },
    'stage-09':(e,api,phase,cycle,d,pred,later)=>{
      const waves=5+phase;for(let wave=0;wave<waves;wave++)later(wave*95,()=>{const r=34+wave*23,spin=cycle*.35+wave*.48;for(const side of[-1,1]){const a=spin+side*.92*wave,x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r,aim=Math.atan2(pred.y-y,pred.x-x);spawnEnemyProjectile(x,y,aim+side*.18,205+wave*9,d*.46,side>0?'#79dcc6':'#d59cff',4.5,5,'spiral');}});
    },
    'stage-10':(e,api,phase,cycle,d,pred,later)=>{
      const mirror={x:2*player.x-e.x,y:2*player.y-e.y},now={x:player.x,y:player.y};addCircle(mirror.x,mirror.y,44,0,'#f4b3ff',.58);rawLine(e.x,e.y,now.x,now.y,7,0,'#8ee6d6',.58,'boss-mirror');rawLine(mirror.x,mirror.y,now.x,now.y,7,0,'#f4b3ff',.72,'boss-mirror');
      later(600,()=>{stageBossActualBeam(e.x,e.y,player.x,player.y,18+phase*2,d*.62,'#8ee6d6','mirror');stageBossActualBeam(mirror.x,mirror.y,player.x,player.y,18+phase*2,d*.62,'#f4b3ff','mirror');for(let i=-2;i<=2;i++){const a=Math.atan2(player.y-mirror.y,player.x-mirror.x)+i*.15;spawnEnemyProjectile(mirror.x,mirror.y,a,230+phase*14,d*.38,'#efd5ff',4.5,4.8,'mirror');}});
    },
    'stage-11':(e,api,phase,cycle,d,pred,later)=>{
      for(let step=0;step<3;step++)later(step*220,()=>{const half=225-step*(52+phase*5),color=step===2?'#fff0cf':'#e4b36c';stageBossSigLine(pred.x-half,pred.y-half,pred.x+half,pred.y-half,15+phase,d*.54,color,.54);stageBossSigLine(pred.x+half,pred.y-half,pred.x+half,pred.y+half,15+phase,d*.54,color,.54);stageBossSigLine(pred.x+half,pred.y+half,pred.x-half,pred.y+half,15+phase,d*.54,color,.54);stageBossSigLine(pred.x-half,pred.y+half,pred.x-half,pred.y-half,15+phase,d*.54,color,.54);});
      later(700,()=>{for(let i=0;i<4;i++){const a=i*TAU/4+Math.PI/4,x=pred.x+Math.cos(a)*170,y=pred.y+Math.sin(a)*170,aim=Math.atan2(player.y-y,player.x-x);for(let j=-1;j<=1;j++)spawnEnemyProjectile(x,y,aim+j*.13,220,d*.42,'#f2cf8e',5,5,'seed-shell');}});
    },
    'stage-12':(e,api,phase,cycle,d,pred,later)=>{
      e.stageShellOpen=phase>=2;const petals=8+phase*2,outer=245+phase*18;for(let i=0;i<petals;i++){const a=i/petals*TAU+cycle*.17,x=pred.x+Math.cos(a)*outer,y=pred.y+Math.sin(a)*outer;rawLine(x,y,pred.x+Math.cos(a)*58,pred.y+Math.sin(a)*58,10,0,i%3===0?'#f39aba':i%3===1?'#ca98ff':'#79d6c1',.72,'boss-bloom');}
      later(720,()=>{for(let i=0;i<petals;i++){const a=i/petals*TAU+cycle*.17,x=pred.x+Math.cos(a)*outer,y=pred.y+Math.sin(a)*outer;stageBossActualBeam(x,y,pred.x+Math.cos(a)*58,pred.y+Math.sin(a)*58,14+phase,d*.38,i%3===0?'#f39aba':i%3===1?'#ca98ff':'#79d6c1','bloom');}addCircle(player.x,player.y,66+phase*9,d*.84,'#f0dcff',.46);if(phase>=3)api.spawnBurst('husk-warden',2);});
    },
    'stage-13':(e,api,phase,cycle,d,pred,later)=>{
      const horizontal=cycle%2===0,lanes=6+phase,spacing=74;for(let lane=0;lane<lanes;lane++)later(lane*90,()=>{const off=(lane-(lanes-1)/2)*spacing;if(horizontal)stageBossSigLine(player.x-480,player.y+off,player.x+480,player.y+off,16+phase,d*.58,lane%2?'#6fe8f3':'#9a8cff',.55);else stageBossSigLine(player.x+off,player.y-480,player.x+off,player.y+480,16+phase,d*.58,lane%2?'#6fe8f3':'#9a8cff',.55);});
    },
    'stage-14':(e,api,phase,cycle,d,pred,later)=>{
      const spacing=112,safeA=(cycle+phase)%9,safeB=(safeA+4)%9;for(let cell=0;cell<9;cell++){if(cell===safeA||cell===safeB)continue;const col=cell%3,row=Math.floor(cell/3),x=pred.x+(col-1)*spacing,y=pred.y+(row-1)*spacing;addCircle(x,y,46+phase*3,d*.58,cell%2?'#ef8de1':'#71e6f1',.64+(cell%3)*.06);}later(720,()=>{const a=Math.atan2(player.y-e.y,player.x-e.x);for(let i=-2;i<=2;i++)spawnEnemyProjectile(e.x,e.y,a+i*.13,250+phase*15,d*.45,'#ffd8f7',4.5,4.5,'rune');});
    },
    'stage-15':(e,api,phase,cycle,d,pred,later)=>{
      const channels=3+phase;for(let channel=0;channel<channels;channel++){const a=channel/channels*TAU+cycle*.23,origin={x:pred.x+Math.cos(a)*410,y:pred.y+Math.sin(a)*410};addCircle(origin.x,origin.y,26,0,channel%2?'#c39cff':'#70e8ef',.48+channel*.06);later(500+channel*90,()=>{const target={x:player.x,y:player.y};stageBossActualBeam(origin.x,origin.y,target.x,target.y,15+phase,d*.52,channel%2?'#c39cff':'#70e8ef','multiplex');});}
    },
    'stage-16':(e,api,phase,cycle,d,pred,later)=>{
      const aim=Math.atan2(player.y-e.y,player.x-e.x),steps=5+phase;for(let step=0;step<steps;step++){const a=aim-.72+step*(1.44/(steps-1));rawLine(e.x,e.y,e.x+Math.cos(a)*650,e.y+Math.sin(a)*650,6,0,'#70dce4',.42+step*.07,'boss-scan');later(440+step*75,()=>stageBossActualBeam(e.x,e.y,e.x+Math.cos(a)*650,e.y+Math.sin(a)*650,17+phase,d*.52,'#70dce4','beacon'));}later(760,()=>addCircle(player.x,player.y,54+phase*6,d*.72,'#d9f8ff',.44));
    },
    'stage-17':(e,api,phase,cycle,d,pred,later)=>{
      for(let step=0;step<3;step++)later(step*240,()=>{const half=255-step*58;stageBossSigLine(pred.x-half,pred.y-half,pred.x+half,pred.y-half,18+phase,d*.50,'#e4bd72',.60);stageBossSigLine(pred.x+half,pred.y-half,pred.x+half,pred.y+half,18+phase,d*.50,'#e4bd72',.60);stageBossSigLine(pred.x+half,pred.y+half,pred.x-half,pred.y+half,18+phase,d*.50,'#73ded0',.60);stageBossSigLine(pred.x-half,pred.y+half,pred.x-half,pred.y-half,18+phase,d*.50,'#73ded0',.60);});
      later(680,()=>{for(let gate=0;gate<4;gate++){const a=gate*TAU/4,x=pred.x+Math.cos(a)*235,y=pred.y+Math.sin(a)*235,aim=Math.atan2(player.y-y,player.x-x);spawnEnemyProjectile(x,y,aim,205+phase*20,d*.54,gate%2?'#73ded0':'#e4bd72',9,5,'saw');}});
    },
    'stage-18':(e,api,phase,cycle,d,pred,later)=>{
      e.stageCoreExposed=phase>=2;const center=e.stageRewriteCenter||{x:pred.x,y:pred.y};e.stageRewriteCenter={x:lerp(center.x,pred.x+(cycle%2?90:-90),.65),y:lerp(center.y,pred.y+(cycle%3-1)*70,.65)};const c=e.stageRewriteCenter,sides=phase>=3?8:6,radius=300-phase*18,pts=Array.from({length:sides},(_,i)=>({x:c.x+Math.cos(i*TAU/sides-Math.PI/2)*radius,y:c.y+Math.sin(i*TAU/sides-Math.PI/2)*radius}));
      for(let i=0;i<sides;i++){const a=pts[i],b=pts[(i+1)%sides];rawLine(a.x,a.y,b.x,b.y,9,0,i%3===0?'#e6c276':i%3===1?'#70e7ef':'#c79cff',.72,'boss-rewrite');}
      later(720,()=>{for(let i=0;i<sides;i++){const a=pts[i],b=pts[(i+1)%sides];stageBossActualBeam(a.x,a.y,b.x,b.y,14+phase,d*.34,i%3===0?'#e6c276':i%3===1?'#70e7ef':'#c79cff','mainframe');}const dx=c.x-player.x,dy=c.y-player.y;player.x+=dx*.22;player.y+=dy*.22;stageBossActualBeam(c.x-radius,c.y,c.x+radius,c.y,18+phase,d*.58,'#70e7ef','mainframe');stageBossActualBeam(c.x,c.y-radius,c.x,c.y+radius,18+phase,d*.58,'#c79cff','mainframe');if(phase>=3)api.spawnBurst(cycle%2?'cipher-warden':'packet-lancer',2+phase);});
    }
  });
  function stageBossSignature(e,api){
    const id=e.eventKind,phase=Math.max(1,Math.min(3,Number(e.stagePhase)||1)),damage=Math.max(5,e.damage*.40),cycle=(e.stageSignatureCycle=(e.stageSignatureCycle||0)+1),pred=typeof predictedPlayer==='function'?predictedPlayer(135+phase*28):{x:player.x,y:player.y};
    const later=(ms,fn)=>scheduleWeaponAction(ms,()=>{if(stageBossSignatureAlive(e,api))fn();});
    if(id==='stage-01'){
      stageOneDebrisSalvo(e,api,phase,cycle,damage,pred,later);
    }else if(id==='stage-02'){
      for(let ring=0;ring<3+phase;ring++)later(ring*165,()=>addCircle(pred.x,pred.y,68+ring*62,damage*(.58+ring*.06),'#ff91dc',.92+ring*.06));
      later(310,()=>{const lobes=4+phase;for(let i=0;i<lobes;i++){const a=i*TAU/lobes+e.phase*.08,x=e.x+Math.cos(a)*(105+phase*8),y=e.y+Math.sin(a)*(105+phase*8),aim=Math.atan2(pred.y-y,pred.x-x);spawnEnemyProjectile(x,y,aim,205+phase*16,damage*.58,i%2?'#ffc0eb':'#8cecff',5,4.8,'seed-shell');}});
    }else if(id==='stage-03'){
      const r=185+phase*18,pts=Array.from({length:3},(_,i)=>({x:pred.x+Math.cos(-Math.PI/2+i*TAU/3)*r,y:pred.y+Math.sin(-Math.PI/2+i*TAU/3)*r}));
      for(let i=0;i<3;i++){const a=pts[i],b=pts[(i+1)%3];stageBossSigLine(a.x,a.y,b.x,b.y,18+phase*2,damage*.78,i===1?'#a8f4ff':'#dfb2ff',1.08);}
      later(650,()=>{for(const p of pts){const a=Math.atan2(pred.y-p.y,pred.x-p.x);for(let j=-1;j<=1;j++)spawnEnemyProjectile(p.x,p.y,a+j*.13,235+phase*18,damage*.55,'#e8d5ff',4.8,5,'needle');}});
    }else if(id==='stage-04'){
      const hands=3+phase,base=e.phase*.08;for(let step=0;step<3;step++)later(step*250,()=>{for(let i=0;i<hands;i++){const a=base+i*TAU/hands+step*.24,dx=Math.cos(a),dy=Math.sin(a);stageBossSigLine(pred.x-dx*40,pred.y-dy*40,pred.x+dx*(360+phase*35),pred.y+dy*(360+phase*35),17+phase*2,damage*.72,step%2?'#a4bfff':'#8fffe0',.78);}});
    }else if(id==='stage-05'){
      const a=Math.atan2(player.y-e.y,player.x-e.x),nx=-Math.sin(a),ny=Math.cos(a),sep=175+phase*20,p1={x:pred.x+nx*sep,y:pred.y+ny*sep},p2={x:pred.x-nx*sep,y:pred.y-ny*sep};
      addCircle(p1.x,p1.y,58+phase*7,damage*.72,'#79f7ff',1.0);addCircle(p2.x,p2.y,58+phase*7,damage*.72,'#b9a8ff',1.0);stageBossSigLine(p1.x,p1.y,p2.x,p2.y,20+phase*2,damage*.88,'#e9ffff',1.12);
      later(540,()=>{for(const p of[p1,p2]){const aim=Math.atan2(pred.y-p.y,pred.x-p.x);for(let j=-2;j<=2;j++)spawnEnemyProjectile(p.x,p.y,aim+j*.12,225+phase*20,damage*.53,p===p1?'#79f7ff':'#b9a8ff',4.8,5,'storm');}});
    }else if(id==='stage-06'){
      const arms=5+phase,rr=330+phase*25;for(let i=0;i<arms;i++){const a=i*TAU/arms+e.phase*.05,ox=pred.x+Math.cos(a)*rr,oy=pred.y+Math.sin(a)*rr;stageBossSigLine(ox,oy,pred.x+Math.cos(a)*70,pred.y+Math.sin(a)*70,21+phase*2,damage*.84,i%3===0?'#ffcf8a':i%2?'#8af6ff':'#c7a7ff',1.06);}
      later(620,()=>{addCircle(pred.x,pred.y,92+phase*12,damage*1.05,'#ffffff',.72);api.spawnBurst(phase===3?'conduit-leech':'glass-wing',phase+1);});
    }else if(id==='stage-07'){
      const petals=6+phase,rr=150+phase*12;for(let i=0;i<petals;i++){const a=i*TAU/petals+e.phase*.04,x=pred.x+Math.cos(a)*rr,y=pred.y+Math.sin(a)*rr;addCircle(x,y,50+phase*4,damage*.70,i%2?'#bd79ff':'#79dfc8',.92+i*.025);}
      later(520,()=>{for(let i=0;i<petals;i++){const a=i*TAU/petals+e.phase*.04,x=pred.x+Math.cos(a)*rr,y=pred.y+Math.sin(a)*rr,aim=Math.atan2(pred.y-y,pred.x-x);spawnEnemyProjectile(x,y,aim,205+phase*18,damage*.62,'#dfbdff',5,5,'void');}});
    }else if(id==='stage-08'){
      const base=Math.atan2(player.y-e.y,player.x-e.x),dx=Math.cos(base),dy=Math.sin(base),nx=-dy,ny=dx,rails=4+phase;for(let i=0;i<rails;i++){const off=(i-(rails-1)/2)*66,x1=pred.x-dx*390+nx*off,y1=pred.y-dy*390+ny*off,x2=pred.x+dx*390+nx*off,y2=pred.y+dy*390+ny*off;stageBossSigLine(x1,y1,x2,y2,19+phase*2,damage*.78,i%2?'#ff7fa8':'#83d7c0',.98);}
      later(500,()=>{const cross=base+Math.PI/2,cdx=Math.cos(cross),cdy=Math.sin(cross);for(const off of[-115,0,115])stageBossSigLine(pred.x-cdx*330+dx*off,pred.y-cdy*330+dy*off,pred.x+cdx*330+dx*off,pred.y+cdy*330+dy*off,17+phase*2,damage*.68,'#ffd1df',.76);});
    }else if(id==='stage-09'){
      const arms=2,steps=8+phase*2;for(let wave=0;wave<2;wave++)later(wave*210,()=>{for(let s=0;s<steps;s++){for(let arm=0;arm<arms;arm++){const a=e.phase*.12+arm*Math.PI+(wave?-.28:.28)*s,r=32+s*12,x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r,toward=Math.atan2(pred.y-y,pred.x-x);spawnEnemyProjectile(x,y,toward+(wave?-.22:.22),190+s*7,damage*.48,wave?'#79dcc6':'#d59cff',4.7,5,'spiral');}}});
    }else if(id==='stage-10'){
      const a=Math.atan2(player.y-e.y,player.x-e.x),mirror={x:e.x-(player.x-e.x),y:e.y-(player.y-e.y)};addCircle(mirror.x,mirror.y,64+phase*6,damage*.68,'#f4b3ff',1.02);stageBossSigLine(e.x,e.y,player.x,player.y,18+phase*2,damage*.64,'#8ee6d6',.96);stageBossSigLine(e.x,e.y,mirror.x,mirror.y,18+phase*2,damage*.64,'#f4b3ff',.96);
      later(500,()=>{for(const origin of[{x:e.x,y:e.y},mirror]){const aim=Math.atan2(pred.y-origin.y,pred.x-origin.x);for(let j=-2;j<=2;j++)spawnEnemyProjectile(origin.x,origin.y,aim+j*.15,225+phase*20,damage*.52,'#efd5ff',4.8,5,'mirror');}});
    }else if(id==='stage-11'){
      const seeds=4+phase,rr=150+phase*16;for(let i=0;i<seeds;i++){const a=i*TAU/seeds+e.phase*.03,x=pred.x+Math.cos(a)*rr,y=pred.y+Math.sin(a)*rr;addCircle(x,y,46+phase*4,damage*.74,'#e4b36c',.82+i*.10);later(520+i*85,()=>{for(let j=0;j<5;j++)spawnEnemyProjectile(x,y,j*TAU/5+i*.11,190+phase*18,damage*.43,'#f2cf8e',4.6,5,'seed-shell');});}
    }else if(id==='stage-12'){
      const petals=8,outer=210+phase*16,inner=76+phase*5;for(let i=0;i<petals;i++){const a=i*TAU/petals+e.phase*.025,x=pred.x+Math.cos(a)*outer,y=pred.y+Math.sin(a)*outer;stageBossSigLine(x,y,pred.x+Math.cos(a)*inner,pred.y+Math.sin(a)*inner,22+phase*2,damage*.82,i%3===0?'#f39aba':i%2?'#ca98ff':'#79d6c1',1.12);}
      later(650,()=>{addCircle(pred.x,pred.y,inner+18,damage*1.15,'#f0dcff',.68);api.spawnBurst(phase===3?'husk-warden':'abyss-spore',phase+2);});
    }else if(id==='stage-13'){
      const horizontal=cycle%2===0,lanes=5+phase,safe=Math.floor((cycle+phase)%lanes),span=470;for(let i=0;i<lanes;i++){if(i===safe)continue;const off=(i-(lanes-1)/2)*72;if(horizontal)stageBossSigLine(pred.x-span,pred.y+off,pred.x+span,pred.y+off,20+phase*2,damage*.84,'#6fe8f3',1.02);else stageBossSigLine(pred.x+off,pred.y-span,pred.x+off,pred.y+span,20+phase*2,damage*.84,'#6fe8f3',1.02);}
    }else if(id==='stage-14'){
      const spacing=120,safe=(cycle*3+phase)%9;for(let i=0;i<9;i++){if(i===safe)continue;const col=i%3,row=Math.floor(i/3),x=pred.x+(col-1)*spacing,y=pred.y+(row-1)*spacing;addCircle(x,y,48+phase*4,damage*.78,i%2?'#ef8de1':'#71e6f1',.96+(i%3)*.05);}
      later(620,()=>{const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];for(const [index,pair]of corners.entries()){const x=pred.x+pair[0]*176,y=pred.y+pair[1]*176,aim=Math.atan2(player.y-y,player.x-x);for(const off of[-.11,.11])spawnEnemyProjectile(x,y,aim+off,235+phase*18,damage*.48,index%2?'#ef8de1':'#71e6f1',5,4.8,'packet');}});
    }else if(id==='stage-15'){
      const a0=Math.atan2(player.y-e.y,player.x-e.x);for(let step=0;step<3;step++)later(step*260,()=>{const a=a0+(step-1)*.32,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx;for(const off of[-105,0,105])stageBossSigLine(pred.x-dx*420+nx*off,pred.y-dy*420+ny*off,pred.x+dx*420+nx*off,pred.y+dy*420+ny*off,19+phase*2,damage*.76,step===1?'#c39cff':'#70e8ef',.80);});
    }else if(id==='stage-16'){
      const rays=5+phase,base=Math.atan2(player.y-e.y,player.x-e.x)-.65;for(let step=0;step<3;step++)later(step*240,()=>{for(let i=0;i<rays;i++){if(i===Math.floor(rays/2))continue;const a=base+i*.26+step*.20;stageBossSigLine(e.x,e.y,e.x+Math.cos(a)*620,e.y+Math.sin(a)*620,21+phase*2,damage*.80,'#70dce4',.76);}});
    }else if(id==='stage-17'){
      for(let step=0;step<3;step++)later(step*290,()=>{const r=330-step*78,hw=r,hh=r*.68,color=step===2?'#fff0c9':'#e4bd72';stageBossSigLine(pred.x-hw,pred.y-hh,pred.x+hw,pred.y-hh,23+phase*2,damage*.84,color,.86);stageBossSigLine(pred.x+hw,pred.y-hh,pred.x+hw,pred.y+hh,23+phase*2,damage*.84,color,.86);stageBossSigLine(pred.x+hw,pred.y+hh,pred.x-hw,pred.y+hh,23+phase*2,damage*.84,color,.86);stageBossSigLine(pred.x-hw,pred.y+hh,pred.x-hw,pred.y-hh,23+phase*2,damage*.84,color,.86);});
    }else if(id==='stage-18'){
      const sides=phase===3?8:6;for(let step=0;step<3;step++)later(step*300,()=>{const r=340-step*88,pts=Array.from({length:sides},(_,i)=>({x:pred.x+Math.cos(i*TAU/sides-Math.PI/2)*r,y:pred.y+Math.sin(i*TAU/sides-Math.PI/2)*r}));for(let i=0;i<sides;i++){const a=pts[i],b=pts[(i+1)%sides];stageBossSigLine(a.x,a.y,b.x,b.y,24+phase*2,damage*.90,i%3===0?'#e6c276':i%3===1?'#70e7ef':'#c79cff',.88);}});
      later(900,()=>{addCircle(pred.x,pred.y,86+phase*8,damage*1.18,'#f3ecff',.66);api.spawnBurst(phase===3?'cipher-warden':'packet-lancer',phase+2);});
    }
  }
  function stageBossUniqueTechnique(e,api){
    const id=e.eventKind,phase=Math.max(1,Math.min(3,Number(e.stagePhase)||1)),damage=Math.max(5,e.damage*.40),cycle=(e.stageUniqueCycle=(e.stageUniqueCycle||0)+1),pred=typeof predictedPlayer==='function'?predictedPlayer(145+phase*30):{x:player.x,y:player.y};
    const later=(ms,fn)=>scheduleWeaponAction(ms,()=>{if(stageBossSignatureAlive(e,api))fn();});
    STAGE_APEX_UNIQUE_TECHNIQUES[id]?.(e,api,phase,cycle,damage,pred,later);
  }
  const STAGE_APEX_PHASE_CUTS=Object.freeze({
    'stage-01':[.48],'stage-02':[.68,.32],'stage-03':[.52],'stage-04':[.68,.30],'stage-05':[.50],'stage-06':[.70,.35],
    'stage-07':[.48],'stage-08':[.67,.30],'stage-09':[.50],'stage-10':[.68,.31],'stage-11':[.46],'stage-12':[.72,.38],
    'stage-13':[.50],'stage-14':[.66,.30],'stage-15':[.48],'stage-16':[.65,.31],'stage-17':[.45],'stage-18':[.74,.42]
  });
  function stageBossPhase(e){
    const cuts=STAGE_APEX_PHASE_CUTS[e.eventKind]||[.66,.33],ratio=e.hp/Math.max(1,e.maxHp);let phase=1;
    for(const cut of cuts)if(ratio<=cut)phase++;
    const previous=Math.max(1,Number(e.stagePhase)||1);e.stagePhase=Math.min(3,phase);
    if(previous!==e.stagePhase){
      e.stagePrimaryCd=.30;e.stageUniqueCd=1.25;e.stageTertiaryCd=2.30;e.stagePhaseChangedAt=state.time||0;
      state.camera.shake=Math.max(state.camera.shake,7+e.stagePhase*2);state.flash=Math.max(state.flash,.08+e.stagePhase*.02);
      shockwave(e.x,e.y,e.color||'#dbe4ff',118+e.stagePhase*28,.46,3+e.stagePhase);
      if(e.eventKind==='stage-01'){const arena=stageOneArena();if(arena)arena.phase=e.stagePhase;e.stageGateCoreOpen=e.stagePhase>=2;e.attackLockUntil=(state.time||0)+1.12;e.stageOneAttackCd=1.35;e.stageRamWindupUntil=0;e.stageRamUntil=0;stageBossSetMotion(e,0,0);showBossNotice(GAME_SETTINGS.language==='ko'?'전초 수호자 · 봉쇄 해제':'FRONTIER WARDEN · SEAL BROKEN',GAME_SETTINGS.language==='ko'?'노출된 관문핵':'GATE CORE EXPOSED');audio.tone?.(118,.52,'sawtooth',.036,120);spawnParticle(e.x,e.y,'#ffffff',20,210,5);}
      if(e.eventKind==='stage-12')e.stageShellOpen=e.stagePhase>=2;
      if(e.eventKind==='stage-18')e.stageCoreExposed=e.stagePhase>=2;
    }
    return e.stagePhase;
  }
  function stageBossTrackPlayer(e,dt){
    e.stageHistoryTick=(e.stageHistoryTick||0)-dt;if(e.stageHistoryTick>0)return;
    e.stageHistoryTick=.12;e.stagePlayerHistory=e.stagePlayerHistory||[];e.stagePlayerHistory.push({x:player.x,y:player.y});
    if(e.stagePlayerHistory.length>40)e.stagePlayerHistory.shift();
  }
  function stageBossPast(e,steps=10){const h=e.stagePlayerHistory||[];return h[Math.max(0,h.length-1-steps)]||{x:player.x,y:player.y};}
  function stageBossSetMotion(e,vx,vy){
    const cap=Math.max(28,e.speed*1.55),m=Math.hypot(vx,vy);if(m>cap){vx=vx/m*cap;vy=vy/m*cap;}
    e.stageMotionX=Number.isFinite(vx)?vx:0;e.stageMotionY=Number.isFinite(vy)?vy:0;
  }
  function stageBossMoveToward(e,x,y,scale=1){const dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy)||1,v=e.speed*scale;stageBossSetMotion(e,dx/d*v,dy/d*v);}
  function stageBossOrbit(e,x,y,rx,ry,rate=.18,scale=1){
    const a=(state.time||0)*rate+(e.id%9)*.41,tx=x+Math.cos(a)*rx,ty=y+Math.sin(a)*ry,dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1,v=Math.min(e.speed*scale,d*1.8);stageBossSetMotion(e,dx/d*v,dy/d*v);
  }
  const STAGE_APEX_MOTION=Object.freeze({
    'stage-01':(e,p)=>{const arena=stageOneArena();if(!arena)return stageBossMoveToward(e,p.x,p.y,.72);if((e.stageRamWindupUntil||0)>(state.time||0)||(e.stageRamUntil||0)>(state.time||0)||(e.attackLockUntil||0)>(state.time||0)){stageBossSetMotion(e,0,0);return;}const inset=arena.halfW*.58,tx=clamp(p.x,arena.x-inset,arena.x+inset),ty=arena.y-arena.halfH*(p.phase>=2?.25:.52);stageBossMoveToward(e,tx,ty,p.phase>=2?.92:.68);},
    'stage-02':(e,p)=>stageBossOrbit(e,p.x,p.y,255-p.phase*16,155+p.phase*8,.18,p.phase===3?1.12:.92),
    'stage-03':(e,p)=>{const a=(Math.floor((state.time||0)/2.4)%3)*TAU/3-Math.PI/2;stageBossMoveToward(e,p.x+Math.cos(a)*310,p.y+Math.sin(a)*205,1.02);},
    'stage-04':(e,p)=>{const q=stageBossPast(e,12+p.phase*2);stageBossOrbit(e,q.x,q.y,230,145,-.13,1.0);},
    'stage-05':(e,p)=>{const a=Math.atan2(p.y-e.y,p.x-e.x),s=(Math.floor((state.time||0)*.55)+e.id)%2?1:-1;stageBossMoveToward(e,p.x-Math.sin(a)*s*255,p.y+Math.cos(a)*s*255,p.phase===2?1.18:1.0);},
    'stage-06':(e,p)=>{const q=stageBossPast(e,10),cx=(p.x+q.x)*.5,cy=(p.y+q.y)*.5;e.stageFinaleMode='route-convergence';stageBossOrbit(e,cx,cy,310-p.phase*34,185-p.phase*10,.15,p.phase===3?1.25:1.02);},
    'stage-07':(e,p)=>stageBossMoveToward(e,p.x,p.y,p.phase===2?1.34:.94),
    'stage-08':(e,p)=>stageBossOrbit(e,p.x,p.y,340,215,.10,p.phase===3?1.12:.90),
    'stage-09':(e,p)=>{const r=245+Math.sin((state.time||0)*.72)*58;stageBossOrbit(e,p.x,p.y,r,r*.56,.25,p.phase===2?1.22:1.0);},
    'stage-10':(e,p)=>stageBossMoveToward(e,2*p.x-e.x,2*p.y-e.y,p.phase===3?1.18:.96),
    'stage-11':(e,p)=>stageBossOrbit(e,p.x,p.y,182,118,.075,.78),
    'stage-12':(e,p)=>{e.stageShellOpen=p.phase>=2;if(p.phase===1)stageBossOrbit(e,p.x,p.y,295,190,.09,.80);else stageBossMoveToward(e,p.x,p.y,p.phase===3?1.28:1.02);},
    'stage-13':(e,p)=>{const axis=(e.stageScanAxis||0)%2;stageBossMoveToward(e,p.x+(axis?0:315),p.y+(axis?315:0),.92);},
    'stage-14':(e,p)=>stageBossMoveToward(e,p.x+Math.sin((state.time||0)*1.7+e.id)*220,p.y+Math.cos((state.time||0)*1.3+e.id)*150,1.02+p.phase*.08),
    'stage-15':(e,p)=>{const a=(Math.floor((state.time||0)/2.3)+e.id)%4*TAU/4;stageBossMoveToward(e,p.x+Math.cos(a)*365,p.y+Math.sin(a)*250,1.08);},
    'stage-16':(e,p)=>{e.stageBeaconAnchor=e.stageBeaconAnchor||{x:e.x,y:e.y};stageBossMoveToward(e,e.stageBeaconAnchor.x,e.stageBeaconAnchor.y,.70);},
    'stage-17':(e,p)=>{const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,radial=(d-285)*1.35,tangent=e.speed*(p.phase===2?1.20:.94);stageBossSetMotion(e,dx/d*radial-dy/d*tangent,dy/d*radial+dx/d*tangent);},
    'stage-18':(e,p)=>{e.stageCoreExposed=p.phase>=2;const c=e.stageRewriteCenter||(e.stageRewriteCenter={x:p.x,y:p.y});c.x=lerp(c.x,p.x+(p.phase>=2?Math.sin((state.time||0)*.7)*90:0),.035);c.y=lerp(c.y,p.y+(p.phase>=3?Math.cos((state.time||0)*.6)*72:0),.035);if(p.phase===1)stageBossOrbit(e,c.x,c.y,330,210,.08,.82);else stageBossMoveToward(e,c.x,c.y,p.phase===3?1.20:1.0);}
  });
  const STAGE_APEX_TERTIARY_TECHNIQUES=Object.freeze({
    'stage-01':(e,api,p,c,d,q,l)=>stageOneBreachRam(e,api,p,c,d,q,l),
    'stage-02':(e,api,p,c,d,q,l)=>{const n=4+p;for(let i=0;i<n;i++){const a=i*TAU/n+(state.time||0)*.08,x=e.x+Math.cos(a)*(120+p*8),y=e.y+Math.sin(a)*(120+p*8);rawLine(x,y,q.x,q.y,5,0,i%2?'#8cecff':'#ff8fd8',.55,'boss-charge');l(550+i*55,()=>spawnEnemyProjectile(x,y,Math.atan2(player.y-y,player.x-x),235+p*16,d*.56,i%2?'#8cecff':'#ff8fd8',5,4.6,'seed-shell'));}},
    'stage-03':(e,api,p,c,d,q,l)=>{const r=275,pts=Array.from({length:3},(_,i)=>{const a=-Math.PI/2+i*TAU/3+(state.time||0)*.06;return{x:q.x+Math.cos(a)*r,y:q.y+Math.sin(a)*r};});pts.forEach((v,i)=>l(i*110,()=>{const target=pts[(i+2)%3];stageBossActualBeam(v.x,v.y,target.x,target.y,15+p,d*.48,i%2?'#a8f4ff':'#dfb2ff','prism-reflect');spawnEnemyProjectile(v.x,v.y,Math.atan2(player.y-v.y,player.x-v.x),265,d*.44,'#ffffff',4.6,4.3,'needle');}));},
    'stage-04':(e,api,p,c,d,q,l)=>{const past=stageBossPast(e,22+p*2),now={x:player.x,y:player.y};addCircle(past.x,past.y,46,0,'#8fffe0',.58);rawLine(past.x,past.y,now.x,now.y,7,0,'#a4bfff',.64,'boss-charge');l(620,()=>stageBossActualBeam(past.x,past.y,player.x,player.y,19+p,d*.82,'#8fffe0','rewind-scar'));},
    'stage-05':(e,api,p,c,d,q,l)=>{const a=Math.atan2(q.y-e.y,q.x-e.x),nx=-Math.sin(a),ny=Math.cos(a),sep=175,left={x:q.x+nx*sep,y:q.y+ny*sep},right={x:q.x-nx*sep,y:q.y-ny*sep};addCircle(left.x,left.y,38,0,'#79f7ff',.58);addCircle(right.x,right.y,38,0,'#b9a8ff',.58);l(580,()=>{const target=c%2?left:right,dx=target.x-player.x,dy=target.y-player.y,dd=Math.hypot(dx,dy)||1;player.x+=dx/dd*(48+p*12);player.y+=dy/dd*(48+p*12);stageBossActualBeam(left.x,left.y,right.x,right.y,22+p,d*.76,'#e9ffff','polarity-swap');});},
    'stage-06':(e,api,p,c,d,q,l)=>{const q0=stageBossPast(e,18),mid={x:(q0.x+q.x)*.5,y:(q0.y+q.y)*.5};rawLine(q0.x,q0.y,q.x,q.y,8,0,'#ffffff',.68,'boss-charge');l(670,()=>{stageBossActualBeam(q0.x,q0.y,q.x,q.y,21+p,d*.72,'#ffffff','route-fold');const dx=mid.x-player.x,dy=mid.y-player.y,dd=Math.hypot(dx,dy)||1;player.x+=dx/dd*(44+p*10);player.y+=dy/dd*(44+p*10);addCircle(mid.x,mid.y,64+p*8,d*.78,'#ffcf8a',.40);});},
    'stage-07':(e,api,p,c,d,q,l)=>{addCircle(q.x,q.y,78+p*8,0,'#ff8ac8',.52);l(520,()=>{const a=Math.atan2(player.y-e.y,player.x-e.x);e.dash=.40;e.dashX=Math.cos(a)*(370+p*45);e.dashY=Math.sin(a)*(370+p*45);addCircle(player.x,player.y,50+p*5,d*.76,'#bd79ff',.36);});},
    'stage-08':(e,api,p,c,d,q,l)=>{const past=stageBossPast(e,16),a=Math.atan2(q.y-past.y,q.x-past.x)+Math.PI/2,dx=Math.cos(a),dy=Math.sin(a);for(const off of[-95,0,95])stageBossSigLine(past.x-dx*360+Math.cos(a+Math.PI/2)*off,past.y-dy*360+Math.sin(a+Math.PI/2)*off,past.x+dx*360+Math.cos(a+Math.PI/2)*off,past.y+dy*360+Math.sin(a+Math.PI/2)*off,17+p,d*.57,'#ffd1df',.90);},
    'stage-09':(e,api,p,c,d,q,l)=>{for(const side of[-1,1]){const a=(state.time||0)*.18+side*Math.PI/2,x=e.x+Math.cos(a)*165,y=e.y+Math.sin(a)*165;addCircle(x,y,28,0,side>0?'#79dcc6':'#d59cff',.48);l(480+(side>0?90:0),()=>{const aim=Math.atan2(player.y-y,player.x-x);for(const off of[-.16,0,.16])spawnEnemyProjectile(x,y,aim+off,240,d*.48,side>0?'#79dcc6':'#d59cff',5,4.8,'spiral');});}},
    'stage-10':(e,api,p,c,d,q,l)=>{const mirror={x:2*player.x-e.x,y:2*player.y-e.y};rawLine(e.x,e.y,mirror.x,mirror.y,7,0,'#efd5ff',.58,'boss-mirror');l(570,()=>{const ox=e.x,oy=e.y;stageBossVisibleTravel(e,mirror.x,mirror.y,.70,940);shockwave(ox,oy,'#8ee6d6',82,.32,3);shockwave(mirror.x,mirror.y,'#f4b3ff',100,.38,3.5);});},
    'stage-11':(e,api,p,c,d,q,l)=>{for(const [i,a]of[0,1,2,3].map(i=>[i,i*TAU/4+Math.PI/4])){const x=q.x+Math.cos(a)*185,y=q.y+Math.sin(a)*185;addCircle(x,y,38+p*3,d*.52,'#e4b36c',.70+i*.08);l(620+i*80,()=>{const aim=Math.atan2(player.y-y,player.x-x);for(const off of[-.14,0,.14])spawnEnemyProjectile(x,y,aim+off,225+p*16,d*.43,'#f2cf8e',5,4.8,'seed-shell');});}},
    'stage-12':(e,api,p,c,d,q,l)=>{const n=6+p*2;for(let i=0;i<n;i++){const a=i*TAU/n+(state.time||0)*.05,x=e.x+Math.cos(a)*(90+p*8),y=e.y+Math.sin(a)*(90+p*8);rawLine(x,y,x+Math.cos(a)*310,y+Math.sin(a)*310,7,0,i%3===0?'#f39aba':i%2?'#ca98ff':'#79d6c1',.60,'boss-bloom');l(600+i*35,()=>stageBossActualBeam(x,y,x+Math.cos(a)*310,y+Math.sin(a)*310,16+p,d*.48,i%3===0?'#f39aba':i%2?'#ca98ff':'#79d6c1','shell-rupture'));}if(p>=2)l(760,()=>{const aim=Math.atan2(player.y-e.y,player.x-e.x);e.dash=.34;e.dashX=Math.cos(aim)*(320+p*45);e.dashY=Math.sin(aim)*(320+p*45);});},
    'stage-13':(e,api,p,c,d,q,l)=>{e.stageScanAxis=(e.stageScanAxis||0)+1;const h=e.stageScanAxis%2===0,lanes=6+p,safe=(c+p)%lanes;for(let i=0;i<lanes;i++){if(i===safe)continue;const off=(i-(lanes-1)/2)*70;if(h)stageBossSigLine(q.x-490,q.y+off,q.x+490,q.y+off,19+p,d*.60,'#6fe8f3',.94);else stageBossSigLine(q.x+off,q.y-490,q.x+off,q.y+490,19+p,d*.60,'#9a8cff',.94);}},
    'stage-14':(e,api,p,c,d,q,l)=>{const spacing=116,start=(e.stageNoiseCell=(e.stageNoiseCell||0)+2)%9;for(let hop=0;hop<5+p;hop++)l(hop*125,()=>{const cell=(start+hop*(p+2))%9,col=cell%3,row=Math.floor(cell/3);addCircle(q.x+(col-1)*spacing,q.y+(row-1)*spacing,39+p*3,d*.54,hop%2?'#ef8de1':'#71e6f1',.48);});},
    'stage-15':(e,api,p,c,d,q,l)=>{const origins=[[-360,-180],[360,-180],[-360,180],[360,180]];origins.forEach(([ox,oy],i)=>l(i*115,()=>{const x=q.x+ox,y=q.y+oy,aim=Math.atan2(player.y-y,player.x-x);addCircle(x,y,24,0,i%2?'#c39cff':'#70e8ef',.32);for(const off of[-.10,.10])spawnEnemyProjectile(x,y,aim+off,250+p*18,d*.49,i%2?'#c39cff':'#70e8ef',5,5,'packet');}));},
    'stage-16':(e,api,p,c,d,q,l)=>{const a=Math.atan2(player.y-e.y,player.x-e.x)+Math.PI,anchor={x:q.x+Math.cos(a)*(280+p*22),y:q.y+Math.sin(a)*(280+p*22)};addCircle(anchor.x,anchor.y,58,0,'#d9f8ff',.62);l(610,()=>{e.stageBeaconAnchor=anchor;stageBossVisibleTravel(e,anchor.x,anchor.y,.74,880);shockwave(anchor.x,anchor.y,'#d9f8ff',110,.38,4);});},
    'stage-17':(e,api,p,c,d,q,l)=>{const gates=[[0,-1],[1,0],[0,1],[-1,0]],rr=250;gates.forEach(([gx,gy],i)=>{const x=q.x+gx*rr,y=q.y+gy*rr;addCircle(x,y,28,0,i%2?'#73ded0':'#e4bd72',.46);l(470+i*90,()=>spawnEnemyProjectile(x,y,Math.atan2(player.y-y,player.x-x),220+p*22,d*.60,i%2?'#73ded0':'#e4bd72',10,5,'saw'));});},
    'stage-18':(e,api,p,c,d,q,l)=>{const center=e.stageRewriteCenter||q,rule=(e.stageRewriteRule=(e.stageRewriteRule||0)+1)%3,span=455;if(rule===0){for(const off of[-110,0,110])stageBossSigLine(center.x-span,center.y+off,center.x+span,center.y+off,20+p,d*.58,off?'#70e7ef':'#e6c276',.96);}else if(rule===1){for(const off of[-110,0,110])stageBossSigLine(center.x+off,center.y-span,center.x+off,center.y+span,20+p,d*.58,off?'#c79cff':'#70e7ef',.96);}else for(const a of[-Math.PI/4,Math.PI/4])stageBossSigLine(center.x-Math.cos(a)*span,center.y-Math.sin(a)*span,center.x+Math.cos(a)*span,center.y+Math.sin(a)*span,22+p,d*.62,a>0?'#c79cff':'#e6c276',1.02);}
  });
  function stageBossTertiaryTechnique(e,api){
    const id=e.eventKind,phase=Math.max(1,Math.min(3,Number(e.stagePhase)||1)),damage=Math.max(5,e.damage*.40),cycle=(e.stageTertiaryCycle=(e.stageTertiaryCycle||0)+1),pred=typeof predictedPlayer==='function'?predictedPlayer(170+phase*34):{x:player.x,y:player.y};
    const later=(ms,fn)=>scheduleWeaponAction(ms,()=>{if(stageBossSignatureAlive(e,api))fn();});
    STAGE_APEX_TERTIARY_TECHNIQUES[id]?.(e,api,phase,cycle,damage,pred,later);
  }
  function updateStageBossCombat(enemy,dt,api){
    if(!enemy||enemy.dead)return;stageBossTrackPlayer(enemy,dt);const phase=stageBossPhase(enemy),id=enemy.eventKind;
    if(id==='stage-01'){
      clampStageOnePlayer();STAGE_APEX_MOTION[id]?.(enemy,{x:player.x,y:player.y,phase});const now=state.time||0;
      if((enemy.attackLockUntil||0)>now||(enemy.stageRamWindupUntil||0)>now||(enemy.stageRamUntil||0)>now)return;
      enemy.stageOneAttackCd=(Number.isFinite(enemy.stageOneAttackCd)?enemy.stageOneAttackCd:1.8)-dt;if(enemy.stageOneAttackCd>0)return;
      const cycle=(enemy.stageOneAttackCycle=(enemy.stageOneAttackCycle||0)+1),slot=cycle%4;enemy.stageOneAttackCd=(phase>=2?3.05:3.55)+(slot===3?.35:0);
      if(slot===1||slot===0)stageBossSignature(enemy,api);else if(slot===2)stageBossUniqueTechnique(enemy,api);else stageBossTertiaryTechnique(enemy,api);return;
    }
    STAGE_APEX_MOTION[id]?.(enemy,{x:player.x,y:player.y,phase});
    enemy.stagePrimaryCd=(Number.isFinite(enemy.stagePrimaryCd)?enemy.stagePrimaryCd:1.0)-dt;
    enemy.stageUniqueCd=(Number.isFinite(enemy.stageUniqueCd)?enemy.stageUniqueCd:2.4)-dt;
    enemy.stageTertiaryCd=(Number.isFinite(enemy.stageTertiaryCd)?enemy.stageTertiaryCd:4.0)-dt;
    const finale=['stage-06','stage-12','stage-18'].includes(id);
    if(enemy.stagePrimaryCd<=0){enemy.stagePrimaryCd=(finale?5.3:6.1)-phase*.24;stageBossSignature(enemy,api);}
    if(enemy.stageUniqueCd<=0){enemy.stageUniqueCd=(finale?6.5:7.4)-phase*.28;stageBossUniqueTechnique(enemy,api);}
    if(enemy.stageTertiaryCd<=0){enemy.stageTertiaryCd=(finale?7.7:8.8)-phase*.32;stageBossTertiaryTechnique(enemy,api);}
  }
  window.updateStageBossSkill=function(enemy,dt){
    const api=apiFor(stageRuntime());updateStageBossCombat(enemy,dt,api);
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
  const baseReset=resetGame;resetGame=function stageAwareReset(){const config=window.stackfallCurrentRunConfig?.();baseReset();clearStageUi();state.stageBossArena=null;if(config?.mode!=='stage'){state.stageRun=null;return;}const stage=config.stage,def=stageDefinition(stage?.id);if(!stage||!def){state.stageRun=null;return;}state.stageRun={stage,eventsTriggered:{},worldEventsTriggered:{},encountersTriggered:{},encounterBags:{},bossSpawned:false,bossId:null,bossSnapshot:null,completed:false,completedAt:null,resultShown:false,lastSpawnBudget:null,lastWorldEvent:null};state.nextApexAt=Infinity;state.mapEventActive=null;state.entities.mapEvents.length=0;state.entities.enemies.length=0;state.entities.enemyProjectiles.length=0;state.realmTheme=def.theme||('stage-'+String(stage.order).padStart(2,'0'));state.spawnTimer=def.initialSpawnTimer??.7;for(const variant of def.startingVariants||[])spawnStageEnemy(stage.id,variant);showBossNotice(localized(stage.title),'STAGE '+String(stage.order).padStart(2,'0'));updateObjective(state.stageRun);def.onStart?.(apiFor(state.stageRun));};

  function resetStageBossStateForDeveloper(run){
    if(!run)return;
    run.bossSpawned=false;run.bossId=null;run.bossSnapshot=null;run.completed=false;run.completedAt=null;run.victoryStarted=false;run.resultShown=false;
    const bossEvent=run.stage?.fixedEvents?.find(event=>event.kind==='boss');
    if(bossEvent&&run.eventsTriggered)delete run.eventsTriggered[bossEvent.id];
    state.stageVictory=null;
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
    state.mode='playing';state.time=Math.max(0,Number(run.stage.boss?.spawnAt||run.stage.durationSeconds||60));state.spawnTimer=0;
    ui.choice?.classList.add('hidden');ui.pauseScreen?.classList.add('hidden');ui.gameOver?.classList.add('hidden');document.querySelector('#worldEventScreen')?.classList.add('hidden');document.querySelector('#bossRewardScreen')?.classList.add('hidden');document.querySelector('#apexRewardScreen')?.classList.add('hidden');
    const boss=spawnStageBoss();
    if(!boss)return{ok:false,reason:'spawn-blocked',stageId:requested.id};
    updateObjective(run);return{ok:true,stageId:requested.id,bossId:boss.id,form:boss.eliteForm||boss.variant||null};
  };
  completeMap?.addEventListener('click',()=>{completeScreen.classList.add('hidden');showMainMenu();window.openStackfallGalaxyMap?.();});completeMenu?.addEventListener('click',()=>{completeScreen.classList.add('hidden');showMainMenu();});

  registerStageRuntime('stage-01',{
    theme:'stage-01',objectiveKey:'stage01.objective.boss',fixedEventKey:'stage01.event.fixed',initialSpawnTimer:.72,spawnRadius:690,spawnRadiusMin:45,spawnRadiusMax:125,burstRadiusMin:610,burstRadiusMax:780,startingVariants:['shardling','shardling','shardling'],
    variants:{
      shardling:{type:'grunt',color:'#7a8dff',hp:.92,speed:1.02,damage:.90,r:.92,xp:1,name:'stage01.enemy.shardling'},
      dart:{type:'fast',color:'#8ee7ff',hp:.84,speed:1.14,damage:.92,r:1.02,xp:1.05,name:'stage01.enemy.dart'},
      bombardier:{type:'ranged',color:'#b58cff',hp:1.12,speed:.92,damage:.98,r:1.06,xp:1.18,name:'stage01.enemy.bombardier',rangedMin:.8,rangedMax:1.35},
      bulwark:{type:'tank',color:'#7380b8',hp:1.48,speed:.82,damage:1.05,r:1.10,xp:1.35,name:'stage01.enemy.bulwark'}
    },
    poolAt(time){if(time<90)return[['shardling',1]];if(time<360)return[['shardling',.68],['dart',.32]];if(time<450)return[['shardling',.52],['dart',.32],['bombardier',.16]];if(time<540)return[['shardling',.42],['dart',.27],['bombardier',.15],['bulwark',.16]];return[['shardling',.36],['dart',.28],['bombardier',.17],['bulwark',.19]];},
    spawnProfile(time){const late=Math.max(0,time-300),cap=time>=480?46:time>=300?38:30,rate=Math.max(.58,Math.max(.66,1.52-time*.00135)-Math.min(.16,late/2100)),count=time>=480?2:time>=360&&Math.random()<.24?2:1;return{cap,rate,count};},
    waveLabel(event){return event.variant==='dart'?tr('stage01.event.rush'):event.variant==='bombardier'?tr('stage01.event.bombardment'):tr('stage01.event.wardenLine');},
    hazard(event,api){if(event.variant!=='collapse-pulse')return;showBossNotice(tr('stage01.event.collapse'),tr('stage01.event.warning'));const damage=8+Math.min(10,state.level*.28);for(let wave=0;wave<3;wave++)scheduleWeaponAction(wave*520,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(80+wave*45):{x:player.x,y:player.y},radius=58+wave*13;addCircle(p.x,p.y,radius,damage*(.82+wave*.12),wave===2?'#d7c2ff':'#8098ff',.88+wave*.08);const half=150+wave*26,gap=58+wave*5;rawLine(p.x-half,p.y,p.x-gap,p.y,14+wave*2,damage*.60,'#829dff',1.02+wave*.07,'boss-line');rawLine(p.x+gap,p.y,p.x+half,p.y,14+wave*2,damage*.60,'#829dff',1.02+wave*.07,'boss-line');});},
    bossProfile:{form:'collapse-warden',eventVariant:'stage01-warden',nameKey:'stage01.boss',warningKey:'stage01.boss.warning',r:74,hp:1.42,speed:.90,damage:1.02,color:'#9aa7ff',xp:1.8,skillCd:1.8,burstCd:4.2,pulseCd:6.8,spawnRadius:650,spawnShockwave:220},
    bossSkill:null
  });
})();