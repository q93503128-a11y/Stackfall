let drawProjectiles,drawGravityLens; // Assigned by canonical-weapon-visuals.js.
const ENEMY_GLOW_CACHE=new Map();
const RENDER_SCREEN_A={x:0,y:0},RENDER_SCREEN_B={x:0,y:0};
function setRenderScreenPoint(out,x,y){out.x=x-player.x+vw/2;out.y=y-player.y+vh/2;return out;}
function cachedEnemyGlow(color='#8b79ff'){
  const key=String(color||'#8b79ff');if(ENEMY_GLOW_CACHE.has(key))return ENEMY_GLOW_CACHE.get(key);
  const size=128,surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(size,size):document.createElement('canvas');surface.width=surface.height=size;const g=surface.getContext('2d',{alpha:true}),c=size/2,grad=g.createRadialGradient(c,c,0,c,c,c);
  grad.addColorStop(0,'rgba(255,255,255,.88)');grad.addColorStop(.32,'rgba(255,255,255,.42)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,size,size);g.globalCompositeOperation='source-in';g.fillStyle=key;g.fillRect(0,0,size,size);g.globalCompositeOperation='source-over';
  if(ENEMY_GLOW_CACHE.size>=48)ENEMY_GLOW_CACHE.delete(ENEMY_GLOW_CACHE.keys().next().value);ENEMY_GLOW_CACHE.set(key,surface);return surface;
}
function drawCachedEnemyGlow(g,color,r,blur,alpha=1){if(GAME_SETTINGS.sparkles===false||blur<=0)return;const image=cachedEnemyGlow(color),extent=Math.max(r*1.35,r+blur*.72);g.save();g.globalAlpha=.72*alpha;g.drawImage(image,-extent,-extent,extent*2,extent*2);g.restore();}
function drawTankBody(g,e,r=e.r,animate=true){if(animate)g.rotate(e.eventKind==='crash'?Math.atan2(player.y-e.y,player.x-e.x):(e.phase||0)*.035);if(e.eventKind==='crash'){g.fillStyle=e.hit?'#fff':'#23131a';g.strokeStyle=e.hit?'#fff':'#ff9a62';g.lineWidth=2.6;g.beginPath();g.moveTo(r*1.28,0);g.lineTo(r*.42,-r*.82);g.lineTo(-r*.58,-r*.68);g.lineTo(-r*1.20,-r*.18);g.lineTo(-r*.92,0);g.lineTo(-r*1.20,r*.18);g.lineTo(-r*.58,r*.68);g.lineTo(r*.42,r*.82);g.closePath();g.fill();g.stroke();g.fillStyle='#ffd08f';g.fillRect(r*.04,-r*.17,r*.65,r*.34);g.strokeStyle='#ff5f52';g.beginPath();g.moveTo(-r*.52,-r*.36);g.lineTo(-r*.95,-r*.78);g.moveTo(-r*.52,r*.36);g.lineTo(-r*.95,r*.78);g.stroke();return;}g.shadowColor='#ff8a3d';g.shadowBlur=GAME_SETTINGS.sparkles===false?0:13;g.fillStyle=e.hit?'#fff':'#241311';g.strokeStyle=e.hit?'#fff':'#ff9f43';g.lineWidth=2.8;g.beginPath();for(let i=0;i<12;i++){const a=i/12*TAU,rr=r*(i%2?.84:1.16)*(1+Math.sin(i*4.1)*.045),x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();g.stroke();for(let i=0;i<3;i++){g.save();g.rotate(i*TAU/3);g.fillStyle=i%2?'#a94d26':'#d86c2f';g.beginPath();g.moveTo(r*.18,-r*.18);g.lineTo(r*.98,-r*.44);g.lineTo(r*.76,r*.06);g.lineTo(r*.20,r*.20);g.closePath();g.fill();g.restore();}const core=g.createRadialGradient(-r*.12,-r*.18,1,0,0,r*.44);core.addColorStop(0,'#fff0be');core.addColorStop(.30,'#ffb84e');core.addColorStop(1,'#50160f');g.fillStyle=core;g.beginPath();g.arc(0,0,r*.42,0,TAU);g.fill();g.fillStyle='#17080a';g.beginPath();g.moveTo(-r*.20,-r*.10);g.lineTo(r*.28,0);g.lineTo(-r*.20,r*.10);g.closePath();g.fill();}
function drawStageEnemyBody(g,e){
  const v=e.stageVariant,r=e.r;if(!v)return false;g.lineWidth=2.2;g.strokeStyle=e.hit?'#fff':e.color;g.fillStyle=e.hit?'#fff':'#0b1028';
  if(v==='shardling'){g.rotate((e.phase||0)*.12);for(let i=0;i<4;i++){g.save();g.rotate(i*TAU/4);g.fillStyle=i%2?'#4250a6':'#6f82ff';g.beginPath();g.moveTo(r*1.25,0);g.lineTo(r*.18,-r*.34);g.lineTo(-r*.52,0);g.lineTo(r*.18,r*.34);g.closePath();g.fill();g.stroke();g.restore();}g.fillStyle='#e7ecff';g.beginPath();g.arc(0,0,r*.20,0,TAU);g.fill();}
  else if(v==='dart'){g.rotate(Math.atan2(player.y-e.y,player.x-e.x));const tail=g.createLinearGradient(-r*2.6,0,r,0);tail.addColorStop(0,'rgba(142,231,255,0)');tail.addColorStop(1,'rgba(142,231,255,.46)');g.fillStyle=tail;g.beginPath();g.moveTo(-r*2.6,-r*.16);g.lineTo(r*.1,-r*.30);g.lineTo(r*.1,r*.30);g.lineTo(-r*2.6,r*.16);g.fill();g.fillStyle='#10283c';g.beginPath();g.moveTo(r*1.48,0);g.lineTo(-r*.76,-r*.72);g.lineTo(-r*.22,0);g.lineTo(-r*.76,r*.72);g.closePath();g.fill();g.stroke();g.fillStyle='#e8fcff';g.beginPath();g.arc(r*.28,0,r*.14,0,TAU);g.fill();}
  else if(v==='bombardier'){g.rotate((e.phase||0)*.055);g.fillStyle='#17112c';g.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,x=Math.cos(a)*r,y=Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();g.stroke();for(let i=0;i<3;i++){const a=i/3*TAU;g.fillStyle=i%2?'#d6c2ff':'#9c7cff';g.beginPath();g.arc(Math.cos(a)*r*.58,Math.sin(a)*r*.58,r*.16,0,TAU);g.fill();}g.strokeStyle='#efe8ff';g.beginPath();g.moveTo(0,-r*.45);g.lineTo(0,r*.82);g.stroke();}
  else if(v==='bulwark'){g.rotate((e.phase||0)*.025);g.fillStyle='#0c1022';for(let plate=0;plate<4;plate++){g.save();g.rotate(plate*TAU/4);g.fillStyle=plate%2?'#364268':'#53618f';g.fillRect(r*.28,-r*.26,r*.96,r*.52);g.strokeRect(r*.28,-r*.26,r*.96,r*.52);g.restore();}g.fillStyle='#11162f';g.beginPath();g.arc(0,0,r*.64,0,TAU);g.fill();g.stroke();g.fillStyle='#cad2ff';g.beginPath();g.arc(0,0,r*.20,0,TAU);g.fill();}
  else if(v==='nebula-wisp'){
    const face=Math.atan2(player.y-e.y,player.x-e.x);g.rotate(face);const drift=Math.sin((e.phase||0)*.7)*r*.12;
    const haze=g.createRadialGradient(-r*.12,drift,1,0,0,r*1.5);haze.addColorStop(0,'rgba(255,239,253,.95)');haze.addColorStop(.24,'rgba(255,137,215,.68)');haze.addColorStop(.62,'rgba(132,105,255,.20)');haze.addColorStop(1,'rgba(85,68,180,0)');g.fillStyle=haze;g.beginPath();g.ellipse(0,0,r*1.45,r*.86,0,0,TAU);g.fill();
    g.strokeStyle=e.hit?'#fff':'#ffb6e8';g.lineWidth=1.5;for(const side of[-1,1]){g.beginPath();g.moveTo(-r*.05,side*r*.28);g.quadraticCurveTo(-r*.82,side*r*.78,-r*1.65,side*r*.42);g.stroke();}
    g.fillStyle=e.hit?'#fff':'#32113f';g.beginPath();g.moveTo(r*.90,0);g.quadraticCurveTo(r*.18,-r*.62,-r*.58,-r*.34);g.quadraticCurveTo(-r*.22,0,-r*.58,r*.34);g.quadraticCurveTo(r*.18,r*.62,r*.90,0);g.fill();g.stroke();
    g.fillStyle='#f7edff';g.beginPath();g.arc(r*.20,0,r*.15,0,TAU);g.fill();
  }
  else if(v==='glass-wing'){
    g.rotate(Math.atan2(player.y-e.y,player.x-e.x));const pulse=.86+.14*Math.sin((e.phase||0)*1.3);g.fillStyle=e.hit?'#fff':'#0b1a29';g.strokeStyle=e.hit?'#fff':'#baf7ff';g.lineWidth=1.8;
    for(const side of[-1,1]){g.save();g.scale(1,side);const grad=g.createLinearGradient(-r*.6,0,r*1.3,0);grad.addColorStop(0,'rgba(120,179,255,.12)');grad.addColorStop(.55,'rgba(186,247,255,.62)');grad.addColorStop(1,'rgba(255,255,255,.90)');g.fillStyle=grad;g.beginPath();g.moveTo(-r*.48,0);g.lineTo(r*.18,-r*.18);g.lineTo(r*1.28,-r*.74*pulse);g.lineTo(r*.72,-r*.08);g.lineTo(r*1.05,r*.34);g.lineTo(r*.08,r*.20);g.closePath();g.fill();g.stroke();g.restore();}
    g.fillStyle='#f7ffff';g.beginPath();g.moveTo(r*.72,0);g.lineTo(-r*.18,-r*.20);g.lineTo(-r*.58,0);g.lineTo(-r*.18,r*.20);g.closePath();g.fill();g.stroke();g.fillStyle='#7feeff';g.beginPath();g.arc(r*.12,0,r*.11,0,TAU);g.fill();
  }
  else if(v==='phase-drifter'){
    g.rotate((e.phase||0)*.05);const pulse=.86+.14*Math.sin((e.phase||0)*1.1);g.fillStyle=e.hit?'#fff':'#071b20';g.strokeStyle=e.hit?'#fff':'#8fffe0';g.lineWidth=1.8;
    for(let ring=0;ring<2;ring++){g.save();g.rotate((ring?1:-1)*(e.phase||0)*.09);g.globalAlpha=.72-ring*.18;g.setLineDash(ring?[5,5]:[]);g.beginPath();g.ellipse(0,0,r*(1.05+ring*.30),r*(.42+ring*.10),ring*.55,0,TAU);g.stroke();g.restore();}g.setLineDash([]);g.globalAlpha=1;
    for(let i=0;i<4;i++){const a=i*TAU/4+(e.phase||0)*.04,rr=r*1.08;g.save();g.translate(Math.cos(a)*rr,Math.sin(a)*rr);g.rotate(a);g.fillStyle=i%2?'#87d7ff':'#9effe7';g.beginPath();g.moveTo(r*.22,0);g.lineTo(-r*.18,-r*.13);g.lineTo(-r*.18,r*.13);g.closePath();g.fill();g.restore();}
    g.fillStyle='#dffff8';g.beginPath();g.arc(0,0,r*.30*pulse,0,TAU);g.fill();g.strokeStyle='#ffffff';g.beginPath();g.moveTo(0,0);g.lineTo(r*.02,-r*.24);g.moveTo(0,0);g.lineTo(r*.18,r*.08);g.stroke();
  }
  else if(v==='conduit-leech'){
    g.rotate((e.phase||0)*.032);const pulse=.88+.12*Math.sin((e.phase||0)*1.25);g.fillStyle=e.hit?'#fff':'#061820';g.strokeStyle=e.hit?'#fff':'#79f7ff';g.lineWidth=2.2;
    for(let seg=0;seg<6;seg++){g.save();g.rotate(seg*TAU/6+(seg%2?.12:-.12));const rr=r*(.36+seg*.10);g.fillStyle=seg%2?'rgba(110,244,255,.24)':'rgba(159,174,255,.20)';g.beginPath();g.moveTo(r*.16,-r*.18);g.lineTo(rr+r*.48,-r*.30);g.lineTo(rr+r*.72,0);g.lineTo(rr+r*.48,r*.30);g.lineTo(r*.16,r*.18);g.closePath();g.fill();g.stroke();g.restore();}
    g.fillStyle='#0b2830';g.beginPath();g.arc(0,0,r*.60,0,TAU);g.fill();g.stroke();g.strokeStyle='#dfffff';g.lineWidth=1.4;for(let i=0;i<3;i++){const a=i/3*TAU+(e.phase||0)*.08;g.beginPath();g.moveTo(Math.cos(a)*r*.20,Math.sin(a)*r*.20);g.quadraticCurveTo(Math.cos(a+.45)*r*.56,Math.sin(a+.45)*r*.56,Math.cos(a)*r*.92,Math.sin(a)*r*.92);g.stroke();}g.fillStyle='#f3ffff';g.beginPath();g.arc(0,0,r*.17*pulse,0,TAU);g.fill();
  }
  else if(v==='abyss-spore'){
    const face=Math.atan2(player.y-e.y,player.x-e.x);g.rotate(face);const pulse=.88+.12*Math.sin((e.phase||0)*1.4),husk=g.createLinearGradient(-r,-r,r,r);husk.addColorStop(0,'#739c91');husk.addColorStop(.5,'#273341');husk.addColorStop(1,'#83668d');g.strokeStyle=e.hit?'#fff':'#a899b7';g.fillStyle=e.hit?'#fff':husk;g.lineWidth=1.7;
    g.beginPath();g.moveTo(r*.81,0);g.bezierCurveTo(r*.68,-r*.52,-r*.25,-r*.87,-r*.64,-r*.39);g.bezierCurveTo(-r*.89,r*.18,-r*.22,r*.76,r*.22,r*.53);g.quadraticCurveTo(r*.6,r*.30,r*.81,0);g.fill();g.stroke();
    for(const side of[-1,1]){g.strokeStyle=side>0?'#799d8b':'#897299';g.lineWidth=2;g.beginPath();g.moveTo(-r*.28,side*r*.22);g.quadraticCurveTo(-r*.56,side*r*.63,-r*.74,side*r*.61);g.stroke();}g.strokeStyle='#dfbbd6';g.lineWidth=2.3*pulse;g.beginPath();g.moveTo(r*.43,-r*.18);g.quadraticCurveTo(r*.21,r*.03,r*.35,r*.23);g.stroke();
  }
  else if(v==='rootlance'){
    g.rotate(Math.atan2(player.y-e.y,player.x-e.x));const pulse=.90+.10*Math.sin((e.phase||0)*1.7);g.strokeStyle=e.hit?'#fff':'#ff7fa8';g.fillStyle=e.hit?'#fff':'#170914';g.lineWidth=2;
    const tail=g.createLinearGradient(-r*2.2,0,r*.4,0);tail.addColorStop(0,'rgba(255,127,168,0)');tail.addColorStop(1,'rgba(255,127,168,.38)');g.fillStyle=tail;g.beginPath();g.moveTo(-r*2.2,-r*.12);g.lineTo(r*.1,-r*.25);g.lineTo(r*.1,r*.25);g.lineTo(-r*2.2,r*.12);g.fill();
    g.fillStyle='#170914';g.beginPath();g.moveTo(r*.97,0);g.lineTo(r*.18,-r*.34);g.lineTo(-r*.72,-r*.58);g.lineTo(-r*.40,0);g.lineTo(-r*.72,r*.58);g.lineTo(r*.18,r*.34);g.closePath();g.fill();g.stroke();
    for(const side of[-1,1]){g.strokeStyle=side>0?'#ff9cba':'#82d8c1';g.beginPath();g.moveTo(-r*.18,side*r*.24);g.lineTo(-r*.92,side*r*.78);g.stroke();}
    g.fillStyle='#fce3ec';g.beginPath();g.arc(r*.24,0,r*.13*pulse,0,TAU);g.fill();
  }
  else if(v==='spiral-pod'){
    g.rotate(.22+Math.sin((e.phase||0)*.5)*.15);const husk=g.createLinearGradient(-r,-r,r,r);husk.addColorStop(0,'#b8b598');husk.addColorStop(.5,'#3a5559');husk.addColorStop(1,'#8f769e');g.strokeStyle=e.hit?'#fff':'#c8c5b0';g.fillStyle=e.hit?'#fff':husk;g.lineWidth=1.7;
    g.beginPath();g.moveTo(-r*.18,-r*.90);g.bezierCurveTo(-r*.83,-r*.35,-r*.62,r*.51,r*.24,r*.83);g.bezierCurveTo(-r*.03,r*.25,r*.19,-r*.13,-r*.18,-r*.90);g.fill();g.stroke();
    g.beginPath();g.moveTo(r*.05,-r*.80);g.bezierCurveTo(r*.77,-r*.32,r*.78,r*.25,r*.31,r*.73);g.bezierCurveTo(r*.46,r*.10,-r*.06,-r*.23,r*.05,-r*.80);g.fill();g.stroke();
    g.strokeStyle='#d6c7ab';g.lineWidth=2;g.beginPath();g.moveTo(-r*.25,-r*.60);g.bezierCurveTo(r*.46,-r*.07,-r*.45,r*.12,r*.27,r*.55);g.stroke();
  }
  else if(v==='husk-warden'){
    g.rotate(Math.sin((e.phase||0)*.5)*.10);const shell=g.createLinearGradient(-r,-r,r,r);shell.addColorStop(0,'#c5ae7f');shell.addColorStop(.44,'#56614d');shell.addColorStop(1,'#66545b');g.strokeStyle=e.hit?'#fff':'#cdb99c';g.fillStyle=e.hit?'#fff':shell;g.lineWidth=2;
    g.beginPath();g.moveTo(-r*.86,-r*.12);g.lineTo(-r*.60,-r*.58);g.lineTo(r*.45,-r*.67);g.lineTo(r*.85,-r*.19);g.lineTo(r*.68,r*.44);g.lineTo(-r*.52,r*.63);g.lineTo(-r*.85,r*.18);g.closePath();g.fill();g.stroke();
    for(let plate=0;plate<3;plate++){const x=(-.43+plate*.43)*r;g.strokeStyle='#362e29';g.lineWidth=3;g.beginPath();g.moveTo(x-r*.10,-r*.45);g.quadraticCurveTo(x+r*.21,-r*.04,x,r*.48);g.stroke();}g.strokeStyle='#cdb99c';g.lineWidth=2;for(const side of[-1,1]){g.beginPath();g.moveTo(side*r*.54,r*.34);g.lineTo(side*r*.69,r*.63);g.lineTo(side*r*.49,r*.69);g.stroke();}
  }
  else if(v==='relay-mite'){
    g.rotate(Math.atan2(player.y-e.y,player.x-e.x));const metal=g.createLinearGradient(-r,-r,r,r);metal.addColorStop(0,'#95d6dd');metal.addColorStop(.45,'#18374b');metal.addColorStop(1,'#63869c');g.strokeStyle=e.hit?'#fff':'#93d9e1';g.fillStyle=e.hit?'#fff':metal;g.lineWidth=2;
    g.beginPath();g.moveTo(-r*.77,-r*.42);g.lineTo(r*.48,-r*.61);g.lineTo(r*.89,-r*.10);g.lineTo(r*.48,r*.29);g.lineTo(-r*.53,r*.56);g.lineTo(-r*.83,r*.12);g.closePath();g.fill();g.stroke();g.fillStyle='#b0f2ef';g.fillRect(-r*.21,-r*.12,r*.55,r*.16);g.strokeStyle='#3c7185';g.lineWidth=3;g.beginPath();g.moveTo(-r*.48,-r*.24);g.lineTo(-r*.32,r*.30);g.stroke();g.beginPath();g.moveTo(-r*.21,-r*.32);g.lineTo(-r*.02,r*.21);g.stroke();
  }
  else if(v==='jammer-kite'){
    const pulse=.90+.10*Math.sin((e.phase||0)*1.2);g.rotate((e.phase||0)*.025);g.strokeStyle=e.hit?'#fff':'#ef8de1';g.fillStyle=e.hit?'#fff':'#14091a';g.lineWidth=2.1;
    for(const side of[-1,1]){g.beginPath();g.moveTo(-r*.18,0);g.lineTo(r*.36,side*r*.92);g.lineTo(r*1.30,side*r*.28);g.lineTo(r*.52,0);g.closePath();g.fill();g.stroke();}g.strokeStyle='#6de4f0';for(let ring=0;ring<2;ring++){g.beginPath();g.arc(-r*.12,0,r*(.48+ring*.26),-.55,.55);g.stroke();}g.fillStyle='#fff0fb';g.beginPath();g.arc(-r*.12,0,r*.11*pulse,0,TAU);g.fill();
  }
  else if(v==='packet-lancer'){
    const aim=Math.atan2(player.y-e.y,player.x-e.x);g.rotate(aim);g.strokeStyle=e.hit?'#fff':'#86a9ff';g.fillStyle=e.hit?'#fff':'#071025';g.lineWidth=2.2;
    g.beginPath();g.moveTo(r*1.65,0);g.lineTo(r*.35,-r*.34);g.lineTo(-r*.85,-r*.48);g.lineTo(-r*.55,0);g.lineTo(-r*.85,r*.48);g.lineTo(r*.35,r*.34);g.closePath();g.fill();g.stroke();g.strokeStyle='#6fe8ef';for(const side of[-1,1]){g.beginPath();g.moveTo(-r*.42,side*r*.18);g.lineTo(-r*1.25,side*r*.62);g.stroke();}g.fillStyle='#eef5ff';g.fillRect(r*.24,-2,r*.48,4);
  }
  else if(v==='cipher-warden'){
    const pulse=.91+.09*Math.sin((e.phase||0)*.8);g.rotate((e.phase||0)*.012);g.strokeStyle=e.hit?'#fff':'#e4bd72';g.fillStyle=e.hit?'#fff':'#141007';g.lineWidth=2.4;
    for(let plate=0;plate<6;plate++){g.save();g.rotate(plate*TAU/6);g.fillStyle=plate%2?'rgba(110,224,211,.20)':'rgba(228,189,114,.25)';g.beginPath();g.moveTo(r*.36,-r*.28);g.lineTo(r*1.28,-r*.34);g.lineTo(r*1.52,0);g.lineTo(r*1.28,r*.34);g.lineTo(r*.36,r*.28);g.closePath();g.fill();g.stroke();g.restore();}g.fillStyle='#07090a';g.beginPath();g.arc(0,0,r*.66,0,TAU);g.fill();g.stroke();g.strokeStyle='#75ded0';for(let bit=0;bit<4;bit++){const a=bit*TAU/4;g.beginPath();g.moveTo(Math.cos(a)*r*.20,Math.sin(a)*r*.20);g.lineTo(Math.cos(a)*r*.52,Math.sin(a)*r*.52);g.stroke();}g.fillStyle='#fff1c9';g.beginPath();g.arc(0,0,r*.11*pulse,0,TAU);g.fill();
  }
  else return false;return true;
}
const ENEMY_BODY_RASTER_CACHE=new Map();
const DIRECTIONAL_STAGE_VARIANTS=new Set(['dart','nebula-wisp','glass-wing','abyss-spore','rootlance','packet-lancer']);
function cachedRasterSurface(cache,key,size,painter,limit=96){
  let surface=cache.get(key);if(surface)return surface;
  surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(size,size):document.createElement('canvas');surface.width=surface.height=size;const g=surface.getContext('2d',{alpha:true});painter(g,size);
  if(cache.size>=limit)cache.delete(cache.keys().next().value);cache.set(key,surface);return surface;
}
function stageEnemyRaster(e){
  const size=160,baseR=28,hit=!!e.hit,color=String(e.color||'#8b79ff'),frame=Math.floor(((Number(e.phase)||0)*.28)%8+8)%8,key=`${e.stageVariant||e.type}|${color}|${hit?1:0}|${frame}|${e.eventKind||''}`;
  return cachedRasterSurface(ENEMY_BODY_RASTER_CACHE,key,size,(g,canvasSize)=>{g.save();g.translate(canvasSize/2,canvasSize/2);const fake={...e,x:(player.x||0)-120,y:player.y||0,r:baseR,phase:frame*(20/8),hit:hit?1:0};if(fake.stageVariant)drawStageEnemyBody(g,fake);else if(fake.type==='fast'){const tail=g.createLinearGradient(-baseR*3,0,baseR,0);tail.addColorStop(0,'rgba(255,79,154,0)');tail.addColorStop(1,'rgba(255,79,154,.55)');g.fillStyle=tail;g.beginPath();g.moveTo(-baseR*3,-3);g.lineTo(baseR*.2,-5);g.lineTo(baseR*.2,5);g.lineTo(-baseR*3,3);g.fill();g.fillStyle=hit?'#fff':color;g.beginPath();g.moveTo(baseR*1.55,0);g.lineTo(-baseR*.75,baseR*.78);g.lineTo(-baseR*.22,0);g.lineTo(-baseR*.75,-baseR*.78);g.closePath();g.fill();}
    else if(fake.type==='tank')drawTankBody(g,fake,baseR,false);
    else{const orb=g.createRadialGradient(-baseR*.3,-baseR*.35,1,0,0,baseR);orb.addColorStop(0,'#c7c0ff');orb.addColorStop(.45,hit?'#fff':color);orb.addColorStop(1,'#2b216b');g.fillStyle=orb;g.beginPath();g.arc(0,0,baseR,0,TAU);g.fill();g.globalAlpha=.44;g.strokeStyle='#c4d2ff';g.lineWidth=1;g.beginPath();g.ellipse(0,0,baseR*1.38,baseR*.42,frame*.16,0,TAU);g.stroke();g.globalAlpha=1;for(let i=0;i<3;i++){const a=frame*.4+i*TAU/3;g.fillStyle='#a6b8ff';g.beginPath();g.arc(Math.cos(a)*baseR*1.22,Math.sin(a)*baseR*.52,1.7,0,TAU);g.fill();}}
    if(!['tank'].includes(fake.type)){g.globalAlpha=1;g.fillStyle='rgba(2,4,15,.72)';g.beginPath();g.arc(0,0,Math.max(3,baseR*.22),0,TAU);g.fill();}g.restore();});
}
function drawRasterEnemyBody(e,p,pulse){
  const image=stageEnemyRaster(e),baseR=28,scale=Math.max(.35,(Number(e.r)||baseR)/baseR),directional=e.stageVariant&&DIRECTIONAL_STAGE_VARIANTS.has(e.stageVariant),angle=directional||e.type==='fast'||(e.type==='tank'&&e.eventKind==='crash')?Math.atan2(player.y-e.y,player.x-e.x):e.type==='tank'?(Number(e.phase)||0)*.035:0;
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(pulse*scale,pulse*scale);drawCachedEnemyGlow(ctx,e.hit?'#ffffff':e.color,baseR,(e.type==='tank'?15:12)/Math.max(.6,scale),e.hit?.95:1);ctx.rotate(angle);ctx.drawImage(image,-80,-80,160,160);ctx.restore();
}
function drawEnemies(){for(const e of state.entities.enemies){const p=worldToScreen(e.x,e.y);if(p.x<-180||p.x>vw+180||p.y<-180||p.y>vh+180)continue;const pulse=e.stageProduction||e.eventKind==='stage-01'?1:1+Math.sin(e.phase)*.05;
    if(e.type==='boss'||e.type==='mini'){ctx.save();ctx.translate(p.x,p.y);ctx.scale(pulse,pulse);const glow=e.kind==='apex'?58:e.type==='boss'?44:30;drawCachedEnemyGlow(ctx,e.hit?'#ffffff':e.color,e.r,glow,e.hit?.95:1);ctx.shadowBlur=0;ctx.shadowColor=e.color;ctx.strokeStyle=e.hit?'#fff':e.color;ctx.fillStyle=e.hit?'#fff':e.color;drawEliteShape(e);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.restore();}
    else drawRasterEnemyBody(e,p,pulse);
    if(!['mini','boss'].includes(e.type)&&e.hp<e.maxHp){const width=clamp(e.r*2.15,28,92),y=p.y-e.r*1.28-17;ctx.save();ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(p.x-width/2,y,width,5);ctx.fillStyle=e.color;ctx.fillRect(p.x-width/2,y,width*clamp(e.hp/e.maxHp,0,1),5);ctx.restore();}}
}
function projectileColor(p,fallback=COLORS.white){if(typeof p.color!=='string'||!CSS.supports('color',p.color))p.color=fallback;return p.color;}
function drawBoomerangs(){for(const p of state.entities.curves){if(!p||p.dead)continue;const historyCount=Math.min(p.historyCount||0,p.history?.length||0);if(historyCount>1){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=p.color;ctx.globalAlpha=.18;ctx.lineWidth=p.r*.95;ctx.shadowBlur=18;ctx.shadowColor=p.color;ctx.beginPath();for(let i=0;i<historyCount;i++){const index=((p.historyStart||0)+i)%p.history.length,h=p.history[index],sx=h.x-player.x+vw/2,sy=h.y-player.y+vh/2;i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy);}ctx.stroke();ctx.globalAlpha=.62;ctx.lineWidth=2.1;ctx.stroke();ctx.restore();}const point=setRenderScreenPoint(RENDER_SCREEN_A,p.x,p.y),angle=Math.atan2(p.y-p.lastY,p.x-p.lastX);ctx.save();ctx.translate(point.x,point.y);ctx.rotate(angle);ctx.shadowBlur=24;ctx.shadowColor=p.color;const g=ctx.createLinearGradient(-p.r,0,p.r,0);g.addColorStop(0,'rgba(105,255,224,.10)');g.addColorStop(.58,p.color);g.addColorStop(1,'#ffffff');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-p.r*.95,-p.r*.25);ctx.quadraticCurveTo(0,-p.r*1.05,p.r*1.15,0);ctx.quadraticCurveTo(0,p.r*1.05,-p.r*.95,p.r*.25);ctx.quadraticCurveTo(-p.r*.38,0,-p.r*.95,-p.r*.25);ctx.fill();if(p.stacks>=3){ctx.globalAlpha=.38;ctx.strokeStyle='#d9fff8';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,p.r*1.5,p.r*.58,0,0,TAU);ctx.stroke();}ctx.restore();}}
function drawEnemyProjectileShape(p,kind,tier){
  const r=Math.max(2.4,p.r),color=projectileColor(p,'#ff6ccf');ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=tier===2?1:1.6;
  if(kind==='missile'){ctx.fillStyle='#ffdec4';ctx.beginPath();ctx.moveTo(r*2.25,0);ctx.lineTo(r*.58,-r*.62);ctx.lineTo(-r*1.08,-r*.52);ctx.lineTo(-r*.82,0);ctx.lineTo(-r*1.08,r*.52);ctx.lineTo(r*.58,r*.62);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-r*.72,-r*.34);ctx.lineTo(-r*1.55,-r*.92);ctx.lineTo(-r*1.18,0);ctx.lineTo(-r*1.55,r*.92);ctx.lineTo(-r*.72,r*.34);ctx.closePath();ctx.fill();}
  else if(kind==='ranged-bolt'||kind==='storm'){ctx.beginPath();ctx.moveTo(r*1.7,0);ctx.lineTo(-r*.55,-r*.72);ctx.lineTo(-r*.18,0);ctx.lineTo(-r*.55,r*.72);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#eaffff';ctx.fillRect(-r*.08,-r*.16,r*.92,r*.32);}
  else if(kind==='needle'){ctx.beginPath();ctx.moveTo(r*2.05,0);ctx.lineTo(-r*.62,-r*.48);ctx.lineTo(-r*.18,0);ctx.lineTo(-r*.62,r*.48);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(-r*.12,0);ctx.lineTo(r*1.48,0);ctx.stroke();}
  else if(kind==='forge'){ctx.beginPath();ctx.moveTo(r*1.75,0);ctx.lineTo(-r*.15,-r*.95);ctx.lineTo(-r*.78,0);ctx.lineTo(-r*.15,r*.95);ctx.closePath();ctx.fill();ctx.fillStyle='#fff0b0';ctx.beginPath();ctx.moveTo(r*.92,0);ctx.lineTo(-r*.05,-r*.30);ctx.lineTo(-r*.05,r*.30);ctx.closePath();ctx.fill();}
  else if(kind==='chrono'){ctx.beginPath();ctx.moveTo(r*1.15,0);ctx.lineTo(0,-r);ctx.lineTo(-r*1.15,0);ctx.lineTo(0,r);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(-r*.72,-r*.58);ctx.lineTo(r*.72,r*.58);ctx.moveTo(-r*.72,r*.58);ctx.lineTo(r*.72,-r*.58);ctx.stroke();ctx.fillStyle='#efffff';ctx.beginPath();ctx.arc(0,0,r*.28,0,TAU);ctx.fill();}
  else if(kind==='constellation'){ctx.rotate(Math.PI/4);ctx.strokeRect(-r*.72,-r*.72,r*1.44,r*1.44);ctx.rotate(-Math.PI/4);ctx.fillStyle=color;drawStarPath(4,r*.22,r*.82,0);ctx.fill();ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke();}
  else if(kind==='void'){ctx.beginPath();ctx.arc(0,0,r,Math.PI*.34,Math.PI*1.66);ctx.quadraticCurveTo(r*.18,0,r*.82,-r*.58);ctx.quadraticCurveTo(r*1.18,0,r*.82,r*.58);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#090012';ctx.beginPath();ctx.arc(-r*.12,0,r*.28,0,TAU);ctx.fill();}
  else if(kind==='mirror'){for(const side of[-1,1]){ctx.save();ctx.translate(0,side*r*.46);ctx.beginPath();ctx.moveTo(r*1.05,0);ctx.lineTo(0,-r*.42);ctx.lineTo(-r*.72,0);ctx.lineTo(0,r*.42);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}
  else if(kind==='rune'){ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.42,0,TAU);ctx.stroke();ctx.fillStyle=color;ctx.fillRect(-r*.13,-r*.13,r*.26,r*.26);}
  else if(kind==='mine'){ctx.beginPath();ctx.arc(0,0,r*1.18,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.48,0,TAU);ctx.fill();for(let i=0;i<6;i++){const a=i/6*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.72,Math.sin(a)*r*.72);ctx.lineTo(Math.cos(a)*r*1.48,Math.sin(a)*r*1.48);ctx.stroke();}}
  else if(kind==='sun'){drawStarPath(8,r*.62,r*1.18,0);ctx.fill();ctx.fillStyle='#fff2be';ctx.beginPath();ctx.arc(0,0,r*.38,0,TAU);ctx.fill();}
  else if(kind==='debris'){
    ctx.fillStyle='#69769f';ctx.strokeStyle='#d9e2ff';ctx.lineWidth=tier===2?1:1.5;ctx.beginPath();ctx.moveTo(r*1.55,-r*.24);ctx.lineTo(r*.42,-r*.92);ctx.lineTo(-r*1.08,-r*.58);ctx.lineTo(-r*.72,r*.72);ctx.lineTo(r*.68,r*.58);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.68)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*.62,-r*.36);ctx.lineTo(r*.70,r*.24);ctx.moveTo(-r*.18,r*.52);ctx.lineTo(r*.38,-r*.50);ctx.stroke();
  }
  else if(kind==='ion-globule'){
    const grad=ctx.createRadialGradient(r*.35,-r*.22,1,0,0,r*1.35);grad.addColorStop(0,'#ffffff');grad.addColorStop(.22,'#bff8ff');grad.addColorStop(.58,color);grad.addColorStop(1,'rgba(94,65,185,.10)');ctx.fillStyle=grad;ctx.strokeStyle='#e9fbff';ctx.lineWidth=tier===2?1:1.4;
    ctx.beginPath();ctx.moveTo(r*1.55,0);ctx.bezierCurveTo(r*.82,-r*.92,-r*.42,-r*.90,-r*1.10,-r*.24);ctx.bezierCurveTo(-r*.58,-r*.02,-r*.62,r*.42,-r*1.30,r*.62);ctx.bezierCurveTo(-r*.14,r*.82,r*.92,r*.62,r*1.55,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.globalAlpha=.72;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(-r*.72,-r*.12);ctx.quadraticCurveTo(-r*1.65,-r*.52,-r*2.12,-r*.10);ctx.moveTo(-r*.58,r*.24);ctx.quadraticCurveTo(-r*1.48,r*.66,-r*1.90,r*.42);ctx.stroke();ctx.globalAlpha=1;
  }
  else{ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(0,0,r*.42,0,TAU);ctx.stroke();}
}
function drawEnemyProjectiles(){
  const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,list=state.entities.enemyProjectiles||[],crowded=list.length>90;
  for(const p of list){
    if(!p||p.life<=0)continue;const sx=p.x-player.x+vw/2,sy=p.y-player.y+vh/2;if(sx<-56||sx>vw+56||sy<-56||sy>vh+56)continue;
    const angle=Math.atan2(p.vy||0,p.vx||0),kind=String(p.visual||'orb'),color=projectileColor(p,'#ff6c91');
    ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.rotate(angle);ctx.shadowBlur=tier===0&&!crowded?7:0;ctx.shadowColor=color;drawEnemyProjectileShape(p,kind,tier);ctx.restore();
  }
}
function drawGems(){const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,list=state.entities.gems||[],crowded=list.length>64,now=performance.now()*.004;for(const g of list){if(!g||g.life<=0)continue;const p=worldToScreen(g.x,g.y);if(p.x<-32||p.x>vw+32||p.y<-32||p.y>vh+32)continue;const pulse=.92+.08*Math.sin((g.pulse||0)*2+now),r=Math.max(2,(g.r||4)*pulse);ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));ctx.rotate((g.pulse||0)*.3);ctx.fillStyle='#72e69a';ctx.strokeStyle='#dfffe9';ctx.lineWidth=1.1;ctx.shadowBlur=tier===0&&!crowded?7:0;ctx.shadowColor='#72e69a';ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();if(tier===0&&!crowded)ctx.stroke();ctx.fillStyle='rgba(255,255,255,.86)';ctx.beginPath();ctx.arc(-r*.18,-r*.2,Math.max(.8,r*.2),0,TAU);ctx.fill();ctx.restore();}}
function drawBeamEffects(){
  for(const beam of state.entities.beams){
    if(!beam||beam.life<=0)continue;
    const a=worldToScreen(beam.x1,beam.y1),b=worldToScreen(beam.x2,beam.y2),alpha=clamp(beam.life/Math.max(.001,beam.max||beam.life),0,1),beamMargin=Math.max(80,(Number(beam.width)||8)*3);
    if(Math.max(a.x,b.x)<-beamMargin||Math.min(a.x,b.x)>vw+beamMargin||Math.max(a.y,b.y)<-beamMargin||Math.min(a.y,b.y)>vh+beamMargin)continue;
    if(beam.terminus===true){
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux,w=Math.max(42,Number(beam.width)||120),over=beam.overdrive===true,pulse=.90+.10*Math.sin((1-alpha)*Math.PI*3);
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(.54+.42*alpha);ctx.shadowBlur=over?78:58;ctx.shadowColor=over?'#badaff':'#75d8ff';
      const grad=ctx.createLinearGradient(a.x,a.y,b.x,b.y);grad.addColorStop(0,'rgba(255,255,255,.99)');grad.addColorStop(.12,over?'rgba(204,225,255,.98)':'rgba(188,239,255,.96)');grad.addColorStop(.52,over?'rgba(112,151,255,.88)':'rgba(73,184,255,.74)');grad.addColorStop(1,'rgba(53,131,255,.08)');ctx.fillStyle=grad;
      const near=w*.44*pulse,mid=w*(over?1.08:.92)*pulse,far=w*(over?.48:.38)*pulse;
      ctx.beginPath();ctx.moveTo(a.x-ux*24+nx*near,a.y-uy*24+ny*near);ctx.quadraticCurveTo(a.x+ux*len*.20+nx*mid,a.y+uy*len*.20+ny*mid,b.x+nx*far,b.y+ny*far);ctx.lineTo(b.x-nx*far,b.y-ny*far);ctx.quadraticCurveTo(a.x+ux*len*.20-nx*mid,a.y+uy*len*.20-ny*mid,a.x-ux*24-nx*near,a.y-uy*24-ny*near);ctx.closePath();ctx.fill();
      ctx.globalAlpha=.94*alpha+.05;ctx.strokeStyle='#ffffff';ctx.lineCap='round';ctx.lineWidth=Math.max(10,w*(over?.24:.18));ctx.shadowBlur=46;ctx.beginPath();ctx.moveTo(a.x-ux*9,a.y-uy*9);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.globalAlpha=.35+.38*alpha;ctx.strokeStyle=over?'#d8caff':'#a7ebff';ctx.lineWidth=over?5:3;for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(a.x+nx*s*w*.50,a.y+ny*s*w*.50);ctx.quadraticCurveTo(a.x+ux*len*.30+nx*s*w*(over?.92:.76),a.y+uy*len*.30+ny*s*w*(over?.92:.76),b.x+nx*s*w*.26,b.y+ny*s*w*.26);ctx.stroke();}
      ctx.globalAlpha=.78*alpha;ctx.strokeStyle='#ffffff';ctx.lineWidth=2.4;for(let ring=0;ring<(over?5:3);ring++){const rr=w*(.44+ring*.20)+(1-alpha)*w*.24;ctx.beginPath();ctx.ellipse(a.x-ux*3,a.y-uy*3,rr,rr*.46,Math.atan2(dy,dx),0,TAU);ctx.stroke();}
      ctx.restore();continue;
    }
    if(beam.stageBossAttack){
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,w=Math.max(4,Number(beam.width)||8),style=beam.stageBossAttack;
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=beam.color;ctx.shadowBlur=style==='blaster'?34:style==='tentacle'?24:18;
      if(style==='tentacle'){
        const bend=(Number(beam.bend)||1)*Math.min(38,len*.18),mx=(a.x+b.x)/2+nx*bend,my=(a.y+b.y)/2+ny*bend;
        ctx.globalAlpha=alpha*.22;ctx.strokeStyle=beam.color;ctx.lineWidth=w*2.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();
        ctx.globalAlpha=.88*alpha;ctx.lineWidth=w*.78;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();
        ctx.strokeStyle='#ffffff';ctx.globalAlpha=.74*alpha;ctx.lineWidth=Math.max(1.3,w*.20);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();
        for(let i=1;i<=3;i++){const t=i/4,qx=(1-t)*(1-t)*a.x+2*(1-t)*t*mx+t*t*b.x,qy=(1-t)*(1-t)*a.y+2*(1-t)*t*my+t*t*b.y;ctx.globalAlpha=.55*alpha;ctx.fillStyle=i%2?'#ffffff':beam.color;ctx.beginPath();ctx.arc(qx,qy,Math.max(2,w*.18),0,TAU);ctx.fill();}
      }else if(style==='shutter'){
        const plate=Math.max(18,w*1.18),segments=Math.max(4,Math.min(10,Math.round(len/72)));ctx.globalCompositeOperation='source-over';ctx.shadowBlur=14;ctx.shadowColor=beam.color;
        ctx.globalAlpha=.96*alpha;ctx.fillStyle='#1a2443';ctx.strokeStyle='#c9d5ff';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(a.x+nx*plate,a.y+ny*plate);ctx.lineTo(b.x+nx*plate,b.y+ny*plate);ctx.lineTo(b.x-nx*plate,b.y-ny*plate);ctx.lineTo(a.x-nx*plate,a.y-ny*plate);ctx.closePath();ctx.fill();ctx.stroke();
        for(let i=0;i<segments;i++){const q=(i+.5)/segments,cx=a.x+dx*q,cy=a.y+dy*q,hh=plate*.78;ctx.strokeStyle=i%2?'#7f91d5':'#e4e9ff';ctx.lineWidth=i%2?2.4:1.3;ctx.beginPath();ctx.moveTo(cx+nx*hh,cy+ny*hh);ctx.lineTo(cx-nx*hh,cy-ny*hh);ctx.stroke();}
        ctx.globalAlpha=.72*alpha;ctx.strokeStyle='#ffcf70';ctx.setLineDash([10,8]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x+nx*plate*.58,a.y+ny*plate*.58);ctx.lineTo(b.x+nx*plate*.58,b.y+ny*plate*.58);ctx.stroke();ctx.setLineDash([]);
      }else if(style==='fracture'){
        const zig=6,amp=Math.min(18,w*.82);ctx.globalCompositeOperation='source-over';ctx.shadowBlur=10;ctx.shadowColor=beam.color;ctx.strokeStyle='#151c35';ctx.globalAlpha=.92*alpha;ctx.lineWidth=w*1.25;ctx.beginPath();ctx.moveTo(a.x,a.y);for(let i=1;i<=zig;i++){const q=i/zig,side=i===zig?0:(i%2?1:-1),x=a.x+dx*q+nx*amp*side,y=a.y+dy*q+ny*amp*side;ctx.lineTo(x,y);}ctx.stroke();
        ctx.strokeStyle=beam.color;ctx.globalAlpha=.84*alpha;ctx.lineWidth=Math.max(2,w*.34);ctx.beginPath();ctx.moveTo(a.x,a.y);for(let i=1;i<=zig;i++){const q=i/zig,side=i===zig?0:(i%2?1:-1),x=a.x+dx*q+nx*amp*side,y=a.y+dy*q+ny*amp*side;ctx.lineTo(x,y);}ctx.stroke();
        ctx.strokeStyle='#ffcf70';ctx.globalAlpha=.52*alpha;ctx.lineWidth=1.4;for(let i=1;i<zig;i+=2){const q=i/zig,x=a.x+dx*q,y=a.y+dy*q;ctx.beginPath();ctx.moveTo(x-nx*w*.55,y-ny*w*.55);ctx.lineTo(x+nx*w*.55,y+ny*w*.55);ctx.stroke();}
      }else if(style==='ion-shear'){
        const bend=(Number(beam.bend)||1)*Math.min(34,len*.10),mx=(a.x+b.x)*.5+nx*bend,my=(a.y+b.y)*.5+ny*bend;ctx.globalCompositeOperation='lighter';ctx.shadowBlur=28;ctx.shadowColor=beam.color;
        ctx.globalAlpha=.24*alpha;ctx.strokeStyle=beam.color;ctx.lineWidth=w*2.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();
        ctx.globalAlpha=.86*alpha;ctx.strokeStyle=beam.color;ctx.lineWidth=w*.78;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();
        ctx.globalAlpha=.92*alpha;ctx.strokeStyle='#f2fdff';ctx.lineWidth=Math.max(1.5,w*.18);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();
        for(let i=1;i<=5;i++){const q=i/6,qx=(1-q)*(1-q)*a.x+2*(1-q)*q*mx+q*q*b.x,qy=(1-q)*(1-q)*a.y+2*(1-q)*q*my+q*q*b.y;ctx.fillStyle=i%2?'#ff9bdc':'#9df4ff';ctx.globalAlpha=.58*alpha;ctx.beginPath();ctx.ellipse(qx,qy,Math.max(2.2,w*.14),Math.max(1.2,w*.07),Math.atan2(dy,dx),0,TAU);ctx.fill();}
      }else if(style==='rift'){
        ctx.globalAlpha=.78*alpha;ctx.strokeStyle=beam.color;ctx.lineWidth=w*1.15;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.strokeStyle='#ffffff';ctx.globalAlpha=.66*alpha;ctx.lineWidth=Math.max(1,w*.22);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }else{
        ctx.globalAlpha=.22*alpha;ctx.strokeStyle=beam.color;ctx.lineWidth=w*3.4;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.globalAlpha=.96*alpha;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.strokeStyle='#ffffff';ctx.globalAlpha=.94*alpha;ctx.lineWidth=Math.max(2,w*.28);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.globalAlpha=.76*alpha;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;for(let ring=0;ring<3;ring++){const rr=w*(.60+ring*.34)+(1-alpha)*w*.30;ctx.beginPath();ctx.ellipse(a.x,a.y,rr,rr*.55,Math.atan2(dy,dx),0,TAU);ctx.stroke();}
      }
      ctx.restore();continue;
    }
    ctx.save();ctx.globalAlpha=alpha;ctx.shadowBlur=18;ctx.shadowColor=beam.color;ctx.strokeStyle=beam.color;ctx.lineCap='round';ctx.lineWidth=beam.width*2.8;
    ctx.globalAlpha=alpha*.18;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.globalAlpha=alpha;ctx.lineWidth=beam.width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.strokeStyle='#ffffff';ctx.globalAlpha=alpha*.78;ctx.lineWidth=Math.max(.7,beam.width*.32);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
  }
}
function drawForegroundEffects(){for(const s of state.entities.shockwaves){const sx=s.x-player.x+vw/2,sy=s.y-player.y+vh/2,r=Math.max(0,Number(s.r)||0);if(sx+r<-24||sx-r>vw+24||sy+r<-24||sy-r>vh+24)continue;ctx.globalAlpha=s.life/s.max;ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.beginPath();ctx.arc(sx,sy,r,0,TAU);ctx.stroke();}ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.textAlign='center';for(const t of state.entities.texts){const sx=t.x-player.x+vw/2,sy=t.y-player.y+vh/2;if(sx<-140||sx>vw+140||sy<-80||sy>vh+80)continue;ctx.globalAlpha=clamp(t.life/t.max,0,1);ctx.fillStyle=t.color;ctx.font=`800 ${t.size}px IBM Plex Sans KR`;ctx.fillText(t.text,sx,sy);}ctx.globalAlpha=1;}

