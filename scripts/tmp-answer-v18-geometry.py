from pathlib import Path
import re

ROOT=Path('.')
combat_path=ROOT/'src/void-apex-answer-combat-v1.js'
answer_path=ROOT/'src/void-apex-answer-v1.js'
contract_path=ROOT/'scripts/void-apex-answer-contract.mjs'
fingerprint_path=ROOT/'scripts/build-fingerprint.mjs'

combat=combat_path.read_text()
answer=answer_path.read_text()
contract=contract_path.read_text()
fingerprint=fingerprint_path.read_text()

def sub(text, pattern, repl, label, flags=re.S):
    out,n=re.subn(pattern,repl,text,count=1,flags=flags)
    if n!=1:
        raise SystemExit(f'{label}: expected 1 replacement, got {n}')
    return out

combat=combat.replace("if(window.stackfallVoidApexAnswerCombat==='v1')return;\n  window.stackfallVoidApexAnswerCombat='v1';","if(window.stackfallVoidApexAnswerCombat==='v2')return;\n  window.stackfallVoidApexAnswerCombat='v2';")
if "window.stackfallVoidApexAnswerCombat='v2'" not in combat:
    raise SystemExit('combat version patch failed')

geometry_block=r'''  const BODY_SOURCE_W=960,BODY_SOURCE_H=280;
  // Traced from the alpha silhouette of the approved Answer raster. Rendering, targeting and weapon hits share this contour.
  const BODY_UNDERSIDE_SRC=[[0,114],[29,144],[59,162],[89,182],[119,193],[149,194],[179,209],[209,227],[239,235],[269,235],[299,235],[329,239],[359,246],[389,244],[419,244],[449,250],[479,265],[509,250],[539,236],[569,237],[599,244],[629,247],[659,237],[689,239],[719,243],[749,232],[779,215],[809,204],[839,189],[869,177],[899,157],[929,125],[959,108]];
  function bodyFrame(){
    const f=frame();if(Number.isFinite(f.x)&&Number.isFinite(f.y)&&Number.isFinite(f.w)&&Number.isFinite(f.h))return f;
    const width=Math.max(720,Number(vw)||1280),height=Math.max(520,Number(vh)||720),ratio=BODY_SOURCE_W/BODY_SOURCE_H,w=Math.max(width*1.14,height*2.05),h=w/ratio,visibleDepth=Math.max(245,Math.min(330,height*.34));
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
    const r=clamp01(reach),fdx=s.target.x-s.origin.x,fdy=s.target.y-s.origin.y,fullD=Math.hypot(fdx,fdy)||1,ux=fdx/fullD,uy=fdy/fullD,nx=-uy,ny=ux,d=fullD*r,seed=Number(s.seed)||0,root=24+Math.min(18,fullD*.018),profile=[[0,1.02],[.08,1.16],[.20,.92],[.34,1.00],[.50,.74],[.66,.58],[.80,.40],[.91,.22],[1,0]];
    const edge=(entry,side)=>{const [t,widthScale]=entry,wobble=(Math.sin(t*19.7+seed*4.1+side*1.7)*.10+Math.sin(t*8.3-seed*2.4)*.06),w=root*widthScale*(1+wobble*side);return{x:s.origin.x+ux*d*t+nx*w*side,y:s.origin.y+uy*d*t+ny*w*side};};
    const left=profile.map(entry=>edge(entry,1)),right=profile.slice(0,-1).reverse().map(entry=>edge(entry,-1));return left.concat(right);
  }
  function nearestPointOnSegment(px,py,a,b){const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/l2));return{x:a.x+dx*t,y:a.y+dy*t};}
  function nearestPointOnPolygon(px,py,poly){let best=null,bd=Infinity;for(let i=0;i<poly.length;i++){const q=nearestPointOnSegment(px,py,poly[i],poly[(i+1)%poly.length]),d=(q.x-px)**2+(q.y-py)**2;if(d<bd){bd=d;best=q;}}return best||{x:px,y:py};}
  function segmentIntersectionPoint(a,b,c,d){const r={x:b.x-a.x,y:b.y-a.y},s={x:d.x-c.x,y:d.y-c.y},den=r.x*s.y-r.y*s.x;if(Math.abs(den)<1e-8)return null;const q={x:c.x-a.x,y:c.y-a.y},t=(q.x*s.y-q.y*s.x)/den,u=(q.x*r.y-q.y*r.x)/den;return t>=0&&t<=1&&u>=0&&u<=1?{x:a.x+r.x*t,y:a.y+r.y*t,t}:null;}
  function firstSegmentPolygonHit(x1,y1,x2,y2,poly){let best=null;const a={x:x1,y:y1},b={x:x2,y:y2};for(let i=0;i<poly.length;i++){const hit=segmentIntersectionPoint(a,b,poly[i],poly[(i+1)%poly.length]);if(hit&&(!best||hit.t<best.t))best=hit;}return best||nearestPointOnPolygon(x2,y2,poly);}
  const SPLIT_BAND_HALF=12;
  const signedLine=(x,y,line)=>{const nx=-Math.sin(line.a),ny=Math.cos(line.a);return(x-line.cx)*nx+(y-line.cy)*ny;};
'''
combat=sub(combat,r"  function spikePolygon\(s,reach=1\)\{.*?\n  const SPLIT_BAND_HALF=12;\n  const signedLine=.*?;\n  const bodyOrigin=.*?;\n",geometry_block,'geometry block')

