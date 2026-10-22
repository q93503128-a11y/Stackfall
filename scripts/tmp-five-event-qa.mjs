import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const out='test-results/five-event-refinement';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const consoleErrors=[],pageErrors=[];
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
page.on('pageerror',e=>pageErrors.push(String(e.stack||e)));
await page.goto('http://127.0.0.1:8000/?dev=1',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.stackfallDeveloperTest?.enabled&&window.stackfallEndlessEventRefinement?.mounted,{timeout:15000});

const results={ok:true,consoleErrors,pageErrors,events:{}};
const assert=(cond,msg)=>{if(!cond){results.ok=false;throw new Error(msg);}};
async function clean(){await page.evaluate(()=>{window.stackfallDeveloperTest.startEndless();state.mode='playing';state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;player.invuln=9999;state.xp=0;state.xpNeed=1e9;window.closeMapEventOverlays?.();document.querySelector('#worldEventScreen')?.classList.add('hidden');});await page.waitForTimeout(80);}
async function start(type){await clean();const r=await page.evaluate(type=>window.stackfallDeveloperTest.spawnEndlessEvent(type,true),type);assert(r?.ok,`${type}: spawn failed ${JSON.stringify(r)}`);await page.waitForFunction(type=>state.mapEventActive?.type===type,type,{timeout:3000});}
async function snap(type,label){await page.screenshot({path:path.join(out,`${type}-${label}.png`),fullPage:false});}
async function rewardVisible(){await page.waitForTimeout(520);return page.evaluate(()=>({mode:state.mode,cards:document.querySelectorAll('#worldEventCards .world-event-card').length,hidden:document.querySelector('#worldEventScreen')?.classList.contains('hidden')}));}
async function failByTimeout(type){await start(type);const r=await page.evaluate(type=>{const ev=state.mapEventActive;ev.remainingTime=.01;if(type==='distress'||type==='meteor'||type==='relay'){player.x=(ev.center||ev.point).x+700;player.y=(ev.center||ev.point).y;}window.updateMapEvents(.1);return{active:state.mapEventActive?.type||null,mode:state.mode};},type);assert(r.active===null,`${type}: timeout did not fail`);return r;}

// Distress: progress grows inside and is lost outside.
await start('distress');
let d=await page.evaluate(()=>{const ev=state.mapEventActive;player.x=ev.center.x;player.y=ev.center.y;window.updateMapEvents(2);const inside=ev.hold;player.x=ev.center.x+600;player.y=ev.center.y;window.updateMapEvents(1);return{inside,afterOutside:ev.hold,hud:worldEventCombatTimer.textContent,snap:stackfallEndlessEventRefinement.snapshot()};});
assert(d.inside>1.9&&d.afterOutside<d.inside-.9,'distress: outside does not decay hold');assert(/구조 확보|RESCUE SECURE/.test(d.hud),'distress: progress HUD missing');
await snap('distress','active');
await page.evaluate(()=>{const ev=state.mapEventActive;player.x=ev.center.x;player.y=ev.center.y;ev.hold=ev.targetHold-.05;window.updateMapEvents(.1);});
let rw=await rewardVisible();assert(rw.mode==='worldEvent'&&rw.cards===3,'distress: reward did not open');await failByTimeout('distress');results.events.distress={...d,reward:rw,pass:true};

// Meteor: sync increases near, decreases away.
await start('meteor');
let m=await page.evaluate(()=>{const ev=state.mapEventActive;player.x=ev.center.x;player.y=ev.center.y;window.updateMapEvents(2);const inside=ev.progress;player.x=ev.center.x+700;player.y=ev.center.y;window.updateMapEvents(2);return{inside,afterOutside:ev.progress,hud:worldEventCombatTimer.textContent,snap:stackfallEndlessEventRefinement.snapshot()};});
assert(m.inside>1.8&&m.afterOutside<m.inside,'meteor: outside does not reduce sync');assert(/채굴 동기화|MINING SYNC/.test(m.hud),'meteor: progress HUD missing');await snap('meteor','active');
await page.evaluate(()=>{const ev=state.mapEventActive;player.x=ev.center.x;player.y=ev.center.y;ev.progress=ev.target-.05;window.updateMapEvents(.1);});rw=await rewardVisible();assert(rw.mode==='worldEvent'&&rw.cards===3,'meteor: reward did not open');await failByTimeout('meteor');results.events.meteor={...m,reward:rw,pass:true};

