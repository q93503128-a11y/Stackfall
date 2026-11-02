from pathlib import Path
import sys

path=Path('src/void-apex-answer-v1.js')
s=path.read_text()
marker="window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v3';"
if marker in s:
    print('visual revision already applied')
    sys.exit(0)

s=s.replace("  window.STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true;", "  window.STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true;\n  window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v3';", 1)
s=s.replace("scale=Math.min(width*.43,height*.54);", "scale=Math.min(width*.35,height*.46);", 1)

start=s.index('  const TENDRILS=[')
end=s.index('  function tendrilPath',start)
tendrils="""  const TENDRILS=[
    {x:-.58,y:.00,c1x:-.72,c1y:.14,c2x:-.92,c2y:.31,ex:-1.10,ey:.54,w:.052},{x:-.37,y:.08,c1x:-.45,c1y:.24,c2x:-.59,c2y:.46,ex:-.71,ey:.73,w:.041},{x:-.12,y:.15,c1x:-.14,c1y:.31,c2x:-.22,c2y:.52,ex:-.31,ey:.79,w:.030},{x:.18,y:.13,c1x:.22,c1y:.30,c2x:.31,c2y:.47,ex:.39,ey:.72,w:.034},{x:.40,y:.06,c1x:.53,c1y:.19,c2x:.69,c2y:.38,ex:.82,ey:.66,w:.044},{x:.62,y:-.02,c1x:.79,c1y:.09,c2x:.96,c2y:.25,ex:1.13,ey:.47,w:.055}
  ];
"""
s=s[:start]+tendrils+s[end:]

start=s.index('  function drawTendrils(')
end=s.index('  function drawMantle',start)
tendril_and_mantle="""  function drawTendrils(cx,cy,s,phase,death){TENDRILS.forEach((spec,i)=>{const sway=Math.sin(performance.now()*.00042+i*1.31)*.014,fade=Math.max(0,1-death*.84);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';tendrilPath(spec,cx,cy,s,sway);ctx.strokeStyle='rgba(0,1,8,.94)';ctx.globalAlpha=fade;ctx.lineWidth=s*(spec.w+.020);ctx.stroke();tendrilPath(spec,cx,cy,s,sway);ctx.strokeStyle=cosmicGradient(cx-s,cy,cx+s,cy+s);ctx.lineWidth=s*spec.w;ctx.shadowColor=phase>=2?'#7251da':'#283f8f';ctx.shadowBlur=phase>=2?11:6;ctx.stroke();ctx.shadowBlur=0;tendrilPath(spec,cx,cy,s,sway);ctx.strokeStyle=i%2?'rgba(151,103,255,.45)':'rgba(79,200,255,.38)';ctx.lineWidth=Math.max(1.1,s*.006);ctx.globalAlpha=(.42+phase*.06)*fade;ctx.stroke();const ex=cx+(spec.ex+sway)*s,ey=cy+spec.ey*s,a=Math.atan2(spec.ey-spec.c2y,spec.ex-spec.c2x),branchX=cx+(spec.c2x*.72+spec.ex*.28+sway)*s,branchY=cy+(spec.c2y*.72+spec.ey*.28)*s,side=i%2?-1:1;ctx.strokeStyle='rgba(175,199,255,.24)';ctx.lineWidth=Math.max(1,s*.004);ctx.beginPath();ctx.moveTo(branchX,branchY);ctx.lineTo(branchX+Math.cos(a+side*.95)*s*.13,branchY+Math.sin(a+side*.95)*s*.13);ctx.stroke();ctx.translate(ex,ey);ctx.rotate(a);ctx.globalAlpha=.72*fade;ctx.fillStyle='#050615';ctx.strokeStyle=phase===3?'#dfe8ff':'#5544a6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(s*.048,0);ctx.lineTo(-s*.020,-s*.023);ctx.lineTo(-s*.008,0);ctx.lineTo(-s*.020,s*.023);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();});}
  function mantlePath(cx,cy,s,phase,death){const split=(phase-1)*s*.018+death*s*.10;ctx.beginPath();ctx.moveTo(cx-s*.78,cy-s*.08);ctx.bezierCurveTo(cx-s*.70,cy-s*.28,cx-s*.53,cy-s*.41,cx-s*.31,cy-s*.38);ctx.lineTo(cx-s*.24,cy-s*.44);ctx.lineTo(cx-s*.13,cy-s*.34-split);ctx.lineTo(cx-s*.07,cy-s*.43);ctx.lineTo(cx-s*.015,cy-s*.27-split*.22);ctx.lineTo(cx+s*.075,cy-s*.39);ctx.lineTo(cx+s*.17,cy-s*.30-split*.52);ctx.lineTo(cx+s*.28,cy-s*.37);ctx.bezierCurveTo(cx+s*.49,cy-s*.40,cx+s*.72,cy-s*.25,cx+s*.80,cy-s*.05);ctx.lineTo(cx+s*.74,cy+s*.05);ctx.bezierCurveTo(cx+s*.65,cy+s*.18,cx+s*.51,cy+s*.26,cx+s*.34,cy+s*.23);ctx.lineTo(cx+s*.25,cy+s*.31);ctx.lineTo(cx+s*.14,cy+s*.24+split*.55);ctx.lineTo(cx+s*.06,cy+s*.36);ctx.lineTo(cx-s*.02,cy+s*.26+split);ctx.lineTo(cx-s*.11,cy+s*.34);ctx.lineTo(cx-s*.21,cy+s*.23+split*.45);ctx.lineTo(cx-s*.34,cy+s*.29);ctx.bezierCurveTo(cx-s*.52,cy+s*.25,cx-s*.70,cy+s*.16,cx-s*.78,cy+s*.02);ctx.closePath();}
"""
s=s[:start]+tendril_and_mantle+s[end:]

