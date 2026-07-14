(function(){
  if(!PASSIVES.projectileSpeed){
    PASSIVES.projectileSpeed={name:'광자 가속기',icon:'➟',color:'#86dfff',desc:'투사체 속도 +10%, 공전형 장비 회전속도 +8%',max:6};
  }
  PASSIVE_TEXT.projectileSpeed={
    ko:['광자 가속기','투사체 속도 +10%, 공전형 장비 회전속도 +8%'],
    en:['Photon Accelerator','Projectile speed +10%, orbiting equipment rotation speed +8%'],
    ja:['光子加速器','投射物速度+10%、周回装備の回転速度+8%'],
    'zh-CN':['光子加速器','投射物速度+10%，环绕装备旋转速度+8%'],
    es:['Acelerador Fotónico','Velocidad de proyectiles +10% y rotación orbital +8%'],
    fr:['Accélérateur Photonique','Vitesse des projectiles +10 % et rotation orbitale +8 %']
  };

  const projectileSpeedMultiplier=()=>1+stat('projectileSpeed')*.10;
  const baseSpawnProjectile=spawnPlayerProjectile;
  spawnPlayerProjectile=function acceleratedProjectile(data){
    const mult=projectileSpeedMultiplier();
    const next={...data};
    if(Number.isFinite(next.vx))next.vx*=mult;
    if(Number.isFinite(next.vy))next.vy*=mult;
    return baseSpawnProjectile(next);
  };

  const baseUpdateWeapons=updateWeapons;
  updateWeapons=function acceleratedOrbitWeapons(dt){
    const before=player.angle;
    baseUpdateWeapons(dt);
    const delta=player.angle-before;
    if(Number.isFinite(delta)&&delta!==0)player.angle+=delta*stat('projectileSpeed')*.08;
  };

  const cubic=(a,b,c,d,t)=>{const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};};
  const normalize=(x,y)=>{const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d};};
  const enemyById=id=>state.entities.enemies.find(e=>e.id===id&&!e.dead)||null;

  function beginBoomerangTurn(p,target){
    if(p.stage!=='approach')return;
    const hitPoint=target?{x:target.x,y:target.y}:{x:p.targetPoint.x,y:p.targetPoint.y};
    const outward=normalize(hitPoint.x-player.x,hitPoint.y-player.y);
    const tangent=normalize(p.x-p.lastX,p.y-p.lastY);
    const normal={x:-outward.y,y:outward.x};
    const endDistance=88+p.stacks*5;
    const end={x:hitPoint.x+outward.x*endDistance,y:hitPoint.y+outward.y*endDistance};
    const returnDir=normalize(player.x-end.x,player.y-end.y);
    const side=p.side||1;
    p.turnStart={x:p.x,y:p.y};
    p.turnEnd=end;
    p.turnC1={x:p.x+tangent.x*(54+p.stacks*3)+normal.x*side*(42+p.stacks*3),y:p.y+tangent.y*(54+p.stacks*3)+normal.y*side*(42+p.stacks*3)};
    p.turnC2={x:end.x-returnDir.x*(68+p.stacks*4),y:end.y-returnDir.y*(68+p.stacks*4)};
    p.stage='turn';p.stageTime=0;
    p.stageDuration=Math.max(.22,(.34+p.stacks*.012)/projectileSpeedMultiplier());
  }

  function curveHit(p,e,returning=false){
    p.hitIds.add(e.id);
    dealDamage(e,p.damage,{color:p.color,source:returning?'arc-return':'arc'});
    shockwave(p.x,p.y,p.color,36+p.stacks*3,.20,2);
  }

  sf2FireArc=function targetedSmoothBoomerang(target,stacks,echoed=false){
    target=target&&!target.dead?target:nearestEnemy(player.x,player.y);
    if(!target)return;
    const shots=stacks>=6?3:stacks>=2?2:1;
    const start={x:player.x,y:player.y};
    const base=Math.atan2(target.y-start.y,target.x-start.x);
    const distance=Math.hypot(target.x-start.x,target.y-start.y);
    const baseDir={x:Math.cos(base),y:Math.sin(base)},baseNormal={x:-baseDir.y,y:baseDir.x};
    player.arcSide=(player.arcSide||-1)*-1;
    for(let i=0;i<shots;i++){
      const spread=i-(shots-1)/2;
      const side=shots===1?player.arcSide:(spread===0?player.arcSide:Math.sign(spread));
      const lateral=spread*(32+stacks*4);
      const targetPoint={x:target.x+baseNormal.x*lateral,y:target.y+baseNormal.y*lateral};
      const dir=normalize(targetPoint.x-start.x,targetPoint.y-start.y),normal={x:-dir.y,y:dir.x};
      const curve=clamp(185+distance*.22+(stacks>=3?34:0),190,345)*side;
      const c1={x:start.x+dir.x*Math.max(76,distance*.27)+normal.x*curve,y:start.y+dir.y*Math.max(76,distance*.27)+normal.y*curve};
      const c2={x:targetPoint.x-dir.x*Math.max(48,distance*.16)+normal.x*curve*.34,y:targetPoint.y-dir.y*Math.max(48,distance*.16)+normal.y*curve*.34};
      const pathEstimate=Math.max(260,distance+Math.abs(curve)*.58);
      state.entities.curves.push({
        stage:'approach',stageTime:0,stageDuration:clamp(pathEstimate/(520*projectileSpeedMultiplier()),.48,1.08),
        start:{...start},targetId:target.id,targetPoint,c1,c2,curve,side,lateral,
        x:start.x,y:start.y,lastX:start.x,lastY:start.y,hitIds:new Set(),
        r:10+stacks*1.15,damage:(18+stacks*5.1)*(echoed?.68:1),color:echoed?COLORS.pink:'#69ffe0',
        trailDamage:stacks>=5,trailCd:0,history:[],stacks,dead:false,returnLife:0
      });
    }
  };

  sf2UpdateCurves=function targetedSmoothBoomerangUpdate(dt){
    for(const p of state.entities.curves){
      if(p.dead)continue;
      p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;
      let reached=false;
      if(p.stage==='approach'){
        const live=enemyById(p.targetId);
        if(live){
          const baseDir=normalize(live.x-p.start.x,live.y-p.start.y),normal={x:-baseDir.y,y:baseDir.x};
          const desired={x:live.x+normal.x*p.lateral,y:live.y+normal.y*p.lateral};
          p.targetPoint.x=lerp(p.targetPoint.x,desired.x,.34);p.targetPoint.y=lerp(p.targetPoint.y,desired.y,.34);
          const distance=Math.hypot(p.targetPoint.x-p.start.x,p.targetPoint.y-p.start.y);
          p.c2.x=p.targetPoint.x-baseDir.x*Math.max(48,distance*.16)+normal.x*p.curve*.34;
          p.c2.y=p.targetPoint.y-baseDir.y*Math.max(48,distance*.16)+normal.y*p.curve*.34;
        }
        const t=clamp(p.stageTime/p.stageDuration,0,1),pos=cubic(p.start,p.c1,p.c2,p.targetPoint,t);p.x=pos.x;p.y=pos.y;
        reached=t>=1;
      }else if(p.stage==='turn'){
        const t=clamp(p.stageTime/p.stageDuration,0,1),pos=cubic(p.turnStart,p.turnC1,p.turnC2,p.turnEnd,t);p.x=pos.x;p.y=pos.y;
        if(t>=1){p.stage='return';p.stageTime=0;p.returnLife=0;p.hitIds.clear();p.history.length=0;}
      }else{
        p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy)||1,speed=(680+p.stacks*32)*projectileSpeedMultiplier();
        p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);
        if(d<player.r+13||p.returnLife>1.9)p.dead=true;
      }

      for(const e of state.entities.enemies){
        if(e.dead||p.hitIds.has(e.id))continue;
        if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){
          curveHit(p,e,p.stage==='return');
          if(p.stage==='approach'&&e.id===p.targetId)beginBoomerangTurn(p,e);
        }
      }
      if(p.stage==='approach'&&reached){
        const live=enemyById(p.targetId);
        if(live&&!p.hitIds.has(live.id))curveHit(p,live,false);
        beginBoomerangTurn(p,live);
      }

      p.history.push({x:p.x,y:p.y});if(p.history.length>32)p.history.shift();p.trailCd-=dt;
      if(p.trailDamage&&p.trailCd<=0){
        p.trailCd=.11;state.entities.shockwaves.push({x:p.x,y:p.y,r:3,maxR:24+p.stacks*2,life:.20,max:.20,color:'rgba(105,255,224,.46)',width:1.2});
        for(const e of state.entities.enemies)if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+22+p.stacks*2)**2)dealDamage(e,2.2+p.stacks*.85,{color:p.color,source:'arc-trail',canCrit:false});
      }
      if(Math.random()<.62)state.entities.particles.push({x:p.x,y:p.y,vx:rand(-14,14),vy:rand(-14,14),life:.30,max:.30,size:rand(1.4,3.2),color:p.color,star:true});
    }
    state.entities.curves=state.entities.curves.filter(p=>!p.dead);
  };

  drawMagnetField=function differentiatedMagnetField(){
    const x=vw/2,y=vh/2,r=magnetRange(),stacks=stat('magnet'),t=performance.now();
    const rgb=stacks>0?'255,204,92':'104,220,255';ctx.save();
    const fill=ctx.createRadialGradient(x,y,player.r+10,x,y,r);fill.addColorStop(0,`rgba(${rgb},.055)`);fill.addColorStop(.68,`rgba(${rgb},.025)`);fill.addColorStop(1,`rgba(${rgb},.008)`);
    ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.shadowBlur=12;ctx.shadowColor=`rgba(${rgb},.55)`;
    ctx.setLineDash([5,9]);ctx.lineDashOffset=-(t*.0153)%14;ctx.lineWidth=1.65;ctx.strokeStyle=`rgba(${rgb},${stacks>0?.58:.38})`;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
    ctx.setLineDash([1,13]);ctx.lineDashOffset=(t*.0107)%14;ctx.lineWidth=1;ctx.strokeStyle=`rgba(${rgb},${stacks>0?.33:.23})`;ctx.beginPath();ctx.arc(x,y,r-8,0,TAU);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<6;i++){const a=t*.00071+i*TAU/6,rr=r;ctx.fillStyle=`rgba(${rgb},${stacks>0?.88:.62})`;ctx.beginPath();ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr,stacks>0?2.4:1.8,0,TAU);ctx.fill();}
    ctx.restore();
  };

  drawDefenseBarrier=function differentiatedDefenseBarrier(){
    const defense=weaponCount('bulwark')>0||stat('armor')>0||player.shield>0;if(!defense)return;
    const x=vw/2,y=vh/2,t=performance.now(),strength=player.shield>0?1:.48,radius=player.r+18+Math.sin(t*.0021)*1.7;
    ctx.save();ctx.translate(x,y);ctx.rotate(t*.00019);ctx.strokeStyle=`rgba(116,242,167,${.24+strength*.35})`;
    ctx.lineWidth=player.shield>0?3:1.7;ctx.shadowBlur=player.shield>0?18:8;ctx.shadowColor=COLORS.green;ctx.beginPath();
    for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,px=Math.cos(a)*radius,py=Math.sin(a)*radius;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.closePath();ctx.stroke();if(player.shield>0){ctx.globalAlpha=.20;ctx.fillStyle=COLORS.green;ctx.fill();}ctx.restore();
  };

  drawEquippedOrbits=function differentiatedEquipmentOrbits(x,y,t){
    const bladeN=weaponCount('blade');
    if(bladeN){
      const count=bladeN>=5?3:bladeN>=2?2:1,orbit=bladeN>=6?116:bladeN>=3?91:80;
      for(let i=0;i<count;i++){
        const a=player.angle+i*TAU/count,bx=x+Math.cos(a)*orbit,by=y+Math.sin(a)*orbit;
        ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);ctx.shadowBlur=bladeN>=6?28:18;ctx.shadowColor=COLORS.cyan;
        const blade=ctx.createLinearGradient(-17,-28,16,24);blade.addColorStop(0,'rgba(255,255,255,.98)');blade.addColorStop(.42,'#a7f5ff');blade.addColorStop(.75,'#668cff');blade.addColorStop(1,'rgba(60,76,190,.05)');ctx.fillStyle=blade;
        ctx.beginPath();ctx.moveTo(-4,-28);ctx.bezierCurveTo(19,-12,17,14,-2,27);ctx.bezierCurveTo(7,10,3,-8,-4,-28);ctx.fill();ctx.restore();
      }
    }
    const prismN=weaponCount('prism');
    if(prismN){
      const count=prismN>=6?3:prismN>=2?2:1;
      for(const p of prismPositions(count)){
        const s=worldToScreen(p.x,p.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-p.a+t*.00057);ctx.shadowBlur=16;ctx.shadowColor='#c2a7ff';
        const g=ctx.createLinearGradient(0,-10,0,10);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#d2c3ff');g.addColorStop(1,'#6e63d8');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.restore();
      }
      if(prismN>=4){const pts=prismPositions(count).map(p=>worldToScreen(p.x,p.y));ctx.strokeStyle='rgba(194,167,255,.25)';ctx.lineWidth=1.2;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(pts.length>2)ctx.closePath();ctx.stroke();}
    }
  };

  applyLanguage();renderLoadout();updateHUD();
})();