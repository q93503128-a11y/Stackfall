// Stage 1 / 폐쇄선 infrastructure integration pass v6.
// Keeps the v5 boss body, but makes the blockade itself a fixed part of the encounter:
// K-03 docks into a world-space enforcement gantry, loads against it, detaches for ram,
// then returns to the cradle. This layer is presentation-only.
(()=>{
  if(window.__stackfallStageOneReworkV6Loaded)return;
  window.__stackfallStageOneReworkV6Loaded=true;

  const V6={version:'lockline-v6-blockade-gantry',installed:false,baseArena:null,drawMs:0,maxDrawMs:0,samples:0};
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const smooth=t=>{t=clamp01(t);return t*t*(3-2*t);};
  function rr(x,y,w,h,r){
    const q=Math.max(0,Math.min(r,Math.abs(w)*.5,Math.abs(h)*.5));
    ctx.beginPath();ctx.moveTo(x+q,y);ctx.lineTo(x+w-q,y);ctx.quadraticCurveTo(x+w,y,x+w,y+q);ctx.lineTo(x+w,y+h-q);ctx.quadraticCurveTo(x+w,y+h,x+w-q,y+h);ctx.lineTo(x+q,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-q);ctx.lineTo(x,y+q);ctx.quadraticCurveTo(x,y,x+q,y);ctx.closePath();
  }
  function poly(points,fill){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
  function lineBar(ax,ay,bx,by,w,outer,inner=null,alpha=1){
    const ang=Math.atan2(by-ay,bx-ax),len=Math.hypot(bx-ax,by-ay);ctx.save();ctx.globalAlpha*=alpha;ctx.translate(ax,ay);ctx.rotate(ang);
    rr(0,-w*.5,len,w,Math.min(8,w*.4));ctx.fillStyle=outer;ctx.fill();
    if(inner){rr(w*.55,-w*.16,Math.max(5,len-w*1.05),w*.32,3);ctx.fillStyle=inner;ctx.fill();}
    ctx.restore();
  }
  function boss01(){
    const id=state?.bossActiveId;
    return state?.entities?.enemies?.find(e=>e&&!e.dead&&e.id===id&&e.eventKind==='stage-01')||state?.entities?.enemies?.find(e=>e&&!e.dead&&e.kind==='stage-boss'&&e.eventKind==='stage-01')||null;
  }
  function arena01(){const a=state?.stageBossArena;return a?.stageId==='stage-01'?a:null;}
  function attachment01(){
    const m=window.stackfallStageOneMotionV3?.()||{},phase=m.phase||'idle',q=Number(m.q)||0;
    if(phase==='idle'||phase==='ram-lock'||phase==='ram-compress'||phase==='ram-pullback')return 1;
    if(phase==='ram-ignite')return 1-smooth(q);
    if(phase==='ram-commit')return 0;
    if(phase==='ram-recoil')return .12*(1-q);
    if(phase==='ram-recover')return smooth(q);
    return 1;
  }
  function steel(x1,y1,x2,y2,bright=false){
    const g=ctx.createLinearGradient(x1,y1,x2,y2);g.addColorStop(0,bright?'#707c7b':'#515d5f');g.addColorStop(.18,bright?'#586463':'#394447');g.addColorStop(.52,'#222c2f');g.addColorStop(.82,'#11181b');g.addColorStop(1,'#070c0e');return g;
  }
  function drawTower(x,top,bottom,side,phase2,span){
    const w=Math.max(56,Math.min(108,span*.105)),lean=side*(phase2&&side>0?30:10),damage=phase2&&side>0;
    ctx.save();ctx.translate(x,top);ctx.rotate(lean*.0017);
    ctx.translate(7,8);poly([[-w*.48,0],[w*.31,-6],[w*.55,32],[w*.51,bottom-top-12],[w*.24,bottom-top+18],[-w*.49,bottom-top+10],[-w*.62,bottom-top-22],[-w*.60,26]],'rgba(0,0,0,.55)');ctx.translate(-7,-8);
    const g=steel(-w,0,w,bottom-top,true);poly([[-w*.46,4],[w*.27,-2],[w*.49,29],[w*.45,bottom-top-20],[w*.20,bottom-top+9],[-w*.44,bottom-top+4],[-w*.56,bottom-top-24],[-w*.54,28]],g);
    poly([[-w*.29,31],[w*.18,26],[w*.27,bottom-top-48],[w*.08,bottom-top-23],[-w*.30,bottom-top-20]],'#11191c');
    ctx.fillStyle=damage?'#704128':'#9a5b2a';rr(-w*.43,20,w*.14,Math.max(42,(bottom-top)*.55),3);ctx.fill();
    ctx.fillStyle='#070b0d';rr(-w*.18,49,w*.30,Math.max(38,(bottom-top)*.42),5);ctx.fill();
    ctx.fillStyle='rgba(184,195,191,.18)';rr(-w*.33,12,w*.49,4,2);ctx.fill();
    if(damage){
      poly([[w*.10,25],[w*.48,30],[w*.32,72],[w*.02,58]],'#080d0f');
      ctx.fillStyle='#897c66';rr(w*.03,38,w*.27,6,3);ctx.fill();rr(w*.01,54,w*.22,5,2);ctx.fill();
      ctx.strokeStyle='rgba(119,91,66,.70)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(w*.24,58);ctx.bezierCurveTo(w*.65,82,w*.56,121,w*.20,144);ctx.stroke();
    }
    ctx.restore();
  }
  function drawHeader(cx,top,span,phase2){
    const half=span*.5,gap=Math.max(150,span*.23),h=Math.max(48,Math.min(78,span*.07));
    const leftX=cx-half,rightX=cx+gap*.5,leftW=half-gap*.5-10,rightW=half-gap*.5-10;
    ctx.save();
    ctx.translate(0,8);poly([[leftX,top+7],[leftX+20,top-h*.55],[leftX+leftW-18,top-h*.48],[leftX+leftW+8,top+3],[leftX+leftW-17,top+h*.43],[leftX+17,top+h*.48]],'rgba(0,0,0,.52)');ctx.restore();
    poly([[leftX,top],[leftX+22,top-h*.58],[leftX+leftW-22,top-h*.50],[leftX+leftW+2,top-2],[leftX+leftW-20,top+h*.37],[leftX+18,top+h*.44]],steel(leftX,top-h,leftX+leftW,top+h,true));
    ctx.save();ctx.translate(phase2?9:0,phase2?7:0);ctx.rotate(phase2?.035:0);
    poly([[rightX,top-2],[rightX+22,top-h*.46],[rightX+rightW-20,top-h*.55],[rightX+rightW,top-1],[rightX+rightW-17,top+h*.46],[rightX+18,top+h*.36]],steel(rightX,top-h,rightX+rightW,top+h,phase2?false:true));ctx.restore();
    ctx.fillStyle='#0a1012';rr(leftX+28,top-10,Math.max(34,leftW-64),20,6);ctx.fill();ctx.fillStyle='#4e5959';rr(leftX+41,top-5,Math.max(18,leftW-90),5,2);ctx.fill();
    ctx.save();ctx.translate(phase2?9:0,phase2?7:0);ctx.rotate(phase2?.035:0);ctx.fillStyle='#0a1012';rr(rightX+31,top-10,Math.max(34,rightW-67),20,6);ctx.fill();ctx.fillStyle=phase2?'#67402b':'#4e5959';rr(rightX+43,top-5,Math.max(18,rightW-93),5,2);ctx.fill();ctx.restore();
    // Broken central locking teeth make the top beam read as one interrupted machine, not two bars.
    ctx.fillStyle='#151d20';poly([[cx-gap*.52,top-13],[cx-gap*.34,top-30],[cx-gap*.18,top-16],[cx-gap*.19,top+19],[cx-gap*.39,top+26]],ctx.fillStyle);
    ctx.save();ctx.translate(phase2?8:0,phase2?5:0);poly([[cx+gap*.18,top-16],[cx+gap*.37,top-29],[cx+gap*.53,top-11],[cx+gap*.42,top+24],[cx+gap*.20,top+18]],phase2?'#0b1113':'#151d20');ctx.restore();
  }
  function drawCradle(cx,cy,span,attach,bossScreen,phase2){
    const half=Math.min(span*.30,330),y=cy-4;
    ctx.save();ctx.globalAlpha=.62;
    ctx.fillStyle='rgba(4,9,11,.88)';rr(cx-half,y-19,half*2,38,12);ctx.fill();
    ctx.fillStyle='rgba(49,59,61,.92)';rr(cx-half+17,y-12,half*2-34,16,6);ctx.fill();
    ctx.fillStyle='rgba(8,13,15,.95)';rr(cx-half+55,y+6,half*2-110,15,5);ctx.fill();
    ctx.fillStyle=phase2?'#70442b':'#96592b';rr(cx-half+29,y-8,48,6,2);ctx.fill();rr(cx+half-77,y-8,48,6,2);ctx.fill();
    ctx.restore();
    if(!bossScreen||attach<=.02)return;
    const anchorY=y-1,targetY=bossScreen.y+22;
    const leftA={x:cx-half+55,y:anchorY},rightA={x:cx+half-55,y:anchorY};
    const leftB={x:bossScreen.x-93,y:targetY},rightB={x:bossScreen.x+93,y:targetY};
    lineBar(leftA.x,leftA.y,leftB.x,leftB.y,18,'#080d0f','#89918d',.30+.58*attach);
    lineBar(rightA.x,rightA.y,rightB.x,rightB.y,18,'#080d0f',phase2?'#786d5e':'#89918d',.30+.58*attach);
    ctx.save();ctx.globalAlpha=.20+.44*attach;ctx.fillStyle='#a96630';rr(leftA.x-13,leftA.y-6,26,12,4);ctx.fill();rr(rightA.x-13,rightA.y-6,26,12,4);ctx.fill();ctx.restore();
  }
  function drawFloorAnchors(cx,cy,span,phase2){
    const half=Math.min(span*.43,480);ctx.save();ctx.globalAlpha=.46;
    for(const side of[-1,1]){
      const x=cx+side*half;
      poly([[x-side*28,cy-26],[x+side*18,cy-18],[x+side*29,cy+22],[x-side*18,cy+34],[x-side*35,cy+10]],'#0b1113');
      ctx.fillStyle=phase2&&side>0?'#5b3a29':'#313b3d';rr(x-13,cy-12,26,31,7);ctx.fill();ctx.fillStyle='#8d5529';rr(x-7,cy-5,14,7,3);ctx.fill();
    }
    ctx.restore();
  }
  function drawBlockadeGantry(){
    const a=arena01(),e=boss01();if(!a||typeof worldToScreen!=='function')return;
    const start=performance.now(),p=worldToScreen(a.x,a.y),bp=e?worldToScreen(e.x,e.y):null,phase2=(a.phase||e?.stagePhase||1)>=2;
    const span=Math.max(300,Math.min(vw*.84,a.halfW*1.72)),height=Math.max(190,Math.min(vh*.43,a.halfH*1.0)),top=p.y-height*.62,bottom=p.y+height*.28,cx=p.x;
    const left=cx-span*.5,right=cx+span*.5;
    ctx.save();ctx.globalAlpha=.82;
    drawHeader(cx,top,span,phase2);drawTower(left,top+6,bottom,-1,phase2,span);drawTower(right,top+6,bottom,1,phase2,span);
    // Deep rear rails: thick, sparse, and fixed in world-space.
    ctx.globalAlpha=.42;lineBar(left+34,bottom-26,right-34,bottom-26,21,'#080d0f','#465153',1);
    ctx.globalAlpha=.28;lineBar(left+54,top+54,right-54,top+54,12,'#090f11','#586261',1);
    drawFloorAnchors(cx,bottom+17,span,phase2);
    drawCradle(cx,bottom-9,span,attachment01(),bp,phase2);
    ctx.restore();
    const ms=performance.now()-start;V6.drawMs=ms;V6.maxDrawMs=Math.max(V6.maxDrawMs,ms);V6.samples++;
  }
  function drawArenaV6(){
    V6.baseArena?.();
    drawBlockadeGantry();
  }
  function install(){
    if(window.stackfallStageOneMotionV5?.().installed!==true)return false;
    try{
      if(typeof drawStageOneWardenArena==='function'&&drawStageOneWardenArena!==drawArenaV6){
        if(!V6.baseArena)V6.baseArena=drawStageOneWardenArena;
        // Never wrap a late v3/v4 function as our base; wait until v5 has reclaimed it.
        if(drawStageOneWardenArena.name!=='drawArenaV5'&&V6.baseArena?.name!=='drawArenaV5')return false;
        if(drawStageOneWardenArena.name==='drawArenaV5')V6.baseArena=drawStageOneWardenArena;
        drawStageOneWardenArena=drawArenaV6;window.drawStageOneWardenArena=drawArenaV6;
      }
      V6.installed=typeof drawStageOneWardenArena==='function'&&drawStageOneWardenArena===drawArenaV6;
    }catch(error){console.error('[stage01 infrastructure v6]',error);}
    return V6.installed;
  }
  let tries=0;const timer=setInterval(()=>{tries++;install();if(tries>140)clearInterval(timer);},75);setTimeout(install,0);window.addEventListener?.('load',install,{once:true});
  window.stackfallStageOneInfrastructureV6=()=>({version:V6.version,installed:V6.installed,drawMs:+V6.drawMs.toFixed(3),maxDrawMs:+V6.maxDrawMs.toFixed(3),samples:V6.samples,attachment:+attachment01().toFixed(3),base:V6.baseArena?.name||null});
})();
