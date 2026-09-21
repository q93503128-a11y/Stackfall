(()=>{
  const STAGE_ID='stage-01',VICTORY_DURATION=2.85;
  const objective=document.querySelector('#stageObjective');
  const completeScreen=document.querySelector('#stageCompleteScreen');
  const completeTitle=document.querySelector('#stageCompleteTitle');
  const completeName=document.querySelector('#stageCompleteName');
  const completeTime=document.querySelector('#stageCompleteTime');
  const completeKills=document.querySelector('#stageCompleteKills');
  const completeReward=document.querySelector('#stageCompleteReward');
  const completeMap=document.querySelector('#stageCompleteMapBtn');
  const completeMenu=document.querySelector('#stageCompleteMenuBtn');
  const localized=value=>value?.[GAME_SETTINGS.language]||value?.en||value?.ko||'';
  const variantData={
    shardling:{type:'grunt',color:'#7a8dff',hp:.92,speed:1.02,damage:.90,r:.92,xp:1,name:'stage01.enemy.shardling'},
    dart:{type:'fast',color:'#8ee7ff',hp:.84,speed:1.14,damage:.92,r:1.02,xp:1.05,name:'stage01.enemy.dart'},
    bombardier:{type:'ranged',color:'#b58cff',hp:1.12,speed:.92,damage:.98,r:1.06,xp:1.18,name:'stage01.enemy.bombardier'},
    bulwark:{type:'tank',color:'#7380b8',hp:1.48,speed:.82,damage:1.05,r:1.10,xp:1.35,name:'stage01.enemy.bulwark'}
  };
  const isStage=()=>window.stackfallIsStageRun?.()===true&&state.runSelection?.stageId===STAGE_ID;
  function stageRuntime(){return isStage()?state.stageRun:null;}
  function clearStageUi(){objective?.classList.add('hidden');completeScreen?.classList.add('hidden');state.stageVictory=null;}
  function spawnStageEnemy(variant='shardling',origin=null){
    const data=variantData[variant]||variantData.shardling;if(!makeEnemyRoom('normal'))return null;
    const cfg=enemyConfig(data.type),angle=Math.random()*TAU,radius=Math.min(Math.max(vw,vh)*.52,690)+rand(45,125),enemy={
      id:state.nextId++,type:data.type,kind:'stage',variant:null,stageVariant:variant,eventKind:STAGE_ID,name:tr(data.name),
      x:origin?.x??player.x+Math.cos(angle)*radius,y:origin?.y??player.y+Math.sin(angle)*radius,
      r:cfg.r*data.r,hp:cfg.hp*data.hp,maxHp:0,speed:cfg.speed*data.speed,damage:cfg.damage*data.damage,color:data.color,xp:cfg.xp*data.xp,
      hit:0,dead:false,phase:Math.random()*TAU,skillCd:999,burstCd:999,pulseCd:999,rangedCd:data.type==='ranged'?rand(.8,1.35):999,
      strafeDir:Math.random()<.5?-1:1,dash:0,dashX:0,dashY:0
    };
    enemy.maxHp=enemy.hp;state.entities.enemies.push(enemy);return enemy;
  }
  function spawnStageBurst(variant,count){
    for(let i=0;i<count;i++){const a=i/Math.max(1,count)*TAU+Math.random()*.16,r=rand(610,780);spawnStageEnemy(variant,{x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r});}
  }
  function stagePoolAt(time){
    if(time<90)return[['shardling',1]];
    if(time<210)return[['shardling',.66],['dart',.34]];
    if(time<330)return[['shardling',.48],['dart',.27],['bombardier',.25]];
    if(time<450)return[['shardling',.38],['dart',.24],['bombardier',.22],['bulwark',.16]];
    return[['shardling',.31],['dart',.27],['bombardier',.24],['bulwark',.18]];
  }
  function chooseVariant(pool){
    let roll=Math.random(),sum=0;for(const [variant,weight]of pool){sum+=weight;if(roll<=sum)return variant;}return pool[pool.length-1][0];
  }
  function collapsePulse(){
    showBossNotice(tr('stage01.event.collapse'),tr('stage01.event.warning'));
    const damage=8+Math.min(10,state.level*.28);
    for(let wave=0;wave<3;wave++)scheduleWeaponAction(wave*520,()=>{
      if(!isStage()||state.mode!=='playing')return;
      const p=typeof predictedPlayer==='function'?predictedPlayer(80+wave*45):{x:player.x,y:player.y},radius=58+wave*13;
      addCircle(p.x,p.y,radius,damage*(.82+wave*.12),wave===2?'#d7c2ff':'#8098ff',.88+wave*.08);
      const half=150+wave*26,gap=58+wave*5;
      rawLine(p.x-half,p.y,p.x-gap,p.y,14+wave*2,damage*.60,'#829dff',1.02+wave*.07,'boss-line');
      rawLine(p.x+gap,p.y,p.x+half,p.y,14+wave*2,damage*.60,'#829dff',1.02+wave*.07,'boss-line');
    });
  }
  function spawnStageBoss(){
    const run=stageRuntime();if(!run||run.bossSpawned||!makeEnemyRoom('boss'))return null;
    const cfg=enemyConfig('boss'),stage=run.stage,angle=-Math.PI/2,radius=Math.min(Math.max(vw,vh)*.50,650);
    const e={id:state.nextId++,type:'boss',kind:'stage-boss',variant:'collapse-warden',eliteForm:'collapse-warden',eventKind:STAGE_ID,eventVariant:'stage01-warden',name:localized(stage.boss?.name)||tr('stage01.boss'),
      x:player.x+Math.cos(angle)*radius,y:player.y+Math.sin(angle)*radius,r:68,hp:cfg.hp*1.34,maxHp:0,speed:cfg.speed*.94,damage:cfg.damage*1.02,color:'#9aa7ff',xp:cfg.xp*1.8,
      hit:0,dead:false,phase:Math.random()*TAU,skillCd:1.8,burstCd:4.2,pulseCd:6.8,rangedCd:999,strafeDir:1,dash:0,dashX:0,dashY:0,stagePhase:1,controlImmune:true};
    e.maxHp=e.hp;state.entities.enemies.push(e);state.bossActiveId=e.id;state.bossIndex++;run.bossSpawned=true;run.bossId=e.id;
    showBossNotice(e.name,tr('stage01.boss.warning'));audio.boss();shockwave(e.x,e.y,e.color,190,.72,5);return e;
  }
  function triggerEvent(event){
    const run=stageRuntime();if(!run||run.eventsTriggered[event.id])return;run.eventsTriggered[event.id]=true;
    if(event.kind==='hazard'){collapsePulse();return;}
    if(event.kind==='boss'){spawnStageBoss();return;}
    if(event.kind==='wave'){
      const label=event.variant==='dart'?tr('stage01.event.rush'):event.variant==='bombardier'?tr('stage01.event.bombardment'):tr('stage01.event.wardenLine');
      showBossNotice(label,tr('stage01.event.fixed'));spawnStageBurst(event.variant,event.count||4);
    }
  }
  function updateObjective(run){
    if(!objective)return;
    const boss=run.bossId?state.entities.enemies.find(e=>!e.dead&&e.id===run.bossId):null;
    if(!boss){objective.classList.add('hidden');return;}
    objective.textContent=tr('stage01.objective.boss');objective.classList.remove('hidden');
  }
  function updateStage(dt){
    const run=stageRuntime();if(!run||run.completed)return;
    updateObjective(run);
    for(const event of run.stage.fixedEvents)if(state.time>=event.at&&!run.eventsTriggered[event.id])triggerEvent(event);
    if(!run.bossSpawned&&state.time>=run.stage.boss.spawnAt)spawnStageBoss();
    if(run.bossSpawned)return;
    const active=state.entities.enemies.filter(e=>!e.dead&&e.kind!=='stage-boss').length,cap=state.time>=450?48:state.time>=300?42:36;
    state.spawnTimer-=dt;if(state.spawnTimer>0||active>=cap)return;
    const late=Math.max(0,state.time-240),rate=Math.max(.56,1.36-state.time*.00135),count=state.time>=450?2:state.time>=300&&Math.random()<.34?2:1;
    state.spawnTimer=Math.max(.50,rate-Math.min(.20,late/1800));
    const pool=stagePoolAt(state.time);for(let i=0;i<count;i++)spawnStageEnemy(chooseVariant(pool));
  }
  function finalizeStageComplete(){
    const run=stageRuntime();if(!run||run.resultShown)return;run.resultShown=true;
    const clearTime=run.completedAt||state.time;state.stageVictory=null;state.mode='stageComplete';state.runSerial++;state.pendingActions.length=0;clearRunUiActions?.();
    ui.touch.classList.add('hidden');ui.hud.classList.add('hidden');objective?.classList.add('hidden');
    const result=window.stackfallRecordStageClear?.(run.stage.id,clearTime)||{newWeapons:[]};
    completeTitle.textContent=tr('stageClear.title');completeName.textContent=localized(run.stage.title);completeTime.textContent=formatTime(clearTime);completeKills.textContent=String(state.kills);
    if(result.newWeapons.length){const names=result.newWeapons.map(key=>weaponText(key).name).join(', ');completeReward.textContent=tr('stageClear.unlock')+' · '+names;}
    else completeReward.textContent=tr('stageClear.rewardDone');
    completeScreen.classList.remove('hidden');window.renderStackfallGalaxyMap?.();audio.resonance();
  }
  function beginStageVictory(enemy){
    const run=stageRuntime();if(!run||run.completed||!enemy)return;
    run.completed=true;run.completedAt=state.time;run.victoryStarted=true;
    state.stageVictory={x:enemy.x,y:enemy.y,color:enemy.color||'#aeb9ff',elapsed:0,duration:VICTORY_DURATION,pulseA:false,pulseB:false};
    state.mode='stageVictory';state.pendingActions.length=0;clearRunUiActions?.();state.bossActiveId=null;ui.bossBar.classList.add('hidden');objective?.classList.add('hidden');
    state.entities.enemyProjectiles.length=0;state.entities.telegraphs.length=0;state.entities.beams.length=0;
    for(const other of state.entities.enemies){if(other!==enemy&&!other.dead){other.dead=true;spawnParticle(other.x,other.y,other.color||'#9aa7ff',4,120,3);}}
    state.camera.shake=Math.max(state.camera.shake,24);state.flash=Math.max(state.flash,.34);
    shockwave(enemy.x,enemy.y,'#eef2ff',220,.90,8);spawnParticle(enemy.x,enemy.y,'#ffffff',54,410,9);spawnParticle(enemy.x,enemy.y,enemy.color||'#9aa7ff',42,300,7);
  }
  window.updateStageVictoryCinematic=function(dt){
    const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;
    v.elapsed+=dt;
    if(!v.pulseA&&v.elapsed>=.48){v.pulseA=true;shockwave(v.x,v.y,'#9aa7ff',340,.85,7);spawnParticle(v.x,v.y,'#b7c5ff',24,260,6);state.camera.shake=Math.max(state.camera.shake,18);state.flash=Math.max(state.flash,.22);}
    if(!v.pulseB&&v.elapsed>=1.18){v.pulseB=true;shockwave(v.x,v.y,'#ffffff',470,1.05,5);state.camera.shake=Math.max(state.camera.shake,11);state.flash=Math.max(state.flash,.16);}
    if(v.elapsed>=v.duration)finalizeStageComplete();
  };
  window.drawStageVictoryCinematic=function(){
    const v=state.stageVictory;if(state.mode!=='stageVictory'||!v)return;
    const p=worldToScreen(v.x,v.y),progress=clamp(v.elapsed/v.duration,0,1),burst=clamp(v.elapsed/.85,0,1),fade=1-clamp((v.elapsed-2.25)/.60,0,1);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(p.x,p.y);
    for(let i=0;i<14;i++){const a=i/14*TAU+v.elapsed*.34,inner=24+burst*25,outer=58+burst*(125+(i%4)*16);ctx.globalAlpha=(.62-progress*.30)*fade;ctx.strokeStyle=i%3===0?'#ffffff':i%2?'#91a6ff':'#c0a8ff';ctx.lineWidth=1.2+(i%3)*.8;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}
    ctx.globalAlpha=Math.max(0,.9-progress*.45)*fade;const glow=ctx.createRadialGradient(0,0,0,0,0,120+burst*90);glow.addColorStop(0,'rgba(255,255,255,.95)');glow.addColorStop(.12,'rgba(190,210,255,.78)');glow.addColorStop(.42,'rgba(121,132,255,.22)');glow.addColorStop(1,'rgba(92,65,180,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,120+burst*90,0,TAU);ctx.fill();ctx.restore();
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';const reveal=clamp((v.elapsed-.70)/.50,0,1)*fade;ctx.globalAlpha=reveal;ctx.shadowBlur=28;ctx.shadowColor='#9aa7ff';ctx.fillStyle='#f4f7ff';ctx.font='900 clamp(28px,4vw,54px) "Black Han Sans",sans-serif';ctx.fillText(v.elapsed<1.55?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw/2,vh*.27);ctx.restore();
  };
  window.updateStage01BossSkill=function(e,dt){
    if(!e||e.dead||e.eventVariant!=='stage01-warden')return;
    const hp=e.hp/Math.max(1,e.maxHp),phase=hp<.34?3:hp<.68?2:1,k=[1,.82,.67][phase-1],damage=Math.max(5,e.damage*.43);e.stagePhase=phase;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;
    if(e.skillCd<=0){e.skillCd=2.55;const aim=Math.atan2(player.y-e.y,player.x-e.x),shots=5+phase*2;for(let i=0;i<shots;i++)spawnEnemyProjectile(e.x,e.y,aim+(i-(shots-1)/2)*.11,218+phase*16,damage*.64,i%2?'#9aa7ff':'#d7e0ff',4.7,5,'constellation');}
    if(e.burstCd<=0){e.burstCd=5.4;const p=typeof predictedPlayer==='function'?predictedPlayer(125+phase*35):{x:player.x,y:player.y},half=150+phase*24,gap=Math.max(48,76-phase*8);rawLine(p.x-half,p.y,p.x-gap,p.y,18+phase*2,damage,'#879cff',.96,'boss-line');rawLine(p.x+gap,p.y,p.x+half,p.y,18+phase*2,damage,'#879cff',.96,'boss-line');rawLine(p.x,p.y-half,p.x,p.y-gap,18+phase*2,damage*.88,'#c2b4ff',1.08,'boss-line');rawLine(p.x,p.y+gap,p.x,p.y+half,18+phase*2,damage*.88,'#c2b4ff',1.08,'boss-line');}
    if(e.pulseCd<=0){e.pulseCd=7.6-phase*.45;if(typeof fireRingWithGaps==='function'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,16+phase*4,150+phase*12,damage*.72,'#b8c3ff',e.phase*.13,aim,.30-phase*.03,4.8);}else fireRing(e,14+phase*3,150+phase*12,damage*.68,'#b8c3ff',e.phase*.13,4.8);if(phase>=2)spawnStageBurst(phase===3?'bombardier':'dart',phase);}
  };
  window.handleStageBossDefeated=function(enemy){if(enemy?.eventVariant==='stage01-warden')beginStageVictory(enemy);};
  const baseSpawning=updateSpawning;
  updateSpawning=function stageAwareSpawning(dt){if(isStage()){updateStage(dt);return;}baseSpawning(dt);};
  const baseMapEvents=window.updateMapEvents;
  if(typeof baseMapEvents==='function')window.updateMapEvents=function stageAwareMapEvents(dt){if(isStage())return;baseMapEvents(dt);};
  const baseReset=resetGame;
  resetGame=function stageAwareReset(){
    const config=window.stackfallCurrentRunConfig?.();baseReset();clearStageUi();
    if(config?.mode!=='stage'||config.stage?.id!==STAGE_ID){state.stageRun=null;return;}
    const stage=config.stage;state.stageRun={stage,eventsTriggered:{},bossSpawned:false,bossId:null,completed:false,completedAt:null,resultShown:false};state.nextApexAt=Infinity;state.mapEventActive=null;state.entities.mapEvents.length=0;state.entities.enemies.length=0;state.entities.enemyProjectiles.length=0;state.realmTheme='stage-01';state.spawnTimer=.72;
    for(let i=0;i<3;i++)spawnStageEnemy('shardling');showBossNotice(localized(stage.title),'STAGE 01');updateObjective(state.stageRun);
  };
  completeMap?.addEventListener('click',()=>{completeScreen.classList.add('hidden');showMainMenu();window.openStackfallGalaxyMap?.();});
  completeMenu?.addEventListener('click',()=>{completeScreen.classList.add('hidden');showMainMenu();});
  window.stackfallSpawnStage01Enemy=spawnStageEnemy;
})();