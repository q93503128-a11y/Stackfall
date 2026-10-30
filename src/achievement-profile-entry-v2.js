(()=>{
  'use strict';

  const progression=()=>window.stackfallEndlessProgression;
  const lang=()=>GAME_SETTINGS?.language||'ko';
  const copy=()=>lang()==='ko'?{
    label:'업적',kicker:'ACHIEVEMENTS',title:'업적',desc:'도전 기록과 보상을 확인합니다.',screenDesc:'목표를 달성해 장비와 기능, 재화를 획득합니다.',reward:'보상',complete:'달성',incomplete:'미달성',close:'닫기',feature:'기능 해금',stardust:'성진',shard:'코어 조각'
  }:{
    label:'Achievements',kicker:'ACHIEVEMENTS',title:'Achievements',desc:'View challenges and rewards.',screenDesc:'Complete objectives to earn weapons, features, and currency.',reward:'Reward',complete:'COMPLETE',incomplete:'INCOMPLETE',close:'Close',feature:'Feature unlock',stardust:'Stardust',shard:'Core Shard'
  };

  function localized(value){return value?.[lang()]||value?.en||value?.ko||'';}
  function counts(){
    const p=progression(),rows=p?.achievements||[],done=new Set(p?.progress?.completed||[]);
    return{complete:rows.reduce((n,row)=>n+(done.has(row.id)?1:0),0),total:rows.length};
  }
  function currentValue(row){
    const p=progression()?.progress||{},meta=window.stackfallMeta||{},stats=p.stats||{},boss=meta.bossRecords||{},life=meta.lifetime||{};
    switch(row.kind){
      case'runs':return Number(life.runs)||0;
      case'survive':return Number(p.bestSurvival)||0;
      case'hardSurvive':return Number(p.bestHardSurvival)||0;
      case'veryHardSurvive':return Number(p.bestVeryHardSurvival)||0;
      case'mini':return Number(boss.mini)||0;
      case'boss':return Number(boss.boss)||0;
      case'apex':return Number(boss.apex)||0;
      case'void':return Number(boss.void)||0;
      case'crash':return Number(boss.crash)||0;
      case'level':return Number(p.bestLevel)||0;
      case'chain':return Number(p.bestCombo)||0;
      case'runKills':return Number(p.bestRunKills)||0;
      case'lifetimeKills':return Number(life.kills)||0;
      case'weaponStack':return Number(stats.maxWeaponStack)||0;
      case'maxedWeapons':return Number(stats.maxedWeapons)||0;
      case'filledWeapons':return Number(stats.filledWeapons)||0;
      case'killBurst':return Number(stats.killBurst)||0;
      case'bossNoHit':return Number(stats.bossNoHit)||0;
      case'bossFast':return Number(stats.bossFast)||0;
      case'legacyStack':return Number(stats.maxApexLegacyStack)||0;
      case'coreStack':return Number(stats.maxApexCoreStack)||0;
      case'apexForms':return Object.values(stats.apexForms||{}).filter(v=>(Number(v)||0)>0).length;
      default:return 0;
    }
  }
  function formatValue(value,format){
    const n=Math.max(0,Math.floor(Number(value)||0));
    if(format!=='time')return n.toLocaleString();
    const m=Math.floor(n/60),s=n%60;return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  function rewardLabel(item){
    if(item.type==='unlock_weapon'){
      const named=typeof weaponText==='function'?weaponText(item.key)?.name:WEAPONS?.[item.key]?.name;
      return named||copy().reward;
    }
    if(item.type==='unlock_feature')return copy().feature;
    if(item.type==='currency')return`${item.key==='coreShard'?copy().shard:copy().stardust} +${Math.max(1,Math.floor(Number(item.amount)||1)).toLocaleString()}`;
    return copy().reward;
  }
  function rewardSummary(row){return(row.rewards||[]).map(rewardLabel).join(' · ');}

  function removeProfileAchievementList(){document.querySelector('#profileAchievementDetails')?.remove();}
  function renderProfileSummary(){
    const p=progression();if(!p)return false;const{complete,total}=counts();
    const hub=document.querySelector('#hubProfile'),label=hub?.querySelector('.hub-profile-copy>small>span'),count=document.querySelector('#profileClearCount');
    if(label)label.textContent=copy().label;if(count)count.textContent=`${complete} / ${total}`;
    const profileValue=document.querySelector('#profileDetailWeapons'),profileLabel=profileValue?.parentElement?.querySelector('span');
    if(profileLabel)profileLabel.textContent=copy().label;if(profileValue)profileValue.textContent=`${complete} / ${total}`;
    removeProfileAchievementList();return true;
  }

  function ensureAchievementUi(){
    const hub=document.querySelector('#menu .hub-panel');if(!hub)return null;
    let entry=document.querySelector('#achievementHubBtn');
    if(!entry){
      entry=document.createElement('button');entry.id='achievementHubBtn';entry.className='hub-mode-card achievement-card';entry.type='button';
      (document.querySelector('#upgradeHubBtn')||hub.lastElementChild)?.insertAdjacentElement('afterend',entry);
      entry.addEventListener('click',openAchievements);
    }
    let screen=document.querySelector('#achievementScreen');
    if(!screen){
      screen=document.createElement('section');screen.id='achievementScreen';screen.className='overlay achievement-screen hidden';screen.setAttribute('aria-labelledby','achievementTitle');
      screen.innerHTML='<div class="achievement-modal glass"><div class="achievement-heading"><div><span id="achievementKicker"></span><h2 id="achievementTitle"></h2><p id="achievementDesc"></p></div><div class="achievement-total"><b id="achievementTotal"></b><i><span id="achievementTotalFill"></span></i></div><button id="achievementCloseBtn" type="button" aria-label="Close">×</button></div><div id="achievementBody" class="achievement-body"></div></div>';
      document.querySelector('#app')?.appendChild(screen);
      screen.querySelector('#achievementCloseBtn')?.addEventListener('click',closeAchievements);
      screen.addEventListener('pointerdown',e=>{if(e.target===screen)closeAchievements();});
    }
    return{entry,screen};
  }
  function renderAchievementUi(){
    const p=progression();if(!p)return;const ui=ensureAchievementUi();if(!ui)return;const c=copy(),rows=p.achievements||[],done=new Set(p.progress?.completed||[]),{complete,total}=counts();
    ui.entry.innerHTML=`<span class="hub-mode-kicker">${c.kicker}</span><strong>${c.title}</strong><p>${c.desc}</p><i>★</i>`;
    const screen=ui.screen;screen.querySelector('#achievementKicker').textContent=c.kicker;screen.querySelector('#achievementTitle').textContent=c.title;screen.querySelector('#achievementDesc').textContent=c.screenDesc;screen.querySelector('#achievementTotal').textContent=`${complete} / ${total}`;screen.querySelector('#achievementTotalFill').style.width=`${total?complete/total*100:0}%`;
    screen.querySelector('#achievementBody').innerHTML=`<div class="achievement-grid achievement-grid-single">${rows.map(row=>{const isDone=done.has(row.id),value=Math.min(currentValue(row),Number(row.value)||0),status=isDone?c.complete:c.incomplete,progressText=isDone?`${formatValue(row.value,row.format)} / ${formatValue(row.value,row.format)}`:`${formatValue(value,row.format)} / ${formatValue(row.value,row.format)}`;return`<article class="achievement-row${isDone?' complete':''}"><div class="achievement-reward-icon">${isDone?'✓':'◇'}</div><div class="achievement-copy"><strong>${localized(row.name)}</strong><p>${localized(row.desc)}</p><small>${c.reward} · ${rewardSummary(row)}</small></div><div class="achievement-status"><b>${status}</b><small>${progressText}</small></div></article>`;}).join('')}</div>`;
    renderProfileSummary();
  }

  let returnFocus=null;
  function openAchievements(){const ui=ensureAchievementUi();if(!ui)return;renderAchievementUi();returnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;ui.screen.classList.remove('hidden');ui.screen.querySelector('#achievementCloseBtn')?.focus();try{audio.pickup();}catch{}}
  function closeAchievements(){const screen=document.querySelector('#achievementScreen');if(!screen)return;screen.classList.add('hidden');if(returnFocus?.isConnected)returnFocus.focus();returnFocus=null;}

  const profileModal=document.querySelector('#profileScreen .profile-modal');
  if(profileModal)new MutationObserver(()=>removeProfileAchievementList()).observe(profileModal,{childList:true,subtree:true});
  document.querySelector('#hubProfile')?.addEventListener('click',()=>queueMicrotask(renderProfileSummary));

  const baseMetaRender=window.renderStackfallMetaUi;
  if(typeof baseMetaRender==='function'&&!baseMetaRender.__achievementHubV2){const wrapped=function(){const result=baseMetaRender(...arguments);renderProfileSummary();renderAchievementUi();return result;};wrapped.__achievementHubV2=true;window.renderStackfallMetaUi=wrapped;}
  const baseShowMainMenu=showMainMenu;showMainMenu=function achievementHubMainMenu(){const result=baseShowMainMenu(...arguments);renderAchievementUi();return result;};
  const baseApplyLanguage=applyLanguage;applyLanguage=function achievementHubLanguage(){const result=baseApplyLanguage(...arguments);renderAchievementUi();return result;};
  window.addEventListener('keydown',e=>{const screen=document.querySelector('#achievementScreen');if(e.code==='Escape'&&screen&&!screen.classList.contains('hidden')){e.preventDefault();e.stopImmediatePropagation();closeAchievements();}},true);

  const style=document.createElement('style');style.textContent=`
    #profileAchievementDetails{display:none!important}
    #achievementScreen .achievement-section{display:block!important}
    #achievementScreen .achievement-grid-single{display:block!important}
    #achievementScreen .achievement-copy>small{display:block;margin-top:5px;color:#7385a9;font-size:8px;line-height:1.35}
    #achievementScreen .achievement-row.complete .achievement-copy>small{color:#83bfa1}
  `;document.head.appendChild(style);

  renderAchievementUi();
})();
