// Starforge Omega production combat v3.
// Dense physical asteroid wall, split-plate cannon, dedicated ember drones,
// arena-wide non-knockback stellar wind, missing-sector furnace vents,
// and phase-4 360-degree plasma exhaust physically occluded by shed armor debris.
(()=>{
  if(window.stackfallOmegaCombat==='v3')return;
  window.stackfallOmegaCombat='v3';

  const FORM='starforge',TAU2=Math.PI*2;
  const PHASE_PLATES={1:[0,1,2,3,4,5,6,7],2:[0,1,2,4,5,6],3:[0,2,4,6],4:[]};
  const CANNON_CD={1:3.0,2:2.3,3:1.65,4:999};
  const DRONE_INTERVAL={1:5,2:4,3:3,4:2},DRONE_CAP={1:5,2:7,3:9,4:10};
  const WIND_CD={1:999,2:7.0,3:5.8,4:4.7};
  const FAN_CD={1:999,2:999,3:4.2,4:999};
  const HEAT_CD={1:999,2:999,3:999,4:7.4};
  const ASTEROID_COUNT=30;

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
    const base=index/ASTEROID_COUNT*TAU2;
    const angle=base+time*(.0115+(index%4)*.00075);
    const rad=arena.r*(.885+((index%2)?-.010:.010)+.009*Math.sin(index*2.17+time*.07));
    const size=60+((index*23)%30);
    return{x:arena.x+Math.cos(angle)*rad,y:arena.y+Math.sin(angle)*rad,size,angle,spin:time*(.045+(index%5)*.006)+index*.73};
  }
  function debrisPose(e,d){const arena=arenaFor(e);return{x:arena.x+Math.cos(d.angle)*d.radius,y:arena.y+Math.sin(d.angle)*d.radius,size:d.size,angle:d.angle};}

  function combatState(e){
    if(e.omegaCombat)return e.omegaCombat;
    const p=phaseOf(e);
    return e.omegaCombat={phase:p,cannonCd:1.25,droneCd:1.4,windCd:4.0,fanCd:4.3,heatCd:6.0,cannon:null,wind:null,fan:null,heat:null,debris:[],pendingDebris:[],attackSerial:0,stats:{cannon:0,wind:0,fan:0,heat:0,drones:0}};
  }
  function queueShedPlates(e,s,fromPhase,toPhase){
    const before=new Set(activePlates(fromPhase)),after=new Set(activePlates(toPhase));let delay=.28;
    for(const index of before)if(!after.has(index)&&!s.debris.some(d=>d.index===index)&&!s.pendingDebris.some(d=>d.index===index)){s.pendingDebris.push({index,delay});delay+=.09;}
  }
  function spawnDebris(e,s,index){
    const arena=arenaFor(e),slot=s.debris.length,base=index/8*TAU2;
    s.debris.push({index,angle:base+.08*(slot%2?1:-1),radius:arena.r*(.40+.045*(slot%4)),size:e.r*(index%2===0?.64:.54),speed:(.048+.006*(slot%3))*(slot%2?1:-1),spin:slot*.9,hot:1});
    shockwave?.(e.x,e.y,'#ff7a31',96,.27,2.3);
    for(let i=0;i<12;i++)spawnParticle?.(e.x+rand(-38,38),e.y+rand(-38,38),i%3?'#ff8b39':'#ffe37e',1,52,3.7);
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
    s.wind={warn:1.02,active:1.65,maxWarn:1.02,maxActive:1.65,tick:0,front:0,burst:false};s.stats.wind++;s.attackSerial++;
    audio?.tone?.(45,.38,'sawtooth',.013,20);
  }
  function startFan(e,s){
    const gap=selectMissingSector(e,Math.atan2(player.y-e.y,player.x-e.x));if(!gap)return;
    s.fan={warn:.84,active:1.04,maxWarn:.84,maxActive:1.04,angle:gap.angle,gapIndex:gap.index,half:.53,tick:0,burst:false};s.stats.fan++;s.attackSerial++;
  }
  function startGlobalHeat(e,s){
    s.heat={warn:1.28,active:1.55,maxWarn:1.28,maxActive:1.55,tick:0,burst:false};s.stats.heat++;s.attackSerial++;
    audio?.tone?.(50,.38,'sawtooth',.018,27);
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
  function debrisBlocksPoint(e,s,px,py,padding=0){
    const vx=px-e.x,vy=py-e.y,l2=vx*vx+vy*vy||1;
    for(const d of s.debris){
      const p=debrisPose(e,d),wx=p.x-e.x,wy=p.y-e.y,t=(wx*vx+wy*vy)/l2;
      if(t<=.04||t>=.985)continue;
      const cx=e.x+vx*t,cy=e.y+vy*t;
      if(Math.hypot(p.x-cx,p.y-cy)<=p.size*1.02+padding)return true;
    }
    return false;
  }
  function debrisBlocksPlayer(e,s){return debrisBlocksPoint(e,s,player.x,player.y,10);}

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
    const arena=arenaFor(e),dx=player.x-arena.x,dy=player.y-arena.y,d=Math.hypot(dx,dy)||1,limit=arena.r*.78;
    const now=state.time||0;
    if(d>arena.r*.68){
      for(let i=0;i<ASTEROID_COUNT;i++){
        const a=asteroidPose(arena,i,now),dist=Math.hypot(player.x-a.x,player.y-a.y),hit=a.size*.94+player.r*.90;
        if(dist<hit){
          const nx=(player.x-a.x)/(dist||1),ny=(player.y-a.y)/(dist||1),push=Math.min(14,(hit-dist)*.62+2.8);
          player.x+=nx*push;player.y+=ny*push;
        }
      }
    }
    if(d>limit){const excess=d-limit,pull=(95+excess*8)*dt;player.x-=dx/d*pull;player.y-=dy/d*pull;}
  }
  function updateDebris(e,s,dt){
    for(const q of s.pendingDebris)q.delay-=dt;
    for(let i=s.pendingDebris.length-1;i>=0;i--)if(s.pendingDebris[i].delay<=0){spawnDebris(e,s,s.pendingDebris[i].index);s.pendingDebris.splice(i,1);}
    for(const d of s.debris){
      d.angle+=d.speed*dt;d.spin+=dt*(.65+(d.index%3)*.12);d.hot=Math.max(.18,d.hot-dt*.055);const p=debrisPose(e,d),dist=Math.hypot(player.x-p.x,player.y-p.y);
      if(dist<d.size+player.r*.72){const arena=arenaFor(e),dx=player.x-arena.x,dy=player.y-arena.y,dd=Math.hypot(dx,dy)||1;player.x-=dx/dd*Math.min(6,(d.size+player.r*.72-dist)*.34+1.2);player.y-=dy/dd*Math.min(6,(d.size+player.r*.72-dist)*.34+1.2);}
    }
  }

  function updateCannon(e,s,dt){
    const a=s.cannon;if(!a)return;const arena=arenaFor(e),length=arena.r*1.28;
    if(a.warn>0){
      a.warn-=dt;
      if(a.warn<=0){
        a.fire=a.maxFire;state.camera.shake=Math.max(state.camera.shake,13.2);state.flash=Math.max(state.flash,.14);audio?.tone?.(118,.13,'sawtooth',.020,38);
        for(let i=0;i<18;i++)spawnParticle?.(e.x+Math.cos(a.angle)*e.r*.7+rand(-12,12),e.y+Math.sin(a.angle)*e.r*.7+rand(-12,12),i%3?'#ff7625':'#fff0a0',1,85,4.2);
      }
    }else if(a.fire>0){
      a.fire-=dt;lineHit(e,a.angle,length,30,Math.max(9,e.damage*.62),'omegaCannonHitSerial');
      if(Math.random()<dt*65){const rr=rand(e.r*.7,length*.92);spawnParticle?.(e.x+Math.cos(a.angle)*rr+rand(-12,12),e.y+Math.sin(a.angle)*rr+rand(-12,12),Math.random()<.38?'#fff3b0':'#ff5d1e',1,76,4.0);}
      if(a.fire<=0)s.cannon=null;
    }
  }
  function updateWind(e,s,dt){
    const w=s.wind;if(!w)return;const arena=arenaFor(e);
    if(w.warn>0){
      w.warn-=dt;
      if(w.warn<=0&&!w.burst){
        w.burst=true;state.camera.shake=Math.max(state.camera.shake,12.2);state.flash=Math.max(state.flash,.10);
        shockwave?.(e.x,e.y,'#ff8a31',arena.r*.92,.40,4);
        for(let i=0;i<36;i++){const a=Math.random()*TAU2,rr=rand(e.r*.7,arena.r*.35);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,i%4===0?'#fff2ae':i%2?'#ffad43':'#ff5820',1,88,4.4);}
      }
      return;
    }
    w.active-=dt;w.front=clamp01(1-w.active/w.maxActive);w.tick-=dt;
    if(w.tick<=0){w.tick=.48;hurtPlayer(Math.max(4,e.damage*.17),e);}
    if(Math.random()<dt*58){
      const a=Math.random()*TAU2,frontR=e.r*.8+w.front*arena.r*.92,rr=Math.max(e.r*.75,frontR+rand(-arena.r*.16,arena.r*.10));
      spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,Math.random()<.34?'#fff0a2':Math.random()<.5?'#ffad3d':'#ff5620',1,84,4.1);
    }
    if(w.active<=0)s.wind=null;
  }
  function updateFan(e,s,dt){
    const f=s.fan;if(!f)return;const arena=arenaFor(e);
    if(f.warn>0){
      f.warn-=dt;
      if(f.warn<=0&&!f.burst){
        f.burst=true;state.camera.shake=Math.max(state.camera.shake,14.2);state.flash=Math.max(state.flash,.14);audio?.tone?.(68,.18,'sawtooth',.020,34);
        for(let i=0;i<34;i++){const a=f.angle+rand(-f.half*.72,f.half*.72),rr=rand(e.r*.55,e.r*1.7);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,i%4===0?'#fff3b2':i%2?'#ff9a3b':'#ff4515',1,92,4.8);}
      }
      return;
    }
    f.active-=dt;
    if(inCone(e,f.angle,f.half,arena.r*.78)){f.tick-=dt;if(f.tick<=0){f.tick=.28;hurtPlayer(Math.max(5,e.damage*.26),e);}}
    if(Math.random()<dt*62){const a=f.angle+rand(-f.half,f.half),rr=rand(e.r*.75,arena.r*.74);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,Math.random()<.30?'#fff1a0':Math.random()<.5?'#ff9a32':'#ff3d16',1,82,4.6);}
    if(f.active<=0)s.fan=null;
  }
  function updateGlobalHeat(e,s,dt){
    const h=s.heat;if(!h)return;const arena=arenaFor(e);
    if(h.warn>0){
      h.warn-=dt;
      if(Math.random()<dt*26){const a=Math.random()*TAU2,rr=rand(e.r*.65,e.r*1.6);spawnParticle?.(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,Math.random()<.35?'#fff0a0':'#ff631f',1,72,4.2);}
      if(h.warn<=0&&!h.burst){
        h.burst=true;state.camera.shake=Math.max(state.camera.shake,15.6);state.flash=Math.max(state.flash,.16);shockwave?.(e.x,e.y,'#ff6b20',arena.r*.98,.36,4.8);
        audio?.tone?.(62,.24,'sawtooth',.022,38);
      }
      return;
    }
    h.active-=dt;h.tick-=dt;
    if(h.tick<=0){h.tick=.34;if(!debrisBlocksPlayer(e,s))hurtPlayer(Math.max(6,e.damage*.24),e);}
    if(Math.random()<dt*74){
      const a=Math.random()*TAU2,rr=rand(e.r*.80,arena.r*.90),px=e.x+Math.cos(a)*rr,py=e.y+Math.sin(a)*rr;
      if(!debrisBlocksPoint(e,s,px,py,-3))spawnParticle?.(px,py,Math.random()<.32?'#fff2af':Math.random()<.5?'#ff9d36':'#ff4214',1,88,4.8);
    }
    if(h.active<=0)s.heat=null;
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
    g.beginPath();for(let i=0;i<9;i++){const a=i/9*TAU2,rr=size*(.74+.20*Math.sin(seed*2.1+i*4.73));const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();
    const grad=g.createRadialGradient(-size*.22,-size*.18,size*.06,0,0,size);grad.addColorStop(0,'#38231c');grad.addColorStop(.5,'#180e0b');grad.addColorStop(1,'#080504');g.fillStyle=grad;g.strokeStyle=`rgba(255,112,55,${.16+.30*hot})`;g.lineWidth=2.3;g.fill();g.stroke();
    g.globalAlpha=.38;g.fillStyle='#060404';for(let i=0;i<3;i++){const a=seed*1.7+i*2.1,rr=size*(.22+.13*i),cr=size*(.08+.03*(i%2));g.beginPath();g.arc(Math.cos(a)*rr,Math.sin(a)*rr,cr,0,TAU2);g.fill();}g.globalAlpha=1;
  }
  function drawArena(e){
    const arena=arenaFor(e),now=state.time||0;
    for(let i=0;i<ASTEROID_COUNT;i++){const a=asteroidPose(arena,i,now),sp=worldToScreen(a.x,a.y);ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(a.spin);ctx.shadowColor='#3a1209';ctx.shadowBlur=10;drawRock(ctx,a.size,i*.77,.12);ctx.restore();}
  }
  function drawDebris(e,s){
    for(const d of s.debris){const p=debrisPose(e,d),sp=worldToScreen(p.x,p.y);ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(d.spin);ctx.globalAlpha=.96;ctx.fillStyle='#24100c';ctx.strokeStyle=`rgba(255,126,55,${.35+.45*d.hot})`;ctx.lineWidth=2.8;ctx.shadowColor='#ff5b20';ctx.shadowBlur=9*d.hot;ctx.beginPath();ctx.moveTo(-d.size*.86,-d.size*.30);ctx.lineTo(d.size*.60,-d.size*.48);ctx.lineTo(d.size*.96,0);ctx.lineTo(d.size*.54,d.size*.45);ctx.lineTo(-d.size*.82,d.size*.27);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.restore();}
  }
  function drawCannon(e,s){
    const a=s.cannon;if(!a)return;const arena=arenaFor(e),p=worldToScreen(e.x,e.y),length=arena.r*1.28,end={x:p.x+Math.cos(a.angle)*length,y:p.y+Math.sin(a.angle)*length};ctx.save();ctx.globalCompositeOperation='lighter';
    if(a.warn>0){
      const q=ease(1-a.warn/a.maxWarn);const ox=p.x+Math.cos(a.angle)*e.r*.67,oy=p.y+Math.sin(a.angle)*e.r*.67;
      ctx.globalAlpha=.24+.54*q;ctx.strokeStyle='#ff9b40';ctx.lineWidth=2+q*3;ctx.setLineDash([14,9]);ctx.lineDashOffset=-performance.now()/26;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=`rgba(255,235,150,${.16+.46*q})`;ctx.shadowColor='#ff6a20';ctx.shadowBlur=14*q;ctx.beginPath();ctx.arc(ox,oy,e.r*(.10+.10*q),0,TAU2);ctx.fill();
    }else{
      ctx.shadowColor='#ff4317';ctx.shadowBlur=36;ctx.globalAlpha=.26;ctx.strokeStyle='#ff250d';ctx.lineWidth=44;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();
      ctx.globalAlpha=.78;ctx.strokeStyle='#ff7a25';ctx.lineWidth=23;ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#fff6c0';ctx.lineWidth=6.5;ctx.stroke();
    }
    ctx.restore();
  }
  function drawWind(e,s){
    const w=s.wind;if(!w)return;const arena=arenaFor(e),c=worldToScreen(e.x,e.y),active=w.warn<=0,q=active?1:ease(1-w.warn/w.maxWarn),progress=active?clamp01(w.front):0;
    ctx.save();ctx.beginPath();ctx.arc(c.x,c.y,arena.r,0,TAU2);ctx.clip();ctx.globalCompositeOperation='lighter';
    if(!active){
      const glow=ctx.createRadialGradient(c.x,c.y,e.r*.45,c.x,c.y,e.r*(1.4+q*1.4));glow.addColorStop(0,`rgba(255,244,175,${.08+.18*q})`);glow.addColorStop(.45,`rgba(255,96,28,${.04+.12*q})`);glow.addColorStop(1,'rgba(255,60,15,0)');ctx.fillStyle=glow;ctx.fillRect(c.x-arena.r,c.y-arena.r,arena.r*2,arena.r*2);
      for(let i=0;i<18;i++){const a=i/18*TAU2+performance.now()*.00035,inner=e.r*(.72+.12*q),outer=e.r*(1.20+1.05*q);ctx.globalAlpha=.12+.18*q;ctx.strokeStyle=i%4===0?'#ffe8a0':'#ff7426';ctx.lineWidth=i%4===0?3:1.6;ctx.beginPath();ctx.moveTo(c.x+Math.cos(a)*inner,c.y+Math.sin(a)*inner);ctx.lineTo(c.x+Math.cos(a)*outer,c.y+Math.sin(a)*outer);ctx.stroke();}
    }else{
      const front=e.r*.72+progress*arena.r*.98;
      const ring=ctx.createRadialGradient(c.x,c.y,Math.max(0,front-110),c.x,c.y,front+80);ring.addColorStop(0,'rgba(255,70,18,0)');ring.addColorStop(.48,'rgba(255,90,24,.18)');ring.addColorStop(.67,'rgba(255,203,84,.38)');ring.addColorStop(.73,'rgba(255,248,198,.56)');ring.addColorStop(.80,'rgba(255,110,28,.22)');ring.addColorStop(1,'rgba(150,16,3,0)');ctx.fillStyle=ring;ctx.fillRect(c.x-arena.r,c.y-arena.r,arena.r*2,arena.r*2);
      for(let i=0;i<36;i++){const a=i/36*TAU2+performance.now()*.0005,inner=e.r*.72,outer=Math.min(arena.r,front+70+(i%4)*12);ctx.globalAlpha=.16+(i%5===0?.16:0);ctx.strokeStyle=i%5===0?'#fff0aa':i%2?'#ff9e38':'#ff5d20';ctx.lineWidth=i%5===0?4:2;ctx.beginPath();ctx.moveTo(c.x+Math.cos(a)*inner,c.y+Math.sin(a)*inner);ctx.bezierCurveTo(c.x+Math.cos(a+.05)*outer*.42,c.y+Math.sin(a+.05)*outer*.42,c.x+Math.cos(a-.04)*outer*.72,c.y+Math.sin(a-.04)*outer*.72,c.x+Math.cos(a)*outer,c.y+Math.sin(a)*outer);ctx.stroke();}
      ctx.globalAlpha=.72;ctx.strokeStyle='#fff0a8';ctx.lineWidth=4;ctx.beginPath();ctx.arc(c.x,c.y,front,0,TAU2);ctx.stroke();
    }
    ctx.restore();
  }
  function drawFan(e,s){
    const f=s.fan;if(!f)return;const arena=arenaFor(e),p=worldToScreen(e.x,e.y),q=f.warn>0?ease(1-f.warn/f.maxWarn):1,active=f.warn<=0;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(f.angle);ctx.globalCompositeOperation='lighter';
    if(!active){
      ctx.globalAlpha=.10+.18*q;ctx.strokeStyle='#ff8b31';ctx.lineWidth=2+q*2;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(e.r*.52,0);ctx.arc(0,0,arena.r*.78,-f.half,f.half);ctx.closePath();ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.16*q;ctx.fillStyle='#ff5b1f';ctx.fill();
    }else{
      const layers=[{half:f.half,r:arena.r*.78,c0:'rgba(255,52,12,.16)',c1:'rgba(255,103,26,.44)'},{half:f.half*.78,r:arena.r*.70,c0:'rgba(255,115,28,.23)',c1:'rgba(255,198,72,.64)'},{half:f.half*.44,r:arena.r*.60,c0:'rgba(255,223,115,.34)',c1:'rgba(255,252,215,.86)'}];
      for(const layer of layers){const grad=ctx.createRadialGradient(0,0,e.r*.35,0,0,layer.r);grad.addColorStop(0,layer.c1);grad.addColorStop(.32,layer.c1);grad.addColorStop(1,layer.c0);ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(e.r*.45,0);const points=20;for(let i=0;i<=points;i++){const aa=-layer.half+i/points*(layer.half*2),jag=1+.08*Math.sin(i*3.9+performance.now()*.020);ctx.lineTo(Math.cos(aa)*layer.r*jag,Math.sin(aa)*layer.r*jag);}ctx.closePath();ctx.fill();}
      for(let i=0;i<16;i++){const aa=-f.half+(i+.5)/16*(f.half*2),j=.72+.28*Math.sin(performance.now()*.024+i*2.2);ctx.globalAlpha=.42+.24*j;ctx.strokeStyle=i%4===0?'#fff5b0':i%2?'#ffb13d':'#ff5118';ctx.lineWidth=i%4===0?5.5:2.8;ctx.beginPath();ctx.moveTo(Math.cos(aa)*e.r*.56,Math.sin(aa)*e.r*.56);ctx.bezierCurveTo(Math.cos(aa*.82)*arena.r*.22,Math.sin(aa*.82)*arena.r*.22,Math.cos(aa*1.06)*arena.r*.49,Math.sin(aa*1.06)*arena.r*.49,Math.cos(aa)*arena.r*.74,Math.sin(aa)*arena.r*.74);ctx.stroke();}
    }
    ctx.restore();
  }
  function drawDroneBodies(e){
    for(const m of omegaDrones(e)){const p=worldToScreen(m.x,m.y),r=m.omegaVisualR||13,t=(m.phase||0)*.12;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t);ctx.globalCompositeOperation='lighter';ctx.shadowColor='#ff4a18';ctx.shadowBlur=13;for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*TAU2/4);ctx.fillStyle='#4a1209';ctx.strokeStyle='#ff7a25';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(r*.35,-r*.22);ctx.lineTo(r*1.22,-r*.44);ctx.lineTo(r*1.48,0);ctx.lineTo(r*1.22,r*.44);ctx.lineTo(r*.35,r*.22);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}const g=ctx.createRadialGradient(-r*.2,-r*.22,1,0,0,r*.72);g.addColorStop(0,'#fff8c8');g.addColorStop(.28,'#ffd55d');g.addColorStop(.62,'#ff6a1f');g.addColorStop(1,'#7a1308');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*.72,0,TAU2);ctx.fill();ctx.shadowBlur=0;ctx.rotate(-t+Math.atan2(player.y-m.y,player.x-m.x));ctx.fillStyle='#fff3b0';ctx.beginPath();ctx.moveTo(r*.25,-r*.12);ctx.lineTo(r*.82,0);ctx.lineTo(r*.25,r*.12);ctx.closePath();ctx.fill();ctx.restore();}
  }
  function drawDroneLasers(e){
    for(const m of omegaDrones(e)){const l=m.omegaLaser;if(!l)continue;const p=worldToScreen(m.x,m.y),length=760,end={x:p.x+Math.cos(l.angle)*length,y:p.y+Math.sin(l.angle)*length};ctx.save();ctx.globalCompositeOperation='lighter';if(l.warn>0){const q=ease(1-l.warn/l.maxWarn);ctx.globalAlpha=.28+.48*q;ctx.strokeStyle='#ff6b26';ctx.lineWidth=1.5+q*2;ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.setLineDash([]);}else{ctx.globalAlpha=.38;ctx.strokeStyle='#ff2f13';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#ffe8a4';ctx.lineWidth=3.4;ctx.stroke();}ctx.restore();}
  }
  function plumeStopDistance(e,s,angle,arena){
    let stop=arena.r*.96;
    for(const d of s.debris){
      const p=debrisPose(e,d),dx=p.x-e.x,dy=p.y-e.y,dist=Math.hypot(dx,dy),da=Math.abs(angleDelta(Math.atan2(dy,dx),angle)),angular=Math.asin(Math.min(.96,(d.size*1.08)/Math.max(d.size*1.08+1,dist)));
      if(da<=angular)stop=Math.min(stop,Math.max(e.r*.90,dist-d.size*.82));
    }
    return stop;
  }
  function drawGlobalHeat(e,s){
    const h=s.heat;if(!h)return;const arena=arenaFor(e),p=worldToScreen(e.x,e.y),active=h.warn<=0,q=active?1:ease(1-h.warn/h.maxWarn),pulse=.5+.5*Math.sin(performance.now()*.021);
    ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,arena.r,0,TAU2);ctx.clip();ctx.globalCompositeOperation='lighter';
    if(!active){
      const glow=ctx.createRadialGradient(p.x,p.y,e.r*.45,p.x,p.y,e.r*(1.35+q*1.55));glow.addColorStop(0,`rgba(255,251,218,${.10+.26*q})`);glow.addColorStop(.30,`rgba(255,130,40,${.08+.20*q})`);glow.addColorStop(1,'rgba(255,45,10,0)');ctx.fillStyle=glow;ctx.fillRect(p.x-arena.r,p.y-arena.r,arena.r*2,arena.r*2);
      for(let i=0;i<24;i++){const aa=i/24*TAU2+performance.now()*.00065,inner=e.r*.72,outer=e.r*(1.25+q*1.55);ctx.globalAlpha=.14+.24*q;ctx.strokeStyle=i%4===0?'#fff2ae':i%2?'#ff9a32':'#ff5018';ctx.lineWidth=i%4===0?4:2;ctx.beginPath();ctx.moveTo(p.x+Math.cos(aa)*inner,p.y+Math.sin(aa)*inner);ctx.lineTo(p.x+Math.cos(aa)*outer,p.y+Math.sin(aa)*outer);ctx.stroke();}
      ctx.restore();return;
    }
    const plumeCount=80;
    for(let i=0;i<plumeCount;i++){
      const aa=i/plumeCount*TAU2+Math.sin(performance.now()*.0015+i*1.37)*.010,stop=plumeStopDistance(e,s,aa,arena),inner=e.r*.68;
      if(stop<=inner+8)continue;
      const width=i%5===0?11:i%2===0?6.4:4.0;
      const ex=p.x+Math.cos(aa)*stop,ey=p.y+Math.sin(aa)*stop,m1=inner+(stop-inner)*.38,m2=inner+(stop-inner)*.72;
      ctx.globalAlpha=(i%5===0?.42:.23)*(.76+.24*pulse);ctx.strokeStyle=i%5===0?'#ff3d0c':'#ff6419';ctx.lineWidth=width*3.1;ctx.beginPath();ctx.moveTo(p.x+Math.cos(aa)*inner,p.y+Math.sin(aa)*inner);ctx.bezierCurveTo(p.x+Math.cos(aa+.028)*m1,p.y+Math.sin(aa+.028)*m1,p.x+Math.cos(aa-.022)*m2,p.y+Math.sin(aa-.022)*m2,ex,ey);ctx.stroke();
      ctx.globalAlpha=i%5===0?.96:.62;ctx.strokeStyle=i%5===0?'#fff8cf':'#ffc35b';ctx.lineWidth=width;ctx.stroke();
      if(i%5===0&&stop<arena.r*.90){ctx.globalAlpha=.72;ctx.fillStyle='#fff1a4';ctx.shadowColor='#ff5017';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(ex,ey,4.5+2*pulse,0,TAU2);ctx.fill();ctx.shadowBlur=0;}
    }
    const core=ctx.createRadialGradient(p.x,p.y,e.r*.25,p.x,p.y,e.r*1.7);core.addColorStop(0,`rgba(255,255,224,${.34+.14*pulse})`);core.addColorStop(.32,`rgba(255,118,34,${.24+.10*pulse})`);core.addColorStop(1,'rgba(255,50,12,0)');ctx.fillStyle=core;ctx.fillRect(p.x-e.r*1.8,p.y-e.r*1.8,e.r*3.6,e.r*3.6);ctx.restore();
  }
  function drawHeatImpacts(e,s){
    if(!s.heat||s.heat.warn>0)return;
    const pulse=.5+.5*Math.sin(performance.now()*.028);
    for(const d of s.debris){
      const wp=debrisPose(e,d),dx=wp.x-e.x,dy=wp.y-e.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
      const sp=worldToScreen(wp.x-ux*d.size*.72,wp.y-uy*d.size*.72);
      ctx.save();ctx.globalCompositeOperation='lighter';
      const g=ctx.createRadialGradient(sp.x,sp.y,1,sp.x,sp.y,d.size*.56);
      g.addColorStop(0,`rgba(255,255,220,${.80+.18*pulse})`);g.addColorStop(.22,'rgba(255,210,95,.72)');g.addColorStop(.55,'rgba(255,88,24,.34)');g.addColorStop(1,'rgba(255,60,12,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(sp.x,sp.y,d.size*.56,0,TAU2);ctx.fill();
      ctx.strokeStyle='#fff2a8';ctx.globalAlpha=.72;ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(sp.x,sp.y,d.size*.30,-1.0,1.0);ctx.stroke();ctx.restore();
    }
  }
  function drawOmegaCombat(){
    const e=currentOmega();if(!e||state.mode!=='playing')return;const s=combatState(e);ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
    drawArena(e);drawGlobalHeat(e,s);drawDebris(e,s);drawHeatImpacts(e,s);drawCannon(e,s);drawWind(e,s);drawFan(e,s);drawDroneBodies(e);drawDroneLasers(e);
    ctx.restore();
  }
  const baseForeground=typeof window.drawForegroundCombat==='function'?window.drawForegroundCombat:null;
  if(baseForeground)window.drawForegroundCombat=function omegaForeground(){baseForeground();drawOmegaCombat();};

  window.stackfallOmegaCombatTest={
    forcePattern(name){const e=currentOmega();if(!e)return false;const s=combatState(e);if(name==='cannon')startPlateCannon(e,s);else if(name==='wind')startWind(e,s);else if(name==='fan')startFan(e,s);else if(name==='heat')startGlobalHeat(e,s);else if(name==='drone')spawnDrone(e,s);else return false;return true;},
    forceDebris(){const e=currentOmega();if(!e)return false;const s=combatState(e);for(let i=0;i<8;i++)if(!s.debris.some(d=>d.index===i))spawnDebris(e,s,i);return true;},
    placePlayerBehindDebris(index=0){const e=currentOmega();if(!e)return false;const s=combatState(e),d=s.debris[index];if(!d)return false;const p=debrisPose(e,d),dx=p.x-e.x,dy=p.y-e.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;player.x=p.x+ux*(d.size+player.r+34);player.y=p.y+uy*(d.size+player.r+34);return debrisBlocksPlayer(e,s);}
  };
  window.stackfallOmegaCombatDiagnostics=()=>{
    const e=currentOmega();if(!e)return null;const s=combatState(e),phase=phaseOf(e);
    return{
      version:'v3',phase,arenaRadius:arenaFor(e).r,asteroidWall:true,asteroidWallMode:'dense-physical',asteroidCount:ASTEROID_COUNT,
      droneCount:omegaDrones(e).length,droneCap:DRONE_CAP[phase],droneInterval:DRONE_INTERVAL[phase],dedicatedDroneVisual:true,
      cannonCooldown:CANNON_CD[phase],cannonSingleSplitPlate:Number.isInteger(s.cannon?.plate),windEnabled:phase>=2,windMode:'arena-wide-radial',windKnockback:false,
      fanEnabled:phase===3,fanGapIndex:s.fan?.gapIndex??null,fanFromMissingSector:phase===3?missingPlates(phase).includes(s.fan?.gapIndex):true,
      globalHeatEnabled:phase===4,heatOcclusionMode:'physical-plume-truncation',heatShadowOverlay:false,debrisCoverScale:1.02,
      debrisCount:s.debris.length,pendingDebris:s.pendingDebris.length,active:{cannon:!!s.cannon,wind:!!s.wind,fan:!!s.fan,heat:!!s.heat},stats:{...s.stats}
    };
  };
})();
