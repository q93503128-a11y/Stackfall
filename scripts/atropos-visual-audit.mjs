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
let cdp;const observations={startedAt:new Date().toISOString(),frames:[],console:[],exceptions:[],checks:[]};
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=18000,interval=80){const st=Date.now();while(Date.now()-st<timeout){try{const v=await evalJs(expression);if(v)return v;}catch{}await sleep(interval);}throw new Error(`waitFor timeout: ${expression}`);}
async function capture(name,meta={}){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:84,captureBeyondViewport:false,fromSurface:true});const file=`${String(observations.frames.length+1).padStart(2,'0')}-${name}.jpg`;writeFileSync(join(out,file),Buffer.from(r.data,'base64'));observations.frames.push({file,...meta});}
function requireCheck(ok,label,details){observations.checks.push({label,ok:!!ok,details});if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);}

async function launchApex(form){
  await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1&restore=${form}&t=${Date.now()}`});
  await waitFor(`window.stackfallApexVisualRestore==='pre-9af0cdec-2026-07-20'&&typeof stackfallDeveloperTest==='object'&&typeof beginApexEncounter==='function'`);
  const setup=await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=[${JSON.stringify(form)}];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex=${JSON.stringify(form==='chronophage'?'starforge':'chronophage')};state.pendingApexForm=null;state.apexActiveId=null;state.apexExitPending=false;return{ok:beginApexEncounter(),restore:window.stackfallApexVisualRestore,prototype:window.stackfallAtroposPrototypeAttackState||null};})()`);
  if(!setup.ok)throw new Error(`${form} Apex start failed ${JSON.stringify(setup)}`);
  if(setup.prototype)throw new Error(`abandoned prototype runtime active: ${setup.prototype}`);
  await waitFor(`state.entities.enemies.some(e=>!e?.dead&&e.apexForm===${JSON.stringify(form)})`,18000);
  await waitFor(`!ui.bossNotice||ui.bossNotice.classList.contains('hidden')`,18000);
  if(form==='chronophage')await waitFor(`window.stackfallApexVisualRestoreDiagnostics?.().render?.count>0`,18000);
  await sleep(700);
  const meta=await evalJs(`(()=>{
    const form=${JSON.stringify(form)},e=state.entities.enemies.find(x=>!x?.dead&&x.apexForm===form);if(!e)return null;
    const px=player.x,py=player.y,dx=e.x-px,dy=e.y-py,distance=Math.hypot(dx,dy),screenX=dx+vw/2,screenY=dy+vh/2;
    const extent={chronophage:1.82,starforge:2.12,lastconstellation:3.35}[form]||2,visualRadius=e.r*extent;
    const bbox={left:screenX-visualRadius,top:screenY-visualRadius,right:screenX+visualRadius,bottom:screenY+visualRadius};
    const visible={left:Math.max(0,bbox.left),top:Math.max(0,bbox.top),right:Math.min(vw,bbox.right),bottom:Math.min(vh,bbox.bottom)};visible.width=Math.max(0,visible.right-visible.left);visible.height=Math.max(0,visible.bottom-visible.top);visible.area=visible.width*visible.height;
    let pixelProbe=null;try{const sx=canvas.width/vw,sy=canvas.height/vh,x0=Math.max(0,Math.floor(visible.left*sx)),y0=Math.max(0,Math.floor(visible.top*sy)),x1=Math.min(canvas.width,Math.ceil(visible.right*sx)),y1=Math.min(canvas.height,Math.ceil(visible.bottom*sy)),w=Math.max(1,x1-x0),h=Math.max(1,y1-y0),data=ctx.getImageData(x0,y0,w,h).data;let samples=0,highlights=0,colorful=0;for(let i=0;i<data.length;i+=16){const r=data[i],g=data[i+1],b=data[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);samples++;if(mx>=150)highlights++;if(mx>=95&&mx-mn>=30)colorful++;}pixelProbe={x0,y0,w,h,samples,highlights,colorful,highlightRatio:samples?highlights/samples:0,colorfulRatio:samples?colorful/samples:0};}catch(error){pixelProbe={error:String(error)};}
    const restoreDiag=typeof window.stackfallApexVisualRestoreDiagnostics==='function'?window.stackfallApexVisualRestoreDiagnostics():null;
    const reborn=typeof window.stackfallAtroposRebornDiagnostics==='function'?window.stackfallAtroposRebornDiagnostics():null;
    const realm=state.realmTransition?{owner:state.realmTransition.owner||null,from:state.realmTransition.from||null,to:state.realmTransition.to||null,elapsed:Number(state.realmTransition.elapsed)||0,duration:Number(state.realmTransition.duration)||0,serial:state.realmTransition.serial??null}:null;
    return{name:e.name,form,eliteForm:e.eliteForm||null,apexForm:e.apexForm||null,variant:e.variant||null,phase:e.apexPhase||null,x:e.x,y:e.y,r:e.r,hp:e.hp,maxHp:e.maxHp,player:{x:px,y:py},dx,dy,distance,screenX,screenY,viewport:{w:vw,h:vh},visualRadius,bbox,visible,pixelProbe,apexActiveId:state.apexActiveId||null,pendingApexForm:state.pendingApexForm||null,apexExitPending:!!state.apexExitPending,realmTransition:realm,restoreDiagnostics:restoreDiag,rebornDiagnostics:reborn,prototypeBody:!!e.atroposReborn?.worldDevourer,restore:window.stackfallApexVisualRestore};
  })()`);
  if(!meta)throw new Error(`${form} missing after entry`);
  if(meta.prototypeBody)throw new Error(`${form} has abandoned World Devourer body state`);

  const maxViewport=Math.max(meta.viewport.w,meta.viewport.h);
  requireCheck(Number.isFinite(meta.x)&&Number.isFinite(meta.y),`${form}: finite world position`,{x:meta.x,y:meta.y});
  requireCheck(meta.distance<maxViewport*1.5,`${form}: boss remains near player`,{distance:meta.distance,maxAllowed:maxViewport*1.5,dx:meta.dx,dy:meta.dy});
  requireCheck(meta.screenX>-meta.viewport.w*.25&&meta.screenX<meta.viewport.w*1.25&&meta.screenY>-meta.viewport.h*.25&&meta.screenY<meta.viewport.h*1.25,`${form}: center is not far outside viewport`,{screenX:meta.screenX,screenY:meta.screenY,viewport:meta.viewport});
  requireCheck(meta.visible.area>=Math.max(2400,meta.r*meta.r*.35),`${form}: visual bbox intersects viewport`,{visible:meta.visible,r:meta.r,visualRadius:meta.visualRadius});
  requireCheck(meta.pixelProbe&&!meta.pixelProbe.error&&meta.pixelProbe.samples>0,`${form}: pixel probe available`,meta.pixelProbe);
  requireCheck((meta.pixelProbe.highlightRatio||0)>=.001||(meta.pixelProbe.colorfulRatio||0)>=.002,`${form}: viewport occupancy contains visible boss pixels`,meta.pixelProbe);

  if(form==='chronophage'){
    const diag=meta.restoreDiagnostics,indicator=diag?.indicatorTarget,render=diag?.render;
    requireCheck(render?.count>0,`chronophage: restored body reached drawEliteShape`,render);
    requireCheck(render&&Math.abs(render.worldX-meta.x)<.01&&Math.abs(render.worldY-meta.y)<.01,`chronophage: renderer received live world coordinates`,{render,entity:{x:meta.x,y:meta.y}});
    requireCheck(indicator&&Math.abs(indicator.x-meta.x)<.01&&Math.abs(indicator.y-meta.y)<.01,`chronophage: guidance target uses live boss coordinate`,{indicator,entity:{x:meta.x,y:meta.y}});
    requireCheck((indicator?.distance??Infinity)<maxViewport*1.5,`chronophage: guidance target is not sentinel distance`,indicator);
  }

  await capture(`${form}-live`,meta);
  return meta;
}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  cdp.on('Runtime.consoleAPICalled',e=>observations.console.push({type:e.type,text:(e.args||[]).map(a=>String(a.value??a.description??'')).join(' ')}));
  cdp.on('Runtime.exceptionThrown',e=>observations.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);
  observations.chronophage=await launchApex('chronophage');
  observations.starforge=await launchApex('starforge');
  observations.lastconstellation=await launchApex('lastconstellation');
  if(observations.exceptions.length)throw new Error(`runtime exceptions: ${JSON.stringify(observations.exceptions)}`);
  observations.comparison={
    playerBossDistances:{chronophage:observations.chronophage.distance,starforge:observations.starforge.distance,lastconstellation:observations.lastconstellation.distance},
    screenCenters:{chronophage:[observations.chronophage.screenX,observations.chronophage.screenY],starforge:[observations.starforge.screenX,observations.starforge.screenY],lastconstellation:[observations.lastconstellation.screenX,observations.lastconstellation.screenY]},
    radii:{chronophage:observations.chronophage.r,starforge:observations.starforge.r,lastconstellation:observations.lastconstellation.r}
  };
  observations.status='PASS';
}catch(err){observations.status='FAIL';observations.error=String(err?.stack||err);throw err;
}finally{writeFileSync(join(out,'observations.json'),JSON.stringify(observations,null,2));try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(120);try{server.close();}catch{}try{rmSync(profile,{recursive:true,force:true});}catch{}}
