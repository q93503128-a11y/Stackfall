// Branch-only pattern 5 prototype: Past Trajectory for World Devourer Atropos.
// P3+ only. The present body crosses the locked player position, leaves a thin memory trace,
// then a delayed pale temporal echo replays the exact same route after a renewed red warning.
(()=>{
  const PAST={warn:.85,present:1.75,clear:.75,delay:1.30,replay:1.35,recover:1.20},REWARN=.70,SEGMENTS=17,SPACING=64;
  PAST.presentEnd=PAST.warn+PAST.present;PAST.clearEnd=PAST.presentEnd+PAST.clear;PAST.delayEnd=PAST.clearEnd+PAST.delay;PAST.replayEnd=PAST.delayEnd+PAST.replay;PAST.end=PAST.replayEnd+PAST.recover;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e?.dead&&e.apexForm==='chronophage')||null,serpentOf=e=>e?.atroposReborn?.worldDevourer||null;
  const phaseOf=e=>{const h=e.hp/Math.max(1,e.maxHp);return h<.25?4:h<.50?3:h<.75?2:1;};
  const copyPose=pts=>(pts||[]).map(p=>({x:+p.x||0,y:+p.y||0,orbitA:+p.orbitA||0,depth:+p.depth||0}));
  const ghostArt={head:new Image(),body:[new Image(),new Image(),new Image()],tail:new Image()};
  for(const img of [ghostArt.head,...ghostArt.body,ghostArt.tail])img.decoding='async';
  ghostArt.head.src='assets/atropos-head.svg';
  ghostArt.body[0].src='assets/atropos-segment.svg';
  ghostArt.body[1].src='assets/atropos-segment-b.svg';
  ghostArt.body[2].src='assets/atropos-segment-c.svg';
  ghostArt.tail.src='assets/atropos-tail.svg';

  function orbitOffset(s){const a=(+s.motionTime||0)*.165+(+s.phaseBase||0),rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);return{x:Math.cos(a)*rx+Math.sin(a*2.07)*38,y:Math.sin(a*.96)*ry+Math.sin(a*2.41+1.1)*28};}
  function stage(a){if(!a)return'idle';const n=a.age;return n<PAST.warn?'warn':n<PAST.presentEnd?'present':n<PAST.clearEnd?'clear':n<PAST.delayEnd?(n>=PAST.delayEnd-REWARN?'rewarn':'memory'):n<PAST.replayEnd?'replay':n<PAST.end?'recover':'done';}
  function quad(a,b,c,t){const u=1-t;return{x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};}
  function buildRoute(origin,target,serial){
    let dx=target.x-origin.x,dy=target.y-origin.y,d=Math.hypot(dx,dy);if(d<120){dx=1;dy=0;d=1;}const ux=dx/d,uy=dy/d,nx=-uy,ny=ux,sign=(serial&1)?-1:1,span=Math.max(960,vw*.78,vh*1.28),curve=clamp(Math.min(vw,vh)*.30,210,340);
    const end={x:target.x+ux*span,y:target.y+uy*span},c1={x:lerp(origin.x,target.x,.58)+nx*curve*sign,y:lerp(origin.y,target.y,.58)+ny*curve*sign},c2={x:lerp(target.x,end.x,.44)-nx*curve*.84*sign,y:lerp(target.y,end.y,.44)-ny*curve*.84*sign};
    const route=[];let total=0,prev=null;for(let i=0;i<=200;i++){const q=i/200,p=q<=.5?quad(origin,c1,target,q*2):quad(target,c2,end,(q-.5)*2);if(prev)total+=Math.hypot(p.x-prev.x,p.y-prev.y);route.push({x:p.x,y:p.y,s:total});prev=p;}
    return{route,total,ux,uy,nx,ny,end,far:{x:end.x+ux*Math.max(1150,vw*.62),y:end.y+uy*Math.max(1150,vw*.62)}};
  }
  function sampleRoute(a,d){const r=a.route;if(d<=0){const A=r[0],B=r[1],ang=Math.atan2(B.y-A.y,B.x-A.x);return{x:A.x+Math.cos(ang)*d,y:A.y+Math.sin(ang)*d,a:ang};}if(d>=a.routeLength){const A=r.at(-2),B=r.at(-1),ang=Math.atan2(B.y-A.y,B.x-A.x),x=d-a.routeLength;return{x:B.x+Math.cos(ang)*x,y:B.y+Math.sin(ang)*x,a:ang};}let lo=0,hi=r.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(r[m].s<d)lo=m;else hi=m;}const A=r[lo],B=r[hi],q=(d-A.s)/Math.max(.001,B.s-A.s);return{x:lerp(A.x,B.x,q),y:lerp(A.y,B.y,q),a:Math.atan2(B.y-A.y,B.x-A.x)};}
  function rebuildPose(s,pts,hold){const h=[];for(let i=pts.length-1;i>0;i--){const A=pts[i],B=pts[i-1],len=Math.hypot(B.x-A.x,B.y-A.y),n=Math.max(2,Math.ceil(len/4));for(let j=0;j<n;j++){const q=j/n;h.push({x:lerp(A.x,B.x,q),y:lerp(A.y,B.y,q),orbitA:lerp(A.orbitA,B.orbitA,q)});}}const head=pts[0];h.push({x:head.x,y:head.y,orbitA:head.orbitA});s.history=h;s.last=h.at(-1);s.motionTime=hold;s.lastReal=performance.now()*.001;const o=orbitOffset(s);s.anchorX=head.x-o.x;s.anchorY=head.y-o.y;}
  function startPast(e,s){const base=copyPose(s?.points);if(!e||!s||phaseOf(e)<3||s.crossingPrototype||s.tailSeverPrototype||s.mawPrototype||s.ringPrototype||s.pastPrototype||base.length<11)return false;const origin={x:base[0].x,y:base[0].y},target={x:+player.x||0,y:+player.y||0},serial=(s.pastSerial=(s.pastSerial||0)+1),p=buildRoute(origin,target,serial);s.pastPrototype={age:0,base,origin,target,serial,route:p.route,routeLength:p.total,ux:p.ux,uy:p.uy,nx:p.nx,ny:p.ny,end:p.end,far:p.far,hold:+s.motionTime||0,presentHit:false,echoHit:false};rebuildPose(s,base,s.pastPrototype.hold);return true;}
  function drive(s,a,x,y){const o=orbitOffset(s);s.motionTime=a.hold;s.anchorX=x-o.x;s.anchorY=y-o.y;s.lastReal=performance.now()*.001;}
  function distSeg(px,py,A,B){const vx=B.x-A.x,vy=B.y-A.y,wx=px-A.x,wy=py-A.y,l=vx*vx+vy*vy;if(l<.001)return Math.hypot(wx,wy);const t=clamp((wx*vx+wy*vy)/l,0,1),x=A.x+vx*t,y=A.y+vy*t;return Math.hypot(px-x,py-y);}
  function presentHit(e,a){if(a.presentHit)return;for(const p of e.bodyParts||[]){if(!p?.active)continue;const x=e.x+(+p.dx||0),y=e.y+(+p.dy||0),r=Math.max(24,+p.r||0);if(Math.hypot(player.x-x,player.y-y)<=r+(player.r||12)*.78){a.presentHit=true;if(player.invuln<=0)hurtPlayer(window.stackfallAtroposPatternDamage(e,'pastTrajectory'),e);break;}}}
  function ghostPose(a,q){const body=(SEGMENTS-1)*SPACING,headD=ease(q)*(a.routeLength+body+180),out=[];for(let i=0;i<SEGMENTS;i++)out.push({...sampleRoute(a,headD-i*SPACING),tailT:i/(SEGMENTS-1)});return out;}
  function echoHit(e,a,q){if(a.echoHit)return;const p=ghostPose(a,q),r=(player.r||12)+38;for(let i=1;i<p.length;i++)if(distSeg(player.x,player.y,p[i-1],p[i])<=r){a.echoHit=true;if(player.invuln<=0)hurtPlayer(window.stackfallAtroposPatternDamage(e,'pastTrajectory'),e);break;}}
  function recoverPoint(s,a,q){const o=orbitOffset(s),idle={x:(+player.x||0)+o.x,y:(+player.y||0)+o.y},cx=a.far.x+a.ux*260+a.nx*820,cy=a.far.y+a.uy*260+a.ny*820,u=1-q;return{x:u*u*a.far.x+2*u*q*cx+q*q*idle.x,y:u*u*a.far.y+2*u*q*cy+q*q*idle.y};}
  function updatePast(e,s,dt){const a=s.pastPrototype;if(!a)return false;a.age+=dt;const st=stage(a);if(st==='warn')rebuildPose(s,a.base,a.hold);else if(st==='present'){const p=sampleRoute(a,a.routeLength*ease((a.age-PAST.warn)/PAST.present));drive(s,a,p.x,p.y);presentHit(e,a);}else if(st==='clear'){const q=smooth((a.age-PAST.presentEnd)/PAST.clear);drive(s,a,lerp(a.end.x,a.far.x,q),lerp(a.end.y,a.far.y,q));presentHit(e,a);}else if(st==='memory'||st==='rewarn'||st==='replay'){drive(s,a,a.far.x,a.far.y);if(st==='replay')echoHit(e,a,(a.age-PAST.delayEnd)/PAST.replay);}else if(st==='recover'){const p=recoverPoint(s,a,smooth((a.age-PAST.replayEnd)/PAST.recover));drive(s,a,p.x,p.y);}if(a.age>=PAST.end){s.pastPrototype=null;s.prototypeAttackCd=Math.max(.86,1.28-(phaseOf(e)-3)*.12);s.nextPrototypeAttack='crossing';s.anchorX=Number.isFinite(player.x)?player.x:s.anchorX;s.anchorY=Number.isFinite(player.y)?player.y:s.anchorY;}return true;}
  function stroke(a,w,color,alpha,dash=false){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=w;if(dash)ctx.setLineDash([22,16]);ctx.beginPath();let p=worldToScreen(a.route[0].x,a.route[0].y);ctx.moveTo(p.x,p.y);for(let i=2;i<a.route.length;i+=2){p=worldToScreen(a.route[i].x,a.route[i].y);ctx.lineTo(p.x,p.y);}ctx.stroke();ctx.restore();}
  function drawGhostSprite(img,v,w,h,alpha,flip=false){
    if(!img?.complete||img.naturalWidth<2||alpha<=.005)return;
    ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.a);if(flip)ctx.scale(1,-1);
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;ctx.filter='grayscale(1) brightness(1.85) sepia(.08) hue-rotate(145deg) saturate(.55)';
    ctx.drawImage(img,-w*.5,-h*.5,w,h);ctx.restore();
  }
  function drawGhostPlate(v,w,h,alpha,kind='body',flip=false){
    if(alpha<=.005)return;ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.a);if(flip)ctx.scale(1,-1);ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;ctx.fillStyle='rgba(166,214,230,.32)';ctx.strokeStyle='rgba(224,248,255,.72)';ctx.lineWidth=2;ctx.beginPath();
    if(kind==='head'){ctx.moveTo(w*.54,0);ctx.lineTo(w*.18,-h*.42);ctx.lineTo(-w*.34,-h*.36);ctx.lineTo(-w*.50,-h*.12);ctx.lineTo(-w*.30,0);ctx.lineTo(-w*.50,h*.12);ctx.lineTo(-w*.34,h*.36);ctx.lineTo(w*.18,h*.42);}
    else if(kind==='tail'){ctx.moveTo(-w*.56,0);ctx.lineTo(w*.18,-h*.46);ctx.lineTo(w*.52,-h*.18);ctx.lineTo(w*.38,h*.26);ctx.lineTo(w*.08,h*.44);}
    else{ctx.moveTo(w*.50,0);ctx.lineTo(w*.25,-h*.45);ctx.lineTo(-w*.18,-h*.50);ctx.lineTo(-w*.50,-h*.16);ctx.lineTo(-w*.42,h*.24);ctx.lineTo(-w*.04,h*.50);ctx.lineTo(w*.34,h*.34);}
    ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=alpha*.78;ctx.strokeStyle='rgba(190,236,248,.82)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-w*.18,-h*.12);ctx.lineTo(-w*.03,h*.04);ctx.lineTo(w*.13,-h*.05);ctx.lineTo(w*.29,h*.10);ctx.stroke();ctx.restore();
  }
  function drawGhost(a,q){
    const p=ghostPose(a,q).map(v=>({...v,...worldToScreen(v.x,v.y)}));if(!p.length)return;
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';ctx.lineJoin='round';
    for(let i=p.length-1;i>0;i--){const tailT=i/(p.length-1),w=lerp(Math.max(112,Math.min(vw,vh)*.125),44,tailT);ctx.globalAlpha=lerp(.18,.10,tailT);ctx.strokeStyle='rgba(165,218,235,.78)';ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(p[i].x,p[i].y);ctx.lineTo(p[i-1].x,p[i-1].y);ctx.stroke();ctx.globalAlpha=lerp(.34,.18,tailT);ctx.strokeStyle='rgba(226,249,255,.76)';ctx.lineWidth=Math.max(2,w*.035);ctx.stroke();}
    ctx.restore();
    for(let i=p.length-1;i>=0;i--){const v=p[i],sc=lerp(1,.45,v.tailT),alpha=.60*(1-v.tailT*.30);if(i===0){drawGhostPlate(v,250*sc,108*sc,alpha,'head');continue;}if(i===p.length-1){drawGhostPlate(v,150*sc,54*sc,alpha*.78,'tail');continue;}if(i%3!==1)continue;drawGhostPlate(v,166*sc,66*sc,alpha*.72,'body',i%6===4);}
  }
  function drawPast(){const e=serpentEnemy(),s=serpentOf(e),a=s?.pastPrototype;if(!a)return;const st=stage(a);if(st==='warn'){const q=smooth(a.age/PAST.warn);stroke(a,Math.max(82,Math.min(vw,vh)*.092),'#ff3048',.08+.10*q);stroke(a,4,'#ff8294',.58+.24*q,true);}else if(st==='memory'){stroke(a,20,'#b9deec',.12);stroke(a,3,'#e5f8ff',.34);}else if(st==='rewarn'){const q=clamp((a.age-(PAST.delayEnd-REWARN))/REWARN,0,1);stroke(a,18,'#b9deec',.10);stroke(a,Math.max(72,Math.min(vw,vh)*.082),'#ff3048',.06+.10*q);stroke(a,4,'#ff8fa0',.50+.35*q,true);}else if(st==='replay'){stroke(a,10,'#ff6f85',.24);stroke(a,2,'#ffc0ca',.40);drawGhost(a,clamp((a.age-PAST.delayEnd)/PAST.replay,0,1));}}
  const baseCombat=window.stackfallUpdateWorldDevourerCombat||window.stackfallUpdateWorldDevourerCrossing;if(typeof baseCombat==='function')window.stackfallUpdateWorldDevourerCombat=function(e,dt){const s=serpentOf(e);if(!s)return baseCombat(e,dt);const phase=phaseOf(e);e.apexPhase=phase;if(s.pastPrototype){e.apexElapsed=(e.apexElapsed||0)+dt;return updatePast(e,s,dt);}if(phase<3&&s.nextPrototypeAttack==='past')s.nextPrototypeAttack='crossing';if(phase>=3&&!s.crossingPrototype&&!s.tailSeverPrototype&&!s.mawPrototype&&!s.ringPrototype&&s.nextPrototypeAttack==='past'&&(+s.prototypeAttackCd||0)<=0){if(startPast(e,s)){e.apexElapsed=(e.apexElapsed||0)+dt;return updatePast(e,s,dt);}}const hadRing=!!s.ringPrototype,result=baseCombat(e,dt);if(hadRing&&!s.ringPrototype&&!s.crossingPrototype&&!s.tailSeverPrototype&&!s.mawPrototype&&phase>=3)s.nextPrototypeAttack='past';return result;};
  window.stackfallUpdateWorldDevourerCrossing=window.stackfallUpdateWorldDevourerCombat;const baseBackground=drawBackground;drawBackground=function(){const r=baseBackground();drawPast();return r;};
  window.stackfallTriggerAtroposPastTrajectory=()=>{const e=serpentEnemy(),s=serpentOf(e);if(!e||!s||phaseOf(e)<3)return false;s.crossingPrototype=s.tailSeverPrototype=s.mawPrototype=s.ringPrototype=s.pastPrototype=null;return startPast(e,s);};
  window.stackfallAtroposPastDiagnostics=()=>{const e=serpentEnemy(),s=serpentOf(e),a=s?.pastPrototype;return{phase:e?phaseOf(e):null,active:!!a,stage:stage(a),age:a?+a.age.toFixed(2):0,serial:a?.serial||0,routePoints:a?.route?.length||0,presentHit:!!a?.presentHit,echoHit:!!a?.echoHit,target:a?{x:Math.round(a.target.x),y:Math.round(a.target.y)}:null};};
  window.stackfallAtroposPrototypeAttackState='p1-basic+p2-maw-ring+p3-past-motion-v5';
})();
