// Branch-only pattern 5 prototype: Past Trajectory for World Devourer Atropos.
// P3+ only. The present body traverses a curved route, leaves a thin memory trace,
// then a delayed pale temporal echo replays that exact route after a renewed red warning.
(()=>{
  const PAST={warn:.85,present:1.75,clear:.75,delay:1.30,replay:1.35,recover:1.20};
  PAST.presentStart=PAST.warn;
  PAST.presentEnd=PAST.presentStart+PAST.present;
  PAST.clearEnd=PAST.presentEnd+PAST.clear;
  PAST.delayEnd=PAST.clearEnd+PAST.delay;
  PAST.replayEnd=PAST.delayEnd+PAST.replay;
  PAST.end=PAST.replayEnd+PAST.recover;
  const REWARN=.70;
  const SEGMENTS=17;
  const GHOST_SPACING=64;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e?.dead&&e.apexForm==='chronophage')||null;
  const serpentOf=e=>e?.atroposReborn?.worldDevourer||null;
  const phaseOf=e=>{const hp=e.hp/Math.max(1,e.maxHp);return hp<.25?4:hp<.50?3:hp<.75?2:1;};
  const copyPose=points=>(points||[]).map(p=>({x:Number(p.x)||0,y:Number(p.y)||0,orbitA:Number(p.orbitA)||0,depth:Number(p.depth)||0}));

  function orbitOffset(s){const a=(Number(s.motionTime)||0)*.165+(Number(s.phaseBase)||0),rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);return{x:Math.cos(a)*rx+Math.sin(a*2.07)*38,y:Math.sin(a*.96)*ry+Math.sin(a*2.41+1.1)*28,orbitA:a};}
  function pastStage(a){if(!a)return'idle';const n=a.age;return n<PAST.warn?'warn':n<PAST.presentEnd?'present':n<PAST.clearEnd?'clear':n<PAST.delayEnd?(n>=PAST.delayEnd-REWARN?'rewarn':'memory'):n<PAST.replayEnd?'replay':n<PAST.end?'recover':'done';}
  function cubic(p0,p1,p2,p3,t){const u=1-t,uu=u*u,tt=t*t;return{x:uu*u*p0.x+3*uu*t*p1.x+3*u*tt*p2.x+tt*t*p3.x,y:uu*u*p0.y+3*uu*t*p1.y+3*u*tt*p2.y+tt*t*p3.y};}
  function buildRoute(origin,target,serial){
    let ax=target.x-origin.x,ay=target.y-origin.y,len=Math.hypot(ax,ay);if(len<120){ax=1;ay=0;len=1;}const ux=ax/len,uy=ay/len,nx=-uy,ny=ux,sign=(serial&1)?-1:1;
    const span=Math.max(960,vw*.78,vh*1.28),curve=clamp(Math.min(vw,vh)*.30,210,340);
    const end={x:target.x+ux*span,y:target.y+uy*span};
    const p1={x:origin.x+ux*span*.34+nx*curve*sign,y:origin.y+uy*span*.34+ny*curve*sign};
    const p2={x:target.x+ux*span*.34-nx*curve*.84*sign,y:target.y+uy*span*.34-ny*curve*.84*sign};
    const route=[];let total=0,prev=null;
    for(let i=0;i<=180;i++){const q=i/180,p=cubic(origin,p1,p2,end,q);if(prev)total+=Math.hypot(p.x-prev.x,p.y-prev.y);route.push({x:p.x,y:p.y,s:total});prev=p;}
    return{route,total,ux,uy,nx,ny,end,far:{x:end.x+ux*Math.max(1150,vw*.62),y:end.y+uy*Math.max(1150,vw*.62)}};
  }
  function sampleRoute(a,d){
    const r=a.route;if(!r?.length)return{x:a.origin.x,y:a.origin.y,a:0};
    if(d<=0){const p0=r[0],p1=r[1],ang=Math.atan2(p1.y-p0.y,p1.x-p0.x);return{x:p0.x+Math.cos(ang)*d,y:p0.y+Math.sin(ang)*d,a:ang};}
    if(d>=a.routeLength){const p0=r[r.length-2],p1=r[r.length-1],ang=Math.atan2(p1.y-p0.y,p1.x-p0.x),extra=d-a.routeLength;return{x:p1.x+Math.cos(ang)*extra,y:p1.y+Math.sin(ang)*extra,a:ang};}
    let lo=0,hi=r.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(r[mid].s<d)lo=mid;else hi=mid;}const A=r[lo],B=r[hi],q=(d-A.s)/Math.max(.001,B.s-A.s),x=lerp(A.x,B.x,q),y=lerp(A.y,B.y,q);return{x,y,a:Math.atan2(B.y-A.y,B.x-A.x)};
  }
  function rebuildPoseHistory(s,pts,holdMotionTime){
    const history=[];for(let i=pts.length-1;i>0;i--){const from=pts[i],to=pts[i-1],len=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(2,Math.ceil(len/4));for(let j=0;j<steps;j++){const q=j/steps;history.push({x:lerp(from.x,to.x,q),y:lerp(from.y,to.y,q),orbitA:lerp(from.orbitA,to.orbitA,q)});}}
    const head=pts[0];history.push({x:head.x,y:head.y,orbitA:head.orbitA});s.history=history;s.last=history[history.length-1];s.motionTime=holdMotionTime;s.lastReal=performance.now()*.001;const off=orbitOffset(s);s.anchorX=head.x-off.x;s.anchorY=head.y-off.y;
  }
  function startPast(e,s){
    const base=copyPose(s?.points);if(!e||!s||phaseOf(e)<3||s.crossingPrototype||s.tailSeverPrototype||s.mawPrototype||s.ringPrototype||s.pastPrototype||base.length<11)return false;
    const origin={x:base[0].x,y:base[0].y},target={x:Number(player.x)||0,y:Number(player.y)||0},serial=(s.pastSerial=(s.pastSerial||0)+1),path=buildRoute(origin,target,serial);
    s.pastPrototype={age:0,base,origin,target,serial,route:path.route,routeLength:path.total,ux:path.ux,uy:path.uy,nx:path.nx,ny:path.ny,end:path.end,far:path.far,holdMotionTime:Number(s.motionTime)||0,presentHit:false,echoHit:false};
    rebuildPoseHistory(s,base,s.pastPrototype.holdMotionTime);return true;
  }
  function driveHead(s,a,x,y){const off=orbitOffset(s);s.motionTime=a.holdMotionTime;s.anchorX=x-off.x;s.anchorY=y-off.y;s.lastReal=performance.now()*.001;}
  function desiredPresent(a,q){const p=sampleRoute(a,a.routeLength*ease(q));return{x:p.x,y:p.y};}
  function desiredRecover(s,a,q){const off=orbitOffset(s),idle={x:(Number(player.x)||0)+off.x,y:(Number(player.y)||0)+off.y},cx=a.far.x+a.ux*260+a.nx*820,cy=a.far.y+a.uy*260+a.ny*820,u=1-q;return{x:u*u*a.far.x+2*u*q*cx+q*q*idle.x,y:u*u*a.far.y+2*u*q*cy+q*q*idle.y};}
  function pointSegmentDistance(px,py,A,B){const vx=B.x-A.x,vy=B.y-A.y,wx=px-A.x,wy=py-A.y,l2=vx*vx+vy*vy;if(l2<=.0001)return Math.hypot(wx,wy);const t=clamp((wx*vx+wy*vy)/l2,0,1),x=A.x+vx*t,y=A.y+vy*t;return Math.hypot(px-x,py-y);}
  function presentContact(e,a){if(a.presentHit)return;for(const part of e.bodyParts||[]){if(!part?.active)continue;const x=e.x+(Number(part.dx)||0),y=e.y+(Number(part.dy)||0),r=Math.max(24,Number(part.r)||0);if(Math.hypot(player.x-x,player.y-y)<=r+(player.r||12)*.78){a.presentHit=true;if(player.invuln<=0)hurtPlayer(Math.max(8,(Number(player.maxHp)||100)*.13),e);break;}}}
  function ghostPose(a,q){
    const bodyLen=(SEGMENTS-1)*GHOST_SPACING,headD=ease(q)*(a.routeLength+bodyLen+180),out=[];
    for(let i=0;i<SEGMENTS;i++){const p=sampleRoute(a,headD-i*GHOST_SPACING),tailT=i/(SEGMENTS-1);out.push({...p,tailT});}return out;
  }
  function ghostContact(e,a,q){if(a.echoHit)return;const pose=ghostPose(a,q),rad=(player.r||12)+38;for(let i=1;i<pose.length;i++){if(pointSegmentDistance(player.x,player.y,pose[i-1],pose[i])<=rad){a.echoHit=true;if(player.invuln<=0)hurtPlayer(Math.max(8,(Number(player.maxHp)||100)*.13),e);break;}}}
  function updatePast(e,s,dt){
    const a=s.pastPrototype;if(!a)return false;a.age+=dt;const stage=pastStage(a);
    if(stage==='warn')rebuildPoseHistory(s,a.base,a.holdMotionTime);
    else if(stage==='present'){const q=(a.age-PAST.presentStart)/PAST.present,p=desiredPresent(a,q);driveHead(s,a,p.x,p.y);presentContact(e,a);}
    else if(stage==='clear'){const q=smooth((a.age-PAST.presentEnd)/PAST.clear),x=lerp(a.end.x,a.far.x,q),y=lerp(a.end.y,a.far.y,q);driveHead(s,a,x,y);presentContact(e,a);}
    else if(stage==='memory'||stage==='rewarn'||stage==='replay'){driveHead(s,a,a.far.x,a.far.y);if(stage==='replay')ghostContact(e,a,(a.age-PAST.delayEnd)/PAST.replay);}
    else if(stage==='recover'){const q=smooth((a.age-PAST.replayEnd)/PAST.recover),p=desiredRecover(s,a,q);driveHead(s,a,p.x,p.y);}
    if(a.age>=PAST.end){s.pastPrototype=null;s.prototypeAttackCd=Math.max(.86,1.28-(phaseOf(e)-3)*.12);s.nextPrototypeAttack='crossing';s.anchorX=Number.isFinite(player.x)?player.x:s.anchorX;s.anchorY=Number.isFinite(player.y)?player.y:s.anchorY;}
    return true;
  }
  function strokeRoute(a,width,color,alpha,dashed=false){const r=a.route;if(!r?.length)return;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;if(dashed)ctx.setLineDash([22,16]);ctx.beginPath();let p=worldToScreen(r[0].x,r[0].y);ctx.moveTo(p.x,p.y);for(let i=1;i<r.length;i+=2){p=worldToScreen(r[i].x,r[i].y);ctx.lineTo(p.x,p.y);}ctx.stroke();ctx.setLineDash([]);ctx.restore();}
  function drawGhost(a,q){
    const pose=ghostPose(a,q),screens=pose.map(p=>({...p,...worldToScreen(p.x,p.y)}));ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalCompositeOperation='screen';ctx.strokeStyle='rgba(167,214,232,.24)';ctx.lineWidth=Math.max(64,Math.min(vw,vh)*.072);ctx.beginPath();ctx.moveTo(screens[0].x,screens[0].y);for(let i=1;i<screens.length;i++)ctx.lineTo(screens[i].x,screens[i].y);ctx.stroke();
    for(let i=screens.length-1;i>=0;i--){const p=screens[i],t=p.tailT,scale=lerp(1,.42,t);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=.34*(1-t*.28);ctx.fillStyle=i===0?'#dff8ff':'#9fc7d8';ctx.strokeStyle='rgba(238,252,255,.62)';ctx.lineWidth=2;if(i===0){ctx.beginPath();ctx.moveTo(64*scale,0);ctx.lineTo(-44*scale,-27*scale);ctx.lineTo(-30*scale,0);ctx.lineTo(-44*scale,27*scale);ctx.closePath();ctx.fill();ctx.stroke();}else if(i%2===1||i===screens.length-1){ctx.beginPath();ctx.ellipse(0,0,54*scale,20*scale,0,0,TAU);ctx.fill();ctx.stroke();}ctx.restore();}
    ctx.restore();
  }
  function drawPastVisuals(){
    const e=serpentEnemy(),s=serpentOf(e),a=s?.pastPrototype;if(!a)return;const stage=pastStage(a);
    if(stage==='warn'){const q=smooth(a.age/PAST.warn);strokeRoute(a,Math.max(82,Math.min(vw,vh)*.092),'#ff3048',.08+.10*q);strokeRoute(a,4,'#ff8294',.58+.24*q,true);}
    else if(stage==='memory'){strokeRoute(a,20,'#b9deec',.12);strokeRoute(a,3,'#e5f8ff',.34);}
    else if(stage==='rewarn'){const q=clamp((a.age-(PAST.delayEnd-REWARN))/REWARN,0,1);strokeRoute(a,18,'#b9deec',.10);strokeRoute(a,Math.max(72,Math.min(vw,vh)*.082),'#ff3048',.06+.10*q);strokeRoute(a,4,'#ff8fa0',.50+.35*q,true);}
    else if(stage==='replay'){strokeRoute(a,10,'#ff6f85',.24);strokeRoute(a,2,'#ffc0ca',.40);drawGhost(a,clamp((a.age-PAST.delayEnd)/PAST.replay,0,1));}
  }

  const baseCombat=window.stackfallUpdateWorldDevourerCombat||window.stackfallUpdateWorldDevourerCrossing;
  if(typeof baseCombat==='function')window.stackfallUpdateWorldDevourerCombat=function updateWorldDevourerFivePatternCombat(e,dt){
    const s=serpentOf(e);if(!s)return baseCombat(e,dt);const phase=phaseOf(e);e.apexPhase=phase;
    if(s.pastPrototype){e.apexElapsed=(e.apexElapsed||0)+dt;return updatePast(e,s,dt);}
    if(phase<3&&s.nextPrototypeAttack==='past')s.nextPrototypeAttack='crossing';
    if(phase>=3&&!s.crossingPrototype&&!s.tailSeverPrototype&&!s.mawPrototype&&!s.ringPrototype&&s.nextPrototypeAttack==='past'&&(Number(s.prototypeAttackCd)||0)<=0){if(startPast(e,s)){e.apexElapsed=(e.apexElapsed||0)+dt;return updatePast(e,s,dt);}}
    const hadRing=!!s.ringPrototype,result=baseCombat(e,dt);
    if(hadRing&&!s.ringPrototype&&!s.crossingPrototype&&!s.tailSeverPrototype&&!s.mawPrototype&&phase>=3)s.nextPrototypeAttack='past';
    return result;
  };
  window.stackfallUpdateWorldDevourerCrossing=window.stackfallUpdateWorldDevourerCombat;
  const baseBackground=drawBackground;drawBackground=function drawBackgroundWithPastTrajectory(){const result=baseBackground();drawPastVisuals();return result;};
  window.stackfallTriggerAtroposPastTrajectory=()=>{const e=serpentEnemy(),s=serpentOf(e);if(!e||!s||phaseOf(e)<3)return false;s.crossingPrototype=null;s.tailSeverPrototype=null;s.mawPrototype=null;s.ringPrototype=null;s.pastPrototype=null;return startPast(e,s);};
  window.stackfallAtroposPastDiagnostics=()=>{const e=serpentEnemy(),s=serpentOf(e),a=s?.pastPrototype;return{phase:e?phaseOf(e):null,active:!!a,stage:pastStage(a),age:a?+a.age.toFixed(2):0,serial:a?.serial||0,routePoints:a?.route?.length||0,presentHit:!!a?.presentHit,echoHit:!!a?.echoHit};};
  window.stackfallAtroposPrototypeAttackState='p1-basic+p2-maw-ring+p3-past-motion-v5';
})();
