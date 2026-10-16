(()=>{
  const STAGE_ID='stage-01';
  const STAGE_AUDIO_SOURCES=Object.freeze({
    ambient:'https://raw.githubusercontent.com/S-H-GAMELINKS/termfront/master/data/audio/sector.mp3',
    boss:'https://raw.githubusercontent.com/jarlah/dungeon-haskell/master/assets/music/boss.ogg',
    victory:'https://raw.githubusercontent.com/S-H-GAMELINKS/termfront/master/data/audio/victory.mp3'
  });

  const constellationForOrder=order=>order<=6?1:order<=12?2:3;
  const stageOrderFromTheme=theme=>{
    const match=String(theme||'').match(/^stage-(\d{2})$/);
    return match?Math.max(1,Math.min(18,Number(match[1])||1)):null;
  };
  const localText=(ko,en)=>GAME_SETTINGS.language==='ko'?ko:en;
  const stageOneActive=()=>window.stackfallIsStageRun?.()===true&&state.stageRun?.stage?.id===STAGE_ID;

  function constellationPalette(family){
    if(family===2)return{wash:'rgba(105,33,128,.105)',glow:'rgba(66,214,187,.055)',primary:'rgba(210,133,255,.30)',secondary:'rgba(111,232,207,.24)'};
    if(family===3)return{wash:'rgba(16,93,112,.095)',glow:'rgba(223,173,81,.045)',primary:'rgba(106,226,238,.26)',secondary:'rgba(229,184,100,.23)'};
    return{wash:'rgba(54,70,172,.10)',glow:'rgba(72,211,255,.055)',primary:'rgba(145,170,255,.29)',secondary:'rgba(99,224,255,.25)'};
  }

  // Endless remains the visual source of truth. Authored stages only tint and
  // decorate that same field at constellation granularity.
  drawStageWorldBackdrop=function drawConstellationStageBackdrop(order){
    drawSpaceBackground();
    const family=constellationForOrder(Math.max(1,Number(order)||1)),palette=constellationPalette(family),size=Math.max(vw,vh);
    ctx.save();
    const wash=ctx.createLinearGradient(0,0,vw,vh);wash.addColorStop(0,palette.wash);wash.addColorStop(.62,'rgba(0,0,0,0)');wash.addColorStop(1,palette.glow);ctx.fillStyle=wash;ctx.fillRect(0,0,vw,vh);
    const ambient=ctx.createRadialGradient(vw*.48,vh*.46,0,vw*.48,vh*.46,size*.72);ambient.addColorStop(0,palette.glow);ambient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ambient;ctx.fillRect(0,0,vw,vh);ctx.restore();
  };

  drawStageConstellationField=function drawSharedConstellationField(theme){
    const order=stageOrderFromTheme(theme);if(!order)return;
    const family=constellationForOrder(order),palette=constellationPalette(family),t=performance.now()/1000,px=player.x||0,py=player.y||0;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(family===1){
      ctx.lineWidth=1.35;
      for(let i=0;i<13;i++){
        const x=wrap(117+i*173-px*.12,2100)-100,y=wrap(83+i*109-py*.10,1450)-80,a=-.42+(i%5)*.17+t*.004*(i%2?1:-1),len=18+(i%4)*10;
        ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=.26+(i%3)*.035;ctx.strokeStyle=i%3===0?palette.secondary:palette.primary;ctx.beginPath();ctx.moveTo(-len*.72,-2);ctx.lineTo(-len*.12,-6);ctx.lineTo(len*.78,0);ctx.lineTo(-len*.08,6);ctx.closePath();ctx.stroke();ctx.restore();
      }
      ctx.globalAlpha=.13;ctx.strokeStyle=palette.secondary;ctx.setLineDash([18,15]);for(let i=0;i<3;i++){const x=wrap(430+i*690-px*.035,2300)-260,y=wrap(250+i*350-py*.025,1500)-170;ctx.beginPath();ctx.ellipse(x,y,150+i*32,56+i*11,.18+i*.17,.18,Math.PI*1.72);ctx.stroke();}ctx.setLineDash([]);
    }else if(family===2){
      for(let i=0;i<9;i++){
        const x=wrap(130+i*241-px*.09,2200)-120,y=wrap(70+i*157-py*.075,1500)-100,r=24+(i%4)*11;
        ctx.globalAlpha=.12+(i%3)*.025;ctx.strokeStyle=i%2?palette.primary:palette.secondary;ctx.lineWidth=1.35;ctx.beginPath();ctx.ellipse(x,y,r*1.7,r*.55,(i*.41+t*.006)%TAU,0,TAU);ctx.stroke();
        ctx.globalAlpha=.16;ctx.fillStyle=i%2?palette.secondary:palette.primary;ctx.beginPath();ctx.arc(x+Math.cos(i)*r*.7,y+Math.sin(i)*r*.35,1.8+(i%3),0,TAU);ctx.fill();
      }
      ctx.globalAlpha=.10;ctx.strokeStyle=palette.primary;ctx.lineWidth=2;for(let lane=0;lane<3;lane++){const y=vh*(.25+lane*.24)+Math.sin(t*.13+lane)*18;ctx.beginPath();ctx.moveTo(-80,y);ctx.bezierCurveTo(vw*.26,y-95,vw*.66,y+90,vw+90,y-18);ctx.stroke();}
    }else{
      ctx.lineWidth=1;for(let i=0;i<10;i++){
        const x=wrap(95+i*223-px*.10,2100)-100,y=wrap(65+i*137-py*.085,1420)-80,w=22+(i%3)*11,h=13+(i%2)*7;
        ctx.globalAlpha=.13+(i%3)*.025;ctx.strokeStyle=i%3===0?palette.secondary:palette.primary;ctx.strokeRect(x-w,y-h,w*2,h*2);ctx.beginPath();ctx.moveTo(x-w-30,y);ctx.lineTo(x-w,y);ctx.moveTo(x+w,y);ctx.lineTo(x+w+30,y);ctx.stroke();
        ctx.globalAlpha=.24;ctx.fillStyle=i%3===0?palette.secondary:palette.primary;ctx.beginPath();ctx.arc(x,y,2.2,0,TAU);ctx.fill();
      }
      const scan=wrap(t*23-py*.16,vh+180)-90;ctx.globalAlpha=.07;ctx.fillStyle=palette.primary;ctx.fillRect(0,scan,vw,1.5);
    }
    ctx.restore();
  };

  const stageAudio=(()=>{
    const make=(src,loop)=>{const element=new Audio();element.src=src;element.preload='none';element.loop=loop;element.crossOrigin='anonymous';return element;};
    const tracks={ambient:make(STAGE_AUDIO_SOURCES.ambient,true),boss:make(STAGE_AUDIO_SOURCES.boss,true),victory:make(STAGE_AUDIO_SOURCES.victory,false)};
    const baseVolume={ambient:.34,boss:.31,victory:.42};
    let active=null,fadeSerial=0,victoryLock=false;
    const enabled=()=>GAME_SETTINGS?.audio?.master!==false&&GAME_SETTINGS?.audio?.ambient!==false;
    const volume=key=>clamp(Number(GAME_SETTINGS?.audio?.volume?.master??.9),0,1)*clamp(Number(GAME_SETTINGS?.audio?.volume?.ambient??.58),0,1)*baseVolume[key];
    const safePlay=element=>{const result=element.play();if(result?.catch)result.catch(()=>{});};
    const pauseAll=except=>{for(const[key,track]of Object.entries(tracks))if(key!==except){track.pause();if(key!=='victory')track.currentTime=0;}};
    function switchTo(key,immediate=false){
      if(!tracks[key]||!enabled()){stop();return;}if(active===key&&!tracks[key].paused){tracks[key].volume=volume(key);return;}
      const next=tracks[key],previous=active?tracks[active]:null,serial=++fadeSerial;active=key;if(key!=='victory'&&next.ended)next.currentTime=0;next.volume=immediate?volume(key):0;safePlay(next);
      if(immediate){pauseAll(key);return;}
      const started=performance.now(),duration=460,from=previous&&!previous.paused?previous.volume:0,target=volume(key);
      const step=now=>{if(serial!==fadeSerial)return;const p=clamp((now-started)/duration,0,1);next.volume=target*p;if(previous&&previous!==next)previous.volume=from*(1-p);if(p<1)requestAnimationFrame(step);else if(previous&&previous!==next){previous.pause();if(previous!==tracks.victory)previous.currentTime=0;}};requestAnimationFrame(step);
    }
    function stop(){active=null;victoryLock=false;++fadeSerial;for(const track of Object.values(tracks)){track.pause();track.currentTime=0;}}
    function sync(){
      if(!enabled()){stop();return;}const stageOne=window.stackfallIsStageRun?.()===true&&state.runSelection?.stageId===STAGE_ID;
      if(!stageOne||!['playing','cinematic','stageVictory'].includes(state.mode)){stop();return;}
      if(victoryLock&&state.mode==='stageVictory'){tracks.victory.volume=volume('victory');return;}
      const run=state.stageRun,bossLive=!!run?.bossSpawned&&!run?.completed;
      switchTo(bossLive?'boss':'ambient');
    }
    function victory(){victoryLock=true;++fadeSerial;for(const[key,track]of Object.entries(tracks)){track.pause();track.currentTime=0;if(key!=='victory')track.volume=0;}active='victory';tracks.victory.volume=volume('victory');safePlay(tracks.victory);}
    const timer=setInterval(sync,650);window.addEventListener('pagehide',()=>{clearInterval(timer);stop();},{once:true});
    return{playAmbient:()=>{victoryLock=false;switchTo('ambient');},playBoss:()=>{victoryLock=false;switchTo('boss');},playVictory:victory,sync,stop,sources:STAGE_AUDIO_SOURCES};
  })();
  window.STACKFALL_STAGE_AUDIO_SOURCES=STAGE_AUDIO_SOURCES;
  window.stackfallStageOneAudio=stageAudio;
  const previousSyncAmbient=typeof audio.syncAmbient==='function'?audio.syncAmbient.bind(audio):null;
  audio.syncAmbient=function syncAmbientWithStageMusic(){previousSyncAmbient?.();stageAudio.sync();};

  const STAGE_ONE_GIMMICK=Object.freeze({startAt:80,interval:78,waveEvery:0,accelerate:.08});
  const STAGE_ONE_ENEMY_SET=Object.freeze([
    Object.freeze({id:'shardling',type:'grunt',unlockAt:0}),
    Object.freeze({id:'dart',type:'fast',unlockAt:34}),
    Object.freeze({id:'bombardier',type:'ranged',unlockAt:118}),
    Object.freeze({id:'bulwark',type:'tank',unlockAt:205})
  ]);
  const STAGE_ONE_EVENTS=Object.freeze([
    Object.freeze({id:'route-rush',at:52,kind:'wave',variant:'dart',count:5}),
    Object.freeze({id:'outer-battery',at:145,kind:'wave',variant:'bombardier',count:4}),
    Object.freeze({id:'route-sweep-fixed',at:196,kind:'hazard',variant:'route-shard-sweep'}),
    Object.freeze({id:'guard-line',at:238,kind:'wave',variant:'bulwark',count:3}),
    Object.freeze({id:'final-boss',at:300,kind:'boss',variant:'orbit-warden'})
  ]);

  const currentStage=window.stackfallStageById?.(STAGE_ID);
  if(currentStage){
    const stageOne=Object.freeze({...currentStage,
      title:Object.freeze({ko:'외곽 항로',en:'Outer Route'}),
      description:Object.freeze({
        ko:'붕괴한 외곽 항로를 돌파하는 첫 작전. 파편체의 속도와 사격 밀도가 단계적으로 증가하고, 주기적으로 전장을 가로지르는 항로 파편대를 피한 뒤 궤도 감시자를 격파한다.',
        en:'The first operation through a collapsed outer route. Enemy speed and fire density escalate in steps; evade route-wide shard sweeps, then destroy the Orbit Warden.'
      }),
      durationSeconds:300,estimatedMinutes:5,
      discoveries:Object.freeze({...currentStage.discoveries,gimmicks:Object.freeze(['route-shard-sweep']),events:Object.freeze(['route-rush','outer-battery','guard-line'])}),
      gimmick:STAGE_ONE_GIMMICK,
      enemySet:STAGE_ONE_ENEMY_SET,
      fixedEvents:STAGE_ONE_EVENTS,
      boss:Object.freeze({...currentStage.boss,id:'orbit-warden',spawnAt:300,name:Object.freeze({ko:'궤도 감시자',en:'Orbit Warden'})})
    });
    const previousLookup=window.stackfallStageById,updated=Object.freeze((window.STACKFALL_STAGE_CATALOG||[]).map(stage=>stage.id===STAGE_ID?stageOne:stage));
    window.STACKFALL_STAGE_CATALOG=updated;window.stackfallStageById=id=>String(id)===STAGE_ID?stageOne:previousLookup(id);
  }

  function hostileShot(x,y,angle,speed,damage,color,r=5,life=4,source='stage01-orbit'){
    return spawnEnemyProjectile(x,y,angle,speed,damage,color,r,life,source);
  }
  function aimedAngle(x,y,lead=.18){
    const tx=player.x+(Number(player.moveVX)||0)*lead,ty=player.y+(Number(player.moveVY)||0)*lead;
    return Math.atan2(ty-y,tx-x);
  }
  function aimedFan(enemy,count,spread,speed,damage,color,source,lead=.18){
    const center=aimedAngle(enemy.x,enemy.y,lead),step=count>1?spread/(count-1):0;
    for(let i=0;i<count;i++)hostileShot(enemy.x,enemy.y,center-spread*.5+step*i,speed,damage,color,5.2,4.5,source);
  }
  function radialBurst(enemy,count,speed,damage,color,offset=0,source='stage01-orbit-ring'){
    for(let i=0;i<count;i++)hostileShot(enemy.x,enemy.y,offset+i/count*TAU,speed,damage,color,4.8,4.8,source);
  }
  function satellitePositions(enemy,count,radius,phaseOffset=0){
    const t=(state.time||0)*(.72+(enemy.stagePhase||1)*.08)*(enemy.stage01OrbitDir||1)+phaseOffset,out=[];
    for(let i=0;i<count;i++){const a=t+i/count*TAU;out.push({x:enemy.x+Math.cos(a)*radius,y:enemy.y+Math.sin(a)*radius,a});}
    return out;
  }
  function satelliteVolley(enemy,count,speed,damage,color,source,lead=.24){
    const positions=satellitePositions(enemy,count,(Number(enemy.visualR)||90)*1.55);
    const tx=player.x+(Number(player.moveVX)||0)*lead,ty=player.y+(Number(player.moveVY)||0)*lead;
    for(const p of positions)hostileShot(p.x,p.y,Math.atan2(ty-p.y,tx-p.x),speed,damage,color,5.0,4.4,source);
  }
  function satelliteLock(enemy,count,delay,speed,damage){
    const radius=(Number(enemy.visualR)||90)*1.55,positions=satellitePositions(enemy,count,radius),tx=player.x+(Number(player.moveVX)||0)*.32,ty=player.y+(Number(player.moveVY)||0)*.32;
    for(const p of positions){
      if(state.entities.beams.length<entityCap('beams'))state.entities.beams.push({x1:p.x,y1:p.y,x2:tx,y2:ty,life:delay,max:delay,width:1.25,color:'#7de8ff'});
    }
    scheduleWeaponAction(delay*1000,()=>{
      if(!stageOneActive()||enemy.dead||enemy.kind!=='stage-boss')return;
      const targetX=player.x+(Number(player.moveVX)||0)*.18,targetY=player.y+(Number(player.moveVY)||0)*.18;
      for(const p of satellitePositions(enemy,count,radius))hostileShot(p.x,p.y,Math.atan2(targetY-p.y,targetX-p.x),speed,damage,'#87eaff',5.5,4.2,'stage01-orbit-lock');
      state.camera.shake=Math.max(state.camera.shake,4);
    });
  }

  function routeShardSweep(event,api){
    const run=api?.run;if(!run||run.bossSpawned||!stageOneActive())return;
    if(state.mapEventActive||state.entities.enemies.some(enemy=>enemy&&!enemy.dead&&enemy.stageEncounter===true))return;
    const now=state.time||0;if(now-(Number(run.stage01LastSweep)||-999)<36)return;run.stage01LastSweep=now;
    const scale=window.stackfallStageEnvironmentCombatScale?.({order:1,progress:api.progress})||{damage:.72,speed:.9,warning:1.1};
    const seq=run.stage01SweepCount=(run.stage01SweepCount||0)+1,horizontal=seq%2===1,dir=seq%4<2?1:-1,compact=compactDevice();
    const spacing=compact?58:72,laneCount=compact?9:11,gapIndex=Math.floor(laneCount/2)+([-1,1,0][seq%3]||0),anchorX=player.x,anchorY=player.y,travel=Math.max(vw,vh)*.72+180,warning=Math.max(.62,.78*scale.warning);
    const boundaryA=(gapIndex-1.5-(laneCount-1)/2)*spacing,boundaryB=(gapIndex+1.5-(laneCount-1)/2)*spacing,half=travel*.84;
    const pushBeam=(x1,y1,x2,y2)=>{
      if(state.entities.beams.length>=entityCap('beams'))return;
      state.entities.beams.push({x1,y1,x2,y2,life:warning,max:warning,width:1.2,color:'#a8dfff'});
    };
    if(horizontal){
      pushBeam(anchorX-half,anchorY+boundaryA,anchorX+half,anchorY+boundaryA);
      pushBeam(anchorX-half,anchorY+boundaryB,anchorX+half,anchorY+boundaryB);
    }else{
      pushBeam(anchorX+boundaryA,anchorY-half,anchorX+boundaryA,anchorY+half);
      pushBeam(anchorX+boundaryB,anchorY-half,anchorX+boundaryB,anchorY+half);
    }
    addText(anchorX,anchorY-88,localText('항로 파편대 접근','ROUTE SHARD SWEEP'),'#bfefff',14);
    shockwave(anchorX,anchorY,'#7de8ff',92,warning,2);
    scheduleWeaponAction(warning*1000,()=>{
      if(!stageOneActive()||state.stageRun?.bossSpawned)return;
      const speed=330*scale.speed,damage=6.6*scale.damage,life=travel*2/speed+1.2,angle=horizontal?(dir>0?0:Math.PI):(dir>0?Math.PI/2:-Math.PI/2);
      for(let i=0;i<laneCount;i++){
        if(Math.abs(i-gapIndex)<=1)continue;
        const offset=(i-(laneCount-1)/2)*spacing,jitter=(i%2?1:-1)*8;
        const x=horizontal?anchorX-dir*travel:anchorX+offset+jitter,y=horizontal?anchorY+offset+jitter:anchorY-dir*travel;
        hostileShot(x,y,angle,speed,damage,'#c7e9ff',compact?8.5:10,life,'stage01-route-sweep');
      }
      state.camera.shake=Math.max(state.camera.shake,5);audio.stageAttack?.(STAGE_ID,'route-sweep');
    });
  }

  function updateStageOneActors(run,dt){
    if(!run||run.completed)return;
    const now=state.time||0;
    for(const enemy of state.entities.enemies){
      if(!enemy||enemy.dead||enemy.eventKind!==STAGE_ID||enemy.kind==='stage-boss')continue;
      if(enemy.stageEncounter===true){
        enemy.stage01EncounterCd=(Number(enemy.stage01EncounterCd)||rand(2.4,4.2))-dt;if(enemy.stage01EncounterCd>0)continue;
        if(enemy.stage01EncounterRole==='sentinel'){
          aimedFan(enemy,3,.34,300,4.2,'#9bdfff','stage01-sentinel',.16);enemy.stage01EncounterCd=4.4;
        }else if(enemy.stage01EncounterRole==='interceptor'){
          radialBurst(enemy,8,205,3.8,'#a79bff',(enemy.phase||0)*.18,'stage01-interceptor');enemy.stage01EncounterCd=5.1;
        }else if(enemy.stage01EncounterRole==='watch-core'){
          radialBurst(enemy,10,225,4.1,'#9d92ff',(enemy.stage01VolleyFlip=(enemy.stage01VolleyFlip||0)+.31),'stage01-watch-core');
          aimedFan(enemy,3,.26,315,4.5,'#82e6ff','stage01-watch-core-aim',.22);enemy.stage01EncounterCd=4.6;
        }
        continue;
      }
      enemy.stage01BaseSpeed??=enemy.speed;
      if(enemy.stageVariant==='dart'){
        enemy.stage01DashCd=(Number(enemy.stage01DashCd)||rand(1.5,2.4))-dt;
        if(enemy.stage01DashCd<=0){enemy.stage01DashCd=rand(2.7,3.4);enemy.stage01DashUntil=now+.42;spawnParticle(enemy.x,enemy.y,'#8ee7ff',5,105,2.5);}
        enemy.speed=enemy.stage01BaseSpeed*(now<(enemy.stage01DashUntil||0)?1.62:1);
      }else if(enemy.stageVariant==='bombardier'){
        enemy.stage01ExtraCd=(Number(enemy.stage01ExtraCd)||rand(2.6,4.0))-dt;
        if(enemy.stage01ExtraCd<=0&&Math.hypot(enemy.x-player.x,enemy.y-player.y)<900){
          const a=aimedAngle(enemy.x,enemy.y,.20);for(const off of[-.12,.12])hostileShot(enemy.x,enemy.y,a+off,245,3.4,'#c2a6ff',4.4,4.4,'stage01-bombardier-pair');
          enemy.stage01ExtraCd=rand(4.0,4.8);spawnParticle(enemy.x,enemy.y,'#b58cff',4,75,2.2);
        }
      }else if(enemy.stageVariant==='bulwark'){
        enemy.stage01ExtraCd=(Number(enemy.stage01ExtraCd)||rand(3.6,5.0))-dt;
        if(enemy.stage01ExtraCd<=0){
          radialBurst(enemy,4,165,3.2,'#8495d1',(enemy.phase||0)*.23,'stage01-bulwark-pulse');enemy.stage01ExtraCd=5.4;shockwave(enemy.x,enemy.y,'#7188ca',74,.36,2);
        }
      }
    }
  }

  const previousEliteSpawner=window.stackfallSpawnEliteForm;
  if(typeof previousEliteSpawner==='function'&&!previousEliteSpawner.__stage01Remodel){
    const stageOneEliteSpawner=function stageOneEliteSpawner(kind,form){
      const run=state.stageRun;
      if(stageOneActive()&&state.mode==='playing'&&!state.mapEventActive&&!run?.bossSpawned&&(kind==='mini'||kind==='boss')){
        const completed=Object.keys(run?.encountersTriggered||{}).length,index=Math.min(2,completed),mapped=kind==='boss'?'eclipse':index===0?'knight':'warden',enemy=previousEliteSpawner(kind,mapped);
        if(enemy){
          const role=kind==='boss'?'watch-core':index===0?'sentinel':'interceptor';
          enemy.stage01EncounterRole=role;
          enemy.name=role==='sentinel'?localText('항로 파수병','Route Sentinel'):role==='interceptor'?localText('궤도 차단자','Orbit Interceptor'):localText('전초 감시핵','Frontier Watch Core');
        }
        return enemy;
      }
      return previousEliteSpawner(kind,form);
    };
    stageOneEliteSpawner.__stage01Remodel=true;window.stackfallSpawnEliteForm=stageOneEliteSpawner;
  }

  function updateOrbitWarden(enemy,dt){
    if(!enemy||enemy.dead)return;
    const ratio=clamp(enemy.hp/Math.max(1,enemy.maxHp),0,1),phase=ratio>.68?1:ratio>.34?2:3;
    if(enemy.stagePhase!==phase){
      enemy.stagePhase=phase;enemy.stage01AttackCd=.55;enemy.stage01BurstCd=1.1;enemy.stage01LockCd=2.4;enemy.stage01OrbitDir*=-1;
      state.entities.enemyProjectiles.length=0;shockwave(enemy.x,enemy.y,phase===2?'#a59dff':'#79e5ff',230+phase*45,.72,5);spawnParticle(enemy.x,enemy.y,phase===2?'#a99dff':'#83e9ff',18+phase*4,235,5);
      state.camera.shake=Math.max(state.camera.shake,8+phase*2);state.flash=Math.max(state.flash,.08);enemy.contactSafeUntil=(state.time||0)+.35;
    }
    enemy.speed=enemy.stage01BaseSpeed*(phase===1?.92:phase===2?1.02:1.13);
    enemy.stage01AttackCd-=dt;enemy.stage01BurstCd-=dt;enemy.stage01LockCd-=dt;
    const damageScale=phase===1?.92:phase===2?1:1.06;
    if(enemy.stage01AttackCd<=0){
      if(phase===1)satelliteVolley(enemy,3,300,4.8*damageScale,'#82e6ff','stage01-warden-satellite',.20);
      else if(phase===2)aimedFan(enemy,5,.62,320,5.1*damageScale,'#9e91ff','stage01-warden-fan',.24);
      else{satelliteVolley(enemy,5,340,4.9*damageScale,'#80eaff','stage01-warden-satellite-fast',.28);aimedFan(enemy,3,.28,350,5.4*damageScale,'#aa9bff','stage01-warden-core',.30);}
      enemy.stage01AttackCd=phase===1?1.86:phase===2?1.55:1.34;
    }
    if(enemy.stage01BurstCd<=0){
      const count=phase===1?10:phase===2?12:14,speed=phase===1?215:phase===2?242:270,offset=(enemy.stage01RingOffset=(enemy.stage01RingOffset||0)+(phase===1?.23:.31));
      radialBurst(enemy,count,speed,(4.0+phase*.35)*damageScale,phase===1?'#8cecff':'#a99cff',offset,'stage01-warden-ring');enemy.stage01BurstCd=phase===1?5.6:phase===2?4.8:4.05;
    }
    if(enemy.stage01LockCd<=0){
      const count=phase+2,delay=phase===1?.62:phase===2?.54:.46;
      satelliteLock(enemy,count,delay,phase===1?330:phase===2?360:390,(5.0+phase*.45)*damageScale);
      if(phase===3)scheduleWeaponAction(360,()=>{if(stageOneActive()&&!enemy.dead)satelliteVolley(enemy,5,365,5.3*damageScale,'#c1b4ff','stage01-warden-lock-follow',.26);});
      enemy.stage01LockCd=phase===1?7.2:phase===2?6.2:5.35;
    }
  }

  const base=window.stackfallStageRuntimeRegistry?.get(STAGE_ID);
  if(base){
    const previousStart=base.onStart;
    const production=Object.freeze({
      entryDuration:2.75,victoryDuration:3.15,subtitle:'ORBIT LOCK ACQUIRED',
      shapes:()=>[],
      environment(run,dt){updateStageOneActors(run,dt);},
      initialize(enemy){
        enemy.stageProduction=true;enemy.eliteForm='eclipse';enemy.variant='eclipse';enemy.stagePhase=1;enemy.stage01BaseSpeed=enemy.speed;enemy.stage01OrbitDir=enemy.id%2?1:-1;enemy.stage01AttackCd=.75;enemy.stage01BurstCd=2.3;enemy.stage01LockCd=3.5;enemy.stage01RingOffset=0;
        state.stageBossArena=null;stageAudio.playBoss();shockwave(enemy.x,enemy.y,'#8cecff',245,.74,5);shockwave(enemy.x,enemy.y,'#a698ff',150,.54,3);spawnParticle(enemy.x,enemy.y,'#dffbff',22,220,5);state.camera.shake=Math.max(state.camera.shake,12);state.flash=Math.max(state.flash,.10);
      },
      combat(enemy,dt){updateOrbitWarden(enemy,dt);},
      drawBody(enemy){
        const kind=enemy.kind;enemy.kind='boss';try{drawEliteShape(enemy);}finally{enemy.kind=kind;}
        const r=Number(enemy.visualR)||Number(enemy.r)||88,t=Number(enemy.phase)||0,phase=Math.max(1,Number(enemy.stagePhase)||1),satellites=phase+2;
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
        ctx.rotate(-t*.024*(enemy.stage01OrbitDir||1));ctx.strokeStyle=enemy.hit?'#fff':'rgba(116,224,255,.70)';ctx.lineWidth=1.8;ctx.setLineDash([12,10]);ctx.beginPath();ctx.arc(0,0,r*1.42,.12,Math.PI*1.55);ctx.stroke();
        ctx.rotate(t*.052+.72);ctx.strokeStyle=enemy.hit?'#fff':'rgba(157,135,255,.56)';ctx.beginPath();ctx.arc(0,0,r*1.66,.05,Math.PI*1.23);ctx.stroke();ctx.setLineDash([]);
        const orbitTime=(state.time||0)*(.72+phase*.08)*(enemy.stage01OrbitDir||1);
        for(let i=0;i<satellites;i++){
          const a=orbitTime+i/satellites*TAU,rr=r*(1.48+(i%2)*.08),x=Math.cos(a)*rr,y=Math.sin(a)*rr;
          ctx.globalAlpha=.24;ctx.strokeStyle=i%2?'#9d91ff':'#76e6ff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.92,Math.sin(a)*r*.92);ctx.lineTo(x,y);ctx.stroke();
          ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/4);ctx.globalAlpha=.92;ctx.fillStyle=i%2?'#a899ff':'#bff7ff';ctx.fillRect(-4.5,-4.5,9,9);ctx.globalAlpha=.38;ctx.strokeStyle='#ffffff';ctx.strokeRect(-7,-7,14,14);ctx.restore();
        }
        if(phase>=2){ctx.globalAlpha=.26;ctx.strokeStyle=phase===3?'#7de8ff':'#aa9cff';ctx.lineWidth=1.4;for(let i=0;i<phase+2;i++){const a=i/(phase+2)*TAU+t*.03;ctx.beginPath();ctx.arc(0,0,r*(1.88+i*.035),a,a+.36);ctx.stroke();}}
        ctx.restore();
      },
      defeat(enemy){
        stageAudio.playVictory();shockwave(enemy.x,enemy.y,'#ffffff',330,.88,7);shockwave(enemy.x,enemy.y,'#7de8ff',470,1.08,4);spawnParticle(enemy.x,enemy.y,'#dffbff',46,360,8);spawnParticle(enemy.x,enemy.y,'#a79bff',34,280,6);state.camera.shake=Math.max(state.camera.shake,16);state.flash=Math.max(state.flash,.20);
      },
      drawVictory(v){
        const p=worldToScreen(v.x,v.y),body=v.body,fade=1-clamp((v.elapsed-2.35)/.70,0,1),collapse=clamp(v.elapsed/2.15,0,1);
        ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=fade;body.phase=(body.phase||0)+.012*(1-collapse*.75);body.stagePhase=Math.max(1,3-Math.floor(collapse*2));this.drawBody(body);ctx.restore();
        if(v.elapsed>.55){ctx.save();ctx.globalAlpha=clamp((v.elapsed-.55)/.45,0,1)*fade;ctx.textAlign='center';ctx.fillStyle='#eff8ff';ctx.font='900 24px "IBM Plex Sans KR",sans-serif';ctx.fillText(v.elapsed<1.55?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw*.5,vh*.22);ctx.restore();}
      }
    });
    const runtime=Object.freeze({...base,
      theme:STAGE_ID,
      initialSpawnTimer:.78,spawnRadius:680,spawnRadiusMin:55,spawnRadiusMax:125,burstRadiusMin:610,burstRadiusMax:770,startingVariants:Object.freeze(['shardling','shardling','shardling']),
      variants:Object.freeze({
        shardling:Object.freeze({type:'grunt',color:'#788aff',hp:.88,speed:1.00,damage:.88,r:.92,xp:1,name:'stage01.enemy.shardling'}),
        dart:Object.freeze({type:'fast',color:'#7fe8ff',hp:.80,speed:1.12,damage:.90,r:.98,xp:1.05,name:'stage01.enemy.dart'}),
        bombardier:Object.freeze({type:'ranged',color:'#b394ff',hp:1.04,speed:.90,damage:.94,r:1.03,xp:1.18,name:'stage01.enemy.bombardier',rangedMin:1.02,rangedMax:1.55}),
        bulwark:Object.freeze({type:'tank',color:'#6f7da9',hp:1.34,speed:.82,damage:1.00,r:1.08,xp:1.34,name:'stage01.enemy.bulwark'})
      }),
      poolAt(_time,api){
        const p=clamp(Number(api?.progress)||0,0,1);
        if(p<.12)return[['shardling',1]];
        if(p<.38)return[['shardling',.70],['dart',.30]];
        if(p<.62)return[['shardling',.56],['dart',.29],['bombardier',.15]];
        if(p<.82)return[['shardling',.43],['dart',.27],['bombardier',.18],['bulwark',.12]];
        return[['shardling',.34],['dart',.26],['bombardier',.20],['bulwark',.20]];
      },
      spawnProfile(_time,api){
        const p=clamp(Number(api?.progress)||0,0,1),cap=Math.round(24+p*9),rate=1.20-p*.38,count=p>.72&&Math.random()<.20?2:1;
        return{cap,rate,count};
      },
      waveLabel(event){
        if(event.variant==='dart')return localText('고속 파편군','FAST SHARD WAVE');
        if(event.variant==='bombardier')return localText('외곽 포대 접근','OUTER BATTERY');
        return localText('항로 방벽 전개','ROUTE GUARD LINE');
      },
      hazard:routeShardSweep,
      onStart(api){
        previousStart?.(api);state.stageBossArena=null;api.run.stage01SweepCount=0;api.run.stage01LastSweep=-999;api.run.routeState={quiet:false,open:false};stageAudio.playAmbient();
      },
      bossProfile:Object.freeze({form:'eclipse',eventVariant:'stage01-orbit-warden',nameKey:'stage01.boss',warningKey:'stage01.boss.warning',r:92,hitRadius:94,contactRadius:58,hp:1.22,speed:.98,damage:.94,color:'#8ca4ff',xp:1.8,skillCd:2.2,burstCd:5.2,pulseCd:7.4,spawnRadius:620,spawnShockwave:200}),
      production
    });
    window.stackfallStageRuntimeRegistry.set(STAGE_ID,runtime);
  }

  const previousClamp=window.stackfallClampStageBossToArena;
  window.stackfallClampStageBossToArena=function remodeledStageBossClamp(enemy){if(enemy?.eventKind===STAGE_ID)return;return previousClamp?.(enemy);};
  document.querySelector('#startBtn')?.addEventListener('click',()=>setTimeout(()=>stageAudio.sync(),0));
  window.renderStackfallGalaxyMap?.();
})();
