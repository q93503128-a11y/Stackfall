import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'test-results','atropos-visual');mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-lc-combat-v3-'));
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
let cdp;const report={startedAt:new Date().toISOString(),checks:[],captures:[]};
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=18000){const st=Date.now();while(Date.now()-st<timeout){try{const v=await evalJs(expression);if(v)return v;}catch{}await sleep(70);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){report.checks.push({ok:!!ok,label,details});if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);}
async function capture(name){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:90,captureBeyondViewport:false,fromSurface:true});const file=`lastconstellation-${name}.jpg`;writeFileSync(join(out,file),Buffer.from(r.data,'base64'));report.captures.push(file);}
async function diag(){return evalJs(`window.stackfallLastConstellationCombatDiagnostics?.()`);}
async function prodDiag(){return evalJs(`window.stackfallLastConstellationProductionDiagnostics?.()`);}
async function destroyLayer(){return evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');if(!e)return null;const before=e.lcStructure.phase;const parts=(e.bodyParts||[]).filter(p=>p.lcNodeProxy&&p.active);for(const p of parts)dealDamage(p,1e12,{source:'lc-audit-destroy',canCrit:false});return{before,count:parts.length,after:e.lcStructure.phase};})()`);}
function exactVolley(d,expectedPerNode,expectedNodes){const v=d?.lastCometVolley||{},counts=Object.values(v.byNode||{});return v.expectedPerNode===expectedPerNode&&v.activeNodes===expectedNodes&&v.spawned===expectedPerNode*expectedNodes&&counts.length===expectedNodes&&counts.every(n=>n===expectedPerNode);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&lccombat=${Date.now()}`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1&lccombat=${Date.now()}`});
  await waitFor(`window.stackfallLastConstellationCombat==='v2'&&window.stackfallLastConstellationHitRouting==='v1'&&typeof stackfallDeveloperTest==='object'&&typeof beginApexEncounter==='function'`);
  const started=await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=['lastconstellation'];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex='chronophage';return beginApexEncounter();})()`);
  check(started,'encounter starts');await waitFor(`state.entities.enemies.some(e=>!e.dead&&e.apexForm==='lastconstellation')`);await waitFor(`!state.realmTransition&&state.mode==='playing'`);await sleep(300);

  const hit=await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');const part=(e.bodyParts||[]).find(p=>p.lcNodeProxy&&p.active);if(!part)return{ok:false};const node=e.lcStructure.nodes[part.lcNodeKey],nodeBefore=node.hp,bossBefore=e.hp,xBefore=e.x,yBefore=e.y;dealDamage(part,Math.max(1,node.maxHp*.05),{source:'lc-audit-shot',canCrit:false});const sum=Object.values(e.lcStructure.nodes).reduce((n,x)=>n+Math.max(0,x.hp),0);return{ok:true,key:part.lcNodeKey,nodeDelta:nodeBefore-node.hp,bossDelta:bossBefore-e.hp,sum,bossHp:e.hp,ownerX:e.x,ownerY:e.y,xBefore,yBefore};})()`);
  check(hit?.ok&&hit.nodeDelta>0&&Math.abs(hit.nodeDelta-hit.bossDelta)<.001,'node damage and boss HP bar lose the same final damage',hit);
  check(Math.abs(hit.sum-hit.bossHp)<.001,'owner HP equals sum of all node HP',hit);
  check(hit.ownerX===hit.xBefore&&hit.ownerY===hit.yBefore,'temporary node FX routing restores owner position',hit);
  let pd=await prodDiag();check(pd?.healthSynchronized===true&&pd?.wideWorldCulling===true,'production health/culling invariants are active',pd);

  let d=await diag();check(d?.version==='v2'&&d?.revision>=3&&d.phase===1&&d.cometPerNode===1,'P1 combat revision loaded',d);
  await evalJs(`stackfallLastConstellationCombatDebug.clear();stackfallLastConstellationCombatDebug.forceComets();stackfallLastConstellationCombatDebug.forceConnection(2);stackfallLastConstellationCombatDebug.forceBeam();`);await sleep(80);d=await diag();
  check(exactVolley(d,1,4),'P1 fires exactly one homing comet from each of four active nodes',d?.lastCometVolley);
  check(d.activeLinkNodes===2&&d.activeBeams===4&&d.beamEndpointTracking===true,'P1 links and endpoint-tracking beams are live',d);
  await capture('p1-authored-kit');

  let step=await destroyLayer();check(step?.count===4&&step.after===2,'P1 destruction enters P2',step);await sleep(180);
  await evalJs(`stackfallLastConstellationCombatDebug.clear();stackfallLastConstellationCombatDebug.forceComets();stackfallLastConstellationCombatDebug.forceConnection(3);stackfallLastConstellationCombatDebug.forceBeam();stackfallLastConstellationCombatDebug.forcePulse();`);await sleep(80);d=await diag();
  check(exactVolley(d,2,3),'P2 fires exactly two homing comets from each of three active nodes',d?.lastCometVolley);
  check(d.pulseUnlocked===true&&d.pulseGapCount===3&&d.pulseWaveCount===1&&d.pulseSpeed>0&&d.pulseSpeed<=150,'P2 pulse wave has three gaps and a deliberately slow expansion speed',d);
  check(d.activePulses>=1,'P2 pulse wave can be forced live',d);

  step=await destroyLayer();check(step?.count===3&&step.after===3,'P2 destruction enters P3',step);await sleep(180);
  await evalJs(`stackfallLastConstellationCombatDebug.clear();stackfallLastConstellationCombatDebug.forceComets();stackfallLastConstellationCombatDebug.forcePulse();`);await sleep(80);d=await diag();
  check(exactVolley(d,2,3),'P3 fires exactly two homing comets from each of three active nodes',d?.lastCometVolley);
  check(d.connectionMode==='permanent'&&d.pulseGapCount===4&&d.pulseWaveCount===2&&d.pulseSpeed<=150,'P3 keeps permanent links and four-gap slow pulse waves',d);
  await capture('p3-permanent-links-pulse');

  step=await destroyLayer();check(step?.count===3&&step.after===4,'P3 destruction awakens core',step);await sleep(260);
  await evalJs(`stackfallLastConstellationCombatDebug.clear();stackfallLastConstellationCombatDebug.forceComets();stackfallLastConstellationCombatDebug.forceBeam();stackfallLastConstellationCombatDebug.forcePulse();stackfallLastConstellationCombatDebug.forceRicochet();`);await sleep(70);d=await diag();
  check(exactVolley(d,5,1),'P4 core fires exactly five enhanced homing comets',d?.lastCometVolley);
  check(d.activeBeams===1&&d.beamWidth>=30&&d.p4TrackingBeamRicochet===false,'P4 tracking beam remains a distinct non-ricochet attack',d);
  check(d.p4RicochetStage==='warn'&&d.p4RicochetBounceCount>=3&&d.p4RicochetPathFixed===true,'P4 ricochet is a separate fixed telegraphed one-shot path',d);
  check(d.pulseGapCount===4&&d.pulseWaveCount===3&&d.pulseSpeed>0&&d.pulseSpeed<=150,'P4 pulse waves retain four gaps and remain deliberately slow',d);
  await capture('p4-separated-beams-pulse');

  pd=await prodDiag();check(pd?.healthSynchronized===true&&Math.abs(pd.ownerHp-pd.nodeHpSum)<.001,'health remains synchronized after phase transitions',pd);
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error?.stack||error);throw error;
}finally{writeFileSync(join(out,'lastconstellation-combat-observations.json'),JSON.stringify(report,null,2));try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(80);try{server.close();}catch{}try{rmSync(profile,{recursive:true,force:true});}catch{}}
