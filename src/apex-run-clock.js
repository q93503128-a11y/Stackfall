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

// Atropos Reborn: world-anchored temporal fracture entity.
// Human anatomy is intentionally abandoned; the boss is a multipart shattered time structure.
const STACKFALL_ATROPOS_REBORN=true;
const ATROPOS_PART_LAYOUT=[
  {key:'west-blade',label:'WEST FRACTURE',dx:-430,dy:72,r:92},
  {key:'crown-anchor',label:'CROWN ANCHOR',dx:0,dy:-282,r:84},
  {key:'rift-core',label:'RIFT CORE',dx:0,dy:38,r:118},
  {key:'keel-anchor',label:'KEEL ANCHOR',dx:0,dy:318,r:92},
  {key:'east-blade',label:'EAST FRACTURE',dx:430,dy:72,r:92}
];

function atroposPart(e,key){return e?.bodyParts?.find(part=>part.key===key)||null;}
function atroposEaseOut(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3);}
function atroposEaseInOut(t){t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function atroposLerp(a,b,t){return a+(b-a)*t;}
function ensureRebornAtropos(e){
  if(!e||e.apexForm!=='chronophage')return false;
  if(!e.atroposReborn){
    const anchorX=player.x,anchorY=player.y-220;
    e.x=anchorX;e.y=anchorY;e.speed=0;e.contactSafeUntil=1e12;
    e.atroposReborn={
      anchorX,anchorY,slash:null,slashCd:1.45,
      lastHitPart:null,lastHitAt:-99,attackSerial:0,
      driftSeed:Math.random()*TAU
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
  const blade=atroposPart(e,'east-blade'),crown=atroposPart(e,'crown-anchor');
  if(!blade||!crown)return refreshBossBodyParts(e);
  const age=slash.age;
  if(age<.72){
    const q=atroposEaseInOut(age/.72);
    blade.dx=atroposLerp(430,255,q);blade.dy=atroposLerp(72,-210,q);
    crown.dx=atroposLerp(0,38,q);crown.dy=atroposLerp(-282,-300,q);
    blade.active=false;
  }else if(age<.90){
    const q=atroposEaseOut((age-.72)/.18);
    blade.dx=atroposLerp(255,-455,q);blade.dy=atroposLerp(-210,198,q);
    crown.dx=atroposLerp(38,-26,q);crown.dy=atroposLerp(-300,-264,q);
    blade.active=false;
  }else if(age<1.42){
    blade.dx=-455;blade.dy=198;crown.dx=-26;crown.dy=-264;blade.active=false;
  }else{
    const q=atroposEaseInOut((age-1.42)/.74);
    blade.dx=atroposLerp(-455,430,q);blade.dy=atroposLerp(198,72,q);
    crown.dx=atroposLerp(-26,0,q);crown.dy=atroposLerp(-264,-282,q);
    blade.active=q>.72;
  }
  return refreshBossBodyParts(e);
}
function startRebornAtroposSlash(e){
  ensureRebornAtropos(e);updateAtroposPose(e);
  const blade=atroposPart(e,'east-blade'),px=player.x,py=player.y;
  const fromX=blade?.x??e.x+430,fromY=blade?.y??e.y+72;
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
function atroposShardPolygon(g,r,stretch=1,notch=.22){
  g.beginPath();
  g.moveTo(r*1.18*stretch,0);
  g.lineTo(r*.34*stretch,-r*.58);
  g.lineTo(-r*.34*stretch,-r*.78);
  g.lineTo(-r*.18*stretch,-r*.20);
  g.lineTo(-r*1.05*stretch,-r*.08);
  g.lineTo(-r*(.68+notch)*stretch,r*.34);
  g.lineTo(-r*.18*stretch,r*.72);
  g.lineTo(r*.30*stretch,r*.48);
  g.closePath();
}
function drawAtroposShard(g,p,key,e,angle,scale=1){
  const hit=atroposPartHitPulse(e,key),part=atroposPart(e,key),active=part?.active!==false,r=(part?.r||90)*scale;
  g.save();g.translate(p.x,p.y);g.rotate(angle);
  if(hit)g.translate(rand(-5,5)*hit,rand(-4,4)*hit);
  const grad=g.createLinearGradient(-r,-r*.6,r,r*.7);
  grad.addColorStop(0,hit?'#f7ffff':'#101923');
  grad.addColorStop(.38,hit?'#bffdf3':'#162d35');
  grad.addColorStop(1,'#050a11');
  g.fillStyle=grad;g.strokeStyle=hit?'#ffffff':active?'rgba(156,255,234,.68)':'rgba(86,142,137,.28)';g.lineWidth=hit?4.5:2.4;
  atroposShardPolygon(g,r,1,key.includes('blade')?.30:.14);g.fill();g.stroke();
  g.globalAlpha=active?.78:.24;g.strokeStyle='#dffff8';g.lineWidth=1.4;
  g.beginPath();g.moveTo(-r*.54,-r*.22);g.lineTo(r*.38,-r*.07);g.lineTo(-r*.02,r*.34);g.stroke();
  g.globalAlpha=.30;g.strokeStyle='#79ffe1';g.lineWidth=7;g.beginPath();g.moveTo(-r*.34,-r*.19);g.lineTo(r*.22,-r*.05);g.stroke();
  g.restore();
}
function drawAtroposCore(g,p,e){
  const hit=atroposPartHitPulse(e,'rift-core'),part=atroposPart(e,'rift-core'),r=part?.r||118,t=state.time||0;
  g.save();g.translate(p.x,p.y);if(hit)g.translate(rand(-5,5)*hit,rand(-4,4)*hit);
  g.rotate(Math.sin(t*.23+e.atroposReborn.driftSeed)*.08);
  const shell=g.createLinearGradient(-r,-r,r,r);shell.addColorStop(0,hit?'#f5ffff':'#111b28');shell.addColorStop(.48,hit?'#bffdf3':'#172c38');shell.addColorStop(1,'#050912');
  g.fillStyle=shell;g.strokeStyle=hit?'#fff':'rgba(167,255,237,.56)';g.lineWidth=hit?5:2.8;
  g.beginPath();g.moveTo(-r*.16,-r*1.12);g.lineTo(r*.64,-r*.54);g.lineTo(r*.34,-r*.08);g.lineTo(r*.80,r*.58);g.lineTo(r*.05,r*1.05);g.lineTo(-r*.58,r*.62);g.lineTo(-r*.34,r*.10);g.lineTo(-r*.76,-r*.52);g.closePath();g.fill();g.stroke();
  // The center is a vertical absence rather than a glowing weak-point icon.
  g.fillStyle='#01040a';g.beginPath();g.moveTo(-r*.10,-r*.82);g.lineTo(r*.10,-r*.32);g.lineTo(-r*.03,-r*.02);g.lineTo(r*.14,r*.34);g.lineTo(-r*.05,r*.82);g.lineTo(-r*.20,r*.28);g.lineTo(-r*.08,-r*.04);g.lineTo(-r*.22,-r*.42);g.closePath();g.fill();
  g.strokeStyle=hit?'#fff':'rgba(218,255,248,.78)';g.lineWidth=2.2;g.beginPath();g.moveTo(-r*.08,-r*.76);g.lineTo(r*.08,-r*.34);g.lineTo(-r*.02,-r*.04);g.lineTo(r*.11,r*.32);g.lineTo(-r*.04,r*.73);g.stroke();
  g.globalAlpha=.18;g.strokeStyle='#79ffe1';g.lineWidth=12;g.stroke();g.restore();
}
function drawAtroposBrokenRing(g,c,phase,alpha=1){
  g.save();g.translate(c.x,c.y);g.rotate(Math.sin((state.time||0)*.075)*.08);g.globalAlpha*=alpha;g.lineCap='butt';
  const radius=330+phase*10;
  for(let i=0;i<6;i++){
    if(i===1||i===4)continue;
    const start=-2.74+i*TAU/6+.05,end=start+.58;
    g.strokeStyle=i%2?'rgba(87,135,151,.18)':'rgba(123,255,226,.20)';g.lineWidth=i%2?28:18;
    g.beginPath();g.arc(0,20,radius+(i%2?18:-10),start,end);g.stroke();
    g.strokeStyle='rgba(206,255,247,.28)';g.lineWidth=1.6;g.beginPath();g.arc(0,20,radius+(i%2?18:-10),start,end);g.stroke();
  }
  g.restore();
}
function drawAtroposConnections(g,points,e){
  const t=state.time||0;
  const pairs=[['crown-anchor','west-blade'],['crown-anchor','rift-core'],['crown-anchor','east-blade'],['west-blade','keel-anchor'],['rift-core','keel-anchor'],['east-blade','keel-anchor']];
  g.save();g.lineCap='round';
  for(let i=0;i<pairs.length;i++){
    const [aKey,bKey]=pairs[i],a=points[aKey],b=points[bKey];if(!a||!b)continue;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,wobble=Math.sin(t*.52+i*1.73)*18;
    const mx=(a.x+b.x)*.5+nx*wobble,my=(a.y+b.y)*.5+ny*wobble;
    g.globalAlpha=.16;g.strokeStyle='#79ffe1';g.lineWidth=9;g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo(mx,my,b.x,b.y);g.stroke();
    g.globalAlpha=.36;g.strokeStyle='#a7d9da';g.lineWidth=1.6;g.setLineDash([12,18]);g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo(mx,my,b.x,b.y);g.stroke();g.setLineDash([]);
  }
  g.restore();
}
function drawAtroposWorldBody(e){
  if(!ensureRebornAtropos(e))return;
  updateAtroposPose(e);
  const center=atroposScreenPoint(e.x,e.y),points={};
  for(const def of ATROPOS_PART_LAYOUT){const part=atroposPart(e,def.key);if(part)points[def.key]=atroposScreenPoint(part.x,part.y);}
  const margin=780;if(center.x<-margin||center.x>vw+margin||center.y<-margin||center.y>vh+margin)return;
  const t=state.time||0,phase=e.apexPhase||1;
  ctx.save();ctx.lineJoin='round';
  // Low-opacity time-offset copies sell temporal desynchronization without reading as a camera-bound background.
  for(const echo of[-1,1]){
    ctx.save();ctx.translate(echo*11,-echo*7);ctx.globalAlpha=.055;
    drawAtroposBrokenRing(ctx,center,phase,.8);
    drawAtroposCore(ctx,points['rift-core'],e);
    ctx.restore();
  }
  drawAtroposBrokenRing(ctx,center,phase,1);
  drawAtroposConnections(ctx,points,e);
  drawAtroposShard(ctx,points['crown-anchor'],'crown-anchor',e,-Math.PI/2+Math.sin(t*.18)*.08,.92);
  drawAtroposShard(ctx,points['keel-anchor'],'keel-anchor',e,Math.PI/2-Math.sin(t*.16)*.06,.96);
  drawAtroposShard(ctx,points['west-blade'],'west-blade',e,Math.PI+.24+Math.sin(t*.22)*.05,1.12);
  const slash=e.atroposReborn?.slash,bladeAngle=slash?(-1.05+atroposEaseOut(clamp((slash.age-.62)/.34,0,1))*2.18):(-.24+Math.sin(t*.20)*.05);
  drawAtroposShard(ctx,points['east-blade'],'east-blade',e,bladeAngle,1.12);
  drawAtroposCore(ctx,points['rift-core'],e);
  // Sparse orbiting fragments give scale without turning the boss into another neon ring icon.
  ctx.fillStyle='rgba(144,214,211,.38)';for(let i=0;i<9;i++){const a=i/9*TAU+t*(i%2?.028:-.021),rr=390+(i%3)*34,sz=4+(i%4)*2;ctx.save();ctx.translate(center.x+Math.cos(a)*rr,center.y+Math.sin(a)*rr*.82);ctx.rotate(a*.7);ctx.fillRect(-sz*.5,-sz*1.8,sz,sz*3.6);ctx.restore();}
  ctx.restore();
}
function drawAtroposSpaceCut(e){
  const slash=e.atroposReborn?.slash;if(!slash||slash.age<.66||slash.age>1.64)return;
  const a=atroposScreenPoint(slash.x1,slash.y1),b=atroposScreenPoint(slash.x2,slash.y2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  ctx.save();ctx.lineCap='round';
  if(slash.age<1.20){
    const q=clamp((slash.age-.66)/.54,0,1);
    // Memory scar: thin, broken and deliberately quieter than the actual rupture.
    ctx.globalAlpha=.15+.22*q;ctx.strokeStyle='#bffdf3';ctx.lineWidth=1.4+q*1.4;
    ctx.setLineDash([20,24]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=.08+.10*q;ctx.strokeStyle='#79ffe1';ctx.lineWidth=8;ctx.stroke();
  }else{
    const elapsed=slash.age-1.20,open=elapsed<.12?atroposEaseOut(elapsed/.12):slash.age>1.48?clamp((1.64-slash.age)/.16,0,1):1,gap=7+open*20;
    // Dark interior first: this reads as the world separating, not a laser beam.
    ctx.globalAlpha=.30;ctx.strokeStyle='#01040a';ctx.lineWidth=gap*2.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.globalAlpha=.86;ctx.strokeStyle='#effffb';ctx.shadowColor='#79ffe1';ctx.shadowBlur=18;ctx.lineWidth=3;
    for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(a.x+nx*gap*side,a.y+ny*gap*side);ctx.lineTo(b.x+nx*gap*side,b.y+ny*gap*side);ctx.stroke();}
    // Short staggered tears along the opened plane add depth while keeping the attack readable.
    ctx.shadowBlur=0;ctx.globalAlpha=.34;ctx.strokeStyle='#8fffe0';ctx.lineWidth=1.5;
    for(let i=2;i<10;i+=2){const q=i/11,x=a.x+dx*q,y=a.y+dy*q,span=10+open*16;ctx.beginPath();ctx.moveTo(x-nx*span,y-ny*span);ctx.lineTo(x+nx*span*.35,y+ny*span*.35);ctx.stroke();}
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
