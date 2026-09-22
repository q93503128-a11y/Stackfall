(()=>{
  const screen=document.querySelector('#sortiePrepScreen'),closeButton=document.querySelector('#sortiePrepClose'),backButton=document.querySelector('#sortieBackBtn'),launchButton=document.querySelector('#sortieLaunchBtn');
  const kicker=document.querySelector('#sortiePrepKicker'),title=document.querySelector('#sortiePrepTitle'),modeLabel=document.querySelector('#sortieModeLabel'),targetName=document.querySelector('#sortieTargetName'),targetDesc=document.querySelector('#sortieTargetDesc'),targetTime=document.querySelector('#sortieTargetTime'),difficultySummary=document.querySelector('#sortieDifficultySummary'),difficultyMount=document.querySelector('#sortieDifficultyMount');
  if(!screen||!closeButton||!backButton||!launchButton)return;
  let returnTo='menu',lastFocus=null;
  const localized=value=>value?.[GAME_SETTINGS.language]||value?.en||value?.ko||'';
  const replaceNumber=(key,value)=>String(tr(key)).replace('{n}',String(value));
  function difficultyName(){
    const key=state.selectedDifficulty||'normal';
    return tr('sortie.difficulty.'+key);
  }
  function stageDurationText(stage){
    const seconds=Math.max(60,Math.round(Number(stage?.boss?.spawnAt??stage?.durationSeconds??0))),m=Math.floor(seconds/60),s=seconds%60;
    return s?`${m}:${String(s).padStart(2,'0')}`:replaceNumber('sortie.minutes',m);
  }
  function renderContext(){
    const config=window.stackfallCurrentRunConfig?.();
    if(config?.mode==='stage'&&config.stage){
      const stage=config.stage;
      kicker.textContent=tr('sortie.kicker.stage');title.textContent=tr('sortie.title');
      modeLabel.textContent=tr('sortie.stageMode');targetName.textContent=localized(stage.title)||('STAGE '+stage.order);
      targetDesc.textContent=localized(stage.description);
      targetTime.textContent=stageDurationText(stage);
    }else{
      kicker.textContent=tr('sortie.kicker.endless');title.textContent=tr('sortie.title');
      modeLabel.textContent=tr('sortie.endlessMode');targetName.textContent=tr('sortie.endlessTitle');
      targetDesc.textContent=tr('sortie.endlessDesc');targetTime.textContent=tr('sortie.noLimit');
    }
    difficultySummary.textContent=difficultyName();
  }
  function renderLoadout(){
    renderStarterOptions?.();
    window.renderStackfallDifficulty?.();
    renderContext();
  }
  function open(mode='endless',stageId=null,options={}){
    if(window.stackfallSetRunSelection?.(mode,stageId)!==true)return false;
    returnTo=options.returnTo||'menu';lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    renderLoadout();screen.classList.remove('hidden');closeButton.focus();try{audio.pickup();}catch{}return true;
  }
  function close(){
    screen.classList.add('hidden');
    if(lastFocus?.isConnected)lastFocus.focus();lastFocus=null;
  }
  function launch(){
    if(screen.classList.contains('hidden'))return;
    screen.classList.add('hidden');window.closeStackfallGalaxyMap?.();audio.init();resetGame();
  }
  closeButton.addEventListener('click',close);backButton.addEventListener('click',close);launchButton.addEventListener('click',launch);
  difficultyMount?.addEventListener('click',()=>queueMicrotask(()=>{difficultySummary.textContent=difficultyName();}));
  window.addEventListener('keydown',event=>{if(event.code==='Escape'&&!screen.classList.contains('hidden')){event.preventDefault();event.stopImmediatePropagation();close();}},true);
  window.openStackfallSortiePrep=open;window.closeStackfallSortiePrep=close;window.renderStackfallSortiePrep=renderLoadout;
})();