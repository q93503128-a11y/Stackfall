(function(){
  const TRAIT_RASTER_CACHE=new Map();
  function traitRaster(key,size,painter){return cachedRasterSurface(TRAIT_RASTER_CACHE,key,size,painter,48);}
  function traitIconRaster(kind,color='#fff'){
    return traitRaster(`trait:${kind}:${color}`,160,(g,sz)=>{const c=sz/2;g.save();g.translate(c,c);
      if(kind==='stellar'){g.translate(0,-43);g.shadowBlur=22;g.shadowColor='#ffe184';g.strokeStyle='rgba(255,230,145,.75)';g.lineWidth=1.4;g.beginPath();g.ellipse(0,8,21,6,0,0,TAU);g.stroke();const grad=g.createLinearGradient(0,-22,0,10);grad.addColorStop(0,'#ffffff');grad.addColorStop(.35,'#ffe79a');grad.addColorStop(1,'#ff9e45');g.fillStyle=grad;for(let i=-2;i<=2;i++){const h=i===0?22:Math.abs(i)===1?16:11,px=i*8;g.beginPath();g.moveTo(px-4,8);g.lineTo(px,-h);g.lineTo(px+4,8);g.closePath();g.fill();}g.fillStyle='#fff7ce';g.rotate(Math.PI/4);g.fillRect(-3.5,-3.5,7,7);}
      else if(kind==='aegis'){g.strokeStyle='rgba(131,255,209,.58)';g.lineWidth=2;g.setLineDash([9,8]);g.beginPath();g.arc(0,0,47,0,TAU);g.stroke();g.setLineDash([]);}
      else if(kind==='singularity'){g.fillStyle='#f0a2ff';g.shadowBlur=16;g.shadowColor='#e65cff';drawStarPath(6,2.5,7,0,g);g.fill();}
      else if(kind==='eclipse'){g.strokeStyle='#ff76bd';g.lineWidth=4;g.shadowBlur=15;g.shadowColor='#ff76bd';g.beginPath();g.arc(0,0,55,-1.0,1.0);g.stroke();}
      else if(kind==='chrono'){g.strokeStyle='#8fffe0';g.lineWidth=1.4;for(let i=0;i<12;i++){const a=i/12*TAU;g.beginPath();g.moveTo(Math.cos(a)*48,Math.sin(a)*48);g.lineTo(Math.cos(a)*55,Math.sin(a)*55);g.stroke();}}
      else if(kind==='harvest'){for(let i=0;i<5;i++){const a=i/5*TAU;g.fillStyle=i%2?'#ff9a9a':'#ffd1c9';g.beginPath();g.ellipse(Math.cos(a)*59,Math.sin(a)*31,3,7,a,0,TAU);g.fill();}}
      else if(kind==='augment'){g.fillStyle=color;g.shadowBlur=8;g.shadowColor=color;g.beginPath();g.arc(0,0,2.2,0,TAU);g.fill();}
      g.restore();});
  }
  drawTraitSignatures=function drawRefinedTraitSignatures(x,y,t){
    const traits=state.bossTraits||{},augments=state.weaponAugments||{};ctx.save();ctx.translate(x,y);
    if(traits.stellar){const image=traitIconRaster('stellar');ctx.save();ctx.translate(0,Math.sin(t*.0031)*1.8);ctx.drawImage(image,-80,-80,160,160);for(let i=0;i<3;i++){const a=t*.0012+i*TAU/3;ctx.fillStyle='#fff2a6';ctx.beginPath();ctx.arc(Math.cos(a)*27,5+Math.sin(a)*8,1.6,0,TAU);ctx.fill();}ctx.restore();}
    if(traits.aegis){const image=traitIconRaster('aegis');ctx.save();ctx.rotate(-t*.00022);ctx.drawImage(image,-80,-80,160,160);ctx.restore();}
    if(traits.singularity){const a=t*.00047+1.2,image=traitIconRaster('singularity');ctx.save();ctx.translate(Math.cos(a)*51,Math.sin(a)*23);ctx.rotate(a);ctx.drawImage(image,-80,-80,160,160);ctx.restore();}
    if(traits.eclipse){const image=traitIconRaster('eclipse');ctx.save();ctx.rotate(t*.00013);ctx.drawImage(image,-80,-80,160,160);ctx.restore();}
    if(traits.chrono){const image=traitIconRaster('chrono');ctx.save();ctx.rotate(t*.00036);ctx.drawImage(image,-80,-80,160,160);ctx.restore();}
    if(traits.harvest){const image=traitIconRaster('harvest');ctx.save();ctx.rotate(-t*.00029);ctx.drawImage(image,-80,-80,160,160);ctx.restore();}
    let augmentCount=0;for(const key in augments)if(augments[key])augmentCount++;if(augmentCount){ctx.save();ctx.rotate(t*.00018);let index=0;for(const key in augments){if(!augments[key])continue;const a=index/augmentCount*TAU,rr=66+(index%2)*7,color=WEAPONS[key]?.color||'#fff',image=traitIconRaster('augment',color);ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.drawImage(image,-80,-80,160,160);ctx.restore();index++;}ctx.restore();}ctx.restore();
  };

  const baseStartRealmTransition=startRealmTransition;
  startRealmTransition=function startTaggedRealmTransition(target,options={}){
    const apex=options.apex??String(target||'').startsWith('apex-'),tagged={...options,apex,owner:options.owner||(apex?'apex':null)};
    const serial=baseStartRealmTransition(target,tagged);if(apex)audio.apexIntro?.(tagged.form);return serial;
  };
  const baseDrawRealmCinematicOverlay=drawRealmCinematicOverlay;
  function drawApexSigil(form,x,y,t,p,color){
    ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.shadowBlur=30;ctx.shadowColor=color;
    if(form==='chronophage'){
      for(let i=0;i<7;i++){const a=-2.25+i*.72,rr=52+(i%3)*28,lag=Math.sin(t*(.7+i*.08)+i)*16;ctx.save();ctx.rotate(a);ctx.translate(rr+lag,0);ctx.rotate((i%2?1:-1)*(.34+t*.05));ctx.globalAlpha=.45+(i%3)*.16;ctx.lineWidth=i%3===0?4:2;ctx.beginPath();ctx.moveTo(-32,-12);ctx.lineTo(18,-24);ctx.lineTo(38,3);ctx.lineTo(-8,25);ctx.closePath();ctx.stroke();ctx.restore();}
      ctx.globalAlpha=.9;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,-72);ctx.lineTo(10,-28);ctx.lineTo(-6,-8);ctx.lineTo(18,18);ctx.lineTo(-12,72);ctx.stroke();
    }else if(form==='starforge'){
      const g=ctx.createRadialGradient(0,0,5,0,0,96);g.addColorStop(0,'#fff');g.addColorStop(.22,'#fff0a6');g.addColorStop(.58,'#ff7933');g.addColorStop(1,'rgba(255,54,15,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,92,108,0,0,TAU);ctx.fill();for(let i=0;i<6;i++){ctx.save();ctx.rotate(i/6*TAU+(i%2?.12:-.08));ctx.translate(68+(i%2)*12,0);ctx.fillStyle='#240b06';ctx.strokeStyle=i%2?'#ff8a3c':'#ffd77e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-26,-34);ctx.lineTo(58,-22);ctx.lineTo(76,4);ctx.lineTo(44,32);ctx.lineTo(-30,20);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}
    else{
      ctx.lineWidth=2.2;const pts=[];for(let i=0;i<9;i++){const a=i/9*TAU-t*.035,rr=i%2?92:122,pt={x:Math.cos(a)*rr,y:Math.sin(a)*rr};pts.push(pt);ctx.save();ctx.translate(pt.x,pt.y);ctx.rotate(a+t*.08);ctx.fillRect(-4,-13,8,26);ctx.restore();}ctx.globalAlpha=.34;for(let i=0;i<pts.length;i++){if(i%3===2)continue;const a=pts[i],b=pts[(i+3)%pts.length];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(-10,-78);ctx.lineTo(24,-38);ctx.lineTo(8,-4);ctx.lineTo(30,42);ctx.lineTo(-6,82);ctx.lineTo(-28,30);ctx.lineTo(-14,-12);ctx.lineTo(-34,-46);ctx.closePath();ctx.stroke();}
    ctx.restore();
  }
  drawRealmCinematicOverlay=function drawDistinctApexOverlay(){
    const tr=state.realmTransition;if(!tr?.apex)return baseDrawRealmCinematicOverlay();
    const p=clamp(tr.elapsed/tr.duration,0,1),fade=Math.sin(Math.PI*p),exit=tr.owner==='apex-exit',reveal=exit?1-clamp((p-.12)/.72,0,1):clamp((p-.22)/.45,0,1),color=tr.form==='chronophage'?'#79ffe1':tr.form==='starforge'?'#ffb04e':tr.form==='lastconstellation'?'#b7c9ff':transitionColor(tr.to),x=vw/2,y=vh*.42,t=tr.elapsed;
    ctx.save();ctx.fillStyle=`rgba(0,0,7,${.38+.38*fade})`;ctx.fillRect(0,0,vw,vh);ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,0,vw,Math.max(22,vh*.09));ctx.fillRect(0,vh-Math.max(22,vh*.09),vw,Math.max(22,vh*.09));
    ctx.translate(x,y);ctx.globalAlpha=fade*.42;ctx.strokeStyle=color;ctx.lineWidth=1.2;for(let i=0;i<48;i++){const a=i/48*TAU+Math.sin(i*9.17)*.05,r1=220*(1-reveal)+35,r2=Math.max(vw,vh)*(.48+.32*reveal);ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke();}ctx.restore();
    ctx.save();ctx.globalAlpha=fade*reveal;drawApexSigil(tr.form,x,y,t,p,color);ctx.restore();
    if(p>.45){const q=clamp((p-.45)/.23,0,1);ctx.save();ctx.globalAlpha=fade*q;ctx.textAlign='center';ctx.shadowBlur=36;ctx.shadowColor=color;ctx.fillStyle='#fff';ctx.font=`900 ${Math.min(58,vw*.058)}px Black Han Sans, sans-serif`;ctx.fillText(tr.title,vw/2,vh*.65);ctx.shadowBlur=0;ctx.fillStyle=color;ctx.font='900 11px IBM Plex Sans KR, sans-serif';ctx.letterSpacing='0.18em';ctx.fillText(exit?'— APEX ENTITY COLLAPSE —':'— APEX ENTITY DESCENT —',vw/2,vh*.65+30);ctx.fillStyle='rgba(220,230,255,.76)';ctx.font='700 10px IBM Plex Sans KR, sans-serif';ctx.fillText(tr.subtitle,vw/2,vh*.65+50);ctx.restore();}
  };

  if(audio.ctx)audio.syncAmbient();
})();