combat=combat.replace("const f=frame(),c=camera(),screenY=Math.max(82,f.visibleDepth*.66),target=screenToWorld(vw*.5,screenY),r=Math.min(420,Math.max(230,vw*.27));","const f=frame(),c=camera(),screenY=Math.max(82,f.visibleDepth*.66),target=screenToWorld(vw*.5,screenY),r=18;")
if "r=18;" not in combat:
    raise SystemExit('boss radius patch failed')

start_spikes=r'''  function startSpikes(){
    const count=runtime.phase,ps=playerScreen(),left=vw*.075,right=vw*.925,top=Math.max(frame().visibleDepth+52,vh*.42),bottom=vh*.89,offsets=count===1?[0]:count===2?[-105,105]:[-150,0,150];
    runtime.spikes=offsets.map((off,i)=>{const aim={x:Math.max(left,Math.min(right,ps.x+off+rand(-26,26))),y:Math.max(top,Math.min(bottom,ps.y+rand(-24,24)))},rootX=Math.max(vw*.035,Math.min(vw*.965,aim.x+rand(-88,88))),surface=bodySurfaceScreenPoint(rootX),origin={x:surface.x-surface.nx*11,y:surface.y-surface.ny*11},target=rayArenaEnd(origin,aim);return{origin,target,aim,surface,age:0,warn:1.4,thrust:.14,hold:.35,retract:.18,hit:false,index:i,seed:rand(-1,1)};});
    runtime.spikeCd=TIMING.spike+rand(-.5,.5);
  }
'''
combat=sub(combat,r"  function startSpikes\(\)\{.*?\n  \}\n  function updateSpikes",start_spikes+"  function updateSpikes",'start spikes')

combat=combat.replace("if(m.age>=m.warn&&m.age<m.warn+m.active&&!m.hit){const ps=playerScreen();if(Math.abs(ps.x-vw*.5)<=m.width*.5+player.r){m.hit=true;hitPlayer(DAMAGE.beam);state.camera.shake=Math.max(Number(state.camera.shake)||0,6.2);}}","if(m.age>=m.warn&&m.age<m.warn+m.active&&!m.hit){const ps=playerScreen(),root=fissureRootScreen();if(Math.abs(ps.x-root.x)<=m.width*.5+player.r){m.hit=true;hitPlayer(DAMAGE.beam);state.camera.shake=Math.max(Number(state.camera.shake)||0,6.2);}}")
if "root=fissureRootScreen()" not in combat:
    raise SystemExit('beam collision root patch failed')

combat=combat.replace("const e=runtime.boss;if(e){const target=screenToWorld(vw*.5,Math.max(82,frame().visibleDepth*.66));e.x=target.x;e.y=target.y;e.speed=0;e.contactSafeUntil=1e12;}","const e=runtime.boss;if(e)syncBossBodyGeometry(e);")
if "if(e)syncBossBodyGeometry(e);" not in combat:
    raise SystemExit('boss geometry sync patch failed')

