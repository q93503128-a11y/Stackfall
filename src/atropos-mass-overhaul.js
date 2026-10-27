// Atropos visual pass: mass-first rendering.
// Loaded after apex-run-clock.js so the established combat/targeting logic stays intact.
(()=>{
  const BASE={
    'west-blade':{dx:-520,dy:132},
    'crown-anchor':{dx:-146,dy:-318},
    'rift-core':{dx:72,dy:18},
    'keel-anchor':{dx:146,dy:356},
    'east-blade':{dx:476,dy:-46}
  };

  function massEase(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function fillBand(g,x1,y1,x2,y2,width,fill,alpha=1){
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len*width,ny=dx/len*width;
    g.save();g.globalAlpha*=alpha;g.fillStyle=fill;g.beginPath();
    g.moveTo(x1+nx,y1+ny);g.lineTo(x2+nx,y2+ny);g.lineTo(x2-nx,y2-ny);g.lineTo(x1-nx,y1-ny);g.closePath();g.fill();g.restore();
  }
  function platePath(g,key,r){
    g.beginPath();
    if(key==='west-blade'){
      g.moveTo(-1.34*r,-.04*r);g.lineTo(-.92*r,-.78*r);g.lineTo(-.18*r,-1.02*r);g.lineTo(.52*r,-.58*r);g.lineTo(.34*r,.02*r);g.lineTo(.72*r,.48*r);g.lineTo(.06*r,.92*r);g.lineTo(-.86*r,.70*r);g.closePath();
    }else if(key==='east-blade'){
      g.moveTo(1.30*r,-.22*r);g.lineTo(.78*r,-.92*r);g.lineTo(.06*r,-.78*r);g.lineTo(-.54*r,-.22*r);g.lineTo(-.20*r,.24*r);g.lineTo(-.62*r,.72*r);g.lineTo(.10*r,1.00*r);g.lineTo(.98*r,.52*r);g.closePath();
    }else if(key==='crown-anchor'){
      g.moveTo(-.96*r,-.54*r);g.lineTo(-.30*r,-1.16*r);g.lineTo(.54*r,-.90*r);g.lineTo(.88*r,-.08*r);g.lineTo(.42*r,.38*r);g.lineTo(-.10*r,1.02*r);g.lineTo(-.80*r,.48*r);g.closePath();
    }else if(key==='keel-anchor'){
      g.moveTo(-.82*r,-.86*r);g.lineTo(.04*r,-1.02*r);g.lineTo(.72*r,-.46*r);g.lineTo(.46*r,.10*r);g.lineTo(.92*r,.72*r);g.lineTo(.12*r,1.16*r);g.lineTo(-.66*r,.54*r);g.closePath();
    }else{
      g.moveTo(-.72*r,-.92*r);g.lineTo(.02*r,-1.20*r);g.lineTo(.70*r,-.70*r);g.lineTo(.58*r,-.08*r);g.lineTo(.88*r,.48*r);g.lineTo(.18*r,1.12*r);g.lineTo(-.62*r,.64*r);g.lineTo(-.86*r,-.12*r);g.closePath();
    }
  }
  function paintFacet(g,pts,fill,alpha){
    g.save();g.globalAlpha*=alpha;g.fillStyle=fill;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.closePath();g.fill();g.restore();
  }

  resetAtroposPose=function resetAtroposPoseMass(){
    if(!arguments[0]?.bodyParts)return;
    const e=arguments[0];
    for(const [key,pos] of Object.entries(BASE)){
      const part=atroposPart(e,key);if(!part)continue;
      part.dx=pos.dx;part.dy=pos.dy;part.active=true;part.visible=true;
    }
  };

  updateAtroposPose=function updateAtroposPoseMass(e){
    resetAtroposPose(e);
    const slash=e.atroposReborn?.slash;if(!slash)return refreshBossBodyParts(e);
    const west=atroposPart(e,'west-blade'),east=atroposPart(e,'east-blade'),crown=atroposPart(e,'crown-anchor'),keel=atroposPart(e,'keel-anchor'),core=atroposPart(e,'rift-core');
    if(!west||!east||!crown||!keel||!core)return refreshBossBodyParts(e);
    const age=slash.age;
    let align=0,open=0;
    if(age<.78)align=massEase(age/.78);else if(age<1.46)align=1;else align=1-massEase((age-1.46)/.74);
    if(age>=1.16&&age<1.58)open=Math.sin(Math.PI*clamp((age-1.16)/.42,0,1));
    west.dx=BASE['west-blade'].dx-78*align-26*open;west.dy=BASE['west-blade'].dy-36*align;
    east.dx=BASE['east-blade'].dx+66*align+30*open;east.dy=BASE['east-blade'].dy+84*align;
    crown.dx=BASE['crown-anchor'].dx-18*align;crown.dy=BASE['crown-anchor'].dy-58*align;
    keel.dx=BASE['keel-anchor'].dx+42*align;keel.dy=BASE['keel-anchor'].dy+54*align;
    core.dx=BASE['rift-core'].dx-10*align;core.dy=BASE['rift-core'].dy+14*align;
    const vulnerable=age<.58||age>1.76;
    west.active=vulnerable;east.active=vulnerable;crown.active=vulnerable;keel.active=vulnerable;
    return refreshBossBodyParts(e);
  };

  drawAtroposPlate=function drawAtroposPlateMass(g,p,key,e,angle,scale=1,alpha=1){
    const hit=atroposPartHitPulse(e,key),part=atroposPart(e,key),active=part?.active!==false,r=(part?.r||100)*scale;
    g.save();g.translate(p.x,p.y);g.rotate(angle);g.globalAlpha*=alpha;if(hit)g.translate(rand(-5,5)*hit,rand(-4,4)*hit);
    const grad=g.createLinearGradient(-r,-r,r,r*.8);
    grad.addColorStop(0,hit?'#dffff9':'#1b2730');grad.addColorStop(.34,hit?'#aeeedf':'#101a22');grad.addColorStop(.72,'#070d13');grad.addColorStop(1,'#010307');
    g.fillStyle=grad;platePath(g,key,r);g.fill();
    g.save();platePath(g,key,r);g.clip();
    paintFacet(g,[[-1.20*r,-.12*r],[-.30*r,-.88*r],[.02*r,-.02*r],[-.52*r,.40*r]],hit?'#d9fff7':'#2a3b43',.34+.20*hit);
    paintFacet(g,[[.02*r,-.88*r],[.78*r,-.34*r],[.26*r,.06*r],[-.06*r,-.10*r]],'#03070c',.58);
    paintFacet(g,[[-.34*r,.34*r],[.30*r,.10*r],[.64*r,.54*r],[-.14*r,.80*r]],active?'#14252b':'#0a1116',.44);
    if(hit){g.globalAlpha=.30*hit;g.fillStyle='#efffff';g.fillRect(-r*1.2,-r*1.2,r*2.4,r*2.4);}
    g.restore();
    // No permanent outline: only a short activation lip on one cut face.
    if(active||hit){
      const lip=key==='west-blade'?[-.96,-.76,.36,-.56]:key==='east-blade'?[.82,-.82,-.42,-.22]:key==='crown-anchor'?[-.28,-1.06,.48,-.82]:[-.58,-.78,.12,-.98];
      fillBand(g,lip[0]*r,lip[1]*r,lip[2]*r,lip[3]*r,hit?4.8:2.6,hit?'#f4ffff':'rgba(177,238,225,.48)',1);
    }
    g.restore();
  };

  drawAtroposVoidMass=function drawAtroposVoidMassMass(g,c,e,manifest){
    const t=state.time||0,pulse=.5+.5*Math.sin(t*.22+e.atroposReborn.driftSeed);g.save();g.translate(c.x,c.y);
    const halo=g.createRadialGradient(44,4,40,24,20,470);halo.addColorStop(0,`rgba(0,1,4,${.99*manifest})`);halo.addColorStop(.50,`rgba(2,6,10,${(.96+.02*pulse)*manifest})`);halo.addColorStop(.82,`rgba(5,12,16,${.58*manifest})`);halo.addColorStop(1,'rgba(3,8,12,0)');g.fillStyle=halo;g.beginPath();g.ellipse(18,34,470,382,-.14,0,TAU);g.fill();
    g.globalAlpha=.95*manifest;g.fillStyle='#02050a';g.beginPath();g.moveTo(-360,-76);g.lineTo(-244,-286);g.lineTo(-42,-340);g.lineTo(178,-292);g.lineTo(368,-72);g.lineTo(306,160);g.lineTo(104,330);g.lineTo(-126,306);g.lineTo(-346,112);g.closePath();g.fill();
    paintFacet(g,[[-330,-80],[-176,-300],[-34,-318],[-88,74],[-300,130]],'#09131a',.58*manifest);
    paintFacet(g,[[42,-318],[184,-274],[340,-66],[194,104],[56,44]],'#071017',.44*manifest);
    paintFacet(g,[[-84,86],[72,34],[116,306],[-126,294],[-278,138]],'#050b10',.70*manifest);
    g.restore();
  };

  drawAtroposCore=function drawAtroposCoreMass(g,p,e,axis,alpha=1){
    const hit=atroposPartHitPulse(e,'rift-core'),part=atroposPart(e,'rift-core'),r=part?.r||166;g.save();g.translate(p.x,p.y);g.rotate(axis);g.globalAlpha*=alpha;if(hit)g.translate(rand(-5,5)*hit,rand(-4,4)*hit);
    const shell=g.createLinearGradient(-r,-r,r,r);shell.addColorStop(0,hit?'#dffef8':'#22313a');shell.addColorStop(.34,hit?'#a9e9dc':'#111c24');shell.addColorStop(.76,'#060c12');shell.addColorStop(1,'#010307');g.fillStyle=shell;platePath(g,'rift-core',r);g.fill();
    g.save();platePath(g,'rift-core',r);g.clip();
    paintFacet(g,[[-.62*r,-.82*r],[.02*r,-1.08*r],[.22*r,-.18*r],[-.34*r,.06*r]],hit?'#ccfff4':'#263941',.36+.18*hit);
    paintFacet(g,[[.18*r,-.92*r],[.70*r,-.62*r],[.48*r,.06*r],[.06*r,-.10*r]],'#03070c',.58);
    // Central absence: a broad missing volume, not a drawn crack.
    g.globalAlpha=.96;g.fillStyle='#000104';g.beginPath();g.moveTo(-.20*r,-.92*r);g.lineTo(.14*r,-.56*r);g.lineTo(-.04*r,-.08*r);g.lineTo(.20*r,.34*r);g.lineTo(-.08*r,.94*r);g.lineTo(-.34*r,.46*r);g.lineTo(-.20*r,.04*r);g.lineTo(-.40*r,-.36*r);g.closePath();g.fill();
    if(hit){g.globalAlpha=.26*hit;g.fillStyle='#efffff';g.fillRect(-r,-r,r*2,r*2);}
    g.restore();
    fillBand(g,-.26*r,-.88*r,.08*r,-.56*r,hit?5:2.8,hit?'#ffffff':'rgba(190,242,230,.50)',1);
    g.restore();
  };

  drawAtroposMantle=function drawAtroposMantleMass(g,c,e,manifest,alignment=0){
    g.save();g.translate(c.x,c.y);g.rotate(alignment*.08);g.globalAlpha*=manifest;
    const chunks=[
      {a1:-2.94,a2:-2.06,r0:354,r1:454,fill:'#03080d'},
      {a1:-1.54,a2:-.70,r0:384,r1:472,fill:'#050b10'},
      {a1:.08,a2:.82,r0:362,r1:442,fill:'#02070c'},
      {a1:1.50,a2:2.34,r0:382,r1:470,fill:'#061017'}
    ];
    for(const c0 of chunks){g.fillStyle=c0.fill;g.beginPath();g.arc(0,24,c0.r1,c0.a1,c0.a2);g.arc(0,24,c0.r0,c0.a2,c0.a1,true);g.closePath();g.fill();}
    g.restore();
  };

  drawAtroposBridges=function drawAtroposBridgesMass(g,points,manifest){
    const pairs=[['crown-anchor','west-blade',30],['crown-anchor','rift-core',38],['rift-core','east-blade',42],['west-blade','keel-anchor',28],['rift-core','keel-anchor',36]];
    g.save();g.globalAlpha*=manifest;
    for(const [aKey,bKey,w] of pairs){const a=points[aKey],b=points[bKey];if(!a||!b)continue;fillBand(g,a.x,a.y,b.x,b.y,w,'#02060a',.84);}
    g.restore();
  };

  drawAtroposWorldBody=function drawAtroposWorldBodyMass(e){
    if(!ensureRebornAtropos(e))return;updateAtroposPose(e);
    const center=atroposScreenPoint(e.x,e.y),points={};for(const key of Object.keys(BASE)){const part=atroposPart(e,key);if(part)points[key]=atroposScreenPoint(part.x,part.y);}
    const margin=980;if(center.x<-margin||center.x>vw+margin||center.y<-margin||center.y>vh+margin)return;
    const manifest=atroposManifest(e),axis=atroposStructureAxis(e),slash=e.atroposReborn?.slash;
    ctx.save();drawAtroposVoidMass(ctx,center,e,manifest);drawAtroposMantle(ctx,center,e,manifest,slash?1:0);drawAtroposBridges(ctx,points,manifest);
    drawAtroposPlate(ctx,points['west-blade'],'west-blade',e,axis+2.94,1.22,manifest);
    drawAtroposPlate(ctx,points['crown-anchor'],'crown-anchor',e,axis-1.72,1.02,manifest);
    drawAtroposCore(ctx,points['rift-core'],e,axis,manifest);
    drawAtroposPlate(ctx,points['east-blade'],'east-blade',e,axis-.10,1.18,manifest);
    drawAtroposPlate(ctx,points['keel-anchor'],'keel-anchor',e,axis+1.48,1.04,manifest);
    ctx.restore();
  };

  drawAtroposSpaceCut=function drawAtroposSpaceCutMass(e){
    const slash=e.atroposReborn?.slash;if(!slash||slash.age<.52||slash.age>1.70)return;
    const a=atroposScreenPoint(slash.x1,slash.y1),b=atroposScreenPoint(slash.x2,slash.y2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    ctx.save();
    if(slash.age<1.20){
      const q=clamp((slash.age-.52)/.68,0,1),shift=10+20*q;
      // Telegraph is a displaced strip of space, not a luminous guide line.
      fillBand(ctx,a.x+nx*shift,a.y+ny*shift,b.x+nx*shift,b.y+ny*shift,18+12*q,'rgba(8,18,24,.58)',.22+.22*q);
      fillBand(ctx,a.x-nx*shift*.55,a.y-ny*shift*.55,b.x-nx*shift*.55,b.y-ny*shift*.55,10+9*q,'rgba(45,75,79,.20)',.18+.16*q);
    }else{
      const elapsed=slash.age-1.20,open=elapsed<.13?atroposEaseOut(elapsed/.13):slash.age>1.53?clamp((1.70-slash.age)/.17,0,1):1,gap=10+open*26;
      fillBand(ctx,a.x,a.y,b.x,b.y,gap*1.45,'rgba(0,1,4,.96)',.82);
      fillBand(ctx,a.x+nx*gap,a.y+ny*gap,b.x+nx*gap,b.y+ny*gap,2.8,'rgba(226,255,249,.88)',open);
      fillBand(ctx,a.x-nx*gap,a.y-ny*gap,b.x-nx*gap,b.y-ny*gap,2.8,'rgba(151,232,215,.72)',open);
      for(let i=1;i<6;i++){const q=i/6,x=a.x+dx*q,y=a.y+dy*q,side=i%2?1:-1;fillBand(ctx,x-nx*gap*side,y-ny*gap*side,x+nx*gap*.34*side,y+ny*gap*.34*side,1.6,'rgba(117,190,180,.34)',open*.7);}
    }
    ctx.restore();
  };

  window.stackfallAtroposMassOverhaul=true;
})();
