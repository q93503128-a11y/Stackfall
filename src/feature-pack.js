state.entities.curves=state.entities.curves||[];
player.arcCd=player.arcCd||0;

const sf2BaseResetGame=resetGame;
resetGame=function resetGameWithBasicCore(){
  sf2BaseResetGame();
  state.weaponStacks.core=1;
  state.entities.curves.length=0;
  player.arcCd=0;
  player.coreVolley=0;
  player.emberVolley=0;
  player.bulwarkCd=0;
  renderLoadout();
  updateHUD();
};

const sf2BaseAddText=addText;
addText=function addTextWithSetting(...args){
  if(GAME_SETTINGS.damageNumbers!==false)sf2BaseAddText(...args);
};

const sf2BaseDealDamage=dealDamage;
dealDamage=function dealDamageWithDistinctBursts(enemy,amount,opts={}){
  if(!enemy||enemy.dead)return;
  const source=opts.source||'';
  const x=enemy.x,y=enemy.y;
  sf2BaseDealDamage(enemy,amount,opts);
  if(source==='ember'||source==='echo-star'){
    const stacks=weaponCount('ember');
    const radius=27+stacks*3.5;
    const splash=amount*(.16+stacks*.018);
    shockwave(x,y,source==='echo-star'?COLORS.pink:'#ff789b',radius,.20,2.2);
    spawnParticle(x,y,source==='echo-star'?COLORS.pink:'#ff9aba',4+Math.min(5,stacks),105,3.2);
    for(const other of state.entities.enemies){
      if(other===enemy||other.dead)continue;
      if((other.x-x)**2+(other.y-y)**2<(other.r+radius)**2){
        sf2BaseDealDamage(other,splash,{color:'#ff9aba',source:'ember-burst',canCrit:false});
      }
    }
  }
  if((source==='core'||source==='core-echo')&&weaponCount('core')>=4){
    const stacks=weaponCount('core');
    const radius=22+stacks*3;
    shockwave(x,y,source==='core-echo'?COLORS.pink:'#d7f8ff',radius,.16,1.6);
    for(const other of state.entities.enemies){
      if(other===enemy||other.dead)continue;
      if((other.x-x)**2+(other.y-y)**2<(other.r+radius)**2){
        sf2BaseDealDamage(other,amount*(.12+stacks*.012),{color:'#d7f8ff',source:'core-burst',canCrit:false});
      }
    }
  }
};

spawnCoreShot=function spawnStackedCoreShot(target,echoed=false){
  if(!target)return;
  const stacks=Math.max(1,weaponCount('core'));
  if(!echoed)player.coreVolley=(player.coreVolley||0)+1;
  const superShot=stacks>=6&&!echoed&&player.coreVolley%6===0;
  const shots=stacks>=5?3:stacks>=2?2:1;
  const base=Math.atan2(target.y-player.y,target.x-player.x);
  player.coreCd=Math.max(.42,1.08-(stacks-1)*.085)*hasteMult();
  for(let i=0;i<shots;i++){
    const a=base+(i-(shots-1)/2)*(shots===3?.15:.12);
    spawnPlayerProjectile({
      x:player.x,y:player.y,vx:Math.cos(a)*(superShot?610:475),vy:Math.sin(a)*(superShot?610:475),
      r:superShot?9.5:4.4+stacks*.18,life:superShot?1.9:1.48,damage:(8.5+stacks*2.05)*(echoed?.68:1)*(superShot?2.15:1),
      color:echoed?COLORS.pink:'#d7f8ff',pierce:superShot?5:stacks>=3?1:0,source:echoed?'core-echo':'core'
    });
  }
};