collision_hooks=r'''  const baseEnemyCircleOverlapAnswer=enemyCircleOverlap;
  enemyCircleOverlap=function answerBodyCircleOverlap(e,x,y,r){
    const hit=baseEnemyCircleOverlapAnswer(e,x,y,r);if(e===runtime.boss&&hit&&e?.stageBodyShapes?.[0]?.points){const q=nearestPointOnPolygon(x,y,e.stageBodyShapes[0].points);runtime.pendingImpact={x:q.x,y:q.y};}return hit;
  };
  const baseEnemySegmentOverlapAnswer=enemySegmentOverlap;
  enemySegmentOverlap=function answerBodySegmentOverlap(e,x1,y1,x2,y2,r){
    const hit=baseEnemySegmentOverlapAnswer(e,x1,y1,x2,y2,r);if(e===runtime.boss&&hit&&e?.stageBodyShapes?.[0]?.points){const q=firstSegmentPolygonHit(x1,y1,x2,y2,e.stageBodyShapes[0].points);runtime.pendingImpact={x:q.x,y:q.y};}return hit;
  };

'''
combat=combat.replace("  // Keep the target damageable/targetable, but suppress ordinary boss AI and ordinary boss body rendering.\n",collision_hooks+"  // Keep the target damageable/targetable, but suppress ordinary boss AI and ordinary boss body rendering.\n")
if "answerBodyCircleOverlap" not in combat:
    raise SystemExit('collision hook insert failed')

new_damage_router=r'''  const baseDealDamage=dealDamage;
  dealDamage=function answerDamageRouter(enemy,amount,opts={}){
    if(enemy!==runtime.boss)return baseDealDamage(enemy,amount,opts);
    if(runtime.defeating||!enemy||enemy.dead)return;
    const saved={x:enemy.x,y:enemy.y,r:enemy.r},impact=runtime.pendingImpact;runtime.pendingImpact=null;if(impact){enemy.x=impact.x;enemy.y=impact.y;enemy.r=18;}
    let result;try{result=baseDealDamage(enemy,amount,{...opts,deferKill:true});}finally{enemy.x=saved.x;enemy.y=saved.y;enemy.r=saved.r;}
    if(enemy.hp<=0||enemy.dead){enemy.hp=0;enemy.dead=true;syncHudRatio();defeatCombat();return result;}
    enemy.dead=false;syncHudRatio();phaseFromHp();return result;
  };
'''
combat=sub(combat,r"  const baseDealDamage=dealDamage;\n  dealDamage=function answerDamageRouter\(enemy,amount,opts=\{\}\)\{.*?\n  \};\n",new_damage_router,'damage router')

