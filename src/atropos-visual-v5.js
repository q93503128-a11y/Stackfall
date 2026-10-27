// Atropos visual v7 — living obsidian ruin.
// One world-scale asymmetric shell; target surfaces are embedded fracture faces.
// Time distortion is expressed through displaced background inside the body cavity,
// not rings, clocks, decorative squiggles or a central glowing orb.
(()=>{
  const VERSION='atropos-visual-v7';
  const C={
    void:'#01050a',deep:'#061019',deep2:'#0a1a24',mid:'#163747',mid2:'#24566a',
    face:'#3d7b88',ice:'#b8fff2',cyan:'#63d8cf',blue:'#5c7db8',violet:'#6f68a8'
  };
  const lensCanvas=document.createElement('canvas');
  const lensCtx=lensCanvas.getContext('2d',{alpha:false});

  function partOf(e,key){return typeof atroposPart==='function'?atroposPart(e,key):e?.bodyParts?.find(p=>p.key===key);}
  function screenOf(part){return part?atroposScreenPoint(part.x,part.y):null;}
  function hitPulse(e,key){return typeof atroposPartHitPulse==='function'?atroposPartHitPulse(e,key):0;}
  function ease(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function pointMap(e,c){
    const out={};
    for(const def of ATROPOS_PART_LAYOUT){
      const p=partOf(e,def.key);out[def.key]=p?screenOf(p):{x:c.x+def.dx,y:c.y+def.dy};
    }
    return out;
  }
  function staticPointMap(cx,cy){
    const out={};for(const def of ATROPOS_PART_LAYOUT)out[def.key]={x:cx+def.dx,y:cy+def.dy};return out;
  }

  function shellPath(g,p,c){
    const w=p['west-blade'],n=p['crown-anchor'],r=p['east-blade'],k=p['keel-anchor'];
    if(!w||!n||!r||!k)return false;
    g.beginPath();
    g.moveTo(w.x-178,w.y+142);
    g.bezierCurveTo(w.x-242,w.y-46,w.x-170,n.y+112,n.x-134,n.y-142);
    g.bezierCurveTo(n.x+50,n.y-205,c.x+122,c.y-430,c.x+310,c.y-292);
    g.bezierCurveTo(c.x+430,c.y-212,r.x+214,r.y-178,r.x+196,r.y-22);
    g.bezierCurveTo(r.x+184,r.y+126,c.x+432,c.y+222,k.x+184,k.y+118);
    g.bezierCurveTo(k.x+92,k.y+216,c.x+14,c.y+448,c.x-188,c.y+366);
    g.bezierCurveTo(c.x-374,c.y+340,w.x-252,w.y+282,w.x-178,w.y+142);
    g.closePath();return true;
  }
  function cavityPath(g,c){
    g.beginPath();
    g.moveTo(c.x+36,c.y-164);
    g.bezierCurveTo(c.x+112,c.y-236,c.x+236,c.y-208,c.x+270,c.y-100);
    g.bezierCurveTo(c.x+310,c.y+6,c.x+232,c.y+88,c.x+258,c.y+172);
    g.bezierCurveTo(c.x+196,c.y+244,c.x+72,c.y+224,c.x+16,c.y+144);
    g.bezierCurveTo(c.x-34,c.y+72,c.x+10,c.y+8,c.x-8,c.y-62);
    g.bezierCurveTo(c.x-24,c.y-110,c.x+4,c.y-142,c.x+36,c.y-164);
    g.closePath();
  }

  function fracturePath(g,key,r){
    g.beginPath();
    if(key==='west-blade'){
      g.moveTo(-1.10*r,-.18*r);g.bezierCurveTo(-.88*r,-.78*r,-.18*r,-1.02*r,.56*r,-.58*r);g.lineTo(.30*r,-.06*r);g.bezierCurveTo(.82*r,.38*r,.30*r,.90*r,-.52*r,.74*r);g.lineTo(-.98*r,.34*r);g.closePath();
    }else if(key==='east-blade'){
      g.moveTo(-.86*r,-.62*r);g.bezierCurveTo(-.10*r,-1.02*r,.78*r,-.82*r,1.08*r,-.22*r);g.lineTo(.78*r,.28*r);g.bezierCurveTo(.40*r,.84*r,-.42*r,.94*r,-.96*r,.40*r);g.lineTo(-.50*r,-.02*r);g.closePath();
    }else if(key==='crown-anchor'){
      g.moveTo(-.86*r,-.82*r);g.bezierCurveTo(-.22*r,-1.18*r,.70*r,-.84*r,.84*r,-.10*r);g.lineTo(.30*r,.18*r);g.lineTo(.54*r,.74*r);g.bezierCurveTo(-.10*r,1.02*r,-.78*r,.62*r,-.92*r,-.08*r);g.closePath();
    }else if(key==='keel-anchor'){
      g.moveTo(-.94*r,-.46*r);g.bezierCurveTo(-.42*r,-.98*r,.50*r,-1.00*r,.88*r,-.34*r);g.lineTo(.48*r,.16*r);g.lineTo(.64*r,.78*r);g.bezierCurveTo(.06*r,1.08*r,-.72*r,.72*r,-.88*r,.12*r);g.closePath();
    }else{
      g.moveTo(-.96*r,-.34*r);g.bezierCurveTo(-.64*r,-.92*r,.18*r,-1.02*r,.82*r,-.52*r);g.lineTo(.62*r,.10*r);g.bezierCurveTo(.88*r,.62*r,.18*r,.96*r,-.54*r,.70*r);g.lineTo(-.88*r,.24*r);g.closePath();
    }
  }

  function captureBackdrop(cx,cy,w=520,h=430){
    const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;
    if(tier>=2||!lensCtx||!canvas)return null;
    const x0=Math.max(0,Math.min(vw,cx-w*.5)),y0=Math.max(0,Math.min(vh,cy-h*.5));
    const x1=Math.max(x0,Math.min(vw,cx+w*.5)),y1=Math.max(y0,Math.min(vh,cy+h*.5));
    const cw=x1-x0,ch=y1-y0;if(cw<8||ch<8)return null;
    const pw=Math.max(1,Math.round(cw*dpr)),ph=Math.max(1,Math.round(ch*dpr));
    if(lensCanvas.width!==pw||lensCanvas.height!==ph){lensCanvas.width=pw;lensCanvas.height=ph;}
    lensCtx.setTransform(1,0,0,1,0,0);lensCtx.globalAlpha=1;lensCtx.globalCompositeOperation='source-over';
    lensCtx.clearRect(0,0,pw,ph);
    lensCtx.drawImage(canvas,Math.round(x0*dpr),Math.round(y0*dpr),pw,ph,0,0,pw,ph);
    return{x:x0,y:y0,w:cw,h:ch};
  }

  function drawPressure(g,c,e,manifest){
    const t=state.time||0,pulse=.5+.5*Math.sin(t*.30+e.atroposReborn.driftSeed);
    g.save();g.globalAlpha=manifest;
    const aura=g.createRadialGradient(c.x-90,c.y-40,44,c.x,c.y,610);
    aura.addColorStop(0,`rgba(74,168,170,${.10+.025*pulse})`);
    aura.addColorStop(.40,'rgba(29,78,92,.07)');
    aura.addColorStop(.72,'rgba(8,25,36,.045)');
    aura.addColorStop(1,'rgba(3,9,15,0)');
    g.fillStyle=aura;g.fillRect(c.x-660,c.y-600,1320,1200);
    g.restore();
  }

  function drawShell(g,p,c,e,manifest){
    const hit=Math.max(...['west-blade','crown-anchor','rift-core','keel-anchor','east-blade'].map(k=>hitPulse(e,k)));
    g.save();g.globalAlpha=manifest;
    const base=g.createLinearGradient(c.x-560,c.y-380,c.x+520,c.y+360);
    base.addColorStop(0,hit?'#dffff7':'#315c6d');
    base.addColorStop(.18,hit?'#bff9ee':'#24495a');
    base.addColorStop(.48,'#122b38');
    base.addColorStop(.72,'#0a1b25');
    base.addColorStop(1,'#040b12');
    g.fillStyle=base;if(shellPath(g,p,c))g.fill();

    g.save();if(shellPath(g,p,c))g.clip();
    let grad=g.createLinearGradient(c.x-520,c.y-300,c.x+20,c.y+120);
    grad.addColorStop(0,'rgba(61,122,135,.86)');grad.addColorStop(.58,'rgba(31,76,91,.62)');grad.addColorStop(1,'rgba(11,29,39,.10)');
    g.fillStyle=grad;g.beginPath();g.moveTo(c.x-560,c.y-172);g.bezierCurveTo(c.x-390,c.y-354,c.x-122,c.y-392,c.x+28,c.y-206);g.bezierCurveTo(c.x-40,c.y-74,c.x-236,c.y+34,c.x-480,c.y+92);g.closePath();g.fill();

    grad=g.createLinearGradient(c.x+40,c.y-340,c.x+510,c.y+80);
    grad.addColorStop(0,'rgba(73,87,135,.55)');grad.addColorStop(.42,'rgba(50,93,119,.48)');grad.addColorStop(1,'rgba(12,31,42,.06)');
    g.fillStyle=grad;g.beginPath();g.moveTo(c.x+2,c.y-330);g.bezierCurveTo(c.x+194,c.y-390,c.x+418,c.y-244,c.x+500,c.y-74);g.bezierCurveTo(c.x+318,c.y-60,c.x+202,c.y+28,c.x+44,c.y-32);g.closePath();g.fill();

    grad=g.createLinearGradient(c.x-370,c.y+70,c.x+260,c.y+380);
    grad.addColorStop(0,'rgba(21,62,78,.42)');grad.addColorStop(.48,'rgba(39,93,104,.48)');grad.addColorStop(1,'rgba(9,24,33,.10)');
    g.fillStyle=grad;g.beginPath();g.moveTo(c.x-430,c.y+98);g.bezierCurveTo(c.x-154,c.y+42,c.x+28,c.y+114,c.x+344,c.y+126);g.bezierCurveTo(c.x+286,c.y+318,c.x+48,c.y+420,c.x-216,c.y+340);g.closePath();g.fill();

    g.globalAlpha=.24*manifest;g.fillStyle='#8bdad1';
    g.beginPath();g.moveTo(c.x-438,c.y-164);g.bezierCurveTo(c.x-300,c.y-258,c.x-180,c.y-278,c.x-92,c.y-210);g.bezierCurveTo(c.x-174,c.y-170,c.x-276,c.y-116,c.x-404,c.y-74);g.closePath();g.fill();
    g.globalAlpha=.15*manifest;g.fillStyle='#8793cf';
    g.beginPath();g.moveTo(c.x+246,c.y-214);g.bezierCurveTo(c.x+340,c.y-186,c.x+438,c.y-96,c.x+456,c.y-24);g.bezierCurveTo(c.x+350,c.y-26,c.x+278,c.y+18,c.x+188,c.y-14);g.closePath();g.fill();
    g.restore();
    g.restore();
  }

  function drawCavity(g,c,manifest){
    const capture=captureBackdrop(c.x+112,c.y+6,500,430);
    g.save();cavityPath(g,c);g.clip();
    if(capture){
      const wobble=Math.sin((state.time||0)*.38)*6;
      g.globalAlpha=.88*manifest;
      g.drawImage(lensCanvas,0,0,lensCanvas.width,lensCanvas.height,capture.x+wobble,capture.y-4,capture.w*1.025,capture.h*1.02);
      g.globalAlpha=.22*manifest;g.globalCompositeOperation='screen';
      g.drawImage(lensCanvas,0,0,lensCanvas.width,lensCanvas.height,capture.x-7,capture.y+5,capture.w*.99,capture.h*1.01);
      g.globalCompositeOperation='source-over';
    }
    const depth=g.createRadialGradient(c.x+118,c.y+4,18,c.x+118,c.y+4,220);
    depth.addColorStop(0,'rgba(0,2,6,.18)');depth.addColorStop(.52,'rgba(0,4,9,.36)');depth.addColorStop(1,'rgba(0,3,8,.78)');
    g.globalAlpha=manifest;g.fillStyle=depth;g.fillRect(c.x-60,c.y-230,390,500);
    g.restore();

    g.save();g.globalAlpha=.55*manifest;g.fillStyle='#477f88';
    g.beginPath();g.moveTo(c.x+8,c.y-176);g.bezierCurveTo(c.x+60,c.y-226,c.x+118,c.y-238,c.x+160,c.y-222);g.lineTo(c.x+136,c.y-180);g.bezierCurveTo(c.x+90,c.y-188,c.x+44,c.y-168,c.x+18,c.y-136);g.closePath();g.fill();
    g.globalAlpha=.34*manifest;g.fillStyle='#5f6ea5';
    g.beginPath();g.moveTo(c.x+244,c.y+86);g.bezierCurveTo(c.x+276,c.y+124,c.x+262,c.y+180,c.x+214,c.y+210);g.lineTo(c.x+178,c.y+176);g.bezierCurveTo(c.x+214,c.y+142,c.x+218,c.y+104,c.x+202,c.y+82);g.closePath();g.fill();
    g.restore();
  }

  function drawTargetFace(g,e,key,p,angle,scale,manifest){
    const part=partOf(e,key);if(!part||!p)return;const r=(part.r||110)*scale,hit=hitPulse(e,key),active=part.active!==false,t=state.time||0;
    g.save();g.translate(p.x,p.y);g.rotate(angle);g.globalAlpha=manifest*(active?1:.52);
    if(hit)g.translate(Math.sin(t*89+part.r)*5*hit,Math.cos(t*73+part.r)*4*hit);

    const body=g.createLinearGradient(-r,-r,r,r);
    body.addColorStop(0,hit?'#ffffff':active?'#477d87':'#243f49');
    body.addColorStop(.34,hit?'#d9fff7':active?'#2f6471':'#193440');
    body.addColorStop(.76,'#102833');body.addColorStop(1,'#08151e');
    g.fillStyle=body;fracturePath(g,key,r);g.fill();

    g.save();fracturePath(g,key,r);g.clip();
    g.globalAlpha=.42+.24*hit;g.fillStyle=hit?'#ffffff':(key==='east-blade'||key==='keel-anchor'?'#6371a4':'#3f8790');
    g.beginPath();g.moveTo(-.90*r,-.36*r);g.bezierCurveTo(-.38*r,-.78*r,.14*r,-.84*r,.60*r,-.40*r);g.lineTo(.18*r,-.06*r);g.bezierCurveTo(-.18*r,-.18*r,-.54*r,.02*r,-.78*r,.24*r);g.closePath();g.fill();
    g.globalAlpha=.22+.20*hit;g.fillStyle=hit?'#efffff':'#9ce9df';
    g.beginPath();g.moveTo(-.42*r,.26*r);g.bezierCurveTo(-.08*r,.08*r,.26*r,.04*r,.56*r,.18*r);g.lineTo(.28*r,.46*r);g.bezierCurveTo(.02*r,.34*r,-.20*r,.38*r,-.42*r,.50*r);g.closePath();g.fill();
    g.restore();
    g.restore();
  }

  function drawCoreFace(g,e,p,axis,manifest){
    const part=partOf(e,'rift-core');if(!part||!p)return;
    const r=(part.r||166)*.96,hit=hitPulse(e,'rift-core'),active=part.active!==false,t=state.time||0;
    g.save();g.translate(p.x-58,p.y+34);g.rotate(axis-.18);g.globalAlpha=manifest*(active?1:.58);
    if(hit)g.translate(Math.sin(t*91)*5*hit,Math.cos(t*79)*4*hit);
    const grad=g.createLinearGradient(-r,-r,r,r);grad.addColorStop(0,hit?'#ffffff':'#4a8088');grad.addColorStop(.34,hit?'#dcfff8':'#2d5d69');grad.addColorStop(.78,'#102733');grad.addColorStop(1,'#07131c');g.fillStyle=grad;
    g.beginPath();g.moveTo(-.92*r,-.44*r);g.bezierCurveTo(-.48*r,-.94*r,.18*r,-1.00*r,.72*r,-.56*r);g.lineTo(.50*r,-.06*r);g.bezierCurveTo(.72*r,.38*r,.14*r,.86*r,-.56*r,.66*r);g.lineTo(-.88*r,.18*r);g.closePath();g.fill();
    g.globalAlpha=.30+.26*hit;g.fillStyle=hit?'#ffffff':'#8bd9cf';g.beginPath();g.moveTo(-.48*r,-.28*r);g.bezierCurveTo(-.18*r,-.60*r,.18*r,-.62*r,.44*r,-.36*r);g.lineTo(.08*r,-.06*r);g.bezierCurveTo(-.12*r,-.18*r,-.32*r,-.10*r,-.48*r,.04*r);g.closePath();g.fill();
    g.restore();
  }

  function renderAtropos(e){
    if(!ensureRebornAtropos(e))return;updateAtroposPose(e);
    const c=atroposScreenPoint(e.x,e.y),p=pointMap(e,c),margin=1180;
    if(c.x<-margin||c.x>vw+margin||c.y<-margin||c.y>vh+margin)return;
    const manifest=atroposManifest(e),axis=atroposStructureAxis(e);
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    drawPressure(ctx,c,e,manifest);
    drawShell(ctx,p,c,e,manifest);
    drawCavity(ctx,c,manifest);
    drawTargetFace(ctx,e,'west-blade',p['west-blade'],axis+Math.PI*.98,1.12,manifest);
    drawTargetFace(ctx,e,'crown-anchor',p['crown-anchor'],axis-Math.PI*.48,.96,manifest);
    drawTargetFace(ctx,e,'east-blade',p['east-blade'],axis+.08,1.10,manifest);
    drawTargetFace(ctx,e,'keel-anchor',p['keel-anchor'],axis+Math.PI*.50,.98,manifest);
    drawCoreFace(ctx,e,p['rift-core'],axis,manifest);
    ctx.restore();
  }

  function drawEntryPresence(){
    const tr=state.realmTransition;if(tr?.to!=='apex-chrono'||tr?.owner!=='apex-entry')return;
    const q=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1);
    const appear=ease(clamp((q-.28)/.34,0,1)),fade=1-ease(clamp((q-.72)/.20,0,1)),alpha=appear*fade;
    if(alpha<=.01)return;
    const cx=(ATROPOS_ENTRY_CONTROL.centerX||player.x)-player.x+vw/2,cy=(ATROPOS_ENTRY_CONTROL.centerY||player.y)-player.y+vh/2-190;
    const c={x:cx,y:cy},p=staticPointMap(cx,cy);
    ctx.save();ctx.globalAlpha=.74*alpha;ctx.fillStyle='#02070d';shellPath(ctx,p,c);ctx.fill();
    ctx.globalAlpha=.18*alpha;ctx.fillStyle='#4f9c9b';
    ctx.beginPath();ctx.moveTo(c.x-470,c.y-168);ctx.bezierCurveTo(c.x-260,c.y-330,c.x-80,c.y-342,c.x+16,c.y-214);ctx.bezierCurveTo(c.x-116,c.y-152,c.x-260,c.y-92,c.x-428,c.y-34);ctx.closePath();ctx.fill();
    ctx.restore();
  }

  if(typeof drawAtroposWorldBody==='function')drawAtroposWorldBody=renderAtropos;
  const baseOverlay=typeof drawRealmCinematicOverlay==='function'?drawRealmCinematicOverlay:null;
  if(baseOverlay)drawRealmCinematicOverlay=function drawRealmCinematicOverlayAtroposV7(){const result=baseOverlay();drawEntryPresence();return result;};
  window.stackfallAtroposVisualVersion=VERSION;
})();
