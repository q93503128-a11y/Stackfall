// Restore the three Endless Apex silhouettes from immediately before 9af0cdec (2026-07-20).
// This file intentionally changes visuals only. It does not replace the canonical Apex combat/pattern systems.
(()=>{
  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(!baseDrawEliteShape)return;

  function setup(e){
    ctx.strokeStyle=e.hit?'#fff':e.color;
    ctx.fillStyle=e.hit?'#fff':e.color;
    ctx.lineWidth=4;
    ctx.lineCap='round';
    ctx.lineJoin='round';
  }

  function drawChronophage20260720(e,t,enraged){
    const blades=enraged?12:9;
    ctx.save();
    ctx.rotate(-t*.045);
    for(let i=0;i<blades;i++){
      ctx.save();
      ctx.rotate(i/blades*TAU+(i%2?-.08:.08));
      ctx.globalAlpha=i%3===0?.95:.62;
      ctx.fillStyle=i%2?'#163b3e':'#0a2428';
      ctx.strokeStyle=i%3===0?'#e3fffa':e.color;
      ctx.lineWidth=i%3===0?3.2:2;
      ctx.beginPath();
      ctx.moveTo(e.r*.30,-e.r*.10);
      ctx.lineTo(e.r*(i%2?1.55:1.30),-e.r*.25);
      ctx.lineTo(e.r*(i%2?1.82:1.58),0);
      ctx.lineTo(e.r*(i%2?1.55:1.30),e.r*.25);
      ctx.lineTo(e.r*.30,e.r*.10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    ctx.save();
    ctx.rotate(t*.11);
    ctx.setLineDash([18,9]);
    ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,0,e.r*.92,.25,Math.PI-.18);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,e.r*.92,Math.PI+.32,TAU-.12);ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    ctx.fillStyle='#061417';
    ctx.beginPath();
    ctx.moveTo(0,-e.r*.62);
    ctx.lineTo(e.r*.34,-e.r*.12);
    ctx.lineTo(e.r*.18,e.r*.62);
    ctx.lineTo(-e.r*.18,e.r*.62);
    ctx.lineTo(-e.r*.34,-e.r*.12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle='#dffff9';
    ctx.lineWidth=4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-e.r*.24,-e.r*.18);ctx.lineTo(e.r*.24,e.r*.18);
    ctx.moveTo(e.r*.24,-e.r*.18);ctx.lineTo(-e.r*.24,e.r*.18);
    ctx.stroke();
  }

  function drawStarforge20260720(e,t,enraged){
    const plates=enraged?10:8;
    ctx.save();
    ctx.rotate(t*.028);
    for(let i=0;i<plates;i++){
      ctx.save();
      ctx.rotate(i/plates*TAU);
      const long=i%2===0;
      ctx.fillStyle=long?'#431006':'#1b0905';
      ctx.strokeStyle=long?'#ffe7a0':'#ff7b35';
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(e.r*.40,-e.r*.18);
      ctx.lineTo(e.r*(long?1.72:1.32),-e.r*.44);
      ctx.lineTo(e.r*(long?2.12:1.64),0);
      ctx.lineTo(e.r*(long?1.72:1.32),e.r*.44);
      ctx.lineTo(e.r*.40,e.r*.18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    ctx.fillStyle='#160603';
    ctx.strokeStyle='#fff0b0';
    ctx.lineWidth=5;
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a=i/6*TAU-Math.PI/2,x=Math.cos(a)*e.r*.72,y=Math.sin(a)*e.r*.72;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.fill();ctx.stroke();

    const furnace=ctx.createLinearGradient(0,-e.r*.48,0,e.r*.48);
    furnace.addColorStop(0,'#fff8d8');
    furnace.addColorStop(.30,'#ffcf57');
    furnace.addColorStop(.72,'#ff5d22');
    furnace.addColorStop(1,'#5b0c02');
    ctx.fillStyle=furnace;
    ctx.fillRect(-e.r*.19,-e.r*.48,e.r*.38,e.r*.96);
    ctx.fillStyle='#fff';
    ctx.fillRect(-e.r*.055,-e.r*.54,e.r*.11,e.r*1.08);
  }

  function drawLastConstellation20260720(e,t,enraged){
    const count=enraged?10:8,pts=[];
    for(let i=0;i<count;i++){
      const a=i/count*TAU+t*(i%2?.024:-.018),rr=e.r*(i%3===0?3.35:i%2?2.55:1.75);
      pts.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr});
    }
    ctx.globalAlpha=.52;
    ctx.lineWidth=1.5;
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+(i%2?3:2))%pts.length];
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    ctx.globalAlpha=1;
    for(const [i,p] of pts.entries()){
      ctx.fillStyle=i%3===0?'#ffffff':'#aebfff';
      ctx.shadowBlur=18;
      ctx.shadowColor=e.color;
      ctx.beginPath();
      ctx.moveTo(p.x,p.y-7);ctx.lineTo(p.x+5,p.y);ctx.lineTo(p.x,p.y+7);ctx.lineTo(p.x-5,p.y);
      ctx.closePath();ctx.fill();
    }
    ctx.shadowBlur=0;
    ctx.fillStyle='#02030a';
    ctx.strokeStyle='#edf2ff';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(0,-e.r*.95);
    ctx.lineTo(e.r*.58,-e.r*.10);
    ctx.lineTo(e.r*.20,e.r*.78);
    ctx.lineTo(-e.r*.42,e.r*.54);
    ctx.lineTo(-e.r*.62,-e.r*.22);
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#b7c9ff';
    ctx.beginPath();ctx.arc(0,0,e.r*.18,0,TAU);ctx.fill();
  }

  drawEliteShape=function restoredApexVisuals(e){
    const f=e?.eliteForm||e?.apexForm||e?.variant;
    if(!['chronophage','starforge','lastconstellation'].includes(f))return baseDrawEliteShape(e);
    const t=e.phase||0,enraged=e.kind==='apex'&&e.apexPhase===2;
    ctx.save();
    setup(e);
    if(f==='chronophage')drawChronophage20260720(e,t,enraged);
    else if(f==='starforge')drawStarforge20260720(e,t,enraged);
    else drawLastConstellation20260720(e,t,enraged);
    ctx.globalAlpha=1;
    ctx.shadowBlur=0;
    ctx.setLineDash([]);
    ctx.restore();
  };

  // The abandoned World Devourer prototype must not layer an extra body or replace canonical Apex AI.
  if(typeof drawAtroposWorldBody==='function')drawAtroposWorldBody=function restoredChronophageHasNoPrototypeBody(){};
  window.stackfallApexVisualRestore='pre-9af0cdec-2026-07-20';
})();
