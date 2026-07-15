import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chromePath=process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const gameUrl=process.env.STACKFALL_URL||'http://127.0.0.1:8000/';
const port=Number(process.env.CHROME_DEBUG_PORT)||9333;
const soakMs=Math.max(0,Number(process.env.STACKFALL_SOAK_MS)||0);
const profile=mkdtempSync(join(tmpdir(),'stackfall-cdp-'));
const screenshots={desktop:join(tmpdir(),'stackfall-smoke-desktop.png'),mobile:join(tmpdir(),'stackfall-smoke-mobile.png')};
const failures=[];
const observations=[];
const browser=spawn(chromePath,[
  '--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--window-size=1920,1080',
  '--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio',
  '--no-first-run','--no-default-browser-check','about:blank'
],{stdio:'ignore',windowsHide:true});

function assert(condition,message){if(!condition)failures.push(message);}
async function waitForJson(path,timeout=10000){const start=Date.now();while(Date.now()-start<timeout){try{const response=await fetch(`http://127.0.0.1:${port}${path}`);if(response.ok)return response.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timed out: ${path}`);}

class Cdp{
  constructor(url){this.id=0;this.pending=new Map();this.listeners=new Map();this.ready=new Promise((resolve,reject)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true});this.ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const pending=this.pending.get(message.id);if(!pending)return;this.pending.delete(message.id);message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result);return;}for(const listener of this.listeners.get(message.method)||[])listener(message.params);});});}
  async send(method,params={}){await this.ready;const id=++this.id;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
  on(method,listener){const list=this.listeners.get(method)||[];list.push(listener);this.listeners.set(method,list);}
  close(){this.ws?.close();}
}

async function createPage(blockPixi=false){
  const targets=await waitForJson('/json/list'),target=targets.find(item=>item.type==='page'&&item.url==='about:blank')||targets.find(item=>item.type==='page');
  if(!target)throw new Error('No Chrome page target');
  const cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  const consoleMessages=[],pageErrors=[],networkFailures=[];
  cdp.on('Runtime.consoleAPICalled',event=>{const level=event.type;const text=event.args.map(arg=>String(arg.value??arg.description??'')).join(' ');if(level==='error'||level==='warning')consoleMessages.push({level,text});});
  cdp.on('Runtime.exceptionThrown',event=>pageErrors.push(event.exceptionDetails?.exception?.description||event.exceptionDetails?.text||'Unknown page exception'));
  cdp.on('Network.loadingFailed',event=>{if(!event.canceled)networkFailures.push({url:event.url||'',error:event.errorText,type:event.type});});
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable'),cdp.send('Performance.enable')]);
  if(blockPixi)await cdp.send('Network.setBlockedURLs',{urls:['*cdn.jsdelivr.net/npm/pixi.js*']});
  const loaded=new Promise(resolve=>cdp.on('Page.loadEventFired',resolve));await cdp.send('Page.navigate',{url:gameUrl});await Promise.race([loaded,sleep(10000)]);await sleep(3500);
  return{cdp,consoleMessages,pageErrors,networkFailures};
}

async function evaluate(cdp,expression){const result=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result?.value;}
async function screenshot(cdp,path){const result=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path,Buffer.from(result.data,'base64'));}

async function prepareSoak(cdp){
  return evaluate(cdp,`(()=>{
    state.mode='playing';state.xp=0;state.xpNeed=1e9;state.spawnTimer=9999;state.encounterTimer=9999;player.invuln=9999;
    ui.choice.classList.add('hidden');ui.pauseScreen.classList.add('hidden');ui.gameOver.classList.add('hidden');
    state.weaponStacks={core:6,blade:6,ember:6,gravity:6,bulwark:6,comet:6,prism:6,arc:6,chrono:6,ion:6,nova:6,drone:6,rail:6,spiral:6,mirror:6};
    state.weaponSlots=['prism','arc','gravity','ion','rail','mirror'];
    for(const list of Object.values(state.entities))if(Array.isArray(list))list.length=0;
    for(let i=0;i<100;i++){const a=i/100*TAU,d=260+(i%10)*26,type=i%7===0?'tank':i%4===0?'ranged':'grunt';state.entities.enemies.push({id:state.nextId++,type,kind:i<4?'mini':'normal',x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:type==='tank'?22:13,hp:1e9,maxHp:1e9,speed:0,damage:0,color:type==='tank'?'#ff9f43':'#7769ff',xp:0,hit:0,dead:false,phase:i*.37,skillCd:999,burstCd:999,pulseCd:999,rangedCd:999,strafeDir:1,dash:0,noEliteReward:true});}
    for(let i=0;i<200;i++){const a=i/200*TAU,d=850+(i%5)*8;state.entities.projectiles.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,vx:0,vy:0,damage:0,color:'#8fffd0',r:3.4,life:999,source:'soak-static',pierce:0});}
    for(let i=0;i<200;i++){const a=i/200*TAU,d=680+(i%5)*8;state.entities.enemyProjectiles.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,vx:0,vy:0,damage:0,color:'#ff4d91',r:4.5,life:999,maxLife:999,phase:a});}
    for(let i=0;i<200;i++){const a=i/200*TAU,d=720+(i%8)*7;state.entities.particles.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,vx:0,vy:0,life:999,max:999,size:2.4,color:i%2?'#d7f8ff':'#ff7eb6',star:i%3===0});}
    rebuildEnemyIndex();renderLoadout();state.camera.shake=0;window.__frameTimes.length=0;window.__lastFrame=performance.now();window.__soakStart=performance.now();window.__soakHeapStart=performance.memory?.usedJSHeapSize||null;
    return{enemies:state.entities.enemies.length,elites:state.entities.enemies.filter(e=>e.kind==='mini').length,projectiles:state.entities.projectiles.length,enemyProjectiles:state.entities.enemyProjectiles.length,particles:state.entities.particles.length,weapons:Object.keys(state.weaponStacks).length};
  })()`);
}

async function mainScenario(page){
  const {cdp,pageErrors}=page;
  const initial=await evaluate(cdp,`({ready:document.readyState,origin:location.origin,canvasIds:[...document.querySelectorAll('canvas')].map(c=>c.id),scripts:[...document.scripts].map(s=>s.src).filter(Boolean),diagnostics:stackfallRuntimeDiagnostics(),renderer:stackfallRendererInfo()})`);
  observations.push({initial});assert(initial.ready==='complete','document did not reach complete');assert(initial.scripts.every(src=>src.startsWith(initial.origin)||src.includes('cdn.jsdelivr.net')),'unexpected script source');

  const audioOutput=await evaluate(cdp,`(()=>{audio.init();return{gain:audio.outputNode?.gain.value??null,compressorThreshold:audio.fxNodes?.[0]?.threshold?.value??null};})()`);
  observations.push({audioOutput});assert(Math.abs(audioOutput.gain-3.24)<.0001,'final game audio output is not doubled');
  await evaluate(cdp,`GAME_SETTINGS.audio.master=false;resetGame();window.__frameTimes=[];window.__lastFrame=performance.now();requestAnimationFrame(function collect(now){window.__frameTimes.push(now-window.__lastFrame);window.__lastFrame=now;if(window.__frameTimes.length<40000)requestAnimationFrame(collect);});`);
  await sleep(2600);
  const invalidWells=await evaluate(cdp,`(()=>{state.entities.wells.length=0;state.entities.wells.push(null,undefined,{}, {x:NaN,y:0,life:1}, {x:0,y:0,life:1,r:-8,strength:30,damage:0,tick:0,color:'#fff'}, {x:'0',y:0,life:1,r:80});let error=null;try{updateWells(.016);}catch(e){error=e.stack||e.message;}return{error,length:state.entities.wells.length,well:state.entities.wells[0]||null};})()`);
  assert(!invalidWells.error,`invalid well update threw: ${invalidWells.error}`);assert(invalidWells.length===1,'invalid wells were not compacted safely');

  await evaluate(cdp,`window.__oldRunFlag=0;scheduleWeaponAction(180,()=>window.__oldRunFlag++);resetGame();`);await sleep(350);
  const oldRunFlag=await evaluate(cdp,'window.__oldRunFlag');assert(oldRunFlag===0,'scheduled attack survived reset');
  await evaluate(cdp,`window.__pauseFlag=0;scheduleWeaponAction(180,()=>window.__pauseFlag++);togglePause(true);`);await sleep(350);
  assert(await evaluate(cdp,'window.__pauseFlag')===0,'scheduled attack advanced while paused');await evaluate(cdp,'togglePause(false)');await sleep(280);assert(await evaluate(cdp,'window.__pauseFlag')===1,'scheduled attack did not resume after pause');

  await evaluate(cdp,`(()=>{state.weaponStacks={core:6,prism:6,arc:6,drone:6,spiral:6,gravity:6,rail:6,ion:6};state.weaponSlots=['prism','arc','drone','spiral','gravity','rail'];for(let i=0;i<90;i++){const a=i/90*TAU,d=170+(i%9)*38,type=i%7===0?'tank':i%4===0?'ranged':'grunt';state.entities.enemies.push({id:state.nextId++,type,kind:'normal',x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:type==='tank'?22:13,hp:900,maxHp:900,speed:0,damage:1,color:type==='tank'?'#ff9f43':'#7769ff',xp:1,hit:0,dead:false,phase:i*.37,skillCd:999,burstCd:999,pulseCd:999,rangedCd:999,strafeDir:1,dash:0});}for(let i=0;i<160;i++){const a=i/160*TAU,d=90+(i%10)*25;state.entities.enemyProjectiles.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,vx:-Math.cos(a)*25,vy:-Math.sin(a)*25,damage:0,color:'#ff4d91',r:5,life:12,maxLife:12,phase:a});}state.camera.shake=24;rebuildEnemyIndex();return true;})()`);
  await sleep(3500);
  const stressed=await evaluate(cdp,`(()=>{const d=stackfallRuntimeDiagnostics(),r=stackfallRendererInfo(),canvases=[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,css:[c.clientWidth,c.clientHeight],z:getComputedStyle(c).zIndex,display:getComputedStyle(c).display}));return{d,r,canvases,prism:[prismMultiplier(2,5),prismMultiplier(2,6)],nearest:nearestEnemies(player.x,player.y,3,null,900).map(e=>(e.x-player.x)**2+(e.y-player.y)**2)}})()`);
  observations.push({invalidWells,oldRunFlag,stressed});assert(stressed.d.errorCount===0,`runtime stage errors: ${stressed.d.errorCount}`);assert(stressed.prism[0]===4.35&&stressed.prism[1]===4.6,'Prism maximum multipliers regressed');assert(stressed.nearest.every((value,index,list)=>index===0||value>=list[index-1]),'nearestEnemies result is not distance sorted');assert(new Set(stressed.canvases.map(item=>item.id)).size===stressed.canvases.length,'duplicate canvas ids found');assert(stressed.canvases.some(item=>item.id==='combatForeground'&&item.z==='2'),'foreground danger canvas missing or mis-layered');

  if(stressed.r.status==='active'){
    assert(stressed.r.projectileSprites.visible>0,'GPU projectiles were not visible');
    await evaluate(cdp,'GAME_SETTINGS.sparkles=false');await sleep(450);const noSparkles=await evaluate(cdp,'stackfallRendererInfo()');assert(noSparkles.projectileSprites.visible>0,'sparkles OFF hid projectile silhouettes');assert(noSparkles.particleSprites.visible===0,'sparkles OFF left GPU particles visible');
    await evaluate(cdp,'GAME_SETTINGS.hideProjectiles=true');await sleep(450);const hidden=await evaluate(cdp,'stackfallRendererInfo()');assert(hidden.projectileSprites.visible===0&&hidden.particleSprites.visible===0,'hideProjectiles left allied GPU visuals visible');
    await evaluate(cdp,'GAME_SETTINGS.hideProjectiles=false;GAME_SETTINGS.sparkles=true');await sleep(500);
    const loss=await evaluate(cdp,`(()=>{const c=document.querySelector('#gpuCombatLayer'),gl=c?.getContext('webgl2')||c?.getContext('webgl'),ext=gl?.getExtension('WEBGL_lose_context');window.__stackfallLoseContext=ext;if(!ext)return false;ext.loseContext();return true;})()`);
    if(loss){await sleep(500);const lost=await evaluate(cdp,'stackfallRendererInfo()');assert(lost.status==='context-lost','context loss state was not reported');assert(lost.gpuCanvas.display==='none','GPU canvas stayed visible after context loss');await evaluate(cdp,'window.__stackfallLoseContext.restoreContext()');await sleep(2600);const restored=await evaluate(cdp,'stackfallRendererInfo()');observations.push({lost,restored});assert(['warming-up','active'].includes(restored.status),'context restore did not recover or warm up');assert(restored.tickerRegistered===true&&restored.contextRestoreCount===1,'context restore duplicated or lost ticker state');}
  }else observations.push({gpuSkip:`GPU state was ${stressed.r.status}`});

  await screenshot(cdp,screenshots.desktop);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true,screenOrientation:{type:'portraitPrimary',angle:0}});await sleep(700);const mobile=await evaluate(cdp,`({renderer:stackfallRendererInfo(),canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,css:[c.clientWidth,c.clientHeight]}))})`);observations.push({mobile});for(const item of mobile.canvases)assert(item.css[0]===390&&item.css[1]===844,`${item.id} mobile CSS size mismatch`);await screenshot(cdp,screenshots.mobile);await cdp.send('Emulation.clearDeviceMetricsOverride');

  for(let i=0;i<3;i++)await evaluate(cdp,'resetGame()');await sleep(700);const afterRestarts=await evaluate(cdp,`({canvasCount:document.querySelectorAll('canvas').length,renderer:stackfallRendererInfo(),pending:state.pendingActions.length,errors:stackfallRuntimeDiagnostics().errorCount})`);observations.push({afterRestarts});assert(afterRestarts.canvasCount===stressed.canvases.length,'restart created duplicate canvases');assert(afterRestarts.pending===0,'restart left pending combat actions');assert(afterRestarts.errors===0,'restart produced runtime errors');

  if(soakMs>0){const stressStart=await prepareSoak(cdp);observations.push({stressStart});assert(stressStart.enemies===100&&stressStart.elites===4,'soak enemy fixture was incomplete');assert(stressStart.projectiles===200&&stressStart.enemyProjectiles===200&&stressStart.particles===200,'soak effect fixture was incomplete');await sleep(soakMs);const soak=await evaluate(cdp,`(()=>{const frames=window.__frameTimes.slice(-Math.min(window.__frameTimes.length,20000)).sort((a,b)=>a-b),sum=frames.reduce((a,b)=>a+b,0),over50=frames.filter(v=>v>=50).length,heap=performance.memory?.usedJSHeapSize||null;return{elapsed:performance.now()-window.__soakStart,samples:frames.length,average:sum/Math.max(1,frames.length),p95:frames[Math.floor(frames.length*.95)]||0,max:frames.at(-1)||0,over50,over50Ratio:over50/Math.max(1,frames.length),heapStart:window.__soakHeapStart,heap,heapDelta:heap&&window.__soakHeapStart?heap-window.__soakHeapStart:null,performanceTier:stackfallPerformanceTier?.()??null,diagnostics:stackfallRuntimeDiagnostics(),renderer:stackfallRendererInfo()};})()`);observations.push({soak});assert(soak.diagnostics.errorCount===0,'soak test produced runtime errors');assert(soak.diagnostics.mode==='playing','soak test left active combat');assert(soak.samples>soakMs/40,'soak test collected too few frames');assert(soak.p95<50&&soak.over50Ratio<.05,'soak frame time exceeded the stability budget');assert(soak.renderer.projectileSprites.pool<400&&soak.renderer.particleSprites.pool<600,'soak sprite pool grew beyond its bound');}
  assert(pageErrors.length===0,`page exceptions: ${pageErrors.join(' | ')}`);
}

async function fallbackScenario(){
  const created=await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'});if(!created.ok)throw new Error('Could not create fallback target');const target=await created.json(),cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;const page={cdp,consoleMessages:[],pageErrors:[],networkFailures:[]};cdp.on('Runtime.exceptionThrown',event=>page.pageErrors.push(event.exceptionDetails?.exception?.description||event.exceptionDetails?.text));await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);await cdp.send('Network.setBlockedURLs',{urls:['*cdn.jsdelivr.net/npm/pixi.js*']});const loaded=new Promise(resolve=>cdp.on('Page.loadEventFired',resolve));await cdp.send('Page.navigate',{url:gameUrl});await Promise.race([loaded,sleep(10000)]);await sleep(3000);await evaluate(cdp,`GAME_SETTINGS.audio.master=false;resetGame();const target=state.entities.enemies[0];target.x=player.x+140;target.y=player.y;target.speed=0;player.coreCd=0;`);const projectilePeak=await evaluate(cdp,`new Promise(resolve=>{let peak=0,start=performance.now();function sample(now){peak=Math.max(peak,state.entities.projectiles.length);if(now-start<1400)requestAnimationFrame(sample);else resolve(peak);}requestAnimationFrame(sample);})`);const fallback=await evaluate(cdp,`({renderer:stackfallRendererInfo(),diagnostics:stackfallRuntimeDiagnostics(),canvasIds:[...document.querySelectorAll('canvas')].map(c=>c.id),projectiles:state.entities.projectiles.length,renderFrame:state.renderFrame})`);fallback.projectilePeak=projectilePeak;observations.push({fallback});assert(['failed','canvas-fallback'].includes(fallback.renderer.status),'blocked Pixi CDN did not select Canvas fallback');assert(fallback.diagnostics.errorCount===0,'Canvas fallback produced runtime errors');assert(fallback.projectilePeak>0,'Canvas fallback game logic did not produce projectiles');assert(fallback.renderFrame>0,'Canvas fallback render loop did not advance');assert(fallback.canvasIds.includes('combatForeground'),'Canvas fallback lost foreground danger layer');assert(page.pageErrors.length===0,`fallback page exceptions: ${page.pageErrors.join(' | ')}`);cdp.close();
}

try{await waitForJson('/json/version');const page=await createPage(false);await mainScenario(page);await fallbackScenario();page.cdp.close();console.log(JSON.stringify({ok:failures.length===0,failures,observations,screenshots},null,2));if(failures.length)process.exitCode=1;}catch(error){console.error(error.stack||error);process.exitCode=1;}finally{browser.kill();await Promise.race([new Promise(resolve=>browser.once('exit',resolve)),sleep(3000)]);const root=resolve(tmpdir())+sep,target=resolve(profile);if(target.startsWith(root)){try{rmSync(target,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch(error){console.warn(`Could not remove temporary Chrome profile: ${error.message}`);}}}
