(()=>{
  'use strict';
  const TYPES=new Set(['distress','meteor','predator','relay','storm']);
  const COLORS={distress:'#7ce8ff',meteor:'#ffd06f',predator:'#d47dff',relay:'#70e7ef',storm:'#9fb4ff'};
  const LABELS={
    ko:{distress:'구조 확보',meteor:'채굴 동기화',predator:'포식핵 포화',relay:'중계기 복구',storm:'폭풍의 눈 동기화',remaining:'남은 시간',node:'노드',failed:'작전 실패',stormName:'항성 폭풍의 눈'},
    en:{distress:'RESCUE SECURE',meteor:'MINING SYNC',predator:'CORE SATURATION',relay:'RELAY RECOVERY',storm:'STORM-EYE SYNC',remaining:'TIME',node:'NODE',failed:'EVENT FAILED',stormName:'STELLAR STORM EYE'}
  };
  const lang=()=>GAME_SETTINGS?.language||'ko';
  const tx=key=>(LABELS[lang()]||LABELS.en)[key]||key;
  const distance=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));
  const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
  const fmt=value=>Number(value||0).toFixed(Number(value)>=10?0:1);
  let attempts=0,mounted=false,lastEvent=null,lastTime=0,lastSerial=-1,lastHud='';

  function mount(){
    if(mounted)return;
    const timer=document.querySelector('#worldEventCombatTimer');
    if(!timer||typeof window.drawMapEvents!=='function'){
      if(attempts++<900)requestAnimationFrame(mount);
      return;
    }
    mounted=true;
    const baseDraw=window.drawMapEvents;
    const style=document.createElement('style');
    style.textContent=`
      #worldEventCombatTimer.event-progress-hud{min-width:min(420px,72vw);height:auto;padding:8px 11px 9px;display:grid;grid-template-columns:1fr auto;grid-template-areas:"main time" "bar bar";gap:5px 12px;align-items:center;border-radius:12px;background:linear-gradient(135deg,rgba(3,8,22,.94),rgba(13,18,39,.90));backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.28),0 0 22px color-mix(in srgb,var(--event-refine-color) 12%,transparent)}
      #worldEventCombatTimer.event-progress-hud .event-progress-main{grid-area:main;color:#eef6ff;font-size:10px;font-weight:900;letter-spacing:.055em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #worldEventCombatTimer.event-progress-hud .event-progress-main b{color:var(--event-refine-color);font-size:11px}
      #worldEventCombatTimer.event-progress-hud .event-progress-time{grid-area:time;color:#aab7d1;font-size:9px;font-weight:800;white-space:nowrap}
      #worldEventCombatTimer.event-progress-hud .event-progress-track{grid-area:bar;height:3px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}
      #worldEventCombatTimer.event-progress-hud .event-progress-track i{display:block;height:100%;width:calc(var(--event-refine-progress)*100%);border-radius:inherit;background:var(--event-refine-color);box-shadow:0 0 11px var(--event-refine-color)}
      #worldEventCombatTimer.event-progress-hud.event-outside{border-color:rgba(255,100,126,.48)!important}
      #worldEventCombatTimer.event-progress-hud.event-outside .event-progress-main b{color:#ff8398}
      @media(max-width:760px){#worldEventCombatTimer.event-progress-hud{min-width:min(330px,78vw);padding:7px 9px 8px}#worldEventCombatTimer.event-progress-hud .event-progress-time{font-size:8px}}
    `;
    document.head.appendChild(style);

    function initStorm(ev){
      if(!Number.isFinite(ev.refinedElapsed))ev.refinedElapsed=0;
      if(!Number.isFinite(ev.refinedSafe))ev.refinedSafe=0;
      ev.refinedTargetSafe=28;
      ev.refinedMaxDuration=42;
    }
    function failStorm(ev){
      if(state.mapEventActive!==ev)return;
      if(typeof compactInPlace==='function')compactInPlace(state.entities.enemies,e=>e&&e.eventKind!=='storm');
      state.mapEventActive=null;
      state.entities.mapEvents.length=0;
      timer.classList.add('hidden');
      timer.classList.remove('event-progress-hud','event-outside');
      showBossNotice?.(tx('failed'),tx('stormName'));
      state.eventClocks=state.eventClocks||{};
      state.eventClocks.storm=70+Math.random()*35;
      state.eventGlobalCooldown=Math.max(state.eventGlobalCooldown||0,58);
      state.eventBlockedUntil=state.eventBlockedUntil||{};
      state.eventBlockedUntil.storm=Math.max(state.eventBlockedUntil.storm||0,(state.time||0)+240);
      lastHud='';
    }
    function snapshot(ev){
      if(!ev||!TYPES.has(ev.type))return null;
      const sec=lang()==='ko'?'초':'s';
      if(ev.type==='distress')return{label:tx('distress'),value:ev.hold||0,target:ev.targetHold||11,display:`${fmt(ev.hold)}/${fmt(ev.targetHold||11)}${sec}`,left:Math.max(0,Math.ceil(ev.remainingTime||0)),outside:distance(player,ev.center)>=145};
      if(ev.type==='meteor')return{label:tx('meteor'),value:ev.progress||0,target:ev.target||12,display:`${fmt(ev.progress)}/${fmt(ev.target||12)}`,left:Math.max(0,Math.ceil(ev.remainingTime||0)),outside:distance(player,ev.center)>=155};
      if(ev.type==='predator')return{label:tx('predator'),value:ev.kills||0,target:ev.target||1,display:`${Math.floor(ev.kills||0)}/${Math.floor(ev.target||1)}`,left:Math.max(0,Math.ceil(ev.remainingTime||0)),outside:distance(player,ev.center)>=235};
      if(ev.type==='relay')return{label:`${tx('relay')} · ${tx('node')} ${Math.min(3,(ev.index||0)+1)}/3`,value:ev.hold||0,target:ev.targetHold||2.2,display:`${fmt(ev.hold)}/${fmt(ev.targetHold||2.2)}${sec}`,left:Math.max(0,Math.ceil(ev.remainingTime||0)),outside:distance(player,ev.point)>=78};
      initStorm(ev);
      return{label:tx('storm'),value:ev.refinedSafe,target:ev.refinedTargetSafe,display:`${fmt(ev.refinedSafe)}/${fmt(ev.refinedTargetSafe)}${sec}`,left:Math.max(0,Math.ceil(ev.refinedMaxDuration-ev.refinedElapsed)),outside:distance(player,ev.center)>=118};
    }
    function drawHud(ev){
      const info=snapshot(ev);
      if(!info){timer.classList.remove('event-progress-hud','event-outside');lastHud='';return;}
      const progress=clamp01(info.value/Math.max(.001,info.target));
      const signature=[ev.type,info.label,info.display,info.left,info.outside,Math.round(progress*100)].join('|');
      timer.classList.remove('hidden');
      timer.classList.add('event-progress-hud');
      timer.classList.toggle('event-outside',info.outside);
      timer.style.setProperty('--event-refine-color',COLORS[ev.type]);
      timer.style.setProperty('--event-refine-progress',String(progress));
      if(signature!==lastHud||!timer.querySelector('.event-progress-main')){
        timer.innerHTML=`<span class="event-progress-main">${info.label} · <b>${info.display}</b></span><span class="event-progress-time">${tx('remaining')} ${info.left}${lang()==='ko'?'초':'s'}</span><span class="event-progress-track"><i></i></span>`;
        lastHud=signature;
      }
    }
    function refine(ev,dt){
      if(!ev||!TYPES.has(ev.type)||dt<=0)return;
      if(ev.type==='distress'&&distance(player,ev.center)>=145)ev.hold=Math.max(0,(ev.hold||0)-dt*1.10);
      if(ev.type==='storm'){
        initStorm(ev);
        if(ev.refinedCompleting)return;
        ev.refinedElapsed+=dt;
        const inside=distance(player,ev.center)<118;
        ev.refinedSafe=inside?Math.min(ev.refinedTargetSafe,ev.refinedSafe+dt):Math.max(0,ev.refinedSafe-dt*.42);
        if(ev.refinedSafe>=ev.refinedTargetSafe){ev.refinedCompleting=true;ev.remainingTime=.001;}
        else if(ev.refinedElapsed>=ev.refinedMaxDuration)failStorm(ev);
        else ev.remainingTime=9999;
      }
    }
    function loop(){
      const serial=state.runSerial||0,now=state.time||0;
      if(serial!==lastSerial||now<lastTime){lastSerial=serial;lastTime=now;lastEvent=null;}
      const ev=state.mapEventActive;
      if(ev!==lastEvent){lastEvent=ev;lastTime=now;lastHud='';if(ev?.type==='storm'){initStorm(ev);ev.remainingTime=9999;}}
      const dt=Math.max(0,Math.min(.5,now-lastTime));
      lastTime=now;
      if(ev&&TYPES.has(ev.type)&&state.mode==='playing'){
        refine(ev,dt);
        if(state.mapEventActive===ev)drawHud(ev);
      }
      requestAnimationFrame(loop);
    }

    function ring(point,radius,ratio,color,width=4){
      ctx.save();ctx.translate(point.x,point.y);ctx.rotate(-Math.PI/2);ctx.lineCap='round';ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=width;ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,radius,0,TAU*clamp01(ratio));ctx.stroke();ctx.restore();
    }
    function chevron(x,y,angle,color){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=color;ctx.globalAlpha=.75;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,-7);ctx.lineTo(0,0);ctx.lineTo(-9,7);ctx.stroke();ctx.restore();}
    function relayPoint(origin,index){const a=index*2.21+.4;return{x:origin.x+Math.cos(a)*(150+index*54),y:origin.y+Math.sin(a)*(150+index*54)};}
    function drawExtra(ev){
      const info=snapshot(ev);
      if(!info||typeof worldToScreen!=='function')return;
      const color=COLORS[ev.type];
      ctx.save();ctx.globalCompositeOperation='source-over';
      if(ev.type==='distress'){
        const p=worldToScreen(ev.center.x,ev.center.y);ring(p,154,info.value/info.target,info.outside?'#ff8398':color);
      }else if(ev.type==='meteor'){
        const p=worldToScreen(ev.center.x,ev.center.y),a=ev.angle||0;ring(p,166,info.value/info.target,color,3.5);for(let i=1;i<=3;i++)chevron(p.x-Math.cos(a)*(35+i*20),p.y-Math.sin(a)*(35+i*20),a,color);
      }else if(ev.type==='predator'){
        const p=worldToScreen(ev.center.x,ev.center.y);ring(p,246,info.value/info.target,color,5);ctx.strokeStyle=color;ctx.globalAlpha=.35;ctx.setLineDash([6,10]);ctx.beginPath();ctx.arc(p.x,p.y,205,0,TAU);ctx.stroke();ctx.setLineDash([]);
      }else if(ev.type==='relay'){
        const points=[0,1,2].map(index=>{const world=relayPoint(ev.origin,index);return worldToScreen(world.x,world.y);});
        ctx.strokeStyle='rgba(112,231,239,.25)';ctx.setLineDash([5,8]);ctx.beginPath();points.forEach((p,index)=>index?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);
        points.forEach((p,index)=>{const alpha=index<ev.index?1:(index===ev.index?0.86:0.22);ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,12+index*2,0,TAU);ctx.stroke();});
        const active=points[Math.min(2,ev.index||0)];ring(active,88,info.value/info.target,color,3);
      }else if(ev.type==='storm'){
        const p=worldToScreen(ev.center.x,ev.center.y);ring(p,130,info.value/info.target,info.outside?'#ff8398':color,4.5);
        if(info.outside){const me=worldToScreen(player.x,player.y),a=Math.atan2(p.y-me.y,p.x-me.x);ctx.strokeStyle='rgba(255,131,152,.55)';ctx.setLineDash([4,8]);ctx.beginPath();ctx.moveTo(me.x,me.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);chevron(me.x+Math.cos(a)*44,me.y+Math.sin(a)*44,a,'#ff8398');}
      }
      ctx.restore();
    }
    window.drawMapEvents=function refinedDrawMapEvents(){const result=baseDraw();drawExtra(state.mapEventActive);return result;};
    window.stackfallEndlessEventRefinement={mounted:true,snapshot:()=>snapshot(state.mapEventActive)};
    lastSerial=state.runSerial||0;lastTime=state.time||0;requestAnimationFrame(loop);
  }
  mount();
})();
