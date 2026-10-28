// Atropos world-devourer prototype v3 — world-anchored serpent, continuous body and stable depth layers.
// Branch-only visual/movement prototype. Attack rework and final swallow entrance are intentionally deferred.
(()=>{
  const VERSION='atropos-world-devourer-prototype-v3';
  const ENTRY_DURATION=6.2;
  const BODY_COUNT=15;
  const SAMPLE_SPACING=64;
  const HISTORY_LIMIT=1500;
  const PART_KEYS=['head',...Array.from({length:BODY_COUNT},(_,i)=>`body-${String(i+1).padStart(2,'0')}`),'tail'];

  const art={head:new Image(),body:new Image(),tail:new Image()};
  art.head.decoding=art.body.decoding=art.tail.decoding='async';
  art.head.src='assets/atropos-head.svg';
  art.body.src='assets/atropos-segment.svg';
  art.tail.src='assets/atropos-tail.svg';

  const APEX_ENTRY={serial:null,mobs:[],removed:false,form:null};
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

  function motionScale(){return clamp(Math.min(vw,vh)/900,.88,1.16);}
  function headWorldPosition(e,serpent,t){
    const phase=serpent.phaseBase;
    const a=t*.165+phase;
    const rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);
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
      const definitions=PART_KEYS.map((key,i)=>({key,label:key.toUpperCase(),dx:0,dy:0,r:i===0?92:i===PART_KEYS.length-1?36:58,active:true,visible:true}));
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

  function sampleHistory(history,distance){
    if(!history.length)return{x:player.x,y:player.y,a:0,orbitA:0};
    let remaining=Math.max(0,distance),newer=history[history.length-1];
    for(let i=history.length-2;i>=0;i--){
      const older=history[i],dx=newer.x-older.x,dy=newer.y-older.y,len=Math.hypot(dx,dy);
      if(len>0&&remaining<=len){
        const q=remaining/len;
        return{x:newer.x-dx*q,y:newer.y-dy*q,a:Math.atan2(dy,dx),orbitA:lerp(newer.orbitA,older.orbitA,q)};
      }
      remaining-=len;newer=older;
    }
    const a=history.length>1?Math.atan2(history[1].y-history[0].y,history[1].x-history[0].x):0;
    return{x:history[0].x,y:history[0].y,a,orbitA:history[0].orbitA||0};
  }

  function buildSerpentPose(e){
    const serpent=ensureSerpent(e);if(!serpent)return null;
    advanceSerpent(e,serpent);
    const scaleUnit=motionScale(),points=[];
    for(let i=0;i<PART_KEYS.length;i++){
      const tailT=i/(PART_KEYS.length-1),dist=i*SAMPLE_SPACING*scaleUnit*(1+tailT*.05),p=sampleHistory(serpent.history,dist);
      const screen=worldToScreen(p.x,p.y),depth=Math.sin((p.orbitA||0)+.35);
      const taper=i===0?1.22:i===PART_KEYS.length-1?.38:lerp(1.08,.62,tailT);
      points.push({...p,sx:screen.x,sy:screen.y,key:PART_KEYS[i],index:i,tailT,depth,taper,scaleUnit});
    }
    serpent.points=points;
    e.x=serpent.anchorX;e.y=serpent.anchorY;
    for(let i=0;i<points.length;i++){
      const part=e.bodyParts?.[i];if(!part)continue;
      const p=points[i];part.dx=p.x-e.x;part.dy=p.y-e.y;
      part.r=(i===0?82:i===points.length-1?34:55)*p.taper*p.scaleUnit;
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
      const tailT=i/(points.length-1),width=196*lerp(1,.42,tailT)*p.scaleUnit;
      ctx.globalAlpha=manifest*weight*.95;ctx.strokeStyle='#050915';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
      ctx.globalAlpha=manifest*weight*.20;ctx.strokeStyle='#40527f';ctx.lineWidth=Math.max(3,width*.065);ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
    }
    ctx.restore();
  }
  function drawSprite(img,p,w,h,alpha=1,glow=0,flip=false){
    if(!img.complete||img.naturalWidth<2||alpha<=.005)return;
    const depthScale=lerp(.90,1.10,(p.depth+1)*.5);
    ctx.save();ctx.translate(p.sx,p.sy);ctx.rotate(p.a);if(flip)ctx.scale(1,-1);
    if(glow>0){ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha*glow;ctx.drawImage(img,-w*depthScale*.5,-h*depthScale*.5,w*depthScale,h*depthScale);ctx.globalCompositeOperation='source-over';}
    ctx.globalAlpha=alpha;ctx.drawImage(img,-w*depthScale*.5,-h*depthScale*.5,w*depthScale,h*depthScale);ctx.restore();
  }
  function drawSerpentLayer(manifest,layer){
    if(manifest<=.001)return;
    const e=serpentEnemy();if(!e)return;
    const serpent=buildSerpentPose(e);if(!serpent?.points?.length)return;
    const pts=serpent.points;drawSpine(pts,manifest,layer);
    for(let i=pts.length-1;i>=0;i--){
      const p=pts[i],weight=layerWeights(p.depth)[layer];if(weight<=.01)continue;
      const alpha=manifest*weight;
      if(i===0){drawSprite(art.head,p,445*p.scaleUnit,223*p.scaleUnit,.98*alpha,.08);continue;}
      if(i===pts.length-1){drawSprite(art.tail,p,245*p.taper*p.scaleUnit,82*p.taper*p.scaleUnit,.94*alpha,.035);continue;}
      if(i>=4&&i%2===0)continue;
      drawSprite(art.body,p,245*p.taper*p.scaleUnit,90*p.taper*p.scaleUnit,.80*alpha,.035,i%4===3);
    }
  }

  const baseEnsure=ensureRebornAtropos;
  ensureRebornAtropos=function ensureWorldDevourer(e){const ok=baseEnsure(e);if(!ok)return false;ensureSerpent(e);return true;};
  const basePose=updateAtroposPose;
  updateAtroposPose=function updateWorldDevourerPose(e){basePose(e);if(!e?.atroposReborn||e.apexForm!=='chronophage')return;buildSerpentPose(e);};

  const baseBackground=drawBackground;
  drawBackground=function drawBackgroundWithWorldDevourer(){
    const tr=entryTransition();
    if(tr){
      const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),blend=smooth(clamp((p-.50)/.36,0,1));
      drawTheme(normalizedRealmTheme(tr.from));if(blend>0){ctx.save();ctx.globalAlpha=blend;drawTheme(normalizedRealmTheme(tr.to));ctx.restore();}
      drawSerpentLayer(artManifest(),'back');return;
    }
    const result=baseBackground();if(chronoSceneActive())drawSerpentLayer(artManifest(),'back');return result;
  };

  drawAtroposWorldBody=function drawWorldDevourerTargets(e){if(ensureRebornAtropos(e))updateAtroposPose(e);};
  const baseDrawEnemies=drawEnemies;
  drawEnemies=function drawEnemiesWithoutWorldDevourerOwner(){
    const list=state.entities.enemies||[],e=list.find(enemy=>!enemy?.dead&&enemy.apexForm==='chronophage');
    if(!e)return baseDrawEnemies();const index=list.indexOf(e);if(index<0)return baseDrawEnemies();
    list.splice(index,1);try{baseDrawEnemies();}finally{list.splice(Math.min(index,list.length),0,e);}
    drawAtroposWorldBody(e);drawSerpentLayer(artManifest(),'mid');drawAtroposSpaceCut(e);
  };
  const baseDrawPlayer=drawPlayer;
  drawPlayer=function drawPlayerWithWorldDevourerForeground(){baseDrawPlayer();if(chronoSceneActive())drawSerpentLayer(artManifest(),'front');};

  function clearEntryTransientCombat(){
    clearEnemyProjectiles?.();
    for(const key of ['telegraphs','projectiles','guidedMissiles','curves','wells']){const list=state.entities?.[key];if(Array.isArray(list))list.length=0;}
    clearBeamEffects?.();clearPendingCombatActions?.();
  }
  function prepareEntryMobs(form){
    APEX_ENTRY.form=form;APEX_ENTRY.serial=null;APEX_ENTRY.removed=false;APEX_ENTRY.mobs.length=0;
    const cx=player.x,cy=player.y,edge=Math.max(vw,vh)*.72+280;let i=0;
    for(const e of state.entities.enemies||[]){
      if(!e||e.dead||e.kind==='apex'||e.apexForm)continue;
      const dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy)||1,a=d>3?Math.atan2(dy,dx):i*2.399;
      APEX_ENTRY.mobs.push({e,x:e.x,y:e.y,ux:Math.cos(a),uy:Math.sin(a),push:Math.max(220,edge-d)+(i%4)*28});i++;
    }
    clearEntryTransientCombat();state.bossActiveId=null;ui.bossBar?.classList.add('hidden');state.camera.shake=0;state.flash=0;
  }
  function updateEntryMobs(tr){
    if(!tr||tr.owner!=='apex-entry'||tr.to!=='apex-chrono'||tr.form!=='chronophage')return;
    if(APEX_ENTRY.serial===null)APEX_ENTRY.serial=tr.serial;if(APEX_ENTRY.serial!==tr.serial)return;
    const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),move=smooth(clamp((p-.08)/.30,0,1));
    for(const item of APEX_ENTRY.mobs){const e=item.e;if(!e||e.dead)continue;e.x=item.x+item.ux*item.push*move;e.y=item.y+item.uy*item.push*move;e.timeLock=Math.max(Number(e.timeLock)||0,1);e.contactSafeUntil=1e12;}
    if(p>=.40&&!APEX_ENTRY.removed){
      APEX_ENTRY.removed=true;for(const item of APEX_ENTRY.mobs)if(item.e)item.e.dead=true;
      if(typeof compactInPlace==='function')compactInPlace(state.entities.enemies,e=>e&&!e.dead);else state.entities.enemies=state.entities.enemies.filter(e=>e&&!e.dead);
      APEX_ENTRY.mobs.length=0;
    }
  }
  const resetEntryMobs=()=>{APEX_ENTRY.serial=null;APEX_ENTRY.mobs.length=0;APEX_ENTRY.removed=false;APEX_ENTRY.form=null;};

  const baseBeginApexEncounter=beginApexEncounter;
  beginApexEncounter=function beginWorldDevourerEncounter(){
    if(state.apexActiveId||state.pendingApexForm)return false;
    const previousLast=state.lastBossForms?.apex,form=bossBag('apex');
    if(form!=='chronophage'){
      state.bossBags=state.bossBags||{};state.bossBags.apex=state.bossBags.apex||[];state.bossBags.apex.push(form);
      state.lastBossForms=state.lastBossForms||{};if(previousLast==null)delete state.lastBossForms.apex;else state.lastBossForms.apex=previousLast;
      return baseBeginApexEncounter();
    }
    if(state.realmTransition)cancelRealmTransition('space');state.pendingApexForm=form;
    if(!forceApexPriority()){state.pendingApexForm=null;return false;}
    prepareEntryMobs(form);
    const radius=compactDevice()?318:486,arena={x:player.x,y:player.y,r:radius,form,createdAt:state.time||0},title=bossName(form);state.apexArena=arena;
    const serial=startRealmTransition(apexTheme(form),{
      duration:ENTRY_DURATION,title,subtitle:'',apex:true,form,owner:'apex-entry',introStyle:null,
      onMidpoint:()=>{
        const liveArena=state.apexArena;if(!liveArena){state.pendingApexForm=null;cancelRealmTransition('space');return;}
        const e=spawnEnemy('apex');
        if(!e){state.pendingApexForm=null;state.nextApexAt=(typeof runProgressionTime==='function'?runProgressionTime():state.time||0)+30;cancelRealmTransition('space');return;}
        e.eliteForm=form;e.apexForm=form;e.name=title;e.color=BOSS_STATS[form].color;e.timeLock=0;e.apexElapsed=0;e.speed*=.82;e.x=liveArena.x;e.y=liveArena.y;ensureSerpent(e);
        state.apexActiveId=e.id;state.apexCount++;state.nextApexAt=(state.apexCount+1)*APEX_INTERVAL_SECONDS;
      },
      onComplete:()=>{state.pendingApexForm=null;stabilizeRealmTheme(apexTheme(form));resetEntryMobs();}
    });
    APEX_ENTRY.serial=serial;return true;
  };
  const baseTransition=updateRealmTransition;
  updateRealmTransition=function updateRealmTransitionWithWorldDevourer(dt){const tr=entryTransition();if(tr)updateEntryMobs(tr);const result=baseTransition(dt);const after=entryTransition();if(after)updateEntryMobs(after);return result;};
  if(typeof updateAtroposEntryControl==='function')updateAtroposEntryControl=function disableLegacyAtroposEntryControl(){return false;};

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
  window.stackfallAtroposArtDiagnostics=()=>{const e=serpentEnemy(),serpent=e?.atroposReborn?.worldDevourer;return{version:VERSION,assets:{head:art.head.complete&&art.head.naturalWidth>1,body:art.body.complete&&art.body.naturalWidth>1,tail:art.tail.complete&&art.tail.naturalWidth>1},scene:chronoSceneActive(),anchor:serpent?{x:Math.round(serpent.anchorX),y:Math.round(serpent.anchorY)}:null,segments:serpent?.points?.map(p=>({key:p.key,x:Math.round(p.x),y:Math.round(p.y),sx:Math.round(p.sx),sy:Math.round(p.sy),angle:+p.a.toFixed(2),depth:+p.depth.toFixed(2)}))||[],entry:entryTransition()?{form:state.realmTransition.form,elapsed:state.realmTransition.elapsed,duration:state.realmTransition.duration,mobs:APEX_ENTRY.mobs.length}:null,clock:window.stackfallApexClockDiagnostics?.()||null};};
})();