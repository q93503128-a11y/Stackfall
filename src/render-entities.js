function drawPlayer(){
  const x=vw/2,y=vh/2,t=performance.now(),growth=totalGrowth();
  drawDefenseBarrier();
  ctx.save();ctx.translate(x,y);if(player.invuln>0&&Math.floor(player.invuln*20)%2===0)ctx.globalAlpha=.38;
  const auraR=42+Math.min(24,growth*1.15),glow=ctx.createRadialGradient(0,0,0,0,0,auraR);
  glow.addColorStop(0,player.hitPulse?'rgba(255,91,110,.58)':'rgba(140,235,255,.52)');glow.addColorStop(.38,'rgba(96,112,255,.20)');glow.addColorStop(1,'rgba(80,231,255,0)');
  ctx.fillStyle=glow;ctx.fillRect(-auraR,-auraR,auraR*2,auraR*2);

  ctx.rotate(t/3800);ctx.strokeStyle='rgba(145,190,255,.32)';ctx.lineWidth=1.1;ctx.beginPath();ctx.ellipse(0,0,27,10,.35,0,TAU);ctx.stroke();
  if(growth>=3){ctx.rotate(-t/2600);ctx.strokeStyle='rgba(255,174,231,.26)';ctx.beginPath();ctx.ellipse(0,0,33,12,-.55,0,TAU);ctx.stroke();}
  if(growth>=7){
    const count=Math.min(6,3+Math.floor((growth-7)/3));ctx.rotate(t/2100);const pts=[];
    for(let i=0;i<count;i++){const a=i/count*TAU,rr=34+(i%2)*5,px=Math.cos(a)*rr,py=Math.sin(a)*rr;pts.push({x:px,y:py});ctx.fillStyle=i%2?'#c2a7ff':'#8ff7ff';ctx.shadowBlur=10;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(px,py,1.8,0,TAU);ctx.fill();}
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(151,208,255,.18)';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();
  }
  if(growth>=12){
    ctx.rotate(-t/3000);ctx.globalAlpha=.42;for(let i=0;i<6;i++){const a=i/6*TAU;ctx.save();ctx.rotate(a);const petal=ctx.createLinearGradient(18,0,48,0);petal.addColorStop(0,'rgba(124,232,255,0)');petal.addColorStop(1,i%2?'rgba(194,167,255,.58)':'rgba(124,232,255,.58)');ctx.fillStyle=petal;ctx.beginPath();ctx.moveTo(18,-3);ctx.quadraticCurveTo(35,-9,50,0);ctx.quadraticCurveTo(35,9,18,3);ctx.fill();ctx.restore();}ctx.globalAlpha=1;
  }
  if(growth>=18){
    ctx.globalAlpha=.35+.08*Math.sin(t/300);ctx.strokeStyle='#d8f8ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,48+Math.sin(t/260)*3,-2.8,-.35);ctx.stroke();ctx.beginPath();ctx.arc(0,0,48+Math.sin(t/260)*3,.35,2.8);ctx.stroke();ctx.globalAlpha=1;
  }

  ctx.rotate(t/2300);ctx.shadowBlur=22;ctx.shadowColor=player.hitPulse?COLORS.red:COLORS.cyan;
  const core=ctx.createRadialGradient(-4,-5,1,0,0,17);core.addColorStop(0,'#ffffff');core.addColorStop(.34,'#bff4ff');core.addColorStop(.72,'#7b93ff');core.addColorStop(1,'#332a86');ctx.fillStyle=core;
  drawStarPath(6,7.5,14);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#061027';drawStarPath(4,3,6,Math.PI/4);ctx.fill();
  ctx.restore();

  drawEquippedOrbits(x,y,t);
}

