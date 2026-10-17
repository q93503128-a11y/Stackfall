import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=resolve(process.env.STACKFALL_QA_DIR||'test-results/audio-apex-qa');
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'stackfall-audio-apex-qa-'));
const chrome=process.env.STACKFALL_CHROME||'/usr/bin/google-chrome';
if(!existsSync(chrome))throw new Error(`Chrome not found: ${chrome}`);
const browser=spawn(chrome,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--window-size=1920,1080','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','about:blank'],{stdio:'ignore'});
let port=0;
for(let i=0;i<120;i++){const p=join(profile,'DevToolsActivePort');if(existsSync(p)){port=Number(readFileSync(p,'utf8').trim().split(/\r?\n/)[0]);if(port)break;}await sleep(100);}if(!port)throw new Error('CDP port timeout');
const endpoint=async(path,options={})=>{for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${port}${path}`,options);if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`endpoint timeout ${path}`);};
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={}){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{this.pending.set(id,{ok,fail});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.pending.delete(id))fail(new Error(`CDP timeout ${method}`));},20000);});}close(){this.ws?.close();}}
const target=await endpoint(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'});const cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
const evalv=async expression=>{const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
const shot=async name=>{const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(join(out,`${name}.png`),Buffer.from(r.data,'base64'));};
const pageUrl='https://stackfall.pages.dev/?dev=1&audio-apex-qa='+Date.now();await cdp.send('Page.navigate',{url:pageUrl});for(let i=0;i<120;i++){if(await evalv(`document.readyState==='complete'&&window.stackfallDeveloperTest?.enabled===true`))break;await sleep(150);}await sleep(2200);
await evalv(`GAME_SETTINGS.audio.master=true;GAME_SETTINGS.audio.ambient=true;GAME_SETTINGS.audio.volume.master=.75;GAME_SETTINGS.audio.volume.ambient=.58;audio.init();window.stackfallDeveloperTest.setInvincible(true);window.stackfallDeveloperTest.setLevelUpsDisabled(true);true`);
const checks=[];const snapshots=[];
async function stateSnap(label){const data=await evalv(`(()=>{const e=(state.entities.enemies||[]).find(x=>x&&!x.dead&&(x.kind==='stage-boss'||x.kind==='apex'));const d=window.stackfallRuntimeDiagnostics?.()||null;return{label,mode:state.mode,time:state.time,stage:state.stageRun?.stage?.id||null,musicScene:audio.musicScene||null,musicTimer:!!audio.ambientTimer,musicMaster:!!audio.ambientMaster,enemy:e?{id:e.id,kind:e.kind,form:e.apexForm||e.variant||e.eliteForm||null,r:e.r,phase:e.stagePhase||e.apexPhase||1,dominion:!!e.stage01Dominion}:null,beams:(state.entities.beams||[]).length,shots:(state.entities.enemyProjectiles||[]).length,runtimeErrors:d?.errors||[],errorCount:d?.errorCount||0};})()`);snapshots.push(data);return data;}
async function expectScene(label,expected){await sleep(650);const s=await stateSnap(label);const ok=s.musicScene===expected&&s.musicTimer&&s.musicMaster&&s.errorCount===0;checks.push({name:label,expected,actual:s.musicScene,ok,state:s});if(!ok)throw new Error(`${label}: expected ${expected}, got ${s.musicScene}, timer=${s.musicTimer}, master=${s.musicMaster}, errors=${s.errorCount}`);return s;}

// Endless normal score.
await evalv(`window.stackfallDeveloperTest.startEndless();audio.syncAmbient(true);true`);await expectScene('endless-normal','endless');

// Stage 1 exploration uses constellation family 1 score.
await evalv(`window.stackfallDeveloperTest.startStage('stage-01');window.stackfallDeveloperTest.setInvincible(true);window.stackfallDeveloperTest.setLevelUpsDisabled(true);audio.syncAmbient(true);true`);await expectScene('stage01-normal','constellation1');await shot('01-stage-normal');

// Entry must switch before the Apex becomes actionable.
await evalv(`window.stackfallDeveloperTest.jumpStageBoss('stage-01');true`);await sleep(1150);let entry=await stateSnap('stage01-entry');checks.push({name:'stage01-entry-score',expected:'apex-warden',actual:entry.musicScene,ok:entry.musicScene==='apex-warden'&&entry.errorCount===0});if(entry.musicScene!=='apex-warden'||entry.errorCount)throw new Error(`Stage 1 entry scene failed: ${JSON.stringify(entry)}`);await shot('02-stage-apex-entry');
await sleep(3300);await expectScene('stage01-apex-p1','apex-warden');await shot('03-stage-apex-p1');

// Force phase 2 + signature setpiece and verify it actually exists in runtime.
await evalv(`(()=>{const e=(state.entities.enemies||[]).find(x=>x?.kind==='stage-boss');if(!e)return false;e.hp=e.maxHp*.56;e.stage01DominionCd=.03;return true;})()`);await sleep(1250);let p2=await stateSnap('stage01-p2-dominion');checks.push({name:'orbit-dominion-p2',ok:!!p2.enemy?.dominion&&p2.beams>0&&p2.errorCount===0,state:p2});if(!p2.enemy?.dominion||p2.beams<=0||p2.errorCount)throw new Error(`Orbit Dominion P2 failed: ${JSON.stringify(p2)}`);await shot('04-stage-apex-p2-dominion');

// Force phase 3 and verify denser setpiece survives without runtime errors.
await evalv(`(()=>{const e=(state.entities.enemies||[]).find(x=>x?.kind==='stage-boss');if(!e)return false;e.hp=e.maxHp*.22;e.stage01Dominion=null;e.stage01DominionCd=.03;return true;})()`);await sleep(1350);let p3=await stateSnap('stage01-p3-dominion');checks.push({name:'orbit-dominion-p3',ok:!!p3.enemy?.dominion&&p3.beams>0&&p3.errorCount===0,state:p3});if(!p3.enemy?.dominion||p3.beams<=0||p3.errorCount)throw new Error(`Orbit Dominion P3 failed: ${JSON.stringify(p3)}`);await shot('05-stage-apex-p3-dominion');

// Existing Apex forms must each route to their own score identity.
for(const form of ['chronophage','starforge','lastconstellation']){
  await evalv(`window.stackfallDeveloperTest.startEndless();window.stackfallDeveloperTest.setInvincible(true);window.stackfallDeveloperTest.setLevelUpsDisabled(true);true`);await sleep(350);
  await evalv(`(()=>{state.mode='playing';state.xp=0;state.xpNeed=1e12;state.rewardQueue=[];ui.choice?.classList.add('hidden');for(const a of Object.values(state.entities))if(Array.isArray(a))a.length=0;state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;state.realmTheme='space';state.time=601;const e=window.stackfallSpawnEliteForm('apex','${form}');if(!e)return false;e.x=player.x+300;e.y=player.y;e.speed=0;e.damage=0;e.hp=e.maxHp=Math.max(1e9,e.maxHp||1e9);e.apexPhase=1;state.apexActiveId=e.id;state.bossActiveId=e.id;audio.syncAmbient(true);return true;})()`);
  await expectScene(`apex-${form}`,`apex-${form}`);await shot(`apex-${form}`);
}

const finalDiag=await evalv(`window.stackfallRuntimeDiagnostics?.()||null`);writeFileSync(join(out,'qa.json'),JSON.stringify({url:pageUrl,checks,snapshots,finalDiag},null,2));
cdp.close();browser.kill('SIGTERM');await sleep(250);rmSync(profile,{recursive:true,force:true});console.log(JSON.stringify({ok:true,checks:checks.length,out},null,2));
