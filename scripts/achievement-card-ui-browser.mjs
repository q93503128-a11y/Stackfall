import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-achievement-card-ui-'));
const port=8020,debugPort=9244;
const chromePath=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(existsSync);
if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||!rel)rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,'');const path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const{readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1680,1000','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1800)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}close(){this.ws?.close();}}
let cdp;
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=20000){const st=Date.now();while(Date.now()-st<timeout){try{const value=await evalJs(expression);if(value)return value;}catch{}await sleep(80);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);console.log(`PASS ${label}`);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&achievementCardUiAudit=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await waitFor(`document.readyState==='complete'&&document.querySelector('#achievementHubBtn')&&document.querySelector('style[data-stackfall-achievement-card-rollback="v2"]')`);await sleep(120);
  await evalJs(`document.querySelector('#achievementHubBtn').click()`);await waitFor(`!document.querySelector('#achievementScreen').classList.contains('hidden')&&document.querySelectorAll('#achievementScreen .achievement-row').length===40`);await sleep(80);
  const ui=await evalJs(`(()=>{const modal=document.querySelector('#achievementScreen .achievement-modal'),grid=document.querySelector('#achievementScreen .achievement-grid-single'),row=document.querySelector('#achievementScreen .achievement-row'),icon=document.querySelector('#achievementScreen .achievement-reward-icon'),before=getComputedStyle(row,'::before'),ms=getComputedStyle(modal),gs=getComputedStyle(grid),rs=getComputedStyle(row),is=getComputedStyle(icon);return{modalPadding:ms.paddingTop,modalRadius:ms.borderTopLeftRadius,gridDisplay:gs.display,gridColumns:gs.gridTemplateColumns,rowRadius:rs.borderTopLeftRadius,rowBorder:rs.borderTopWidth,rowBackground:rs.backgroundColor,rowMinHeight:rs.minHeight,iconSize:[is.width,is.height],beforeContent:before.content,beforeDisplay:before.display};})()`);
  check(ui.modalPadding==='24px'&&ui.modalRadius==='24px','achievement modal matches the pre-ledger padded card layout',ui);
  check(ui.gridDisplay==='grid'&&ui.gridColumns.split(' ').filter(Boolean).length===2,'desktop achievements render as the original two-column grid',ui);
  check(ui.rowRadius==='14px'&&ui.rowBorder==='1px'&&ui.rowBackground!=='rgba(0, 0, 0, 0)'&&ui.rowMinHeight==='88px','achievement entries are restored as bordered cards',ui);
  check(ui.iconSize[0]==='34px'&&ui.iconSize[1]==='34px','achievement card icon size matches the original presentation',ui);
  check(ui.beforeContent==='none'||ui.beforeDisplay==='none','mission-ledger vertical marker is removed',ui);
  console.log('ACHIEVEMENT_CARD_UI_BROWSER_AUDIT PASS');
}finally{
  try{cdp?.close();}catch{}
  try{browser.kill('SIGTERM');}catch{}
  await sleep(100);
  try{server.close();}catch{}
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
