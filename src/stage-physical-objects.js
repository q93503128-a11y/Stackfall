// Canonical geometry for authored stage bodies and moving world hazards.
// Rendering, weapon hits and player contact use the same simulation-owned shapes.
const STAGE_PHYSICAL_LIMIT=6;
function stageShapeCircleHit(s,x,y,r=0){
  if(s.kind==='circle')return Math.hypot(x-s.x,y-s.y)<=s.r+r;
  const c=Math.cos(s.a||0),n=Math.sin(s.a||0),dx=x-s.x,dy=y-s.y;
  const qx=Math.max(0,Math.abs(dx*c+dy*n)-s.hw),qy=Math.max(0,Math.abs(-dx*n+dy*c)-s.hh);
  return qx*qx+qy*qy<=r*r;
}
function stageShapeSegmentHit(s,x1,y1,x2,y2,r=0){
  if(s.kind==='circle')return segmentDistance(s.x,s.y,x1,y1,x2,y2)<=s.r+r;
  const c=Math.cos(s.a||0),n=Math.sin(s.a||0),ax=(x1-s.x)*c+(y1-s.y)*n,ay=-(x1-s.x)*n+(y1-s.y)*c,bx=(x2-s.x)*c+(y2-s.y)*n,by=-(x2-s.x)*n+(y2-s.y)*c;
  let lo=0,hi=1;const dx=bx-ax,dy=by-ay;
  for(const [p,d,h]of[[ax,dx,s.hw+r],[ay,dy,s.hh+r]]){if(Math.abs(d)<1e-8){if(Math.abs(p)>h)return false;}else{let t1=(-h-p)/d,t2=(h-p)/d;if(t1>t2){const q=t1;t1=t2;t2=q;}lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return false;}}
  return true;
}
function enemyCircleOverlap(e,x,y,r){
  if(e.stageBodyShapes){const shapes=window.stackfallStageBodyShapes?.(e)||e.stageBodyShapes;return shapes.some(s=>stageShapeCircleHit(s,x,y,r));}
  return(e.x-x)**2+(e.y-y)**2<(e.r+r)**2;
}
function enemySegmentOverlap(e,x1,y1,x2,y2,r){
  if(e.stageBodyShapes){const shapes=window.stackfallStageBodyShapes?.(e)||e.stageBodyShapes;return shapes.some(s=>stageShapeSegmentHit(s,x1,y1,x2,y2,r));}
  return segmentDistance(e.x,e.y,x1,y1,x2,y2)<e.r+r;
}
function stagePhysicalObjects(){return state.stagePhysicalObjects||(state.stagePhysicalObjects=[]);}
function addStagePhysicalObject(object){const list=stagePhysicalObjects();if(list.length>=STAGE_PHYSICAL_LIMIT)return null;object.age=0;object.hit=false;object.stageId=state.stageRun?.stage?.id;list.push(object);return object;}
function clearStagePhysicalObjects(){stagePhysicalObjects().length=0;}
function stagePhysicalPushPlayer(s,previousX,previousY){
  if(!stageShapeCircleHit(s,player.x,player.y,player.r))return;
  const c=Math.cos(s.a||0),n=Math.sin(s.a||0),dx=player.x-s.x,dy=player.y-s.y,lx=dx*c+dy*n,ly=-dx*n+dy*c;
  const ex=s.hw+player.r+.5,ey=s.hh+player.r+.5;
  const px=(previousX-s.x)*c+(previousY-s.y)*n,py=-(previousX-s.x)*n+(previousY-s.y)*c;
  let rx=lx,ry=ly;
  if(Math.abs(px)>=s.hw&&Math.abs(px)>Math.abs(py)*s.hw/Math.max(1,s.hh))rx=Math.sign(px||lx||1)*ex;
  else if(Math.abs(py)>=s.hh)ry=Math.sign(py||ly||1)*ey;
  else if(ex-Math.abs(lx)<ey-Math.abs(ly))rx=Math.sign(lx||1)*ex;else ry=Math.sign(ly||1)*ey;
  player.x=s.x+rx*c-ry*n;player.y=s.y+rx*n+ry*c;
}
function updateStagePhysicalObjects(dt){
  if(state.mode!=='playing'||!state.stageRun)return;
  const list=stagePhysicalObjects(),px=Number.isFinite(player.stagePreviousX)?player.stagePreviousX:player.x,py=Number.isFinite(player.stagePreviousY)?player.stagePreviousY:player.y;
  for(const o of list){if(o.stageId!==state.stageRun.stage.id){o.dead=true;continue;}o.age+=dt;
    if(o.ownerId&&!state.entities.enemies.some(e=>e.id===o.ownerId&&!e.dead)){o.dead=true;continue;}
    o.active=false;o.solid=false;const prevX=o.x,prevY=o.y,prevA=o.a||0;
    if(o.kind==='falling-deck'||o.kind==='salvage'){
      const t=clamp((o.age-o.warn)/o.travel,0,1);o.x=lerp(o.fromX,o.toX,t);o.y=lerp(o.fromY,o.toY,t);o.height=(1-t)*(o.kind==='salvage'?150:80);o.a=o.angle+(1-t)*.35;
      if(o.age>=o.warn+o.travel){o.solid=true;if(!o.hit){o.hit=true;stagePhysicalImpact(o);if(stageShapeCircleHit(o,player.x,player.y,player.r)&&player.invuln<=0)hurtPlayer(o.damage,'stage-structure-impact');}}
    }else if(o.kind==='bulkhead'){
      const close=clamp((o.age-o.warn)/o.travel,0,1),open=clamp((o.age-o.warn-o.travel-o.hold)/.45,0,1),t=close*(1-open);o.x=lerp(o.fromX,o.toX,t);o.y=o.toY;o.a=o.angle;o.active=o.age>=o.warn&&close<1;o.solid=o.age>=o.warn&&open<1;
      if(close===1&&!o.hit){o.hit=true;stagePhysicalImpact(o);}
    }else if(o.kind==='ion-front'){const t=clamp((o.age-o.warn)/o.travel,0,1);o.x=lerp(o.fromX,o.toX,t);o.y=lerp(o.fromY,o.toY,t);o.a=o.angle;o.active=o.age>=o.warn&&t<1;
    }else if(o.kind==='girder'){
      const t=clamp((o.age-o.warn)/o.travel,0,1),a=o.angle+t*o.sweep;o.a=a;o.x=o.pivotX+Math.cos(a)*o.length*.5;o.y=o.pivotY+Math.sin(a)*o.length*.5;o.active=o.age>=o.warn&&t<1;
      if(t===1&&!o.hit){o.hit=true;stagePhysicalImpact(o);}
    }
    if(o.active&&player.invuln<=0){
      // Relative swept motion, plus intermediate rotating shapes for the heavy girder.
      let hit=stageShapeSegmentHit(o,px+(o.x-prevX),py+(o.y-prevY),player.x,player.y,player.r);
      if(o.kind==='girder'){for(let i=0;!hit&&i<3;i++){const a=lerp(prevA,o.a,i/2),s={...o,a,x:o.pivotX+Math.cos(a)*o.length*.5,y:o.pivotY+Math.sin(a)*o.length*.5};hit=stageShapeCircleHit(s,player.x,player.y,player.r);}}
      if(hit)hurtPlayer(o.damage,'stage-moving-structure');
    }
    if(o.solid)stagePhysicalPushPlayer(o,px,py);
    if(o.age>=o.warn+o.travel+(o.hold||0)+.5)o.dead=true;
  }
  compactInPlace(list,o=>o&&!o.dead);
}
function stagePhysicalImpact(o){audio.stageAttack?.(o.stageId,o.kind==='bulkhead'?'shutter-slam':'debris-impact');spawnParticle(o.x,o.y,'#d9e1ed',7,115,3);state.camera.shake=Math.max(state.camera.shake,o.ownerId?12:3);}
function drawStagePhysicalObjects(){if(!state.stageRun||!['playing','cinematic','paused','choice'].includes(state.mode))return;window.stackfallDrawStagePhysicalWarnings?.();for(const o of stagePhysicalObjects())if(!o.dead)window.stackfallDrawStagePhysicalObject?.(o);}
