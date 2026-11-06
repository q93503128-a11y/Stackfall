import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir,platform} from 'node:os';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const urlArg=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6)||process.env.STACKFALL_URL||'http://127.0.0.1:8000/';
const output=resolve(process.argv.find(arg=>arg.startsWith('--output='))?.slice(9)||join(root,'test-results','void-apex-answer'));
const screenshots=join(output,'screenshots'),reportPath=join(output,'report.json');
const sleep=ms=>new Promise(done=>setTimeout(done,ms)),checks=[],failures=[],exceptions=[],consoleErrors=[];
const profile=mkdtempSync(join(tmpdir(),'stackfall-answer-qa-'));
let browser=null,debugPort=0,page=null;

function chromeCandidates(){
  const explicit=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH].filter(Boolean);
  if(platform()==='win32')return[...explicit,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',join(process.env.LOCALAPPDATA||'','Google','Chrome','Application','chrome.exe'),'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'];
  if(platform()==='darwin')return[...explicit,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'];
  return[...explicit,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/microsoft-edge'];
}
function check(name,condition,detail=''){checks.push({name,ok:!!condition,detail});if(!condition)failures.push(name+(detail?': '+detail:''));}
async function waitPort(){
  const file=join(profile,'DevToolsActivePort'),started=Date.now();
  while(Date.now()-started<15000){if(browser?.exitCode!==null)throw new Error('Chrome exited before CDP startup');if(existsSync(file)){debugPort=Number(readFileSync(file,'utf8').trim().split(/\r?\n/)[0]);if(debugPort)return;}await sleep(100);}
  throw new Error('Chrome DevToolsActivePort timed out');
}
async function endpoint(path,options={}){const response=await fetch('http://127.0.0.1:'+debugPort+path,options);if(!response.ok)throw new Error('Chrome endpoint failed: '+path);return response.json();}
class Cdp{
  constructor(ws){this.id=0;this.pending=new Map();this.listeners=new Map();this.ready=new Promise((resolve,reject)=>{this.ws=new WebSocket(ws);this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true});this.ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const p=this.pending.get(message.id);if(!p)return;this.pending.delete(message.id);clearTimeout(p.timer);message.error?p.reject(new Error(message.error.message)):p.resolve(message.result);return;}for(const listener of this.listeners.get(message.method)||[])listener(message.params);});});}
  async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('CDP timeout: '+method));},timeout);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  on(method,listener){const listeners=this.listeners.get(method)||[];listeners.push(listener);this.listeners.set(method,listeners);}
  close(){this.ws?.close();}
}
async function evaluate(expression){
  const result=await page.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||'Browser evaluation failed');
  return result.result?.value;
}
async function waitFor(expression,timeout=8000){const started=Date.now();while(Date.now()-started<timeout){const value=await evaluate(expression);if(value)return value;await sleep(100);}return null;}
async function capture(name){mkdirSync(screenshots,{recursive:true});const result=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const path=join(screenshots,name+'.png');writeFileSync(path,Buffer.from(result.data,'base64'));return path;}
async function viewport(width,height,scale,mobile){await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:scale,mobile,screenWidth:width,screenHeight:height});await evaluate('window.dispatchEvent(new Event("resize"))');await sleep(350);}
async function setupEndless(threatTime=185){
  return evaluate(`(()=>{const api=window.stackfallDeveloperTest;if(!api?.enabled)return{ok:false,reason:'dev-tools-disabled'};api.startEndless();api.setInvincible(false);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.spawnTimer=state.encounterTimer=99999;state.nextApexAt=1e9;state.time=${threatTime};state.threat=1+Math.floor(state.time/60);state.eventGlobalCooldown=0;for(const k of Object.keys(state.eventClocks||{}))state.eventClocks[k]=1e9;updateHUD();return{ok:true,mode:state.mode,threat:state.threat};})()`);
}
async function prepareVoidEntry(){
  return evaluate(`(()=>{const api=window.stackfallDeveloperTest;state.entities.mapEvents.length=0;state.mapEventActive=null;state.lastMapEventType='crash';state.eventGlobalCooldown=0;const result=api.spawnEndlessEvent('void',true);return{result,mode:state.mode,threat:state.threat,active:state.mapEventActive?.type||null,panel:document.querySelector('#worldEventScreen')?.dataset.voidPanel||null};})()`);
}

