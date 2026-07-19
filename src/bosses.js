function bossSkill(enemy,dt){
  if(enemy.type==='mini')return miniSkill(enemy,dt);if(enemy.type!=='boss')return;
  if(enemy.kind==='apex'){apexBossSkill(enemy,dt);apexPhaseDirector(enemy,dt);}else if(enemy.kind==='void'||enemy.eventKind==='void')voidBossSkill(enemy,dt);else normalBossSkill(enemy,dt);
  if(typeof bossAntiIdleSkill==='function')bossAntiIdleSkill(enemy,dt);
}
function apexPhaseTransition(e,phase){
  const form=e.apexForm||e.eliteForm,arena=state.apexArena||{x:player.x,y:player.y,r:460},d=Math.max(9,e.damage*(.27+phase*.025)),color=form==='chronophage'?'#79ffe1':form==='starforge'?'#ffb04e':'#b7c9ff';
  e.attackLockUntil=Math.max(e.attackLockUntil||0,(state.time||0)+.38);e.contactSafeUntil=Math.max(e.contactSafeUntil||0,(state.time||0)+.48);state.camera.shake=Math.max(state.camera.shake,7+phase*2);state.flash=Math.max(state.flash,.08+phase*.025);shockwave(e.x,e.y,color,115+phase*42,.44+phase*.05,3+phase);
  showBossNotice(`${bossName(form)} · PHASE ${phase}`,'APEX THREAT');
  if(form==='chronophage'){
    const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,18+phase*4,178+phase*18,d*.70,'#d9fff8',e.phase*.21,aim,.30-phase*.025,4.6);
    const history=e.apexPlayerHistory||[],past=history[Math.max(0,history.length-8)]||{x:player.x,y:player.y};rawLine(past.x,past.y,player.x,player.y,18+phase*3,d,'#79ffe1',1.06,'boss-line');
    if(phase>=3){for(let i=0;i<4+phase;i++){const a=i/(4+phase)*TAU+e.phase*.04;rawLine(arena.x,arena.y,arena.x+Math.cos(a)*arena.r*1.12,arena.y+Math.sin(a)*arena.r*1.12,18+phase*2,d*.82,i%2?'#79ffe1':'#d9fff8',.92+i*.04,'boss-line');}}
  }else if(form==='starforge'){
    const target=predictedPlayer(45+phase*38);addCircle(target.x,target.y,52+phase*8,d*1.12,'#ff7135',.86);for(let i=0;i<3+phase;i++){const a=i/(3+phase)*TAU+e.phase*.05;addCircle(target.x+Math.cos(a)*(92+phase*12),target.y+Math.sin(a)*(92+phase*12),36+phase*4,d*.66,'#ffd26f',.96+i*.055);}
    if(phase>=3){for(let i=0;i<8+phase*2;i++)addLine(e,e.phase*.04+i*TAU/(8+phase*2),arena.r*1.18,18+phase*2,d*.86,i%3?'#ff9d42':'#fff1b0',.92+i*.018);}
    if(phase===4)placeMines(e,9,'#ff7135',d*.72);
  }else{
    const points=apexArenaPoints(6+phase*2,arena.r*.58,e.phase*.03),jump=phase>=3?3:2;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+jump)%points.length];rawLine(a.x,a.y,b.x,b.y,15+phase*2,d*.82,i%2?'#d8e2ff':'#879be0',1.0+i*.025,'boss-line');}
    for(let i=0;i<points.length;i+=2){const point=points[i],a=Math.atan2(player.y-point.y,player.x-point.x);spawnEnemyProjectile(point.x,point.y,a,170+phase*20,d*.55,'#dce6ff',4.2,6,'constellation');}
    if(phase>=3)teleportConstellation(e,phase,.58);
  }
}
function apexVariantAttack(e,phase){
  const form=e.apexForm||e.eliteForm,arena=state.apexArena||{x:player.x,y:player.y,r:460},d=Math.max(8,e.damage*(.25+phase*.022));
  if(form==='chronophage'){
    const history=e.apexPlayerHistory||[],now={x:player.x,y:player.y},pastA=history[Math.max(0,history.length-(4+phase))]||now,pastB=history[Math.max(0,history.length-(8+phase*2))]||pastA;addCircle(now.x,now.y,42+phase*5,d*.88,'#79ffe1',.78);addCircle(pastA.x,pastA.y,54+phase*6,d*.72,'#c6fff4',1.02);rawLine(pastB.x,pastB.y,now.x,now.y,17+phase*2,d*.94,'#8fffe0',1.10,'boss-line');if(phase>=3){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,16+phase*3,210+phase*12,d*.60,'#e4fffb',-e.phase*.23,aim,.24,4.2);}
  }else if(form==='starforge'){
    const p=predictedPlayer(80+phase*32);for(let i=0;i<2+phase;i++){const a=i*2.399+e.phase*.04;addCircle(p.x+Math.cos(a)*(i?48+phase*5:0),p.y+Math.sin(a)*(i?48+phase*5:0),38+phase*4,d*(i? .58:1.0),'#ff8a42',.72+i*.10);}if(phase>=2){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,20+phase*3,185+phase*12,d*.62,'#ffd26f',e.phase*.19,aim,.28,5.0);}if(phase===4){const span=arena.r*.76,gap=92;for(const offset of[-gap,gap]){rawLine(arena.x-span,player.y+offset,arena.x+span,player.y+offset,22,d*.86,'#fff1b0',.98,'boss-line');rawLine(player.x+offset,arena.y-span,player.x+offset,arena.y+span,22,d*.86,'#ff9d42',1.06,'boss-line');}}
  }else{
    const points=apexArenaPoints(5+phase*2,arena.r*.50,-e.phase*.025);for(const [index,point]of points.entries()){const base=Math.atan2(player.y-point.y,player.x-point.x),shots=phase>=3?3:2;for(let j=0;j<shots;j++){const spread=(j-(shots-1)/2)*.13;spawnEnemyProjectile(point.x,point.y,base+spread,165+phase*18,d*.50,index%2?'#f0f4ff':'#9fb2ef',4.0,6,'constellation');}}if(phase>=2){const half=135+phase*18,x=player.x,y=player.y;rawLine(x-half,y-half,x+half,y-half,16+phase,d*.82,'#d8e2ff',.92,'boss-line');rawLine(x-half,y+half,x+half,y+half,16+phase,d*.82,'#879be0',1.00,'boss-line');rawLine(x-half,y-half,x-half,y+half,16+phase,d*.82,'#aebfff',1.08,'boss-line');rawLine(x+half,y-half,x+half,y+half,16+phase,d*.82,'#aebfff',1.16,'boss-line');}if(phase===4)teleportConstellation(e,4,.50);
  }
}
function apexPhaseDirector(e,dt){
  if(!e||e.dead||e.kind!=='apex'||state.mode!=='playing')return;const phase=Math.max(1,Math.min(4,e.apexPhase||1));
  if((e.apexPhaseEntered||0)<phase){e.apexPhaseEntered=phase;e.apexVariantCd=.75;apexPhaseTransition(e,phase);return;}
  e.apexVariantCd=(e.apexVariantCd??4.0)-dt;const growth=Math.max(1,e.apexGrowthScale||1);if(e.apexVariantCd<=0){e.apexVariantCd=Math.max(2.15,5.45-phase*.58-(growth-1)*.32);apexVariantAttack(e,phase);}
}
function apexMotionVelocity(e){
  const arena=state.apexArena;if(!arena)return{x:0,y:0};const form=e.apexForm||e.eliteForm,dx=arena.x-e.x,dy=arena.y-e.y,centerD=Math.hypot(dx,dy)||1;
  if(form==='starforge'){const anchorX=arena.x,anchorY=arena.y-arena.r*.24,ax=anchorX-e.x,ay=anchorY-e.y,d=Math.hypot(ax,ay)||1;return{x:ax/d*Math.min(170,d*2.8),y:ay/d*Math.min(170,d*2.8)};}
  if(form==='chronophage'){const a=e.phase*.065+(e.id%7)*.31,rr=arena.r*.28,targetX=arena.x+Math.cos(a)*rr,targetY=arena.y+Math.sin(a)*rr*.58,tx=targetX-e.x,ty=targetY-e.y,d=Math.hypot(tx,ty)||1;return{x:tx/d*e.speed*.94,y:ty/d*e.speed*.94};}
  const desired=arena.r*.46,radial=(centerD-desired)*1.8,tangent=e.speed*(e.apexPhase>=3?1.48:e.apexPhase===2?1.35:1.08);return{x:dx/centerD*radial+(-dy/centerD)*tangent,y:dy/centerD*radial+(dx/centerD)*tangent};
}
function clampApexToArena(e){const arena=state.apexArena;if(!arena||e.kind!=='apex')return;const dx=e.x-arena.x,dy=e.y-arena.y,d=Math.hypot(dx,dy)||1,limit=Math.max(70,arena.r-e.r*.58-20);if(d>limit){e.x=arena.x+dx/d*limit;e.y=arena.y+dy/d*limit;}}
function updateEnemies(dt){
  const gravWells=state.entities.wells,chronoN=weaponCount('chrono'),chronoRadius=145+chronoN*18,threat=1+Math.floor((state.time||0)/60);
  for(const e of state.entities.enemies){
    if(!e||e.dead)continue;if(!Number.isFinite(e.x)||!Number.isFinite(e.y)||!Number.isFinite(e.speed)){e.dead=true;continue;}
    const apex=e.kind==='apex';if(apex)e.timeLock=0;e.hit=Math.max(0,(e.hit||0)-dt);e.phase=(Number.isFinite(e.phase)?e.phase:0)+dt*3;bossSkill(e,dt);
    let dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1,speed=e.speed;if(!apex&&chronoN&&d<chronoRadius)speed*=Math.max(.32,1-(.10+chronoN*.07));if(!apex&&(e.timeLock||0)>0){e.timeLock=Math.max(0,e.timeLock-dt);speed*=e.type==='boss'?.42:e.type==='mini'?.24:.08;}
    let vx=0,vy=0;if(apex){const motion=apexMotionVelocity(e);vx=motion.x;vy=motion.y;}else if(e.type==='ranged'){const radial=d>435?1:d<285?-1:0,strafe=e.strafeDir||1;vx=(dx/d*radial+(-dy/d)*strafe*.72)*speed;vy=(dy/d*radial+(dx/d)*strafe*.72)*speed;e.rangedCd=(e.rangedCd||1)-dt;if(e.rangedCd<=0&&d<720){e.rangedCd=(1.75/(1+Math.max(0,threat-1)*.055))*rand(.88,1.12);const base=Math.atan2(dy,dx),shots=threat>=9?2:1,angles=shots===2?[0,(e.rangedVolleySide=(e.rangedVolleySide||-1)*-1)*.13]:[0];for(const offset of angles){const a=base+offset;spawnEnemyProjectile(e.x,e.y,a,225+threat*7,e.damage*.72,e.eventKind==='crash'?'#ffcb72':'#65ddff',5.2,4.5,enemyProjectileVisualFor(e,'fan'));}}}else{vx=dx/d*speed;vy=dy/d*speed;}
    const control=apex?0:enemyControlFactor(e);for(const w of gravWells){if(!w||!Number.isFinite(w.x)||!Number.isFinite(w.y)||!Number.isFinite(w.r)||!Number.isFinite(w.strength))continue;const wx=w.x-e.x,wy=w.y-e.y,wd=Math.hypot(wx,wy)||1;if(wd<w.r){const force=(1-wd/w.r)*w.strength*control;vx+=wx/wd*force;vy+=wy/wd*force;}}
    if(e.dash>0){e.dash-=dt;vx+=Number.isFinite(e.dashX)?e.dashX:0;vy+=Number.isFinite(e.dashY)?e.dashY:0;}e.x+=vx*dt;e.y+=vy*dt;if(apex)clampApexToArena(e);if(!Number.isFinite(e.x)||!Number.isFinite(e.y)){e.dead=true;continue;}dx=player.x-e.x;dy=player.y-e.y;d=Math.hypot(dx,dy)||1;if(d<player.r+e.r+2&&player.invuln<=0&&(e.contactSafeUntil||0)<=state.time)hurtPlayer(e.damage,e);
  }
  compactInPlace(state.entities.enemies,e=>e&&!e.dead&&Number.isFinite(e.x)&&Number.isFinite(e.y));
}
function hurtPlayer(amount,source){const hadDefense=weaponCount('bulwark')>0||stat('armor')>0||player.shield>0;amount*=1-damageReduction();if(player.shield>0){const used=Math.min(player.shield,amount);player.shield-=used;amount-=used;}if(amount>0)player.hp-=amount;player.invuln=.9;player.hitPulse=.22;const heavyImpact=amount>=14;state.camera.shake=Math.max(state.camera.shake,heavyImpact?3.5:1.6);if(heavyImpact)state.flash=Math.max(state.flash,.045);audio.hurt();spawnParticle(player.x,player.y,COLORS.red,heavyImpact?8:4,heavyImpact?160:105,heavyImpact?3.8:2.7);if(hadDefense)shockwave(player.x,player.y,COLORS.green,78,.24,3);if(source&&state.entities.enemies.includes(source)){const dx=source.x-player.x,dy=source.y-player.y,d=Math.hypot(dx,dy)||1,f=enemyControlFactor(source);source.x+=dx/d*48*f;source.y+=dy/d*48*f;}if(weaponCount('bulwark')>=4)areaDamage(player.x,player.y,115,24+weaponCount('bulwark')*4,COLORS.green,'bulwark-counter');if(player.hp<=0)endGame();}
function relativeProjectileSweepHitsPlayer(startX,startY,endX,endY,prevPlayerX,prevPlayerY,radius){
  const ax=startX-prevPlayerX,ay=startY-prevPlayerY,bx=endX-player.x,by=endY-player.y,dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
  const t=len>1e-8?clamp(-(ax*dx+ay*dy)/len,0,1):0,cx=ax+dx*t,cy=ay+dy*t;
  return cx*cx+cy*cy<=radius*radius;
}
function updateEnemyProjectiles(dt){
  const sample=state.enemyProjectilePlayerSample,validSample=sample&&sample.runSerial===state.runSerial,prevPlayerX=validSample?sample.x:player.x,prevPlayerY=validSample?sample.y:player.y;
  for(const p of state.entities.enemyProjectiles){
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.life)){if(p)p.life=0;continue;}
    p.vx=Number.isFinite(p.vx)?p.vx:0;p.vy=Number.isFinite(p.vy)?p.vy:0;p.r=Number.isFinite(p.r)?Math.max(1,p.r):5;p.damage=Number.isFinite(p.damage)?Math.max(0,p.damage):0;
    const startX=p.x,startY=p.y;p.prevX=startX;p.prevY=startY;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.age=(p.age||0)+dt;p.heading=Math.atan2(p.vy,p.vx);p.phase=p.heading;
    const hitRadius=player.r+p.r+1.5;if(player.invuln<=0&&relativeProjectileSweepHitsPlayer(startX,startY,p.x,p.y,prevPlayerX,prevPlayerY,hitRadius)){p.life=0;hurtPlayer(p.damage,p);}
    if(Math.hypot(player.x-p.x,player.y-p.y)>1900)p.life=0;
  }
  state.enemyProjectilePlayerSample={runSerial:state.runSerial,x:player.x,y:player.y};
  compactInPlace(state.entities.enemyProjectiles,p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y));trimOldest(state.entities.enemyProjectiles,entityCap('enemyProjectiles'));
}
function lineDistance(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy||1,t=clamp(((px-x1)*dx+(py-y1)*dy)/l,0,1);return Math.hypot(px-(x1+dx*t),py-(y1+dy*t));}
function playBossImpactAudio(strength=1){if(typeof audio.enemyImpact==='function')audio.enemyImpact(strength);else audio.hit(true);}
function triggerCircleImpact(t){const rings=t.impactStyle==='boss-circle'?3:2;for(let i=0;i<rings;i++)shockwave(t.x,t.y,i===rings-1?'#ffffff':t.color,t.r*(.78+i*.15),.28+i*.07,5-i);const points=Math.min(18,8+Math.floor(t.r/24));for(let i=0;i<points;i++){const a=i/points*TAU+(t.phase||0),rr=t.r*(.72+Math.random()*.22);spawnParticle(t.x+Math.cos(a)*rr,t.y+Math.sin(a)*rr,t.color,1,145,3.8);}state.camera.shake=Math.max(state.camera.shake,clamp(4+(t.damage||0)*.10,4.5,10));state.flash=Math.max(state.flash,.12);playBossImpactAudio(clamp(.75+(t.damage||0)/32,.75,1.55));}
function triggerLineImpact(t,x2,y2){const nullGrid=t.impactStyle==='null-grid',width=t.width*(nullGrid?1.55:1.25);if(state.entities.beams.length>=entityCap('beams'))state.entities.beams.shift();state.entities.beams.push({x1:t.x,y1:t.y,x2,y2,life:nullGrid?.28:.22,max:nullGrid?.28:.22,color:t.color,width});const steps=nullGrid?9:6;for(let i=0;i<=steps;i++){const p=i/steps,x=lerp(t.x,x2,p),y=lerp(t.y,y2,p);if(i%2===0)shockwave(x,y,i===Math.floor(steps/2)?'#ffffff':t.color,nullGrid?42:31,nullGrid?.24:.19,nullGrid?2.5:1.8);spawnParticle(x,y,t.color,nullGrid?3:2,nullGrid?135:105,nullGrid?3.5:2.8);}state.camera.shake=Math.max(state.camera.shake,nullGrid?7.5:clamp(4+(t.damage||0)*.08,4,8.5));state.flash=Math.max(state.flash,nullGrid?.16:.10);playBossImpactAudio(nullGrid?1.35:clamp(.7+(t.damage||0)/38,.7,1.35));}
function triggerNullGridImpact(t,x2,y2){triggerLineImpact(t,x2,y2);}
function validTelegraph(t){if(!t||!['circle','line'].includes(t.type)||![t.x,t.y,t.life,t.max,t.damage].every(validEffectNumber)||t.max<=0)return false;if(t.type==='circle')return validEffectNumber(t.r)&&t.r>=0;return[t.a,t.length,t.width].every(validEffectNumber)&&t.length>=0&&t.width>=0;}
function triggerCosmeticTelegraph(t){if(t.type==='circle'){shockwave(t.x,t.y,t.color,Math.max(28,t.r*.82),.24,1.8);spawnParticle(t.x,t.y,t.color,5,54,2.1);return;}const x2=t.x+Math.cos(t.a)*t.length,y2=t.y+Math.sin(t.a)*t.length;state.entities.beams.push({x1:t.x,y1:t.y,x2,y2,life:.14,max:.14,color:t.color,width:Math.max(1.2,t.width*.24)});}
function updateTelegraphs(dt){for(const t of state.entities.telegraphs){if(!validTelegraph(t)){if(t)t.invalid=true;continue;}t.life-=dt;if(t.life<=0&&!t.triggered){t.triggered=true;if(t.cosmetic){triggerCosmeticTelegraph(t);continue;}if(t.type==='circle'){triggerCircleImpact(t);if((t.damage||0)>0&&Math.hypot(player.x-t.x,player.y-t.y)<t.r+player.r&&player.invuln<=0)hurtPlayer(t.damage,t);}else{const x2=t.x+Math.cos(t.a)*t.length,y2=t.y+Math.sin(t.a)*t.length;if(t.impactStyle==='null-grid')triggerNullGridImpact(t,x2,y2);else triggerLineImpact(t,x2,y2);if((t.damage||0)>0&&lineDistance(player.x,player.y,t.x,t.y,x2,y2)<t.width*.55+player.r&&player.invuln<=0)hurtPlayer(t.damage,t);}}}compactInPlace(state.entities.telegraphs,t=>validTelegraph(t)&&!t.invalid&&t.life>-.28);trimOldest(state.entities.telegraphs,entityCap('telegraphs'));}
function apexTheme(form){return BOSS_STATS[form]?.theme||'space';}
function cancelWorldEventForApex(){window.cancelMapEventForApex?.();document.querySelector('#worldEventScreen')?.classList.add('hidden');state.entities.mapEvents?.splice(0);state.mapEventActive=null;if(state.eventClocks){state.eventClocks.vault=Math.max(state.eventClocks.vault||0,80);state.eventClocks.crash=Math.max(state.eventClocks.crash||0,130);state.eventClocks.void=Math.max(state.eventClocks.void||0,205);}if(state.mode==='worldEvent')state.mode='playing';}
function forceApexPriority(){
  if(['menu','gameover'].includes(state.mode))return false;
  if(state.mode==='choice'){const first=ui.choiceCards?.querySelector('button:not(:disabled)');first?.click();ui.choice.classList.add('hidden');}
  if(state.mode==='bossReward'){document.querySelector('#rewardCards button:not(:disabled)')?.click();document.querySelector('#bossRewardScreen')?.classList.add('hidden');document.querySelector('#apexRewardScreen')?.classList.add('hidden');}
  closeAbilityLedger?.(true);document.querySelector('#settingsScreen')?.classList.add('hidden');ui.pauseScreen?.classList.add('hidden');ui.touch.classList.add('hidden');
  cancelWorldEventForApex();clearPendingCombatActions();if(state.realmTransition&&!String(state.realmTransition.to||'').startsWith('apex-'))cancelRealmTransition('space');
  state.mode='playing';return true;
}
function clearFieldForApex(form){
  cancelWorldEventForApex();const visible=state.entities.enemies.filter(e=>!e.dead).slice(0,36),cx=player.x,cy=player.y;state.entities.enemies.length=0;state.entities.enemyProjectiles.length=0;state.entities.telegraphs.length=0;state.entities.projectiles.length=0;state.entities.curves?.splice(0);state.entities.beams?.splice(0);state.entities.wells.length=0;
  for(const [i,e]of visible.entries()){const color=form==='chronophage'?'#79ffe1':form==='starforge'?'#ff9a36':'#b7c9ff';if(form==='starforge')state.entities.beams.push({x1:e.x,y1:e.y,x2:cx,y2:cy,life:1.15+i*.012,max:1.15+i*.012,color,width:e.type==='boss'?5:2});else if(form==='lastconstellation'&&i%2===0)state.entities.beams.push({x1:e.x,y1:e.y,x2:cx+Math.cos(i)*180,y2:cy+Math.sin(i)*180,life:.9,max:.9,color,width:1.5});spawnParticle(e.x,e.y,color,e.type==='boss'?18:e.type==='mini'?12:5,e.type==='boss'?260:150,e.type==='boss'?7:4);shockwave(e.x,e.y,color,e.type==='boss'?135:58,.34,e.type==='boss'?5:2);}
  state.bossActiveId=null;ui.bossBar.classList.add('hidden');state.camera.shake=form==='starforge'?12:7;state.flash=form==='lastconstellation'?.18:.10;
}
function beginApexEncounter(){
  if(state.apexActiveId||state.pendingApexForm)return false;if(state.realmTransition)cancelRealmTransition('space');const form=bossBag('apex');state.pendingApexForm=form;forceApexPriority();clearFieldForApex(form);const radius=compactDevice()?318:486,apexArena={x:player.x,y:player.y,r:radius,form,createdAt:state.time||0};const title=bossName(form),duration=form==='starforge'?3.75:form==='chronophage'?3.35:3.55;
  startRealmTransition(apexTheme(form),{duration,title,apex:true,form,owner:'apex-entry',subtitle:form==='chronophage'?'CHRONOLOGY OVERRIDDEN':form==='starforge'?'TERMINAL FURNACE IGNITION':'THE SKY FORGETS ITS NAME',introStyle:form,onMidpoint:()=>{const arena=state.apexArena;if(!arena){state.pendingApexForm=null;cancelRealmTransition('space');return;}const e=spawnEnemy('apex');if(!e){state.pendingApexForm=null;state.nextApexAt=(state.time||0)+30;cancelRealmTransition('space');return;}e.eliteForm=form;e.apexForm=form;e.name=title;e.color=BOSS_STATS[form].color;e.timeLock=0;e.apexElapsed=0;if(form==='starforge'){e.speed=0;e.x=arena.x;e.y=arena.y-arena.r*.24;}else if(form==='chronophage'){e.speed*=.82;e.x=arena.x+arena.r*.24;e.y=arena.y-arena.r*.10;}else{e.speed=Math.max(72,e.speed*1.65);e.x=arena.x-arena.r*.42;e.y=arena.y;}state.apexActiveId=e.id;state.apexCount++;state.nextApexAt=(state.apexCount+1)*APEX_INTERVAL_SECONDS;},onComplete:()=>{state.pendingApexForm=null;stabilizeRealmTheme(apexTheme(form));}});state.apexArena=apexArena;return true;
}
function updateApexSystems(dt=0,priorityOnly=false){
  state.apexBoonTimers=state.apexBoonTimers||{chrono:24,forge:18,constellation:12};if(!priorityOnly&&dt>0&&state.mode==='playing'){
    const chronoStacks=state.apexBoons?.chronophage||0;if(chronoStacks){state.apexBoonTimers.chrono-=dt;if(state.apexBoonTimers.chrono<=0){state.apexBoonTimers.chrono=Math.max(14,30-chronoStacks*3);const radius=280+chronoStacks*45,normalLock=1.45+chronoStacks*.38,bossLock=.5+chronoStacks*.16;shockwave(player.x,player.y,'#79ffe1',radius,.68,4+chronoStacks*.4);for(const e of state.entities.enemies)if(!e.dead&&e.kind!=='apex'&&Math.hypot(e.x-player.x,e.y-player.y)<radius)e.timeLock=Math.max(e.timeLock||0,e.type==='boss'?bossLock:normalLock);}}
    const forgeStacks=state.apexBoons?.starforge||0;if(forgeStacks){state.apexBoonTimers.forge-=dt;if(state.apexBoonTimers.forge<=0){state.apexBoonTimers.forge=Math.max(10,22-forgeStacks*2);const radius=205+forgeStacks*28,damage=(34+state.level*1.7)*(1+(forgeStacks-1)*.34);areaDamage(player.x,player.y,radius,damage,'#ffb04e');for(let i=0;i<Math.min(12,4+forgeStacks*2);i++){const a=i/Math.min(12,4+forgeStacks*2)*TAU;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*470,vy:Math.sin(a)*470,r:5+forgeStacks*.4,life:1.1,maxRange:430,damage:damage*.36,color:'#ffd77e',pierce:1+Math.floor(forgeStacks/2),source:'apex-forge'});}}}
    const constellationStacks=state.apexBoons?.lastconstellation||0;if(constellationStacks){state.apexBoonTimers.constellation-=dt;if(state.apexBoonTimers.constellation<=0){state.apexBoonTimers.constellation=Math.max(7,13-constellationStacks*1.25);const cap=90+constellationStacks*28,gain=16+constellationStacks*10;player.shield=Math.min(cap,player.shield+gain);shockwave(player.x,player.y,'#b7c9ff',135+constellationStacks*18,.48,4);}}
  }
  if(state.apexActiveId||state.pendingApexForm||String(state.realmTransition?.to||'').startsWith('apex-'))return true;const due=(state.time||0)>=(state.nextApexAt||APEX_INTERVAL_SECONDS);if(!due)return false;if(!forceApexPriority())return false;const started=beginApexEncounter();if(started&&!state.apexArena){const form=state.pendingApexForm||'chronophage';state.apexArena={x:player.x,y:player.y,r:compactDevice()?318:486,form,createdAt:state.time||0};}return started;
}
function applyApexReward(form){state.apexBoons=state.apexBoons||{};const stack=(state.apexBoons[form]||0)+1;state.apexBoons[form]=stack;if(form==='chronophage'){state.passives.haste=Math.min(PASSIVES.haste.max,stat('haste')+2);state.apexBoonTimers.chrono=Math.min(state.apexBoonTimers.chrono||24,5);}else if(form==='starforge'){state.passives.power=Math.min(PASSIVES.power.max,stat('power')+2);if(PASSIVES.projectileSize)state.passives.projectileSize=Math.min(PASSIVES.projectileSize.max,stat('projectileSize')+1);state.apexBoonTimers.forge=Math.min(state.apexBoonTimers.forge||18,4);}else{state.passives.armor=Math.min(PASSIVES.armor.max,stat('armor')+1);player.maxHp=Math.round(player.maxHp*1.12);player.hp=player.maxHp;player.shield=Math.max(player.shield,30+stack*8);state.apexBoonTimers.constellation=Math.min(state.apexBoonTimers.constellation||12,3);}ui.resonanceTitle.textContent=`${bossName(form)} · ${stack}중첩`;ui.resonanceDesc.textContent=form==='chronophage'?'시간 정지 강화와 가속 회로 2중첩.':form==='starforge'?'항성 폭발 강화와 출력 증폭 2중첩.':'성좌 방벽 강화와 최대 체력·방어 상승.';ui.resonance.classList.remove('hidden');scheduleUiAction(3200,()=>ui.resonance.classList.add('hidden'));renderLoadout();updateHUD();}

