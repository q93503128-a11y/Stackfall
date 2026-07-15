function spawnCoreShot(target, echoed=false) {
  if(!target) return;
  const a=Math.atan2(target.y-player.y,target.x-player.x);
  spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*470,vy:Math.sin(a)*470,r:4.3,life:1.45,damage:echoed?5.5:8.5,color:echoed?COLORS.pink:'#d7f8ff',pierce:0,source:echoed?'core-echo':'core'});
}

function fireEmber(target, emberN, echoed=false) {
  if(!target) return;
  player.emberVolley=(player.emberVolley||0)+1;
  const base=Math.atan2(target.y-player.y,target.x-player.x);
  const shots=emberN>=5?3:emberN>=2?2:1;
  const superShot=emberN>=6&&player.emberVolley%7===0;
  for(let i=0;i<shots;i++) {
    const a=base+(i-(shots-1)/2)*(shots===3?.18:.15)+rand(-.014,.014);
    spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*(superShot?620:525),vy:Math.sin(a)*(superShot?620:525),r:superShot?13:6,life:1.6,damage:(14+emberN*4)*(echoed?.72:1),color:echoed?COLORS.pink:'#ff789b',pierce:superShot?8:emberN>=3?1:0,source:echoed?'echo-star':'ember',split:emberN>=4});
  }
}

function fireComet(target, cometN, echoed=false) {
  if(!target) return;
  const base=Math.atan2(target.y-player.y,target.x-player.x);
  const shots=cometN>=2?2:1;
  for(let i=0;i<shots;i++) {
    const a=base+(i-(shots-1)/2)*.105;
    spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*(620+cometN*7),vy:Math.sin(a)*(620+cometN*7),r:9+cometN*1.05,life:1.9,damage:(25+cometN*6.5)*(echoed?.68:1),color:echoed?COLORS.pink:COLORS.comet,pierce:2+Math.floor(cometN/2)+(cometN>=3?2:0),source:echoed?'echo-comet':'comet',fragment:cometN>=4,trailDamage:cometN>=5,explode:cometN>=6,trailDamageCd:0});
  }
}

function prismPositions(count) {
  const points=[];
  const orbit=count>=3?82:70;
  for(let i=0;i<count;i++) {
    const a=player.angle*.52+i*TAU/count;
    points.push({x:player.x+Math.cos(a)*orbit,y:player.y+Math.sin(a)*orbit,a});
  }
  return points;
}

function meteorDronePositions(stacks) {
  const count=stacks>=6?3:stacks>=2?2:1,orbit=stacks>=5?94:82,points=[];
  for(let i=0;i<count;i++){
    const a=player.angle*.68+i*TAU/count;
    points.push({x:player.x+Math.cos(a)*orbit,y:player.y+Math.sin(a)*orbit,a});
  }
  return points;
}

function nearestEnemies(x,y,count,excluded=new Set()) {
  return state.entities.enemies.filter(e=>!e.dead&&!excluded.has(e.id)).sort((a,b)=>((a.x-x)**2+(a.y-y)**2)-((b.x-x)**2+(b.y-y)**2)).slice(0,count);
}

function segmentDistance(px,py,x1,y1,x2,y2) {
  const dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy||1;
  const t=clamp(((px-x1)*dx+(py-y1)*dy)/len,0,1);
  return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));
}

