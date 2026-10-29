// Restore the Endless Apex identities while keeping later combat/pattern systems intact.
// Omega and Last Constellation stay on the pre-9af0cdec silhouettes. Chronophage keeps that
// combat-era identity but reintroduces the stronger 2026-07-14 clockwork DNA so it no longer
// reads as another radial plate/star boss.
(()=>{
  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(!baseDrawEliteShape)return;

  let chronophageRenderCount=0;
  let lastChronophageRender=null;

  function setup(e){
    ctx.strokeStyle=e.hit?'#fff':e.color;
    ctx.fillStyle=e.hit?'#fff':e.color;
    ctx.lineWidth=4;
    ctx.lineCap='round';
    ctx.lineJoin='round';
  }

  // Historical function name is intentionally retained for the restore audit. The visual itself
  // is a refined hybrid: 7/14 broken clockwork + current rendering polish, without Omega-like plates.
  function drawChronophage20260720(e,t,enraged){
    const phase=Math.max(1,Number(e.apexPhase)||1),pulse=.5+.5*Math.sin(t*.72),hit=!!e.hit;
    const rings=[
      {r:.64,speed:.155,offset:.12,width:3.2,alpha:.94,gap:.19,ticks:12},
      {r:.93,speed:-.104,offset:.78,width:2.7,alpha:.78,gap:.24,ticks:12},
      {r:1.24,speed:.066,offset:1.56,width:2.2,alpha:.60,gap:.31,ticks:12},
      {r:1.57,speed:-.038,offset:2.31,width:1.8,alpha:.42,gap:.39,ticks:12}
    ];
    if(enraged||phase>=3)rings.push({r:1.84,speed:.024,offset:.46,width:1.45,alpha:.28,gap:.47,ticks:12});

    // Dim temporal halo: broad and circular, not a solid central mass.
    ctx.save();
    const halo=ctx.createRadialGradient(0,0,e.r*.18,0,0,e.r*1.92);
    halo.addColorStop(0,`rgba(160,255,240,${hit?.22:.09})`);
    halo.addColorStop(.46,`rgba(70,220,207,${.055+.025*pulse})`);
    halo.addColorStop(1,'rgba(40,170,165,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,e.r*1.92,0,TAU);ctx.fill();
    ctx.restore();

    // Four/five independently rotating broken clock rings. Every ring has one deliberately missing
    // quadrant plus smaller cuts, so the silhouette reads as damaged time rather than a sun/flower.
    for(let ringIndex=0;ringIndex<rings.length;ringIndex++){
      const ring=rings[ringIndex],rr=e.r*ring.r,rot=t*ring.speed+ring.offset;
      ctx.save();ctx.rotate(rot);ctx.strokeStyle=hit?'#ffffff':ringIndex<2?'#dffff9':e.color;ctx.lineWidth=ring.width;ctx.globalAlpha=ring.alpha;
      const segments=6,missing=(ringIndex*2+1)%segments;
      for(let seg=0;seg<segments;seg++){
        if(seg===missing)continue;
        const wobble=(seg%2?.018:-.014)*(ringIndex+1),start=seg/segments*TAU+ring.gap+wobble,end=(seg+1)/segments*TAU-ring.gap*.72+wobble;
        ctx.beginPath();ctx.arc(0,0,rr,start,end);ctx.stroke();
      }

      // Twelve hour marks, with damaged/ghost marks omitted or displaced on outer rings.
      ctx.setLineDash([]);
      for(let i=0;i<ring.ticks;i++){
        if((i+ringIndex*3)%7===0&&ringIndex>0)continue;
        const a=i/ring.ticks*TAU,major=i%3===0,ghost=ringIndex>1&&(i+ringIndex)%5===0;
        const inner=rr-e.r*(major?.085:.052),outer=rr+e.r*(major?.055:.032),shift=ghost?e.r*.055:0;
        ctx.globalAlpha=ring.alpha*(ghost?.28:major?.92:.58);
        ctx.lineWidth=major?2.5:1.35;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*inner+Math.cos(a+Math.PI/2)*shift,Math.sin(a)*inner+Math.sin(a+Math.PI/2)*shift);
        ctx.lineTo(Math.cos(a)*outer+Math.cos(a+Math.PI/2)*shift,Math.sin(a)*outer+Math.sin(a+Math.PI/2)*shift);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Detached time fragments at irregular angles. They are thin clock shards, never broad radial plates.
    const shardAngles=[-.38,1.18,2.74,4.38];
    ctx.save();ctx.strokeStyle=hit?'#fff':'#aaffef';ctx.fillStyle=hit?'rgba(255,255,255,.35)':'rgba(74,215,202,.10)';
    for(let i=0;i<shardAngles.length;i++){
      const a=shardAngles[i]-t*(i%2?.018:-.012),rr=e.r*(1.68+(i%2)*.16),w=e.r*(i%2?.11:.075),h=e.r*(i%2?.23:.17);
      ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(a+.45*(i%2?1:-1));ctx.globalAlpha=.30+i*.07;
      ctx.beginPath();ctx.moveTo(-w,-h);ctx.lineTo(w*.72,-h*.72);ctx.lineTo(w,h*.64);ctx.lineTo(-w*.52,h);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
    ctx.restore();

    // Clock hands dominate the interior silhouette. Their very different lengths/speeds are inherited
    // from the original July 14 Chronophage and make the boss readable even at small scale.
    const longAngle=t*.31-.72,shortAngle=-t*.115+1.16,fractureAngle=t*.041+2.48;
    const drawHand=(angle,length,back,width,alpha,color,tip=0)=>{
      ctx.save();ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=width;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(-e.r*back,0);ctx.lineTo(e.r*length,0);ctx.stroke();
      if(tip>0){ctx.beginPath();ctx.moveTo(e.r*length,0);ctx.lineTo(e.r*(length-tip),-e.r*tip*.34);ctx.lineTo(e.r*(length-tip),e.r*tip*.34);ctx.closePath();ctx.fill();}
      ctx.restore();
    };

    // Temporal afterimages show where the long hand was, instead of adding more physical mass.
    for(let ghost=3;ghost>=1;ghost--)drawHand(longAngle-ghost*.075,1.48,.18,1.4,.07*(4-ghost),e.color,0);
    drawHand(longAngle,1.53,.22,4.6,.96,hit?'#fff':'#eafffb',.16);
    drawHand(shortAngle,.88,.15,6.0,.88,hit?'#fff':'#8fffe7',.13);
    ctx.save();ctx.rotate(fractureAngle);ctx.setLineDash([e.r*.13,e.r*.095]);ctx.globalAlpha=.38;ctx.strokeStyle='#b9fff3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-e.r*.42,0);ctx.lineTo(e.r*1.30,0);ctx.stroke();ctx.restore();ctx.setLineDash([]);

    // Small asymmetric time-core. The core is intentionally much smaller than Omega's furnace.
    ctx.save();ctx.rotate(-t*.072);
    const core=ctx.createRadialGradient(-e.r*.08,-e.r*.10,1,0,0,e.r*.42);
    core.addColorStop(0,'#ffffff');core.addColorStop(.22,'#cffff7');core.addColorStop(.52,'#43c7b8');core.addColorStop(1,'#031619');
    ctx.fillStyle=core;ctx.strokeStyle=hit?'#fff':'#dffff9';ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(0,-e.r*.38);ctx.lineTo(e.r*.29,-e.r*.08);ctx.lineTo(e.r*.17,e.r*.34);ctx.lineTo(-e.r*.23,e.r*.29);ctx.lineTo(-e.r*.34,-e.r*.10);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.70)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-e.r*.10,-e.r*.27);ctx.lineTo(e.r*.09,e.r*.23);ctx.stroke();
    ctx.restore();

    // Central pin and tiny counter-rotating inner ring.
    ctx.save();ctx.rotate(t*.19);ctx.globalAlpha=.74;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,e.r*.49,.18,Math.PI-.24);ctx.stroke();ctx.beginPath();ctx.arc(0,0,e.r*.49,Math.PI+.28,TAU-.16);ctx.stroke();ctx.restore();
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,e.r*.055,0,TAU);ctx.fill();
  }

  function drawStarforge20260720(e,t,enraged){
    const plates=enraged?10:8;
    ctx.save();
    ctx.rotate(t*.028);
    for(let i=0;i<plates;i++){
      ctx.save();
      ctx.rotate(i/plates*TAU);
      const long=i%2===0;
      ctx.fillStyle=long?'#431006':'#1b0905';
      ctx.strokeStyle=long?'#ffe7a0':'#ff7b35';
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(e.r*.40,-e.r*.18);
      ctx.lineTo(e.r*(long?1.72:1.32),-e.r*.44);
      ctx.lineTo(e.r*(long?2.12:1.64),0);
      ctx.lineTo(e.r*(long?1.72:1.32),e.r*.44);
      ctx.lineTo(e.r*.40,e.r*.18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    ctx.fillStyle='#160603';
    ctx.strokeStyle='#fff0b0';
    ctx.lineWidth=5;
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a=i/6*TAU-Math.PI/2,x=Math.cos(a)*e.r*.72,y=Math.sin(a)*e.r*.72;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.fill();ctx.stroke();

    const furnace=ctx.createLinearGradient(0,-e.r*.48,0,e.r*.48);
    furnace.addColorStop(0,'#fff8d8');
    furnace.addColorStop(.30,'#ffcf57');
    furnace.addColorStop(.72,'#ff5d22');
    furnace.addColorStop(1,'#5b0c02');
    ctx.fillStyle=furnace;
    ctx.fillRect(-e.r*.19,-e.r*.48,e.r*.38,e.r*.96);
    ctx.fillStyle='#fff';
    ctx.fillRect(-e.r*.055,-e.r*.54,e.r*.11,e.r*1.08);
  }

  function drawLastConstellation20260720(e,t,enraged){
    const count=enraged?10:8,pts=[];
    for(let i=0;i<count;i++){
      const a=i/count*TAU+t*(i%2?.024:-.018),rr=e.r*(i%3===0?3.35:i%2?2.55:1.75);
      pts.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr});
    }
    ctx.globalAlpha=.52;
    ctx.lineWidth=1.5;
    for(let i=0;i<pts.length;i++){
      const a=pts[i],b=pts[(i+(i%2?3:2))%pts.length];
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    ctx.globalAlpha=1;
    for(const [i,p] of pts.entries()){
      ctx.fillStyle=i%3===0?'#ffffff':'#aebfff';
      ctx.shadowBlur=18;
      ctx.shadowColor=e.color;
      ctx.beginPath();
      ctx.moveTo(p.x,p.y-7);ctx.lineTo(p.x+5,p.y);ctx.lineTo(p.x,p.y+7);ctx.lineTo(p.x-5,p.y);
      ctx.closePath();ctx.fill();
    }
    ctx.shadowBlur=0;
    ctx.fillStyle='#02030a';
    ctx.strokeStyle='#edf2ff';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.moveTo(0,-e.r*.95);
    ctx.lineTo(e.r*.58,-e.r*.10);
    ctx.lineTo(e.r*.20,e.r*.78);
    ctx.lineTo(-e.r*.42,e.r*.54);
    ctx.lineTo(-e.r*.62,-e.r*.22);
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#b7c9ff';
    ctx.beginPath();ctx.arc(0,0,e.r*.18,0,TAU);ctx.fill();
  }

  function chronophageProbe(e){
    const screenX=e.x-player.x+vw/2,screenY=e.y-player.y+vh/2,visualRadius=e.r*2.05;
    chronophageRenderCount++;
    lastChronophageRender={
      count:chronophageRenderCount,
      worldX:e.x,worldY:e.y,
      screenX,screenY,
      r:e.r,visualRadius,
      bbox:{left:screenX-visualRadius,top:screenY-visualRadius,right:screenX+visualRadius,bottom:screenY+visualRadius},
      apexPhase:e.apexPhase||null
    };
  }

  drawEliteShape=function restoredApexVisuals(e){
    const f=e?.eliteForm||e?.apexForm||e?.variant;
    if(!['chronophage','starforge','lastconstellation'].includes(f))return baseDrawEliteShape(e);
    const t=e.phase||0,enraged=e.kind==='apex'&&e.apexPhase===2;
    if(f==='chronophage')chronophageProbe(e);
    ctx.save();
    setup(e);
    if(f==='chronophage')drawChronophage20260720(e,t,enraged);
    else if(f==='starforge')drawStarforge20260720(e,t,enraged);
    else drawLastConstellation20260720(e,t,enraged);
    ctx.globalAlpha=1;
    ctx.shadowBlur=0;
    ctx.setLineDash([]);
    ctx.restore();
  };

  // Reborn v4 hides Chronophage from the ordinary enemy renderer by temporarily moving it to
  // (1e9, 1e9), then draws a separate world body. That conflicts with this historical visual
  // restore and also leaks the sentinel position into off-screen guidance. Use the renderer that
  // existed immediately before that wrapper, so the real entity coordinates reach drawEliteShape.
  // DEV body-part circles/labels are presentation-only, so hide those proxies only for this draw
  // call; the multipart targeting state remains intact for combat. Keep the canonical space-cut.
  if(typeof baseDrawEnemiesAtropos==='function'){
    drawEnemies=function drawEnemiesWithHistoricalChronophage(){
      const e=state.entities.enemies.find(enemy=>!enemy?.dead&&enemy.apexForm==='chronophage');
      const parts=e?.bodyParts||null;
      if(e)e.bodyParts=null;
      let result;
      try{result=baseDrawEnemiesAtropos();}
      finally{if(e)e.bodyParts=parts;}
      if(e&&typeof drawAtroposSpaceCut==='function')drawAtroposSpaceCut(e);
      return result;
    };
  }

  // The abandoned World Devourer body must not layer over the restored historical silhouette.
  if(typeof drawAtroposWorldBody==='function')drawAtroposWorldBody=function restoredChronophageHasNoPrototypeBody(){};

  window.stackfallApexVisualRestoreDiagnostics=()=>{
    const e=state.entities.enemies.find(enemy=>!enemy?.dead&&enemy.apexForm==='chronophage')||null;
    const screenX=e?e.x-player.x+vw/2:null,screenY=e?e.y-player.y+vh/2:null;
    return{
      player:{x:player.x,y:player.y},
      chronophage:e?{x:e.x,y:e.y,dx:e.x-player.x,dy:e.y-player.y,distance:Math.hypot(e.x-player.x,e.y-player.y),screenX,screenY,r:e.r,eliteForm:e.eliteForm||null,apexForm:e.apexForm||null,variant:e.variant||null,apexPhase:e.apexPhase||null}:null,
      apexActiveId:state.apexActiveId||null,
      pendingApexForm:state.pendingApexForm||null,
      apexExitPending:!!state.apexExitPending,
      realmTransition:state.realmTransition?{owner:state.realmTransition.owner||null,from:state.realmTransition.from||null,to:state.realmTransition.to||null,elapsed:Number(state.realmTransition.elapsed)||0,duration:Number(state.realmTransition.duration)||0,serial:state.realmTransition.serial??null}:null,
      indicatorTarget:e?{x:e.x,y:e.y,dx:e.x-player.x,dy:e.y-player.y,distance:Math.hypot(e.x-player.x,e.y-player.y),source:'live-apex-entity'}:null,
      render:lastChronophageRender
    };
  };
  window.stackfallApexVisualRestore='pre-9af0cdec-2026-07-20';
})();
