const CORE_PULSE_COOLDOWN=.76,CORE_PULSE_SPEED=520,CORE_PULSE_RADIUS=4.8;
function corePulseDamage(stacks){return 11+Math.max(1,stacks)*2.5;}
function bulwarkRechargeProfile(stacks){
  const n=Math.max(0,Math.min(6,Math.floor(Number(stacks)||0)));if(!n)return null;
  if(n===1)return{interval:7.4,cap:20,gain:5};
  if(n===2)return{interval:6.8,cap:28,gain:7};
  if(n===3)return{interval:6.6,cap:36,gain:8};
  if(n===4)return{interval:6.4,cap:42,gain:9};
  if(n===5)return{interval:6.2,cap:50,gain:11};
  return{interval:5.8,cap:60,gain:12};
}
function mirrorShieldProfile(stacks){const n=Math.max(0,Math.min(6,Math.floor(Number(stacks)||0)));return n>=5?{cap:36+n*6,gain:4+n*1.5}:null;}
function bulwarkAugmentShieldProfile(stacks){const n=Math.max(1,Math.min(6,Math.floor(Number(stacks)||1)));return{cap:Math.max(62+n*7,58+n*8),interval:Math.max(4.6,7.8-n*.42),periodicGain:4+n*1.35,hitGain:5+n*1.5};}
function mirrorAugmentShieldProfile(stacks){const n=Math.max(1,Math.min(6,Math.floor(Number(stacks)||1)));return{cap:52+n*8,gain:1.8+n*.35};}
registerShieldCapacitySource('weapon-bulwark',()=>bulwarkRechargeProfile(weaponCount('bulwark'))?.cap||0);
registerShieldCapacitySource('weapon-mirror',()=>mirrorShieldProfile(weaponCount('mirror'))?.cap||0);
function spawnCoreShot(target,echoed=false){
  if(!target)return;const a=Math.atan2(target.y-player.y,target.x-player.x),range=weaponRange('core');
  spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*CORE_PULSE_SPEED,vy:Math.sin(a)*CORE_PULSE_SPEED,r:CORE_PULSE_RADIUS,life:1.3,maxRange:range,damage:corePulseDamage(weaponCount('core'))*(echoed?.72:1),color:echoed?COLORS.pink:'#d7f8ff',pierce:weaponCount('core')>=4?1:0,source:echoed?'core-echo':'core'});
}
function fireEmber(target,emberN,echoed=false){
  if(!target)return;player.emberVolley=(player.emberVolley||0)+1;const base=Math.atan2(target.y-player.y,target.x-player.x),shots=emberN>=5?3:emberN>=2?2:1,superShot=emberN>=6&&player.emberVolley%7===0,range=weaponRange('ember');
  for(let i=0;i<shots;i++){const a=base+(i-(shots-1)/2)*(shots===3?.18:.15)+rand(-.012,.012);spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*(superShot?620:525),vy:Math.sin(a)*(superShot?620:525),r:superShot?12:5.7,life:1.45,maxRange:range,damage:(12+emberN*3.4)*(echoed?.68:1)*(superShot?1.9:1),color:echoed?COLORS.pink:'#ff789b',pierce:superShot?6:emberN>=3?1:0,source:echoed?'echo-star':'ember',split:emberN>=4});}
}
function fireComet(target,cometN,echoed=false){
  if(!target)return;const base=Math.atan2(target.y-player.y,target.x-player.x),shots=cometN>=2?2:1,range=weaponRange('comet');
  for(let i=0;i<shots;i++){const a=base+(i-(shots-1)/2)*.105;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*(625+cometN*7),vy:Math.sin(a)*(625+cometN*7),r:9+cometN,life:1.9,maxRange:range,damage:(24+cometN*6)*(echoed?.64:1),color:echoed?COLORS.pink:COLORS.comet,pierce:2+Math.floor(cometN/2)+(cometN>=3?1:0),source:echoed?'echo-comet':'comet',fragment:cometN>=4,trailDamage:cometN>=5,explode:cometN>=6,trailDamageCd:0});}
}
function fireBoomerang(target,stacks,echoed=false,origin=null,ricochet=false){
  target=target&&!target.dead&&Math.hypot(target.x-player.x,target.y-player.y)<=weaponRange('arc')?target:nearestWeaponTarget('arc');if(!target)return;
  const shots=ricochet?1:stacks>=6?3:stacks>=2?2:1,start=origin&&Number.isFinite(origin.x)&&Number.isFinite(origin.y)?{x:origin.x,y:origin.y}:{x:player.x,y:player.y},base=Math.atan2(target.y-start.y,target.x-start.x),distance=Math.hypot(target.x-start.x,target.y-start.y),normal={x:-Math.sin(base),y:Math.cos(base)},size=weaponSizeMultiplier();player.arcSide=(player.arcSide||-1)*-1;
  for(let i=0;i<shots;i++){const spread=i-(shots-1)/2,side=shots===1?player.arcSide:(spread===0?player.arcSide:Math.sign(spread)),lateral=spread*(28+stacks*3),targetPoint={x:target.x+normal.x*lateral,y:target.y+normal.y*lateral},mid={x:(start.x+targetPoint.x)/2,y:(start.y+targetPoint.y)/2},curve=(38+Math.min(70,distance*.09)+(stacks>=3?24:0))*side,control={x:mid.x+normal.x*curve,y:mid.y+normal.y*curve},history=Array.from({length:14},()=>({x:start.x,y:start.y}));state.entities.curves.push({stage:'outbound',stageTime:0,stageDuration:clamp(distance/(650+stacks*24),.30,.78),start:{...start},control,targetPoint,targetId:target.id,lateral,side,x:start.x,y:start.y,lastX:start.x,lastY:start.y,hitIds:new Set(),r:(9.5+stacks*.95+(stacks>=3?1.5:0))*size,damage:(14+stacks*4.1)*(echoed?.66:1)*(ricochet?.72:1),returnDamageMult:stacks>=4?1.38:1,color:echoed?COLORS.pink:'#69ffe0',trailDamage:stacks>=5,trailCd:0,history,historyStart:0,historyCount:0,stacks,dead:false,returnLife:0,ricochet:!!ricochet});}
  trimOldest(state.entities.curves,28);
}
function prismPositions(count){const points=[],orbit=orbitRadiusFor('prism');for(let i=0;i<count;i++){const a=player.angle*.52+i*TAU/count;points.push({x:player.x+Math.cos(a)*orbit,y:player.y+Math.sin(a)*orbit,a});}return points;}
function meteorDronePositions(stacks){const count=stacks>=6?3:stacks>=2?2:1,orbit=orbitRadiusFor('drone'),points=[];for(let i=0;i<count;i++){const a=player.angle*.68+i*TAU/count;points.push({x:player.x+Math.cos(a)*orbit,y:player.y+Math.sin(a)*orbit,a});}return points;}
function nearestEnemies(x,y,count,excluded=null,maxRange=Infinity){if(typeof performanceNearestEnemies==='function')return performanceNearestEnemies(x,y,count,excluded,maxRange);const limit=Number.isFinite(maxRange)?maxRange*maxRange:Infinity,out=[];for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||excluded?.has(enemy.id))continue;const distance=(enemy.x-x)**2+(enemy.y-y)**2;if(distance>limit)continue;let index=out.length;while(index>0&&out[index-1].distance>distance)index--;out.splice(index,0,{enemy,distance});if(out.length>count)out.pop();}return out.map(entry=>entry.enemy);}
function segmentDistance(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy||1,t=clamp(((px-x1)*dx+(py-y1)*dy)/len,0,1);return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));}
function enemyById(id){if(typeof getEnemyById==='function')return getEnemyById(id);for(const enemy of state.entities.enemies)if(enemy?.id===id&&!enemy.dead)return enemy;return null;}
function prismStage(heat,prismN){const first=prismN>=4?.68:.88,second=prismN>=6?1.55:prismN>=4?1.78:2.18;return heat>=second?2:heat>=first?1:0;}
function prismMultiplier(stage,prismN){return stage===2?(prismN>=6?3.65:prismN>=5?3.45:3.25):stage===1?1.65:1;}
function updateFocusedPrisms(dt,prismN){
  const count=prismN>=6?3:prismN>=2?2:1,positions=prismPositions(count),range=weaponRange('prism'),locks=player.prismLocks||(player.prismLocks=[]),used=new Set(),size=weaponSizeMultiplier(),stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();locks.length=count;
  for(let i=0;i<count;i++){
    const pos=positions[i],lock=locks[i]||(locks[i]={targetId:null,heat:0,tick:0,visual:0,augmentCd:0}),current=enemyById(lock.targetId),valid=current&&Math.hypot(current.x-pos.x,current.y-pos.y)<=range;
    let target=valid?current:nearestEnemy(pos.x,pos.y,range,e=>!used.has(e.id));if(!target)target=nearestEnemy(pos.x,pos.y,range);
    if(!target){lock.targetId=null;lock.heat=Math.max(0,lock.heat-dt*2.5);continue;}
    if(lock.targetId===target.id)lock.heat=Math.min(3.2,lock.heat+dt);else{lock.targetId=target.id;lock.heat=0;lock.tick=0;}
    used.add(target.id);lock.tick-=dt;lock.visual-=dt;lock.augmentCd-=dt;const stage=prismStage(lock.heat,prismN),mult=prismMultiplier(stage,prismN),color=stage===2?'#fff1a8':stage===1?'#ff9c72':'#c8b3ff',width=(2.7+stage*2.1+prismN*.16)*size;
    if(lock.tick<=0){lock.tick=.18;dealDamage(target,(2.6+prismN*.86)*mult,{color,source:'prism-focus'});}
    if(lock.visual<=0){lock.visual=stressed?.11:.075;state.entities.beams.push({x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,life:stressed?.13:.11,max:stressed?.13:.11,color,width});}
    if(state.weaponAugments?.prism&&stage===2&&lock.augmentCd<=0){lock.augmentCd=1.15;const base=Math.atan2(target.y-pos.y,target.x-pos.x),len=150+prismN*8;for(const offset of[-Math.PI/4,Math.PI/4]){const a=base+offset,x1=target.x-Math.cos(a)*len,y1=target.y-Math.sin(a)*len,x2=target.x+Math.cos(a)*len,y2=target.y+Math.sin(a)*len;state.entities.beams.push({x1,y1,x2,y2,life:.20,max:.20,color:'#fff6d7',width:3.1*size});forEachNearbyEnemyCandidate(target.x,target.y,len+80,e=>{if(!e.dead&&segmentDistance(e.x,e.y,x1,y1,x2,y2)<e.r+7*size)dealDamage(e,10+prismN*2.5,{color:'#fff4dc',source:'prism-overheat-line',canCrit:false});});}areaDamage(target.x,target.y,58*size,8+prismN*1.8,'#ffba72','prism-overheat');}
  }
  trimOldest(state.entities.beams,entityCap('beams'));
}
function firePrism(prismN,echoed=false){const positions=prismPositions(prismN>=6?3:prismN>=2?2:1),range=weaponRange('prism'),size=weaponSizeMultiplier();for(const pos of positions){const target=nearestEnemy(pos.x,pos.y,range);if(!target)continue;dealDamage(target,(7+prismN*2.4)*(echoed?.62:1),{color:echoed?COLORS.pink:'#f2d5ff',source:'prism-echo'});state.entities.beams.push({x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,life:.16,max:.16,color:echoed?COLORS.pink:'#f2d5ff',width:(3.2+prismN*.18)*size});}trimOldest(state.entities.beams,entityCap('beams'));}
function createGravityWells(gravN,echoed=false){const count=gravN>=6?2:1,range=weaponRange('gravity'),target=nearestWeaponTarget('gravity'),aim=target?Math.atan2(target.y-player.y,target.x-player.x):player.angle;for(let i=0;i<count;i++){const a=aim+(i-(count-1)/2)*.58+(echoed?.24:0),d=Math.min(range*.72,count===2?185:145),duration=(gravN>=3?3.55:2.7)+(gravN>=4?.55:0);state.entities.wells.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:gravN>=2?185:135,life:duration,max:duration,strength:(gravN>=2?430:280)+(gravN>=5?120:0),damage:gravN>=4?(6+gravN*1.55+(gravN>=5?4:0))*(echoed?.55:1):0,tick:0,color:echoed?COLORS.pink:COLORS.violet});}}
function nearestUnhitEnemy(x,y,hit,maxRange=Infinity){return nearestEnemy(x,y,maxRange,e=>!hit.has(e.id));}
function castIonPath(first,ionN,echoed,sharedHit,maxLinks){if(!first)return null;const color=echoed?COLORS.pink:'#72f2ff',range=190+ionN*26,beamWidth=(2.4+ionN*.18)*weaponSizeMultiplier();let from={x:player.x,y:player.y},target=first,last=null,damage=(11+ionN*3.35)*(echoed?.62:1);for(let i=0;i<maxLinks&&target;i++){sharedHit.add(target.id);dealDamage(target,damage*Math.pow(.82,i),{color,source:'ion-chain'});state.entities.beams.push({x1:from.x,y1:from.y,x2:target.x,y2:target.y,life:.18,max:.18,color,width:beamWidth+(i===0?1.1:0)});last=target;from={x:target.x,y:target.y};target=nearestUnhitEnemy(from.x,from.y,sharedHit,range);}return last;}
function fireIonChain(ionN,echoed=false){const cast=()=>{const first=nearestWeaponTarget('ion');if(!first)return;const hit=new Set(),links=2+(ionN>=2?1:0)+(ionN>=5?1:0),last=castIonPath(first,ionN,echoed,hit,links);if(ionN>=4){const branch=nearestUnhitEnemy(player.x,player.y,hit,weaponRange('ion'));castIonPath(branch,ionN,echoed,hit,Math.max(2,links-1));}if(ionN>=5&&last)areaDamage(last.x,last.y,50*weaponSizeMultiplier(),(8+ionN*2.1)*(echoed?.60:1),echoed?COLORS.pink:'#72f2ff',echoed?'echo-ion':'ion-burst');trimOldest(state.entities.beams,entityCap('beams'));};cast();if(ionN>=6&&!echoed)scheduleWeaponAction(105,cast);}
function pushFromPlayer(radius,force){const r2=radius*radius;for(const e of state.entities.enemies){if(e.dead)continue;const dx=e.x-player.x,dy=e.y-player.y,d2=dx*dx+dy*dy;if(d2>r2)continue;const d=Math.sqrt(d2)||1,k=force*enemyControlFactor(e);e.x+=dx/d*k;e.y+=dy/d*k;}}
function fireNovaPulse(novaN,echoed=false){const size=weaponSizeMultiplier(),color=echoed?COLORS.pink:'#ffbd69',radius=(145+(novaN>=2?38:0)+(novaN>=5?18:0))*size,damage=(17+novaN*4.4)*(echoed?.62:1),source=echoed?'echo-nova':'nova-pulse';areaDamage(player.x,player.y,radius,damage,color,source,{shake:false});shockwave(player.x,player.y,color,radius*.76,.34,2.4);if(novaN>=4)pushFromPlayer(radius,30+novaN*3);if(novaN>=3)scheduleWeaponAction(150,()=>areaDamage(player.x,player.y,radius*.72,damage*.42,color,source,{shake:false}));if(novaN>=6&&!echoed)scheduleWeaponAction(300,()=>{areaDamage(player.x,player.y,radius*1.16,damage*.68,'#fff0b5',source,{shake:false});shockwave(player.x,player.y,color,radius*1.22,.42,3.2);});}
function fireMeteorDrones(droneN,echoed=false){if(!echoed)player.droneVolley=(player.droneVolley||0)+1;const positions=meteorDronePositions(droneN),targets=nearestEnemies(player.x,player.y,positions.length*2,null,weaponRange('drone')),paired=droneN>=4,baseColor=echoed?COLORS.pink:'#8fffd0';positions.forEach((pos,index)=>{const target=targets[index%Math.max(1,targets.length)]||nearestEnemy(pos.x,pos.y,weaponRange('drone'));if(!target)return;const base=Math.atan2(target.y-pos.y,target.x-pos.x),shots=paired?2:1;for(let shot=0;shot<shots;shot++){const a=base+(shot-(shots-1)/2)*.11;spawnPlayerProjectile({x:pos.x,y:pos.y,vx:Math.cos(a)*(540+droneN*14),vy:Math.sin(a)*(540+droneN*14),r:4.9+droneN*.24,life:1.35,maxRange:weaponRange('drone'),damage:(12+droneN*3.6)*(echoed?.68:1)*(paired?.78:1),color:baseColor,pierce:droneN>=3?1:0,source:echoed?'echo-drone':'meteor-drone'});}});if(droneN>=6&&!echoed&&player.droneVolley%5===0)for(let i=0;i<8;i++){const a=i*TAU/8;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*455,vy:Math.sin(a)*455,r:4.6,life:1.1,maxRange:380,damage:15+droneN*2.8,color:'#d8fff1',pierce:2,source:'drone-burst'});}}
function applyRailBeam(x1,y1,x2,y2,width,damage,color,source,eliteBonus=1){state.entities.beams.push({x1,y1,x2,y2,life:.20,max:.20,color,width});for(const enemy of state.entities.enemies){if(enemy.dead)continue;if(segmentDistance(enemy.x,enemy.y,x1,y1,x2,y2)<enemy.r+width*.72){const elite=enemy.type==='boss'||enemy.type==='mini';dealDamage(enemy,damage*(elite?eliteBonus:1),{color,source});}}}
function fireRailgun(railN,echoed=false){const target=nearestWeaponTarget('rail');if(!target)return;const color=echoed?COLORS.pink:'#b7e7ff',base=Math.atan2(target.y-player.y,target.x-player.x),size=weaponSizeMultiplier(),length=weaponRange('rail'),offsets=railN>=4?[-14,14]:[0],damage=(40+railN*9.4)*(echoed?.60:1),width=(5.2+railN*.72)*size,eliteBonus=railN>=5?1.32:1,volley=(mult=1,after=false)=>{for(const offset of offsets){const nx=-Math.sin(base),ny=Math.cos(base),x1=player.x+nx*offset,y1=player.y+ny*offset,x2=x1+Math.cos(base)*length,y2=y1+Math.sin(base)*length;applyRailBeam(x1,y1,x2,y2,width*(after?.72:1),damage*mult,after?'#eaf8ff':color,after?'rail-afterimage':'rail',eliteBonus);}};volley();if(railN>=3)scheduleWeaponAction(120,()=>volley(.44,true));if(railN>=6&&!echoed)scheduleWeaponAction(70,()=>{const a=base+Math.PI/2,half=Math.min(420,length*.46),x1=target.x-Math.cos(a)*half,y1=target.y-Math.sin(a)*half,x2=target.x+Math.cos(a)*half,y2=target.y+Math.sin(a)*half;applyRailBeam(x1,y1,x2,y2,width*.82,damage*.72,'#ffffff','rail-cross',eliteBonus);});trimOldest(state.entities.beams,entityCap('beams'));}
function fireGalacticSpiral(spiralN,echoed=false){player.spiralPhase=(player.spiralPhase||0)+.73;const phase=player.spiralPhase,arms=spiralN>=6?4:spiralN>=4?3:spiralN>=2?2:1,beads=spiralN>=5?5:4,color=echoed?COLORS.pink:'#e3a7ff';for(let step=0;step<beads;step++)scheduleWeaponAction(step*58,()=>{for(let arm=0;arm<arms;arm++){const a=phase+arm*TAU/arms+step*.31*(arm%2?-1:1),speed=300+spiralN*18+step*16,target=spiralN>=3?nearestWeaponTarget('spiral'):null;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:4.2+spiralN*.25,life:1.55,maxRange:weaponRange('spiral'),damage:(7+spiralN*2.05)*(echoed?.62:1),color,pierce:spiralN>=5?1:0,source:echoed?'echo-spiral':'spiral-bolt',homingTargetId:target?.id,homingReacquire:spiralN>=3,homingTurn:spiralN>=3?1.35:0});}});}
function fireReflector(mirrorN,echoed=false){
  const size=weaponSizeMultiplier(),radius=Math.min(weaponRange('mirror'),(210+mirrorN*24)*size),radiusSq=radius*radius,color=echoed?COLORS.pink:'#9fffe7',limit=mirrorN>=6?14:2+mirrorN,chosen=[],distances=[];
  for(const shot of state.entities.enemyProjectiles){
    if(!shot||shot.life<=0)continue;
    const distance=(shot.x-player.x)**2+(shot.y-player.y)**2;
    if(distance>=radiusSq||(chosen.length===limit&&distance>=distances[limit-1]))continue;
    let index=distances.length;
    while(index>0&&distances[index-1]>distance)index--;
    chosen.splice(index,0,shot);distances.splice(index,0,distance);
    if(chosen.length>limit){chosen.pop();distances.pop();}
  }
  for(const shot of chosen){shot.life=0;const target=nearestEnemy(shot.x,shot.y,weaponRange('mirror')),a=target?Math.atan2(target.y-shot.y,target.x-shot.x):Math.atan2(shot.y-player.y,shot.x-player.x);spawnPlayerProjectile({x:shot.x,y:shot.y,vx:Math.cos(a)*(470+mirrorN*16),vy:Math.sin(a)*(470+mirrorN*16),r:Math.max(4,shot.r*.82),life:1.15,maxRange:weaponRange('mirror'),damage:(10+mirrorN*2.8)*(echoed?.60:1),color,pierce:mirrorN>=3?1:0,source:echoed?'echo-reflect':'mirror-return'});}
  if(!chosen.length||mirrorN>=4){const targets=nearestEnemies(player.x,player.y,mirrorN>=6?6:3,null,weaponRange('mirror'));for(const target of targets){const a=Math.atan2(target.y-player.y,target.x-player.x);spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*510,vy:Math.sin(a)*510,r:4.7,life:1.0,maxRange:weaponRange('mirror'),damage:(8+mirrorN*2.3)*(echoed?.60:1),color,pierce:mirrorN>=3?1:0,source:'mirror-counter'});}}
  const mirrorShield=mirrorShieldProfile(mirrorN);if(mirrorShield)rechargeShield(mirrorShield.gain,mirrorShield.cap);if(mirrorN>=6&&!echoed){areaDamage(player.x,player.y,radius*.46,13+mirrorN*3.2,color,'mirror-burst');shockwave(player.x,player.y,color,radius,.42,3.2);}else shockwave(player.x,player.y,color,radius,.28,2);
}

