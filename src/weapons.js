function spawnCoreShot(target, echoed=false) {
  if(!target) return;
  const a=Math.atan2(target.y-player.y,target.x-player.x);
  spawnPlayerProjectile({
    x:player.x,y:player.y,vx:Math.cos(a)*470,vy:Math.sin(a)*470,
    r:4.3,life:1.45,damage:echoed?5.5:8.5,
    color:echoed?COLORS.pink:'#d7f8ff',pierce:0,source:echoed?'core-echo':'core'
  });
}

function fireEmber(target, emberN, echoed=false) {
  if(!target) return;
  const base=Math.atan2(target.y-player.y,target.x-player.x);
  const shots=emberN>=2?2:1;
  for(let i=0;i<shots;i++) {
    const a=base+(i-(shots-1)/2)*.17+rand(-.018,.018);
    const superShot=emberN>=6&&state.kills%10===0;
    spawnPlayerProjectile({
      x:player.x,y:player.y,vx:Math.cos(a)*(superShot?600:520),vy:Math.sin(a)*(superShot?600:520),
      r:superShot?13:6,life:1.55,damage:(14+emberN*4)*(echoed?.72:1),
      color:echoed?COLORS.pink:'#ff789b',pierce:superShot?7:0,
      source:echoed?'echo-star':'ember',split:emberN>=4
    });
  }
}

function fireComet(target, cometN, echoed=false) {
  if(!target) return;
  const base=Math.atan2(target.y-player.y,target.x-player.x);
  const shots=cometN>=2?2:1;
  for(let i=0;i<shots;i++) {
    const a=base+(i-(shots-1)/2)*.10;
    spawnPlayerProjectile({
      x:player.x,y:player.y,vx:Math.cos(a)*610,vy:Math.sin(a)*610,
      r:9+cometN*.8,life:1.85,damage:(25+cometN*6)*(echoed?.68:1),
      color:echoed?COLORS.pink:COLORS.comet,pierce:2+Math.floor(cometN/2),
      source:echoed?'echo-comet':'comet',fragment:cometN>=4,explode:cometN>=6
    });
  }
}

function prismPositions(count) {
  const points=[];
  const orbit=count>=3?76:68;
  for(let i=0;i<count;i++) {
    const a=player.angle*.55+i*TAU/count;
    points.push({x:player.x+Math.cos(a)*orbit,y:player.y+Math.sin(a)*orbit,a});
  }
  return points;
}

function firePrism(prismN, echoed=false) {
  const count=prismN>=6?3:prismN>=2?2:1;
  for(const pos of prismPositions(count)) {
    const target=nearestEnemy(pos.x,pos.y);
    if(!target) continue;
    const a=Math.atan2(target.y-pos.y,target.x-pos.x);
    spawnPlayerProjectile({
      x:pos.x,y:pos.y,vx:Math.cos(a)*540,vy:Math.sin(a)*540,
      r:4.5,life:1.2,damage:(10+prismN*3.2)*(echoed?.65:1),
      color:echoed?COLORS.pink:'#c8b3ff',pierce:prismN>=4?1:0,
      source:echoed?'echo-prism':'prism'
    });
  }
}

function createGravityWells(gravN, echoed=false) {
  const count=gravN>=6?2:1;
  for(let i=0;i<count;i++) {
    const a=player.angle+i*Math.PI+(echoed?.45:0);
    const d=count===2?150:105;
    state.entities.wells.push({
      x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,
      r:gravN>=2?185:135,
      life:gravN>=4?3.8:2.7,max:gravN>=4?3.8:2.7,
      strength:gravN>=2?430:280,
      damage:gravN>=4?(9+gravN*2)*(echoed?.55:1):0,tick:0,color:echoed?COLORS.pink:COLORS.violet
    });
  }
}

