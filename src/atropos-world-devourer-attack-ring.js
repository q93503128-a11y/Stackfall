// Branch-only pattern 4 prototype: Devourer's Ring for World Devourer Atropos.
// Forms an asymmetric C-shaped enclosure with a deliberately large escape opening.
// P1 keeps only basic patterns; P2+ adds Void Maw and Devourer's Ring.
(()=>{
  const RING={warn:1.30,wrap:1.65,hold:1.20,release:1.35};
  RING.wrapEnd=RING.warn+RING.wrap;RING.holdEnd=RING.wrapEnd+RING.hold;RING.end=RING.holdEnd+RING.release;
  const GAP=2.22;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e?.dead&&e.apexForm==='chronophage')||null;
  const serpentOf=e=>e?.atroposReborn?.worldDevourer||null;
  const copyPose=points=>(points||[]).map(p=>({x:Number(p.x)||0,y:Number(p.y)||0,orbitA:Number(p.orbitA)||0,depth:Number(p.depth)||0}));
  function phaseOf(e){const hp=e.hp/Math.max(1,e.maxHp);return hp<.25?4:hp<.50?3:hp<.75?2:1;}
  function orbitOffset(serpent){const a=(Number(serpent.motionTime)||0)*.165+(Number(serpent.phaseBase)||0),rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);return{x:Math.cos(a)*rx+Math.sin(a*2.07)*38,y:Math.sin(a*.96)*ry+Math.sin(a*2.41+1.1)*28,orbitA:a};}
  function ringStage(a){if(!a)return'idle';const n=a.age;return n<RING.warn?'warn':n<RING.wrapEnd?'wrap':n<RING.holdEnd?'hold':n<RING.end?'release':'done';}
  function targetRing(a,count){
    const out=[],start=a.gapCenter+GAP*.5,span=TAU-GAP;
    for(let i=0;i<count;i++){
      const q=i/Math.max(1,count-1),ang=start+span*q,rx=a.rx*(1+.09*Math.sin(ang*1.7+.5)),ry=a.ry*(1+.07*Math.cos(ang*2.2-.4));
      out.push({x:a.cx+Math.cos(ang)*rx+26*Math.sin(ang*2.8),y:a.cy+Math.sin(ang)*ry+18*Math.sin(ang*1.3+.6),orbitA:ang});
    }
    return out;
  }
  function startRing(e,s){
    const base=copyPose(s?.points);if(!e||!s||phaseOf(e)<2||s.crossingPrototype||s.tailSeverPrototype||s.mawPrototype||s.ringPrototype||base.length<11)return false;
    const head=base[0],cx=Number(player.x)||0,cy=Number(player.y)||0,headAngle=Math.atan2(head.y-cy,head.x-cx),alternate=((s.ringSerial||0)&1)?-.22:.22;
    s.ringPrototype={age:0,base,cx,cy,gapCenter:headAngle+alternate,rx:clamp(vw*.205,325,405),ry:clamp(vh*.255,235,285),holdMotionTime:Number(s.motionTime)||0,hit:false,serial:(s.ringSerial=(s.ringSerial||0)+1)};
    return true;
  }
  function ringPose(a){
    const stage=ringStage(a),targets=targetRing(a,a.base.length);let q=0;
    if(stage==='wrap')q=ease((a.age-RING.warn)/RING.wrap);else if(stage==='hold')q=1;else if(stage==='release')q=1-smooth((a.age-RING.holdEnd)/RING.release);
    const out=[];
    for(let i=0;i<a.base.length;i++){
      const b=a.base[i],r=targets[i],tailT=i/Math.max(1,a.base.length-1);let local=q;
      if(stage==='wrap')local=clamp(q*1.42-tailT*.42,0,1);
      out.push({x:lerp(b.x,r.x,local),y:lerp(b.y,r.y,local),orbitA:lerp(b.orbitA,r.orbitA,local)});
    }
    return out;
  }
  function rebuildRingHistory(s,a){
    const pts=ringPose(a),history=[];
    for(let i=pts.length-1;i>0;i--){const from=pts[i],to=pts[i-1],len=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(2,Math.ceil(len/4));for(let j=0;j<steps;j++){const q=j/steps;history.push({x:lerp(from.x,to.x,q),y:lerp(from.y,to.y,q),orbitA:lerp(from.orbitA,to.orbitA,q)});}}
    const head=pts[0];history.push({x:head.x,y:head.y,orbitA:head.orbitA});s.history=history;s.last=history[history.length-1];s.motionTime=a.holdMotionTime;s.lastReal=performance.now()*.001;const off=orbitOffset(s);s.anchorX=head.x-off.x;s.anchorY=head.y-off.y;return pts;
  }
  function pointSegmentDistance(px,py,a,b){const vx=b.x-a.x,vy=b.y-a.y,wx=px-a.x,wy=py-a.y,len2=vx*vx+vy*vy;if(len2<=.0001)return Math.hypot(wx,wy);const t=clamp((wx*vx+wy*vy)/len2,0,1),x=a.x+vx*t,y=a.y+vy*t;return Math.hypot(px-x,py-y);}
  function ringContact(e,a,pts){
    if(a.hit||ringStage(a)!=='hold')return;const radius=(player.r||12)+45;
    for(let i=1;i<pts.length;i++){if(pointSegmentDistance(player.x,player.y,pts[i-1],pts[i])<=radius){a.hit=true;if(player.invuln<=0)hurtPlayer(window.stackfallAtroposPatternDamage(e,'devourerRing'),e);break;}}
  }
  function updateRing(e,s,dt){
    const a=s.ringPrototype;if(!a)return false;a.age+=dt;const pts=rebuildRingHistory(s,a);ringContact(e,a,pts);
    if(a.age>=RING.end){s.ringPrototype=null;const phase=phaseOf(e);s.prototypeAttackCd=Math.max(.90,1.42-(phase-2)*.14);s.nextPrototypeAttack='crossing';}
    return true;
  }
  function warningPath(a,count=80){
    const targets=targetRing(a,count),out=[];for(const p of targets)out.push(worldToScreen(p.x,p.y));return out;
  }
  function drawRingWarning(){
    const e=serpentEnemy(),s=serpentOf(e),a=s?.ringPrototype;if(!a)return;const stage=ringStage(a),arc=warningPath(a);if(arc.length<2)return;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(stage==='warn'){
      const q=smooth(a.age/RING.warn);ctx.globalAlpha=.15+.16*q;ctx.strokeStyle='#ff3048';ctx.lineWidth=Math.max(84,Math.min(vw,vh)*.10);ctx.beginPath();ctx.moveTo(arc[0].x,arc[0].y);for(let i=1;i<arc.length;i++)ctx.lineTo(arc[i].x,arc[i].y);ctx.stroke();ctx.globalAlpha=.56+.26*q;ctx.strokeStyle='#ff7184';ctx.lineWidth=4;ctx.setLineDash([22,14]);ctx.beginPath();ctx.moveTo(arc[0].x,arc[0].y);for(let i=1;i<arc.length;i++)ctx.lineTo(arc[i].x,arc[i].y);ctx.stroke();ctx.setLineDash([]);
      const a1=a.gapCenter-GAP*.5,a2=a.gapCenter+GAP*.5,c=worldToScreen(a.cx,a.cy);ctx.globalAlpha=.52+.18*q;ctx.lineWidth=3;for(const ang of[a1,a2]){const p=worldToScreen(a.cx+Math.cos(ang)*Math.max(a.rx,a.ry)*1.38,a.cy+Math.sin(ang)*Math.max(a.rx,a.ry)*1.20);ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(p.x,p.y);ctx.stroke();}
    }else if(stage==='wrap'||stage==='hold'){
      ctx.globalAlpha=stage==='hold'?.14:.09;ctx.strokeStyle='#ff3048';ctx.lineWidth=Math.max(108,Math.min(vw,vh)*.125);ctx.beginPath();ctx.moveTo(arc[0].x,arc[0].y);for(let i=1;i<arc.length;i++)ctx.lineTo(arc[i].x,arc[i].y);ctx.stroke();
    }
    ctx.restore();
  }

  const baseCombat=window.stackfallUpdateWorldDevourerCombat||window.stackfallUpdateWorldDevourerCrossing;
  if(typeof baseCombat==='function')window.stackfallUpdateWorldDevourerCombat=function updateWorldDevourerFourPatternCombat(e,dt){
    const s=serpentOf(e);if(!s)return baseCombat(e,dt);const phase=phaseOf(e);e.apexPhase=phase;
    if(s.ringPrototype){e.apexElapsed=(e.apexElapsed||0)+dt;return updateRing(e,s,dt);}
    // P1 deliberately keeps only the two basic body attacks.
    if(phase<2&&(s.nextPrototypeAttack==='maw'||s.nextPrototypeAttack==='ring'))s.nextPrototypeAttack='crossing';
    if(phase>=2&&!s.crossingPrototype&&!s.tailSeverPrototype&&!s.mawPrototype&&s.nextPrototypeAttack==='ring'&&(Number(s.prototypeAttackCd)||0)<=0){if(startRing(e,s)){e.apexElapsed=(e.apexElapsed||0)+dt;return updateRing(e,s,dt);}}
    const hadMaw=!!s.mawPrototype,result=baseCombat(e,dt);
    if(hadMaw&&!s.mawPrototype&&!s.crossingPrototype&&!s.tailSeverPrototype&&phase>=2)s.nextPrototypeAttack='ring';
    // Later phases reduce breathing room slightly, but never shorten telegraphs.
    if(!s.crossingPrototype&&!s.tailSeverPrototype&&!s.mawPrototype&&!s.ringPrototype&&Number.isFinite(s.prototypeAttackCd))s.prototypeAttackCd=Math.max(.82,s.prototypeAttackCd-(phase-1)*.04*dt);
    return result;
  };
  window.stackfallUpdateWorldDevourerCrossing=window.stackfallUpdateWorldDevourerCombat;
  const baseBackground=drawBackground;drawBackground=function drawBackgroundWithDevourerRing(){const result=baseBackground();drawRingWarning();return result;};
  window.stackfallTriggerAtroposDevourerRing=()=>{const e=serpentEnemy(),s=serpentOf(e);if(!e||!s||phaseOf(e)<2)return false;s.crossingPrototype=null;s.tailSeverPrototype=null;s.mawPrototype=null;s.ringPrototype=null;return startRing(e,s);};
  window.stackfallAtroposRingDiagnostics=()=>{const e=serpentEnemy(),s=serpentOf(e),a=s?.ringPrototype;return{phase:e?phaseOf(e):null,active:!!a,stage:ringStage(a),age:a?+a.age.toFixed(2):0,serial:a?.serial||0,gapRadians:GAP};};
  window.stackfallAtroposPrototypeAttackState='p1-basic+p2-maw-ring-motion-v4';
})();
