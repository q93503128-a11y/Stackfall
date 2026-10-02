(()=>{
  'use strict';

  const awake=key=>window.stackfallIsWeaponAwakened?.(key)===true;
  const multiplicity=()=>Math.min(2,Math.max(0,Number(window.stackfallMultiplicityStacks?.())||0));
  const fx=state.entities.awakeningFxSecond=Array.isArray(state.entities.awakeningFxSecond)?state.entities.awakeningFxSecond:[];
  const ionNodes=state.entities.awIonNodes=Array.isArray(state.entities.awIonNodes)?state.entities.awIonNodes:[];
  let ionCapture=null;

  function pushFx(data){
    fx.push({id:state.nextId++,...data});
    if(fx.length>72)fx.splice(0,fx.length-72);
    return fx[fx.length-1];
  }
  function resetSecondAwakeningState(){
    fx.length=0;ionNodes.length=0;ionCapture=null;
    for(const p of state.entities.enemyProjectiles||[])if(p)delete p.awChronoStop;
    if(player.prismSharedLock&&typeof player.prismSharedLock==='object')delete player.prismSharedLock.awCrownFiredTargetId;
    Object.assign(player,{
      awPrismTargetId:null,awPrismTargetX:0,awPrismTargetY:0,
      awChronoPhase:0,awChronoSeverFlash:0,
      awIonCircuitCd:0,awIonDischargePending:false,
      awNovaCharge:0,awDroneFleetCycle:0,awDroneVolleyFlash:0,awRailCycle:0
    });
  }
  window.stackfallResetAwakeningSecondSetCombat=resetSecondAwakeningState;
  resetSecondAwakeningState();

  // A8 — Constellation Crown.
  function prismAwakenedBodyCount(n){return Math.min(5,(n>=6?3:n>=2?2:1)+multiplicity());}
  function fireConstellationCrown(target,n){
    if(!target||target.dead)return;
    const targetId=target.id,x=target.x,y=target.y,size=weaponSizeMultiplier(),radius=62*size;
    pushFx({kind:'prism-crown-charge',targetId,x,y,r:radius,life:.34,max:.34});
    scheduleWeaponAction(300,()=>{
      const live=enemyById(targetId);if(!live)return;
      const columnHalf=330+Math.min(180,weaponRange('prism')*.22),width=(14+n*1.6)*size,damage=34+n*5.2;
      applyRailBeam(live.x,live.y-columnHalf,live.x,live.y+columnHalf,width,damage,'#fffdf4','prism-focus',1);
      areaDamage(live.x,live.y,72*size,damage*.58,'#fff7e4','prism-focus',{shake:false});
      shockwave(live.x,live.y,'#ffffff',96*size,.34,3.2);
      pushFx({kind:'prism-column',x:live.x,y:live.y,half:columnHalf,width,life:.30,max:.30});
      audio.weapon?.('prism',false,1.55);
    });
  }
  const baseUpdateFocusedPrisms=updateFocusedPrisms;
  updateFocusedPrisms=function constellationCrownFocus(dt,n){
    baseUpdateFocusedPrisms(dt,n);
    if(!awake('prism'))return;
    const lock=player.prismSharedLock,target=lock?.targetId?enemyById(lock.targetId):null;
    if(!target)return;
    player.awPrismTargetId=target.id;player.awPrismTargetX=target.x;player.awPrismTargetY=target.y;
    const stage=prismStage(lock.heat||0,n);
    if(stage===2&&lock.awCrownFiredTargetId!==target.id){
      lock.awCrownFiredTargetId=target.id;
      fireConstellationCrown(target,n);
    }
  };

  const baseKillEnemy=killEnemy;
  killEnemy=function awakeningSecondSetKill(enemy,opts={}){
    const prismDeath=awake('prism')&&enemy&&!enemy.dead&&enemy.id===player.awPrismTargetId,x=enemy?.x||0,y=enemy?.y||0;
    const result=baseKillEnemy(enemy,opts);
    if(prismDeath&&enemy?.dead){
      pushFx({kind:'prism-shatter',x,y,r:72*weaponSizeMultiplier(),life:.46,max:.46});
      player.awPrismTargetId=null;
    }
    return result;
  };

  // A9 — Eternal Clock.
  function advanceAwakenedCooldowns(seconds){
    const keys=['coreCd','bladeTick','emberCd','wellCd','bulwarkCd','fortressCd','cometCd','prismCd','chronoCd','arcCd','ionCd','novaCd','droneCd','railCd','spiralCd','mirrorCd','missileCd','gateCd','minePlaceTimer'];
    for(const key of keys)if(Number.isFinite(player[key]))player[key]-=seconds;
  }
  function triggerEternalClock(n){
    const size=weaponSizeMultiplier(),radius=(190+n*20)*size;
    for(const e of state.entities.enemies){
      if(!e||e.dead||e.kind==='apex'||Math.hypot(e.x-player.x,e.y-player.y)>radius)continue;
      const lock=e.type==='boss'?.55:e.type==='mini'?1.05:1.65;
      e.timeLock=Math.max(e.timeLock||0,lock);
    }
    for(const p of state.entities.enemyProjectiles){
      if(!p||p.life<=0||Math.hypot(p.x-player.x,p.y-player.y)>radius*1.10)continue;
      p.awChronoStop=Math.max(Number(p.awChronoStop)||0,.72);
    }
    advanceAwakenedCooldowns(.80+n*.08);
    areaDamage(player.x,player.y,radius,8+n*2.35,COLORS.chrono,'chrono-pulse',{shake:false});
    shockwave(player.x,player.y,'#efffff',radius,.46,3.2);
    player.awChronoSeverFlash=.48;
    pushFx({kind:'chrono-sever',x:player.x,y:player.y,r:radius,life:.52,max:.52});
    audio.weapon?.('chrono',false,1.55);
  }

  const baseUpdateEnemyProjectiles=updateEnemyProjectiles;
  updateEnemyProjectiles=function eternalClockProjectileStop(dt){
    const slowed=[];
    for(const p of state.entities.enemyProjectiles){
      if(!p||p.life<=0||(p.awChronoStop||0)<=0)continue;
      const speed=Math.hypot(p.vx||0,p.vy||0);if(speed<=0)continue;
      p.vx*=.055;p.vy*=.055;slowed.push({p,speed});
    }
    baseUpdateEnemyProjectiles(dt);
    for(const entry of slowed){
      const p=entry.p;p.awChronoStop=Math.max(0,(Number(p.awChronoStop)||0)-dt);
      if(p.life<=0)continue;
      const angle=Math.atan2(p.vy||0,p.vx||0);p.vx=Math.cos(angle)*entry.speed;p.vy=Math.sin(angle)*entry.speed;
    }
  };

  // A10 — Celestial Thunder Circuit + repair/retain Superconductive Constellation.
  function addIonNode(enemy){
    if(!awake('ion')||player.awIonDischargePending||!enemy||enemy.dead)return;
    let node=ionNodes.find(row=>row.enemyId===enemy.id);
    if(node){node.x=enemy.x;node.y=enemy.y;node.life=2.65;return;}
    ionNodes.push({enemyId:enemy.id,x:enemy.x,y:enemy.y,life:2.65,max:2.65});
    if(ionNodes.length>7)ionNodes.shift();
  }
  const baseDealDamage=dealDamage;
  dealDamage=function awakeningSecondSetDamage(enemy,amount,opts={}){
    const source=String(opts.source||''),wasAlive=enemy&&!enemy.dead;
    const result=baseDealDamage(enemy,amount,opts);
    if(ionCapture&&wasAlive&&source==='ion-chain')ionCapture.add(enemy.id);
    if(wasAlive&&!enemy?.dead&&(source==='ion-chain'||source==='ion-superconductive'))addIonNode(enemy);
    return result;
  };

  function castSuperconductiveNetwork(n,excluded){
    const candidates=nearestEnemies(player.x,player.y,9,excluded,weaponRange('ion')),first=candidates[0];if(!first)return;
    const hit=new Set(excluded||[]),range=175+n*22,color='#baf7ff',width=(1.7+n*.13)*weaponSizeMultiplier(),maxLinks=2+(n>=3?1:0)+(n>=5?1:0),baseDamage=(11+n*3.35)*.52;
    let from={x:player.x,y:player.y},target=first;
    for(let i=0;i<maxLinks&&target;i++){
      hit.add(target.id);dealDamage(target,baseDamage*Math.pow(.80,i),{color,source:'ion-chain',canCrit:false});
      state.entities.beams.push({x1:from.x,y1:from.y,x2:target.x,y2:target.y,life:.16,max:.16,color,width});
      from={x:target.x,y:target.y};target=nearestEnemy(from.x,from.y,range,e=>!hit.has(e.id));
    }
    trimOldest(state.entities.beams,entityCap('beams'));
  }
  const baseFireIonChain=fireIonChain;
  fireIonChain=function superconductiveAwakenedIon(n,echoed=false){
    const previous=ionCapture,captured=new Set();ionCapture=captured;
    try{baseFireIonChain(n,echoed);}finally{ionCapture=previous;}
    if(state.weaponAugments?.ion&&!echoed)scheduleWeaponAction(155,()=>castSuperconductiveNetwork(n,captured));
  };

  function triggerCelestialThunder(n){
    if(player.awIonDischargePending||ionNodes.length<5)return;
    player.awIonDischargePending=true;player.awIonCircuitCd=1.0;
    const snapshot=[];for(let i=0;i<ionNodes.length&&i<7;i++){const node=ionNodes[i];snapshot.push({enemyId:node.enemyId,x:node.x,y:node.y});}
    let core=null,coreHp=-Infinity;for(const node of snapshot){const enemy=enemyById(node.enemyId);if(enemy&&(enemy.hp||0)>coreHp){core=enemy;coreHp=enemy.hp||0;}}
    const cx=core?.x??snapshot[0]?.x??player.x,cy=core?.y??snapshot[0]?.y??player.y;
    pushFx({kind:'ion-circuit-freeze',points:snapshot,cx,cy,life:.32,max:.32});
    scheduleWeaponAction(190,()=>{
      const current=[];let anchor=null,anchorHp=-Infinity;for(const node of snapshot){const enemy=enemyById(node.enemyId);if(!enemy)continue;current.push(enemy);if((enemy.hp||0)>anchorHp){anchor=enemy;anchorHp=enemy.hp||0;}}const ax=anchor?.x??cx,ay=anchor?.y??cy,size=weaponSizeMultiplier();
      state.entities.beams.push({x1:ax,y1:ay-650,x2:ax,y2:ay,life:.24,max:.24,color:'#ffffff',width:12*size});
      for(const enemy of current)dealDamage(enemy,22+n*3.5,{color:'#eaffff',source:'ion-burst',canCrit:false});
      if(anchor)dealDamage(anchor,28+n*4.4,{color:'#ffffff',source:'ion-burst',canCrit:false});
      for(let i=1;i<current.length;i++)state.entities.beams.push({x1:current[i-1].x,y1:current[i-1].y,x2:current[i].x,y2:current[i].y,life:.20,max:.20,color:'#83efff',width:4.2*size});
      shockwave(ax,ay,'#efffff',120*size,.38,3.4);
      pushFx({kind:'ion-thunder',x:ax,y:ay,life:.34,max:.34});
      ionNodes.length=0;player.awIonDischargePending=false;audio.weapon?.('ion',false,1.65);
    });
  }

  // A11 — Hypernova.
  const baseFireNovaPulse=fireNovaPulse;
  fireNovaPulse=function hypernovaPulse(n,echoed=false){
    baseFireNovaPulse(n,echoed);
    if(!awake('nova')||echoed)return;
    player.awNovaCharge=(player.awNovaCharge||0)+1;
    pushFx({kind:'nova-ring-light',x:player.x,y:player.y,index:Math.min(2,player.awNovaCharge-1),life:.40,max:.40});
    if(player.awNovaCharge<3)return;
    player.awNovaCharge=0;
    const size=weaponSizeMultiplier(),radius=(175+n*18)*size;
    pushFx({kind:'hypernova-charge',x:player.x,y:player.y,r:radius,life:.36,max:.36});
    scheduleWeaponAction(260,()=>{
      areaDamage(player.x,player.y,radius*.48,17+n*3.2,'#ffffff','nova-pulse',{shake:false});
      shockwave(player.x,player.y,'#ffffff',radius*.50,.22,2.1);
      scheduleWeaponAction(90,()=>{
        areaDamage(player.x,player.y,radius,33+n*5.4,'#fff0b8','nova-pulse',{shake:false});
        shockwave(player.x,player.y,'#fff4c9',radius,.34,3.2);
      });
      scheduleWeaponAction(190,()=>{
        areaDamage(player.x,player.y,radius*1.32,21+n*4.0,'#ffbd69','nova-pulse',{shake:false});
        shockwave(player.x,player.y,'#ffbd69',radius*1.35,.46,4.0);
        pushFx({kind:'hypernova-release',x:player.x,y:player.y,r:radius*1.35,life:.46,max:.46});
        audio.weapon?.('nova',false,1.70);
      });
    });
  };

  // A12 — Falling-Star Fleet. The existing augment was defined but its runtime had been lost by later overrides; restore it here for both forms.
  function strongestDroneTarget(){
    const range=weaponRange('drone'),r2=range*range;let best=null,bestHp=-1,bestDist=Infinity;
    for(const e of state.entities.enemies){
      if(!e||e.dead)continue;const d2=(e.x-player.x)**2+(e.y-player.y)**2;if(d2>r2)continue;
      const hp=Number(e.hp)||0;if(hp>bestHp||(hp===bestHp&&d2<bestDist)){best=e;bestHp=hp;bestDist=d2;}
    }
    return best;
  }
  function fallingStarMark(n,target){
    if(!state.weaponAugments?.drone||!target||target.dead)return;
    const id=target.id,x=target.x,y=target.y;target.droneMarkedUntil=(state.time||0)+.65;
    pushFx({kind:'drone-mark',targetId:id,x,y,life:.48,max:.48});
    scheduleWeaponAction(440,()=>{
      const live=enemyById(id),cx=live?.x??x,cy=live?.y??y,size=weaponSizeMultiplier();
      areaDamage(cx,cy,72*size,18+n*4.2,'#d8fff1','drone-meteor',{shake:false});
      shockwave(cx,cy,'#d8fff1',92*size,.30,2.4);
      pushFx({kind:'drone-meteor',x:cx,y:cy,life:.34,max:.34});
    });
  }
  function launchFallingStarFleet(n,target){
    if(!target||target.dead)return;
    const count=Math.min(5,(n>=6?3:n>=2?2:1)+multiplicity()),targetId=target.id,angle=Math.atan2(target.y-player.y,target.x-player.x),size=weaponSizeMultiplier();
    pushFx({kind:'fleet-form',targetId,x:player.x,y:player.y,a:angle,count,life:.74,max:.74});
    scheduleWeaponAction(520,()=>{
      const live=enemyById(targetId)||strongestDroneTarget();if(!live)return;
      const a=Math.atan2(live.y-player.y,live.x-player.x),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,length=Math.max(520,Math.min(weaponRange('drone')*1.22,Math.hypot(live.x-player.x,live.y-player.y)+280)),origins=[];
      for(let i=0;i<count;i++){
        const row=Math.abs(i-(count-1)/2),offset=(i-(count-1)/2)*22*size,d=-76-row*15,x1=player.x+dx*d+nx*offset,y1=player.y+dy*d+ny*offset,x2=x1+dx*length,y2=y1+dy*length;
        origins.push({x:x1,y:y1,offset});
        applyRailBeam(x1,y1,x2,y2,4.4*size,(13+n*3.5)*.70,'#baffea',i>=Math.max(1,count-multiplicity())?'drone-multiplicity':'meteor-drone',1);
      }
      pushFx({kind:'fleet-run',origins,a,count,length,life:.68,max:.68});
      scheduleWeaponAction(115,()=>{
        const final=enemyById(targetId)||live;if(!final||final.dead)return;
        areaDamage(final.x,final.y,82*size,24+n*4.6,'#e8fff7','meteor-drone',{shake:false});
        shockwave(final.x,final.y,'#d8fff1',108*size,.34,3);
      });
      audio.weapon?.('drone',false,1.55);
    });
  }
  function fireAwakenedFleetVolley(n){
    const target=strongestDroneTarget()||nearestWeaponTarget('drone');if(!target)return;
    const basePoints=meteorDronePositions(n),extra=multiplicity(),points=[...basePoints],rr=orbitRadiusFor('drone')+18;
    for(let i=0;i<extra;i++){const aa=(i+.5)*TAU/Math.max(1,extra)+(player.angle||0)*.31;points.push({x:player.x+Math.cos(aa)*rr,y:player.y+Math.sin(aa)*rr,a:aa});}
    const bursts=n>=4?2:1,damage=(12+n*3.6)*(bursts===2?.82:1),speed=(680+n*18)*(1+stat('projectileSpeed')*.10),range=weaponRange('drone');
    player.awDroneVolleyFlash=.30;
    for(let burst=0;burst<bursts;burst++)scheduleWeaponAction(burst*82,()=>{
      const live=target&&!target.dead?target:strongestDroneTarget()||nearestWeaponTarget('drone');if(!live)return;
      for(let i=0;i<points.length;i++){
        const pos=points[i],lead=(i-(points.length-1)/2)*.028,a0=Math.atan2(live.y-pos.y,live.x-pos.x)+lead;
        spawnPlayerProjectile({x:pos.x,y:pos.y,vx:Math.cos(a0)*speed,vy:Math.sin(a0)*speed,r:6.4+n*.22,life:1.25,maxRange:range,damage,pierce:2+(n>=5?1:0),color:'#baffea',source:'meteor-drone',playerVisual:'drone-awakened',homingTargetId:live.id,homingReacquire:false,homingTurn:1.55,awakeningChild:true});
      }
    });
  }
  const baseFireMeteorDrones=fireMeteorDrones;
  fireMeteorDrones=function fallingStarFleetDrones(n,echoed=false){
    if(!awake('drone')||echoed)baseFireMeteorDrones(n,echoed);else fireAwakenedFleetVolley(n);
    if(echoed)return;
    const target=strongestDroneTarget();if(state.weaponAugments?.drone)fallingStarMark(n,target);
    if(!awake('drone'))return;
    player.awDroneFleetCycle=(player.awDroneFleetCycle||0)+1;
    if(player.awDroneFleetCycle%4===0)launchFallingStarFleet(n,target||nearestWeaponTarget('drone'));
  };

  // A13 — Terminus Railgun.
  function railAwakeningTarget(){
    const range=weaponRange('rail'),r2=range*range;let boss=null,bossD=Infinity;
    if(GAME_SETTINGS.manualAim!==true)for(const e of state.entities.enemies){if(!e||e.dead||e.type!=='boss')continue;const d=(e.x-player.x)**2+(e.y-player.y)**2;if(d<=r2&&d<bossD){boss=e;bossD=d;}}
    return boss||nearestWeaponTarget('rail');
  }
  function terminusFracture(x,y,a,length,n){
    if(!state.weaponAugments?.rail)return;
    for(const[index,f]of[.30,.56,.82].entries()){
      const px=x+Math.cos(a)*length*f,py=y+Math.sin(a)*length*f;
      scheduleWeaponAction(index*72,()=>{areaDamage(px,py,44+n*3.4,13+n*3.4,'#e9fbff','rail-fracture',{shake:false});shockwave(px,py,'#ffffff',58+n*4,.24,1.9);});
    }
  }
  function damageAwakenedRailPulse(x1,y1,x2,y2,width,damage,eliteBonus=1){
    for(const enemy of state.entities.enemies){
      if(!enemy||enemy.dead)continue;
      if(enemySegmentOverlap(enemy,x1,y1,x2,y2,width*.78)){
        const elite=enemy.type==='boss'||enemy.type==='mini';
        dealDamage(enemy,damage*(elite?eliteBonus:1),{color:'#ffffff',source:'rail'});
      }
    }
  }
  function releaseAwakenedRailWave(n,target,overdrive=false){
    if(!target||target.dead)return;
    const angle=Math.atan2(target.y-player.y,target.x-player.x),dx=Math.cos(angle),dy=Math.sin(angle),
      size=weaponSizeMultiplier(),length=weaponRange('rail')*(overdrive?1.52:1.20),
      visualWidth=(164+n*9.5)*size*(overdrive?1.85:1),hitWidth=(35+n*2.7)*size*(overdrive?1.30:1),
      x1=player.x-dx*38,y1=player.y-dy*38,x2=x1+dx*length,y2=y1+dy*length,
      perPulse=(40+n*9.4)*(overdrive?.74:.60),eliteBonus=n>=5?1.36:1;
    state.entities.beams.push({x1,y1,x2,y2,life:.76,max:.76,color:overdrive?'#dff7ff':'#9fe5ff',width:visualWidth,terminus:true,overdrive:!!overdrive});
    trimOldest(state.entities.beams,entityCap('beams'));
    const pulseTimes=[80,255,430];
    for(let i=0;i<pulseTimes.length;i++)scheduleWeaponAction(pulseTimes[i],()=>{
      damageAwakenedRailPulse(x1,y1,x2,y2,hitWidth,perPulse,eliteBonus);
      pushFx({kind:'rail-wave-pulse',x:x1,y:y1,a:angle,length,width:visualWidth,life:.24,max:.24,index:i,overdrive});
      if(i===1)state.camera.shake=Math.max(state.camera.shake,overdrive?11:6.2);
      if(i===2)terminusFracture(x1,y1,angle,length,n);
    });
    state.flash=Math.max(state.flash,overdrive?.17:.08);
    audio.weapon?.('rail',false,overdrive?1.94:1.56);
  }
  function fireAwakenedRailWave(n,target,overdrive=false){
    if(!target||target.dead)return;
    if(!overdrive)return releaseAwakenedRailWave(n,target,false);
    const angle=Math.atan2(target.y-player.y,target.x-player.x),size=weaponSizeMultiplier(),r=(118+n*9)*size;
    pushFx({kind:'rail-overdrive-charge',x:player.x,y:player.y,a:angle,r,life:.46,max:.46});
    shockwave(player.x,player.y,'#c7efff',r*1.18,.44,4.8);
    state.flash=Math.max(state.flash,.12);state.camera.shake=Math.max(state.camera.shake,4.5);
    scheduleWeaponAction(460,()=>{const live=target&&!target.dead?target:railAwakeningTarget();if(live)releaseAwakenedRailWave(n,live,true);});
  }
  const baseFireRailgun=fireRailgun;
  fireRailgun=function terminusRailgun(n,echoed=false){
    if(!awake('rail')||echoed)return baseFireRailgun(n,echoed);
    const target=railAwakeningTarget();if(!target)return;
    player.awRailCycle=(player.awRailCycle||0)+1;
    fireAwakenedRailWave(n,target,player.awRailCycle%4===0);
  };

  // Shared timer/status layer for A8-A13.
  const baseUpdateWeapons=updateWeapons;
  updateWeapons=function awakeningSecondSetWeapons(dt){
    baseUpdateWeapons(dt);
    player.awChronoSeverFlash=Math.max(0,(player.awChronoSeverFlash||0)-dt);
    player.awIonCircuitCd=Math.max(0,(player.awIonCircuitCd||0)-dt);

    if(awake('chrono')){
      const n=Math.max(1,weaponCount('chrono')),duration=Math.max(4.8,7.2*hasteMult());
      player.awChronoPhase=(player.awChronoPhase||0)+dt/duration;
      if(player.awChronoPhase>=1){player.awChronoPhase%=1;triggerEternalClock(n);}
    }else player.awChronoPhase=0;

    for(let i=ionNodes.length-1;i>=0;i--){
      const node=ionNodes[i],enemy=enemyById(node.enemyId);node.life-=dt;
      if(enemy){node.x=enemy.x;node.y=enemy.y;}
      if(node.life<=0||!enemy)ionNodes.splice(i,1);
    }
    if(!awake('ion')){ionNodes.length=0;player.awIonDischargePending=false;}
    else if(player.awIonCircuitCd<=0&&ionNodes.length>=5)triggerCelestialThunder(Math.max(1,weaponCount('ion')));

    if(!awake('nova'))player.awNovaCharge=0;
    player.awDroneVolleyFlash=Math.max(0,(player.awDroneVolleyFlash||0)-dt);
    if(!awake('drone')){player.awDroneFleetCycle=0;player.awDroneVolleyFlash=0;}
    if(!awake('rail'))player.awRailCycle=0;
  };

  // A8/A12 orbit silhouettes.
  const baseDrawEquippedOrbits=drawEquippedOrbits;
  const AW2_RASTER_CACHE=new Map();
  function aw2Raster(key,size,painter){return cachedRasterSurface(AW2_RASTER_CACHE,key,size,painter,64);}
  function crownPrismRaster(){return aw2Raster('crown-prism',80,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=22;g.shadowColor='#dccbff';g.fillStyle='#181129';g.strokeStyle='#f2eaff';g.lineWidth=1.7;g.beginPath();g.moveTo(0,-19);g.lineTo(10,-7);g.lineTo(7,13);g.lineTo(0,8);g.lineTo(-7,13);g.lineTo(-10,-7);g.closePath();g.fill();g.stroke();g.strokeStyle='#c4aeff';g.beginPath();g.moveTo(0,-19);g.lineTo(0,8);g.moveTo(-10,-7);g.lineTo(10,-7);g.stroke();g.restore();});}
  function fleetDroneRaster(boost=0){const b=boost>0?1:0;return aw2Raster(`fleet-drone:${b}`,96,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=18+b*18;g.shadowColor='#8fffd0';g.fillStyle='#071c28';g.strokeStyle=b?'#ffffff':'#cffff3';g.lineWidth=1.7;g.beginPath();g.moveTo(24,0);g.lineTo(6,-6);g.lineTo(-6,-18);g.lineTo(-2,-6);g.lineTo(-18,-10);g.lineTo(-12,0);g.lineTo(-18,10);g.lineTo(-2,6);g.lineTo(-6,18);g.lineTo(6,6);g.closePath();g.fill();g.stroke();g.fillStyle=b?'#ffffff':'#8fffd0';g.beginPath();g.moveTo(-12,-4);g.lineTo(-28,0);g.lineTo(-12,4);g.closePath();g.fill();if(b){g.globalAlpha=.72;g.strokeStyle='#8fffd0';g.lineWidth=4;g.beginPath();g.moveTo(-26,0);g.lineTo(-42,0);g.stroke();}g.restore();});}
  function eternalClockRaster(n,r){const rb=Math.round(r/8)*8,size=Math.ceil((rb+26)*2);return aw2Raster(`clock:${n}:${rb}`,size,(g,sz)=>{const c=sz/2;g.save();g.translate(c,c);g.globalAlpha=.34;g.shadowBlur=10;g.shadowColor='#bffdf2';for(const[index,rr]of[rb,rb-22].entries()){g.strokeStyle=index?'#9caeff':'#8fffe0';g.lineWidth=index?1.2:1.8;g.setLineDash(index?[8,9]:[18,6]);g.beginPath();g.arc(0,0,rr,0,TAU);g.stroke();}g.setLineDash([]);for(let i=0;i<12;i++){const a=i/12*TAU-Math.PI/2,major=i%3===0,inner=rb-(major?17:10);g.strokeStyle=major?'rgba(239,255,252,.82)':'rgba(143,255,224,.55)';g.lineWidth=major?2.1:1;g.beginPath();g.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);g.lineTo(Math.cos(a)*(rb+3),Math.sin(a)*(rb+3));g.stroke();}g.fillStyle='#ffffff';g.beginPath();g.arc(0,0,5,0,TAU);g.fill();g.restore();});}
  function prismCrownRaster(heat){const hb=Math.round(clamp(heat,0,1)*6),r=42+(hb/6)*18,size=160;return aw2Raster(`prism-target-crown:${hb}`,size,(g,sz)=>{const c=sz/2;g.save();g.translate(c,c);g.shadowBlur=18;g.shadowColor='#e8ddff';g.strokeStyle='rgba(229,215,255,.78)';g.lineWidth=1.5;g.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU,x=Math.cos(a)*r,y=Math.sin(a)*r*.58;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.stroke();for(let i=0;i<6;i++){const a=i/6*TAU,x=Math.cos(a)*r,y=Math.sin(a)*r*.58;g.fillStyle=i<hb?'#ffffff':'rgba(196,174,255,.32)';g.beginPath();g.arc(x,y,i<hb?3.8:2.4,0,TAU);g.fill();}g.restore();});}
  function novaCoronaRaster(charge){const c=Math.max(0,Math.min(2,Math.floor(charge)));return aw2Raster(`nova-corona:${c}`,180,(g,sz)=>{g.save();g.translate(sz/2,sz/2);for(let i=0;i<3;i++){g.globalAlpha=i<c?.72:.18;g.strokeStyle=i<c?'#fff0b5':'#ffbd69';g.lineWidth=i<c?3:1.2;g.shadowBlur=i<c?18:5;g.shadowColor='#ffbd69';g.setLineDash([10+i*4,7]);g.beginPath();g.arc(0,0,48+i*13,0,TAU);g.stroke();}g.setLineDash([]);g.restore();});}
  function drawCrownPrism(point,t,size){const sx=point.x-player.x+vw/2,sy=point.y-player.y+vh/2,image=crownPrismRaster();ctx.save();ctx.translate(sx,sy);ctx.rotate(-point.a+t*.00052);ctx.scale(size,size);ctx.drawImage(image,-40,-40,80,80);ctx.restore();}

  function drawFleetDrone(point,a,size,boost=0){const sx=point.x-player.x+vw/2,sy=point.y-player.y+vh/2,image=fleetDroneRaster(boost);ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.scale(size,size);ctx.drawImage(image,-48,-48,96,96);ctx.restore();}

  drawEquippedOrbits=function awakenedCrownFleetOrbits(x,y,t){
    const prismN=weaponCount('prism'),droneN=weaponCount('drone'),hidePrism=prismN&&awake('prism'),hideDrone=droneN&&awake('drone'),savedPrism=state.weaponStacks.prism,savedDrone=state.weaponStacks.drone;
    if(hidePrism)state.weaponStacks.prism=0;if(hideDrone)state.weaponStacks.drone=0;
    try{baseDrawEquippedOrbits(x,y,t);}finally{if(hidePrism)state.weaponStacks.prism=savedPrism;if(hideDrone)state.weaponStacks.drone=savedDrone;}
    const size=weaponSizeMultiplier();
    if(hidePrism){
      const points=prismPositions(prismAwakenedBodyCount(prismN));for(const point of points)drawCrownPrism(point,t,size);
      if(points.length>=2){ctx.save();ctx.strokeStyle='rgba(225,211,255,.34)';ctx.lineWidth=1.4;ctx.setLineDash([5,7]);ctx.beginPath();for(let i=0;i<points.length;i++){const point=points[i],sx=point.x-player.x+vw/2,sy=point.y-player.y+vh/2;i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);}if(points.length>2)ctx.closePath();ctx.stroke();ctx.setLineDash([]);ctx.restore();}
    }
    if(hideDrone){
      const points=meteorDronePositions(droneN);for(const point of points)drawFleetDrone(point,point.a+Math.PI/2,size*.98,player.awDroneVolleyFlash||0);
      const extra=multiplicity(),rr=orbitRadiusFor('drone')+18;for(let i=0;i<extra;i++){const a=(i+.5)*TAU/Math.max(1,extra)+player.angle*.31;drawFleetDrone({x:player.x+Math.cos(a)*rr,y:player.y+Math.sin(a)*rr,a},a+Math.PI/2,size*.98,player.awDroneVolleyFlash||0);}
    }
  };

  // A9 permanent clock silhouette.
  const baseDrawChronoField=drawChronoField;
  drawChronoField=function eternalClockVisual(){
    if(!awake('chrono'))return baseDrawChronoField();const n=Math.max(1,weaponCount('chrono')),x=vw/2,y=vh/2,r=(150+n*18)*weaponSizeMultiplier(),phase=clamp(player.awChronoPhase||0,0,1),t=performance.now(),image=eternalClockRaster(n,r),size=image.width||Math.ceil((r+26)*2);ctx.save();ctx.translate(x,y);ctx.rotate(t*.00014);ctx.drawImage(image,-size/2,-size/2,size,size);const hand=phase*TAU-Math.PI/2;ctx.rotate(hand-t*.00014);ctx.strokeStyle='#ffffff';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(-r*.12,0);ctx.lineTo(r*.83,0);ctx.stroke();ctx.restore();if((player.awChronoSeverFlash||0)>0){const q=clamp(player.awChronoSeverFlash/.48,0,1);ctx.save();ctx.globalAlpha=.09*q;ctx.fillStyle='#eef4f2';ctx.fillRect(0,0,vw,vh);ctx.restore();}
  };

  function drawPrismTargetCrown(){if(!awake('prism'))return;const lock=player.prismSharedLock,target=lock?.targetId?enemyById(lock.targetId):null;if(!target)return;const sx=target.x-player.x+vw/2,sy=target.y-player.y+vh/2,heat=clamp((lock.heat||0)/Math.max(.01,weaponCount('prism')>=6?1.55:1.78),0,1),image=prismCrownRaster(heat),t=performance.now()*.0014;ctx.save();ctx.translate(sx,sy);ctx.rotate(t);ctx.drawImage(image,-80,-80,160,160);ctx.restore();}

  function drawIonCircuit(){
    if(!awake('ion')||!ionNodes.length)return;ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle='rgba(114,242,255,.52)';ctx.shadowBlur=12;ctx.shadowColor='#72f2ff';
    if(ionNodes.length>1){ctx.beginPath();for(let i=0;i<ionNodes.length;i++){const node=ionNodes[i],sx=node.x-player.x+vw/2,sy=node.y-player.y+vh/2;i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);}ctx.stroke();}
    for(const node of ionNodes){const sx=node.x-player.x+vw/2,sy=node.y-player.y+vh/2,q=clamp(node.life/node.max,0,1);ctx.globalAlpha=.35+.6*q;ctx.fillStyle='#eaffff';ctx.beginPath();ctx.arc(sx,sy,4.2,0,TAU);ctx.fill();ctx.strokeStyle='#72f2ff';ctx.beginPath();ctx.arc(sx,sy,9,0,TAU);ctx.stroke();}ctx.restore();
  }
  function drawNovaCorona(){if(!awake('nova'))return;const image=novaCoronaRaster(player.awNovaCharge||0),t=performance.now()*.001;ctx.save();ctx.translate(vw/2,vh/2);ctx.rotate(t*.24);ctx.drawImage(image,-90,-90,180,180);ctx.restore();}

  function drawSecondFx(){
    for(const e of fx){
      const q=clamp(e.life/Math.max(.001,e.max),0,1),age=1-q;ctx.save();ctx.globalAlpha=Math.min(1,q*1.8);
      if(e.kind==='prism-crown-charge'){const target=enemyById(e.targetId),p=worldToScreen(target?.x??e.x,target?.y??e.y);ctx.translate(p.x,p.y);ctx.rotate(age*.8);ctx.strokeStyle='#f0e8ff';ctx.lineWidth=2.2;ctx.shadowBlur=24;ctx.shadowColor='#d6c2ff';for(let ring=0;ring<2;ring++){ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU,r=e.r*(.75+ring*.22)*(1-age*.18),x=Math.cos(a)*r,y=Math.sin(a)*r*.55;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}}
      else if(e.kind==='prism-column'){const p=worldToScreen(e.x,e.y);ctx.strokeStyle='#ffffff';ctx.shadowBlur=34;ctx.shadowColor='#fff8df';ctx.lineWidth=Math.max(5,e.width*(.45+.55*q));ctx.beginPath();ctx.moveTo(p.x,p.y-e.half);ctx.lineTo(p.x,p.y+e.half);ctx.stroke();}
      else if(e.kind==='prism-shatter'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);ctx.strokeStyle='#e8ddff';ctx.lineWidth=2;for(let i=0;i<8;i++){const a=i/8*TAU+.2,r=e.r*(.30+.85*age);ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.35,Math.sin(a)*r*.35);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
      else if(e.kind==='chrono-sever'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);ctx.strokeStyle='#efffff';ctx.lineWidth=4*q+1;ctx.beginPath();ctx.arc(0,0,e.r*(.42+.58*age),0,TAU);ctx.stroke();ctx.strokeStyle='rgba(143,255,224,.8)';ctx.lineWidth=1.5;for(let i=0;i<12;i++){const a=i/12*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*e.r*.55,Math.sin(a)*e.r*.55);ctx.lineTo(Math.cos(a)*e.r,Math.sin(a)*e.r);ctx.stroke();}}
      else if(e.kind==='ion-circuit-freeze'){ctx.strokeStyle='#dffcff';ctx.lineWidth=3;ctx.shadowBlur=20;ctx.shadowColor='#72f2ff';ctx.beginPath();e.points.forEach((node,i)=>{const p=worldToScreen(node.x,node.y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();}
      else if(e.kind==='ion-thunder'){const p=worldToScreen(e.x,e.y);ctx.strokeStyle='#ffffff';ctx.lineWidth=8*q+2;ctx.shadowBlur=30;ctx.shadowColor='#72f2ff';ctx.beginPath();ctx.moveTo(p.x,p.y-600);ctx.lineTo(p.x,p.y);ctx.stroke();}
      else if(e.kind==='nova-ring-light'||e.kind==='hypernova-charge'||e.kind==='hypernova-release'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);const release=e.kind==='hypernova-release',charge=e.kind==='hypernova-charge';ctx.strokeStyle=release?'#ffbd69':'#fff0b5';ctx.shadowBlur=release?38:30;ctx.shadowColor='#ffbd69';ctx.lineWidth=e.kind==='nova-ring-light'?2.5:release?7:5;const base=e.r||54+(e.index||0)*14,r=base*(charge?(1.14-age*.40):.38+.62*age);if(charge||release){ctx.globalAlpha=(release?.16:.10)+q*.18;ctx.fillStyle=release?'#ffbd69':'#fff4c9';ctx.beginPath();ctx.arc(0,0,r*(release?.82:.58),0,TAU);ctx.fill();ctx.globalAlpha=Math.min(1,q*1.5);for(let i=0;i<(release?16:12);i++){const a=i*TAU/(release?16:12)+age*.38,inner=r*(release?.48:.32),outer=r*(release?1.16:.88);ctx.lineWidth=release?3.2:1.8;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();}}ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();if(charge){ctx.fillStyle='#ffffff';ctx.globalAlpha=q*.96;ctx.beginPath();ctx.arc(0,0,11*(1-age*.62),0,TAU);ctx.fill();}}
      else if(e.kind==='drone-mark'){const target=enemyById(e.targetId),p=worldToScreen(target?.x??e.x,target?.y??e.y),r=30+age*8;ctx.translate(p.x,p.y);ctx.rotate(age*.8);ctx.strokeStyle='#d8fff1';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<4;i++){const a=i/4*TAU;ctx.moveTo(Math.cos(a)*r*.55,Math.sin(a)*r*.55);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.stroke();}
      else if(e.kind==='drone-meteor'){const p=worldToScreen(e.x,e.y);ctx.strokeStyle='#eafff8';ctx.lineWidth=5;ctx.shadowBlur=24;ctx.shadowColor='#8fffd0';ctx.beginPath();ctx.moveTo(p.x-70,p.y-140);ctx.lineTo(p.x,p.y);ctx.stroke();}
      else if(e.kind==='fleet-form'){const target=enemyById(e.targetId),aim=target?Math.atan2(target.y-player.y,target.x-player.x):e.a,dir={x:Math.cos(aim),y:Math.sin(aim)},normal={x:-dir.y,y:dir.x};e.a=aim;for(let i=0;i<e.count;i++){const row=Math.abs(i-(e.count-1)/2),offset=(i-(e.count-1)/2)*26,d=-76-row*15,point={x:player.x+dir.x*d+normal.x*offset,y:player.y+dir.y*d+normal.y*offset};drawFleetDrone(point,aim,1.0,age);}}
      else if(e.kind==='fleet-run'){const dx=Math.cos(e.a),dy=Math.sin(e.a),travel=clamp(age*1.08,0,1),origins=Array.isArray(e.origins)?e.origins:[];ctx.strokeStyle='#baffea';ctx.shadowBlur=18;ctx.shadowColor='#8fffd0';for(let i=0;i<origins.length;i++){const origin=origins[i],row=Math.abs(i-(origins.length-1)/2),lag=row*.055,progress=clamp((travel-lag)/(1-lag),0,1),wx=origin.x+dx*e.length*progress,wy=origin.y+dy*e.length*progress,p=worldToScreen(origin.x,origin.y),end=worldToScreen(wx,wy);ctx.globalAlpha=.16+.38*q;ctx.lineWidth=1.5+i%2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();drawFleetDrone({x:wx,y:wy},e.a,1.06,1);}}
      else if(e.kind==='rail-overdrive-charge'){const p=worldToScreen(e.x,e.y),r=e.r*(.58+.42*age);ctx.translate(p.x,p.y);ctx.rotate(age*1.15);ctx.globalAlpha=.46+.52*q;ctx.strokeStyle='#ffffff';ctx.shadowBlur=58;ctx.shadowColor='#7edcff';ctx.lineWidth=5.5;for(let ring=0;ring<4;ring++){ctx.beginPath();ctx.arc(0,0,r*(.48+ring*.22),0,TAU);ctx.stroke();}ctx.rotate(-age*2.1);ctx.globalAlpha=.62*q;ctx.strokeStyle='#8bdcff';ctx.lineWidth=2.6;for(let i=0;i<6;i++){const a=i*TAU/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.22,Math.sin(a)*r*.22);ctx.lineTo(Math.cos(a)*r*.92,Math.sin(a)*r*.92);ctx.stroke();}ctx.globalAlpha=.98*q;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(Math.cos(e.a)*r*.28,Math.sin(e.a)*r*.28,15+age*11,0,TAU);ctx.fill();}
      else if(e.kind==='rail-wave-pulse'){const p=worldToScreen(e.x,e.y),dx=Math.cos(e.a),dy=Math.sin(e.a),nx=-dy,ny=dx,w=e.width*(1+age*.34);ctx.globalAlpha=q*.72;ctx.strokeStyle='#ffffff';ctx.shadowBlur=32;ctx.shadowColor='#9fe5ff';ctx.lineWidth=Math.max(3,w*.11);for(const f of[.16,.46,.76]){const cx=p.x+dx*e.length*f,cy=p.y+dy*e.length*f,rr=w*(.30+.32*age);ctx.beginPath();ctx.ellipse(cx,cy,rr,rr*.34,e.a,0,TAU);ctx.stroke();}}
      ctx.restore();
    }
  }

  const baseDrawAlliedEffects=drawAlliedEffects;
  drawAlliedEffects=function awakeningSecondSetEffects(){baseDrawAlliedEffects();drawPrismTargetCrown();drawIonCircuit();drawNovaCorona();drawSecondFx();};

  function keepSecondFx(e){return!!(e&&e.life>0);}
  const baseUpdateEffects=updateEffects;
  updateEffects=function awakeningSecondFxUpdate(dt){baseUpdateEffects(dt);for(const e of fx)e.life-=dt;compactInPlace(fx,keepSecondFx);};

  const baseReset=resetGame;
  resetGame=function awakeningSecondSetReset(){resetSecondAwakeningState();const result=baseReset();resetSecondAwakeningState();return result;};
  const baseMenu=showMainMenu;
  showMainMenu=function awakeningSecondSetMenu(){resetSecondAwakeningState();return baseMenu();};

  window.stackfallAwakeningSecondSetDebug=()=>({
    prismTarget:player.awPrismTargetId||null,chronoPhase:player.awChronoPhase||0,ionNodes:ionNodes.length,
    ionPending:!!player.awIonDischargePending,novaCharge:player.awNovaCharge||0,droneCycle:player.awDroneFleetCycle||0,railCycle:player.awRailCycle||0,fx:fx.length
  });
})();
