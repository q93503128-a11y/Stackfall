from pathlib import Path
import re

combat_path=Path('src/void-apex-answer-combat-v1.js')
contract_path=Path('scripts/void-apex-answer-contract.mjs')
combat=combat_path.read_text(encoding='utf-8')
contract=contract_path.read_text(encoding='utf-8')

# Shared geometry helpers: all Answer spike hazards should test the same polygons they render.
needle="  const signedLine=(x,y,line)=>{const nx=-Math.sin(line.a),ny=Math.cos(line.a);return(x-line.cx)*nx+(y-line.cy)*ny;};"
insert="""  const hazardPlayerRadius=()=>Math.max(6,Math.min(9,(Number(player?.r)||14)*.55));
  function pointInPoly(px,py,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],cross=((a.y>py)!==(b.y>py))&&(px<(b.x-a.x)*(py-a.y)/((b.y-a.y)||1e-9)+a.x);if(cross)inside=!inside;}return inside;}
  function circleHitsPoly(px,py,r,poly){if(pointInPoly(px,py,poly))return true;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(segDist(px,py,a.x,a.y,b.x,b.y)<=r)return true;}return false;}
  function spikePolygon(s,reach=1){const ex=s.origin.x+(s.target.x-s.origin.x)*reach,ey=s.origin.y+(s.target.y-s.origin.y)*reach,dx=ex-s.origin.x,dy=ey-s.origin.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,w=12+reach*8,half=w*.45;return[{x:s.origin.x+nx*half,y:s.origin.y+ny*half},{x:ex,y:ey},{x:s.origin.x-nx*half,y:s.origin.y-ny*half}];}
  const SPLIT_BAND_HALF=12;
  const signedLine=(x,y,line)=>{const nx=-Math.sin(line.a),ny=Math.cos(line.a);return(x-line.cx)*nx+(y-line.cy)*ny;};"""
if needle not in combat: raise SystemExit('helper insertion anchor not found')
combat=combat.replace(needle,insert,1)

old="if(segDist(ps.x,ps.y,s.origin.x,s.origin.y,ex,ey)<=player.r+15){s.hit=true;hitPlayer(DAMAGE.spike);}"
new="const poly=spikePolygon(s,travel);if(circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),poly)){s.hit=true;hitPlayer(DAMAGE.spike);}"
if old not in combat: raise SystemExit('basic spike collision anchor not found')
combat=combat.replace(old,new,1)

# Tighten split barrier to the visible fissure instead of using the full player radius as invisible padding.
combat=combat.replace("margin=player.r+12", "margin=SPLIT_BAND_HALF+hazardPlayerRadius()", 1)
combat=combat.replace("<=player.r+12)hitPlayer(DAMAGE.split)", "<=SPLIT_BAND_HALF+hazardPlayerRadius())hitPlayer(DAMAGE.split)", 1)

# Horizontal true/fake spike wall. Four lanes in P2, five in P3, two fake lanes.
old_row_init="else if(kind==='row'&&runtime.phase>=2){const count=runtime.phase>=3?5:4,indices=[0,1,2,3,4].slice(0,count),fake=[];while(fake.length<2){const i=indices[Math.floor(Math.random()*indices.length)];if(!fake.includes(i))fake.push(i);}runtime.major={kind,age:0,warn:2.3,active:.65,fade:.25,count,fake:new Set(fake),crumble:new Set(),hit:false};}"
new_row_init="else if(kind==='row'&&runtime.phase>=2){const count=runtime.phase>=3?5:4,indices=[0,1,2,3,4].slice(0,count),fake=[];while(fake.length<2){const i=indices[Math.floor(Math.random()*indices.length)];if(!fake.includes(i))fake.push(i);}runtime.major={kind,axis:'horizontal',age:0,warn:2.3,active:.65,fade:.25,count,fake:new Set(fake),crumble:new Set(),directions:Array.from({length:count},(_,i)=>i%2===0?1:-1),hit:false};}"
if old_row_init not in combat: raise SystemExit('row init anchor not found')
combat=combat.replace(old_row_init,new_row_init,1)

# Add row geometry helper before updateMajor.
anchor="  function updateMajor(dt){\n"
row_helper="""  function rowLaneGeometry(m,index,reach=1){
    const top=Math.max(frame().visibleDepth+26,vh*.405),bottom=vh*.925,laneH=(bottom-top)/m.count,y0=top+index*laneH+2,y1=top+(index+1)*laneH-2,mid=(y0+y1)*.5,left=vw*.045,right=vw*.955,dir=m.directions?.[index]||1,span=right-left,tip=dir>0?left+span*clamp01(reach):right-span*clamp01(reach),rear=dir>0?left-36:right+36,neck=dir>0?tip-22:tip+22;
    const poly=dir>0?[{x:rear,y:y0},{x:neck,y:y0},{x:tip,y:mid},{x:neck,y:y1},{x:rear,y:y1}]:[{x:rear,y:y0},{x:neck,y:y0},{x:tip,y:mid},{x:neck,y:y1},{x:rear,y:y1}];
    return{top,bottom,laneH,y0,y1,mid,left,right,dir,poly};
  }
  function updateMajor(dt){
"""
if anchor not in combat: raise SystemExit('updateMajor anchor not found')
combat=combat.replace(anchor,row_helper,1)