function drawEquippedOrbits(x,y,t){
  const bladeN=weaponCount('blade');
  if(bladeN){
    const count=bladeN>=2?2:1,orbit=bladeN>=6?108:80;
    for(let i=0;i<count;i++){
      const a=player.angle+i*Math.PI,bx=x+Math.cos(a)*orbit,by=y+Math.sin(a)*orbit;
      ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);ctx.shadowBlur=bladeN>=6?28:18;ctx.shadowColor=COLORS.cyan;
      const blade=ctx.createLinearGradient(-17,-28,16,24);blade.addColorStop(0,'rgba(255,255,255,.98)');blade.addColorStop(.42,'#a7f5ff');blade.addColorStop(.75,'#668cff');blade.addColorStop(1,'rgba(60,76,190,.05)');ctx.fillStyle=blade;
      ctx.beginPath();ctx.moveTo(-4,-28);ctx.bezierCurveTo(19,-12,17,14,-2,27);ctx.bezierCurveTo(7,10,3,-8,-4,-28);ctx.fill();
      ctx.globalAlpha=.30;ctx.strokeStyle='#8ff5ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,14,37,-2.55,-.56);ctx.stroke();ctx.globalAlpha=1;ctx.restore();
    }
  }
  const prismN=weaponCount('prism');
  if(prismN){
    const count=prismN>=6?3:prismN>=2?2:1;
    for(const p of prismPositions(count)){
      const s=worldToScreen(p.x,p.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-p.a+t/1300);ctx.shadowBlur=16;ctx.shadowColor='#c2a7ff';
      const g=ctx.createLinearGradient(0,-10,0,10);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#d2c3ff');g.addColorStop(1,'#6e63d8');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.restore();
    }
    if(prismN>=4){
      const pts=prismPositions(count).map(p=>worldToScreen(p.x,p.y));ctx.strokeStyle='rgba(194,167,255,.25)';ctx.lineWidth=1.2;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(pts.length>2)ctx.closePath();ctx.stroke();
    }
  }
  const bulwarkN=weaponCount('bulwark');
  if(bulwarkN){
    const count=Math.min(4,1+Math.floor((bulwarkN-1)/2));for(let i=0;i<count;i++){const a=-t/1800+i*TAU/count,rr=48;ctx.save();ctx.translate(x+Math.cos(a)*rr,y+Math.sin(a)*rr);ctx.rotate(a+Math.PI/2);ctx.shadowBlur=10;ctx.shadowColor=COLORS.green;ctx.strokeStyle='rgba(116,242,167,.78)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,5);ctx.lineTo(0,-8);ctx.lineTo(7,5);ctx.lineTo(0,9);ctx.closePath();ctx.stroke();ctx.restore();}
  }
}

