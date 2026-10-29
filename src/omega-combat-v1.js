// Starforge Omega production combat v1.
// Fresh pattern slate: armor cannon, coronal pressure, weak laser drones,
// phase-3 furnace venting, orbiting shed plates, and phase-4 arena heat with debris cover.
(()=>{
  if(window.stackfallOmegaCombat==='v1')return;
  window.stackfallOmegaCombat='v1';

  const FORM='starforge',TAU2=Math.PI*2;
  const PHASE_PLATES={1:[0,1,2,3,4,5,6,7],2:[0,1,2,4,5,6],3:[0,2,4,6],4:[]};
  const CANNON_CD={1:3.0,2:2.3,3:1.65,4:999};
  const DRONE_INTERVAL={1:5,2:4,3:3,4:2},DRONE_CAP={1:5,2:7,3:9,4:10};
  const WIND_CD={1:999,2:7.2,3:6.1,4:5.0};
  const FAN_CD={1:999,2:999,3:4.4,4:999};
  const HEAT_CD={1:999,2:999,3:999,4:7.6};
  const ASTEROID_COUNT=26;

  const isOmega=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const currentOmega=()=>state.entities.enemies?.find(isOmega)||null;
  const phaseOf=e=>Math.max(1,Math.min(4,e?.apexPhase||1));
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const ease=t=>{t=clamp01(t);return t*t*(3-2*t);};
  const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const activePlates=p=>PHASE_PLATES[p]||PHASE_PLATES[1];

  function arenaFor(e){
    const arena=state.apexArena||{x:e.x,y:e.y,r:compactDevice?.()?430:620};
    arena.x=Number.isFinite(arena.x)?arena.x:e.x;arena.y=Number.isFinite(arena.y)?arena.y:e.y;
    arena.r=compactDevice?.()?430:620;arena.form=FORM;state.apexArena=arena;return arena;
  }
  function pointSegDistance(px,py,x1,y1,x2,y2){
    const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1,l2=vx*vx+vy*vy||1,t=Math.max(0,Math.min(1,(wx*vx+wy*vy)/l2)),x=x1+vx*t,y=y1+vy*t;return Math.hypot(px-x,py-y);
  }
  function asteroidPose(arena,index,time){
    const base=index/ASTEROID_COUNT*TAU2,angle=base+time*(.022+(index%4)*.0015),rad=arena.r*(.965+.018*Math.sin(index*2.31+time*.10)),size=12+((index*11)%17);
    return{x:arena.x+Math.cos(angle)*rad,y:arena.y+Math.sin(angle)*rad,size,angle,spin:time*(.10+(index%5)*.013)+index*.73};
  }
  function debrisPose(e,d){const a=d.angle,arena=arenaFor(e);return{x:arena.x+Math.cos(a)*d.radius,y:arena.y+Math.sin(a)*d.radius,size:d.size,angle:a};}

  function combatState(e){
    if(e.omegaCombat)return e.omegaCombat;
    const p=phaseOf(e);return e.omegaCombat={phase:p,cannonCd:1.25,droneCd:1.4,windCd:4.0,fanCd:4.3,heatCd:6.0,cannon:null,wind:null,fan:null,heat:null,debris:[],pendingDebris:[],attackSerial:0,stats:{cannon:0,wind:0,fan:0,heat:0,drones:0}};
  }
  function queueShedPlates(e,s,fromPhase,toPhase){
    const before=new Set(activePlates(fromPhase)),after=new Set(activePlates(toPhase));let delay=.28;
    for(const index of before)if(!after.has(index)&&!s.debris.some(d=>d.index===index)&&!s.pendingDebris.some(d=>d.index===index)){s.pendingDebris.push({index,delay});delay+=.09;}
  }
  function spawnDebris(e,s,index){
    const arena=arenaFor(e),slot=s.debris.length,base=index/8*TAU2;
    s.debris.push({index,angle:base+.10*(slot%2?1:-1),radius:arena.r*(.43+.055*(slot%4)),size:e.r*(index%2===0?.46:.38),speed:(.055+.008*(slot%3))*(slot%2?1:-1),spin:slot*.9,hot:1});
    shockwave?.(e.x,e.y,'#ff7a31',92,.25,2.2);for(let i=0;i<8;i++)spawnParticle?.(e.x+rand(-35,35),e.y+rand(-35,35),'#ff8b39',1,45,3.2);
  }
  function onPhaseChange(e,s,next){
    const prev=s.phase||1;queueShedPlates(e,s,prev,next);s.phase=next;
    s.cannon=null;s.fan=null;if(next===4){s.cannonCd=999;s.fanCd=999;s.heatCd=2.8;}else{s.cannonCd=Math.min(s.cannonCd,CANNON_CD[next]*.55);}
    s.windCd=Math.min(s.windCd,WIND_CD[next]*.7);s.droneCd=Math.min(s.droneCd,DRONE_INTERVAL[next]*.65);
  }

  function selectPlatePair(e,targetAngle){
    const p=phaseOf(e),list=activePlates(p);if(list.length<2)return null;const rot=(e.phase||0)*.025;
    const sorted=list.map(index=>({index,d:angleDelta(index/8*TAU2+rot,targetAngle)})).sort((a,b)=>Math.abs(a.d)-Math.abs(b.d));
    let left=sorted.find(v=>v.d<0),right=sorted.find(v=>v.d>=0);if(!left||!right){left=sorted[0];right=sorted[1];}
    if(left.index===right.index)right=sorted.find(v=>v.index!==left.index)||right;
    return{indices:[left.index,right.index],angle:targetAngle};
  }
  function startPlateCannon(e,s){
    const target=Math.atan2(player.y-e.y,player.x-e.x),pair=selectPlatePair(e,target);if(!pair)return;
    s.cannon={warn:.62,fire:.20,maxWarn:.62,maxFire:.20,angle:target,pair:pair.indices,hit:false};s.stats.cannon++;s.attackSerial++;
    audio?.tone?.(88,.16,'sawtooth',.012,18);
  }
  function startWind(e,s){
    const angle=Math.atan2(player.y-e.y,player.x-e.x);s.wind={warn:.72,active:1.85,maxWarn:.72,maxActive:1.85,angle,tick:0};s.stats.wind++;s.attackSerial++;
  }
  function startFan(e,s){
    const angle=Math.atan2(player.y-e.y,player.x-e.x),pair=selectPlatePair(e,angle);if(!pair)return;
    s.fan={warn:.78,active:1.15,maxWarn:.78,maxActive:1.15,angle,pair:pair.indices,half:.58,tick:0};s.stats.fan++;s.attackSerial++;
  }
  function startGlobalHeat(e,s){
    s.heat={warn:1.18,active:1.38,maxWarn:1.18,maxActive:1.38,tick:0};s.stats.heat++;s.attackSerial++;state.camera.shake=Math.max(state.camera.shake,12.8);audio?.tone?.(52,.32,'sawtooth',.018,24);
  }

  function plateAttackOpening(e,index){
    const s=e?.omegaCombat,attack=s?.cannon||s?.fan;if(!attack||!attack.pair?.includes(index))return null;
    let open=0;if(attack.warn>0)open=ease(1-attack.warn/(attack.maxWarn||.7));else if(attack.fire>0)open=1;else if(attack.active>0)open=1;
    const pair=attack.pair,side=pair.indexOf(index)===0?-1:1;
    return{drift:side*open*.13,outward:e.r*open*.16,alpha:1};
  }
  window.stackfallOmegaCombatPlateTransform=plateAttackOpening;

  function lineHit(e,angle,length,width,damage,key){
    const x2=e.x+Math.cos(angle)*length,y2=e.y+Math.sin(angle)*length;if(pointSegDistance(player.x,player.y,e.x,e.y,x2,y2)<=width*.5+player.r*.55){const s=e.omegaCombat;if(s&&s[key]!==s.attackSerial){s[key]=s.attackSerial;hurtPlayer(damage,e);}}
  }
  function inCone(e,angle,half,range){const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy);return d<=range&&Math.abs(angleDelta(Math.atan2(dy,dx),angle))<=half;}
  function debrisBlocksPlayer(e,s){
    const px=player.x,py=player.y,vx=px-e.x,vy=py-e.y,l2=vx*vx+vy*vy||1;
    for(const d of s.debris){const p=debrisPose(e,d),wx=p.x-e.x,wy=p.y-e.y,t=(wx*vx+wy*vy)/l2;if(t<=.08||t>=.94)continue;const cx=e.x+vx*t,cy=e.y+vy*t;if(Math.hypot(p.x-cx,p.y-cy)<=p.size*.72+10)return true;}return false;
  }

  function spawnDrone(e,s){
    const arena=arenaFor(e),m=spawnEnemy('normal');if(!m)return;const a=Math.random()*TAU2,rr=arena.r*(.44+Math.random()*.18);
    m.x=arena.x+Math.cos(a)*rr;m.y=arena.y+Math.sin(a)*rr;m.type='ranged';m.eventKind='omega-drone';m.omegaOwnerId=e.id;m.noEliteReward=true;m.color='#ff8a4b';m.r=Math.max(8,m.r*.72);m.hp=Math.max(1,m.hp*.58);m.maxHp=m.hp;m.damage=Math.max(3,e.damage*.16);m.speed*=.68;m.rangedCd=999;m.omegaLaserCd=.8+Math.random()*1.2;m.omegaLaser=null;m.xp*=.12;s.stats.drones++;
    shockwave?.(m.x,m.y,'#ff8a4b',45,.20,1.3);
  }
  function omegaDrones(e){return state.entities.enemies.filter(m=>!m.dead&&m.eventKind==='omega-drone'&&(m.omegaOwnerId===e.id||m.omegaOwnerId==null));}
  function updateDrones(e,dt){
    for(const m of omegaDrones(e)){
      m.omegaOwnerId=e.id;m.rangedCd=999;
      const laser=m.omegaLaser;
      if(laser){
        if(laser.warn>0){laser.warn-=dt;if(laser.warn<=0){laser.fire=.14;laser.hit=false;state.camera.shake=Math.max(state.camera.shake,3.5);}}
        else if(laser.fire>0){laser.fire-=dt;if(!laser.hit){const length=760;if(pointSegDistance(player.x,player.y,m.x,m.y,m.x+Math.cos(laser.angle)*length,m.y+Math.sin(laser.angle)*length)<12+player.r*.45){laser.hit=true;hurtPlayer(m.damage,m);}}if(laser.fire<=0){m.omegaLaser=null;m.omegaLaserCd=2.1+Math.random()*1.2;}}
        continue;
      }
      m.omegaLaserCd=(m.omegaLaserCd??1)-dt;if(m.omegaLaserCd<=0){m.omegaLaser={warn:1.0,maxWarn:1.0,fire:0,angle:Math.atan2(player.y-m.y,player.x-m.x),hit:false};}
    }
  }

  function updateArenaBoundary(e,dt){
    const arena=arenaFor(e),dx=player.x-arena.x,dy=player.y-arena.y,d=Math.hypot(dx,dy)||1,limit=arena.r-46;
    if(d>limit){const excess=d-limit,pull=(75+excess*5.8)*dt;player.x-=dx/d*pull;player.y-=dy/d*pull;}
    const now=(state.time||0);if(d>arena.r*.82){
      for(let i=0;i<ASTEROID_COUNT;i++){const a=asteroidPose(arena,i,now),dist=Math.hypot(player.x-a.x,player.y-a.y),hit=a.size+player.r*.72;if(dist<hit){const inward=Math.min(7,(hit-dist)*.32+1.2);player.x-=dx/d*inward;player.y-=dy/d*inward;}}
    }
  }
  function updateDebris(e,s,dt){
    for(const q of s.pendingDebris)q.delay-=dt;for(let i=s.pendingDebris.length-1;i>=0;i--)if(s.pendingDebris[i].delay<=0){spawnDebris(e,s,s.pendingDebris[i].index);s.pendingDebris.splice(i,1);}
    for(const d of s.debris){d.angle+=d.speed*dt;d.spin+=dt*(.65+(d.index%3)*.12);d.hot=Math.max(.18,d.hot-dt*.055);const p=debrisPose(e,d),dist=Math.hypot(player.x-p.x,player.y-p.y);if(dist<d.size+player.r*.65){const arena=arenaFor(e),dx=player.x-arena.x,dy=player.y-arena.y,dd=Math.hypot(dx,dy)||1;player.x-=dx/dd*Math.min(5,(d.size+player.r*.65-dist)*.3+1);player.y-=dy/dd*Math.min(5,(d.size+player.r*.65-dist)*.3+1);}}
  }

  function updateCannon(e,s,dt){
    const a=s.cannon;if(!a)return;const arena=arenaFor(e),length=arena.r*1.22;
    if(a.warn>0){a.warn-=dt;if(a.warn<=0){a.fire=a.maxFire;state.camera.shake=Math.max(state.camera.shake,12.4);state.flash=Math.max(state.flash,.10);audio?.tone?.(112,.12,'sawtooth',.018,35);}}
    else if(a.fire>0){a.fire-=dt;lineHit(e,a.angle,length,28,Math.max(9,e.damage*.62),'omegaCannonHitSerial');if(Math.random()<dt*52){const rr=rand(40,length*.9);spawnParticle?.(e.x+Math.cos(a.angle)*rr+rand(-10,10),e.y+Math.sin(a.angle)*rr+rand(-10,10),Math.random()<.45?'#fff0a4':'#ff6a22',1,70,3.8);}if(a.fire<=0)s.cannon=null;}
  }
  function updateWind(e,s,dt){
    const w=s.wind;if(!w)return;const arena=arenaFor(e);
    if(w.warn>0){w.warn-=dt;return;}w.active-=dt;if(inCone(e,w.angle,.92,arena.r*1.08)){const push=(96+phaseOf(e)*14)*dt;player.x+=Math.cos(w.angle)*push;player.y+=Math.sin(w.angle)*push;w.tick-=dt;if(w.tick<=0){w.tick=.44;hurtPlayer(Math.max(4,e.damage*.18),e);}}if(Math.random()<dt*18){const a=w.angle+rand(-.78,.78),rr=rand(80,arena.r*.85);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,Math.random()<.5?'#ffb34d':'#ff5b24',1,55,3.4);}if(w.active<=0)s.wind=null;
  }
  function updateFan(e,s,dt){
    const f=s.fan;if(!f)return;const arena=arenaFor(e);
    if(f.warn>0){f.warn-=dt;return;}f.active-=dt;if(inCone(e,f.angle,f.half,arena.r*.76)){f.tick-=dt;if(f.tick<=0){f.tick=.32;hurtPlayer(Math.max(5,e.damage*.25),e);const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;player.x+=dx/d*18;player.y+=dy/d*18;}}if(Math.random()<dt*30){const a=f.angle+rand(-f.half,f.half),rr=rand(e.r*.7,arena.r*.70);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,Math.random()<.38?'#fff0a0':'#ff6424',1,62,3.8);}if(f.active<=0)s.fan=null;
  }
  function updateGlobalHeat(e,s,dt){
    const h=s.heat;if(!h)return;if(h.warn>0){h.warn-=dt;if(Math.random()<dt*16)spawnParticle?.(e.x+rand(-60,60),e.y+rand(-60,60),'#ff9b3e',1,62,4);return;}
    h.active-=dt;h.tick-=dt;if(h.tick<=0){h.tick=.38;if(!debrisBlocksPlayer(e,s))hurtPlayer(Math.max(6,e.damage*.23),e);}if(Math.random()<dt*38){const arena=arenaFor(e),a=Math.random()*TAU2,rr=rand(e.r*.8,arena.r*.92);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,Math.random()<.35?'#fff0a0':'#ff4f1d',1,70,4.2);}if(h.active<=0)s.heat=null;
  }

  function updateOmegaCombat(e,dt){
    if(!isOmega(e)||state.mode!=='playing')return;const s=combatState(e),phase=phaseOf(e);arenaFor(e);if(s.phase!==phase)onPhaseChange(e,s,phase);
    updateArenaBoundary(e,dt);updateDebris(e,s,dt);updateDrones(e,dt);updateCannon(e,s,dt);updateWind(e,s,dt);updateFan(e,s,dt);updateGlobalHeat(e,s,dt);
    const contactSafe=(e.contactSafeUntil||0)>(state.time||0);if(contactSafe)return;
    const drones=omegaDrones(e);s.droneCd-=dt;if(drones.length<DRONE_CAP[phase]&&s.droneCd<=0){spawnDrone(e,s);s.droneCd=DRONE_INTERVAL[phase];}
    if(!s.cannon&&!s.fan&&phase<4){s.cannonCd-=dt;if(s.cannonCd<=0){startPlateCannon(e,s);s.cannonCd=CANNON_CD[phase];}}
    if(!s.wind&&phase>=2){s.windCd-=dt;if(s.windCd<=0){startWind(e,s);s.windCd=WIND_CD[phase];}}
    if(phase===3&&!s.fan&&!s.cannon){s.fanCd-=dt;if(s.fanCd<=0){startFan(e,s);s.fanCd=FAN_CD[phase];}}
    if(phase===4&&!s.heat){s.heatCd-=dt;if(s.heatCd<=0){startGlobalHeat(e,s);s.heatCd=HEAT_CD[phase];}}
  }

  const baseApexBossSkill=typeof apexBossSkill==='function'?apexBossSkill:null;
  if(baseApexBossSkill)apexBossSkill=function omegaProductionCombatSkill(e,dt){const result=baseApexBossSkill(e,dt);if(isOmega(e))updateOmegaCombat(e,dt);return result;};

  function drawRock(g,size,seed,hot=.18){g.beginPath();for(let i=0;i<7;i++){const a=i/7*TAU2,rr=size*(.72+.22*Math.sin(seed*2.1+i*4.73));const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fillStyle='#160d0b';g.strokeStyle=`rgba(255,112,55,${.18+.35*hot})`;g.lineWidth=1.4;g.fill();g.stroke();}
  function drawArena(e){
    const arena=arenaFor(e),p=worldToScreen(arena.x,arena.y),now=state.time||0;ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=.28;ctx.strokeStyle='#b84c2b';ctx.lineWidth=1.2;ctx.setLineDash([4,13]);ctx.beginPath();ctx.arc(0,0,arena.r,0,TAU2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    for(let i=0;i<ASTEROID_COUNT;i++){const a=asteroidPose(arena,i,now),sp=worldToScreen(a.x,a.y);ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(a.spin);drawRock(ctx,a.size,i*.77,.12);ctx.restore();}
  }
  function drawDebris(e,s){
    for(const d of s.debris){const p=debrisPose(e,d),sp=worldToScreen(p.x,p.y);ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(d.spin);ctx.globalAlpha=.94;ctx.fillStyle='#24100c';ctx.strokeStyle=`rgba(255,126,55,${.35+.45*d.hot})`;ctx.lineWidth=2.5;ctx.shadowColor='#ff5b20';ctx.shadowBlur=8*d.hot;ctx.beginPath();ctx.moveTo(-d.size*.82,-d.size*.28);ctx.lineTo(d.size*.60,-d.size*.45);ctx.lineTo(d.size*.93,0);ctx.lineTo(d.size*.52,d.size*.42);ctx.lineTo(-d.size*.78,d.size*.25);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.restore();}
  }
  function drawCannon(e,s){
    const a=s.cannon;if(!a)return;const arena=arenaFor(e),p=worldToScreen(e.x,e.y),length=arena.r*1.22,end={x:p.x+Math.cos(a.angle)*length,y:p.y+Math.sin(a.angle)*length};ctx.save();ctx.globalCompositeOperation='lighter';
    if(a.warn>0){const q=ease(1-a.warn/a.maxWarn);ctx.globalAlpha=.25+.42*q;ctx.strokeStyle='#ff9a42';ctx.lineWidth=2+q*2;ctx.setLineDash([12,10]);ctx.lineDashOffset=-performance.now()/28;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=`rgba(255,95,25,${.10+.18*q})`;ctx.beginPath();ctx.arc(p.x,p.y,e.r*(.62+.18*q),0,TAU2);ctx.fill();}
    else{ctx.shadowColor='#ff531c';ctx.shadowBlur=28;ctx.globalAlpha=.30;ctx.strokeStyle='#ff2e12';ctx.lineWidth=34;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.globalAlpha=.80;ctx.strokeStyle='#ff9b35';ctx.lineWidth=18;ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#fff5ba';ctx.lineWidth=5;ctx.stroke();for(const off of[-12,12]){ctx.globalAlpha=.33;ctx.strokeStyle='#ff6b22';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x-Math.sin(a.angle)*off,p.y+Math.cos(a.angle)*off);ctx.quadraticCurveTo((p.x+end.x)/2+rand(-12,12),(p.y+end.y)/2+rand(-12,12),end.x,end.y);ctx.stroke();}}
    ctx.restore();
  }
  function drawWind(e,s){
    const w=s.wind;if(!w)return;const arena=arenaFor(e),p=worldToScreen(e.x,e.y),active=w.warn<=0,q=active?1:ease(1-w.warn/w.maxWarn);ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(p.x,p.y);ctx.rotate(w.angle);ctx.globalAlpha=active?.12:.06+.06*q;ctx.fillStyle='#ff6324';ctx.beginPath();ctx.moveTo(e.r*.45,0);ctx.arc(0,0,arena.r*1.02,-.92,.92);ctx.closePath();ctx.fill();for(let i=-5;i<=5;i++){const y=i*20,curve=(i%2?1:-1)*25;ctx.globalAlpha=(active?.26:.12)*(.65+q*.35);ctx.strokeStyle=i%3===0?'#ffd26a':'#ff7a31';ctx.lineWidth=i%3===0?3:1.5;ctx.beginPath();ctx.moveTo(e.r*.5,y*.3);ctx.bezierCurveTo(arena.r*.28,y+curve,arena.r*.62,y-curve,arena.r*.96,y);ctx.stroke();}ctx.restore();
  }
  function drawFan(e,s){
    const f=s.fan;if(!f)return;const arena=arenaFor(e),p=worldToScreen(e.x,e.y),q=f.warn>0?ease(1-f.warn/f.maxWarn):1,active=f.warn<=0;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(f.angle);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=active?.18:.07+.08*q;const grad=ctx.createLinearGradient(e.r*.5,0,arena.r*.74,0);grad.addColorStop(0,'rgba(255,245,180,.72)');grad.addColorStop(.35,'rgba(255,116,36,.46)');grad.addColorStop(1,'rgba(150,15,2,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(e.r*.42,0);ctx.arc(0,0,arena.r*.76,-f.half,f.half);ctx.closePath();ctx.fill();for(let i=0;i<8;i++){const a=-f.half+(i+.5)/8*(f.half*2);ctx.globalAlpha=(active?.42:.18)*q;ctx.strokeStyle=i%2?'#ff9c3d':'#ffe08a';ctx.lineWidth=1.5+(i%3);ctx.beginPath();ctx.moveTo(Math.cos(a)*e.r*.55,Math.sin(a)*e.r*.55);ctx.quadraticCurveTo(Math.cos(a*.75)*arena.r*.38,Math.sin(a*.75)*arena.r*.38,Math.cos(a)*arena.r*.72,Math.sin(a)*arena.r*.72);ctx.stroke();}ctx.restore();
  }
  function drawDroneLasers(e){
    for(const m of omegaDrones(e)){const l=m.omegaLaser;if(!l)continue;const p=worldToScreen(m.x,m.y),length=760,end={x:p.x+Math.cos(l.angle)*length,y:p.y+Math.sin(l.angle)*length};ctx.save();ctx.globalCompositeOperation='lighter';if(l.warn>0){const q=ease(1-l.warn/l.maxWarn);ctx.globalAlpha=.25+.50*q;ctx.strokeStyle='#ff7340';ctx.lineWidth=1.5+q*1.5;ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.setLineDash([]);}else{ctx.globalAlpha=.40;ctx.strokeStyle='#ff351e';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#ffe2a0';ctx.lineWidth=3;ctx.stroke();}ctx.restore();}
  }
  function drawHeatShadows(e,s,alpha){
    const arena=arenaFor(e);for(const d of s.debris){const p=debrisPose(e,d),dx=p.x-e.x,dy=p.y-e.y,dd=Math.hypot(dx,dy)||1,ux=dx/dd,uy=dy/dd,nx=-uy,ny=ux,startL=d.size*.70,endL=d.size*1.65,far=Math.max(0,arena.r-dd)+80;const a1=worldToScreen(p.x+nx*startL,p.y+ny*startL),a2=worldToScreen(p.x-nx*startL,p.y-ny*startL),b1=worldToScreen(p.x+ux*far+nx*endL,p.y+uy*far+ny*endL),b2=worldToScreen(p.x+ux*far-nx*endL,p.y+uy*far-ny*endL);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#040306';ctx.beginPath();ctx.moveTo(a1.x,a1.y);ctx.lineTo(a2.x,a2.y);ctx.lineTo(b2.x,b2.y);ctx.lineTo(b1.x,b1.y);ctx.closePath();ctx.fill();ctx.restore();}}
  function drawGlobalHeat(e,s){
    const h=s.heat;if(!h)return;const arena=arenaFor(e),p=worldToScreen(arena.x,arena.y),active=h.warn<=0,q=active?1:ease(1-h.warn/h.maxWarn),pulse=.5+.5*Math.sin(performance.now()*.018);ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,arena.r,0,TAU2);ctx.clip();const g=ctx.createRadialGradient(p.x,p.y,e.r*.4,p.x,p.y,arena.r);g.addColorStop(0,`rgba(255,245,170,${active?.30:.10*q})`);g.addColorStop(.35,`rgba(255,91,25,${active?.24:.07*q})`);g.addColorStop(1,`rgba(112,10,4,${active?.18:.04*q})`);ctx.fillStyle=g;ctx.fillRect(p.x-arena.r,p.y-arena.r,arena.r*2,arena.r*2);ctx.globalCompositeOperation='lighter';for(let i=0;i<28;i++){const a=i/28*TAU2+performance.now()*.0004,inner=e.r*.7,outer=arena.r*(.75+.20*((i%4)/3));ctx.globalAlpha=(active?.18:.07*q)*(.7+.3*pulse);ctx.strokeStyle=i%3?'#ff6b24':'#ffd26d';ctx.lineWidth=i%5===0?3:1.2;ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*inner,p.y+Math.sin(a)*inner);ctx.lineTo(p.x+Math.cos(a+.025*Math.sin(i))*outer,p.y+Math.sin(a+.025*Math.sin(i))*outer);ctx.stroke();}ctx.restore();drawHeatShadows(e,s,active?.82:.42*q);
  }
  function drawOmegaCombat(){
    const e=currentOmega();if(!e||state.mode!=='playing')return;const s=combatState(e);ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);drawArena(e);drawDebris(e,s);drawCannon(e,s);drawWind(e,s);drawFan(e,s);drawDroneLasers(e);drawGlobalHeat(e,s);ctx.restore();
  }
  const baseForeground=typeof window.drawForegroundCombat==='function'?window.drawForegroundCombat:null;
  if(baseForeground)window.drawForegroundCombat=function omegaForeground(){baseForeground();drawOmegaCombat();};

  window.stackfallOmegaCombatTest={
    forcePattern(name){const e=currentOmega();if(!e)return false;const s=combatState(e);if(name==='cannon')startPlateCannon(e,s);else if(name==='wind')startWind(e,s);else if(name==='fan')startFan(e,s);else if(name==='heat')startGlobalHeat(e,s);else if(name==='drone')spawnDrone(e,s);else return false;return true;},
    forceDebris(){const e=currentOmega();if(!e)return false;const s=combatState(e);for(let i=0;i<8;i++)if(!s.debris.some(d=>d.index===i))spawnDebris(e,s,i);return true;}
  };
  window.stackfallOmegaCombatDiagnostics=()=>{const e=currentOmega();if(!e)return null;const s=combatState(e),phase=phaseOf(e);return{version:'v1',phase,arenaRadius:arenaFor(e).r,droneCount:omegaDrones(e).length,droneCap:DRONE_CAP[phase],droneInterval:DRONE_INTERVAL[phase],cannonCooldown:CANNON_CD[phase],windEnabled:phase>=2,fanEnabled:phase===3,globalHeatEnabled:phase===4,debrisCount:s.debris.length,pendingDebris:s.pendingDebris.length,active:{cannon:!!s.cannon,wind:!!s.wind,fan:!!s.fan,heat:!!s.heat},stats:{...s.stats}};};
})();
