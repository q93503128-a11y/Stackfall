(()=>{
  const CATALOG=Object.freeze([
    {id:'vitality',category:'SURVIVAL',icon:'♥',x:24,y:28,max:5,cost:[80,130,190,270,360],shards:[0,0,0,1,1],name:'upgrade.vitality.name',desc:'upgrade.vitality.desc',effect:'upgrade.vitality.effect'},
    {id:'output',category:'OFFENSE',icon:'▲',x:76,y:27,max:5,cost:[90,145,215,300,400],shards:[0,0,1,1,1],name:'upgrade.output.name',desc:'upgrade.output.desc',effect:'upgrade.output.effect'},
    {id:'cycle',category:'OFFENSE',icon:'»',x:87,y:51,max:4,cost:[120,190,285,410],shards:[0,0,1,1],name:'upgrade.cycle.name',desc:'upgrade.cycle.desc',effect:'upgrade.cycle.effect'},
    {id:'magnet',category:'UTILITY',icon:'⊕',x:74,y:76,max:4,cost:[75,125,190,280],shards:[0,0,0,1],name:'upgrade.magnet.name',desc:'upgrade.magnet.desc',effect:'upgrade.magnet.effect'},
    {id:'salvage',category:'UTILITY',icon:'✦',x:27,y:77,max:5,cost:[70,120,185,270,380],shards:[0,0,0,1,1],name:'upgrade.salvage.name',desc:'upgrade.salvage.desc',effect:'upgrade.salvage.effect'},
    {id:'armor',category:'SURVIVAL',icon:'▣',x:13,y:52,max:4,cost:[110,180,270,390],shards:[0,0,1,1],name:'upgrade.armor.name',desc:'upgrade.armor.desc',effect:'upgrade.armor.effect'},
    {id:'slot5',category:'EXPANSION',icon:'Ⅴ',x:39,y:12,max:1,cost:[350],shards:[1],name:'upgrade.slot5.name',desc:'upgrade.slot5.desc',effect:'upgrade.slot5.effect'},
    {id:'slot6',category:'EXPANSION',icon:'Ⅵ',x:61,y:12,max:1,cost:[900],shards:[3],requires:'slot5',name:'upgrade.slot6.name',desc:'upgrade.slot6.desc',effect:'upgrade.slot6.effect'}
  ]);
  const byId=id=>CATALOG.find(row=>row.id===id)||null;
  const level=id=>window.stackfallUpgradeLevel?.(id)||0;
  const maxed=row=>level(row.id)>=row.max;
  const currency=key=>window.stackfallCurrency?.(key)||0;
  const fmt=(key,n)=>String(tr(key)).replace('{n}',String(n));
  const costAt=row=>({stardust:row.cost[Math.min(level(row.id),row.cost.length-1)]||0,coreShard:row.shards[Math.min(level(row.id),row.shards.length-1)]||0});
  const prereqMet=row=>!row.requires||level(row.requires)>=Math.max(1,byId(row.requires)?.max||1);
  window.stackfallEquipmentSlotLimit=()=>{
    const fifth=level('slot5')>0?1:0,sixth=fifth&&level('slot6')>0?1:0;
    return 4+fifth+sixth;
  };
  window.stackfallCurrencyMultiplier=()=>1+level('salvage')*.08;
  window.STACKFALL_META_UPGRADES=CATALOG;

  const baseDamageMult=damageMult;
  damageMult=function metaUpgradeDamageMult(){return baseDamageMult()*(1+level('output')*.03);};
  const baseHasteMult=hasteMult;
  hasteMult=function metaUpgradeHasteMult(){return Math.max(.14,baseHasteMult()*(1-level('cycle')*.02));};
  const baseMagnetRange=magnetRange;
  magnetRange=function metaUpgradeMagnetRange(){return baseMagnetRange()+level('magnet')*12;};
  const baseDamageReduction=damageReduction;
  damageReduction=function metaUpgradeDamageReduction(){return Math.min(.82,baseDamageReduction()+level('armor')*.02);};
  const baseResetGame=resetGame;
  resetGame=function metaUpgradeResetGame(){
    baseResetGame();state.runCurrencyEarned={stardust:0,coreShard:0};
    const hpBonus=1+level('vitality')*.04;
    if(hpBonus>1){player.maxHp=Math.max(1,Math.round(player.maxHp*hpBonus));player.hp=player.maxHp;updateHUD?.();}
  };

  function runStardustReward(){
    const raw=Math.floor(Math.max(0,state.time||0)/12)+Math.floor(Math.max(0,state.kills||0)*.55);
    return Math.max(state.time>=15?2:0,Math.floor(raw*window.stackfallCurrencyMultiplier()));
  }
  function grantRunCurrency(key,amount){
    const granted=window.stackfallGrantCurrency?.(key,amount)||0;if(!granted)return 0;
    state.runCurrencyEarned=state.runCurrencyEarned||{stardust:0,coreShard:0};state.runCurrencyEarned[key]=(state.runCurrencyEarned[key]||0)+granted;return granted;
  }
  const baseEndGame=endGame;
  endGame=function metaRewardEndGame(){
    if(state.mode==='gameover')return;
    const reward=runStardustReward(),kills=state.kills||0;
    if(reward>0)grantRunCurrency('stardust',reward);
    window.stackfallRecordRun?.(kills);
    state.lastMetaReward={...(state.runCurrencyEarned||{stardust:reward,coreShard:0})};
    baseEndGame();
    renderResultReward();
  };

  const baseKillEnemy=killEnemy;
  killEnemy=function metaRewardKillEnemy(enemy,opts={}){
    const alive=enemy&&!enemy.dead,kind=enemy?.kind,isRewardTwin=!enemy?.twinGroup||(enemy?.twinSide??-1)<0;
    baseKillEnemy(enemy,opts);
    if(!alive||!enemy?.dead)return;
    if(kind==='apex'){grantRunCurrency('coreShard',1);grantRunCurrency('stardust',Math.floor(80*window.stackfallCurrencyMultiplier()));}
    else if(kind==='void'&&isRewardTwin)grantRunCurrency('stardust',Math.floor(30*window.stackfallCurrencyMultiplier()));
  };

  const screen=document.querySelector('#upgradeScreen'),entry=document.querySelector('#upgradeHubBtn'),closeBtn=document.querySelector('#upgradeCloseBtn'),nodeRoot=document.querySelector('#upgradeNodes'),links=document.querySelector('#upgradeLinks'),buyBtn=document.querySelector('#upgradeBuyBtn'),coreCanvas=document.querySelector('#upgradeCoreCanvas');
  const detail={category:document.querySelector('#upgradeCategory'),name:document.querySelector('#upgradeName'),desc:document.querySelector('#upgradeDesc'),level:document.querySelector('#upgradeLevel'),effect:document.querySelector('#upgradeEffect'),cost:document.querySelector('#upgradeCost'),lock:document.querySelector('#upgradeLockReason')};
  let selected='vitality',animationFrame=0,lastFocus=null;

  function effectText(row,nextLevel=level(row.id)){
    if(row.id==='vitality')return fmt(row.effect,nextLevel*4);
    if(row.id==='output')return fmt(row.effect,nextLevel*3);
    if(row.id==='cycle')return fmt(row.effect,nextLevel*2);
    if(row.id==='magnet')return fmt(row.effect,nextLevel*12);
    if(row.id==='salvage')return fmt(row.effect,nextLevel*8);
    if(row.id==='armor')return fmt(row.effect,nextLevel*2);
    if(row.id==='slot5')return tr(row.effect);
    if(row.id==='slot6')return tr(row.effect);
    return'';
  }
  function nodeState(row){
    if(maxed(row))return'maxed';
    if(!prereqMet(row))return'locked';
    const cost=costAt(row);
    return currency('stardust')>=cost.stardust&&currency('coreShard')>=cost.coreShard?'ready':'poor';
  }
  function renderLinks(){
    if(!links)return;links.innerHTML='';
    const center={x:500,y:338};
    for(const row of CATALOG){
      const end={x:row.x*10,y:row.y*6.5},line=document.createElementNS('http://www.w3.org/2000/svg','line');
      const source=row.requires?byId(row.requires):null,start=source?{x:source.x*10,y:source.y*6.5}:center;
      line.setAttribute('x1',String(start.x));line.setAttribute('y1',String(start.y));line.setAttribute('x2',String(end.x));line.setAttribute('y2',String(end.y));line.classList.add('upgrade-link');
      if(level(row.id)>0)line.classList.add('owned');else if(!prereqMet(row))line.classList.add('locked');
      links.appendChild(line);
    }
  }
  function renderNodes(){
    if(!nodeRoot)return;nodeRoot.innerHTML='';
    for(const row of CATALOG){
      const button=document.createElement('button'),lv=level(row.id),stateName=nodeState(row);
      button.type='button';button.className='upgrade-node '+stateName+(selected===row.id?' selected':'');button.style.left=row.x+'%';button.style.top=row.y+'%';button.dataset.upgrade=row.id;
      button.innerHTML='<i>'+row.icon+'</i><span>'+tr(row.name)+'</span><small>'+lv+'/'+row.max+'</small>';
      button.addEventListener('click',()=>{selected=row.id;renderUpgradeUi();});
      nodeRoot.appendChild(button);
    }
  }
  function renderDetail(){
    const row=byId(selected)||CATALOG[0],lv=level(row.id),stateName=nodeState(row),cost=costAt(row);
    detail.category.textContent=row.category;detail.name.textContent=tr(row.name);detail.desc.textContent=tr(row.desc);detail.level.textContent=lv+' / '+row.max;
    detail.effect.textContent=effectText(row,Math.min(row.max,lv+(maxed(row)?0:1)));
    detail.cost.innerHTML=maxed(row)?'<strong>'+tr('upgrade.maxed')+'</strong>':('<span><i>✦</i>'+cost.stardust+'</span>'+(cost.coreShard?'<span><i>◆</i>'+cost.coreShard+'</span>':''));
    detail.lock.textContent=!prereqMet(row)?fmt('upgrade.requires',tr(byId(row.requires)?.name||row.requires)):stateName==='poor'?tr('upgrade.insufficient'):'';
    buyBtn.disabled=maxed(row)||!prereqMet(row)||stateName==='poor';buyBtn.querySelector('span').textContent=maxed(row)?tr('upgrade.maxed'):tr('upgrade.buy');
  }
  function renderProfile(){
    const clears=document.querySelector('#profileClearCount'),dust=document.querySelector('#profileStardust'),shard=document.querySelector('#profileCoreShard'),ud=document.querySelector('#upgradeStardust'),us=document.querySelector('#upgradeCoreShard');
    if(clears)clears.textContent=String(window.stackfallMeta?.clearedStages?.length||0);if(dust)dust.textContent=String(currency('stardust'));if(shard)shard.textContent=String(currency('coreShard'));if(ud)ud.textContent=String(currency('stardust'));if(us)us.textContent=String(currency('coreShard'));
  }
  function renderResultReward(){
    const root=document.querySelector('#resultCurrencyReward');if(!root)return;const reward=state.lastMetaReward||{stardust:0,coreShard:0};
    root.innerHTML=reward.stardust||reward.coreShard?'<span>'+tr('currency.earned')+'</span>'+(reward.stardust?'<b>✦ '+reward.stardust+'</b>':'')+(reward.coreShard?'<b>◆ '+reward.coreShard+'</b>':''):'';
  }
  function renderUpgradeUi(){renderProfile();renderLinks();renderNodes();renderDetail();}
  window.renderStackfallMetaUi=renderUpgradeUi;

  function buySelected(){
    const row=byId(selected);if(!row||maxed(row)||!prereqMet(row))return;
    const cost=costAt(row);if(!window.stackfallSpendCurrency?.(cost))return;
    window.stackfallSetUpgradeLevel?.(row.id,level(row.id)+1);
    try{audio.resonance();}catch{}
    renderUpgradeUi();renderLoadout?.();
  }
  function open(){
    if(!screen)return;lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;screen.classList.remove('hidden');renderUpgradeUi();startCoreAnimation();closeBtn?.focus();try{audio.pickup();}catch{}
  }
  function close(){
    if(!screen)return;screen.classList.add('hidden');stopCoreAnimation();if(lastFocus?.isConnected)lastFocus.focus();lastFocus=null;
  }
  entry?.addEventListener('click',open);closeBtn?.addEventListener('click',close);buyBtn?.addEventListener('click',buySelected);
  window.addEventListener('keydown',event=>{if(event.code==='Escape'&&screen&&!screen.classList.contains('hidden')){event.preventDefault();event.stopImmediatePropagation();close();}},true);

  function drawCore(now=0){
    if(!coreCanvas)return;const g=coreCanvas.getContext('2d'),w=coreCanvas.width,h=coreCanvas.height,cx=w/2,cy=h/2,t=now/1000;
    g.clearRect(0,0,w,h);
    const aura=g.createRadialGradient(cx,cy,4,cx,cy,118);aura.addColorStop(0,'rgba(225,252,255,.50)');aura.addColorStop(.28,'rgba(105,196,255,.18)');aura.addColorStop(.62,'rgba(114,100,255,.08)');aura.addColorStop(1,'rgba(56,50,150,0)');g.fillStyle=aura;g.fillRect(30,30,w-60,h-60);
    g.save();g.translate(cx,cy);g.strokeStyle='rgba(158,229,255,.44)';g.lineWidth=1.4;
    for(let ring=0;ring<3;ring++){g.save();g.rotate(t*(ring%2?.17:-.12)+ring);g.beginPath();g.ellipse(0,0,78+ring*17,23+ring*7,ring*.55,0,Math.PI*2);g.stroke();g.restore();}
    const shell=g.createLinearGradient(-54,-54,54,54);shell.addColorStop(0,'#f8ffff');shell.addColorStop(.28,'#aef2ff');shell.addColorStop(.64,'#7587ff');shell.addColorStop(1,'#2c256f');g.fillStyle=shell;g.shadowBlur=34;g.shadowColor='#7ce8ff';
    g.beginPath();for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,r=i%2?42:58,x=Math.cos(a)*r,y=Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();
    g.shadowBlur=20;g.fillStyle='#fff';g.beginPath();for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,r=i%2?12:30,x=Math.cos(a)*r,y=Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();
    g.fillStyle='#101737';g.beginPath();g.arc(0,0,10,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(-3,-3,3,0,Math.PI*2);g.fill();g.restore();
  }
  function animateCore(now){if(!screen||screen.classList.contains('hidden')){animationFrame=0;return;}drawCore(now);animationFrame=requestAnimationFrame(animateCore);}
  function startCoreAnimation(){if(animationFrame)return;animationFrame=requestAnimationFrame(animateCore);}
  function stopCoreAnimation(){if(animationFrame)cancelAnimationFrame(animationFrame);animationFrame=0;}

  const baseShowMainMenu=showMainMenu;
  showMainMenu=function metaAwareMainMenu(){baseShowMainMenu();close();renderProfile();};
  const baseApplyLanguage=applyLanguage;
  applyLanguage=function metaAwareLanguage(){baseApplyLanguage();renderUpgradeUi();};

  renderProfile();renderResultReward();
})();