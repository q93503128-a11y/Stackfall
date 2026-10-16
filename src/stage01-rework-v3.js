// Stage 1 / 폐쇄선 motion-art pass v3.
// Dedicated presentation layer for K-03: mass-first silhouette, material planes,
// body-authored telegraphing and a multi-stage ram animation.
(()=>{
  if(window.__stackfallStageOneReworkV3Loaded)return;
  window.__stackfallStageOneReworkV3Loaded=true;

  const V3={version:'lockline-v3-motion',installed:false,baseArena:null,baseBoss:null,drawMs:0,maxDrawMs:0,samples:0};
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const smooth=t=>{t=clamp01(t);return t*t*(3-2*t);};
  const outBack=t=>{t=clamp01(t)-1;return 1+t*t*((1.70158+1)*t+1.70158);};
  const now=()=>Number(state?.time)||0;

  function boss01(){
    const id=state?.bossActiveId;
    return state?.entities?.enemies?.find(e=>e&&!e.dead&&e.id===id&&e.eventKind==='stage-01')||
      state?.entities?.enemies?.find(e=>e&&!e.dead&&e.kind==='stage-boss'&&e.eventKind==='stage-01')||null;
  }

  function motion01(e){
    const t=now(),age=Math.max(0,t-Number(e?.stageActionAt||t));
    const angle=Number.isFinite(e?.stageRamAngle)?e.stageRamAngle:0;
    if(e?.stageAction!=='ram')return{phase:'idle',q:0,angle,age,pull:0,lock:0,compress:0,stretch:0,ignite:0,recoil:0};
    if(Number(e.stageRamWindupUntil||0)>t){
      const total=1.18,q=clamp01(age/total);
      if(q<.17)return{phase:'ram-lock',q:q/.17,angle,age,pull:0,lock:smooth(q/.17),compress:0,stretch:0,ignite:0,recoil:0};
      if(q<.48){const p=(q-.17)/.31;return{phase:'ram-compress',q:p,angle,age,pull:8*smooth(p),lock:1,compress:.13*smooth(p),stretch:0,ignite:0,recoil:0};}
      if(q<.80){const p=(q-.48)/.32;return{phase:'ram-pullback',q:p,angle,age,pull:8+31*smooth(p),lock:1,compress:.13-.04*smooth(p),stretch:0,ignite:0,recoil:0};}
      const p=(q-.80)/.20;return{phase:'ram-ignite',q:p,angle,age,pull:39+5*smooth(p),lock:1,compress:.08,stretch:.02*smooth(p),ignite:smooth(p),recoil:0};
    }
    if(Number(e.stageRamUntil||0)>t){
      const d=Math.max(.05,Number(e.stageRamUntil)-Number(e.stageRamStart||t)),q=clamp01((t-Number(e.stageRamStart||t))/d);
      return{phase:'ram-commit',q,angle,age,pull:0,lock:1,compress:.05*(1-q),stretch:.11*Math.sin(Math.PI*q),ignite:1-q*.45,recoil:0};
    }
    const recoilAge=t-Number(e.stageRamRecoilAt||-999);
    if(recoilAge>=0&&recoilAge<.30){const q=clamp01(recoilAge/.30);return{phase:'ram-recoil',q,angle,age,pull:0,lock:1-smooth(q)*.30,compress:.08*(1-q),stretch:0,ignite:0,recoil:18*Math.sin(Math.PI*q)};}
    if(recoilAge>=.30&&recoilAge<.88){const q=clamp01((recoilAge-.30)/.58);return{phase:'ram-recover',q,angle,age,pull:0,lock:.70*(1-smooth(q)),compress:0,stretch:0,ignite:0,recoil:5*(1-q)*Math.sin(q*Math.PI*2.4)};}
    return{phase:'idle',q:0,angle,age,pull:0,lock:0,compress:0,stretch:0,ignite:0,recoil:0};
  }

  function roundedRectPath(x,y,w,h,r){
    const rr=Math.max(0,Math.min(r,Math.abs(w)*.5,Math.abs(h)*.5));
    ctx.beginPath();ctx.moveTo(x+rr,y);ctx.lineTo(x+w-rr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rr);ctx.lineTo(x+w,y+h-rr);ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);ctx.lineTo(x+rr,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-rr);ctx.lineTo(x,y+rr);ctx.quadraticCurveTo(x,y,x+rr,y);ctx.closePath();
  }

  function fillPoly(points,fill){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();}

  function steelGradient(w,h,bright=.72){
    const g=ctx.createLinearGradient(-w,-h,w,h);
    g.addColorStop(0,`rgba(${Math.round(112*bright)},${Math.round(124*bright)},${Math.round(126*bright)},1)`);
    g.addColorStop(.22,'#3d494d');g.addColorStop(.54,'#20292d');g.addColorStop(.78,'#11181b');g.addColorStop(1,'#080c0e');return g;
  }

  function drawPiston(ax,ay,bx,by,width=11){
    const ang=Math.atan2(by-ay,bx-ax),len=Math.hypot(bx-ax,by-ay);
    ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);
    roundedRectPath(0,-width*.55,len,width*1.1,width*.45);ctx.fillStyle='#080d0f';ctx.fill();
    roundedRectPath(width*.4,-width*.22,Math.max(0,len-width*.9),width*.44,width*.2);ctx.fillStyle='#77817e';ctx.fill();
    roundedRectPath(len*.58,-width*.14,Math.max(6,len*.22),width*.28,width*.12);ctx.fillStyle='#b56d2d';ctx.fill();
    ctx.restore();
  }

  function partLocal(e,s,m,chest){
    let x=s.x-e.x,y=s.y-e.y;
    const ux=Math.cos(m.angle),uy=Math.sin(m.angle);
    x-=ux*m.pull;y-=uy*m.pull;
    x-=ux*m.recoil;y-=uy*m.recoil;
    if((s.part===1||s.part===2)&&chest&&m.lock>0){
      const tx=(chest.x-s.x)*.16*m.lock,ty=(chest.y-s.y)*.16*m.lock;x+=tx;y+=ty;
    }
    return{x,y,a:s.a};
  }

  function drawHull(s,damage=0){
    const w=s.hw,h=s.hh;
    ctx.save();ctx.rotate(s.a||0);
    ctx.translate(5,9);fillPoly([[-w*.95,-h*.66],[w*.78,-h*.72],[w*1.02,-h*.18],[w*.90,h*.72],[-w*.82,h*.82],[-w*1.02,h*.18]],'rgba(0,0,0,.52)');ctx.translate(-5,-9);
    fillPoly([[-w*.98,-h*.48],[-w*.58,-h*.92],[w*.55,-h*.84],[w*.98,-h*.34],[w*.88,h*.58],[w*.38,h*.88],[-w*.58,h*.80],[-w*.98,h*.35]],steelGradient(w,h,1));
    fillPoly([[-w*.70,-h*.55],[-w*.40,-h*.78],[w*.46,-h*.70],[w*.72,-h*.40],[w*.52,-h*.08],[-w*.42,-h*.12]],'#667174');
    fillPoly([[-w*.72,h*.18],[w*.70,h*.12],[w*.48,h*.66],[-w*.48,h*.68]],'#11191c');
    fillPoly([[-w*.43,-h*.04],[w*.38,-h*.02],[w*.50,h*.24],[-w*.50,h*.30]],'#252f32');
    ctx.fillStyle=damage>0?'#7d4025':'#a5612a';roundedRectPath(-w*.82,-h*.23,w*.18,h*.55,3);ctx.fill();
    ctx.fillStyle='rgba(192,205,202,.28)';roundedRectPath(-w*.30,-h*.69,w*.48,3,1.5);ctx.fill();
    ctx.fillStyle='#070b0d';roundedRectPath(-w*.18,h*.52,w*.62,7,3);ctx.fill();
    ctx.restore();
  }

  function drawClamp(s,side,m){
    const w=s.hw,h=s.hh,damage=side>0&&Number(s?.damageState||0)>0;
    ctx.save();ctx.rotate(s.a||0);
    fillPoly([[-w*.92,-h*.78],[w*.48,-h*.86],[w*.98,-h*.18],[w*.74,h*.76],[-w*.66,h*.86],[-w,h*.18]],'rgba(0,0,0,.48)');
    fillPoly([[-w*.86,-h*.63],[w*.43,-h*.72],[w*.86,-h*.14],[w*.66,h*.60],[-w*.61,h*.70],[-w*.92,h*.14]],steelGradient(w,h,side<0?.92:.80));
    fillPoly([[-w*.70,-h*.40],[w*.24,-h*.45],[w*.54,-h*.12],[w*.16,h*.08],[-w*.73,h*.12]],'#141d20');
    fillPoly([[-w*.64,h*.18],[w*.26,h*.18],[w*.08,h*.56],[-w*.54,h*.60]],'#060a0c');
    ctx.fillStyle=damage?'#5b2c20':'#8f5529';roundedRectPath(w*.17,-h*.56,w*.43,h*.26,4);ctx.fill();
    ctx.fillStyle='#89938f';ctx.beginPath();ctx.arc(w*.33,-h*.03,Math.max(4,h*.12),0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#171f21';ctx.beginPath();ctx.arc(w*.33,-h*.03,Math.max(2,h*.055),0,Math.PI*2);ctx.fill();
    if(m.lock>.05){const q=m.lock;ctx.fillStyle=`rgba(173,199,194,${.12+.20*q})`;roundedRectPath(-w*.62,-h*.48,w*.48,4+4*q,2);ctx.fill();}
    ctx.restore();
  }

  function drawCore(s,phase2=false){
    const w=s.hw,h=s.hh;ctx.save();ctx.rotate(s.a||0);
    const shell=ctx.createLinearGradient(-w,-h,w,h);shell.addColorStop(0,'#4b5657');shell.addColorStop(.42,'#192225');shell.addColorStop(1,'#080d0f');
    ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(4,8,w*1.05,h*.98,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=shell;ctx.beginPath();ctx.ellipse(0,0,w,h*.88,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#071012';ctx.beginPath();ctx.ellipse(0,0,w*.66,h*.56,0,0,Math.PI*2);ctx.fill();
    const core=ctx.createRadialGradient(-w*.10,-h*.10,2,0,0,w*.58);core.addColorStop(0,phase2?'#f3ffff':'#d9f3ef');core.addColorStop(.23,phase2?'#93d9d8':'#69a9a7');core.addColorStop(.58,'#2c5b5c');core.addColorStop(1,'#0a1a1c');ctx.fillStyle=core;ctx.beginPath();ctx.ellipse(0,0,w*.46,h*.38,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(220,241,236,.23)';fillPoly([[-w*.68,-h*.18],[-w*.40,-h*.55],[-w*.15,-h*.43],[-w*.33,-h*.05]],ctx.fillStyle);fillPoly([[w*.68,-h*.18],[w*.40,-h*.55],[w*.15,-h*.43],[w*.33,-h*.05]],ctx.fillStyle);
    ctx.restore();
  }

  function drawDriveVents(e,m,chestPos){
    if(m.phase==='idle'||m.phase==='ram-lock'||m.phase==='ram-compress')return;
    const ux=Math.cos(m.angle),uy=Math.sin(m.angle),rearX=chestPos.x-ux*78,rearY=chestPos.y-uy*78,nx=-uy,ny=ux;
    const power=m.phase==='ram-ignite'?(.35+.65*m.ignite):m.phase==='ram-commit'?(.72+.28*m.ignite):.18;
    for(const side of[-1,1]){
      const x=rearX+nx*side*28,y=rearY+ny*side*28;
      ctx.save();ctx.translate(x,y);ctx.rotate(m.angle);
      fillPoly([[-10,-8],[18,-5],[26,0],[18,5],[-10,8]],'#0a0f11');
      if(power>.2){const len=18+34*power;const g=ctx.createLinearGradient(-12,0,-12-len,0);g.addColorStop(0,`rgba(226,238,220,${.72*power})`);g.addColorStop(.32,`rgba(207,127,55,${.52*power})`);g.addColorStop(1,'rgba(84,64,45,0)');ctx.fillStyle=g;fillPoly([[-8,-4],[-8-len,-8],[-8-len,8],[-8,4]],g);}
      ctx.restore();
    }
  }

  function drawCommitAfterimages(e,m,shapes){
    if(m.phase!=='ram-commit')return;
    const ux=Math.cos(m.angle),uy=Math.sin(m.angle),speed=Math.hypot(Number(e.stageMotionX)||0,Number(e.stageMotionY)||0),strength=clamp01(speed/620);
    if(strength<.08)return;
    ctx.save();ctx.globalCompositeOperation='source-over';
    for(let i=3;i>=1;i--){const d=i*(10+18*strength),alpha=(.055+.025*(4-i))*strength;ctx.save();ctx.translate(-ux*d,-uy*d);ctx.globalAlpha=alpha;const chest=shapes.find(s=>s.part===0);if(chest){const p=partLocal(e,chest,m,chest);ctx.translate(p.x,p.y);ctx.rotate(chest.a||0);ctx.fillStyle='#a5b5b2';fillPoly([[-chest.hw*.84,-chest.hh*.50],[chest.hw*.72,-chest.hh*.55],[chest.hw*.90,0],[chest.hw*.64,chest.hh*.48],[-chest.hw*.72,chest.hh*.54],[-chest.hw*.90,0]],ctx.fillStyle);}ctx.restore();}
    ctx.restore();
  }

  function drawImpactConsequences(e,m){
    const t=now()-Number(e.stageRamRecoilAt||-999);if(t<0||t>.34)return;
    const ux=Math.cos(m.angle),uy=Math.sin(m.angle),nx=-uy,ny=ux,q=clamp01(t/.34),spread=46+118*q,alpha=1-q;
    ctx.save();ctx.globalAlpha=.55*alpha;ctx.fillStyle='#d1b18c';
    for(let i=0;i<8;i++){const side=i%2?1:-1,k=(i+1)/8,x=ux*(34+spread*k)+nx*side*(8+44*k),y=uy*(34+spread*k)+ny*side*(8+44*k);ctx.save();ctx.translate(x,y);ctx.rotate(m.angle+side*(.45+.55*k));ctx.fillRect(-4,-1.5,8+8*k,3);ctx.restore();}
    ctx.globalAlpha=.28*alpha;ctx.strokeStyle='#cdb08d';ctx.lineWidth=5*(1-q)+1;ctx.beginPath();ctx.arc(ux*30,uy*30,38+80*q,m.angle-Math.PI*.62,m.angle+Math.PI*.62);ctx.stroke();
    ctx.restore();
  }

  function drawBossV3(e){
    const start=typeof performance!=='undefined'?performance.now():0;
    const shapes=window.stackfallStageBodyShapes?.(e)||[];
    if(!shapes.length){if(V3.baseBoss)V3.baseBoss(e);return;}
    const chest=shapes.find(s=>s.part===0),left=shapes.find(s=>s.part===1),right=shapes.find(s=>s.part===2),core=shapes.find(s=>s.part===3),m=motion01(e),ux=Math.cos(m.angle),uy=Math.sin(m.angle);
    ctx.save();ctx.shadowBlur=0;
    if(m.phase==='ram-commit'&&m.stretch>0){ctx.rotate(m.angle);ctx.scale(1+m.stretch,1-m.stretch*.42);ctx.rotate(-m.angle);}
    drawCommitAfterimages(e,m,shapes);
    const cp=chest?partLocal(e,chest,m,chest):{x:0,y:0};
    const lp=left?partLocal(e,left,m,chest):null,rp=right?partLocal(e,right,m,chest):null,kp=core?partLocal(e,core,m,chest):null;
    if(lp)drawPiston(cp.x-ux*10,cp.y-uy*10,lp.x,lp.y,13);
    if(rp)drawPiston(cp.x-ux*10,cp.y-uy*10,rp.x,rp.y,13);
    ctx.save();ctx.translate(-uy*7,ux*7);ctx.globalAlpha=.48;ctx.fillStyle='#05090a';roundedRectPath(cp.x-120,cp.y+42,240,18,6);ctx.fill();ctx.restore();
    drawDriveVents(e,m,cp);
    if(left&&lp){ctx.save();ctx.translate(lp.x,lp.y);drawClamp(left,-1,m);ctx.restore();}
    if(right&&rp){ctx.save();ctx.translate(rp.x,rp.y);drawClamp(right,1,m);ctx.restore();}
    if(chest){ctx.save();ctx.translate(cp.x,cp.y);ctx.scale(1+m.compress*.16,1-m.compress);drawHull(chest,e.stagePhase>=2?.7:0);ctx.restore();}
    if(core&&kp){ctx.save();ctx.translate(kp.x,kp.y);drawCore(core,e.stagePhase>=2);ctx.restore();}
    if(m.phase==='ram-lock'||m.phase==='ram-compress'||m.phase==='ram-pullback'||m.phase==='ram-ignite'){
      const q=m.phase==='ram-lock'?m.q:1,frontX=cp.x+ux*92,frontY=cp.y+uy*92;ctx.save();ctx.translate(frontX,frontY);ctx.rotate(m.angle);ctx.fillStyle=`rgba(194,137,76,${.18+.30*q})`;roundedRectPath(-18,-42,36,84,8);ctx.fill();ctx.fillStyle='#171d1f';roundedRectPath(8,-31,18,62,5);ctx.fill();ctx.restore();
    }
    drawImpactConsequences(e,m);
    ctx.restore();
    if(start){const ms=performance.now()-start;V3.drawMs=ms;V3.maxDrawMs=Math.max(V3.maxDrawMs,ms);V3.samples++;}
  }

  function drawRamRailTelegraph(e){
    const v=e?.stageOneV2,ram=v?.ram;if(!ram)return;
    const m=motion01(e),t=now();
    if(!(ram.warnUntil>t)&&m.phase!=='ram-commit'&&m.phase!=='ram-recoil')return;
    if(typeof worldToScreen!=='function')return;
    const a=worldToScreen(ram.x1,ram.y1),b=worldToScreen(ram.x2,ram.y2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux,w=Math.max(28,(e.contactR||64)*.58);
    ctx.save();ctx.lineCap='round';
    for(const side of[-1,1]){
      ctx.strokeStyle='rgba(8,13,15,.82)';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(a.x+nx*w*side,a.y+ny*w*side);ctx.lineTo(b.x+nx*w*side,b.y+ny*w*side);ctx.stroke();
      ctx.strokeStyle='rgba(112,126,125,.24)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x+nx*w*side,a.y+ny*w*side);ctx.lineTo(b.x+nx*w*side,b.y+ny*w*side);ctx.stroke();
    }
    const progress=m.phase==='ram-lock'?.18*m.q:m.phase==='ram-compress'?.18+.30*m.q:m.phase==='ram-pullback'?.48+.30*m.q:m.phase==='ram-ignite'?.78+.22*m.q:1;
    const lamps=9;
    for(let i=1;i<=lamps;i++){
      const f=i/(lamps+1),x=a.x+dx*f,y=a.y+dy*f,on=f<=progress+.06,hot=m.phase==='ram-ignite'&&f<.28;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle=on?(hot?'rgba(232,222,184,.92)':'rgba(196,121,55,.78)'):'rgba(73,81,80,.24)';roundedRectPath(-8,-3,16,6,2);ctx.fill();ctx.restore();
    }
    if(m.phase==='ram-ignite'){ctx.globalAlpha=.20+.22*m.q;ctx.fillStyle='#d99b55';fillPoly([[a.x+ux*18+nx*w*.72,a.y+uy*18+ny*w*.72],[a.x+ux*70,a.y+uy*70],[a.x+ux*18-nx*w*.72,a.y+uy*18-ny*w*.72]],ctx.fillStyle);}
    ctx.restore();
  }

  function drawArenaV3(){
    const e=boss01(),ram=e?.stageOneV2?.ram;
    if(V3.baseArena){
      let warn=null;
      if(ram){warn=ram.warnUntil;ram.warnUntil=0;}
      try{V3.baseArena();}finally{if(ram)ram.warnUntil=warn;}
    }
    if(e)drawRamRailTelegraph(e);
  }

  function install(){
    try{
      if(typeof drawStageOneWardenArena==='function'&&drawStageOneWardenArena!==drawArenaV3){if(!V3.baseArena)V3.baseArena=drawStageOneWardenArena;drawStageOneWardenArena=drawArenaV3;window.drawStageOneWardenArena=drawArenaV3;}
      if(typeof drawCollapseWardenBody==='function'&&drawCollapseWardenBody!==drawBossV3){if(!V3.baseBoss)V3.baseBoss=drawCollapseWardenBody;drawCollapseWardenBody=drawBossV3;window.drawCollapseWardenBody=drawBossV3;}
      V3.installed=typeof drawStageOneWardenArena==='function'&&drawStageOneWardenArena===drawArenaV3&&typeof drawCollapseWardenBody==='function'&&drawCollapseWardenBody===drawBossV3;
    }catch(error){console.error('[stage01 motion v3]',error);}
    return V3.installed;
  }

  let tries=0;const timer=setInterval(()=>{tries++;if(install()&&tries>6||tries>40)clearInterval(timer);},90);setTimeout(install,0);if(typeof window.addEventListener==='function')window.addEventListener('load',install,{once:true});

  window.stackfallStageOneMotionV3=()=>{
    const e=boss01(),m=e?motion01(e):null;
    return{version:V3.version,installed:V3.installed,phase:m?.phase||null,q:m?+m.q.toFixed(3):null,drawMs:+V3.drawMs.toFixed(3),maxDrawMs:+V3.maxDrawMs.toFixed(3),samples:V3.samples,action:e?.stageAction||null,ramActive:!!(e&&(Number(e.stageRamWindupUntil||0)>now()||Number(e.stageRamUntil||0)>now())),bodyAngle:e?.stageBodyAngle||0};
  };
})();
