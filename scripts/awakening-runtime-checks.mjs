// Runs inside the real page after index.html has loaded every wrapper in order.
export function awakeningRuntimeChecks(){
  const failures=[],rows=[],sources=new Set();
  const check=(ok,message)=>{if(!ok)failures.push(message);};
  const dev=window.stackfallDeveloperTest;
  if(!dev)return{failures:['DEV API missing'],rows};
  GAME_SETTINGS.audio.master=false;GAME_SETTINGS.manualAim=false;GAME_SETTINGS.language='ko';
  window.__stackfallLoopGeneration++; // Deterministic simulation, no concurrent RAF updates.
  const keys=Object.keys(window.stackfallAwakeningDefs);
  const gallery=document.createElement('canvas');gallery.width=1020;gallery.height=keys.length*260;
  const galleryCtx=gallery.getContext('2d');galleryCtx.fillStyle='#050914';galleryCtx.fillRect(0,0,gallery.width,gallery.height);
  window.stackfallAuditGallery=gallery;
  const arrays=['awakeningFx','awakeningFxSecond','awakeningFxThird','awIonNodes','awLotusFields','awStarrailNodes'];
  const playerAwState=()=>Object.fromEntries(Object.entries(player).filter(([key])=>/^aw[A-Z]/.test(key)));
  dev.equipOnly('blade',1,false);dev.assignSlot(1,'comet');dev.setSlotLevel(1,4);
  check(state.weaponSlots[0]==='blade'&&state.weaponSlots[1]==='comet'&&weaponCount('blade')===1&&weaponCount('comet')===4,'DEV per-slot weapon/stack edit failed');
  dev.setSlotAwakening(1,true);
  check(weaponCount('comet')===6&&state.awakenedWeapons?.comet===true&&state.awakenedWeapons?.blade!==true,'DEV per-slot awakening edit failed');
  dev.setCoreLevel(6);dev.setCoreAwakening(true);
  check(weaponCount('core')===6&&state.awakenedWeapons?.core===true,'DEV core stack/awakening edit failed');
  const rawDust=Number(window.stackfallMeta?.currencies?.stardust)||0;dev.setInfiniteCurrency(true);
  check(window.stackfallCurrency?.('stardust')>=999999999&&window.stackfallSpendCurrency?.({stardust:999999,coreShard:999999})===true&&Number(window.stackfallMeta?.currencies?.stardust||0)===rawDust,'DEV infinite currency override failed');
  dev.setInfiniteCurrency(false);check(dev.snapshot().infiniteCurrency===false,'DEV infinite currency did not disable');
  dev.equipAll(1,false);const baselineAwState=JSON.stringify(playerAwState());
  function setup(key,n,aw,augment=false){
    resetGame();dev.equipOnly(key,n,aw);state.weaponAugments=augment?{[key]:true}:{};
    state.passives={};state.bossTraits={};state.mode='playing';state.time=20;state.xpNeed=1e9;
    for(const list of Object.values(state.entities))if(Array.isArray(list))list.length=0;
    for(let i=0;i<12;i++)state.entities.enemies.push({id:state.nextId++,x:player.x+80+i*9,y:player.y+(i%3-1)*20,r:12,hp:1e8,maxHp:1e8,type:'grunt',kind:'normal',speed:0,damage:0,color:'#7769ff',dead:false,phase:0,xp:0});
    player.invuln=0;player.hitPulse=0;rebuildEnemyIndex();
    return state.entities.enemies[0];
  }
  function trigger(key,n){
    const t=state.entities.enemies[0];
    switch(key){
      case'core':for(let i=0;i<4;i++)spawnCoreShot(t);break;
      case'blade':player.awBladeCd=.001;updateWeapons(.01);break;
      case'ember':for(let i=0;i<12;i++)dealDamage(t,1,{source:'ember'});fireEmber(t,n);break;
      case'bulwark':player.shield=1;hurtPlayer(40);break;
      case'gravity':createGravityWells(n);for(const w of state.entities.wells)w.life=.2;updateWells(.01);break;
      case'comet':for(let i=0;i<4;i++)fireComet(t,n);break;
      case'arc':fireBoomerang(t,n);updateBoomerangs(.01);break;
      case'prism':updateFocusedPrisms(.01,n);state.time+=2;player.prismSharedLock.heat=3;updateFocusedPrisms(.01,n);break;
      case'chrono':player.awChronoPhase=.999;updateWeapons(.1);break;
      case'ion':for(const e of state.entities.enemies)dealDamage(e,1,{source:'ion-chain'});updateWeapons(.01);break;
      case'nova':for(let i=0;i<3;i++)fireNovaPulse(n);break;
      case'drone':for(let i=0;i<5;i++)fireMeteorDrones(n);break;
      case'rail':for(let i=0;i<4;i++)fireRailgun(n);break;
      case'spiral':for(let i=0;i<4;i++)fireGalacticSpiral(n);break;
      case'mirror':for(let i=0;i<6;i++){state.entities.enemyProjectiles.push({id:state.nextId++,x:player.x+25,y:player.y,r:4,vx:-10,vy:0,life:5,damage:1});fireReflector(n);}break;
      case'vacuum':plantVacuumSeed(t.x,t.y,n);detonateVacuumSeed(state.entities.vacuumSeeds[0]);break;
      case'mine':for(let i=0;i<5;i++){player.x+=40;deployPhaseMinefield(n);}break;
      case'missile':for(let i=0;i<3;i++)fireInterstellarMissiles(n);break;
      case'gate':deployOrbitalGate(n);{const net=state.entities.gateNetworks.at(-1);spawnGatePulseSet(net);for(let i=0;i<net.gates.length*3;i++){state.time+=.2;gateSegmentHit(net,net.pulses[0]);}}break;
    }
  }
  const signature={core:'stellar-volley',blade:'blade-align',ember:'starline-flash',bulwark:'bastion-break',gravity:'binary-merge',comet:'comet-charge',prism:'prism-crown-charge',chrono:'chrono-sever',ion:'ion-circuit-freeze',nova:'hypernova-charge',drone:'fleet-form',rail:'rail-assemble',spiral:'genesis-form',mirror:'mirror-sanctuary',mine:'starrail-run',missile:'arsenal-open',gate:'hypergate-charge'};
  function hasSignature(key){
    if(key==='arc')return state.entities.curves.some(p=>p.awLunar);
    if(key==='vacuum')return state.entities.awLotusFields.length>0;
    return arrays.slice(0,3).some(k=>state.entities[k].some(e=>e.kind===signature[key]));
  }
  function liveAwMetadata(){
    const out=[];
    for(const [key,list]of Object.entries(state.entities))if(Array.isArray(list))for(const item of list){
      if(!item||item.life<=0||item.dead)continue;
      for(const k of Object.keys(item))if(/^aw[A-Z]|^awakeningChild$/.test(k)&&item[k])out.push(key+'.'+k);
      if(key==='gateNetworks')for(const pulse of item.pulses||[])if('awGrandEligible'in pulse)out.push('gate.awGrandEligible');
    }
    return out;
  }
  function drain(){for(let i=0;i<40;i++){state.time+=.05;updatePendingActions(.05);}}
  function drawAll(){drawProjectiles();drawBoomerangs();drawWells();drawBeamEffects();drawPlayer();drawChronoField();drawAlliedEffects();}
  function visualSample(key,column){
    const savedNow=Object.getOwnPropertyDescriptor(performance,'now');Object.defineProperty(performance,'now',{configurable:true,value:()=>1000});
    ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,vw,vh);drawAll();ctx.restore();
    if(savedNow)Object.defineProperty(performance,'now',savedNow);else delete performance.now;
    const y=keys.indexOf(key)*260,x=column*340;
    galleryCtx.drawImage(canvas,(vw/2-330)*dpr,(vh/2-225)*dpr,660*dpr,450*dpr,x,y+25,340,232);
    galleryCtx.fillStyle='#c8deef';galleryCtx.font='14px sans-serif';galleryCtx.fillText(`${key} / ${['BASE 1','BASE 6','AWAKE 6'][column]}`,x+8,y+18);
    return canvas.toDataURL();
  }
  for(const key of keys){
    const row={key,base:[],awakenedSignature:false,transient:true,visual:false};
    const basePixels=[];
    for(const n of [1,6]){
      setup(key,n,false);trigger(key,n);drain();drawAll();
      const clean=!hasSignature(key)&&liveAwMetadata().length===0;
      check(clean,`${key} BASE ${n}: signature/metadata leaked ${liveAwMetadata()}`);row.base.push(clean);
      check(!window.stackfallIsWeaponAwakened(key),`${key} stack count implied awakening`);
      check(weaponText(key).name!==window.stackfallAwakeningDefs[key].ko,`${key} BASE name leaked awakening`);
      basePixels.push(visualSample(key,n===1?0:1));
      for(const p of state.entities.projectiles)sources.add(p.playerVisual||p.source);
    }
    setup(key,6,true);trigger(key,6);row.awakenedSignature=hasSignature(key);check(row.awakenedSignature,`${key} awakened signature missing`);drawAll();
    const awakenedPixels=visualSample(key,2);
    row.visual=basePixels.every(pixels=>pixels!==awakenedPixels);check(row.visual,`${key} BASE/awakening visual sample is identical`);
    check(weaponText(key).name===window.stackfallAwakeningDefs[key].ko,`${key} awakened name missing`);
    // Reset while delayed signature callbacks are still pending, then advance time.
    for(const baseline of [1,6]){
      dev.equipOnly(key,baseline,false);drain();drawAll();
      const clean=arrays.every(k=>state.entities[k].length===0)&&liveAwMetadata().length===0&&state.pendingActions.length===0;
      row.transient&&=clean;check(clean,`${key} DEV ${baseline} contaminated after delayed callbacks`);
      check(JSON.stringify(playerAwState())===baselineAwState,`${key} DEV retained player awakening state`);
      setup(key,6,true);trigger(key,6);
    }
    // Exercise awakenings with the independent augment enabled as well.
    setup(key,6,false,true);state.passives.multiplicity=2;trigger(key,6);drain();drawAll();
    check(!hasSignature(key)&&liveAwMetadata().length===0,`${key} BASE augment leaked awakening`);
    setup(key,6,true,true);state.passives.multiplicity=2;trigger(key,6);drain();drawAll();
    for(const p of state.entities.projectiles)sources.add(p.playerVisual||p.source);
    check(window.stackfallCanonicalWeaponVisualDiagnostics().unknownProjectileSources.length===0,`${key} unknown projectile family`);
    row.visual&&=window.stackfallCanonicalWeaponVisualDiagnostics().unknownProjectileSources.length===0;
    rows.push(row);
  }
  // Each raster comparison is made at fixed time/coordinates. Base entities retain
  // their provenance even when the owner awakens while the projectile is in flight.
  const t=setup('ember',6,false);fireEmber(t,6);
  const draws=[],oldDraw=ctx.drawImage;ctx.drawImage=function(image,...args){draws.push({image,args});};
  drawProjectiles();const before=draws.splice(0);state.awakenedWeapons.ember=true;drawProjectiles();const after=draws.splice(0);ctx.drawImage=oldDraw;
  check(before.length>0&&before.length===after.length&&before.every((d,i)=>d.image===after[i].image&&JSON.stringify(d.args)===JSON.stringify(after[i].args)),'ordinary Ember changed raster/dimensions after awakening');
  // Source identity and special silhouette survive a gate augment copy.
  setup('gate',6,false);state.weaponAugments.gate=true;deployOrbitalGate(6);const net=state.entities.gateNetworks.at(-1),gate=net.gates[0];
  spawnPlayerProjectile({x:gate.x,y:gate.y,vx:800,vy:0,r:18,life:2,damage:1,source:'comet',awakeningChild:true});updateGateCrossfeed(net,.01);
  const copy=state.entities.projectiles.find(p=>p.gateCopy);check(copy?.playerVisual==='comet'&&copy.awakeningChild===true,'gate copy lost awakening projectile provenance');
  setup('mirror',6,true);for(let i=0;i<6;i++)fireReflector(6);check(hasSignature('mirror'),'mirror original-cast charge contract changed');
  setup('bulwark',6,true);player.shield=10;player.invuln=0;hurtPlayer(0);
  check(!player.awBulwarkHitFlash&&!hasSignature('bulwark'),'zero-damage hit activated Bastion response');
  // The spatial optimizer must preserve the reward wrapper, once per well.
  setup('gravity',6,false,true);createGravityWells(6);const wells=state.entities.wells.filter(w=>w.rewardBurst);
  for(const w of wells)w.life=.001;updateWells(.01);
  check(wells.length===2&&wells.every(w=>w.strongRewardBurstDone),'gravity augment expiration was shadowed by optimizer');
  state.entities.wells.push({x:player.x,y:player.y,r:150,life:.5,tick:1,damage:0,kind:'trait-singularity'});
  const hostile={x:player.x,y:player.y,vx:100,vy:0,life:1};state.entities.enemyProjectiles.push(hostile);updateWells(.1);
  check(hostile.vx<100,'singularity projectile distortion wrapper was lost');
  setup('spiral',6,false,true);fireGalacticSpiral(6);drain();
  check(state.entities.projectiles.filter(p=>p.source==='spiral-counter').length===20,'counter spiral augment ran more than once');
  setup('drone',6,false,true);let droneMeteorCalls=0;const oldArea=areaDamage;
  areaDamage=function(...args){if(args[5]==='drone-meteor')droneMeteorCalls++;return oldArea(...args);};
  fireMeteorDrones(6);drain();areaDamage=oldArea;check(droneMeteorCalls===1,'drone mark augment ran more than once');
  for(const augmented of [false,true]){
    setup('ion',1,false,augmented);let hits=0;const oldDamage=dealDamage;
    dealDamage=function(enemy,amount,opts={}){if(opts.source==='ion-chain')hits++;return oldDamage(enemy,amount,opts);};
    fireIonChain(1);drain();dealDamage=oldDamage;
    check(hits===(augmented?4:2),'ion augment must add exactly one independent two-link network');
  }
  for(const awakened of [false,true]){
    setup('mirror',6,awakened,true);let rays=0;const oldRail=applyRailBeam;
    applyRailBeam=function(...args){if(args[7]==='mirror-twin-reflect')rays++;return oldRail(...args);};
    state.entities.enemyProjectiles.push({id:state.nextId++,x:player.x+25,y:player.y,r:4,vx:-10,vy:0,life:5,damage:1});
    fireReflector(6);applyRailBeam=oldRail;
    check(rays===2&&!state.entities.projectiles.some(p=>p.source==='mirror-twin-reflect'),'mirror augment duplicated its two reflected rays');
  }
  const prismViews=new Map();
  for(const count of [1,3,5,2,5]){
    const positions=prismPositions(count);
    check(positions.length===count&&positions.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'prism multiplicity position buffer overflow');
    if(prismViews.has(count))check(prismViews.get(count)===positions,'prism allocated a per-frame view');
    prismViews.set(count,positions);
  }
  for(const awakened of [false,true]){
    setup('blade',6,awakened);state.passives.multiplicity=2;player.angle=.7;
    const moves=[],translate=ctx.translate;ctx.translate=function(x,y){moves.push([x,y]);return translate.call(this,x,y);};
    drawEquippedOrbits(vw/2,vh/2,1000);ctx.translate=translate;
    const extra=moves.slice(-2),orbit=orbitRadiusFor('blade');
    check(extra.length===2&&extra.every(([x,y],i)=>Math.hypot(x-vw/2-Math.cos(player.angle+(i+.5)*TAU/2)*orbit,y-vh/2-Math.sin(player.angle+(i+.5)*TAU/2)*orbit)<.001),'multiplicity blade visuals differ from damage orbit');
  }
  setup('arc',6,false);fireBoomerang(state.entities.enemies[0],6);updateBoomerangs(.01);
  check(state.entities.curves.length>0&&state.entities.curves.every(p=>!p.awLunar&&!Number.isFinite(p.awMoonPhase)),'base boomerang leaked lunar awakening form');
  setup('arc',6,true);fireBoomerang(state.entities.enemies[0],6);updateBoomerangs(.01);
  check(state.entities.curves.some(p=>p.awLunar&&Number.isFinite(p.awMoonPhase)),'awakened boomerang did not enter lunar form');
  for(const aw of [false,true]){
    const target=setup('comet',6,aw);fireComet(target,6);
    check(state.entities.projectiles.some(p=>p.source==='comet'&&!p.awakeningChild),'base comet did not launch immediately');
    fireComet(target,6,true);check(!hasSignature('comet'),'echo advanced final comet cycle');
    for(let i=0;i<3;i++)fireComet(target,6);
    check(hasSignature('comet')===aw,'final comet fourth-cast gate incorrect');
    check(!state.entities.projectiles.some(p=>p.awakeningChild),'final comet launched before charge');
    updatePendingActions(.339);check(!state.entities.projectiles.some(p=>p.awakeningChild),'final comet charge shorter than 340ms');
    updatePendingActions(.002);check(state.entities.projectiles.some(p=>p.awakeningChild)===aw,'final comet delayed launch missing or leaked');
  }
  // All three canonical branches must actually call the awakening bridge.
  const priorAwake=window.stackfallIsWeaponAwakened,queries=[];window.stackfallIsWeaponAwakened=k=>{queries.push(k);return priorAwake(k);};
  dev.equipAll(6,true);drawEquippedOrbits(vw/2,vh/2,1000);drawDefenseBarrier();drawGravityLens({r:80,life:1,awBinarySide:0},{x:100,y:100},1,1);window.stackfallIsWeaponAwakened=priorAwake;
  for(const key of ['blade','bulwark','gravity'])check(queries.includes(key),`${key} canonical awake bridge was not called`);
  dev.equipAll(6,false);check(keys.every(k=>!window.stackfallIsWeaponAwakened(k)),'all-six DEV inferred awakening');
  check(arrays.every(k=>state.entities[k].length===0),'all-six DEV retained awakening arrays');
  dev.equipAll(1,false);check(keys.every(k=>weaponCount(k)===1&&!window.stackfallIsWeaponAwakened(k)),'all-one DEV loadout incorrect');
  dev.giveCores();check(state.awakeningCores===99,'DEV core grant failed');
  player.hp=1;document.querySelector('#devHeal').click();check(player.hp===player.maxHp,'DEV heal failed');
  scheduleWeaponAction(100,()=>spawnPlayerProjectile({x:0,y:0,vx:0,vy:0,life:1,source:'comet'}));
  document.querySelector('#devClearEnemies').click();drain();check(Object.values(state.entities).every(list=>!Array.isArray(list)||list.length===0)&&state.pendingActions.length===0,'DEV Clear left entities or delayed attacks');
  const stages=[];
  for(let order=1;order<=18;order++){
    dev.startStage(`stage-${String(order).padStart(2,'0')}`);state.mode='paused';
    const translations=[],points=[],original=ctx.drawImage,screen=worldToScreen,worldPoint=StageCraft.worldPoint;
    ctx.drawImage=function(img,...args){translations.push(args);};
    worldToScreen=function(x,y){const p=screen(x,y);points.push({wx:x,wy:y,f:1,...p});return p;};
    StageCraft.worldPoint=function(x,y,f=1){const p=worldPoint(x,y,f);points.push({wx:x,wy:y,f,...p});return p;};
    const theme=`stage-${String(order).padStart(2,'0')}`;let a,b,pa,pb;
    try{player.x=0;player.y=0;drawStageConstellationField(theme);a=translations.splice(0);pa=points.splice(0);player.x=37;player.y=23;drawStageConstellationField(theme);b=translations.splice(0);pb=points.splice(0);}finally{ctx.drawImage=original;worldToScreen=screen;StageCraft.worldPoint=worldPoint;}
    const projected=pa.some(x=>pb.some(y=>x.wx===y.wx&&x.wy===y.wy&&x.f===y.f&&Math.abs(y.x-x.x+37*x.f)<.01&&Math.abs(y.y-x.y+23*x.f)<.01));
    const raster=a.length>0&&b.length>0&&Math.abs(((b[0][0]-a[0][0]+1400)%1400)-1363)<=1&&Math.abs(((b[0][1]-a[0][1]+1000)%1000)-977)<=1,moved=projected||raster;
    check(moved,`${theme} world anchor did not follow player movement`);
    state.mode='playing';const preview=dev.jumpStageBoss();for(let i=0;i<299;i++){state.time=preview.startAt+(i+1)/60;updateSpawning(1/60);}
    check(!state.stageRun.bossSpawned&&state.entities.enemies.length===0,`${theme} DEV preview spawned combat before five seconds`);
    state.time=preview.bossAt;updateSpawning(1/60);if(state.realmTransition)updateRealmTransition(state.realmTransition.duration);
    const boss=state.entities.enemies.filter(e=>e.kind==='stage-boss'&&!e.dead).length===1;check(boss,`${theme} normal five-second trigger did not finish entry`);stages.push({order,moved,boss});
  }
  dev.startEndless();check(window.stackfallCurrentRunConfig().mode==='endless','DEV Endless failed');state.mode='paused';draw();
  check(stackfallRuntimeDiagnostics().errorCount===0,'runtime error diagnostics not empty');
  const owners={drawProjectiles,drawEquippedOrbits,drawDefenseBarrier,drawGravityLens,drawBoomerangs,drawAlliedEffects,drawPostRosterWeaponEntities,drawPlayer,drawWells,drawEffects,updateWeapons,updateProjectiles,updateBoomerangs,updateWells,dealDamage,hurtPlayer};
  return{failures,rows,stages,sources:[...sources].sort(),owners:Object.fromEntries(Object.entries(owners).map(([key,fn])=>[key,fn.name]))};
}
