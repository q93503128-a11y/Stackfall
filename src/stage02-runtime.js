(()=>{
  const STAGE_ID='stage-02',objective=document.querySelector('#stageObjective');
  const localized=value=>value?.[GAME_SETTINGS.language]||value?.en||value?.ko||'';
  const variantData={
    shardling:{type:'grunt',color:'#7a8dff',hp:1.02,speed:1.04,damage:.96,r:.94,xp:1.04,name:'stage01.enemy.shardling'},
    dart:{type:'fast',color:'#8ee7ff',hp:.90,speed:1.18,damage:.98,r:1.00,xp:1.08,name:'stage01.enemy.dart'},
    'nebula-wisp':{type:'ranged',color:'#ff89d7',hp:.82,speed:1.08,damage:.94,r:.92,xp:1.18,name:'stage02.enemy.wisp'},
    bombardier:{type:'ranged',color:'#b58cff',hp:1.16,speed:.94,damage:1.02,r:1.06,xp:1.20,name:'stage01.enemy.bombardier'},
    bulwark:{type:'tank',color:'#7380b8',hp:1.52,speed:.84,damage:1.08,r:1.10,xp:1.38,name:'stage01.enemy.bulwark'}
  };
  const isStage=()=>window.stackfallIsStageRun?.()===true&&state.runSelection?.stageId===STAGE_ID;
  const stageRuntime=()=>isStage()?state.stageRun:null;
  function spawnStageEnemy(variant='shardling',origin=null){
    const data=variantData[variant]||variantData.shardling;if(!makeEnemyRoom('normal'))return null;
    const cfg=enemyConfig(data.type),angle=Math.random()*TAU,radius=Math.min(Math.max(vw,vh)*.52,700)+rand(55,135),enemy={
      id:state.nextId++,type:data.type,kind:'stage',variant:null,stageVariant:variant,eventKind:STAGE_ID,name:tr(data.name),
      x:origin?.x??player.x+Math.cos(angle)*radius,y:origin?.y??player.y+Math.sin(angle)*radius,
      r:cfg.r*data.r,hp:cfg.hp*data.hp,maxHp:0,speed:cfg.speed*data.speed,damage:cfg.damage*data.damage,color:data.color,xp:cfg.xp*data.xp,
      hit:0,dead:false,phase:Math.random()*TAU,skillCd:999,burstCd:999,pulseCd:999,rangedCd:data.type==='ranged'?rand(.72,1.20):999,
      strafeDir:Math.random()<.5?-1:1,dash:0,dashX:0,dashY:0
    };
    enemy.maxHp=enemy.hp;state.entities.enemies.push(enemy);return enemy;
  }
  function spawnBurst(variant,count){
    for(let i=0;i<count;i++){const a=i/Math.max(1,count)*TAU+Math.random()*.18,r=rand(620,800);spawnStageEnemy(variant,{x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r});}
  }
  function poolAt(time){
    if(time<120)return[['shardling',.58],['dart',.42]];
    if(time<240)return[['shardling',.40],['dart',.30],['nebula-wisp',.30]];
    if(time<420)return[['shardling',.29],['dart',.25],['nebula-wisp',.28],['bombardier',.18]];
    return[['shardling',.22],['dart',.22],['nebula-wisp',.26],['bombardier',.18],['bulwark',.12]];
  }
  function choose(pool){let roll=Math.random(),sum=0;for(const [variant,weight]of pool){sum+=weight;if(roll<=sum)return variant;}return pool[pool.length-1][0];}
  function ionShear(deep=false){
    showBossNotice(deep?tr('stage02.event.deep'):tr('stage02.event.shear'),tr('stage02.event.warning'));
    const waves=deep?5:3,damage=9+Math.min(11,state.level*.30);
    for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(deep?430:520),()=>{
      if(!isStage()||state.mode!=='playing')return;
      const p=typeof predictedPlayer==='function'?predictedPlayer(90+wave*28):{x:player.x,y:player.y},a=(wave%2?.58:-.58)+(deep?wave*.16:wave*.10),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,half=330,gap=deep?54:68,offset=(wave-(waves-1)/2)*(deep?36:42);
      const cx=p.x+nx*offset,cy=p.y+ny*offset;
      rawLine(cx-dx*half,cy-dy*half,cx-dx*gap,cy-dy*gap,16+(deep?4:0),damage*(deep?1.02:.86),deep?'#ff7bd5':'#78e5ff',.96+wave*.05,'boss-line');
      rawLine(cx+dx*gap,cy+dy*gap,cx+dx*half,cy+dy*half,16+(deep?4:0),damage*(deep?1.02:.86),deep?'#ff7bd5':'#78e5ff',.96+wave*.05,'boss-line');
      if(deep&&wave%2===0)addCircle(p.x,p.y,62+wave*5,damage*.72,'#d59cff',.92);
    });
  }
  function spawnBoss(){
    const run=stageRuntime();if(!run||run.bossSpawned||!makeEnemyRoom('boss'))return null;
    const cfg=enemyConfig('boss'),stage=run.stage,angle=-Math.PI/2,radius=Math.min(Math.max(vw,vh)*.50,660);
    const e={id:state.nextId++,type:'boss',kind:'stage-boss',variant:'nebula-heart',eliteForm:'nebula-heart',eventKind:STAGE_ID,eventVariant:'stage02-heart',name:localized(stage.boss?.name)||tr('stage02.boss'),
      x:player.x+Math.cos(angle)*radius,y:player.y+Math.sin(angle)*radius,r:64,hp:cfg.hp*1.52,maxHp:0,speed:cfg.speed*.82,damage:cfg.damage*1.08,color:'#ff8fd8',xp:cfg.xp*1.95,
      hit:0,dead:false,phase:Math.random()*TAU,skillCd:1.55,burstCd:4.4,pulseCd:6.7,rangedCd:999,strafeDir:1,dash:0,dashX:0,dashY:0,stagePhase:1,controlImmune:true};
    e.maxHp=e.hp;state.entities.enemies.push(e);state.bossActiveId=e.id;state.bossIndex++;run.bossSpawned=true;run.bossId=e.id;
    showBossNotice(e.name,tr('stage02.boss.warning'));audio.boss();shockwave(e.x,e.y,e.color,205,.76,5);return e;
  }
  function triggerEvent(event){
    const run=stageRuntime();if(!run||run.eventsTriggered[event.id])return;run.eventsTriggered[event.id]=true;
    if(event.kind==='hazard'){ionShear(event.variant==='deep-shear');return;}
    if(event.kind==='boss'){spawnBoss();return;}
    if(event.kind==='wave'){
      const label=event.variant==='nebula-wisp'?tr('stage02.event.bloom'):tr('stage01.event.bombardment');
      showBossNotice(label,tr('stage02.event.fixed'));spawnBurst(event.variant,event.count||5);
    }
  }
  function updateObjective(run){
    if(!objective)return;const boss=run.bossId?state.entities.enemies.find(e=>!e.dead&&e.id===run.bossId):null;
    if(!boss){objective.classList.add('hidden');return;}objective.textContent=tr('stage02.objective.boss');objective.classList.remove('hidden');
  }
  function updateStage(dt){
    const run=stageRuntime();if(!run||run.completed)return;updateObjective(run);
    for(const event of run.stage.fixedEvents)if(state.time>=event.at&&!run.eventsTriggered[event.id])triggerEvent(event);
    if(!run.bossSpawned&&state.time>=run.stage.boss.spawnAt)spawnBoss();
    if(run.bossSpawned)return;
    const active=state.entities.enemies.filter(e=>!e.dead&&e.kind!=='stage-boss').length,cap=state.time>=420?52:state.time>=240?44:38;
    state.spawnTimer-=dt;if(state.spawnTimer>0||active>=cap)return;
    const rate=Math.max(.50,1.24-state.time*.00125),count=state.time>=420?2:state.time>=270&&Math.random()<.40?2:1;state.spawnTimer=rate;
    const pool=poolAt(state.time);for(let i=0;i<count;i++)spawnStageEnemy(choose(pool));
  }
  window.updateStage02BossSkill=function(e,dt){
    if(!e||e.dead||e.eventVariant!=='stage02-heart')return;
    const hp=e.hp/Math.max(1,e.maxHp),phase=hp<.32?3:hp<.66?2:1,k=[1,.82,.66][phase-1],damage=Math.max(5,e.damage*.42);e.stagePhase=phase;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;
    if(e.skillCd<=0){
      e.skillCd=2.30;const aim=Math.atan2(player.y-e.y,player.x-e.x),shots=8+phase*2;
      for(let i=0;i<shots;i++){const a=aim+(i-(shots-1)/2)*(.075+phase*.006);spawnEnemyProjectile(e.x,e.y,a,205+phase*18,damage*.62,i%2?'#ff8fd8':'#8cecff',4.9,5,'rune');}
    }
    if(e.burstCd<=0){
      e.burstCd=5.0;const p=typeof predictedPlayer==='function'?predictedPlayer(120+phase*34):{x:player.x,y:player.y},count=phase===3?4:3;
      for(let i=0;i<count;i++){const a=(i/count)*TAU+e.phase*.08,dx=Math.cos(a),dy=Math.sin(a),half=260+phase*28,gap=58-phase*6;rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,18+phase*2,damage*.92,i%2?'#ff76ce':'#8cecff',1.0+i*.06,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,18+phase*2,damage*.92,i%2?'#ff76ce':'#8cecff',1.0+i*.06,'boss-line');}
    }
    if(e.pulseCd<=0){
      e.pulseCd=7.3-phase*.5;if(typeof fireRingWithGaps==='function'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,18+phase*5,155+phase*14,damage*.70,'#d9a7ff',e.phase*.11,aim,.28-phase*.025,4.9);}else fireRing(e,16+phase*4,155+phase*14,damage*.68,'#d9a7ff',e.phase*.11,4.9);
      if(phase>=2)spawnBurst('nebula-wisp',phase===3?3:2);
    }
  };
  const baseDefeated=window.handleStageBossDefeated;
  window.handleStageBossDefeated=function(enemy){if(enemy?.eventVariant==='stage02-heart'){window.stackfallBeginStageVictory?.(enemy);return;}baseDefeated?.(enemy);};
  const previousSpawning=updateSpawning;
  updateSpawning=function stage02AwareSpawning(dt){if(isStage()){updateStage(dt);return;}previousSpawning(dt);};
  const previousMapEvents=window.updateMapEvents;
  if(typeof previousMapEvents==='function')window.updateMapEvents=function stage02AwareMapEvents(dt){if(isStage())return;previousMapEvents(dt);};
  const previousReset=resetGame;
  resetGame=function stage02AwareReset(){
    const config=window.stackfallCurrentRunConfig?.();previousReset();
    if(config?.mode!=='stage'||config.stage?.id!==STAGE_ID)return;
    const stage=config.stage;state.stageRun={stage,eventsTriggered:{},bossSpawned:false,bossId:null,completed:false,completedAt:null,resultShown:false};state.nextApexAt=Infinity;state.mapEventActive=null;state.entities.mapEvents.length=0;state.entities.enemies.length=0;state.entities.enemyProjectiles.length=0;state.realmTheme='stage-02';state.spawnTimer=.68;
    spawnStageEnemy('shardling');spawnStageEnemy('dart');spawnStageEnemy('dart');showBossNotice(localized(stage.title),'STAGE 02');updateObjective(state.stageRun);
  };
  window.stackfallSpawnStage02Enemy=spawnStageEnemy;
})();