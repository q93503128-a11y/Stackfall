// Last Constellation production structure v2.
// The boss is an eleven-node stellar superstructure: 4 outer -> 3 middle -> 3 inner -> 1 core.
// Combat patterns are intentionally supplied elsewhere; this module owns structure, targeting and presentation.
(()=>{
  if(window.stackfallLastConstellationProduction==='v2')return;
  window.stackfallLastConstellationProduction='v2';
  const FORM='lastconstellation',TAU2=Math.PI*2;
  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(!baseDrawEliteShape)return;
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const ease=t=>{t=clamp01(t);return t*t*(3-2*t);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const nowMs=()=>performance.now();

  // Position units are boss-radius multiples. Deliberately asymmetric, but hierarchical and readable.
  const NODES=[
    {key:'outer-1',group:1,x:-5.30,y:-2.45,size:.54,rank:2},{key:'outer-2',group:1,x:4.90,y:-3.05,size:.58,rank:3},
    {key:'outer-3',group:1,x:5.78,y:2.12,size:.52,rank:2},{key:'outer-4',group:1,x:-4.82,y:3.38,size:.56,rank:2},
    {key:'middle-1',group:2,x:-2.82,y:-1.68,size:.49,rank:2},{key:'middle-2',group:2,x:2.72,y:-1.86,size:.52,rank:3},{key:'middle-3',group:2,x:.38,y:3.02,size:.50,rank:2},
    {key:'inner-1',group:3,x:-1.42,y:.18,size:.47,rank:2},{key:'inner-2',group:3,x:1.34,y:.30,size:.49,rank:2},{key:'inner-3',group:3,x:-.08,y:-1.62,size:.53,rank:3},
    {key:'core',group:4,x:0,y:0,size:1.00,rank:4}
  ];
  const INDEX=Object.fromEntries(NODES.map((n,i)=>[n.key,i]));
  const LINKS=[
    ['outer-1','outer-2',1],['outer-2','outer-3',1],['outer-3','outer-4',1],['outer-4','outer-1',1],
    ['outer-1','middle-1',1],['outer-2','middle-2',1],['outer-3','middle-2',1],['outer-3','middle-3',1],['outer-4','middle-1',1],['outer-4','middle-3',1],
    ['middle-1','middle-2',2],['middle-2','middle-3',2],['middle-3','middle-1',2],
    ['middle-1','inner-1',2],['middle-1','inner-3',2],['middle-2','inner-2',2],['middle-2','inner-3',2],['middle-3','inner-1',2],['middle-3','inner-2',2],
    ['inner-1','inner-2',3],['inner-2','inner-3',3],['inner-3','inner-1',3],
    ['inner-1','core',3],['inner-2','core',3],['inner-3','core',3]
  ];
  const GROUP_COUNTS={1:4,2:3,3:3,4:1};
  const GROUP_POOL={1:.25,2:.25,3:.25,4:.25};
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const nodeDef=key=>NODES[INDEX[key]]||null;

  function entryState(e){
    const started=Number(e?.apexEntryRevealStartedAt);
    if(Number.isFinite(started)){const age=Math.max(0,(nowMs()-started)/1000);return{active:age<1.85,age};}
    const tr=state.realmTransition;
    if(tr?.owner==='apex-entry'&&(state.apexArena?.form||state.pendingApexForm)===FORM){
      const p=clamp01((Number(tr.elapsed)||0)/Math.max(.001,Number(tr.duration)||1));return{active:true,age:Math.max(0,(p-.26)*2.45)};
    }
    return{active:false,age:9};
  }

  function initializeStructure(e){
    if(!isLC(e))return null;
    if(e.lcStructure?.version===2)return e.lcStructure;
    const total=Math.max(1,Number(e.maxHp)||Number(e.hp)||1),nodes={};
    for(const def of NODES){const max=total*GROUP_POOL[def.group]/GROUP_COUNTS[def.group];nodes[def.key]={key:def.key,group:def.group,hp:max,maxHp:max,destroyed:false,destroyedAt:0};}
    e.lcStructure={version:2,phase:1,nodes,createdAt:nowMs(),transitionAt:nowMs(),anchorX:e.x,anchorY:e.y};
    e.apexPhase=1;e.apexPhaseEntered=1;
    if(typeof defineBossBodyParts==='function'){
      defineBossBodyParts(e,NODES.map(def=>({key:`lc-${def.key}`,label:def.group===4?'LAST CORE':`CONSTELLATION ${def.key.toUpperCase()}`,dx:def.x*e.r,dy:def.y*e.r,r:Math.max(9,e.r*def.size*.78),active:def.group===1,visible:def.group===1})));
      for(const part of e.bodyParts||[]){const key=String(part.key||'').replace(/^lc-/,'');if(!nodes[key])continue;part.lcNodeProxy=true;part.lcNodeKey=key;part.lcNodeGroup=nodes[key].group;}
    }
    syncParts(e);return e.lcStructure;
  }

  function phaseNodes(e,phase=e.lcStructure?.phase||1){const s=e.lcStructure;return s?Object.values(s.nodes).filter(n=>n.group===phase):[];}
  function activeNode(e,key){const s=e.lcStructure,n=s?.nodes?.[key];return!!(n&&!n.destroyed&&n.group===s.phase);}
  function syncParts(e){
    const s=e.lcStructure;if(!s||!Array.isArray(e.bodyParts))return;
    for(const part of e.bodyParts){if(!part.lcNodeProxy)continue;const def=nodeDef(part.lcNodeKey),node=s.nodes[part.lcNodeKey];if(!def||!node)continue;part.dx=def.x*e.r;part.dy=def.y*e.r;part.r=Math.max(9,e.r*(def.group===4&&s.phase===4?1.03:def.size*.78));part.active=!node.destroyed&&node.group===s.phase;part.visible=part.active;part.dead=!part.active;part.x=e.x+part.dx;part.y=e.y+part.dy;part.hp=node.hp;part.maxHp=node.maxHp;}
  }

  function advancePhase(e){
    const s=e.lcStructure;if(!s||s.phase>=4)return;
    if(phaseNodes(e,s.phase).some(n=>!n.destroyed))return;
    s.phase++;s.transitionAt=nowMs();e.apexPhase=s.phase;e.apexPhaseEntered=s.phase;
    e.skillCd=e.burstCd=e.pulseCd=e.signatureCd=e.apexVariantCd=e.apexSetpieceCd=999;
    state.camera.shake=Math.max(state.camera.shake,6+s.phase*1.4);state.flash=Math.max(state.flash,.07+s.phase*.018);
    if(typeof shockwave==='function')shockwave(e.x,e.y,'#dce6ff',96+s.phase*34,.38+s.phase*.035,2.4+s.phase*.35);
    if(typeof audio?.tone==='function')audio.tone(86+s.phase*18,.24,'sine',.014,22);
    syncParts(e);
  }

  function destroyNode(e,node){
    if(node.destroyed)return;node.destroyed=true;node.hp=0;node.destroyedAt=nowMs();
    const def=nodeDef(node.key),x=e.x+(def?.x||0)*e.r,y=e.y+(def?.y||0)*e.r;
    state.camera.shake=Math.max(state.camera.shake,node.group===3?8:6);state.flash=Math.max(state.flash,node.group===3?.10:.07);
    if(typeof shockwave==='function')shockwave(x,y,node.group===3?'#eef3ff':'#aebfff',72+node.group*13,.34,2.1+node.group*.35);
    if(typeof spawnParticle==='function')for(let i=0;i<10+node.group*3;i++)spawnParticle(x+rand(-10,10),y+rand(-10,10),i%3?'#b7c9ff':'#ffffff',1,34+Math.random()*42,2.0+Math.random()*1.7);
    syncParts(e);advancePhase(e);
  }

  // Last Constellation is a world structure, not a roaming body.
  const baseApexMotionVelocity=typeof apexMotionVelocity==='function'?apexMotionVelocity:null;
  if(baseApexMotionVelocity)apexMotionVelocity=function lastConstellationAnchoredMotion(e){if(isLC(e)){const s=initializeStructure(e);if(s){e.x=s.anchorX;e.y=s.anchorY;}return{x:0,y:0};}return baseApexMotionVelocity(e);};

  // Route hits into the currently exposed node. Node HP is the boss HP pool divided evenly by phase.
  const baseDealDamage=typeof dealDamage==='function'?dealDamage:null;
  if(baseDealDamage)dealDamage=function lastConstellationNodeDamage(target,amount,options={}){
    const owner=target?.lcNodeProxy?target.owner:target;
    if(!isLC(owner))return baseDealDamage(target,amount,options);
    const s=initializeStructure(owner);if(!s)return baseDealDamage(target,amount,options);
    let part=target?.lcNodeProxy?target:null;
    if(!part){
      if(s.phase<4)return 0;
      part=(owner.bodyParts||[]).find(p=>p.lcNodeProxy&&p.lcNodeKey==='core')||null;
    }
    const node=part&&s.nodes[part.lcNodeKey];if(!node||node.destroyed||node.group!==s.phase)return 0;
    const requested=Math.max(0,Number(amount)||0),applied=Math.min(requested,node.hp);if(applied<=0)return 0;
    node.hp=Math.max(0,node.hp-applied);part.hp=node.hp;
    const result=baseDealDamage(owner,applied,options);
    if(node.hp<=.0001&&!owner.dead)destroyNode(owner,node);
    return result;
  };

  function updateStructure(e){
    const s=initializeStructure(e);if(!s)return;
    e.x=s.anchorX;e.y=s.anchorY;e.apexPhase=s.phase;e.timeLock=0;
    syncParts(e);advancePhase(e);
  }
  const baseUpdateEnemies=typeof updateEnemies==='function'?updateEnemies:null;
  if(baseUpdateEnemies)updateEnemies=function updateEnemiesWithLastConstellationStructure(dt){for(const e of state.entities.enemies||[])if(isLC(e))updateStructure(e);return baseUpdateEnemies(dt);};

  function pose(e,def){return{x:def.x*e.r,y:def.y*e.r,r:e.r*def.size};}
  function nodeVisualState(e,def){
    const s=e.lcStructure,node=s?.nodes?.[def.key];if(!s||!node)return'future';
    if(node.destroyed)return'destroyed';if(def.group===s.phase)return'active';if(def.group>s.phase)return'future';return'destroyed';
  }
  function linkAlpha(e,aKey,bKey,layer,entry){
    const s=e.lcStructure,a=s?.nodes?.[aKey],b=s?.nodes?.[bKey];if(!s||!a||!b)return 0;
    if(a.destroyed||b.destroyed){const newest=Math.max(a.destroyedAt||0,b.destroyedAt||0),fade=1-clamp01((nowMs()-newest)/620);return .14*fade;}
    if(layer===s.phase)return .68*entry;
    if(layer===s.phase-1)return .08*entry;
    if(layer>s.phase)return .095*entry;
    return .035*entry;
  }
  function drawLink(e,aKey,bKey,layer,index,t,entryAlpha){
    const aDef=nodeDef(aKey),bDef=nodeDef(bKey);if(!aDef||!bDef)return;const alpha=linkAlpha(e,aKey,bKey,layer,entryAlpha);if(alpha<=.002)return;
    const a=pose(e,aDef),b=pose(e,bDef),active=layer===e.lcStructure.phase;
    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=active?'#dce6ff':'#7588c8';ctx.lineWidth=active?1.75:1.0;ctx.shadowColor='#9fb2ef';ctx.shadowBlur=active?7:2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    if(active){const p=(t*.115+index*.083)%1;ctx.globalAlpha*=.85;ctx.fillStyle='#ffffff';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(lerp(a.x,b.x,p),lerp(a.y,b.y,p),1.6,0,TAU2);ctx.fill();}
    ctx.restore();
  }
  function traceDiamond(r,wide=.52){ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*wide,-r*.12);ctx.lineTo(r*.20,r);ctx.lineTo(-r*wide,r*.18);ctx.closePath();}
  function drawNode(e,def,index,t,entryAlpha){
    const s=e.lcStructure,node=s.nodes[def.key],status=nodeVisualState(e,def),p=pose(e,def);if(status==='destroyed'){
      const fade=1-clamp01((nowMs()-(node.destroyedAt||0))/780);if(fade<=0)return;ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=.18*fade;ctx.strokeStyle='#9aa9da';ctx.rotate(index*.43);ctx.beginPath();ctx.moveTo(-p.r*.7,-p.r*.25);ctx.lineTo(p.r*.65,p.r*.30);ctx.moveTo(-p.r*.35,p.r*.62);ctx.lineTo(p.r*.28,-p.r*.72);ctx.stroke();ctx.restore();return;
    }
    const active=status==='active',future=status==='future',pulse=.5+.5*Math.sin(t*(active?1.65:.55)+index*1.73),baseAlpha=(active?1:.20)*entryAlpha,r=p.r*(active?1+.07*pulse:.82);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate((index%2?1:-1)*(t*(active?.030:.008)+index*.31));ctx.globalAlpha=baseAlpha;
    if(active){const halo=ctx.createRadialGradient(0,0,1,0,0,r*2.8);halo.addColorStop(0,'rgba(242,247,255,.48)');halo.addColorStop(.38,'rgba(151,174,244,.20)');halo.addColorStop(1,'rgba(105,126,208,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r*2.8,0,TAU2);ctx.fill();}
    ctx.shadowColor=active?'#dce6ff':'#7183c1';ctx.shadowBlur=active?18:5;ctx.fillStyle=active?(def.rank>=3?'#f8fbff':'#c8d5ff'):'#39466f';ctx.strokeStyle=active?'#f2f6ff':'#7283ba';ctx.lineWidth=active?1.8:1.0;traceDiamond(r,def.rank>=3?.58:.48);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=baseAlpha*(active?.90:.45);ctx.fillStyle=active?'#ffffff':'#91a0cd';ctx.beginPath();ctx.moveTo(0,-r*.56);ctx.lineTo(r*.18,0);ctx.lineTo(0,r*.50);ctx.lineTo(-r*.14,0);ctx.closePath();ctx.fill();
    if(active){
      const hp=clamp01(node.hp/Math.max(.001,node.maxHp));ctx.rotate(-(index%2?1:-1)*(t*(active?.030:.008)+index*.31));ctx.strokeStyle='rgba(224,233,255,.30)';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(0,0,r*1.62,0,TAU2);ctx.stroke();ctx.strokeStyle='#edf3ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*1.62,-Math.PI/2,-Math.PI/2+TAU2*hp);ctx.stroke();
    }
    ctx.restore();
  }
  function drawCore(e,t,entryAlpha){
    const s=e.lcStructure,node=s.nodes.core,phase=s.phase,awakening=phase===4?ease(clamp01((nowMs()-s.transitionAt)/1150)):0;
    const dormantScale=[.42,.50,.62][Math.max(0,Math.min(2,phase-1))]||.62,scale=phase===4?lerp(.64,1.42,awakening):dormantScale,pulse=.5+.5*Math.sin(t*(phase===4?1.7:.45));
    const r=e.r*scale,alpha=(phase===4?1:.22+.06*phase)*entryAlpha;ctx.save();ctx.globalAlpha=alpha;ctx.rotate(-.08+Math.sin(t*.10)*.018);
    const halo=ctx.createRadialGradient(0,0,2,0,0,r*(phase===4?3.0:2.0));halo.addColorStop(0,phase===4?'rgba(255,255,255,.72)':'rgba(188,204,255,.22)');halo.addColorStop(.42,phase===4?'rgba(143,171,255,.26)':'rgba(116,136,210,.08)');halo.addColorStop(1,'rgba(80,98,180,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r*(phase===4?3:2),0,TAU2);ctx.fill();
    ctx.shadowColor='#e7edff';ctx.shadowBlur=phase===4?30+16*pulse:8;ctx.fillStyle=phase===4?'#f8fbff':'#52618f';ctx.strokeStyle=phase===4?'#ffffff':'#8998c8';ctx.lineWidth=phase===4?2.7:1.2;traceDiamond(r,.62);ctx.fill();ctx.stroke();
    ctx.globalAlpha*=phase===4?.95:.45;ctx.fillStyle=phase===4?'#c5d5ff':'#7584b5';ctx.beginPath();ctx.moveTo(0,-r*.68);ctx.lineTo(r*.25,0);ctx.lineTo(0,r*.68);ctx.lineTo(-r*.20,0);ctx.closePath();ctx.fill();
    if(phase===4){ctx.globalAlpha=alpha*(.30+.18*pulse);ctx.strokeStyle='#cbd8ff';ctx.lineWidth=1.2;for(let ring=0;ring<3;ring++){ctx.save();ctx.rotate((ring%2?1:-1)*t*(.07+ring*.025));ctx.setLineDash([12+ring*4,9+ring*2]);ctx.beginPath();ctx.ellipse(0,0,r*(1.65+ring*.48),r*(1.05+ring*.30),ring*.36,0,TAU2);ctx.stroke();ctx.restore();}ctx.setLineDash([]);const hp=clamp01(node.hp/Math.max(.001,node.maxHp));ctx.globalAlpha=alpha*.9;ctx.lineWidth=2.8;ctx.strokeStyle='#f1f5ff';ctx.beginPath();ctx.arc(0,0,r*1.34,-Math.PI/2,-Math.PI/2+TAU2*hp);ctx.stroke();}
    ctx.restore();
  }
  function drawConstellation(e){
    const s=initializeStructure(e);if(!s)return;const t=e.phase||state.time||0,entry=entryState(e),nodeEntry=entry.active?ease(clamp01((entry.age-.02)/.82)):1,lineEntry=entry.active?ease(clamp01((entry.age-.34)/.82)):1,coreEntry=entry.active?ease(clamp01((entry.age-.96)/.38)):1;
    ctx.save();const halo=ctx.createRadialGradient(0,0,e.r*.25,0,0,e.r*6.7);halo.addColorStop(0,'rgba(143,164,235,.050)');halo.addColorStop(.55,'rgba(83,104,183,.022)');halo.addColorStop(1,'rgba(60,76,150,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,e.r*6.7,0,TAU2);ctx.fill();
    for(let i=0;i<LINKS.length;i++){const [a,b,layer]=LINKS[i],stagger=entry.active?ease(clamp01((entry.age-.30-i*.012)/.72)):1;drawLink(e,a,b,layer,i,t,lineEntry*stagger);}
    for(let i=0;i<NODES.length-1;i++){const def=NODES[i],stagger=entry.active?ease(clamp01((nodeEntry-i*.042)/.48)):1;drawNode(e,def,i,t,stagger);}
    drawCore(e,t,coreEntry);ctx.restore();
  }

  drawEliteShape=function lastConstellationProductionShape(e){const f=e?.eliteForm||e?.apexForm||e?.variant;if(f===FORM){ctx.save();drawConstellation(e);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.setLineDash([]);ctx.restore();return;}return baseDrawEliteShape(e);};

  window.stackfallLastConstellationProductionDiagnostics=()=>{
    const e=state.entities.enemies?.find(isLC)||null;if(!e)return null;const s=initializeStructure(e),active=phaseNodes(e,s.phase).filter(n=>!n.destroyed);
    return{version:'v2',phase:s.phase,totalNodes:11,distribution:{outer:4,middle:3,inner:3,core:1},activeNodes:active.map(n=>n.key),destroyedNodes:Object.values(s.nodes).filter(n=>n.destroyed).map(n=>n.key),coreActive:s.phase===4,anchored:true,patternsOwned:false};
  };
})();