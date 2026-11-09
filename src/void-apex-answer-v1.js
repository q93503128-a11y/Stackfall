// Void Apex visual/arena prototype: THE ANSWER / 응답.
// Dev-preview only: live Void Rift eligibility, combat patterns, rewards and encounter scheduling
// remain intentionally disconnected until the visual direction is approved.
(()=>{
  'use strict';
  if(window.stackfallVoidApexAnswer==='v1')return;
  window.stackfallVoidApexAnswer='v1';
  window.STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true;
  window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v19';

  const TAU_LOCAL=Math.PI*2;
  const preview={
    active:false,preparing:false,phase:1,hpRatio:1,defeating:false,defeatAge:0,
    camX:0,camY:0,aftermath:false,runSerial:null,preflightXp:0,
    preflightGemCount:0,choiceGateOwned:false,prepStage:'idle',prepBlock:'',prepElapsed:0
  };
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const language=()=>GAME_SETTINGS?.language||'ko';
  const answerName=()=>language()==='ko'?'응답':'THE ANSWER';
  const phaseRatio=phase=>phase===1?1:phase===2?.74:.29;

  function geometry(){
    const width=Math.max(1,Number(vw)||1280),height=Math.max(1,Number(vh)||720);
    return{
      cx:width*.5,bossY:0,bossScale:1,arenaCx:width*.5,arenaCy:height*.705,
      arenaRx:Math.min(width*.455,720),arenaRy:Math.min(height*.285,270),
      left:width*.07,right:width*.93,top:height*.40,bottom:height*.925
    };
  }
  function worldBounds(){
    const g=geometry(),margin=Math.max(20,Number(player?.r)||14);
    return{
      minX:preview.camX+(g.left-vw/2)+margin,
      maxX:preview.camX+(g.right-vw/2)-margin,
      minY:preview.camY+(g.top-vh/2)+margin,
      maxY:preview.camY+(g.bottom-vh/2)-margin
    };
  }
  function cameraOffset(){return{x:player.x-preview.camX,y:player.y-preview.camY};}
  function staleChoiceLock(){
  const hidden=!ui?.choice||ui.choice.classList.contains('hidden');
  return state.mode==='playing'&&state.choiceLocked===true&&state.choiceOpening!==true&&hidden;
}
function normalizeStaleChoiceLock(){
  if(!staleChoiceLock())return false;
  state.choiceLocked=false;
  return true;
}
function acquirePreparationGate(){
  normalizeStaleChoiceLock();
  if(state.mode!=='playing'||state.choiceOpening===true||state.choiceLocked===true)return false;
  state.choiceLocked=true;preview.choiceGateOwned=true;return true;
}
function releasePreparationGate(){if(preview.choiceGateOwned){state.choiceLocked=false;preview.choiceGateOwned=false;}}
function setPrepState(stage,block=''){preview.prepStage=stage;preview.prepBlock=block;syncDevStatus();}
  function clearPreviewState(){
    releasePreparationGate();
    Object.assign(preview,{active:false,preparing:false,defeating:false,defeatAge:0,aftermath:false,runSerial:null,preflightXp:0,preflightGemCount:0,prepStage:'idle',prepBlock:'',prepElapsed:0});
    state.answerVoidApexPreview=false;state.answerVoidApexPreparing=false;state.answerVoidSealed=false;
    document.documentElement.dataset.answerPreview='0';document.documentElement.dataset.answerPreparing='0';syncBossHud();
  }
  function ensureRunIdentity(){if(preview.runSerial!=null&&preview.runSerial!==state.runSerial)clearPreviewState();}
  function clampPlayerToArena(){
    if(!preview.active||!player)return;
    const b=worldBounds();
    player.x=Math.max(b.minX,Math.min(b.maxX,player.x));
    player.y=Math.max(b.minY,Math.min(b.maxY,player.y));
  }
  function clearHostileField(){
    const entities=state?.entities||{};
    for(const key of['enemies','enemyProjectiles','telegraphs'])if(Array.isArray(entities[key]))entities[key].length=0;
    try{clearPendingCombatActions?.();}catch{}
    try{window.closeMapEventOverlays?.();}catch{}
    state.mapEventActive=null;state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;
    state.apexArena=null;state.apexExitPending=false;
  }
  function syncBossHud(){
    const bar=document.querySelector('#bossBar'),name=document.querySelector('#bossName'),fill=document.querySelector('#bossHpBar'),extras=document.querySelector('#bossBarExtras');
    if(!bar)return;
    if(!preview.active){bar.classList.add('hidden');if(extras)extras.textContent='';return;}
    bar.classList.remove('hidden');if(name)name.textContent=answerName();if(fill)fill.style.width=`${Math.max(0,Math.min(100,preview.hpRatio*100))}%`;if(extras)extras.textContent='';
  }
  function setPhase(phase,preserveHp=false){
    if(!preview.active)return false;
    preview.phase=Math.max(1,Math.min(3,Math.floor(Number(phase)||1)));
    if(!preserveHp)preview.hpRatio=phaseRatio(preview.phase);preview.defeating=false;preview.defeatAge=0;syncBossHud();
    state.camera.shake=Math.max(Number(state.camera.shake)||0,1.2+preview.phase*.55);
    return true;
  }
  function setHpRatio(ratio){if(!preview.active)return false;preview.hpRatio=clamp01(ratio);syncBossHud();return true;}
  function activatePreparedEncounter(){
  if(!preview.preparing||activeExperienceGems().length||state.choiceOpening===true||state.mode!=='playing'||state.choiceLocked||state.xp>=state.xpNeed)return false;
  releasePreparationGate();
  preview.preparing=false;preview.active=true;preview.phase=1;preview.hpRatio=1;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;
  preview.prepStage='active';preview.prepBlock='';preview.prepElapsed=0;
  state.answerVoidApexPreparing=false;state.answerVoidApexPreview=true;state.answerVoidSealed=false;
  document.documentElement.dataset.answerPreparing='0';document.documentElement.dataset.answerPreview='1';
  preview.camX=player.x;preview.camY=player.y-(Number(vh)||720)*.205;
  player.y=preview.camY+(Number(vh)||720)*.225;player.invuln=Math.max(Number(player.invuln)||0,1.2);
  clampPlayerToArena();syncBossHud();syncDevStatus();state.camera.shake=Math.max(Number(state.camera.shake)||0,3.5);state.flash=Math.max(Number(state.flash)||0,.02);
  try{audio?.tone?.(42,.34,'sawtooth',.022,-8);}catch{}
  return true;
}
function activeExperienceGems(){
  const gems=state.entities?.gems||[];
  return gems.filter(g=>typeof experienceGemActive==='function'?experienceGemActive(g):!!(g&&g.active!==false));
}
function advancePreparation(){
  if(!preview.preparing)return false;
  const gems=activeExperienceGems();
  if(gems.length){setPrepState('collecting-xp',`${gems.length} gems`);return false;}
  releasePreparationGate();
  if(state.mode==='choice'||state.choiceOpening===true||state.choiceLocked===true){setPrepState('resolving-level-choice','choice-busy');return false;}
  if(state.mode!=='playing'){setPrepState('waiting-mode',String(state.mode||'unknown'));return false;}
  if(state.xp>=state.xpNeed){
    setPrepState('opening-level-choice','xp-ready');
    try{tryLevelUp();}catch(error){console.error('[Stackfall] Answer preflight level-up failed',error);setPrepState('blocked','level-up-error');return false;}
    if(state.mode==='playing'&&state.choiceOpening!==true&&state.choiceLocked!==true&&state.xp<state.xpNeed)return activatePreparedEncounter();
    return false;
  }
  setPrepState('ready','');
  return activatePreparedEncounter();
}
function prepareLevelChoicesWhenReady(){return advancePreparation();}
function beginPreparation(){
  if(state.mode!=='playing'||preview.active||preview.preparing)return false;
  normalizeStaleChoiceLock();
  if(!acquirePreparationGate()){preview.prepStage='blocked';preview.prepBlock='choice-busy';syncDevStatus();return false;}
  try{clearHostileField();}catch(error){releasePreparationGate();preview.prepStage='blocked';preview.prepBlock='field-clear-error';syncDevStatus();console.error('[Stackfall] Answer preflight field clear failed',error);return false;}
  Object.assign(preview,{preparing:true,active:false,phase:1,hpRatio:1,defeating:false,defeatAge:0,aftermath:false,runSerial:state.runSerial,preflightXp:0,preflightGemCount:0,prepStage:'collecting-xp',prepBlock:'',prepElapsed:0});
  preview.choiceGateOwned=true;
  state.answerVoidApexPreparing=true;state.answerVoidApexPreview=false;state.answerVoidSealed=false;
  document.documentElement.dataset.answerPreparing='1';document.documentElement.dataset.answerPreview='0';
  player.invuln=Math.max(Number(player.invuln)||0,5);
  let pulled={count:0,value:0};
  try{if(typeof window.stackfallCollectSuctionMagnet==='function')pulled=window.stackfallCollectSuctionMagnet()||pulled;}catch(error){releasePreparationGate();preview.preparing=false;state.answerVoidApexPreparing=false;preview.prepStage='blocked';preview.prepBlock='xp-magnet-error';syncDevStatus();console.error('[Stackfall] Answer preflight suction failed',error);return false;}
  preview.preflightGemCount=Math.max(0,Number(pulled.count)||0);preview.preflightXp=Math.max(0,Number(pulled.value)||0);
  try{shockwave(player.x,player.y,'#ffdf79',105,.42,2.2);spawnParticle(player.x,player.y,'#fff3ba',12,125,2.5);audio?.pickup?.();}catch{}
  syncDevStatus();
  if(preview.preflightGemCount===0)queueMicrotask(advancePreparation);
  return true;
}
function activate(){return beginPreparation();}
  function stop(){
    releasePreparationGate();preview.active=false;preview.preparing=false;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;preview.prepStage='idle';preview.prepBlock='';preview.prepElapsed=0;
    state.answerVoidApexPreview=false;state.answerVoidApexPreparing=false;document.documentElement.dataset.answerPreview='0';document.documentElement.dataset.answerPreparing='0';syncBossHud();return true;
  }
  function startDefeat(){
    if(!preview.active||preview.defeating)return false;
    preview.defeating=true;preview.defeatAge=0;preview.hpRatio=0;player.invuln=Math.max(Number(player.invuln)||0,4);
    state.camera.shake=Math.max(Number(state.camera.shake)||0,5.5);try{audio?.tone?.(52,.52,'sine',.022,18);}catch{}syncBossHud();return true;
  }
  function finishDefeat(){
    state.answerVoidSealed=true;preview.active=false;preview.defeating=false;preview.aftermath=true;preview.prepStage='aftermath';preview.prepBlock='';state.answerVoidApexPreview=false;
    document.documentElement.dataset.answerPreview='0';state.camera.shake=Math.max(Number(state.camera.shake)||0,12);state.flash=Math.max(Number(state.flash)||0,.26);
    try{audio?.tone?.(36,.48,'sawtooth',.045,-16);audio?.tone?.(92,.26,'sine',.028,-30);}catch{}syncBossHud();
  }
  function updatePrototype(dt){
    ensureRunIdentity();const step=Math.max(0,Number(dt)||0);
    if(preview.preparing){preview.prepElapsed+=step;player.invuln=Math.max(Number(player.invuln)||0,.35);advancePreparation();syncDevStatus();return;}
    if(!preview.active)return;
    clampPlayerToArena();if(preview.defeating){preview.defeatAge+=step;if(preview.defeatAge>=3.15)finishDefeat();}syncBossHud();
  }

  // V18 visual lock: preserve the approved near-black cosmic body raster.
  // One combat-layer fissure tree reinforces P1 and owns all P2-P3 growth so phase transitions and beam origin stay coherent.
  const ANSWER_BODY_B64_URL='assets/answer/answer_body_v16.b64';
  const answerBodyImage=new Image();
  let answerBodyReady=false,answerBodyFailed=false;
  answerBodyImage.decoding='async';
  answerBodyImage.addEventListener('load',()=>{answerBodyReady=true;answerBodyFailed=false;syncDevStatus();});
  answerBodyImage.addEventListener('error',()=>{answerBodyReady=false;answerBodyFailed=true;syncDevStatus();console.error('[Stackfall] Answer body asset failed to decode',ANSWER_BODY_B64_URL);});
  (async()=>{try{const response=await fetch(ANSWER_BODY_B64_URL,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const b64=(await response.text()).trim();answerBodyImage.src=`data:image/webp;base64,${b64}`;}catch(error){answerBodyReady=false;answerBodyFailed=true;syncDevStatus();console.error('[Stackfall] Answer body payload failed to load',error);}})();

  function answerFrame(){
  const width=Math.max(1,Number(vw)||1280),height=Math.max(1,Number(vh)||720);
  // V15 integration preview: preserve the approved body, but push the unknown upper/side extent offscreen.
  // The lower cusp sits around 34% of the arena height, leaving materially more player space.
  const ratio=960/280,w=Math.max(width*1.14,height*2.05),h=w/ratio;
  const visibleDepth=Math.max(245,Math.min(330,height*.34));
  return{x:(width-w)*.5,y:visibleDepth-h,w,h,visibleDepth,ratio};
}
  function drawFallbackBody(frame){
    // Fail-safe only: an active encounter must never become visually empty if the raster fails to decode.
    ctx.save();ctx.fillStyle='rgba(0,0,8,.985)';ctx.shadowColor='rgba(215,229,255,.18)';ctx.shadowBlur=18;
    ctx.beginPath();ctx.moveTo(frame.x+frame.w*.05,frame.y+frame.h*.70);ctx.bezierCurveTo(frame.x+frame.w*.22,frame.y+frame.h*.62,frame.x+frame.w*.40,frame.y+frame.h*.72,frame.x+frame.w*.50,frame.y+frame.h*.98);ctx.bezierCurveTo(frame.x+frame.w*.60,frame.y+frame.h*.72,frame.x+frame.w*.78,frame.y+frame.h*.62,frame.x+frame.w*.95,frame.y+frame.h*.70);ctx.lineTo(frame.x+frame.w*.98,frame.y+frame.h*.48);ctx.lineTo(frame.x+frame.w*.02,frame.y+frame.h*.48);ctx.closePath();ctx.fill();ctx.restore();
  }
  function drawAnswerBoss(){
    const phase=Math.max(1,Math.min(3,preview.phase)),death=preview.defeating?clamp01(preview.defeatAge/3.15):0,base=answerFrame();
    // The body is an immeasurably large fixed presence. Only its internal cosmos/fissures animate in the combat layer.
    const frame=base;
    if(answerBodyReady){
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowColor='rgba(188,204,255,.08)';ctx.shadowBlur=8;const drawX=Math.round(frame.x),drawY=Math.round(frame.y),drawW=Math.round(frame.w),drawH=Math.round(frame.h);ctx.drawImage(answerBodyImage,0,0,960,280,drawX,drawY,drawW,drawH);ctx.restore();
    }else drawFallbackBody(frame);
    if(death>.12){
      ctx.save();ctx.globalCompositeOperation='screen';const k=clamp01((death-.12)/.78),x=vw*.5,y=Math.min(base.visibleDepth*.78,vh*.24),r=Math.max(vw,vh)*(.08+k*.30);
      const glow=ctx.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,`rgba(255,255,255,${.12+k*.50})`);glow.addColorStop(.30,`rgba(239,246,255,${.05+k*.14})`);glow.addColorStop(1,'rgba(210,224,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,vw,Math.max(vh*.55,base.visibleDepth*2));ctx.restore();
    }
    if(death>.90){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp01((death-.90)/.07)*.68;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,vw,vh);ctx.restore();}
  }
  function drawPhaseSky(){
    if(!preview.active)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='rgba(0,0,7,.045)';ctx.fillRect(0,0,vw,vh*.36);ctx.restore();
  }
  let answerBackdropCanvas=null,answerBackdropAt=0;
  function captureAnswerBackdrop(){
    const source=ctx?.canvas;if(!source?.width||!source?.height)return;
    const locked=!!window.stackfallAnswerSplitSnapshotLocked?.(),now=performance.now();
    if(locked&&answerBackdropCanvas)return;
    if(!locked&&answerBackdropCanvas&&answerBackdropAt&&now-answerBackdropAt<500)return;
    try{
      if(!answerBackdropCanvas||answerBackdropCanvas.width!==source.width||answerBackdropCanvas.height!==source.height){
        answerBackdropCanvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(source.width,source.height):document.createElement('canvas');
        answerBackdropCanvas.width=source.width;answerBackdropCanvas.height=source.height;
      }
      const backdrop=answerBackdropCanvas.getContext('2d');backdrop.setTransform(1,0,0,1,0,0);backdrop.globalAlpha=1;backdrop.globalCompositeOperation='copy';backdrop.clearRect(0,0,source.width,source.height);backdrop.drawImage(source,0,0);answerBackdropAt=now;
    }catch(error){answerBackdropCanvas=null;console.warn('[Stackfall] Answer split backdrop capture unavailable',error);}
  }
  window.stackfallAnswerBackgroundSnapshot=()=>answerBackdropCanvas;
  function drawPrototypeBackground(){
    if(!preview.active)return;
    drawPhaseSky();
    // The split owns only the frozen arena/space plate. The Answer is composited after it,
    // so the tear can displace the realm without slicing the approved body raster.
    captureAnswerBackdrop();
    window.stackfallDrawAnswerSplitBackground?.();
    drawAnswerBoss();
  }
  function drawAftermathOverlay(){
    if(!preview.aftermath)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='screen';
    const g=ctx.createRadialGradient(vw*.5,vh*.43,20,vw*.5,vh*.50,Math.max(vw,vh)*.82);g.addColorStop(0,'rgba(216,232,255,.095)');g.addColorStop(.50,'rgba(114,163,255,.045)');g.addColorStop(1,'rgba(255,255,255,.014)');ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);ctx.restore();
  }

  function withFixedArenaCamera(base,...args){
    if(!preview.active||typeof base!=='function')return base?.(...args);
    const offset=cameraOffset();ctx.save();ctx.translate(offset.x,offset.y);try{return base(...args);}finally{ctx.restore();}
  }
  function wrapWorldDraw(base){
    if(typeof base!=='function')return base;
    const wrapped=function(...args){return withFixedArenaCamera(base,...args);};
    try{Object.defineProperty(wrapped,'name',{value:base.name,configurable:true});}catch{}
    return wrapped;
  }
  const baseDrawWells=typeof drawWells==='function'?drawWells:null;if(baseDrawWells)drawWells=wrapWorldDraw(baseDrawWells);
  const baseDrawGems=typeof drawGems==='function'?drawGems:null;if(baseDrawGems)drawGems=wrapWorldDraw(baseDrawGems);
  const baseDrawFieldPickups=typeof drawFieldPickups==='function'?drawFieldPickups:null;if(baseDrawFieldPickups)drawFieldPickups=wrapWorldDraw(baseDrawFieldPickups);
  const baseDrawStagePhysicalObjects=typeof drawStagePhysicalObjects==='function'?drawStagePhysicalObjects:null;if(baseDrawStagePhysicalObjects)drawStagePhysicalObjects=wrapWorldDraw(baseDrawStagePhysicalObjects);
  const baseDrawProjectiles=typeof drawProjectiles==='function'?drawProjectiles:null;if(baseDrawProjectiles)drawProjectiles=wrapWorldDraw(baseDrawProjectiles);
  const baseDrawBoomerangs=typeof drawBoomerangs==='function'?drawBoomerangs:null;if(baseDrawBoomerangs)drawBoomerangs=wrapWorldDraw(baseDrawBoomerangs);
  const baseDrawAlliedEffects=typeof drawAlliedEffects==='function'?drawAlliedEffects:null;if(baseDrawAlliedEffects)drawAlliedEffects=wrapWorldDraw(baseDrawAlliedEffects);
  const baseDrawTelegraphs=typeof drawTelegraphs==='function'?drawTelegraphs:null;if(baseDrawTelegraphs)drawTelegraphs=wrapWorldDraw(baseDrawTelegraphs);
  const baseDrawMapEvents=typeof drawMapEvents==='function'?drawMapEvents:null;if(baseDrawMapEvents)drawMapEvents=wrapWorldDraw(baseDrawMapEvents);
  const baseDrawEnemies=typeof drawEnemies==='function'?drawEnemies:null;if(baseDrawEnemies)drawEnemies=wrapWorldDraw(baseDrawEnemies);
  const baseDrawBeamEffects=typeof drawBeamEffects==='function'?drawBeamEffects:null;if(baseDrawBeamEffects)drawBeamEffects=wrapWorldDraw(baseDrawBeamEffects);
  const baseDrawEnemyProjectiles=typeof drawEnemyProjectiles==='function'?drawEnemyProjectiles:null;if(baseDrawEnemyProjectiles)drawEnemyProjectiles=wrapWorldDraw(baseDrawEnemyProjectiles);
  const baseDrawMagnetField=typeof drawMagnetField==='function'?drawMagnetField:null;if(baseDrawMagnetField)drawMagnetField=wrapWorldDraw(baseDrawMagnetField);
  const baseDrawChronoField=typeof drawChronoField==='function'?drawChronoField:null;if(baseDrawChronoField)drawChronoField=wrapWorldDraw(baseDrawChronoField);
  const baseDrawPlayer=typeof drawPlayer==='function'?drawPlayer:null;if(baseDrawPlayer)drawPlayer=wrapWorldDraw(baseDrawPlayer);

  const basePause=typeof isApexProgressionClockPaused==='function'?isApexProgressionClockPaused:null;
  if(basePause)isApexProgressionClockPaused=function isProgressionPausedForAnswer(){ensureRunIdentity();return preview.active||preview.preparing||basePause();};
  const baseUpdateSpawning=typeof updateSpawning==='function'?updateSpawning:null;
  if(baseUpdateSpawning)updateSpawning=function updateSpawningWithAnswerPrototype(dt){if(preview.active||preview.preparing)return;return baseUpdateSpawning(dt);};
  const baseUpdateMapEvents=typeof updateMapEvents==='function'?updateMapEvents:null;
  if(baseUpdateMapEvents)updateMapEvents=function updateMapEventsWithAnswerPrototype(dt){if(preview.active||preview.preparing)return;return baseUpdateMapEvents(dt);};
  if(typeof registerPlayerUpdateInterceptor==='function')registerPlayerUpdateInterceptor('void-apex-answer-v1:arena',function answerArenaPlayerUpdate(next,dt){
    if(preview.active||preview.preparing)state.time=Math.max(0,(Number(state.time)||0)-Math.max(0,Number(dt)||0));
    const result=next(dt);updatePrototype(dt);return result;
  });
  const baseUpdateHud=typeof updateHUD==='function'?updateHUD:null;
  if(baseUpdateHud)updateHUD=function updateHudWithAnswerPrototype(){const result=baseUpdateHud();if(preview.active)syncBossHud();return result;};

  const baseDrawBackground=typeof drawBackground==='function'?drawBackground:null;
  function drawFrozenArenaBackground(){
    if(!baseDrawBackground)return;
    if(!preview.active)return baseDrawBackground();
    // Realm backgrounds use player position and movement directly for parallax. During THE ANSWER the camera origin is fixed,
    // so render the background against the frozen camera coordinates instead of the moving player coordinates.
    const snapshot={x:player.x,y:player.y,moveVX:player.moveVX,moveVY:player.moveVY,moveIntensity:player.moveIntensity};
    player.x=preview.camX;player.y=preview.camY;player.moveVX=0;player.moveVY=0;player.moveIntensity=0;
    try{return baseDrawBackground();}
    finally{player.x=snapshot.x;player.y=snapshot.y;player.moveVX=snapshot.moveVX;player.moveVY=snapshot.moveVY;player.moveIntensity=snapshot.moveIntensity;}
  }
  if(baseDrawBackground)drawBackground=function drawBackgroundWithAnswerArena(){return drawFrozenArenaBackground();};
  window.stackfallDrawVoidApexAnswerBackground=function drawVoidApexAnswerBackground(){if(preview.active)drawPrototypeBackground();};
  const baseDraw=typeof draw==='function'?draw:null;
  if(baseDraw)draw=function drawWithAnswerAftermath(){ensureRunIdentity();const result=baseDraw();if(preview.active)syncBossHud();syncDevStatus();drawAftermathOverlay();return result;};

  if(!document.querySelector('#answerPreviewCanvasStyle')){const style=document.createElement('style');style.id='answerPreviewCanvasStyle';style.textContent='html[data-answer-preview="1"] canvas:not(#game){opacity:0!important;pointer-events:none!important}';document.head.appendChild(style);}

  function syncDevStatus(){
  const el=document.querySelector('#devAnswerStatus');if(!el)return;
  const assetState=answerBodyFailed?'asset FAIL':answerBodyReady?'asset READY':'asset loading';
  const dims=answerBodyImage.naturalWidth?`${answerBodyImage.naturalWidth}x${answerBodyImage.naturalHeight}`:'image -';
  const hook=typeof window.stackfallDrawVoidApexAnswerBackground==='function'?'hook ON':'hook off';
  const encounter=preview.active?(preview.defeating?'DEFEAT':`ACTIVE P${preview.phase}`):preview.preparing?`PREP ${preview.prepStage}`:preview.aftermath?'AFTERMATH':preview.prepStage==='blocked'?`BLOCKED ${preview.prepBlock}`:'IDLE';
  const gems=preview.preparing?activeExperienceGems().length:0;
  const text=`${encounter} · mode ${state.mode} · lock ${state.choiceLocked===true?'ON':'off'} · gems ${gems} · ${assetState} · ${dims} · ${hook}`;
  if(el.textContent!==text)el.textContent=text;
}

function installDevControls(){
    const dev=window.stackfallDeveloperTest,panel=document.querySelector('#stackfallDevPanel');
    if(!dev?.enabled||!panel||document.querySelector('#devAnswerPrototype'))return;
    const label=document.createElement('label');label.textContent='VOID APEX · 응답 디자인';
    const grid=document.createElement('div');grid.className='dev-grid';grid.id='devAnswerPrototype';
    const button=(text,id,handler,wide=false)=>{const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;if(wide)b.className='dev-wide';b.addEventListener('click',()=>{try{handler();}finally{queueMicrotask(syncDevStatus);}});return b;};
    const forcePhase=phase=>window.stackfallAnswerCombatForcePhase?.(phase)??setPhase(phase);
    const forcePattern=kind=>window.stackfallAnswerCombatForcePattern?.(kind)??false;
    grid.append(
      button('응답 시안 시작','devAnswerStart',()=>activate(),true),
      button('P1 · 봉쇄','devAnswerP1',()=>forcePhase(1)),button('P2 · 노출','devAnswerP2',()=>forcePhase(2)),button('P3 · 증폭','devAnswerP3',()=>forcePhase(3)),
      button('가시 강제','devAnswerSpike',()=>forcePattern('spike')),button('공간 양단 강제','devAnswerSplit',()=>forcePattern('split')),
      button('순백 빔 강제','devAnswerBeam',()=>forcePattern('beam')),button('진짜/가짜 가시 강제','devAnswerRow',()=>forcePattern('row')),button('기술 복제 강제','devAnswerClone',()=>forcePattern('clone')),
      button('격파 연출','devAnswerDefeat',()=>window.stackfallAnswerCombatDefeat?.()??startDefeat()),button('시안 종료','devAnswerStop',()=>stop(),true)
    );
    const status=document.createElement('div');status.id='devAnswerStatus';status.className='dev-wide';status.style.cssText='margin:4px 0 14px;padding:8px 10px;border:1px solid rgba(140,174,230,.18);border-radius:9px;background:rgba(9,14,30,.72);color:#92a7cb;font:700 10px/1.45 monospace;word-break:break-word';panel.append(label,grid,status);syncDevStatus();
    Object.assign(dev,{
      startAnswerPrototype:activate,prepareAnswerPrototype:beginPreparation,setAnswerPhase:setPhase,defeatAnswerPrototype:startDefeat,stopAnswerPrototype:stop,
      answerPrototypeSnapshot:()=>({active:preview.active,preparing:preview.preparing,prepStage:preview.prepStage,prepBlock:preview.prepBlock,preflightGemCount:preview.preflightGemCount,preflightXp:preview.preflightXp,phase:preview.phase,hpRatio:preview.hpRatio,defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,mode:state.mode,choiceLocked:state.choiceLocked===true,camera:{x:preview.camX,y:preview.camY},bounds:preview.active?worldBounds():null,asset:{ready:answerBodyReady,failed:answerBodyFailed,naturalWidth:answerBodyImage.naturalWidth||0,naturalHeight:answerBodyImage.naturalHeight||0,renderHook:typeof window.stackfallDrawVoidApexAnswerBackground==='function'}})
    });
  }
  window.stackfallSetAnswerPrototypePhase=setPhase;
  window.stackfallSetAnswerPrototypeHpRatio=setHpRatio;
  window.stackfallDefeatAnswerPrototype=startDefeat;
  window.stackfallStopAnswerPrototype=stop;
  installDevControls();setTimeout(installDevControls,0);setTimeout(installDevControls,250);setTimeout(installDevControls,1000);
  window.stackfallVoidApexAnswerDiagnostics=()=>({
    version:'v1',visualRevision:'v19',prototypeOnly:true,active:preview.active,preparing:preview.preparing,prepStage:preview.prepStage,prepBlock:preview.prepBlock,
    preflightGemCount:preview.preflightGemCount,preflightXp:preview.preflightXp,phase:preview.phase,hpRatio:preview.hpRatio,
    defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,
    mode:state.mode,choiceLocked:state.choiceLocked===true,camera:{x:preview.camX,y:preview.camY},geometry:geometry(),
    asset:{src:ANSWER_BODY_B64_URL,ready:answerBodyReady,failed:answerBodyFailed,naturalWidth:answerBodyImage.naturalWidth||0,naturalHeight:answerBodyImage.naturalHeight||0,renderHook:typeof window.stackfallDrawVoidApexAnswerBackground==='function'},
    frame:answerFrame(),backgroundFrozen:preview.active,
    splitLayers:{snapshot:'space-only',splitComposite:'before-answer-body',bodyComposite:'after-split',playerComposite:'after-answer-stage',hudComposite:'outside-answer-stage'}
  });
})();
