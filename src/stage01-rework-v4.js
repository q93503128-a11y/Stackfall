// Stage 1 / 폐쇄선 motion-art correction v4.
// Self-review pass: removes the ruler-like ram rails, strengthens whole-body loading,
// and makes the actual front ram assembly carry the attack read.
(()=>{
  if(window.__stackfallStageOneReworkV4Loaded)return;
  window.__stackfallStageOneReworkV4Loaded=true;

  const V4={version:'lockline-v4-ram-language',installed:false,baseArena:null,baseBoss:null,drawMs:0,maxDrawMs:0,samples:0};
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const smooth=t=>{t=clamp01(t);return t*t*(3-2*t);};
  const now=()=>Number(state?.time)||0;

  function boss01(){
    const id=state?.bossActiveId;
    return state?.entities?.enemies?.find(e=>e&&!e.dead&&e.id===id&&e.eventKind==='stage-01')||
      state?.entities?.enemies?.find(e=>e&&!e.dead&&e.kind==='stage-boss'&&e.eventKind==='stage-01')||null;
  }
  function motion(e){
    const info=window.stackfallStageOneMotionV3?.()||{},phase=info.phase||'idle',q=Number(info.q)||0,angle=Number.isFinite(e?.stageRamAngle)?e.stageRamAngle:0;
    return{phase,q,angle};
  }
  function roundedRectPath(x,y,w,h,r){
    const rr=Math.max(0,Math.min(r,Math.abs(w)*.5,Math.abs(h)*.5));
    ctx.beginPath();ctx.moveTo(x+rr,y);ctx.lineTo(x+w-rr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rr);ctx.lineTo(x+w,y+h-rr);ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);ctx.lineTo(x+rr,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-rr);ctx.lineTo(x,y+rr);ctx.quadraticCurveTo(x,y,x+rr,y);ctx.closePath();
  }
  function poly(points,fill){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
  function pullFor(m){
    if(m.phase==='ram-compress')return 8*smooth(m.q);
    if(m.phase==='ram-pullback')return 8+31*smooth(m.q);
    if(m.phase==='ram-ignite')return 39+5*smooth(m.q);
    if(m.phase==='ram-recoil')return 18*Math.sin(Math.PI*m.q);
    if(m.phase==='ram-recover')return 5*(1-m.q)*Math.sin(m.q*Math.PI*2.4);
    return 0;
  }
  function deployFor(m){
    if(m.phase==='ram-lock')return smooth(m.q);
    if(['ram-compress','ram-pullback','ram-ignite','ram-commit'].includes(m.phase))return 1;
    if(m.phase==='ram-recoil')return 1-.12*smooth(m.q);
    if(m.phase==='ram-recover')return .88*(1-smooth(m.q));
    return 0;
  }
  function localChest(e,m){
    const chest=window.stackfallStageBodyShapes?.(e)?.find(s=>s.part===0);if(!chest)return{x:0,y:0};
    const d=pullFor(m),ux=Math.cos(m.angle),uy=Math.sin(m.angle);return{x:chest.x-e.x-ux*d,y:chest.y-e.y-uy*d};
  }

  function drawLoadingBraces(e,m,cp){
    if(!['ram-pullback','ram-ignite'].includes(m.phase))return;
    const q=m.phase==='ram-pullback'?smooth(m.q):1,ux=Math.cos(m.angle),uy=Math.sin(m.angle),nx=-uy,ny=ux;
    ctx.save();ctx.globalAlpha=.35+.45*q;
    for(const side of[-1,1]){
      const ax=cp.x-ux*38+nx*side*42,ay=cp.y-uy*38+ny*side*42;
      const bx=cp.x-ux*(65+32*q)+nx*side*(58+18*q),by=cp.y-uy*(65+32*q)+ny*side*(58+18*q);
      const ang=Math.atan2(by-ay,bx-ax),len=Math.hypot(bx-ax,by-ay);ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);
      roundedRectPath(0,-7,len,14,5);ctx.fillStyle='#090e10';ctx.fill();roundedRectPath(8,-2.5,Math.max(8,len-14),5,2);ctx.fillStyle='#7c8581';ctx.fill();ctx.restore();
      ctx.save();ctx.translate(bx,by);ctx.rotate(m.angle);poly([[-12,-13],[10,-9],[17,0],[10,9],[-12,13],[-18,0]],'#1d2629');ctx.fillStyle='#9a5d2b';ctx.fillRect(-12,-3,15,6);ctx.restore();
    }
    ctx.restore();
  }

  function drawRamAssembly(e,m,cp){
    const deploy=deployFor(m);if(deploy<=.01)return;
    const ux=Math.cos(m.angle),uy=Math.sin(m.angle),front=58+31*deploy,x=cp.x+ux*front,y=cp.y+uy*front;
    ctx.save();
    // Telescoping neck: this is the attack source, not a detached warning marker.
    const neckX=cp.x+ux*34,neckY=cp.y+uy*34,ang=m.angle,len=Math.max(12,front-31);
    ctx.translate(neckX,neckY);ctx.rotate(ang);roundedRectPath(0,-15,len,30,8);ctx.fillStyle='#090f11';ctx.fill();roundedRectPath(5,-7,len-9,14,5);ctx.fillStyle='#5e6969';ctx.fill();ctx.fillStyle='#a7652d';ctx.fillRect(len*.54,-5,len*.22,10);ctx.restore();

    ctx.save();ctx.translate(x,y);ctx.rotate(m.angle);
    // Wide plow/lock face: large filled planes, no neon outline.
    ctx.translate(5,7);poly([[-28,-57],[18,-64],[43,-43],[52,0],[43,43],[18,64],[-28,57],[-42,28],[-42,-28]],'rgba(0,0,0,.52)');ctx.translate(-5,-7);
    const g=ctx.createLinearGradient(-45,-55,48,55);g.addColorStop(0,'#7b8685');g.addColorStop(.24,'#475356');g.addColorStop(.58,'#202a2e');g.addColorStop(1,'#0a0f11');
    poly([[-31,-51],[13,-58],[36,-39],[46,0],[36,39],[13,58],[-31,51],[-40,25],[-40,-25]],g);
    poly([[-23,-38],[8,-43],[24,-28],[31,0],[24,28],[8,43],[-23,38],[-30,18],[-30,-18]],'#121a1d');
    ctx.fillStyle='#9f602b';roundedRectPath(-32,-23,13,46,4);ctx.fill();
    ctx.fillStyle='#697574';roundedRectPath(-10,-31,18,62,5);ctx.fill();ctx.fillStyle='#141b1d';roundedRectPath(-6,-25,10,50,4);ctx.fill();
    // Two locking teeth visually close before release.
    const tooth=18+12*deploy;ctx.fillStyle='#313b3e';poly([[11,-44],[35,-35],[35,-17],[6,-23]],ctx.fillStyle);poly([[11,44],[35,35],[35,17],[6,23]],ctx.fillStyle);
    ctx.fillStyle='rgba(213,224,218,.32)';ctx.fillRect(-16,-39,25,3);
    if(m.phase==='ram-ignite'){
      const pulse=.30+.70*smooth(m.q);ctx.globalAlpha=.24+.36*pulse;ctx.fillStyle='#d99a54';poly([[35,-27],[62,0],[35,27],[28,0]],ctx.fillStyle);
    }
    ctx.restore();
  }

  function drawImpactFloor(e,m,cp){
    const t=now()-Number(e.stageRamRecoilAt||-999);if(t<0||t>.30)return;
    const q=clamp01(t/.30),alpha=1-q,ux=Math.cos(m.angle),uy=Math.sin(m.angle),nx=-uy,ny=ux,cx=cp.x+ux*105,cy=cp.y+uy*105;
    ctx.save();ctx.globalAlpha=.46*alpha;ctx.strokeStyle='#c5aa88';ctx.lineCap='round';
    for(const side of[-1,1]){ctx.lineWidth=4-2*q;ctx.beginPath();ctx.moveTo(cx+nx*side*18,cy+ny*side*18);ctx.quadraticCurveTo(cx+ux*(42+52*q)+nx*side*(58+20*q),cy+uy*(42+52*q)+ny*side*(58+20*q),cx+ux*(72+85*q)+nx*side*(82+38*q),cy+uy*(72+85*q)+ny*side*(82+38*q));ctx.stroke();}
    ctx.fillStyle='#b58f67';for(let i=0;i<10;i++){const side=i%2?1:-1,k=(i+2)/12,dist=44+116*k*q,lat=14+76*k;ctx.save();ctx.translate(cx+ux*dist+nx*side*lat,cy+uy*dist+ny*side*lat);ctx.rotate(m.angle+side*(.4+k));ctx.fillRect(-5,-2,10+8*k,4);ctx.restore();}
    ctx.restore();
  }

  function drawBossV4(e){
    const start=performance.now(),m=motion(e);
    ctx.save();
    // Extra whole-body load: obvious silhouette change before the burst.
    let axis=1,cross=1;
    if(m.phase==='ram-compress'){axis=1-.11*smooth(m.q);cross=1+.055*smooth(m.q);}
    else if(m.phase==='ram-pullback'){axis=.89+.03*smooth(m.q);cross=1.055-.015*smooth(m.q);}
    else if(m.phase==='ram-ignite'){axis=.93;cross=1.035;}
    if(axis!==1||cross!==1){ctx.rotate(m.angle);ctx.scale(axis,cross);ctx.rotate(-m.angle);}
    V4.baseBoss?.(e);ctx.restore();
    const cp=localChest(e,m);ctx.save();drawLoadingBraces(e,m,cp);drawRamAssembly(e,m,cp);drawImpactFloor(e,m,cp);ctx.restore();
    const ms=performance.now()-start;V4.drawMs=ms;V4.maxDrawMs=Math.max(V4.maxDrawMs,ms);V4.samples++;
  }

  function drawRouteTelegraph(e){
    const ram=e?.stageOneV2?.ram;if(!ram||typeof worldToScreen!=='function')return;
    const m=motion(e),t=now();if(!(ram.warnUntil>t)&&m.phase!=='ram-commit'&&m.phase!=='ram-recoil')return;
    const a=worldToScreen(ram.x1,ram.y1),b=worldToScreen(ram.x2,ram.y2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux,w=Math.max(30,(e.contactR||64)*.60),ang=Math.atan2(dy,dx);
    const progress=m.phase==='ram-lock'?.18*m.q:m.phase==='ram-compress'?.18+.30*m.q:m.phase==='ram-pullback'?.48+.30*m.q:m.phase==='ram-ignite'?.78+.22*m.q:1;
    ctx.save();
    // A recessed route wake rather than two ruler-like danger rails.
    ctx.globalAlpha=.075;ctx.fillStyle='#61706f';poly([[a.x+nx*w,a.y+ny*w],[b.x+nx*w,b.y+ny*w],[b.x-nx*w,b.y-ny*w],[a.x-nx*w,a.y-ny*w]],ctx.fillStyle);
    const count=Math.max(6,Math.min(12,Math.round(len/58)));
    for(let i=1;i<=count;i++){
      const f=i/(count+1),x=a.x+dx*f,y=a.y+dy*f,on=f<=progress+.055,hot=m.phase==='ram-ignite'&&f<.25;
      ctx.save();ctx.translate(x,y);ctx.rotate(ang);
      ctx.globalAlpha=on?.46:.15;ctx.fillStyle='#101719';roundedRectPath(-3,-w*.88,6,w*1.76,2);ctx.fill();
      for(const side of[-1,1]){ctx.globalAlpha=on?.92:.20;ctx.fillStyle=hot?'#e5d7ad':on?'#bd7437':'#667170';roundedRectPath(-7,side*w*.70-3,14,6,2);ctx.fill();}
      ctx.restore();
    }
    // The center guide wakes sequentially; it is navigation hardware, not a hitbox outline.
    ctx.globalAlpha=.42;ctx.strokeStyle=m.phase==='ram-ignite'?'#d9a15f':'#9e6a3b';ctx.lineWidth=3;ctx.setLineDash([8,18]);ctx.lineDashOffset=-now()*45;ctx.beginPath();ctx.moveTo(a.x+ux*22,a.y+uy*22);ctx.lineTo(b.x-ux*18,b.y-uy*18);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
  }

  function drawArenaV4(){
    const e=boss01(),v=e?.stageOneV2,saved=v?.ram;
    if(v&&saved)v.ram=null;
    try{V4.baseArena?.();}finally{if(v&&saved)v.ram=saved;}
    if(e)drawRouteTelegraph(e);
  }

  function install(){
    const ready=window.stackfallStageOneMotionV3?.().installed===true;if(!ready)return false;
    try{
      if(typeof drawStageOneWardenArena==='function'&&drawStageOneWardenArena!==drawArenaV4){if(!V4.baseArena)V4.baseArena=drawStageOneWardenArena;drawStageOneWardenArena=drawArenaV4;window.drawStageOneWardenArena=drawArenaV4;}
      if(typeof drawCollapseWardenBody==='function'&&drawCollapseWardenBody!==drawBossV4){if(!V4.baseBoss)V4.baseBoss=drawCollapseWardenBody;drawCollapseWardenBody=drawBossV4;window.drawCollapseWardenBody=drawBossV4;}
      V4.installed=drawStageOneWardenArena===drawArenaV4&&drawCollapseWardenBody===drawBossV4;
    }catch(error){console.error('[stage01 motion v4]',error);}
    return V4.installed;
  }
  let tries=0;const timer=setInterval(()=>{tries++;install();if(tries>32)clearInterval(timer);},90);setTimeout(install,0);window.addEventListener?.('load',install,{once:true});
  window.stackfallStageOneMotionV4=()=>({version:V4.version,installed:V4.installed,drawMs:+V4.drawMs.toFixed(3),maxDrawMs:+V4.maxDrawMs.toFixed(3),samples:V4.samples,baseV3:window.stackfallStageOneMotionV3?.()||null});
})();
