// Last Constellation production structure v2.
// Eleven-node stellar superstructure: 4 outer -> 3 middle -> 3 inner -> 1 core.
// No shared breathing/pulse transform is used here. The structure is world-fixed and scale-stable.
(()=>{
  if(window.stackfallLastConstellationProduction==='v2')return;
  window.stackfallLastConstellationProduction='v2';
  const FORM='lastconstellation',TAU=Math.PI*2;
  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(!baseDrawEliteShape)return;
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const ease=t=>{t=clamp01(t);return t*t*(3-2*t);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const nowMs=()=>performance.now();

  // World-scale layout. Outer nodes deliberately extend beyond a normal viewport.
  // It is a broken, asymmetric stellar lattice rather than a rectangle or closed polygon.
  const NODES=[
    {key:'outer-1',group:1,x:-17.6,y:-7.9,size:1.08,rank:2,rot:-.38},
    {key:'outer-2',group:1,x:5.4,y:-12.1,size:1.20,rank:3,rot:.22},
    {key:'outer-3',group:1,x:18.0,y:2.8,size:1.12,rank:2,rot:.72},
    {key:'outer-4',group:1,x:-9.7,y:11.4,size:1.16,rank:2,rot:-.10},
    {key:'middle-1',group:2,x:-9.2,y:-3.8,size:.98,rank:2,rot:.34},
    {key:'middle-2',group:2,x:9.4,y:-5.6,size:1.04,rank:3,rot:-.28},
    {key:'middle-3',group:2,x:2.6,y:8.1,size:1.00,rank:2,rot:.58},
    {key:'inner-1',group:3,x:-5.0,y:-.9,size:.92,rank:2,rot:-.48},
    {key:'inner-2',group:3,x:4.7,y:-.3,size:.96,rank:2,rot:.40},
    {key:'inner-3',group:3,x:-.9,y:4.7,size:1.02,rank:3,rot:.08},
    {key:'core',group:4,x:0,y:0,size:2.35,rank:4,rot:0}
  ];
  const INDEX=Object.fromEntries(NODES.map((n,i)=>[n.key,i]));
  const nodeDef=key=>NODES[INDEX[key]]||null;

  // Hierarchical branches only. No outer rectangle and no decorative screen-space web.
  const LINKS=[
    ['outer-1','middle-1',1],['outer-1','middle-3',1],
    ['outer-2','middle-1',1],['outer-2','middle-2',1],
    ['outer-3','middle-2',1],['outer-3','middle-3',1],
    ['outer-4','middle-1',1],['outer-4','middle-3',1],
    ['middle-1','inner-1',2],['middle-1','inner-3',2],
    ['middle-2','inner-2',2],['middle-2','inner-3',2],
    ['middle-3','inner-1',2],['middle-3','inner-2',2],
    ['inner-1','core',3],['inner-2','core',3],['inner-3','core',3]
  ];
  const GROUP_COUNTS={1:4,2:3,3:3,4:1};
  const GROUP_POOL={1:.25,2:.25,3:.25,4:.25};
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);

  function entryState(e){
    const started=Number(e?.apexEntryRevealStartedAt);
    if(Number.isFinite(started)){const age=Math.max(0,(nowMs()-started)/1000);return{active:age<2.15,age};}
    const tr=state.realmTransition;
    if(tr?.owner==='apex-entry'&&(state.apexArena?.form||state.pendingApexForm)===FORM){
      const p=clamp01((Number(tr.elapsed)||0)/Math.max(.001,Number(tr.duration)||1));
      return{active:true,age:Math.max(0,(p-.22)*2.7)};
    }
    return{active:false,age:9};
  }

  function initializeStructure(e){
    if(!isLC(e))return null;
    if(e.lcStructure?.version===2)return e.lcStructure;
    const total=Math.max(1,Number(e.maxHp)||Number(e.hp)||1),nodes={};
    for(const def of NODES){
      const max=total*GROUP_POOL[def.group]/GROUP_COUNTS[def.group];
      nodes[def.key]={key:def.key,group:def.group,hp:max,maxHp:max,destroyed:false,destroyedAt:0};
    }
    e.lcStructure={version:2,phase:1,nodes,createdAt:nowMs(),transitionAt:nowMs(),anchorX:e.x,anchorY:e.y};
    e.apexPhase=1;e.apexPhaseEntered=1;
    if(typeof defineBossBodyParts==='function'){
      defineBossBodyParts(e,NODES.map(def=>({
        key:`lc-${def.key}`,
        label:def.group===4?'LAST CORE':`CONSTELLATION ${def.key.toUpperCase()}`,
        dx:def.x*e.r,dy:def.y*e.r,
        r:Math.max(14,e.r*(def.group===4?.92:def.size*.90)),
        active:def.group===1,visible:def.group===1
      })));
      for(const part of e.bodyParts||[]){
        const key=String(part.key||'').replace(/^lc-/,'');
        if(!nodes[key])continue;
        part.lcNodeProxy=true;part.lcNodeKey=key;part.lcNodeGroup=nodes[key].group;
      }
    }
    syncParts(e);return e.lcStructure;
  }

  function phaseNodes(e,phase=e.lcStructure?.phase||1){const s=e.lcStructure;return s?Object.values(s.nodes).filter(n=>n.group===phase):[];}
  function syncParts(e){
    const s=e.lcStructure;if(!s||!Array.isArray(e.bodyParts))return;
    for(const part of e.bodyParts){
      if(!part.lcNodeProxy)continue;
      const def=nodeDef(part.lcNodeKey),node=s.nodes[part.lcNodeKey];if(!def||!node)continue;
      part.dx=def.x*e.r;part.dy=def.y*e.r;
      part.r=Math.max(14,e.r*(def.group===4&&s.phase===4?2.0:def.size*.90));
      part.active=!node.destroyed&&node.group===s.phase;part.visible=part.active;part.dead=!part.active;
      part.x=e.x+part.dx;part.y=e.y+part.dy;part.hp=node.hp;part.maxHp=node.maxHp;
    }
  }

  function advancePhase(e){
    const s=e.lcStructure;if(!s||s.phase>=4)return;
    if(phaseNodes(e,s.phase).some(n=>!n.destroyed))return;
    s.phase++;s.transitionAt=nowMs();e.apexPhase=s.phase;e.apexPhaseEntered=s.phase;
    e.skillCd=e.burstCd=e.pulseCd=e.signatureCd=e.apexVariantCd=e.apexSetpieceCd=999;
    state.camera.shake=Math.max(state.camera.shake,7+s.phase*1.7);state.flash=Math.max(state.flash,.075+s.phase*.02);
    if(typeof shockwave==='function')shockwave(e.x,e.y,'#dce6ff',120+s.phase*42,.42+s.phase*.04,2.8+s.phase*.4);
    if(typeof audio?.tone==='function')audio.tone(82+s.phase*18,.28,'sine',.014,20);
    syncParts(e);
  }

  function destroyNode(e,node){
    if(node.destroyed)return;
    node.destroyed=true;node.hp=0;node.destroyedAt=nowMs();
    const def=nodeDef(node.key),x=e.x+(def?.x||0)*e.r,y=e.y+(def?.y||0)*e.r;
    state.camera.shake=Math.max(state.camera.shake,node.group===3?9:7);state.flash=Math.max(state.flash,node.group===3?.11:.08);
    if(typeof shockwave==='function')shockwave(x,y,node.group===3?'#eef3ff':'#aebfff',86+node.group*18,.38,2.5+node.group*.4);
    if(typeof spawnParticle==='function')for(let i=0;i<14+node.group*4;i++)spawnParticle(x+rand(-16,16),y+rand(-16,16),i%3?'#b7c9ff':'#ffffff',1,42+Math.random()*56,2.2+Math.random()*2);
    syncParts(e);advancePhase(e);
  }

  // World-fixed superstructure: never roams with the player.
  const baseApexMotionVelocity=typeof apexMotionVelocity==='function'?apexMotionVelocity:null;
  if(baseApexMotionVelocity)apexMotionVelocity=function lastConstellationAnchoredMotion(e){
    if(isLC(e)){const s=initializeStructure(e);if(s){e.x=s.anchorX;e.y=s.anchorY;}return{x:0,y:0};}
    return baseApexMotionVelocity(e);
  };

  // Only the currently exposed layer is damageable. P4 exposes the core.
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
    const node=part&&s.nodes[part.lcNodeKey];
    if(!node||node.destroyed||node.group!==s.phase)return 0;
    const requested=Math.max(0,Number(amount)||0),applied=Math.min(requested,node.hp);
    if(applied<=0)return 0;
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
  if(baseUpdateEnemies)updateEnemies=function updateEnemiesWithLastConstellationStructure(dt){
    for(const e of state.entities.enemies||[])if(isLC(e))updateStructure(e);
    return baseUpdateEnemies(dt);
  };

  function pose(e,def){return{x:def.x*e.r,y:def.y*e.r,r:e.r*def.size};}
  function nodeVisualState(e,def){
    const s=e.lcStructure,node=s?.nodes?.[def.key];if(!s||!node)return'future';
    if(node.destroyed)return'destroyed';if(def.group===s.phase)return'active';if(def.group>s.phase)return'future';return'destroyed';
  }
  function linkAlpha(e,aKey,bKey,layer,entry){
    const s=e.lcStructure,a=s?.nodes?.[aKey],b=s?.nodes?.[bKey];if(!s||!a||!b)return 0;
    if(a.destroyed||b.destroyed){const newest=Math.max(a.destroyedAt||0,b.destroyedAt||0);return .16*(1-clamp01((nowMs()-newest)/700));}
    if(layer===s.phase)return .82*entry;
    if(layer>s.phase)return .13*entry;
    return .04*entry;
  }
  function drawLink(e,aKey,bKey,layer,index,t,entryAlpha){
    const aDef=nodeDef(aKey),bDef=nodeDef(bKey);if(!aDef||!bDef)return;
    const alpha=linkAlpha(e,aKey,bKey,layer,entryAlpha);if(alpha<=.002)return;
    const a=pose(e,aDef),b=pose(e,bDef),active=layer===e.lcStructure.phase;
    ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';
    ctx.strokeStyle=active?'#e3eaff':'#6879b2';ctx.lineWidth=active?2.6:1.2;
    ctx.shadowColor='#9fb2ef';ctx.shadowBlur=active?10:2;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    if(active){
      const p=(t*.075+index*.137)%1;
      ctx.globalAlpha=alpha*.9;ctx.fillStyle='#ffffff';ctx.shadowBlur=12;
      ctx.beginPath();ctx.arc(lerp(a.x,b.x,p),lerp(a.y,b.y,p),2.1,0,TAU);ctx.fill();
    }
    ctx.restore();
  }

  function traceShard(r,rank){
    const w=rank>=3?.70:.58;
    ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*w,-r*.18);ctx.lineTo(r*.28,r*.92);ctx.lineTo(-r*w*.86,r*.28);ctx.lineTo(-r*.32,-r*.56);ctx.closePath();
  }
  function drawNode(e,def,index,t,entryAlpha){
    const s=e.lcStructure,node=s.nodes[def.key],status=nodeVisualState(e,def),p=pose(e,def);
    if(status==='destroyed'){
      const fade=1-clamp01((nowMs()-(node.destroyedAt||0))/900);if(fade<=0)return;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(def.rot);ctx.globalAlpha=.28*fade;ctx.strokeStyle='#aab9e6';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-p.r*.85,-p.r*.34);ctx.lineTo(p.r*.76,p.r*.36);ctx.moveTo(-p.r*.42,p.r*.78);ctx.lineTo(p.r*.34,-p.r*.88);ctx.stroke();ctx.restore();return;
    }
    const active=status==='active',baseAlpha=(active?1:.17)*entryAlpha,r=p.r*(active?1:.88);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(def.rot);ctx.globalAlpha=baseAlpha;
    if(active){
      const halo=ctx.createRadialGradient(0,0,r*.08,0,0,r*3.2);
      halo.addColorStop(0,'rgba(250,252,255,.64)');halo.addColorStop(.34,'rgba(153,177,248,.28)');halo.addColorStop(1,'rgba(87,108,190,0)');
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r*3.2,0,TAU);ctx.fill();
      ctx.globalAlpha=baseAlpha;
    }
    ctx.shadowColor=active?'#dce6ff':'#7183c1';ctx.shadowBlur=active?24:5;
    ctx.fillStyle=active?(def.rank>=3?'#f9fbff':'#cbd7ff'):'#39466f';ctx.strokeStyle=active?'#f5f7ff':'#7283ba';ctx.lineWidth=active?2.6:1.1;
    traceShard(r,def.rank);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.globalAlpha=baseAlpha*(active?.96:.42);ctx.fillStyle=active?'#ffffff':'#91a0cd';
    ctx.beginPath();ctx.moveTo(-r*.08,-r*.64);ctx.lineTo(r*.28,-r*.05);ctx.lineTo(r*.02,r*.60);ctx.lineTo(-r*.24,r*.05);ctx.closePath();ctx.fill();
    if(active){
      const hp=clamp01(node.hp/Math.max(.001,node.maxHp));
      ctx.rotate(-def.rot);ctx.strokeStyle='rgba(230,237,255,.34)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*1.48,0,TAU);ctx.stroke();
      ctx.strokeStyle='#f1f5ff';ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(0,0,r*1.48,-Math.PI/2,-Math.PI/2+TAU*hp);ctx.stroke();
    }
    ctx.restore();
  }

  function drawCore(e,t,entryAlpha){
    const s=e.lcStructure,node=s.nodes.core,phase=s.phase;
    const awakening=phase===4?ease(clamp01((nowMs()-s.transitionAt)/1000)):0;
    const dormant=[.52,.68,.86][Math.max(0,Math.min(2,phase-1))]||.86;
    const scale=phase===4?lerp(.90,2.35,awakening):dormant;
    const r=e.r*scale,alpha=(phase===4?1:.15+.045*phase)*entryAlpha;
    ctx.save();ctx.globalAlpha=alpha;
    const halo=ctx.createRadialGradient(0,0,r*.08,0,0,r*(phase===4?3.6:2.3));
    halo.addColorStop(0,phase===4?'rgba(255,255,255,.92)':'rgba(197,211,255,.26)');
    halo.addColorStop(.34,phase===4?'rgba(146,176,255,.34)':'rgba(104,125,203,.10)');halo.addColorStop(1,'rgba(65,82,160,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r*(phase===4?3.6:2.3),0,TAU);ctx.fill();
    ctx.shadowColor='#e7edff';ctx.shadowBlur=phase===4?38:8;ctx.fillStyle=phase===4?'#fbfcff':'#52618f';ctx.strokeStyle=phase===4?'#ffffff':'#8998c8';ctx.lineWidth=phase===4?3.4:1.3;
    ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.68,-r*.16);ctx.lineTo(r*.24,r*.94);ctx.lineTo(-r*.66,r*.25);ctx.lineTo(-r*.30,-r*.58);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    if(phase===4){
      const hp=clamp01(node.hp/Math.max(.001,node.maxHp));ctx.globalAlpha=alpha*.40;ctx.strokeStyle='#cbd8ff';ctx.lineWidth=1.5;
      for(let ring=0;ring<3;ring++){ctx.save();ctx.rotate((ring%2?1:-1)*t*(.035+ring*.012));ctx.setLineDash([18+ring*6,12+ring*3]);ctx.beginPath();ctx.ellipse(0,0,r*(1.55+ring*.48),r*(.92+ring*.30),ring*.30,0,TAU);ctx.stroke();ctx.restore();}
      ctx.setLineDash([]);ctx.globalAlpha=alpha*.95;ctx.lineWidth=3;ctx.strokeStyle='#f3f6ff';ctx.beginPath();ctx.arc(0,0,r*1.30,-Math.PI/2,-Math.PI/2+TAU*hp);ctx.stroke();
    }
    ctx.restore();
  }

  function drawConstellation(e){
    const s=initializeStructure(e);if(!s)return;
    const t=state.time||0,entry=entryState(e);
    const nodeEntry=entry.active?ease(clamp01((entry.age-.03)/1.0)):1;
    const lineEntry=entry.active?ease(clamp01((entry.age-.40)/.90)):1;
    const coreEntry=entry.active?ease(clamp01((entry.age-1.10)/.42)):1;
    ctx.save();
    const halo=ctx.createRadialGradient(0,0,e.r*.3,0,0,e.r*19.5);
    halo.addColorStop(0,'rgba(140,161,235,.050)');halo.addColorStop(.50,'rgba(75,95,173,.020)');halo.addColorStop(1,'rgba(50,65,140,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,e.r*19.5,0,TAU);ctx.fill();
    for(let i=0;i<LINKS.length;i++){
      const [a,b,layer]=LINKS[i],stagger=entry.active?ease(clamp01((entry.age-.34-i*.018)/.82)):1;
      drawLink(e,a,b,layer,i,t,lineEntry*stagger);
    }
    for(let i=0;i<NODES.length-1;i++){
      const def=NODES[i],stagger=entry.active?ease(clamp01((nodeEntry-i*.055)/.52)):1;
      drawNode(e,def,i,t,stagger);
    }
    drawCore(e,t,coreEntry);ctx.restore();
  }

  drawEliteShape=function lastConstellationProductionShape(e){
    const f=e?.eliteForm||e?.apexForm||e?.variant;
    if(f===FORM){ctx.save();drawConstellation(e);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.setLineDash([]);ctx.restore();return;}
    return baseDrawEliteShape(e);
  };

  window.stackfallLastConstellationProductionDiagnostics=()=>{
    const e=state.entities.enemies?.find(isLC)||null;if(!e)return null;
    const s=initializeStructure(e),active=phaseNodes(e,s.phase).filter(n=>!n.destroyed);
    return{
      version:'v2',phase:s.phase,totalNodes:11,distribution:{outer:4,middle:3,inner:3,core:1},
      activeNodes:active.map(n=>n.key),destroyedNodes:Object.values(s.nodes).filter(n=>n.destroyed).map(n=>n.key),
      coreActive:s.phase===4,anchored:true,patternsOwned:false,sharedScalePulse:false,
      structureSpanR:{x:35.6,y:23.5},outerMaxRadiusR:18.2
    };
  };
})();