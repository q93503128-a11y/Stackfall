import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'test-results','atropos-visual');
mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-atropos-'));
const port=8000,debugPort=9224;
const chromeCandidates=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean);
const chromePath=chromeCandidates.find(existsSync);
if(!chromePath)throw new Error(`Chrome not found: ${chromeCandidates.join(', ')}`);

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
  try{
    const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);
    let rel=decodeURIComponent(u.pathname);if(rel==='/'||rel==='')rel='/index.html';
    const safe=normalize(rel).replace(/^([/\\])+/,''),path=resolve(root,safe);
    if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}
    const {readFile}=await import('node:fs/promises');const body=await readFile(path);
    res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
  }catch{res.writeHead(404);res.end('not found');}
});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});

const browser=spawn(chromePath,[
  '--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,
  '--window-size=1280,720','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check',
  '--no-sandbox','--disable-dev-shm-usage','about:blank'
],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));

async function waitEndpoint(path,timeout=15000){const started=Date.now();while(Date.now()-started<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout: ${path}\n${chromeLog.slice(-4000)}`);}
class Cdp{
  constructor(url){this.id=0;this.pending=new Map();this.events=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);return;}for(const fn of this.events.get(m.method)||[])fn(m.params);});});}
  async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}
  on(name,fn){const a=this.events.get(name)||[];a.push(fn);this.events.set(name,a);}
  close(){this.ws?.close();}
}

let cdp=null,target=null;
const observations={startedAt:new Date().toISOString(),frames:[],console:[],exceptions:[]};
async function evaluate(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=12000,interval=80){const started=Date.now();let v;while(Date.now()-started<timeout){try{v=await evaluate(expression);if(v)return v;}catch{}await sleep(interval);}throw new Error(`waitFor timeout: ${expression}`);}
async function capture(name,meta={}){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:60,captureBeyondViewport:false,fromSurface:true});const file=`${String(observations.frames.length+1).padStart(2,'0')}-${name}.jpg`;writeFileSync(join(out,file),Buffer.from(r.data,'base64'));observations.frames.push({file,...meta});return file;}
async function captureWhen(name,expr,metaFn=null,timeout=12000){const value=await waitFor(expr,timeout);const meta=typeof metaFn==='function'?await metaFn(value):{probe:value};await capture(name,meta);return value;}
async function boss(){return evaluate(`(()=>{const e=state.entities.enemies.find(x=>!x?.dead&&x.apexForm==='chronophage');if(!e)return null;const s=e.atroposReborn?.worldDevourer;return{id:e.id,hp:e.hp,maxHp:e.maxHp,phase:e.apexPhase,serpent:!!s,parts:e.bodyParts?.length||0,active:window.stackfallAtroposDirectorDiagnostics?.(),entry:window.stackfallAtroposEntryDiagnostics?.(),art:window.stackfallAtroposArtDiagnostics?.()};})()`);}
async function neutralize(){return evaluate(`(()=>{const e=state.entities.enemies.find(x=>!x?.dead&&x.apexForm==='chronophage'),s=e?.atroposReborn?.worldDevourer;if(!s)return false;for(const k of ['crossingPrototype','tailSeverPrototype','mawPrototype','ringPrototype','pastPrototype','worldDevourPrototype'])s[k]=null;s.prototypeAttackCd=9999;s.entryGrace=0;state.spawnTimer=state.encounterTimer=99999;player.invuln=99999;player.moveVX=player.moveVY=0;state.weaponSlots=[];for(const key of ['projectiles','guidedMissiles','curves','telegraphs','beams','shockwaves'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;return true;})()`);}
async function setPhase(fraction){return evaluate(`(()=>{const e=state.entities.enemies.find(x=>!x?.dead&&x.apexForm==='chronophage');if(!e)return null;e.hp=e.maxHp*${fraction};const s=e.atroposReborn?.worldDevourer;if(s){s.prototypeAttackCd=9999;s.entryGrace=0;}return{hp:e.hp,maxHp:e.maxHp,fraction:e.hp/e.maxHp};})()`);}
async function runAttack({name,phase,trigger,diag,stages,active='d?.active',stageValue='d?.stage',ageValue='d?.age'}){
  await neutralize();await setPhase(phase);await sleep(220);
  const started=await evaluate(`${trigger}()`);if(!started)throw new Error(`${name} trigger failed`);
  for(const item of stages){const [stage,label,delay=0,minAge=null]=item;const ageGate=minAge==null?'true':`(${ageValue})>=${Number(minAge)}`;await captureWhen(`${name}-${label}`,`(()=>{const d=${diag}();return (${active})&&(${stageValue})===${JSON.stringify(stage)}&&(${ageGate})?d:null;})()`,async d=>({attack:name,stage,diag:d,boss:await boss()}),12000);if(delay)await sleep(delay);}
  await waitFor(`(()=>{const d=${diag}();return !(${active});})()`,16000);await neutralize();await sleep(260);await capture(`${name}-recovery`,{attack:name,stage:'recovery',boss:await boss()});
}

try{
  target=await waitEndpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  cdp.on('Runtime.consoleAPICalled',e=>observations.console.push({type:e.type,text:(e.args||[]).map(a=>String(a.value??a.description??'')).join(' ')}));
  cdp.on('Runtime.exceptionThrown',e=>observations.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);
  const loaded=new Promise(ok=>cdp.on('Page.loadEventFired',ok));await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1`});await Promise.race([loaded,sleep(12000)]);
  await waitFor(`typeof stackfallDeveloperTest==='object'&&typeof beginApexEncounter==='function'`,15000);
  await waitFor(`window.stackfallAtroposPrototypeAttackState==='directed-six-pattern-cycle-v1'`,15000);
  await waitFor(`(()=>{const a=window.stackfallAtroposArtDiagnostics?.().assets;return !!(a?.head&&a?.body&&a?.tail);})()`,15000);
  const setup=await evaluate(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);window.stackfallSetGameSpeed?.(1,{silent:true});GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');if(ui.choiceCards)ui.choiceCards.innerHTML='';ui.pauseScreen?.classList.add('hidden');document.querySelector('#awakeningScreen')?.classList.add('hidden');document.querySelector('#bossRewardScreen')?.classList.add('hidden');document.querySelector('#apexRewardScreen')?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;player.invuln=99999;const mobs=[];for(let i=0;i<10;i++){const e=spawnEnemy('normal');if(e){const a=i/10*TAU,d=190+(i%3)*75;e.x=player.x+Math.cos(a)*d;e.y=player.y+Math.sin(a)*d;e.speed=0;e.damage=0;mobs.push(e.id);}}return{dev:api.enabled,mobs,liveMobs:state.entities.enemies.filter(e=>!e.dead&&e.kind!=='apex').length,mode:state.mode,attackState:window.stackfallAtroposPrototypeAttackState};})()`);
  observations.setup=setup;if(setup.liveMobs<8)throw new Error(`entry fixture missing mobs: ${JSON.stringify(setup)}`);await capture('pre-entry',{setup});
  const invoked=await evaluate(`(()=>{state.bossBags=state.bossBags||{};state.bossBags.apex=['chronophage'];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex='starforge';state.pendingApexForm=null;state.apexActiveId=null;state.apexExitPending=false;return{ok:beginApexEncounter(),mobsBefore:state.entities.enemies.filter(e=>!e.dead&&e.kind!=='apex').length};})()`);observations.spawn=invoked;if(!invoked?.ok)throw new Error(`direct Apex entrance failed: ${JSON.stringify(invoked)}`);
  const entryFreeze=await captureWhen('entry-freeze',`(()=>{const d=window.stackfallAtroposEntryDiagnostics?.();return d?.active&&d.progress>=.12?d:null;})()`,async d=>({entry:d,boss:await boss()}));if(entryFreeze.mobs<8)throw new Error(`entry did not capture existing mobs: ${JSON.stringify(entryFreeze)}`);
  await captureWhen('entry-head-first',`(()=>{const d=window.stackfallAtroposEntryDiagnostics?.(),a=window.stackfallAtroposArtDiagnostics?.();return d?.active&&d.progress>=.53&&a?.segments?.length?a:null;})()`,async a=>({art:a,entry:await evaluate('stackfallAtroposEntryDiagnostics()')}));
  await captureWhen('entry-swallow-mid',`(()=>{const d=window.stackfallAtroposEntryDiagnostics?.();return d?.active&&d.progress>=.66?d:null;})()`,async d=>({entry:d,boss:await boss()}));
  const late=await captureWhen('entry-wrap-late',`(()=>{const d=window.stackfallAtroposEntryDiagnostics?.();return d?.active&&d.progress>=.78?d:null;})()`,async d=>({entry:d,boss:await boss()}));if(late.consumed<1)throw new Error(`mobs were not visibly consumed by late entry: ${JSON.stringify(late)}`);
  await captureWhen('entry-colour-return',`(()=>{const d=window.stackfallAtroposEntryDiagnostics?.();return d?.active&&d.progress>=.88?d:null;})()`,async d=>({entry:d,boss:await boss()}));
  await waitFor(`!window.stackfallAtroposEntryDiagnostics?.().active&&state.apexActiveId`,12000);await neutralize();await sleep(900);await capture('combat-idle',{boss:await boss()});

  await runAttack({name:'crossing',phase:.90,trigger:'stackfallTriggerAtroposGiantCrossing',diag:'stackfallAtroposCombatDiagnostics',active:'d?.crossing',stageValue:'d?.crossing?.stage',ageValue:'d?.crossing?.age',stages:[['warn','warn-mid',0,1.05],['cross','cross-early',0,1.90],['cross','cross-mid',0,2.82],['cross','cross-late',0,3.55]]});
  await runAttack({name:'tail',phase:.90,trigger:'stackfallTriggerAtroposTailSever',diag:'stackfallAtroposCombatDiagnostics',active:'d?.tail',stageValue:'d?.tail?.stage',ageValue:'d?.tail?.age',stages:[['wind','wind-mid',0,.45],['sweep','sweep-mid',0,1.18],['scar-warn','scar-warn',0,1.80],['rupture','rupture',0,2.16]]});
  await runAttack({name:'maw',phase:.65,trigger:'stackfallTriggerAtroposVoidMaw',diag:'stackfallAtroposMawDiagnostics',stages:[['warn','warn'],['suction','suction'],['bite','bite']]});
  await runAttack({name:'ring',phase:.65,trigger:'stackfallTriggerAtroposDevourerRing',diag:'stackfallAtroposRingDiagnostics',stages:[['warn','warn'],['wrap','wrap'],['hold','hold']]});
  await runAttack({name:'past',phase:.40,trigger:'stackfallTriggerAtroposPastTrajectory',diag:'stackfallAtroposPastDiagnostics',stages:[['warn','warn-mid',0,.42],['present','present-mid',0,1.72],['memory','memory',0,3.50],['rewarn','rewarn',0,4.28],['replay','replay-early',0,4.78],['replay','replay-mid',0,5.32],['replay','replay-late',0,5.76]]});
  await runAttack({name:'world',phase:.15,trigger:'stackfallTriggerAtroposWorldDevour',diag:'stackfallAtroposWorldDevourDiagnostics',stages:[['withdraw','withdraw-mid',0,.42],['warn','warn-mid',0,1.95],['bite','bite-enter',0,3.18],['bite','bite-snap',0,3.54],['scar','scar-mid',0,4.30],['recover','recover-mid',0,5.35]]});

  observations.finalBoss=await boss();observations.damage=await evaluate('stackfallAtroposDamageDiagnostics?.()');observations.director=await evaluate('stackfallAtroposDirectorDiagnostics?.()');observations.endedAt=new Date().toISOString();
  if(observations.exceptions.length)throw new Error(`runtime exceptions: ${observations.exceptions.join(' | ')}`);
  writeFileSync(join(out,'manifest.json'),JSON.stringify(observations,null,2));
  console.log(`ATROPOS_VISUAL_AUDIT_OK frames=${observations.frames.length}`);
}catch(error){observations.error=String(error?.stack||error);observations.endedAt=new Date().toISOString();writeFileSync(join(out,'manifest.json'),JSON.stringify(observations,null,2));console.error(error);process.exitCode=1;
}finally{
  try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(300);await new Promise(ok=>server.close(ok));try{rmSync(profile,{recursive:true,force:true});}catch{}
}
