(function(){
  const locale=()=>GAME_SETTINGS?.language||'ko',compact=()=>matchMedia('(pointer:coarse)').matches||innerWidth<760;
  const P={
    ko:{open:'능력',title:'획득 능력',subtitle:'현재 빌드와 실제 적용 효과 · I / Tab',close:'닫기',summary:'빌드 요약',weapons:'장비',passives:'패시브',traits:'보스 특수 패시브',augments:'무기 특수효과',nebula:'성운·우주선 개조',apex:'초월체 유산',none:'아직 획득하지 않음',stack:'중첩',active:'적용 중',damage:'피해 배율',cdr:'주기 감소',speed:'이동 속도',magnet:'자석 범위',crit:'치명타',reduction:'피해 감소',maxHp:'최대 체력',regen:'초당 재생',xp:'경험치 획득',projSpeed:'투사체 속도',projSize:'투사체 크기',pierce:'추가 관통',elite:'정예 피해',shield:'보호막 재충전',chainTime:'연쇄 유지',chainDamage:'연쇄 피해',orbit:'공전 속도',copy:'공격 복제 확률'},
    en:{open:'ABILITIES',title:'ACQUIRED ABILITIES',subtitle:'Current build and applied effects · I / Tab',close:'CLOSE',summary:'BUILD SUMMARY',weapons:'EQUIPMENT',passives:'PASSIVES',traits:'BOSS TRAITS',augments:'WEAPON AUGMENTS',nebula:'NEBULA & STARSHIP MODS',apex:'APEX LEGACIES',none:'Nothing acquired yet',stack:'STACK',active:'ACTIVE',damage:'Damage',cdr:'Cooldown reduction',speed:'Move speed',magnet:'Pickup radius',crit:'Critical',reduction:'Damage reduction',maxHp:'Max health',regen:'Health regen / s',xp:'Experience gain',projSpeed:'Projectile speed',projSize:'Projectile size',pierce:'Extra pierce',elite:'Elite damage',shield:'Shield recharge',chainTime:'Chain duration',chainDamage:'Chain damage',orbit:'Orbit speed',copy:'Attack copy chance'}
  };
  const l=k=>(P[locale()]||P.en)[k]||P.en[k]||k;
  const traitMeta={stellar:['✹','#ffe49a','항성 왕관','주기적으로 가까운 적들을 관통하는 별빛 광선.'],aegis:['⬢','#83ffd1','공허의 가호','주기적으로 강력한 보호막 충전.'],singularity:['✺','#d86cff','특이점 혈맥','처치 누적 시 적을 압축하는 붕괴성 특이점 생성.'],eclipse:['◒','#ff76bd','일식 동력로','상시 피해 증가와 저체력 추가 증폭.'],chrono:['◎','#8fffe0','찰나의 꽃','주기적으로 주변 적의 시간 정지.'],harvest:['✦','#ff9a9a','별의 수확','처치 시 회복, 정예 처치 시 대량 회복.']};
  const augmentMeta={core:['✷','#eafcff','항성 연사'],blade:['◒','#7ce8ff','공간 절개'],ember:['✦','#ff7b9e','연쇄 성화'],bulwark:['◈','#74f2a7','반사 장벽'],gravity:['◉','#9e79ff','종말 붕괴'],comet:['⟐','#b5f5ff','혜성 편대'],prism:['✧','#c2a7ff','과열 성선'],chrono:['◎','#8fffe0','시간 파쇄'],arc:['☾','#69ffe0','포식 궤도'],ion:['⌁','#72f2ff','초전도 성좌망'],nova:['✹','#ffbd69','역행 초신성'],drone:['⌁','#8fffd0','낙성 표식'],rail:['━','#b7e7ff','궤도 파쇄'],spiral:['◎','#e3a7ff','역나선 은하'],mirror:['◇','#9fffe7','쌍면 반사']};
  const nebulaMeta={power:['▲','#ff7f9f','출력 보정','모든 피해 +10%'],haste:['◎','#8fffe0','시간 보정','공격 주기 -8%'],magnet:['⊕','#ffdc75','중력 보정','자석 범위 +45'],vital:['✚','#ff9eaf','생명 성운','최대 체력 +10%'],navigation:['➤','#9fb4ff','항행 성운','이동 속도 +8%'],photon:['✦','#83e9ff','광자 성운','투사체 속도 +12%, 크기 +8%'],ward:['⬢','#7df0c4','방벽 성운','더 강한 주기적 보호막 충전'],chain:['⌁','#ff83c4','연쇄 성운','연쇄 유지시간 +28%']};
  const apexMeta={chronophage:['⌛','#79ffe1','시간포식자의 잔향'],starforge:['☀','#ffb04e','종말 항성의 용광로'],lastconstellation:['✶','#b7c9ff','마지막 성좌의 가호']};
  const weaponMeta={core:['✷','#eafcff']};
  function ledgerWeaponText(key){if(key!=='core')return weaponText(key);return locale()==='ko'?{name:'코어 펄스',desc:'가까운 적을 자동 추적하는 기본 광자 무기.'}:{name:'Core Pulse',desc:'An automatic photon weapon that tracks the nearest enemy.'};}

  const button=document.createElement('button');button.id='abilityLedgerBtn';button.type='button';button.title='I / Tab';button.className='hidden';button.innerHTML='<span class="ledger-glyph">✦</span><b></b><em>I / TAB</em><i>0</i>';document.querySelector('#app').appendChild(button);
  const pauseModal=document.querySelector('#pauseScreen .modal'),pauseButton=document.createElement('button');pauseButton.id='pauseAbilityBtn';pauseButton.className='secondary-btn hidden';pauseButton.type='button';pauseModal?.insertBefore(pauseButton,document.querySelector('#pauseSettingsBtn'));
  const overlay=document.createElement('section');overlay.id='abilityLedgerScreen';overlay.className='overlay hidden';overlay.innerHTML='<div class="ledger-shell"><header class="ledger-head"><div><p id="ledgerKicker"></p><h2 id="ledgerTitle"></h2><span id="ledgerSubtitle"></span></div><button id="ledgerCloseX" type="button">×</button></header><div id="ledgerSummary" class="ledger-summary"></div><div id="ledgerBody" class="ledger-body"></div><button id="ledgerCloseBtn" class="primary-btn" type="button"><span></span></button></div>';document.querySelector('#app').appendChild(overlay);
  const css=document.createElement('style');css.textContent=`#abilityLedgerBtn{position:fixed;left:0;top:50%;z-index:31;width:58px;height:126px;transform:translateY(-50%);border:1px solid rgba(135,220,255,.28);border-left:0;border-radius:0 18px 18px 0;background:linear-gradient(180deg,rgba(15,28,63,.94),rgba(5,9,24,.97));color:#eafaff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer}#abilityLedgerBtn.hidden{display:none}#abilityLedgerBtn b{writing-mode:vertical-rl;font-size:9px;letter-spacing:.12em}#abilityLedgerBtn em{font-style:normal;font-size:7px;color:#91ecff}#abilityLedgerBtn i{font-style:normal;font-size:9px;min-width:20px;padding:2px 5px;border-radius:12px;background:#ff6fae}#abilityLedgerScreen{z-index:72;background:rgba(2,5,17,.78);backdrop-filter:none}.ledger-shell{width:min(1260px,96vw);height:min(870px,93vh);display:flex;flex-direction:column;border:1px solid rgba(142,214,255,.19);border-radius:28px;background:linear-gradient(155deg,rgba(12,23,52,.965),rgba(4,8,21,.97));overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.06)}.ledger-head{display:flex;align-items:center;justify-content:space-between;padding:22px 28px 17px;border-bottom:1px solid rgba(255,255,255,.07)}.ledger-head p{margin:0 0 4px;color:#76dfff;font-size:9px;font-weight:900;letter-spacing:.22em}.ledger-head h2{margin:0;font-size:28px}.ledger-head span{color:#91a1c2;font-size:11px}.ledger-head button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:#070b1c;color:#fff;font-size:25px}.ledger-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:8px;padding:12px 22px;background:rgba(1,5,17,.5)}.ledger-stat{min-height:56px;border-radius:13px;padding:9px 11px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}.ledger-stat.hero{background:linear-gradient(135deg,rgba(78,198,255,.13),rgba(255,85,166,.08))}.ledger-stat small{display:block;color:#8495b8;font-size:8px;margin-bottom:5px}.ledger-stat b{font-size:14px}.ledger-body{flex:1;min-height:0;overflow:auto;padding:18px 24px 28px}.ledger-section{margin-bottom:23px}.ledger-section-title{display:flex;align-items:center;gap:10px;margin-bottom:10px}.ledger-section-title:before{content:"";width:23px;height:2px;background:var(--section-color);box-shadow:0 0 10px var(--section-color)}.ledger-section-title h3{margin:0;font-size:13px}.ledger-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}.ledger-card{position:relative;min-height:112px;padding:14px;border:1px solid color-mix(in srgb,var(--c) 36%,transparent);background:linear-gradient(145deg,color-mix(in srgb,var(--c) 12%,#0b1025),#050814);clip-path:polygon(0 0,92% 0,100% 16%,100% 100%,7% 100%,0 82%)}.ledger-card .card-icon{font-size:25px;color:var(--c);text-shadow:0 0 18px var(--c);margin-bottom:10px}.ledger-card h4{margin:0 0 4px;font-size:13px}.ledger-card p{margin:0;color:#91a0bd;font-size:10px;line-height:1.45}.ledger-card .count{position:absolute;right:12px;top:10px;color:var(--c);font-size:10px}.ledger-empty{padding:15px;border:1px dashed rgba(255,255,255,.1);border-radius:14px;color:#71809d;font-size:11px}#ledgerCloseBtn{align-self:center;flex:0 0 auto;width:min(320px,80%);margin:0 0 18px}@media(max-width:760px){#abilityLedgerBtn{top:auto;bottom:168px;width:46px;height:104px}#abilityLedgerScreen{padding:8px}.ledger-shell{width:100%;height:100%;border-radius:18px}.ledger-head{flex:0 0 auto;padding:13px 15px 11px}.ledger-head h2{font-size:22px}.ledger-head span{font-size:9px}.ledger-head button{width:38px;height:38px}.ledger-summary{display:flex;flex:0 0 76px;gap:6px;padding:8px 10px;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;overscroll-behavior-x:contain}.ledger-stat{flex:0 0 112px;min-height:58px;padding:8px 9px}.ledger-body{padding:12px}.ledger-grid{grid-template-columns:1fr 1fr}#ledgerCloseBtn{height:42px;margin:0 auto 9px}}@media(max-width:480px){.ledger-grid{grid-template-columns:1fr}}`;document.head.appendChild(css);

  function reconcileWeaponSlots(){
    state.weaponSlots=Array.isArray(state.weaponSlots)?state.weaponSlots:[];
    const valid=[];
    for(const key of state.weaponSlots)if(key!=='core'&&WEAPONS[key]&&weaponCount(key)>0&&!valid.includes(key))valid.push(key);
    for(const[key,count]of Object.entries(state.weaponStacks||{}))if(key!=='core'&&count>0&&WEAPONS[key]&&!valid.includes(key))valid.push(key);
    state.weaponSlots=valid.slice(0,6);
    if(!Number.isFinite(state.weaponStacks?.core)||state.weaponStacks.core<1)state.weaponStacks.core=1;
  }
  function acquiredCount(){return Object.values(state.weaponStacks||{}).filter(v=>v>0).length+Object.values(state.passives||{}).filter(v=>v>0).length+Object.values(state.bossTraits||{}).filter(Boolean).length+Object.values(state.weaponAugments||{}).filter(Boolean).length+Object.values(state.nebulaBoosts||{}).filter(v=>v>0).length+Object.values(state.nebulaExtras||{}).filter(v=>v>0).length+Object.values(state.apexBoons||{}).filter(v=>v>0).length;}
  let ledgerOpen=false,openedFromPause=false,openedFromChoice=false,resumeAfterLedger=false;
  function hideLedger(){ledgerOpen=false;overlay.classList.add('hidden');overlay.querySelector('.ledger-detail-layer')?.classList.add('hidden');}
  function syncVisibility(){if(ledgerOpen&&!['playing','paused','choice'].includes(state.mode)){hideLedger();openedFromPause=false;openedFromChoice=false;}const settingsOpen=!document.querySelector('#settingsScreen')?.classList.contains('hidden'),visible=['playing','paused','choice'].includes(state.mode)&&!settingsOpen&&!ui.hud.classList.contains('hidden');button.classList.toggle('hidden',!visible);pauseButton.classList.toggle('hidden',state.mode!=='paused'||settingsOpen);}
  window.syncAbilityLedgerVisibility=syncVisibility;
  function updateButton(){button.querySelector('b').textContent=l('open');button.querySelector('i').textContent=acquiredCount();pauseButton.textContent=l('title');syncVisibility();}
  function card(icon,color,name,desc,count='',data=''){return`<article class="ledger-card" ${data} style="--c:${color}"><div class="card-icon">${icon}</div>${count?`<span class="count">${count}</span>`:''}<h4>${name}</h4><p>${desc}</p></article>`;}
  function section(title,color,cards){return`<section class="ledger-section" style="--section-color:${color}"><div class="ledger-section-title"><h3>${title}</h3><span>${cards.length}</span></div>${cards.length?`<div class="ledger-grid">${cards.join('')}</div>`:`<div class="ledger-empty">${l('none')}</div>`}</section>`;}
  function shieldText(){const n=(state.salvageBarrierStacks||0)+(state.nebulaExtras?.ward||0);if(n>0)return`+${10+n*3} / ${Math.max(4.2,8.2-n*.5).toFixed(1)}s`;const b=weaponCount('bulwark');return b>=3?`+${b>=5?10:6} / ${b>=5?'6.2':'9.0'}s`:'—';}
  const pct=v=>`${Math.round(v*100)}%`;
  function apexDescription(key,stack){if(key==='chronophage')return`중첩마다 시간 정지 주기 감소, 범위·지속 증가. 현재 ${Math.max(14,30-stack*3)}초 주기.`;if(key==='starforge')return`중첩마다 항성 폭발 주기·범위·화력 증가. 현재 ${Math.max(10,22-stack*2)}초 주기.`;return`중첩마다 성좌 방벽 주기와 보호막량 증가. 현재 ${Math.max(7,13-stack*1.25).toFixed(1)}초 주기.`;}
  function renderLedger(){
    reconcileWeaponSlots();updateButton();$('#ledgerKicker').textContent=l('summary');$('#ledgerTitle').textContent=l('title');$('#ledgerSubtitle').textContent=l('subtitle');$('#ledgerCloseBtn span').textContent=l('close');
    const regen=stat('regen')*.625,projSpeed=(1+stat('projectileSpeed')*.10)*(1+(state.nebulaExtras?.photon||0)*.12)-1,projSize=(1+stat('projectileSize')*.10)*(1+(state.nebulaExtras?.photon||0)*.08)-1,echoStacks=stat('echo'),copyChance=echoStacks?Math.min(.60,echoStacks*.075):0;
    const chainTime=(typeof chainDurationMultiplier==='function'?chainDurationMultiplier():(1+stat('chain')*.25)*(1+(state.nebulaExtras?.chain||0)*.28))-1;
    const chainDamage=typeof chainDamageBonus==='function'?chainDamageBonus():Math.min(10,Math.floor((state.combo||0)/5))*.03;
    const stats=[[l('summary'),`LV.${state.level} · ${state.kills} KILLS`,'hero'],[l('damage'),`×${damageMult().toFixed(2)}`],[l('cdr'),pct(Math.max(0,1-hasteMult()))],[l('speed'),Math.round(player.speed*(1+stat('speed')*.09)*(1+(state.nebulaExtras?.navigation||0)*.08))],[l('magnet'),Math.round(magnetRange())],[l('crit'),pct(clamp(.05+stat('crit')*.06,.05,1))],[l('reduction'),pct(damageReduction())],[l('maxHp'),Math.round(player.maxHp)],[l('regen'),regen.toFixed(1)],[l('xp'),pct(Math.max(0,xpMult()-1))],[l('projSpeed'),pct(projSpeed)],[l('projSize'),pct(projSize)],[l('pierce'),`+${stat('pierce')}`],[l('elite'),pct(stat('eliteHunter')*.12)],[l('shield'),shieldText()],[l('chainTime'),pct(chainTime)],[l('chainDamage'),pct(chainDamage)],[l('orbit'),pct(stat('projectileSpeed')*.08)],[l('copy'),`${pct(copyChance)}${echoStacks>=8?' · 5회마다 확정':''}`]];
    $('#ledgerSummary').innerHTML=stats.map(([n,v,c])=>`<div class="ledger-stat ${c||''}"><small>${n}</small><b>${v}</b></div>`).join('');
    const weapons=Object.entries(state.weaponStacks||{}).filter(([,v])=>v>0).map(([k,v])=>{const w=WEAPONS[k],m=w?[w.icon,w.color]:(weaponMeta[k]||['✦','#aeeeff']),t=ledgerWeaponText(k),e=stackEffectText(k,v),effect=[e.name,e.desc].filter(Boolean).join(' · ');return card(m[0],m[1],t.name,effect||t.desc,`×${v}`,`data-weapon-key="${k}" tabindex="0"`);});
    const passives=Object.entries(state.passives||{}).filter(([,v])=>v>0).map(([k,v])=>{const p=PASSIVES[k]||{icon:'✦',color:'#ffd98f'},t=passiveText(k);return card(p.icon,p.color,t.name,t.desc,`×${v}`,`data-passive-key="${k}" tabindex="0"`);});
    const traits=Object.entries(state.bossTraits||{}).filter(([,v])=>v).map(([k])=>{const m=traitMeta[k]||['✦','#ffd98f',k,''];return card(m[0],m[1],m[2],m[3],l('active'));});
    const augments=Object.entries(state.weaponAugments||{}).filter(([,v])=>v).map(([k])=>{const m=augmentMeta[k]||['✦','#aeeeff',k],wt=ledgerWeaponText(k).name||k,name=k==='prism'?(locale()==='ko'?'과열 성선':'Overheat Starline'):m[2];return card(m[0],m[1],name,wt,l('active'),`data-augment-key="${k}"`);});
    const nebula=[];for(const[k,v]of Object.entries(state.nebulaBoosts||{}))if(v>0&&nebulaMeta[k]){const m=nebulaMeta[k];nebula.push(card(m[0],m[1],m[2],m[3],`×${v}`));}for(const[k,v]of Object.entries(state.nebulaExtras||{}))if(v>0&&nebulaMeta[k]){const m=nebulaMeta[k];nebula.push(card(m[0],m[1],m[2],m[3],`×${v}`));}if(state.salvageHullStacks)nebula.push(card('✚','#ff9eaf','강화 선체','최대 체력 10% 증가.',`×${state.salvageHullStacks}`));if(state.salvageBarrierStacks)nebula.push(card('⬢','#78f0c2','자동 방벽 발생기','일정 시간마다 보호막 재충전.',`×${state.salvageBarrierStacks}`));if(state.voidImprintStacks)nebula.push(card('◈','#c37aff','공허 각인','피해와 공격 주기를 함께 강화.',`×${state.voidImprintStacks}`));
    const apex=Object.entries(state.apexBoons||{}).filter(([,v])=>v).map(([k,v])=>{const m=apexMeta[k]||['✶','#fff',k];return card(m[0],m[1],m[2],apexDescription(k,v),`×${v}`);});
    $('#ledgerBody').innerHTML=section(l('weapons'),'#79e6ff',weapons)+section(l('passives'),'#ffcb70',passives)+section(l('traits'),'#e7b0ff',traits)+section(l('augments'),'#ff75ad',augments)+section(l('nebula'),'#77f0d6',nebula)+section(l('apex'),'#fff2a6',apex);
    overlay.dispatchEvent(new CustomEvent('stackfall:ledger-rendered'));
  }
  function openLedger(){
    if(!['playing','paused','choice'].includes(state.mode)||!document.querySelector('#settingsScreen')?.classList.contains('hidden'))return;
    try{
      const originMode=state.mode,wasPaused=originMode==='paused',wasChoice=originMode==='choice';renderLedger();ledgerOpen=true;openedFromPause=wasPaused;openedFromChoice=wasChoice;resumeAfterLedger=originMode==='playing';if(wasChoice)ui.choice.classList.add('hidden');state.mode='paused';
      state.input.keys.clear();state.input.touchX=state.input.touchY=0;
      if(openedFromPause)ui.pauseScreen.classList.add('hidden');
      ui.touch.classList.add('hidden');overlay.classList.remove('hidden');syncVisibility();
    }catch(error){
      hideLedger();if(openedFromPause)ui.pauseScreen.classList.remove('hidden');if(openedFromChoice)ui.choice.classList.remove('hidden');openedFromPause=false;openedFromChoice=false;
      console.error('[Stackfall] ability ledger failed',error);syncVisibility();
    }
  }
  function closeLedger(force=false){const restorePause=openedFromPause&&state.mode==='paused',restoreChoice=openedFromChoice&&state.mode==='paused',resume=resumeAfterLedger;hideLedger();openedFromPause=false;openedFromChoice=false;resumeAfterLedger=false;if(!force){if(restorePause)ui.pauseScreen.classList.remove('hidden');else if(restoreChoice){state.mode='choice';ui.choice.classList.remove('hidden');}else{if(resume&&state.mode==='paused')state.mode='playing';if(state.mode==='playing'&&compact())ui.touch.classList.remove('hidden');}updateHUD();}syncVisibility();}
  function toggleLedger(){ledgerOpen?closeLedger():openLedger();}
  window.isAbilityLedgerOpen=()=>ledgerOpen;window.openAbilityLedger=openLedger;window.toggleAbilityLedger=toggleLedger;window.closeAbilityLedger=closeLedger;window.resetAbilityLedger=()=>{hideLedger();openedFromPause=false;openedFromChoice=false;resumeAfterLedger=false;queueMicrotask(updateButton);};
  button.onclick=toggleLedger;pauseButton.onclick=openLedger;$('#ledgerCloseX').onclick=()=>closeLedger();$('#ledgerCloseBtn').onclick=()=>closeLedger();

  const baseRenderLoadout=renderLoadout;
  let lastLoadoutSignature='';
  function loadoutSignature(){
    const slots=(state.weaponSlots||[]).map(key=>[key,weaponCount(key)]);
    const passives=Object.entries(state.passives||{}).sort(([a],[b])=>a.localeCompare(b));
    return JSON.stringify([weaponCount('core'),slots,passives]);
  }
  function renderSyncedLoadout(force=false){
    reconcileWeaponSlots();
    const signature=loadoutSignature();
    if(force||signature!==lastLoadoutSignature){baseRenderLoadout();lastLoadoutSignature=signature;}
  }
  renderLoadout=function(){renderSyncedLoadout(true);updateButton();};
  const baseUpdateHUD=updateHUD;
  updateHUD=function(){
    renderSyncedLoadout(false);baseUpdateHUD();sf2UpdateCooldownHud();
    const duration=2.15*(typeof chainDurationMultiplier==='function'?chainDurationMultiplier():(1+stat('chain')*.25));
    ui.comboBar.style.transform=`scaleX(${clamp(state.comboTimer/Math.max(.001,duration),0,1)})`;
    const comboBonusEl=document.querySelector('#comboBonusText'),bonus=typeof chainDamageBonus==='function'?chainDamageBonus():0;
    if(comboBonusEl)comboBonusEl.textContent=bonus>0?`+${Math.round(bonus*100)}% ${locale()==='ko'?'피해':'DMG'}`:'';
    syncVisibility();
  };
  const baseApplyLanguage=applyLanguage;
  applyLanguage=function(){baseApplyLanguage();lastLoadoutSignature='';renderSyncedLoadout(true);updateButton();if(ledgerOpen)renderLedger();};
  renderSyncedLoadout(true);updateButton();
})();
