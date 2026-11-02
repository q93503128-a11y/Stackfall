import fs from 'node:fs';
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
