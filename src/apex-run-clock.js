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
registerResetGameInterceptor('apex-run-clock.js:resetGameWithRunClock',function resetGameWithRunClock(next,...args){state.runTime=0;return next();});
const apexClockSpawnBase=spawnEnemy;
spawnEnemy=function spawnEnemyAtRunProgression(){return withProgressionClock(()=>apexClockSpawnBase(...arguments));};
const apexClockSpawningBase=updateSpawning;
updateSpawning=function updateSpawningAtRunProgression(dt){return withProgressionClock(()=>apexClockSpawningBase(dt));};
const apexClockMapEventsBase=window.updateMapEvents;
if(typeof apexClockMapEventsBase==='function')window.updateMapEvents=updateMapEvents=function updateMapEventsAtRunProgression(dt){return withProgressionClock(()=>apexClockMapEventsBase(dt));};
const apexClockUpdateHudBase=updateHUD;
updateHUD=function updateHudWithRunClock(){const result=apexClockUpdateHudBase();const seconds=Math.floor(runProgressionTime()),minutes=Math.floor(seconds/60),remainder=seconds%60;if(ui.timer)ui.timer.textContent=`${String(minutes).padStart(2,'0')}:${String(remainder).padStart(2,'0')}`;state.threat=1+Math.floor(seconds/60);if(ui.threat)ui.threat.textContent=`${tr('hud.threat')} ${state.threat}`;return result;};
registerEndGameInterceptor('apex-run-clock.js:endGameWithRunTime',function endGameWithRunTime(next,...args){const result=next();if(ui.resultTime)ui.resultTime.textContent=formatTime(runProgressionTime());return result;});
const apexClockUpdateApexBase=updateApexSystems;
updateApexSystems=function updateApexAtProgressionTime(dt=0,priorityOnly=false){if(state.apexActiveId||state.apexExitPending||String(state.realmTransition?.to||'').startsWith('apex-'))return apexClockUpdateApexBase(dt,priorityOnly);return withProgressionClock(()=>apexClockUpdateApexBase(dt,priorityOnly));};