for(const key of['vacuumSeeds','phaseMines','guidedMissiles','gateNetworks'])if(!Array.isArray(state.entities[key]))state.entities[key]=[];
const postRosterMultiplicity=()=>Math.min(2,Math.max(0,Number(window.stackfallMultiplicityStacks?.())||0));
function strongestPostRosterEnemy(x=player.x,y=player.y,range=Infinity){
  let best=null,bestScore=-Infinity,rr=Number.isFinite(range)?range*range:Infinity;
  for(const enemy of state.entities.enemies){if(!enemy||enemy.dead)continue;const d2=(enemy.x-x)**2+(enemy.y-y)**2;if(d2>rr)continue;const elite=enemy.type==='boss'?2:enemy.type==='mini'?1:0,score=elite*1e9+(enemy.hp||0)-Math.sqrt(d2)*.08;if(score>bestScore){bestScore=score;best=enemy;}}
  return best;
}
function plantVacuumSeed(x,y,n,projected=false,index=0){
  const mult=postRosterMultiplicity(),baseCap=n>=5?5:n>=2?4:3,cap=baseCap+mult*2,seeds=state.entities.vacuumSeeds;
  let liveSeeds=0;for(const seed of seeds)if(seed&&seed.life>0)liveSeeds++;
  while(liveSeeds>=cap){let oldest=null;for(const seed of seeds){if(seed&&seed.life>0&&!seed.blooming){oldest=seed;break;}}if(!oldest)break;oldest.life=0;liveSeeds--;}
  const angle=index*TAU/Math.max(1,1+mult),offset=projected?24+index*8:0;
  seeds.push({id:state.nextId++,x:x+Math.cos(angle)*offset,y:y+Math.sin(angle)*offset,life:7,max:7,charge:0,n,projected,blooming:false,bloomTimer:0,power:1,forced:false,absorbed:0,overburst:false});
  trimOldest(seeds,10);
}
function beginVacuumBloom(seed,power=1,forced=false){
  if(!seed||seed.blooming)return;if(seed.life<=0)seed.life=.31;seed.blooming=true;seed.bloomTimer=.30;seed.power=power;seed.forced=forced;seed.absorbed=0;
  if(state.weaponAugments?.vacuum){
    const radius=(seed.n>=2?180:165)*weaponSizeMultiplier();
    for(const shot of state.entities.enemyProjectiles){if(seed.absorbed>=8)break;if(!shot||shot.life<=0||shot.noErase||shot.unerasable)continue;if((shot.x-seed.x)**2+(shot.y-seed.y)**2>radius*radius)continue;shot.life=0;seed.absorbed++;}
  }
}
function detonateVacuumSeed(seed){
  if(!seed||seed.life<=0)return;const n=seed.n,size=weaponSizeMultiplier(),baseRadius=(n>=2?180:165)*size,radius=baseRadius*(1+seed.absorbed*.025),baseDamage=38*(1+(n-1)*.10)*(n>=3?1.22:1),damage=baseDamage*(seed.power||1)*(1+seed.absorbed*.06);
  areaDamage(seed.x,seed.y,radius,damage,'#d58cff','vacuum-bloom',{shake:false});shockwave(seed.x,seed.y,'#f2c8ff',radius*.90,.46,3.3);
  const overcharged=seed.charge>=5&&!seed.forced;
  if(n>=4&&!seed.forced){
    for(const other of state.entities.vacuumSeeds){if(!other||other===seed||other.life<=0||other.blooming||Math.hypot(other.x-seed.x,other.y-seed.y)>270)continue;other.charge=Math.min(5,other.charge+2);other.life=Math.min(other.max+1.2,other.life+1.2);if(other.charge>=3)beginVacuumBloom(other,1,false);}
  }
  if(n>=5&&overcharged&&!seed.overburst){seed.overburst=true;scheduleWeaponAction(320,()=>{areaDamage(seed.x,seed.y,radius*.78,damage*.45,'#f5ddff','vacuum-overbloom',{shake:false});shockwave(seed.x,seed.y,'#d58cff',radius*.84,.32,2.5);});}
  if(n>=6&&overcharged&&!seed.forced){
    let nearestA=null,nearestB=null,bestA=Infinity,bestB=Infinity;const limit2=330*330;
    for(const other of state.entities.vacuumSeeds){if(!other||other===seed||other.life<=0||other.blooming)continue;const dx=other.x-seed.x,dy=other.y-seed.y,d2=dx*dx+dy*dy;if(d2>limit2)continue;if(d2<bestA){nearestB=nearestA;bestB=bestA;nearestA=other;bestA=d2;}else if(d2<bestB){nearestB=other;bestB=d2;}}
    if(nearestA)scheduleWeaponAction(100,()=>beginVacuumBloom(nearestA,.70,true));
    if(nearestB)scheduleWeaponAction(240,()=>beginVacuumBloom(nearestB,.70,true));
  }
  seed.life=0;
}
function updateVacuumSeeds(dt,n){
  const seeds=state.entities.vacuumSeeds;
  for(const seed of seeds){
    if(!seed||seed.life<=0)continue;seed.life-=dt;
    if(seed.blooming){
      seed.bloomTimer-=dt;const radius=(seed.n>=2?180:165)*weaponSizeMultiplier(),pull=(seed.n>=3?340:270)*(seed.n>=2?1.22:1);
      forEachNearbyEnemyCandidate(seed.x,seed.y,radius+90,enemy=>{if(enemy.dead)return;const dx=seed.x-enemy.x,dy=seed.y-enemy.y,d=Math.hypot(dx,dy)||1;if(d>radius)return;const k=pull*(1-d/radius)*enemyControlFactor(enemy)*dt;enemy.x+=dx/d*k;enemy.y+=dy/d*k;});
      if(seed.bloomTimer<=0)detonateVacuumSeed(seed);
    }else if(seed.life<=0)beginVacuumBloom(seed,.65,true);
  }
  compactInPlace(seeds,seed=>seed&&seed.life>0);
}
window.stackfallPostRosterOnKill=function postRosterKill(enemy){
  const n=weaponCount('vacuum');if(!n||!enemy)return;
  const seeds=state.entities.vacuumSeeds,feed=n>=3&&(enemy.type==='boss'||enemy.type==='mini')?2:1,range=(n>=2?180:165)*weaponSizeMultiplier(),range2=range*range;let nearest=null,best=Infinity;
  for(const seed of seeds){if(!seed||seed.life<=0||seed.blooming)continue;const dx=seed.x-enemy.x,dy=seed.y-enemy.y,d2=dx*dx+dy*dy;if(d2<=range2&&d2<best){best=d2;nearest=seed;}}
  if(nearest){nearest.charge=Math.min(5,nearest.charge+feed);if(nearest.charge>=3)beginVacuumBloom(nearest,1,false);}
  player.vacuumKillCounter=(player.vacuumKillCounter||0)+1;const threshold=n>=5?4:n>=2?5:6;
  if(player.vacuumKillCounter>=threshold){player.vacuumKillCounter-=threshold;const count=1+postRosterMultiplicity();for(let i=0;i<count;i++)plantVacuumSeed(enemy.x,enemy.y,n,i>0,i);}
};
function placePhaseMine(x,y,n,opts={}){
  const mines=state.entities.phaseMines,phantom=!!opts.phantom,size=weaponSizeMultiplier(),mine={id:state.nextId++,x,y,n,arm:phantom?.08:.35,life:phantom?2.4:(n>=5?10.5:9),max:phantom?2.4:(n>=5?10.5:9),damage:(26+(n-1)*3.2)*(phantom?.58:1)*(opts.damageScale||1),radius:(74+(n>=2?8:0))*size,trigger:48*size,phantom,group:opts.group||null,satellite:!!opts.satellite,fromChain:!!opts.fromChain,triangleSequence:!!opts.triangleSequence,detonateIn:null,chainUsed:false,linkHits:new Map()};
  mines.push(mine);const cap=(n>=5?11:n>=2?8:6)+postRosterMultiplicity()*2+4;let liveMines=0;for(const candidate of mines)if(candidate&&candidate.life>0)liveMines++;while(liveMines>cap){let old=null;for(const candidate of mines){if(candidate&&candidate.life>0&&!candidate.phantom){old=candidate;break;}}if(!old)break;old.life=0;liveMines--;}trimOldest(mines,20);return mine;
}
function detonatePhaseMine(mine,scale=1){
  if(!mine||mine.life<=0)return;const n=mine.n,damage=mine.damage*scale;
  areaDamage(mine.x,mine.y,mine.radius,damage,mine.phantom?'#c6f7ff':'#74e8ff',mine.phantom?'phantom-mine':'phase-mine',{shake:false});shockwave(mine.x,mine.y,mine.phantom?'#dffcff':'#74e8ff',mine.radius*.88,.28,2.4);
  if(n>=3&&!mine.chainUsed&&!mine.phantom){
    mine.chainUsed=true;const range=n>=5?230:190;let best=null,bd=Infinity;for(const other of state.entities.phaseMines){if(!other||other===mine||other.life<=0||other.arm>0||other.detonateIn!==null)continue;const d=Math.hypot(other.x-mine.x,other.y-mine.y);if(d<=range&&d<bd){bd=d;best=other;}}if(best){best.detonateIn=.12;best.pendingScale=.65;best.fromChain=true;}
  }
  if(mine.group&&!mine.triangleSequence){
    let siblingIndex=0;for(const other of state.entities.phaseMines){if(!other||other===mine||other.life<=0||other.group!==mine.group)continue;if(other.detonateIn===null){other.detonateIn=.08+siblingIndex*.08;other.pendingScale=.72;other.triangleSequence=true;}siblingIndex++;}
  }
  if(state.weaponAugments?.mine&&!mine.phantom){
    const target=strongestPostRosterEnemy(mine.x,mine.y,weaponRange('mine'));if(target){const lead=.26,px=target.x+(target.vx||0)*lead,py=target.y+(target.vy||0)*lead;placePhaseMine(px,py,n,{phantom:true});}
  }
  mine.life=0;
}
function deployPhaseMinefield(n){
  const x=player.x,y=player.y,dx=x-(player.mineLastX??x),dy=y-(player.mineLastY??y),a=Math.hypot(dx,dy)>2?Math.atan2(dy,dx):(player.facingAngle||0),nx=-Math.sin(a),ny=Math.cos(a),extra=postRosterMultiplicity();player.mineDeployCount=(player.mineDeployCount||0)+1;
  if(n>=6&&player.mineDeployCount%3===0){
    const group='tri-'+state.nextId++,radius=42;for(let i=0;i<3;i++){const ga=a+i*TAU/3;placePhaseMine(x+Math.cos(ga)*radius,y+Math.sin(ga)*radius,n,{group});}
    for(let i=0;i<extra;i++){const side=i%2?1:-1;placePhaseMine(x+nx*side*(68+i*18),y+ny*side*(68+i*18),n,{satellite:true});}
  }else{
    const nativeOffset=n>=2?((player.mineDeployCount%2?1:-1)*30):0;placePhaseMine(x+nx*nativeOffset,y+ny*nativeOffset,n);
    for(let i=0;i<extra;i++){const side=i%2?1:-1,offset=55+Math.floor(i/2)*22;placePhaseMine(x+nx*side*offset,y+ny*side*offset,n,{satellite:true});}
  }
  audio.weapon?.('mine');
}
const PHASE_ARMED_BUFFER=[];
function updatePhaseMinefield(dt,n){
  const x=player.x,y=player.y,dx=x-(player.mineLastX??x),dy=y-(player.mineLastY??y),distance=Math.hypot(dx,dy);player.mineTravel=(player.mineTravel||0)+distance;player.mineLastX=x;player.mineLastY=y;player.minePlaceTimer=(player.minePlaceTimer??1.65)-dt;
  const travelNeed=n>=5?72:90;if(player.mineTravel>=travelNeed||player.minePlaceTimer<=0){player.mineTravel=0;player.minePlaceTimer=1.65*hasteMult();deployPhaseMinefield(n);}
  const mines=state.entities.phaseMines;
  for(const mine of mines){if(!mine||mine.life<=0)continue;mine.life-=dt;mine.arm=Math.max(0,mine.arm-dt);if(mine.detonateIn!==null){mine.detonateIn-=dt;if(mine.detonateIn<=0){detonatePhaseMine(mine,mine.pendingScale||1);continue;}}if(mine.life<=0){if(mine.arm<=0)detonatePhaseMine(mine,.55);continue;}if(mine.arm>0)continue;forEachNearbyEnemyCandidate(mine.x,mine.y,mine.trigger+70,enemy=>{if(mine.life<=0||enemy.dead)return;if((enemy.x-mine.x)**2+(enemy.y-mine.y)**2<(enemy.r+mine.trigger)**2)detonatePhaseMine(mine,1);});}
  if(n>=4){
    const armed=PHASE_ARMED_BUFFER;armed.length=0;for(const mine of mines)if(mine&&mine.life>0&&mine.arm<=0&&!mine.phantom)armed.push(mine);
    for(let i=1;i<armed.length;i++){const a=armed[i-1],b=armed[i];if(Math.hypot(a.x-b.x,a.y-b.y)>210)continue;forEachNearbyEnemyCandidate((a.x+b.x)/2,(a.y+b.y)/2,160,enemy=>{if(enemy.dead||segmentDistance(enemy.x,enemy.y,a.x,a.y,b.x,b.y)>enemy.r+6)return;const now=state.time||0,last=a.linkHits.get(enemy.id)||-99;if(now-last<.35)return;a.linkHits.set(enemy.id,now);dealDamage(enemy,5+n*1.1,{color:'#b9f7ff',source:'phase-wire'});});}
  }
  compactInPlace(mines,m=>m&&m.life>0);
}
function postRosterTargetScore(e,distance){return(e.type==='boss'?2:e.type==='mini'?1:0)*1e9+(e.hp||0)-distance*.08;}
function postRosterTargetList(range,count){
  const out=[],limit=Math.max(1,Math.floor(count)||1),range2=range*range;
  for(const e of state.entities.enemies){if(!e||e.dead)continue;const dx=e.x-player.x,dy=e.y-player.y,d2=dx*dx+dy*dy;if(d2>range2)continue;const score=postRosterTargetScore(e,Math.sqrt(d2));let index=out.length;while(index>0){const prev=out[index-1],pdx=prev.x-player.x,pdy=prev.y-player.y,prevScore=postRosterTargetScore(prev,Math.hypot(pdx,pdy));if(prevScore>=score)break;index--;}out.splice(index,0,e);if(out.length>limit)out.pop();}
  return out;
}
function postRosterMissileSpeed(){return(1+stat('projectileSpeed')*.10)*(1+(state.nebulaExtras?.photon||0)*.12);}
function spawnGuidedMissile(target,n,side,damage,opts={}){
  if(!target)return;const facing=Number.isFinite(player.facingAngle)?player.facingAngle:-Math.PI/2,sideAngle=facing+side*Math.PI/2,forward={x:Math.cos(facing),y:Math.sin(facing)},lateral={x:Math.cos(sideAngle),y:Math.sin(sideAngle)},x=Number.isFinite(opts.x)?opts.x:player.x+lateral.x*30+forward.x*3,y=Number.isFinite(opts.y)?opts.y:player.y+lateral.y*30+forward.y*3,micro=!!opts.micro,ignition=micro?0:.15,speed=(micro?430:185)*postRosterMissileSpeed();
  state.entities.guidedMissiles.push({id:state.nextId++,x,y,vx:lateral.x*speed+forward.x*(micro?120:35),vy:lateral.y*speed+forward.y*(micro?120:35),targetId:target.id,n,side,damage,baseDamage:damage,r:micro?4.0:6.2,life:micro?1.55:4.2,max:micro?1.55:4.2,age:0,ignition,micro,split:micro,terminal:false,reacquired:false,color:micro?'#ffe3b9':'#ffb66e',multiplicity:!!opts.multiplicity});
  trimOldest(state.entities.guidedMissiles,42);
}
function fireInterstellarMissiles(n,echoed=false){
  const native=n>=6?6:n>=2?4:2,extra=echoed?0:postRosterMultiplicity(),total=native+extra,maxTargets=n>=6?3:n>=4?2:1,targets=postRosterTargetList(weaponRange('missile'),maxTargets);if(!targets.length)return;
  const per=(19+(n-1)*2.6)*(native>=6?.64:native>=4?.78:1)*(echoed?.62:1);player.missilePodFlash=.24;audio.weapon?.('missile',echoed,1.1);
  for(let i=0;i<total;i++){const pair=Math.floor(i/2),side=i%2===0?-1:1,target=targets[i%targets.length],delay=(pair*80)+(i>=native?30+i*28:0);scheduleWeaponAction(delay,()=>{const live=enemyById(target.id)||targets.find(t=>!t.dead)||nearestWeaponTarget('missile');if(live)spawnGuidedMissile(live,n,side,per,{multiplicity:i>=native});});}
}
function missileTurn(current,target,maxStep){let diff=(target-current+Math.PI)%(TAU)-Math.PI;if(diff<-Math.PI)diff+=TAU;return current+clamp(diff,-maxStep,maxStep);}
function splitMirvMissile(m,target){
  if(m.split||m.micro||!state.weaponAugments?.missile)return;m.split=true;const candidates=nearestEnemies(m.x,m.y,5,new Set([target?.id]),260),sideTargets=[candidates[0]||target,candidates[1]||target];for(let i=0;i<2;i++){const t=sideTargets[i];if(!t)continue;const a=Math.atan2(t.y-m.y,t.x-m.x)+(i?-.16:.16),speed=410*postRosterMissileSpeed();state.entities.guidedMissiles.push({id:state.nextId++,x:m.x,y:m.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,targetId:t.id,n:m.n,side:i?1:-1,damage:m.baseDamage*.34,baseDamage:m.baseDamage*.34,r:3.7,life:1.5,max:1.5,age:0,ignition:0,micro:true,split:true,terminal:false,reacquired:true,color:'#ffe4bd'});}
}
function explodeGuidedMissile(m,target){
  const size=weaponSizeMultiplier(),radius=(60+(m.n>=3?10:0))*size,terminal=m.terminal&&!m.micro?1.18:1,source=m.micro?'missile-mirv':'missile';areaDamage(m.x,m.y,radius,m.damage*terminal,m.color,source,{shake:false});shockwave(m.x,m.y,'#fff0cf',radius*.85,.28,m.micro?1.7:2.8);spawnParticle(m.x,m.y,m.color,m.micro?4:8,m.micro?90:145,m.micro?2.4:3.4);m.life=0;
}
function updateGuidedMissiles(dt){
  player.missilePodFlash=Math.max(0,(player.missilePodFlash||0)-dt);
  for(const m of state.entities.guidedMissiles){if(!m||m.life<=0)continue;m.life-=dt;m.age+=dt;let target=enemyById(m.targetId);
    if(!target&&m.n>=3&&!m.reacquired){target=strongestPostRosterEnemy(m.x,m.y,weaponRange('missile'));m.reacquired=true;if(target)m.targetId=target.id;}
    if(m.age>=m.ignition&&target){const dx=target.x-m.x,dy=target.y-m.y,d=Math.hypot(dx,dy)||1,powered=Math.max(0,m.age-m.ignition);if(!m.micro&&powered>=.45)m.terminal=true;if(!m.micro&&state.weaponAugments?.missile&&d<118)splitMirvMissile(m,target);const desired=Math.atan2(dy,dx),current=Math.atan2(m.vy,m.vx),turn=(m.micro?7.2:(m.n>=3?4.7:3.6))*dt,angle=missileTurn(current,desired,turn),baseSpeed=(m.micro?440:390+m.n*18)*postRosterMissileSpeed()*(m.terminal?1.28:1),speed=Math.hypot(m.vx,m.vy),nextSpeed=lerp(speed,baseSpeed,clamp(dt*(m.micro?8:4.8),0,1));m.vx=Math.cos(angle)*nextSpeed;m.vy=Math.sin(angle)*nextSpeed;if(d<target.r+m.r+6){explodeGuidedMissile(m,target);continue;}}
    m.x+=m.vx*dt;m.y+=m.vy*dt;if(m.age>=m.ignition&&Math.random()<dt*(m.micro?14:24))spawnParticle(m.x-m.vx*.018,m.y-m.vy*.018,m.micro?'#ffe2bd':'#ff9f57',1,42,m.micro?1.5:2.2);
  }
  compactInPlace(state.entities.guidedMissiles,m=>m&&m.life>0);
}
function gateInstallTarget(){
  let best=null,bestScore=-Infinity;const range=weaponRange('gate');for(const e of state.entities.enemies){if(!e||e.dead)continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d>range)continue;let nearby=0;for(const other of state.entities.enemies)if(other&&!other.dead&&Math.hypot(other.x-e.x,other.y-e.y)<150)nearby++;const score=(e.type==='boss'?2:e.type==='mini'?1:0)*1e8+nearby*250+(e.hp||0)*.18-d*.10;if(score>bestScore){bestScore=score;best=e;}}return best;
}
function deployOrbitalGate(n,echoed=false){
  if(!echoed)player.gatePlacementCycle=(player.gatePlacementCycle||0)+1;const assault=echoed?true:(player.gatePlacementCycle%2===1),target=assault?gateInstallTarget():null,baseX=target?.x??player.x,baseY=target?.y??player.y,extraOffset=echoed?72:0,angle=(Number.isFinite(player.facingAngle)?player.facingAngle:0)+(echoed?.42:0),cx=baseX+Math.cos(angle+Math.PI/2)*extraOffset,cy=baseY+Math.sin(angle+Math.PI/2)*extraOffset,count=n>=4?4:n>=2?3:2,radius=155,orientation=angle+.35,gates=[];
  for(let i=0;i<count;i++){const a=orientation+i*TAU/count;gates.push({x:cx+Math.cos(a)*radius,y:cy+Math.sin(a)*radius,copyCd:0});}
  if(!echoed)for(const old of state.entities.gateNetworks)if(old&&!old.echoed)old.life=Math.min(old.life,.32);
  state.entities.gateNetworks.push({id:state.nextId++,x:cx,y:cy,n,gates,life:(n>=5?10.5:9)*(echoed?.72:1),max:(n>=5?10.5:9)*(echoed?.72:1),echoed,pulseCd:.16,pulses:[],circuitCd:0,crossCd:0});
  trimOldest(state.entities.gateNetworks,3);audio.weapon?.('gate',echoed,1.05);shockwave(cx,cy,echoed?COLORS.pink:'#a9b7ff',120,.36,2.2);
}
function spawnGatePulseSet(net){
  const n=net.n,base=n>=3?2:1,extra=net.echoed?0:postRosterMultiplicity(),count=base+extra,transferDelay=.58*(n>=5?.82:1)*hasteMult(),transfers=n>=6?net.gates.length*2:n>=2?4:3;
  for(let i=0;i<count;i++)net.pulses.push({index:i%net.gates.length,dir:(n>=6&&i%2)?-1:1,timer:i*transferDelay/Math.max(1,count),delay:transferDelay,remaining:transfers,done:0});
}
function gateSegmentHit(net,pulse){
  const gates=net.gates,a=gates[pulse.index],next=(pulse.index+pulse.dir+gates.length)%gates.length,b=gates[next],n=net.n,size=weaponSizeMultiplier(),damage=(11+n*2.55)*(net.echoed?.62:1),width=6.5*size;
  applyRailBeam(a.x,a.y,b.x,b.y,width,damage,net.echoed?COLORS.pink:'#a9b7ff','gate-pulse',1);pulse.index=next;pulse.remaining--;pulse.done++;
  if(n>=5){const target=nearestEnemy(b.x,b.y,240);if(target){dealDamage(target,5+n*1.4,{color:'#dce2ff',source:'gate-exit'});state.entities.beams.push({x1:b.x,y1:b.y,x2:target.x,y2:target.y,life:.12,max:.12,color:'#dce2ff',width:2.1*size});}}
  if(pulse.done%gates.length===0){
    if(n>=4&&net.crossCd<=0&&gates.length>=4){net.crossCd=.72;applyRailBeam(gates[0].x,gates[0].y,gates[2].x,gates[2].y,width*1.18,damage*1.35,'#eef1ff','gate-cross',1);}
    if(n>=6&&net.circuitCd<=0){net.circuitCd=1.15;areaDamage(net.x,net.y,92*size,damage*.72,'#cbd3ff','gate-circuit',{shake:false});}
  }
}
function updateGateCrossfeed(net,dt){
  if(!state.weaponAugments?.gate)return;for(let i=0;i<net.gates.length;i++){const gate=net.gates[i];gate.copyCd=Math.max(0,(gate.copyCd||0)-dt);if(gate.copyCd>0)continue;for(const p of state.entities.projectiles){if(!p||p.life<=0||p.gateCopy||p.gateCrossfed||String(p.source||'').includes('multiplicity'))continue;if(Math.hypot(p.x-gate.x,p.y-gate.y)>28*weaponSizeMultiplier())continue;const next=net.gates[(i+1)%net.gates.length],target=nearestEnemy(next.x,next.y,weaponRange('gate'));if(!target)break;p.gateCrossfed=true;gate.copyCd=.55;const a=Math.atan2(target.y-next.y,target.x-next.x),speed=Math.max(360,Math.hypot(p.vx||0,p.vy||0));spawnPlayerProjectile({x:next.x,y:next.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:Math.max(3,Number(p.r)||4),life:1.0,maxRange:weaponRange('gate'),damage:(Number(p.damage)||0)*.55,color:'#dce2ff',pierce:Math.max(0,Math.min(2,Number(p.pierce)||0)),source:'gate-crossfeed',gateCopy:true,homingTargetId:target.id,homingReacquire:false,homingTurn:2.2});break;}}
}
function updateGateNetworks(dt){
  for(const net of state.entities.gateNetworks){if(!net||net.life<=0)continue;net.life-=dt;net.pulseCd-=dt;net.circuitCd=Math.max(0,net.circuitCd-dt);net.crossCd=Math.max(0,net.crossCd-dt);if(net.pulseCd<=0){net.pulseCd=1.65*hasteMult();spawnGatePulseSet(net);}for(const pulse of net.pulses){pulse.timer-=dt;if(pulse.timer<=0&&pulse.remaining>0){pulse.timer+=pulse.delay;gateSegmentHit(net,pulse);}}compactInPlace(net.pulses,p=>p&&p.remaining>0);updateGateCrossfeed(net,dt);}
  compactInPlace(state.entities.gateNetworks,net=>net&&net.life>0);
}
function updatePostRosterWeapons(dt){
  const vacuumN=weaponCount('vacuum');if(vacuumN)updateVacuumSeeds(dt,vacuumN);else{state.entities.vacuumSeeds.length=0;player.vacuumKillCounter=0;}
  const mineN=weaponCount('mine');if(mineN)updatePhaseMinefield(dt,mineN);else{state.entities.phaseMines.length=0;player.mineTravel=0;player.minePlaceTimer=1.65;player.mineLastX=player.x;player.mineLastY=player.y;}
  const missileN=weaponCount('missile');if(missileN){player.missileCd-=dt;if(player.missileCd<=0){player.missileCd=2.35*hasteMult();fireInterstellarMissiles(missileN);echoTrigger(()=>fireInterstellarMissiles(missileN,true));}}else state.entities.guidedMissiles.length=0;updateGuidedMissiles(dt);
  const gateN=weaponCount('gate');if(gateN){player.gateCd-=dt;if(player.gateCd<=0){player.gateCd=6.4*hasteMult();deployOrbitalGate(gateN);echoTrigger(()=>deployOrbitalGate(gateN,true));}}else state.entities.gateNetworks.length=0;updateGateNetworks(dt);
}

