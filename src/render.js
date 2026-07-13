function worldToScreen(x,y){return{x:x-player.x+vw/2,y:y-player.y+vh/2};}

function seeded(seed){
  let s=seed>>>0;
  return ()=>{
    s=(s*1664525+1013904223)>>>0;
    return s/4294967296;
  };
}
const cosmicRand=seeded(830241);
const STAR_LAYERS=[
  {parallax:.018,size:1500,count:90,stars:[]},
  {parallax:.045,size:1250,count:75,stars:[]},
  {parallax:.09,size:1050,count:55,stars:[]}
];
for(const layer of STAR_LAYERS){
  for(let i=0;i<layer.count;i++){
    layer.stars.push({
      x:cosmicRand()*layer.size,
      y:cosmicRand()*layer.size,
      r:.45+cosmicRand()*1.45,
      a:.18+cosmicRand()*.7,
      hue:cosmicRand()
    });
  }
}
const NEBULAE=Array.from({length:7},(_,i)=>({
  x:cosmicRand()*1700,
  y:cosmicRand()*1200,
  r:180+cosmicRand()*360,
  c:i%3
}));
function wrap(v,size){return ((v%size)+size)%size;}

function drawBackground(){
  const base=ctx.createLinearGradient(0,0,vw,vh);
  base.addColorStop(0,'#030611');
  base.addColorStop(.45,'#070b1b');
  base.addColorStop(1,'#02040d');
  ctx.fillStyle=base;
  ctx.fillRect(0,0,vw,vh);

  const ambient=ctx.createRadialGradient(vw*.52,vh*.48,0,vw*.52,vh*.48,Math.max(vw,vh)*.75);
  ambient.addColorStop(0,'rgba(38,52,116,.23)');
  ambient.addColorStop(.42,'rgba(14,22,58,.11)');
  ambient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=ambient;
  ctx.fillRect(0,0,vw,vh);

  const nebulaPalette=[
    ['rgba(62,76,190,.13)','rgba(31,20,93,0)'],
    ['rgba(166,54,173,.10)','rgba(72,16,91,0)'],
    ['rgba(20,127,160,.10)','rgba(6,44,73,0)']
  ];
  for(const n of NEBULAE){
    const px=wrap(n.x-player.x*.018,1700)-220;
    const py=wrap(n.y-player.y*.014,1200)-170;
    const g=ctx.createRadialGradient(px,py,0,px,py,n.r);
    g.addColorStop(0,nebulaPalette[n.c][0]);
    g.addColorStop(1,nebulaPalette[n.c][1]);
    ctx.fillStyle=g;
    ctx.fillRect(px-n.r,py-n.r,n.r*2,n.r*2);
  }

  ctx.save();
  ctx.translate(vw*.82-wrap(player.x*.006,80),vh*.18-wrap(player.y*.004,50));
  ctx.rotate(-.22);
  const planetR=Math.min(vw,vh)*.105;
  const planet=ctx.createRadialGradient(-planetR*.32,-planetR*.35,4,0,0,planetR);
  planet.addColorStop(0,'rgba(139,160,255,.16)');
  planet.addColorStop(.5,'rgba(50,59,122,.09)');
  planet.addColorStop(1,'rgba(8,10,28,0)');
  ctx.fillStyle=planet;
  ctx.beginPath();ctx.arc(0,0,planetR,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(128,155,255,.08)';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,planetR*1.65,planetR*.28,0,0,TAU);ctx.stroke();
  ctx.restore();

  for(let li=0;li<STAR_LAYERS.length;li++){
    const layer=STAR_LAYERS[li];
    const tile=layer.size;
    const ox=player.x*layer.parallax;
    const oy=player.y*layer.parallax;
    for(const star of layer.stars){
      const x=wrap(star.x-ox,tile)-80;
      const y=wrap(star.y-oy,tile)-80;
      if(x>vw+80||y>vh+80)continue;
      const twinkle=.78+.22*Math.sin(performance.now()*.0015+star.x*.013);
      ctx.globalAlpha=star.a*twinkle;
      ctx.fillStyle=star.hue>.82?'#bdafff':star.hue>.58?'#8eeaff':'#f4f7ff';
      ctx.beginPath();ctx.arc(x,y,star.r+(li===2?.2:0),0,TAU);ctx.fill();
      if(star.r>1.45){
        ctx.globalAlpha*=.45;
        ctx.fillRect(x-5,y-.35,10,.7);
        ctx.fillRect(x-.35,y-5,.7,10);
      }
    }
  }
  ctx.globalAlpha=1;

  const spacing=110;
  const ox=wrap(-player.x*.22,spacing),oy=wrap(-player.y*.22,spacing);
  ctx.strokeStyle='rgba(102,125,200,.035)';
  ctx.lineWidth=1;
  ctx.beginPath();
  for(let x=ox;x<vw;x+=spacing){ctx.moveTo(x,0);ctx.lineTo(x,vh);}
  for(let y=oy;y<vh;y+=spacing){ctx.moveTo(0,y);ctx.lineTo(vw,y);}
  ctx.stroke();
}

function drawMagnetField(){
  const x=vw/2,y=vh/2,r=magnetRange();
  const stacks=stat('magnet');
  ctx.save();
  const hue=stacks>0?'255,204,92':'96,207,255';
  const fill=ctx.createRadialGradient(x,y,player.r+8,x,y,r);
  fill.addColorStop(0,`rgba(${hue},.025)`);
  fill.addColorStop(.76,`rgba(${hue},.018)`);
  fill.addColorStop(1,`rgba(${hue},0)`);
  ctx.fillStyle=fill;
  ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
  ctx.setLineDash([3,10]);
  ctx.lineDashOffset=-(performance.now()/70)%13;
  ctx.lineWidth=1;
  ctx.strokeStyle=`rgba(${hue},${stacks>0?.23:.12})`;
  ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
  ctx.setLineDash([]);
  for(let i=0;i<3;i++){
    const a=performance.now()/1600+i*TAU/3;
    const rr=r-2;
    ctx.fillStyle=`rgba(${hue},${stacks>0?.58:.28})`;
    ctx.beginPath();ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr,stacks>0?2.2:1.4,0,TAU);ctx.fill();
  }
  ctx.restore();
}

