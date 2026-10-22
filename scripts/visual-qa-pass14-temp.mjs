import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const root=process.cwd();
const outDir=resolve(root,'test-results/visual-pass14');
mkdirSync(outDir,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'stackfall-visual-qa-'));
const port=9224;
const chrome=spawn('/usr/bin/google-chrome',[
  '--headless=new',`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${profile}`,'--no-sandbox','--disable-dev-shm-usage','--disable-background-timer-throttling',
  '--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--autoplay-policy=no-user-gesture-required',
  '--mute-audio','--no-first-run','--no-default-browser-check','about:blank'
],{stdio:['ignore','pipe','pipe']});
let chromeErr='';chrome.stderr.on('data',d=>chromeErr+=String(d));

async function json(path,opts={}){for(let i=0;i<120;i++){try{const r=await fetch(`http://127.0.0.1:${port}${path}`,opts);if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error(`Chrome endpoint timeout ${path}\n${chromeErr.slice(-2000)}`);}
class Cdp{
  constructor(url){this.id=0;this.pending=new Map();this.listeners=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);return;}for(const fn of this.listeners.get(m.method)||[])fn(m.params);});});}
  async send(method,params={}){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{this.pending.set(id,{ok,fail});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{const p=this.pending.get(id);if(p){this.pending.delete(id);fail(new Error(`CDP timeout ${method}`));}},20000);});}
  on(method,fn){const a=this.listeners.get(method)||[];a.push(fn);this.listeners.set(method,a);}
  close(){this.ws?.close();}
}
async function evalJs(cdp,expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(cdp,expression,timeout=12000){const t=Date.now();while(Date.now()-t<timeout){if(await evalJs(cdp,expression))return true;await sleep(120);}return false;}
async function viewport(cdp,width,height,dpr=1,mobile=false){await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile,screenWidth:width,screenHeight:height});await evalJs(cdp,"window.dispatchEvent(new Event('resize')); true");await sleep(350);}
async function shot(cdp,name){const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});writeFileSync(join(outDir,`${name}.png`),Buffer.from(r.data,'base64'));}
async function inspect(cdp,label){return evalJs(cdp,`(()=>{const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>1&&r.height>1};const root=document.documentElement;const selectors=['#hud','#bossBar','#bossExtras','#choiceScreen','#pauseScreen','#gameOverScreen','#menu','.hud','.boss-bar'];const overflow=[];for(const sel of selectors){for(const e of document.querySelectorAll(sel)){if(!visible(e))continue;const r=e.getBoundingClientRect();if(r.left<-2||r.right>innerWidth+2||r.top<-2||r.bottom>innerHeight+2)overflow.push({sel,id:e.id,cls:e.className,left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),bottom:Math.round(r.bottom)});}}return{label,mode:state?.mode,viewport:[innerWidth,innerHeight],scroll:[root.scrollWidth,root.scrollHeight],overflow,canvas:document.querySelectorAll('canvas').length,bossHidden:ui?.bossBar?.classList.contains('hidden'),bossName:ui?.bossName?.textContent||'',bossExtras:ui?.bossExtras?.children?.length||0,hp:ui?.hpText?.textContent||'',timer:ui?.timer?.textContent||'',level:ui?.level?.textContent||'',combo:ui?.comboText?.textContent||''};})()`);}

