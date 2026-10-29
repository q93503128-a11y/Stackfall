// Chronophage-only telegraph/result language for temporal-shear attacks.
// Loaded after the approved Apex identity and phase passes so Omega/Constellation render paths stay untouched.
(()=>{
  if(window.stackfallAtroposTimeShear==='v1')return;
  window.stackfallAtroposTimeShear='v1';
  const baseDrawTelegraphsShear=typeof drawTelegraphs==='function'?drawTelegraphs:null;
  const baseTriggerLineImpactShear=typeof triggerLineImpact==='function'?triggerLineImpact:null;
  if(!baseDrawTelegraphsShear||!baseTriggerLineImpactShear)return;
  const SHEARS=[],OTHERS=[];
  const isShear=t=>t?.type==='line'&&t?.impactStyle==='temporal-shear';
  const point=(x,y)=>typeof worldToScreen==='function'?worldToScreen(x,y):{x:x-player.x+vw/2,y:y-player.y+vh/2};

  function drawTemporalShear(t){
    const x2=t.x+Math.cos(t.a)*t.length,y2=t.y+Math.sin(t.a)*t.length,a=point(t.x,t.y),b=point(x2,y2);
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
    const progress=1-clamp(t.life/Math.max(.001,t.max),0,1),major=t.width>=8.5,boundary=Math.max(3.5,t.width*(major?.34:.28));
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    // Dark temporal slit gives the warning a cut/tear silhouette without looking like a fired white laser.
    ctx.globalAlpha=.18+.20*progress;ctx.strokeStyle='rgba(2,18,22,.92)';ctx.lineWidth=Math.max(2,t.width*(major?.48:.36));ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    // Two asynchronous fracture edges. Their moving dash cadence is the warning, not the hit frame.
    for(const side of[-1,1]){
      ctx.globalAlpha=(major?.34:.24)+progress*(major?.46:.36);ctx.strokeStyle=side<0?'#79ffe1':'#dffff9';ctx.lineWidth=major?1.8:1.25;ctx.setLineDash(major?[13,9]:[8,10]);ctx.lineDashOffset=-(state.time||0)*(side<0?34:-27)-progress*22;
      ctx.beginPath();ctx.moveTo(a.x+nx*side*boundary,a.y+ny*side*boundary);ctx.lineTo(b.x+nx*side*boundary,b.y+ny*side*boundary);ctx.stroke();
    }
    ctx.setLineDash([]);
    // Clock ticks make the attack read as a time fracture even when several scars overlap.
    const ticks=major?5:3;
    for(let i=0;i<ticks;i++){
      const q=(i+1)/(ticks+1),cx=a.x+dx*q,cy=a.y+dy*q,s=(major?6.5:4.2)*(1+.25*progress)*(i%2?1:.72);
      ctx.globalAlpha=.28+.48*progress;ctx.strokeStyle=i%2?'#9fffea':'#ffffff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx-nx*s,cy-ny*s);ctx.lineTo(cx+nx*s,cy+ny*s);ctx.stroke();
    }
    // A luminous timing cursor travels toward the impending rupture point.
    const q=.08+.84*progress,cx=a.x+dx*q,cy=a.y+dy*q;
    ctx.globalAlpha=.55+.38*progress;ctx.fillStyle=major?'#ffffff':'#bffdf3';ctx.shadowBlur=major?10:6;ctx.shadowColor='#79ffe1';ctx.beginPath();ctx.arc(cx,cy,major?2.8:2.0,0,TAU);ctx.fill();
    if(major){
      const mx=(a.x+b.x)*.5,my=(a.y+b.y)*.5,r=8+progress*5;ctx.shadowBlur=0;ctx.globalAlpha=.18+.32*progress;ctx.strokeStyle='#79ffe1';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(mx,my,r,.18,Math.PI-.22);ctx.stroke();ctx.beginPath();ctx.arc(mx,my,r,Math.PI+.30,TAU-.12);ctx.stroke();
    }
    ctx.restore();
  }

  drawTelegraphs=function drawTelegraphsWithTemporalShears(){
    const original=state.entities.telegraphs;SHEARS.length=0;OTHERS.length=0;
    for(const t of original)(isShear(t)?SHEARS:OTHERS).push(t);
    state.entities.telegraphs=OTHERS;
    try{baseDrawTelegraphsShear();}finally{state.entities.telegraphs=original;}
    for(const t of SHEARS)drawTemporalShear(t);
  };

  function shearImpact(t,x2,y2){
    const dx=x2-t.x,dy=y2-t.y,major=t.width>=8.5;
    const spans=major?[[0,.19],[.24,.46],[.51,.73],[.79,1]]:[[0,.42],[.50,1]];
    if(typeof spawnBeamEffect==='function')for(const [s,e]of spans){
      spawnBeamEffect(t.x+dx*s,t.y+dy*s,t.x+dx*e,t.y+dy*e,major?.16:.11,s===0?'#ffffff':s>.5?'#79ffe1':'#bffdf3',Math.max(2.0,t.width*(major?.34:.25)));
    }
    if(typeof spawnParticle==='function')for(const q of major?[.10,.32,.55,.78,.94]:[.25,.72]){
      spawnParticle(t.x+dx*q,t.y+dy*q,q>.7?'#79ffe1':'#dffff9',major?2:1,major?78:48,major?2.8:2.0);
    }
    if(major){
      const mx=t.x+dx*.5,my=t.y+dy*.5;if(typeof shockwave==='function')shockwave(mx,my,'#bffdf3',44,.22,1.8);
      state.camera.shake=Math.max(state.camera.shake,3.2);state.flash=Math.max(state.flash,.042);if(typeof playBossImpactAudio==='function')playBossImpactAudio(.64);
    }
  }

  triggerLineImpact=function triggerLineImpactWithTemporalShear(t,x2,y2){
    if(isShear(t)){shearImpact(t,x2,y2);return;}
    return baseTriggerLineImpactShear(t,x2,y2);
  };

  window.stackfallAtroposTimeShearDiagnostics=()=>({version:window.stackfallAtroposTimeShear,active:state.entities.telegraphs.filter(isShear).length});
})();