function drawDefenseBarrier(){
  const defense=weaponCount('bulwark')>0||stat('armor')>0||player.shield>0;
  if(!defense)return;
  const x=vw/2,y=vh/2;
  const strength=player.shield>0?1:.48;
  const radius=player.r+17+Math.sin(performance.now()/260)*1.8;
  ctx.save();ctx.translate(x,y);ctx.rotate(performance.now()/5200);
  ctx.strokeStyle=`rgba(116,242,167,${.24+strength*.35})`;
  ctx.lineWidth=player.shield>0?3:1.7;
  ctx.shadowBlur=player.shield>0?18:8;
  ctx.shadowColor=COLORS.green;
  ctx.beginPath();
  for(let i=0;i<6;i++){
    const a=i/6*TAU-Math.PI/2;
    const px=Math.cos(a)*radius,py=Math.sin(a)*radius;
    if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.closePath();ctx.stroke();
  if(player.shield>0){
    ctx.globalAlpha=.22;
    ctx.fillStyle=COLORS.green;
    ctx.fill();
  }
  ctx.restore();
}

function draw(){
  const sx=state.camera.shake?rand(-state.camera.shake,state.camera.shake):0;
  const sy=state.camera.shake?rand(-state.camera.shake,state.camera.shake):0;
  ctx.save();
  ctx.translate(sx,sy);
  drawBackground();
  drawWells();
  drawGems();
  drawEnemies();
  drawProjectiles();
  if(state.mode!=='menu'){
    drawMagnetField();
    drawPlayer();
  }
  drawEffects();
  ctx.restore();
  const vignette=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.18,vw/2,vh/2,Math.max(vw,vh)*.72);
  vignette.addColorStop(0,'rgba(0,0,0,0)');
  vignette.addColorStop(1,'rgba(0,1,8,.58)');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);
  if(state.flash>0){ctx.fillStyle=`rgba(225,242,255,${state.flash*.72})`;ctx.fillRect(0,0,vw,vh);}
}

