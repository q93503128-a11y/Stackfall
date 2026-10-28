// Atropos World Devourer — world-anchored serpent with continuous body, stable depth layers and final-art vector plates.
// The combat branch remains a prototype until visual review and player approval; these assets are the first final-art pass.
(()=>{
  const VERSION='atropos-world-devourer-colossal-pass-v2';
  const BODY_COUNT=19;
  const SAMPLE_SPACING=78;
  const HISTORY_LIMIT=900;
  const PART_KEYS=['head',...Array.from({length:BODY_COUNT},(_,i)=>`body-${String(i+1).padStart(2,'0')}`),'tail'];
  const PERF={poseBuilds:0,historySegmentsVisited:0,maxHistoryLength:0};

  const art={head:new Image(),body:[new Image(),new Image(),new Image()],tail:new Image()};
  art.head.decoding=art.tail.decoding='async';for(const img of art.body)img.decoding='async';
  art.head.src='assets/atropos-head.svg';
  art.body[0].src='assets/atropos-segment.svg';art.body[1].src='assets/atropos-segment-b.svg';art.body[2].src='assets/atropos-segment-c.svg';
  art.tail.src='assets/atropos-tail.svg';

  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const smoothRange=(a,b,x)=>smooth((x-a)/Math.max(.0001,b-a));
  const entryTransition=()=>{const tr=state.realmTransition;return tr?.owner==='apex-entry'&&tr?.to==='apex-chrono'&&tr?.form==='chronophage'?tr:null;};
  const chronoSceneActive=()=>state.realmTheme==='apex-chrono'||state.pendingApexForm==='chronophage'||state.realmTransition?.to==='apex-chrono'||!!state.entities.enemies?.some(e=>!e.dead&&e.apexForm==='chronophage');
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e.dead&&e.apexForm==='chronophage')||null;

  function artManifest(){
    const tr=entryTransition();
    if(tr){const p=tr.elapsed/Math.max(.001,tr.duration);return smooth(clamp((p-.495)/.12,0,1));}
    return serpentEnemy()?1:0;
  }

  function motionScale(){return clamp(Math.min(vw,vh)/900,.92,1.20);}
  function headWorldPosition(e,serpent,t){
    const phase=serpent.phaseBase;
    const a=t*.165+phase;
    const rx=clamp(vw*.43,650,820),ry=clamp(vh*.40,330,450);
    return{
      x:serpent.anchorX+Math.cos(a)*rx+Math.sin(a*2.07)*38,
      y:serpent.anchorY+Math.sin(a*.96)*ry+Math.sin(a*2.41+1.1)*28,
      orbitA:a
    };
  }

  function seedHistory(e,serpent){
    serpent.history.length=0;
    const now=serpent.motionTime;
    for(let i=HISTORY_LIMIT-1;i>=0;i--){
      const p=headWorldPosition(e,serpent,now-i*.018);
      serpent.history.push(p);
    }
    serpent.last=serpent.history[serpent.history.length-1];
  }

  function ensureSerpent(e){
    if(!e||e.apexForm!=='chronophage')return null;
    const r=e.atroposReborn||(e.atroposReborn={});
    let serpent=r.worldDevourer;
    if(!serpent)serpent=r.worldDevourer={history:[],points:[],last:null,initialized:false};
    if(!serpent.initialized){
      const arena=state.apexArena;
      serpent.anchorX=Number.isFinite(arena?.x)?arena.x:(Number.isFinite(e.x)?e.x:player.x);
      serpent.anchorY=Number.isFinite(arena?.y)?arena.y:(Number.isFinite(e.y)?e.y:player.y);
      serpent.phaseBase=(e.id||0)*.173+.4;
      serpent.motionTime=0;
      serpent.lastReal=performance.now()*.001;
      const definitions=PART_KEYS.map((key,i)=>({key,label:key.toUpperCase(),dx:0,dy:0,r:i===0?98:i===PART_KEYS.length-1?42:76,active:true,visible:true}));
      if(typeof defineBossBodyParts==='function')defineBossBodyParts(e,definitions);
      seedHistory(e,serpent);
      serpent.initialized=true;
      e.contactSafeUntil=1e12;
    }
    return serpent;
  }

  function advanceSerpent(e,serpent){
    const now=performance.now()*.001;
    const realDt=clamp(now-(serpent.lastReal||now),0,.05);
    serpent.lastReal=now;
    const speed=state.mode==='playing'&&typeof window.stackfallGameSpeed==='function'?clamp(window.stackfallGameSpeed(),1,4):1;
    serpent.motionTime+=realDt*speed;
    const follow=1-Math.exp(-.30*realDt);
    serpent.anchorX+=((Number(player.x)||0)-serpent.anchorX)*follow;
    serpent.anchorY+=((Number(player.y)||0)-serpent.anchorY)*follow;
    const p=headWorldPosition(e,serpent,serpent.motionTime),last=serpent.last;
    if(!last||Math.hypot(p.x-last.x,p.y-last.y)>=3.2){
      serpent.history.push(p);serpent.last=p;
      if(serpent.history.length>HISTORY_LIMIT)serpent.history.splice(0,serpent.history.length-HISTORY_LIMIT);
    }
  }

  function sampleHistoryDistances(history,distances){
    const out=new Array(distances.length);
    if(!history.length){for(let i=0;i<out.length;i++)out[i]={x:player.x,y:player.y,a:0,orbitA:0};return out;}
    let newer=history[history.length-1],walked=0,target=0;
    for(let i=history.length-2;i>=0&&target<distances.length;i--){
      const older=history[i],dx=newer.x-older.x,dy=newer.y-older.y,len=Math.hypot(dx,dy);PERF.historySegmentsVisited++;
      if(len>0){
        const end=walked+len;
        while(target<distances.length&&distances[target]<=end){
          const q=clamp((Math.max(0,distances[target])-walked)/len,0,1);
          out[target++]={x:newer.x-dx*q,y:newer.y-dy*q,a:Math.atan2(dy,dx),orbitA:lerp(newer.orbitA,older.orbitA,q)};
        }
        walked=end;
      }
      newer=older;
    }
    const fallbackA=history.length>1?Math.atan2(history[1].y-history[0].y,history[1].x-history[0].x):0,fallback=history[0];
    while(target<out.length)out[target++]={x:fallback.x,y:fallback.y,a:fallbackA,orbitA:fallback.orbitA||0};
    return out;
  }

  function buildSerpentPose(e){
    const serpent=ensureSerpent(e);if(!serpent)return null;
    advanceSerpent(e,serpent);
    PERF.poseBuilds++;PERF.maxHistoryLength=Math.max(PERF.maxHistoryLength,serpent.history.length);
    const scaleUnit=motionScale(),points=[],distances=[];
    for(let i=0;i<PART_KEYS.length;i++){const tailT=i/(PART_KEYS.length-1);distances.push(i*SAMPLE_SPACING*scaleUnit*(1+tailT*.05));}
    const samples=sampleHistoryDistances(serpent.history,distances);
    for(let i=0;i<PART_KEYS.length;i++){
      const tailT=i/(PART_KEYS.length-1),p=samples[i],screen=worldToScreen(p.x,p.y),depth=Math.sin((p.orbitA||0)+.35);
      const taper=i===0?1.14:i===PART_KEYS.length-1?.48:(tailT<.24?lerp(1.20,1.08,tailT/.24):lerp(1.08,.62,(tailT-.24)/.76));
      points.push({...p,sx:screen.x,sy:screen.y,key:PART_KEYS[i],index:i,tailT,depth,taper,scaleUnit});
    }
    serpent.points=points;
    e.x=serpent.anchorX;e.y=serpent.anchorY;
    for(let i=0;i<points.length;i++){
      const part=e.bodyParts?.[i];if(!part)continue;
      const p=points[i];part.dx=p.x-e.x;part.dy=p.y-e.y;
      part.r=(i===0?94:i===points.length-1?40:72)*p.taper*p.scaleUnit;
      part.active=true;part.visible=true;part.dead=false;
    }
    if(typeof refreshBossBodyParts==='function')refreshBossBodyParts(e);
    return serpent;
  }

  function layerWeights(depth){
    const front=smoothRange(.16,.70,depth),back=smoothRange(.16,.70,-depth),mid=clamp(1-front-back,0,1);
    return{front,mid,back};
  }
  function drawSpine(points,manifest,layer){
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(let i=points.length-1;i>0;i--){
      const p=points[i],q=points[i-1],weight=(layerWeights(p.depth)[layer]+layerWeights(q.depth)[layer])*.5;
      if(weight<=.01)continue;
      const tailT=i/(points.length-1),width=292*lerp(1,.44,tailT)*p.scaleUnit;
      ctx.globalAlpha=manifest*weight*.78;ctx.strokeStyle='#34415f';ctx.lineWidth=width+12;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
      ctx.globalAlpha=manifest*weight*.98;ctx.strokeStyle='#050915';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
      ctx.globalAlpha=manifest*weight*.28;ctx.strokeStyle='#111a34';ctx.lineWidth=width*.70;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
    }
    for(let i=3;i<points.length-2;i+=4){
      const p=points[i],weight=layerWeights(p.depth)[layer];if(weight<=.03)continue;
      const tailT=i/(points.length-1),half=92*lerp(1,.50,tailT)*p.scaleUnit,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a);
      ctx.globalAlpha=manifest*weight*.30;ctx.strokeStyle='#9fd8ea';ctx.lineWidth=Math.max(2,3.6*p.scaleUnit);ctx.beginPath();ctx.moveTo(p.sx+nx*half,p.sy+ny*half);ctx.lineTo(p.sx+tx*10,p.sy+ty*10);ctx.lineTo(p.sx-nx*half*.72+tx*18,p.sy-ny*half*.72+ty*18);ctx.stroke();
    }
    ctx.restore();
  }
  function drawSprite(img,p,w,h,alpha=1,glow=0,flip=false,scaleX=1,scaleY=1){
    if(!img.complete||img.naturalWidth<2||alpha<=.005)return;
    const depthScale=lerp(.88,1.12,(p.depth+1)*.5);
    ctx.save();ctx.translate(p.sx,p.sy);ctx.rotate(p.a);ctx.scale(scaleX,scaleY);if(flip)ctx.scale(1,-1);
    if(glow>0){ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha*glow;ctx.drawImage(img,-w*depthScale*.5,-h*depthScale*.5,w*depthScale,h*depthScale);ctx.globalCompositeOperation='source-over';}
    ctx.globalAlpha=alpha;ctx.drawImage(img,-w*depthScale*.5,-h*depthScale*.5,w*depthScale,h*depthScale);ctx.restore();
  }
  function drawSerpentLayer(manifest,layer){
    if(manifest<=.001)return;
    const e=serpentEnemy();if(!e)return;
    const serpent=ensureSerpent(e);if(!serpent?.points?.length)return;
    const pts=serpent.points;drawSpine(pts,manifest,layer);
    for(let i=pts.length-1;i>=0;i--){
      const p=pts[i],weight=layerWeights(p.depth)[layer];if(weight<=.01)continue;
      const foregroundFade=layer==='front'?.88:1,alpha=manifest*weight*foregroundFade;
      if(i===0){const jaw=window.stackfallAtroposMawJawScale,scaleX=Number(jaw?.x)||1,scaleY=Number(jaw?.y)||1;drawSprite(art.head,p,420*p.scaleUnit,235*p.scaleUnit,.98*alpha,.07,false,scaleX,scaleY);continue;}
      if(i===pts.length-1){drawSprite(art.tail,p,340*p.taper*p.scaleUnit,132*p.taper*p.scaleUnit,.92*alpha,.03);continue;}
      if(i>=8&&i%4===0)continue;
      const bodyArt=art.body[(i*7+Math.floor(i/3))%art.body.length],neckBoost=i<=5?lerp(1.16,1.02,(i-1)/4):1,bodyGlow=layer==='front'?.035:.018;
      drawSprite(bodyArt,p,320*p.taper*neckBoost*p.scaleUnit,150*p.taper*neckBoost*p.scaleUnit,.72*alpha,bodyGlow,i%5===3);
    }
  }

  const baseEnsure=ensureRebornAtropos;
  ensureRebornAtropos=function ensureWorldDevourer(e){
    if(!e||e.apexForm!=='chronophage')return baseEnsure(e);
    if(!e.atroposReborn){const ok=baseEnsure(e);if(!ok)return false;}
    ensureSerpent(e);return true;
  };
  const basePose=updateAtroposPose;
  updateAtroposPose=function updateWorldDevourerPose(e){if(e?.apexForm==='chronophage'&&e?.atroposReborn?.worldDevourer)return e.atroposReborn.worldDevourer;return basePose(e);};

  const baseBackground=drawBackground;
  drawBackground=function drawBackgroundWithWorldDevourer(){
    const tr=entryTransition();
    if(tr){
      const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),blend=smooth(clamp((p-.50)/.36,0,1));
      drawTheme(normalizedRealmTheme(tr.from));if(blend>0){ctx.save();ctx.globalAlpha=blend;drawTheme(normalizedRealmTheme(tr.to));ctx.restore();}
      const e=serpentEnemy();if(e)buildSerpentPose(e);drawSerpentLayer(artManifest(),'back');return;
    }
    const result=baseBackground();if(chronoSceneActive()){const e=serpentEnemy();if(e)buildSerpentPose(e);drawSerpentLayer(artManifest(),'back');}return result;
  };

  drawAtroposWorldBody=function drawWorldDevourerTargets(e){return ensureRebornAtropos(e);};
  const baseDrawEnemies=drawEnemies;
  drawEnemies=function drawEnemiesWithoutWorldDevourerOwner(){
    const list=state.entities.enemies||[],e=list.find(enemy=>!enemy?.dead&&enemy.apexForm==='chronophage');
    if(!e)return baseDrawEnemies();const index=list.indexOf(e);if(index<0)return baseDrawEnemies();
    list.splice(index,1);try{baseDrawEnemies();}finally{list.splice(Math.min(index,list.length),0,e);}
    drawAtroposWorldBody(e);drawSerpentLayer(artManifest(),'mid');
  };
  const baseDrawPlayer=drawPlayer;
  drawPlayer=function drawPlayerWithWorldDevourerForeground(){baseDrawPlayer();if(chronoSceneActive())drawSerpentLayer(artManifest(),'front');};

  const baseCinematicOverlay=drawRealmCinematicOverlay;
  drawRealmCinematicOverlay=function drawWorldDevourerEntryOverlay(){
    const tr=entryTransition();if(!tr)return baseCinematicOverlay();
    const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),restore=smooth(clamp((p-.82)/.15,0,1));
    ctx.save();ctx.globalCompositeOperation='saturation';ctx.globalAlpha=1-restore;ctx.fillStyle='#777';ctx.fillRect(0,0,vw,vh);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=(1-restore)*.20;ctx.fillStyle='#02050a';ctx.fillRect(0,0,vw,vh);ctx.restore();
    const fadeIn=smooth(clamp((p-.08)/.13,0,1)),fadeOut=1-smooth(clamp((p-.76)/.16,0,1)),alpha=fadeIn*fadeOut;if(alpha<=.002)return;
    const w=Math.min(560,vw*.72),h=94,x=(vw-w)*.5,y=vh*.48-h*.5;
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='rgba(6,9,16,.80)';ctx.strokeStyle='rgba(220,230,242,.20)';ctx.lineWidth=1;ctx.beginPath();if(typeof ctx.roundRect==='function')ctx.roundRect(x,y,w,h,12);else ctx.rect(x,y,w,h);ctx.fill();ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(210,218,228,.66)';ctx.font='800 11px IBM Plex Sans KR, sans-serif';ctx.fillText(GAME_SETTINGS?.language==='ko'?'초월체':'APEX',vw*.5,y+25);ctx.fillStyle='#f2f5f8';ctx.font=`900 ${Math.min(32,Math.max(20,vw*.033))}px Black Han Sans, sans-serif`;ctx.fillText(tr.title||bossName(tr.form),vw*.5,y+59,w-28);ctx.restore();
  };

  window.stackfallAtroposVisualVersion=VERSION;
  window.stackfallAtroposArtDiagnostics=()=>{const e=serpentEnemy(),serpent=e?.atroposReborn?.worldDevourer;return{version:VERSION,assets:{head:art.head.complete&&art.head.naturalWidth>1,body:art.body.every(img=>img.complete&&img.naturalWidth>1),bodyVariants:art.body.map(img=>img.complete&&img.naturalWidth>1),tail:art.tail.complete&&art.tail.naturalWidth>1},scene:chronoSceneActive(),anchor:serpent?{x:Math.round(serpent.anchorX),y:Math.round(serpent.anchorY)}:null,segments:serpent?.points?.map(p=>({key:p.key,x:Math.round(p.x),y:Math.round(p.y),sx:Math.round(p.sx),sy:Math.round(p.sy),angle:+p.a.toFixed(2),depth:+p.depth.toFixed(2)}))||[],entry:entryTransition()?{form:state.realmTransition.form,elapsed:state.realmTransition.elapsed,duration:state.realmTransition.duration}:null,performance:{poseBuilds:PERF.poseBuilds,historySegmentsVisited:PERF.historySegmentsVisited,maxHistoryLength:PERF.maxHistoryLength,historyLimit:HISTORY_LIMIT},clock:window.stackfallApexClockDiagnostics?.()||null};};
})();