function drawEnemies(){
  for(const e of state.entities.enemies){
    const p=worldToScreen(e.x,e.y);if(p.x<-130||p.x>vw+130||p.y<-130||p.y>vh+130)continue;
    ctx.save();ctx.translate(p.x,p.y);const pulse=1+Math.sin(e.phase)*.05;ctx.scale(pulse,pulse);ctx.shadowBlur=e.type==='boss'?44:e.type==='mini'?30:13;ctx.shadowColor=e.color;
    ctx.strokeStyle=e.hit?'#ffffff':e.color;ctx.fillStyle=e.hit?'#ffffff':e.color;
    if(e.type==='fast'){
      ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x));const tail=ctx.createLinearGradient(-e.r*3,0,e.r,0);tail.addColorStop(0,'rgba(255,79,154,0)');tail.addColorStop(1,'rgba(255,79,154,.55)');ctx.fillStyle=tail;ctx.beginPath();ctx.moveTo(-e.r*3,-3);ctx.lineTo(e.r*.2,-5);ctx.lineTo(e.r*.2,5);ctx.lineTo(-e.r*3,3);ctx.fill();ctx.fillStyle=e.hit?'#fff':e.color;ctx.beginPath();ctx.moveTo(e.r*1.55,0);ctx.lineTo(-e.r*.75,e.r*.78);ctx.lineTo(-e.r*.22,0);ctx.lineTo(-e.r*.75,-e.r*.78);ctx.closePath();ctx.fill();
    }else if(e.type==='tank'){
      ctx.rotate(e.phase*.08);ctx.lineWidth=3.5;for(let ring=0;ring<2;ring++){ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU,rr=e.r-ring*7,xx=Math.cos(a)*rr,yy=Math.sin(a)*rr;if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.closePath();ring?ctx.fill():ctx.stroke();ctx.rotate(-e.phase*.05);}
    }else if(e.type==='mini'){
      ctx.rotate(e.phase*.10);ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r*1.20,0,TAU);ctx.stroke();ctx.rotate(-e.phase*.28);for(let i=0;i<6;i++){ctx.save();ctx.rotate(i/6*TAU);ctx.fillStyle=e.hit?'#fff':e.color;ctx.beginPath();ctx.moveTo(e.r*.42,-4);ctx.lineTo(e.r*1.08,0);ctx.lineTo(e.r*.42,4);ctx.fill();ctx.restore();}ctx.fillStyle='#120927';ctx.beginPath();ctx.arc(0,0,e.r*.48,0,TAU);ctx.fill();ctx.strokeStyle='#eedcff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,e.r*.30,0,TAU);ctx.stroke();
    }else if(e.type==='boss'){
      if(e.variant==='seraph'){
        ctx.rotate(e.phase*.06);for(let i=0;i<8;i++){ctx.save();ctx.rotate(i/8*TAU);const wing=ctx.createLinearGradient(e.r*.28,0,e.r*1.42,0);wing.addColorStop(0,'rgba(159,255,234,.08)');wing.addColorStop(1,'rgba(159,255,234,.76)');ctx.fillStyle=wing;ctx.beginPath();ctx.moveTo(e.r*.25,-7);ctx.quadraticCurveTo(e.r*.9,-18,e.r*1.5,0);ctx.quadraticCurveTo(e.r*.9,18,e.r*.25,7);ctx.fill();ctx.restore();}ctx.rotate(-e.phase*.18);ctx.strokeStyle='#cafff3';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,e.r*.74,0,TAU);ctx.stroke();ctx.fillStyle='#071b24';ctx.beginPath();ctx.arc(0,0,e.r*.42,0,TAU);ctx.fill();
      }else{
        ctx.rotate(e.phase*.055);ctx.strokeStyle='#ff9bd5';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,e.r*1.35,e.r*.42,.32,0,TAU);ctx.stroke();ctx.rotate(-e.phase*.16);ctx.strokeStyle='#c6a0ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,e.r*1.08,e.r*.30,-.55,0,TAU);ctx.stroke();const eclipse=ctx.createRadialGradient(-e.r*.25,-e.r*.22,2,0,0,e.r*.72);eclipse.addColorStop(0,'#ffb8e4');eclipse.addColorStop(.30,'#a95cff');eclipse.addColorStop(.68,'#20113d');eclipse.addColorStop(1,'#010107');ctx.fillStyle=eclipse;ctx.beginPath();ctx.arc(0,0,e.r*.72,0,TAU);ctx.fill();for(let i=0;i<6;i++){const a=i/6*TAU+e.phase*.15;ctx.fillStyle='#ff72cb';ctx.beginPath();ctx.arc(Math.cos(a)*e.r*.92,Math.sin(a)*e.r*.92,3.2,0,TAU);ctx.fill();}
      }
    }else{
      const orb=ctx.createRadialGradient(-e.r*.3,-e.r*.35,1,0,0,e.r);orb.addColorStop(0,'#c7c0ff');orb.addColorStop(.45,e.color);orb.addColorStop(1,'#2b216b');ctx.fillStyle=orb;ctx.beginPath();ctx.arc(0,0,e.r,0,TAU);ctx.fill();ctx.globalAlpha=.44;ctx.strokeStyle='#c4d2ff';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,e.r*1.38,e.r*.42,e.phase*.08,0,TAU);ctx.stroke();for(let i=0;i<3;i++){const a=e.phase*.4+i*TAU/3;ctx.fillStyle='#a6b8ff';ctx.beginPath();ctx.arc(Math.cos(a)*e.r*1.22,Math.sin(a)*e.r*.52,1.7,0,TAU);ctx.fill();}
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;
    if(!['boss','mini'].includes(e.type)){ctx.fillStyle='rgba(2,4,15,.72)';ctx.beginPath();ctx.arc(0,0,Math.max(3,e.r*.22),0,TAU);ctx.fill();}
    if(e.type==='mini'||e.type==='boss'||e.hp<e.maxHp){ctx.fillStyle='rgba(0,0,0,.52)';ctx.fillRect(-e.r,-e.r-14,e.r*2,4);ctx.fillStyle=e.color;ctx.fillRect(-e.r,-e.r-14,e.r*2*(e.hp/e.maxHp),4);}
    ctx.restore();
  }
}

function drawProjectileTrail(p,s,nx,ny,trail){
  ctx.save();const g=ctx.createLinearGradient(s.x-nx*trail,s.y-ny*trail,s.x,s.y);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.45,p.color+'33');g.addColorStop(1,p.color);ctx.strokeStyle=g;ctx.lineWidth=Math.max(1.5,p.r*.75);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(s.x-nx*trail,s.y-ny*trail);ctx.lineTo(s.x,s.y);ctx.stroke();ctx.restore();
}

