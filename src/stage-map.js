(()=>{
  const screen=document.querySelector('#galaxyMapScreen'),entry=document.querySelector('#stageMapBtn'),closeButton=document.querySelector('#galaxyMapClose'),canvas=document.querySelector('#galaxyMapCanvas'),starfield=document.querySelector('#galaxyStarfield'),nodeLayer=document.querySelector('#galaxyStageNodes'),connections=document.querySelector('#galaxyConnections'),launch=document.querySelector('#galaxyLaunchBtn');
  if(!screen||!entry||!closeButton||!canvas||!starfield||!nodeLayer||!connections||!launch)return;
  const detail={
    number:document.querySelector('#galaxyStageNumber'),status:document.querySelector('#galaxyStageStatus'),name:document.querySelector('#galaxyStageName'),desc:document.querySelector('#galaxyStageDesc'),
    time:document.querySelector('#galaxyStageTime'),threat:document.querySelector('#galaxyStageThreat'),unlocks:document.querySelector('#galaxyStageUnlocks'),boss:document.querySelector('#galaxyStageBoss')
  };
  let selectedId=window.STACKFALL_STAGE_CATALOG?.[0]?.id||null,lastFocus=null;
  const localized=value=>value?.[GAME_SETTINGS.language]||value?.en||value?.ko||'';
  const statusText=status=>status==='available'?tr('stageMap.available'):status==='cleared'?tr('stageMap.cleared'):status==='locked'?tr('stageMap.locked'):tr('stageMap.planned');
  const minuteText=minutes=>String(tr('stageMap.minutes')).replace('{n}',String(minutes));
  function unlockText(stage){
    const weaponRewards=(stage.rewards||[]).filter(reward=>reward.type==='weapon');
    if(!weaponRewards.length)return tr('stageMap.none');
    const unlocked=weaponRewards.filter(reward=>window.stackfallIsWeaponUnlocked?.(reward.key)).length;
    return tr('stageMap.weaponProgress')+' '+unlocked+'/'+weaponRewards.length;
  }
  function renderStarfield(){
    if(starfield.childElementCount)return;
    const fragment=document.createDocumentFragment();
    for(let i=0;i<54;i++){
      const star=document.createElement('i'),x=(17+i*73)%997,y=(43+i*137)%641,size=1+(i%5===0?2:i%3===0?1:0);
      star.style.setProperty('--x',(x/10)+'%');star.style.setProperty('--y',(y/6.5)+'%');star.style.setProperty('--s',size+'px');star.style.setProperty('--d',((i%9)*-.31)+'s');fragment.appendChild(star);
    }
    starfield.appendChild(fragment);
  }
  function renderConnections(){
    connections.innerHTML='';
    const stages=[...(window.STACKFALL_STAGE_CATALOG||[])].sort((a,b)=>a.order-b.order);
    for(let i=1;i<stages.length;i++){
      const a=stages[i-1],b=stages[i],line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',String(a.node.x*1000));line.setAttribute('y1',String(a.node.y*650));line.setAttribute('x2',String(b.node.x*1000));line.setAttribute('y2',String(b.node.y*650));line.classList.add('galaxy-path');connections.appendChild(line);
    }
  }
  function selectStage(id){
    const stage=window.stackfallStageById?.(id);if(!stage)return;
    selectedId=stage.id;
    for(const button of nodeLayer.querySelectorAll('.galaxy-stage-node'))button.classList.toggle('selected',button.dataset.stageId===stage.id);
    const resolvedStatus=window.stackfallStageStatus?.(stage)||stage.status;
    detail.number.textContent='STAGE '+String(stage.order).padStart(2,'0');
    detail.status.textContent=statusText(resolvedStatus);detail.status.dataset.status=resolvedStatus;
    detail.name.textContent=localized(stage.title)||('STAGE '+stage.order);
    detail.desc.textContent=localized(stage.description);
    const gameMinutes=Math.max(1,Math.round(Number(stage.boss?.spawnAt||stage.durationSeconds||stage.estimatedMinutes*60)/60));
    detail.time.textContent=minuteText(gameMinutes);detail.threat.textContent=String(stage.threat);detail.unlocks.textContent=unlockText(stage);
    detail.boss.textContent=resolvedStatus==='planned'||!stage.boss?'???':localized(stage.boss.name)||String(stage.boss.form||stage.boss.id||'???');
    const playable=resolvedStatus==='available'||resolvedStatus==='cleared';
    launch.disabled=!playable;launch.querySelector('span').textContent=playable?tr('stageMap.launch'):tr('stageMap.building');
  }
  function renderNodes(){
    nodeLayer.innerHTML='';const fragment=document.createDocumentFragment();
    for(const stage of window.STACKFALL_STAGE_CATALOG||[]){
      const button=document.createElement('button');button.type='button';const resolvedStatus=window.stackfallStageStatus?.(stage)||stage.status||'planned';button.className='galaxy-stage-node '+resolvedStatus;button.dataset.stageId=stage.id;button.style.left=(stage.node.x*100)+'%';button.style.top=(stage.node.y*100)+'%';button.setAttribute('aria-label',(localized(stage.title)||('Stage '+stage.order))+' · '+statusText(resolvedStatus));
      button.innerHTML='<span class="galaxy-node-star"><i></i></span><small>'+String(stage.order).padStart(2,'0')+'</small>';button.addEventListener('click',()=>selectStage(stage.id));fragment.appendChild(button);
    }
    nodeLayer.appendChild(fragment);selectStage(selectedId||window.STACKFALL_STAGE_CATALOG?.[0]?.id);
  }
  function openMap(){
    lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    renderStarfield();renderConnections();renderNodes();screen.classList.remove('hidden');closeButton.focus();try{audio.pickup();}catch{}
  }
  function closeMap(){
    screen.classList.add('hidden');if(lastFocus?.isConnected)lastFocus.focus();lastFocus=null;
  }
  entry.addEventListener('click',openMap);closeButton.addEventListener('click',closeMap);
  screen.addEventListener('pointerdown',event=>{if(event.target===screen)closeMap();});
  window.addEventListener('keydown',event=>{if(event.code==='Escape'&&!screen.classList.contains('hidden')){event.preventDefault();event.stopImmediatePropagation();closeMap();}},true);
  launch.addEventListener('click',()=>{
    const stage=window.stackfallStageById?.(selectedId);if(!stage||launch.disabled)return;
    if(window.openStackfallSortiePrep?.('stage',stage.id,{returnTo:'map'}))return;
    if(window.stackfallSetRunSelection?.('stage',stage.id)!==true)return;
    closeMap();audio.init();resetGame();
  });
  window.openStackfallGalaxyMap=openMap;
  window.closeStackfallGalaxyMap=closeMap;
  window.renderStackfallGalaxyMap=()=>{if(!screen.classList.contains('hidden')){renderConnections();renderNodes();}};
})();
