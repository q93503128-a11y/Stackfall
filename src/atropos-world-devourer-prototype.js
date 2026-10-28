// Simplified Atropos: one medium-large six-part serpent boss, intentionally close to the normal Stackfall boss language.
(()=>{
  const VERSION='atropos-simple-six-part-v1';
  const PARTS=['head','body-1','body-2','body-3','rear','tail'];
  const SPACING=[0,96,188,276,360,438];
  const RADII=[72,58,54,50,43,28];
  const MAX_HISTORY=260;
  const sat=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=sat(t);return t*t*(3-2*t);};
  const ease=t=>{t=sat(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const chronophage=e=>(e?.apexForm||e?.eliteForm)==='chronophage';
  const activeBoss=()=>state.entities.enemies?.find(e=>!e?.dead&&e.apexForm==='chronophage')||null;
  const serpentOf=e=>e?.atroposReborn?.worldDevourer||null;

  function seedHistory(s){
    s.history=[];const a=s.facing||0,ux=Math.cos(a),uy=Math.sin(a);
    for(let i=MAX_HISTORY-1;i>=0;i--)s.history.push({x:s.headX-ux*i*4,y:s.headY-uy*i*4});
    s.lastHistory=s.history.at(-1);
  }
  function ensureSimple(e){
    if(!chronophage(e))return null;
    const r=e.atroposReborn||(e.atroposReborn={});
    let s=r.worldDevourer;
    if(!s||s.simpleVersion!==VERSION){
      const arena=state.apexArena,ox=Number.isFinite(arena?.x)?arena.x:(Number(player.x)||0),oy=Number.isFinite(arena?.y)?arena.y:(Number(player.y)||0);
      s=r.worldDevourer={simpleVersion:VERSION,history:[],points:[],headX:ox+300,headY:oy-90,facing:Math.PI,orbit:0.1,attack:null,attackCd:1.25,lastAttack:null,serial:0,spawnAge:0,tailSwing:0,mouthOpen:0,hit:false};
      seedHistory(s);
      if(typeof defineBossBodyParts==='function')defineBossBodyParts(e,PARTS.map((key,i)=>({key,label:key.toUpperCase(),dx:0,dy:0,r:RADII[i],active:true,visible:true})));
    }
    e.contactSafeUntil=1e12;r.slash=null;r.slashCd=1e9;return s;
  }

  function recordHead(s,x,y){
    const last=s.lastHistory;s.headX=x;s.headY=y;
    if(!last||Math.hypot(x-last.x,y-last.y)>=4){
      const p={x,y};s.history.push(p);s.lastHistory=p;
      if(s.history.length>MAX_HISTORY)s.history.splice(0,s.history.length-MAX_HISTORY);
    }
  }
  function sampleDistance(history,d){
    if(!history?.length)return{x:0,y:0};
    let newer=history.at(-1),walked=0;
    for(let i=history.length-2;i>=0;i--){const older=history[i],dx=newer.x-older.x,dy=newer.y-older.y,len=Math.hypot(dx,dy);if(len>0&&walked+len>=d){const q=(d-walked)/len;return{x:newer.x-dx*q,y:newer.y-dy*q};}walked+=len;newer=older;}
    return{x:history[0].x,y:history[0].y};
  }
  function rebuildPoints(e,s){
    const pts=SPACING.map(d=>sampleDistance(s.history,d));pts[0]={x:s.headX,y:s.headY};
    if(Math.abs(s.tailSwing)>.001){
      for(const i of[4,5]){const prev=pts[Math.max(2,i-1)],a=Math.atan2(pts[i].y-prev.y,pts[i].x-prev.x),w=(i===5?1:.48)*s.tailSwing;pts[i]={x:pts[i].x-Math.sin(a)*w,y:pts[i].y+Math.cos(a)*w};}
    }
    for(let i=0;i<pts.length;i++){
      const ahead=pts[Math.max(0,i-1)],behind=pts[Math.min(pts.length-1,i+1)];pts[i].a=Math.atan2(ahead.y-behind.y,ahead.x-behind.x);
      const part=e.bodyParts?.[i];if(part){part.dx=pts[i].x-e.x;part.dy=pts[i].y-e.y;part.r=RADII[i];part.active=true;part.visible=true;part.dead=false;}
    }
    s.points=pts;e.x=s.headX;e.y=s.headY;if(typeof refreshBossBodyParts==='function')refreshBossBodyParts(e);return pts;
  }

  function idleTarget(s){
    const rx=Math.min(380,Math.max(270,vw*.21)),ry=Math.min(210,Math.max(145,vh*.19)),a=s.orbit;
    return{x:(Number(player.x)||0)+Math.cos(a)*rx+Math.sin(a*1.9)*28,y:(Number(player.y)||0)+Math.sin(a)*ry+Math.cos(a*1.37)*18};
  }
  function moveIdle(s,dt){
    s.orbit+=dt*.48;const t=idleTarget(s),k=1-Math.exp(-2.25*dt),nx=mix(s.headX,t.x,k),ny=mix(s.headY,t.y,k);s.facing=Math.atan2(ny-s.headY,nx-s.headX)||s.facing;recordHead(s,nx,ny);
  }
  function patternDamage(e,key){return typeof window.stackfallAtroposPatternDamage==='function'?window.stackfallAtroposPatternDamage(e,key):Math.max(7,(Number(e.damage)||0)*.4);}
  function damagePlayer(e,key){if((Number(player.invuln)||0)>0)return false;hurtPlayer(patternDamage(e,key),e);return true;}
  function pointSegmentDistance(px,py,a,b){const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(l2<=.001)return Math.hypot(px-a.x,py-a.y);const t=sat(((px-a.x)*dx+(py-a.y)*dy)/l2);return Math.hypot(px-(a.x+dx*t),py-(a.y+dy*t));}

  function startAttack(e,type,forced=false){
    const s=ensureSimple(e);if(!s||s.attack)return false;
    const px=Number(player.x)||0,py=Number(player.y)||0,h={x:s.headX,y:s.headY};s.serial++;s.hit=false;s.tailSwing=0;s.mouthOpen=0;
    if(type==='charge'){
      const a=Math.atan2(py-h.y,px-h.x),ux=Math.cos(a),uy=Math.sin(a);s.attack={type,age:0,serial:s.serial,start:h,target:{x:px,y:py},end:{x:px+ux*430,y:py+uy*430},dir:a};
    }else if(type==='devour'){
      const a=Math.atan2(py-h.y,px-h.x);s.attack={type,age:0,serial:s.serial,start:h,target:{x:px,y:py},dir:a};
    }else if(type==='tail'){
      const pts=s.points?.length?s.points:rebuildPoints(e,s),base=pts[4]||h,tip=pts[5]||base,a=Math.atan2(tip.y-base.y,tip.x-base.x);s.attack={type,age:0,serial:s.serial,target:{x:px,y:py},base:{x:base.x,y:base.y},baseAngle:a,side:(s.serial&1)?1:-1};
    }else if(type==='world'){
      const a=Math.atan2(py-h.y,px-h.x),ux=Math.cos(a),uy=Math.sin(a);s.attack={type,age:0,serial:s.serial,start:h,target:{x:px,y:py},staging:{x:px-ux*300,y:py-uy*300},dir:a};
    }else return false;
    s.lastAttack=type;return true;
  }
  window.stackfallAtroposSimpleStart=type=>{const e=activeBoss();return !!e&&startAttack(e,type,true);};

  function updateAttack(e,s,dt){
    const a=s.attack;if(!a)return false;a.age+=dt;s.mouthOpen=0;s.tailSwing=0;
    if(a.type==='charge'){
      const warn=.68,dash=.62,end=2.05;
      if(a.age<warn){recordHead(s,a.start.x,a.start.y);}
      else if(a.age<warn+dash){const q=ease((a.age-warn)/dash),prev={x:s.headX,y:s.headY},x=mix(a.start.x,a.end.x,q),y=mix(a.start.y,a.end.y,q);s.facing=a.dir;recordHead(s,x,y);if(!s.hit&&pointSegmentDistance(player.x,player.y,prev,{x,y})<82){s.hit=true;damagePlayer(e,'charge');state.camera.shake=Math.max(state.camera.shake,8);}}
      else moveIdle(s,dt);
      if(a.age>=end){s.attack=null;s.attackCd=1.45;}
    }else if(a.type==='devour'){
      const warn=.75,suckEnd=1.50,biteEnd=1.84,end=2.45;
      if(a.age<warn){recordHead(s,a.start.x,a.start.y);s.mouthOpen=.18;}
      else if(a.age<suckEnd){recordHead(s,a.start.x,a.start.y);s.mouthOpen=.38;const dx=s.headX-player.x,dy=s.headY-player.y,d=Math.hypot(dx,dy)||1;if(d<440){const pull=32*dt*(1-d/520);player.x+=dx/d*pull;player.y+=dy/d*pull;}}
      else if(a.age<biteEnd){const q=ease((a.age-suckEnd)/(biteEnd-suckEnd)),d=Math.hypot(a.target.x-a.start.x,a.target.y-a.start.y),travel=Math.min(190,Math.max(85,d-65)),x=a.start.x+Math.cos(a.dir)*travel*q,y=a.start.y+Math.sin(a.dir)*travel*q;s.mouthOpen=.92*Math.sin(q*Math.PI);s.facing=a.dir;recordHead(s,x,y);if(!s.hit&&q>.62&&Math.hypot(player.x-x,player.y-y)<100){s.hit=true;damagePlayer(e,'devour');state.camera.shake=Math.max(state.camera.shake,9);}}
      else moveIdle(s,dt);
      if(a.age>=end){s.attack=null;s.attackCd=1.55;s.mouthOpen=0;}
    }else if(a.type==='tail'){
      const warn=.72,sweepEnd=1.28,end=2.05;moveIdle(s,dt);
      if(a.age>=warn&&a.age<sweepEnd){const q=(a.age-warn)/(sweepEnd-warn);s.tailSwing=Math.sin(q*Math.PI)*150*a.side;if(!s.hit&&q>.43){const pts=rebuildPoints(e,s),base=pts[4],tip=pts[5],d=pointSegmentDistance(player.x,player.y,base,tip);if(d<72){s.hit=true;damagePlayer(e,'tail');state.camera.shake=Math.max(state.camera.shake,7);}}}
      if(a.age>=end){s.attack=null;s.attackCd=1.35;s.tailSwing=0;}
    }else if(a.type==='world'){
      const warn=1.05,biteEnd=1.52,end=2.55;
      if(a.age<warn){const q=smooth(a.age/warn),x=mix(a.start.x,a.staging.x,q),y=mix(a.start.y,a.staging.y,q);s.facing=a.dir;recordHead(s,x,y);s.mouthOpen=.25;}
      else if(a.age<biteEnd){const q=ease((a.age-warn)/(biteEnd-warn)),x=mix(a.staging.x,a.target.x,q),y=mix(a.staging.y,a.target.y,q);s.mouthOpen=.95*Math.sin(q*Math.PI);s.facing=a.dir;recordHead(s,x,y);if(!s.hit&&q>.62&&Math.hypot(player.x-a.target.x,player.y-a.target.y)<170){s.hit=true;damagePlayer(e,'worldBite');state.camera.shake=Math.max(state.camera.shake,11);state.flash=Math.max(state.flash,.035);}}
      else moveIdle(s,dt);
      if(a.age>=end){s.attack=null;s.attackCd=2.05;s.mouthOpen=0;}
    }
    return true;
  }

  function chooseAttack(e,s){
    const phase=e.apexPhase||1,pool=['charge','devour','tail'];if(phase>=4)pool.push('world');let choices=pool.filter(x=>x!==s.lastAttack);if(!choices.length)choices=pool;return choices[Math.floor(Math.random()*choices.length)];
  }
  function updateSimpleBoss(e,dt){
    const s=ensureSimple(e);if(!s)return;s.spawnAge+=dt;e.apexElapsed=(e.apexElapsed||0)+dt;const health=e.hp/Math.max(1,e.maxHp);e.apexPhase=health<.25?4:health<.5?3:health<.75?2:1;e.timeLock=0;
    if(!updateAttack(e,s,dt)){moveIdle(s,dt);s.attackCd-=dt;if(s.spawnAge>1&&s.attackCd<=0)startAttack(e,chooseAttack(e,s));}
    rebuildPoints(e,s);
  }
  window.stackfallUpdateAtroposSimpleBoss=updateSimpleBoss;

  const legacyEnsure=typeof ensureRebornAtropos==='function'?ensureRebornAtropos:null;
  ensureRebornAtropos=function ensureSimpleAtropos(e){if(chronophage(e))return !!ensureSimple(e);return legacyEnsure?legacyEnsure(e):false;};
  updateAtroposPose=function updateSimpleAtroposPose(e){const s=ensureSimple(e);return s?rebuildPoints(e,s):null;};

  function drawSegment(p,i,alpha=1){
    const sp=worldToScreen(p.x,p.y),a=p.a||0,scale=i===0?1:i===5?.76:1,w=[154,112,108,102,88,74][i]*scale,h=[92,76,72,68,59,44][i]*scale;
    ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(a);ctx.globalAlpha=alpha;ctx.lineJoin='round';
    if(i===0){
      const open=sat(serpentOf(activeBoss())?.mouthOpen||0),gap=8+open*20;
      ctx.shadowColor='rgba(125,205,255,.20)';ctx.shadowBlur=10;
      ctx.fillStyle='#090f20';ctx.strokeStyle='#566783';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(-w*.50,-gap);ctx.lineTo(-w*.20,-h*.47);ctx.lineTo(w*.48,-h*.26);ctx.lineTo(w*.56,-gap*.35);ctx.lineTo(w*.18,-2);ctx.lineTo(-w*.42,-gap*.25);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-w*.50,gap);ctx.lineTo(-w*.18,h*.45);ctx.lineTo(w*.48,h*.24);ctx.lineTo(w*.56,gap*.35);ctx.lineTo(w*.16,2);ctx.lineTo(-w*.42,gap*.25);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.shadowBlur=0;ctx.fillStyle='rgba(177,229,255,.78)';ctx.beginPath();ctx.ellipse(w*.18,0,24,7+open*7,0,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(132,195,230,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w*.24,-h*.25);ctx.lineTo(0,-8);ctx.lineTo(w*.20,-h*.18);ctx.stroke();
      for(const y of[-1,1])for(let k=0;k<4;k++){ctx.fillStyle='#d8edf4';ctx.beginPath();const x=-5+k*17;ctx.moveTo(x,y*(gap*.25));ctx.lineTo(x+8,y*(gap*.25+9));ctx.lineTo(x+13,y*(gap*.25));ctx.closePath();ctx.fill();}
    }else if(i===5){
      ctx.fillStyle='#080e1d';ctx.strokeStyle='#52627e';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-w*.55,0);ctx.lineTo(-w*.08,-h*.45);ctx.lineTo(w*.62,0);ctx.lineTo(-w*.08,h*.45);ctx.closePath();ctx.fill();ctx.stroke();
    }else{
      ctx.fillStyle=i%2?'#0b1327':'#0a1122';ctx.strokeStyle='#4c5d79';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-w*.52,0);ctx.lineTo(-w*.28,-h*.43);ctx.lineTo(w*.18,-h*.48);ctx.lineTo(w*.52,-h*.16);ctx.lineTo(w*.55,h*.12);ctx.lineTo(w*.16,h*.48);ctx.lineTo(-w*.30,h*.40);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle='rgba(108,171,213,.48)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w*.18,-h*.22);ctx.lineTo(0,0);ctx.lineTo(w*.22,-h*.14);ctx.stroke();
    }
    ctx.restore();
  }
  function drawSimpleBoss(e){const s=ensureSimple(e);if(!s?.points?.length)return;const alpha=s.spawnAge<.6?smooth(s.spawnAge/.6):1;for(let i=s.points.length-1;i>=0;i--)drawSegment(s.points[i],i,alpha);}
  drawAtroposWorldBody=function drawSimpleAtroposWorldBody(e){if(chronophage(e))drawSimpleBoss(e);};

  function drawTelegraph(){
    const e=activeBoss(),s=serpentOf(e),a=s?.attack;if(!e||!a)return;ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    if(a.type==='charge'&&a.age<.68){const A=worldToScreen(a.start.x,a.start.y),B=worldToScreen(a.end.x,a.end.y);ctx.globalAlpha=.20;ctx.strokeStyle='#ff3048';ctx.lineWidth=116;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.globalAlpha=.78;ctx.strokeStyle='#ff7184';ctx.lineWidth=3;ctx.stroke();}
    else if(a.type==='devour'&&a.age<1.50){const H=worldToScreen(a.start.x,a.start.y),ang=a.dir,dist=360,half=.34,P1=worldToScreen(a.start.x+Math.cos(ang-half)*dist,a.start.y+Math.sin(ang-half)*dist),P2=worldToScreen(a.start.x+Math.cos(ang+half)*dist,a.start.y+Math.sin(ang+half)*dist);ctx.globalAlpha=.13;ctx.fillStyle='#ff3048';ctx.beginPath();ctx.moveTo(H.x,H.y);ctx.lineTo(P1.x,P1.y);ctx.lineTo(P2.x,P2.y);ctx.closePath();ctx.fill();ctx.globalAlpha=.65;ctx.strokeStyle='#ff7184';ctx.lineWidth=3;ctx.stroke();}
    else if(a.type==='tail'&&a.age<.72){const B=worldToScreen(a.base.x,a.base.y),r=205,from=a.baseAngle-a.side*1.15,to=a.baseAngle+a.side*.15;ctx.globalAlpha=.14;ctx.fillStyle='#ff3048';ctx.beginPath();ctx.moveTo(B.x,B.y);ctx.arc(B.x,B.y,r,from,to,a.side<0);ctx.closePath();ctx.fill();ctx.globalAlpha=.72;ctx.strokeStyle='#ff7184';ctx.lineWidth=3;ctx.stroke();}
    else if(a.type==='world'&&a.age<1.05){const P=worldToScreen(a.target.x,a.target.y),r=170;ctx.globalAlpha=.12;ctx.fillStyle='#ff3048';ctx.beginPath();ctx.arc(P.x,P.y,r,0,TAU);ctx.fill();ctx.globalAlpha=.72;ctx.strokeStyle='#ff7184';ctx.lineWidth=4;ctx.setLineDash([14,10]);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
  }
  const baseBackground=drawBackground;drawBackground=function drawBackgroundWithSimpleAtroposTelegraph(){const r=baseBackground();drawTelegraph();return r;};

  window.stackfallAtroposArtDiagnostics=()=>{const e=activeBoss(),s=serpentOf(e);return{version:VERSION,renderMode:'six-part-canvas-chain',segments:s?.points?.map((p,i)=>({key:PARTS[i],x:Math.round(p.x),y:Math.round(p.y),angle:+(p.a||0).toFixed(2)}))||[],partCount:s?.points?.length||0,attack:s?.attack?{type:s.attack.type,age:+s.attack.age.toFixed(2)}:null};};
  window.stackfallAtroposSimpleDiagnostics=()=>{const e=activeBoss(),s=serpentOf(e);return{active:!!e,version:VERSION,phase:e?.apexPhase||0,attack:s?.attack?.type||null,attackAge:s?.attack?+s.attack.age.toFixed(2):0,cooldown:s?+s.attackCd.toFixed(2):0,parts:s?.points?.length||0};};
})();