firePrism=function fireInfinitePrismRays(prismN,echoed=false){
  const satelliteCount=prismN>=6?3:prismN>=2?2:1;
  const positions=prismPositions(satelliteCount);
  const beamLength=Math.hypot(vw,vh)*1.45+620;
  const rayCount=prismN>=5?2:1;
  const beamWidth=prismN>=3?7.5:4.5;
  for(const pos of positions){
    const target=nearestEnemy(pos.x,pos.y);
    if(!target)continue;
    const base=Math.atan2(target.y-pos.y,target.x-pos.x);
    for(let ray=0;ray<rayCount;ray++){
      const angle=base+(ray-(rayCount-1)/2)*.115;
      const end={x:pos.x+Math.cos(angle)*beamLength,y:pos.y+Math.sin(angle)*beamLength};
      const color=echoed?COLORS.pink:'#c8b3ff';
      state.entities.beams.push({x1:pos.x,y1:pos.y,x2:end.x,y2:end.y,life:.18,max:.18,color,width:beamWidth});
      for(const enemy of state.entities.enemies){
        if(enemy.dead)continue;
        const forward=(enemy.x-pos.x)*Math.cos(angle)+(enemy.y-pos.y)*Math.sin(angle);
        if(forward<0||forward>beamLength)continue;
        if(segmentDistance(enemy.x,enemy.y,pos.x,pos.y,end.x,end.y)<enemy.r+beamWidth){
          dealDamage(enemy,(10.5+prismN*3.6)*(echoed?.62:1)*(rayCount>1?.78:1),{color,source:'prism-beam'});
        }
      }
    }
  }
  if(prismN>=4&&positions.length>1){
    for(let i=0;i<positions.length;i++){
      const a=positions[i],b=positions[(i+1)%positions.length];
      state.entities.beams.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,life:.22,max:.22,color:'#9f8cff',width:1.4});
      for(const enemy of state.entities.enemies){
        if(!enemy.dead&&segmentDistance(enemy.x,enemy.y,a.x,a.y,b.x,b.y)<enemy.r+5){
          dealDamage(enemy,(4+prismN*1.2)*(echoed?.55:1),{color:'#ae9cff',source:'constellation-link',canCrit:false});
        }
      }
    }
  }
};