old_row_update="if(m.age>=m.warn&&m.age<m.warn+m.active){const ps=playerScreen(),left=vw*.07,right=vw*.93,w=(right-left)/m.count,index=Math.max(0,Math.min(m.count-1,Math.floor((ps.x-left)/w)));if(m.fake.has(index)){if(!m.crumble.has(index)){m.crumble.add(index);const wp=screenToWorld(left+(index+.5)*w,ps.y);try{spawnParticle(wp.x,wp.y,'#ffffff',14,150,3.2);}catch{}}}else if(!m.hit&&ps.x>=left&&ps.x<=right){m.hit=true;hitPlayer(DAMAGE.row);}}"
new_row_update="if(m.age>=m.warn&&m.age<m.warn+m.active){const ps=playerScreen(),reach=clamp01((m.age-m.warn)/.18);for(let i=0;i<m.count;i++){if(m.crumble.has(i))continue;const g=rowLaneGeometry(m,i,reach);if(!circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),g.poly))continue;if(m.fake.has(i)){m.crumble.add(i);const wp=screenToWorld(ps.x,ps.y);try{spawnParticle(wp.x,wp.y,'#ffffff',18,170,3.4);}catch{}}else if(!m.hit){m.hit=true;hitPlayer(DAMAGE.row);}break;}}"
if old_row_update not in combat: raise SystemExit('row update anchor not found')
combat=combat.replace(old_row_update,new_row_update,1)

# Replace spike renderer with exact-polygon warning and exact-polygon active rendering.
pattern=r"  function drawSpikes\(\)\{.*?\n  function drawSplit\(m\)\{"
replacement="""  function drawSpikes(){const t=performance.now()*.001;for(const s of runtime.spikes){const a=s.age;if(a<s.warn){const p=clamp01(a/s.warn),ghost=spikePolygon(s,1);ctx.save();ctx.fillStyle=`rgba(8,8,12,${.10+p*.10})`;ctx.strokeStyle=`rgba(230,233,242,${.28+p*.48})`;ctx.lineWidth=1.25;ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(ghost[0].x,ghost[0].y);for(let i=1;i<ghost.length;i++)ctx.lineTo(ghost[i].x,ghost[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=`rgba(245,247,252,${.38+p*.54})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(s.target.x,s.target.y,12+(1-p)*7+Math.sin(t*8+s.index)*1.5,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(245,247,252,${.22+p*.42})`;ctx.beginPath();ctx.arc(s.target.x,s.target.y,2.2+p*1.8,0,Math.PI*2);ctx.fill();ctx.restore();continue;}const elapsed=a-s.warn,total=s.thrust+s.hold+s.retract;if(elapsed>total)continue;let reach=elapsed<s.thrust?elapsed/s.thrust:elapsed<s.thrust+s.hold?1:1-(elapsed-s.thrust-s.hold)/s.retract;reach=clamp01(reach);const poly=spikePolygon(s,reach);ctx.save();ctx.fillStyle='#000000';ctx.strokeStyle='rgba(205,210,225,.30)';ctx.lineWidth=1.15;ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}
  function drawSplit(m){"""
combat,n=re.subn(pattern,replacement,combat,flags=re.S)
if n!=1: raise SystemExit(f'drawSpikes replacement count {n}')

# Share split-band constant with renderer and add a faint visible spill so collision never feels wider than the art.
combat=combat.replace("nx=-uy,ny=ux,band=12;ctx.save();", "nx=-uy,ny=ux,band=SPLIT_BAND_HALF;ctx.save();", 1)
combat=combat.replace("ctx.globalAlpha=alpha;ctx.strokeStyle='#000000';ctx.lineWidth=band*2;", "ctx.globalAlpha=alpha;ctx.strokeStyle='rgba(0,0,0,.42)';ctx.lineWidth=(band+4)*2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle='#000000';ctx.lineWidth=band*2;", 1)

