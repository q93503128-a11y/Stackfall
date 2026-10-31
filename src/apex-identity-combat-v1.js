// Apex combat identity pass.
// Keeps the approved boss silhouettes and current damage model, but makes targeting and attack
// presentation match the visible boss identity instead of the abandoned Reborn multipart prototype.
(()=>{
  if(window.stackfallApexIdentityCombat==='v1')return;
  window.stackfallApexIdentityCombat='v1';

  const STYLE_PREFIX='apex-id:';
  const FORGE_METEOR=STYLE_PREFIX+'forge-meteor';
  const FORGE_PRESSURE=STYLE_PREFIX+'forge-pressure';
  const FORGE_FLARE=STYLE_PREFIX+'forge-flare';
  const CONSTELLATION_LINK=STYLE_PREFIX+'constellation-link';
  const CONSTELLATION_CUT=STYLE_PREFIX+'constellation-cut';
  const CUSTOM_TELEGRAPH_BUFFER=[];
  const ORDINARY_TELEGRAPH_BUFFER=[];

  function activeApex(form){
    return state.entities.enemies.find(e=>e&&!e.dead&&e.kind==='apex'&&(e.apexForm||e.eliteForm)===form)||null;
  }
  function finite(v,fallback=0){return Number.isFinite(v)?v:fallback;}
  function screenPoint(x,y){return typeof worldToScreen==='function'?worldToScreen(x,y):{x:x-player.x+vw/2,y:y-player.y+vh/2};}
  function telegraphRoom(){const list=state.entities.telegraphs,cap=typeof entityCap==='function'?entityCap('telegraphs'):90;if(list.length>=cap)list.shift();return list;}
  function identityCircle(x,y,r,damage,color,life,impactStyle,meta={}){
    const list=telegraphRoom(),duration=Math.max(.12,finite(life,.8));
    const t={type:'circle',x,y,r:Math.max(4,finite(r,40)),life:duration,max:duration,damage:Math.max(0,finite(damage,0)),color:color||'#fff',impactStyle,phase:Math.random()*TAU,...meta};
    list.push(t);return t;
  }
  function identityLine(x1,y1,x2,y2,width,damage,color,life,impactStyle,meta={}){
    const list=telegraphRoom(),duration=Math.max(.12,finite(life,.8)),dx=x2-x1,dy=y2-y1;
    const t={type:'line',x:x1,y:y1,a:Math.atan2(dy,dx),length:Math.hypot(dx,dy),width:Math.max(2,finite(width,12)),life:duration,max:duration,damage:Math.max(0,finite(damage,0)),color:color||'#fff',impactStyle,phase:Math.random()*TAU,...meta};
    list.push(t);return t;
  }
  function isIdentityTelegraph(t){return typeof t?.impactStyle==='string'&&t.impactStyle.startsWith(STYLE_PREFIX);}

  // ---------------------------------------------------------------------------
  // 1) Chronophage targeting: visible clock body is the combat target.
  // ---------------------------------------------------------------------------
  // The old Reborn prototype created five invisible body-part proxies hundreds of pixels away from
  // the clock body. boss-body-parts.js correctly aimed weapons at those proxies, but the approved
  // visual no longer renders them. Remove that stale collision/target layer after Reborn setup so
  // all automatic weapons aim at the visible owner entity instead.
  const baseEnsureRebornAtroposIdentity=typeof ensureRebornAtropos==='function'?ensureRebornAtropos:null;
  if(baseEnsureRebornAtroposIdentity){
    ensureRebornAtropos=function ensureClockworkAtroposTargeting(e){
      const ok=baseEnsureRebornAtroposIdentity(e);
      if(ok&&e?.apexForm==='chronophage'&&Array.isArray(e.bodyParts)){
        e.bodyParts=null;
        if(e.atroposReborn)e.atroposReborn.clockworkTargeting=true;
        if(typeof registerBossPartTargets==='function')registerBossPartTargets();
      }
      return ok;
    };
  }

  // ---------------------------------------------------------------------------
  // 2) Omega: keep circle collision where useful, replace generic circles visually.
  // ---------------------------------------------------------------------------
  // Existing Starforge numbers remain intact. While Omega is active, its ordinary addCircle calls
  // become furnace/pressure telegraphs with the same radius, lifetime and damage.
  const baseAddCircleIdentity=typeof addCircle==='function'?addCircle:null;
  if(baseAddCircleIdentity){
    addCircle=function addIdentityAwareCircle(x,y,r,damage,color,life=1.1){
      const omega=activeApex('starforge');
      if(omega&&state.mode==='playing'){
        const style=r>=70?FORGE_PRESSURE:FORGE_METEOR;
        return identityCircle(x,y,r,damage,color,life,style,{apexForm:'starforge'});
      }
      return baseAddCircleIdentity(x,y,r,damage,color,life);
    };
  }

  function omegaFlareSweep(e,phase,d){
    const arena=state.apexArena||{x:player.x,y:player.y,r:460};
    const aim=Math.atan2(player.y-e.y,player.x-e.x),count=phase>=4?5:phase>=3?4:3,spread=phase>=3?.24:.28;
    const length=Math.max(arena.r*1.55,Math.hypot(player.x-e.x,player.y-e.y)+arena.r*.72);
    for(let i=0;i<count;i++){
      const off=(i-(count-1)/2)*spread,a=aim+off,x2=e.x+Math.cos(a)*length,y2=e.y+Math.sin(a)*length;
      identityLine(e.x,e.y,x2,y2,18+phase*2,d*(i===(count>>1)?.86:.58),i%2?'#ffd36f':'#ff7b35',.70+Math.abs(i-(count-1)/2)*.075,FORGE_FLARE,{apexForm:'starforge',flareIndex:i,flareCount:count});
    }
    if(typeof shockwave==='function')shockwave(e.x,e.y,'#ffb04e',118+phase*18,.34,2.6);
  }

  // Replace the least distinctive Omega variant (three ordinary circles in a row) with a solar
  // flare fan. Other Omega attacks keep their collision/timing but receive the new visual grammar.
  const baseApexVariantAttackIdentity=typeof apexVariantAttack==='function'?apexVariantAttack:null;
  if(baseApexVariantAttackIdentity){
    apexVariantAttack=function apexVariantAttackIdentity(e,phase){
      const form=e?.apexForm||e?.eliteForm;
      if(form==='starforge'){
        const d=Math.max(8,e.damage*(.25+phase*.022));
        omegaFlareSweep(e,phase,d);
        return;
      }
      return baseApexVariantAttackIdentity(e,phase);
    };
  }

  // ---------------------------------------------------------------------------
  // 3) Last Constellation: nodes and links own the warning language.
  // ---------------------------------------------------------------------------
  // Keep the established cage collision and node volley, but author the cage with explicit node
  // metadata so the warning reads as a star map being drawn, not as generic white laser lines.
  if(typeof constellationCage==='function'){
    constellationCage=function constellationCageIdentity(e,d,arena,phase,life=1.02){
      const cx=player.x,cy=player.y,count=6+phase,radius=Math.min(arena.r*.42,142+phase*14),points=[];
      const rotation=e.phase*.025;
      for(let i=0;i<count;i++){
        const a=i/count*TAU+rotation,rr=radius*(i%2?1:.84);
        points.push({x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr,index:i});
      }
      // P1/P2 teach perimeter links. P3/P4 rewire to skip one node, changing topology without
      // changing the warning language. One perimeter edge is intentionally omitted as a readable exit.
      const jump=phase>=3?2:1,gap=((Math.floor(e.phase*.07)%count)+count)%count;
      for(let i=0;i<count;i++){
        if(i===gap)continue;
        const a=points[i],b=points[(i+jump)%count];
        identityLine(a.x,a.y,b.x,b.y,10+phase,d*.54,i%2?'#9fb2ef':'#d8e2ff',life+i*.018,CONSTELLATION_LINK,{apexForm:'lastconstellation',nodeA:i,nodeB:(i+jump)%count,nodeCount:count});
      }
      const cut=e.phase*.031,ux=Math.cos(cut),uy=Math.sin(cut),half=radius*1.08;
      identityLine(cx-ux*half,cy-uy*half,cx+ux*half,cy+uy*half,15+phase,d*.92,'#ffffff',life*.88,CONSTELLATION_CUT,{apexForm:'lastconstellation',nodeCount:count});
      if(phase>=3){
        const px=-uy,py=ux;
        identityLine(cx-px*half*.92,cy-py*half*.92,cx+px*half*.92,cy+py*half*.92,12+phase,d*.66,'#879be0',life*1.04,CONSTELLATION_CUT,{apexForm:'lastconstellation',nodeCount:count,secondary:true});
      }
      return points;
    };
  }

  // ---------------------------------------------------------------------------
  // 4) Atropos phase grammar: keep space-cut, add sparse history replay.
  // ---------------------------------------------------------------------------
  function rememberClockworkHistory(e,dt){
    e.clockworkHistoryCd=(e.clockworkHistoryCd||0)-dt;
    if(e.clockworkHistoryCd>0)return;
    e.clockworkHistoryCd=.20;
    const h=e.clockworkPlayerHistory||(e.clockworkPlayerHistory=[]);
    h.push({x:player.x,y:player.y});
    if(h.length>18)h.shift();
  }
  function fireClockworkEcho(e,phase){
    const h=e.clockworkPlayerHistory||[];
    if(h.length<6)return;
    const picks=phase>=4?[14,10,6]:phase>=3?[11,7,4]:[9,5];
    const points=picks.map(back=>h[Math.max(0,h.length-1-back)]).filter(Boolean);
    const ordered=phase>=4?[...points].reverse():points;
    ordered.forEach((p,i)=>{
      const delay=i*(phase>=4?155:220);
      bossLater(e,delay,()=>{
        if(e.dead)return;
        const angle=(e.phase||0)*.11+i*.73+(phase>=4?-i*.34:0);
        chronophageScar(p.x,p.y,50+phase*5+i*4,Math.max(6,e.damage*.22)*(1-i*.12),'#9fffea',.72+i*.10,angle);
      });
    });
  }
  function updateClockworkIdentity(e,dt){
    if(!e||e.dead||e.apexForm!=='chronophage')return;
    rememberClockworkHistory(e,dt);
    const phase=Math.max(1,Math.min(4,e.apexPhase||1));
    if((e.clockworkIdentityPhase||1)!==phase){
      const previous=e.clockworkIdentityPhase||1;e.clockworkIdentityPhase=phase;
      if(phase>previous){
        if(typeof showBossNotice==='function')showBossNotice((typeof bossName==='function'?bossName('chronophage'):'시간포식자 아트로포스')+' · PHASE '+phase,'APEX THREAT');
        if(typeof shockwave==='function')shockwave(e.x,e.y,'#79ffe1',118+phase*24,.38+phase*.035,2.6+phase*.45);
        state.camera.shake=Math.max(state.camera.shake,4+phase*1.4);
      }
    }
    if(phase<2)return;
    e.clockworkEchoCd=(e.clockworkEchoCd??(5.6+Math.random()*1.2))-dt;
    if(e.clockworkEchoCd<=0){
      e.clockworkEchoCd=Math.max(5.0,7.7-phase*.55);
      fireClockworkEcho(e,phase);
    }
  }
  registerApexCombatService('chronophage').identity=updateClockworkIdentity;

  // ---------------------------------------------------------------------------
  // 5) Draw custom warnings instead of generic circles / white laser strips.
  // ---------------------------------------------------------------------------
  function drawBrokenArc(cx,cy,r,start,end,color,width,alpha){
    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(cx,cy,r,start,end);ctx.stroke();ctx.restore();
  }
  function drawForgeCircle(t){
    const p=screenPoint(t.x,t.y),progress=1-clamp(t.life/t.max,0,1),r=t.r,rot=(t.phase||0)+progress*.55;
    ctx.save();ctx.translate(p.x,p.y);ctx.lineCap='round';
    const meteor=t.impactStyle===FORGE_METEOR;
    const glow=ctx.createRadialGradient(0,0,2,0,0,r*1.03);glow.addColorStop(0,`rgba(255,245,190,${.08+.15*progress})`);glow.addColorStop(.55,`rgba(255,118,40,${.05+.08*progress})`);glow.addColorStop(1,'rgba(255,70,20,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r*1.03,0,TAU);ctx.fill();
    for(let seg=0;seg<8;seg++){
      if((seg+(meteor?2:0))%5===0)continue;
      const a=seg/8*TAU+rot,span=meteor?.42:.50;
      drawBrokenArc(0,0,r,a,a+span,seg%2?'#ff9d42':'#ffd875',meteor?2.2:3.0,.45+.42*progress);
    }
    const spikes=meteor?5:8;
    for(let i=0;i<spikes;i++){
      const a=i/spikes*TAU-rot*.42,inner=r*(meteor?.34:.58),outer=r*(meteor?.78:.94),side=(i%2?1:-1)*r*.045;
      ctx.globalAlpha=.22+.48*progress;ctx.strokeStyle=i%2?'#fff0ae':'#ff8a38';ctx.lineWidth=meteor?1.7:2.2;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.quadraticCurveTo(Math.cos(a+.14)*((inner+outer)*.5)+Math.cos(a+Math.PI/2)*side,Math.sin(a+.14)*((inner+outer)*.5)+Math.sin(a+Math.PI/2)*side,Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();
    }
    if(meteor){ctx.rotate(-rot*.65);ctx.fillStyle=`rgba(255,235,165,${.28+.50*progress})`;ctx.beginPath();for(let i=0;i<10;i++){const a=i/10*TAU,rr=i%2?r*.19:r*.42;i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();}
    else{const rr=r*(1.18-progress*.22);ctx.globalAlpha=.24+.45*progress;ctx.strokeStyle='#fff0ae';ctx.lineWidth=1.4;ctx.setLineDash([9,12]);ctx.beginPath();ctx.arc(0,0,rr,0,TAU);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
  }
  function drawForgeFlare(t){
    const a=screenPoint(t.x,t.y),x2=t.x+Math.cos(t.a)*t.length,y2=t.y+Math.sin(t.a)*t.length,b=screenPoint(x2,y2),progress=1-clamp(t.life/t.max,0,1),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    ctx.save();ctx.lineCap='round';
    for(const side of[-1,1]){ctx.globalAlpha=.20+.34*progress;ctx.strokeStyle=side<0?'#ff7b35':'#ffd36f';ctx.lineWidth=2+progress*1.5;ctx.beginPath();ctx.moveTo(a.x+nx*side*t.width*.34,a.y+ny*side*t.width*.34);ctx.lineTo(b.x+nx*side*t.width*.34,b.y+ny*side*t.width*.34);ctx.stroke();}
    ctx.globalAlpha=.20+.55*progress;ctx.strokeStyle='#fff0ae';ctx.lineWidth=1.3;ctx.setLineDash([18,13]);ctx.lineDashOffset=-(state.time||0)*45;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }
  function drawConstellationLine(t){
    const x2=t.x+Math.cos(t.a)*t.length,y2=t.y+Math.sin(t.a)*t.length,a=screenPoint(t.x,t.y),b=screenPoint(x2,y2),progress=1-clamp(t.life/t.max,0,1),cut=t.impactStyle===CONSTELLATION_CUT;
    ctx.save();ctx.lineCap='round';ctx.globalAlpha=.18+.34*progress;ctx.strokeStyle=cut?'#ffffff':'#9fb2ef';ctx.lineWidth=cut?2.2:1.5;ctx.setLineDash(cut?[12,9]:[5,10]);ctx.lineDashOffset=-(state.time||0)*(cut?28:18);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
    const nodes=cut?2:3;for(let i=0;i<nodes;i++){const q=nodes===1?.5:i/(nodes-1),x=lerp(a.x,b.x,q),y=lerp(a.y,b.y,q),s=(cut?5.4:4.0)*(1+.22*progress);ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI*.25+(state.time||0)*.16*(i%2?1:-1));ctx.globalAlpha=.50+.38*progress;ctx.fillStyle=i===0||i===nodes-1?'#f4f7ff':'#9fb2ef';ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*.55,0);ctx.lineTo(0,s);ctx.lineTo(-s*.55,0);ctx.closePath();ctx.fill();ctx.restore();}
    const q=(progress*.88)%1,px=lerp(a.x,b.x,q),py=lerp(a.y,b.y,q);ctx.globalAlpha=.72;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(px,py,cut?2.8:2.2,0,TAU);ctx.fill();ctx.restore();
  }

  const baseDrawTelegraphsIdentity=typeof drawTelegraphs==='function'?drawTelegraphs:null;
  if(baseDrawTelegraphsIdentity){
    drawTelegraphs=function drawApexIdentityTelegraphs(){
      const original=state.entities.telegraphs,custom=CUSTOM_TELEGRAPH_BUFFER,ordinary=ORDINARY_TELEGRAPH_BUFFER;custom.length=0;ordinary.length=0;
      for(const t of original)(isIdentityTelegraph(t)?custom:ordinary).push(t);
      state.entities.telegraphs=ordinary;
      try{baseDrawTelegraphsIdentity();}finally{state.entities.telegraphs=original;}
      for(const t of custom){if(t.type==='circle')drawForgeCircle(t);else if(t.impactStyle===FORGE_FLARE)drawForgeFlare(t);else drawConstellationLine(t);}
    };
  }

  // ---------------------------------------------------------------------------
  // 6) Impact language: same collision, boss-specific result/recovery.
  // ---------------------------------------------------------------------------
  function radialFlareBurst(t,strong=false){
    const spokes=strong?12:8;
    for(let i=0;i<spokes;i++){
      const a=i/spokes*TAU+(t.phase||0),inner=t.r*(strong?.10:.12),outer=t.r*(strong?1.02:.82);
      if(typeof spawnBeamEffect==='function'){
        spawnBeamEffect(t.x+Math.cos(a)*inner,t.y+Math.sin(a)*inner,t.x+Math.cos(a)*outer,t.y+Math.sin(a)*outer,strong?.18:.13,i%3===0?'#fff2bd':i%2?'#ffd36f':'#ff7a32',strong?4.6:3.1);
        if(i%3===0){
          const flareA=a+(strong?.10:.14);
          spawnBeamEffect(t.x+Math.cos(flareA)*t.r*.20,t.y+Math.sin(flareA)*t.r*.20,t.x+Math.cos(flareA)*t.r*(strong?.76:.60),t.y+Math.sin(flareA)*t.r*(strong?.76:.60),strong?.13:.10,'#ff5e24',strong?2.8:2.1);
        }
      }
    }
    if(typeof spawnParticle==='function'){
      spawnParticle(t.x,t.y,'#fff7d1',strong?7:5,strong?78:62,strong?5.6:4.5);
      spawnParticle(t.x,t.y,strong?'#ffd36f':'#ffb04e',strong?16:11,strong?205:152,strong?4.5:3.4);
      spawnParticle(t.x,t.y,'#ff6b2b',strong?10:6,strong?265:190,strong?3.4:2.7);
    }
  }
  function omegaExplosionResult(t,strong=false){
    if(typeof shockwave==='function'){
      // A tight white-hot ignition, a fast thermal shell, then a darker slower after-pressure ring.
      shockwave(t.x,t.y,'#fff9dc',t.r*(strong?.48:.40),strong?.13:.11,strong?5.6:4.8);
      shockwave(t.x,t.y,'#ffd36f',t.r*(strong?.96:.84),strong?.24:.21,strong?4.8:4.0);
      shockwave(t.x,t.y,'#ff7b35',t.r*(strong?1.26:1.12),strong?.38:.33,strong?4.2:3.6);
      shockwave(t.x,t.y,'#7a1708',t.r*(strong?1.48:1.30),strong?.54:.47,strong?2.2:1.8);
    }
    radialFlareBurst(t,strong);
    if(typeof spawnBeamEffect==='function'){
      const offset=(t.phase||0)+.22;
      for(let i=0;i<4;i++){
        const a=offset+i*TAU/4,len=t.r*(strong?1.06:.86);
        spawnBeamEffect(t.x-Math.cos(a)*len*.16,t.y-Math.sin(a)*len*.16,t.x+Math.cos(a)*len,t.y+Math.sin(a)*len,strong?.16:.12,i%2?'#fff1b0':'#ff8a38',strong?5.0:3.5);
      }
    }
  }
  const baseTriggerCircleImpactIdentity=typeof triggerCircleImpact==='function'?triggerCircleImpact:null;
  if(baseTriggerCircleImpactIdentity){
    triggerCircleImpact=function triggerApexIdentityCircleImpact(t){
      if(t?.impactStyle===FORGE_METEOR){omegaExplosionResult(t,false);state.camera.shake=Math.max(state.camera.shake,4.8);state.flash=Math.max(state.flash,.095);if(typeof playBossImpactAudio==='function')playBossImpactAudio(.92);return;}
      if(t?.impactStyle===FORGE_PRESSURE){omegaExplosionResult(t,true);state.camera.shake=Math.max(state.camera.shake,6.4);state.flash=Math.max(state.flash,.13);if(typeof playBossImpactAudio==='function')playBossImpactAudio(1.10);return;}
      return baseTriggerCircleImpactIdentity(t);
    };
  }

  const baseTriggerLineImpactIdentity=typeof triggerLineImpact==='function'?triggerLineImpact:null;
  if(baseTriggerLineImpactIdentity){
    triggerLineImpact=function triggerApexIdentityLineImpact(t,x2,y2){
      if(t?.impactStyle===FORGE_FLARE){const dx=x2-t.x,dy=y2-t.y;for(const span of[[0,.26],[.31,.63],[.68,1]])spawnBeamEffect(t.x+dx*span[0],t.y+dy*span[0],t.x+dx*span[1],t.y+dy*span[1],.18,span[0]===0?'#fff0ae':t.color,Math.max(4,t.width*.45));for(const q of[.12,.36,.58,.82])spawnParticle(t.x+dx*q,t.y+dy*q,q<.2?'#fff0ae':'#ff9d42',2,115,3.0);state.camera.shake=Math.max(state.camera.shake,5.2);state.flash=Math.max(state.flash,.085);if(typeof playBossImpactAudio==='function')playBossImpactAudio(.94);return;}
      if(t?.impactStyle===CONSTELLATION_LINK||t?.impactStyle===CONSTELLATION_CUT){const dx=x2-t.x,dy=y2-t.y,cut=t.impactStyle===CONSTELLATION_CUT,spans=cut?[[0,.20],[.27,.48],[.55,.76],[.83,1]]:[[0,.30],[.36,.64],[.70,1]];for(const span of spans)spawnBeamEffect(t.x+dx*span[0],t.y+dy*span[0],t.x+dx*span[1],t.y+dy*span[1],cut?.18:.14,cut?'#f4f7ff':t.color,Math.max(2,t.width*(cut?.28:.20)));for(const q of[0,.5,1])spawnParticle(t.x+dx*q,t.y+dy*q,cut?'#ffffff':'#b7c9ff',2,52,2.2);if(typeof shockwave==='function'){shockwave(t.x,t.y,'#b7c9ff',cut?38:26,.20,1.6);shockwave(x2,y2,'#b7c9ff',cut?38:26,.20,1.6);}state.camera.shake=Math.max(state.camera.shake,cut?3.8:2.2);state.flash=Math.max(state.flash,cut?.05:.028);if(typeof playBossImpactAudio==='function')playBossImpactAudio(cut?.70:.52);return;}
      return baseTriggerLineImpactIdentity(t,x2,y2);
    };
  }

  function targetSummary(target){if(!target)return null;const owner=target.bodyPart?target.owner:target;return{id:target.id??null,bodyPart:!!target.bodyPart,x:target.x,y:target.y,ownerId:owner?.id??null,ownerForm:owner?.apexForm||owner?.eliteForm||null,distanceFromPlayer:Math.hypot(target.x-player.x,target.y-player.y)};}
  window.stackfallApexIdentityDiagnostics=()=>{
    const chrono=activeApex('chronophage');
    return{version:window.stackfallApexIdentityCombat,chronophage:chrono?{id:chrono.id,x:chrono.x,y:chrono.y,r:chrono.r,bodyParts:Array.isArray(chrono.bodyParts)?chrono.bodyParts.length:0,clockworkTargeting:!!chrono.atroposReborn?.clockworkTargeting}:null,targets:chrono&&typeof nearestWeaponTarget==='function'?{core:targetSummary(nearestWeaponTarget('core')),comet:targetSummary(nearestWeaponTarget('comet')),rail:targetSummary(nearestWeaponTarget('rail'))}:null,customTelegraphs:state.entities.telegraphs.filter(isIdentityTelegraph).map(t=>({type:t.type,style:t.impactStyle,life:t.life,max:t.max,damage:t.damage}))};
  };

  const existing=activeApex('chronophage');
  if(existing&&baseEnsureRebornAtroposIdentity)ensureRebornAtropos(existing);
})();
