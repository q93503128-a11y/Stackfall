import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const answer=read('src/void-apex-answer-v1.js');
const buildInfo=read('src/build-info.js');
const fingerprint=read('scripts/build-fingerprint.mjs');
const catalog=read('src/boss-catalog.js');
const events=read('src/map-event-expansion.js');
const checks=[
  ['prototype is explicitly dormant from live scheduling',answer.includes('STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true')&&!events.includes('void-apex-answer')&&!catalog.includes("'answer'")],
  ['prototype freezes both progression clock and visible game time',answer.includes('isProgressionPausedForAnswer')&&answer.includes('preview.active||basePause()')&&answer.includes('state.time=Math.max(0,(Number(state.time)||0)-Math.max(0,Number(dt)||0))')],
  ['prototype suppresses ordinary spawns and map-event updates during arena preview',answer.includes('updateSpawningWithAnswerPrototype')&&answer.includes('updateMapEventsWithAnswerPrototype')],
  ['fixed arena camera keeps player world coordinates authoritative',answer.includes('cameraOffset()')&&answer.includes('withFixedArenaCamera')&&!answer.includes('player.x=preview.camX')&&!answer.includes('player.y=preview.camY')],
  ['player movement is bounded to the lower arena',answer.includes('clampPlayerToArena')&&answer.includes('top:height*.40')&&answer.includes('bottom:height*.925')],
  ['Answer redesign owns cosmic mantle asymmetric tendrils and pure-white fissures',answer.includes('drawMantle')&&answer.includes('TENDRILS=[')&&answer.includes('drawCoreTear')&&answer.includes("ctx.strokeStyle='#ffffff'")],
  ['three visual phases change both boss and arena background',answer.includes("button('P1 · 관측'")&&answer.includes("button('P2 · 침식'")&&answer.includes("button('P3 · 노출'")&&answer.includes('drawPhaseSky')&&answer.includes('drawArenaFloor')],
  ['Void entry threat presentation supports 25 50 75 and 100 percent bands',answer.includes('data-answer-threat="25"')&&answer.includes('data-answer-threat="50"')&&answer.includes('data-answer-threat="75"')&&answer.includes('data-answer-threat="100"')&&answer.includes('setAnswerThreat')],
  ['defeat sequence leaks white light then leaves brighter aftermath state',answer.includes('startDefeat')&&answer.includes('finishDefeat')&&answer.includes('drawAftermathOverlay')&&answer.includes('state.answerVoidSealed=true')],
  ['developer preview controls are isolated to dev mode',answer.includes("document.querySelector('#stackfallDevPanel')")&&answer.includes('if(!dev?.enabled||!panel')],
  ['dynamic loader includes the prototype',buildInfo.includes('src/void-apex-answer-v1.js')&&buildInfo.includes('data-void-apex-answer-v1')],
  ['build fingerprint tracks the prototype and its contract',fingerprint.includes("'src/void-apex-answer-v1.js'")&&fingerprint.includes("'void-apex-answer-contract.mjs'")]
];
let failed=0;
for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}
console.log(`Checked ${checks.length} Void Apex Answer prototype contracts; failures=${failed}`);
if(failed)process.exit(1);
