// Void Apex visual/arena prototype: THE ANSWER / 응답.
// This pass is intentionally dev-preview only. Live Void Rift eligibility, combat patterns,
// rewards and production encounter scheduling remain separate work.
(()=>{
  'use strict';
  if(window.stackfallVoidApexAnswer==='v1')return;
  window.stackfallVoidApexAnswer='v1';
  window.STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true;

  const TAU_LOCAL=Math.PI*2;
  const preview={
    active:false,rendering:false,phase:1,hpRatio:1,defeating:false,defeatAge:0,
    camX:0,camY:0,realX:0,realY:0,aftermath:false,startedAt:0
  };
  const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
  const easeOut=t=>1-Math.pow(1-clamp01(t),3);
  const easeInOut=t=>{t=clamp01(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const language=()=>GAME_SETTINGS?.language||'ko';
  const answerName=()=>language()==='ko'?'응답':'THE ANSWER';
  const phaseRatio=phase=>phase===1?1:phase===2?.63:.29;
  const nowSeconds=()=>Number(state?.time)||0;

  function geometry(){
    const width=Math.max(720,Number(vw)||1280),height=Math.max(520,Number(vh)||720);
    return{
      cx:width*.5,
      bossY:height*.175,
      bossScale:Math.min(width*.34,height*.43),
      arenaCx:width*.5,
      arenaCy:height*.675,
      arenaRx:Math.min(width*.455,690),
      arenaRy:Math.min(height*.315,285),
      left:width*.075,right:width*.925,top:height*.365,bottom:height*.915
    };
  }
  function worldBounds(){
    const g=geometry(),margin=Math.max(18,Number(player?.r)||14);
    return{
      minX:preview.camX+(g.left-vw/2)+margin,
      maxX:preview.camX+(g.right-vw/2)-margin,
      minY:preview.camY+(g.top-vh/2)+margin,
      maxY:preview.camY+(g.bottom-vh/2)-margin
    };
  }
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
    state.mapEventActive=null;state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;state.apexArena=null;state.apexExitPending=false;
  }
  function syncBossHud(){
    const bar=document.querySelector('#bossBar'),name=document.querySelector('#bossName'),fill=document.querySelector('#bossHpBar'),extras=document.querySelector('#bossBarExtras');
    if(!bar)return;
    if(!preview.active){bar.classList.add('hidden');if(extras)extras.textContent='';return;}
    bar.classList.remove('hidden');
    if(name)name.textContent=answerName();
    if(fill)fill.style.width=`${Math.max(0,Math.min(100,preview.hpRatio*100))}%`;
    if(extras)extras.textContent='';
  }
  function setPhase(phase){
    if(!preview.active)return false;
    preview.phase=Math.max(1,Math.min(3,Math.floor(Number(phase)||1)));
    preview.hpRatio=phaseRatio(preview.phase);
    preview.defeating=false;preview.defeatAge=0;
    syncBossHud();
    state.camera.shake=Math.max(Number(state.camera.shake)||0,2.5+preview.phase*1.4);
    return true;
  }
  function activate(){
    if(state.mode!=='playing'){
      const started=window.stackfallDeveloperTest?.startEndless?.();
      if(started===false&&state.mode!=='playing')return false;
    }
    if(state.mode!=='playing')return false;
    clearHostileField();
    preview.active=true;preview.rendering=false;preview.phase=1;preview.hpRatio=1;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;preview.startedAt=performance.now();
    preview.camX=player.x;
    preview.camY=player.y-(Number(vh)||720)*.20;
    state.answerVoidApexPreview=true;state.answerVoidSealed=false;
    player.x=preview.camX;player.y=preview.camY+(Number(vh)||720)*.20;
    player.invuln=Math.max(Number(player.invuln)||0,1.2);
    clampPlayerToArena();syncBossHud();
    state.camera.shake=Math.max(Number(state.camera.shake)||0,5);
    state.flash=Math.max(Number(state.flash)||0,.035);
    try{audio?.tone?.(42,.34,'sawtooth',.022,-8);}catch{}
    return true;
  }
  function stop({keepAftermath=false}={}){
    preview.active=false;preview.rendering=false;preview.defeating=false;preview.defeatAge=0;
    preview.aftermath=keepAftermath===true;
    state.answerVoidApexPreview=false;
    syncBossHud();
    return true;
  }
  function startDefeat(){
    if(!preview.active||preview.defeating)return false;
    preview.defeating=true;preview.defeatAge=0;preview.hpRatio=0;
    player.invuln=Math.max(Number(player.invuln)||0,4);
    state.camera.shake=Math.max(Number(state.camera.shake)||0,5.5);
    try{audio?.tone?.(52,.52,'sine',.022,18);}catch{}
    syncBossHud();return true;
  }
  function finishDefeat(){
    state.answerVoidSealed=true;
    preview.active=false;preview.rendering=false;preview.defeating=false;preview.aftermath=true;
    state.answerVoidApexPreview=false;
    state.camera.shake=Math.max(Number(state.camera.shake)||0,14);
    state.flash=Math.max(Number(state.flash)||0,.34);
    try{audio?.tone?.(36,.48,'sawtooth',.045,-16);audio?.tone?.(92,.26,'sine',.028,-30);}catch{}
    syncBossHud();
  }
  function updatePrototype(dt){
    if(!preview.active)return;
    clampPlayerToArena();
    if(preview.defeating){
      preview.defeatAge+=Math.max(0,Number(dt)||0);
      if(preview.defeatAge>=2.85)finishDefeat();
    }
    syncBossHud();
  }

  function cosmicGradient(x0,y0,x1,y1){
    const g=ctx.createLinearGradient(x0,y0,x1,y1);
    g.addColorStop(0,'#030617');g.addColorStop(.20,'#101545');g.addColorStop(.43,'#27156a');g.addColorStop(.62,'#122f6d');g.addColorStop(.80,'#4d1e83');g.addColorStop(1,'#050718');
    return g;
  }
  function drawCosmicSpecks(cx,cy,rx,ry,alpha=1){
    ctx.save();ctx.globalAlpha*=alpha;
    for(let i=0;i<34;i++){
      const a=(i*2.399963229728653)+(preview.phase*.09),rr=.18+((i*37)%73)/100;
      const x=cx+Math.cos(a)*rx*rr,y=cy+Math.sin(a*1.17)*ry*rr*.82;
      const r=i%9===0?1.9:i%4===0?1.25:.72;
      ctx.fillStyle=i%7===0?'#8fd9ff':i%5===0?'#d88cff':'#ffffff';
      ctx.globalAlpha=(.18+(i%6)*.075)*alpha;ctx.beginPath();ctx.arc(x,y,r,0,TAU_LOCAL);ctx.fill();
    }
    ctx.restore();
  }
  function tentaclePath(index,cx,cy,s){
    const side=index<3?-1:1,slot=index%3;
    const baseX=cx+side*s*(.18+slot*.19),baseY=cy+s*(.03+slot*.035);
    const endX=cx+side*s*(1.16+slot*.18),endY=cy+s*(.36+slot*.25);
    const bend=side*s*(.34+slot*.08),lift=s*(slot===0?-.12:.05+slot*.08);
    ctx.beginPath();ctx.moveTo(baseX,baseY);
    ctx.bezierCurveTo(baseX+bend,baseY+lift,cx+side*s*(.72+slot*.15),cy+s*(.22+slot*.18),endX,endY);
  }
  function drawTentacles(cx,cy,s,phase,death){
    const count=6;
    for(let i=0;i<count;i++){
      const pulse=Math.sin(nowSeconds()*1.35+i*1.11)*s*.018;
      ctx.save();ctx.translate(0,pulse);
      tentaclePath(i,cx,cy,s);
      ctx.lineCap='round';ctx.strokeStyle='#02030d';ctx.lineWidth=s*(.18+(i%3)*.015);ctx.globalAlpha=.96-death*.62;ctx.stroke();
      tentaclePath(i,cx,cy,s);
      ctx.strokeStyle=cosmicGradient(cx-s,cy-s*.3,cx+s,cy+s*.7);ctx.lineWidth=s*(.125+(i%3)*.012);ctx.shadowColor='#5733b6';ctx.shadowBlur=phase>=2?14:8;ctx.stroke();ctx.shadowBlur=0;
      tentaclePath(i,cx,cy,s);
      ctx.strokeStyle=i%2?'rgba(139,105,255,.42)':'rgba(79,182,255,.34)';ctx.lineWidth=s*.022;ctx.globalAlpha=.48+phase*.07;ctx.stroke();
      ctx.restore();
    }
  }
  function shellPath(cx,cy,s,phase,death){
    const pts=20,open=phase===3?.12:phase===2?.045:0;
    ctx.beginPath();
    for(let i=0;i<pts;i++){
      const a=-Math.PI/2+i/pts*TAU_LOCAL;
      const jag=1+Math.sin(i*2.7+phase*.8)*.055+((i%3)-1)*.018;
      const rx=s*(.76+open*Math.cos(a*2)),ry=s*(.52+open*.55*Math.sin(a*3));
      const burst=death*death*s*.34;
      const x=cx+Math.cos(a)*(rx*jag+burst*(.15+((i*13)%7)/10));
      const y=cy+Math.sin(a)*(ry*jag+burst*(.10+((i*11)%5)/10));
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();
  }
  function drawShell(cx,cy,s,phase,death){
    ctx.save();
    shellPath(cx,cy,s,phase,death);ctx.clip();
    ctx.fillStyle=cosmicGradient(cx-s,cy-s*.7,cx+s,cy+s*.6);ctx.fillRect(cx-s*1.15,cy-s*.8,s*2.3,s*1.65);
    const nebula=ctx.createRadialGradient(cx-s*.25,cy-s*.12,2,cx-s*.06,cy+s*.02,s*.80);
    nebula.addColorStop(0,'rgba(76,210,255,.22)');nebula.addColorStop(.34,'rgba(135,69,255,.13)');nebula.addColorStop(.68,'rgba(219,61,255,.10)');nebula.addColorStop(1,'rgba(2,4,15,0)');ctx.fillStyle=nebula;ctx.fillRect(cx-s,cy-s*.7,s*2,s*1.4);
    drawCosmicSpecks(cx,cy,s*.72,s*.47,1-death*.72);
    ctx.restore();
    ctx.save();shellPath(cx,cy,s,phase,death);ctx.strokeStyle=phase>=3?'rgba(219,224,255,.56)':'rgba(121,101,225,.58)';ctx.lineWidth=Math.max(2,s*.018);ctx.globalAlpha=1-death*.55;ctx.stroke();ctx.restore();
  }
  const CRACKS=[
    [[0,-.29],[-.03,-.14],[.02,-.04],[-.035,.08],[.02,.22]],
    [[-.02,-.06],[-.18,-.13],[-.31,-.22],[-.46,-.19]],
    [[.01,-.02],[.19,-.12],[.34,-.18],[.50,-.12]],
    [[-.035,.08],[-.20,.18],[-.32,.29]],
    [[.02,.12],[.18,.22],[.30,.34],[.43,.31]],
    [[-.15,-.13],[-.22,-.30],[-.18,-.43]],
    [[.20,-.12],[.26,-.29],[.38,-.39]],
    [[-.20,.18],[-.42,.13],[-.57,.21]],
    [[.18,.22],[.39,.17],[.58,.24]]
  ];
  function drawCracks(cx,cy,s,phase,death){
    const count=phase===1?4:phase===2?7:CRACKS.length,whiteBloom=1+phase*.36+death*4.2;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='#ffffff';ctx.shadowBlur=s*(.028*whiteBloom);
    for(let i=0;i<count;i++){
      const points=CRACKS[i];ctx.beginPath();
      points.forEach((p,j)=>{const x=cx+p[0]*s,y=cy+p[1]*s;(j?ctx.lineTo(x,y):ctx.moveTo(x,y));});
      ctx.strokeStyle=i%3===0?'#ffffff':'#f4f7ff';ctx.globalAlpha=Math.min(1,.64+phase*.10+death*.50);ctx.lineWidth=s*(i<3?.020:.012)*(1+death*.9);ctx.stroke();
    }
    ctx.restore();
  }
  function drawCoreTear(cx,cy,s,phase,death){
    const open=.72+phase*.13+death*2.5,pulse=1+Math.sin(nowSeconds()*3.1)*.035;
    ctx.save();ctx.translate(cx,cy);ctx.scale(open*pulse,open*pulse);
    ctx.shadowColor='#ffffff';ctx.shadowBlur=s*(.10+phase*.032+death*.22);ctx.fillStyle='#ffffff';
    ctx.beginPath();ctx.moveTo(-s*.055,-s*.27);ctx.lineTo(s*.030,-s*.14);ctx.lineTo(-s*.018,-s*.045);ctx.lineTo(s*.060,s*.055);ctx.lineTo(s*.008,s*.25);ctx.lineTo(-s*.075,s*.12);ctx.lineTo(-s*.040,s*.015);ctx.lineTo(-s*.098,-s*.09);ctx.closePath();ctx.fill();
    ctx.shadowBlur=s*(.20+death*.30);ctx.globalAlpha=.22+phase*.08+death*.52;ctx.fillStyle='#cbd8ff';ctx.beginPath();ctx.ellipse(0,0,s*(.20+death*.32),s*(.30+death*.38),-.08,0,TAU_LOCAL);ctx.fill();ctx.restore();
  }
  function drawFragments(cx,cy,s,phase,death){
    const count=phase===1?7:phase===2?11:16;
    for(let i=0;i<count;i++){
      const a=i/count*TAU_LOCAL+(i%3)*.21,base=s*(.72+(i%5)*.08),fly=death*death*s*(.35+(i%4)*.13),x=cx+Math.cos(a)*(base+fly),y=cy+Math.sin(a)*(base*.63+fly*.72),r=s*(.025+(i%4)*.008);
      ctx.save();ctx.translate(x,y);ctx.rotate(a+nowSeconds()*.09*(i%2?1:-1));ctx.globalAlpha=Math.max(0,.65-death*.46);ctx.fillStyle=i%3===0?'#28155c':'#080b20';ctx.strokeStyle=i%4===0?'#ffffff':'#6657b5';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.72,r*.58);ctx.lineTo(-r*.56,r*.76);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
  }
  function drawAnswerBoss(){
    const g=geometry(),phase=preview.phase,death=preview.defeating?clamp01(preview.defeatAge/2.85):0,s=g.bossScale,cx=g.cx,cy=g.bossY+s*.07;
    ctx.save();
    const aura=ctx.createRadialGradient(cx,cy,s*.06,cx,cy,s*1.28);aura.addColorStop(0,`rgba(255,255,255,${.09+phase*.025+death*.34})`);aura.addColorStop(.30,`rgba(117,87,255,${.08+phase*.018})`);aura.addColorStop(1,'rgba(18,7,60,0)');ctx.fillStyle=aura;ctx.fillRect(cx-s*1.5,cy-s,3*s,2*s);
    drawTentacles(cx,cy,s,phase,death);drawFragments(cx,cy,s,phase,death);drawShell(cx,cy,s,phase,death);drawCracks(cx,cy,s,phase,death);drawCoreTear(cx,cy,s,phase,death);
    if(death>.20){ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp01((death-.20)/.65)*.72;const bloom=ctx.createRadialGradient(cx,cy,0,cx,cy,s*(.25+death*.78));bloom.addColorStop(0,'#ffffff');bloom.addColorStop(.32,'rgba(255,255,255,.82)');bloom.addColorStop(1,'rgba(210,224,255,0)');ctx.fillStyle=bloom;ctx.fillRect(cx-s*1.3,cy-s*1.2,s*2.6,s*2.4);}
    if(death>.76){ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp01((death-.76)/.19)*.94;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,vw,vh);}
    ctx.restore();
  }
  function drawArenaFloor(){
    const g=geometry(),phase=preview.phase;
    ctx.save();
    ctx.beginPath();ctx.ellipse(g.arenaCx,g.arenaCy,g.arenaRx,g.arenaRy,0,0,TAU_LOCAL);ctx.clip();
    const floor=ctx.createRadialGradient(g.arenaCx,g.arenaCy*.98,12,g.arenaCx,g.arenaCy,g.arenaRx);floor.addColorStop(0,'rgba(27,29,78,.82)');floor.addColorStop(.40,'rgba(16,13,54,.78)');floor.addColorStop(.78,'rgba(8,7,27,.90)');floor.addColorStop(1,'rgba(1,2,10,.98)');ctx.fillStyle=floor;ctx.fillRect(g.arenaCx-g.arenaRx,g.arenaCy-g.arenaRy,g.arenaRx*2,g.arenaRy*2);
    ctx.globalAlpha=.15+phase*.018;ctx.strokeStyle='#8a71e5';ctx.lineWidth=1;
    for(let ring=1;ring<=5;ring++){ctx.beginPath();ctx.ellipse(g.arenaCx,g.arenaCy,g.arenaRx*(ring/5),g.arenaRy*(ring/5),0,0,TAU_LOCAL);ctx.stroke();}
    for(let i=0;i<12;i++){const a=i/12*TAU_LOCAL;ctx.beginPath();ctx.moveTo(g.arenaCx,g.arenaCy);ctx.lineTo(g.arenaCx+Math.cos(a)*g.arenaRx,g.arenaCy+Math.sin(a)*g.arenaRy);ctx.stroke();}
    drawCosmicSpecks(g.arenaCx,g.arenaCy,g.arenaRx*.95,g.arenaRy*.92,.70);
    if(phase>=2){ctx.globalAlpha=.25+(phase-2)*.10;ctx.strokeStyle='#f6f7ff';ctx.lineWidth=1.3;for(let i=0;i<phase+2;i++){const x=g.arenaCx+Math.sin(i*2.2+nowSeconds()*.05)*g.arenaRx*.58,y=g.arenaCy+Math.cos(i*1.7)*g.arenaRy*.48;ctx.beginPath();ctx.moveTo(x-42,y-12);ctx.lineTo(x-12,y+2);ctx.lineTo(x+8,y-8);ctx.lineTo(x+34,y+14);ctx.stroke();}}
    ctx.restore();
  }
  function drawArenaBoundary(){
    const g=geometry(),pulse=.55+.18*Math.sin(nowSeconds()*2.1);
    ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowColor='#e8ecff';ctx.shadowBlur=10+preview.phase*3;ctx.strokeStyle=`rgba(238,241,255,${pulse})`;ctx.lineWidth=1.8+preview.phase*.35;ctx.beginPath();ctx.ellipse(g.arenaCx,g.arenaCy,g.arenaRx,g.arenaRy,0,0,TAU_LOCAL);ctx.stroke();
    ctx.shadowBlur=0;ctx.setLineDash([18,22]);ctx.globalAlpha=.18+preview.phase*.05;ctx.strokeStyle='#7964ff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(g.arenaCx,g.arenaCy,g.arenaRx-7,g.arenaRy-5,0,0,TAU_LOCAL);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }
  function drawPrototypeBackground(){drawArenaFloor();drawAnswerBoss();}
  function drawAftermathOverlay(){
    if(!preview.aftermath)return;
    ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='screen';
    const g=ctx.createRadialGradient(vw*.5,vh*.48,20,vw*.5,vh*.52,Math.max(vw,vh)*.82);g.addColorStop(0,'rgba(205,224,255,.085)');g.addColorStop(.52,'rgba(104,151,255,.040)');g.addColorStop(1,'rgba(255,255,255,.012)');ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);ctx.restore();
  }

  const basePause=typeof isApexProgressionClockPaused==='function'?isApexProgressionClockPaused:null;
  if(basePause)isApexProgressionClockPaused=function isProgressionPausedForAnswer(){return preview.active||basePause();};

  const baseUpdateSpawning=typeof updateSpawning==='function'?updateSpawning:null;
  if(baseUpdateSpawning)updateSpawning=function updateSpawningWithAnswerPrototype(dt){if(preview.active)return;return baseUpdateSpawning(dt);};
  const baseUpdateMapEvents=typeof updateMapEvents==='function'?updateMapEvents:null;
  if(baseUpdateMapEvents)updateMapEvents=function updateMapEventsWithAnswerPrototype(dt){if(preview.active)return;return baseUpdateMapEvents(dt);};
  const baseUpdatePlayer=typeof updatePlayer==='function'?updatePlayer:null;
  if(baseUpdatePlayer)updatePlayer=function updatePlayerInAnswerArena(dt){const result=baseUpdatePlayer(dt);updatePrototype(dt);return result;};
  const baseUpdateHud=typeof updateHUD==='function'?updateHUD:null;
  if(baseUpdateHud)updateHUD=function updateHudWithAnswerPrototype(){const result=baseUpdateHud();if(preview.active)syncBossHud();return result;};

  const baseDrawBackground=typeof drawBackground==='function'?drawBackground:null;
  if(baseDrawBackground)drawBackground=function drawBackgroundWithAnswerArena(){const result=baseDrawBackground();if(preview.rendering)drawPrototypeBackground();return result;};
  const baseDrawEffects=typeof drawEffects==='function'?drawEffects:null;
  if(baseDrawEffects)drawEffects=function drawEffectsWithAnswerBoundary(){const result=baseDrawEffects();if(preview.rendering)drawArenaBoundary();return result;};
  const baseDrawPlayer=typeof drawPlayer==='function'?drawPlayer:null;
  if(baseDrawPlayer)drawPlayer=function drawPlayerWithAnswerCamera(){
    if(!preview.rendering)return baseDrawPlayer();
    const spoofX=player.x,spoofY=player.y;ctx.save();ctx.translate(preview.realX-preview.camX,preview.realY-preview.camY);player.x=preview.realX;player.y=preview.realY;
    try{return baseDrawPlayer();}finally{player.x=spoofX;player.y=spoofY;ctx.restore();}
  };
  const baseDraw=typeof draw==='function'?draw:null;
  if(baseDraw)draw=function drawWithAnswerArenaCamera(){
    if(!preview.active){const result=baseDraw();drawAftermathOverlay();return result;}
    preview.realX=player.x;preview.realY=player.y;preview.rendering=true;player.x=preview.camX;player.y=preview.camY;
    try{return baseDraw();}finally{player.x=preview.realX;player.y=preview.realY;preview.rendering=false;}
  };

  if(typeof registerResetGameInterceptor==='function')registerResetGameInterceptor('void-apex-answer-v1:reset',function resetAnswerPrototype(next,...args){preview.active=false;preview.rendering=false;preview.aftermath=false;preview.defeating=false;state.answerVoidApexPreview=false;state.answerVoidSealed=false;return next(...args);});

  function installDevControls(){
    const dev=window.stackfallDeveloperTest,panel=document.querySelector('#stackfallDevPanel');if(!dev?.enabled||!panel||document.querySelector('#devAnswerPrototype'))return;
    const label=document.createElement('label');label.textContent='VOID APEX · 응답 디자인';
    const grid=document.createElement('div');grid.className='dev-grid';grid.id='devAnswerPrototype';
    const button=(text,id,handler,wide=false)=>{const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;if(wide)b.className='dev-wide';b.addEventListener('click',handler);return b;};
    grid.append(
      button('응답 시안 시작','devAnswerStart',()=>activate(),true),
      button('P1 · 외피 안정','devAnswerP1',()=>setPhase(1)),
      button('P2 · 균열 확장','devAnswerP2',()=>setPhase(2)),
      button('P3 · 백색광 노출','devAnswerP3',()=>setPhase(3)),
      button('격파 연출','devAnswerDefeat',()=>startDefeat()),
      button('시안 종료','devAnswerStop',()=>stop({keepAftermath:false}),true)
    );
    panel.append(label,grid);
    Object.assign(dev,{startAnswerPrototype:activate,setAnswerPhase:setPhase,defeatAnswerPrototype:startDefeat,stopAnswerPrototype:()=>stop({keepAftermath:false}),answerPrototypeSnapshot:()=>({active:preview.active,phase:preview.phase,hpRatio:preview.hpRatio,defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,camera:{x:preview.camX,y:preview.camY},bounds:preview.active?worldBounds():null})});
  }
  installDevControls();
  setTimeout(installDevControls,0);

  window.stackfallVoidApexAnswerDiagnostics=()=>({version:'v1',prototypeOnly:true,active:preview.active,phase:preview.phase,hpRatio:preview.hpRatio,defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,camera:{x:preview.camX,y:preview.camY},geometry:geometry()});
})();
