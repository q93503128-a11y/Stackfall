// Shared-HP multipart boss targeting. Body parts are target proxies only; the
// owning boss remains the sole combat entity and damage recipient.
const BOSS_PART_ID_PREFIX='boss-part:';
function defineBossBodyParts(enemy,definitions){
  if(!enemy||!Array.isArray(definitions))return[];
  enemy.bodyParts=definitions.map((definition,index)=>({
    id:`${BOSS_PART_ID_PREFIX}${enemy.id}:${String(definition.key||index)}`,
    key:String(definition.key||`part-${index+1}`),label:String(definition.label||definition.key||`PART ${index+1}`),
    dx:Number(definition.dx)||0,dy:Number(definition.dy)||0,r:Math.max(1,Number(definition.r)||24),
    active:definition.active!==false,visible:definition.visible!==false,shape:definition.shape||'circle',
    owner:enemy,x:enemy.x,y:enemy.y,dead:false,type:enemy.type,kind:enemy.kind,bodyPart:true
  }));
  refreshBossBodyParts(enemy);return enemy.bodyParts;
}

const OMEGA_PLATE_PHASES={1:[0,1,2,3,4,5,6,7],2:[0,1,2,4,5,6],3:[0,2,4,6],4:[]};
function omegaProxyPart(enemy,key,label){return{id:`${BOSS_PART_ID_PREFIX}${enemy.id}:${key}`,key,label,dx:0,dy:0,r:1,active:true,visible:true,omegaPlateProxy:true,owner:enemy,x:enemy.x,y:enemy.y,dead:false,type:enemy.type,kind:enemy.kind,bodyPart:true};}
function ensureOmegaPlateHitParts(enemy){
  if(!enemy||enemy.dead||(enemy.apexForm||enemy.eliteForm)!=='starforge')return;
  if(!enemy.omegaPlateHitPartsReady){
    const parts=Array.isArray(enemy.bodyParts)?enemy.bodyParts:[];
    parts.push(omegaProxyPart(enemy,'omega-core','OMEGA CORE'));
    for(let i=0;i<8;i++){parts.push(omegaProxyPart(enemy,`omega-plate-${i}-inner`,`OMEGA PLATE ${i+1} A`));parts.push(omegaProxyPart(enemy,`omega-plate-${i}-outer`,`OMEGA PLATE ${i+1} B`));}
    enemy.bodyParts=parts;enemy.omegaPlateHitPartsReady=true;
  }
  const phase=Math.max(1,Math.min(4,enemy.apexPhase||1)),active=new Set(OMEGA_PLATE_PHASES[phase]||OMEGA_PLATE_PHASES[1]),t=enemy.phase||0;
  for(const part of enemy.bodyParts){
    if(!part.omegaPlateProxy)continue;
    if(part.key==='omega-core'){part.dx=0;part.dy=0;part.r=Math.max(8,enemy.r*.58);part.active=true;part.visible=true;continue;}
    const match=/^omega-plate-(\d+)-(inner|outer)$/.exec(part.key);if(!match)continue;
    const index=Number(match[1]),outer=match[2]==='outer',long=index%2===0,a=index/8*TAU+t*.025;
    const radial=enemy.r*(outer?(long?1.67:1.37):.86),radius=enemy.r*(outer?.35:.36);
    part.dx=Math.cos(a)*radial;part.dy=Math.sin(a)*radial;part.r=Math.max(7,radius);part.active=active.has(index);part.visible=part.active;
  }
}
function refreshBossBodyParts(enemy){if(!enemy)return[];ensureOmegaPlateHitParts(enemy);if(!enemy.bodyParts)return[];for(const part of enemy.bodyParts){part.x=enemy.x+part.dx;part.y=enemy.y+part.dy;part.active=part.owner===enemy&&!enemy.dead&&part.active!==false;part.dead=!part.active;part.hp=enemy.hp;part.maxHp=enemy.maxHp;}return enemy.bodyParts;}
function bossPartOwner(target){return target?.bodyPart===true?target.owner:target;}
function activeBossBodyParts(enemy){return refreshBossBodyParts(enemy).filter(part=>part.active&&part.visible);}
function nearestBossBodyPart(enemy,x,y,maxRange=Infinity){let best=null,bestDistance=Number.isFinite(maxRange)?maxRange*maxRange:Infinity;for(const part of activeBossBodyParts(enemy)){const d=(part.x-x)**2+(part.y-y)**2;if(d<=bestDistance){bestDistance=d;best=part;}}return best;}
function bossPartAt(enemy,x,y,r=0){for(const part of activeBossBodyParts(enemy))if((part.x-x)**2+(part.y-y)**2<=(part.r+r)**2)return part;return null;}
function multipartBossDiagnostics(){const enemy=state.entities.enemies.find(e=>!e.dead&&e.id===state.apexActiveId);return{active:!!enemy,sharedHp:enemy?.hp??null,maxHp:enemy?.maxHp??null,bossId:enemy?.id??null,parts:enemy?activeBossBodyParts(enemy).map(part=>({id:part.id,key:part.key,x:part.x,y:part.y,r:part.r,active:part.active,visible:part.visible})):[],targetable:!!enemy&&!!nearestEnemy(player.x,player.y,Infinity,e=>e.id===enemy.id)};}
window.stackfallBossPartDiagnostics=multipartBossDiagnostics;

