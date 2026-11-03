from pathlib import Path
import re
p=Path('src/void-apex-answer-combat-v1.js')
contract_path=Path('scripts/void-apex-answer-contract.mjs')
s=p.read_text()
contract=contract_path.read_text()

def sub(pattern,repl,label):
    global s
    out,n=re.subn(pattern,repl,s,count=1,flags=re.S)
    if n!=1: raise SystemExit(f'{label}: expected 1, got {n}')
    s=out

spike=r'''  function spikePolygon(s,reach=1){
    const r=clamp01(reach),fdx=s.target.x-s.origin.x,fdy=s.target.y-s.origin.y,fullD=Math.hypot(fdx,fdy)||1,ux=fdx/fullD,uy=fdy/fullD,nx=-uy,ny=ux,d=fullD*r,seed=Number(s.seed)||0,root=16+Math.min(10,fullD*.010),profile=[[0,.96],[.035,1.18],[.075,.70],[.12,.84],[.18,.50],[.27,.38],[.38,.29],[.52,.21],[.67,.14],[.81,.085],[.92,.038],[1,0]];
    const edge=(entry,side)=>{const [t,widthScale]=entry,center=root*(Math.sin(t*7.4+seed*3.2)*.22+Math.sin(t*15.1-seed*2.1)*.08)*Math.sin(Math.PI*t),edgeNoise=(Math.sin(t*27.3+seed*5.1+side*1.9)*.18+Math.sin(t*12.7-seed*2.7+side)*.07),w=root*widthScale*(1+edgeNoise*side);return{x:s.origin.x+ux*d*t+nx*(center+w*side),y:s.origin.y+uy*d*t+ny*(center+w*side)};};
    const left=profile.map(entry=>edge(entry,1)),right=profile.slice(0,-1).reverse().map(entry=>edge(entry,-1));return left.concat(right);
  }
'''
sub(r"  function spikePolygon\(s,reach=1\)\{.*?\n  \}\n  function nearestPointOnSegment",spike+"  function nearestPointOnSegment",'spike polygon')

fissure_edges=r'''  const FISSURE_EDGES=[
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
  ];'''
sub(r"  const FISSURE_EDGES=\[.*?\n  \];",fissure_edges,'fissure edges')

beam=r'''  function drawBeam(m){const root=fissureRootScreen(),x=root.x,start=root.y;if(m.age<m.warn){const p=clamp01(m.age/m.warn),pulse=.5+.5*Math.sin(performance.now()*.012);ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(238,246,255,${.008+p*.030})`;ctx.fillRect(x-m.width*.5,start,m.width,vh-start);ctx.strokeStyle=`rgba(238,244,255,${.18+p*.46})`;ctx.lineWidth=1;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(x+side*m.width*.5,start);ctx.lineTo(x+side*m.width*.5,vh);ctx.stroke();}ctx.strokeStyle=`rgba(255,255,255,${.38+p*.62})`;ctx.shadowColor='#ffffff';ctx.shadowBlur=8+p*18;ctx.lineWidth=1.3+p*2.1;ctx.beginPath();ctx.moveTo(x,start);ctx.lineTo(x,vh);ctx.stroke();const r=22+p*36+pulse*4,g=ctx.createRadialGradient(x,start,0,x,start,r);g.addColorStop(0,`rgba(255,255,255,${.38+p*.58})`);g.addColorStop(.32,`rgba(239,247,255,${.09+p*.23})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x-r,start-r,r*2,r*2);ctx.restore();return;}const e=m.age-m.warn,alpha=e<=m.active?1:1-clamp01((e-m.active)/m.fade);ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;const gx=ctx.createLinearGradient(x-m.width*.5,0,x+m.width*.5,0);gx.addColorStop(0,'rgba(220,236,255,.18)');gx.addColorStop(.10,'rgba(238,247,255,.72)');gx.addColorStop(.30,'rgba(255,255,255,.97)');gx.addColorStop(.50,'rgba(255,255,255,1)');gx.addColorStop(.70,'rgba(255,255,255,.97)');gx.addColorStop(.90,'rgba(238,247,255,.72)');gx.addColorStop(1,'rgba(220,236,255,.18)');ctx.shadowColor='#ffffff';ctx.shadowBlur=26;ctx.fillStyle=gx;ctx.fillRect(x-m.width*.5,start,m.width,vh-start);ctx.shadowBlur=10;ctx.fillStyle='rgba(255,255,255,1)';ctx.fillRect(x-m.width*.16,start,m.width*.32,vh-start);ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.58)';ctx.lineWidth=.9;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(x+side*m.width*.5,start);ctx.lineTo(x+side*m.width*.5,vh);ctx.stroke();}ctx.restore();}
'''
sub(r"  function drawBeam\(m\)\{.*?\n  function drawRow\(m\)",beam+"  function drawRow(m)",'beam renderer')

old="combat.includes('fissureRootScreen()')&&combat.includes(\"ctx.fillStyle='#ffffff'\")&&combat.includes(\"kind==='row'&&runtime.phase>=2\")"
new="combat.includes('fissureRootScreen()')&&combat.includes('const gx=ctx.createLinearGradient')&&combat.includes(\"ctx.fillStyle='rgba(255,255,255,1)'\")&&combat.includes(\"kind==='row'&&runtime.phase>=2\")"
if old not in contract: raise SystemExit('beam contract anchor missing')
contract=contract.replace(old,new)

p.write_text(s)
contract_path.write_text(contract)
print('final V18 visual polish and beam contract patched')
