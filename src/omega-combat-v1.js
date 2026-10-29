// Starforge Omega production combat v2.
// Armor-breach cannon, arena-wide stellar wind, dedicated ember drones,
// missing-sector furnace vents, a physical asteroid wall, orbiting shed plates,
// and phase-4 arena heat with debris cover.
(()=>{
  if(window.stackfallOmegaCombat==='v2')return;
  window.stackfallOmegaCombat='v2';

  const FORM='starforge',TAU2=Math.PI*2;
  const PHASE_PLATES={1:[0,1,2,3,4,5,6,7],2:[0,1,2,4,5,6],3:[0,2,4,6],4:[]};
  const CANNON_CD={1:3.0,2:2.3,3:1.65,4:999};
  const DRONE_INTERVAL={1:5,2:4,3:3,4:2},DRONE_CAP={1:5,2:7,3:9,4:10};
  const WIND_CD={1:999,2:7.0,3:5.8,4:4.7};
  const FAN_CD={1:999,2:999,3:4.2,4:999};
  const HEAT_CD={1:999,2:999,3:999,4:7.4};
  const ASTEROID_COUNT=18;

  const isOmega=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const currentOmega=()=>state.entities.enemies?.find(isOmega)||null;
  const phaseOf=e=>Math.max(1,Math.min(4,e?.apexPhase||1));
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const ease=t=>{t=clamp01(t);return t*t*(3-2*t);};
  const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const activePlates=p=>PHASE_PLATES[p]||PHASE_PLATES[1];
  const missingPlates=p=>{const set=new Set(activePlates(p)),out=[];for(let i=0;i<8;i++)if(!set.has(i))out.push(i);return out;};

  function arenaFor(e){
    const arena=state.apexArena||{x:e.x,y:e.y,r:compactDevice?.()?430:620};
    arena.x=Number.isFinite(arena.x)?arena.x:e.x;arena.y=Number.isFinite(arena.y)?arena.y:e.y;
    arena.r=compactDevice?.()?430:620;arena.form=FORM;state.apexArena=arena;return arena;
  }
  function pointSegDistance(px,py,x1,y1,x2,y2){
    const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1,l2=vx*vx+vy*vy||1,t=Math.max(0,Math.min(1,(wx*vx+wy*vy)/l2)),x=x1+vx*t,y=y1+vy*t;return Math.hypot(px-x,py-y);
  }
  function asteroidPose(arena,index,time){
    const base=index/ASTEROID_COUNT*TAU2,angle=base+time*(.016+(index%3)*.0018),rad=arena.r*(.895+.018*Math.sin(index*2.17+time*.09)),size=42+((index*19)%31);
    return{x:arena.x+Math.cos(angle)*rad,y:arena.y+Math.sin(angle)*rad,size,angle,spin:time*(.055+(index%5)*.008)+index*.73};
  }
  function debrisPose(e,d){const arena=arenaFor(e);return{x:arena.x+Math.cos(d.angle)*d.radius,y:arena.y+Math.sin(d.angle)*d.radius,size:d.size,angle:d.angle};}

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
    shockwave?.(e.x,e.y,'#ff7a31',92,.25,2.2);for(let i=0;i<10;i++)spawnParticle?.(e.x+rand(-35,35),e.y+rand(-35,35),i%3?'#ff8b39':'#ffe37e',1,48,3.4);
  }
  function onPhaseChange(e,s,next){
    const prev=s.phase||1;queueShedPlates(e,s,prev,next);s.phase=next;s.cannon=null;s.fan=null;
    if(next===4){s.cannonCd=999;s.fanCd=999;s.heatCd=2.8;}else s.cannonCd=Math.min(s.cannonCd,CANNON_CD[next]*.55);
    s.windCd=Math.min(s.windCd,WIND_CD[next]*.7);s.droneCd=Math.min(s.droneCd,DRONE_INTERVAL[next]*.65);
  }

  function plateAngle(e,index){return index/8*TAU2+(e.phase||0)*.025;}
  function selectCannonPlate(e,targetAngle){
    const list=activePlates(phaseOf(e));if(!list.length)return null;
    return list.map(index=>({index,angle:plateAngle(e,index),d:Math.abs(angleDelta(plateAngle(e,index),targetAngle))})).sort((a,b)=>a.d-b.d)[0];
  }
  function selectMissingSector(e,targetAngle){
    const list=missingPlates(phaseOf(e));if(!list.length)return null;
    return list.map(index=>({index,angle:plateAngle(e,index),d:Math.abs(angleDelta(plateAngle(e,index),targetAngle))})).sort((a,b)=>a.d-b.d)[0];
  }
  function startPlateCannon(e,s){
    const pick=selectCannonPlate(e,Math.atan2(player.y-e.y,player.x-e.x));if(!pick)return;
    s.cannon={warn:.72,fire:.24,maxWarn:.72,maxFire:.24,angle:pick.angle,plate:pick.index,hit:false};s.stats.cannon++;s.attackSerial++;
    audio?.tone?.(78,.18,'sawtooth',.014,22);
  }
  function startWind(e,s){
    const angle=Math.atan2(player.y-e.y,player.x-e.x)+rand(-.35,.35);
    s.wind={warn:.92,active:1.72,maxWarn:.92,maxActive:1.72,angle,tick:0,front:0};s.stats.wind++;s.attackSerial++;
    audio?.tone?.(46,.34,'sawtooth',.012,18);
  }
  function startFan(e,s){
    const gap=selectMissingSector(e,Math.atan2(player.y-e.y,player.x-e.x));if(!gap)return;
    s.fan={warn:.82,active:1.06,maxWarn:.82,maxActive:1.06,angle:gap.angle,gapIndex:gap.index,half:.53,tick:0,burst:false};s.stats.fan++;s.attackSerial++;
  }
  function startGlobalHeat(e,s){
    s.heat={warn:1.18,active:1.38,maxWarn:1.18,maxActive:1.38,tick:0};s.stats.heat++;s.attackSerial++;state.camera.shake=Math.max(state.camera.shake,12.8);audio?.tone?.(52,.32,'sawtooth',.018,24);
  }

  function plateAttackOpening(e,index){
    const a=e?.omegaCombat?.cannon;if(!a||a.plate!==index)return null;
    let open=0;if(a.warn>0)open=ease(1-a.warn/a.maxWarn);else if(a.fire>0)open=1;
    return{split:open,alpha:1};
  }
  window.stackfallOmegaCombatPlateTransform=plateAttackOpening;

  function lineHit(e,angle,length,width,damage,key){
    const x2=e.x+Math.cos(angle)*length,y2=e.y+Math.sin(angle)*length;
    if(pointSegDistance(player.x,player.y,e.x,e.y,x2,y2)<=width*.5+player.r*.55){const s=e.omegaCombat;if(s&&s[key]!==s.attackSerial){s[key]=s.attackSerial;hurtPlayer(damage,e);}}
  }
  function inCone(e,angle,half,range){const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy);return d<=range&&Math.abs(angleDelta(Math.atan2(dy,dx),angle))<=half;}
  function debrisBlocksPlayer(e,s){
    const px=player.x,py=player.y,vx=px-e.x,vy=py-e.y,l2=vx*vx+vy*vy||1;
    for(const d of s.debris){const p=debrisPose(e,d),wx=p.x-e.x,wy=p.y-e.y,t=(wx*vx+wy*vy)/l2;if(t<=.08||t>=.94)continue;const cx=e.x+vx*t,cy=e.y+vy*t;if(Math.hypot(p.x-cx,p.y-cy)<=p.size*.72+10)return true;}return false;
  }

  function spawnDrone(e,s){
    const arena=arenaFor(e),m=spawnEnemy('normal');if(!m)return;const a=Math.random()*TAU2,rr=arena.r*(.44+Math.random()*.18);
    m.x=arena.x+Math.cos(a)*rr;m.y=arena.y+Math.sin(a)*rr;m.type='ranged';m.eventKind='omega-drone';m.omegaOwnerId=e.id;m.noEliteReward=true;
    m.color='#ff7a24';m.omegaVisualR=13+Math.random()*2;m.r=Math.max(4.5,m.r*.34);m.hp=Math.max(1,m.hp*.55);m.maxHp=m.hp;m.damage=Math.max(3,e.damage*.16);m.speed*=.68;m.rangedCd=999;m.omegaLaserCd=.8+Math.random()*1.2;m.omegaLaser=null;m.xp*=.12;s.stats.drones++;
    shockwave?.(m.x,m.y,'#ff7a24',48,.20,1.4);
  }
  function omegaDrones(e){return state.entities.enemies.filter(m=>!m.dead&&m.eventKind==='omega-drone'&&(m.omegaOwnerId===e.id||m.omegaOwnerId==null));}
  function updateDrones(e,dt){
    for(const m of omegaDrones(e)){
      m.omegaOwnerId=e.id;m.rangedCd=999;const laser=m.omegaLaser;
      if(laser){
        if(laser.warn>0){laser.warn-=dt;if(laser.warn<=0){laser.fire=.14;laser.hit=false;state.camera.shake=Math.max(state.camera.shake,3.5);}}
        else if(laser.fire>0){laser.fire-=dt;if(!laser.hit){const length=760;if(pointSegDistance(player.x,player.y,m.x,m.y,m.x+Math.cos(laser.angle)*length,m.y+Math.sin(laser.angle)*length)<11+player.r*.45){laser.hit=true;hurtPlayer(m.damage,m);}}if(laser.fire<=0){m.omegaLaser=null;m.omegaLaserCd=2.1+Math.random()*1.2;}}
        continue;
      }
      m.omegaLaserCd=(m.omegaLaserCd??1)-dt;if(m.omegaLaserCd<=0)m.omegaLaser={warn:1.0,maxWarn:1.0,fire:0,angle:Math.atan2(player.y-m.y,player.x-m.x),hit:false};
    }
  }

  function updateArenaBoundary(e,dt){
    const arena=arenaFor(e),dx=player.x-arena.x,dy=player.y-arena.y,d=Math.hypot(dx,dy)||1,limit=arena.r*.79;
    if(d>limit){const excess=d-limit,pull=(180+excess*12)*dt;player.x-=dx/d*pull;player.y-=dy/d*pull;}
    const now=state.time||0;
    if(d>arena.r*.70){
      for(let i=0;i<ASTEROID_COUNT;i++){
        const a=asteroidPose(arena,i,now),dist=Math.hypot(player.x-a.x,player.y-a.y),hit=a.size*.84+player.r*.82;
        if(dist<hit){const nx=(player.x-a.x)/(dist||1),ny=(player.y-a.y)/(dist||1),push=Math.min(11,(hit-dist)*.52+2);player.x+=nx*push;player.y+=ny*push;}
      }
    }
  }
  function updateDebris(e,s,dt){
    for(const q of s.pendingDebris)q.delay-=dt;
    for(let i=s.pendingDebris.length-1;i>=0;i--)if(s.pendingDebris[i].delay<=0){spawnDebris(e,s,s.pendingDebris[i].index);s.pendingDebris.splice(i,1);}
    for(const d of s.debris){
      d.angle+=d.speed*dt;d.spin+=dt*(.65+(d.index%3)*.12);d.hot=Math.max(.18,d.hot-dt*.055);const p=debrisPose(e,d),dist=Math.hypot(player.x-p.x,player.y-p.y);
      if(dist<d.size+player.r*.65){const arena=arenaFor(e),dx=player.x-arena.x,dy=player.y-arena.y,dd=Math.hypot(dx,dy)||1;player.x-=dx/dd*Math.min(5,(d.size+player.r*.65-dist)*.3+1);player.y-=dy/dd*Math.min(5,(d.size+player.r*.65-dist)*.3+1);}
    }
  }

  function updateCannon(e,s,dt){
    const a=s.cannon;if(!a)return;const arena=arenaFor(e),length=arena.r*1.28;
    if(a.warn>0){a.warn-=dt;if(a.warn<=0){a.fire=a.maxFire;state.camera.shake=Math.max(state.camera.shake,13.2);state.flash=Math.max(state.flash,.14);audio?.tone?.(118,.13,'sawtooth',.020,38);for(let i=0;i<18;i++)spawnParticle?.(e.x+Math.cos(a.angle)*e.r*.7+rand(-12,12),e.y+Math.sin(a.angle)*e.r*.7+rand(-12,12),i%3?'#ff7625':'#fff0a0',1,85,4.2);}}
    else if(a.fire>0){
      a.fire-=dt;lineHit(e,a.angle,length,30,Math.max(9,e.damage*.62),'omegaCannonHitSerial');
      if(Math.random()<dt*65){const rr=rand(e.r*.7,length*.92);spawnParticle?.(e.x+Math.cos(a.angle)*rr+rand(-12,12),e.y+Math.sin(a.angle)*rr+rand(-12,12),Math.random()<.38?'#fff3b0':'#ff5d1e',1,76,4.0);}
      if(a.fire<=0)s.cannon=null;
    }
  }
  function updateWind(e,s,dt){
    const w=s.wind;if(!w)return;const arena=arenaFor(e);
    if(w.warn>0){w.warn-=dt;if(w.warn<=0){state.camera.shake=Math.max(state.camera.shake,11.6);state.flash=Math.max(state.flash,.08);for(let i=0;i<24;i++){const a=Math.random()*TAU2,rr=Math.sqrt(Math.random())*arena.r*.88;spawnParticle?.(arena.x+Math.cos(a)*rr,arena.y+Math.sin(a)*rr,i%3?'#ff8a32':'#ffd86d',1,70,3.8);}}return;}
    w.active-=dt;w.front=1-w.active/w.maxActive;
    const push=(82+phaseOf(e)*14)*dt;player.x+=Math.cos(w.angle)*push;player.y+=Math.sin(w.angle)*push;w.tick-=dt;if(w.tick<=0){w.tick=.46;hurtPlayer(Math.max(4,e.damage*.17),e);}
    if(Math.random()<dt*46){const along=rand(-arena.r*.9,arena.r*.9),cross=rand(-arena.r*.78,arena.r*.78),ux=Math.cos(w.angle),uy=Math.sin(w.angle),nx=-uy,ny=ux;spawnParticle?.(arena.x+ux*along+nx*cross,arena.y+uy*along+ny*cross,Math.random()<.36?'#ffe08a':'#ff6a24',1,72,3.7);}
    if(w.active<=0)s.wind=null;
  }
  function updateFan(e,s,dt){
    const f=s.fan;if(!f)return;const arena=arenaFor(e);
    if(f.warn>0){
      f.warn-=dt;
      if(f.warn<=0&&!f.burst){f.burst=true;state.camera.shake=Math.max(state.camera.shake,13.8);state.flash=Math.max(state.flash,.12);audio?.tone?.(68,.18,'sawtooth',.018,31);for(let i=0;i<30;i++){const a=f.angle+rand(-f.half*.72,f.half*.72),rr=rand(e.r*.55,e.r*1.55);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,i%4===0?'#fff3b2':i%2?'#ff9a3b':'#ff4b18',1,86,4.5);}}
      return;
    }
    f.active-=dt;if(inCone(e,f.angle,f.half,arena.r*.78)){f.tick-=dt;if(f.tick<=0){f.tick=.28;hurtPlayer(Math.max(5,e.damage*.26),e);const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;player.x+=dx/d*20;player.y+=dy/d*20;}}
    if(Math.random()<dt*56){const a=f.angle+rand(-f.half,f.half),rr=rand(e.r*.75,arena.r*.74);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,Math.random()<.30?'#fff1a0':Math.random()<.5?'#ff9a32':'#ff3d16',1,78,4.4);}
    if(f.active<=0)s.fan=null;
  }
  function updateGlobalHeat(e,s,dt){
    const h=s.heat;if(!h)return;
    if(h.warn>0){h.warn-=dt;if(Math.random()<dt*18)spawnParticle?.(e.x+rand(-70,70),e.y+rand(-70,70),'#ff9b3e',1,66,4.2);return;}
    h.active-=dt;h.tick-=dt;if(h.tick<=0){h.tick=.38;if(!debrisBlocksPlayer(e,s))hurtPlayer(Math.max(6,e.damage*.23),e);}
    if(Math.random()<dt*42){const arena=arenaFor(e),a=Math.random()*TAU2,rr=rand(e.r*.8,arena.r*.92);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,Math.random()<.35?'#fff0a0':'#ff4f1d',1,72,4.3);}if(h.active<=0)s.heat=null;
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

  function drawRock(g,size,seed,hot=.18){
    g.beginPath();for(let i=0;i<9;i++){const a=i/9*TAU2,rr=size*(.72+.24*Math.sin(seed*2.1+i*4.73));const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();
    const grad=g.createRadialGradient(-size*.22,-size*.18,size*.06,0,0,size);grad.addColorStop(0,'#33201a');grad.addColorStop(.5,'#160d0b');grad.addColorStop(1,'#090605');g.fillStyle=grad;g.strokeStyle=`rgba(255,112,55,${.16+.32*hot})`;g.lineWidth=2.2;g.fill();g.stroke();
    g.globalAlpha=.38;g.fillStyle='#070505';for(let i=0;i<3;i++){const a=seed*1.7+i*2.1,rr=size*(.22+.13*i),cr=size*(.08+.03*(i%2));g.beginPath();g.arc(Math.cos(a)*rr,Math.sin(a)*rr,cr,0,TAU2);g.fill();}g.globalAlpha=1;
  }
  function drawArena(e){
    const arena=arenaFor(e),now=state.time||0;
    for(let i=0;i<ASTEROID_COUNT;i++){const a=asteroidPose(arena,i,now),sp=worldToScreen(a.x,a.y);ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(a.spin);ctx.shadowColor='#3a1209';ctx.shadowBlur=9;drawRock(ctx,a.size,i*.77,.12);ctx.restore();}
  }
  function drawDebris(e,s){
    for(const d of s.debris){const p=debrisPose(e,d),sp=worldToScreen(p.x,p.y);ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(d.spin);ctx.globalAlpha=.94;ctx.fillStyle='#24100c';ctx.strokeStyle=`rgba(255,126,55,${.35+.45*d.hot})`;ctx.lineWidth=2.5;ctx.shadowColor='#ff5b20';ctx.shadowBlur=8*d.hot;ctx.beginPath();ctx.moveTo(-d.size*.82,-d.size*.28);ctx.lineTo(d.size*.60,-d.size*.45);ctx.lineTo(d.size*.93,0);ctx.lineTo(d.size*.52,d.size*.42);ctx.lineTo(-d.size*.78,d.size*.25);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.restore();}
  }
  function drawCannon(e,s){
    const a=s.cannon;if(!a)return;const arena=arenaFor(e),p=worldToScreen(e.x,e.y),length=arena.r*1.28,end={x:p.x+Math.cos(a.angle)*length,y:p.y+Math.sin(a.angle)*length};ctx.save();ctx.globalCompositeOperation='lighter';
    if(a.warn>0){const q=ease(1-a.warn/a.maxWarn);ctx.globalAlpha=.22+.48*q;ctx.strokeStyle='#ff9b40';ctx.lineWidth=2+q*3;ctx.setLineDash([14,9]);ctx.lineDashOffset=-performance.now()/26;ctx.beginPath();ctx.moveTo(p.x+Math.cos(a.angle)*e.r*.48,p.y+Math.sin(a.angle)*e.r*.48);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.setLineDash([]);const ox=p.x+Math.cos(a.angle)*e.r*.67,oy=p.y+Math.sin(a.angle)*e.r*.67;ctx.fillStyle=`rgba(255,225,120,${.15+.40*q})`;ctx.beginPath();ctx.arc(ox,oy,e.r*(.10+.08*q),0,TAU2);ctx.fill();}
    else{ctx.shadowColor='#ff4317';ctx.shadowBlur=34;ctx.globalAlpha=.25;ctx.strokeStyle='#ff250d';ctx.lineWidth=42;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.globalAlpha=.76;ctx.strokeStyle='#ff7a25';ctx.lineWidth=22;ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#fff4b7';ctx.lineWidth=6;ctx.stroke();for(const off of[-15,15]){ctx.globalAlpha=.38;ctx.strokeStyle='#ffb044';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x-Math.sin(a.angle)*off,p.y+Math.cos(a.angle)*off);ctx.quadraticCurveTo((p.x+end.x)/2+rand(-18,18),(p.y+end.y)/2+rand(-18,18),end.x,end.y);ctx.stroke();}}
    ctx.restore();
  }
  function drawWind(e,s){
    const w=s.wind;if(!w)return;const arena=arenaFor(e),c=worldToScreen(arena.x,arena.y),active=w.warn<=0,q=active?1:ease(1-w.warn/w.maxWarn),progress=active?clamp01(w.front):0;ctx.save();ctx.beginPath();ctx.arc(c.x,c.y,arena.r,0,TAU2);ctx.clip();ctx.translate(c.x,c.y);ctx.rotate(w.angle);ctx.globalCompositeOperation='lighter';
    if(!active){ctx.globalAlpha=.08+.10*q;ctx.fillStyle='#ff6a22';ctx.fillRect(-arena.r,-arena.r,arena.r*2,arena.r*2);for(let i=-4;i<=4;i++){const x=-arena.r+q*arena.r*1.2+i*32;ctx.globalAlpha=.12+.10*q;ctx.strokeStyle=i%2?'#ffb34e':'#ff6b25';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,-arena.r);ctx.lineTo(x+arena.r*.32,arena.r);ctx.stroke();}}
    else{
      const front=-arena.r+progress*arena.r*2.3;const grad=ctx.createLinearGradient(front-120,0,front+90,0);grad.addColorStop(0,'rgba(255,55,15,0)');grad.addColorStop(.45,'rgba(255,105,30,.16)');grad.addColorStop(.68,'rgba(255,205,92,.34)');grad.addColorStop(.72,'rgba(255,247,190,.46)');grad.addColorStop(.76,'rgba(255,110,32,.22)');grad.addColorStop(1,'rgba(120,12,3,0)');ctx.fillStyle=grad;ctx.fillRect(-arena.r,-arena.r,arena.r*2,arena.r*2);
      for(let i=-7;i<=7;i++){const y=i*38+Math.sin(performance.now()*.006+i)*12;ctx.globalAlpha=.20+(i%3===0?.16:0);ctx.strokeStyle=i%3===0?'#ffe08a':'#ff6b24';ctx.lineWidth=i%3===0?4:2;ctx.beginPath();ctx.moveTo(-arena.r,y);ctx.bezierCurveTo(-arena.r*.35,y-28,arena.r*.28,y+30,arena.r,y-5);ctx.stroke();}
      ctx.globalAlpha=.66;ctx.strokeStyle='#fff0a8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(front,-arena.r);ctx.lineTo(front,arena.r);ctx.stroke();
    }
    ctx.restore();
  }
  function drawFan(e,s){
    const f=s.fan;if(!f)return;const arena=arenaFor(e),p=worldToScreen(e.x,e.y),q=f.warn>0?ease(1-f.warn/f.maxWarn):1,active=f.warn<=0;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(f.angle);ctx.globalCompositeOperation='lighter';
    if(!active){ctx.globalAlpha=.10+.18*q;ctx.strokeStyle='#ff8b31';ctx.lineWidth=2+q*2;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(e.r*.52,0);ctx.arc(0,0,arena.r*.78,-f.half,f.half);ctx.closePath();ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.16*q;ctx.fillStyle='#ff5b1f';ctx.fill();}
    else{
      const layers=[{half:f.half,r:arena.r*.78,c0:'rgba(255,52,12,.14)',c1:'rgba(255,103,26,.40)'},{half:f.half*.78,r:arena.r*.70,c0:'rgba(255,115,28,.20)',c1:'rgba(255,198,72,.58)'},{half:f.half*.46,r:arena.r*.60,c0:'rgba(255,223,115,.28)',c1:'rgba(255,250,205,.78)'}];
      for(const layer of layers){const grad=ctx.createRadialGradient(0,0,e.r*.35,0,0,layer.r);grad.addColorStop(0,layer.c1);grad.addColorStop(.34,layer.c1);grad.addColorStop(1,layer.c0);ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(e.r*.45,0);const points=18;for(let i=0;i<=points;i++){const aa=-layer.half+i/points*(layer.half*2),jag=1+.07*Math.sin(i*3.9+performance.now()*.018);ctx.lineTo(Math.cos(aa)*layer.r*jag,Math.sin(aa)*layer.r*jag);}ctx.closePath();ctx.fill();}
      for(let i=0;i<13;i++){const aa=-f.half+(i+.5)/13*(f.half*2),j=.75+.25*Math.sin(performance.now()*.022+i*2.2);ctx.globalAlpha=.38+.22*j;ctx.strokeStyle=i%3===0?'#fff1a2':i%2?'#ffb13d':'#ff5b1d';ctx.lineWidth=i%3===0?5:2.5;ctx.beginPath();ctx.moveTo(Math.cos(aa)*e.r*.56,Math.sin(aa)*e.r*.56);ctx.bezierCurveTo(Math.cos(aa*.8)*arena.r*.22,Math.sin(aa*.8)*arena.r*.22,Math.cos(aa*1.06)*arena.r*.48,Math.sin(aa*1.06)*arena.r*.48,Math.cos(aa)*arena.r*.73,Math.sin(aa)*arena.r*.73);ctx.stroke();}
    }
    ctx.restore();
  }
  function drawDroneBodies(e){
    for(const m of omegaDrones(e)){const p=worldToScreen(m.x,m.y),r=m.omegaVisualR||13,t=(m.phase||0)*.12;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t);ctx.globalCompositeOperation='lighter';ctx.shadowColor='#ff4a18';ctx.shadowBlur=12;for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*TAU2/4);ctx.fillStyle='#4a1209';ctx.strokeStyle='#ff7a25';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(r*.35,-r*.22);ctx.lineTo(r*1.22,-r*.44);ctx.lineTo(r*1.48,0);ctx.lineTo(r*1.22,r*.44);ctx.lineTo(r*.35,r*.22);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}const g=ctx.createRadialGradient(-r*.2,-r*.22,1,0,0,r*.72);g.addColorStop(0,'#fff8c8');g.addColorStop(.28,'#ffd55d');g.addColorStop(.62,'#ff6a1f');g.addColorStop(1,'#7a1308');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*.72,0,TAU2);ctx.fill();ctx.shadowBlur=0;ctx.rotate(-t+Math.atan2(player.y-m.y,player.x-m.x));ctx.fillStyle='#fff3b0';ctx.beginPath();ctx.moveTo(r*.25,-r*.12);ctx.lineTo(r*.82,0);ctx.lineTo(r*.25,r*.12);ctx.closePath();ctx.fill();ctx.restore();}
  }
  function drawDroneLasers(e){
    for(const m of omegaDrones(e)){const l=m.omegaLaser;if(!l)continue;const p=worldToScreen(m.x,m.y),length=760,end={x:p.x+Math.cos(l.angle)*length,y:p.y+Math.sin(l.angle)*length};ctx.save();ctx.globalCompositeOperation='lighter';if(l.warn>0){const q=ease(1-l.warn/l.maxWarn);ctx.globalAlpha=.28+.48*q;ctx.strokeStyle='#ff6b26';ctx.lineWidth=1.5+q*2;ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.setLineDash([]);}else{ctx.globalAlpha=.38;ctx.strokeStyle='#ff2f13';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#ffe8a4';ctx.lineWidth=3.4;ctx.stroke();}ctx.restore();}
  }
  function drawHeatShadows(e,s,alpha){
    const arena=arenaFor(e);for(const d of s.debris){const p=debrisPose(e,d),dx=p.x-e.x,dy=p.y-e.y,dd=Math.hypot(dx,dy)||1,ux=dx/dd,uy=dy/dd,nx=-uy,ny=ux,startL=d.size*.70,endL=d.size*1.65,far=Math.max(0,arena.r-dd)+80;const a1=worldToScreen(p.x+nx*startL,p.y+ny*startL),a2=worldToScreen(p.x-nx*startL,p.y-ny*startL),b1=worldToScreen(p.x+ux*far+nx*endL,p.y+uy*far+ny*endL),b2=worldToScreen(p.x+ux*far-nx*endL,p.y+uy*far-ny*endL);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#040306';ctx.beginPath();ctx.moveTo(a1.x,a1.y);ctx.lineTo(a2.x,a2.y);ctx.lineTo(b2.x,b2.y);ctx.lineTo(b1.x,b1.y);ctx.closePath();ctx.fill();ctx.restore();}}
  function drawGlobalHeat(e,s){
    const h=s.heat;if(!h)return;const arena=arenaFor(e),p=worldToScreen(arena.x,arena.y),active=h.warn<=0,q=active?1:ease(1-h.warn/h.maxWarn),pulse=.5+.5*Math.sin(performance.now()*.018);ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,arena.r,0,TAU2);ctx.clip();const g=ctx.createRadialGradient(p.x,p.y,e.r*.4,p.x,p.y,arena.r);g.addColorStop(0,`rgba(255,245,170,${active?.30:.10*q})`);g.addColorStop(.35,`rgba(255,91,25,${active?.24:.07*q})`);g.addColorStop(1,`rgba(112,10,4,${active?.18:.04*q})`);ctx.fillStyle=g;ctx.fillRect(p.x-arena.r,p.y-arena.r,arena.r*2,arena.r*2);ctx.globalCompositeOperation='lighter';for(let i=0;i<32;i++){const aa=i/32*TAU2+performance.now()*.0005,inner=e.r*.7,outer=arena.r*(.75+.20*((i%4)/3));ctx.globalAlpha=(active?.20:.07*q)*(.7+.3*pulse);ctx.strokeStyle=i%3?'#ff6b24':'#ffd26d';ctx.lineWidth=i%5===0?3.2:1.3;ctx.beginPath();ctx.moveTo(p.x+Math.cos(aa)*inner,p.y+Math.sin(aa)*inner);ctx.lineTo(p.x+Math.cos(aa+.025*Math.sin(i))*outer,p.y+Math.sin(aa+.025*Math.sin(i))*outer);ctx.stroke();}ctx.restore();drawHeatShadows(e,s,active?.82:.42*q);
  }
  function drawOmegaCombat(){
    const e=currentOmega();if(!e||state.mode!=='playing')return;const s=combatState(e);ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);drawArena(e);drawDebris(e,s);drawCannon(e,s);drawWind(e,s);drawFan(e,s);drawDroneBodies(e);drawDroneLasers(e);drawGlobalHeat(e,s);ctx.restore();
  }
  const baseForeground=typeof window.drawForegroundCombat==='function'?window.drawForegroundCombat:null;
  if(baseForeground)window.drawForegroundCombat=function omegaForeground(){baseForeground();drawOmegaCombat();};

  window.stackfallOmegaCombatTest={
    forcePattern(name){const e=currentOmega();if(!e)return false;const s=combatState(e);if(name==='cannon')startPlateCannon(e,s);else if(name==='wind')startWind(e,s);else if(name==='fan')startFan(e,s);else if(name==='heat')startGlobalHeat(e,s);else if(name==='drone')spawnDrone(e,s);else return false;return true;},
    forceDebris(){const e=currentOmega();if(!e)return false;const s=combatState(e);for(let i=0;i<8;i++)if(!s.debris.some(d=>d.index===i))spawnDebris(e,s,i);return true;}
  };
  window.stackfallOmegaCombatDiagnostics=()=>{const e=currentOmega();if(!e)return null;const s=combatState(e),phase=phaseOf(e);return{version:'v2',phase,arenaRadius:arenaFor(e).r,asteroidWall:true,asteroidCount:ASTEROID_COUNT,droneCount:omegaDrones(e).length,droneCap:DRONE_CAP[phase],droneInterval:DRONE_INTERVAL[phase],dedicatedDroneVisual:true,cannonCooldown:CANNON_CD[phase],cannonSingleSplitPlate:Number.isInteger(s.cannon?.plate),windEnabled:phase>=2,windMode:'arena-wide',fanEnabled:phase===3,fanGapIndex:s.fan?.gapIndex??null,fanFromMissingSector:phase===3?missingPlates(phase).includes(s.fan?.gapIndex):true,globalHeatEnabled:phase===4,debrisCount:s.debris.length,pendingDebris:s.pendingDebris.length,active:{cannon:!!s.cannon,wind:!!s.wind,fan:!!s.fan,heat:!!s.heat},stats:{...s.stats}};};
})();