fissure_block=r'''  const FISSURE_EDGES=[
    {phase:1,major:true,points:[[.50,.10],[.492,.22],[.508,.34],[.488,.47],[.503,.60],[.497,.75],[.50,.947]]},
    {phase:1,points:[[.505,.34],[.462,.31],[.420,.265],[.370,.205]]},{phase:1,points:[[.500,.41],[.546,.355],[.590,.292],[.642,.215]]},
    {phase:1,points:[[.462,.31],[.434,.235],[.405,.175]]},{phase:1,points:[[.546,.355],[.566,.255],[.595,.165]]},
    {phase:2,points:[[.420,.265],[.355,.305],[.292,.365],[.242,.435]]},{phase:2,points:[[.590,.292],[.658,.325],[.718,.382],[.770,.448]]},
    {phase:2,points:[[.493,.565],[.454,.615],[.405,.675],[.352,.725]]},{phase:2,points:[[.503,.602],[.552,.648],[.605,.704],[.655,.748]]},
    {phase:2,points:[[.355,.305],[.330,.235],[.300,.190]]},{phase:2,points:[[.658,.325],[.686,.250],[.720,.205]]},
    {phase:3,points:[[.242,.435],[.194,.485],[.150,.545]]},{phase:3,points:[[.770,.448],[.818,.500],[.864,.558]]},
    {phase:3,points:[[.405,.675],[.370,.735],[.330,.790]]},{phase:3,points:[[.605,.704],[.640,.755],[.690,.802]]},
    {phase:3,points:[[.454,.615],[.430,.535],[.392,.490]]},{phase:3,points:[[.552,.648],[.580,.565],[.620,.515]]},
    {phase:3,points:[[.300,.190],[.270,.145],[.235,.120]]},{phase:3,points:[[.720,.205],[.755,.155],[.795,.125]]}
  ];
  function fissureRootScreen(){return bodySourceToScreen(.50,.947);}
  function phaseFissureProgress(edge,index){if(edge.phase===1)return 1;if(runtime.phase>=edge.phase)return 1;if(runtime.transition?.to===edge.phase){const q=clamp01(runtime.transition.age/runtime.transition.duration),local=(q-.10-index*.018)/.72;return clamp01(local);}return 0;}
  function traceFissure(points,progress){if(progress<=0)return false;const total=points.length-1,scaled=progress*total,p0=bodySourceToScreen(points[0][0],points[0][1]);ctx.beginPath();ctx.moveTo(p0.x,p0.y);for(let i=1;i<points.length;i++){const local=scaled-(i-1);if(local<=0)break;const a=points[i-1],b=points[i],q=Math.min(1,local),p=bodySourceToScreen(a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q);ctx.lineTo(p.x,p.y);if(q<1)break;}return true;}
  function drawCrackEdge(edge,progress,intensity){if(progress<=0)return;const scale=Math.max(.82,Math.min(1.35,(Number(vw)||1280)/1500)),major=edge.major?1.22:1;ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='rgba(225,235,255,.72)';ctx.shadowBlur=13*scale*intensity;ctx.strokeStyle=`rgba(158,180,224,${.14*intensity})`;ctx.lineWidth=7.2*scale*major;if(traceFissure(edge.points,progress))ctx.stroke();ctx.shadowBlur=7*scale*intensity;ctx.strokeStyle=`rgba(225,233,247,${Math.min(.90,.63*intensity)})`;ctx.lineWidth=3.1*scale*major;if(traceFissure(edge.points,progress))ctx.stroke();ctx.shadowBlur=3.5*scale;ctx.strokeStyle=`rgba(255,255,255,${Math.min(1,.92*intensity)})`;ctx.lineWidth=1.18*scale*major;if(traceFissure(edge.points,progress))ctx.stroke();ctx.restore();}
  function drawCosmicMotion(){const poly=bodyScreenPolygon(),t=performance.now()*.001;ctx.save();ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.clip();ctx.globalCompositeOperation='screen';for(let i=0;i<30;i++){const seed=(i*97)%251,x=((i*173.3+t*(.34+(i%3)*.08)+seed)%(vw+100))-50,y=14+((i*71+seed*3)%Math.max(80,bodyFrame().visibleDepth-20)),pulse=.04+.035*(.5+.5*Math.sin(t*.45+i));ctx.globalAlpha=pulse;ctx.fillStyle=i%5===0?'#d8e6ff':'#ffffff';ctx.beginPath();ctx.arc(x,y,i%7===0?1.15:.65,0,Math.PI*2);ctx.fill();}ctx.restore();}
  function drawPhaseFissures(){const beam=runtime.major?.kind==='beam'?runtime.major:null,beamCharge=beam?beam.age<beam.warn?clamp01(beam.age/beam.warn):1:0,transitionGlow=runtime.transition?Math.sin(clamp01(runtime.transition.age/runtime.transition.duration)*Math.PI):0,intensity=.92+beamCharge*.72+transitionGlow*.34;FISSURE_EDGES.forEach((edge,index)=>drawCrackEdge(edge,phaseFissureProgress(edge,index),intensity));const root=fissureRootScreen(),pulse=.5+.5*Math.sin(performance.now()*.010),radius=10+beamCharge*34+transitionGlow*10;ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(root.x,root.y,0,root.x,root.y,radius);g.addColorStop(0,`rgba(255,255,255,${.32+beamCharge*.58})`);g.addColorStop(.30,`rgba(235,244,255,${.12+beamCharge*.30})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(root.x-radius,root.y-radius,radius*2,radius*2);if(beamCharge>.02){ctx.fillStyle=`rgba(255,255,255,${.35+beamCharge*.55})`;ctx.beginPath();ctx.arc(root.x,root.y,2.2+beamCharge*2.8+pulse*.5,0,Math.PI*2);ctx.fill();}ctx.restore();}
'''
combat=sub(combat,r"  const P2_CRACKS=.*?\n  function drawPhaseFissures\(\)\{.*?\}\n",fissure_block,'fissure renderer')

