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

// Atropos Reborn v3: a world-anchored temporal monolith.
// No humanoid anatomy and no humanoid attack gestures. The structure itself aligns,
// locks a temporal axis, then the world splits along that axis after a short delay.
const STACKFALL_ATROPOS_REBORN=true;
const ATROPOS_PART_LAYOUT=[
  {key:'west-blade',label:'WEST FRACTURE',dx:-500,dy:70,r:124},
  {key:'crown-anchor',label:'CROWN ANCHOR',dx:0,dy:-350,r:108},
  {key:'rift-core',label:'RIFT CORE',dx:0,dy:34,r:152},
  {key:'keel-anchor',label:'KEEL ANCHOR',dx:0,dy:356,r:112},
  {key:'east-blade',label:'EAST FRACTURE',dx:500,dy:70,r:124}
];

function atroposPart(e,key){return e?.bodyParts?.find(part=>part.key===key)||null;}
function atroposEaseOut(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3);}
function atroposEaseInOut(t){t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function atroposLerp(a,b,t){return a+(b-a)*t;}
function atroposAngleDelta(a,b){return Math.atan2(Math.sin(b-a),Math.cos(b-a));}
function ensureRebornAtropos(e){
  if(!e||e.apexForm!=='chronophage')return false;
  if(!e.atroposReborn){
    const anchorX=player.x,anchorY=player.y-190;
    e.x=anchorX;e.y=anchorY;e.speed=0;e.contactSafeUntil=1e12;
    e.atroposReborn={
      anchorX,anchorY,slash:null,slashCd:3.45,
      lastHitPart:null,lastHitAt:-99,attackSerial:0,
      driftSeed:Math.random()*TAU,introAge:0,introSettled:false
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
  const west=atroposPart(e,'west-blade'),east=atroposPart(e,'east-blade'),crown=atroposPart(e,'crown-anchor'),keel=atroposPart(e,'keel-anchor');
  if(!west||!east||!crown||!keel)return refreshBossBodyParts(e);
  const age=slash.age;
  let align=0,open=0,recover=0;
  if(age<.78)align=atroposEaseInOut(age/.78);
  else if(age<1.46)align=1;
  else{recover=atroposEaseInOut((age-1.46)/.74);align=1-recover;}
  if(age>=1.16&&age<1.58)open=Math.sin(Math.PI*clamp((age-1.16)/.42,0,1));
  west.dx=-500-58*align-26*open;west.dy=70-64*align;
  east.dx=500+58*align+26*open;east.dy=70+64*align;
  crown.dx=-28*align;crown.dy=-350-40*align-18*open;
  keel.dx=28*align;keel.dy=356+40*align+18*open;
  const vulnerable=age<.58||age>1.76;
  west.active=vulnerable;east.active=vulnerable;crown.active=vulnerable;keel.active=vulnerable;
  return refreshBossBodyParts(e);
}
function startRebornAtroposSlash(e){
  ensureRebornAtropos(e);updateAtroposPose(e);
  const px=player.x,py=player.y;
  let angle=Math.atan2(py-e.y,px-e.x);
  const side=(++e.atroposReborn.attackSerial%2)?1:-1;
  angle+=side*.11;
  const ux=Math.cos(angle),uy=Math.sin(angle),half=Math.max(760,Math.hypot(vw,vh)*.56);
  e.atroposReborn.slash={
    age:0,angle,targetX:px,targetY:py,
    x1:px-ux*half,y1:py-uy*half,x2:px+ux*half,y2:py+uy*half,
    lockPlayed:false,impactPlayed:false
  };
  audio.tone(68,.32,'sawtooth',.022,22);
}
function updateRebornAtroposSlash(e,dt){
  const slash=e.atroposReborn?.slash;if(!slash)return;
  slash.age+=dt;updateAtroposPose(e);
  if(slash.age>=.78&&!slash.lockPlayed){
    slash.lockPlayed=true;
    audio.tone(116,.12,'square',.020,-34);
    state.camera.shake=Math.max(state.camera.shake,2.8);
  }
  if(slash.age>=1.20&&!slash.impactPlayed){
    slash.impactPlayed=true;
    const width=36,dist=segmentDistance(player.x,player.y,slash.x1,slash.y1,slash.x2,slash.y2);
    if(dist<=width+player.r&&player.invuln<=0)hurtPlayer(Math.max(8,e.damage*.52),e);
    state.camera.shake=Math.max(state.camera.shake,11);
    state.hitStop=Math.max(state.hitStop,.048);
    state.flash=Math.max(state.flash,.025);
    audio.hit(true);
    audio.tone(48,.27,'sawtooth',.044,-14);
    const mx=(slash.x1+slash.x2)*.5,my=(slash.y1+slash.y2)*.5;
    shockwave(mx,my,'#dffef8',180,.40,3.8);
    for(let i=0;i<14;i++){
      const q=(i+.5)/14,x=atroposLerp(slash.x1,slash.x2,q),y=atroposLerp(slash.y1,slash.y2,q);
      spawnParticle(x+rand(-22,22),y+rand(-22,22),i%3?'#bffdf3':'#ffffff',1,rand(34,72),rand(2,4));
    }
  }
  if(slash.age>=2.20){
    e.atroposReborn.slash=null;
    resetAtroposPose(e);refreshBossBodyParts(e);
  }
}
function updateRebornAtropos(e,dt){
  ensureRebornAtropos(e);
  const r=e.atroposReborn;r.introAge+=dt;
  e.apexElapsed=(e.apexElapsed||0)+dt;
  const health=e.hp/Math.max(1,e.maxHp);
  e.apexPhase=health<.25?4:health<.50?3:health<.75?2:1;
  e.timeLock=0;
  if(r.introAge<2.05){
    r.slashCd=Math.max(r.slashCd,1.05);resetAtroposPose(e);refreshBossBodyParts(e);return;
  }
  if(!r.introSettled){r.introSettled=true;audio.tone(42,.30,'sawtooth',.028,10);state.camera.shake=Math.max(state.camera.shake,3);}
  updateRebornAtroposSlash(e,dt);
  if(!r.slash){
    r.slashCd-=dt;
    if(r.slashCd<=0){
      startRebornAtroposSlash(e);
      r.slashCd=Math.max(4.1,5.45-e.apexPhase*.18);
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
  return clamp(1-((state.time||0)-r.lastHitAt)/.18,0,1);
}
function atroposManifest(e){return clamp((e.atroposReborn?.introAge||0)/1.55,0,1);}
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
function drawAtroposShard(g,p,key,e,angle,scale=1,alpha=1){
  const hit=atroposPartHitPulse(e,key),part=atroposPart(e,key),active=part?.active!==false,r=(part?.r||90)*scale;
  g.save();g.translate(p.x,p.y);g.rotate(angle);g.globalAlpha*=alpha;
  if(hit)g.translate(rand(-6,6)*hit,rand(-5,5)*hit);
  const grad=g.createLinearGradient(-r,-r*.7,r,r*.8);
  grad.addColorStop(0,hit?'#f9ffff':'#18222c');
  grad.addColorStop(.42,hit?'#cffff7':'#0b151f');
  grad.addColorStop(1,'#02060b');
  g.fillStyle=grad;g.strokeStyle=hit?'#ffffff':active?'rgba(184,255,241,.72)':'rgba(91,128,126,.28)';g.lineWidth=hit?5:2.6;
  atroposShardPolygon(g,r,1,key.includes('blade')?.34:.18);g.fill();g.stroke();
  g.globalAlpha*=active?.72:.20;g.strokeStyle='#dffff8';g.lineWidth=1.35;
  g.beginPath();g.moveTo(-r*.62,-r*.24);g.lineTo(r*.42,-r*.08);g.lineTo(-r*.05,r*.38);g.stroke();
  g.globalAlpha*=.32;g.strokeStyle='#79ffe1';g.lineWidth=8;g.beginPath();g.moveTo(-r*.36,-r*.21);g.lineTo(r*.24,-r*.06);g.stroke();
  g.restore();
}
function drawAtroposVoidMass(g,c,e,manifest){
  const t=state.time||0,pulse=.5+.5*Math.sin(t*.34+e.atroposReborn.driftSeed);
  g.save();g.translate(c.x,c.y);
  const grad=g.createRadialGradient(0,18,34,0,18,360);
  grad.addColorStop(0,`rgba(0,2,7,${.96*manifest})`);
  grad.addColorStop(.42,`rgba(3,8,15,${(.90+.04*pulse)*manifest})`);
  grad.addColorStop(.76,`rgba(5,12,20,${.54*manifest})`);
  grad.addColorStop(1,'rgba(3,8,15,0)');
  g.fillStyle=grad;g.beginPath();g.ellipse(0,24,390,345,0,0,TAU);g.fill();
  g.fillStyle=`rgba(3,7,13,${.78*manifest})`;g.beginPath();
  g.moveTo(-330,-96);g.lineTo(-176,-268);g.lineTo(-36,-316);g.lineTo(164,-250);g.lineTo(338,-58);g.lineTo(292,126);g.lineTo(124,294);g.lineTo(-84,322);g.lineTo(-296,152);g.closePath();g.fill();
  g.restore();
}
function drawAtroposCore(g,p,e,axis,alpha=1){
  const hit=atroposPartHitPulse(e,'rift-core'),part=atroposPart(e,'rift-core'),r=part?.r||152;
  g.save();g.translate(p.x,p.y);g.rotate(axis);g.globalAlpha*=alpha;if(hit)g.translate(rand(-6,6)*hit,rand(-5,5)*hit);
  const shell=g.createLinearGradient(-r,-r,r,r);shell.addColorStop(0,hit?'#f7ffff':'#1b2631');shell.addColorStop(.48,hit?'#cffff7':'#0c1720');shell.addColorStop(1,'#02050a');
  g.fillStyle=shell;g.strokeStyle=hit?'#fff':'rgba(176,255,240,.62)';g.lineWidth=hit?5:3.2;
  g.beginPath();g.moveTo(-r*.12,-r*1.18);g.lineTo(r*.58,-r*.72);g.lineTo(r*.30,-r*.10);g.lineTo(r*.68,r*.52);g.lineTo(r*.04,r*1.12);g.lineTo(-r*.62,r*.66);g.lineTo(-r*.30,r*.08);g.lineTo(-r*.70,-r*.56);g.closePath();g.fill();g.stroke();
  g.fillStyle='#000207';g.beginPath();g.moveTo(-r*.08,-r*.92);g.lineTo(r*.08,-r*.38);g.lineTo(-r*.03,-r*.03);g.lineTo(r*.12,r*.36);g.lineTo(-r*.05,r*.88);g.lineTo(-r*.18,r*.28);g.lineTo(-r*.06,-r*.05);g.lineTo(-r*.20,-r*.48);g.closePath();g.fill();
  g.strokeStyle=hit?'#fff':'rgba(230,255,250,.82)';g.lineWidth=2.4;g.beginPath();g.moveTo(-r*.06,-r*.86);g.lineTo(r*.06,-r*.39);g.lineTo(-r*.01,-r*.03);g.lineTo(r*.09,r*.34);g.lineTo(-r*.03,r*.80);g.stroke();
  g.restore();
}
function drawAtroposBrokenRing(g,c,phase,manifest,alignment=0){
  g.save();g.translate(c.x,c.y);g.rotate(alignment*.12);g.globalAlpha*=manifest;g.lineCap='butt';
  const radius=390+phase*12;
  const segments=[[-2.82,-2.06],[-1.62,-.98],[-.35,.30],[.72,1.31],[1.82,2.48]];
  for(let i=0;i<segments.length;i++){
    const [start,end]=segments[i];
    g.strokeStyle=i%2?'rgba(5,11,17,.96)':'rgba(7,15,22,.96)';g.lineWidth=i%2?54:42;
    g.beginPath();g.arc(0,20,radius+(i%2?14:-10),start,end);g.stroke();
    g.strokeStyle='rgba(152,225,215,.30)';g.lineWidth=2.2;g.beginPath();g.arc(0,20,radius+(i%2?14:-10),start,end);g.stroke();
  }
  g.restore();
}
function drawAtroposConnections(g,points,e,manifest){
  const pairs=[['crown-anchor','west-blade'],['crown-anchor','rift-core'],['crown-anchor','east-blade'],['west-blade','keel-anchor'],['rift-core','keel-anchor'],['east-blade','keel-anchor']];
  g.save();g.lineCap='round';
  for(let i=0;i<pairs.length;i++){
    const [aKey,bKey]=pairs[i],a=points[aKey],b=points[bKey];if(!a||!b)continue;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,wobble=Math.sin((state.time||0)*.27+i*1.17)*10;
    const mx=(a.x+b.x)*.5+nx*wobble,my=(a.y+b.y)*.5+ny*wobble;
    g.globalAlpha=.72*manifest;g.strokeStyle='#03080e';g.lineWidth=24;g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo(mx,my,b.x,b.y);g.stroke();
    g.globalAlpha=.24*manifest;g.strokeStyle='#a5ddd7';g.lineWidth=2;g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo(mx,my,b.x,b.y);g.stroke();
  }
  g.restore();
}
function atroposStructureAxis(e){
  const slash=e.atroposReborn?.slash;if(!slash)return -.08+Math.sin((state.time||0)*.16+e.atroposReborn.driftSeed)*.035;
  const q=slash.age<.78?atroposEaseInOut(slash.age/.78):slash.age<1.46?1:1-atroposEaseInOut((slash.age-1.46)/.74);
  const rest=-.08,target=slash.angle-Math.PI/2;
  return rest+atroposAngleDelta(rest,target)*q;
}
function drawAtroposWorldBody(e){
  if(!ensureRebornAtropos(e))return;
  updateAtroposPose(e);
  const center=atroposScreenPoint(e.x,e.y),points={};
  for(const def of ATROPOS_PART_LAYOUT){const part=atroposPart(e,def.key);if(part)points[def.key]=atroposScreenPoint(part.x,part.y);}
  const margin=900;if(center.x<-margin||center.x>vw+margin||center.y<-margin||center.y>vh+margin)return;
  const t=state.time||0,phase=e.apexPhase||1,manifest=atroposManifest(e),axis=atroposStructureAxis(e),slash=e.atroposReborn?.slash;
  ctx.save();ctx.lineJoin='round';
  drawAtroposVoidMass(ctx,center,e,manifest);
  drawAtroposBrokenRing(ctx,center,phase,manifest,slash?1:0);
  drawAtroposConnections(ctx,points,e,manifest);
  const resolveJitter=(1-manifest)*9;
  ctx.save();ctx.translate(Math.sin(t*8.1)*resolveJitter,Math.sin(t*6.7+1.2)*resolveJitter*.45);
  drawAtroposShard(ctx,points['crown-anchor'],'crown-anchor',e,axis-Math.PI/2,.98,manifest);
  drawAtroposShard(ctx,points['keel-anchor'],'keel-anchor',e,axis+Math.PI/2,1.02,manifest);
  drawAtroposShard(ctx,points['west-blade'],'west-blade',e,axis+Math.PI,1.22,manifest);
  drawAtroposShard(ctx,points['east-blade'],'east-blade',e,axis,1.22,manifest);
  drawAtroposCore(ctx,points['rift-core'],e,axis,manifest);
  ctx.restore();
  ctx.fillStyle=`rgba(117,162,165,${.30*manifest})`;
  for(let i=0;i<7;i++){
    const a=i/7*TAU+e.atroposReborn.driftSeed,rr=430+(i%3)*38,sz=5+(i%3)*3;
    ctx.save();ctx.translate(center.x+Math.cos(a)*rr,center.y+Math.sin(a)*rr*.82);ctx.rotate(a*.42);ctx.fillRect(-sz*.5,-sz*1.6,sz,sz*3.2);ctx.restore();
  }
  ctx.restore();
}
function drawAtroposSpaceCut(e){
  const slash=e.atroposReborn?.slash;if(!slash||slash.age<.52||slash.age>1.70)return;
  const a=atroposScreenPoint(slash.x1,slash.y1),b=atroposScreenPoint(slash.x2,slash.y2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  ctx.save();ctx.lineCap='round';
  if(slash.age<1.20){
    const q=clamp((slash.age-.52)/.68,0,1);
    ctx.globalAlpha=.10+.24*q;ctx.strokeStyle='#bffdf3';ctx.lineWidth=1.2+q*1.6;
    ctx.setLineDash([24,32]);ctx.lineDashOffset=-(state.time||0)*18;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=.07+.09*q;ctx.strokeStyle='#79ffe1';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }else{
    const elapsed=slash.age-1.20,open=elapsed<.13?atroposEaseOut(elapsed/.13):slash.age>1.53?clamp((1.70-slash.age)/.17,0,1):1,gap=8+open*23;
    ctx.globalAlpha=.46;ctx.strokeStyle='#000207';ctx.lineWidth=gap*2.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.globalAlpha=.88;ctx.strokeStyle='#effffb';ctx.shadowColor='#79ffe1';ctx.shadowBlur=15;ctx.lineWidth=2.8;
    for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(a.x+nx*gap*side,a.y+ny*gap*side);ctx.lineTo(b.x+nx*gap*side,b.y+ny*gap*side);ctx.stroke();}
    ctx.shadowBlur=0;ctx.globalAlpha=.30;ctx.strokeStyle='#8fffe0';ctx.lineWidth=1.4;
    for(let i=1;i<11;i+=2){const q=i/12,x=a.x+dx*q,y=a.y+dy*q,span=12+open*18;ctx.beginPath();ctx.moveTo(x-nx*span,y-ny*span);ctx.lineTo(x+nx*span*.42,y+ny*span*.42);ctx.stroke();}
  }
  ctx.restore();
}

function drawAtroposRealmBackground(tr){
  const p=clamp(tr.elapsed/tr.duration,0,1),ease=p*p*(3-2*p),cx=vw*.52,half=Math.max(2,ease*vw*.64);
  drawTheme(normalizedRealmTheme(tr.from));
  ctx.save();ctx.beginPath();
  const steps=9;ctx.moveTo(cx-half,-20);
  for(let i=0;i<=steps;i++){const y=-20+(vh+40)*i/steps,jag=Math.sin(i*2.31+tr.seed)*Math.min(34,half*.08);ctx.lineTo(cx-half+jag,y);}
  for(let i=steps;i>=0;i--){const y=-20+(vh+40)*i/steps,jag=Math.sin(i*2.31+tr.seed+1.7)*Math.min(34,half*.08);ctx.lineTo(cx+half+jag,y);}
  ctx.closePath();ctx.clip();drawTheme(normalizedRealmTheme(tr.to));ctx.restore();
  const crack=1-Math.min(1,Math.abs(p-.5)*2),edgeX=cx+Math.sin(tr.elapsed*2.4)*3;
  ctx.save();ctx.globalAlpha=.28+.38*crack;ctx.fillStyle='#000207';ctx.fillRect(edgeX-4,0,8,vh);ctx.globalAlpha=.18+.24*crack;ctx.strokeStyle='#bffdf3';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(edgeX,0);for(let i=1;i<=9;i++){const y=vh*i/9,x=edgeX+Math.sin(i*2.8+tr.seed)*10*crack;ctx.lineTo(x,y);}ctx.stroke();ctx.restore();
}
function drawAtroposTransitionSignature(tr,p,fade){
  const cx=vw*.52,cy=vh*.43,open=Math.sin(Math.PI*clamp((p-.08)/.84,0,1)),height=Math.min(vh*.56,460),gap=5+open*34;
  ctx.save();ctx.translate(cx,cy);ctx.globalAlpha=.82*fade;
  ctx.fillStyle='#000207';ctx.beginPath();ctx.moveTo(-gap,-height*.52);ctx.lineTo(gap*.25,-height*.18);ctx.lineTo(-gap*.18,height*.04);ctx.lineTo(gap,height*.52);ctx.lineTo(-gap*.55,height*.18);ctx.lineTo(gap*.12,-height*.06);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(207,255,247,.66)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-gap*.8,-height*.48);ctx.lineTo(gap*.12,-height*.17);ctx.lineTo(-gap*.10,height*.03);ctx.lineTo(gap*.78,height*.46);ctx.stroke();
  ctx.globalAlpha=.16*fade;ctx.strokeStyle='#79ffe1';ctx.lineWidth=12;ctx.stroke();ctx.restore();
}
const baseDrawBackgroundAtropos=drawBackground;
drawBackground=function drawBackgroundWithAtroposEntry(){const tr=state.realmTransition;if(tr?.to==='apex-chrono')return drawAtroposRealmBackground(tr);return baseDrawBackgroundAtropos();};
const baseDrawTransitionSignatureAtropos=drawTransitionSignature;
drawTransitionSignature=function drawTransitionSignatureWithAtropos(tr,p,fade){if(tr?.to==='apex-chrono')return drawAtroposTransitionSignature(tr,p,fade);return baseDrawTransitionSignatureAtropos(tr,p,fade);};
const baseDrawRealmCinematicOverlayAtropos=drawRealmCinematicOverlay;
drawRealmCinematicOverlay=function drawRealmCinematicOverlayWithAtropos(){
  const tr=state.realmTransition;if(tr?.to!=='apex-chrono')return baseDrawRealmCinematicOverlayAtropos();
  const p=clamp(tr.elapsed/tr.duration,0,1),fade=Math.sin(Math.PI*p);
  ctx.save();ctx.globalAlpha=.12+.18*fade;ctx.fillStyle='rgba(0,0,7,.42)';ctx.fillRect(0,0,vw,vh);ctx.restore();
  drawAtroposTransitionSignature(tr,p,fade);
};
const baseDrawApexArenaAtropos=drawApexArena;
drawApexArena=function drawApexArenaWithoutChronoBoundary(){if(state.apexArena?.form==='chronophage'&&(state.apexActiveId||state.pendingApexForm||state.realmTransition?.to==='apex-chrono'))return;return baseDrawApexArenaAtropos();};

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
window.stackfallAtroposRebornDiagnostics=()=>{const e=state.entities.enemies.find(enemy=>!enemy.dead&&enemy.apexForm==='chronophage');return e?{active:true,anchor:{x:e.x,y:e.y},phase:e.apexPhase,introAge:e.atroposReborn?.introAge||0,parts:(e.bodyParts||[]).map(p=>({key:p.key,x:p.x,y:p.y,r:p.r,active:p.active})),slash:e.atroposReborn?.slash?{age:e.atroposReborn.slash.age,targetX:e.atroposReborn.slash.targetX,targetY:e.atroposReborn.slash.targetY,angle:e.atroposReborn.slash.angle}:null}:{active:false};};