function drawProjectiles(){
  for(const p of state.entities.projectiles){
    const s=worldToScreen(p.x,p.y),speed=Math.hypot(p.vx,p.vy)||1,nx=p.vx/speed,ny=p.vy/speed;
    const isComet=p.source.includes('comet'),isStar=['ember','echo-star','core','core-echo','star-spark'].includes(p.source),trail=isComet?76:isStar?34:p.source==='wave'?28:22;
    drawProjectileTrail(p,s,nx,ny,trail);
    if(isComet){drawProjectileTrail({...p,color:'#ffffff'},s,nx,ny,trail*.55);}
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.shadowBlur=isComet?34:p.r>9?28:18;ctx.shadowColor=p.color;
    if(isComet){
      const coma=ctx.createRadialGradient(0,0,0,0,0,p.r*1.6);coma.addColorStop(0,'#ffffff');coma.addColorStop(.38,p.color);coma.addColorStop(1,'rgba(181,245,255,0)');ctx.fillStyle=coma;ctx.beginPath();ctx.arc(0,0,p.r*1.6,0,TAU);ctx.fill();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(p.r*.18,0,p.r*.58,0,TAU);ctx.fill();
    }else if(isStar){
      const r=p.r*1.35;ctx.fillStyle='#ffffff';drawStarPath(4,r*.32,r,0);ctx.fill();ctx.globalAlpha=.72;ctx.rotate(Math.PI/4);ctx.fillStyle=p.color;drawStarPath(4,r*.18,r*.72,0);ctx.fill();
    }else if(p.source.includes('prism')){
      ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(p.r*1.5,0);ctx.lineTo(0,p.r);ctx.lineTo(-p.r*1.1,0);ctx.lineTo(0,-p.r);ctx.closePath();ctx.fill();
    }else{
      ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-p.r*.2,-p.r*.25,Math.max(1,p.r*.34),0,TAU);ctx.fill();
    }
    ctx.restore();
  }
}

function drawEnemyProjectiles(){
  for(const p of state.entities.enemyProjectiles){
    const s=worldToScreen(p.x,p.y),speed=Math.hypot(p.vx,p.vy)||1,nx=p.vx/speed,ny=p.vy/speed;
    drawProjectileTrail(p,s,nx,ny,24);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(p.phase);ctx.shadowBlur=18;ctx.shadowColor=p.color;ctx.strokeStyle=p.color;ctx.fillStyle=p.color;ctx.lineWidth=2;drawStarPath(5,p.r*.38,p.r,0);ctx.fill();ctx.stroke();ctx.restore();
  }
}

function drawGems(){
  for(const g of state.entities.gems){const p=worldToScreen(g.x,g.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(g.pulse);ctx.shadowBlur=14;ctx.shadowColor=COLORS.cyan;const gem=ctx.createLinearGradient(0,-g.r,0,g.r);gem.addColorStop(0,'#ffffff');gem.addColorStop(.45,'#8eeaff');gem.addColorStop(1,'#5b66ff');ctx.fillStyle=gem;ctx.beginPath();ctx.moveTo(0,-g.r*1.35);ctx.lineTo(g.r*.75,0);ctx.lineTo(0,g.r*1.35);ctx.lineTo(-g.r*.75,0);ctx.closePath();ctx.fill();ctx.restore();}
}
function drawWells(){
  for(const w of state.entities.wells){const p=worldToScreen(w.x,w.y),alpha=clamp(w.life/.35,0,1);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(0,0,2,0,0,w.r);g.addColorStop(0,'rgba(0,0,4,1)');g.addColorStop(.12,'rgba(48,27,105,.78)');g.addColorStop(.42,'rgba(139,99,255,.16)');g.addColorStop(1,'rgba(139,99,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,w.r,0,TAU);ctx.fill();ctx.rotate(performance.now()/800);ctx.strokeStyle='rgba(194,166,255,.72)';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(0,0,42+Math.sin(performance.now()/150)*4,13,0,0,TAU);ctx.stroke();ctx.rotate(-performance.now()/430);ctx.strokeStyle='rgba(86,213,255,.32)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,66,19,.4,0,TAU);ctx.stroke();ctx.fillStyle='#010107';ctx.beginPath();ctx.arc(0,0,16,0,TAU);ctx.fill();ctx.restore();}
}
function drawEffects(){
  for(const s of state.entities.shockwaves){const p=worldToScreen(s.x,s.y);ctx.globalAlpha=s.life/s.max;ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.beginPath();ctx.arc(p.x,p.y,s.r,0,TAU);ctx.stroke();}
  ctx.globalAlpha=1;
  for(const p of state.entities.particles){const s=worldToScreen(p.x,p.y);ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.shadowBlur=9;ctx.shadowColor=p.color;if(p.star){ctx.save();ctx.translate(s.x,s.y);drawStarPath(4,p.size*.25,p.size*.62,0);ctx.fill();ctx.restore();}else{ctx.beginPath();ctx.arc(s.x,s.y,p.size*.5,0,TAU);ctx.fill();}}
  ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.textAlign='center';
  for(const t of state.entities.texts){const s=worldToScreen(t.x,t.y);ctx.globalAlpha=clamp(t.life/t.max,0,1);ctx.fillStyle=t.color;ctx.font=`800 ${t.size}px IBM Plex Sans KR`;ctx.fillText(t.text,s.x,s.y);}ctx.globalAlpha=1;
}
