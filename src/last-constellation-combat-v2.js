// Last Constellation combat v2.
// Authored kit: node links, per-node weak-homing comets, endpoint-tracking beams,
// multi-gap pulse waves, persistent debris, and a distinct P4 telegraphed ricochet laser.
(()=>{
  if(window.stackfallLastConstellationCombat==='v2')return;
  window.stackfallLastConstellationCombat='v2';

  const FORM='lastconstellation',TAU=Math.PI*2,PULSE_WAVE_INTERVAL=1.0;
  const CFG={
    1:{cometCount:1,cometSpeed:220,cometTurn:.42,cometCd:4.25,beamCd:11.4,beamWarn:1.00,beamLife:1.80,beamTargetSpeed:104,beamWidth:12,linkCd:5.8,linkWarn:.72,linkLife:2.45,linkNodes:2,pulseCd:0,pulseSpeed:0,pulseGaps:0,pulseWaves:0},
    2:{cometCount:2,cometSpeed:235,cometTurn:.50,cometCd:3.80,beamCd:9.4,beamWarn:.94,beamLife:1.90,beamTargetSpeed:116,beamWidth:14,linkCd:4.15,linkWarn:.66,linkLife:2.70,linkNodes:3,pulseCd:9.6,pulseSpeed:118,pulseGaps:3,pulseWaves:1},
    3:{cometCount:2,cometSpeed:250,cometTurn:.58,cometCd:3.35,beamCd:7.7,beamWarn:.88,beamLife:2.05,beamTargetSpeed:130,beamWidth:16,linkCd:0,linkWarn:0,linkLife:999,linkNodes:3,pulseCd:8.4,pulseSpeed:128,pulseGaps:4,pulseWaves:2},
    4:{cometCount:5,cometSpeed:270,cometTurn:.66,cometCd:3.05,beamCd:6.2,beamWarn:.92,beamLife:2.35,beamTargetSpeed:146,beamWidth:30,linkCd:0,linkWarn:0,linkLife:0,linkNodes:0,pulseCd:7.2,pulseSpeed:138,pulseGaps:4,pulseWaves:3}
  };
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const liveLC=()=>state.entities.enemies.find(isLC)||null;
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const segDist=(px,py,x1,y1,x2,y2)=>{
    const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l));
    return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));
  };
  const activeParts=e=>(e?.bodyParts||[]).filter(p=>p?.lcNodeProxy&&p.active&&p.visible&&!p.dead);
  const partByKey=(e,key)=>(e?.bodyParts||[]).find(p=>p?.lcNodeProxy&&p.lcNodeKey===key)||null;
  const hurt=(e,damage)=>{if(player.invuln<=0&&typeof hurtPlayer==='function')hurtPlayer(Math.max(1,damage),e);};
  const movePoint=(x,y,tx,ty,maxStep)=>{
    const dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy);if(!d||d<=maxStep)return{x:tx,y:ty};
    return{x:x+dx/d*maxStep,y:y+dy/d*maxStep};
  };
  const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const sourceFxVisible=(x,y,margin=100)=>{
    const p=typeof worldToScreen==='function'?worldToScreen(x,y):{x:x-player.x+vw/2,y:y-player.y+vh/2};
    return p.x>=-margin&&p.x<=vw+margin&&p.y>=-margin&&p.y<=vh+margin;
  };
  const sourceShockwave=(x,y,color,maxR,life,width)=>{if(typeof shockwave==='function'&&sourceFxVisible(x,y))shockwave(x,y,color,maxR,life,width);};

  function ensureCombat(e){
    if(e.lcCombat?.version===3)return e.lcCombat;
    e.lcCombat={
      version:3,phase:e.lcStructure?.phase||1,cometCd:1.55,beamCd:5.2,linkCd:2.4,pulseCd:4.9,ricochetCd:5.6,
      comets:[],beams:[],pulses:[],ricochet:null,linkHazard:null,debris:[],debrisKeys:new Set(),serial:0,
      lastCometVolley:{phase:0,expectedPerNode:0,activeNodes:0,spawned:0,byNode:{}}
    };
    return e.lcCombat;
  }

  // ---- Persistent shattered-node debris -------------------------------------------------------
  function registerNewDebris(e,c){
    const nodes=e.lcStructure?.nodes||{};
    for(const [key,node] of Object.entries(nodes)){
      if(!node?.destroyed||key==='core'||c.debrisKeys.has(key))continue;
      c.debrisKeys.add(key);
      const p=partByKey(e,key),baseX=p?.x??e.x,baseY=p?.y??e.y,seed=key.split('').reduce((n,ch)=>n+ch.charCodeAt(0),0);
      for(let i=0;i<3;i++){
        const a=(seed*.173+i*TAU/3)%TAU,anchor=i===0,size=e.r*(anchor?.30:.18+i*.035);
        c.debris.push({
          id:`${key}:${i}`,nodeKey:key,anchor,
          x:baseX+Math.cos(a)*e.r*(.16+i*.11),y:baseY+Math.sin(a)*e.r*(.16+i*.11),
          vx:Math.cos(a)*(5.5+i*2.2),vy:Math.sin(a)*(5.5+i*2.2),rot:a,spin:(i%2?1:-1)*(.10+i*.035),size
        });
      }
    }
  }
  function updateDebris(e,c,dt){
    registerNewDebris(e,c);const drag=Math.pow(.985,dt*60);
    for(const d of c.debris){
      d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=drag;d.vy*=drag;d.rot+=d.spin*dt;
      const dx=d.x-e.x,dy=d.y-e.y,dist=Math.hypot(dx,dy)||1,limit=e.r*22;
      if(dist>limit){d.x=e.x+dx/dist*limit;d.y=e.y+dy/dist*limit;d.vx*=-.35;d.vy*=-.35;}
    }
  }
  function debrisAnchors(c){return c.debris.filter(d=>d.anchor);}
  function debrisById(c,id){return c.debris.find(d=>d.id===id)||null;}

  // ---- Weak-homing comets: count is explicitly PER ACTIVE NODE -------------------------------
  function spawnComets(e,phase){
    const cfg=CFG[phase],c=ensureCombat(e),parts=activeParts(e);if(!parts.length)return;
    const byNode={};let spawned=0;
    for(const part of parts){
      const base=Math.atan2(player.y-part.y,player.x-part.x),count=cfg.cometCount,nx=-Math.sin(base),ny=Math.cos(base);
      byNode[part.lcNodeKey]=0;
      for(let i=0;i<count;i++){
        const lane=i-(count-1)/2,spread=lane*(phase===4?.105:.14),a=base+spread,offset=lane*(phase===4?10:12);
        c.comets.push({
          sourceKey:part.lcNodeKey,volley:c.serial,x:part.x+nx*offset,y:part.y+ny*offset,
          vx:Math.cos(a)*cfg.cometSpeed,vy:Math.sin(a)*cfg.cometSpeed,speed:cfg.cometSpeed,turn:cfg.cometTurn,
          life:5.25,age:0,r:phase===4?13:9.5,damage:Math.max(4,(Number(e.damage)||18)*(phase===4?.27:.21+.012*phase)),phase,p4:phase===4,trail:0
        });
        byNode[part.lcNodeKey]++;spawned++;
      }
      sourceShockwave(part.x,part.y,phase===4?'#f4f7ff':'#a8bcff',phase===4?70:52,.23,1.7);
    }
    c.lastCometVolley={phase,expectedPerNode:cfg.cometCount,activeNodes:parts.length,spawned,byNode};c.serial++;
    if(c.comets.length>60)c.comets.splice(0,c.comets.length-60);
  }
  function updateComets(e,c,dt){
    for(const q of c.comets){
      q.age+=dt;q.life-=dt;if(q.life<=0)continue;
      const current=Math.atan2(q.vy,q.vx),target=Math.atan2(player.y-q.y,player.x-q.x),delta=Math.atan2(Math.sin(target-current),Math.cos(target-current)),next=current+Math.max(-q.turn*dt,Math.min(q.turn*dt,delta));
      q.vx=Math.cos(next)*q.speed;q.vy=Math.sin(next)*q.speed;q.x+=q.vx*dt;q.y+=q.vy*dt;q.trail-=dt;
      if(q.trail<=0){q.trail=q.p4?.055:.075;if(typeof spawnParticle==='function')spawnParticle(q.x-q.vx*.025,q.y-q.vy*.025,q.p4?'#f1f5ff':'#9fb7ff',1,q.p4?32:24,q.p4?3.2:2.2);}
      if(Math.hypot(player.x-q.x,player.y-q.y)<=player.r+q.r){hurt(e,q.damage);q.life=0;if(typeof shockwave==='function')shockwave(q.x,q.y,q.p4?'#ffffff':'#b7c9ff',q.p4?72:46,.25,q.p4?3:2);}
    }
    c.comets=c.comets.filter(q=>q.life>0);
  }

  // ---- Temporary / permanent node connections ------------------------------------------------
  function chooseParts(parts,count,serial){
    if(parts.length<=count)return parts.slice();const out=[],used=new Set();
    for(let i=0;i<count;i++){let idx=(serial+i*Math.max(1,Math.floor(parts.length/count)))%parts.length;while(used.has(idx))idx=(idx+1)%parts.length;used.add(idx);out.push(parts[idx]);}
    return out;
  }
  function startConnection(e,phase,forcedCount=null){
    if(phase>=3)return;const c=ensureCombat(e),cfg=CFG[phase],parts=activeParts(e);if(parts.length<2)return;
    let count=phase===1?2:(forcedCount||((c.serial++%3===0&&parts.length>=3)?3:2));count=Math.max(2,Math.min(count,parts.length,cfg.linkNodes));
    const chosen=chooseParts(parts,count,c.serial++);c.linkHazard={phase,keys:chosen.map(p=>p.lcNodeKey),age:0,warn:cfg.linkWarn,life:cfg.linkLife,damage:Math.max(4,(Number(e.damage)||18)*(.25+.02*phase))};
  }
  function linkSegments(e,link){
    const pts=link.keys.map(key=>partByKey(e,key)).filter(p=>p?.active),segments=[];for(let i=0;i<pts.length-1;i++)segments.push([pts[i],pts[i+1]]);if(pts.length>=3)segments.push([pts[pts.length-1],pts[0]]);return segments;
  }
  function permanentSegments(e){
    const pts=activeParts(e);if(pts.length<2)return[];const segments=[];for(let i=0;i<pts.length-1;i++)segments.push([pts[i],pts[i+1]]);if(pts.length>=3)segments.push([pts[pts.length-1],pts[0]]);return segments;
  }
  function updateConnections(e,c,phase,dt){
    if(phase===3){const segments=permanentSegments(e);if(player.invuln<=0)for(const [a,b] of segments)if(segDist(player.x,player.y,a.x,a.y,b.x,b.y)<=player.r+7){hurt(e,Math.max(3,(Number(e.damage)||18)*.23));break;}c.linkHazard=null;return;}
    if(phase===4){c.linkHazard=null;return;}
    const link=c.linkHazard;if(link){link.age+=dt;const activeStart=link.warn,activeEnd=link.warn+link.life;if(link.age>=activeStart&&link.age<=activeEnd&&player.invuln<=0){for(const [a,b] of linkSegments(e,link))if(segDist(player.x,player.y,a.x,a.y,b.x,b.y)<=player.r+9){hurt(e,link.damage);break;}}if(link.age>activeEnd+.28)c.linkHazard=null;}
    c.linkCd-=dt;if(!c.linkHazard&&c.linkCd<=0){startConnection(e,phase);c.linkCd=CFG[phase].linkCd;}
  }

  // ---- Sustained tracking beams: a finite endpoint chases the player slowly -------------------
  function startBeamVolley(e,phase){
    const c=ensureCombat(e),cfg=CFG[phase],parts=activeParts(e);if(!parts.length)return;c.beams.length=0;
    for(const part of parts)c.beams.push({key:part.lcNodeKey,phase,stage:'warn',timer:cfg.beamWarn,life:cfg.beamLife,width:cfg.beamWidth,damage:Math.max(5,(Number(e.damage)||18)*(phase===4?.42:.31+.02*phase)),targetX:player.x,targetY:player.y,fired:false});
  }
  function beamPath(e,b){const origin=partByKey(e,b.key)||{x:e.x,y:e.y};return[{x:origin.x,y:origin.y},{x:b.targetX,y:b.targetY}];}
  function updateBeams(e,c,phase,dt){
    const cfg=CFG[phase];
    for(const b of c.beams){
      const sourcePart=partByKey(e,b.key);if(!sourcePart?.active){b.stage='dead';b.life=0;continue;}
      const next=movePoint(b.targetX,b.targetY,player.x,player.y,cfg.beamTargetSpeed*dt);b.targetX=next.x;b.targetY=next.y;
      if(b.stage==='warn'){
        b.timer-=dt;if(b.timer<=0){b.stage='active';b.life=cfg.beamLife;b.fired=true;state.camera.shake=Math.max(state.camera.shake,phase===4?10:5.5);state.flash=Math.max(state.flash,phase===4?.14:.07);sourceShockwave(sourcePart.x,sourcePart.y,phase===4?'#ffffff':'#dce7ff',phase===4?150:90,.34,phase===4?5:3);if(typeof audio?.tone==='function')audio.tone(phase===4?72:108,.22,'sawtooth',phase===4?.022:.012,phase===4?85:45);}
      }else{
        b.life-=dt;const path=beamPath(e,b);if(player.invuln<=0&&segDist(player.x,player.y,path[0].x,path[0].y,path[1].x,path[1].y)<=b.width*.52+player.r)hurt(e,b.damage);
        if(Math.random()<dt*(phase===4?20:9)&&typeof spawnParticle==='function'&&sourceFxVisible(sourcePart.x,sourcePart.y))spawnParticle(sourcePart.x+rand(-10,10),sourcePart.y+rand(-10,10),phase===4?'#ffffff':'#c4d3ff',1,phase===4?80:45,phase===4?4:2.5);
      }
    }
    c.beams=c.beams.filter(b=>b.stage!=='dead'&&(b.stage==='warn'||b.life>0));c.beamCd-=dt;if(!c.beams.length&&c.beamCd<=0){startBeamVolley(e,phase);c.beamCd=cfg.beamCd;}
  }

  // ---- Multi-gap pulse waves -----------------------------------------------------------------
  function pulseSourceParts(e,phase){
    const parts=activeParts(e);if(!parts.length)return[];
    if(phase===4)return[parts[0]];
    if(phase===3&&parts.length>1){const i=(ensureCombat(e).serial++)%parts.length;return[parts[i],parts[(i+1)%parts.length]];}
    return[parts[(ensureCombat(e).serial++)%parts.length]];
  }
  function spawnPulseBurst(e,phase){
    const c=ensureCombat(e),cfg=CFG[phase];if(phase<2||!cfg.pulseWaves)return;
    const sources=pulseSourceParts(e,phase);let waveIndex=0,emissionIndex=0;
    for(const source of sources){
      for(let i=0;i<cfg.pulseWaves;i++){
        const gaps=cfg.pulseGaps,base=(c.serial*.37+i*.51+waveIndex*.29)%TAU,gapAngles=[];
        for(let g=0;g<gaps;g++)gapAngles.push(base+g*TAU/gaps+(g%2?.055:-.035));
        const distance=Math.hypot(player.x-source.x,player.y-source.y),maxR=Math.max(520,distance+420);
        c.pulses.push({sourceKey:source.lcNodeKey,x:source.x,y:source.y,phase,delay:emissionIndex++*PULSE_WAVE_INTERVAL,age:0,r:0,speed:cfg.pulseSpeed,maxR,gapAngles,gapHalf:phase===2?.31:phase===3?.28:.27,band:phase===4?24:20,damage:Math.max(4,(Number(e.damage)||18)*(.25+phase*.025)),hit:false});
      }
      waveIndex++;
    }
    if(c.pulses.length>14)c.pulses.splice(0,c.pulses.length-14);
  }
  function angleInGap(angle,pulse){for(const gap of pulse.gapAngles)if(Math.abs(angleDelta(angle,gap))<=pulse.gapHalf)return true;return false;}
  function updatePulses(e,c,phase,dt){
    for(const p of c.pulses){
      p.delay-=dt;if(p.delay>0)continue;p.age+=dt;p.r+=p.speed*dt;if(p.r>p.maxR){p.dead=true;continue;}
      const dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx),onRing=Math.abs(d-p.r)<=player.r+p.band*.5;
      if(!p.hit&&onRing&&!angleInGap(a,p)&&player.invuln<=0){hurt(e,p.damage);p.hit=true;}
    }
    c.pulses=c.pulses.filter(p=>!p.dead);if(phase<2){c.pulseCd=999;return;}c.pulseCd-=dt;if(c.pulseCd<=0){spawnPulseBurst(e,phase);c.pulseCd=CFG[phase].pulseCd;}
  }

  // ---- P4 ricochet laser: separate one-shot telegraphed pattern -------------------------------
  function chooseBounceIds(c,count,serial){
    const anchors=debrisAnchors(c);if(!anchors.length)return[];count=Math.min(count,anchors.length);const out=[],used=new Set(),step=Math.max(1,Math.floor(anchors.length/count));
    for(let i=0;i<count;i++){let idx=(serial+i*step)%anchors.length;while(used.has(idx))idx=(idx+1)%anchors.length;used.add(idx);out.push(anchors[idx].id);}return out;
  }
  function ricochetPath(e,c,r){return r?.points||[];}
  function startRicochet(e,c){
    const core=partByKey(e,'core');if(!core?.active)return;const bounceIds=chooseBounceIds(c,3,c.serial++),points=[{x:core.x,y:core.y}];
    for(const id of bounceIds){const d=debrisById(c,id);if(d)points.push({x:d.x,y:d.y});}
    const last=points[points.length-1],snapshotX=player.x,snapshotY=player.y,dx=snapshotX-last.x,dy=snapshotY-last.y,d=Math.hypot(dx,dy)||1,extend=560;
    points.push({x:snapshotX+dx/d*extend,y:snapshotY+dy/d*extend});
    c.ricochet={stage:'warn',timer:1.15,life:.18,points,bounceCount:Math.max(0,points.length-2),width:18,damage:Math.max(7,(Number(e.damage)||18)*.54),hitApplied:false};
  }
  function updateRicochet(e,c,phase,dt){
    if(phase!==4){c.ricochet=null;c.ricochetCd=999;return;}
    const r=c.ricochet;if(r){
      if(r.stage==='warn'){r.timer-=dt;if(r.timer<=0){r.stage='fire';state.camera.shake=Math.max(state.camera.shake,12);state.flash=Math.max(state.flash,.13);if(typeof audio?.tone==='function')audio.tone(64,.18,'sawtooth',.028,80);const path=ricochetPath(e,c,r);for(let i=0;i<path.length-1;i++)sourceShockwave(path[i].x,path[i].y,'#dce7ff',58,.20,2.4);}}
      else{
        if(!r.hitApplied){r.hitApplied=true;const path=ricochetPath(e,c,r);if(player.invuln<=0)for(let i=0;i<path.length-1;i++)if(segDist(player.x,player.y,path[i].x,path[i].y,path[i+1].x,path[i+1].y)<=player.r+r.width*.55){hurt(e,r.damage);break;}}
        r.life-=dt;if(r.life<=0)c.ricochet=null;
      }
    }
    c.ricochetCd-=dt;if(!c.ricochet&&c.ricochetCd<=0){startRicochet(e,c);c.ricochetCd=8.2;}
  }

  function resetForPhase(e,c,phase){
    c.phase=phase;c.comets.length=0;c.beams.length=0;c.pulses.length=0;c.ricochet=null;c.linkHazard=null;
    c.cometCd=phase===1?1.5:1.05;c.beamCd=phase===1?5.5:phase===2?4.4:phase===3?3.6:2.8;c.linkCd=phase===1?2.4:1.6;c.pulseCd=phase<2?999:phase===2?3.8:3.1;c.ricochetCd=phase===4?4.4:999;
  }
  function updateCombat(e,dt){
    if(!e.lcStructure)return;const c=ensureCombat(e),phase=e.lcStructure.phase||1,cfg=CFG[phase];if(c.phase!==phase)resetForPhase(e,c,phase);updateDebris(e,c,dt);
    c.cometCd-=dt;if(c.cometCd<=0){spawnComets(e,phase);c.cometCd=cfg.cometCd;}updateComets(e,c,dt);updateConnections(e,c,phase,dt);updateBeams(e,c,phase,dt);updatePulses(e,c,phase,dt);updateRicochet(e,c,phase,dt);
  }

  const baseUpdateEnemies=typeof updateEnemies==='function'?updateEnemies:null;
  if(baseUpdateEnemies)updateEnemies=function updateEnemiesWithLastConstellationCombatV2(dt){const result=baseUpdateEnemies(dt);for(const e of state.entities.enemies||[])if(isLC(e))updateCombat(e,dt);return result;};

  // ---- Rendering -----------------------------------------------------------------------------
  function local(e,p){return{x:p.x-e.x,y:p.y-e.y};}
  function drawLineLocal(e,a,b,width,color,alpha,blur=0){const p=local(e,a),q=local(e,b);ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';if(blur){ctx.shadowColor=color;ctx.shadowBlur=blur;}ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.restore();}
  function drawDebris(e,c){for(const d of c.debris){const p=local(e,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(d.rot);ctx.globalAlpha=.78;ctx.shadowColor='#9fb6ff';ctx.shadowBlur=9;ctx.fillStyle='rgba(112,132,193,.66)';ctx.strokeStyle='#dce6ff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,-d.size);ctx.lineTo(d.size*.55,-d.size*.08);ctx.lineTo(d.size*.20,d.size*.78);ctx.lineTo(-d.size*.48,d.size*.35);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}
  function drawComets(e,c){
    for(const q of c.comets){const p=local(e,q),a=Math.atan2(q.vy,q.vx);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);const tail=q.p4?70:48,grad=ctx.createLinearGradient(-tail,0,0,0);grad.addColorStop(0,'rgba(120,150,255,0)');grad.addColorStop(1,q.p4?'rgba(248,251,255,.92)':'rgba(166,193,255,.78)');ctx.strokeStyle=grad;ctx.lineWidth=q.p4?10:6;ctx.lineCap='round';ctx.shadowColor=q.p4?'#ffffff':'#9fb8ff';ctx.shadowBlur=q.p4?20:12;ctx.beginPath();ctx.moveTo(-tail,0);ctx.lineTo(-3,0);ctx.stroke();ctx.fillStyle=q.p4?'#ffffff':'#dce7ff';ctx.strokeStyle=q.p4?'#b7caff':'#8fa8ef';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(q.r*1.35,0);ctx.lineTo(0,-q.r*.72);ctx.lineTo(-q.r*.78,0);ctx.lineTo(0,q.r*.72);ctx.closePath();ctx.fill();ctx.stroke();if(q.p4){ctx.globalAlpha=.65;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,q.r*1.45,0,TAU);ctx.stroke();}ctx.restore();}
  }
  function drawConnections(e,c,phase){
    if(phase===3){for(const [a,b] of permanentSegments(e)){drawLineLocal(e,a,b,10,'#dfe8ff',.22,14);drawLineLocal(e,a,b,3.4,'#f7f9ff',.88,8);}return;}
    const link=c.linkHazard;if(!link)return;const firing=link.age>=link.warn,alpha=firing?1:clamp01(link.age/Math.max(.01,link.warn))*.65;
    for(const [a,b] of linkSegments(e,link)){drawLineLocal(e,a,b,firing?9:2.1,firing?'#f6f8ff':'#94a9ef',alpha,firing?14:5);if(!firing){const p=local(e,a),q=local(e,b);ctx.save();ctx.globalAlpha=.45;ctx.strokeStyle='#c7d5ff';ctx.lineWidth=1;ctx.setLineDash([10,9]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.restore();}}
  }
  function drawBeams(e,c){
    for(const b of c.beams){const path=beamPath(e,b),warn=b.stage==='warn',alpha=warn?.68:1;if(warn)drawLineLocal(e,path[0],path[1],2.2,b.phase===4?'#d8e5ff':'#9fb7ff',alpha,6);else{const w=b.width;drawLineLocal(e,path[0],path[1],w*2,b.phase===4?'rgba(132,161,255,.34)':'rgba(120,153,255,.28)',.72,w*1.6);drawLineLocal(e,path[0],path[1],w,b.phase===4?'#e7efff':'#bfd0ff',.96,w*.9);drawLineLocal(e,path[0],path[1],Math.max(3,w*.28),'#ffffff',1,w*.45);}const end=local(e,path[1]);ctx.save();ctx.translate(end.x,end.y);ctx.globalAlpha=warn?.55:.86;ctx.strokeStyle=b.phase===4?'#ffffff':'#c9d8ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,warn?8:11,0,TAU);ctx.stroke();ctx.restore();}
  }
  function drawPulses(e,c){
    for(const p of c.pulses){if(p.delay>0)continue;const lp=local(e,p),activeAlpha=clamp01(1-p.r/Math.max(1,p.maxR))*.72+.20;ctx.save();ctx.translate(lp.x,lp.y);ctx.strokeStyle=p.phase===4?'#f0f5ff':'#aebfff';ctx.lineWidth=p.band;ctx.lineCap='round';ctx.shadowColor='#9fb7ff';ctx.shadowBlur=p.phase===4?16:10;ctx.globalAlpha=activeAlpha;const gaps=[...p.gapAngles].sort((a,b)=>a-b),half=p.gapHalf;for(let i=0;i<gaps.length;i++){let start=gaps[i]+half,end=gaps[(i+1)%gaps.length]-half;if(i===gaps.length-1)end+=TAU;if(end>start){ctx.beginPath();ctx.arc(0,0,p.r,start,end);ctx.stroke();}}ctx.globalAlpha=.32;ctx.lineWidth=1.3;ctx.shadowBlur=0;for(const g of p.gapAngles){ctx.beginPath();ctx.moveTo(Math.cos(g-half)*Math.max(0,p.r-18),Math.sin(g-half)*Math.max(0,p.r-18));ctx.lineTo(Math.cos(g-half)*(p.r+18),Math.sin(g-half)*(p.r+18));ctx.moveTo(Math.cos(g+half)*Math.max(0,p.r-18),Math.sin(g+half)*Math.max(0,p.r-18));ctx.lineTo(Math.cos(g+half)*(p.r+18),Math.sin(g+half)*(p.r+18));ctx.stroke();}ctx.restore();}
  }
  function drawRicochet(e,c){
    const r=c.ricochet;if(!r)return;const path=ricochetPath(e,c,r),warn=r.stage==='warn';for(let i=0;i<path.length-1;i++){if(warn)drawLineLocal(e,path[i],path[i+1],1.8,'#e7efff',.78,3);else{drawLineLocal(e,path[i],path[i+1],r.width*1.9,'rgba(155,182,255,.30)',.82,20);drawLineLocal(e,path[i],path[i+1],r.width,'#edf3ff',1,13);drawLineLocal(e,path[i],path[i+1],3.2,'#ffffff',1,7);}}for(let i=1;i<path.length-1;i++){const p=local(e,path[i]);ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#ffffff';ctx.shadowColor='#c9d8ff';ctx.shadowBlur=warn?8:24;ctx.globalAlpha=warn?.68:.96;ctx.beginPath();ctx.arc(0,0,warn?4.5:8,0,TAU);ctx.fill();ctx.restore();}
  }

  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(baseDrawEliteShape)drawEliteShape=function lastConstellationCombatV2Shape(e){const result=baseDrawEliteShape(e);if(!isLC(e)||!e.lcCombat)return result;const c=e.lcCombat,phase=e.lcStructure?.phase||1;drawDebris(e,c);drawConnections(e,c,phase);drawPulses(e,c);drawComets(e,c);drawBeams(e,c);drawRicochet(e,c);return result;};

  window.stackfallLastConstellationCombatDiagnostics=()=>{
    const e=liveLC();if(!e?.lcStructure)return null;const c=ensureCombat(e),phase=e.lcStructure.phase,cfg=CFG[phase],volley=c.lastCometVolley||{};
    return{
      version:'v2',revision:4,phase,
      cometPerNode:cfg.cometCount,activeNodeCount:activeParts(e).length,activeComets:c.comets.length,lastCometVolley:volley,
      cometVolleyCountCorrect:volley.phase!==phase||volley.spawned===volley.activeNodes*volley.expectedPerNode,
      beamCooldown:cfg.beamCd,beamTargetSpeed:cfg.beamTargetSpeed,beamWidth:cfg.beamWidth,activeBeams:c.beams.length,beamEndpointTracking:true,
      connectionMode:phase===3?'permanent':phase===4?'none':'cooldown',connectionMaxNodes:cfg.linkNodes,activeLinkNodes:c.linkHazard?.keys?.length||0,
      pulseUnlocked:phase>=2,pulseSpeed:cfg.pulseSpeed,pulseGapCount:cfg.pulseGaps,pulseWaveCount:cfg.pulseWaves,pulseWaveInterval:PULSE_WAVE_INTERVAL,pulseDelays:c.pulses.map(p=>p.delay).sort((a,b)=>a-b),activePulses:c.pulses.length,
      sourceShockwaveViewportCulling:true,
      debrisCount:c.debris.length,debrisAnchors:debrisAnchors(c).length,
      p4TrackingBeamRicochet:false,p4RicochetStage:c.ricochet?.stage||null,p4RicochetBounceCount:c.ricochet?.bounceCount||0,p4RicochetPathFixed:!!c.ricochet?.points,
      patterns:['node-links','weak-homing-comets-per-node','endpoint-tracking-beams','multi-gap-pulse-wave','p4-telegraphed-ricochet']
    };
  };

  if(window.stackfallDeveloperTest?.enabled){
    window.stackfallLastConstellationCombatDebug={
      forceComets(){const e=liveLC();if(!e)return false;spawnComets(e,e.lcStructure?.phase||1);return true;},
      forceBeam(){const e=liveLC();if(!e)return false;startBeamVolley(e,e.lcStructure?.phase||1);return true;},
      forceConnection(count=null){const e=liveLC();if(!e)return false;startConnection(e,e.lcStructure?.phase||1,count);return true;},
      forcePulse(){const e=liveLC();if(!e||e.lcStructure?.phase<2)return false;spawnPulseBurst(e,e.lcStructure.phase);return true;},
      forceRicochet(){const e=liveLC();if(!e||e.lcStructure?.phase!==4)return false;const c=ensureCombat(e);startRicochet(e,c);return true;},
      clear(){const e=liveLC();if(!e?.lcCombat)return false;e.lcCombat.comets.length=0;e.lcCombat.beams.length=0;e.lcCombat.pulses.length=0;e.lcCombat.ricochet=null;e.lcCombat.linkHazard=null;return true;}
    };
  }
})();
