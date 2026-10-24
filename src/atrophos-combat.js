// Atrophos owns one enemy entity: its visible wrist projection. The colossus is
// presentation only. Keeping this identity stable lets every weapon share the
// existing HP, spatial index, hitIds and chain-exclusion semantics.
const ATROPHOS_WRIST_OUTLINE=[[-39,-23],[-23,-34],[-8,-22],[-12,-5],[-8,24],[-29,32],[-40,10]];
const ATROPHOS_WRIST_INNER=[[-8,-23],[8,-23],[12,24],[0,29],[-12,24]];
function isAtrophos(e){return!!(e&&e.kind==='apex'&&(e.apexForm||e.eliteForm)==='chronophage');}
function atrophosEvent(e,type,detail=''){
  const a=e.atrophos;if(!a)return;a.events.push({at:+a.clock.toFixed(3),type,detail});if(a.events.length>64)a.events.shift();
}
function initializeAtrophos(e){
  if(e.atrophos)return e.atrophos;
  e.r=46;e.contactR=0;e.speed=0;e.controlImmune=true;e.knockbackImmune=true;e.color='#9faed5';
  const side=e.id%2?1:-1;e.x=player.x+side*(compactDevice()?100:136);e.y=player.y+36;
  e.stageBodyShapes=[{kind:'polygon',points:ATROPHOS_WRIST_OUTLINE.map(()=>({x:0,y:0}))},{kind:'polygon',points:ATROPHOS_WRIST_OUTLINE.map(()=>({x:0,y:0}))},{kind:'polygon',points:ATROPHOS_WRIST_INNER.map(()=>({x:0,y:0}))}];
  e.atrophos={clock:0,cycle:0,nextCycle:.8,phase:1,queue:[],threats:[],events:[],history:[],sample:0,serial:0,upper:0,waist:0,arm:0,upperStart:-100,waistStart:-100,waistMode:'rest',poseUntil:0,poseKind:'rest',moveX:e.x,moveY:e.y,moving:false,opening:1,collisions:0,damageTaken:0};
  updateAtrophosWristShapes(e);atrophosEvent(e,'projection-open',String(e.id));return e.atrophos;
}
function updateAtrophosWristShapes(e){
  for(let side=0;side<2;side++)for(let i=0;i<ATROPHOS_WRIST_OUTLINE.length;i++){const p=e.stageBodyShapes[side].points[i],v=ATROPHOS_WRIST_OUTLINE[i];p.x=e.x+(side?-v[0]:v[0]);p.y=e.y+v[1];}
  for(let i=0;i<ATROPHOS_WRIST_INNER.length;i++){const p=e.stageBodyShapes[2].points[i],v=ATROPHOS_WRIST_INNER[i];p.x=e.x+v[0];p.y=e.y+v[1];}
}
function atrophosPending(a){let count=0;for(const t of a.threats)if(t.age<t.warning+t.active)count++;return count;}
function atrophosQueue(e,kind,delay=0,hold=1.35,history=false){const a=initializeAtrophos(e);if(a.queue.length>=8)return;a.queue.push({kind,at:a.clock+delay,hold,history});}
function atrophosDelayedCut(e,d,arena,phase){
  const a=initializeAtrophos(e);atrophosQueue(e,'cut',0,phase===4?2.8:1.45);a.damageOverride=d;
}
function atrophosSample(a,seconds){const target=a.clock-seconds;for(let i=a.history.length-1;i>=0;i--)if(a.history[i].t<=target)return a.history[i];return a.history[0]||{x:player.x,y:player.y};}
function atrophosStart(e,cmd){
  const a=e.atrophos,past=cmd.history?atrophosSample(a,.85):player;
  const vx=player.moveVX||0,vy=player.moveVY||0,speed=Math.hypot(vx,vy),angle=speed>35?Math.atan2(vy,vx):a.cycle*.73+.4;
  const cut=cmd.kind==='cut'||cmd.kind==='upper',lead=cut&&speed>35?Math.min(130,speed*.4):0;
  let x=past.x+Math.cos(angle)*lead,y=past.y+Math.sin(angle)*lead;
  // Co-located records merge instead of becoming a hidden second hit.
  if(!cut&&a.threats.some(t=>t.age<t.warning+t.active&&t.kind==='record'&&Math.hypot(t.x-x,t.y-y)<75)){atrophosEvent(e,'record-merged');return;}
  const t={id:++a.serial,kind:cut?'cut':'record',cue:cmd.kind,x,y,angle:angle+(cmd.kind==='upper'?.55:0),length:cut?(compactDevice()?560:620):0,r:cmd.kind==='waist'?66:58,width:22,age:0,warning:cmd.hold,active:.30,recovery:.55,hit:false,fired:false,damage:Math.max(7,(a.damageOverride||e.damage*.38)),points:null};
  t.points=[];
  if(cut){const c=Math.cos(t.angle),s=Math.sin(t.angle),h=t.length*.5,w=t.width*.5;for(const [px,py] of[[-h,0],[-h*.5,-w],[h*.5,-w],[h,0],[h*.5,w],[-h*.5,w]])t.points.push({x:x+px*c-py*s,y:y+px*s+py*c});}
  else for(let i=0;i<8;i++){const ang=i/8*TAU;t.points.push({x:x+Math.cos(ang)*t.r,y:y+Math.sin(ang)*t.r});}
  t.hitShape={kind:'polygon',points:t.points};
  a.threats.push(t);a.poseKind=cmd.kind;a.poseUntil=a.clock+.72;
  if(cmd.kind==='waist'||cmd.kind==='record'){a.waist=-1;a.waistStart=a.clock;a.waistMode=cmd.kind;}else{a.upper=1;a.arm=1;a.upperStart=a.clock;}
  atrophosEvent(e,'start',`${cmd.kind}:${t.id}`);audio.playChannel?.('combat',92,.12,'triangle',.014,-18);
}
function atrophosCycle(e,phase){
  const a=e.atrophos;a.cycle++;a.damageOverride=0;
  if(phase===1)atrophosQueue(e,'cut');
  else if(phase===2){if(a.cycle%2)atrophosQueue(e,'cut');else{atrophosQueue(e,'record',0,1.45,true);atrophosQueue(e,'record',.55,1.65);}}
  else if(phase===3){const step=a.cycle%3;if(step===1)atrophosQueue(e,'cut');else if(step===2){atrophosQueue(e,'record',0,1.45,true);atrophosQueue(e,'record',.55,1.65);}else{atrophosQueue(e,'upper',0,1.35);atrophosQueue(e,'waist',.7,1.6);}}
  else{
    // A starts first, B arrives/ends first. Later records and the two body
    // beats wait for a free memory slot; no unbounded overlapping carpet.
    atrophosQueue(e,'cut',0,2.8);atrophosQueue(e,'record',.8,1.25,true);atrophosQueue(e,'record',2.5,1.4);
    atrophosQueue(e,'upper',4.8,1.35);atrophosQueue(e,'waist',5.5,1.65);
  }
  a.nextCycle=a.clock+(phase===4?9.2:5.8);
}
function updateAtrophos(e,dt){
  const a=initializeAtrophos(e);a.clock+=dt;e.apexElapsed=(e.apexElapsed||0)+dt;e.hit=Math.max(0,(e.hit||0)-dt);e.timeLock=0;
  const h=e.hp/Math.max(1,e.maxHp),phase=Math.max(h<.25?4:h<.5?3:h<.75?2:1,e.apexElapsed>=240?4:e.apexElapsed>=180?3:e.apexElapsed>=105?2:1);
  e.apexPhase=phase;e.apexPhaseEntered=phase;
  if(phase!==a.phase){a.phase=phase;a.queue.length=0;for(const t of a.threats){t.age=Math.max(t.age,t.warning+t.active);t.fired=true;}a.nextCycle=a.clock+1.3;atrophosEvent(e,'phase',String(phase));showBossNotice(bossName('chronophage')+' · PHASE '+phase,'APEX THREAT');}
  a.sample-=dt;if(a.sample<=0){a.sample=.12;a.history.push({x:player.x,y:player.y,t:a.clock});if(a.history.length>64)a.history.shift();}
  if(a.clock>=a.nextCycle&&!a.queue.length&&!atrophosPending(a)){atrophosCycle(e,phase);}
  for(let i=0;i<a.queue.length;){const cmd=a.queue[i];if(cmd.at>a.clock||atrophosPending(a)>=2){i++;continue;}a.queue.splice(i,1);atrophosStart(e,cmd);}
  for(const t of a.threats){
    t.age+=dt;if(t.age>=t.warning&&!t.fired){t.fired=true;atrophosEvent(e,'active',`${t.cue}:${t.id}`);audio.enemyImpact?.(.42);}
    if(t.age>=t.warning&&t.age<t.warning+t.active&&!t.hit){
      const hit=stageShapeCircleHit(t.hitShape,player.x,player.y,player.r);
      if(hit&&player.invuln<=0){t.hit=true;a.collisions++;atrophosEvent(e,'hit',`${t.cue}:${t.id}`);hurtPlayer(t.damage,t);}
    }
    if(t.age>=t.warning+t.active&&!t.ended){t.ended=true;atrophosEvent(e,'end',`${t.cue}:${t.id}`);}
  }
  compactInPlace(a.threats,t=>t.age<t.warning+t.active+t.recovery);
  // Wrist moves continuously, never swaps identity. Only recovery relocates it,
  // close enough for orbit/mines; the giant never enters the physics plane.
  if(!atrophosPending(a)&&!a.queue.length){
    const distance=Math.hypot(e.x-player.x,e.y-player.y);
    if(!a.moving&&(distance>175||a.clock>a.nextCycle-1.7&&a.relocatedCycle!==a.cycle)){const side=a.cycle%2?1:-1;a.moveX=player.x+side*(compactDevice()?88:105);a.moveY=player.y+32;a.moving=true;a.relocatedCycle=a.cycle;atrophosEvent(e,'projection-move',String(e.id));}
    if(a.moving){const dx=a.moveX-e.x,dy=a.moveY-e.y,len=Math.hypot(dx,dy),step=Math.min(len,120*dt);if(len>1){e.x+=dx/len*step;e.y+=dy/len*step;}else a.moving=false;}
  }else a.moving=false;
  // Keep the attackable projection within the visible playable area, including
  // when the player moves the camera. The same entity and hit region move.
  const horizontal=Math.max(82,vw*.5-58),vertical=Math.max(82,vh*.5-205);
  e.x=clamp(e.x,player.x-horizontal,player.x+horizontal);e.y=clamp(e.y,player.y-vertical,player.y+vertical);
  updateAtrophosWristShapes(e);
  if(a.clock>a.poseUntil){a.arm=lerp(a.arm,0,Math.min(1,dt*3));a.upper=lerp(a.upper,0,Math.min(1,dt*2));a.waist=lerp(a.waist,0,Math.min(1,dt*1.1));}
}
window.stackfallAtrophosDiagnostics=()=>{
  const e=state.entities.enemies.find(e=>!e.dead&&isAtrophos(e)),a=e?.atrophos;
  return a?{id:e.id,hp:e.hp,maxHp:e.maxHp,phase:e.apexPhase,clock:a.clock,projection:{x:e.x,y:e.y,screenX:e.x-player.x+vw/2,screenY:e.y-player.y+vh/2,moving:a.moving},pending:atrophosPending(a),collisions:a.collisions,pose:a.poseKind,threats:a.threats.map(t=>({id:t.id,kind:t.cue,x:t.x,y:t.y,age:t.age,warning:t.warning,active:t.active,hit:t.hit})),events:a.events.slice(-24)}:null;
};
