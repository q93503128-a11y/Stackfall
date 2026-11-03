// THE ANSWER / 응답 — three-phase combat prototype.
// Keeps the approved body presentation separate from combat so tuning does not destabilize entry/preflight logic.
(()=>{
  'use strict';
  if(window.stackfallVoidApexAnswerCombat==='v1')return;
  window.stackfallVoidApexAnswerCombat='v1';

  const PHASE_2_HP=.75,PHASE_3_HP=.30;
  const APEX_HP_MULT=6.46;      // Ordinary Apex common HP multiplier after the approved ~15% nerf.
  const APEX_DAMAGE_MULT=1.83; // Ordinary Apex common damage multiplier after the approved ~15% nerf.
  const ANSWER_HP_FORM=2.63,ANSWER_DAMAGE_FORM=1.51;
  const DAMAGE={spike:.62,split:.82,beam:.90,row:.72,bolt:.34,heavy:.52,cloneBeam:.60,collapse:.55,mine:.48,orbit:.32,well:.22,drone:.28};
  const TIMING={spike:5.8,split:18,beam:11.5,row:14.5,clone:3};
  const runtime={
    active:false,defeating:false,boss:null,phase:1,transition:null,attackPause:0,
    spikeCd:3.2,majorCd:{split:8,beam:Infinity,row:Infinity},cloneCd:3,lastMajor:null,
    spikes:[],major:null,clones:[],lastClone:null,phaseAge:0,serial:0,previousPlayer:null
  };
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const answerActive=()=>state.answerVoidApexPreview===true;
  const answerDiag=()=>window.stackfallVoidApexAnswerDiagnostics?.()||null;
  const frame=()=>answerDiag()?.frame||{visibleDepth:Math.max(245,Math.min(330,(Number(vh)||720)*.34))};
  const camera=()=>answerDiag()?.camera||{x:player.x,y:player.y};
  const worldToScreen=(x,y)=>{const c=camera();return{x:x-c.x+vw/2,y:y-c.y+vh/2};};
  const screenToWorld=(x,y)=>{const c=camera();return{x:c.x+x-vw/2,y:c.y+y-vh/2};};
  const playerScreen=()=>worldToScreen(player.x,player.y);
  const segDist=(px,py,x1,y1,x2,y2)=>{const vx=x2-x1,vy=y2-y1,l2=vx*vx+vy*vy;if(l2<=1e-9)return Math.hypot(px-x1,py-y1);const t=Math.max(0,Math.min(1,((px-x1)*vx+(py-y1)*vy)/l2)),x=x1+vx*t,y=y1+vy*t;return Math.hypot(px-x,py-y);};
  const hazardPlayerRadius=()=>Math.max(6,Math.min(9,(Number(player?.r)||14)*.55));
  function pointInPoly(px,py,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],cross=((a.y>py)!==(b.y>py))&&(px<(b.x-a.x)*(py-a.y)/((b.y-a.y)||1e-9)+a.x);if(cross)inside=!inside;}return inside;}
  function circleHitsPoly(px,py,r,poly){if(pointInPoly(px,py,poly))return true;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(segDist(px,py,a.x,a.y,b.x,b.y)<=r)return true;}return false;}
  function spikePolygon(s,reach=1){
    const r=clamp01(reach),ex=s.origin.x+(s.target.x-s.origin.x)*r,ey=s.origin.y+(s.target.y-s.origin.y)*r,dx=ex-s.origin.x,dy=ey-s.origin.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,nx=-uy,ny=ux,base=14+r*15,wobble=((s.index||0)%2?1:-1);
    const point=(along,side,skew=0)=>({x:s.origin.x+ux*d*along+nx*base*side+ux*skew,y:s.origin.y+uy*d*along+ny*base*side+uy*skew});
    return[point(0,.58),point(.25,.76),point(.59,.43,wobble*2.4),point(.82,.25,-wobble*1.2),{x:ex,y:ey},point(.80,-.22,wobble*1.4),point(.56,-.38,-wobble*2.2),point(.23,-.67),point(0,-.52)];
  }
  const SPLIT_BAND_HALF=12;
  const signedLine=(x,y,line)=>{const nx=-Math.sin(line.a),ny=Math.cos(line.a);return(x-line.cx)*nx+(y-line.cy)*ny;};
  const bodyOrigin=(x=vw*.5)=>({x,y:Math.max(72,frame().visibleDepth*.70)});
  const bossDamage=()=>Math.max(1,Number(runtime.boss?.damage)||34);
  function hitPlayer(mult,source=runtime.boss){if(player.invuln>0||state.mode==='gameover')return false;hurtPlayer(Math.max(1,bossDamage()*mult),source||'answer');return true;}
  function syncHudRatio(){if(!runtime.boss)return;const ratio=clamp01(runtime.boss.hp/Math.max(1,runtime.boss.maxHp));window.stackfallSetAnswerPrototypeHpRatio?.(ratio);return ratio;}

  function createBoss(){
    if(runtime.boss&&!runtime.boss.dead)return runtime.boss;
    const base=enemyConfig('boss'),cycle=Math.max(0,Math.floor(Number(state.apexCount)||0)),esc=window.stackfallApexEscalationForCycle?.(cycle)||{hp:1,damage:1};
    const f=frame(),c=camera(),screenY=Math.max(82,f.visibleDepth*.66),target=screenToWorld(vw*.5,screenY),r=Math.min(420,Math.max(230,vw*.27));
    const hp=Math.max(1,base.hp*ANSWER_HP_FORM*APEX_HP_MULT*(Number(esc.hp)||1));
    const damage=Math.max(1,base.damage*ANSWER_DAMAGE_FORM*APEX_DAMAGE_MULT*(Number(esc.damage)||1));
    const e={id:state.nextId++,type:'boss',kind:'answer-apex',eventKind:'answer-void-apex',answerBoss:true,name:'응답',x:target.x,y:target.y,r,hp,maxHp:hp,speed:0,damage,color:'#090a10',xp:0,hit:0,dead:false,phase:0,skillCd:999,burstCd:999,pulseCd:999,contactSafeUntil:1e12,controlImmune:true,knockbackImmune:true,timeLock:0};
    state.entities.enemies.push(e);runtime.boss=e;state.bossActiveId=e.id;syncHudRatio();return e;
  }
  function removeBoss(){const e=runtime.boss;if(e){const i=state.entities.enemies.indexOf(e);if(i>=0)state.entities.enemies.splice(i,1);}if(state.bossActiveId===e?.id)state.bossActiveId=null;runtime.boss=null;}
  function clearPatterns(){runtime.spikes.length=0;runtime.major=null;runtime.clones.length=0;runtime.attackPause=Math.max(runtime.attackPause,.25);}
  function resetTimers(phase=1){runtime.spikeCd=phase===1?3.2:2.3;runtime.majorCd.split=phase===1?8:Math.min(runtime.majorCd.split||8,6);runtime.majorCd.beam=phase>=2?5:Infinity;runtime.majorCd.row=phase>=2?8:Infinity;runtime.cloneCd=phase>=3?3:Infinity;runtime.lastMajor=null;runtime.phaseAge=0;}
  function beginCombat(){
    runtime.active=true;runtime.defeating=false;runtime.phase=1;runtime.transition=null;runtime.serial++;clearPatterns();resetTimers(1);createBoss();
    window.stackfallSetAnswerPrototypePhase?.(1,true);window.stackfallSetAnswerPrototypeHpRatio?.(1);
  }
  function endCombat(){runtime.active=false;runtime.defeating=false;runtime.transition=null;clearPatterns();removeBoss();}
  function defeatCombat(){if(runtime.defeating)return;runtime.defeating=true;clearPatterns();if(runtime.boss){runtime.boss.hp=0;runtime.boss.dead=true;}window.stackfallSetAnswerPrototypeHpRatio?.(0);window.stackfallDefeatAnswerPrototype?.();}

  function beginTransition(to){
    if(runtime.transition||runtime.defeating||to<=runtime.phase||to>3)return false;
    clearPatterns();runtime.transition={from:runtime.phase,to,age:0,duration:to===2?1.35:1.60,flash:false,burst:false};runtime.attackPause=2;return true;
  }
  function finishTransition(){
    const tr=runtime.transition;if(!tr)return;runtime.phase=tr.to;runtime.transition=null;runtime.phaseAge=0;window.stackfallSetAnswerPrototypePhase?.(runtime.phase,true);
    if(runtime.phase===2){runtime.majorCd.beam=5;runtime.majorCd.row=8;runtime.spikeCd=Math.min(runtime.spikeCd,2.0);}
    if(runtime.phase===3){runtime.cloneCd=3;runtime.spikeCd=Math.min(runtime.spikeCd,1.7);}
    state.camera.shake=Math.max(Number(state.camera.shake)||0,runtime.phase===3?5.2:3.4);
  }
  function updateTransition(dt){
    const tr=runtime.transition;if(!tr)return;
    tr.age+=dt;const p=clamp01(tr.age/tr.duration);
    if(!tr.flash&&p>=.48){tr.flash=true;state.flash=Math.max(Number(state.flash)||0,tr.to===3?.08:.045);state.camera.shake=Math.max(Number(state.camera.shake)||0,tr.to===3?4.2:2.7);try{audio?.tone?.(tr.to===3?52:78,.16,'sawtooth',.020,tr.to===3?-20:20);}catch{}}
    if(!tr.burst&&p>=.72){tr.burst=true;try{shockwave(player.x,player.y,'#ffffff',tr.to===3?175:125,.34,2.2);}catch{}}
    if(tr.age>=tr.duration)finishTransition();
  }
  function phaseFromHp(){
    if(!runtime.boss||runtime.transition||runtime.defeating)return;
    const ratio=syncHudRatio();if(runtime.phase===1&&ratio<=PHASE_2_HP)beginTransition(2);else if(runtime.phase===2&&ratio<=PHASE_3_HP)beginTransition(3);
  }

  function spikeSuppressed(){const m=runtime.major;if(runtime.transition||runtime.attackPause>0)return true;if(!m)return false;return(m.kind==='split'&&m.age>=m.warn-1.2&&m.age<=m.warn+.35)||(m.kind==='row'&&m.age>=m.warn-.65&&m.age<=m.warn+m.active);}
  function startSpikes(){
    const count=runtime.phase,ps=playerScreen(),left=vw*.09,right=vw*.91,top=Math.max(frame().visibleDepth+38,vh*.39),bottom=vh*.91;
    const offsets=count===1?[0]:count===2?[-105,105]:[-150,0,150];
    runtime.spikes=offsets.map((off,i)=>{const tx=Math.max(left,Math.min(right,ps.x+off+rand(-32,32))),ty=Math.max(top,Math.min(bottom,ps.y+rand(-28,28))),origin=bodyOrigin(tx+rand(-44,44));return{origin,target:{x:tx,y:ty},age:0,warn:1.4,thrust:.14,hold:.35,retract:.18,hit:false,index:i};});
    runtime.spikeCd=TIMING.spike+rand(-.5,.5);
  }
  function updateSpikes(dt){
    if(!runtime.spikes.length){runtime.spikeCd-=dt;if(runtime.spikeCd<=0&&!spikeSuppressed())startSpikes();return;}
    const ps=playerScreen();for(const s of runtime.spikes){s.age+=dt;if(s.age>=s.warn&&s.age<=s.warn+s.thrust+s.hold&&!s.hit){const travel=clamp01((s.age-s.warn)/s.thrust),ex=s.origin.x+(s.target.x-s.origin.x)*travel,ey=s.origin.y+(s.target.y-s.origin.y)*travel;const poly=spikePolygon(s,travel);if(circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),poly)){s.hit=true;hitPlayer(DAMAGE.spike);}}}
    if(runtime.spikes.every(s=>s.age>=s.warn+s.thrust+s.hold+s.retract))runtime.spikes.length=0;
  }

  function splitLine(){
    const angles=[0,Math.PI/2,Math.PI*.25,-Math.PI*.25,Math.PI*.16,-Math.PI*.16],a=angles[Math.floor(Math.random()*angles.length)],nx=-Math.sin(a),ny=Math.cos(a),offset=rand(-.18,.18)*Math.min(vw*.86,vh*.52),cx=vw*.5+nx*offset,cy=vh*.67+ny*offset,span=Math.hypot(vw,vh)*1.25;return{cx,cy,a,span};
  }
  function startMajor(kind){
    if(runtime.major||runtime.transition||runtime.defeating)return false;
    if(kind==='split')runtime.major={kind,age:0,warn:3.4,active:4.0,fade:.8,line:splitLine(),side:0,impact:false};
    else if(kind==='beam'&&runtime.phase>=2)runtime.major={kind,age:0,warn:1.9,active:.70,fade:.32,width:Math.max(72,Math.min(108,vw*.055)),hit:false};
    else if(kind==='row'&&runtime.phase>=2){const count=runtime.phase>=3?5:4,indices=[0,1,2,3,4].slice(0,count),fake=[];while(fake.length<2){const i=indices[Math.floor(Math.random()*indices.length)];if(!fake.includes(i))fake.push(i);}runtime.major={kind,axis:'horizontal',age:0,warn:2.3,active:.65,fade:.25,count,fake:new Set(fake),crumble:new Set(),directions:Array.from({length:count},(_,i)=>i%2===0?1:-1),hit:false};}
    else return false;
    runtime.lastMajor=kind;if(kind==='split')runtime.majorCd.split=TIMING.split+rand(-1,1);if(kind==='beam')runtime.majorCd.beam=TIMING.beam+rand(-.6,.6);if(kind==='row')runtime.majorCd.row=TIMING.row+rand(-.8,.8);return true;
  }
  function dueMajor(){
    const kinds=runtime.phase===1?['split']:['split','beam','row'],due=kinds.filter(k=>runtime.majorCd[k]<=0);if(!due.length)return null;const alternate=due.filter(k=>k!==runtime.lastMajor),pool=alternate.length?alternate:due;return pool.sort((a,b)=>runtime.majorCd[a]-runtime.majorCd[b])[0];
  }
  function updateMajorTimers(dt){for(const k of['split','beam','row'])if(Number.isFinite(runtime.majorCd[k]))runtime.majorCd[k]-=dt;if(!runtime.major){const kind=dueMajor();if(kind)startMajor(kind);}}
  function applySplitCollision(m){
    const ps=playerScreen(),line=m.line,margin=SPLIT_BAND_HALF+hazardPlayerRadius(),s=signedLine(ps.x,ps.y,line);if(!m.side)m.side=s>=0?1:-1;if(s*m.side>=margin)return;const nx=-Math.sin(line.a),ny=Math.cos(line.a),push=(margin-s*m.side)*m.side;player.x+=nx*push;player.y+=ny*push;
  }
  function rowLaneGeometry(m,index,reach=1){
    const top=Math.max(frame().visibleDepth+26,vh*.405),bottom=vh*.925,laneH=(bottom-top)/m.count,y0=top+index*laneH+3,y1=top+(index+1)*laneH-3,mid=(y0+y1)*.5,left=vw*.025,right=vw*.975,dir=m.directions?.[index]||1,span=right-left,r=clamp01(reach),tip=dir>0?left+span*r:right-span*r,rear=dir>0?left-54:right+54,len=Math.abs(tip-rear),x=t=>rear+dir*len*t,h=y1-y0;
    const poly=[
      {x:rear,y:mid-h*.36},{x:x(.14),y:y0+h*.12},{x:x(.38),y:y0+h*.04},{x:x(.63),y:y0+h*.16},{x:x(.82),y:y0+h*.08},{x:x(.92),y:mid-h*.20},{x:tip,y:mid},
      {x:x(.90),y:mid+h*.18},{x:x(.74),y:y1-h*.10},{x:x(.48),y:y1-h*.03},{x:x(.22),y:y1-h*.17},{x:rear,y:mid+h*.38}
    ];
    return{top,bottom,laneH,y0,y1,mid,left,right,dir,poly};
  }
  function updateMajor(dt){
    const m=runtime.major;if(!m){updateMajorTimers(dt);return;}m.age+=dt;
    if(m.kind==='split'){
      if(!m.impact&&m.age>=m.warn){m.impact=true;const ps=playerScreen();m.side=signedLine(ps.x,ps.y,m.line)>=0?1:-1;if(Math.abs(signedLine(ps.x,ps.y,m.line))<=SPLIT_BAND_HALF+hazardPlayerRadius())hitPlayer(DAMAGE.split);state.camera.shake=Math.max(Number(state.camera.shake)||0,7);}
      if(m.age>=m.warn&&m.age<m.warn+m.active+m.fade*.65)applySplitCollision(m);
      if(m.age>=m.warn+m.active+m.fade)runtime.major=null;
    }else if(m.kind==='beam'){
      if(m.age>=m.warn&&m.age<m.warn+m.active&&!m.hit){const ps=playerScreen();if(Math.abs(ps.x-vw*.5)<=m.width*.5+player.r){m.hit=true;hitPlayer(DAMAGE.beam);state.camera.shake=Math.max(Number(state.camera.shake)||0,6.2);}}
      if(m.age>=m.warn+m.active+m.fade)runtime.major=null;
    }else if(m.kind==='row'){
      if(m.age>=m.warn&&m.age<m.warn+m.active){const ps=playerScreen(),reach=clamp01((m.age-m.warn)/.18);for(let i=0;i<m.count;i++){if(m.crumble.has(i))continue;const g=rowLaneGeometry(m,i,reach);if(!circleHitsPoly(ps.x,ps.y,hazardPlayerRadius(),g.poly))continue;if(m.fake.has(i)){m.crumble.add(i);const wp=screenToWorld(ps.x,ps.y);try{spawnParticle(wp.x,wp.y,'#ffffff',18,170,3.4);}catch{}}else if(!m.hit){m.hit=true;hitPlayer(DAMAGE.row);}break;}}
      if(m.age>=m.warn+m.active+m.fade)runtime.major=null;
    }
  }

  const cloneFamily=key=>({core:'bolt',ember:'bolt',comet:'heavy',missile:'heavy',gravity:'well',chrono:'slow',prism:'beam',rail:'beam',ion:'beam',blade:'orbit',arc:'orbit',spiral:'orbit',mirror:'orbit',nova:'collapse',vacuum:'collapse',mine:'mine',drone:'drone',gate:'beam',bulwark:'beam'}[key]||'bolt');
  function cloneableKeys(){const keys=[];if(weaponCount('core')>0)keys.push('core');for(const key of state.weaponSlots||[])if(key&&WEAPONS[key]&&weaponCount(key)>0&&!keys.includes(key))keys.push(key);return keys;}
  function chooseCloneKey(){const keys=cloneableKeys();if(!keys.length)return'core';if(keys.length===1)return keys[0];const alt=keys.filter(k=>k!==runtime.lastClone),pool=alt.length&&Math.random()<.78?alt:keys;return pool[Math.floor(Math.random()*pool.length)];}
  function startClone(forceKey=null){
    if(runtime.phase<3||runtime.transition||runtime.defeating)return false;const key=forceKey||chooseCloneKey(),family=cloneFamily(key),ps=playerScreen(),target=screenToWorld(ps.x,ps.y),origin=screenToWorld(vw*.5,Math.max(70,frame().visibleDepth*.66)),level=Math.max(1,weaponCount(key)||1),clone={key,family,age:0,hit:false,x:origin.x,y:origin.y,targetX:target.x,targetY:target.y,level};
    if(family==='bolt'||family==='heavy'){const a=Math.atan2(target.y-origin.y,target.x-origin.x),speed=family==='heavy'?250:390;clone.vx=Math.cos(a)*speed;clone.vy=Math.sin(a)*speed;clone.r=family==='heavy'?11:6;clone.life=family==='heavy'?4.4:3.3;clone.turn=family==='heavy'?.75:0;}
    else if(family==='beam'){clone.warn=.78;clone.active=key==='prism'?.46:.22;clone.fade=.20;clone.a=Math.atan2(target.y-origin.y,target.x-origin.x);clone.length=Math.hypot(vw,vh)*1.3;clone.width=key==='rail'?18:key==='prism'?24:14;}
    else if(family==='well'||family==='slow'||family==='collapse'||family==='mine'){clone.x=target.x;clone.y=target.y;clone.warn=family==='mine'?.65:.85;clone.active=family==='well'||family==='slow'?2.15:.24;clone.fade=.35;clone.r=family==='well'?118:family==='slow'?132:family==='collapse'?102:72;clone.tick=0;}
    else if(family==='orbit'){clone.x=target.x;clone.y=target.y;clone.warn=.42;clone.active=1.45;clone.fade=.25;clone.radius=82;clone.angle=Math.random()*Math.PI*2;clone.count=key==='spiral'?4:3;}
    else if(family==='drone'){clone.x=origin.x;clone.y=origin.y;clone.warn=.45;clone.active=2.1;clone.fade=.2;clone.shot=.18;}
    runtime.clones.push(clone);while(runtime.clones.length>2)runtime.clones.shift();runtime.lastClone=key;runtime.cloneCd=TIMING.clone;return true;
  }
  function cloneCritical(){const m=runtime.major;if(!m)return false;if(m.kind==='split')return m.age>=m.warn-1&&m.age<=m.warn+.45;if(m.kind==='row')return m.age>=m.warn-.7&&m.age<=m.warn+m.active;if(m.kind==='beam')return m.age>=m.warn-.45&&m.age<=m.warn+m.active;return false;}
  function updateClone(c,dt,before){
    c.age+=dt;const family=c.family;
    if(family==='bolt'||family==='heavy'){
      if(family==='heavy'&&c.turn>0){const a=Math.atan2(player.y-c.y,player.x-c.x),cur=Math.atan2(c.vy,c.vx),delta=Math.atan2(Math.sin(a-cur),Math.cos(a-cur)),next=cur+Math.max(-c.turn*dt,Math.min(c.turn*dt,delta)),speed=Math.hypot(c.vx,c.vy);c.vx=Math.cos(next)*speed;c.vy=Math.sin(next)*speed;}
      const ox=c.x,oy=c.y;c.x+=c.vx*dt;c.y+=c.vy*dt;c.life-=dt;if(!c.hit&&player.invuln<=0&&segDist(player.x,player.y,ox,oy,c.x,c.y)<=player.r+c.r){c.hit=true;c.life=0;hitPlayer(family==='heavy'?DAMAGE.heavy:DAMAGE.bolt);}return c.life>0;
    }
    if(family==='beam'){if(c.age>=c.warn&&c.age<c.warn+c.active&&!c.hit){const x2=c.x+Math.cos(c.a)*c.length,y2=c.y+Math.sin(c.a)*c.length;if(segDist(player.x,player.y,c.x,c.y,x2,y2)<=player.r+c.width*.5){c.hit=true;hitPlayer(DAMAGE.cloneBeam);}}return c.age<c.warn+c.active+c.fade;}
    if(family==='well'||family==='slow'||family==='collapse'||family==='mine'){
      const active=c.age>=c.warn&&c.age<c.warn+c.active;if(active){const dx=c.x-player.x,dy=c.y-player.y,d=Math.hypot(dx,dy)||1;if(family==='well'&&d<c.r*1.5){const pull=(1-Math.min(1,d/(c.r*1.5)))*125;player.x+=dx/d*pull*dt;player.y+=dy/d*pull*dt;if(c.level>=4&&d<c.r+player.r){c.tick-=dt;if(c.tick<=0){c.tick=.58;hitPlayer(DAMAGE.well);}}}else if(family==='slow'&&d<c.r+player.r&&before){player.x=before.x+(player.x-before.x)*.52;player.y=before.y+(player.y-before.y)*.52;}else if((family==='collapse'||family==='mine')&&!c.hit&&d<c.r+player.r){c.hit=true;hitPlayer(family==='mine'?DAMAGE.mine:DAMAGE.collapse);}}
      return c.age<c.warn+c.active+c.fade;
    }
    if(family==='orbit'){if(c.age>=c.warn&&c.age<c.warn+c.active){c.angle+=dt*2.8;for(let i=0;i<c.count;i++){const a=c.angle+i*Math.PI*2/c.count,x=c.x+Math.cos(a)*c.radius,y=c.y+Math.sin(a)*c.radius;if(!c.hit&&Math.hypot(player.x-x,player.y-y)<=player.r+13){c.hit=true;hitPlayer(DAMAGE.orbit);}}}return c.age<c.warn+c.active+c.fade;}
    if(family==='drone'){if(c.age>=c.warn&&c.age<c.warn+c.active){c.shot-=dt;if(c.shot<=0){c.shot=.48;const a=Math.atan2(player.y-c.y,player.x-c.x),p=spawnEnemyProjectile(c.x,c.y,a,340,bossDamage()*DAMAGE.drone,'#050507',5,2.6,'needle');p.answerClone=true;}}return c.age<c.warn+c.active+c.fade;}
    return false;
  }
  function updateClones(dt,before){
    if(runtime.phase<3){runtime.clones.length=0;return;}runtime.cloneCd-=dt;if(runtime.cloneCd<=0&&!runtime.transition&&!cloneCritical())startClone();
    const keep=[];for(const c of [...runtime.clones])if(updateClone(c,dt,before))keep.push(c);runtime.clones=keep.slice(-2);
  }

  function updateCombat(dt,before){
    if(!answerActive()){if(runtime.active)endCombat();return;}
    if(!runtime.active)beginCombat();if(runtime.defeating)return;
    if(!runtime.boss||runtime.boss.dead){if(!runtime.defeating)createBoss();}
    const e=runtime.boss;if(e){const target=screenToWorld(vw*.5,Math.max(82,frame().visibleDepth*.66));e.x=target.x;e.y=target.y;e.speed=0;e.contactSafeUntil=1e12;}
    runtime.previousPlayer=before;runtime.phaseAge+=dt;runtime.attackPause=Math.max(0,runtime.attackPause-dt);phaseFromHp();updateTransition(dt);
    if(runtime.transition)return;
    updateSpikes(dt);updateMajor(dt);updateClones(dt,before);syncHudRatio();
  }

  // Keep the target damageable/targetable, but suppress ordinary boss AI and ordinary boss body rendering.
  const baseDealDamage=dealDamage;
  dealDamage=function answerDamageRouter(enemy,amount,opts={}){
    if(enemy!==runtime.boss)return baseDealDamage(enemy,amount,opts);
    if(runtime.defeating||!enemy||enemy.dead)return;
    const result=baseDealDamage(enemy,amount,{...opts,deferKill:true});
    if(enemy.hp<=0||enemy.dead){enemy.hp=0;enemy.dead=true;syncHudRatio();defeatCombat();return result;}
    enemy.dead=false;syncHudRatio();phaseFromHp();return result;
  };
  const baseUpdateEnemies=updateEnemies;
  updateEnemies=function updateEnemiesWithoutAnswerBody(dt){const e=runtime.boss,arr=state.entities.enemies,i=e?arr.indexOf(e):-1;if(i<0)return baseUpdateEnemies(dt);arr.splice(i,1);try{return baseUpdateEnemies(dt);}finally{if(runtime.active&&!runtime.defeating&&!e.dead)arr.splice(Math.min(i,arr.length),0,e);}};
  const baseDrawEnemies=drawEnemies;
  drawEnemies=function drawEnemiesWithoutAnswerBody(){const e=runtime.boss,arr=state.entities.enemies,i=e?arr.indexOf(e):-1;if(i<0)return baseDrawEnemies();arr.splice(i,1);try{return baseDrawEnemies();}finally{if(runtime.active&&!runtime.defeating&&!e.dead)arr.splice(Math.min(i,arr.length),0,e);}};
  if(typeof registerPlayerUpdateInterceptor==='function')registerPlayerUpdateInterceptor('void-apex-answer-combat-v1',function answerCombatPlayerUpdate(next,dt){const before={x:player.x,y:player.y};const result=next(dt);updateCombat(Math.max(0,Number(dt)||0),before);return result;});

  const P2_CRACKS=[[[.50,.10],[.46,.16],[.43,.23],[.37,.27]],[[.52,.13],[.57,.18],[.61,.24]],[[.48,.18],[.50,.26],[.47,.34]]];
  const P3_CRACKS=[[[.37,.27],[.31,.31],[.25,.38]],[[.61,.24],[.67,.29],[.74,.33]],[[.47,.34],[.42,.41],[.35,.46]],[[.50,.26],[.55,.36],[.61,.43]],[[.43,.23],[.39,.19],[.34,.16]],[[.57,.18],[.63,.14],[.68,.10]]];
  function drawCrackPath(points,progress,alpha=1){if(progress<=0)return;const f=frame(),h=f.visibleDepth,w=vw,total=points.length-1,scaled=progress*total;ctx.save();ctx.strokeStyle=`rgba(255,255,255,${.72*alpha})`;ctx.shadowColor='rgba(255,255,255,.72)';ctx.shadowBlur=5;ctx.lineWidth=1.25;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();const p0=points[0];ctx.moveTo(p0[0]*w,p0[1]*h);for(let i=1;i<points.length;i++){const local=scaled-(i-1);if(local<=0)break;const a=points[i-1],b=points[i],q=Math.min(1,local);ctx.lineTo((a[0]+(b[0]-a[0])*q)*w,(a[1]+(b[1]-a[1])*q)*h);if(q<1)break;}ctx.stroke();ctx.restore();}
  function drawCosmicMotion(){const f=frame(),t=performance.now()*.001,limit=Math.max(90,f.visibleDepth*.62);ctx.save();ctx.beginPath();ctx.rect(0,0,vw,limit);ctx.clip();ctx.globalCompositeOperation='screen';for(let i=0;i<28;i++){const seed=(i*97)%251,x=((i*173.3+t*(.34+(i%3)*.08)+seed)% (vw+80))-40,y=18+((i*71+seed*3)%Math.max(40,limit-30)),pulse=.045+.035*(.5+.5*Math.sin(t*.45+i));ctx.globalAlpha=pulse;ctx.fillStyle=i%5===0?'#d8e6ff':'#ffffff';ctx.beginPath();ctx.arc(x,y,i%7===0?1.15:.65,0,Math.PI*2);ctx.fill();}ctx.restore();}
  function drawPhaseFissures(){let p2=runtime.phase>=2?1:0,p3=runtime.phase>=3?1:0;if(runtime.transition){const q=clamp01(runtime.transition.age/runtime.transition.duration);if(runtime.transition.to===2)p2=q;if(runtime.transition.to===3){p2=1;p3=q;}}for(const path of P2_CRACKS)drawCrackPath(path,p2,.72);for(const path of P3_CRACKS)drawCrackPath(path,p3,.88);}
  function drawSpikes(){const t=performance.now()*.001;for(const s of runtime.spikes){const a=s.age;if(a<s.warn){const p=clamp01(a/s.warn),ghost=spikePolygon(s,1);ctx.save();ctx.fillStyle=`rgba(0,0,0,${.025+p*.055})`;ctx.strokeStyle=`rgba(211,215,228,${.30+p*.48})`;ctx.shadowColor=`rgba(226,230,240,${.08+p*.16})`;ctx.shadowBlur=4+p*3;ctx.lineWidth=1.25;ctx.setLineDash([7,8]);ctx.beginPath();ctx.moveTo(ghost[0].x,ghost[0].y);for(let i=1;i<ghost.length;i++)ctx.lineTo(ghost[i].x,ghost[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(0,0,0,.68)';ctx.strokeStyle=`rgba(145,126,174,${.28+p*.28})`;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(s.origin.x,s.origin.y,8+p*3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle=`rgba(247,249,255,${.44+p*.50})`;ctx.lineWidth=1.45;ctx.beginPath();ctx.arc(s.target.x,s.target.y,12+(1-p)*7+Math.sin(t*8+s.index)*1.3,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(250,251,255,${.28+p*.48})`;ctx.beginPath();ctx.arc(s.target.x,s.target.y,2.3+p*1.8,0,Math.PI*2);ctx.fill();ctx.restore();continue;}const elapsed=a-s.warn,total=s.thrust+s.hold+s.retract;if(elapsed>total)continue;let reach=elapsed<s.thrust?elapsed/s.thrust:elapsed<s.thrust+s.hold?1:1-(elapsed-s.thrust-s.hold)/s.retract;reach=clamp01(reach);const poly=spikePolygon(s,reach),ex=s.origin.x+(s.target.x-s.origin.x)*reach,ey=s.origin.y+(s.target.y-s.origin.y)*reach;ctx.save();ctx.shadowColor='rgba(0,0,0,.92)';ctx.shadowBlur=10;ctx.fillStyle='#000000';ctx.strokeStyle='rgba(132,108,158,.50)';ctx.lineWidth=1.35;ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='rgba(68,49,88,.55)';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(s.origin.x,s.origin.y);ctx.lineTo(s.origin.x+(ex-s.origin.x)*.68,s.origin.y+(ey-s.origin.y)*.68);ctx.stroke();ctx.fillStyle='#000';ctx.strokeStyle='rgba(108,86,132,.44)';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(s.origin.x,s.origin.y,11+reach*3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}}
  function drawSplit(m){const line=m.line,ux=Math.cos(line.a),uy=Math.sin(line.a),x1=line.cx-ux*line.span,y1=line.cy-uy*line.span,x2=line.cx+ux*line.span,y2=line.cy+uy*line.span,nx=-uy,ny=ux,band=SPLIT_BAND_HALF;if(m.age<m.warn){const p=clamp01(m.age/m.warn);ctx.save();ctx.strokeStyle=`rgba(0,0,0,${.045+p*.075})`;ctx.lineWidth=band*2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle=`rgba(232,236,246,${.18+p*.58})`;ctx.lineWidth=1.2+p*1.45;ctx.setLineDash([9,11]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=`rgba(177,184,203,${.10+p*.22})`;ctx.lineWidth=1;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(x1+nx*band*side,y1+ny*band*side);ctx.lineTo(x2+nx*band*side,y2+ny*band*side);ctx.stroke();}ctx.restore();return;}const elapsed=m.age-m.warn,alpha=elapsed<=m.active?1:1-clamp01((elapsed-m.active)/m.fade);ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='rgba(0,0,0,.52)';ctx.lineWidth=(band+4)*2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle='#000000';ctx.lineWidth=band*2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle='rgba(190,197,216,.26)';ctx.lineWidth=1.1;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(x1+nx*band*side,y1+ny*band*side);ctx.lineTo(x2+nx*band*side,y2+ny*band*side);ctx.stroke();}const flow=(performance.now()*.075)%54;ctx.lineWidth=1.6;ctx.setLineDash([7,20]);for(const [i,off] of[-6,0,6].entries()){ctx.strokeStyle=`rgba(${70+i*8},${56+i*6},${92+i*10},${.22+i*.055})`;ctx.lineDashOffset=-flow-i*13;ctx.beginPath();ctx.moveTo(x1+nx*off,y1+ny*off);ctx.lineTo(x2+nx*off,y2+ny*off);ctx.stroke();}ctx.restore();}
  function drawBeam(m){const f=frame(),x=vw*.5,start=Math.max(20,f.visibleDepth*.18);if(m.age<m.warn){const p=clamp01(m.age/m.warn),pulse=.5+.5*Math.sin(performance.now()*.012);ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(238,246,255,${.012+p*.045})`;ctx.fillRect(x-m.width*.5,start,m.width,vh-start);ctx.strokeStyle=`rgba(238,244,255,${.16+p*.42})`;ctx.lineWidth=1;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(x+side*m.width*.5,start);ctx.lineTo(x+side*m.width*.5,vh);ctx.stroke();}ctx.strokeStyle=`rgba(255,255,255,${.28+p*.68})`;ctx.shadowColor='#ffffff';ctx.shadowBlur=5+p*13;ctx.lineWidth=1.2+p*2.2;ctx.beginPath();ctx.moveTo(x,start);ctx.lineTo(x,vh);ctx.stroke();const r=26+p*24+pulse*4,g=ctx.createRadialGradient(x,start,0,x,start,r);g.addColorStop(0,`rgba(255,255,255,${.24+p*.46})`);g.addColorStop(.38,`rgba(239,247,255,${.08+p*.20})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x-r,start-r,r*2,r*2);ctx.restore();return;}const e=m.age-m.warn,alpha=e<=m.active?1:1-clamp01((e-m.active)/m.fade);ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;ctx.shadowColor='#ffffff';ctx.shadowBlur=30;ctx.fillStyle='rgba(244,249,255,.24)';ctx.fillRect(x-m.width*.5-12,start,m.width+24,vh-start);ctx.fillStyle='#ffffff';ctx.fillRect(x-m.width*.5,start,m.width,vh-start);ctx.shadowBlur=12;ctx.fillStyle='rgba(255,255,255,.98)';ctx.fillRect(x-m.width*.18,start,m.width*.36,vh-start);ctx.restore();}
  function drawRow(m){for(let i=0;i<m.count;i++){const fake=m.fake.has(i),crumbled=m.crumble.has(i);if(crumbled)continue;if(m.age<m.warn){const p=clamp01(m.age/m.warn),g=rowLaneGeometry(m,i,1),originX=g.dir>0?g.left+12:g.right-12;ctx.save();ctx.fillStyle=fake?`rgba(255,255,255,${.008+p*.018})`:`rgba(0,0,0,${.025+p*.055})`;ctx.strokeStyle=fake?`rgba(255,255,255,${.48+p*.45})`:`rgba(123,102,151,${.30+p*.40})`;ctx.shadowColor=fake?'rgba(255,255,255,.38)':'rgba(72,51,92,.30)';ctx.shadowBlur=fake?8:4;ctx.lineWidth=fake?1.7:1.3;ctx.setLineDash(fake?[10,8]:[5,11]);ctx.beginPath();ctx.moveTo(g.poly[0].x,g.poly[0].y);for(let j=1;j<g.poly.length;j++)ctx.lineTo(g.poly[j].x,g.poly[j].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=fake?`rgba(255,255,255,${.24+p*.40})`:`rgba(91,70,116,${.18+p*.24})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(g.dir>0?g.left:g.right,g.mid);ctx.lineTo(g.dir>0?g.right:g.left,g.mid);ctx.stroke();ctx.fillStyle=fake?'rgba(255,255,255,.82)':'rgba(4,3,7,.92)';ctx.strokeStyle=fake?'rgba(255,255,255,.95)':'rgba(133,108,159,.62)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(originX,g.mid,4.2+p*1.8,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();continue;}const elapsed=m.age-m.warn,reach=elapsed<m.active?clamp01(elapsed/.18):1,alpha=elapsed<=m.active?1:1-clamp01((elapsed-m.active)/m.fade),g=rowLaneGeometry(m,i,reach);ctx.save();ctx.globalAlpha=alpha;if(fake)ctx.globalCompositeOperation='screen';ctx.shadowColor=fake?'rgba(255,255,255,.70)':'rgba(0,0,0,.95)';ctx.shadowBlur=fake?14:9;ctx.fillStyle=fake?'rgba(248,251,255,.88)':'#000000';ctx.strokeStyle=fake?'rgba(255,255,255,.98)':'rgba(126,96,153,.58)';ctx.lineWidth=fake?1.9:1.35;ctx.beginPath();ctx.moveTo(g.poly[0].x,g.poly[0].y);for(let j=1;j<g.poly.length;j++)ctx.lineTo(g.poly[j].x,g.poly[j].y);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;if(fake){ctx.strokeStyle='rgba(205,216,232,.58)';ctx.lineWidth=1.15;ctx.setLineDash([13,15]);ctx.beginPath();ctx.moveTo(g.dir>0?g.left:g.right,g.mid);ctx.lineTo(g.dir>0?g.right:g.left,g.mid);ctx.stroke();ctx.setLineDash([]);}else{ctx.strokeStyle='rgba(57,40,75,.62)';ctx.lineWidth=2;for(const off of[-.18,0,.17]){ctx.beginPath();ctx.moveTo(g.dir>0?g.left-14:g.right+14,g.mid+(g.y1-g.y0)*off);ctx.lineTo(g.dir>0?g.poly[6].x-28:g.poly[6].x+28,g.mid+(g.y1-g.y0)*off*.55);ctx.stroke();}}ctx.restore();}}
  function drawClone(c){const p=worldToScreen(c.x,c.y),family=c.family;ctx.save();ctx.fillStyle='#000000';ctx.strokeStyle='rgba(215,218,228,.58)';ctx.lineWidth=1.4;if(family==='bolt'||family==='heavy'){ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(c.vy,c.vx));ctx.beginPath();ctx.moveTo(c.r*1.8,0);ctx.lineTo(-c.r,-c.r*.72);ctx.lineTo(-c.r*.5,0);ctx.lineTo(-c.r,c.r*.72);ctx.closePath();ctx.fill();ctx.stroke();}
    else if(family==='beam'){const end={x:p.x+Math.cos(c.a)*c.length,y:p.y+Math.sin(c.a)*c.length};if(c.age<c.warn){ctx.globalAlpha=.55;ctx.setLineDash([5,7]);ctx.strokeStyle='rgba(210,214,224,.62)';ctx.lineWidth=1.4;}else{ctx.globalAlpha=c.age<c.warn+c.active?1:1-clamp01((c.age-c.warn-c.active)/c.fade);ctx.strokeStyle='#050507';ctx.lineWidth=c.width;ctx.shadowColor='rgba(210,214,224,.32)';ctx.shadowBlur=6;}ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(end.x,end.y);ctx.stroke();}
    else if(['well','slow','collapse','mine'].includes(family)){const q=c.age<c.warn?clamp01(c.age/c.warn):1,active=c.age>=c.warn&&c.age<c.warn+c.active;ctx.globalAlpha=c.age<c.warn?.25+.45*q:1;ctx.fillStyle='rgba(0,0,0,.78)';ctx.strokeStyle=family==='slow'?'rgba(195,202,218,.58)':'rgba(220,222,232,.46)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,c.r*(c.age<c.warn?.55+.45*q:1),0,Math.PI*2);ctx.fill();ctx.stroke();if(active&&(family==='well'||family==='slow')){ctx.setLineDash([4,8]);ctx.lineDashOffset=-performance.now()*.02;ctx.beginPath();ctx.arc(p.x,p.y,c.r*.72,0,Math.PI*2);ctx.stroke();}}
    else if(family==='orbit'){if(c.age>=c.warn){for(let i=0;i<c.count;i++){const a=c.angle+i*Math.PI*2/c.count,x=p.x+Math.cos(a)*c.radius,y=p.y+Math.sin(a)*c.radius;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-9,-6);ctx.lineTo(-4,0);ctx.lineTo(-9,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}}
    else if(family==='drone'){ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-20,p.y);ctx.lineTo(p.x+20,p.y);ctx.stroke();}ctx.restore();}
  function drawCombatOverlay(){if(!runtime.active)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);drawCosmicMotion();drawPhaseFissures();drawSpikes();if(runtime.major){if(runtime.major.kind==='split')drawSplit(runtime.major);else if(runtime.major.kind==='beam')drawBeam(runtime.major);else if(runtime.major.kind==='row')drawRow(runtime.major);}for(const c of runtime.clones)drawClone(c);if(runtime.transition?.to===3){const q=clamp01(runtime.transition.age/runtime.transition.duration);ctx.fillStyle=`rgba(0,0,0,${.12*Math.sin(Math.PI*q)})`;ctx.fillRect(0,0,vw,Math.max(100,frame().visibleDepth*.78));}ctx.restore();}
  const baseDraw=draw;
  draw=function drawWithAnswerCombat(){const result=baseDraw();drawCombatOverlay();return result;};

  function forcePhase(phase){phase=Math.max(1,Math.min(3,Math.floor(Number(phase)||1)));if(!answerActive())return false;if(!runtime.active)beginCombat();runtime.transition=null;runtime.phase=phase;runtime.defeating=false;clearPatterns();resetTimers(phase);const ratio=phase===1?1:phase===2?.74:.29;if(runtime.boss){runtime.boss.dead=false;runtime.boss.hp=runtime.boss.maxHp*ratio;}window.stackfallSetAnswerPrototypePhase?.(phase,true);window.stackfallSetAnswerPrototypeHpRatio?.(ratio);return true;}
  function forcePattern(kind){if(!runtime.active||runtime.defeating)return false;if(kind==='spike'){runtime.spikes.length=0;startSpikes();return true;}if(kind==='clone'){if(runtime.phase<3)forcePhase(3);return startClone();}if(kind==='beam'&&runtime.phase<2)forcePhase(2);if(kind==='row'&&runtime.phase<2)forcePhase(2);runtime.major=null;return startMajor(kind);}
  window.stackfallAnswerCombatForcePhase=forcePhase;
  window.stackfallAnswerCombatForcePattern=forcePattern;
  window.stackfallAnswerCombatDefeat=defeatCombat;
  window.stackfallAnswerCombatDiagnostics=()=>({version:'v1',active:runtime.active,defeating:runtime.defeating,phase:runtime.phase,hpRatio:runtime.boss?clamp01(runtime.boss.hp/runtime.boss.maxHp):0,boss:runtime.boss?{hp:runtime.boss.hp,maxHp:runtime.boss.maxHp,damage:runtime.boss.damage,r:runtime.boss.r}:null,transition:runtime.transition?{...runtime.transition}:null,spikes:runtime.spikes.length,spikeDetails:runtime.spikes.map(s=>({age:s.age,warn:s.warn,thrust:s.thrust,hold:s.hold,retract:s.retract})),major:runtime.major?.kind||null,majorDetails:runtime.major?{kind:runtime.major.kind,age:runtime.major.age,warn:runtime.major.warn,active:runtime.major.active,fade:runtime.major.fade}:null,majorCd:{...runtime.majorCd},cloneCd:runtime.cloneCd,clones:runtime.clones.map(c=>({key:c.key,family:c.family,age:c.age})),lastClone:runtime.lastClone,globalApexMultipliers:{hp:APEX_HP_MULT,damage:APEX_DAMAGE_MULT},answerForm:{hp:ANSWER_HP_FORM,damage:ANSWER_DAMAGE_FORM},thresholds:{phase2:PHASE_2_HP,phase3:PHASE_3_HP}});
})();