spike_draw=r'''  function drawSpikes(){const t=performance.now()*.001;for(const s of runtime.spikes){const a=s.age;if(a<s.warn){const p=clamp01(a/s.warn),ghost=spikePolygon(s,1),root=s.surface||bodySurfaceScreenPoint(s.origin.x);ctx.save();ctx.fillStyle=`rgba(4,2,8,${.055+p*.075})`;ctx.strokeStyle=`rgba(219,222,232,${.30+p*.48})`;ctx.shadowColor=`rgba(221,225,238,${.08+p*.14})`;ctx.shadowBlur=3+p*4;ctx.lineWidth=1.15;ctx.setLineDash([7,9]);ctx.beginPath();ctx.moveTo(ghost[0].x,ghost[0].y);for(let i=1;i<ghost.length;i++)ctx.lineTo(ghost[i].x,ghost[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(0,0,0,.74)';ctx.shadowColor='rgba(45,27,60,.55)';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(root.x,root.y,8+p*5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=`rgba(248,249,255,${.42+p*.46})`;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(s.aim.x,s.aim.y,10+(1-p)*5+Math.sin(t*8+s.index)*1.2,0,Math.PI*2);ctx.stroke();ctx.restore();continue;}const elapsed=a-s.warn,total=s.thrust+s.hold+s.retract;if(elapsed>total)continue;let reach=elapsed<s.thrust?elapsed/s.thrust:elapsed<s.thrust+s.hold?1:1-(elapsed-s.thrust-s.hold)/s.retract;reach=clamp01(reach);const poly=spikePolygon(s,reach),tip={x:s.origin.x+(s.target.x-s.origin.x)*reach,y:s.origin.y+(s.target.y-s.origin.y)*reach},grad=ctx.createLinearGradient(s.origin.x,s.origin.y,tip.x,tip.y);grad.addColorStop(0,'#08050d');grad.addColorStop(.20,'#030207');grad.addColorStop(1,'#000000');ctx.save();ctx.shadowColor='rgba(0,0,0,.96)';ctx.shadowBlur=12;ctx.fillStyle=grad;ctx.strokeStyle='rgba(119,91,143,.56)';ctx.lineWidth=1.45;ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;const dx=tip.x-s.origin.x,dy=tip.y-s.origin.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,nx=-uy,ny=ux;ctx.strokeStyle='rgba(84,61,105,.58)';ctx.lineWidth=1.15;for(const spec of[[.08,.58,.62],[.13,-.48,.76],[.05,.24,.46]]){const start=spec[0],side=spec[1],end=spec[2],rootWidth=26;ctx.beginPath();ctx.moveTo(s.origin.x+ux*d*start+nx*rootWidth*side,s.origin.y+uy*d*start+ny*rootWidth*side);ctx.quadraticCurveTo(s.origin.x+ux*d*((start+end)*.48)+nx*rootWidth*side*.45,s.origin.y+uy*d*((start+end)*.48)+ny*rootWidth*side*.45,s.origin.x+ux*d*end,s.origin.y+uy*d*end);ctx.stroke();}ctx.fillStyle='#000';ctx.strokeStyle='rgba(101,75,124,.40)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.origin.x,s.origin.y,12+reach*4,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}}
'''
combat=sub(combat,r"  function drawSpikes\(\)\{.*?\n  function drawSplit\(m\)",spike_draw+"  function drawSplit(m)",'spike renderer')

