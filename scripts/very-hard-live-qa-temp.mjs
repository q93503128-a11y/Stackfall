import {spawn} from 'node:child_process';
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=resolve('test-results/very-hard-live-qa');
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'stackfall-very-hard-qa-'));
const chrome=process.env.STACKFALL_CHROME||'/usr/bin/google-chrome';
const port=9231;
const browser=spawn(chrome,['--headless=new',`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1920,1080','--force-device-scale-factor=1','--no-sandbox','--disable-dev-shm-usage','--disable-background-timer-throttling','--disable-renderer-backgrounding','--no-first-run','--no-default-browser-check','about:blank'],{stdio:'ignore'});
let cdp=null;
const checks=[];
function check(name,ok,detail=''){checks.push({name,ok:!!ok,detail});console.log(ok?'PASS':'FAIL',name,detail);}
async function json(path,options={}){for(let i=0;i<100;i++){try{const r=await fetch(`http://127.0.0.1:${port}${path}`,options);if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error('CDP endpoint unavailable');}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((resolve,reject)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);});});}async send(method,params={}){await this.ready;const id=++this.id;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.pending.delete(id))reject(new Error(`timeout ${method}`));},20000);});}close(){this.ws?.close();}}
async function evalJs(expr){const r=await cdp.send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function shot(name){const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(join(out,name),Buffer.from(r.data,'base64'));}
async function waitFor(expr,timeout=15000){const started=Date.now();while(Date.now()-started<timeout){try{if(await evalJs(expr))return true;}catch{}await sleep(150);}return false;}

try{
  await json('/json/version');
  const target=await json(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'});
  cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await cdp.send('Page.enable');await cdp.send('Runtime.enable');
  await cdp.send('Page.navigate',{url:`https://stackfall.pages.dev/?very-hard-qa=${Date.now()}`});await sleep(5200);
  await waitFor("!!window.stackfallEndlessProgression&&!!window.stackfallDifficultyProfiles&&!!document.querySelector('#startBtn')",15000);
  await evalJs(`(()=>{localStorage.removeItem('stackfall.endless.progression.v1');localStorage.removeItem('stackfall.meta.v1');localStorage.removeItem('stackfall:difficulty');return true;})()`);
  await cdp.send('Page.reload',{ignoreCache:true});await sleep(5200);await waitFor("!!window.stackfallEndlessProgression&&!!window.stackfallDifficultyProfiles",15000);

  const profiles=await evalJs(`(()=>({hard:window.stackfallDifficultyProfiles.hard,veryHard:window.stackfallDifficultyProfiles['very-hard'],feature:window.STACKFALL_FEATURE_DEFS?.['very-hard']}))()`);
  check('hard balance uplift is live',profiles.hard?.enemyHp===1.42&&profiles.hard?.enemyDamage===1.36&&profiles.hard?.enemySpeed===1.14&&profiles.hard?.rangedChance===1.35&&profiles.hard?.rewardMultiplier===1.4,JSON.stringify(profiles.hard));
  check('very hard profile is live',profiles.veryHard?.enemyHp===1.8&&profiles.veryHard?.enemyDamage===1.6&&profiles.veryHard?.enemySpeed===1.2&&profiles.veryHard?.rangedChance===1.55&&profiles.veryHard?.rewardMultiplier===1.7,JSON.stringify(profiles.veryHard));
  check('very hard feature is registered',!!profiles.feature,JSON.stringify(profiles.feature));

  await evalJs("document.querySelector('#startBtn').click();true");
  await waitFor("!document.querySelector('#sortiePrepScreen')?.classList.contains('hidden')&&document.querySelectorAll('.difficulty-option').length===4",10000);
  const locked=await evalJs(`(()=>({options:[...document.querySelectorAll('.difficulty-option')].map(b=>({key:b.dataset.difficulty,disabled:b.disabled,text:b.innerText})),rect:document.querySelector('.difficulty-picker')?.getBoundingClientRect().toJSON()}))()`);
  check('four difficulty choices render',locked.options.length===4,JSON.stringify(locked.options));
  const hard=locked.options.find(x=>x.key==='hard'),vh=locked.options.find(x=>x.key==='very-hard');
  check('hard copy advertises +40 percent',/40%/.test(hard?.text||''),hard?.text||'');
  check('very hard is achievement locked',vh?.disabled===true,vh?.text||'');
  check('very hard lock explains hard 15 minute survival',/어려움 난이도에서 15분 생존/.test(vh?.text||''),vh?.text||'');
  check('difficulty picker fits desktop viewport',locked.rect&&locked.rect.left>=0&&locked.rect.right<=1920&&locked.rect.top>=0&&locked.rect.bottom<=1080,JSON.stringify(locked.rect));
  await shot('01-difficulty-picker-locked.png');

  const unlocked=await evalJs(`(()=>{document.querySelector('#sortiePrepClose')?.click();const rows=window.stackfallEndlessProgression.evaluateAchievements({time:900,kills:0,level:1,maxCombo:0,difficulty:'hard'});window.renderStackfallDifficulty?.();return{granted:rows.map(r=>r.feature||r.weapon),feature:window.stackfallIsFeatureUnlocked('very-hard'),condition:window.stackfallFeatureAchievementCondition('very-hard')};})()`);
  check('hard 15 minute achievement grants very hard',unlocked.feature===true&&unlocked.granted.includes('very-hard'),JSON.stringify(unlocked));
  check('very hard condition remains canonical',unlocked.condition==='어려움 난이도에서 15분 생존',unlocked.condition||'');
  await evalJs("document.querySelector('#startBtn').click();true");await waitFor("!document.querySelector('#sortiePrepScreen')?.classList.contains('hidden')",5000);
  const open=await evalJs(`(()=>{const b=document.querySelector('.difficulty-option[data-difficulty="very-hard"]');return{disabled:b?.disabled,text:b?.innerText}})()`);
  check('very hard becomes selectable',open.disabled===false,open.text||'');
  check('very hard copy advertises +70 percent',/70%/.test(open.text||''),open.text||'');
  await shot('02-difficulty-picker-unlocked.png');

  await evalJs(`(()=>{document.querySelector('#sortiePrepClose')?.click();const row=window.stackfallEndlessProgression.weaponAchievements.find(r=>r.id==='survive-3m');window.stackfallEndlessProgression.showAchievementToasts([row]);return true;})()`);await sleep(250);
  const toast=await evalJs(`(()=>{const t=document.querySelector('.achievement-toast');return{exists:!!t,visible:!!t?.classList.contains('show'),text:t?.innerText||'',rect:t?.getBoundingClientRect().toJSON(),pointer:getComputedStyle(document.querySelector('#achievementToastStack')).pointerEvents}})()`);
  check('achievement toast is visible and nonblocking',toast.exists&&toast.visible&&toast.pointer==='none',JSON.stringify(toast));
  check('achievement toast contains completion and reward copy',/업적 달성/.test(toast.text)&&toast.text.length>8,toast.text);
  check('achievement toast fits viewport',toast.rect&&toast.rect.left>=0&&toast.rect.right<=1920&&toast.rect.top>=0&&toast.rect.bottom<=1080,JSON.stringify(toast.rect));
  await shot('03-achievement-toast.png');

  await sleep(3400);
  const gone=await evalJs("!document.querySelector('.achievement-toast')");
  check('achievement toast dismisses automatically',gone===true,String(gone));

  const result={ok:checks.every(x=>x.ok),checks,generatedAt:new Date().toISOString()};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
}catch(error){console.error(error.stack||error);writeFileSync(join(out,'fatal.txt'),String(error.stack||error));process.exitCode=1;}finally{try{cdp?.close();}catch{}try{browser.kill('SIGKILL');}catch{}await sleep(300);try{rmSync(profile,{recursive:true,force:true});}catch{}}
