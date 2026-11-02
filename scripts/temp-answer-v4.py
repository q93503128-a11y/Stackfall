from pathlib import Path

path=Path('src/void-apex-answer-v1.js')
s=path.read_text()

if "STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v4'" in s:
    print('Answer V4 already applied')
else:
    s=s.replace("window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v3';","window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v4';",1)
    s=s.replace("const preview={active:false,phase:1,hpRatio:1,defeating:false,defeatAge:0,camX:0,camY:0,aftermath:false,runSerial:null,threat:0};","const preview={active:false,preparing:false,phase:1,hpRatio:1,defeating:false,defeatAge:0,camX:0,camY:0,aftermath:false,runSerial:null,threat:0,preflightXp:0,preflightGemCount:0,choiceGateOwned:false};",1)

    old_clear="function clearPreviewState(){preview.active=false;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;preview.runSerial=null;state.answerVoidApexPreview=false;state.answerVoidSealed=false;document.documentElement.dataset.answerPreview='0';syncBossHud();}"
    new_clear="function releasePreparationGate(){if(preview.choiceGateOwned){state.choiceLocked=false;preview.choiceGateOwned=false;}}\n  function clearPreviewState(){releasePreparationGate();preview.active=false;preview.preparing=false;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;preview.runSerial=null;preview.preflightXp=0;preview.preflightGemCount=0;state.answerVoidApexPreview=false;state.answerVoidApexPreparing=false;state.answerVoidSealed=false;document.documentElement.dataset.answerPreview='0';document.documentElement.dataset.answerPreparing='0';syncBossHud();}"
    if old_clear not in s: raise SystemExit('clearPreviewState anchor missing')
    s=s.replace(old_clear,new_clear,1)

    start=s.index('  function activate(){')
    end=s.index('  function startDefeat()',start)
    activation="""  function activatePreparedEncounter(){
    if(!preview.preparing||state.mode!=='playing'||state.choiceLocked||state.xp>=state.xpNeed)return false;
    releasePreparationGate();preview.preparing=false;preview.active=true;preview.phase=1;preview.hpRatio=1;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;state.answerVoidApexPreparing=false;state.answerVoidApexPreview=true;state.answerVoidSealed=false;document.documentElement.dataset.answerPreparing='0';document.documentElement.dataset.answerPreview='1';
    preview.camX=player.x;preview.camY=player.y-(Number(vh)||720)*.205;player.y=preview.camY+(Number(vh)||720)*.225;player.invuln=Math.max(Number(player.invuln)||0,1.2);clampPlayerToArena();syncBossHud();state.camera.shake=Math.max(Number(state.camera.shake)||0,5);state.flash=Math.max(Number(state.flash)||0,.035);
    try{audio?.tone?.(42,.34,'sawtooth',.022,-8);}catch{}return true;
  }
  function activeExperienceGems(){const gems=state.entities?.gems||[];return gems.filter(g=>typeof experienceGemActive==='function'?experienceGemActive(g):!!(g&&g.active!==false));}
  function prepareLevelChoicesWhenReady(){
    if(!preview.preparing)return false;if(activeExperienceGems().length)return false;
    releasePreparationGate();
    if(state.mode==='playing'&&state.xp>=state.xpNeed){try{tryLevelUp();}catch{}return false;}
    if(state.mode!=='playing'||state.choiceLocked||state.xp>=state.xpNeed)return false;
    return activatePreparedEncounter();
  }
  function beginPreparation(){
    if(state.mode!=='playing'||preview.active||preview.preparing)return false;clearHostileField();preview.preparing=true;preview.active=false;preview.phase=1;preview.hpRatio=1;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;preview.runSerial=state.runSerial;preview.preflightXp=0;preview.preflightGemCount=0;state.answerVoidApexPreparing=true;state.answerVoidApexPreview=false;state.answerVoidSealed=false;document.documentElement.dataset.answerPreparing='1';document.documentElement.dataset.answerPreview='0';
    if(!state.choiceLocked){state.choiceLocked=true;preview.choiceGateOwned=true;}player.invuln=Math.max(Number(player.invuln)||0,5);
    let pulled={count:0,value:0};try{if(typeof window.stackfallCollectSuctionMagnet==='function')pulled=window.stackfallCollectSuctionMagnet()||pulled;}catch{}preview.preflightGemCount=Math.max(0,Number(pulled.count)||0);preview.preflightXp=Math.max(0,Number(pulled.value)||0);
    try{shockwave(player.x,player.y,'#ffdf79',105,.42,2.2);spawnParticle(player.x,player.y,'#fff3ba',12,125,2.5);audio?.pickup?.();}catch{}
    if(preview.preflightGemCount===0)queueMicrotask(prepareLevelChoicesWhenReady);return true;
  }
  function activate(){return beginPreparation();}
  function stop(){releasePreparationGate();preview.active=false;preview.preparing=false;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;state.answerVoidApexPreview=false;state.answerVoidApexPreparing=false;document.documentElement.dataset.answerPreview='0';document.documentElement.dataset.answerPreparing='0';syncBossHud();return true;}
"""
    s=s[:start]+activation+s[end:]

    old_update="function updatePrototype(dt){ensureRunIdentity();if(!preview.active)return;const step=Math.max(0,Number(dt)||0);clampPlayerToArena();if(preview.defeating){preview.defeatAge+=step;if(preview.defeatAge>=3.15)finishDefeat();}syncBossHud();}"
    new_update="function updatePrototype(dt){ensureRunIdentity();const step=Math.max(0,Number(dt)||0);if(preview.preparing){player.invuln=Math.max(Number(player.invuln)||0,.35);prepareLevelChoicesWhenReady();return;}if(!preview.active)return;clampPlayerToArena();if(preview.defeating){preview.defeatAge+=step;if(preview.defeatAge>=3.15)finishDefeat();}syncBossHud();}"
    if old_update not in s: raise SystemExit('updatePrototype anchor missing')
    s=s.replace(old_update,new_update,1)

    old_mantle="drawCosmicSpecks(cx,cy,s*.82,s*.37,52,1-death*.72,12);ctx.restore();"
    new_mantle="drawCosmicSpecks(cx,cy,s*.82,s*.37,52,1-death*.72,12);drawMantleReflections(cx,cy,s,phase,death);ctx.restore();"
    if old_mantle not in s: raise SystemExit('mantle reflection anchor missing')
    s=s.replace(old_mantle,new_mantle,1)

    start=s.index('  function drawFissureRays(')
    end=s.index('  function drawCracks(',start)
    lighting="""  function drawMantleReflections(cx,cy,s,phase,death){
    const intensity=(phase===1?.16:phase===2?.31:.49)+death*.36,points=[[0,-.10,.23],[-.18,-.18,.15],[.19,-.10,.15],[-.34,.15,.13],[.31,.20,.12]];ctx.save();ctx.globalCompositeOperation='screen';for(const [px,py,pr] of points){const x=cx+px*s,y=cy+py*s,r=s*pr,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,255,255,${intensity})`);g.addColorStop(.20,`rgba(225,238,255,${intensity*.46})`);g.addColorStop(.58,`rgba(114,157,255,${intensity*.15})`);g.addColorStop(1,'rgba(100,128,255,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}ctx.restore();
  }
  function drawSoftFissureBeam(sx,sy,angle,length,nearWidth,farWidth,alpha){
    const drawLayer=(blur,widthScale,layerAlpha)=>{ctx.save();ctx.filter=`blur(${blur}px)`;const g=ctx.createLinearGradient(0,0,length,0);g.addColorStop(0,`rgba(255,255,255,${Math.min(.92,alpha*layerAlpha)})`);g.addColorStop(.08,`rgba(245,250,255,${Math.min(.62,alpha*layerAlpha*.80)})`);g.addColorStop(.34,`rgba(218,234,255,${Math.min(.22,alpha*layerAlpha*.36)})`);g.addColorStop(1,'rgba(207,225,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-nearWidth*widthScale);ctx.quadraticCurveTo(length*.31,-farWidth*widthScale*.62,length,-farWidth*widthScale);ctx.lineTo(length,farWidth*widthScale);ctx.quadraticCurveTo(length*.31,farWidth*widthScale*.62,0,nearWidth*widthScale);ctx.closePath();ctx.fill();ctx.restore();};
    ctx.save();ctx.translate(sx,sy);ctx.rotate(angle);ctx.globalCompositeOperation='screen';drawLayer(22,1.55,.38);drawLayer(10,1.0,.52);drawLayer(3,.44,.54);ctx.restore();
  }
  function drawFissureRays(cx,cy,s,phase,death){
    const intensity=(phase===1?.24:phase===2?.42:.61)+death*.48;ctx.save();ctx.globalCompositeOperation='screen';drawSoftFissureBeam(cx-s*.008,cy-s*.29,-Math.PI*.52,s*(.48+phase*.075+death*.22),s*.004,s*(.082+phase*.016),intensity*.78);drawSoftFissureBeam(cx+s*.012,cy+s*.28,Math.PI*.49,s*(.34+phase*.06+death*.18),s*.004,s*(.067+phase*.014),intensity*.58);if(phase>=2||death>.2){const count=phase===2?3:5;for(let i=1;i<=count;i++){const crack=CRACKS[i],p=crack[crack.length-1],angle=Math.atan2(p[1],p[0]),sx=cx+p[0]*s,sy=cy+p[1]*s,len=s*(.25+seeded01(i,65)*.18+death*.14),far=s*(.030+seeded01(i+9,65)*.024);drawSoftFissureBeam(sx,sy,angle,len,s*.0025,far,intensity*(.22+seeded01(i+17,65)*.16));}}ctx.restore();
  }
"""
    s=s[:start]+lighting+s[end:]

    start=s.index('  function drawCracks(')
    end=s.index('  function drawFragments(',start)
    cracks_and_core="""  function drawCracks(cx,cy,s,phase,death){const count=phase===1?3:phase===2?6:CRACKS.length;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalCompositeOperation='screen';for(let i=0;i<count;i++){ctx.beginPath();CRACKS[i].forEach((p,j)=>{const x=cx+p[0]*s,y=cy+p[1]*s;j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='rgba(255,255,255,.28)';ctx.globalAlpha=Math.min(1,.42+phase*.09+death*.48);ctx.lineWidth=s*(i===0?.010:.0045)*(1+death*.75);ctx.shadowColor='#ffffff';ctx.shadowBlur=s*(.018+phase*.006+death*.07);ctx.stroke();ctx.strokeStyle='#ffffff';ctx.globalAlpha=Math.min(1,.58+phase*.08+death*.42);ctx.lineWidth=Math.max(1,s*(i===0?.0038:.0022));ctx.shadowBlur=s*(.010+death*.035);ctx.stroke();}ctx.restore();}
  function drawCoreTear(cx,cy,s,phase,death){
    const points=[[-.012,-.33],[.024,-.23],[-.008,-.13],[.020,-.045],[-.014,.055],[.024,.15],[-.010,.33]],pulse=1+Math.sin(performance.now()*.0026)*.025,widen=1+(phase-1)*.10+death*.72;ctx.save();ctx.translate(cx,cy-s*.005);ctx.scale(widen*pulse,1+(phase-1)*.018+death*.12);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0]*s,p[1]*s):ctx.moveTo(p[0]*s,p[1]*s));ctx.globalCompositeOperation='source-over';ctx.strokeStyle='rgba(0,1,8,.93)';ctx.lineWidth=s*(.042+death*.018);ctx.stroke();ctx.globalCompositeOperation='screen';ctx.save();ctx.filter=`blur(${Math.max(8,s*(.028+death*.035))}px)`;ctx.strokeStyle=`rgba(255,255,255,${.32+phase*.10+death*.46})`;ctx.lineWidth=s*(.032+phase*.004+death*.040);ctx.stroke();ctx.restore();ctx.shadowColor='#ffffff';ctx.shadowBlur=s*(.034+phase*.009+death*.07);ctx.strokeStyle='#ffffff';ctx.globalAlpha=Math.min(1,.78+phase*.06+death*.32);ctx.lineWidth=Math.max(2,s*(.007+death*.010));ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=.38+phase*.07+death*.35;ctx.strokeStyle='#dfeeff';ctx.lineWidth=Math.max(1,s*.0025);ctx.stroke();ctx.restore();
  }
"""
    s=s[:start]+cracks_and_core+s[end:]

    old_pause="return preview.active||basePause();"
    if old_pause not in s: raise SystemExit('pause anchor missing')
    s=s.replace(old_pause,"return preview.active||preview.preparing||basePause();",1)
    s=s.replace("if(preview.active)return;return baseUpdateSpawning(dt);","if(preview.active||preview.preparing)return;return baseUpdateSpawning(dt);",1)
    s=s.replace("if(preview.active)return;return baseUpdateMapEvents(dt);","if(preview.active||preview.preparing)return;return baseUpdateMapEvents(dt);",1)
    s=s.replace("if(preview.active)state.time=Math.max(0,(Number(state.time)||0)-Math.max(0,Number(dt)||0));","if(preview.active||preview.preparing)state.time=Math.max(0,(Number(state.time)||0)-Math.max(0,Number(dt)||0));",1)

    start=s.index('  function installThreatStyle()')
    end=s.index('  function setThreat(',start)
    threat="""  function installThreatStyle(){
    if(document.querySelector('#answerThreatStyle'))return;const style=document.createElement('style');style.id='answerThreatStyle';style.textContent=`
      html[data-answer-preview="1"] canvas:not(#game){opacity:0!important;pointer-events:none!important}
      #worldEventScreen .choice-head,#worldEventScreen #worldEventCards{position:relative;z-index:3}
      #worldEventScreen[data-answer-threat]{transition:background .34s ease,filter .34s ease}
      #worldEventScreen[data-answer-threat] .world-event-shell{transition:border-color .34s ease,box-shadow .34s ease,filter .34s ease,background .34s ease}
      #answerThreatVisual{position:absolute;inset:-15%;z-index:1;pointer-events:none;overflow:visible;opacity:0;mix-blend-mode:screen;transition:opacity .28s ease}
      #answerThreatVisual .answer-threat-haze{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 20%,rgba(255,255,255,.26) 0,rgba(226,238,255,.11) 20%,rgba(154,126,255,.055) 46%,transparent 70%);filter:blur(18px)}
      #answerThreatVisual .answer-threat-spill{position:absolute;left:50%;top:-22%;width:46%;height:154%;transform-origin:50% 14%;border-radius:50%;background:radial-gradient(ellipse at 50% 8%,rgba(255,255,255,.42) 0,rgba(237,245,255,.18) 20%,rgba(205,224,255,.055) 48%,transparent 74%);filter:blur(22px)}
      #answerThreatVisual .s1{transform:translateX(-50%) rotate(2deg)}#answerThreatVisual .s2{left:31%;width:34%;opacity:.62;transform:translateX(-50%) rotate(-19deg)}#answerThreatVisual .s3{left:69%;width:35%;opacity:.58;transform:translateX(-50%) rotate(20deg)}
      #answerThreatVisual .answer-threat-slit{position:absolute;left:49.72%;top:-2%;width:.58%;height:108%;background:linear-gradient(180deg,rgba(255,255,255,.99),rgba(255,255,255,.92) 28%,rgba(238,247,255,.62) 72%,rgba(224,238,255,.12));filter:blur(.8px);box-shadow:0 0 10px #fff,0 0 30px rgba(230,240,255,.72),0 0 76px rgba(194,214,255,.34);clip-path:polygon(25% 0,80% 8%,36% 19%,72% 31%,30% 43%,74% 55%,28% 68%,69% 81%,40% 100%,8% 88%,34% 72%,5% 58%,31% 44%,9% 30%,37% 16%,12% 7%)}
      #answerThreatVisual .answer-threat-crack{position:absolute;height:1px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.86) 34%,rgba(255,255,255,.38) 75%,rgba(255,255,255,0));filter:blur(.25px);box-shadow:0 0 8px rgba(255,255,255,.72);transform-origin:left center}
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
  function ensureThreatVisual(){const shell=document.querySelector('#worldEventScreen .world-event-shell');if(!shell)return null;let visual=shell.querySelector('#answerThreatVisual');if(visual)return visual;visual=document.createElement('div');visual.id='answerThreatVisual';visual.setAttribute('aria-hidden','true');visual.innerHTML='<span class="answer-threat-haze"></span><span class="answer-threat-spill s1"></span><span class="answer-threat-spill s2"></span><span class="answer-threat-spill s3"></span><span class="answer-threat-slit"></span><span class="answer-threat-crack c1"></span><span class="answer-threat-crack c2"></span><span class="answer-threat-crack c3"></span><span class="answer-threat-crack c4"></span>';shell.appendChild(visual);return visual;}
  function resetThreatVisual(overlay,shell,visual){delete overlay.dataset.answerThreat;if(visual){visual.style.opacity='0';visual.dataset.band='0';}overlay.style.removeProperty('background');overlay.style.removeProperty('filter');shell?.style.removeProperty('border-color');shell?.style.removeProperty('box-shadow');shell?.style.removeProperty('filter');shell?.style.removeProperty('background');}
"""
    s=s[:start]+threat+s[end:]

    old_sync="const p=band/100,opacity={25:.20,50:.42,75:.70,100:1}[band]||0;overlay.dataset.answerThreat=String(band);visual.dataset.band=String(band);visual.style.opacity=String(opacity);overlay.style.background=`radial-gradient(ellipse at 50% 42%,rgba(206,211,255,${.06+p*.28}),rgba(103,43,172,${.24+p*.16}) 31%,rgba(0,1,8,.985) 72%)`;shell.style.borderColor=`rgba(247,247,255,${.20+p*.64})`;shell.style.boxShadow=`0 36px 128px rgba(0,0,0,.76),inset 0 0 ${90+Math.round(p*80)}px rgba(209,220,255,${.05+p*.15}),0 0 ${24+Math.round(p*72)}px rgba(244,247,255,${.03+p*.18})`;shell.style.filter=band>=75?`saturate(${1-p*.22}) brightness(${1+p*.08})`:'none';"
    new_sync="const p=band/100,opacity={25:.16,50:.34,75:.58,100:.82}[band]||0;overlay.dataset.answerThreat=String(band);visual.dataset.band=String(band);visual.style.opacity=String(opacity);overlay.style.background=`radial-gradient(ellipse at 50% 38%,rgba(224,232,255,${.025+p*.12}),rgba(91,38,150,${.28-p*.08}) 34%,rgba(0,1,8,.988) 73%)`;overlay.style.filter=band>=75?`saturate(${1-p*.12})`:'none';shell.style.borderColor=`rgba(239,243,255,${.16+p*.48})`;shell.style.boxShadow=`0 36px 128px rgba(0,0,0,.78),inset 0 0 ${72+Math.round(p*78)}px rgba(218,229,255,${.025+p*.09}),0 0 ${20+Math.round(p*54)}px rgba(241,246,255,${.02+p*.10})`;shell.style.filter=band>=75?`saturate(${1-p*.18}) brightness(${1+p*.045})`:'none';shell.style.background=`radial-gradient(ellipse at 50% 6%,rgba(232,240,255,${.015+p*.055}),transparent 40%),radial-gradient(circle at 50% 0%,rgba(128,56,186,${.18-p*.05}),transparent 44%),linear-gradient(155deg,rgba(19,5,42,.97),rgba(2,2,13,.99))`;"
    if old_sync not in s: raise SystemExit('threat sync anchor missing')
    s=s.replace(old_sync,new_sync,1)

    s=s.replace("button('응답 시안 시작','devAnswerStart',()=>activate(),true)","button('응답 시안 시작','devAnswerStart',()=>activate(),true)",1)
    s=s.replace("Object.assign(dev,{startAnswerPrototype:activate,","Object.assign(dev,{startAnswerPrototype:activate,prepareAnswerPrototype:beginPreparation,",1)
    s=s.replace("answerPrototypeSnapshot:()=>({active:preview.active,","answerPrototypeSnapshot:()=>({active:preview.active,preparing:preview.preparing,preflightGemCount:preview.preflightGemCount,preflightXp:preview.preflightXp,",1)
    s=s.replace("window.stackfallVoidApexAnswerDiagnostics=()=>({version:'v1',prototypeOnly:true,active:preview.active,","window.stackfallVoidApexAnswerDiagnostics=()=>({version:'v1',prototypeOnly:true,active:preview.active,preparing:preview.preparing,preflightGemCount:preview.preflightGemCount,preflightXp:preview.preflightXp,",1)

    path.write_text(s)

