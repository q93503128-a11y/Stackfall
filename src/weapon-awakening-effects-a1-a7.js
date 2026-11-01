(()=>{
  'use strict';

  const awake=key=>window.stackfallIsWeaponAwakened?.(key)===true;
  const mult=()=>Math.min(2,Math.max(0,Number(window.stackfallMultiplicityStacks?.())||0));
  const fx=state.entities.awakeningFx=Array.isArray(state.entities.awakeningFx)?state.entities.awakeningFx:[];
  const pushFx=data=>{fx.push({id:state.nextId++,...data});if(fx.length>72)fx.splice(0,fx.length-72);return fx[fx.length-1];};

  function resetAwakeningCombatState(){
    fx.length=0;
    for(const p of state.entities.projectiles||[])if(p?.awakeningChild)p.life=0;
    for(const w of state.entities.wells||[])if(w){delete w.awBinaryGroup;delete w.awBinarySide;delete w.awBinaryEcho;delete w.awBinaryMerged;}
    for(const p of state.entities.curves||[])if(p?.awLunar){p.awLunar=false;p.awMoonRippleDone=false;delete p.awMoonPhase;delete p.awMoonWaning;delete p.awOrbitX;delete p.awOrbitY;delete p.awOrbitR;delete p.awOrbitAngle;delete p.awOrbitDuration;if(p.stage==='lunarOrbit'){p.stage='return';p.stageTime=0;p.returnLife=0;}}
    Object.assign(player,{
      awEmberHits:0,awEmberTargetId:null,awEmberChargeFlash:0,awEmberMeteorVolley:0,
      awBulwarkHitAngle:0,awBulwarkHitFlash:0,awBulwarkStrong:0,awBulwarkVolleyCd:1.1,awCometCycle:0
    });
  }
  window.stackfallResetAwakeningFirstSetCombat=resetAwakeningCombatState;
  resetAwakeningCombatState();

  // A1 — Stellar Core: every Core Pulse is replaced by one central stellar lance plus three satellite lances.
  registerCoreShotInterceptor('weapon-awakening-effects-a1-a7.js:stellarCoreShot',function stellarCoreShot(next,target,echoed=false){
    if(!awake('core'))return next(target,echoed);
    if(!target||target.dead)return;
    const n=Math.max(1,weaponCount('core')),range=weaponRange('core'),size=weaponSizeMultiplier(),power=echoed?.72:1,
      baseDamage=corePulseDamage(n),phase=(state.time||0)*1.4,targetId=target.id,
      centralA=Math.atan2(target.y-player.y,target.x-player.x),centralSpeed=690*(1+stat('projectileSpeed')*.10);
    spawnPlayerProjectile({
      x:player.x,y:player.y,vx:Math.cos(centralA)*centralSpeed,vy:Math.sin(centralA)*centralSpeed,r:9.2*size,life:1.34,maxRange:range*1.10,
      damage:baseDamage*.72*power,color:echoed?'#ffb4d0':'#efffff',pierce:2+(n>=4?1:0),source:echoed?'core-echo':'core',
      playerVisual:echoed?'echo-stellar-core-lance':'stellar-core-lance',homingTargetId:targetId,homingReacquire:false,homingTurn:1.75,awakeningChild:true
    });
    for(let i=0;i<3;i++){
      const oa=phase+i*TAU/3,ox=player.x+Math.cos(oa)*39,oy=player.y+Math.sin(oa)*39,a=Math.atan2(target.y-oy,target.x-ox),speed=(565+i*18)*(1+stat('projectileSpeed')*.10);
      spawnPlayerProjectile({
        x:ox,y:oy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:5.8*size,life:1.42,maxRange:range*1.08,
        damage:baseDamage*.25*power,color:echoed?'#ff9fc5':'#bffaff',pierce:n>=5?1:0,source:echoed?'core-echo':'core',
        playerVisual:echoed?'echo-stellar-core-node':'stellar-core-node',homingTargetId:targetId,homingReacquire:false,homingTurn:2.9,awakeningChild:true
      });
    }
    pushFx({kind:'stellar-volley',x:player.x,y:player.y,life:.30,max:.30});
  });

  // A2 — Eclipse Blades: no periodic alignment attack. Five real blades orbit continuously with a breathing speed cycle.
  function bladeOrbitSpeedMultiplier(){
    if(!awake('blade'))return 1;
    const phase=((state.time||0)*1.08)-Math.PI/2,wave=(Math.sin(phase)+1)*.5;
    return 1+wave;
  }
  window.stackfallAwakenedBladeOrbitSpeedMultiplier=bladeOrbitSpeedMultiplier;

  registerWeaponUpdateInterceptor('awakening-first-set',function awakenedFirstSetWeapons(next,dt){
    next(dt);
    player.awEmberChargeFlash=Math.max(0,(player.awEmberChargeFlash||0)-dt);
    player.awBulwarkHitFlash=Math.max(0,(player.awBulwarkHitFlash||0)-dt);
    player.awBulwarkStrong=Math.max(0,(player.awBulwarkStrong||0)-dt);
    if(awake('bulwark')){player.awBulwarkVolleyCd=(Number(player.awBulwarkVolleyCd)||0)-dt;if(player.awBulwarkVolleyCd<=0){player.awBulwarkVolleyCd=Math.max(1.55,2.75*hasteMult());fireBastionVolley();}}else player.awBulwarkVolleyCd=1.1;
  });

  const baseFireEmber=fireEmber;
  fireEmber=function awakenedRedMeteorCaster(target,n,echoed=false){
    if(!awake('ember')||echoed)return baseFireEmber(target,n,echoed);
    if(!target||target.dead)return;
    player.awEmberMeteorVolley=(player.awEmberMeteorVolley||0)+1;
    const base=Math.atan2(target.y-player.y,target.x-player.x),shots=n>=5?4:n>=2?3:2,range=weaponRange('ember'),speed=(610+n*11)*(1+stat('projectileSpeed')*.10),meteor=player.awEmberMeteorVolley%4===0;
    for(let i=0;i<shots;i++){
      const spread=(i-(shots-1)/2)*(shots>=4?.13:.16),a=base+spread,side=(i-(shots-1)/2),lateral=side*13,ox=player.x-Math.sin(base)*lateral,oy=player.y+Math.cos(base)*lateral,core=meteor&&Math.abs(side)<.51;
      spawnPlayerProjectile({x:ox,y:oy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:core?11.5:7.2,life:1.48,maxRange:range*1.04,damage:(12+n*3.4)*(core?1.55:.86),color:core?'#fff0f2':'#ff3b5d',pierce:core?5:2+(n>=5?1:0),source:'ember',playerVisual:'ember-awakened',homingTargetId:target.id,homingReacquire:false,homingTurn:core?1.85:1.35,awakeningChild:true});
    }
    if(meteor){pushFx({kind:'red-meteor-volley',x:player.x,y:player.y,a:base,life:.30,max:.30});player.awEmberChargeFlash=Math.max(player.awEmberChargeFlash||0,.24);}
  };

  // A3 — Nebula Starcaster: repeated starlight hits charge two side crystals and release a thick piercing starline.
  let emberSignatureGuard=false;
  function fireNebulaStarline(target){
    if(!target||target.dead)return;
    const n=Math.max(1,weaponCount('ember')),size=weaponSizeMultiplier(),a=Math.atan2(target.y-player.y,target.x-player.x),range=weaponRange('ember'),x2=player.x+Math.cos(a)*range,y2=player.y+Math.sin(a)*range,width=14*size;
    emberSignatureGuard=true;
    try{applyRailBeam(player.x,player.y,x2,y2,width,28+n*4.2,'#fff7ef','ember',1);}finally{emberSignatureGuard=false;}
    state.entities.beams.push({x1:player.x-Math.sin(a)*27,y1:player.y+Math.cos(a)*27,x2:target.x,y2:target.y,life:.18,max:.18,color:'#ffb8d2',width:2.2*size});
    state.entities.beams.push({x1:player.x+Math.sin(a)*27,y1:player.y-Math.cos(a)*27,x2:target.x,y2:target.y,life:.18,max:.18,color:'#bfefff',width:2.2*size});
    player.awEmberChargeFlash=.36;
    pushFx({kind:'starline-flash',x:target.x,y:target.y,life:.30,max:.30});
    audio.weapon?.('ember',false,1.5);
  }
  const baseDealDamage=dealDamage;
  dealDamage=function awakeningFirstSetDamage(enemy,amount,opts={}){
    const wasAlive=enemy&&!enemy.dead,source=String(opts.source||'');
    baseDealDamage(enemy,amount,opts);
    if(!emberSignatureGuard&&awake('ember')&&wasAlive&&source==='ember'){
      const targetId=enemy?.id??null;
      if(targetId!==player.awEmberTargetId){player.awEmberTargetId=targetId;player.awEmberHits=0;}
      player.awEmberHits=(player.awEmberHits||0)+1;
      if(player.awEmberHits>=12){
        player.awEmberHits=0;
        const target=enemy&&!enemy.dead?enemy:nearestWeaponTarget('ember');
        if(target)fireNebulaStarline(target);
      }
    }
  };

  // A4 — Celestial Bastion: hit-facing armor deployment plus a real break counterwave.
  function fireBastionVolley(){
    const n=Math.max(1,weaponCount('bulwark')),targets=nearestEnemies(player.x,player.y,4,null,620),size=weaponSizeMultiplier();if(!targets.length)return;
    const count=Math.min(4,Math.max(2,targets.length));
    for(let i=0;i<count;i++){
      const target=targets[i%targets.length],a=Math.atan2(target.y-player.y,target.x-player.x),ox=player.x+Math.cos(a)*54,oy=player.y+Math.sin(a)*54,speed=510+n*15;
      spawnPlayerProjectile({x:ox,y:oy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:7.2*size,life:1.35,maxRange:660,damage:17+n*3.2,color:'#cafff2',pierce:3,source:'barrier-lance',playerVisual:'bulwark-awakened',awakeningChild:true});
    }
    pushFx({kind:'bastion-volley',x:player.x,y:player.y,count,life:.34,max:.34});
    audio.weapon?.('bulwark',false,1.18);
  }
  registerPlayerDamageInterceptor('awakening-bastion',function celestialBastionHurt(next,amount,source='contact'){
    const beforeShield=Math.max(0,Number(player.shield)||0),beforeHp=Math.max(0,Number(player.hp)||0);
    next(amount,source);
    if(!awake('bulwark')||state.mode==='gameover'||(player.shield>=beforeShield&&player.hp>=beforeHp))return;
    const threat=nearestEnemy(player.x,player.y,360),angle=threat?Math.atan2(threat.y-player.y,threat.x-player.x):(Number.isFinite(player.facingAngle)?player.facingAngle:0);
    player.awBulwarkHitAngle=angle;player.awBulwarkHitFlash=.32;
    if(Number(amount)>=Math.max(12,player.maxHp*.11))player.awBulwarkStrong=.34;
    if(beforeShield>0&&player.shield<=0){
      const n=Math.max(1,weaponCount('bulwark')),radius=178*weaponSizeMultiplier();
      areaDamage(player.x,player.y,radius,24+n*3.6,'#dfffee','barrier-lance',{shake:false});
      shockwave(player.x,player.y,'#efffff',radius,.55,6);
      for(let i=0;i<8;i++){const a=i*TAU/8;spawnParticle(player.x+Math.cos(a)*42,player.y+Math.sin(a)*42,'#baffdf',2,155,4.2);}
      pushFx({kind:'bastion-break',x:player.x,y:player.y,r:radius,life:.58,max:.58});
    }
  });

  // A5 — Binary Collapse: native twin wells and augment collapses remain. The native pair gains one bounded final merger.
  let gravityGroupId=0;
  const baseCreateGravityWells=createGravityWells;
  createGravityWells=function binaryCollapseWells(n,echoed=false){
    const before=state.entities.wells.length;
    baseCreateGravityWells(n,echoed);
    if(!awake('gravity')||n<6)return;
    const created=state.entities.wells.slice(before).filter(w=>w&&!w.multiplicity);
    if(created.length<2)return;
    const group=++gravityGroupId,pair=created.slice(0,2),mergeX=(pair[0].x+pair[1].x)/2,mergeY=(pair[0].y+pair[1].y)/2,orbitR=Math.max(48,Math.hypot(pair[0].x-pair[1].x,pair[0].y-pair[1].y)*.5),orbitA=Math.atan2(pair[0].y-mergeY,pair[0].x-mergeX);
    pair.forEach((w,index)=>{w.awBinaryGroup=group;w.awBinarySide=index;w.awBinaryEcho=!!echoed;w.awBinaryStartX=w.x;w.awBinaryStartY=w.y;w.awBinaryMergeX=mergeX;w.awBinaryMergeY=mergeY;w.awBinaryOrbitR=orbitR;w.awBinaryOrbitA=orbitA;});
  };
  function triggerBinaryMerge(pair){
    const a=pair[0],b=pair[1],cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,echoed=!!(a.awBinaryEcho||b.awBinaryEcho),n=Math.max(1,weaponCount('gravity')),size=weaponSizeMultiplier(),power=echoed?.55:1;
    pair.forEach(w=>w.awBinaryMerged=true);
    pushFx({kind:'binary-merge',x:cx,y:cy,ax:a.x,ay:a.y,bx:b.x,by:b.y,echoed,life:.42,max:.42});
    scheduleWeaponAction(210,()=>{
      areaDamage(cx,cy,215*size,(40+n*6.2)*power,echoed?'#ff8bb1':'#f1e8ff','gravity-collapse',{shake:false});
      shockwave(cx,cy,echoed?'#ff8bb1':'#ffffff',260*size,.58,7);
      pushFx({kind:'binary-core',x:cx,y:cy,echoed,life:.48,max:.48});
    });
  }
  const baseUpdateWells=updateWells;
  updateWells=function binaryCollapseUpdate(dt){
    if(awake('gravity')){
      const groups=new Map();
      for(const w of state.entities.wells){if(!w?.awBinaryGroup||w.awBinaryMerged)continue;const list=groups.get(w.awBinaryGroup)||[];list.push(w);groups.set(w.awBinaryGroup,list);}
      for(const group of groups.values()){
        if(group.length<2)continue;const pair=group.slice(0,2),life=Math.min(pair[0].life,pair[1].life);
        if(life>.92){
          const cx=Number(pair[0].awBinaryMergeX)||((pair[0].x+pair[1].x)/2),cy=Number(pair[0].awBinaryMergeY)||((pair[0].y+pair[1].y)/2),rr=Number(pair[0].awBinaryOrbitR)||90,base=(Number(pair[0].awBinaryOrbitA)||0)+(state.time||0)*1.35;
          pair.forEach((w,index)=>{const a=base+(index?Math.PI:0),pulse=.92+.08*Math.sin((state.time||0)*3.1+index);w.x=cx+Math.cos(a)*rr*pulse;w.y=cy+Math.sin(a)*rr*pulse;});
        }else{
          const raw=clamp((.92-life)/.74,0,1),ease=raw*raw*(3-2*raw),pull=.90*ease;
          for(const w of pair){w.x=lerp(w.x,Number(w.awBinaryMergeX)||w.x,.18+pull*.26);w.y=lerp(w.y,Number(w.awBinaryMergeY)||w.y,.18+pull*.26);}
        }
        if(pair.every(w=>w.life<=.18)||Math.hypot(pair[0].x-pair[1].x,pair[0].y-pair[1].y)<=24)triggerBinaryMerge(pair);
      }
    }
    baseUpdateWells(dt);
  };

  // A6 — Final Comet Lance: normal lance casts continue; every fourth original cast adds a visible charge -> sudden ultra-fast lance.
  const baseFireComet=fireComet;
  fireComet=function finalCometLance(target,n,echoed=false){
    baseFireComet(target,n,echoed);
    if(!awake('comet')||echoed||!target)return;
    player.awCometCycle=(player.awCometCycle||0)+1;
    if(player.awCometCycle%4!==0)return;
    const targetId=target.id,a=Math.atan2(target.y-player.y,target.x-player.x),sx=player.x+Math.cos(a)*76,sy=player.y+Math.sin(a)*76;
    pushFx({kind:'comet-charge',x:sx,y:sy,a,targetId,length:184,width:34,life:.34,max:.34});
    scheduleWeaponAction(340,()=>{
      const live=enemyById(targetId)||nearestWeaponTarget('comet');if(!live)return;
      const angle=Math.atan2(live.y-player.y,live.x-player.x),startX=player.x+Math.cos(angle)*74,startY=player.y+Math.sin(angle)*74,range=weaponRange('comet')*1.22,speed=1540,nx=Math.cos(angle),ny=Math.sin(angle);
      spawnPlayerProjectile({x:startX,y:startY,vx:nx*speed,vy:ny*speed,r:24,life:1.05,maxRange:range,damage:48+n*8.2,color:'#dffbff',pierce:999,source:'comet',explode:true,awakeningChild:true});
      pushFx({kind:'comet-fracture',x:startX,y:startY,x2:startX+nx*range,y2:startY+ny*range,life:.34,max:.34});
      shockwave(startX,startY,'#ffffff',118,.28,5);state.camera.shake=Math.max(state.camera.shake,5);audio.weapon?.('comet',false,1.72);
    });
  };

  // A7 — Lunar Return: every boomerang uses an added large orbit stage before returning.
  const baseUpdateBoomerangs=updateBoomerangs;
  function markLunarCurves(){if(!awake('arc'))return;for(const p of state.entities.curves)if(p&&!p.dead&&!p.awLunar){p.awLunar=true;p.awMoonPhase=.14;p.awMoonRippleDone=false;}}
  function lunarHit(p,source,multiplier=1){
    forEachNearbyEnemyCandidate(p.x,p.y,p.r+92,e=>{
      if(e.dead||p.hitIds.has(e.id))return;
      if(enemySegmentOverlap(e,p.lastX,p.lastY,p.x,p.y,p.r)){
        p.hitIds.add(e.id);dealDamage(e,p.damage*multiplier,{color:p.color,source});
        if(state.weaponAugments?.arc&&source==='arc')p.damage*=1.035;
        if(source==='arc-return'&&!p.awMoonRippleDone){
          p.awMoonRippleDone=true;const rr=82*weaponSizeMultiplier();
          areaDamage(e.x,e.y,rr,p.damage*.55,'#f4f7ff','arc-trail',{shake:false});
          shockwave(e.x,e.y,'#f7fbff',rr,.34,3.4);
          pushFx({kind:'moon-ripple',x:e.x,y:e.y,r:rr,life:.38,max:.38});
        }
      }
    });
  }
  function updateLunarCurve(p,dt,stressed){
    if(!p||p.dead)return;
    if(!Number.isFinite(p.stageTime))p.stageTime=0;if(!Number.isFinite(p.returnLife))p.returnLife=0;if(!Number.isFinite(p.trailCd))p.trailCd=0;
    p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;
    const pushHistory=()=>{const h=p.history,capacity=h?.length||0;if(!capacity)return;const limit=Math.min(capacity,stressed?6:12);let index;if((p.historyCount||0)<limit){index=((p.historyStart||0)+(p.historyCount||0))%capacity;p.historyCount=(p.historyCount||0)+1;}else{index=p.historyStart||0;p.historyStart=(index+1)%capacity;}h[index].x=p.x;h[index].y=p.y;};
    if(p.stage==='outbound'){
      const live=enemyById(p.targetId);
      if(live&&Math.hypot(live.x-player.x,live.y-player.y)<=weaponRange('arc')*1.2){
        const base=Math.atan2(live.y-p.start.y,live.x-p.start.x),normalX=-Math.sin(base),normalY=Math.cos(base),desiredX=live.x+normalX*(p.lateral||0),desiredY=live.y+normalY*(p.lateral||0);
        p.targetPoint.x=lerp(p.targetPoint.x,desiredX,.22);p.targetPoint.y=lerp(p.targetPoint.y,desiredY,.22);
        const midX=(p.start.x+p.targetPoint.x)/2,midY=(p.start.y+p.targetPoint.y)/2,distance=Math.hypot(p.targetPoint.x-p.start.x,p.targetPoint.y-p.start.y),curve=(54+Math.min(94,distance*.12)+(p.stacks>=3?28:0))*(p.side||1);
        p.control.x=lerp(p.control.x,midX+normalX*curve,.18);p.control.y=lerp(p.control.y,midY+normalY*curve,.18);
      }
      const raw=clamp(p.stageTime/Math.max(.001,p.stageDuration),0,1),t=raw*raw*(3-2*raw),u=1-t;
      p.x=u*u*p.start.x+2*u*t*p.control.x+t*t*p.targetPoint.x;p.y=u*u*p.start.y+2*u*t*p.control.y+t*t*p.targetPoint.y;p.awMoonPhase=.14+.72*t;
      lunarHit(p,p.ricochet?'arc-ricochet':'arc',1);
      if(t>=1||Math.hypot(p.x-player.x,p.y-player.y)>weaponRange('arc')*1.2){
        const liveTarget=enemyById(p.targetId);if(liveTarget&&!p.hitIds.has(liveTarget.id)){p.hitIds.add(liveTarget.id);dealDamage(liveTarget,p.damage,{color:p.color,source:p.ricochet?'arc-ricochet':'arc'});}
        p.stage='lunarOrbit';p.stageTime=0;p.awOrbitX=liveTarget?.x??p.targetPoint.x;p.awOrbitY=liveTarget?.y??p.targetPoint.y;p.awOrbitR=72+p.stacks*6;p.awOrbitAngle=Math.atan2(p.y-p.awOrbitY,p.x-p.awOrbitX);p.awOrbitDuration=.56;
        if(p.stacks>=4)p.hitIds.clear();
      }
    }else if(p.stage==='lunarOrbit'){
      const duration=Math.max(.001,p.awOrbitDuration||.56),progress=clamp(p.stageTime/duration,0,1),turn=(p.side||1)*TAU*1.18,liveTarget=enemyById(p.targetId);
      if(liveTarget){p.awOrbitX=lerp(p.awOrbitX,liveTarget.x,.34);p.awOrbitY=lerp(p.awOrbitY,liveTarget.y,.34);}
      p.awOrbitAngle+=turn*dt/duration;const envelope=Math.abs(Math.cos(progress*Math.PI)),rr=(p.awOrbitR||96)*envelope;
      p.x=p.awOrbitX+Math.cos(p.awOrbitAngle)*rr;p.y=p.awOrbitY+Math.sin(p.awOrbitAngle)*rr;p.awMoonPhase=.82+.18*Math.sin(progress*Math.PI);p.awMoonWaning=false;
      lunarHit(p,p.ricochet?'arc-ricochet':'arc',.88);
      if(progress>=1){p.stage='return';p.stageTime=0;p.returnLife=0;p.hitIds.clear();p.historyStart=0;p.historyCount=0;p.awMoonPhase=1;p.awMoonWaning=true;}
    }else{
      p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d2=dx*dx+dy*dy,d=Math.sqrt(d2)||1,speed=840+p.stacks*42+(p.stacks>=4?105:0);
      p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);p.awMoonPhase=1-.86*clamp(p.returnLife/1.15,0,1);p.awMoonWaning=true;
      lunarHit(p,p.ricochet?'arc-ricochet-return':'arc-return',p.returnDamageMult||1);
      if(d2<(player.r+13)**2||p.returnLife>1.45)p.dead=true;
    }
    pushHistory();p.trailCd-=dt;
    if(p.trailDamage&&p.trailCd<=0){p.trailCd=.20;const rr=21+p.stacks*2;forEachNearbyEnemyCandidate(p.x,p.y,rr+72,e=>{if(!e.dead&&enemyCircleOverlap(e,p.x,p.y,rr))dealDamage(e,2.8+p.stacks,{color:p.color,source:'arc-trail',canCrit:false});});}
  }
  const LUNAR_UPDATE_BUFFER=[],NORMAL_CURVE_UPDATE_BUFFER=[],LUNAR_RENDER_BUFFER=[],NORMAL_CURVE_RENDER_BUFFER=[];
  updateBoomerangs=function lunarReturnUpdate(dt){
    markLunarCurves();
    const curves=state.entities.curves;
    if(!awake('arc')||!curves.some(p=>p?.awLunar))return baseUpdateBoomerangs(dt);
    const lunar=LUNAR_UPDATE_BUFFER,normal=NORMAL_CURVE_UPDATE_BUFFER,original=state.entities.curves;lunar.length=0;normal.length=0;
    for(const p of curves){if(!p||p.dead)continue;(p.awLunar?lunar:normal).push(p);}
    state.entities.curves=normal;
    try{baseUpdateBoomerangs(dt);}finally{
      const updatedNormal=state.entities.curves;state.entities.curves=original;original.length=0;
      for(const p of updatedNormal)original.push(p);for(const p of lunar)original.push(p);
    }
    const stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
    for(const p of lunar)updateLunarCurve(p,dt,stressed);
    compactInPlace(original,p=>p&&!p.dead);trimOldest(original,32);
  };

  // Shared first-set visuals.
  function keepFirstFx(e){return!!(e&&e.life>0);}
  const baseUpdateEffects=updateEffects;
  updateEffects=function awakeningFxUpdate(dt){
    baseUpdateEffects(dt);
    for(const effect of fx)effect.life-=dt;
    compactInPlace(fx,keepFirstFx);
  };

  const AW1_RASTER_CACHE=new Map();
  function aw1Raster(key,size,painter){return cachedRasterSurface(AW1_RASTER_CACHE,key,size,painter,64);}
  function stellarCoreOverlayRaster(){return aw1Raster('stellar-core-overlay',128,(g,sz)=>{const c=sz/2;g.save();g.translate(c,c);g.shadowBlur=20;g.shadowColor='#bff8ff';for(const[index,r]of[31,40].entries()){g.save();g.rotate(index?.62:-.42);g.strokeStyle=index?'rgba(202,190,255,.74)':'rgba(182,250,255,.82)';g.lineWidth=index?1.5:2.1;g.beginPath();g.ellipse(0,0,r,r*.36,0,0,TAU);g.stroke();g.restore();}g.fillStyle='rgba(242,253,255,.92)';g.beginPath();g.arc(0,0,8.5,0,TAU);g.fill();g.fillStyle='#213b81';g.beginPath();g.arc(0,0,4.1,0,TAU);g.fill();g.restore();});}
  function stellarNodeRaster(){return aw1Raster('stellar-node',48,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.fillStyle='#e9fdff';g.strokeStyle='#6feaff';g.lineWidth=1.2;g.shadowBlur=15;g.shadowColor='#7ce8ff';g.beginPath();g.moveTo(7,0);g.lineTo(0,-5);g.lineTo(-6,0);g.lineTo(0,5);g.closePath();g.fill();g.stroke();g.restore();});}
  function crescentBladeRaster(){return aw1Raster('crescent-blade',112,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=22;g.shadowColor='#9bdcff';g.fillStyle='#07101c';g.strokeStyle='#c9f4ff';g.lineWidth=2.2;g.beginPath();g.moveTo(-9,-35);g.quadraticCurveTo(31,-7,2,37);g.quadraticCurveTo(12,7,-9,-35);g.closePath();g.fill();g.stroke();g.strokeStyle='rgba(255,255,255,.88)';g.lineWidth=1;g.beginPath();g.moveTo(-7,-31);g.quadraticCurveTo(25,-5,4,30);g.stroke();g.restore();});}
  function emberCasterRaster(side,charge,flash){const cb=Math.round(clamp(charge,0,1)*4),fb=Math.round(clamp(flash,0,1)*3),color=side<0?'#ff9ec0':'#9eefff';return aw1Raster(`ember-caster:${side}:${cb}:${fb}`,80,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=12+(cb/4)*18+(fb/3)*16;g.shadowColor=color;g.fillStyle='#f7ffff';g.strokeStyle=color;g.lineWidth=1.5;g.beginPath();g.moveTo(13,0);g.lineTo(0,-6);g.lineTo(-10,0);g.lineTo(0,6);g.closePath();g.fill();g.stroke();g.globalAlpha=.28+.55*(cb/4);g.beginPath();g.arc(0,0,11+(cb/4)*4,0,TAU);g.stroke();g.restore();});}
  const baseDrawPlayerCrystalCore=drawPlayerCrystalCore;
  drawPlayerCrystalCore=function stellarCoreVisual(x,y,t,growth){
    baseDrawPlayerCrystalCore(x,y,t,growth);if(!awake('core'))return;const phase=t*.0014,pulse=1+Math.sin(t*.008)*.05,overlay=stellarCoreOverlayRaster(),node=stellarNodeRaster();ctx.save();ctx.translate(x,y);ctx.rotate(phase*.18);ctx.scale(pulse,pulse);ctx.drawImage(overlay,-64,-64,128,128);ctx.restore();for(let i=0;i<3;i++){const a=phase*2.1+i*TAU/3,rr=39,sx=x+Math.cos(a)*rr,sy=y+Math.sin(a)*rr;ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.drawImage(node,-24,-24,48,48);ctx.restore();}
  };

  const baseDrawEquippedOrbits=drawEquippedOrbits;
  function drawCrescentBlade(cx,cy,a,scale=1,alpha=1){const image=crescentBladeRaster();ctx.save();ctx.translate(cx,cy);ctx.rotate(a+Math.PI/2);ctx.scale(scale,scale);ctx.globalAlpha=alpha;ctx.drawImage(image,-56,-56,112,112);ctx.restore();}
  drawEquippedOrbits=function eclipseBladeVisuals(x,y,t){
    if(!awake('blade'))return baseDrawEquippedOrbits(x,y,t);
    baseDrawEquippedOrbits(x,y,t);
    const orbit=orbitRadiusFor('blade'),nativeCount=5;
    for(let i=0;i<nativeCount;i++){const a=player.angle+i*TAU/nativeCount;drawCrescentBlade(x+Math.cos(a)*orbit,y+Math.sin(a)*orbit,a,1.04,1);}
    const extra=mult();for(let i=0;i<extra;i++){const a=player.angle+(i+.5)*TAU/Math.max(1,extra),rr=orbit;drawCrescentBlade(x+Math.cos(a)*rr,y+Math.sin(a)*rr,a,.86,.82);}
  };

  const baseDrawPlayer=drawPlayer;
  drawPlayer=function firstSetPlayerVisuals(){
    baseDrawPlayer();if(!awake('ember'))return;const x=vw/2,y=vh/2,a=Number.isFinite(player.facingAngle)?player.facingAngle:-Math.PI/2,nx=-Math.sin(a),ny=Math.cos(a),charge=clamp((player.awEmberHits||0)/12,0,1),flash=clamp((player.awEmberChargeFlash||0)/.36,0,1);
    for(const side of[-1,1]){const px=x+nx*side*35+Math.cos(a)*5,py=y+ny*side*35+Math.sin(a)*5,image=emberCasterRaster(side,charge,flash);ctx.save();ctx.translate(px,py);ctx.rotate(a);ctx.drawImage(image,-40,-40,80,80);ctx.restore();}
  };


  const baseDrawBoomerangs=drawBoomerangs;
  function drawMoonBoomerang(p){
    const count=Math.min(p.historyCount||0,p.history?.length||0);if(count>1){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#eaf7ff';ctx.globalAlpha=.26;ctx.lineWidth=4;ctx.shadowBlur=14;ctx.shadowColor='#bfeaff';ctx.beginPath();for(let i=0;i<count;i++){const index=((p.historyStart||0)+i)%p.history.length,h=p.history[index],sx=h.x-player.x+vw/2,sy=h.y-player.y+vh/2;i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);}ctx.stroke();ctx.restore();}
    const sx=p.x-player.x+vw/2,sy=p.y-player.y+vh/2,angle=Math.atan2(p.y-p.lastY,p.x-p.lastX),r=p.r*1.28,phase=clamp(Number(p.awMoonPhase)||.14,.10,1),waning=p.awMoonWaning===true;
    ctx.save();ctx.translate(sx,sy);ctx.rotate(angle);ctx.shadowBlur=24;ctx.shadowColor=phase>.88?'#ffffff':'#a9e9ff';ctx.fillStyle=phase>.92?'#ffffff':'#eefaff';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
    if(phase<.985){const direction=(waning?-1:1)*(p.side||1),offset=direction*r*(.12+phase*2.02);ctx.fillStyle='rgba(5,9,24,.985)';ctx.beginPath();ctx.arc(offset,0,r*1.03,0,TAU);ctx.fill();}
    ctx.strokeStyle=phase>.90?'rgba(255,255,255,.98)':'rgba(174,232,255,.92)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();ctx.restore();
  }
  drawBoomerangs=function lunarReturnVisuals(){
    if(!awake('arc'))return baseDrawBoomerangs();
    const curves=state.entities.curves,normal=NORMAL_CURVE_RENDER_BUFFER,lunar=LUNAR_RENDER_BUFFER,original=state.entities.curves;normal.length=0;lunar.length=0;
    for(const p of curves){if(!p||p.dead)continue;(p.awLunar?lunar:normal).push(p);}
    state.entities.curves=normal;try{baseDrawBoomerangs();}finally{state.entities.curves=original;}
    for(const p of lunar)drawMoonBoomerang(p);
  };

  function drawAwakeningFx(){
    for(const e of fx){const p=worldToScreen(e.x,e.y),q=clamp(e.life/Math.max(.001,e.max),0,1),age=1-q;ctx.save();ctx.globalAlpha=Math.min(1,q*1.7);
      if(e.kind==='stellar-volley'){ctx.translate(p.x,p.y);ctx.strokeStyle='#dffcff';ctx.shadowBlur=20;ctx.shadowColor='#8ff5ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,40+age*20,0,TAU);ctx.stroke();}
      else if(e.kind==='starline-flash'){ctx.translate(p.x,p.y);ctx.fillStyle='#ffffff';ctx.shadowBlur=34;ctx.shadowColor='#ffd9ed';ctx.beginPath();ctx.arc(0,0,7+age*24,0,TAU);ctx.fill();}
      else if(e.kind==='bastion-volley'){ctx.translate(p.x,p.y);ctx.strokeStyle='#dffff8';ctx.shadowBlur=20;ctx.shadowColor='#9dffe2';ctx.lineWidth=3;for(let i=0;i<e.count;i++){const a=i*TAU/e.count+age*.22,r=46+age*26;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.55,Math.sin(a)*r*.55);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
      else if(e.kind==='bastion-break'){ctx.translate(p.x,p.y);ctx.strokeStyle='#eafff7';ctx.lineWidth=4;for(let i=0;i<8;i++){const a=i*TAU/8,rr=e.r*(.28+.65*age);ctx.beginPath();ctx.moveTo(Math.cos(a)*rr*.62,Math.sin(a)*rr*.62);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);ctx.stroke();}}
      else if(e.kind==='binary-merge'){const a=worldToScreen(e.ax,e.ay),b=worldToScreen(e.bx,e.by),cx=p.x,cy=p.y,ang=age*TAU*1.35,r=(1-age)*Math.hypot(a.x-b.x,a.y-b.y)*.5;ctx.strokeStyle=e.echoed?'#ff83ae':'#ecf7ff';ctx.lineWidth=2;ctx.shadowBlur=22;ctx.shadowColor=e.echoed?'#ff5b91':'#9bdcff';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(cx+Math.cos(ang)*r*.45,cy+Math.sin(ang)*r*.45,cx+Math.cos(ang)*r,cy+Math.sin(ang)*r);ctx.stroke();ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.quadraticCurveTo(cx-Math.cos(ang)*r*.45,cy-Math.sin(ang)*r*.45,cx-Math.cos(ang)*r,cy-Math.sin(ang)*r);ctx.stroke();}
      else if(e.kind==='binary-core'){ctx.translate(p.x,p.y);ctx.fillStyle='#020207';ctx.shadowBlur=38;ctx.shadowColor=e.echoed?'#ff5f97':'#ffffff';ctx.beginPath();ctx.arc(0,0,16+age*20,0,TAU);ctx.fill();ctx.strokeStyle=e.echoed?'#ff8bb1':'#e9fbff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,20+age*34,0,TAU);ctx.stroke();}
      else if(e.kind==='comet-charge'){ctx.translate(p.x,p.y);ctx.rotate(e.a);const len=(e.length||184)*(.68+.32*age),half=(e.width||34)*(.54+.46*age),compress=1-.42*age;ctx.scale(compress,1);ctx.shadowBlur=32+age*22;ctx.shadowColor='#9deaff';const halo=ctx.createLinearGradient(-len*.72,0,len*.58,0);halo.addColorStop(0,'rgba(111,220,255,0)');halo.addColorStop(.48,'rgba(132,231,255,.24)');halo.addColorStop(1,'rgba(255,255,255,.86)');ctx.fillStyle=halo;ctx.beginPath();ctx.moveTo(-len*.72,-half*.15);ctx.lineTo(len*.26,-half*.42);ctx.lineTo(len*.58,-half);ctx.lineTo(len,0);ctx.lineTo(len*.58,half);ctx.lineTo(len*.26,half*.42);ctx.lineTo(-len*.72,half*.15);ctx.closePath();ctx.fill();ctx.strokeStyle='#f5ffff';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-len*.48,0);ctx.lineTo(len*.90,0);ctx.stroke();ctx.globalAlpha=.46+age*.38;ctx.strokeStyle='#73dcff';ctx.lineWidth=1.3;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(-len*.58,side*half*.64);ctx.lineTo(len*.38,side*half*.36);ctx.stroke();}}
      else if(e.kind==='comet-fracture'){const b=worldToScreen(e.x2,e.y2);ctx.strokeStyle='rgba(230,248,255,.78)';ctx.lineWidth=2.2;ctx.setLineDash([16,13]);ctx.lineDashOffset=-age*90;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
      else if(e.kind==='moon-ripple'){ctx.translate(p.x,p.y);ctx.strokeStyle='#effaff';ctx.shadowBlur=22;ctx.shadowColor='#bfeaff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r*(.35+.65*age),0,TAU);ctx.stroke();}
      ctx.restore();
    }
  }
  const baseDrawAlliedEffects=drawAlliedEffects;
  drawAlliedEffects=function awakeningFirstSetEffects(){baseDrawAlliedEffects();drawAwakeningFx();};

  registerResetGameInterceptor('weapon-awakening-effects-a1-a7.js:awakeningFirstSetReset',function awakeningFirstSetReset(next,...args){resetAwakeningCombatState();const result=next();resetAwakeningCombatState();return result;});
  registerShowMainMenuInterceptor('weapon-awakening-effects-a1-a7.js:awakeningFirstSetMenu',function awakeningFirstSetMenu(next,...args){resetAwakeningCombatState();return next();});

  window.stackfallAwakeningFirstSetDebug=()=>({
    bladeOrbitSpeed:bladeOrbitSpeedMultiplier(),bladeNativeCount:awake('blade')?5:(weaponCount('blade')>=5?3:weaponCount('blade')>=2?2:1),
    emberHits:player.awEmberHits||0,emberTargetId:player.awEmberTargetId??null,cometCycle:player.awCometCycle||0,fx:fx.length
  });
})();