// Atropos Reborn v4: world-anchored chronal rupture.
// The boss is not humanoid and does not imitate humanoid gestures. Its mass is built from
// asymmetrical temporal plates around an absence; attacks happen by structural alignment.
const STACKFALL_ATROPOS_REBORN=true;
const ATROPOS_PART_LAYOUT=[
  {key:'west-blade',label:'WEST FRACTURE',dx:-492,dy:88,r:132},
  {key:'crown-anchor',label:'CROWN ANCHOR',dx:-54,dy:-354,r:114},
  {key:'rift-core',label:'RIFT CORE',dx:18,dy:36,r:166},
  {key:'keel-anchor',label:'KEEL ANCHOR',dx:62,dy:358,r:116},
  {key:'east-blade',label:'EAST FRACTURE',dx:506,dy:50,r:136}
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
  west.dx=-492-64*align-20*open;west.dy=88-58*align;
  east.dx=506+64*align+28*open;east.dy=50+70*align;
  crown.dx=-54-32*align;crown.dy=-354-42*align-18*open;
  keel.dx=62+30*align;keel.dy=358+42*align+18*open;
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
  if(r.introAge<1.15){
    r.slashCd=Math.max(r.slashCd,1.0);resetAtroposPose(e);refreshBossBodyParts(e);return;
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

// Entry control: ordinary combat freezes, then the existing mob field is physically pushed away
// from the manifestation point. No decorative line animation is used as a substitute for this event.
const ATROPOS_ENTRY_CONTROL={serial:null,centerX:0,centerY:0,mobs:[],cleared:false,pulse:false};
function atroposEntryTransition(){const tr=state.realmTransition;return tr?.to==='apex-chrono'&&tr?.owner==='apex-entry'?tr:null;}
function clearAtroposEntryControl(){ATROPOS_ENTRY_CONTROL.serial=null;ATROPOS_ENTRY_CONTROL.mobs.length=0;ATROPOS_ENTRY_CONTROL.cleared=false;ATROPOS_ENTRY_CONTROL.pulse=false;}
function beginAtroposEntryControl(tr){
  ATROPOS_ENTRY_CONTROL.serial=tr.serial;
  ATROPOS_ENTRY_CONTROL.centerX=player.x;
  ATROPOS_ENTRY_CONTROL.centerY=player.y;
  ATROPOS_ENTRY_CONTROL.mobs.length=0;
  let index=0;
  for(const e of state.entities.enemies||[]){
    if(!e||e.dead||e.kind==='apex'||e.apexForm)continue;
    const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1,a=d>2?Math.atan2(dy,dx):(index*2.399+tr.seed),target=Math.max(d+250,520+(index%5)*32);
    ATROPOS_ENTRY_CONTROL.mobs.push({e,x:e.x,y:e.y,ux:Math.cos(a),uy:Math.sin(a),push:target-d});
    index++;
  }
  if(Array.isArray(state.entities.telegraphs))state.entities.telegraphs.length=0;
  for(const key of['enemyProjectiles','hostileProjectiles','enemyBullets']){const arr=state.entities?.[key];if(Array.isArray(arr))arr.length=0;}
  ATROPOS_ENTRY_CONTROL.cleared=true;
  ATROPOS_ENTRY_CONTROL.pulse=false;
  clearPendingCombatActions?.();
  audio.tone(38,.32,'sawtooth',.025,8);
}
function updateAtroposEntryControl(dt=0){
  const tr=atroposEntryTransition();
  if(!tr){if(ATROPOS_ENTRY_CONTROL.serial!==null)clearAtroposEntryControl();return false;}
  if(ATROPOS_ENTRY_CONTROL.serial!==tr.serial)beginAtroposEntryControl(tr);
  const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),push=atroposEaseInOut(clamp((p-.08)/.34,0,1));
  for(const item of ATROPOS_ENTRY_CONTROL.mobs){
    const e=item.e;if(!e||e.dead)continue;
    e.x=item.x+item.ux*item.push*push;e.y=item.y+item.uy*item.push*push;
    e.timeLock=Math.max(Number(e.timeLock)||0,.65);e.contactSafeUntil=Math.max(Number(e.contactSafeUntil)||0,(state.time||0)+.5);
  }
  if(p>=.18&&!ATROPOS_ENTRY_CONTROL.pulse){
    ATROPOS_ENTRY_CONTROL.pulse=true;state.camera.shake=Math.max(state.camera.shake,4.2);audio.tone(56,.20,'sawtooth',.035,-10);
  }
  const boss=state.entities.enemies?.find(e=>!e.dead&&e.apexForm==='chronophage');
  if(boss)ensureRebornAtropos(boss);
  return true;
}
const baseUpdateEnemiesAtroposEntry=updateEnemies;
updateEnemies=function updateEnemiesWithAtroposEntryFreeze(dt){
  if(updateAtroposEntryControl(dt))return;
  return baseUpdateEnemiesAtroposEntry(dt);
};

function atroposScreenPoint(x,y){return{x:x-player.x+vw/2,y:y-player.y+vh/2};}
function atroposPartHitPulse(e,key){
  const r=e.atroposReborn;if(!r||r.lastHitPart!==key)return 0;
  return clamp(1-((state.time||0)-r.lastHitAt)/.18,0,1);
}
function atroposManifest(e){
  const tr=atroposEntryTransition();
  if(tr)return atroposEaseOut(clamp((tr.elapsed/tr.duration-.42)/.38,0,1));
  return clamp((e.atroposReborn?.introAge||0)/.72,0,1);
}
function atroposTracePlate(g,key,r){
  g.beginPath();
  if(key==='west-blade'){
    g.moveTo(-1.28*r,-.18*r);g.bezierCurveTo(-1.08*r,-.72*r,-.58*r,-1.03*r,-.05*r,-.92*r);g.lineTo(.42*r,-.56*r);g.lineTo(.24*r,-.06*r);g.lineTo(.70*r,.36*r);g.bezierCurveTo(.25*r,.89*r,-.48*r,1.04*r,-1.08*r,.62*r);g.lineTo(-.82*r,.14*r);g.closePath();
  }else if(key==='east-blade'){
    g.moveTo(1.30*r,-.08*r);g.bezierCurveTo(.95*r,-.73*r,.40*r,-1.00*r,-.18*r,-.82*r);g.lineTo(-.62*r,-.38*r);g.lineTo(-.30*r,.04*r);g.lineTo(-.72*r,.58*r);g.bezierCurveTo(-.16*r,.98*r,.58*r,.87*r,1.08*r,.42*r);g.lineTo(.78*r,.08*r);g.closePath();
  }else if(key==='crown-anchor'){
    g.moveTo(-.86*r,-.75*r);g.lineTo(-.22*r,-1.20*r);g.lineTo(.58*r,-.88*r);g.lineTo(.94*r,-.16*r);g.lineTo(.48*r,.30*r);g.lineTo(.12*r,1.02*r);g.lineTo(-.62*r,.74*r);g.lineTo(-.98*r,.05*r);g.closePath();
  }else if(key==='keel-anchor'){
    g.moveTo(-.70*r,-.86*r);g.lineTo(.18*r,-1.06*r);g.lineTo(.76*r,-.50*r);g.lineTo(.52*r,.06*r);g.lineTo(.92*r,.72*r);g.lineTo(.10*r,1.18*r);g.lineTo(-.54*r,.66*r);g.lineTo(-.88*r,.04*r);g.closePath();
  }else{
    g.moveTo(-.58*r,-1.08*r);g.bezierCurveTo(.06*r,-1.28*r,.70*r,-.86*r,.72*r,-.22*r);g.lineTo(.48*r,.16*r);g.bezierCurveTo(.78*r,.58*r,.38*r,1.10*r,-.10*r,1.18*r);g.lineTo(-.72*r,.62*r);g.lineTo(-.52*r,.02*r);g.lineTo(-.82*r,-.52*r);g.closePath();
  }
}
function atroposPlateRim(g,key,r,hit,active){
  g.save();g.strokeStyle=hit?'rgba(255,255,255,.96)':active?'rgba(186,244,232,.66)':'rgba(92,130,128,.26)';g.lineWidth=hit?4.8:2.4;g.lineCap='round';
  g.beginPath();
  if(key==='west-blade'){g.moveTo(-1.18*r,-.18*r);g.bezierCurveTo(-.96*r,-.63*r,-.50*r,-.91*r,-.05*r,-.84*r);g.lineTo(.34*r,-.54*r);g.moveTo(-.96*r,.58*r);g.bezierCurveTo(-.42*r,.88*r,.18*r,.76*r,.56*r,.34*r);}
  else if(key==='east-blade'){g.moveTo(1.18*r,-.07*r);g.bezierCurveTo(.84*r,-.60*r,.33*r,-.87*r,-.16*r,-.74*r);g.moveTo(-.58*r,.54*r);g.bezierCurveTo(-.12*r,.82*r,.46*r,.72*r,.94*r,.38*r);}
  else if(key==='crown-anchor'){g.moveTo(-.75*r,-.70*r);g.lineTo(-.20*r,-1.08*r);g.lineTo(.50*r,-.78*r);g.moveTo(.78*r,-.10*r);g.lineTo(.38*r,.26*r);}
  else if(key==='keel-anchor'){g.moveTo(-.60*r,-.76*r);g.lineTo(.14*r,-.94*r);g.lineTo(.64*r,-.46*r);g.moveTo(.76*r,.62*r);g.lineTo(.08*r,1.05*r);}
  g.stroke();g.restore();
}
function drawAtroposPlate(g,p,key,e,angle,scale=1,alpha=1){
  const hit=atroposPartHitPulse(e,key),part=atroposPart(e,key),active=part?.active!==false,r=(part?.r||100)*scale;
  g.save();g.translate(p.x,p.y);g.rotate(angle);g.globalAlpha*=alpha;if(hit)g.translate(rand(-6,6)*hit,rand(-5,5)*hit);
  const grad=g.createLinearGradient(-r,-r,r*.9,r*.8);grad.addColorStop(0,hit?'#efffff':'#18242d');grad.addColorStop(.32,hit?'#c8fff4':'#0f1a23');grad.addColorStop(.72,'#081018');grad.addColorStop(1,'#02050a');g.fillStyle=grad;
  atroposTracePlate(g,key,r);g.fill();
  g.save();atroposTracePlate(g,key,r);g.clip();
  g.globalAlpha=.22+.22*hit;g.fillStyle=hit?'#eaffff':'#243845';
  g.beginPath();g.moveTo(-1.1*r,-.15*r);g.lineTo(-.20*r,-.82*r);g.lineTo(.16*r,-.08*r);g.lineTo(-.36*r,.30*r);g.closePath();g.fill();
  g.globalAlpha=.16;g.fillStyle='#000308';g.beginPath();g.moveTo(.05*r,-.78*r);g.lineTo(.76*r,-.28*r);g.lineTo(.22*r,.12*r);g.closePath();g.fill();
  g.globalAlpha=.30;g.strokeStyle='#7ad7c9';g.lineWidth=1.3;g.beginPath();g.moveTo(-.58*r,-.18*r);g.lineTo(-.08*r,-.34*r);g.lineTo(.32*r,.02*r);g.lineTo(.02*r,.48*r);g.stroke();
  g.globalAlpha=.18;g.strokeStyle='#d6fff7';g.lineWidth=1;g.beginPath();g.moveTo(-.32*r,.54*r);g.lineTo(.22*r,.28*r);g.lineTo(.52*r,.52*r);g.stroke();
  g.restore();atroposPlateRim(g,key,r,hit,active);g.restore();
}
function drawAtroposVoidMass(g,c,e,manifest){
  const t=state.time||0,pulse=.5+.5*Math.sin(t*.27+e.atroposReborn.driftSeed);g.save();g.translate(c.x,c.y);
  const halo=g.createRadialGradient(18,18,28,18,18,390);halo.addColorStop(0,`rgba(0,1,5,${.99*manifest})`);halo.addColorStop(.52,`rgba(2,7,12,${(.93+.03*pulse)*manifest})`);halo.addColorStop(.82,`rgba(5,12,18,${.46*manifest})`);halo.addColorStop(1,'rgba(3,8,13,0)');g.fillStyle=halo;g.beginPath();g.ellipse(8,22,418,358,-.08,0,TAU);g.fill();
  g.globalAlpha=.90*manifest;g.fillStyle='#03070c';g.beginPath();g.moveTo(-324,-84);g.bezierCurveTo(-274,-246,-112,-330,34,-310);g.bezierCurveTo(188,-300,322,-180,350,-34);g.bezierCurveTo(332,116,198,280,52,314);g.bezierCurveTo(-112,334,-282,216,-338,86);g.bezierCurveTo(-310,18,-302,-28,-324,-84);g.fill();
  g.globalAlpha=.52*manifest;g.fillStyle='#071018';g.beginPath();g.ellipse(-92,-48,150,238,-.38,0,TAU);g.fill();g.globalAlpha=.34*manifest;g.fillStyle='#0a151e';g.beginPath();g.ellipse(154,82,118,206,.34,0,TAU);g.fill();g.restore();
}
function drawAtroposCore(g,p,e,axis,alpha=1){
  const hit=atroposPartHitPulse(e,'rift-core'),part=atroposPart(e,'rift-core'),r=part?.r||166;g.save();g.translate(p.x,p.y);g.rotate(axis);g.globalAlpha*=alpha;if(hit)g.translate(rand(-6,6)*hit,rand(-5,5)*hit);
  const shell=g.createLinearGradient(-r,-r,r,r);shell.addColorStop(0,hit?'#f7ffff':'#22313b');shell.addColorStop(.38,hit?'#cffff7':'#111d26');shell.addColorStop(.75,'#081018');shell.addColorStop(1,'#010408');g.fillStyle=shell;
  atroposTracePlate(g,'rift-core',r);g.fill();g.save();atroposTracePlate(g,'rift-core',r);g.clip();
  g.globalAlpha=.28;g.fillStyle='#2b414b';g.beginPath();g.moveTo(-.58*r,-.80*r);g.lineTo(.08*r,-1.05*r);g.lineTo(.28*r,-.18*r);g.lineTo(-.24*r,.02*r);g.closePath();g.fill();
  g.globalAlpha=.30;g.fillStyle='#000207';g.beginPath();g.moveTo(-.18*r,-1.02*r);g.bezierCurveTo(.10*r,-.58*r,-.20*r,-.26*r,.02*r,-.02*r);g.bezierCurveTo(.26*r,.22*r,-.04*r,.58*r,.12*r,1.02*r);g.lineTo(-.20*r,.76*r);g.bezierCurveTo(-.34*r,.40*r,-.06*r,.12*r,-.28*r,-.10*r);g.bezierCurveTo(-.44*r,-.36*r,-.16*r,-.66*r,-.18*r,-1.02*r);g.fill();
  g.restore();
  g.strokeStyle=hit?'#fff':'rgba(210,255,247,.70)';g.lineWidth=hit?4.6:2.5;g.beginPath();g.moveTo(-.12*r,-.92*r);g.bezierCurveTo(.06*r,-.56*r,-.14*r,-.30*r,.02*r,-.04*r);g.bezierCurveTo(.18*r,.22*r,-.02*r,.50*r,.08*r,.84*r);g.stroke();g.restore();
}
function drawAtroposMantle(g,c,e,manifest,alignment=0){
  const t=state.time||0;g.save();g.translate(c.x,c.y);g.rotate(alignment*.10);g.globalAlpha*=manifest;g.lineCap='round';
  const arcs=[{r:420,a1:-2.90,a2:-1.98,w:64},{r:448,a1:-1.42,a2:-.54,w:42},{r:405,a1:.12,a2:.92,w:58},{r:438,a1:1.35,a2:2.20,w:46}];
  for(let i=0;i<arcs.length;i++){const a=arcs[i],breath=Math.sin(t*.18+i*1.7)*5;g.strokeStyle=i%2?'rgba(3,8,13,.98)':'rgba(5,12,17,.98)';g.lineWidth=a.w;g.beginPath();g.arc(0,18,a.r+breath,a.a1,a.a2);g.stroke();g.strokeStyle='rgba(161,222,213,.22)';g.lineWidth=1.8;g.beginPath();g.arc(0,18,a.r+breath-a.w*.43,a.a1+.04,a.a2-.04);g.stroke();}
  g.restore();
}
function drawAtroposBridges(g,points,manifest){
  const pairs=[['crown-anchor','west-blade'],['crown-anchor','rift-core'],['rift-core','east-blade'],['west-blade','keel-anchor'],['rift-core','keel-anchor']];g.save();g.lineCap='round';
  for(const [aKey,bKey] of pairs){const a=points[aKey],b=points[bKey];if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,mx=(a.x+b.x)*.5+nx*18,my=(a.y+b.y)*.5+ny*18;g.globalAlpha=.78*manifest;g.strokeStyle='#02060b';g.lineWidth=34;g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo(mx,my,b.x,b.y);g.stroke();g.globalAlpha=.11*manifest;g.strokeStyle='#aee6dc';g.lineWidth=2;g.stroke();}
  g.restore();
}
function atroposStructureAxis(e){
  const slash=e.atroposReborn?.slash;if(!slash)return -.08+Math.sin((state.time||0)*.14+e.atroposReborn.driftSeed)*.025;
  const q=slash.age<.78?atroposEaseInOut(slash.age/.78):slash.age<1.46?1:1-atroposEaseInOut((slash.age-1.46)/.74),rest=-.08,target=slash.angle-Math.PI/2;
  return rest+atroposAngleDelta(rest,target)*q;
}
function drawAtroposWorldBody(e){
  if(!ensureRebornAtropos(e))return;updateAtroposPose(e);const center=atroposScreenPoint(e.x,e.y),points={};for(const def of ATROPOS_PART_LAYOUT){const part=atroposPart(e,def.key);if(part)points[def.key]=atroposScreenPoint(part.x,part.y);}
  const margin=960;if(center.x<-margin||center.x>vw+margin||center.y<-margin||center.y>vh+margin)return;
  const phase=e.apexPhase||1,manifest=atroposManifest(e),axis=atroposStructureAxis(e),slash=e.atroposReborn?.slash,t=state.time||0;ctx.save();ctx.lineJoin='round';drawAtroposVoidMass(ctx,center,e,manifest);drawAtroposMantle(ctx,center,e,manifest,slash?1:0);drawAtroposBridges(ctx,points,manifest);
  const drift=(1-manifest)*6;ctx.save();ctx.translate(Math.sin(t*6.1)*drift,Math.cos(t*5.4)*drift*.4);drawAtroposPlate(ctx,points['west-blade'],'west-blade',e,axis+Math.PI*.95,1.18,manifest);drawAtroposPlate(ctx,points['crown-anchor'],'crown-anchor',e,axis-Math.PI*.55,1.02,manifest);drawAtroposCore(ctx,points['rift-core'],e,axis,manifest);drawAtroposPlate(ctx,points['east-blade'],'east-blade',e,axis+.08,1.16,manifest);drawAtroposPlate(ctx,points['keel-anchor'],'keel-anchor',e,axis+Math.PI*.54,1.03,manifest);ctx.restore();
  ctx.globalAlpha=.22*manifest;ctx.fillStyle='#789c9b';for(let i=0;i<5;i++){const a=e.atroposReborn.driftSeed+i*1.47,rr=430+(i%2)*56,sz=4+i%3*2;ctx.save();ctx.translate(center.x+Math.cos(a)*rr,center.y+Math.sin(a)*rr*.78);ctx.rotate(a*.33);ctx.fillRect(-sz*.5,-sz*1.4,sz,sz*2.8);ctx.restore();}ctx.restore();
}
function drawAtroposSpaceCut(e){
  const slash=e.atroposReborn?.slash;if(!slash||slash.age<.52||slash.age>1.70)return;const a=atroposScreenPoint(slash.x1,slash.y1),b=atroposScreenPoint(slash.x2,slash.y2),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;ctx.save();ctx.lineCap='round';
  if(slash.age<1.20){const q=clamp((slash.age-.52)/.68,0,1);ctx.globalAlpha=.08+.21*q;ctx.strokeStyle='#bffdf3';ctx.lineWidth=1.1+q*1.5;ctx.setLineDash([28,36]);ctx.lineDashOffset=-(state.time||0)*14;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.05+.08*q;ctx.strokeStyle='#79ffe1';ctx.lineWidth=9;ctx.stroke();}
  else{const elapsed=slash.age-1.20,open=elapsed<.13?atroposEaseOut(elapsed/.13):slash.age>1.53?clamp((1.70-slash.age)/.17,0,1):1,gap=8+open*23;ctx.globalAlpha=.50;ctx.strokeStyle='#000207';ctx.lineWidth=gap*2.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=.86;ctx.strokeStyle='#effffb';ctx.shadowColor='#79ffe1';ctx.shadowBlur=14;ctx.lineWidth=2.6;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(a.x+nx*gap*side,a.y+ny*gap*side);ctx.lineTo(b.x+nx*gap*side,b.y+ny*gap*side);ctx.stroke();}ctx.shadowBlur=0;ctx.globalAlpha=.27;ctx.strokeStyle='#8fffe0';ctx.lineWidth=1.3;for(let i=1;i<11;i+=2){const q=i/12,x=a.x+dx*q,y=a.y+dy*q,span=12+open*18;ctx.beginPath();ctx.moveTo(x-nx*span,y-ny*span);ctx.lineTo(x+nx*span*.42,y+ny*span*.42);ctx.stroke();}}
  ctx.restore();
}

