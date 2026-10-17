import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=resolve(process.env.STACKFALL_VISUAL_REVIEW_DIR||'test-results/stage01-visual-review');
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'stackfall-stage01-review-'));
const chrome=process.env.STACKFALL_CHROME||'/usr/bin/google-chrome';
if(!existsSync(chrome))throw new Error(`Chrome not found: ${chrome}`);
const browser=spawn(chrome,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-size=1920,1080','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','about:blank'],{stdio:'ignore'});
let port=0;
for(let i=0;i<120;i++){const p=join(profile,'DevToolsActivePort');if(existsSync(p)){port=Number(readFileSync(p,'utf8').trim().split(/\r?\n/)[0]);if(port)break;}await sleep(100);}if(!port)throw new Error('CDP port timeout');
const endpoint=async(path,options={})=>{for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${port}${path}`,options);if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`endpoint timeout ${path}`);};
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={}){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{this.pending.set(id,{ok,fail});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.pending.delete(id))fail(new Error(`CDP timeout ${method}`));},20000);});}close(){this.ws?.close();}}
const target=await endpoint(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'});const cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
const evalv=async expression=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
const capture=async name=>{const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const path=join(out,`${name}.png`);writeFileSync(path,Buffer.from(r.data,'base64'));return path;};
const pageUrl='https://stackfall.pages.dev/?dev=1&stage01-review='+Date.now();await cdp.send('Page.navigate',{url:pageUrl});for(let i=0;i<100;i++){if(await evalv(`document.readyState==='complete'&&window.stackfallDeveloperTest?.enabled===true`))break;await sleep(150);}await sleep(2500);
await evalv(`GAME_SETTINGS.audio.master=false;window.stackfallDeveloperTest.setInvincible(true);window.stackfallDeveloperTest.setLevelUpsDisabled(true);true`);
const frames=[];
async function snapshot(label){const data=await evalv(`(()=>{const e=(state.entities.enemies||[]).find(x=>x&&!x.dead&&(x.kind==='stage-boss'||x.kind==='apex'));return{mode:state.mode,time:state.time,player:{x:player.x,y:player.y},enemy:e?{id:e.id,kind:e.kind,form:e.apexForm||e.eliteForm||e.eventKind,r:e.r,hp:e.hp,maxHp:e.maxHp,phase:e.stagePhase||e.apexPhase||1,x:e.x,y:e.y}:null,enemyProjectiles:(state.entities.enemyProjectiles||[]).length,telegraphs:(state.entities.telegraphs||[]).length,beams:(state.entities.beams||[]).length,shockwaves:(state.entities.shockwaves||[]).length,theme:state.realmTheme,stage:state.stageRun?.stage?.id||null};})()`);const path=await capture(label);frames.push({label,path,data});return data;}

await evalv(`window.stackfallDeveloperTest.startStage('stage-01');window.stackfallDeveloperTest.setInvincible(true);window.stackfallDeveloperTest.setLevelUpsDisabled(true);window.stackfallDeveloperTest.jumpStageBoss('stage-01')`);await sleep(6200);
await snapshot('stage01-p1-a');await sleep(650);await snapshot('stage01-p1-b');await sleep(650);await snapshot('stage01-p1-c');
await evalv(`(()=>{const e=(state.entities.enemies||[]).find(x=>x?.kind==='stage-boss');if(e)e.hp=e.maxHp*.58;return!!e;})()`);await sleep(900);await snapshot('stage01-p2-a');await sleep(700);await snapshot('stage01-p2-b');
await evalv(`(()=>{const e=(state.entities.enemies||[]).find(x=>x?.kind==='stage-boss');if(e)e.hp=e.maxHp*.24;return!!e;})()`);await sleep(1000);await snapshot('stage01-p3-a');await sleep(750);await snapshot('stage01-p3-b');

for(const form of ['chronophage','starforge','lastconstellation']){
  await evalv(`(()=>{window.stackfallDeveloperTest.startEndless();window.stackfallDeveloperTest.setInvincible(true);window.stackfallDeveloperTest.setLevelUpsDisabled(true);for(const a of Object.values(state.entities))if(Array.isArray(a))a.length=0;state.bossActiveId=null;state.apexActiveId=null;const e=window.stackfallSpawnEliteForm('apex','${form}');if(!e)return false;e.x=player.x+300;e.y=player.y;e.speed=0;e.damage=0;e.hp=e.maxHp=Math.max(1e9,e.maxHp||1e9);e.apexPhase=1;state.apexActiveId=e.id;state.bossActiveId=e.id;return true;})()`);await sleep(900);await snapshot(`apex-${form}-a`);await sleep(650);await snapshot(`apex-${form}-b`);await sleep(650);await snapshot(`apex-${form}-c`);
}

const errors=await evalv(`({runtime:window.stackfallRuntimeDiagnostics?.()||null,exceptions:window.__stage01ReviewExceptions||[]})`);
writeFileSync(join(out,'review.json'),JSON.stringify({url:pageUrl,frames,errors},null,2));
cdp.close();browser.kill('SIGTERM');await sleep(250);rmSync(profile,{recursive:true,force:true});
console.log(JSON.stringify({ok:true,frames:frames.length,out},null,2));
