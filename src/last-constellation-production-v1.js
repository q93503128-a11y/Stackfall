// Last Constellation production structure v2.
// Eleven-node stellar superstructure: 4 outer -> 3 middle -> 3 inner -> 1 core.
// Node pools are the authoritative health model; the owner HP bar is their exact sum.
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
  const LINKS=[
    ['outer-1','middle-1',1],['outer-1','middle-3',1],['outer-2','middle-1',1],['outer-2','middle-2',1],
    ['outer-3','middle-2',1],['outer-3','middle-3',1],['outer-4','middle-1',1],['outer-4','middle-3',1],
    ['middle-1','inner-1',2],['middle-1','inner-3',2],['middle-2','inner-2',2],['middle-2','inner-3',2],
    ['middle-3','inner-1',2],['middle-3','inner-2',2],['inner-1','core',3],['inner-2','core',3],['inner-3','core',3]
  ];
  const GROUP_COUNTS={1:4,2:3,3:3,4:1},GROUP_POOL={1:.25,2:.25,3:.25,4:.25};
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);

  function entryState(e){
    const started=Number(e?.apexEntryRevealStartedAt);if(Number.isFinite(started)){const age=Math.max(0,(nowMs()-started)/1000);return{active:age<2.15,age};}
    const tr=state.realmTransition;if(tr?.owner==='apex-entry'&&(state.apexArena?.form||state.pendingApexForm)===FORM){const p=clamp01((Number(tr.elapsed)||0)/Math.max(.001,Number(tr.duration)||1));return{active:true,age:Math.max(0,(p-.22)*2.7)};}return{active:false,age:9};
  }
  function remainingHealth(s){let hp=0,maxHp=0;for(const n of Object.values(s?.nodes||{})){hp+=Math.max(0,Number(n.hp)||0);maxHp+=Math.max(0,Number(n.maxHp)||0);}return{hp,maxHp};}
  function syncOwnerHealth(e){const s=e?.lcStructure;if(!s)return null;const h=remainingHealth(s);e.hp=h.hp;e.maxHp=h.maxHp||s.totalMaxHp||1;return h;}

  function initializeStructure(e){
    if(!isLC(e))return null;
    if(e.lcStructure?.version===2){syncOwnerHealth(e);return e.lcStructure;}
    const total=Math.max(1,Number(e.maxHp)||Number(e.hp)||1),nodes={};
    for(const def of NODES){const max=total*GROUP_POOL[def.group]/GROUP_COUNTS[def.group];nodes[def.key]={key:def.key,group:def.group,hp:max,maxHp:max,destroyed:false,destroyedAt:0};}
    e.lcStructure={version:2,phase:1,nodes,totalMaxHp:total,createdAt:nowMs(),transitionAt:nowMs(),anchorX:e.x,anchorY:e.y};e.apexPhase=1;e.apexPhaseEntered=1;
    if(typeof defineBossBodyParts==='function'){
      defineBossBodyParts(e,NODES.map(def=>({key:`lc-${def.key}`,label:def.group===4?'LAST CORE':`CONSTELLATION ${def.key.toUpperCase()}`,dx:def.x*e.r,dy:def.y*e.r,r:Math.max(14,e.r*(def.group===4?.92:def.size*.90)),active:def.group===1,visible:def.group===1})));
      for(const part of e.bodyParts||[]){const key=String(part.key||'').replace(/^lc-/,'');if(!nodes[key])continue;part.lcNodeProxy=true;part.lcNodeKey=key;part.lcNodeGroup=nodes[key].group;}
    }
    syncParts(e);syncOwnerHealth(e);return e.lcStructure;
  }
  function phaseNodes(e,phase=e.lcStructure?.phase||1){const s=e.lcStructure;return s?Object.values(s.nodes).filter(n=>n.group===phase):[];}
  function syncParts(e){
    const s=e.lcStructure;if(!s||!Array.isArray(e.bodyParts))return;
    for(const part of e.bodyParts){if(!part.lcNodeProxy)continue;const def=nodeDef(part.lcNodeKey),node=s.nodes[part.lcNodeKey];if(!def||!node)continue;part.dx=def.x*e.r;part.dy=def.y*e.r;part.r=Math.max(14,e.r*(def.group===4&&s.phase===4?2.0:def.size*.90));part.active=!node.destroyed&&node.group===s.phase;part.visible=part.active;part.dead=!part.active;part.x=e.x+part.dx;part.y=e.y+part.dy;part.hp=node.hp;part.maxHp=node.maxHp;}
  }
  function advancePhase(e){
    const s=e.lcStructure;if(!s||s.phase>=4||phaseNodes(e,s.phase).some(n=>!n.destroyed))return;
    s.phase++;s.transitionAt=nowMs();e.apexPhase=s.phase;e.apexPhaseEntered=s.phase;e.skillCd=e.burstCd=e.pulseCd=e.signatureCd=e.apexVariantCd=e.apexSetpieceCd=999;
    state.camera.shake=Math.max(state.camera.shake,7+s.phase*1.7);state.flash=Math.max(state.flash,.075+s.phase*.02);if(typeof shockwave==='function')shockwave(e.x,e.y,'#dce6ff',120+s.phase*42,.42+s.phase*.04,2.8+s.phase*.4);if(typeof audio?.tone==='function')audio.tone(82+s.phase*18,.28,'sine',.014,20);syncParts(e);
  }
  function destroyNode(e,node){
    if(node.destroyed)return;node.destroyed=true;node.hp=0;node.destroyedAt=nowMs();const def=nodeDef(node.key),x=e.x+(def?.x||0)*e.r,y=e.y+(def?.y||0)*e.r;
    state.camera.shake=Math.max(state.camera.shake,node.group===3?9:7);state.flash=Math.max(state.flash,node.group===3?.11:.08);if(typeof shockwave==='function')shockwave(x,y,node.group===3?'#eef3ff':'#aebfff',86+node.group*18,.38,2.5+node.group*.4);if(typeof spawnParticle==='function')for(let i=0;i<14+node.group*4;i++)spawnParticle(x+rand(-16,16),y+rand(-16,16),i%3?'#b7c9ff':'#ffffff',1,42+Math.random()*56,2.2+Math.random()*2);syncParts(e);advancePhase(e);
  }

  registerApexCombatService(FORM).motion=function lastConstellationAnchoredMotion(e,out){const s=initializeStructure(e);if(s){e.x=s.anchorX;e.y=s.anchorY;}out.x=0;out.y=0;return true;};

  // Route the real, fully modified damage through the existing damage stack, but temporarily use
  // the exposed node as the owner's health/FX surface. This preserves all upstream damage modifiers
  // while preventing dormant core FX and keeping owner HP exactly equal to the sum of node HP.
  const baseDealDamage=typeof dealDamage==='function'?dealDamage:null;
  if(baseDealDamage)dealDamage=function lastConstellationNodeDamage(target,amount,options={}){
    const owner=target?.lcNodeProxy?target.owner:target;if(!isLC(owner))return baseDealDamage(target,amount,options);
    const s=initializeStructure(owner);if(!s)return baseDealDamage(target,amount,options);let part=target?.lcNodeProxy?target:null;
    if(!part){if(s.phase<4)return;part=(owner.bodyParts||[]).find(p=>p.lcNodeProxy&&p.lcNodeKey==='core')||null;}
    const node=part&&s.nodes[part.lcNodeKey];if(!node||node.destroyed||node.group!==s.phase)return;
    const requested=Math.max(0,Number(amount)||0);if(requested<=0)return;
    const before=node.hp,saved={x:owner.x,y:owner.y,r:owner.r,hp:owner.hp,maxHp:owner.maxHp,dead:owner.dead};let result,tempAfter=before;
    owner.x=part.x;owner.y=part.y;owner.r=part.r;owner.hp=before;owner.maxHp=node.maxHp;owner.dead=false;
    try{result=baseDealDamage(owner,requested,{...options,deferKill:true});tempAfter=Number(owner.hp);}finally{owner.x=saved.x;owner.y=saved.y;owner.r=saved.r;owner.dead=saved.dead;}
    const inflicted=Math.min(before,Math.max(0,before-(Number.isFinite(tempAfter)?tempAfter:before)));node.hp=Math.max(0,before-inflicted);part.hp=node.hp;
    if(node.hp<=.0001)destroyNode(owner,node);const health=syncOwnerHealth(owner);syncParts(owner);
    if(health&&health.hp<=.0001&&!owner.dead)killEnemy(owner,options);
    return result;
  };

  function updateStructure(e){const s=initializeStructure(e);if(!s)return;e.x=s.anchorX;e.y=s.anchorY;e.apexPhase=s.phase;e.timeLock=0;syncParts(e);advancePhase(e);syncOwnerHealth(e);}
  const baseUpdateEnemies=typeof updateEnemies==='function'?updateEnemies:null;
  if(baseUpdateEnemies)updateEnemies=function updateEnemiesWithLastConstellationStructure(dt){for(const e of state.entities.enemies||[])if(isLC(e))updateStructure(e);return baseUpdateEnemies(dt);};

  // Fallback rendering. Presentation v3 replaces this once loaded, but keeping a production-safe
  // fallback prevents an invisible encounter if the presentation layer is delayed.
  function pose(e,def){return{x:def.x*e.r,y:def.y*e.r,r:e.r*def.size};}
  function nodeVisualState(e,def){const s=e.lcStructure,node=s?.nodes?.[def.key];if(!s||!node)return'future';if(node.destroyed)return'destroyed';if(def.group===s.phase)return'active';if(def.group>s.phase)return'future';return'destroyed';}
  function traceShard(r,rank){const w=rank>=3?.70:.58;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*w,-r*.18);ctx.lineTo(r*.28,r*.92);ctx.lineTo(-r*w*.86,r*.28);ctx.lineTo(-r*.32,-r*.56);ctx.closePath();}
  function drawFallback(e){
    const s=initializeStructure(e);if(!s)return;const entry=entryState(e),entryAlpha=entry.active?ease(clamp01(entry.age/1.3)):1;ctx.save();
    for(const [aKey,bKey,layer] of LINKS){const aDef=nodeDef(aKey),bDef=nodeDef(bKey),a=s.nodes[aKey],b=s.nodes[bKey];if(!aDef||!bDef||a.destroyed||b.destroyed)continue;const pa=pose(e,aDef),pb=pose(e,bDef),active=layer===s.phase;ctx.globalAlpha=(active?.78:.10)*entryAlpha;ctx.strokeStyle=active?'#e3eaff':'#6879b2';ctx.lineWidth=active?2.6:1.1;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();}
    for(const def of NODES){const node=s.nodes[def.key],status=nodeVisualState(e,def);if(status==='destroyed')continue;const p=pose(e,def),active=status==='active',r=p.r*(def.group===4&&s.phase===4?1.55:active?1:.82);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(def.rot);ctx.globalAlpha=(active?1:.16)*entryAlpha;ctx.shadowColor='#dce6ff';ctx.shadowBlur=active?18:4;ctx.fillStyle=active?'#e9efff':'#39466f';ctx.strokeStyle=active?'#ffffff':'#7283ba';ctx.lineWidth=active?2.5:1.1;traceShard(r,def.rank);ctx.fill();ctx.stroke();if(active){const hp=clamp01(node.hp/Math.max(.001,node.maxHp));ctx.shadowBlur=0;ctx.rotate(-def.rot);ctx.strokeStyle='#f1f5ff';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,r*1.42,-Math.PI/2,-Math.PI/2+TAU*hp);ctx.stroke();}ctx.restore();}
    ctx.restore();
  }
  drawEliteShape=function lastConstellationProductionShape(e){const f=e?.eliteForm||e?.apexForm||e?.variant;if(f===FORM){drawFallback(e);return;}return baseDrawEliteShape(e);};

  // The ordinary enemy renderer culls by owner-center ±180 px. Last Constellation spans ~23 radii,
  // so render it manually only when the center is culled but the world-scale structure still intersects the viewport.
  function structureIntersectsViewport(e){const sx=e.x-player.x+vw/2,sy=e.y-player.y+vh/2,r=Math.max(240,e.r*23.5),dx=sx<0?-sx:sx>vw?sx-vw:0,dy=sy<0?-sy:sy>vh?sy-vh:0;return dx*dx+dy*dy<=r*r;}
  const baseDrawEnemiesWide=typeof drawEnemies==='function'?drawEnemies:null;
  if(baseDrawEnemiesWide)drawEnemies=function drawEnemiesWithLastConstellationWideCulling(){
    const result=baseDrawEnemiesWide(),e=state.entities.enemies?.find(isLC)||null;if(!e||state.realmTransition?.owner==='apex-entry')return result;
    const sx=e.x-player.x+vw/2,sy=e.y-player.y+vh/2,centerWouldRender=sx>=-180&&sx<=vw+180&&sy>=-180&&sy<=vh+180;
    if(centerWouldRender||!structureIntersectsViewport(e))return result;ctx.save();ctx.translate(sx,sy);ctx.shadowBlur=0;ctx.globalAlpha=1;drawEliteShape(e);ctx.restore();return result;
  };

  window.stackfallLastConstellationProductionDiagnostics=()=>{
    const e=state.entities.enemies?.find(isLC)||null;if(!e)return null;const s=initializeStructure(e),active=phaseNodes(e,s.phase).filter(n=>!n.destroyed),health=remainingHealth(s);
    return{version:'v2',revision:3,phase:s.phase,totalNodes:11,distribution:{outer:4,middle:3,inner:3,core:1},activeNodes:active.map(n=>n.key),destroyedNodes:Object.values(s.nodes).filter(n=>n.destroyed).map(n=>n.key),coreActive:s.phase===4,anchored:true,patternsOwned:false,sharedScalePulse:false,ownerHp:Math.max(0,e.hp),nodeHpSum:health.hp,totalMaxHp:health.maxHp,healthSynchronized:Math.abs(e.hp-health.hp)<.001,wideWorldCulling:true,structureSpanR:{x:35.6,y:23.5},outerMaxRadiusR:18.2};
  };

})();
