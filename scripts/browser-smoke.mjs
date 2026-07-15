import {spawn,execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir,platform} from 'node:os';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {computeBuildFingerprint} from './build-fingerprint.mjs';

const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const argValue=name=>process.argv.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3);
const requestedGameUrl=argValue('url')||process.env.STACKFALL_URL||'http://127.0.0.1:8000/';
const runType=/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(new URL(requestedGameUrl).hostname)?'local':'live';
const expectedBuildSha=computeBuildFingerprint(root).sha;
const targetUrl=new URL(requestedGameUrl);targetUrl.searchParams.set('build-check',expectedBuildSha);
const gameUrl=targetUrl.href;
const soakMs=Math.max(0,Number(argValue('soak-ms')||process.env.STACKFALL_SOAK_MS)||0);
const strictSoak=process.env.STACKFALL_SOAK_STRICT!=='0';
const allowGpuSkip=process.env.STACKFALL_ALLOW_GPU_SKIP==='1';
const allowContextSkip=process.env.STACKFALL_ALLOW_CONTEXT_SKIP==='1';
const resultPath=resolve(argValue('result')||process.env.STACKFALL_RESULT_PATH||join(root,'test-results','stackfall-smoke.json'));
const screenshotDir=resolve(process.env.STACKFALL_SCREENSHOT_DIR||join(dirname(resultPath),'screenshots'));
const profile=mkdtempSync(join(tmpdir(),'stackfall-cdp-'));
const startedAt=new Date().toISOString();
const failures=[],skips=[],scenarios=[],allWarnings=[],allNetworkFailures=[];
let browser=null,debugPort=0,chromeVersion='unknown',deployedBuildSha=null;