// Preserve each existing attacker’s cadence/identity while making aim point
// selection body-part aware. The proxy ID resolves back to the shared owner.
const bossPartTargetIndex=new Map();
function registerBossPartTargets(){bossPartTargetIndex.clear();for(const enemy of state.entities.enemies){ensureOmegaPlateHitParts(enemy);if(!enemy.dead&&enemy.bodyParts)for(const part of activeBossBodyParts(enemy))bossPartTargetIndex.set(part.id,part);}}
function bossPartById(id){const indexed=bossPartTargetIndex.get(id);if(indexed?.active)return indexed;for(const enemy of state.entities.enemies){ensureOmegaPlateHitParts(enemy);if(!enemy.dead&&enemy.bodyParts)for(const part of activeBossBodyParts(enemy))if(part.id===id)return part;}return null;}
window.stackfallBossPartById=bossPartById;

const baseNearestEnemyWithParts=nearestEnemy;
nearestEnemy=function nearestEnemyIncludingBossParts(x,y,maxRange=Infinity,predicate=null){
  for(const enemy of state.entities.enemies)ensureOmegaPlateHitParts(enemy);
  const ordinary=baseNearestEnemyWithParts(x,y,maxRange,e=>!e.bodyParts&&(!predicate||predicate(e)));
  let best=ordinary,bestD=ordinary?(ordinary.x-x)**2+(ordinary.y-y)**2:(Number.isFinite(maxRange)?maxRange*maxRange:Infinity);
  for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||!enemy.bodyParts?.length||(predicate&&!predicate(enemy)))continue;const part=nearestBossBodyPart(enemy,x,y,Math.sqrt(bestD));if(!part)continue;const d=(part.x-x)**2+(part.y-y)**2;if(d<=bestD){best=part;bestD=d;}}
  return best;
};
const baseNearestEnemiesWithParts=nearestEnemies;
nearestEnemies=function nearestEnemyListIncludingBossParts(x,y,count,excluded=null,maxRange=Infinity,resultOut=null){
  for(const enemy of state.entities.enemies)ensureOmegaPlateHitParts(enemy);
  const output=baseNearestEnemiesWithParts(x,y,count,excluded,maxRange,resultOut).filter(target=>!target?.bodyParts?.length);
  const maxDistance=Number.isFinite(maxRange)?maxRange*maxRange:Infinity;
  for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||!enemy.bodyParts?.length||excluded?.has(enemy.id))continue;const part=nearestBossBodyPart(enemy,x,y,maxRange);if(part&&(part.x-x)**2+(part.y-y)**2<=maxDistance)output.push(part);}
  output.sort((a,b)=>((a.x-x)**2+(a.y-y)**2)-((b.x-x)**2+(b.y-y)**2));output.length=Math.min(Math.max(0,count|0),output.length);if(Array.isArray(resultOut)){resultOut.length=0;resultOut.push(...output);return resultOut;}return output;
};
if(typeof window.getEnemyById==='function'){const baseGetEnemyById=window.getEnemyById;window.getEnemyById=function getBossPartOrEnemyById(id){return bossPartById(id)||baseGetEnemyById(id);};}
if(typeof enemyById==='function'){const baseEnemyById=enemyById;enemyById=function getBossPartOrEnemy(id){return bossPartById(id)||baseEnemyById(id);};}
const baseGuidedMissileUpdate=updateGuidedMissiles;
updateGuidedMissiles=function handoffInactiveBossPartMissiles(dt){for(const missile of state.entities.guidedMissiles){if(!missile||!String(missile.targetId||'').startsWith(BOSS_PART_ID_PREFIX)||bossPartById(missile.targetId))continue;const next=nearestEnemy(missile.x,missile.y,weaponRange('missile'));if(next){missile.targetId=next.id;missile.reacquired=true;}}return baseGuidedMissileUpdate(dt);};
const baseDealDamageWithParts=dealDamage;
dealDamage=function routeBossPartDamageToSharedPool(target,amount,options={}){return baseDealDamageWithParts(bossPartOwner(target),amount,options);};
const baseEnemyCircleOverlapWithParts=enemyCircleOverlap;
enemyCircleOverlap=function multipartEnemyCircleOverlap(enemy,x,y,r=0){
  if(enemy?.bodyPart)return enemy.active&&Math.hypot(enemy.x-x,enemy.y-y)<=enemy.r+r;
  if(enemy?.bodyParts?.length){refreshBossBodyParts(enemy);for(const part of enemy.bodyParts)if(part.active&&(part.x-x)**2+(part.y-y)**2<=(part.r+r)**2)return true;return false;}
  return baseEnemyCircleOverlapWithParts(enemy,x,y,r);
};
const baseEnemySegmentOverlapWithParts=enemySegmentOverlap;
enemySegmentOverlap=function multipartEnemySegmentOverlap(enemy,x1,y1,x2,y2,r=0){
  if(enemy?.bodyPart)return enemy.active&&segmentDistance(enemy.x,enemy.y,x1,y1,x2,y2)<=enemy.r+r;
  if(enemy?.bodyParts?.length){refreshBossBodyParts(enemy);for(const part of enemy.bodyParts)if(part.active&&segmentDistance(part.x,part.y,x1,y1,x2,y2)<=part.r+r)return true;return false;}
  return baseEnemySegmentOverlapWithParts(enemy,x1,y1,x2,y2,r);
};
const baseForEachNearbyWithParts=forEachNearbyEnemyCandidate;
forEachNearbyEnemyCandidate=function includeMultipartBossBounds(x,y,range,visit){
  const visited=new Set();baseForEachNearbyWithParts(x,y,range,enemy=>{if(visited.has(enemy.id))return;visited.add(enemy.id);visit(enemy);});
  for(const enemy of state.entities.enemies){ensureOmegaPlateHitParts(enemy);if(!enemy?.bodyParts?.length||enemy.dead||visited.has(enemy.id))continue;refreshBossBodyParts(enemy);if(enemy.bodyParts.some(part=>part.active&&Math.hypot(part.x-x,part.y-y)<=range+part.r)){visited.add(enemy.id);visit(enemy);}}
};

