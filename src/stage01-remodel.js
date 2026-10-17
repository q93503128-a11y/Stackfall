(()=>{
  const STAGE_ID='stage-01';
  const STAGE_AUDIO_SOURCES=Object.freeze({
    ambient:'https://raw.githubusercontent.com/S-H-GAMELINKS/termfront/master/data/audio/sector.mp3',
    boss:'https://raw.githubusercontent.com/jarlah/dungeon-haskell/master/assets/music/boss.ogg',
    victory:'https://raw.githubusercontent.com/S-H-GAMELINKS/termfront/master/data/audio/victory.mp3'
  });
  const stageAudio=window.stackfallRegisterStageAudio?.(STAGE_ID,STAGE_AUDIO_SOURCES,{baseVolume:{ambient:.34,boss:.31,victory:.42}})||Object.freeze({playAmbient(){},playBoss(){},playVictory(){},sync(){},stop(){},sources:STAGE_AUDIO_SOURCES});
  const localText=(ko,en)=>GAME_SETTINGS.language==='ko'?ko:en;
  const stageOneActive=()=>window.stackfallIsStageRun?.()===true&&state.stageRun?.stage?.id===STAGE_ID;

  function projectileVisual(tag){
    const value=String(tag||'');
    if(value.includes('route-sweep'))return'debris';
    if(value.includes('satellite'))return'constellation';
    if(value.includes('ring')||value.includes('pulse')||value.includes('interceptor')||value.includes('watch-core'))return'rune';
    if(value.includes('lock')||value.includes('core'))return'needle';
    if(value.includes('fan')||value.includes('bombardier')||value.includes('sentinel'))return'ranged-bolt';
    return'needle';
  }
  function hostileShot(x,y,angle,speed,damage,color,r=5,life=4,tag='stage01-orbit'){
    return spawnEnemyProjectile(x,y,angle,speed,damage,color,r,life,projectileVisual(tag));
  }
  function aimedAngle(x,y,lead=.18){
    const tx=player.x+(Number(player.moveVX)||0)*lead,ty=player.y+(Number(player.moveVY)||0)*lead;
    return Math.atan2(ty-y,tx-x);
  }
  function aimedFan(enemy,count,spread,speed,damage,color,tag,lead=.18){
    const center=aimedAngle(enemy.x,enemy.y,lead),step=count>1?spread/(count-1):0;
    for(let i=0;i<count;i++)hostileShot(enemy.x,enemy.y,center-spread*.5+step*i,speed,damage,color,5.2,4.5,tag);
  }
  function radialBurst(enemy,count,speed,damage,color,offset=0,tag='stage01-orbit-ring'){
    for(let i=0;i<count;i++)hostileShot(enemy.x,enemy.y,offset+i/count*TAU,speed,damage,color,4.8,4.8,tag);
  }
  function satellitePositions(enemy,count,radius,phaseOffset=0){
    const t=(state.time||0)*(.72+(enemy.stagePhase||1)*.08)*(enemy.stage01OrbitDir||1)+phaseOffset,out=[];
    for(let i=0;i<count;i++){const a=t+i/count*TAU;out.push({x:enemy.x+Math.cos(a)*radius,y:enemy.y+Math.sin(a)*radius,a});}
    return out;
  }
  function satelliteVolley(enemy,count,speed,damage,color,tag,lead=.24){
    const positions=satellitePositions(enemy,count,(Number(enemy.visualR)||80)*1.70);
    const tx=player.x+(Number(player.moveVX)||0)*lead,ty=player.y+(Number(player.moveVY)||0)*lead;
    for(const p of positions)hostileShot(p.x,p.y,Math.atan2(ty-p.y,tx-p.x),speed,damage,color,5.0,4.4,tag);
  }
  function satelliteLock(enemy,count,delay,speed,damage){
    const radius=(Number(enemy.visualR)||80)*1.70,positions=satellitePositions(enemy,count,radius),tx=player.x+(Number(player.moveVX)||0)*.32,ty=player.y+(Number(player.moveVY)||0)*.32;
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

  function updateStageOneActors(run,dt){
    if(!run||run.completed)return;
    const now=state.time||0;
    for(const enemy of state.entities.enemies){
      if(!enemy||enemy.dead||enemy.eventKind!==STAGE_ID||enemy.kind==='stage-boss'||enemy.stageEncounter===true)continue;
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

  function updateOrbitWarden(enemy,dt){
    if(!enemy||enemy.dead)return;
    const ratio=clamp(enemy.hp/Math.max(1,enemy.maxHp),0,1),phase=ratio>.68?1:ratio>.34?2:3;
    if(enemy.stagePhase!==phase){
      enemy.stagePhase=phase;enemy.stage01AttackCd=.55;enemy.stage01BurstCd=1.1;enemy.stage01LockCd=2.4;enemy.stage01OrbitDir*=-1;
      state.entities.enemyProjectiles.length=0;shockwave(enemy.x,enemy.y,phase===2?'#a59dff':'#79e5ff',230+phase*45,.72,5);spawnParticle(enemy.x,enemy.y,phase===2?'#a99dff':'#83e9ff',18+phase*4,235,5);
      state.camera.shake=Math.max(state.camera.shake,8+phase*2);state.flash=Math.max(state.flash,.08);enemy.contactSafeUntil=(state.time||0)+.35;
    }
    enemy.speed=enemy.stage01BaseSpeed*(phase===1?.88:phase===2?.98:1.08);
    enemy.stage01AttackCd-=dt;enemy.stage01BurstCd-=dt;enemy.stage01LockCd-=dt;
    const damageScale=phase===1?.92:phase===2?1:1.06;
    if(enemy.stage01AttackCd<=0){
      if(phase===1)satelliteVolley(enemy,3,290,4.7*damageScale,'#82e6ff','stage01-warden-satellite',.20);
      else if(phase===2)aimedFan(enemy,5,.58,315,5.0*damageScale,'#9e91ff','stage01-warden-fan',.24);
      else{satelliteVolley(enemy,5,330,4.8*damageScale,'#80eaff','stage01-warden-satellite-fast',.28);aimedFan(enemy,3,.25,345,5.3*damageScale,'#aa9bff','stage01-warden-core',.30);}
      enemy.stage01AttackCd=phase===1?1.96:phase===2?1.62:1.40;
    }
    if(enemy.stage01BurstCd<=0){
      const count=phase===1?8:phase===2?10:12,speed=phase===1?205:phase===2?230:255,offset=(enemy.stage01RingOffset=(enemy.stage01RingOffset||0)+(phase===1?.23:.31));
      radialBurst(enemy,count,speed,(4.0+phase*.32)*damageScale,phase===1?'#8cecff':'#a99cff',offset,'stage01-warden-ring');enemy.stage01BurstCd=phase===1?5.8:phase===2?5.0:4.25;
    }
    if(enemy.stage01LockCd<=0){
      const count=phase+2,delay=phase===1?.68:phase===2?.58:.50;
      satelliteLock(enemy,count,delay,phase===1?320:phase===2?350:380,(5.0+phase*.42)*damageScale);
      if(phase===3)scheduleWeaponAction(380,()=>{if(stageOneActive()&&!enemy.dead)satelliteVolley(enemy,5,350,5.1*damageScale,'#c1b4ff','stage01-warden-satellite-follow',.26);});
      enemy.stage01LockCd=phase===1?7.4:phase===2?6.4:5.55;
    }
  }

  if(typeof window.stackfallRegisterStageRuntime==='function'){
    const production=Object.freeze({
      entryDuration:2.75,victoryDuration:3.15,subtitle:'ORBIT LOCK ACQUIRED',
      shapes:()=>[],
      environment(run,dt){updateStageOneActors(run,dt);},
      initialize(enemy){
        enemy.stageProduction=true;enemy.eliteForm=null;enemy.variant='orbit-warden';enemy.stagePhase=1;enemy.stage01BaseSpeed=enemy.speed;enemy.stage01OrbitDir=enemy.id%2?1:-1;enemy.stage01AttackCd=.75;enemy.stage01BurstCd=2.3;enemy.stage01LockCd=3.5;enemy.stage01RingOffset=0;enemy.contactSafeUntil=(state.time||0)+1.2;stabilizeRealmTheme?.(STAGE_ID);
        stageAudio.playBoss();shockwave(enemy.x,enemy.y,'#8cecff',220,.66,4);shockwave(enemy.x,enemy.y,'#a698ff',145,.48,2.5);spawnParticle(enemy.x,enemy.y,'#dffbff',20,205,4.5);state.camera.shake=Math.max(state.camera.shake,10);state.flash=Math.max(state.flash,.09);
      },
      combat(enemy,dt){updateOrbitWarden(enemy,dt);},
      defeat(enemy){
        stageAudio.playVictory();shockwave(enemy.x,enemy.y,'#ffffff',320,.84,6);shockwave(enemy.x,enemy.y,'#7de8ff',455,1.02,3.5);spawnParticle(enemy.x,enemy.y,'#dffbff',42,340,7);spawnParticle(enemy.x,enemy.y,'#a79bff',30,265,5.5);state.camera.shake=Math.max(state.camera.shake,15);state.flash=Math.max(state.flash,.18);
      },
      drawVictory(v){
        const p=worldToScreen(v.x,v.y),body=v.body,fade=1-clamp((v.elapsed-2.35)/.70,0,1),collapse=clamp(v.elapsed/2.15,0,1);
        ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=fade;body.phase=(body.phase||0)+.012*(1-collapse*.75);body.stagePhase=Math.max(1,3-Math.floor(collapse*2));this.drawBody?.(body);ctx.restore();
        if(v.elapsed>.55){ctx.save();ctx.globalAlpha=clamp((v.elapsed-.55)/.45,0,1)*fade;ctx.textAlign='center';ctx.fillStyle='#eff8ff';ctx.font='900 24px "IBM Plex Sans KR",sans-serif';ctx.fillText(v.elapsed<1.55?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw*.5,vh*.22);ctx.restore();}
      }
    });
    const runtime=Object.freeze({
      theme:STAGE_ID,objectiveKey:'stage01.objective.boss',fixedEventKey:'stage01.event.fixed',
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
      hazard:null,
      onStart(api){
        clearStagePhysicalObjects();api.run.stage01SweepCount=0;api.run.stage01LastSweep=-999;api.run.routeState={quiet:false,open:false};stageAudio.playAmbient();
      },
      bossProfile:Object.freeze({form:'orbit-warden',eventVariant:'stage01-orbit-warden',nameKey:'stage01.boss',warningKey:'stage01.boss.warning',r:80,hitRadius:86,contactRadius:54,hp:1.22,speed:.98,damage:.94,color:'#9a55d6',xp:1.8,skillCd:2.2,burstCd:5.2,pulseCd:7.4,spawnRadius:180,spawnShockwave:190}),
      bossSkill:null,
      production
    });
    window.stackfallRegisterStageRuntime(STAGE_ID,runtime);
  }

  document.querySelector('#startBtn')?.addEventListener('click',()=>setTimeout(()=>stageAudio.sync(),0));
  window.renderStackfallGalaxyMap?.();
})();