function finishApexEncounter(enemy){
  if(!enemy||state.apexExitPending)return;state.apexExitPending=true;const form=enemy.apexForm||enemy.eliteForm||'chronophage';state.apexActiveId=null;state.pendingApexForm=null;state.entities.enemyProjectiles.length=0;state.entities.telegraphs.length=0;state.entities.beams.length=0;state.apexArena=null;startRealmTransition('space',{duration:2.45,owner:'apex-exit',title:GAME_SETTINGS.language==='ko'?'초월체 격파':'APEX VANQUISHED',subtitle:'REALSPACE RESTORED',onComplete:()=>{stabilizeRealmTheme('space');state.apexExitPending=false;if(typeof openApexRewardSelection==='function')openApexRewardSelection(form);else applyApexReward(form);}});
}
function handleAnyEnemyKill(enemy){const stacks=state.apexBoons?.starforge||0;if(stacks&&state.combo>0&&state.combo%Math.max(12,30-stacks*4)===0)areaDamage(enemy.x,enemy.y,125+stacks*12,(24+state.level*1.4)*(1+stacks*.22),'#ffb04e');}
function handleEliteDeath(enemy){if(!enemy)return;if(enemy.kind==='void'||enemy.eventKind==='void'){window.handleVoidBossDefeated?.();return;}if(enemy.kind==='apex'){finishApexEncounter(enemy);}}