function drawPlayer(){
  const x=vw/2,y=vh/2,t=performance.now();
  drawDefenseBarrier();
  ctx.save();ctx.translate(x,y);
  if(player.invuln>0&&Math.floor(player.invuln*20)%2===0)ctx.globalAlpha=.38;
  const glow=ctx.createRadialGradient(0,0,0,0,0,45);
  glow.addColorStop(0,player.hitPulse?'rgba(255,91,110,.52)':'rgba(100,221,255,.48)');
  glow.addColorStop(.42,'rgba(89,120,255,.16)');
  glow.addColorStop(1,'rgba(80,231,255,0)');
  ctx.fillStyle=glow;ctx.fillRect(-50,-50,100,100);

  ctx.rotate(t/3000);
  ctx.strokeStyle='rgba(145,190,255,.28)';ctx.lineWidth=1.1;
  ctx.beginPath();ctx.ellipse(0,0,25,10,.35,0,TAU);ctx.stroke();
  ctx.rotate(-t/1450);
  for(let i=0;i<3;i++){
    const a=i*TAU/3;
    ctx.fillStyle=i===0?'rgba(255,255,255,.92)':'rgba(124,232,255,.72)';
    ctx.beginPath();ctx.arc(Math.cos(a)*19,Math.sin(a)*19,1.8,0,TAU);ctx.fill();
  }
  ctx.rotate(t/2100);
  ctx.shadowBlur=18;ctx.shadowColor=player.hitPulse?COLORS.red:COLORS.cyan;
  const core=ctx.createLinearGradient(0,-13,0,13);
  core.addColorStop(0,'#ffffff');core.addColorStop(.48,'#bdefff');core.addColorStop(1,'#668aff');
  ctx.fillStyle=core;
  ctx.beginPath();
  ctx.moveTo(0,-13);ctx.lineTo(10,5);ctx.lineTo(0,11);ctx.lineTo(-10,5);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='#071028';
  ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(4,4);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();
  ctx.restore();

  const n=weaponCount('blade');
  if(n){
    const count=n>=2?2:1,orbit=n>=6?104:77;
    for(let i=0;i<count;i++){
      const a=player.angle+i*Math.PI;
      const bx=x+Math.cos(a)*orbit,by=y+Math.sin(a)*orbit;
      ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);
      ctx.shadowBlur=n>=6?26:16;ctx.shadowColor=COLORS.cyan;
      const blade=ctx.createLinearGradient(0,-25,0,22);
      blade.addColorStop(0,'#ffffff');blade.addColorStop(.45,'#9ff4ff');blade.addColorStop(1,'rgba(72,100,255,.25)');
      ctx.fillStyle=blade;
      ctx.beginPath();ctx.moveTo(0,-24);ctx.quadraticCurveTo(10,1,4,19);ctx.lineTo(-3,13);ctx.quadraticCurveTo(-8,-3,0,-24);ctx.fill();
      ctx.globalAlpha=.24;ctx.strokeStyle=COLORS.cyan;ctx.lineWidth=5;
      ctx.beginPath();ctx.arc(0,18,34,-2.25,-.75);ctx.stroke();
      ctx.restore();
    }
  }
}

