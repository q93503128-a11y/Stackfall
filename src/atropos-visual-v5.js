// Atropos art pass v12 — transparent stylized game asset, whole-body targeting,
// and an Atropos-only frozen gray entrance. No photographic texture or visible core markers.
(()=>{
  const VERSION='atropos-art-v12';
  const ENTRY_DURATION=6.2;
  const bodyArt=new Image();
  bodyArt.decoding='async';
  bodyArt.src='assets/atropos-body.svg';

  // These are invisible combat proxies distributed across the visible body. They are
  // intentionally broad and always active: the player attacks Atropos itself, not gems/cores.
  const HIT_ZONES={
    'west-blade':{x:.18,y:.47,scale:1.05},
    'crown-anchor':{x:.39,y:.25,scale:1.00},
    'rift-core':{x:.61,y:.24,scale:1.08},
    'keel-anchor':{x:.70,y:.65,scale:1.00},
    'east-blade':{x:.83,y:.47,scale:1.04}
  };
  const APEX_ENTRY={serial:null,mobs:[],removed:false,form:null};

  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function partOf(e,key){return typeof atroposPart==='function'?atroposPart(e,key):e?.bodyParts?.find(p=>p.key===key);}
  function entryTransition(){const tr=state.realmTransition;return tr?.owner==='apex-entry'&&tr?.to==='apex-chrono'&&tr?.form==='chronophage'?tr:null;}
  function chronoSceneActive(){return state.realmTheme==='apex-chrono'||state.pendingApexForm==='chronophage'||state.realmTransition?.to==='apex-chrono'||!!state.entities.enemies?.some(e=>!e.dead&&e.apexForm==='chronophage');}
  function artManifest(){
    const tr=state.realmTransition;
    if(tr?.to==='apex-chrono'&&tr?.owner==='apex-entry'){
      const p=tr.elapsed/Math.max(.001,tr.duration);
      return smooth(clamp((p-.50)/.30,0,1));
    }
    return state.entities.enemies?.some(e=>!e.dead&&e.apexForm==='chronophage')?1:0;
  }

  const baseEnsure=ensureRebornAtropos;
  ensureRebornAtropos=function ensureAtroposWholeBodyAnchor(e){
    const ok=baseEnsure(e);if(!ok)return false;
    const r=e.atroposReborn;
    if(!r.artAnchorV12){
      r.artScreenAnchorX=0;
      r.artScreenAnchorY=-Math.min(170,vh*.18);
      r.anchorX=player.x+r.artScreenAnchorX;
      r.anchorY=player.y+r.artScreenAnchorY;
      e.x=r.anchorX;e.y=r.anchorY;r.artAnchorV12=true;
      r.slashCd=Math.max(r.slashCd||0,3.8);
    }
    return true;
  };

  // Keep the old structural animation only as attack timing data, then replace its tiny
  // weak-point geometry with broad invisible body coverage. No zone is visually rendered.
  const basePose=updateAtroposPose;
  updateAtroposPose=function updateAtroposWholeBodyPose(e){
    basePose(e);if(!e?.atroposReborn||e.apexForm!=='chronophage')return;
    const anchorX=e.atroposReborn.artScreenAnchorX||0,anchorY=e.atroposReborn.artScreenAnchorY||0;
    const baseR=Math.max(112,Math.min(vw,vh)*.175);
    for(const [key,cfg] of Object.entries(HIT_ZONES)){
      const part=partOf(e,key);if(!part)continue;
      part.dx=(cfg.x-.5)*vw-anchorX;
      part.dy=(cfg.y-.5)*vh-anchorY;
      part.r=baseR*cfg.scale;
      part.active=true;part.visible=true;part.dead=false;
    }
    refreshBossBodyParts(e);
  };

  function artPlacement(e){
    const r=e?.atroposReborn;
    const initialX=r?.artScreenAnchorX||0,initialY=r?.artScreenAnchorY||0;
    const ox=r?(r.anchorX-player.x-initialX):0,oy=r?(r.anchorY-player.y-initialY):0;
    const t=performance.now()*.001,breathe=1.015+Math.sin(t*.25)*.0022;
    const dw=vw*1.06*breathe,dh=vh*1.06*breathe;
    return{x:(vw-dw)*.5+ox,y:(vh-dh)*.5+oy, w:dw,h:dh};
  }
  function drawAtroposBodyArt(manifest){
    if(!bodyArt.complete||bodyArt.naturalWidth<2||manifest<=.001)return;
    const e=state.entities.enemies?.find(enemy=>!enemy.dead&&enemy.apexForm==='chronophage');
    const place=artPlacement(e),lastHit=Number(e?.atroposReborn?.lastHitAt),now=Number(state.time)||0;
    const hitPulse=Number.isFinite(lastHit)?clamp(1-(now-lastHit)/.14,0,1):0;
    ctx.save();
    // Transparent vector art: source-over only. No baked space background, screen blend,
    // photo texture, blur, noise or rectangular image boundary.
    ctx.globalAlpha=.96*manifest;
    ctx.drawImage(bodyArt,place.x,place.y,place.w,place.h);
    if(hitPulse>0){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.14*manifest*hitPulse;ctx.drawImage(bodyArt,place.x,place.y,place.w,place.h);}
    ctx.restore();
  }

  // Atropos is a distant colossus layer. The world background remains Stackfall's own art.
  const baseBackground=drawBackground;
  drawBackground=function drawBackgroundWithAtroposBody(){
    const tr=entryTransition();
    if(tr){
      const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),blend=smooth(clamp((p-.50)/.36,0,1));
      drawTheme(normalizedRealmTheme(tr.from));
      if(blend>0){ctx.save();ctx.globalAlpha=blend;drawTheme(normalizedRealmTheme(tr.to));ctx.restore();}
      drawAtroposBodyArt(artManifest());
      return;
    }
    const result=baseBackground();if(chronoSceneActive())drawAtroposBodyArt(artManifest());return result;
  };

  // No rendered weak points, jewels or center core. All hit proxies stay invisible.
  drawAtroposWorldBody=function drawAtroposWholeBodyTargets(e){if(ensureRebornAtropos(e))updateAtroposPose(e);};

  // Never move the owner to fake coordinates for rendering. That legacy trick created the
  // bogus off-screen Apex arrow. Exclude it from the ordinary enemy render list instead.
  const baseDrawEnemiesWithLegacyAtropos=drawEnemies;
  drawEnemies=function drawEnemiesWithoutAtroposMarker(){
    const list=state.entities.enemies||[],e=list.find(enemy=>!enemy?.dead&&enemy.apexForm==='chronophage');
    if(!e)return baseDrawEnemiesWithLegacyAtropos();
    const index=list.indexOf(e);if(index<0)return baseDrawEnemiesWithLegacyAtropos();
    list.splice(index,1);
    try{baseDrawEnemiesWithLegacyAtropos();}
    finally{list.splice(Math.min(index,list.length),0,e);}
    drawAtroposWorldBody(e);drawAtroposSpaceCut(e);
  };

  function clearEntryTransientCombat(){
    clearEnemyProjectiles?.();
    if(Array.isArray(state.entities.telegraphs))state.entities.telegraphs.length=0;
    if(Array.isArray(state.entities.projectiles))state.entities.projectiles.length=0;
    state.entities.curves?.splice(0);clearBeamEffects?.();
    if(Array.isArray(state.entities.wells))state.entities.wells.length=0;
    clearPendingCombatActions?.();
  }
  function prepareEntryMobs(form){
    APEX_ENTRY.form=form;APEX_ENTRY.serial=null;APEX_ENTRY.removed=false;APEX_ENTRY.mobs.length=0;
    const cx=player.x,cy=player.y,edge=Math.max(vw,vh)*.72+280;
    let i=0;
    for(const e of state.entities.enemies||[]){
      if(!e||e.dead||e.kind==='apex'||e.apexForm)continue;
      const dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy)||1,a=d>3?Math.atan2(dy,dx):i*2.399;
      APEX_ENTRY.mobs.push({e,x:e.x,y:e.y,ux:Math.cos(a),uy:Math.sin(a),push:Math.max(220,edge-d)+(i%4)*28});i++;
    }
    clearEntryTransientCombat();state.bossActiveId=null;ui.bossBar?.classList.add('hidden');state.camera.shake=0;state.flash=0;
  }
  function updateEntryMobs(tr){
    if(!tr||tr.owner!=='apex-entry'||tr.to!=='apex-chrono'||tr.form!=='chronophage')return;
    if(APEX_ENTRY.serial===null)APEX_ENTRY.serial=tr.serial;
    if(APEX_ENTRY.serial!==tr.serial)return;
    const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),move=smooth(clamp((p-.08)/.30,0,1));
    for(const item of APEX_ENTRY.mobs){const e=item.e;if(!e||e.dead)continue;e.x=item.x+item.ux*item.push*move;e.y=item.y+item.uy*item.push*move;e.timeLock=Math.max(Number(e.timeLock)||0,1);e.contactSafeUntil=1e12;}
    if(p>=.40&&!APEX_ENTRY.removed){
      APEX_ENTRY.removed=true;for(const item of APEX_ENTRY.mobs)if(item.e)item.e.dead=true;
      if(typeof compactInPlace==='function')compactInPlace(state.entities.enemies,e=>e&&!e.dead);else state.entities.enemies=state.entities.enemies.filter(e=>e&&!e.dead);
      APEX_ENTRY.mobs.length=0;
    }
  }
  function resetEntryMobs(){APEX_ENTRY.serial=null;APEX_ENTRY.mobs.length=0;APEX_ENTRY.removed=false;APEX_ENTRY.form=null;}

  // Preserve the canonical entrance for every non-Atropos Apex.
  const baseBeginApexEncounter=beginApexEncounter;
  beginApexEncounter=function beginAtroposScopedEncounter(){
    if(state.apexActiveId||state.pendingApexForm)return false;
    const previousLast=state.lastBossForms?.apex;
    const form=bossBag('apex');
    if(form!=='chronophage'){
      state.bossBags=state.bossBags||{};state.bossBags.apex=state.bossBags.apex||[];state.bossBags.apex.push(form);
      state.lastBossForms=state.lastBossForms||{};
      if(previousLast==null)delete state.lastBossForms.apex;else state.lastBossForms.apex=previousLast;
      return baseBeginApexEncounter();
    }
    if(state.realmTransition)cancelRealmTransition('space');
    state.pendingApexForm=form;
    if(!forceApexPriority()){state.pendingApexForm=null;return false;}
    prepareEntryMobs(form);
    const radius=compactDevice()?318:486,arena={x:player.x,y:player.y,r:radius,form,createdAt:state.time||0},title=bossName(form);
    state.apexArena=arena;
    const serial=startRealmTransition(apexTheme(form),{
      duration:ENTRY_DURATION,title,subtitle:'',apex:true,form,owner:'apex-entry',introStyle:null,
      onMidpoint:()=>{
        const liveArena=state.apexArena;if(!liveArena){state.pendingApexForm=null;cancelRealmTransition('space');return;}
        const e=spawnEnemy('apex');
        if(!e){state.pendingApexForm=null;state.nextApexAt=(typeof runProgressionTime==='function'?runProgressionTime():state.time||0)+30;cancelRealmTransition('space');return;}
        e.eliteForm=form;e.apexForm=form;e.name=title;e.color=BOSS_STATS[form].color;e.timeLock=0;e.apexElapsed=0;
        e.speed*=.82;e.x=liveArena.x+liveArena.r*.24;e.y=liveArena.y-liveArena.r*.10;
        state.apexActiveId=e.id;state.apexCount++;state.nextApexAt=(state.apexCount+1)*APEX_INTERVAL_SECONDS;
      },
      onComplete:()=>{state.pendingApexForm=null;stabilizeRealmTheme(apexTheme(form));resetEntryMobs();}
    });
    APEX_ENTRY.serial=serial;return true;
  };

  const baseTransition=updateRealmTransition;
  updateRealmTransition=function updateRealmTransitionWithAtroposEntry(dt){
    const tr=entryTransition();if(tr)updateEntryMobs(tr);
    const result=baseTransition(dt);
    const after=entryTransition();if(after)updateEntryMobs(after);return result;
  };
  if(typeof updateAtroposEntryControl==='function')updateAtroposEntryControl=function disableLegacyAtroposEntryControl(){return false;};

  // Quiet Atropos-only entrance: gray frozen world, mob evacuation, name panel, then reveal.
  const baseCinematicOverlay=drawRealmCinematicOverlay;
  drawRealmCinematicOverlay=function drawAtroposEntryOverlay(){
    const tr=entryTransition();if(!tr)return baseCinematicOverlay();
    const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),restore=smooth(clamp((p-.82)/.15,0,1));
    ctx.save();ctx.globalCompositeOperation='saturation';ctx.globalAlpha=1-restore;ctx.fillStyle='#777';ctx.fillRect(0,0,vw,vh);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=(1-restore)*.20;ctx.fillStyle='#02050a';ctx.fillRect(0,0,vw,vh);ctx.restore();
    const fadeIn=smooth(clamp((p-.08)/.13,0,1)),fadeOut=1-smooth(clamp((p-.76)/.16,0,1)),alpha=fadeIn*fadeOut;
    if(alpha<=.002)return;
    const w=Math.min(560,vw*.72),h=94,x=(vw-w)*.5,y=vh*.48-h*.5;
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='rgba(6,9,16,.80)';ctx.strokeStyle='rgba(220,230,242,.20)';ctx.lineWidth=1;
    ctx.beginPath();if(typeof ctx.roundRect==='function')ctx.roundRect(x,y,w,h,12);else ctx.rect(x,y,w,h);ctx.fill();ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(210,218,228,.66)';ctx.font='800 11px IBM Plex Sans KR, sans-serif';ctx.fillText(GAME_SETTINGS?.language==='ko'?'초월체':'APEX',vw*.5,y+25);
    ctx.fillStyle='#f2f5f8';ctx.font=`900 ${Math.min(32,Math.max(20,vw*.033))}px Black Han Sans, sans-serif`;ctx.fillText(tr.title||bossName(tr.form),vw*.5,y+59,w-28);ctx.restore();
  };

  window.stackfallAtroposVisualVersion=VERSION;
  window.stackfallAtroposArtDiagnostics=()=>({version:VERSION,bodyReady:bodyArt.complete&&bodyArt.naturalWidth>1,scene:chronoSceneActive(),entry:entryTransition()?{form:state.realmTransition.form,elapsed:state.realmTransition.elapsed,duration:state.realmTransition.duration,mobs:APEX_ENTRY.mobs.length}:null,clock:window.stackfallApexClockDiagnostics?.()||null});
})();