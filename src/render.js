const runtimeErrorLog=new Set();
function sanitizeRuntimeState(){
  if(!Number.isFinite(player.x))player.x=0;if(!Number.isFinite(player.y))player.y=0;if(!Number.isFinite(player.hp))player.hp=Math.max(1,player.maxHp||100);if(!Number.isFinite(player.maxHp)||player.maxHp<=0)player.maxHp=100;
  const finiteXY=e=>e&&Number.isFinite(e.x)&&Number.isFinite(e.y);
  state.entities.enemies=state.entities.enemies.filter(e=>finiteXY(e)&&Number.isFinite(e.hp)&&Number.isFinite(e.maxHp)&&Number.isFinite(e.r));
  state.entities.projectiles=state.entities.projectiles.filter(p=>finiteXY(p)&&Number.isFinite(p.life));for(const p of state.entities.projectiles){p.source=String(p.source||'');p.vx=Number.isFinite(p.vx)?p.vx:0;p.vy=Number.isFinite(p.vy)?p.vy:0;p.r=Number.isFinite(p.r)?Math.max(.5,p.r):3;}
  state.entities.enemyProjectiles=state.entities.enemyProjectiles.filter(p=>finiteXY(p)&&Number.isFinite(p.life));
  state.entities.gems=state.entities.gems.filter(g=>finiteXY(g)&&Number.isFinite(g.life));
  state.entities.wells=state.entities.wells.filter(w=>typeof normalizeWell==='function'?normalizeWell(w):finiteXY(w)&&Number.isFinite(w.r)&&Number.isFinite(w.life));
  state.entities.particles=state.entities.particles.filter(p=>finiteXY(p)&&Number.isFinite(p.life));
  state.entities.texts=state.entities.texts.filter(t=>finiteXY(t)&&Number.isFinite(t.life));
  state.entities.shockwaves=state.entities.shockwaves.filter(s=>finiteXY(s)&&Number.isFinite(s.life)&&Number.isFinite(s.r));
  state.entities.telegraphs=state.entities.telegraphs.filter(t=>t&&Number.isFinite(t.life));
  state.entities.curves=state.entities.curves?.filter(c=>finiteXY(c)&&(Number.isFinite(c.elapsed)||Number.isFinite(c.stageTime)))||[];
  state.entities.beams=state.entities.beams?.filter(b=>b&&Number.isFinite(b.x1)&&Number.isFinite(b.y1)&&Number.isFinite(b.x2)&&Number.isFinite(b.y2)&&Number.isFinite(b.life))||[];
}
function runRuntimeStage(name,fn){try{return fn();}catch(error){if(!runtimeErrorLog.has(name)){runtimeErrorLog.add(name);console.error(`[Stackfall] ${name} failed`,error);}sanitizeRuntimeState();return undefined;}}
function runDrawStage(name,fn){ctx.save();try{return runRuntimeStage(name,fn);}finally{ctx.restore();}}
updateSpawning=function updateSpawningAccelerated(dt){
  if(typeof updateApexSystems==='function'&&updateApexSystems(dt))return;
  if(typeof worldEventBlocksSpawning==='function'&&worldEventBlocksSpawning())return;
  state.spawnTimer-=dt;
  const elapsed=Math.max(0,state.time||0),compact=compactDevice(),rate=Math.max(compact?.46:.38,1.58/(1+elapsed/130));
  if(state.spawnTimer<=0){state.spawnTimer=rate;const count=1+Math.min(compact?2:3,Math.floor(elapsed/120));for(let i=0;i<count;i++)spawnEnemy('normal');}
  if(typeof updateEncounterDirector==='function')updateEncounterDirector(dt);
};
function draw(){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);
  runDrawStage('drawBackground',drawBackground);
  const rawShake=GAME_SETTINGS.screenShake===false?0:Math.max(0,state.camera.shake||0),shake=rawShake>=7?Math.min(15,rawShake*.72):0;
  const sx=shake?rand(-shake,shake):0,sy=shake?rand(-shake,shake):0;
  ctx.save();ctx.translate(sx,sy);
  runDrawStage('drawTelegraphs',drawTelegraphs);runDrawStage('drawWells',drawWells);runDrawStage('drawGems',drawGems);
  if(typeof drawMapEvents==='function')runDrawStage('drawMapEvents',drawMapEvents);
  runDrawStage('drawEnemies',drawEnemies);if(GAME_SETTINGS.hideProjectiles!==true)runDrawStage('drawProjectiles',drawProjectiles);runDrawStage('drawEnemyProjectiles',drawEnemyProjectiles);
  if(state.mode!=='menu'){runDrawStage('drawMagnetField',drawMagnetField);runDrawStage('drawChronoField',drawChronoField);runDrawStage('drawPlayer',drawPlayer);}
  runDrawStage('drawEffects',drawEffects);ctx.restore();
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.setLineDash([]);
  const performanceTier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;
  if(performanceTier===0){const vignette=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.18,vw/2,vh/2,Math.max(vw,vh)*.74);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,1,8,.58)');ctx.fillStyle=vignette;ctx.fillRect(0,0,vw,vh);}else if(performanceTier===1){ctx.fillStyle='rgba(0,1,8,.08)';ctx.fillRect(0,0,vw,vh);}
  if(GAME_SETTINGS.sparkles!==false&&state.flash>0){ctx.fillStyle=`rgba(225,242,255,${Math.min(.42,state.flash*.72)})`;ctx.fillRect(0,0,vw,vh);}if(typeof drawRealmCinematicOverlay==='function')runDrawStage('drawRealmCinematicOverlay',drawRealmCinematicOverlay);
}
let last=performance.now(),hudRefresh=0;
function loop(now){
  let dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;let shouldDraw=state.mode==='menu';
  try{
    const liveGameplay=state.mode==='playing';
    if(liveGameplay){
      if(state.hitStop>0){state.hitStop-=dt;dt=0;}
      state.time+=dt;state.comboTimer-=dt;if(state.comboTimer<=0)state.combo=0;
      runRuntimeStage('updatePlayer',()=>updatePlayer(dt));runRuntimeStage('updateSpawning',()=>updateSpawning(dt));runRuntimeStage('updateWeapons',()=>updateWeapons(dt));runRuntimeStage('updateEnemies',()=>updateEnemies(dt));runRuntimeStage('updateProjectiles',()=>updateProjectiles(dt));runRuntimeStage('updateEnemyProjectiles',()=>updateEnemyProjectiles(dt));runRuntimeStage('updateTelegraphs',()=>updateTelegraphs(dt));runRuntimeStage('updateWells',()=>updateWells(dt));runRuntimeStage('updateGems',()=>updateGems(dt));
      if(typeof updateMapEvents==='function'&&!state.apexActiveId&&!state.pendingApexForm&&!state.realmTransition)runRuntimeStage('updateMapEvents',()=>updateMapEvents(dt));
      runRuntimeStage('updateEffects',()=>updateEffects(dt));hudRefresh-=dt;if(hudRefresh<=0){hudRefresh=.08;runRuntimeStage('updateHUD',updateHUD);}shouldDraw=true;
    }else if(state.mode==='cinematic'){
      if(typeof updateRealmTransition==='function')runRuntimeStage('updateRealmTransition',()=>updateRealmTransition(dt));runRuntimeStage('updateEffectsCinematic',()=>updateEffects(dt*.35));shouldDraw=true;
    }
    if(state.mode==='choice'&&ui.choice.classList.contains('hidden')){state.choiceLocked=false;state.mode='playing';}
    if(typeof syncAbilityLedgerVisibility==='function')syncAbilityLedgerVisibility();
    if(shouldDraw)runRuntimeStage('drawFrame',draw);
  }finally{requestAnimationFrame(loop);}
}
requestAnimationFrame(loop);
window.addEventListener('keydown',e=>{
  const ledgerKey=e.code==='Tab'||e.code==='KeyI';
  if(ledgerKey){
    const ledgerOpen=typeof isAbilityLedgerOpen==='function'&&isAbilityLedgerOpen(),settingsOpen=!document.querySelector('#settingsScreen')?.classList.contains('hidden'),canToggle=ledgerOpen||['playing','paused'].includes(state.mode)&&!settingsOpen;
    if(canToggle)e.preventDefault();
    if(!e.repeat&&canToggle){e.stopImmediatePropagation();toggleAbilityLedger();}
    return;
  }
  if(e.code==='Escape'&&typeof isAbilityLedgerOpen==='function'&&isAbilityLedgerOpen()){e.preventDefault();e.stopImmediatePropagation();closeAbilityLedger();return;}
  state.input.keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape')togglePause();
},true);
window.addEventListener('keyup',e=>state.input.keys.delete(e.code));
let joyPointer=null;function updateJoy(e){const r=ui.joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.31,d=Math.hypot(dx,dy)||1,k=Math.min(1,max/d);dx*=k;dy*=k;state.input.touchX=dx/max;state.input.touchY=dy/max;ui.stick.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;}
ui.joystick.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);updateJoy(e);});ui.joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoy(e);});function releaseJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;state.input.touchX=state.input.touchY=0;ui.stick.style.transform='translate(-50%,-50%)';}ui.joystick.addEventListener('pointerup',releaseJoy);ui.joystick.addEventListener('pointercancel',releaseJoy);
ui.start.onclick=()=>{audio.init();resetGame();};ui.pause.onclick=()=>togglePause(true);ui.resume.onclick=()=>togglePause(false);ui.restart.onclick=resetGame;ui.pauseMenu.onclick=showMainMenu;ui.retry.onclick=resetGame;ui.menuBtn.onclick=showMainMenu;