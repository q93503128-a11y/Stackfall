import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-achievement-v2-hub-'));
const port=8019,debugPort=9243;
const chromePath=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||!rel)rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,'');const path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const{readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1680,1000','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1800)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}close(){this.ws?.close();}}
let cdp;
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const value=await evalJs(expression);if(value)return value;}catch{}await sleep(80);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);console.log(`PASS ${label}`);}
async function waitBoot(){await waitFor(`document.readyState==='complete'&&window.stackfallEndlessProgression?.achievements?.length===40&&document.querySelector('#achievementHubBtn')&&document.querySelector('#achievementScreen')&&document.querySelector('#profileClearCount')?.textContent?.includes('/ 40')`);await sleep(150);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&achievementHubAudit=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await waitBoot();

  const hub=await evalJs(`(()=>{const a=document.querySelector('#achievementHubBtn'),s=document.querySelector('#stageMapBtn'),as=getComputedStyle(a),ss=getComputedStyle(s);return{cards:document.querySelectorAll('#menu .hub-mode-card').length,achievement:[as.gridColumnStart,as.gridColumnEnd,as.gridRowStart],stage:[ss.gridColumnStart,ss.gridColumnEnd,ss.gridRowStart],label:document.querySelector('#hubProfile .hub-profile-copy>small>span')?.textContent?.trim(),count:document.querySelector('#profileClearCount')?.textContent?.trim()};})()`);
  check(hub.cards===4,'hub contains Endless, Core, Achievements, and Galactic Operations',hub);
  check(hub.achievement[0]==='8'&&hub.achievement[1]==='11'&&hub.achievement[2]==='2','achievement button stays in its original lower-right slot',hub);
  check(hub.stage[0]==='11'&&hub.stage[1]==='13'&&hub.stage[2]==='2','Galactic Operations stays in its original far-right slot',hub);
  check(hub.label==='업적'&&/^[0-9]+ \/ 40$/.test(hub.count),'profile card shows achievement completion count only',hub);

  await evalJs(`document.querySelector('#hubProfile')?.click()`);await waitFor(`!document.querySelector('#profileScreen')?.classList.contains('hidden')`);await sleep(80);
  const profileState=await evalJs(`(()=>({achievementDetails:!!document.querySelector('#profileAchievementDetails'),label:document.querySelector('#profileDetailWeapons')?.parentElement?.querySelector('span')?.textContent?.trim(),value:document.querySelector('#profileDetailWeapons')?.textContent?.trim()}))()`);
  check(!profileState.achievementDetails&&profileState.label==='업적'&&/^[0-9]+ \/ 40$/.test(profileState.value),'profile contains only the achievement count, not the achievement list',profileState);
  await evalJs(`document.querySelector('#profileCloseBtn')?.click()`);

  await evalJs(`document.querySelector('#achievementHubBtn')?.click()`);await waitFor(`!document.querySelector('#achievementScreen')?.classList.contains('hidden')`);await sleep(80);
  const screen=await evalJs(`(()=>({rows:document.querySelectorAll('#achievementScreen .achievement-row').length,filters:document.querySelectorAll('#achievementScreen .achievement-filter,#achievementScreen .achievement-toolbar').length,sections:document.querySelectorAll('#achievementScreen .achievement-section-head').length,total:document.querySelector('#achievementTotal')?.textContent?.trim(),title:document.querySelector('#achievementTitle')?.textContent?.trim()}))()`);
  check(screen.rows===40&&screen.filters===0&&screen.sections===0,'achievement button opens one ungrouped forty-achievement list',screen);
  check(screen.title==='업적'&&/^[0-9]+ \/ 40$/.test(screen.total),'achievement screen shows the total completion count',screen);
  await evalJs(`document.querySelector('#achievementCloseBtn')?.click()`);

  await evalJs(`(()=>{localStorage.removeItem('stackfall.meta.dev.v1');localStorage.removeItem('stackfall.endless.progression.dev.v1');location.reload();return true;})()`);await waitBoot();
  const clean=await evalJs(`(()=>({weapons:[...stackfallMeta.unlockedWeapons],features:[...stackfallMeta.unlockedFeatures],version:stackfallEndlessProgression.progress.version}))()`);
  check(clean.version===4&&['blade','ember','bulwark','gravity'].every(id=>clean.weapons.includes(id)),'clean progression boots with base equipment',clean);
  check(clean.features.includes('endless')&&clean.features.includes('core-development'),'baseline Endless features remain available',clean);

  const unlock=await evalJs(`(()=>{state.mode='playing';state.runSelection={mode:'endless',stageId:null};state.runTime=181;state.time=181;state.kills=200;state.level=10;state.maxCombo=20;const rows=stackfallEndlessProgression.evaluateAchievements();return{ids:rows.map(r=>r.id),comet:stackfallIsWeaponUnlocked('comet'),chrono:stackfallIsWeaponUnlocked('chrono'),arc:stackfallIsWeaponUnlocked('arc'),ion:stackfallIsWeaponUnlocked('ion')};})()`);
  check(unlock.comet&&unlock.chrono&&unlock.arc&&unlock.ion,'live milestones still unlock their intended weapons',unlock);
  check(['survive-3m','level-10','chain-20','run-kills-200'].every(id=>unlock.ids.includes(id)),'live milestones still complete their achievements',unlock);

  await evalJs(`(()=>{localStorage.setItem('stackfall.meta.dev.v1',JSON.stringify({version:7,unlockedWeapons:['blade','ember','bulwark','gravity','comet','gate'],unlockedFeatures:['endless','core-development','hard'],clearedStages:[],bestStageTimes:{},stageClearCounts:{},currencies:{stardust:0,coreShard:0},upgrades:{},bossRecords:{mini:0,boss:0,apex:1,void:0,crash:0},lifetime:{runs:2,kills:100}}));localStorage.setItem('stackfall.endless.progression.dev.v1',JSON.stringify({version:3,completed:['survive-3m','apex-1'],weaponUnlocks:['comet','gate'],featureUnlocks:['hard'],rewardClaims:[],bestSurvival:200,bestHardSurvival:0,bestLevel:3,bestCombo:5,bestRunKills:30}));location.reload();return true;})()`);await waitBoot();
  const migrated=await evalJs(`(()=>({version:stackfallEndlessProgression.progress.version,comet:stackfallIsWeaponUnlocked('comet'),gate:stackfallIsWeaponUnlocked('gate'),hard:stackfallIsFeatureAcquired('hard'),toasts:document.querySelectorAll('#achievementToastStackV2 .achievement-toast-v2').length}))()`);
  check(migrated.version===4&&migrated.comet&&migrated.gate&&migrated.hard,'legacy progression migrates without losing unlocks',migrated);
  check(migrated.toasts===0,'migration remains silent',migrated);

  console.log('ACHIEVEMENT_REDESIGN_HUB_BROWSER_AUDIT PASS');
}finally{
  try{cdp?.close();}catch{}
  try{browser.kill('SIGTERM');}catch{}
  await sleep(100);
  try{server.close();}catch{}
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
