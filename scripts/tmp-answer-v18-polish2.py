from pathlib import Path
import re

combat_path=Path('src/void-apex-answer-combat-v1.js')
answer_path=Path('src/void-apex-answer-v1.js')
contract_path=Path('scripts/void-apex-answer-contract.mjs')
combat=combat_path.read_text()
answer=answer_path.read_text()
contract=contract_path.read_text()

def sub(text,pattern,repl,label):
    out,n=re.subn(pattern,repl,text,count=1,flags=re.S)
    if n!=1: raise SystemExit(f'{label}: expected 1, got {n}')
    return out

# Rapid taper: broad irregular root -> narrow long tendril, not a black slab.
old="profile=[[0,1.02],[.08,1.16],[.20,.92],[.34,1.00],[.50,.74],[.66,.58],[.80,.40],[.91,.22],[1,0]]"
new="profile=[[0,1.10],[.04,1.24],[.10,.78],[.18,.56],[.28,.43],[.40,.32],[.55,.23],[.70,.15],[.84,.09],[.94,.04],[1,0]]"
if old not in combat: raise SystemExit('spike profile anchor missing')
combat=combat.replace(old,new)
combat=combat.replace("wobble=(Math.sin(t*19.7+seed*4.1+side*1.7)*.10+Math.sin(t*8.3-seed*2.4)*.06)","wobble=(Math.sin(t*23.7+seed*4.1+side*1.7)*.16+Math.sin(t*11.3-seed*2.4)*.09)")

# Use the approved baked P1 fissure as the baseline. Dynamic growth only continues from its visible endpoints.
fissures=r'''  const FISSURE_EDGES=[
    {phase:2,points:[[.392,.600],[.370,.585],[.348,.607],[.325,.592],[.302,.620]]},
    {phase:2,points:[[.608,.600],[.630,.584],[.653,.606],[.677,.590],[.700,.618]]},
    {phase:2,points:[[.420,.550],[.402,.527],[.381,.540],[.360,.515],[.338,.532]]},
    {phase:2,points:[[.580,.550],[.598,.526],[.619,.540],[.641,.514],[.663,.531]]},
    {phase:2,points:[[.462,.742],[.442,.724],[.423,.746],[.401,.731],[.382,.754]]},
    {phase:2,points:[[.538,.742],[.558,.723],[.578,.746],[.600,.730],[.620,.753]]},
    {phase:3,points:[[.302,.620],[.282,.599],[.260,.616],[.238,.595]]},
    {phase:3,points:[[.700,.618],[.720,.598],[.742,.615],[.764,.594]]},
    {phase:3,points:[[.338,.532],[.318,.507],[.298,.523],[.280,.498]]},
    {phase:3,points:[[.663,.531],[.683,.506],[.703,.522],[.722,.497]]},
    {phase:3,points:[[.382,.754],[.362,.775],[.341,.760],[.320,.782]]},
    {phase:3,points:[[.620,.753],[.640,.775],[.661,.759],[.682,.781]]},
    {phase:3,points:[[.442,.724],[.425,.690],[.405,.701],[.389,.674]]},
    {phase:3,points:[[.558,.723],[.576,.689],[.596,.700],[.613,.673]]}
  ];
  function fissureRootScreen(){return bodySourceToScreen(.50,.947);}
  function phaseFissureProgress(edge,index){if(runtime.phase>=edge.phase)return 1;if(runtime.transition?.to===edge.phase){const q=clamp01(runtime.transition.age/runtime.transition.duration),phaseIndex=index-(edge.phase===3?6:0),local=(q-.14-phaseIndex*.035)/.68;return clamp01(local);}return 0;}
  function traceFissure(points,progress){if(progress<=0)return false;const total=points.length-1,scaled=progress*total,p0=bodySourceToScreen(points[0][0],points[0][1]);ctx.beginPath();ctx.moveTo(p0.x,p0.y);for(let i=1;i<points.length;i++){const local=scaled-(i-1);if(local<=0)break;const a=points[i-1],b=points[i],q=Math.min(1,local),p=bodySourceToScreen(a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q);ctx.lineTo(p.x,p.y);if(q<1)break;}return true;}
  function drawCrackEdge(edge,progress,intensity){if(progress<=0)return;const scale=Math.max(.82,Math.min(1.30,(Number(vw)||1280)/1500));ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalCompositeOperation='source-over';ctx.strokeStyle=`rgba(0,0,3,${.48+.12*Math.min(1,intensity)})`;ctx.lineWidth=4.2*scale;if(traceFissure(edge.points,progress))ctx.stroke();ctx.globalCompositeOperation='screen';ctx.shadowColor='rgba(220,232,255,.45)';ctx.shadowBlur=5*scale*intensity;ctx.strokeStyle=`rgba(172,191,225,${Math.min(.24,.11*intensity)})`;ctx.lineWidth=3.7*scale;if(traceFissure(edge.points,progress))ctx.stroke();ctx.shadowBlur=3*scale;ctx.strokeStyle=`rgba(226,234,248,${Math.min(.72,.47*intensity)})`;ctx.lineWidth=1.75*scale;if(traceFissure(edge.points,progress))ctx.stroke();ctx.shadowBlur=1.8*scale;ctx.strokeStyle=`rgba(255,255,255,${Math.min(1,.82*intensity)})`;ctx.lineWidth=.72*scale;if(traceFissure(edge.points,progress))ctx.stroke();ctx.restore();}
  function drawCosmicMotion(){const poly=bodyScreenPolygon(),t=performance.now()*.001;ctx.save();ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.clip();ctx.globalCompositeOperation='screen';for(let i=0;i<30;i++){const seed=(i*97)%251,x=((i*173.3+t*(.34+(i%3)*.08)+seed)%(vw+100))-50,y=14+((i*71+seed*3)%Math.max(80,bodyFrame().visibleDepth-20)),pulse=.04+.035*(.5+.5*Math.sin(t*.45+i));ctx.globalAlpha=pulse;ctx.fillStyle=i%5===0?'#d8e6ff':'#ffffff';ctx.beginPath();ctx.arc(x,y,i%7===0?1.15:.65,0,Math.PI*2);ctx.fill();}ctx.restore();}
  function drawPhaseFissures(){const beam=runtime.major?.kind==='beam'?runtime.major:null,beamCharge=beam?beam.age<beam.warn?clamp01(beam.age/beam.warn):1:0,transitionGlow=runtime.transition?Math.sin(clamp01(runtime.transition.age/runtime.transition.duration)*Math.PI):0,intensity=1+beamCharge*.66+transitionGlow*.42;FISSURE_EDGES.forEach((edge,index)=>drawCrackEdge(edge,phaseFissureProgress(edge,index),intensity));const root=fissureRootScreen(),pulse=.5+.5*Math.sin(performance.now()*.010),radius=8+beamCharge*36+transitionGlow*12;if(beamCharge>.01||transitionGlow>.01){ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(root.x,root.y,0,root.x,root.y,radius);g.addColorStop(0,`rgba(255,255,255,${.20+beamCharge*.70+transitionGlow*.20})`);g.addColorStop(.30,`rgba(235,244,255,${.06+beamCharge*.28+transitionGlow*.08})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(root.x-radius,root.y-radius,radius*2,radius*2);ctx.fillStyle=`rgba(255,255,255,${.28+beamCharge*.68})`;ctx.beginPath();ctx.arc(root.x,root.y,1.8+beamCharge*3.2+pulse*.4,0,Math.PI*2);ctx.fill();ctx.restore();}}
'''
combat=sub(combat,r"  const FISSURE_EDGES=\[.*?\n  function drawSpikes\(\)",fissures+"  function drawSpikes()",'fissure block')

