import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-lc-route-debug-'));
const port=8011,debugPort=9235;
const chromePath=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||!rel)rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,'');const path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end();return;}const {readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1440,900','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1200)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}close(){this.ws?.close();}}
let cdp;
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const v=await evalJs(expression);if(v)return v;}catch{}await sleep(70);}throw new Error(`waitFor timeout: ${expression}`);}
try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&lcroute=${Date.now()}`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1&lcroute=${Date.now()}`});
  await waitFor(`window.stackfallLastConstellationCombat==='v2'&&window.stackfallLastConstellationHitRouting==='v1'&&typeof stackfallDeveloperTest==='object'&&typeof beginApexEncounter==='function'`);
  await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=['lastconstellation'];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex='chronophage';return beginApexEncounter();})()`);
  await waitFor(`state.entities.enemies.some(e=>!e.dead&&e.apexForm==='lastconstellation')`);await waitFor(`!state.realmTransition&&state.mode==='playing'`);await sleep(300);
  const result=await evalJs(`(()=>{
    const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation'),part=(e?.bodyParts||[]).find(p=>p.lcNodeProxy&&p.active);if(!e||!part)return{ok:false};
    const snapshot=label=>{const dx=Object.getOwnPropertyDescriptor(e,'x'),dy=Object.getOwnPropertyDescriptor(e,'y');return{label,eX:e.x,eY:e.y,partX:part.x,partY:part.y,dealName:dealDamage.name,overlapName:enemyCircleOverlap.name,spawnName:spawnPlayerProjectile.name,xAccessor:!!dx?.get,yAccessor:!!dy?.get,route:window.stackfallLastConstellationHitRoutingDiagnostics?.()};};
    const before=snapshot('before');const overlap=enemyCircleOverlap(e,part.x,part.y,1),afterOverlap=snapshot('afterOverlap');if(overlap)dealDamage(e,1,{source:'blade',canCrit:false});const afterDamage=snapshot('afterDamage');
    const requested={x:e.x,y:e.y,vx:455,vy:0,r:7,life:.28,maxRange:155,damage:1,color:'#fff',pierce:0,source:'wave'};const wave=spawnPlayerProjectile(requested),afterWave=snapshot('afterWave');wave.life=0;
    return{ok:true,overlap,before,afterOverlap,afterDamage,requestedX:requested.x,requestedY:requested.y,waveX:wave.x,waveY:wave.y,afterWave};
  })()`);
  console.log('LC_ROUTING_DEBUG '+JSON.stringify(result));
}finally{try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(80);try{server.close();}catch{}try{rmSync(profile,{recursive:true,force:true});}catch{}}
