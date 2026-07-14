function worldToScreen(x,y){return{x:x-player.x+vw/2,y:y-player.y+vh/2};}
function seeded(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const cosmicRand=seeded(830241);
const STAR_LAYERS=[
  {parallax:.012,size:1700,count:120,stars:[]},
  {parallax:.035,size:1400,count:95,stars:[]},
  {parallax:.085,size:1100,count:70,stars:[]}
];
for(const layer of STAR_LAYERS){
  for(let i=0;i<layer.count;i++)layer.stars.push({x:cosmicRand()*layer.size,y:cosmicRand()*layer.size,r:.4+cosmicRand()*1.6,a:.16+cosmicRand()*.72,hue:cosmicRand(),phase:cosmicRand()*TAU});
}
const NEBULAE=Array.from({length:9},(_,i)=>({x:cosmicRand()*1900,y:cosmicRand()*1350,r:210+cosmicRand()*390,c:i%4,rot:cosmicRand()*TAU}));
function wrap(v,size){return ((v%size)+size)%size;}

function drawBackground(){
  const base=ctx.createLinearGradient(0,0,vw,vh);
  base.addColorStop(0,'#02040d');base.addColorStop(.45,'#080c20');base.addColorStop(1,'#01030a');
  ctx.fillStyle=base;ctx.fillRect(0,0,vw,vh);

  const ambient=ctx.createRadialGradient(vw*.5,vh*.47,0,vw*.5,vh*.47,Math.max(vw,vh)*.78);
  ambient.addColorStop(0,'rgba(45,60,145,.25)');ambient.addColorStop(.45,'rgba(19,25,68,.10)');ambient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=ambient;ctx.fillRect(0,0,vw,vh);

  const palettes=[
    ['rgba(63,77,202,.14)','rgba(31,20,93,0)'],
    ['rgba(183,54,184,.10)','rgba(72,16,91,0)'],
    ['rgba(20,143,174,.11)','rgba(6,44,73,0)'],
    ['rgba(87,49,162,.10)','rgba(24,11,70,0)']
  ];
  for(const n of NEBULAE){
    const px=wrap(n.x-player.x*.016,1900)-260,py=wrap(n.y-player.y*.012,1350)-210;
    ctx.save();ctx.translate(px,py);ctx.rotate(n.rot);
    const g=ctx.createRadialGradient(0,0,0,0,0,n.r);
    g.addColorStop(0,palettes[n.c][0]);g.addColorStop(1,palettes[n.c][1]);
    ctx.fillStyle=g;ctx.scale(1.55,.72);ctx.beginPath();ctx.arc(0,0,n.r,0,TAU);ctx.fill();ctx.restore();
  }

  ctx.save();
  ctx.translate(vw*.83-wrap(player.x*.005,90),vh*.18-wrap(player.y*.003,55));ctx.rotate(-.22);
  const planetR=Math.min(vw,vh)*.11;
  const planet=ctx.createRadialGradient(-planetR*.34,-planetR*.35,4,0,0,planetR);
  planet.addColorStop(0,'rgba(171,188,255,.18)');planet.addColorStop(.48,'rgba(68,73,145,.10)');planet.addColorStop(1,'rgba(6,8,24,0)');
  ctx.fillStyle=planet;ctx.beginPath();ctx.arc(0,0,planetR,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(130,160,255,.09)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,planetR*1.72,planetR*.29,0,0,TAU);ctx.stroke();ctx.restore();

  const now=performance.now();
  for(let li=0;li<STAR_LAYERS.length;li++){
    const layer=STAR_LAYERS[li],tile=layer.size,ox=player.x*layer.parallax,oy=player.y*layer.parallax;
    for(const star of layer.stars){
      const x=wrap(star.x-ox,tile)-100,y=wrap(star.y-oy,tile)-100;
      if(x>vw+100||y>vh+100)continue;
      const twinkle=.70+.30*Math.sin(now*.0015+star.phase);
      ctx.globalAlpha=star.a*twinkle;
      ctx.fillStyle=star.hue>.84?'#cdbfff':star.hue>.56?'#8fe9ff':'#f6f8ff';
      ctx.beginPath();ctx.arc(x,y,star.r+(li===2?.18:0),0,TAU);ctx.fill();
      if(star.r>1.45){ctx.globalAlpha*=.42;ctx.fillRect(x-5,y-.35,10,.7);ctx.fillRect(x-.35,y-5,.7,10);}
    }
  }
  ctx.globalAlpha=1;

  const spacing=120,ox=wrap(-player.x*.20,spacing),oy=wrap(-player.y*.20,spacing);
  ctx.strokeStyle='rgba(100,125,210,.028)';ctx.lineWidth=1;ctx.beginPath();
  for(let x=ox;x<vw;x+=spacing){ctx.moveTo(x,0);ctx.lineTo(x,vh);}
  for(let y=oy;y<vh;y+=spacing){ctx.moveTo(0,y);ctx.lineTo(vw,y);}
  ctx.stroke();
}

function drawMagnetField(){
  const x=vw/2,y=vh/2,r=magnetRange(),stacks=stat('magnet');
  ctx.save();
  const hue=stacks>0?'255,204,92':'96,207,255';
  const fill=ctx.createRadialGradient(x,y,player.r+8,x,y,r);
  fill.addColorStop(0,`rgba(${hue},.025)`);fill.addColorStop(.78,`rgba(${hue},.015)`);fill.addColorStop(1,`rgba(${hue},0)`);
  ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
  ctx.setLineDash([2,11]);ctx.lineDashOffset=-(performance.now()/65)%13;ctx.lineWidth=1;
  ctx.strokeStyle=`rgba(${hue},${stacks>0?.25:.11})`;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<3;i++){const a=performance.now()/1600+i*TAU/3,rr=r-2;ctx.fillStyle=`rgba(${hue},${stacks>0?.62:.26})`;ctx.beginPath();ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr,stacks>0?2.2:1.4,0,TAU);ctx.fill();}
  ctx.restore();
}