function sf2Bezier(a,b,c,t){
  const u=1-t;
  return{x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};
}
function sf2FireArc(target,stacks,echoed=false){
  if(!target)return;
  const shots=stacks>=6?3:stacks>=2?2:1;
  const start={x:player.x,y:player.y};
  const aim=Math.atan2(target.y-player.y,target.x-player.x);
  const distance=clamp(Math.hypot(target.x-player.x,target.y-player.y)+140,380,760);
  for(let i=0;i<shots;i++){
    const side=shots===1?1:(i-(shots-1)/2);
    const end={x:start.x+Math.cos(aim)*distance,y:start.y+Math.sin(aim)*distance};
    const mid={x:(start.x+end.x)/2,y:(start.y+end.y)/2};
    const curve=(145+stacks*18)*(side===0?.36:Math.sign(side));
    const control={x:mid.x-Math.sin(aim)*curve,y:mid.y+Math.cos(aim)*curve};
    state.entities.curves.push({
      start,control,end,x:start.x,y:start.y,lastX:start.x,lastY:start.y,elapsed:0,duration:Math.max(.62,.92-stacks*.035),
      returning:stacks>=4,returnReset:false,hitIds:new Set(),r:10+stacks*1.15,damage:(18+stacks*5.1)*(echoed?.68:1),
      color:echoed?COLORS.pink:'#69ffe0',trailDamage:stacks>=5,trailCd:0,history:[],stacks
    });
  }
}
function sf2UpdateCurves(dt){
  for(const p of state.entities.curves){
    p.elapsed+=dt;
    const raw=p.elapsed/p.duration;
    if(raw>1&&p.returning&&!p.returnReset){p.returnReset=true;p.hitIds.clear();}
    const returning=p.returning&&raw>1;
    const local=returning?clamp(raw-1,0,1):clamp(raw,0,1);
    const destination=returning?{x:player.x,y:player.y}:p.end;
    const start=returning?p.end:p.start;
    p.lastX=p.x;p.lastY=p.y;
    const pos=sf2Bezier(start,p.control,destination,local);
    p.x=pos.x;p.y=pos.y;
    p.history.push({x:p.x,y:p.y});
    if(p.history.length>26)p.history.shift();
    p.trailCd-=dt;
    if(p.trailDamage&&p.trailCd<=0){
      p.trailCd=.11;
      state.entities.shockwaves.push({x:p.x,y:p.y,r:3,maxR:24+p.stacks*2,life:.20,max:.20,color:'rgba(105,255,224,.46)',width:1.2});
      for(const e of state.entities.enemies){
        if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+22+p.stacks*2)**2){
          dealDamage(e,2.2+p.stacks*.85,{color:p.color,source:'arc-trail',canCrit:false});
        }
      }
    }
    for(const e of state.entities.enemies){
      if(e.dead||p.hitIds.has(e.id))continue;
      if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){
        p.hitIds.add(e.id);
        dealDamage(e,p.damage,{color:p.color,source:'arc'});
        shockwave(p.x,p.y,p.color,36+p.stacks*3,.20,2);
      }
    }
    if(Math.random()<.72){
      state.entities.particles.push({x:p.x,y:p.y,vx:rand(-18,18),vy:rand(-18,18),life:.28,max:.28,size:rand(1.4,3.4),color:p.color,star:true});
    }
  }
  state.entities.curves=state.entities.curves.filter(p=>p.elapsed<p.duration*(p.returning?2:1));
}
function sf2DrawCurves(){
  for(const p of state.entities.curves){
    if(p.history.length>1){
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      ctx.strokeStyle=p.color;ctx.globalAlpha=.18;ctx.lineWidth=p.r*.95;ctx.shadowBlur=18;ctx.shadowColor=p.color;
      ctx.beginPath();p.history.forEach((h,i)=>i?ctx.lineTo(worldToScreen(h.x,h.y).x,worldToScreen(h.x,h.y).y):ctx.moveTo(worldToScreen(h.x,h.y).x,worldToScreen(h.x,h.y).y));ctx.stroke();
      ctx.globalAlpha=.62;ctx.lineWidth=2.1;ctx.stroke();ctx.restore();
    }
    const s=worldToScreen(p.x,p.y),angle=Math.atan2(p.y-p.lastY,p.x-p.lastX);
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(angle);ctx.shadowBlur=24;ctx.shadowColor=p.color;
    const g=ctx.createLinearGradient(-p.r,0,p.r,0);g.addColorStop(0,'rgba(105,255,224,.10)');g.addColorStop(.58,p.color);g.addColorStop(1,'#ffffff');ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(-p.r*.95,-p.r*.25);ctx.quadraticCurveTo(0,-p.r*1.05,p.r*1.15,0);ctx.quadraticCurveTo(0,p.r*1.05,-p.r*.95,p.r*.25);ctx.quadraticCurveTo(-p.r*.38,0,-p.r*.95,-p.r*.25);ctx.fill();
    if(p.stacks>=3){ctx.globalAlpha=.38;ctx.strokeStyle='#d9fff8';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,p.r*1.5,p.r*.58,0,0,TAU);ctx.stroke();}
    ctx.restore();
  }
}

const sf2BaseUpdateWeapons=updateWeapons;
updateWeapons=function updateWeaponsWithCurvedWeapon(dt){
  sf2BaseUpdateWeapons(dt);
  const stacks=weaponCount('arc');
  if(!stacks)return;
  player.arcCd-=dt;
  if(player.arcCd<=0){
    player.arcCd=(1.92-Math.min(.58,stacks*.075))*hasteMult();
    const target=nearestEnemy(player.x,player.y);
    if(target){sf2FireArc(target,stacks);echoTrigger(()=>sf2FireArc(target,stacks,true));}
  }
};
const sf2BaseUpdateEffects=updateEffects;
updateEffects=function updateEffectsWithCurves(dt){
  sf2BaseUpdateEffects(dt);
  if(state.mode==='playing')sf2UpdateCurves(dt);
};
const sf2BaseDrawProjectiles=drawProjectiles;
drawProjectiles=function drawProjectilesWithCurves(){sf2BaseDrawProjectiles();sf2DrawCurves();};