function firePrism(prismN, echoed=false) {
  const satelliteCount=prismN>=6?3:prismN>=2?2:1;
  const chainCount=prismN>=5?3:prismN>=3?2:1;
  const positions=prismPositions(satelliteCount),size=weaponSizeMultiplier();
  for(const pos of positions) {
    const targets=nearestEnemies(pos.x,pos.y,chainCount);
    let from={x:pos.x,y:pos.y};
    const hit=new Set();
    targets.forEach((target,index)=>{
      if(hit.has(target.id)) return;
      hit.add(target.id);
      const damage=(11+prismN*3.4)*(echoed?.62:1)*(index===0?1:.68),width=(index===0?3.2:2.1)*size;
      dealDamage(target,damage,{color:echoed?COLORS.pink:'#c8b3ff',source:'prism-beam'});
      state.entities.beams.push({x1:from.x,y1:from.y,x2:target.x,y2:target.y,life:.16,max:.16,color:echoed?COLORS.pink:'#c8b3ff',width});
      from=target;
    });
  }
  if(prismN>=4&&positions.length>1) {
    for(let i=0;i<positions.length;i++) {
      const a=positions[i],b=positions[(i+1)%positions.length],width=1.4*size;
      state.entities.beams.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,life:.22,max:.22,color:'#9f8cff',width});
      for(const e of state.entities.enemies) if(!e.dead&&segmentDistance(e.x,e.y,a.x,a.y,b.x,b.y)<e.r+5*size) dealDamage(e,(4+prismN*1.2)*(echoed?.55:1),{color:'#ae9cff',source:'constellation-link',canCrit:false});
    }
  }
  trimOldest(state.entities.beams,entityCap('beams'));
}

function createGravityWells(gravN, echoed=false) {
  const count=gravN>=6?2:1,size=weaponSizeMultiplier();
  for(let i=0;i<count;i++) {
    const a=player.angle+i*Math.PI+(echoed?.45:0),d=count===2?150:105;
    const duration=(gravN>=3?3.55:2.7)+(gravN>=4?.55:0);
    state.entities.wells.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:(gravN>=2?185:135)*size,life:duration,max:duration,strength:(gravN>=2?430:280)+(gravN>=5?120:0),damage:gravN>=4?(9+gravN*2.2+(gravN>=5?7:0))*(echoed?.55:1):0,tick:0,color:echoed?COLORS.pink:COLORS.violet});
  }
}

function nearestUnhitEnemy(x,y,hit,maxRange=Infinity){
  let best=null,bestD=maxRange*maxRange;
  for(const e of state.entities.enemies){if(e.dead||hit.has(e.id))continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bestD){best=e;bestD=d;}}
  return best;
}

function castIonPath(first,ionN,echoed,sharedHit,maxLinks){
  if(!first)return null;
  const color=echoed?COLORS.pink:'#72f2ff',range=185+ionN*24,beamWidth=(2.4+ionN*.18)*weaponSizeMultiplier();
  let from={x:player.x,y:player.y},target=first,last=null,damage=(13+ionN*4.2)*(echoed?.64:1);
  for(let i=0;i<maxLinks&&target;i++){
    sharedHit.add(target.id);dealDamage(target,damage*Math.pow(.84,i),{color,source:'ion-chain'});
    state.entities.beams.push({x1:from.x,y1:from.y,x2:target.x,y2:target.y,life:.18,max:.18,color,width:beamWidth+(i===0?1.1:0)});
    last=target;from={x:target.x,y:target.y};target=nearestUnhitEnemy(from.x,from.y,sharedHit,range);
  }
  return last;
}

function fireIonChain(ionN,echoed=false){
  const cast=()=>{
    const first=nearestEnemy(player.x,player.y);if(!first)return;
    const hit=new Set(),links=2+(ionN>=2?1:0)+(ionN>=5?1:0),last=castIonPath(first,ionN,echoed,hit,links);
    if(ionN>=4){const branch=nearestUnhitEnemy(player.x,player.y,hit,260+ionN*20);castIonPath(branch,ionN,echoed,hit,Math.max(2,links-1));}
    if(ionN>=5&&last)areaDamage(last.x,last.y,54*weaponSizeMultiplier(),(10+ionN*2.8)*(echoed?.62:1),echoed?COLORS.pink:'#72f2ff');
    trimOldest(state.entities.beams,entityCap('beams'));
  };
  cast();
  if(ionN>=6&&!echoed)setTimeout(()=>{if(state.mode==='playing')cast();},95);
}

function pushFromPlayer(radius,force){
  const r2=radius*radius;
  for(const e of state.entities.enemies){if(e.dead)continue;const dx=e.x-player.x,dy=e.y-player.y,d2=dx*dx+dy*dy;if(d2>r2)continue;const d=Math.sqrt(d2)||1,k=force*enemyControlFactor(e);e.x+=dx/d*k;e.y+=dy/d*k;}
}

