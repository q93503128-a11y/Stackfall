(()=>{
  const screen=document.querySelector('#galaxyMapScreen'),entry=document.querySelector('#stageMapBtn'),closeButton=document.querySelector('#galaxyMapClose'),canvas=document.querySelector('#galaxyMapCanvas'),starfield=document.querySelector('#galaxyStarfield'),nodeLayer=document.querySelector('#galaxyStageNodes'),connections=document.querySelector('#galaxyConnections'),launch=document.querySelector('#galaxyLaunchBtn'),prevPage=document.querySelector('#galaxyConstellationPrev'),nextPage=document.querySelector('#galaxyConstellationNext'),pageName=document.querySelector('#galaxyConstellationName'),pageCount=document.querySelector('#galaxyConstellationPage');
  if(!screen||!entry||!closeButton||!canvas||!starfield||!nodeLayer||!connections||!launch)return;
  const detail={number:document.querySelector('#galaxyStageNumber'),status:document.querySelector('#galaxyStageStatus'),name:document.querySelector('#galaxyStageName'),desc:document.querySelector('#galaxyStageDesc'),time:document.querySelector('#galaxyStageTime'),threat:document.querySelector('#galaxyStageThreat'),unlocks:document.querySelector('#galaxyStageUnlocks'),boss:document.querySelector('#galaxyStageBoss')};
  const constellations=()=>[...(window.STACKFALL_CONSTELLATIONS||[])].sort((a,b)=>a.order-b.order),allStages=()=>[...(window.STACKFALL_STAGE_CATALOG||[])].sort((a,b)=>a.order-b.order);
  let selectedId=allStages()[0]?.id||null,currentConstellationId=allStages()[0]?.constellationId||constellations()[0]?.id||null,lastFocus=null;
  const localized=value=>value?.[GAME_SETTINGS.language]||value?.en||value?.ko||'',statusText=status=>status==='available'?tr('stageMap.available'):status==='cleared'?tr('stageMap.cleared'):status==='locked'?'🔒 '+tr('stageMap.locked'):tr('stageMap.planned'),durationText=seconds=>{const total=Math.max(0,Math.round(Number(seconds)||0)),m=Math.floor(total/60),s=total%60;return s?`${m}:${String(s).padStart(2,'0')}`:String(tr('stageMap.minutes')).replace('{n}',String(m));};
  const stagesFor=id=>allStages().filter(stage=>stage.constellationId===id);
  const mapTheme=id=>id==='constellation-02'?'bloom':id==='constellation-03'?'array':'route';
  function constellationAccessible(page){const first=stagesFor(page.id)[0];if(!first)return false;if(page.order===1)return true;const status=window.stackfallStageStatus?.(first)||first.status;return status==='available'||status==='cleared';}
  function pages(){const list=constellations();return list.filter(constellationAccessible);}
  function visibleStages(){return stagesFor(currentConstellationId);}
  function unlockText(stage){
    const rewards=stage.rewards||[],parts=[];
    for(const reward of rewards){
      if(reward.type==='weapon'){
        const unlocked=window.stackfallIsWeaponUnlocked?.(reward.key)===true,name=typeof weaponText==='function'?weaponText(reward.key).name:reward.key;
        parts.push('무기 · '+name+'|'+(unlocked?'1 / 1':'0 / 1'));
      }else if(reward.type==='feature'){
        const acquired=window.stackfallIsFeatureAcquired?.(reward.key)===true,name=window.stackfallFeatureName?.(reward.key)||reward.key;
        parts.push(name+'|'+(acquired?'✓':'◇'));
      }
    }
    return parts;
  }
  function renderUnlocks(stage){
    if(!detail.unlocks)return;detail.unlocks.innerHTML='';const rows=unlockText(stage);
    if(!rows.length){detail.unlocks.textContent=tr('stageMap.none');return;}
    for(const row of rows){const split=row.lastIndexOf('|'),line=document.createElement('span'),label=document.createElement('span'),value=document.createElement('b');line.className='galaxy-unlock-row';label.textContent=row.slice(0,split);value.textContent=row.slice(split+1);line.append(label,value);detail.unlocks.appendChild(line);}
  }
  function renderStarfield(){if(starfield.childElementCount)return;const fragment=document.createDocumentFragment();for(let i=0;i<54;i++){const star=document.createElement('i'),x=(17+i*73)%997,y=(43+i*137)%641,size=1+(i%5===0?2:i%3===0?1:0);star.style.setProperty('--x',(x/10)+'%');star.style.setProperty('--y',(y/6.5)+'%');star.style.setProperty('--s',size+'px');star.style.setProperty('--d',((i%9)*-.31)+'s');fragment.appendChild(star);}starfield.appendChild(fragment);}
  function renderConstellationHeader(){const list=pages(),index=Math.max(0,list.findIndex(page=>page.id===currentConstellationId)),page=list[index]||list[0]||null;if(page&&page.id!==currentConstellationId)currentConstellationId=page.id;const theme=mapTheme(page?.id);canvas.dataset.constellationTheme=theme;screen.dataset.constellationTheme=theme;if(pageName)pageName.textContent=localized(page?.title)||tr('stageMap.title');if(pageCount)pageCount.textContent=list.length?String(index+1)+' / '+String(list.length):'0 / 0';if(prevPage)prevPage.disabled=index<=0;if(nextPage)nextPage.disabled=index<0||index>=list.length-1;}
  function renderConnections(){
    connections.innerHTML='';const stages=visibleStages(),ids=new Set(stages.map(stage=>stage.id)),theme=mapTheme(currentConstellationId);
    for(const stage of stages){
      const previous=window.stackfallStageById?.(stage.requirements?.previous);if(!previous||!ids.has(previous.id))continue;
      const x1=previous.node.x*1000,y1=previous.node.y*650,x2=stage.node.x*1000,y2=stage.node.y*650;
      let shape;
      if(theme==='bloom'){
        shape=document.createElementNS('http://www.w3.org/2000/svg','path');const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,bend=(stage.order%2?1:-1)*Math.min(62,len*.18),cx=(x1+x2)/2-dy/len*bend,cy=(y1+y2)/2+dx/len*bend;shape.setAttribute('d',`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
      }else if(theme==='array'){
        shape=document.createElementNS('http://www.w3.org/2000/svg','polyline');const midX=(x1+x2)/2,midY=(y1+y2)/2;shape.setAttribute('points',stage.order%2?`${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}`:`${x1},${y1} ${x1},${midY} ${x2},${midY} ${x2},${y2}`);
      }else{
        shape=document.createElementNS('http://www.w3.org/2000/svg','line');shape.setAttribute('x1',String(x1));shape.setAttribute('y1',String(y1));shape.setAttribute('x2',String(x2));shape.setAttribute('y2',String(y2));
      }
      shape.classList.add('galaxy-path','galaxy-path-'+theme);connections.appendChild(shape);
    }
  }
  function selectStage(id){const stage=window.stackfallStageById?.(id);if(!stage||stage.constellationId!==currentConstellationId)return;selectedId=stage.id;for(const button of nodeLayer.querySelectorAll('.galaxy-stage-node'))button.classList.toggle('selected',button.dataset.stageId===stage.id);const resolvedStatus=window.stackfallStageStatus?.(stage)||stage.status;detail.number.textContent='STAGE '+String(stage.order).padStart(2,'0');detail.status.textContent=statusText(resolvedStatus);detail.status.dataset.status=resolvedStatus;detail.name.textContent=localized(stage.title)||('STAGE '+stage.order);detail.desc.textContent=localized(stage.description);const gameSeconds=Math.max(60,Number(stage.boss?.spawnAt||stage.durationSeconds||stage.estimatedMinutes*60));detail.time.textContent=durationText(gameSeconds);detail.threat.textContent=String(stage.threat);renderUnlocks(stage);detail.boss.textContent=resolvedStatus==='planned'||!stage.boss?'???':localized(stage.boss.name)||String(stage.boss.id||'???');const playable=resolvedStatus==='available'||resolvedStatus==='cleared';launch.disabled=!playable;const previous=window.stackfallStageById?.(stage.requirements?.previous),lockText=previous?'🔒 STAGE '+String(previous.order).padStart(2,'0')+' 클리어 필요':'🔒 '+tr('stageMap.building');launch.querySelector('span').textContent=playable?tr('stageMap.launch'):resolvedStatus==='locked'?lockText:tr('stageMap.building');}
  function renderNodes(){nodeLayer.innerHTML='';const fragment=document.createDocumentFragment(),stages=visibleStages();for(const stage of stages){const button=document.createElement('button'),resolvedStatus=window.stackfallStageStatus?.(stage)||stage.status||'planned';button.type='button';button.className='galaxy-stage-node '+resolvedStatus;button.dataset.stageId=stage.id;button.dataset.localIndex=String((stage.order-1)%6);button.style.left=(stage.node.x*100)+'%';button.style.top=(stage.node.y*100)+'%';button.setAttribute('aria-label',(localized(stage.title)||('Stage '+stage.order))+' · '+statusText(resolvedStatus));button.innerHTML='<span class="galaxy-node-star"><i></i></span><small>'+String(stage.order).padStart(2,'0')+'</small>';button.addEventListener('click',()=>selectStage(stage.id));fragment.appendChild(button);}nodeLayer.appendChild(fragment);const selected=stages.find(stage=>stage.id===selectedId)||stages[0];if(selected)selectStage(selected.id);}
  function renderPage(){renderConstellationHeader();renderConnections();renderNodes();}
  function changePage(delta){const list=pages(),index=list.findIndex(page=>page.id===currentConstellationId),target=list[index+delta];if(!target)return;currentConstellationId=target.id;selectedId=stagesFor(target.id)[0]?.id||null;renderPage();try{audio.pickup();}catch{}}
  function openMap(){lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;renderStarfield();const selected=window.stackfallStageById?.(selectedId);if(selected?.constellationId)currentConstellationId=selected.constellationId;if(!pages().some(page=>page.id===currentConstellationId))currentConstellationId=pages()[0]?.id||currentConstellationId;renderPage();screen.classList.remove('hidden');closeButton.focus();try{audio.pickup();}catch{}}
  function closeMap(){screen.classList.add('hidden');if(lastFocus?.isConnected)lastFocus.focus();lastFocus=null;}
  entry.addEventListener('click',openMap);closeButton.addEventListener('click',closeMap);prevPage?.addEventListener('click',()=>changePage(-1));nextPage?.addEventListener('click',()=>changePage(1));screen.addEventListener('pointerdown',event=>{if(event.target===screen)closeMap();});window.addEventListener('keydown',event=>{const sortieOpen=!document.querySelector('#sortiePrepScreen')?.classList.contains('hidden');if(event.code==='Escape'&&!screen.classList.contains('hidden')&&!sortieOpen){event.preventDefault();event.stopImmediatePropagation();closeMap();}},true);
  launch.addEventListener('click',()=>{const stage=window.stackfallStageById?.(selectedId);if(!stage||launch.disabled)return;if(window.openStackfallSortiePrep?.('stage',stage.id,{returnTo:'map'}))return;if(window.stackfallSetRunSelection?.('stage',stage.id)!==true)return;closeMap();audio.init();resetGame();});
  window.openStackfallGalaxyMap=openMap;window.closeStackfallGalaxyMap=closeMap;window.renderStackfallGalaxyMap=()=>{if(!screen.classList.contains('hidden'))renderPage();};
})();