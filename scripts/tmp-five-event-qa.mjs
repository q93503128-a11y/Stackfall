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

const result={ok:true,events:{},consoleErrors,pageErrors};
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const wait=ms=>page.waitForTimeout(ms);
async function stopFollow(){await page.evaluate(()=>{clearInterval(window.__qaFollow);window.__qaFollow=null;});}
async function clean(){await stopFollow();await page.evaluate(()=>{window.stackfallDeveloperTest.startEndless();window.stackfallSetGameSpeed?.(1,{silent:true});state.mode='playing';state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;player.invuln=9999;state.xp=0;state.xpNeed=1e9;window.closeMapEventOverlays?.();});await wait(100);}
async function start(type){await clean();const spawned=await page.evaluate(type=>window.stackfallDeveloperTest.spawnEndlessEvent(type,true),type);assert(spawned?.ok,`${type}: spawn failed ${JSON.stringify(spawned)}`);await page.waitForFunction(type=>state.mapEventActive?.type===type,type,{timeout:3000});await wait(120);await page.evaluate(()=>window.stackfallSetGameSpeed?.(10,{silent:true}));await wait(100);}
async function follow(prop='center',offset=0){await page.evaluate(({prop,offset})=>{const ev=state.mapEventActive;clearInterval(window.__qaFollow);window.__qaFollow=setInterval(()=>{if(state.mapEventActive!==ev)return;const p=ev[prop]||ev.center||ev.point;player.x=p.x+offset;player.y=p.y;},10);},{prop,offset});}
async function hud(){return page.evaluate(()=>({text:worldEventCombatTimer.textContent.trim(),refined:!!worldEventCombatTimer.querySelector('.event-progress-main'),outside:worldEventCombatTimer.classList.contains('event-outside')}));}
async function shot(name){await page.screenshot({path:path.join(out,`${name}.png`),fullPage:false});}
async function waitReward(){await page.waitForFunction(()=>state.mode==='worldEvent'&&document.querySelectorAll('#worldEventCards .world-event-card').length===3,{timeout:4000});return page.evaluate(()=>({title:worldEventTitle.textContent,cards:document.querySelectorAll('#worldEventCards .world-event-card').length}));}
async function forceTimeout(type,anchor='center'){await start(type);await page.evaluate(anchor=>{const ev=state.mapEventActive,point=ev[anchor]||ev.center||ev.point;player.x=point.x+700;player.y=point.y;ev.remainingTime=.25;},anchor);await page.waitForFunction(()=>state.mapEventActive===null,{timeout:2500});return page.evaluate(()=>({mode:state.mode,cards:document.querySelectorAll('#worldEventCards .world-event-card').length}));}

