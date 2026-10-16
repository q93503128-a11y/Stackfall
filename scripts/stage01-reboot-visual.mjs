import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname,join} from 'node:path';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';

const root=resolve('.'),out=resolve('test-results','stage01-reboot');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=createServer((req,res)=>{try{const raw=decodeURIComponent((req.url||'/').split('?')[0]),path=resolve(root,'.'+(raw==='/'?'/index.html':raw));if(!path.startsWith(root)||!existsSync(path)){res.writeHead(404);res.end('not found');return;}res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(readFileSync(path));}catch(error){res.writeHead(500);res.end(String(error));}});
await new Promise(ok=>server.listen(8000,'127.0.0.1',ok));

const chrome=process.env.STACKFALL_CHROME||'/usr/bin/google-chrome',profile=join(tmpdir(),`stackfall-stage01-${process.pid}`),browser=spawn(chrome,['--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=9223',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function retry(fn,timeout=10000){const at=Date.now();let err;while(Date.now()-at<timeout){try{return await fn();}catch(e){err=e;await sleep(100);}}throw err||new Error('timeout');}
const target=await retry(async()=>{const r=await fetch('http://127.0.0.1:9223/json/new?http://127.0.0.1:8000/?dev=1',{method:'PUT'});if(!r.ok)throw new Error('debug target '+r.status);return r.json();});
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true});});
let seq=0;const pending=new Map();ws.addEventListener('message',event=>{const msg=JSON.parse(String(event.data));if(msg.id&&pending.has(msg.id)){const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);msg.error?reject(new Error(msg.error.message)):resolve(msg.result);}});
function cdp(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text||'evaluation failed');return result.result?.value;}
async function waitFor(expression,timeout=10000){const at=Date.now();while(Date.now()-at<timeout){try{if(await evaluate(expression))return true;}catch{}await sleep(100);}throw new Error('waitFor failed: '+expression);}
const REVIEW_FRAMES=new Set(['desktop-00-early','desktop-10-brace','desktop-55-dash-mid','desktop-90-phase2','mobile-10-boss']);
async function emitReviewFrame(name){
  if(!REVIEW_FRAMES.has(name))return;
  const metrics=await evaluate('({w:innerWidth,h:innerHeight})'),scale=metrics?.w<600?.45:.30;
  const {data}=await cdp('Page.captureScreenshot',{format:'jpeg',quality:46,captureBeyondViewport:false,clip:{x:0,y:0,width:metrics.w,height:metrics.h,scale}});
  console.log(`STACKFALL_REVIEW_B64 ${name} ${data}`);
}
async function shot(name){await evaluate('draw()');const {data}=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const path=resolve(out,name+'.png');writeFileSync(path,Buffer.from(data,'base64'));await emitReviewFrame(name);return path;}
async function setViewport(width,height){await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});}
async function stepBoss(frames){return evaluate(`(()=>{const boss=state.entities.enemies.find(e=>e.kind==='stage-boss'&&e.eventKind==='stage-01');if(!boss)return null;for(let i=0;i<${frames};i++){state.time+=1/60;window.updateStageBossSkill(boss,1/60);updatePendingActions(1/60);}draw();return{mode:boss.stage01Ram?.mode||'idle',progress:boss.stage01Ram?.progress||0,x:boss.x,y:boss.y,phase:boss.stagePhase};})()`);}

