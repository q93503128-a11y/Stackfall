import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-achievement-v2-advanced-'));
const port=8018,debugPort=9242;
const chromePath=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||!rel)rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,'');const path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const{readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1440,1000','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1600)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}close(){this.ws?.close();}}
let cdp;
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const value=await evalJs(expression);if(value)return value;}catch{}await sleep(80);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);console.log(`PASS ${label}`);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&achievementV2Advanced=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await waitFor(`document.readyState==='complete'&&window.stackfallEndlessProgression?.achievements?.length===40`);await sleep(120);
  await evalJs(`(()=>{localStorage.removeItem('stackfall.meta.dev.v1');localStorage.removeItem('stackfall.endless.progression.dev.v1');location.reload();return true;})()`);
  await waitFor(`document.readyState==='complete'&&window.stackfallEndlessProgression?.progress?.version===4`);await sleep(120);

  const boss=await evalJs(`(()=>{state.mode='playing';state.runSelection={mode:'endless',stageId:null};state.runTime=120;state.time=120;const b=spawnEnemy('boss');updatePlayer(.016);const start={hp:player.hp,id:b?.id};if(!b)return{spawned:false};dealDamage(b,b.hp+100,{source:'core',canCrit:false});const rows=stackfallEndlessProgression.evaluateAchievements();return{spawned:true,dead:b.dead,noHit:stackfallEndlessProgression.progress.stats.bossNoHit,fast:stackfallEndlessProgression.progress.stats.bossFast,ids:rows.map(r=>r.id),shards:stackfallCurrency('coreShard'),start};})()`);
  check(boss.spawned&&boss.dead&&boss.noHit===1&&boss.fast===1,'clean fast boss kill records no-hit and 15-second achievements',boss);
  check(boss.ids.includes('boss-no-hit')&&boss.ids.includes('boss-fast-15'),'boss challenge achievements unlock from actual boss kill path',boss);

  const loadout=await evalJs(`(()=>{state.mode='playing';state.runSelection={mode:'endless',stageId:null};state.weaponStacks={blade:6,ember:6,bulwark:6,gravity:1,comet:1,prism:1};const rows=stackfallEndlessProgression.evaluateAchievements();return{ids:rows.map(r=>r.id),max:stackfallEndlessProgression.progress.stats.maxWeaponStack,maxed:stackfallEndlessProgression.progress.stats.maxedWeapons,filled:stackfallEndlessProgression.progress.stats.filledWeapons};})()`);
  check(loadout.max>=6&&loadout.maxed>=3&&loadout.filled>=6,'loadout statistics track stack and six-weapon challenges',loadout);
  check(['weapon-stack-6','three-maxed-weapons','six-weapons'].every(id=>loadout.ids.includes(id)),'loadout achievements unlock together when conditions are met',loadout);

  const apexPower=await evalJs(`(()=>{state.mode='playing';state.runSelection={mode:'endless',stageId:null};state.apexBoons={chronophage:3,starforge:0,lastconstellation:0};state.apexCoreStacks=3;const before=stackfallCurrency('coreShard');const rows=stackfallEndlessProgression.evaluateAchievements();return{ids:rows.map(r=>r.id),legacy:stackfallEndlessProgression.progress.stats.maxApexLegacyStack,core:stackfallEndlessProgression.progress.stats.maxApexCoreStack,before,after:stackfallCurrency('coreShard')};})()`);
  check(apexPower.legacy===3&&apexPower.core===3,'Apex legacy and core caps are recorded',apexPower);
  check(apexPower.ids.includes('legacy-max')&&apexPower.ids.includes('core-max')&&apexPower.after>=apexPower.before+2,'Apex cap achievements grant their limited shard rewards',apexPower);

  const veryHard=await evalJs(`(()=>{state.mode='playing';state.runSelection={mode:'endless',stageId:null};state.selectedDifficulty='very-hard';state.runTime=901;state.time=901;const rows=stackfallEndlessProgression.evaluateAchievements();return{ids:rows.map(r=>r.id),best:stackfallEndlessProgression.progress.bestVeryHardSurvival,done:stackfallEndlessProgression.progress.completed.includes('very-hard-15m')};})()`);
  check(veryHard.done&&veryHard.best>=900,'Very Hard survival achievement tracks current Endless difficulty',veryHard);

  console.log('ACHIEVEMENT_REDESIGN_ADVANCED_BROWSER_AUDIT PASS');
}finally{
  try{cdp?.close();}catch{}
  try{browser.kill('SIGTERM');}catch{}
  await sleep(100);
  try{server.close();}catch{}
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