try{
  await start('distress');await follow('center');await wait(430);await stopFollow();const dIn=await page.evaluate(()=>state.mapEventActive.hold);await follow('center',700);await wait(280);await stopFollow();const dOut=await page.evaluate(()=>state.mapEventActive.hold),dHud=await hud();assert(dIn>2.5&&dOut<dIn-.8,'distress decay failed');assert(dHud.refined&&/구조 확보|RESCUE SECURE/.test(dHud.text),'distress HUD overwritten');await shot('distress-active');await page.evaluate(()=>{const ev=state.mapEventActive;ev.hold=ev.targetHold-.2;});await follow('center');const dReward=await waitReward();await stopFollow();const dFail=await forceTimeout('distress');result.events.distress={inside:dIn,outside:dOut,hud:dHud,reward:dReward,failure:dFail};

  await start('meteor');await follow('center');await wait(450);await stopFollow();const mIn=await page.evaluate(()=>state.mapEventActive.progress);await follow('center',700);await wait(300);await stopFollow();const mOut=await page.evaluate(()=>state.mapEventActive.progress),mHud=await hud();assert(mIn>2.5&&mOut<mIn,'meteor decay failed');assert(mHud.refined&&/채굴 동기화|MINING SYNC/.test(mHud.text),'meteor HUD overwritten');await shot('meteor-active');await page.evaluate(()=>{const ev=state.mapEventActive;ev.progress=ev.target-.2;});await follow('center');const mReward=await waitReward();await stopFollow();const mFail=await forceTimeout('meteor');result.events.meteor={inside:mIn,outside:mOut,hud:mHud,reward:mReward,failure:mFail};

  await start('predator');const p=await page.evaluate(()=>{const ev=state.mapEventActive;const make=(x,y)=>{const e=spawnEnemy('normal');e.x=x;e.y=y;e.hp=1;return e;};const outside=make(ev.center.x+500,ev.center.y);killEnemy(outside,{source:'qa'});const afterOutside=ev.kills;const inside=make(ev.center.x,ev.center.y);killEnemy(inside,{source:'qa'});return{afterOutside,afterInside:ev.kills,target:ev.target};});await wait(250);const pHud=await hud();assert(p.afterOutside===0&&p.afterInside===1,'predator boundary failed');assert(pHud.refined&&/포식핵 포화|CORE SATURATION/.test(pHud.text),'predator HUD overwritten');await shot('predator-active');await page.evaluate(()=>{state.mapEventActive.kills=state.mapEventActive.target;});const pReward=await waitReward();const pFail=await forceTimeout('predator');result.events.predator={...p,hud:pHud,reward:pReward,failure:pFail};

  await start('relay');await follow('point');await wait(190);await stopFollow();const rIn=await page.evaluate(()=>state.mapEventActive.hold);await follow('point',500);await wait(190);await stopFollow();const rOut=await page.evaluate(()=>state.mapEventActive.hold),rHud=await hud();assert(rIn>.7&&rOut<rIn,'relay decay failed');assert(rHud.refined&&/노드 1\/3|NODE 1\/3/.test(rHud.text),'relay HUD overwritten');await shot('relay-active');const seq=[];for(let i=0;i<3;i++){await page.evaluate(()=>{const ev=state.mapEventActive;ev.hold=ev.targetHold-.2;});await follow('point');if(i<2){await page.waitForFunction(expected=>state.mapEventActive?.index===expected,i+1,{timeout:2500});seq.push(i+1);await stopFollow();}else{await waitReward();seq.push(3);await stopFollow();}}assert(seq.join(',')==='1,2,3','relay sequence failed');const rFail=await forceTimeout('relay','point');result.events.relay={inside:rIn,outside:rOut,hud:rHud,sequence:seq,failure:rFail};

  await start('storm');await follow('center',1000);await wait(950);const sOutHud=await hud();assert(sOutHud.refined&&sOutHud.outside&&/폭풍의 눈 동기화|STORM-EYE SYNC/.test(sOutHud.text),'storm outside HUD missing');await shot('storm-outside');await page.waitForFunction(()=>state.mapEventActive===null,{timeout:5200});await stopFollow();const sFail=await page.evaluate(()=>({mode:state.mode,cards:document.querySelectorAll('#worldEventCards .world-event-card').length}));assert(sFail.mode!=='worldEvent'&&sFail.cards===0,'storm outside survival rewarded');

  await start('storm');await follow('center');await wait(950);const sMid=await page.evaluate(()=>({safe:state.mapEventActive.refinedSafe,elapsed:state.mapEventActive.refinedElapsed})),sHud=await hud();assert(sMid.safe>5&&sHud.refined&&!sHud.outside,'storm sync failed');await shot('storm-inside');const sReward=await waitReward();await stopFollow();result.events.storm={outsideHud:sOutHud,failure:sFail,inside:sMid,hud:sHud,reward:sReward};
}catch(error){result.ok=false;result.error=String(error.stack||error);}
result.consoleErrors=[...consoleErrors];result.pageErrors=[...pageErrors];if(consoleErrors.length||pageErrors.length)result.ok=false;
fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));await browser.close();console.log(JSON.stringify(result,null,2));if(!result.ok)process.exit(1);