function drawAtroposRealmBackground(tr){
  const p=clamp(tr.elapsed/tr.duration,0,1),blend=atroposEaseInOut(clamp((p-.42)/.46,0,1));drawTheme(normalizedRealmTheme(tr.from));if(blend>0){ctx.save();ctx.globalAlpha=blend;drawTheme(normalizedRealmTheme(tr.to));ctx.restore();}
}
function drawAtroposTransitionSignature(){}
const baseDrawBackgroundAtropos=drawBackground;
drawBackground=function drawBackgroundWithAtroposEntry(){const tr=state.realmTransition;if(tr?.to==='apex-chrono')return drawAtroposRealmBackground(tr);return baseDrawBackgroundAtropos();};
const baseDrawTransitionSignatureAtropos=drawTransitionSignature;
drawTransitionSignature=function drawTransitionSignatureWithAtropos(tr,p,fade){if(tr?.to==='apex-chrono')return;return baseDrawTransitionSignatureAtropos(tr,p,fade);};
const baseDrawRealmCinematicOverlayAtropos=drawRealmCinematicOverlay;
drawRealmCinematicOverlay=function drawRealmCinematicOverlayWithAtropos(){
  const tr=state.realmTransition;if(tr?.to!=='apex-chrono')return baseDrawRealmCinematicOverlayAtropos();const p=clamp(tr.elapsed/tr.duration,0,1),freeze=1-clamp(p/.18,0,1),settle=clamp((p-.18)/.38,0,1);ctx.save();ctx.globalAlpha=.07+.08*freeze+.05*(1-settle);ctx.fillStyle='#00030a';ctx.fillRect(0,0,vw,vh);ctx.restore();
};
const baseDrawApexArenaAtropos=drawApexArena;
drawApexArena=function drawApexArenaWithoutChronoBoundary(){if(state.apexArena?.form==='chronophage'&&(state.apexActiveId||state.pendingApexForm||state.realmTransition?.to==='apex-chrono'))return;return baseDrawApexArenaAtropos();};

