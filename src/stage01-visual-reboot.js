(()=>{
  'use strict';

  const baseDrawBackground=drawBackground;
  const baseDrawEliteShape=drawEliteShape;
  const basePhysicalObject=window.stackfallDrawStagePhysicalObject;
  const basePhysicalWarnings=window.stackfallDrawStagePhysicalWarnings;
  const baseStageBossSkill=window.updateStageBossSkill;
  const baseRealmOverlay=drawRealmCinematicOverlay;

  const isStageOne=()=>window.stackfallIsStageRun?.()===true&&state.runSelection?.stageId==='stage-01';
  const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n);};

  function cutPanelPath(g,x,y,w,h,cut=22){
    g.beginPath();g.moveTo(x+cut,y);g.lineTo(x+w-cut,y);g.lineTo(x+w,y+cut);g.lineTo(x+w,y+h-cut);g.lineTo(x+w-cut,y+h);g.lineTo(x+cut,y+h);g.lineTo(x,y+h-cut);g.lineTo(x,y+cut);g.closePath();
  }

  function drawStageOneBackground(){
    const t=(state.time||0),grad=ctx.createLinearGradient(0,0,0,vh);
    grad.addColorStop(0,'#060b19');grad.addColorStop(.54,'#040816');grad.addColorStop(1,'#02040d');ctx.fillStyle=grad;ctx.fillRect(0,0,vw,vh);

    // Distant stars are sparse and subdued; the route itself must own the image.
    const starCell=170,minX=Math.floor((player.x-vw*.7)/starCell),maxX=Math.ceil((player.x+vw*.7)/starCell),minY=Math.floor((player.y-vh*.7)/starCell),maxY=Math.ceil((player.y+vh*.7)/starCell);
    ctx.save();
    for(let gy=minY;gy<=maxY;gy++)for(let gx=minX;gx<=maxX;gx++){
      const r=hash(gx,gy);if(r<.38)continue;const p=worldToScreen(gx*starCell+hash(gx+9,gy)*120,gy*starCell+hash(gx,gy+7)*120),a=.12+r*.24;
      ctx.globalAlpha=a;ctx.fillStyle=r>.83?'#dcecff':'#7794c8';ctx.fillRect(p.x,p.y,r>.9?2:1,r>.9?2:1);
    }
    ctx.restore();

    // Broad world-space route plates. No thin neon grid: large readable masses first.
    const cellW=560,cellH=340,gx0=Math.floor((player.x-vw*.9)/cellW)-1,gx1=Math.ceil((player.x+vw*.9)/cellW)+1,gy0=Math.floor((player.y-vh*.9)/cellH)-1,gy1=Math.ceil((player.y+vh*.9)/cellH)+1;
    for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){
      if((gx+gy)%3===1)continue;const wx=gx*cellW,wy=gy*cellH,p=worldToScreen(wx,wy),j=hash(gx*3,gy*5),w=cellW*(.76+j*.08),h=cellH*(.62+j*.06);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate((j-.5)*.035);
      const slab=ctx.createLinearGradient(-w*.5,-h*.5,w*.5,h*.5);slab.addColorStop(0,'rgba(27,38,61,.72)');slab.addColorStop(.48,'rgba(12,19,34,.88)');slab.addColorStop(1,'rgba(5,10,22,.92)');ctx.fillStyle=slab;cutPanelPath(ctx,-w*.5,-h*.5,w,h,24);ctx.fill();
      ctx.globalAlpha=.48;ctx.fillStyle='#263553';ctx.fillRect(-w*.42,-h*.43,w*.31,6);ctx.fillStyle='#17233c';ctx.fillRect(w*.08,h*.34,w*.27,8);
      if((gx-gy)%4===0){ctx.globalAlpha=.70;ctx.fillStyle='#89dff0';ctx.fillRect(-w*.34,h*.16,w*.12,5);ctx.globalAlpha=.18;ctx.fillRect(-w*.34,h*.16,w*.48,5);}
      ctx.restore();
    }

    // Massive route ribs pass through the play space and make it feel like a place, not a backdrop.
    const ribSpacing=920,base=Math.floor(player.y/ribSpacing);
    for(let i=-2;i<=2;i++){
      const wy=(base+i)*ribSpacing,p=worldToScreen(player.x,wy),fade=1-Math.min(1,Math.abs(p.y-vh*.5)/(vh*.9));if(fade<=0)continue;
      ctx.save();ctx.globalAlpha=.28*fade;ctx.fillStyle='#17233a';ctx.fillRect(-vw*.08,p.y-30,vw*1.16,60);ctx.fillStyle='#344866';ctx.fillRect(-vw*.08,p.y-30,vw*1.16,7);ctx.fillStyle='rgba(130,225,242,.34)';ctx.fillRect(vw*.14,p.y-6,vw*.19,4);ctx.fillRect(vw*.67,p.y+7,vw*.12,4);ctx.restore();
    }

    // One distant closure aperture repeats at long intervals and gives Stage 1 its identity.
    const gateSpacing=1800,gateIndex=Math.round(player.y/gateSpacing),gateY=gateIndex*gateSpacing+720,gp=worldToScreen(player.x,gateY),gateScale=clamp(1-Math.abs(gp.y-vh*.5)/(vh*1.7),.34,1);
    if(gp.y>-360&&gp.y<vh+360){ctx.save();ctx.translate(vw*.5,gp.y);ctx.scale(gateScale,gateScale);ctx.globalAlpha=.50;
      const shell=ctx.createLinearGradient(-310,0,310,0);shell.addColorStop(0,'#111827');shell.addColorStop(.5,'#26344b');shell.addColorStop(1,'#0b101c');ctx.fillStyle=shell;
      for(const side of[-1,1]){ctx.save();ctx.scale(side,1);cutPanelPath(ctx,105,-112,250,224,32);ctx.fill();ctx.fillStyle='#50627b';ctx.fillRect(118,-94,14,188);ctx.fillStyle='rgba(255,172,89,.62)';ctx.fillRect(145,-65,56,6);ctx.restore();}
      ctx.globalAlpha=.72;const core=ctx.createRadialGradient(0,0,2,0,0,75);core.addColorStop(0,'rgba(235,252,255,.82)');core.addColorStop(.24,'rgba(105,216,239,.34)');core.addColorStop(1,'rgba(70,160,210,0)');ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,75,0,TAU);ctx.fill();ctx.restore();}

    // Very restrained warning atmosphere around the first minute.
    if(t>37&&t<52){const a=Math.sin((t-37)*Math.PI/2)*.5+.5;ctx.save();ctx.globalAlpha=.035+.025*a;ctx.fillStyle='#ff8a46';ctx.fillRect(0,0,vw,vh);ctx.restore();}
  }

  drawBackground=function stageOneRebootBackground(){
    if(isStageOne()){drawStageOneBackground();return;}
    return baseDrawBackground();
  };

  function drawStageOnePhysicalObject(o){
    const p=worldToScreen(o.x,o.y),hw=Math.max(8,Number(o.hw)||42),hh=Math.max(6,Number(o.hh)||18),lift=Math.max(0,Number(o.height)||0);
    ctx.save();ctx.translate(p.x,p.y-lift*.08);ctx.rotate(o.a||0);
    const metal=ctx.createLinearGradient(0,-hh,0,hh);metal.addColorStop(0,o.hit?'#e8f8ff':'#455773');metal.addColorStop(.24,'#25344d');metal.addColorStop(.72,'#0c1424');metal.addColorStop(1,'#070b14');ctx.fillStyle=metal;
    if(o.kind==='girder'){
      cutPanelPath(ctx,-hw,-hh,hw*2,hh*2,Math.min(18,hh*.65));ctx.fill();ctx.fillStyle='rgba(139,225,239,.36)';ctx.fillRect(-hw*.72,-3,hw*1.12,6);ctx.fillStyle='#1f3048';ctx.fillRect(hw*.42,-hh*.66,hw*.38,hh*1.32);
    }else if(o.kind==='bulkhead'){
      cutPanelPath(ctx,-hw,-hh,hw*2,hh*2,Math.min(22,hh*.72));ctx.fill();ctx.fillStyle='#57677d';ctx.fillRect(-hw+10,-hh+7,9,hh*2-14);ctx.fillStyle='rgba(255,159,78,.64)';ctx.fillRect(-hw*.70,-4,hw*.38,8);ctx.fillStyle='rgba(125,226,241,.46)';ctx.fillRect(hw*.18,-3,hw*.42,6);
    }else{
      cutPanelPath(ctx,-hw,-hh,hw*2,hh*2,Math.min(18,Math.min(hw,hh)*.45));ctx.fill();ctx.fillStyle='rgba(134,222,238,.35)';ctx.fillRect(-hw*.62,-3,hw*.48,6);if(o.kind==='salvage'){ctx.fillStyle='#70513c';ctx.fillRect(hw*.18,-hh*.55,hw*.35,hh*1.1);}
    }
    if(o.active){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.22;ctx.fillStyle='#ffffff';cutPanelPath(ctx,-hw,-hh,hw*2,hh*2,Math.min(18,hh*.6));ctx.fill();}
    ctx.restore();
  }

  window.stackfallDrawStagePhysicalObject=function stageOnePhysicalRenderer(o){
    if(isStageOne()&&o?.stageId==='stage-01'){drawStageOnePhysicalObject(o);return;}
    return basePhysicalObject?.(o);
  };

  window.stackfallDrawStagePhysicalWarnings=function stageOnePhysicalWarnings(){
    if(!isStageOne())return basePhysicalWarnings?.();
    const list=typeof stagePhysicalObjects==='function'?stagePhysicalObjects():[];
    for(const o of list){if(!o||o.dead||o.age>=o.warn)continue;const targetX=Number.isFinite(o.toX)?o.toX:o.x,targetY=Number.isFinite(o.toY)?o.toY:o.y,p=worldToScreen(targetX,targetY),hw=Math.max(18,Number(o.hw)||48),hh=Math.max(14,Number(o.hh)||28),pulse=.35+.20*Math.sin((state.time||0)*7+o.age*5);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(o.angle||o.a||0);ctx.globalAlpha=.10+pulse*.10;ctx.fillStyle='#ff9a52';cutPanelPath(ctx,-hw,-hh,hw*2,hh*2,Math.min(18,hh*.55));ctx.fill();ctx.globalAlpha=.58;ctx.fillStyle='#ffbd78';ctx.fillRect(-hw*.52,-3,hw*.34,6);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(hw*.03,-2,hw*.22,4);ctx.restore();
    }
  };

  function drawStageOneBoss(e){
    const r=Number(e.visualR)||110,now=state.time||0,ram=e.stage01Ram||{},mode=ram.mode||'idle',progress=clamp(Number(ram.progress)||0,0,1),phase=Number(e.stagePhase)||1;
    let sx=1,sy=1,lean=0,plate=.18,thrust=0;
    if(mode==='brace'){sx=1-progress*.06;sy=1+progress*.05;plate=.18+progress*.38;}
    else if(mode==='compress'){sx=.94-progress*.10;sy=1.05+progress*.08;lean=-progress*r*.08;plate=.56+progress*.22;}
    else if(mode==='charge'){sx=.84+progress*.05;sy=1.13-progress*.04;lean=-r*.08;plate=.78;thrust=progress;}
    else if(mode==='dash'){sx=1.08;sy=.94;plate=.70;thrust=1;}
    else if(mode==='impact'){sx=.92;sy=1.08;plate=.42;thrust=.18;}
    else if(mode==='recover'){sx=.92+progress*.08;sy=1.08-progress*.08;plate=.42-progress*.24;}
    const angle=Number.isFinite(e.stage01Angle)?e.stage01Angle:Math.PI/2;
    ctx.save();ctx.rotate(angle);ctx.translate(lean,0);ctx.scale(sx,sy);

    // Rear thrust blocks.
    for(const side of[-1,1]){ctx.save();ctx.translate(-r*.72,side*r*.38);ctx.rotate(side*.08);const pod=ctx.createLinearGradient(-r*.35,0,r*.22,0);pod.addColorStop(0,'#09101d');pod.addColorStop(.55,'#33435d');pod.addColorStop(1,'#17243a');ctx.fillStyle=pod;cutPanelPath(ctx,-r*.34,-r*.16,r*.58,r*.32,r*.08);ctx.fill();if(thrust>.02){const flame=ctx.createLinearGradient(-r*.88,0,-r*.22,0);flame.addColorStop(0,'rgba(80,203,238,0)');flame.addColorStop(.52,`rgba(94,220,245,${.20+.48*thrust})`);flame.addColorStop(1,'rgba(238,252,255,.92)');ctx.fillStyle=flame;ctx.beginPath();ctx.moveTo(-r*.92,-r*.10);ctx.lineTo(-r*.22,-r*.08);ctx.lineTo(-r*.22,r*.08);ctx.lineTo(-r*.92,r*.10);ctx.closePath();ctx.fill();}ctx.restore();}

    // Large closure plates. They fold inward before the ram instead of flashing a warning line.
    for(const side of[-1,1]){ctx.save();ctx.translate(-r*.03,side*r*.63);ctx.rotate(side*(.17-plate*.33));const plateGrad=ctx.createLinearGradient(-r*.55,-r*.20,r*.68,r*.18);plateGrad.addColorStop(0,phase>=2&&side>0?'#251b2c':'#10182a');plateGrad.addColorStop(.48,phase>=2&&side>0?'#6b4254':'#384965');plateGrad.addColorStop(1,'#0a101d');ctx.fillStyle=plateGrad;ctx.beginPath();ctx.moveTo(-r*.62,-r*.17);ctx.lineTo(r*.24,-r*.28);ctx.lineTo(r*.72,-r*.08);ctx.lineTo(r*.48,r*.23);ctx.lineTo(-r*.48,r*.20);ctx.closePath();ctx.fill();ctx.fillStyle=side>0&&phase>=2?'rgba(255,151,121,.58)':'rgba(126,226,244,.50)';ctx.fillRect(-r*.20,-r*.04,r*.42,r*.07);ctx.restore();}

    // Main hull: a single strong silhouette with a wedge nose, not many outlined polygons.
    const hull=ctx.createLinearGradient(-r*.72,-r*.45,r*.88,r*.38);hull.addColorStop(0,'#0a101c');hull.addColorStop(.34,'#25344b');hull.addColorStop(.68,'#51617a');hull.addColorStop(1,'#141d2d');ctx.fillStyle=hull;ctx.beginPath();ctx.moveTo(-r*.66,-r*.43);ctx.lineTo(r*.36,-r*.50);ctx.lineTo(r*.92,-r*.18);ctx.lineTo(r*1.10,0);ctx.lineTo(r*.92,r*.18);ctx.lineTo(r*.36,r*.50);ctx.lineTo(-r*.66,r*.43);ctx.lineTo(-r*.86,r*.16);ctx.lineTo(-r*.86,-r*.16);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(151,177,204,.30)';ctx.beginPath();ctx.moveTo(-r*.48,-r*.35);ctx.lineTo(r*.36,-r*.39);ctx.lineTo(r*.76,-r*.15);ctx.lineTo(-r*.16,-r*.08);ctx.closePath();ctx.fill();
    ctx.fillStyle='#111a29';ctx.beginPath();ctx.moveTo(r*.64,-r*.27);ctx.lineTo(r*1.10,0);ctx.lineTo(r*.64,r*.27);ctx.lineTo(r*.40,r*.14);ctx.lineTo(r*.40,-r*.14);ctx.closePath();ctx.fill();

    // Core: compact, bright and readable at a glance.
    const corePulse=.88+.12*Math.sin(now*4.5),core=ctx.createRadialGradient(-r*.03,-r*.03,1,0,0,r*.34);core.addColorStop(0,'#ffffff');core.addColorStop(.18,mode==='charge'?'#fff0c2':'#dffcff');core.addColorStop(.48,phase>=2?'#ff9e83':'#72d9ef');core.addColorStop(1,'rgba(40,75,110,.05)');ctx.fillStyle=core;ctx.beginPath();ctx.moveTo(r*.30*corePulse,0);ctx.lineTo(0,r*.28*corePulse);ctx.lineTo(-r*.30*corePulse,0);ctx.lineTo(0,-r*.28*corePulse);ctx.closePath();ctx.fill();
    ctx.fillStyle=phase>=2?'#ffd5c7':'#eafcff';ctx.beginPath();ctx.arc(0,0,r*.075,0,TAU);ctx.fill();

    if(e.hit){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.18;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(0,0,r*.92,r*.54,0,0,TAU);ctx.fill();}
    ctx.restore();
  }

  drawEliteShape=function stageOneEliteShape(e){
    if(e?.kind==='stage-boss'&&e.eventKind==='stage-01'){drawStageOneBoss(e);return;}
    return baseDrawEliteShape(e);
  };

  function beginRam(e){
    const dx=player.x-e.x,dy=player.y-e.y,angle=Math.atan2(dy,dx),distance=clamp(Math.hypot(dx,dy)+165,360,560);e.stage01Angle=angle;e.stage01Ram={mode:'brace',age:0,duration:.34,progress:0,originX:e.x,originY:e.y,targetX:e.x+Math.cos(angle)*distance,targetY:e.y+Math.sin(angle)*distance,hit:false,impact:false};e.contactSafeUntil=(state.time||0)+2.4;audio.stageAttack?.('stage-01','ram-charge');
  }

  function advanceRam(e,dt){
    const r=e.stage01Ram;if(!r)return false;r.age+=dt;r.progress=clamp(r.age/Math.max(.01,r.duration),0,1);const next=(mode,duration)=>{r.mode=mode;r.age=0;r.duration=duration;r.progress=0;};
    if(r.mode==='brace'&&r.progress>=1){next('compress',.32);}
    else if(r.mode==='compress'&&r.progress>=1){next('charge',.27);audio.stageAttack?.('stage-01','ram-charge');}
    else if(r.mode==='charge'&&r.progress>=1){next('dash',.46);audio.stageAttack?.('stage-01','ram-release');}
    else if(r.mode==='dash'){
      const t=easeOut(r.progress);e.x=lerp(r.originX,r.targetX,t);e.y=lerp(r.originY,r.targetY,t);
      if(!r.hit&&Math.hypot(player.x-e.x,player.y-e.y)<(Number(e.contactR)||64)+player.r+24){r.hit=true;hurtPlayer(Math.max(8,e.damage*.72),'stage-closure-ram');state.hitStop=Math.max(state.hitStop||0,.045);}
      if(r.progress>=1){next('impact',.20);if(!r.impact){r.impact=true;shockwave(e.x,e.y,e.stagePhase>=2?'#ff9e83':'#91eaff',170,.30,4);spawnParticle(e.x,e.y,e.stagePhase>=2?'#ffc0aa':'#c9f8ff',10,180,3.5);state.camera.shake=Math.max(state.camera.shake,9);audio.stageAttack?.('stage-01','shutter-slam');}}
    }else if(r.mode==='impact'&&r.progress>=1){r.recoverX=e.x;r.recoverY=e.y;next('recover',.72);}
    else if(r.mode==='recover'){
      const hx=player.x-Math.cos(e.stage01Angle)*260,hy=player.y-Math.sin(e.stage01Angle)*260,t=ease(r.progress);e.x=lerp(r.recoverX,hx,t);e.y=lerp(r.recoverY,hy,t);if(r.progress>=1){e.stage01Ram=null;e.stage01Cooldown=e.stagePhase>=2?1.55:2.05;}}
    return true;
  }

  window.updateStageBossSkill=function stageOneBossSkill(e,dt){
    if(!(e?.kind==='stage-boss'&&e.eventKind==='stage-01'))return baseStageBossSkill?.(e,dt);
    if(e.dead)return;const now=state.time||0,ratio=e.maxHp>0?e.hp/e.maxHp:1,nextPhase=ratio<=.52?2:1;
    if(nextPhase!==e.stagePhase){e.stagePhase=nextPhase;e.stage01Cooldown=.85;spawnParticle(e.x,e.y,nextPhase>=2?'#ffad92':'#a6eeff',12,145,3.2);shockwave(e.x,e.y,nextPhase>=2?'#ffad92':'#a6eeff',126,.34,3);}
    e.contactSafeUntil=now+.16;
    if(advanceRam(e,dt))return;
    const desiredAngle=Math.atan2(player.y-e.y,player.x-e.x);e.stage01Angle=Number.isFinite(e.stage01Angle)?e.stage01Angle+(Math.atan2(Math.sin(desiredAngle-e.stage01Angle),Math.cos(desiredAngle-e.stage01Angle))*Math.min(1,dt*2.3)):desiredAngle;
    const homeDist=e.stagePhase>=2?235:270,hx=player.x-Math.cos(e.stage01Angle)*homeDist,hy=player.y-Math.sin(e.stage01Angle)*homeDist;e.x=lerp(e.x,hx,Math.min(1,dt*.72));e.y=lerp(e.y,hy,Math.min(1,dt*.72));
    e.stage01Cooldown=(Number.isFinite(e.stage01Cooldown)?e.stage01Cooldown:1.25)-dt;if(e.stage01Cooldown<=0)beginRam(e);
  };

  drawRealmCinematicOverlay=function stageOneRealmOverlay(){
    const tr=state.realmTransition;if(!(isStageOne()&&tr?.owner==='stage-01-boss-entry'))return baseRealmOverlay();
    const p=clamp(tr.elapsed/tr.duration,0,1),fade=Math.sin(Math.PI*p),rise=ease(clamp((p-.08)/.70,0,1));ctx.save();ctx.globalAlpha=fade*.72;ctx.fillStyle='rgba(1,4,12,.72)';ctx.fillRect(0,0,vw,vh);ctx.restore();
    ctx.save();ctx.translate(vw*.5,lerp(vh*.22,vh*.40,rise));ctx.scale(.58+.42*rise,.58+.42*rise);ctx.globalAlpha=fade;drawStageOneBoss({visualR:110,stagePhase:1,stage01Angle:Math.PI/2,stage01Ram:{mode:p<.48?'brace':'compress',progress:rise},phase:tr.elapsed});ctx.restore();
    ctx.save();ctx.globalAlpha=fade;ctx.textAlign='center';ctx.fillStyle='#eefbff';ctx.shadowBlur=18;ctx.shadowColor='#7fe4f4';ctx.font=`900 ${Math.round(clamp(vw*.045,30,52))}px "Black Han Sans",sans-serif`;ctx.fillText(tr.title||'CLOSURE CORE',vw*.5,vh*.62);ctx.shadowBlur=0;ctx.fillStyle='rgba(177,212,229,.82)';ctx.font='800 12px "IBM Plex Sans KR",sans-serif';ctx.fillText(GAME_SETTINGS.language==='ko'?'폐쇄선이 전투 구역을 잠근다':'THE CLOSURE LINE ENGAGES',vw*.5,vh*.62+31);ctx.restore();
  };

  window.stackfallStage01RebootDiagnostics=()=>({active:isStageOne(),boss:state.entities.enemies.find(e=>e?.kind==='stage-boss'&&e.eventKind==='stage-01')?.stage01Ram?.mode||'none',physical:(typeof stagePhysicalObjects==='function'?stagePhysicalObjects().length:0)});
})();
