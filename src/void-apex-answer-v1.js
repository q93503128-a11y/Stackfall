// Void Apex visual/arena prototype: THE ANSWER / 응답.
// Dev-preview only: live Void Rift eligibility, combat patterns, rewards and encounter scheduling
// remain intentionally disconnected until the visual direction is approved.
(()=>{
  'use strict';
  if(window.stackfallVoidApexAnswer==='v1')return;
  window.stackfallVoidApexAnswer='v1';
  window.STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true;

  const TAU_LOCAL=Math.PI*2;
  const preview={active:false,phase:1,hpRatio:1,defeating:false,defeatAge:0,camX:0,camY:0,aftermath:false,runSerial:null,threat:0,lastFrameAt:performance.now()};
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const language=()=>GAME_SETTINGS?.language||'ko';
  const answerName=()=>language()==='ko'?'응답':'THE ANSWER';
  const phaseRatio=phase=>phase===1?1:phase===2?.63:.29;
  const nowSeconds=()=>Number(state?.time)||0;
  const threatBand=value=>value>=100?100:value>=75?75:value>=50?50:value>=25?25:0;

  function geometry(){
    const width=Math.max(720,Number(vw)||1280),height=Math.max(520,Number(vh)||720),scale=Math.min(width*.43,height*.54);
    return{cx:width*.5,bossY:height*.045,bossScale:scale,arenaCx:width*.5,arenaCy:height*.705,arenaRx:Math.min(width*.455,720),arenaRy:Math.min(height*.285,270),left:width*.07,right:width*.93,top:height*.40,bottom:height*.925};
  }
  function worldBounds(){
    const g=geometry(),margin=Math.max(20,Number(player?.r)||14);
    return{minX:preview.camX+(g.left-vw/2)+margin,maxX:preview.camX+(g.right-vw/2)-margin,minY:preview.camY+(g.top-vh/2)+margin,maxY:preview.camY+(g.bottom-vh/2)-margin};
  }
  function cameraOffset(){return{x:player.x-preview.camX,y:player.y-preview.camY};}
  function clearPreviewState(){
    preview.active=false;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;preview.runSerial=null;
    state.answerVoidApexPreview=false;state.answerVoidSealed=false;document.documentElement.dataset.answerPreview='0';syncBossHud();
  }
  function ensureRunIdentity(){if(preview.runSerial!=null&&preview.runSerial!==state.runSerial)clearPreviewState();}
  function clampPlayerToArena(){
    if(!preview.active||!player)return;
    const b=worldBounds();player.x=Math.max(b.minX,Math.min(b.maxX,player.x));player.y=Math.max(b.minY,Math.min(b.maxY,player.y));
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
    bar.classList.remove('hidden');if(name)name.textContent=answerName();if(fill)fill.style.width=`${Math.max(0,Math.min(100,preview.hpRatio*100))}%`;if(extras)extras.textContent='';
  }
  function setPhase(phase){
    if(!preview.active)return false;
    preview.phase=Math.max(1,Math.min(3,Math.floor(Number(phase)||1)));preview.hpRatio=phaseRatio(preview.phase);preview.defeating=false;preview.defeatAge=0;syncBossHud();
    state.camera.shake=Math.max(Number(state.camera.shake)||0,2.4+preview.phase*1.5);return true;
  }
  function activate(){
    if(state.mode!=='playing')return false;
    clearHostileField();preview.active=true;preview.phase=1;preview.hpRatio=1;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;preview.runSerial=state.runSerial;
    preview.camX=player.x;preview.camY=player.y-(Number(vh)||720)*.205;state.answerVoidApexPreview=true;state.answerVoidSealed=false;document.documentElement.dataset.answerPreview='1';
    player.y=preview.camY+(Number(vh)||720)*.225;player.invuln=Math.max(Number(player.invuln)||0,1.2);clampPlayerToArena();syncBossHud();
    state.camera.shake=Math.max(Number(state.camera.shake)||0,5);state.flash=Math.max(Number(state.flash)||0,.035);
    try{audio?.tone?.(42,.34,'sawtooth',.022,-8);}catch{}
    return true;
  }
  function stop(){preview.active=false;preview.defeating=false;preview.defeatAge=0;preview.aftermath=false;state.answerVoidApexPreview=false;document.documentElement.dataset.answerPreview='0';syncBossHud();return true;}
  function startDefeat(){
    if(!preview.active||preview.defeating)return false;
    preview.defeating=true;preview.defeatAge=0;preview.hpRatio=0;player.invuln=Math.max(Number(player.invuln)||0,4);state.camera.shake=Math.max(Number(state.camera.shake)||0,5.5);
    try{audio?.tone?.(52,.52,'sine',.022,18);}catch{}
    syncBossHud();return true;
  }
  function finishDefeat(){
    state.answerVoidSealed=true;preview.active=false;preview.defeating=false;preview.aftermath=true;state.answerVoidApexPreview=false;document.documentElement.dataset.answerPreview='0';
    state.camera.shake=Math.max(Number(state.camera.shake)||0,14);state.flash=Math.max(Number(state.flash)||0,.34);
    try{audio?.tone?.(36,.48,'sawtooth',.045,-16);audio?.tone?.(92,.26,'sine',.028,-30);}catch{}
    syncBossHud();
  }
  function updatePrototype(dt){
    ensureRunIdentity();if(!preview.active)return;
    const step=Math.max(0,Number(dt)||0);state.time=Math.max(0,(Number(state.time)||0)-step);clampPlayerToArena();
    if(preview.defeating){preview.defeatAge+=step;if(preview.defeatAge>=3.15)finishDefeat();}syncBossHud();
  }

  function cosmicGradient(x0,y0,x1,y1,phase=preview.phase){
    const g=ctx.createLinearGradient(x0,y0,x1,y1);
    g.addColorStop(0,'#01040d');g.addColorStop(.14,'#09112d');g.addColorStop(.31,phase>=2?'#17355b':'#10284c');g.addColorStop(.49,'#35206f');g.addColorStop(.63,phase>=3?'#245987':'#183e73');g.addColorStop(.78,'#6a2b85');g.addColorStop(.91,'#171136');g.addColorStop(1,'#01030b');return g;
  }
  function seeded01(i,seed=0){return((Math.sin(i*91.133+seed*17.77)*43758.5453)%1+1)%1;}
  function drawCosmicSpecks(cx,cy,rx,ry,count=42,alpha=1,seed=0){
    ctx.save();
    for(let i=0;i<count;i++){const a=seeded01(i,seed)*TAU_LOCAL,rr=.10+seeded01(i+51,seed)*.90,x=cx+Math.cos(a)*rx*rr,y=cy+Math.sin(a)*ry*rr,r=seeded01(i+103,seed)>.90?1.7:seeded01(i+71,seed)>.68?1.05:.62;ctx.globalAlpha=(.14+seeded01(i+19,seed)*.55)*alpha;ctx.fillStyle=i%11===0?'#89dbff':i%7===0?'#e7a7ff':'#ffffff';ctx.beginPath();ctx.arc(x,y,r,0,TAU_LOCAL);ctx.fill();}
    ctx.restore();
  }

  function drawPhaseSky(){
    if(!preview.active)return;const phase=preview.phase,death=preview.defeating?clamp01(preview.defeatAge/3.15):0,t=performance.now()*.0001;
    ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
    const veil=ctx.createLinearGradient(0,0,0,vh);veil.addColorStop(0,phase===1?'rgba(8,4,28,.50)':phase===2?'rgba(10,5,31,.60)':'rgba(8,8,25,.54)');veil.addColorStop(.47,phase===1?'rgba(15,8,52,.24)':phase===2?'rgba(34,14,73,.30)':'rgba(70,75,105,.20)');veil.addColorStop(1,'rgba(1,2,8,.18)');ctx.fillStyle=veil;ctx.fillRect(0,0,vw,vh);
    ctx.globalCompositeOperation='screen';
    const glow=ctx.createRadialGradient(vw*.5,vh*.08,6,vw*.5,vh*.10,Math.max(vw,vh)*(.48+phase*.06));glow.addColorStop(0,`rgba(248,250,255,${.045+phase*.028+death*.25})`);glow.addColorStop(.28,`rgba(106,113,255,${.035+phase*.018})`);glow.addColorStop(.66,`rgba(141,46,210,${.025+phase*.014})`);glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,vw,vh*.72);
    const lines=phase===1?2:phase===2?5:9;ctx.lineCap='round';for(let i=0;i<lines;i++){const x=vw*(.10+seeded01(i,31)*.80),swing=Math.sin(t*(.45+i*.04)+i*2.1)*vw*.035;ctx.beginPath();ctx.moveTo(x,-30);ctx.bezierCurveTo(x+swing,vh*.18,x-swing*.8,vh*.36,x+swing*.25,vh*.55);ctx.strokeStyle=`rgba(247,249,255,${.035+phase*.025})`;ctx.lineWidth=phase===3?1.4:1;ctx.shadowColor='#ffffff';ctx.shadowBlur=phase===3?12:5;ctx.stroke();}
    ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';drawCosmicSpecks(vw*.5,vh*.28,vw*.53,vh*.31,phase===1?25:phase===2?34:46,.45+phase*.07,77);ctx.restore();
  }

  const TENDRILS=[
    {x:-.68,y:.02,c1x:-.86,c1y:.18,c2x:-1.02,c2y:.33,ex:-1.18,ey:.55,w:.105},
    {x:-.42,y:.10,c1x:-.55,c1y:.29,c2x:-.67,c2y:.48,ex:-.80,ey:.72,w:.083},
    {x:-.16,y:.17,c1x:-.20,c1y:.34,c2x:-.31,c2y:.55,ex:-.38,ey:.78,w:.058},
    {x:.21,y:.15,c1x:.28,c1y:.33,c2x:.40,c2y:.50,ex:.48,ey:.75,w:.064},
    {x:.48,y:.07,c1x:.66,c1y:.23,c2x:.79,c2y:.42,ex:.93,ey:.67,w:.090},
    {x:.72,y:-.01,c1x:.91,c1y:.12,c2x:1.04,c2y:.28,ex:1.22,ey:.49,w:.112}
  ];
  function tendrilPath(spec,cx,cy,s,offset=0){ctx.beginPath();ctx.moveTo(cx+(spec.x+offset)*s,cy+spec.y*s);ctx.bezierCurveTo(cx+(spec.c1x+offset)*s,cy+spec.c1y*s,cx+(spec.c2x+offset)*s,cy+spec.c2y*s,cx+(spec.ex+offset)*s,cy+spec.ey*s);}
  function drawTendrils(cx,cy,s,phase,death){
    TENDRILS.forEach((spec,i)=>{const sway=Math.sin(performance.now()*.00042+i*1.31)*.018,fade=Math.max(0,1-death*.84);ctx.save();ctx.lineCap='butt';ctx.lineJoin='round';tendrilPath(spec,cx,cy,s,sway);ctx.strokeStyle='rgba(0,1,8,.96)';ctx.globalAlpha=fade;ctx.lineWidth=s*(spec.w+.048);ctx.stroke();tendrilPath(spec,cx,cy,s,sway);ctx.strokeStyle=cosmicGradient(cx-s,cy,cx+s,cy+s);ctx.lineWidth=s*spec.w;ctx.shadowColor=phase>=2?'#7251da':'#283f8f';ctx.shadowBlur=phase>=2?14:8;ctx.stroke();ctx.shadowBlur=0;tendrilPath(spec,cx,cy,s,sway);ctx.strokeStyle=i%2?'rgba(151,103,255,.42)':'rgba(79,200,255,.34)';ctx.lineWidth=Math.max(1.2,s*.008);ctx.globalAlpha=(.38+phase*.07)*fade;ctx.stroke();const ex=cx+(spec.ex+sway)*s,ey=cy+spec.ey*s,a=Math.atan2(spec.ey-spec.c2y,spec.ex-spec.c2x);ctx.translate(ex,ey);ctx.rotate(a);ctx.globalAlpha=.82*fade;ctx.fillStyle='#050615';ctx.strokeStyle=phase===3?'#e8efff':'#5544a6';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(s*.085,0);ctx.lineTo(-s*.035,-s*.042);ctx.lineTo(-s*.012,0);ctx.lineTo(-s*.035,s*.042);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();});
  }
  function mantlePath(cx,cy,s,phase,death){
    const split=(phase-1)*s*.022+death*s*.12;ctx.beginPath();ctx.moveTo(cx-s*.88,cy-s*.18);ctx.bezierCurveTo(cx-s*.72,cy-s*.43,cx-s*.42,cy-s*.53,cx-s*.13,cy-s*.43-split);ctx.bezierCurveTo(cx-s*.06,cy-s*.50,cx-s*.015,cy-s*.36,cx,cy-s*.28-split*.2);ctx.bezierCurveTo(cx+s*.04,cy-s*.39,cx+s*.12,cy-s*.50-split,cx+s*.21,cy-s*.40);ctx.bezierCurveTo(cx+s*.48,cy-s*.48,cx+s*.76,cy-s*.35,cx+s*.91,cy-s*.14);ctx.bezierCurveTo(cx+s*.84,cy+s*.08,cx+s*.72,cy+s*.21,cx+s*.57,cy+s*.27);ctx.bezierCurveTo(cx+s*.35,cy+s*.36,cx+s*.19,cy+s*.29,cx+s*.08,cy+s*.36+split);ctx.bezierCurveTo(cx+s*.03,cy+s*.44,cx-s*.04,cy+s*.44,cx-s*.09,cy+s*.34+split);ctx.bezierCurveTo(cx-s*.23,cy+s*.27,cx-s*.42,cy+s*.35,cx-s*.61,cy+s*.23);ctx.bezierCurveTo(cx-s*.78,cy+s*.13,cx-s*.88,cy, cx-s*.88,cy-s*.18);ctx.closePath();
  }
  function drawMantle(cx,cy,s,phase,death){
    ctx.save();mantlePath(cx,cy,s,phase,death);ctx.clip();ctx.fillStyle=cosmicGradient(cx-s,cy-s*.5,cx+s,cy+s*.4,phase);ctx.fillRect(cx-s,cy-s*.65,s*2,s*1.2);
    const nebulaA=ctx.createRadialGradient(cx-s*.38,cy-s*.18,4,cx-s*.28,cy-s*.08,s*.58);nebulaA.addColorStop(0,'rgba(71,216,255,.24)');nebulaA.addColorStop(.35,'rgba(63,87,216,.17)');nebulaA.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=nebulaA;ctx.fillRect(cx-s,cy-s*.58,s*1.3,s*.95);
    const nebulaB=ctx.createRadialGradient(cx+s*.34,cy+s*.02,4,cx+s*.26,cy, s*.62);nebulaB.addColorStop(0,'rgba(218,64,255,.18)');nebulaB.addColorStop(.42,'rgba(104,47,184,.12)');nebulaB.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=nebulaB;ctx.fillRect(cx-s*.2,cy-s*.46,s*1.25,s*.9);drawCosmicSpecks(cx,cy,s*.82,s*.37,52,1-death*.72,12);ctx.restore();
    ctx.save();mantlePath(cx,cy,s,phase,death);ctx.strokeStyle=phase===3?'rgba(235,241,255,.58)':'rgba(97,91,183,.64)';ctx.lineWidth=Math.max(2,s*.012);ctx.shadowColor=phase===3?'#ffffff':'#5a43a6';ctx.shadowBlur=phase===3?14:7;ctx.globalAlpha=1-death*.62;ctx.stroke();ctx.restore();
  }
  const CRACKS=[[[0,-.30],[-.035,-.17],[.015,-.05],[-.04,.08],[.018,.30]],[[-.02,-.11],[-.18,-.18],[-.33,-.17],[-.49,-.25]],[[-.005,-.02],[.17,-.11],[.34,-.09],[.51,-.19]],[[-.04,.08],[-.19,.17],[-.36,.15],[-.54,.25]],[[.015,.14],[.17,.22],[.31,.20],[.47,.31]],[[-.18,-.18],[-.27,-.33],[-.40,-.38]],[[.18,-.10],[.28,-.26],[.42,-.34]],[[.18,.22],[.36,.13],[.59,.18]]];
  function drawCracks(cx,cy,s,phase,death){
    const count=phase===1?3:phase===2?6:CRACKS.length;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.globalCompositeOperation='screen';
    for(let i=0;i<count;i++){ctx.beginPath();CRACKS[i].forEach((p,j)=>{const x=cx+p[0]*s,y=cy+p[1]*s;j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#ffffff';ctx.globalAlpha=Math.min(1,.55+phase*.11+death*.62);ctx.lineWidth=s*(i===0?.018:.0085)*(1+death*1.35);ctx.shadowColor='#ffffff';ctx.shadowBlur=s*(.022+phase*.009+death*.11);ctx.stroke();}ctx.restore();
  }
  function drawCoreTear(cx,cy,s,phase,death){
    const widen=1+(phase-1)*.16+death*2.4,pulse=1+Math.sin(performance.now()*.0028)*.026;ctx.save();ctx.translate(cx,cy-s*.005);ctx.scale(widen*pulse,1+(phase-1)*.035+death*.32);ctx.globalCompositeOperation='screen';ctx.shadowColor='#ffffff';ctx.shadowBlur=s*(.11+phase*.03+death*.25);ctx.fillStyle='#ffffff';
    ctx.beginPath();ctx.moveTo(-s*.030,-s*.33);ctx.lineTo(s*.045,-s*.22);ctx.lineTo(-s*.006,-s*.115);ctx.lineTo(s*.042,-s*.035);ctx.lineTo(-s*.020,s*.055);ctx.lineTo(s*.052,s*.145);ctx.lineTo(-s*.018,s*.33);ctx.lineTo(-s*.075,s*.19);ctx.lineTo(-s*.030,s*.09);ctx.lineTo(-s*.082,-s*.015);ctx.lineTo(-s*.038,-s*.12);ctx.lineTo(-s*.072,-s*.23);ctx.closePath();ctx.fill();ctx.globalAlpha=.16+phase*.08+death*.55;ctx.shadowBlur=s*(.24+death*.30);ctx.fillStyle='#dce8ff';ctx.beginPath();ctx.ellipse(-s*.008,0,s*(.13+death*.27),s*(.36+death*.30),-.035,0,TAU_LOCAL);ctx.fill();ctx.restore();
  }
  function drawFragments(cx,cy,s,phase,death){
    const count=phase===1?6:phase===2?10:14;for(let i=0;i<count;i++){const a=seeded01(i,44)*TAU_LOCAL,base=s*(.70+seeded01(i+21,44)*.26),fly=death*death*s*(.30+seeded01(i+9,44)*.42),x=cx+Math.cos(a)*(base+fly),y=cy+Math.sin(a)*(base*.48+fly*.62),r=s*(.016+seeded01(i+31,44)*.018);ctx.save();ctx.translate(x,y);ctx.rotate(a+performance.now()*.00009*(i%2?1:-1));ctx.globalAlpha=Math.max(0,.68-death*.50);ctx.fillStyle=i%3===0?'#1a1240':'#050815';ctx.strokeStyle=i%4===0?'#dfe7ff':'#5f50a7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.72,r*.48);ctx.lineTo(-r*.55,r*.78);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  }
  function drawAnswerBoss(){
    const g=geometry(),phase=preview.phase,death=preview.defeating?clamp01(preview.defeatAge/3.15):0,s=g.bossScale,cx=g.cx,cy=g.bossY+s*.18;ctx.save();
    const aura=ctx.createRadialGradient(cx,cy-s*.04,s*.03,cx,cy,s*1.18);aura.addColorStop(0,`rgba(255,255,255,${.055+phase*.022+death*.34})`);aura.addColorStop(.26,`rgba(92,116,255,${.055+phase*.018})`);aura.addColorStop(.54,`rgba(138,52,209,${.045+phase*.012})`);aura.addColorStop(1,'rgba(9,4,32,0)');ctx.fillStyle=aura;ctx.fillRect(cx-s*1.5,cy-s*.85,s*3,s*1.8);
    drawTendrils(cx,cy,s,phase,death);drawFragments(cx,cy,s,phase,death);drawMantle(cx,cy,s,phase,death);drawCracks(cx,cy,s,phase,death);drawCoreTear(cx,cy,s,phase,death);
    if(death>.16){ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp01((death-.16)/.65)*.78;const bloom=ctx.createRadialGradient(cx,cy,0,cx,cy,s*(.20+death*.86));bloom.addColorStop(0,'#ffffff');bloom.addColorStop(.25,'rgba(255,255,255,.88)');bloom.addColorStop(.64,'rgba(194,218,255,.20)');bloom.addColorStop(1,'rgba(210,224,255,0)');ctx.fillStyle=bloom;ctx.fillRect(cx-s*1.4,cy-s*1.1,s*2.8,s*2.2);}
    if(death>.80){ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp01((death-.80)/.16)*.96;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,vw,vh);}ctx.restore();
  }
  function drawArenaFloor(){
    const g=geometry(),phase=preview.phase;ctx.save();ctx.beginPath();ctx.ellipse(g.arenaCx,g.arenaCy,g.arenaRx,g.arenaRy,0,0,TAU_LOCAL);ctx.clip();
    const floor=ctx.createRadialGradient(g.arenaCx,g.arenaCy*.99,8,g.arenaCx,g.arenaCy,g.arenaRx);floor.addColorStop(0,phase===3?'rgba(29,38,72,.72)':'rgba(18,19,57,.78)');floor.addColorStop(.42,'rgba(10,9,37,.82)');floor.addColorStop(.78,'rgba(4,5,20,.93)');floor.addColorStop(1,'rgba(0,1,7,.99)');ctx.fillStyle=floor;ctx.fillRect(g.arenaCx-g.arenaRx,g.arenaCy-g.arenaRy,g.arenaRx*2,g.arenaRy*2);
    ctx.globalAlpha=.10+phase*.025;ctx.strokeStyle=phase===3?'#dfe8ff':'#7565c3';ctx.lineWidth=1;for(let ring=1;ring<=4;ring++){ctx.beginPath();ctx.ellipse(g.arenaCx,g.arenaCy,g.arenaRx*(ring/4),g.arenaRy*(ring/4),0,0,TAU_LOCAL);ctx.stroke();}for(let i=0;i<8;i++){const a=i/8*TAU_LOCAL;ctx.beginPath();ctx.moveTo(g.arenaCx,g.arenaCy);ctx.lineTo(g.arenaCx+Math.cos(a)*g.arenaRx,g.arenaCy+Math.sin(a)*g.arenaRy);ctx.stroke();}drawCosmicSpecks(g.arenaCx,g.arenaCy,g.arenaRx*.94,g.arenaRy*.90,32,.46,93);
    if(phase>=2){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.16+(phase-2)*.12;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.1;for(let i=0;i<phase+2;i++){const x=g.arenaCx+Math.sin(i*2.2+performance.now()*.00005)*g.arenaRx*.58,y=g.arenaCy+Math.cos(i*1.7)*g.arenaRy*.47;ctx.beginPath();ctx.moveTo(x-46,y-12);ctx.lineTo(x-15,y+1);ctx.lineTo(x+6,y-7);ctx.lineTo(x+36,y+13);ctx.stroke();}}ctx.restore();
  }
  function drawArenaBoundary(){
    const g=geometry(),pulse=.48+.18*Math.sin(performance.now()*.0021);ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowColor='#f1f4ff';ctx.shadowBlur=8+preview.phase*4;ctx.strokeStyle=`rgba(244,246,255,${pulse})`;ctx.lineWidth=1.4+preview.phase*.30;ctx.beginPath();ctx.ellipse(g.arenaCx,g.arenaCy,g.arenaRx,g.arenaRy,0,0,TAU_LOCAL);ctx.stroke();ctx.shadowBlur=0;ctx.setLineDash([26,34]);ctx.lineDashOffset=-performance.now()*.018;ctx.globalAlpha=.16+preview.phase*.055;ctx.strokeStyle=preview.phase===3?'#ffffff':'#806cff';ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(g.arenaCx,g.arenaCy,g.arenaRx-7,g.arenaRy-5,0,0,TAU_LOCAL);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }
  function drawPrototypeBackground(){drawPhaseSky();drawArenaFloor();drawAnswerBoss();}
  function drawAftermathOverlay(){
    if(!preview.aftermath)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(vw*.5,vh*.43,20,vw*.5,vh*.50,Math.max(vw,vh)*.82);g.addColorStop(0,'rgba(216,232,255,.095)');g.addColorStop(.50,'rgba(114,163,255,.045)');g.addColorStop(1,'rgba(255,255,255,.014)');ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);ctx.restore();
  }

  function withFixedArenaCamera(base,...args){
    if(!preview.active||typeof base!=='function')return base?.(...args);const offset=cameraOffset();ctx.save();ctx.translate(offset.x,offset.y);try{return base(...args);}finally{ctx.restore();}
  }
  function wrapWorldDraw(name,base){return typeof base==='function'?function(...args){return withFixedArenaCamera(base,...args);}:base;}
  const baseDrawWells=typeof drawWells==='function'?drawWells:null;if(baseDrawWells)drawWells=wrapWorldDraw('drawWells',baseDrawWells);
  const baseDrawGems=typeof drawGems==='function'?drawGems:null;if(baseDrawGems)drawGems=wrapWorldDraw('drawGems',baseDrawGems);
  const baseDrawFieldPickups=typeof drawFieldPickups==='function'?drawFieldPickups:null;if(baseDrawFieldPickups)drawFieldPickups=wrapWorldDraw('drawFieldPickups',baseDrawFieldPickups);
  const baseDrawStagePhysicalObjects=typeof drawStagePhysicalObjects==='function'?drawStagePhysicalObjects:null;if(baseDrawStagePhysicalObjects)drawStagePhysicalObjects=wrapWorldDraw('drawStagePhysicalObjects',baseDrawStagePhysicalObjects);
  const baseDrawProjectiles=typeof drawProjectiles==='function'?drawProjectiles:null;if(baseDrawProjectiles)drawProjectiles=wrapWorldDraw('drawProjectiles',baseDrawProjectiles);
  const baseDrawBoomerangs=typeof drawBoomerangs==='function'?drawBoomerangs:null;if(baseDrawBoomerangs)drawBoomerangs=wrapWorldDraw('drawBoomerangs',baseDrawBoomerangs);
  const baseDrawAlliedEffects=typeof drawAlliedEffects==='function'?drawAlliedEffects:null;if(baseDrawAlliedEffects)drawAlliedEffects=wrapWorldDraw('drawAlliedEffects',baseDrawAlliedEffects);
  const baseDrawTelegraphs=typeof drawTelegraphs==='function'?drawTelegraphs:null;if(baseDrawTelegraphs)drawTelegraphs=wrapWorldDraw('drawTelegraphs',baseDrawTelegraphs);
  const baseDrawMapEvents=typeof drawMapEvents==='function'?drawMapEvents:null;if(baseDrawMapEvents)drawMapEvents=wrapWorldDraw('drawMapEvents',baseDrawMapEvents);
  const baseDrawEnemies=typeof drawEnemies==='function'?drawEnemies:null;if(baseDrawEnemies)drawEnemies=wrapWorldDraw('drawEnemies',baseDrawEnemies);
  const baseDrawBeamEffects=typeof drawBeamEffects==='function'?drawBeamEffects:null;if(baseDrawBeamEffects)drawBeamEffects=wrapWorldDraw('drawBeamEffects',baseDrawBeamEffects);
  const baseDrawEnemyProjectiles=typeof drawEnemyProjectiles==='function'?drawEnemyProjectiles:null;if(baseDrawEnemyProjectiles)drawEnemyProjectiles=wrapWorldDraw('drawEnemyProjectiles',baseDrawEnemyProjectiles);
  const baseDrawMagnetField=typeof drawMagnetField==='function'?drawMagnetField:null;if(baseDrawMagnetField)drawMagnetField=wrapWorldDraw('drawMagnetField',baseDrawMagnetField);
  const baseDrawChronoField=typeof drawChronoField==='function'?drawChronoField:null;if(baseDrawChronoField)drawChronoField=wrapWorldDraw('drawChronoField',baseDrawChronoField);
  const baseDrawPlayer=typeof drawPlayer==='function'?drawPlayer:null;if(baseDrawPlayer)drawPlayer=wrapWorldDraw('drawPlayer',baseDrawPlayer);

  const basePause=typeof isApexProgressionClockPaused==='function'?isApexProgressionClockPaused:null;
  if(basePause)isApexProgressionClockPaused=function isProgressionPausedForAnswer(){ensureRunIdentity();return preview.active||basePause();};
  const baseUpdateSpawning=typeof updateSpawning==='function'?updateSpawning:null;
  if(baseUpdateSpawning)updateSpawning=function updateSpawningWithAnswerPrototype(dt){if(preview.active)return;return baseUpdateSpawning(dt);};
  const baseUpdateMapEvents=typeof updateMapEvents==='function'?updateMapEvents:null;
  if(baseUpdateMapEvents)updateMapEvents=function updateMapEventsWithAnswerPrototype(dt){if(preview.active)return;return baseUpdateMapEvents(dt);};
  if(typeof registerPlayerUpdateInterceptor==='function')registerPlayerUpdateInterceptor('void-apex-answer-v1:arena',function answerArenaPlayerUpdate(next,dt){if(preview.active)state.time=Math.max(0,(Number(state.time)||0)-Math.max(0,Number(dt)||0));const result=next(dt);updatePrototype(dt);return result;});
  const baseUpdateHud=typeof updateHUD==='function'?updateHUD:null;
  if(baseUpdateHud)updateHUD=function updateHudWithAnswerPrototype(){const result=baseUpdateHud();if(preview.active)syncBossHud();return result;};
  const baseDrawBackground=typeof drawBackground==='function'?drawBackground:null;
  if(baseDrawBackground)drawBackground=function drawBackgroundWithAnswerArena(){const result=baseDrawBackground();if(preview.active)drawPrototypeBackground();return result;};
  const baseDrawEffects=typeof drawEffects==='function'?drawEffects:null;
  if(baseDrawEffects)drawEffects=function drawEffectsWithAnswerBoundary(...args){const result=baseDrawEffects(...args);if(preview.active)drawArenaBoundary();return result;};
  const baseDraw=typeof draw==='function'?draw:null;
  if(baseDraw)draw=function drawWithAnswerAftermath(){ensureRunIdentity();const result=baseDraw();drawAftermathOverlay();return result;};

  function installThreatStyle(){
    if(document.querySelector('#answerThreatStyle'))return;const style=document.createElement('style');style.id='answerThreatStyle';style.textContent=`
      html[data-answer-preview="1"] canvas:not(#game){opacity:0!important;pointer-events:none!important}
      #worldEventScreen[data-event-type="void"][data-answer-threat]:before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0;background:radial-gradient(ellipse at 50% 36%,rgba(255,255,255,.22),rgba(139,83,255,.08) 23%,transparent 58%);transition:opacity .28s ease}
      #worldEventScreen[data-event-type="void"][data-answer-threat="25"]:before{opacity:.18}
      #worldEventScreen[data-event-type="void"][data-answer-threat="50"]:before{opacity:.32}
      #worldEventScreen[data-event-type="void"][data-answer-threat="75"]:before{opacity:.52}
      #worldEventScreen[data-event-type="void"][data-answer-threat="100"]:before{opacity:.78}
      #worldEventScreen[data-event-type="void"][data-answer-threat] .world-event-shell{transition:border-color .3s,box-shadow .3s,filter .3s;background-image:radial-gradient(circle at 50% 0%,rgba(128,56,186,.18),transparent 44%),linear-gradient(155deg,rgba(19,5,42,.97),rgba(2,2,13,.99))}
      #worldEventScreen[data-event-type="void"][data-answer-threat="50"] .world-event-shell{border-color:rgba(221,211,255,.44);box-shadow:0 36px 120px rgba(0,0,0,.72),inset 0 0 115px rgba(163,102,240,.13),0 0 42px rgba(226,232,255,.08)}
      #worldEventScreen[data-event-type="void"][data-answer-threat="75"] .world-event-shell{border-color:rgba(238,239,255,.62);box-shadow:0 36px 120px rgba(0,0,0,.74),inset 0 0 125px rgba(182,134,255,.16),0 0 62px rgba(239,244,255,.14);filter:saturate(.88)}
      #worldEventScreen[data-event-type="void"][data-answer-threat="100"] .world-event-shell{border-color:rgba(255,255,255,.82);box-shadow:0 36px 130px rgba(0,0,0,.78),inset 0 0 145px rgba(218,228,255,.20),0 0 88px rgba(255,255,255,.20);filter:saturate(.72) brightness(1.05)}
      #worldEventScreen[data-event-type="void"][data-answer-threat="50"] .world-event-shell:after,#worldEventScreen[data-event-type="void"][data-answer-threat="75"] .world-event-shell:after,#worldEventScreen[data-event-type="void"][data-answer-threat="100"] .world-event-shell:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(112deg,transparent 0 28%,rgba(255,255,255,.09) 28.2% 28.5%,transparent 28.7% 61%,rgba(255,255,255,.07) 61.2% 61.45%,transparent 61.7%),linear-gradient(68deg,transparent 0 47%,rgba(255,255,255,.055) 47.2% 47.4%,transparent 47.6%);mix-blend-mode:screen}
      #worldEventScreen[data-event-type="void"][data-answer-threat="75"] #worldEventTitle,#worldEventScreen[data-event-type="void"][data-answer-threat="100"] #worldEventTitle{text-shadow:0 0 28px rgba(255,255,255,.34),0 0 58px rgba(159,117,255,.30)}
      #worldEventScreen[data-event-type="void"][data-answer-threat="100"] .world-event-card{border-color:color-mix(in srgb,var(--event-color) 32%,rgba(255,255,255,.46));box-shadow:0 22px 58px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.08),0 0 28px rgba(255,255,255,.05)}
    `;document.head.appendChild(style);
  }
  function setThreat(value){preview.threat=threatBand(Number(value)||0);state.answerVoidThreat=preview.threat;syncThreatPanel();return preview.threat;}
  function syncThreatPanel(){
    const overlay=document.querySelector('#worldEventScreen');if(!overlay)return;const isVoid=overlay.dataset.eventType==='void';if(!isVoid){delete overlay.dataset.answerThreat;return;}const band=threatBand(Number(state.answerVoidThreat)||preview.threat);if(band)overlay.dataset.answerThreat=String(band);else delete overlay.dataset.answerThreat;
  }
  installThreatStyle();const threatObserver=new MutationObserver(syncThreatPanel);const eventOverlay=document.querySelector('#worldEventScreen');if(eventOverlay)threatObserver.observe(eventOverlay,{attributes:true,attributeFilter:['class','data-event-type'],subtree:false});syncThreatPanel();

  function installDevControls(){
    const dev=window.stackfallDeveloperTest,panel=document.querySelector('#stackfallDevPanel');if(!dev?.enabled||!panel||document.querySelector('#devAnswerPrototype'))return;
    const label=document.createElement('label');label.textContent='VOID APEX · 응답 디자인';const grid=document.createElement('div');grid.className='dev-grid';grid.id='devAnswerPrototype';
    const button=(text,id,handler,wide=false)=>{const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;if(wide)b.className='dev-wide';b.addEventListener('click',handler);return b;};
    grid.append(button('응답 시안 시작','devAnswerStart',()=>activate(),true),button('P1 · 관측','devAnswerP1',()=>setPhase(1)),button('P2 · 침식','devAnswerP2',()=>setPhase(2)),button('P3 · 노출','devAnswerP3',()=>setPhase(3)),button('격파 연출','devAnswerDefeat',()=>startDefeat()),button('시안 종료','devAnswerStop',()=>stop(),true),button('입장 위협 25%','devAnswerThreat25',()=>setThreat(25)),button('입장 위협 50%','devAnswerThreat50',()=>setThreat(50)),button('입장 위협 75%','devAnswerThreat75',()=>setThreat(75)),button('입장 위협 100%','devAnswerThreat100',()=>setThreat(100)));
    panel.append(label,grid);
    Object.assign(dev,{startAnswerPrototype:activate,setAnswerPhase:setPhase,defeatAnswerPrototype:startDefeat,stopAnswerPrototype:stop,setAnswerThreat:setThreat,answerPrototypeSnapshot:()=>({active:preview.active,phase:preview.phase,hpRatio:preview.hpRatio,defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,threat:preview.threat,camera:{x:preview.camX,y:preview.camY},bounds:preview.active?worldBounds():null})});
  }
  installDevControls();setTimeout(installDevControls,0);
  window.stackfallVoidApexAnswerDiagnostics=()=>({version:'v1',prototypeOnly:true,active:preview.active,phase:preview.phase,hpRatio:preview.hpRatio,defeating:preview.defeating,defeatAge:preview.defeatAge,aftermath:preview.aftermath,voidSealed:state.answerVoidSealed===true,threat:preview.threat,camera:{x:preview.camX,y:preview.camY},geometry:geometry()});
})();