(()=>{
  'use strict';

  const style=document.createElement('style');
  style.id='stackfallAchievementUiSimplification';
  style.textContent=`
    #achievementHubBtn,#achievementScreen{display:none!important}
    .achievement-toolbar{display:none!important}
    @media(min-width:761px){
      #menu .hub-panel{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);grid-template-rows:repeat(2,minmax(0,1fr))}
      #menu #startBtn{grid-column:1!important;grid-row:1/3!important}
      #menu #upgradeHubBtn{grid-column:2!important;grid-row:1!important}
      #menu #stageMapBtn{grid-column:2!important;grid-row:2!important}
    }
    @media(pointer:coarse) and (orientation:landscape){
      #menu #startBtn{grid-column:1/8!important;grid-row:1/3!important}
      #menu #upgradeHubBtn{grid-column:8/13!important;grid-row:1!important}
      #menu #stageMapBtn{grid-column:8/13!important;grid-row:2!important}
    }
  `;
  document.head.appendChild(style);

  const lang=()=>typeof GAME_SETTINGS!=='undefined'&&GAME_SETTINGS?.language||'ko';
  const localized=value=>value?.[lang()]||value?.en||value?.ko||'';
  const labels=()=>{
    switch(lang()){
      case'en':return{title:'Achievements',expand:'View details',unlocked:'UNLOCKED'};
      case'ja':return{title:'実績',expand:'詳細を見る',unlocked:'達成'};
      case'zh-CN':return{title:'成就',expand:'查看详情',unlocked:'已完成'};
      case'es':return{title:'Logros',expand:'Ver detalles',unlocked:'COMPLETADO'};
      case'fr':return{title:'Succès',expand:'Voir les détails',unlocked:'ACCOMPLI'};
      default:return{title:'업적',expand:'세부 보기',unlocked:'달성'};
    }
  };
  const formatValue=(value,format)=>{
    const n=Math.max(0,Math.floor(Number(value)||0));
    if(format!=='time')return n.toLocaleString();
    const m=Math.floor(n/60),s=n%60;return`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const baseRender=window.renderStackfallAchievements;
  function renderSimpleAchievements(){
    let details=document.querySelector('#profileAchievements');
    if(!details&&typeof baseRender==='function'){baseRender();details=document.querySelector('#profileAchievements');}
    if(!details)return;
    const defs=Array.isArray(window.STACKFALL_ACHIEVEMENTS)?window.STACKFALL_ACHIEVEMENTS:[],text=labels(),title=document.querySelector('#profileAchievementTitle'),expand=document.querySelector('#profileAchievementExpand'),toolbar=document.querySelector('#achievementToolbar'),grid=document.querySelector('#profileAchievementGrid');
    if(!title||!grid)return;
    const rows=defs.map(def=>({def,status:window.stackfallAchievementProgress?.(def.id)}));
    const unlockedCount=rows.filter(row=>row.status?.unlocked).length;
    title.innerHTML=`${text.title}<b>${unlockedCount} / ${defs.length}</b>`;
    if(expand)expand.textContent=text.expand;
    if(toolbar)toolbar.hidden=true;
    grid.innerHTML='';
    for(const {def,status}of rows){
      if(!status)continue;
      const unlocked=status.unlocked===true,goal=Math.max(1,Number(status.goal)||1),progress=Math.min(goal,Math.max(0,Number(status.progress)||0)),pct=unlocked?100:Math.min(100,progress/goal*100),card=document.createElement('div');
      card.className='achievement-card'+(unlocked?' unlocked':'');
      card.dataset.achievementId=def.id;
      card.innerHTML=`<div class="achievement-icon" aria-hidden="true">◇</div><div class="achievement-copy"><strong>${localized(def.name)}</strong><p>${localized(def.desc)}</p></div><div class="achievement-progress" style="--achievement-progress:${pct.toFixed(1)}%"><i></i><span>${unlocked?text.unlocked:`${formatValue(progress,def.format)} / ${formatValue(goal,def.format)}`}</span></div>`;
      grid.appendChild(card);
    }
  }

  window.renderStackfallAchievements=renderSimpleAchievements;

  function suppressLegacyAchievementHub(){
    const entry=document.querySelector('#achievementHubBtn');
    if(entry){entry.tabIndex=-1;entry.setAttribute('aria-hidden','true');}
    const screen=document.querySelector('#achievementScreen');
    if(screen){screen.hidden=true;screen.setAttribute('aria-hidden','true');}
    renderSimpleAchievements();
  }

  if(document.readyState==='complete')queueMicrotask(suppressLegacyAchievementHub);
  else window.addEventListener('load',suppressLegacyAchievementHub,{once:true});
  queueMicrotask(suppressLegacyAchievementHub);
})();
