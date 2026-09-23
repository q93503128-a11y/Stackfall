(function(){
  if(!PASSIVES.projectileSpeed){
    PASSIVES.projectileSpeed={name:'광자 가속기',icon:'➟',color:'#86dfff',desc:'투사체 속도 +10%, 공전형 장비 회전속도 +8%',max:6};
  }
  PASSIVE_TEXT.projectileSpeed={
    ko:['광자 가속기','투사체 속도 +10%, 공전형 장비 회전속도 +8%'],
    en:['Photon Accelerator','Projectile speed +10%, orbiting equipment rotation speed +8%'],
    ja:['光子加速器','投射物速度+10%、周回装備回転速度+8%'],
    'zh-CN':['光子加速器','投射物速度+10%，环绕装备旋转速度+8%'],
    es:['Acelerador Fotónico','Velocidad de proyectiles +10% y rotación orbital +8%'],
    fr:['Accélérateur Photonique','Vitesse des projectiles +10 % et rotation orbitale +8 %']
  };

  PASSIVES.magnet.desc='결정 흡수 범위 +34, 끌어오는 속도 증가.';
  PASSIVE_TEXT.magnet={
    ko:['자석 코어','결정 흡수 범위 +34, 끌어오는 속도 증가.'],
    en:['Magnet Core','Pickup range +34 and faster attraction.'],
    ja:['マグネットコア','回収範囲+34、吸引速度上昇。'],
    'zh-CN':['磁力核心','拾取范围+34，吸引速度提升。'],
    es:['Núcleo Magnético','Alcance de recogida +34 y atracción más rápida.'],
    fr:['Noyau Magnétique','Portée de collecte +34 et attraction accélérée.']
  };

  try{const saved=JSON.parse(localStorage.getItem('stackfall.settings')||'{}');GAME_SETTINGS.manualAim=saved.manualAim===true;}catch{GAME_SETTINGS.manualAim=false;}
  const manualAimText={ko:'수동 조준',en:'Manual aim',ja:'手動照準','zh-CN':'手动瞄准',es:'Apuntado manual',fr:'Visée manuelle'};
  for(const[code,text]of Object.entries(manualAimText))if(TEXT[code])TEXT[code]['settings.manualAim']=text;
  let manualAim=document.querySelector('#manualAim');
  if(!manualAim){
    const close=document.querySelector('#settingsCloseBtn'),row=document.createElement('label');row.className='settings-row';row.innerHTML='<span data-i18n="settings.manualAim">수동 조준</span><input id="manualAim" type="checkbox"><i></i>';close?.before(row);manualAim=row.querySelector('input');
  }
  const baseSyncSettings=syncSettingsControls;
  syncSettingsControls=function syncSettingsWithManualAim(){baseSyncSettings();if(manualAim)manualAim.checked=GAME_SETTINGS.manualAim===true;};
  manualAim?.addEventListener('change',()=>{GAME_SETTINGS.manualAim=manualAim.checked;saveGameSettings();if(!GAME_SETTINGS.manualAim)state.input.aimActive=false;audio.pickup();});

  state.input.aimActive=false;state.input.aimWorldX=player.x;state.input.aimWorldY=player.y;
  const canvasAimPoint=event=>{const rect=canvas.getBoundingClientRect(),sx=(event.clientX-rect.left)/Math.max(1,rect.width)*vw,sy=(event.clientY-rect.top)/Math.max(1,rect.height)*vh;state.input.aimWorldX=player.x+sx-vw/2;state.input.aimWorldY=player.y+sy-vh/2;state.input.aimActive=event.pointerType!=='touch';if(GAME_SETTINGS.manualAim===true&&state.input.aimActive){const dx=state.input.aimWorldX-player.x,dy=state.input.aimWorldY-player.y;if(Math.hypot(dx,dy)>2)player.facingAngle=Math.atan2(dy,dx);}};
  canvas.addEventListener('pointermove',canvasAimPoint,{passive:true});
  canvas.addEventListener('pointerdown',canvasAimPoint,{passive:true});
  canvas.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')state.input.aimActive=false;},{passive:true});

  function targetCandidates(x,y,range,predicate){const rr=range*range,out=[];for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||predicate&&!predicate(enemy))continue;const dx=enemy.x-x,dy=enemy.y-y,d2=dx*dx+dy*dy;if(d2<=rr)out.push({enemy,d2});}return out;}
  function manualTarget(key,x,y,predicate){if(GAME_SETTINGS.manualAim!==true||!state.input.aimActive)return null;const range=weaponRange(key),ax=state.input.aimWorldX,ay=state.input.aimWorldY,candidates=targetCandidates(x,y,range,predicate);let best=null,bestScore=Infinity;for(const row of candidates){const cursorD2=(row.enemy.x-ax)**2+(row.enemy.y-ay)**2,score=cursorD2+row.d2*.002;if(score<bestScore){bestScore=score;best=row.enemy;}}return best;}
  function farthestWeaponTarget(key,x=player.x,y=player.y,predicate=null){const manual=manualTarget(key,x,y,predicate);if(manual)return manual;let best=null,bestD2=-1;for(const row of targetCandidates(x,y,weaponRange(key),predicate))if(row.d2>bestD2){bestD2=row.d2;best=row.enemy;}return best;}
  window.farthestWeaponTarget=farthestWeaponTarget;
  const baseNearestWeaponTarget=nearestWeaponTarget;
  nearestWeaponTarget=function refinedWeaponTarget(key,x=player.x,y=player.y,predicate=null){const manual=manualTarget(key,x,y,predicate);if(manual)return manual;if(key==='arc')return farthestWeaponTarget(key,x,y,predicate);return baseNearestWeaponTarget(key,x,y,predicate);};

  const TARGETING_RASTER_CACHE=new Map();
  function targetingRaster(key,size,painter){return cachedRasterSurface(TARGETING_RASTER_CACHE,key,size,painter,40);}
  function manualAimRaster(){return targetingRaster('manual-aim',128,(g,sz)=>{const c=sz/2,start=12,end=48,head=10;g.save();g.translate(c,c);g.lineCap='round';g.shadowBlur=12;g.shadowColor='#8fffe7';g.strokeStyle='rgba(143,255,231,.82)';g.fillStyle='rgba(221,255,249,.94)';g.lineWidth=2;g.beginPath();g.moveTo(start,0);g.lineTo(end,0);g.stroke();g.beginPath();g.moveTo(end+5,0);g.lineTo(end-head,-head*.62);g.lineTo(end-head,head*.62);g.closePath();g.fill();g.globalAlpha=.48;g.beginPath();g.arc(end+8,0,4,0,TAU);g.stroke();g.restore();});}
  function refinedMagnetRaster(r,active){const size=Math.ceil((r+22)*2),rgb=active?'255,204,92':'104,220,255';return targetingRaster(`magnet:${Math.round(r)}:${active?1:0}`,size,(g,sz)=>{const c=sz/2,fill=g.createRadialGradient(c,c,player.r+10,c,c,r);fill.addColorStop(0,`rgba(${rgb},.055)`);fill.addColorStop(.68,`rgba(${rgb},.025)`);fill.addColorStop(1,`rgba(${rgb},.008)`);g.fillStyle=fill;g.beginPath();g.arc(c,c,r,0,TAU);g.fill();g.shadowBlur=12;g.shadowColor=`rgba(${rgb},.55)`;g.setLineDash([5,9]);g.lineWidth=1.65;g.strokeStyle=`rgba(${rgb},${active?.58:.38})`;g.beginPath();g.arc(c,c,r,0,TAU);g.stroke();g.setLineDash([1,13]);g.lineWidth=1;g.strokeStyle=`rgba(${rgb},${active?.33:.23})`;g.beginPath();g.arc(c,c,r-8,0,TAU);g.stroke();g.setLineDash([]);for(let i=0;i<6;i++){const a=i*TAU/6;g.fillStyle=`rgba(${rgb},${active?.88:.62})`;g.beginPath();g.arc(c+Math.cos(a)*r,c+Math.sin(a)*r,active?2.4:1.8,0,TAU);g.fill();}g.restore?.();});}
  function barrierRaster(bulwarkN,shielded,ratio){const plateCount=bulwarkN>=5?8:bulwarkN>=3?7:6,ratioBucket=Math.round(clamp(ratio,0,1)*4),size=144,radius=player.r+25,strength=shielded?1:.48;return targetingRaster(`barrier:${bulwarkN}:${shielded?1:0}:${ratioBucket}`,size,(g,sz)=>{const c=sz/2,r=ratioBucket/4;g.save();g.translate(c,c);g.globalAlpha=.14+.18*strength;g.strokeStyle='#74f2a7';g.lineWidth=6;g.beginPath();g.arc(0,0,radius+5,0,TAU);g.stroke();g.globalAlpha=.42+.30*strength;g.lineWidth=1.2;g.setLineDash([6,9]);g.beginPath();g.arc(0,0,radius-8,0,TAU);g.stroke();g.setLineDash([]);for(let i=0;i<plateCount;i++){const a=i*TAU/plateCount,rr=radius+2+(i%2?2:-1),w=13+(bulwarkN>=4?2:0),h=8+(bulwarkN>=6?2:0);g.save();g.translate(Math.cos(a)*rr,Math.sin(a)*rr);g.rotate(a+Math.PI/2);g.globalAlpha=.72+.22*r;g.fillStyle='rgba(18,50,62,.92)';g.strokeStyle=shielded?'#bffff0':'#65bb91';g.lineWidth=1.35;g.beginPath();g.moveTo(-w,-h*.55);g.lineTo(w*.58,-h);g.lineTo(w,0);g.lineTo(w*.58,h);g.lineTo(-w,h*.55);g.lineTo(-w*1.18,0);g.closePath();g.fill();g.stroke();g.globalAlpha=.55+.35*r;g.strokeStyle='#eafff7';g.lineWidth=.8;g.beginPath();g.moveTo(-w*.55,0);g.lineTo(w*.35,0);g.lineTo(w*.62,-h*.28);g.moveTo(w*.35,0);g.lineTo(w*.62,h*.28);g.stroke();g.restore();}g.globalAlpha=.28+.26*strength;g.strokeStyle='#b5ffe5';g.lineWidth=1.1;for(let i=0;i<3;i++){const a=i*TAU/3;g.beginPath();g.arc(0,0,radius-15,a+.20,a+TAU/3-.20);g.stroke();}if(shielded){g.globalAlpha=.22+.22*r;g.fillStyle='#dffff5';for(let i=0;i<4;i++){const a=i*TAU/4,rr=radius-12;g.save();g.translate(Math.cos(a)*rr,Math.sin(a)*rr);g.rotate(a);g.beginPath();g.moveTo(4,0);g.lineTo(-3,-2.5);g.lineTo(-1,0);g.lineTo(-3,2.5);g.closePath();g.fill();g.restore();}}g.restore();});}
  const baseDrawPlayer=drawPlayer;
  drawPlayer=function drawPlayerWithManualAim(){
    baseDrawPlayer();if(GAME_SETTINGS.manualAim!==true||!state.input.aimActive||state.mode!=='playing')return;
    const dx=state.input.aimWorldX-player.x,dy=state.input.aimWorldY-player.y,d=Math.hypot(dx,dy);if(d<3)return;const a=Math.atan2(dy,dx),image=manualAimRaster();ctx.save();ctx.translate(vw/2, vh/2);ctx.rotate(a);ctx.drawImage(image,-64,-64,128,128);ctx.restore();
  };

  updateGems=function acceleratedMagnetGems(dt){const range=Math.max(24,Number(magnetRange())||74),magnetStacks=stat('magnet'),eventMagnet=state.nebulaBoosts?.magnet||0,pullSpeed=1+magnetStacks*.22+eventMagnet*.10,gems=state.entities.gems;for(const g of gems){if(!g||!Number.isFinite(g.x)||!Number.isFinite(g.y)){if(g)g.life=0;continue;}g.life=Number.isFinite(g.life)?g.life-dt:0;g.pulse=Number.isFinite(g.pulse)?g.pulse+dt*5:dt*5;g.vx=Number.isFinite(g.vx)?g.vx:0;g.vy=Number.isFinite(g.vy)?g.vy:0;g.r=Number.isFinite(g.r)?clamp(g.r,2,14):4;g.value=Number.isFinite(g.value)?Math.max(0,g.value):0;g.x+=g.vx*dt;g.y+=g.vy*dt;g.vx*=Math.pow(.04,dt);g.vy*=Math.pow(.04,dt);const dx=player.x-g.x,dy=player.y-g.y,d=Math.hypot(dx,dy)||1;if(d<range){const force=(270+(range-d)*(7.5+magnetStacks*.55))*pullSpeed;g.vx+=dx/d*force*dt;g.vy+=dy/d*force*dt;}if(d<player.r+10){g.life=0;gainXp(g.value*xpMult());audio.pickup();spawnParticle(g.x,g.y,COLORS.cyan,3,70,2);}}compactInPlace(gems,g=>g&&g.life>0);};

  const baseUpdateMapEvents=window.updateMapEvents,VAULT_ELITE_BUFFER=[],VAULT_ELITE_TYPE_BUFFER=[];
  if(typeof baseUpdateMapEvents==='function')window.updateMapEvents=updateMapEvents=function vaultDuringEliteEncounters(dt){const elites=VAULT_ELITE_BUFFER,types=VAULT_ELITE_TYPE_BUFFER;elites.length=0;types.length=0;for(const enemy of state.entities.enemies)if(enemy&&!enemy.dead&&(enemy.type==='mini'||enemy.type==='boss')){elites.push(enemy);types.push(enemy.type);}const markerVault=state.entities.mapEvents?.some(marker=>!marker.consumed&&marker.type==='vault'),now=state.time||0,vaultDue=!state.mapEventActive&&!state.entities.mapEvents?.length&&(state.eventGlobalCooldown||0)<=0&&(state.eventClocks?.vault||0)<=0&&now>=(state.eventBlockedUntil?.vault||0)&&state.lastMapEventType!=='vault';if(!elites.length||(!markerVault&&!vaultDue))return baseUpdateMapEvents(dt);const crash=state.eventClocks?.crash,voidClock=state.eventClocks?.void;for(const enemy of elites)enemy.type='vault-elite';if(vaultDue&&state.eventClocks){state.eventClocks.crash=Infinity;state.eventClocks.void=Infinity;}try{return baseUpdateMapEvents(dt);}finally{for(let i=0;i<elites.length;i++)elites[i].type=types[i];if(vaultDue&&state.eventClocks){state.eventClocks.crash=Number.isFinite(crash)?crash-dt:crash;state.eventClocks.void=Number.isFinite(voidClock)?voidClock-dt:voidClock;}}};

  drawMagnetField=function differentiatedMagnetField(){const x=vw/2,y=vh/2,r=magnetRange(),active=stat('magnet')>0,t=performance.now(),image=refinedMagnetRaster(r,active),size=image.width||Math.ceil((r+22)*2);ctx.save();ctx.translate(x,y);ctx.rotate(t*.00071);ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();};

  drawDefenseBarrier=function differentiatedDefenseBarrier(){
    const bulwarkN=weaponCount('bulwark'),defense=bulwarkN>0||stat('armor')>0||player.shield>0;if(!defense)return;const t=performance.now(),cap=Math.max(1,typeof shieldCapacity==='function'?shieldCapacity():Math.max(1,player.shield||1)),ratio=clamp((player.shield||0)/cap,0,1),baseRadius=player.r+25,radius=baseRadius+Math.sin(t*.0021)*1.5,image=barrierRaster(bulwarkN,player.shield>0,ratio),scale=radius/baseRadius;ctx.save();ctx.translate(vw/2,vh/2);ctx.rotate(t*.00022);ctx.scale(scale,scale);ctx.drawImage(image,-72,-72,144,144);ctx.restore();
  };

  applyLanguage();syncSettingsControls();renderLoadout();updateHUD();
})();