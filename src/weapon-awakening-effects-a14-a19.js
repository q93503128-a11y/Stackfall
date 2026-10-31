(()=>{
  'use strict';

  const awake=key=>window.stackfallIsWeaponAwakened?.(key)===true;
  const mult=()=>Math.min(2,Math.max(0,Number(window.stackfallMultiplicityStacks?.())||0));
  const fx=state.entities.awakeningFxThird=Array.isArray(state.entities.awakeningFxThird)?state.entities.awakeningFxThird:[];
  const lotusFields=state.entities.awLotusFields=Array.isArray(state.entities.awLotusFields)?state.entities.awLotusFields:[];
  const starrailNodes=state.entities.awStarrailNodes=Array.isArray(state.entities.awStarrailNodes)?state.entities.awStarrailNodes:[];

  const pushFx=data=>{fx.push({id:state.nextId++,...data});if(fx.length>84)fx.splice(0,fx.length-84);return fx[fx.length-1];};
  function resetThirdAwakeningState(){
    fx.length=0;lotusFields.length=0;starrailNodes.length=0;
    for(const p of state.entities.projectiles||[])if(p?.awGenesis)p.life=0;
    for(const m of state.entities.guidedMissiles||[])if(m?.awSurround)m.life=0;
    for(const net of state.entities.gateNetworks||[])if(net){delete net.awGrandCharge;delete net.awGrandPending;delete net.awLastCircuitAt;if(Array.isArray(net.pulses))for(const pulse of net.pulses)if(pulse)delete pulse.awGrandEligible;}
    Object.assign(player,{
      awSpiralCycle:0,awMirrorFaces:[null,null,null,null,null,null],awMirrorSignaturePending:false,
      awMineDeployCycle:0,awMissileCycle:0,awMissileGroupSerial:0
    });
  }
  window.stackfallResetAwakeningThirdSetCombat=resetThirdAwakeningState;
  resetThirdAwakeningState();

  // A14 — Genesis Galaxy. Counter-Spiral Galaxy is restored for both normal and awakened forms.
  function spiralTarget(){return nearestWeaponTarget('spiral');}
  function spawnSpiralBody(target,n,echoed,arm,arms,step,reverse=false){
    const size=weaponSizeMultiplier(),direction=reverse?-1:1,galaxyAngle=(state.time||0)*.78+direction*(arm*TAU/Math.max(1,arms)+step*.60),orbit=52+step*14+(arm%2)*7,
      ox=player.x+Math.cos(galaxyAngle)*orbit,oy=player.y+Math.sin(galaxyAngle)*orbit,
      live=target&&!target.dead?target:spiralTarget(),toward=live?Math.atan2(live.y-oy,live.x-ox):player.angle,tangent=galaxyAngle+direction*Math.PI/2,
      blend=.30+step*.065,a=lerpAngle(tangent,toward,Math.min(.64,blend)),speed=(320+n*19+step*20)*(reverse?.96:1),extra=arm>=Math.max(0,arms-mult());
    spawnPlayerProjectile({
      x:ox,y:oy,vx:0,vy:0,r:(4.4+n*.25)*size,
      life:Math.max(1.55,weaponRange('spiral')*1.06/Math.max(1,speed)),maxRange:weaponRange('spiral')*1.06,damage:(7+n*2.05)*(echoed?.62:1)*(reverse?.62:1),
      color:echoed?COLORS.pink:reverse?'#c8a9ff':'#e8b8ff',pierce:n>=5?1:0,
      source:echoed?'echo-spiral':reverse?'spiral-counter':extra?'spiral-multiplicity':'spiral-bolt',
      spiralMotion:true,spiralOriginX:player.x,spiralOriginY:player.y,spiralAngle:galaxyAngle,spiralRadius:orbit,spiralRadialSpeed:speed,spiralAngularSpeed:direction*(2.75+arm*.06),
      multiplicityTargetId:live?.id||null,awGenesis:true
    });
  }
  function fireAwakenedSpiral(n,echoed=false,reverse=false){
    player.spiralPhase=(player.spiralPhase||0)+(reverse?-.61:.73);
    const target=spiralTarget(),arms=4+(echoed?0:mult()),beads=n>=5?5:4;
    for(let step=0;step<beads;step++)scheduleWeaponAction(step*54+(reverse?185:0),()=>{
      const live=target&&!target.dead?target:spiralTarget();
      for(let arm=0;arm<arms;arm++)spawnSpiralBody(live,n,echoed,arm,arms,step,reverse);
    });
  }
  function fireCounterSpiral(n,target){
    if(!state.weaponAugments?.spiral)return;
    const arms=n>=6?4:n>=4?3:n>=2?2:1,beads=n>=5?5:4;
    for(let step=0;step<beads;step++)scheduleWeaponAction(185+step*56,()=>{
      const live=target&&!target.dead?target:spiralTarget();if(!live)return;
      for(let arm=0;arm<arms;arm++){
        if(awake('spiral'))spawnSpiralBody(live,n,false,arm,arms,step,true);
        else{
          const base=Math.atan2(live.y-player.y,live.x-player.x),spread=(arm-(arms-1)/2)*.11,a=base+spread-(arm%2?-1:1)*(.18+step*.02),speed=292+n*17+step*15;
          spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:4+n*.22,life:1.50,maxRange:weaponRange('spiral'),damage:(7+n*2.05)*.58,color:'#c8a9ff',pierce:n>=5?1:0,source:'spiral-counter',homingTargetId:live.id,homingReacquire:false,homingTurn:n>=3?1.45:1.0});
        }
      }
    });
  }
  function triggerGenesisGalaxy(n,target){
    if(!target||target.dead)return;
    const id=target.id,x=target.x,y=target.y,size=weaponSizeMultiplier(),radius=(138+n*8)*size,augment=!!state.weaponAugments?.spiral;
    pushFx({kind:'genesis-form',targetId:id,x,y,r:radius,augment,life:.48,max:.48});
    for(let tick=0;tick<4;tick++)scheduleWeaponAction(90+tick*82,()=>{
      const live=enemyById(id),cx=live?.x??x,cy=live?.y??y,base=(tick/4)*TAU;
      for(let arm=0;arm<4;arm++){
        const armBase=base+arm*TAU/4;
        for(let segment=0;segment<3;segment++){
          const z0=segment/3,z1=(segment+1)/3,r1=radius*(.98-tick*.10-z0*.23),r2=radius*(.98-tick*.10-z1*.23),a1=armBase+z0*.78,a2=armBase+z1*.78,
            x1=cx+Math.cos(a1)*r1,y1=cy+Math.sin(a1)*r1,x2=cx+Math.cos(a2)*r2,y2=cy+Math.sin(a2)*r2;
          applyRailBeam(x1,y1,x2,y2,(4.4-segment*.55)*size,(8+n*1.7)*.42,'#e9c7ff','spiral-bolt',1);
        }
        if(augment){const ra=-base-arm*TAU/4-.18,or1=radius*(1.16-tick*.08),or2=radius*(.78-tick*.08);applyRailBeam(cx+Math.cos(ra)*or1,cy+Math.sin(ra)*or1,cx+Math.cos(ra-.72)*or2,cy+Math.sin(ra-.72)*or2,2.6*size,(8+n*1.7)*.42,'#bda4ff','spiral-counter',1);}
      }
    });
    scheduleWeaponAction(430,()=>{
      const live=enemyById(id),cx=live?.x??x,cy=live?.y??y;
      areaDamage(cx,cy,94*size,40+n*6.1,'#ffffff','spiral-bolt',{shake:false});
      shockwave(cx,cy,'#f7efff',112*size,.40,3.2);pushFx({kind:'genesis-core',x:cx,y:cy,r:112*size,life:.42,max:.42});audio.weapon?.('spiral',false,1.6);
    });
  }
  const baseFireGalacticSpiral=fireGalacticSpiral;
  fireGalacticSpiral=function genesisGalaxyFire(n,echoed=false){
    const target=spiralTarget(),awakened=awake('spiral');
    if(!awakened){baseFireGalacticSpiral(n,echoed);if(state.weaponAugments?.spiral&&!echoed)fireCounterSpiral(n,target);return;}
    fireAwakenedSpiral(n,echoed,false);
    if(!echoed)scheduleWeaponAction(105,()=>fireAwakenedSpiral(n,false,true));
    if(echoed)return;
    player.awSpiralCycle=(player.awSpiralCycle||0)+1;
    if(player.awSpiralCycle%3===0)triggerGenesisGalaxy(n,target||spiralTarget());
  };

  // A15 — Celestial Mirror Sanctuary. Capture only real enemy shots; echo casts never charge the sanctuary.
  function ensureMirrorFaces(){if(!Array.isArray(player.awMirrorFaces)||player.awMirrorFaces.length!==6)player.awMirrorFaces=[null,null,null,null,null,null];return player.awMirrorFaces;}
  function chargeMirrorFace(angle){
    const faces=ensureMirrorFaces(),index=faces.findIndex(value=>value===null);if(index<0)return false;
    faces[index]=Number.isFinite(angle)?angle:(Number.isFinite(player.facingAngle)?player.facingAngle:0);return true;
  }
  function mirrorTwinRays(origin,angle,n,scale=1){
    if(!state.weaponAugments?.mirror)return;
    const length=weaponRange('mirror')*.82,size=weaponSizeMultiplier(),damage=(8+n*2.3)*.44*scale;
    for(const offset of[-.16,.16]){const a=angle+offset;applyRailBeam(origin.x,origin.y,origin.x+Math.cos(a)*length,origin.y+Math.sin(a)*length,2.5*size,damage,'#dffdf7','mirror-twin-reflect',1);}
  }
  function triggerPerfectReflection(n){
    if(player.awMirrorSignaturePending)return;const faces=ensureMirrorFaces();if(faces.some(value=>value===null))return;
    player.awMirrorSignaturePending=true;const stored=[...faces],target=strongestPostRosterEnemy(player.x,player.y,weaponRange('mirror')),beforeShield=Number(player.shield)||0,size=weaponSizeMultiplier();
    pushFx({kind:'mirror-sanctuary',x:player.x,y:player.y,angles:stored,life:.31,max:.31});
    scheduleWeaponAction(180,()=>{
      const live=target&&!target.dead?target:strongestPostRosterEnemy(player.x,player.y,weaponRange('mirror')),targetAngle=live?Math.atan2(live.y-player.y,live.x-player.x):(Number.isFinite(player.facingAngle)?player.facingAngle:0),length=Math.max(960*size,weaponRange('mirror')*1.72);
      for(let i=0;i<6;i++){
        const panelA=i*TAU/6-Math.PI/2,origin={x:player.x+Math.cos(panelA)*64,y:player.y+Math.sin(panelA)*64},storedA=stored[i],a=Number.isFinite(storedA)?lerpAngle(storedA,targetAngle,.72):targetAngle+(i-2.5)*.085;
        applyRailBeam(origin.x,origin.y,origin.x+Math.cos(a)*length,origin.y+Math.sin(a)*length,10.2*size,19+n*3.7,'#ffffff','mirror-return',1);
        mirrorTwinRays(origin,a,n,.72);
      }
      const profile=state.weaponAugments?.mirror?mirrorAugmentShieldProfile(n):null;if(profile)player.shield=Math.min(profile.cap,Math.min(Number(player.shield)||0,beforeShield+Math.min(22,profile.gain*5)));
      player.awMirrorFaces=[null,null,null,null,null,null];player.awMirrorSignaturePending=false;
      pushFx({kind:'mirror-flash',x:player.x,y:player.y,r:150*size,life:.40,max:.40});audio.weapon?.('mirror',false,1.62);
    });
  }
  function lerpAngle(a,b,t){let d=(b-a+Math.PI)%(TAU)-Math.PI;if(d<-Math.PI)d+=TAU;return a+d*t;}
  const baseFireReflector=fireReflector;
  fireReflector=function celestialMirrorReflector(n,echoed=false){
    const before=new Map();for(const p of state.entities.enemyProjectiles)if(p&&p.life>0)before.set(p.id,{x:p.x,y:p.y,a:Math.atan2(p.y-player.y,p.x-player.x)});
    baseFireReflector(n,echoed);
    const aliveAfter=new Set();for(const p of state.entities.enemyProjectiles)if(p&&p.life>0)aliveAfter.add(p.id);
    const reflected=[];for(const [id,snap] of before)if(!aliveAfter.has(id))reflected.push(snap);
    if(state.weaponAugments?.mirror)for(const snap of reflected){const target=nearestEnemy(snap.x,snap.y,weaponRange('mirror')),a=target?Math.atan2(target.y-snap.y,target.x-snap.x):snap.a;mirrorTwinRays(snap,a,n,1);}
    if(!awake('mirror')||echoed)return;
    chargeMirrorFace(Number.isFinite(player.facingAngle)?player.facingAngle:0);
    for(const snap of reflected)chargeMirrorFace(snap.a);
    triggerPerfectReflection(n);
  };

  // A16 — Black-Star Lotus.
  function addLotusField(seed,n,radius,damage){
    const absorbed=Math.max(0,Math.min(8,seed.absorbed||0)),power=Math.max(.45,Number(seed.power)||1),forced=!!seed.forced;
    lotusFields.push({id:state.nextId++,x:seed.x,y:seed.y,n,r:radius*(forced?.78:1),damage,life:1.22,max:1.22,tick:0,absorbed,power,forced,closed:false});
    while(lotusFields.length>3){const oldest=lotusFields.shift();if(oldest&&!oldest.closed)closeLotus(oldest,.72);}
  }
  function closeLotus(field,scale=1){
    if(!field||field.closed)return;field.closed=true;
    areaDamage(field.x,field.y,field.r*.62,field.damage*.82*scale,'#fff6ff','vacuum-bloom',{shake:false});
    shockwave(field.x,field.y,'#f7edff',field.r*.72,.36,2.8);pushFx({kind:'lotus-close',x:field.x,y:field.y,r:field.r,life:.42,max:.42});
  }
  const baseDetonateVacuumSeed=detonateVacuumSeed;
  detonateVacuumSeed=function blackStarLotusDetonation(seed){
    const awakened=awake('vacuum')&&seed&&seed.life>0,n=seed?.n||weaponCount('vacuum'),size=weaponSizeMultiplier(),absorbed=Math.max(0,Math.min(8,seed?.absorbed||0)),baseRadius=(n>=2?180:165)*size*(1+absorbed*.025),baseDamage=38*(1+(n-1)*.10)*(n>=3?1.22:1)*(Number(seed?.power)||1)*(1+absorbed*.06);
    const snapshot=awakened?{x:seed.x,y:seed.y,n,absorbed,power:seed.power,forced:seed.forced}:null;
    baseDetonateVacuumSeed(seed);
    if(snapshot)addLotusField(snapshot,n,baseRadius,baseDamage);
  };
  function updateLotusFields(dt){
    for(const field of lotusFields){
      if(!field||field.closed)continue;field.life-=dt;field.tick-=dt;
      if(field.tick<=0){field.tick=.16;forEachNearbyEnemyCandidate(field.x,field.y,field.r+90,enemy=>{if(enemy.dead)return;const dx=field.x-enemy.x,dy=field.y-enemy.y,d=Math.hypot(dx,dy)||1;if(d>field.r)return;const pull=(68*(1-d/field.r))*enemyControlFactor(enemy);enemy.x+=dx/d*pull*.19;enemy.y+=dy/d*pull*.19;dealDamage(enemy,field.damage*.09,{color:'#dca9ff',source:'vacuum-bloom',canCrit:false});});}
      if(field.life<=0)closeLotus(field,1);
    }
    compactInPlace(lotusFields,field=>field&&!field.closed);
  }

  // A17 — Phase Starrail. One deployment = one route node regardless of triangle/satellites.
  function recordStarrailNode(newMines,n){
    if(!awake('mine'))return;
    let count=0,sumX=0,sumY=0;const mineIds=[];for(const m of newMines){if(!m||m.phantom)continue;count++;sumX+=m.x;sumY+=m.y;mineIds.push(m.id);}if(!count)return;
    const x=sumX/count,y=sumY/count,
      dx=x-(starrailNodes.at(-1)?.x??player.mineLastX??x),dy=y-(starrailNodes.at(-1)?.y??player.mineLastY??y),a=Math.hypot(dx,dy)>2?Math.atan2(dy,dx):(Number.isFinite(player.facingAngle)?player.facingAngle:0);
    starrailNodes.push({id:state.nextId++,x,y,a,mineIds,life:12,max:12});
    while(starrailNodes.length>6)starrailNodes.shift();
    player.awMineDeployCycle=(player.awMineDeployCycle||0)+1;
    if(player.awMineDeployCycle%5===0&&starrailNodes.length>=2)triggerStarrailRun(n,starrailNodes.slice());
  }
  function triggerStarrailRun(n,nodes){
    const points=nodes.map(node=>({x:node.x,y:node.y,mineIds:[...node.mineIds]})),size=weaponSizeMultiplier();
    pushFx({kind:'starrail-run',points,life:.62,max:.62});
    for(let i=1;i<points.length;i++)scheduleWeaponAction((i-1)*74,()=>{
      const a=points[i-1],b=points[i],damage=10+n*2.1;
      applyRailBeam(a.x,a.y,b.x,b.y,5.2*size,damage,'#dffcff','phase-wire',1);
      const node=points[i],nearEnemy=nearestEnemy(node.x,node.y,105+18*n);if(!nearEnemy)return;
      let mine=null,best=Infinity;for(const id of node.mineIds){const candidate=state.entities.phaseMines.find(m=>m?.id===id);if(!candidate||candidate.life<=0||candidate.phantom||candidate.arm>0)continue;const dx=candidate.x-nearEnemy.x,dy=candidate.y-nearEnemy.y,d2=dx*dx+dy*dy;if(d2<best){best=d2;mine=candidate;}}
      if(mine)detonatePhaseMine(mine,.82);
    });
    audio.weapon?.('mine',false,1.45);
  }
  const baseDeployPhaseMinefield=deployPhaseMinefield;
  deployPhaseMinefield=function phaseStarrailDeployment(n){
    const beforeIds=new Set();for(const m of state.entities.phaseMines)if(m&&m.life>0)beforeIds.add(m.id);
    baseDeployPhaseMinefield(n);
    const created=[];for(const m of state.entities.phaseMines)if(m&&m.life>0&&!beforeIds.has(m.id))created.push(m);
    recordStarrailNode(created,n);
  };

  // A18 — Starbreaker Arsenal. Every third original salvo replaces its main missiles with staged surround missiles.
  function tagSurroundMissile(target,n,side,damage,opts){
    const before=state.entities.guidedMissiles.length;spawnGuidedMissile(target,n,side,damage,opts);
    const m=state.entities.guidedMissiles.length>before?state.entities.guidedMissiles.at(-1):null;if(!m)return null;
    m.awSurround=true;m.awStage='gather';m.awStageAge=0;m.awSlot=opts.awSlot||0;m.awSlotCount=opts.awSlotCount||3;m.awGroup=opts.awGroup||0;m.awReady=false;m.awSignalTimer=null;m.awTargetLocked=false;m.awGatherRadius=112+Math.min(50,n*6);m.awGatherDuration=.54;
    return m;
  }
  function tagStarbreakerMissile(target,n,side,damage,opts={}){
    const before=state.entities.guidedMissiles.length;spawnGuidedMissile(target,n,side,damage,opts);
    const m=state.entities.guidedMissiles.length>before?state.entities.guidedMissiles.at(-1):null;if(!m)return null;
    m.awStarbreaker=true;m.r=Math.max(7.6,Number(m.r)||0);m.color=opts.multiplicity?'#ffe7b8':'#ffc36f';m.ignition=.10;m.life=Math.max(m.life||0,4.35);m.max=m.life;
    m.damage*=1.07;m.baseDamage=m.damage;return m;
  }
  function fireStarbreakerVolley(n){
    const native=n>=6?6:n>=2?4:2,extra=mult(),total=native+extra,maxTargets=n>=6?3:n>=4?2:1,targets=postRosterTargetList(weaponRange('missile'),maxTargets);if(!targets.length)return;
    const per=(19+(n-1)*2.6)*(native>=6?.64:native>=4?.78:1)*1.05;player.missilePodFlash=.34;audio.weapon?.('missile',false,1.18);
    for(let i=0;i<total;i++){const pair=Math.floor(i/2),side=i%2===0?-1:1,target=targets[i%targets.length],delay=pair*68+(i>=native?20+i*22:0);scheduleWeaponAction(delay,()=>{const live=enemyById(target.id)||targets.find(t=>!t.dead)||strongestPostRosterEnemy(player.x,player.y,weaponRange('missile'));if(live)tagStarbreakerMissile(live,n,side,per,{multiplicity:i>=native});});}
  }
  function fireStarbreakerSurround(n){
    const native=n>=6?6:n>=2?4:2,extra=mult(),total=native+extra,target=strongestPostRosterEnemy(player.x,player.y,weaponRange('missile'));if(!target)return;
    const group=(player.awMissileGroupSerial=(player.awMissileGroupSerial||0)+1),per=(19+(n-1)*2.6)*(native>=6?.64:native>=4?.78:1);player.missilePodFlash=.34;pushFx({kind:'arsenal-open',x:player.x,y:player.y,life:.42,max:.42});audio.weapon?.('missile',false,1.32);
    for(let i=0;i<total;i++){
      const pair=Math.floor(i/2),side=i%2===0?-1:1,delay=pair*76+(i>=native?24+i*24:0);
      scheduleWeaponAction(delay,()=>{const live=enemyById(target.id)||strongestPostRosterEnemy(player.x,player.y,weaponRange('missile'));if(live)tagSurroundMissile(live,n,side,per,{multiplicity:i>=native,awSlot:i,awSlotCount:total,awGroup:group});});
    }
  }
  const baseFireInterstellarMissiles=fireInterstellarMissiles;
  fireInterstellarMissiles=function starbreakerArsenalFire(n,echoed=false){
    if(!awake('missile')||echoed)return baseFireInterstellarMissiles(n,echoed);
    player.awMissileCycle=(player.awMissileCycle||0)+1;
    if(player.awMissileCycle%3===0)return fireStarbreakerSurround(n);
    return fireStarbreakerVolley(n);
  };
  function updateSurroundMissile(m,dt){
    if(!m||m.life<=0)return;m.life-=dt;m.age+=dt;m.awStageAge+=dt;
    let target=enemyById(m.targetId);
    if(!target&&!m.awTargetLocked&&!m.reacquired){target=strongestPostRosterEnemy(m.x,m.y,weaponRange('missile'));m.reacquired=true;if(target)m.targetId=target.id;}
    if(m.awStage==='gather'){
      if(!target){m.life=0;return;}
      const slotAngle=m.awSlot/Math.max(1,m.awSlotCount)*TAU-Math.PI/2,goalX=target.x+Math.cos(slotAngle)*m.awGatherRadius,goalY=target.y+Math.sin(slotAngle)*m.awGatherRadius,
        dx=goalX-m.x,dy=goalY-m.y,d=Math.hypot(dx,dy)||1,desired=Math.atan2(dy,dx),current=Math.atan2(m.vy,m.vx),angle=missileTurn(current,desired,5.1*dt),speed=lerp(Math.hypot(m.vx,m.vy),330*postRosterMissileSpeed(),clamp(dt*5,0,1));
      m.vx=Math.cos(angle)*speed;m.vy=Math.sin(angle)*speed;m.x+=m.vx*dt;m.y+=m.vy*dt;
      if(m.awStageAge>=m.awGatherDuration||d<22){m.awStage='hold';m.awStageAge=0;m.awReady=true;m.awTargetLocked=true;m.vx*=.14;m.vy*=.14;}
    }else if(m.awStage==='hold'){
      m.vx*=Math.pow(.12,dt*8);m.vy*=Math.pow(.12,dt*8);m.x+=m.vx*dt;m.y+=m.vy*dt;
      if(Number.isFinite(m.awSignalTimer)){m.awSignalTimer-=dt;if(m.awSignalTimer<=0){m.awStage='dive';m.awStageAge=0;pushFx({kind:'missile-dive',x:m.x,y:m.y,targetId:m.targetId,life:.28,max:.28});}}
    }else{
      target=enemyById(m.targetId)||target;if(!target){m.life=0;return;}
      const dx=target.x-m.x,dy=target.y-m.y,d=Math.hypot(dx,dy)||1,desired=Math.atan2(dy,dx),current=Math.atan2(m.vy,m.vx),angle=missileTurn(current,desired,7.2*dt),speed=lerp(Math.hypot(m.vx,m.vy),560*postRosterMissileSpeed(),clamp(dt*7.2,0,1));
      m.vx=Math.cos(angle)*speed;m.vy=Math.sin(angle)*speed;m.x+=m.vx*dt;m.y+=m.vy*dt;m.terminal=true;
      if(state.weaponAugments?.missile&&d<118)splitMirvMissile(m,target);
      if(enemySegmentOverlap(target,m.x-m.vx*dt,m.y-m.vy*dt,m.x,m.y,m.r+7))explodeGuidedMissile(m,target);
    }
  }
  const baseUpdateGuidedMissiles=updateGuidedMissiles;
  const STARBREAKER_SPECIAL_BUFFER=[],STARBREAKER_ORDINARY_BUFFER=[],STARBREAKER_GROUP_STATS=new Map();
  let starbreakerGroupSerial=0;
  updateGuidedMissiles=function starbreakerMissileUpdate(dt){
    const all=state.entities.guidedMissiles,special=STARBREAKER_SPECIAL_BUFFER,ordinary=STARBREAKER_ORDINARY_BUFFER;special.length=0;ordinary.length=0;
    for(const m of all){if(!m||m.life<=0)continue;(m.awSurround?special:ordinary).push(m);}
    if(!special.length)return baseUpdateGuidedMissiles(dt);
    state.entities.guidedMissiles=ordinary;try{baseUpdateGuidedMissiles(dt);}finally{const updated=state.entities.guidedMissiles;state.entities.guidedMissiles=all;all.length=0;for(const m of updated)all.push(m);for(const m of special)all.push(m);}
    for(const m of special)updateSurroundMissile(m,dt);
    const serial=++starbreakerGroupSerial;
    for(const m of special){if(!m||m.life<=0||m.awStage==='dive')continue;let stat=STARBREAKER_GROUP_STATS.get(m.awGroup);if(!stat){stat={serial:0,count:0,ready:0,oldest:0,signal:false};STARBREAKER_GROUP_STATS.set(m.awGroup,stat);}if(stat.serial!==serial){stat.serial=serial;stat.count=0;stat.ready=0;stat.oldest=0;stat.signal=false;}stat.count++;if(m.awReady)stat.ready++;stat.oldest=Math.max(stat.oldest,m.awStageAge||0);if(Number.isFinite(m.awSignalTimer))stat.signal=true;}
    for(const m of special){if(!m||m.life<=0||m.awStage==='dive')continue;const stat=STARBREAKER_GROUP_STATS.get(m.awGroup);if(!stat||stat.serial!==serial||stat.signal||stat.triggered===serial)continue;const required=Math.min(3,stat.count);if(stat.ready>=required||stat.oldest>=.78){stat.triggered=serial;for(const other of special){if(other?.awGroup!==m.awGroup||other.life<=0||other.awStage==='dive')continue;other.awStage='hold';other.awReady=true;other.awTargetLocked=true;other.awSignalTimer=.15;other.vx*=.20;other.vy*=.20;}}}
    if(STARBREAKER_GROUP_STATS.size>64)for(const[key,stat]of STARBREAKER_GROUP_STATS){if(serial-stat.serial>12)STARBREAKER_GROUP_STATS.delete(key);}
    compactInPlace(all,m=>m&&m.life>0);trimOldest(all,42);
  };

  // A19 — Hypergate Cathedral. Circuit completion count is shared per installed non-echo network.
  function hypergateCircuitComplete(net){
    if(!awake('gate')||!net||net.echoed||net.awGrandPending)return;
    const now=state.time||0;if(now-(Number(net.awLastCircuitAt)||-99)<.12)return;net.awLastCircuitAt=now;
    net.awGrandCharge=(net.awGrandCharge||0)+1;
    if(net.awGrandCharge<3)return;
    net.awGrandCharge=0;net.awGrandPending=true;pushFx({kind:'hypergate-charge',netId:net.id,x:net.x,y:net.y,life:.25,max:.25});
    scheduleWeaponAction(180,()=>triggerGrandTransfer(net));
  }
  function triggerGrandTransfer(net){
    if(!net||net.life<=0){if(net)net.awGrandPending=false;return;}
    const gates=net.gates||[],n=net.n,size=weaponSizeMultiplier(),damage=18+n*3.6,width=8.5*size;if(gates.length<2){net.awGrandPending=false;return;}
    const route=[...gates,gates[0]];
    for(let i=1;i<route.length;i++)scheduleWeaponAction((i-1)*58,()=>{const a=route[i-1],b=route[i];applyRailBeam(a.x,a.y,b.x,b.y,width,damage,'#ffffff','gate-pulse',1);pushFx({kind:'hypergate-route',x1:a.x,y1:a.y,x2:b.x,y2:b.y,life:.32,max:.32});});
    scheduleWeaponAction((route.length-1)*58+50,()=>{
      if(gates.length===2){
        for(let pass=0;pass<2;pass++){const a=gates[pass%2],b=gates[(pass+1)%2];applyRailBeam(a.x,a.y,b.x,b.y,width*1.20,damage*1.15,'#f4f7ff','gate-pulse',1);}
      }else if(gates.length===3){
        for(const g of gates)applyRailBeam(g.x,g.y,net.x,net.y,width*.92,damage*.86,'#eef1ff','gate-circuit',1);
        areaDamage(net.x,net.y,82*size,damage*.72,'#ffffff','gate-circuit',{shake:false});
      }else{
        applyRailBeam(gates[0].x,gates[0].y,gates[2].x,gates[2].y,width*1.08,damage*1.05,'#ffffff','gate-cross',1);
        applyRailBeam(gates[1].x,gates[1].y,gates[3].x,gates[3].y,width*1.08,damage*1.05,'#ffffff','gate-cross',1);
      }
      net.awGrandPending=false;pushFx({kind:'hypergate-rewire',netId:net.id,x:net.x,y:net.y,life:.46,max:.46});audio.weapon?.('gate',false,1.64);
    });
  }
  const baseSpawnGatePulseSet=spawnGatePulseSet;
  spawnGatePulseSet=function hypergatePulseSet(net){
    const before=net?.pulses?.length||0;baseSpawnGatePulseSet(net);if(!awake('gate')||!net||!Array.isArray(net.pulses))return;
    const native=net.n>=3?2:1,created=net.pulses.slice(before);created.forEach((pulse,index)=>pulse.awGrandEligible=index<native);
  };
  const baseGateSegmentHit=gateSegmentHit;
  gateSegmentHit=function hypergateSegmentHit(net,pulse){
    const before=Number(pulse?.done)||0;baseGateSegmentHit(net,pulse);const after=Number(pulse?.done)||0;
    if(after>before&&pulse?.awGrandEligible!==false&&net&&pulse&&after%Math.max(1,net.gates?.length||1)===0)hypergateCircuitComplete(net);
  };

  // Shared updates.
  registerWeaponUpdateInterceptor('awakening-third-set',function awakeningThirdSetWeapons(next,dt){
    next(dt);
    updateLotusFields(dt);
    for(const node of starrailNodes)node.life-=dt;compactInPlace(starrailNodes,node=>node&&node.life>0);
    if(!awake('spiral'))player.awSpiralCycle=0;
    if(!awake('mirror')){player.awMirrorFaces=[null,null,null,null,null,null];player.awMirrorSignaturePending=false;}
    if(!awake('mine')){starrailNodes.length=0;player.awMineDeployCycle=0;}
    if(!awake('missile'))player.awMissileCycle=0;
    if(!awake('vacuum'))lotusFields.length=0;
  });

  // Third-set render layer.
  const AW3_RASTER_CACHE=new Map();
  function aw3Raster(key,size,painter){return cachedRasterSurface(AW3_RASTER_CACHE,key,size,painter,96);}
  function genesisGalaxyRaster(sizeScale,t){const sb=Math.max(6,Math.round(sizeScale*10)),frame=Math.floor((t*4)%8);return aw3Raster(`genesis:${sb}:${frame}`,180,(g,sz)=>{const c=sz/2,ss=sb/10;g.save();g.translate(c,c);g.scale(1,.48);g.shadowBlur=20;g.shadowColor='#dca9ff';const core=g.createRadialGradient(0,0,2,0,0,16*ss);core.addColorStop(0,'#ffffff');core.addColorStop(.36,'#e8d5ff');core.addColorStop(1,'rgba(104,55,170,0)');g.fillStyle=core;g.beginPath();g.arc(0,0,17*ss,0,TAU);g.fill();for(let arm=0;arm<4;arm++){g.save();g.rotate(frame/8*TAU*.42+arm*TAU/4);g.strokeStyle=arm%2?'rgba(199,160,255,.72)':'rgba(237,205,255,.82)';g.lineWidth=(4-arm*.25)*ss;g.beginPath();for(let qn=0;qn<=18;qn++){const q=qn/18,a=q*2.2,r=8+q*45*ss,x=Math.cos(a)*r,y=Math.sin(a)*r;qn?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();g.fillStyle='#ffffff';g.beginPath();g.arc(Math.cos(2.2)*(53*ss),Math.sin(2.2)*(53*ss),3.8*ss,0,TAU);g.fill();g.restore();}g.restore();});}
  function mirrorPlateRaster(charged){return aw3Raster(`mirror-plate:${charged?1:0}`,112,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=charged?28:15;g.shadowColor=charged?'#c8fff4':'#74e9d6';const glass=g.createLinearGradient(-26,-12,28,12);glass.addColorStop(0,charged?'#dffff8':'#071216');glass.addColorStop(.42,charged?'#6fe9dc':'#0a2228');glass.addColorStop(1,'#020608');g.fillStyle=glass;g.strokeStyle=charged?'#ffffff':'#93ffe9';g.lineWidth=2;g.beginPath();g.moveTo(30,0);g.lineTo(10,-15);g.lineTo(-19,-12);g.lineTo(-30,0);g.lineTo(-19,12);g.lineTo(10,15);g.closePath();g.fill();g.stroke();g.globalAlpha=.82;g.strokeStyle=charged?'#eaffff':'#4fcdbd';g.lineWidth=1.1;g.beginPath();g.moveTo(20,0);g.lineTo(4,-8);g.lineTo(-18,-6);g.lineTo(-22,0);g.lineTo(-18,6);g.lineTo(4,8);g.closePath();g.stroke();g.globalAlpha=charged?.84:.36;g.fillStyle='#ffffff';g.beginPath();g.arc(22,0,charged?3.8:2.3,0,TAU);g.fill();g.restore();});}
  function blackLotusSeedRaster(charge,blooming,absorbed){const c=Math.min(5,charge||0),a=Math.min(6,absorbed||0),petal=11+c*2.1;return aw3Raster(`lotus-seed:${c}:${blooming?1:0}:${a}`,96,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=18;g.shadowColor='#d58cff';for(let i=0;i<6;i++){g.save();g.rotate(i*TAU/6);g.fillStyle=i%2?'#4d285f':'#7d3c92';g.strokeStyle=blooming?'#fff3ff':'#dca6ff';g.lineWidth=1.3;g.beginPath();g.moveTo(3,-3);g.quadraticCurveTo(petal*.65,-6,petal*1.32,0);g.quadraticCurveTo(petal*.65,6,3,3);g.closePath();g.fill();g.stroke();if(a>i){g.strokeStyle='#ffffff';g.beginPath();g.moveTo(4,0);g.lineTo(petal*.98,0);g.stroke();}g.restore();}g.fillStyle='#010104';g.beginPath();g.arc(0,0,7,0,TAU);g.fill();g.restore();});}
  function lotusFieldRaster(r,absorbed){const rb=Math.max(40,Math.round(r/8)*8),a=Math.min(12,absorbed||0),size=Math.ceil(rb*2+48);return aw3Raster(`lotus-field:${rb}:${a}`,size,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=16;g.shadowColor='#d58cff';for(let i=0;i<6;i++){g.save();g.rotate(i*TAU/6);g.fillStyle=i%2?'rgba(124,63,170,.30)':'rgba(213,140,255,.25)';g.strokeStyle=i%2?'#8b5ab1':'#dba5ff';g.lineWidth=1.4;g.beginPath();g.moveTo(rb*.08,-rb*.06);g.bezierCurveTo(rb*.32,-rb*.20,rb*.80,-rb*.13,rb*.94,0);g.bezierCurveTo(rb*.76,rb*.15,rb*.31,rb*.20,rb*.08,rb*.06);g.closePath();g.fill();g.stroke();g.restore();}g.fillStyle='#020106';g.beginPath();g.arc(0,0,12+a*.8,0,TAU);g.fill();g.strokeStyle='#f6edff';g.lineWidth=1.4;g.beginPath();g.arc(0,0,14+a*.8,0,TAU);g.stroke();g.restore();});}
  function starrailMineRaster(phantom){const r=phantom?5:10;return aw3Raster(`starrail-mine:${phantom?1:0}`,80,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=phantom?9:16;g.shadowColor='#74e8ff';g.strokeStyle=phantom?'#dffcff':'#b9f7ff';g.fillStyle=phantom?'rgba(210,250,255,.20)':'rgba(17,68,92,.78)';g.lineWidth=1.5;g.beginPath();g.moveTo(r*1.65,0);g.lineTo(r*.32,-r*.52);g.lineTo(-r*.92,-r*.38);g.lineTo(-r*.92,r*.38);g.lineTo(r*.32,r*.52);g.closePath();g.fill();g.stroke();if(!phantom){for(const side of[-1,1]){g.strokeStyle='#74e8ff';g.beginPath();g.moveTo(-r*.2,side*r*.45);g.lineTo(-r*1.25,side*r*.75);g.stroke();}}g.restore();});}
  function starbreakerPodRaster(flash){const fb=Math.round(clamp(flash,0,1)*3);return aw3Raster(`starbreaker-pod:${fb}`,144,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=14+(fb/3)*20;g.shadowColor='#ff9f5f';g.fillStyle='#101722';g.strokeStyle='#ffcc8e';g.lineWidth=1.8;g.beginPath();g.moveTo(42,-5);g.lineTo(25,-20);g.lineTo(-26,-20);g.lineTo(-42,-10);g.lineTo(-46,10);g.lineTo(-26,20);g.lineTo(25,20);g.lineTo(42,5);g.closePath();g.fill();g.stroke();g.fillStyle='#2b1d17';g.strokeStyle='#ffad66';g.lineWidth=1.1;for(let row=0;row<2;row++)for(let col=0;col<3;col++){const x=-20+col*16,y=-8+row*16,hot=fb>0&&((row*3+col+fb)%3===0);g.fillStyle=hot?'#fff1ce':'#24120d';g.beginPath();g.arc(x,y,5.2,0,TAU);g.fill();g.stroke();if(hot){g.shadowBlur=18;g.shadowColor='#ffb66e';g.fillStyle='#ffffff';g.beginPath();g.arc(x,y,2.1,0,TAU);g.fill();}}g.shadowBlur=10;g.strokeStyle='rgba(255,211,160,.62)';g.beginPath();g.moveTo(24,-15);g.lineTo(35,-5);g.lineTo(35,5);g.lineTo(24,15);g.stroke();g.restore();});}
  function starbreakerMissileRaster(micro,surround,stage,terminal){
    const stateKey=surround?String(stage||'gather'):'normal',size=112;
    return aw3Raster(`starbreaker-missile:${micro?1:0}:${surround?1:0}:${stateKey}:${terminal?1:0}`,size,(g,sz)=>{
      const r=micro?4.2:surround?8.8:7.2,hot=surround?'#ff8b66':'#ffc36f';g.save();g.translate(sz/2,sz/2);g.shadowBlur=surround?24:18;g.shadowColor=hot;
      g.fillStyle=surround?'#2a1117':'#18202b';g.strokeStyle=terminal?'#ffffff':'#ffe0a5';g.lineWidth=1.7;g.beginPath();g.moveTo(r*3.2,0);g.lineTo(r*.65,-r*.82);g.lineTo(-r*.55,-r*.72);g.lineTo(-r*1.45,-r*1.12);g.lineTo(-r*1.18,0);g.lineTo(-r*1.45,r*1.12);g.lineTo(-r*.55,r*.72);g.lineTo(r*.65,r*.82);g.closePath();g.fill();g.stroke();
      g.fillStyle='#fff4d7';g.beginPath();g.moveTo(r*2.55,0);g.lineTo(r*.25,-r*.23);g.lineTo(-r*.75,0);g.lineTo(r*.25,r*.23);g.closePath();g.fill();
      g.globalAlpha=.88;g.fillStyle=surround&&stage==='hold'?'#ffffff':hot;g.beginPath();g.moveTo(-r*1.05,-r*.42);g.lineTo(-r*(terminal?3.6:2.7),0);g.lineTo(-r*1.05,r*.42);g.closePath();g.fill();
      if(surround){g.globalAlpha=.72;g.strokeStyle=stage==='dive'?'#ffffff':'#ffb08a';g.lineWidth=1.4;g.beginPath();g.arc(0,0,r*1.55,-.75,.75);g.stroke();g.beginPath();g.arc(0,0,r*1.55,Math.PI-.75,Math.PI+.75);g.stroke();}g.restore();
    });
  }
  function hypergateRaster(echoed,charge){const c=Math.max(0,Math.min(2,charge||0));return aw3Raster(`hypergate:${echoed?1:0}:${c}`,128,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=22;g.shadowColor=echoed?COLORS.pink:'#a9b7ff';g.strokeStyle=echoed?COLORS.pink:'#e0e5ff';g.lineWidth=2.4;g.beginPath();g.ellipse(0,0,22,43,0,0,TAU);g.stroke();g.strokeStyle='#899cff';g.lineWidth=1.3;g.setLineDash([8,6]);g.beginPath();g.ellipse(0,0,15,35,0,0,TAU);g.stroke();g.setLineDash([]);const veil=g.createLinearGradient(0,-28,0,28);veil.addColorStop(0,'rgba(35,42,95,.06)');veil.addColorStop(.5,'rgba(118,139,255,.22)');veil.addColorStop(1,'rgba(10,12,36,.08)');g.fillStyle=veil;g.beginPath();g.ellipse(0,0,11,29,0,0,TAU);g.fill();for(let k=0;k<3;k++){g.strokeStyle=k<c?'#ffffff':'rgba(169,183,255,.20)';g.lineWidth=k<c?2.1:1;g.beginPath();g.arc(0,0,27+k*4,-.50,.50);g.stroke();}g.restore();});}
  function drawGenesisGalaxy(){if(!awake('spiral'))return;const x=vw/2-26,y=vh/2+18,t=performance.now()*.001,size=weaponSizeMultiplier(),image=genesisGalaxyRaster(size,t);ctx.save();ctx.translate(x,y);ctx.rotate(-.38);ctx.globalAlpha=.88;ctx.drawImage(image,-90,-90,180,180);ctx.restore();}
  function drawMirrorSanctuary(){
    if(!awake('mirror'))return;const faces=ensureMirrorFaces(),t=performance.now()*.001,rr=112*weaponSizeMultiplier();let nearest=null,best=Infinity;
    for(const projectile of state.entities.enemyProjectiles){if(!projectile||projectile.life<=0)continue;const dx=projectile.x-player.x,dy=projectile.y-player.y,d2=dx*dx+dy*dy;if(d2<best){best=d2;nearest=projectile;}}
    const threat=nearest?Math.atan2(nearest.y-player.y,nearest.x-player.x):null,points=[];
    for(let i=0;i<6;i++){const orbitA=i*TAU/6+t*.018;points.push({a:orbitA,x:vw/2+Math.cos(orbitA)*rr,y:vh/2+Math.sin(orbitA)*rr});}
    ctx.save();ctx.globalAlpha=.34;ctx.strokeStyle='rgba(119,255,226,.72)';ctx.lineWidth=1.25;ctx.setLineDash([7,9]);ctx.lineDashOffset=-t*8;ctx.beginPath();for(let i=0;i<points.length;i++){const p=points[i];i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.closePath();ctx.stroke();ctx.setLineDash([]);ctx.restore();
    for(let i=0;i<6;i++){const point=points[i],face=Number.isFinite(threat)?lerpAngle(point.a+Math.PI/2,threat,.52):point.a+Math.PI/2,image=mirrorPlateRaster(faces[i]!==null);ctx.save();ctx.translate(point.x,point.y);ctx.rotate(face);ctx.drawImage(image,-56,-56,112,112);ctx.restore();}
  }
  function drawLotusField(field,t){const sx=field.x-player.x+vw/2,sy=field.y-player.y+vh/2,q=clamp(field.life/field.max,0,1),pulse=.94+.07*Math.sin(t*4+field.id),image=lotusFieldRaster(field.r,field.absorbed||0),size=image.width||Math.ceil(field.r*2+48);ctx.save();ctx.translate(sx,sy);ctx.rotate(-t*.13+field.id*.19);ctx.globalAlpha=.34+.42*q;ctx.scale(pulse,pulse);ctx.drawImage(image,-size/2,-size/2,size,size);ctx.globalAlpha=.52+.28*q;ctx.strokeStyle='#f3dfff';ctx.shadowBlur=18;ctx.shadowColor='#c785ff';ctx.lineWidth=2;for(let i=0;i<6;i++){const a=i*TAU/6+t*.10,r1=field.r*.16,r2=field.r*.80;ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.quadraticCurveTo(Math.cos(a+.25)*field.r*.48,Math.sin(a+.25)*field.r*.48,Math.cos(a+.48)*r2,Math.sin(a+.48)*r2);ctx.stroke();}ctx.restore();}
  function drawAwakenedVacuumSeeds(){if(!awake('vacuum'))return;const t=performance.now()*.001;for(const seed of state.entities.vacuumSeeds){if(!seed||seed.life<=0)continue;const sx=seed.x-player.x+vw/2,sy=seed.y-player.y+vh/2,image=blackLotusSeedRaster(seed.charge||0,!!seed.blooming,seed.absorbed||0);ctx.save();ctx.translate(sx,sy);ctx.rotate(t*.20+seed.id*.11);ctx.drawImage(image,-48,-48,96,96);ctx.restore();}}
  function starrailMineAngle(mineId,fallback){for(let i=0;i<starrailNodes.length;i++){const node=starrailNodes[i],ids=node.mineIds;for(let j=0;j<ids.length;j++)if(ids[j]===mineId)return node.a;}return fallback;}
  function drawAwakenedMines(){if(!awake('mine'))return;const t=performance.now()*.001;if(starrailNodes.length>1){ctx.save();ctx.strokeStyle='rgba(181,247,255,.34)';ctx.lineWidth=2;ctx.setLineDash([10,7]);ctx.lineDashOffset=-t*12;ctx.beginPath();for(let i=0;i<starrailNodes.length;i++){const node=starrailNodes[i],sx=node.x-player.x+vw/2,sy=node.y-player.y+vh/2;i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);}ctx.stroke();ctx.setLineDash([]);ctx.restore();}for(const mine of state.entities.phaseMines){if(!mine||mine.life<=0)continue;const sx=mine.x-player.x+vw/2,sy=mine.y-player.y+vh/2,a=mine.phantom?t*1.3:starrailMineAngle(mine.id,t*.18),image=starrailMineRaster(!!mine.phantom);ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.globalAlpha=mine.arm>0?.38:1;ctx.drawImage(image,-40,-40,80,80);ctx.restore();}}
  function drawAwakenedMissiles(){
    if(!awake('missile'))return;
    for(const m of state.entities.guidedMissiles||[]){if(!m||m.life<=0)continue;const sx=m.x-player.x+vw/2,sy=m.y-player.y+vh/2,a=Math.atan2(m.vy||0,m.vx||0),image=starbreakerMissileRaster(!!m.micro,!!m.awSurround,m.awStage,!!m.terminal),scale=m.awSurround?1.15:m.awStarbreaker?1.02:.82;ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.scale(scale,scale);ctx.drawImage(image,-56,-56,112,112);ctx.restore();}
  }
  function drawStarbreakerPods(){if(!awake('missile'))return;const a=Number.isFinite(player.facingAngle)?player.facingAngle:-Math.PI/2,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,flash=clamp((player.missilePodFlash||0)/.34,0,1),size=weaponSizeMultiplier(),image=starbreakerPodRaster(flash),back=30*size,lateral=(70+flash*12)*size;for(const side of[-1,1]){const sx=vw/2-dx*back+nx*lateral*side,sy=vh/2-dy*back+ny*lateral*side;ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.scale(size*.92,size*.92);ctx.drawImage(image,-72,-72,144,144);ctx.globalAlpha=.34+.26*flash;ctx.strokeStyle='#ffb66e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-34,side*4);ctx.lineTo(-54,side*10);ctx.stroke();ctx.restore();}}
  function drawHypergates(){if(!awake('gate'))return;const t=performance.now()*.001;for(const net of state.entities.gateNetworks){if(!net||net.life<=0)continue;const alpha=clamp(Math.min(net.life,.45)/.45,.15,1),charge=Math.max(0,Math.min(2,net.awGrandCharge||0)),image=hypergateRaster(!!net.echoed,charge);for(let i=0;i<net.gates.length;i++){const gate=net.gates[i],sx=gate.x-player.x+vw/2,sy=gate.y-player.y+vh/2;ctx.save();ctx.translate(sx,sy);ctx.rotate((i%2?1:-1)*t*.16);ctx.globalAlpha=alpha;ctx.drawImage(image,-64,-64,128,128);ctx.restore();}}}
  const baseDrawPostRosterWeaponEntities=drawPostRosterWeaponEntities;
  drawPostRosterWeaponEntities=function awakenedThirdPostRosterVisuals(){
    const hideVacuum=awake('vacuum'),hideMine=awake('mine'),hideMissile=awake('missile'),hideGate=awake('gate'),
      seeds=state.entities.vacuumSeeds,mines=state.entities.phaseMines,missiles=state.entities.guidedMissiles,nets=state.entities.gateNetworks,savedMissile=state.weaponStacks.missile;
    if(hideVacuum)state.entities.vacuumSeeds=[];if(hideMine)state.entities.phaseMines=[];if(hideMissile)state.entities.guidedMissiles=[];if(hideGate)state.entities.gateNetworks=[];if(hideMissile)state.weaponStacks.missile=0;
    try{baseDrawPostRosterWeaponEntities();}finally{if(hideVacuum)state.entities.vacuumSeeds=seeds;if(hideMine)state.entities.phaseMines=mines;if(hideMissile)state.entities.guidedMissiles=missiles;if(hideGate)state.entities.gateNetworks=nets;if(hideMissile)state.weaponStacks.missile=savedMissile;}
    drawAwakenedVacuumSeeds();for(const field of lotusFields)drawLotusField(field,performance.now()*.001);drawAwakenedMines();drawAwakenedMissiles();drawStarbreakerPods();drawHypergates();
  };

  function drawThirdFx(){
    for(const e of fx){const q=clamp(e.life/Math.max(.001,e.max),0,1),age=1-q;ctx.save();ctx.globalAlpha=Math.min(1,q*1.8);
      if(e.kind==='genesis-form'){const target=enemyById(e.targetId),p=worldToScreen(target?.x??e.x,target?.y??e.y);ctx.translate(p.x,p.y);ctx.rotate(age*1.2);for(let arm=0;arm<4;arm++){ctx.save();ctx.rotate(arm*TAU/4);ctx.strokeStyle=arm%2?'#e9c7ff':'#bda4ff';ctx.lineWidth=4;ctx.shadowBlur=20;ctx.shadowColor='#d7a9ff';ctx.beginPath();for(let s=0;s<=12;s++){const z=s/12,a=z*2.1,r=e.r*(.15+.78*z)*(1-age*.26),x=Math.cos(a)*r,y=Math.sin(a)*r;s?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.restore();}}
      else if(e.kind==='genesis-core'||e.kind==='mirror-flash'||e.kind==='lotus-close'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);ctx.strokeStyle=e.kind==='lotus-close'?'#fff0ff':'#ffffff';ctx.shadowBlur=28;ctx.shadowColor=e.kind==='lotus-close'?'#d58cff':'#bfffe8';ctx.lineWidth=4*q+1;ctx.beginPath();ctx.arc(0,0,e.r*(.30+.70*age),0,TAU);ctx.stroke();}
      else if(e.kind==='mirror-sanctuary'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);ctx.rotate(age*.7);ctx.strokeStyle='#f4fffb';ctx.lineWidth=2.4;ctx.shadowBlur=24;ctx.shadowColor='#9fffe7';ctx.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/2,r=92*(.74+.26*age),x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}
      else if(e.kind==='starrail-run'){ctx.strokeStyle='#e9fdff';ctx.lineWidth=5*q+2;ctx.shadowBlur=24;ctx.shadowColor='#74e8ff';ctx.beginPath();e.points.forEach((node,i)=>{const p=worldToScreen(node.x,node.y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();}
      else if(e.kind==='arsenal-open'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);ctx.strokeStyle='#ffd3a0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,54+age*24,-.75,.75);ctx.stroke();ctx.beginPath();ctx.arc(0,0,54+age*24,Math.PI-.75,Math.PI+.75);ctx.stroke();}
      else if(e.kind==='missile-dive'){const p=worldToScreen(e.x,e.y),target=enemyById(e.targetId),b=target?worldToScreen(target.x,target.y):p;ctx.strokeStyle='#fff1c9';ctx.lineWidth=2.4;ctx.setLineDash([10,8]);ctx.lineDashOffset=-age*48;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
      else if(e.kind==='hypergate-charge'||e.kind==='hypergate-rewire'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);ctx.strokeStyle='#ffffff';ctx.shadowBlur=28;ctx.shadowColor='#a9b7ff';ctx.lineWidth=e.kind==='hypergate-rewire'?4:2.5;ctx.beginPath();ctx.arc(0,0,(e.kind==='hypergate-rewire'?138:96)*(.52+.48*age),0,TAU);ctx.stroke();}
      else if(e.kind==='hypergate-route'){const a=worldToScreen(e.x1,e.y1),b=worldToScreen(e.x2,e.y2);ctx.strokeStyle='#ffffff';ctx.lineWidth=7*q+2;ctx.shadowBlur=24;ctx.shadowColor='#a9b7ff';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      ctx.restore();
    }
  }
  const baseDrawAlliedEffects=drawAlliedEffects;
  drawAlliedEffects=function awakeningThirdSetEffects(){baseDrawAlliedEffects();drawGenesisGalaxy();drawMirrorSanctuary();drawThirdFx();};

  function keepThirdFx(e){return!!(e&&e.life>0);}
  const baseUpdateEffects=updateEffects;
  updateEffects=function awakeningThirdFxUpdate(dt){baseUpdateEffects(dt);for(const e of fx)e.life-=dt;compactInPlace(fx,keepThirdFx);};

  const baseReset=resetGame;
  resetGame=function awakeningThirdSetReset(){resetThirdAwakeningState();const result=baseReset();resetThirdAwakeningState();return result;};
  const baseMenu=showMainMenu;
  showMainMenu=function awakeningThirdSetMenu(){resetThirdAwakeningState();return baseMenu();};

  window.stackfallAwakeningThirdSetDebug=()=>({
    spiralCycle:player.awSpiralCycle||0,mirrorFaces:ensureMirrorFaces().filter(v=>v!==null).length,lotusFields:lotusFields.length,
    starrailNodes:starrailNodes.length,mineCycle:player.awMineDeployCycle||0,missileCycle:player.awMissileCycle||0,
    surroundMissiles:state.entities.guidedMissiles.filter(m=>m?.awSurround).length,hypergates:state.entities.gateNetworks.map(net=>({id:net.id,charge:net.awGrandCharge||0,pending:!!net.awGrandPending})),fx:fx.length
  });
})();