function drawEnemies(){
  for(const e of state.entities.enemies){
    const p=worldToScreen(e.x,e.y);
    if(p.x<-90||p.x>vw+90||p.y<-90||p.y>vh+90)continue;
    ctx.save();ctx.translate(p.x,p.y);
    const pulse=1+Math.sin(e.phase)*.05;ctx.scale(pulse,pulse);
    ctx.shadowBlur=e.elite?28:12;ctx.shadowColor=e.color;
    ctx.strokeStyle=e.hit?'#ffffff':e.color;
    ctx.fillStyle=e.hit?'#ffffff':e.color;
    if(e.type==='fast'){
      ctx.rotate(e.phase*.28);
      ctx.beginPath();ctx.moveTo(e.r*1.55,0);ctx.lineTo(-e.r*.8,e.r*.75);ctx.lineTo(-e.r*.35,0);ctx.lineTo(-e.r*.8,-e.r*.75);ctx.closePath();ctx.fill();
      ctx.globalAlpha=.32;ctx.fillRect(-e.r*2.3,-2,e.r*1.8,4);
    }else if(e.type==='tank'){
      ctx.rotate(e.phase*.08);
      ctx.lineWidth=4;ctx.strokeRect(-e.r,-e.r,e.r*2,e.r*2);
      ctx.rotate(-e.phase*.16);ctx.fillRect(-e.r*.55,-e.r*.55,e.r*1.1,e.r*1.1);
    }else if(e.elite){
      ctx.rotate(e.phase*.09);
      ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r*1.25,0,TAU);ctx.stroke();
      ctx.rotate(-e.phase*.23);
      ctx.beginPath();
      for(let i=0;i<8;i++){
        const a=i/8*TAU,rr=i%2?e.r*.55:e.r;
        const xx=Math.cos(a)*rr,yy=Math.sin(a)*rr;
        if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
      }
      ctx.closePath();ctx.fill();
    }else{
      const orb=ctx.createRadialGradient(-e.r*.3,-e.r*.35,1,0,0,e.r);
      orb.addColorStop(0,'#b9adff');orb.addColorStop(.45,e.color);orb.addColorStop(1,'#33277b');
      ctx.fillStyle=orb;ctx.beginPath();ctx.arc(0,0,e.r,0,TAU);ctx.fill();
      ctx.globalAlpha=.38;ctx.strokeStyle='#c4d2ff';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(0,0,e.r*1.35,e.r*.42,e.phase*.08,0,TAU);ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;
    ctx.fillStyle='rgba(2,4,15,.72)';ctx.beginPath();ctx.arc(0,0,Math.max(3,e.r*.22),0,TAU);ctx.fill();
    if(e.elite||e.hp<e.maxHp){
      ctx.fillStyle='rgba(0,0,0,.48)';ctx.fillRect(-e.r,-e.r-12,e.r*2,4);
      ctx.fillStyle=e.color;ctx.fillRect(-e.r,-e.r-12,e.r*2*(e.hp/e.maxHp),4);
    }
    ctx.restore();
  }
}

function drawProjectiles(){
  for(const p of state.entities.projectiles){
    const s=worldToScreen(p.x,p.y);
    const speed=Math.hypot(p.vx,p.vy)||1;
    const nx=p.vx/speed,ny=p.vy/speed;
    const trail=p.source==='wave'?26:p.source==='ember'||p.source==='echo'?22:16;
    ctx.save();
    const g=ctx.createLinearGradient(s.x-nx*trail,s.y-ny*trail,s.x,s.y);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,p.color);
    ctx.strokeStyle=g;ctx.lineWidth=Math.max(1.5,p.r*.72);ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(s.x-nx*trail,s.y-ny*trail);ctx.lineTo(s.x,s.y);ctx.stroke();
    ctx.translate(s.x,s.y);ctx.shadowBlur=p.r>9?28:17;ctx.shadowColor=p.color;
    ctx.fillStyle=p.color;
    if(p.source==='ember'||p.source==='echo'||p.source==='ember-spark'){
      ctx.rotate(Math.atan2(p.vy,p.vx));
      ctx.beginPath();ctx.moveTo(p.r*1.5,0);ctx.lineTo(-p.r*.7,p.r*.7);ctx.lineTo(-p.r*.35,0);ctx.lineTo(-p.r*.7,-p.r*.7);ctx.closePath();ctx.fill();
    }else{
      ctx.beginPath();ctx.arc(0,0,p.r,0,TAU);ctx.fill();
      ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(-p.r*.2,-p.r*.25,Math.max(1,p.r*.34),0,TAU);ctx.fill();
    }
    ctx.restore();
  }
}

function drawGems(){
  for(const g of state.entities.gems){
    const p=worldToScreen(g.x,g.y);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(g.pulse);
    ctx.shadowBlur=14;ctx.shadowColor=COLORS.cyan;
    const gem=ctx.createLinearGradient(0,-g.r,0,g.r);
    gem.addColorStop(0,'#ffffff');gem.addColorStop(.45,'#8eeaff');gem.addColorStop(1,'#5b66ff');
    ctx.fillStyle=gem;
    ctx.beginPath();ctx.moveTo(0,-g.r*1.35);ctx.lineTo(g.r*.75,0);ctx.lineTo(0,g.r*1.35);ctx.lineTo(-g.r*.75,0);ctx.closePath();ctx.fill();
    ctx.restore();
  }
}

