(function(){
  'use strict';

  const weaponStacks=key=>Math.max(0,weaponCount(key));
  const multishotStacks=()=>Math.min(2,Math.max(0,Number(stat('multiplicity'))||0));
  const clampScale=(n,table)=>table[Math.max(0,Math.min(table.length-1,n))]??1;
  let forcedCriticalResolution=false,criticalResolutionPreviousScale=1;
  function resetCommunityRunState(){player.communityCoreRicochetCycle=0;forcedCriticalResolution=false;criticalResolutionPreviousScale=1;if((Number(window.stackfallResolutionScale)||1)!==1){window.stackfallResolutionScale=1;resize();}}
  const previousResetGame=resetGame;resetGame=function communityResetGame(){const result=previousResetGame();resetCommunityRunState();return result;};
  const previousShowMainMenu=showMainMenu;showMainMenu=function communityShowMainMenu(){const result=previousShowMainMenu();resetCommunityRunState();return result;};
  const previousEndGame=endGame;endGame=function communityEndGame(){const result=previousEndGame();resetCommunityRunState();return result;};

  const sourceFamily=source=>{
    const s=String(source||'');
    if(['ember','echo-star','ember-multiplicity','ember-burn','ember-strong-chain','star-spark','ember-burst'].includes(s))return'ember';
    if(s.startsWith('prism-'))return'prism';
    if(['drone','meteor-drone','drone-multiplicity','echo-drone','drone-burst','drone-meteor'].includes(s))return'drone';
    if(['blade','blade-multiplicity','wave','blade-burst','blade-shear'].includes(s))return'blade';
    if(s.startsWith('arc'))return'arc';
    return null;
  };
  function weaponDamageScale(source){
    const family=sourceFamily(source);if(!family)return 1;
    const n=weaponStacks(family==='ember'?'ember':family==='prism'?'prism':family==='drone'?'drone':family==='blade'?'blade':'arc');
    if(family==='ember')return clampScale(n,[1,1,1,1,.84,.78,.68]);
    if(family==='prism')return clampScale(n,[1,1,.95,.92,.88,.82,.68]);
    if(family==='drone')return clampScale(n,[1,1,1,1,.96,.92,.78]);
    if(family==='blade')return clampScale(n,[1,1,1,1,.88,.84,.82]);
    if(family==='arc')return clampScale(n,[1,1,1,1,.97,.94,.90]);
    return 1;
  }

  const previousDealDamage=dealDamage;
  let feedbackDamageGuard=false;
  dealDamage=function communityBalancedDamage(enemy,amount,opts={}){
    if(feedbackDamageGuard||!enemy||enemy.dead)return previousDealDamage(enemy,amount,opts);
    const source=String(opts.source||''),wasAlive=!enemy.dead,x=enemy.x,y=enemy.y,locked=enemy.timeLock>0;
    amount*=weaponDamageScale(source);
    const suppressCore=!!state.weaponAugments?.core&&['core','core-echo'].includes(source);
    const suppressChrono=!!state.weaponAugments?.chrono&&locked&&!source.startsWith('chrono-burst');
    const savedCore=state.weaponAugments?.core,savedChrono=state.weaponAugments?.chrono;
    if(suppressChrono)amount*=1.13;
    try{
      if(suppressCore)state.weaponAugments.core=false;
      if(suppressChrono)state.weaponAugments.chrono=false;
      previousDealDamage(enemy,amount,opts);
    }finally{
      if(suppressCore)state.weaponAugments.core=savedCore;
      if(suppressChrono)state.weaponAugments.chrono=savedChrono;
    }
    if(suppressCore&&wasAlive){
      player.communityCoreRicochetCycle=(player.communityCoreRicochetCycle||0)+1;
      if(player.communityCoreRicochetCycle%4===0){
        const candidates=nearestEnemies(x,y,3,new Set([enemy.id]),260),target=candidates[0];
        if(target){feedbackDamageGuard=true;try{previousDealDamage(target,amount*.42,{color:'#dffbff',source:'core-ricochet',canCrit:false});}finally{feedbackDamageGuard=false;}state.entities.beams.push({x1:x,y1:y,x2:target.x,y2:target.y,life:.12,max:.12,color:'#dffbff',width:2});}
      }
    }
    if(suppressChrono&&wasAlive&&enemy.dead){const chronoSaved=state.weaponAugments.chrono;feedbackDamageGuard=true;state.weaponAugments.chrono=false;try{areaDamage(x,y,96*weaponSizeMultiplier(),20+weaponStacks('chrono')*3.6,COLORS.chrono,'chrono-burst');}finally{state.weaponAugments.chrono=chronoSaved;feedbackDamageGuard=false;}}
  };

  const PRISM_ACQUISITION_SECONDS=1.0,PRISM_RELEASE_GRACE_SECONDS=2.25;
  const prismBodyCount=n=>Math.min(5,(n>=6?3:n>=2?2:1)+multishotStacks());
  const prismReleaseDistance=()=>Math.max(1500,weaponRange('prism')*3+orbitRadiusFor('prism'));
  function clearPrismAimBeams(lock){
    if(!Array.isArray(lock?.aimBeams))return;
    for(const beam of lock.aimBeams)if(beam)beam.life=0;
    lock.aimBeams.length=0;
  }
  function sharedPrismLock(){
    const now=state.time||0,lock=player.prismSharedLock||(player.prismSharedLock={targetId:null,windup:0,readyAt:now,lostTime:0,heat:0,tick:0,visual:0,augmentCd:0,aimBeams:[],attackStarted:false,attackFlash:0,flashVisual:0});
    if(!Number.isFinite(lock.readyAt))lock.readyAt=now+Math.max(0,Number(lock.windup)||0);
    if(!Array.isArray(lock.aimBeams))lock.aimBeams=[];
    if(typeof lock.attackStarted!=='boolean')lock.attackStarted=false;
    if(!Number.isFinite(lock.attackFlash))lock.attackFlash=0;
    if(!Number.isFinite(lock.flashVisual))lock.flashVisual=0;
    return lock;
  }
  function acquirePrismTarget(lock,target){
    clearPrismAimBeams(lock);
    const now=state.time||0;lock.targetId=target.id;lock.readyAt=now+PRISM_ACQUISITION_SECONDS;lock.windup=PRISM_ACQUISITION_SECONDS;lock.lostTime=0;lock.heat=0;lock.tick=0;lock.visual=0;lock.augmentCd=.65;lock.attackStarted=false;lock.attackFlash=0;lock.flashVisual=0;
  }
  function sharedPrismTarget(dt=0){
    const lock=sharedPrismLock(),now=state.time||0;let target=lock.targetId?enemyById(lock.targetId):null;
    if(target&&!target.dead){const inside=Math.hypot(target.x-player.x,target.y-player.y)<=prismReleaseDistance();lock.lostTime=inside?0:lock.lostTime+Math.max(0,dt);if(inside||lock.lostTime<PRISM_RELEASE_GRACE_SECONDS)return target;}
    lock.targetId=null;target=nearestWeaponTarget('prism');
    if(target)acquirePrismTarget(lock,target);else{clearPrismAimBeams(lock);lock.readyAt=now;lock.windup=0;lock.lostTime=0;lock.heat=Math.max(0,lock.heat-Math.max(0,dt)*2.2);lock.attackStarted=false;lock.attackFlash=0;}return target;
  }
  function pushPrismBeam(pos,index,count,target,beam){state.entities.beams.push({x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,prismOriginIndex:index,prismOriginCount:count,prismTargetId:target.id,...beam});}
  function syncPrismAimBeams(lock,positions,target,count,size){
    const progress=clamp(1-lock.windup/PRISM_ACQUISITION_SECONDS,0,1),width=Math.max(.9,(1.05+progress*1.35)*size),life=.18;
    while(lock.aimBeams.length>count){const stale=lock.aimBeams.pop();if(stale)stale.life=0;}
    positions.forEach((pos,index)=>{
      let beam=lock.aimBeams[index];
      if(!beam||beam.life<=0||!state.entities.beams.includes(beam)){
        beam={x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,life,max:life,color:'#bfaeff',width,prismOriginIndex:index,prismOriginCount:count,prismTargetId:target.id,prismAim:true};
        state.entities.beams.push(beam);lock.aimBeams[index]=beam;
      }else{
        beam.x1=pos.x;beam.y1=pos.y;beam.x2=target.x;beam.y2=target.y;beam.life=life;beam.max=life;beam.color='#bfaeff';beam.width=width;beam.prismOriginIndex=index;beam.prismOriginCount=count;beam.prismTargetId=target.id;
      }
    });
  }
  function beginPrismAttack(lock,positions,target,count,size){
    clearPrismAimBeams(lock);lock.attackStarted=true;lock.attackFlash=.22;lock.flashVisual=0;lock.visual=0;
    shockwave(target.x,target.y,'#eadcff',30+count*4,.16,1.5);
    for(const pos of positions)shockwave(pos.x,pos.y,'#d7c6ff',18*size,.12,1.1);
  }
  function prismRicochet(target,n,totalDamage){
    const excluded=new Set([target.id]),targets=nearestEnemies(target.x,target.y,2,excluded,260+n*12);if(!targets.length)return;
    let from=target;targets.forEach((other,index)=>{const damage=totalDamage*(index?.24:.30);dealDamage(other,damage,{color:'#f4ddff',source:'prism-ricochet',canCrit:false});state.entities.beams.push({x1:from.x,y1:from.y,x2:other.x,y2:other.y,life:.18,max:.18,color:index?'#d8c5ff':'#f2e7ff',width:(index?2.1:2.7)*weaponSizeMultiplier()});from=other;});
  }
  updateFocusedPrisms=function communityFocusedPrisms(dt,n){
    const count=prismBodyCount(n),positions=prismPositions(count),lock=sharedPrismLock(),size=weaponSizeMultiplier(),stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed(),target=sharedPrismTarget(dt);if(!target)return;
    lock.windup=Math.max(0,lock.readyAt-(state.time||0));lock.tick-=dt;lock.visual-=dt;lock.augmentCd-=dt;lock.attackFlash=Math.max(0,lock.attackFlash-dt);lock.flashVisual-=dt;
    if(lock.windup>0){lock.attackStarted=false;lock.attackFlash=0;trimOldest(state.entities.beams,Math.max(0,entityCap('beams')-count));syncPrismAimBeams(lock,positions,target,count,size);return;}
    if(!lock.attackStarted)beginPrismAttack(lock,positions,target,count,size);
    lock.heat=Math.min(3.2,lock.heat+dt);const stage=prismStage(lock.heat,n),mult=stage===2?(n>=6?4.45:n>=5?4.10:3.70):stage===1?1.85:1,color=stage===2?'#fff1a8':stage===1?'#ffae7f':'#c8b3ff',width=(2.6+stage*1.85+n*.14)*size,tickInterval=Math.max(.065,.25*hasteMult());
    if(lock.tick<=0){lock.tick+=tickInterval;const damage=(2.65+n*.86)*mult;for(const pos of positions)dealDamage(target,damage,{color,source:'prism-focus'});if(state.weaponAugments?.prism)prismRicochet(target,n,damage*positions.length);}
    if(lock.attackFlash>0&&lock.flashVisual<=0){lock.flashVisual=.065;positions.forEach((pos,index)=>pushPrismBeam(pos,index,count,target,{life:.045,max:.045,color:'#fff8ff',width:Math.max(2.8,width*.82)}));}
    if(lock.visual<=0){lock.visual=stressed?.18:.11;positions.forEach((pos,index)=>pushPrismBeam(pos,index,count,target,{life:.075,max:.075,color,width:Math.max(1,width*.42)}));}
    if(state.weaponAugments?.prism&&stage===2&&lock.augmentCd<=0){lock.augmentCd=1.20;const len=(150+n*9)*Math.sqrt(size),hitHalfWidth=7.5*size,damage=16+n*4.2,base=Math.atan2(target.y-player.y,target.x-player.x);for(const offset of[-Math.PI/4,Math.PI/4]){const a=base+offset,x1=target.x-Math.cos(a)*len,y1=target.y-Math.sin(a)*len,x2=target.x+Math.cos(a)*len,y2=target.y+Math.sin(a)*len;state.entities.beams.push({x1,y1,x2,y2,life:.20,max:.20,color:'#fff6d7',width:hitHalfWidth*2});forEachNearbyEnemyCandidate(target.x,target.y,len+80,e=>{if(!e.dead&&segmentDistance(e.x,e.y,x1,y1,x2,y2)<e.r+hitHalfWidth)dealDamage(e,damage,{color:'#fff4dc',source:'prism-overheat-line',canCrit:false});});}dealDamage(target,damage*.85,{color:'#ffba72',source:'prism-overheat',canCrit:false});}
    trimOldest(state.entities.beams,entityCap('beams'));
  };
  firePrism=function communitySharedPrismEcho(n,echoed=false){const target=sharedPrismTarget(0),lock=player.prismSharedLock;if(!target||(lock?.readyAt||0)>(state.time||0))return;const count=prismBodyCount(n),positions=prismPositions(count),size=weaponSizeMultiplier();positions.forEach((pos,index)=>{dealDamage(target,(8+n*2.65)*(echoed?.62:1),{color:echoed?COLORS.pink:'#f2d5ff',source:'prism-echo'});pushPrismBeam(pos,index,count,target,{life:.14,max:.14,color:echoed?COLORS.pink:'#f2d5ff',width:(3.4+n*.20)*size});});trimOldest(state.entities.beams,entityCap('beams'));};

  function nearestBossInRailRange(){const range=weaponRange('rail'),r2=range*range;let best=null,bestD2=Infinity;for(const e of state.entities.enemies){if(!e||e.dead||e.type!=='boss')continue;const d2=(e.x-player.x)**2+(e.y-player.y)**2;if(d2<=r2&&d2<bestD2){best=e;bestD2=d2;}}return best;}
  function railParallelOffsets(count,spacing){const out=[];for(let i=0;i<count;i++)out.push((i-(count-1)/2)*spacing);return out;}
  fireRailgun=function bossPriorityRailgun(n,echoed=false){
    const manual=GAME_SETTINGS.manualAim===true&&state.input.aimActive,target=manual?nearestWeaponTarget('rail'):(nearestBossInRailRange()||nearestWeaponTarget('rail'));if(!target)return;
    const x=player.x,y=player.y,angle=Math.atan2(target.y-y,target.x-x),length=weaponRange('rail'),size=weaponSizeMultiplier(),baseCount=clamp(Math.floor(n),1,6),extra=echoed?0:multishotStacks(),count=baseCount+extra,spacing=(14+n*1.2)*size,offsets=railParallelOffsets(count,spacing),nx=-Math.sin(angle),ny=Math.cos(angle),baseDamage=(40+n*9.4)*(echoed?.60:1),damage=baseDamage/Math.sqrt(baseCount),width=(5.2+n*.72)*size*Math.max(.72,1-Math.max(0,count-3)*.04),eliteBonus=n>=5?1.32:1,color=echoed?COLORS.pink:'#b7e7ff';
    const volley=(mult=1,after=false)=>{offsets.forEach((offset,index)=>{const x1=x+nx*offset,y1=y+ny*offset,x2=x1+Math.cos(angle)*length,y2=y1+Math.sin(angle)*length,extraBody=index>=baseCount&&!echoed;applyRailBeam(x1,y1,x2,y2,width*(after?.72:1),damage*mult,after?'#eaf8ff':extraBody?'#d9f3ff':color,after?'rail-afterimage':extraBody?'rail-multiplicity':'rail',eliteBonus);});};
    volley();if(n>=3)scheduleWeaponAction(120,()=>volley(.44,true));if(state.weaponAugments?.rail&&!echoed)scheduleWeaponAction(190,()=>{for(const[index,f]of[.34,.58,.82].entries()){const px=x+Math.cos(angle)*length*f,py=y+Math.sin(angle)*length*f;scheduleWeaponAction(index*70,()=>{areaDamage(px,py,38+n*3,11+n*3.1,'#b7e7ff','rail-fracture');shockwave(px,py,'#eaf8ff',52+n*4,.24,1.8);});}});trimOldest(state.entities.beams,entityCap('beams'));
  };

  const previousDamageReduction=damageReduction;
  damageReduction=function communityBulwarkReduction(){const base=previousDamageReduction(),n=weaponStacks('bulwark');return clamp(base+n*.008+(n>=5?.015:0),0,.78);};

  const rawEmergencyRendering=window.stackfallEmergencyRendering,rawGpuEmergencyAvailable=window.stackfallGpuEmergencyAvailable;
  function criticalVisualCombat(){return state.mode==='playing'&&(state.mapEventActive||state.apexActiveId||state.entities.enemies.some(e=>e&&!e.dead&&e.type==='boss'));}
  if(typeof rawEmergencyRendering==='function')window.stackfallEmergencyRendering=()=>criticalVisualCombat()?false:rawEmergencyRendering();
  if(typeof rawGpuEmergencyAvailable==='function')window.stackfallGpuEmergencyAvailable=()=>criticalVisualCombat()?false:rawGpuEmergencyAvailable();
  const previousUpdatePlayer=updatePlayer;
  updatePlayer=function communityFeedbackPlayer(dt){
    previousUpdatePlayer(dt);
    const emergency=typeof rawEmergencyRendering==='function'&&rawEmergencyRendering(),critical=criticalVisualCombat();if(critical&&emergency&&!forcedCriticalResolution){criticalResolutionPreviousScale=Number(window.stackfallResolutionScale)||1;forcedCriticalResolution=true;window.stackfallResolutionScale=.55;resize();}else if(forcedCriticalResolution&&(!critical||!emergency)){const restoreScale=emergency?criticalResolutionPreviousScale:1;forcedCriticalResolution=false;criticalResolutionPreviousScale=1;window.stackfallResolutionScale=restoreScale;resize();}
  };

  const previousEnemyProjectileRenderer=drawEnemyProjectiles;
  drawEnemyProjectiles=function distinctHostileProjectiles(){
    const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;if(tier===2&&!criticalVisualCombat())return previousEnemyProjectileRenderer();const list=state.entities.enemyProjectiles||[],crowded=list.length>100;for(const p of list){if(!p||p.life<=0)continue;const s=worldToScreen(p.x,p.y);if(s.x<-52||s.x>vw+52||s.y<-52||s.y>vh+52)continue;ctx.save();ctx.translate(Math.round(s.x),Math.round(s.y));ctx.rotate(Math.atan2(p.vy||0,p.vx||0));ctx.shadowBlur=tier===0&&!crowded?7:0;ctx.shadowColor=p.color||'#ff6ccf';drawEnemyProjectileShape(p,p.visual||'orb',tier);ctx.restore();}
  };

  const starlightForeground=document.querySelector('#combatForeground');
  function drawStarlightProjectiles(){
    const fg=starlightForeground;if(GAME_SETTINGS.hideProjectiles===true||!fg||fg.style.visibility==='hidden'||state.mode==='menu')return;const g=fg.getContext('2d',{alpha:true});if(!g)return;g.save();g.setTransform(dpr,0,0,dpr,0,0);g.globalCompositeOperation='lighter';for(const p of state.entities.projectiles||[]){const source=String(p?.source||'');if(!p||p.life<=0||!['ember','echo-star','ember-multiplicity'].includes(source))continue;const s=worldToScreen(p.x,p.y);if(s.x<-48||s.x>vw+48||s.y<-48||s.y>vh+48)continue;const speed=Math.hypot(p.vx||0,p.vy||0)||1,nx=(p.vx||0)/speed,ny=(p.vy||0)/speed,r=Math.max(3,Math.min(10,p.r||5)),tail=18+r*2.3,color=source==='echo-star'?COLORS.pink:'#ff789b';const grad=g.createLinearGradient(s.x-nx*tail,s.y-ny*tail,s.x+nx*r,s.y+ny*r);grad.addColorStop(0,'rgba(255,120,155,0)');grad.addColorStop(.55,color);grad.addColorStop(1,'#fff7fb');g.strokeStyle=grad;g.lineWidth=Math.max(2,r*.75);g.lineCap='round';g.beginPath();g.moveTo(s.x-nx*tail,s.y-ny*tail);g.lineTo(s.x+nx*r*.7,s.y+ny*r*.7);g.stroke();const px=-ny,py=nx;g.fillStyle='#fff7fb';g.beginPath();g.moveTo(s.x+nx*r*1.7,s.y+ny*r*1.7);g.lineTo(s.x-nx*r*.65+px*r*.55,s.y-ny*r*.65+py*r*.55);g.lineTo(s.x-nx*r*.85,s.y-ny*r*.85);g.lineTo(s.x-nx*r*.65-px*r*.55,s.y-ny*r*.65-py*r*.55);g.closePath();g.fill();}g.restore();
  }
  const previousForegroundCombat=window.drawForegroundCombat;
  if(starlightForeground&&typeof previousForegroundCombat==='function')window.drawForegroundCombat=function communityForegroundCombat(){previousForegroundCombat();drawStarlightProjectiles();};

  const previousDrawEquippedOrbits=drawEquippedOrbits;
  drawEquippedOrbits=function prismAttackStartOrbitFlash(x,y,t){
    previousDrawEquippedOrbits(x,y,t);
    const lock=player.prismSharedLock,flash=Math.max(0,Number(lock?.attackFlash)||0),n=weaponCount('prism');if(!n||flash<=0)return;
    const visible=Math.floor(flash/.045)%2===0;if(!visible)return;const size=weaponSizeMultiplier();
    for(const point of prismPositions(prismBodyCount(n))){const s=worldToScreen(point.x,point.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-point.a+t*.00057);ctx.scale(size*1.18,size*1.18);ctx.globalAlpha=clamp(flash/.22,.2,1);ctx.fillStyle='#fffaff';ctx.shadowBlur=28;ctx.shadowColor='#f2e5ff';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.restore();}
  };

  const oldAudit=window.stackfallBalanceAudit;
  window.stackfallBalanceAudit=()=>({...oldAudit?.(),prism:{...(oldAudit?.().prism||{}),windup:PRISM_ACQUISITION_SECONDS,ricochetPerTick:state.weaponAugments?.prism===true},communityFeedback:{railBossPriority:true,criticalVisualPreservation:true,hostileProjectileShapes:true,bulwarkLowStackRecharge:true,prismContinuousAim:true,prismAttackStartFlash:true}});
})();