# Replace spike renderer: exact full-shape warning, short forming tendril at the root, no circular plugs.
spikes=r'''  function drawSpikes(){const t=performance.now()*.001;for(const s of runtime.spikes){const a=s.age;if(a<s.warn){const p=clamp01(a/s.warn),ghost=spikePolygon(s,1),bud=spikePolygon(s,.06+.07*p);ctx.save();ctx.fillStyle=`rgba(4,2,8,${.025+p*.035})`;ctx.strokeStyle=`rgba(224,226,235,${.28+p*.48})`;ctx.shadowColor=`rgba(223,226,238,${.06+p*.12})`;ctx.shadowBlur=2+p*3;ctx.lineWidth=1.05;ctx.setLineDash([7,10]);ctx.beginPath();ctx.moveTo(ghost[0].x,ghost[0].y);for(let i=1;i<ghost.length;i++)ctx.lineTo(ghost[i].x,ghost[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(0,0,2,.88)';ctx.strokeStyle='rgba(102,75,124,.42)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bud[0].x,bud[0].y);for(let i=1;i<bud.length;i++)ctx.lineTo(bud[i].x,bud[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle=`rgba(248,249,255,${.38+p*.44})`;ctx.lineWidth=1.15;ctx.beginPath();ctx.arc(s.aim.x,s.aim.y,9+(1-p)*5+Math.sin(t*8+s.index)*1.1,0,Math.PI*2);ctx.stroke();ctx.restore();continue;}const elapsed=a-s.warn,total=s.thrust+s.hold+s.retract;if(elapsed>total)continue;let reach=elapsed<s.thrust?elapsed/s.thrust:elapsed<s.thrust+s.hold?1:1-(elapsed-s.thrust-s.hold)/s.retract;reach=clamp01(reach);const poly=spikePolygon(s,reach),tip={x:s.origin.x+(s.target.x-s.origin.x)*reach,y:s.origin.y+(s.target.y-s.origin.y)*reach},grad=ctx.createLinearGradient(s.origin.x,s.origin.y,tip.x,tip.y);grad.addColorStop(0,'#08050d');grad.addColorStop(.08,'#030207');grad.addColorStop(1,'#000000');ctx.save();ctx.shadowColor='rgba(0,0,0,.96)';ctx.shadowBlur=10;ctx.fillStyle=grad;ctx.strokeStyle='rgba(112,83,137,.54)';ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;const dx=tip.x-s.origin.x,dy=tip.y-s.origin.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,nx=-uy,ny=ux;ctx.strokeStyle='rgba(77,54,96,.62)';ctx.lineWidth=1;for(const spec of[[.045,.56,.24],[.075,-.46,.34],[.10,.31,.45]]){const start=spec[0],side=spec[1],end=spec[2],rootWidth=24;ctx.beginPath();ctx.moveTo(s.origin.x+ux*d*start+nx*rootWidth*side,s.origin.y+uy*d*start+ny*rootWidth*side);ctx.quadraticCurveTo(s.origin.x+ux*d*((start+end)*.50)+nx*rootWidth*side*.34,s.origin.y+uy*d*((start+end)*.50)+ny*rootWidth*side*.34,s.origin.x+ux*d*end,s.origin.y+uy*d*end);ctx.stroke();}ctx.restore();}}
'''
combat=sub(combat,r"  function drawSpikes\(\)\{.*?\n  function drawSplit\(m\)",spikes+"  function drawSplit(m)",'spike renderer')

