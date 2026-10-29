// Last Constellation hit routing v1.
// The stellar structure is far larger than the normal enemy spatial grid. Keep this correction local to Last Constellation.
(()=>{
  if(window.stackfallLastConstellationHitRouting==='v1')return;
  window.stackfallLastConstellationHitRouting='v1';
  const FORM='lastconstellation';
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const liveLC=()=>state.entities.enemies.filter(isLC);
  const activeParts=e=>(e?.bodyParts||[]).filter(p=>p?.lcNodeProxy&&p.active&&p.visible&&!p.dead);
  function nearestPart(e,x,y,range=Infinity){let best=null,bestD=Number.isFinite(range)?range*range:Infinity;for(const p of activeParts(e)){const d=(p.x-x)**2+(p.y-y)**2;if(d<=bestD){bestD=d;best=p;}}return best;}
  function partAt(e,x,y,r=0){for(const p of activeParts(e))if((p.x-x)**2+(p.y-y)**2<=(p.r+r)**2)return p;return null;}
  function segDist(px,py,x1,y1,x2,y2){if(typeof segmentDistance==='function')return segmentDistance(px,py,x1,y1,x2,y2);const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l));return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));}

  // Area, beam, trail and aura weapons use this candidate iterator. Convert an LC owner candidate
  // into the nearest exposed node proxy so dealDamage receives the actual node, not the dormant center.
  if(typeof forEachNearbyEnemyCandidate==='function'){
    const base=forEachNearbyEnemyCandidate;
    forEachNearbyEnemyCandidate=function lastConstellationNodeCandidates(x,y,range,visit){
      const visited=new Set();
      base(x,y,range,target=>{
        if(target?.lcNodeProxy){if(!visited.has(target.id)){visited.add(target.id);visit(target);}return;}
        if(isLC(target)){
          const p=nearestPart(target,x,y,range+220);if(p&&Math.hypot(p.x-x,p.y-y)<=range+p.r&&!visited.has(p.id)){visited.add(p.id);visit(p);}return;
        }
        if(target&&!visited.has(target.id)){visited.add(target.id);visit(target);}
      });
      // The performance grid can omit the LC owner entirely because its center is extremely far away.
      for(const e of liveLC()){
        const p=nearestPart(e,x,y,range+220);if(!p||visited.has(p.id))continue;
        if(Math.hypot(p.x-x,p.y-y)<=range+p.r){visited.add(p.id);visit(p);}
      }
    };
  }

  // Pulse Blade is the one legacy melee path that asks only for a boolean multipart overlap and
  // then damages the owner. Remember the exact exposed node touched by that overlap so the owner
  // damage call can be routed back to the node. This keeps P1-P3 hittable without changing the
  // weapon's cadence, damage, or ordinary multipart-boss behavior.
  if(typeof enemyCircleOverlap==='function'){
    const base=enemyCircleOverlap;
    enemyCircleOverlap=function lastConstellationCircleContact(enemy,x,y,r=0){
      if(!isLC(enemy))return base(enemy,x,y,r);
      const part=partAt(enemy,x,y,r);enemy.__lcLastCircleContact=part?{partId:part.id,at:performance.now()}:null;return!!part;
    };
  }
  if(typeof dealDamage==='function'){
    const base=dealDamage;
    dealDamage=function lastConstellationMeleeDamageRouting(target,amount,options={}){
      if(isLC(target)&&String(options?.source||'')==='blade'){
        const contact=target.__lcLastCircleContact;target.__lcLastCircleContact=null;
        const part=contact&&(target.bodyParts||[]).find(p=>p.id===contact.partId&&p.lcNodeProxy&&p.active&&!p.dead);
        if(part){target.__lcLastBladeHit={x:part.x,y:part.y,at:performance.now()};return base(part,amount,options);}
      }
      return base(target,amount,options);
    };
  }

  // Blade level 4+ emits its follow-up wave from the enemy entity. For Last Constellation that
  // entity is the dormant center, so re-anchor only the immediate blade follow-up to the node that
  // was actually struck. This also prevents visual effects from appearing at an unrelated core.
  if(typeof spawnPlayerProjectile==='function'){
    const base=spawnPlayerProjectile;
    spawnPlayerProjectile=function lastConstellationBladeWaveOrigin(data){
      let next=data;
      if(String(data?.source||'')==='wave')for(const e of liveLC()){
        const hit=e.__lcLastBladeHit,age=hit?performance.now()-hit.at:Infinity;
        if(!hit||age>90||Math.hypot((Number(data.x)||0)-e.x,(Number(data.y)||0)-e.y)>1)continue;
        const dx=hit.x-player.x,dy=hit.y-player.y,d=Math.hypot(dx,dy)||1,speed=Math.max(1,Math.hypot(Number(data.vx)||0,Number(data.vy)||0));
        next={...data,x:hit.x,y:hit.y,vx:dx/d*speed,vy:dy/d*speed};e.__lcLastBladeHit=null;break;
      }
      return base(next);
    };
  }

  // Direct player projectiles perform a performance-grid query before overlap testing. Add a local
  // post-update collision pass so a projectile crossing a remote exposed node can never tunnel through it.
  if(typeof updateProjectiles==='function'){
    const base=updateProjectiles;
    updateProjectiles=function updateProjectilesWithLastConstellationNodes(dt){
      const result=base(dt),step=Math.max(0,Number(dt)||0);
      for(const p of state.entities.projectiles||[]){
        if(!p||p.life<=0||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
        const x1=p.x-(Number(p.vx)||0)*step,y1=p.y-(Number(p.vy)||0)*step,x2=p.x,y2=p.y,pr=Math.max(.5,Number(p.r)||3);
        let consumed=false;
        for(const e of liveLC()){
          for(const part of activeParts(e)){
            if(p.hitIds?.has(part.id))continue;
            if(segDist(part.x,part.y,x1,y1,x2,y2)>part.r+pr)continue;
            dealDamage(part,Number(p.damage)||0,{color:p.color,source:p.source});
            if(!(p.hitIds instanceof Set))p.hitIds=new Set();p.hitIds.add(part.id);
            if(typeof spawnParticle==='function')spawnParticle(part.x,part.y,p.color||'#dce8ff',3,48,2.2);
            if((Number(p.pierce)||0)>0)p.pierce--;else{p.life=0;consumed=true;}
            break;
          }
          if(consumed)break;
        }
      }
      return result;
    };
  }

  window.stackfallLastConstellationHitRoutingDiagnostics=()=>{
    const e=state.entities.enemies.find(isLC)||null;
    return{version:'v1',revision:2,active:!!e,phase:e?.lcStructure?.phase||null,activeProxyCount:e?activeParts(e).length:0,projectileFallback:true,nearbyCandidateRouting:true,bladeContactRouting:true,bladeWaveOriginRouting:true};
  };
})();