function chromeCandidates(){
  const explicit=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH].filter(Boolean);
  if(platform()==='win32')return[...explicit,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',join(process.env.LOCALAPPDATA||'','Google','Chrome','Application','chrome.exe'),join(process.env.LOCALAPPDATA||'','Chromium','Application','chrome.exe'),'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'];
  if(platform()==='darwin')return[...explicit,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium','/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'];
  return[...explicit,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser','/snap/bin/chromium','/usr/bin/microsoft-edge'];
}
function findChrome(){const found=chromeCandidates().find(candidate=>candidate&&existsSync(candidate));if(!found)throw new Error(`Chrome/Chromium not found. Set STACKFALL_CHROME. Checked: ${chromeCandidates().join(', ')}`);return found;}
function commitSha(){try{return execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{return'unknown';}}
function check(condition,message,scenario='main'){if(!condition)failures.push(`[${scenario}] ${message}`);return!!condition;}
function percentile(sorted,p){return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]||0;}
function isPixiUrl(url=''){return/cdn\.jsdelivr\.net\/npm\/pixi\.js/i.test(url);}
function writeResult(extra={}){
  mkdirSync(dirname(resultPath),{recursive:true});
  const result={ok:failures.length===0,startedAt,endedAt:new Date().toISOString(),url:requestedGameUrl,checkedUrl:gameUrl,runType,commit:commitSha(),expectedBuildSha,deployedBuildSha,chromeVersion,viewport:{desktop:{width:1920,height:1080,dpr:1},mobile:{width:390,height:844,dpr:2}},browserArgs,soakRequestedMs:soakMs,soakBudgetEnforced:strictSoak,failures,warnings:allWarnings,networkFailures:allNetworkFailures,skips,scenarios,...extra};
  writeFileSync(resultPath,`${JSON.stringify(result,null,2)}\n`);
  return result;
}

let chromePath='';
const browserArgs=['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-size=1920,1080','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','about:blank'];

async function waitForDebugPort(timeout=15000){
  const path=join(profile,'DevToolsActivePort'),started=Date.now();
  while(Date.now()-started<timeout){
    if(browser?.exitCode!==null)throw new Error(`Chrome exited before CDP became ready (${browser.exitCode})`);
    if(existsSync(path)){const [line]=readFileSync(path,'utf8').trim().split(/\r?\n/);const port=Number(line);if(port>0)return port;}
    await sleep(100);
  }
  throw new Error('Chrome DevToolsActivePort timed out');
}
async function jsonEndpoint(path,options={},timeout=15000){
  const started=Date.now();
  while(Date.now()-started<timeout){try{const response=await fetch(`http://127.0.0.1:${debugPort}${path}`,options);if(response.ok)return response.json();}catch{}await sleep(100);}
  throw new Error(`Chrome endpoint timed out: ${path}`);
}

class Cdp{
  constructor(url){this.id=0;this.pending=new Map();this.listeners=new Map();this.ready=new Promise((done,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',done,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const pending=this.pending.get(message.id);if(!pending)return;this.pending.delete(message.id);clearTimeout(pending.timer);message.error?pending.fail(new Error(message.error.message)):pending.done(message.result);return;}for(const listener of this.listeners.get(message.method)||[])listener(message.params);});});}
  async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((done,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout: ${method}`));},timeout);this.pending.set(id,{done,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  on(method,listener){const list=this.listeners.get(method)||[];list.push(listener);this.listeners.set(method,list);}
  close(){for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.fail(new Error('CDP connection closed'));}this.pending.clear();this.ws?.close();}
}

async function evaluate(page,expression){const result=await page.cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result?.value;}
async function capture(page,path){mkdirSync(dirname(path),{recursive:true});const result=await page.cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path,Buffer.from(result.data,'base64'));return path;}
async function waitFor(page,predicate,timeout=7000,interval=120){const started=Date.now();let value;while(Date.now()-started<timeout){value=await evaluate(page,predicate);if(value)return value;await sleep(interval);}return value;}

async function createPage(name,{blockPixi=false}={}){
  const target=await jsonEndpoint(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'}),cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  const page={name,target,cdp,console:[],exceptions:[],network:[],responses:[],requests:new Map()};
  cdp.on('Runtime.consoleAPICalled',event=>{if(!['warning','error'].includes(event.type))return;page.console.push({level:event.type,text:event.args.map(arg=>String(arg.value??arg.description??'')).join(' ').trim()});});
  cdp.on('Runtime.exceptionThrown',event=>page.exceptions.push(event.exceptionDetails?.exception?.description||event.exceptionDetails?.text||'Unknown page exception'));
  cdp.on('Network.requestWillBeSent',event=>page.requests.set(event.requestId,event.request.url));
  cdp.on('Network.loadingFailed',event=>page.network.push({url:page.requests.get(event.requestId)||'',error:event.errorText||'',type:event.type||'',canceled:!!event.canceled,blockedReason:event.blockedReason||''}));
  cdp.on('Network.responseReceived',event=>{if(event.response.status>=400)page.responses.push({url:event.response.url,status:event.response.status,statusText:event.response.statusText});});
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable'),cdp.send('Performance.enable')]);
  if(blockPixi)await cdp.send('Network.setBlockedURLs',{urls:['*cdn.jsdelivr.net/npm/pixi.js*']});
  const loaded=new Promise(done=>cdp.on('Page.loadEventFired',done));await cdp.send('Page.navigate',{url:gameUrl});await Promise.race([loaded,sleep(12000)]);await waitFor(page,"document.readyState==='complete'",5000);await sleep(blockPixi?2600:4200);
  return page;
}
async function closePage(page){page.cdp.close();try{await fetch(`http://127.0.0.1:${debugPort}/json/close/${page.target.id}`);}catch{}}
function enforcePolicies(page,{allowWarnings=[],allowNetwork=[]}={}){
  for(const exception of page.exceptions)check(false,`Runtime.exceptionThrown: ${exception}`,page.name);
  for(const item of page.console){allWarnings.push({scenario:page.name,...item});const allowed=allowWarnings.some(pattern=>typeof pattern==='string'?item.text===pattern:pattern.test(item.text));if(!allowed)check(false,`unexpected console.${item.level}: ${item.text}`,page.name);}
  for(const item of page.network){allNetworkFailures.push({scenario:page.name,...item});const allowed=allowNetwork.some(test=>test(item));if(!allowed)check(false,`network failure ${item.url||'(unknown)'}: ${item.error}`,page.name);}
  for(const item of page.responses)check(false,`HTTP ${item.status} ${item.url}`,page.name);
}
async function runScenario(name,options,body){
  const scenario={name,startedAt:new Date().toISOString(),screenshots:[],observations:{}};scenarios.push(scenario);let page=null;const before=failures.length;
  try{page=await createPage(name,options);await body(page,scenario);enforcePolicies(page,options);}catch(error){check(false,error.stack||error.message,name);}
  if(page&&failures.length>before){try{scenario.screenshots.push(await capture(page,join(screenshotDir,`${name}-failure.png`)));scenario.failureDiagnostics=await evaluate(page,"typeof stackfallRuntimeDiagnostics==='function'?stackfallRuntimeDiagnostics():null");}catch(error){scenario.screenshotError=String(error.message||error);}}
  if(page)await closePage(page);scenario.endedAt=new Date().toISOString();scenario.ok=failures.length===before;return scenario;
}

async function schedulerChecks(page){
  return evaluate(page,`(()=>{
    GAME_SETTINGS.audio.master=false;
    const batch=first=>{resetGame();const log=[];scheduleWeaponAction(0,()=>{log.push('first');first();});scheduleWeaponAction(0,()=>log.push('second'));scheduleWeaponAction(0,()=>log.push('third'));updatePendingActions(.016);return{log:[...log],mode:state.mode,pending:state.pendingActions.length};};
    const reset=batch(resetGame),menu=batch(showMainMenu),gameover=batch(endGame);
    resetGame();const nested=[];scheduleWeaponAction(0,()=>{nested.push('outer');scheduleWeaponAction(0,()=>nested.push('inner'));});updatePendingActions(.016);const nestedFirst={log:[...nested],pending:state.pendingActions.length};updatePendingActions(.016);const nestedSecond={log:[...nested],pending:state.pendingActions.length};
    resetGame();const pausedCounter={runs:0};const pausedEntry=scheduleWeaponAction(500,()=>pausedCounter.runs++);togglePause(true);const pauseBefore=pausedEntry.remaining;
    window.__schedulerPause={pausedEntry,pausedCounter,pauseBefore};
    return{reset,menu,gameover,nestedFirst,nestedSecond,pauseBefore};
  })()`);
}

async function malformedChecks(page){
  return evaluate(page,`(()=>{
    resetGame();const e=state.entities,refs={particles:e.particles,texts:e.texts,shockwaves:e.shockwaves,telegraphs:e.telegraphs,beams:e.beams,curves:e.curves};
    for(const key of Object.keys(refs))refs[key].length=0;
    const junk=[null,undefined,{}, {x:NaN,y:0,life:1,max:1}, {x:'0',y:0,life:1,max:1}, {x:0,y:0,life:NaN,max:1}, {x:0,y:0,life:1,max:-1}];
    e.particles.push({x:0,y:0,vx:0,vy:0,life:1,max:1,size:2,color:'#fff'},...junk);
    e.texts.push({x:0,y:0,vy:-2,life:1,max:1,size:12,text:'ok',color:'#fff'},...junk);
    e.shockwaves.push({x:0,y:0,r:2,maxR:20,life:1,max:1,width:2,color:'#fff'},...junk);
    e.beams.push({x1:0,y1:0,x2:10,y2:10,life:1,max:1,width:2,color:'#fff'},...junk);
    e.telegraphs.push({type:'circle',x:100,y:100,r:20,life:1,max:1,damage:0,color:'#fff'},...junk);
    const enemy=state.entities.enemies[0];enemy.x=player.x+260;enemy.y=player.y;enemy.speed=0;fireBoomerang(enemy,1);e.curves.push(...junk);
    let error=null;try{updateEffects(.016);updateTelegraphs(.016);updateBoomerangs(.016);}catch(caught){error=caught.stack||caught.message;}
    return{error,refs:Object.fromEntries(Object.entries(refs).map(([key,value])=>[key,value===e[key]])),counts:Object.fromEntries(Object.keys(refs).map(key=>[key,e[key].length])),diagnostics:stackfallRuntimeDiagnostics()};
  })()`);
}

async function prepareStress(page){
  return evaluate(page,`(()=>{
    resetGame();state.xp=0;state.xpNeed=1e9;state.spawnTimer=9999;state.encounterTimer=9999;player.invuln=9999;state.weaponStacks={core:6,blade:6,ember:6,gravity:6,bulwark:6,comet:6,prism:6,arc:6,chrono:6,ion:6,nova:6,drone:6,rail:6,spiral:6,mirror:6};state.weaponSlots=['prism','arc','gravity','ion','rail','mirror'];
    for(const list of Object.values(state.entities))if(Array.isArray(list))list.length=0;
    for(let i=0;i<72;i++){const a=i/72*TAU,d=170+(i%8)*38,type=i%7===0?'tank':i%4===0?'ranged':'grunt';state.entities.enemies.push({id:state.nextId++,type,kind:i<4?'mini':'normal',x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:type==='tank'?22:13,hp:1e9,maxHp:1e9,speed:0,damage:0,color:type==='tank'?'#ff9f43':'#7769ff',xp:0,hit:0,dead:false,phase:i*.37,skillCd:999,burstCd:999,pulseCd:999,rangedCd:999,strafeDir:1,dash:0,noEliteReward:true});}
    for(let i=0;i<28;i++){const a=i/28*TAU,d=90+(i%4)*28;state.entities.projectiles.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,vx:0,vy:0,damage:0,color:'#8fffd0',r:4,life:999,maxLife:999,source:'soak-static',pierce:0,originX:player.x,originY:player.y,trailTick:999});}
    rebuildEnemyIndex();renderLoadout();return{enemies:state.entities.enemies.length,projectiles:state.entities.projectiles.length};
  })()`);
}

async function prepareSoak(page){
  return evaluate(page,`(()=>{
    state.mode='playing';state.xp=0;state.xpNeed=1e9;state.spawnTimer=9999;state.encounterTimer=9999;player.invuln=9999;for(const list of Object.values(state.entities))if(Array.isArray(list))list.length=0;
    for(let i=0;i<100;i++){const a=i/100*TAU,d=260+(i%10)*26,type=i%7===0?'tank':i%4===0?'ranged':'grunt';state.entities.enemies.push({id:state.nextId++,type,kind:i<4?'mini':'normal',x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:type==='tank'?22:13,hp:1e9,maxHp:1e9,speed:0,damage:0,color:type==='tank'?'#ff9f43':'#7769ff',xp:0,hit:0,dead:false,phase:i*.37,skillCd:999,burstCd:999,pulseCd:999,rangedCd:999,strafeDir:1,dash:0,noEliteReward:true});}
    for(let i=0;i<200;i++){const a=i/200*TAU,d=850+(i%5)*8;state.entities.projectiles.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,vx:0,vy:0,damage:0,color:'#8fffd0',r:3.4,life:999,maxLife:999,source:'soak-static',pierce:0,originX:player.x,originY:player.y,trailTick:999});state.entities.enemyProjectiles.push({x:player.x+Math.cos(a)*680,y:player.y+Math.sin(a)*680,vx:0,vy:0,damage:0,color:'#ff4d91',r:4.5,life:999,maxLife:999,phase:a});state.entities.particles.push({x:player.x+Math.cos(a)*720,y:player.y+Math.sin(a)*720,vx:0,vy:0,life:999,max:999,size:2.4,color:i%2?'#d7f8ff':'#ff7eb6',star:i%3===0});}
    rebuildEnemyIndex();window.__frameTimes=[];window.__lastFrame=performance.now();window.__soakStart=performance.now();window.__soakHeapStart=performance.memory?.usedJSHeapSize||null;requestAnimationFrame(function collect(now){window.__frameTimes.push(now-window.__lastFrame);window.__lastFrame=now;if(window.__frameTimes.length<50000)requestAnimationFrame(collect);});
    return{enemies:state.entities.enemies.length,elites:state.entities.enemies.filter(e=>e.kind==='mini').length,projectiles:state.entities.projectiles.length,enemyProjectiles:state.entities.enemyProjectiles.length,particles:state.entities.particles.length};
  })()`);
}

async function mainScenario(page,scenario){
  deployedBuildSha=await evaluate(page,"window.STACKFALL_BUILD_SHA||document.querySelector('meta[name=\"stackfall-build\"]')?.content||null");scenario.observations.build={expected:expectedBuildSha,deployed:deployedBuildSha};check(deployedBuildSha===expectedBuildSha,`deployed build mismatch: expected ${expectedBuildSha}, got ${deployedBuildSha}`,page.name);
  await evaluate(page,"GAME_SETTINGS.audio.master=false;resetGame();const target=state.entities.enemies[0];target.x=player.x+180;target.y=player.y;target.speed=0;player.coreCd=0");
  const gpu=await waitFor(page,"(()=>{const r=stackfallRendererInfo();return r.status==='active'&&r.projectileSprites? r:false;})()",9000);
  scenario.observations.gpu=gpu||await evaluate(page,'stackfallRendererInfo()');
  if(!gpu){if(allowGpuSkip)skips.push({test:'normal GPU',skipped:true,skipReason:'STACKFALL_ALLOW_GPU_SKIP=1 and renderer did not become active',renderer:scenario.observations.gpu,browserArgs});else check(false,`GPU renderer was not active: ${JSON.stringify(scenario.observations.gpu)}`,page.name);}else{check(gpu.backend==='PixiJS WebGL','GPU backend is not PixiJS WebGL',page.name);check(gpu.webglReady===true,'webglReady is false',page.name);check(gpu.tickerRegistered===true&&gpu.tickerRegistrationCount===1,'ticker registration is invalid',page.name);check(gpu.firstGpuFrame===true,'first GPU frame was not observed',page.name);}

  const scheduler=await schedulerChecks(page);await sleep(550);const paused=await evaluate(page,`(()=>{const before=window.__schedulerPause.pauseBefore,entry=window.__schedulerPause.pausedEntry,during=entry.remaining,counter=window.__schedulerPause.pausedCounter,runsBefore=counter.runs;togglePause(false);updatePendingActions(1);const runsAfter=counter.runs;resetGame();for(let i=0;i<5;i++){scheduleWeaponAction(100,()=>{});resetGame();}const restartPending=state.pendingActions.length;resetGame();const target=state.entities.enemies[0];target.hp=target.maxHp=500;window.__newTargetId=target.id;scheduleWeaponAction(100,()=>{const current=state.entities.enemies.find(e=>e.id===window.__newTargetId);if(current)current.hp-=100;});resetGame();const fresh=state.entities.enemies[0];fresh.hp=fresh.maxHp=500;window.__newTargetId=fresh.id;updatePendingActions(1);const oldAttackHp=fresh.hp;const frozen={};for(const mode of['choice','bossReward','worldEvent']){resetGame();const pending=scheduleWeaponAction(400,()=>{});state.mode=mode;const value=pending.remaining;updatePendingActions(1);frozen[mode]=[value,pending.remaining];}resetGame();scheduleWeaponAction(400,()=>{});startRealmTransition('space',{duration:.1});const cinematicPending=state.pendingActions.length;resetGame();return{before,during,runsBefore,runsAfter,restartPending,oldAttackHp,frozen,cinematicPending,finalPending:state.pendingActions.length};})()`);
  scenario.observations.scheduler={...scheduler,paused};
  for(const key of['reset','menu','gameover'])check(JSON.stringify(scheduler[key].log)==='["first"]',`${key} due batch executed stale callbacks`,page.name);
  check(JSON.stringify(scheduler.nestedFirst.log)==='["outer"]'&&scheduler.nestedFirst.pending===1,'new callback ran in the same scheduler update',page.name);check(JSON.stringify(scheduler.nestedSecond.log)==='["outer","inner"]'&&scheduler.nestedSecond.pending===0,'nested callback did not run on the next update',page.name);
  check(Math.abs(paused.before-paused.during)<1e-9&&paused.runsBefore===0&&paused.runsAfter===1,'pause did not freeze/resume scheduler time',page.name);check(paused.restartPending===0&&paused.finalPending===0,'restart left pending combat callbacks',page.name);check(paused.oldAttackHp===500,'previous-run attack damaged a new-run enemy',page.name);check(Object.values(paused.frozen).every(([a,b])=>a===b),'choice/reward/event advanced combat callbacks',page.name);check(paused.cinematicPending===0,'cinematic transition did not clear combat callbacks',page.name);

  const invalidWells=await evaluate(page,`(()=>{state.entities.wells.length=0;state.entities.wells.push(null,undefined,{}, {x:NaN,y:0,life:1}, {x:0,y:0,life:1,r:-8,strength:30,damage:0,tick:0,color:'#fff'}, {x:'0',y:0,life:1,r:80});let error=null;try{updateWells(.016);}catch(e){error=e.stack||e.message;}return{error,length:state.entities.wells.length,reference:Array.isArray(state.entities.wells)};})()`);scenario.observations.invalidWells=invalidWells;check(!invalidWells.error&&invalidWells.length===1,'invalid wells were not compacted safely',page.name);
  const malformed=await malformedChecks(page);scenario.observations.invalidEffects=malformed;check(!malformed.error,'malformed effects threw',page.name);check(Object.values(malformed.refs).every(Boolean),'effect array reference was replaced',page.name);check(Object.values(malformed.counts).every(count=>count===1),`malformed effects were not removed: ${JSON.stringify(malformed.counts)}`,page.name);check(malformed.diagnostics.errorCount===0,'malformed fixture produced runtime errors',page.name);

  const uiChecks=await evaluate(page,`(()=>{resetGame();let ledgerError=null;try{for(let i=0;i<10;i++)toggleAbilityLedger();}catch(error){ledgerError=error.stack||error.message;}if(isAbilityLedgerOpen())closeAbilityLedger(true);const growthBefore=totalGrowth();openChoices();const choice=ui.choiceCards.querySelector('button');choice?.click();choice?.click();const level={growthBefore,growthAfter:totalGrowth(),mode:state.mode,hidden:ui.choice.classList.contains('hidden')};state.rewardQueue=['boss'];updateRewardQueue();const rewardBefore=Object.keys(state.bossTraits).length+Object.keys(state.weaponAugments).length,queueBefore=state.rewardQueue.length,rewardCard=document.querySelector('#rewardCards button');rewardCard?.click();rewardCard?.click();const reward={before:rewardBefore,after:Object.keys(state.bossTraits).length+Object.keys(state.weaponAugments).length,queueBefore,queueAfter:state.rewardQueue.length,mode:state.mode};return{ledgerError,ledgerOpen:isAbilityLedgerOpen(),level,reward};})()`);scenario.observations.ui=uiChecks;check(!uiChecks.ledgerError&&!uiChecks.ledgerOpen,'ability ledger toggle failed',page.name);check(uiChecks.level.growthAfter===uiChecks.level.growthBefore+1&&uiChecks.level.mode==='playing'&&uiChecks.level.hidden,'level-up double click applied more than once',page.name);check(uiChecks.reward.after===uiChecks.reward.before+1&&uiChecks.reward.queueAfter===0&&uiChecks.reward.mode==='playing','boss reward double click applied more than once',page.name);

  const eventApex=await evaluate(page,`(()=>{
    resetGame();state.spawnTimer=9999;state.encounterTimer=9999;state.mapEventActive={type:'crash',wave:0,waves:[1],remaining:0,spawnCd:99,between:99,remainingTime:.001,maxTime:82,arena:{x:0,y:0,r:210}};state.entities.enemies.push({id:state.nextId++,type:'grunt',kind:'normal',eventKind:'crash',x:20,y:0,r:12,hp:100,maxHp:100,speed:0,damage:0,color:'#fff',xp:0,hit:0,dead:false,phase:0,skillCd:999,burstCd:999,pulseCd:999});updateMapEvents(.01);const crash={active:state.mapEventActive,enemies:state.entities.enemies.filter(e=>e.eventKind==='crash').length,mode:state.mode};
    resetGame();state.entities.mapEvents=[{type:'vault',x:999,y:999,pulse:0,life:.001,maxLife:46,consumed:false}];updateMapEvents(.01);const marker={count:state.entities.mapEvents.length,clock:state.eventClocks.vault};
    resetGame();state.apexArena={x:0,y:0,r:220,form:'starforge'};player.x=500;player.y=0;updateMapEventPlayer(0);const bounded=Math.hypot(player.x,player.y)<=220-player.r-19;const control=enemyControlFactor({kind:'apex',type:'boss',r:120,controlImmune:true});
    resetGame();openChoices();state.apexClock=APEX_INTERVAL_SECONDS;state.nextApexAt=APEX_INTERVAL_SECONDS;const priority=updateApexSystems(0,true),apex={priority,mode:state.mode,pending:state.pendingApexForm,arena:!!state.apexArena,choiceHidden:ui.choice.classList.contains('hidden'),event:state.mapEventActive};resetGame();return{crash,marker,bounded,control,apex};
  })()`);scenario.observations.eventApex=eventApex;check(!eventApex.crash.active&&eventApex.crash.enemies===0&&eventApex.crash.mode==='playing','crash timeout did not cleanly release the encounter',page.name);check(eventApex.marker.count===0&&eventApex.marker.clock>0,'expired map marker blocked future events',page.name);check(eventApex.bounded&&eventApex.control===0,'apex arena/control immunity invariant failed',page.name);check(eventApex.apex.priority&&eventApex.apex.mode==='cinematic'&&eventApex.apex.pending&&eventApex.apex.arena&&eventApex.apex.choiceHidden&&!eventApex.apex.event,'apex did not override an active choice/event state',page.name);

  const pauseStart=await evaluate(page,`(()=>{resetGame();state.weaponAugments.blade=true;state.time=5;player.strongBladeBurstReadyAt=0;const enemy=state.entities.enemies[0];enemy.hp=enemy.maxHp=1e7;const random=Math.random;Math.random=()=>1;dealDamage(enemy,1,{source:'blade',canCrit:false});Math.random=random;togglePause(true);return{time:state.time,ready:player.strongBladeBurstReadyAt};})()`);await sleep(2050);const cooldown=await evaluate(page,`(()=>{const pausedTime=state.time,readyBefore=player.strongBladeBurstReadyAt;togglePause(false);const enemy=state.entities.enemies[0],random=Math.random;Math.random=()=>1;dealDamage(enemy,1,{source:'blade',canCrit:false});const immediateReady=player.strongBladeBurstReadyAt;state.time=readyBefore;dealDamage(enemy,1,{source:'blade',canCrit:false});Math.random=random;const advancedReady=player.strongBladeBurstReadyAt;resetGame();const resetReady=player.strongBladeBurstReadyAt;showMainMenu();const menuReady=player.strongBladeBurstReadyAt;resetGame();return{pausedTime,readyBefore,immediateReady,advancedReady,resetReady,menuReady};})()`);scenario.observations.cooldown={pauseStart,...cooldown};check(cooldown.pausedTime===pauseStart.time&&cooldown.immediateReady===cooldown.readyBefore&&cooldown.advancedReady>cooldown.readyBefore,'blade augment cooldown advanced on wall clock',page.name);check(cooldown.resetReady===0&&cooldown.menuReady===0,'blade augment cooldown survived reset/menu',page.name);

  const audioProfiles=await evaluate(page,`(()=>{
    const saved={master:GAME_SETTINGS.audio.master,combat:GAME_SETTINGS.audio.combat,ui:GAME_SETTINGS.audio.ui,ambient:GAME_SETTINGS.audio.ambient,mode:state.mode,active:state.mapEventActive,apex:state.apexActiveId,pending:state.pendingApexForm,theme:state.realmTheme};
    GAME_SETTINGS.audio.master=true;GAME_SETTINGS.audio.combat=true;GAME_SETTINGS.audio.ui=true;GAME_SETTINGS.audio.ambient=false;audio.init();
    const output=audio.outputNode,compressor=audio.fxNodes?.[0],outputBeforeOff=output;
    const actual={outputGain:output?.gain?.value??null,compressorThreshold:compressor?.threshold?.value??null,compressorRatio:compressor?.ratio?.value??null,compressorKnee:compressor?.knee?.value??null};
    state.mode='playing';state.mapEventActive=null;state.apexActiveId=null;state.pendingApexForm=null;state.realmTheme='space';const combat=audio.musicSceneForState();
    state.mapEventActive={type:'crash'};const event=audio.musicSceneForState();state.mapEventActive=null;state.realmTheme='void';const voidScene=audio.musicSceneForState();state.realmTheme='space';state.pendingApexForm='starforge';const apexPending=audio.musicSceneForState();state.pendingApexForm=null;state.apexActiveId=999;const apexActive=audio.musicSceneForState();state.apexActiveId=null;state.realmTheme='apex-forge';const apexRealm=audio.musicSceneForState();state.realmTheme='space';
    const weapon=audio.weapon;let routed=null;audio.weapon=key=>{routed=key;};audio.hit(true,'rail-beam');audio.weapon=weapon;const unknown=audio.weaponKey('unclassified-source');
    const levelSource=audio.level.toString(),levelDescending=levelSource.includes('220,174.61,138.59,103.83,82.41')&&levelSource.includes("filterType:'lowpass'")&&levelSource.includes('41.2');
    GAME_SETTINGS.audio.master=false;audio.playChannel('combat',440,.05,'sine',.01,0);const masterOffKeptOutput=audio.outputNode===outputBeforeOff;
    GAME_SETTINGS.audio.master=true;GAME_SETTINGS.audio.ambient=true;audio.syncAmbient(true);const timer=audio.ambientTimer,nodes=audio.ambientNodes.length,scene=audio.musicScene;for(let i=0;i<20;i++)audio.syncAmbient();const sameScene={timerStable:audio.ambientTimer===timer,nodeStable:audio.ambientNodes.length===nodes,scene:audio.musicScene,nodes:audio.ambientNodes.length};
    for(let i=0;i<10;i++){state.mapEventActive={type:'crash'};audio.syncAmbient(true);state.mapEventActive=null;audio.syncAmbient(true);state.pendingApexForm='starforge';audio.syncAmbient(true);state.pendingApexForm=null;audio.syncAmbient(true);}const cycled={timerActive:!!audio.ambientTimer,nodes:audio.ambientNodes.length,scene:audio.musicScene};
    GAME_SETTINGS.audio.ambient=false;audio.syncAmbient();const ambientOff={timerActive:!!audio.ambientTimer,nodes:audio.ambientNodes.length};
    Object.assign(GAME_SETTINGS.audio,{master:saved.master,combat:saved.combat,ui:saved.ui,ambient:saved.ambient});Object.assign(state,{mode:saved.mode,mapEventActive:saved.active,apexActiveId:saved.apex,pendingApexForm:saved.pending,realmTheme:saved.theme});if(!saved.master||!saved.ambient)audio.stopAmbient();else audio.syncAmbient(true);
    return{combat,event,voidScene,apexPending,apexActive,apexRealm,routed,unknown,profiles:audio.soundProfiles,actual,levelDescending,masterOffKeptOutput,sameScene,cycled,ambientOff,initialScene:scene};
  })()`);scenario.observations.audio=audioProfiles;
  check(audioProfiles.combat==='combat'&&audioProfiles.event==='event'&&audioProfiles.voidScene==='event'&&audioProfiles.apexPending==='apex'&&audioProfiles.apexActive==='apex'&&audioProfiles.apexRealm==='apex','scene-aware BGM routing is incomplete',page.name);
  check(audioProfiles.routed==='rail'&&audioProfiles.profiles.weapons.length===15&&audioProfiles.profiles.level==='submerged-descending'&&audioProfiles.levelDescending,'weapon/level sound profiles are incomplete',page.name);
  check(Number.isFinite(audioProfiles.actual.outputGain)&&Math.abs(audioProfiles.actual.outputGain-2.76)<1e-6,`actual output gain mismatch: ${audioProfiles.actual.outputGain}`,page.name);
  check(audioProfiles.actual.compressorThreshold===-20&&audioProfiles.actual.compressorRatio===4.5&&audioProfiles.actual.compressorKnee===22,'compressor runtime settings mismatch',page.name);
  check(audioProfiles.masterOffKeptOutput,'master OFF created or replaced the output node',page.name);
  check(audioProfiles.sameScene.timerStable&&audioProfiles.sameScene.nodeStable,'same-scene sync duplicated ambient timer/nodes',page.name);
  check(audioProfiles.cycled.timerActive&&audioProfiles.cycled.nodes===audioProfiles.sameScene.nodes,'scene cycling leaked ambient nodes/timers',page.name);
  check(!audioProfiles.ambientOff.timerActive&&audioProfiles.ambientOff.nodes===0,'ambient OFF did not clear nodes/timer',page.name);
  check(audioProfiles.unknown==='core','unknown attack source fallback changed unexpectedly',page.name);
  const fixture=await prepareStress(page);await sleep(1800);const stressed=await evaluate(page,`(()=>{const d=stackfallRuntimeDiagnostics(),r=stackfallRendererInfo(),canvases=[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,css:[c.clientWidth,c.clientHeight],z:getComputedStyle(c).zIndex,display:getComputedStyle(c).display}));return{d,r,canvases,prism:[prismMultiplier(2,5),prismMultiplier(2,6)],nearest:nearestEnemies(player.x,player.y,3,null,900).map(e=>(e.x-player.x)**2+(e.y-player.y)**2)}})()`);scenario.observations.stress={fixture,stressed};check(stressed.d.errorCount===0,'stress fixture produced runtime errors',page.name);check(stressed.prism[0]===4.35&&stressed.prism[1]===4.6,'Prism multipliers regressed',page.name);check(stressed.nearest.every((value,index,list)=>index===0||value>=list[index-1]),'nearestEnemies is not sorted',page.name);check(new Set(stressed.canvases.map(item=>item.id)).size===stressed.canvases.length,'duplicate canvas ids found',page.name);check(stressed.canvases.some(item=>item.id==='combatForeground'&&item.z==='2'),'foreground canvas is missing or mis-layered',page.name);
  if(gpu){check(stressed.r.status==='active'&&stressed.r.projectileSprites.visible>0,'GPU projectiles were not visible',page.name);check(['diamond-pulse','explosive-sigil','crystal-lance','angular-shard'].every(value=>Object.values(stressed.r.projectileVisuals||{}).includes(value)),'source-specific projectile silhouettes are missing',page.name);await evaluate(page,'GAME_SETTINGS.sparkles=false');await sleep(350);const noSparkles=await evaluate(page,'stackfallRendererInfo()');check(noSparkles.projectileSprites.visible>0&&noSparkles.particleSprites.visible===0,'sparkles OFF broke projectile silhouettes/particles',page.name);await evaluate(page,'GAME_SETTINGS.hideProjectiles=true');await sleep(350);const hidden=await evaluate(page,'stackfallRendererInfo()');check(hidden.projectileSprites.visible===0&&hidden.particleSprites.visible===0,'hideProjectiles left GPU visuals visible',page.name);await evaluate(page,'GAME_SETTINGS.hideProjectiles=false;GAME_SETTINGS.sparkles=true');await sleep(450);
    const contextReady=await evaluate(page,`(()=>{const c=document.querySelector('#gpuCombatLayer'),gl=c?.getContext('webgl2')||c?.getContext('webgl'),ext=gl?.getExtension('WEBGL_lose_context');window.__stackfallContextExtension=ext;window.__canvasFallbackDraws=0;window.__canvasDrawOriginal=drawProjectiles;drawProjectiles=function(){window.__canvasFallbackDraws++;return window.__canvasDrawOriginal();};return!!ext;})()`);
    if(!contextReady){if(allowContextSkip)skips.push({test:'WEBGL_lose_context',skipped:true,skipReason:'STACKFALL_ALLOW_CONTEXT_SKIP=1 and extension unavailable',renderer:stressed.r,browserArgs});else check(false,'WEBGL_lose_context extension unavailable',page.name);}else{const baseline=await evaluate(page,`({renderer:stackfallRendererInfo(),canvasCount:document.querySelectorAll('canvas').length,fallbackDraws:window.__canvasFallbackDraws})`),cycles=[];for(let cycle=1;cycle<=3;cycle++){await evaluate(page,'window.__stackfallContextExtension.loseContext()');const lost=await waitFor(page,`(()=>{const r=stackfallRendererInfo();return r.status==='context-lost'?{renderer:r,canvasCount:document.querySelectorAll('canvas').length,fallbackDraws:window.__canvasFallbackDraws}:false;})()`,3500);check(!!lost,`context loss ${cycle} was not reported`,page.name);if(lost){check(lost.renderer.gpuCanvas.display==='none',`GPU canvas stayed visible on loss ${cycle}`,page.name);await sleep(250);const fallbackDraws=await evaluate(page,'window.__canvasFallbackDraws');check(fallbackDraws>lost.fallbackDraws,'Canvas projectile fallback did not draw during context loss',page.name);}await evaluate(page,'window.__stackfallContextExtension.restoreContext()');const restored=await waitFor(page,`(()=>{const r=stackfallRendererInfo();return r.status==='active'&&r.contextRestoreCount>=${baseline.renderer.contextRestoreCount+cycle}?{renderer:r,canvasCount:document.querySelectorAll('canvas').length}:false;})()`,8000);check(!!restored,`context restore ${cycle} did not return active`,page.name);if(restored)cycles.push({cycle,lost,restored});}
      await evaluate(page,'drawProjectiles=window.__canvasDrawOriginal');const final=await evaluate(page,'({renderer:stackfallRendererInfo(),canvasCount:document.querySelectorAll(\'canvas\').length,errors:stackfallRuntimeDiagnostics().errorCount})');scenario.observations.context={baseline,cycles,final};const r=final.renderer;check(r.contextRestoreCount===baseline.renderer.contextRestoreCount+3&&r.contextLossCount===baseline.renderer.contextLossCount+3,'context counters are not +3',page.name);check(final.canvasCount===baseline.canvasCount&&r.rendererGeneration===baseline.renderer.rendererGeneration,'context restore recreated canvas/renderer generation',page.name);check(r.tickerRegistered&&r.tickerRegistrationCount===1&&r.contextListenerRegistrationCount===1,'ticker/listener duplicated during restore',page.name);check(r.projectileSprites.pool===baseline.renderer.projectileSprites.pool&&r.particleSprites.pool===baseline.renderer.particleSprites.pool,'sprite pools grew during restore',page.name);check(r.textures.created-r.textures.destroyed===r.textures.live&&r.textures.live===baseline.renderer.textures.live&&r.textures.generation===baseline.renderer.textures.generation+3,'texture resources were not replaced cleanly',page.name);check(r.status==='active'&&r.projectileSprites.visible>0&&final.errors===0,'final restored renderer is not active/visible/error-free',page.name);}
  }

  scenario.screenshots.push(await capture(page,join(screenshotDir,'desktop.png')));
  const canvasCount=await evaluate(page,"document.querySelectorAll('canvas').length");
  await page.cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});await sleep(500);const dpr1=await evaluate(page,`({dpr:devicePixelRatio,renderer:stackfallRendererInfo(),canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,css:[c.clientWidth,c.clientHeight]}))})`);check(dpr1.dpr===1&&dpr1.canvases.every(c=>c.css[0]===1280&&c.css[1]===720),'desktop resize/DPR 1 mismatch',page.name);
  await page.cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true,screenOrientation:{type:'portraitPrimary',angle:0}});await sleep(700);const mobile=await evaluate(page,`({dpr:devicePixelRatio,renderer:stackfallRendererInfo(),canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,css:[c.clientWidth,c.clientHeight]}))})`);check(mobile.dpr===2&&mobile.canvases.every(c=>c.css[0]===390&&c.css[1]===844),'mobile resize/DPR 2 mismatch',page.name);check(mobile.canvases.length===canvasCount,'resize created a duplicate canvas',page.name);scenario.observations.resize={dpr1,mobile};scenario.screenshots.push(await capture(page,join(screenshotDir,'mobile.png')));await page.cdp.send('Emulation.clearDeviceMetricsOverride');

  if(soakMs>0){const start=await prepareSoak(page);scenario.observations.soakStart=start;check(start.enemies===100&&start.elites===4&&start.projectiles===200&&start.enemyProjectiles===200&&start.particles===200,'soak fixture was incomplete',page.name);await sleep(soakMs);const soak=await evaluate(page,`(()=>{const frames=window.__frameTimes.slice(-Math.min(window.__frameTimes.length,30000)).sort((a,b)=>a-b),sum=frames.reduce((a,b)=>a+b,0),over50=frames.filter(v=>v>=50).length,heap=performance.memory?.usedJSHeapSize||null;return{elapsed:performance.now()-window.__soakStart,samples:frames.length,average:sum/Math.max(1,frames.length),p95:frames[Math.floor(frames.length*.95)]||0,p99:frames[Math.floor(frames.length*.99)]||0,max:frames.at(-1)||0,over50,over50Ratio:over50/Math.max(1,frames.length),heapStart:window.__soakHeapStart,heapEnd:heap,heapDelta:heap&&window.__soakHeapStart?heap-window.__soakHeapStart:null,diagnostics:stackfallRuntimeDiagnostics(),renderer:stackfallRendererInfo(),canvasCount:document.querySelectorAll('canvas').length,pending:state.pendingActions.length,audio:{scene:audio.musicScene,ambientNodes:audio.ambientNodes?.length||0,ambientTimerActive:!!audio.ambientTimer,outputGain:audio.outputNode?.gain?.value??null,compressorThreshold:audio.fxNodes?.[0]?.threshold?.value??null}};})()`);scenario.observations.soak=soak;check(soak.diagnostics.errorCount===0&&soak.diagnostics.mode==='playing','soak produced runtime errors or left gameplay',page.name);check(soak.samples>soakMs/50,'soak collected too few frame samples',page.name);const soakBudgetOk=soak.p95<=50.5&&soak.over50Ratio<.08&&soak.max<100;soak.frameBudget={enforced:strictSoak,ok:soakBudgetOk,p95Max:50.5,over50RatioMax:.08,maxFrameMs:100};if(strictSoak)check(soakBudgetOk,`soak frame budget failed: p95=${soak.p95}, over50=${soak.over50Ratio}, max=${soak.max}`,page.name);else if(!soakBudgetOk)skips.push({test:'absolute soak frame budget',skipped:true,skipReason:'STACKFALL_SOAK_STRICT=0 on hosted runner',observed:{p95:soak.p95,p99:soak.p99,max:soak.max,over50:soak.over50,over50Ratio:soak.over50Ratio}});check(soak.renderer.projectileSprites.pool<400&&soak.renderer.particleSprites.pool<600,'soak sprite pool exceeded bounds',page.name);check(soak.canvasCount===canvasCount&&soak.renderer.tickerRegistrationCount===1,'soak duplicated canvas/ticker',page.name);}
  const finalDiagnostics=await evaluate(page,'stackfallRuntimeDiagnostics()');scenario.observations.finalDiagnostics=finalDiagnostics;check(finalDiagnostics.errorCount===0,'final runtime diagnostics contain errors',page.name);
}

async function fallbackScenario(page,scenario){
  await evaluate(page,`GAME_SETTINGS.audio.master=false;resetGame();const target=state.entities.enemies[0];target.x=player.x+140;target.y=player.y;target.speed=0;player.coreCd=0;`);const projectilePeak=await evaluate(page,`new Promise(resolve=>{let peak=0,start=performance.now();function sample(now){peak=Math.max(peak,state.entities.projectiles.length);if(now-start<1400)requestAnimationFrame(sample);else resolve(peak);}requestAnimationFrame(sample);})`);const fallback=await evaluate(page,`({renderer:stackfallRendererInfo(),diagnostics:stackfallRuntimeDiagnostics(),canvasIds:[...document.querySelectorAll('canvas')].map(c=>c.id),projectiles:state.entities.projectiles.length,renderFrame:state.renderFrame})`);fallback.projectilePeak=projectilePeak;scenario.observations.fallback=fallback;check(['failed','canvas-fallback'].includes(fallback.renderer.status),'blocked Pixi CDN did not select Canvas fallback',page.name);check(fallback.diagnostics.errorCount===0&&fallback.projectilePeak>0&&fallback.renderFrame>0,'Canvas fallback game logic/render failed',page.name);check(fallback.canvasIds.includes('combatForeground'),'Canvas fallback lost foreground layer',page.name);
}

try{
  mkdirSync(screenshotDir,{recursive:true});chromePath=findChrome();browser=spawn(chromePath,browserArgs,{stdio:'ignore',windowsHide:true});debugPort=await waitForDebugPort();const version=await jsonEndpoint('/json/version');chromeVersion=version.Product||version['User-Agent']||'unknown';
  await runScenario('main-gpu',{allowWarnings:[],allowNetwork:[]},mainScenario);
  await runScenario('pixi-fallback',{blockPixi:true,allowWarnings:[/^\[Stackfall\] PixiJS download failed; Canvas 2D fallback remains active\.?$/, /^Failed to load resource: net::ERR_BLOCKED_BY_CLIENT$/],allowNetwork:[item=>isPixiUrl(item.url)]},fallbackScenario);
}catch(error){check(false,error.stack||error.message,'harness');}finally{
  if(browser&&!browser.killed){browser.kill();await Promise.race([new Promise(done=>browser.once('exit',done)),sleep(3000)]);}
  const tempRoot=resolve(tmpdir())+sep,target=resolve(profile);if(target.startsWith(tempRoot)){try{rmSync(target,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch(error){failures.push(`[harness] temporary profile cleanup failed: ${error.message}`);}}
  const result=writeResult();console.log(JSON.stringify(result,null,2));if(failures.length)process.exitCode=1;
}