# Replace vertical column renderer with horizontal lane renderer using exactly the same polygons as collision.
pattern=r"  function drawRow\(m\)\{.*?\n  function drawClone\(c\)\{"
replacement="""  function drawRow(m){for(let i=0;i<m.count;i++){const fake=m.fake.has(i),crumbled=m.crumble.has(i);if(crumbled)continue;if(m.age<m.warn){const p=clamp01(m.age/m.warn),g=rowLaneGeometry(m,i,1);ctx.save();ctx.globalAlpha=.28+p*.60;ctx.fillStyle=fake?'rgba(255,255,255,.16)':'rgba(0,0,0,.46)';ctx.strokeStyle=fake?'rgba(255,255,255,.98)':'rgba(176,162,202,.70)';ctx.lineWidth=fake?2.4:1.55;ctx.setLineDash(fake?[8,5]:[5,8]);ctx.beginPath();ctx.moveTo(g.poly[0].x,g.poly[0].y);for(let j=1;j<g.poly.length;j++)ctx.lineTo(g.poly[j].x,g.poly[j].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);if(fake){ctx.fillStyle='rgba(255,255,255,.78)';ctx.beginPath();ctx.arc(g.dir>0?g.left+24:g.right-24,g.mid,4,0,Math.PI*2);ctx.fill();}ctx.restore();continue;}const elapsed=m.age-m.warn,reach=elapsed<m.active?clamp01(elapsed/.18):1,alpha=elapsed<=m.active?1:1-clamp01((elapsed-m.active)/m.fade),g=rowLaneGeometry(m,i,reach);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=fake?'rgba(255,255,255,.90)':'#000000';ctx.strokeStyle=fake?'#ffffff':'rgba(190,184,205,.34)';ctx.lineWidth=fake?2.2:1.25;ctx.beginPath();ctx.moveTo(g.poly[0].x,g.poly[0].y);for(let j=1;j<g.poly.length;j++)ctx.lineTo(g.poly[j].x,g.poly[j].y);ctx.closePath();ctx.fill();ctx.stroke();if(!fake){ctx.strokeStyle='rgba(96,82,118,.24)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(g.dir>0?g.left-12:g.right+12,g.mid);ctx.lineTo(g.dir>0?g.poly[2].x-18:g.poly[2].x+18,g.mid);ctx.stroke();}ctx.restore();}}
  function drawClone(c){"""
combat,n=re.subn(pattern,replacement,combat,flags=re.S)
if n!=1: raise SystemExit(f'drawRow replacement count {n}')

# Contract: lock visual/collision parity, readable warning, horizontal fake/real rows, and tightened split barrier.
contract=contract.replace(
"['targeted black spikes escalate one two three with locked warning',combat.includes('const count=runtime.phase')&&combat.includes('warn:1.4')&&combat.includes('TIMING={spike:5.8')&&combat.includes('offsets=count===1?[0]:count===2?[-105,105]:[-150,0,150]')],",
"['targeted black spikes escalate one two three with readable exact-shape warning and matching hit geometry',combat.includes('const count=runtime.phase')&&combat.includes('warn:1.4')&&combat.includes('TIMING={spike:5.8')&&combat.includes('offsets=count===1?[0]:count===2?[-105,105]:[-150,0,150]')&&combat.includes('function spikePolygon')&&combat.includes('circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),poly)')&&combat.includes('ghost=spikePolygon(s,1)')&&!combat.includes('player.r+15')],",
1)
contract=contract.replace(
"['space split has long warning one-shot cut damage non-damaging barrier and flowing black matter',combat.includes(\"kind==='split'\")&&combat.includes('warn:3.4,active:4.0,fade:.8')&&combat.includes('if(!m.impact&&m.age>=m.warn)')&&combat.includes('applySplitCollision(m)')&&combat.includes(\"ctx.strokeStyle='#000000'\")&&combat.includes('lineDashOffset=-flow')],",
"['space split has long warning one-shot cut damage a visible-matched non-damaging barrier and flowing black matter',combat.includes(\"kind==='split'\")&&combat.includes('warn:3.4,active:4.0,fade:.8')&&combat.includes('SPLIT_BAND_HALF+hazardPlayerRadius()')&&combat.includes('applySplitCollision(m)')&&combat.includes(\"ctx.strokeStyle='#000000'\")&&combat.includes('lineDashOffset=-flow')],",
1)
contract=contract.replace(
"['P2 adds pure-white center beam and readable true-fake spike row',combat.includes(\"kind==='beam'&&runtime.phase>=2\")&&combat.includes(\"ctx.fillStyle='#ffffff'\")&&combat.includes(\"kind==='row'&&runtime.phase>=2\")&&combat.includes('const count=runtime.phase>=3?5:4')&&combat.includes('while(fake.length<2)')],",
"['P2 adds pure-white center beam and horizontal true-fake spike lanes with shared render-hit geometry',combat.includes(\"kind==='beam'&&runtime.phase>=2\")&&combat.includes(\"ctx.fillStyle='#ffffff'\")&&combat.includes(\"kind==='row'&&runtime.phase>=2\")&&combat.includes(\"axis:'horizontal'\")&&combat.includes('const count=runtime.phase>=3?5:4')&&combat.includes('while(fake.length<2)')&&combat.includes('function rowLaneGeometry')&&combat.includes('circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),g.poly)')],",
1)

combat_path.write_text(combat,encoding='utf-8')
contract_path.write_text(contract,encoding='utf-8')
print('patched Answer hazard geometry')
