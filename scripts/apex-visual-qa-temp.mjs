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
const phases=[1,2,3,4];
const failures=[];
const observations={};
let browser=null;
const debugPort=9222;
mkdirSync(screenshotsDir,{recursive:true});

function chromeCandidates(){
  const explicit=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH].filter(Boolean);
  if(platform()==='win32')return[...explicit,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'];
  if(platform()==='darwin')return[...explicit,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  return[...explicit,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
}
function findChrome(){const found=chromeCandidates().find(p=>p&&existsSync(p));if(!found)throw new Error('Chrome not found');return found;}
async function jsonEndpoint(path,options={},timeout=15000){
  const start=Date.now();let last;
  while(Date.now()-start<timeout){
    try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,options);if(r.ok)return r.json();last=`HTTP ${r.status}`;}catch(err){last=String(err?.message||err);}
    if(browser?.exitCode!==null)throw new Error(`Chrome exited ${browser.exitCode}; ${last||''}`);
    await sleep(120);
  }
  throw new Error(`endpoint timeout ${path}: ${last||'unknown'}`);
}
class Cdp{
  constructor(url){
    this.id=0;this.pending=new Map();this.events=new Map();
    this.ready=new Promise((ok,fail)=>{
      this.ws=new WebSocket(url);
      this.ws.addEventListener('open',ok,{once:true});
      this.ws.addEventListener('error',fail,{once:true});
      this.ws.addEventListener('message',ev=>{
        const msg=JSON.parse(ev.data);
        if(msg.id){const p=this.pending.get(msg.id);if(!p)return;this.pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.fail(new Error(msg.error.message)):p.ok(msg.result);return;}
        for(const fn of this.events.get(msg.method)||[])fn(msg.params);
      });
    });
  }
  async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  on(method,fn){const arr=this.events.get(method)||[];arr.push(fn);this.events.set(method,arr);}
  close(){this.ws?.close();}
}
async function evaluate(page,expression){const r=await page.cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(page,expression,timeout=15000,interval=120){const start=Date.now();let v;while(Date.now()-start<timeout){v=await evaluate(page,expression);if(v)return v;await sleep(interval);}return v;}
async function capture(page,name){const r=await page.cdp.send('Page.captureScreenshot',{format:'jpeg',quality:68,captureBeyondViewport:false,fromSurface:true});const path=join(screenshotsDir,`${name}.jpg`);writeFileSync(path,Buffer.from(r.data,'base64'));return path;}
async function openPage(){
  await jsonEndpoint('/json/version');
  const target=await jsonEndpoint(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'});
  const cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  const page={target,cdp,console:[],exceptions:[],network:[]};
  cdp.on('Runtime.consoleAPICalled',e=>{if(['error','warning'].includes(e.type))page.console.push({level:e.type,text:e.args.map(a=>String(a.value??a.description??'')).join(' ')});});
  cdp.on('Runtime.exceptionThrown',e=>page.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));
  cdp.on('Network.loadingFailed',e=>{if(!e.canceled)page.network.push({error:e.errorText,type:e.type,url:e.url});});
  await Promise.all([
    cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable'),
    cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false})
  ]);
  const url=new URL(baseUrl);url.searchParams.set('dev','1');url.searchParams.set('apex-qa',Date.now().toString());
  const loaded=new Promise(ok=>cdp.on('Page.loadEventFired',ok));await cdp.send('Page.navigate',{url:url.href});await Promise.race([loaded,sleep(15000)]);
  await waitFor(page,"document.readyState==='complete'",8000);
  const ready=await waitFor(page,"window.stackfallDeveloperTest?.enabled===true&&!!document.querySelector('#devApexForm')&&!!document.querySelector('#devSpawnApex')&&!!document.querySelector('#devApexPhase')",15000);
  if(!ready)throw new Error('Developer Apex tools did not mount');
  return page;
}
async function closePage(page){page.cdp.close();try{await fetch(`http://127.0.0.1:${debugPort}/json/close/${page.target.id}`);}catch{}}
function check(ok,message){if(!ok)failures.push(message);}
async function configureQuietRun(page){return evaluate(page,`(()=>{GAME_SETTINGS.audio.master=false;audio.enabled=false;state.spawnTimer=99999;state.encounterTimer=99999;state.nextApexAt=1e9;player.shield=0;player.invuln=0;return true;})()`);}
async function spawnApex(page,form){
  const started=await evaluate(page,`(()=>{const s=document.querySelector('#devApexForm'),b=document.querySelector('#devSpawnApex');s.value=${JSON.stringify(form)};s.dispatchEvent(new Event('change',{bubbles:true}));b.click();return true;})()`);
  if(!started)return false;
  const active=await waitFor(page,`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.id===state.apexActiveId&&x.kind==='apex');return e?.eliteForm===${JSON.stringify(form)}&&state.mode==='playing'&&!state.realmTransition;})()`,18000);
  if(!active)return false;
  await configureQuietRun(page);
  return true;
}
async function applyPhase(page,phase){
  await evaluate(page,`(()=>{const s=document.querySelector('#devApexPhase'),b=document.querySelector('#devApplyApexPhase');s.value=${JSON.stringify(String(phase))};s.dispatchEvent(new Event('change',{bubbles:true}));b.click();return true;})()`);
  return waitFor(page,`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.id===state.apexActiveId);return e?.apexPhase===${phase};})()`,6000);
}
async function bossSnapshot(page){return evaluate(page,`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.id===state.apexActiveId);return e?{id:e.id,form:e.eliteForm,x:e.x,y:e.y,r:e.r,hp:e.hp,maxHp:e.maxHp,phase:e.apexPhase,elapsed:e.apexElapsed,speed:e.speed,mode:state.mode,player:{x:player.x,y:player.y,hp:player.hp,maxHp:player.maxHp,shield:player.shield,invuln:player.invuln},counts:{telegraphs:state.entities.telegraphs.length,projectiles:state.entities.enemyProjectiles.length,beams:state.entities.beams.length,curves:state.entities.curves?.length||0,wells:state.entities.wells?.length||0}}:null;})()`);}
async function prepIdleTest(page){return evaluate(page,`(()=>{state.spawnTimer=99999;state.encounterTimer=99999;state.nextApexAt=1e9;state.weaponSlots=[];state.weaponStacks={};for(const key of ['coreCd','bladeTick','emberCd','wellCd','fortressCd','cometCd','prismCd','chronoCd','arcCd','ionCd','novaCd','droneCd','railCd','spiralCd','mirrorCd'])player[key]=99999;player.maxHp=50000;player.hp=50000;player.shield=0;player.invuln=0;state.input.x=0;state.input.y=0;state.input.touchX=0;state.input.touchY=0;state.input.keys.clear();return{x:player.x,y:player.y,hp:player.hp};})()`);}

