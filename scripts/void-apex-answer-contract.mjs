import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const answer=read('src/void-apex-answer-v1.js');
const buildInfo=read('src/build-info.js');
const fingerprint=read('scripts/build-fingerprint.mjs');
const catalog=read('src/boss-catalog.js');
const events=read('src/map-event-expansion.js');
const checks=[
  ['prototype is explicitly dormant from live scheduling',answer.includes('STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true')&&!events.includes('void-apex-answer')&&!catalog.includes("'answer'" )],
  ['prototype freezes run progression while simulation stays available',answer.includes('isProgressionPausedForAnswer')&&answer.includes('preview.active||basePause()')],
  ['prototype suppresses ordinary spawns and map-event updates during arena preview',answer.includes('updateSpawningWithAnswerPrototype')&&answer.includes('updateMapEventsWithAnswerPrototype')],
  ['fixed arena camera preserves actual player position for rendering',answer.includes('drawWithAnswerArenaCamera')&&answer.includes('drawPlayerWithAnswerCamera')&&answer.includes('preview.realX-preview.camX')],
  ['player movement is bounded to the lower arena',answer.includes('clampPlayerToArena')&&answer.includes('top:height*.365')&&answer.includes('bottom:height*.915')],
  ['Answer owns cosmic shell, asymmetric tentacles and pure-white fissures',answer.includes('drawTentacles')&&answer.includes('drawShell')&&answer.includes("ctx.strokeStyle=i%3===0?'#ffffff':'#f4f7ff'")&&answer.includes("ctx.fillStyle='#ffffff'" )],
  ['three visual phases are available',answer.includes("button('P1 · 외피 안정'")&&answer.includes("button('P2 · 균열 확장'")&&answer.includes("button('P3 · 백색광 노출'")],
  ['defeat sequence leaks white light then leaves brighter aftermath state',answer.includes('startDefeat')&&answer.includes('finishDefeat')&&answer.includes('drawAftermathOverlay')&&answer.includes('state.answerVoidSealed=true')],
  ['developer preview controls are isolated to dev mode',answer.includes("document.querySelector('#stackfallDevPanel')")&&answer.includes('if(!dev?.enabled||!panel')],
  ['dynamic loader includes the prototype',buildInfo.includes("src/void-apex-answer-v1.js")&&buildInfo.includes('data-void-apex-answer-v1')],
  ['build fingerprint tracks the prototype and its contract',fingerprint.includes("'src/void-apex-answer-v1.js'")&&fingerprint.includes("'void-apex-answer-contract.mjs'"))
];
let failed=0;
for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}
console.log(`Checked ${checks.length} Void Apex Answer prototype contracts; failures=${failed}`);
if(failed)process.exit(1);