function drawWells(){
  for(const w of state.entities.wells){
    const p=worldToScreen(w.x,w.y),alpha=clamp(w.life/.35,0,1);
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;
    const g=ctx.createRadialGradient(0,0,2,0,0,w.r);
    g.addColorStop(0,'rgba(0,0,4,1)');g.addColorStop(.12,'rgba(48,27,105,.78)');g.addColorStop(.42,'rgba(139,99,255,.16)');g.addColorStop(1,'rgba(139,99,255,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,w.r,0,TAU);ctx.fill();
    ctx.rotate(performance.now()/800);
    ctx.strokeStyle='rgba(194,166,255,.72)';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.ellipse(0,0,42+Math.sin(performance.now()/150)*4,13,0,0,TAU);ctx.stroke();
    ctx.rotate(-performance.now()/430);
    ctx.strokeStyle='rgba(86,213,255,.32)';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(0,0,66,19,.4,0,TAU);ctx.stroke();
    ctx.fillStyle='#010107';ctx.beginPath();ctx.arc(0,0,16,0,TAU);ctx.fill();
    ctx.restore();
  }
}

function drawEffects(){
  for(const s of state.entities.shockwaves){
    const p=worldToScreen(s.x,s.y);
    ctx.globalAlpha=s.life/s.max;
    ctx.strokeStyle=s.color;ctx.lineWidth=s.width;
    ctx.beginPath();ctx.arc(p.x,p.y,s.r,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=1;
  for(const p of state.entities.particles){
    const s=worldToScreen(p.x,p.y);
    ctx.globalAlpha=clamp(p.life/p.max,0,1);
    ctx.fillStyle=p.color;ctx.shadowBlur=8;ctx.shadowColor=p.color;
    ctx.beginPath();ctx.arc(s.x,s.y,p.size*.5,0,TAU);ctx.fill();
  }
  ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.textAlign='center';
  for(const t of state.entities.texts){
    const s=worldToScreen(t.x,t.y);
    ctx.globalAlpha=clamp(t.life/t.max,0,1);
    ctx.fillStyle=t.color;ctx.font=`800 ${t.size}px IBM Plex Sans KR`;
    ctx.fillText(t.text,s.x,s.y);
  }
  ctx.globalAlpha=1;
}

let last=performance.now();
function loop(now){
  let dt=Math.min(.033,(now-last)/1000);last=now;
  if(state.hitStop>0){state.hitStop-=dt;dt=0;}
  if(state.mode==='playing'){
    state.time+=dt;
    state.comboTimer-=dt;
    if(state.comboTimer<=0)state.combo=0;
    updatePlayer(dt);
    updateSpawning(dt);
    updateWeapons(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateWells(dt);
    updateGems(dt);
    updateEffects(dt);
    updateHUD();
  } else if(state.mode!=='menu') {
    updateEffects(dt*.45);
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('keydown',e=>{
  state.input.keys.add(e.code);
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  if(e.code==='Escape')togglePause();
});
window.addEventListener('keyup',e=>state.input.keys.delete(e.code));

let joyPointer=null;
function updateJoy(e){
  const r=ui.joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;
  const max=r.width*.31,d=Math.hypot(dx,dy)||1,k=Math.min(1,max/d);
  dx*=k;dy*=k;
  state.input.touchX=dx/max;state.input.touchY=dy/max;
  ui.stick.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
ui.joystick.addEventListener('pointerdown',e=>{
  joyPointer=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);updateJoy(e);
});
ui.joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoy(e);});
function releaseJoy(e){
  if(e.pointerId!==joyPointer)return;
  joyPointer=null;state.input.touchX=state.input.touchY=0;
  ui.stick.style.transform='translate(-50%,-50%)';
}
ui.joystick.addEventListener('pointerup',releaseJoy);
ui.joystick.addEventListener('pointercancel',releaseJoy);

ui.start.onclick=()=>{audio.init();resetGame();};
ui.pause.onclick=()=>togglePause(true);
ui.resume.onclick=()=>togglePause(false);
ui.restart.onclick=resetGame;
ui.pauseMenu.onclick=showMainMenu;
ui.retry.onclick=resetGame;
ui.menuBtn.onclick=showMainMenu;
