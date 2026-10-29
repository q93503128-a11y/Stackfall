// Last Constellation presentation v3.
// Monumental, asymmetric, static-scale constellation structure.
(()=>{
  if(window.stackfallLastConstellationPresentation==='v3')return;
  window.stackfallLastConstellationPresentation='v3';
  const FORM='lastconstellation',TAU=Math.PI*2;
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const now=()=>performance.now();

  // Deliberately irregular. This spans most of the combat view instead of forming a small rectangle.
  const LAYOUT={
    'outer-1':{x:-8.20,y:-1.20,size:.58,rank:2,angle:-.30},
    'outer-2':{x:-1.90,y:-6.00,size:.62,rank:3,angle:.18},
    'outer-3':{x:7.70,y:-2.80,size:.59,rank:2,angle:.34},
    'outer-4':{x:4.90,y:5.40,size:.64,rank:3,angle:-.22},
    'middle-1':{x:-4.15,y:-1.00,size:.54,rank:2,angle:.16},
    'middle-2':{x:3.60,y:-2.00,size:.57,rank:3,angle:-.12},
    'middle-3':{x:1.05,y:3.45,size:.55,rank:2,angle:.27},
    'inner-1':{x:-2.00,y:.42,size:.52,rank:2,angle:-.18},
    'inner-2':{x:1.82,y:.78,size:.54,rank:2,angle:.20},
    'inner-3':{x:.20,y:-2.20,size:.58,rank:3,angle:-.08},
    'core':{x:0,y:0,size:1.00,rank:4,angle:0}
  };
  const ORDER=['outer-1','outer-2','outer-3','outer-4','middle-1','middle-2','middle-3','inner-1','inner-2','inner-3','core'];
  // Outer layer is intentionally not a closed four-sided frame.
  const LINKS=[
    ['outer-1','outer-2',1],['outer-2','outer-3',1],['outer-3','outer-4',1],
    ['outer-1','middle-1',1],['outer-2','middle-1',1],['outer-2','middle-2',1],['outer-3','middle-2',1],['outer-3','middle-3',1],['outer-4','middle-2',1],['outer-4','middle-3',1],
    ['middle-1','middle-2',2],['middle-2','middle-3',2],
    ['middle-1','inner-1',2],['middle-1','inner-3',2],['middle-2','inner-2',2],['middle-2','inner-3',2],['middle-3','inner-1',2],['middle-3','inner-2',2],
    ['inner-1','inner-2',3],['inner-2','inner-3',3],['inner-3','inner-1',3],
    ['inner-1','core',3],['inner-2','core',3],['inner-3','core',3]
  ];
  const GROUP={outer:1,middle:2,inner:3,core:4};
  const groupForKey=key=>key==='core'?4:key.startsWith('outer-')?1:key.startsWith('middle-')?2:3;

  function syncProxyLayout(e){
    if(!isLC(e)||!e.lcStructure||!Array.isArray(e.bodyParts))return;
    const phase=e.lcStructure.phase||1;
    for(const part of e.bodyParts){
      if(!part?.lcNodeProxy)continue;
      const d=LAYOUT[part.lcNodeKey];if(!d)continue;
      part.dx=d.x*e.r;part.dy=d.y*e.r;
      part.r=Math.max(10,e.r*(part.lcNodeKey==='core'&&phase===4?1.20:d.size*.82));
      part.x=e.x+part.dx;part.y=e.y+part.dy;
    }
  }

  const baseUpdateEnemies=typeof updateEnemies==='function'?updateEnemies:null;
  if(baseUpdateEnemies)updateEnemies=function updateEnemiesWithMonumentalConstellation(dt){
    const result=baseUpdateEnemies(dt);
    for(const e of state.entities.enemies||[])if(isLC(e))syncProxyLayout(e);
    return result;
  };

  function stateOf(e,key){
    const s=e.lcStructure,n=s?.nodes?.[key];if(!s||!n)return'future';
    if(n.destroyed)return'destroyed';
    const g=groupForKey(key);if(g===s.phase)return'active';if(g>s.phase)return'future';return'destroyed';
  }
  function pose(e,key){const d=LAYOUT[key];return{x:d.x*e.r,y:d.y*e.r,r:d.size*e.r};}
  function traceCrystal(r,wide=.50){ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*wide,-r*.10);ctx.lineTo(r*.20,r);ctx.lineTo(-r*wide,r*.20);ctx.closePath();}

  function linkAlpha(e,a,b,layer){
    const s=e.lcStructure,na=s?.nodes?.[a],nb=s?.nodes?.[b];if(!s||!na||!nb)return 0;
    if(na.destroyed||nb.destroyed){const fade=1-clamp01((now()-Math.max(na.destroyedAt||0,nb.destroyedAt||0))/620);return .13*fade;}
    if(layer===s.phase)return .78;
    if(layer>s.phase)return .105;
    return .035;
  }
  function drawLink(e,a,b,layer){
    const alpha=linkAlpha(e,a,b,layer);if(alpha<=.002)return;
    const pa=pose(e,a),pb=pose(e,b),active=layer===e.lcStructure.phase;
    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=active?'#dce8ff':'#6879b5';ctx.lineWidth=active?1.9:1.0;ctx.shadowColor='#9fb7ff';ctx.shadowBlur=active?7:2;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();ctx.restore();
  }

  function drawNode(e,key,index){
    const d=LAYOUT[key],s=e.lcStructure,n=s.nodes[key],status=stateOf(e,key),p=pose(e,key);
    if(status==='destroyed'){
      const fade=1-clamp01((now()-(n.destroyedAt||0))/760);if(fade<=0)return;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(d.angle);ctx.globalAlpha=.18*fade;ctx.strokeStyle='#91a2d5';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-p.r*.72,-p.r*.22);ctx.lineTo(p.r*.62,p.r*.32);ctx.moveTo(-p.r*.34,p.r*.62);ctx.lineTo(p.r*.25,-p.r*.72);ctx.stroke();ctx.restore();return;
    }
    const active=status==='active',r=p.r*(active?1:.82),alpha=active?1:.18;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(d.angle);ctx.globalAlpha=alpha;
    if(active){const halo=ctx.createRadialGradient(0,0,1,0,0,r*2.55);halo.addColorStop(0,'rgba(244,248,255,.44)');halo.addColorStop(.40,'rgba(145,171,246,.16)');halo.addColorStop(1,'rgba(95,118,205,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r*2.55,0,TAU);ctx.fill();}
    ctx.shadowColor=active?'#dce8ff':'#6f82c1';ctx.shadowBlur=active?16:4;ctx.fillStyle=active?(d.rank>=3?'#f8fbff':'#cbd8ff'):'#344166';ctx.strokeStyle=active?'#f0f5ff':'#6d7db2';ctx.lineWidth=active?1.9:1.0;traceCrystal(r,d.rank>=3?.60:.49);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=alpha*(active?.92:.42);ctx.fillStyle=active?'#ffffff':'#8898c9';ctx.beginPath();ctx.moveTo(0,-r*.56);ctx.lineTo(r*.18,0);ctx.lineTo(0,r*.50);ctx.lineTo(-r*.15,0);ctx.closePath();ctx.fill();
    if(active){const hp=clamp01(n.hp/Math.max(.001,n.maxHp));ctx.strokeStyle='rgba(224,234,255,.28)';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(0,0,r*1.56,0,TAU);ctx.stroke();ctx.strokeStyle='#edf4ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.56,-Math.PI/2,-Math.PI/2+TAU*hp);ctx.stroke();}
    ctx.restore();
  }

  function drawCore(e){
    const s=e.lcStructure,n=s.nodes.core,phase=s.phase;
    const awaken=phase===4?clamp01((now()-s.transitionAt)/1050):0;
    // One-time P4 awakening only. No periodic breathing scale.
    const dormant=[.34,.42,.52][Math.max(0,Math.min(2,phase-1))]||.52;
    const scale=phase===4?lerp(.56,1.56,awaken):dormant,r=e.r*scale,alpha=phase===4?1:.16+.045*phase;
    ctx.save();ctx.globalAlpha=alpha;
    const halo=ctx.createRadialGradient(0,0,2,0,0,r*(phase===4?3.0:1.9));halo.addColorStop(0,phase===4?'rgba(255,255,255,.74)':'rgba(190,205,255,.18)');halo.addColorStop(.42,phase===4?'rgba(137,169,255,.24)':'rgba(105,126,204,.06)');halo.addColorStop(1,'rgba(70,88,170,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r*(phase===4?3:1.9),0,TAU);ctx.fill();
    ctx.shadowColor='#e7efff';ctx.shadowBlur=phase===4?34:7;ctx.fillStyle=phase===4?'#fbfdff':'#4f5f8e';ctx.strokeStyle=phase===4?'#ffffff':'#8393c4';ctx.lineWidth=phase===4?2.8:1.2;traceCrystal(r,.64);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha*=phase===4?.96:.40;ctx.fillStyle=phase===4?'#cad9ff':'#7282b4';ctx.beginPath();ctx.moveTo(0,-r*.68);ctx.lineTo(r*.25,0);ctx.lineTo(0,r*.68);ctx.lineTo(-r*.20,0);ctx.closePath();ctx.fill();
    if(phase===4){const hp=clamp01(n.hp/Math.max(.001,n.maxHp));ctx.globalAlpha=alpha*.72;ctx.strokeStyle='#cbd9ff';ctx.lineWidth=1.1;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,r*(1.65+i*.48),r*(1.03+i*.28),i*.31,0,TAU);ctx.stroke();}ctx.globalAlpha=alpha*.94;ctx.lineWidth=2.9;ctx.strokeStyle='#f2f6ff';ctx.beginPath();ctx.arc(0,0,r*1.34,-Math.PI/2,-Math.PI/2+TAU*hp);ctx.stroke();}
    ctx.restore();
  }

  function drawMonument(e){
    if(!e.lcStructure)return false;syncProxyLayout(e);
    ctx.save();
    const haze=ctx.createRadialGradient(0,0,e.r*.4,0,0,e.r*9.4);haze.addColorStop(0,'rgba(135,158,231,.040)');haze.addColorStop(.58,'rgba(72,91,168,.018)');haze.addColorStop(1,'rgba(50,65,135,0)');ctx.fillStyle=haze;ctx.beginPath();ctx.arc(0,0,e.r*9.4,0,TAU);ctx.fill();
    for(const [a,b,layer] of LINKS)drawLink(e,a,b,layer);
    for(let i=0;i<ORDER.length-1;i++)drawNode(e,ORDER[i],i);
    drawCore(e);ctx.restore();return true;
  }

  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(baseDrawEliteShape)drawEliteShape=function lastConstellationMonumentalShape(e){
    if(isLC(e)&&drawMonument(e))return;
    return baseDrawEliteShape(e);
  };

  window.stackfallLastConstellationPresentationDiagnostics=()=>{
    const e=state.entities.enemies?.find(isLC)||null;if(!e?.lcStructure)return null;
    const xs=ORDER.slice(0,10).map(k=>LAYOUT[k].x),ys=ORDER.slice(0,10).map(k=>LAYOUT[k].y);
    return{version:'v3',phase:e.lcStructure.phase,outerExtentX:Math.max(...xs)-Math.min(...xs),outerExtentY:Math.max(...ys)-Math.min(...ys),maxRadius:Math.max(...ORDER.slice(0,10).map(k=>Math.hypot(LAYOUT[k].x,LAYOUT[k].y))),closedOuterRectangle:false,nodeScaleBreathing:false,anchored:true};
  };
})();