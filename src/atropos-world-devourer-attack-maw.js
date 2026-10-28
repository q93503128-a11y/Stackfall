// Branch-only pattern 3 prototype: Void Maw for World Devourer Atropos.
// Bends only the front neck, snapshots the target during telegraph, applies survivable suction,
// then lunges the maw with a brief jaw-snap squash. Rear body remains heavy and stable.
(()=>{
  const MAW={aim:.70,warn:.95,suction:1.40,bite:.40,recover:.90};
  MAW.warnEnd=MAW.aim+MAW.warn;MAW.suctionEnd=MAW.warnEnd+MAW.suction;MAW.biteEnd=MAW.suctionEnd+MAW.bite;MAW.end=MAW.biteEnd+MAW.recover;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e?.dead&&e.apexForm==='chronophage')||null;
  const serpentOf=e=>e?.atroposReborn?.worldDevourer||null;
  const copyPose=points=>(points||[]).map(p=>({x:Number(p.x)||0,y:Number(p.y)||0,orbitA:Number(p.orbitA)||0,depth:Number(p.depth)||0}));

  function orbitOffset(serpent){
    if(typeof window.stackfallAtroposIdleOffset==='function')return window.stackfallAtroposIdleOffset(serpent,Number(serpent.motionTime)||0);
    return{x:0,y:0,orbitA:Number(serpent.phaseBase)||0};
  }
  function mawStage(a){if(!a)return'idle';const n=a.age;return n<MAW.aim?'aim':n<MAW.warnEnd?'warn':n<MAW.suctionEnd?'suction':n<MAW.biteEnd?'bite':n<MAW.end?'recover':'done';}
  function updateJawScale(a){let scale=null;if(a&&mawStage(a)==='bite'){const q=clamp((a.age-MAW.suctionEnd)/MAW.bite,0,1),snap=Math.sin(q*Math.PI);scale={x:1+.10*snap,y:1-.34*snap};}window.stackfallAtroposMawJawScale=scale;}
  function startMaw(e,serpent){
    const base=copyPose(serpent?.points);if(!e||!serpent||serpent.crossingPrototype||serpent.tailSeverPrototype||serpent.mawPrototype||base.length<11)return false;
    const pivotIndex=Math.min(6,base.length-6),pivot=base[pivotIndex],head=base[0],targetX=Number(player.x)||0,targetY=Number(player.y)||0;
    const baseAngle=Math.atan2(head.y-pivot.y,head.x-pivot.x),targetAngle=Math.atan2(targetY-pivot.y,targetX-pivot.x),delta=clamp(angleDelta(baseAngle,targetAngle),-1.05,1.05);
    serpent.mawPrototype={age:0,base,pivotIndex,pivot:{x:pivot.x,y:pivot.y},targetX,targetY,targetAngle,delta,holdMotionTime:Number(serpent.motionTime)||0,hit:false,serial:(serpent.mawSerial=(serpent.mawSerial||0)+1)};
    return true;
  }
  function frontPose(a){
    let bend=0,approach=0;const n=a.age;
    if(n<MAW.aim){const q=smooth(n/MAW.aim);bend=.85*q;approach=0;}
    else if(n<MAW.warnEnd){bend=.85;approach=0;}
    else if(n<MAW.suctionEnd){const q=(n-MAW.warnEnd)/MAW.suction;bend=.90;approach=.46*smooth(q);}
    else if(n<MAW.biteEnd){const q=(n-MAW.suctionEnd)/MAW.bite;bend=.92;approach=lerp(.46,.98,ease(q));}
    else{const q=smooth((n-MAW.biteEnd)/MAW.recover);bend=.92*(1-q);approach=.98*(1-q);}
    const headBase=a.base[0],turnHead=a.delta*bend,hdx=headBase.x-a.pivot.x,hdy=headBase.y-a.pivot.y,hc=Math.cos(turnHead),hs=Math.sin(turnHead),rotHead={x:a.pivot.x+hdx*hc-hdy*hs,y:a.pivot.y+hdx*hs+hdy*hc},dirX=Math.cos(a.targetAngle),dirY=Math.sin(a.targetAngle);
    const needed=clamp((a.targetX-rotHead.x)*dirX+(a.targetY-rotHead.y)*dirY,0,250),extend=needed*approach;
    const out=a.base.map(p=>({...p}));
    for(let i=0;i<a.pivotIndex;i++){
      const w=(a.pivotIndex-i)/a.pivotIndex,turn=a.delta*bend*(.45+.55*w),dx=a.base[i].x-a.pivot.x,dy=a.base[i].y-a.pivot.y,c=Math.cos(turn),ss=Math.sin(turn);
      out[i].x=a.pivot.x+dx*c-dy*ss+dirX*extend*w;
      out[i].y=a.pivot.y+dx*ss+dy*c+dirY*extend*w;
    }
    return out;
  }
  function rebuildFrontHistory(serpent,a){
    const pts=frontPose(a),history=[];
    for(let i=pts.length-1;i>0;i--){const from=pts[i],to=pts[i-1],len=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(2,Math.ceil(len/4));for(let j=0;j<steps;j++){const q=j/steps;history.push({x:lerp(from.x,to.x,q),y:lerp(from.y,to.y,q),orbitA:lerp(from.orbitA,to.orbitA,q)});}}
    const head=pts[0];history.push({x:head.x,y:head.y,orbitA:head.orbitA});serpent.history=history;serpent.last=history[history.length-1];serpent.motionTime=a.holdMotionTime;serpent.lastReal=performance.now()*.001;
    const off=orbitOffset(serpent);serpent.anchorX=head.x-off.x;serpent.anchorY=head.y-off.y;return pts;
  }
  function coneState(a,head){
    const aim=Math.atan2(a.targetY-head.y,a.targetX-head.x),dist=Math.max(280,Math.hypot(a.targetX-head.x,a.targetY-head.y)+125),half=mawStage(a)==='warn'?.30:.26;
    return{aim,dist,half};
  }
  function playerInCone(a,head){
    const c=coneState(a,head),px=player.x-head.x,py=player.y-head.y,d=Math.hypot(px,py)||1,pa=Math.atan2(py,px);
    return d<=c.dist+35&&Math.abs(angleDelta(c.aim,pa))<=c.half+.06;
  }
  function applySuction(a,head,dt){
    if(mawStage(a)!=='suction'||!playerInCone(a,head))return;const dx=head.x-player.x,dy=head.y-player.y,d=Math.hypot(dx,dy)||1,pull=(38+30*(1-clamp(d/430,0,1)))*dt;
    player.x+=dx/d*pull;player.y+=dy/d*pull;
  }
  function resolveBite(e,a,head){
    if(a.hit||mawStage(a)!=='bite')return;const q=(a.age-MAW.suctionEnd)/MAW.bite;if(q<.66)return;a.hit=true;
    const hit=Math.hypot(player.x-head.x,player.y-head.y)<=(player.r||12)+78;
    if(hit&&player.invuln<=0)hurtPlayer(window.stackfallAtroposPatternDamage(e,'voidMaw'),e);
    state.camera.shake=Math.max(state.camera.shake,hit?9:5);state.flash=Math.max(state.flash,hit?.045:.022);if(typeof audio?.tone==='function')audio.tone(hit?48:62,.18,'sawtooth',hit?.040:.025,-12);
  }
  function updateMaw(e,serpent,dt){
    const a=serpent.mawPrototype;if(!a)return false;a.age+=dt;updateJawScale(a);const pts=rebuildFrontHistory(serpent,a),head=pts[0];applySuction(a,head,dt);resolveBite(e,a,head);
    if(a.age>=MAW.end){serpent.mawPrototype=null;serpent.prototypeAttackCd=1.45;serpent.nextPrototypeAttack='crossing';window.stackfallAtroposMawJawScale=null;}
    return true;
  }
  function drawMawWarning(){
    const e=serpentEnemy(),s=serpentOf(e),a=s?.mawPrototype;if(!a)return;const stage=mawStage(a),head=s?.points?.[0];if(!head)return;
    if(stage==='warn'||stage==='suction'){
      const c=coneState(a,head),q=stage==='warn'?clamp((a.age-MAW.aim)/MAW.warn,0,1):1,p0=worldToScreen(head.x,head.y),p1=worldToScreen(head.x+Math.cos(c.aim-c.half)*c.dist,head.y+Math.sin(c.aim-c.half)*c.dist),p2=worldToScreen(head.x+Math.cos(c.aim+c.half)*c.dist,head.y+Math.sin(c.aim+c.half)*c.dist);
      ctx.save();ctx.globalAlpha=stage==='warn'?.10+.10*q:.16;ctx.fillStyle='#ff3048';ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.closePath();ctx.fill();ctx.globalAlpha=.55+.25*q;ctx.strokeStyle='#ff7184';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p0.x,p0.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();
      if(stage==='suction'){ctx.globalAlpha=.45;ctx.strokeStyle='#c8f2ff';ctx.lineWidth=2;for(let i=0;i<12;i++){const f=(i*.61803398875)%1,aa=c.aim+(f-.5)*c.half*1.55,r=70+(i*71)%Math.max(90,c.dist-80),len=22+(i%3)*7,x1=head.x+Math.cos(aa)*r,y1=head.y+Math.sin(aa)*r,x2=x1-Math.cos(aa)*len,y2=y1-Math.sin(aa)*len,A=worldToScreen(x1,y1),B=worldToScreen(x2,y2);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();}}
      ctx.restore();
    }
    if(stage==='bite'){
      const q=clamp((a.age-MAW.suctionEnd)/MAW.bite,0,1),p=worldToScreen(a.targetX,a.targetY);if(q>.58){ctx.save();ctx.globalAlpha=(q-.58)/.42*.72;ctx.strokeStyle='#ffd7df';ctx.lineWidth=5;ctx.beginPath();ctx.arc(p.x,p.y,48,0,TAU);ctx.stroke();ctx.restore();}
    }
  }

  const baseCombat=window.stackfallUpdateWorldDevourerCombat||window.stackfallUpdateWorldDevourerCrossing;
  if(typeof baseCombat==='function')window.stackfallUpdateWorldDevourerCombat=function updateWorldDevourerThreePatternCombat(e,dt){
    const s=serpentOf(e);if(!s)return baseCombat(e,dt);if(s.mawPrototype){e.apexElapsed=(e.apexElapsed||0)+dt;return updateMaw(e,s,dt);}
    if(!s.crossingPrototype&&!s.tailSeverPrototype&&s.nextPrototypeAttack==='maw'&&(Number(s.prototypeAttackCd)||0)<=0){if(startMaw(e,s)){e.apexElapsed=(e.apexElapsed||0)+dt;return updateMaw(e,s,dt);}}
    const hadTail=!!s.tailSeverPrototype,result=baseCombat(e,dt);if(hadTail&&!s.tailSeverPrototype&&!s.crossingPrototype){s.nextPrototypeAttack='maw';}return result;
  };
  window.stackfallUpdateWorldDevourerCrossing=window.stackfallUpdateWorldDevourerCombat;

  const baseBackground=drawBackground;drawBackground=function drawBackgroundWithVoidMaw(){const result=baseBackground();drawMawWarning();return result;};

  window.stackfallTriggerAtroposVoidMaw=()=>{const e=serpentEnemy(),s=serpentOf(e);if(!e||!s)return false;window.stackfallAtroposMawJawScale=null;s.crossingPrototype=null;s.tailSeverPrototype=null;s.mawPrototype=null;return startMaw(e,s);};
  window.stackfallAtroposMawDiagnostics=()=>{const e=serpentEnemy(),s=serpentOf(e),a=s?.mawPrototype;return{active:!!a,stage:mawStage(a),age:a?+a.age.toFixed(2):0,serial:a?.serial||0,target:a?{x:Math.round(a.targetX),y:Math.round(a.targetY)}:null};};
  window.stackfallAtroposPrototypeAttackState='giant-crossing+tail-sever+void-maw-motion-v3';
})();
