(()=>{
  'use strict';
  const isEnvironment=t=>t?.impactStyle==='stage-env-zone'||t?.impactStyle==='stage-env-line';
  const familyColor=(family,alt=false)=>family==='bloom'?(alt?'#77d8bd':'#d58cff'):family==='array'?(alt?'#e2ba68':'#70dce9'):(alt?'#9aa8ff':'#77dfff');
  const variantSeed=value=>{let h=2166136261;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0)/4294967295;};

  const hud=document.querySelector('#hud');
  const environmentNotice=document.createElement('div');
  environmentNotice.className='stage-environment-notice hidden';
  environmentNotice.innerHTML='<i></i><div><span></span><strong></strong><small></small></div>';
  hud?.appendChild(environmentNotice);
  let environmentNoticeSerial=0;
  function environmentLabel(family){
    const ko=GAME_SETTINGS.language==='ko';
    if(family==='bloom')return ko?'생체 환경 이상':'BIOLOGICAL HAZARD';
    if(family==='array')return ko?'중계망 환경 이상':'NETWORK HAZARD';
    return ko?'항로 환경 이상':'ROUTE HAZARD';
  }
  function showEnvironmentNotice(title,subtitle,context){
    if(!environmentNotice)return;const serial=++environmentNoticeSerial,family=context?.family||'route';
    environmentNotice.dataset.family=family;environmentNotice.querySelector('span').textContent=environmentLabel(family);environmentNotice.querySelector('strong').textContent=title||environmentLabel(family);environmentNotice.querySelector('small').textContent=subtitle||'';
    environmentNotice.classList.remove('hidden');requestAnimationFrame(()=>{if(serial===environmentNoticeSerial)environmentNotice.classList.add('show');});
    scheduleUiAction(1550,()=>{if(serial!==environmentNoticeSerial)return;environmentNotice.classList.remove('show');scheduleUiAction(180,()=>{if(serial===environmentNoticeSerial)environmentNotice.classList.add('hidden');});});
  }
  const baseShowBossNotice=showBossNotice;
  showBossNotice=function stageAwareNotice(title,subtitle){
    const context=state.stageEnvironmentTelegraphContext;
    if(context){showEnvironmentNotice(title,subtitle,context);return;}
    return baseShowBossNotice(title,subtitle);
  };

  function drawRouteZone(t,p,progress,pulse){
    const r=t.r,seed=variantSeed(t.environmentVariant),rotation=seed*TAU+progress*.18;
    ctx.rotate(rotation);ctx.fillStyle='rgba(64,102,162,.055)';ctx.strokeStyle=familyColor('route');ctx.lineWidth=2.2;ctx.setLineDash([18,10]);
    ctx.beginPath();ctx.arc(0,0,r*.92,0,TAU);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<6;i++){const a=i*TAU/6,inner=r*.48,outer=r*(.90+.04*(i%2));ctx.globalAlpha=.38+.34*progress;ctx.strokeStyle=i%2?'#9aa8ff':'#77dfff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();const x=Math.cos(a)*r*.70,y=Math.sin(a)*r*.70;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='rgba(11,24,48,.88)';ctx.strokeStyle='rgba(174,216,255,.58)';ctx.fillRect(-11,-5,22,10);ctx.strokeRect(-11,-5,22,10);ctx.restore();}
    ctx.globalAlpha=.22+.26*progress;ctx.fillStyle='#77dfff';ctx.beginPath();ctx.arc(0,0,r*(.18+.05*pulse),0,TAU);ctx.fill();
  }
  function drawCollapseRouteZone(t,p,progress,pulse){
    const r=t.r,seed=variantSeed(t.environmentVariant),rotation=(seed-.5)*.34;ctx.rotate(rotation);
    ctx.globalAlpha=.09+.12*progress;ctx.fillStyle='#7b8fcb';ctx.beginPath();ctx.arc(0,0,r*.94,0,TAU);ctx.fill();
    ctx.globalAlpha=.46+.34*progress;ctx.strokeStyle='#aab8ed';ctx.lineWidth=2.4;ctx.setLineDash([16,9]);ctx.lineDashOffset=-performance.now()/46;ctx.beginPath();ctx.arc(0,0,r*.92,0,TAU);ctx.stroke();ctx.setLineDash([]);
    for(let seam=0;seam<5;seam++){const a=seam/5*TAU+seed*1.7,inner=r*(.18+(seam%2)*.10),outer=r*(.74+(seam%3)*.07),bend=(seam%2?1:-1)*.16;ctx.strokeStyle=seam%2?'#8498d5':'#d9e2ff';ctx.lineWidth=1.8+progress*1.4;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a+bend)*r*.43,Math.sin(a+bend)*r*.43);ctx.lineTo(Math.cos(a-bend*.6)*outer,Math.sin(a-bend*.6)*outer);ctx.stroke();}
    for(let plate=0;plate<4;plate++){const a=plate/4*TAU+Math.PI/4,x=Math.cos(a)*r*.58,y=Math.sin(a)*r*.58;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='rgba(10,17,36,.86)';ctx.strokeStyle='rgba(206,218,255,.62)';ctx.lineWidth=1.4;ctx.fillRect(-15,-7,30,14);ctx.strokeRect(-15,-7,30,14);ctx.strokeStyle='#ffcf70';ctx.beginPath();ctx.moveTo(-10,-5);ctx.lineTo(-2,5);ctx.moveTo(2,-5);ctx.lineTo(10,5);ctx.stroke();ctx.restore();}
    ctx.globalAlpha=.42+.30*progress;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,r*(.22+.05*pulse),0,TAU);ctx.stroke();
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
    if(t.environmentFamily==='bloom')drawBloomZone(t,p,progress,pulse);else if(t.environmentFamily==='array')drawArrayZone(t,p,progress,pulse);else if(t.environmentVariant==='collapse-pulse')drawCollapseRouteZone(t,p,progress,pulse);else drawRouteZone(t,p,progress,pulse);
    ctx.restore();
  }
  function drawStageTwoIonShear(t,p,progress){
    const x2=p.x+Math.cos(t.a)*t.length,y2=p.y+Math.sin(t.a)*t.length,dx=Math.cos(t.a),dy=Math.sin(t.a),nx=-dy,ny=dx,deep=t.environmentVariant==='deep-shear',half=Math.max(deep?18:13,t.width*(deep?.90:.72)),now=performance.now(),flow=(now*.00022+(t.phase||0))%1;
    ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';
    const grad=ctx.createLinearGradient(p.x,p.y,x2,y2);grad.addColorStop(0,'rgba(90,230,255,.10)');grad.addColorStop(.42,deep?'rgba(255,113,220,.30)':'rgba(117,229,255,.26)');grad.addColorStop(.72,deep?'rgba(118,220,255,.26)':'rgba(255,129,218,.20)');grad.addColorStop(1,'rgba(133,111,255,.08)');
    ctx.globalAlpha=.36+.24*progress;ctx.strokeStyle=grad;ctx.lineWidth=half*2.15;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.bezierCurveTo(lerp(p.x,x2,.32)+nx*half*.55,lerp(p.y,y2,.32)+ny*half*.55,lerp(p.x,x2,.68)-nx*half*.45,lerp(p.y,y2,.68)-ny*half*.45,x2,y2);ctx.stroke();
    ctx.globalAlpha=.76;ctx.strokeStyle=deep?'rgba(255,226,250,.76)':'rgba(220,250,255,.72)';ctx.lineWidth=deep?3.4:2.3;ctx.beginPath();ctx.moveTo(p.x+nx*half*.10,p.y+ny*half*.10);ctx.bezierCurveTo(lerp(p.x,x2,.34)+nx*half*.36,lerp(p.y,y2,.34)+ny*half*.36,lerp(p.x,x2,.66)-nx*half*.30,lerp(p.y,y2,.66)-ny*half*.30,x2-nx*half*.08,y2-ny*half*.08);ctx.stroke();
    const motes=deep?9:6;for(let i=0;i<motes;i++){const q=(flow+i/motes)%1,x=lerp(p.x,x2,q)+nx*Math.sin(q*Math.PI*2+i)*half*.46,y=lerp(p.y,y2,q)+ny*Math.sin(q*Math.PI*2+i)*half*.46;ctx.globalAlpha=.25+.45*progress;ctx.fillStyle=i%2?'#ff91d9':'#8cecff';ctx.beginPath();ctx.ellipse(x,y,deep?5:3.5,deep?2.1:1.6,t.a,0,TAU);ctx.fill();}
  }
  function drawRouteLine(t,p,progress){
    const x2=p.x+Math.cos(t.a)*t.length,y2=p.y+Math.sin(t.a)*t.length,nx=-Math.sin(t.a),ny=Math.cos(t.a),half=Math.max(7,t.width*.62),steps=Math.max(3,Math.min(9,Math.round(t.length/85)));
    ctx.strokeStyle='rgba(119,223,255,.58)';ctx.lineWidth=1.4;ctx.setLineDash([22,13]);ctx.lineDashOffset=-performance.now()/55;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(p.x+nx*half*side,p.y+ny*half*side);ctx.lineTo(x2+nx*half*side,y2+ny*half*side);ctx.stroke();}
    ctx.setLineDash([]);for(let i=0;i<=steps;i++){const q=i/steps,x=lerp(p.x,x2,q),y=lerp(p.y,y2,q),span=half*(.72+.22*(i%2));ctx.strokeStyle=i%2?'rgba(154,168,255,.62)':'rgba(119,223,255,.70)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-nx*span,y-ny*span);ctx.lineTo(x+nx*span,y+ny*span);ctx.stroke();}
    ctx.globalAlpha=.11+.12*progress;ctx.fillStyle='#77dfff';ctx.beginPath();ctx.moveTo(p.x+nx*half,p.y+ny*half);ctx.lineTo(x2+nx*half,y2+ny*half);ctx.lineTo(x2-nx*half,y2-ny*half);ctx.lineTo(p.x-nx*half,p.y-ny*half);ctx.closePath();ctx.fill();
  }
  function drawCollapseRouteLine(t,p,progress){
    const x2=p.x+Math.cos(t.a)*t.length,y2=p.y+Math.sin(t.a)*t.length,nx=-Math.sin(t.a),ny=Math.cos(t.a),half=Math.max(8,t.width*.70),segments=Math.max(4,Math.min(10,Math.round(t.length/70)));
    ctx.globalAlpha=.10+.16*progress;ctx.fillStyle='#8294c9';ctx.beginPath();ctx.moveTo(p.x+nx*half,p.y+ny*half);ctx.lineTo(x2+nx*half,y2+ny*half);ctx.lineTo(x2-nx*half,y2-ny*half);ctx.lineTo(p.x-nx*half,p.y-ny*half);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#c7d1f2';ctx.lineWidth=1.7;ctx.setLineDash([18,11]);ctx.lineDashOffset=-performance.now()/44;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(p.x+nx*half*side,p.y+ny*half*side);ctx.lineTo(x2+nx*half*side,y2+ny*half*side);ctx.stroke();}ctx.setLineDash([]);
    for(let i=1;i<segments;i++){const q=i/segments,x=lerp(p.x,x2,q),y=lerp(p.y,y2,q),kick=(i%2?1:-1)*Math.min(14,half*.72);ctx.strokeStyle=i%3===0?'#ffcf70':'rgba(218,226,255,.66)';ctx.lineWidth=i%3===0?2.4:1.5;ctx.beginPath();ctx.moveTo(x-nx*half,y-ny*half);ctx.lineTo(x+nx*kick,y+ny*kick);ctx.lineTo(x+nx*half,y+ny*half);ctx.stroke();}
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
    if(t.environmentStageId==='stage-02'&&(t.environmentVariant==='ion-shear'||t.environmentVariant==='deep-shear'))drawStageTwoIonShear(t,p,progress);else if(t.environmentFamily==='bloom')drawBloomLine(t,p,progress);else if(t.environmentFamily==='array')drawArrayLine(t,p,progress);else if(t.environmentVariant==='collapse-pulse')drawCollapseRouteLine(t,p,progress);else drawRouteLine(t,p,progress);
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
    const family=t.environmentFamily,color=familyColor(family),alt=familyColor(family,true),collapse=family==='route'&&t.environmentVariant==='collapse-pulse',rings=family==='bloom'?2:1;
    for(let i=0;i<rings;i++)shockwave(t.x,t.y,i?alt:color,t.r*(.72+i*.16),.22+i*.06,2.2);
    const points=collapse?6:family==='array'?6:family==='bloom'?10:8;for(let i=0;i<points;i++){const a=i/points*TAU+(t.phase||0),rr=t.r*(family==='bloom'?.62:.78);spawnParticle(t.x+Math.cos(a)*rr,t.y+Math.sin(a)*rr,i%2?color:alt,1,collapse?92:family==='route'?70:54,collapse?3.2:2.5);if(collapse&&state.entities.beams.length<entityCap('beams')){const len=t.r*(.44+(i%3)*.14),x1=t.x+Math.cos(a)*t.r*.12,y1=t.y+Math.sin(a)*t.r*.12;state.entities.beams.push({x1,y1,x2:x1+Math.cos(a)*len,y2:y1+Math.sin(a)*len,life:.28,max:.28,color:i%2?'#aab8ed':'#dce4ff',width:7,stageBossAttack:'fracture'});}}
    state.camera.shake=Math.max(state.camera.shake,clamp(1.4+(t.damage||0)*.035,1.4,4.2));state.flash=Math.max(state.flash,.035);audio.hit?.(false,'stage-environment');
  };

  const baseLineImpact=triggerLineImpact;
  triggerLineImpact=function stageEnvironmentLineImpact(t,x2,y2){
    if(t?.impactStyle!=='stage-env-line')return baseLineImpact(t,x2,y2);
    const family=t.environmentFamily,color=familyColor(family),alt=familyColor(family,true),collapse=family==='route'&&t.environmentVariant==='collapse-pulse',ion=t.environmentStageId==='stage-02'&&(t.environmentVariant==='ion-shear'||t.environmentVariant==='deep-shear'),deep=t.environmentVariant==='deep-shear',steps=ion?(deep?9:7):family==='array'?7:5,width=Math.max(3,t.width*(ion?(deep?.82:.68):family==='bloom'?.62:.48));
    if(state.entities.beams.length<entityCap('beams'))state.entities.beams.push({x1:t.x,y1:t.y,x2,y2,life:collapse?.28:ion?.26:.16,max:collapse?.28:ion?.26:.16,color:ion?(deep?'#ff82d9':'#86edff'):collapse?'#cbd5f4':color,width:ion?Math.max(9,t.width*(deep?.86:.72)):collapse?Math.max(7,t.width*.58):width,...(collapse?{stageBossAttack:'fracture'}:ion?{stageBossAttack:'ion-shear',bend:deep?1.35:.75}:{})});
    for(let i=0;i<=steps;i++){const q=i/steps,x=lerp(t.x,x2,q),y=lerp(t.y,y2,q),pulseColor=ion?(i%2?'#ff91d9':'#8cecff'):(i%4?color:alt);if(i%2===0)shockwave(x,y,pulseColor,ion?(deep?31:24):family==='route'?18:24,ion?.20:.16,ion?1.8:1.3);spawnParticle(x,y,pulseColor,ion?2:1,ion?82:52,ion?3:2.2);}
    state.camera.shake=Math.max(state.camera.shake,ion?clamp(2.1+(t.damage||0)*.045,2.1,5.2):clamp(1.2+(t.damage||0)*.03,1.2,3.8));state.flash=Math.max(state.flash,ion?.05:.025);audio.hit?.(ion,'stage-environment');
  };

  window.stackfallStageEnvironmentVisualDiagnostics=()=>({active:state.entities.telegraphs.filter(isEnvironment).length,families:[...new Set(state.entities.telegraphs.filter(isEnvironment).map(t=>t.environmentFamily))]});
})();