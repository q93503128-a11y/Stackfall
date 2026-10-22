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
const wait=ms=>page.waitForTimeout(ms);
async function stopFollow(){await page.evaluate(()=>{clearInterval(window.__eventQaFollow);window.__eventQaFollow=null;});}
async function clean(){
  await stopFollow();
  await page.evaluate(()=>{
    window.stackfallDeveloperTest.startEndless();window.stackfallSetGameSpeed?.(10,{silent:true});state.mode='playing';state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;player.invuln=9999;state.xp=0;state.xpNeed=1e9;window.closeMapEventOverlays?.();document.querySelector('#worldEventScreen')?.classList.add('hidden');
  });
  await wait(100);
}
async function start(type){
  await clean();const r=await page.evaluate(type=>window.stackfallDeveloperTest.spawnEndlessEvent(type,true),type);assert(r?.ok,`${type}: spawn failed ${JSON.stringify(r)}`);await page.waitForFunction(type=>state.mapEventActive?.type===type,type,{timeout:3000});await wait(120);
}
async function snap(type,label='active'){await page.screenshot({path:path.join(out,`${type}-${label}.png`),fullPage:false});}
async function hud(){return page.evaluate(()=>({text:worldEventCombatTimer.textContent.trim(),refined:!!worldEventCombatTimer.querySelector('.event-progress-main'),outside:worldEventCombatTimer.classList.contains('event-outside')}));}
async function reward(){await page.waitForFunction(()=>state.mode==='worldEvent'&&document.querySelectorAll('#worldEventCards .world-event-card').length===3,{timeout:3500});return page.evaluate(()=>({mode:state.mode,cards:document.querySelectorAll('#worldEventCards .world-event-card').length,title:document.querySelector('#worldEventTitle')?.textContent||''}));}
async function timeoutFail(type,anchor='center'){
  await start(type);await page.evaluate(anchor=>{const ev=state.mapEventActive;ev.remainingTime=.35;const p=ev[anchor]||ev.center||ev.point;player.x=p.x+700;player.y=p.y;},anchor);await wait(300);const s=await page.evaluate(()=>({active:state.mapEventActive?.type||null,mode:state.mode,cards:document.querySelectorAll('#worldEventCards .world-event-card').length}));assert(s.active===null&&s.mode!=='worldEvent',`${type}: timeout failure did not resolve`);return s;
}

await start('distress');
await page.evaluate(()=>{const ev=state.mapEventActive;window.__eventQaFollow=setInterval(()=>{if(state.mapEventActive===ev){player.x=ev.center.x;player.y=ev.center.y;}},10);});await wait(420);await stopFollow();
const distressInside=await page.evaluate(()=>state.mapEventActive.hold);await page.evaluate(()=>{const ev=state.mapEventActive;player.x=ev.center.x+700;player.y=ev.center.y;});await wait(260);const distressOutside=await page.evaluate(()=>state.mapEventActive.hold),distressHud=await hud();assert(distressInside>2.5&&distressOutside<distressInside-.8,'distress: natural outside decay failed');assert(distressHud.refined&&/구조 확보|RESCUE SECURE/.test(distressHud.text),'distress: refined HUD overwritten');await snap('distress');
await page.evaluate(()=>{const ev=state.mapEventActive;ev.hold=ev.targetHold-.12;window.__eventQaFollow=setInterval(()=>{if(state.mapEventActive===ev){player.x=ev.center.x;player.y=ev.center.y;}},10);});const distressReward=await reward();await stopFollow();const distressFail=await timeoutFail('distress');results.events.distress={inside:distressInside,afterOutside:distressOutside,hud:distressHud,reward:distressReward,failure:distressFail,pass:true};

await start('meteor');
await page.evaluate(()=>{const ev=state.mapEventActive;window.__eventQaFollow=setInterval(()=>{if(state.mapEventActive===ev){player.x=ev.center.x;player.y=ev.center.y;}},10);});await wait(430);await stopFollow();const meteorInside=await page.evaluate(()=>state.mapEventActive.progress);await page.evaluate(()=>{const ev=state.mapEventActive;player.x=ev.center.x+700;player.y=ev.center.y;});await wait(300);const meteorOutside=await page.evaluate(()=>state.mapEventActive.progress),meteorHud=await hud();assert(meteorInside>2.5&&meteorOutside<meteorInside,'meteor: natural outside decay failed');assert(meteorHud.refined&&/채굴 동기화|MINING SYNC/.test(meteorHud.text),'meteor: refined HUD overwritten');await snap('meteor');
await page.evaluate(()=>{const ev=state.mapEventActive;ev.progress=ev.target-.12;window.__eventQaFollow=setInterval(()=>{if(state.mapEventActive===ev){player.x=ev.center.x;player.y=ev.center.y;}},10);});const meteorReward=await reward();await stopFollow();const meteorFail=await timeoutFail('meteor');results.events.meteor={inside:meteorInside,afterOutside:meteorOutside,hud:meteorHud,reward:meteorReward,failure:meteorFail,pass:true};

