const STACKFALL_COMPACT_POINTER_QUERY=matchMedia('(pointer:coarse)');
let stackfallCompactDevice=STACKFALL_COMPACT_POINTER_QUERY.matches||innerWidth<760;
function refreshCompactDevice(){stackfallCompactDevice=STACKFALL_COMPACT_POINTER_QUERY.matches||innerWidth<760;}
STACKFALL_COMPACT_POINTER_QUERY.addEventListener?.('change',refreshCompactDevice);
window.addEventListener('resize',refreshCompactDevice,{passive:true});
function compactDevice(){return stackfallCompactDevice;}
const ENTITY_CAPS={desktop:{enemies:104,gems:140,playerProjectiles:340,enemyProjectiles:420,particles:520,texts:120,shockwaves:130,telegraphs:90,beams:140},compact:{enemies:72,gems:90,playerProjectiles:220,enemyProjectiles:260,particles:260,texts:56,shockwaves:70,telegraphs:48,beams:70}};
function entityCap(kind){return(compactDevice()?ENTITY_CAPS.compact:ENTITY_CAPS.desktop)[kind]||160;}
function trimOldest(list,max){if(list.length>max)list.splice(0,list.length-max);}
function compactInPlace(list,keep,onDiscard=null){let write=0;for(let read=0;read<list.length;read++){const item=list[read];if(keep(item))list[write++]=item;else onDiscard?.(item);}const removed=list.length-write;list.length=write;return removed;}
const runUiTimers=new Set();
function clearRunUiActions(){for(const timer of runUiTimers)clearTimeout(timer);runUiTimers.clear();}
function scheduleUiAction(delay,action){const run=state.runSerial,timer=setTimeout(()=>{runUiTimers.delete(timer);if(state.runSerial===run)action();},Math.max(0,delay));runUiTimers.add(timer);return timer;}
function clearPendingCombatActions(){if(state.pendingActions)state.pendingActions.length=0;}
function scheduleWeaponAction(delay,action){if(typeof action!=='function')return null;const pending=state.pendingActions||(state.pendingActions=[]),environmentContext=state.stageEnvironmentTelegraphContext?{...state.stageEnvironmentTelegraphContext}:null,entry={remaining:Math.max(0,Number(delay)||0)/1000,runSerial:state.runSerial,action,environmentContext};if(pending.length>=320)pending.splice(0,pending.length-319);pending.push(entry);return entry;}
function updatePendingActions(dt){
  const pending=state.pendingActions;if(!pending?.length||state.mode!=='playing')return;
  const currentRun=state.runSerial,due=[],initial=pending.length;let write=0;
  for(let read=0;read<initial;read++){const entry=pending[read];if(!entry||entry.runSerial!==currentRun||typeof entry.action!=='function')continue;entry.remaining-=dt;if(entry.remaining<=0)due.push(entry);else pending[write++]=entry;}
  pending.length=write;
  for(const entry of due){
    if(entry.runSerial!==state.runSerial||state.mode!=='playing')break;
    const previousEnvironmentContext=state.stageEnvironmentTelegraphContext||null;
    state.stageEnvironmentTelegraphContext=entry.environmentContext?{...entry.environmentContext}:null;
    try{if(typeof runRuntimeStage==='function')runRuntimeStage('scheduledWeaponAction',entry.action);else entry.action();}catch(error){console.error('[Stackfall] scheduledWeaponAction failed',error);}finally{state.stageEnvironmentTelegraphContext=previousEnvironmentContext;}
  }
}
function forEachNearbyEnemyCandidate(x,y,range,visit){if(typeof performanceForEachNearbyEnemy==='function')return performanceForEachNearbyEnemy(x,y,range,visit);const nearby=typeof performanceNearbyEnemies==='function'?performanceNearbyEnemies(x,y,range):state.entities.enemies;for(const enemy of nearby)visit(enemy);}
function enemyConfig(type){const t=state.time||0,threat=1+Math.floor(t/60),baseScale=enemyHpMult(),configs={grunt:{r:13,hp:22,speed:50,damage:6,color:'#7769ff',xp:3,name:'공허 유체'},fast:{r:11,hp:17,speed:82,damage:5,color:'#ff4f9a',xp:3,name:'추적 혜성'},ranged:{r:15,hp:34,speed:45,damage:7,color:'#ff6f7d',xp:5,name:'성운 포격체'},tank:{r:22,hp:82,speed:31,damage:10,color:'#ff9f43',xp:8,name:'성간 보루'},mini:{r:34,hp:420,speed:43,damage:14,color:'#d85cff',xp:42,name:'균열의 기사'},boss:{r:58,hp:1850,speed:30,damage:18,color:'#ff536f',xp:160,name:'일식의 군주'}},c=configs[type]||configs.grunt,tier=type==='mini'?1+t/820:type==='boss'?1+t/700:1,damageScale=1+Math.min(.45,t/1500)+Math.max(0,threat-1)*.015;return{...c,hp:c.hp*baseScale*tier,damage:c.damage*damageScale};}
function makeEnemyRoom(kind){
  const elite=['mini','boss','void','apex'].includes(kind),cap=entityCap('enemies'),normalCap=Math.max(24,cap-7);
  let liveCount=0;for(const e of state.entities.enemies)if(e&&!e.dead)liveCount++;
  if(!elite&&liveCount>=normalCap)return false;
  if(elite&&liveCount>=cap){
    const removeCount=liveCount-cap+1;let removed=0;
    while(removed<removeCount){let farthest=null,farthestD2=-1;for(const e of state.entities.enemies){if(!e||e.dead||e.type==='mini'||e.type==='boss')continue;const dx=e.x-player.x,dy=e.y-player.y,d2=dx*dx+dy*dy;if(d2>farthestD2){farthestD2=d2;farthest=e;}}if(!farthest)break;farthest.dead=true;removed++;}
    if(removed)compactInPlace(state.entities.enemies,e=>e&&!e.dead);
  }
  return true;
}
const EXPERIENCE_ANCHORS=[],EXPERIENCE_ANCHOR_D2=[];
function experienceGemRadius(value,base=4){return Math.min(13.5,Math.max(base,3.7+Math.log2(1+Math.max(0,Number(value)||0))*1.05));}
function mergeExperienceGem(x,y,value,baseRadius=4,vx=0,vy=0){
  const gems=state.entities.gems,amount=Math.max(0,Number(value)||0);if(!amount)return null;
  const newPlayerD2=(x-player.x)**2+(y-player.y)**2;
  let anchor=null,anchorIndex=-1,bestSpatial=Infinity,anchorPlayerD2=Infinity;
  for(let i=0;i<gems.length;i++){
    const g=gems[i];if(!g||g.life<=0)continue;const dx=g.x-x,dy=g.y-y,d2=dx*dx+dy*dy,mergeRadius=42+Math.min(54,(Number(g.r)||4)*4);
    if(d2>mergeRadius*mergeRadius)continue;
    const pd2=(g.x-player.x)**2+(g.y-player.y)**2;
    if(pd2<anchorPlayerD2-1e-6||(Math.abs(pd2-anchorPlayerD2)<1e-6&&d2<bestSpatial)){anchor=g;anchorIndex=i;anchorPlayerD2=pd2;bestSpatial=d2;}
  }
  if(anchor){
    if(anchorPlayerD2<=newPlayerD2){
      const before=Math.max(0,Number(anchor.value)||0),total=before+amount;
      anchor.value=total;anchor.compressedValue=(anchor.compressedValue||0)+amount;anchor.r=experienceGemRadius(total,Math.max(baseRadius,Number(anchor.r)||4));anchor.life=Math.max(Number(anchor.life)||0,35);anchor.pulse=(anchor.pulse||0)+.72;
      return anchor;
    }
    const inherited=Math.max(0,Number(anchor.value)||0),total=inherited+amount;
    gems.splice(anchorIndex,1);
    const gem={x,y,vx,vy,r:experienceGemRadius(total,Math.max(baseRadius,Number(anchor.r)||4)),value:total,life:35,pulse:(anchor.pulse||Math.random()*TAU)+.72,compressedValue:(anchor.compressedValue||0)+inherited};
    gems.push(gem);return gem;
  }
  const gem={x,y,vx,vy,r:experienceGemRadius(amount,baseRadius),value:amount,life:35,pulse:Math.random()*TAU,compressedValue:0};gems.push(gem);return gem;
}
function compressExperience(){
  const gems=state.entities.gems,cap=entityCap('gems');if(!gems||gems.length<=cap)return;if(cap<=0){gems.length=0;return;}
  const ranked=gems.filter(Boolean).sort((a,b)=>((a.x-player.x)**2+(a.y-player.y)**2)-((b.x-player.x)**2+(b.y-player.y)**2)),keep=ranked.slice(0,cap),overflow=ranked.slice(cap);
  for(const far of overflow){
    if(!keep.length)break;let anchor=keep[0],best=Infinity;
    for(const near of keep){const dx=near.x-far.x,dy=near.y-far.y,d2=dx*dx+dy*dy;if(d2<best){best=d2;anchor=near;}}
    const amount=Math.max(0,Number(far.value)||0);anchor.value=(Number(anchor.value)||0)+amount;anchor.compressedValue=(anchor.compressedValue||0)+amount;anchor.r=experienceGemRadius(anchor.value,Math.max(Number(anchor.r)||4,Number(far.r)||4));anchor.life=Math.max(Number(anchor.life)||0,Number(far.life)||0,35);anchor.pulse=(anchor.pulse||0)+.55;
  }
  gems.length=0;gems.push(...keep);
}
function createEliteTwin(enemy){
  if(!enemy||!['mirror','paradox'].includes(enemy.eliteForm))return null;
  const group=`twins-${enemy.id}`,ratio=enemy.eliteForm==='paradox'?.72:.68,baseHp=enemy.hp*ratio,baseXp=enemy.xp*.62,angle=Math.atan2(enemy.y-player.y,enemy.x-player.x),normal={x:-Math.sin(angle),y:Math.cos(angle)},gap=enemy.r*1.7;
  enemy.twinGroup=group;enemy.twinSide=-1;enemy.noEliteReward=true;enemy.hp=enemy.maxHp=baseHp;enemy.xp=baseXp;enemy.x+=normal.x*gap;enemy.y+=normal.y*gap;
  const twin={...enemy,id:state.nextId++,x:enemy.x-normal.x*gap*2,y:enemy.y-normal.y*gap*2,phase:(enemy.phase||0)+Math.PI,skillCd:(enemy.skillCd||3)+.45,burstCd:(enemy.burstCd||6)+.75,pulseCd:(enemy.pulseCd||8)+.3,twinSide:1,noEliteReward:true,dead:false};
  twin.color=enemy.eliteForm==='paradox'?'#8d6bce':'#e3d8ff';state.entities.enemies.push(twin);return twin;
}
function spawnEnemy(kind='normal'){
  if(!makeEnemyRoom(kind))return null;const a=Math.random()*TAU,radius=Math.min(Math.max(vw,vh)*.52,690)+rand(50,150),eliteKind=['mini','boss','void','apex'].includes(kind)?kind:null;let type;
  if(kind==='mini')type='mini';else if(kind==='boss'||kind==='void'||kind==='apex')type='boss';else{const t=state.time||0,fastChance=clamp(.07+t/520,.07,.27),tankChance=clamp((t-70)/480,0,.17),rangedChance=clamp((t-55)/650,0,.13)*(window.stackfallDifficultyConfig?.().rangedChance||1),roll=Math.random();type=roll<tankChance?'tank':roll<tankChance+rangedChance?'ranged':roll<tankChance+rangedChance+fastChance?'fast':'grunt';}
  const cfg=enemyConfig(type),threat=1+Math.floor((state.time||0)/60),speedScale=1+Math.min(.55,(state.time||0)/1500)+Math.min(.20,Math.max(0,threat-1)*.012),enemy={id:state.nextId++,type,kind:eliteKind||'normal',variant:null,name:cfg.name,x:player.x+Math.cos(a)*radius,y:player.y+Math.sin(a)*radius,r:cfg.r,hp:cfg.hp,maxHp:cfg.hp,speed:cfg.speed*speedScale,damage:cfg.damage,color:cfg.color,xp:cfg.xp,hit:0,dead:false,phase:Math.random()*TAU,skillCd:type==='boss'?2.4:type==='mini'?3.2:999,burstCd:type==='boss'?5.4:type==='mini'?6.2:999,pulseCd:type==='boss'?8.2:999,rangedCd:type==='ranged'?rand(1.0,1.8):999,strafeDir:Math.random()<.5?-1:1,dash:0,dashX:0,dashY:0};
  if(eliteKind&&typeof configureElite==='function')configureElite(enemy,eliteKind);state.entities.enemies.push(enemy);const twin=createEliteTwin(enemy);
  if(type==='boss'){state.bossActiveId=enemy.id;if(enemy.kind==='apex')state.apexActiveId=enemy.id;state.bossIndex++;showBossNotice(enemy.name,enemy.kind==='apex'?'APEX THREAT':enemy.kind==='void'?'VOID RIFT':'BOSS APPROACHING');audio.boss();}else if(type==='mini')showBossNotice(enemy.name,'RIFT DETECTED');if(twin)shockwave((enemy.x+twin.x)/2,(enemy.y+twin.y)/2,enemy.color,150,.55,4);return enemy;
}
function spawnParticle(x,y,color,count=6,speed=120,size=3){const room=Math.max(0,entityCap('particles')-state.entities.particles.length),actual=Math.min(count,room);for(let i=0;i<actual;i++){const a=Math.random()*TAU,s=rand(speed*.35,speed);state.entities.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.22,.62),max:.62,size:rand(size*.5,size),color,star:Math.random()<.28});}}
function addText(x,y,text,color='#fff',size=13){if(state.entities.texts.length>=entityCap('texts'))state.entities.texts.shift();state.entities.texts.push({x,y,text,color,size,life:.72,max:.72,vy:-35});}
function shockwave(x,y,color,maxR=100,life=.35,width=3){if(state.entities.shockwaves.length>=entityCap('shockwaves'))state.entities.shockwaves.shift();state.entities.shockwaves.push({x,y,r:6,maxR,life,max:life,color,width});}
function dealDamage(enemy,amount,opts={}){if(!enemy||enemy.dead)return;const critChance=clamp(.05+stat('crit')*.06,.05,1),crit=opts.canCrit!==false&&Math.random()<critChance,elite=enemy.type==='mini'||enemy.type==='boss';amount*=damageMult()*(elite?1+stat('eliteHunter')*.15:1)*(crit?1.8:1);const hpBefore=enemy.hp;enemy.hp-=amount;const inflicted=Math.max(0,Math.min(hpBefore,amount));if(typeof registerRunDamage==='function')registerRunDamage(inflicted,opts.source);if(elite&&typeof registerStackfallBossChainDamage==='function')registerStackfallBossChainDamage(enemy,inflicted,opts);enemy.hit=.09;const color=crit?COLORS.amber:(opts.color||COLORS.white),stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed(),showNumbers=GAME_SETTINGS.damageNumbers!==false&&(!stressed||crit||elite);if(showNumbers)addText(enemy.x,enemy.y-enemy.r,Math.round(amount),color,crit?18:12);if(crit||elite||(!stressed&&Math.random()<.20))spawnParticle(enemy.x,enemy.y,color,crit?6:elite?2:1,crit?150:85,crit?4:2.2);audio.hit(crit||elite,opts.source||'');if(enemy.hp<=0)killEnemy(enemy,opts);}
function killEnemy(enemy,opts={}){
  if(!enemy||enemy.dead)return;enemy.dead=true;let survivingTwin=null;if(enemy.twinGroup){for(const e of state.entities.enemies){if(e!==enemy&&!e.dead&&e.twinGroup===enemy.twinGroup){survivingTwin=e;break;}}}const lastTwin=!enemy.twinGroup||!survivingTwin;if(enemy.twinGroup&&lastTwin)enemy.noEliteReward=false;
  state.kills++;state.combo++;
  const durationMult=typeof chainDurationMultiplier==='function'?chainDurationMultiplier():(1+stat('chain')*.07)*(1+(state.nebulaExtras?.chain||0)*.20);
  state.comboTimer=2.15*durationMult;state.maxCombo=Math.max(state.maxCombo,state.combo);
  const authoredStageDeath=enemy.kind==='stage-boss'&&['stage-01','stage-02'].includes(enemy.eventKind),isBoss=enemy.type==='boss',isMini=enemy.type==='mini',isApex=enemy.kind==='apex',stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed(),burst=authoredStageDeath?0:isApex?64:isBoss?34:isMini?18:stressed?1:enemy.type==='tank'?7:4;spawnParticle(enemy.x,enemy.y,enemy.color,burst,isApex?380:isBoss?290:isMini?220:130,isApex?9:isBoss?7:isMini?5:3.5);if(!authoredStageDeath&&(isBoss||isMini||!stressed))shockwave(enemy.x,enemy.y,enemy.color,isApex?400:isBoss?260:isMini?160:enemy.type==='tank'?76:44,isApex?1.05:isBoss?.72:isMini?.50:.24,isApex?10:isBoss?6:isMini?4:2);
  if((isBoss||isMini)&&lastTwin){state.camera.shake+=isApex?25:isBoss?15:10;state.hitStop=isApex?.20:isBoss?.11:.07;state.flash=isApex?.32:isBoss?.20:.11;audio.resonance();}else if(!isBoss&&!isMini&&state.combo%40===0){state.hitStop=.018;}
  const gemCount=isApex?(stressed?10:18):isBoss?(stressed?7:12):isMini?(stressed?4:6):enemy.type==='tank'?2:1;for(let i=0;i<gemCount;i++)mergeExperienceGem(enemy.x+rand(-18,18),enemy.y+rand(-18,18),enemy.xp/gemCount,isApex?8:isBoss?7:isMini?6:4,rand(-75,75),rand(-75,75));compressExperience();
  if(isBoss){if(survivingTwin)state.bossActiveId=survivingTwin.id;else{state.bossActiveId=null;ui.bossBar.classList.add('hidden');if(isApex)state.apexActiveId=null;}}
  if(weaponCount('blade')>=6&&opts.source==='blade'&&state.combo%6===0)areaDamage(enemy.x,enemy.y,130,42,COLORS.cyan,'blade-burst');if(typeof handleAnyEnemyKill==='function')handleAnyEnemyKill(enemy,opts);if((isBoss||isMini)&&lastTwin&&typeof handleEliteDeath==='function')handleEliteDeath(enemy,opts);
  if(enemy.kind==='stage-boss'&&typeof window.handleStageBossDefeated==='function')window.handleStageBossDefeated(enemy);
}
function areaDamage(x,y,r,damage,color,source='area',options={}){shockwave(x,y,color,r,.34,4);if(options.shake===true)state.camera.shake+=3;forEachNearbyEnemyCandidate(x,y,r+130,e=>{if(!e.dead&&enemyCircleOverlap(e,x,y,r))dealDamage(e,damage,{color,source});});}
function spawnPlayerProjectile(data){const source=data||{},next=window.stackfallProjectilePool?.pop?.()||{};for(const key in next)delete next[key];Object.assign(next,source);const photon=state.nebulaExtras?.photon||0,speed=(1+photon*.12)*(1+stat('projectileSpeed')*.10),size=(1+photon*.08)*(1+stat('projectileSize')*.10);if(Number.isFinite(next.vx))next.vx*=speed;if(Number.isFinite(next.vy))next.vy*=speed;if(Number.isFinite(next.r))next.r*=size;next.pierce=(Number.isFinite(next.pierce)?next.pierce:0)+stat('pierce');if(state.entities.projectiles.length>=entityCap('playerProjectiles')){const removed=state.entities.projectiles.shift();if(removed&&window.stackfallProjectilePool?.length<320)window.stackfallProjectilePool.push(removed);}const originX=Number.isFinite(next.originX)?next.originX:(Number.isFinite(next.x)?next.x:player.x),originY=Number.isFinite(next.originY)?next.originY:(Number.isFinite(next.y)?next.y:player.y);Object.assign(next,{trailTick:0,maxLife:next.life,originX,originY});state.entities.projectiles.push(next);return next;}
function inferEnemyProjectileVisual(color,speed=0,r=5){
  const text=String(color||'').toLowerCase().replace(/s+/g,'');
  if(Math.abs(speed)<=1)return'mine';
  if(/79ffe1|8fffe0|c6fff4|d9fff8|e4fffb/.test(text))return'chrono';
  if(/ffb04e|ff9d42|ff7135|ff8a42|ffd26f|fff0a8|fff1b0|ffcb72|ffd07b|ffad73|ff895f/.test(text))return r>=6?'sun':'forge';
  if(/b7c9ff|9fb2ef|d8e2ff|f0f4ff|ffffff|eaf1ff|aebfff|879be0/.test(text))return'constellation';
  if(/7446c8|713dd0|8a4dff|8d5ddb|9b5cff|bb82ff|a86df0|d69cff|8d6bce|8c82ce|6960ad/.test(text))return'void';
  if(/d7b0ff|c58aff|c79cff|a9b4d8|6d789d|8799c9|d6a8ff/.test(text))return'rune';
  if(/65ddff|55d7ff|70e5ff|72e9ff|76d9ff|a9eaff|5ea8ff|69bfff|b5e8ff|b8fff0/.test(text))return'storm';
  if(/ff72cb|ff7db6|ff9bc9|ff61b0|e0d7ff|9d82ff|ff7|ff9/.test(text))return'mirror';
  if(speed>=225)return'needle';
  return r>=6.2?'orb':'needle';
}
function spawnEnemyProjectile(x,y,a,speed,damage,color='#ff6ccf',r=6,life=5,visual=null){
  if(state.entities.enemyProjectiles.length>=entityCap('enemyProjectiles'))state.entities.enemyProjectiles.shift();
  const environment=state.stageEnvironmentTelegraphContext||null,envScale=environment?window.stackfallStageEnvironmentCombatScale?.(environment):null;if(envScale){speed*=envScale.speed;damage*=envScale.damage;}
  const heading=Number.isFinite(a)?a:0,velocity=Number.isFinite(speed)?speed:0;
  const projectile={x,y,prevX:x,prevY:y,vx:Math.cos(heading)*velocity,vy:Math.sin(heading)*velocity,damage,color,r,life,maxLife:life,heading,phase:heading,age:0,visual:visual||inferEnemyProjectileVisual(color,velocity,r),visualSeed:Math.random()*TAU};
  state.entities.enemyProjectiles.push(projectile);return projectile;
}
function nearestEnemy(x,y,maxRange=Infinity,predicate=null){if(typeof performanceNearestEnemy==='function')return performanceNearestEnemy(x,y,maxRange,predicate);let best=null,bd=Number.isFinite(maxRange)?maxRange*maxRange:Infinity,candidates=state.entities.enemies;if(Number.isFinite(maxRange)&&typeof performanceNearbyEnemies==='function'){const nearby=performanceNearbyEnemies(x,y,maxRange);if(nearby.length)candidates=nearby;}for(const e of candidates){if(e.dead||(predicate&&!predicate(e)))continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e;}}return best;}