function updateWeapons(dt){
  const bladeN=weaponCount('blade'),prismN=weaponCount('prism');player.angle+=dt*(2.05+bladeN*.12+prismN*.05+(bladeN>=3?.42:0))/hasteMult()*(1+stat('projectileSpeed')*.08);
  player.coreCd-=dt;if(player.coreCd<=0){player.coreCd=CORE_PULSE_COOLDOWN*hasteMult();const target=nearestWeaponTarget('core');if(target){spawnCoreShot(target);echoTrigger(()=>spawnCoreShot(target,true));}}
  if(bladeN){player.bladeTick-=dt;if(player.bladeTick<=0){player.bladeTick=.13*hasteMult();const count=bladeN>=5?3:bladeN>=2?2:1,orbit=orbitRadiusFor('blade'),bladeR=(bladeN>=6?31:bladeN>=3?25:22)*weaponSizeMultiplier();for(const e of state.entities.enemies){if(e.dead)continue;for(let i=0;i<count;i++){const a=player.angle+i*TAU/count,bx=player.x+Math.cos(a)*orbit,by=player.y+Math.sin(a)*orbit;if((e.x-bx)**2+(e.y-by)**2<(e.r+bladeR)**2){dealDamage(e,5+bladeN*1.7,{color:COLORS.cyan,source:'blade'});if(bladeN>=4){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;spawnPlayerProjectile({x:e.x,y:e.y,vx:dx/d*455,vy:dy/d*455,r:7,life:.28,maxRange:155,damage:7+bladeN*1.4,color:COLORS.cyan,pierce:2+(bladeN>=5?1:0),source:'wave'});}break;}}}}}
  const emberN=weaponCount('ember');if(emberN){player.emberCd-=dt;if(player.emberCd<=0){player.emberCd=(.82-Math.min(.28,emberN*.04))*hasteMult();const target=nearestWeaponTarget('ember');if(target){fireEmber(target,emberN);echoTrigger(()=>fireEmber(target,emberN,true));}}}
  const gravN=weaponCount('gravity');if(gravN){player.wellCd-=dt;if(player.wellCd<=0){player.wellCd=(6.1-Math.min(2.2,gravN*.32))*hasteMult();createGravityWells(gravN);echoTrigger(()=>createGravityWells(gravN,true));}}
  const bulwarkN=weaponCount('bulwark'),bulwarkProfile=bulwarkRechargeProfile(bulwarkN);if(bulwarkProfile){player.bulwarkCd-=dt;if(player.bulwarkCd<=0){player.bulwarkCd=bulwarkProfile.interval;if(rechargeShield(bulwarkProfile.gain,bulwarkProfile.cap)>0)shockwave(player.x,player.y,COLORS.green,90,.32,2);}}if(bulwarkN>=6){player.fortressCd-=dt;if(player.fortressCd<=0){player.fortressCd=8;if(rechargeShield(24,bulwarkProfile.cap)>0)shockwave(player.x,player.y,COLORS.green,155,.5,5);}}
  const cometN=weaponCount('comet');if(cometN){player.cometCd-=dt;if(player.cometCd<=0){player.cometCd=(1.92-Math.min(.46,cometN*.06))*hasteMult();const target=nearestWeaponTarget('comet');if(target){fireComet(target,cometN);echoTrigger(()=>fireComet(target,cometN,true));}}}
  const arcN=weaponCount('arc');if(arcN){player.arcCd-=dt;if(player.arcCd<=0){player.arcCd=(1.92-Math.min(.58,arcN*.075))*hasteMult();const target=nearestWeaponTarget('arc');if(target){fireBoomerang(target,arcN);echoTrigger(()=>fireBoomerang(target,arcN,true));}}}
  if(prismN){updateFocusedPrisms(dt,prismN);player.prismCd-=dt;if(player.prismCd<=0){player.prismCd=1.55*hasteMult();echoTrigger(()=>firePrism(prismN,true));}}else player.prismLocks=[];
  const chronoN=weaponCount('chrono');if(chronoN>=4){player.chronoCd-=dt;if(player.chronoCd<=0){player.chronoCd=(5.0-Math.min(1.45,chronoN*.20))*hasteMult();const radius=(150+chronoN*18)*weaponSizeMultiplier();areaDamage(player.x,player.y,radius,7+chronoN*2.7,COLORS.chrono,'chrono-pulse');if(chronoN>=5)for(const e of state.entities.enemies)if(!e.dead&&e.kind!=='apex'&&Math.hypot(e.x-player.x,e.y-player.y)<radius)e.timeLock=Math.max(e.timeLock||0,e.type==='boss'?.35:.9);}}
  const ionN=weaponCount('ion');if(ionN){player.ionCd-=dt;if(player.ionCd<=0){player.ionCd=(2.35-Math.min(.62,ionN*.07))*hasteMult();fireIonChain(ionN);echoTrigger(()=>fireIonChain(ionN,true));}}
  const novaN=weaponCount('nova');if(novaN){player.novaCd-=dt;if(player.novaCd<=0){player.novaCd=(4.9-Math.min(1.25,novaN*.16))*hasteMult();fireNovaPulse(novaN);echoTrigger(()=>fireNovaPulse(novaN,true));}}
  const droneN=weaponCount('drone');if(droneN){player.droneCd-=dt;if(player.droneCd<=0){player.droneCd=(1.34-Math.min(.40,droneN*.058))*(droneN>=5?.76:1)*hasteMult();fireMeteorDrones(droneN);echoTrigger(()=>fireMeteorDrones(droneN,true));}}
  const railN=weaponCount('rail');if(railN){player.railCd-=dt;if(player.railCd<=0){player.railCd=(4.15-Math.min(.92,railN*.13))*hasteMult();fireRailgun(railN);echoTrigger(()=>fireRailgun(railN,true));}}
  const spiralN=weaponCount('spiral');if(spiralN){player.spiralCd-=dt;if(player.spiralCd<=0){player.spiralCd=(3.05-Math.min(.82,spiralN*.11))*hasteMult();fireGalacticSpiral(spiralN);echoTrigger(()=>fireGalacticSpiral(spiralN,true));}}
  const mirrorN=weaponCount('mirror');if(mirrorN){player.mirrorCd-=dt;if(player.mirrorCd<=0){player.mirrorCd=(5.35-Math.min(1.35,mirrorN*.18))*hasteMult();fireReflector(mirrorN);echoTrigger(()=>fireReflector(mirrorN,true));}}
  updatePostRosterWeapons(dt);
}
function echoTrigger(fn){
  const n=stat('echo');if(!n||typeof fn!=='function')return;
  state.echoCycle++;
  const chance=Math.min(.60,n*.075),guaranteed=n>=8&&state.echoCycle%5===0;
  if(!guaranteed&&Math.random()>=chance)return;
  const firstDelay=64+Math.floor(Math.random()*28);
  scheduleWeaponAction(firstDelay,fn);
  if(n>=5&&Math.random()<.24)scheduleWeaponAction(firstDelay+90+Math.floor(Math.random()*31),fn);
}
