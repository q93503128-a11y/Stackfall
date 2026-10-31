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

  function manualTarget(key,x,y,predicate){if(GAME_SETTINGS.manualAim!==true||!state.input.aimActive)return null;const range=weaponRange(key),range2=range*range,ax=state.input.aimWorldX,ay=state.input.aimWorldY;let best=null,bestScore=Infinity;for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||predicate&&!predicate(enemy))continue;const dx=enemy.x-x,dy=enemy.y-y,d2=dx*dx+dy*dy;if(d2>range2)continue;const cursorD2=(enemy.x-ax)**2+(enemy.y-ay)**2,score=cursorD2+d2*.002;if(score<bestScore){bestScore=score;best=enemy;}}return best;}
  function farthestWeaponTarget(key,x=player.x,y=player.y,predicate=null){const manual=manualTarget(key,x,y,predicate);if(manual)return manual;const range=weaponRange(key),range2=range*range;let best=null,bestD2=-1;for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||predicate&&!predicate(enemy))continue;const dx=enemy.x-x,dy=enemy.y-y,d2=dx*dx+dy*dy;if(d2<=range2&&d2>bestD2){bestD2=d2;best=enemy;}}return best;}
  window.farthestWeaponTarget=farthestWeaponTarget;
  const baseNearestWeaponTarget=nearestWeaponTarget;
  nearestWeaponTarget=function refinedWeaponTarget(key,x=player.x,y=player.y,predicate=null){const manual=manualTarget(key,x,y,predicate);if(manual)return manual;if(key==='arc')return farthestWeaponTarget(key,x,y,predicate);return baseNearestWeaponTarget(key,x,y,predicate);};

  const TARGETING_RASTER_CACHE=new Map();
  function targetingRaster(key,size,painter){return cachedRasterSurface(TARGETING_RASTER_CACHE,key,size,painter,40);}
  function manualAimRaster(){return targetingRaster('manual-aim',128,(g,sz)=>{const c=sz/2,start=12,end=48,head=10;g.save();g.translate(c,c);g.lineCap='round';g.shadowBlur=12;g.shadowColor='#8fffe7';g.strokeStyle='rgba(143,255,231,.82)';g.fillStyle='rgba(221,255,249,.94)';g.lineWidth=2;g.beginPath();g.moveTo(start,0);g.lineTo(end,0);g.stroke();g.beginPath();g.moveTo(end+5,0);g.lineTo(end-head,-head*.62);g.lineTo(end-head,head*.62);g.closePath();g.fill();g.globalAlpha=.48;g.beginPath();g.arc(end+8,0,4,0,TAU);g.stroke();g.restore();});}
  function refinedMagnetRaster(r,active){const size=Math.ceil((r+22)*2),rgb=active?'255,204,92':'104,220,255';return targetingRaster(`magnet:${Math.round(r)}:${active?1:0}`,size,(g,sz)=>{const c=sz/2,fill=g.createRadialGradient(c,c,player.r+10,c,c,r);fill.addColorStop(0,`rgba(${rgb},.055)`);fill.addColorStop(.68,`rgba(${rgb},.025)`);fill.addColorStop(1,`rgba(${rgb},.008)`);g.fillStyle=fill;g.beginPath();g.arc(c,c,r,0,TAU);g.fill();g.shadowBlur=12;g.shadowColor=`rgba(${rgb},.55)`;g.setLineDash([5,9]);g.lineWidth=1.65;g.strokeStyle=`rgba(${rgb},${active?.58:.38})`;g.beginPath();g.arc(c,c,r,0,TAU);g.stroke();g.setLineDash([1,13]);g.lineWidth=1;g.strokeStyle=`rgba(${rgb},${active?.33:.23})`;g.beginPath();g.arc(c,c,r-8,0,TAU);g.stroke();g.setLineDash([]);for(let i=0;i<6;i++){const a=i*TAU/6;g.fillStyle=`rgba(${rgb},${active?.88:.62})`;g.beginPath();g.arc(c+Math.cos(a)*r,c+Math.sin(a)*r,active?2.4:1.8,0,TAU);g.fill();}g.restore?.();});}
  const baseDrawPlayer=drawPlayer;
  drawPlayer=function drawPlayerWithManualAim(){
    baseDrawPlayer();if(GAME_SETTINGS.manualAim!==true||!state.input.aimActive||state.mode!=='playing')return;
    const dx=state.input.aimWorldX-player.x,dy=state.input.aimWorldY-player.y,d=Math.hypot(dx,dy);if(d<3)return;const a=Math.atan2(dy,dx),image=manualAimRaster();ctx.save();ctx.translate(vw/2, vh/2);ctx.rotate(a);ctx.drawImage(image,-64,-64,128,128);ctx.restore();
  };

  const baseUpdateMapEvents=window.updateMapEvents,VAULT_ELITE_BUFFER=[],VAULT_ELITE_TYPE_BUFFER=[];
  if(typeof baseUpdateMapEvents==='function')window.updateMapEvents=updateMapEvents=function vaultDuringEliteEncounters(dt){const elites=VAULT_ELITE_BUFFER,types=VAULT_ELITE_TYPE_BUFFER;elites.length=0;types.length=0;for(const enemy of state.entities.enemies)if(enemy&&!enemy.dead&&(enemy.type==='mini'||enemy.type==='boss')){elites.push(enemy);types.push(enemy.type);}let markerVault=false;for(const marker of state.entities.mapEvents||[])if(marker&&!marker.consumed&&marker.type==='vault'){markerVault=true;break;}const now=state.time||0,vaultDue=!state.mapEventActive&&!state.entities.mapEvents?.length&&(state.eventGlobalCooldown||0)<=0&&(state.eventClocks?.vault||0)<=0&&now>=(state.eventBlockedUntil?.vault||0)&&state.lastMapEventType!=='vault';if(!elites.length||(!markerVault&&!vaultDue))return baseUpdateMapEvents(dt);const crash=state.eventClocks?.crash,voidClock=state.eventClocks?.void;for(const enemy of elites)enemy.type='vault-elite';if(vaultDue&&state.eventClocks){state.eventClocks.crash=Infinity;state.eventClocks.void=Infinity;}try{return baseUpdateMapEvents(dt);}finally{for(let i=0;i<elites.length;i++)elites[i].type=types[i];if(vaultDue&&state.eventClocks){state.eventClocks.crash=Number.isFinite(crash)?crash-dt:crash;state.eventClocks.void=Number.isFinite(voidClock)?voidClock-dt:voidClock;}}};

  drawMagnetField=function differentiatedMagnetField(){const x=vw/2,y=vh/2,r=magnetRange(),active=stat('magnet')>0,t=performance.now(),image=refinedMagnetRaster(r,active),size=image.width||Math.ceil((r+22)*2);ctx.save();ctx.translate(x,y);ctx.rotate(t*.00071);ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();};


  applyLanguage();syncSettingsControls();renderLoadout();updateHUD();
})();