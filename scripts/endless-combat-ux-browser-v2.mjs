import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-combat-ux-v2-'));
const port=8024,debugPort=9248;
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
async function waitBoot(){await waitFor(`document.readyState==='complete'&&window.stackfallEndlessCombatUxV2&&window.stackfallEndlessProgression?.achievements?.length===40&&document.querySelector('#achievementHubBtn')`);await sleep(160);}

try{
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?combatUxV2Audit=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);await waitBoot();

  const config=await evalJs(`(()=>({cfg:stackfallEndlessCombatUxV2,frame:stackfallEventGuideFrameV2(),vw,vh}))()`);
  check(config.cfg.rangedCapDesktop===5&&config.cfg.rangedCapCompact===4&&config.cfg.rangedSpawnGap===1.8&&config.cfg.rangedKillCooldown===3.2,'ranged pressure limits are installed',config);
  check(config.cfg.omegaStellarWindDamageScale===.25,'Omega stellar-wind damage scale is set to one quarter of the prior unavoidable tick',config);
  check(config.frame.left>=190&&config.frame.right<=config.vw-190&&config.frame.top>=100&&config.frame.bottom<=config.vh-150,'event guide is pulled substantially inward from the screen edge',config);

  const ranged=await evalJs(`(()=>{resetGame();state.entities.enemies.length=0;state.mode='playing';state.runSelection={mode:'endless',stageId:null};state.mapEventActive=null;state.runTime=state.time=600;const oldRandom=Math.random,oldDifficulty=window.stackfallDifficultyConfig;Math.random=()=>.5;window.stackfallDifficultyConfig=()=>({...oldDifficulty(),rangedChance:10});try{const first=spawnEnemy('normal'),firstType=first?.type;dealDamage(first,(first?.hp||0)+100,{canCrit:false,source:'audit'});const immediate=spawnEnemy('normal');state.runTime=state.time=603.3;const afterCooldown=spawnEnemy('normal');const types=[afterCooldown?.type];for(let i=0;i<5;i++){state.runTime=state.time=605.4+i*2.0;types.push(spawnEnemy('normal')?.type);}return{firstType,immediate:immediate?.type,afterCooldown:afterCooldown?.type,types,liveRanged:state.entities.enemies.filter(e=>!e.dead&&e.type==='ranged'&&(e.kind==='normal'||!e.kind)).length};}finally{Math.random=oldRandom;window.stackfallDifficultyConfig=oldDifficulty;}})()`);
  check(ranged.firstType==='ranged','first eligible ranged enemy can spawn normally',ranged);
  check(ranged.immediate==='grunt'&&ranged.afterCooldown==='ranged','killing a ranged enemy creates a 3.2-second ranged respawn breather',ranged);
  check(ranged.liveRanged<=5&&ranged.types[ranged.types.length-1]==='grunt','ordinary ranged population is capped while overall enemy pressure continues',ranged);

  const omega=await evalJs(`(()=>{resetGame();state.entities.enemies.length=0;state.mode='playing';state.runSelection={mode:'endless',stageId:null};state.runTime=state.time=600;const e=spawnEnemy('apex');if(!e)return{spawned:false};e.kind='apex';e.apexForm=e.eliteForm='starforge';e.damage=100;e.hp=e.maxHp=Math.max(1000,e.maxHp||0);e.x=player.x-180;e.y=player.y;e.skillCd=e.burstCd=e.pulseCd=e.signatureCd=e.apexFrenzyCd=999;e.attackLockUntil=0;apexBossSkill(e,.01);const s=e.omegaCombat;if(!s)return{spawned:true,omegaState:false};s.cannonCd=s.droneCd=s.fanCd=s.heatCd=s.windCd=999;s.cannon=s.fan=s.heat=null;player.x=e.x+120;player.y=e.y;player.shield=0;player.invuln=0;player.hp=player.maxHp;s.wind={warn:0,active:1,maxWarn:1.02,maxActive:1.65,tick:0,front:0,burst:true,dir:1};const windBefore=player.hp;apexBossSkill(e,.01);const windDelta=windBefore-player.hp;s.wind=null;player.hp=player.maxHp;player.shield=0;player.invuln=0;s.cannon={warn:0,fire:.20,maxWarn:.72,maxFire:.24,angle:0,plate:0,hit:false};s.attackSerial=(s.attackSerial||0)+1;const cannonBefore=player.hp;apexBossSkill(e,.01);const cannonDelta=cannonBefore-player.hp;return{spawned:true,omegaState:true,windDelta,cannonDelta,ratio:windDelta>0?cannonDelta/windDelta:0};})()`);
  check(omega.spawned&&omega.omegaState&&omega.windDelta>0,'live Omega stellar wind still deals damage',omega);
  check(omega.cannonDelta>omega.windDelta*3,'unavoidable Omega stellar wind is at least three times weaker than the avoidable plate cannon hit',omega);

  await evalJs(`showMainMenu();document.querySelector('#achievementHubBtn')?.click()`);await waitFor(`!document.querySelector('#achievementScreen')?.classList.contains('hidden')`);await sleep(100);
  const achievementCopy=await evalJs(`(()=>{const rows=stackfallEndlessProgression.achievements||[],cards=[...document.querySelectorAll('#achievementScreen .achievement-row')];const featureRows=rows.map((row,index)=>({row,index,features:(row.rewards||[]).filter(r=>r.type==='unlock_feature')})).filter(x=>x.features.length);const checks=featureRows.map(x=>({id:x.row.id,text:cards[x.index]?.querySelector('.achievement-copy>small')?.textContent||'',expected:x.features.map(r=>(stackfallFeatureName?.(r.key)||r.key)+' 해금')}));return{checks,generic:cards.some(card=>(card.querySelector('.achievement-copy>small')?.textContent||'').trim()==='보상 · 기능 해금'};})()`);
  check(achievementCopy.checks.length>0&&achievementCopy.checks.every(x=>x.expected.every(name=>x.text.includes(name)))&&!achievementCopy.generic,'achievement cards name every exact unlocked feature instead of generic feature text',achievementCopy);
  await evalJs(`document.querySelector('#achievementCloseBtn')?.click()`);

  const stellar=await evalJs(`(()=>{resetGame();state.mode='playing';state.entities.enemies.length=0;state.weaponStacks={core:1};state.weaponSlots=[];player.coreCd=999;state.bossTraits={stellar:true};state.rewardTimers={stellar:0,aegis:999,chrono:999};const e=spawnEnemy('normal');e.x=player.x+90;e.y=player.y;e.hp=e.maxHp=1000;const before=e.hp,beamsBefore=state.entities.beams.length;updateWeapons(.016);return{damage:before-e.hp,beams:state.entities.beams.length-beamsBefore};})()`);
  check(stellar.damage>0&&stellar.beams>0,'Stellar Crown actually damages nearby enemies and produces its ray',stellar);

  const aegis=await evalJs(`(()=>{resetGame();state.mode='playing';state.entities.enemies.length=0;state.weaponStacks={core:1};state.weaponSlots=[];player.coreCd=999;state.bossTraits={aegis:true};state.rewardTimers={stellar:999,aegis:0,chrono:999};player.shield=0;updateWeapons(.016);return{shield:player.shield};})()`);
  check(aegis.shield>0,'Void Aegis actually recharges the player shield',aegis);

  const singularity=await evalJs(`(()=>{resetGame();state.mode='playing';state.entities.enemies.length=0;state.weaponStacks={core:1};state.weaponSlots=[];player.coreCd=999;state.bossTraits={singularity:true};state.rewardKills=14;const victim=spawnEnemy('normal');victim.x=player.x+80;victim.y=player.y;dealDamage(victim,victim.hp+100,{canCrit:false,source:'audit'});const w=state.entities.wells.find(x=>x?.kind==='trait-singularity');if(!w)return{created:false};const p={x:w.x,y:w.y,vx:100,vy:0,r:4,damage:1,life:5,max:5,color:'#fff'};state.entities.enemyProjectiles.push(p);const target=spawnEnemy('normal');target.x=w.x+20;target.y=w.y;target.timeLock=0;const speedBefore=Math.hypot(p.vx,p.vy);updateWells(.10);const slowed=Math.hypot(p.vx,p.vy);w.life=.01;updateWells(.02);return{created:true,slowed:speedBefore>slowed,timeLock:target.timeLock||0,collapsed:!!w.traitCollapseDone,shards:state.entities.projectiles.filter(x=>x.source==='singularity-shard').length};})()`);
  check(singularity.created&&singularity.slowed&&singularity.timeLock>0&&singularity.collapsed&&singularity.shards===8,'Singularity Vein creates, slows projectiles and enemies, collapses, and emits eight shards',singularity);

  const eclipse=await evalJs(`(()=>{resetGame();state.mode='playing';state.entities.enemies.length=0;state.weaponStacks={core:1};state.weaponSlots=[];const hit=()=>{const e=spawnEnemy('normal');e.hp=e.maxHp=1000;const before=e.hp;dealDamage(e,10,{canCrit:false,source:'audit-eclipse'});return before-e.hp;};state.bossTraits={};player.hp=player.maxHp;const base=hit();state.bossTraits={eclipse:true};player.hp=player.maxHp;const full=hit();player.hp=player.maxHp*.25;const low=hit();return{base,full,low,fullRatio:full/base,lowRatio:low/base};})()`);
  check(eclipse.fullRatio>1.17&&eclipse.fullRatio<1.23&&eclipse.lowRatio>1.46&&eclipse.lowRatio<1.54,'Eclipse Reactor applies roughly +20% at full health and +50% at low health to real hits',eclipse);

  const chrono=await evalJs(`(()=>{resetGame();state.mode='playing';state.entities.enemies.length=0;state.weaponStacks={core:1};state.weaponSlots=[];player.coreCd=999;state.bossTraits={chrono:true};state.rewardTimers={stellar:999,aegis:999,chrono:0};const normal=spawnEnemy('normal');normal.x=player.x+80;normal.y=player.y;normal.timeLock=0;const apex={id:999999,type:'boss',kind:'apex',x:player.x+90,y:player.y,r:40,hp:999,maxHp:999,dead:false,timeLock:0};state.entities.enemies.push(apex);updateWeapons(.016);return{normal:normal.timeLock||0,apex:apex.timeLock||0};})()`);
  check(chrono.normal>=1.3&&chrono.apex===0,'Chrono Bloom freezes nearby ordinary enemies while respecting Apex immunity',chrono);

  const harvest=await evalJs(`(()=>{resetGame();state.mode='playing';state.entities.enemies.length=0;state.weaponStacks={core:1};state.weaponSlots=[];state.bossTraits={harvest:true};player.hp=player.maxHp-20;const before=player.hp,e=spawnEnemy('normal');dealDamage(e,e.hp+100,{canCrit:false,source:'audit'});return{before,after:player.hp,gain:player.hp-before};})()`);
  check(harvest.gain===1,'Star Harvest restores health on an actual ordinary kill',harvest);

  await evalJs(`(()=>{resetGame();state.mode='playing';state.apexBoons={starforge:1,lastconstellation:1};openAbilityLedger();return true;})()`);await sleep(100);
  const ledgerText=await evalJs(`document.querySelector('#abilityLedgerScreen')?.innerText||''`);
  check(ledgerText.includes('동력핵 융합')&&ledgerText.includes('무명의 천구')&&!ledgerText.includes('미니어처 항성')&&!ledgerText.includes('살아 있는 성좌망'),'ability ledger uses current Apex legacy names and descriptions',ledgerText.slice(0,900));
  await evalJs(`closeAbilityLedger(true);state.mode='playing';openApexRewardSelection('starforge')`);await sleep(100);
  const apexRewardText=await evalJs(`document.querySelector('#apexRewardScreen')?.innerText||''`);
  check(apexRewardText.includes('동력핵 융합')&&!apexRewardText.includes('미니어처 항성'),'Apex reward preview uses the current Omega legacy description',apexRewardText.slice(0,800));

  const forbidden=await evalJs(`stackfallPlayerFacingCopyAudit()`);
  check(Array.isArray(forbidden)&&forbidden.length===0,'common player-facing screens contain no developer-log, debug, implementation-note, or TMI copy',forbidden);

  console.log('ENDLESS_COMBAT_UX_BROWSER_V2 PASS');
}finally{
  try{cdp?.close();}catch{}
  try{browser.kill('SIGTERM');}catch{}
  await sleep(140);
  try{server.close();}catch{}
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
