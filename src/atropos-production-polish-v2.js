// Chronophage production polish v2.
// Presentation-only follow-up: fixed boss anchor, larger arena, clearer clock fields,
// grayscale P4 time stop, and a continuously accelerating/reversing P4 clock body.
(()=>{
  if(window.stackfallAtroposProductionPolish==='v2')return;
  window.stackfallAtroposProductionPolish='v2';

  const FORM='chronophage';
  const DESKTOP_ARENA=663,COMPACT_ARENA=440,P4_HAND_STEP=.30;
  const isAtropos=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const arenaRadius=()=>compactDevice()?COMPACT_ARENA:DESKTOP_ARENA;
  const screenPoint=(x,y)=>({x:x-player.x+vw/2,y:y-player.y+vh/2});

  function lockAtropos(e){
    if(!isAtropos(e))return;
    const r=e.atroposReborn;
    if(r){
      if(!Number.isFinite(r.anchorX))r.anchorX=e.x;
      if(!Number.isFinite(r.anchorY))r.anchorY=e.y;
      e.x=r.anchorX;e.y=r.anchorY;e.speed=0;
    }else{
      if(!e.atroposPolishAnchor)e.atroposPolishAnchor={x:e.x,y:e.y};
      e.x=e.atroposPolishAnchor.x;e.y=e.atroposPolishAnchor.y;e.speed=0;
    }
    e.contactSafeUntil=Math.max(Number(e.contactSafeUntil)||0,(state.time||0)+.12);
  }
  function expandArena(e){
    if(!isAtropos(e))return null;
    const target=arenaRadius();
    let arena=state.apexArena;
    if(!arena||arena.form!==FORM){arena={x:e.x,y:e.y,r:target,form:FORM,createdAt:state.time||0};state.apexArena=arena;}
    arena.x=e.x;arena.y=e.y;arena.r=Math.max(target,Number(arena.r)||0);
    return arena;
  }

  const baseApexBossSkill=typeof apexBossSkill==='function'?apexBossSkill:null;
  if(baseApexBossSkill){
    apexBossSkill=function apexBossSkillWithAtroposPolish(e,dt){
      if(!isAtropos(e))return baseApexBossSkill(e,dt);
      lockAtropos(e);expandArena(e);
      const result=baseApexBossSkill(e,dt);
      lockAtropos(e);expandArena(e);
      if((e.apexPhase||1)>=4&&e.atroposClockHand?.active&&!e.atroposClockHand.offTimer&&!e.atroposClockHand.breakAfter&&e.atroposClockHand.stepTimer>P4_HAND_STEP)e.atroposClockHand.stepTimer=P4_HAND_STEP;
      return result;
    };
  }

  function drawClockFieldFace(field){
    const p=screenPoint(field.x,field.y),warning=field.age<field.warn,active=!warning&&field.age<field.total;
    if(!warning&&!active)return;
    const phase=field.phase||3,r=field.r,q=warning?clamp(field.age/Math.max(.001,field.warn),0,1):1;
    const activeAge=Math.max(0,field.age-field.warn),dir=phase>=4?-1:1;
    ctx.save();ctx.translate(p.x,p.y);ctx.lineCap='round';ctx.lineJoin='round';

    // Solid double bezel makes the hazard read as a clock at a glance.
    ctx.globalAlpha=warning?.22+.38*q:.64;
    ctx.strokeStyle=phase>=4?'#f2f4f4':'#bffdf3';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
    ctx.globalAlpha=warning?.12+.22*q:.36;ctx.lineWidth=1.15;
    ctx.beginPath();ctx.arc(0,0,r*.84,0,TAU);ctx.stroke();

    // 60 minute marks with stronger five-minute/hour marks.
    for(let i=0;i<60;i++){
      const a=i/60*TAU-Math.PI/2,major=i%5===0,quarter=i%15===0;
      const outer=r*(major?.96:.93),inner=r*(quarter?.72:major?.79:.87);
      ctx.globalAlpha=warning?(major?.18+.38*q:.10+.20*q):(quarter?.72:major?.48:.20);
      ctx.strokeStyle=phase>=4&&major?'#ffffff':'#9fffea';ctx.lineWidth=quarter?2.8:major?1.9:.8;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();
    }

    // Cardinal numerals remove any ambiguity that this is a clock face.
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 ${Math.max(9,Math.round(r*.12))}px IBM Plex Sans KR`;
    ctx.fillStyle=phase>=4?'rgba(255,255,255,.78)':'rgba(207,255,247,.72)';ctx.globalAlpha=warning?.18+.42*q:.72;
    const nr=r*.61;for(const [text,a] of[['12',-Math.PI/2],['3',0],['6',Math.PI/2],['9',Math.PI]])ctx.fillText(text,Math.cos(a)*nr,Math.sin(a)*nr);

    if(active){
      // Separate hour/minute/second motion. P4 runs backward and visibly jitters.
      const jitter=phase>=4?Math.sin(activeAge*18)*.055:0;
      const minute=dir*activeAge*3.6+field.seed+jitter, hour=dir*activeAge*.95+field.seed*.42-jitter*.4,second=dir*activeAge*8.4-field.seed*.25;
      const hand=(a,len,width,alpha)=>{ctx.save();ctx.rotate(a-Math.PI/2);ctx.globalAlpha=alpha;ctx.strokeStyle=phase>=4?'#ffffff':'#dffff8';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(-r*.10,0);ctx.lineTo(r*len,0);ctx.stroke();ctx.restore();};
      hand(hour,.43,3.5,.82);hand(minute,.66,2.5,.90);hand(second,.76,1.15,.58);
      ctx.globalAlpha=.90;ctx.fillStyle=phase>=4?'#ffffff':'#dffff8';ctx.beginPath();ctx.arc(0,0,5.5,0,TAU);ctx.fill();
      ctx.globalAlpha=.28;ctx.strokeStyle='#79ffe1';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r*.18,0,TAU);ctx.stroke();
    }
    ctx.restore();
  }

  const baseDrawApexArena=typeof window.drawApexArena==='function'?window.drawApexArena:null;
  if(baseDrawApexArena){
    window.drawApexArena=function drawApexArenaWithClockFacePolish(){
      baseDrawApexArena();
      const e=state.entities.enemies?.find(isAtropos);if(!e)return;
      expandArena(e);
      for(const field of e.atroposTimeFields||[])drawClockFieldFace(field);
    };
  }

  function p4SpinAmount(e){
    if(!isAtropos(e)||(e.apexPhase||1)<4){e.atroposP4PolishStartAt=null;return 0;}
    const now=performance.now();if(!Number.isFinite(e.atroposP4PolishStartAt))e.atroposP4PolishStartAt=now;
    const t=Math.max(0,(now-e.atroposP4PolishStartAt)/1000);
    if(t<=3){
      // Starts readable, then accelerates continuously into a near-mixer reverse spin.
      return 8*t+(62*Math.pow(t,4))/(4*27);
    }
    return 70.5+(t-3)*70;
  }

  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(baseDrawEliteShape){
    drawEliteShape=function drawEliteShapeWithPersistentP4Reverse(e){
      if(!isAtropos(e)||(e.apexPhase||1)<4)return baseDrawEliteShape(e);
      const actualPhase=e.phase,flag=!!e.atroposP4TimeStopActive,base=Number(e.atroposP4FreezePhase)||Number(actualPhase)||0,spin=p4SpinAmount(e);
      // Bypass the previous stop-only phase override; this layer owns P4 reverse motion for the entire phase.
      if(flag)e.atroposP4TimeStopActive=false;
      e.phase=base-spin;
      try{return baseDrawEliteShape(e);}finally{e.phase=actualPhase;if(flag)e.atroposP4TimeStopActive=true;}
    };
  }

  const baseRealmOverlay=typeof drawRealmCinematicOverlay==='function'?drawRealmCinematicOverlay:null;
  drawRealmCinematicOverlay=function drawRealmCinematicOverlayWithTimeStopGray(){
    if(baseRealmOverlay)baseRealmOverlay();
    const e=state.entities.enemies?.find(isAtropos);if(!e?.atroposP4TimeStopActive)return;
    const tr=e.atroposPhaseTransition,stop=tr?.p4TimeStop,elapsed=stop?Math.max(0,(performance.now()-stop.startedAt)/1000):0,q=clamp(elapsed/3,0,1);
    ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
    // 'color' blend with gray desaturates the world while keeping silhouettes readable.
    ctx.globalCompositeOperation='color';ctx.fillStyle=`rgba(145,148,151,${.62+.12*q})`;ctx.fillRect(0,0,vw,vh);
    ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(20,24,28,${.10+.08*q})`;ctx.fillRect(0,0,vw,vh);
    ctx.restore();
  };

  const baseCombatDiagnostics=window.stackfallAtroposCombatEscalationDiagnostics;
  if(typeof baseCombatDiagnostics==='function')window.stackfallAtroposCombatEscalationDiagnostics=()=>{
    const data=baseCombatDiagnostics();
    if(data?.phase===4&&data.clockHand)data.clockHand.stepSeconds=P4_HAND_STEP;
    return data;
  };

  window.stackfallAtroposProductionPolishDiagnostics=()=>{
    const e=state.entities.enemies?.find(isAtropos)||null,arena=state.apexArena;
    return e?{version:'v2',fixed:{x:e.x,y:e.y,speed:e.speed},arena:arena?{x:arena.x,y:arena.y,r:arena.r}:null,p4:(e.apexPhase||1)>=4?{active:!!e.atroposP4TimeStopActive,spin:p4SpinAmount(e),handStep:P4_HAND_STEP}:null,fields:(e.atroposTimeFields||[]).length}:null;
  };
})();