const POST_ROSTER_RASTER_CACHE=new Map();
function postRosterRaster(key,size,painter){return cachedRasterSurface(POST_ROSTER_RASTER_CACHE,key,size,painter,64);}
function vacuumSeedRaster(charge,blooming,n){
  const petals=Math.max(3,charge+2),size=96;return postRosterRaster(`seed:${charge}:${blooming?1:0}:${n}`,size,(g,sz)=>{const c=sz/2;g.save();g.translate(c,c);g.shadowBlur=20;g.shadowColor='#d58cff';g.strokeStyle=blooming?'#fff2ff':'#d58cff';g.lineWidth=1.6+charge*.35;g.globalAlpha=.55+.08*charge;g.beginPath();g.arc(0,0,10+charge*2.4,0,TAU);g.stroke();g.globalAlpha=1;for(let i=0;i<petals;i++){const a=i/petals*TAU;g.save();g.rotate(a);g.fillStyle=i%2?'#7d49a8':'#e7b8ff';g.beginPath();g.ellipse(13,0,7,3,0,0,TAU);g.fill();g.restore();}g.fillStyle='#090410';g.beginPath();g.arc(0,0,5.5+n*.4,0,TAU);g.fill();g.restore();});
}
function phaseMineRaster(phantom){
  const size=64,r=phantom?6:8;return postRosterRaster(`mine:${phantom?1:0}`,size,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=phantom?10:16;g.shadowColor=phantom?'#dffcff':'#74e8ff';g.strokeStyle=phantom?'#dffcff':'#74e8ff';g.fillStyle=phantom?'rgba(210,250,255,.25)':'rgba(31,104,139,.68)';g.lineWidth=1.5;g.beginPath();g.moveTo(0,-r*1.3);g.lineTo(r,0);g.lineTo(0,r*1.3);g.lineTo(-r,0);g.closePath();g.fill();g.stroke();g.restore();});
}
function guidedMissileRaster(micro,terminal,lit,color){
  const size=80,r=micro?3.5:5.5;return postRosterRaster(`missile:${micro?1:0}:${terminal?1:0}:${lit?1:0}:${color||''}`,size,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=micro?10:17;g.shadowColor=color||'#ffb66e';g.fillStyle=micro?'#ffe4bd':'#fff0dc';g.beginPath();g.moveTo(r*2.1,0);g.lineTo(-r*.65,-r*.65);g.lineTo(-r*1.15,0);g.lineTo(-r*.65,r*.65);g.closePath();g.fill();if(lit){g.fillStyle=terminal?'#fff7c9':'#ff9d52';g.beginPath();g.moveTo(-r*.9,-r*.35);g.lineTo(-r*2.2,0);g.lineTo(-r*.9,r*.35);g.closePath();g.fill();}g.restore();});
}
function missilePodRaster(){
  return postRosterRaster('missile-pod',64,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.fillStyle='#18263b';g.strokeStyle='#ffd3a0';g.lineWidth=1.4;g.shadowBlur=10;g.shadowColor='#ffb66e';g.fillRect(-8,-5,16,10);g.strokeRect(-8,-5,16,10);g.restore();});
}
function gateRaster(echoed){
  return postRosterRaster(`gate:${echoed?1:0}`,96,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.shadowBlur=18;g.shadowColor=echoed?COLORS.pink:'#a9b7ff';g.strokeStyle=echoed?COLORS.pink:'#cbd3ff';g.lineWidth=2.2;g.beginPath();g.ellipse(0,0,15,7.5,0,0,TAU);g.stroke();g.globalAlpha=.42;g.beginPath();g.ellipse(0,0,9,20,0,0,TAU);g.stroke();g.restore();});
}
const POST_ROSTER_ARMED_MINES=[];
function drawPostRosterWeaponEntities(){
  const t=performance.now()/1000;
  const seeds=state.entities.vacuumSeeds||[];for(const seed of seeds){if(!seed||seed.life<=0)continue;const sx=seed.x-player.x+vw/2,sy=seed.y-player.y+vh/2,n=seed.n||1,charge=Math.min(5,seed.charge||0),pulse=1+Math.sin(t*5+seed.id)*.08,image=vacuumSeedRaster(charge,!!seed.blooming,n);ctx.save();ctx.translate(sx,sy);ctx.rotate(-t*.7);ctx.scale(pulse,pulse);ctx.drawImage(image,-48,-48,96,96);ctx.restore();}
  const mines=state.entities.phaseMines||[],armed=POST_ROSTER_ARMED_MINES;armed.length=0;for(const mine of mines)if(mine&&mine.life>0&&mine.arm<=0&&!mine.phantom)armed.push(mine);if(weaponCount('mine')>=4){ctx.save();ctx.strokeStyle='rgba(116,232,255,.30)';ctx.lineWidth=1.15;for(let i=1;i<armed.length;i++){const a=armed[i-1],b=armed[i];if(Math.hypot(a.x-b.x,a.y-b.y)>210)continue;const sax=a.x-player.x+vw/2,say=a.y-player.y+vh/2,sbx=b.x-player.x+vw/2,sby=b.y-player.y+vh/2;ctx.beginPath();ctx.moveTo(sax,say);ctx.lineTo(sbx,sby);ctx.stroke();}ctx.restore();}
  for(const mine of mines){if(!mine||mine.life<=0)continue;const sx=mine.x-player.x+vw/2,sy=mine.y-player.y+vh/2,image=phaseMineRaster(!!mine.phantom);ctx.save();ctx.translate(sx,sy);ctx.rotate(t*1.3+mine.id*.2);ctx.globalAlpha=mine.arm>0?.38:1;ctx.drawImage(image,-32,-32,64,64);ctx.restore();}
  const missiles=state.entities.guidedMissiles||[];for(const m of missiles){if(!m||m.life<=0)continue;const sx=m.x-player.x+vw/2,sy=m.y-player.y+vh/2,a=Math.atan2(m.vy||0,m.vx||0),image=guidedMissileRaster(!!m.micro,!!m.terminal,m.age>=m.ignition,m.color||'#ffb66e');ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.drawImage(image,-40,-40,80,80);ctx.restore();}
  if(weaponCount('missile')){const a=Number.isFinite(player.facingAngle)?player.facingAngle:-Math.PI/2,flash=clamp((player.missilePodFlash||0)/.24,0,1),image=missilePodRaster();for(const side of[-1,1]){const pa=a+side*Math.PI/2,sx=Math.cos(pa)*31+vw/2,sy=Math.sin(pa)*31+vh/2;ctx.save();ctx.translate(sx,sy);ctx.rotate(a);ctx.drawImage(image,-32,-32,64,64);if(flash>0){ctx.globalAlpha=flash;ctx.fillStyle='#fff1c9';ctx.beginPath();ctx.arc(side*3,0,4+flash*3,0,TAU);ctx.fill();}ctx.restore();}}
  const nets=state.entities.gateNetworks||[];for(const net of nets){if(!net||net.life<=0)continue;const alpha=clamp(Math.min(net.life,.45)/.45,.15,1),image=gateRaster(!!net.echoed);for(let i=0;i<net.gates.length;i++){const gate=net.gates[i],sx=gate.x-player.x+vw/2,sy=gate.y-player.y+vh/2;ctx.save();ctx.translate(sx,sy);ctx.rotate((i%2?1:-1)*t*.55);ctx.globalAlpha=alpha;ctx.drawImage(image,-48,-48,96,96);ctx.restore();}}
}
function drawAlliedEffects(){for(const p of state.entities.particles){const sx=p.x-player.x+vw/2,sy=p.y-player.y+vh/2,size=Math.max(1,Number(p.size)||3);if(sx<-24-size||sx>vw+24+size||sy<-24-size||sy>vh+24+size)continue;ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.shadowBlur=9;ctx.shadowColor=p.color;if(p.star){ctx.save();ctx.translate(sx,sy);drawStarPath(4,size*.25,size*.62,0);ctx.fill();ctx.restore();}else{ctx.beginPath();ctx.arc(sx,sy,size*.5,0,TAU);ctx.fill();}}ctx.shadowBlur=0;ctx.globalAlpha=1;drawPostRosterWeaponEntities();}
function drawEffects(includeParticles=true){drawForegroundEffects();if(includeParticles)drawAlliedEffects();}

