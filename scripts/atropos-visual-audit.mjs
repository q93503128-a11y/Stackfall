import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'test-results','atropos-visual');mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-apex-restore-'));
const port=8000,debugPort=9224;
const chromeCandidates=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean);
const chromePath=chromeCandidates.find(existsSync);if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||rel==='')rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,''),path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const {readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1280,720','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=15000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-2000)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.events=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);return;}for(const fn of this.events.get(m.method)||[])fn(m.params);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}on(name,fn){const a=this.events.get(name)||[];a.push(fn);this.events.set(name,a);}close(){this.ws?.close();}}
let cdp;const observations={startedAt:new Date().toISOString(),frames:[],console:[],exceptions:[]};
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=15000,interval=80){const st=Date.now();while(Date.now()-st<timeout){try{const v=await evalJs(expression);if(v)return v;}catch{}await sleep(interval);}throw new Error(`waitFor timeout: ${expression}`);}
async function capture(name,meta={}){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:78,captureBeyondViewport:false,fromSurface:true});const file=`${String(observations.frames.length+1).padStart(2,'0')}-${name}.jpg`;writeFileSync(join(out,file),Buffer.from(r.data,'base64'));observations.frames.push({file,...meta});}

async function drawGallery(phase,label){
  const meta=await evalJs(`(()=>{
    for(const el of document.querySelectorAll('#menu,#hud,#choiceScreen,#resonanceBanner,#bossNotice,#pauseScreen,#gameOverScreen,#settingsScreen,#touchControls,#galaxyMapScreen,#profileScreen,#upgradeScreen,#sortiePrepScreen'))el.style.display='none';
    const W=innerWidth,H=innerHeight;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#07101d');bg.addColorStop(1,'#010207');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(128,170,220,.08)';ctx.lineWidth=1;for(let x=80;x<W;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=80;y<H;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    const forms=['chronophage','starforge','lastconstellation'],xs=[W*.18,W*.50,W*.82],base=54;
    const radii=[];
    for(let i=0;i<forms.length;i++){
      const form=forms[i],e={eliteForm:form,apexForm:form,kind:'apex',r:base*BOSS_STATS[form].r,phase:14.2,color:BOSS_STATS[form].color,hit:false,apexPhase:${phase}};
      radii.push(e.r);ctx.save();ctx.translate(xs[i],H*.51);drawEliteShape(e);ctx.restore();
      ctx.fillStyle='#eef4ff';ctx.font='700 17px sans-serif';ctx.textAlign='center';ctx.fillText(form.toUpperCase(),xs[i],70);
    }
    ctx.fillStyle='#93a8c9';ctx.font='13px monospace';ctx.fillText('pre-9af0cdec visual restore · ${label}',W*.5,H-24);
    return{restore:window.stackfallApexVisualRestore,prototype:window.stackfallAtroposPrototypeAttackState||null,radii};
  })()`);
  await capture(`restored-${label}`,meta);
  return meta;
}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  cdp.on('Runtime.consoleAPICalled',e=>observations.console.push({type:e.type,text:(e.args||[]).map(a=>String(a.value??a.description??'')).join(' ')}));
  cdp.on('Runtime.exceptionThrown',e=>observations.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);
  await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1`});
  await waitFor(`window.stackfallApexVisualRestore==='pre-9af0cdec-2026-07-20'&&typeof drawEliteShape==='function'&&typeof BOSS_STATS==='object'`);
  observations.galleryP1=await drawGallery(1,'phase-1');
  observations.galleryP2=await drawGallery(2,'enraged');
  if(observations.galleryP1.prototype)throw new Error(`abandoned Atropos prototype still active: ${observations.galleryP1.prototype}`);

  await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1&integration=1`});
  await waitFor(`window.stackfallApexVisualRestore==='pre-9af0cdec-2026-07-20'&&typeof stackfallDeveloperTest==='object'`);
  const setup=await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=['chronophage'];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex='starforge';state.pendingApexForm=null;state.apexActiveId=null;state.apexExitPending=false;return{ok:beginApexEncounter(),restore:window.stackfallApexVisualRestore,prototype:window.stackfallAtroposPrototypeAttackState||null};})()`);
  observations.setup=setup;if(!setup.ok)throw new Error(`Apex start failed ${JSON.stringify(setup)}`);if(setup.prototype)throw new Error(`prototype runtime active during integration: ${setup.prototype}`);
  await waitFor(`state.entities.enemies.some(e=>!e?.dead&&e.apexForm==='chronophage')`,15000);await sleep(1100);
  observations.integration=await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x?.dead&&x.apexForm==='chronophage');return e?{name:e.name,form:e.apexForm,phase:e.apexPhase,x:e.x,y:e.y,r:e.r,hasPrototypeBody:!!e.atroposReborn?.worldDevourer,restore:window.stackfallApexVisualRestore}:null;})()`);
  if(!observations.integration)throw new Error('Chronophage integration boss missing');
  if(observations.integration.hasPrototypeBody)throw new Error('abandoned World Devourer body state was created');
  await capture('chronophage-live-integration',{boss:observations.integration});

  if(observations.exceptions.length)throw new Error(`runtime exceptions: ${JSON.stringify(observations.exceptions)}`);
  observations.status='PASS';
}catch(err){observations.status='FAIL';observations.error=String(err?.stack||err);throw err;
}finally{writeFileSync(join(out,'observations.json'),JSON.stringify(observations,null,2));try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(120);try{server.close();}catch{}try{rmSync(profile,{recursive:true,force:true});}catch{}}
