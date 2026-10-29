// Last Constellation combat v2.
// Authored kit only: node links, weak-homing comets, tracking beams, persistent debris,
// and P4 debris-ricochet core beam. The 4 -> 3 -> 3 -> 1 structure remains authoritative.
(()=>{
  if(window.stackfallLastConstellationCombat==='v2')return;
  window.stackfallLastConstellationCombat='v2';

  const FORM='lastconstellation',TAU=Math.PI*2;
  const CFG={
    1:{cometCount:1,cometSpeed:220,cometTurn:.42,cometCd:4.25,beamCd:11.4,beamWarn:1.00,beamLife:1.80,beamTrack:.34,beamWidth:12,linkCd:5.8,linkWarn:.72,linkLife:2.45,linkNodes:2},
    2:{cometCount:2,cometSpeed:235,cometTurn:.50,cometCd:3.80,beamCd:9.4,beamWarn:.94,beamLife:1.90,beamTrack:.39,beamWidth:14,linkCd:4.15,linkWarn:.66,linkLife:2.70,linkNodes:3},
    3:{cometCount:2,cometSpeed:250,cometTurn:.58,cometCd:3.35,beamCd:7.7,beamWarn:.88,beamLife:2.05,beamTrack:.44,beamWidth:16,linkCd:0,linkWarn:0,linkLife:999,linkNodes:3},
    4:{cometCount:5,cometSpeed:270,cometTurn:.66,cometCd:3.05,beamCd:6.2,beamWarn:.92,beamLife:2.35,beamTrack:.48,beamWidth:30,linkCd:0,linkWarn:0,linkLife:0,linkNodes:0}
  };
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const liveLC=()=>state.entities.enemies.find(isLC)||null;
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const angleTowardLocal=(current,target,maxStep)=>{
    const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
    return current+Math.max(-maxStep,Math.min(maxStep,delta));
  };
  const segDist=(px,py,x1,y1,x2,y2)=>{
    const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l));
    return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));
  };
  const activeParts=e=>(e?.bodyParts||[]).filter(p=>p?.lcNodeProxy&&p.active&&p.visible&&!p.dead);
  const partByKey=(e,key)=>(e?.bodyParts||[]).find(p=>p?.lcNodeProxy&&p.lcNodeKey===key)||null;
  const hurt=(e,damage)=>{if(player.invuln<=0&&typeof hurtPlayer==='function')hurtPlayer(Math.max(1,damage),e);};

  function ensureCombat(e){
    if(e.lcCombat?.version===2)return e.lcCombat;
    e.lcCombat={
      version:2,phase:e.lcStructure?.phase||1,cometCd:1.55,beamCd:5.2,linkCd:2.4,
      comets:[],beams:[],linkHazard:null,debris:[],debrisKeys:new Set(),serial:0
    };
    return e.lcCombat;
  }

  function nodeOrigin(e,key){
    const p=partByKey(e,key);
    return p?{x:p.x,y:p.y,r:p.r}:{x:e.x,y:e.y,r:e.r};
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
          vx:Math.cos(a)*(5.5+i*2.2),vy:Math.sin(a)*(5.5+i*2.2),
          rot:a,spin:(i%2?1:-1)*(.10+i*.035),size
        });
      }
    }
  }
  function updateDebris(e,c,dt){
    registerNewDebris(e,c);
    const drag=Math.pow(.985,dt*60);
    for(const d of c.debris){
      d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=drag;d.vy*=drag;d.rot+=d.spin*dt;
      // keep the fragments in the broad constellation field rather than letting them drift forever
      const dx=d.x-e.x,dy=d.y-e.y,dist=Math.hypot(dx,dy)||1,limit=e.r*22;
      if(dist>limit){d.x=e.x+dx/dist*limit;d.y=e.y+dy/dist*limit;d.vx*=-.35;d.vy*=-.35;}
    }
  }
  function debrisAnchors(c){return c.debris.filter(d=>d.anchor);}

  // ---- Weak-homing comets --------------------------------------------------------------------
  function spawnComets(e,phase){
    const cfg=CFG[phase],c=ensureCombat(e),parts=activeParts(e);
    if(!parts.length)return;
    for(const part of parts){
      const base=Math.atan2(player.y-part.y,player.x-part.x),count=cfg.cometCount;
      for(let i=0;i<count;i++){
        const spread=(i-(count-1)/2)*(phase===4?.105:.13),a=base+spread;
        c.comets.push({
          x:part.x,y:part.y,vx:Math.cos(a)*cfg.cometSpeed,vy:Math.sin(a)*cfg.cometSpeed,
          speed:cfg.cometSpeed,turn:cfg.cometTurn,life:5.25,age:0,r:phase===4?13:9.5,
          damage:Math.max(4,(Number(e.damage)||18)*(phase===4?.27:.21+.012*phase)),
          phase,p4:phase===4,trail:0
        });
      }
      if(typeof shockwave==='function')shockwave(part.x,part.y,phase===4?'#f4f7ff':'#a8bcff',phase===4?70:52,.23,1.7);
    }
    if(c.comets.length>44)c.comets.splice(0,c.comets.length-44);
  }
  function updateComets(e,c,dt){
    for(const q of c.comets){
      q.age+=dt;q.life-=dt;
      if(q.life<=0)continue;
      const current=Math.atan2(q.vy,q.vx),target=Math.atan2(player.y-q.y,player.x-q.x),next=angleTowardLocal(current,target,q.turn*dt);
      q.vx=Math.cos(next)*q.speed;q.vy=Math.sin(next)*q.speed;
      q.x+=q.vx*dt;q.y+=q.vy*dt;
      q.trail-=dt;
      if(q.trail<=0){q.trail=q.p4?.055:.075;if(typeof spawnParticle==='function')spawnParticle(q.x-q.vx*.025,q.y-q.vy*.025,q.p4?'#f1f5ff':'#9fb7ff',1,q.p4?32:24,q.p4?3.2:2.2);}
      if(Math.hypot(player.x-q.x,player.y-q.y)<=player.r+q.r){
        hurt(e,q.damage);q.life=0;
        if(typeof shockwave==='function')shockwave(q.x,q.y,q.p4?'#ffffff':'#b7c9ff',q.p4?72:46,.25,q.p4?3:2);
      }
    }
    c.comets=c.comets.filter(q=>q.life>0);
  }

  // ---- Temporary / permanent node connections ------------------------------------------------
  function chooseParts(parts,count,serial){
    if(parts.length<=count)return parts.slice();
    const out=[],used=new Set();
    for(let i=0;i<count;i++){
      let idx=(serial+i*Math.max(1,Math.floor(parts.length/count)))%parts.length;
      while(used.has(idx))idx=(idx+1)%parts.length;
      used.add(idx);out.push(parts[idx]);
    }
    return out;
  }
  function startConnection(e,phase,forcedCount=null){
    if(phase>=3)return;
    const c=ensureCombat(e),cfg=CFG[phase],parts=activeParts(e);
    if(parts.length<2)return;
    let count=phase===1?2:(forcedCount||((c.serial++%3===0&&parts.length>=3)?3:2));
    count=Math.max(2,Math.min(count,parts.length,cfg.linkNodes));
    const chosen=chooseParts(parts,count,c.serial++);
    c.linkHazard={phase,keys:chosen.map(p=>p.lcNodeKey),age:0,warn:cfg.linkWarn,life:cfg.linkLife,damage:Math.max(4,(Number(e.damage)||18)*(.25+.02*phase))};
  }
  function linkSegments(e,link){
    const pts=link.keys.map(key=>partByKey(e,key)).filter(p=>p?.active);
    const segments=[];
    for(let i=0;i<pts.length-1;i++)segments.push([pts[i],pts[i+1]]);
    if(pts.length>=3)segments.push([pts[pts.length-1],pts[0]]);
    return segments;
  }
  function permanentSegments(e){
    const pts=activeParts(e);
    if(pts.length<2)return[];
    const segments=[];
    for(let i=0;i<pts.length-1;i++)segments.push([pts[i],pts[i+1]]);
    if(pts.length>=3)segments.push([pts[pts.length-1],pts[0]]);
    return segments;
  }
  function updateConnections(e,c,phase,dt){
    if(phase===3){
      const segments=permanentSegments(e);
      if(player.invuln<=0)for(const [a,b] of segments)if(segDist(player.x,player.y,a.x,a.y,b.x,b.y)<=player.r+7){hurt(e,Math.max(3,(Number(e.damage)||18)*.23));break;}
      c.linkHazard=null;return;
    }
    if(phase===4){c.linkHazard=null;return;}
    const link=c.linkHazard;
    if(link){
      link.age+=dt;
      const activeStart=link.warn,activeEnd=link.warn+link.life;
      if(link.age>=activeStart&&link.age<=activeEnd&&player.invuln<=0){
        for(const [a,b] of linkSegments(e,link))if(segDist(player.x,player.y,a.x,a.y,b.x,b.y)<=player.r+9){hurt(e,link.damage);break;}
      }
      if(link.age>activeEnd+.28)c.linkHazard=null;
    }
    c.linkCd-=dt;
    if(!c.linkHazard&&c.linkCd<=0){startConnection(e,phase);c.linkCd=CFG[phase].linkCd;}
  }

  // ---- Tracking sustained beams ---------------------------------------------------------------
  function chooseBounceIds(c,serial){
    const anchors=debrisAnchors(c);if(!anchors.length)return[];
    const count=Math.min(3,anchors.length),out=[],used=new Set(),step=Math.max(1,Math.floor(anchors.length/count));
    for(let i=0;i<count;i++){
      let idx=(serial+i*step)%anchors.length;while(used.has(idx))idx=(idx+1)%anchors.length;
      used.add(idx);out.push(anchors[idx].id);
    }
    return out;
  }
  function debrisById(c,id){return c.debris.find(d=>d.id===id)||null;}
  function startBeamVolley(e,phase){
    const c=ensureCombat(e),cfg=CFG[phase],parts=activeParts(e);
    if(!parts.length)return;
    c.beams.length=0;
    for(const part of parts){
      const target=Math.atan2(player.y-part.y,player.x-part.x);
      c.beams.push({
        key:part.lcNodeKey,phase,stage:'warn',timer:cfg.beamWarn,angle:target,
        life:cfg.beamLife,width:cfg.beamWidth,damage:Math.max(5,(Number(e.damage)||18)*(phase===4?.42:.31+.02*phase)),
        bounceIds:phase===4?chooseBounceIds(c,c.serial++):[],fired:false
      });
    }
  }
  function beamPath(e,c,b){
    const origin=partByKey(e,b.key)||{x:e.x,y:e.y};
    const pts=[{x:origin.x,y:origin.y}];
    if(b.phase===4)for(const id of b.bounceIds){const d=debrisById(c,id);if(d)pts.push({x:d.x,y:d.y});}
    const last=pts[pts.length-1],length=b.phase===4?2500:2800;
    pts.push({x:last.x+Math.cos(b.angle)*length,y:last.y+Math.sin(b.angle)*length});
    return pts;
  }
  function updateBeams(e,c,phase,dt){
    const cfg=CFG[phase];
    for(const b of c.beams){
      const sourcePart=partByKey(e,b.key);
      if(!sourcePart?.active){b.stage='dead';b.life=0;continue;}
      const path=beamPath(e,c,b),last=path[path.length-2],target=Math.atan2(player.y-last.y,player.x-last.x);
      if(b.stage==='warn'){
        b.angle=angleTowardLocal(b.angle,target,1.75*dt);b.timer-=dt;
        if(b.timer<=0){
          b.stage='active';b.life=cfg.beamLife;b.fired=true;
          state.camera.shake=Math.max(state.camera.shake,phase===4?10:5.5);state.flash=Math.max(state.flash,phase===4?.14:.07);
          if(typeof shockwave==='function'){
            const origin=path[0];shockwave(origin.x,origin.y,phase===4?'#ffffff':'#dce7ff',phase===4?150:90,.34,phase===4?5:3);
            if(phase===4)for(let i=1;i<path.length-1;i++)shockwave(path[i].x,path[i].y,'#dce7ff',74,.26,2.8);
          }
          if(typeof audio?.tone==='function')audio.tone(phase===4?72:108,.22,'sawtooth',phase===4?.022:.012,phase===4?85:45);
        }
      }else{
        b.angle=angleTowardLocal(b.angle,target,cfg.beamTrack*dt);b.life-=dt;
        const livePath=beamPath(e,c,b);
        if(player.invuln<=0){
          const hitWidth=b.width*.52+player.r;
          for(let i=0;i<livePath.length-1;i++)if(segDist(player.x,player.y,livePath[i].x,livePath[i].y,livePath[i+1].x,livePath[i+1].y)<=hitWidth){hurt(e,b.damage);break;}
        }
        if(Math.random()<dt*(phase===4?20:9)){
          const origin=livePath[0];spawnParticle(origin.x+rand(-10,10),origin.y+rand(-10,10),phase===4?'#ffffff':'#c4d3ff',1,phase===4?80:45,phase===4?4:2.5);
        }
      }
    }
    c.beams=c.beams.filter(b=>b.stage!=='dead'&&(b.stage==='warn'||b.life>0));
    c.beamCd-=dt;
    if(!c.beams.length&&c.beamCd<=0){startBeamVolley(e,phase);c.beamCd=cfg.beamCd;}
  }

  function resetForPhase(e,c,phase){
    c.phase=phase;c.comets.length=0;c.beams.length=0;c.linkHazard=null;
    c.cometCd=phase===1?1.5:1.05;c.beamCd=phase===1?5.5:phase===2?4.4:phase===3?3.6:2.8;c.linkCd=phase===1?2.4:1.6;
  }

  function updateCombat(e,dt){
    if(!e.lcStructure)return;
    const c=ensureCombat(e),phase=e.lcStructure.phase||1,cfg=CFG[phase];
    if(c.phase!==phase)resetForPhase(e,c,phase);
    updateDebris(e,c,dt);

    c.cometCd-=dt;
    if(c.cometCd<=0){spawnComets(e,phase);c.cometCd=cfg.cometCd;}
    updateComets(e,c,dt);
    updateConnections(e,c,phase,dt);
    updateBeams(e,c,phase,dt);
  }

  const baseUpdateEnemies=typeof updateEnemies==='function'?updateEnemies:null;
  if(baseUpdateEnemies)updateEnemies=function updateEnemiesWithLastConstellationCombatV2(dt){
    const result=baseUpdateEnemies(dt);
    for(const e of state.entities.enemies||[])if(isLC(e))updateCombat(e,dt);
    return result;
  };

  // ---- Rendering -----------------------------------------------------------------------------
  function local(e,p){return{x:p.x-e.x,y:p.y-e.y};}
  function drawLineLocal(e,a,b,width,color,alpha,blur=0){
    const p=local(e,a),q=local(e,b);ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';
    if(blur){ctx.shadowColor=color;ctx.shadowBlur=blur;}
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.restore();
  }
  function drawDebris(e,c){
    for(const d of c.debris){
      const p=local(e,d);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(d.rot);ctx.globalAlpha=.78;
      ctx.shadowColor='#9fb6ff';ctx.shadowBlur=9;ctx.fillStyle='rgba(112,132,193,.66)';ctx.strokeStyle='#dce6ff';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(0,-d.size);ctx.lineTo(d.size*.55,-d.size*.08);ctx.lineTo(d.size*.20,d.size*.78);ctx.lineTo(-d.size*.48,d.size*.35);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
  }
  function drawComets(e,c){
    for(const q of c.comets){
      const p=local(e,q),a=Math.atan2(q.vy,q.vx);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);
      const tail=q.p4?70:48,grad=ctx.createLinearGradient(-tail,0,0,0);grad.addColorStop(0,'rgba(120,150,255,0)');grad.addColorStop(1,q.p4?'rgba(248,251,255,.92)':'rgba(166,193,255,.78)');
      ctx.strokeStyle=grad;ctx.lineWidth=q.p4?10:6;ctx.lineCap='round';ctx.shadowColor=q.p4?'#ffffff':'#9fb8ff';ctx.shadowBlur=q.p4?20:12;ctx.beginPath();ctx.moveTo(-tail,0);ctx.lineTo(-3,0);ctx.stroke();
      ctx.fillStyle=q.p4?'#ffffff':'#dce7ff';ctx.strokeStyle=q.p4?'#b7caff':'#8fa8ef';ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(q.r*1.35,0);ctx.lineTo(0,-q.r*.72);ctx.lineTo(-q.r*.78,0);ctx.lineTo(0,q.r*.72);ctx.closePath();ctx.fill();ctx.stroke();
      if(q.p4){ctx.globalAlpha=.65;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,q.r*1.45,0,TAU);ctx.stroke();}
      ctx.restore();
    }
  }
  function drawConnections(e,c,phase){
    if(phase===3){
      for(const [a,b] of permanentSegments(e)){drawLineLocal(e,a,b,10,'#dfe8ff',.22,14);drawLineLocal(e,a,b,3.4,'#f7f9ff',.88,8);}
      return;
    }
    const link=c.linkHazard;if(!link)return;
    const firing=link.age>=link.warn,alpha=firing?1:clamp01(link.age/Math.max(.01,link.warn))*.65;
    for(const [a,b] of linkSegments(e,link)){
      drawLineLocal(e,a,b,firing?9:2.1,firing?'#f6f8ff':'#94a9ef',alpha,firing?14:5);
      if(!firing){const p=local(e,a),q=local(e,b);ctx.save();ctx.globalAlpha=.45;ctx.strokeStyle='#c7d5ff';ctx.lineWidth=1;ctx.setLineDash([10,9]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.restore();}
    }
  }
  function drawBeams(e,c){
    for(const b of c.beams){
      const path=beamPath(e,c,b),warn=b.stage==='warn',alpha=warn?.68:1;
      for(let i=0;i<path.length-1;i++){
        if(warn){
          drawLineLocal(e,path[i],path[i+1],2.2,b.phase===4?'#d8e5ff':'#9fb7ff',alpha,6);
        }else{
          const w=b.width;
          drawLineLocal(e,path[i],path[i+1],w*2.0,b.phase===4?'rgba(132,161,255,.34)':'rgba(120,153,255,.28)',.72,w*1.6);
          drawLineLocal(e,path[i],path[i+1],w,b.phase===4?'#e7efff':'#bfd0ff',.96,w*.9);
          drawLineLocal(e,path[i],path[i+1],Math.max(3,w*.28),'#ffffff',1,w*.45);
        }
      }
      if(!warn&&b.phase===4){
        for(let i=1;i<path.length-1;i++){
          const p=local(e,path[i]);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=.92;ctx.fillStyle='#ffffff';ctx.shadowColor='#c9d8ff';ctx.shadowBlur=24;
          ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.fill();ctx.restore();
        }
      }
    }
  }

  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(baseDrawEliteShape)drawEliteShape=function lastConstellationCombatV2Shape(e){
    const result=baseDrawEliteShape(e);
    if(!isLC(e)||!e.lcCombat)return result;
    const c=e.lcCombat,phase=e.lcStructure?.phase||1;
    drawDebris(e,c);drawConnections(e,c,phase);drawComets(e,c);drawBeams(e,c);
    return result;
  };

  window.stackfallLastConstellationCombatDiagnostics=()=>{
    const e=liveLC();if(!e?.lcStructure)return null;const c=ensureCombat(e),phase=e.lcStructure.phase,cfg=CFG[phase];
    return{
      version:'v2',phase,
      cometPerNode:cfg.cometCount,cometSpeed:cfg.cometSpeed,cometTurn:cfg.cometTurn,activeComets:c.comets.length,
      beamCooldown:cfg.beamCd,beamTrackSpeed:cfg.beamTrack,beamWidth:cfg.beamWidth,activeBeams:c.beams.length,
      connectionMode:phase===3?'permanent':phase===4?'none':'cooldown',
      connectionMaxNodes:cfg.linkNodes,activeLinkNodes:c.linkHazard?.keys?.length||0,
      debrisCount:c.debris.length,debrisAnchors:debrisAnchors(c).length,
      p4Ricochet:phase===4&&c.beams.some(b=>b.bounceIds.length>0),
      p4BounceCount:phase===4?Math.max(0,...c.beams.map(b=>b.bounceIds.length)):0,
      patterns:['node-links','weak-homing-comets','tracking-beams','p4-debris-ricochet']
    };
  };

  if(window.stackfallDeveloperTest?.enabled){
    window.stackfallLastConstellationCombatDebug={
      forceComets(){const e=liveLC();if(!e)return false;spawnComets(e,e.lcStructure?.phase||1);return true;},
      forceBeam(){const e=liveLC();if(!e)return false;startBeamVolley(e,e.lcStructure?.phase||1);return true;},
      forceConnection(count=null){const e=liveLC();if(!e)return false;startConnection(e,e.lcStructure?.phase||1,count);return true;},
      clear(){const e=liveLC();if(!e?.lcCombat)return false;e.lcCombat.comets.length=0;e.lcCombat.beams.length=0;e.lcCombat.linkHazard=null;return true;}
    };
  }
})();
