import {join} from 'node:path';
import {atrophosRuntimeChecks} from './atrophos-runtime-checks.mjs';

// Uses the existing smoke harness, real animation frames, production dev tools
// and browser keyboard events. Screenshots are evidence, never game assets.
export async function atrophosBrowserQa(page,scenario,{evaluate,capture,waitFor,check,sleep,screenshotDir}){
  const name=page.name;
  const shot=async label=>scenario.screenshots.push(await capture(page,join(screenshotDir,`${name}-${label}.png`)));
  const probe=expr=>evaluate(page,expr);
  const key=async(code,down)=>page.cdp.send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:code.toLowerCase(),code:'Key'+code,windowsVirtualKeyCode:code.charCodeAt(0)});
  const runtime=await probe(`(${atrophosRuntimeChecks.toString()})()`);
  scenario.observations.runtime=runtime;for(const failure of runtime.failures)check(false,failure,name);
  if(process.argv.includes('--atrophos-runtime-only'))return;
  for(const viewport of[{width:1280,height:720},{width:390,height:844}]){
    const tag=`${viewport.width}x${viewport.height}`;
    await page.cdp.send('Emulation.setDeviceMetricsOverride',{...viewport,deviceScaleFactor:1,mobile:false});
    await probe(`(()=>{const api=stackfallDeveloperTest;api.startEndless();api.equipOnly('core',1);api.setCoreLevel(0);api.setLevelUpsDisabled(true);api.setInvincible(true);GAME_SETTINGS.audio.master=false;state.spawnTimer=state.encounterTimer=99999;state.time=.01;document.querySelector('#stackfallDevPanel').classList.add('hidden');api.spawnEndlessApex('chronophage');})()`);
    for(const [label,ms]of[['instability',180],['lower',650],['upper',650],['aligned',650],['misaligned',650]]){await sleep(ms);await shot(`${tag}-intro-${label}`);}
    const opened=await waitFor(page,'!!atrophosEntity()?.atrophos',5000);check(opened,'intro did not open the wrist',name);
    await probe('atrophosEntity().hp=atrophosEntity().maxHp=1e9');
    for(let phase=1;phase<=4;phase++){
      await probe(`(()=>{stackfallDeveloperTest.applyEndlessApexPhase(${phase});const a=atrophosEntity().atrophos;a.cycle=${phase===3?2:phase===2?1:0};})()`);
      await waitFor(page,`atrophosEntity()?.atrophos.phase===${phase}&&atrophosPending(atrophosEntity().atrophos)>0`,5000);
      await sleep(850);await shot(`${tag}-P${phase}-warning`);
      await waitFor(page,"atrophosEntity()?.atrophos.threats.some(t=>t.age>=t.warning&&t.age<t.warning+t.active)",5000,25);
      await shot(`${tag}-P${phase}-active`);
      await sleep(1600);
      const d=await probe('stackfallAtrophosDiagnostics()');scenario.observations[`${tag}-P${phase}`]=d;
      check(d.phase===phase&&d.pending<=2,`P${phase} memory/phase invariant`,name);
      check(d.projection.screenX>=40&&d.projection.screenX<=viewport.width-40&&d.projection.screenY>=100&&d.projection.screenY<=viewport.height-100,'projection left playable screen',name);
    }
    // Actual sustained keyboard movement (including arena edge, not teleports).
    await probe('stackfallDeveloperTest.applyEndlessApexPhase(1);atrophosEntity().atrophos.collisions=0');
    await key('D',true);try{await sleep(10500);}finally{await key('D',false);}
    const moving=await probe('stackfallAtrophosDiagnostics()');scenario.observations[`${tag}-constant-direction`]=moving;
    check(moving.collisions>0,'constant directional input bypassed every attack',name);await shot(`${tag}-constant-direction`);
    // Real frame/input reproduction of dodge then return to a recorded location.
    await probe(`(()=>{player.x=state.apexArena.x;player.y=state.apexArena.y;const e=atrophosEntity(),a=e.atrophos;a.threats.length=a.queue.length=0;a.nextCycle=a.clock+20;a.history=[{x:player.x,y:player.y,t:a.clock-1}];a.collisions=0;atrophosStart(e,{kind:'record',history:true,hold:2.1});})()`);
    await key('D',true);try{await sleep(450);}finally{await key('D',false);}
    await key('A',true);try{await sleep(450);}finally{await key('A',false);}
    await sleep(1350);await shot(`${tag}-return-to-record`);
    const returned=await probe('stackfallAtrophosDiagnostics()');scenario.observations[`${tag}-return`]=returned;check(returned.collisions>0,'return-to-record did not threaten the player',name);
    for(const loadout of[['blade','bulwark','mine'],['missile','comet'],['rail','nova']]){
      await probe(`(()=>{const api=stackfallDeveloperTest;api.equipOnly(${JSON.stringify(loadout[0])},6,true);${loadout.slice(1).map((w,i)=>`api.assignSlot(${i+1},${JSON.stringify(w)});api.setSlotAwakening(${i+1},true);`).join('')}const e=atrophosEntity();e.hp=e.maxHp=1e9;api.applyEndlessApexPhase(4);})()`);
      if(loadout[0]==='blade')for(let attempt=0;attempt<12;attempt++){
        const delta=await probe('({x:atrophosEntity().x-player.x,y:atrophosEntity().y-player.y})');
        if(Math.hypot(delta.x,delta.y)<125)break;
        const direction=Math.abs(delta.x)>Math.abs(delta.y)?delta.x>0?'D':'A':delta.y>0?'S':'W';
        await key(direction,true);try{await sleep(160);}finally{await key(direction,false);}
      }
      const before=await probe('({hp:atrophosEntity().hp,damage:runDamageSnapshot().byWeapon})');await sleep(6500);const after=await probe('({hp:atrophosEntity()?.hp||0,damage:runDamageSnapshot().byWeapon})');
      const byWeapon=Object.fromEntries(loadout.map(w=>[w,(after.damage[w]||0)-(before.damage[w]||0)]));
      check(after.hp<before.hp&&byWeapon[loadout[0]]>0,`${loadout.join('+')} failed to damage wrist in actual combat`,name);scenario.observations[`${tag}-${loadout[0]}-damage`]={total:before.hp-after.hp,byWeapon};await shot(`${tag}-${loadout[0]}`);
    }
    await probe(`(()=>{const api=stackfallDeveloperTest;api.equipOnly('blade',6,true);['missile','prism','rail','mine','vacuum'].forEach((w,i)=>{api.assignSlot(i+1,w);api.setSlotAwakening(i+1,true);});api.setCoreAwakening(true);const e=atrophosEntity();e.hp=e.maxHp=1e9;api.applyEndlessApexPhase(4);})()`);
    const timing=await probe(`new Promise(resolve=>{const times=[],start=performance.now();let prev=start;function sample(now){times.push(now-prev);prev=now;if(now-start<9000)requestAnimationFrame(sample);else{times.sort((a,b)=>a-b);resolve({frames:times.length,mean:times.reduce((a,b)=>a+b,0)/times.length,p95:times[Math.floor(times.length*.95)],max:times.at(-1),loadout:stackfallDeveloperTest.snapshot(),diagnostics:stackfallAtrophosDiagnostics(),runtime:stackfallRuntimeDiagnostics(),performance:stackfallPerformanceDiagnostics(),renderer:stackfallRendererInfo()});}}requestAnimationFrame(sample);})`);
    scenario.observations[`${tag}-six-slot-performance`]=timing;
    check(timing.loadout.weaponSlots.length===6&&Object.values(timing.loadout.awakened).filter(Boolean).length>=6,'stress loadout is not six awakened weapons',name);
    check(timing.runtime.errorCount===0&&timing.p95<80,'six-slot stress runtime/frame-time failure',name);await shot(`${tag}-six-slot-awakened`);
    await probe('killEnemy(atrophosEntity(),{source:"atrophos-qa"})');
    for(const [label,progress]of[['wrist-collapse',.08],['disconnect',.27],['upper-loss',.51],['residue',.80]]){
      await waitFor(page,`state.realmTransition?.owner==='apex-exit'&&state.realmTransition.elapsed/state.realmTransition.duration>=${progress}`,3000,20);
      await shot(`${tag}-death-${label}`);
    }
    await waitFor(page,"!document.querySelector('#apexRewardScreen').classList.contains('hidden')",5000);await shot(`${tag}-reward`);
    const reward=await probe("({mode:state.mode,pending:state.apexExitPending,active:state.apexActiveId,visible:!document.querySelector('#apexRewardScreen').classList.contains('hidden')})");
    scenario.observations[`${tag}-reward`]=reward;check(reward.visible&&!reward.pending&&!reward.active,'death did not reach normal Apex reward',name);
  }
  // Existing other Apex forms retain their production lifecycle and patterns.
  for(const form of['starforge','lastconstellation']){
    await probe(`stackfallDeveloperTest.spawnEndlessApex('${form}')`);await waitFor(page,"!!state.apexActiveId&&state.mode==='playing'",6000);
    await sleep(1800);await shot(`regression-${form}`);const alive=await probe(`state.entities.enemies.some(e=>!e.dead&&e.kind==='apex'&&e.eliteForm==='${form}')`);check(alive,`${form} smoke spawn failed`,name);
    await probe("killEnemy(state.entities.enemies.find(e=>e.id===state.apexActiveId),{source:'atrophos-qa'})");check(await waitFor(page,"!state.apexExitPending&&state.mode!=='cinematic'",5000),`${form} exit failed`,name);
  }
}