crack_fn=s.index('  function drawCracks(')
rays="""  function drawFissureRays(cx,cy,s,phase,death){
    const phaseLight=phase===1?.14:phase===2?.32:.56,deathLight=death*.62,emit=(sx,sy,dx,dy,length,nearW,farW,alpha)=>{const mag=Math.hypot(dx,dy)||1,nx=dx/mag,ny=dy/mag,px=-ny,py=nx,ex=sx+nx*length,ey=sy+ny*length,g=ctx.createLinearGradient(sx,sy,ex,ey);g.addColorStop(0,`rgba(255,255,255,${Math.min(.96,alpha)})`);g.addColorStop(.18,`rgba(241,247,255,${Math.min(.72,alpha*.72)})`);g.addColorStop(.56,`rgba(216,231,255,${Math.min(.25,alpha*.25)})`);g.addColorStop(1,'rgba(205,225,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(sx+px*nearW,sy+py*nearW);ctx.lineTo(ex+px*farW,ey+py*farW);ctx.lineTo(ex-px*farW,ey-py*farW);ctx.lineTo(sx-px*nearW,sy-py*nearW);ctx.closePath();ctx.fill();};
    ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowColor='#ffffff';ctx.shadowBlur=s*(.035+phase*.012+death*.08);emit(cx-s*.012,cy-s*.29,-.08,-1,s*(.54+phase*.08+death*.24),s*.008,s*(.075+phase*.022),phaseLight*.78+deathLight);emit(cx+s*.010,cy+s*.29,.08,1,s*(.42+phase*.07+death*.20),s*.007,s*(.064+phase*.018),phaseLight*.62+deathLight*.82);const count=phase===1?2:phase===2?5:CRACKS.length;for(let i=1;i<count;i++){const p=CRACKS[i][CRACKS[i].length-1],sx=cx+p[0]*s,sy=cy+p[1]*s,spread=.045+(i%3)*.018,len=s*(.34+seeded01(i,65)*.26+death*.18),alpha=phaseLight*(.34+seeded01(i+17,65)*.24)+deathLight*.46;emit(sx,sy,p[0],p[1],len,s*.004,s*spread,alpha);}ctx.restore();
  }
"""
s=s[:crack_fn]+rays+s[crack_fn:]

start=s.index('  function drawAnswerBoss()')
end=s.index('  function drawArenaFloor()',start)
answer="""  function drawAnswerBoss(){const g=geometry(),phase=preview.phase,death=preview.defeating?clamp01(preview.defeatAge/3.15):0,s=g.bossScale,cx=g.cx,cy=g.bossY+s*.18;ctx.save();const aura=ctx.createRadialGradient(cx,cy-s*.04,s*.03,cx,cy,s*1.08);aura.addColorStop(0,`rgba(255,255,255,${.045+phase*.020+death*.34})`);aura.addColorStop(.25,`rgba(92,116,255,${.050+phase*.016})`);aura.addColorStop(.55,`rgba(138,52,209,${.038+phase*.010})`);aura.addColorStop(1,'rgba(9,4,32,0)');ctx.fillStyle=aura;ctx.fillRect(cx-s*1.45,cy-s*.90,s*2.9,s*1.95);drawTendrils(cx,cy,s,phase,death);drawFragments(cx,cy,s,phase,death);drawFissureRays(cx,cy,s,phase,death);drawMantle(cx,cy,s,phase,death);drawCracks(cx,cy,s,phase,death);drawCoreTear(cx,cy,s,phase,death);if(death>.16){ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp01((death-.16)/.65)*.78;const bloom=ctx.createRadialGradient(cx,cy,0,cx,cy,s*(.20+death*.86));bloom.addColorStop(0,'#ffffff');bloom.addColorStop(.25,'rgba(255,255,255,.88)');bloom.addColorStop(.64,'rgba(194,218,255,.20)');bloom.addColorStop(1,'rgba(210,224,255,0)');ctx.fillStyle=bloom;ctx.fillRect(cx-s*1.4,cy-s*1.1,s*2.8,s*2.2);}if(death>.80){ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp01((death-.80)/.16)*.96;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,vw,vh);}ctx.restore();}
"""
s=s[:start]+answer+s[end:]

