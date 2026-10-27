// Run progression pauses for the entire Apex lifecycle. The simulation clock
// (state.time) keeps ticking for attacks, animation, movement and cooldowns.
function isApexProgressionClockPaused(){
  return!!(state.apexActiveId||state.pendingApexForm||state.apexExitPending||
    ['apexReward'].includes(state.mode)||
    ['apex-entry','apex-exit'].includes(state.realmTransition?.owner)||
    !document.querySelector('#apexRewardScreen')?.classList.contains('hidden'));
}
function runProgressionTime(){return Math.max(0,Number(state.runTime)||0);}
function withProgressionClock(action){const simulationTime=state.time;state.time=runProgressionTime();try{return action();}finally{state.time=simulationTime;}}
window.stackfallApexClockDiagnostics=()=>({runTime:runProgressionTime(),simulationTime:Math.max(0,Number(state.time)||0),paused:isApexProgressionClockPaused(),active:!!state.apexActiveId,pending:!!state.pendingApexForm,exit:!!state.apexExitPending,reward:state.mode==='apexReward'});
const apexClockResetBase=resetGame;
resetGame=function resetGameWithRunClock(){state.runTime=0;return apexClockResetBase();};
const apexClockSpawnBase=spawnEnemy;
spawnEnemy=function spawnEnemyAtRunProgression(){return withProgressionClock(()=>apexClockSpawnBase(...arguments));};
const apexClockSpawningBase=updateSpawning;
updateSpawning=function updateSpawningAtRunProgression(dt){return withProgressionClock(()=>apexClockSpawningBase(dt));};
const apexClockMapEventsBase=window.updateMapEvents;
if(typeof apexClockMapEventsBase==='function')window.updateMapEvents=updateMapEvents=function updateMapEventsAtRunProgression(dt){return withProgressionClock(()=>apexClockMapEventsBase(dt));};
const apexClockUpdateHudBase=updateHUD;
updateHUD=function updateHudWithRunClock(){const result=apexClockUpdateHudBase();const seconds=Math.floor(runProgressionTime()),minutes=Math.floor(seconds/60),remainder=seconds%60;if(ui.timer)ui.timer.textContent=`${String(minutes).padStart(2,'0')}:${String(remainder).padStart(2,'0')}`;state.threat=1+Math.floor(seconds/60);if(ui.threat)ui.threat.textContent=`${tr('hud.threat')} ${state.threat}`;return result;};
const apexClockEndGameBase=endGame;
endGame=function endGameWithRunTime(){const result=apexClockEndGameBase();if(ui.resultTime)ui.resultTime.textContent=formatTime(runProgressionTime());return result;};
const apexClockUpdateApexBase=updateApexSystems;
updateApexSystems=function updateApexAtProgressionTime(dt=0,priorityOnly=false){if(state.apexActiveId||state.apexExitPending||String(state.realmTransition?.to||'').startsWith('apex-'))return apexClockUpdateApexBase(dt,priorityOnly);return withProgressionClock(()=>apexClockUpdateApexBase(dt,priorityOnly));};

// Apex Reborn: first-pass Atropos vertical slice.
// Keeps the shared Apex clock/multipart infrastructure, replaces only Chronophage combat/rendering.
const STACKFALL_ATROPOS_REBORN=true;
const ATROPOS_PART_LAYOUT=[
  {key:'left-hand',label:'LEFT HAND',dx:-520,dy:305,r:88},
  {key:'left-shoulder',label:'LEFT SHOULDER',dx:-225,dy:28,r:86},
  {key:'sternum',label:'STERNUM',dx:0,dy:72,r:108},
  {key:'right-shoulder',label:'RIGHT SHOULDER',dx:225,dy:28,r:86},
  {key:'right-hand',label:'RIGHT HAND',dx:520,dy:305,r:88}
];

