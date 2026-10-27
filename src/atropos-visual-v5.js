// Atropos visual v6 — one asymmetric world-scale mass with readable surface targets.
// Combat, multipart targeting, entry control and space-cut timing remain owned by apex-run-clock.js.
(()=>{
  const VERSION='atropos-visual-v6';
  const C={deep:'#06131d',deep2:'#0a202c',mid:'#174256',mid2:'#286579',cyan:'#69e4d8',ice:'#c9fff5',violet:'#6572c9'};

  function partOf(e,key){return typeof atroposPart==='function'?atroposPart(e,key):e?.bodyParts?.find(p=>p.key===key);}
  function screenOf(part){return part?atroposScreenPoint(part.x,part.y):null;}
  function hitPulse(e,key){return typeof atroposPartHitPulse==='function'?atroposPartHitPulse(e,key):0;}

  function hullPath(g,p){
    const w=p['west-blade'],n=p['crown-anchor'],r=p['east-blade'],s=p['keel-anchor'];
    if(!w||!n||!r||!s)return false;
    g.beginPath();
    g.moveTo(w.x-160,w.y+80);
    g.bezierCurveTo(w.x-170,w.y-155,n.x-190,n.y+85,n.x-34,n.y-132);
    g.bezierCurveTo(n.x+118,n.y-78,r.x+188,r.y-168,r.x+150,r.y+30);
    g.bezierCurveTo(r.x+168,r.y+170,s.x+164,s.y-115,s.x+26,s.y+148);
    g.bezierCurveTo(s.x-130,s.y+132,w.x-190,w.y+190,w.x-160,w.y+80);
    g.closePath();return true;
  }

  function drawAura(g,c,e,manifest){
    const t=state.time||0,pulse=.5+.5*Math.sin(t*.34+e.atroposReborn.driftSeed);
    g.save();g.globalAlpha=manifest;
    const glow=g.createRadialGradient(c.x-90,c.y-80,50,c.x,c.y,610);
    glow.addColorStop(0,`rgba(93,226,218,${.11+.035*pulse})`);
    glow.addColorStop(.42,'rgba(45,112,135,.08)');
    glow.addColorStop(.82,'rgba(11,34,48,.035)');
    glow.addColorStop(1,'rgba(5,14,23,0)');
    g.fillStyle=glow;g.fillRect(c.x-650,c.y-560,1300,1120);
    g.restore();
  }

  function drawMainMass(g,p,c,e,manifest){
    const t=state.time||0,hit=Math.max(...['west-blade','crown-anchor','rift-core','keel-anchor','east-blade'].map(k=>hitPulse(e,k)));
    g.save();g.globalAlpha=manifest;
    const base=g.createLinearGradient(c.x-520,c.y-360,c.x+520,c.y+360);
    base.addColorStop(0,hit?'#dffff8':'#315d70');
    base.addColorStop(.16,hit?'#bffff2':'#21495b');
    base.addColorStop(.48,'#102d3c');
    base.addColorStop(.78,'#0a1d29');
    base.addColorStop(1,'#050f18');
    g.fillStyle=base;if(hullPath(g,p))g.fill();

    g.save();if(hullPath(g,p))g.clip();
    // Large material planes. These are intentionally broad so the boss reads as mass, not line-art.
    g.globalAlpha=.58*manifest;g.fillStyle='#2b6679';
    g.beginPath();g.moveTo(c.x-520,c.y-210);g.lineTo(c.x-160,c.y-350);g.lineTo(c.x-70,c.y+20);g.lineTo(c.x-410,c.y+145);g.closePath();g.fill();
    g.globalAlpha=.42*manifest;g.fillStyle='#345b78';
    g.beginPath();g.moveTo(c.x+30,c.y-360);g.lineTo(c.x+480,c.y-210);g.lineTo(c.x+230,c.y+60);g.lineTo(c.x-12,c.y-18);g.closePath();g.fill();
    g.globalAlpha=.48*manifest;g.fillStyle='#173f50';
    g.beginPath();g.moveTo(c.x-360,c.y+128);g.lineTo(c.x-30,c.y+18);g.lineTo(c.x+350,c.y+150);g.lineTo(c.x+82,c.y+350);g.lineTo(c.x-270,c.y+300);g.closePath();g.fill();
    g.globalAlpha=.27*manifest;g.fillStyle='#6473c3';
    g.beginPath();g.moveTo(c.x+128,c.y-210);g.lineTo(c.x+420,c.y-80);g.lineTo(c.x+250,c.y+94);g.lineTo(c.x+72,c.y+22);g.closePath();g.fill();
    // A second time layer is a broad displaced surface, not a ring or worm line.
    g.globalAlpha=(.12+.04*Math.sin(t*.41))*manifest;g.fillStyle='#7be2db';
    g.beginPath();g.moveTo(c.x-470,c.y-80);g.lineTo(c.x-130,c.y-278);g.lineTo(c.x+360,c.y-118);g.lineTo(c.x+500,c.y+78);g.lineTo(c.x+110,c.y+240);g.lineTo(c.x-390,c.y+170);g.closePath();g.fill();
    g.restore();

    // Deep negative-space wounds keep the silhouette alien without becoming a central sword icon.
    g.globalAlpha=.94*manifest;g.fillStyle='#02070d';
    g.beginPath();g.moveTo(c.x-60,c.y-174);g.bezierCurveTo(c.x+42,c.y-154,c.x+118,c.y-70,c.x+84,c.y+18);g.bezierCurveTo(c.x+42,c.y+102,c.x+110,c.y+174,c.x+10,c.y+225);g.bezierCurveTo(c.x-88,c.y+176,c.x-128,c.y+92,c.x-96,c.y+14);g.bezierCurveTo(c.x-54,c.y-72,c.x-132,c.y-126,c.x-60,c.y-174);g.fill();
    g.globalAlpha=.72*manifest;g.fillStyle='#07111a';
    g.beginPath();g.moveTo(c.x+286,c.y-142);g.lineTo(c.x+432,c.y-82);g.lineTo(c.x+328,c.y+20);g.lineTo(c.x+220,c.y-8);g.closePath();g.fill();
    g.restore();
  }

  function targetPatch(g,e,key,p,angle,scale,manifest){
    const part=partOf(e,key);if(!part||!p)return;const r=(part.r||100)*scale,hit=hitPulse(e,key),active=part.active!==false,t=state.time||0;
    g.save();g.translate(p.x,p.y);g.rotate(angle);g.globalAlpha=manifest*(active?1:.58);
    if(hit)g.translate(Math.sin(t*93+part.r)*4.8*hit,Math.cos(t*79+part.r)*4.2*hit);
    const grad=g.createLinearGradient(-r,-r,r,r);grad.addColorStop(0,hit?'#ffffff':'#72b8bf');grad.addColorStop(.38,hit?'#d5fff8':'#377889');grad.addColorStop(1,'#183747');g.fillStyle=grad;
    g.beginPath();g.moveTo(-.92*r,-.42*r);g.lineTo(-.22*r,-.86*r);g.lineTo(.74*r,-.48*r);g.lineTo(.88*r,.08*r);g.lineTo(.30*r,.72*r);g.lineTo(-.64*r,.58*r);g.closePath();g.fill();
    g.globalAlpha=(active?.42:.18)+.28*hit;g.fillStyle=key==='east-blade'||key==='keel-anchor'?C.violet:C.cyan;
    g.beginPath();g.moveTo(-.52*r,-.18*r);g.lineTo(.18*r,-.58*r);g.lineTo(.60*r,-.16*r);g.lineTo(.18*r,.30*r);g.lineTo(-.46*r,.18*r);g.closePath();g.fill();
    // Small luminous face gives early-Apex readability without outlining the whole part.
    if(active){g.globalAlpha=.55+.28*hit;g.shadowBlur=16;g.shadowColor=C.cyan;g.fillStyle=hit?'#fff':C.ice;g.beginPath();g.moveTo(.18*r,-.30*r);g.lineTo(.56*r,-.12*r);g.lineTo(.30*r,.12*r);g.lineTo(.04*r,.02*r);g.closePath();g.fill();g.shadowBlur=0;}
    g.restore();
  }

  function drawCoreVoid(g,e,p,axis,manifest){
    const part=partOf(e,'rift-core');if(!part||!p)return;const r=part.r||166,hit=hitPulse(e,'rift-core'),active=part.active!==false,t=state.time||0;
    g.save();g.translate(p.x,p.y);g.rotate(axis);g.globalAlpha=manifest;
    // Broad cavity instead of the old vertical blade shape.
    const halo=g.createRadialGradient(0,0,r*.10,0,0,r*1.15);halo.addColorStop(0,`rgba(107,238,226,${active?.26:.11})`);halo.addColorStop(.55,'rgba(54,130,150,.10)');halo.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=halo;g.fillRect(-r*1.3,-r*1.3,r*2.6,r*2.6);
    g.fillStyle='#01050a';g.beginPath();g.moveTo(-.64*r,-.36*r);g.bezierCurveTo(-.30*r,-.92*r,.50*r,-.86*r,.72*r,-.28*r);g.bezierCurveTo(.94*r,.30*r,.38*r,.88*r,-.22*r,.80*r);g.bezierCurveTo(-.88*r,.70*r,-.98*r,.06*r,-.64*r,-.36*r);g.fill();
    g.globalAlpha=(active?.82:.36)+.18*hit;g.shadowBlur=24;g.shadowColor=C.cyan;g.fillStyle=hit?'#ffffff':'#8ff4e8';
    g.beginPath();g.moveTo(-.52*r,-.38*r);g.bezierCurveTo(-.26*r,-.72*r,.14*r,-.72*r,.34*r,-.52*r);g.lineTo(.20*r,-.30*r);g.bezierCurveTo(-.08*r,-.48*r,-.32*r,-.34*r,-.46*r,-.08*r);g.closePath();g.fill();
    g.shadowBlur=0;g.globalAlpha=.28+.10*Math.sin(t*.72);g.fillStyle=C.violet;g.beginPath();g.moveTo(.34*r,.02*r);g.lineTo(.62*r,.28*r);g.lineTo(.28*r,.56*r);g.lineTo(.06*r,.30*r);g.closePath();g.fill();
    g.restore();
  }

  function renderAtropos(e){
    if(!ensureRebornAtropos(e))return;updateAtroposPose(e);
    const center=atroposScreenPoint(e.x,e.y),p={};for(const def of ATROPOS_PART_LAYOUT){const part=partOf(e,def.key);if(part)p[def.key]=screenOf(part);}
    const margin=1120;if(center.x<-margin||center.x>vw+margin||center.y<-margin||center.y>vh+margin)return;
    const manifest=atroposManifest(e),axis=atroposStructureAxis(e);
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';drawAura(ctx,center,e,manifest);drawMainMass(ctx,p,center,e,manifest);
    // Targetable regions are embedded as surface plates, not detached circular props.
    targetPatch(ctx,e,'west-blade',p['west-blade'],axis+Math.PI*.94,.86,manifest);
    targetPatch(ctx,e,'crown-anchor',p['crown-anchor'],axis-Math.PI*.48,.80,manifest);
    targetPatch(ctx,e,'east-blade',p['east-blade'],axis+.10,.86,manifest);
    targetPatch(ctx,e,'keel-anchor',p['keel-anchor'],axis+Math.PI*.50,.82,manifest);
    drawCoreVoid(ctx,e,p['rift-core'],axis,manifest);
    ctx.restore();
  }

  if(typeof drawAtroposWorldBody==='function')drawAtroposWorldBody=renderAtropos;
  window.stackfallAtroposVisualVersion=VERSION;
})();