function fireNovaPulse(novaN,echoed=false){
  const size=weaponSizeMultiplier(),color=echoed?COLORS.pink:'#ffbd69',radius=(145+(novaN>=2?40:0)+(novaN>=5?18:0))*size,damage=(18+novaN*5.2)*(echoed?.64:1);
  areaDamage(player.x,player.y,radius,damage,color);shockwave(player.x,player.y,'#fff2c7',radius*.76,.40,3.8);state.flash=Math.max(state.flash,.08);state.camera.shake=Math.max(state.camera.shake,4.5);
  if(novaN>=4)pushFromPlayer(radius,32+novaN*3);
  if(novaN>=3)setTimeout(()=>{if(state.mode!=='playing')return;areaDamage(player.x,player.y,radius*.72,damage*.46,color);},145);
  if(novaN>=6&&!echoed)setTimeout(()=>{if(state.mode!=='playing')return;areaDamage(player.x,player.y,radius*1.16,damage*.72,'#fff0b5');shockwave(player.x,player.y,color,radius*1.22,.48,5);},285);
}

function fireMeteorDrones(droneN,echoed=false){
  if(!echoed)player.droneVolley=(player.droneVolley||0)+1;
  const positions=meteorDronePositions(droneN),targets=nearestEnemies(player.x,player.y,positions.length*2),paired=droneN>=4,baseColor=echoed?COLORS.pink:'#8fffd0';
  positions.forEach((pos,index)=>{
    const target=targets[index%Math.max(1,targets.length)]||nearestEnemy(pos.x,pos.y);if(!target)return;
    const base=Math.atan2(target.y-pos.y,target.x-pos.x),shots=paired?2:1;
    for(let shot=0;shot<shots;shot++){
      const a=base+(shot-(shots-1)/2)*.11;
      spawnPlayerProjectile({x:pos.x,y:pos.y,vx:Math.cos(a)*(500+droneN*12),vy:Math.sin(a)*(500+droneN*12),r:4.5+droneN*.22,life:1.45,damage:(10+droneN*3.4)*(echoed?.66:1)*(paired?.72:1),color:baseColor,pierce:droneN>=3?1:0,source:echoed?'echo-drone':'meteor-drone'});
    }
  });
  if(droneN>=6&&!echoed&&player.droneVolley%5===0){for(let i=0;i<8;i++){const a=i*TAU/8;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:4.2,life:1.05,damage:13+droneN*2.4,color:'#d8fff1',pierce:1,source:'drone-burst'});}}
}

