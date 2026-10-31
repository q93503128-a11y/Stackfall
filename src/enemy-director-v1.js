(()=>{
  'use strict';

  const VERSION='1.0.0';
  const ROLE_TO_TYPE=Object.freeze({swarm:'grunt',hunter:'fast',anchor:'tank',artillery:'ranged',charger:'fast'});
  const SEGMENTS=Object.freeze([
    Object.freeze({id:'opening',start:0,end:90,target:28,cadence:.95,batch:1,pulseEvery:0,pulseSize:0,rangedSlots:0,weights:Object.freeze({swarm:.78,hunter:.22})}),
    Object.freeze({id:'skirmish',start:90,end:180,target:38,cadence:.82,batch:1,pulseEvery:42,pulseSize:4,rangedSlots:1,weights:Object.freeze({swarm:.62,hunter:.24,artillery:.14})}),
    Object.freeze({id:'formation',start:180,end:300,target:48,cadence:.69,batch:2,pulseEvery:38,pulseSize:6,rangedSlots:2,weights:Object.freeze({swarm:.50,hunter:.22,anchor:.14,artillery:.14})}),
    Object.freeze({id:'crossfire',start:300,end:420,target:58,cadence:.59,batch:2,pulseEvery:34,pulseSize:8,rangedSlots:2,weights:Object.freeze({swarm:.42,hunter:.20,anchor:.18,artillery:.15,charger:.05})}),
    Object.freeze({id:'siege',start:420,end:600,target:68,cadence:.50,batch:2,pulseEvery:31,pulseSize:10,rangedSlots:3,weights:Object.freeze({swarm:.36,hunter:.19,anchor:.20,artillery:.16,charger:.09})}),
    Object.freeze({id:'deep-space',start:600,end:900,target:76,cadence:.46,batch:3,pulseEvery:29,pulseSize:11,rangedSlots:3,weights:Object.freeze({swarm:.32,hunter:.18,anchor:.22,artillery:.17,charger:.11})}),
    Object.freeze({id:'overrun',start:900,end:1200,target:82,cadence:.42,batch:3,pulseEvery:27,pulseSize:12,rangedSlots:3,weights:Object.freeze({swarm:.29,hunter:.18,anchor:.23,artillery:.18,charger:.12})})
  ]);
  const ROLE_REFILL=Object.freeze({swarm:0,hunter:.15,anchor:.35,artillery:2.6,charger:2.1});
  const DIFFICULTY_DENSITY=Object.freeze({easy:.88,normal:1,hard:1.08,'very-hard':1.14});
  const DIFFICULTY_CADENCE=Object.freeze({easy:1.08,normal:1,hard:.95,'very-hard':.91});

  function difficultyKey(){const key=window.stackfallDifficultyConfig?.().key;return DIFFICULTY_DENSITY[key]?key:'normal';}
  function lateProfile(t){
    const step=Math.max(0,Math.floor((t-1200)/180)),rangedSlots=Math.min(compactDevice()?2:4,3+Math.floor(step/4));
    return{id:'endless-'+step,start:1200,end:Infinity,target:Math.min(compactDevice()?65:92,84+step*2),cadence:Math.max(.34,.41-step*.009),batch:Math.min(compactDevice()?3:4,3+Math.floor(step/6)),pulseEvery:Math.max(24,27-step*.35),pulseSize:Math.min(compactDevice()?11:16,12+Math.floor(step/2)),rangedSlots,weights:{swarm:.27,hunter:.18,anchor:.24,artillery:.18,charger:.13}};
  }
  function baseProfile(t=state.time||0){return SEGMENTS.find(segment=>t>=segment.start&&t<segment.end)||lateProfile(t);}
  function firstRegularBossActive(){return state.entities.enemies.some(e=>e&&!e.dead&&e.type==='boss'&&e.kind!=='apex'&&e.kind!=='void'&&e.firstBoss);}
  function anyRegularBossActive(){return state.entities.enemies.some(e=>e&&!e.dead&&e.type==='boss'&&e.kind!=='apex'&&e.kind!=='void');}
  function normalEnemyCap(){return Math.max(24,entityCap('enemies')-7);}
  function scaledProfile(t=state.time||0){
    const base=baseProfile(t),key=difficultyKey(),compact=compactDevice(),boss=anyRegularBossActive(),firstBoss=firstRegularBossActive();
    const density=(DIFFICULTY_DENSITY[key]||1)*(compact?.82:1)*(boss?.76:1);
    const target=clamp(Math.round(base.target*density),12,normalEnemyCap());
    const weights={...base.weights};
    const rangedDifficulty=Math.sqrt(Math.max(.55,Number(window.stackfallDifficultyConfig?.().rangedChance)||1));
    if(weights.artillery)weights.artillery*=rangedDifficulty*(firstBoss?.45:1);
    const sum=Object.values(weights).reduce((a,b)=>a+b,0)||1;for(const role of Object.keys(weights))weights[role]/=sum;
    return{...base,target,cadence:base.cadence*(DIFFICULTY_CADENCE[key]||1),batch:Math.max(1,Math.round(base.batch*(compact?.86:1))),rangedSlots:firstBoss?Math.min(1,base.rangedSlots):Math.min(compact?2:4,base.rangedSlots),weights,boss,firstBoss};
  }

  function createRuntime(){return{runSerial:state.runSerial,spawnCd:.28,pulseCd:36,pulseRemaining:0,nextRoleAllowed:{},spawnedByRole:{},lastProfileId:''};}
  function runtime(){let rt=state.enemyDirectorV1;if(!rt||rt.runSerial!==state.runSerial){rt=createRuntime();state.enemyDirectorV1=rt;}return rt;}
  function managedNormal(e){return!!(e&&!e.dead&&e.kind==='normal'&&!e.eventKind);}
  function roleOf(e){if(e?.directorRole)return e.directorRole;if(e?.type==='ranged')return'artillery';if(e?.type==='tank')return'anchor';if(e?.type==='fast')return'hunter';return'swarm';}
  function roleCounts(){const counts={swarm:0,hunter:0,anchor:0,artillery:0,charger:0};let total=0;for(const e of state.entities.enemies){if(!managedNormal(e))continue;const role=roleOf(e);if(role in counts)counts[role]++;total++;}return{counts,total};}
  function roleAvailable(rt,role,now){return(now||0)>=(Number(rt.nextRoleAllowed?.[role])||0);}
  function chooseRole(profile,rt){
    const now=state.time||0,{counts}=roleCounts();let best='swarm',bestScore=-Infinity;
    for(const[role,weight]of Object.entries(profile.weights)){
      if(weight<=0||!roleAvailable(rt,role,now))continue;
      const desired=Math.max(.75,profile.target*weight),current=counts[role]||0,deficit=(desired+1)/(current+1),over=current>desired*1.45?.42:1,noise=rand(.78,1.22),score=weight*Math.pow(deficit,.72)*over*noise;
      if(score>bestScore){bestScore=score;best=role;}
    }
    return best;
  }
  function applyRole(enemy,role){
    if(!enemy)return null;const type=ROLE_TO_TYPE[role]||'grunt',cfg=enemyConfig(type),t=state.time||0,threat=1+Math.floor(t/60),speedScale=1+Math.min(.55,t/1500)+Math.min(.20,Math.max(0,threat-1)*.012);
    Object.assign(enemy,{type,kind:'normal',variant:null,name:cfg.name,r:cfg.r,hp:cfg.hp,maxHp:cfg.hp,speed:cfg.speed*speedScale,damage:cfg.damage,color:cfg.color,xp:cfg.xp,directorRole:role,directorManaged:true,directorSpawnedAt:t});
    enemy.skillCd=999;enemy.burstCd=999;enemy.pulseCd=999;enemy.dash=0;enemy.dashX=0;enemy.dashY=0;
    if(role==='artillery'){enemy.rangedCd=9999;enemy.directorShotCd=rand(1.35,2.20);enemy.directorShotWindup=0;enemy.color='#66dfff';enemy.r=Math.max(enemy.r,14);}
    else enemy.rangedCd=999;
    if(role==='charger'){enemy.name='파열 추격체';enemy.color='#ff5f9d';enemy.hp*=1.15;enemy.maxHp=enemy.hp;enemy.damage*=1.10;enemy.speed*=.96;enemy.r=Math.max(12,enemy.r);enemy.xp=Math.max(enemy.xp,4);enemy.directorChargeCd=rand(1.8,3.0);enemy.directorChargeWindup=0;}
    return enemy;
  }
  function spawnRole(role,profile,rt){
    const enemy=spawnEnemy('normal');if(!enemy)return null;applyRole(enemy,role);const now=state.time||0,refill=ROLE_REFILL[role]||0;if(refill>0)rt.nextRoleAllowed[role]=Math.max(Number(rt.nextRoleAllowed[role])||0,now+Math.min(refill*.45,1.05));rt.spawnedByRole[role]=(rt.spawnedByRole[role]||0)+1;return enemy;
  }
  function liveNormalCount(){let count=0;for(const e of state.entities.enemies)if(managedNormal(e))count++;return count;}
  function startPulse(rt,profile){if(profile.pulseEvery<=0||profile.boss)return;rt.pulseRemaining=Math.max(rt.pulseRemaining,profile.pulseSize);rt.pulseCd=profile.pulseEvery*rand(.90,1.12);}

  function updateDirectorSpawning(dt){
    const rt=runtime(),profile=scaledProfile(state.time||0);rt.lastProfileId=profile.id;rt.spawnCd-=dt;rt.pulseCd-=dt;
    if(rt.pulseCd<=0)startPulse(rt,profile);
    if(profile.boss)rt.pulseRemaining=0;
    const live=liveNormalCount(),pulseOverflow=rt.pulseRemaining>0?Math.ceil(profile.pulseSize*.55):0,ceiling=Math.min(normalEnemyCap(),profile.target+pulseOverflow);
    if(rt.spawnCd<=0&&live<ceiling){
      const deficit=ceiling-live,batch=Math.min(deficit,profile.batch+(rt.pulseRemaining>0?1:0));let spawned=0;
      for(let i=0;i<batch;i++){const role=chooseRole(profile,rt);if(!spawnRole(role,profile,rt))break;spawned++;}
      if(rt.pulseRemaining>0)rt.pulseRemaining=Math.max(0,rt.pulseRemaining-spawned);
      rt.spawnCd=Math.max(.11,profile.cadence*rand(.86,1.14));
    }else if(rt.spawnCd<=0)rt.spawnCd=.12;
    state.spawnTimer=rt.spawnCd;
    if(typeof updateEncounterDirector==='function')updateEncounterDirector(dt);
    return true;
  }

  function onScreenForAttack(e,padding=56){const halfW=Math.max(160,vw*.5-padding),halfH=Math.max(120,vh*.5-padding);return Math.abs(e.x-player.x)<=halfW&&Math.abs(e.y-player.y)<=halfH;}
  function artilleryCooldown(){const threat=1+Math.floor((state.time||0)/60),key=difficultyKey(),difficulty=key==='very-hard'?.88:key==='hard'?.94:key==='easy'?1.08:1;return Math.max(1.55,(2.55-Math.min(.65,threat*.045))*difficulty)*rand(.90,1.12);}
  function artilleryProjectileSpeed(){const threat=1+Math.floor((state.time||0)/60);return 210+Math.min(58,threat*4.2);}
  function beginArtilleryWindup(e){const lead=.16,tx=player.x+(player.moveVX||0)*lead,ty=player.y+(player.moveVY||0)*lead;e.directorShotTargetX=tx;e.directorShotTargetY=ty;e.directorShotWindup=rand(.50,.64);shockwave(e.x,e.y,'#76e6ff',48,.30,2.2);spawnParticle(e.x,e.y,'#a9f0ff',3,48,2.6);}
  function fireArtillery(e){const tx=Number(e.directorShotTargetX)||player.x,ty=Number(e.directorShotTargetY)||player.y,a=Math.atan2(ty-e.y,tx-e.x),speed=artilleryProjectileSpeed();spawnEnemyProjectile(e.x,e.y,a,speed,e.damage*.58,'#65ddff',5.2,4.4,'storm');e.directorShotCd=artilleryCooldown();e.directorShotWindup=0;}
  function updateArtillery(e,dt,profile,slotState){
    e.rangedCd=9999;e.directorShotCd=(Number(e.directorShotCd)||0)-dt;
    if((e.directorShotWindup||0)>0){e.directorShotWindup-=dt;if(Math.random()<dt*7)spawnParticle(e.x,e.y,'#76e6ff',1,32,2);if(e.directorShotWindup<=0)fireArtillery(e);return;}
    if(e.directorShotCd>0||slotState.active>=profile.rangedSlots||profile.rangedSlots<=0)return;
    const d=Math.hypot(player.x-e.x,player.y-e.y);if(d<270||d>620||!onScreenForAttack(e))return;beginArtilleryWindup(e);slotState.active++;
  }
  function beginCharge(e){const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;e.directorChargeAimX=dx/d;e.directorChargeAimY=dy/d;e.directorChargeWindup=rand(.56,.68);shockwave(e.x,e.y,'#ff7daf',62,.34,2.5);spawnParticle(e.x,e.y,'#ff9bc1',4,58,2.8);}
  function updateCharger(e,dt){
    e.directorChargeCd=(Number(e.directorChargeCd)||0)-dt;
    if((e.directorChargeWindup||0)>0){e.directorChargeWindup-=dt;if(Math.random()<dt*8)spawnParticle(e.x,e.y,'#ff7daf',1,42,2.2);if(e.directorChargeWindup<=0){const ax=Number(e.directorChargeAimX)||0,ay=Number(e.directorChargeAimY)||0;e.dash=.34;e.dashX=ax*e.speed*4.8;e.dashY=ay*e.speed*4.8;e.directorChargeCd=rand(3.4,4.8);}return;}
    if(e.directorChargeCd>0||!onScreenForAttack(e,72))return;const d=Math.hypot(player.x-e.x,player.y-e.y);if(d>=175&&d<=520)beginCharge(e);
  }

  function directorMovementSpeed(enemy,speed){if(!enemy?.directorManaged)return speed;if(enemy.directorRole==='charger'&&(enemy.directorChargeWindup||0)>0)return 0;return speed;}
  function suppressGenericRanged(enemy){return!!(enemy?.directorManaged&&enemy.directorRole==='artillery');}
  function updateDirectorActions(dt){
    const profile=scaledProfile(state.time||0),slotState={active:0};for(const e of state.entities.enemies)if(e&&!e.dead&&e.directorRole==='artillery'&&(e.directorShotWindup||0)>0)slotState.active++;
    for(const e of state.entities.enemies){if(!e||e.dead||!e.directorManaged)continue;if(e.directorRole==='artillery')updateArtillery(e,dt,profile,slotState);else if(e.directorRole==='charger')updateCharger(e,dt);}
  }
  function onEnemyKilled(enemy){
    const role=enemy?.directorRole;if(!role)return;const refill=ROLE_REFILL[role]||0;if(refill<=0)return;const rt=runtime(),until=(state.time||0)+refill;rt.nextRoleAllowed[role]=Math.max(Number(rt.nextRoleAllowed[role])||0,until);
  }

  const service=Object.freeze({version:VERSION,updateSpawning:updateDirectorSpawning,movementSpeed:directorMovementSpeed,suppressGenericRanged,updateActions:updateDirectorActions,onEnemyKilled,profile:()=>scaledProfile(state.time||0),snapshot:()=>{const rt=runtime(),profile=scaledProfile(state.time||0),roles=roleCounts();return{version:VERSION,runSerial:state.runSerial,time:state.time||0,profile:profile.id,target:profile.target,live:roles.total,roles:roles.counts,pulseRemaining:rt.pulseRemaining,rangedSlots:profile.rangedSlots,nextRoleAllowed:{...rt.nextRoleAllowed}};}});
  window.stackfallEnemyDirectorV1=service;
  window.stackfallEnemyDirectorVersion=VERSION;
  window.stackfallEnemyDirectorProfile=service.profile;
  window.stackfallEnemyDirectorSnapshot=service.snapshot;
})();
