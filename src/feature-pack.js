player.arcCd=player.arcCd||0;

const sf2BaseResetGame=resetGame;
resetGame=function resetGameWithBasicCore(){
  resetRuntimeWeaponState();
  sf2BaseResetGame();
  resetRuntimeWeaponState();
  state.weaponStacks.core=1;
  state.entities.curves.length=0;
  player.arcCd=0;
  player.coreVolley=0;
  player.emberVolley=0;
  player.bulwarkCd=0;
  renderLoadout();
  updateHUD();
  audio.syncAmbient();
};

const sf2BaseAddText=addText;
addText=function addTextWithSetting(...args){
  if(GAME_SETTINGS.damageNumbers!==false)sf2BaseAddText(...args);
};

const sf2BaseDealDamage=dealDamage;
let sf2EchoBladeGuard=false;
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
    forEachNearbyEnemyCandidate(x,y,radius+128,other=>{if(other===enemy||other.dead)return;if((other.x-x)**2+(other.y-y)**2<(other.r+radius)**2)sf2BaseDealDamage(other,splash,{color:'#ff9aba',source:'ember-burst',canCrit:false});});
  }
  if((source==='core'||source==='core-echo')&&weaponCount('core')>=4){
    const stacks=weaponCount('core');
    const radius=22+stacks*3;
    shockwave(x,y,source==='core-echo'?COLORS.pink:'#d7f8ff',radius,.16,1.6);
    forEachNearbyEnemyCandidate(x,y,radius+128,other=>{if(other===enemy||other.dead)return;if((other.x-x)**2+(other.y-y)**2<(other.r+radius)**2)sf2BaseDealDamage(other,amount*(.12+stacks*.012),{color:'#d7f8ff',source:'core-burst',canCrit:false});});
  }
  if(sf2EchoBladeGuard||enemy.dead||state.mode!=='playing'||source!=='blade'||!stat('echo')||(player.echoBladeCd||0)>0)return;
  const chance=Math.min(.36,.045+stat('echo')*.038);if(Math.random()>=chance)return;
  player.echoBladeCd=.46;const targetId=enemy.id;
  scheduleWeaponAction(60,()=>{const target=enemyById(targetId);if(!target)return;sf2EchoBladeGuard=true;sf2BaseDealDamage(target,amount*.52,{color:COLORS.pink,source:'echo-blade',canCrit:false});sf2EchoBladeGuard=false;});
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

renderStarterOptions=function renderStarterOptionsWithoutCore(){
  ui.starterOptions.innerHTML='';
  for(const [key,w] of Object.entries(WEAPONS)){
    if(w.starter===false||(window.stackfallIsWeaponUnlocked&&!window.stackfallIsWeaponUnlocked(key)))continue;
    const text=weaponText(key),el=document.createElement('button');
    el.type='button';el.className='starter-option'+(key===state.selectedStarter?' selected':'');
    el.style.setProperty('--starter-color',w.color);el.style.setProperty('--starter-glow',hexToRgba(w.color,.16));
    el.setAttribute('role','radio');el.setAttribute('aria-checked',key===state.selectedStarter?'true':'false');
    el.title=`${text.name} · ${text.role}`;el.innerHTML=`<span class="starter-icon">${w.icon}</span><span class="starter-label">${text.name}</span>`;
    el.onclick=()=>selectStarter(key);ui.starterOptions.appendChild(el);
  }
  const allowed=WEAPONS[state.selectedStarter]&&WEAPONS[state.selectedStarter].starter!==false&&(!window.stackfallIsWeaponUnlocked||window.stackfallIsWeaponUnlocked(state.selectedStarter)),key=allowed?state.selectedStarter:(Object.keys(WEAPONS).find(key=>WEAPONS[key].starter!==false&&(!window.stackfallIsWeaponUnlocked||window.stackfallIsWeaponUnlocked(key)))||'blade');state.selectedStarter=key;
  const selected=weaponText(key);ui.starterName.textContent=selected.name;ui.starterDesc.textContent=selected.desc;
};

rollChoices=function rollChoicesWithBasicCore(n){
  const pool=[];
  const coreCount=weaponCount('core');
  if(coreCount<6)pool.push({kind:'core',key:'core',...WEAPONS.core,weight:coreCount<3?1.28:1.08});
  for(const [key,w] of Object.entries(WEAPONS)){
    if(w.starter===false||(window.stackfallIsWeaponUnlocked&&!window.stackfallIsWeaponUnlocked(key)))continue;
    const count=weaponCount(key),has=count>0,slots=state.weaponSlots.length,limit=window.stackfallEquipmentSlotLimit?.()||4;
    if(count<6&&(has||slots<limit))pool.push({kind:'weapon',key,...w,weight:has?1.34:1});
  }
  for(const [key,p] of Object.entries(PASSIVES))if(stat(key)<p.max&&(!window.stackfallIsPassiveChoiceUnlocked||window.stackfallIsPassiveChoiceUnlocked(key))&&(!p.eventOnly||window.stackfallIsFeatureUnlocked?.('multiplicity-protocol')===true))pool.push({kind:'passive',key,...p,weight:key==='magnet'||key==='echo'?1.3:1.18});
  const out=[];
  while(out.length<n&&pool.length){
    let total=pool.reduce((sum,item)=>sum+item.weight,0),r=Math.random()*total,index=0;
    for(;index<pool.length;index++){r-=pool[index].weight;if(r<=0)break;}
    out.push(pool.splice(Math.min(index,pool.length-1),1)[0]);
  }
  return out;
};

function sf2SlotMarkup(key,basic=false){
  const w=WEAPONS[key],text=weaponText(key),count=weaponCount(key);
  return `<div class="weapon-slot${basic?' basic-slot':''}${count>=2?' resonant':''}" data-cooldown-key="${key}" style="--slot-color:${hexToRgba(w.color,.18)};--cooldown-color:${w.color}"><div class="icon-wrap"><div class="icon">${w.icon}</div><div class="cooldown-sweep"></div><span class="cooldown-time"></span></div><div class="name">${text.name}</div><b class="stack">${count}</b></div>`;
}
renderLoadout=function renderLoadoutWithBasicCore(){
  let html=sf2SlotMarkup('core',true)+'<div class="slot-divider" aria-hidden="true"></div>';
  const limit=window.stackfallEquipmentSlotLimit?.()||4;
  for(let i=0;i<limit;i++){
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
    const profile=bulwarkRechargeProfile(n);if(profile){remaining=player.bulwarkCd||0;max=profile.interval;}else return{ratio:0,remaining:0};
  }
  else if(key==='comet'){remaining=player.cometCd||0;max=(1.72-Math.min(.5,n*.065))*hasteMult();}
  else if(key==='prism'){remaining=player.prismCd||0;max=(1.34-Math.min(.52,n*.062))*hasteMult();}
  else if(key==='chrono'){
    if(n>=4){remaining=player.chronoCd||0;max=(4.8-Math.min(1.55,n*.22))*hasteMult();}else return{ratio:0,remaining:0};
  }
  else if(key==='arc'){remaining=player.arcCd||0;max=(1.92-Math.min(.58,n*.075))*hasteMult();}
  else if(key==='vacuum')return{ratio:0,remaining:0};
  else if(key==='mine'){remaining=player.minePlaceTimer||0;max=1.65*hasteMult();}
  else if(key==='missile'){remaining=player.missileCd||0;max=2.35*hasteMult();}
  else if(key==='gate'){remaining=player.gateCd||0;max=6.4*hasteMult();}
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

renderStarterOptions();
renderLoadout();
syncSettingsControls();