function updateWeapons(dt) {
  const bladeN=weaponCount('blade'),prismN=weaponCount('prism');
  player.angle += dt*(2.05+bladeN*.12+prismN*.05+(bladeN>=3?.42:0))/hasteMult();

  player.coreCd-=dt;
  if(player.coreCd<=0){player.coreCd=1.08*hasteMult();const target=nearestEnemy(player.x,player.y);if(target){spawnCoreShot(target);echoTrigger(()=>spawnCoreShot(target,true));}}

  if(bladeN){
    player.bladeTick-=dt;
    if(player.bladeTick<=0){
      player.bladeTick=.105*hasteMult();
      const count=bladeN>=5?3:bladeN>=2?2:1,orbit=bladeN>=6?116:bladeN>=3?91:80,bladeR=(bladeN>=6?31:bladeN>=3?25:22)*weaponSizeMultiplier();
      for(const e of state.entities.enemies){if(e.dead)continue;for(let i=0;i<count;i++){const a=player.angle+i*TAU/count,bx=player.x+Math.cos(a)*orbit,by=player.y+Math.sin(a)*orbit;if((e.x-bx)**2+(e.y-by)**2<(e.r+bladeR)**2){dealDamage(e,11+bladeN*4.4,{color:COLORS.cyan,source:'blade'});if(bladeN>=4){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;spawnPlayerProjectile({x:e.x,y:e.y,vx:dx/d*455,vy:dy/d*455,r:7,life:.28,damage:10+bladeN*2,color:COLORS.cyan,pierce:2+(bladeN>=5?1:0),source:'wave'});}break;}}}
    }
  }

  const emberN=weaponCount('ember');
  if(emberN){player.emberCd-=dt;if(player.emberCd<=0){player.emberCd=(.74-Math.min(.32,emberN*.04))*hasteMult();const target=nearestEnemy(player.x,player.y);if(target){fireEmber(target,emberN);echoTrigger(()=>fireEmber(target,emberN,true));}}}

  const gravN=weaponCount('gravity');
  if(gravN){player.wellCd-=dt;if(player.wellCd<=0){player.wellCd=(5.8-Math.min(2.45,gravN*.34))*hasteMult();createGravityWells(gravN);echoTrigger(()=>createGravityWells(gravN,true));}}

  const bulwarkN=weaponCount('bulwark');
  if(bulwarkN>=3){player.bulwarkCd-=dt;if(player.bulwarkCd<=0){player.bulwarkCd=bulwarkN>=5?6.2:9;const cap=bulwarkN>=6?46:bulwarkN>=5?30:16,gain=bulwarkN>=5?10:6;player.shield=Math.min(cap,player.shield+gain);shockwave(player.x,player.y,COLORS.green,90,.32,2);}}
  if(bulwarkN>=6){player.fortressCd-=dt;if(player.fortressCd<=0){player.fortressCd=8;player.shield=Math.min(46,player.shield+24);shockwave(player.x,player.y,COLORS.green,155,.5,5);}}

  const cometN=weaponCount('comet');
  if(cometN){player.cometCd-=dt;if(player.cometCd<=0){player.cometCd=(1.72-Math.min(.5,cometN*.065))*hasteMult();const target=nearestEnemy(player.x,player.y);if(target){fireComet(target,cometN);echoTrigger(()=>fireComet(target,cometN,true));}}}

  if(prismN){player.prismCd-=dt;if(player.prismCd<=0){player.prismCd=(1.34-Math.min(.52,prismN*.062))*hasteMult();firePrism(prismN);echoTrigger(()=>firePrism(prismN,true));}}

  const chronoN=weaponCount('chrono');
  if(chronoN>=4){player.chronoCd-=dt;if(player.chronoCd<=0){player.chronoCd=(4.8-Math.min(1.55,chronoN*.22))*hasteMult();const radius=(150+chronoN*18)*weaponSizeMultiplier();areaDamage(player.x,player.y,radius,8+chronoN*3.2,COLORS.chrono);if(chronoN>=5){for(const e of state.entities.enemies)if(!e.dead&&Math.hypot(e.x-player.x,e.y-player.y)<radius)e.timeLock=Math.max(e.timeLock||0,e.type==='boss'?.35:.9);}}}

  const ionN=weaponCount('ion');
  if(ionN){player.ionCd-=dt;if(player.ionCd<=0){player.ionCd=(2.18-Math.min(.68,ionN*.075))*hasteMult();fireIonChain(ionN);echoTrigger(()=>fireIonChain(ionN,true));}}

  const novaN=weaponCount('nova');
  if(novaN){player.novaCd-=dt;if(player.novaCd<=0){player.novaCd=(4.65-Math.min(1.38,novaN*.17))*hasteMult();fireNovaPulse(novaN);echoTrigger(()=>fireNovaPulse(novaN,true));}}

  const droneN=weaponCount('drone');
  if(droneN){player.droneCd-=dt;if(player.droneCd<=0){player.droneCd=(1.48-Math.min(.48,droneN*.06))*(droneN>=5?.78:1)*hasteMult();fireMeteorDrones(droneN);echoTrigger(()=>fireMeteorDrones(droneN,true));}}
}

function echoTrigger(fn) {
  const n=stat('echo');
  if(!n)return;
  state.echoCycle++;
  const chance=Math.min(.70,.10+n*.075),guaranteed=n>=8&&state.echoCycle%5===0;
  if(guaranteed||Math.random()<chance){fn();if(n>=5&&Math.random()<.28)setTimeout(fn,70);}
}