renderStarterOptions=function renderStarterOptionsWithoutCore(){
  ui.starterOptions.innerHTML='';
  for(const [key,w] of Object.entries(WEAPONS)){
    if(w.starter===false)continue;
    const text=weaponText(key),el=document.createElement('button');
    el.type='button';el.className='starter-option'+(key===state.selectedStarter?' selected':'');
    el.style.setProperty('--starter-color',w.color);el.style.setProperty('--starter-glow',hexToRgba(w.color,.16));
    el.setAttribute('role','radio');el.setAttribute('aria-checked',key===state.selectedStarter?'true':'false');
    el.title=`${text.name} · ${text.role}`;el.innerHTML=`<span class="starter-icon">${w.icon}</span><span class="starter-label">${text.name}</span>`;
    el.onclick=()=>selectStarter(key);ui.starterOptions.appendChild(el);
  }
  const key=WEAPONS[state.selectedStarter]&&WEAPONS[state.selectedStarter].starter!==false?state.selectedStarter:'blade';
  const selected=weaponText(key);ui.starterName.textContent=selected.name;ui.starterDesc.textContent=selected.desc;
};

rollChoices=function rollChoicesWithBasicCore(n){
  const pool=[];
  const coreCount=weaponCount('core');
  if(coreCount<6)pool.push({kind:'core',key:'core',...WEAPONS.core,weight:coreCount<3?1.28:1.08});
  for(const [key,w] of Object.entries(WEAPONS)){
    if(w.starter===false)continue;
    const count=weaponCount(key),has=count>0,slots=state.weaponSlots.length;
    if(count<6&&(has||slots<6))pool.push({kind:'weapon',key,...w,weight:has?1.34:1});
  }
  for(const [key,p] of Object.entries(PASSIVES))if(stat(key)<p.max)pool.push({kind:'passive',key,...p,weight:key==='magnet'||key==='echo'?1.3:1.18});
  const out=[];
  while(out.length<n&&pool.length){
    let total=pool.reduce((sum,item)=>sum+item.weight,0),r=Math.random()*total,index=0;
    for(;index<pool.length;index++){r-=pool[index].weight;if(r<=0)break;}
    out.push(pool.splice(Math.min(index,pool.length-1),1)[0]);
  }
  return out;
};

openChoices=function openChoicesWithBasicCore(){
  state.mode='choice';audio.level();ui.choice.classList.remove('hidden');
  ui.choiceTitle.textContent=`${tr('choice.title')} ${state.level}`;ui.choiceKicker.textContent=tr('choice.kicker');
  const choices=rollChoices(3);ui.choiceCards.innerHTML='';
  choices.forEach(c=>{
    const weaponLike=c.kind==='weapon'||c.kind==='core';
    const text=weaponLike?weaponText(c.key):passiveText(c.key);
    const current=weaponLike?weaponCount(c.key):stat(c.key),next=weaponLike?stackEffectText(c.key,current+1):null;
    const el=document.createElement('button');el.className='choice-card';el.style.setProperty('--card-accent',c.color);el.style.setProperty('--card-glow',hexToRgba(c.color,.22));
    const type=c.kind==='core'?tr('choice.basic'):c.kind==='weapon'?tr('choice.equipment'):tr('choice.passive');
    const countLabel=weaponLike?tr('choice.stack'):tr('choice.owned');
    el.innerHTML=`<span class="type">${type}</span><span class="stack-info">${countLabel} ${current} → ${current+1}</span><div class="big-icon">${c.icon}</div><h3>${text.name}</h3><p>${text.desc}</p>${next?`<div class="resonance-preview"><b>${current+1} · ${next.name}</b><span>${next.desc}</span></div>`:''}`;
    el.onclick=()=>selectChoice(c);ui.choiceCards.appendChild(el);
  });
};

