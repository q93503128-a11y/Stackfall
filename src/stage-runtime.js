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
  function stageMinibossThresholds(stage){
    return Number(stage?.order)%6===0?[.32,.62]:[.46];
  }
  function activeStageMiniboss(){
    return state.entities.enemies.find(enemy=>enemy&&!enemy.dead&&enemy.type==='mini'&&enemy.kind==='stage-mini')||null;
  }
  function spawnStageMiniboss(index){
    const run=stageRuntime();if(!run||run.bossSpawned||activeStageMiniboss())return null;
    const enemy=spawnEnemy('mini');if(!enemy)return null;
    const order=Math.max(1,Number(run.stage.order)||1),finale=order%6===0,hpScale=1+Math.min(.24,(order-1)*.010)+(finale?.08:0),damageScale=1+Math.min(.14,(order-1)*.006);
    const members=enemy.twinGroup?state.entities.enemies.filter(member=>member&&!member.dead&&member.twinGroup===enemy.twinGroup):[enemy];
    for(const member of members){
      member.kind='stage-mini';member.eventKind=run.stage.id;member.stageMinibossIndex=index;member.controlImmune=false;
      member.hp*=hpScale;member.maxHp=member.hp;member.damage*=damageScale;member.xp*=1.10;
    }
    showBossNotice(enemy.name,finale?'CONSTELLATION GUARD':'STAGE MID-BOSS');
    return enemy;
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
      id:state.nextId++,type:'boss',kind:'stage-boss',stageBossTier:Number(stage.order)%6===0?'constellation':'stage',variant:profile.form,eliteForm:profile.form,eventKind:stage.id,eventVariant:profile.eventVariant,name:localized(stage.boss?.name)||tr(profile.nameKey),
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
    const progress=clamp(state.time/Math.max(1,run.stage.boss.spawnAt),0,1),thresholds=stageMinibossThresholds(run.stage);
    run.minibossTriggered=run.minibossTriggered||{};
    for(let index=0;index<thresholds.length;index++)if(progress>=thresholds[index]&&!run.minibossTriggered[index]&&!activeStageMiniboss()){const spawned=spawnStageMiniboss(index);if(spawned)run.minibossTriggered[index]=true;break;}
    const active=liveNonBossCount(),authoredTime=progress*600,base=def.spawnProfile?.(authoredTime,apiFor(run))||{cap:38,rate:1,count:1},spawn=stageSpawnBudget(run.stage,progress,base);
    run.lastSpawnBudget={...spawn,active,progress};
    state.spawnTimer-=dt;if(state.spawnTimer>0||active>=spawn.cap)return;state.spawnTimer=Math.max(.25,spawn.rate);
    const pool=def.poolAt?.(authoredTime,apiFor(run))||[];for(let i=0;i<spawn.count;i++){const variant=chooseVariant(pool);if(variant)spawnStageEnemy(run.stage.id,variant);}
  }
  function finalizeStageComplete(){
    const run=stageRuntime();if(!run||run.resultShown)return;run.resultShown=true;const clearTime=run.completedAt||state.time;state.stageVictory=null;state.mode='stageComplete';state.runSerial++;state.pendingActions.length=0;clearRunUiActions?.();ui.touch.classList.add('hidden');ui.hud.classList.add('hidden');objective?.classList.add('hidden');
    const coreCashout=window.stackfallCashOutAwakeningCores?.()||{cores:0,stardust:0},result=window.stackfallRecordStageClear?.(run.stage.id,clearTime)||{newWeapons:[],currency:{}};window.stackfallRecordRun?.(state.kills||0);completeTitle.textContent=tr('stageClear.title');completeName.textContent=localized(run.stage.title);completeTime.textContent=formatTime(clearTime);completeKills.textContent=String(state.kills);
    const rewards=[];if(result.newWeapons.length)rewards.push(tr('stageClear.unlock')+' · '+result.newWeapons.map(key=>weaponText(key).name).join(', '));if(result.currency?.stardust)rewards.push('✦ '+tr('currency.stardust')+' +'+result.currency.stardust);if(coreCashout.stardust)rewards.push('✦ '+tr('currency.stardust')+' +'+coreCashout.stardust+' · CORE ×'+coreCashout.cores);if(result.currency?.coreShard)rewards.push('◆ '+tr('currency.coreShard')+' +'+result.currency.coreShard);completeReward.textContent=rewards.length?rewards.join('   ·   '):tr('stageClear.rewardDone');
    window.renderStackfallMetaUi?.();completeScreen.classList.remove('hidden');window.renderStackfallGalaxyMap?.();audio.resonance();
  }
  function beginStageVictory(enemy){
    const run=stageRuntime();if(!run||run.completed||!enemy)return;run.completed=true;run.completedAt=state.time;run.victoryStarted=true;state.stageVictory={x:enemy.x,y:enemy.y,color:enemy.color||'#aeb9ff',elapsed:0,duration:VICTORY_DURATION,pulseA:false,pulseB:false};state.mode='stageVictory';state.pendingActions.length=0;clearRunUiActions?.();state.bossActiveId=null;ui.bossBar.classList.add('hidden');objective?.classList.add('hidden');state.entities.enemyProjectiles.length=0;state.entities.telegraphs.length=0;state.entities.beams.length=0;for(const key of['vacuumSeeds','phaseMines','guidedMissiles','gateNetworks'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;
    for(const other of state.entities.enemies){if(other!==enemy&&!other.dead){other.dead=true;spawnParticle(other.x,other.y,other.color||'#9aa7ff',4,120,3);}}state.camera.shake=Math.max(state.camera.shake,24);state.flash=Math.max(state.flash,.34);shockwave(enemy.x,enemy.y,'#eef2ff',220,.90,8);spawnParticle(enemy.x,enemy.y,'#ffffff',54,410,9);spawnParticle(enemy.x,enemy.y,enemy.color||'#9aa7ff',42,300,7);
  }
  window.updateStageVictoryCinematic=function(dt){const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;v.elapsed+=dt;if(!v.pulseA&&v.elapsed>=.48){v.pulseA=true;shockwave(v.x,v.y,'#9aa7ff',340,.85,7);spawnParticle(v.x,v.y,'#b7c5ff',24,260,6);state.camera.shake=Math.max(state.camera.shake,18);state.flash=Math.max(state.flash,.22);}if(!v.pulseB&&v.elapsed>=1.18){v.pulseB=true;shockwave(v.x,v.y,'#ffffff',470,1.05,5);state.camera.shake=Math.max(state.camera.shake,11);state.flash=Math.max(state.flash,.16);}if(v.elapsed>=v.duration)finalizeStageComplete();};
  window.drawStageVictoryCinematic=function(){const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;const p=worldToScreen(v.x,v.y),progress=clamp(v.elapsed/v.duration,0,1),burst=clamp(v.elapsed/.85,0,1),fade=1-clamp((v.elapsed-2.25)/.60,0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(p.x,p.y);for(let i=0;i<14;i++){const a=i/14*TAU+v.elapsed*.34,inner=24+burst*25,outer=58+burst*(125+(i%4)*16);ctx.globalAlpha=(.62-progress*.30)*fade;ctx.strokeStyle=i%3===0?'#ffffff':i%2?'#91a6ff':'#c0a8ff';ctx.lineWidth=1.2+(i%3)*.8;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}ctx.globalAlpha=Math.max(0,.9-progress*.45)*fade;const glow=ctx.createRadialGradient(0,0,0,0,0,120+burst*90);glow.addColorStop(0,'rgba(255,255,255,.95)');glow.addColorStop(.12,'rgba(190,210,255,.78)');glow.addColorStop(.42,'rgba(121,132,255,.22)');glow.addColorStop(1,'rgba(92,65,180,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,120+burst*90,0,TAU);ctx.fill();ctx.restore();ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';const reveal=clamp((v.elapsed-.70)/.50,0,1)*fade;ctx.globalAlpha=reveal;ctx.shadowBlur=28;ctx.shadowColor='#9aa7ff';ctx.fillStyle='#f4f7ff';ctx.font=`900 ${Math.round(clamp(vw*.04,28,54))}px "Black Han Sans",sans-serif`;ctx.fillText(v.elapsed<1.55?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw/2,vh*.27);ctx.restore();};
  window.stackfallRegisterStageRuntime=registerStageRuntime;window.stackfallStageRuntimeRegistry=registry;window.stackfallSpawnStageEnemy=spawnStageEnemy;window.stackfallSpawnStageBurst=spawnStageBurst;window.stackfallBeginStageVictory=beginStageVictory;window.stackfallStageBalanceDiagnostics=()=>{const run=stageRuntime();return run?{stageId:run.stage?.id,thresholds:stageMinibossThresholds(run.stage),minibossTriggered:{...(run.minibossTriggered||{})},spawnBudget:{...(run.lastSpawnBudget||{})},bossTier:Number(run.stage?.order)%6===0?'constellation':'stage'}:null;};
  window.updateStageBossSkill=function(enemy,dt){const def=stageDefinition(enemy?.eventKind);if(!def?.bossSkill)return;return def.bossSkill(enemy,dt,apiFor(stageRuntime()));};
  window.handleStageBossDefeated=function(enemy){if(enemy?.kind==='stage-boss')beginStageVictory(enemy);};
  const baseSpawning=updateSpawning;updateSpawning=function stageAwareSpawning(dt){if(isStage()){updateStage(dt);return;}baseSpawning(dt);};
  const baseMapEvents=window.updateMapEvents;if(typeof baseMapEvents==='function')window.updateMapEvents=function stageAwareMapEvents(dt){if(isStage())return;baseMapEvents(dt);};
  const baseReset=resetGame;resetGame=function stageAwareReset(){const config=window.stackfallCurrentRunConfig?.();baseReset();clearStageUi();if(config?.mode!=='stage'){state.stageRun=null;return;}const stage=config.stage,def=stageDefinition(stage?.id);if(!stage||!def){state.stageRun=null;return;}state.stageRun={stage,eventsTriggered:{},minibossTriggered:{},bossSpawned:false,bossId:null,completed:false,completedAt:null,resultShown:false,lastSpawnBudget:null};state.nextApexAt=Infinity;state.mapEventActive=null;state.entities.mapEvents.length=0;state.entities.enemies.length=0;state.entities.enemyProjectiles.length=0;state.realmTheme=def.theme||('stage-'+String(stage.order).padStart(2,'0'));state.spawnTimer=def.initialSpawnTimer??.7;for(const variant of def.startingVariants||[])spawnStageEnemy(stage.id,variant);showBossNotice(localized(stage.title),'STAGE '+String(stage.order).padStart(2,'0'));updateObjective(state.stageRun);def.onStart?.(apiFor(state.stageRun));};
  completeMap?.addEventListener('click',()=>{completeScreen.classList.add('hidden');showMainMenu();window.openStackfallGalaxyMap?.();});completeMenu?.addEventListener('click',()=>{completeScreen.classList.add('hidden');showMainMenu();});

  registerStageRuntime('stage-01',{
    theme:'stage-01',objectiveKey:'stage01.objective.boss',fixedEventKey:'stage01.event.fixed',initialSpawnTimer:.72,spawnRadius:690,spawnRadiusMin:45,spawnRadiusMax:125,burstRadiusMin:610,burstRadiusMax:780,startingVariants:['shardling','shardling','shardling'],
    variants:{
      shardling:{type:'grunt',color:'#7a8dff',hp:.92,speed:1.02,damage:.90,r:.92,xp:1,name:'stage01.enemy.shardling'},
      dart:{type:'fast',color:'#8ee7ff',hp:.84,speed:1.14,damage:.92,r:1.02,xp:1.05,name:'stage01.enemy.dart'},
      bombardier:{type:'ranged',color:'#b58cff',hp:1.12,speed:.92,damage:.98,r:1.06,xp:1.18,name:'stage01.enemy.bombardier',rangedMin:.8,rangedMax:1.35},
      bulwark:{type:'tank',color:'#7380b8',hp:1.48,speed:.82,damage:1.05,r:1.10,xp:1.35,name:'stage01.enemy.bulwark'}
    },
    poolAt(time){if(time<90)return[['shardling',1]];if(time<210)return[['shardling',.66],['dart',.34]];if(time<330)return[['shardling',.48],['dart',.27],['bombardier',.25]];if(time<450)return[['shardling',.38],['dart',.24],['bombardier',.22],['bulwark',.16]];return[['shardling',.31],['dart',.27],['bombardier',.24],['bulwark',.18]];},
    spawnProfile(time){const late=Math.max(0,time-240),cap=time>=450?48:time>=300?42:36,rate=Math.max(.50,Math.max(.56,1.36-time*.00135)-Math.min(.20,late/1800)),count=time>=450?2:time>=300&&Math.random()<.34?2:1;return{cap,rate,count};},
    waveLabel(event){return event.variant==='dart'?tr('stage01.event.rush'):event.variant==='bombardier'?tr('stage01.event.bombardment'):tr('stage01.event.wardenLine');},
    hazard(event,api){if(event.variant!=='collapse-pulse')return;showBossNotice(tr('stage01.event.collapse'),tr('stage01.event.warning'));const damage=8+Math.min(10,state.level*.28);for(let wave=0;wave<3;wave++)scheduleWeaponAction(wave*520,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(80+wave*45):{x:player.x,y:player.y},radius=58+wave*13;addCircle(p.x,p.y,radius,damage*(.82+wave*.12),wave===2?'#d7c2ff':'#8098ff',.88+wave*.08);const half=150+wave*26,gap=58+wave*5;rawLine(p.x-half,p.y,p.x-gap,p.y,14+wave*2,damage*.60,'#829dff',1.02+wave*.07,'boss-line');rawLine(p.x+gap,p.y,p.x+half,p.y,14+wave*2,damage*.60,'#829dff',1.02+wave*.07,'boss-line');});},
    bossProfile:{form:'collapse-warden',eventVariant:'stage01-warden',nameKey:'stage01.boss',warningKey:'stage01.boss.warning',r:68,hp:1.34,speed:.94,damage:1.02,color:'#9aa7ff',xp:1.8,skillCd:1.8,burstCd:4.2,pulseCd:6.8,spawnRadius:650,spawnShockwave:190},
    bossSkill(e,dt,api){if(!e||e.dead)return;const hp=e.hp/Math.max(1,e.maxHp),phase=hp<.34?3:hp<.68?2:1,k=[1,.82,.67][phase-1],damage=Math.max(5,e.damage*.43);e.stagePhase=phase;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;if(e.skillCd<=0){e.skillCd=2.55;const aim=Math.atan2(player.y-e.y,player.x-e.x),shots=5+phase*2;for(let i=0;i<shots;i++)spawnEnemyProjectile(e.x,e.y,aim+(i-(shots-1)/2)*.11,218+phase*16,damage*.64,i%2?'#9aa7ff':'#d7e0ff',4.7,5,'constellation');}if(e.burstCd<=0){e.burstCd=5.4;const p=typeof predictedPlayer==='function'?predictedPlayer(125+phase*35):{x:player.x,y:player.y},half=150+phase*24,gap=Math.max(48,76-phase*8);rawLine(p.x-half,p.y,p.x-gap,p.y,18+phase*2,damage,'#879cff',.96,'boss-line');rawLine(p.x+gap,p.y,p.x+half,p.y,18+phase*2,damage,'#879cff',.96,'boss-line');rawLine(p.x,p.y-half,p.x,p.y-gap,18+phase*2,damage*.88,'#c2b4ff',1.08,'boss-line');rawLine(p.x,p.y+gap,p.x,p.y+half,18+phase*2,damage*.88,'#c2b4ff',1.08,'boss-line');}if(e.pulseCd<=0){e.pulseCd=7.6-phase*.45;if(typeof fireRingWithGaps==='function'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,16+phase*4,150+phase*12,damage*.72,'#b8c3ff',e.phase*.13,aim,.30-phase*.03,4.8);}else fireRing(e,14+phase*3,150+phase*12,damage*.68,'#b8c3ff',e.phase*.13,4.8);if(phase>=2)api.spawnBurst(phase===3?'bombardier':'dart',phase);}}
  });
})();