try{
  const chromePath=chromeCandidates().find(candidate=>candidate&&existsSync(candidate));if(!chromePath)throw new Error('Chrome or Edge was not found. Set STACKFALL_CHROME.');
  browser=spawn(chromePath,['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1920,1080','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','about:blank'],{stdio:'ignore',windowsHide:true});
  await waitPort();const target=await endpoint('/json/new?about:blank',{method:'PUT'});page=new Cdp(target.webSocketDebuggerUrl);await page.ready;
  page.on('Runtime.exceptionThrown',event=>exceptions.push(event.exceptionDetails?.exception?.description||event.exceptionDetails?.text||'Unknown exception'));
  page.on('Runtime.consoleAPICalled',event=>{if(['warning','error'].includes(event.type))consoleErrors.push({level:event.type,text:event.args.map(arg=>arg.value??arg.description??'').join(' ')});});
  await Promise.all(['Page.enable','Runtime.enable','Network.enable'].map(method=>page.send(method)));
  const targetUrl=new URL(urlArg);targetUrl.searchParams.set('dev','1');
  const loaded=new Promise(resolve=>page.on('Page.loadEventFired',resolve));await page.send('Page.navigate',{url:targetUrl.href});await Promise.race([loaded,sleep(12000)]);await waitFor("document.readyState==='complete'",5000);await sleep(4200);
  check('developer tools and Answer prototype loaded',await evaluate("!!window.stackfallDeveloperTest?.enabled&&typeof window.stackfallAnswerCombatForcePattern==='function'"));

  const started=await setupEndless(185);check('endless developer setup',started?.ok===true&&started.mode==='playing',JSON.stringify(started));
  const entry=await prepareVoidEntry();await waitFor("document.querySelector('#worldEventScreen:not(.hidden)')&&document.querySelector('#worldEventStatus')?.textContent.trim()",5000);
  const panel=await evaluate("(()=>({type:document.querySelector('#worldEventScreen')?.dataset.eventType,panel:document.querySelector('#worldEventScreen')?.dataset.voidPanel,status:document.querySelector('#worldEventStatus')?.textContent.trim(),cards:document.querySelectorAll('#worldEventCards .world-event-card').length,threat:state.threat,mode:state.mode}))()");
  check('Void entry opens through authored endless event flow',entry?.result?.ok===true&&panel.type==='void'&&panel.panel==='entry'&&panel.mode==='worldEvent',JSON.stringify({entry,panel}));
  check('Void entry shows real availability and the current threat integer',panel.status.includes('진입 가능')&&panel.status.includes(String(panel.threat)),JSON.stringify(panel));
  await capture('void-entry-desktop');
  await viewport(390,844,2,true);const mobilePanel=await evaluate("(()=>{const s=document.querySelector('#worldEventScreen .world-event-shell'),c=document.querySelector('#worldEventCards .world-event-card');return{innerWidth,scrollWidth:document.documentElement.scrollWidth,status:document.querySelector('#worldEventStatus')?.textContent.trim(),shell:s&&{left:s.getBoundingClientRect().left,right:s.getBoundingClientRect().right,width:s.getBoundingClientRect().width},card:c&&{width:c.getBoundingClientRect().width,height:c.getBoundingClientRect().height}}})()");
  check('Void entry layout fits a 390px mobile viewport',mobilePanel.scrollWidth<=390&&mobilePanel.shell?.left>=0&&mobilePanel.shell?.right<=390&&mobilePanel.card?.width>0,JSON.stringify(mobilePanel));await capture('void-entry-mobile');
  await evaluate("document.querySelector('#worldEventCards .world-event-card:first-child')?.click()");
  const normalVoid=await waitFor("state.mapEventActive?.type==='void'&&state.mapEventActive.bossId",7000);
  const normalVoidData=await evaluate("(()=>({type:state.mapEventActive?.type,boss:state.entities.enemies.find(e=>e.id===state.mapEventActive?.bossId),answer:state.answerVoidApexPreview===true}))()");
  check('existing Void entry still starts its ordinary Void boss',!!normalVoid&&normalVoidData.type==='void'&&normalVoidData.boss?.eventKind==='void'&&normalVoidData.answer===false,JSON.stringify({normalVoid,normalVoidData}));

  await setupEndless(245);const leaveSetup=await prepareVoidEntry();await waitFor("document.querySelector('#worldEventScreen:not(.hidden)')",5000);await evaluate("document.querySelector('#worldEventCards .world-event-card:last-child')?.click()");
  const left=await waitFor("state.mode==='playing'&&!state.mapEventActive",3000);check('Void entry leave choice preserves the ordinary exit flow',!!left&&leaveSetup.result?.ok===true);

  await viewport(1920,1080,1,false);const combatSetup=await setupEndless(0);const startAnswer=await evaluate("(()=>{const api=stackfallDeveloperTest;state.entities.enemies.length=0;state.entities.enemyProjectiles.length=0;state.entities.mapEvents.length=0;state.xp=0;state.xpNeed=1e9;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');api.setInvincible(false);api.setLevelUpsDisabled(true);const started=api.startAnswerPrototype();return{started,mode:state.mode,prep:stackfallVoidApexAnswerDiagnostics()?.prepStage,choiceLocked:state.choiceLocked,xp:state.xp,xpNeed:state.xpNeed};})()");
  const active=await waitFor("window.stackfallVoidApexAnswerDiagnostics?.()?.active===true&&window.stackfallAnswerCombatDiagnostics?.()?.active===true",10000);
  const initial=await evaluate("(()=>({visual:stackfallVoidApexAnswerDiagnostics(),combat:stackfallAnswerCombatDiagnostics(),patterns:stackfallAnswerPatternDiagnostics()}))()");
  check('Answer starts through its XP-safe preparation path and loads the body raster',!!active&&initial.visual.asset.ready&&initial.visual.asset.naturalWidth===960&&initial.visual.asset.naturalHeight===540&&initial.combat.phase===1,JSON.stringify({startAnswer,prep:initial.visual.prepStage,asset:initial.visual.asset,phase:initial.combat.phase,combatSetup}));if(!active)throw new Error('Answer prototype did not start: '+JSON.stringify({startAnswer,prep:initial.visual.prepStage}));
  await sleep(800);await capture('answer-p1-desktop');
  const startedAt=Date.now();

  await evaluate("(()=>{player.maxHp=1000;player.hp=1000;player.shield=0;player.invuln=10;return stackfallAnswerCombatForcePattern('spike');})()");
  await sleep(350);const spikeWarning=await evaluate("stackfallAnswerCombatDiagnostics()?.spikeDetails?.[0]");check('spike warning exposes exact timing and one phase-one target',spikeWarning?.warn===1.4&&spikeWarning?.thrust===.14&&spikeWarning?.hold===.35&&spikeWarning?.retract===.18&&initial.combat.phase===1,JSON.stringify(spikeWarning));
  if(spikeWarning)await evaluate("(()=>{const d=stackfallVoidApexAnswerDiagnostics(),s=stackfallAnswerCombatDiagnostics().spikeDetails[0];player.x=d.camera.x+s.aim.x-innerWidth/2;player.y=d.camera.y+s.aim.y-innerHeight/2;})()");
  await capture('answer-spike-warning-desktop');await sleep(1250);await capture('answer-spike-active-desktop');await sleep(500);
  const invulnerable=await evaluate("({hp:player.hp,shield:player.shield,invuln:player.invuln,active:stackfallAnswerCombatDiagnostics()?.spikes})");check('spike contact respects player invulnerability',invulnerable.hp===1000&&invulnerable.shield===0,JSON.stringify(invulnerable));
  await evaluate("(()=>{player.invuln=0;player.maxHp=1000;player.hp=1000;player.shield=250;state.passives.armor=2;return stackfallAnswerCombatForcePattern('spike');})()");
  const spike2=await evaluate("stackfallAnswerCombatDiagnostics()?.spikeDetails?.[0]");if(spike2)await evaluate("(()=>{const d=stackfallVoidApexAnswerDiagnostics(),s=stackfallAnswerCombatDiagnostics().spikeDetails[0];player.x=d.camera.x+s.aim.x-innerWidth/2;player.y=d.camera.y+s.aim.y-innerHeight/2;})()");await sleep(2100);
  const shield=await evaluate("({hp:player.hp,shield:player.shield,invuln:player.invuln})");check('spike damage uses shield and armor through hurtPlayer',shield.shield<250&&shield.hp===1000,JSON.stringify(shield));
  await sleep(Math.max(0,9000-(Date.now()-startedAt)));const natural=await evaluate("({combat:stackfallAnswerCombatDiagnostics(),patterns:stackfallAnswerPatternDiagnostics()})");
  check('natural phase-one director schedules its first split without force controls',natural.combat.major==='split'&&natural.patterns.major?.ratio>=.30&&natural.patterns.major?.ratio<=.70,JSON.stringify({major:natural.patterns.major,cd:natural.combat.majorCd}));await capture('answer-split-warning-desktop');
  const splitSetup=await evaluate("(()=>{let positioned=false,line=null,d=stackfallVoidApexAnswerDiagnostics();for(let attempt=0;attempt<24&&!positioned;attempt++){stackfallAnswerCombatForcePhase(1);stackfallAnswerCombatForcePattern('split');d=stackfallVoidApexAnswerDiagnostics();line=stackfallAnswerPatternDiagnostics().major.line;let x=innerWidth*.5,y=line.cy;if(Math.abs(Math.sin(line.a))>.12){y=innerHeight*.70;const t=(y-line.cy)/Math.sin(line.a);x=line.cx+Math.cos(line.a)*t;}positioned=x>innerWidth*.12&&x<innerWidth*.88&&y>innerHeight*.45&&y<innerHeight*.90;if(positioned){player.maxHp=1000;player.hp=1000;player.shield=0;player.invuln=0;player.x=d.camera.x+x-innerWidth/2;player.y=d.camera.y+y-innerHeight/2;}}return{positioned,line,major:stackfallAnswerPatternDiagnostics().major};})()");check('split warning selects a cut that crosses the lower combat region',splitSetup.positioned,JSON.stringify(splitSetup));await capture('answer-split-warning-desktop');
  const splitImpact=await waitFor("stackfallAnswerPatternDiagnostics()?.major?.impact===true",6000);await capture('answer-split-active-desktop');
  const splitActive=await evaluate("({major:stackfallAnswerPatternDiagnostics().major,body:stackfallVoidApexAnswerDiagnostics().asset})");check('split impact is one-shot, active and retains its shared width data',splitActive.major?.kind==='split'&&splitActive.major.impact===true&&splitActive.major.bandHalf===12,JSON.stringify(splitActive.major));
  const splitHit=await evaluate("({hp:player.hp,major:stackfallAnswerPatternDiagnostics().major})");check('the visible split edge applies one canonical hit on impact',splitHit.hp<1000&&splitHit.major?.impact===true,JSON.stringify(splitHit));const boundaryHp=splitHit.hp;await evaluate("(()=>{const d=stackfallVoidApexAnswerDiagnostics(),line=stackfallAnswerPatternDiagnostics().major.line;player.invuln=0;player.x=d.camera.x+line.cx-innerWidth/2;player.y=d.camera.y+line.cy-innerHeight/2;})()");await sleep(220);const boundary=await evaluate("({hp:player.hp,major:stackfallAnswerPatternDiagnostics().major})");check('touching the split barrier does not repeat its damage',boundary.hp===boundaryHp&&boundary.major?.impact===true,JSON.stringify(boundary));
  await waitFor("stackfallAnswerPatternDiagnostics()?.major===null",7000);const splitRestored=await evaluate("({major:stackfallAnswerPatternDiagnostics().major,recovery:stackfallAnswerPatternDiagnostics().majorRecovery})");check('split restores and starts the 1.5-second major recovery',!!splitImpact&&splitRestored.major===null&&splitRestored.recovery>=0&&splitRestored.recovery<=1.5,JSON.stringify(splitRestored));

  await evaluate("(()=>{const boss=stackfallAnswerCombatDiagnostics().boss;const e=state.entities.enemies.find(x=>x.answerBoss);dealDamage(e,e.hp*.26,{source:'browser-qa',canCrit:false});})()");const phase2=await waitFor("stackfallAnswerCombatDiagnostics()?.transition?.to===2",2500);check('natural HP crossing begins phase two at the 75 percent threshold',!!phase2);
  await sleep(1500);const p2=await evaluate("stackfallAnswerCombatDiagnostics()");check('phase two finishes after its 1.35-second crack transition',p2.phase===2&&!p2.transition,JSON.stringify({phase:p2.phase,transition:p2.transition}));
  await viewport(390,844,2,true);await evaluate("(()=>{const root=stackfallAnswerCombatDiagnostics().fissureRoot,d=stackfallVoidApexAnswerDiagnostics();player.maxHp=1000;player.hp=1000;player.shield=250;player.invuln=0;player.x=d.camera.x+root.x-innerWidth/2;player.y=d.camera.y+innerHeight*.75-innerHeight/2;return stackfallAnswerCombatForcePattern('beam');})()");const beamStart=await evaluate("({major:stackfallAnswerPatternDiagnostics().major,root:stackfallAnswerCombatDiagnostics().fissureRoot,screen:{width:innerWidth,height:innerHeight}})");check('P2 beam starts at the central fissure with a responsive 36px mobile width',beamStart.major?.kind==='beam'&&beamStart.major.width===36&&Math.abs(beamStart.root.x-195)<2,JSON.stringify(beamStart));await sleep(900);await capture('answer-beam-warning-mobile');await sleep(1150);await capture('answer-beam-active-mobile');
  const beamHit=await evaluate("({hp:player.hp,shield:player.shield})");check('P2 beam uses shield mitigation on its single firing hit',beamHit.hp===1000&&beamHit.shield<250,JSON.stringify(beamHit));
  await evaluate("stackfallAnswerCombatForcePattern('row')");const rowWarning=await evaluate("stackfallAnswerPatternDiagnostics().major");check('P2 row set contains four lanes and two harmless fakes',rowWarning?.kind==='row'&&rowWarning.count===4&&rowWarning.fakeCount===2,JSON.stringify(rowWarning));await capture('answer-row-warning-mobile');
  if(rowWarning?.fakeIndices?.length)await evaluate("(()=>{const d=stackfallVoidApexAnswerDiagnostics(),m=stackfallAnswerPatternDiagnostics().major,top=Math.max(Math.max(245,Math.min(330,innerHeight*.34))+26,innerHeight*.405),bottom=innerHeight*.925,lane=(bottom-top)/m.count,index=m.fakeIndices[0];player.hp=1000;player.shield=200;player.invuln=0;player.x=d.camera.x;player.y=d.camera.y+top+(index+.5)*lane-innerHeight/2;})()");
  await waitFor("stackfallAnswerPatternDiagnostics()?.major?.crumbled?.length===1",4500);const fakeTouch=await evaluate("({major:stackfallAnswerPatternDiagnostics().major,hp:player.hp,shield:player.shield})");check('touching a fake P2 row crumbles it without damage',fakeTouch.major?.crumbled?.length===1&&fakeTouch.hp===1000&&fakeTouch.shield===200,JSON.stringify(fakeTouch));await capture('answer-row-active-mobile');
  await evaluate("stackfallAnswerCombatForcePattern('row')");const trueRow=await evaluate("stackfallAnswerPatternDiagnostics().major");if(trueRow){const index=[0,1,2,3].find(i=>!trueRow.fakeIndices.includes(i));await evaluate(`(()=>{const d=stackfallVoidApexAnswerDiagnostics(),m=stackfallAnswerPatternDiagnostics().major,top=Math.max(Math.max(245,Math.min(330,innerHeight*.34))+26,innerHeight*.405),bottom=innerHeight*.925,lane=(bottom-top)/m.count,index=${index};player.hp=1000;player.shield=200;player.invuln=0;player.x=d.camera.x;player.y=d.camera.y+top+(index+.5)*lane-innerHeight/2;})()`);}await waitFor("stackfallAnswerPatternDiagnostics()?.major?.impact===true",4500);const trueRowHit=await evaluate("({major:stackfallAnswerPatternDiagnostics().major,hp:player.hp,shield:player.shield})");check('touching a true P2 row applies one canonical damage event',trueRowHit.major?.impact===true&&trueRowHit.shield<200,JSON.stringify(trueRowHit));

  await viewport(1920,1080,1,false);await evaluate("(()=>{const e=state.entities.enemies.find(x=>x.answerBoss);dealDamage(e,e.hp*.75,{source:'browser-qa',canCrit:false});})()");const phase3=await waitFor("stackfallAnswerCombatDiagnostics()?.transition?.to===3",2500);check('natural HP crossing begins phase three at the 30 percent threshold',!!phase3);const phase3Done=await waitFor("stackfallAnswerCombatDiagnostics()?.phase===3&&!stackfallAnswerCombatDiagnostics()?.transition",4000);check('phase three crack transition completes',!!phase3Done,JSON.stringify(await evaluate("({phase:stackfallAnswerCombatDiagnostics()?.phase,transition:stackfallAnswerCombatDiagnostics()?.transition})")));await capture('answer-p3-desktop');
  const ownedKeys=await evaluate("(()=>Object.keys(WEAPONS))()");const cloneKeys=[],testCloneKeys=[...new Set(['core',...ownedKeys])];
  for(const key of testCloneKeys){
    await evaluate(`(()=>{state.weaponSlots=${JSON.stringify(key==='core'?[]:[key])};state.weaponStacks=${JSON.stringify({[key]:1})};stackfallAnswerCombatForcePhase(3);return stackfallAnswerCombatForcePattern('clone');})()`);
    const clone=await evaluate("stackfallAnswerCombatDiagnostics()?.clones?.at(-1)?.key||null");if(clone)cloneKeys.push(clone);check('clone uses only owned weapon '+key,clone===key,String(clone));
  }
  await evaluate("(()=>{state.weaponSlots=[];state.weaponStacks={};stackfallAnswerCombatForcePhase(3);return true;})()");const unowned=await evaluate("(()=>({owned:stackfallAnswerPatternDiagnostics().cloneOwned,spawned:stackfallAnswerCombatForcePattern('clone'),clones:stackfallAnswerCombatDiagnostics().clones}))()");check('no unowned default clone is created',unowned.owned.length===0&&unowned.spawned===false&&unowned.clones.length===0,JSON.stringify(unowned));
  await evaluate("(()=>{state.weaponSlots=['missile'];state.weaponStacks={missile:1};stackfallAnswerCombatForcePhase(3);player.invuln=10;stackfallAnswerCombatForcePattern('clone');})()");await sleep(200);await capture('answer-p3-missile-clone-desktop');
  const finalDiag=await evaluate("({visual:stackfallVoidApexAnswerDiagnostics(),combat:stackfallAnswerCombatDiagnostics(),patterns:stackfallAnswerPatternDiagnostics()})");
  check('clone roster covers every catalogued owned weapon identity',new Set(cloneKeys).size===testCloneKeys.length,JSON.stringify({expected:testCloneKeys.length,seen:[...new Set(cloneKeys)]}));
  const finalOwnership=await evaluate("(()=>({owned:stackfallAnswerPatternDiagnostics().cloneOwned,valid:stackfallAnswerPatternDiagnostics().cloneOwned.every(k=>k==='core'?weaponCount('core')>0:state.weaponSlots.includes(k)&&weaponCount(k)>0),event:state.mapEventActive?.type||null,prototypeOnly:window.STACKFALL_VOID_APEX_ANSWER_PROTOTYPE_ONLY===true}))()");
  check('Answer dev clone roster matches only actual owned inventory',finalDiag.visual.active===true&&finalOwnership.valid&&finalOwnership.prototypeOnly&&finalOwnership.event===null&&!finalDiag.visual.voidSealed,JSON.stringify({active:finalDiag.visual.active,...finalOwnership,sealed:finalDiag.visual.voidSealed,mode:finalDiag.visual.mode}));
  check('no uncaught browser exceptions',exceptions.length===0,exceptions.join(' | '));
  check('no browser console errors',consoleErrors.filter(x=>x.level==='error').length===0,JSON.stringify(consoleErrors));
  mkdirSync(output,{recursive:true});writeFileSync(reportPath,JSON.stringify({ok:failures.length===0,startedAt:new Date().toISOString(),url:urlArg,checks,failures,exceptions,consoleErrors,screenshots:screenshots,chrome:chromeCandidates().find(x=>x&&existsSync(x))},null,2));
  console.log(JSON.stringify({ok:failures.length===0,passed:checks.filter(x=>x.ok).length,total:checks.length,failures,screenshots,report:reportPath},null,2));
}catch(error){failures.push(error.stack||String(error));console.error(error.stack||error);}
finally{
  try{page?.close();if(page?.targetId)await endpoint('/json/close/'+page.targetId);}catch{}
  if(browser&&browser.exitCode===null){browser.kill();await new Promise(resolve=>browser.once('exit',resolve));}
  const tempRoot=resolve(tmpdir()),resolvedProfile=resolve(profile);if(resolvedProfile.startsWith(tempRoot+sep))rmSync(resolvedProfile,{recursive:true,force:true});
  if(failures.length){mkdirSync(output,{recursive:true});writeFileSync(reportPath,JSON.stringify({ok:false,checks,failures,exceptions,consoleErrors,screenshots},null,2));process.exitCode=1;}
}
