(function(){
  'use strict';

  const RASTER_CACHE=new Map();
  const MAX_RASTERS=32;
  function makeRaster(key,w,h,painter){
    let surface=RASTER_CACHE.get(key);if(surface)return surface;
    surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');
    surface.width=w;surface.height=h;const g=surface.getContext('2d',{alpha:true});painter(g,w,h);
    if(RASTER_CACHE.size>=MAX_RASTERS)RASTER_CACHE.delete(RASTER_CACHE.keys().next().value);
    RASTER_CACHE.set(key,surface);return surface;
  }
  function rgba(hex,alpha){
    const h=String(hex||'#ffffff').replace('#','');if(h.length!==6)return `rgba(255,255,255,${alpha})`;
    const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return `rgba(${r},${g},${b},${alpha})`;
  }
  function sourceFamily(source){
    const s=String(source||'');
    if(s.startsWith('core')||s.includes('stellar-core'))return'core';
    if(s==='ember'||s==='echo-star'||s.includes('ember'))return'ember';
    if(s.includes('comet')&&!s.includes('fragment'))return'comet';
    if(s.includes('fragment')||s.includes('shard')||s.includes('mirror'))return'shard';
    if(s.includes('drone'))return'drone';
    if(s.includes('spiral'))return'spiral';
    return'generic';
  }
  function variantFor(p){const s=String(p.source||'');return s.includes('echo')?'echo':p.awakeningChild?'awakened':'normal';}
  function projectileRaster(kind,variant){
    const key=`${kind}:${variant}`;
    if(kind==='core')return makeRaster(key,176,80,(g,w,h)=>{
      const cy=h/2,echo=variant==='echo',c=echo?'#ff88b8':'#8ff7ff';
      g.translate(w*.48,cy);g.shadowBlur=18;g.shadowColor=c;
      const trail=g.createLinearGradient(-76,0,30,0);trail.addColorStop(0,'rgba(70,226,255,0)');trail.addColorStop(.58,rgba(c,.22));trail.addColorStop(1,rgba(c,.78));
      g.fillStyle=trail;g.beginPath();g.moveTo(-78,-4);g.lineTo(20,-8);g.lineTo(38,0);g.lineTo(20,8);g.lineTo(-78,4);g.closePath();g.fill();
      const shell=g.createLinearGradient(-6,-12,42,12);shell.addColorStop(0,'#ffffff');shell.addColorStop(.36,echo?'#ffd8e7':'#dffeff');shell.addColorStop(1,echo?'#ff6ea8':'#56cfff');
      g.fillStyle=shell;g.strokeStyle='#ffffff';g.lineWidth=1.2;g.beginPath();g.moveTo(48,0);g.lineTo(12,-13);g.lineTo(-13,0);g.lineTo(12,13);g.closePath();g.fill();g.stroke();
      g.globalAlpha=.74;g.strokeStyle=c;g.beginPath();g.moveTo(-4,-16);g.lineTo(29,0);g.lineTo(-4,16);g.stroke();
    });
    if(kind==='ember')return makeRaster(key,196,92,(g,w,h)=>{
      const cy=h/2,echo=variant==='echo',aw=variant==='awakened',c=echo?'#ff8bb6':aw?'#f7c6ff':'#ff789b',accent=aw?'#a7efff':'#ffd4df';
      g.translate(w*.48,cy);g.shadowBlur=aw?27:20;g.shadowColor=c;
      const trail=g.createLinearGradient(-88,0,30,0);trail.addColorStop(0,'rgba(255,95,155,0)');trail.addColorStop(.48,rgba(c,.18));trail.addColorStop(1,rgba(c,.72));g.fillStyle=trail;
      g.beginPath();g.moveTo(-90,-3);g.lineTo(10,-7);g.lineTo(34,0);g.lineTo(10,7);g.lineTo(-90,3);g.closePath();g.fill();
      g.fillStyle='#fff7fb';g.strokeStyle=c;g.lineWidth=1.5;
      g.beginPath();g.moveTo(58,0);g.lineTo(12,-11);g.lineTo(-22,-5);g.lineTo(-42,-14);g.lineTo(-29,0);g.lineTo(-42,14);g.lineTo(-22,5);g.lineTo(12,11);g.closePath();g.fill();g.stroke();
      g.fillStyle=accent;g.globalAlpha=.82;g.beginPath();g.moveTo(19,0);g.lineTo(-5,-4);g.lineTo(-20,0);g.lineTo(-5,4);g.closePath();g.fill();
      g.globalAlpha=.72;g.strokeStyle=accent;g.beginPath();g.moveTo(-4,-19);g.lineTo(8,-8);g.moveTo(-4,19);g.lineTo(8,8);g.stroke();
      if(aw){g.globalAlpha=.50;g.strokeStyle='#ffffff';g.beginPath();g.moveTo(-32,-22);g.lineTo(31,0);g.lineTo(-32,22);g.stroke();}
    });
    if(kind==='comet')return makeRaster(key,280,112,(g,w,h)=>{
      const cy=h/2,echo=variant==='echo',aw=variant==='awakened',c=echo?'#ff8fba':'#79deff';
      g.translate(w*.48,cy);g.shadowBlur=aw?34:27;g.shadowColor=c;
      for(let i=0;i<(aw?4:3);i++){const yy=(i-(aw?1.5:1))*8,tail=g.createLinearGradient(-132,yy,36,yy);tail.addColorStop(0,'rgba(87,211,255,0)');tail.addColorStop(.42,rgba(c,.16+i*.05));tail.addColorStop(1,rgba(c,.68));g.strokeStyle=tail;g.lineWidth=aw?4.4-i*.45:3.4-i*.45;g.beginPath();g.moveTo(-134,yy*(1.45+i*.08));g.lineTo(36,yy*.34);g.stroke();}
      const body=g.createLinearGradient(-38,-18,100,16);body.addColorStop(0,rgba(c,.20));body.addColorStop(.34,echo?'#ffcfe1':'#c7f5ff');body.addColorStop(.72,'#ffffff');body.addColorStop(1,'#eefcff');
      g.fillStyle=body;g.strokeStyle='#ffffff';g.lineWidth=aw?2:1.4;
      const len=aw?118:96,hh=aw?22:15;
      g.beginPath();g.moveTo(len,0);g.lineTo(len*.48,-hh);g.lineTo(len*.05,-hh*.58);g.lineTo(-len*.36,-hh*.92);g.lineTo(-len*.20,-hh*.34);g.lineTo(-len*.76,-hh*.17);g.lineTo(-len*.93,0);g.lineTo(-len*.76,hh*.17);g.lineTo(-len*.20,hh*.34);g.lineTo(-len*.36,hh*.92);g.lineTo(len*.05,hh*.58);g.lineTo(len*.48,hh);g.closePath();g.fill();g.stroke();
      g.globalAlpha=.76;g.strokeStyle=c;g.lineWidth=2;g.beginPath();g.moveTo(-len*.56,0);g.lineTo(len*.78,0);g.stroke();
      if(aw){g.globalAlpha=.42;for(const side of[-1,1]){g.beginPath();g.moveTo(-68,side*31);g.lineTo(52,side*13);g.stroke();}}
    });
    if(kind==='shard')return makeRaster(key,150,72,(g,w,h)=>{
      const c=variant==='echo'?'#ff9bbb':'#d8f7ff';g.translate(w*.5,h*.5);g.shadowBlur=15;g.shadowColor=c;g.fillStyle=c;g.strokeStyle='#ffffff';g.lineWidth=1;
      g.beginPath();g.moveTo(46,0);g.lineTo(3,-10);g.lineTo(-37,-4);g.lineTo(-49,0);g.lineTo(-37,4);g.lineTo(3,10);g.closePath();g.fill();g.stroke();g.globalAlpha=.45;g.beginPath();g.moveTo(-67,0);g.lineTo(21,0);g.stroke();
    });
    if(kind==='drone')return makeRaster(key,138,64,(g,w,h)=>{
      const c=variant==='echo'?'#ff91ba':'#8fffd0';g.translate(w*.5,h*.5);g.shadowBlur=14;g.shadowColor=c;g.fillStyle='#eafff7';g.strokeStyle=c;g.lineWidth=1.4;
      g.beginPath();g.moveTo(38,0);g.lineTo(7,-8);g.lineTo(-27,-5);g.lineTo(-39,0);g.lineTo(-27,5);g.lineTo(7,8);g.closePath();g.fill();g.stroke();g.globalAlpha=.42;g.beginPath();g.moveTo(-58,0);g.lineTo(11,0);g.stroke();
    });
    if(kind==='spiral')return makeRaster(key,132,72,(g,w,h)=>{
      const c=variant==='echo'?'#ff8fba':'#e3a7ff';g.translate(w*.5,h*.5);g.shadowBlur=17;g.shadowColor=c;g.strokeStyle=c;g.lineWidth=2;g.beginPath();g.arc(0,0,13,-2.55,2.55);g.stroke();g.fillStyle='#ffffff';g.beginPath();g.ellipse(27,0,13,5,0,0,TAU);g.fill();g.globalAlpha=.36;g.beginPath();g.moveTo(-52,0);g.lineTo(17,0);g.stroke();
    });
    return makeRaster(key,96,64,(g,w,h)=>{g.translate(w*.5,h*.5);g.fillStyle='#ffffff';g.shadowBlur=12;g.shadowColor='#a8dfff';g.beginPath();g.ellipse(0,0,14,5,0,0,TAU);g.fill();});
  }
  function dimensions(kind,p){
    const r=Math.max(2,Number(p.r)||4);
    if(kind==='core')return[r*8.2,r*3.8];
    if(kind==='ember'){const awakened=typeof awake==='function'&&awake('ember');return[r*(awakened?9.2:7.7),r*(awakened?4.3:3.7)];}
    if(kind==='comet')return[r*(p.awakeningChild?15.2:12.2),r*(p.awakeningChild?5.6:4.8)];
    if(kind==='shard')return[r*6.4,r*3.0];
    if(kind==='drone')return[r*5.7,r*2.8];
    if(kind==='spiral')return[r*5.5,r*3.0];
    return[r*4,r*2.5];
  }
  drawProjectiles=function canonicalPlayerProjectileVisuals(){
    if(GAME_SETTINGS.hideProjectiles===true)return;
    const list=state.entities.projectiles||[];
    for(let i=0;i<list.length;i++){
      const p=list[i];if(!p||p.life<=0||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
      const sx=p.x-player.x+vw/2,sy=p.y-player.y+vh/2;if(sx<-190||sx>vw+190||sy<-120||sy>vh+120)continue;
      const kind=sourceFamily(p.source),variant=kind==='ember'&&typeof awake==='function'&&awake('ember')?'awakened':variantFor(p),image=projectileRaster(kind,variant),[dw,dh]=dimensions(kind,p),angle=Math.atan2(p.vy||0,p.vx||0);
      ctx.save();ctx.translate(sx,sy);ctx.rotate(angle);ctx.globalAlpha=clamp((Number(p.life)||1)/Math.max(.08,Number(p.maxLife)||Number(p.life)||1),.36,1);ctx.drawImage(image,-dw*.47,-dh*.5,dw,dh);ctx.restore();
    }
  };


  function pulseBladeRaster(high=false){
    return makeRaster(`pulse-blade:${high?1:0}`,128,128,(g,w,h)=>{
      const c=w/2;g.save();g.translate(c,c);g.shadowBlur=high?28:20;g.shadowColor='#73ebff';
      const blade=g.createLinearGradient(-18,-42,20,38);blade.addColorStop(0,'#ffffff');blade.addColorStop(.22,'#d9fbff');blade.addColorStop(.56,'#82e9ff');blade.addColorStop(.82,'#7d8fff');blade.addColorStop(1,'rgba(69,78,198,.12)');
      g.fillStyle=blade;g.strokeStyle='rgba(239,254,255,.92)';g.lineWidth=1.5;
      g.beginPath();g.moveTo(-8,-42);g.bezierCurveTo(29,-25,31,13,-3,43);g.bezierCurveTo(8,19,3,-12,-8,-42);g.closePath();g.fill();g.stroke();
      g.globalAlpha=.58;g.strokeStyle='#8ff7ff';g.lineWidth=2;g.beginPath();g.moveTo(-5,-34);g.bezierCurveTo(19,-17,20,12,0,34);g.stroke();
      g.globalAlpha=.32;g.fillStyle='#7ce8ff';g.beginPath();g.ellipse(-8,15,8,30,-.18,0,TAU);g.fill();g.restore();
    });
  }
  const previousCanonicalOrbits=drawEquippedOrbits;
  drawEquippedOrbits=function canonicalEquippedOrbits(x,y,t){
    const bladeN=weaponCount('blade'),awakenedBlade=typeof awake==='function'&&awake('blade');
    if(!bladeN||awakenedBlade)return previousCanonicalOrbits(x,y,t);
    const saved=state.weaponStacks.blade;state.weaponStacks.blade=0;
    try{previousCanonicalOrbits(x,y,t);}finally{state.weaponStacks.blade=saved;}
    const size=weaponSizeMultiplier(),count=bladeN>=5?3:bladeN>=2?2:1,orbit=Math.max(48,orbitRadiusFor('blade')),image=pulseBladeRaster(bladeN>=6);
    for(let i=0;i<count;i++){
      const a=player.angle+i*TAU/count,bx=x+Math.cos(a)*orbit,by=y+Math.sin(a)*orbit;
      ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);ctx.scale(size,size);ctx.drawImage(image,-64,-64,128,128);ctx.restore();
    }
    const extra=Math.min(2,Math.max(0,Number(window.stackfallMultiplicityStacks?.())||0));
    for(let i=0;i<extra;i++){
      const a=player.angle+(i+.5)*TAU/Math.max(1,extra),rr=orbit+18,bx=x+Math.cos(a)*rr,by=y+Math.sin(a)*rr;
      ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);ctx.globalAlpha=.78;ctx.scale(size*.86,size*.86);ctx.drawImage(image,-64,-64,128,128);ctx.restore();
    }
  };

  function barrierSegmentPath(g,rInner,rOuter,a0,a1){
    const c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
    g.beginPath();g.moveTo(c0*rInner,s0*rInner);g.lineTo(c0*rOuter,s0*rOuter);g.quadraticCurveTo(Math.cos((a0+a1)/2)*(rOuter+3),Math.sin((a0+a1)/2)*(rOuter+3),c1*rOuter,s1*rOuter);g.lineTo(c1*rInner,s1*rInner);g.quadraticCurveTo(Math.cos((a0+a1)/2)*(rInner-2),Math.sin((a0+a1)/2)*(rInner-2),c0*rInner,s0*rInner);g.closePath();
  }
  drawDefenseBarrier=function canonicalDefenseBarrier(){
    const bulwarkN=weaponCount('bulwark'),armor=stat('armor'),shield=Math.max(0,Number(player.shield)||0),defense=bulwarkN>0||armor>0||shield>0;if(!defense)return;
    const awakened=bulwarkN>0&&typeof awake==='function'&&awake('bulwark'),cap=Math.max(1,typeof shieldCapacity==='function'?shieldCapacity():shield||1),ratio=clamp(shield/cap,0,1),t=performance.now(),x=vw/2,y=vh/2;
    const parts=awakened?8:Math.max(5,Math.min(8,5+Math.floor(bulwarkN/2))),base=player.r+(awakened?35:27),pulse=Math.sin(t*.0031)*1.2,inner=base+pulse,outer=inner+(awakened?11:7),rotation=t*(awakened?.00016:.00012);
    const hitAngle=Number(player.awBulwarkHitAngle)||0,hitFlash=awakened?clamp((Number(player.awBulwarkHitFlash)||0)/.32,0,1):0,strong=awakened?clamp((Number(player.awBulwarkStrong)||0)/.34,0,1):0;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.lineCap='round';ctx.lineJoin='round';
    ctx.globalAlpha=.24+.20*ratio;ctx.strokeStyle=awakened?'#dffff8':'#9cf7e0';ctx.lineWidth=1.2;ctx.setLineDash(awakened?[9,6]:[6,8]);ctx.beginPath();ctx.arc(0,0,inner-7,0,TAU);ctx.stroke();ctx.setLineDash([]);
    const gap=awakened?.105:.14,step=TAU/parts;
    for(let i=0;i<parts;i++){
      const mid=i*step-Math.PI/2,a0=mid-step*.5+gap,a1=mid+step*.5-gap,worldMid=mid+rotation,delta=Math.abs(Math.atan2(Math.sin(worldMid-hitAngle),Math.cos(worldMid-hitAngle))),focus=hitFlash*Math.max(0,1-delta/.78);
      barrierSegmentPath(ctx,inner,outer+focus*7,a0,a1);
      ctx.globalAlpha=.08+.10*ratio+.16*focus;ctx.fillStyle=awakened?'#d8fff7':'#75e8ce';ctx.fill();
      ctx.globalAlpha=.55+.30*ratio+.15*focus;ctx.strokeStyle=focus>.05?'#ffffff':awakened?'#cafff2':'#8ff5df';ctx.lineWidth=awakened?2.2:1.6;ctx.shadowBlur=(awakened?14:9)+focus*16;ctx.shadowColor=awakened?'#9dffe2':'#75e8ce';ctx.stroke();
      const am=(a0+a1)/2,tip=outer+(awakened?7:3)+focus*8;ctx.globalAlpha=.38+.32*ratio;ctx.strokeStyle='#efffff';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(Math.cos(am)*(inner+2),Math.sin(am)*(inner+2));ctx.lineTo(Math.cos(am)*tip,Math.sin(am)*tip);ctx.stroke();
    }
    ctx.shadowBlur=0;
    ctx.globalAlpha=.22+.26*ratio;ctx.strokeStyle=awakened?'#b8fff0':'#7debd4';ctx.lineWidth=awakened?2.4:1.3;
    for(let ring=0;ring<(awakened?2:1);ring++){ctx.setLineDash(ring?[3,10]:[14,7]);ctx.lineDashOffset=(ring?-1:1)*t*.012;ctx.beginPath();ctx.arc(0,0,outer+9+ring*8,0,TAU);ctx.stroke();}
    ctx.setLineDash([]);
    if(shield>0){ctx.globalAlpha=.055+.055*ratio;ctx.fillStyle=awakened?'#cafff2':'#86f4dc';ctx.beginPath();ctx.arc(0,0,inner-2,0,TAU);ctx.fill();}
    if(strong>0){ctx.rotate(hitAngle-rotation);ctx.globalAlpha=.45+.45*strong;ctx.strokeStyle='#ffffff';ctx.shadowBlur=20;ctx.shadowColor='#bffff0';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,outer+15,-.78,.78);ctx.stroke();}
    ctx.restore();
  };

  window.stackfallCanonicalWeaponVisualDiagnostics=()=>({
    renderer:'canonical-player-projectiles',
    gpuPlayerProjectiles:false,
    families:['core','ember','comet','shard','drone','spiral'],
    starlightDirectional:true,
    cometLance:true,
    lunarBoomerang:typeof drawBoomerangs==='function',
    pulseBladeFinalOwner:true,
    bulwarkFinalOwner:true
  });
})();