contract=Path('scripts/void-apex-answer-contract.mjs')
contract.write_text("""import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const answer=read('src/void-apex-answer-v1.js');
const buildInfo=read('src/build-info.js');
const fingerprint=read('scripts/build-fingerprint.mjs');
const catalog=read('src/boss-catalog.js');
const events=read('src/map-event-expansion.js');
const checks=[
  ['prototype is explicitly dormant from live scheduling',answer.includes('STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true')&&!events.includes('void-apex-answer')&&!catalog.includes("'answer'")],
  ['prototype freezes progression and visible game time during preparation and combat',answer.includes('preview.active||preview.preparing||basePause()')&&answer.includes('if(preview.active||preview.preparing)state.time=Math.max(0')],
  ['prototype suppresses ordinary spawns and map-event updates during preparation and combat',answer.includes('if(preview.active||preview.preparing)return;return baseUpdateSpawning')&&answer.includes('if(preview.active||preview.preparing)return;return baseUpdateMapEvents')],
  ['fixed arena camera keeps player world coordinates authoritative',answer.includes('cameraOffset()')&&answer.includes('withFixedArenaCamera')&&answer.includes('ctx.translate(offset.x,offset.y)')&&!answer.includes('preview.realX=player.x')],
  ['player movement is bounded to the lower combat region',answer.includes('clampPlayerToArena')&&answer.includes('top:height*.40')&&answer.includes('bottom:height*.925')],
  ['Answer owns cosmic mantle asymmetric tendrils and fissure illumination',answer.includes('drawMantle')&&answer.includes('TENDRILS=[')&&answer.includes('drawMantleReflections')&&answer.includes('drawSoftFissureBeam')&&answer.includes('drawCoreTear')],
  ['fissure light uses soft blurred volumetric spill rather than hard polygon rays',answer.includes('ctx.filter=`blur(${blur}px)`')&&answer.includes('quadraticCurveTo(length*.31')&&!answer.includes('.answer-threat-ray')],
  ['three visual phases change both boss and surrounding sky',answer.includes("button('P1 · 관측'")&&answer.includes("button('P2 · 침식'")&&answer.includes("button('P3 · 노출'")&&answer.includes('drawPhaseSky')],
  ['Void entry threat presentation supports 25 50 75 and 100 percent bands',answer.includes('data-band="25"')&&answer.includes('data-band="50"')&&answer.includes('data-band="75"')&&answer.includes('data-band="100"')&&answer.includes('setAnswerThreat')],
  ['entry threat changes shell cards and soft light spill, not only a white overlay',answer.includes('.answer-threat-spill')&&answer.includes('world-event-card{filter:saturate(.70)')&&answer.includes('shell.style.background=')],
  ['pre-fight preparation uses the canonical suction magnet path',answer.includes("typeof window.stackfallCollectSuctionMagnet==='function'")&&answer.includes('preview.preflightGemCount')&&answer.includes('preview.preflightXp')],
  ['pre-fight preparation defers level choices until all field XP is physically collected',answer.includes('state.choiceLocked=true')&&answer.includes('activeExperienceGems().length')&&answer.includes('releasePreparationGate()')&&answer.includes('tryLevelUp()')],
  ['encounter begins only after all pending level ups are resolved',answer.includes("state.mode!=='playing'||state.choiceLocked||state.xp>=state.xpNeed")&&answer.includes('activatePreparedEncounter()')],
  ['defeat sequence leaks white light then leaves brighter aftermath state',answer.includes('startDefeat')&&answer.includes('finishDefeat')&&answer.includes('drawAftermathOverlay')&&answer.includes('state.answerVoidSealed=true')],
  ['developer preview controls are isolated to dev mode',answer.includes("document.querySelector('#stackfallDevPanel')")&&answer.includes('if(!dev?.enabled||!panel')],
  ['dynamic loader includes the prototype',buildInfo.includes('src/void-apex-answer-v1.js')&&buildInfo.includes('data-void-apex-answer-v1')],
  ['build fingerprint tracks the prototype and its contract',fingerprint.includes("'src/void-apex-answer-v1.js'")&&fingerprint.includes("'void-apex-answer-contract.mjs'")]
];
let failed=0;
for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}
console.log(`Checked ${checks.length} Void Apex Answer prototype contracts; failures=${failed}`);
if(failed)process.exit(1);
""")
print('Applied Answer V4 lighting and preflight XP gate')
