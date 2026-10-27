// Atropos art pass v11 — readable distant illustration, compact fracture targets,
// and an Atropos-only frozen gray entrance. Other Apex forms keep their own entrance language.
(()=>{
  const VERSION='atropos-art-v11';
  const ENTRY_DURATION=6.2;
  const arenaArt=new Image();
  arenaArt.decoding='async';
  arenaArt.src='assets/atropos-arena.webp';

  const fractureArt=new Image();
  const fractureSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 190"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efffff"/><stop offset=".22" stop-color="#a7f3eb"/><stop offset=".58" stop-color="#587f9f"/><stop offset="1" stop-color="#292f52"/></linearGradient><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="q"/><feMerge><feMergeNode in="q"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M18 111 55 42 126 17 217 45 244 92 202 142 116 174 42 148Z" fill="#07111b" stroke="#31465b" stroke-width="7"/><path d="m42 105 38-48 55-19 72 25 16 31-38 34-67 24-56-18Z" fill="url(#g)" opacity=".86" filter="url(#b)"/><path d="m65 91 48-35 43-7-35 31-26 48-38-5Z" fill="#f1ffff" opacity=".24"/><path d="m174 59 33 17 10 22-39-4-40 25 15-38Z" fill="#9599dc" opacity=".24"/></svg>`;
  fractureArt.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(fractureSvg);

  const pose={
    'west-blade':{x:.245,y:.390,rot:-.20,scale:.96,hitR:68},
    'crown-anchor':{x:.410,y:.245,rot:.14,scale:.82,hitR:60},
    'rift-core':{x:.585,y:.350,rot:-.06,scale:1.04,hitR:78},
    'keel-anchor':{x:.665,y:.565,rot:.22,scale:.86,hitR:62},
    'east-blade':{x:.805,y:.430,rot:-.28,scale:.96,hitR:68}
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
      return smooth(clamp((p-.52)/.28,0,1));
    }
    return state.entities.enemies?.some(e=>!e.dead&&e.apexForm==='chronophage')?1:0;
  }

  // Keep the colossus away from the player's collision plane. Only embedded fracture
  // targets participate in combat, and their hit radii match their compact visuals.
  const baseEnsure=ensureRebornAtropos;
  ensureRebornAtropos=function ensureAtroposArtAnchor(e){
    const ok=baseEnsure(e);if(!ok)return false;
    const r=e.atroposReborn;
    if(!r.artAnchorV11){
      r.artScreenAnchorX=Math.min(330,vw*.20);
      r.artScreenAnchorY=-Math.min(340,vh*.36);
      r.anchorX=player.x+r.artScreenAnchorX;
      r.anchorY=player.y+r.artScreenAnchorY;
      e.x=r.anchorX;e.y=r.anchorY;r.artAnchorV11=true;
      r.slashCd=Math.max(r.slashCd||0,3.8);
      refreshBossBodyParts(e);
    }
    return true;
  };

  const basePose=updateAtroposPose;
  updateAtroposPose=function updateAtroposArtPose(e){
    const result=basePose(e);if(!e?.atroposReborn||e.apexForm!=='chronophage')return result;
    const slash=e.atroposReborn.slash;
    let align=0,open=0;
    if(slash){
      const a=slash.age;
      align=a<.78?smooth(a/.78):a<1.46?1:1-smooth((a-1.46)/.74);
      if(a>=1.16&&a<1.58)open=Math.sin(Math.PI*clamp((a-1.16)/.42,0,1));
    }
    const anchorX=e.atroposReborn.artScreenAnchorX??Math.min(330,vw*.20),anchorY=e.atroposReborn.artScreenAnchorY??-Math.min(340,vh*.36);
    for(const [key,cfg] of Object.entries(pose)){
      const part=partOf(e,key);if(!part)continue;
      const side=key==='west-blade'||key==='crown-anchor'?-1:1;
      part.dx=(cfg.x-.5)*vw-anchorX+side*(12+10*(key.includes('blade')?1:0))*align+side*11*open;
      part.dy=(cfg.y-.5)*vh-anchorY+(key==='crown-anchor'?-13:key==='keel-anchor'?15:6)*align;
      part.r=cfg.hitR;
    }
    refreshBossBodyParts(e);return result;
  };

  function drawArenaIllustration(manifest){
    if(!arenaArt.complete||arenaArt.naturalWidth<2||manifest<=.001)return;
    const e=state.entities.enemies?.find(enemy=>!enemy.dead&&enemy.apexForm==='chronophage');
    const r=e?.atroposReborn;
    const initialX=r?.artScreenAnchorX??Math.min(330,vw*.20),initialY=r?.artScreenAnchorY??-Math.min(340,vh*.36);
    const ox=r?(r.anchorX-player.x-initialX):0,oy=r?(r.anchorY-player.y-initialY):0;
    const visualTime=performance.now()*.001,breathe=.915+Math.sin(visualTime*.26)*.0015;
    const dw=vw*breathe,dh=vh*breathe,x=(vw-dw)*.5+ox,y=(vh-dh)*.5+oy+vh*.012;

    // The source illustration contains its own dark space. Screen blending discards that
    // baked darkness instead of laying a dark rectangle over Stackfall's world, while the
    // brighter crystalline planes remain visible. A restrained cool backlight gives the
    // black mass an edge without inventing a floor shadow in space.
    ctx.save();
    const halo=ctx.createRadialGradient(vw*.53,vh*.46,Math.min(vw,vh)*.08,vw*.53,vh*.46,Math.max(vw,vh)*.48);
    halo.addColorStop(0,`rgba(104,124,170,${.115*manifest})`);
    halo.addColorStop(.55,`rgba(55,72,116,${.055*manifest})`);
    halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,vw,vh);
    ctx.globalCompositeOperation='screen';
    ctx.filter='brightness(1.52) contrast(1.24) saturate(1.16)';
    ctx.globalAlpha=.96*manifest;ctx.drawImage(arenaArt,x,y,dw,dh);
    ctx.filter='none';ctx.globalAlpha=.24*manifest;ctx.drawImage(arenaArt,x-2,y-1,dw+4,dh+2);
    ctx.restore();
  }

  // Only Atropos gets the quiet gray crossfade. Other Apex forms fall through unchanged.
  const baseBackground=drawBackground;
  drawBackground=function drawBackgroundWithAtroposEntry(){
    const tr=entryTransition();
    if(tr){
      const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),blend=smooth(clamp((p-.50)/.36,0,1));
      drawTheme(normalizedRealmTheme(tr.from));
      if(blend>0){ctx.save();ctx.globalAlpha=blend;drawTheme(normalizedRealmTheme(tr.to));ctx.restore();}
      drawArenaIllustration(artManifest());
      return;
    }
    const result=baseBackground();if(chronoSceneActive())drawArenaIllustration(artManifest());return result;
  };

  function drawFracture(e,key){
    const part=partOf(e,key),cfg=pose[key];if(!part||!cfg||!fractureArt.complete)return;
    const p=atroposScreenPoint(part.x,part.y),hit=typeof atroposPartHitPulse==='function'?atroposPartHitPulse(e,key):0,active=part.active!==false,manifest=artManifest();
    const half=clamp((part.r||64)*.72,42,62)*cfg.scale;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(cfg.rot+(key==='rift-core'?-.04:0));
    const wobble=1+Math.sin(performance.now()*.00042+(part.r||0))*.008;ctx.scale(wobble,wobble);
    ctx.globalAlpha=manifest*(active?.78:.25);if(hit){ctx.shadowColor='#eaffff';ctx.shadowBlur=16;ctx.globalAlpha=Math.min(1,ctx.globalAlpha+.36*hit);}
    ctx.drawImage(fractureArt,-half,-half*.73,half*2,half*1.46);ctx.restore();
  }

  drawAtroposWorldBody=function drawAtroposArtSurfaces(e){
    if(!ensureRebornAtropos(e))return;updateAtroposPose(e);
    for(const key of['west-blade','crown-anchor','rift-core','keel-anchor','east-blade'])drawFracture(e,key);
  };

  // The legacy Atropos renderer hides its owner by moving it to (1e9,1e9) for one draw.
  // Any generic off-screen boss guide then sees a real target ~sqrt(2)e9 units away and
  // renders the bogus yellow APEX arrow. Exclude the owner from the render list instead;
  // combat state and world coordinates never change, then draw only the authored surfaces.
  const baseDrawEnemiesWithLegacyAtropos=drawEnemies;
  drawEnemies=function drawEnemiesWithoutPhantomAtroposGuide(){
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

  // Preserve the canonical entrance for every non-Atropos Apex. We peek the bag once,
  // put the chosen form back unchanged when it is not Atropos, then delegate to the base flow.
  const baseBeginApexEncounter=beginApexEncounter;
  beginApexEncounter=function beginAtroposScopedEncounter(){
    if(state.apexActiveId||state.pendingApexForm)return false;
    const previousLast=state.lastBossForms?.apex;
    const form=bossBag('apex');
    if(form!=='chronophage'){
      state.bossBags=state.bossBags||{};
      state.bossBags.apex=state.bossBags.apex||[];
      state.bossBags.apex.push(form);
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

  // Cinematic mode freezes normal simulation; this extra evacuation animation is Atropos-only.
  const baseTransition=updateRealmTransition;
  updateRealmTransition=function updateRealmTransitionWithAtroposEntry(dt){
    const tr=entryTransition();if(tr)updateEntryMobs(tr);
    const result=baseTransition(dt);
    const after=entryTransition();if(after)updateEntryMobs(after);return result;
  };
  if(typeof updateAtroposEntryControl==='function')updateAtroposEntryControl=function disableLegacyAtroposEntryControl(){return false;};

  // Atropos entrance owns only its own final overlay. Other Apex forms use the canonical overlay.
  const baseCinematicOverlay=drawRealmCinematicOverlay;
  drawRealmCinematicOverlay=function drawAtroposEntryOverlay(){
    const tr=entryTransition();if(!tr)return baseCinematicOverlay();
    const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),restore=smooth(clamp((p-.82)/.15,0,1));
    ctx.save();
    ctx.globalCompositeOperation='saturation';ctx.globalAlpha=1-restore;ctx.fillStyle='#777';ctx.fillRect(0,0,vw,vh);
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
  window.stackfallAtroposArtDiagnostics=()=>({version:VERSION,arenaReady:arenaArt.complete&&arenaArt.naturalWidth>1,fractureReady:fractureArt.complete&&fractureArt.naturalWidth>1,scene:chronoSceneActive(),entry:entryTransition()?{form:state.realmTransition.form,elapsed:state.realmTransition.elapsed,duration:state.realmTransition.duration,mobs:APEX_ENTRY.mobs.length}:null,clock:window.stackfallApexClockDiagnostics?.()||null});
})();