selectChoice=function selectChoiceWithBasicCore(c){
  if(c.kind==='core'){
    const after=weaponCount('core')+1;state.weaponStacks.core=after;showStackEffect('core',after);
  }else if(c.kind==='weapon'){
    const before=weaponCount(c.key),after=before+1;state.weaponStacks[c.key]=after;if(before===0)state.weaponSlots.push(c.key);showStackEffect(c.key,after);
    if(c.key==='bulwark'){player.maxHp+=8;player.hp=Math.min(player.maxHp,player.hp+8);}
  }else{
    state.passives[c.key]=stat(c.key)+1;if(c.key==='vitality'){player.maxHp+=15;player.hp=Math.min(player.maxHp,player.hp+22);}
  }
  ui.choice.classList.add('hidden');state.mode='playing';renderLoadout();updateHUD();
};

function sf2SlotMarkup(key,basic=false){
  const w=WEAPONS[key],text=weaponText(key),count=weaponCount(key);
  return `<div class="weapon-slot${basic?' basic-slot':''}${count>=2?' resonant':''}" data-cooldown-key="${key}" style="--slot-color:${hexToRgba(w.color,.18)};--cooldown-color:${w.color}"><div class="icon-wrap"><div class="icon">${w.icon}</div><div class="cooldown-sweep"></div><span class="cooldown-time"></span></div><div class="name">${text.name}</div><b class="stack">${count}</b></div>`;
}
renderLoadout=function renderLoadoutWithBasicCore(){
  let html=sf2SlotMarkup('core',true)+'<div class="slot-divider" aria-hidden="true"></div>';
  for(let i=0;i<6;i++){
    const key=state.weaponSlots[i];
    if(key)html+=sf2SlotMarkup(key,false);
    else html+=`<div class="weapon-slot empty"><div class="icon-wrap"><div class="icon">+</div></div><div class="name">${tr('empty')}</div></div>`;
  }
  ui.slots.innerHTML=html;
  ui.passives.innerHTML=Object.entries(state.passives).map(([key,value])=>{const text=passiveText(key),p=PASSIVES[key];return `<div class="passive-row"><span><i style="color:${p.color}">${p.icon}</i>${text.name}</span><b>×${value}</b></div>`;}).join('');
  sf2UpdateCooldownHud();
};

function sf2CooldownInfo(key){
  const n=Math.max(1,weaponCount(key));
  let remaining=0,max=1;
  if(key==='core'){remaining=player.coreCd||0;max=Math.max(.42,1.08-(n-1)*.085)*hasteMult();}
  else if(key==='blade'){remaining=player.bladeTick||0;max=.105*hasteMult();}
  else if(key==='ember'){remaining=player.emberCd||0;max=(.74-Math.min(.32,n*.04))*hasteMult();}
  else if(key==='gravity'){remaining=player.wellCd||0;max=(5.8-Math.min(2.45,n*.34))*hasteMult();}
  else if(key==='bulwark'){
    if(n>=3){remaining=player.bulwarkCd||0;max=n>=5?6.2:9;}else return{ratio:0,remaining:0};
  }
  else if(key==='comet'){remaining=player.cometCd||0;max=(1.72-Math.min(.5,n*.065))*hasteMult();}
  else if(key==='prism'){remaining=player.prismCd||0;max=(1.34-Math.min(.52,n*.062))*hasteMult();}
  else if(key==='chrono'){
    if(n>=4){remaining=player.chronoCd||0;max=(4.8-Math.min(1.55,n*.22))*hasteMult();}else return{ratio:0,remaining:0};
  }
  else if(key==='arc'){remaining=player.arcCd||0;max=(1.92-Math.min(.58,n*.075))*hasteMult();}
  return{ratio:clamp(remaining/Math.max(.001,max),0,1),remaining:Math.max(0,remaining)};
}
function sf2UpdateCooldownHud(){
  for(const slot of ui.slots.querySelectorAll('[data-cooldown-key]')){
    const info=sf2CooldownInfo(slot.dataset.cooldownKey);
    slot.style.setProperty('--cd',info.ratio.toFixed(4));
    slot.classList.toggle('cooling',info.ratio>.025);
    const label=slot.querySelector('.cooldown-time');
    if(label)label.textContent=info.remaining>=.12?(info.remaining>=10?Math.ceil(info.remaining):info.remaining.toFixed(1)):'';
  }
}
const sf2BaseUpdateHUD=updateHUD;
updateHUD=function updateHUDWithCooldown(){sf2BaseUpdateHUD();sf2UpdateCooldownHud();};

