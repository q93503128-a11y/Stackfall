import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-stage-shard-'));
const port=8025,debugPort=9249;
const chromePath=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||!rel)rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,'');const path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const{readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1280,800','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1500)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}close(){this.ws?.close();}}
let cdp;
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const value=await evalJs(expression);if(value)return value;}catch{}await sleep(80);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details){if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);console.log(`PASS ${label}`);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&stageShardAudit=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await waitFor(`document.readyState==='complete'&&window.stackfallRecordStageClear?.__stackfallCoreShardFirstClearFix===true&&window.stackfallStageById?.('stage-01')`);
  const result=await evalJs(`(()=>{const stage=window.stackfallStageById('stage-01'),declared=(stage.rewards||[]).filter(r=>r.type==='currency'&&r.key==='coreShard').reduce((s,r)=>s+(Number(r.amount)||0),0),before=window.stackfallCurrency('coreShard'),first=window.stackfallRecordStageClear('stage-01',300),afterFirst=window.stackfallCurrency('coreShard'),second=window.stackfallRecordStageClear('stage-01',295),afterSecond=window.stackfallCurrency('coreShard');return{declared,before,firstClear:first.firstClear,firstReported:first.currency?.coreShard||0,afterFirst,secondClear:second.firstClear,secondReported:second.currency?.coreShard||0,afterSecond};})()`);
  check(result.declared===1,'stage 1 declares one first-clear Core Shard',result);
  check(result.firstClear===true&&result.firstReported===1&&result.afterFirst===result.before+1,'first clear actually grants the declared Core Shard',result);
  check(result.secondClear===false&&result.secondReported===0&&result.afterSecond===result.afterFirst,'repeat clear does not duplicate first-clear Core Shards',result);
  console.log('STAGE_CORE_SHARD_BROWSER_AUDIT PASS');
}finally{
  try{cdp?.close();}catch{}
  try{browser.kill('SIGTERM');}catch{}
  await sleep(100);
  try{server.close();}catch{}
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
