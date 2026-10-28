// Branch-only entrance director for World Devourer Atropos.
// Entrance only: freeze/desaturate combat, clear transient attacks, wrap once around the player,
// visibly pull existing enemies into the passing maw, then restore colour and grant a short breath.
(()=>{
  const ENTRY_DURATION=7.0;
  const WRAP_START=.50,WRAP_END=.84,COLOR_RETURN=.82;
  const ENTRY={serial:null,active:false,centerX:0,centerY:0,startAngle:-2.55,mobs:[],bossId:null,consumed:0};
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
  const trNow=()=>{const tr=state.realmTransition;return tr?.owner==='apex-entry'&&tr?.to==='apex-chrono'&&tr?.form==='chronophage'?tr:null;};
  const progress=()=>{const tr=trNow();return tr?clamp(tr.elapsed/Math.max(.001,tr.duration),0,1):1;};
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e?.dead&&e.apexForm==='chronophage')||null;
  const serpentOf=e=>e?.atroposReborn?.worldDevourer||null;
  const mod=(a,n)=>((a%n)+n)%n;

  function orbitOffsetAt(a){
    const rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);
    return{x:Math.cos(a)*rx+Math.sin(a*2.07)*38,y:Math.sin(a*.96)*ry+Math.sin(a*2.41+1.1)*28};
  }
  function loopPoint(a){
    const rx=clamp(vw*.34,470,650)*(1+.065*Math.sin(a*1.7+.6)),ry=clamp(vh*.30,255,345)*(1+.055*Math.cos(a*2.1-.2));
    return{x:ENTRY.centerX+Math.cos(a)*rx+Math.sin(a*2.35)*42,y:ENTRY.centerY+Math.sin(a)*ry+Math.sin(a*1.28+.5)*25};
  }
  function entryHeadPose(p){
    const q=clamp((p-WRAP_START)/(WRAP_END-WRAP_START),0,1),start=ENTRY.startAngle;
    if(q<.13){
      const k=ease(q/.13),edge=Math.max(vw,vh)*.72+360,from={x:ENTRY.centerX+Math.cos(start)*edge,y:ENTRY.centerY+Math.sin(start)*edge*.72},to=loopPoint(start);
      return{x:lerp(from.x,to.x,k),y:lerp(from.y,to.y,k),a:start};
    }
    if(q<.86){
      const t=(q-.13)/.73,a=start+t*TAU,p=loopPoint(a);return{x:p.x,y:p.y,a};
    }
    const t=smooth((q-.86)/.14),a0=start+TAU,a1=a0+.62,p0=loopPoint(a0),off=orbitOffsetAt(a1),p2={x:ENTRY.centerX+off.x,y:ENTRY.centerY+off.y};
    const tx=-Math.sin(a0),ty=Math.cos(a0),control={x:p0.x+tx*460,y:p0.y+ty*330},u=1-t;
    return{x:u*u*p0.x+2*u*t*control.x+t*t*p2.x,y:u*u*p0.y+2*u*t*control.y+t*t*p2.y,a:lerp(a0,a1,t)};
  }
  function seedEntryHistoryOffscreen(s){
    if(!s)return;const pose=entryHeadPose(WRAP_START),to=loopPoint(ENTRY.startAngle),dx=to.x-pose.x,dy=to.y-pose.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,step=4,count=430,history=[];
    for(let i=count;i>=0;i--)history.push({x:pose.x-ux*i*step,y:pose.y-uy*i*step,orbitA:pose.a});
    s.history=history;s.last=history[history.length-1];s.points=[];s.motionTime=(pose.a-(Number(s.phaseBase)||0))/.165;const off=orbitOffsetAt(pose.a);s.anchorX=pose.x-off.x;s.anchorY=pose.y-off.y;s.lastReal=performance.now()*.001;
  }
  function driveEntryHead(e,s,p){
    if(!e||!s||p<WRAP_START)return null;const pose=entryHeadPose(p),phase=Number(s.phaseBase)||0;s.motionTime=(pose.a-phase)/.165;const off=orbitOffsetAt(pose.a);s.anchorX=pose.x-off.x;s.anchorY=pose.y-off.y;s.lastReal=performance.now()*.001;
    const last=s.last;if(!last||Math.hypot(pose.x-last.x,pose.y-last.y)>=3){const point={x:pose.x,y:pose.y,orbitA:pose.a};s.history=s.history||[];s.history.push(point);if(s.history.length>1500)s.history.splice(0,s.history.length-1500);s.last=point;}
    return pose;
  }
  function clearTransientCombat(){
    clearEnemyProjectiles?.();clearPendingCombatActions?.();
    // Clear already-fired attacks only. Placed/persistent player weapons survive the cinematic
    // and are frozen because their update functions are paused below.
    const clearKeys=['telegraphs','projectiles','guidedMissiles','curves','shockwaves'];
    for(const key of clearKeys){const list=state.entities?.[key];if(Array.isArray(list))list.length=0;}
    // Existing beams/lasers fade almost instantly instead of freezing as solid lines.
    const beams=state.entities?.beams;if(Array.isArray(beams))for(const beam of beams)if(beam)beam.life=Math.min(Number(beam.life)||.12,.12);
    state.camera.shake=0;state.flash=0;
  }
  function captureMobs(){
    ENTRY.mobs.length=0;ENTRY.consumed=0;
    const rx=clamp(vw*.34,470,650),ry=clamp(vh*.30,255,345);
    for(const e of state.entities.enemies||[]){
      if(!e||e.dead||e.kind==='apex'||e.apexForm)continue;
      const dx=e.x-ENTRY.centerX,dy=e.y-ENTRY.centerY,ang=Math.atan2(dy/Math.max(1,ry),dx/Math.max(1,rx)),phase=mod(ang-ENTRY.startAngle,TAU)/TAU,eatAt=.545+phase*.235;
      ENTRY.mobs.push({e,x:e.x,y:e.y,r:Math.max(4,Number(e.r)||12),eatAt,controlSign:((e.id||0)&1)?1:-1,pull:0,consumed:false,
        original:{speed:e.speed,damage:e.damage,timeLock:e.timeLock,contactSafeUntil:e.contactSafeUntil,rangedCd:e.rangedCd,skillCd:e.skillCd,burstCd:e.burstCd,pulseCd:e.pulseCd}});
      e.speed=0;e.damage=0;e.timeLock=999;e.contactSafeUntil=1e12;e.rangedCd=e.skillCd=e.burstCd=e.pulseCd=1e9;
    }
    ENTRY.mobs.sort((a,b)=>a.eatAt-b.eatAt);
  }
  function restoreUnconsumedMobs(){
    for(const item of ENTRY.mobs){
      const e=item.e,o=item.original;if(!e||item.consumed||e.dead||!o)continue;
      e.x=item.x;e.y=item.y;e.r=item.r;e.speed=o.speed;e.damage=o.damage;e.timeLock=o.timeLock;e.contactSafeUntil=o.contactSafeUntil;e.rangedCd=o.rangedCd;e.skillCd=o.skillCd;e.burstCd=o.burstCd;e.pulseCd=o.pulseCd;
    }
  }
  function updateMobs(p,head){
    let removed=false;
    for(const item of ENTRY.mobs){
      const e=item.e;if(item.consumed||!e||e.dead)continue;
      const begin=item.eatAt-.045,end=item.eatAt+.024;
      if(!head||p<=begin){e.x=item.x;e.y=item.y;e.r=item.r;continue;}
      const q=smooth(clamp((p-begin)/Math.max(.001,end-begin),0,1));item.pull=q;
      const dx=head.x-item.x,dy=head.y-item.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,control={x:lerp(item.x,head.x,.38)+nx*item.controlSign*86,y:lerp(item.y,head.y,.38)+ny*item.controlSign*86},u=1-q;
      e.x=u*u*item.x+2*u*q*control.x+q*q*head.x;e.y=u*u*item.y+2*u*q*control.y+q*q*head.y;e.r=item.r*lerp(1,.16,q);e.timeLock=999;e.contactSafeUntil=1e12;
      if(q>=.995||p>=.815){item.consumed=true;e.dead=true;ENTRY.consumed++;removed=true;spawnParticle?.(head.x,head.y,'#d9f6ff',2,65,2.2);}
    }
    if(removed){if(typeof compactInPlace==='function')compactInPlace(state.entities.enemies,e=>e&&!e.dead);else state.entities.enemies=state.entities.enemies.filter(e=>e&&!e.dead);}
  }
  function consumeRemainder(){
    let removed=false;for(const item of ENTRY.mobs){const e=item.e;if(item.consumed||!e||e.dead)continue;item.consumed=true;e.dead=true;ENTRY.consumed++;removed=true;}
    if(removed){if(typeof compactInPlace==='function')compactInPlace(state.entities.enemies,e=>e&&!e.dead);else state.entities.enemies=state.entities.enemies.filter(e=>e&&!e.dead);}
  }
  function drawSuctionTrails(){
    const tr=trNow();if(!tr||!ENTRY.active)return;const p=progress();if(p<WRAP_START)return;const head=entryHeadPose(p);
    ctx.save();ctx.lineCap='round';ctx.globalCompositeOperation='screen';
    for(const item of ENTRY.mobs){if(item.consumed||item.pull<=.01||!item.e||item.e.dead)continue;const A=worldToScreen(item.e.x,item.e.y),B=worldToScreen(head.x,head.y),q=item.pull;ctx.globalAlpha=.10+.28*q;ctx.strokeStyle='rgba(224,238,244,.85)';ctx.lineWidth=1.5+2*q;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.quadraticCurveTo(lerp(A.x,B.x,.55)+item.controlSign*18,lerp(A.y,B.y,.55)-item.controlSign*14,B.x,B.y);ctx.stroke();}
    ctx.restore();
  }
  function resetEntry(restore=false){if(restore)restoreUnconsumedMobs();ENTRY.serial=null;ENTRY.active=false;ENTRY.mobs.length=0;ENTRY.bossId=null;ENTRY.consumed=0;}

  const baseBegin=beginApexEncounter;
  beginApexEncounter=function beginWorldDevourerSwallowEntrance(){
    if(state.apexActiveId||state.pendingApexForm)return false;
    const previousLast=state.lastBossForms?.apex,form=bossBag('apex');
    if(form!=='chronophage'){
      state.bossBags=state.bossBags||{};state.bossBags.apex=state.bossBags.apex||[];state.bossBags.apex.push(form);state.lastBossForms=state.lastBossForms||{};if(previousLast==null)delete state.lastBossForms.apex;else state.lastBossForms.apex=previousLast;return baseBegin();
    }
    if(state.realmTransition)cancelRealmTransition('space');state.pendingApexForm=form;if(!forceApexPriority()){state.pendingApexForm=null;return false;}
    ENTRY.active=true;ENTRY.centerX=player.x;ENTRY.centerY=player.y;ENTRY.startAngle=-2.55+(((state.apexCount||0)&1)?.10:-.10);ENTRY.bossId=null;clearTransientCombat();captureMobs();state.bossActiveId=null;ui.bossBar?.classList.add('hidden');ui.bossNotice?.classList.add('hidden');
    if(typeof audio?.tone==='function')audio.tone(58,.72,'sawtooth',.018,-14);
    const radius=compactDevice()?318:486,arena={x:ENTRY.centerX,y:ENTRY.centerY,r:radius,form,createdAt:state.time||0},title=bossName(form);state.apexArena=arena;
    const serial=startRealmTransition(apexTheme(form),{duration:ENTRY_DURATION,title,subtitle:'',apex:true,form,owner:'apex-entry',introStyle:null,
      onMidpoint:()=>{
        const liveArena=state.apexArena;if(!liveArena){state.pendingApexForm=null;resetEntry(true);cancelRealmTransition('space');return;}
        const savedBossAudio=audio?.boss;let e=null;try{if(audio&&typeof savedBossAudio==='function')audio.boss=()=>{};e=spawnEnemy('apex');}finally{if(audio&&typeof savedBossAudio==='function')audio.boss=savedBossAudio;}
        if(!e){state.pendingApexForm=null;state.nextApexAt=(typeof runProgressionTime==='function'?runProgressionTime():state.time||0)+30;resetEntry(true);cancelRealmTransition('space');return;}
        e.eliteForm=form;e.apexForm=form;e.name=title;e.color=BOSS_STATS[form].color;e.timeLock=0;e.apexElapsed=0;e.speed*=.82;e.x=liveArena.x;e.y=liveArena.y;ensureRebornAtropos?.(e);const s=serpentOf(e);if(s){s.entryActive=true;s.entryGrace=.55;s.prototypeAttackCd=1.25;s.nextPrototypeAttack='crossing';seedEntryHistoryOffscreen(s);}
        ENTRY.bossId=e.id;state.apexActiveId=e.id;state.apexCount++;state.nextApexAt=(state.apexCount+1)*APEX_INTERVAL_SECONDS;ui.bossNotice?.classList.add('hidden');ui.bossBar?.classList.add('hidden');
      },
      onComplete:()=>{consumeRemainder();const e=serpentEnemy(),s=serpentOf(e);if(s){s.entryActive=false;s.entryGrace=.55;s.anchorX=ENTRY.centerX;s.anchorY=ENTRY.centerY;s.lastReal=performance.now()*.001;}state.pendingApexForm=null;stabilizeRealmTheme(apexTheme(form));ui.bossBar?.classList.remove('hidden');resetEntry(false);}
    });
    ENTRY.serial=serial;return true;
  };

  const baseTransition=updateRealmTransition;
  updateRealmTransition=function updateWorldDevourerSwallowEntrance(dt){
    const before=trNow();if(before&&ENTRY.active){const p=clamp(before.elapsed/Math.max(.001,before.duration),0,1),e=serpentEnemy(),s=serpentOf(e),head=driveEntryHead(e,s,p);updateMobs(p,head);ui.bossBar?.classList.add('hidden');}
    const result=baseTransition(dt);
    const after=trNow();if(after&&ENTRY.active){const p=clamp(after.elapsed/Math.max(.001,after.duration),0,1),e=serpentEnemy(),s=serpentOf(e),head=driveEntryHead(e,s,p);updateMobs(p,head);ui.bossBar?.classList.add('hidden');}
    return result;
  };

  // The entrance is a true time-stop tableau. Keep the player fixed at the captured center.
  if(typeof updatePlayer==='function'){const basePlayer=updatePlayer;updatePlayer=function freezePlayerForWorldDevourerEntry(dt){if(trNow()){player.stagePreviousX=player.x;player.stagePreviousY=player.y;player.x=ENTRY.centerX;player.y=ENTRY.centerY;player.moveVX=0;player.moveVY=0;player.moveIntensity=0;return;}return basePlayer(dt);};}
  if(typeof updateWeapons==='function'){const baseUpdateWeapons=updateWeapons;updateWeapons=function pauseWeaponsForWorldDevourerEntry(dt){if(trNow())return;return baseUpdateWeapons(dt);};}
  if(typeof updatePostRosterWeapons==='function'){const basePost=updatePostRosterWeapons;updatePostRosterWeapons=function pausePostRosterForWorldDevourerEntry(dt){if(trNow())return;return basePost(dt);};}
  // Prevent the normal spawner from repopulating the frozen scene. The midpoint Apex spawn is allowed.
  if(typeof spawnEnemy==='function'){const baseSpawn=spawnEnemy;spawnEnemy=function suppressSpawnsDuringWorldDevourerEntry(kind='normal'){if(trNow()&&kind!=='apex')return null;return baseSpawn(kind);};}
  if(typeof dealDamage==='function'){const baseDeal=dealDamage;dealDamage=function protectWorldDevourerDuringEntry(target,amount,opts){const owner=typeof bossPartOwner==='function'?bossPartOwner(target):target;if(trNow()&&owner?.apexForm==='chronophage'&&serpentOf(owner))return;return baseDeal(target,amount,opts);};}
  if(typeof apexBossSkill==='function'){const baseApexSkill=apexBossSkill;apexBossSkill=function gateWorldDevourerEntranceCombat(e,dt){const s=serpentOf(e);if(s&&(trNow()||s.entryActive))return;if(s&&(Number(s.entryGrace)||0)>0){s.entryGrace=Math.max(0,s.entryGrace-dt);return;}return baseApexSkill(e,dt);};}
  if(typeof drawRealmCinematicOverlay==='function'){const baseOverlay=drawRealmCinematicOverlay;drawRealmCinematicOverlay=function drawWorldDevourerSwallowOverlay(){drawSuctionTrails();return baseOverlay();};}

  window.stackfallAtroposEntryDiagnostics=()=>({active:ENTRY.active,serial:ENTRY.serial,progress:+progress().toFixed(3),mobs:ENTRY.mobs.length,consumed:ENTRY.consumed,bossId:ENTRY.bossId,weaponPause:!!trNow(),playerFrozen:!!trNow(),colourReturnAt:COLOR_RETURN});
  window.stackfallAtroposEntryVersion='world-devourer-swallow-entry-v3';
})();
