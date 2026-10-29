import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'test-results','atropos-visual');mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-atropos-phases-'));
const port=8012,debugPort=9236;
const chromeCandidates=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean);
const chromePath=chromeCandidates.find(existsSync);if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||rel==='')rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,''),path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const {readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1280,720','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=15000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1800)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.events=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);return;}for(const fn of this.events.get(m.method)||[])fn(m.params);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}on(name,fn){const a=this.events.get(name)||[];a.push(fn);this.events.set(name,a);}close(){this.ws?.close();}}
let cdp;const report={startedAt:new Date().toISOString(),checks:[],frames:[],exceptions:[],console:[],phases:{}};
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=15000,interval=70){const st=Date.now();while(Date.now()-st<timeout){try{const v=await evalJs(expression);if(v)return v;}catch{}await sleep(interval);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){report.checks.push({ok:!!ok,label,details});if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);}
async function capture(name,meta={}){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:86,captureBeyondViewport:false,fromSurface:true});const file=`atropos-${name}.jpg`;writeFileSync(join(out,file),Buffer.from(r.data,'base64'));report.frames.push({file,...meta});}
async function diag(){return evalJs(`window.stackfallAtroposPhaseDiagnostics?.()`);}
async function phaseSnapshot(phase,label){const d=await diag();const combat=await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='chronophage');return e?{hp:e.hp,maxHp:e.maxHp,phase:e.apexPhase,bodyParts:Array.isArray(e.bodyParts)?e.bodyParts.length:0,telegraphs:state.entities.telegraphs.filter(t=>t?.impactStyle==='temporal-shear').map(t=>({life:t.life,max:t.max,width:t.width,damage:t.damage})),x:e.x,y:e.y}:null;})()`);report.phases[phase]??={};report.phases[phase][label]={diagnostics:d,combat};return{d,combat};}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&atroposPhaseAudit=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  cdp.on('Runtime.exceptionThrown',e=>report.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));
  cdp.on('Runtime.consoleAPICalled',e=>report.console.push({type:e.type,text:(e.args||[]).map(a=>String(a.value??a.description??'')).join(' ')}));
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);
  await waitFor(`window.stackfallAtroposPhaseProduction==='v1'&&window.stackfallApexIdentityCombat==='v1'&&window.stackfallApexVisualRestore==='pre-9af0cdec-2026-07-20'&&typeof stackfallDeveloperTest==='object'&&typeof beginApexEncounter==='function'`,18000);
  const started=await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=['chronophage'];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex='starforge';state.pendingApexForm=null;state.apexActiveId=null;state.apexExitPending=false;return beginApexEncounter();})()`);
  check(started,'Chronophage encounter started',started);
  await waitFor(`state.entities.enemies.some(e=>!e.dead&&e.apexForm==='chronophage')`,18000);
  await waitFor(`!ui.bossNotice||ui.bossNotice.classList.contains('hidden')`,18000);
  await waitFor(`window.stackfallAtroposPhaseDiagnostics?.()?.visualPhase===1`,8000);
  let snap=await phaseSnapshot(1,'settled');
  check(snap.d?.phase===1&&snap.d?.visualPhase===1,'P1 visual/combat phase aligned',snap.d);
  check(snap.combat?.bodyParts===0,'P1 visible body remains direct weapon target',snap.combat);
  check(Array.isArray(snap.d?.availablePatterns)&&snap.d.availablePatterns.length===0,'P1 has no added history pattern',snap.d?.availablePatterns);
  await capture('p1-settled',{phase:1});

  const expectations={2:['temporal-echo'],3:['temporal-echo','split-timeline'],4:['temporal-echo','split-timeline','causality-reversal']};
  const showcase={2:'temporal-echo',3:'split-timeline',4:'causality-reversal'};
  for(const phase of[2,3,4]){
    const set=await evalJs(`stackfallDeveloperTest.atroposSetPhase(${phase})`);check(set,`P${phase} HP threshold forced`,set);
    await waitFor(`window.stackfallAtroposPhaseDiagnostics?.()?.phase===${phase}`,7000);
    await waitFor(`window.stackfallAtroposPhaseDiagnostics?.()?.transition?.phase===${phase}`,9000);
    await waitFor(`(()=>{const d=window.stackfallAtroposPhaseDiagnostics?.();return d?.transition?.phase===${phase}&&d.transition.age/d.transition.duration>.36&&d.transition.age/d.transition.duration<.82;})()`,5000);
    await phaseSnapshot(phase,'transition');await capture(`p${phase}-transition`,{phase,transition:true});
    await waitFor(`(()=>{const d=window.stackfallAtroposPhaseDiagnostics?.();return d?.phase===${phase}&&d.visualPhase===${phase}&&!d.pending&&!d.transition;})()`,9000);
    snap=await phaseSnapshot(phase,'settled');
    check(JSON.stringify(snap.d?.availablePatterns)===JSON.stringify(expectations[phase]),`P${phase} exposes intended pattern grammar`,snap.d?.availablePatterns);
    check(snap.combat?.bodyParts===0,`P${phase} direct body targeting preserved`,snap.combat);
    await capture(`p${phase}-settled`,{phase});
    const fired=await evalJs(`stackfallDeveloperTest.atroposFirePattern(${JSON.stringify(showcase[phase])})`);check(fired,`P${phase} showcase pattern fired`,showcase[phase]);
    await sleep(phase===4?330:90);
    const active=await phaseSnapshot(phase,'pattern');
    check(active.d?.lastPattern===showcase[phase],`P${phase} lastPattern records showcase`,active.d);
    check((active.combat?.telegraphs?.length||0)>0,`P${phase} showcase produced temporal-shear warnings`,active.combat?.telegraphs);
    if(phase===4){
      const maxima=[...new Set(active.combat.telegraphs.map(t=>Math.round((t.max||0)*100)/100))];
      check(maxima.length>=3,'P4 reversal has staggered warning lifetimes',maxima);
    }
    await capture(`p${phase}-${showcase[phase]}`,{phase,pattern:showcase[phase]});
    await sleep(1250);
  }
  check(report.exceptions.length===0,'No runtime exceptions during P1-P4 audit',report.exceptions);
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error?.stack||error);throw error;
}finally{writeFileSync(join(out,'atropos-phase-production.json'),JSON.stringify(report,null,2));try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(120);try{server.close();}catch{}try{rmSync(profile,{recursive:true,force:true});}catch{}}
