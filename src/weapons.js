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
    spawnPlayerProjectile({
      x:player.x,y:player.y,vx:Math.cos(a)*(superShot?620:525),vy:Math.sin(a)*(superShot?620:525),
      r:superShot?13:6,life:1.6,damage:(14+emberN*4)*(echoed?.72:1),
      color:echoed?COLORS.pink:'#ff789b',pierce:superShot?8:emberN>=3?1:0,
      source:echoed?'echo-star':'ember',split:emberN>=4
    });
  }
}

function fireComet(target, cometN, echoed=false) {
  if(!target) return;
  const base=Math.atan2(target.y-player.y,target.x-player.x);
  const shots=cometN>=2?2:1;
  for(let i=0;i<shots;i++) {
    const a=base+(i-(shots-1)/2)*.105;
    spawnPlayerProjectile({
      x:player.x,y:player.y,vx:Math.cos(a)*(620+cometN*7),vy:Math.sin(a)*(620+cometN*7),
      r:9+cometN*1.05,life:1.9,damage:(25+cometN*6.5)*(echoed?.68:1),
      color:echoed?COLORS.pink:COLORS.comet,pierce:2+Math.floor(cometN/2)+(cometN>=3?2:0),
      source:echoed?'echo-comet':'comet',fragment:cometN>=4,trailDamage:cometN>=5,explode:cometN>=6,
      trailDamageCd:0
    });
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
  const positions=prismPositions(satelliteCount);
  for(const pos of positions) {
    const targets=nearestEnemies(pos.x,pos.y,chainCount);
    let from={x:pos.x,y:pos.y};
    const hit=new Set();
    targets.forEach((target,index)=>{
      if(hit.has(target.id)) return;
      hit.add(target.id);
      const damage=(11+prismN*3.4)*(echoed?.62:1)*(index===0?1:.68);
      dealDamage(target,damage,{color:echoed?COLORS.pink:'#c8b3ff',source:'prism-beam'});
      state.entities.beams.push({x1:from.x,y1:from.y,x2:target.x,y2:target.y,life:.16,max:.16,color:echoed?COLORS.pink:'#c8b3ff',width:index===0?3.2:2.1});
      from=target;
    });
  }
  if(prismN>=4&&positions.length>1) {
    for(let i=0;i<positions.length;i++) {
      const a=positions[i],b=positions[(i+1)%positions.length];
      state.entities.beams.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,life:.22,max:.22,color:'#9f8cff',width:1.4});
      for(const e of state.entities.enemies) {
        if(!e.dead&&segmentDistance(e.x,e.y,a.x,a.y,b.x,b.y)<e.r+5) dealDamage(e,(4+prismN*1.2)*(echoed?.55:1),{color:'#ae9cff',source:'constellation-link',canCrit:false});
      }
    }
  }
}

function createGravityWells(gravN, echoed=false) {
  const count=gravN>=6?2:1;
  for(let i=0;i<count;i++) {
    const a=player.angle+i*Math.PI+(echoed?.45:0),d=count===2?150:105;
    const duration=(gravN>=3?3.55:2.7)+(gravN>=4?.55:0);
    state.entities.wells.push({
      x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:gravN>=2?185:135,
      life:duration,max:duration,strength:(gravN>=2?430:280)+(gravN>=5?120:0),
      damage:gravN>=4?(9+gravN*2.2+(gravN>=5?7:0))*(echoed?.55:1):0,tick:0,color:echoed?COLORS.pink:COLORS.violet
    });
  }
}

