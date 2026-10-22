(()=>{
  'use strict';

  const FIELD_TYPES=new Set(['distress','meteor','predator','relay','storm']);
  const TYPE_GAP={distress:165,meteor:175,predator:210,relay:225,storm:240};
  const COLORS={distress:'#7ce8ff',meteor:'#ffd06f',predator:'#d47dff',relay:'#70e7ef',storm:'#9fb4ff'};
  const LABELS={
    ko:{distress:'구조 확보',meteor:'채굴 동기화',predator:'포식핵 포화',relay:'중계기 복구',storm:'폭풍의 눈 동기화',remaining:'남은 시간',node:'노드',failed:'작전 실패',stormName:'항성 폭풍의 눈'},
    en:{distress:'RESCUE SECURE',meteor:'MINING SYNC',predator:'CORE SATURATION',relay:'RELAY RECOVERY',storm:'STORM-EYE SYNC',remaining:'TIME',node:'NODE',failed:'EVENT FAILED',stormName:'STELLAR STORM EYE'}
  };
  const lang=()=>GAME_SETTINGS?.language||'ko';
  const text=key=>(LABELS[lang()]||LABELS.en)[key]||key;
  const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
  const fmt=value=>Number(value||0).toFixed(value>=10?0:1);
  const random=(min,max)=>min+Math.random()*(max-min);
  const distance=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));

  let attempts=0,mounted=false,lastHudSignature='';
  function mount(){
    if(mounted)return;
    if(typeof window.updateMapEvents!=='function'||typeof window.drawMapEvents!=='function'||!document.querySelector('#worldEventCombatTimer')){
      if(attempts++<900)requestAnimationFrame(mount);
      return;
    }
    mounted=true;

    const style=document.createElement('style');
    style.textContent=`
      #worldEventCombatTimer.event-progress-hud{min-width:min(420px,72vw);height:auto;padding:8px 11px 9px;display:grid;grid-template-columns:1fr auto;grid-template-areas:"main time" "bar bar";gap:5px 12px;align-items:center;border-radius:12px;backdrop-filter:blur(8px);background:linear-gradient(135deg,rgba(3,8,22,.92),rgba(13,18,39,.88));box-shadow:0 10px 30px rgba(0,0,0,.28),0 0 22px color-mix(in srgb,var(--event-refine-color) 12%,transparent)}
      #worldEventCombatTimer.event-progress-hud .event-progress-main{grid-area:main;color:#eef6ff;font-size:10px;font-weight:900;letter-spacing:.055em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #worldEventCombatTimer.event-progress-hud .event-progress-main b{color:var(--event-refine-color);font-size:11px}
      #worldEventCombatTimer.event-progress-hud .event-progress-time{grid-area:time;color:#aab7d1;font-size:9px;font-weight:800;white-space:nowrap}
      #worldEventCombatTimer.event-progress-hud .event-progress-track{grid-area:bar;display:block;height:3px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
      #worldEventCombatTimer.event-progress-hud .event-progress-track i{display:block;width:calc(var(--event-refine-progress) * 100%);height:100%;border-radius:inherit;background:var(--event-refine-color);box-shadow:0 0 11px var(--event-refine-color);transition:width .10s linear}
      #worldEventCombatTimer.event-progress-hud.event-outside{border-color:rgba(255,100,126,.48)!important;box-shadow:0 10px 30px rgba(0,0,0,.30),0 0 22px rgba(255,85,115,.13)}
      #worldEventCombatTimer.event-progress-hud.event-outside .event-progress-main b{color:#ff8398}
      @media(max-width:760px){#worldEventCombatTimer.event-progress-hud{min-width:min(330px,78vw);padding:7px 9px 8px;gap:4px 8px}#worldEventCombatTimer.event-progress-hud .event-progress-main{font-size:9px}#worldEventCombatTimer.event-progress-hud .event-progress-time{font-size:8px}}
    `;
    document.head.appendChild(style);

    const timer=document.querySelector('#worldEventCombatTimer');
    const baseUpdate=window.updateMapEvents;
    const baseDraw=window.drawMapEvents;

    function resetStormTracking(ev){
      if(!ev||ev.type!=='storm')return;
      if(!Number.isFinite(ev.refinedElapsed))ev.refinedElapsed=0;
      if(!Number.isFinite(ev.refinedSafe))ev.refinedSafe=0;
      if(!Number.isFinite(ev.refinedOutside))ev.refinedOutside=0;
      ev.refinedTargetSafe=28;
      ev.refinedMaxDuration=42;
    }

    function failStorm(ev){
      if(state.mapEventActive!==ev)return;
      if(typeof compactInPlace==='function')compactInPlace(state.entities.enemies,e=>e&&e.eventKind!=='storm');
      else state.entities.enemies=state.entities.enemies.filter(e=>e&&e.eventKind!=='storm');
      state.mapEventActive=null;
      if(Array.isArray(state.entities.mapEvents))state.entities.mapEvents.length=0;
      timer.classList.add('hidden');timer.classList.remove('event-progress-hud','event-outside');
      if(typeof showBossNotice==='function')showBossNotice(text('failed'),text('stormName'));
      state.eventClocks=state.eventClocks||{};state.eventClocks.storm=random(70,105);
      state.eventGlobalCooldown=Math.max(Number(state.eventGlobalCooldown)||0,58);
      state.eventBlockedUntil=state.eventBlockedUntil||{};
      state.eventBlockedUntil.storm=Math.max(Number(state.eventBlockedUntil.storm)||0,(state.time||0)+TYPE_GAP.storm);
      lastHudSignature='';
    }

    function preUpdate(ev,dt){
      if(!ev||!FIELD_TYPES.has(ev.type)||!Number.isFinite(dt)||dt<=0)return{outside:false};
      if(ev.type==='distress'){
        const outside=distance(player,ev.center)>=145;
        return{outside};
      }
      if(ev.type==='storm'){
        resetStormTracking(ev);
        const inside=distance(player,ev.center)<118;
        ev.refinedElapsed+=dt;
        if(inside){ev.refinedSafe=Math.min(ev.refinedTargetSafe,ev.refinedSafe+dt);ev.refinedOutside=Math.max(0,ev.refinedOutside-dt*.8);}
        else{ev.refinedOutside+=dt;ev.refinedSafe=Math.max(0,ev.refinedSafe-dt*.42);}
        if(ev.refinedSafe>=ev.refinedTargetSafe){ev.remainingTime=Math.min(Number(ev.remainingTime)||dt,dt*.45);return{outside:false,stormComplete:true};}
        if(ev.refinedElapsed>=ev.refinedMaxDuration){failStorm(ev);return{outside:true,stormFailed:true};}
        ev.remainingTime=Math.max(dt*2,ev.refinedMaxDuration-ev.refinedElapsed+dt);
        return{outside:!inside};
      }
      return{outside:false};
    }

    function postUpdate(before,ev,dt){
      if(before?.stormFailed||!ev||state.mapEventActive!==ev)return;
      if(ev.type==='distress'&&before?.outside)ev.hold=Math.max(0,(Number(ev.hold)||0)-dt*1.10);
    }

    function progressSnapshot(ev){
      if(!ev||!FIELD_TYPES.has(ev.type))return null;
      const remaining=Math.max(0,Math.ceil(Number(ev.remainingTime)||0));
      const sec=lang()==='ko'?'초':'s';
      if(ev.type==='distress')return{label:text('distress'),value:Number(ev.hold)||0,target:Number(ev.targetHold)||11,display:`${fmt(ev.hold)} / ${fmt(ev.targetHold||11)}${sec}`,remaining,outside:distance(player,ev.center)>=145};
      if(ev.type==='meteor')return{label:text('meteor'),value:Number(ev.progress)||0,target:Number(ev.target)||12,display:`${fmt(ev.progress)} / ${fmt(ev.target||12)}`,remaining,outside:distance(player,ev.center)>=155};
      if(ev.type==='predator')return{label:text('predator'),value:Number(ev.kills)||0,target:Number(ev.target)||1,display:`${Math.floor(ev.kills||0)} / ${Math.floor(ev.target||1)}`,remaining,outside:distance(player,ev.center)>=235};
      if(ev.type==='relay')return{label:`${text('relay')} · ${text('node')} ${Math.min(3,(Number(ev.index)||0)+1)}/3`,value:Number(ev.hold)||0,target:Number(ev.targetHold)||2.2,display:`${fmt(ev.hold)} / ${fmt(ev.targetHold||2.2)}${sec}`,remaining,outside:distance(player,ev.point)>=78};
      resetStormTracking(ev);return{label:text('storm'),value:Number(ev.refinedSafe)||0,target:Number(ev.refinedTargetSafe)||28,display:`${fmt(ev.refinedSafe)} / ${fmt(ev.refinedTargetSafe||28)}${sec}`,remaining:Math.max(0,Math.ceil((ev.refinedMaxDuration||42)-(ev.refinedElapsed||0))),outside:distance(player,ev.center)>=118};
    }

    function renderProgressHud(ev){
      const snap=progressSnapshot(ev);
      if(!snap){timer.classList.remove('event-progress-hud','event-outside');lastHudSignature='';return;}
      const progress=clamp01(snap.value/Math.max(.001,snap.target));
      const signature=[ev.type,snap.label,snap.display,snap.remaining,snap.outside,Math.round(progress*100)].join('|');
      timer.classList.add('event-progress-hud');timer.classList.toggle('event-outside',snap.outside);
      timer.style.setProperty('--event-refine-color',COLORS[ev.type]||'#9fb4ff');
      timer.style.setProperty('--event-refine-progress',String(progress));
      if(signature!==lastHudSignature){
        timer.innerHTML=`<span class="event-progress-main">${snap.label} · <b>${snap.display}</b></span><span class="event-progress-time">${text('remaining')} ${snap.remaining}${lang()==='ko'?'초':'s'}</span><span class="event-progress-track"><i></i></span>`;
        lastHudSignature=signature;
      }
    }

    window.updateMapEvents=function refinedMapEventUpdate(dt){
      const ev=state.mapEventActive;
      const before=preUpdate(ev,dt);
      if(before?.stormFailed)return;
      const result=baseUpdate(dt);
      if(ev&&state.mapEventActive===ev)postUpdate(before,ev,dt);
      renderProgressHud(state.mapEventActive);
      return result;
    };

    function arcProgress(p,r,progress,color,width=4,start=-Math.PI/2){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(start);ctx.lineCap='round';
      ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=width;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2*clamp01(progress));ctx.stroke();ctx.restore();
    }
    function drawChevron(x,y,a,color,scale=1){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeStyle=color;ctx.globalAlpha=.72;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9*scale,-7*scale);ctx.lineTo(0,0);ctx.lineTo(-9*scale,7*scale);ctx.stroke();ctx.restore();}
    function relayWorldPoint(origin,index){const a=index*2.21+.4;return{x:origin.x+Math.cos(a)*(150+index*54),y:origin.y+Math.sin(a)*(150+index*54)};}

    function drawRefinedField(ev){
      if(!ev||!FIELD_TYPES.has(ev.type)||typeof worldToScreen!=='function')return;
      const snap=progressSnapshot(ev),color=COLORS[ev.type]||'#9fb4ff';if(!snap)return;
      ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineWidth=2;
      if(ev.type==='distress'){
        const p=worldToScreen(ev.center.x,ev.center.y),inside=!snap.outside;arcProgress(p,154,snap.value/snap.target,inside?color:'#ff8398',4);
        ctx.translate(p.x,p.y);ctx.rotate(performance.now()/2100);ctx.strokeStyle=color;ctx.globalAlpha=.5;for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(118,-10);ctx.lineTo(136,0);ctx.lineTo(118,10);ctx.stroke();}
      }else if(ev.type==='meteor'){
        const p=worldToScreen(ev.center.x,ev.center.y);arcProgress(p,166,snap.value/snap.target,color,3.5);
        const a=Number(ev.angle)||0;for(let i=1;i<=3;i++){const d=36+i*20;drawChevron(p.x-Math.cos(a)*d,p.y-Math.sin(a)*d,a,color,.72+i*.08);}
      }else if(ev.type==='predator'){
        const p=worldToScreen(ev.center.x,ev.center.y);arcProgress(p,246,snap.value/snap.target,color,5);
        ctx.translate(p.x,p.y);ctx.strokeStyle=color;ctx.globalAlpha=.42;ctx.setLineDash([6,10]);ctx.beginPath();ctx.arc(0,0,205+Math.sin(performance.now()/330)*7,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      }else if(ev.type==='relay'){
        const points=[0,1,2].map(i=>{const world=relayWorldPoint(ev.origin,i);return worldToScreen(world.x,world.y);});
        ctx.strokeStyle='rgba(112,231,239,.24)';ctx.setLineDash([5,8]);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);
        points.forEach((p,i)=>{ctx.globalAlpha=i<ev.index?1:(i===ev.index?.86:.22);ctx.strokeStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,11+i*2,0,Math.PI*2);ctx.stroke();});
        const active=points[Math.min(2,Number(ev.index)||0)];if(active)arcProgress(active,88,snap.value/snap.target,color,3);
      }else if(ev.type==='storm'){
        const p=worldToScreen(ev.center.x,ev.center.y),inside=!snap.outside;arcProgress(p,130,snap.value/snap.target,inside?color:'#ff8398',4.5);
        if(!inside){const pp=worldToScreen(player.x,player.y),a=Math.atan2(p.y-pp.y,p.x-pp.x);ctx.strokeStyle='rgba(255,131,152,.55)';ctx.setLineDash([4,8]);ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);drawChevron(pp.x+Math.cos(a)*44,pp.y+Math.sin(a)*44,a,'#ff8398',1.1);}
      }
      ctx.restore();
    }

    window.drawMapEvents=function refinedMapEventDraw(){const result=baseDraw();drawRefinedField(state.mapEventActive);return result;};
    window.stackfallEndlessEventRefinement={
      mounted:true,
      snapshot:()=>{const ev=state.mapEventActive;return{type:ev?.type||null,progress:progressSnapshot(ev),storm:ev?.type==='storm'?{elapsed:ev.refinedElapsed||0,safe:ev.refinedSafe||0,target:ev.refinedTargetSafe||28}:null};}
    };
  }
  mount();
})();
