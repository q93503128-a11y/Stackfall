// Branch-only pattern 6 prototype: World Devour for World Devourer Atropos.
// P4 only. The serpent withdraws offscreen, a jagged edge-attached world chunk is telegraphed,
// starlight is pulled outward, a giant maw bites the warned chunk, and a short-lived void scar remains.
(()=>{
  const WORLD={withdraw:.85,warn:2.20,bite:.78,scar:1.10,recover:1.05};
  WORLD.warnEnd=WORLD.withdraw+WORLD.warn;
  WORLD.biteEnd=WORLD.warnEnd+WORLD.bite;
  WORLD.scarEnd=WORLD.biteEnd+WORLD.scar;
  WORLD.end=WORLD.scarEnd+WORLD.recover;
  const BOUNDARY_SAMPLES=19;
  const headArt=new Image();headArt.decoding='async';headArt.src='assets/atropos-head.svg';
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const fract=x=>x-Math.floor(x);
  const seeded=(i,s)=>fract(Math.sin(i*12.9898+s*78.233)*43758.5453);
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e?.dead&&e.apexForm==='chronophage')||null;
  const serpentOf=e=>e?.atroposReborn?.worldDevourer||null;
  const phaseOf=e=>{const h=e.hp/Math.max(1,e.maxHp);return h<.25?4:h<.50?3:h<.75?2:1;};

  function orbitOffset(s){const a=(+s.motionTime||0)*.165+(+s.phaseBase||0),rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);return{x:Math.cos(a)*rx+Math.sin(a*2.07)*38,y:Math.sin(a*.96)*ry+Math.sin(a*2.41+1.1)*28};}
  function headPoint(s){const p=s?.points?.[0];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))return{x:p.x,y:p.y};const o=orbitOffset(s);return{x:(+s.anchorX||0)+o.x,y:(+s.anchorY||0)+o.y};}
  function drive(s,a,x,y){const o=orbitOffset(s);s.motionTime=a.hold;s.anchorX=x-o.x;s.anchorY=y-o.y;s.lastReal=performance.now()*.001;}
  function stage(a){if(!a)return'idle';const n=a.age;return n<WORLD.withdraw?'withdraw':n<WORLD.warnEnd?'warn':n<WORLD.biteEnd?'bite':n<WORLD.scarEnd?'scar':n<WORLD.end?'recover':'done';}

  function chooseSide(origin,target){const dx=origin.x-target.x,dy=origin.y-target.y;if(Math.abs(dx)>=Math.abs(dy))return dx>=0?'right':'left';return dy>=0?'bottom':'top';}
  function sideVectors(side){if(side==='right')return{outX:1,outY:0,perpX:0,perpY:1,rot:0,flip:true};if(side==='left')return{outX:-1,outY:0,perpX:0,perpY:-1,rot:0,flip:false};if(side==='top')return{outX:0,outY:-1,perpX:1,perpY:0,rot:Math.PI/2,flip:false};return{outX:0,outY:1,perpX:-1,perpY:0,rot:-Math.PI/2,flip:false};}
  function boundaryJitter(a,u){return Math.sin(u*7.2+a.serial*.83)*42+Math.sin(u*15.7-a.serial*.41)*17+Math.sin(u*25.1+1.7)*7;}
  function boundaryValue(a,ortho){const u=clamp((ortho-a.orthoCenter)/a.orthoSpan,-1.2,1.2);return a.boundaryBase+boundaryJitter(a,u);}
  function insideZone(a,x,y){if(a.side==='right'||a.side==='left'){if(Math.abs(y-a.targetY)>a.orthoSpan*1.04)return false;const b=boundaryValue(a,y);return a.side==='right'?x>=b:x<=b;}if(Math.abs(x-a.targetX)>a.orthoSpan*1.04)return false;const b=boundaryValue(a,x);return a.side==='bottom'?y>=b:y<=b;}
  function boundaryPoints(a){const pts=[];for(let i=0;i<BOUNDARY_SAMPLES;i++){const q=i/(BOUNDARY_SAMPLES-1),ortho=a.orthoCenter-a.orthoSpan+q*a.orthoSpan*2,b=boundaryValue(a,ortho);pts.push(a.side==='right'||a.side==='left'?{x:b,y:ortho}:{x:ortho,y:b});}return pts;}
  function polygonPoints(a){const edge=boundaryPoints(a),outer=a.outer;return a.side==='right'||a.side==='left'?[...edge,{x:outer,y:edge.at(-1).y},{x:outer,y:edge[0].y}]:[...edge,{x:edge.at(-1).x,y:outer},{x:edge[0].x,y:outer}];}
  function fillWorldPolygon(points,color,alpha,stroke=null,strokeAlpha=0,width=1){if(points.length<3)return;ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();let p=worldToScreen(points[0].x,points[0].y);ctx.moveTo(p.x,p.y);for(let i=1;i<points.length;i++){p=worldToScreen(points[i].x,points[i].y);ctx.lineTo(p.x,p.y);}ctx.closePath();ctx.fill();if(stroke){ctx.globalAlpha=strokeAlpha;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}ctx.restore();}
  function strokeBoundary(a,color,alpha,width){const pts=boundaryPoints(a);ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.beginPath();let p=worldToScreen(pts[0].x,pts[0].y);ctx.moveTo(p.x,p.y);for(let i=1;i<pts.length;i++){p=worldToScreen(pts[i].x,pts[i].y);ctx.lineTo(p.x,p.y);}ctx.stroke();ctx.restore();}

  function startWorld(e,s){
    if(!e||!s||phaseOf(e)<4||s.crossingPrototype||s.tailSeverPrototype||s.mawPrototype||s.ringPrototype||s.pastPrototype||s.worldDevourPrototype)return false;
    const origin=headPoint(s),targetX=+player.x||0,targetY=+player.y||0,serial=(s.worldDevourSerial=(s.worldDevourSerial||0)+1),side=chooseSide(origin,{x:targetX,y:targetY}),v=sideVectors(side),short=Math.min(vw,vh);
    const inset=clamp(short*.13,115,170),orthoSpan=(side==='right'||side==='left')?clamp(vh*.64,560,760):clamp(vw*.48,720,980),axisExtent=(side==='right'||side==='left')?Math.max(vw*.60,1050):Math.max(vh*.82,860);
    const boundaryBase=(side==='right'?targetX-inset:side==='left'?targetX+inset:side==='bottom'?targetY-inset:targetY+inset),outer=(side==='right'?targetX+axisExtent:side==='left'?targetX-axisExtent:side==='bottom'?targetY+axisExtent:targetY-axisExtent);
    const staging={x:targetX+v.outX*(axisExtent+520),y:targetY+v.outY*(axisExtent+520)},biteCenter={x:targetX+v.outX*clamp(short*.24,230,320),y:targetY+v.outY*clamp(short*.24,230,320)},headOutside={x:targetX+v.outX*(axisExtent+300),y:targetY+v.outY*(axisExtent+300)};
    s.worldDevourPrototype={age:0,origin,targetX,targetY,serial,side,...v,boundaryBase,outer,orthoCenter:(side==='right'||side==='left')?targetY:targetX,orthoSpan,staging,biteCenter,headOutside,hold:+s.motionTime||0,hit:false};
    return true;
  }
  function withdrawPoint(a,q){const k=ease(q),bend=170*Math.sin(k*Math.PI),x=lerp(a.origin.x,a.staging.x,k)+a.perpX*bend,y=lerp(a.origin.y,a.staging.y,k)+a.perpY*bend;return{x,y};}
  function recoverPoint(s,a,q){const o=orbitOffset(s),idle={x:(+player.x||0)+o.x,y:(+player.y||0)+o.y},control={x:a.staging.x+a.outX*220+a.perpX*760,y:a.staging.y+a.outY*220+a.perpY*760},u=1-q;return{x:u*u*a.staging.x+2*u*q*control.x+q*q*idle.x,y:u*u*a.staging.y+2*u*q*control.y+q*q*idle.y};}
  function resolveBite(e,a,q){if(a.hit||q<.60)return;a.hit=true;if(insideZone(a,+player.x||0,+player.y||0)&&player.invuln<=0)hurtPlayer(window.stackfallAtroposPatternDamage(e,'worldDevour'),e);state.camera.shake=Math.max(state.camera.shake,11);state.flash=Math.max(state.flash,.05);if(typeof audio!=='undefined'&&typeof audio.tone==='function')audio.tone(42,.22,'sawtooth',.045,-15);}
  function updateWorld(e,s,dt){
    const a=s.worldDevourPrototype;if(!a)return false;a.age+=dt;const st=stage(a);
    if(st==='withdraw'){const p=withdrawPoint(a,a.age/WORLD.withdraw);drive(s,a,p.x,p.y);}
    else if(st==='warn'||st==='bite'||st==='scar'){drive(s,a,a.staging.x,a.staging.y);if(st==='bite')resolveBite(e,a,(a.age-WORLD.warnEnd)/WORLD.bite);}
    else if(st==='recover'){const p=recoverPoint(s,a,smooth((a.age-WORLD.scarEnd)/WORLD.recover));drive(s,a,p.x,p.y);}
    if(a.age>=WORLD.end){s.worldDevourPrototype=null;s.prototypeAttackCd=.98;s.nextPrototypeAttack='crossing';s.anchorX=Number.isFinite(player.x)?player.x:s.anchorX;s.anchorY=Number.isFinite(player.y)?player.y:s.anchorY;}
    return true;
  }

  function drawSuction(a,strength){for(let i=0;i<28;i++){const r1=seeded(i,a.serial),r2=seeded(i+41,a.serial),r3=seeded(i+83,a.serial),ortho=a.orthoCenter+(r1*2-1)*a.orthoSpan*.94,b=boundaryValue(a,ortho),axis=lerp(b,a.outer,r2),len=lerp(35,145,r3)*strength;let A,B;if(a.side==='right'||a.side==='left'){const dir=a.side==='right'?1:-1;A=worldToScreen(axis,ortho);B=worldToScreen(axis+dir*len,ortho+(r3-.5)*10);}else{const dir=a.side==='bottom'?1:-1;A=worldToScreen(ortho,axis);B=worldToScreen(ortho+(r3-.5)*10,axis+dir*len);}ctx.save();ctx.globalAlpha=.16+.34*strength;ctx.strokeStyle='#c7f1ff';ctx.lineWidth=1+(i%3===0?1:0);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.restore();}}
  function drawGiantHead(a,q){if(!headArt.complete||headArt.naturalWidth<2)return;const enter=q<.62?ease(q/.62):1-smooth((q-.62)/.38),x=lerp(a.headOutside.x,a.biteCenter.x,enter),y=lerp(a.headOutside.y,a.biteCenter.y,enter),p=worldToScreen(x,y),baseW=clamp(Math.min(vw,vh)*1.04,820,1180),baseH=baseW*.50,snap=Math.max(0,1-Math.abs(q-.62)/.13),sy=1-.31*snap;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a.rot);if(a.flip)ctx.scale(-1,1);ctx.scale(1,sy);ctx.globalAlpha=.97;ctx.drawImage(headArt,-baseW*.5,-baseH*.5,baseW,baseH);ctx.restore();if(snap>.04)strokeBoundary(a,'#e5fbff',.78*snap,8);}
  function drawScarCracks(a,alpha){const pts=boundaryPoints(a);ctx.save();ctx.strokeStyle='#a8e5f6';ctx.lineWidth=2;ctx.globalAlpha=alpha;for(let i=1;i<pts.length-1;i+=3){const p=pts[i],seed=i+a.serial*5,steps=3;let x=p.x,y=p.y;ctx.beginPath();let s=worldToScreen(x,y);ctx.moveTo(s.x,s.y);for(let k=0;k<steps;k++){const advance=35+seeded(seed+k*7,a.serial)*60,side=(seeded(seed+k*11,a.serial)-.5)*70;x+=a.outX*advance+a.perpX*side;y+=a.outY*advance+a.perpY*side;s=worldToScreen(x,y);ctx.lineTo(s.x,s.y);}ctx.stroke();}ctx.restore();}
  function drawWorld(){
    const e=serpentEnemy(),s=serpentOf(e),a=s?.worldDevourPrototype;if(!a)return;const st=stage(a),poly=polygonPoints(a);
    if(st==='warn'){const q=smooth((a.age-WORLD.withdraw)/WORLD.warn);fillWorldPolygon(poly,'#ff3048',.07+.11*q,'#ff7184',.48+.30*q,4);strokeBoundary(a,'#ff9aaa',.58+.30*q,4);if(q>.22)drawSuction(a,clamp((q-.22)/.78,0,1));}
    else if(st==='bite'){const q=clamp((a.age-WORLD.warnEnd)/WORLD.bite,0,1);if(q<.16)fillWorldPolygon(poly,'#ff3048',.08*(1-q/.16),'#ff7184',.42*(1-q/.16),3);drawSuction(a,1-q*.35);drawGiantHead(a,q);}
    else if(st==='scar'){const q=clamp((a.age-WORLD.biteEnd)/WORLD.scar,0,1);fillWorldPolygon(poly,'#000000',.64*(1-.30*q),'#79b7ce',.36*(1-q),3);drawScarCracks(a,.46*(1-q*.72));}
    else if(st==='recover'){const q=clamp((a.age-WORLD.scarEnd)/WORLD.recover,0,1);fillWorldPolygon(poly,'#000000',.34*(1-q),'#79b7ce',.14*(1-q),2);drawScarCracks(a,.14*(1-q));}
  }

  const baseCombat=window.stackfallUpdateWorldDevourerCombat||window.stackfallUpdateWorldDevourerCrossing;
  if(typeof baseCombat==='function')window.stackfallUpdateWorldDevourerCombat=function updateWorldDevourerSixPatternCombat(e,dt){
    const s=serpentOf(e);if(!s)return baseCombat(e,dt);const phase=phaseOf(e);e.apexPhase=phase;
    if(s.worldDevourPrototype){e.apexElapsed=(e.apexElapsed||0)+dt;return updateWorld(e,s,dt);}
    if(phase<4&&s.nextPrototypeAttack==='world')s.nextPrototypeAttack='crossing';
    if(phase>=4&&!s.crossingPrototype&&!s.tailSeverPrototype&&!s.mawPrototype&&!s.ringPrototype&&!s.pastPrototype&&s.nextPrototypeAttack==='world'&&(+s.prototypeAttackCd||0)<=0){if(startWorld(e,s)){e.apexElapsed=(e.apexElapsed||0)+dt;return updateWorld(e,s,dt);}}
    const hadPast=!!s.pastPrototype,result=baseCombat(e,dt);
    if(hadPast&&!s.pastPrototype&&!s.crossingPrototype&&!s.tailSeverPrototype&&!s.mawPrototype&&!s.ringPrototype&&phase>=4)s.nextPrototypeAttack='world';
    return result;
  };
  window.stackfallUpdateWorldDevourerCrossing=window.stackfallUpdateWorldDevourerCombat;
  const baseBackground=drawBackground;drawBackground=function drawBackgroundWithWorldDevour(){const r=baseBackground();drawWorld();return r;};
  window.stackfallTriggerAtroposWorldDevour=()=>{const e=serpentEnemy(),s=serpentOf(e);if(!e||!s||phaseOf(e)<4)return false;s.crossingPrototype=s.tailSeverPrototype=s.mawPrototype=s.ringPrototype=s.pastPrototype=s.worldDevourPrototype=null;return startWorld(e,s);};
  window.stackfallAtroposWorldDevourDiagnostics=()=>{const e=serpentEnemy(),s=serpentOf(e),a=s?.worldDevourPrototype;return{phase:e?phaseOf(e):null,active:!!a,stage:stage(a),age:a?+a.age.toFixed(2):0,serial:a?.serial||0,side:a?.side||null,target:a?{x:Math.round(a.targetX),y:Math.round(a.targetY)}:null,hit:!!a?.hit};};
  window.stackfallAtroposPrototypeAttackState='p1-basic+p2-maw-ring+p3-past+p4-world-devour-motion-v6';
})();
