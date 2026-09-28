(()=>{
  const CATALOG=Object.freeze([
    {id:'vitality',category:'SURVIVAL',icon:'♥',x:24,y:28,max:8,cost:[80,130,190,280,400,550,740,980],shards:[0,0,0,1,0,0,0,2],values:[0,4,8,12,20,24,28,32,44],name:'upgrade.vitality.name',desc:'upgrade.vitality.desc',effect:'upgrade.vitality.effect'},
    {id:'output',category:'OFFENSE',icon:'▲',x:76,y:27,max:8,cost:[90,145,215,315,440,600,800,1050],shards:[0,0,0,1,0,0,0,2],values:[0,3,6,9,15,18,21,24,33],name:'upgrade.output.name',desc:'upgrade.output.desc',effect:'upgrade.output.effect'},
    {id:'cycle',category:'OFFENSE',icon:'»',x:87,y:51,max:6,cost:[120,190,300,450,650,900],shards:[0,0,1,0,0,2],values:[0,2,4,8,10,12,18],name:'upgrade.cycle.name',desc:'upgrade.cycle.desc',effect:'upgrade.cycle.effect'},
    {id:'magnet',category:'UTILITY',icon:'⊕',x:74,y:76,max:6,cost:[75,125,210,330,500,760],shards:[0,0,1,0,0,2],values:[0,12,24,48,60,72,108],name:'upgrade.magnet.name',desc:'upgrade.magnet.desc',effect:'upgrade.magnet.effect'},
    {id:'salvage',category:'UTILITY',icon:'✦',x:27,y:77,max:8,cost:[70,120,185,285,410,570,760,990],shards:[0,0,0,1,0,0,0,2],values:[0,8,16,24,40,48,56,64,88],name:'upgrade.salvage.name',desc:'upgrade.salvage.desc',effect:'upgrade.salvage.effect'},
    {id:'armor',category:'SURVIVAL',icon:'▣',x:13,y:52,max:6,cost:[110,180,290,440,640,900],shards:[0,0,1,0,0,2],values:[0,2,4,8,10,12,18],name:'upgrade.armor.name',desc:'upgrade.armor.desc',effect:'upgrade.armor.effect'},
    {id:'slot5',category:'EXPANSION',icon:'Ⅴ',x:39,y:12,max:1,cost:[350],shards:[1],values:[0,1],name:'upgrade.slot5.name',desc:'upgrade.slot5.desc',effect:'upgrade.slot5.effect'},
    {id:'slot6',category:'EXPANSION',icon:'Ⅵ',x:61,y:12,max:1,cost:[900],shards:[3],values:[0,1],requires:'slot5',name:'upgrade.slot6.name',desc:'upgrade.slot6.desc',effect:'upgrade.slot6.effect'}
  ]);
  const byId=id=>CATALOG.find(row=>row.id===id)||null;
  const level=id=>window.stackfallUpgradeLevel?.(id)||0;
  const valueAt=(row,lv=level(row.id))=>{const values=row?.values||[0];return Number(values[Math.max(0,Math.min(row.max,Math.floor(Number(lv)||0)))])||0;};
  const maxed=row=>level(row.id)>=row.max;
  const currency=key=>window.stackfallCurrency?.(key)||0;
  const fmt=(key,n)=>String(tr(key)).replace('{n}',String(n));
  const costAt=row=>({stardust:row.cost[Math.min(level(row.id),row.cost.length-1)]||0,coreShard:row.shards[Math.min(level(row.id),row.shards.length-1)]||0});
  const prereqMet=row=>!row.requires||level(row.requires)>=Math.max(1,byId(row.requires)?.max||1);
  window.stackfallEquipmentSlotLimit=()=>{
    const fifth=level('slot5')>0?1:0,sixth=fifth&&level('slot6')>0?1:0;
    return 4+fifth+sixth;
  };
  window.stackfallCurrencyMultiplier=()=>Math.max(.25,(1+valueAt(byId('salvage'))*.01)*(window.stackfallDifficultyRewardMultiplier?.()||1));
  window.STACKFALL_META_UPGRADES=CATALOG;

  const baseDamageMult=damageMult;
  damageMult=function metaUpgradeDamageMult(){return baseDamageMult()*(1+valueAt(byId('output'))*.01);};
  const baseHasteMult=hasteMult;
  hasteMult=function metaUpgradeHasteMult(){return Math.max(.14,baseHasteMult()*(1-valueAt(byId('cycle'))*.01));};
  const baseMagnetRange=magnetRange;
  magnetRange=function metaUpgradeMagnetRange(){return baseMagnetRange()+valueAt(byId('magnet'));};
  const baseDamageReduction=damageReduction;
  damageReduction=function metaUpgradeDamageReduction(){return Math.min(.82,baseDamageReduction()+valueAt(byId('armor'))*.01);};
  const baseResetGame=resetGame;
  resetGame=function metaUpgradeResetGame(){
    baseResetGame();state.runCurrencyEarned={stardust:0,coreShard:0};
    const hpBonus=1+valueAt(byId('vitality'))*.01;
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

  const screen=document.querySelector('#upgradeScreen'),entry=document.querySelector('#upgradeHubBtn'),closeBtn=document.querySelector('#upgradeCloseBtn'),nodeRoot=document.querySelector('#upgradeNodes'),links=document.querySelector('#upgradeLinks'),buyBtn=document.querySelector('#upgradeBuyBtn'),resetBtn=document.querySelector('#upgradeResetBtn'),coreCanvas=document.querySelector('#upgradeCoreCanvas');
  const profileEntry=document.querySelector('#hubProfile'),profileScreen=document.querySelector('#profileScreen'),profileCloseBtn=document.querySelector('#profileCloseBtn'),profileRenameBtn=document.querySelector('#profileRenameBtn'),profileNameEditor=document.querySelector('#profileNameEditor'),profileNameInput=document.querySelector('#profileNameInput'),profileNameSaveBtn=document.querySelector('#profileNameSaveBtn');
  const detail={category:document.querySelector('#upgradeCategory'),name:document.querySelector('#upgradeName'),desc:document.querySelector('#upgradeDesc'),level:document.querySelector('#upgradeLevel'),effect:document.querySelector('#upgradeEffect'),cost:document.querySelector('#upgradeCost'),lock:document.querySelector('#upgradeLockReason')};
  let selected='vitality',animationFrame=0,lastFocus=null,profileLastFocus=null;

  function effectText(row,nextLevel=level(row.id)){
    if(row.id==='slot5'||row.id==='slot6')return tr(row.effect);
    return fmt(row.effect,valueAt(row,nextLevel));
  }
  function effectLabels(){
    const lang=GAME_SETTINGS.language||'ko';
    if(lang==='en')return{current:'CURRENT',next:'NEXT',gain:'GAIN',breakthrough:'BREAKTHROUGH'};
    if(lang==='ja')return{current:'現在',next:'次',gain:'増加',breakthrough:'突破'};
    if(lang==='zh-CN')return{current:'当前',next:'下一等级',gain:'提升',breakthrough:'突破'};
    if(lang==='es')return{current:'ACTUAL',next:'SIGUIENTE',gain:'MEJORA',breakthrough:'AVANCE'};
    if(lang==='fr')return{current:'ACTUEL',next:'SUIVANT',gain:'GAIN',breakthrough:'PALIER'};
    return{current:'현재',next:'다음',gain:'증가',breakthrough:'돌파'};
  }
  function nextGainText(row,lv){
    if(row.id==='slot5'||row.id==='slot6')return'';
    const gain=valueAt(row,Math.min(row.max,lv+1))-valueAt(row,lv);
    return row.id==='magnet'?'+'+gain:'+'+gain+'%';
  }
  function investedCost(){
    const refund={stardust:0,coreShard:0};
    for(const row of CATALOG){
      const lv=Math.min(row.max,level(row.id));
      for(let i=0;i<lv;i++){refund.stardust+=Number(row.cost[i])||0;refund.coreShard+=Number(row.shards[i])||0;}
    }
    return refund;
  }
  function resetLabels(){
    const lang=GAME_SETTINGS.language||'ko';
    if(lang==='en')return{button:'RESET ALL · FULL REFUND',confirm:'Reset every Core Development upgrade and refund all Stardust and Core Shards?'};
    if(lang==='ja')return{button:'全リセット · 全額返却',confirm:'コア成長をすべて初期化し、使用したスターダストとコア欠片を全額返却しますか？'};
    if(lang==='zh-CN')return{button:'全部重置 · 全额返还',confirm:'重置全部核心成长，并返还所有已消耗的星尘和核心碎片吗？'};
    if(lang==='es')return{button:'REINICIAR TODO · REEMBOLSO TOTAL',confirm:'¿Restablecer todo el desarrollo del núcleo y devolver todo el Polvo Estelar y los Fragmentos de Núcleo?'};
    if(lang==='fr')return{button:'TOUT RÉINITIALISER · REMBOURSEMENT INTÉGRAL',confirm:'Réinitialiser tout le développement du noyau et rembourser toute la Poussière d’étoile et tous les Fragments de noyau ?'};
    return{button:'전체 초기화 · 전액 환불',confirm:'코어 성장 전체를 초기화하고 사용한 성진과 코어 조각을 전액 돌려받을까요?'};
  }
  function renderResetButton(){
    if(!resetBtn)return;
    const refund=investedCost(),labels=resetLabels(),parts=[];
    if(refund.stardust)parts.push('✦ '+refund.stardust);
    if(refund.coreShard)parts.push('◆ '+refund.coreShard);
    resetBtn.disabled=!parts.length;
    resetBtn.textContent=labels.button+(parts.length?' · '+parts.join(' / '):'');
  }
  function resetAllUpgrades(){
    const refund=investedCost();if(!refund.stardust&&!refund.coreShard)return;
    if(!window.confirm(resetLabels().confirm))return;
    for(const row of CATALOG)if(level(row.id)>0)window.stackfallSetUpgradeLevel?.(row.id,0);
    if(refund.stardust)window.stackfallGrantCurrency?.('stardust',refund.stardust);
    if(refund.coreShard)window.stackfallGrantCurrency?.('coreShard',refund.coreShard);
    try{audio.resonance();}catch{}
    renderUpgradeUi();renderLoadout?.();
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
    const labels=effectLabels(),nextLv=Math.min(row.max,lv+1),breakthrough=!maxed(row)&&cost.coreShard>0;
    if(maxed(row))detail.effect.innerHTML='<span class="upgrade-effect-current"><small>'+labels.current+'</small><b>'+effectText(row,lv)+'</b></span>';
    else detail.effect.innerHTML='<span class="upgrade-effect-current"><small>'+labels.current+'</small><b>'+(lv>0?effectText(row,lv):'—')+'</b></span><span class="upgrade-effect-next"><small>'+labels.next+'</small><b>'+effectText(row,nextLv)+'</b><em>'+labels.gain+' '+nextGainText(row,lv)+'</em></span>'+(breakthrough?'<strong class="upgrade-breakthrough">◆ '+labels.breakthrough+'</strong>':'');
    detail.cost.innerHTML=maxed(row)?'<strong>'+tr('upgrade.maxed')+'</strong>':('<span><i>✦</i>'+cost.stardust+'</span>'+(cost.coreShard?'<span class="breakthrough-cost"><i>◆</i>'+cost.coreShard+'</span>':''));
    detail.lock.textContent=!prereqMet(row)?fmt('upgrade.requires',tr(byId(row.requires)?.name||row.requires)):stateName==='poor'?tr('upgrade.insufficient'):'';
    buyBtn.disabled=maxed(row)||!prereqMet(row)||stateName==='poor';buyBtn.querySelector('span').textContent=maxed(row)?tr('upgrade.maxed'):tr('upgrade.buy');
  }
  function renderProfile(){
    const m=window.stackfallMeta||{},clears=m.clearedStages?.length||0,totalStages=window.STACKFALL_STAGE_CATALOG?.length||18,dust=currency('stardust'),shards=currency('coreShard'),name=(String(m.profileName||'').trim()||tr('profile.name'));
    const set=(id,value)=>{const el=document.querySelector(id);if(el)el.textContent=String(value);};
    set('#profileNameHub',name);set('#profileTitle',name);set('#profileClearCount',clears+' / '+totalStages);set('#profileStardust',dust);set('#profileCoreShard',shards);set('#upgradeStardust',dust);set('#upgradeCoreShard',shards);
    set('#profileDetailClears',clears+' / '+totalStages);set('#profileDetailRuns',m.lifetime?.runs||0);set('#profileDetailKills',m.lifetime?.kills||0);set('#profileDetailBosses',m.lifetime?.bosses||0);
    set('#profileDetailSlots',window.stackfallEquipmentSlotLimit?.()||4);set('#profileDetailWeapons',(m.unlockedWeapons?.length||0)+1);set('#profileDetailStardust',dust);set('#profileDetailCoreShard',shards);
    if(profileRenameBtn){profileRenameBtn.title=tr('profile.rename');profileRenameBtn.setAttribute('aria-label',tr('profile.rename'));}
  }
  function openNameEditor(){
    if(!profileNameEditor||!profileNameInput)return;const m=window.stackfallMeta||{};profileNameInput.value=String(m.profileName||'').trim()||tr('profile.name');profileNameEditor.classList.remove('hidden');profileNameInput.focus();profileNameInput.select();
  }
  function closeNameEditor(){profileNameEditor?.classList.add('hidden');}
  function saveProfileName(){if(!profileNameInput)return;window.stackfallSetProfileName?.(profileNameInput.value);closeNameEditor();renderProfile();try{audio.pickup();}catch{}}

  function renderResultReward(){
    const root=document.querySelector('#resultCurrencyReward');if(!root)return;const reward=state.lastMetaReward||{stardust:0,coreShard:0},cashout=state.lastAwakeningCoreCashout||{cores:0,stardust:0};
    root.innerHTML=reward.stardust||reward.coreShard?'<span>'+tr('currency.earned')+'</span>'+(reward.stardust?'<b>✦ '+reward.stardust+'</b>':'')+(reward.coreShard?'<b>◆ '+reward.coreShard+'</b>':'')+(cashout.cores?'<em>CORE ×'+cashout.cores+' → ✦ '+cashout.stardust+'</em>':''):'';
  }
  function renderUpgradeUi(){renderProfile();renderLinks();renderNodes();renderDetail();renderResetButton();}
  window.renderStackfallMetaUi=renderUpgradeUi;

  function buySelected(){
    const row=byId(selected);if(!row||maxed(row)||!prereqMet(row))return;
    const cost=costAt(row);if(!window.stackfallSpendCurrency?.(cost))return;
    window.stackfallSetUpgradeLevel?.(row.id,level(row.id)+1);
    try{audio.resonance();}catch{}
    renderUpgradeUi();renderLoadout?.();
  }
  resetBtn?.addEventListener('click',resetAllUpgrades);
  function open(){
    if(!screen)return;lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;screen.classList.remove('hidden');renderUpgradeUi();startCoreAnimation();closeBtn?.focus();try{audio.pickup();}catch{}
  }
  function close(){
    if(!screen)return;screen.classList.add('hidden');stopCoreAnimation();if(lastFocus?.isConnected)lastFocus.focus();lastFocus=null;
  }
  function openProfile(){
    if(!profileScreen)return;profileLastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;renderProfile();profileScreen.classList.remove('hidden');profileCloseBtn?.focus();try{audio.pickup();}catch{}
  }
  function closeProfile(restoreFocus=true){
    if(!profileScreen)return;profileScreen.classList.add('hidden');if(restoreFocus&&profileLastFocus?.isConnected)profileLastFocus.focus();profileLastFocus=null;
  }
  entry?.addEventListener('click',open);closeBtn?.addEventListener('click',close);buyBtn?.addEventListener('click',buySelected);
  profileEntry?.addEventListener('click',openProfile);profileCloseBtn?.addEventListener('click',()=>closeProfile());
  profileRenameBtn?.addEventListener('click',openNameEditor);profileNameSaveBtn?.addEventListener('click',saveProfileName);
  profileNameInput?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();saveProfileName();}else if(event.key==='Escape'){event.preventDefault();closeNameEditor();profileRenameBtn?.focus();}});
  profileScreen?.addEventListener('click',event=>{if(event.target===profileScreen)closeProfile();});
  window.addEventListener('keydown',event=>{
    if(event.code!=='Escape')return;
    if(profileNameEditor&&!profileNameEditor.classList.contains('hidden')){event.preventDefault();event.stopImmediatePropagation();closeNameEditor();profileRenameBtn?.focus();return;}
    if(profileScreen&&!profileScreen.classList.contains('hidden')){event.preventDefault();event.stopImmediatePropagation();closeProfile();return;}
    if(screen&&!screen.classList.contains('hidden')){event.preventDefault();event.stopImmediatePropagation();close();}
  },true);

  function drawCore(now=0){
    if(!coreCanvas)return;const g=coreCanvas.getContext('2d'),w=coreCanvas.width,h=coreCanvas.height;
    g.clearRect(0,0,w,h);
    if(typeof window.stackfallDrawPlayerCorePreview==='function'){window.stackfallDrawPlayerCorePreview(g,w/2,h/2,now,2.55);return;}
  }
  function animateCore(now){if(!screen||screen.classList.contains('hidden')){animationFrame=0;return;}drawCore(now);animationFrame=requestAnimationFrame(animateCore);}
  function startCoreAnimation(){if(animationFrame)return;animationFrame=requestAnimationFrame(animateCore);}
  function stopCoreAnimation(){if(animationFrame)cancelAnimationFrame(animationFrame);animationFrame=0;}

  const baseShowMainMenu=showMainMenu;
  showMainMenu=function metaAwareMainMenu(){baseShowMainMenu();close();closeProfile(false);renderProfile();};
  const baseApplyLanguage=applyLanguage;
  applyLanguage=function metaAwareLanguage(){baseApplyLanguage();renderUpgradeUi();};

  renderProfile();renderResultReward();
})();