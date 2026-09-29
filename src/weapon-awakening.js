(()=>{
  const defs={
    core:{icon:'✹',ko:'항성핵',en:'Stellar Core',signature:'중앙 성창 + 보조핵 3중 동시 사격'},
    blade:{icon:'◒',ko:'월식 검륜',en:'Eclipse Blades',signature:'5검륜 가변속 영구 공전'},
    ember:{icon:'✦',ko:'성운 성창기',en:'Nebula Starcaster',signature:'연속 적중 후 성광 관통탄'},
    bulwark:{icon:'⛨',ko:'천궁 성채',en:'Celestial Bastion',signature:'방향 전개 성채와 파괴 반격파'},
    gravity:{icon:'◉',ko:'쌍성 붕괴',en:'Binary Collapse',signature:'쌍성 특이점의 최종 합체 붕괴'},
    comet:{icon:'⟐',ko:'종언 혜성창',en:'Final Comet Lance',signature:'압축 후 초고속 종언 관통'},
    arc:{icon:'◕',ko:'월상 회귀',en:'Lunar Return',signature:'초승달에서 보름달로 차오르는 귀환'},
    prism:{icon:'♛',ko:'성좌 왕관',en:'Constellation Crown',signature:'왕관 완성 후 중심 백색 광주'},
    chrono:{icon:'◴',ko:'영겁 시계',en:'Eternal Clock',signature:'초침 완주 후 시간 단절'},
    ion:{icon:'ϟ',ko:'천뢰 회로',en:'Celestial Thunder Circuit',signature:'회로 완성 후 중심 천뢰'},
    nova:{icon:'✺',ko:'극초신성',en:'Hypernova',signature:'3중 코로나 충전 후 3단 폭발'},
    drone:{icon:'⌁',ko:'낙성 함대',en:'Falling-Star Fleet',signature:'편대 정렬 후 공격 비행'},
    rail:{icon:'╫',ko:'종언 레일포',en:'Terminus Railgun',signature:'거대 레일 조립 후 종언 사격'},
    spiral:{icon:'֎',ko:'창세 은하',en:'Genesis Galaxy',signature:'완성형 은하 수축과 핵 폭발'},
    mirror:{icon:'✧',ko:'천경 성역',en:'Celestial Mirror Sanctuary',signature:'6면 만화경 완전 반사'},
    vacuum:{icon:'❂',ko:'흑성 연화',en:'Black-Star Lotus',signature:'6엽 진공 영역과 흑성 폐화'},
    mine:{icon:'⟡',ko:'위상 성궤',en:'Phase Starrail',signature:'이동 경로를 달리는 성궤 주행'},
    missile:{icon:'⇶',ko:'성멸 포대',en:'Starbreaker Arsenal',signature:'집결 후 다방향 포위 일제사'},
    gate:{icon:'⧈',ko:'초공간 대관문',en:'Hypergate Cathedral',signature:'회로 충전 후 네트워크 대전송'}
  };
  window.stackfallAwakeningDefs=Object.freeze(defs);

  state.awakeningCores=Math.max(0,Math.floor(Number(state.awakeningCores)||0));
  state.awakenedWeapons=state.awakenedWeapons&&typeof state.awakenedWeapons==='object'?state.awakenedWeapons:{};

  const app=document.querySelector('#app');
  if(!app)return;
  const hud=document.querySelector('#hud'),hudVitals=hud?.querySelector('.top-left');
  const coreHud=document.createElement('div');coreHud.className='awakening-core-hud';coreHud.innerHTML='<span>AWAKEN</span><b>CORE ×0</b>';hudVitals?.appendChild(coreHud);
  function syncAwakeningCoreHud(){
    const cores=Math.max(0,Math.floor(Number(state.awakeningCores)||0));
    coreHud.querySelector('b').textContent=`CORE ×${cores}`;
    coreHud.classList.toggle('charged',cores>0);
    if(coreCount)coreCount.textContent=`각성 코어 ×${cores}`;
  }
  const screen=document.createElement('section');
  screen.id='awakeningScreen';screen.className='overlay awakening-screen hidden';
  screen.innerHTML=`
    <div class="awakening-eclipse" aria-hidden="true"><i></i></div>
    <div class="awakening-shell">
      <div class="awakening-head"><span>WEAPON AWAKENING</span><h2>무기 각성</h2><p>6중첩 무기의 최종 형태를 선택합니다.</p><b id="awakeningCoreCount">각성 코어 ×0</b></div>
      <div id="awakeningCards" class="awakening-cards"></div>
      <button id="awakeningDecline" class="awakening-decline" type="button">각성하지 않는다 · 일반 레벨업으로</button>
    </div>
  `;
  app.appendChild(screen);

  const transform=document.createElement('div');
  transform.id='awakeningTransform';transform.className='awakening-transform hidden';
  transform.innerHTML='<div class="awakening-transform-eclipse"><i></i></div><span>AWAKENING</span><strong></strong><small></small>';
  app.appendChild(transform);

  const style=document.createElement('style');
  style.textContent=`
    .awakening-screen{z-index:47;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 44%,rgba(125,0,18,.25),transparent 24%),radial-gradient(circle at 50% 50%,rgba(42,0,18,.72),rgba(1,2,8,.96) 68%)}
    .awakening-eclipse{position:absolute;left:50%;top:43%;width:min(360px,48vw);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:#020207;box-shadow:0 0 0 5px rgba(92,0,10,.85),0 0 32px 12px rgba(255,34,58,.36),0 0 95px 35px rgba(179,0,29,.20)}
    .awakening-eclipse:before,.awakening-eclipse:after{content:"";position:absolute;inset:-11%;border-radius:50%;border:2px solid rgba(255,54,70,.42);filter:drop-shadow(0 0 14px rgba(255,20,42,.55));animation:awakeningCorona 4.5s linear infinite}
    .awakening-eclipse:after{inset:-18%;border-style:dashed;opacity:.45;animation-direction:reverse;animation-duration:7s}.awakening-eclipse i{position:absolute;inset:-3%;border-radius:50%;box-shadow:inset 0 0 28px rgba(255,40,55,.28)}
    @keyframes awakeningCorona{to{transform:rotate(360deg)}}
    .awakening-shell{position:relative;z-index:2;width:min(1120px,94vw);text-align:center}.awakening-head>span{color:#ff6a78;font-size:9px;font-weight:900;letter-spacing:.34em}.awakening-head h2{margin:6px 0 5px;font:clamp(38px,5vw,64px)/1 "Black Han Sans",sans-serif;text-shadow:0 0 26px rgba(255,45,67,.32)}.awakening-head p{margin:0;color:#b8a5b1;font-size:11px}.awakening-head b{display:inline-block;margin-top:10px;padding:5px 9px;border:1px solid rgba(255,73,91,.25);border-radius:999px;color:#ff9ca7;background:rgba(87,0,15,.38);font-size:9px}
    .awakening-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:11px;margin:24px auto 14px;max-height:51vh;overflow:auto;padding:5px}.awakening-card{min-height:218px;padding:17px;border:1px solid rgba(255,74,91,.25);border-radius:18px;background:linear-gradient(155deg,rgba(40,5,16,.91),rgba(9,7,20,.94));color:#fff;cursor:pointer;box-shadow:inset 0 0 28px rgba(143,0,27,.08),0 14px 36px rgba(0,0,0,.34);transition:.16s}.awakening-card:hover{transform:translateY(-4px);border-color:rgba(255,100,113,.62);box-shadow:inset 0 0 36px rgba(180,0,31,.15),0 0 28px rgba(255,27,52,.12),0 16px 40px rgba(0,0,0,.40)}.awakening-card>span{display:block;color:#b98791;font-size:8px;font-weight:900;letter-spacing:.17em}.awakening-card>i{display:grid;place-items:center;width:58px;height:58px;margin:14px auto 10px;border-radius:50%;font-style:normal;font-size:30px;background:radial-gradient(circle,rgba(255,224,226,.15),rgba(115,0,22,.14));color:#ffd9dd;text-shadow:0 0 18px #ff5367;box-shadow:0 0 0 1px rgba(255,96,112,.22),0 0 24px rgba(255,31,57,.12)}.awakening-card h3{margin:0;font:22px/1.1 "Black Han Sans",sans-serif}.awakening-card p{margin:8px 0 0;color:#c3aeb7;font-size:10px;line-height:1.55}.awakening-card small{display:block;margin-top:11px;color:#ff8d9b;font-size:9px}
    .awakening-decline{min-width:min(420px,84vw);padding:12px 18px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(8,9,20,.78);color:#c6c9d4;cursor:pointer;font-weight:800}.awakening-decline:hover{border-color:rgba(255,107,121,.34);color:#fff}
    .awakening-transform{position:absolute;inset:0;z-index:52;pointer-events:none;display:grid;place-items:center;text-align:center;background:radial-gradient(circle,rgba(138,0,24,.30),rgba(1,1,7,.80) 62%);animation:awakeningTransformFade .9s ease both}.awakening-transform-eclipse{position:absolute;width:min(330px,46vw);aspect-ratio:1;border-radius:50%;background:#010106;box-shadow:0 0 0 5px #6f0717,0 0 45px 18px rgba(255,43,62,.56),0 0 120px 46px rgba(175,0,29,.24);animation:awakeningPulse .9s ease both}.awakening-transform>span,.awakening-transform>strong,.awakening-transform>small{position:absolute;z-index:2}.awakening-transform>span{margin-top:-90px;color:#ff7180;font-size:10px;font-weight:900;letter-spacing:.42em}.awakening-transform>strong{font:clamp(38px,5vw,62px)/1 "Black Han Sans",sans-serif;text-shadow:0 0 28px rgba(255,70,86,.55)}.awakening-transform>small{margin-top:86px;color:#d6b9c0;font-size:12px}
    @keyframes awakeningPulse{0%{transform:scale(.42);opacity:0}35%{transform:scale(1.08);opacity:1}58%{transform:scale(.90)}100%{transform:scale(1.22);opacity:0}}@keyframes awakeningTransformFade{0%{opacity:0}12%,76%{opacity:1}100%{opacity:0}}
    .weapon-slot.awakened{border-color:rgba(255,93,108,.46)!important;box-shadow:0 0 18px rgba(255,40,62,.13),inset 0 0 18px rgba(126,0,22,.10)}.weapon-slot.awakened .stack{color:#ff8a99}.weapon-slot.awakened .icon{color:#ffe2e5;text-shadow:0 0 13px rgba(255,70,89,.8)}
    .awakening-core-hud{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,.07);color:#7584a8;font-size:8px;font-weight:900;letter-spacing:.08em}.awakening-core-hud b{color:#9da9c8;font-size:10px}.awakening-core-hud.charged span{color:#ff8796}.awakening-core-hud.charged b{color:#ffd3d9;text-shadow:0 0 10px rgba(255,70,90,.45)}
    @media(max-width:760px){.awakening-cards{grid-template-columns:1fr;max-height:57vh}.awakening-card{min-height:132px;padding:12px 14px 12px 88px;text-align:left;position:relative}.awakening-card>i{position:absolute;left:16px;top:26px;width:54px;height:54px;margin:0}.awakening-card h3{font-size:19px}.awakening-card p{font-size:9px}}
  `;
  document.head.appendChild(style);

  const cards=screen.querySelector('#awakeningCards'),decline=screen.querySelector('#awakeningDecline'),coreCount=screen.querySelector('#awakeningCoreCount');
  const baseWeaponText=weaponText;
  weaponText=function awakenedWeaponText(key){
    const text=baseWeaponText(key),def=defs[key];
    if(!def||!state.awakenedWeapons?.[key])return text;
    const name=GAME_SETTINGS.language==='ko'?def.ko:def.en;
    return{...text,name,desc:def.signature};
  };
  function awakeningName(key){const def=defs[key];return GAME_SETTINGS.language==='ko'?def?.ko:def?.en;}
  function available(){
    if(window.stackfallIsFeatureUnlocked?.('awakening')===false||(state.awakeningCores||0)<1)return[];
    return Object.keys(defs).filter(key=>weaponCount(key)>=6&&!state.awakenedWeapons?.[key]);
  }
  function syncLoadoutAwakening(){
    for(const slot of document.querySelectorAll('#weaponSlots [data-cooldown-key]')){
      const key=slot.dataset.cooldownKey,def=defs[key],awake=!!state.awakenedWeapons?.[key];
      slot.classList.toggle('awakened',awake);
      if(!awake||!def)continue;
      const icon=slot.querySelector('.icon'),name=slot.querySelector('.name');
      if(icon)icon.textContent=def.icon;
      if(name)name.textContent=awakeningName(key);
      slot.title=def.signature;
    }
  }
  const baseRenderLoadout=renderLoadout;
  renderLoadout=function awakeningAwareLoadout(){const result=baseRenderLoadout();syncLoadoutAwakening();return result;};

  function closeScreen(){screen.classList.add('hidden');cards.innerHTML='';}
  function resumeAfterAwakening(){
    state.mode='playing';renderLoadout();updateHUD();syncAbilityLedgerVisibility?.();
    queueMicrotask(()=>{if(state.mode==='playing')tryLevelUp?.();});
  }
  function confirm(key){
    if(state.mode!=='awakeningChoice'||(state.awakeningCores||0)<1||weaponCount(key)<6||state.awakenedWeapons?.[key])return;
    const def=defs[key];state.awakeningCores--;state.awakenedWeapons[key]=true;syncAwakeningCoreHud();closeScreen();
    transform.querySelector('strong').textContent=awakeningName(key);
    transform.querySelector('small').textContent=def.signature;
    transform.classList.remove('hidden');transform.style.animation='none';void transform.offsetWidth;transform.style.animation='';
    state.mode='awakeningTransform';audio.resonance();renderLoadout();updateHUD();
    scheduleUiAction(900,()=>{transform.classList.add('hidden');if(state.mode==='awakeningTransform')resumeAfterAwakening();});
  }
  function openAwakening(){
    const keys=available();if(!keys.length)return false;
    closeAbilityLedger?.(true);state.mode='awakeningChoice';cards.innerHTML='';coreCount.textContent=`각성 코어 ×${state.awakeningCores}`;
    for(const key of keys){
      const def=defs[key],base=baseWeaponText(key),card=document.createElement('button');
      card.type='button';card.className='awakening-card';card.innerHTML=`<span>${base.name} →</span><i>${def.icon}</i><h3>${awakeningName(key)}</h3><p>${def.signature}</p><small>각성 코어 1개 소비</small>`;
      card.addEventListener('click',()=>confirm(key),{once:true});cards.appendChild(card);
    }
    screen.classList.remove('hidden');syncAbilityLedgerVisibility?.();return true;
  }

  const baseOpenChoices=openChoices;
  openChoices=function awakeningFirstChoices(){
    if(openAwakening())return;
    return baseOpenChoices();
  };
  decline.addEventListener('click',()=>{
    if(state.mode!=='awakeningChoice')return;
    closeScreen();state.mode='playing';baseOpenChoices();
  });

  const baseTogglePause=togglePause;
  togglePause=function awakeningSafePause(force){if(state.mode==='awakeningChoice'||state.mode==='awakeningTransform')return;return baseTogglePause(force);};

  const baseReset=resetGame;
  resetGame=function awakeningReset(){
    closeScreen();transform.classList.add('hidden');if((state.awakeningCores||0)>0&&state.mode!=='menu'&&state.mode!=='gameover'&&state.mode!=='stageComplete')cashOutAwakeningCores();state.awakeningCores=0;state.awakenedWeapons={};state.lastAwakeningCoreCashout=null;syncAwakeningCoreHud();
    const result=baseReset();renderLoadout();return result;
  };
  const baseMenu=showMainMenu;
  showMainMenu=function awakeningMenu(){
    closeScreen();transform.classList.add('hidden');cashOutAwakeningCores();state.awakeningCores=0;state.awakenedWeapons={};
    return baseMenu();
  };
  const AWAKENING_CORE_CASHOUT_STARDUST=40;
  function cashOutAwakeningCores(){
    const cores=Math.max(0,Math.floor(Number(state.awakeningCores)||0));
    if(!cores)return{cores:0,stardust:0};
    const multiplier=Math.max(.25,Number(window.stackfallCurrencyMultiplier?.())||1),requested=Math.max(1,Math.floor(cores*AWAKENING_CORE_CASHOUT_STARDUST*multiplier));
    state.awakeningCores=0;
    const granted=Math.max(0,Number(window.stackfallGrantCurrency?.('stardust',requested))||0);
    state.runCurrencyEarned=state.runCurrencyEarned||{stardust:0,coreShard:0};
    state.runCurrencyEarned.stardust=(state.runCurrencyEarned.stardust||0)+granted;
    state.lastAwakeningCoreCashout={cores,stardust:granted,rate:AWAKENING_CORE_CASHOUT_STARDUST};syncAwakeningCoreHud();
    return state.lastAwakeningCoreCashout;
  }
  window.stackfallCashOutAwakeningCores=cashOutAwakeningCores;
  window.stackfallAwakeningCoreCashoutRate=AWAKENING_CORE_CASHOUT_STARDUST;
  const baseEnd=endGame;
  endGame=function awakeningEnd(){closeScreen();transform.classList.add('hidden');cashOutAwakeningCores();return baseEnd();};

  window.stackfallGrantAwakeningCore=function grantAwakeningCore(amount=1){
    const add=Math.max(0,Math.floor(Number(amount)||0));if(!add)return state.awakeningCores||0;
    state.awakeningCores=(state.awakeningCores||0)+add;syncAwakeningCoreHud();
    const kicker=document.querySelector('#resonanceKicker');if(kicker)kicker.textContent='각성 자원';
    ui.resonanceTitle.textContent=`각성 코어 +${add}`;ui.resonanceDesc.textContent=`보유: ${state.awakeningCores}`;showTimedResonance(2200);audio.resonance();
    return state.awakeningCores;
  };
  window.stackfallIsWeaponAwakened=key=>!!state.awakenedWeapons?.[key];
  window.stackfallAwakeningState=()=>({cores:state.awakeningCores||0,awakened:{...(state.awakenedWeapons||{})},available:available()});

  const AWAKENING_MINIBOSS_CORE_CHANCE=.35;
  function awakeningCoreDropAmount(enemy){
    if(!enemy||enemy.dead!==true||enemy.kind==='stage-boss')return 0;
    if(enemy.twinGroup&&state.entities.enemies.some(other=>other!==enemy&&!other.dead&&other.twinGroup===enemy.twinGroup))return 0;
    if(enemy.kind==='apex')return 2;
    if(enemy.kind==='stage-mini')return enemy.noEliteReward===true?0:(Math.random()<AWAKENING_MINIBOSS_CORE_CHANCE?1:0);
    if(enemy.type==='boss'){
      const flagship=enemy.kind==='crash-boss'||enemy.eventVariant==='dreadnought';
      return enemy.noEliteReward===true&&!flagship?0:1;
    }
    return 0;
  }
  const awakeningKillBase=killEnemy;
  killEnemy=function awakeningCoreBossDrop(enemy,opts={}){
    const wasAlive=enemy&&!enemy.dead;
    const result=awakeningKillBase(enemy,opts);
    if(!wasAlive||!enemy?.dead)return result;
    const amount=awakeningCoreDropAmount(enemy);
    if(amount>0)window.stackfallGrantAwakeningCore?.(amount);
    return result;
  };
  window.stackfallAwakeningCoreDropAmount=awakeningCoreDropAmount;
  window.stackfallMinibossAwakeningCoreChance=AWAKENING_MINIBOSS_CORE_CHANCE;

  const baseUpdateHudForAwakening=updateHUD;
  updateHUD=function awakeningCoreAwareHud(){const result=baseUpdateHudForAwakening();syncAwakeningCoreHud();return result;};
  syncAwakeningCoreHud();renderLoadout();
})();