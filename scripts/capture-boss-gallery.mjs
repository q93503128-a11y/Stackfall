import {spawn} from 'node:child_process';
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const outDir=resolve('test-results/boss-gallery');
mkdirSync(outDir,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'stackfall-boss-gallery-'));
const port=9333;
const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
const browser=spawn(chrome,[
  '--headless=new',`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${profile}`,'--window-size=1920,1080','--force-device-scale-factor=1',
  '--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows',
  '--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check',
  '--no-sandbox','--disable-dev-shm-usage','about:blank'
],{stdio:'ignore'});

async function endpoint(path,options={}){
  for(let i=0;i<120;i++){
    try{const r=await fetch(`http://127.0.0.1:${port}${path}`,options);if(r.ok)return r.json();}catch{}
    await sleep(100);
  }
  throw new Error(`CDP endpoint timeout: ${path}`);
}
class Cdp{
  constructor(url){this.id=0;this.pending=new Map();this.ready=new Promise((ok,fail)=>{this.ws=new WebSocket(url);this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);});});}
  async send(method,params={}){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{this.pending.set(id,{ok,fail});this.ws.send(JSON.stringify({id,method,params}));});}
  close(){this.ws?.close();}
}
async function evaluate(cdp,expression){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function capture(cdp,name){const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const path=join(outDir,name);writeFileSync(path,Buffer.from(r.data,'base64'));console.log(path);}
async function waitFor(cdp,expression){for(let i=0;i<100;i++){try{if(await evaluate(cdp,expression))return;}catch{}await sleep(100);}throw new Error(`waitFor timeout: ${expression}`);}

const categories={
  mini:{title:'STACKFALL · 중간 보스',forms:['knight','warden','executioner','colossus','harvester','mirror'],cols:3,scale:2.15},
  boss:{title:'STACKFALL · 보스',forms:['eclipse','seraph','pulsar','leviathan','archivist','heliarch','tempest','nullengine'],cols:4,scale:1.85},
  apex:{title:'STACKFALL · 초월체',forms:['chronophage','starforge','lastconstellation'],cols:3,scale:1.55}
};

function galleryExpression(kind,cfg){
  return `(()=>{
    GAME_SETTINGS.audio.master=false;
    state.runSelection={mode:'endless',stageId:null};
    resetGame();
    window.stackfallDevInvincible=true;
    state.xp=0;state.xpNeed=1e30;state.spawnTimer=1e9;state.encounterTimer=1e9;
    state.weaponSlots=[];state.weaponStacks={};state.awakenedWeapons={};player.coreCd=1e9;player.invuln=1e9;
    for(const value of Object.values(state.entities||{}))if(Array.isArray(value))value.length=0;
    state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;state.apexArena=null;
    const old=document.getElementById('stackfallBossGalleryOverlay');if(old)old.remove();
    const overlay=document.createElement('div');overlay.id='stackfallBossGalleryOverlay';overlay.style.cssText='position:fixed;inset:0;z-index:900;pointer-events:none;font-family:IBM Plex Sans KR,sans-serif;color:#eef7ff;text-shadow:0 2px 8px #000,0 0 14px #000';document.body.appendChild(overlay);
    const title=document.createElement('div');title.textContent=${JSON.stringify(cfg.title)};title.style.cssText='position:absolute;left:0;right:0;top:24px;text-align:center;font-size:29px;font-weight:900;letter-spacing:.08em';overlay.appendChild(title);
    const forms=${JSON.stringify(cfg.forms)},cols=${cfg.cols},rows=Math.ceil(forms.length/${cfg.cols});
    const xPad=${kind==='boss'?235:kind==='mini'?300:330},yTop=${kind==='apex'?285:285},yBottom=${kind==='apex'?285:760};
    const xs=Array.from({length:cols},(_,i)=>cols===1?960:xPad+i*((1920-xPad*2)/(cols-1)));
    const ys=Array.from({length:rows},(_,i)=>rows===1?yTop:yTop+i*((yBottom-yTop)/(rows-1)));
    const spawned=[];
    forms.forEach((form,index)=>{
      const e=window.stackfallSpawnEliteForm(${JSON.stringify(kind)},form);if(!e)return;
      const col=index%cols,row=Math.floor(index/cols),sx=xs[col],sy=ys[row];
      e.x=player.x+(sx-vw/2);e.y=player.y+(sy-vh/2);e.speed=0;e.damage=0;e.hp=e.maxHp=Math.max(e.maxHp||1,1e30);e.r*=${cfg.scale};e.skillCd=e.burstCd=e.pulseCd=e.signatureCd=e.apexVariantCd=e.apexSetpieceCd=1e9;e.attackLockUntil=1e12;e.contactSafeUntil=1e12;e.dead=false;e.hit=0;
      spawned.push({form,name:bossDisplayName(e),sx,sy,r:e.r});
      const label=document.createElement('div');label.textContent=bossDisplayName(e);label.style.cssText='position:absolute;transform:translate(-50%,0);text-align:center;font-size:18px;font-weight:900;white-space:nowrap;color:#f4f8ff;background:rgba(3,7,19,.64);border:1px solid rgba(170,205,255,.20);border-radius:10px;padding:5px 10px;backdrop-filter:blur(4px)';label.style.left=sx+'px';label.style.top=(sy+Math.max(58,e.r*1.25))+'px';overlay.appendChild(label);
    });
    const dev=document.getElementById('stackfallDevPanel');if(dev)dev.classList.add('hidden');const toggle=document.getElementById('stackfallDevToggle');if(toggle)toggle.style.display='none';
    for(const id of ['pauseOverlay','levelup','gameover','bossReward'])document.getElementById(id)?.classList.add('hidden');
    return spawned;
  })()`;
}

let cdp=null;
try{
  const target=await endpoint(`/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'});cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable')]);
  const loaded=new Promise(ok=>{const h=e=>{if(e.method==='Page.loadEventFired')ok();};});
  await cdp.send('Page.navigate',{url:'https://stackfall.pages.dev/?dev=1&boss-gallery=1'});
  await sleep(5500);
  await waitFor(cdp,"typeof window.stackfallSpawnEliteForm==='function' && typeof resetGame==='function' && typeof bossDisplayName==='function'");
  for(const [kind,cfg] of Object.entries(categories)){
    const spawned=await evaluate(cdp,galleryExpression(kind,cfg));
    console.log(kind,spawned);
    await sleep(650);
    await capture(cdp,`${kind}.png`);
  }
}finally{
  cdp?.close();
  if(browser.exitCode===null)browser.kill('SIGTERM');
  await sleep(500);
  rmSync(profile,{recursive:true,force:true});
}
