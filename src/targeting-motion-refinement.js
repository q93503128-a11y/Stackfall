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

  const baseDrawPlayer=drawPlayer;
  drawPlayer=function drawPlayerWithManualAim(){
    baseDrawPlayer();
    if(GAME_SETTINGS.manualAim!==true||!state.input.aimActive||state.mode!=='playing')return;
    const dx=state.input.aimWorldX-player.x,dy=state.input.aimWorldY-player.y,d=Math.hypot(dx,dy);if(d<3)return;
    const a=Math.atan2(dy,dx),cx=vw/2,cy=vh/2,start=32,end=68,head=10;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.lineCap='round';ctx.shadowBlur=12;ctx.shadowColor='#8fffe7';ctx.strokeStyle='rgba(143,255,231,.82)';ctx.fillStyle='rgba(221,255,249,.94)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(start,0);ctx.lineTo(end,0);ctx.stroke();ctx.beginPath();ctx.moveTo(end+5,0);ctx.lineTo(end-head,-head*.62);ctx.lineTo(end-head,head*.62);ctx.closePath();ctx.fill();ctx.globalAlpha=.48;ctx.beginPath();ctx.arc(end+8,0,4,0,TAU);ctx.stroke();ctx.restore();
  };

  updateGems=function acceleratedMagnetGems(dt){const range=Math.max(24,Number(magnetRange())||74),magnetStacks=stat('magnet'),eventMagnet=state.nebulaBoosts?.magnet||0,pullSpeed=1+magnetStacks*.22+eventMagnet*.10,gems=state.entities.gems;for(const g of gems){if(!g||!Number.isFinite(g.x)||!Number.isFinite(g.y)){if(g)g.life=0;continue;}g.life=Number.isFinite(g.life)?g.life-dt:0;g.pulse=Number.isFinite(g.pulse)?g.pulse+dt*5:dt*5;g.vx=Number.isFinite(g.vx)?g.vx:0;g.vy=Number.isFinite(g.vy)?g.vy:0;g.r=Number.isFinite(g.r)?clamp(g.r,2,14):4;g.value=Number.isFinite(g.value)?Math.max(0,g.value):0;g.x+=g.vx*dt;g.y+=g.vy*dt;g.vx*=Math.pow(.04,dt);g.vy*=Math.pow(.04,dt);const dx=player.x-g.x,dy=player.y-g.y,d=Math.hypot(dx,dy)||1;if(d<range){const force=(270+(range-d)*(7.5+magnetStacks*.55))*pullSpeed;g.vx+=dx/d*force*dt;g.vy+=dy/d*force*dt;}if(d<player.r+10){g.life=0;gainXp(g.value*xpMult());audio.pickup();spawnParticle(g.x,g.y,COLORS.cyan,3,70,2);}}compactInPlace(gems,g=>g&&g.life>0);};

  const baseUpdateMapEvents=window.updateMapEvents;
  if(typeof baseUpdateMapEvents==='function')window.updateMapEvents=updateMapEvents=function vaultDuringEliteEncounters(dt){const elites=state.entities.enemies.filter(enemy=>enemy&&!enemy.dead&&(enemy.type==='mini'||enemy.type==='boss')),markerVault=state.entities.mapEvents?.some(marker=>!marker.consumed&&marker.type==='vault'),now=state.time||0,vaultDue=!state.mapEventActive&&!state.entities.mapEvents?.length&&(state.eventGlobalCooldown||0)<=0&&(state.eventClocks?.vault||0)<=0&&now>=(state.eventBlockedUntil?.vault||0)&&state.lastMapEventType!=='vault';if(!elites.length||(!markerVault&&!vaultDue))return baseUpdateMapEvents(dt);const types=elites.map(enemy=>enemy.type),crash=state.eventClocks?.crash,voidClock=state.eventClocks?.void;for(const enemy of elites)enemy.type='vault-elite';if(vaultDue&&state.eventClocks){state.eventClocks.crash=Infinity;state.eventClocks.void=Infinity;}try{return baseUpdateMapEvents(dt);}finally{elites.forEach((enemy,index)=>enemy.type=types[index]);if(vaultDue&&state.eventClocks){state.eventClocks.crash=Number.isFinite(crash)?crash-dt:crash;state.eventClocks.void=Number.isFinite(voidClock)?voidClock-dt:voidClock;}}};

  drawMagnetField=function differentiatedMagnetField(){
    const x=vw/2,y=vh/2,r=magnetRange(),stacks=stat('magnet'),t=performance.now();
    const rgb=stacks>0?'255,204,92':'104,220,255';ctx.save();
    const fill=ctx.createRadialGradient(x,y,player.r+10,x,y,r);fill.addColorStop(0,`rgba(${rgb},.055)`);fill.addColorStop(.68,`rgba(${rgb},.025)`);fill.addColorStop(1,`rgba(${rgb},.008)`);
    ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.shadowBlur=12;ctx.shadowColor=`rgba(${rgb},.55)`;
    ctx.setLineDash([5,9]);ctx.lineDashOffset=-(t*.0153)%14;ctx.lineWidth=1.65;ctx.strokeStyle=`rgba(${rgb},${stacks>0?.58:.38})`;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
    ctx.setLineDash([1,13]);ctx.lineDashOffset=(t*.0107)%14;ctx.lineWidth=1;ctx.strokeStyle=`rgba(${rgb},${stacks>0?.33:.23})`;ctx.beginPath();ctx.arc(x,y,r-8,0,TAU);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<6;i++){const a=t*.00071+i*TAU/6,rr=r;ctx.fillStyle=`rgba(${rgb},${stacks>0?.88:.62})`;ctx.beginPath();ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr,stacks>0?2.4:1.8,0,TAU);ctx.fill();}
    ctx.restore();
  };

  drawDefenseBarrier=function differentiatedDefenseBarrier(){
    const bulwarkN=weaponCount('bulwark'),defense=bulwarkN>0||stat('armor')>0||player.shield>0;if(!defense)return;
    const x=vw/2,y=vh/2,t=performance.now(),cap=Math.max(1,typeof shieldCapacity==='function'?shieldCapacity():Math.max(1,player.shield||1)),ratio=clamp((player.shield||0)/cap,0,1),strength=player.shield>0?1:.48,radius=player.r+25+Math.sin(t*.0021)*1.5,plateCount=bulwarkN>=5?8:bulwarkN>=3?7:6;
    ctx.save();ctx.translate(x,y);
    ctx.globalAlpha=.14+.18*strength;ctx.strokeStyle='#74f2a7';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,radius+5,0,TAU);ctx.stroke();
    ctx.globalAlpha=.42+.30*strength;ctx.lineWidth=1.2;ctx.setLineDash([6,9]);ctx.lineDashOffset=-t*.012;ctx.beginPath();ctx.arc(0,0,radius-8,0,TAU);ctx.stroke();ctx.setLineDash([]);
    const rotation=t*.00022;
    for(let i=0;i<plateCount;i++){
      const a=rotation+i*TAU/plateCount,rr=radius+2+(i%2?2:-1),w=13+(bulwarkN>=4?2:0),h=8+(bulwarkN>=6?2:0);
      ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(a+Math.PI/2);
      ctx.globalAlpha=.72+.22*ratio;ctx.fillStyle='rgba(18,50,62,.92)';ctx.strokeStyle=player.shield>0?'#bffff0':'#65bb91';ctx.lineWidth=1.35;
      ctx.beginPath();ctx.moveTo(-w,-h*.55);ctx.lineTo(w*.58,-h);ctx.lineTo(w,0);ctx.lineTo(w*.58,h);ctx.lineTo(-w,h*.55);ctx.lineTo(-w*1.18,0);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.globalAlpha=.55+.35*ratio;ctx.strokeStyle='#eafff7';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-w*.55,0);ctx.lineTo(w*.35,0);ctx.lineTo(w*.62,-h*.28);ctx.moveTo(w*.35,0);ctx.lineTo(w*.62,h*.28);ctx.stroke();ctx.restore();
    }
    ctx.rotate(-t*.00031);ctx.globalAlpha=.28+.26*strength;ctx.strokeStyle='#b5ffe5';ctx.lineWidth=1.1;
    for(let i=0;i<3;i++){const a=i*TAU/3;ctx.beginPath();ctx.arc(0,0,radius-15,a+.20,a+TAU/3-.20);ctx.stroke();}
    if(player.shield>0){ctx.rotate(t*.00048);ctx.globalAlpha=.22+.22*ratio;ctx.fillStyle='#dffff5';for(let i=0;i<4;i++){const a=i*TAU/4,rr=radius-12;ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(a);ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-2.5);ctx.lineTo(-1,0);ctx.lineTo(-3,2.5);ctx.closePath();ctx.fill();ctx.restore();}}
    ctx.setLineDash([]);ctx.restore();
  };

  applyLanguage();syncSettingsControls();renderLoadout();updateHUD();
})();