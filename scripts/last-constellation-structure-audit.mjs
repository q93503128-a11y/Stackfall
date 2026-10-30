import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'test-results','atropos-visual');mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-last-constellation-'));
const port=8006,debugPort=9230;
const chromeCandidates=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean);
const chromePath=chromeCandidates.find(existsSync);if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||rel==='')rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,''),path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const {readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1440,900','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=15000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-2000)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.events=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);return;}for(const fn of this.events.get(m.method)||[])fn(m.params);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}on(name,fn){const a=this.events.get(name)||[];a.push(fn);this.events.set(name,a);}close(){this.ws?.close();}}
let cdp;const report={startedAt:new Date().toISOString(),checks:[],captures:[],exceptions:[]};
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=18000,interval=70){const st=Date.now();while(Date.now()-st<timeout){try{const value=await evalJs(expression);if(value)return value;}catch{}await sleep(interval);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){report.checks.push({ok:!!ok,label,details});if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);}
async function capture(name,meta={}){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:90,captureBeyondViewport:false,fromSurface:true});const file=`lastconstellation-${name}.jpg`;writeFileSync(join(out,file),Buffer.from(r.data,'base64'));report.captures.push({file,...meta});}

async function start(){
  await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1&lc=${Date.now()}`});
  await waitFor(`window.stackfallLastConstellationProduction==='v2'&&window.stackfallLastConstellationReset==='v1'&&typeof stackfallDeveloperTest==='object'&&typeof beginApexEncounter==='function'`);
  const started=await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=['lastconstellation'];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex='chronophage';state.pendingApexForm=null;state.apexActiveId=null;state.apexExitPending=false;return beginApexEncounter();})()`);
  check(started,'encounter starts');
  await waitFor(`state.entities.enemies.some(e=>!e?.dead&&e.apexForm==='lastconstellation')`);
  await waitFor(`!state.realmTransition&&state.mode==='playing'`);await sleep(260);
}
async function diag(){return evalJs(`window.stackfallLastConstellationProductionDiagnostics?.()`);}
async function destroyCurrentLayer(){return evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');if(!e)return null;const before=e.lcStructure.phase;const parts=(e.bodyParts||[]).filter(p=>p.lcNodeProxy&&p.active);for(const p of parts)dealDamage(p,1e12,{});return{before,count:parts.length,after:e.lcStructure.phase,hp:e.hp,maxHp:e.maxHp};})()`);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  cdp.on('Runtime.exceptionThrown',e=>report.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);
  await start();
  let d=await diag();report.p1=d;
  check(d?.version==='v2','production v2 active',d);check(d?.totalNodes===11,'eleven total nodes',d);check(d?.distribution?.outer===4&&d?.distribution?.middle===3&&d?.distribution?.inner===3&&d?.distribution?.core===1,'4-3-3-1 distribution',d);check(d?.phase===1&&d?.activeNodes?.length===4,'P1 exposes four outer nodes',d);check(d?.anchored===true,'structure is anchored',d);
  const reset=await evalJs(`window.stackfallLastConstellationResetDiagnostics?.()`);check(reset?.patternsSuppressed===true&&reset?.screenSpaceConstellationBackground===false,'legacy attacks and screen-space constellation are disabled',reset);
  const posA=await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');return{x:e.x,y:e.y};})()`);await sleep(500);const posB=await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');return{x:e.x,y:e.y};})()`);check(Math.hypot(posA.x-posB.x,posA.y-posB.y)<.5,'boss structure does not roam',{posA,posB});
  const hazardsBefore=await evalJs(`({t:state.entities.telegraphs.length,p:state.entities.enemyProjectiles.length})`);await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');apexBossSkill(e,2);apexPhaseDirector(e,2);bossAntiIdleSkill(e,2);return true;})()`);await sleep(120);const hazardsAfter=await evalJs(`({t:state.entities.telegraphs.length,p:state.entities.enemyProjectiles.length})`);check(hazardsAfter.t===hazardsBefore.t&&hazardsAfter.p===hazardsBefore.p,'legacy attack entry points produce no hazards',{hazardsBefore,hazardsAfter});
  await capture('p1-outer',{diag:d});

  let step=await destroyCurrentLayer();check(step.count===4&&step.after===2,'destroying four outer nodes enters P2',step);await sleep(180);d=await diag();check(d.phase===2&&d.activeNodes.length===3,'P2 exposes three middle nodes',d);report.p2=d;await capture('p2-middle',{diag:d});
  step=await destroyCurrentLayer();check(step.count===3&&step.after===3,'destroying three middle nodes enters P3',step);await sleep(180);d=await diag();check(d.phase===3&&d.activeNodes.length===3,'P3 exposes three inner nodes',d);report.p3=d;await capture('p3-inner',{diag:d});
  step=await destroyCurrentLayer();check(step.count===3&&step.after===4,'destroying three inner nodes awakens core',step);await sleep(1250);d=await diag();check(d.phase===4&&d.coreActive===true&&d.activeNodes.length===1&&d.activeNodes[0]==='core','P4 exposes only the central core',d);report.p4=d;await capture('p4-core',{diag:d});
  const body=await evalJs(`window.stackfallBossPartDiagnostics?.()`);check(body?.parts?.length===1&&body.parts[0].key==='lc-core','P4 target proxy is core only',body);
  check(report.exceptions.length===0,'runtime has no exceptions',report.exceptions);report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error?.stack||error);throw error;
}finally{
  writeFileSync(join(out,'lastconstellation-structure-observations.json'),JSON.stringify(report,null,2));
  try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(100);try{server.close();}catch{}try{rmSync(profile,{recursive:true,force:true});}catch{}
}
