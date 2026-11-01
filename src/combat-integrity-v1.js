(()=>{
  'use strict';
  if(window.stackfallCombatIntegrityV1==='v1')return;
  window.stackfallCombatIntegrityV1='v1';

  const finiteRange=range=>Number.isFinite(range)?Math.max(0,range):Infinity;
  function targetOwner(target){return target?.bodyPart===true?target.owner:target;}
  function inRange(target,x,y,range){
    if(!target||target.dead)return false;
    const limit=finiteRange(range);
    return !Number.isFinite(limit)||(target.x-x)**2+(target.y-y)**2<=limit*limit;
  }
  function activeParts(owner){
    if(!owner||owner.dead||!owner.bodyParts?.length)return[];
    if(typeof activeBossBodyParts==='function')return activeBossBodyParts(owner);
    return owner.bodyParts.filter(part=>part&&part.active!==false&&part.visible!==false&&!part.dead);
  }
  function nearestPartTo(owner,x,y,range=Infinity){
    if(typeof nearestBossBodyPart==='function')return nearestBossBodyPart(owner,x,y,range);
    let best=null,bestD=Number.isFinite(range)?range*range:Infinity;
    for(const part of activeParts(owner)){const d=(part.x-x)**2+(part.y-y)**2;if(d<=bestD){best=part;bestD=d;}}
    return best;
  }
  function resolveSurface(target,x=player.x,y=player.y,range=Infinity){
    if(!target)return null;
    if(target.bodyPart===true){
      const owner=target.owner;
      if(target.active!==false&&target.visible!==false&&!target.dead&&owner&&!owner.dead&&inRange(target,x,y,range))return target;
      return owner&&!owner.dead?nearestPartTo(owner,x,y,range):null;
    }
    if(target.dead)return null;
    if(target.bodyParts?.length)return nearestPartTo(target,x,y,range);
    return inRange(target,x,y,range)?target:null;
  }
  window.stackfallResolveWeaponTargetSurface=resolveSurface;

  function manualSurfaceTarget(key,x,y,predicate){
    if(GAME_SETTINGS.manualAim!==true||!state.input.aimActive)return null;
    const range=weaponRange(key),ax=state.input.aimWorldX,ay=state.input.aimWorldY;
    let best=null,bestScore=Infinity;
    for(const owner of state.entities.enemies){
      if(!owner||owner.dead||(predicate&&!predicate(owner)))continue;
      let candidate;
      if(owner.bodyParts?.length){
        let partBest=null,partScore=Infinity;
        for(const part of activeParts(owner)){
          if(!inRange(part,x,y,range))continue;
          const cursor=(part.x-ax)**2+(part.y-ay)**2;
          if(cursor<partScore){partScore=cursor;partBest=part;}
        }
        candidate=partBest;
      }else candidate=inRange(owner,x,y,range)?owner:null;
      if(!candidate)continue;
      const d2=(candidate.x-x)**2+(candidate.y-y)**2,cursorD2=(candidate.x-ax)**2+(candidate.y-ay)**2,score=cursorD2+d2*.002;
      if(score<bestScore){bestScore=score;best=candidate;}
    }
    return best;
  }
  function farthestSurfaceTarget(key,x=player.x,y=player.y,predicate=null){
    const manual=manualSurfaceTarget(key,x,y,predicate);if(manual)return manual;
    const range=weaponRange(key),range2=range*range;let best=null,bestD2=-1;
    for(const owner of state.entities.enemies){
      if(!owner||owner.dead||(predicate&&!predicate(owner)))continue;
      const candidates=owner.bodyParts?.length?activeParts(owner):[owner];
      for(const candidate of candidates){const dx=candidate.x-x,dy=candidate.y-y,d2=dx*dx+dy*dy;if(d2<=range2&&d2>bestD2){bestD2=d2;best=candidate;}}
    }
    return best;
  }
  window.farthestWeaponTarget=farthestSurfaceTarget;
  try{farthestWeaponTarget=farthestSurfaceTarget;}catch{}

  const baseNearestWeaponTarget=nearestWeaponTarget;
  nearestWeaponTarget=function integrityWeaponTarget(key,x=player.x,y=player.y,predicate=null){
    const manual=manualSurfaceTarget(key,x,y,predicate);if(manual)return manual;
    if(key==='arc')return farthestSurfaceTarget(key,x,y,predicate);
    const range=weaponRange(key),selected=baseNearestWeaponTarget(key,x,y,predicate),surface=resolveSurface(selected,x,y,range);
    if(surface)return surface;
    return nearestEnemy(x,y,range,predicate);
  };

  function strongestSurfaceTarget(x=player.x,y=player.y,range=Infinity){
    let best=null,bestScore=-Infinity;
    for(const owner of state.entities.enemies){
      if(!owner||owner.dead)continue;
      const surface=resolveSurface(owner,x,y,range);if(!surface)continue;
      const distance=Math.hypot(surface.x-x,surface.y-y),elite=owner.type==='boss'?2:owner.type==='mini'?1:0,score=elite*1e9+(owner.hp||0)-distance*.08;
      if(score>bestScore){bestScore=score;best=surface;}
    }
    return best;
  }
  try{strongestPostRosterEnemy=strongestSurfaceTarget;}catch{}

  postRosterTargetList=function integrityPostRosterTargetList(range,count){
    const out=[],limit=Math.max(1,Math.floor(count)||1);
    for(const owner of state.entities.enemies){
      if(!owner||owner.dead)continue;
      const surface=resolveSurface(owner,player.x,player.y,range);if(!surface)continue;
      const score=(owner.type==='boss'?2:owner.type==='mini'?1:0)*1e9+(owner.hp||0)-Math.hypot(surface.x-player.x,surface.y-player.y)*.08;
      let index=out.length;
      while(index>0){
        const previous=out[index-1],previousOwner=targetOwner(previous),previousScore=(previousOwner?.type==='boss'?2:previousOwner?.type==='mini'?1:0)*1e9+(previousOwner?.hp||0)-Math.hypot(previous.x-player.x,previous.y-player.y)*.08;
        if(previousScore>=score)break;index--;
      }
      out.splice(index,0,surface);if(out.length>limit)out.pop();
    }
    return out;
  };

  gateInstallTarget=function integrityGateInstallTarget(){
    let best=null,bestScore=-Infinity;const range=weaponRange('gate');
    for(const owner of state.entities.enemies){
      if(!owner||owner.dead)continue;const surface=resolveSurface(owner,player.x,player.y,range);if(!surface)continue;
      let nearby=0;for(const other of state.entities.enemies)if(other&&!other.dead&&Math.hypot(other.x-owner.x,other.y-owner.y)<150)nearby++;
      const score=(owner.type==='boss'?2:owner.type==='mini'?1:0)*1e8+nearby*250+(owner.hp||0)*.18-Math.hypot(surface.x-player.x,surface.y-player.y)*.10;
      if(score>bestScore){bestScore=score;best=surface;}
    }
    return best;
  };

  function nearestBossSurfaceInRailRange(){
    const range=weaponRange('rail');let best=null,bestD2=Infinity;
    for(const owner of state.entities.enemies){
      if(!owner||owner.dead||owner.type!=='boss')continue;
      const surface=resolveSurface(owner,player.x,player.y,range);if(!surface)continue;
      const d2=(surface.x-player.x)**2+(surface.y-player.y)**2;if(d2<bestD2){best=surface;bestD2=d2;}
    }
    return best;
  }
  function railOffsets(count,spacing){const out=[];for(let i=0;i<count;i++)out.push((i-(count-1)/2)*spacing);return out;}
  fireRailgun=function integrityBossPriorityRailgun(n,echoed=false){
    const manual=GAME_SETTINGS.manualAim===true&&state.input.aimActive,target=manual?nearestWeaponTarget('rail'):(nearestBossSurfaceInRailRange()||nearestWeaponTarget('rail'));if(!target)return;
    const x=player.x,y=player.y,angle=Math.atan2(target.y-y,target.x-x),length=weaponRange('rail'),size=weaponSizeMultiplier(),baseCount=clamp(Math.floor(n),1,6),extra=echoed?0:Math.min(2,Math.max(0,Number(stat('multiplicity'))||0)),count=baseCount+extra,spacing=(14+n*1.2)*size,offsets=railOffsets(count,spacing),nx=-Math.sin(angle),ny=Math.cos(angle),baseDamage=(40+n*9.4)*(echoed?.60:1),damage=baseDamage/Math.sqrt(baseCount),width=(5.2+n*.72)*size*Math.max(.72,1-Math.max(0,count-3)*.04),eliteBonus=n>=5?1.32:1,color=echoed?COLORS.pink:'#b7e7ff';
    const volley=(mult=1,after=false)=>{offsets.forEach((offset,index)=>{const x1=x+nx*offset,y1=y+ny*offset,x2=x1+Math.cos(angle)*length,y2=y1+Math.sin(angle)*length,extraBody=index>=baseCount&&!echoed;applyRailBeam(x1,y1,x2,y2,width*(after?.72:1),damage*mult,after?'#eaf8ff':extraBody?'#d9f3ff':color,after?'rail-afterimage':extraBody?'rail-multiplicity':'rail',eliteBonus);});};
    volley();if(n>=3)scheduleWeaponAction(120,()=>volley(.44,true));if(state.weaponAugments?.rail&&!echoed)scheduleWeaponAction(190,()=>{for(const[index,f]of[.34,.58,.82].entries()){const px=x+Math.cos(angle)*length*f,py=y+Math.sin(angle)*length*f;scheduleWeaponAction(index*70,()=>{areaDamage(px,py,38+n*3,11+n*3.1,'#b7e7ff','rail-fracture');shockwave(px,py,'#eaf8ff',52+n*4,.24,1.8);});}});trimOldest(state.entities.beams,entityCap('beams'));
  };

  fireBoomerang=function integrityBoomerang(target,stacks,echoed=false,origin=null,ricochet=false){
    const range=weaponRange('arc'),originPoint=origin&&Number.isFinite(origin.x)&&Number.isFinite(origin.y)?origin:null;
    target=resolveSurface(target,originPoint?.x??player.x,originPoint?.y??player.y,range)||nearestWeaponTarget('arc');if(!target)return;
    const shots=ricochet?1:stacks>=6?3:stacks>=2?2:1,start=originPoint?{x:originPoint.x,y:originPoint.y}:{x:player.x,y:player.y},base=Math.atan2(target.y-start.y,target.x-start.x),distance=Math.hypot(target.x-start.x,target.y-start.y),normal={x:-Math.sin(base),y:Math.cos(base)},size=weaponSizeMultiplier();player.arcSide=(player.arcSide||-1)*-1;
    for(let i=0;i<shots;i++){const spread=i-(shots-1)/2,side=shots===1?player.arcSide:(spread===0?player.arcSide:Math.sign(spread)),lateral=spread*(28+stacks*3),targetPoint={x:target.x+normal.x*lateral,y:target.y+normal.y*lateral},mid={x:(start.x+targetPoint.x)/2,y:(start.y+targetPoint.y)/2},curve=(38+Math.min(70,distance*.09)+(stacks>=3?24:0))*side,control={x:mid.x+normal.x*curve,y:mid.y+normal.y*curve},history=Array.from({length:14},()=>({x:start.x,y:start.y}));state.entities.curves.push({stage:'outbound',stageTime:0,stageDuration:clamp(distance/(650+stacks*24),.30,.78),start:{...start},control,targetPoint,targetId:target.id,lateral,side,x:start.x,y:start.y,lastX:start.x,lastY:start.y,hitIds:new Set(),r:(9.5+stacks*.95+(stacks>=3?1.5:0))*size,damage:(14+stacks*4.1)*(echoed?.66:1)*(ricochet?.72:1),returnDamageMult:stacks>=4?1.38:1,color:echoed?COLORS.pink:'#69ffe0',trailDamage:stacks>=5,trailCd:0,history,historyStart:0,historyCount:0,stacks,dead:false,returnLife:0,ricochet:!!ricochet});}
  };

  updateBoomerangs=function integrityBoomerangLifecycle(dt){
    const curves=state.entities.curves,stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
    for(const p of curves){if(!validBoomerang(p)||p.dead){if(p)p.dead=true;continue;}p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;if(p.stage==='outbound'){
        const live=enemyById(p.targetId);if(live&&Math.hypot(live.x-player.x,live.y-player.y)<=weaponRange('arc')*1.2){const base=Math.atan2(live.y-p.start.y,live.x-p.start.x),normalX=-Math.sin(base),normalY=Math.cos(base),desiredX=live.x+normalX*(p.lateral||0),desiredY=live.y+normalY*(p.lateral||0);p.targetPoint.x=lerp(p.targetPoint.x,desiredX,.22);p.targetPoint.y=lerp(p.targetPoint.y,desiredY,.22);const midX=(p.start.x+p.targetPoint.x)/2,midY=(p.start.y+p.targetPoint.y)/2,distance=Math.hypot(p.targetPoint.x-p.start.x,p.targetPoint.y-p.start.y),curve=(38+Math.min(70,distance*.09)+(p.stacks>=3?24:0))*(p.side||1);p.control.x=lerp(p.control.x,midX+normalX*curve,.18);p.control.y=lerp(p.control.y,midY+normalY*curve,.18);}
        const t=boomerangEase(clamp(p.stageTime/Math.max(.001,p.stageDuration),0,1)),u=1-t;p.x=u*u*p.start.x+2*u*t*p.control.x+t*t*p.targetPoint.x;p.y=u*u*p.start.y+2*u*t*p.control.y+t*t*p.targetPoint.y;let struck=false;const nearby=boomerangCandidates(p.x,p.y,p.r+80);for(let i=0;i<nearby.length&&!struck;i++){const e=nearby[i];if(!e||e.dead||p.hitIds.has(e.id))continue;if(enemyCircleOverlap(e,p.x,p.y,p.r)){p.hitIds.add(e.id);dealDamage(e,p.damage,{color:p.color,source:p.ricochet?'arc-ricochet':'arc'});struck=true;}}if(struck||t>=1||Math.hypot(p.x-player.x,p.y-player.y)>weaponRange('arc')*1.2)startBoomerangReturn(p);
      }else{p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d2=dx*dx+dy*dy,d=Math.sqrt(d2)||1,speed=780+p.stacks*38+(p.stacks>=4?100:0);p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);{const nearby=boomerangCandidates(p.x,p.y,p.r+80);for(let i=0;i<nearby.length;i++){const e=nearby[i];if(!e||e.dead||p.hitIds.has(e.id))continue;if(enemyCircleOverlap(e,p.x,p.y,p.r)){p.hitIds.add(e.id);dealDamage(e,p.damage*(p.returnDamageMult||1),{color:p.color,source:p.ricochet?'arc-ricochet-return':'arc-return'});}}}if(d2<(player.r+13)**2||p.returnLife>1.35)p.dead=true;}
      pushBoomerangHistory(p,stressed?7:14);p.trailCd-=dt;if(p.trailDamage&&p.trailCd<=0){p.trailCd=.18;const rr=20+p.stacks*2;{const nearby=boomerangCandidates(p.x,p.y,rr+72);for(let i=0;i<nearby.length;i++){const e=nearby[i];if(e&&!e.dead&&enemyCircleOverlap(e,p.x,p.y,rr))dealDamage(e,1.8+p.stacks*.65,{color:p.color,source:'arc-trail',canCrit:false});}}}
    }
    compactInPlace(curves,keepLiveBoomerang);
  };

  const baseKillEnemy=killEnemy;
  killEnemy=function singleTransitionKill(enemy,opts={}){
    if(!enemy||enemy.dead)return;
    return baseKillEnemy(enemy,opts);
  };

  window.stackfallCombatIntegrityDiagnostics=()=>({
    version:'v1',multipartResolver:true,arcUsesSurface:true,railUsesSurface:true,missilesUseSurface:true,gateUsesSurface:true,boomerangActiveFifoTrim:false,duplicateKillGuard:true,curves:state.entities.curves?.length||0
  });
})();
