// Geometry and lifecycle primitives only. Each adapter authors its own world,
// anatomy, movement, attack sequence and cinematic choreography.
const StageCraft={
  polygon(e,vertices,part=0){const a=e.bodyAngle||0,c=Math.cos(a),s=Math.sin(a),k=e.bodyScale||1;return{kind:'polygon',part,points:vertices.map(([x,y])=>({x:e.x+(x*c-y*s)*k,y:e.y+(x*s+y*c)*k}))};},
  paint(shape,origin={x:0,y:0},color='#a4dbeb',fill='#142332',alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.lineJoin='bevel';ctx.lineWidth=2;ctx.strokeStyle=color;ctx.fillStyle=fill;ctx.beginPath();if(shape.kind==='polygon'){for(let i=0;i<shape.points.length;i++){const p=shape.points[i];i?ctx.lineTo(p.x-origin.x,p.y-origin.y):ctx.moveTo(p.x-origin.x,p.y-origin.y);}ctx.closePath();}else if(shape.kind==='circle'){ctx.arc(shape.x-origin.x,shape.y-origin.y,shape.r,0,TAU);}else{ctx.translate(shape.x-origin.x,shape.y-origin.y);ctx.rotate(shape.a||0);ctx.rect(-shape.hw,-shape.hh,shape.hw*2,shape.hh*2);}ctx.fill();ctx.stroke();ctx.restore();},
  move(e,x,y,dt,speed=100,inertia=3){const dx=x-e.x,dy=y-e.y,d=Math.hypot(dx,dy)||1,v=Math.min(speed,d*2.2),f=1-Math.exp(-inertia*dt);e.stageMotionX=lerp(e.stageMotionX||0,dx/d*v,f);e.stageMotionY=lerp(e.stageMotionY||0,dy/d*v,f);},
  later(e,api,ms,fn){const token=e.actionToken;scheduleWeaponAction(ms,()=>{if(api.isActive()&&!e.dead&&e.actionToken===token)fn();});},
  phase(e,cuts,api){const phase=1+cuts.filter(c=>e.hp/e.maxHp<=c).length;if(phase!==e.stagePhase){e.stagePhase=phase;e.phaseAt=state.time;e.actionToken=(e.actionToken||0)+1;e.attackCd=1.6;e.contactSafeUntil=state.time+.9;clearStagePhysicalObjects();api.definition.production.phase?.(e,api);audio.stageAttack?.(e.eventKind,'phase');}return phase;},
  initialize(e,api){const p=api.run.productionEntry||{x:player.x,y:player.y-Math.min(vh*.24,205)};e.x=p.x;e.y=p.y;e.home={...p};e.stageProduction=true;e.bodyScale=compactDevice()?.72:1;e.stageBodyShapes=[];e.attackCd=1.6;e.actionToken=0;e.contactSafeUntil=state.time+1;},
  hazard({kind,ownerId,from,to,vertices,warn=1,travel=1,hold=0,color='#b6eafa',fill='#34577e',damage=10,curve=0,angle=0,drawExtra=null}){
    const o={kind,ownerId,age:0,x:from.x,y:from.y,fromX:from.x,fromY:from.y,toX:to.x,toY:to.y,hw:1,hh:1,a:angle,warn,travel,hold,damage,points:[],shapeVertices:vertices};
    o.update=function(){const t=clamp((this.age-warn)/travel,0,1);this.x=lerp(from.x,to.x,t)+Math.sin(t*Math.PI)*curve;this.y=lerp(from.y,to.y,t);this.active=this.age>=warn&&this.age<warn+travel+hold;this.kindGeometry='polygon';const c=Math.cos(angle),s=Math.sin(angle);this.points=vertices.map(([x,y])=>({x:this.x+x*c-y*s,y:this.y+x*s+y*c}));this.kind='polygon';};
    // Moving attacks keep identity separate from the geometry discriminator.
    o.attackKind=kind;o.kind='polygon';o.update();
    o.draw=function(){const p=worldToScreen(this.x,this.y);if(p.x<-600||p.x>vw+600||p.y<-600||p.y>vh+600)return;ctx.save();ctx.translate(vw/2-player.x,vh/2-player.y);if(this.age<warn){ctx.save();ctx.globalAlpha=.42;ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();ctx.setLineDash([]);const ghost=StageCraft.polygon({x:to.x,y:to.y,bodyAngle:angle},vertices);StageCraft.paint(ghost,{x:0,y:0},color,fill,.20);ctx.restore();StageCraft.paint(this,{x:0,y:0},color,fill,.30);}else if(this.active){StageCraft.paint(this,{x:0,y:0},color,fill);drawExtra?.(this);}ctx.restore();};
    return addStagePhysicalObject(o);
  },
  entryBody(e,p){const q=state.stageRun?.productionEntry||{x:player.x,y:player.y-180},s=worldToScreen(q.x,q.y);return{...e,x:q.x,y:q.y,bodyScale:compactDevice()?.72:1,stagePhase:1,screen:s,entryProgress:p};},
  worldPoint(x,y,parallax=1){return{x:vw/2+x-player.x*parallax,y:vh/2+y-player.y*parallax};},
  env(run){const t=clamp(state.time/Math.max(1,run.stage.boss.spawnAt),0,1);run.productionEnvironment={progress:t,reveal:clamp((t-.16)/.26,0,1),strain:clamp((t-.43)/.3,0,1),presence:clamp((t-.78)/.22,0,1),cleared:run.completed===true};return run.productionEnvironment;}
};
