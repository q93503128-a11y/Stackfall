// Atropos visual v5 — readable mass-first rendering inspired by Stackfall's earliest Apex silhouettes.
// Combat, body-part targeting, entry freeze/push and space-cut timing stay owned by apex-run-clock.js.
(()=>{
  const VERSION='atropos-visual-v5';
  const COLORS={
    deep:'#06121c',deep2:'#0a1e2a',mid:'#123747',mid2:'#1c5566',
    cyan:'#58d9d2',ice:'#b9fff4',blue:'#4f8fc7',violet:'#706fc9'
  };

  function partOf(e,key){return typeof atroposPart==='function'?atroposPart(e,key):e?.bodyParts?.find(p=>p.key===key);}
  function screenOf(part){return part?atroposScreenPoint(part.x,part.y):null;}
  function hitPulse(e,key){return typeof atroposPartHitPulse==='function'?atroposPartHitPulse(e,key):0;}
  function shardPath(g,key,r){
    g.beginPath();
    if(key==='west-blade'){
      g.moveTo(-1.26*r,-.28*r);g.bezierCurveTo(-.92*r,-.86*r,-.22*r,-1.00*r,.42*r,-.62*r);g.lineTo(.16*r,-.08*r);g.lineTo(.76*r,.34*r);g.bezierCurveTo(.16*r,.88*r,-.66*r,.92*r,-1.12*r,.48*r);g.closePath();
    }else if(key==='east-blade'){
      g.moveTo(1.24*r,-.42*r);g.bezierCurveTo(.72*r,-.92*r,.08*r,-.94*r,-.56*r,-.48*r);g.lineTo(-.20*r,.02*r);g.lineTo(-.70*r,.62*r);g.bezierCurveTo(.02*r,.92*r,.72*r,.72*r,1.18*r,.26*r);g.closePath();
    }else if(key==='crown-anchor'){
      g.moveTo(-.78*r,-1.12*r);g.lineTo(.06*r,-1.32*r);g.lineTo(.72*r,-.78*r);g.lineTo(.54*r,-.08*r);g.lineTo(.90*r,.42*r);g.lineTo(.08*r,1.06*r);g.lineTo(-.70*r,.56*r);g.lineTo(-.96*r,-.18*r);g.closePath();
    }else if(key==='keel-anchor'){
      g.moveTo(-.96*r,-.52*r);g.lineTo(-.18*r,-1.10*r);g.lineTo(.66*r,-.82*r);g.lineTo(.92*r,-.08*r);g.lineTo(.46*r,.36*r);g.lineTo(.18*r,1.18*r);g.lineTo(-.62*r,.76*r);g.lineTo(-.82*r,.10*r);g.closePath();
    }else{
      g.moveTo(-.66*r,-1.12*r);g.bezierCurveTo(.06*r,-1.34*r,.76*r,-.86*r,.74*r,-.18*r);g.lineTo(.46*r,.16*r);g.bezierCurveTo(.78*r,.64*r,.32*r,1.14*r,-.18*r,1.18*r);g.lineTo(-.82*r,.56*r);g.lineTo(-.50*r,-.04*r);g.lineTo(-.84*r,-.50*r);g.closePath();
    }
  }

  function drawTemporalField(g,c,e,manifest){
    const t=state.time||0,pulse=.5+.5*Math.sin(t*.42+e.atroposReborn.driftSeed);
    g.save();g.translate(c.x,c.y);g.globalAlpha=manifest;
    const aura=g.createRadialGradient(-70,-40,30,0,0,520);
    aura.addColorStop(0,`rgba(88,217,210,${.16+.04*pulse})`);
    aura.addColorStop(.36,'rgba(43,114,130,.12)');
    aura.addColorStop(.72,'rgba(16,44,60,.07)');
    aura.addColorStop(1,'rgba(4,13,22,0)');
    g.fillStyle=aura;g.fillRect(-560,-500,1120,1000);

    // Broad phase shadows: filled masses, never decorative squiggle lines.
    g.globalAlpha=.22*manifest;g.fillStyle='#133544';
    g.beginPath();g.moveTo(-470,-180);g.bezierCurveTo(-260,-360,40,-390,310,-260);g.lineTo(238,-170);g.bezierCurveTo(20,-260,-230,-248,-402,-92);g.closePath();g.fill();
    g.globalAlpha=.16*manifest;g.fillStyle='#1a4050';
    g.beginPath();g.moveTo(-360,180);g.bezierCurveTo(-80,320,230,306,430,118);g.lineTo(340,50);g.bezierCurveTo(150,190,-96,210,-310,86);g.closePath();g.fill();
    g.restore();
  }

  function drawPhaseRibbon(g,a,b,width,alpha,manifest){
    if(!a||!b)return;const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,w=width*.5;
    g.save();g.globalAlpha=alpha*manifest;const grad=g.createLinearGradient(a.x,a.y,b.x,b.y);grad.addColorStop(0,'rgba(45,112,126,.08)');grad.addColorStop(.48,'rgba(83,186,190,.24)');grad.addColorStop(1,'rgba(42,94,118,.08)');g.fillStyle=grad;
    g.beginPath();g.moveTo(a.x+nx*w,a.y+ny*w);g.lineTo(b.x+nx*w*.72,b.y+ny*w*.72);g.lineTo(b.x-nx*w*.72,b.y-ny*w*.72);g.lineTo(a.x-nx*w,a.y-ny*w);g.closePath();g.fill();g.restore();
  }

  function drawShard(g,e,key,p,angle,scale,manifest){
    const part=partOf(e,key);if(!part||!p)return;const r=(part.r||110)*scale,hit=hitPulse(e,key),active=part.active!==false,t=state.time||0;
    g.save();g.translate(p.x,p.y);g.rotate(angle);g.globalAlpha=manifest*(active?1:.72);
    if(hit){g.translate(Math.sin(t*91+part.r)*5*hit,Math.cos(t*77+part.r)*4*hit);}

    // Offset phase echo gives scale without line-art clutter.
    g.save();g.translate(-12,10);g.globalAlpha=.22+.12*hit;g.fillStyle='#24566a';shardPath(g,key,r);g.fill();g.restore();

    const body=g.createLinearGradient(-r,-r,r,r);
    body.addColorStop(0,hit?'#efffff':'#315e72');
    body.addColorStop(.24,hit?'#c9fff6':'#20495d');
    body.addColorStop(.62,active?'#123241':'#0d2632');
    body.addColorStop(1,'#07151f');
    g.fillStyle=body;shardPath(g,key,r);g.fill();

    // Large faceted faces: readable at gameplay scale, no hairline scratches.
    g.save();shardPath(g,key,r);g.clip();
    g.globalAlpha=.60;g.fillStyle=active?'#2c7180':'#1d4756';
    g.beginPath();g.moveTo(-1.12*r,-.38*r);g.lineTo(-.18*r,-.94*r);g.lineTo(.20*r,-.10*r);g.lineTo(-.42*r,.32*r);g.closePath();g.fill();
    g.globalAlpha=.42;g.fillStyle=key==='east-blade'?'#596ac0':'#397f8a';
    g.beginPath();g.moveTo(.02*r,-.76*r);g.lineTo(.88*r,-.28*r);g.lineTo(.34*r,.18*r);g.lineTo(-.02*r,-.06*r);g.closePath();g.fill();
    g.globalAlpha=.26+.28*hit;g.fillStyle=hit?'#ffffff':'#8ef4e8';
    g.beginPath();g.moveTo(-.54*r,.34*r);g.lineTo(.20*r,.10*r);g.lineTo(.58*r,.34*r);g.lineTo(.05*r,.52*r);g.closePath();g.fill();
    g.restore();

    if(active){g.globalAlpha=.36+.22*hit;g.shadowBlur=18;g.shadowColor=COLORS.cyan;g.fillStyle=hit?'#ffffff':COLORS.ice;g.beginPath();g.ellipse(.10*r,-.05*r,r*.13,r*.055,.18,0,TAU);g.fill();g.shadowBlur=0;}
    g.restore();
  }

  function drawCore(g,e,p,axis,manifest){
    const part=partOf(e,'rift-core');if(!part||!p)return;const r=part.r||166,hit=hitPulse(e,'rift-core'),t=state.time||0,active=part.active!==false;
    g.save();g.translate(p.x,p.y);g.rotate(axis);g.globalAlpha=manifest;

    const halo=g.createRadialGradient(0,0,r*.10,0,0,r*1.35);halo.addColorStop(0,`rgba(128,255,241,${active?.30:.16})`);halo.addColorStop(.45,'rgba(59,133,150,.14)');halo.addColorStop(1,'rgba(7,18,28,0)');g.fillStyle=halo;g.fillRect(-r*1.45,-r*1.45,r*2.9,r*2.9);

    const body=g.createLinearGradient(-r,-r,r,r);body.addColorStop(0,hit?'#f5ffff':'#3f7786');body.addColorStop(.24,hit?'#c8fff5':'#245665');body.addColorStop(.64,'#102d3b');body.addColorStop(1,'#07151f');g.fillStyle=body;shardPath(g,'rift-core',r);g.fill();

    g.save();shardPath(g,'rift-core',r);g.clip();
    g.globalAlpha=.55;g.fillStyle='#347487';g.beginPath();g.moveTo(-.70*r,-.78*r);g.lineTo(.04*r,-1.02*r);g.lineTo(.22*r,-.18*r);g.lineTo(-.48*r,.16*r);g.closePath();g.fill();
    g.globalAlpha=.36;g.fillStyle='#5d70bd';g.beginPath();g.moveTo(.18*r,-.74*r);g.lineTo(.70*r,-.30*r);g.lineTo(.44*r,.26*r);g.lineTo(.02*r,-.02*r);g.closePath();g.fill();
    g.restore();

    // The center is an absence, not an orb or weak-point icon.
    const voidGrad=g.createLinearGradient(0,-r*.70,0,r*.72);voidGrad.addColorStop(0,'#02060c');voidGrad.addColorStop(.50,'#000207');voidGrad.addColorStop(1,'#08131c');g.fillStyle=voidGrad;g.beginPath();g.moveTo(-.12*r,-.70*r);g.bezierCurveTo(.08*r,-.42*r,.16*r,-.18*r,.04*r,.02*r);g.bezierCurveTo(-.08*r,.24*r,.10*r,.48*r,-.04*r,.72*r);g.lineTo(-.28*r,.30*r);g.lineTo(-.18*r,-.12*r);g.closePath();g.fill();

    // Broad luminous cut faces recover the clarity of early Apex art without becoming wireframe.
    g.globalAlpha=(active?.72:.34)+.20*hit;g.shadowBlur=22;g.shadowColor=COLORS.cyan;g.fillStyle=hit?'#ffffff':'#9cf9ed';
    g.beginPath();g.moveTo(-.17*r,-.68*r);g.lineTo(-.06*r,-.38*r);g.lineTo(-.10*r,.62*r);g.lineTo(-.22*r,.30*r);g.closePath();g.fill();
    g.shadowBlur=0;
    g.globalAlpha=.34+.12*Math.sin(t*.8);g.fillStyle='#6f82d1';g.beginPath();g.moveTo(.03*r,-.47*r);g.lineTo(.15*r,-.18*r);g.lineTo(.10*r,.40*r);g.lineTo(.02*r,.18*r);g.closePath();g.fill();
    g.restore();
  }

  function renderAtropos(e){
    if(!ensureRebornAtropos(e))return;updateAtroposPose(e);
    const center=atroposScreenPoint(e.x,e.y),points={};for(const def of ATROPOS_PART_LAYOUT){const part=partOf(e,def.key);if(part)points[def.key]=screenOf(part);}
    const margin=1050;if(center.x<-margin||center.x>vw+margin||center.y<-margin||center.y>vh+margin)return;
    const manifest=atroposManifest(e),axis=atroposStructureAxis(e),t=state.time||0;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';drawTemporalField(ctx,center,e,manifest);

    // Wide filled phase ribbons bind the pieces into one being without ring/line motifs.
    drawPhaseRibbon(ctx,points['rift-core'],points['west-blade'],72,.34,manifest);
    drawPhaseRibbon(ctx,points['rift-core'],points['east-blade'],82,.34,manifest);
    drawPhaseRibbon(ctx,points['rift-core'],points['crown-anchor'],64,.24,manifest);
    drawPhaseRibbon(ctx,points['rift-core'],points['keel-anchor'],68,.24,manifest);

    drawShard(ctx,e,'west-blade',points['west-blade'],axis+Math.PI*.93,1.18,manifest);
    drawShard(ctx,e,'crown-anchor',points['crown-anchor'],axis-Math.PI*.52,1.05,manifest);
    drawShard(ctx,e,'east-blade',points['east-blade'],axis+.10,1.18,manifest);
    drawShard(ctx,e,'keel-anchor',points['keel-anchor'],axis+Math.PI*.52,1.06,manifest);
    drawCore(ctx,e,points['rift-core'],axis,manifest);

    // Sparse filled fragments only; no decorative worm-lines.
    ctx.globalAlpha=.30*manifest;ctx.fillStyle='#6abebd';for(let i=0;i<4;i++){const a=e.atroposReborn.driftSeed+i*1.61,rr=440+(i%2)*52,sz=8+(i%2)*5;ctx.save();ctx.translate(center.x+Math.cos(a+t*.012)*rr,center.y+Math.sin(a+t*.012)*rr*.72);ctx.rotate(a*.4);ctx.fillRect(-sz*.5,-sz*.8,sz,sz*1.6);ctx.restore();}
    ctx.restore();
  }

  if(typeof drawAtroposWorldBody==='function')drawAtroposWorldBody=renderAtropos;
  window.stackfallAtroposVisualVersion=VERSION;
})();