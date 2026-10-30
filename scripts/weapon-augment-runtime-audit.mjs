import {spawn} from 'node:child_process';
import {existsSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname,extname,join,normalize,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=mkdtempSync(join(tmpdir(),'stackfall-weapon-augment-audit-'));
const port=8027,debugPort=9257;
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
  const target=await endpoint(`/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/?dev=1&weaponAugmentAudit=1`)}`);cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  await waitFor(`document.readyState==='complete'&&window.stackfallWeaponAugmentDefs&&Object.keys(window.stackfallWeaponAugmentDefs).length===19&&typeof resetGame==='function'&&typeof updatePendingActions==='function'`);await sleep(200);

  const result=await evalJs(`(()=>{
    GAME_SETTINGS.audio.master=false;
    const originalAwakened=window.stackfallIsWeaponAwakened;
    window.stackfallIsWeaponAwakened=()=>false;
    const rows=[];
    const record=(key,ok,details={})=>rows.push({key,ok:!!ok,details});
    const setup=(stacks={})=>{
      resetGame();state.mode='playing';state.spawnTimer=9999;state.encounterTimer=9999;state.nextApexAt=1e9;state.time=10;state.runTime=10;state.level=1;state.xp=0;state.xpNeed=1e9;state.passives={};state.weaponStacks={...stacks};state.weaponSlots=[];state.weaponAugments={};state.bossTraits={};state.pendingActions.length=0;player.x=0;player.y=0;player.hp=player.maxHp=100;player.shield=0;player.invuln=0;player.facingAngle=0;player.angle=0;for(const list of Object.values(state.entities))if(Array.isArray(list))list.length=0;window.rebuildEnemyIndex?.();
    };
    const enemy=(x,y,hp=10000,type='grunt')=>{const e={id:state.nextId++,type,kind:'normal',x,y,r:type==='boss'?50:12,hp,maxHp:hp,speed:0,damage:0,color:'#fff',xp:0,dead:false,hit:0,phase:0,timeLock:0,strafeDir:1,rangedCd:999};state.entities.enemies.push(e);return e;};
    const rebuild=()=>window.rebuildEnemyIndex?.();
    const pendingStep=seconds=>{updatePendingActions(seconds);window.rebuildEnemyIndex?.();};
    const sourceCount=source=>state.entities.projectiles.filter(p=>p&&p.life>0&&p.source===source).length;

    try{
      setup({core:1});state.weaponAugments.core=true;const a=enemy(110,0),b=enemy(155,20);rebuild();player.coreVolley=3;spawnCoreShot(a,false);const nova=sourceCount('core-nova');player.communityCoreRicochetCycle=0;const b0=b.hp;for(let i=0;i<4;i++)dealDamage(a,1,{source:'core',canCrit:false});record('core',nova===10&&b.hp<b0,{nova,ricochetDamage:b0-b.hp});

      setup({blade:1});state.weaponAugments.blade=true;const bl=enemy(80,0),bl2=enemy(120,0);rebuild();player.strongBladeBurstReadyAt=0;player.bladeShearCycle=0;const bl20=bl2.hp;dealDamage(bl,1,{source:'blade',canCrit:false});state.time=11;for(let i=0;i<7;i++)dealDamage(bl,1,{source:'blade',canCrit:false});record('blade',bl2.hp<bl20&&sourceCount('blade-shear')>=1,{burstDamage:bl20-bl2.hp,shear:sourceCount('blade-shear')});

      setup({ember:1});state.weaponAugments.ember=true;const em=enemy(90,0),em2=enemy(130,20),em3=enemy(145,-20);rebuild();const e20=em2.hp,e30=em3.hp;dealDamage(em,1,{source:'ember',canCrit:false});for(let i=0;i<2;i++)dealDamage(em,1,{source:'ember',canCrit:false});const burnPending=state.pendingActions.length,emBeforeBurn=em.hp;pendingStep(.7);record('ember',em2.hp<e20&&em3.hp<e30&&burnPending>=3&&em.hp<emBeforeBurn,{chain:[e20-em2.hp,e30-em3.hp],burnPending,burnDamage:emBeforeBurn-em.hp});

      setup({bulwark:1});state.weaponAugments.bulwark=true;player.hp=100;player.shield=0;player.invuln=0;hurtPlayer(1,null);record('bulwark',sourceCount('barrier-lance')===4&&player.shield>0,{lances:sourceCount('barrier-lance'),shield:player.shield,hp:player.hp});

      setup({gravity:1});state.weaponAugments.gravity=true;const gr=enemy(145,0);rebuild();createGravityWells(1,false);const w=state.entities.wells[0];if(w){gr.x=w.x;gr.y=w.y;w.life=.01;rebuild();}const gr0=gr.hp;updateWells(.02);record('gravity',!!w&&w.rewardBurst===true&&gr.hp<gr0,{rewardBurst:w?.rewardBurst,collapseDamage:gr0-gr.hp});

      setup({comet:1});state.weaponAugments.comet=true;const co=enemy(210,0);rebuild();fireComet(co,1,false);const cometPending=state.pendingActions.length;pendingStep(.30);record('comet',cometPending>=2&&sourceCount('comet-afterimage')===2,{pending:cometPending,afterimages:sourceCount('comet-afterimage')});

      setup({prism:1});state.weaponAugments.prism=true;const pr=enemy(120,0),pr2=enemy(175,20);rebuild();state.time=10;updateFocusedPrisms(.016,1);state.time=11.02;rebuild();const pr20=pr2.hp;updateFocusedPrisms(.016,1);record('prism',pr2.hp<pr20,{ricochetDamage:pr20-pr2.hp,lock:player.prismSharedLock&&{targetId:player.prismSharedLock.targetId,readyAt:player.prismSharedLock.readyAt}});

      setup({chrono:1});state.weaponAugments.chrono=true;const ch=enemy(80,0,1),ch2=enemy(125,0);ch.timeLock=1;rebuild();const ch20=ch2.hp;dealDamage(ch,10,{source:'core',canCrit:false});record('chrono',ch.dead&&ch2.hp<ch20,{dead:ch.dead,fractureDamage:ch20-ch2.hp});

      setup({arc:1});state.weaponAugments.arc=true;const ar=enemy(80,0,1),ar2=enemy(175,20);rebuild();killEnemy(ar,{source:'arc'});record('arc',state.entities.curves.some(c=>c&&c.ricochet),{curves:state.entities.curves.map(c=>({ricochet:!!c.ricochet,targetId:c.targetId}))});

      setup({ion:1});state.weaponAugments.ion=true;for(let i=0;i<7;i++)enemy(90+i*45,(i%2?1:-1)*25);rebuild();fireIonChain(1,false);const ionBefore=state.entities.beams.length,ionPending=state.pendingActions.length;pendingStep(.20);record('ion',ionPending>=1&&state.entities.beams.length>ionBefore,{before:ionBefore,after:state.entities.beams.length,pending:ionPending});

      setup({nova:1});state.weaponAugments.nova=true;const nv=enemy(120,0),nv2=enemy(200,0);rebuild();fireNovaPulse(1,false);const novaPending=state.pendingActions.length,nvAfterImmediate=nv.hp,nv2x=nv2.x;pendingStep(.50);record('nova',novaPending>=2&&(nv.hp<nvAfterImmediate||nv2.x!==nv2x),{pending:novaPending,delayedDamage:nvAfterImmediate-nv.hp,pulled:nv2x-nv2.x});

      setup({drone:1});state.weaponAugments.drone=true;const dr=enemy(180,0);rebuild();fireMeteorDrones(1,false);const dronePending=state.pendingActions.length,marked=Number(dr.droneMarkedUntil)||0,dr0=dr.hp;pendingStep(.50);record('drone',marked>0&&dronePending>=1&&dr.hp<dr0,{marked, pending:dronePending,meteorDamage:dr0-dr.hp});

      setup({rail:1});state.weaponAugments.rail=true;const ra=enemy(240,0);rebuild();let railFractures=0;const savedArea=areaDamage;areaDamage=function(){if(arguments[5]==='rail-fracture')railFractures++;return savedArea(...arguments);};try{fireRailgun(1,false);pendingStep(.20);pendingStep(.30);}finally{areaDamage=savedArea;}record('rail',railFractures===3,{railFractures});

      setup({spiral:1});state.weaponAugments.spiral=true;const sp=enemy(220,0);rebuild();fireGalacticSpiral(1,false);const spiralPending=state.pendingActions.length;pendingStep(.70);record('spiral',spiralPending>0&&sourceCount('spiral-counter')>0,{pending:spiralPending,counterProjectiles:sourceCount('spiral-counter')});

      setup({mirror:1});state.weaponAugments.mirror=true;const mi=enemy(150,0);rebuild();player.shield=0;dealDamage(mi,1,{source:'mirror-return',canCrit:false});const mirrorShield=player.shield;state.entities.enemyProjectiles.push({id:state.nextId++,x:40,y:0,vx:-1,vy:0,r:4,life:2,max:2,damage:1,color:'#fff'});let twinRayCalls=0;const savedRailBeam=applyRailBeam;applyRailBeam=function(){if(arguments[7]==='mirror-twin-reflect')twinRayCalls++;return savedRailBeam(...arguments);};try{fireReflector(1,false);}finally{applyRailBeam=savedRailBeam;}record('mirror',mirrorShield>0&&twinRayCalls>=2,{shield:mirrorShield,twinRayCalls});

      setup({vacuum:1});state.weaponAugments.vacuum=true;plantVacuumSeed(0,0,1,false,0);const vs=state.entities.vacuumSeeds[0];state.entities.enemyProjectiles.push({id:state.nextId++,x:25,y:0,vx:0,vy:0,r:4,life:2,max:2,damage:1,color:'#fff'});const vshot=state.entities.enemyProjectiles[0];beginVacuumBloom(vs,1,false);record('vacuum',vs.absorbed===1&&vshot.life===0,{absorbed:vs.absorbed,shotLife:vshot.life});

      setup({mine:1});state.weaponAugments.mine=true;const mt=enemy(150,0);rebuild();const mineObj=placePhaseMine(0,0,1);mineObj.arm=0;detonatePhaseMine(mineObj,1);const phantoms=state.entities.phaseMines.filter(m=>m&&m.life>0&&m.phantom);record('mine',phantoms.length===1&&Math.abs(phantoms[0].damage-(26*.58))<.001,{phantoms:phantoms.map(m=>({damage:m.damage,life:m.life}))});

      setup({missile:1});state.weaponAugments.missile=true;const msTarget=enemy(100,0),ms2=enemy(115,30),ms3=enemy(115,-30);rebuild();const mainMissile={id:state.nextId++,x:80,y:0,vx:300,vy:0,targetId:msTarget.id,n:1,side:1,damage:100,baseDamage:100,r:5,life:2,max:2,age:.6,ignition:0,micro:false,split:false,terminal:true,reacquired:true,color:'#fff'};state.entities.guidedMissiles.push(mainMissile);splitMirvMissile(mainMissile,msTarget);const micros=state.entities.guidedMissiles.filter(m=>m&&m.micro);record('missile',mainMissile.split===true&&micros.length===2&&micros.every(m=>Math.abs(m.damage-34)<.001),{split:mainMissile.split,micros:micros.map(m=>({damage:m.damage,targetId:m.targetId}))});

      setup({gate:1});state.weaponAugments.gate=true;const gt=enemy(240,0);rebuild();deployOrbitalGate(1,false);const net=state.entities.gateNetworks[0],g0=net?.gates?.[0],g1=net?.gates?.[1];if(g0&&g1){gt.x=g1.x+40;gt.y=g1.y;state.entities.projectiles.push({id:state.nextId++,x:g0.x,y:g0.y,vx:300,vy:0,r:4,life:2,max:2,damage:20,color:'#fff',pierce:0,source:'core'});rebuild();updateGateNetworks(.06);}const copies=state.entities.projectiles.filter(p=>p&&p.source==='gate-crossfeed');record('gate',copies.length===1&&Math.abs(copies[0].damage-11)<.001&&copies[0].gateCopy===true,{copies:copies.map(p=>({damage:p.damage,gateCopy:p.gateCopy,targetId:p.homingTargetId}))});
    }catch(error){rows.push({key:'audit-exception',ok:false,details:{message:error?.stack||String(error)}});}
    window.stackfallIsWeaponAwakened=originalAwakened;
    resetGame();showMainMenu();
    return{rows,defined:Object.keys(window.stackfallWeaponAugmentDefs||{})};
  })()`);

  check(result.defined.length===19,'exactly 19 weapon special effects are defined',result.defined);
  for(const row of result.rows)check(row.ok,`weapon augment runtime: ${row.key}`,row.details);
  const expected=['core','blade','ember','bulwark','gravity','comet','prism','chrono','arc','ion','nova','drone','rail','spiral','mirror','vacuum','mine','missile','gate'];
  check(expected.every(key=>result.rows.some(row=>row.key===key&&row.ok)),'all 19 weapon special effects passed a live runtime trigger',result.rows);
  console.log('WEAPON_AUGMENT_RUNTIME_AUDIT PASS');
}finally{
  try{cdp?.close();}catch{}
  try{browser.kill('SIGTERM');}catch{}
  await sleep(100);
  try{server.close();}catch{}
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}
