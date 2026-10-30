import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'test-results','atropos-visual');mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-apex-identity-'));
const port=8001,debugPort=9225;
const chromeCandidates=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean);
const chromePath=chromeCandidates.find(existsSync);if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||rel==='')rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,''),path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const {readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1280,720','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=15000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-2000)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.events=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);return;}for(const fn of this.events.get(m.method)||[])fn(m.params);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}on(name,fn){const a=this.events.get(name)||[];a.push(fn);this.events.set(name,a);}close(){this.ws?.close();}}
let cdp;const report={startedAt:new Date().toISOString(),checks:[],captures:[],exceptions:[],console:[]};
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=18000,interval=70){const st=Date.now();while(Date.now()-st<timeout){try{const value=await evalJs(expression);if(value)return value;}catch{}await sleep(interval);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){report.checks.push({ok:!!ok,label,details});if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);}
async function capture(name,meta={}){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88,captureBeyondViewport:false,fromSurface:true});const file=`identity-${name}.jpg`;writeFileSync(join(out,file),Buffer.from(r.data,'base64'));report.captures.push({file,...meta});}

async function startForm(form){
  await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1&identity=${form}&t=${Date.now()}`});
  await waitFor(`window.stackfallApexVisualRestore==='pre-9af0cdec-2026-07-20'&&window.stackfallApexIdentityCombat==='v1'&&(${JSON.stringify(form)}!=='starforge'||window.stackfallOmegaProduction==='v1')&&typeof stackfallDeveloperTest==='object'&&typeof beginApexEncounter==='function'`);
  const started=await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=[${JSON.stringify(form)}];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex=${JSON.stringify(form==='chronophage'?'starforge':'chronophage')};state.pendingApexForm=null;state.apexActiveId=null;state.apexExitPending=false;return beginApexEncounter();})()`);
  check(started,`${form}: encounter starts`);
  await waitFor(`state.entities.enemies.some(e=>!e?.dead&&e.apexForm===${JSON.stringify(form)})`);
  await waitFor(`!state.realmTransition&&state.mode==='playing'`);
  await sleep(220);
  return evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x?.dead&&x.apexForm===${JSON.stringify(form)});return e?{id:e.id,x:e.x,y:e.y,r:e.r,phase:e.apexPhase||1,hp:e.hp,maxHp:e.maxHp}:null;})()`);
}

async function auditChronophage(){
  const e=await startForm('chronophage');check(!!e,'chronophage: entity exists',e);
  await waitFor(`window.stackfallApexIdentityDiagnostics?.().chronophage?.bodyParts===0`);
  const diag=await evalJs(`window.stackfallApexIdentityDiagnostics()`);report.chronophage=diag;
  check(diag?.chronophage?.bodyParts===0,'chronophage: stale multipart proxies removed',diag?.chronophage);
  check(diag?.chronophage?.clockworkTargeting===true,'chronophage: clockwork targeting migration active',diag?.chronophage);
  for(const key of['core','comet','rail']){
    const target=diag?.targets?.[key];
    check(target&&!target.bodyPart,`chronophage: ${key} does not target hidden body part`,target);
    check(target?.ownerForm==='chronophage',`chronophage: ${key} resolves to Chronophage owner`,target);
    check(Math.hypot((target?.x??1e9)-e.x,(target?.y??1e9)-e.y)<1,`chronophage: ${key} aims at visible center`,{target,boss:e});
  }
  await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='chronophage');e.atroposReborn.slashCd=0;return true;})()`);
  await waitFor(`state.entities.enemies.find(x=>!x.dead&&x.apexForm==='chronophage')?.atroposReborn?.slash?.age>.58`);
  await capture('chronophage-space-cut-telegraph',{diag});
  await waitFor(`state.entities.enemies.find(x=>!x.dead&&x.apexForm==='chronophage')?.atroposReborn?.slash?.age>1.22`);
  await capture('chronophage-space-cut-impact');
}

async function auditStarforge(){
  const e=await startForm('starforge');check(!!e,'starforge: entity exists',e);
  const before=await evalJs(`({telegraphs:state.entities.telegraphs.length,projectiles:state.entities.enemyProjectiles.length,diag:window.stackfallOmegaProductionDiagnostics?.()})`);
  await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='starforge');apexBossSkill(e,.25);apexPhaseDirector(e,.25);apexVariantAttack(e,e.apexPhase||1);bossAntiIdleSkill(e,2);return true;})()`);await sleep(180);
  const result=await evalJs(`({telegraphs:state.entities.telegraphs.length,projectiles:state.entities.enemyProjectiles.length,diag:window.stackfallOmegaProductionDiagnostics?.()})`);report.starforge={before,result};
  check(result.diag?.legacyAttacksDisabled===true,'starforge: legacy attack kit is disabled',result);
  check(result.diag?.plateCount===8,'starforge: P1 shell has eight plates',result.diag);
  check(result.telegraphs===before.telegraphs&&result.projectiles===before.projectiles,'starforge: old attack entry points create no hazards',{before,result});
  check(result.diag?.forgeTidalCore===false,'starforge: legacy tidal core remains disabled',result.diag);
  await capture('starforge-clean-slate',{diag:result.diag});
}

async function auditConstellation(){
  const e=await startForm('lastconstellation');check(!!e,'lastconstellation: entity exists',e);
  const result=await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');e.apexPhase=3;const arena=state.apexArena||{x:player.x,y:player.y,r:460},d=Math.max(8,e.damage*.31);constellationCage(e,d,arena,3,.96);return window.stackfallApexIdentityDiagnostics();})()`);report.lastconstellation=result;
  check(result?.customTelegraphs?.some(t=>t.style==='apex-id:constellation-link'),'lastconstellation: node links use custom identity',result);
  check(result?.customTelegraphs?.some(t=>t.style==='apex-id:constellation-cut'),'lastconstellation: central cut uses custom identity',result);
  await sleep(220);await capture('lastconstellation-node-map',{diag:result});
  await sleep(760);await capture('lastconstellation-link-impact');
}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  cdp.on('Runtime.exceptionThrown',e=>report.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));
  cdp.on('Runtime.consoleAPICalled',e=>report.console.push({type:e.type,text:(e.args||[]).map(a=>String(a.value??a.description??'')).join(' ')}));
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);
  await auditChronophage();await auditStarforge();await auditConstellation();
  check(report.exceptions.length===0,'runtime: no exceptions',report.exceptions);
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error?.stack||error);throw error;
}finally{
  writeFileSync(join(out,'identity-observations.json'),JSON.stringify(report,null,2));
  try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(100);try{server.close();}catch{}try{rmSync(profile,{recursive:true,force:true});}catch{}
}
