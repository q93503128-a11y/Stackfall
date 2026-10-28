// Branch-only two-pattern combat prototype for World Devourer Atropos.
// Pattern 1: Giant Crossing. Pattern 2: Tail Sever with delayed same-path rupture.
(()=>{
  const CROSS={out:.60,warn:1.00,travel:2.45,clear:1.25,rejoin:1.60};
  CROSS.telegraphEnd=CROSS.out+CROSS.warn;CROSS.travelEnd=CROSS.telegraphEnd+CROSS.travel;CROSS.clearEnd=CROSS.travelEnd+CROSS.clear;CROSS.end=CROSS.clearEnd+CROSS.rejoin;
  const TAIL={wind:.90,sweep:.58,delay:.65,flash:.18,recover:.95};
  TAIL.sweepEnd=TAIL.wind+TAIL.sweep;TAIL.scarAt=TAIL.sweepEnd+TAIL.delay;TAIL.flashEnd=TAIL.scarAt+TAIL.flash;TAIL.end=TAIL.flashEnd+TAIL.recover;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e?.dead&&e.apexForm==='chronophage')||null;
  const serpentOf=e=>e?.atroposReborn?.worldDevourer||null;

  function orbitOffset(serpent){
    if(typeof window.stackfallAtroposIdleOffset==='function')return window.stackfallAtroposIdleOffset(serpent,Number(serpent.motionTime)||0);
    return{x:0,y:0,orbitA:Number(serpent.phaseBase)||0};
  }
  function headPoint(serpent){
    const p=serpent?.points?.[0];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))return{x:p.x,y:p.y};
    const o=orbitOffset(serpent);return{x:(Number(serpent.anchorX)||0)+o.x,y:(Number(serpent.anchorY)||0)+o.y};
  }
  function crossingStage(a){if(!a)return'idle';const n=a.age;return n<CROSS.out?'out':n<CROSS.telegraphEnd?'warn':n<CROSS.travelEnd?'cross':n<CROSS.clearEnd?'clear':n<CROSS.end?'rejoin':'done';}
  function tailStage(a){if(!a)return'idle';const n=a.age;return n<TAIL.wind?'wind':n<TAIL.sweepEnd?'sweep':n<TAIL.scarAt?'scar-warn':n<TAIL.flashEnd?'rupture':n<TAIL.end?'recover':'done';}

  function startCrossing(e,serpent){
    if(!e||!serpent||serpent.crossingPrototype||serpent.tailSeverPrototype)return false;
    const origin=headPoint(serpent),targetX=Number.isFinite(player.x)?player.x:Number(serpent.anchorX)||0,targetY=Number.isFinite(player.y)?player.y:Number(serpent.anchorY)||0;
    let axis=Math.atan2(targetY-origin.y,targetX-origin.x);if(!Number.isFinite(axis))axis=0;
    const ux=Math.cos(axis),uy=Math.sin(axis),span=Math.max(900,vw*.76,vh*1.20),extra=Math.max(760,vw*.45);
    serpent.crossingPrototype={age:0,origin,targetX,targetY,axis,ux,uy,start:{x:targetX-ux*span,y:targetY-uy*span},end:{x:targetX+ux*span,y:targetY+uy*span},far:{x:targetX+ux*(span+extra),y:targetY+uy*(span+extra)},playerHit:false,serial:(serpent.crossingSerial=(serpent.crossingSerial||0)+1)};
    return true;
  }
  function desiredHead(serpent,a){
    const age=a.age,offset=orbitOffset(serpent),idle={x:(Number(player.x)||0)+offset.x,y:(Number(player.y)||0)+offset.y};
    if(age<CROSS.out){const q=ease(age/CROSS.out);return{x:lerp(a.origin.x,a.start.x,q),y:lerp(a.origin.y,a.start.y,q)};}
    if(age<CROSS.telegraphEnd){const q=(age-CROSS.out)/CROSS.warn,drift=28*q;return{x:a.start.x-a.ux*drift,y:a.start.y-a.uy*drift};}
    if(age<CROSS.travelEnd){const q=(age-CROSS.telegraphEnd)/CROSS.travel,k=ease(q),nx=-a.uy,ny=a.ux,wave=Math.sin(q*Math.PI)*38;return{x:lerp(a.start.x,a.end.x,k)+nx*wave,y:lerp(a.start.y,a.end.y,k)+ny*wave};}
    if(age<CROSS.clearEnd){const q=smooth((age-CROSS.travelEnd)/CROSS.clear);return{x:lerp(a.end.x,a.far.x,q),y:lerp(a.end.y,a.far.y,q)};}
    const q=smooth((age-CROSS.clearEnd)/CROSS.rejoin),nx=-a.uy,ny=a.ux,cx=a.far.x+a.ux*350+nx*800,cy=a.far.y+a.uy*350+ny*800,omt=1-q;
    return{x:omt*omt*a.far.x+2*omt*q*cx+q*q*idle.x,y:omt*omt*a.far.y+2*omt*q*cy+q*q*idle.y};
  }
  function driveHead(serpent,a){const desired=desiredHead(serpent,a),offset=orbitOffset(serpent);serpent.anchorX=desired.x-offset.x;serpent.anchorY=desired.y-offset.y;}
  function crossingContact(e,a){
    if(a.playerHit)return;const stage=crossingStage(a);if(stage!=='cross'&&stage!=='clear')return;
    for(const part of e.bodyParts||[]){if(!part?.active)continue;const x=e.x+(Number(part.dx)||0),y=e.y+(Number(part.dy)||0),r=Math.max(26,Number(part.r)||0);if(Math.hypot(player.x-x,player.y-y)<=r+(player.r||12)*.78){a.playerHit=true;if(player.invuln<=0)hurtPlayer(window.stackfallAtroposPatternDamage(e,'giantCrossing'),e);break;}}
  }

  function copyPose(points){return(points||[]).map(p=>({x:Number(p.x)||0,y:Number(p.y)||0,orbitA:Number(p.orbitA)||0,depth:Number(p.depth)||0}));}
  function startTailSever(e,serpent){
    const base=copyPose(serpent?.points);if(!e||!serpent||serpent.crossingPrototype||serpent.tailSeverPrototype||base.length<10)return false;
    const pivotIndex=Math.max(6,base.length-8),pivot=base[pivotIndex],tip=base[base.length-1],startAngle=Math.atan2(tip.y-pivot.y,tip.x-pivot.x),playerAngle=Math.atan2(player.y-pivot.y,player.x-pivot.x);
    let delta=angleDelta(startAngle,playerAngle),sign=delta>=0?1:-1;if(Math.abs(delta)<.50){sign=((serpent.tailSeverSerial||0)&1)?-1:1;delta=sign*.90;}
    const endDelta=clamp(delta+sign*.52,-2.15,2.15),windDelta=-sign*.24,radius=Math.max(180,Math.hypot(tip.x-pivot.x,tip.y-pivot.y));
    serpent.tailSeverPrototype={age:0,base,pivotIndex,pivot:{x:pivot.x,y:pivot.y},startAngle,endDelta,windDelta,radius,scarPath:[],directHit:false,scarResolved:false,serial:(serpent.tailSeverSerial=(serpent.tailSeverSerial||0)+1),holdMotionTime:Number(serpent.motionTime)||0};
    return true;
  }
  function tailDelta(a){const n=a.age;if(n<TAIL.wind)return lerp(0,a.windDelta,smooth(n/TAIL.wind));if(n<TAIL.sweepEnd)return lerp(a.windDelta,a.endDelta,ease((n-TAIL.wind)/TAIL.sweep));if(n<TAIL.flashEnd)return a.endDelta;return lerp(a.endDelta,0,smooth((n-TAIL.flashEnd)/TAIL.recover));}
  function modifiedTailPose(a){
    const delta=tailDelta(a),last=a.base.length-1,out=a.base.map((p,i)=>({...p}));
    for(let i=a.pivotIndex+1;i<=last;i++){
      const weight=smooth((i-a.pivotIndex)/(last-a.pivotIndex)),turn=delta*weight,dx=a.base[i].x-a.pivot.x,dy=a.base[i].y-a.pivot.y,c=Math.cos(turn),s=Math.sin(turn);
      out[i].x=a.pivot.x+dx*c-dy*s;out[i].y=a.pivot.y+dx*s+dy*c;
    }
    return out;
  }
  function rebuildHistory(serpent,a){
    const pts=modifiedTailPose(a),history=[];
    for(let i=pts.length-1;i>0;i--){
      const from=pts[i],to=pts[i-1],len=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(2,Math.ceil(len/4));
      for(let j=0;j<steps;j++){const q=j/steps;history.push({x:lerp(from.x,to.x,q),y:lerp(from.y,to.y,q),orbitA:lerp(from.orbitA,to.orbitA,q)});}
    }
    const head=pts[0];history.push({x:head.x,y:head.y,orbitA:head.orbitA});serpent.history=history;serpent.last=history[history.length-1];serpent.motionTime=a.holdMotionTime;serpent.lastReal=performance.now()*.001;
    const off=orbitOffset(serpent);serpent.anchorX=head.x-off.x;serpent.anchorY=head.y-off.y;
    return pts;
  }
  function pointSegmentDistance(px,py,a,b){const vx=b.x-a.x,vy=b.y-a.y,wx=px-a.x,wy=py-a.y,len2=vx*vx+vy*vy;if(len2<=.0001)return Math.hypot(wx,wy);const t=clamp((wx*vx+wy*vy)/len2,0,1),x=a.x+vx*t,y=a.y+vy*t;return Math.hypot(px-x,py-y);}
  function tailDirectContact(e,a,pts){
    if(a.directHit||tailStage(a)!=='sweep')return;const start=Math.max(a.pivotIndex,pts.length-7),radius=(player.r||12)+42;
    for(let i=start+1;i<pts.length;i++){if(pointSegmentDistance(player.x,player.y,pts[i-1],pts[i])<=radius){a.directHit=true;if(player.invuln<=0)hurtPlayer(window.stackfallAtroposPatternDamage(e,'tailSever'),e);break;}}
  }
  function recordScar(a,pts){if(tailStage(a)!=='sweep')return;const tip=pts[pts.length-1],last=a.scarPath[a.scarPath.length-1];if(!last||Math.hypot(tip.x-last.x,tip.y-last.y)>=12)a.scarPath.push({x:tip.x,y:tip.y});}
  function resolveScar(e,a){
    if(a.scarResolved||a.age<TAIL.scarAt)return;a.scarResolved=true;let hit=false;for(let i=1;i<a.scarPath.length;i++){if(pointSegmentDistance(player.x,player.y,a.scarPath[i-1],a.scarPath[i])<=(player.r||12)+24){hit=true;break;}}
    if(hit&&player.invuln<=0)hurtPlayer(window.stackfallAtroposPatternDamage(e,'tailRupture'),e);state.camera.shake=Math.max(state.camera.shake,6);state.flash=Math.max(state.flash,.035);
  }

  function updateCrossing(e,serpent,dt){const a=serpent.crossingPrototype;if(!a)return false;a.age+=dt;driveHead(serpent,a);crossingContact(e,a);if(a.age>=CROSS.end){serpent.crossingPrototype=null;serpent.prototypeAttackCd=1.35;serpent.nextPrototypeAttack='tail';serpent.anchorX=Number.isFinite(player.x)?player.x:serpent.anchorX;serpent.anchorY=Number.isFinite(player.y)?player.y:serpent.anchorY;}return true;}
  function updateTailSever(e,serpent,dt){const a=serpent.tailSeverPrototype;if(!a)return false;a.age+=dt;const pts=rebuildHistory(serpent,a);recordScar(a,pts);tailDirectContact(e,a,pts);resolveScar(e,a);if(a.age>=TAIL.end){serpent.tailSeverPrototype=null;serpent.prototypeAttackCd=1.55;serpent.nextPrototypeAttack='crossing';}return true;}

  function drawCrossingWarning(){
    const e=serpentEnemy(),serpent=serpentOf(e),a=serpent?.crossingPrototype;if(!a||crossingStage(a)!=='warn')return;const q=clamp((a.age-CROSS.out)/CROSS.warn,0,1),p1=worldToScreen(a.start.x,a.start.y),p2=worldToScreen(a.end.x,a.end.y);
    ctx.save();ctx.lineCap='butt';ctx.strokeStyle='#ff3048';ctx.globalAlpha=.10+.17*q;ctx.lineWidth=Math.max(220,Math.min(vw,vh)*.25);ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();ctx.globalAlpha=.54+.28*q;ctx.strokeStyle='#ff7184';ctx.lineWidth=4;ctx.setLineDash([28,18]);ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }
  function tailArcPoints(a,count=42){const out=[];for(let i=0;i<count;i++){const q=i/(count-1),angle=a.startAngle+a.endDelta*q;out.push(worldToScreen(a.pivot.x+Math.cos(angle)*a.radius,a.pivot.y+Math.sin(angle)*a.radius));}return out;}
  function strokeWorldPath(path,width,color,alpha){if(path.length<2)return;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();const first=worldToScreen(path[0].x,path[0].y);ctx.moveTo(first.x,first.y);for(let i=1;i<path.length;i++){const p=worldToScreen(path[i].x,path[i].y);ctx.lineTo(p.x,p.y);}ctx.stroke();ctx.restore();}
  function drawTailWarnings(){
    const e=serpentEnemy(),serpent=serpentOf(e),a=serpent?.tailSeverPrototype;if(!a)return;const stage=tailStage(a);
    if(stage==='wind'){
      const q=smooth(a.age/TAIL.wind),arc=tailArcPoints(a);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=.17+.16*q;ctx.strokeStyle='#ff3048';ctx.lineWidth=Math.max(82,Math.min(vw,vh)*.105);ctx.beginPath();ctx.moveTo(arc[0].x,arc[0].y);for(let i=1;i<arc.length;i++)ctx.lineTo(arc[i].x,arc[i].y);ctx.stroke();ctx.globalAlpha=.60+.25*q;ctx.strokeStyle='#ff7184';ctx.lineWidth=4;ctx.setLineDash([22,14]);ctx.beginPath();ctx.moveTo(arc[0].x,arc[0].y);for(let i=1;i<arc.length;i++)ctx.lineTo(arc[i].x,arc[i].y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }else if(stage==='scar-warn'){
      const q=clamp((a.age-TAIL.sweepEnd)/TAIL.delay,0,1);strokeWorldPath(a.scarPath,36,'#ff3048',.28+.44*q);strokeWorldPath(a.scarPath,4,'#ff9aa8',.62+.34*q);
    }else if(stage==='rupture'){
      const q=1-clamp((a.age-TAIL.scarAt)/TAIL.flash,0,1);strokeWorldPath(a.scarPath,54,'#cfffff',.64*q);strokeWorldPath(a.scarPath,9,'#ffffff',q);
    }
  }

  window.stackfallUpdateWorldDevourerCombat=function updateWorldDevourerCombat(e,dt){
    const serpent=serpentOf(e);if(!e||e.dead||!serpent)return false;e.apexElapsed=(e.apexElapsed||0)+dt;const hp=e.hp/Math.max(1,e.maxHp);e.apexPhase=hp<.25?4:hp<.50?3:hp<.75?2:1;e.timeLock=0;if(e.atroposReborn){e.atroposReborn.slash=null;e.atroposReborn.slashCd=1e9;}
    if(updateCrossing(e,serpent,dt))return true;if(updateTailSever(e,serpent,dt))return true;
    serpent.prototypeAttackCd=Number.isFinite(serpent.prototypeAttackCd)?serpent.prototypeAttackCd:2.1;serpent.prototypeAttackCd-=dt;if(serpent.prototypeAttackCd<=0){const next=serpent.nextPrototypeAttack||'crossing';if(next==='tail'){if(!startTailSever(e,serpent))serpent.prototypeAttackCd=.2;}else if(!startCrossing(e,serpent))serpent.prototypeAttackCd=.2;}
    return true;
  };
  window.stackfallUpdateWorldDevourerCrossing=window.stackfallUpdateWorldDevourerCombat;

  const baseBackground=drawBackground;drawBackground=function drawBackgroundWithWorldDevourerWarnings(){const result=baseBackground();drawCrossingWarning();drawTailWarnings();return result;};
  window.stackfallTriggerAtroposGiantCrossing=()=>{const e=serpentEnemy(),s=serpentOf(e);if(!e||!s)return false;s.crossingPrototype=null;s.tailSeverPrototype=null;return startCrossing(e,s);};
  window.stackfallTriggerAtroposTailSever=()=>{const e=serpentEnemy(),s=serpentOf(e);if(!e||!s)return false;s.crossingPrototype=null;s.tailSeverPrototype=null;return startTailSever(e,s);};
  window.stackfallAtroposCombatDiagnostics=()=>{const e=serpentEnemy(),s=serpentOf(e),cross=s?.crossingPrototype,tail=s?.tailSeverPrototype;return{active:cross?'giant-crossing':tail?'tail-sever':null,crossing:cross?{stage:crossingStage(cross),age:+cross.age.toFixed(2),serial:cross.serial}:null,tail:tail?{stage:tailStage(tail),age:+tail.age.toFixed(2),serial:tail.serial,scarPoints:tail.scarPath.length}:null,next:s?.nextPrototypeAttack||'crossing',cooldown:Number.isFinite(s?.prototypeAttackCd)?+s.prototypeAttackCd.toFixed(2):null};};
  window.stackfallAtroposPrototypeAttackState='giant-crossing+tail-sever-motion-v2';
})();
