function worldToScreen(x,y){return{x:x-player.x+vw/2,y:y-player.y+vh/2};}
function seeded(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const cosmicRand=seeded(830241);
const STAR_LAYERS=[{parallax:.026,size:1700,count:120,stars:[]},{parallax:.072,size:1400,count:95,stars:[]},{parallax:.165,size:1100,count:70,stars:[]}];
for(const layer of STAR_LAYERS)for(let i=0;i<layer.count;i++)layer.stars.push({x:cosmicRand()*layer.size,y:cosmicRand()*layer.size,r:.4+cosmicRand()*1.6,a:.16+cosmicRand()*.72,hue:cosmicRand(),phase:cosmicRand()*TAU});
const NEBULAE=Array.from({length:9},(_,i)=>({x:cosmicRand()*1900,y:cosmicRand()*1350,r:210+cosmicRand()*390,c:i%4,rot:cosmicRand()*TAU}));
const SPACE_LANDMARK_TILE={w:2100,h:1500};
const SPACE_LANDMARKS=Array.from({length:18},(_,i)=>({x:cosmicRand()*SPACE_LANDMARK_TILE.w,y:cosmicRand()*SPACE_LANDMARK_TILE.h,type:i%3,rot:cosmicRand()*TAU,scale:.72+cosmicRand()*.72}));
const TRAVEL_MARKERS=Array.from({length:24},(_,i)=>({x:cosmicRand()*1900,y:cosmicRand()*1350,len:12+cosmicRand()*28,a:.10+cosmicRand()*.16,layer:i%2}));
function wrap(v,size){return((v%size)+size)%size;}
const STATIC_BACKDROP_CACHE=new Map();
function drawCachedBackdrop(key,painter){
  const width=Math.max(1,Math.ceil(vw)),height=Math.max(1,Math.ceil(vh)),cacheKey=`${key}:${width}x${height}`;let surface=STATIC_BACKDROP_CACHE.get(cacheKey);
  if(!surface){
    surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):document.createElement('canvas');surface.width=width;surface.height=height;const surfaceCtx=surface.getContext('2d',{alpha:false});painter(surfaceCtx);
    if(STATIC_BACKDROP_CACHE.size>=2)STATIC_BACKDROP_CACHE.delete(STATIC_BACKDROP_CACHE.keys().next().value);STATIC_BACKDROP_CACHE.set(cacheKey,surface);
  }
  ctx.drawImage(surface,0,0,width,height,0,0,vw,vh);
}
const BACKGROUND_SPRITE_CACHE=new Map();
function backgroundSprite(key,width,height,painter){
  const w=Math.max(1,Math.ceil(width)),h=Math.max(1,Math.ceil(height)),cacheKey=`${key}:${w}x${h}`;let surface=BACKGROUND_SPRITE_CACHE.get(cacheKey);if(surface)return surface;
  surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');surface.width=w;surface.height=h;const g=surface.getContext('2d',{alpha:true});g.clearRect(0,0,w,h);painter(g,w,h);
  if(BACKGROUND_SPRITE_CACHE.size>=24)BACKGROUND_SPRITE_CACHE.delete(BACKGROUND_SPRITE_CACHE.keys().next().value);BACKGROUND_SPRITE_CACHE.set(cacheKey,surface);return surface;
}
function drawCachedOverlay(key,painter){
  const width=Math.max(1,Math.ceil(vw)),height=Math.max(1,Math.ceil(vh)),surface=backgroundSprite(`overlay:${key}`,width,height,(g)=>painter(g));ctx.drawImage(surface,0,0,width,height,0,0,vw,vh);
}
const SPACE_NEBULA_PALETTES=[['rgba(63,77,202,.14)','rgba(31,20,93,0)'],['rgba(183,54,184,.10)','rgba(72,16,91,0)'],['rgba(20,143,174,.11)','rgba(6,44,73,0)'],['rgba(87,49,162,.10)','rgba(24,11,70,0)']];
function spaceNebulaSprite(index){const palette=SPACE_NEBULA_PALETTES[index]||SPACE_NEBULA_PALETTES[0];return backgroundSprite(`space-nebula:${index}`,256,256,(g,w,h)=>{const c=w/2,grad=g.createRadialGradient(c,c,0,c,c,c);grad.addColorStop(0,palette[0]);grad.addColorStop(1,palette[1]);g.fillStyle=grad;g.fillRect(0,0,w,h);});}
function spacePlanetSprite(){return backgroundSprite('space-planet',256,256,(g,w,h)=>{const c=w/2,grad=g.createRadialGradient(c*.66,c*.65,2,c,c,c);grad.addColorStop(0,'rgba(171,188,255,.18)');grad.addColorStop(.48,'rgba(68,73,145,.10)');grad.addColorStop(1,'rgba(6,8,24,0)');g.fillStyle=grad;g.fillRect(0,0,w,h);});}
function forgeRaySprite(length){const width=Math.max(24,Math.ceil(length-88));return backgroundSprite('forge-ray',width,18,(g,w,h)=>{const grad=g.createLinearGradient(7,0,w,0);grad.addColorStop(0,'rgba(255,225,125,.42)');grad.addColorStop(.3,'rgba(255,94,32,.19)');grad.addColorStop(1,'rgba(255,50,20,0)');g.fillStyle=grad;g.beginPath();g.moveTo(0,2);g.lineTo(w,h/2);g.lineTo(0,h-2);g.closePath();g.fill();});}
const CONSTELLATION_POINT_X=new Float64Array(17),CONSTELLATION_POINT_Y=new Float64Array(17);
const STAR_TILE_CACHE={key:'',tiles:[]};
function makeStarTile(layer,palette,stride,layerIndex){
  const surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(layer.size,layer.size):document.createElement('canvas');
  surface.width=surface.height=layer.size;
  const g=surface.getContext('2d',{alpha:true});
  for(let i=0;i<layer.stars.length;i+=stride){
    const star=layer.stars[i],large=star.r>1.15;
    g.globalAlpha=star.a*.88;g.fillStyle=star.hue>.84?palette[2]:star.hue>.56?palette[1]:palette[0];
    if(large){g.beginPath();g.arc(star.x,star.y,star.r+(layerIndex===2?.18:0),0,TAU);g.fill();if(star.r>1.45){g.globalAlpha*=.38;g.fillRect(star.x-4,star.y-.35,8,.7);g.fillRect(star.x-.35,star.y-4,.7,8);}}
    else g.fillRect(star.x,star.y,Math.max(.8,star.r),Math.max(.8,star.r));
  }
  g.globalAlpha=1;return surface;
}
function drawStars(palette=['#f6f8ff','#8fe9ff','#cdbfff'],density=1){
  const now=performance.now(),tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,tierStride=tier===2?3:tier===1?2:1,densityStride=Math.max(1,Math.round(1/Math.max(.08,density))),stride=Math.max(tierStride,densityStride),colors=Array.isArray(palette)?palette:['#f6f8ff','#8fe9ff','#cdbfff'],key=`${colors.slice(0,3).join('|')}|${stride}`;
  if(STAR_TILE_CACHE.key!==key){STAR_TILE_CACHE.key=key;STAR_TILE_CACHE.tiles=STAR_LAYERS.map((layer,index)=>makeStarTile(layer,colors,stride,index));}
  for(let li=0;li<STAR_LAYERS.length;li++){
    const layer=STAR_LAYERS[li],tile=layer.size,ox=wrap(player.x*layer.parallax,tile),oy=wrap(player.y*layer.parallax,tile),surface=STAR_TILE_CACHE.tiles[li];
    let startX=-ox-100,startY=-oy-100;while(startX<=-tile)startX+=tile;while(startY<=-tile)startY+=tile;
    ctx.globalAlpha=.96+.04*Math.sin(now*.0008+li*1.7);
    for(let y=startY;y<vh+100;y+=tile)for(let x=startX;x<vw+100;x+=tile)ctx.drawImage(surface,Math.round(x),Math.round(y));
  }
  ctx.globalAlpha=1;
}
function drawSpaceLandmarks(){const ox=player.x*.42,oy=player.y*.42;for(const mark of SPACE_LANDMARKS){const x=wrap(mark.x-ox,SPACE_LANDMARK_TILE.w)-180,y=wrap(mark.y-oy,SPACE_LANDMARK_TILE.h)-160;if(x<-150||x>vw+150||y<-150||y>vh+150)continue;ctx.save();ctx.translate(x,y);ctx.rotate(mark.rot);ctx.scale(mark.scale,mark.scale);ctx.globalAlpha=.22;ctx.strokeStyle=mark.type===0?'#8799d8':mark.type===1?'#b78cff':'#6eb8c9';ctx.fillStyle='rgba(10,15,38,.72)';ctx.lineWidth=1.5;if(mark.type===0){ctx.beginPath();ctx.moveTo(-34,-9);ctx.lineTo(-8,-18);ctx.lineTo(31,-5);ctx.lineTo(43,8);ctx.lineTo(9,14);ctx.lineTo(-29,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-18,-18);ctx.lineTo(-4,-36);ctx.lineTo(8,-14);ctx.stroke();}else if(mark.type===1){ctx.setLineDash([8,6]);ctx.beginPath();ctx.ellipse(0,0,46,17,.18,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(0,0,7,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(0,38);ctx.stroke();}else{for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,18+i*12,.4+i*.25,4.8+i*.18);ctx.stroke();}ctx.beginPath();ctx.moveTo(-48,24);ctx.lineTo(45,-29);ctx.stroke();}ctx.restore();}}
function drawTraversalParallax(theme='space'){
  const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,limit=tier===2?8:tier===1?14:24,move=Math.hypot(player.moveVX||0,player.moveVY||0),moving=clamp(move/Math.max(1,player.speed||248),0,1),palette=String(theme).startsWith('stage-')?'154,211,255':theme==='void'?'181,132,255':'145,215,255';
  ctx.save();ctx.lineCap='round';
  for(let i=0;i<limit;i++){
    const m=TRAVEL_MARKERS[i],parallax=m.layer?.34:.18,x=wrap(m.x-player.x*parallax,1900)-100,y=wrap(m.y-player.y*parallax,1350)-80;if(x<-60||x>vw+60||y<-60||y>vh+60)continue;
    const vx=player.moveVX||0,vy=player.moveVY||0,d=Math.hypot(vx,vy)||1,nx=vx/d,ny=vy/d,len=m.len*(.72+moving*.75);
    ctx.globalAlpha=m.a*(.72+moving*.65);ctx.strokeStyle=`rgba(${palette},${.28+moving*.22})`;ctx.lineWidth=m.layer?1.15:.75;ctx.beginPath();ctx.moveTo(x-nx*len*.7,y-ny*len*.7);ctx.lineTo(x+nx*len*.3,y+ny*len*.3);ctx.stroke();
  }
  ctx.restore();
}
function drawMotionStreaks(theme='space'){const intensity=clamp(player.moveIntensity||0,0,1);if(intensity<.06)return;const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,count=tier===2?6:tier===1?10:16,vx=player.moveVX||0,vy=player.moveVY||0,speed=Math.hypot(vx,vy)||1,nx=vx/speed,ny=vy/speed,color=theme==='apex-forge'?'255,166,74':theme==='void'?'183,130,255':theme==='apex-chrono'?'121,255,225':'150,211,255',now=performance.now()*.001;ctx.save();ctx.lineCap='round';for(let i=0;i<count;i++){const seed=STAR_LAYERS[2].stars[i],x=wrap(seed.x*1.83-player.x*.11+now*(8+i%3),vw+180)-90,y=wrap(seed.y*1.47-player.y*.11+i*37,vh+160)-80,len=(9+i%5*5)*intensity;ctx.globalAlpha=(.05+(i%4)*.022)*intensity;ctx.strokeStyle=`rgba(${color},${.34+.28*intensity})`;ctx.lineWidth=.7+(i%3)*.35;ctx.beginPath();ctx.moveTo(x-nx*len,y-ny*len);ctx.lineTo(x+nx*len*.35,y+ny*len*.35);ctx.stroke();}ctx.restore();}
function drawSpaceBackground(){const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;drawCachedBackdrop('space',surfaceCtx=>{const base=surfaceCtx.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#02040d');base.addColorStop(.45,'#080c20');base.addColorStop(1,'#01030a');surfaceCtx.fillStyle=base;surfaceCtx.fillRect(0,0,vw,vh);const ambient=surfaceCtx.createRadialGradient(vw*.5,vh*.47,0,vw*.5,vh*.47,Math.max(vw,vh)*.78);ambient.addColorStop(0,'rgba(45,60,145,.25)');ambient.addColorStop(.45,'rgba(19,25,68,.10)');ambient.addColorStop(1,'rgba(0,0,0,0)');surfaceCtx.fillStyle=ambient;surfaceCtx.fillRect(0,0,vw,vh);});const nebulaStride=tier===2?3:tier===1?2:1;for(let index=0;index<NEBULAE.length;index+=nebulaStride){const n=NEBULAE[index],px=wrap(n.x-player.x*.016,1900)-260,py=wrap(n.y-player.y*.012,1350)-210,sprite=spaceNebulaSprite(n.c);ctx.save();ctx.translate(px,py);ctx.rotate(n.rot);ctx.scale(1.55,.72);ctx.drawImage(sprite,-n.r,-n.r,n.r*2,n.r*2);ctx.restore();}if(tier<2){ctx.save();ctx.translate(vw*.83-wrap(player.x*.005,90),vh*.18-wrap(player.y*.003,55));ctx.rotate(-.22);const planetR=Math.min(vw,vh)*.11,planet=spacePlanetSprite();ctx.drawImage(planet,-planetR,-planetR,planetR*2,planetR*2);ctx.strokeStyle='rgba(130,160,255,.09)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,planetR*1.72,planetR*.29,0,0,TAU);ctx.stroke();ctx.restore();drawSpaceLandmarks();}drawStars(undefined,tier===2?.30:tier===1?.58:1);}
function voidBossForm(){return state.mapEventActive?.type==='void'?state.mapEventActive.bossForm||null:null;}
function drawVoidBackground(){const t=performance.now()/1000,form=voidBossForm(),center=form==='maw'?'#240316':form==='oracle'?'#16092f':form==='weaver'?'#10051f':form==='grave'?'#0a0a20':form==='paradox'?'#180b32':'#1a0731';drawCachedBackdrop('void-'+(form||'base'),g=>{const base=g.createRadialGradient(vw*.48,vh*.44,20,vw*.48,vh*.44,Math.max(vw,vh)*.78);base.addColorStop(0,center);base.addColorStop(.32,'#0d061e');base.addColorStop(.70,'#03040d');base.addColorStop(1,'#000106');g.fillStyle=base;g.fillRect(0,0,vw,vh);});drawStars(form==='grave'?['#d4d5ff','#706da5','#49456f']:form==='paradox'?['#f2d8ff','#8ccfff','#754bb6']:['#c7b3ff','#875ce0','#5a3297'],.82);ctx.save();ctx.translate(vw*.5,vh*.5);ctx.lineCap='round';
  if(form==='maw'){ctx.strokeStyle='rgba(192,92,207,.25)';for(let ring=0;ring<7;ring++){ctx.lineWidth=1.2+ring*.38;ctx.beginPath();ctx.ellipse(0,0,70+ring*66,28+ring*24,t*.012*(ring%2?1:-1),0,TAU);ctx.stroke();}}
  else if(form==='oracle'){ctx.strokeStyle='rgba(221,189,255,.28)';for(let ring=0;ring<4;ring++){ctx.save();ctx.rotate((ring%2?1:-1)*t*.018);ctx.setLineDash([20+ring*6,12+ring*3]);ctx.beginPath();ctx.arc(0,0,96+ring*86,0,TAU);ctx.stroke();ctx.restore();}ctx.setLineDash([]);for(let i=0;i<8;i++){const a=i/8*TAU+t*.015;ctx.beginPath();ctx.moveTo(Math.cos(a)*75,Math.sin(a)*75);ctx.lineTo(Math.cos(a)*Math.max(vw,vh)*.62,Math.sin(a)*Math.max(vw,vh)*.62);ctx.stroke();}}
  else if(form==='weaver'){ctx.strokeStyle='rgba(139,84,212,.26)';for(let ring=1;ring<=5;ring++){const rr=ring*Math.min(vw,vh)*.085;ctx.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU+t*.006,x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}for(let i=0;i<8;i++){const a=i/8*TAU+t*.006;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*Math.max(vw,vh)*.72,Math.sin(a)*Math.max(vw,vh)*.72);ctx.stroke();}}
  else if(form==='grave'){ctx.strokeStyle='rgba(119,116,170,.28)';ctx.fillStyle='rgba(9,8,20,.46)';for(let i=-4;i<=4;i++){const x=i*92+Math.sin(t*.12+i)*12,h=95+(i%3+2)*38;ctx.fillRect(x-25,-h*.5,50,h);ctx.strokeRect(x-25,-h*.5,50,h);ctx.beginPath();ctx.moveTo(x-18,-h*.18);ctx.lineTo(x+18,-h*.18);ctx.moveTo(x,-h*.36);ctx.lineTo(x,h*.18);ctx.stroke();}}
  else if(form==='paradox'){ctx.fillStyle='rgba(102,45,151,.09)';ctx.fillRect(-vw/2,-vh/2,vw/2,vh);ctx.fillStyle='rgba(42,117,177,.08)';ctx.fillRect(0,-vh/2,vw/2,vh);ctx.strokeStyle='rgba(236,226,255,.34)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-vh*.62);ctx.lineTo(0,vh*.62);ctx.stroke();for(const side of[-1,1]){ctx.save();ctx.scale(side,1);ctx.strokeStyle=side<0?'rgba(214,156,255,.25)':'rgba(120,207,255,.25)';for(let ring=0;ring<4;ring++){ctx.beginPath();ctx.arc(0,0,95+ring*82,-1.18,1.18);ctx.stroke();}ctx.restore();}}
  else{ctx.strokeStyle='rgba(133,70,215,.22)';for(let ring=0;ring<6;ring++){ctx.save();ctx.rotate(ring*.26+t*(ring%2?.025:-.018));ctx.setLineDash([18+ring*5,9+ring*3]);ctx.beginPath();ctx.ellipse(0,0,120+ring*47,32+ring*13,0,0,TAU);ctx.stroke();ctx.restore();}ctx.setLineDash([]);}
  ctx.restore();
}
function drawChronoApex(){const t=performance.now()/1000;drawCachedBackdrop('apex-chrono',g=>{const base=g.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#020b12');base.addColorStop(.48,'#06262a');base.addColorStop(1,'#010408');g.fillStyle=base;g.fillRect(0,0,vw,vh);});drawStars(['#eaffff','#79ffe1','#3c8292'],.72);ctx.save();ctx.translate(vw*.5,vh*.48);for(let plate=0;plate<14;plate++){ctx.save();ctx.rotate(plate/14*TAU+(plate%2?1:-1)*t*.018);const inner=105+(plate%3)*38,outer=Math.max(vw,vh)*(.44+(plate%2)*.08);ctx.strokeStyle=plate%3===0?'rgba(226,255,249,.26)':'rgba(121,255,225,.11)';ctx.lineWidth=plate%3===0?3:1.2;ctx.beginPath();ctx.moveTo(Math.cos(.035)*inner,Math.sin(.035)*inner);ctx.lineTo(Math.cos(.035)*outer,Math.sin(.035)*outer);ctx.stroke();ctx.restore();}for(let ring=0;ring<4;ring++){ctx.save();ctx.rotate((ring%2?1:-1)*t*(.022+ring*.009));ctx.setLineDash([24+ring*7,15+ring*4]);ctx.strokeStyle=`rgba(121,255,225,${.23-ring*.035})`;ctx.lineWidth=2.4-ring*.25;ctx.beginPath();ctx.arc(0,0,115+ring*82,.12,TAU-.22);ctx.stroke();ctx.restore();}ctx.restore();ctx.setLineDash([]);ctx.fillStyle='rgba(0,0,0,.22)';for(let x=-60;x<vw+80;x+=170){ctx.save();ctx.translate(x+Math.sin(t+x)*18,0);ctx.rotate(-.08);ctx.fillRect(0,0,52,vh);ctx.restore();}}
function drawForgeApex(){const t=performance.now()/1000,outer=Math.max(vw,vh)*.72,ray=forgeRaySprite(outer);drawCachedBackdrop('apex-forge',g=>{const base=g.createRadialGradient(vw*.5,vh*.44,12,vw*.5,vh*.44,Math.max(vw,vh)*.78);base.addColorStop(0,'#7a2706');base.addColorStop(.18,'#351006');base.addColorStop(.58,'#0b0505');base.addColorStop(1,'#010205');g.fillStyle=base;g.fillRect(0,0,vw,vh);});drawStars(['#fff2c8','#ffb04e','#aa3b22'],.55);ctx.save();ctx.translate(vw*.5,vh*.44);ctx.rotate(t*.014);for(let ring=0;ring<3;ring++){const sides=6,rad=145+ring*118;ctx.strokeStyle=ring===0?'rgba(255,239,174,.42)':'rgba(255,125,54,.18)';ctx.lineWidth=ring===0?5:2;ctx.beginPath();for(let i=0;i<sides;i++){const a=i/sides*TAU-Math.PI/2,x=Math.cos(a)*rad,y=Math.sin(a)*rad;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}for(let i=0;i<12;i++){ctx.save();ctx.rotate(i/12*TAU);ctx.drawImage(ray,88,-9);ctx.restore();}ctx.restore();ctx.globalAlpha=.20;ctx.fillStyle='#ff7134';for(let y=vh*.68;y<vh;y+=36)ctx.fillRect(0,y,vw,1);ctx.globalAlpha=1;}
function drawConstellationApex(){const t=performance.now()/1000;drawCachedBackdrop('apex-constellation',g=>{const base=g.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#01030a');base.addColorStop(.46,'#08122b');base.addColorStop(1,'#02030c');g.fillStyle=base;g.fillRect(0,0,vw,vh);});drawStars(['#ffffff','#c4d1ff','#7d91df'],1);for(let i=0;i<17;i++){const a=i/17*TAU+t*(i%2?.002:-.0015),rx=vw*(.18+(i%4)*.045),ry=vh*(.20+(i%3)*.055);CONSTELLATION_POINT_X[i]=vw/2+Math.cos(a)*rx;CONSTELLATION_POINT_Y[i]=vh/2+Math.sin(a)*ry;}ctx.strokeStyle='rgba(183,201,255,.23)';ctx.lineWidth=1.1;for(let i=0;i<17;i++){const j=(i*5+7)%17;ctx.beginPath();ctx.moveTo(CONSTELLATION_POINT_X[i],CONSTELLATION_POINT_Y[i]);ctx.lineTo(CONSTELLATION_POINT_X[j],CONSTELLATION_POINT_Y[j]);ctx.stroke();}for(let i=0;i<17;i++){ctx.fillStyle=i%5===0?'#ffffff':'rgba(183,201,255,.82)';ctx.shadowBlur=i%5===0?18:8;ctx.shadowColor='#b7c9ff';ctx.beginPath();ctx.arc(CONSTELLATION_POINT_X[i],CONSTELLATION_POINT_Y[i],i%5===0?3.4:1.8,0,TAU);ctx.fill();}ctx.shadowBlur=0;ctx.save();ctx.translate(vw*.5,vh*.5);ctx.rotate(t*.006);ctx.strokeStyle='rgba(220,230,255,.10)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-Math.min(vw,vh)*.42);ctx.lineTo(Math.min(vw,vh)*.24,Math.min(vw,vh)*.34);ctx.lineTo(-Math.min(vw,vh)*.39,-Math.min(vw,vh)*.12);ctx.lineTo(Math.min(vw,vh)*.39,-Math.min(vw,vh)*.12);ctx.lineTo(-Math.min(vw,vh)*.24,Math.min(vw,vh)*.34);ctx.closePath();ctx.stroke();ctx.restore();}
function drawStageWorldBackdrop(order){
  const family=order<=6?'route':order<=12?'bloom':'array',local=(order-1)%6;
  drawCachedBackdrop(`stage-world-base:${order}`,g=>{
    let base,ambient;
    if(family==='route'){
      const a=['#030817','#04091b','#050917','#060817','#070814','#06091a'][local],b=['#101832','#0b1a2e','#11152d','#101329','#171128','#0c1630'][local];
      base=g.createLinearGradient(0,0,vw,vh);base.addColorStop(0,a);base.addColorStop(.52,b);base.addColorStop(1,'#01030b');
      g.fillStyle=base;g.fillRect(0,0,vw,vh);ambient=g.createRadialGradient(vw*.52,vh*.46,0,vw*.52,vh*.46,Math.max(vw,vh)*.72);ambient.addColorStop(0,local===4?'rgba(117,83,177,.16)':'rgba(75,105,190,.13)');ambient.addColorStop(1,'rgba(0,0,0,0)');
    }else if(family==='bloom'){
      const a=['#0a0713','#090812','#0b0613','#0d0712','#0c0910','#100611'][local],b=['#151028','#101d1b','#1a1023','#21101f','#20170d','#1d0e20'][local];
      base=g.createLinearGradient(0,0,vw,vh);base.addColorStop(0,a);base.addColorStop(.55,b);base.addColorStop(1,'#020307');
      g.fillStyle=base;g.fillRect(0,0,vw,vh);ambient=g.createRadialGradient(vw*.48,vh*.48,0,vw*.48,vh*.48,Math.max(vw,vh)*.75);ambient.addColorStop(0,local===1?'rgba(62,132,115,.14)':'rgba(137,68,159,.13)');ambient.addColorStop(1,'rgba(0,0,0,0)');
    }else{
      const a=['#02080d','#05070c','#030912','#02070d','#08070c','#02080b'][local],b=['#0a141b','#131016','#091728','#08131d','#17120d','#07151a'][local];
      base=g.createLinearGradient(0,0,vw,vh);base.addColorStop(0,a);base.addColorStop(.50,b);base.addColorStop(1,'#010304');
      g.fillStyle=base;g.fillRect(0,0,vw,vh);ambient=g.createRadialGradient(vw*.50,vh*.45,0,vw*.50,vh*.45,Math.max(vw,vh)*.74);ambient.addColorStop(0,local===2?'rgba(66,123,188,.14)':'rgba(52,148,158,.11)');ambient.addColorStop(1,'rgba(0,0,0,0)');
    }
    g.fillStyle=ambient;g.fillRect(0,0,vw,vh);
  });
  if(family==='route')drawStars(['#f8fbff','#9adfff','#9e9fff'],.58);
  else if(family==='bloom')drawStars(['#fff7ff','#d7a5ff','#8be0c5'],.50);
  else drawStars(['#efffff','#79e4ee','#d8b36e'],.46);
}
function drawStageMajorLandmarks(g,order,w,h,tier){
  const family=order<=6?'route':order<=12?'bloom':'array',local=(order-1)%6,thin=tier===2?1:1.6;
  g.save();g.lineCap='round';g.lineJoin='round';g.globalAlpha=tier===2?.56:.84;
  if(family==='route'){
    g.strokeStyle='rgba(132,190,235,.34)';g.fillStyle='rgba(8,16,35,.72)';g.lineWidth=thin;
    if(local===0){
      const cx=w*.53,cy=h*.48,routeAngle=-.24,dx=Math.cos(routeAngle),dy=Math.sin(routeAngle),nx=-dy,ny=dx,span=Math.hypot(w,h)*.74;
      g.save();g.translate(cx,cy);g.rotate(routeAngle);for(const lane of[-1,0,1]){const y=lane*88;g.fillStyle=lane===0?'rgba(10,19,42,.78)':'rgba(7,14,32,.60)';g.strokeStyle=lane===0?'rgba(151,214,255,.46)':'rgba(116,151,216,.28)';g.lineWidth=lane===0?3.6:2;g.setLineDash(lane===0?[36,18]:[15,24]);g.beginPath();g.rect(-span,y-24,span*.44,48);g.rect(-span*.26,y-24,span*.42,48);g.rect(span*.31,y-24,span*.55,48);g.fill();g.stroke();g.setLineDash([]);for(const x of[-span*.47,-span*.08,span*.23,span*.58]){g.strokeStyle='rgba(255,207,112,.26)';g.beginPath();g.moveTo(x-16,y-17);g.lineTo(x+16,y+17);g.moveTo(x+6,y-17);g.lineTo(x+38,y+17);g.stroke();}}g.restore();
      g.lineWidth=3.4;g.strokeStyle='rgba(151,205,248,.42)';for(const side of[-1,1]){g.save();g.translate(cx+nx*side*214,cy+ny*side*214);g.rotate(routeAngle);g.beginPath();g.moveTo(-58,-126);g.lineTo(-26,-160);g.lineTo(26,-160);g.lineTo(58,-126);g.lineTo(58,126);g.lineTo(26,160);g.lineTo(-26,160);g.lineTo(-58,126);g.stroke();g.strokeStyle='rgba(255,207,112,.30)';for(let y=-96;y<=96;y+=48){g.beginPath();g.moveTo(-48,y-12);g.lineTo(-14,y+12);g.moveTo(14,y-12);g.lineTo(48,y+12);g.stroke();}g.restore();}
      g.strokeStyle='rgba(174,185,255,.32)';g.lineWidth=4;g.setLineDash([31,18]);g.beginPath();g.arc(cx,cy,226,-2.72,-1.32);g.moveTo(cx+Math.cos(-.86)*226,cy+Math.sin(-.86)*226);g.arc(cx,cy,226,-.66,1.98);g.stroke();g.setLineDash([]);
      for(let i=0;i<9;i++){const a=-2.65+i*.64,rr=238+(i%3)*38;g.save();g.translate(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);g.rotate(a+.42);g.fillStyle=i%3===0?'rgba(32,44,79,.88)':'rgba(12,22,48,.84)';g.strokeStyle=i%2?'rgba(159,173,235,.40)':'rgba(114,211,244,.36)';g.beginPath();g.moveTo(-46,-13);g.lineTo(31,-19);g.lineTo(56,-3);g.lineTo(34,17);g.lineTo(-42,12);g.closePath();g.fill();g.stroke();g.restore();}
      g.fillStyle='rgba(3,6,15,.92)';g.strokeStyle='rgba(184,205,245,.46)';g.lineWidth=2.2;g.beginPath();g.moveTo(cx-104,cy-44);g.lineTo(cx-52,cy-91);g.lineTo(cx+24,cy-76);g.lineTo(cx+87,cy-25);g.lineTo(cx+74,cy+42);g.lineTo(cx+5,cy+82);g.lineTo(cx-82,cy+48);g.closePath();g.fill();g.stroke();
      g.strokeStyle='rgba(255,97,116,.42)';g.lineWidth=2;for(let i=0;i<4;i++){const px=cx-70+i*43,py=cy+18+Math.sin(i*1.7)*18;g.beginPath();g.moveTo(px-7,py);g.lineTo(px+7,py);g.stroke();}
    }else if(local===1){
      for(let i=-2;i<=2;i++){const y=h*.5+i*72;g.strokeStyle=i===0?'rgba(96,238,255,.42)':'rgba(128,165,230,.24)';g.lineWidth=i===0?5:2;g.beginPath();g.moveTo(-100,y-110);g.lineTo(w+100,y+110);g.stroke();}
      for(let i=0;i<8;i++){const x=90+i*180,y=180+(i%3)*240;g.strokeStyle='rgba(255,111,199,.30)';g.beginPath();g.arc(x,y,34,-.7,2.4);g.stroke();}
    }else if(local===2){
      for(let i=0;i<18;i++){const x=70+(i*193)%w,y=60+(i*127)%h,r=26+(i%5)*8;g.save();g.translate(x,y);g.rotate((i*.71)%TAU);g.strokeStyle=i%2?'rgba(191,243,255,.38)':'rgba(144,174,255,.30)';g.fillStyle='rgba(8,18,31,.36)';g.beginPath();g.moveTo(r*1.4,0);g.lineTo(r*.18,-r*.42);g.lineTo(-r*.92,-r*.22);g.lineTo(-r*.46,r*.56);g.closePath();g.fill();g.stroke();g.restore();}
    }else if(local===3){
      for(let i=0;i<7;i++){const x=110+i*205;g.strokeStyle=i%2?'rgba(141,166,255,.26)':'rgba(126,229,238,.30)';g.lineWidth=2;g.strokeRect(x,-80,112,h+160);g.strokeRect(x+24,80,64,h-160);}
    }else if(local===4){
      const cx=w*.5,cy=h*.5;for(let ring=0;ring<5;ring++){g.strokeStyle=ring%2?'rgba(180,112,255,.28)':'rgba(111,225,244,.26)';g.lineWidth=2+ring*.4;g.setLineDash([18+ring*4,12]);g.beginPath();g.arc(cx,cy,120+ring*74,.2*ring,TAU-.3);g.stroke();}g.setLineDash([]);for(let i=0;i<8;i++){const a=i/8*TAU;g.beginPath();g.moveTo(cx+Math.cos(a)*95,cy+Math.sin(a)*95);g.lineTo(cx+Math.cos(a)*480,cy+Math.sin(a)*480);g.stroke();}
    }else{
      const cx=w*.5,cy=h*.5;g.strokeStyle='rgba(151,219,255,.35)';for(let i=0;i<6;i++){const a=i/6*TAU+.18,px=cx+Math.cos(a)*340,py=cy+Math.sin(a)*245;g.beginPath();g.moveTo(px,py);g.lineTo(cx,cy);g.stroke();g.strokeRect(px-38,py-16,76,32);}g.lineWidth=4;g.beginPath();g.arc(cx,cy,112,0,TAU);g.stroke();g.lineWidth=1.5;g.beginPath();g.arc(cx,cy,166,0,TAU);g.stroke();
    }
  }else if(family==='bloom'){
    g.lineWidth=thin;g.strokeStyle='rgba(191,124,224,.32)';g.fillStyle='rgba(14,7,20,.54)';
    if(local===0){for(let i=0;i<22;i++){const x=(i*211)%w,y=(i*137)%h,r=18+(i%4)*9;g.fillStyle=i%3?'rgba(108,209,181,.18)':'rgba(188,112,226,.24)';g.beginPath();g.ellipse(x,y,r,r*.55,i*.31,0,TAU);g.fill();g.stroke();}}
    else if(local===1){g.lineWidth=7;g.strokeStyle='rgba(39,92,80,.52)';g.beginPath();g.moveTo(-80,h*.22);g.bezierCurveTo(w*.28,h*.05,w*.44,h*.86,w+80,h*.67);g.stroke();g.lineWidth=2;for(let i=0;i<12;i++){const x=80+i*120,y=180+Math.sin(i*.8)*210;g.strokeStyle='rgba(126,216,191,.22)';g.beginPath();g.arc(x,y,30+i%3*8,0,TAU);g.stroke();}}
    else if(local===2){const cx=w*.52,cy=h*.50;for(let arm=0;arm<7;arm++){g.strokeStyle=arm%2?'rgba(213,140,255,.34)':'rgba(119,216,189,.30)';g.beginPath();for(let k=0;k<34;k++){const q=k/33,a=arm*TAU/7+q*TAU*1.45,r=35+q*340,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;k?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}}
    else if(local===3){const cx=w*.5,cy=h*.5;for(let p=0;p<10;p++){g.save();g.translate(cx,cy);g.rotate(p*TAU/10);g.strokeStyle=p%2?'rgba(235,177,255,.36)':'rgba(128,221,194,.28)';g.beginPath();g.moveTo(60,-14);g.quadraticCurveTo(210,-90,355,0);g.quadraticCurveTo(210,90,60,14);g.stroke();g.restore();}}
    else if(local===4){const cx=w*.5,cy=h*.5;for(let p=0;p<8;p++){g.save();g.translate(cx,cy);g.rotate(p*TAU/8);g.fillStyle=p%2?'rgba(213,140,255,.16)':'rgba(209,165,93,.15)';g.beginPath();g.moveTo(54,-28);g.lineTo(280,-54);g.lineTo(342,0);g.lineTo(280,54);g.lineTo(54,28);g.closePath();g.fill();g.stroke();g.restore();}g.fillStyle='rgba(3,4,7,.88)';g.beginPath();g.arc(cx,cy,90,0,TAU);g.fill();}
    else{const cx=w*.5,cy=h*.5;for(let ring=0;ring<6;ring++){g.strokeStyle=ring%2?'rgba(125,223,193,.28)':'rgba(213,140,255,.34)';g.lineWidth=2.2;g.beginPath();g.ellipse(cx,cy,105+ring*70,65+ring*48,ring*.22,0,TAU);g.stroke();}for(let p=0;p<12;p++){const a=p/12*TAU,r=410;g.fillStyle=p%2?'rgba(213,140,255,.20)':'rgba(119,216,189,.18)';g.beginPath();g.ellipse(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.7,34,14,a,0,TAU);g.fill();}}
  }else{
    g.lineWidth=thin;g.strokeStyle='rgba(105,221,231,.30)';g.fillStyle='rgba(4,12,16,.62)';
    if(local===0){for(let i=0;i<12;i++){const x=80+(i*173)%w,y=80+(i*149)%h;g.strokeRect(x-42,y-22,84,44);g.beginPath();g.moveTo(x-100,y);g.lineTo(x-42,y);g.moveTo(x+42,y);g.lineTo(x+100,y);g.stroke();}}
    else if(local===1){for(let i=0;i<9;i++){const y=90+i*105;g.setLineDash([8+(i%3)*6,13]);g.strokeStyle=i%2?'rgba(228,184,102,.24)':'rgba(105,221,231,.28)';g.beginPath();g.moveTo(-80,y);g.lineTo(w+80,y+(i%3-1)*100);g.stroke();}g.setLineDash([]);}
    else if(local===2){for(let x=80;x<w;x+=180){g.strokeStyle='rgba(89,169,255,.26)';g.beginPath();g.moveTo(x,-80);g.lineTo(x,h+80);g.stroke();}for(let i=0;i<16;i++){const x=(i*257)%w,y=(i*173)%h;g.fillStyle='rgba(111,228,238,.13)';g.fillRect(x-46,y-8,92,16);}}
    else if(local===3){g.fillStyle='rgba(0,0,0,.48)';for(let i=0;i<7;i++){const x=100+(i*211)%w,y=100+(i*193)%h,r=80+(i%3)*32;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();g.strokeStyle='rgba(98,204,214,.18)';g.stroke();}}
    else if(local===4){for(let i=0;i<14;i++){const x=90+(i*197)%w,y=80+(i*131)%h;g.save();g.translate(x,y);g.rotate(i*.43);g.strokeStyle=i%3?'rgba(105,221,231,.28)':'rgba(228,184,102,.30)';g.strokeRect(-52,-18,104,36);g.beginPath();g.moveTo(-82,0);g.lineTo(82,0);g.stroke();g.restore();}}
    else{const cx=w*.5,cy=h*.5;for(let ring=0;ring<7;ring++){g.strokeStyle=ring%3===0?'rgba(228,184,102,.30)':'rgba(105,221,231,.27)';g.setLineDash([14+ring*4,8+ring]);g.beginPath();g.arc(cx,cy,78+ring*62,0,TAU);g.stroke();}g.setLineDash([]);for(let i=0;i<16;i++){const a=i/16*TAU;g.beginPath();g.moveTo(cx+Math.cos(a)*64,cy+Math.sin(a)*64);g.lineTo(cx+Math.cos(a)*500,cy+Math.sin(a)*500);g.stroke();}}
  }
  g.restore();
}
const STAGE_FIELD_TILE_CACHE=new Map();
function buildStageFieldTile(order,tier){
  const local=(order-1)%6,family=order<=6?'route':order<=12?'bloom':'array',w=1400,h=1000,surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');surface.width=w;surface.height=h;const g=surface.getContext('2d',{alpha:true});g.lineCap='round';g.lineJoin='round';
  if(family==='route'){
    const angle=-.26+(local-2.5)*.045,dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx,lanes=tier===2?2:3,spacing=105+local*7,span=Math.hypot(w,h)*1.4;g.globalAlpha=tier===2?.17:.27;
    for(let lane=-(lanes-1)/2;lane<=(lanes-1)/2;lane++){const cx=w*.5+nx*lane*spacing,cy=h*.5+ny*lane*spacing;g.strokeStyle=lane===0?'rgba(119,223,255,.42)':'rgba(126,151,220,.28)';g.lineWidth=lane===0?2.8:1.5;g.setLineDash(lane===0?[38,17]:[14,24]);g.beginPath();g.moveTo(cx-dx*span,cy-dy*span);g.lineTo(cx+dx*span,cy+dy*span);g.stroke();if(tier<2){g.setLineDash([]);for(let k=-4;k<=4;k++){const q=k*150,x=cx+dx*q,y=cy+dy*q,ww=12+local%3*2;g.strokeStyle='rgba(166,201,241,.20)';g.lineWidth=1;g.strokeRect(x-nx*ww*.5-8,y-ny*ww*.5-4,16,8);}}}
    g.setLineDash([]);g.globalAlpha=tier===2?.07:.12;g.strokeStyle='rgba(154,168,255,.42)';g.lineWidth=1.5;g.save();g.translate(w*.68,h*.42);for(let ring=0;ring<2+(local===5?1:0);ring++){g.beginPath();g.arc(0,0,86+ring*42,local*.20,Math.PI*1.72+local*.20);g.stroke();}g.restore();
  }else if(family==='bloom'){
    const roots=tier===2?3:5;g.globalAlpha=tier===2?.15:.24;
    for(let root=0;root<roots;root++){const baseY=95+root*(h-190)/Math.max(1,roots-1)+local*7,startX=-120+root*95+local*23,endX=w*.74+root*50;g.strokeStyle=root%2?'rgba(119,216,189,.28)':'rgba(213,140,255,.28)';g.lineWidth=3+(root+local)%3;g.beginPath();g.moveTo(startX-180,baseY);g.bezierCurveTo(startX+w*.16,baseY-95-local*5,endX-w*.11,baseY+95+root*8,endX+180,baseY-20);g.stroke();if(tier<2){for(let node=1;node<=4;node++){const q=node/5,x=lerp(startX-120,endX+120,q),y=baseY+Math.sin(q*Math.PI*2+root+local)*46;g.fillStyle=node%2?'rgba(213,140,255,.22)':'rgba(119,216,189,.22)';g.beginPath();g.ellipse(x,y,10+local%3*2,5+(root%2)*2,(root-local)*.27,0,TAU);g.fill();}}}
    g.globalAlpha=tier===2?.06:.10;g.save();g.translate(w*.64,h*.48);g.strokeStyle='rgba(222,176,255,.28)';g.lineWidth=1.4;for(let petal=0;petal<6;petal++){g.save();g.rotate(petal*TAU/6);g.beginPath();g.moveTo(34,-8);g.quadraticCurveTo(125,-52,210+local*10,0);g.quadraticCurveTo(125,52,34,8);g.stroke();g.restore();}g.restore();
  }else{
    const grid=92+local*8;g.globalAlpha=tier===2?.14:.23;g.strokeStyle='rgba(112,220,233,.22)';g.lineWidth=1;for(let x=-grid;x<w+grid;x+=grid*2){g.beginPath();g.moveTo(x,-20);g.lineTo(x,h+20);g.stroke();}for(let y=-grid;y<h+grid;y+=grid*2){g.beginPath();g.moveTo(-20,y);g.lineTo(w+20,y);g.stroke();}const relays=tier===2?4:8;for(let i=0;i<relays;i++){const x=90+(i*251+local*61)%w,y=70+(i*137+local*83)%h,ww=24+(i+local)%3*8,hh=14+(i*2+local)%3*6;g.strokeStyle=i%3===0?'rgba(226,186,104,.36)':'rgba(112,220,233,.32)';g.lineWidth=1.4;g.strokeRect(x-ww,y-hh,ww*2,hh*2);g.beginPath();g.moveTo(x-ww-42,y);g.lineTo(x-ww,y);g.moveTo(x+ww,y);g.lineTo(x+ww+42,y);g.stroke();}}
  drawStageMajorLandmarks(g,order,w,h,tier);
  g.globalAlpha=1;g.setLineDash([]);return surface;
}
function stageFieldTile(order,tier){const key=`${order}:${tier}`;let tile=STAGE_FIELD_TILE_CACHE.get(key);if(tile)return tile;tile=buildStageFieldTile(order,tier);if(STAGE_FIELD_TILE_CACHE.size>=3)STAGE_FIELD_TILE_CACHE.delete(STAGE_FIELD_TILE_CACHE.keys().next().value);STAGE_FIELD_TILE_CACHE.set(key,tile);return tile;}
function drawStageConstellationField(theme){
  const match=String(theme||'').match(/^stage-(\d{2})$/);if(!match)return;
  const order=Math.max(1,Math.min(18,Number(match[1])||1)),family=order<=6?'route':order<=12?'bloom':'array',tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,t=performance.now()/1000,tile=stageFieldTile(order,tier),tw=tile.width||960,th=tile.height||720;
  // Stage terrain is world-anchored: player movement must visibly move the battlefield, not just nudge a backdrop.
  const drift=family==='route'?t*2.2:family==='bloom'?t*.7:0,ox=wrap(-(player.x||0)+drift,tw),oy=wrap(-(player.y||0),th);
  ctx.save();ctx.globalAlpha=1;for(let y=oy-th;y<vh+th;y+=th)for(let x=ox-tw;x<vw+tw;x+=tw)ctx.drawImage(tile,Math.round(x),Math.round(y));
  if(family==='array'){const local=(order-1)%6,scan=wrap(t*(18+local*2)-(player.y||0),vh+180)-90;ctx.globalAlpha=tier===2?.08:.13;ctx.fillStyle=local%2?'rgba(226,186,104,.42)':'rgba(112,220,233,.42)';ctx.fillRect(0,scan,vw,2);}
  ctx.restore();
}
function drawStageOneWardenBackdrop(){
  drawStageWorldBackdrop(1);const t=performance.now()/1000;
  ctx.save();const shade=ctx.createRadialGradient(vw*.5,vh*.46,Math.min(vw,vh)*.12,vw*.5,vh*.46,Math.max(vw,vh)*.76);shade.addColorStop(0,'rgba(45,57,112,.08)');shade.addColorStop(.56,'rgba(6,10,26,.34)');shade.addColorStop(1,'rgba(0,1,8,.72)');ctx.fillStyle=shade;ctx.fillRect(0,0,vw,vh);
  ctx.translate(vw*.5,vh*.47);ctx.rotate(-.04);ctx.strokeStyle='rgba(174,185,255,.20)';ctx.lineWidth=1.5;for(let ring=0;ring<3;ring++){ctx.save();ctx.rotate((ring%2?1:-1)*t*.008);ctx.setLineDash([28+ring*8,18]);ctx.beginPath();ctx.ellipse(0,0,210+ring*118,118+ring*64,0,0,TAU);ctx.stroke();ctx.restore();}ctx.setLineDash([]);ctx.restore();
}
function drawStageOneWardenArena(){
  const arena=state.stageBossArena;if(!arena||arena.stageId!=='stage-01')return;const p=worldToScreen(arena.x,arena.y),phase=Math.max(1,Number(arena.phase)||1),shrink=phase>=2?24:0,hw=Math.max(120,arena.halfW-shrink),hh=Math.max(150,arena.halfH-shrink),t=performance.now()/1000,release=arena.locked===false?clamp((state.stageVictory?.elapsed||0)/1.25,0,1):0;
  ctx.save();ctx.fillStyle=`rgba(0,1,8,${.44*(1-release*.82)})`;ctx.beginPath();ctx.rect(0,0,vw,vh);ctx.rect(p.x-hw,p.y-hh,hw*2,hh*2);ctx.fill('evenodd');
  ctx.translate(p.x,p.y);ctx.strokeStyle=phase>=2?'rgba(224,231,255,.78)':'rgba(174,185,255,.58)';ctx.globalAlpha=1-release*.58;ctx.lineWidth=3;ctx.setLineDash([26,13]);ctx.lineDashOffset=-t*24;ctx.strokeRect(-hw,-hh,hw*2,hh*2);ctx.setLineDash([]);
  for(const side of[-1,1]){ctx.save();ctx.translate(side*(hw+release*105),0);ctx.rotate(side*release*.10);ctx.scale(side,1);ctx.fillStyle='rgba(14,22,47,.88)';ctx.strokeStyle='rgba(196,208,248,.62)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-hh);ctx.lineTo(38,-hh+30);ctx.lineTo(48,-52);ctx.lineTo(30,-24);ctx.lineTo(30,24);ctx.lineTo(48,52);ctx.lineTo(38,hh-30);ctx.lineTo(0,hh);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#ffcf70';ctx.globalAlpha=.55*(1-release*.35);for(let y=-hh+62;y<hh-35;y+=64){ctx.beginPath();ctx.moveTo(8,y-11);ctx.lineTo(34,y+11);ctx.stroke();}ctx.restore();}
  ctx.globalAlpha=1-release*.72;for(const side of[-1,1]){const y=side*(hh+release*54);ctx.fillStyle='rgba(18,28,55,.78)';ctx.strokeStyle='rgba(160,188,235,.50)';ctx.fillRect(-hw,y-side*18,hw*2,36);ctx.strokeRect(-hw,y-side*18,hw*2,36);}
  ctx.globalAlpha=.38;ctx.strokeStyle=phase>=2?'#ffffff':'#8fdcff';ctx.lineWidth=1.4;for(let i=0;i<7;i++){const y=-hh+48+i*(hh*2-96)/6;ctx.beginPath();ctx.moveTo(-hw+54,y);ctx.lineTo(hw-54,y);ctx.stroke();}
  ctx.restore();
}
function drawThemeRaw(theme){
  const stageMatch=String(theme||'').match(/^stage-(\d{2})$/);
  if(stageMatch){drawStageWorldBackdrop(Math.max(1,Math.min(18,Number(stageMatch[1])||1)));return;}
  if(theme==='stage-01-warden')drawStageOneWardenBackdrop();else if(theme==='void')drawVoidBackground();else if(theme==='apex-chrono')drawChronoApex();else if(theme==='apex-forge')drawForgeApex();else if(theme==='apex-constellation')drawConstellationApex();else drawSpaceBackground();
}
const THEME_FRAME_CACHE=new Map(),THEME_FRAME_INTERVAL=1000/30;
function themeFrameEntry(theme){
  const key=`${theme}:${Math.round(vw)}x${Math.round(vh)}@${dpr.toFixed(3)}`;let entry=THEME_FRAME_CACHE.get(key);if(entry)return entry;
  const width=Math.max(1,Math.ceil(vw*dpr)),height=Math.max(1,Math.ceil(vh*dpr)),surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):document.createElement('canvas');surface.width=width;surface.height=height;const bufferCtx=surface.getContext('2d',{alpha:false});entry={key,theme,surface,bufferCtx,lastAt:-Infinity,playerX:NaN,playerY:NaN};if(THEME_FRAME_CACHE.size>=3)THEME_FRAME_CACHE.delete(THEME_FRAME_CACHE.keys().next().value);THEME_FRAME_CACHE.set(key,entry);return entry;
}
function refreshThemeFrame(entry,theme,now){
  const oldCtx=ctx;try{ctx=entry.bufferCtx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.clearRect(0,0,vw,vh);drawThemeRaw(theme);entry.lastAt=now;entry.playerX=player.x||0;entry.playerY=player.y||0;}finally{ctx=oldCtx;}
}
function drawTheme(theme){
  const now=performance.now(),entry=themeFrameEntry(theme),moved=Math.hypot((player.x||0)-entry.playerX,(player.y||0)-entry.playerY),urgent=!Number.isFinite(entry.playerX)||moved>Math.max(18,(player.speed||248)*.08);
  if(urgent||now-entry.lastAt>=THEME_FRAME_INTERVAL)refreshThemeFrame(entry,theme,now);
  ctx.drawImage(entry.surface,0,0,entry.surface.width,entry.surface.height,0,0,vw,vh);
  // Cheap world-space layers stay live at the render cadence so movement remains obvious even while the expensive backdrop is cached.
  if(/^stage-\d{2}$/.test(String(theme||'')))drawStageConstellationField(theme);
  else if(theme==='stage-01-warden'){drawStageConstellationField('stage-01');drawStageOneWardenArena();}
  drawTraversalParallax(theme==='stage-01-warden'?'stage-01':theme);drawMotionStreaks(theme==='stage-01-warden'?'stage-01':theme);
}
window.stackfallBackgroundCacheInfo=()=>({entries:THEME_FRAME_CACHE.size,intervalMs:THEME_FRAME_INTERVAL,keys:[...THEME_FRAME_CACHE.keys()]});

