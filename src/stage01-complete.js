(()=>{
  'use strict';
  if(window.__stackfallStage01CompleteLoaded)return;
  window.__stackfallStage01CompleteLoaded=true;

  const STAGE_ID='stage-01';
  const STYLE='stackfall-closure-line-final';
  const baseDrawBackground=drawBackground;
  const baseDrawEliteShape=drawEliteShape;
  const baseDrawStageEnemyBody=drawStageEnemyBody;
  const baseBossSkill=window.updateStageBossSkill;
  const baseBodyShapes=window.stackfallStageBodyShapes;
  const baseClampBoss=window.stackfallClampStageBossToArena;
  const baseRealmOverlay=drawRealmCinematicOverlay;
  const baseUpdateSpawning=typeof updateSpawning==='function'?updateSpawning:null;
  const baseVictoryDraw=window.drawStageVictoryCinematic;

  const isStageOne=()=>window.stackfallIsStageRun?.()===true&&state.runSelection?.stageId===STAGE_ID;
  const sat=(v,a=0,b=1)=>clamp(Number(v)||0,a,b);
  const smooth=t=>{t=sat(t);return t*t*(3-2*t);};
  const out3=t=>1-Math.pow(1-sat(t),3);
  const in3=t=>Math.pow(sat(t),3);
  const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);};
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const approachAngle=(a,b,k)=>a+angleDelta(a,b)*clamp(k,0,1);
  const localOf=(x,y,ox,oy,a)=>{const dx=x-ox,dy=y-oy,c=Math.cos(a),s=Math.sin(a);return{x:dx*c+dy*s,y:-dx*s+dy*c};};

  function stageRun(){return isStageOne()?state.stageRun:null;}

  function installStageOneRuntimeTuning(){
    const registry=window.stackfallStageRuntimeRegistry,base=registry?.get?.(STAGE_ID);
    if(!base||base.__closureLineComplete)return;
    const tuned=Object.freeze({...base,
      __closureLineComplete:true,
      initialSpawnTimer:.86,
      startingVariants:Object.freeze(['shardling','shardling','dart']),
      poolAt(time){
        if(time<48)return[['shardling',.84],['dart',.16]];
        if(time<118)return[['shardling',.60],['dart',.40]];
        if(time<190)return[['shardling',.48],['dart',.31],['bombardier',.21]];
        if(time<248)return[['shardling',.38],['dart',.29],['bombardier',.18],['bulwark',.15]];
        return[['shardling',.31],['dart',.30],['bombardier',.19],['bulwark',.20]];
      },
      spawnProfile(time){
        const late=Math.max(0,time-150),cap=time>=245?36:time>=170?33:time>=90?29:25;
        const rate=Math.max(.72,1.52-Math.min(.64,time*.00225)-Math.min(.12,late/900));
        const count=time>=220&&Math.random()<.30?2:1;
        return{cap,rate,count};
      }
    });
    registry.set(STAGE_ID,tuned);
  }
  installStageOneRuntimeTuning();

  function drawRouteSheet(screenY,tilt,width,thickness,seed,alpha){
    const cx=vw*.5,span=Math.max(vw*1.35,width),bend=(hash(seed)-.5)*vh*.16;
    ctx.save();ctx.translate(cx,screenY);ctx.rotate(tilt);
    const g=ctx.createLinearGradient(-span*.5,0,span*.5,0);
    g.addColorStop(0,'rgba(35,49,93,0)');g.addColorStop(.20,`rgba(47,63,120,${alpha*.62})`);g.addColorStop(.52,`rgba(87,96,170,${alpha})`);g.addColorStop(.82,`rgba(39,57,108,${alpha*.50})`);g.addColorStop(1,'rgba(27,41,83,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-span*.58,-thickness*.18);ctx.bezierCurveTo(-span*.18,-thickness*.58+bend,span*.16,-thickness*.24-bend,span*.58,-thickness*.12);ctx.lineTo(span*.58,thickness*.12);ctx.bezierCurveTo(span*.14,thickness*.52-bend,-span*.22,thickness*.32+bend,-span*.58,thickness*.18);ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.42;const edge=ctx.createLinearGradient(-span*.35,0,span*.35,0);edge.addColorStop(0,'rgba(130,190,234,0)');edge.addColorStop(.45,'rgba(137,210,242,.35)');edge.addColorStop(.54,'rgba(192,208,255,.28)');edge.addColorStop(1,'rgba(116,184,230,0)');ctx.strokeStyle=edge;ctx.lineWidth=Math.max(2,thickness*.055);ctx.beginPath();ctx.moveTo(-span*.45,0);ctx.bezierCurveTo(-span*.12,-thickness*.16+bend*.25,span*.18,thickness*.10-bend*.22,span*.45,0);ctx.stroke();ctx.restore();
  }

  function drawBrokenHalo(x,y,r,seed){
    ctx.save();ctx.translate(x,y);ctx.rotate((hash(seed+2)-.5)*1.35);ctx.globalAlpha=.13;
    const g=ctx.createLinearGradient(-r,0,r,0);g.addColorStop(0,'#4e568f');g.addColorStop(.46,'#8397d4');g.addColorStop(1,'#355a79');ctx.strokeStyle=g;ctx.lineCap='round';ctx.lineWidth=r*.075;
    ctx.beginPath();ctx.arc(0,0,r,-2.75,-1.03);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r,.30,2.13);ctx.stroke();
    ctx.globalAlpha=.26;ctx.strokeStyle='#83cad8';ctx.lineWidth=r*.009;ctx.beginPath();ctx.arc(0,0,r*.86,-2.58,-1.38);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.86,.48,1.76);ctx.stroke();ctx.restore();
  }

  function drawClosureField(field){
    if(!field)return;
    const age=field.age||0,p=field.duration?age/field.duration:0;
    if(p>=1)return;
    const center=worldToScreen(field.centerX,field.centerY),intro=smooth(sat(age/1.35)),release=smooth(sat((age-(field.duration-1.35))/1.35));
    const pinch=intro*(1-release),gap=lerp(field.gapOpen,field.gapMin,pinch),normalDrift=Math.sin(sat(age/field.duration)*Math.PI)*field.drift;
    ctx.save();ctx.translate(center.x,center.y);ctx.rotate(field.angle);ctx.translate(0,normalDrift);
    const span=Math.max(vw,vh)*1.55,depth=Math.max(vw,vh)*.58;
    for(const side of[-1,1]){
      ctx.save();ctx.scale(1,side);ctx.translate(0,gap*.5);
      const g=ctx.createLinearGradient(0,0,0,depth);g.addColorStop(0,'rgba(151,195,231,.36)');g.addColorStop(.08,'rgba(79,112,170,.38)');g.addColorStop(.35,'rgba(34,45,91,.58)');g.addColorStop(1,'rgba(5,8,23,.12)');ctx.fillStyle=g;
      ctx.beginPath();ctx.moveTo(-span*.62,0);ctx.bezierCurveTo(-span*.18,-18,span*.14,24,span*.62,3);ctx.lineTo(span*.62,depth);ctx.bezierCurveTo(span*.12,depth*.83,-span*.18,depth*.95,-span*.62,depth);ctx.closePath();ctx.fill();
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.68*pinch;const edge=ctx.createLinearGradient(-span*.45,0,span*.45,0);edge.addColorStop(0,'rgba(105,214,240,0)');edge.addColorStop(.44,'rgba(130,224,244,.68)');edge.addColorStop(.56,'rgba(191,207,255,.72)');edge.addColorStop(1,'rgba(105,214,240,0)');ctx.strokeStyle=edge;ctx.lineWidth=5+3*pinch;ctx.beginPath();ctx.moveTo(-span*.48,0);ctx.bezierCurveTo(-span*.16,-12,span*.16,15,span*.48,2);ctx.stroke();
      ctx.globalAlpha=.16*pinch;ctx.strokeStyle='#b9c6ff';ctx.lineWidth=2;for(let i=0;i<3;i++){const yy=72+i*96+(hash(field.cycle*7+i)-.5)*26;ctx.beginPath();ctx.moveTo(-span*.36,yy);ctx.bezierCurveTo(-span*.12,yy-26,span*.12,yy+18,span*.34,yy-8);ctx.stroke();}
      ctx.restore();
    }
    ctx.restore();
  }

  function drawStageOneBackground(){
    if(typeof drawSpaceBackground==='function')drawSpaceBackground();else baseDrawBackground();
    ctx.save();const wash=ctx.createRadialGradient(vw*.54,vh*.46,30,vw*.54,vh*.46,Math.max(vw,vh)*.78);wash.addColorStop(0,'rgba(47,61,119,.12)');wash.addColorStop(.55,'rgba(19,28,72,.09)');wash.addColorStop(1,'rgba(2,4,15,.34)');ctx.fillStyle=wash;ctx.fillRect(0,0,vw,vh);ctx.restore();
    const cameraY=player.y,spacing=Math.max(1350,vh*1.45),base=Math.floor(cameraY/spacing);
    for(let i=-1;i<=1;i++){
      const idx=base+i,wy=idx*spacing+spacing*(.19+hash(idx*5)*.52),screenY=wy-player.y+vh*.5;
      if(screenY<-vh*.65||screenY>vh*1.65)continue;
      drawRouteSheet(screenY,(hash(idx*3)-.5)*.46,Math.max(vw*1.35,1250),110+hash(idx*11)*120,idx,.11+hash(idx+9)*.07);
    }
    const cell=3600,cx=Math.round(player.x/cell),cy=Math.round(player.y/cell),wx=cx*cell+(hash(cx*17+cy*23)-.5)*1300,wy=cy*cell+(hash(cx*29-cy*13)-.5)*1200,p=worldToScreen(wx,wy),r=Math.min(Math.max(vw,vh)*.42,540);
    if(p.x>-r*1.4&&p.x<vw+r*1.4&&p.y>-r*1.4&&p.y<vh+r*1.4)drawBrokenHalo(p.x,p.y,r,cx*31+cy*7);
    const run=stageRun();if(run?.stage01ClosureField)drawClosureField(run.stage01ClosureField);
  }
  drawBackground=function stageOneCompleteBackground(){if(isStageOne())return drawStageOneBackground();return baseDrawBackground();};

  function enemyFacing(e){return Math.atan2(player.y-e.y,player.x-e.x);}
  function drawStageOneEnemy(g,e){
    const v=e.stageVariant,r=e.r,phase=e.phase||0,hit=e.hit>0;g.lineJoin='round';g.lineCap='round';
    if(v==='shardling'){
      g.rotate(phase*.045);for(const side of[-1,1]){g.save();g.scale(1,side);g.rotate(.12+Math.sin(phase*.8)*.04);const grad=g.createLinearGradient(-r*.7,-r*.5,r*1.15,0);grad.addColorStop(0,'#202a58');grad.addColorStop(.58,hit?'#ffffff':'#5b6dc0');grad.addColorStop(1,'#99c9dc');g.fillStyle=grad;g.beginPath();g.moveTo(-r*.76,-r*.08);g.bezierCurveTo(-r*.16,-r*.60,r*.70,-r*.48,r*1.18,-r*.08);g.bezierCurveTo(r*.54,r*.04,r*.12,r*.30,-r*.60,r*.22);g.closePath();g.fill();g.restore();}g.fillStyle=hit?'#fff':'#d8f8ff';g.beginPath();g.ellipse(r*.02,0,r*.24,r*.16,0,0,TAU);g.fill();
      return true;
    }
    if(v==='dart'){
      g.rotate(enemyFacing(e));const tail=g.createLinearGradient(-r*2.4,0,r*.6,0);tail.addColorStop(0,'rgba(89,207,236,0)');tail.addColorStop(.55,'rgba(89,207,236,.16)');tail.addColorStop(1,'rgba(206,250,255,.55)');g.fillStyle=tail;g.beginPath();g.moveTo(-r*2.35,0);g.lineTo(r*.18,-r*.26);g.lineTo(r*.18,r*.26);g.closePath();g.fill();const body=g.createLinearGradient(-r*.7,-r*.6,r*1.5,r*.4);body.addColorStop(0,'#17294b');body.addColorStop(.55,hit?'#fff':'#62a9d0');body.addColorStop(1,'#ecfdff');g.fillStyle=body;g.beginPath();g.moveTo(r*1.52,0);g.lineTo(r*.22,-r*.48);g.lineTo(-r*.84,-r*.22);g.lineTo(-r*.28,0);g.lineTo(-r*.84,r*.22);g.lineTo(r*.22,r*.48);g.closePath();g.fill();g.fillStyle='#f8ffff';g.beginPath();g.ellipse(r*.45,0,r*.22,r*.10,0,0,TAU);g.fill();return true;
    }
    if(v==='bombardier'){
      g.rotate(enemyFacing(e));const open=.72+.20*Math.sin(phase*.72);for(const side of[-1,1]){g.save();g.scale(1,side);g.rotate(-.10);const grad=g.createLinearGradient(-r,-r*.5,r*.9,0);grad.addColorStop(0,'#211b4d');grad.addColorStop(.58,hit?'#fff':'#755fb6');grad.addColorStop(1,'#b39add');g.fillStyle=grad;g.beginPath();g.moveTo(-r*.74,-r*.06);g.bezierCurveTo(-r*.12,-r*.72*open,r*.68,-r*.66,r*.96,-r*.14);g.bezierCurveTo(r*.52,-r*.04,r*.12,r*.20,-r*.48,r*.20);g.closePath();g.fill();g.restore();}const core=g.createRadialGradient(r*.10,0,1,r*.10,0,r*.38);core.addColorStop(0,'#fff');core.addColorStop(.35,'#f3d8ff');core.addColorStop(1,'#7452a7');g.fillStyle=core;g.beginPath();g.arc(r*.12,0,r*.31,0,TAU);g.fill();g.globalAlpha=.55;g.strokeStyle='#e8dbff';g.lineWidth=3;g.beginPath();g.moveTo(r*.15,-r*.42);g.lineTo(r*.94,0);g.lineTo(r*.15,r*.42);g.stroke();g.globalAlpha=1;return true;
    }
    if(v==='bulwark'){
      g.rotate(enemyFacing(e));for(const side of[-1,1]){g.save();g.scale(1,side);const grad=g.createLinearGradient(-r*.8,-r*.7,r*1.1,0);grad.addColorStop(0,'#151b37');grad.addColorStop(.45,hit?'#fff':'#425075');grad.addColorStop(1,'#8490bc');g.fillStyle=grad;g.beginPath();g.moveTo(-r*.68,-r*.10);g.bezierCurveTo(-r*.30,-r*.82,r*.60,-r*.88,r*1.08,-r*.24);g.lineTo(r*.76,r*.04);g.bezierCurveTo(r*.24,-r*.16,-r*.18,r*.18,-r*.68,r*.10);g.closePath();g.fill();g.restore();}g.fillStyle=hit?'#fff':'#b9d8e2';g.beginPath();g.ellipse(-r*.08,0,r*.30,r*.21,0,0,TAU);g.fill();g.globalAlpha=.42;g.strokeStyle='#dce5ff';g.lineWidth=3;g.beginPath();g.moveTo(-r*.46,0);g.lineTo(r*.72,0);g.stroke();g.globalAlpha=1;return true;
    }
    return baseDrawStageEnemyBody(g,e);
  }
  drawStageEnemyBody=function stageOneEnemyBody(g,e){if(e?.eventKind===STAGE_ID&&e?.kind==='stage')return drawStageOneEnemy(g,e);return baseDrawStageEnemyBody(g,e);};

  function beginClosureField(run){
    const cycle=(run.stage01SealCycle||0)+1;run.stage01SealCycle=cycle;
    const angles=[0,.62,Math.PI/2,-.58],angle=angles[(cycle-1)%angles.length],compact=typeof compactDevice==='function'&&compactDevice();
    run.stage01ClosureField={cycle,age:0,duration:7.4,angle,centerX:player.x,centerY:player.y,gapOpen:compact?360:520,gapMin:compact?205:300,drift:(cycle%2?1:-1)*(compact?38:62),hurtAt:-99};
    run.stage01NextSealAt=(state.time||0)+(cycle<2?58:54);
    const variants=['dart','shardling','bombardier','bulwark'],variant=variants[(cycle-1)%variants.length],count=cycle>=4?5:cycle>=2?4:3;
    window.stackfallSpawnStageBurst?.(STAGE_ID,variant,count);audio.stageAttack?.(STAGE_ID,'route-closing');
  }
  function updateClosureField(dt){
    const run=stageRun();if(!run||run.completed||run.bossSpawned||run.bossIntroPending){if(run)run.stage01ClosureField=null;return;}
    if(!Number.isFinite(run.stage01NextSealAt))run.stage01NextSealAt=44;
    if(!run.stage01ClosureField&&(state.time||0)>=run.stage01NextSealAt)beginClosureField(run);
    const f=run.stage01ClosureField;if(!f)return;f.age+=dt;
    const intro=smooth(sat(f.age/1.35)),release=smooth(sat((f.age-(f.duration-1.35))/1.35)),pinch=intro*(1-release),gap=lerp(f.gapOpen,f.gapMin,pinch),nX=-Math.sin(f.angle),nY=Math.cos(f.angle),centerShift=Math.sin(sat(f.age/f.duration)*Math.PI)*f.drift;
    if(f.age>1.55&&f.age<f.duration-1.15&&pinch>.72){const projected=(player.x-f.centerX)*nX+(player.y-f.centerY)*nY-centerShift;if(Math.abs(projected)>gap*.5-player.r*.3&&(state.time||0)-f.hurtAt>.72){f.hurtAt=state.time||0;hurtPlayer(7,'stage01-closure-field');state.camera.shake=Math.max(state.camera.shake,5);audio.stageAttack?.(STAGE_ID,'route-contact');}}
    if(f.age>=f.duration){run.stage01ClosureField=null;audio.stageAttack?.(STAGE_ID,'route-release');}
  }
  if(baseUpdateSpawning){updateSpawning=function stageOneSpawning(dt){const result=baseUpdateSpawning(dt);if(isStageOne()&&state.mode==='playing')updateClosureField(dt);return result;};}

  function currentAction(e){return e.stage01Action||null;}
  function phaseProgress(a){return a?clamp(a.age/Math.max(.001,a.duration),0,1):0;}
  function bossPose(e){
    const r=Number(e.visualR)||104,a=currentAction(e),p=phaseProgress(a),phase=e.stagePhase||1,morph=e.stage01Morph?smooth(sat(e.stage01Morph.age/e.stage01Morph.duration)):phase>=2?1:0;
    let jaw=.24,spread=.18,stretch=1,twist=0,forward=0,scythe=0,core=.82,trail=0,burst=0;
    if(a?.type==='ram'){
      if(a.phase==='brace'){jaw=lerp(.24,.48,smooth(p));spread=lerp(.18,.08,p);core=.86+.12*p;}
      else if(a.phase==='fold'){jaw=lerp(.48,.88,smooth(p));spread=lerp(.08,-.10,p);stretch=lerp(1,.84,p);core=.98+.18*p;}
      else if(a.phase==='charge'){jaw=.92;spread=-.12;stretch=lerp(.84,1.20,out3(p));forward=.18*p;core=1.18+.28*p;trail=.20+.8*p;}
      else if(a.phase==='dash'){jaw=.96;spread=-.14;stretch=1.33;forward=.34;core=1.46;trail=1;}
      else if(a.phase==='impact'){jaw=lerp(.94,.40,smooth(p));spread=lerp(-.14,.24,p);stretch=lerp(1.32,.92,p);core=lerp(1.55,1.05,p);burst=1-p;}
      else if(a.phase==='recover'){jaw=lerp(.42,.24,smooth(p));spread=lerp(.24,.18,p);stretch=lerp(.92,1,p);}
    }else if(a?.type==='shutter'){
      if(a.phase==='aim'){jaw=.18;spread=lerp(.22,.38,p);twist=.10*p;}
      else if(a.phase==='open'){jaw=lerp(.20,.02,p);spread=lerp(.38,.74,smooth(p));stretch=1.08;forward=.24*p;}
      else if(a.phase==='snap'){jaw=lerp(.04,.98,in3(p));spread=lerp(.74,-.05,out3(p));stretch=1.46;forward=.52;core=1.12+.38*p;}
      else if(a.phase==='hold'){jaw=.98;spread=-.08;stretch=1.46;forward=.52;core=1.42;burst=.35;}
      else if(a.phase==='recoil'){jaw=lerp(.98,.24,smooth(p));spread=lerp(-.08,.18,p);stretch=lerp(1.46,1,p);forward=lerp(.52,0,p);}
    }else if(a?.type==='orbit'){
      if(a.phase==='wind'){spread=lerp(.18,.52,p);twist=lerp(0,-.34,p);scythe=.25*p;core=.90+.12*p;}
      else if(a.phase==='sweep'){spread=.48;twist=-.40;scythe=1;stretch=1.06;trail=.46;core=1.08;}
      else if(a.phase==='recover'){spread=lerp(.48,.18,p);twist=lerp(-.40,0,p);scythe=1-p;}
    }else if(a?.type==='breakline'){
      if(a.phase==='brace'){jaw=lerp(.24,.80,p);spread=lerp(.18,-.06,p);core=.95+.24*p;}
      else if(a.phase==='dashA'||a.phase==='dashB'){jaw=.96;spread=-.12;stretch=1.38;forward=.40;core=1.45;trail=1;twist=a.phase==='dashB'?.18:-.12;}
      else if(a.phase==='pivot'){jaw=lerp(.92,.46,p);spread=lerp(-.10,.40,p);twist=lerp(-.12,.32,p);core=1.24;}
      else if(a.phase==='rupture'){jaw=lerp(.92,.12,p);spread=lerp(-.12,.60,p);stretch=lerp(1.38,.90,p);core=1.6;burst=1-p;}
      else if(a.phase==='recover'){jaw=lerp(.34,.24,p);spread=lerp(.40,.18,p);stretch=lerp(.92,1,p);}
    }
    return{r,a,p,phase,morph,jaw,spread,stretch,twist,forward,scythe,core,trail,burst};
  }

  function drawClosureWing(r,side,pose,now){
    const phase2=pose.morph,asym=side>0?phase2:0;
    ctx.save();ctx.scale(1,side);ctx.rotate(side*(pose.spread+pose.twist*(side>0?1:.4)+asym*.18));ctx.translate(r*(pose.forward*.35+asym*.10),-r*(pose.jaw*.18+asym*.12));
    const long=1+pose.scythe*(side>0?.78:.32)+asym*.20,back=-r*(.88+asym*.12),tip=r*(1.22*long),thick=r*(.56-asym*.05);
    const g=ctx.createLinearGradient(back,-thick,tip,thick*.25);g.addColorStop(0,side>0&&phase2>.35?'#291730':'#182144');g.addColorStop(.34,side>0&&phase2>.35?'#6f365f':'#3f5188');g.addColorStop(.73,side>0&&phase2>.35?'#b45d92':'#7188c4');g.addColorStop(1,side>0&&phase2>.35?'#e7a5c7':'#a9d7df');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(back,-r*.06);ctx.bezierCurveTo(-r*.34,-thick,r*.58*long,-thick*.98,tip,-r*.16);ctx.bezierCurveTo(r*.76*long,r*.10,r*.18*long,r*.42,back+r*.22,r*.24);ctx.bezierCurveTo(-r*.32,r*.12,-r*.55,r*.05,back,-r*.06);ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.30+.18*pose.trail;const seam=ctx.createLinearGradient(-r*.46,0,tip,0);seam.addColorStop(0,'rgba(188,211,255,0)');seam.addColorStop(.45,side>0&&phase2>.35?'rgba(255,174,215,.54)':'rgba(162,225,241,.52)');seam.addColorStop(1,'rgba(255,255,255,.82)');ctx.strokeStyle=seam;ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(-r*.42,-r*.03);ctx.bezierCurveTo(r*.14,-r*.18,r*.66*long,-r*.25,tip*.90,-r*.08);ctx.stroke();
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.52;ctx.fillStyle=side>0&&phase2>.35?'#f2a7ca':'#bfdef0';ctx.beginPath();ctx.ellipse(r*.34*long,-r*.20,r*.13,r*.055,-.10,0,TAU);ctx.fill();ctx.restore();
  }

  function drawClosureBoss(e,overridePose=null){
    const pose=overridePose||bossPose(e),{r,morph,core,trail,burst}=pose,now=state.time||0,angle=Number.isFinite(e.stage01Angle)?e.stage01Angle:Math.PI/2;
    ctx.save();ctx.rotate(angle);ctx.scale(pose.stretch,1);
    if(trail>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.30*trail;const tg=ctx.createLinearGradient(-r*2.6,0,-r*.1,0);tg.addColorStop(0,'rgba(96,166,235,0)');tg.addColorStop(.6,morph>.45?'rgba(228,101,166,.18)':'rgba(91,206,234,.20)');tg.addColorStop(1,'rgba(223,250,255,.60)');ctx.fillStyle=tg;ctx.beginPath();ctx.moveTo(-r*2.5,0);ctx.bezierCurveTo(-r*1.55,-r*.42,-r*.62,-r*.44,-r*.06,-r*.22);ctx.lineTo(-r*.06,r*.22);ctx.bezierCurveTo(-r*.62,r*.44,-r*1.55,r*.42,-r*2.5,0);ctx.fill();ctx.restore();}
    drawClosureWing(r,-1,pose,now);drawClosureWing(r,1,pose,now);
    const mantle=ctx.createLinearGradient(-r*.72,-r*.45,r*.72,r*.42);mantle.addColorStop(0,'#11182f');mantle.addColorStop(.48,morph>.4?'#3c2448':'#26355e');mantle.addColorStop(1,morph>.4?'#75405f':'#4b6c91');ctx.fillStyle=mantle;ctx.beginPath();ctx.moveTo(-r*.72,0);ctx.bezierCurveTo(-r*.58,-r*.58,r*.08,-r*.70,r*.66,-r*.32);ctx.bezierCurveTo(r*.91,-r*.14,r*.91,r*.14,r*.66,r*.32);ctx.bezierCurveTo(r*.08,r*.70,-r*.58,r*.58,-r*.72,0);ctx.fill();
    ctx.fillStyle='#03050d';ctx.beginPath();ctx.moveTo(r*.54,0);ctx.bezierCurveTo(r*.24,-r*(.43+.12*morph),-r*.30,-r*(.36+.05*morph),-r*.46,0);ctx.bezierCurveTo(-r*.25,r*(.38+.05*morph),r*.24,r*(.44+.11*morph),r*.54,0);ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.62;ctx.strokeStyle=morph>.45?'#f2a3ca':'#9edee7';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(r*.46,0);ctx.bezierCurveTo(r*.20,-r*.34,-r*.25,-r*.30,-r*.39,0);ctx.bezierCurveTo(-r*.22,r*.31,r*.20,r*.35,r*.46,0);ctx.stroke();
    const cp=(.90+.10*Math.sin(now*4.3))*core,cg=ctx.createRadialGradient(r*.08,-r*.05,1,0,0,r*.35*core);cg.addColorStop(0,'#ffffff');cg.addColorStop(.24,morph>.45?'#ffd6eb':'#e6fdff');cg.addColorStop(.52,morph>.45?'#ec6fac':'#65d8eb');cg.addColorStop(1,'rgba(74,92,186,0)');ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(r*.02,0,r*.26*cp,r*.18*cp,0,0,TAU);ctx.fill();
    if(burst>0){ctx.globalAlpha=.42*burst;ctx.strokeStyle='#ffffff';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,0,r*(.70+burst*.72),r*(.42+burst*.42),0,0,TAU);ctx.stroke();}
    if(e.hit){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.22;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,0,r*.92,r*.64,0,0,TAU);ctx.fill();}
    ctx.restore();
  }
  drawEliteShape=function stageOneCompleteElite(e){if(e?.kind==='stage-boss'&&e.eventKind===STAGE_ID){drawClosureBoss(e);return;}return baseDrawEliteShape(e);};

  function ellipseShape(out,cx,cy,rx,ry,angle,steps=10){const c=Math.cos(angle),s=Math.sin(angle);out.kind='polygon';out.x=cx;out.y=cy;out.a=angle;out.hw=rx;out.hh=ry;out.points=out.points||[];out.points.length=steps;for(let i=0;i<steps;i++){const a=i/steps*TAU,lx=Math.cos(a)*rx,ly=Math.sin(a)*ry,p=out.points[i]||(out.points[i]={});p.x=cx+lx*c-ly*s;p.y=cy+lx*s+ly*c;}return out;}
  function stageOneShapes(e){
    const pose=bossPose(e),r=pose.r,a=Number.isFinite(e.stage01Angle)?e.stage01Angle:Math.PI/2,c=Math.cos(a),s=Math.sin(a),parts=e.stage01CompleteShapes||(e.stage01CompleteShapes=[{},{},{},{}]);
    const wingReach=r*(.55+pose.scythe*.62+pose.forward*.36),wingY=r*(.30+pose.spread*.42),phase2=pose.morph;
    ellipseShape(parts[0],e.x,e.y,r*.62*pose.stretch,r*.46,a,12);
    for(let side=-1;side<=1;side+=2){const idx=side<0?1:2,lx=r*.18+wingReach*.30,ly=side*(wingY-r*pose.jaw*.10),cx=e.x+lx*c-ly*s,cy=e.y+lx*s+ly*c,rot=a+side*(pose.spread*.62+pose.twist*.42);ellipseShape(parts[idx],cx,cy,r*(.64+pose.scythe*(side>0?.48:.20))*pose.stretch,r*.20,rot,10);}
    const lx=-r*.22,ly=phase2*r*.18,cx=e.x+lx*c-ly*s,cy=e.y+lx*s+ly*c;ellipseShape(parts[3],cx,cy,r*.34,r*(.28+.08*phase2),a,9);return parts;
  }
  window.stackfallStageBodyShapes=e=>e?.eventKind===STAGE_ID?stageOneShapes(e):baseBodyShapes?.(e)||e?.stageBodyShapes||[];
  window.stackfallClampStageBossToArena=e=>{if(!(e?.kind==='stage-boss'&&e.eventKind===STAGE_ID))return baseClampBoss?.(e);const arena=state.stageBossArena;if(arena?.stageId!==STAGE_ID)return;const pad=(Number(e.visualR)||104)*.72;e.x=clamp(e.x,arena.x-arena.halfW+pad,arena.x+arena.halfW-pad);e.y=clamp(e.y,arena.y-arena.halfH+pad,arena.y+arena.halfH-pad);stageOneShapes(e);};

  function setActionPhase(e,name,duration){const a=e.stage01Action;a.phase=name;a.age=0;a.duration=duration;a.hit=false;}
  function beginRam(e){
    const angle=Math.atan2(player.y-e.y,player.x-e.x),dist=clamp(Math.hypot(player.x-e.x,player.y-e.y)+150,350,570);e.stage01Angle=angle;e.stage01Action={type:'ram',phase:'brace',age:0,duration:.30,originX:e.x,originY:e.y,targetX:e.x+Math.cos(angle)*dist,targetY:e.y+Math.sin(angle)*dist,hit:false};e.stage01Ram=e.stage01Action;audio.stageAttack?.(STAGE_ID,'closure-brace');
  }
  function beginShutter(e){e.stage01Angle=Math.atan2(player.y-e.y,player.x-e.x);e.stage01Action={type:'shutter',phase:'aim',age:0,duration:.38,hit:false};e.stage01Ram=null;audio.stageAttack?.(STAGE_ID,'shutter-prepare');}
  function beginOrbit(e){const around=Math.atan2(e.y-player.y,e.x-player.x),dir=e.stage01OrbitDir||1;e.stage01Action={type:'orbit',phase:'wind',age:0,duration:.34,centerX:player.x,centerY:player.y,startAngle:around,dir,hitStamp:-99};e.stage01Ram=null;audio.stageAttack?.(STAGE_ID,'orbit-wind');}
  function beginBreakline(e){const angle=Math.atan2(player.y-e.y,player.x-e.x),dist=clamp(Math.hypot(player.x-e.x,player.y-e.y)+170,380,590);e.stage01Angle=angle;e.stage01Action={type:'breakline',phase:'brace',age:0,duration:.25,originX:e.x,originY:e.y,targetX:e.x+Math.cos(angle)*dist,targetY:e.y+Math.sin(angle)*dist,hitA:false,hitB:false};e.stage01Ram=null;audio.stageAttack?.(STAGE_ID,'breakline-brace');}

  function hitDash(e,a,tag,mult=.72){if(!a.hit&&Math.hypot(player.x-e.x,player.y-e.y)<(Number(e.contactR)||62)+player.r+24){a.hit=true;hurtPlayer(Math.max(8,e.damage*mult),tag);state.hitStop=Math.max(state.hitStop||0,.05);state.camera.shake=Math.max(state.camera.shake,9);}}
  function updateRam(e,dt){
    const a=e.stage01Action,p=phaseProgress(a);a.age+=dt;
    if(a.phase==='brace'&&a.age>=a.duration)setActionPhase(e,'fold',.29);
    else if(a.phase==='fold'&&a.age>=a.duration){setActionPhase(e,'charge',.25);audio.stageAttack?.(STAGE_ID,'closure-charge');}
    else if(a.phase==='charge'&&a.age>=a.duration){a.originX=e.x;a.originY=e.y;setActionPhase(e,'dash',.42);audio.stageAttack?.(STAGE_ID,'closure-release');}
    else if(a.phase==='dash'){
      const t=out3(phaseProgress(a));e.x=lerp(a.originX,a.targetX,t);e.y=lerp(a.originY,a.targetY,t);stageOneShapes(e);hitDash(e,a,'stage01-closure-ram',.74);
      if(a.age>=a.duration){setActionPhase(e,'impact',.18);shockwave(e.x,e.y,e.stagePhase>=2?'#ef91bf':'#8edfe9',185,.34,4);spawnParticle(e.x,e.y,'#e9fbff',10,190,3.4);state.camera.shake=Math.max(state.camera.shake,10);audio.stageAttack?.(STAGE_ID,'closure-impact');}
    }else if(a.phase==='impact'&&a.age>=a.duration){a.recoverX=e.x;a.recoverY=e.y;setActionPhase(e,'recover',.58);}
    else if(a.phase==='recover'){
      const q=smooth(phaseProgress(a)),desired=e.stage01Angle,hx=player.x-Math.cos(desired)*(e.stagePhase>=2?235:275),hy=player.y-Math.sin(desired)*(e.stagePhase>=2?235:275);e.x=lerp(a.recoverX,hx,q);e.y=lerp(a.recoverY,hy,q);if(a.age>=a.duration){e.stage01Action=null;e.stage01Ram=null;e.stage01Cooldown=e.stagePhase>=2?.72:1.05;}
    }
  }
  function updateShutter(e,dt){
    const a=e.stage01Action;a.age+=dt;
    if(a.phase==='aim'){
      const desired=Math.atan2(player.y-e.y,player.x-e.x);e.stage01Angle=approachAngle(e.stage01Angle,desired,dt*3.4);const hx=player.x-Math.cos(e.stage01Angle)*315,hy=player.y-Math.sin(e.stage01Angle)*315;e.x=lerp(e.x,hx,Math.min(1,dt*1.7));e.y=lerp(e.y,hy,Math.min(1,dt*1.7));if(a.age>=a.duration){setActionPhase(e,'open',.31);audio.stageAttack?.(STAGE_ID,'shutter-open');}
    }else if(a.phase==='open'&&a.age>=a.duration){setActionPhase(e,'snap',.22);audio.stageAttack?.(STAGE_ID,'shutter-snap');}
    else if(a.phase==='snap'){
      const p=phaseProgress(a);if(!a.hit&&p>.58){const q=localOf(player.x,player.y,e.x,e.y,e.stage01Angle);if(q.x>10&&q.x<390&&Math.abs(q.y)<78){a.hit=true;hurtPlayer(Math.max(9,e.damage*.82),'stage01-shutter');state.hitStop=Math.max(state.hitStop||0,.055);}state.camera.shake=Math.max(state.camera.shake,7);}
      if(a.age>=a.duration){setActionPhase(e,'hold',.18);shockwave(e.x+Math.cos(e.stage01Angle)*155,e.y+Math.sin(e.stage01Angle)*155,'#b9ebf0',140,.28,3);}
    }else if(a.phase==='hold'&&a.age>=a.duration)setActionPhase(e,'recoil',.55);
    else if(a.phase==='recoil'&&a.age>=a.duration){e.stage01Action=null;e.stage01Cooldown=e.stagePhase>=2?.74:1.10;}
  }
  function updateOrbit(e,dt){
    const a=e.stage01Action;a.age+=dt;
    if(a.phase==='wind'&&a.age>=a.duration){a.centerX=player.x;a.centerY=player.y;a.startAngle=Math.atan2(e.y-a.centerY,e.x-a.centerX);setActionPhase(e,'sweep',1.02);a.hitStamp=-99;audio.stageAttack?.(STAGE_ID,'orbit-sweep');}
    else if(a.phase==='sweep'){
      const p=phaseProgress(a),ang=a.startAngle+a.dir*2.65*out3(p),rad=225;e.x=a.centerX+Math.cos(ang)*rad;e.y=a.centerY+Math.sin(ang)*rad;e.stage01Angle=ang+Math.PI;const tipX=e.x+Math.cos(e.stage01Angle)*150,tipY=e.y+Math.sin(e.stage01Angle)*150;if(Math.hypot(player.x-tipX,player.y-tipY)<58&&(state.time||0)-a.hitStamp>.55){a.hitStamp=state.time||0;hurtPlayer(Math.max(8,e.damage*.66),'stage01-orbit-reap');state.camera.shake=Math.max(state.camera.shake,5);}if(a.age>=a.duration){a.recoverX=e.x;a.recoverY=e.y;setActionPhase(e,'recover',.50);}
    }else if(a.phase==='recover'){const p=smooth(phaseProgress(a)),hx=player.x-Math.cos(e.stage01Angle)*245,hy=player.y-Math.sin(e.stage01Angle)*245;e.x=lerp(a.recoverX,hx,p);e.y=lerp(a.recoverY,hy,p);if(a.age>=a.duration){e.stage01Action=null;e.stage01Cooldown=.62;e.stage01OrbitDir=(e.stage01OrbitDir||1)*-1;}}
  }
  function updateBreakline(e,dt){
    const a=e.stage01Action;a.age+=dt;
    if(a.phase==='brace'&&a.age>=a.duration){a.originX=e.x;a.originY=e.y;setActionPhase(e,'dashA',.34);audio.stageAttack?.(STAGE_ID,'breakline-release');}
    else if(a.phase==='dashA'){
      const t=out3(phaseProgress(a));e.x=lerp(a.originX,a.targetX,t);e.y=lerp(a.originY,a.targetY,t);a.hit=a.hitA;hitDash(e,a,'stage01-breakline-a',.66);a.hitA=a.hit;if(a.age>=a.duration){a.pivotX=e.x;a.pivotY=e.y;setActionPhase(e,'pivot',.27);}
    }else if(a.phase==='pivot'){
      const desired=Math.atan2(player.y-e.y,player.x-e.x);e.stage01Angle=approachAngle(e.stage01Angle,desired,dt*7);if(a.age>=a.duration){const dist=clamp(Math.hypot(player.x-e.x,player.y-e.y)+180,380,610);a.originX=e.x;a.originY=e.y;a.targetX=e.x+Math.cos(e.stage01Angle)*dist;a.targetY=e.y+Math.sin(e.stage01Angle)*dist;setActionPhase(e,'dashB',.34);audio.stageAttack?.(STAGE_ID,'breakline-return');}
    }else if(a.phase==='dashB'){
      const t=out3(phaseProgress(a));e.x=lerp(a.originX,a.targetX,t);e.y=lerp(a.originY,a.targetY,t);a.hit=a.hitB;hitDash(e,a,'stage01-breakline-b',.74);a.hitB=a.hit;if(a.age>=a.duration){setActionPhase(e,'rupture',.22);shockwave(e.x,e.y,'#f39bc7',220,.38,4.5);spawnParticle(e.x,e.y,'#ffd5ea',14,220,4);state.camera.shake=Math.max(state.camera.shake,13);audio.stageAttack?.(STAGE_ID,'breakline-impact');}
    }else if(a.phase==='rupture'&&a.age>=a.duration){a.recoverX=e.x;a.recoverY=e.y;setActionPhase(e,'recover',.56);}
    else if(a.phase==='recover'){const p=smooth(phaseProgress(a)),hx=player.x-Math.cos(e.stage01Angle)*235,hy=player.y-Math.sin(e.stage01Angle)*235;e.x=lerp(a.recoverX,hx,p);e.y=lerp(a.recoverY,hy,p);if(a.age>=a.duration){e.stage01Action=null;e.stage01Cooldown=.58;}}
  }

  function startNextBossAttack(e,forced=null){
    const p1=['ram','shutter','ram','shutter'],p2=['orbit','ram','shutter','breakline'],pattern=e.stagePhase>=2?p2:p1,type=forced||pattern[(e.stage01AttackIndex||0)%pattern.length];e.stage01AttackIndex=(e.stage01AttackIndex||0)+1;
    if(type==='ram')beginRam(e);else if(type==='shutter')beginShutter(e);else if(type==='orbit')beginOrbit(e);else beginBreakline(e);
  }
  function updateBossIdle(e,dt){
    const phase=e.stagePhase||1,desired=Math.atan2(player.y-e.y,player.x-e.x);e.stage01Angle=Number.isFinite(e.stage01Angle)?approachAngle(e.stage01Angle,desired,dt*(phase>=2?2.8:2.1)):desired;
    e.stage01OrbitAngle=Number.isFinite(e.stage01OrbitAngle)?e.stage01OrbitAngle:(desired+Math.PI);
    const dir=e.stage01OrbitDir||1,speed=phase>=2?.38:.19;e.stage01OrbitAngle+=dt*speed*dir;const radius=phase>=2?245:285,wobble=Math.sin((state.time||0)*.7+e.id)*22,hx=player.x+Math.cos(e.stage01OrbitAngle)*(radius+wobble),hy=player.y+Math.sin(e.stage01OrbitAngle)*(radius+wobble*.5);e.x=lerp(e.x,hx,Math.min(1,dt*(phase>=2?.95:.58)));e.y=lerp(e.y,hy,Math.min(1,dt*(phase>=2?.95:.58)));
  }
  function updateMorph(e,dt){
    const m=e.stage01Morph;if(!m)return false;m.age+=dt;const p=sat(m.age/m.duration);e.contactSafeUntil=(state.time||0)+.18;if(!m.pulseA&&p>.32){m.pulseA=true;shockwave(e.x,e.y,'#e98cbd',145,.36,4);spawnParticle(e.x,e.y,'#f8c8df',10,140,3);audio.stageAttack?.(STAGE_ID,'phase-break');}if(!m.pulseB&&p>.72){m.pulseB=true;shockwave(e.x,e.y,'#96dce8',210,.48,3.5);state.camera.shake=Math.max(state.camera.shake,10);}if(p>=1){e.stage01Morph=null;e.stage01Cooldown=.52;return false;}return true;
  }
  window.updateStageBossSkill=function stageOneCompleteBossSkill(e,dt){
    if(!(e?.kind==='stage-boss'&&e.eventKind===STAGE_ID))return baseBossSkill?.(e,dt);if(e.dead)return;
    const ratio=e.maxHp>0?e.hp/e.maxHp:1;if(ratio<=.55&&(e.stagePhase||1)<2){e.stagePhase=2;e.stage01Action=null;e.stage01Ram=null;e.stage01Morph={age:0,duration:1.08,pulseA:false,pulseB:false};e.stage01OrbitDir=(e.id%2?1:-1);}
    if(updateMorph(e,dt)){stageOneShapes(e);return;}
    e.contactSafeUntil=(state.time||0)+.16;
    const a=e.stage01Action;if(a){if(a.type==='ram')updateRam(e,dt);else if(a.type==='shutter')updateShutter(e,dt);else if(a.type==='orbit')updateOrbit(e,dt);else updateBreakline(e,dt);stageOneShapes(e);return;}
    updateBossIdle(e,dt);e.stage01Cooldown=(Number.isFinite(e.stage01Cooldown)?e.stage01Cooldown:1.0)-dt;if(e.stage01Cooldown<=0)startNextBossAttack(e);window.stackfallClampStageBossToArena?.(e);stageOneShapes(e);
  };

  window.stackfallStage01ForceAttack=(type)=>{const e=state.entities.enemies.find(x=>x?.kind==='stage-boss'&&x.eventKind===STAGE_ID&&!x.dead);if(!e)return false;e.stage01Action=null;e.stage01Ram=null;startNextBossAttack(e,type);return true;};
  window.stackfallStage01BossState=()=>{const e=state.entities.enemies.find(x=>x?.kind==='stage-boss'&&x.eventKind===STAGE_ID&&!x.dead),a=e?.stage01Action;return e?{phase:e.stagePhase||1,attack:a?.type||'idle',motion:a?.phase||'idle',progress:phaseProgress(a),morph:e.stage01Morph?phaseProgress(e.stage01Morph):0,shapes:stageOneShapes(e).length}:null;};

  drawRealmCinematicOverlay=function stageOneCompleteRealmOverlay(){
    const trn=state.realmTransition;if(!(isStageOne()&&trn?.owner===STAGE_ID+'-boss-entry'))return baseRealmOverlay();const p=sat(trn.elapsed/trn.duration),fade=Math.sin(Math.PI*p),form=smooth(sat((p-.08)/.58)),close=smooth(sat((p-.34)/.38)),mobile=vw<620;
    ctx.save();ctx.globalAlpha=.76*fade;const bg=ctx.createRadialGradient(vw*.5,vh*.43,20,vw*.5,vh*.43,Math.max(vw,vh)*.72);bg.addColorStop(0,'rgba(27,37,86,.82)');bg.addColorStop(1,'rgba(1,3,12,.94)');ctx.fillStyle=bg;ctx.fillRect(0,0,vw,vh);ctx.restore();
    ctx.save();ctx.globalAlpha=fade*.55;const y=vh*(mobile?.41:.43),gap=lerp(vh*.42,vh*.16,close);for(const side of[-1,1]){const gy=y+side*gap*.5,g=ctx.createLinearGradient(0,gy-side*90,0,gy+side*90);g.addColorStop(0,'rgba(88,117,186,0)');g.addColorStop(1,'rgba(122,191,217,.40)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(vw*.08,gy);ctx.bezierCurveTo(vw*.32,gy+side*25,vw*.66,gy-side*18,vw*.92,gy);ctx.lineTo(vw*.92,gy+side*120);ctx.lineTo(vw*.08,gy+side*120);ctx.closePath();ctx.fill();}ctx.restore();
    const fake={visualR:mobile?88:112,stagePhase:1,stage01Angle:Math.PI/2,stage01Action:{type:'ram',phase:p<.48?'brace':'fold',age:form,duration:1},stage01Morph:null,hit:0};ctx.save();ctx.translate(vw*.5,vh*(mobile?.42:.40));ctx.scale(.54+.46*form,.54+.46*form);ctx.globalAlpha=fade;drawClosureBoss(fake);ctx.restore();
    ctx.save();ctx.globalAlpha=fade*smooth(sat((p-.18)/.30));ctx.textAlign='center';ctx.fillStyle='#eef9ff';ctx.font=`900 ${Math.round(clamp(vw*(mobile?.070:.042),28,52))}px "Black Han Sans",sans-serif`;ctx.fillText(trn.title||'폐쇄체',vw*.5,vh*(mobile?.67:.66));ctx.fillStyle='rgba(167,206,224,.78)';ctx.font='800 12px "IBM Plex Sans KR",sans-serif';ctx.fillText(GAME_SETTINGS.language==='ko'?'끊어진 선이 스스로 닫히기 시작한다':'THE BROKEN LINE CLOSES ITSELF',vw*.5,vh*(mobile?.67:.66)+29);ctx.restore();
  };

  function drawStageOneDefeat(v){
    const age=v.elapsed,p=worldToScreen(v.x,v.y),body=v.body||{},implode=smooth(sat(age/.72)),tear=smooth(sat((age-.62)/.82)),fade=1-smooth(sat((age-2.35)/.72));
    const pose=bossPose({...body,stage01Action:null,stagePhase:2,stage01Morph:null});pose.jaw=lerp(.24,.95,implode);pose.spread=lerp(.18,.72,tear);pose.twist=tear*.65;pose.stretch=lerp(1,.72,tear);pose.core=lerp(1.05,1.65,implode)*(1-tear*.42);pose.burst=Math.max(0,1-Math.abs(age-1.15)/.38);pose.morph=1;
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=fade;drawClosureBoss({...body,stagePhase:2,stage01Angle:body.stage01Angle||Math.PI/2,hit:0},pose);ctx.restore();
    if(age>.88){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade*.55;const reach=smooth(sat((age-.88)/1.0))*Math.max(vw,vh)*.52;ctx.strokeStyle='#9bdce7';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(p.x-reach,p.y);ctx.bezierCurveTo(p.x-reach*.42,p.y-25,p.x-35,p.y+12,p.x,p.y);ctx.moveTo(p.x+reach,p.y);ctx.bezierCurveTo(p.x+reach*.42,p.y+22,p.x+35,p.y-10,p.x,p.y);ctx.stroke();ctx.restore();}
    if(age>1.05&&age<1.95){const pulse=1-Math.abs(age-1.45)/.5;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.max(0,pulse)*.34;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,220);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.22,'rgba(141,225,239,.48)');g.addColorStop(1,'rgba(93,123,211,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,220,0,TAU);ctx.fill();ctx.restore();}
    if(age>.95){ctx.save();ctx.globalAlpha=smooth(sat((age-.95)/.50))*fade;ctx.textAlign='center';ctx.fillStyle='#dcecf0';ctx.font=`800 ${vw<620?18:24}px "IBM Plex Sans KR",sans-serif`;ctx.fillText(age<1.85?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw*.5,vh*(vw<620?.22:.20));ctx.restore();}
  }
  window.drawStageVictoryCinematic=function stageOneCompleteVictoryDraw(){const v=state.stageVictory;if(state.mode==='stageVictory'&&v?.stageId===STAGE_ID){drawStageOneDefeat(v);return;}return baseVictoryDraw?.();};

  window.stackfallStage01CompleteDiagnostics=()=>{
    const run=stageRun(),boss=state.entities.enemies.find(e=>e?.kind==='stage-boss'&&e.eventKind===STAGE_ID&&!e.dead),bs=boss?window.stackfallStage01BossState():null;
    return{active:isStageOne(),style:STYLE,background:'sparse-route-masses',enemyVisuals:['shardling','dart','bombardier','bulwark'],gimmick:run?.stage01ClosureField?'closure-field':'ready',boss:bs,phaseRules:'silhouette+movement+pattern',attacks:['ram','shutter','orbit','breakline'],mobileAware:true};
  };
})();