// Stage 1 / 폐쇄선 production silhouette pass v5.
// Replaces the visible K-03 body with a larger infrastructure-bound enforcement machine.
// Collision/combat remain owned by v2; v3/v4 still own motion state and compatibility.
(()=>{
  if(window.__stackfallStageOneReworkV5Loaded)return;
  window.__stackfallStageOneReworkV5Loaded=true;

  const V5={version:'lockline-v5-production-mass',installed:false,baseArena:null,baseBoss:null,drawMs:0,maxDrawMs:0,samples:0};
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const smooth=t=>{t=clamp01(t);return t*t*(3-2*t);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const now=()=>Number(state?.time)||0;

  function boss01(){
    const id=state?.bossActiveId;
    return state?.entities?.enemies?.find(e=>e&&!e.dead&&e.id===id&&e.eventKind==='stage-01')||
      state?.entities?.enemies?.find(e=>e&&!e.dead&&e.kind==='stage-boss'&&e.eventKind==='stage-01')||null;
  }
  function motion(e){
    const info=window.stackfallStageOneMotionV3?.()||{},phase=info.phase||'idle',q=Number(info.q)||0;
    const angle=Number.isFinite(e?.stageRamAngle)?e.stageRamAngle:Number(e?.stageBodyAngle)||0;
    return{phase,q,angle};
  }
  function roundedRectPath(x,y,w,h,r){
    const rr=Math.max(0,Math.min(r,Math.abs(w)*.5,Math.abs(h)*.5));
    ctx.beginPath();ctx.moveTo(x+rr,y);ctx.lineTo(x+w-rr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rr);ctx.lineTo(x+w,y+h-rr);ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);ctx.lineTo(x+rr,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-rr);ctx.lineTo(x,y+rr);ctx.quadraticCurveTo(x,y,x+rr,y);ctx.closePath();
  }
  function poly(points,fill){
    if(!points?.length)return;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  }
  function lineBar(ax,ay,bx,by,width,outer,inner=null){
    const a=Math.atan2(by-ay,bx-ax),len=Math.hypot(bx-ax,by-ay);ctx.save();ctx.translate(ax,ay);ctx.rotate(a);
    roundedRectPath(0,-width*.5,len,width,Math.min(width*.45,7));ctx.fillStyle=outer;ctx.fill();
    if(inner){roundedRectPath(width*.65,-width*.16,Math.max(4,len-width*1.15),width*.32,Math.min(width*.14,3));ctx.fillStyle=inner;ctx.fill();}
    ctx.restore();
  }
  function phaseRig(m){
    let fold=0,compress=0,pull=0,drive=0,wedge=0,recoil=0,recover=0;
    if(m.phase==='ram-lock'){fold=smooth(m.q);}
    else if(m.phase==='ram-compress'){fold=1;compress=smooth(m.q);}
    else if(m.phase==='ram-pullback'){fold=1;compress=1-.28*smooth(m.q);pull=12+43*smooth(m.q);}
    else if(m.phase==='ram-ignite'){fold=1;compress=.72;pull=55+5*smooth(m.q);drive=smooth(m.q);wedge=.35+.65*smooth(m.q);}
    else if(m.phase==='ram-commit'){fold=1;compress=.28*(1-m.q);drive=1-.28*m.q;wedge=1;}
    else if(m.phase==='ram-recoil'){fold=1-.12*smooth(m.q);compress=.26*(1-m.q);wedge=1-.20*smooth(m.q);recoil=20*Math.sin(Math.PI*m.q);}
    else if(m.phase==='ram-recover'){fold=.88*(1-smooth(m.q));wedge=.80*(1-smooth(m.q));recover=smooth(m.q);}
    return{fold,compress,pull,drive,wedge,recoil,recover};
  }
  function localShapes(e){
    const s=window.stackfallStageBodyShapes?.(e)||[];
    const loc=part=>{const q=s.find(x=>x.part===part);return q?{x:q.x-e.x,y:q.y-e.y,a:Number(q.a)||0,hw:q.hw,hh:q.hh}:null;};
    return{all:s,chest:loc(0),left:loc(1),right:loc(2),core:loc(3)};
  }
  function steelGradient(w,h,bright=1){
    const g=ctx.createLinearGradient(-w*.8,-h,w*.85,h*.9);
    g.addColorStop(0,bright>1?'#8c9694':'#737f7e');g.addColorStop(.18,'#556163');g.addColorStop(.48,'#2a3437');g.addColorStop(.76,'#131b1e');g.addColorStop(1,'#080d0f');return g;
  }
  function steelDark(w,h){
    const g=ctx.createLinearGradient(-w,-h,w,h);g.addColorStop(0,'#313b3e');g.addColorStop(.42,'#171f22');g.addColorStop(1,'#070c0e');return g;
  }
  function transformedPoint(base,center,bodyCenter,m,rig){
    const ux=Math.cos(m.angle),uy=Math.sin(m.angle),nx=-uy,ny=ux,dx=base.x-center.x,dy=base.y-center.y;
    const axial=dx*ux+dy*uy,cross=dx*nx+dy*ny;
    const axialScale=1-.12*rig.compress,crossScale=1+.09*rig.compress;
    return{x:bodyCenter.x+ux*axial*axialScale+nx*cross*crossScale,y:bodyCenter.y+uy*axial*axialScale+ny*cross*crossScale,a:base.a};
  }
  function drawHydraulic(ax,ay,bx,by,width=16,damage=false){
    lineBar(ax,ay,bx,by,width,'#070c0e');
    const a=Math.atan2(by-ay,bx-ax),len=Math.hypot(bx-ax,by-ay);ctx.save();ctx.translate(ax,ay);ctx.rotate(a);
    roundedRectPath(width*.55,-width*.19,Math.max(8,len-width*1.0),width*.38,3);ctx.fillStyle=damage?'#8a745d':'#8c9691';ctx.fill();
    roundedRectPath(len*.46,-width*.12,Math.max(8,len*.22),width*.24,2);ctx.fillStyle='#a7652d';ctx.fill();ctx.restore();
  }
  function drawRearDrive(body,m,rig){
    if(rig.drive<=.02&&m.phase!=='ram-commit')return;
    const ux=Math.cos(m.angle),uy=Math.sin(m.angle),nx=-uy,ny=ux,power=m.phase==='ram-commit'?Math.max(.45,rig.drive):rig.drive;
    for(const side of[-1,1]){
      const x=body.x-ux*90+nx*side*31,y=body.y-uy*90+ny*side*31;
      ctx.save();ctx.translate(x,y);ctx.rotate(m.angle);
      poly([[-15,-11],[14,-9],[27,-4],[27,4],[14,9],[-15,11],[-23,0]],'#0a1012');
      ctx.fillStyle='#465153';roundedRectPath(-11,-5,23,10,3);ctx.fill();
      const len=24+42*power,g=ctx.createLinearGradient(-12,0,-12-len,0);g.addColorStop(0,`rgba(238,229,194,${.65*power})`);g.addColorStop(.28,`rgba(202,116,48,${.62*power})`);g.addColorStop(1,'rgba(113,73,45,0)');
      poly([[-13,-5],[-13-len,-10-power*4],[-13-len,10+power*4],[-13,5]],g);
      ctx.restore();
    }
  }
  function drawLoadingBraces(body,m,rig){
    if(!['ram-pullback','ram-ignite'].includes(m.phase))return;
    const q=m.phase==='ram-pullback'?smooth(m.q):1,ux=Math.cos(m.angle),uy=Math.sin(m.angle),nx=-uy,ny=ux;
    for(const side of[-1,1]){
      const ax=body.x-ux*54+nx*side*50,ay=body.y-uy*54+ny*side*50;
      const bx=body.x-ux*(118+28*q)+nx*side*(78+26*q),by=body.y-uy*(118+28*q)+ny*side*(78+26*q);
      drawHydraulic(ax,ay,bx,by,15,false);
      ctx.save();ctx.translate(bx,by);ctx.rotate(m.angle);ctx.globalAlpha=.72+.20*q;
      poly([[-22,-18],[13,-14],[26,0],[13,14],[-22,18],[-31,0]],'#151d20');
      ctx.fillStyle='#9b5d2b';roundedRectPath(-19,-4,25,8,2);ctx.fill();ctx.restore();
    }
  }
  function drawUnderframe(body,baseAngle,rig){
    ctx.save();ctx.translate(body.x,body.y+7);ctx.rotate(baseAngle);
    ctx.fillStyle='rgba(0,0,0,.58)';roundedRectPath(-164,-24,328,61,18);ctx.fill();
    ctx.fillStyle='#0b1113';roundedRectPath(-146,-19,292,48,14);ctx.fill();
    ctx.fillStyle='#303a3c';roundedRectPath(-125,-12,250,13,5);ctx.fill();
    ctx.fillStyle='#070b0d';roundedRectPath(-106,7,212,14,5);ctx.fill();
    ctx.globalAlpha=.68;ctx.fillStyle='#915629';roundedRectPath(-121,-8,38,6,2);ctx.fill();roundedRectPath(77,-8,38,6,2);ctx.fill();
    if(rig.compress>.05){ctx.globalAlpha=.22+.24*rig.compress;ctx.fillStyle='#b57a45';roundedRectPath(-52,-15,104,5,2);ctx.fill();}
    ctx.restore();
  }
  function drawCentralHull(body,baseAngle,e,m,rig){
    const phase2=Number(e.stagePhase)>=2,w=196,h=94,crush=rig.compress;
    ctx.save();ctx.translate(body.x,body.y);ctx.rotate(baseAngle);
    const sx=1-crush*.08,sy=1+crush*.055;ctx.scale(sx,sy);
    ctx.translate(7,10);poly([[-96,-37],[-67,-58],[58,-57],[95,-33],[105,9],[82,49],[28,62],[-67,57],[-104,25],[-108,-11]],'rgba(0,0,0,.58)');ctx.translate(-7,-10);
    const shell=steelGradient(w,h,1.06);
    poly([[-102,-31],[-69,-57],[55,-55],[96,-31],[103,4],[81,42],[27,55],[-66,51],[-101,22],[-106,-10]],shell);
    poly([[-73,-43],[-48,-55],[48,-51],[78,-34],[53,-13],[-54,-15]],phase2?'#606967':'#737d7b');
    poly([[-88,10],[79,8],[64,40],[20,50],[-61,45]],'#12191c');
    ctx.fillStyle='#050a0c';roundedRectPath(-51,-13,102,43,13);ctx.fill();
    const chamber=ctx.createLinearGradient(-40,0,40,0);chamber.addColorStop(0,'#10272a');chamber.addColorStop(.45,phase2?'#9cc6bd':'#789e98');chamber.addColorStop(.55,phase2?'#c9e5dc':'#9dc2bb');chamber.addColorStop(1,'#10272a');
    ctx.fillStyle=chamber;roundedRectPath(-35,-4,70,14,7);ctx.fill();
    ctx.fillStyle='#283235';poly([[-51,-14],[-15,-16],[-8,8],[-48,12]],ctx.fillStyle);poly([[51,-14],[15,-16],[8,8],[48,12]],ctx.fillStyle);
    ctx.fillStyle=phase2?'#70452d':'#a5632d';poly([[-91,-29],[-71,-43],[-61,-37],[-67,18],[-88,23]],ctx.fillStyle);
    ctx.fillStyle='rgba(210,218,211,.22)';roundedRectPath(-39,-47,67,4,2);ctx.fill();
    ctx.fillStyle='#090e10';roundedRectPath(-39,30,82,22,7);ctx.fill();ctx.fillStyle='#5e6866';roundedRectPath(-23,34,47,6,3);ctx.fill();
    if(phase2){
      poly([[55,-48],[89,-29],[95,-9],[70,-2],[49,-19]],'#0a1012');
      ctx.fillStyle='#a36b44';poly([[62,-44],[82,-29],[68,-22],[52,-31]],ctx.fillStyle);
      lineBar(58,-15,92,16,8,'#080d0f','#897d68');
    }
    ctx.restore();
  }
  function drawJaw(x,y,a,side,e,m,rig){
    const broken=side>0&&Number(e.stagePhase)>=2,w=broken?73:88,h=broken?86:103;
    ctx.save();ctx.translate(x,y);ctx.rotate(a);
    ctx.translate(6,8);poly([[-w*.55,-h*.45],[w*.30,-h*.50],[w*.58,-h*.18],[w*.52,h*.39],[w*.13,h*.55],[-w*.48,h*.47],[-w*.61,.02]],'rgba(0,0,0,.56)');ctx.translate(-6,-8);
    const g=steelGradient(w,h,broken?.78:.94);
    if(!broken){
      poly([[-w*.55,-h*.43],[w*.27,-h*.49],[w*.53,-h*.17],[w*.45,h*.36],[w*.10,h*.49],[-w*.45,h*.42],[-w*.58,.01]],g);
      poly([[-w*.39,-h*.29],[w*.10,-h*.33],[w*.31,-h*.12],[w*.13,h*.03],[-w*.43,.06]],'#11191c');
      poly([[-w*.38,h*.14],[w*.16,h*.10],[w*.02,h*.36],[-w*.31,h*.36]],'#060b0d');
      ctx.fillStyle='#875027';roundedRectPath(w*.05,-h*.38,w*.28,h*.17,4);ctx.fill();
      ctx.fillStyle='#7f8986';ctx.beginPath();ctx.arc(w*.18,-h*.04,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#171f21';ctx.beginPath();ctx.arc(w*.18,-h*.04,3,0,Math.PI*2);ctx.fill();
    }else{
      poly([[-w*.56,-h*.42],[w*.02,-h*.48],[w*.42,-h*.21],[w*.22,-.02],[w*.44,h*.18],[w*.05,h*.44],[-w*.46,h*.39],[-w*.60,.02]],g);
      poly([[w*.01,-h*.45],[w*.42,-h*.21],[w*.18,-h*.05],[-w*.03,-h*.17]],'#0a0f11');
      ctx.fillStyle='#8d806b';roundedRectPath(-w*.02,-h*.23,w*.38,6,3);ctx.fill();roundedRectPath(w*.04,-h*.10,w*.31,5,2);ctx.fill();
      ctx.strokeStyle='rgba(116,92,69,.72)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(w*.12,-h*.02);ctx.bezierCurveTo(w*.48,h*.03,w*.44,h*.25,w*.12,h*.39);ctx.stroke();
      ctx.fillStyle='#6f3d29';poly([[-w*.43,-h*.29],[-w*.24,-h*.39],[-w*.16,-h*.18],[-w*.38,-h*.11]],ctx.fillStyle);
    }
    const tooth=12+23*rig.wedge;ctx.fillStyle=broken?'#4e5755':'#697370';
    poly([[w*.22,-h*.24],[w*.22+tooth,-h*.16],[w*.24+tooth,h*.16],[w*.20,h*.24],[w*.08,h*.12],[w*.08,-h*.12]],ctx.fillStyle);
    ctx.restore();
  }
  function drawFrontKeel(body,m,rig){
    if(rig.fold<.18)return;
    const ux=Math.cos(m.angle),uy=Math.sin(m.angle),front=78+40*rig.wedge,x=body.x+ux*front,y=body.y+uy*front;
    ctx.save();ctx.translate(x,y);ctx.rotate(m.angle);
    ctx.translate(5,8);poly([[-37,-42],[10,-54],[52,-31],[68,0],[52,31],[10,54],[-37,42],[-50,0]],'rgba(0,0,0,.55)');ctx.translate(-5,-8);
    const g=steelGradient(125,105,1.02);poly([[-39,-38],[7,-50],[47,-29],[62,0],[47,29],[7,50],[-39,38],[-48,0]],g);
    poly([[-28,-25],[5,-34],[28,-20],[37,0],[28,20],[5,34],[-28,25],[-35,0]],'#11191c');
    ctx.fillStyle='#a0612c';roundedRectPath(-38,-18,12,36,4);ctx.fill();
    ctx.fillStyle='#707b78';roundedRectPath(-12,-29,15,58,4);ctx.fill();ctx.fillStyle='#141b1d';roundedRectPath(-8,-22,7,44,3);ctx.fill();
    if(m.phase==='ram-ignite'){
      ctx.globalAlpha=.22+.30*smooth(m.q);ctx.fillStyle='#d7aa70';poly([[42,-18],[65,0],[42,18],[34,0]],ctx.fillStyle);
    }
    ctx.restore();
    const neckA={x:body.x+ux*42,y:body.y+uy*42},neckB={x:body.x+ux*(front-35),y:body.y+uy*(front-35)};
    drawHydraulic(neckA.x,neckA.y,neckB.x,neckB.y,22,false);
  }
  function drawImpact(body,m,e){
    const age=now()-Number(e.stageRamRecoilAt||-999);if(age<0||age>.34)return;
    const q=clamp01(age/.34),alpha=1-q,ux=Math.cos(m.angle),uy=Math.sin(m.angle),nx=-uy,ny=ux,cx=body.x+ux*125,cy=body.y+uy*125;
    ctx.save();ctx.globalAlpha=.56*alpha;
    ctx.fillStyle='#b89d7b';for(let i=0;i<12;i++){const k=(i+1)/12,side=i%2?1:-1,dist=24+130*k*q,lat=10+82*k*q;ctx.save();ctx.translate(cx+ux*dist+nx*side*lat,cy+uy*dist+ny*side*lat);ctx.rotate(m.angle+side*(.35+k*.9));ctx.fillRect(-5,-2,10+9*k,4);ctx.restore();}
    ctx.globalAlpha=.24*alpha;ctx.strokeStyle='#d0b58f';ctx.lineWidth=7*(1-q)+1;ctx.beginPath();ctx.arc(cx,cy,34+112*q,m.angle-Math.PI*.63,m.angle+Math.PI*.63);ctx.stroke();ctx.restore();
  }
  function drawBossV5(e){
    const start=performance.now(),sh=localShapes(e);if(!sh.chest){V5.baseBoss?.(e);return;}
    const m=motion(e),rig=phaseRig(m),ux=Math.cos(m.angle),uy=Math.sin(m.angle),nx=-uy,ny=ux;
    const center={x:sh.chest.x,y:sh.chest.y},impactAge=now()-Number(e.stageRamRecoilAt||-999),jolt=impactAge>=0&&impactAge<.22?(1-impactAge/.22)*Math.sin(impactAge*120)*6:0;
    const body={x:center.x-ux*(rig.pull+rig.recoil)+nx*jolt*.36,y:center.y-uy*(rig.pull+rig.recoil)+ny*jolt*.36};
    const baseL=sh.left||{x:center.x-146,y:center.y+24,a:-.12},baseR=sh.right||{x:center.x+146,y:center.y+20,a:.10};
    const baseAngle=Math.atan2(baseR.y-baseL.y,baseR.x-baseL.x);
    let lp=transformedPoint(baseL,center,body,m,rig),rp=transformedPoint(baseR,center,body,m,rig);
    const targetL={x:body.x+ux*(73+24*rig.wedge)-nx*(58-12*rig.wedge),y:body.y+uy*(73+24*rig.wedge)-ny*(58-12*rig.wedge)};
    const targetR={x:body.x+ux*(76+27*rig.wedge)+nx*(58-12*rig.wedge),y:body.y+uy*(76+27*rig.wedge)+ny*(58-12*rig.wedge)};
    const fold=smooth(rig.fold);lp={x:mix(lp.x,targetL.x,fold),y:mix(lp.y,targetL.y,fold),a:mix(baseL.a,m.angle-.22,fold)};rp={x:mix(rp.x,targetR.x,fold),y:mix(rp.y,targetR.y,fold),a:mix(baseR.a,m.angle+.22,fold)};
    if(Number(e.stagePhase)>=2&&m.phase==='ram-recoil'){rp.x+=nx*Math.sin(m.q*Math.PI*5)*7;rp.y+=ny*Math.sin(m.q*Math.PI*5)*7;}
    ctx.save();ctx.shadowBlur=0;
    drawLoadingBraces(body,m,rig);
    drawRearDrive(body,m,rig);
    drawUnderframe(body,baseAngle,rig);
    drawHydraulic(body.x-38*Math.cos(baseAngle),body.y-38*Math.sin(baseAngle),lp.x,lp.y,18,false);
    drawHydraulic(body.x+38*Math.cos(baseAngle),body.y+38*Math.sin(baseAngle),rp.x,rp.y,18,Number(e.stagePhase)>=2);
    drawJaw(lp.x,lp.y,lp.a,-1,e,m,rig);drawJaw(rp.x,rp.y,rp.a,1,e,m,rig);
    drawCentralHull(body,baseAngle,e,m,rig);
    drawFrontKeel(body,m,rig);
    drawImpact(body,m,e);
    ctx.restore();
    const ms=performance.now()-start;V5.drawMs=ms;V5.maxDrawMs=Math.max(V5.maxDrawMs,ms);V5.samples++;
  }

  function drawDockingBed(e){
    if(typeof worldToScreen!=='function')return;const s=worldToScreen(e.x,e.y),a=Number(e.stageBodyAngle)||0;
    ctx.save();ctx.translate(s.x,s.y+38);ctx.rotate(a);ctx.globalAlpha=.42;
    for(const x of[-132,-44,44,132]){
      ctx.fillStyle='rgba(2,6,8,.80)';roundedRectPath(x-28,-19,56,38,8);ctx.fill();
      ctx.fillStyle='rgba(67,78,80,.68)';roundedRectPath(x-23,-13,46,20,5);ctx.fill();
      ctx.fillStyle='rgba(153,89,39,.60)';roundedRectPath(x-14,-7,28,5,2);ctx.fill();
    }
    ctx.fillStyle='rgba(4,9,11,.68)';roundedRectPath(-172,13,344,17,6);ctx.fill();ctx.restore();
  }
  function drawFloorRoute(e,m){
    const ram=e?.stageOneV2?.ram;if(!ram||typeof worldToScreen!=='function')return;const t=now();
    if(!(ram.warnUntil>t)&&m.phase!=='ram-commit'&&m.phase!=='ram-recoil')return;
    const a=worldToScreen(ram.x1,ram.y1),b=worldToScreen(ram.x2,ram.y2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ang=Math.atan2(dy,dx),w=Math.max(48,(e.contactR||64)*1.15);
    const progress=m.phase==='ram-lock'?.16*m.q:m.phase==='ram-compress'?.16+.28*m.q:m.phase==='ram-pullback'?.44+.32*m.q:m.phase==='ram-ignite'?.76+.24*m.q:1;
    const count=Math.max(5,Math.min(8,Math.round(len/92)));
    ctx.save();
    for(let i=1;i<=count;i++){
      const f=i/(count+1),x=a.x+dx*f,y=a.y+dy*f,on=f<=progress+.07,ignite=m.phase==='ram-ignite'&&on;
      ctx.save();ctx.translate(x,y);ctx.rotate(ang);
      ctx.globalAlpha=.28;ctx.fillStyle='#05090b';roundedRectPath(-11,-w*.88,22,w*1.76,6);ctx.fill();
      ctx.globalAlpha=on?.72:.20;ctx.fillStyle=on?'#313b3d':'#1b2325';roundedRectPath(-7,-w*.72,14,w*1.44,4);ctx.fill();
      ctx.globalAlpha=on?.92:.18;ctx.fillStyle=ignite?'#e1c28e':on?'#a96532':'#66706d';roundedRectPath(-4,-w*.56,8,w*.34,3);ctx.fill();roundedRectPath(-4,w*.22,8,w*.34,3);ctx.fill();
      if(on){ctx.globalAlpha=.22;ctx.fillStyle='#c77a3b';roundedRectPath(-2,-w*.14,4,w*.28,2);ctx.fill();}
      ctx.restore();
    }
    ctx.restore();
  }
  function drawArenaV5(){
    const e=boss01(),v=e?.stageOneV2,saved=v?.ram;
    if(v&&saved)v.ram=null;
    try{V5.baseArena?.();}finally{if(v&&saved)v.ram=saved;}
    if(!e)return;drawDockingBed(e);drawFloorRoute(e,motion(e));
  }
  function install(){
    const ready=window.stackfallStageOneMotionV4?.().installed===true;if(!ready)return false;
    try{
      if(typeof drawStageOneWardenArena==='function'&&drawStageOneWardenArena!==drawArenaV5){if(!V5.baseArena)V5.baseArena=drawStageOneWardenArena;drawStageOneWardenArena=drawArenaV5;window.drawStageOneWardenArena=drawArenaV5;}
      if(typeof drawCollapseWardenBody==='function'&&drawCollapseWardenBody!==drawBossV5){if(!V5.baseBoss)V5.baseBoss=drawCollapseWardenBody;drawCollapseWardenBody=drawBossV5;window.drawCollapseWardenBody=drawBossV5;}
      V5.installed=drawStageOneWardenArena===drawArenaV5&&drawCollapseWardenBody===drawBossV5;
    }catch(error){console.error('[stage01 production v5]',error);}
    return V5.installed;
  }
  let tries=0;const timer=setInterval(()=>{tries++;install();if(tries>80)clearInterval(timer);},75);setTimeout(install,0);window.addEventListener?.('load',install,{once:true});
  window.stackfallStageOneMotionV5=()=>({version:V5.version,installed:V5.installed,drawMs:+V5.drawMs.toFixed(3),maxDrawMs:+V5.maxDrawMs.toFixed(3),samples:V5.samples,baseV4:window.stackfallStageOneMotionV4?.()||null});
})();
