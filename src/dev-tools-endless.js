(()=>{
  'use strict';

  const EVENT_TYPES=[
    ['vault','성운 보관소'],['crash','추락한 우주선'],['void','공허 균열']
  ];
  const ELITE_POOLS={
    mini:[
      ['knight','균열의 기사'],['warden','초신성 감시자'],['executioner','궤도 집행자'],
      ['colossus','결정 거상'],['harvester','성운 수확자'],['mirror','쌍성의 거울']
    ],
    boss:[
      ['eclipse','일식의 군주'],['seraph','성운의 세라프'],['pulsar','맥동성의 심장'],
      ['leviathan','성간의 레비아탄'],['archivist','무한 기록자'],['heliarch','태양관의 군주'],
      ['tempest','성뢰의 여왕'],['nullengine','무효기관 제로']
    ],
    void:[
      ['maw','심연의 포식체'],['oracle','공허의 예언자'],['weaver','무광의 직조자'],
      ['grave','별무덤의 군주'],['paradox','역설의 쌍둥이']
    ],
    apex:[
      ['chronophage','시간포식자 아트로포스'],['starforge','종말 항성 오메가'],
      ['lastconstellation','무명의 마지막 성좌']
    ]
  };
  const ENCOUNTER_ENTITY_KEYS=Object.freeze(['enemies','enemyProjectiles','projectiles','telegraphs','beams','curves','wells','mapEvents']);
  const COMBAT_OVERLAY_SELECTORS=Object.freeze(['#awakeningScreen','#bossRewardScreen','#apexRewardScreen']);
  const APEX_PHASE_SETTINGS=Object.freeze({
    1:Object.freeze({hp:.90,time:0}),
    2:Object.freeze({hp:.70,time:106}),
    3:Object.freeze({hp:.45,time:181}),
    4:Object.freeze({hp:.20,time:241})
  });
  const pairOptions=pairs=>'<option value="random">무작위</option>'+pairs.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
  const eventOptions=EVENT_TYPES.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
  const formatSpeed=value=>Number.isInteger(value)?`${value}`:Number(value).toFixed(1);
  const poolFor=category=>ELITE_POOLS[category]||[];

  let attempts=0;
  function mount(){
    const panel=document.querySelector('#stackfallDevPanel'),api=window.stackfallDeveloperTest;
    if(!panel||!api?.enabled){
      if(attempts++<600)requestAnimationFrame(mount);
      return;
    }
    if(panel.querySelector('#devEndlessTools'))return;

    const style=document.createElement('style');
    style.textContent=`
      #stackfallDevPanel .dev-mode-section{margin:14px 0;padding:12px;border:1px solid rgba(140,174,230,.17);border-radius:14px;background:rgba(255,255,255,.018)}
      #stackfallDevPanel .dev-mode-section>header{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:9px}
      #stackfallDevPanel .dev-mode-section>header strong{font-size:12px;letter-spacing:.10em;color:#dfeaff}
      #stackfallDevPanel .dev-mode-section>header small{font-size:9px;color:#6f82a9}
      #stackfallDevPanel .dev-stage-section{border-color:rgba(198,171,255,.22);background:rgba(113,78,180,.035)}
      #stackfallDevPanel .dev-endless-section{border-color:rgba(126,232,255,.24);background:rgba(42,166,199,.035)}
      #stackfallDevPanel .dev-endless-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px;margin-top:7px}
      #stackfallDevPanel .dev-endless-row>select{min-width:0}
      #stackfallDevPanel .dev-endless-label{margin:9px 0 3px!important;color:#8fa6ce!important;font-size:9px!important}
      #stackfallDevPanel .dev-speed-wrap{margin-top:10px;padding:9px;border:1px solid rgba(126,232,255,.13);border-radius:10px;background:rgba(0,0,0,.12)}
      #stackfallDevPanel .dev-speed-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;color:#9fb4d7;font-size:10px;font-weight:800}
      #stackfallDevPanel #devGameSpeedValue{color:#dffaff;font-size:13px}
      #stackfallDevPanel #devGameSpeed{width:100%;accent-color:#7ce8ff}
      #stackfallDevPanel .dev-speed-chips{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:7px}
      #stackfallDevPanel .dev-speed-chips button{min-height:28px;padding:4px;font-size:9px}
      #stackfallDevPanel .dev-endless-status{margin-top:9px;padding:7px 9px;border-radius:8px;background:rgba(126,232,255,.05);color:#9fb4d7;font-size:10px;line-height:1.45}
      #stackfallDevPanel .dev-common-label{margin-top:14px;padding-top:10px;border-top:1px solid rgba(140,174,230,.14)}
    `;
    document.head.appendChild(style);

    const stageSelect=panel.querySelector('#devStage');
    const oldGrid=stageSelect?.nextElementSibling?.classList?.contains('dev-grid')?stageSelect.nextElementSibling:null;
    const stageLabel=[...panel.querySelectorAll(':scope > label')].find(node=>node.textContent.trim()==='스테이지');

    if(stageSelect){
      const stageSection=document.createElement('section');
      stageSection.className='dev-mode-section dev-stage-section';
      stageSection.innerHTML='<header><strong>STAGE TOOLS</strong><small>봉인된 스테이지 전용</small></header>';
      (stageLabel||stageSelect).parentNode.insertBefore(stageSection,stageLabel||stageSelect);
      stageLabel?.remove();
      stageSection.appendChild(stageSelect);
      const stageActions=document.createElement('div');stageActions.className='dev-grid';
      for(const id of['devStageStart','devBossNow','devClearStages']){
        const node=panel.querySelector(`#${id}`);if(node)stageActions.appendChild(node);
      }
      stageSection.appendChild(stageActions);

      const endless=document.createElement('section');
      endless.id='devEndlessTools';endless.className='dev-mode-section dev-endless-section';
      endless.innerHTML=`
        <header><strong>ENDLESS TOOLS</strong><small>이벤트 · 엘리트 · 초월체 · 배속</small></header>
        <div class="dev-grid"><div id="devEndlessStartSlot"></div><button id="devEndlessClean" class="accent">Endless 새로 시작 + 전투 정리</button></div>

        <label class="dev-endless-label" for="devEndlessEvent">이벤트</label>
        <div class="dev-endless-row"><select id="devEndlessEvent">${eventOptions}</select><button id="devEventSignal">이벤트 신호 생성</button></div>
        <button id="devEventNow" class="accent" style="margin-top:7px">선택 이벤트 즉시 시작</button>

        <label class="dev-endless-label" for="devMiniForm">중간보스</label>
        <div class="dev-endless-row"><select id="devMiniForm">${pairOptions(ELITE_POOLS.mini)}</select><button id="devSpawnMini">중간보스 등장</button></div>

        <label class="dev-endless-label" for="devBossForm">보스</label>
        <div class="dev-endless-row"><select id="devBossForm">${pairOptions(ELITE_POOLS.boss)}</select><button id="devSpawnBoss">보스 등장</button></div>

        <label class="dev-endless-label" for="devVoidForm">균열 보스</label>
        <div class="dev-endless-row"><select id="devVoidForm">${pairOptions(ELITE_POOLS.void)}</select><button id="devSpawnVoid">균열 보스 등장</button></div>

        <label class="dev-endless-label" for="devApexForm">초월체</label>
        <div class="dev-endless-row"><select id="devApexForm">${pairOptions(ELITE_POOLS.apex)}</select><button id="devSpawnApex" class="accent">정상 연출로 등장</button></div>
        <div class="dev-endless-row"><select id="devApexPhase"><option value="1">PHASE 1</option><option value="2">PHASE 2</option><option value="3">PHASE 3</option><option value="4">PHASE 4 · TERMINAL</option></select><button id="devApplyApexPhase">현재 초월체 페이즈 적용</button></div>

        <div class="dev-speed-wrap">
          <div class="dev-speed-head"><span>게임 배속</span><b id="devGameSpeedValue">×1</b></div>
          <input id="devGameSpeed" type="range" min="1" max="10" step="0.5" value="1">
          <div class="dev-speed-chips">${[1,2,4,6,8,10].map(v=>`<button type="button" data-dev-speed="${v}">×${v}</button>`).join('')}</div>
        </div>
        <div id="devEndlessStatus" class="dev-endless-status">Endless 테스트 준비됨</div>
      `;
      stageSection.insertAdjacentElement('afterend',endless);

      const startSlot=endless.querySelector('#devEndlessStartSlot'),endlessStart=panel.querySelector('#devEndless');
      if(endlessStart){startSlot.replaceWith(endlessStart);endlessStart.classList.add('accent');}

      if(oldGrid&&oldGrid.children.length){
        const commonLabel=document.createElement('label');commonLabel.className='dev-common-label';commonLabel.textContent='공통 테스트';
        oldGrid.parentNode.insertBefore(commonLabel,oldGrid);
      }
    }

    const endless=panel.querySelector('#devEndlessTools');
    if(!endless)return;
    const query=selector=>endless.querySelector(selector);
    const status=query('#devEndlessStatus');
    const setStatus=(message,ok=true)=>{status.textContent=`${ok?'✓':'✕'} ${message}`;};
    const hide=selector=>document.querySelector(selector)?.classList.add('hidden');

    function forceActiveCombat(){
      state.startLevelBonusRemaining=0;state.choiceOpening=false;state.choiceLocked=false;
      if(!['cinematic','worldEvent'].includes(state.mode))state.mode='playing';
      ui.choice?.classList.add('hidden');if(ui.choiceCards)ui.choiceCards.innerHTML='';
      ui.pauseScreen?.classList.add('hidden');
      for(const selector of COMBAT_OVERLAY_SELECTORS)hide(selector);
    }
    function ensureEndless(){
      const config=window.stackfallCurrentRunConfig?.();
      if(config?.mode!=='endless'||['menu','gameover','stageVictory','stageComplete'].includes(state.mode))api.startEndless();
      forceActiveCombat();
      queueMicrotask(forceActiveCombat);
      return window.stackfallCurrentRunConfig?.()?.mode==='endless';
    }
    function clearEncounterState(){
      window.closeMapEventOverlays?.();
      hide('#worldEventScreen');
      if(state.realmTransition)window.cancelRealmTransition?.('space');
      state.mapEventActive=null;clearPendingCombatActions?.();
      for(const key of ENCOUNTER_ENTITY_KEYS){
        const list=state.entities?.[key];if(Array.isArray(list)){if(key==='enemyProjectiles')clearEnemyProjectiles(list);else list.length=0;}
      }
      state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;state.apexArena=null;state.apexExitPending=false;
      ui.bossBar?.classList.add('hidden');
      forceActiveCombat();
    }
    function resolveForm(category,requested){
      const pool=poolFor(category);
      if(requested&&requested!=='random'&&pool.some(([id])=>id===requested))return requested;
      return pool[Math.floor(Math.random()*pool.length)]?.[0]||null;
    }
    function displayName(category,form){
      return poolFor(category).find(([id])=>id===form)?.[1]||form;
    }
    function moveEliteNearPlayer(enemy){
      const dx=player.x+Math.min(285,Math.max(210,enemy.r*3.2))-enemy.x,dy=player.y-enemy.y,group=enemy.twinGroup;
      for(const actor of state.entities.enemies||[])if(actor===enemy||(group&&actor.twinGroup===group)){actor.x+=dx;actor.y+=dy;}
    }
    function spawnElite(category,requested){
      if(!ensureEndless())return{ok:false,reason:'endless-start-failed'};
      clearEncounterState();
      const form=resolveForm(category,requested);if(!form)return{ok:false,reason:'form-missing'};
      const enemy=window.stackfallSpawnEliteForm?.(category,form);if(!enemy)return{ok:false,reason:'spawn-failed',form};
      moveEliteNearPlayer(enemy);updateHUD?.();
      return{ok:true,form,id:enemy.id,name:displayName(category,form)};
    }
    function spawnEvent(type,immediate=false){
      if(!ensureEndless())return{ok:false,reason:'endless-start-failed'};
      clearEncounterState();
      const valid=EVENT_TYPES.some(([id])=>id===type);if(!valid)return{ok:false,reason:'event-missing'};
      const spawned=window.stackfallSpawnAuthoredMapEvent?.(type)===true;if(!spawned)return{ok:false,reason:'event-blocked',type};
      if(immediate){
        const marker=state.entities.mapEvents?.[0];
        if(marker){marker.x=player.x;marker.y=player.y;updateMapEvents?.(.016);}
      }
      return{ok:true,type,immediate,name:EVENT_TYPES.find(([id])=>id===type)?.[1]||type};
    }
    function spawnApex(requested){
      if(!ensureEndless())return{ok:false,reason:'endless-start-failed'};
      clearEncounterState();
      const form=resolveForm('apex',requested);if(!form)return{ok:false,reason:'form-missing'};
      state.bossBags=state.bossBags||{};state.bossBags.apex=[form];
      state.pendingApexForm=null;state.apexActiveId=null;state.apexExitPending=false;state.nextApexAt=typeof runProgressionTime==='function'?runProgressionTime()-1:(state.time||0)-1;
      const started=typeof updateApexSystems==='function'&&updateApexSystems(0,true)===true;
      return{ok:started,form,name:displayName('apex',form),reason:started?null:'apex-start-failed'};
    }
    function applyApexPhase(phase){
      const target=(state.entities.enemies||[]).find(enemy=>!enemy.dead&&enemy.id===state.apexActiveId&&enemy.kind==='apex');
      if(!target)return{ok:false,reason:'apex-not-active'};
      const p=Math.max(1,Math.min(4,Math.floor(Number(phase)||1))),settings=APEX_PHASE_SETTINGS[p];
      target.hp=Math.max(1,target.maxHp*settings.hp);target.apexElapsed=settings.time;target.skillCd=Math.min(target.skillCd||.4,.35);target.burstCd=Math.min(target.burstCd||.6,.55);target.pulseCd=Math.min(target.pulseCd||.8,.75);target.signatureCd=.25;target.apexSetpieceCd=.4;
      return{ok:true,phase:p,name:typeof bossDisplayName==='function'?bossDisplayName(target):(target.name||'APEX')};
    }

    const eventSelect=query('#devEndlessEvent'),miniSelect=query('#devMiniForm'),bossSelect=query('#devBossForm'),voidSelect=query('#devVoidForm'),apexSelect=query('#devApexForm'),phaseSelect=query('#devApexPhase');
    const speedRange=query('#devGameSpeed'),speedValue=query('#devGameSpeedValue');
    const onClick=(selector,handler)=>query(selector)?.addEventListener('click',handler);
    function syncSpeed(value=window.stackfallGameSpeed?.()||state.gameSpeed||1){
      const next=Math.max(1,Math.min(10,Number(value)||1));speedRange.value=String(next);speedValue.textContent=`×${formatSpeed(next)}`;
    }
    function setSpeed(value){
      const next=window.stackfallSetGameSpeed?.(Number(value),{silent:true})??1;syncSpeed(next);setStatus(`배속 ×${formatSpeed(next)}`,true);return next;
    }

    onClick('#devEndlessClean',()=>{
      const ok=ensureEndless();if(ok)clearEncounterState();setStatus(ok?'Endless 새 런 시작 · 전투 정리 완료':'Endless 시작 실패',ok);
    });
    panel.querySelector('#devEndless')?.addEventListener('click',()=>queueMicrotask(()=>{forceActiveCombat();syncSpeed();}));
    onClick('#devEventSignal',()=>{const result=spawnEvent(eventSelect.value,false);setStatus(result.ok?`${result.name} 신호 생성`:`이벤트 신호 실패 · ${result.reason}`,result.ok);});
    onClick('#devEventNow',()=>{const result=spawnEvent(eventSelect.value,true);setStatus(result.ok?`${result.name} 즉시 시작`:`이벤트 시작 실패 · ${result.reason}`,result.ok);});
    onClick('#devSpawnMini',()=>{const result=spawnElite('mini',miniSelect.value);setStatus(result.ok?`${result.name} 등장`:`중간보스 실패 · ${result.reason}`,result.ok);});
    onClick('#devSpawnBoss',()=>{const result=spawnElite('boss',bossSelect.value);setStatus(result.ok?`${result.name} 등장`:`보스 실패 · ${result.reason}`,result.ok);});
    onClick('#devSpawnVoid',()=>{const result=spawnElite('void',voidSelect.value);setStatus(result.ok?`${result.name} 등장`:`균열 보스 실패 · ${result.reason}`,result.ok);});
    onClick('#devSpawnApex',()=>{const result=spawnApex(apexSelect.value);setStatus(result.ok?`${result.name} 정상 초월체 연출 시작`:`초월체 실패 · ${result.reason}`,result.ok);});
    onClick('#devApplyApexPhase',()=>{const result=applyApexPhase(phaseSelect.value);setStatus(result.ok?`${result.name} · PHASE ${result.phase}`:`페이즈 적용 실패 · ${result.reason}`,result.ok);});
    speedRange?.addEventListener('input',event=>setSpeed(event.target.value));
    for(const button of endless.querySelectorAll('[data-dev-speed]'))button.addEventListener('click',()=>setSpeed(button.dataset.devSpeed));
    syncSpeed();

    const previousSnapshot=api.snapshot?.bind(api);
    Object.assign(api,{
      spawnEndlessEvent:spawnEvent,
      spawnEndlessElite:spawnElite,
      spawnEndlessApex:spawnApex,
      applyEndlessApexPhase:applyApexPhase,
      setDevGameSpeed:setSpeed,
      endlessEventTypes:EVENT_TYPES.map(([id])=>id),
      endlessElitePools:Object.fromEntries(Object.entries(ELITE_POOLS).map(([key,pairs])=>[key,pairs.map(([id])=>id)]))
    });
    if(previousSnapshot)api.snapshot=()=>({...previousSnapshot(),gameSpeed:window.stackfallGameSpeed?.()||state.gameSpeed||1,endlessTools:true});
  }
  mount();
})();
