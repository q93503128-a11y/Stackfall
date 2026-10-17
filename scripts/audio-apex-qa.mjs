import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=resolve(process.env.STACKFALL_QA_DIR||'test-results/audio-apex-qa');mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'stackfall-audio-apex-qa-')),chrome=process.env.STACKFALL_CHROME||'/usr/bin/google-chrome';
if(!existsSync(chrome))throw new Error(`Chrome not found: ${chrome}`);
const browser=spawn(chrome,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-size=1920,1080','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','about:blank'],{stdio:'ignore'});
let port=0;for(let i=0;i<120;i++){const p=join(profile,'DevToolsActivePort');if(existsSync(p)){port=Number(readFileSync(p,'utf8').trim().split(/\r?\n/)[0]);if(port)break;}await sleep(100);}if(!port)throw new Error('CDP port timeout');
const endpoint=async(path,options={})=>{for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${port}${path}`,options);if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`endpoint timeout ${path}`);};
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={}){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{this.pending.set(id,{ok,fail});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.pending.delete(id))fail(new Error(`CDP timeout ${method}`));},20000);});}close(){this.ws?.close();}}
const target=await endpoint(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'}),cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
const evalv=async expression=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
const shot=async name=>{const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(join(out,`${name}.png`),Buffer.from(r.data,'base64'));};
const waitFor=async(expression,timeoutMs=9000,intervalMs=100)=>{const start=Date.now();while(Date.now()-start<timeoutMs){if(await evalv(expression))return true;await sleep(intervalMs);}return false;};
const url='https://stackfall.pages.dev/?dev=1&audio-apex-qa='+Date.now();await cdp.send('Page.navigate',{url});await waitFor(`document.readyState==='complete'&&window.stackfallDeveloperTest?.enabled===true`,18000,150);await sleep(1800);
await evalv(`GAME_SETTINGS.audio.master=true;GAME_SETTINGS.audio.ambient=true;GAME_SETTINGS.audio.volume.master=.75;GAME_SETTINGS.audio.volume.ambient=.58;audio.init();window.stackfallDeveloperTest.setInvincible(true);window.stackfallDeveloperTest.setLevelUpsDisabled(true);true`);
const checks=[],snapshots=[];
async function snap(label){const l=JSON.stringify(label);const s=await evalv(`(()=>{const e=(state.entities.enemies||[]).find(x=>x&&!x.dead&&(x.kind==='stage-boss'||x.kind==='apex'));const d=window.stackfallRuntimeDiagnostics?.()||null;return{label:${l},mode:state.mode,time:state.time,stage:state.stageRun?.stage?.id||null,bossIntroPending:state.stageRun?.bossIntroPending===true,bossSpawned:state.stageRun?.bossSpawned===true,musicScene:audio.musicScene||null,musicTimer:!!audio.ambientTimer,musicMaster:!!audio.ambientMaster,enemy:e?{id:e.id,kind:e.kind,form:e.apexForm||e.variant||e.eliteForm||null,r:e.r,phase:e.stagePhase||e.apexPhase||1,dominion:!!e.stage01Dominion}:null,beams:(state.entities.beams||[]).length,shots:(state.entities.enemyProjectiles||[]).length,errorCount:d?.errorCount||0,runtimeErrors:d?.errors||[]};})()`);snapshots.push(s);return s;}
async function scene(label,expected){await sleep(550);const s=await snap(label),ok=s.musicScene===expected&&s.musicTimer&&s.musicMaster&&s.errorCount===0;checks.push({name:label,expected,actual:s.musicScene,ok,state:s});if(!ok)throw new Error(`${label}: ${JSON.stringify(s)}`);return s;}
async function forceDominion(ratio,phase,label){
  await evalv(`(()=>{const e=(state.entities.enemies||[]).find(x=>x?.kind==='stage-boss');if(!e)return false;e.stage01Dominion=null;e.hp=e.maxHp*${ratio};return true;})()`);
  if(!await waitFor(`(state.entities.enemies||[]).some(e=>e?.kind==='stage-boss'&&e.stagePhase===${phase})`,1800))throw new Error(`${label}: phase ${phase} transition timeout`);
  await evalv(`(()=>{const e=(state.entities.enemies||[]).find(x=>x?.kind==='stage-boss');if(!e)return false;e.stage01DominionCd=.01;return true;})()`);
  if(!await waitFor(`(state.entities.enemies||[]).some(e=>e?.kind==='stage-boss'&&e.stage01Dominion)&&state.entities.beams.length>0`,2200))throw new Error(`${label}: Dominion start timeout`);
  const s=await snap(label),ok=!!s.enemy?.dominion&&s.enemy.phase===phase&&s.beams>0&&s.errorCount===0;checks.push({name:label,ok,state:s});if(!ok)throw new Error(`${label}: ${JSON.stringify(s)}`);return s;
}

await evalv(`window.stackfallDeveloperTest.startEndless();audio.syncAmbient(true);true`);await scene('endless-normal','endless');
await evalv(`window.stackfallDeveloperTest.startStage('stage-01');window.stackfallDeveloperTest.setInvincible(true);window.stackfallDeveloperTest.setLevelUpsDisabled(true);audio.syncAmbient(true);true`);await scene('stage01-normal','constellation1');await shot('01-stage-normal');
await evalv(`window.stackfallDeveloperTest.jumpStageBoss('stage-01');true`);await sleep(900);const preview=await snap('stage01-preview'),previewOk=preview.musicScene==='constellation1'&&!preview.bossIntroPending&&!preview.bossSpawned&&preview.errorCount===0;checks.push({name:'stage01-preview-score',expected:'constellation1',actual:preview.musicScene,ok:previewOk,state:preview});if(!previewOk)throw new Error(`Stage 1 preview failed: ${JSON.stringify(preview)}`);
if(!await waitFor(`state.stageRun?.bossIntroPending===true&&audio.musicScene==='apex-warden'`,7000))throw new Error('Stage 1 Apex anticipation timeout');const entry=await snap('stage01-entry'),entryOk=entry.musicScene==='apex-warden'&&entry.bossIntroPending&&!entry.bossSpawned&&!entry.enemy&&entry.errorCount===0;checks.push({name:'stage01-entry-score',expected:'apex-warden',actual:entry.musicScene,ok:entryOk,state:entry});if(!entryOk)throw new Error(`Stage 1 entry failed: ${JSON.stringify(entry)}`);await shot('02-stage-apex-entry');
if(!await waitFor(`state.stageRun?.bossSpawned===true&&(state.entities.enemies||[]).some(x=>x&&!x.dead&&x.kind==='stage-boss')`,6000))throw new Error('Stage 1 Apex spawn timeout');await scene('stage01-apex-p1','apex-warden');await shot('03-stage-apex-p1');
await forceDominion(.56,2,'orbit-dominion-p2');await shot('04-stage-apex-p2-dominion');
await forceDominion(.22,3,'orbit-dominion-p3');await shot('05-stage-apex-p3-dominion');

for(const form of ['chronophage','starforge','lastconstellation']){
  await evalv(`window.stackfallDeveloperTest.startEndless();window.stackfallDeveloperTest.setInvincible(true);window.stackfallDeveloperTest.setLevelUpsDisabled(true);true`);await sleep(300);
  await evalv(`(()=>{state.mode='playing';state.xp=0;state.xpNeed=1e12;state.rewardQueue=[];ui.choice?.classList.add('hidden');for(const a of Object.values(state.entities))if(Array.isArray(a))a.length=0;state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;state.realmTheme='space';state.time=601;const e=window.stackfallSpawnEliteForm('apex','${form}');if(!e)return false;e.x=player.x+300;e.y=player.y;e.speed=0;e.damage=0;e.hp=e.maxHp=Math.max(1e9,e.maxHp||1e9);e.apexPhase=1;state.apexActiveId=e.id;state.bossActiveId=e.id;audio.syncAmbient(true);return true;})()`);
  await scene(`apex-${form}`,`apex-${form}`);await shot(`apex-${form}`);
}
const finalDiag=await evalv(`window.stackfallRuntimeDiagnostics?.()||null`);writeFileSync(join(out,'qa.json'),JSON.stringify({url,checks,snapshots,finalDiag},null,2));
cdp.close();browser.kill('SIGTERM');await sleep(250);rmSync(profile,{recursive:true,force:true});console.log(JSON.stringify({ok:true,checks:checks.length,out},null,2));
