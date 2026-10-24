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
const PENDING_ACTION_DUE=[];
function updatePendingActions(dt){
  const pending=state.pendingActions;if(!pending?.length||state.mode!=='playing')return;
  const currentRun=state.runSerial,due=PENDING_ACTION_DUE,initial=pending.length;due.length=0;let write=0;
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
const ENEMY_BASE_CONFIGS={grunt:{r:13,hp:22,speed:50,damage:6,color:'#7769ff',xp:3,name:'공허 유체'},fast:{r:11,hp:17,speed:82,damage:5,color:'#ff4f9a',xp:3,name:'추적 혜성'},ranged:{r:15,hp:34,speed:45,damage:7,color:'#ff6f7d',xp:5,name:'성운 포격체'},tank:{r:22,hp:82,speed:31,damage:10,color:'#ff9f43',xp:8,name:'성간 보루'},mini:{r:34,hp:420,speed:43,damage:14,color:'#d85cff',xp:42,name:'균열의 기사'},boss:{r:58,hp:1850,speed:30,damage:18,color:'#ff536f',xp:160,name:'일식의 군주'}};
const ELITE_SPAWN_KINDS=new Set(['mini','boss','void','apex']),ELITE_TWIN_FORMS=new Set(['mirror','paradox']);
function enemyConfig(type){const t=state.time||0,threat=1+Math.floor(t/60),baseScale=enemyHpMult(),c=ENEMY_BASE_CONFIGS[type]||ENEMY_BASE_CONFIGS.grunt,tier=type==='mini'?1+t/820:type==='boss'?1+t/700:1,damageScale=1+Math.min(.45,t/1500)+Math.max(0,threat-1)*.015;return{...c,hp:c.hp*baseScale*tier,damage:c.damage*damageScale};}
function makeEnemyRoom(kind){
  const elite=ELITE_SPAWN_KINDS.has(kind),cap=entityCap('enemies'),normalCap=Math.max(24,cap-7);
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
  const ranked=EXPERIENCE_ANCHORS;ranked.length=0;for(let i=0;i<gems.length;i++){const gem=gems[i];if(gem)ranked.push(gem);}ranked.sort((a,b)=>((a.x-player.x)**2+(a.y-player.y)**2)-((b.x-player.x)**2+(b.y-player.y)**2));
  const keepCount=Math.min(cap,ranked.length);
  if(keepCount>0)for(let farIndex=keepCount;farIndex<ranked.length;farIndex++){
    const far=ranked[farIndex];let anchor=ranked[0],best=Infinity;
    for(let nearIndex=0;nearIndex<keepCount;nearIndex++){const near=ranked[nearIndex],dx=near.x-far.x,dy=near.y-far.y,d2=dx*dx+dy*dy;if(d2<best){best=d2;anchor=near;}}
    const amount=Math.max(0,Number(far.value)||0);anchor.value=(Number(anchor.value)||0)+amount;anchor.compressedValue=(anchor.compressedValue||0)+amount;anchor.r=experienceGemRadius(anchor.value,Math.max(Number(anchor.r)||4,Number(far.r)||4));anchor.life=Math.max(Number(anchor.life)||0,Number(far.life)||0,35);anchor.pulse=(anchor.pulse||0)+.55;
  }
  gems.length=keepCount;for(let i=0;i<keepCount;i++)gems[i]=ranked[i];ranked.length=0;
}
function createEliteTwin(enemy){
  if(!enemy||!ELITE_TWIN_FORMS.has(enemy.eliteForm))return null;
  const group=`twins-${enemy.id}`,ratio=enemy.eliteForm==='paradox'?.72:.68,baseHp=enemy.hp*ratio,baseXp=enemy.xp*.62,angle=Math.atan2(enemy.y-player.y,enemy.x-player.x),normal={x:-Math.sin(angle),y:Math.cos(angle)},gap=enemy.r*1.7;
  enemy.twinGroup=group;enemy.twinSide=-1;enemy.noEliteReward=true;enemy.hp=enemy.maxHp=baseHp;enemy.xp=baseXp;enemy.x+=normal.x*gap;enemy.y+=normal.y*gap;
  const twin={...enemy,id:state.nextId++,x:enemy.x-normal.x*gap*2,y:enemy.y-normal.y*gap*2,phase:(enemy.phase||0)+Math.PI,skillCd:(enemy.skillCd||3)+.45,burstCd:(enemy.burstCd||6)+.75,pulseCd:(enemy.pulseCd||8)+.3,twinSide:1,noEliteReward:true,dead:false};
  twin.color=enemy.eliteForm==='paradox'?'#8d6bce':'#e3d8ff';state.entities.enemies.push(twin);return twin;
}
function spawnEnemy(kind='normal'){
  if(!makeEnemyRoom(kind))return null;const a=Math.random()*TAU,radius=Math.min(Math.max(vw,vh)*.52,690)+rand(50,150),eliteKind=ELITE_SPAWN_KINDS.has(kind)?kind:null;let type;
  if(kind==='mini')type='mini';else if(kind==='boss'||kind==='void'||kind==='apex')type='boss';else{const t=state.time||0,fastChance=clamp(.07+t/520,.07,.27),tankChance=clamp((t-70)/480,0,.17),rangedChance=clamp((t-55)/650,0,.13)*(window.stackfallDifficultyConfig?.().rangedChance||1),roll=Math.random();type=roll<tankChance?'tank':roll<tankChance+rangedChance?'ranged':roll<tankChance+rangedChance+fastChance?'fast':'grunt';}
  const cfg=enemyConfig(type),threat=1+Math.floor((state.time||0)/60),speedScale=1+Math.min(.55,(state.time||0)/1500)+Math.min(.20,Math.max(0,threat-1)*.012),enemy={id:state.nextId++,type,kind:eliteKind||'normal',variant:null,name:cfg.name,x:player.x+Math.cos(a)*radius,y:player.y+Math.sin(a)*radius,r:cfg.r,hp:cfg.hp,maxHp:cfg.hp,speed:cfg.speed*speedScale,damage:cfg.damage,color:cfg.color,xp:cfg.xp,hit:0,dead:false,phase:Math.random()*TAU,skillCd:type==='boss'?2.4:type==='mini'?3.2:999,burstCd:type==='boss'?5.4:type==='mini'?6.2:999,pulseCd:type==='boss'?8.2:999,rangedCd:type==='ranged'?rand(1.0,1.8):999,strafeDir:Math.random()<.5?-1:1,dash:0,dashX:0,dashY:0};
  if(eliteKind&&typeof configureElite==='function')configureElite(enemy,eliteKind);state.entities.enemies.push(enemy);const twin=createEliteTwin(enemy);
  if(type==='boss'){state.bossActiveId=enemy.id;if(enemy.kind==='apex')state.apexActiveId=enemy.id;state.bossIndex++;showBossNotice(enemy.name,enemy.kind==='apex'?'APEX THREAT':enemy.kind==='void'?'VOID RIFT':'BOSS APPROACHING');audio.boss();}else if(type==='mini')showBossNotice(enemy.name,'RIFT DETECTED');if(twin)shockwave((enemy.x+twin.x)/2,(enemy.y+twin.y)/2,enemy.color,150,.55,4);return enemy;
}
const STACKFALL_PARTICLE_POOL_MARK=Symbol('stackfallParticlePool'),PARTICLE_OBJECT_POOL=[],PARTICLE_OBJECT_POOL_LIMIT=520;
function acquireParticleObject(x,y,vx,vy,life,max,size,color,star){const p=PARTICLE_OBJECT_POOL.pop()||{[STACKFALL_PARTICLE_POOL_MARK]:true,x:0,y:0,vx:0,vy:0,life:0,max:0,size:0,color:'#fff',star:false};p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.life=life;p.max=max;p.size=size;p.color=color;p.star=star;return p;}
function recycleParticleObject(p){if(p?.[STACKFALL_PARTICLE_POOL_MARK]===true&&PARTICLE_OBJECT_POOL.length<PARTICLE_OBJECT_POOL_LIMIT)PARTICLE_OBJECT_POOL.push(p);}
function spawnParticle(x,y,color,count=6,speed=120,size=3){const room=Math.max(0,entityCap('particles')-state.entities.particles.length),actual=Math.min(count,room);for(let i=0;i<actual;i++){const a=Math.random()*TAU,s=rand(speed*.35,speed),life=rand(.22,.62);state.entities.particles.push(acquireParticleObject(x,y,Math.cos(a)*s,Math.sin(a)*s,life,.62,rand(size*.5,size),color,Math.random()<.28));}}
const STACKFALL_EFFECT_TEXT_POOL_MARK=Symbol('stackfallEffectTextPool'),EFFECT_TEXT_POOL=[],EFFECT_TEXT_POOL_LIMIT=128;
function acquireTextEffect(x,y,text,color,size){const effect=EFFECT_TEXT_POOL.pop()||{[STACKFALL_EFFECT_TEXT_POOL_MARK]:true,x:0,y:0,text:'',color:'#fff',size:13,life:0,max:0,vy:0};effect.x=x;effect.y=y;effect.text=text;effect.color=color;effect.size=size;effect.life=.72;effect.max=.72;effect.vy=-35;return effect;}
function recycleTextEffect(effect){if(effect?.[STACKFALL_EFFECT_TEXT_POOL_MARK]===true&&EFFECT_TEXT_POOL.length<EFFECT_TEXT_POOL_LIMIT)EFFECT_TEXT_POOL.push(effect);}
const STACKFALL_SHOCKWAVE_POOL_MARK=Symbol('stackfallShockwavePool'),SHOCKWAVE_POOL=[],SHOCKWAVE_POOL_LIMIT=144;
function acquireShockwaveEffect(x,y,color,maxR,life,width){const effect=SHOCKWAVE_POOL.pop()||{[STACKFALL_SHOCKWAVE_POOL_MARK]:true,x:0,y:0,r:6,maxR:100,life:0,max:0,color:'#fff',width:3};effect.x=x;effect.y=y;effect.r=6;effect.maxR=maxR;effect.life=life;effect.max=life;effect.color=color;effect.width=width;return effect;}
function recycleShockwaveEffect(effect){if(effect?.[STACKFALL_SHOCKWAVE_POOL_MARK]===true&&SHOCKWAVE_POOL.length<SHOCKWAVE_POOL_LIMIT)SHOCKWAVE_POOL.push(effect);}
function trimPooledEffects(list,max,recycle){if(list.length<=max)return;const remove=list.length-max;for(let i=0;i<remove;i++)recycle?.(list[i]);list.splice(0,remove);}
function addText(x,y,text,color='#fff',size=13){if(state.entities.texts.length>=entityCap('texts'))recycleTextEffect(state.entities.texts.shift());state.entities.texts.push(acquireTextEffect(x,y,text,color,size));}
function shockwave(x,y,color,maxR=100,life=.35,width=3){if(state.entities.shockwaves.length>=entityCap('shockwaves'))recycleShockwaveEffect(state.entities.shockwaves.shift());state.entities.shockwaves.push(acquireShockwaveEffect(x,y,color,maxR,life,width));}
const STACKFALL_BEAM_POOL_MARK=Symbol('stackfallBeamPool'),BEAM_EFFECT_POOL=[],BEAM_EFFECT_POOL_LIMIT=192;
function acquireBeamEffect(x1,y1,x2,y2,life,color,width){const effect=BEAM_EFFECT_POOL.pop()||{[STACKFALL_BEAM_POOL_MARK]:true,x1:0,y1:0,x2:0,y2:0,life:0,max:0,color:'#fff',width:1};effect.x1=x1;effect.y1=y1;effect.x2=x2;effect.y2=y2;effect.life=life;effect.max=life;effect.color=color;effect.width=width;return effect;}
function recycleBeamEffect(effect){if(effect?.[STACKFALL_BEAM_POOL_MARK]===true&&BEAM_EFFECT_POOL.length<BEAM_EFFECT_POOL_LIMIT)BEAM_EFFECT_POOL.push(effect);}
function spawnBeamEffect(x1,y1,x2,y2,life,color,width){const beams=state.entities.beams;if(beams.length>=entityCap('beams'))recycleBeamEffect(beams.shift());const effect=acquireBeamEffect(x1,y1,x2,y2,life,color,width);beams.push(effect);return effect;}
function trimBeamEffects(beams,max){if(beams.length<=max)return;const remove=beams.length-max;for(let i=0;i<remove;i++)recycleBeamEffect(beams[i]);beams.splice(0,remove);}
function clearBeamEffects(beams=state.entities.beams){if(!beams)return;for(let i=0;i<beams.length;i++)recycleBeamEffect(beams[i]);beams.length=0;}
function releaseRunTransientEffects(){const entities=state.entities||{},particles=entities.particles||[],texts=entities.texts||[],shockwaves=entities.shockwaves||[],beams=entities.beams||[],projectiles=entities.projectiles||[],enemyProjectiles=entities.enemyProjectiles||[];for(let i=0;i<particles.length;i++)recycleParticleObject(particles[i]);for(let i=0;i<texts.length;i++)recycleTextEffect(texts[i]);for(let i=0;i<shockwaves.length;i++)recycleShockwaveEffect(shockwaves[i]);particles.length=0;texts.length=0;shockwaves.length=0;clearBeamEffects(beams);clearEnemyProjectiles(enemyProjectiles);const projectilePool=window.stackfallProjectilePool;if(Array.isArray(projectilePool)){for(let i=0;i<projectiles.length&&projectilePool.length<320;i++){const projectile=projectiles[i];if(!projectile)continue;projectile.hitIds?.clear?.();projectilePool.push(projectile);}}projectiles.length=0;}
function dealDamage(enemy,amount,opts={}){if(!enemy||enemy.dead)return;const critChance=clamp(.05+stat('crit')*.06,.05,1),crit=opts.canCrit!==false&&Math.random()<critChance,elite=enemy.type==='mini'||enemy.type==='boss';amount*=damageMult()*(elite?1+stat('eliteHunter')*.15:1)*(crit?1.8:1);const hpBefore=enemy.hp;enemy.hp-=amount;const inflicted=Math.max(0,Math.min(hpBefore,amount));if(typeof registerRunDamage==='function')registerRunDamage(inflicted,opts.source);if(elite&&typeof registerStackfallBossChainDamage==='function')registerStackfallBossChainDamage(enemy,inflicted,opts);enemy.hit=.09;const color=crit?COLORS.amber:(opts.color||COLORS.white),stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed(),showNumbers=GAME_SETTINGS.damageNumbers!==false&&(!stressed||crit||elite);if(showNumbers)addText(enemy.x,enemy.y-enemy.r,Math.round(amount),color,crit?18:12);if(crit||elite||(!stressed&&Math.random()<.20))spawnParticle(enemy.x,enemy.y,color,crit?6:elite?2:1,crit?150:85,crit?4:2.2);audio.hit(crit||elite,opts.source||'');if(enemy.hp<=0)killEnemy(enemy,opts);}
function killEnemy(enemy,opts={}){
  if(!enemy||enemy.dead)return;enemy.dead=true;let survivingTwin=null;if(enemy.twinGroup){for(const e of state.entities.enemies){if(e!==enemy&&!e.dead&&e.twinGroup===enemy.twinGroup){survivingTwin=e;break;}}}const lastTwin=!enemy.twinGroup||!survivingTwin;if(enemy.twinGroup&&lastTwin)enemy.noEliteReward=false;
  state.kills++;state.combo++;
  const durationMult=typeof chainDurationMultiplier==='function'?chainDurationMultiplier():(1+stat('chain')*.07)*(1+(state.nebulaExtras?.chain||0)*.20);
  state.comboTimer=2.15*durationMult;state.maxCombo=Math.max(state.maxCombo,state.combo);
  const authoredStageDeath=isAtrophos(enemy)||enemy.kind==='stage-boss'&&(enemy.stageProduction||['stage-01','stage-02'].includes(enemy.eventKind)),isBoss=enemy.type==='boss',isMini=enemy.type==='mini',isApex=enemy.kind==='apex',stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed(),burst=authoredStageDeath?0:isApex?64:isBoss?34:isMini?18:stressed?1:enemy.type==='tank'?7:4;spawnParticle(enemy.x,enemy.y,enemy.color,burst,isApex?380:isBoss?290:isMini?220:130,isApex?9:isBoss?7:isMini?5:3.5);if(!authoredStageDeath&&(isBoss||isMini||!stressed))shockwave(enemy.x,enemy.y,enemy.color,isApex?400:isBoss?260:isMini?160:enemy.type==='tank'?76:44,isApex?1.05:isBoss?.72:isMini?.50:.24,isApex?10:isBoss?6:isMini?4:2);
  if((isBoss||isMini)&&lastTwin&&!isAtrophos(enemy)){state.camera.shake+=isApex?25:isBoss?15:10;state.hitStop=isApex?.20:isBoss?.11:.07;state.flash=isApex?.32:isBoss?.20:.11;audio.resonance();}else if(!isBoss&&!isMini&&state.combo%40===0){state.hitStop=.018;}
  const gemCount=isApex?(stressed?10:18):isBoss?(stressed?7:12):isMini?(stressed?4:6):enemy.type==='tank'?2:1;for(let i=0;i<gemCount;i++)mergeExperienceGem(enemy.x+rand(-18,18),enemy.y+rand(-18,18),enemy.xp/gemCount,isApex?8:isBoss?7:isMini?6:4,rand(-75,75),rand(-75,75));compressExperience();
  if(isBoss){if(survivingTwin)state.bossActiveId=survivingTwin.id;else{state.bossActiveId=null;ui.bossBar.classList.add('hidden');if(isApex)state.apexActiveId=null;}}
  if(weaponCount('blade')>=6&&opts.source==='blade'&&state.combo%6===0)areaDamage(enemy.x,enemy.y,130,42,COLORS.cyan,'blade-burst');if(typeof handleAnyEnemyKill==='function')handleAnyEnemyKill(enemy,opts);if((isBoss||isMini)&&lastTwin&&typeof handleEliteDeath==='function')handleEliteDeath(enemy,opts);
  if(enemy.kind==='stage-boss'&&typeof window.handleStageBossDefeated==='function')window.handleStageBossDefeated(enemy);
}
function areaDamage(x,y,r,damage,color,source='area',options={}){shockwave(x,y,color,r,.34,4);if(options.shake===true)state.camera.shake+=3;forEachNearbyEnemyCandidate(x,y,r+130,e=>{if(!e.dead&&enemyCircleOverlap(e,x,y,r))dealDamage(e,damage,{color,source});});}
const STACKFALL_PROJECTILE_DESCRIPTOR_MARK=Symbol('stackfallProjectileDescriptor'),PROJECTILE_SPAWN_DESCRIPTOR_POOL=[],PROJECTILE_SPAWN_DESCRIPTOR_POOL_LIMIT=160;
function acquireProjectileSpawnDescriptor(x,y,vx,vy,r,life,maxRange,damage,color,source){const descriptor=PROJECTILE_SPAWN_DESCRIPTOR_POOL.pop()||Object.defineProperty({x:0,y:0,vx:0,vy:0,r:0,life:0,maxRange:0,damage:0,color:'#fff',pierce:0,source:''},STACKFALL_PROJECTILE_DESCRIPTOR_MARK,{value:true});descriptor.x=x;descriptor.y=y;descriptor.vx=vx;descriptor.vy=vy;descriptor.r=r;descriptor.life=life;descriptor.maxRange=maxRange;descriptor.damage=damage;descriptor.color=color;descriptor.pierce=0;descriptor.source=source;return descriptor;}
function recycleProjectileSpawnDescriptor(descriptor){if(descriptor?.[STACKFALL_PROJECTILE_DESCRIPTOR_MARK]===true&&PROJECTILE_SPAWN_DESCRIPTOR_POOL.length<PROJECTILE_SPAWN_DESCRIPTOR_POOL_LIMIT)PROJECTILE_SPAWN_DESCRIPTOR_POOL.push(descriptor);}
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
const STACKFALL_ENEMY_PROJECTILE_POOL_MARK=Symbol('stackfallEnemyProjectilePool'),ENEMY_PROJECTILE_OBJECT_POOL=[],ENEMY_PROJECTILE_OBJECT_POOL_LIMIT=448;
function acquireEnemyProjectileObject(){const projectile=ENEMY_PROJECTILE_OBJECT_POOL.pop()||Object.defineProperty({},STACKFALL_ENEMY_PROJECTILE_POOL_MARK,{value:true});for(const key in projectile)delete projectile[key];return projectile;}
function recycleEnemyProjectileObject(projectile){if(projectile?.[STACKFALL_ENEMY_PROJECTILE_POOL_MARK]===true&&ENEMY_PROJECTILE_OBJECT_POOL.length<ENEMY_PROJECTILE_OBJECT_POOL_LIMIT)ENEMY_PROJECTILE_OBJECT_POOL.push(projectile);}
function trimEnemyProjectiles(list,max){if(list.length<=max)return;const remove=list.length-max;for(let i=0;i<remove;i++)recycleEnemyProjectileObject(list[i]);list.splice(0,remove);}
function clearEnemyProjectiles(list=state.entities.enemyProjectiles){if(!list)return;for(let i=0;i<list.length;i++)recycleEnemyProjectileObject(list[i]);list.length=0;}
function spawnEnemyProjectile(x,y,a,speed,damage,color='#ff6ccf',r=6,life=5,visual=null){
  if(state.entities.enemyProjectiles.length>=entityCap('enemyProjectiles'))recycleEnemyProjectileObject(state.entities.enemyProjectiles.shift());
  const environment=state.stageEnvironmentTelegraphContext||null,envScale=environment?window.stackfallStageEnvironmentCombatScale?.(environment):null;if(envScale){speed*=envScale.speed;damage*=envScale.damage;}
  const heading=Number.isFinite(a)?a:0,velocity=Number.isFinite(speed)?speed:0,projectile=acquireEnemyProjectileObject();
  projectile.x=x;projectile.y=y;projectile.prevX=x;projectile.prevY=y;projectile.vx=Math.cos(heading)*velocity;projectile.vy=Math.sin(heading)*velocity;projectile.damage=damage;projectile.color=color;projectile.r=r;projectile.life=life;projectile.maxLife=life;projectile.heading=heading;projectile.phase=heading;projectile.age=0;projectile.visual=visual||inferEnemyProjectileVisual(color,velocity,r);projectile.visualSeed=Math.random()*TAU;
  state.entities.enemyProjectiles.push(projectile);return projectile;
}
function nearestEnemy(x,y,maxRange=Infinity,predicate=null){if(typeof performanceNearestEnemy==='function')return performanceNearestEnemy(x,y,maxRange,predicate);let best=null,bd=Number.isFinite(maxRange)?maxRange*maxRange:Infinity,candidates=state.entities.enemies;if(Number.isFinite(maxRange)&&typeof performanceNearbyEnemies==='function'){const nearby=performanceNearbyEnemies(x,y,maxRange);if(nearby.length)candidates=nearby;}for(const e of candidates){if(e.dead||(predicate&&!predicate(e)))continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e;}}return best;}