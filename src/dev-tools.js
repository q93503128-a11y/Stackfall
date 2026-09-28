(()=>{
  'use strict';
  const params=new URLSearchParams(location.search);
  const requested=params.get('dev')==='1';
  try{localStorage.removeItem('stackfall.devMode');}catch{}
  if(!requested)return;

  const allWeapons=()=>Object.keys(window.stackfallAwakeningDefs||{}).filter(key=>WEAPONS?.[key]);
  const equipmentWeapons=()=>allWeapons().filter(key=>key!=='core');
  const allStages=()=>[...(window.STACKFALL_STAGE_CATALOG||[])].sort((a,b)=>(a.order||0)-(b.order||0));
  const weaponName=key=>WEAPONS?.[key]?.name||key;
  const DEV_SLOT_COUNT=6;
  const DEV_INFINITE_CURRENCY_VALUE=999999999;
  const baseDevCurrency=window.stackfallCurrency;
  const baseDevSpendCurrency=window.stackfallSpendCurrency;
  let infiniteCurrency=false,refreshSlotEditor=()=>{};
  try{infiniteCurrency=localStorage.getItem('stackfall.devInfiniteCurrency')==='1';}catch{}
  window.stackfallDevInfiniteCurrency=infiniteCurrency;
  if(typeof baseDevCurrency==='function')window.stackfallCurrency=key=>window.stackfallDevInfiniteCurrency===true?DEV_INFINITE_CURRENCY_VALUE:baseDevCurrency(key);
  if(typeof baseDevSpendCurrency==='function')window.stackfallSpendCurrency=cost=>window.stackfallDevInfiniteCurrency===true?true:baseDevSpendCurrency(cost);
  const stageName=stage=>{
    const title=stage?.title;
    if(typeof title==='string')return title;
    if(title&&typeof title==='object')return title.ko||title.en||stage.id;
    return stage?.id||'stage';
  };
  const syncUi=()=>{try{renderLoadout?.();}catch{}try{updateHUD?.();}catch{}try{window.renderStackfallGalaxyMap?.();}catch{}try{window.renderStackfallMetaUi?.();}catch{}try{refreshSlotEditor();}catch{}};
  const clearCombatEntities=()=>{
    resetAwakeningTransients();
    const entities=state.entities||{};
    for(const value of Object.values(entities))if(Array.isArray(value))value.length=0;
    state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;
  };
  const resetAwakeningTransients=()=>{
    // DEV loadout changes are a new combat sample, including delayed casts and
    // untagged beams/particles emitted by the previous loadout. Keep world actors.
    clearPendingCombatActions();
    for(const key of ['projectiles','curves','wells','beams','particles','shockwaves','vacuumSeeds','phaseMines','guidedMissiles','gateNetworks']){
      const list=state.entities[key];if(Array.isArray(list))list.length=0;
    }
    for(const enemy of state.entities.enemies||[])if(enemy)enemy.timeLock=0;
    window.stackfallResetAwakeningFirstSetCombat?.();
    window.stackfallResetAwakeningSecondSetCombat?.();
    window.stackfallResetAwakeningThirdSetCombat?.();
  };
  function currentSlotConfig(){
    const result=[],seen=new Set(),slots=Array.isArray(state.weaponSlots)?state.weaponSlots:[];
    for(const key of slots){
      if(result.length>=DEV_SLOT_COUNT)break;
      if(!key||key==='core'||!WEAPONS?.[key]||seen.has(key))continue;
      seen.add(key);const level=Math.max(1,Math.min(6,Math.floor(Number(state.weaponStacks?.[key])||1)));
      result.push({key,level,awake:state.awakenedWeapons?.[key]===true});
    }
    while(result.length<DEV_SLOT_COUNT)result.push({key:'',level:1,awake:false});
    return result;
  }
  function currentCoreConfig(){
    const level=Math.max(0,Math.min(6,Math.floor(Number(state.weaponStacks?.core)||0)));
    return{level,awake:level>0&&state.awakenedWeapons?.core===true};
  }
  function applyDevLoadout(config,currentCore=currentCoreConfig()){
    resetAwakeningTransients();
    const stacks={},slots=[],awakened={},seen=new Set();
    for(const entry of config.slice(0,DEV_SLOT_COUNT)){
      const key=entry?.key;if(!key||key==='core'||!WEAPONS?.[key]||seen.has(key))continue;
      seen.add(key);const level=Math.max(1,Math.min(6,Math.floor(Number(entry.level)||1)));
      slots.push(key);stacks[key]=level;if(entry.awake===true&&level===6)awakened[key]=true;
    }
    const coreLevel=Math.max(0,Math.min(6,Math.floor(Number(currentCore.level)||0)));
    if(coreLevel>0){stacks.core=coreLevel;if(currentCore.awake===true&&coreLevel===6)awakened.core=true;}
    state.weaponSlots=slots;state.weaponStacks=stacks;state.awakenedWeapons=awakened;
    if(slots[0])state.selectedStarter=slots[0];
    syncUi();
  }
  function assignDevSlot(index,key){
    const config=currentSlotConfig(),i=Math.max(0,Math.min(DEV_SLOT_COUNT-1,Math.floor(Number(index)||0))),next=String(key||'');
    const previous={...config[i]};
    if(!next){config.splice(i,1);config.push({key:'',level:1,awake:false});applyDevLoadout(config);return;}
    if(next==='core'||!WEAPONS?.[next])return;
    const duplicate=config.findIndex((entry,slot)=>slot!==i&&entry.key===next);
    const existingLevel=Math.max(1,Math.min(6,Math.floor(Number(state.weaponStacks?.[next])||1))),existingAwake=state.awakenedWeapons?.[next]===true;
    config[i]={key:next,level:existingLevel,awake:existingAwake&&existingLevel===6};
    if(duplicate>=0)config[duplicate]=previous.key?previous:{key:'',level:1,awake:false};
    applyDevLoadout(config);
  }
  function setDevSlotLevel(index,level){
    const config=currentSlotConfig(),i=Math.max(0,Math.min(DEV_SLOT_COUNT-1,Math.floor(Number(index)||0))),entry=config[i];if(!entry?.key)return;
    entry.level=Math.max(1,Math.min(6,Math.floor(Number(level)||1)));if(entry.level<6)entry.awake=false;applyDevLoadout(config);
  }
  function setDevSlotAwakening(index,on){
    const config=currentSlotConfig(),i=Math.max(0,Math.min(DEV_SLOT_COUNT-1,Math.floor(Number(index)||0))),entry=config[i];if(!entry?.key)return;
    entry.awake=on===true;if(entry.awake)entry.level=6;applyDevLoadout(config);
  }
  function setDevCoreLevel(level){
    const core=currentCoreConfig();core.level=Math.max(0,Math.min(6,Math.floor(Number(level)||0)));if(core.level<6)core.awake=false;applyDevLoadout(currentSlotConfig(),core);
  }
  function setDevCoreAwakening(on){
    const core=currentCoreConfig();core.awake=on===true;if(core.awake)core.level=6;applyDevLoadout(currentSlotConfig(),core);
  }
  function setInfiniteCurrency(on){
    window.stackfallDevInfiniteCurrency=on===true;
    try{localStorage.setItem('stackfall.devInfiniteCurrency',window.stackfallDevInfiniteCurrency?'1':'0');}catch{}
    syncUi();
    return window.stackfallDevInfiniteCurrency;
  }
  function equipOnly(key,level=1,awaken=false){
    if(!WEAPONS?.[key])return;
    resetAwakeningTransients();
    state.weaponStacks={};state.weaponSlots=[];
    state.weaponStacks[key]=Math.max(1,Math.min(6,Math.floor(level)||1));
    if(key!=='core')state.weaponSlots=[key];
    state.awakenedWeapons=state.awakenedWeapons&&typeof state.awakenedWeapons==='object'?state.awakenedWeapons:{};
    for(const k of Object.keys(state.awakenedWeapons))delete state.awakenedWeapons[k];
    if(awaken){state.weaponStacks[key]=6;state.awakenedWeapons[key]=true;}
    state.selectedStarter=key;
    syncUi();
  }
  function equipAll(level=1,awaken=false){
    resetAwakeningTransients();
    const keys=allWeapons();state.weaponStacks={};state.weaponSlots=[];state.awakenedWeapons={};
    for(const key of keys){state.weaponStacks[key]=Math.max(1,Math.min(6,Math.floor(level)||1));if(key!=='core')state.weaponSlots.push(key);if(awaken)state.awakenedWeapons[key]=true;}
    syncUi();
  }
  function toggleSelectedAwakening(key){
    if(!WEAPONS?.[key])return;
    state.awakenedWeapons=state.awakenedWeapons&&typeof state.awakenedWeapons==='object'?state.awakenedWeapons:{};
    const next=!state.awakenedWeapons[key];if(!next)resetAwakeningTransients();if(next)state.weaponStacks[key]=6;
    state.awakenedWeapons[key]=next;
    if(!state.weaponStacks[key])state.weaponStacks[key]=next?6:1;
    if(key!=='core'&&!state.weaponSlots.includes(key))state.weaponSlots=[key];
    syncUi();
  }
  function startStage(stageId){
    const stage=window.stackfallStageById?.(stageId);if(!stage)return;
    state.runSelection={mode:'stage',stageId:stage.id};
    resetGame();
    syncUi();
  }
  function startEndless(){state.runSelection={mode:'endless',stageId:null};resetGame();syncUi();}
  function jumpStageBoss(){
    const cfg=window.stackfallCurrentRunConfig?.();if(cfg?.mode!=='stage'||!cfg.stage)return;
    state.time=Math.max(state.time||0,Number(cfg.stage.boss?.spawnAt||cfg.stage.durationSeconds||60)+.05);state.spawnTimer=0;
  }
  function fullHeal(){player.hp=player.maxHp;player.shield=Math.max(player.shield||0,typeof shieldCapacity==='function'?shieldCapacity():0);player.invuln=Math.max(player.invuln||0,2);syncUi();}
  function giveCores(){state.awakeningCores=99;syncUi();}
  function clearAwakenings(){resetAwakeningTransients();state.awakenedWeapons={};syncUi();}
  function openSpecialReward(){
    if(state.mode==='gameover'||state.mode==='menu')return false;
    try{closeAbilityLedger?.(true);}catch{}
    if(!Array.isArray(state.rewardQueue))state.rewardQueue=[];
    state.rewardQueue.push('dev');
    window.updateRewardQueue?.();
    return state.mode==='bossReward';
  }

  const style=document.createElement('style');
  style.textContent=`
    #stackfallDevToggle{position:fixed;right:18px;bottom:18px;z-index:1002;border:1px solid rgba(144,232,255,.45);border-radius:12px;padding:9px 12px;background:rgba(5,11,28,.92);color:#bff6ff;font:800 12px/1 "IBM Plex Sans KR",sans-serif;letter-spacing:.08em;box-shadow:0 8px 30px rgba(0,0,0,.35);cursor:pointer}
    #stackfallDevPanel{position:fixed;right:18px;bottom:62px;z-index:1001;width:min(390px,calc(100vw - 28px));max-height:min(720px,calc(100vh - 90px));overflow:auto;border:1px solid rgba(139,213,255,.30);border-radius:18px;background:rgba(5,8,22,.96);color:#eef8ff;box-shadow:0 20px 70px rgba(0,0,0,.56);backdrop-filter:blur(14px);padding:16px;font-family:"IBM Plex Sans KR",sans-serif}
    #stackfallDevPanel.hidden{display:none}
    #stackfallDevPanel h3{margin:0 0 4px;font:900 18px/1.2 "Black Han Sans","IBM Plex Sans KR",sans-serif}
    #stackfallDevPanel p{margin:0 0 14px;color:#8292b4;font-size:11px}
    #stackfallDevPanel .dev-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 14px}
    #stackfallDevPanel .dev-wide{grid-column:1/-1}
    #stackfallDevPanel label{display:block;margin:12px 0 5px;color:#a9badb;font-size:11px;font-weight:800;letter-spacing:.06em}
    #stackfallDevPanel select,#stackfallDevPanel button{width:100%;min-height:38px;border:1px solid rgba(140,174,230,.22);border-radius:10px;background:#10162a;color:#eef5ff;font:700 12px/1.2 "IBM Plex Sans KR",sans-serif}
    #stackfallDevPanel .dev-slot-editor{display:grid;gap:6px;margin:7px 0 14px}
    #stackfallDevPanel .dev-slot-row{display:grid;grid-template-columns:42px minmax(0,1fr) 64px 58px 32px;gap:6px;align-items:center;padding:6px;border:1px solid rgba(140,174,230,.13);border-radius:10px;background:rgba(255,255,255,.025)}
    #stackfallDevPanel .dev-slot-row>b{font-size:10px;color:#91a8ce;text-align:center}
    #stackfallDevPanel .dev-slot-row select{min-height:32px;font-size:10px;padding:0 5px}
    #stackfallDevPanel .dev-slot-awake{display:flex;align-items:center;justify-content:center;gap:4px;margin:0!important;min-height:32px;border:1px solid rgba(126,232,255,.18);border-radius:8px;color:#bdf7ff!important;font-size:9px!important;letter-spacing:0!important}
    #stackfallDevPanel .dev-slot-awake input{margin:0;accent-color:#7ce8ff}
    #stackfallDevPanel .dev-slot-refresh{min-height:32px!important;padding:0!important;font-size:16px!important;line-height:1!important;color:#9eefff!important;border-color:rgba(126,232,255,.18)!important}
    #stackfallDevPanel .dev-slot-core{border-color:rgba(255,208,112,.22);background:rgba(255,208,112,.035)}
    #stackfallDevPanel .dev-slot-note{margin:-6px 0 10px;color:#7285aa;font-size:10px;line-height:1.45}
    #stackfallDevPanel button{cursor:pointer;padding:8px}
    #stackfallDevPanel button:hover{border-color:rgba(126,232,255,.60);background:#16223b}
    #stackfallDevPanel .danger{border-color:rgba(255,110,140,.35);color:#ffb8c8}
    #stackfallDevPanel .accent{border-color:rgba(126,232,255,.40);color:#bdf7ff}
    #stackfallDevPanel .dev-status{margin-top:10px;padding:8px 10px;border-radius:9px;background:rgba(126,232,255,.06);color:#9fb4d7;font-size:11px}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('aside');panel.id='stackfallDevPanel';panel.className='hidden';
  const weaponOptions=allWeapons().map(key=>`<option value="${key}">${weaponName(key)} · ${key}</option>`).join('');
  const stageOptions=allStages().map(stage=>`<option value="${stage.id}">STAGE ${String(stage.order).padStart(2,'0')} · ${stageName(stage)}</option>`).join('');
  panel.innerHTML=`
    <h3>DEVELOPER TEST</h3>
    <p>로컬 테스트 프로필 · 실제 로그인/서버 인증 없음 · F8/F10 패널 토글</p>
    <label>슬롯별 무기 설정</label>
    <div id="devWeaponSlots" class="dev-slot-editor"></div>
    <div class="dev-slot-note">각 슬롯은 무기·중첩·각성을 독립 설정한다. 각성 ON은 해당 무기를 자동으로 6중첩으로 맞춘다. 외부 테스트 버튼이나 런타임 변경 뒤에는 새로고침으로 실제 현재 상태를 다시 읽을 수 있다.</div>
    <button id="devRefreshSlots" class="accent">↻ 슬롯 정보 새로고침</button>
    <label>빠른 단일/일괄 테스트</label>
    <select id="devWeapon">${weaponOptions}</select>
    <div class="dev-grid">
      <button id="devWeapon1">선택 무기 1중첩</button>
      <button id="devWeapon6">선택 무기 6중첩</button>
      <button id="devAwaken" class="accent">선택 각성 ON/OFF</button>
      <button id="devClearAwaken">각성 전체 해제</button>
      <button id="devAll1">모든 무기 1중첩</button>
      <button id="devAll6">모든 무기 6중첩</button>
      <button id="devAllAwake" class="accent dev-wide">모든 무기 6중첩 + 모든 각성</button>
    </div>
    <label>스테이지</label>
    <select id="devStage">${stageOptions}</select>
    <div class="dev-grid">
      <button id="devStageStart" class="accent">선택 Stage 시작</button>
      <button id="devBossNow">Stage 보스 즉시</button>
      <button id="devEndless">Endless 시작</button>
      <button id="devClearEnemies">적/투사체 정리</button>
      <button id="devHeal">체력·보호막 회복</button>
      <button id="devCores">각성 코어 ×99</button>
      <button id="devReward" class="accent">특수능력 보상창</button>
      <button id="devInfiniteCurrency" class="accent">재화 무한 OFF</button>
    </div>
    <button id="devDisable" class="danger">이 브라우저에서 개발 모드 해제</button>
    <div id="devStatus" class="dev-status"></div>
  `;
  document.body.appendChild(panel);

  const toggle=document.createElement('button');toggle.id='stackfallDevToggle';toggle.type='button';toggle.textContent='DEV';document.body.appendChild(toggle);
  const $=sel=>panel.querySelector(sel),weapon=$('#devWeapon'),stage=$('#devStage'),status=$('#devStatus'),slotEditor=$('#devWeaponSlots'),currencyButton=$('#devInfiniteCurrency');
  function renderSlotEditor(){
    if(!slotEditor)return;
    const config=currentSlotConfig(),core=currentCoreConfig(),options=equipmentWeapons().map(key=>`<option value="${key}">${weaponName(key)}</option>`).join(''),levels=Array.from({length:6},(_,i)=>i+1);
    slotEditor.innerHTML=`<div class="dev-slot-row dev-slot-core"><b>CORE</b><span>${weaponName('core')}</span><select data-core-level><option value="0">OFF</option>${levels.map(level=>`<option value="${level}"${core.level===level?' selected':''}>${level}중첩</option>`).join('')}</select><label class="dev-slot-awake"><input data-core-awake type="checkbox"${core.awake?' checked':''}${core.level===0?' disabled':''}>각성</label><button class="dev-slot-refresh" data-slot-refresh type="button" title="현재 상태 다시 읽기">↻</button></div>`+
      config.map((entry,index)=>`<div class="dev-slot-row" data-slot="${index}"><b>S${index+1}</b><select data-slot-weapon><option value="">— 비움 —</option>${options.replace(`value="${entry.key}"`,`value="${entry.key}" selected`)}</select><select data-slot-level${entry.key?'':' disabled'}>${levels.map(level=>`<option value="${level}"${entry.level===level?' selected':''}>${level}중첩</option>`).join('')}</select><label class="dev-slot-awake"><input data-slot-awake type="checkbox"${entry.awake?' checked':''}${entry.key?'':' disabled'}>각성</label><button class="dev-slot-refresh" data-slot-refresh type="button" title="현재 상태 다시 읽기">↻</button></div>`).join('');
    slotEditor.querySelector('[data-core-level]')?.addEventListener('change',event=>setDevCoreLevel(event.target.value));
    slotEditor.querySelector('[data-core-awake]')?.addEventListener('change',event=>setDevCoreAwakening(event.target.checked));
    slotEditor.querySelector('.dev-slot-core [data-slot-refresh]')?.addEventListener('click',()=>{renderSlotEditor();updateStatus();});
    for(const row of slotEditor.querySelectorAll('[data-slot]')){
      const index=Number(row.dataset.slot);
      row.querySelector('[data-slot-weapon]')?.addEventListener('change',event=>assignDevSlot(index,event.target.value));
      row.querySelector('[data-slot-level]')?.addEventListener('change',event=>setDevSlotLevel(index,event.target.value));
      row.querySelector('[data-slot-awake]')?.addEventListener('change',event=>setDevSlotAwakening(index,event.target.checked));
      row.querySelector('[data-slot-refresh]')?.addEventListener('click',()=>{renderSlotEditor();updateStatus();});
    }
  }
  refreshSlotEditor=renderSlotEditor;
  const updateStatus=()=>{const cfg=window.stackfallCurrentRunConfig?.(),key=weapon.value,currency=window.stackfallDevInfiniteCurrency===true?'∞':'일반';if(currencyButton)currencyButton.textContent=`재화 무한 ${window.stackfallDevInfiniteCurrency===true?'ON':'OFF'}`;status.textContent=`RUN ${cfg?.mode||state.mode} · ${cfg?.stage?.id||'-'} · 장비 ${Math.min(DEV_SLOT_COUNT,state.weaponSlots?.length||0)}/${DEV_SLOT_COUNT} · ${weaponName(key)} ${weaponCount(key)||0}중첩 · 각성 ${state.awakenedWeapons?.[key]?'ON':'OFF'} · 재화 ${currency}`;};
  const refreshDevPanel=()=>{renderSlotEditor();updateStatus();};
  toggle.onclick=()=>{panel.classList.toggle('hidden');if(!panel.classList.contains('hidden'))refreshDevPanel();};
  $('#devRefreshSlots').onclick=refreshDevPanel;
  $('#devWeapon1').onclick=()=>{equipOnly(weapon.value,1,false);updateStatus();};
  $('#devWeapon6').onclick=()=>{equipOnly(weapon.value,6,false);updateStatus();};
  $('#devAwaken').onclick=()=>{toggleSelectedAwakening(weapon.value);updateStatus();};
  $('#devClearAwaken').onclick=()=>{clearAwakenings();updateStatus();};
  $('#devAll1').onclick=()=>{equipAll(1,false);updateStatus();};
  $('#devAll6').onclick=()=>{equipAll(6,false);updateStatus();};
  $('#devAllAwake').onclick=()=>{equipAll(6,true);updateStatus();};
  $('#devStageStart').onclick=()=>{startStage(stage.value);updateStatus();};
  $('#devBossNow').onclick=()=>{jumpStageBoss();updateStatus();};
  $('#devEndless').onclick=()=>{startEndless();updateStatus();};
  $('#devClearEnemies').onclick=()=>{clearCombatEntities();updateStatus();};
  $('#devHeal').onclick=()=>{fullHeal();updateStatus();};
  $('#devCores').onclick=()=>{giveCores();updateStatus();};
  $('#devReward').onclick=()=>{openSpecialReward();updateStatus();};
  $('#devInfiniteCurrency').onclick=()=>{setInfiniteCurrency(window.stackfallDevInfiniteCurrency!==true);updateStatus();};
  $('#devDisable').onclick=()=>{try{localStorage.removeItem('stackfall.devMode');localStorage.removeItem('stackfall.devInfiniteCurrency');}catch{}window.stackfallDevInfiniteCurrency=false;const url=new URL(location.href);url.searchParams.delete('dev');location.replace(url.toString());};
  weapon.onchange=updateStatus;stage.onchange=updateStatus;
  window.addEventListener('keydown',event=>{if(event.code==='F8'||event.code==='F10'){event.preventDefault();panel.classList.toggle('hidden');if(!panel.classList.contains('hidden'))refreshDevPanel();}});
  renderSlotEditor();updateStatus();window.renderStackfallMetaUi?.();
  window.stackfallDeveloperTest={
    enabled:true,
    equipOnly,equipAll,assignSlot:assignDevSlot,setSlotLevel:setDevSlotLevel,setSlotAwakening:setDevSlotAwakening,setCoreLevel:setDevCoreLevel,setCoreAwakening:setDevCoreAwakening,setInfiniteCurrency,startStage,startEndless,jumpStageBoss,giveCores,clearAwakenings,openSpecialReward,
    snapshot:()=>({run:window.stackfallCurrentRunConfig?.(),weaponSlots:[...(state.weaponSlots||[])],weaponStacks:{...(state.weaponStacks||{})},awakened:{...(state.awakenedWeapons||{})},cores:state.awakeningCores||0,infiniteCurrency:window.stackfallDevInfiniteCurrency===true,canonicalVisuals:window.stackfallCanonicalWeaponVisualDiagnostics?.()||null,renderer:window.stackfallRendererInfo?.()||null})
  };
})();
