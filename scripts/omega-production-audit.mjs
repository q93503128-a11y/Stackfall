import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'test-results','atropos-visual');mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-omega-production-'));
const port=8013,debugPort=9237;
const chromeCandidates=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean);
const chromePath=chromeCandidates.find(existsSync);if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||rel==='')rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,''),path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const {readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1280,720','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=15000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1800)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.events=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);return;}for(const fn of this.events.get(m.method)||[])fn(m.params);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}on(name,fn){const a=this.events.get(name)||[];a.push(fn);this.events.set(name,a);}close(){this.ws?.close();}}
let cdp;const report={startedAt:new Date().toISOString(),checks:[],captures:[],exceptions:[],console:[],phases:{}};
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=16000,interval=60){const st=Date.now();while(Date.now()-st<timeout){try{const v=await evalJs(expression);if(v)return v;}catch{}await sleep(interval);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){report.checks.push({ok:!!ok,label,details});if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);}
async function capture(name,meta={}){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88,captureBeyondViewport:false,fromSurface:true});const file=`omega-${name}.jpg`;writeFileSync(join(out,file),Buffer.from(r.data,'base64'));report.captures.push({file,...meta});}
async function diag(){return evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x?.dead&&x.apexForm==='starforge'),d=window.stackfallOmegaProductionDiagnostics?.(),hud=document.querySelector('#multiBossBars')?.textContent||'',counts={telegraphs:state.entities.telegraphs.length,projectiles:state.entities.enemyProjectiles.length};return e?{diag:d,hud,hp:e.hp,maxHp:e.maxHp,phase:e.apexPhase||1,counts,tidal:!!e.forgeTidalCore}:null;})()`);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&omegaProductionAudit=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  cdp.on('Runtime.exceptionThrown',e=>report.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));
  cdp.on('Runtime.consoleAPICalled',e=>report.console.push({type:e.type,text:(e.args||[]).map(a=>String(a.value??a.description??'')).join(' ')}));
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);
  await waitFor(`window.stackfallOmegaProduction==='v1'&&window.stackfallApexEntryCamera==='v1'&&typeof stackfallDeveloperTest==='object'&&typeof beginApexEncounter==='function'`,18000);
  const started=await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=['starforge'];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex='chronophage';state.pendingApexForm=null;state.apexActiveId=null;state.apexExitPending=false;return beginApexEncounter();})()`);
  check(started,'Omega encounter starts',started);
  await waitFor(`state.realmTransition?.owner==='apex-entry'&&state.entities.enemies.some(e=>!e.dead&&e.apexForm==='starforge')`,12000);
  await waitFor(`(()=>{const d=window.stackfallOmegaProductionDiagnostics?.();return d?.entry?.active&&d.entry.core>.48&&d.entry.plates<.22;})()`,9000);
  const core=await diag();check(core?.diag?.entry?.core>.48,'Entry reveals red stellar core before armor assembly',core?.diag?.entry);await capture('entry-core',{entry:core?.diag?.entry});
  await waitFor(`(()=>{const d=window.stackfallOmegaProductionDiagnostics?.();return d?.entry?.active&&d.entry.plates>.38&&d.entry.plates<.95;})()`,9000);
  const armor=await diag();check(armor?.diag?.entry?.plates>.38,'Entry assembles armor after the stellar core',armor?.diag?.entry);await capture('entry-armor-assembly',{entry:armor?.diag?.entry});
  await waitFor(`!state.realmTransition&&state.mode==='playing'`,12000);await sleep(180);

  let snap=await diag();report.phases.p1=snap;
  check(snap?.diag?.legacyAttacksDisabled===true,'Legacy Omega attacks are disabled',snap?.diag);
  check(snap?.diag?.plateCount===8,'P1 Omega has eight armor plates',snap?.diag);
  check(!/P[1-4]/.test(snap?.hud||''),'Omega HUD does not expose P1/P2/P3/P4 text',snap?.hud);
  const before=snap.counts;
  await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='starforge');apexBossSkill(e,.25);apexPhaseDirector(e,.25);apexVariantAttack(e,e.apexPhase||1);bossAntiIdleSkill(e,2);return true;})()`);await sleep(180);
  const after=await diag();check(after.counts.telegraphs===before.telegraphs&&after.counts.projectiles===before.projectiles,'Old Omega attack entry points create no attacks',{before,after:after.counts});check(!after.tidal,'Legacy tidal core stays disabled',after);
  await capture('p1-settled',{phase:1});

  for(const [phase,ratio,plates] of [[2,.70,6],[3,.45,4],[4,.20,2]]){
    await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='starforge');e.hp=e.maxHp*${ratio};apexBossSkill(e,.05);return e.apexPhase;})()`);
    await waitFor(`window.stackfallOmegaProductionDiagnostics?.()?.phase===${phase}`,4000);await sleep(950);
    snap=await diag();report.phases['p'+phase]=snap;check(snap?.diag?.plateCount===plates,`P${phase} exposes the stellar core by reducing armor to ${plates} plates`,snap?.diag);check(!snap.tidal,`P${phase} has no legacy tidal core`,snap);await capture(`p${phase}-shell`,{phase,plates});
  }
  check(report.exceptions.length===0,'No runtime exceptions during Omega production audit',report.exceptions);report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error?.stack||error);throw error;
}finally{writeFileSync(join(out,'omega-production.json'),JSON.stringify(report,null,2));try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(120);try{server.close();}catch{}try{rmSync(profile,{recursive:true,force:true});}catch{}}