function updateWeapons(dt) {
  player.angle += dt * (2.05 + weaponCount('blade')*.12 + weaponCount('prism')*.05) / hasteMult();

  player.coreCd -= dt;
  if(player.coreCd<=0){
    player.coreCd=1.08*hasteMult();
    const target=nearestEnemy(player.x,player.y);
    if(target){spawnCoreShot(target);echoTrigger(()=>spawnCoreShot(target,true));}
  }

  const bladeN = weaponCount('blade');
  if (bladeN) {
    player.bladeTick -= dt;
    if (player.bladeTick <= 0) {
      player.bladeTick = .105 * hasteMult();
      const count = bladeN>=2 ? 2 : 1;
      const orbit = bladeN>=6 ? 108 : 80;
      const bladeR = bladeN>=6 ? 28 : 22;
      for (const e of state.entities.enemies) {
        if(e.dead) continue;
        for(let i=0;i<count;i++) {
          const a=player.angle+i*Math.PI;
          const bx=player.x+Math.cos(a)*orbit, by=player.y+Math.sin(a)*orbit;
          if((e.x-bx)**2+(e.y-by)**2 < (e.r+bladeR)**2) {
            dealDamage(e, 11+bladeN*4, {color:COLORS.cyan,source:'blade'});
            if(bladeN>=4) {
              const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;
              spawnPlayerProjectile({
                x:e.x,y:e.y,vx:dx/d*455,vy:dy/d*455,r:7,life:.28,
                damage:10+bladeN*2,color:COLORS.cyan,pierce:2,source:'wave'
              });
            }
            break;
          }
        }
      }
    }
  }

  const emberN = weaponCount('ember');
  if (emberN) {
    player.emberCd -= dt;
    if(player.emberCd<=0) {
      player.emberCd = (.74 - Math.min(.30,emberN*.038))*hasteMult();
      const target = nearestEnemy(player.x,player.y);
      if(target){fireEmber(target,emberN);echoTrigger(()=>fireEmber(target,emberN,true));}
    }
  }

  const gravN=weaponCount('gravity');
  if(gravN) {
    player.wellCd-=dt;
    if(player.wellCd<=0) {
      player.wellCd=(5.8-Math.min(2.3,gravN*.32))*hasteMult();
      createGravityWells(gravN);
      echoTrigger(()=>createGravityWells(gravN,true));
    }
  }

  const bulwarkN=weaponCount('bulwark');
  if(bulwarkN>=6) {
    player.fortressCd-=dt;
    if(player.fortressCd<=0) {
      player.fortressCd=8;
      player.shield=Math.min(38,player.shield+22);
      shockwave(player.x,player.y,COLORS.green,155,.5,5);
    }
  }

  const cometN=weaponCount('comet');
  if(cometN) {
    player.cometCd-=dt;
    if(player.cometCd<=0) {
      player.cometCd=(1.72-Math.min(.46,cometN*.06))*hasteMult();
      const target=nearestEnemy(player.x,player.y);
      if(target){fireComet(target,cometN);echoTrigger(()=>fireComet(target,cometN,true));}
    }
  }

  const prismN=weaponCount('prism');
  if(prismN) {
    player.prismCd-=dt;
    if(player.prismCd<=0) {
      player.prismCd=(1.18-Math.min(.34,prismN*.045))*hasteMult();
      firePrism(prismN);
      echoTrigger(()=>firePrism(prismN,true));
    }
  }

  const chronoN=weaponCount('chrono');
  if(chronoN>=4) {
    player.chronoCd-=dt;
    if(player.chronoCd<=0) {
      player.chronoCd=(4.8-Math.min(1.4,chronoN*.2))*hasteMult();
      const radius=150+chronoN*16;
      areaDamage(player.x,player.y,radius,8+chronoN*3,COLORS.chrono);
    }
  }
}

function echoTrigger(fn) {
  const n=stat('echo');
  if(!n) return;
  state.echoCycle++;
  const chance=Math.min(.70,.10+n*.075);
  const guaranteed=n>=8&&state.echoCycle%5===0;
  if(guaranteed||Math.random()<chance) {
    fn();
    if(n>=5&&Math.random()<.28) setTimeout(fn,70);
  }
}