const WELL_RASTER_CACHE=new Map();
function wellRaster(key,size,painter){return cachedRasterSurface(WELL_RASTER_CACHE,key,size,painter,40);}
function singularityWellRaster(t){
  const frame=Math.floor((t*6)%8),size=128;return wellRaster(`singularity:${frame}`,size,(g,sz)=>{g.save();g.translate(sz/2,sz/2);g.rotate(frame/8*TAU);g.shadowBlur=24;g.shadowColor='#e65cff';for(let ring=0;ring<2;ring++){g.strokeStyle=ring?'rgba(255,118,221,.42)':'rgba(238,196,255,.82)';g.lineWidth=ring?1.4:2.4;g.setLineDash(ring?[4,8]:[]);g.beginPath();for(let i=0;i<16;i++){const a=i/16*TAU,r=(ring?44:29)+(i%2?8:-3),x=Math.cos(a)*r,y=Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.stroke();}g.setLineDash([]);const core=g.createRadialGradient(0,0,0,0,0,24);core.addColorStop(0,'#ffffff');core.addColorStop(.16,'#f3a2ff');core.addColorStop(.44,'#8d1fb1');core.addColorStop(1,'rgba(16,0,31,0)');g.fillStyle=core;g.beginPath();g.arc(0,0,24,0,TAU);g.fill();g.fillStyle='#09000f';drawStarPath(6,4,10,0,g);g.fill();g.restore();});
}
function drawTraitSingularity(w,p,alpha,t){const image=singularityWellRaster(t);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;ctx.drawImage(image,-64,-64,128,128);ctx.restore();}
function drawWells(){
  const t=performance.now()/1000;
  for(const w of state.entities.wells){if(!w||!Number.isFinite(w.x)||!Number.isFinite(w.y))continue;const p=setRenderScreenPoint(RENDER_SCREEN_A,w.x,w.y),alpha=clamp(Math.min(w.life,.35)/.35,0,1);if(w.kind==='trait-singularity')drawTraitSingularity(w,p,alpha,t);else drawGravityLens(w,p,alpha,t);}
}
function droneOrbitRaster(){
  return playerRaster('orbit:drone',64,(g,sz)=>{g.save();g.translate(sz/2,sz/2);
    g.fillStyle='#0b2630';g.strokeStyle='#baffea';g.lineWidth=1.6;g.beginPath();g.moveTo(0,-10);g.lineTo(8,6);g.lineTo(0,3);g.lineTo(-8,6);g.closePath();g.fill();g.stroke();g.restore();});
}
function drawEquippedOrbits(x,y,t){
  const droneN=weaponCount('drone');if(droneN){const image=droneOrbitRaster();for(const pos of meteorDronePositions(droneN)){const sx=pos.x-player.x+vw/2,sy=pos.y-player.y+vh/2;ctx.save();ctx.translate(sx,sy);ctx.rotate(pos.a+Math.PI/2);ctx.drawImage(image,-32,-32,64,64);ctx.restore();}}}
const PLAYER_RASTER_CACHE=new Map();
function playerRaster(key,size,painter){return cachedRasterSurface(PLAYER_RASTER_CACHE,key,size,painter,48);}
function playerCoreRaster(growth,hit){
  const bucket=Math.min(24,Math.floor(Math.max(0,growth)/3)),auraR=38+Math.min(28,bucket*2.7),size=176;return playerRaster(`core:${bucket}:${hit?1:0}`,size,(g,sz)=>{g.save();g.translate(sz/2,sz/2);const aura=g.createRadialGradient(0,0,2,0,0,auraR);aura.addColorStop(0,hit?'rgba(255,95,120,.62)':'rgba(210,251,255,.52)');aura.addColorStop(.34,'rgba(91,150,255,.22)');aura.addColorStop(1,'rgba(65,120,255,0)');g.fillStyle=aura;g.fillRect(-auraR,-auraR,auraR*2,auraR*2);g.globalAlpha=.48;g.strokeStyle='#a9efff';g.lineWidth=1.2;g.beginPath();g.ellipse(0,0,30,10,.35,0,TAU);g.stroke();g.strokeStyle='#c8afff';g.beginPath();g.ellipse(0,0,27,8,-.7,0,TAU);g.stroke();g.globalAlpha=1;g.shadowBlur=28;g.shadowColor=hit?COLORS.red:'#7ce8ff';const shell=g.createLinearGradient(-18,-18,18,18);shell.addColorStop(0,'#ffffff');shell.addColorStop(.28,'#b8f6ff');shell.addColorStop(.62,'#8295ff');shell.addColorStop(1,'#322a78');g.fillStyle=shell;g.beginPath();g.moveTo(0,-21);g.lineTo(15,-10);g.lineTo(19,5);g.lineTo(8,19);g.lineTo(-8,19);g.lineTo(-19,5);g.lineTo(-15,-10);g.closePath();g.fill();g.strokeStyle='rgba(232,252,255,.86)';g.lineWidth=1.4;g.stroke();g.fillStyle='#f7ffff';drawStarPath(8,5.4,13,-Math.PI/2,g);g.fill();g.fillStyle='#101737';g.beginPath();g.arc(0,0,5.3,0,TAU);g.fill();g.fillStyle='#ffffff';g.beginPath();g.arc(-1.4,-1.8,1.5,0,TAU);g.fill();g.shadowBlur=0;g.strokeStyle='rgba(0,5,20,.92)';g.lineWidth=4.8;g.beginPath();g.arc(0,0,23.5,0,TAU);g.stroke();g.strokeStyle='#eaffff';g.lineWidth=2.1;g.beginPath();g.arc(0,0,23.5,0,TAU);g.stroke();g.restore();});
}
function playerGrowthRingRaster(){
  return playerRaster('growth-ring',112,(g,sz)=>{g.save();g.translate(sz/2,sz/2);for(let i=0;i<6;i++){const a=i/6*TAU,rr=34+(i%2)*3;g.fillStyle=i%2?'#c7b5ff':'#8ff4ff';g.shadowBlur=10;g.shadowColor=g.fillStyle;g.save();g.translate(Math.cos(a)*rr,Math.sin(a)*rr);drawStarPath(4,1.2,2.8,a,g);g.fill();g.restore();}g.restore();});
}
function drawPlayerCrystalCoreModel(g,x,y,t,growth=0,subject=player,scale=.90){
  const pulse=1+Math.sin(t*.0042)*.025,auraR=38+Math.min(28,growth*.9),skinId=window.stackfallEquippedSkin?.()||'default';
  if(typeof window.stackfallDrawPlayerSkin==='function'&&skinId!=='default'){
    const handled=window.stackfallDrawPlayerSkin({ctx:g,x,y,t,growth,subject,scale,skinId});if(handled)return;
  }
  g.save();g.translate(x,y);g.scale(scale,scale);if(subject?.invuln>0&&Math.floor(subject.invuln*20)%2===0)g.globalAlpha=.42;
  const aura=g.createRadialGradient(0,0,2,0,0,auraR);aura.addColorStop(0,subject?.hitPulse?'rgba(255,95,120,.62)':'rgba(210,251,255,.52)');aura.addColorStop(.34,'rgba(91,150,255,.22)');aura.addColorStop(1,'rgba(65,120,255,0)');g.fillStyle=aura;g.fillRect(-auraR,-auraR,auraR*2,auraR*2);
  g.save();g.globalAlpha=.48;g.strokeStyle='#a9efff';g.lineWidth=1.2;g.beginPath();g.ellipse(0,0,30,10,.35,0,TAU);g.stroke();g.strokeStyle='#c8afff';g.beginPath();g.ellipse(0,0,27,8,-.7,0,TAU);g.stroke();g.restore();
  if(growth>=5){g.save();g.rotate(-t*.00031);for(let i=0;i<6;i++){const a=i/6*TAU,rr=34+(i%2)*3;g.fillStyle=i%2?'#c7b5ff':'#8ff4ff';g.shadowBlur=10;g.shadowColor=g.fillStyle;g.save();g.translate(Math.cos(a)*rr,Math.sin(a)*rr);drawStarPath(4,1.2,2.8,a,g);g.fill();g.restore();}g.restore();}
  g.scale(pulse,pulse);g.shadowBlur=28;g.shadowColor=subject?.hitPulse?COLORS.red:'#7ce8ff';const shell=g.createLinearGradient(-18,-18,18,18);shell.addColorStop(0,'#ffffff');shell.addColorStop(.28,'#b8f6ff');shell.addColorStop(.62,'#8295ff');shell.addColorStop(1,'#322a78');g.fillStyle=shell;g.beginPath();g.moveTo(0,-21);g.lineTo(15,-10);g.lineTo(19,5);g.lineTo(8,19);g.lineTo(-8,19);g.lineTo(-19,5);g.lineTo(-15,-10);g.closePath();g.fill();g.strokeStyle='rgba(232,252,255,.86)';g.lineWidth=1.4;g.stroke();g.fillStyle='#f7ffff';drawStarPath(8,5.4,13,-Math.PI/2,g);g.fill();g.fillStyle='#101737';g.beginPath();g.arc(0,0,5.3,0,TAU);g.fill();g.fillStyle='#ffffff';g.beginPath();g.arc(-1.4,-1.8,1.5,0,TAU);g.fill();g.shadowBlur=0;g.strokeStyle='rgba(0,5,20,.92)';g.lineWidth=4.8;g.beginPath();g.arc(0,0,23.5,0,TAU);g.stroke();g.strokeStyle='#eaffff';g.lineWidth=2.1;g.beginPath();g.arc(0,0,23.5,0,TAU);g.stroke();g.restore();
}
function drawPlayerCrystalCore(x,y,t,growth){drawPlayerCrystalCoreModel(ctx,x,y,t,growth,player,.90);}
window.stackfallDrawPlayerCorePreview=(g,x,y,t,scale=2.35)=>drawPlayerCrystalCoreModel(g,x,y,t,0,{invuln:0,hitPulse:0},scale);
function drawPlayerFacingIndicator(x,y){const a=Number.isFinite(player.facingAngle)?player.facingAngle:-Math.PI/2,rr=31;ctx.save();ctx.translate(x+Math.cos(a)*rr,y+Math.sin(a)*rr);ctx.rotate(a);ctx.shadowBlur=13;ctx.shadowColor='#7ce8ff';ctx.fillStyle='#ffffff';ctx.strokeStyle='#15375e';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-5,-5);ctx.lineTo(-2,0);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
function drawTraitSignatures(x,y,t){
  const traits=state.bossTraits||{},augments=state.weaponAugments||{};ctx.save();ctx.translate(x,y);
  if(traits.stellar){ctx.save();ctx.translate(0,-38);ctx.fillStyle='#ffe49a';ctx.shadowBlur=18;ctx.shadowColor='#ffe49a';ctx.beginPath();ctx.moveTo(-12,6);ctx.lineTo(-9,-7);ctx.lineTo(-2,0);ctx.lineTo(0,-11);ctx.lineTo(5,0);ctx.lineTo(12,-7);ctx.lineTo(10,6);ctx.closePath();ctx.fill();ctx.restore();}
  if(traits.aegis){ctx.save();ctx.rotate(-t*.00022);ctx.strokeStyle='rgba(131,255,209,.58)';ctx.lineWidth=2;ctx.setLineDash([9,8]);ctx.beginPath();ctx.arc(0,0,47,0,TAU);ctx.stroke();ctx.restore();}
  if(traits.singularity){const a=t*.00047+1.2,px=Math.cos(a)*51,py=Math.sin(a)*23;ctx.save();ctx.translate(px,py);ctx.fillStyle='#f0a2ff';ctx.shadowBlur=16;ctx.shadowColor='#e65cff';drawStarPath(6,2.5,7,a);ctx.fill();ctx.restore();}
  if(traits.eclipse){ctx.save();ctx.rotate(t*.00013);ctx.strokeStyle='#ff76bd';ctx.lineWidth=4;ctx.shadowBlur=15;ctx.shadowColor='#ff76bd';ctx.beginPath();ctx.arc(0,0,55,-1.0,1.0);ctx.stroke();ctx.restore();}
  if(traits.chrono){ctx.save();ctx.rotate(t*.00036);ctx.strokeStyle='#8fffe0';ctx.lineWidth=1.4;for(let i=0;i<12;i++){const a=i/12*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*48,Math.sin(a)*48);ctx.lineTo(Math.cos(a)*55,Math.sin(a)*55);ctx.stroke();}ctx.restore();}
  if(traits.harvest){ctx.save();ctx.rotate(-t*.00029);for(let i=0;i<5;i++){const a=i/5*TAU;ctx.fillStyle=i%2?'#ff9a9a':'#ffd1c9';ctx.beginPath();ctx.ellipse(Math.cos(a)*59,Math.sin(a)*31,3,7,a,0,TAU);ctx.fill();}ctx.restore();}
  let augmentCount=0;for(const key in augments)if(augments[key])augmentCount++;if(augmentCount){ctx.save();ctx.rotate(t*.00018);let i=0;for(const key in augments){if(!augments[key])continue;const a=i/augmentCount*TAU,rr=66+(i%2)*7,color=WEAPONS[key]?.color||'#ffffff';ctx.fillStyle=color;ctx.shadowBlur=8;ctx.shadowColor=color;ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,2.2,0,TAU);ctx.fill();i++;}ctx.restore();}ctx.restore();
}
function drawPlayer(){
  const x=vw/2,y=vh/2,t=performance.now(),growth=totalGrowth();drawDefenseBarrier();drawPlayerCrystalCore(x,y,t,growth);drawPlayerFacingIndicator(x,y);drawEquippedOrbits(x,y,t);drawTraitSignatures(x,y,t);
  if(growth>=18||state.time>=150){const power=Math.min(1,Math.max((growth-18)/22,(state.time-120)/240));ctx.save();ctx.translate(x,y);ctx.globalAlpha=.12+.18*power;for(let ring=0;ring<3;ring++){ctx.save();ctx.rotate((ring%2?1:-1)*t/(8200+ring*1400));const r=61+ring*15+Math.sin(t/520+ring)*2;ctx.strokeStyle=ring===1?'#c6a8ff':'#8ff4ff';ctx.lineWidth=.9+power;ctx.setLineDash([4+ring*2,13-ring]);ctx.lineDashOffset=-t/(75+ring*22);ctx.beginPath();ctx.arc(0,0,r,ring*.45,TAU-ring*.35);ctx.stroke();ctx.restore();}ctx.setLineDash([]);ctx.restore();}
}
