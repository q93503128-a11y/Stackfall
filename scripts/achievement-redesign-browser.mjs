import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-achievement-v2-audit-'));
const port=8017,debugPort=9241;
const chromePath=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||!rel)rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,'');const path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const{readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1440,1000','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1800)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}close(){this.ws?.close();}}
let cdp;
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const value=await evalJs(expression);if(value)return value;}catch{}await sleep(80);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);console.log(`PASS ${label}`);}
async function waitBoot(){await waitFor(`document.readyState==='complete'&&window.stackfallEndlessProgression?.achievements?.length===40&&document.querySelector('#profileAchievementDetails')&&document.querySelectorAll('.profile-achievement-card').length===40&&document.querySelector('#profileClearCount')?.textContent?.includes('/ 40')`);await sleep(120);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&achievementV2Audit=boot`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await waitBoot();
  let snapshot=await evalJs(`(()=>{const stage=document.querySelector('#stageMapBtn'),style=getComputedStyle(stage),hub=document.querySelector('#hubProfile');return{count:stackfallEndlessProgression.achievements.length,hub:!!document.querySelector('#achievementHubBtn'),screen:!!document.querySelector('#achievementScreen'),profile:!!document.querySelector('#profileAchievementDetails'),cards:document.querySelectorAll('.profile-achievement-card').length,filters:document.querySelectorAll('.achievement-filter,.achievement-toolbar').length,menuCards:document.querySelectorAll('#menu .hub-mode-card').length,hubLabel:hub?.querySelector('.hub-profile-copy>small>span')?.textContent?.trim(),hubCount:document.querySelector('#profileClearCount')?.textContent?.trim(),stageColumn:[style.gridColumnStart,style.gridColumnEnd]};})()`);
  check(snapshot.count===40&&snapshot.profile&&snapshot.cards===40,'profile renders one forty-achievement list',snapshot);
  check(!snapshot.hub&&!snapshot.screen&&snapshot.filters===0,'no standalone achievement hub, screen, categories, or filters',snapshot);
  check(snapshot.menuCards===3,'main menu remains the original three-card layout',snapshot);
  check(snapshot.hubLabel==='업적'&&/^\d+ \/ 40$/.test(snapshot.hubCount||''),'main profile card exposes achievement progress',snapshot);
  check(snapshot.stageColumn[0]==='8'&&snapshot.stageColumn[1]==='13','stage card fills the retired achievement slot',snapshot);
  const opened=await evalJs(`(()=>{document.querySelector('#hubProfile')?.click();return true;})()`);check(opened,'profile card click requested');
  await waitFor(`!document.querySelector('#profileScreen')?.classList.contains('hidden')&&document.querySelector('#profileAchievementDetails')?.open===true`);
  const profileOrder=await evalJs(`(()=>{const modal=document.querySelector('#profileScreen .profile-modal'),details=[...modal.querySelectorAll('.profile-details')];return{open:document.querySelector('#profileAchievementDetails')?.open,first:details[0]?.id||'',summary:document.querySelector('#profileAchievementSummary')?.textContent?.trim()};})()`);
  check(profileOrder.open&&profileOrder.first==='profileAchievementDetails'&&profileOrder.summary===snapshot.hubCount,'profile opens with achievements visible first',profileOrder);
  await evalJs(`document.querySelector('#profileCloseBtn')?.click()`);

  await evalJs(`(()=>{localStorage.removeItem('stackfall.meta.dev.v1');localStorage.removeItem('stackfall.endless.progression.dev.v1');location.reload();return true;})()`);await waitBoot();
  const clean=await evalJs(`(()=>({weapons:[...stackfallMeta.unlockedWeapons],features:[...stackfallMeta.unlockedFeatures],shards:stackfallCurrency('coreShard'),progress:stackfallEndlessProgression.progress.version}))()`);
  check(clean.progress===4&&clean.weapons.includes('blade')&&clean.weapons.includes('ember')&&clean.weapons.includes('bulwark')&&clean.weapons.includes('gravity'),'clean v4 progression boots with base equipment',clean);
  check(clean.features.includes('endless')&&clean.features.includes('core-development'),'baseline Endless features remain available',clean);

  const unlock=await evalJs(`(()=>{state.mode='playing';state.runSelection={mode:'endless',stageId:null};state.runTime=181;state.time=181;state.kills=200;state.level=10;state.maxCombo=20;const rows=stackfallEndlessProgression.evaluateAchievements();return{ids:rows.map(r=>r.id),comet:stackfallIsWeaponUnlocked('comet'),chrono:stackfallIsWeaponUnlocked('chrono'),arc:stackfallIsWeaponUnlocked('arc'),ion:stackfallIsWeaponUnlocked('ion'),completed:[...stackfallEndlessProgression.progress.completed],toast:document.querySelectorAll('#achievementToastStackV2 .achievement-toast-v2').length};})()`);
  check(unlock.comet&&unlock.chrono&&unlock.arc&&unlock.ion,'live Endless milestones unlock their intended weapons',unlock);
  check(unlock.ids.includes('survive-3m')&&unlock.ids.includes('level-10')&&unlock.ids.includes('chain-20')&&unlock.ids.includes('run-kills-200'),'live milestones complete the corresponding achievements',unlock);
  check(unlock.toast>0,'new achievements display a concise player toast',unlock);

  const shardBefore=await evalJs(`stackfallCurrency('coreShard')`);
  const retired=await evalJs(`stackfallEndlessProgression.claimSurvivalMilestones(3600)`);
  const shardAfter=await evalJs(`stackfallCurrency('coreShard')`);
  check(retired===0&&shardAfter===shardBefore,'retired survival milestone faucet grants no Core Shards',{retired,shardBefore,shardAfter});

  await evalJs(`(()=>{localStorage.setItem('stackfall.meta.dev.v1',JSON.stringify({version:7,profileName:'',unlockedWeapons:['blade','ember','bulwark','gravity','comet','prism','chrono','arc','ion','nova','drone','rail','spiral','mirror','vacuum','mine','missile','gate'],unlockedFeatures:['endless','core-development','special-ability','awakening','hard','very-hard','choice-4','start-level-3','core-development-iii','multiplicity-protocol'],clearedStages:[],bestStageTimes:{},stageClearCounts:{},currencies:{stardust:0,coreShard:0},upgrades:{},bossRecords:{mini:10,boss:1,apex:3,void:0,crash:0},lifetime:{runs:9,kills:1400,bosses:14}}));localStorage.setItem('stackfall.endless.progression.dev.v1',JSON.stringify({version:3,completed:['survive-3m','mini-1','level-10','chain-20','run-kills-200','boss-1','survive-5m','run-kills-400','level-20','chain-50','lifetime-kills-1000','mini-10','survive-10m','apex-1','feature-special-ability','feature-awakening','feature-hard','feature-very-hard','feature-choice-4','feature-start-level-3','feature-core-development-iii','feature-multiplicity-protocol'],weaponUnlocks:['comet','prism','chrono','arc','ion','nova','drone','rail','spiral','mirror','vacuum','mine','missile','gate'],featureUnlocks:['special-ability','awakening','hard','very-hard','choice-4','start-level-3','core-development-iii','multiplicity-protocol'],rewardClaims:[],bestSurvival:1800,bestHardSurvival:900,bestLevel:25,bestCombo:50,bestRunKills:400}));location.reload();return true;})()`);await waitBoot();
  const migrated=await evalJs(`(()=>({version:stackfallEndlessProgression.progress.version,completed:stackfallEndlessProgression.progress.completed.length,comet:stackfallIsWeaponUnlocked('comet'),gate:stackfallIsWeaponUnlocked('gate'),hard:stackfallIsFeatureAcquired('hard'),awakening:stackfallIsFeatureAcquired('awakening'),toasts:document.querySelectorAll('#achievementToastStackV2 .achievement-toast-v2').length,persisted:JSON.parse(localStorage.getItem('stackfall.endless.progression.dev.v1')||'{}')}))()`);
  check(migrated.version===4&&migrated.comet&&migrated.gate&&migrated.hard&&migrated.awakening,'legacy Endless unlocks migrate into v4 without loss',migrated);
  check(migrated.toasts===0,'migration and backfill stay silent',migrated);
  check(migrated.persisted.version===4&&Array.isArray(migrated.persisted.completed)&&Array.isArray(migrated.persisted.rewardClaims),'v4 achievement progression persists after migration',migrated.persisted);

  console.log('ACHIEVEMENT_REDESIGN_BROWSER_AUDIT PASS');
}finally{
  try{cdp?.close();}catch{}
  try{browser.kill('SIGTERM');}catch{}
  await sleep(100);
  try{server.close();}catch{}
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
