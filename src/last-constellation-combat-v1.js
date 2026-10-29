// Last Constellation combat v1.
// P1 only: four outer nodes attack independently. P2-P4 intentionally have no authored patterns yet.
(()=>{
  if(window.stackfallLastConstellationCombat==='v1')return;
  window.stackfallLastConstellationCombat='v1';
  const FORM='lastconstellation',TAU=Math.PI*2;
  const isLC=e=>!!(e&&!e.dead&&(e.apexForm||e.eliteForm)===FORM);
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const now=()=>performance.now();
  const activeParts=e=>(e?.bodyParts||[]).filter(p=>p?.lcNodeProxy&&p.active&&p.visible&&!p.dead);
  const partByKey=(e,key)=>(e?.bodyParts||[]).find(p=>p?.lcNodeProxy&&p.lcNodeKey===key)||null;
  const nodeAlive=(e,key)=>{const n=e?.lcStructure?.nodes?.[key];return!!(n&&!n.destroyed&&n.group===e.lcStructure.phase);};
  const lineDistance=(px,py,x1,y1,x2,y2)=>{
    if(typeof segmentDistance==='function')return segmentDistance(px,py,x1,y1,x2,y2);
    const dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/len));
    return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));
  };
  const hurt=(e,amount)=>{if(player.invuln>0)return; if(typeof hurtPlayer==='function')hurtPlayer(Math.max(1,amount),e);};

  // Last Constellation nodes can be far outside the boss-center spatial-index cell. Replace only
  // Last Constellation entries with their currently active hit proxies in performance queries.
  function nearestActivePart(e,x,y,maxRange=Infinity,excluded=null){
    let best=null,bestD=Number.isFinite(maxRange)?maxRange*maxRange:Infinity;
    for(const p of activeParts(e)){
      if(excluded?.has(p.id)||excluded?.has(e.id))continue;
      const d=(p.x-x)**2+(p.y-y)**2;if(d<=bestD){bestD=d;best=p;}
    }
    return best;
  }
  const lcEnemies=()=>state.entities.enemies.filter(isLC);
  if(typeof window.performanceNearbyEnemies==='function'){
    const base=window.performanceNearbyEnemies;
    window.performanceNearbyEnemies=function lcAwareNearby(x,y,range=96,out=[]){
      const list=base(x,y,range,out);
      for(let i=list.length-1;i>=0;i--)if(isLC(list[i]))list.splice(i,1);
      for(const e of lcEnemies()){
        const p=nearestActivePart(e,x,y,range+180);if(!p)continue;
        if(Math.hypot(p.x-x,p.y-y)<=range+p.r&&!list.includes(p))list.push(p);
      }
      return list;
    };
  }
  if(typeof window.performanceForEachNearbyEnemy==='function'){
    const base=window.performanceForEachNearbyEnemy;
    window.performanceForEachNearbyEnemy=function lcAwareForEach(x,y,range,visit){
      const seen=new Set();
      base(x,y,range,e=>{if(isLC(e)||seen.has(e.id))return;seen.add(e.id);visit(e);});
      for(const e of lcEnemies()){
        const p=nearestActivePart(e,x,y,range+180);if(!p)continue;
        if(Math.hypot(p.x-x,p.y-y)<=range+p.r&&!seen.has(p.id)){seen.add(p.id);visit(p);}
      }
    };
  }
  if(typeof window.performanceNearestEnemy==='function'){
    const base=window.performanceNearestEnemy;
    window.performanceNearestEnemy=function lcAwareNearest(x,y,maxRange=Infinity,predicate=null){
      const ordinary=base(x,y,maxRange,e=>!isLC(e)&&(!predicate||predicate(e)));
      let best=ordinary,bestD=ordinary?(ordinary.x-x)**2+(ordinary.y-y)**2:(Number.isFinite(maxRange)?maxRange*maxRange:Infinity);
      for(const e of lcEnemies()){
        if(predicate&&!predicate(e))continue;
        const p=nearestActivePart(e,x,y,Math.sqrt(bestD));if(!p)continue;
        const d=(p.x-x)**2+(p.y-y)**2;if(d<=bestD){best=p;bestD=d;}
      }
      return best;
    };
  }
  if(typeof window.performanceNearestEnemyExcluding==='function'){
    const base=window.performanceNearestEnemyExcluding;
    window.performanceNearestEnemyExcluding=function lcAwareNearestExcluding(x,y,maxRange=Infinity,excluded=null){
      const ex=new Set(excluded||[]);for(const e of lcEnemies())ex.add(e.id);
      const ordinary=base(x,y,maxRange,ex);
      let best=ordinary,bestD=ordinary?(ordinary.x-x)**2+(ordinary.y-y)**2:(Number.isFinite(maxRange)?maxRange*maxRange:Infinity);
      for(const e of lcEnemies()){
        if(excluded?.has(e.id))continue;
        const p=nearestActivePart(e,x,y,Math.sqrt(bestD),excluded);if(!p)continue;
        const d=(p.x-x)**2+(p.y-y)**2;if(d<=bestD){best=p;bestD=d;}
      }
      return best;
    };
  }
  if(typeof window.performanceNearestEnemies==='function'){
    const base=window.performanceNearestEnemies;
    window.performanceNearestEnemies=function lcAwareNearestMany(x,y,count,excluded=null,maxRange=Infinity,out=null){
      const ex=new Set(excluded||[]);for(const e of lcEnemies())ex.add(e.id);
      const ordinary=base(x,y,count,ex,maxRange,null).slice();
      for(const e of lcEnemies()){
        if(excluded?.has(e.id))continue;
        const p=nearestActivePart(e,x,y,maxRange,excluded);if(p)ordinary.push(p);
      }
      ordinary.sort((a,b)=>((a.x-x)**2+(a.y-y)**2)-((b.x-x)**2+(b.y-y)**2));
      ordinary.length=Math.min(Math.max(0,count|0),ordinary.length);
      if(Array.isArray(out)){out.length=0;out.push(...ordinary);return out;}return ordinary;
    };
  }

  function ensureCombat(e){
    if(e.lcCombat?.version===1)return e.lcCombat;
    e.lcCombat={version:1,phase:1,nextAttack:1.05,serial:0,attacks:[],shards:[]};
    return e.lcCombat;
  }
  function attackOrigin(e,key){const p=partByKey(e,key);return p?{x:p.x,y:p.y,r:p.r}:{x:e.x,y:e.y,r:e.r};}
  function playerAimLead(seconds=.18){return{x:player.x+(player.moveVX||0)*seconds,y:player.y+(player.moveVY||0)*seconds};}
  function addLance(e,key,damage){
    const o=attackOrigin(e,key),t=playerAimLead(.12),a=Math.atan2(t.y-o.y,t.x-o.x),len=2400;
    e.lcCombat.attacks.push({type:'lance',key,age:0,warn:.82,active:.16,fade:.24,x1:o.x,y1:o.y,x2:o.x+Math.cos(a)*len,y2:o.y+Math.sin(a)*len,damage,hit:false});
  }
  function addFork(e,key,damage){
    const o=attackOrigin(e,key),t=playerAimLead(.18),base=Math.atan2(t.y-o.y,t.x-o.x),len=2300;
    const rays=[-.16,0,.16].map(offset=>({x1:o.x,y1:o.y,x2:o.x+Math.cos(base+offset)*len,y2:o.y+Math.sin(base+offset)*len,hit:false}));
    e.lcCombat.attacks.push({type:'fork',key,age:0,warn:.78,active:.18,fade:.24,rays,damage:damage*.72});
  }
  function addShardSalvo(e,key,damage){
    const o=attackOrigin(e,key),t=playerAimLead(.22),base=Math.atan2(t.y-o.y,t.x-o.x);
    e.lcCombat.attacks.push({type:'salvo',key,age:0,warn:.58,active:.05,fade:.18,origin:o,base,damage,fired:false});
  }
  function addSeal(e,key,damage){
    const c=playerAimLead(.10),r=128,rot=((e.lcCombat.serial*1.17)%TAU);
    const pts=[];for(let i=0;i<3;i++){const a=rot+i*TAU/3;pts.push({x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r});}
    e.lcCombat.attacks.push({type:'seal',key,age:0,warn:.96,active:.22,fade:.30,pts,damage,hit:false});
  }
  function scheduleAttack(e){
    const c=ensureCombat(e);if(e.lcStructure?.phase!==1)return;
    const order=['outer-1','outer-2','outer-3','outer-4'];
    let key=null;
    for(let attempt=0;attempt<order.length;attempt++){const candidate=order[c.serial++%order.length];if(nodeAlive(e,candidate)){key=candidate;break;}}
    if(!key)return;
    const damage=Math.max(7,(Number(e.damage)||20)*.32);
    if(key==='outer-1')addLance(e,key,damage);
    else if(key==='outer-2')addFork(e,key,damage);
    else if(key==='outer-3')addShardSalvo(e,key,damage*.70);
    else addSeal(e,key,damage*.82);
    const o=attackOrigin(e,key);if(typeof shockwave==='function')shockwave(o.x,o.y,'#dce8ff',70,.24,2);
    if(typeof audio?.tone==='function')audio.tone(150+(c.serial%4)*34,.10,'sine',.007,18);
  }
  function updateAttack(e,a,dt){
    a.age+=dt;
    const fireAt=a.warn,activeEnd=fireAt+a.active,total=activeEnd+a.fade;
    if(a.type==='salvo'&&!a.fired&&a.age>=fireAt){
      a.fired=true;const speed=390;
      for(let i=-2;i<=2;i++){const ang=a.base+i*.095;e.lcCombat.shards.push({x:a.origin.x,y:a.origin.y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,r:8,life:3.2,damage:a.damage,rot:ang});}
      state.camera.shake=Math.max(state.camera.shake,3.5);
    }
    if(a.age>=fireAt&&a.age<=activeEnd){
      if(a.type==='lance'&&!a.hit&&lineDistance(player.x,player.y,a.x1,a.y1,a.x2,a.y2)<=18+player.r){a.hit=true;hurt(e,a.damage);}
      else if(a.type==='fork')for(const ray of a.rays)if(!ray.hit&&lineDistance(player.x,player.y,ray.x1,ray.y1,ray.x2,ray.y2)<=14+player.r){ray.hit=true;hurt(e,a.damage);break;}
      else if(a.type==='seal'&&!a.hit){for(let i=0;i<3;i++){const p=a.pts[i],q=a.pts[(i+1)%3];if(lineDistance(player.x,player.y,p.x,p.y,q.x,q.y)<=16+player.r){a.hit=true;hurt(e,a.damage);break;}}}
    }
    return a.age<total;
  }
  function updateShards(e,dt){
    const c=e.lcCombat;
    for(const s of c.shards){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;s.rot+=dt*2.2;if(s.life>0&&Math.hypot(player.x-s.x,player.y-s.y)<=player.r+s.r){hurt(e,s.damage);s.life=0;}}
    c.shards=c.shards.filter(s=>s.life>0);
  }
  function updateCombat(e,dt){
    const c=ensureCombat(e),phase=e.lcStructure?.phase||1;
    if(c.phase!==phase){c.phase=phase;c.nextAttack=phase===1?.85:999;c.attacks.length=0;c.shards.length=0;}
    if(phase!==1)return;
    c.nextAttack-=dt;if(c.nextAttack<=0){scheduleAttack(e);c.nextAttack=1.38;}
    c.attacks=c.attacks.filter(a=>updateAttack(e,a,dt));updateShards(e,dt);
  }
  const baseUpdateEnemies=typeof updateEnemies==='function'?updateEnemies:null;
  if(baseUpdateEnemies)updateEnemies=function updateEnemiesWithLastConstellationCombat(dt){
    const result=baseUpdateEnemies(dt);for(const e of state.entities.enemies||[])if(isLC(e))updateCombat(e,dt);return result;
  };

  function attackAlpha(a){const fireAt=a.warn,activeEnd=fireAt+a.active;if(a.age<fireAt)return lerp(.22,.82,clamp01(a.age/fireAt));if(a.age<=activeEnd)return 1;return 1-clamp01((a.age-activeEnd)/a.fade);}
  function local(e,x,y){return{x:x-e.x,y:y-e.y};}
  function strokeWorldLine(e,x1,y1,x2,y2,width,color,alpha){const a=local(e,x1,y1),b=local(e,x2,y2);ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.shadowColor=color;ctx.shadowBlur=width*2.2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();}
  function drawAttacks(e){
    const c=e.lcCombat;if(!c)return;
    for(const a of c.attacks){
      const alpha=attackAlpha(a),firing=a.age>=a.warn&&a.age<=a.warn+a.active;
      if(a.type==='lance')strokeWorldLine(e,a.x1,a.y1,a.x2,a.y2,firing?12:2.2,firing?'#ffffff':'#9fb9ff',alpha*(firing?.98:.62));
      else if(a.type==='fork')for(const ray of a.rays)strokeWorldLine(e,ray.x1,ray.y1,ray.x2,ray.y2,firing?8:1.8,firing?'#eef4ff':'#8ea7ee',alpha*(firing?.92:.56));
      else if(a.type==='salvo'){
        const o=local(e,a.origin.x,a.origin.y);ctx.save();ctx.translate(o.x,o.y);ctx.globalAlpha=alpha*.85;ctx.strokeStyle='#d9e5ff';ctx.lineWidth=2;ctx.shadowColor='#b5c8ff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,24+a.age*22,0,TAU);ctx.stroke();ctx.restore();
      }else if(a.type==='seal'){
        ctx.save();ctx.globalAlpha=alpha*(firing?.95:.55);ctx.strokeStyle=firing?'#ffffff':'#9eb4f6';ctx.lineWidth=firing?8:2;ctx.shadowColor='#b9c9ff';ctx.shadowBlur=firing?18:8;ctx.beginPath();for(let i=0;i<3;i++){const p=local(e,a.pts[i].x,a.pts[i].y);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}const first=local(e,a.pts[0].x,a.pts[0].y);ctx.lineTo(first.x,first.y);ctx.stroke();ctx.restore();
      }
    }
    for(const s of c.shards){const p=local(e,s.x,s.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(s.rot);ctx.globalAlpha=clamp01(s.life/.25);ctx.shadowColor='#dce7ff';ctx.shadowBlur=12;ctx.fillStyle='#f5f8ff';ctx.strokeStyle='#9fb6ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-s.r*1.45);ctx.lineTo(s.r*.62,0);ctx.lineTo(0,s.r*1.45);ctx.lineTo(-s.r*.62,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  }
  const baseDrawEliteShape=typeof drawEliteShape==='function'?drawEliteShape:null;
  if(baseDrawEliteShape)drawEliteShape=function lastConstellationCombatShape(e){
    const result=baseDrawEliteShape(e);if(isLC(e))drawAttacks(e);return result;
  };

  window.stackfallLastConstellationCombatDiagnostics=()=>{
    const e=state.entities.enemies.find(isLC)||null,c=e?.lcCombat||null;
    return{version:'v1',active:!!e,phase:e?.lcStructure?.phase||null,p1Patterns:e?.lcStructure?.phase===1,activeAttacks:c?.attacks?.map(a=>a.type)||[],shards:c?.shards?.length||0,hitRouting:'active-node-proxies-v1'};
  };
})();