const baseUpdateApexMapPlayer=window.updateMapEventPlayer;
if(typeof baseUpdateApexMapPlayer==='function')window.updateMapEventPlayer=function updateMapEventPlayerWithoutApexCage(dt){const arena=state.apexArena;state.apexArena=null;try{return baseUpdateApexMapPlayer(dt);}finally{state.apexArena=arena;}};
clampApexToArena=function apexWorldHasNoArtificialBoundary(){};
drawApexArena=function apexArenaHasNoPlayerCage(){return;};

window.stackfallDeveloperTest?.enabled&&Object.assign(window.stackfallDeveloperTest,{
  defineMultipartFixture(parts=[{key:'left-arm',label:'PART A',dx:-150,dy:-25,r:34},{key:'torso',label:'PART B',dx:0,dy:0,r:48},{key:'right-arm',label:'PART C',dx:150,dy:25,r:34}]){const enemy=state.entities.enemies.find(e=>!e.dead&&e.id===state.apexActiveId);if(!enemy)return{ok:false,reason:'no-active-apex'};defineBossBodyParts(enemy,parts);registerBossPartTargets();return{ok:true,diagnostics:multipartBossDiagnostics()};},
  setBossPartActive(key,active){const enemy=state.entities.enemies.find(e=>!e.dead&&e.id===state.apexActiveId),part=enemy?.bodyParts?.find(p=>p.key===key);if(!part)return false;part.active=active===true;registerBossPartTargets();return part.active;}
});
if(window.stackfallDeveloperTest?.enabled){const panel=document.querySelector('#stackfallDevPanel');if(panel&&!panel.querySelector('#devApexFoundation')){const box=document.createElement('section');box.id='devApexFoundation';box.className='dev-mode-section';box.innerHTML='<header><strong>APEX FOUNDATION</strong><small>world / clock / body target</small></header><div class="dev-grid"><button id="devApexFoundationRefresh" type="button">초월체 상태 읽기</button><button id="devApexPartsFixture" type="button">DEBUG 부위 fixture</button></div><pre id="devApexFoundationReadout" style="white-space:pre-wrap;font-size:10px;max-height:130px;overflow:auto"></pre>';panel.appendChild(box);const output=box.querySelector('pre');box.querySelector('#devApexFoundationRefresh').onclick=()=>{output.textContent=JSON.stringify({clock:window.stackfallApexClockDiagnostics?.(),boss:window.stackfallBossPartDiagnostics?.()},null,2);};box.querySelector('#devApexPartsFixture').onclick=()=>{const result=window.stackfallDeveloperTest.defineMultipartFixture();output.textContent=JSON.stringify(result,null,2);};}}

