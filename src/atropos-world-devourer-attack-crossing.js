// Branch-only Giant Crossing motion prototype for World Devourer Atropos.
// Reviewed in an isolated 1920x1080 motion harness before integration.
(()=>{
  const TIMING={out:.60,warn:1.00,travel:2.45,clear:1.25,rejoin:1.60};
  TIMING.telegraphEnd=TIMING.out+TIMING.warn;
  TIMING.travelEnd=TIMING.telegraphEnd+TIMING.travel;
  TIMING.clearEnd=TIMING.travelEnd+TIMING.clear;
  TIMING.end=TIMING.clearEnd+TIMING.rejoin;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e?.dead&&e.apexForm==='chronophage')||null;
  const serpentOf=e=>e?.atroposReborn?.worldDevourer||null;

  function orbitOffset(serpent){
    const a=(Number(serpent.motionTime)||0)*.165+(Number(serpent.phaseBase)||0),rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);
    return{x:Math.cos(a)*rx+Math.sin(a*2.07)*38,y:Math.sin(a*.96)*ry+Math.sin(a*2.41+1.1)*28,orbitA:a};
  }
  function headPoint(serpent){
    const p=serpent?.points?.[0];
    if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))return{x:p.x,y:p.y};
    const o=orbitOffset(serpent);return{x:(Number(serpent.anchorX)||0)+o.x,y:(Number(serpent.anchorY)||0)+o.y};
  }
  function stageOf(a){
    if(!a)return'idle';const n=a.age;
    return n<TIMING.out?'out':n<TIMING.telegraphEnd?'warn':n<TIMING.travelEnd?'cross':n<TIMING.clearEnd?'clear':n<TIMING.end?'rejoin':'done';
  }
  function startCrossing(e,serpent){
    if(!e||!serpent||serpent.crossingPrototype)return false;
    const origin=headPoint(serpent),targetX=Number.isFinite(player.x)?player.x:Number(serpent.anchorX)||0,targetY=Number.isFinite(player.y)?player.y:Number(serpent.anchorY)||0;
    let axis=Math.atan2(targetY-origin.y,targetX-origin.x);if(!Number.isFinite(axis))axis=0;
    const ux=Math.cos(axis),uy=Math.sin(axis),span=Math.max(900,vw*.76,vh*1.20),extra=Math.max(760,vw*.45);
    serpent.crossingPrototype={age:0,origin,targetX,targetY,axis,ux,uy,start:{x:targetX-ux*span,y:targetY-uy*span},end:{x:targetX+ux*span,y:targetY+uy*span},far:{x:targetX+ux*(span+extra),y:targetY+uy*(span+extra)},playerHit:false,serial:(serpent.crossingSerial=(serpent.crossingSerial||0)+1)};
    serpent.crossingAttackCd=1e9;return true;
  }
  function desiredHead(serpent,a){
    const age=a.age,offset=orbitOffset(serpent),idle={x:(Number(player.x)||0)+offset.x,y:(Number(player.y)||0)+offset.y};
    if(age<TIMING.out){const q=ease(age/TIMING.out);return{x:lerp(a.origin.x,a.start.x,q),y:lerp(a.origin.y,a.start.y,q)};}
    if(age<TIMING.telegraphEnd){const q=(age-TIMING.out)/TIMING.warn,drift=28*q;return{x:a.start.x-a.ux*drift,y:a.start.y-a.uy*drift};}
    if(age<TIMING.travelEnd){const q=(age-TIMING.telegraphEnd)/TIMING.travel,k=ease(q),nx=-a.uy,ny=a.ux,wave=Math.sin(q*Math.PI)*38;return{x:lerp(a.start.x,a.end.x,k)+nx*wave,y:lerp(a.start.y,a.end.y,k)+ny*wave};}
    if(age<TIMING.clearEnd){const q=smooth((age-TIMING.travelEnd)/TIMING.clear);return{x:lerp(a.end.x,a.far.x,q),y:lerp(a.end.y,a.far.y,q)};}
    const q=smooth((age-TIMING.clearEnd)/TIMING.rejoin),nx=-a.uy,ny=a.ux,cx=a.far.x+a.ux*350+nx*800,cy=a.far.y+a.uy*350+ny*800,omt=1-q;
    return{x:omt*omt*a.far.x+2*omt*q*cx+q*q*idle.x,y:omt*omt*a.far.y+2*omt*q*cy+q*q*idle.y};
  }
  function driveHead(serpent,a){
    const desired=desiredHead(serpent,a),offset=orbitOffset(serpent);
    serpent.anchorX=desired.x-offset.x;serpent.anchorY=desired.y-offset.y;
  }
  function contact(e,serpent,a){
    if(a.playerHit)return;const stage=stageOf(a);if(stage!=='cross'&&stage!=='clear')return;
    for(const part of e.bodyParts||[]){
      if(!part?.active)continue;const x=e.x+(Number(part.dx)||0),y=e.y+(Number(part.dy)||0),r=Math.max(26,Number(part.r)||0);
      if(Math.hypot(player.x-x,player.y-y)<=r+(player.r||12)*.78){a.playerHit=true;if(player.invuln<=0)hurtPlayer(Math.max(8,(Number(player.maxHp)||100)*.14),e);break;}
    }
  }
  function drawWarning(){
    const e=serpentEnemy(),serpent=serpentOf(e),a=serpent?.crossingPrototype;if(!a||stageOf(a)!=='warn')return;
    const q=clamp((a.age-TIMING.out)/TIMING.warn,0,1),p1=worldToScreen(a.start.x,a.start.y),p2=worldToScreen(a.end.x,a.end.y);
    ctx.save();ctx.lineCap='butt';ctx.strokeStyle='#ff3048';ctx.globalAlpha=.10+.17*q;ctx.lineWidth=Math.max(220,Math.min(vw,vh)*.25);ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();ctx.globalAlpha=.54+.28*q;ctx.strokeStyle='#ff7184';ctx.lineWidth=4;ctx.setLineDash([28,18]);ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();ctx.setLineDash([]);ctx.restore();
  }

  window.stackfallUpdateWorldDevourerCrossing=function updateWorldDevourerCrossing(e,dt){
    const serpent=serpentOf(e);if(!e||e.dead||!serpent)return false;
    e.apexElapsed=(e.apexElapsed||0)+dt;const hp=e.hp/Math.max(1,e.maxHp);e.apexPhase=hp<.25?4:hp<.50?3:hp<.75?2:1;e.timeLock=0;
    if(e.atroposReborn){e.atroposReborn.slash=null;e.atroposReborn.slashCd=1e9;}
    serpent.crossingAttackCd=Number.isFinite(serpent.crossingAttackCd)?serpent.crossingAttackCd:2.1;
    const a=serpent.crossingPrototype;
    if(a){a.age+=dt;driveHead(serpent,a);contact(e,serpent,a);if(a.age>=TIMING.end){serpent.crossingPrototype=null;serpent.crossingAttackCd=3.0;serpent.anchorX=Number.isFinite(player.x)?player.x:serpent.anchorX;serpent.anchorY=Number.isFinite(player.y)?player.y:serpent.anchorY;}}
    else{serpent.crossingAttackCd-=dt;if(serpent.crossingAttackCd<=0)startCrossing(e,serpent);}
    return true;
  };

  const baseBackground=drawBackground;
  drawBackground=function drawBackgroundWithCrossingWarning(){const result=baseBackground();drawWarning();return result;};
  window.stackfallTriggerAtroposGiantCrossing=()=>{const e=serpentEnemy(),serpent=serpentOf(e);if(!e||!serpent)return false;serpent.crossingPrototype=null;return startCrossing(e,serpent);};
  window.stackfallAtroposCrossingDiagnostics=()=>{const e=serpentEnemy(),s=serpentOf(e),a=s?.crossingPrototype;return{active:!!a,stage:stageOf(a),age:a?+a.age.toFixed(2):0,serial:a?.serial||0,cooldown:Number.isFinite(s?.crossingAttackCd)?+s.crossingAttackCd.toFixed(2):null};};
  window.stackfallAtroposPrototypeAttackState='giant-crossing-motion-v1';
})();
