(()=>{
  'use strict';

  const awake=key=>window.stackfallIsWeaponAwakened?.(key)===true;
  const mult=()=>Math.min(2,Math.max(0,Number(window.stackfallMultiplicityStacks?.())||0));
  const fx=state.entities.awakeningFx=Array.isArray(state.entities.awakeningFx)?state.entities.awakeningFx:[];
  const pushFx=data=>{fx.push({id:state.nextId++,...data});if(fx.length>72)fx.splice(0,fx.length-72);return fx[fx.length-1];};

  function resetAwakeningCombatState(){
    fx.length=0;
    Object.assign(player,{
      awCoreCycle:0,awBladeCd:4.6,awBladeWindup:0,awEmberHits:0,awEmberTargetId:null,awEmberChargeFlash:0,
      awBulwarkHitAngle:0,awBulwarkHitFlash:0,awBulwarkStrong:0,awCometCycle:0
    });
  }
  resetAwakeningCombatState();

  // A1 — Stellar Core: ordinary Core Pulse remains intact; every fourth original cast adds one simultaneous three-satellite volley.
  const baseSpawnCoreShot=spawnCoreShot;
  spawnCoreShot=function stellarCoreShot(target,echoed=false){
    baseSpawnCoreShot(target,echoed);
    if(!awake('core')||echoed||!target)return;
    player.awCoreCycle=(player.awCoreCycle||0)+1;
    if(player.awCoreCycle%4!==0)return;
    const n=Math.max(1,weaponCount('core')),range=weaponRange('core'),speed=540*(1+stat('projectileSpeed')*.10),phase=(state.time||0)*2.2;
    for(let i=0;i<3;i++){
      const oa=phase+i*TAU/3,ox=player.x+Math.cos(oa)*38,oy=player.y+Math.sin(oa)*38,a=Math.atan2(target.y-oy,target.x-ox);
      spawnPlayerProjectile({x:ox,y:oy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:6.2,life:1.35,maxRange:range,damage:(10+n*2.55)*.78,color:'#dffcff',pierce:n>=4?1:0,source:'core',playerVisual:'core',homingTargetId:target.id,homingReacquire:false,homingTurn:2.6,awakeningChild:true});
    }
    pushFx({kind:'stellar-volley',x:player.x,y:player.y,life:.34,max:.34});
  };

  // A2 — Eclipse Blades: native orbit/contact attacks continue. A periodic alignment wind-up ends in one large circular cut.
  function triggerEclipseCut(){
    const n=Math.max(1,weaponCount('blade')),size=weaponSizeMultiplier(),radius=225*size;
    areaDamage(player.x,player.y,radius,32+n*5.0,'#d8fbff','blade',{shake:false});
    shockwave(player.x,player.y,'#eefcff',radius,.42,6);
    pushFx({kind:'eclipse-cut',x:player.x,y:player.y,r:radius,life:.42,max:.42});
    audio.weapon?.('blade',false,1.45);
  }
  const baseUpdateWeapons=updateWeapons;
  updateWeapons=function awakenedFirstSetWeapons(dt){
    baseUpdateWeapons(dt);
    if(awake('blade')){
      player.awBladeCd=(Number(player.awBladeCd)||4.6)-dt;
      if((player.awBladeWindup||0)>0){
        player.awBladeWindup=Math.max(0,player.awBladeWindup-dt);
        if(player.awBladeWindup===0)triggerEclipseCut();
      }else if(player.awBladeCd<=0){
        player.awBladeCd=Math.max(3.2,5.15*hasteMult());
        player.awBladeWindup=.24;
        pushFx({kind:'blade-align',x:player.x,y:player.y,life:.24,max:.24});
      }
    }else{player.awBladeCd=4.6;player.awBladeWindup=0;}
    player.awEmberChargeFlash=Math.max(0,(player.awEmberChargeFlash||0)-dt);
    player.awBulwarkHitFlash=Math.max(0,(player.awBulwarkHitFlash||0)-dt);
    player.awBulwarkStrong=Math.max(0,(player.awBulwarkStrong||0)-dt);
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
  const baseHurtPlayer=hurtPlayer;
  hurtPlayer=function celestialBastionHurt(amount,source='contact'){
    const beforeShield=Math.max(0,Number(player.shield)||0),beforeHp=Math.max(0,Number(player.hp)||0);
    baseHurtPlayer(amount,source);
    if(!awake('bulwark')||state.mode==='gameover'||(beforeShield<=0&&player.hp>=beforeHp))return;
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
  };

  // A5 — Binary Collapse: native twin wells and augment collapses remain. The native pair gains one bounded final merger.
  let gravityGroupId=0;
  const baseCreateGravityWells=createGravityWells;
  createGravityWells=function binaryCollapseWells(n,echoed=false){
    const before=state.entities.wells.length;
    baseCreateGravityWells(n,echoed);
    if(!awake('gravity')||n<6)return;
    const created=state.entities.wells.slice(before).filter(w=>w&&!w.multiplicity);
    if(created.length<2)return;
    const group=++gravityGroupId;
    created.slice(0,2).forEach((w,index)=>{w.awBinaryGroup=group;w.awBinarySide=index;w.awBinaryEcho=!!echoed;});
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
      for(const pair of groups.values())if(pair.length>=2&&pair.every(w=>w.life<=.34))triggerBinaryMerge(pair.slice(0,2));
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
    const targetId=target.id,a=Math.atan2(target.y-player.y,target.x-player.x),sx=player.x+Math.cos(a)*58,sy=player.y+Math.sin(a)*58;
    pushFx({kind:'comet-charge',x:sx,y:sy,a,targetId,life:.22,max:.22});
    scheduleWeaponAction(220,()=>{
      const live=enemyById(targetId)||nearestWeaponTarget('comet');if(!live)return;
      const angle=Math.atan2(live.y-player.y,live.x-player.x),startX=player.x+Math.cos(angle)*55,startY=player.y+Math.sin(angle)*55,range=weaponRange('comet'),speed=1080,nx=Math.cos(angle),ny=Math.sin(angle);
      spawnPlayerProjectile({x:startX,y:startY,vx:nx*speed,vy:ny*speed,r:18,life:1.15,maxRange:range,damage:48+n*8.2,color:'#dffbff',pierce:9,source:'comet',explode:true,awakeningChild:true});
      pushFx({kind:'comet-fracture',x:startX,y:startY,x2:startX+nx*range,y2:startY+ny*range,life:.30,max:.30});
      shockwave(startX,startY,'#ffffff',92,.25,4);audio.weapon?.('comet',false,1.6);
    });
  };

  // A7 — Lunar Return: every boomerang uses an added large orbit stage before returning.
  const baseUpdateBoomerangs=updateBoomerangs;
  function markLunarCurves(){if(!awake('arc'))return;for(const p of state.entities.curves)if(p&&!p.dead&&!p.awLunar){p.awLunar=true;p.awMoonPhase=.14;p.awMoonRippleDone=false;}}
  function lunarHit(p,source,multiplier=1){
    forEachNearbyEnemyCandidate(p.x,p.y,p.r+92,e=>{
      if(e.dead||p.hitIds.has(e.id))return;
      if(segmentDistance(e.x,e.y,p.lastX,p.lastY,p.x,p.y)<e.r+p.r){
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
        p.stage='lunarOrbit';p.stageTime=0;const liveTarget=enemyById(p.targetId);p.awOrbitX=liveTarget?.x??p.targetPoint.x;p.awOrbitY=liveTarget?.y??p.targetPoint.y;p.awOrbitR=72+p.stacks*6;p.awOrbitAngle=Math.atan2(p.y-p.awOrbitY,p.x-p.awOrbitX);p.awOrbitDuration=.48;
        if(p.stacks>=4)p.hitIds.clear();
      }
    }else if(p.stage==='lunarOrbit'){
      const progress=clamp(p.stageTime/Math.max(.001,p.awOrbitDuration||.48),0,1),turn=(p.side||1)*TAU*1.12;
      p.awOrbitAngle+=turn*dt/Math.max(.001,p.awOrbitDuration||.48);const rr=p.awOrbitR||96;
      p.x=p.awOrbitX+Math.cos(p.awOrbitAngle)*rr;p.y=p.awOrbitY+Math.sin(p.awOrbitAngle)*rr;p.awMoonPhase=.86+.14*Math.sin(progress*Math.PI);
      lunarHit(p,p.ricochet?'arc-ricochet':'arc',.82);
      if(progress>=1){p.stage='return';p.stageTime=0;p.returnLife=0;p.hitIds.clear();p.historyStart=0;p.historyCount=0;p.awMoonPhase=1;}
    }else{
      p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d2=dx*dx+dy*dy,d=Math.sqrt(d2)||1,speed=840+p.stacks*42+(p.stacks>=4?105:0);
      p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);p.awMoonPhase=1;
      lunarHit(p,p.ricochet?'arc-ricochet-return':'arc-return',p.returnDamageMult||1);
      if(d2<(player.r+13)**2||p.returnLife>1.45)p.dead=true;
    }
    pushHistory();p.trailCd-=dt;
    if(p.trailDamage&&p.trailCd<=0){p.trailCd=.20;const rr=21+p.stacks*2;forEachNearbyEnemyCandidate(p.x,p.y,rr+72,e=>{if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+rr)**2)dealDamage(e,2.8+p.stacks,{color:p.color,source:'arc-trail',canCrit:false});});}
  }
  updateBoomerangs=function lunarReturnUpdate(dt){
    markLunarCurves();
    const curves=state.entities.curves;
    if(!awake('arc')||!curves.some(p=>p?.awLunar))return baseUpdateBoomerangs(dt);
    const lunar=curves.filter(p=>p?.awLunar&&!p.dead),normal=curves.filter(p=>!p?.awLunar&&!p?.dead),original=state.entities.curves;
    state.entities.curves=normal;
    try{baseUpdateBoomerangs(dt);}finally{
      const updatedNormal=state.entities.curves;
      state.entities.curves=original;original.length=0;original.push(...updatedNormal,...lunar);
    }
    const stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
    for(const p of lunar)updateLunarCurve(p,dt,stressed);
    compactInPlace(original,p=>p&&!p.dead);trimOldest(original,32);
  };

  // Shared first-set visuals.
  const baseUpdateEffects=updateEffects;
  updateEffects=function awakeningFxUpdate(dt){
    baseUpdateEffects(dt);
    for(const effect of fx)effect.life-=dt;
    compactInPlace(fx,e=>e&&e.life>0);
  };

  const baseDrawPlayerCrystalCore=drawPlayerCrystalCore;
  drawPlayerCrystalCore=function stellarCoreVisual(x,y,t,growth){
    baseDrawPlayerCrystalCore(x,y,t,growth);
    if(!awake('core'))return;
    const phase=t*.0014,pulse=1+Math.sin(t*.008)*.05;ctx.save();ctx.translate(x,y);ctx.shadowBlur=20;ctx.shadowColor='#bff8ff';
    for(const [index,r] of [31,40].entries()){ctx.save();ctx.rotate((index?1:-1)*phase*(index?1.28:1));ctx.strokeStyle=index?'rgba(202,190,255,.74)':'rgba(182,250,255,.82)';ctx.lineWidth=index?1.5:2.1;ctx.beginPath();ctx.ellipse(0,0,r,r*.36,index?.62:-.42,0,TAU);ctx.stroke();ctx.restore();}
    ctx.scale(pulse,pulse);ctx.fillStyle='rgba(242,253,255,.92)';ctx.beginPath();ctx.arc(0,0,8.5,0,TAU);ctx.fill();ctx.fillStyle='#213b81';ctx.beginPath();ctx.arc(0,0,4.1,0,TAU);ctx.fill();ctx.restore();
    for(let i=0;i<3;i++){const a=phase*2.1+i*TAU/3,rr=39,sx=x+Math.cos(a)*rr,sy=y+Math.sin(a)*rr;ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.fillStyle='#e9fdff';ctx.strokeStyle='#6feaff';ctx.lineWidth=1.2;ctx.shadowBlur=15;ctx.shadowColor='#7ce8ff';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(0,-5);ctx.lineTo(-6,0);ctx.lineTo(0,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  };

  const baseDrawEquippedOrbits=drawEquippedOrbits;
  function drawCrescentBlade(cx,cy,a,scale=1,alpha=1){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a+Math.PI/2);ctx.scale(scale,scale);ctx.globalAlpha=alpha;ctx.shadowBlur=22;ctx.shadowColor='#9bdcff';ctx.fillStyle='#07101c';ctx.strokeStyle='#c9f4ff';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(-9,-35);ctx.quadraticCurveTo(31,-7,2,37);ctx.quadraticCurveTo(12,7,-9,-35);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.88)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,-31);ctx.quadraticCurveTo(25,-5,4,30);ctx.stroke();ctx.restore();
  }
  drawEquippedOrbits=function eclipseBladeVisuals(x,y,t){
    if(!awake('blade'))return baseDrawEquippedOrbits(x,y,t);
    const saved=state.weaponStacks.blade;state.weaponStacks.blade=0;try{baseDrawEquippedOrbits(x,y,t);}finally{state.weaponStacks.blade=saved;}
    const orbit=orbitRadiusFor('blade'),wind=(player.awBladeWindup||0)>0,progress=wind?1-clamp(player.awBladeWindup/.24,0,1):0;
    for(let i=0;i<3;i++){
      if(wind){const facing=Number.isFinite(player.facingAngle)?player.facingAngle:0,nx=-Math.sin(facing),ny=Math.cos(facing),spread=(i-1)*27*(1-progress*.25),forward=48+progress*16;drawCrescentBlade(x+Math.cos(facing)*forward+nx*spread,y+Math.sin(facing)*forward+ny*spread,facing,1.08,1);}
      else{const a=player.angle+i*TAU/3;drawCrescentBlade(x+Math.cos(a)*orbit,y+Math.sin(a)*orbit,a,1.04,1);}
    }
    const extra=mult();for(let i=0;i<extra;i++){const a=(i+.5)*TAU/Math.max(1,extra)+player.angle*.31,rr=orbit+18;drawCrescentBlade(x+Math.cos(a)*rr,y+Math.sin(a)*rr,a,.86,.82);}
  };

  const baseDrawPlayer=drawPlayer;
  drawPlayer=function firstSetPlayerVisuals(){
    baseDrawPlayer();
    if(!awake('ember'))return;
    const x=vw/2,y=vh/2,a=Number.isFinite(player.facingAngle)?player.facingAngle:-Math.PI/2,nx=-Math.sin(a),ny=Math.cos(a),charge=clamp((player.awEmberHits||0)/12,0,1),flash=clamp((player.awEmberChargeFlash||0)/.36,0,1);
    for(const side of[-1,1]){const px=x+nx*side*35+Math.cos(a)*5,py=y+ny*side*35+Math.sin(a)*5;ctx.save();ctx.translate(px,py);ctx.rotate(a);ctx.shadowBlur=12+charge*18+flash*16;ctx.shadowColor=side<0?'#ff9ec0':'#9eefff';ctx.fillStyle='#f7ffff';ctx.strokeStyle=side<0?'#ff9ec0':'#9eefff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(0,-6);ctx.lineTo(-10,0);ctx.lineTo(0,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=.28+.55*charge;ctx.beginPath();ctx.arc(0,0,11+charge*4,0,TAU);ctx.stroke();ctx.restore();}
  };

  const baseDrawEmberProjectile=drawEmberProjectile;
  drawEmberProjectile=function nebulaStarcasterProjectile(p){
    if(!awake('ember'))return baseDrawEmberProjectile(p);
    const r=Math.max(4,p.r),length=r*4.5;ctx.fillStyle=p.color;ctx.strokeStyle='#fff5f7';ctx.lineWidth=1.15;ctx.beginPath();ctx.moveTo(length*.95,0);ctx.lineTo(length*.18,-r*.56);ctx.lineTo(-length*.72,-r*.16);ctx.lineTo(-length*.96,0);ctx.lineTo(-length*.72,r*.16);ctx.lineTo(length*.18,r*.56);ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=.66;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(length*.32,0,r*.52,r*.28,0,0,TAU);ctx.fill();ctx.globalAlpha=1;
  };

  const baseDrawDefenseBarrier=drawDefenseBarrier;
  drawDefenseBarrier=function celestialBastionVisual(){
    if(!awake('bulwark'))return baseDrawDefenseBarrier();
    const x=vw/2,y=vh/2,t=performance.now(),cap=Math.max(1,shieldCapacity?.()||1),ratio=clamp((player.shield||0)/cap,0,1),parts=Math.max(4,Math.min(8,Math.round(4+ratio*4))),hitA=Number(player.awBulwarkHitAngle)||0,hitFlash=clamp((player.awBulwarkHitFlash||0)/.32,0,1),strong=clamp((player.awBulwarkStrong||0)/.34,0,1);
    ctx.save();ctx.translate(x,y);
    for(let i=0;i<parts;i++){const a=i/parts*TAU+t*.00013,delta=Math.abs(Math.atan2(Math.sin(a-hitA),Math.cos(a-hitA))),focus=hitFlash*Math.max(0,1-delta/.9),rr=50+focus*13;ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(a+Math.PI/2);ctx.shadowBlur=10+focus*22;ctx.shadowColor='#9dffe2';ctx.fillStyle=`rgba(24,58,76,${.64+.18*ratio})`;ctx.strokeStyle=`rgba(205,255,239,${.48+.46*ratio})`;ctx.lineWidth=1.5+focus;ctx.beginPath();ctx.moveTo(-15,-6);ctx.lineTo(13,-9);ctx.lineTo(20,0);ctx.lineTo(13,9);ctx.lineTo(-15,6);ctx.lineTo(-21,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-7,-3);ctx.lineTo(10,0);ctx.lineTo(-7,3);ctx.stroke();ctx.restore();}
    if(strong>0){ctx.rotate(hitA);ctx.strokeStyle=`rgba(231,255,249,${.35+.6*strong})`;ctx.lineWidth=5;ctx.shadowBlur=25;ctx.shadowColor='#b5ffe5';ctx.beginPath();ctx.arc(0,0,73,-1.0,1.0);ctx.stroke();}
    ctx.restore();
  };

  const baseDrawGravityLens=drawGravityLens;
  drawGravityLens=function binaryCollapseVisual(w,p,alpha,t){
    baseDrawGravityLens(w,p,alpha,t);
    if(!awake('gravity')||w?.awBinarySide===undefined)return;
    const color=w.awBinaryEcho?'#ff70a4':w.awBinarySide===0?'#65c9ff':'#ff934f';ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha*.92;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.shadowBlur=26;ctx.shadowColor=color;ctx.beginPath();ctx.arc(0,0,30+Math.sin(t*5+w.awBinarySide)*3,0,TAU);ctx.stroke();ctx.restore();
  };

  const baseDrawBoomerangs=drawBoomerangs;
  function drawMoonBoomerang(p){
    const count=Math.min(p.historyCount||0,p.history?.length||0);if(count>1){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#eaf7ff';ctx.globalAlpha=.26;ctx.lineWidth=4;ctx.shadowBlur=14;ctx.shadowColor='#bfeaff';ctx.beginPath();for(let i=0;i<count;i++){const index=((p.historyStart||0)+i)%p.history.length,h=worldToScreen(p.history[index].x,p.history[index].y);i?ctx.lineTo(h.x,h.y):ctx.moveTo(h.x,h.y);}ctx.stroke();ctx.restore();}
    const s=worldToScreen(p.x,p.y),angle=Math.atan2(p.y-p.lastY,p.x-p.lastX),r=p.r*1.28,phase=clamp(Number(p.awMoonPhase)||.14,.10,1);
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(angle);ctx.shadowBlur=24;ctx.shadowColor='#e7f8ff';ctx.fillStyle='#f6fbff';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
    if(phase<.985){const offset=-r*(.15+phase*1.45);ctx.fillStyle='rgba(7,12,29,.96)';ctx.beginPath();ctx.arc(offset,0,r*1.02,0,TAU);ctx.fill();}
    ctx.strokeStyle='rgba(194,235,255,.9)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();ctx.restore();
  }
  drawBoomerangs=function lunarReturnVisuals(){
    if(!awake('arc'))return baseDrawBoomerangs();
    const curves=state.entities.curves,normal=curves.filter(p=>!p?.awLunar),lunar=curves.filter(p=>p?.awLunar&&!p.dead),original=state.entities.curves;
    state.entities.curves=normal;try{baseDrawBoomerangs();}finally{state.entities.curves=original;}
    for(const p of lunar)drawMoonBoomerang(p);
  };

  function drawAwakeningFx(){
    for(const e of fx){const p=worldToScreen(e.x,e.y),q=clamp(e.life/Math.max(.001,e.max),0,1),age=1-q;ctx.save();ctx.globalAlpha=Math.min(1,q*1.7);
      if(e.kind==='stellar-volley'){ctx.translate(p.x,p.y);ctx.strokeStyle='#dffcff';ctx.shadowBlur=20;ctx.shadowColor='#8ff5ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,40+age*20,0,TAU);ctx.stroke();}
      else if(e.kind==='blade-align'){ctx.translate(p.x,p.y);ctx.strokeStyle='#bfefff';ctx.setLineDash([8,7]);ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,90+age*55,0,TAU);ctx.stroke();ctx.setLineDash([]);}
      else if(e.kind==='eclipse-cut'){ctx.translate(p.x,p.y);ctx.strokeStyle='#f2fbff';ctx.shadowBlur=30;ctx.shadowColor='#9bdcff';ctx.lineWidth=7*(1-age)+2;ctx.beginPath();ctx.arc(0,0,e.r*(.72+.28*age),0,TAU);ctx.stroke();ctx.strokeStyle='rgba(18,26,46,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r*(.62+.34*age),0,TAU);ctx.stroke();}
      else if(e.kind==='starline-flash'){ctx.translate(p.x,p.y);ctx.fillStyle='#ffffff';ctx.shadowBlur=34;ctx.shadowColor='#ffd9ed';ctx.beginPath();ctx.arc(0,0,7+age*24,0,TAU);ctx.fill();}
      else if(e.kind==='bastion-break'){ctx.translate(p.x,p.y);ctx.strokeStyle='#eafff7';ctx.lineWidth=4;for(let i=0;i<8;i++){const a=i*TAU/8,rr=e.r*(.28+.65*age);ctx.beginPath();ctx.moveTo(Math.cos(a)*rr*.62,Math.sin(a)*rr*.62);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);ctx.stroke();}}
      else if(e.kind==='binary-merge'){const a=worldToScreen(e.ax,e.ay),b=worldToScreen(e.bx,e.by),cx=p.x,cy=p.y,ang=age*TAU*1.35,r=(1-age)*Math.hypot(a.x-b.x,a.y-b.y)*.5;ctx.strokeStyle=e.echoed?'#ff83ae':'#ecf7ff';ctx.lineWidth=2;ctx.shadowBlur=22;ctx.shadowColor=e.echoed?'#ff5b91':'#9bdcff';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(cx+Math.cos(ang)*r*.45,cy+Math.sin(ang)*r*.45,cx+Math.cos(ang)*r,cy+Math.sin(ang)*r);ctx.stroke();ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.quadraticCurveTo(cx-Math.cos(ang)*r*.45,cy-Math.sin(ang)*r*.45,cx-Math.cos(ang)*r,cy-Math.sin(ang)*r);ctx.stroke();}
      else if(e.kind==='binary-core'){ctx.translate(p.x,p.y);ctx.fillStyle='#020207';ctx.shadowBlur=38;ctx.shadowColor=e.echoed?'#ff5f97':'#ffffff';ctx.beginPath();ctx.arc(0,0,16+age*20,0,TAU);ctx.fill();ctx.strokeStyle=e.echoed?'#ff8bb1':'#e9fbff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,20+age*34,0,TAU);ctx.stroke();}
      else if(e.kind==='comet-charge'){ctx.translate(p.x,p.y);ctx.rotate(e.a);ctx.shadowBlur=28;ctx.shadowColor='#dffbff';ctx.strokeStyle='#f5ffff';ctx.lineWidth=2.4;const len=85*(.45+.55*age);ctx.beginPath();ctx.moveTo(-len*.65,0);ctx.lineTo(len*.9,0);ctx.stroke();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(len*.55,-9);ctx.lineTo(len*.62,0);ctx.lineTo(len*.55,9);ctx.closePath();ctx.fill();}
      else if(e.kind==='comet-fracture'){const b=worldToScreen(e.x2,e.y2);ctx.strokeStyle='rgba(230,248,255,.78)';ctx.lineWidth=2.2;ctx.setLineDash([16,13]);ctx.lineDashOffset=-age*90;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
      else if(e.kind==='moon-ripple'){ctx.translate(p.x,p.y);ctx.strokeStyle='#effaff';ctx.shadowBlur=22;ctx.shadowColor='#bfeaff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r*(.35+.65*age),0,TAU);ctx.stroke();}
      ctx.restore();
    }
  }
  const baseDrawAlliedEffects=drawAlliedEffects;
  drawAlliedEffects=function awakeningFirstSetEffects(){baseDrawAlliedEffects();drawAwakeningFx();};

  const baseReset=resetGame;resetGame=function awakeningFirstSetReset(){resetAwakeningCombatState();const result=baseReset();resetAwakeningCombatState();return result;};
  const baseMenu=showMainMenu;showMainMenu=function awakeningFirstSetMenu(){resetAwakeningCombatState();return baseMenu();};

  window.stackfallAwakeningFirstSetDebug=()=>({
    coreCycle:player.awCoreCycle||0,bladeCooldown:player.awBladeCd||0,bladeWindup:player.awBladeWindup||0,
    emberHits:player.awEmberHits||0,emberTargetId:player.awEmberTargetId??null,cometCycle:player.awCometCycle||0,fx:fx.length
  });
})();