drawChronophageApex=function drawChronophageApexRebornOwnerStub(){};
const baseDrawEnemiesAtropos=drawEnemies;
drawEnemies=function drawEnemiesWithRebornAtropos(){
  const hidden=[];for(const e of state.entities.enemies){if(e?.apexForm==='chronophage'){hidden.push([e,e.bodyParts,e.x,e.y]);e.bodyParts=null;e.x=1e9;e.y=1e9;}}
  try{baseDrawEnemiesAtropos();}finally{for(const [e,parts,x,y] of hidden){e.bodyParts=parts;e.x=x;e.y=y;}}
  const e=state.entities.enemies.find(enemy=>!enemy.dead&&enemy.apexForm==='chronophage');if(e){drawAtroposWorldBody(e);drawAtroposSpaceCut(e);}
};
window.stackfallAtroposRebornDiagnostics=()=>{const e=state.entities.enemies.find(enemy=>!enemy.dead&&enemy.apexForm==='chronophage');return e?{active:true,anchor:{x:e.x,y:e.y},phase:e.apexPhase,introAge:e.atroposReborn?.introAge||0,entrySerial:ATROPOS_ENTRY_CONTROL.serial,parts:(e.bodyParts||[]).map(p=>({key:p.key,x:p.x,y:p.y,r:p.r,active:p.active})),slash:e.atroposReborn?.slash?{age:e.atroposReborn.slash.age,targetX:e.atroposReborn.slash.targetX,targetY:e.atroposReborn.slash.targetY,angle:e.atroposReborn.slash.angle}:null}:{active:false,entrySerial:ATROPOS_ENTRY_CONTROL.serial};};