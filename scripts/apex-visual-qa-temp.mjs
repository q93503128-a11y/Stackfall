import {spawn,execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir,platform} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const baseUrl=process.env.STACKFALL_URL||'https://stackfall.pages.dev/';
const outDir=resolve(process.env.APEX_QA_DIR||join(root,'test-results','apex-visual-qa'));
const resultPath=join(outDir,'report.json');
const screenshotsDir=join(outDir,'screenshots');
const profile=mkdtempSync(join(tmpdir(),'stackfall-apex-qa-'));
const forms=['chronophage','starforge','lastconstellation'];
const failures=[];
const observations={};
let browser=null,debugPort=0;
mkdirSync(screenshotsDir,{recursive:true});

function chromeCandidates(){
  const explicit=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH].filter(Boolean);
  if(platform()==='win32')return[...explicit,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'];
  if(platform()==='darwin')return[...explicit,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  return[...explicit,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
}
function findChrome(){const found=chromeCandidates().find(p=>p&&existsSync(p));if(!found)throw new Error('Chrome not found');return found;}
async function waitForDebugPort(timeout=15000){const path=join(profile,'DevToolsActivePort'),start=Date.now();while(Date.now()-start<timeout){if(browser?.exitCode!==null)throw new Error(`Chrome exited ${browser.exitCode}`);if(existsSync(path)){const port=Number(readFileSync(path,'utf8').trim().split(/\r?\n/)[0]);if(port>0)return port;}await sleep(100);}throw new Error('DevToolsActivePort timeout');}
async function jsonEndpoint(path,options={},timeout=10000){const start=Date.now();while(Date.now()-start<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,options);if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`endpoint timeout ${path}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.events=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const msg=JSON.parse(ev.data);if(msg.id){const p=this.pending.get(msg.id);if(!p)return;this.pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.fail(new Error(msg.error.message)):p.ok(msg.result);return;}for(const fn of this.events.get(msg.method)||[])fn(msg.params);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}on(method,fn){const arr=this.events.get(method)||[];arr.push(fn);this.events.set(method,arr);}close(){this.ws?.close();}}
async function evaluate(page,expression){const r=await page.cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(page,expression,timeout=12000,interval=120){const start=Date.now();let v;while(Date.now()-start<timeout){v=await evaluate(page,expression);if(v)return v;await sleep(interval);}return v;}
async function capture(page,name){const r=await page.cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const path=join(screenshotsDir,`${name}.png`);writeFileSync(path,Buffer.from(r.data,'base64'));return path;}
async function openPage(){const target=await jsonEndpoint(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'}),cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;const page={target,cdp,console:[],exceptions:[],network:[]};cdp.on('Runtime.consoleAPICalled',e=>{if(['error','warning'].includes(e.type))page.console.push({level:e.type,text:e.args.map(a=>String(a.value??a.description??'')).join(' ')});});cdp.on('Runtime.exceptionThrown',e=>page.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));cdp.on('Network.loadingFailed',e=>{if(!e.canceled)page.network.push({error:e.errorText,type:e.type});});await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable'),cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})]);const url=new URL(baseUrl);url.searchParams.set('dev','1');url.searchParams.set('apex-qa',Date.now().toString());const loaded=new Promise(ok=>cdp.on('Page.loadEventFired',ok));await cdp.send('Page.navigate',{url:url.href});await Promise.race([loaded,sleep(15000)]);await waitFor(page,"document.readyState==='complete'",6000);await waitFor(page,"window.stackfallDeveloperTest?.enabled===true&&!!document.querySelector('#devApexForm')&&!!document.querySelector('#devSpawnApex')",12000);return page;}
async function closePage(page){page.cdp.close();try{await fetch(`http://127.0.0.1:${debugPort}/json/close/${page.target.id}`);}catch{}}
function check(ok,message){if(!ok)failures.push(message);}
async function configureQuietRun(page){return evaluate(page,`(()=>{GAME_SETTINGS.audio.master=false;audio.enabled=false;state.spawnTimer=99999;state.encounterTimer=99999;state.nextApexAt=1e9;player.shield=0;player.invuln=0;return true;})()`);}
async function spawnApex(page,form){
  const started=await evaluate(page,`(()=>{const s=document.querySelector('#devApexForm'),b=document.querySelector('#devSpawnApex');s.value=${JSON.stringify(form)};s.dispatchEvent(new Event('change',{bubbles:true}));b.click();return true;})()`);
  if(!started)return false;
  const active=await waitFor(page,`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.id===state.apexActiveId&&x.kind==='apex');return e?.eliteForm===${JSON.stringify(form)}&&state.mode==='playing'&&!state.realmTransition;})()`,16000);
  if(!active)return false;
  await configureQuietRun(page);
  return true;
}
async function applyPhase(page,phase){
  await evaluate(page,`(()=>{const s=document.querySelector('#devApexPhase'),b=document.querySelector('#devApplyApexPhase');s.value=${JSON.stringify(String(phase))};s.dispatchEvent(new Event('change',{bubbles:true}));b.click();return true;})()`);
  return waitFor(page,`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.id===state.apexActiveId);return e?.apexPhase===${phase};})()`,5000);
}
async function bossSnapshot(page){return evaluate(page,`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.id===state.apexActiveId);return e?{id:e.id,form:e.eliteForm,x:e.x,y:e.y,r:e.r,hp:e.hp,maxHp:e.maxHp,phase:e.apexPhase,elapsed:e.apexElapsed,speed:e.speed,mode:state.mode,player:{x:player.x,y:player.y,hp:player.hp,maxHp:player.maxHp,shield:player.shield,invuln:player.invuln},counts:{telegraphs:state.entities.telegraphs.length,projectiles:state.entities.enemyProjectiles.length,beams:state.entities.beams.length}}:null;})()`);}
async function prepIdleTest(page){return evaluate(page,`(()=>{state.spawnTimer=99999;state.encounterTimer=99999;state.nextApexAt=1e9;state.weaponSlots=[];state.weaponStacks={};for(const key of ['coreCd','bladeTick','emberCd','wellCd','fortressCd','cometCd','prismCd','chronoCd','arcCd','ionCd','novaCd','droneCd','railCd','spiralCd','mirrorCd'])player[key]=99999;player.maxHp=50000;player.hp=50000;player.shield=0;player.invuln=0;state.input.x=0;state.input.y=0;state.input.touchX=0;state.input.touchY=0;state.input.keys.clear();return{x:player.x,y:player.y,hp:player.hp};})()`);}

const chrome=findChrome();
const args=['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-size=1440,900','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','about:blank'];
browser=spawn(chrome,args,{stdio:'ignore'});debugPort=await waitForDebugPort();
let page=null;
try{
  page=await openPage();
  for(const form of forms){
    const ok=await spawnApex(page,form);check(ok,`${form}: spawn failed`);if(!ok)continue;
    await sleep(900);
    const p1=await bossSnapshot(page);observations[form]={p1};await capture(page,`${form}-p1-body`);

    const p3ok=await applyPhase(page,3);check(p3ok,`${form}: phase 3 apply failed`);await sleep(420);await capture(page,`${form}-p3-telegraph`);await sleep(900);await capture(page,`${form}-p3-active`);
    const idleStart=await prepIdleTest(page);const bossStart=await bossSnapshot(page);await sleep(7000);const idleEnd=await bossSnapshot(page);const hpLoss=idleStart.hp-(idleEnd?.player?.hp??idleStart.hp),playerDrift=Math.hypot((idleEnd?.player?.x??idleStart.x)-idleStart.x,(idleEnd?.player?.y??idleStart.y)-idleStart.y);observations[form].idle={start:idleStart,end:idleEnd?.player,hpLoss,playerDrift};check(hpLoss>0,`${form}: representative phase-3 idle cycle did not damage stationary player`);
    if(form==='starforge'){const bossDrift=Math.hypot((idleEnd?.x??bossStart.x)-bossStart.x,(idleEnd?.y??bossStart.y)-bossStart.y);observations[form].stationary={start:{x:bossStart.x,y:bossStart.y},end:{x:idleEnd?.x,y:idleEnd?.y},drift:bossDrift};check(bossDrift<0.01,`starforge: Omega moved ${bossDrift.toFixed(3)} world units`);check((p1?.r||0)>=100,'starforge: Omega visual body radius is not substantially larger than ordinary bosses');}

    const p4ok=await applyPhase(page,4);check(p4ok,`${form}: phase 4 apply failed`);await evaluate(page,`(()=>{player.hp=50000;player.maxHp=50000;player.shield=0;player.invuln=0;return true;})()`);await sleep(420);await capture(page,`${form}-p4-telegraph`);await sleep(950);await capture(page,`${form}-p4-active`);observations[form].p4=await bossSnapshot(page);
  }
  check(page.exceptions.length===0,`runtime exceptions: ${page.exceptions.join(' | ')}`);
  const hardConsole=page.console.filter(x=>x.level==='error');check(hardConsole.length===0,`console errors: ${hardConsole.map(x=>x.text).join(' | ')}`);
  check(page.network.length===0,`network failures: ${page.network.map(x=>x.error).join(' | ')}`);
  const report={ok:failures.length===0,url:baseUrl,commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),failures,observations,console:page.console,exceptions:page.exceptions,network:page.network,screenshots:forms.flatMap(form=>['p1-body','p3-telegraph','p3-active','p4-telegraph','p4-active'].map(stage=>`screenshots/${form}-${stage}.png`))};
  writeFileSync(resultPath,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(!report.ok)process.exitCode=1;
}finally{
  if(page)await closePage(page);
  if(browser&&browser.exitCode===null)browser.kill('SIGTERM');
  await sleep(300);
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
