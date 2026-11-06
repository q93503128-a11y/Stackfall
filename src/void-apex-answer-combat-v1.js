// THE ANSWER / 응답 — three-phase combat prototype.
// Keeps the approved body presentation separate from combat so tuning does not destabilize entry/preflight logic.
(()=>{
  'use strict';
  if(window.stackfallVoidApexAnswerCombat==='v2')return;
  window.stackfallVoidApexAnswerCombat='v2';

  const PHASE_2_HP=.75,PHASE_3_HP=.30;
  const APEX_HP_MULT=6.46;      // Ordinary Apex common HP multiplier after the approved ~15% nerf.
  const APEX_DAMAGE_MULT=1.83; // Ordinary Apex common damage multiplier after the approved ~15% nerf.
  const ANSWER_HP_FORM=2.63,ANSWER_DAMAGE_FORM=1.51;
  const DAMAGE={spike:1,split:1.35,beam:1.45,row:1.10,bolt:.70,heavy:.82,cloneBeam:.76,collapse:.72,mine:.68,orbit:.68,well:.24,drone:.72};
  const TIMING={spike:5.8,split:18,beam:11.5,row:14.5,clone:3};
  const runtime={
    active:false,defeating:false,boss:null,phase:1,transition:null,attackPause:0,
    spikeCd:3.2,majorCd:{split:8,beam:Infinity,row:Infinity},majorRecovery:0,cloneCd:3,cloneWaiting:false,cloneDelay:0,lastMajor:null,
    spikes:[],major:null,clones:[],lastClone:null,phaseAge:0,serial:0,previousPlayer:null,hitPulse:null,pendingImpact:null,lastImpactUsed:null
  };
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const answerActive=()=>state.answerVoidApexPreview===true;
  const answerDiag=()=>window.stackfallVoidApexAnswerDiagnostics?.()||null;
  const frame=()=>answerDiag()?.frame||{visibleDepth:Math.max(245,Math.min(330,(Number(vh)||720)*.34))};
  const camera=()=>answerDiag()?.camera||{x:player.x,y:player.y};
  const worldToScreen=(x,y)=>{const c=camera();return{x:x-c.x+vw/2,y:y-c.y+vh/2};};
  const screenToWorld=(x,y)=>{const c=camera();return{x:c.x+x-vw/2,y:c.y+y-vh/2};};
  const playerScreen=()=>worldToScreen(player.x,player.y);
  const segDist=(px,py,x1,y1,x2,y2)=>{const vx=x2-x1,vy=y2-y1,l2=vx*vx+vy*vy;if(l2<=1e-9)return Math.hypot(px-x1,py-y1);const t=Math.max(0,Math.min(1,((px-x1)*vx+(py-y1)*vy)/l2)),x=x1+vx*t,y=y1+vy*t;return Math.hypot(px-x,py-y);};
  const hazardPlayerRadius=()=>Math.max(4,Number(player?.r)||14);
  function pointInPoly(px,py,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],cross=((a.y>py)!==(b.y>py))&&(px<(b.x-a.x)*(py-a.y)/((b.y-a.y)||1e-9)+a.x);if(cross)inside=!inside;}return inside;}
  function circleHitsPoly(px,py,r,poly){if(pointInPoly(px,py,poly))return true;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(segDist(px,py,a.x,a.y,b.x,b.y)<=r)return true;}return false;}
  const BODY_SOURCE_W=960,BODY_SOURCE_H=280;
  // Traced from the alpha silhouette of the approved Answer raster. Rendering, targeting and weapon hits share this contour.
  const BODY_UNDERSIDE_SRC=[[0,114],[29,144],[59,162],[89,182],[119,193],[149,194],[179,209],[209,227],[239,235],[269,235],[299,235],[329,239],[359,246],[389,244],[419,244],[449,250],[479,265],[509,250],[539,236],[569,237],[599,244],[629,247],[659,237],[689,239],[719,243],[749,232],[779,215],[809,204],[839,189],[869,177],[899,157],[929,125],[959,108]];
  function bodyFrame(){
    const f=frame();if(Number.isFinite(f.x)&&Number.isFinite(f.y)&&Number.isFinite(f.w)&&Number.isFinite(f.h))return f;
    const width=Math.max(1,Number(vw)||1280),height=Math.max(1,Number(vh)||720),ratio=BODY_SOURCE_W/BODY_SOURCE_H,w=Math.max(width*1.14,height*2.05),h=w/ratio,visibleDepth=Math.max(245,Math.min(330,height*.34));
    return{x:(width-w)*.5,y:visibleDepth-h,w,h,visibleDepth,ratio};
  }
  function bodySourceToScreen(nx,ny){const f=bodyFrame();return{x:f.x+nx*f.w,y:f.y+ny*f.h};}
  function bodyUndersideSourceY(srcX){
    const x=Math.max(0,Math.min(BODY_SOURCE_W-1,srcX));for(let i=1;i<BODY_UNDERSIDE_SRC.length;i++){const a=BODY_UNDERSIDE_SRC[i-1],b=BODY_UNDERSIDE_SRC[i];if(x<=b[0]){const q=(x-a[0])/Math.max(1,b[0]-a[0]);return a[1]+(b[1]-a[1])*q;}}return BODY_UNDERSIDE_SRC[BODY_UNDERSIDE_SRC.length-1][1];
  }
  function bodyUndersideScreenY(screenX){const f=bodyFrame(),srcX=(screenX-f.x)/f.w*BODY_SOURCE_W,srcY=bodyUndersideSourceY(srcX);return f.y+srcY/BODY_SOURCE_H*f.h;}
  function bodySurfaceScreenPoint(screenX){
    const f=bodyFrame(),x=Math.max(f.x,Math.min(f.x+f.w,screenX)),y=bodyUndersideScreenY(x),step=Math.max(4,f.w/BODY_SOURCE_W*5),yl=bodyUndersideScreenY(x-step),yr=bodyUndersideScreenY(x+step),tx=step*2,ty=yr-yl,len=Math.hypot(-ty,tx)||1;
    let nx=-ty/len,ny=tx/len;if(ny<0){nx=-nx;ny=-ny;}return{x,y,nx,ny};
  }
  function bodyScreenPolygon(){
    const f=bodyFrame(),points=[{x:f.x,y:f.y},{x:f.x+f.w,y:f.y}];for(let i=BODY_UNDERSIDE_SRC.length-1;i>=0;i--){const p=BODY_UNDERSIDE_SRC[i];points.push({x:f.x+p[0]/BODY_SOURCE_W*f.w,y:f.y+p[1]/BODY_SOURCE_H*f.h});}return points;
  }
  function bodyWorldPolygon(){return bodyScreenPolygon().map(p=>screenToWorld(p.x,p.y));}
  function syncBossBodyGeometry(e){
    if(!e)return;const ps=playerScreen(),surface=bodySurfaceScreenPoint(ps.x),targetScreen={x:surface.x-surface.nx*9,y:surface.y-surface.ny*9},target=screenToWorld(targetScreen.x,targetScreen.y),points=bodyWorldPolygon();
    e.x=target.x;e.y=target.y;e.r=18;e.speed=0;e.contactSafeUntil=1e12;e.stageBodyShapes=[{kind:'polygon',points}];runtime.bodyTarget=targetScreen;runtime.bodyPolygon=points;
  }
  function rayArenaEnd(origin,aim){
    let dx=aim.x-origin.x,dy=aim.y-origin.y,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;const left=vw*.018,right=vw*.982,bottom=vh*.965,candidates=[];
    if(dx>1e-5)candidates.push((right-origin.x)/dx);else if(dx<-1e-5)candidates.push((left-origin.x)/dx);if(dy>1e-5)candidates.push((bottom-origin.y)/dy);
    const edge=Math.min(...candidates.filter(v=>Number.isFinite(v)&&v>0));const travel=Math.max(Number.isFinite(edge)?edge+92:0,vh*.58);return{x:origin.x+dx*travel,y:origin.y+dy*travel};
  }
  function spikePolygon(s,reach=1){
    const r=clamp01(reach),fdx=s.target.x-s.origin.x,fdy=s.target.y-s.origin.y,fullD=Math.hypot(fdx,fdy)||1,ux=fdx/fullD,uy=fdy/fullD,nx=-uy,ny=ux,d=fullD*r,seed=Number(s.seed)||0,root=16+Math.min(10,fullD*.010),profile=[[0,.96],[.035,1.18],[.075,.70],[.12,.84],[.18,.50],[.27,.38],[.38,.29],[.52,.21],[.67,.14],[.81,.085],[.92,.038],[1,0]];
    const edge=(entry,side)=>{const [t,widthScale]=entry,center=root*(Math.sin(t*7.4+seed*3.2)*.22+Math.sin(t*15.1-seed*2.1)*.08)*Math.sin(Math.PI*t),edgeNoise=(Math.sin(t*27.3+seed*5.1+side*1.9)*.18+Math.sin(t*12.7-seed*2.7+side)*.07),w=root*widthScale*(1+edgeNoise*side);return{x:s.origin.x+ux*d*t+nx*(center+w*side),y:s.origin.y+uy*d*t+ny*(center+w*side)};};
    const left=profile.map(entry=>edge(entry,1)),right=profile.slice(0,-1).reverse().map(entry=>edge(entry,-1));return left.concat(right);
  }
  function nearestPointOnSegment(px,py,a,b){const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/l2));return{x:a.x+dx*t,y:a.y+dy*t};}
  function nearestPointOnPolygon(px,py,poly){let best=null,bd=Infinity;for(let i=0;i<poly.length;i++){const q=nearestPointOnSegment(px,py,poly[i],poly[(i+1)%poly.length]),d=(q.x-px)**2+(q.y-py)**2;if(d<bd){bd=d;best=q;}}return best||{x:px,y:py};}
  function segmentIntersectionPoint(a,b,c,d){const r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y},den=r.x*s.y-r.y*s.x;if(Math.abs(den)<1e-8)return null;const q={x:c.x-a.x,y:c.y-a.y},t=(q.x*s.y-q.y*s.x)/den,u=(q.x*r.y-q.y*r.x)/den;return t>=0&&t<=1&&u>=0&&u<=1?{x:a.x+r.x*t,y:a.y+r.y*t,t}:null;}
  function firstSegmentPolygonHit(x1,y1,x2,y2,poly){let best=null;const a={x:x1,y:y1},b={x:x2,y:y2};for(let i=0;i<poly.length;i++){const hit=segmentIntersectionPoint(a,b,poly[i],poly[(i+1)%poly.length]);if(hit&&(!best||hit.t<best.t))best=hit;}return best||nearestPointOnPolygon(x2,y2,poly);}
  const SPLIT_BAND_HALF=12;
  const signedLine=(x,y,line)=>{const nx=-Math.sin(line.a),ny=Math.cos(line.a);return(x-line.cx)*nx+(y-line.cy)*ny;};
  const bossDamage=()=>Math.max(1,Number(runtime.boss?.damage)||34);
  function hitPlayer(mult,source=runtime.boss){if(player.invuln>0||state.mode==='gameover')return false;hurtPlayer(Math.max(1,bossDamage()*mult),source||'answer');return true;}
  function syncHudRatio(){if(!runtime.boss)return;const ratio=clamp01(runtime.boss.hp/Math.max(1,runtime.boss.maxHp));window.stackfallSetAnswerPrototypeHpRatio?.(ratio);return ratio;}

  function createBoss(){
    if(runtime.boss&&!runtime.boss.dead)return runtime.boss;
    const base=enemyConfig('boss'),cycle=Math.max(0,Math.floor(Number(state.apexCount)||0)),esc=window.stackfallApexEscalationForCycle?.(cycle)||{hp:1,damage:1};
    const f=frame(),c=camera(),screenY=Math.max(82,f.visibleDepth*.66),target=screenToWorld(vw*.5,screenY),r=18;
    const hp=Math.max(1,base.hp*ANSWER_HP_FORM*APEX_HP_MULT*(Number(esc.hp)||1));
    const damage=Math.max(1,base.damage*ANSWER_DAMAGE_FORM*APEX_DAMAGE_MULT*(Number(esc.damage)||1));
    const e={id:state.nextId++,type:'boss',kind:'answer-apex',eventKind:'answer-void-apex',answerBoss:true,name:'응답',x:target.x,y:target.y,r,hp,maxHp:hp,speed:0,damage,color:'#090a10',xp:0,hit:0,dead:false,phase:0,skillCd:999,burstCd:999,pulseCd:999,contactSafeUntil:1e12,controlImmune:true,knockbackImmune:true,timeLock:0};
    state.entities.enemies.push(e);runtime.boss=e;state.bossActiveId=e.id;syncHudRatio();return e;
  }
  function removeBoss(){const e=runtime.boss;if(e){const i=state.entities.enemies.indexOf(e);if(i>=0)state.entities.enemies.splice(i,1);}if(state.bossActiveId===e?.id)state.bossActiveId=null;runtime.boss=null;}
  function clearPatterns(){if(runtime.major)runtime.majorRecovery=Math.max(runtime.majorRecovery,1.5);runtime.spikes.length=0;runtime.major=null;runtime.clones.length=0;runtime.pendingImpact=null;runtime.attackPause=Math.max(runtime.attackPause,.25);}
  function resetTimers(phase=1){runtime.spikeCd=phase===1?3.2:2.3;runtime.majorCd.split=phase===1?8:Math.min(runtime.majorCd.split||8,6);runtime.majorCd.beam=phase>=2?5:Infinity;runtime.majorCd.row=phase>=2?8:Infinity;runtime.majorRecovery=0;runtime.cloneCd=phase>=3?3:Infinity;runtime.cloneWaiting=false;runtime.cloneDelay=0;runtime.lastMajor=null;runtime.phaseAge=0;}
  function beginCombat(){
    runtime.active=true;runtime.defeating=false;runtime.phase=1;runtime.transition=null;runtime.serial++;runtime.hitPulse=null;runtime.lastImpactUsed=null;clearPatterns();resetTimers(1);createBoss();
    window.stackfallSetAnswerPrototypePhase?.(1,true);window.stackfallSetAnswerPrototypeHpRatio?.(1);
  }
  function endCombat(){runtime.active=false;runtime.defeating=false;runtime.transition=null;clearPatterns();removeBoss();}
  function defeatCombat(){if(runtime.defeating)return;runtime.defeating=true;clearPatterns();if(runtime.boss){runtime.boss.hp=0;runtime.boss.dead=true;}window.stackfallSetAnswerPrototypeHpRatio?.(0);window.stackfallDefeatAnswerPrototype?.();}

  function beginTransition(to){
    if(runtime.transition||runtime.defeating||to<=runtime.phase||to>3)return false;
    clearPatterns();runtime.transition={from:runtime.phase,to,age:0,duration:to===2?1.35:1.60,flash:false,burst:false};runtime.attackPause=2;return true;
  }
  function finishTransition(){
    const tr=runtime.transition;if(!tr)return;runtime.phase=tr.to;runtime.transition=null;runtime.phaseAge=0;window.stackfallSetAnswerPrototypePhase?.(runtime.phase,true);
    if(runtime.phase===2){runtime.majorCd.beam=5;runtime.majorCd.row=8;runtime.spikeCd=Math.min(runtime.spikeCd,2.0);}
    if(runtime.phase===3){runtime.cloneCd=3;runtime.spikeCd=Math.min(runtime.spikeCd,1.7);}
  }
  function updateTransition(dt){
    const tr=runtime.transition;if(!tr)return;
    tr.age+=dt;
    if(tr.age>=tr.duration)finishTransition();
  }
  function phaseFromHp(){
    if(!runtime.boss||runtime.transition||runtime.defeating)return;
    const ratio=syncHudRatio();if(runtime.phase===1&&ratio<=PHASE_2_HP)beginTransition(2);else if(runtime.phase===2&&ratio<=PHASE_3_HP)beginTransition(3);
  }

  function spikeSuppressed(){const m=runtime.major;if(runtime.transition||runtime.attackPause>0)return true;if(!m)return false;return(m.kind==='split'&&m.age>=m.warn-1.2&&m.age<=m.warn+.35)||(m.kind==='row'&&m.age>=m.warn-.65&&m.age<=m.warn+m.active);}
  function startSpikes(){
    const count=runtime.phase,ps=playerScreen(),left=vw*.075,right=vw*.925,top=Math.max(frame().visibleDepth+52,vh*.42),bottom=vh*.89,offsets=count===1?[0]:count===2?[-105,105]:[-150,0,150];
    runtime.spikes=offsets.map((off,i)=>{const aim={x:Math.max(left,Math.min(right,ps.x+off+rand(-26,26))),y:Math.max(top,Math.min(bottom,ps.y+rand(-24,24)))},rootX=Math.max(vw*.035,Math.min(vw*.965,aim.x+rand(-88,88))),surface=bodySurfaceScreenPoint(rootX),origin={x:surface.x-surface.nx*11,y:surface.y-surface.ny*11},target=rayArenaEnd(origin,aim);return{origin,target,aim,surface,age:0,warn:1.4,thrust:.14,hold:.35,retract:.18,hit:false,index:i,seed:rand(-1,1)};});
    runtime.spikeCd=TIMING.spike+rand(-.5,.5);
  }
  function updateSpikes(dt){
    runtime.spikeCd-=dt;
    if(!runtime.spikes.length){if(runtime.spikeCd<=0&&!spikeSuppressed())startSpikes();return;}
    const ps=playerScreen();for(const s of runtime.spikes){s.age+=dt;if(s.age>=s.warn&&s.age<=s.warn+s.thrust+s.hold&&!s.hit){const travel=clamp01((s.age-s.warn)/s.thrust),ex=s.origin.x+(s.target.x-s.origin.x)*travel,ey=s.origin.y+(s.target.y-s.origin.y)*travel;const poly=spikePolygon(s,travel);if(circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),poly)){s.hit=true;hitPlayer(DAMAGE.spike);}}}
    if(runtime.spikes.every(s=>s.age>=s.warn+s.thrust+s.hold+s.retract))runtime.spikes.length=0;
  }

  function splitLine(){
    const angles=[0,Math.PI/2,Math.PI*.25,-Math.PI*.25,Math.PI*.16,-Math.PI*.16],a=angles[Math.floor(Math.random()*angles.length)],nx=-Math.sin(a),ny=Math.cos(a),ratio=rand(.30,.70),halfProjection=(Math.abs(nx)*vw+Math.abs(ny)*vh)*.5,offset=(ratio-.5)*2*halfProjection,cx=vw*.5+nx*offset,cy=vh*.5+ny*offset,span=Math.hypot(vw,vh)*1.25;return{cx,cy,a,span,ratio};
  }
  function startMajor(kind){
    if(runtime.major||runtime.transition||runtime.defeating)return false;
    if(kind==='split')runtime.major={kind,age:0,warn:3.4,active:4.0,fade:.8,line:splitLine(),side:0,impact:false};
    else if(kind==='beam'&&runtime.phase>=2)runtime.major={kind,age:0,warn:1.9,active:.70,fade:.32,width:Math.max(36,Math.min(96,vw*.055)),hit:false};
    else if(kind==='row'&&runtime.phase>=2){const count=runtime.phase>=3?5:4,indices=[0,1,2,3,4].slice(0,count),fake=[];while(fake.length<2){const i=indices[Math.floor(Math.random()*indices.length)];if(!fake.includes(i))fake.push(i);}runtime.major={kind,axis:'horizontal',age:0,warn:2.3,active:.65,fade:.25,count,fake:new Set(fake),crumble:new Set(),directions:Array.from({length:count},(_,i)=>i%2===0?1:-1),hit:false};}
    else return false;
    runtime.lastMajor=kind;if(kind==='split')runtime.majorCd.split=TIMING.split+rand(-1,1);if(kind==='beam')runtime.majorCd.beam=TIMING.beam+rand(-.6,.6);if(kind==='row')runtime.majorCd.row=TIMING.row+rand(-.8,.8);return true;
  }
  function dueMajor(){
    const kinds=runtime.phase===1?['split']:['split','beam','row'],due=kinds.filter(k=>runtime.majorCd[k]<=0);if(!due.length)return null;const alternate=due.filter(k=>k!==runtime.lastMajor),pool=alternate.length?alternate:due;return pool.sort((a,b)=>runtime.majorCd[a]-runtime.majorCd[b])[0];
  }
  function updateMajorTimers(dt){for(const k of['split','beam','row'])if(Number.isFinite(runtime.majorCd[k]))runtime.majorCd[k]-=dt;if(runtime.major)return;runtime.majorRecovery=Math.max(0,runtime.majorRecovery-dt);if(runtime.majorRecovery<=0){const kind=dueMajor();if(kind)startMajor(kind);}}
  function finishMajor(){runtime.major=null;runtime.majorRecovery=1.5;}
  function splitStrength(m){if(m.age<m.warn)return 0;return m.age<m.warn+m.active?1:1-clamp01((m.age-m.warn-m.active)/m.fade);}
  function clipPolygonToSplitSide(poly,line,side){
    const inside=p=>signedLine(p.x,p.y,line)*side>=0,out=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],da=signedLine(a.x,a.y,line)*side,db=signedLine(b.x,b.y,line)*side,ia=da>=0,ib=db>=0;
      if(ia)out.push(a);if(ia!==ib){const q=da/(da-db);out.push({x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q});}
    }
    return out;
  }
  function splitTearEdges(line,halfWidth=1){
    const ux=Math.cos(line.a),uy=Math.sin(line.a),nx=-uy,ny=ux,count=Math.max(18,Math.ceil(line.span/38)),a=[],b=[];
    for(let i=0;i<=count;i++){const q=i/count,along=(q-.5)*line.span,cx=line.cx+ux*along,cy=line.cy+uy*along,wave=Math.sin(i*1.87+line.a*5)*1.6+Math.sin(i*.73+line.a*2)*.9,w=Math.max(.7,halfWidth+wave);a.push({x:cx+nx*w,y:cy+ny*w});b.push({x:cx-nx*w,y:cy-ny*w});}
    return{a,b,ux,uy,nx,ny};
  }
  function drawSplitTear(line,strength){
    const width=Math.max(.8,SPLIT_BAND_HALF*strength),edges=splitTearEdges(line,width),poly=edges.a.concat(edges.b.slice().reverse());if(poly.length<4)return;
    ctx.save();ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.fillStyle=`rgba(0,0,2,${.90+.09*strength})`;ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=8*strength;ctx.fill();ctx.shadowBlur=0;
    ctx.globalCompositeOperation='screen';ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=`rgba(208,218,236,${.12+.22*strength})`;ctx.lineWidth=.8+strength*.55;for(const edge of[edges.a,edges.b]){ctx.beginPath();ctx.moveTo(edge[0].x,edge[0].y);for(let i=1;i<edge.length;i++)ctx.lineTo(edge[i].x,edge[i].y);ctx.stroke();}ctx.restore();
  }
  function drawAnswerSplitBackground(){
    const m=runtime.major;if(!runtime.active||m?.kind!=='split'||m.age<m.warn)return false;const snapshot=window.stackfallAnswerBackgroundSnapshot?.();if(!snapshot)return false;
    const strength=splitStrength(m),line=m.line,normal={x:-Math.sin(line.a),y:Math.cos(line.a)},viewport=[{x:0,y:0},{x:vw,y:0},{x:vw,y:vh},{x:0,y:vh}];if(strength<=0)return false;
    ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    for(const side of[-1,1]){const polygon=clipPolygonToSplitSide(viewport,line,side);if(polygon.length<3)continue;ctx.save();ctx.beginPath();ctx.moveTo(polygon[0].x,polygon[0].y);for(let i=1;i<polygon.length;i++)ctx.lineTo(polygon[i].x,polygon[i].y);ctx.closePath();ctx.clip();ctx.translate(normal.x*side*SPLIT_BAND_HALF*strength,normal.y*side*SPLIT_BAND_HALF*strength);ctx.drawImage(snapshot,0,0,vw,vh);ctx.restore();}
    drawSplitTear(line,strength);ctx.restore();return true;
  }
  window.stackfallAnswerSplitSnapshotLocked=()=>runtime.active&&runtime.major?.kind==='split'&&runtime.major.age>=runtime.major.warn;
  window.stackfallDrawAnswerSplitBackground=drawAnswerSplitBackground;
  function applySplitCollision(m){
    const strength=splitStrength(m);if(strength<=0)return;const ps=playerScreen(),line=m.line,margin=(SPLIT_BAND_HALF+hazardPlayerRadius())*strength,s=signedLine(ps.x,ps.y,line);if(margin<=.5)return;if(!m.side)m.side=s>=0?1:-1;if(s*m.side>=margin)return;const nx=-Math.sin(line.a),ny=Math.cos(line.a),push=(margin-s*m.side)*m.side;player.x+=nx*push;player.y+=ny*push;
  }
  function rowLaneGeometry(m,index,reach=1){
    const top=Math.max(frame().visibleDepth+26,vh*.405),bottom=vh*.925,laneH=(bottom-top)/m.count,y0=top+index*laneH+3,y1=top+(index+1)*laneH-3,mid=(y0+y1)*.5,left=vw*.025,right=vw*.975,dir=m.directions?.[index]||1,span=right-left,r=clamp01(reach),tip=dir>0?left+span*r:right-span*r,rear=dir>0?left-54:right+54,len=Math.abs(tip-rear),x=t=>rear+dir*len*t,h=y1-y0;
    const poly=[
      {x:rear,y:mid-h*.36},{x:x(.14),y:y0+h*.12},{x:x(.38),y:y0+h*.04},{x:x(.63),y:y0+h*.16},{x:x(.82),y:y0+h*.08},{x:x(.92),y:mid-h*.20},{x:tip,y:mid},
      {x:x(.90),y:mid+h*.18},{x:x(.74),y:y1-h*.10},{x:x(.48),y:y1-h*.03},{x:x(.22),y:y1-h*.17},{x:rear,y:mid+h*.38}
    ];
    return{top,bottom,laneH,y0,y1,mid,left,right,dir,poly};
  }
  function updateMajor(dt){
    updateMajorTimers(dt);const m=runtime.major;if(!m)return;m.age+=dt;
    if(m.kind==='split'){
      if(!m.impact&&m.age>=m.warn){m.impact=true;const ps=playerScreen();m.side=signedLine(ps.x,ps.y,m.line)>=0?1:-1;if(Math.abs(signedLine(ps.x,ps.y,m.line))<=SPLIT_BAND_HALF+hazardPlayerRadius())hitPlayer(DAMAGE.split);state.camera.shake=Math.max(Number(state.camera.shake)||0,7);}
      if(m.age>=m.warn&&m.age<m.warn+m.active+m.fade)applySplitCollision(m);
      if(m.age>=m.warn+m.active+m.fade)finishMajor();
    }else if(m.kind==='beam'){
      if(m.age>=m.warn&&m.age<m.warn+m.active&&!m.hit){const ps=playerScreen(),root=fissureRootScreen();if(Math.abs(ps.x-root.x)<=m.width*.5+hazardPlayerRadius()){m.hit=true;hitPlayer(DAMAGE.beam);state.camera.shake=Math.max(Number(state.camera.shake)||0,6.2);}}
      if(m.age>=m.warn+m.active+m.fade)finishMajor();
    }else if(m.kind==='row'){
      if(m.age>=m.warn&&m.age<m.warn+m.active){const ps=playerScreen(),reach=clamp01((m.age-m.warn)/.18);for(let i=0;i<m.count;i++){if(m.crumble.has(i))continue;const g=rowLaneGeometry(m,i,reach);if(!circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),g.poly))continue;if(m.fake.has(i)){m.crumble.add(i);const wp=screenToWorld(ps.x,ps.y);try{spawnParticle(wp.x,wp.y,'#ffffff',18,170,3.4);}catch{}}else if(!m.hit){m.hit=true;hitPlayer(DAMAGE.row);}break;}}
      if(m.age>=m.warn+m.active+m.fade)finishMajor();
    }
  }

  const cloneFamily=key=>({core:'bolt',ember:'ember',comet:'comet',missile:'missile',gravity:'well',chrono:'slow',prism:'prism',rail:'rail',ion:'ion',blade:'blade',arc:'arc',spiral:'spiral',mirror:'mirror',nova:'nova',vacuum:'vacuum',mine:'mine',drone:'drone',gate:'gate',bulwark:'bulwark'}[key]||null);
  function cloneableKeys(){const keys=[];if(weaponCount('core')>0)keys.push('core');for(const key of state.weaponSlots||[])if(key&&WEAPONS[key]&&weaponCount(key)>0&&!keys.includes(key))keys.push(key);return keys;}
  function chooseCloneKey(){const keys=cloneableKeys();if(!keys.length)return null;if(keys.length===1)return keys[0];const alt=keys.filter(k=>k!==runtime.lastClone),pool=alt.length&&Math.random()<.78?alt:keys;return pool[Math.floor(Math.random()*pool.length)];}
  function startClone(forceKey=null){
    if(runtime.phase<3||runtime.transition||runtime.defeating)return false;const key=forceKey||chooseCloneKey();if(!key||!cloneableKeys().includes(key))return false;const family=cloneFamily(key);if(!family)return false;const ps=playerScreen(),target=screenToWorld(ps.x,ps.y),origin=screenToWorld(vw*.5,Math.max(70,frame().visibleDepth*.66)),level=Math.max(1,weaponCount(key)||1),clone={key,family,age:0,hit:false,x:origin.x,y:origin.y,originX:origin.x,originY:origin.y,targetX:target.x,targetY:target.y,level};
    if(['bolt','ember','comet','missile'].includes(family)){const a=Math.atan2(target.y-origin.y,target.x-origin.x),heavy=['comet','missile'].includes(family),speed=heavy?250:family==='ember'?375:420;clone.vx=Math.cos(a)*speed;clone.vy=Math.sin(a)*speed;clone.r=heavy?11:family==='ember'?7:5.5;clone.life=heavy?4.4:3.3;clone.turn=family==='comet'?.75:family==='missile'?.36:0;}
    else if(['prism','rail','ion','gate'].includes(family)){clone.warn=.78;clone.active=family==='prism'?.46:family==='rail'?.25:family==='gate'?.36:.22;clone.fade=.20;clone.a=Math.atan2(target.y-origin.y,target.x-origin.x);clone.length=Math.hypot(vw,vh)*1.3;clone.width=family==='rail'?18:family==='prism'?20:family==='gate'?12:10;}
    else if(['well','slow','nova','vacuum','mine','bulwark'].includes(family)){clone.x=target.x;clone.y=target.y;clone.warn=family==='mine'?.65:family==='bulwark'?.40:.85;clone.active=family==='well'||family==='slow'?2.15:family==='bulwark'?1.15:family==='mine'?.42:.52;clone.fade=.35;clone.r=family==='well'?118:family==='slow'?132:family==='nova'?102:family==='vacuum'?92:family==='mine'?72:96;clone.tick=0;clone.startRadius=family==='bulwark'?18:0;}
    else if(['blade','arc','spiral','mirror'].includes(family)){clone.x=target.x;clone.y=target.y;clone.warn=.42;clone.active=1.45;clone.fade=.25;clone.radius=family==='blade'?72:family==='arc'?86:family==='mirror'?68:92;clone.angle=Math.random()*Math.PI*2;clone.count=family==='blade'?Math.min(5,2+level):family==='arc'?1:family==='mirror'?2:4;}
    else if(family==='drone'){clone.x=origin.x;clone.y=origin.y;clone.warn=.45;clone.active=2.1;clone.fade=.2;clone.shot=.18;clone.angle=Math.atan2(target.y-origin.y,target.x-origin.x);}
    runtime.clones.push(clone);while(runtime.clones.length>2)runtime.clones.shift();runtime.lastClone=key;runtime.cloneCd=TIMING.clone;runtime.cloneWaiting=false;runtime.cloneDelay=0;return true;
  }
  function cloneCritical(){const m=runtime.major;if(!m)return false;if(m.kind==='split')return m.age>=m.warn-1&&m.age<=m.warn+.45;if(m.kind==='row')return m.age>=m.warn-.7&&m.age<=m.warn+m.active;if(m.kind==='beam')return m.age>=m.warn-.45&&m.age<=m.warn+m.active;return false;}
  function updateClone(c,dt,before){
    c.age+=dt;const family=c.family;
    if(['bolt','ember','comet','missile'].includes(family)){
      if(c.turn>0){const a=Math.atan2(player.y-c.y,player.x-c.x),cur=Math.atan2(c.vy,c.vx),delta=Math.atan2(Math.sin(a-cur),Math.cos(a-cur)),next=cur+Math.max(-c.turn*dt,Math.min(c.turn*dt,delta)),speed=Math.hypot(c.vx,c.vy);c.vx=Math.cos(next)*speed;c.vy=Math.sin(next)*speed;}
      const ox=c.x,oy=c.y;c.x+=c.vx*dt;c.y+=c.vy*dt;c.life-=dt;if(!c.hit&&player.invuln<=0&&segDist(player.x,player.y,ox,oy,c.x,c.y)<=player.r+c.r){c.hit=true;c.life=0;hitPlayer(['comet','missile'].includes(family)?DAMAGE.heavy:DAMAGE.bolt);}return c.life>0;
    }
    if(['prism','rail','ion','gate'].includes(family)){if(c.age>=c.warn&&c.age<c.warn+c.active&&!c.hit){const x2=c.x+Math.cos(c.a)*c.length,y2=c.y+Math.sin(c.a)*c.length;if(segDist(player.x,player.y,c.x,c.y,x2,y2)<=player.r+c.width*.5){c.hit=true;hitPlayer(DAMAGE.cloneBeam);}}return c.age<c.warn+c.active+c.fade;}
    if(['well','slow','nova','vacuum','mine','bulwark'].includes(family)){
      const active=c.age>=c.warn&&c.age<c.warn+c.active;if(active){const dx=c.x-player.x,dy=c.y-player.y,d=Math.hypot(dx,dy)||1;if(family==='well'&&d<c.r*1.5){const pull=(1-Math.min(1,d/(c.r*1.5)))*125;player.x+=dx/d*pull*dt;player.y+=dy/d*pull*dt;if(c.level>=4&&d<c.r+player.r){c.tick-=dt;if(c.tick<=0){c.tick=.72;hitPlayer(DAMAGE.well);}}}else if(family==='slow'&&d<c.r+player.r&&before){player.x=before.x+(player.x-before.x)*.52;player.y=before.y+(player.y-before.y)*.52;}else if(family==='bulwark'){c.startRadius=Math.min(c.r,c.startRadius+120*dt);if(!c.hit&&Math.abs(d-c.startRadius)<=player.r+10){c.hit=true;hitPlayer(DAMAGE.orbit);}}else if(!c.hit&&d<c.r+player.r){c.hit=true;hitPlayer(family==='mine'?DAMAGE.mine:DAMAGE.collapse);}}
      return c.age<c.warn+c.active+c.fade;
    }
    if(['blade','arc','spiral','mirror'].includes(family)){if(c.age>=c.warn&&c.age<c.warn+c.active){c.angle+=dt*(family==='spiral'?3.5:2.8);for(let i=0;i<c.count;i++){const a=c.angle+i*Math.PI*2/c.count,r=c.radius*(family==='spiral'?.72+.28*Math.sin(c.age*5+i):1),x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r;if(!c.hit&&Math.hypot(player.x-x,player.y-y)<=player.r+13){c.hit=true;hitPlayer(DAMAGE.orbit);}}}return c.age<c.warn+c.active+c.fade;}
    if(family==='drone'){if(c.age<c.warn){const q=clamp01(c.age/c.warn);c.x=c.originX+(c.targetX-c.originX)*q;c.y=c.originY+(c.targetY-c.originY)*q;}if(c.age>=c.warn&&c.age<c.warn+c.active){c.angle+=dt*1.5;c.x=c.targetX+Math.cos(c.angle)*42;c.y=c.targetY+Math.sin(c.angle)*24;c.shot-=dt;if(c.shot<=0){c.shot=.48;const a=Math.atan2(player.y-c.y,player.x-c.x),p=spawnEnemyProjectile(c.x,c.y,a,340,bossDamage()*DAMAGE.drone,'#050507',5,2.6,'needle');p.answerClone=true;}}return c.age<c.warn+c.active+c.fade;}
    return false;
  }
  function updateClones(dt,before){
    if(runtime.phase<3){runtime.clones.length=0;runtime.cloneWaiting=false;runtime.cloneDelay=0;return;}
    runtime.cloneCd-=dt;
    if(runtime.cloneCd<=0&&!runtime.transition){
      const critical=cloneCritical();
      if(!runtime.cloneWaiting&&critical){runtime.cloneWaiting=true;runtime.cloneDelay=1;}
      if(!critical||runtime.cloneDelay<=0)startClone();
      else if(runtime.cloneWaiting)runtime.cloneDelay=Math.max(0,runtime.cloneDelay-dt);
    }
    const keep=[];for(const c of [...runtime.clones])if(updateClone(c,dt,before))keep.push(c);runtime.clones=keep.slice(-2);
  }

  function updateCombat(dt,before){
    if(!answerActive()){if(runtime.active)endCombat();return;}
    if(!runtime.active)beginCombat();if(runtime.defeating)return;
    if(!runtime.boss||runtime.boss.dead){if(!runtime.defeating)createBoss();}
    const e=runtime.boss;if(e)syncBossBodyGeometry(e);
    runtime.previousPlayer=before;runtime.phaseAge+=dt;runtime.attackPause=Math.max(0,runtime.attackPause-dt);if(runtime.hitPulse){runtime.hitPulse.age+=dt;if(runtime.hitPulse.age>.24)runtime.hitPulse=null;}if(runtime.pendingImpact&&performance.now()-runtime.pendingImpact.at>450)runtime.pendingImpact=null;if(runtime.boss){runtime.boss.hit=Math.max(0,(Number(runtime.boss.hit)||0)-dt);}phaseFromHp();updateTransition(dt);
    if(runtime.transition)return;
    updateSpikes(dt);updateMajor(dt);updateClones(dt,before);syncHudRatio();
  }

  const baseEnemyCircleOverlapAnswer=enemyCircleOverlap;
  enemyCircleOverlap=function answerBodyCircleOverlap(e,x,y,r){
    const hit=baseEnemyCircleOverlapAnswer(e,x,y,r);if(e===runtime.boss&&hit&&e?.stageBodyShapes?.[0]?.points){const q=nearestPointOnPolygon(x,y,e.stageBodyShapes[0].points);runtime.pendingImpact={x:q.x,y:q.y,targetId:e.id,at:performance.now()};}return hit;
  };
  const baseEnemySegmentOverlapAnswer=enemySegmentOverlap;
  enemySegmentOverlap=function answerBodySegmentOverlap(e,x1,y1,x2,y2,r){
    const hit=baseEnemySegmentOverlapAnswer(e,x1,y1,x2,y2,r);if(e===runtime.boss&&hit&&e?.stageBodyShapes?.[0]?.points){const q=firstSegmentPolygonHit(x1,y1,x2,y2,e.stageBodyShapes[0].points);runtime.pendingImpact={x:q.x,y:q.y,targetId:e.id,at:performance.now()};}return hit;
  };

  // Keep the target damageable/targetable, but suppress ordinary boss AI and ordinary boss body rendering.
  const baseDealDamage=dealDamage;
  dealDamage=function answerDamageRouter(enemy,amount,opts={}){
    if(enemy!==runtime.boss)return baseDealDamage(enemy,amount,opts);
    if(runtime.defeating||!enemy||enemy.dead)return;
    const saved={x:enemy.x,y:enemy.y,r:enemy.r},pending=runtime.pendingImpact;runtime.pendingImpact=null;const impact=pending?.targetId===enemy.id&&performance.now()-pending.at<=450?pending:null;if(impact){enemy.x=impact.x;enemy.y=impact.y;enemy.r=18;runtime.lastImpactUsed={x:impact.x,y:impact.y,targetId:enemy.id,at:performance.now()};}
    let result;try{result=baseDealDamage(enemy,amount,{...opts,deferKill:true});}finally{enemy.x=saved.x;enemy.y=saved.y;enemy.r=saved.r;}
    if(enemy.hp<=0||enemy.dead){enemy.hp=0;enemy.dead=true;syncHudRatio();defeatCombat();return result;}
    enemy.dead=false;if(impact){enemy.hit=Math.max(Number(enemy.hit)||0,.18);runtime.hitPulse={x:impact.x,y:impact.y,age:0,strength:Math.max(.25,Math.min(1,Number(amount)/Math.max(1,enemy.maxHp)*18))};}syncHudRatio();phaseFromHp();return result;
  };
  const baseUpdateEnemies=updateEnemies;
  updateEnemies=function updateEnemiesWithoutAnswerBody(dt){const e=runtime.boss,arr=state.entities.enemies,i=e?arr.indexOf(e):-1;if(i<0)return baseUpdateEnemies(dt);arr.splice(i,1);try{return baseUpdateEnemies(dt);}finally{if(runtime.active&&!runtime.defeating&&!e.dead)arr.splice(Math.min(i,arr.length),0,e);}};
  const baseDrawEnemies=drawEnemies;
  drawEnemies=function drawEnemiesWithoutAnswerBody(){const e=runtime.boss,arr=state.entities.enemies,i=e?arr.indexOf(e):-1;if(i<0)return baseDrawEnemies();arr.splice(i,1);try{return baseDrawEnemies();}finally{if(runtime.active&&!runtime.defeating&&!e.dead)arr.splice(Math.min(i,arr.length),0,e);}};
  if(typeof registerPlayerUpdateInterceptor==='function')registerPlayerUpdateInterceptor('void-apex-answer-combat-v1',function answerCombatPlayerUpdate(next,dt){const before={x:player.x,y:player.y};const result=next(dt);updateCombat(Math.max(0,Number(dt)||0),before);return result;});

  const FISSURE_EDGES=[
    {phase:2,points:[[.392,.600],[.381,.592],[.371,.605],[.360,.596],[.348,.608]]},
    {phase:2,points:[[.608,.600],[.619,.589],[.631,.602],[.642,.593],[.653,.606]]},
    {phase:2,points:[[.420,.550],[.411,.535],[.400,.543],[.390,.529],[.379,.538]]},
    {phase:2,points:[[.580,.550],[.590,.534],[.601,.542],[.612,.527],[.623,.536]]},
    {phase:2,points:[[.462,.742],[.451,.730],[.440,.743],[.428,.735],[.416,.748]]},
    {phase:2,points:[[.538,.742],[.550,.728],[.561,.741],[.574,.732],[.586,.746]]},
    {phase:3,points:[[.348,.608],[.338,.596],[.327,.609],[.316,.600],[.305,.614]]},
    {phase:3,points:[[.653,.606],[.665,.595],[.676,.608],[.688,.598],[.699,.611]]},
    {phase:3,points:[[.379,.538],[.369,.524],[.358,.533],[.348,.519],[.337,.527]]},
    {phase:3,points:[[.623,.536],[.634,.522],[.645,.530],[.656,.516],[.667,.525]]},
    {phase:3,points:[[.416,.748],[.405,.760],[.394,.752],[.383,.766]]},
    {phase:3,points:[[.586,.746],[.598,.758],[.609,.750],[.621,.764]]},
    {phase:3,points:[[.371,.605],[.367,.621],[.357,.631]]},
    {phase:3,points:[[.631,.602],[.635,.618],[.646,.627]]},
    {phase:3,points:[[.440,.743],[.435,.719],[.426,.708]]},
    {phase:3,points:[[.561,.741],[.567,.718],[.576,.706]]}
  ];
  function fissureRootScreen(){return bodySourceToScreen(.50,.947);}
  function phaseFissureProgress(edge,index){if(runtime.phase>=edge.phase)return 1;if(runtime.transition?.to===edge.phase){const q=clamp01(runtime.transition.age/runtime.transition.duration),phaseIndex=index-(edge.phase===3?6:0),local=(q-.14-phaseIndex*.035)/.68;return clamp01(local);}return 0;}
  function fissureScreenPoints(points,progress){
    if(progress<=0)return[];const total=points.length-1,scaled=progress*total,out=[bodySourceToScreen(points[0][0],points[0][1])];
    for(let i=1;i<points.length;i++){const local=scaled-(i-1);if(local<=0)break;const a=points[i-1],b=points[i],q=Math.min(1,local);out.push(bodySourceToScreen(a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q));if(q<1)break;}return out;
  }
  function fissureRibbon(points,width,seed=0){
    const left=[],right=[];for(let i=0;i<points.length;i++){const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,w=width*(.78+.22*Math.sin(i*2.17+seed));left.push({x:points[i].x+nx*w,y:points[i].y+ny*w});right.push({x:points[i].x-nx*w,y:points[i].y-ny*w});}return left.concat(right.reverse());
  }
  function drawCrackEdge(edge,progress,intensity,index){
    if(progress<=0)return;const points=fissureScreenPoints(edge.points,progress);if(points.length<2)return;const scale=Math.max(.82,Math.min(1.30,(Number(vw)||1280)/1500)),body=bodyScreenPolygon();ctx.save();ctx.beginPath();ctx.moveTo(body[0].x,body[0].y);for(let i=1;i<body.length;i++)ctx.lineTo(body[i].x,body[i].y);ctx.closePath();ctx.clip();
    const lip=fissureRibbon(points,5.2*scale,index),groove=fissureRibbon(points,2.4*scale,index+1);ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(137,157,188,${Math.min(.24,.10*intensity)})`;ctx.beginPath();ctx.moveTo(lip[0].x,lip[0].y);for(let i=1;i<lip.length;i++)ctx.lineTo(lip[i].x,lip[i].y);ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(0,0,3,${Math.min(.92,.68+.08*intensity)})`;ctx.beginPath();ctx.moveTo(groove[0].x,groove[0].y);for(let i=1;i<groove.length;i++)ctx.lineTo(groove[i].x,groove[i].y);ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='screen';ctx.lineCap='butt';ctx.lineJoin='miter';ctx.shadowColor='rgba(221,233,255,.34)';ctx.shadowBlur=3*scale;ctx.strokeStyle=`rgba(232,239,251,${Math.min(.54,.30*intensity)})`;ctx.lineWidth=1.15*scale;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.stroke();ctx.shadowBlur=1.6*scale;ctx.strokeStyle=`rgba(255,255,255,${Math.min(.92,.61*intensity)})`;ctx.lineWidth=.58*scale;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);ctx.stroke();ctx.restore();
  }
  function drawCosmicMotion(){const poly=bodyScreenPolygon(),t=performance.now()*.001;ctx.save();ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.clip();ctx.globalCompositeOperation='screen';for(let i=0;i<30;i++){const seed=(i*97)%251,x=((i*173.3+t*(.34+(i%3)*.08)+seed)%(vw+100))-50,y=14+((i*71+seed*3)%Math.max(80,bodyFrame().visibleDepth-20)),pulse=.04+.035*(.5+.5*Math.sin(t*.45+i));ctx.globalAlpha=pulse;ctx.fillStyle=i%5===0?'#d8e6ff':'#ffffff';ctx.beginPath();ctx.arc(x,y,i%7===0?1.15:.65,0,Math.PI*2);ctx.fill();}ctx.restore();}
  function drawPhaseFissures(){const beam=runtime.major?.kind==='beam'?runtime.major:null,beamCharge=beam?beam.age<beam.warn?clamp01(beam.age/beam.warn):1:0,transitionGrowth=runtime.transition?clamp01(runtime.transition.age/runtime.transition.duration):0,intensity=1+beamCharge*.66+transitionGrowth*.18;FISSURE_EDGES.forEach((edge,index)=>drawCrackEdge(edge,phaseFissureProgress(edge,index),intensity,index));if(beamCharge>.01){const root=fissureRootScreen(),pulse=.5+.5*Math.sin(performance.now()*.010),radius=8+beamCharge*36;ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(root.x,root.y,0,root.x,root.y,radius);g.addColorStop(0,`rgba(255,255,255,${.20+beamCharge*.70})`);g.addColorStop(.30,`rgba(235,244,255,${.06+beamCharge*.28})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(root.x-radius,root.y-radius,radius*2,radius*2);ctx.fillStyle=`rgba(255,255,255,${.28+beamCharge*.68})`;ctx.beginPath();ctx.arc(root.x,root.y,1.8+beamCharge*3.2+pulse*.4,0,Math.PI*2);ctx.fill();ctx.restore();}}
  function drawSpikes(){
    const t=performance.now()*.001;
    for(const s of runtime.spikes){
      const a=s.age;
      if(a<s.warn){
        const p=clamp01(a/s.warn),dx=s.aim.x-s.origin.x,dy=s.aim.y-s.origin.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
        ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(210,217,232,'+(.08+p*.20)+')';ctx.shadowColor='rgba(226,235,250,.12)';ctx.shadowBlur=1+p*2;ctx.lineWidth=1.05+p*.28;
        ctx.beginPath();ctx.moveTo(s.origin.x,s.origin.y);ctx.quadraticCurveTo(s.origin.x+dx*.47-uy*6,s.origin.y+dy*.47+ux*6,s.aim.x,s.aim.y);ctx.stroke();
        const bud=spikePolygon(s,.025+.045*p);ctx.fillStyle='rgba(0,0,3,.86)';ctx.strokeStyle='rgba(125,112,144,'+(.16+p*.23)+')';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(bud[0].x,bud[0].y);for(let i=1;i<bud.length;i++)ctx.lineTo(bud[i].x,bud[i].y);ctx.closePath();ctx.fill();ctx.stroke();
        const glow=ctx.createRadialGradient(s.aim.x,s.aim.y,0,s.aim.x,s.aim.y,5+p*5);glow.addColorStop(0,'rgba(244,247,255,'+(.05+p*.12)+')');glow.addColorStop(1,'rgba(244,247,255,0)');ctx.fillStyle=glow;ctx.fillRect(s.aim.x-10,s.aim.y-10,20,20);
        ctx.restore();continue;
      }
      const elapsed=a-s.warn,total=s.thrust+s.hold+s.retract;if(elapsed>total)continue;
      let reach=elapsed<s.thrust?elapsed/s.thrust:elapsed<s.thrust+s.hold?1:1-(elapsed-s.thrust-s.hold)/s.retract;reach=clamp01(reach);
      const poly=spikePolygon(s,reach),tip={x:s.origin.x+(s.target.x-s.origin.x)*reach,y:s.origin.y+(s.target.y-s.origin.y)*reach},grad=ctx.createLinearGradient(s.origin.x,s.origin.y,tip.x,tip.y);
      grad.addColorStop(0,'#08050d');grad.addColorStop(.08,'#030207');grad.addColorStop(1,'#000000');ctx.save();ctx.shadowColor='rgba(0,0,0,.96)';ctx.shadowBlur=10;ctx.fillStyle=grad;ctx.strokeStyle='rgba(112,83,137,.54)';ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
      const dx=tip.x-s.origin.x,dy=tip.y-s.origin.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,nx=-uy,ny=ux;ctx.strokeStyle='rgba(77,54,96,.62)';ctx.lineWidth=1;
      for(const spec of[[.045,.56,.24],[.075,-.46,.34],[.10,.31,.45]]){const start=spec[0],side=spec[1],end=spec[2],rootWidth=24;ctx.beginPath();ctx.moveTo(s.origin.x+ux*d*start+nx*rootWidth*side,s.origin.y+uy*d*start+ny*rootWidth*side);ctx.quadraticCurveTo(s.origin.x+ux*d*((start+end)*.50)+nx*rootWidth*side*.34,s.origin.y+uy*d*((start+end)*.50)+ny*rootWidth*side*.34,s.origin.x+ux*d*end,s.origin.y+uy*d*end);ctx.stroke();}
      ctx.restore();
    }
  }
  function drawSplit(m){
    const line=m.line,strength=splitStrength(m),edges=splitTearEdges(line,m.age<m.warn?1.2:Math.max(.8,SPLIT_BAND_HALF*strength));
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(m.age<m.warn){
      const p=clamp01(m.age/m.warn),center=edges.a.map((point,i)=>({x:(point.x+edges.b[i].x)*.5,y:(point.y+edges.b[i].y)*.5}));
      ctx.strokeStyle='rgba(218,226,241,'+(.12+p*.40)+')';ctx.shadowColor='rgba(219,229,248,.18)';ctx.shadowBlur=1+p*3;ctx.lineWidth=.8+p*.55;ctx.beginPath();ctx.moveTo(center[0].x,center[0].y);for(let i=1;i<center.length;i++)ctx.lineTo(center[i].x,center[i].y);ctx.stroke();ctx.restore();return;
    }
    if(strength<=0){ctx.restore();return;}
    ctx.globalCompositeOperation='screen';ctx.strokeStyle='rgba(208,218,236,'+(.10+.15*strength)+')';ctx.lineWidth=.7+strength*.6;
    for(const edge of[edges.a,edges.b]){ctx.beginPath();ctx.moveTo(edge[0].x,edge[0].y);for(let i=1;i<edge.length;i++)ctx.lineTo(edge[i].x,edge[i].y);ctx.stroke();}
    const ux=edges.ux,uy=edges.uy,nx=edges.nx,ny=edges.ny,flowT=performance.now()*.00020;ctx.lineCap='round';
    for(let i=0;i<7;i++){const q=(i/7+flowT*(.52+(i%3)*.09))%1,along=(q-.5)*line.span,px=line.cx+ux*along,py=line.cy+uy*along,off=Math.sin(i*2.37+flowT*18)*SPLIT_BAND_HALF*strength*.32,len=4+(i%3)*2.2,bend=Math.cos(i*1.71+flowT*13)*2.4;ctx.strokeStyle='rgba(106,119,151,'+((.12+(i%3)*.03)*strength)+')';ctx.lineWidth=.7+(i%2)*.25;ctx.beginPath();ctx.moveTo(px-ux*len+nx*off,py-uy*len+ny*off);ctx.quadraticCurveTo(px+nx*(off+bend),py+ny*(off+bend),px+ux*len+nx*off,py+uy*len+ny*off);ctx.stroke();}
    ctx.restore();
  }
  function drawBeam(m){const root=fissureRootScreen(),x=root.x,start=root.y;if(m.age<m.warn){const p=clamp01(m.age/m.warn),pulse=.5+.5*Math.sin(performance.now()*.012);ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(238,246,255,${.008+p*.030})`;ctx.fillRect(x-m.width*.5,start,m.width,vh-start);ctx.strokeStyle=`rgba(238,244,255,${.18+p*.46})`;ctx.lineWidth=1;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(x+side*m.width*.5,start);ctx.lineTo(x+side*m.width*.5,vh);ctx.stroke();}ctx.strokeStyle=`rgba(255,255,255,${.38+p*.62})`;ctx.shadowColor='#ffffff';ctx.shadowBlur=8+p*18;ctx.lineWidth=1.3+p*2.1;ctx.beginPath();ctx.moveTo(x,start);ctx.lineTo(x,vh);ctx.stroke();const r=22+p*36+pulse*4,g=ctx.createRadialGradient(x,start,0,x,start,r);g.addColorStop(0,`rgba(255,255,255,${.38+p*.58})`);g.addColorStop(.32,`rgba(239,247,255,${.09+p*.23})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x-r,start-r,r*2,r*2);ctx.restore();return;}const e=m.age-m.warn,alpha=e<=m.active?1:1-clamp01((e-m.active)/m.fade);ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;const gx=ctx.createLinearGradient(x-m.width*.5,0,x+m.width*.5,0);gx.addColorStop(0,'rgba(220,236,255,.18)');gx.addColorStop(.10,'rgba(238,247,255,.72)');gx.addColorStop(.30,'rgba(255,255,255,.97)');gx.addColorStop(.50,'rgba(255,255,255,1)');gx.addColorStop(.70,'rgba(255,255,255,.97)');gx.addColorStop(.90,'rgba(238,247,255,.72)');gx.addColorStop(1,'rgba(220,236,255,.18)');ctx.shadowColor='#ffffff';ctx.shadowBlur=26;ctx.fillStyle=gx;ctx.fillRect(x-m.width*.5,start,m.width,vh-start);ctx.shadowBlur=10;ctx.fillStyle='rgba(255,255,255,1)';ctx.fillRect(x-m.width*.16,start,m.width*.32,vh-start);ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.58)';ctx.lineWidth=.9;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(x+side*m.width*.5,start);ctx.lineTo(x+side*m.width*.5,vh);ctx.stroke();}ctx.restore();}
  function drawRow(m){for(let i=0;i<m.count;i++){const fake=m.fake.has(i),crumbled=m.crumble.has(i);if(crumbled)continue;if(m.age<m.warn){const p=clamp01(m.age/m.warn),g=rowLaneGeometry(m,i,1),originX=g.dir>0?g.left+12:g.right-12;ctx.save();ctx.fillStyle=fake?`rgba(255,255,255,${.004+p*.010})`:`rgba(0,0,0,${.025+p*.055})`;ctx.strokeStyle=fake?`rgba(255,255,255,${.46+p*.43})`:`rgba(139,111,170,${.34+p*.44})`;ctx.shadowColor=fake?'rgba(255,255,255,.24)':'rgba(72,51,92,.30)';ctx.shadowBlur=fake?5:4;ctx.lineWidth=fake?1.65:1.35;ctx.setLineDash(fake?[10,8]:[5,11]);ctx.beginPath();ctx.moveTo(g.poly[0].x,g.poly[0].y);for(let j=1;j<g.poly.length;j++)ctx.lineTo(g.poly[j].x,g.poly[j].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=fake?`rgba(255,255,255,${.22+p*.36})`:`rgba(104,78,132,${.22+p*.30})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(g.dir>0?g.left:g.right,g.mid);ctx.lineTo(g.dir>0?g.right:g.left,g.mid);ctx.stroke();ctx.fillStyle=fake?'rgba(255,255,255,.74)':'rgba(4,3,7,.94)';ctx.strokeStyle=fake?'rgba(255,255,255,.92)':'rgba(148,115,177,.72)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(originX,g.mid,4.2+p*1.8,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();continue;}const elapsed=m.age-m.warn,reach=elapsed<m.active?clamp01(elapsed/.18):1,alpha=elapsed<=m.active?1:1-clamp01((elapsed-m.active)/m.fade),g=rowLaneGeometry(m,i,reach);ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor=fake?'rgba(245,249,255,.36)':'rgba(0,0,0,.95)';ctx.shadowBlur=fake?7:9;ctx.fillStyle=fake?'rgba(235,242,252,.34)':'#000000';ctx.strokeStyle=fake?'rgba(255,255,255,.94)':'rgba(148,112,179,.74)';ctx.lineWidth=fake?1.8:1.55;ctx.beginPath();ctx.moveTo(g.poly[0].x,g.poly[0].y);for(let j=1;j<g.poly.length;j++)ctx.lineTo(g.poly[j].x,g.poly[j].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;if(fake){ctx.strokeStyle='rgba(255,255,255,.56)';ctx.lineWidth=1.1;ctx.setLineDash([13,15]);for(const off of[-.13,.13]){ctx.beginPath();ctx.moveTo(g.dir>0?g.left:g.right,g.mid+(g.y1-g.y0)*off);ctx.lineTo(g.dir>0?g.right:g.left,g.mid+(g.y1-g.y0)*off*.45);ctx.stroke();}ctx.setLineDash([]);}else{ctx.strokeStyle='rgba(76,50,98,.78)';ctx.lineWidth=2.1;for(const off of[-.18,0,.17]){ctx.beginPath();ctx.moveTo(g.dir>0?g.left-14:g.right+14,g.mid+(g.y1-g.y0)*off);ctx.lineTo(g.dir>0?g.poly[6].x-28:g.poly[6].x+28,g.mid+(g.y1-g.y0)*off*.55);ctx.stroke();}}ctx.restore();}}
  function drawClone(c){
    const p=worldToScreen(c.x,c.y),f=c.family,warning=c.warn||0,active=c.active||.25,fade=c.fade||.2;
    const q=warning?clamp01(c.age/warning):1,alpha=c.age<warning?.24+.45*q:c.age<warning+active?1:1-clamp01((c.age-warning-active)/fade);
    if(alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#03040a';ctx.strokeStyle='rgba(221,229,243,.78)';ctx.lineWidth=1.35;ctx.lineJoin='round';ctx.lineCap='round';
    const spear=(scale,color='rgba(228,235,247,.86)')=>{ctx.fillStyle='#020308';ctx.beginPath();ctx.moveTo(c.r*2.1*scale,0);ctx.lineTo(-c.r*1.15*scale,-c.r*.76*scale);ctx.lineTo(-c.r*.42*scale,0);ctx.lineTo(-c.r*1.15*scale,c.r*.76*scale);ctx.closePath();ctx.fill();ctx.strokeStyle=color;ctx.stroke();};
    const hex=(x,y,r)=>{ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();};
    if(['bolt','ember','comet','missile'].includes(f)){
      ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(c.vy,c.vx));const scale=f==='comet'||f==='missile'?1.35:f==='ember'?1.05:1;
      ctx.shadowColor='rgba(227,235,248,.35)';ctx.shadowBlur=f==='comet'?8:4;ctx.strokeStyle='rgba(226,234,247,.70)';ctx.lineWidth=1.1;
      if(f==='bolt'){spear(scale);ctx.beginPath();ctx.arc(0,0,c.r*.42,0,Math.PI*2);ctx.stroke();}
      else if(f==='ember'){spear(scale,'rgba(255,211,187,.92)');for(let i=0;i<3;i++){ctx.globalAlpha=alpha*(.68-i*.16);ctx.beginPath();ctx.arc(-c.r*(1.65+i*.85),0,c.r*(.46-i*.08),0,Math.PI*2);ctx.fill();ctx.stroke();}}
      else if(f==='comet'){ctx.beginPath();ctx.moveTo(-c.r*4.2,0);ctx.lineTo(-c.r*.35,-c.r*.60);ctx.lineTo(c.r*1.95,0);ctx.lineTo(-c.r*.35,c.r*.60);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-c.r*.55,-c.r*.43);ctx.lineTo(-c.r*4.1,-c.r*.12);ctx.moveTo(-c.r*.55,c.r*.43);ctx.lineTo(-c.r*3.6,c.r*.16);ctx.stroke();}
      else{for(let i=-1;i<=1;i++){ctx.save();ctx.translate(-c.r*.25, i*c.r*.60);ctx.rotate(i*.15);spear(.77,'rgba(255,221,184,.88)');ctx.restore();}}
      ctx.restore();return;
    }
    if(['prism','rail','ion','gate'].includes(f)){
      const x2=p.x+Math.cos(c.a)*c.length,y2=p.y+Math.sin(c.a)*c.length,nx=-Math.sin(c.a),ny=Math.cos(c.a),on=c.age>=warning,beamAlpha=on?c.age<warning+active?1:1-clamp01((c.age-warning-active)/fade):.45;
      ctx.globalAlpha*=beamAlpha;ctx.globalCompositeOperation='screen';
      ctx.strokeStyle=on?'rgba(2,3,9,.90)':'rgba(216,227,244,.58)';ctx.lineWidth=on?c.width:1.35;
      if(f==='rail'){for(const off of[-1,1]){ctx.beginPath();ctx.moveTo(p.x+nx*off*c.width*.42,p.y+ny*off*c.width*.42);ctx.lineTo(x2+nx*off*c.width*.42,y2+ny*off*c.width*.42);ctx.stroke();}ctx.strokeStyle='rgba(218,228,243,.42)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(x2,y2);ctx.stroke();}
      else if(f==='ion'){const n=15;ctx.lineWidth=on?Math.max(2,c.width*.27):1.1;ctx.beginPath();ctx.moveTo(p.x,p.y);for(let i=1;i<=n;i++){const q=i/n,off=i===n?0:Math.sin(i*12.7+c.age*16)*8*(on?1:.35);ctx.lineTo(p.x+(x2-p.x)*q+nx*off,p.y+(y2-p.y)*q+ny*off);}ctx.stroke();ctx.strokeStyle='rgba(226,238,255,.66)';ctx.lineWidth=.7;ctx.stroke();}
      else{ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(x2,y2);ctx.stroke();if(f==='prism'){for(const q of[.22,.5,.78]){const x=p.x+(x2-p.x)*q,y=p.y+(y2-p.y)*q;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.strokeStyle='rgba(233,240,250,.82)';ctx.lineWidth=1;ctx.strokeRect(-5,-5,10,10);ctx.restore();}}if(f==='gate'){for(const pt of[[p.x,p.y],[x2,y2]]){hex(pt[0],pt[1],13);ctx.strokeStyle='rgba(209,221,244,.82)';ctx.lineWidth=1.4;ctx.stroke();ctx.beginPath();ctx.arc(pt[0],pt[1],7,0,Math.PI*2);ctx.stroke();}}}
      if(on&&f!=='gate'){ctx.strokeStyle='rgba(236,242,251,.40)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(x2,y2);ctx.stroke();}
      ctx.restore();return;
    }
    if(['well','slow','nova','vacuum','mine','bulwark'].includes(f)){
      const on=c.age>=warning,progress=on?clamp01((c.age-warning)/Math.max(.15,active*.40)):q,r=c.r*(on?(.76+.24*Math.sin(progress*Math.PI)):(.46+.28*q));
      ctx.translate(p.x,p.y);ctx.rotate(c.angle||0);ctx.globalCompositeOperation='screen';ctx.shadowColor='rgba(215,225,242,.22)';ctx.shadowBlur=on?5:2;
      if(f==='mine'){ctx.rotate(Math.PI/4);ctx.fillStyle='#03040a';ctx.strokeRect(-r*.16,-r*.16,r*.32,r*.32);for(const sign of[-1,1]){ctx.beginPath();ctx.moveTo(sign*r*.16,0);ctx.lineTo(sign*r*.52,-r*.11);ctx.moveTo(0,sign*r*.16);ctx.lineTo(-r*.11,sign*r*.52);ctx.stroke();}}
      else if(f==='bulwark'){hex(0,0,r);ctx.strokeStyle='rgba(198,215,241,.84)';ctx.lineWidth=2;ctx.stroke();hex(0,0,r*.77);ctx.lineWidth=.8;ctx.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.77,Math.sin(a)*r*.77);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
      else if(f==='vacuum'){for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.ellipse(0,-r*.53,r*.18,r*.46,0,0,Math.PI*2);ctx.stroke();ctx.restore();}ctx.beginPath();ctx.arc(0,0,r*.22,0,Math.PI*2);ctx.fill();ctx.stroke();}
      else if(f==='nova'){for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r*(.36+i*.23),0,Math.PI*2);ctx.stroke();}ctx.fillStyle='#020308';ctx.beginPath();ctx.arc(0,0,r*.18,0,Math.PI*2);ctx.fill();ctx.stroke();}
      else{for(let i=0;i<(f==='well'?3:2);i++){ctx.beginPath();ctx.arc(0,0,r*(.36+i*.27),i*.35,Math.PI*1.72+i*.35);ctx.stroke();}if(f==='well'){ctx.beginPath();ctx.arc(0,0,r*.13,0,Math.PI*2);ctx.fill();ctx.stroke();}else{ctx.beginPath();ctx.arc(0,0,r*.84,0,Math.PI*2);ctx.setLineDash([5,8]);ctx.lineDashOffset=-performance.now()*.008;ctx.stroke();ctx.setLineDash([]);}}
      ctx.restore();return;
    }
    if(['blade','arc','spiral','mirror'].includes(f)){
      if(c.age<warning){ctx.translate(p.x,p.y);ctx.strokeStyle='rgba(212,225,241,.45)';ctx.beginPath();ctx.arc(0,0,c.radius,0,Math.PI*2);ctx.stroke();ctx.restore();return;}
      for(let i=0;i<c.count;i++){
        const a=c.angle+i*Math.PI*2/c.count,rr=c.radius*(f==='spiral'?.72+.28*Math.sin(c.age*5+i):1),x=p.x+Math.cos(a)*rr,y=p.y+Math.sin(a)*rr;
        ctx.save();ctx.translate(x,y);ctx.rotate(a+(f==='arc'?c.age*1.2:0));ctx.fillStyle='#020308';ctx.strokeStyle='rgba(222,231,245,.84)';
        if(f==='blade'){ctx.beginPath();ctx.moveTo(18,0);ctx.quadraticCurveTo(-1,-12,-13,-4);ctx.quadraticCurveTo(-5,0,-13,4);ctx.quadraticCurveTo(4,9,18,0);ctx.closePath();ctx.fill();ctx.stroke();}
        else if(f==='arc'){ctx.beginPath();ctx.arc(0,0,15,-1.15,1.15);ctx.arc(0,0,8,1.05,-1.05,true);ctx.closePath();ctx.fill();ctx.stroke();}
        else if(f==='spiral'){ctx.beginPath();for(let n=0;n<26;n++){const t=n/25*2.8*Math.PI,rad=1+n*.36;const px=Math.cos(t)*rad,py=Math.sin(t)*rad;n?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();}
        else{ctx.rotate(Math.PI/4);ctx.strokeRect(-8,-8,16,16);ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(13,0);ctx.moveTo(0,-13);ctx.lineTo(0,13);ctx.stroke();}
        ctx.restore();
      }
      ctx.restore();return;
    }
    if(f==='drone'){
      ctx.translate(p.x,p.y);ctx.rotate(c.angle||0);hex(0,0,14);ctx.fillStyle='#020308';ctx.fill();ctx.strokeStyle='rgba(225,234,247,.86)';ctx.stroke();for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(side*24,-7);ctx.lineTo(side*20,0);ctx.lineTo(side*24,7);ctx.closePath();ctx.stroke();}ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fillStyle='rgba(232,240,250,.84)';ctx.fill();ctx.restore();
    }
  }
  function drawHitPulse(){const hit=runtime.hitPulse;if(!hit)return;const p=worldToScreen(hit.x,hit.y),q=clamp01(hit.age/.24),alpha=(1-q)*hit.strength;ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;const r=4+q*13,g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*1.8);g.addColorStop(0,'rgba(255,255,255,.34)');g.addColorStop(.34,'rgba(217,231,252,.17)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(p.x-r*2,p.y-r*2,r*4,r*4);ctx.strokeStyle='rgba(246,249,255,'+(.62*(1-q))+')';ctx.lineWidth=.8+q*.5;ctx.beginPath();ctx.arc(p.x,p.y,r*.58,0,Math.PI*2);ctx.stroke();for(let i=0;i<3;i++){const a=i*Math.PI*2/3+hit.x*.013,reach=r*(.8+(i%2)*.35);ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*r*.72,p.y+Math.sin(a)*r*.72);ctx.lineTo(p.x+Math.cos(a)*reach,p.y+Math.sin(a)*reach);ctx.stroke();}ctx.restore();}
  function drawCombatOverlay(){if(!runtime.active)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);drawCosmicMotion();drawPhaseFissures();drawHitPulse();drawSpikes();if(runtime.major){if(runtime.major.kind==='split')drawSplit(runtime.major);else if(runtime.major.kind==='beam')drawBeam(runtime.major);else if(runtime.major.kind==='row')drawRow(runtime.major);}for(const c of runtime.clones)drawClone(c);ctx.restore();}
  const baseDraw=draw;
  draw=function drawWithAnswerCombat(){const result=baseDraw();drawCombatOverlay();return result;};

  function forcePhase(phase){phase=Math.max(1,Math.min(3,Math.floor(Number(phase)||1)));if(!answerActive())return false;if(!runtime.active)beginCombat();runtime.transition=null;runtime.phase=phase;runtime.defeating=false;clearPatterns();resetTimers(phase);const ratio=phase===1?1:phase===2?.74:.29;if(runtime.boss){runtime.boss.dead=false;runtime.boss.hp=runtime.boss.maxHp*ratio;}window.stackfallSetAnswerPrototypePhase?.(phase,true);window.stackfallSetAnswerPrototypeHpRatio?.(ratio);return true;}
  function forcePattern(kind){if(!runtime.active||runtime.defeating)return false;if(kind==='spike'){runtime.spikes.length=0;startSpikes();return true;}if(kind==='clone'){if(runtime.phase<3)forcePhase(3);return startClone();}if(kind==='beam'&&runtime.phase<2)forcePhase(2);if(kind==='row'&&runtime.phase<2)forcePhase(2);runtime.major=null;runtime.majorRecovery=0;return startMajor(kind);}
  window.stackfallAnswerCombatForcePhase=forcePhase;
  window.stackfallAnswerCombatForcePattern=forcePattern;
  window.stackfallAnswerCombatDefeat=defeatCombat;
  window.stackfallAnswerPatternDiagnostics=()=>({majorRecovery:runtime.majorRecovery,cloneWaiting:runtime.cloneWaiting,cloneDelay:runtime.cloneDelay,cloneOwned:cloneableKeys(),damage:{...DAMAGE},major:runtime.major?{kind:runtime.major.kind,age:runtime.major.age,warn:runtime.major.warn,active:runtime.major.active,fade:runtime.major.fade,width:runtime.major.width??null,ratio:runtime.major.line?.ratio??null,line:runtime.major.line?{cx:runtime.major.line.cx,cy:runtime.major.line.cy,a:runtime.major.line.a}:null,bandHalf:runtime.major.kind==='split'?SPLIT_BAND_HALF:null,impact:runtime.major.impact??runtime.major.hit??false,side:runtime.major.side??null,count:runtime.major.count??null,fakeCount:runtime.major.fake?.size??null,fakeIndices:runtime.major.fake?[...runtime.major.fake]:null,crumbled:runtime.major.crumble?[...runtime.major.crumble]:null}:null,hitPulse:runtime.hitPulse?{x:runtime.hitPulse.x,y:runtime.hitPulse.y,age:runtime.hitPulse.age}:null});
  window.stackfallAnswerCombatDiagnostics=()=>({version:'v2',active:runtime.active,defeating:runtime.defeating,phase:runtime.phase,hpRatio:runtime.boss?clamp01(runtime.boss.hp/runtime.boss.maxHp):0,boss:runtime.boss?{hp:runtime.boss.hp,maxHp:runtime.boss.maxHp,damage:runtime.boss.damage,r:runtime.boss.r}:null,transition:runtime.transition?{...runtime.transition}:null,spikes:runtime.spikes.length,spikeDetails:runtime.spikes.map(s=>({age:s.age,warn:s.warn,thrust:s.thrust,hold:s.hold,retract:s.retract,origin:{...s.origin},aim:{...s.aim},target:{...s.target}})),bodyTarget:runtime.bodyTarget?{...runtime.bodyTarget}:null,lastImpactUsed:runtime.lastImpactUsed?{...runtime.lastImpactUsed}:null,bodyPolygonScreen:bodyScreenPolygon().map(p=>({x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10})),fissureRoot:fissureRootScreen(),major:runtime.major?.kind||null,majorDetails:runtime.major?{kind:runtime.major.kind,age:runtime.major.age,warn:runtime.major.warn,active:runtime.major.active,fade:runtime.major.fade}:null,majorCd:{...runtime.majorCd},cloneCd:runtime.cloneCd,clones:runtime.clones.map(c=>({key:c.key,family:c.family,age:c.age})),lastClone:runtime.lastClone,globalApexMultipliers:{hp:APEX_HP_MULT,damage:APEX_DAMAGE_MULT},answerForm:{hp:ANSWER_HP_FORM,damage:ANSWER_DAMAGE_FORM},thresholds:{phase2:PHASE_2_HP,phase3:PHASE_3_HP}});
})();
