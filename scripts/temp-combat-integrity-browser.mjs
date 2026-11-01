import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync,writeFileSync,mkdirSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'test-results','combat-integrity');mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-combat-integrity-'));
const port=8013,debugPort=9243;
const chromeCandidates=[process.env.STACKFALL_CHROME,process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean);
const chromePath=chromeCandidates.find(existsSync);if(!chromePath)throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url||'/',`http://127.0.0.1:${port}`);let rel=decodeURIComponent(u.pathname);if(rel==='/'||rel==='')rel='/index.html';const safe=normalize(rel).replace(/^([/\\])+/,'');const path=resolve(root,safe);if(!path.startsWith(root)){res.writeHead(403);res.end('forbidden');return;}const {readFile}=await import('node:fs/promises');const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end('not found');}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const browser=spawn(chromePath,['--headless=new',`--remote-debugging-port=${debugPort}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--window-size=1440,900','--force-device-scale-factor=1','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check','--no-sandbox','--disable-dev-shm-usage','about:blank'],{stdio:['ignore','pipe','pipe']});
let chromeLog='';browser.stderr.on('data',d=>chromeLog+=String(d));
async function endpoint(path,timeout=15000){const st=Date.now();while(Date.now()-st<timeout){try{const r=await fetch(`http://127.0.0.1:${debugPort}${path}`,path.startsWith('/json/new?')?{method:'PUT'}:{});if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeLog.slice(-1800)}`);}
class Cdp{constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}async send(method,params={},timeout=20000){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{const timer=setTimeout(()=>{this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));},timeout);this.pending.set(id,{ok,fail,timer});this.ws.send(JSON.stringify({id,method,params}));});}close(){this.ws?.close();}}
let cdp;const report={checks:[],observations:{}};
async function evalJs(expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(expression,timeout=15000){const st=Date.now();while(Date.now()-st<timeout){try{const v=await evalJs(expression);if(v)return v;}catch{}await sleep(70);}throw new Error(`waitFor timeout: ${expression}`);}
function check(ok,label,details=null){report.checks.push({ok:!!ok,label,details});if(!ok)throw new Error(`${label}: ${JSON.stringify(details)}`);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&integrity=${Date.now()}`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/?dev=1&integrity=${Date.now()}`});
  await waitFor(`window.stackfallCombatIntegrityV1==='v1'&&window.stackfallEndlessPressureRewardsV1==='v1'&&window.stackfallLastConstellationProduction==='v2'&&typeof stackfallDeveloperTest==='object'`);
  const started=await evalJs(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.setInvincible(true);api.setLevelUpsDisabled(true);GAME_SETTINGS.audio.master=false;state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.spawnTimer=state.encounterTimer=99999;state.bossBags=state.bossBags||{};state.bossBags.apex=['lastconstellation'];state.lastBossForms=state.lastBossForms||{};state.lastBossForms.apex='chronophage';return beginApexEncounter();})()`);
  check(started,'Last Constellation starts');await waitFor(`state.entities.enemies.some(e=>!e.dead&&e.apexForm==='lastconstellation')`);await waitFor(`!state.realmTransition&&state.mode==='playing'`);await sleep(250);

  const phases=await evalJs(`(()=>{const out=[];for(let guard=0;guard<4;guard++){const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation');if(!e)break;compactInPlace(state.entities.enemies,x=>x===e);const active=(e.bodyParts||[]).filter(p=>p.lcNodeProxy&&p.active&&!p.dead);if(!active.length)break;player.x=e.x;player.y=e.y+Math.max(80,e.r*.5);GAME_SETTINGS.manualAim=false;state.input.aimActive=false;const arc=nearestWeaponTarget('arc');const missile=postRosterTargetList(weaponRange('missile'),1)[0];const gate=gateInstallTarget();GAME_SETTINGS.manualAim=true;state.input.aimActive=true;state.input.aimWorldX=active[0].x;state.input.aimWorldY=active[0].y;const manual=nearestWeaponTarget('rail');GAME_SETTINGS.manualAim=false;state.input.aimActive=false;out.push({phase:e.lcStructure?.phase||e.apexPhase,active:active.map(p=>p.id),arc:arc?.id,missile:missile?.id,gate:gate?.id,manual:manual?.id,owner:e.id});if((e.lcStructure?.phase||e.apexPhase)>=4)break;for(const part of active)dealDamage(part,1e12,{source:'integrity-phase-clear',canCrit:false});}return out;})()`);
  report.observations.phases=phases;
  check(phases.length===4,'P1-P4 were inspected',phases);
  for(const row of phases)for(const key of['arc','missile','gate','manual'])check(row.active.includes(row[key]),`${key} targets an active node in phase ${row.phase}`,row);

  const boomerangs=await evalJs(`(()=>{const e=state.entities.enemies.find(x=>!x.dead&&x.apexForm==='lastconstellation'),part=(e?.bodyParts||[]).find(p=>p.lcNodeProxy&&p.active&&!p.dead);state.entities.curves.length=0;for(let i=0;i<15;i++)fireBoomerang(part,6,false);const before=state.entities.curves.length,targetIds=[...new Set(state.entities.curves.map(c=>c.targetId))];updateBoomerangs(.016);return{before,after:state.entities.curves.length,targetIds,active:part?.id};})()`);
  report.observations.boomerangs=boomerangs;
  check(boomerangs.before===45&&boomerangs.after===45,'45 active boomerangs survive beyond legacy 28/32 FIFO caps',boomerangs);
  check(boomerangs.targetIds.length===1&&boomerangs.targetIds[0]===boomerangs.active,'boomerangs aim at active core surface',boomerangs);

  const reward=await evalJs(`(()=>{state.entities.curves.length=0;state.entities.enemies.length=0;state.apexActiveId=null;state.bossActiveId=null;state.mode='playing';const b=spawnEnemy('boss');b.hp=b.maxHp=1;b.noEliteReward=false;const q0=state.rewardQueue?.length||0;killEnemy(b,{source:'integrity-first'});const q1=state.rewardQueue?.length||0;killEnemy(b,{source:'integrity-duplicate'});const q2=state.rewardQueue?.length||0;return{q0,q1,q2,dead:b.dead,mode:state.mode};})()`);
  report.observations.reward=reward;
  check(reward.dead&&reward.q2===reward.q1,'duplicate kill cannot enqueue a second elite reward',reward);

  const pressure=await evalJs(`(()=>{state.mode='playing';state.entities.enemies.length=0;state.bossActiveId=null;state.apexActiveId=null;state.mapEventActive=null;state.time=2100;state.runTime=2100;state.enemyDirectorV1=null;state.endlessPressureV1=null;for(let i=0;i<260;i++)stackfallEnemyDirectorV1.updateSpawning(.20);const live=state.entities.enemies.filter(e=>!e.dead&&e.kind==='normal'&&!e.eventKind).length,profile=stackfallEnemyDirectorProfile(),diag=stackfallEndlessPressureDiagnostics();return{live,profile,diag,cap:entityCap('enemies')};})()`);
  report.observations.pressure=pressure;
  check(pressure.cap===136,'desktop enemy hard cap raised to 136',pressure);
  check(pressure.profile.target>92&&pressure.profile.target<=124,'late Endless target rises beyond legacy 92 while bounded',pressure);
  check(pressure.live>92&&pressure.live<=129,'runtime population exceeds legacy ceiling without crossing reserved normal cap',pressure);

  const dread=await evalJs(`(()=>{state.entities.enemies.length=0;state.mapEventActive=null;state.mode='playing';state.time=1200;const before=Number(state.runCurrencyEarned?.coreShard)||0;state.mapEventActive={type:'crash',sequence:3,dreadnought:true,wave:2,waves:[1,1,1],remaining:0,spawnCd:0,between:0,remainingTime:30,maxTime:30,scale:{strength:2,waves:[1,1,1],duration:30},arena:{x:player.x,y:player.y,r:455},bossId:null};updateMapEvents(.016);const after=Number(state.runCurrencyEarned?.coreShard)||0;return{mode:state.mode,active:state.mapEventActive,before,after,prompt:document.querySelector('#worldEventPrompt')?.textContent};})()`);
  report.observations.dread=dread;
  check(dread.mode==='worldEvent'&&dread.active===null,'dreadnought completion opens salvage',dread);
  check(dread.after-dread.before===1,'dreadnought completion grants exactly one Core Shard',dread);
  check(/\+1/.test(dread.prompt||''),'dreadnought bonus is surfaced in salvage prompt',dread);

  const diag=await evalJs(`({runtime:stackfallRuntimeDiagnostics?.(),integrity:stackfallCombatIntegrityDiagnostics?.()})`);
  report.observations.diag=diag;
  check((diag.runtime?.errorCount||0)===0,'runtime diagnostics report no errors',diag);
  report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error?.stack||error);throw error;
}finally{writeFileSync(join(out,'combat-integrity-observations.json'),JSON.stringify(report,null,2));try{cdp?.close();}catch{}try{browser.kill('SIGTERM');}catch{}await sleep(120);try{server.close();}catch{}for(let i=0;i<4;i++){try{rmSync(profile,{recursive:true,force:true});break;}catch{await sleep(120);}}}