beam_draw=r'''  function drawBeam(m){const root=fissureRootScreen(),x=root.x,start=root.y;if(m.age<m.warn){const p=clamp01(m.age/m.warn),pulse=.5+.5*Math.sin(performance.now()*.012);ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(238,246,255,${.010+p*.042})`;ctx.fillRect(x-m.width*.5,start,m.width,vh-start);ctx.strokeStyle=`rgba(238,244,255,${.14+p*.42})`;ctx.lineWidth=1;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(x+side*m.width*.5,start);ctx.lineTo(x+side*m.width*.5,vh);ctx.stroke();}ctx.strokeStyle=`rgba(255,255,255,${.38+p*.62})`;ctx.shadowColor='#ffffff';ctx.shadowBlur=8+p*18;ctx.lineWidth=1.4+p*2.4;ctx.beginPath();ctx.moveTo(x,start);ctx.lineTo(x,vh);ctx.stroke();const r=24+p*34+pulse*4,g=ctx.createRadialGradient(x,start,0,x,start,r);g.addColorStop(0,`rgba(255,255,255,${.38+p*.56})`);g.addColorStop(.34,`rgba(239,247,255,${.10+p*.24})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x-r,start-r,r*2,r*2);ctx.restore();return;}const e=m.age-m.warn,alpha=e<=m.active?1:1-clamp01((e-m.active)/m.fade);ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;ctx.shadowColor='#ffffff';ctx.shadowBlur=34;ctx.fillStyle='rgba(244,249,255,.24)';ctx.fillRect(x-m.width*.5-13,start,m.width+26,vh-start);ctx.fillStyle='#ffffff';ctx.fillRect(x-m.width*.5,start,m.width,vh-start);ctx.shadowBlur=13;ctx.fillStyle='rgba(255,255,255,1)';ctx.fillRect(x-m.width*.18,start,m.width*.36,vh-start);ctx.restore();}
'''
combat=sub(combat,r"  function drawBeam\(m\)\{.*?\n  function drawRow\(m\)",beam_draw+"  function drawRow(m)",'beam renderer')

combat=combat.replace("window.stackfallAnswerCombatDiagnostics=()=>({version:'v1'","window.stackfallAnswerCombatDiagnostics=()=>({version:'v2'")
combat=combat.replace("spikes:runtime.spikes.length,spikeDetails:runtime.spikes.map(s=>({age:s.age,warn:s.warn,thrust:s.thrust,hold:s.hold,retract:s.retract}))","spikes:runtime.spikes.length,spikeDetails:runtime.spikes.map(s=>({age:s.age,warn:s.warn,thrust:s.thrust,hold:s.hold,retract:s.retract,origin:{...s.origin},aim:{...s.aim},target:{...s.target}})),bodyTarget:runtime.bodyTarget?{...runtime.bodyTarget}:null,bodyPolygonScreen:bodyScreenPolygon().map(p=>({x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10})),fissureRoot:fissureRootScreen()")
if "bodyPolygonScreen" not in combat:
    raise SystemExit('diagnostics geometry patch failed')

answer=answer.replace("window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v17';","window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v18';")
answer=answer.replace("// V16 visual lock: approved near-black cosmic body and its current natural fissures are baked together.\n  // Until phase-specific art is available, P1-P3 intentionally share this exact raster; phase growth is rendered as additional fissures.","// V18 visual lock: preserve the approved near-black cosmic body raster.\n  // One combat-layer fissure tree reinforces P1 and owns all P2-P3 growth so phase transitions and beam origin stay coherent.")
if "VISUAL_REVISION='v18'" not in answer:
    raise SystemExit('visual revision patch failed')

if "'assets/answer/answer_body_v16.b64'" not in fingerprint:
    fingerprint=fingerprint.replace("'src/combat-integrity-v1.js','src/endless-pressure-rewards-v1.js','src/void-apex-answer-v1.js','src/void-apex-answer-combat-v1.js'","'src/combat-integrity-v1.js','src/endless-pressure-rewards-v1.js','src/void-apex-answer-v1.js','src/void-apex-answer-combat-v1.js','assets/answer/answer_body_v16.b64'")
if "'assets/answer/answer_body_v16.b64'" not in fingerprint:
    raise SystemExit('fingerprint asset patch failed')