const sf2BaseSyncSettings=syncSettingsControls;
syncSettingsControls=function syncSettingsWithDamageNumbers(){
  sf2BaseSyncSettings();
  const box=document.querySelector('#damageNumbers');if(box)box.checked=GAME_SETTINGS.damageNumbers!==false;
};
const sf2DamageNumbers=document.querySelector('#damageNumbers');
if(sf2DamageNumbers){
  sf2DamageNumbers.checked=GAME_SETTINGS.damageNumbers!==false;
  sf2DamageNumbers.addEventListener('change',()=>{GAME_SETTINGS.damageNumbers=sf2DamageNumbers.checked;saveGameSettings();audio.pickup();});
}

const sf2BaseApplyLanguage=applyLanguage;
applyLanguage=function applyLanguageWithExpandedContent(){sf2BaseApplyLanguage();renderStarterOptions();renderLoadout();};

function sf2DrawBladeBody(x,y,angle,stacks){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);ctx.shadowBlur=stacks>=6?28:18;ctx.shadowColor=COLORS.cyan;
  const blade=ctx.createLinearGradient(-17,-28,16,24);blade.addColorStop(0,'rgba(255,255,255,.98)');blade.addColorStop(.42,'#a7f5ff');blade.addColorStop(.75,'#668cff');blade.addColorStop(1,'rgba(60,76,190,.05)');ctx.fillStyle=blade;
  ctx.beginPath();ctx.moveTo(-4,-28);ctx.bezierCurveTo(19,-12,17,14,-2,27);ctx.bezierCurveTo(7,10,3,-8,-4,-28);ctx.fill();
  ctx.restore();
}
drawEquippedOrbits=function drawEquippedOrbitsClean(x,y,t){
  const bladeN=weaponCount('blade');
  if(bladeN){
    const count=bladeN>=5?3:bladeN>=2?2:1,orbit=bladeN>=6?116:bladeN>=3?91:80;
    for(let i=0;i<count;i++){const a=player.angle+i*TAU/count;sf2DrawBladeBody(x+Math.cos(a)*orbit,y+Math.sin(a)*orbit,a,bladeN);}
  }
  const prismN=weaponCount('prism');
  if(prismN){
    const count=prismN>=6?3:prismN>=2?2:1;
    for(const p of prismPositions(count)){
      const s=worldToScreen(p.x,p.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-p.a+t/1300);ctx.shadowBlur=16;ctx.shadowColor='#c2a7ff';
      const g=ctx.createLinearGradient(0,-10,0,10);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#d2c3ff');g.addColorStop(1,'#6e63d8');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.restore();
    }
    if(prismN>=4){
      const pts=prismPositions(count).map(p=>worldToScreen(p.x,p.y));ctx.strokeStyle='rgba(194,167,255,.25)';ctx.lineWidth=1.2;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(pts.length>2)ctx.closePath();ctx.stroke();
    }
  }
  const bulwarkN=weaponCount('bulwark');
  if(bulwarkN){
    const count=Math.min(4,1+Math.floor((bulwarkN-1)/2));
    for(let i=0;i<count;i++){const a=-t/1800+i*TAU/count,rr=48;ctx.save();ctx.translate(x+Math.cos(a)*rr,y+Math.sin(a)*rr);ctx.rotate(a+Math.PI/2);ctx.shadowBlur=10;ctx.shadowColor=COLORS.green;ctx.strokeStyle='rgba(116,242,167,.78)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,5);ctx.lineTo(0,-8);ctx.lineTo(7,5);ctx.lineTo(0,9);ctx.closePath();ctx.stroke();ctx.restore();}
  }
};

renderStarterOptions();
renderLoadout();
syncSettingsControls();