const report={ok:false,failures:[],frames:[],desktop:{},mobile:{}};const check=(ok,message)=>{if(!ok)report.failures.push(message);};
try{
  await cdp('Page.enable');await cdp('Runtime.enable');await setViewport(1440,900);await cdp('Page.navigate',{url:'http://127.0.0.1:8000/?dev=1'});
  await waitFor(`typeof window.stackfallStage01RebootDiagnostics==='function'&&window.stackfallDeveloperTest?.enabled===true`,15000);
  const setup=await evaluate(`(()=>{GAME_SETTINGS.audio.master=false;window.__stackfallLoopGeneration++;stackfallDeveloperTest.startStage('stage-01');stackfallDeveloperTest.setLevelUpsDisabled(true);stackfallDeveloperTest.setInvincible(true);if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);state.time=24;state.mode='paused';draw();return{diag:stackfallStage01RebootDiagnostics(),runtime:stackfallRuntimeDiagnostics(),name:stackfallStageById('stage-01')?.boss?.name?.ko};})()`);
  check(setup?.diag?.style==='stackfall-cosmic-reboot','reboot wrapper not active');check(setup?.name==='폐쇄체','rejected boss identity still visible');check(setup?.runtime?.errorCount===0,'runtime error before capture');report.desktop.early=await shot('desktop-00-early');

  const bossSetup=await evaluate(`(()=>{state.mode='playing';const preview=stackfallDeveloperTest.jumpStageBoss('stage-01');state.time=preview.bossAt;updateSpawning(1/60);if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);const boss=state.entities.enemies.find(e=>e.kind==='stage-boss'&&e.eventKind==='stage-01');if(!boss)return{error:'boss missing'};boss.stage01Cooldown=0;boss.hp=boss.maxHp;player.x=0;player.y=0;window.updateStageBossSkill(boss,1/60);state.mode='paused';draw();return{mode:boss.stage01Ram?.mode,shapes:window.stackfallStageBodyShapes(boss).length,diag:stackfallStage01RebootDiagnostics()};})()`);
  check(!bossSetup?.error,'boss missing after preview');check(bossSetup?.shapes===3,'new boss collision shapes not installed');check(bossSetup?.mode==='brace','ram did not start in brace');report.frames.push({name:'brace',state:bossSetup,path:await shot('desktop-10-brace')});

  for(const targetMode of['compress','charge','dash','impact','recover']){
    let state=null;for(let batch=0;batch<90;batch++){state=await stepBoss(1);if(state?.mode===targetMode)break;}check(state?.mode===targetMode,'motion never reached '+targetMode);report.frames.push({name:targetMode,state,path:await shot('desktop-'+String(20+report.frames.length*10).padStart(2,'0')+'-'+targetMode)});
    if(targetMode==='dash'){state=await stepBoss(8);report.frames.push({name:'dash-mid',state,path:await shot('desktop-55-dash-mid')});}
  }
  const recoverDone=await stepBoss(55);report.frames.push({name:'idle-after-recover',state:recoverDone,path:await shot('desktop-80-recovered')});

  const phaseTwo=await evaluate(`(()=>{const boss=state.entities.enemies.find(e=>e.kind==='stage-boss'&&e.eventKind==='stage-01');state.mode='playing';boss.stage01Ram=null;boss.stage01Cooldown=.5;boss.hp=boss.maxHp*.45;state.time+=1/60;window.updateStageBossSkill(boss,1/60);state.mode='paused';draw();return{phase:boss.stagePhase,shapes:window.stackfallStageBodyShapes(boss).length};})()`);check(phaseTwo?.phase===2,'phase two visual state did not activate');report.frames.push({name:'phase2',state:phaseTwo,path:await shot('desktop-90-phase2')});

  const runtime=await evaluate('stackfallRuntimeDiagnostics()');check(runtime.errorCount===0,'runtime errors after motion capture');report.desktop.runtime=runtime;

  await setViewport(390,844);await evaluate(`(()=>{state.mode='paused';player.x=0;player.y=0;draw();return true;})()`);report.mobile.early=await shot('mobile-00-early');
  report.mobile.boss=await shot('mobile-10-boss');const mobileRuntime=await evaluate('stackfallRuntimeDiagnostics()');check(mobileRuntime.errorCount===0,'mobile resize produced runtime errors');report.mobile.runtime=mobileRuntime;

  report.ok=report.failures.length===0;
}catch(error){report.failures.push(error.stack||error.message);report.ok=false;}finally{
  writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));try{ws.close();}catch{}try{browser.kill('SIGTERM');}catch{}server.close();
}
console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
