(function(){
  const cubic=(a,b,c,d,t)=>{const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};};
  const quad=(a,b,c,t)=>{const u=1-t;return{x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};};
  const ease=t=>t*t*(3-2*t);
  const enemyById=id=>state.entities.enemies.find(e=>e.id===id&&!e.dead)||null;

  sf2UpdateCurves=function updateAdaptiveBoomerangs(dt){
    for(const p of state.entities.curves){
      if(p.dead)continue;
      p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;
      if(p.stage==='approach'){
        const live=enemyById(p.targetId);
        if(live){p.targetPoint.x=lerp(p.targetPoint.x,live.x,.10);p.targetPoint.y=lerp(p.targetPoint.y,live.y,.10);}
        const t=ease(clamp(p.stageTime/p.stageDuration,0,1)),pos=cubic(p.start,p.c1,p.c2,p.targetPoint,t);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){
          const angle=Math.atan2(p.targetPoint.y-p.start.y,p.targetPoint.x-p.start.x),dir={x:Math.cos(angle),y:Math.sin(angle)};
          const passDistance=Math.hypot(p.passPoint.x-p.targetPoint.x,p.passPoint.y-p.targetPoint.y);
          p.passPoint={x:p.targetPoint.x+dir.x*passDistance,y:p.targetPoint.y+dir.y*passDistance};
          p.stage='pass';p.stageTime=0;p.stageDuration=.20+Math.min(.09,p.stacks*.01);p.passStart={...p.targetPoint};
          p.passControl={x:lerp(p.targetPoint.x,p.passPoint.x,.54),y:lerp(p.targetPoint.y,p.passPoint.y,.54)};
        }
      }else if(p.stage==='pass'){
        const t=ease(clamp(p.stageTime/p.stageDuration,0,1)),pos=quad(p.passStart,p.passControl,p.passPoint,t);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){
          const outward=Math.atan2(p.passPoint.y-p.passStart.y,p.passPoint.x-p.passStart.x),dir={x:Math.cos(outward),y:Math.sin(outward)},normal={x:-dir.y,y:dir.x};
          const side=Math.sign((p.turnPoint.x-p.passPoint.x)*normal.x+(p.turnPoint.y-p.passPoint.y)*normal.y)||1;
          const passDistance=Math.hypot(p.passPoint.x-p.targetPoint.x,p.passPoint.y-p.targetPoint.y);
          p.turnPoint={x:p.targetPoint.x+dir.x*(passDistance+46+p.stacks*4),y:p.targetPoint.y+dir.y*(passDistance+46+p.stacks*4)};
          p.turnControl={x:p.passPoint.x+dir.x*32+normal.x*side*(148+p.stacks*14),y:p.passPoint.y+dir.y*32+normal.y*side*(148+p.stacks*14)};
          p.stage='turn';p.stageTime=0;p.stageDuration=.27+Math.min(.08,p.stacks*.012);p.turnStart={...p.passPoint};
        }
      }else if(p.stage==='turn'){
        const t=ease(clamp(p.stageTime/p.stageDuration,0,1)),pos=quad(p.turnStart,p.turnControl,p.turnPoint,t);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){p.stage='return';p.stageTime=0;p.returnLife=0;p.hitIds.clear();p.history.length=0;}
      }else{
        p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy)||1,speed=690+p.stacks*34;
        p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);
        if(d<player.r+13||p.returnLife>1.8)p.dead=true;
      }
      p.history.push({x:p.x,y:p.y});if(p.history.length>30)p.history.shift();p.trailCd-=dt;
      if(p.trailDamage&&p.trailCd<=0){
        p.trailCd=.11;state.entities.shockwaves.push({x:p.x,y:p.y,r:3,maxR:24+p.stacks*2,life:.20,max:.20,color:'rgba(105,255,224,.46)',width:1.2});
        for(const e of state.entities.enemies)if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+22+p.stacks*2)**2)dealDamage(e,2.2+p.stacks*.85,{color:p.color,source:'arc-trail',canCrit:false});
      }
      for(const e of state.entities.enemies){
        if(e.dead||p.hitIds.has(e.id))continue;
        if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){p.hitIds.add(e.id);dealDamage(e,p.damage,{color:p.color,source:p.stage==='return'?'arc-return':'arc'});shockwave(p.x,p.y,p.color,36+p.stacks*3,.20,2);}
      }
      if(Math.random()<.72)state.entities.particles.push({x:p.x,y:p.y,vx:rand(-18,18),vy:rand(-18,18),life:.28,max:.28,size:rand(1.4,3.4),color:p.color,star:true});
    }
    state.entities.curves=state.entities.curves.filter(p=>!p.dead);
  };
})();
