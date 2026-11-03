// Void Apex visual/arena prototype: THE ANSWER / 응답.
// Dev-preview only: live Void Rift eligibility, combat patterns, rewards and encounter scheduling
// remain intentionally disconnected until the visual direction is approved.
(()=>{
  'use strict';
  if(window.stackfallVoidApexAnswer==='v1')return;
  window.stackfallVoidApexAnswer='v1';
  window.STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true;
  window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v15';

  const TAU_LOCAL=Math.PI*2;
  const preview={
    active:false,preparing:false,phase:1,hpRatio:1,defeating:false,defeatAge:0,
    camX:0,camY:0,aftermath:false,runSerial:null,threat:0,preflightXp:0,
    preflightGemCount:0,choiceGateOwned:false,prepStage:'idle',prepBlock:'',prepElapsed:0
  };
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const language=()=>GAME_SETTINGS?.language||'ko';
  const answerName=()=>language()==='ko'?'응답':'THE ANSWER';
  const phaseRatio=phase=>phase===1?1:phase===2?.76:phase===3?.51:.26;
  const threatBand=value=>value>=100?100:value>=75?75:value>=50?50:value>=25?25:0;

  function geometry(){
    const width=Math.max(720,Number(vw)||1280),height=Math.max(520,Number(vh)||720);
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
  function setPhase(phase){
    if(!preview.active)return false;
    preview.phase=Math.max(1,Math.min(4,Math.floor(Number(phase)||1)));
    preview.hpRatio=phaseRatio(preview.phase);preview.defeating=false;preview.defeatAge=0;syncBossHud();
    state.camera.shake=Math.max(Number(state.camera.shake)||0,1.2+preview.phase*.55);
    return true;
  }
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

  // V14 visual lock: exact approved q55 raster bytes are embedded as a data URI to prevent binary transport corruption.
  // P1-P4 keep the exact same body/frame; only the white fissure count/intensity changes.
  const ANSWER_BODY_SRC='data:image/webp;base64,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';
  const answerBodyImage=new Image();
  let answerBodyReady=false,answerBodyFailed=false;
  answerBodyImage.decoding='async';
  answerBodyImage.addEventListener('load',()=>{answerBodyReady=true;answerBodyFailed=false;syncDevStatus();});
  answerBodyImage.addEventListener('error',()=>{answerBodyReady=false;answerBodyFailed=true;syncDevStatus();console.error('[Stackfall] Answer body asset failed to load',ANSWER_BODY_SRC);});
  answerBodyImage.src=ANSWER_BODY_SRC;

  const FISSURES=[
    [[.505,.70],[.500,.77],[.512,.84],[.502,.91],[.515,.98]],
    [[.505,.79],[.455,.78],[.410,.76],[.360,.74]],
    [[.507,.84],[.558,.82],[.610,.79],[.660,.75]],
    [[.455,.78],[.420,.84],[.380,.89],[.332,.93]],
    [[.558,.82],[.600,.87],[.646,.91],[.706,.94]],
    [[.360,.74],[.305,.72],[.250,.70],[.198,.68]],
    [[.660,.75],[.715,.72],[.770,.70],[.825,.68]],
    [[.332,.93],[.286,.95],[.236,.96]],
    [[.706,.94],[.758,.95],[.812,.94]],
    [[.420,.84],[.386,.81],[.352,.79]],
    [[.600,.87],[.632,.84],[.664,.82]],
    [[.250,.70],[.214,.75],[.180,.79]],
    [[.770,.70],[.806,.75],[.842,.79]]
  ];
  const PHASE_CRACK_COUNT=[3,6,9,13];

  function answerFrame(){
  const width=Math.max(720,Number(vw)||1280),height=Math.max(520,Number(vh)||720);
  // V15 integration preview: preserve the approved body, but push the unknown upper/side extent offscreen.
  // The lower cusp sits around 34% of the arena height, leaving materially more player space.
  const ratio=888/263,w=Math.max(width*1.14,height*2.05),h=w/ratio;
  const visibleDepth=Math.max(245,Math.min(330,height*.34));
  return{x:(width-w)*.5,y:visibleDepth-h,w,h,visibleDepth,ratio};
}
  function drawFallbackBody(frame){
    // Fail-safe only: an active encounter must never become visually empty if the raster fails to decode.
    ctx.save();ctx.fillStyle='rgba(0,0,8,.985)';ctx.shadowColor='rgba(215,229,255,.18)';ctx.shadowBlur=18;
    ctx.beginPath();ctx.moveTo(frame.x+frame.w*.05,frame.y+frame.h*.70);ctx.bezierCurveTo(frame.x+frame.w*.22,frame.y+frame.h*.62,frame.x+frame.w*.40,frame.y+frame.h*.72,frame.x+frame.w*.50,frame.y+frame.h*.98);ctx.bezierCurveTo(frame.x+frame.w*.60,frame.y+frame.h*.72,frame.x+frame.w*.78,frame.y+frame.h*.62,frame.x+frame.w*.95,frame.y+frame.h*.70);ctx.lineTo(frame.x+frame.w*.98,frame.y+frame.h*.48);ctx.lineTo(frame.x+frame.w*.02,frame.y+frame.h*.48);ctx.closePath();ctx.fill();ctx.restore();
  }
  function strokeScreenFissure(points,frame,width,alpha,blur=0){
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    points.forEach((p,i)=>{const x=frame.x+p[0]*frame.w,y=frame.y+p[1]*frame.h;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    ctx.globalCompositeOperation='screen';ctx.strokeStyle=`rgba(255,255,255,${alpha})`;ctx.lineWidth=width;if(blur>0){ctx.shadowColor='#ffffff';ctx.shadowBlur=blur;}ctx.stroke();ctx.restore();
  }
  function drawAnswerFissures(frame,phase){
    const count=PHASE_CRACK_COUNT[Math.max(0,Math.min(3,phase-1))],phaseBoost=phase-1,scale=Math.max(.82,Math.min(1.5,frame.w/1700));
    for(let i=0;i<count;i++){
      const points=FISSURES[i],main=i===0,core=(main?1.5:.82)+phaseBoost*(main?.20:.11);
      strokeScreenFissure(points,frame,core*4.1*scale,.08+phaseBoost*.025,5+phaseBoost*1.1);
      strokeScreenFissure(points,frame,core*scale,.84+phaseBoost*.04,main?3.2:2.0);
      strokeScreenFissure(points,frame,Math.max(.55,core*.42)*scale,Math.min(1,.95+phaseBoost*.015),0);
    }
  }
  function drawAnswerBoss(){
    const phase=Math.max(1,Math.min(4,preview.phase)),death=preview.defeating?clamp01(preview.defeatAge/3.15):0,base=answerFrame();
    const t=performance.now()*.001,bob=Math.sin(t*.34)*1.25,drift=Math.sin(t*.17)*.75,frame={...base,x:base.x+drift,y:base.y+bob};
    if(answerBodyReady){
      ctx.save();ctx.globalAlpha=.94;ctx.globalCompositeOperation='source-over';ctx.filter='brightness(.56) saturate(.62) contrast(1.04)';ctx.shadowColor='rgba(188,204,255,.09)';ctx.shadowBlur=10;ctx.drawImage(answerBodyImage,37,67,888,263,frame.x,frame.y,frame.w,frame.h);ctx.restore();
    }else drawFallbackBody(frame);
    drawAnswerFissures(frame,phase);
    if(death>.12){
      ctx.save();ctx.globalCompositeOperation='screen';const k=clamp01((death-.12)/.78),x=vw*.5,y=Math.min(base.visibleDepth*.78,vh*.24),r=Math.max(vw,vh)*(.08+k*.30);
      const glow=ctx.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,`rgba(255,255,255,${.12+k*.50})`);glow.addColorStop(.30,`rgba(239,246,255,${.05+k*.14})`);glow.addColorStop(1,'rgba(210,224,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,vw,Math.max(vh*.55,base.visibleDepth*2));ctx.restore();
    }
    if(death>.90){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp01((death-.90)/.07)*.68;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,vw,vh);ctx.restore();}
  }
  function drawPhaseSky(){
    if(!preview.active)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='rgba(0,0,7,.045)';ctx.fillRect(0,0,vw,vh*.36);ctx.restore();
  }
  function drawPrototypeBackground(){if(!preview.active)return;drawPhaseSky();drawAnswerBoss();}
  function drawAftermathOverlay(){
    if(!preview.aftermath)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='screen';
    const g=ctx.createRadialGradient(vw*.5,vh*.43,20,vw*.5,vh*.50,Math.max(vw,vh)*.82);g.addColorStop(0,'rgba(216,232,255,.095)');g.addColorStop(.50,'rgba(114,163,255,.045)');g.addColorStop(1,'rgba(255,255,255,.014)');ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);ctx.restore();
  }

  function withFixedArenaCamera(base,...args){
    if(!preview.active||typeof base!=='function')return base?.(...args);
    const offset=cameraOffset();ctx.save();ctx.translate(offset.x,offset.y);try{return base(...args);}finally{ctx.restore();}
  }
  function wrapWorldDraw(base){return typeof base==='function'?function(...args){return withFixedArenaCamera(base,...args);}:base;}
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

  function installThreatStyle(){
    if(document.querySelector('#answerThreatStyle'))return;
    const style=document.createElement('style');style.id='answerThreatStyle';style.textContent=`
      html[data-answer-preview="1"] canvas:not(#game){opacity:0!important;pointer-events:none!important}
      #worldEventScreen .choice-head,#worldEventScreen #worldEventCards{position:relative;z-index:3}
      #worldEventScreen[data-answer-threat]{transition:background .34s ease,filter .34s ease}
      #worldEventScreen[data-answer-threat] .world-event-shell{transition:border-color .34s ease,box-shadow .34s ease,filter .34s ease,background .34s ease}
      #answerThreatVisual{position:absolute;inset:-15%;z-index:1;pointer-events:none;overflow:visible;opacity:0;mix-blend-mode:screen;transition:opacity .28s ease}
      #answerThreatVisual .answer-threat-haze{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 20%,rgba(255,255,255,.20) 0,rgba(226,238,255,.08) 20%,rgba(154,126,255,.035) 46%,transparent 70%);filter:blur(14px)}
      #answerThreatVisual .answer-threat-spill{position:absolute;left:50%;top:-22%;width:46%;height:154%;transform-origin:50% 14%;border-radius:50%;background:radial-gradient(ellipse at 50% 8%,rgba(255,255,255,.34) 0,rgba(237,245,255,.13) 20%,rgba(205,224,255,.038) 48%,transparent 74%);filter:blur(16px)}
      #answerThreatVisual .s1{transform:translateX(-50%) rotate(2deg)}#answerThreatVisual .s2{left:31%;width:34%;opacity:.62;transform:translateX(-50%) rotate(-19deg)}#answerThreatVisual .s3{left:69%;width:35%;opacity:.58;transform:translateX(-50%) rotate(20deg)}
      #answerThreatVisual .answer-threat-slit{position:absolute;left:49.72%;top:-2%;width:.58%;height:108%;background:linear-gradient(180deg,rgba(255,255,255,.99),rgba(255,255,255,.92) 28%,rgba(238,247,255,.62) 72%,rgba(224,238,255,.12));filter:blur(.8px);box-shadow:0 0 8px #fff,0 0 24px rgba(230,240,255,.60),0 0 48px rgba(194,214,255,.22);clip-path:polygon(25% 0,80% 8%,36% 19%,72% 31%,30% 43%,74% 55%,28% 68%,69% 81%,40% 100%,8% 88%,34% 72%,5% 58%,31% 44%,9% 30%,37% 16%,12% 7%)}
      #answerThreatVisual .answer-threat-crack{position:absolute;height:1px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.86) 34%,rgba(255,255,255,.38) 75%,rgba(255,255,255,0));filter:blur(.25px);box-shadow:0 0 6px rgba(255,255,255,.62);transform-origin:left center}
      #answerThreatVisual .c1{left:49.5%;top:31%;width:28%;transform:rotate(-11deg)}#answerThreatVisual .c2{left:28%;top:45%;width:23%;transform:rotate(8deg)}#answerThreatVisual .c3{left:50%;top:60%;width:33%;transform:rotate(12deg)}#answerThreatVisual .c4{left:20%;top:67%;width:31%;transform:rotate(-7deg)}
      #answerThreatVisual[data-band="25"] .s2,#answerThreatVisual[data-band="25"] .s3,#answerThreatVisual[data-band="25"] .c2,#answerThreatVisual[data-band="25"] .c3,#answerThreatVisual[data-band="25"] .c4{opacity:0}
      #answerThreatVisual[data-band="50"] .s3,#answerThreatVisual[data-band="50"] .c3,#answerThreatVisual[data-band="50"] .c4{opacity:0}
      #answerThreatVisual[data-band="25"] .answer-threat-slit{opacity:.32}#answerThreatVisual[data-band="50"] .answer-threat-slit{opacity:.56}#answerThreatVisual[data-band="75"] .answer-threat-slit{opacity:.78}#answerThreatVisual[data-band="100"] .answer-threat-slit{opacity:1}
      #worldEventScreen[data-answer-threat="50"] .world-event-card{filter:saturate(.94)}
      #worldEventScreen[data-answer-threat="75"] .world-event-card{filter:saturate(.84);box-shadow:0 22px 58px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.10),0 0 20px rgba(224,235,255,.04)}
      #worldEventScreen[data-answer-threat="100"] .world-event-card{filter:saturate(.70) brightness(1.025);border-color:color-mix(in srgb,var(--event-color) 27%,rgba(245,248,255,.58));box-shadow:0 22px 58px rgba(0,0,0,.50),inset 0 1px rgba(255,255,255,.16),0 0 34px rgba(224,235,255,.075)}
      #worldEventScreen[data-answer-threat="75"] .world-event-card span,#worldEventScreen[data-answer-threat="100"] .world-event-card span{box-shadow:inset 0 0 18px rgba(232,242,255,.08),0 0 16px rgba(231,240,255,.05)}
      #worldEventScreen[data-answer-threat="75"] #worldEventTitle,#worldEventScreen[data-answer-threat="100"] #worldEventTitle{text-shadow:0 0 24px rgba(255,255,255,.42),0 0 56px rgba(172,145,255,.26)}
    `;document.head.appendChild(style);
  }
  function ensureThreatVisual(){
    const shell=document.querySelector('#worldEventScreen .world-event-shell');if(!shell)return null;
    let visual=shell.querySelector('#answerThreatVisual');if(visual)return visual;
    visual=document.createElement('div');visual.id='answerThreatVisual';visual.setAttribute('aria-hidden','true');
    visual.innerHTML='<span class="answer-threat-haze"></span><span class="answer-threat-spill s1"></span><span class="answer-threat-spill s2"></span><span class="answer-threat-spill s3"></span><span class="answer-threat-slit"></span><span class="answer-threat-crack c1"></span><span class="answer-threat-crack c2"></span><span class="answer-threat-crack c3"></span><span class="answer-threat-crack c4"></span>';
    shell.appendChild(visual);return visual;
  }
  function resetThreatVisual(overlay,shell,visual){
    delete overlay.dataset.answerThreat;if(visual){visual.style.opacity='0';visual.dataset.band='0';}
    overlay.style.removeProperty('background');overlay.style.removeProperty('filter');shell?.style.removeProperty('border-color');shell?.style.removeProperty('box-shadow');shell?.style.removeProperty('filter');shell?.style.removeProperty('background');
  }
  function setThreat(value){preview.threat=threatBand(Number(value)||0);state.answerVoidThreat=preview.threat;syncThreatPanel();return preview.threat;}
  function syncThreatPanel(){
    const overlay=document.querySelector('#worldEventScreen'),shell=overlay?.querySelector('.world-event-shell'),visual=ensureThreatVisual();if(!overlay||!shell)return;
    const isVoid=overlay.dataset.eventType==='void',band=threatBand(Number(state.answerVoidThreat)||preview.threat);if(!isVoid||!band){resetThreatVisual(overlay,shell,visual);return;}
    const p=band/100,opacity={25:.16,50:.34,75:.58,100:.82}[band]||0;overlay.dataset.answerThreat=String(band);visual.dataset.band=String(band);visual.style.opacity=String(opacity);
    overlay.style.background=`radial-gradient(ellipse at 50% 38%,rgba(224,232,255,${.025+p*.12}),rgba(91,38,150,${.28-p*.08}) 34%,rgba(0,1,8,.988) 73%)`;
    overlay.style.filter=band>=75?`saturate(${1-p*.12})`:'none';shell.style.borderColor=`rgba(239,243,255,${.16+p*.48})`;
    shell.style.boxShadow=`0 36px 128px rgba(0,0,0,.78),inset 0 0 ${72+Math.round(p*78)}px rgba(218,229,255,${.025+p*.09}),0 0 ${20+Math.round(p*54)}px rgba(241,246,255,${.02+p*.10})`;
    shell.style.filter=band>=75?`saturate(${1-p*.18}) brightness(${1+p*.045})`:'none';
    shell.style.background=`radial-gradient(ellipse at 50% 6%,rgba(232,240,255,${.015+p*.055}),transparent 40%),radial-gradient(circle at 50% 0%,rgba(128,56,186,${.18-p*.05}),transparent 44%),linear-gradient(155deg,rgba(19,5,42,.97),rgba(2,2,13,.99))`;
  }
  installThreatStyle();ensureThreatVisual();
  const threatObserver=new MutationObserver(syncThreatPanel),eventOverlay=document.querySelector('#worldEventScreen');
  if(eventOverlay)threatObserver.observe(eventOverlay,{attributes:true,attributeFilter:['class','data-event-type'],subtree:false});syncThreatPanel();

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
    grid.append(
      button('응답 시안 시작','devAnswerStart',()=>activate(),true),
      button('P1 · 봉쇄','devAnswerP1',()=>setPhase(1)),button('P2 · 노출','devAnswerP2',()=>setPhase(2)),
      button('P3 · 증폭','devAnswerP3',()=>setPhase(3)),button('P4 · 응답','devAnswerP4',()=>setPhase(4)),
      button('격파 연출','devAnswerDefeat',()=>startDefeat()),button('시안 종료','devAnswerStop',()=>stop(),true),
      button('입장 위협 25%','devAnswerThreat25',()=>setThreat(25)),button('입장 위협 50%','devAnswerThreat50',()=>setThreat(50)),
      button('입장 위협 75%','devAnswerThreat75',()=>setThreat(75)),button('입장 위협 100%','devAnswerThreat100',()=>setThreat(100))
    );
    const status=document.createElement('div');status.id='devAnswerStatus';status.className='dev-wide';status.style.cssText='margin:4px 0 14px;padding:8px 10px;border:1px solid rgba(140,174,230,.18);border-radius:9px;background:rgba(9,14,30,.72);color:#92a7cb;font:700 10px/1.45 monospace;word-break:break-word';panel.append(label,grid,status);syncDevStatus();
    Object.assign(dev,{
      startAnswerPrototype:activate,prepareAnswerPrototype:beginPreparation,setAnswerPhase:setPhase,defeatAnswerPrototype:startDefeat,stopAnswerPrototype:stop,setAnswerThreat:setThreat,
      answerPrototypeSnapshot:()=>({active:preview.active,preparing:preview.preparing,prepStage:preview.prepStage,prepBlock:preview.prepBlock,preflightGemCount:preview.preflightGemCount,preflightXp:preview.preflightXp,phase:preview.phase,hpRatio:preview.hpRatio,defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,threat:preview.threat,mode:state.mode,choiceLocked:state.choiceLocked===true,camera:{x:preview.camX,y:preview.camY},bounds:preview.active?worldBounds():null,asset:{ready:answerBodyReady,failed:answerBodyFailed,naturalWidth:answerBodyImage.naturalWidth||0,naturalHeight:answerBodyImage.naturalHeight||0,renderHook:typeof window.stackfallDrawVoidApexAnswerBackground==='function'}})
    });
  }
  installDevControls();setTimeout(installDevControls,0);setTimeout(installDevControls,250);setTimeout(installDevControls,1000);
  window.stackfallVoidApexAnswerDiagnostics=()=>({
    version:'v1',visualRevision:'v10',prototypeOnly:true,active:preview.active,preparing:preview.preparing,prepStage:preview.prepStage,prepBlock:preview.prepBlock,
    preflightGemCount:preview.preflightGemCount,preflightXp:preview.preflightXp,phase:preview.phase,hpRatio:preview.hpRatio,
    defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,
    threat:preview.threat,mode:state.mode,choiceLocked:state.choiceLocked===true,camera:{x:preview.camX,y:preview.camY},geometry:geometry(),
    asset:{src:ANSWER_BODY_SRC,ready:answerBodyReady,failed:answerBodyFailed,naturalWidth:answerBodyImage.naturalWidth||0,naturalHeight:answerBodyImage.naturalHeight||0,renderHook:typeof window.stackfallDrawVoidApexAnswerBackground==='function'},
    frame:answerFrame(),backgroundFrozen:preview.active
  });
})();