await start('predator');
const predatorKills=await page.evaluate(()=>{const ev=state.mapEventActive;const make=(x,y)=>{const e=spawnEnemy('normal');e.x=x;e.y=y;e.hp=1;return e;};const outside=make(ev.center.x+500,ev.center.y);killEnemy(outside,{source:'qa'});const afterOutside=ev.kills;const inside=make(ev.center.x,ev.center.y);killEnemy(inside,{source:'qa'});return{afterOutside,afterInside:ev.kills,target:ev.target};});await wait(220);const predatorHud=await hud();assert(predatorKills.afterOutside===0&&predatorKills.afterInside===1,'predator: kill boundary failed');assert(predatorHud.refined&&/포식핵 포화|CORE SATURATION/.test(predatorHud.text),'predator: refined HUD overwritten');await snap('predator');await page.evaluate(()=>{state.mapEventActive.kills=state.mapEventActive.target;});const predatorReward=await reward();const predatorFail=await timeoutFail('predator');results.events.predator={...predatorKills,hud:predatorHud,reward:predatorReward,failure:predatorFail,pass:true};

await start('relay');
await page.evaluate(()=>{const ev=state.mapEventActive;window.__eventQaFollow=setInterval(()=>{if(state.mapEventActive===ev){player.x=ev.point.x;player.y=ev.point.y;}},10);});await wait(170);await stopFollow();const relayInside=await page.evaluate(()=>state.mapEventActive.hold);await page.evaluate(()=>{const ev=state.mapEventActive;player.x=ev.point.x+500;player.y=ev.point.y;});await wait(170);const relayOutside=await page.evaluate(()=>state.mapEventActive.hold),relayHud=await hud();assert(relayInside>.7&&relayOutside<relayInside,'relay: natural outside decay failed');assert(relayHud.refined&&/노드 1\/3|NODE 1\/3/.test(relayHud.text),'relay: refined HUD overwritten');await snap('relay');
const relaySequence=[];for(let i=0;i<3;i++){await page.evaluate(()=>{const ev=state.mapEventActive;if(!ev)return;ev.hold=ev.targetHold-.12;window.__eventQaFollow=setInterval(()=>{if(state.mapEventActive===ev){player.x=ev.point.x;player.y=ev.point.y;}},10);});if(i<2){await page.waitForFunction(expected=>state.mapEventActive?.index===expected,i+1,{timeout:2000});relaySequence.push(i+1);await stopFollow();}else{await reward();relaySequence.push(3);await stopFollow();}}assert(relaySequence.join(',')==='1,2,3','relay: node sequence failed');const relayFail=await timeoutFail('relay','point');results.events.relay={inside:relayInside,afterOutside:relayOutside,hud:relayHud,sequence:relaySequence,failure:relayFail,pass:true};

await start('storm');
await page.evaluate(()=>{const ev=state.mapEventActive;window.__eventQaFollow=setInterval(()=>{if(state.mapEventActive===ev){player.x=ev.center.x+1000;player.y=ev.center.y;}},10);});await wait(900);const stormOutsideHud=await hud();assert(stormOutsideHud.refined&&stormOutsideHud.outside&&/폭풍의 눈 동기화|STORM-EYE SYNC/.test(stormOutsideHud.text),'storm: outside warning HUD missing');await snap('storm','outside');await page.waitForFunction(()=>state.mapEventActive===null,{timeout:5200});await stopFollow();const stormFail=await page.evaluate(()=>({active:state.mapEventActive,mode:state.mode,cards:document.querySelectorAll('#worldEventCards .world-event-card').length}));assert(stormFail.mode!=='worldEvent'&&stormFail.cards===0,'storm: outside survival incorrectly rewarded');

await start('storm');
await page.evaluate(()=>{const ev=state.mapEventActive;window.__eventQaFollow=setInterval(()=>{if(state.mapEventActive===ev){player.x=ev.center.x;player.y=ev.center.y;}},10);});await wait(900);const stormInside=await page.evaluate(()=>({safe:state.mapEventActive.refinedSafe,elapsed:state.mapEventActive.refinedElapsed})),stormHud=await hud();assert(stormInside.safe>5&&stormHud.refined&&!stormHud.outside,'storm: natural safe sync failed');await snap('storm','inside');const stormReward=await reward();await stopFollow();results.events.storm={outsideHud:stormOutsideHud,outsideFailure:stormFail,inside:stormInside,hud:stormHud,reward:stormReward,pass:true};

results.consoleErrors=[...consoleErrors];results.pageErrors=[...pageErrors];if(consoleErrors.length||pageErrors.length)results.ok=false;fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(results,null,2));await browser.close();if(!results.ok){console.error(JSON.stringify(results,null,2));process.exit(1);}console.log(JSON.stringify(results,null,2));
