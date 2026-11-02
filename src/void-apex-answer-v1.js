// Void Apex visual/arena prototype: THE ANSWER / 응답.
// Dev-preview only: live Void Rift eligibility, combat patterns, rewards and encounter scheduling
// remain intentionally disconnected until the visual direction is approved.
(()=>{
  'use strict';
  if(window.stackfallVoidApexAnswer==='v1')return;
  window.stackfallVoidApexAnswer='v1';
  window.STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true;
  window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v6';

  const TAU_LOCAL=Math.PI*2;
  const preview={active:false,preparing:false,phase:1,hpRatio:1,defeating:false,defeatAge:0,camX:0,camY:0,aftermath:false,runSerial:null,threat:0,preflightXp:0,preflightGemCount:0,choiceGateOwned:false};
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const language=()=>GAME_SETTINGS?.language||'ko';
  const answerName=()=>language()==='ko'?'응답':'THE ANSWER';
  const phaseRatio=phase=>phase===1?1:phase===2?.76:phase===3?.51:.26;
  const threatBand=value=>value>=100?100:value>=75?75:value>=50?50:value>=25?25:0;

  function geometry(){
    const width=Math.max(720,Number(vw)||1280),height=Math.max(520,Number(vh)||720);
    return{cx:width*.5,bossY:0,bossScale:1,arenaCx:width*.5,arenaCy:height*.705,arenaRx:Math.min(width*.455,720),arenaRy:Math.min(height*.285,270),left:width*.07,right:width*.93,top:height*.40,bottom:height*.925};
  }
  function worldBounds(){const g=geometry(),margin=Math.max(20,Number(player?.r)||14);return{minX:preview.camX+(g.left-vw/2)+margin,maxX:preview.camX+(g.right-vw/2)-margin,minY:preview.camY+(g.top-vh/2)+margin,maxY:preview.camY+(g.bottom-vh/2)-margin};}
  function cameraOffset(){return{x:player.x-preview.camX,y:player.y-preview.camY};}
  function releasePreparationGate(){if(preview.choiceGateOwned){state.choiceLocked=false;preview.choiceGateOwned=false;}}
  function clearPreviewState(){releasePreparationGate();preview.active=false;preview.preparing=false;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;preview.runSerial=null;preview.preflightXp=0;preview.preflightGemCount=0;state.answerVoidApexPreview=false;state.answerVoidApexPreparing=false;state.answerVoidSealed=false;document.documentElement.dataset.answerPreview='0';document.documentElement.dataset.answerPreparing='0';syncBossHud();}
  function ensureRunIdentity(){if(preview.runSerial!=null&&preview.runSerial!==state.runSerial)clearPreviewState();}
  function clampPlayerToArena(){if(!preview.active||!player)return;const b=worldBounds();player.x=Math.max(b.minX,Math.min(b.maxX,player.x));player.y=Math.max(b.minY,Math.min(b.maxY,player.y));}
  function clearHostileField(){const entities=state?.entities||{};for(const key of['enemies','enemyProjectiles','telegraphs'])if(Array.isArray(entities[key]))entities[key].length=0;try{clearPendingCombatActions?.();}catch{}try{window.closeMapEventOverlays?.();}catch{}state.mapEventActive=null;state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;state.apexArena=null;state.apexExitPending=false;}
  function syncBossHud(){const bar=document.querySelector('#bossBar'),name=document.querySelector('#bossName'),fill=document.querySelector('#bossHpBar'),extras=document.querySelector('#bossBarExtras');if(!bar)return;if(!preview.active){bar.classList.add('hidden');if(extras)extras.textContent='';return;}bar.classList.remove('hidden');if(name)name.textContent=answerName();if(fill)fill.style.width=`${Math.max(0,Math.min(100,preview.hpRatio*100))}%`;if(extras)extras.textContent='';}
  function setPhase(phase){if(!preview.active)return false;preview.phase=Math.max(1,Math.min(4,Math.floor(Number(phase)||1)));preview.hpRatio=phaseRatio(preview.phase);preview.defeating=false;preview.defeatAge=0;syncBossHud();state.camera.shake=Math.max(Number(state.camera.shake)||0,1.7+preview.phase*.85);return true;}
  function activatePreparedEncounter(){if(!preview.preparing||state.mode!=='playing'||state.choiceLocked||state.xp>=state.xpNeed)return false;releasePreparationGate();preview.preparing=false;preview.active=true;preview.phase=1;preview.hpRatio=1;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;state.answerVoidApexPreparing=false;state.answerVoidApexPreview=true;state.answerVoidSealed=false;document.documentElement.dataset.answerPreparing='0';document.documentElement.dataset.answerPreview='1';preview.camX=player.x;preview.camY=player.y-(Number(vh)||720)*.205;player.y=preview.camY+(Number(vh)||720)*.225;player.invuln=Math.max(Number(player.invuln)||0,1.2);clampPlayerToArena();syncBossHud();state.camera.shake=Math.max(Number(state.camera.shake)||0,3.5);state.flash=Math.max(Number(state.flash)||0,.02);try{audio?.tone?.(42,.34,'sawtooth',.022,-8);}catch{}return true;}
  function activeExperienceGems(){const gems=state.entities?.gems||[];return gems.filter(g=>typeof experienceGemActive==='function'?experienceGemActive(g):!!(g&&g.active!==false));}
  function prepareLevelChoicesWhenReady(){if(!preview.preparing)return false;if(activeExperienceGems().length)return false;releasePreparationGate();if(state.mode==='playing'&&state.xp>=state.xpNeed){try{tryLevelUp();}catch{}return false;}if(state.mode!=='playing'||state.choiceLocked||state.xp>=state.xpNeed)return false;return activatePreparedEncounter();}
  function beginPreparation(){if(state.mode!=='playing'||preview.active||preview.preparing)return false;clearHostileField();preview.preparing=true;preview.active=false;preview.phase=1;preview.hpRatio=1;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;preview.runSerial=state.runSerial;preview.preflightXp=0;preview.preflightGemCount=0;state.answerVoidApexPreparing=true;state.answerVoidApexPreview=false;state.answerVoidSealed=false;document.documentElement.dataset.answerPreparing='1';document.documentElement.dataset.answerPreview='0';if(!state.choiceLocked){state.choiceLocked=true;preview.choiceGateOwned=true;}player.invuln=Math.max(Number(player.invuln)||0,5);let pulled={count:0,value:0};try{if(typeof window.stackfallCollectSuctionMagnet==='function')pulled=window.stackfallCollectSuctionMagnet()||pulled;}catch{}preview.preflightGemCount=Math.max(0,Number(pulled.count)||0);preview.preflightXp=Math.max(0,Number(pulled.value)||0);try{shockwave(player.x,player.y,'#ffdf79',105,.42,2.2);spawnParticle(player.x,player.y,'#fff3ba',12,125,2.5);audio?.pickup?.();}catch{}if(preview.preflightGemCount===0)queueMicrotask(prepareLevelChoicesWhenReady);return true;}
  function activate(){return beginPreparation();}
  function stop(){releasePreparationGate();preview.active=false;preview.preparing=false;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;state.answerVoidApexPreview=false;state.answerVoidApexPreparing=false;document.documentElement.dataset.answerPreview='0';document.documentElement.dataset.answerPreparing='0';syncBossHud();return true;}
  function startDefeat(){if(!preview.active||preview.defeating)return false;preview.defeating=true;preview.defeatAge=0;preview.hpRatio=0;player.invuln=Math.max(Number(player.invuln)||0,4);state.camera.shake=Math.max(Number(state.camera.shake)||0,5.5);try{audio?.tone?.(52,.52,'sine',.022,18);}catch{}syncBossHud();return true;}
  function finishDefeat(){state.answerVoidSealed=true;preview.active=false;preview.defeating=false;preview.aftermath=true;state.answerVoidApexPreview=false;document.documentElement.dataset.answerPreview='0';state.camera.shake=Math.max(Number(state.camera.shake)||0,12);state.flash=Math.max(Number(state.flash)||0,.26);try{audio?.tone?.(36,.48,'sawtooth',.045,-16);audio?.tone?.(92,.26,'sine',.028,-30);}catch{}syncBossHud();}
  function updatePrototype(dt){ensureRunIdentity();const step=Math.max(0,Number(dt)||0);if(preview.preparing){player.invuln=Math.max(Number(player.invuln)||0,.35);prepareLevelChoicesWhenReady();return;}if(!preview.active)return;clampPlayerToArena();if(preview.defeating){preview.defeatAge+=step;if(preview.defeatAge>=3.15)finishDefeat();}syncBossHud();}

  // V6 visual lock: the body, stars and galaxies never change between phases.
  // Only the white fissure network accumulates and brightens from P1 -> P4.
  const bodyCache={canvas:null,w:0,h:0};
  const seeded01=(i,seed=0)=>((Math.sin(i*91.133+seed*17.77)*43758.5453)%1+1)%1;
  function bodyHeight(){return Math.max(150,Math.min(310,(Number(vh)||720)*.275));}
  function traceAnswerBody(target,w,h){
    target.beginPath();target.moveTo(-w*.08,-h*.12);target.lineTo(w*1.08,-h*.12);target.lineTo(w*1.06,h*.30);
    target.bezierCurveTo(w*.94,h*.37,w*.88,h*.55,w*.78,h*.61);
    target.bezierCurveTo(w*.71,h*.66,w*.67,h*.73,w*.61,h*.75);
    target.bezierCurveTo(w*.57,h*.77,w*.54,h*.91,w*.505,h*.98);
    target.bezierCurveTo(w*.47,h*.90,w*.44,h*.80,w*.39,h*.76);
    target.bezierCurveTo(w*.33,h*.72,w*.28,h*.67,w*.22,h*.61);
    target.bezierCurveTo(w*.13,h*.53,w*.07,h*.39,-w*.06,h*.32);target.closePath();
  }
  function drawGalaxy(target,x,y,r,rot,alpha){
    target.save();target.translate(x,y);target.rotate(rot);target.globalCompositeOperation='screen';
    const core=target.createRadialGradient(0,0,0,0,0,r);core.addColorStop(0,`rgba(255,244,232,${alpha*.88})`);core.addColorStop(.12,`rgba(181,169,255,${alpha*.62})`);core.addColorStop(.42,`rgba(91,68,185,${alpha*.28})`);core.addColorStop(1,'rgba(0,0,0,0)');target.fillStyle=core;target.scale(1,.42);target.beginPath();target.arc(0,0,r,0,TAU_LOCAL);target.fill();
    target.lineCap='round';for(let arm=0;arm<2;arm++){target.beginPath();for(let i=0;i<=18;i++){const t=i/18,a=arm*Math.PI+t*Math.PI*2.15,rr=r*(.10+t*.88),px=Math.cos(a)*rr,py=Math.sin(a)*rr*.62;i?target.lineTo(px,py):target.moveTo(px,py);}target.strokeStyle=`rgba(170,151,255,${alpha*.30})`;target.lineWidth=Math.max(.7,r*.035);target.stroke();}
    target.restore();
  }
  function renderBodyCache(){
    const w=Math.max(720,Math.round(Number(vw)||1280)),h=Math.round(bodyHeight());if(bodyCache.canvas&&bodyCache.w===w&&bodyCache.h===h)return bodyCache.canvas;
    const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');canvas.width=w;canvas.height=h;const b=canvas.getContext('2d');if(!b)return null;
    b.clearRect(0,0,w,h);b.save();traceAnswerBody(b,w,h);b.clip();
    const base=b.createLinearGradient(0,0,w,h);base.addColorStop(0,'#000105');base.addColorStop(.18,'#01030a');base.addColorStop(.44,'#020511');base.addColorStop(.68,'#050718');base.addColorStop(1,'#000104');b.fillStyle=base;b.fillRect(0,0,w,h);
    const voidPools=[[.12,.30,.34],[.43,.26,.30],[.72,.31,.33],[.91,.23,.25]];for(const [px,py,pr] of voidPools){const x=w*px,y=h*py,r=w*pr,g=b.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(0,0,1,.98)');g.addColorStop(.50,'rgba(0,1,5,.86)');g.addColorStop(1,'rgba(0,0,0,0)');b.fillStyle=g;b.fillRect(x-r,y-r,r*2,r*2);}
    const nebula=[[.20,.35,.27,'70,68,170'],[.42,.26,.23,'58,87,171'],[.64,.31,.25,'96,54,151'],[.84,.27,.24,'55,78,166']];for(const [px,py,pr,col] of nebula){const x=w*px,y=h*py,r=w*pr,g=b.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${col},.15)`);g.addColorStop(.28,`rgba(${col},.07)`);g.addColorStop(1,`rgba(${col},0)`);b.fillStyle=g;b.fillRect(x-r,y-r,r*2,r*2);}
    for(let i=0;i<190;i++){const x=seeded01(i,12)*w,y=seeded01(i+83,12)*h,r=seeded01(i+171,12)>.965?1.55:seeded01(i+124,12)>.74?.85:.42,alpha=.17+seeded01(i+29,12)*.68;b.globalAlpha=alpha;b.fillStyle=i%17===0?'#bcdcff':i%11===0?'#d5c7ff':'#ffffff';b.beginPath();b.arc(x,y,r,0,TAU_LOCAL);b.fill();}
    b.globalAlpha=1;drawGalaxy(b,w*.19,h*.35,Math.min(w*.072,h*.36),-.20,.72);drawGalaxy(b,w*.40,h*.22,Math.min(w*.052,h*.26),.38,.52);drawGalaxy(b,w*.67,h*.28,Math.min(w*.068,h*.34),-.44,.66);drawGalaxy(b,w*.84,h*.31,Math.min(w*.047,h*.24),.21,.44);
    b.restore();b.save();traceAnswerBody(b,w,h);b.strokeStyle='rgba(68,68,112,.33)';b.lineWidth=1.2;b.stroke();b.restore();bodyCache.canvas=canvas;bodyCache.w=w;bodyCache.h=h;return canvas;
  }

  const FISSURES=[
    [[.505,.04],[.500,.24],[.512,.42],[.502,.61],[.515,.84],[.505,.98]],
    [[.505,.35],[.455,.31],[.410,.26],[.360,.21]],
    [[.507,.48],[.558,.42],[.610,.37],[.660,.30]],
    [[.455,.31],[.420,.40],[.380,.49],[.332,.57]],
    [[.558,.42],[.600,.52],[.646,.59],[.706,.64]],
    [[.360,.21],[.305,.18],[.250,.15],[.198,.12]],
    [[.660,.30],[.715,.25],[.770,.19],[.825,.14]],
    [[.332,.57],[.286,.62],[.236,.66]],
    [[.706,.64],[.758,.66],[.812,.65]],
    [[.420,.40],[.386,.35],[.352,.31]],
    [[.600,.52],[.632,.47],[.664,.43]],
    [[.250,.15],[.214,.22],[.180,.27]],
    [[.770,.19],[.806,.25],[.842,.29]]
  ];
  const PHASE_CRACK_COUNT=[3,6,9,13];
  function strokeFissure(points,w,h,width,alpha,blur=0){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>{const x=p[0]*w,y=p[1]*h;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.globalCompositeOperation='screen';ctx.strokeStyle=`rgba(255,255,255,${alpha})`;ctx.lineWidth=width;if(blur>0){ctx.shadowColor='#ffffff';ctx.shadowBlur=blur;}ctx.stroke();ctx.restore();}
  function drawFissures(w,h,phase,death){
    const phaseCount=PHASE_CRACK_COUNT[Math.max(0,Math.min(3,phase-1))],count=death>0?FISSURES.length:phaseCount,pulse=1+Math.sin(performance.now()*.0018)*.035;
    ctx.save();traceAnswerBody(ctx,w,h);ctx.clip();
    for(let i=0;i<count;i++){const points=FISSURES[i],main=i===0,phaseBoost=Math.max(0,phase-1),deathBoost=death*.8,coreWidth=(main?1.45:.78)+(phaseBoost*(main?.26:.14))+deathBoost*(main?2.1:1.1);strokeFissure(points,w,h,coreWidth*4.2,.08+phaseBoost*.025+death*.16,8+phaseBoost*1.5+death*12);strokeFissure(points,w,h,coreWidth*pulse,.76+phaseBoost*.055+death*.16,main?5:3);strokeFissure(points,w,h,Math.max(.7,coreWidth*.42),Math.min(1,.92+phaseBoost*.02+death*.08),0);}
    ctx.restore();
  }
  function drawTwinkles(w,h){ctx.save();traceAnswerBody(ctx,w,h);ctx.clip();ctx.globalCompositeOperation='screen';const t=performance.now()*.001;for(let i=0;i<9;i++){const x=seeded01(i,90)*w,y=(.10+seeded01(i+18,90)*.64)*h,a=.08+.18*(.5+.5*Math.sin(t*(.44+seeded01(i+31,90)*.42)+i));ctx.globalAlpha=a;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,i%4===0?1.1:.65,0,TAU_LOCAL);ctx.fill();}ctx.restore();}
  function drawPhaseSky(){if(!preview.active)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='rgba(0,0,7,.08)';ctx.fillRect(0,0,vw,vh*.36);ctx.restore();}
  function drawAnswerBoss(){
    const phase=preview.phase,death=preview.defeating?clamp01(preview.defeatAge/3.15):0,body=renderBodyCache();if(!body)return;const w=bodyCache.w,h=bodyCache.h,t=performance.now()*.001,bob=Math.sin(t*.34)*2.4,drift=Math.sin(t*.17)*1.4;
    ctx.save();ctx.translate(drift,bob);ctx.drawImage(body,0,0,w,h);drawTwinkles(w,h);drawFissures(w,h,phase,death);ctx.restore();
    if(death>.16){ctx.save();ctx.globalCompositeOperation='screen';const k=clamp01((death-.16)/.74),x=w*.505,y=h*.70,g=ctx.createRadialGradient(x,y,0,x,y,Math.max(w,h)*(.05+k*.42));g.addColorStop(0,`rgba(255,255,255,${.18+k*.58})`);g.addColorStop(.32,`rgba(239,246,255,${.07+k*.18})`);g.addColorStop(1,'rgba(210,224,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,vw,Math.max(h*1.8,vh*.55));ctx.restore();}
    if(death>.90){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp01((death-.90)/.07)*.68;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,vw,vh);ctx.restore();}
  }
  function drawPrototypeBackground(){drawPhaseSky();drawAnswerBoss();}
  function drawAftermathOverlay(){if(!preview.aftermath)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(vw*.5,vh*.43,20,vw*.5,vh*.50,Math.max(vw,vh)*.82);g.addColorStop(0,'rgba(216,232,255,.095)');g.addColorStop(.50,'rgba(114,163,255,.045)');g.addColorStop(1,'rgba(255,255,255,.014)');ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);ctx.restore();}

  function withFixedArenaCamera(base,...args){if(!preview.active||typeof base!=='function')return base?.(...args);const offset=cameraOffset();ctx.save();ctx.translate(offset.x,offset.y);try{return base(...args);}finally{ctx.restore();}}
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

  const basePause=typeof isApexProgressionClockPaused==='function'?isApexProgressionClockPaused:null;if(basePause)isApexProgressionClockPaused=function isProgressionPausedForAnswer(){ensureRunIdentity();return preview.active||preview.preparing||basePause();};
  const baseUpdateSpawning=typeof updateSpawning==='function'?updateSpawning:null;if(baseUpdateSpawning)updateSpawning=function updateSpawningWithAnswerPrototype(dt){if(preview.active||preview.preparing)return;return baseUpdateSpawning(dt);};
  const baseUpdateMapEvents=typeof updateMapEvents==='function'?updateMapEvents:null;if(baseUpdateMapEvents)updateMapEvents=function updateMapEventsWithAnswerPrototype(dt){if(preview.active||preview.preparing)return;return baseUpdateMapEvents(dt);};
  if(typeof registerPlayerUpdateInterceptor==='function')registerPlayerUpdateInterceptor('void-apex-answer-v1:arena',function answerArenaPlayerUpdate(next,dt){if(preview.active||preview.preparing)state.time=Math.max(0,(Number(state.time)||0)-Math.max(0,Number(dt)||0));const result=next(dt);updatePrototype(dt);return result;});
  const baseUpdateHud=typeof updateHUD==='function'?updateHUD:null;if(baseUpdateHud)updateHUD=function updateHudWithAnswerPrototype(){const result=baseUpdateHud();if(preview.active)syncBossHud();return result;};
  const baseDrawBackground=typeof drawBackground==='function'?drawBackground:null;if(baseDrawBackground)drawBackground=function drawBackgroundWithAnswerArena(){const result=baseDrawBackground();if(preview.active)drawPrototypeBackground();return result;};
  const baseDraw=typeof draw==='function'?draw:null;if(baseDraw)draw=function drawWithAnswerAftermath(){ensureRunIdentity();const result=baseDraw();drawAftermathOverlay();return result;};

  function installThreatStyle(){if(document.querySelector('#answerThreatStyle'))return;const style=document.createElement('style');style.id='answerThreatStyle';style.textContent=`
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
    `;document.head.appendChild(style);}
  function ensureThreatVisual(){const shell=document.querySelector('#worldEventScreen .world-event-shell');if(!shell)return null;let visual=shell.querySelector('#answerThreatVisual');if(visual)return visual;visual=document.createElement('div');visual.id='answerThreatVisual';visual.setAttribute('aria-hidden','true');visual.innerHTML='<span class="answer-threat-haze"></span><span class="answer-threat-spill s1"></span><span class="answer-threat-spill s2"></span><span class="answer-threat-spill s3"></span><span class="answer-threat-slit"></span><span class="answer-threat-crack c1"></span><span class="answer-threat-crack c2"></span><span class="answer-threat-crack c3"></span><span class="answer-threat-crack c4"></span>';shell.appendChild(visual);return visual;}
  function resetThreatVisual(overlay,shell,visual){delete overlay.dataset.answerThreat;if(visual){visual.style.opacity='0';visual.dataset.band='0';}overlay.style.removeProperty('background');overlay.style.removeProperty('filter');shell?.style.removeProperty('border-color');shell?.style.removeProperty('box-shadow');shell?.style.removeProperty('filter');shell?.style.removeProperty('background');}
  function setThreat(value){preview.threat=threatBand(Number(value)||0);state.answerVoidThreat=preview.threat;syncThreatPanel();return preview.threat;}
  function syncThreatPanel(){const overlay=document.querySelector('#worldEventScreen'),shell=overlay?.querySelector('.world-event-shell'),visual=ensureThreatVisual();if(!overlay||!shell)return;const isVoid=overlay.dataset.eventType==='void',band=threatBand(Number(state.answerVoidThreat)||preview.threat);if(!isVoid||!band){resetThreatVisual(overlay,shell,visual);return;}const p=band/100,opacity={25:.16,50:.34,75:.58,100:.82}[band]||0;overlay.dataset.answerThreat=String(band);visual.dataset.band=String(band);visual.style.opacity=String(opacity);overlay.style.background=`radial-gradient(ellipse at 50% 38%,rgba(224,232,255,${.025+p*.12}),rgba(91,38,150,${.28-p*.08}) 34%,rgba(0,1,8,.988) 73%)`;overlay.style.filter=band>=75?`saturate(${1-p*.12})`:'none';shell.style.borderColor=`rgba(239,243,255,${.16+p*.48})`;shell.style.boxShadow=`0 36px 128px rgba(0,0,0,.78),inset 0 0 ${72+Math.round(p*78)}px rgba(218,229,255,${.025+p*.09}),0 0 ${20+Math.round(p*54)}px rgba(241,246,255,${.02+p*.10})`;shell.style.filter=band>=75?`saturate(${1-p*.18}) brightness(${1+p*.045})`:'none';shell.style.background=`radial-gradient(ellipse at 50% 6%,rgba(232,240,255,${.015+p*.055}),transparent 40%),radial-gradient(circle at 50% 0%,rgba(128,56,186,${.18-p*.05}),transparent 44%),linear-gradient(155deg,rgba(19,5,42,.97),rgba(2,2,13,.99))`;}
  installThreatStyle();ensureThreatVisual();const threatObserver=new MutationObserver(syncThreatPanel),eventOverlay=document.querySelector('#worldEventScreen');if(eventOverlay)threatObserver.observe(eventOverlay,{attributes:true,attributeFilter:['class','data-event-type'],subtree:false});syncThreatPanel();

  function installDevControls(){const dev=window.stackfallDeveloperTest,panel=document.querySelector('#stackfallDevPanel');if(!dev?.enabled||!panel||document.querySelector('#devAnswerPrototype'))return;const label=document.createElement('label');label.textContent='VOID APEX · 응답 디자인';const grid=document.createElement('div');grid.className='dev-grid';grid.id='devAnswerPrototype';const button=(text,id,handler,wide=false)=>{const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;if(wide)b.className='dev-wide';b.addEventListener('click',handler);return b;};grid.append(button('응답 시안 시작','devAnswerStart',()=>activate(),true),button('P1 · 봉쇄','devAnswerP1',()=>setPhase(1)),button('P2 · 노출','devAnswerP2',()=>setPhase(2)),button('P3 · 증폭','devAnswerP3',()=>setPhase(3)),button('P4 · 응답','devAnswerP4',()=>setPhase(4)),button('격파 연출','devAnswerDefeat',()=>startDefeat()),button('시안 종료','devAnswerStop',()=>stop(),true),button('입장 위협 25%','devAnswerThreat25',()=>setThreat(25)),button('입장 위협 50%','devAnswerThreat50',()=>setThreat(50)),button('입장 위협 75%','devAnswerThreat75',()=>setThreat(75)),button('입장 위협 100%','devAnswerThreat100',()=>setThreat(100)));panel.append(label,grid);Object.assign(dev,{startAnswerPrototype:activate,prepareAnswerPrototype:beginPreparation,setAnswerPhase:setPhase,defeatAnswerPrototype:startDefeat,stopAnswerPrototype:stop,setAnswerThreat:setThreat,answerPrototypeSnapshot:()=>({active:preview.active,preparing:preview.preparing,preflightGemCount:preview.preflightGemCount,preflightXp:preview.preflightXp,phase:preview.phase,hpRatio:preview.hpRatio,defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,threat:preview.threat,camera:{x:preview.camX,y:preview.camY},bounds:preview.active?worldBounds():null})});}
  installDevControls();setTimeout(installDevControls,0);window.stackfallVoidApexAnswerDiagnostics=()=>({version:'v1',visualRevision:'v6',prototypeOnly:true,active:preview.active,preparing:preview.preparing,preflightGemCount:preview.preflightGemCount,preflightXp:preview.preflightXp,phase:preview.phase,hpRatio:preview.hpRatio,defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,threat:preview.threat,camera:{x:preview.camX,y:preview.camY},geometry:geometry(),bodyCache:{w:bodyCache.w,h:bodyCache.h}});
})();
