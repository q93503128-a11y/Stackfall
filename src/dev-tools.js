(()=>{
  'use strict';
  const params=new URLSearchParams(location.search);
  const requested=params.get('dev')==='1';
  if(requested){try{localStorage.setItem('stackfall.devMode','1');}catch{}}
  let enabled=requested;
  try{enabled=enabled||localStorage.getItem('stackfall.devMode')==='1';}catch{}
  if(!enabled)return;

  const allWeapons=()=>Object.keys(window.stackfallAwakeningDefs||{}).filter(key=>WEAPONS?.[key]);
  const allStages=()=>[...(window.STACKFALL_STAGE_CATALOG||[])].sort((a,b)=>(a.order||0)-(b.order||0));
  const weaponName=key=>WEAPONS?.[key]?.name||key;
  const stageName=stage=>{
    const title=stage?.title;
    if(typeof title==='string')return title;
    if(title&&typeof title==='object')return title.ko||title.en||stage.id;
    return stage?.id||'stage';
  };
  const syncUi=()=>{try{renderLoadout?.();}catch{}try{updateHUD?.();}catch{}try{window.renderStackfallGalaxyMap?.();}catch{}};
  const clearCombatEntities=()=>{
    const entities=state.entities||{};
    for(const value of Object.values(entities))if(Array.isArray(value))value.length=0;
    state.bossActiveId=null;state.apexActiveId=null;state.pendingApexForm=null;
  };
  const resetAwakeningTransients=()=>{
    window.stackfallResetAwakeningFirstSetCombat?.();
    window.stackfallResetAwakeningSecondSetCombat?.();
    window.stackfallResetAwakeningThirdSetCombat?.();
  };
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
    <p>로컬 테스트 프로필 · 실제 로그인/서버 인증 없음</p>
    <label>무기</label>
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
    </div>
    <button id="devDisable" class="danger">이 브라우저에서 개발 모드 해제</button>
    <div id="devStatus" class="dev-status"></div>
  `;
  document.body.appendChild(panel);

  const toggle=document.createElement('button');toggle.id='stackfallDevToggle';toggle.type='button';toggle.textContent='DEV';document.body.appendChild(toggle);
  const $=sel=>panel.querySelector(sel),weapon=$('#devWeapon'),stage=$('#devStage'),status=$('#devStatus');
  const updateStatus=()=>{const cfg=window.stackfallCurrentRunConfig?.();const key=weapon.value;status.textContent=`RUN ${cfg?.mode||state.mode} · ${cfg?.stage?.id||'-'} · ${weaponName(key)} ${weaponCount(key)||0}중첩 · 각성 ${state.awakenedWeapons?.[key]?'ON':'OFF'}`;};
  toggle.onclick=()=>{panel.classList.toggle('hidden');updateStatus();};
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
  $('#devDisable').onclick=()=>{try{localStorage.removeItem('stackfall.devMode');}catch{}const url=new URL(location.href);url.searchParams.delete('dev');location.replace(url.toString());};
  weapon.onchange=updateStatus;stage.onchange=updateStatus;
  window.addEventListener('keydown',event=>{if(event.code==='F10'){event.preventDefault();panel.classList.toggle('hidden');updateStatus();}});
  window.stackfallDeveloperTest={
    enabled:true,
    equipOnly,equipAll,startStage,startEndless,jumpStageBoss,giveCores,clearAwakenings,
    snapshot:()=>({run:window.stackfallCurrentRunConfig?.(),weaponStacks:{...(state.weaponStacks||{})},awakened:{...(state.awakenedWeapons||{})},cores:state.awakeningCores||0,canonicalVisuals:window.stackfallCanonicalWeaponVisualDiagnostics?.()||null,renderer:window.stackfallRendererInfo?.()||null})
  };
})();