start=s.index('  function drawArenaFloor()')
end=s.index('  function drawAftermathOverlay()',start)
s=s[:start]+"  function drawPrototypeBackground(){drawPhaseSky();drawAnswerBoss();}\n"+s[end:]

start=s.index('  function installThreatStyle()')
end=s.index('  function installDevControls()',start)
threat="""  function installThreatStyle(){
    if(document.querySelector('#answerThreatStyle'))return;const style=document.createElement('style');style.id='answerThreatStyle';style.textContent=`
      html[data-answer-preview="1"] canvas:not(#game){opacity:0!important;pointer-events:none!important}
      #worldEventScreen .choice-head,#worldEventScreen #worldEventCards{position:relative;z-index:3}
      #answerThreatVisual{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;opacity:0;mix-blend-mode:screen;transition:opacity .22s ease}
      #answerThreatVisual .answer-threat-ray{position:absolute;top:-28%;left:50%;width:18%;height:165%;transform-origin:50% 0;background:linear-gradient(180deg,rgba(255,255,255,.82),rgba(226,238,255,.36) 22%,rgba(186,208,255,.12) 55%,rgba(255,255,255,0));filter:blur(7px);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%)}
      #answerThreatVisual .r1{transform:translateX(-50%) rotate(3deg)}#answerThreatVisual .r2{transform:translateX(-50%) rotate(-23deg);left:32%;width:13%}#answerThreatVisual .r3{transform:translateX(-50%) rotate(24deg);left:68%;width:14%}#answerThreatVisual .r4{transform:translateX(-50%) rotate(-43deg);left:18%;width:10%}
      #answerThreatVisual .answer-threat-slit{position:absolute;left:49.55%;top:-5%;width:1.15%;height:112%;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.54) 58%,rgba(224,236,255,.08));clip-path:polygon(32% 0,80% 8%,43% 21%,72% 33%,34% 47%,66% 59%,28% 74%,74% 88%,44% 100%,0 88%,30% 73%,5% 60%,36% 46%,8% 33%,38% 18%,12% 7%);box-shadow:0 0 18px #fff,0 0 54px rgba(220,232,255,.72)}
      #answerThreatVisual .answer-threat-crack{position:absolute;height:2px;background:linear-gradient(90deg,rgba(255,255,255,0),#fff 28%,rgba(255,255,255,.72) 72%,rgba(255,255,255,0));box-shadow:0 0 12px #fff;transform-origin:left center}
      #answerThreatVisual .c1{left:49%;top:29%;width:29%;transform:rotate(-12deg)}#answerThreatVisual .c2{left:27%;top:43%;width:24%;transform:rotate(9deg)}#answerThreatVisual .c3{left:50%;top:58%;width:35%;transform:rotate(13deg)}#answerThreatVisual .c4{left:18%;top:66%;width:34%;transform:rotate(-8deg)}
      #answerThreatVisual[data-band="25"] .r2,#answerThreatVisual[data-band="25"] .r3,#answerThreatVisual[data-band="25"] .r4,#answerThreatVisual[data-band="25"] .c2,#answerThreatVisual[data-band="25"] .c3,#answerThreatVisual[data-band="25"] .c4{opacity:0}
      #answerThreatVisual[data-band="50"] .r3,#answerThreatVisual[data-band="50"] .r4,#answerThreatVisual[data-band="50"] .c3,#answerThreatVisual[data-band="50"] .c4{opacity:0}
      #answerThreatVisual[data-band="75"] .r4,#answerThreatVisual[data-band="75"] .c4{opacity:.25}
      #worldEventScreen[data-answer-threat="75"] #worldEventTitle,#worldEventScreen[data-answer-threat="100"] #worldEventTitle{text-shadow:0 0 24px rgba(255,255,255,.55),0 0 60px rgba(172,145,255,.42)}
    `;document.head.appendChild(style);
  }
  function ensureThreatVisual(){const shell=document.querySelector('#worldEventScreen .world-event-shell');if(!shell)return null;let visual=shell.querySelector('#answerThreatVisual');if(visual)return visual;visual=document.createElement('div');visual.id='answerThreatVisual';visual.setAttribute('aria-hidden','true');visual.innerHTML='<span class="answer-threat-ray r1"></span><span class="answer-threat-ray r2"></span><span class="answer-threat-ray r3"></span><span class="answer-threat-ray r4"></span><span class="answer-threat-slit"></span><span class="answer-threat-crack c1"></span><span class="answer-threat-crack c2"></span><span class="answer-threat-crack c3"></span><span class="answer-threat-crack c4"></span>';shell.appendChild(visual);return visual;}
  function resetThreatVisual(overlay,shell,visual){delete overlay.dataset.answerThreat;if(visual){visual.style.opacity='0';visual.dataset.band='0';}overlay.style.removeProperty('background');shell?.style.removeProperty('border-color');shell?.style.removeProperty('box-shadow');shell?.style.removeProperty('filter');}
  function setThreat(value){preview.threat=threatBand(Number(value)||0);state.answerVoidThreat=preview.threat;syncThreatPanel();return preview.threat;}
  function syncThreatPanel(){const overlay=document.querySelector('#worldEventScreen'),shell=overlay?.querySelector('.world-event-shell'),visual=ensureThreatVisual();if(!overlay||!shell)return;const isVoid=overlay.dataset.eventType==='void',band=threatBand(Number(state.answerVoidThreat)||preview.threat);if(!isVoid||!band){resetThreatVisual(overlay,shell,visual);return;}const p=band/100,opacity={25:.20,50:.42,75:.70,100:1}[band]||0;overlay.dataset.answerThreat=String(band);visual.dataset.band=String(band);visual.style.opacity=String(opacity);overlay.style.background=`radial-gradient(ellipse at 50% 42%,rgba(206,211,255,${.06+p*.28}),rgba(103,43,172,${.24+p*.16}) 31%,rgba(0,1,8,.985) 72%)`;shell.style.borderColor=`rgba(247,247,255,${.20+p*.64})`;shell.style.boxShadow=`0 36px 128px rgba(0,0,0,.76),inset 0 0 ${90+Math.round(p*80)}px rgba(209,220,255,${.05+p*.15}),0 0 ${24+Math.round(p*72)}px rgba(244,247,255,${.03+p*.18})`;shell.style.filter=band>=75?`saturate(${1-p*.22}) brightness(${1+p*.08})`:'none';}
  installThreatStyle();ensureThreatVisual();const threatObserver=new MutationObserver(syncThreatPanel),eventOverlay=document.querySelector('#worldEventScreen');if(eventOverlay)threatObserver.observe(eventOverlay,{attributes:true,attributeFilter:['class','data-event-type'],subtree:false});syncThreatPanel();

"""
s=s[:start]+threat+s[end:]
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
  ['visual revision marker is current',answer.includes("STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v3'")],
  ['prototype freezes both progression clock and visible game time',answer.includes('isProgressionPausedForAnswer')&&answer.includes('preview.active||basePause()')&&answer.includes('state.time=Math.max(0,(Number(state.time)||0)-Math.max(0,Number(dt)||0))')],
  ['prototype suppresses ordinary spawns and map-event updates during arena preview',answer.includes('updateSpawningWithAnswerPrototype')&&answer.includes('updateMapEventsWithAnswerPrototype')],
  ['fixed arena camera keeps player world coordinates authoritative',answer.includes('cameraOffset()')&&answer.includes('withFixedArenaCamera')&&answer.includes('ctx.translate(offset.x,offset.y)')&&!answer.includes('drawWithAnswerArenaCamera')&&!answer.includes('preview.realX=player.x')],
  ['player movement remains bounded without a visible ellipse arena',answer.includes('clampPlayerToArena')&&answer.includes('top:height*.40')&&answer.includes('bottom:height*.925')&&!answer.includes('function drawArenaFloor')&&!answer.includes('function drawArenaBoundary')],
  ['Answer redesign owns asymmetric cosmic mantle tendrils and fissure light rays',answer.includes('drawMantle')&&answer.includes('TENDRILS=[')&&answer.includes('drawFissureRays')&&answer.includes('drawCoreTear')],
  ['three visual phases change boss and Void sky without drawing an arena oval',answer.includes("button('P1 · 관측'")&&answer.includes("button('P2 · 침식'")&&answer.includes("button('P3 · 노출'")&&answer.includes('drawPhaseSky')&&answer.includes('drawPrototypeBackground(){drawPhaseSky();drawAnswerBoss();}')],
  ['Void entry threat presentation owns a real DOM light layer',answer.includes('ensureThreatVisual')&&answer.includes("visual.id='answerThreatVisual'")&&answer.includes('answer-threat-ray')&&answer.includes('answer-threat-slit')],
  ['Void entry threat presentation supports 25 50 75 and 100 percent bands',answer.includes("{25:.20,50:.42,75:.70,100:1}")&&answer.includes('setAnswerThreat')&&answer.includes('visual.dataset.band=String(band)')],
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
