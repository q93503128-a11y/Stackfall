WEAPONS.comet.icon='⟐';

function drawBeamEffects(){
  for(const beam of state.entities.beams){
    const a=worldToScreen(beam.x1,beam.y1),b=worldToScreen(beam.x2,beam.y2);
    const alpha=clamp(beam.life/beam.max,0,1);
    ctx.save();ctx.globalAlpha=alpha;
    ctx.shadowBlur=18;ctx.shadowColor=beam.color;ctx.strokeStyle=beam.color;ctx.lineCap='round';
    ctx.lineWidth=beam.width*2.8;ctx.globalAlpha=alpha*.18;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.globalAlpha=alpha;ctx.lineWidth=beam.width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.strokeStyle='#ffffff';ctx.globalAlpha=alpha*.78;ctx.lineWidth=Math.max(.7,beam.width*.32);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.restore();
  }
}

drawProjectiles=function drawProjectilesPolished(){
  for(const p of state.entities.projectiles){
    const s=worldToScreen(p.x,p.y),speed=Math.hypot(p.vx,p.vy)||1,nx=p.vx/speed,ny=p.vy/speed;
    const source=p.source||'',isComet=source.includes('comet'),isStar=['ember','echo-star','core','core-echo','star-spark'].includes(source);
    const trail=isComet?92:isStar?40:source==='wave'?30:22;
    drawProjectileTrail(p,s,nx,ny,trail);
    if(isComet){
      drawProjectileTrail({...p,color:'#ffffff'},s,nx,ny,trail*.62);
      ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(p.vy,p.vx));
      const stacks=weaponCount('comet');
      ctx.shadowBlur=34+stacks*2;ctx.shadowColor=p.color;
      const tail=ctx.createLinearGradient(-p.r*5,0,p.r*.2,0);
      tail.addColorStop(0,'rgba(181,245,255,0)');tail.addColorStop(.58,'rgba(127,205,255,.20)');tail.addColorStop(1,'rgba(255,255,255,.82)');
      ctx.fillStyle=tail;ctx.beginPath();ctx.moveTo(-p.r*5,-p.r*.42);ctx.quadraticCurveTo(-p.r*2.1,-p.r*.85,p.r*.15,0);ctx.quadraticCurveTo(-p.r*2.1,p.r*.85,-p.r*5,p.r*.42);ctx.fill();
      const shaft=ctx.createLinearGradient(-p.r*1.7,0,p.r*1.9,0);
      shaft.addColorStop(0,'#5f83d9');shaft.addColorStop(.45,'#dffcff');shaft.addColorStop(1,'#ffffff');
      ctx.fillStyle=shaft;
      ctx.beginPath();ctx.moveTo(-p.r*1.9,-p.r*.22);ctx.lineTo(p.r*.72,-p.r*.22);ctx.lineTo(p.r*.72,p.r*.22);ctx.lineTo(-p.r*1.9,p.r*.22);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(p.r*2.15,0);ctx.lineTo(p.r*.62,-p.r*.72);ctx.lineTo(p.r*.90,0);ctx.lineTo(p.r*.62,p.r*.72);ctx.closePath();ctx.fill();
      ctx.strokeStyle=p.color;ctx.lineWidth=1.2;ctx.globalAlpha=.74;ctx.stroke();
      if(stacks>=3){
        ctx.globalAlpha=.35;ctx.strokeStyle='#b5f5ff';ctx.lineWidth=1.2;
        ctx.beginPath();ctx.ellipse(-p.r*.15,0,p.r*1.9,p.r*.62,0,0,TAU);ctx.stroke();
      }
      if(stacks>=5){
        ctx.globalAlpha=.55;for(let i=0;i<3;i++){const a=i*TAU/3+performance.now()/450;ctx.fillStyle=i%2?'#ffffff':'#9deeff';ctx.beginPath();ctx.arc(-p.r*1.2+Math.cos(a)*p.r*.7,Math.sin(a)*p.r*.7,1.7,0,TAU);ctx.fill();}
      }
      ctx.restore();
    }else{
      ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.shadowBlur=p.r>9?28:18;ctx.shadowColor=p.color;
      if(isStar){
        const r=p.r*1.42;ctx.fillStyle='#ffffff';drawStarPath(4,r*.28,r,0);ctx.fill();
        ctx.globalAlpha=.76;ctx.rotate(Math.PI/4);ctx.fillStyle=p.color;drawStarPath(4,r*.16,r*.72,0);ctx.fill();
      }else if(source==='wave'){
        ctx.strokeStyle=p.color;ctx.lineWidth=3.2;ctx.beginPath();ctx.arc(-2,0,p.r*1.65,-1.15,1.15);ctx.stroke();
      }else{
        ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r,0,TAU);ctx.fill();
      }
      ctx.restore();
    }
  }
  drawBeamEffects();
};

const originalDrawPlayer=drawPlayer;
drawPlayer=function drawPlayerWithLateGameSplendor(){
  originalDrawPlayer();
  const growth=totalGrowth(),t=performance.now(),x=vw/2,y=vh/2;
  if(growth<20&&state.time<150)return;
  const power=Math.min(1,Math.max((growth-18)/22,(state.time-120)/240));
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=.18+.20*power;ctx.rotate(t/9000);
  for(let ring=0;ring<3;ring++){
    const r=58+ring*14+Math.sin(t/420+ring)*2;
    ctx.strokeStyle=ring===1?'#c6a8ff':'#8ff4ff';ctx.lineWidth=1+power;
    ctx.setLineDash([4+ring*2,12-ring]);ctx.lineDashOffset=-t/(55+ring*18);
    ctx.beginPath();ctx.arc(0,0,r,ring*.55,TAU-ring*.4);ctx.stroke();
  }
  ctx.setLineDash([]);
  const stars=6+Math.floor(power*6);
  for(let i=0;i<stars;i++){
    const a=t/2400+i*TAU/stars,rr=72+(i%3)*8;
    ctx.fillStyle=i%3===0?'#ffffff':i%2?'#c2a7ff':'#7ce8ff';ctx.shadowBlur=9;ctx.shadowColor=ctx.fillStyle;
    ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,1.2+power,0,TAU);ctx.fill();
  }
  ctx.restore();
};
