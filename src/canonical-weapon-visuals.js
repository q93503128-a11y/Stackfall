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
  function visualSource(p){
    const authored=String(p?.playerVisual||'').trim();
    return authored||String(p?.source||'');
  }
  function sourceFamily(p){
    const s=visualSource(p);
    if(s.startsWith('core')||s.includes('stellar-core'))return'core';
    if(s==='ember'||s==='echo-star'||s==='star-spark'||s.includes('ember'))return'ember';
    if(s==='wave'||s.includes('blade-wave'))return'blade-wave';
    if(s.includes('comet')&&!s.includes('fragment'))return'comet';
    if(s.includes('fragment')||s.includes('shard')||s.includes('mirror'))return'shard';
    if(s.includes('drone'))return'drone';
    if(s.includes('spiral'))return'spiral';
    if(s.includes('gate'))return'gate';
    return'generic';
  }
  function variantFor(p){const s=visualSource(p);return s.includes('echo')?'echo':p.awakeningChild?'awakened':'normal';}
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
    if(kind==='ember')return makeRaster(key,260,112,(g,w,h)=>{
      const cy=h/2,echo=variant==='echo',aw=variant==='awakened',c=echo?'#ff79ad':aw?'#dca9ff':'#ff6f9f',cold=aw?'#9eefff':'#ffc9df';
      g.translate(w*.57,cy);
      const outer=g.createLinearGradient(-142,0,48,0);outer.addColorStop(0,'rgba(255,82,158,0)');outer.addColorStop(.36,rgba(c,.08));outer.addColorStop(.72,rgba(c,.34));outer.addColorStop(1,rgba(c,.04));
      g.fillStyle=outer;g.shadowBlur=30;g.shadowColor=c;
      g.beginPath();g.moveTo(-145,0);g.quadraticCurveTo(-74,-19,6,-13);g.lineTo(48,0);g.lineTo(6,13);g.quadraticCurveTo(-74,19,-145,0);g.fill();
      g.globalAlpha=.78;const inner=g.createLinearGradient(-118,0,46,0);inner.addColorStop(0,'rgba(255,255,255,0)');inner.addColorStop(.50,rgba(c,.30));inner.addColorStop(.82,cold);inner.addColorStop(1,'#ffffff');g.fillStyle=inner;
      g.beginPath();g.moveTo(-120,0);g.quadraticCurveTo(-45,-8,17,-7);g.lineTo(52,0);g.lineTo(17,7);g.quadraticCurveTo(-45,8,-120,0);g.fill();
      g.globalAlpha=1;g.shadowBlur=24;g.shadowColor=c;const core=g.createRadialGradient(24,0,1,24,0,20);core.addColorStop(0,'#ffffff');core.addColorStop(.22,'#fff8fd');core.addColorStop(.52,cold);core.addColorStop(1,rgba(c,0));g.fillStyle=core;g.beginPath();g.arc(24,0,20,0,TAU);g.fill();
      g.shadowBlur=14;g.fillStyle='#ffffff';g.strokeStyle=aw?'#e8d9ff':'#ffd9e7';g.lineWidth=1.4;g.beginPath();g.moveTo(64,0);g.lineTo(30,-10);g.lineTo(7,-5);g.lineTo(-6,0);g.lineTo(7,5);g.lineTo(30,10);g.closePath();g.fill();g.stroke();
      g.globalAlpha=.66;g.strokeStyle=aw?'#9eefff':'#ffb6cf';g.lineWidth=1.3;g.beginPath();g.moveTo(-88,-13);g.quadraticCurveTo(-33,-20,25,-9);g.moveTo(-88,13);g.quadraticCurveTo(-33,20,25,9);g.stroke();
      if(aw){g.globalAlpha=.46;g.strokeStyle='#ffffff';g.lineWidth=1;g.beginPath();g.moveTo(-110,-22);g.quadraticCurveTo(-28,-31,47,-11);g.moveTo(-110,22);g.quadraticCurveTo(-28,31,47,11);g.stroke();}
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
    if(kind==='blade-wave')return makeRaster(key,184,104,(g,w,h)=>{
      const c=variant==='echo'?'#ff8fba':'#82efff';g.translate(w*.48,h*.5);g.shadowBlur=24;g.shadowColor=c;
      const slash=g.createLinearGradient(-68,-34,68,30);slash.addColorStop(0,'rgba(74,194,255,0)');slash.addColorStop(.32,rgba(c,.28));slash.addColorStop(.62,'#f4ffff');slash.addColorStop(1,rgba(c,.08));
      g.strokeStyle=slash;g.lineWidth=9;g.lineCap='round';g.beginPath();g.arc(-8,0,52,-1.05,1.05);g.stroke();
      g.globalAlpha=.92;g.strokeStyle='#ffffff';g.lineWidth=2.2;g.beginPath();g.arc(-8,0,45,-.92,.92);g.stroke();
      g.globalAlpha=.38;g.strokeStyle=c;g.lineWidth=2;g.beginPath();g.moveTo(-72,-25);g.quadraticCurveTo(-18,0,-72,25);g.stroke();
    });
    if(kind==='gate')return makeRaster(key,164,84,(g,w,h)=>{
      const c=variant==='echo'?'#ff89b6':'#cbd3ff';g.translate(w*.48,h*.5);g.shadowBlur=20;g.shadowColor=c;
      const trail=g.createLinearGradient(-78,0,42,0);trail.addColorStop(0,'rgba(126,146,255,0)');trail.addColorStop(.46,rgba(c,.24));trail.addColorStop(1,rgba(c,.72));g.fillStyle=trail;
      g.beginPath();g.moveTo(-78,-4);g.lineTo(25,-8);g.lineTo(46,0);g.lineTo(25,8);g.lineTo(-78,4);g.closePath();g.fill();
      g.strokeStyle='#ffffff';g.lineWidth=1.6;g.beginPath();g.ellipse(18,0,25,10,0,0,TAU);g.stroke();g.globalAlpha=.52;g.strokeStyle=c;g.lineWidth=2.2;g.beginPath();g.ellipse(18,0,12,22,0,0,TAU);g.stroke();
      g.globalAlpha=1;g.fillStyle='#f7fbff';g.beginPath();g.moveTo(55,0);g.lineTo(25,-6);g.lineTo(9,0);g.lineTo(25,6);g.closePath();g.fill();
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
    if(kind==='ember'){const awakened=typeof awake==='function'&&awake('ember');return[r*(awakened?13.8:11.4),r*(awakened?5.0:4.4)];}
    if(kind==='comet')return[r*(p.awakeningChild?15.2:12.2),r*(p.awakeningChild?5.6:4.8)];
    if(kind==='blade-wave')return[r*8.8,r*4.8];
    if(kind==='gate')return[r*7.4,r*3.8];
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
      const kind=sourceFamily(p),variant=kind==='ember'&&typeof awake==='function'&&awake('ember')?'awakened':variantFor(p),image=projectileRaster(kind,variant),[dw,dh]=dimensions(kind,p),angle=Math.atan2(p.vy||0,p.vx||0);
      ctx.save();ctx.translate(sx,sy);ctx.rotate(angle);ctx.globalAlpha=clamp((Number(p.life)||1)/Math.max(.08,Number(p.maxLife)||Number(p.life)||1),.36,1);if(kind==='ember')ctx.globalCompositeOperation='lighter';ctx.drawImage(image,-dw*.57,-dh*.5,dw,dh);ctx.restore();
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
      ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);ctx.scale(size*.72,size*.72);ctx.drawImage(image,-64,-64,128,128);ctx.restore();
    }
    const extra=Math.min(2,Math.max(0,Number(window.stackfallMultiplicityStacks?.())||0));
    for(let i=0;i<extra;i++){
      const a=player.angle+(i+.5)*TAU/Math.max(1,extra),rr=orbit+18,bx=x+Math.cos(a)*rr,by=y+Math.sin(a)*rr;
      ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);ctx.globalAlpha=.78;ctx.scale(size*.62,size*.62);ctx.drawImage(image,-64,-64,128,128);ctx.restore();
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


  function gravityBlackHoleRaster(echoed,frame){
    return makeRaster(`gravity-blackhole:${echoed?1:0}:${frame}`,360,260,(g,w,h)=>{
      const cx=w/2,cy=h/2,phase=frame/12*TAU,hot=echoed?'#ff5a93':'#ff9b4b',cold=echoed?'#ffb2cf':'#72c9ff';
      g.save();g.translate(cx,cy);
      const halo=g.createRadialGradient(0,0,12,0,0,112);halo.addColorStop(0,'rgba(0,0,0,1)');halo.addColorStop(.20,'rgba(0,0,0,.98)');halo.addColorStop(.34,echoed?'rgba(85,0,38,.34)':'rgba(22,28,58,.38)');halo.addColorStop(.65,echoed?'rgba(255,68,130,.09)':'rgba(74,111,190,.10)');halo.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=halo;g.beginPath();g.arc(0,0,112,0,TAU);g.fill();
      g.save();g.rotate(-.12);g.shadowBlur=26;g.shadowColor=hot;g.globalAlpha=.42;g.strokeStyle=hot;g.lineWidth=13;g.beginPath();g.ellipse(0,0,118,29,0,Math.PI,TAU);g.stroke();g.restore();
      g.save();g.globalAlpha=.55;g.strokeStyle=cold;g.shadowBlur=16;g.shadowColor=cold;g.lineWidth=2.2;g.beginPath();g.arc(0,0,43,.12,Math.PI-.12);g.stroke();g.beginPath();g.arc(0,0,43,Math.PI+.12,TAU-.12);g.stroke();g.restore();
      g.save();g.rotate(-.12);for(let i=0;i<22;i++){const a=phase+i/22*TAU,front=Math.sin(a)>=0,rrx=118+(i%3-1)*4,rry=29+(i%4-1.5)*1.7;if(!front)continue;const x=Math.cos(a)*rrx,y=Math.sin(a)*rry;g.globalAlpha=.28+(i%5)*.10;g.strokeStyle=i%4===0?'#ffffff':i%2?hot:cold;g.lineWidth=1.6+(i%3)*.6;g.beginPath();g.moveTo(x-18,y);g.quadraticCurveTo(x,y-3,x+17,y);g.stroke();}g.restore();
      g.save();g.shadowBlur=35;g.shadowColor='#ffffff';g.strokeStyle='rgba(248,253,255,.92)';g.lineWidth=3.1;g.beginPath();g.arc(0,0,31.5,0,TAU);g.stroke();g.shadowBlur=12;g.strokeStyle=cold;g.globalAlpha=.70;g.lineWidth=1.2;g.beginPath();g.arc(0,0,36.5,0,TAU);g.stroke();g.restore();
      g.fillStyle='#000';g.beginPath();g.arc(0,0,29,0,TAU);g.fill();
      g.save();g.rotate(-.12);g.shadowBlur=32;g.shadowColor=hot;const disk=g.createLinearGradient(-126,0,126,0);disk.addColorStop(0,'rgba(74,153,255,0)');disk.addColorStop(.18,rgba(cold,.38));disk.addColorStop(.40,'#fff6dc');disk.addColorStop(.52,'#ffffff');disk.addColorStop(.66,hot);disk.addColorStop(1,'rgba(255,82,42,0)');g.strokeStyle=disk;g.lineWidth=14;g.globalAlpha=.92;g.beginPath();g.ellipse(0,0,124,31,0,0,Math.PI);g.stroke();g.globalAlpha=.70;g.lineWidth=4;g.strokeStyle='#ffffff';g.beginPath();g.ellipse(0,0,112,25,0,.05,Math.PI-.05);g.stroke();g.restore();
      g.globalAlpha=.36;g.strokeStyle=cold;g.lineWidth=1.2;g.setLineDash([3,8]);g.lineDashOffset=-frame*2.3;g.beginPath();g.arc(0,0,51,0,TAU);g.stroke();g.setLineDash([]);g.restore();
    });
  }
  drawGravityLens=function canonicalGravityBlackHole(w,p,alpha,t){
    const echoed=!!w?.echoed||w?.color===COLORS.pink,frame=Math.floor((t*8)%12),image=gravityBlackHoleRaster(echoed,frame),visual=Math.min(146,58+(Number(w?.r)||80)*.31),dw=visual*2.55,dh=visual*1.84;
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;ctx.drawImage(image,-dw/2,-dh/2,dw,dh);ctx.restore();
  };

  window.stackfallCanonicalWeaponVisualDiagnostics=()=>({
    renderer:'canonical-player-projectiles',
    gpuPlayerProjectiles:false,
    families:['core','ember','blade-wave','comet','shard','drone','spiral','gate'],
    provenanceAware:true,
    unknownProjectileSources:[...new Set((state.entities.projectiles||[]).filter(p=>p&&p.life>0&&sourceFamily(p)==='generic').map(p=>String(p.source||'')))],
    starlightDirectional:true,
    cometLance:true,
    lunarBoomerang:typeof drawBoomerangs==='function',
    pulseBladeFinalOwner:true,
    bulwarkFinalOwner:true,
    emberNebulaTail:true,
    gravityBlackHole:true
  });
})();