contract=contract.replace("['Answer V17 preserves the approved baked dark-cosmic raster',answer.includes(\"STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v17'\")","['Answer V18 preserves the approved baked dark-cosmic raster while geometry is traced independently',answer.includes(\"STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v18'\")")
contract=contract.replace("['P1-P3 share one baked body with no legacy procedural fissure owner in the visual shell',!answer.includes('const FISSURES=')&&!answer.includes('drawAnswerFissures')&&!answer.includes('strokeScreenFissure')&&answer.includes('Math.min(3')&&!answer.includes(\"button('P4 · 응답'\")],","['P1-P3 preserve one approved body while one canonical combat fissure tree reinforces P1 and owns phase growth',!answer.includes('const FISSURES=')&&!answer.includes('drawAnswerFissures')&&!answer.includes('strokeScreenFissure')&&combat.includes('const FISSURE_EDGES=')&&combat.includes('phase:1,major:true')&&combat.includes('phaseFissureProgress')&&answer.includes('Math.min(3')&&!answer.includes(\"button('P4 · 응답'\")],")
contract=contract.replace("['body remains fixed while combat layer owns internal-cosmos and fissure motion',answer.includes('const frame=base')&&!answer.includes('bob=Math.sin')&&!answer.includes('drift=Math.sin')&&combat.includes('function drawCosmicMotion()')&&combat.includes('function drawPhaseFissures()')],","['body remains fixed while combat layer owns clipped internal-cosmos and unified fissure motion',answer.includes('const frame=base')&&!answer.includes('bob=Math.sin')&&!answer.includes('drift=Math.sin')&&combat.includes('function drawCosmicMotion()')&&combat.includes('bodyScreenPolygon()')&&combat.includes('function drawPhaseFissures()')],")
contract=contract.replace("['build fingerprint tracks both prototype sources and contract without a mutable binary body asset',fingerprint.includes(\"'src/void-apex-answer-v1.js'\")&&fingerprint.includes(\"'src/void-apex-answer-combat-v1.js'\")&&fingerprint.includes(\"'void-apex-answer-contract.mjs'\")&&!fingerprint.includes(\"'assets/answer/answer_body_base.webp'\")]","['build fingerprint tracks both prototype sources contract and fetched Answer raster',fingerprint.includes(\"'src/void-apex-answer-v1.js'\")&&fingerprint.includes(\"'src/void-apex-answer-combat-v1.js'\")&&fingerprint.includes(\"'void-apex-answer-contract.mjs'\")&&fingerprint.includes(\"'assets/answer/answer_body_v16.b64'\")]" )
contract=contract.replace("['targeted black spikes escalate one two three with readable exact-shape warning and matching hit geometry',combat.includes('const count=runtime.phase')&&combat.includes('warn:1.4')&&combat.includes('TIMING={spike:5.8')&&combat.includes('offsets=count===1?[0]:count===2?[-105,105]:[-150,0,150]')&&combat.includes('function spikePolygon')&&combat.includes('circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),poly)')&&combat.includes('ghost=spikePolygon(s,1)')&&!combat.includes('player.r+15')],","['targeted black spikes escalate one two three use traced body origins and extend through the arena with exact warning geometry',combat.includes('const count=runtime.phase')&&combat.includes('warn:1.4')&&combat.includes('TIMING={spike:5.8')&&combat.includes('offsets=count===1?[0]:count===2?[-105,105]:[-150,0,150]')&&combat.includes('bodySurfaceScreenPoint(rootX)')&&combat.includes('rayArenaEnd(origin,aim)')&&combat.includes('function spikePolygon')&&combat.includes('circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),poly)')&&combat.includes('ghost=spikePolygon(s,1)')],")
contract=contract.replace("['P2 adds pure-white center beam and horizontal true-fake spike lanes with shared render-hit geometry',combat.includes(\"kind==='beam'&&runtime.phase>=2\")&&combat.includes(\"ctx.fillStyle='#ffffff'\")","['P2 adds a pure-white fissure-root beam and horizontal true-fake spike lanes with shared render-hit geometry',combat.includes(\"kind==='beam'&&runtime.phase>=2\")&&combat.includes('fissureRootScreen()')&&combat.includes(\"ctx.fillStyle='#ffffff'\")")
needle="  ['P2 adds a pure-white fissure-root beam and horizontal true-fake spike lanes with shared render-hit geometry'"
if needle in contract and "traced body polygon owns Answer targeting" not in contract:
    contract=contract.replace(needle,"  ['traced body polygon owns Answer weapon collision targeting and impact placement',combat.includes('const BODY_UNDERSIDE_SRC=')&&combat.includes('e.stageBodyShapes=[{kind:\'polygon\',points}]')&&combat.includes('answerBodyCircleOverlap')&&combat.includes('answerBodySegmentOverlap')&&combat.includes('runtime.pendingImpact')&&combat.includes('syncBossBodyGeometry(e)')],\n"+needle)

for label,text in [('combat',combat),('answer',answer),('contract',contract),('fingerprint',fingerprint)]:
    if not text.strip(): raise SystemExit(f'{label} unexpectedly empty')

combat_path.write_text(combat)
answer_path.write_text(answer)
contract_path.write_text(contract)
fingerprint_path.write_text(fingerprint)
print('patched Answer V18 geometry, spikes, fissures and beam origin')
