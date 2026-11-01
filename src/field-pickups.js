// Field pickup ownership. These are physical one-shot world objects, not passives or XP gems.
const FIELD_PICKUP_TYPES=Object.freeze({
  suctionMagnet:Object.freeze({kind:'suctionMagnet',name:'흡입 자석',r:17,color:'#ffcc5c'})
});
const SUCTION_MAGNET_MINI_DROP_CHANCE=.50;
function fieldPickupRuntime(){
  let runtime=state.fieldPickupRuntime;
  if(!runtime||runtime.runSerial!==state.runSerial)runtime=state.fieldPickupRuntime={runSerial:state.runSerial,dropped:0,collected:0,lastPulled:0,lastPulledValue:0};
  return runtime;
}
function spawnFieldPickup(kind,x,y,options={}){
  const def=FIELD_PICKUP_TYPES[kind];if(!def||!Number.isFinite(x)||!Number.isFinite(y))return null;
  const pickup={id:state.nextId++,kind:def.kind,x,y,r:def.r,active:true,pulse:Math.random()*TAU,source:String(options.source||'runtime')};state.entities.fieldPickups.push(pickup);return pickup;
}
function activateSuctionMagnet(){
  let count=0,value=0;for(const gem of state.entities.gems){if(!experienceGemActive(gem))continue;gem.forceCollect=true;count++;value+=Math.max(0,Number(gem.value)||0);}
  const runtime=fieldPickupRuntime();runtime.collected++;runtime.lastPulled=count;runtime.lastPulledValue=value;return{count,value};
}
function collectFieldPickup(pickup){
  if(!pickup||pickup.active===false)return false;
  if(pickup.kind==='suctionMagnet')activateSuctionMagnet();else return false;
  pickup.active=false;audio.pickup();shockwave(pickup.x,pickup.y,'#ffcc5c',88,.34,2.4);spawnParticle(pickup.x,pickup.y,'#fff0a8',9,135,3);return true;
}
function updateFieldPickups(dt){
  const pickups=state.entities.fieldPickups;if(!Array.isArray(pickups)||!pickups.length)return;
  const collectPad=player.r+6;for(const pickup of pickups){if(!pickup||pickup.active===false)continue;if(!Number.isFinite(pickup.x)||!Number.isFinite(pickup.y)){pickup.active=false;continue;}pickup.pulse=(Number(pickup.pulse)||0)+dt*3.2;const rr=collectPad+(Number(pickup.r)||12),dx=player.x-pickup.x,dy=player.y-pickup.y;if(dx*dx+dy*dy<=rr*rr)collectFieldPickup(pickup);}
  compactInPlace(pickups,p=>!!(p&&p.active!==false));
}
function maybeDropFieldPickup(enemy){
  if(!enemy||enemy.dead!==true)return null;
  const isMini=enemy.type==='mini',isRegularBoss=enemy.type==='boss'&&enemy.kind==='boss'&&!enemy.eventKind;
  if(!isMini&&!isRegularBoss)return null;
  if(isMini&&Math.random()>=SUCTION_MAGNET_MINI_DROP_CHANCE)return null;
  const pickups=state.entities.fieldPickups;if(pickups.some(p=>p?.active!==false&&p.kind==='suctionMagnet'))return null;
  const pickup=spawnFieldPickup('suctionMagnet',enemy.x,enemy.y,{source:isMini?'mini-boss-drop':'boss-drop'});if(pickup)fieldPickupRuntime().dropped++;return pickup;
}
function drawFieldPickups(){
  const pickups=state.entities.fieldPickups||[],now=performance.now()*.004;for(const pickup of pickups){if(!pickup||pickup.active===false)continue;const sx=pickup.x-player.x+vw/2,sy=pickup.y-player.y+vh/2;if(sx<-48||sx>vw+48||sy<-48||sy>vh+48)continue;const def=FIELD_PICKUP_TYPES[pickup.kind];if(!def)continue;const r=def.r*(.96+.06*Math.sin(now+(pickup.pulse||0))),bob=Math.sin(now*.85+(pickup.pulse||0))*3;ctx.save();ctx.translate(Math.round(sx),Math.round(sy+bob));ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=def.color;ctx.shadowBlur=GAME_SETTINGS.sparkles===false?0:13;ctx.strokeStyle=def.color;ctx.lineWidth=Math.max(5,r*.42);ctx.beginPath();ctx.moveTo(-r*.68,-r*.62);ctx.lineTo(-r*.68,0);ctx.quadraticCurveTo(-r*.68,r*.72,0,r*.72);ctx.quadraticCurveTo(r*.68,r*.72,r*.68,0);ctx.lineTo(r*.68,-r*.62);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#f5f7ff';ctx.lineWidth=Math.max(3,r*.27);ctx.beginPath();ctx.moveTo(-r*.68,-r*.70);ctx.lineTo(-r*.68,-r*.43);ctx.moveTo(r*.68,-r*.70);ctx.lineTo(r*.68,-r*.43);ctx.stroke();ctx.restore();}
}
window.stackfallSpawnFieldPickup=spawnFieldPickup;
window.stackfallCollectSuctionMagnet=activateSuctionMagnet;
window.stackfallFieldPickupDiagnostics=()=>{const runtime=fieldPickupRuntime(),pickups=state.entities.fieldPickups||[],forced=state.entities.gems.filter(g=>experienceGemActive(g)&&g.forceCollect===true);return{runtime:{...runtime},active:pickups.filter(p=>p?.active!==false).map(p=>({id:p.id,kind:p.kind,x:p.x,y:p.y})),forcedGemCount:forced.length,forcedXp:forced.reduce((sum,g)=>sum+Math.max(0,Number(g.value)||0),0)};};
