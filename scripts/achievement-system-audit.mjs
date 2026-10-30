import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-achievement-audit-'));
const port=8013,debugPort=9237;
const chromePath=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||!rel)rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,'');const path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const {readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1440,1000','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1800)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}close(){this.ws?.close();}}
let cdp;
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const value=await evalJs(expression);if(value)return value;}catch{}await sleep(80);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);console.log(`PASS ${label}`);}
async function navigate(tag){const url=`http://127.0.0.1:${port}/?dev=1&achievementAudit=${tag}-${Date.now()}`;await cdp.send('Page.navigate',{url});await waitFor(`document.readyState==='complete'&&Array.isArray(window.STACKFALL_ACHIEVEMENTS)&&window.STACKFALL_ACHIEVEMENTS.length===37&&document.querySelector('#profileAchievements')&&typeof window.stackfallAchievementProgress==='function'`);await sleep(120);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&achievementAudit=boot`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await navigate('clean');
  let snapshot=await evalJs(`(()=>({version:stackfallMeta.version,count:STACKFALL_ACHIEVEMENTS.length,achievements:!!stackfallMeta.achievements,stats:!!stackfallMeta.achievementStats,ui:!!document.querySelector('#profileAchievements'),filters:document.querySelectorAll('.achievement-filter').length,cards:document.querySelectorAll('.achievement-card').length}))()`);
  check(snapshot.version===8&&snapshot.count===37&&snapshot.achievements&&snapshot.stats,'v8 achievement meta schema loads',snapshot);
  check(snapshot.ui&&snapshot.filters===6&&snapshot.cards===37,'profile achievement browser renders all definitions',snapshot);

  const runtimeUnlock=await evalJs(`(()=>{localStorage.removeItem('stackfall.meta.dev.v1');location.reload();return true;})()`);check(runtimeUnlock===true,'clean dev save reset requested');
  await waitFor(`document.readyState==='complete'&&window.stackfallMeta?.version===8&&document.querySelector('#profileAchievements')`);await sleep(120);
  const beforeToast=await evalJs(`document.querySelectorAll('#achievementToastStack .achievement-toast').length`);
  await evalJs(`(()=>{state.time=65;state.level=7;state.maxCombo=12;state.weaponStacks={blade:2};stackfallRecordRun(120);return true;})()`);
  const first=await evalJs(`(()=>({first:stackfallAchievementProgress('first-sortie'),kills:stackfallAchievementProgress('kills-100'),runs:stackfallMeta.lifetime.runs,totalKills:stackfallMeta.lifetime.kills,toasts:document.querySelectorAll('#achievementToastStack .achievement-toast').length,persisted:JSON.parse(localStorage.getItem('stackfall.meta.dev.v1')||'{}')}))()`);
  check(first.first?.unlocked===true&&first.kills?.unlocked===true&&first.runs===1&&first.totalKills===120,'runtime record unlocks sortie and kill achievements',first);
  check(first.toasts>beforeToast,'new runtime achievements create player toast',first);
  check(first.persisted.version===8&&first.persisted.achievements?.unlocked?.['first-sortie']&&first.persisted.achievementStats,'achievement unlocks persist inside meta save',first.persisted);

  const apex=await evalJs(`(()=>{stackfallRecordBossDefeat({kind:'apex',type:'boss',apexForm:'chronophage'});return{apex:stackfallAchievementProgress('apex-first'),form:stackfallAchievementProgress('chronophage-first'),count:stackfallMeta.achievementStats.apexForms.chronophage,bosses:stackfallMeta.bossRecords.apex};})()`);
  check(apex.apex?.unlocked===true&&apex.form?.unlocked===true&&apex.count===1&&apex.bosses===1,'Apex form defeat tracking unlocks form-specific achievements',apex);

  const filter=await evalJs(`(()=>{const buttons=[...document.querySelectorAll('.achievement-filter')],button=buttons.find(b=>b.textContent.includes('초월체')||b.textContent==='APEX');button?.click();return{active:document.querySelector('.achievement-filter.active')?.textContent,cards:document.querySelectorAll('.achievement-card').length};})()`);
  check(filter.cards===8,'category filter limits profile list to Apex achievements',filter);

  await evalJs(`(()=>{localStorage.setItem('stackfall.meta.dev.v1',JSON.stringify({version:7,profileName:'',unlockedWeapons:['blade','ember','bulwark','gravity'],unlockedFeatures:[],clearedStages:['stage-01'],bestStageTimes:{'stage-01':300},stageClearCounts:{'stage-01':1},currencies:{stardust:0,coreShard:0},upgrades:{},bossRecords:{mini:0,boss:10,apex:3,void:0,crash:0},lifetime:{runs:50,kills:1000,bosses:13}}));location.reload();return true;})()`);
  await waitFor(`document.readyState==='complete'&&window.stackfallMeta?.version===8&&document.querySelector('#profileAchievements')`);await sleep(150);
  const migrated=await evalJs(`(()=>({version:stackfallMeta.version,sorties50:stackfallAchievementProgress('sorties-50'),kills1000:stackfallAchievementProgress('kills-1000'),stageFirst:stackfallAchievementProgress('stage-first'),apex3:stackfallAchievementProgress('apex-3'),toastCount:document.querySelectorAll('#achievementToastStack .achievement-toast').length,persisted:JSON.parse(localStorage.getItem('stackfall.meta.dev.v1')||'{}')}))()`);
  check(migrated.version===8&&migrated.sorties50?.unlocked&&migrated.kills1000?.unlocked&&migrated.stageFirst?.unlocked&&migrated.apex3?.unlocked,'v7 save migrates and retroactively unlocks reconstructible achievements',migrated);
  check(migrated.toastCount===0,'migration backfill is silent and does not spam achievement toasts',migrated);
  check(migrated.persisted.version===8&&migrated.persisted.achievements&&migrated.persisted.achievementStats,'migrated v8 save is persisted',migrated.persisted);

  console.log('ACHIEVEMENT_SYSTEM_AUDIT PASS');
}finally{
  try{cdp?.close();}catch{}
  try{browser.kill('SIGTERM');}catch{}
  await sleep(100);
  try{server.close();}catch{}
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