function updateWeapons(dt) {
  const bladeN=weaponCount('blade'),prismN=weaponCount('prism');
  player.angle += dt*(2.05+bladeN*.12+prismN*.05+(bladeN>=3?.42:0))/hasteMult();

  player.coreCd-=dt;
  if(player.coreCd<=0){
    player.coreCd=1.08*hasteMult();
    const target=nearestEnemy(player.x,player.y);
    if(target){spawnCoreShot(target);echoTrigger(()=>spawnCoreShot(target,true));}
  }

  if(bladeN){
    player.bladeTick-=dt;
    if(player.bladeTick<=0){
      player.bladeTick=.105*hasteMult();
      const count=bladeN>=5?3:bladeN>=2?2:1,orbit=bladeN>=6?116:bladeN>=3?91:80,bladeR=bladeN>=6?31:bladeN>=3?25:22;
      for(const e of state.entities.enemies){
        if(e.dead)continue;
        for(let i=0;i<count;i++){
          const a=player.angle+i*TAU/count,bx=player.x+Math.cos(a)*orbit,by=player.y+Math.sin(a)*orbit;
          if((e.x-bx)**2+(e.y-by)**2<(e.r+bladeR)**2){
            dealDamage(e,11+bladeN*4.4,{color:COLORS.cyan,source:'blade'});
            if(bladeN>=4){
              const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;
              spawnPlayerProjectile({x:e.x,y:e.y,vx:dx/d*455,vy:dy/d*455,r:7,life:.28,damage:10+bladeN*2,color:COLORS.cyan,pierce:2+(bladeN>=5?1:0),source:'wave'});
            }
            break;
          }
        }
      }
    }
  }

  const emberN=weaponCount('ember');
  if(emberN){
    player.emberCd-=dt;
    if(player.emberCd<=0){
      player.emberCd=(.74-Math.min(.32,emberN*.04))*hasteMult();
      const target=nearestEnemy(player.x,player.y);
      if(target){fireEmber(target,emberN);echoTrigger(()=>fireEmber(target,emberN,true));}
    }
  }

  const gravN=weaponCount('gravity');
  if(gravN){
    player.wellCd-=dt;
    if(player.wellCd<=0){player.wellCd=(5.8-Math.min(2.45,gravN*.34))*hasteMult();createGravityWells(gravN);echoTrigger(()=>createGravityWells(gravN,true));}
  }

  const bulwarkN=weaponCount('bulwark');
  if(bulwarkN>=3){
    player.bulwarkCd-=dt;
    if(player.bulwarkCd<=0){
      player.bulwarkCd=bulwarkN>=5?6.2:9;
      const cap=bulwarkN>=6?46:bulwarkN>=5?30:16,gain=bulwarkN>=5?10:6;
      player.shield=Math.min(cap,player.shield+gain);shockwave(player.x,player.y,COLORS.green,90,.32,2);
    }
  }
  if(bulwarkN>=6){
    player.fortressCd-=dt;
    if(player.fortressCd<=0){player.fortressCd=8;player.shield=Math.min(46,player.shield+24);shockwave(player.x,player.y,COLORS.green,155,.5,5);}
  }

  const cometN=weaponCount('comet');
  if(cometN){
    player.cometCd-=dt;
    if(player.cometCd<=0){
      player.cometCd=(1.72-Math.min(.5,cometN*.065))*hasteMult();
      const target=nearestEnemy(player.x,player.y);
      if(target){fireComet(target,cometN);echoTrigger(()=>fireComet(target,cometN,true));}
    }
  }

  if(prismN){
    player.prismCd-=dt;
    if(player.prismCd<=0){player.prismCd=(1.34-Math.min(.52,prismN*.062))*hasteMult();firePrism(prismN);echoTrigger(()=>firePrism(prismN,true));}
  }

  const chronoN=weaponCount('chrono');
  if(chronoN>=4){
    player.chronoCd-=dt;
    if(player.chronoCd<=0){
      player.chronoCd=(4.8-Math.min(1.55,chronoN*.22))*hasteMult();
      const radius=150+chronoN*18;
      areaDamage(player.x,player.y,radius,8+chronoN*3.2,COLORS.chrono);
      if(chronoN>=5){
        for(const e of state.entities.enemies) if(!e.dead&&Math.hypot(e.x-player.x,e.y-player.y)<radius)e.timeLock=Math.max(e.timeLock||0,e.type==='boss'?.35:.9);
      }
    }
  }
}

function echoTrigger(fn) {
  const n=stat('echo');
  if(!n)return;
  state.echoCycle++;
  const chance=Math.min(.70,.10+n*.075),guaranteed=n>=8&&state.echoCycle%5===0;
  if(guaranteed||Math.random()<chance){fn();if(n>=5&&Math.random()<.28)setTimeout(fn,70);}
}
