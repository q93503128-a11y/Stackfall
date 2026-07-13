function worldToScreen(x,y){return{x:x-player.x+vw/2,y:y-player.y+vh/2};}
function drawBackground(){
  ctx.fillStyle='#080b16';ctx.fillRect(0,0,vw,vh);
  const spacing=64,ox=(( -player.x*.32)%spacing+spacing)%spacing,oy=(( -player.y*.32)%spacing+spacing)%spacing;
  ctx.strokeStyle='rgba(115,128,180,.065)';ctx.lineWidth=1;ctx.beginPath();for(let x=ox;x<vw;x+=spacing){ctx.moveTo(x,0);ctx.lineTo(x,vh);}for(let y=oy;y<vh;y+=spacing){ctx.moveTo(0,y);ctx.lineTo(vw,y);}ctx.stroke();
  const g=ctx.createRadialGradient(vw/2,vh/2,40,vw/2,vh/2,Math.max(vw,vh)*.72);g.addColorStop(0,'rgba(45,54,96,.18)');g.addColorStop(1,'rgba(2,4,10,.66)');ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);
  ctx.globalAlpha=.18;for(let i=0;i<28;i++){const x=((i*193-player.x*.07)%(vw+200)+vw+200)%(vw+200)-100,y=((i*107-player.y*.05)%(vh+200)+vh+200)%(vh+200)-100;ctx.fillStyle=i%3?COLORS.violet:COLORS.cyan;ctx.fillRect(x,y,1.5,1.5);}ctx.globalAlpha=1;
}

function draw(){
  const sx=state.camera.shake?rand(-state.camera.shake,state.camera.shake):0,sy=state.camera.shake?rand(-state.camera.shake,state.camera.shake):0;
  ctx.save();ctx.translate(sx,sy);drawBackground();
  drawWells();drawGems();drawEnemies();drawProjectiles();drawPlayer();drawEffects();ctx.restore();
  const vignette=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.2,vw/2,vh/2,Math.max(vw,vh)*.7);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.48)');ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);
  if(state.flash>0){ctx.fillStyle=`rgba(255,255,255,${state.flash*.8})`;ctx.fillRect(0,0,vw,vh);}
}

