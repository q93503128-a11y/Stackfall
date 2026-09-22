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
    Object.assign(player,{
      awPrismTargetId:null,awPrismTargetX:0,awPrismTargetY:0,
      awChronoPhase:0,awChronoSeverFlash:0,
      awIonCircuitCd:0,awIonDischargePending:false,
      awNovaCharge:0,awDroneFleetCycle:0,awRailCycle:0
    });
  }
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
    const snapshot=ionNodes.slice(0,7).map(node=>({enemyId:node.enemyId,x:node.x,y:node.y}));
    const live=snapshot.map(node=>enemyById(node.enemyId)).filter(Boolean),core=live.sort((a,b)=>(b.hp||0)-(a.hp||0))[0];
    const cx=core?.x??snapshot[0]?.x??player.x,cy=core?.y??snapshot[0]?.y??player.y;
    pushFx({kind:'ion-circuit-freeze',points:snapshot,cx,cy,life:.32,max:.32});
    scheduleWeaponAction(190,()=>{
      const current=snapshot.map(node=>enemyById(node.enemyId)).filter(Boolean),anchor=current.sort((a,b)=>(b.hp||0)-(a.hp||0))[0],ax=anchor?.x??cx,ay=anchor?.y??cy,size=weaponSizeMultiplier();
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
    pushFx({kind:'fleet-form',targetId,x:player.x,y:player.y,a:angle,count,life:.32,max:.32});
    scheduleWeaponAction(270,()=>{
      const live=enemyById(targetId)||strongestDroneTarget();if(!live)return;
      const a=Math.atan2(live.y-player.y,live.x-player.x),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,length=Math.max(520,Math.min(weaponRange('drone')*1.22,Math.hypot(live.x-player.x,live.y-player.y)+280)),startX=player.x-dx*95,startY=player.y-dy*95;
      for(let i=0;i<count;i++){
        const offset=(i-(count-1)/2)*22*size,x1=startX+nx*offset,y1=startY+ny*offset,x2=x1+dx*length,y2=y1+dy*length;
        applyRailBeam(x1,y1,x2,y2,4.4*size,(13+n*3.5)*.70,'#baffea',i>=Math.max(1,count-multiplicity())?'drone-multiplicity':'meteor-drone',1);
      }
      pushFx({kind:'fleet-run',x:startX,y:startY,a,count,length,life:.44,max:.44});
      scheduleWeaponAction(115,()=>{
        const final=enemyById(targetId)||live;if(!final||final.dead)return;
        areaDamage(final.x,final.y,82*size,24+n*4.6,'#e8fff7','meteor-drone',{shake:false});
        shockwave(final.x,final.y,'#d8fff1',108*size,.34,3);
      });
      audio.weapon?.('drone',false,1.55);
    });
  }
  const baseFireMeteorDrones=fireMeteorDrones;
  fireMeteorDrones=function fallingStarFleetDrones(n,echoed=false){
    baseFireMeteorDrones(n,echoed);
    if(echoed)return;
    const target=strongestDroneTarget();if(state.weaponAugments?.drone)fallingStarMark(n,target);
    if(!awake('drone'))return;
    player.awDroneFleetCycle=(player.awDroneFleetCycle||0)+1;
    if(player.awDroneFleetCycle%5===0)launchFallingStarFleet(n,target||nearestWeaponTarget('drone'));
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
  function fireTerminusRail(n,target){
    if(!target||target.dead)return;
    const targetId=target.id,a=Math.atan2(target.y-player.y,target.x-player.x),length=weaponRange('rail')*1.08,size=weaponSizeMultiplier();
    pushFx({kind:'rail-assemble',targetId,x:player.x,y:player.y,a,length,life:.31,max:.31});
    scheduleWeaponAction(300,()=>{
      const live=enemyById(targetId)||railAwakeningTarget();if(!live)return;
      const angle=Math.atan2(live.y-player.y,live.x-player.x),dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx,startX=player.x-dx*42,startY=player.y-dy*42,width=(16+n*1.45)*size,damage=88+n*13.5,eliteBonus=n>=5?1.38:1;
      applyRailBeam(startX,startY,startX+dx*length,startY+dy*length,width,damage,'#ffffff','rail',eliteBonus);
      const extra=multiplicity();for(let i=0;i<extra;i++){const side=i%2?1:-1,offset=side*(24+Math.floor(i/2)*16)*size;applyRailBeam(startX+nx*offset,startY+ny*offset,startX+dx*length+nx*offset,startY+dy*length+ny*offset,width*.48,damage*.46,'#cfefff','rail-multiplicity',eliteBonus);}
      terminusFracture(startX,startY,angle,length,n);
      pushFx({kind:'rail-fire',x:startX,y:startY,a:angle,length,width,life:.46,max:.46});
      state.camera.shake=Math.max(state.camera.shake,6);state.flash=Math.max(state.flash,.09);audio.weapon?.('rail',false,1.75);
    });
  }
  const baseFireRailgun=fireRailgun;
  fireRailgun=function terminusRailgun(n,echoed=false){
    baseFireRailgun(n,echoed);
    if(!awake('rail')||echoed)return;
    player.awRailCycle=(player.awRailCycle||0)+1;
    if(player.awRailCycle%4===0)fireTerminusRail(n,railAwakeningTarget());
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
    if(!awake('drone'))player.awDroneFleetCycle=0;
    if(!awake('rail'))player.awRailCycle=0;
  };

  // A8/A12 orbit silhouettes.
  const baseDrawEquippedOrbits=drawEquippedOrbits;
  function drawCrownPrism(point,t,size){
    const s=worldToScreen(point.x,point.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-point.a+t*.00052);ctx.scale(size,size);ctx.shadowBlur=22;ctx.shadowColor='#dccbff';ctx.fillStyle='#181129';ctx.strokeStyle='#f2eaff';ctx.lineWidth=1.7;
    ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(10,-7);ctx.lineTo(7,13);ctx.lineTo(0,8);ctx.lineTo(-7,13);ctx.lineTo(-10,-7);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#c4aeff';ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(0,8);ctx.moveTo(-10,-7);ctx.lineTo(10,-7);ctx.stroke();ctx.restore();
  }
  function drawFleetDrone(point,a,size,boost=0){
    const s=worldToScreen(point.x,point.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);ctx.scale(size,size);ctx.shadowBlur=15+boost*14;ctx.shadowColor='#8fffd0';ctx.fillStyle='#0b2630';ctx.strokeStyle='#d9fff5';ctx.lineWidth=1.45;
    ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(3,-5);ctx.lineTo(-7,-11);ctx.lineTo(-5,-3);ctx.lineTo(-12,0);ctx.lineTo(-5,3);ctx.lineTo(-7,11);ctx.lineTo(3,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=boost?'#ffffff':'#8fffd0';ctx.beginPath();ctx.moveTo(-8,-3);ctx.lineTo(-15,0);ctx.lineTo(-8,3);ctx.closePath();ctx.fill();ctx.restore();
  }
  drawEquippedOrbits=function awakenedCrownFleetOrbits(x,y,t){
    const prismN=weaponCount('prism'),droneN=weaponCount('drone'),hidePrism=prismN&&awake('prism'),hideDrone=droneN&&awake('drone'),savedPrism=state.weaponStacks.prism,savedDrone=state.weaponStacks.drone;
    if(hidePrism)state.weaponStacks.prism=0;if(hideDrone)state.weaponStacks.drone=0;
    try{baseDrawEquippedOrbits(x,y,t);}finally{if(hidePrism)state.weaponStacks.prism=savedPrism;if(hideDrone)state.weaponStacks.drone=savedDrone;}
    const size=weaponSizeMultiplier();
    if(hidePrism){
      const points=prismPositions(prismAwakenedBodyCount(prismN));for(const point of points)drawCrownPrism(point,t,size);
      if(points.length>=2){const pts=points.map(p=>worldToScreen(p.x,p.y));ctx.save();ctx.strokeStyle='rgba(225,211,255,.34)';ctx.lineWidth=1.4;ctx.setLineDash([5,7]);ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(pts.length>2)ctx.closePath();ctx.stroke();ctx.setLineDash([]);ctx.restore();}
    }
    if(hideDrone){
      const points=[...meteorDronePositions(droneN)],extra=multiplicity();for(let i=0;i<extra;i++){const a=(i+.5)*TAU/Math.max(1,extra)+player.angle*.31;points.push({x:player.x+Math.cos(a)*(orbitRadiusFor('drone')+18),y:player.y+Math.sin(a)*(orbitRadiusFor('drone')+18),a});}
      for(const point of points)drawFleetDrone(point,point.a+Math.PI/2,size*.92,0);
    }
  };

  // A9 permanent clock silhouette.
  const baseDrawChronoField=drawChronoField;
  drawChronoField=function eternalClockVisual(){
    if(!awake('chrono'))return baseDrawChronoField();
    const n=Math.max(1,weaponCount('chrono')),x=vw/2,y=vh/2,r=(150+n*18)*weaponSizeMultiplier(),phase=clamp(player.awChronoPhase||0,0,1),t=performance.now();
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=.34;ctx.shadowBlur=10;ctx.shadowColor='#bffdf2';
    for(const [index,rr] of [r,r-22].entries()){ctx.save();ctx.rotate((index?1:-1)*t/(index?5100:6900));ctx.strokeStyle=index?'#9caeff':'#8fffe0';ctx.lineWidth=index?1.2:1.8;ctx.setLineDash(index?[8,9]:[18,6]);ctx.beginPath();ctx.arc(0,0,rr,0,TAU);ctx.stroke();ctx.restore();}
    ctx.setLineDash([]);for(let i=0;i<12;i++){const a=i/12*TAU-Math.PI/2,major=i%3===0,inner=r-(major?17:10);ctx.strokeStyle=major?'rgba(239,255,252,.82)':'rgba(143,255,224,.55)';ctx.lineWidth=major?2.1:1;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*(r+3),Math.sin(a)*(r+3));ctx.stroke();}
    const hand=phase*TAU-Math.PI/2;ctx.rotate(hand);ctx.strokeStyle='#ffffff';ctx.lineWidth=2.6;ctx.shadowBlur=18;ctx.shadowColor='#ffffff';ctx.beginPath();ctx.moveTo(-r*.12,0);ctx.lineTo(r*.83,0);ctx.stroke();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.fill();ctx.restore();
    if((player.awChronoSeverFlash||0)>0){const q=clamp(player.awChronoSeverFlash/.48,0,1);ctx.save();ctx.globalAlpha=.09*q;ctx.fillStyle='#eef4f2';ctx.fillRect(0,0,vw,vh);ctx.restore();}
  };

  function drawPrismTargetCrown(){
    if(!awake('prism'))return;const lock=player.prismSharedLock,target=lock?.targetId?enemyById(lock.targetId):null;if(!target)return;
    const s=worldToScreen(target.x,target.y),heat=clamp((lock.heat||0)/Math.max(.01,weaponCount('prism')>=6?1.55:1.78),0,1),verts=6,r=42+heat*18,t=performance.now()*.0014;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(t);ctx.shadowBlur=18;ctx.shadowColor='#e8ddff';ctx.strokeStyle='rgba(229,215,255,.78)';ctx.lineWidth=1.5;
    ctx.beginPath();for(let i=0;i<verts;i++){const a=i/verts*TAU,x=Math.cos(a)*r,y=Math.sin(a)*r*.58;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();
    const lit=Math.floor(heat*verts+.001);for(let i=0;i<verts;i++){const a=i/verts*TAU,x=Math.cos(a)*r,y=Math.sin(a)*r*.58;ctx.fillStyle=i<lit?'#ffffff':'rgba(196,174,255,.32)';ctx.beginPath();ctx.arc(x,y,i<lit?3.8:2.4,0,TAU);ctx.fill();}ctx.restore();
  }
  function drawIonCircuit(){
    if(!awake('ion')||!ionNodes.length)return;
    const live=ionNodes.map(node=>({node,p:worldToScreen(node.x,node.y)}));ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle='rgba(114,242,255,.52)';ctx.shadowBlur=12;ctx.shadowColor='#72f2ff';
    if(live.length>1){ctx.beginPath();live.forEach((row,i)=>i?ctx.lineTo(row.p.x,row.p.y):ctx.moveTo(row.p.x,row.p.y));ctx.stroke();}
    for(const row of live){const q=clamp(row.node.life/row.node.max,0,1);ctx.globalAlpha=.35+.6*q;ctx.fillStyle='#eaffff';ctx.beginPath();ctx.arc(row.p.x,row.p.y,4.2,0,TAU);ctx.fill();ctx.strokeStyle='#72f2ff';ctx.beginPath();ctx.arc(row.p.x,row.p.y,9,0,TAU);ctx.stroke();}ctx.restore();
  }
  function drawNovaCorona(){
    if(!awake('nova'))return;const x=vw/2,y=vh/2,t=performance.now()*.001,charge=Math.max(0,Math.min(2,player.awNovaCharge||0));ctx.save();ctx.translate(x,y);
    for(let i=0;i<3;i++){ctx.save();ctx.rotate((i%2?1:-1)*t*(.34+i*.10));ctx.globalAlpha=i<charge?.72:.18;ctx.strokeStyle=i<charge?'#fff0b5':'#ffbd69';ctx.lineWidth=i<charge?3:1.2;ctx.shadowBlur=i<charge?18:5;ctx.shadowColor='#ffbd69';ctx.setLineDash([10+i*4,7]);ctx.beginPath();ctx.arc(0,0,48+i*13,0,TAU);ctx.stroke();ctx.restore();}ctx.setLineDash([]);ctx.restore();
  }
  function drawSecondFx(){
    for(const e of fx){
      const q=clamp(e.life/Math.max(.001,e.max),0,1),age=1-q;ctx.save();ctx.globalAlpha=Math.min(1,q*1.8);
      if(e.kind==='prism-crown-charge'){const target=enemyById(e.targetId),p=worldToScreen(target?.x??e.x,target?.y??e.y);ctx.translate(p.x,p.y);ctx.rotate(age*.8);ctx.strokeStyle='#f0e8ff';ctx.lineWidth=2.2;ctx.shadowBlur=24;ctx.shadowColor='#d6c2ff';for(let ring=0;ring<2;ring++){ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU,r=e.r*(.75+ring*.22)*(1-age*.18),x=Math.cos(a)*r,y=Math.sin(a)*r*.55;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}}
      else if(e.kind==='prism-column'){const p=worldToScreen(e.x,e.y);ctx.strokeStyle='#ffffff';ctx.shadowBlur=34;ctx.shadowColor='#fff8df';ctx.lineWidth=Math.max(5,e.width*(.45+.55*q));ctx.beginPath();ctx.moveTo(p.x,p.y-e.half);ctx.lineTo(p.x,p.y+e.half);ctx.stroke();}
      else if(e.kind==='prism-shatter'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);ctx.strokeStyle='#e8ddff';ctx.lineWidth=2;for(let i=0;i<8;i++){const a=i/8*TAU+.2,r=e.r*(.30+.85*age);ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.35,Math.sin(a)*r*.35);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
      else if(e.kind==='chrono-sever'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);ctx.strokeStyle='#efffff';ctx.lineWidth=4*q+1;ctx.beginPath();ctx.arc(0,0,e.r*(.42+.58*age),0,TAU);ctx.stroke();ctx.strokeStyle='rgba(143,255,224,.8)';ctx.lineWidth=1.5;for(let i=0;i<12;i++){const a=i/12*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*e.r*.55,Math.sin(a)*e.r*.55);ctx.lineTo(Math.cos(a)*e.r,Math.sin(a)*e.r);ctx.stroke();}}
      else if(e.kind==='ion-circuit-freeze'){ctx.strokeStyle='#dffcff';ctx.lineWidth=3;ctx.shadowBlur=20;ctx.shadowColor='#72f2ff';ctx.beginPath();e.points.forEach((node,i)=>{const p=worldToScreen(node.x,node.y);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();}
      else if(e.kind==='ion-thunder'){const p=worldToScreen(e.x,e.y);ctx.strokeStyle='#ffffff';ctx.lineWidth=8*q+2;ctx.shadowBlur=30;ctx.shadowColor='#72f2ff';ctx.beginPath();ctx.moveTo(p.x,p.y-600);ctx.lineTo(p.x,p.y);ctx.stroke();}
      else if(e.kind==='nova-ring-light'||e.kind==='hypernova-charge'||e.kind==='hypernova-release'){const p=worldToScreen(e.x,e.y);ctx.translate(p.x,p.y);ctx.strokeStyle=e.kind==='hypernova-release'?'#ffbd69':'#fff0b5';ctx.shadowBlur=24;ctx.shadowColor='#ffbd69';ctx.lineWidth=e.kind==='nova-ring-light'?2.5:4;const base=e.r||54+(e.index||0)*14,r=base*(e.kind==='hypernova-charge'?(1.12-age*.34):.45+.55*age);ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();if(e.kind==='hypernova-charge'){ctx.fillStyle='#ffffff';ctx.globalAlpha=q*.92;ctx.beginPath();ctx.arc(0,0,7*(1-age*.65),0,TAU);ctx.fill();}}
      else if(e.kind==='drone-mark'){const target=enemyById(e.targetId),p=worldToScreen(target?.x??e.x,target?.y??e.y),r=30+age*8;ctx.translate(p.x,p.y);ctx.rotate(age*.8);ctx.strokeStyle='#d8fff1';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<4;i++){const a=i/4*TAU;ctx.moveTo(Math.cos(a)*r*.55,Math.sin(a)*r*.55);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.stroke();}
      else if(e.kind==='drone-meteor'){const p=worldToScreen(e.x,e.y);ctx.strokeStyle='#eafff8';ctx.lineWidth=5;ctx.shadowBlur=24;ctx.shadowColor='#8fffd0';ctx.beginPath();ctx.moveTo(p.x-70,p.y-140);ctx.lineTo(p.x,p.y);ctx.stroke();}
      else if(e.kind==='fleet-form'){const dir={x:Math.cos(e.a),y:Math.sin(e.a)},normal={x:-dir.y,y:dir.x};for(let i=0;i<e.count;i++){const row=Math.abs(i-(e.count-1)/2),offset=(i-(e.count-1)/2)*26,d=-70-row*15,point={x:e.x+dir.x*d+normal.x*offset,y:e.y+dir.y*d+normal.y*offset};drawFleetDrone(point,e.a,1.0,age);}}
      else if(e.kind==='fleet-run'){const p=worldToScreen(e.x,e.y),dx=Math.cos(e.a),dy=Math.sin(e.a),nx=-dy,ny=dx;ctx.strokeStyle='#baffea';ctx.shadowBlur=18;ctx.shadowColor='#8fffd0';for(let i=0;i<e.count;i++){const off=(i-(e.count-1)/2)*22;ctx.globalAlpha=.18+.55*q;ctx.lineWidth=2+i%2;ctx.beginPath();ctx.moveTo(p.x+nx*off,p.y+ny*off);ctx.lineTo(p.x+dx*e.length+nx*off,p.y+dy*e.length+ny*off);ctx.stroke();}}
      else if(e.kind==='rail-assemble'){const p=worldToScreen(e.x,e.y),dx=Math.cos(e.a),dy=Math.sin(e.a),nx=-dy,ny=dx,spread=24*(.65+.35*age),len=92;ctx.strokeStyle='#e5f8ff';ctx.shadowBlur=24;ctx.shadowColor='#b7e7ff';ctx.lineWidth=4;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(p.x-dx*42+nx*spread*side,p.y-dy*42+ny*spread*side);ctx.lineTo(p.x+dx*len+nx*spread*side,p.y+dy*len+ny*spread*side);ctx.stroke();}ctx.strokeStyle='rgba(255,255,255,.52)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+dx*e.length,p.y+dy*e.length);ctx.stroke();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(p.x+dx*18,p.y+dy*18,6,0,TAU);ctx.fill();}
      else if(e.kind==='rail-fire'){const p=worldToScreen(e.x,e.y),dx=Math.cos(e.a),dy=Math.sin(e.a);ctx.strokeStyle='#ffffff';ctx.shadowBlur=36;ctx.shadowColor='#b7e7ff';ctx.lineWidth=Math.max(5,e.width*q);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+dx*e.length,p.y+dy*e.length);ctx.stroke();}
      ctx.restore();
    }
  }

  const baseDrawAlliedEffects=drawAlliedEffects;
  drawAlliedEffects=function awakeningSecondSetEffects(){baseDrawAlliedEffects();drawPrismTargetCrown();drawIonCircuit();drawNovaCorona();drawSecondFx();};

  const baseUpdateEffects=updateEffects;
  updateEffects=function awakeningSecondFxUpdate(dt){baseUpdateEffects(dt);for(const e of fx)e.life-=dt;compactInPlace(fx,e=>e&&e.life>0);};

  const baseReset=resetGame;
  resetGame=function awakeningSecondSetReset(){resetSecondAwakeningState();const result=baseReset();resetSecondAwakeningState();return result;};
  const baseMenu=showMainMenu;
  showMainMenu=function awakeningSecondSetMenu(){resetSecondAwakeningState();return baseMenu();};

  window.stackfallAwakeningSecondSetDebug=()=>({
    prismTarget:player.awPrismTargetId||null,chronoPhase:player.awChronoPhase||0,ionNodes:ionNodes.length,
    ionPending:!!player.awIonDischargePending,novaCharge:player.awNovaCharge||0,droneCycle:player.awDroneFleetCycle||0,railCycle:player.awRailCycle||0,fx:fx.length
  });
})();