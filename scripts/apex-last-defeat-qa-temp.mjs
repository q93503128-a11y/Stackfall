import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=resolve('test-results/apex-last-defeat');
const shots=join(out,'screenshots');
mkdirSync(shots,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'stackfall-last-apex-'));
const port=9224;
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
if(!chrome)throw new Error('Chrome not found');
const browser=spawn(chrome,['--headless=new',`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1280,800','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='';browser.stderr.on('data',d=>stderr=(stderr+d).slice(-10000));
async function endpoint(path,opts={},timeout=15000){const start=Date.now();let last='';while(Date.now()-start<timeout){try{const r=await fetch(`http://127.0.0.1:${port}${path}`,opts);if(r.ok)return r.json();last=`HTTP ${r.status}`;}catch(e){last=String(e?.message||e);}if(browser.exitCode!==null)throw new Error(`Chrome exited ${browser.exitCode}: ${stderr}`);await sleep(100);}throw new Error(`CDP endpoint timeout ${path}: ${last}`);}
class CDP{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={}){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{this.pending.set(id,{ok,fail});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.pending.delete(id))fail(new Error(`CDP timeout ${method}`));},20000);});}close(){this.ws.close();}}
let cdp;
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=15000){const start=Date.now();let v;while(Date.now()-start<timeout){v=await evalJs(expression);if(v)return v;await sleep(100);}throw new Error(`waitFor timeout: ${expression}; last=${JSON.stringify(v)}`);}
async function capture(name){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:false,fromSurface:true});writeFileSync(join(shots,`${name}.jpg`),Buffer.from(r.data,'base64'));}
let report={ok:false};
try{
  await endpoint('/json/version');
  const t=await endpoint(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'});
  cdp=new CDP(t.webSocketDebuggerUrl);await cdp.ready;
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false})]);
  await cdp.send('Page.navigate',{url:`https://stackfall.pages.dev/?dev=1&last-defeat-qa=${Date.now()}`});
  await waitFor("document.readyState==='complete'&&window.stackfallDeveloperTest?.enabled===true&&!!document.querySelector('#devApexForm')",20000);
  await evalJs("document.querySelector('#devEndlessClean')?.click();true");
  await waitFor("window.stackfallCurrentRunConfig?.()?.mode==='endless'&&state.mode==='playing'",8000);
  await evalJs(`(()=>{GAME_SETTINGS.audio.master=false;audio.enabled=false;state.spawnTimer=99999;state.encounterTimer=99999;state.nextApexAt=1e9;state.weaponSlots=[];state.weaponStacks={};player.maxHp=50000;player.hp=50000;player.shield=0;player.invuln=0;for(const k of ['coreCd','bladeTick','emberCd','wellCd','fortressCd','cometCd','prismCd','chronoCd','arcCd','ionCd','novaCd','droneCd','railCd','spiralCd','mirrorCd'])player[k]=99999;const s=document.querySelector('#devApexForm');s.value='lastconstellation';s.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#devSpawnApex').click();return true;})()`);
  await sleep(420);await capture('lastconstellation-intro-early');
  await sleep(720);await capture('lastconstellation-intro-mid');
  await waitFor("(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.id===state.apexActiveId&&x.kind==='apex');return e?.eliteForm==='lastconstellation'&&state.mode==='playing'&&!state.realmTransition;})()",18000);
  await capture('lastconstellation-active');
  const before=await evalJs("(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.id===state.apexActiveId);return e&&{id:e.id,form:e.eliteForm,hp:e.hp,maxHp:e.maxHp,phase:e.apexPhase,mode:state.mode};})()");
  const killed=await evalJs("(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.id===state.apexActiveId);if(!e)return false;e.hp=1;dealDamage(e,Math.max(1000000000,e.maxHp*10),{source:'dev',canCrit:false});return true;})()");
  if(!killed)throw new Error('Last Constellation defeat trigger failed');
  await sleep(90);await capture('lastconstellation-defeat-early');
  await sleep(620);await capture('lastconstellation-defeat-mid');
  await sleep(850);await capture('lastconstellation-defeat-late');
  const after=await evalJs("({mode:state.mode,apexActiveId:state.apexActiveId,realmTransition:state.realmTransition,apexExitPending:state.apexExitPending})");
  report={ok:true,before,after};
}catch(e){report={ok:false,error:String(e?.stack||e),stderr};process.exitCode=1;}finally{writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');try{cdp?.close();}catch{}if(browser.exitCode===null)browser.kill('SIGTERM');await sleep(200);try{rmSync(profile,{recursive:true,force:true});}catch{}}
console.log(JSON.stringify(report,null,2));
