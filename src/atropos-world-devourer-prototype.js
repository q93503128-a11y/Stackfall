// Atropos world-devourer prototype v1 — segmented serpent renderer + distance-follow chain.
// Branch-only prototype. Keeps shared HP targeting and the accepted Apex clock/space-cut foundation.
(()=>{
  const VERSION='atropos-world-devourer-prototype-v1';
  const ENTRY_DURATION=6.2;
  const BODY_COUNT=12;
  const SAMPLE_SPACING=86;
  const HISTORY_LIMIT=900;
  const PART_KEYS=['head',...Array.from({length:BODY_COUNT},(_,i)=>`body-${String(i+1).padStart(2,'0')}`),'tail'];

  const art={head:new Image(),body:new Image(),tail:new Image()};
  art.head.decoding=art.body.decoding=art.tail.decoding='async';
  art.head.src='assets/atropos-head.svg';
  art.body.src='assets/atropos-segment.svg';
  art.tail.src='assets/atropos-tail.svg';

  const APEX_ENTRY={serial:null,mobs:[],removed:false,form:null};

  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const screenToWorld=(sx,sy)=>({x:player.x+(sx-vw*.5),y:player.y+(sy-vh*.5)});
  const entryTransition=()=>{const tr=state.realmTransition;return tr?.owner==='apex-entry'&&tr?.to==='apex-chrono'&&tr?.form==='chronophage'?tr:null;};
  const chronoSceneActive=()=>state.realmTheme==='apex-chrono'||state.pendingApexForm==='chronophage'||state.realmTransition?.to==='apex-chrono'||!!state.entities.enemies?.some(e=>!e.dead&&e.apexForm==='chronophage');
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e.dead&&e.apexForm==='chronophage')||null;

  function artManifest(){
    const tr=state.realmTransition;
    if(tr?.to==='apex-chrono'&&tr?.owner==='apex-entry'){
      const p=tr.elapsed/Math.max(.001,tr.duration);
      return smooth(clamp((p-.47)/.34,0,1));
    }
    return serpentEnemy()?1:0;
  }

  function idleHeadPosition(e,t){
    const phase=(e?.id||0)*.173;
    const a=t*.19+phase;
    const rx=Math.max(520,vw*.54),ry=Math.max(270,vh*.38);
    return{
      x:vw*.5+Math.cos(a)*rx+Math.sin(a*2.17)*vw*.035,
      y:vh*.47+Math.sin(a*.94)*ry+Math.sin(a*2.73+1.2)*vh*.045
    };
  }

  function seedHistory(e,serpent,t){
    serpent.history.length=0;
    for(let i=HISTORY_LIMIT-1;i>=0;i--){
      const p=idleHeadPosition(e,t-i*.018);
      serpent.history.push({x:p.x,y:p.y});
    }
    serpent.last=serpent.history[serpent.history.length-1];
  }

  function ensureSerpent(e){
    if(!e||e.apexForm!=='chronophage')return null;
    const r=e.atroposReborn||(e.atroposReborn={});
    let serpent=r.worldDevourer;
    if(!serpent)serpent=r.worldDevourer={history:[],points:[],last:null,phase:0,initialized:false};
    if(!serpent.initialized){
      const definitions=PART_KEYS.map((key,i)=>({key,label:key.toUpperCase(),dx:0,dy:0,r:i===0?88:i===PART_KEYS.length-1?44:64,active:true,visible:true}));
      if(typeof defineBossBodyParts==='function')defineBossBodyParts(e,definitions);
      seedHistory(e,serpent,Number(state.time)||0);
      serpent.initialized=true;
      e.contactSafeUntil=1e12;
    }
    return serpent;
  }

  function appendHistory(e,serpent,t){
    const p=idleHeadPosition(e,t),last=serpent.last;
    if(!last||Math.hypot(p.x-last.x,p.y-last.y)>=4){
      serpent.history.push(p);serpent.last=p;
      if(serpent.history.length>HISTORY_LIMIT)serpent.history.splice(0,serpent.history.length-HISTORY_LIMIT);
    }
    serpent.phase=t*.19+(e?.id||0)*.173;
  }

  function sampleHistory(history,distance){
    if(!history.length)return{x:vw*.5,y:vh*.5,a:0};
    let remaining=Math.max(0,distance),newer=history[history.length-1];
    for(let i=history.length-2;i>=0;i--){
      const older=history[i],dx=newer.x-older.x,dy=newer.y-older.y,len=Math.hypot(dx,dy);
      if(len>0&&remaining<=len){const q=remaining/len;return{x:newer.x-dx*q,y:newer.y-dy*q,a:Math.atan2(dy,dx)};}
      remaining-=len;newer=older;
    }
    const a=history.length>1?Math.atan2(history[1].y-history[0].y,history[1].x-history[0].x):0;
    return{x:history[0].x,y:history[0].y,a};
  }

  function buildSerpentPose(e){
    const serpent=ensureSerpent(e);if(!serpent)return null;
    const t=Number(state.time)||performance.now()*.001;
    appendHistory(e,serpent,t);
    const scaleUnit=clamp(Math.min(vw,vh)/900,.78,1.32),points=[];
    for(let i=0;i<PART_KEYS.length;i++){
      const tailT=i/(PART_KEYS.length-1),dist=i*SAMPLE_SPACING*scaleUnit*(1+tailT*.08),p=sampleHistory(serpent.history,dist);
      const depth=Math.sin(serpent.phase-i*.46),taper=i===0?1.22:i===PART_KEYS.length-1?.54:lerp(1.02,.68,tailT);
      points.push({...p,key:PART_KEYS[i],index:i,tailT,depth,taper,scaleUnit});
    }
    serpent.points=points;
    e.x=player.x;e.y=player.y;
    for(let i=0;i<points.length;i++){
      const part=e.bodyParts?.[i];if(!part)continue;
      const p=points[i],world=screenToWorld(p.x,p.y);
      part.dx=world.x-e.x;part.dy=world.y-e.y;part.r=(i===0?76:i===points.length-1?38:56)*p.taper*p.scaleUnit;
      part.active=true;part.visible=true;part.dead=false;
    }
    if(typeof refreshBossBodyParts==='function')refreshBossBodyParts(e);
    return serpent;
  }

  function drawSprite(img,p,w,h,alpha=1,glow=0){
    if(!img.complete||img.naturalWidth<2)return;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=alpha;
    if(glow>0){ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha*glow;ctx.drawImage(img,-w*.5,-h*.5,w,h);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=alpha;}
    ctx.drawImage(img,-w*.5,-h*.5,w,h);ctx.restore();
  }

  function drawSerpent(manifest){
    if(manifest<=.001)return;
    const e=serpentEnemy();if(!e)return;
    const serpent=buildSerpentPose(e);if(!serpent?.points?.length)return;
    const pts=serpent.points,order=[...pts].sort((a,b)=>a.depth-b.depth);
    for(const p of order){
      const depthScale=lerp(.88,1.08,(p.depth+1)*.5),alpha=manifest*lerp(.66,.98,(p.depth+1)*.5);
      if(p.index===0){drawSprite(art.head,p,350*p.scaleUnit*depthScale,188*p.scaleUnit*depthScale,alpha,.10);continue;}
      if(p.index===pts.length-1){drawSprite(art.tail,p,278*p.scaleUnit*depthScale,122*p.scaleUnit*depthScale,alpha,.07);continue;}
      const variant=1+Math.sin(p.index*2.31)*.035;
      drawSprite(art.body,p,224*p.taper*p.scaleUnit*depthScale*variant,138*p.taper*p.scaleUnit*depthScale,alpha,.065);
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
      drawSerpent(artManifest());return;
    }
    const result=baseBackground();if(chronoSceneActive())drawSerpent(artManifest());return result;
  };

  drawAtroposWorldBody=function drawWorldDevourerTargets(e){if(ensureRebornAtropos(e))updateAtroposPose(e);};

  const baseDrawEnemies=drawEnemies;
  drawEnemies=function drawEnemiesWithoutWorldDevourerOwner(){
    const list=state.entities.enemies||[],e=list.find(enemy=>!enemy?.dead&&enemy.apexForm==='chronophage');
    if(!e)return baseDrawEnemies();const index=list.indexOf(e);if(index<0)return baseDrawEnemies();
    list.splice(index,1);try{baseDrawEnemies();}finally{list.splice(Math.min(index,list.length),0,e);}
    drawAtroposWorldBody(e);drawAtroposSpaceCut(e);
  };

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
  window.stackfallAtroposArtDiagnostics=()=>{const e=serpentEnemy(),serpent=e?.atroposReborn?.worldDevourer;return{version:VERSION,assets:{head:art.head.complete&&art.head.naturalWidth>1,body:art.body.complete&&art.body.naturalWidth>1,tail:art.tail.complete&&art.tail.naturalWidth>1},scene:chronoSceneActive(),segments:serpent?.points?.map(p=>({key:p.key,x:Math.round(p.x),y:Math.round(p.y),angle:+p.a.toFixed(2),depth:+p.depth.toFixed(2)}))||[],entry:entryTransition()?{form:state.realmTransition.form,elapsed:state.realmTransition.elapsed,duration:state.realmTransition.duration,mobs:APEX_ENTRY.mobs.length}:null,clock:window.stackfallApexClockDiagnostics?.()||null};};
})();