# Track the actual impact point consumed by the canonical damage/effect route.
combat=combat.replace("const saved={x:enemy.x,y:enemy.y,r:enemy.r},impact=runtime.pendingImpact;runtime.pendingImpact=null;if(impact){enemy.x=impact.x;enemy.y=impact.y;enemy.r=18;}","const saved={x:enemy.x,y:enemy.y,r:enemy.r},impact=runtime.pendingImpact;runtime.pendingImpact=null;if(impact){enemy.x=impact.x;enemy.y=impact.y;enemy.r=18;runtime.lastImpactUsed={x:impact.x,y:impact.y,at:performance.now()};}")
if 'runtime.lastImpactUsed=' not in combat: raise SystemExit('impact diagnostic patch failed')
combat=combat.replace("bodyTarget:runtime.bodyTarget?{...runtime.bodyTarget}:null,bodyPolygonScreen:","bodyTarget:runtime.bodyTarget?{...runtime.bodyTarget}:null,lastImpactUsed:runtime.lastImpactUsed?{...runtime.lastImpactUsed}:null,bodyPolygonScreen:")

answer=answer.replace("version:'v1',visualRevision:'v17'","version:'v1',visualRevision:'v18'")
if "visualRevision:'v18'" not in answer: raise SystemExit('answer diagnostic revision patch failed')

old_check="['P1-P3 preserve one approved body while one canonical combat fissure tree reinforces P1 and owns phase growth',!answer.includes('const FISSURES=')&&!answer.includes('drawAnswerFissures')&&!answer.includes('strokeScreenFissure')&&combat.includes('const FISSURE_EDGES=')&&combat.includes('phase:1,major:true')&&combat.includes('phaseFissureProgress')&&answer.includes('Math.min(3')&&!answer.includes(\"button('P4 · 응답'\")],"
new_check="['P1 preserves the approved baked fissure while one canonical combat growth tree owns P2-P3 continuation',!answer.includes('const FISSURES=')&&!answer.includes('drawAnswerFissures')&&!answer.includes('strokeScreenFissure')&&combat.includes('const FISSURE_EDGES=')&&!combat.includes('phase:1,major:true')&&combat.includes('phase:2,points')&&combat.includes('phase:3,points')&&combat.includes('phaseFissureProgress')&&answer.includes('Math.min(3')&&!answer.includes(\"button('P4 · 응답'\")],"
if old_check not in contract: raise SystemExit('phase contract anchor missing')
contract=contract.replace(old_check,new_check)
contract=contract.replace("combat.includes('runtime.pendingImpact')&&combat.includes('syncBossBodyGeometry(e)')","combat.includes('runtime.pendingImpact')&&combat.includes('runtime.lastImpactUsed')&&combat.includes('syncBossBodyGeometry(e)')")
contract=contract.replace("combat.includes('ghost=spikePolygon(s,1)')],","combat.includes('ghost=spikePolygon(s,1)')&&combat.includes('bud=spikePolygon(s,.06+.07*p)')&&!combat.includes('ctx.arc(s.origin.x,s.origin.y,12+reach*4')],")

combat_path.write_text(combat)
answer_path.write_text(answer)
contract_path.write_text(contract)
print('patched V18 second-pass spike and fissure presentation')