function atroposPart(e,key){return e?.bodyParts?.find(part=>part.key===key)||null;}
function atroposEaseOut(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3);}
function atroposEaseInOut(t){t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function atroposLerp(a,b,t){return a+(b-a)*t;}
function ensureRebornAtropos(e){
  if(!e||e.apexForm!=='chronophage')return false;
  if(!e.atroposReborn){
    const anchorX=player.x,anchorY=player.y-260;
    e.x=anchorX;e.y=anchorY;e.speed=0;e.contactSafeUntil=1e12;
    e.atroposReborn={
      anchorX,anchorY,slash:null,slashCd:1.45,
      lastHitPart:null,lastHitAt:-99,attackSerial:0,
      bodyBreath:Math.random()*TAU
    };
    defineBossBodyParts(e,ATROPOS_PART_LAYOUT);
    e.debugBodyParts=false;
  }
  e.x=e.atroposReborn.anchorX;e.y=e.atroposReborn.anchorY;e.speed=0;e.contactSafeUntil=1e12;
  refreshBossBodyParts(e);
  return true;
}
function resetAtroposPose(e){
  if(!e?.bodyParts)return;
  for(const def of ATROPOS_PART_LAYOUT){
    const part=atroposPart(e,def.key);if(!part)continue;
    part.dx=def.dx;part.dy=def.dy;part.active=true;part.visible=true;
  }
}
function updateAtroposPose(e){
  resetAtroposPose(e);
  const slash=e.atroposReborn?.slash;if(!slash)return refreshBossBodyParts(e);
  const hand=atroposPart(e,'right-hand'),shoulder=atroposPart(e,'right-shoulder');
  if(!hand||!shoulder)return refreshBossBodyParts(e);
  const age=slash.age;
  if(age<.72){
    const q=atroposEaseInOut(age/.72);
    hand.dx=atroposLerp(520,360,q);hand.dy=atroposLerp(305,-155,q);
    shoulder.dx=atroposLerp(225,255,q);shoulder.dy=atroposLerp(28,-18,q);
    hand.active=false;
  }else if(age<.90){
    const q=atroposEaseOut((age-.72)/.18);
    hand.dx=atroposLerp(360,-455,q);hand.dy=atroposLerp(-155,285,q);
    shoulder.dx=atroposLerp(255,180,q);shoulder.dy=atroposLerp(-18,72,q);
    hand.active=false;
  }else if(age<1.42){
    hand.dx=-455;hand.dy=285;shoulder.dx=180;shoulder.dy=72;hand.active=false;
  }else{
    const q=atroposEaseInOut((age-1.42)/.74);
    hand.dx=atroposLerp(-455,520,q);hand.dy=atroposLerp(285,305,q);
    shoulder.dx=atroposLerp(180,225,q);shoulder.dy=atroposLerp(72,28,q);
    hand.active=q>.72;
  }
  return refreshBossBodyParts(e);
}
function startRebornAtroposSlash(e){
  ensureRebornAtropos(e);updateAtroposPose(e);
  const hand=atroposPart(e,'right-hand'),px=player.x,py=player.y;
  const fromX=hand?.x??e.x+520,fromY=hand?.y??e.y+305;
  let angle=Math.atan2(py-fromY,px-fromX);
  const side=(++e.atroposReborn.attackSerial%2)?1:-1;
  angle+=side*.13;
  const ux=Math.cos(angle),uy=Math.sin(angle),half=720;
  e.atroposReborn.slash={
    age:0,angle,targetX:px,targetY:py,
    x1:px-ux*half,y1:py-uy*half,x2:px+ux*half,y2:py+uy*half,
    damaged:false,impactPlayed:false
  };
  audio.tone(82,.26,'sawtooth',.025,38);
}
function updateRebornAtroposSlash(e,dt){
  const slash=e.atroposReborn?.slash;if(!slash)return;
  slash.age+=dt;updateAtroposPose(e);
  if(slash.age>=.72&&slash.age<.90&&!slash.swingPlayed){
    slash.swingPlayed=true;
    audio.tone(155,.09,'square',.025,-80);
    state.camera.shake=Math.max(state.camera.shake,4.5);
  }
  if(slash.age>=1.20&&!slash.impactPlayed){
    slash.impactPlayed=true;
    const width=32,dist=segmentDistance(player.x,player.y,slash.x1,slash.y1,slash.x2,slash.y2);
    if(dist<=width+player.r&&player.invuln<=0)hurtPlayer(Math.max(8,e.damage*.52),e);
    state.camera.shake=Math.max(state.camera.shake,10);
    state.hitStop=Math.max(state.hitStop,.045);
    state.flash=Math.max(state.flash,.035);
    audio.hit(true);
    audio.tone(54,.24,'sawtooth',.04,-18);
    const mx=(slash.x1+slash.x2)*.5,my=(slash.y1+slash.y2)*.5;
    shockwave(mx,my,'#dffef8',160,.38,3.5);
    for(let i=0;i<12;i++){
      const q=(i+.5)/12,x=atroposLerp(slash.x1,slash.x2,q),y=atroposLerp(slash.y1,slash.y2,q);
      spawnParticle(x+rand(-18,18),y+rand(-18,18),i%2?'#dffef8':'#79ffe1',1,rand(28,62),rand(2,4));
    }
  }
  if(slash.age>=2.16){
    e.atroposReborn.slash=null;
    resetAtroposPose(e);refreshBossBodyParts(e);
  }
}
function updateRebornAtropos(e,dt){
  ensureRebornAtropos(e);
  e.apexElapsed=(e.apexElapsed||0)+dt;
  const health=e.hp/Math.max(1,e.maxHp);
  e.apexPhase=health<.25?4:health<.50?3:health<.75?2:1;
  e.timeLock=0;
  updateRebornAtroposSlash(e,dt);
  if(!e.atroposReborn.slash){
    e.atroposReborn.slashCd-=dt;
    if(e.atroposReborn.slashCd<=0){
      startRebornAtroposSlash(e);
      e.atroposReborn.slashCd=Math.max(3.9,5.25-e.apexPhase*.18);
    }
  }
  updateAtroposPose(e);
}

const baseApexBossSkillReborn=apexBossSkill;
apexBossSkill=function apexBossSkillReborn(e,dt){
  if((e?.apexForm||e?.eliteForm)==='chronophage')return updateRebornAtropos(e,dt);
  return baseApexBossSkillReborn(e,dt);
};
const baseApexPhaseDirectorReborn=apexPhaseDirector;
apexPhaseDirector=function apexPhaseDirectorReborn(e,dt){
  if((e?.apexForm||e?.eliteForm)==='chronophage')return;
  return baseApexPhaseDirectorReborn(e,dt);
};
const baseApexMotionVelocityReborn=apexMotionVelocity;
apexMotionVelocity=function apexMotionVelocityReborn(e){
  if((e?.apexForm||e?.eliteForm)==='chronophage'){
    APEX_MOTION_BUFFER.x=0;APEX_MOTION_BUFFER.y=0;return APEX_MOTION_BUFFER;
  }
  return baseApexMotionVelocityReborn(e);
};

const baseDealDamageAtropos=dealDamage;
dealDamage=function dealDamageAtroposPartReaction(target,amount,options={}){
  const owner=target?.bodyPart?target.owner:target;
  if(target?.bodyPart&&owner?.apexForm==='chronophage'&&owner.atroposReborn){
    owner.atroposReborn.lastHitPart=target.key;
    owner.atroposReborn.lastHitAt=state.time||0;
  }
  return baseDealDamageAtropos(target,amount,options);
};

function atroposScreenPoint(x,y){return{x:x-player.x+vw/2,y:y-player.y+vh/2};}
function atroposPartHitPulse(e,key){
  const r=e.atroposReborn;if(!r||r.lastHitPart!==key)return 0;
  return clamp(1-((state.time||0)-r.lastHitAt)/.16,0,1);
}
function atroposBodyPath(g,cx,cy,scale=1){
  g.beginPath();
  g.moveTo(cx-205*scale,cy-52*scale);
  g.bezierCurveTo(cx-174*scale,cy-162*scale,cx-104*scale,cy-226*scale,cx-62*scale,cy-232*scale);
  g.bezierCurveTo(cx-32*scale,cy-260*scale,cx+32*scale,cy-260*scale,cx+62*scale,cy-232*scale);
  g.bezierCurveTo(cx+104*scale,cy-226*scale,cx+174*scale,cy-162*scale,cx+205*scale,cy-52*scale);
  g.bezierCurveTo(cx+185*scale,cy+94*scale,cx+128*scale,cy+205*scale,cx+92*scale,cy+278*scale);
  g.bezierCurveTo(cx+42*scale,cy+320*scale,cx-42*scale,cy+320*scale,cx-92*scale,cy+278*scale);
  g.bezierCurveTo(cx-128*scale,cy+205*scale,cx-185*scale,cy+94*scale,cx-205*scale,cy-52*scale);
  g.closePath();
}
function drawAtroposArm(g,shoulder,hand,side,alpha=1,echo=0){
  const sx=shoulder.x,sy=shoulder.y,hx=hand.x,hy=hand.y;
  const dx=hx-sx,dy=hy-sy,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  const bendX=(sx+hx)*.5+nx*(side*78),bendY=(sy+hy)*.5+ny*(side*78);
  g.save();g.globalAlpha*=alpha;g.lineCap='round';g.lineJoin='round';
  const grad=g.createLinearGradient(sx,sy,hx,hy);
  grad.addColorStop(0,echo?'rgba(88,205,198,.10)':'#0d2a2c');
  grad.addColorStop(.48,echo?'rgba(103,255,225,.12)':'#173d3e');
  grad.addColorStop(1,echo?'rgba(184,255,240,.08)':'#092023');
  g.strokeStyle=grad;g.lineWidth=echo?116:126;
  g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(bendX,bendY,hx,hy);g.stroke();
  g.strokeStyle=echo?'rgba(160,255,238,.16)':'rgba(124,255,226,.34)';g.lineWidth=echo?2:4;
  g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(bendX,bendY,hx,hy);g.stroke();
  g.restore();
}
function drawAtroposHand(g,p,key,e){
  const hit=atroposPartHitPulse(e,key),open=atroposPart(e,key)?.active!==false;
  g.save();g.translate(p.x,p.y);
  const tilt=key==='left-hand'?.16:-.16;g.rotate(tilt);
  if(hit){g.translate(rand(-4,4)*hit,rand(-3,3)*hit);}
  const grad=g.createRadialGradient(-20,-26,8,0,0,96);
  grad.addColorStop(0,hit?'#ffffff':open?'#2d6964':'#1a3838');
  grad.addColorStop(.52,hit?'#bffff2':'#173c3d');
  grad.addColorStop(1,'#07191c');
  g.fillStyle=grad;g.strokeStyle=hit?'#ffffff':open?'#8fffe0':'#39756e';g.lineWidth=4;
  g.beginPath();
  g.moveTo(-74,10);g.bezierCurveTo(-80,-34,-52,-73,-18,-70);
  g.bezierCurveTo(-6,-100,15,-103,24,-68);
  g.bezierCurveTo(42,-93,62,-82,55,-54);
  g.bezierCurveTo(79,-66,92,-43,72,-21);
  g.bezierCurveTo(94,-13,91,14,66,21);
  g.bezierCurveTo(53,58,20,80,-18,74);
  g.bezierCurveTo(-48,72,-70,50,-74,10);g.closePath();g.fill();g.stroke();
  g.globalAlpha=open?.74:.24;g.strokeStyle='#dffff8';g.lineWidth=2;
  for(let i=0;i<3;i++){g.beginPath();g.moveTo(-36+i*22,44);g.quadraticCurveTo(-28+i*18,4,-12+i*19,-42);g.stroke();}
  g.globalAlpha=1;g.restore();
}
function drawAtroposWorldBody(e){
  if(!ensureRebornAtropos(e))return;
  updateAtroposPose(e);
  const center=atroposScreenPoint(e.x,e.y),leftShoulder=atroposScreenPoint(atroposPart(e,'left-shoulder').x,atroposPart(e,'left-shoulder').y),
    rightShoulder=atroposScreenPoint(atroposPart(e,'right-shoulder').x,atroposPart(e,'right-shoulder').y),
    leftHand=atroposScreenPoint(atroposPart(e,'left-hand').x,atroposPart(e,'left-hand').y),
    rightHand=atroposScreenPoint(atroposPart(e,'right-hand').x,atroposPart(e,'right-hand').y);
  const margin=760;
  if(center.x<-margin||center.x>vw+margin||center.y<-margin||center.y>vh+margin)return;
  const t=state.time||0,breath=Math.sin(t*.72+e.atroposReborn.bodyBreath)*5;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  // Time-offset silhouettes establish depth without attaching the boss to the camera.
  for(const echo of[{x:-10,y:7,a:.10},{x:12,y:-6,a:.07}]){
    ctx.save();ctx.translate(echo.x,echo.y);ctx.globalAlpha=echo.a;
    drawAtroposArm(ctx,leftShoulder,leftHand,-1,1,1);drawAtroposArm(ctx,rightShoulder,rightHand,1,1,1);
    ctx.fillStyle='#79ffe1';atroposBodyPath(ctx,center.x,center.y+breath,1);ctx.fill();ctx.restore();
  }
  // Main limbs first, then torso/head, so hands feel physically attached rather than floating weak points.
  drawAtroposArm(ctx,leftShoulder,leftHand,-1,1,0);drawAtroposArm(ctx,rightShoulder,rightHand,1,1,0);
  const torso=ctx.createLinearGradient(center.x-220,center.y-240,center.x+180,center.y+310);
  torso.addColorStop(0,'#102e31');torso.addColorStop(.45,'#173c3d');torso.addColorStop(1,'#07181c');
  ctx.fillStyle=torso;ctx.strokeStyle='rgba(143,255,224,.56)';ctx.lineWidth=4;
  atroposBodyPath(ctx,center.x,center.y+breath,1);ctx.fill();ctx.stroke();
  // Sternum fracture: part of the anatomy, not an icon.
  const chest=atroposScreenPoint(atroposPart(e,'sternum').x,atroposPart(e,'sternum').y),chestHit=atroposPartHitPulse(e,'sternum');
  ctx.save();ctx.translate(chest.x,chest.y);
  if(chestHit)ctx.translate(rand(-4,4)*chestHit,rand(-3,3)*chestHit);
  ctx.strokeStyle=chestHit?'#ffffff':'rgba(210,255,246,.72)';ctx.lineWidth=chestHit?5:3;
  ctx.beginPath();ctx.moveTo(-34,-82);ctx.lineTo(-4,-33);ctx.lineTo(-18,4);ctx.lineTo(18,38);ctx.lineTo(-5,91);ctx.stroke();
  ctx.globalAlpha=.32;ctx.strokeStyle='#79ffe1';ctx.lineWidth=12;ctx.stroke();ctx.restore();
  // Head is deliberately mask-like and quiet; scale comes from anatomy rather than a giant glowing core.
  ctx.save();ctx.translate(center.x,center.y-330+breath*.4);
  const headGrad=ctx.createLinearGradient(-65,-100,55,105);headGrad.addColorStop(0,'#183b3d');headGrad.addColorStop(1,'#061619');
  ctx.fillStyle=headGrad;ctx.strokeStyle='rgba(180,255,238,.55)';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-62,-78);ctx.quadraticCurveTo(0,-120,64,-72);ctx.lineTo(54,47);ctx.quadraticCurveTo(8,104,-44,58);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(226,255,249,.62)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,-70);ctx.lineTo(-7,-18);ctx.lineTo(12,22);ctx.lineTo(-3,62);ctx.stroke();ctx.restore();
  // Shoulder seams visibly belong to the body.
  for(const [key,p] of [['left-shoulder',leftShoulder],['right-shoulder',rightShoulder]]){
    const hit=atroposPartHitPulse(e,key);ctx.save();ctx.translate(p.x,p.y);
    ctx.strokeStyle=hit?'#fff':'rgba(143,255,224,.48)';ctx.lineWidth=hit?5:3;ctx.beginPath();ctx.arc(0,0,63,-2.65,.25);ctx.stroke();ctx.restore();
  }
  drawAtroposHand(ctx,leftHand,'left-hand',e);drawAtroposHand(ctx,rightHand,'right-hand',e);
  ctx.restore();
}
function drawAtroposSpaceCut(e){
  const slash=e.atroposReborn?.slash;if(!slash||slash.age<.66||slash.age>1.64)return;
  const a=atroposScreenPoint(slash.x1,slash.y1),b=atroposScreenPoint(slash.x2,slash.y2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  ctx.save();ctx.lineCap='round';
  if(slash.age<1.20){
    const q=clamp((slash.age-.66)/.54,0,1);
    ctx.globalAlpha=.18+.26*q;ctx.strokeStyle='#bffdf3';ctx.lineWidth=1.5+q*1.5;
    ctx.setLineDash([18,22]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=.10+.12*q;ctx.strokeStyle='#79ffe1';ctx.lineWidth=9;ctx.stroke();
  }else{
    const elapsed=slash.age-1.20,open=elapsed<.12?atroposEaseOut(elapsed/.12):slash.age>1.48?clamp((1.64-slash.age)/.16,0,1):1,gap=7+open*18;
    ctx.globalAlpha=.88;ctx.strokeStyle='#effffb';ctx.shadowColor='#79ffe1';ctx.shadowBlur=18;ctx.lineWidth=3.2;
    for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(a.x+nx*gap*side,a.y+ny*gap*side);ctx.lineTo(b.x+nx*gap*side,b.y+ny*gap*side);ctx.stroke();}
    ctx.globalAlpha=.22;ctx.strokeStyle='#071115';ctx.lineWidth=gap*2.1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.shadowBlur=0;
  }
  ctx.restore();
}

drawChronophageApex=function drawChronophageApexRebornOwnerStub(){};

const baseDrawEnemiesAtropos=drawEnemies;
drawEnemies=function drawEnemiesWithRebornAtropos(){
  const hidden=[];
  for(const e of state.entities.enemies){
    if(e?.apexForm==='chronophage'){
      hidden.push([e,e.bodyParts,e.x,e.y]);e.bodyParts=null;e.x=1e9;e.y=1e9;
    }
  }
  try{baseDrawEnemiesAtropos();}finally{for(const [e,parts,x,y] of hidden){e.bodyParts=parts;e.x=x;e.y=y;}}
  const e=state.entities.enemies.find(enemy=>!enemy.dead&&enemy.apexForm==='chronophage');
  if(e){drawAtroposWorldBody(e);drawAtroposSpaceCut(e);}
};
window.stackfallAtroposRebornDiagnostics=()=>{const e=state.entities.enemies.find(enemy=>!enemy.dead&&enemy.apexForm==='chronophage');return e?{active:true,anchor:{x:e.x,y:e.y},phase:e.apexPhase,parts:(e.bodyParts||[]).map(p=>({key:p.key,x:p.x,y:p.y,r:p.r,active:p.active})),slash:e.atroposReborn?.slash?{age:e.atroposReborn.slash.age,targetX:e.atroposReborn.slash.targetX,targetY:e.atroposReborn.slash.targetY}:null}:{active:false};};
