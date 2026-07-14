function draw(){
  const shake=GAME_SETTINGS.screenShake===false?0:state.camera.shake;
  const sx=shake?rand(-shake,shake):0,sy=shake?rand(-shake,shake):0;
  ctx.save();ctx.translate(sx,sy);drawBackground();drawTelegraphs();drawWells();drawGems();if(typeof drawMapEvents==='function')drawMapEvents();drawEnemies();drawProjectiles();drawEnemyProjectiles();if(state.mode!=='menu'){drawMagnetField();drawChronoField();drawPlayer();}drawEffects();ctx.restore();
  const vignette=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.18,vw/2,vh/2,Math.max(vw,vh)*.74);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,1,8,.58)');ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);
  if(state.flash>0){ctx.fillStyle=`rgba(225,242,255,${state.flash*.72})`;ctx.fillRect(0,0,vw,vh);}if(typeof drawRealmCinematicOverlay==='function')drawRealmCinematicOverlay();
}
let last=performance.now(),hudRefresh=0;
function loop(now){
  let dt=Math.min(.033,(now-last)/1000);last=now;let shouldDraw=state.mode==='menu';
  if(state.mode==='playing'){
    if(state.hitStop>0){state.hitStop-=dt;dt=0;}
    state.time+=dt;state.comboTimer-=dt;if(state.comboTimer<=0)state.combo=0;
    updatePlayer(dt);updateSpawning(dt);updateWeapons(dt);updateEnemies(dt);updateProjectiles(dt);updateEnemyProjectiles(dt);updateTelegraphs(dt);updateWells(dt);updateGems(dt);if(typeof updateMapEvents==='function')updateMapEvents(dt);updateEffects(dt);
    hudRefresh-=dt;if(hudRefresh<=0){hudRefresh=.08;updateHUD();}
    shouldDraw=true;
  }else if(state.mode==='cinematic'){
    if(typeof updateRealmTransition==='function')updateRealmTransition(dt);updateEffects(dt*.35);shouldDraw=true;
  }
  if(shouldDraw)draw();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.addEventListener('keydown',e=>{state.input.keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(e.code))e.preventDefault();if(e.code==='Escape')togglePause();});
window.addEventListener('keyup',e=>state.input.keys.delete(e.code));
let joyPointer=null;function updateJoy(e){const r=ui.joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.31,d=Math.hypot(dx,dy)||1,k=Math.min(1,max/d);dx*=k;dy*=k;state.input.touchX=dx/max;state.input.touchY=dy/max;ui.stick.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;}
ui.joystick.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);updateJoy(e);});ui.joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoy(e);});function releaseJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;state.input.touchX=state.input.touchY=0;ui.stick.style.transform='translate(-50%,-50%)';}ui.joystick.addEventListener('pointerup',releaseJoy);ui.joystick.addEventListener('pointercancel',releaseJoy);
ui.start.onclick=()=>{audio.init();resetGame();};ui.pause.onclick=()=>togglePause(true);ui.resume.onclick=()=>togglePause(false);ui.restart.onclick=resetGame;ui.pauseMenu.onclick=showMainMenu;ui.retry.onclick=resetGame;ui.menuBtn.onclick=showMainMenu;