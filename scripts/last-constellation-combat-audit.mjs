import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'test-results','atropos-visual');mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-lc-combat-'));
const port=8007,debugPort=9231;
const chromeCandidates=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean);
const chromePath=chromeCandidates.find(existsSync);if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||rel==='')rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,'');const path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const {readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1440,900','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=15000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1800)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}close(){this.ws?.close();}}
let cdp;const report={startedAt:new Date().toISOString(),checks:[]};
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=18000){const st=Date.now();while(Date.now()-st<timeout){try{const v=await evalJs(expression);if(v)return v;}catch{}await sleep(70);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){report.checks.push({ok:!!ok,label,details});if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&lccombat=${Date.now()}`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1&lccombat=${Date.now()}`});
  await waitFor(`window.stackfallLastConstellationCombat==='v1'&&typeof stackfallDeveloperTest==='object'&&typeof beginApexEncounter==='function'`);
  const started=await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=['lastconstellation'];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex='chronophage';return beginApexEncounter();})()`);
  check(started,'encounter starts');await waitFor(`state.entities.enemies.some(e=>!e.dead&&e.apexForm==='lastconstellation')`);await waitFor(`!state.realmTransition&&state.mode==='playing'`);await sleep(250);
  const hit=await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');const part=(e.bodyParts||[]).find(p=>p.lcNodeProxy&&p.active);if(!part)return{ok:false,reason:'no-active-part'};const node=e.lcStructure.nodes[part.lcNodeKey],before=node.hp,bossBefore=e.hp;spawnPlayerProjectile({x:part.x,y:part.y,vx:0,vy:0,r:6,life:.25,maxRange:60,damage:Math.max(1,node.maxHp*.08),color:'#ffffff',pierce:0,source:'lc-audit-shot'});updateProjectiles(.016);return{ok:true,key:part.lcNodeKey,before,after:node.hp,bossBefore,bossAfter:e.hp,projectiles:state.entities.projectiles.length};})()`);
  check(hit?.ok&&hit.after<hit.before&&hit.bossAfter<hit.bossBefore,'real player projectile damages active outer node',hit);
  const routing=await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');const p=(e.bodyParts||[]).find(x=>x.lcNodeProxy&&x.active);const list=performanceNearbyEnemies(p.x,p.y,16,[]);return{key:p.lcNodeKey,found:list.some(x=>x?.lcNodeProxy&&x.id===p.id),ids:list.map(x=>x.id)};})()`);
  check(routing?.found===true,'performance collision query includes distant active node proxy',routing);
  await sleep(1900);
  const combat=await evalJs(`window.stackfallLastConstellationCombatDiagnostics?.()`);
  check(combat?.version==='v1'&&combat?.phase===1&&combat?.p1Patterns===true,'P1 combat layer active',combat);
  check((combat?.activeAttacks?.length||0)>0||(combat?.shards||0)>0,'P1 produces authored node attacks',combat);
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error?.stack||error);throw error;
}finally{writeFileSync(join(out,'lastconstellation-combat-observations.json'),JSON.stringify(report,null,2));try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(80);try{server.close();}catch{}try{rmSync(profile,{recursive:true,force:true});}catch{}}
