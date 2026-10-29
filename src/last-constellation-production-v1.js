// Last Constellation production visual v1.
// The network is the boss: a tiny nameless shard anchors a much larger constellation that
// assembles node-first on entry and rewires into progressively more complete star maps by phase.
(()=>{
  if(window.stackfallLastConstellationProduction==='v1')return;
  window.stackfallLastConstellationProduction='v1';
  const FORM='lastconstellation',TAU2=Math.PI*2;
  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(!baseDrawEliteShape)return;
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const ease=t=>{t=clamp01(t);return t*t*(3-2*t);};
  const lerp=(a,b,t)=>a+(b-a)*t;

  // Coordinates are expressed in boss-radius units. The outer network deliberately dwarfs the core.
  const LAYOUTS={
    1:[[-3.15,-.70,.23,2],[-1.72,-2.52,.18,1],[.22,-3.28,.26,3],[2.42,-1.92,.19,1],[3.36,.42,.24,2],[1.34,2.72,.20,1],[-1.86,2.38,.25,2]],
    2:[[-3.55,-.48,.24,2],[-2.18,-2.66,.18,1],[-.28,-3.66,.27,3],[1.72,-2.92,.17,1],[3.42,-1.08,.23,2],[3.62,1.46,.19,1],[1.42,3.14,.25,2],[-1.18,3.46,.18,1],[-3.10,1.92,.23,2]],
    3:[[-4.05,-.30,.24,2],[-3.00,-2.46,.18,1],[-1.18,-3.82,.22,2],[1.12,-4.08,.28,3],[3.16,-2.58,.18,1],[4.10,-.58,.24,2],[3.72,1.86,.18,1],[2.02,3.54,.23,2],[-.38,4.18,.19,1],[-2.56,3.18,.25,2],[-4.18,1.44,.17,1]],
    4:[[-4.55,-.20,.25,2],[-3.72,-2.42,.18,1],[-2.06,-3.92,.22,2],[-.02,-4.62,.30,3],[2.06,-4.02,.18,1],[3.74,-2.54,.24,2],[4.68,-.36,.19,1],[4.06,2.02,.25,2],[2.40,3.76,.18,1],[.18,4.72,.27,3],[-2.30,3.94,.18,1],[-4.04,2.42,.24,2],[-4.70,.96,.18,1]]
  };
  const LINKS={
    1:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[1,6],[2,5]],
    2:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,0],[1,8],[2,7],[3,6]],
    3:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,0],[0,5],[2,8],[3,7],[5,10]],
    4:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,0],[0,6],[1,11],[2,9],[3,8],[4,10],[5,12]]
  };

  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  function entryState(e){
    const started=Number(e?.apexEntryRevealStartedAt);
    if(Number.isFinite(started)){
      const age=Math.max(0,(performance.now()-started)/1000);
      return{active:age<1.55,age};
    }
    const tr=state.realmTransition;
    if(tr?.owner==='apex-entry'&&(state.apexArena?.form||state.pendingApexForm)===FORM){
      const p=clamp01((Number(tr.elapsed)||0)/Math.max(.001,Number(tr.duration)||1));
      return{active:true,age:Math.max(0,(p-.30)*2.2)};
    }
    return{active:false,age:9};
  }
  function ensureVisualState(e,phase){
    if(!e.lastConstellationVisual)e.lastConstellationVisual={phase,previous:phase,changedAt:performance.now(),seed:Math.random()*TAU2};
    const s=e.lastConstellationVisual;
    if(s.phase!==phase){s.previous=s.phase;s.phase=phase;s.changedAt=performance.now();state.camera.shake=Math.max(state.camera.shake,5.5+phase);if(typeof audio?.tone==='function')audio.tone(92+phase*12,.18,'sine',.012,18);}
    return s;
  }
  function layoutPoint(layout,i){return layout[i]||layout[layout.length-1]||[0,0,.2,1];}
  function nodePose(e,s,phase,i,t){
    const cur=LAYOUTS[phase],prev=LAYOUTS[s.previous]||cur,q=ease(clamp01((performance.now()-s.changedAt)/900));
    const c=layoutPoint(cur,i),p=layoutPoint(prev,Math.min(i,prev.length-1));
    const born=i>=prev.length?ease(clamp01((q-.12)/.70)):1;
    const bx=i>=prev.length?0:p[0],by=i>=prev.length?0:p[1];
    const x=lerp(bx,c[0],q)*e.r,y=lerp(by,c[1],q)*e.r;
    const drift=e.r*(.035+.012*(i%3));
    return{x:x+Math.sin(t*.21+i*1.73+s.seed)*drift,y:y+Math.cos(t*.17+i*2.11+s.seed)*drift*.72,size:e.r*c[2],rank:c[3],alpha:born};
  }
  function traceShard(r){ctx.beginPath();ctx.moveTo(-r*.10,-r*.82);ctx.lineTo(r*.24,-r*.34);ctx.lineTo(r*.10,-r*.03);ctx.lineTo(r*.30,r*.42);ctx.lineTo(-r*.03,r*.86);ctx.lineTo(-r*.27,r*.36);ctx.lineTo(-r*.15,.02);ctx.lineTo(-r*.31,-r*.38);ctx.closePath();}
  function drawLink(a,b,alpha,rank,t,index){
    if(alpha<=.001)return;ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.strokeStyle=rank>=3?'#eef3ff':rank===2?'#b7c9ff':'#7588c8';ctx.lineWidth=rank>=3?1.8:rank===2?1.35:1.0;ctx.shadowColor='#9fb2ef';ctx.shadowBlur=rank>=3?8:4;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    const pulse=(t*.18+index*.137)%1,px=lerp(a.x,b.x,pulse),py=lerp(a.y,b.y,pulse);ctx.globalAlpha*=.72;ctx.fillStyle='#ffffff';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(px,py,rank>=3?2.2:1.4,0,TAU2);ctx.fill();ctx.restore();
  }
  function drawNode(p,index,t,entryAlpha){
    const a=p.alpha*entryAlpha;if(a<=.001)return;const pulse=.5+.5*Math.sin(t*(1.4+p.rank*.22)+index*1.91),r=p.size*(.88+.10*pulse);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate((index%2?1:-1)*(t*.035+index*.41));ctx.globalAlpha=a;ctx.shadowColor=p.rank>=3?'#ffffff':'#9fb2ef';ctx.shadowBlur=8+p.rank*6;
    const halo=ctx.createRadialGradient(0,0,1,0,0,r*2.4);halo.addColorStop(0,p.rank>=3?'rgba(255,255,255,.52)':'rgba(188,204,255,.38)');halo.addColorStop(1,'rgba(116,136,210,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r*2.4,0,TAU2);ctx.fill();
    ctx.fillStyle=p.rank>=3?'#ffffff':p.rank===2?'#dbe4ff':'#8799d4';ctx.strokeStyle='#eef3ff';ctx.lineWidth=p.rank>=3?1.6:1.1;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.46,-r*.10);ctx.lineTo(r*.20,r);ctx.lineTo(-r*.38,r*.28);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function drawCore(e,t,alpha){
    if(alpha<=.001)return;const r=e.r*.44,pulse=.5+.5*Math.sin(t*.72);ctx.save();ctx.globalAlpha=alpha;ctx.rotate(-.09+Math.sin(t*.12)*.025);ctx.shadowColor='#b7c9ff';ctx.shadowBlur=14+8*pulse;
    const g=ctx.createLinearGradient(0,-r,0,r);g.addColorStop(0,'#f8fbff');g.addColorStop(.25,'#9fb2ef');g.addColorStop(.62,'#27305b');g.addColorStop(1,'#050714');ctx.fillStyle=g;ctx.strokeStyle='#edf2ff';ctx.lineWidth=2.1;traceShard(r);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha*=.8;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(-r*.08,-r*.18);ctx.lineTo(r*.16,-r*.03);ctx.lineTo(r*.03,r*.22);ctx.lineTo(-r*.18,r*.04);ctx.closePath();ctx.fill();ctx.restore();
  }
  function drawConstellation(e){
    const phase=Math.max(1,Math.min(4,Number(e.apexPhase)||1)),s=ensureVisualState(e,phase),t=e.phase||state.time||0,entry=entryState(e),layout=LAYOUTS[phase],poses=[];
    for(let i=0;i<layout.length;i++)poses.push(nodePose(e,s,phase,i,t));
    const nodeBase=entry.active?clamp01((entry.age-.02)/.72):1;
    const lineBase=entry.active?ease(clamp01((entry.age-.42)/.58)):1;
    const coreAlpha=entry.active?ease(clamp01((entry.age-.86)/.34)):1;

    ctx.save();
    // Barely visible astral haze makes the network feel spatial without becoming a screen overlay.
    const halo=ctx.createRadialGradient(0,0,e.r*.3,0,0,e.r*5.1);halo.addColorStop(0,'rgba(152,173,236,.055)');halo.addColorStop(.55,'rgba(92,112,186,.026)');halo.addColorStop(1,'rgba(70,82,145,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,e.r*5.1,0,TAU2);ctx.fill();

    const links=LINKS[phase];
    for(let li=0;li<links.length;li++){
      const [ia,ib]=links[li],a=poses[ia],b=poses[ib];if(!a||!b)continue;
      const stagger=entry.active?ease(clamp01((entry.age-.40-li*.022)/.55)):1;
      drawLink(a,b,lineBase*stagger*Math.min(a.alpha,b.alpha)*(.34+.09*phase),Math.max(a.rank,b.rank),t,li);
    }
    for(let i=0;i<poses.length;i++){
      const stagger=entry.active?ease(clamp01((nodeBase-i*.065)/.42)):1;
      drawNode(poses[i],i,t,stagger);
    }
    drawCore(e,t,coreAlpha);
    ctx.restore();
  }

  drawEliteShape=function lastConstellationProductionShape(e){
    const f=e?.eliteForm||e?.apexForm||e?.variant;
    if(f===FORM){ctx.save();drawConstellation(e);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.setLineDash([]);ctx.restore();return;}
    return baseDrawEliteShape(e);
  };

  window.stackfallLastConstellationProductionDiagnostics=()=>{
    const e=state.entities.enemies?.find(isLC)||null;if(!e)return null;const phase=Math.max(1,Math.min(4,Number(e.apexPhase)||1)),entry=entryState(e),layout=LAYOUTS[phase];
    return{version:'v1',phase,nodeCount:layout.length,linkCount:LINKS[phase].length,maxNetworkRadius:Math.max(...layout.map(p=>Math.hypot(p[0],p[1]))),coreRadiusScale:.44,entry:{active:entry.active,age:entry.age},networkDominatesCore:true,patternsUntouched:true};
  };
})();