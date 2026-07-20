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
  const canvasAimPoint=event=>{const rect=canvas.getBoundingClientRect(),sx=(event.clientX-rect.left)/Math.max(1,rect.width)*vw,sy=(event.clientY-rect.top)/Math.max(1,rect.height)*vh;state.input.aimWorldX=player.x+sx-vw/2;state.input.aimWorldY=player.y+sy-vh/2;state.input.aimActive=event.pointerType!=='touch';};
  canvas.addEventListener('pointermove',canvasAimPoint,{passive:true});
  canvas.addEventListener('pointerdown',canvasAimPoint,{passive:true});
  canvas.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')state.input.aimActive=false;},{passive:true});

  function targetCandidates(x,y,range,predicate){const rr=range*range,out=[];for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||predicate&&!predicate(enemy))continue;const dx=enemy.x-x,dy=enemy.y-y,d2=dx*dx+dy*dy;if(d2<=rr)out.push({enemy,d2});}return out;}
  function manualTarget(key,x,y,predicate){if(GAME_SETTINGS.manualAim!==true||!state.input.aimActive)return null;const range=weaponRange(key),ax=state.input.aimWorldX,ay=state.input.aimWorldY,candidates=targetCandidates(x,y,range,predicate);let best=null,bestScore=Infinity;for(const row of candidates){const cursorD2=(row.enemy.x-ax)**2+(row.enemy.y-ay)**2,score=cursorD2+row.d2*.035;if(score<bestScore){bestScore=score;best=row.enemy;}}return best;}
  function farthestWeaponTarget(key,x=player.x,y=player.y,predicate=null){const manual=manualTarget(key,x,y,predicate);if(manual)return manual;let best=null,bestD2=-1;for(const row of targetCandidates(x,y,weaponRange(key),predicate))if(row.d2>bestD2){bestD2=row.d2;best=row.enemy;}return best;}
  window.farthestWeaponTarget=farthestWeaponTarget;
  const baseNearestWeaponTarget=nearestWeaponTarget;
  nearestWeaponTarget=function refinedWeaponTarget(key,x=player.x,y=player.y,predicate=null){const manual=manualTarget(key,x,y,predicate);if(manual)return manual;if(key==='arc')return farthestWeaponTarget(key,x,y,predicate);return baseNearestWeaponTarget(key,x,y,predicate);};

  updateGems=function acceleratedMagnetGems(dt){const range=Math.max(24,Number(magnetRange())||74),magnetStacks=stat('magnet'),eventMagnet=state.nebulaBoosts?.magnet||0,pullSpeed=1+magnetStacks*.22+eventMagnet*.10,gems=state.entities.gems;for(const g of gems){if(!g||!Number.isFinite(g.x)||!Number.isFinite(g.y)){if(g)g.life=0;continue;}g.life=Number.isFinite(g.life)?g.life-dt:0;g.pulse=Number.isFinite(g.pulse)?g.pulse+dt*5:dt*5;g.vx=Number.isFinite(g.vx)?g.vx:0;g.vy=Number.isFinite(g.vy)?g.vy:0;g.r=Number.isFinite(g.r)?clamp(g.r,2,14):4;g.value=Number.isFinite(g.value)?Math.max(0,g.value):0;g.x+=g.vx*dt;g.y+=g.vy*dt;g.vx*=Math.pow(.04,dt);g.vy*=Math.pow(.04,dt);const dx=player.x-g.x,dy=player.y-g.y,d=Math.hypot(dx,dy)||1;if(d<range){const force=(270+(range-d)*(7.5+magnetStacks*.55))*pullSpeed;g.vx+=dx/d*force*dt;g.vy+=dy/d*force*dt;}if(d<player.r+10){g.life=0;gainXp(g.value*xpMult());audio.pickup();spawnParticle(g.x,g.y,COLORS.cyan,3,70,2);}}compactInPlace(gems,g=>g&&g.life>0);};

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
    const defense=weaponCount('bulwark')>0||stat('armor')>0||player.shield>0;if(!defense)return;
    const x=vw/2,y=vh/2,t=performance.now(),strength=player.shield>0?1:.48,radius=player.r+18+Math.sin(t*.0021)*1.7;
    ctx.save();ctx.translate(x,y);ctx.rotate(t*.00019);ctx.strokeStyle=`rgba(116,242,167,${.24+strength*.35})`;
    ctx.lineWidth=player.shield>0?3:1.7;ctx.shadowBlur=player.shield>0?18:8;ctx.shadowColor=COLORS.green;ctx.beginPath();
    for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,px=Math.cos(a)*radius,py=Math.sin(a)*radius;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.closePath();ctx.stroke();if(player.shield>0){ctx.globalAlpha=.20;ctx.fillStyle=COLORS.green;ctx.fill();}ctx.restore();
  };

  applyLanguage();syncSettingsControls();renderLoadout();updateHUD();
})();