// Predator: only kills inside the field count.
await start('predator');
let p=await page.evaluate(()=>{const ev=state.mapEventActive;const make=(x,y)=>{const e=spawnEnemy('normal');e.x=x;e.y=y;e.hp=1;return e;};const outside=make(ev.center.x+500,ev.center.y);killEnemy(outside,{source:'qa'});const afterOutside=ev.kills;const inside=make(ev.center.x,ev.center.y);killEnemy(inside,{source:'qa'});window.updateMapEvents(.02);return{afterOutside,afterInside:ev.kills,hud:worldEventCombatTimer.textContent,target:ev.target,snap:stackfallEndlessEventRefinement.snapshot()};});
assert(p.afterOutside===0&&p.afterInside===1,'predator: kill boundary is wrong');assert(/포식핵 포화|CORE SATURATION/.test(p.hud),'predator: progress HUD missing');await snap('predator','active');
await page.evaluate(()=>{const ev=state.mapEventActive;ev.kills=ev.target;window.updateMapEvents(.02);});rw=await rewardVisible();assert(rw.mode==='worldEvent'&&rw.cards===3,'predator: reward did not open');await failByTimeout('predator');results.events.predator={...p,reward:rw,pass:true};

// Relay: leaving a node loses hold and nodes advance in sequence.
await start('relay');
let r=await page.evaluate(()=>{const ev=state.mapEventActive;player.x=ev.point.x;player.y=ev.point.y;window.updateMapEvents(1);const inside=ev.hold;player.x=ev.point.x+400;player.y=ev.point.y;window.updateMapEvents(1);return{inside,afterOutside:ev.hold,index:ev.index,hud:worldEventCombatTimer.textContent,snap:stackfallEndlessEventRefinement.snapshot()};});
assert(r.inside>.9&&r.afterOutside<r.inside,'relay: leaving node does not reduce hold');assert(/노드 1\/3|NODE 1\/3/.test(r.hud),'relay: node HUD missing');await snap('relay','active');
let seq=await page.evaluate(()=>{const indices=[];for(let n=0;n<3;n++){const ev=state.mapEventActive;if(!ev)break;player.x=ev.point.x;player.y=ev.point.y;ev.hold=ev.targetHold-.05;window.updateMapEvents(.1);indices.push(state.mapEventActive?.index??3);}return indices;});assert(seq[0]===1&&seq[1]===2,'relay: nodes did not advance sequentially');rw=await rewardVisible();assert(rw.mode==='worldEvent'&&rw.cards===3,'relay: reward did not open');await failByTimeout('relay');results.events.relay={...r,sequence:seq,reward:rw,pass:true};

// Storm: outside survival must fail; tracking the eye must complete.
await start('storm');
let sf=await page.evaluate(()=>{const ev=state.mapEventActive;for(let i=0;i<45&&state.mapEventActive===ev;i++){player.x=ev.center.x+1000;player.y=ev.center.y;window.updateMapEvents(1);}return{active:state.mapEventActive?.type||null,mode:state.mode,overlayHidden:document.querySelector('#worldEventScreen').classList.contains('hidden')};});
assert(sf.active===null&&sf.mode!=='worldEvent','storm: staying outside still completes/rewards');
await start('storm');
let s=await page.evaluate(()=>{const ev=state.mapEventActive;for(let i=0;i<7;i++){player.x=ev.center.x;player.y=ev.center.y;window.updateMapEvents(1);}return{safe:ev.refinedSafe,elapsed:ev.refinedElapsed,hud:worldEventCombatTimer.textContent,snap:stackfallEndlessEventRefinement.snapshot()};});
assert(s.safe>6.8&&/폭풍의 눈 동기화|STORM-EYE SYNC/.test(s.hud),'storm: safe progress/HUD missing');await snap('storm','active');
await page.evaluate(()=>{const ev=state.mapEventActive;ev.refinedSafe=ev.refinedTargetSafe-.05;player.x=ev.center.x;player.y=ev.center.y;window.updateMapEvents(.1);});rw=await rewardVisible();assert(rw.mode==='worldEvent'&&rw.cards===3,'storm: tracking eye did not reward');results.events.storm={outsideFailure:sf,...s,reward:rw,pass:true};

results.consoleErrors=[...consoleErrors];results.pageErrors=[...pageErrors];if(consoleErrors.length||pageErrors.length)results.ok=false;
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(results,null,2));
await browser.close();
if(!results.ok){console.error(JSON.stringify(results,null,2));process.exit(1);}console.log(JSON.stringify(results,null,2));
