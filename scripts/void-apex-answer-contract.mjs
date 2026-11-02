import fs from 'node:fs';
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
