(()=>{
  'use strict';

  const achievementLabel=()=>{
    const lang=GAME_SETTINGS?.language||'ko';
    if(lang==='ko')return'업적';
    if(lang==='ja')return'実績';
    if(lang==='zh-CN')return'成就';
    if(lang==='es')return'Logros';
    if(lang==='fr')return'Succès';
    return'Achievements';
  };

  function completedCount(){
    const progression=window.stackfallEndlessProgression,rows=progression?.achievements||[],done=new Set(progression?.progress?.completed||[]);
    return{complete:rows.reduce((count,row)=>count+(done.has(row.id)?1:0),0),total:rows.length};
  }

  function placeAchievementSection(){
    const modal=document.querySelector('#profileScreen .profile-modal'),details=document.querySelector('#profileAchievementDetails');
    if(!modal||!details)return null;
    const firstDetails=modal.querySelector('.profile-details');
    if(firstDetails&&firstDetails!==details)firstDetails.insertAdjacentElement('beforebegin',details);
    return details;
  }

  function renderAchievementEntry(){
    if(!window.stackfallEndlessProgression)return false;
    const{complete,total}=completedCount(),hub=document.querySelector('#hubProfile'),label=hub?.querySelector('.hub-profile-copy>small>span'),count=document.querySelector('#profileClearCount');
    if(label)label.textContent=achievementLabel();
    if(count)count.textContent=`${complete} / ${total}`;
    placeAchievementSection();
    return true;
  }

  function openProfileAchievements(){
    queueMicrotask(()=>{
      window.stackfallEndlessProgression?.renderProfile?.();
      renderAchievementEntry();
      const details=placeAchievementSection();
      if(details)details.open=true;
    });
  }

  const hub=document.querySelector('#hubProfile');
  hub?.addEventListener('click',openProfileAchievements);

  const baseMetaRender=window.renderStackfallMetaUi;
  if(typeof baseMetaRender==='function'&&!baseMetaRender.__achievementProfileEntryV2){
    const wrapped=function(){const result=baseMetaRender(...arguments);renderAchievementEntry();return result;};
    wrapped.__achievementProfileEntryV2=true;
    window.renderStackfallMetaUi=wrapped;
  }

  const baseShowMainMenu=showMainMenu;
  showMainMenu=function achievementEntryMainMenu(){const result=baseShowMainMenu(...arguments);renderAchievementEntry();return result;};
  const baseApplyLanguage=applyLanguage;
  applyLanguage=function achievementEntryLanguage(){const result=baseApplyLanguage(...arguments);renderAchievementEntry();return result;};

  const style=document.createElement('style');
  style.textContent=`
    @media(min-width:981px){
      #menu #stageMapBtn{grid-column:8/13!important;grid-row:2!important;padding:20px 24px}
      #menu #stageMapBtn .hub-mode-kicker{font-size:8px;letter-spacing:.18em}
      #menu #stageMapBtn strong{font-size:28px}
      #menu #stageMapBtn p{display:block;width:78%;margin-top:8px;font-size:9px;line-height:1.45}
    }
  `;
  document.head.appendChild(style);

  renderAchievementEntry();
})();
