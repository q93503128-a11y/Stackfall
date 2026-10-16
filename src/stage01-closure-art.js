(()=>{
  'use strict';
  if(window.__stackfallStage01ClosureArtLoaded)return;
  window.__stackfallStage01ClosureArtLoaded=true;

  const STAGE_ID='stage-01';
  const baseDrawBackground=drawBackground;
  const baseDrawEliteShape=drawEliteShape;
  const baseRealmOverlay=drawRealmCinematicOverlay;
  const baseVictory=window.drawStageVictoryCinematic;
  const baseBodyShapes=window.stackfallStageBodyShapes;
  const baseDiagnostics=window.stackfallStage01CompleteDiagnostics;
  const isStageOne=()=>window.stackfallIsStageRun?.()===true&&state.runSelection?.stageId===STAGE_ID;
  const sat=(v,a=0,b=1)=>clamp(Number(v)||0,a,b);
  const smooth=t=>{t=sat(t);return t*t*(3-2*t);};
  const out3=t=>1-Math.pow(1-sat(t),3);
  const in3=t=>Math.pow(sat(t),3);
  const hash=n=>{const x=Math.sin(n*127.1+47.3)*43758.5453123;return x-Math.floor(x);};

  function actionProgress(a){return a?clamp((Number(a.age)||0)/Math.max(.001,Number(a.duration)||1),0,1):0;}
  function visualPose(e){
    const a=e.stage01Action||null,p=actionProgress(a),phase=e.stagePhase||1;
    const morph=e.stage01Morph?smooth(sat(e.stage01Morph.age/e.stage01Morph.duration)):phase>=2?1:0;
    let gap=.20+.055*morph,open=.05+.07*morph,stretch=1+.035*morph,pitch=.075*morph,scythe=.38*morph,trail=0,shock=0,core=.30+.08*morph;
    if(a?.type==='ram'){
      if(a.phase==='brace'){gap=lerp(.20,.27,smooth(p));open=lerp(.05,.15,p);core=.34;}
      else if(a.phase==='fold'){gap=lerp(.27,.055,smooth(p));open=lerp(.15,-.08,p);stretch=lerp(1,.88,p);core=.42;}
      else if(a.phase==='charge'){gap=.055;open=-.09;stretch=lerp(.88,1.32,out3(p));trail=.18+.72*p;core=.52;}
      else if(a.phase==='dash'){gap=.045;open=-.10;stretch=1.42;trail=1;core=.62;}
      else if(a.phase==='impact'){gap=lerp(.05,.33,smooth(p));open=lerp(-.10,.26,p);stretch=lerp(1.40,.93,p);shock=1-p;core=.56;}
      else if(a.phase==='recover'){gap=lerp(.33,.20,smooth(p));open=lerp(.26,.05,p);stretch=lerp(.93,1,p);core=.32;}
    }else if(a?.type==='shutter'){
      if(a.phase==='aim'){gap=lerp(.20,.29,p);open=lerp(.05,.18,p);pitch=.06*p;}
      else if(a.phase==='open'){gap=lerp(.29,.62,smooth(p));open=lerp(.18,.44,p);stretch=1.06;core=.40;}
      else if(a.phase==='snap'){gap=lerp(.62,.035,in3(p));open=lerp(.44,-.14,out3(p));stretch=1.48;trail=.28;core=.58;}
      else if(a.phase==='hold'){gap=.035;open=-.14;stretch=1.48;trail=.20;core=.54;}
      else if(a.phase==='recoil'){gap=lerp(.035,.20,smooth(p));open=lerp(-.14,.05,p);stretch=lerp(1.48,1,p);}
    }else if(a?.type==='orbit'){
      if(a.phase==='wind'){gap=lerp(.20,.32,p);open=lerp(.05,.22,p);scythe=.25+.48*morph*p;pitch=-.10*p;}
      else if(a.phase==='sweep'){gap=.30;open=.18;scythe=1;trail=.58;stretch=1.08;pitch=-.14;}
      else if(a.phase==='recover'){gap=lerp(.30,.20,p);open=lerp(.18,.05,p);scythe=lerp(1,.38*morph,p);pitch=lerp(-.14,.075*morph,p);}
    }else if(a?.type==='breakline'){
      if(a.phase==='brace'){gap=lerp(.20,.07,p);open=lerp(.05,-.06,p);scythe=.38*morph+.35*p;core=.48;}
      else if(a.phase==='dashA'||a.phase==='dashB'){gap=.045;open=-.12;stretch=1.45;scythe=.72;trail=1;pitch=a.phase==='dashB'?.10:-.06;core=.60;}
      else if(a.phase==='pivot'){gap=lerp(.06,.36,p);open=lerp(-.10,.28,p);scythe=.86;pitch=lerp(-.06,.18,p);core=.52;}
      else if(a.phase==='rupture'){gap=lerp(.045,.50,p);open=lerp(-.12,.38,p);scythe=lerp(.72,1,p);shock=1-p;core=.68;}
      else if(a.phase==='recover'){gap=lerp(.36,.255,p);open=lerp(.26,.12,p);scythe=lerp(.78,.38,p);pitch=lerp(.12,.075,p);}
    }
    return{r:Number(e.visualR)||104,a,p,phase,morph,gap,open,stretch,pitch,scythe,trail,shock,core};
  }

  function drawRouteScar(screenY,tilt,seed,alpha=.14){
    const span=Math.max(vw*1.55,1500),width=110+hash(seed+4)*95;
    ctx.save();ctx.translate(vw*.5,screenY);ctx.rotate(tilt);ctx.lineCap='round';
    for(const offset of[-1,1]){
      const y=offset*width*.29;
      ctx.globalAlpha=alpha*(offset<0?.72:1);ctx.strokeStyle=offset<0?'#586ba2':'#668aa8';ctx.lineWidth=width*(offset<0?.32:.46);
      ctx.beginPath();ctx.moveTo(-span*.62,y);ctx.bezierCurveTo(-span*.28,y-width*.35,span*.08,y+width*.22,span*.62,y-width*.08);ctx.stroke();
      ctx.globalAlpha=alpha*2.35;ctx.strokeStyle=offset<0?'#7ea9cf':'#91d8df';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-span*.57,y-width*.02);ctx.bezierCurveTo(-span*.18,y-width*.20,span*.17,y+width*.10,span*.57,y-width*.06);ctx.stroke();
    }
    ctx.restore();
  }

  function drawBrokenAperture(x,y,r,seed){
    ctx.save();ctx.translate(x,y);ctx.rotate((hash(seed)-.5)*1.2);ctx.lineCap='round';
    const arcs=[[-2.82,-1.74],[-1.28,-.54],[.18,1.24],[1.62,2.44]];
    for(let i=0;i<arcs.length;i++){ctx.globalAlpha=.08+(i%2)*.035;ctx.strokeStyle=i%2?'#6fc8d7':'#7886c2';ctx.lineWidth=r*(i%2?.052:.078);ctx.beginPath();ctx.arc(0,0,r*(1+(i%2)*.06),arcs[i][0],arcs[i][1]);ctx.stroke();}
    ctx.globalAlpha=.24;ctx.strokeStyle='#9ce0e6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*.84,-2.72,-1.86);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.84,.35,1.12);ctx.stroke();ctx.restore();
  }

  function drawClosureFieldArt(f){
    if(!f)return;const age=f.age||0;if(age>=f.duration)return;
    const intro=smooth(sat(age/1.35)),release=smooth(sat((age-(f.duration-1.35))/1.35)),pinch=intro*(1-release),gap=lerp(f.gapOpen,f.gapMin,pinch),center=worldToScreen(f.centerX,f.centerY),drift=Math.sin(sat(age/f.duration)*Math.PI)*f.drift;
    const span=Math.max(vw,vh)*1.75,depth=Math.max(vw,vh)*.68;
    ctx.save();ctx.translate(center.x,center.y);ctx.rotate(f.angle);ctx.translate(0,drift);ctx.lineCap='round';
    for(const side of[-1,1]){
      ctx.save();ctx.scale(1,side);ctx.translate(0,gap*.5);
      const g=ctx.createLinearGradient(0,0,0,depth);g.addColorStop(0,'rgba(104,149,194,.38)');g.addColorStop(.12,'rgba(48,67,116,.34)');g.addColorStop(.56,'rgba(15,23,58,.34)');g.addColorStop(1,'rgba(3,5,18,0)');ctx.fillStyle=g;
      ctx.beginPath();ctx.moveTo(-span*.62,5);ctx.bezierCurveTo(-span*.25,-22,span*.04,18,span*.62,-4);ctx.lineTo(span*.62,depth);ctx.bezierCurveTo(span*.18,depth*.72,-span*.28,depth*.92,-span*.62,depth*.78);ctx.closePath();ctx.fill();
      const edge=ctx.createLinearGradient(-span*.45,0,span*.45,0);edge.addColorStop(0,'rgba(108,219,233,0)');edge.addColorStop(.20,'rgba(108,219,233,.52)');edge.addColorStop(.52,'rgba(206,224,255,.72)');edge.addColorStop(.82,'rgba(120,203,226,.46)');edge.addColorStop(1,'rgba(108,219,233,0)');ctx.strokeStyle=edge;ctx.lineWidth=4.5+2.2*pinch;ctx.globalAlpha=.72*pinch;const cuts=[[-.46,-.17],[-.10,.19],[.26,.53]];for(const [a,b] of cuts){ctx.beginPath();const x1=span*a,x2=span*b;ctx.moveTo(x1,2);ctx.bezierCurveTo(lerp(x1,x2,.35),-10,lerp(x1,x2,.68),11,x2,-2);ctx.stroke();}
      ctx.globalAlpha=.20*pinch;ctx.strokeStyle='#9bb8df';ctx.lineWidth=1.4;for(let i=0;i<3;i++){const yy=70+i*96+(hash(f.cycle*11+i)-.5)*24;ctx.beginPath();ctx.moveTo(-span*.30,yy);ctx.bezierCurveTo(-span*.10,yy-18,span*.08,yy+16,span*.31,yy-5);ctx.stroke();}
      ctx.restore();
    }
    ctx.restore();
  }

  function drawStageOneBackgroundArt(){
    drawSpaceBackground();
    ctx.save();const wash=ctx.createRadialGradient(vw*.50,vh*.48,20,vw*.50,vh*.48,Math.max(vw,vh)*.82);wash.addColorStop(0,'rgba(39,56,117,.10)');wash.addColorStop(.62,'rgba(13,21,61,.04)');wash.addColorStop(1,'rgba(0,1,10,.32)');ctx.fillStyle=wash;ctx.fillRect(0,0,vw,vh);ctx.restore();
    const spacing=Math.max(2100,vh*2.1),base=Math.floor(player.y/spacing);for(let i=-1;i<=1;i++){const idx=base+i,wy=idx*spacing+spacing*(.22+hash(idx*5)*.46),sy=wy-player.y+vh*.5;if(sy<-vh*.9||sy>vh*1.9)continue;drawRouteScar(sy,(hash(idx*9)-.5)*.42,idx,.10+hash(idx+2)*.04);}
    const cell=4200,cx=Math.round(player.x/cell),cy=Math.round(player.y/cell),wx=cx*cell+(hash(cx*31+cy*7)-.5)*1600,wy=cy*cell+(hash(cx*13-cy*19)-.5)*1500,p=worldToScreen(wx,wy),r=Math.min(Math.max(vw,vh)*.38,500);if(p.x>-r*1.5&&p.x<vw+r*1.5&&p.y>-r*1.5&&p.y<vh+r*1.5)drawBrokenAperture(p.x,p.y,r,cx*41+cy*17);
    drawClosureFieldArt(state.stageRun?.stage01ClosureField);
  }
  drawBackground=function closureLineArtBackground(){if(isStageOne())return drawStageOneBackgroundArt();return baseDrawBackground();};

  function jawPath(r,extension=1){
    ctx.beginPath();ctx.moveTo(-r*.88,r*.03);ctx.bezierCurveTo(-r*.50,-r*.08,r*.02,-r*.08,r*.38,r*.08);ctx.bezierCurveTo(r*.70,r*.20,r*1.02*extension,r*.17,r*1.30*extension,r*.02);ctx.bezierCurveTo(r*1.04*extension,r*.50,r*.34*extension,r*.72,-r*.26,r*.56);ctx.bezierCurveTo(-r*.58,r*.46,-r*.82,r*.24,-r*.88,r*.03);ctx.closePath();
  }
  function drawJaw(r,side,pose){
    const asym=pose.morph*(side>0?1:0),ext=1+pose.scythe*(side>0?.42:.15)+asym*.28;
    ctx.save();ctx.scale(1,side);ctx.translate(asym*r*.08,r*pose.gap);ctx.rotate(pose.open+pose.pitch*(side>0?1:.35)+asym*.14);
    const g=ctx.createLinearGradient(-r*.85,-r*.05,r*1.35,r*.55);g.addColorStop(0,'#11182f');g.addColorStop(.34,asym>.25?'#273559':'#283762');g.addColorStop(.72,asym>.25?'#4f6b8c':'#536fa0');g.addColorStop(1,asym>.25?'#89c4d0':'#9ac9d6');ctx.fillStyle=g;jawPath(r,ext);ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.48;ctx.strokeStyle=asym>.25?'#a6edf0':'#a8dbe5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-r*.34,r*.13);ctx.bezierCurveTo(r*.20,r*.10,r*.72*ext,r*.18,r*1.08*ext,r*.08);ctx.stroke();
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.42;ctx.fillStyle='#d9f3f5';ctx.beginPath();ctx.moveTo(r*.32,r*.18);ctx.lineTo(r*.74*ext,r*.23);ctx.lineTo(r*.58*ext,r*.30);ctx.lineTo(r*.18,r*.24);ctx.closePath();ctx.fill();ctx.restore();
  }
  function drawFractureBlade(r,pose){
    if(pose.morph<.10)return;const reveal=pose.morph,reach=1.12+pose.scythe*.72+reveal*.18;
    ctx.save();ctx.translate(-r*.02,r*(.61+.10*reveal));ctx.rotate(.31+pose.pitch*.8);ctx.globalAlpha=reveal;
    const g=ctx.createLinearGradient(-r*.30,0,r*1.70,0);g.addColorStop(0,'#1b2440');g.addColorStop(.46,'#41577b');g.addColorStop(.80,'#7ca6bc');g.addColorStop(1,'#c0edf0');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-r*.34,r*.05);ctx.bezierCurveTo(r*.24,-r*.16,r*1.02*reach,-r*.14,r*1.64*reach,-r*.55);ctx.bezierCurveTo(r*1.20*reach,r*.06,r*.66*reach,r*.39,-r*.18,r*.28);ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.46*reveal;ctx.strokeStyle='#b8f0f2';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(r*.18,r*.06);ctx.quadraticCurveTo(r*.90*reach,-r*.03,r*1.43*reach,-r*.42);ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(-r*.22,-r*(.52+.05*reveal));ctx.rotate(-.42-pose.pitch*.35);ctx.globalAlpha=.72*reveal;const g2=ctx.createLinearGradient(-r*.18,0,r*.92,0);g2.addColorStop(0,'#151e39');g2.addColorStop(.72,'#526f91');g2.addColorStop(1,'#9ed9df');ctx.fillStyle=g2;ctx.beginPath();ctx.moveTo(-r*.20,r*.04);ctx.quadraticCurveTo(r*.40,-r*.16,r*.96,-r*.34);ctx.quadraticCurveTo(r*.70,r*.20,r*.05,r*.26);ctx.closePath();ctx.fill();ctx.restore();
  }
  function drawRearKeel(r,pose){
    ctx.save();ctx.translate(-r*.54,0);ctx.rotate(-.04-pose.pitch*.3);const spread=.18+.18*pose.morph;const g=ctx.createLinearGradient(-r*.65,0,r*.28,0);g.addColorStop(0,'#0a0f22');g.addColorStop(.55,'#243253');g.addColorStop(1,'#617c9d');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-r*.64,0);ctx.lineTo(r*.14,-r*(.22+spread));ctx.lineTo(r*.36,-r*.08);ctx.lineTo(r*.08,0);ctx.lineTo(r*.36,r*.08);ctx.lineTo(r*.14,r*(.22+spread));ctx.closePath();ctx.fill();ctx.restore();
  }
  function drawCoreSlit(r,pose){
    ctx.save();ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(1,3,10,.96)';ctx.beginPath();ctx.moveTo(r*.35,0);ctx.lineTo(r*.04,-r*.18);ctx.lineTo(-r*.28,0);ctx.lineTo(r*.04,r*.18);ctx.closePath();ctx.fill();ctx.strokeStyle='#6ea6b7';ctx.globalAlpha=.62;ctx.lineWidth=2.4;ctx.stroke();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.32+pose.core*.40;ctx.strokeStyle='#c9f6f5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r*.08,-r*.10);ctx.lineTo(r*.20,0);ctx.lineTo(-r*.08,r*.10);ctx.stroke();ctx.restore();
  }
  function drawBossArt(e,override=null){
    const pose=override||visualPose(e),r=pose.r,angle=Number.isFinite(e.stage01Angle)?e.stage01Angle:Math.PI/2;
    ctx.save();ctx.rotate(angle);ctx.scale(pose.stretch,1);
    if(pose.trail>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.20*pose.trail;for(const side of[-1,1]){const y=side*r*(pose.gap+.22);const g=ctx.createLinearGradient(-r*3,0,-r*.15,0);g.addColorStop(0,'rgba(83,159,204,0)');g.addColorStop(.62,'rgba(89,184,215,.16)');g.addColorStop(1,'rgba(202,244,247,.54)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-r*2.8,y);ctx.bezierCurveTo(-r*1.7,y-side*r*.18,-r*.60,y-side*r*.12,-r*.08,y);ctx.lineTo(-r*.08,y+side*r*.14);ctx.bezierCurveTo(-r*.70,y+side*r*.20,-r*1.8,y+side*r*.22,-r*2.8,y);ctx.fill();}ctx.restore();}
    drawRearKeel(r,pose);drawJaw(r,-1,pose);drawJaw(r,1,pose);drawFractureBlade(r,pose);drawCoreSlit(r,pose);
    if(pose.shock>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.40*pose.shock;ctx.strokeStyle='#d6f5f5';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(r*.08,0,r*(.82+pose.shock*.72),r*(.45+pose.shock*.33),0,0,TAU);ctx.stroke();ctx.restore();}
    if(e.hit){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.20;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(r*.12,0,r*1.10,r*.72,0,0,TAU);ctx.fill();ctx.restore();}
    ctx.restore();
  }
  drawEliteShape=function closureLineArtElite(e){if(e?.kind==='stage-boss'&&e.eventKind===STAGE_ID){drawBossArt(e);return;}return baseDrawEliteShape(e);};

  function ellipsePart(out,cx,cy,rx,ry,a,steps=10){const c=Math.cos(a),s=Math.sin(a);out.kind='polygon';out.x=cx;out.y=cy;out.hw=rx;out.hh=ry;out.a=a;out.points=out.points||[];out.points.length=steps;for(let i=0;i<steps;i++){const q=i/steps*TAU,lx=Math.cos(q)*rx,ly=Math.sin(q)*ry,p=out.points[i]||(out.points[i]={});p.x=cx+lx*c-ly*s;p.y=cy+lx*s+ly*c;}return out;}
  function artShapes(e){
    const pose=visualPose(e),r=pose.r,a=Number.isFinite(e.stage01Angle)?e.stage01Angle:Math.PI/2,c=Math.cos(a),s=Math.sin(a),parts=e.stage01ClosureArtShapes||(e.stage01ClosureArtShapes=[{},{},{},{}]);
    const transform=(lx,ly)=>({x:e.x+lx*c-ly*s,y:e.y+lx*s+ly*c});
    let q=transform(r*.20,r*(pose.gap+.24));ellipsePart(parts[0],q.x,q.y,r*(.82+pose.scythe*.12)*pose.stretch,r*.26,a+pose.open,11);
    q=transform(r*.20,-r*(pose.gap+.24));ellipsePart(parts[1],q.x,q.y,r*(.82+pose.scythe*.08)*pose.stretch,r*.26,a-pose.open,11);
    q=transform(-r*.40,0);ellipsePart(parts[2],q.x,q.y,r*.52,r*.34,a,9);
    q=transform(r*(.34+pose.morph*.40),r*(.58+pose.morph*.24));ellipsePart(parts[3],q.x,q.y,r*(.32+pose.morph*.42+pose.scythe*.22),r*(.16+pose.morph*.08),a+.31+pose.pitch,9);return parts;
  }
  window.stackfallStageBodyShapes=e=>e?.eventKind===STAGE_ID?artShapes(e):baseBodyShapes?.(e)||e?.stageBodyShapes||[];

  drawRealmCinematicOverlay=function closureLineArtRealmOverlay(){
    const tr=state.realmTransition;if(!(isStageOne()&&tr?.owner===STAGE_ID+'-boss-entry'))return baseRealmOverlay();
    const p=sat(tr.elapsed/tr.duration),fade=Math.sin(Math.PI*p),form=smooth(sat((p-.05)/.60)),close=smooth(sat((p-.18)/.52)),mobile=vw<620;
    ctx.save();ctx.globalAlpha=.76*fade;const bg=ctx.createRadialGradient(vw*.5,vh*.40,18,vw*.5,vh*.40,Math.max(vw,vh)*.82);bg.addColorStop(0,'rgba(31,47,91,.80)');bg.addColorStop(.46,'rgba(7,13,37,.82)');bg.addColorStop(1,'rgba(0,1,8,.92)');ctx.fillStyle=bg;ctx.fillRect(0,0,vw,vh);ctx.restore();
    const cx=vw*.5,cy=vh*(mobile?.40:.38),reach=Math.max(vw,vh)*.64;
    ctx.save();ctx.globalAlpha=fade*(.20+.46*close);ctx.lineCap='round';for(const side of[-1,1]){ctx.strokeStyle=side<0?'#526898':'#6ea3b4';ctx.lineWidth=lerp(mobile?48:72,mobile?24:34,close);ctx.beginPath();ctx.moveTo(cx-side*reach,cy+side*vh*.25);ctx.bezierCurveTo(cx-side*reach*.48,cy-side*vh*.05,cx-side*reach*.18,cy+side*vh*.05,cx-side*45,cy+side*26);ctx.stroke();ctx.globalAlpha*=1.35;ctx.strokeStyle='#a2d9df';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx-side*reach*.88,cy+side*vh*.19);ctx.bezierCurveTo(cx-side*reach*.40,cy-side*vh*.03,cx-side*reach*.16,cy+side*vh*.04,cx-side*52,cy+side*24);ctx.stroke();ctx.globalAlpha/=1.35;}ctx.restore();
    const fake={visualR:mobile?82:110,stagePhase:1,stage01Angle:Math.PI/2,stage01Action:{type:'ram',phase:p<.42?'brace':'fold',age:form,duration:1},stage01Morph:null,hit:0};ctx.save();ctx.translate(cx,cy);ctx.scale(.42+.58*form,.42+.58*form);ctx.rotate((1-form)*-.32);ctx.globalAlpha=fade;drawBossArt(fake);ctx.restore();
    const textY=vh*(mobile?.69:.70);ctx.save();ctx.globalAlpha=fade*smooth(sat((p-.18)/.30));ctx.textAlign='center';ctx.fillStyle='#eef9fb';ctx.font=`900 ${Math.round(clamp(vw*(mobile?.082:.040),30,50))}px "Black Han Sans","IBM Plex Sans KR",sans-serif`;ctx.fillText(tr.title||'폐쇄체',cx,textY);ctx.fillStyle='rgba(174,211,220,.82)';ctx.font=`700 ${mobile?11:12}px "IBM Plex Sans KR",sans-serif`;ctx.fillText(GAME_SETTINGS.language==='ko'?'끊어진 항로가 스스로 맞물린다':'THE BROKEN ROUTE LOCKS ITSELF',cx,textY+28,vw-44);ctx.strokeStyle='rgba(128,205,216,.48)';ctx.lineWidth=1.4;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(cx+side*(mobile?82:112),textY+7);ctx.lineTo(cx+side*(mobile?145:210),textY+7);ctx.stroke();}ctx.restore();
  };

  function drawVictoryArt(v){
    const age=v.elapsed,p=worldToScreen(v.x,v.y),body=v.body||{},implode=smooth(sat(age/.70)),tear=smooth(sat((age-.58)/.90)),fade=1-smooth(sat((age-2.32)/.72));
    const pose=visualPose({...body,stagePhase:2,stage01Morph:null,stage01Action:null});pose.morph=1;pose.gap=lerp(.255,.82,tear);pose.open=lerp(.12,.58,tear);pose.scythe=lerp(.45,1,tear);pose.stretch=lerp(1.035,.76,tear);pose.shock=Math.max(0,1-Math.abs(age-1.18)/.42);pose.core=.62*(1-tear*.55);
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=fade;drawBossArt({...body,stagePhase:2,stage01Angle:body.stage01Angle||Math.PI/2,hit:0},pose);ctx.restore();
    if(age>.72){const route=smooth(sat((age-.72)/1.12));ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.55;ctx.strokeStyle='#9cdde2';ctx.lineWidth=4.5;ctx.lineCap='round';for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(p.x-side*vw*.52,p.y+side*74);ctx.bezierCurveTo(p.x-side*vw*.20,p.y-side*26,p.x-side*72,p.y+side*12,p.x-side*(18+90*(1-route)),p.y);ctx.stroke();}ctx.restore();}
    if(age>1.03&&age<1.90){const pulse=Math.max(0,1-Math.abs(age-1.43)/.48);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=pulse*.30;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,230);g.addColorStop(0,'rgba(240,255,255,.92)');g.addColorStop(.24,'rgba(119,215,225,.40)');g.addColorStop(1,'rgba(65,92,180,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,230,0,TAU);ctx.fill();ctx.restore();}
    if(age>.94){ctx.save();ctx.globalAlpha=smooth(sat((age-.94)/.46))*fade;ctx.textAlign='center';ctx.fillStyle='#e4f2f4';ctx.font=`800 ${vw<620?18:24}px "IBM Plex Sans KR",sans-serif`;ctx.fillText(age<1.82?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw*.5,vh*(vw<620?.22:.20));ctx.restore();}
  }
  window.drawStageVictoryCinematic=function closureLineArtVictory(){const v=state.stageVictory;if(state.mode==='stageVictory'&&v?.stageId===STAGE_ID)return drawVictoryArt(v);return baseVictory?.();};

  window.stackfallStage01CompleteDiagnostics=()=>({...baseDiagnostics?.(),style:'stackfall-closure-line-final-art',art:'split-clamp-aperture-v2',entry:'curved-route-lock',background:'sparse-broken-route-scars'});
})();