import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=path=>fs.readFileSync(path,'utf8');
const answer=read('src/void-apex-answer-v1.js');
const render=read('src/render.js');
const buildInfo=read('src/build-info.js');
const fingerprint=read('scripts/build-fingerprint.mjs');
const catalog=read('src/boss-catalog.js');
const events=read('src/map-event-expansion.js');
const bodyDataMatch=answer.match(/const ANSWER_BODY_SRC='data:image\/webp;base64,([^']+)'/);
const bodyAssetBytes=bodyDataMatch?Buffer.from(bodyDataMatch[1],'base64'):Buffer.alloc(0);
const bodyAssetHash=createHash('sha256').update(bodyAssetBytes).digest('hex');
const bodyAssetExact=bodyAssetBytes.length===13042
  &&bodyAssetHash==='cc02c44e16e4f2333277eb538237178ed736efbf2bd0261f154fb2f3ce74553d'
  &&bodyAssetBytes.subarray(0,4).toString('ascii')==='RIFF'
  &&bodyAssetBytes.subarray(8,12).toString('ascii')==='WEBP'
  &&bodyAssetBytes.readUInt32LE(4)+8===bodyAssetBytes.length;
const parsesAsJavaScript=(()=>{try{new Function(answer);return true;}catch{return false;}})();
const checks=[
  ['prototype source parses as JavaScript',parsesAsJavaScript],
  ['prototype is explicitly dormant from live scheduling',answer.includes('STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY=true')&&!events.includes('void-apex-answer')&&!catalog.includes("'answer'")],
  ['prototype freezes progression and visible game time during preparation and combat',answer.includes('preview.active||preview.preparing||basePause()')&&answer.includes('if(preview.active||preview.preparing)state.time=Math.max(0')],
  ['prototype suppresses ordinary spawns and map-event updates during preparation and combat',answer.includes('if(preview.active||preview.preparing)return;return baseUpdateSpawning')&&answer.includes('if(preview.active||preview.preparing)return;return baseUpdateMapEvents')],
  ['fixed arena camera keeps player world coordinates authoritative',answer.includes('cameraOffset()')&&answer.includes('withFixedArenaCamera')&&answer.includes('ctx.translate(offset.x,offset.y)')&&!answer.includes('preview.realX=player.x')],
  ['fixed arena background is rendered from the frozen camera origin',answer.includes('function drawFrozenArenaBackground()')&&answer.includes('player.x=preview.camX')&&answer.includes('player.y=preview.camY')&&answer.includes('player.moveVX=0')&&answer.includes('player.moveVY=0')&&answer.includes('player.moveIntensity=0')&&answer.includes('player.x=snapshot.x')&&answer.includes('player.y=snapshot.y')],
  ['player movement is bounded to the lower combat region',answer.includes('clampPlayerToArena')&&answer.includes('top:height*.40')&&answer.includes('bottom:height*.925')],
  ['Answer V14 renders the exact approved q55 raster crop from an embedded data URI',answer.includes("STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v14'")&&answer.includes("const ANSWER_BODY_SRC='data:image/webp;base64,")&&answer.includes('ctx.drawImage(answerBodyImage,37,67,888,263,frame.x,frame.y,frame.w,frame.h)')],
  ['embedded q55 raster bytes are exact and container-complete',bodyAssetExact],
  ['Answer has a dedicated clean render stage after the realm background and before world objects',render.includes("runDrawStage('drawBackground',drawBackground);")&&render.includes("runDrawStage('drawVoidApexAnswerBackground',window.stackfallDrawVoidApexAnswerBackground)")&&answer.includes('window.stackfallDrawVoidApexAnswerBackground=function drawVoidApexAnswerBackground()')],
  ['body framing uses the approved galaxy-bearing canopy crop and reserves player space',answer.includes('const ratio=888/263')&&answer.includes('visibleDepth=Math.max(300,Math.min(420,height*.42))')&&answer.includes('y:visibleDepth-h')],
  ['body is phase-invariant and only screen-space fissures escalate across P1-P4',answer.includes('const PHASE_CRACK_COUNT=[3,6,9,13]')&&answer.includes('function drawAnswerFissures(frame,phase)')&&answer.includes('drawAnswerFissures(frame,phase)')&&!answer.includes('buildAnswerBodyLayer(phase)')],
  ['active encounter has a visible fail-safe if the raster is not ready',answer.includes('function drawFallbackBody(frame)')&&answer.includes('if(answerBodyReady)')&&answer.includes('else drawFallbackBody(frame)')],
  ['boss motion remains restrained',answer.includes('bob=Math.sin(t*.34)*1.25')&&answer.includes('drift=Math.sin(t*.17)*.75')],
  ['asset load and dedicated render hook are observable for runtime verification',answer.includes('answerBodyReady')&&answer.includes('answerBodyFailed')&&answer.includes('naturalWidth:answerBodyImage.naturalWidth||0')&&answer.includes('renderHook:typeof window.stackfallDrawVoidApexAnswerBackground')],
  ['developer diagnostics expose preparation, asset decode and render-hook state',answer.includes("status.id='devAnswerStatus'")&&answer.includes('prepStage:preview.prepStage')&&answer.includes("'hook ON'")],
  ['four visual phases are exposed in dev controls',answer.includes("button('P1 · 봉쇄'")&&answer.includes("button('P2 · 노출'")&&answer.includes("button('P3 · 증폭'")&&answer.includes("button('P4 · 응답'")&&answer.includes('Math.min(4')],
  ['developer controls retry after panel initialization',answer.includes('setTimeout(installDevControls,250)')&&answer.includes('setTimeout(installDevControls,1000)')],
  ['Void entry threat presentation supports 25 50 75 and 100 percent bands',answer.includes('data-band="25"')&&answer.includes('data-band="50"')&&answer.includes('data-band="75"')&&answer.includes('data-band="100"')&&answer.includes('setAnswerThreat')],
  ['entry threat changes shell cards and soft light spill, not only a white overlay',answer.includes('.answer-threat-spill')&&answer.includes('world-event-card{filter:saturate(.70)')&&answer.includes('shell.style.background=')],
  ['pre-fight preparation uses the canonical suction magnet path',answer.includes("typeof window.stackfallCollectSuctionMagnet==='function'")&&answer.includes('preview.preflightGemCount')&&answer.includes('preview.preflightXp')],
  ['preparation gate repairs only stale playing locks and owns its own lock',answer.includes('function staleChoiceLock()')&&answer.includes("state.mode==='playing'&&state.choiceLocked===true&&state.choiceOpening!==true&&hidden")&&answer.includes('function acquirePreparationGate()')&&answer.includes('preview.choiceGateOwned=true')&&answer.includes('function releasePreparationGate()')],
  ['developer Answer start keeps the full canonical preparation path',answer.includes("button('응답 시안 시작','devAnswerStart',()=>activate(),true)")&&answer.includes('function activate(){return beginPreparation();}')&&answer.includes('function advancePreparation()')],
  ['pre-fight preparation defers level choices until all field XP is physically collected',answer.includes('state.choiceLocked=true')&&answer.includes('activeExperienceGems().length')&&answer.includes('releasePreparationGate()')&&answer.includes('tryLevelUp()')],
  ['encounter begins only after all pending level ups are resolved',answer.includes("state.mode!=='playing'||state.choiceLocked||state.xp>=state.xpNeed")&&answer.includes('activatePreparedEncounter()')],
  ['defeat sequence leaks white light then leaves brighter aftermath state',answer.includes('startDefeat')&&answer.includes('finishDefeat')&&answer.includes('drawAftermathOverlay')&&answer.includes('state.answerVoidSealed=true')],
  ['developer preview controls are isolated to dev mode',answer.includes("document.querySelector('#stackfallDevPanel')")&&answer.includes('if(!dev?.enabled||!panel')],
  ['dynamic loader includes the prototype',buildInfo.includes('src/void-apex-answer-v1.js')&&buildInfo.includes('data-void-apex-answer-v1')],
  ['build fingerprint tracks the prototype source and contract without a mutable binary body asset',fingerprint.includes("'src/void-apex-answer-v1.js'")&&fingerprint.includes("'void-apex-answer-contract.mjs'")&&!fingerprint.includes("'assets/answer/answer_body_base.webp'")]
];
let failed=0;
for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}
console.log(`Checked ${checks.length} Void Apex Answer prototype contracts; failures=${failed}`);
if(failed)process.exit(1);