function drawPlayer(){
  const x=vw/2,y=vh/2;
  if(player.shield>0){ctx.strokeStyle=`rgba(116,242,167,${.28+Math.sin(performance.now()/130)*.08})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,player.r+12+Math.sin(performance.now()/220)*3,0,TAU);ctx.stroke();}
  ctx.save();ctx.translate(x,y);if(player.invuln>0&&Math.floor(player.invuln*20)%2===0)ctx.globalAlpha=.35;
  const glow=ctx.createRadialGradient(0,0,0,0,0,38);glow.addColorStop(0,'rgba(80,231,255,.42)');glow.addColorStop(1,'rgba(80,231,255,0)');ctx.fillStyle=glow;ctx.fillRect(-42,-42,84,84);
  ctx.rotate(performance.now()/1500);ctx.strokeStyle=player.hitPulse?COLORS.red:COLORS.cyan;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU;const px=Math.cos(a)*17,py=Math.sin(a)*17;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.stroke();ctx.rotate(-performance.now()/1000);ctx.fillStyle='#eef7ff';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,8);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();ctx.restore();
  const n=weaponCount('blade');if(n){const count=n>=2?2:1,orbit=n>=6?104:77;for(let i=0;i<count;i++){const a=player.angle+i*Math.PI,bx=x+Math.cos(a)*orbit,by=y+Math.sin(a)*orbit;ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);ctx.shadowBlur=n>=6?24:14;ctx.shadowColor=COLORS.cyan;ctx.fillStyle='#bdf7ff';ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(6,14);ctx.lineTo(0,20);ctx.lineTo(-6,14);ctx.closePath();ctx.fill();ctx.restore();}}
}

function drawEnemies(){for(const e of state.entities.enemies){const p=worldToScreen(e.x,e.y);if(p.x<-80||p.x>vw+80||p.y<-80||p.y>vh+80)continue;ctx.save();ctx.translate(p.x,p.y);const pulse=1+Math.sin(e.phase)*.04;ctx.scale(pulse,pulse);ctx.shadowBlur=e.elite?24:10;ctx.shadowColor=e.color;ctx.fillStyle=e.hit?'#ffffff':e.color;ctx.beginPath();if(e.type==='fast'){for(let i=0;i<3;i++){const a=i/3*TAU+e.phase*.2,rr=i%2?e.r:e.r*1.25;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}else if(e.type==='tank'){ctx.rect(-e.r,-e.r,e.r*2,e.r*2);}else{ctx.arc(0,0,e.r,0,TAU);}ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(6,8,17,.58)';ctx.beginPath();ctx.arc(-e.r*.28,-1,2.2,0,TAU);ctx.arc(e.r*.28,-1,2.2,0,TAU);ctx.fill();if(e.elite||e.hp<e.maxHp){ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(-e.r,-e.r-10,e.r*2,4);ctx.fillStyle=e.color;ctx.fillRect(-e.r,-e.r-10,e.r*2*(e.hp/e.maxHp),4);}ctx.restore();}}
function drawProjectiles(){for(const p of state.entities.projectiles){const s=worldToScreen(p.x,p.y);ctx.save();ctx.translate(s.x,s.y);ctx.shadowBlur=15;ctx.shadowColor=p.color;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r,0,TAU);ctx.fill();ctx.restore();}}
function drawGems(){for(const g of state.entities.gems){const p=worldToScreen(g.x,g.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(g.pulse);ctx.shadowBlur=10;ctx.shadowColor=COLORS.cyan;ctx.fillStyle='#7beaff';ctx.beginPath();ctx.moveTo(0,-g.r);ctx.lineTo(g.r*.75,0);ctx.lineTo(0,g.r);ctx.lineTo(-g.r*.75,0);ctx.closePath();ctx.fill();ctx.restore();}}
function drawWells(){for(const w of state.entities.wells){const p=worldToScreen(w.x,w.y),alpha=clamp(w.life/.35,0,1);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(0,0,3,0,0,w.r);g.addColorStop(0,'rgba(7,5,18,.95)');g.addColorStop(.15,'rgba(139,99,255,.38)');g.addColorStop(1,'rgba(139,99,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,w.r,0,TAU);ctx.fill();ctx.strokeStyle='rgba(183,161,255,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,24+Math.sin(performance.now()/120)*5,0,TAU);ctx.stroke();ctx.restore();}}
function drawEffects(){for(const s of state.entities.shockwaves){const p=worldToScreen(s.x,s.y);ctx.globalAlpha=s.life/s.max;ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.beginPath();ctx.arc(p.x,p.y,s.r,0,TAU);ctx.stroke();}ctx.globalAlpha=1;for(const p of state.entities.particles){const s=worldToScreen(p.x,p.y);ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.fillRect(s.x-p.size/2,s.y-p.size/2,p.size,p.size);}ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='700 12px IBM Plex Sans KR';for(const t of state.entities.texts){const s=worldToScreen(t.x,t.y);ctx.globalAlpha=clamp(t.life/t.max,0,1);ctx.fillStyle=t.color;ctx.font=`800 ${t.size}px IBM Plex Sans KR`;ctx.fillText(t.text,s.x,s.y);}ctx.globalAlpha=1;}

let last=performance.now();
function loop(now){
  let dt=Math.min(.033,(now-last)/1000);last=now;
  if(state.hitStop>0){state.hitStop-=dt;dt=0;}
  if(state.mode==='playing'){
    state.time+=dt;state.comboTimer-=dt;if(state.comboTimer<=0)state.combo=0;
    updatePlayer(dt);updateSpawning(dt);updateWeapons(dt);updateEnemies(dt);updateProjectiles(dt);updateWells(dt);updateGems(dt);updateEffects(dt);updateHUD();
  } else if(state.mode!=='menu') updateEffects(dt*.45);
  draw();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('keydown',e=>{state.input.keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape')togglePause();});
window.addEventListener('keyup',e=>state.input.keys.delete(e.code));

let joyPointer=null;
function updateJoy(e){const r=ui.joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.31,d=Math.hypot(dx,dy)||1,k=Math.min(1,max/d);dx*=k;dy*=k;state.input.touchX=dx/max;state.input.touchY=dy/max;ui.stick.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;}
ui.joystick.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);updateJoy(e);});
ui.joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoy(e);});
function releaseJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;state.input.touchX=state.input.touchY=0;ui.stick.style.transform='translate(-50%,-50%)';}
ui.joystick.addEventListener('pointerup',releaseJoy);ui.joystick.addEventListener('pointercancel',releaseJoy);

ui.start.onclick=()=>{audio.init();resetGame();};ui.pause.onclick=()=>togglePause(true);ui.resume.onclick=()=>togglePause(false);ui.restart.onclick=resetGame;ui.retry.onclick=resetGame;
