(function(){
  const isCompactDevice=()=>matchMedia('(pointer: coarse)').matches||innerWidth<760;
  const enemyCap=()=>isCompactDevice()?80:120;
  const gemCap=()=>isCompactDevice()?100:160;

  const baseSpawnEnemy=spawnEnemy;
  spawnEnemy=function cappedSpawnEnemy(kind='normal'){
    const elites=kind==='mini'||kind==='boss';
    const live=state.entities.enemies.filter(e=>!e.dead);
    const cap=enemyCap(),normalCap=Math.max(24,cap-6);
    if(!elites&&live.length>=normalCap)return null;
    if(elites&&live.length>=cap){
      const removable=live.filter(e=>e.type!=='mini'&&e.type!=='boss')
        .sort((a,b)=>((b.x-player.x)**2+(b.y-player.y)**2)-((a.x-player.x)**2+(a.y-player.y)**2));
      while(state.entities.enemies.filter(e=>!e.dead).length>=cap&&removable.length){
        const e=removable.shift();
        e.dead=true;
      }
      state.entities.enemies=state.entities.enemies.filter(e=>!e.dead);
    }
    return baseSpawnEnemy(kind);
  };

  function compressExperience(){
    const gems=state.entities.gems,cap=gemCap();
    if(!gems||gems.length<=cap)return;
    const keep=gems.slice(0,cap),overflow=gems.slice(cap);
    const total=overflow.reduce((sum,g)=>sum+(Number(g.value)||0),0);
    if(!keep.length){state.entities.gems.length=0;return;}
    const anchors=[...keep].sort((a,b)=>((a.x-player.x)**2+(a.y-player.y)**2)-((b.x-player.x)**2+(b.y-player.y)**2)).slice(0,Math.min(12,keep.length));
    const share=total/anchors.length;
    for(const g of anchors){
      g.value=(Number(g.value)||0)+share;
      g.compressedValue=(g.compressedValue||0)+share;
      g.r=Math.min(10.5,(g.r||4)+Math.log2(1+share)*.26);
      g.pulse=(g.pulse||0)+1.2;
    }
    state.entities.gems.length=0;
    state.entities.gems.push(...keep);
  }

  const baseKillEnemy=killEnemy;
  killEnemy=function cappedGemKill(enemy,opts={}){
    baseKillEnemy(enemy,opts);
    compressExperience();
  };
  const baseUpdateGems=updateGems;
  updateGems=function cappedGemUpdate(dt){
    baseUpdateGems(dt);
    compressExperience();
    updateMapRewards(dt);
  };

  function cubicPoint(a,b,c,d,t){const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};}

  sf2FireArc=function smoothTargetBoomerang(target,stacks,echoed=false){
    target=target&&!target.dead?target:nearestEnemy(player.x,player.y);
    if(!target)return;
    const shots=stacks>=6?3:stacks>=2?2:1,start={x:player.x,y:player.y};
    const base=Math.atan2(target.y-start.y,target.x-start.x),distance=Math.hypot(target.x-start.x,target.y-start.y);
    const dir={x:Math.cos(base),y:Math.sin(base)},normal={x:-dir.y,y:dir.x};
    player.arcSide=(player.arcSide||-1)*-1;
    for(let i=0;i<shots;i++){
      const spread=i-(shots-1)/2,side=shots===1?player.arcSide:(spread===0?player.arcSide:Math.sign(spread));
      const lateral=spread*(34+stacks*4);
      const targetPoint={x:target.x+normal.x*lateral,y:target.y+normal.y*lateral};
      const curve=clamp(210+distance*.22+(stacks>=3?42:0),210,360)*side;
      const passDistance=clamp(125+distance*.20,135,240);
      const passPoint={x:targetPoint.x+dir.x*passDistance,y:targetPoint.y+dir.y*passDistance};
      const approachC1={x:start.x+dir.x*Math.max(85,distance*.25)+normal.x*curve,y:start.y+dir.y*Math.max(85,distance*.25)+normal.y*curve};
      const approachC2={x:targetPoint.x-dir.x*Math.max(58,distance*.16)+normal.x*curve*.42,y:targetPoint.y-dir.y*Math.max(58,distance*.16)+normal.y*curve*.42};
      const passTangent={x:targetPoint.x-approachC2.x,y:targetPoint.y-approachC2.y};
      const passC1={x:targetPoint.x+passTangent.x*.72,y:targetPoint.y+passTangent.y*.72};
      const passC2={x:passPoint.x-dir.x*(passDistance*.22)+normal.x*curve*.08,y:passPoint.y-dir.y*(passDistance*.22)+normal.y*curve*.08};
      const returnAnchor={x:targetPoint.x+dir.x*(passDistance+58+stacks*4),y:targetPoint.y+dir.y*(passDistance+58+stacks*4)};
      const returnDirLen=Math.hypot(start.x-returnAnchor.x,start.y-returnAnchor.y)||1;
      const returnDir={x:(start.x-returnAnchor.x)/returnDirLen,y:(start.y-returnAnchor.y)/returnDirLen};
      const passEndTangent={x:passPoint.x-passC2.x,y:passPoint.y-passC2.y};
      const loopC1={x:passPoint.x+passEndTangent.x*.72,y:passPoint.y+passEndTangent.y*.72};
      const loopC2={x:returnAnchor.x-returnDir.x*(128+stacks*9),y:returnAnchor.y-returnDir.y*(128+stacks*9)};
      const approachLen=Math.max(260,distance+Math.abs(curve)*.65),passLen=passDistance*1.12,loopLen=250+Math.abs(curve)*.60;
      const speed=520+stacks*24;
      state.entities.curves.push({
        stage:'approach',stageTime:0,stageDuration:approachLen/speed,start:{...start},targetPoint,passPoint,returnAnchor,
        approachC1,approachC2,passC1,passC2,loopC1,loopC2,x:start.x,y:start.y,lastX:start.x,lastY:start.y,
        hitIds:new Set(),r:10+stacks*1.15,damage:(18+stacks*5.1)*(echoed?.68:1),color:echoed?COLORS.pink:'#69ffe0',
        trailDamage:stacks>=5,trailCd:0,history:[],stacks,dead:false,returnLife:0,passDuration:passLen/speed,loopDuration:loopLen/speed
      });
    }
  };

  sf2UpdateCurves=function smoothBoomerangUpdate(dt){
    for(const p of state.entities.curves){
      if(p.dead)continue;
      p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;
      if(p.stage==='approach'){
        const t=clamp(p.stageTime/p.stageDuration,0,1),pos=cubicPoint(p.start,p.approachC1,p.approachC2,p.targetPoint,t);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){p.stage='pass';p.stageTime=0;p.stageDuration=p.passDuration;}
      }else if(p.stage==='pass'){
        const t=clamp(p.stageTime/p.stageDuration,0,1),pos=cubicPoint(p.targetPoint,p.passC1,p.passC2,p.passPoint,t);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){p.stage='loop';p.stageTime=0;p.stageDuration=p.loopDuration;}
      }else if(p.stage==='loop'){
        const t=clamp(p.stageTime/p.stageDuration,0,1),pos=cubicPoint(p.passPoint,p.loopC1,p.loopC2,p.returnAnchor,t);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){p.stage='return';p.stageTime=0;p.returnLife=0;p.hitIds.clear();p.history.length=0;}
      }else{
        p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy)||1,speed=690+p.stacks*34;
        p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);
        if(d<player.r+13||p.returnLife>1.8)p.dead=true;
      }
      p.history.push({x:p.x,y:p.y});if(p.history.length>34)p.history.shift();p.trailCd-=dt;
      if(p.trailDamage&&p.trailCd<=0){
        p.trailCd=.11;state.entities.shockwaves.push({x:p.x,y:p.y,r:3,maxR:24+p.stacks*2,life:.20,max:.20,color:'rgba(105,255,224,.46)',width:1.2});
        for(const e of state.entities.enemies)if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+22+p.stacks*2)**2)dealDamage(e,2.2+p.stacks*.85,{color:p.color,source:'arc-trail',canCrit:false});
      }
      for(const e of state.entities.enemies){
        if(e.dead||p.hitIds.has(e.id))continue;
        if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){p.hitIds.add(e.id);dealDamage(e,p.damage,{color:p.color,source:p.stage==='return'?'arc-return':'arc'});shockwave(p.x,p.y,p.color,36+p.stacks*3,.20,2);}
      }
      if(Math.random()<.64)state.entities.particles.push({x:p.x,y:p.y,vx:rand(-15,15),vy:rand(-15,15),life:.30,max:.30,size:rand(1.4,3.2),color:p.color,star:true});
    }
    state.entities.curves=state.entities.curves.filter(p=>!p.dead);
  };

  state.entities.mapRewards=state.entities.mapRewards||[];
  const rewardText={
    ko:{title:'성간 보급소',prompt:'하나를 선택하세요',repair:'성광 수복',repairDesc:'최대 체력 +8, 체력 완전 회복, 보호막 +20'},
    en:{title:'STELLAR CACHE',prompt:'Choose one',repair:'Astral Repair',repairDesc:'Max HP +8, full heal, shield +20'},
    ja:{title:'星間補給所',prompt:'1つ選択',repair:'星光修復',repairDesc:'最大HP+8、全回復、シールド+20'},
    'zh-CN':{title:'星际补给站',prompt:'选择一项',repair:'星光修复',repairDesc:'最大生命+8，完全恢复，护盾+20'},
    es:{title:'DEPÓSITO ESTELAR',prompt:'Elige uno',repair:'Reparación Astral',repairDesc:'Vida máxima +8, curación total, escudo +20'},
    fr:{title:'CACHE STELLAIRE',prompt:'Choisissez-en une',repair:'Réparation Astrale',repairDesc:'PV max +8, soin complet, bouclier +20'}
  };
  const rt=key=>(rewardText[GAME_SETTINGS.language]||rewardText.en)[key];
  const mapOverlay=document.createElement('section');mapOverlay.id='mapRewardScreen';mapOverlay.className='overlay hidden';
  mapOverlay.innerHTML='<div class="map-reward-shell"><div class="choice-head"><p>STAR CACHE</p><h2 id="mapRewardTitle"></h2><span id="mapRewardPrompt"></span></div><div id="mapRewardCards" class="map-reward-cards"></div></div>';
  document.querySelector('#app').appendChild(mapOverlay);
  const css=document.createElement('style');css.textContent=`
    #mapRewardScreen{z-index:66;background:radial-gradient(circle at 50% 45%,rgba(61,118,180,.38),rgba(2,5,16,.94));backdrop-filter:blur(10px)}
    .map-reward-shell{width:min(980px,95vw)}.map-reward-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.map-reward-card{min-height:220px;padding:20px;text-align:left;color:#f7fbff;border:1px solid rgba(154,225,255,.22);border-radius:20px;background:linear-gradient(145deg,rgba(25,43,79,.98),rgba(6,12,29,.99));box-shadow:0 20px 54px rgba(0,0,0,.42);cursor:pointer;transition:.18s}.map-reward-card:hover{transform:translateY(-5px);border-color:#8fe9ff}.map-reward-card b{display:block;font-size:20px;margin:14px 0 8px}.map-reward-card span{font-size:38px;color:#9deeff;text-shadow:0 0 22px rgba(124,232,255,.75)}.map-reward-card p{color:#aebbd8;line-height:1.6;font-size:12px}@media(max-width:720px){.map-reward-cards{grid-template-columns:1fr;max-height:66vh;overflow:auto}.map-reward-card{min-height:135px}}
  `;document.head.appendChild(css);

  function passiveReward(){
    const choices=Object.keys(PASSIVES).filter(k=>stat(k)<PASSIVES[k].max);
    if(!choices.length)return null;
    const key=choices[Math.floor(Math.random()*choices.length)],d=PASSIVES[key],text=PASSIVE_TEXT[key]?.[GAME_SETTINGS.language]||PASSIVE_TEXT[key]?.en||[d.name,d.desc];
    return{icon:d.icon,name:text[0],desc:text[1],apply(){state.passives[key]=(state.passives[key]||0)+1;if(key==='vitality'){player.maxHp+=15;player.hp=Math.min(player.maxHp,player.hp+15);}}};
  }
  function weaponReward(){
    const keys=Object.keys(WEAPONS).filter(k=>k==='core'||weaponCount(k)>0||state.weaponSlots.length<6).filter(k=>weaponCount(k)<6);
    if(!keys.length)return null;
    const key=keys[Math.floor(Math.random()*keys.length)],d=WEAPONS[key],text=WEAPON_TEXT[key]?.[GAME_SETTINGS.language]||WEAPON_TEXT[key]?.en||[d.name,d.role,d.desc];
    return{icon:d.icon,name:text[0],desc:(GAME_SETTINGS.language==='ko'?'중첩 +1. ':'Stack +1. ')+(STACK_EFFECTS[key]?.[weaponCount(key)]?.[1]||text[2]),apply(){if(key!=='core'&&!weaponCount(key)&&state.weaponSlots.length<6)state.weaponSlots.push(key);state.weaponStacks[key]=(state.weaponStacks[key]||0)+1;}};
  }
  function repairReward(){return{icon:'✚',name:rt('repair'),desc:rt('repairDesc'),apply(){player.maxHp+=8;player.hp=player.maxHp;player.shield=Math.min(60,player.shield+20);}};}
  function openMapReward(){
    if(state.mode!=='playing')return;
    state.mode='mapReward';ui.touch.classList.add('hidden');mapOverlay.classList.remove('hidden');
    document.querySelector('#mapRewardTitle').textContent=rt('title');document.querySelector('#mapRewardPrompt').textContent=rt('prompt');
    const rewards=[passiveReward(),weaponReward(),repairReward()].filter(Boolean),cards=document.querySelector('#mapRewardCards');cards.innerHTML='';
    for(const r of rewards){const card=document.createElement('button');card.className='map-reward-card';card.innerHTML=`<span>${r.icon}</span><b>${r.name}</b><p>${r.desc}</p>`;card.onclick=()=>{r.apply();state.entities.mapRewards.length=0;state.mapRewardTimer=rand(68,92);mapOverlay.classList.add('hidden');state.mode='playing';renderLoadout();updateHUD();if(isCompactDevice())ui.touch.classList.remove('hidden');audio.level();};cards.appendChild(card);}
  }
  function spawnMapReward(){
    const a=Math.random()*TAU,d=rand(720,940);state.entities.mapRewards=[{x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,pulse:0}];
  }
  function updateMapRewards(dt){
    if(state.mode!=='playing')return;
    state.mapRewardTimer=(state.mapRewardTimer??48)-dt;
    if(state.mapRewardTimer<=0&&!state.entities.mapRewards.length)spawnMapReward();
    for(const r of state.entities.mapRewards){r.pulse+=dt;if(Math.hypot(r.x-player.x,r.y-player.y)<54+player.r){openMapReward();break;}}
  }
  const baseDrawGems=drawGems;
  drawGems=function drawGemsAndRewards(){
    baseDrawGems();
    for(const r of state.entities.mapRewards){
      const p=worldToScreen(r.x,r.y),on=p.x>60&&p.x<vw-60&&p.y>60&&p.y<vh-60,t=performance.now()/1000;
      if(on){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t*.55);ctx.shadowBlur=26;ctx.shadowColor='#7ce8ff';ctx.strokeStyle='rgba(124,232,255,.88)';ctx.lineWidth=2.2;ctx.beginPath();ctx.rect(-18,-18,36,36);ctx.stroke();ctx.rotate(-t*1.1);ctx.strokeStyle='rgba(194,167,255,.82)';ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(20,0);ctx.lineTo(0,28);ctx.lineTo(-20,0);ctx.closePath();ctx.stroke();ctx.restore();}
      else{const cx=vw/2,cy=vh/2,dx=p.x-cx,dy=p.y-cy,a=Math.atan2(dy,dx),margin=42,scale=Math.min((vw/2-margin)/Math.max(1,Math.abs(dx)),(vh/2-margin)/Math.max(1,Math.abs(dy))),x=cx+dx*scale,y=cy+dy*scale;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#9deeff';ctx.shadowBlur=16;ctx.shadowColor='#7ce8ff';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-9,-7);ctx.lineTo(-5,0);ctx.lineTo(-9,7);ctx.closePath();ctx.fill();ctx.restore();}
    }
    for(const g of state.entities.gems)if((g.compressedValue||0)>0){const p=worldToScreen(g.x,g.y);ctx.save();ctx.globalAlpha=.42;ctx.strokeStyle='#fff2a8';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,(g.r||4)+4,0,TAU);ctx.stroke();ctx.restore();}
  };

  const baseTogglePause=togglePause;togglePause=function(force){if(state.mode==='mapReward')return;return baseTogglePause(force);};
  const baseReset=resetGame;resetGame=function(){baseReset();state.mapRewardTimer=48;state.entities.mapRewards.length=0;mapOverlay.classList.add('hidden');};
  const baseShowMain=showMainMenu;showMainMenu=function(){mapOverlay.classList.add('hidden');state.entities.mapRewards.length=0;return baseShowMain();};
  const baseEnd=endGame;endGame=function(){mapOverlay.classList.add('hidden');return baseEnd();};
})();