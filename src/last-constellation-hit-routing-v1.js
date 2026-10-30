// Last Constellation hit routing v1.
// The stellar structure is far larger than the normal enemy spatial grid. Keep this correction local to Last Constellation.
(()=>{
  if(window.stackfallLastConstellationHitRouting==='v1')return;
  window.stackfallLastConstellationHitRouting='v1';
  const FORM='lastconstellation';
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const liveLC=()=>state.entities.enemies.filter(isLC);
  const activeParts=e=>(e?.bodyParts||[]).filter(p=>p?.lcNodeProxy&&p.active&&p.visible&&!p.dead);
  let pendingBladeWave=null;
  function nearestPart(e,x,y,range=Infinity){let best=null,bestD=Number.isFinite(range)?range*range:Infinity;for(const p of activeParts(e)){const d=(p.x-x)**2+(p.y-y)**2;if(d<=bestD){bestD=d;best=p;}}return best;}
  function partAt(e,x,y,r=0){for(const p of activeParts(e))if((p.x-x)**2+(p.y-y)**2<=(p.r+r)**2)return p;return null;}
  function segDist(px,py,x1,y1,x2,y2){if(typeof segmentDistance==='function')return segmentDistance(px,py,x1,y1,x2,y2);const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l));return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));}
  function restoreBladeOwner(e){
    const restore=e?.__lcBladeWaveOwnerRestore;if(!restore)return;
    const x=Number.isFinite(e.lcStructure?.anchorX)?e.lcStructure.anchorX:restore.x;
    const y=Number.isFinite(e.lcStructure?.anchorY)?e.lcStructure.anchorY:restore.y;
    const xDesc=Object.getOwnPropertyDescriptor(e,'x'),yDesc=Object.getOwnPropertyDescriptor(e,'y');
    if(xDesc?.get===restore.getX)delete e.x;
    if(yDesc?.get===restore.getY)delete e.y;
    e.x=x;e.y=y;e.__lcBladeWaveOwnerRestore=null;
  }
  function exposeImmediateBladeOrigin(e,hit){
    restoreBladeOwner(e);
    const anchorX=Number.isFinite(e.lcStructure?.anchorX)?e.lcStructure.anchorX:Number(e.x)||0;
    const anchorY=Number.isFinite(e.lcStructure?.anchorY)?e.lcStructure.anchorY:Number(e.y)||0;
    let assignedX=anchorX,assignedY=anchorY;
    const getX=()=>hit.x,getY=()=>hit.y;
    Object.defineProperty(e,'x',{configurable:true,enumerable:true,get:getX,set(v){if(Number.isFinite(v))assignedX=v;}});
    Object.defineProperty(e,'y',{configurable:true,enumerable:true,get:getY,set(v){if(Number.isFinite(v))assignedY=v;}});
    e.__lcBladeWaveOwnerRestore={x:anchorX,y:anchorY,getX,getY,assignedX,assignedY,at:hit.at};
    queueMicrotask(()=>restoreBladeOwner(e));
  }

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
      for(const e of liveLC()){
        const p=nearestPart(e,x,y,range+220);if(!p||visited.has(p.id))continue;
        if(Math.hypot(p.x-x,p.y-y)<=range+p.r){visited.add(p.id);visit(p);}
      }
    };
  }

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
        if(part){
          const result=base(part,amount,options);
          // Production damage syncs the constellation proxy positions. The follow-up wave must use
          // the node's post-sync position, not the pre-damage visual position that was just struck.
          const hit={ownerId:target.id,x:part.x,y:part.y,at:performance.now()};
          target.__lcLastBladeHit=hit;pendingBladeWave=hit;
          exposeImmediateBladeOrigin(target,hit);
          return result;
        }
      }
      return base(target,amount,options);
    };
  }

  function installWaveRouter(){
    if(typeof spawnPlayerProjectile!=='function')return false;
    if(spawnPlayerProjectile?.__lcBladeWaveRouter===true)return true;
    const base=spawnPlayerProjectile;
    const routed=function lastConstellationBladeWaveOrigin(data){
      let next=data,ownerToRestore=null;
      if(String(data?.source||'')==='wave'){
        const now=performance.now();let hit=pendingBladeWave;
        if(!hit||now-hit.at>500){hit=null;for(const e of liveLC()){const candidate=e.__lcLastBladeHit,age=candidate?now-candidate.at:Infinity;if(!candidate||age>500)continue;if(!hit||candidate.at>hit.at)hit=candidate;}}
        if(hit){
          const dx=hit.x-player.x,dy=hit.y-player.y,d=Math.hypot(dx,dy)||1,speed=Math.max(1,Math.hypot(Number(data.vx)||0,Number(data.vy)||0));
          next={...data,x:hit.x,y:hit.y,vx:dx/d*speed,vy:dy/d*speed};pendingBladeWave=null;
          ownerToRestore=liveLC().find(e=>e.id===hit.ownerId)||null;if(ownerToRestore)ownerToRestore.__lcLastBladeHit=null;
        }
      }
      const result=base(next);if(ownerToRestore)restoreBladeOwner(ownerToRestore);return result;
    };
    Object.defineProperty(routed,'__lcBladeWaveRouter',{value:true});
    spawnPlayerProjectile=routed;try{window.spawnPlayerProjectile=routed;}catch{}
    return true;
  }
  installWaveRouter();queueMicrotask(installWaveRouter);setTimeout(installWaveRouter,0);setTimeout(installWaveRouter,250);setTimeout(installWaveRouter,1000);

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
    return{version:'v1',revision:7,active:!!e,phase:e?.lcStructure?.phase||null,activeProxyCount:e?activeParts(e).length:0,projectileFallback:true,nearbyCandidateRouting:true,bladeContactRouting:true,bladeWaveOriginRouting:true,bladeWaveRouterInstalled:spawnPlayerProjectile?.__lcBladeWaveRouter===true,pendingBladeWave:!!pendingBladeWave,temporaryOwnerAnchor:!!e?.__lcBladeWaveOwnerRestore};
  };
})();