function drawChronoField(){
  const n=weaponCount('chrono');if(!n)return;
  const x=vw/2,y=vh/2,r=145+n*18,t=performance.now();
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=.18+Math.min(.18,n*.025);
  for(let ring=0;ring<2+(n>=4?1:0);ring++){
    ctx.rotate((ring%2?1:-1)*t/(4200+ring*900));ctx.strokeStyle=ring===0?'#8fffe0':'#8ba7ff';ctx.lineWidth=ring===0?1.6:1;
    ctx.beginPath();ctx.ellipse(0,0,r-ring*18,(r-ring*18)*.33,ring*.46,0,TAU);ctx.stroke();
  }
  ctx.restore();
}

function drawDefenseBarrier(){
  const defense=weaponCount('bulwark')>0||stat('armor')>0||player.shield>0;if(!defense)return;
  const x=vw/2,y=vh/2,strength=player.shield>0?1:.48,radius=player.r+18+Math.sin(performance.now()/260)*1.8;
  ctx.save();ctx.translate(x,y);ctx.rotate(performance.now()/5200);ctx.strokeStyle=`rgba(116,242,167,${.24+strength*.35})`;
  ctx.lineWidth=player.shield>0?3:1.7;ctx.shadowBlur=player.shield>0?18:8;ctx.shadowColor=COLORS.green;ctx.beginPath();
  for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,px=Math.cos(a)*radius,py=Math.sin(a)*radius;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
  ctx.closePath();ctx.stroke();if(player.shield>0){ctx.globalAlpha=.20;ctx.fillStyle=COLORS.green;ctx.fill();}ctx.restore();
}

function drawTelegraphs(){
  for(const t of state.entities.telegraphs){
    const p=worldToScreen(t.x,t.y),progress=1-clamp(t.life/t.max,0,1);
    ctx.save();ctx.globalAlpha=.24+.48*progress;ctx.strokeStyle=t.color;ctx.fillStyle=t.color;ctx.setLineDash([8,10]);ctx.lineDashOffset=-performance.now()/45;
    if(t.type==='circle'){
      ctx.lineWidth=2+progress*3;ctx.beginPath();ctx.arc(p.x,p.y,t.r,0,TAU);ctx.stroke();ctx.globalAlpha=.04+.10*progress;ctx.beginPath();ctx.arc(p.x,p.y,t.r,0,TAU);ctx.fill();
    }else{
      ctx.translate(p.x,p.y);ctx.rotate(t.a);ctx.lineWidth=t.width;ctx.globalAlpha=.08+.16*progress;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(t.length,0);ctx.stroke();
    }
    ctx.setLineDash([]);ctx.restore();
  }
}

function drawStarPath(points,inner,outer,rotation=-Math.PI/2){
  ctx.beginPath();
  for(let i=0;i<points*2;i++){
    const a=rotation+i*Math.PI/points,r=i%2?inner:outer,x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
}
