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
async function reloadFresh(){await evalJs(`(()=>{localStorage.removeItem('stackfall.endless.progression.v1');localStorage.removeItem('stackfall.meta.v1');localStorage.removeItem('stackfall:difficulty');return true;})()`);await cdp.send('Page.reload',{ignoreCache:true});await sleep(5200);await waitFor("!!window.stackfallEndlessProgression&&!!window.stackfallDifficultyProfiles&&!!document.querySelector('#startBtn')",15000);}

try{
  await json('/json/version');
  const target=await json(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'});
  cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await cdp.send('Page.enable');await cdp.send('Runtime.enable');
  await cdp.send('Page.navigate',{url:`https://stackfall.pages.dev/?very-hard-qa=${Date.now()}`});await sleep(5200);
  await waitFor("!!window.stackfallEndlessProgression&&!!window.stackfallDifficultyProfiles&&!!document.querySelector('#startBtn')",15000);
  await reloadFresh();

  const profiles=await evalJs(`(()=>({hard:window.stackfallDifficultyProfiles.hard,veryHard:window.stackfallDifficultyProfiles['very-hard'],feature:window.STACKFALL_FEATURE_DEFS?.['very-hard']}))()`);
  check('hard balance uplift is live',profiles.hard?.enemyHp===1.42&&profiles.hard?.enemyDamage===1.36&&profiles.hard?.enemySpeed===1.14&&profiles.hard?.rangedChance===1.35&&profiles.hard?.rewardMultiplier===1.4,JSON.stringify(profiles.hard));
  check('very hard profile is live',profiles.veryHard?.enemyHp===1.8&&profiles.veryHard?.enemyDamage===1.6&&profiles.veryHard?.enemySpeed===1.2&&profiles.veryHard?.rangedChance===1.55&&profiles.veryHard?.rewardMultiplier===1.7,JSON.stringify(profiles.veryHard));
  check('very hard feature is registered',!!profiles.feature,JSON.stringify(profiles.feature));

  // Real in-run trigger: advance an actual Endless run across the 3-minute achievement threshold.
  await evalJs("document.querySelector('#startBtn').click();true");
  await waitFor("!document.querySelector('#sortiePrepScreen')?.classList.contains('hidden')&&document.querySelectorAll('.difficulty-option').length===4",10000);
  const initial=await evalJs(`(()=>({options:[...document.querySelectorAll('.difficulty-option')].map(b=>({key:b.dataset.difficulty,disabled:b.disabled,text:b.innerText})),rect:document.querySelector('.difficulty-picker')?.getBoundingClientRect().toJSON(),vw:innerWidth,vh:innerHeight}))()`);
  check('four difficulty choices render',initial.options.length===4,JSON.stringify(initial.options));
  const hardLocked=initial.options.find(x=>x.key==='hard'),veryHardLocked=initial.options.find(x=>x.key==='very-hard');
  check('hard remains achievement locked on fresh profile',hardLocked?.disabled===true&&/초월체 1회 처치/.test(hardLocked?.text||''),hardLocked?.text||'');
  check('very hard is achievement locked',veryHardLocked?.disabled===true,veryHardLocked?.text||'');
  check('very hard lock explains hard 15 minute survival',/어려움 난이도에서 15분 생존/.test(veryHardLocked?.text||''),veryHardLocked?.text||'');
  check('difficulty picker fits desktop viewport',initial.rect&&initial.rect.left>=0&&initial.rect.right<=initial.vw&&initial.rect.top>=0&&initial.rect.bottom<=initial.vh,JSON.stringify(initial));
  await shot('01-difficulty-picker-locked.png');

  await evalJs("document.querySelector('#sortieLaunchBtn').click();true");
  await waitFor("state.mode==='playing'&&!document.querySelector('#hud')?.classList.contains('hidden')",10000);
  await evalJs(`(()=>{state.time=180;state.kills=0;state.level=1;state.maxCombo=0;updatePlayer(.5);return true;})()`);
  await waitFor("!!document.querySelector('.achievement-toast.show')",3000);
  const liveToast=await evalJs(`(()=>{const t=document.querySelector('.achievement-toast');const r=t?.getBoundingClientRect();return{exists:!!t,visible:!!t?.classList.contains('show'),text:t?.innerText||'',rect:r?.toJSON(),vw:innerWidth,vh:innerHeight,pointer:getComputedStyle(document.querySelector('#achievementToastStack')).pointerEvents,completed:window.stackfallEndlessProgression.progress.completed.includes('survive-3m')}})()`);
  check('achievement is detected during gameplay',liveToast.completed===true,JSON.stringify(liveToast));
  check('achievement toast is visible and nonblocking',liveToast.exists&&liveToast.visible&&liveToast.pointer==='none',JSON.stringify(liveToast));
  check('achievement toast contains completion and reward copy',/업적 달성/.test(liveToast.text)&&/혜성 창/.test(liveToast.text)&&/무한모드 3분 생존/.test(liveToast.text),liveToast.text);
  check('achievement toast fits gameplay viewport',liveToast.rect&&liveToast.rect.left>=0&&liveToast.rect.right<=liveToast.vw&&liveToast.rect.top>=0&&liveToast.rect.bottom<=liveToast.vh,JSON.stringify(liveToast));
  await shot('02-achievement-toast-live.png');
  await sleep(3400);
  check('achievement toast dismisses automatically',await evalJs("!document.querySelector('.achievement-toast')")===true);

  // Fresh profile again for a clean unlock chain: Apex -> Hard -> Hard 15m -> Very Hard.
  await reloadFresh();
  const hardGrant=await evalJs(`(()=>{window.stackfallMeta.bossRecords=window.stackfallMeta.bossRecords||{};window.stackfallMeta.bossRecords.apex=1;const rows=window.stackfallEndlessProgression.evaluateAchievements({time:0,kills:0,level:1,maxCombo:0,difficulty:'normal'});return{granted:rows.map(r=>r.feature||r.weapon),hard:window.stackfallIsFeatureUnlocked('hard')};})()`);
  check('apex achievement grants hard',hardGrant.hard===true&&hardGrant.granted.includes('hard'),JSON.stringify(hardGrant));
  await evalJs("document.querySelector('#startBtn').click();true");await waitFor("!document.querySelector('#sortiePrepScreen')?.classList.contains('hidden')",5000);
  const mid=await evalJs(`(()=>{const h=document.querySelector('.difficulty-option[data-difficulty="hard"]'),v=document.querySelector('.difficulty-option[data-difficulty="very-hard"]');return{hardDisabled:h?.disabled,hardText:h?.innerText||'',veryHardDisabled:v?.disabled,veryHardText:v?.innerText||''}})()`);
  check('hard becomes selectable and shows +40 percent',mid.hardDisabled===false&&/40%/.test(mid.hardText),JSON.stringify(mid));
  check('very hard remains locked before hard survival',mid.veryHardDisabled===true&&/15분 생존/.test(mid.veryHardText),JSON.stringify(mid));
  await shot('03-hard-unlocked-very-hard-locked.png');

  const veryHardGrant=await evalJs(`(()=>{document.querySelector('#sortiePrepClose')?.click();const rows=window.stackfallEndlessProgression.evaluateAchievements({time:900,kills:0,level:1,maxCombo:0,difficulty:'hard'});return{granted:rows.map(r=>r.feature||r.weapon),feature:window.stackfallIsFeatureUnlocked('very-hard'),condition:window.stackfallFeatureAchievementCondition('very-hard')};})()`);
  check('hard 15 minute achievement grants very hard',veryHardGrant.feature===true&&veryHardGrant.granted.includes('very-hard'),JSON.stringify(veryHardGrant));
  check('very hard condition remains canonical',veryHardGrant.condition==='어려움 난이도에서 15분 생존',veryHardGrant.condition||'');
  await evalJs("document.querySelector('#startBtn').click();true");await waitFor("!document.querySelector('#sortiePrepScreen')?.classList.contains('hidden')",5000);
  const open=await evalJs(`(()=>{const h=document.querySelector('.difficulty-option[data-difficulty="hard"]'),v=document.querySelector('.difficulty-option[data-difficulty="very-hard"]');return{hardDisabled:h?.disabled,hardText:h?.innerText||'',veryHardDisabled:v?.disabled,veryHardText:v?.innerText||''}})()`);
  check('very hard becomes selectable',open.veryHardDisabled===false,JSON.stringify(open));
  check('very hard copy advertises +70 percent',/70%/.test(open.veryHardText||''),open.veryHardText||'');
  await shot('04-very-hard-unlocked.png');

  const result={ok:checks.every(x=>x.ok),checks,generatedAt:new Date().toISOString()};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
}catch(error){console.error(error.stack||error);writeFileSync(join(out,'fatal.txt'),String(error.stack||error));process.exitCode=1;}finally{try{cdp?.close();}catch{}try{browser.kill('SIGKILL');}catch{}await sleep(300);try{rmSync(profile,{recursive:true,force:true});}catch{}}
