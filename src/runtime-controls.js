(()=>{
  const hud=document.querySelector('#hud'),pause=document.querySelector('#pauseBtn');
  if(!hud||!pause)return;

  const normalizeGameSpeed=value=>{
    const numeric=Number(value);
    const bounded=Math.max(1,Math.min(10,Number.isFinite(numeric)?numeric:1));
    return Math.round(bounded*2)/2;
  };
  state.gameSpeed=normalizeGameSpeed(state.gameSpeed);

  const style=document.createElement('style');
  style.textContent=`
    #speedBtn{right:64px;width:48px;font-size:11px;letter-spacing:.04em}
    #speedBtn.fast{border-color:rgba(124,232,255,.55);background:rgba(31,68,92,.82);box-shadow:0 0 18px rgba(124,232,255,.16);color:#dffaff}
    .auto-choice-notice{pointer-events:none;position:absolute;left:50%;bottom:max(94px,calc(env(safe-area-inset-bottom) + 82px));z-index:24;min-width:220px;max-width:min(460px,78vw);transform:translate(-50%,10px);padding:9px 14px;border:1px solid rgba(124,232,255,.28);border-radius:12px;background:linear-gradient(135deg,rgba(7,13,31,.94),rgba(17,14,42,.94));box-shadow:0 10px 28px rgba(0,0,0,.34),0 0 22px rgba(124,232,255,.08);text-align:center;opacity:0;transition:opacity .14s,transform .14s}
    .auto-choice-notice.show{opacity:1;transform:translate(-50%,0)}
    .auto-choice-notice span{display:block;color:#8feaff;font-size:8px;font-weight:900;letter-spacing:.18em}
    .auto-choice-notice strong{display:block;margin-top:3px;color:#f4f8ff;font-size:13px}
    .auto-choice-notice small{display:block;margin-top:3px;color:#91a0c3;font-size:9px}
    @media(pointer:coarse),(max-width:760px){#speedBtn{right:62px;width:44px}.auto-choice-notice{bottom:max(82px,calc(env(safe-area-inset-bottom) + 72px));max-width:72vw;padding:8px 11px}}
  `;
  document.head.appendChild(style);

  const speed=document.createElement('button');
  speed.id='speedBtn';speed.className='icon-btn';speed.type='button';
  pause.insertAdjacentElement('beforebegin',speed);

  const notice=document.createElement('div');
  notice.id='autoChoiceNotice';notice.className='auto-choice-notice hidden';notice.setAttribute('aria-live','polite');
  notice.innerHTML='<span></span><strong></strong><small></small>';
  hud.appendChild(notice);

  const speedLabel=()=>({
    ko:'게임 속도',en:'Game speed',ja:'ゲーム速度','zh-CN':'游戏速度',es:'Velocidad',fr:'Vitesse'
  }[GAME_SETTINGS.language]||'Game speed');
  const autoLabel=()=>({
    ko:'자동 선택',en:'AUTO SELECT',ja:'自動選択','zh-CN':'自动选择',es:'SELECCIÓN AUTO',fr:'SÉLECTION AUTO'
  }[GAME_SETTINGS.language]||'AUTO SELECT');
  const typeLabel=kind=>({
    ko:{core:'기본 무기',weapon:'장비',passive:'패시브'},
    en:{core:'BASIC WEAPON',weapon:'EQUIPMENT',passive:'PASSIVE'},
    ja:{core:'基本武器',weapon:'装備',passive:'パッシブ'},
    'zh-CN':{core:'基础武器',weapon:'装备',passive:'被动'},
    es:{core:'ARMA BÁSICA',weapon:'EQUIPO',passive:'PASIVA'},
    fr:{core:'ARME DE BASE',weapon:'ÉQUIPEMENT',passive:'PASSIF'}
  }[GAME_SETTINGS.language]?.[kind]||kind);

  function speedText(){
    const current=normalizeGameSpeed(state.gameSpeed);
    return `×${Number.isInteger(current)?current:current.toFixed(1)}`;
  }
  function syncSpeedButton(){
    const current=normalizeGameSpeed(state.gameSpeed);
    speed.textContent=speedText();
    speed.classList.toggle('fast',current>1);
    speed.setAttribute('aria-label',`${speedLabel()} ${speed.textContent}`);
    speed.title=`${speedLabel()}: ${speed.textContent}`;
  }
  function setGameSpeed(value,options={}){
    state.gameSpeed=normalizeGameSpeed(value);
    syncSpeedButton();
    if(options?.silent!==true&&GAME_SETTINGS.audio?.ui!==false)audio.pickup();
    return state.gameSpeed;
  }
  speed.addEventListener('click',()=>setGameSpeed(state.gameSpeed===1?2:1));

  const queue=[];let showing=false,noticeSerial=0;
  function choiceSnapshot(choice){
    if(!choice||!choice.key)return null;
    const weaponLike=choice.kind==='weapon'||choice.kind==='core';
    const before=weaponLike?weaponCount(choice.key):stat(choice.key),after=before+1;
    const text=weaponLike?weaponText(choice.key):passiveText(choice.key);
    return{name:text?.name||choice.name||choice.key,kind:choice.kind,before,after};
  }
  function showNext(){
    if(showing||!queue.length)return;
    showing=true;const item=queue.shift(),serial=++noticeSerial;
    notice.querySelector('span').textContent=`${autoLabel()} · ${typeLabel(item.kind)}`;
    notice.querySelector('strong').textContent=item.name;
    notice.querySelector('small').textContent=`${item.before} → ${item.after}`;
    notice.classList.remove('hidden');
    requestAnimationFrame(()=>{if(serial===noticeSerial)notice.classList.add('show');});
    scheduleUiAction(1050,()=>{
      if(serial!==noticeSerial)return;
      notice.classList.remove('show');
      scheduleUiAction(150,()=>{
        if(serial!==noticeSerial)return;
        notice.classList.add('hidden');showing=false;showNext();
      });
    });
  }
  window.stackfallShowAutoChoice=function(choice){
    const item=choiceSnapshot(choice);if(!item)return;
    if(queue.length>=8)queue.shift();
    queue.push(item);showNext();
  };
  window.stackfallGameSpeed=()=>normalizeGameSpeed(state.gameSpeed);
  window.stackfallSetGameSpeed=setGameSpeed;
  window.stackfallSyncRuntimeControls=syncSpeedButton;

  const baseReset=resetGame;
  resetGame=function runtimeControlReset(){
    queue.length=0;showing=false;noticeSerial++;notice.classList.add('hidden');notice.classList.remove('show');
    return baseReset();
  };
  const baseMenu=showMainMenu;
  showMainMenu=function runtimeControlMenu(){
    queue.length=0;showing=false;noticeSerial++;notice.classList.add('hidden');notice.classList.remove('show');
    return baseMenu();
  };
  const baseApplyLanguage=applyLanguage;
  applyLanguage=function runtimeControlLanguage(){const result=baseApplyLanguage();syncSpeedButton();return result;};

  syncSpeedButton();

  // Keep the original three Endless world events as the canonical set.
  // The later five field-event experiments are intentionally retired rather than
  // competing with the stronger Vault / Crash / Void identities.
  const canonicalWorldEvents=Object.freeze(['vault','crash','void']),canonicalWorldEventSet=new Set(canonicalWorldEvents),retiredWorldEvents=Object.freeze(['distress','meteor','predator','relay','storm']);
  window.STACKFALL_WORLD_EVENT_TYPES=canonicalWorldEvents;
  if(WEAPONS?.drone)WEAPONS.drone.icon='⊛';

  function installCanonicalWorldEvents(){
    const combatTimer=document.querySelector('#worldEventCombatTimer');
    const pruneRetiredEvents=()=>{
      state.eventClocks=state.eventClocks||{};
      for(const type of retiredWorldEvents)state.eventClocks[type]=Infinity;
      const markers=state.entities?.mapEvents;
      if(Array.isArray(markers))compactInPlace(markers,marker=>!marker||canonicalWorldEventSet.has(marker.type));
      const active=state.mapEventActive;
      if(active&&!canonicalWorldEventSet.has(active.type)){
        const retiredType=active.type;
        state.mapEventActive=null;
        if(Array.isArray(state.entities?.enemies))compactInPlace(state.entities.enemies,enemy=>!enemy||enemy.eventKind!==retiredType);
        if(Array.isArray(state.entities?.enemyProjectiles))state.entities.enemyProjectiles.length=0;
        if(Array.isArray(state.entities?.telegraphs))state.entities.telegraphs.length=0;
        if(Array.isArray(state.entities?.beams))state.entities.beams.length=0;
        combatTimer?.classList.add('hidden');
        if(state.mode==='worldEvent')state.mode='playing';
      }
    };

    const baseUpdateMapEvents=window.updateMapEvents;
    if(typeof baseUpdateMapEvents==='function'&&!baseUpdateMapEvents.__canonicalThree){
      const canonicalUpdateMapEvents=function(dt){pruneRetiredEvents();const result=baseUpdateMapEvents(dt);pruneRetiredEvents();return result;};
      canonicalUpdateMapEvents.__canonicalThree=true;
      window.updateMapEvents=canonicalUpdateMapEvents;
    }
    const baseDrawMapEvents=window.drawMapEvents;
    if(typeof baseDrawMapEvents==='function'&&!baseDrawMapEvents.__canonicalThree){
      const canonicalDrawMapEvents=function(){pruneRetiredEvents();return baseDrawMapEvents();};
      canonicalDrawMapEvents.__canonicalThree=true;
      window.drawMapEvents=canonicalDrawMapEvents;
    }
    const baseAuthoredSpawn=window.stackfallSpawnAuthoredMapEvent;
    if(typeof baseAuthoredSpawn==='function'&&!baseAuthoredSpawn.__canonicalThree){
      const canonicalAuthoredSpawn=function(type){return canonicalWorldEventSet.has(type)?baseAuthoredSpawn(type):false;};
      canonicalAuthoredSpawn.__canonicalThree=true;
      window.stackfallSpawnAuthoredMapEvent=canonicalAuthoredSpawn;
    }
    pruneRetiredEvents();

    const cards=document.querySelector('#worldEventCards');
    const simplifyRecoveryCopy=()=>{
      if(!cards)return;
      for(const card of cards.querySelectorAll('.world-event-card')){
        const heading=card.querySelector('b')?.textContent?.trim(),desc=card.querySelector('p');
        if(!desc)continue;
        if(heading==='회수 모듈')desc.textContent='무작위 보유 패시브 2종 +1. 대상이 없으면 선체 강화.';
        else if(heading==='Recovery Module')desc.textContent='Two random owned passives gain +1 stack. Reinforces the hull if none qualify.';
      }
    };
    if(cards){new MutationObserver(simplifyRecoveryCopy).observe(cards,{childList:true,subtree:true});simplifyRecoveryCopy();}

    if(new URLSearchParams(location.search).get('dev')==='1'){
      let attempts=0;
      const trimDevEvents=()=>{
        const select=document.querySelector('#devEndlessEvent');
        if(select){for(const option of [...select.options])if(!canonicalWorldEventSet.has(option.value))option.remove();return;}
        if(attempts++<600)requestAnimationFrame(trimDevEvents);
      };
      trimDevEvents();
    }
    queueMicrotask(()=>{try{renderStarterOptions?.();}catch{}try{window.renderStackfallAchievementHub?.();}catch{}});
  }
  if(document.readyState==='complete')installCanonicalWorldEvents();else window.addEventListener('load',installCanonicalWorldEvents,{once:true});

  if(new URLSearchParams(location.search).get('dev')==='1'&&!document.querySelector('script[data-stackfall-dev-endless]')){
    const extension=document.createElement('script');
    extension.src='src/dev-tools-endless.js';
    extension.dataset.stackfallDevEndless='1';
    document.head.appendChild(extension);
  }
})();