const chrome=findChrome();
const args=['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1280,800','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'];
browser=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});
let browserErr='';browser.stderr?.on('data',d=>{browserErr+=d.toString();if(browserErr.length>12000)browserErr=browserErr.slice(-12000);});
let page=null;
try{
  page=await openPage();
  for(const form of forms){
    const ok=await spawnApex(page,form);check(ok,`${form}: spawn failed`);if(!ok)continue;
    observations[form]={phases:{}};
    await sleep(1000);
    observations[form].spawn=await bossSnapshot(page);
    for(const phase of phases){
      const applied=await applyPhase(page,phase);check(applied,`${form}: phase ${phase} apply failed`);if(!applied)continue;
      await evaluate(page,`(()=>{player.maxHp=50000;player.hp=50000;player.shield=0;player.invuln=0;return true;})()`);
      await sleep(280);
      const telegraph=await bossSnapshot(page);await capture(page,`${form}-p${phase}-telegraph`);
      await sleep(820);
      const active=await bossSnapshot(page);await capture(page,`${form}-p${phase}-active`);
      const idleStart=await prepIdleTest(page);const bossStart=await bossSnapshot(page);
      await sleep(9000);
      const idleEnd=await bossSnapshot(page);
      const hpLoss=idleStart.hp-(idleEnd?.player?.hp??idleStart.hp);
      const playerDrift=Math.hypot((idleEnd?.player?.x??idleStart.x)-idleStart.x,(idleEnd?.player?.y??idleStart.y)-idleStart.y);
      const bossDrift=Math.hypot((idleEnd?.x??bossStart?.x??0)-(bossStart?.x??0),(idleEnd?.y??bossStart?.y??0)-(bossStart?.y??0));
      observations[form].phases[phase]={telegraph,active,idle:{start:idleStart,end:idleEnd?.player,hpLoss,playerDrift,bossDrift},end:idleEnd};
      check(hpLoss>0,`${form}: phase ${phase} stationary player took no damage during 9s idle window`);
      if(form==='starforge')check(bossDrift<0.01,`starforge: Omega moved ${bossDrift.toFixed(3)} world units in phase ${phase}`);
    }
    if(form==='starforge')check((observations[form].spawn?.r||0)>=100,'starforge: Omega visual body radius is not substantially larger than ordinary bosses');
  }
  check(page.exceptions.length===0,`runtime exceptions: ${page.exceptions.join(' | ')}`);
  const hardConsole=page.console.filter(x=>x.level==='error');check(hardConsole.length===0,`console errors: ${hardConsole.map(x=>x.text).join(' | ')}`);
  check(page.network.length===0,`network failures: ${page.network.map(x=>`${x.type}:${x.error}`).join(' | ')}`);
  const report={ok:failures.length===0,url:baseUrl,commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),failures,observations,console:page.console,exceptions:page.exceptions,network:page.network,screenshots:forms.flatMap(form=>phases.flatMap(phase=>[`screenshots/${form}-p${phase}-telegraph.jpg`,`screenshots/${form}-p${phase}-active.jpg`]))};
  writeFileSync(resultPath,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(!report.ok)process.exitCode=1;
}catch(err){
  const crash={ok:false,url:baseUrl,commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),fatal:String(err?.stack||err),browserErr};
  writeFileSync(resultPath,JSON.stringify(crash,null,2)+'\n');console.error(crash.fatal);process.exitCode=1;
}finally{
  if(page)await closePage(page);
  if(browser&&browser.exitCode===null)browser.kill('SIGTERM');
  await sleep(350);
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
