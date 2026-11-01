import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=process.env.STACKFALL_CHROME||process.env.CHROME_PATH||'/usr/bin/google-chrome';
const profile=mkdtempSync(join(tmpdir(),'stackfall-void-'));
const port=9337;
const child=spawn(chrome,['--headless=new','--no-sandbox',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--mute-audio','--disable-gpu-sandbox','about:blank'],{stdio:['ignore','pipe','pipe']});
let stderr='';child.stderr.on('data',chunk=>stderr+=chunk);

async function endpoint(path,options={},timeout=15000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    try{const r=await fetch(`http://127.0.0.1:${port}${path}`,options);if(r.ok)return r.json();}catch{}
    await sleep(100);
  }
  throw new Error(`CDP endpoint timeout ${path}\n${stderr}`);
}
class Cdp{
  constructor(url){this.id=0;this.pending=new Map();this.errors=[];this.ws=new WebSocket(url);this.ready=new Promise((ok,fail)=>{this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',fail,{once:true});});this.ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.fail(new Error(m.error.message)):p.ok(m.result);return;}if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails?.exception?.description||m.params.exceptionDetails?.text||'page exception');});}
  async send(method,params={}){await this.ready;const id=++this.id;return new Promise((ok,fail)=>{this.pending.set(id,{ok,fail});this.ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(this.pending.delete(id))fail(new Error(`CDP timeout ${method}`));},20000);});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
}

try{
  await endpoint('/json/version');
  const target=await endpoint(`/json/new?${encodeURIComponent('http://127.0.0.1:8000/?dev=1&void-qa=1')}`,{method:'PUT'}),cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready;
  await Promise.all([cdp.send('Runtime.enable'),cdp.send('Page.enable')]);
  const readyStart=Date.now();let ready=false;
  while(Date.now()-readyStart<15000){try{ready=await cdp.eval("document.readyState==='complete'&&typeof stackfallSpawnEliteForm==='function'&&typeof voidBossSkill==='function'&&typeof updatePendingActions==='function'");}catch{}if(ready)break;await sleep(120);}
  if(!ready)throw new Error('Stackfall runtime did not become ready');
  await sleep(1200);
  const result=await cdp.eval(`(()=>{
    GAME_SETTINGS.audio.master=false;
    const forms=['maw','oracle','weaver','grave','paradox'],rows=[];
    const clear=()=>{clearPendingCombatActions();for(const key of ['enemies','projectiles','enemyProjectiles','telegraphs','particles','texts','shockwaves','beams','curves','mapEvents']){const list=state.entities[key];if(Array.isArray(list))list.length=0;}};
    for(const form of forms){
      resetGame();state.mode='playing';clear();player.x=0;player.y=0;player.invuln=999;state.spawnTimer=9999;state.encounterTimer=9999;
      const e=stackfallSpawnEliteForm('void',form);if(!e){rows.push({form,ok:false,error:'spawn failed'});continue;}
      e.x=360;e.y=0;e.skillCd=0;e.burstCd=0;e.pulseCd=0;e.speed=0;
      const twin=nearbyTwin(e);if(twin){e.x=330;e.y=-115;twin.x=330;twin.y=115;twin.skillCd=99;twin.burstCd=99;twin.pulseCd=99;twin.speed=0;}
      if(form==='maw')state.entities.projectiles.push({x:e.x+20,y:e.y,life:3});
      const beforePlayer={x:player.x,y:player.y},beforeTwin=twin?{ax:e.x,ay:e.y,bx:twin.x,by:twin.y}:null;
      voidBossSkill(e,1/60);
      for(let i=0;i<110;i++)updatePendingActions(1/60);
      const voidMinions=state.entities.enemies.filter(x=>x!==e&&x!==twin&&!x.dead&&x.eventKind==='void-minion').length;
      const signature={maw:e.mawHungerStep||0,devoured:e.mawLastDevoured??-1,oracle:e.oracleOmenStep||0,weaver:e.weaverLoomStep||0,grave:e.graveMarkerStep||0,sentinels:e.graveSentinelCount??-1,paradox:e.paradoxBeat||0,swaps:e.paradoxSwapCount||0};
      let ok=true;
      if(form==='maw')ok=signature.maw>=1&&signature.devoured>=1&&e.dash>0&&player.x===beforePlayer.x&&player.y===beforePlayer.y;
      if(form==='oracle')ok=signature.oracle>=1&&state.entities.telegraphs.length>=5;
      if(form==='weaver')ok=signature.weaver>=1&&state.entities.telegraphs.length>=3&&state.entities.enemyProjectiles.length>=4;
      if(form==='grave')ok=signature.grave>=1&&signature.sentinels>=1&&voidMinions<=3&&state.entities.telegraphs.length>=5;
      if(form==='paradox')ok=!!twin&&signature.paradox>=1&&signature.swaps>=1&&Math.abs(e.x-beforeTwin.bx)<.01&&Math.abs(e.y-beforeTwin.by)<.01&&Math.abs(twin.x-beforeTwin.ax)<.01&&Math.abs(twin.y-beforeTwin.ay)<.01;
      ok=ok&&state.entities.telegraphs.length<=entityCap('telegraphs')&&state.entities.enemyProjectiles.length<=entityCap('enemyProjectiles');
      rows.push({form,ok,signature,telegraphs:state.entities.telegraphs.length,enemyProjectiles:state.entities.enemyProjectiles.length,voidMinions,dash:e.dash||0,twin:!!twin,playerMoved:Math.hypot(player.x-beforePlayer.x,player.y-beforePlayer.y)});
    }
    return rows;
  })()`);
  console.log(JSON.stringify(result,null,2));
  if(cdp.errors.length)throw new Error(`page exceptions: ${cdp.errors.join(' | ')}`);
  if(!Array.isArray(result)||result.some(row=>!row.ok))throw new Error('Void Rift targeted browser validation failed');
  cdp.ws.close();
}finally{
  child.kill('SIGTERM');
  rmSync(profile,{recursive:true,force:true});
}
