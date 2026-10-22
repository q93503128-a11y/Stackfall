import {chromium} from 'playwright-core';
import fs from 'node:fs';
fs.mkdirSync('test-results/three-event-qa',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
const check=(value,message)=>{if(!value)throw new Error(message)};
const result={ok:true,errors,checks:{}};
try{
  await page.goto('http://127.0.0.1:8000/?dev=1',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.STACKFALL_WORLD_EVENT_TYPES?.length===3&&window.stackfallDeveloperTest?.enabled,{timeout:15000});
  await page.waitForFunction(()=>document.querySelector('#devEndlessEvent'),{timeout:15000});
  result.checks.canonical=await page.evaluate(()=>({types:[...window.STACKFALL_WORLD_EVENT_TYPES],devOptions:[...document.querySelector('#devEndlessEvent').options].map(o=>o.value),chrono:WEAPONS.chrono.icon,drone:WEAPONS.drone.icon,retiredScript:[...performance.getEntriesByType('resource')].some(e=>e.name.includes('endless-event-refinement.js'))}));
  check(JSON.stringify(result.checks.canonical.types)==='["vault","crash","void"]','canonical event list is not exactly vault/crash/void');
  check(JSON.stringify(result.checks.canonical.devOptions)==='["vault","crash","void"]','developer event selector still contains retired events');
  check(result.checks.canonical.chrono!==result.checks.canonical.drone,'chrono and drone icons are still identical');
  check(result.checks.canonical.drone==='⊛','meteor drone icon patch missing');
  check(result.checks.canonical.retiredScript===false,'retired event refinement script still loads');

  await page.evaluate(()=>window.stackfallDeveloperTest.startEndless());
  await page.waitForTimeout(100);
  result.checks.retired=await page.evaluate(()=>{
    const denied=['distress','meteor','predator','relay','storm'].map(type=>[type,window.stackfallSpawnAuthoredMapEvent(type)]);
    window.updateMapEvents(.016);
    const clocks=Object.fromEntries(['distress','meteor','predator','relay','storm'].map(k=>[k,state.eventClocks?.[k]]));
    return{denied,clocks};
  });
  check(result.checks.retired.denied.every(([,value])=>value===false),'a retired event can still be authored/spawned');
  check(Object.values(result.checks.retired.clocks).every(v=>v===null||v===Infinity),'retired event clocks are still active');

  const spawned=await page.evaluate(()=>window.stackfallSpawnAuthoredMapEvent('crash'));
  check(spawned===true,'crash event failed to spawn');
  await page.evaluate(()=>{const marker=state.entities.mapEvents[0];marker.x=player.x;marker.y=player.y;window.updateMapEvents(.016);});
  await page.waitForFunction(()=>state.mapEventActive?.type==='crash',{timeout:3000});
  await page.evaluate(()=>{
    const ev=state.mapEventActive;
    for(const e of state.entities.enemies||[])if(e?.eventKind==='crash')e.dead=true;
    if(Array.isArray(state.entities.enemies))state.entities.enemies=state.entities.enemies.filter(e=>!e?.dead);
    ev.wave=ev.waves.length-1;ev.remaining=0;ev.between=0;ev.bossId=null;ev.dreadnought=false;
    window.updateMapEvents(.1);
  });
  await page.waitForFunction(()=>state.mode==='worldEvent'&&document.querySelectorAll('#worldEventCards .world-event-card').length>=3,{timeout:3000});
  await page.waitForTimeout(50);
  result.checks.salvage=await page.evaluate(()=>{const cards=[...document.querySelectorAll('#worldEventCards .world-event-card')];const card=cards.find(c=>c.querySelector('b')?.textContent.trim()==='회수 모듈'||c.querySelector('b')?.textContent.trim()==='Recovery Module');return card?{title:card.querySelector('b').textContent.trim(),desc:card.querySelector('p').textContent.trim()}:null;});
  check(!!result.checks.salvage,'recovery module card not found');
  check(!/최대 중첩|non-maxed/i.test(result.checks.salvage.desc),'recovery module still explains the obvious max-stack condition');
  await page.screenshot({path:'test-results/three-event-qa/salvage.png'});
}catch(error){result.ok=false;result.error=String(error.stack||error)}
if(errors.length)result.ok=false;
fs.writeFileSync('test-results/three-event-qa/result.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
await browser.close();
if(!result.ok)process.exit(1);
