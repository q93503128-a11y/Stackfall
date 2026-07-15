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