const report={startedAt:new Date().toISOString(),url:'https://stackfall.pages.dev/?dev=1',screenshots:[],observations:[],consoleErrors:[],exceptions:[],hudMutation:null};
let cdp,target;
try{
  await json('/json/version');
  target=await json(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'});cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  cdp.on('Runtime.consoleAPICalled',e=>{if(e.type==='error')report.consoleErrors.push(e.args.map(a=>String(a.value??a.description??'')).join(' '));});
  cdp.on('Runtime.exceptionThrown',e=>report.exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'unknown'));
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);
  await viewport(cdp,1920,1080,1,false);
  await cdp.send('Page.navigate',{url:report.url});
  if(!await waitFor(cdp,"document.readyState==='complete'&&window.stackfallDeveloperTest?.enabled===true",15000))throw new Error('dev runtime did not become ready');
  if(!await waitFor(cdp,"typeof window.stackfallDeveloperTest?.spawnEndlessElite==='function'",10000))throw new Error('endless dev tools did not mount');
  await evalJs(cdp,"GAME_SETTINGS.audio.master=false; true");
  await sleep(1200);
  await shot(cdp,'01-desktop-menu');report.screenshots.push('01-desktop-menu.png');report.observations.push(await inspect(cdp,'desktop-menu'));

  await evalJs(cdp,"window.stackfallDeveloperTest.startEndless(); true");await sleep(1200);
  await evalJs(cdp,"state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');updateHUD(); true");
  await shot(cdp,'02-desktop-endless');report.screenshots.push('02-desktop-endless.png');report.observations.push(await inspect(cdp,'desktop-endless'));

  report.hudMutation=await evalJs(cdp,`(()=>{player.maxHp=120;player.hp=73;player.shield=17;state.xp=45;state.xpNeed=100;state.level=8;state.time=125.4;state.combo=7;state.comboTimer=1.15;updateHUD();return{hp:ui.hpText.textContent,hpWidth:ui.hpBar.style.width,xpWidth:ui.xpBar.style.width,level:ui.level.textContent,timer:ui.timer.textContent,combo:ui.comboText.textContent,comboActive:ui.comboBox.classList.contains('active')};})()`);
  await shot(cdp,'03-desktop-hud-mutated');report.screenshots.push('03-desktop-hud-mutated.png');report.observations.push(await inspect(cdp,'desktop-hud-mutated'));

  await evalJs(cdp,`(()=>{window.stackfallDeveloperTest.spawnEndlessElite('mini','mirror');const add=(cat,form,dx,dy)=>{const e=window.stackfallSpawnEliteForm?.(cat,form);if(e){e.x=player.x+dx;e.y=player.y+dy;}return e?.id||null;};add('boss','eclipse',290,-70);add('boss','pulsar',250,95);updateHUD();return true;})()`);await sleep(650);
  await shot(cdp,'04-desktop-multi-boss');report.screenshots.push('04-desktop-multi-boss.png');report.observations.push(await inspect(cdp,'desktop-multi-boss'));

  await evalJs(cdp,`(()=>{window.stackfallDeveloperTest.startEndless();state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');state.xp=0;state.xpNeed=1e9;state.spawnTimer=9999;state.encounterTimer=9999;player.invuln=9999;state.weaponStacks={core:6,blade:6,ember:6,gravity:6,bulwark:6,comet:6,prism:6,arc:6,chrono:6,ion:6,nova:6,drone:6,rail:6,spiral:6,mirror:6};state.weaponSlots=['prism','arc','gravity','ion','rail','mirror'];for(const list of Object.values(state.entities))if(Array.isArray(list))list.length=0;for(let i=0;i<64;i++){spawnEnemy('normal');const e=state.entities.enemies[state.entities.enemies.length-1];const a=i/64*TAU,d=150+(i%8)*42;e.x=player.x+Math.cos(a)*d;e.y=player.y+Math.sin(a)*d;e.speed=0;e.damage=0;e.hp=e.maxHp=1e7;}updateHUD();return true;})()`);await sleep(2200);
  await shot(cdp,'05-desktop-dense-combat');report.screenshots.push('05-desktop-dense-combat.png');report.observations.push(await inspect(cdp,'desktop-dense-combat'));

  await viewport(cdp,1280,720,1,false);await sleep(500);await shot(cdp,'06-laptop-dense-combat');report.screenshots.push('06-laptop-dense-combat.png');report.observations.push(await inspect(cdp,'laptop-dense-combat'));

  await evalJs(cdp,"showMainMenu(); true");await viewport(cdp,390,844,2,true);await sleep(650);await shot(cdp,'07-mobile-menu');report.screenshots.push('07-mobile-menu.png');report.observations.push(await inspect(cdp,'mobile-menu'));
  await evalJs(cdp,"window.stackfallDeveloperTest.startEndless(); true");await sleep(950);await evalJs(cdp,"state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;state.mode='playing';ui.choice?.classList.add('hidden');updateHUD(); true");
  await shot(cdp,'08-mobile-endless');report.screenshots.push('08-mobile-endless.png');report.observations.push(await inspect(cdp,'mobile-endless'));
  await evalJs(cdp,`(()=>{window.stackfallDeveloperTest.spawnEndlessElite('mini','mirror');const e=window.stackfallSpawnEliteForm?.('boss','eclipse');if(e){e.x=player.x+210;e.y=player.y-80;}updateHUD();return true;})()`);await sleep(700);
  await shot(cdp,'09-mobile-multi-boss');report.screenshots.push('09-mobile-multi-boss.png');report.observations.push(await inspect(cdp,'mobile-multi-boss'));
  await evalJs(cdp,"openChoices(); true");await sleep(450);await shot(cdp,'10-mobile-level-choice');report.screenshots.push('10-mobile-level-choice.png');report.observations.push(await inspect(cdp,'mobile-level-choice'));

  report.ok=report.consoleErrors.length===0&&report.exceptions.length===0&&report.observations.every(o=>o.scroll[0]<=o.viewport[0]+2&&o.overflow.length===0)&&report.hudMutation?.hp==='73 / 120 +17'&&report.hudMutation?.timer==='02:05'&&report.hudMutation?.level==='8'&&report.hudMutation?.combo==='7'&&report.hudMutation?.comboActive===true;
}catch(error){report.ok=false;report.error=String(error.stack||error);}finally{
  report.endedAt=new Date().toISOString();writeFileSync(join(outDir,'report.json'),`${JSON.stringify(report,null,2)}\n`);
  try{cdp?.close();}catch{}try{chrome.kill('SIGTERM');}catch{}await sleep(300);try{rmSync(profile,{recursive:true,force:true});}catch{}
}
if(!report.ok){console.error(JSON.stringify(report,null,2));process.exitCode=1;}else console.log(JSON.stringify(report,null,2));
