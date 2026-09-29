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
  function withStageEnvironment(event,api,action){
    const previous=state.stageEnvironmentTelegraphContext||null;
    state.stageEnvironmentTelegraphContext={family:environmentFamily(api?.stage),stageId:api?.stage?.id||null,variant:event?.variant||'environment',ambient:!!event?.ambient};
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
  const STAGE_ENCOUNTER_SCHEDULES=Object.freeze({
    1:Object.freeze([{kind:'mini',at:.34},{kind:'boss',at:.72}]),
    2:Object.freeze([{kind:'mini',at:.30},{kind:'boss',at:.66}]),
    3:Object.freeze([{kind:'mini',at:.24},{kind:'mini',at:.50},{kind:'boss',at:.78}]),
    4:Object.freeze([{kind:'mini',at:.22},{kind:'boss',at:.47},{kind:'mini',at:.70}]),
    5:Object.freeze([{kind:'mini',at:.20},{kind:'boss',at:.42},{kind:'mini',at:.63},{kind:'boss',at:.82}]),
    6:Object.freeze([{kind:'mini',at:.17},{kind:'boss',at:.34},{kind:'mini',at:.50},{kind:'boss',at:.66},{kind:'mini',at:.80}]),
    7:Object.freeze([{kind:'mini',at:.22},{kind:'boss',at:.48},{kind:'mini',at:.70}]),
    8:Object.freeze([{kind:'mini',at:.20},{kind:'boss',at:.40},{kind:'mini',at:.60},{kind:'boss',at:.79}]),
    9:Object.freeze([{kind:'mini',at:.18},{kind:'boss',at:.36},{kind:'mini',at:.55},{kind:'boss',at:.77}]),
    10:Object.freeze([{kind:'mini',at:.16},{kind:'boss',at:.33},{kind:'mini',at:.49},{kind:'boss',at:.66},{kind:'mini',at:.81}]),
    11:Object.freeze([{kind:'mini',at:.15},{kind:'boss',at:.30},{kind:'mini',at:.45},{kind:'boss',at:.61},{kind:'mini',at:.78}]),
    12:Object.freeze([{kind:'mini',at:.13},{kind:'boss',at:.26},{kind:'mini',at:.38},{kind:'boss',at:.51},{kind:'mini',at:.64},{kind:'boss',at:.79}]),
    13:Object.freeze([{kind:'mini',at:.18},{kind:'boss',at:.35},{kind:'mini',at:.52},{kind:'boss',at:.72}]),
    14:Object.freeze([{kind:'mini',at:.15},{kind:'boss',at:.31},{kind:'mini',at:.45},{kind:'boss',at:.61},{kind:'mini',at:.77}]),
    15:Object.freeze([{kind:'mini',at:.14},{kind:'boss',at:.28},{kind:'mini',at:.42},{kind:'boss',at:.57},{kind:'mini',at:.72}]),
    16:Object.freeze([{kind:'mini',at:.12},{kind:'boss',at:.24},{kind:'mini',at:.36},{kind:'boss',at:.49},{kind:'mini',at:.62},{kind:'boss',at:.78}]),
    17:Object.freeze([{kind:'mini',at:.10},{kind:'boss',at:.21},{kind:'mini',at:.32},{kind:'boss',at:.44},{kind:'mini',at:.56},{kind:'boss',at:.68},{kind:'mini',at:.80}]),
    18:Object.freeze([{kind:'mini',at:.09},{kind:'boss',at:.19},{kind:'mini',at:.30},{kind:'boss',at:.42},{kind:'mini',at:.54},{kind:'boss',at:.66},{kind:'mini',at:.79}])
  });
  function stageEncounterPlan(stage){return STAGE_ENCOUNTER_SCHEDULES[Math.max(1,Number(stage?.order)||1)]||STAGE_ENCOUNTER_SCHEDULES[1];}
  function stageEncounterConcurrency(stage){const order=Math.max(1,Number(stage?.order)||1);return Math.min(4,2+Math.floor((order-1)/6));}
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
      member.hp*=hpScale;member.maxHp=member.hp;member.damage*=damageScale;if(kind==='mini')member.xp*=1.10;member.stageEncounterSignatureCd=4.2+Math.random()*1.25;
    }
    showBossNotice(enemy.name,kind==='boss'?'STAGE BOSS':finale?'CONSTELLATION GUARD':'STAGE MID-BOSS');return enemy;
  }
  function stageEncounterSignature(enemy,family,run){
    if(!enemy||enemy.dead)return;const boss=enemy.stageEncounterType==='boss',ratio=enemy.hp/Math.max(1,enemy.maxHp),phase=ratio<.34?3:ratio<.67?2:1,damage=Math.max(4,enemy.damage*(boss?.31:.24)),cycle=(enemy.stageEncounterSignatureCycle=(enemy.stageEncounterSignatureCycle||0)+1),pred=typeof predictedPlayer==='function'?predictedPlayer(95+phase*22):{x:player.x,y:player.y};
    if(family==='route'){
      const horizontal=cycle%2===0,lanes=(boss?4:3)+Math.floor((phase-1)/2),safe=(cycle+phase)%lanes,spacing=boss?86:92,span=boss?430:360;
      for(let i=0;i<lanes;i++){if(i===safe)continue;const off=(i-(lanes-1)/2)*spacing;if(horizontal)rawLine(pred.x-span,pred.y+off,pred.x+span,pred.y+off,14+phase*2,damage,'#9bb9ff',.92,'boss-line');else rawLine(pred.x+off,pred.y-span,pred.x+off,pred.y+span,14+phase*2,damage,'#9bb9ff',.92,'boss-line');}
    }else if(family==='bloom'){
      const petals=(boss?6:4)+phase,rr=112+phase*18;for(let i=0;i<petals;i++){const a=i/petals*TAU+cycle*.27,x=pred.x+Math.cos(a)*rr,y=pred.y+Math.sin(a)*rr;addCircle(x,y,32+phase*4,damage*.72,i%2?'#c987ff':'#79dcc6',.86+i*.025);}
      if(boss)scheduleWeaponAction(520,()=>{if(run===stageRuntime()&&!enemy.dead)addCircle(pred.x,pred.y,62+phase*7,damage*1.08,'#efd9ff',.70);});
    }else{
      const horizontal=cycle%2===0,lanes=(boss?6:5)+Math.floor((phase-1)/2),safe=(cycle*2+phase)%lanes,spacing=boss?70:76,span=boss?455:390;
      for(let i=0;i<lanes;i++){if(i===safe)continue;const off=(i-(lanes-1)/2)*spacing;if(horizontal)rawLine(pred.x-span,pred.y+off,pred.x+span,pred.y+off,15+phase*2,damage,i%2?'#72e5ee':'#c08fff',.88,'boss-line');else rawLine(pred.x+off,pred.y-span,pred.x+off,pred.y+span,15+phase*2,damage,i%2?'#72e5ee':'#c08fff',.88,'boss-line');}
    }
  }
  function updateStageEncounterSignatures(run,dt){
    for(const enemy of state.entities.enemies){
      if(!enemy||enemy.dead||enemy.stageEncounter!==true)continue;
      if(enemy.twinGroup){const owner=state.entities.enemies.find(member=>member&&!member.dead&&member.stageEncounter===true&&member.twinGroup===enemy.twinGroup);if(owner!==enemy)continue;}
      enemy.stageEncounterSignatureCd=(Number.isFinite(enemy.stageEncounterSignatureCd)?enemy.stageEncounterSignatureCd:5.2)-dt;if(enemy.stageEncounterSignatureCd>0)continue;const boss=enemy.stageEncounterType==='boss';enemy.stageEncounterSignatureCd=(boss?6.2:7.4)-Math.min(1.25,(run.stage?.order||1)*.045);stageEncounterSignature(enemy,enemy.stageEncounterFamily||environmentFamily(run.stage),run);
    }
  }
  function updateStageEncounters(run,progress){
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
  function spawnStageBoss(){
    const run=stageRuntime(),def=stageDefinition();if(!run||!def||run.bossSpawned||!makeEnemyRoom('boss'))return null;
    const profile=typeof def.bossProfile==='function'?def.bossProfile(run):def.bossProfile;if(!profile)return null;
    const cfg=enemyConfig('boss'),stage=run.stage,angle=profile.angle??-Math.PI/2,radius=Math.min(Math.max(vw,vh)*.50,profile.spawnRadius||660),e={
      id:state.nextId++,type:'boss',kind:'stage-boss',bossCategory:'apex',stageBossTier:Number(stage.order)%6===0?'constellation':'stage',variant:profile.form,eliteForm:profile.form,eventKind:stage.id,eventVariant:profile.eventVariant,name:localized(stage.boss?.name)||tr(profile.nameKey),
      x:player.x+Math.cos(angle)*radius,y:player.y+Math.sin(angle)*radius,r:profile.r,hp:cfg.hp*profile.hp,maxHp:0,speed:cfg.speed*profile.speed,damage:cfg.damage*profile.damage,color:profile.color,xp:cfg.xp*profile.xp,
      hit:0,dead:false,phase:Math.random()*TAU,skillCd:profile.skillCd,burstCd:profile.burstCd,pulseCd:profile.pulseCd,rangedCd:999,strafeDir:1,dash:0,dashX:0,dashY:0,stagePhase:1,controlImmune:true
    };
    if(e.stageBossTier==='constellation'){e.hp*=1.18;e.damage*=1.06;e.skillCd*=.92;e.burstCd*=.92;e.pulseCd*=.92;}e.maxHp=e.hp;state.entities.enemies.push(e);state.bossActiveId=e.id;state.bossIndex++;run.bossSpawned=true;run.bossId=e.id;showBossNotice(e.name,tr(profile.warningKey));audio.boss();shockwave(e.x,e.y,e.color,profile.spawnShockwave||195,.74,5);return e;
  }
  function triggerStageEvent(event){
    const run=stageRuntime(),def=stageDefinition();if(!run||!def||run.eventsTriggered[event.id])return;run.eventsTriggered[event.id]=true;const api=apiFor(run);
    if(event.kind==='boss'){spawnStageBoss();return;}
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
    for(const event of run.stage.fixedEvents)if(state.time>=event.at&&!run.eventsTriggered[event.id])triggerStageEvent(event);
    if(!run.bossSpawned&&state.time>=run.stage.boss.spawnAt)spawnStageBoss();
    if(run.bossSpawned)return;
    updateAmbientGimmick(run,def);
    const progress=clamp(state.time/Math.max(1,run.stage.boss.spawnAt),0,1);updateStageEncounterSignatures(run,dt);updateStageEncounters(run,progress);
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
    const run=stageRuntime();if(!run||run.completed||!enemy)return;run.completed=true;run.completedAt=state.time;run.victoryStarted=true;state.stageVictory={x:enemy.x,y:enemy.y,color:enemy.color||'#aeb9ff',elapsed:0,duration:VICTORY_DURATION,pulseA:false,pulseB:false};state.mode='stageVictory';state.pendingActions.length=0;clearRunUiActions?.();state.bossActiveId=null;ui.bossBar.classList.add('hidden');objective?.classList.add('hidden');state.entities.enemyProjectiles.length=0;state.entities.telegraphs.length=0;state.entities.beams.length=0;for(const key of['vacuumSeeds','phaseMines','guidedMissiles','gateNetworks'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;
    for(const other of state.entities.enemies){if(other!==enemy&&!other.dead){other.dead=true;spawnParticle(other.x,other.y,other.color||'#9aa7ff',4,120,3);}}state.camera.shake=Math.max(state.camera.shake,24);state.flash=Math.max(state.flash,.34);shockwave(enemy.x,enemy.y,'#eef2ff',220,.90,8);spawnParticle(enemy.x,enemy.y,'#ffffff',54,410,9);spawnParticle(enemy.x,enemy.y,enemy.color||'#9aa7ff',42,300,7);
  }
  window.updateStageVictoryCinematic=function(dt){const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;v.elapsed+=dt;if(!v.pulseA&&v.elapsed>=.48){v.pulseA=true;shockwave(v.x,v.y,'#9aa7ff',340,.85,7);spawnParticle(v.x,v.y,'#b7c5ff',24,260,6);state.camera.shake=Math.max(state.camera.shake,18);state.flash=Math.max(state.flash,.22);}if(!v.pulseB&&v.elapsed>=1.18){v.pulseB=true;shockwave(v.x,v.y,'#ffffff',470,1.05,5);state.camera.shake=Math.max(state.camera.shake,11);state.flash=Math.max(state.flash,.16);}if(v.elapsed>=v.duration)finalizeStageComplete();};
  window.drawStageVictoryCinematic=function(){const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;const p=worldToScreen(v.x,v.y),progress=clamp(v.elapsed/v.duration,0,1),burst=clamp(v.elapsed/.85,0,1),fade=1-clamp((v.elapsed-2.25)/.60,0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(p.x,p.y);for(let i=0;i<14;i++){const a=i/14*TAU+v.elapsed*.34,inner=24+burst*25,outer=58+burst*(125+(i%4)*16);ctx.globalAlpha=(.62-progress*.30)*fade;ctx.strokeStyle=i%3===0?'#ffffff':i%2?'#91a6ff':'#c0a8ff';ctx.lineWidth=1.2+(i%3)*.8;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}ctx.globalAlpha=Math.max(0,.9-progress*.45)*fade;const glow=ctx.createRadialGradient(0,0,0,0,0,120+burst*90);glow.addColorStop(0,'rgba(255,255,255,.95)');glow.addColorStop(.12,'rgba(190,210,255,.78)');glow.addColorStop(.42,'rgba(121,132,255,.22)');glow.addColorStop(1,'rgba(92,65,180,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,120+burst*90,0,TAU);ctx.fill();ctx.restore();ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';const reveal=clamp((v.elapsed-.70)/.50,0,1)*fade;ctx.globalAlpha=reveal;ctx.shadowBlur=28;ctx.shadowColor='#9aa7ff';ctx.fillStyle='#f4f7ff';ctx.font=`900 ${Math.round(clamp(vw*.04,28,54))}px "Black Han Sans",sans-serif`;ctx.fillText(v.elapsed<1.55?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw/2,vh*.27);ctx.restore();};
  window.stackfallRegisterStageRuntime=registerStageRuntime;window.stackfallStageRuntimeRegistry=registry;window.stackfallSpawnStageEnemy=spawnStageEnemy;window.stackfallSpawnStageBurst=spawnStageBurst;window.stackfallBeginStageVictory=beginStageVictory;window.stackfallStageBalanceDiagnostics=()=>{const run=stageRuntime();return run?{stageId:run.stage?.id,family:environmentFamily(run.stage),encounterPlan:stageEncounterPlan(run.stage).map(entry=>({...entry})),encountersTriggered:{...(run.encountersTriggered||{})},activeEncounters:activeStageEncounterCount(),encounterConcurrency:stageEncounterConcurrency(run.stage),spawnBudget:{...(run.lastSpawnBudget||{})},bossTier:Number(run.stage?.order)%6===0?'constellation':'stage'}:null;};

  function stageBossSignatureAlive(e,api){return!!(e&&!e.dead&&e.kind==='stage-boss'&&api?.isActive?.());}
  function stageBossSigLine(x1,y1,x2,y2,width,damage,color,life=.92){rawLine(x1,y1,x2,y2,width,damage,color,life,'boss-line');}
  function stageBossSignature(e,api){
    const id=e.eventKind,phase=Math.max(1,Math.min(3,Number(e.stagePhase)||1)),damage=Math.max(5,e.damage*.40),cycle=(e.stageSignatureCycle=(e.stageSignatureCycle||0)+1),pred=typeof predictedPlayer==='function'?predictedPlayer(135+phase*28):{x:player.x,y:player.y};
    const later=(ms,fn)=>scheduleWeaponAction(ms,()=>{if(stageBossSignatureAlive(e,api))fn();});
    if(id==='stage-01'){
      const base=Math.atan2(player.y-e.y,player.x-e.x)+Math.PI/4,lanes=4+phase;for(let i=0;i<lanes;i++)later(i*95,()=>{const off=(i-(lanes-1)/2)*74,a=base+(cycle%2?0:.34),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx;stageBossSigLine(pred.x-dx*390+nx*off,pred.y-dy*390+ny*off,pred.x+dx*390+nx*off,pred.y+dy*390+ny*off,15+phase*2,damage*.66,'#aebaff',.86);});
    }else if(id==='stage-02'){
      for(let ring=0;ring<3+phase;ring++)later(ring*165,()=>addCircle(pred.x,pred.y,68+ring*62,damage*(.58+ring*.06),'#ff91dc',.92+ring*.06));
      later(310,()=>fireRing(e,12+phase*4,142+phase*10,damage*.64,'#ffc0eb',e.phase*.12,5));
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
      later(620,()=>fireRing(e,16+phase*4,170+phase*10,damage*.52,'#ffd8f7',e.phase*.08,5));
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
  function updateStageBossSignatureLayer(enemy,dt,api){
    if(!enemy||enemy.dead)return;
    enemy.stageSignatureCd=(Number.isFinite(enemy.stageSignatureCd)?enemy.stageSignatureCd:3.2)-dt;
    if(enemy.stageSignatureCd>0)return;
    const order=Math.max(1,Number(api?.stage?.order)||Number(String(enemy.eventKind||'').slice(-2))||1),phase=Math.max(1,Math.min(3,Number(enemy.stagePhase)||1)),finale=order%6===0;
    enemy.stageSignatureCd=Math.max(finale?4.6:5.8,(finale?6.0:7.4)-phase*.46);
    stageBossSignature(enemy,api);
  }
  window.updateStageBossSkill=function(enemy,dt){
    const def=stageDefinition(enemy?.eventKind);if(!def?.bossSkill)return;
    const api=apiFor(stageRuntime()),result=def.bossSkill(enemy,dt,api);updateStageBossSignatureLayer(enemy,dt,api);return result;
  };
  window.handleStageBossDefeated=function(enemy){if(enemy?.kind==='stage-boss')beginStageVictory(enemy);};
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
  const baseMapEvents=window.updateMapEvents;if(typeof baseMapEvents==='function')window.updateMapEvents=function stageAwareMapEvents(dt){if(isStage())return;baseMapEvents(dt);};
  const baseReset=resetGame;resetGame=function stageAwareReset(){const config=window.stackfallCurrentRunConfig?.();baseReset();clearStageUi();if(config?.mode!=='stage'){state.stageRun=null;return;}const stage=config.stage,def=stageDefinition(stage?.id);if(!stage||!def){state.stageRun=null;return;}state.stageRun={stage,eventsTriggered:{},encountersTriggered:{},encounterBags:{},bossSpawned:false,bossId:null,completed:false,completedAt:null,resultShown:false,lastSpawnBudget:null};state.nextApexAt=Infinity;state.mapEventActive=null;state.entities.mapEvents.length=0;state.entities.enemies.length=0;state.entities.enemyProjectiles.length=0;state.realmTheme=def.theme||('stage-'+String(stage.order).padStart(2,'0'));state.spawnTimer=def.initialSpawnTimer??.7;for(const variant of def.startingVariants||[])spawnStageEnemy(stage.id,variant);showBossNotice(localized(stage.title),'STAGE '+String(stage.order).padStart(2,'0'));updateObjective(state.stageRun);def.onStart?.(apiFor(state.stageRun));};
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
    bossProfile:{form:'collapse-warden',eventVariant:'stage01-warden',nameKey:'stage01.boss',warningKey:'stage01.boss.warning',r:68,hp:1.34,speed:.94,damage:1.02,color:'#9aa7ff',xp:1.8,skillCd:1.8,burstCd:4.2,pulseCd:6.8,spawnRadius:650,spawnShockwave:190},
    bossSkill(e,dt,api){if(!e||e.dead)return;const hp=e.hp/Math.max(1,e.maxHp),phase=hp<.34?3:hp<.68?2:1,k=[1,.82,.67][phase-1],damage=Math.max(5,e.damage*.43);e.stagePhase=phase;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;if(e.skillCd<=0){e.skillCd=2.55;const aim=Math.atan2(player.y-e.y,player.x-e.x),shots=5+phase*2;for(let i=0;i<shots;i++)spawnEnemyProjectile(e.x,e.y,aim+(i-(shots-1)/2)*.11,218+phase*16,damage*.64,i%2?'#9aa7ff':'#d7e0ff',4.7,5,'constellation');}if(e.burstCd<=0){e.burstCd=5.4;const p=typeof predictedPlayer==='function'?predictedPlayer(125+phase*35):{x:player.x,y:player.y},half=150+phase*24,gap=Math.max(48,76-phase*8);rawLine(p.x-half,p.y,p.x-gap,p.y,18+phase*2,damage,'#879cff',.96,'boss-line');rawLine(p.x+gap,p.y,p.x+half,p.y,18+phase*2,damage,'#879cff',.96,'boss-line');rawLine(p.x,p.y-half,p.x,p.y-gap,18+phase*2,damage*.88,'#c2b4ff',1.08,'boss-line');rawLine(p.x,p.y+gap,p.x,p.y+half,18+phase*2,damage*.88,'#c2b4ff',1.08,'boss-line');}if(e.pulseCd<=0){e.pulseCd=7.6-phase*.45;if(typeof fireRingWithGaps==='function'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,16+phase*4,150+phase*12,damage*.72,'#b8c3ff',e.phase*.13,aim,.30-phase*.03,4.8);}else fireRing(e,14+phase*3,150+phase*12,damage*.68,'#b8c3ff',e.phase*.13,4.8);if(phase>=2)api.spawnBurst(phase===3?'bombardier':'dart',phase);}}
  });
})();