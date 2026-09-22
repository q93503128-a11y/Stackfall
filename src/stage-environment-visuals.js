(()=>{
  'use strict';
  const isEnvironment=t=>t?.impactStyle==='stage-env-zone'||t?.impactStyle==='stage-env-line';
  const familyColor=(family,alt=false)=>family==='bloom'?(alt?'#77d8bd':'#d58cff'):family==='array'?(alt?'#e2ba68':'#70dce9'):(alt?'#9aa8ff':'#77dfff');
  const variantSeed=value=>{let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0)/4294967295;};

  function drawRouteZone(t,p,progress,pulse){
    const r=t.r,seed=variantSeed(t.environmentVariant),rotation=seed*TAU+progress*.18;
    ctx.rotate(rotation);ctx.fillStyle='rgba(64,102,162,.055)';ctx.strokeStyle=familyColor('route');ctx.lineWidth=2.2;ctx.setLineDash([18,10]);
    ctx.beginPath();ctx.arc(0,0,r*.92,0,TAU);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<6;i++){const a=i*TAU/6,inner=r*.48,outer=r*(.90+.04*(i%2));ctx.globalAlpha=.38+.34*progress;ctx.strokeStyle=i%2?'#9aa8ff':'#77dfff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();const x=Math.cos(a)*r*.70,y=Math.sin(a)*r*.70;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='rgba(11,24,48,.88)';ctx.strokeStyle='rgba(174,216,255,.58)';ctx.fillRect(-11,-5,22,10);ctx.strokeRect(-11,-5,22,10);ctx.restore();}
    ctx.globalAlpha=.22+.26*progress;ctx.fillStyle='#77dfff';ctx.beginPath();ctx.arc(0,0,r*(.18+.05*pulse),0,TAU);ctx.fill();
  }
  function drawBloomZone(t,p,progress,pulse){
    const r=t.r,seed=variantSeed(t.environmentVariant),rotation=seed*TAU-progress*.10;ctx.rotate(rotation);
    for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*TAU/6);ctx.globalAlpha=.10+.16*progress;ctx.fillStyle=i%2?'#77d8bd':'#d58cff';ctx.strokeStyle=i%2?'rgba(119,216,189,.72)':'rgba(213,140,255,.72)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(r*.12,-r*.10);ctx.bezierCurveTo(r*.42,-r*.42,r*.92,-r*.27,r*(.92+.03*pulse),0);ctx.bezierCurveTo(r*.77,r*.27,r*.38,r*.39,r*.12,r*.10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    ctx.globalAlpha=.55;ctx.strokeStyle='#d8f5df';ctx.lineWidth=1.4;for(let i=0;i<3;i++){const a=i*TAU/3+progress*.28;ctx.beginPath();ctx.arc(0,0,r*(.34+i*.18),a,a+Math.PI*.82);ctx.stroke();}
    ctx.fillStyle='rgba(8,20,17,.90)';ctx.strokeStyle='#a9f0d3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*.16,0,TAU);ctx.fill();ctx.stroke();
  }
  function drawArrayZone(t,p,progress,pulse){
    const r=t.r,seed=variantSeed(t.environmentVariant),rotation=(Math.floor(seed*6)/6)*TAU;ctx.rotate(rotation);ctx.strokeStyle=familyColor('array');ctx.lineWidth=1.8;ctx.globalAlpha=.52+.28*progress;
    for(let ring=0;ring<2;ring++){const rr=r*(ring?.82:.58);ctx.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/2,x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}
    for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/2;ctx.strokeStyle=i%2?'#70dce9':'#e2ba68';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.58,Math.sin(a)*r*.58);ctx.lineTo(Math.cos(a)*r*.90,Math.sin(a)*r*.90);ctx.stroke();}
    const scan=-r+2*r*((progress*1.8+seed)%1);ctx.globalAlpha=.18+.18*pulse;ctx.fillStyle='#e8fbff';ctx.fillRect(-r*.78,scan-2,r*1.56,4);
  }
  function drawEnvironmentZone(t){
    const p=worldToScreen(t.x,t.y),progress=1-clamp(t.life/Math.max(.001,t.max),0,1),pulse=.5+.5*Math.sin(performance.now()/90+(t.phase||0));
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=.92;ctx.shadowBlur=10;ctx.shadowColor=familyColor(t.environmentFamily);
    if(t.environmentFamily==='bloom')drawBloomZone(t,p,progress,pulse);else if(t.environmentFamily==='array')drawArrayZone(t,p,progress,pulse);else drawRouteZone(t,p,progress,pulse);
    ctx.restore();
  }
  function drawRouteLine(t,p,progress){
    const x2=p.x+Math.cos(t.a)*t.length,y2=p.y+Math.sin(t.a)*t.length,nx=-Math.sin(t.a),ny=Math.cos(t.a),half=Math.max(7,t.width*.62),steps=Math.max(3,Math.min(9,Math.round(t.length/85)));
    ctx.strokeStyle='rgba(119,223,255,.58)';ctx.lineWidth=1.4;ctx.setLineDash([22,13]);ctx.lineDashOffset=-performance.now()/55;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(p.x+nx*half*side,p.y+ny*half*side);ctx.lineTo(x2+nx*half*side,y2+ny*half*side);ctx.stroke();}
    ctx.setLineDash([]);for(let i=0;i<=steps;i++){const q=i/steps,x=lerp(p.x,x2,q),y=lerp(p.y,y2,q),span=half*(.72+.22*(i%2));ctx.strokeStyle=i%2?'rgba(154,168,255,.62)':'rgba(119,223,255,.70)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-nx*span,y-ny*span);ctx.lineTo(x+nx*span,y+ny*span);ctx.stroke();}
    ctx.globalAlpha=.11+.12*progress;ctx.fillStyle='#77dfff';ctx.beginPath();ctx.moveTo(p.x+nx*half,p.y+ny*half);ctx.lineTo(x2+nx*half,y2+ny*half);ctx.lineTo(x2-nx*half,y2-ny*half);ctx.lineTo(p.x-nx*half,p.y-ny*half);ctx.closePath();ctx.fill();
  }
  function drawBloomLine(t,p,progress){
    const x2=p.x+Math.cos(t.a)*t.length,y2=p.y+Math.sin(t.a)*t.length,nx=-Math.sin(t.a),ny=Math.cos(t.a),half=Math.max(8,t.width*.72),seed=variantSeed(t.environmentVariant);
    for(const side of[-1,1]){ctx.strokeStyle=side<0?'rgba(213,140,255,.72)':'rgba(119,216,189,.72)';ctx.lineWidth=Math.max(3,t.width*.22);ctx.beginPath();ctx.moveTo(p.x+nx*half*side,p.y+ny*half*side);const cx=(p.x+x2)/2+nx*half*side*(1.8+seed),cy=(p.y+y2)/2+ny*half*side*(1.8+seed);ctx.quadraticCurveTo(cx,cy,x2+nx*half*side,y2+ny*half*side);ctx.stroke();}
    const nodes=Math.max(3,Math.min(7,Math.round(t.length/110)));for(let i=1;i<nodes;i++){const q=i/nodes,x=lerp(p.x,x2,q),y=lerp(p.y,y2,q),rr=4+(i%2)*2;ctx.fillStyle=i%2?'#d58cff':'#77d8bd';ctx.globalAlpha=.42+.35*progress;ctx.beginPath();ctx.arc(x,y,rr,0,TAU);ctx.fill();}
  }
  function drawArrayLine(t,p,progress){
    const x2=p.x+Math.cos(t.a)*t.length,y2=p.y+Math.sin(t.a)*t.length,nx=-Math.sin(t.a),ny=Math.cos(t.a),half=Math.max(8,t.width*.70),blocks=Math.max(4,Math.min(12,Math.round(t.length/65)));
    ctx.globalAlpha=.13+.15*progress;ctx.fillStyle='#70dce9';ctx.beginPath();ctx.moveTo(p.x+nx*half,p.y+ny*half);ctx.lineTo(x2+nx*half,y2+ny*half);ctx.lineTo(x2-nx*half,y2-ny*half);ctx.lineTo(p.x-nx*half,p.y-ny*half);ctx.closePath();ctx.fill();
    for(let i=0;i<=blocks;i++){const q=i/blocks,x=lerp(p.x,x2,q),y=lerp(p.y,y2,q),active=(i+Math.floor(performance.now()/120))%3===0;ctx.strokeStyle=active?'rgba(226,186,104,.88)':'rgba(112,220,233,.62)';ctx.lineWidth=active?3:1.4;ctx.beginPath();ctx.moveTo(x-nx*half,y-ny*half);ctx.lineTo(x+nx*half,y+ny*half);ctx.stroke();}
    ctx.strokeStyle='rgba(228,249,255,.58)';ctx.lineWidth=1;ctx.setLineDash([6,9]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
  }
  function drawEnvironmentLine(t){
    const p=worldToScreen(t.x,t.y),progress=1-clamp(t.life/Math.max(.001,t.max),0,1);ctx.save();ctx.globalAlpha=.9;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowBlur=8;ctx.shadowColor=familyColor(t.environmentFamily);
    if(t.environmentFamily==='bloom')drawBloomLine(t,p,progress);else if(t.environmentFamily==='array')drawArrayLine(t,p,progress);else drawRouteLine(t,p,progress);
    ctx.restore();
  }
  function drawEnvironmentTelegraphs(list){for(const t of list){if(!t||t.life<=-.28)continue;t.type==='circle'?drawEnvironmentZone(t):drawEnvironmentLine(t);}}

  const baseDrawTelegraphs=drawTelegraphs;
  drawTelegraphs=function stageEnvironmentTelegraphs(){
    const original=state.entities.telegraphs,environment=[],ordinary=[];
    for(const t of original)(isEnvironment(t)?environment:ordinary).push(t);
    state.entities.telegraphs=ordinary;try{baseDrawTelegraphs();}finally{state.entities.telegraphs=original;}
    drawEnvironmentTelegraphs(environment);
  };

  const baseCircleImpact=triggerCircleImpact;
  triggerCircleImpact=function stageEnvironmentCircleImpact(t){
    if(t?.impactStyle!=='stage-env-zone')return baseCircleImpact(t);
    const family=t.environmentFamily,color=familyColor(family),alt=familyColor(family,true),rings=family==='bloom'?2:1;
    for(let i=0;i<rings;i++)shockwave(t.x,t.y,i?alt:color,t.r*(.72+i*.16),.22+i*.06,2.2);
    const points=family==='array'?6:family==='bloom'?10:8;for(let i=0;i<points;i++){const a=i/points*TAU+(t.phase||0),rr=t.r*(family==='bloom'?.62:.78);spawnParticle(t.x+Math.cos(a)*rr,t.y+Math.sin(a)*rr,i%2?color:alt,1,family==='route'?70:54,2.5);}
    state.camera.shake=Math.max(state.camera.shake,clamp(1.4+(t.damage||0)*.035,1.4,4.2));state.flash=Math.max(state.flash,.035);audio.hit?.(false,'stage-environment');
  };

  const baseLineImpact=triggerLineImpact;
  triggerLineImpact=function stageEnvironmentLineImpact(t,x2,y2){
    if(t?.impactStyle!=='stage-env-line')return baseLineImpact(t,x2,y2);
    const family=t.environmentFamily,color=familyColor(family),alt=familyColor(family,true),steps=family==='array'?7:5,width=Math.max(3,t.width*(family==='bloom'?.62:.48));
    if(state.entities.beams.length<entityCap('beams'))state.entities.beams.push({x1:t.x,y1:t.y,x2,y2,life:.16,max:.16,color,width});
    for(let i=0;i<=steps;i++){const q=i/steps,x=lerp(t.x,x2,q),y=lerp(t.y,y2,q);if(i%2===0)shockwave(x,y,i%4?color:alt,family==='route'?18:24,.16,1.3);spawnParticle(x,y,i%2?color:alt,1,52,2.2);}
    state.camera.shake=Math.max(state.camera.shake,clamp(1.2+(t.damage||0)*.03,1.2,3.8));state.flash=Math.max(state.flash,.025);audio.hit?.(false,'stage-environment');
  };

  window.stackfallStageEnvironmentVisualDiagnostics=()=>({active:state.entities.telegraphs.filter(isEnvironment).length,families:[...new Set(state.entities.telegraphs.filter(isEnvironment).map(t=>t.environmentFamily))]});
})();