// Disable the legacy renderer-wide breathing scale. Individual enemies/bosses may still animate
// their own internal parts, but the entire entity is no longer uniformly scaled by ±5%.
const baseDrawBossParts=typeof drawEnemies==='function'?drawEnemies:null;
if(baseDrawBossParts)drawEnemies=function drawEnemiesWithoutSharedScalePulse(){
  const staged=[];
  for(const enemy of state.entities.enemies){const own=Object.prototype.hasOwnProperty.call(enemy,'stageProduction');staged.push([enemy,own,enemy.stageProduction]);enemy.stageProduction=true;}
  try{baseDrawBossParts();}finally{for(const [enemy,own,value] of staged){if(own)enemy.stageProduction=value;else delete enemy.stageProduction;}}
  if(!window.stackfallDeveloperTest?.enabled)return;
  for(const enemy of state.entities.enemies){if(enemy.dead||!enemy.bodyParts)continue;for(const part of activeBossBodyParts(enemy)){if(part.omegaPlateProxy||part.lcNodeProxy)continue;const p=worldToScreen(part.x,part.y);ctx.save();ctx.strokeStyle='#ff365f';ctx.fillStyle='#ff365f';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(p.x,p.y,part.r,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.font='900 10px monospace';ctx.textAlign='center';ctx.fillText(`DEBUG ${part.label}`,p.x,p.y-part.r-7);ctx.restore();}}
};
window.stackfallSharedEnemyScalePulseDisabled='v1';
