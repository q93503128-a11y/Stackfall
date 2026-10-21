import {spawn} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=resolve('test-results/achievement-live-qa');
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'stackfall-achievement-qa-'));
const chrome=process.env.STACKFALL_CHROME||'/usr/bin/google-chrome';
const port=9227;
const browser=spawn(chrome,['--headless=new',`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1920,1080','--force-device-scale-factor=1','--no-sandbox','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding','--no-first-run','--no-default-browser-check','about:blank'],{stdio:'ignore'});
let cdp=null;
const checks=[];
function check(name,ok,detail=''){checks.push({name,ok:!!ok,detail});if(!ok)console.error('FAIL',name,detail);else console.log('PASS',name,detail);}
async function json(path,options={}){for(let i=0;i<100;i++){try{const r=await fetch(`http://127.0.0.1:${port}${path}`,options);if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error('CDP endpoint unavailable');}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((resolve,reject)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);});});}async send(method,params={}){await this.ready;const id=++this.id;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.pending.delete(id))reject(new Error(`timeout ${method}`));},20000);});}close(){this.ws?.close();}}
async function evalJs(expr){const r=await cdp.send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function shot(name){const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(join(out,name),Buffer.from(r.data,'base64'));}
async function waitFor(expr,timeout=15000){const started=Date.now();while(Date.now()-started<timeout){try{if(await evalJs(expr))return true;}catch{}await sleep(150);}return false;}
async function navigate(){const url=`https://stackfall.pages.dev/?achievement-qa=${Date.now()}`;const loaded=new Promise(resolve=>{const handler=e=>{if(e.method==='Page.loadEventFired')resolve();};});await cdp.send('Page.navigate',{url});await sleep(5200);await waitFor("!!window.stackfallEndlessProgression&&!!document.querySelector('#achievementHubBtn')",15000);}

try{
  await json('/json/version');
  const target=await json(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'});
  cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await cdp.send('Page.enable');await cdp.send('Runtime.enable');
  await navigate();
  const menu=await evalJs(`(()=>({cards:[...document.querySelectorAll('.hub-panel>.hub-mode-card')].map(x=>({id:x.id,text:x.innerText,disabled:x.disabled})),stageDisabled:document.querySelector('#stageMapBtn')?.disabled,achievement:document.querySelector('#achievementHubBtn')?.innerText,build:window.STACKFALL_BUILD_SHA}))()`);
  check('main menu has four mode cards',menu.cards.length===4,JSON.stringify(menu.cards));
  check('stage remains sealed',menu.stageDisabled===true);
  check('achievement card visible',/업적/.test(menu.achievement||''),menu.achievement||'');
  await shot('01-main-menu.png');

  await evalJs("document.querySelector('#achievementHubBtn').click();true");
  await waitFor("!document.querySelector('#achievementScreen').classList.contains('hidden')");
  const ach=await evalJs(`(()=>({rows:document.querySelectorAll('#achievementScreen .achievement-row').length,sections:document.querySelectorAll('#achievementScreen .achievement-section').length,text:document.querySelector('#achievementScreen').innerText,total:document.querySelector('#achievementTotal')?.textContent,rect:document.querySelector('.achievement-modal')?.getBoundingClientRect().toJSON()}))()`);
  check('achievement screen has 21 rewards',ach.rows===21,String(ach.rows));
  check('achievement screen separates weapon and feature rewards',ach.sections===2,String(ach.sections));
  check('hard achievement condition visible',ach.text.includes('어려움 난이도')&&ach.text.includes('초월체 1회 처치'));
  check('awakening achievement condition visible',ach.text.includes('무기 각성')&&ach.text.includes('무한모드 10분 생존'));
  check('no legacy stage clear copy in achievement screen',!/STAGE\s*(3|6|12|14|16|18)|스테이지\s*(3|6|12|14|16|18)/i.test(ach.text),ach.text.match(/.{0,20}(?:STAGE|스테이지).{0,20}/i)?.[0]||'');
  check('achievement modal fits desktop viewport',ach.rect&&ach.rect.top>=0&&ach.rect.bottom<=1080&&ach.rect.left>=0&&ach.rect.right<=1920,JSON.stringify(ach.rect));
  await shot('02-achievements.png');

  await evalJs("document.querySelector('#achievementCloseBtn').click();document.querySelector('#startBtn').click();true");
  await waitFor("!document.querySelector('#sortiePrepScreen').classList.contains('hidden')&&!!document.querySelector('.difficulty-option[data-difficulty=\"hard\"]')");
  await sleep(300);
  const hardLocked=await evalJs(`(()=>{const b=document.querySelector('.difficulty-option[data-difficulty="hard"]');return{disabled:b?.disabled,text:b?.innerText,stageText:/Stage 6 CLEAR/i.test(b?.innerText||'')}})()`);
  check('hard difficulty is achievement-locked before completion',hardLocked.disabled===true,hardLocked.text||'');
  check('hard difficulty shows achievement condition',/초월체\s*1회\s*처치/.test(hardLocked.text||''),hardLocked.text||'');
  check('hard difficulty no longer says Stage 6 CLEAR',hardLocked.stageText===false,hardLocked.text||'');
  await shot('03-hard-locked.png');

  const unlockResult=await evalJs(`(()=>{document.querySelector('#sortiePrepClose')?.click();window.stackfallMeta.bossRecords.apex=1;const rows=window.stackfallEndlessProgression.evaluateAchievements({time:600,kills:0,level:1,maxCombo:0});return{rewards:rows.map(r=>r.feature||r.weapon),hard:window.stackfallIsFeatureAcquired('hard'),awakening:window.stackfallIsFeatureAcquired('awakening')};})()`);
  check('feature achievements grant hard + awakening',unlockResult.hard&&unlockResult.awakening,JSON.stringify(unlockResult));
  await cdp.send('Page.reload',{ignoreCache:true});await sleep(5200);await waitFor("!!window.stackfallEndlessProgression&&!!document.querySelector('#achievementHubBtn')",15000);
  const persisted=await evalJs(`(()=>({hard:window.stackfallIsFeatureAcquired('hard'),awakening:window.stackfallIsFeatureAcquired('awakening'),completed:window.stackfallEndlessProgression.progress.completed}))()`);
  check('feature achievement unlocks persist after reload',persisted.hard&&persisted.awakening,JSON.stringify(persisted));
  await evalJs("document.querySelector('#startBtn').click();true");await waitFor("!document.querySelector('#sortiePrepScreen').classList.contains('hidden')");await sleep(250);
  const hardOpen=await evalJs(`(()=>{const b=document.querySelector('.difficulty-option[data-difficulty="hard"]');return{disabled:b?.disabled,text:b?.innerText}})()`);
  check('hard difficulty becomes selectable after achievement',hardOpen.disabled===false,hardOpen.text||'');
  await shot('04-hard-unlocked.png');

  const result={ok:checks.every(x=>x.ok),checks,build:menu.build,generatedAt:new Date().toISOString()};
  writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
}catch(error){
  console.error(error.stack||error);writeFileSync(join(out,'fatal.txt'),String(error.stack||error));process.exitCode=1;
}finally{
  try{cdp?.close();}catch{}try{browser.kill('SIGKILL');}catch{}await sleep(300);try{rmSync(profile,{recursive:true,force:true});}catch{}
}
