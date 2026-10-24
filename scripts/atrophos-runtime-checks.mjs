// Runs against the loaded production game in the project's browser-smoke harness.
// Deterministic combat checks supplement, rather than replace, real frame/input QA.
export function atrophosRuntimeChecks(){
  const failures=[],checks=[],observations={};
  const check=(name,ok,data)=>{checks.push({name,ok:!!ok,data});if(!ok)failures.push(name);};
  const api=window.stackfallDeveloperTest;
  const previousDev={invincible:window.stackfallDevInvincible===true,noLevel:window.stackfallDevDisableLevelUps===true};
  api.startEndless();api.setLevelUpsDisabled(true);api.setInvincible(false);
  state.spawnTimer=state.encounterTimer=99999;state.entities.enemies.length=0;
  const make=()=>{player.x=player.y=0;player.moveVX=player.moveVY=0;player.hp=1e6;player.shield=0;player.invuln=0;const e=spawnEnemy('apex');e.apexForm=e.eliteForm='chronophage';e.hp=e.maxHp=1e8;e.damage=50;initializeAtrophos(e);state.entities.enemies=[e];state.apexActiveId=e.id;return e;};
  const step=(e,seconds,move=null)=>{for(let i=0;i<Math.ceil(seconds*120);i++){const dt=1/120;state.time+=dt;player.invuln=Math.max(0,player.invuln-dt);if(move)move(dt);updateAtrophos(e,dt);}};
  for(let phase=1;phase<=4;phase++){
    const e=make();e.hp=e.maxHp*[1,.7,.45,.2][phase-1];step(e,phase===3?20:13);
    check(`P${phase} stationary player enters actual damage`,e.atrophos.collisions>0&&player.hp<1e6,{hits:e.atrophos.collisions,hpLost:1e6-player.hp});
    check(`P${phase} bounded threat memory`,e.atrophos.queue.length<=8&&atrophosPending(e.atrophos)<=2&&e.atrophos.history.length<=64);
  }
  {
    const e=make();step(e,14,dt=>{player.moveVX=180;player.x+=180*dt;});
    check('constant straight movement is threatened without homing marks',e.atrophos.collisions>0,{hits:e.atrophos.collisions});
  }
  {
    const e=make(),a=e.atrophos;a.nextCycle=999;a.history=[{x:0,y:0,t:0}];player.x=145;a.clock=1;
    atrophosStart(e,{kind:'record',history:true,hold:1.45});const t=a.threats[0],locked={x:t.x,y:t.y};
    step(e,.8);check('snapshot stays at recorded position after dodge',t.x===locked.x&&t.y===locked.y&&a.collisions===0);
    player.x=0;step(e,.9);check('returning to old position is punished',a.collisions===1);
  }
  {
    const e=make(),a=e.atrophos;a.nextCycle=999;atrophosStart(e,{kind:'cut',hold:1.45});step(e,.95);
    check('cut remains visible after arm motion and before impact',a.threats.length===1&&!a.threats[0].fired&&a.threats[0].points.length===6);
    step(e,.6);check('cut resolves after the retained warning',a.events.some(v=>v.type==='active')&&a.collisions===1);
  }
  {
    const e=make();e.hp=e.maxHp*.2;step(e,10);const events=e.atrophos.events.filter(v=>['start','active','end'].includes(v.type));
    const ix=(type,cue)=>events.findIndex(v=>v.type===type&&v.detail.startsWith(cue+':'));
    check('P4 starts cut first but resolves record first',ix('start','cut')<ix('start','record')&&ix('active','record')<ix('active','cut'),events);
    check('P4 preserves a recovery gap',atrophosPending(e.atrophos)===0&&e.atrophos.queue.length===0);
    check('two beats have distinct body pose clocks',e.atrophos.waistStart>e.atrophos.upperStart&&e.atrophos.events.some(v=>v.detail.startsWith('waist:')));
  }
  {
    const e=make(),id=e.id;step(e,5);check('one stable foreground target and three union faces',state.entities.enemies.length===1&&e.id===id&&e.stageBodyShapes.length===3&&nearestEnemy(player.x,player.y,1000)===e);
    check('auto-aim center is inside visible wrist geometry',enemyCircleOverlap(e,e.x,e.y,0));
    check('background colossus is absent from physics',!enemyCircleOverlap(e,e.x,e.y-180,5)&&e.contactR===0&&e.speed===0);
    const original=dealDamage,calls=[];dealDamage=(enemy,amount,opts={})=>{if(enemy===e)calls.push({amount,source:opts.source});return original(enemy,amount,{...opts,canCrit:false});};
    try{
      const once=(name,fn)=>{calls.length=0;fn();check(name,calls.length===1,[...calls]);};
      once('one AoE damages the union once',()=>areaDamage(e.x,e.y,90,10,'#fff','atrophos-test-area',{shake:false}));
      once('one rail beam damages the union once',()=>applyRailBeam(e.x-150,e.y,e.x+150,e.y,35,10,'#fff','atrophos-test-beam'));
      once('one piercing shot damages the union once',()=>{spawnPlayerProjectile({x:e.x-80,y:e.y,vx:800,vy:0,r:8,life:2,damage:10,color:'#fff',source:'atrophos-test-pierce',pierce:6});for(let i=0;i<30;i++)updateProjectiles(.01);});
      once('one mine explosion damages the union once',()=>detonatePhaseMine({x:e.x,y:e.y,n:1,damage:10,radius:100,color:'#fff',life:1}));
      once('one chain hop cannot hit three wrist faces',()=>castIonPath(e,1,false,new Set(),4));
      once('one rebound pass cannot hit three wrist faces',()=>{state.entities.curves.length=0;fireBoomerang(e,1,false,null,true);for(let i=0;i<240;i++)updateBoomerangs(.005);});
      once('one lingering-field tick hits the union once',()=>{state.entities.wells=[{x:e.x,y:e.y,r:180,life:2,max:2,damage:10,strength:0,tick:0,color:'#fff'}];updateWellBodies(.01);});
      calls.length=0;dealDamage(e,10,{source:'rapid-a'});dealDamage(e,10,{source:'rapid-b'});check('independent rapid hits retain full cadence',calls.length===2);
      calls.length=0;spawnGuidedMissile(e,6,1,10);const m=state.entities.guidedMissiles.at(-1);e.x=player.x+(e.x<player.x?120:-120);updateAtrophosWristShapes(e);for(let i=0;i<840&&m.life>0;i++)updateGuidedMissiles(.005);
      check('guided missile follows relocated live wrist and lands',m.targetId===id&&calls.some(v=>v.source==='missile'),{missile:{x:m.x,y:m.y,life:m.life,targetId:m.targetId},target:{id:e.id,x:e.x,y:e.y},calls:[...calls]});
      const next=spawnEnemy('grunt');next.x=e.x+30;next.y=e.y;e.dead=true;spawnGuidedMissile(e,6,1,10);const fallback=state.entities.guidedMissiles.at(-1);updateGuidedMissiles(.01);check('dead target reference reacquires a valid enemy',fallback.targetId===next.id);
    }finally{dealDamage=original;}
    observations.damageSemantics=checks.filter(v=>/union|cadence|missile|reference/.test(v.name));
  }
  api.startEndless();api.setInvincible(previousDev.invincible);api.setLevelUpsDisabled(previousDev.noLevel);
  return{failures,checks,observations};
}
