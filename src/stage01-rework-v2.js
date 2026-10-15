// Stage 1 / 폐쇄선 vertical-slice rework v2.
// Purpose: sparse multi-corridor environment + distinct transport-control boss patterns.
// Loaded after the legacy runtime so Stage 2+ remain untouched.
(()=>{
  if(window.__stackfallStageOneReworkV2Loaded)return;
  window.__stackfallStageOneReworkV2Loaded=true;

  const S1={
    installed:false,
    baseSkill:null,
    spriteBudget:0,
    lastWorldDrawMs:0,
    maxWorldDrawMs:0,
    worldDrawSamples:0,
    combatVersion:'lockline-v2'
  };
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const ease=t=>{t=clamp01(t);return t*t*(3-2*t);};
  const now=()=>Number(state?.time)||0;
  const isCompact=()=>typeof compactDevice==='function'?compactDevice():vw<760;
  const hash=(a,b=0,c=0)=>{
    if(typeof stageWorldHash==='function')return stageWorldHash(a,b,c);
    const x=Math.sin(a*12.9898+b*78.233+c*37.719)*43758.5453;
    return x-Math.floor(x);
  };
  function boss01(){
    const id=state?.bossActiveId;
    return state?.entities?.enemies?.find(e=>e&&!e.dead&&e.id===id&&e.eventKind==='stage-01')||
      state?.entities?.enemies?.find(e=>e&&!e.dead&&e.kind==='stage-boss'&&e.eventKind==='stage-01')||null;
  }
  function arena01(){
    const a=state?.stageBossArena;
    return a?.stageId==='stage-01'?a:null;
  }
  function sprite(key,x,y,w,h,alpha=1){
    if(typeof frontierSprite!=='function')return false;
    S1.spriteBudget++;
    ctx.save();ctx.globalAlpha*=alpha;const ok=frontierSprite(key,x,y,w,h);ctx.restore();return ok;
  }
  function line(x1,y1,x2,y2,width,color,alpha=1,dash=null){
    ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';
    if(dash)ctx.setLineDash(dash);
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
  }
  function corridorFrame(angle,acrossOffset){
    const c=Math.cos(angle),s=Math.sin(angle),wx=player.x||0,wy=player.y||0;
    return{
      c,s,
      along:wx*c+wy*s,
      across:-wx*s+wy*c-acrossOffset,
      toScreen(u,v){
        const dx=u*c-v*s,dy=u*s+v*c;
        return{x:vw*.5+dx,y:vh*.5+dy};
      }
    };
  }
  function drawBeacon(p,active=false,scale=1){
    if(p.x<-80||p.x>vw+80||p.y<-80||p.y>vh+80)return;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.17);
    ctx.fillStyle='rgba(5,10,13,.88)';ctx.fillRect(-8*scale,-22*scale,16*scale,44*scale);
    ctx.fillStyle=active?'rgba(157,239,238,.86)':'rgba(115,144,145,.55)';
    ctx.fillRect(-3*scale,-15*scale,6*scale,12*scale);
    ctx.fillStyle='rgba(190,119,51,.58)';ctx.fillRect(-5*scale,5*scale,10*scale,4*scale);
    ctx.restore();
  }
  function drawCorridor(angle,offset,width,opts={}){
    const f=corridorFrame(angle,offset),span=Math.hypot(vw,vh)+900;
    ctx.save();ctx.translate(vw*.5,vh*.5);ctx.rotate(angle);
    const y=-f.across;
    const alpha=opts.alpha??1;
    // A navigation corridor, not a literal road: dark traffic wake + sparse guide rails.
    ctx.globalAlpha=.17*alpha;ctx.fillStyle=opts.fill||'#10191c';ctx.fillRect(-span,y-width*.50,span*2,width);
    ctx.globalAlpha=.42*alpha;ctx.strokeStyle=opts.edge||'#59686a';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-span,y-width*.5);ctx.lineTo(span,y-width*.5);ctx.moveTo(-span,y+width*.5);ctx.lineTo(span,y+width*.5);ctx.stroke();
    ctx.globalAlpha=.32*alpha;ctx.strokeStyle=opts.guide||'#b97737';ctx.lineWidth=3;ctx.setLineDash([54,70]);
    ctx.lineDashOffset=-f.along*.32;
    ctx.beginPath();ctx.moveTo(-span,y);ctx.lineTo(span,y);ctx.stroke();
    ctx.setLineDash([]);
    const step=opts.step||430,base=Math.floor(f.along/step);
    ctx.restore();
    for(let k=base-3;k<=base+3;k++){
      if(opts.gaps&&hash(k,Math.round(offset),17)>.64)continue;
      const u=k*step-f.along,p=f.toScreen(u,-f.across);
      drawBeacon(p,opts.active&&Math.abs(k-base)<=1,opts.beaconScale||1);
    }
    return f;
  }
  function drawConnector(angle,worldAlong,fromOffset,toOffset,alpha=.55){
    const c=Math.cos(angle),s=Math.sin(angle),wx=player.x||0,wy=player.y||0,along=wx*c+wy*s,across=-wx*s+wy*c;
    const u=worldAlong-along,v1=fromOffset-across,v2=toOffset-across;
    const p1={x:vw*.5+u*c-v1*s,y:vh*.5+u*s+v1*c};
    const p2={x:vw*.5+u*c-v2*s,y:vh*.5+u*s+v2*c};
    if((p1.x<-300&&p2.x<-300)||(p1.x>vw+300&&p2.x>vw+300)||(p1.y<-300&&p2.y<-300)||(p1.y>vh+300&&p2.y>vh+300))return;
    line(p1.x,p1.y,p2.x,p2.y,10,'#0b1114',alpha);
    line(p1.x,p1.y,p2.x,p2.y,2,'#657476',alpha*.72,[16,13]);
    const mx=(p1.x+p2.x)*.5,my=(p1.y+p2.y)*.5;
    ctx.save();ctx.translate(mx,my);ctx.rotate(angle+Math.PI/2);ctx.globalAlpha=.34*alpha;
    if(typeof frontierSprite==='function'){S1.spriteBudget++;frontierSprite('girder',-92,-11,184,22);}
    ctx.restore();
  }
  function drawStageOneCorridorWorld(){
    const started=typeof performance!=='undefined'?performance.now():0;
    S1.spriteBudget=0;
    const f=state.stageRun?.frontier||{},angle=-.17,mainW=isCompact()?116:142;
    // Three related transport corridors establish place without filling space with one giant slab.
    const main=drawCorridor(angle,0,mainW,{alpha:1,active:true,step:410});
    drawCorridor(angle,420,74,{alpha:.52,gaps:true,step:520,guide:'#6f8d90',beaconScale:.82});
    drawCorridor(angle,-520,66,{alpha:.33,gaps:true,step:610,guide:'#6e6977',beaconScale:.72});
    // Sparse cross-links make this a traffic-control junction rather than parallel decorative lines.
    const junctionStep=1760,jBase=Math.floor(main.along/junctionStep);
    for(let j=jBase-1;j<=jBase+1;j++){
      const worldAlong=j*junctionStep+480;
      drawConnector(angle,worldAlong,0,420,.62);
      if((j&1)===0)drawConnector(angle,worldAlong+310,0,-520,.40);
      const x=worldAlong-main.along;
      if(Math.abs(x)<Math.max(vw,vh)*.72&&typeof frontierSprite==='function'){
        const p=main.toScreen(x,-main.across);
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle+Math.PI/2);ctx.globalAlpha=.48+.20*(f.gateApproach||0);
        S1.spriteBudget++;frontierSprite('gate',-155,-34,310,68);ctx.restore();
      }
    }
    // Broken cargo frames sit off the active corridor; max two expensive sprite draws on screen.
    const cell=1250,cx=Math.floor((player.x||0)/cell),cy=Math.floor((player.y||0)/cell);
    let debrisDrawn=0;
    for(let gy=cy-1;gy<=cy+1&&debrisDrawn<2;gy++)for(let gx=cx-1;gx<=cx+1&&debrisDrawn<2;gx++){
      const h=hash(gx,gy,91);if(h<.72)continue;
      const wx=gx*cell+(h-.5)*380,wy=gy*cell+(hash(gx,gy,93)-.5)*540,p=typeof worldToScreen==='function'?worldToScreen(wx,wy):{x:0,y:0};
      if(p.x<-260||p.x>vw+260||p.y<-220||p.y>vh+220)continue;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate((hash(gx,gy,97)-.5)*1.1);ctx.globalAlpha=.25;
      if(typeof frontierSprite==='function'){S1.spriteBudget++;frontierSprite(hash(gx,gy,99)>.82?'gate':'girder',-210,-28,420,56);}
      ctx.restore();debrisDrawn++;
    }
    if(started){
      const ms=performance.now()-started;S1.lastWorldDrawMs=ms;S1.maxWorldDrawMs=Math.max(S1.maxWorldDrawMs,ms);S1.worldDrawSamples++;
    }
  }
  function drawStageOneCorridorArena(){
    const a=arena01();if(!a)return;
    const p=typeof worldToScreen==='function'?worldToScreen(a.x,a.y):{x:vw*.5,y:vh*.5};
    const phase=a.phase||1,expand=phase>=2?ease(((state.time||0)-(a.phaseOpenedAt||0))/1.1):0,hw=a.halfW*(1+.12*expand),hh=a.halfH;
    const boss=boss01(),v=boss?.stageOneV2||{},safe=Number.isInteger(v.safeLane)&&Number(v.safeLaneUntil||0)>now()?v.safeLane:null,lanes=[-.48,0,.48];
    ctx.save();ctx.translate(p.x,p.y);
    // Open bay: lane hints carry the arena, not a heavy rectangular cage.
    for(let i=0;i<lanes.length;i++){
      const y=lanes[i]*hh;
      ctx.globalAlpha=safe===i?.16:.07;ctx.fillStyle=safe===i?'#86d8d6':'#748082';ctx.fillRect(-hw,y-34,hw*2,68);
      ctx.globalAlpha=safe===i?.52:.20;ctx.strokeStyle=safe===i?'#b6f2ef':'#6e7878';ctx.lineWidth=safe===i?2.2:1.1;ctx.setLineDash([28,28]);ctx.lineDashOffset=-(state.time||0)*22;
      ctx.beginPath();ctx.moveTo(-hw,y);ctx.lineTo(hw,y);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.globalAlpha=.28;ctx.strokeStyle='#535f60';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(-hw,-hh);ctx.lineTo(-hw+110,-hh);ctx.moveTo(hw-110,-hh);ctx.lineTo(hw,-hh);ctx.moveTo(-hw,hh);ctx.lineTo(-hw+110,hh);ctx.moveTo(hw-110,hh);ctx.lineTo(hw,hh);ctx.stroke();
    // A committed charge gets a low-key projected lane, separate from the damaging body.
    const ram=v.ram;
    if(ram&&ram.warnUntil>(state.time||0)){
      const x1=ram.x1-a.x,y1=ram.y1-a.y,x2=ram.x2-a.x,y2=ram.y2-a.y,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,w=Math.max(42,(boss?.contactR||65)*.82);
      ctx.globalAlpha=.10;ctx.fillStyle='#d18742';ctx.beginPath();ctx.moveTo(x1+nx*w,y1+ny*w);ctx.lineTo(x2+nx*w,y2+ny*w);ctx.lineTo(x2-nx*w,y2-ny*w);ctx.lineTo(x1-nx*w,y1-ny*w);ctx.closePath();ctx.fill();
      ctx.globalAlpha=.66;ctx.strokeStyle='#e6b072';ctx.lineWidth=1.4;ctx.setLineDash([14,10]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function phase01(e){
    const next=e.hp/Math.max(1,e.maxHp)<=.48?2:1,prev=Math.max(1,Number(e.stagePhase)||1);
    if(next!==prev){
      e.stagePhase=next;e.stageOneV2=e.stageOneV2||{};const v=e.stageOneV2;
      if(typeof clearStagePhysicalObjects==='function')clearStagePhysicalObjects();
      const a=arena01();if(a){a.phase=next;a.phaseOpenedAt=now();}
      e.stageGateCoreOpen=true;e.stageGateOpenedAt=now();v.attackIndex=0;v.nextAttackAt=now()+1.45;v.anchor=(v.anchor+1)%3;v.safeLane=null;
      e.stageRamUntil=0;e.stageRamWindupUntil=0;e.dash=0;e.dashX=0;e.dashY=0;
      state.camera.shake=Math.max(state.camera.shake||0,5);state.flash=Math.max(state.flash||0,.05);
      if(typeof spawnParticle==='function')spawnParticle(e.x,e.y,'#b8e3df',10,120,3.5);
      audio?.stageAttack?.('stage-01','phase-open');
    }else e.stagePhase=next;
    return next;
  }
  function setMotion(e,vx,vy){
    const cap=Math.max(70,e.speed*2.25),m=Math.hypot(vx,vy);
    if(m>cap){vx=vx/m*cap;vy=vy/m*cap;}
    e.stageMotionX=Number.isFinite(vx)?vx:0;e.stageMotionY=Number.isFinite(vy)?vy:0;
  }
  function move01(e,dt,phase){
    const a=arena01();if(!a)return;
    const v=e.stageOneV2||(e.stageOneV2={anchor:1,attackIndex:0,nextAttackAt:now()+1.2});
    const t=now();
    if((e.stageRamUntil||0)>t){
      const dur=Math.max(.1,(e.stageRamUntil-e.stageRamStart)),q=clamp01((t-e.stageRamStart)/dur),speed=(phase>=2?720:640)*Math.sin(Math.PI*q);
      e.stageMotionX=Math.cos(e.stageRamAngle)*speed;e.stageMotionY=Math.sin(e.stageRamAngle)*speed;e.stageBodyAngle=e.stageRamAngle-Math.PI/2;return;
    }
    if((e.stageRamWindupUntil||0)>t){
      const q=1-clamp01((t-(e.stageActionAt||t))/.9);setMotion(e,-Math.cos(e.stageRamAngle)*34*q,-Math.sin(e.stageRamAngle)*34*q);
      const desired=e.stageRamAngle-Math.PI/2,delta=Math.atan2(Math.sin(desired-(e.stageBodyAngle||0)),Math.cos(desired-(e.stageBodyAngle||0)));
      e.stageBodyAngle=(e.stageBodyAngle||0)+Math.max(-2.0*dt,Math.min(2.0*dt,delta));return;
    }
    if((e.attackLockUntil||0)>t){setMotion(e,(e.stageMotionX||0)*.82,(e.stageMotionY||0)*.82);return;}
    const anchors=phase>=2?[-.48,.18,.50]:[-.43,0,.43],ix=Math.max(0,Math.min(2,v.anchor??1));
    const tx=a.x+anchors[ix]*a.halfW,ty=a.y-a.halfH*(phase>=2?.30:.43),dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1,speed=Math.min(phase>=2?96:72,d*1.45);
    const blend=1-Math.exp(-dt*3.0);e.stageMotionX=(e.stageMotionX||0)+(dx/d*speed-(e.stageMotionX||0))*blend;e.stageMotionY=(e.stageMotionY||0)+(dy/d*speed-(e.stageMotionY||0))*blend;
    e.stageBodyAngle=(e.stageBodyAngle||0)*(1-Math.min(1,dt*3.2));
  }
  function addPhysical(o){
    return typeof addStagePhysicalObject==='function'?addStagePhysicalObject(o):null;
  }
  function laneClosure(e,phase,cycle){
    const a=arena01(),v=e.stageOneV2,lanes=[-.48,0,.48],playerLane=Math.abs(player.y-(a.y+lanes[0]*a.halfH))<Math.abs(player.y-a.y)?0:Math.abs(player.y-(a.y+lanes[2]*a.halfH))<Math.abs(player.y-a.y)?2:1;
    // Do not always spare the player's current lane: first teach, then force anticipation.
    const safe=phase===1?(cycle%3):(playerLane+(cycle%2?1:2))%3;v.safeLane=safe;v.safeLaneUntil=now()+2.45;e.stageAction='bulkhead';e.stageActionAt=now();e.attackLockUntil=now()+2.8;
    for(let i=0;i<3;i++)if(i!==safe){
      const y=a.y+lanes[i]*a.halfH,fromSide=((cycle+i)&1)?1:-1,hw=a.halfW*.94;
      addPhysical({kind:'bulkhead',ownerId:e.id,fromX:a.x+fromSide*(a.halfW+hw+90),fromY:y,toX:a.x,toY:y,x:a.x+fromSide*(a.halfW+hw+90),y,hw,hh:25,angle:0,a:0,warn:1.05+(i*.08),travel:.44,hold:.82,damage:e.damage*.30});
    }
    audio?.stageAttack?.('stage-01','shutter-warn');
  }
  function cargoTow(e,phase,cycle){
    const a=arena01(),v=e.stageOneV2,dir=cycle%2?1:-1;e.stageAction='salvage';e.stageActionAt=now();e.attackLockUntil=now()+3.1;v.safeLane=null;
    const laneYs=[-.48,0,.48].map(q=>a.y+q*a.halfH),gap=(cycle+phase)%3;
    for(let i=0;i<3;i++){
      if(i===gap&&phase===1)continue;
      const y=laneYs[i]+(phase>=2?(i-1)*20:0),fromX=a.x-dir*(a.halfW+120),toX=a.x+dir*(a.halfW+120);
      addPhysical({kind:'salvage',ownerId:e.id,fromX,fromY:y,toX,toY:y+(phase>=2?(i%2?70:-70):0),x:fromX,y,hw:i===1?62:48,hh:14,angle:dir>0?0:Math.PI,a:0,warn:.92+i*.22,travel:phase>=2?.72:.86,hold:.42,damage:e.damage*.32,variant:i});
    }
    audio?.stageAttack?.('stage-01','debris-warn');
  }
  function movingCompression(e,phase,cycle){
    const a=arena01(),v=e.stageOneV2,gap=Math.max(118,player.r*2+92),shift=(cycle%2?1:-1)*(phase>=2?a.halfW*.23:a.halfW*.12),len=a.halfH*.80;
    e.stageAction='bulkhead';e.stageActionAt=now();e.attackLockUntil=now()+3.15;v.safeLane=null;
    for(const side of[-1,1]){
      const hw=len,hh=24,fromX=a.x+side*(a.halfW+90),toX=a.x+side*(gap*.5+hh)+shift;
      addPhysical({kind:'bulkhead',ownerId:e.id,fromX,fromY:a.y,toX,toY:a.y,x:fromX,y:a.y,hw,hh,angle:Math.PI/2,a:Math.PI/2,warn:1.10,travel:.52,hold:1.08,damage:e.damage*.34,passageShift:-shift*.42});
    }
    audio?.stageAttack?.('stage-01','shutter-warn');
  }
  function switchyardReroute(e,phase,cycle){
    const a=arena01(),v=e.stageOneV2,side=cycle%2?1:-1,pivotX=a.x-side*a.halfW*.16,pivotY=a.y+(cycle%3-1)*a.halfH*.18,len=Math.min(300,a.halfW*.92);
    e.stageAction='girder';e.stageActionAt=now();e.attackLockUntil=now()+2.75;v.safeLane=side>0?0:2;v.safeLaneUntil=now()+2.35;v.anchor=side>0?0:2;
    const base=side>0?-.88:Math.PI+.88;
    for(let i=0;i<2;i++)addPhysical({kind:'girder',ownerId:e.id,pivotX,pivotY:pivotY+(i?86:-86),length:len,x:pivotX+Math.cos(base)*len*.5,y:pivotY+(i?86:-86)+Math.sin(base)*len*.5,hw:len*.5,hh:18,angle:base,a:base,sweep:side*(phase>=2?1.18:.92)*(i?1:-1),warn:.92+i*.10,travel:.68,hold:.32,damage:e.damage*.36});
    audio?.stageAttack?.('stage-01','girder-warn');
  }
  function committedRam(e,phase,cycle){
    const a=arena01(),v=e.stageOneV2,px=player.x,py=player.y,dx=px-e.x,dy=py-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,max=phase>=2?Math.min(640,a.halfW*1.22):Math.min(540,a.halfW*1.05);
    const x2=Math.max(a.x-a.halfW+80,Math.min(a.x+a.halfW-80,e.x+ux*max)),y2=Math.max(a.y-a.halfH+72,Math.min(a.y+a.halfH-72,e.y+uy*max));
    e.stageAction='ram';e.stageActionAt=now();e.stageRamAngle=Math.atan2(y2-e.y,x2-e.x);e.stageRamWindupUntil=now()+1.18;e.contactSafeUntil=now()+1.18;e.attackLockUntil=now()+2.55;
    v.ram={x1:e.x,y1:e.y,x2,y2,warnUntil:now()+1.18,releaseAt:now()+1.18,released:false,phase};v.safeLane=null;
    ++v.token;audio?.stageAttack?.('stage-01','ram-charge');
  }
  function attack01(e,phase){
    const v=e.stageOneV2||(e.stageOneV2={anchor:1,attackIndex:0,nextAttackAt:now()+1.2,token:0});
    const cycle=++v.attackIndex,phase1=['lane','tow','compress','ram'],phase2=['reroute','tow','compress','lane','ram'],name=(phase>=2?phase2:phase1)[(cycle-1)%(phase>=2?phase2.length:phase1.length)];
    v.lastAttack=name;v.anchor=(v.anchor+(cycle%2?1:2))%3;
    if(name==='lane')laneClosure(e,phase,cycle);
    else if(name==='tow')cargoTow(e,phase,cycle);
    else if(name==='compress')movingCompression(e,phase,cycle);
    else if(name==='reroute')switchyardReroute(e,phase,cycle);
    else committedRam(e,phase,cycle);
    v.nextAttackAt=now()+(phase>=2?3.0:3.45)+(name==='ram'?.35:0);
  }
  function updateBoss01(e,dt){
    if(!e||e.dead)return;
    const a=arena01();if(!a)return;
    const v=e.stageOneV2||(e.stageOneV2={anchor:1,attackIndex:0,nextAttackAt:now()+1.35,token:0,safeLane:null});
    const phase=phase01(e);
    if(v.ram&&!v.ram.released&&now()>=v.ram.releaseAt){
      v.ram.released=true;v.ram.warnUntil=0;e.stageRamWindupUntil=0;e.stageRamStart=now();e.stageRamUntil=now()+(v.ram.phase>=2?.64:.72);e.contactSafeUntil=now();audio?.stageAttack?.('stage-01','ram-release');
    }
    // Keep the actual body in the authored bay; no rubber-band player tracking.
    move01(e,dt,phase);
    if((e.stageRamUntil||0)&&now()>=e.stageRamUntil){
      e.stageRamUntil=0;e.stageRamRecoilAt=now();e.attackLockUntil=Math.max(e.attackLockUntil||0,now()+.55);
      state.camera.shake=Math.max(state.camera.shake||0,7);state.hitStop=Math.max(state.hitStop||0,.035);
      if(typeof spawnParticle==='function')spawnParticle(e.x,e.y,'#d7d1c3',7,120,3);audio?.stageAttack?.('stage-01','ram-impact');
    }
    if(now()<(e.attackLockUntil||0)||now()<(e.stageRamWindupUntil||0)||now()<(e.stageRamUntil||0))return;
    if(now()>=v.nextAttackAt)attack01(e,phase);
  }
  function installCombat(){
    if(S1.installed)return true;
    if(typeof window.updateStageBossSkill!=='function')return false;
    S1.baseSkill=window.updateStageBossSkill;
    window.updateStageBossSkill=function stageOneSkillV2(enemy,dt){
      if(enemy?.eventKind==='stage-01'&&enemy?.kind==='stage-boss'){updateBoss01(enemy,dt);return;}
      return S1.baseSkill(enemy,dt);
    };
    S1.installed=true;return true;
  }
  function installVisuals(){
    try{
      if(typeof drawStageOneFrontierField==='function')drawStageOneFrontierField=drawStageOneCorridorWorld;
      if(typeof drawStageOneWardenArena==='function')drawStageOneWardenArena=drawStageOneCorridorArena;
    }catch(error){console.error('[stage01 corridor visuals]',error);}
  }
  function install(){
    installVisuals();
    if(!installCombat())setTimeout(install,40);
  }
  setTimeout(install,0);
  if(typeof window.addEventListener==='function')window.addEventListener('load',install,{once:true});

  window.stackfallStageOneReworkDiagnostics=()=>({
    version:S1.combatVersion,
    installed:S1.installed,
    spriteBudget:S1.spriteBudget,
    lastWorldDrawMs:+S1.lastWorldDrawMs.toFixed(3),
    maxWorldDrawMs:+S1.maxWorldDrawMs.toFixed(3),
    worldDrawSamples:S1.worldDrawSamples,
    activePattern:boss01()?.stageOneV2?.lastAttack||null,
    safeLane:boss01()?.stageOneV2?.safeLane??null
  });
})();
