(()=>{
  'use strict';

  const baseDrawBackground=drawBackground;
  const baseDrawEliteShape=drawEliteShape;
  const basePhysicalObject=window.stackfallDrawStagePhysicalObject;
  const basePhysicalWarnings=window.stackfallDrawStagePhysicalWarnings;
  const baseStageBossSkill=window.updateStageBossSkill;
  const baseBodyShapes=window.stackfallStageBodyShapes;
  const baseClampBoss=window.stackfallClampStageBossToArena;
  const baseRealmOverlay=drawRealmCinematicOverlay;

  const isStageOne=()=>window.stackfallIsStageRun?.()===true&&state.runSelection?.stageId==='stage-01';
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n);};

  function stageOneRouteEchoes(){
    const spacing=880,ix=Math.floor(player.x/spacing),iy=Math.floor(player.y/spacing),now=state.time||0;
    ctx.save();ctx.lineCap='round';
    for(let gy=iy-2;gy<=iy+2;gy++)for(let gx=ix-2;gx<=ix+2;gx++){
      const h=hash(gx,gy);if(h<.36)continue;
      const wx=gx*spacing+(h-.5)*260,wy=gy*spacing+(hash(gx+4,gy-3)-.5)*220,p=worldToScreen(wx,wy),rot=(hash(gx-2,gy+5)-.5)*1.7,r=150+h*145;
      if(p.x<-r*2||p.x>vw+r*2||p.y<-r*2||p.y>vh+r*2)continue;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(rot);
      const alpha=.055+h*.055;ctx.globalAlpha=alpha;ctx.fillStyle=h>.72?'#6278b8':'#416d8f';
      ctx.beginPath();ctx.moveTo(-r,-r*.13);ctx.quadraticCurveTo(-r*.28,-r*.37,r*.75,-r*.12);ctx.lineTo(r,r*.04);ctx.quadraticCurveTo(r*.15,r*.16,-r*.88,r*.13);ctx.closePath();ctx.fill();
      ctx.globalAlpha=alpha*2.25;ctx.strokeStyle=h>.72?'#8799df':'#72c4d5';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-r*.92,0);ctx.quadraticCurveTo(-r*.10,-r*.16,r*.88,0);ctx.stroke();
      ctx.globalAlpha=alpha*3.1;ctx.fillStyle=h>.72?'#c7d4ff':'#a8f0f3';for(const side of[-1,1]){ctx.beginPath();ctx.arc(side*r*.72,side*r*.045,2.2+h*1.4,0,TAU);ctx.fill();}
      ctx.restore();
    }

    // Rare broken closure halos: large motifs, not a repeated grid.
    const haloSpacing=2300,hi=Math.round(player.y/haloSpacing),haloY=hi*haloSpacing+620,hp=worldToScreen(player.x+(hi%2?250:-230),haloY);
    if(hp.y>-430&&hp.y<vh+430){const scale=clamp(.55+Math.abs(hp.y-vh*.5)/Math.max(1,vh)*.18,.55,.78),r=Math.min(vw,vh)*.34/scale;ctx.save();ctx.translate(hp.x,hp.y);ctx.scale(scale,scale);ctx.rotate(-.18);ctx.globalAlpha=.085;ctx.strokeStyle='#91a4e8';ctx.lineWidth=26;ctx.beginPath();ctx.arc(0,0,r,-2.70,-.68);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r,.42,2.40);ctx.stroke();ctx.globalAlpha=.18;ctx.strokeStyle='#9eeaf0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r,-2.58,-1.22);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r,.55,1.78);ctx.stroke();ctx.restore();}

    // A few route pulses drift through the world and retain the original Stackfall energy language.
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<4;i++){
      const phase=(now*.055+i*.27)%1,wy=player.y+(phase-.5)*vh*1.8,wx=player.x+(i-1.5)*vw*.24,p=worldToScreen(wx,wy),len=80+i*22;
      ctx.globalAlpha=.055*(1-Math.abs(phase-.5)*1.5);const g=ctx.createLinearGradient(p.x-len,p.y,p.x+len,p.y);g.addColorStop(0,'rgba(100,210,236,0)');g.addColorStop(.5,'rgba(134,227,242,.8)');g.addColorStop(1,'rgba(100,210,236,0)');ctx.fillStyle=g;ctx.fillRect(p.x-len,p.y-1,len*2,2);
    }
    ctx.restore();
  }

  function drawStageOneBackground(){
    if(typeof drawSpaceBackground==='function')drawSpaceBackground();else baseDrawBackground();
    ctx.save();const tint=ctx.createRadialGradient(vw*.5,vh*.48,0,vw*.5,vh*.48,Math.max(vw,vh)*.72);tint.addColorStop(0,'rgba(35,58,112,.08)');tint.addColorStop(.62,'rgba(18,29,71,.05)');tint.addColorStop(1,'rgba(0,2,12,.24)');ctx.fillStyle=tint;ctx.fillRect(0,0,vw,vh);ctx.restore();
    stageOneRouteEchoes();
  }

  drawBackground=function stageOneRebootBackground(){if(isStageOne()){drawStageOneBackground();return;}return baseDrawBackground();};

  function drawStageOnePhysicalObject(o){
    const p=worldToScreen(o.x,o.y),hw=Math.max(8,Number(o.hw)||42),hh=Math.max(6,Number(o.hh)||18),lift=Math.max(0,Number(o.height)||0),pulse=.86+.14*Math.sin((state.time||0)*4.2+(o.variant||0));
    ctx.save();ctx.translate(p.x,p.y-lift*.06);ctx.rotate(o.a||0);
    if(o.kind==='bulkhead'){
      const g=ctx.createLinearGradient(-hw,0,hw,0);g.addColorStop(0,'rgba(56,74,132,.10)');g.addColorStop(.5,'rgba(106,142,212,.38)');g.addColorStop(1,'rgba(56,74,132,.10)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-hw,-hh*.72);ctx.quadraticCurveTo(0,-hh*1.18,hw,-hh*.72);ctx.lineTo(hw,hh*.72);ctx.quadraticCurveTo(0,hh*1.18,-hw,hh*.72);ctx.closePath();ctx.fill();ctx.globalAlpha=.78;ctx.strokeStyle='#8de4ee';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-hw*.88,0);ctx.quadraticCurveTo(0,-hh*.30,hw*.88,0);ctx.stroke();
    }else if(o.kind==='girder'){
      ctx.globalAlpha=.62;ctx.fillStyle='#20294a';ctx.beginPath();ctx.moveTo(-hw,-hh*.22);ctx.lineTo(hw*.68,-hh*.62);ctx.lineTo(hw,0);ctx.lineTo(hw*.68,hh*.62);ctx.lineTo(-hw,hh*.22);ctx.closePath();ctx.fill();ctx.globalAlpha=.82;ctx.strokeStyle='#a1b0f0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-hw*.84,0);ctx.lineTo(hw*.78,0);ctx.stroke();
    }else{
      ctx.globalAlpha=.68;ctx.fillStyle=o.kind==='salvage'?'#2d2850':'#27395e';ctx.beginPath();ctx.moveTo(-hw*.86,-hh*.54);ctx.lineTo(hw*.40,-hh);ctx.lineTo(hw,0);ctx.lineTo(hw*.33,hh);ctx.lineTo(-hw*.86,hh*.42);ctx.lineTo(-hw,0);ctx.closePath();ctx.fill();ctx.globalAlpha=.58;ctx.strokeStyle=o.kind==='salvage'?'#b49bea':'#82d5e5';ctx.lineWidth=1.3;ctx.stroke();
    }
    if(o.active){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.16+.12*pulse;ctx.fillStyle='#dffcff';ctx.beginPath();ctx.ellipse(0,0,Math.max(18,hw*.72),Math.max(10,hh*.82),0,0,TAU);ctx.fill();}
    ctx.restore();
  }

  window.stackfallDrawStagePhysicalObject=function stageOnePhysicalRenderer(o){if(isStageOne()&&o?.stageId==='stage-01'){drawStageOnePhysicalObject(o);return;}return basePhysicalObject?.(o);};
  window.stackfallDrawStagePhysicalWarnings=function stageOnePhysicalWarnings(){
    if(!isStageOne())return basePhysicalWarnings?.();const list=typeof stagePhysicalObjects==='function'?stagePhysicalObjects():[];
    for(const o of list){if(!o||o.dead||o.age>=o.warn)continue;const x=Number.isFinite(o.toX)?o.toX:o.x,y=Number.isFinite(o.toY)?o.toY:o.y,p=worldToScreen(x,y),hw=Math.max(18,Number(o.hw)||48),hh=Math.max(14,Number(o.hh)||28),q=clamp(o.age/Math.max(.01,o.warn),0,1),pulse=.45+.30*Math.sin((state.time||0)*6+q*5);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(o.angle||o.a||0);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.06+.08*q;const glow=ctx.createRadialGradient(0,0,0,0,0,Math.max(hw,hh));glow.addColorStop(0,'rgba(173,228,255,.95)');glow.addColorStop(1,'rgba(111,127,229,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(0,0,hw,hh,0,0,TAU);ctx.fill();ctx.globalAlpha=.22+.20*pulse;ctx.strokeStyle='#b8d7ff';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,0,hw*(.72+.16*q),hh*(.72+.16*q),0,0,TAU);ctx.stroke();ctx.restore();}
  };

  function bossPose(e){
    const r=Number(e.visualR)||104,ram=e.stage01Ram||{},mode=ram.mode||'idle',p=clamp(Number(ram.progress)||0,0,1),phase=Number(e.stagePhase)||1;
    let close=.12,stretch=1,core=1,trail=0,burst=0;
    if(mode==='brace'){close=.12+.28*ease(p);core=1+.08*p;}
    else if(mode==='compress'){close=.40+.38*ease(p);stretch=1-.10*p;core=1+.22*p;}
    else if(mode==='charge'){close=.78+.16*ease(p);stretch=.90+.24*p;core=1.22+.35*p;trail=.35+.65*p;}
    else if(mode==='dash'){close=.88;stretch=1.28;core=1.42;trail=1;}
    else if(mode==='impact'){close=.34+.22*(1-p);stretch=1.12-.18*p;core=1.62-.48*p;burst=1-p;}
    else if(mode==='recover'){close=.34*(1-p)+.12*p;stretch=.94+.06*p;core=1.10-.10*p;}
    return{r,mode,p,phase,close,stretch,core,trail,burst};
  }

  function drawClosurePetal(r,side,close,phase){
    ctx.save();ctx.scale(1,side);ctx.rotate(side*(.18-close*.28));ctx.translate(close*r*.10,-close*r*.08);
    const g=ctx.createLinearGradient(-r*.55,-r*.35,r*.98,r*.24);g.addColorStop(0,phase>=2&&side>0?'rgba(119,59,118,.78)':'rgba(38,49,91,.86)');g.addColorStop(.48,phase>=2&&side>0?'rgba(220,105,165,.72)':'rgba(91,106,174,.84)');g.addColorStop(1,'rgba(20,25,54,.92)');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(-r*.70,-r*.12);ctx.bezierCurveTo(-r*.15,-r*.57,r*.64,-r*.53,r*1.08,-r*.09);ctx.bezierCurveTo(r*.76,r*.16,r*.18,r*.28,-r*.48,r*.19);ctx.closePath();ctx.fill();
    ctx.globalAlpha=.58;ctx.strokeStyle=phase>=2&&side>0?'#f3a4cf':'#b8c7ff';ctx.lineWidth=1.45;ctx.beginPath();ctx.moveTo(-r*.46,-r*.08);ctx.quadraticCurveTo(r*.20,-r*.34,r*.83,-r*.09);ctx.stroke();ctx.restore();
  }

  function drawStageOneBoss(e){
    const pose=bossPose(e),{r,phase,close,stretch,core,trail,burst}=pose,now=state.time||0,angle=Number.isFinite(e.stage01Angle)?e.stage01Angle:Math.PI/2;
    ctx.save();ctx.rotate(angle);ctx.scale(stretch,1);
    if(trail>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.12+.20*trail;const tail=ctx.createLinearGradient(-r*2.15,0,-r*.35,0);tail.addColorStop(0,'rgba(95,166,255,0)');tail.addColorStop(.7,phase>=2?'rgba(231,112,180,.24)':'rgba(110,216,246,.28)');tail.addColorStop(1,'rgba(231,249,255,.68)');ctx.fillStyle=tail;ctx.beginPath();ctx.moveTo(-r*2.15,-r*.16);ctx.lineTo(-r*.22,-r*.30);ctx.lineTo(-r*.22,r*.30);ctx.lineTo(-r*2.15,r*.16);ctx.closePath();ctx.fill();ctx.restore();}

    drawClosurePetal(r,-1,close,phase);drawClosurePetal(r,1,close,phase);

    // Four satellite locks preserve the geometric/cosmic Stackfall silhouette.
    for(let i=0;i<4;i++){const a=i*TAU/4+Math.PI/4+Math.sin(now*.55)*.025,rr=r*(.72-close*.18),x=Math.cos(a)*rr,y=Math.sin(a)*rr,s=r*(i%2?.105:.125);ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/4+now*(i%2?.025:-.018));ctx.globalAlpha=.78;ctx.fillStyle=phase>=2&&i===1?'#d96fae':'#778bd0';ctx.fillRect(-s,-s,s*2,s*2);ctx.globalAlpha=.78;ctx.strokeStyle='#e4eeff';ctx.lineWidth=1;ctx.strokeRect(-s,-s,s*2,s*2);ctx.restore();}

    const body=ctx.createRadialGradient(-r*.13,-r*.17,2,0,0,r*.62);body.addColorStop(0,'#effcff');body.addColorStop(.18,phase>=2?'#f3badc':'#b9edff');body.addColorStop(.49,phase>=2?'#7f4d9e':'#506daf');body.addColorStop(1,'#080b1c');ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(0,0,r*.54,r*.42,0,0,TAU);ctx.fill();
    ctx.globalAlpha=.66;ctx.strokeStyle=phase>=2?'#ef9dca':'#9fdcf0';ctx.lineWidth=1.7;ctx.beginPath();ctx.ellipse(0,0,r*.70,r*.31,-.18,0,TAU);ctx.stroke();ctx.globalAlpha=1;

    const cp=(.86+.14*Math.sin(now*5.1))*core,cg=ctx.createRadialGradient(-r*.04,-r*.05,1,0,0,r*.26*core);cg.addColorStop(0,'#ffffff');cg.addColorStop(.26,phase>=2?'#ffd9ee':'#e8fdff');cg.addColorStop(.55,phase>=2?'#ff79bd':'#6fe5f1');cg.addColorStop(1,'rgba(52,70,160,.03)');ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(r*.23*cp,0);ctx.lineTo(0,r*.23*cp);ctx.lineTo(-r*.23*cp,0);ctx.lineTo(0,-r*.23*cp);ctx.closePath();ctx.fill();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,r*.055*core,0,TAU);ctx.fill();
    if(burst>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.28*burst;ctx.strokeStyle=phase>=2?'#ffb7dc':'#bceeff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r*(.75+burst*.55),0,TAU);ctx.stroke();}
    if(e.hit){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.18;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,0,r*.72,r*.48,0,0,TAU);ctx.fill();}
    ctx.restore();
  }

  drawEliteShape=function stageOneEliteShape(e){if(e?.kind==='stage-boss'&&e.eventKind==='stage-01'){drawStageOneBoss(e);return;}return baseDrawEliteShape(e);};

  function stageOneShapes(e){
    const pose=bossPose(e),r=pose.r,angle=Number.isFinite(e.stage01Angle)?e.stage01Angle:Math.PI/2,c=Math.cos(angle),s=Math.sin(angle),parts=e.stage01RebootShapes||(e.stage01RebootShapes=[{},{},{}]),local=[{x:0,y:0,rx:r*.58*pose.stretch,ry:r*.45},{x:r*.20,y:-r*(.36-pose.close*.13),rx:r*.64*pose.stretch,ry:r*.20},{x:r*.20,y:r*(.36-pose.close*.13),rx:r*.64*pose.stretch,ry:r*.20}];
    for(let i=0;i<parts.length;i++){const d=local[i],p=parts[i],cx=e.x+d.x*c-d.y*s,cy=e.y+d.x*s+d.y*c,steps=i===0?10:8;p.kind='polygon';p.part=i;p.x=cx;p.y=cy;p.hw=d.rx;p.hh=d.ry;p.a=angle;p.points=p.points||[];p.points.length=steps;for(let j=0;j<steps;j++){const a=j/steps*TAU,lx=Math.cos(a)*d.rx,ly=Math.sin(a)*d.ry,q=p.points[j]||(p.points[j]={});q.x=cx+lx*c-ly*s;q.y=cy+lx*s+ly*c;}}
    return parts;
  }
  window.stackfallStageBodyShapes=e=>e?.eventKind==='stage-01'?stageOneShapes(e):baseBodyShapes?.(e)||e?.stageBodyShapes||[];
  window.stackfallClampStageBossToArena=e=>{if(!(e?.kind==='stage-boss'&&e.eventKind==='stage-01'))return baseClampBoss?.(e);const arena=state.stageBossArena;if(arena?.stageId!=='stage-01')return;const pad=(Number(e.visualR)||104)*.78;e.x=clamp(e.x,arena.x-arena.halfW+pad,arena.x+arena.halfW-pad);e.y=clamp(e.y,arena.y-arena.halfH+pad,arena.y+arena.halfH-pad);stageOneShapes(e);};

  function beginRam(e){
    const dx=player.x-e.x,dy=player.y-e.y,angle=Math.atan2(dy,dx),distance=clamp(Math.hypot(dx,dy)+145,330,520);e.stage01Angle=angle;e.stage01Ram={mode:'brace',age:0,duration:.31,progress:0,originX:e.x,originY:e.y,targetX:e.x+Math.cos(angle)*distance,targetY:e.y+Math.sin(angle)*distance,hit:false,impact:false};e.contactSafeUntil=(state.time||0)+2.3;audio.stageAttack?.('stage-01','ram-charge');
  }

  function advanceRam(e,dt){
    const r=e.stage01Ram;if(!r)return false;r.age+=dt;r.progress=clamp(r.age/Math.max(.01,r.duration),0,1);const next=(mode,duration)=>{r.mode=mode;r.age=0;r.duration=duration;r.progress=0;};
    if(r.mode==='brace'&&r.progress>=1)next('compress',.29);
    else if(r.mode==='compress'&&r.progress>=1){next('charge',.24);audio.stageAttack?.('stage-01','ram-charge');}
    else if(r.mode==='charge'&&r.progress>=1){next('dash',.43);audio.stageAttack?.('stage-01','ram-release');}
    else if(r.mode==='dash'){
      const t=easeOut(r.progress);e.x=lerp(r.originX,r.targetX,t);e.y=lerp(r.originY,r.targetY,t);stageOneShapes(e);
      if(!r.hit&&Math.hypot(player.x-e.x,player.y-e.y)<(Number(e.contactR)||62)+player.r+18){r.hit=true;hurtPlayer(Math.max(8,e.damage*.72),'stage-closure-ram');state.hitStop=Math.max(state.hitStop||0,.045);}
      if(r.progress>=1){next('impact',.19);if(!r.impact){r.impact=true;shockwave(e.x,e.y,e.stagePhase>=2?'#f58ac5':'#8fe9f3',170,.30,3.5);spawnParticle(e.x,e.y,e.stagePhase>=2?'#ffc5e5':'#d8fbff',9,170,3.2);state.camera.shake=Math.max(state.camera.shake,8);audio.stageAttack?.('stage-01','shutter-slam');}}
    }else if(r.mode==='impact'&&r.progress>=1){r.recoverX=e.x;r.recoverY=e.y;next('recover',.68);}
    else if(r.mode==='recover'){
      const hx=player.x-Math.cos(e.stage01Angle)*(e.stagePhase>=2?225:255),hy=player.y-Math.sin(e.stage01Angle)*(e.stagePhase>=2?225:255),t=ease(r.progress);e.x=lerp(r.recoverX,hx,t);e.y=lerp(r.recoverY,hy,t);stageOneShapes(e);if(r.progress>=1){e.stage01Ram=null;e.stage01Cooldown=e.stagePhase>=2?1.45:1.90;}}
    return true;
  }

  window.updateStageBossSkill=function stageOneBossSkill(e,dt){
    if(!(e?.kind==='stage-boss'&&e.eventKind==='stage-01'))return baseStageBossSkill?.(e,dt);if(e.dead)return;
    const ratio=e.maxHp>0?e.hp/e.maxHp:1,nextPhase=ratio<=.52?2:1;if(nextPhase!==e.stagePhase){e.stagePhase=nextPhase;e.stage01Cooldown=.80;spawnParticle(e.x,e.y,nextPhase>=2?'#f095c7':'#a6eeff',10,140,3);shockwave(e.x,e.y,nextPhase>=2?'#f095c7':'#a6eeff',122,.32,2.8);}
    e.contactSafeUntil=(state.time||0)+.16;if(advanceRam(e,dt))return;
    const desired=Math.atan2(player.y-e.y,player.x-e.x);e.stage01Angle=Number.isFinite(e.stage01Angle)?e.stage01Angle+Math.atan2(Math.sin(desired-e.stage01Angle),Math.cos(desired-e.stage01Angle))*Math.min(1,dt*2.15):desired;
    const dist=e.stagePhase>=2?225:255,hx=player.x-Math.cos(e.stage01Angle)*dist,hy=player.y-Math.sin(e.stage01Angle)*dist;e.x=lerp(e.x,hx,Math.min(1,dt*.67));e.y=lerp(e.y,hy,Math.min(1,dt*.67));stageOneShapes(e);
    e.stage01Cooldown=(Number.isFinite(e.stage01Cooldown)?e.stage01Cooldown:1.10)-dt;if(e.stage01Cooldown<=0)beginRam(e);
  };

  drawRealmCinematicOverlay=function stageOneRealmOverlay(){
    const trn=state.realmTransition;if(!(isStageOne()&&trn?.owner==='stage-01-boss-entry'))return baseRealmOverlay();const p=clamp(trn.elapsed/trn.duration,0,1),fade=Math.sin(Math.PI*p),rise=ease(clamp((p-.06)/.68,0,1));
    ctx.save();ctx.globalAlpha=fade*.62;ctx.fillStyle='rgba(2,4,16,.76)';ctx.fillRect(0,0,vw,vh);ctx.restore();ctx.save();ctx.translate(vw*.5,lerp(vh*.24,vh*.40,rise));ctx.scale(.62+.38*rise,.62+.38*rise);ctx.globalAlpha=fade;drawStageOneBoss({visualR:104,stagePhase:1,stage01Angle:Math.PI/2,stage01Ram:{mode:p<.48?'brace':'compress',progress:rise},phase:trn.elapsed});ctx.restore();ctx.save();ctx.globalAlpha=fade;ctx.textAlign='center';ctx.fillStyle='#f1f6ff';ctx.shadowBlur=18;ctx.shadowColor='#8cddec';ctx.font=`900 ${Math.round(clamp(vw*.045,30,52))}px "Black Han Sans",sans-serif`;ctx.fillText(trn.title||'CLOSURE',vw*.5,vh*.62);ctx.shadowBlur=0;ctx.fillStyle='rgba(178,203,232,.82)';ctx.font='800 12px "IBM Plex Sans KR",sans-serif';ctx.fillText(GAME_SETTINGS.language==='ko'?'폐쇄 신호가 응답한다':'THE CLOSURE SIGNAL ANSWERS',vw*.5,vh*.62+31);ctx.restore();
  };

  window.stackfallStage01RebootDiagnostics=()=>({active:isStageOne(),boss:state.entities.enemies.find(e=>e?.kind==='stage-boss'&&e.eventKind==='stage-01')?.stage01Ram?.mode||'none',physical:typeof stagePhysicalObjects==='function'?stagePhysicalObjects().length:0,style:'stackfall-cosmic-reboot'});
})();
