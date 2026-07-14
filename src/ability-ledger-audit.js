(function(){
  const locale=()=>GAME_SETTINGS?.language||'ko';
  const compact=()=>matchMedia('(pointer: coarse)').matches||innerWidth<760;
  const labelPack={
    ko:{open:'능력',title:'획득 능력',subtitle:'현재 빌드와 실제 적용 효과',close:'닫기',summary:'빌드 요약',weapons:'장비',passives:'패시브',traits:'보스 특수 패시브',augments:'무기 특수효과',nebula:'성운 보정',stats:'실시간 능력치',none:'아직 획득하지 않음',stack:'중첩',damage:'피해 배율',haste:'공격 주기',speed:'이동 속도',magnet:'자석 범위',crit:'치명타',reduction:'피해 감소',active:'적용 중'},
    en:{open:'ABILITIES',title:'ACQUIRED ABILITIES',subtitle:'Current build and applied effects',close:'CLOSE',summary:'BUILD SUMMARY',weapons:'EQUIPMENT',passives:'PASSIVES',traits:'BOSS TRAITS',augments:'WEAPON AUGMENTS',nebula:'NEBULA CALIBRATIONS',stats:'LIVE STATS',none:'Nothing acquired yet',stack:'STACK',damage:'Damage',haste:'Attack interval',speed:'Move speed',magnet:'Pickup radius',crit:'Critical',reduction:'Damage reduction',active:'ACTIVE'},
    ja:{open:'能力',title:'獲得能力',subtitle:'現在のビルドと適用効果',close:'閉じる',summary:'ビルド概要',weapons:'装備',passives:'パッシブ',traits:'ボス特殊パッシブ',augments:'武器特殊効果',nebula:'星雲補正',stats:'現在能力値',none:'まだ獲得していません',stack:'重複',damage:'ダメージ倍率',haste:'攻撃間隔',speed:'移動速度',magnet:'回収範囲',crit:'クリティカル',reduction:'被ダメージ軽減',active:'適用中'},
    'zh-CN':{open:'能力',title:'已获能力',subtitle:'当前构筑与实际效果',close:'关闭',summary:'构筑概览',weapons:'装备',passives:'被动',traits:'首领特殊被动',augments:'武器特效',nebula:'星云校准',stats:'实时属性',none:'尚未获得',stack:'叠加',damage:'伤害倍率',haste:'攻击间隔',speed:'移动速度',magnet:'拾取范围',crit:'暴击',reduction:'减伤',active:'生效中'},
    es:{open:'HABILIDADES',title:'HABILIDADES OBTENIDAS',subtitle:'Configuración actual y efectos aplicados',close:'CERRAR',summary:'RESUMEN',weapons:'EQUIPO',passives:'PASIVAS',traits:'RASGOS DE JEFE',augments:'EFECTOS DE ARMA',nebula:'AJUSTES NEBULARES',stats:'ESTADÍSTICAS',none:'Aún no obtenido',stack:'ACUM.',damage:'Daño',haste:'Intervalo',speed:'Velocidad',magnet:'Radio de recogida',crit:'Crítico',reduction:'Reducción',active:'ACTIVO'},
    fr:{open:'CAPACITÉS',title:'CAPACITÉS ACQUISES',subtitle:'Build actuel et effets appliqués',close:'FERMER',summary:'RÉSUMÉ',weapons:'ÉQUIPEMENT',passives:'PASSIFS',traits:'TRAITS DE BOSS',augments:'EFFETS D’ARME',nebula:'CALIBRAGES NÉBULAIRES',stats:'STATISTIQUES',none:'Rien obtenu',stack:'CUMUL',damage:'Dégâts',haste:'Intervalle',speed:'Vitesse',magnet:'Portée',crit:'Critique',reduction:'Réduction',active:'ACTIF'}
  };
  const l=k=>(labelPack[locale()]||labelPack.en)[k]||k;

  const traitMeta={
    stellar:{icon:'✹',color:'#ffe49a',ko:['항성 왕관','주기적으로 가까운 적들을 관통하는 별빛 광선.'],en:['Stellar Crown','Periodic stellar rays pierce nearby enemies.']},
    aegis:{icon:'⬢',color:'#83ffd1',ko:['공허의 가호','주기적으로 강력한 보호막 충전.'],en:['Void Aegis','Periodically charges a powerful shield.']},
    singularity:{icon:'◉',color:'#a98cff',ko:['특이점 혈맥','일정 처치마다 소형 특이점 생성.'],en:['Singularity Vein','Creates a small singularity after enough kills.']},
    eclipse:{icon:'◒',color:'#ff76bd',ko:['일식 동력로','상시 피해 증가와 저체력 추가 증폭.'],en:['Eclipse Reactor','Permanent damage gain with a low-health surge.']},
    chrono:{icon:'◎',color:'#8fffe0',ko:['찰나의 꽃','주기적으로 주변 적의 시간을 정지.'],en:['Chrono Bloom','Periodically halts nearby enemies.']},
    harvest:{icon:'✦',color:'#ff9a9a',ko:['별의 수확','처치 시 회복, 정예 처치 시 대량 회복.'],en:['Star Harvest','Heals on kills and greatly on elite kills.']}
  };
  const augmentMeta={
    core:{icon:'✷',color:'#eafcff',ko:['항성 연사','일정 발사마다 방사형 광자탄 난사.'],en:['Stellar Volley','Periodic radial photon volleys.']},
    blade:{icon:'◒',color:'#7ce8ff',ko:['공간 절개','칼날 적중이 주기적인 절단 폭발 생성.'],en:['Space Rend','Blade hits periodically create cutting bursts.']},
    ember:{icon:'✦',color:'#ff7b9e',ko:['연쇄 성화','별빛 폭발이 가까운 적에게 전이.'],en:['Chain Starfire','Starlight explosions jump to a nearby enemy.']},
    bulwark:{icon:'◈',color:'#74f2a7',ko:['반사 장벽','피격 시 반격 광자탄 방출.'],en:['Reflective Barrier','Taking damage releases countering photon bolts.']},
    gravity:{icon:'◉',color:'#9e79ff',ko:['종말 붕괴','중력 우물 소멸 시 붕괴 폭발.'],en:['Terminal Collapse','Gravity wells detonate on expiry.']},
    comet:{icon:'⟐',color:'#b5f5ff',ko:['혜성의 잔상','혜성 창 발사 시 추격 창 추가.'],en:['Comet Afterimage','Comet lances launch a trailing lance.']},
    prism:{icon:'✧',color:'#c2a7ff',ko:['교차 성선','주 광선과 교차하는 보조 광선 추가.'],en:['Crossed Starline','Adds a beam crossing the main ray.']},
    chrono:{icon:'◎',color:'#8fffe0',ko:['시간 파쇄','시간 정지 중 처치된 적의 파쇄 폭발.'],en:['Time Fracture','Time-locked enemies shatter on death.']},
    arc:{icon:'☾',color:'#69ffe0',ko:['귀환 파편','귀환 적중 시 세 갈래 성운 파편.'],en:['Return Shards','Return hits release three nebula shards.']}
  };
  const nebulaMeta={
    power:{icon:'▲',color:'#ff7f9f',ko:['출력 보정','모든 피해 +7%'],en:['Output Calibration','All damage +7%']},
    haste:{icon:'◎',color:'#8fffe0',ko:['시간 보정','공격 주기 -6%'],en:['Time Calibration','Attack interval -6%']},
    magnet:{icon:'⊕',color:'#ffdc75',ko:['중력 보정','자석 범위 +32'],en:['Gravity Calibration','Pickup radius +32']}
  };
  const metaText=m=>m?.[locale()]||m?.en||m?.ko||['',''];

  const button=document.createElement('button');
  button.id='abilityLedgerBtn';button.type='button';button.innerHTML='<span class="ledger-glyph">✦</span><b></b><i>0</i>';
  document.querySelector('#app').appendChild(button);
  const pauseModal=document.querySelector('#pauseScreen .modal');
  const pauseButton=document.createElement('button');pauseButton.id='pauseAbilityBtn';pauseButton.className='secondary-btn';pauseButton.type='button';
  pauseModal?.insertBefore(pauseButton,document.querySelector('#pauseSettingsBtn'));

  const overlay=document.createElement('section');overlay.id='abilityLedgerScreen';overlay.className='overlay hidden';
  overlay.innerHTML=`<div class="ledger-shell"><header class="ledger-head"><div><p id="ledgerKicker"></p><h2 id="ledgerTitle"></h2><span id="ledgerSubtitle"></span></div><button id="ledgerCloseX" type="button">×</button></header><div id="ledgerSummary" class="ledger-summary"></div><div id="ledgerBody" class="ledger-body"></div><button id="ledgerCloseBtn" class="primary-btn" type="button"><span></span></button></div>`;
  document.querySelector('#app').appendChild(overlay);

  const style=document.createElement('style');style.textContent=`
    #abilityLedgerBtn{position:fixed;left:0;top:50%;z-index:31;width:54px;height:116px;transform:translateY(-50%);border:1px solid rgba(135,220,255,.28);border-left:0;border-radius:0 18px 18px 0;background:linear-gradient(180deg,rgba(15,28,63,.94),rgba(5,9,24,.97));color:#eafaff;box-shadow:0 12px 36px rgba(0,0,0,.32),inset 0 0 28px rgba(91,197,255,.08);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}.ledger-glyph{font-size:22px;color:#91ecff;text-shadow:0 0 16px #5cdcff}#abilityLedgerBtn b{writing-mode:vertical-rl;font-size:9px;letter-spacing:.12em}#abilityLedgerBtn i{font-style:normal;font-size:9px;min-width:20px;padding:2px 5px;border-radius:12px;background:#ff6fae;color:#fff}
    #abilityLedgerScreen{z-index:72;background:radial-gradient(circle at 50% 34%,rgba(26,51,100,.58),rgba(2,5,17,.96));backdrop-filter:blur(13px)}.ledger-shell{width:min(1180px,96vw);height:min(840px,92vh);display:flex;flex-direction:column;border:1px solid rgba(142,214,255,.19);border-radius:28px;background:linear-gradient(155deg,rgba(12,23,52,.985),rgba(4,8,21,.99));box-shadow:0 34px 90px rgba(0,0,0,.56);overflow:hidden}.ledger-head{display:flex;align-items:center;justify-content:space-between;padding:24px 28px 18px;border-bottom:1px solid rgba(255,255,255,.07);background:linear-gradient(90deg,rgba(92,189,255,.09),transparent 55%,rgba(255,93,166,.06))}.ledger-head p{margin:0 0 4px;color:#76dfff;font-size:9px;font-weight:900;letter-spacing:.22em}.ledger-head h2{margin:0;font-size:28px}.ledger-head span{color:#91a1c2;font-size:11px}.ledger-head button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(4,8,20,.7);color:#fff;font-size:25px;cursor:pointer}.ledger-summary{display:grid;grid-template-columns:1.2fr repeat(6,1fr);gap:8px;padding:12px 24px;background:rgba(1,5,17,.5)}.ledger-stat{min-height:58px;border-radius:13px;padding:10px 12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}.ledger-stat.hero{background:linear-gradient(135deg,rgba(78,198,255,.13),rgba(255,85,166,.08));clip-path:polygon(0 0,94% 0,100% 50%,94% 100%,0 100%)}.ledger-stat small{display:block;color:#8495b8;font-size:9px;margin-bottom:5px}.ledger-stat b{font-size:15px}.ledger-body{flex:1;overflow:auto;padding:18px 24px 28px;scrollbar-width:thin}.ledger-section{margin-bottom:24px}.ledger-section-title{display:flex;align-items:center;gap:10px;margin-bottom:10px}.ledger-section-title:before{content:"";width:23px;height:2px;background:var(--section-color);box-shadow:0 0 10px var(--section-color)}.ledger-section-title h3{margin:0;font-size:13px;letter-spacing:.09em}.ledger-section-title span{font-size:9px;color:#7889aa}.ledger-grid{display:grid;gap:10px}.ledger-grid.weapon-grid{grid-template-columns:repeat(auto-fill,minmax(205px,1fr))}.ledger-grid.passive-grid{grid-template-columns:repeat(auto-fill,minmax(185px,1fr))}.ledger-grid.trait-grid,.ledger-grid.augment-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}.ledger-grid.nebula-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
    .ledger-card{position:relative;overflow:hidden;color:#eef7ff}.ledger-card .card-icon{display:grid;place-items:center;flex:none}.ledger-card h4{margin:0 0 4px;font-size:13px}.ledger-card p{margin:0;color:#91a0bd;font-size:10px;line-height:1.45}.ledger-card .count{position:absolute;font-size:10px;font-weight:900}.weapon-ledger{min-height:112px;padding:14px 15px 13px 17px;border:1px solid color-mix(in srgb,var(--c) 28%,rgba(255,255,255,.08));background:linear-gradient(145deg,color-mix(in srgb,var(--c) 9%,rgba(12,18,40,.98)),rgba(5,8,20,.98));clip-path:polygon(0 0,92% 0,100% 20%,100% 100%,8% 100%,0 82%)}.weapon-ledger .card-icon{width:33px;height:33px;border:1px solid var(--c);transform:rotate(45deg);margin:2px 0 13px;color:var(--c);box-shadow:0 0 17px color-mix(in srgb,var(--c) 40%,transparent)}.weapon-ledger .card-icon span{transform:rotate(-45deg)}.weapon-ledger .count{right:12px;top:11px;color:var(--c)}.weapon-pips{display:flex;gap:3px;margin-top:9px}.weapon-pips i{width:16px;height:3px;border-radius:4px;background:rgba(255,255,255,.09)}.weapon-pips i.on{background:var(--c);box-shadow:0 0 7px var(--c)}
    .passive-ledger{min-height:76px;padding:12px 13px 12px 58px;border-radius:38px 13px 13px 38px;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 15%,rgba(10,17,38,.98)),rgba(5,8,20,.96));border:1px solid rgba(255,255,255,.08)}.passive-ledger .card-icon{position:absolute;left:7px;top:7px;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--c) 25%,#101a38),#080c20);border:1px solid var(--c);color:var(--c);font-size:20px}.passive-ledger .count{right:11px;top:10px;color:#fff}.passive-ledger .meter{height:3px;margin-top:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden}.passive-ledger .meter i{display:block;height:100%;background:var(--c);box-shadow:0 0 9px var(--c)}
    .trait-ledger{min-height:148px;padding:16px;border:1px solid color-mix(in srgb,var(--c) 45%,transparent);border-radius:22px 22px 8px 8px;background:radial-gradient(circle at 50% -15%,color-mix(in srgb,var(--c) 24%,transparent),transparent 55%),linear-gradient(180deg,rgba(22,24,53,.98),rgba(5,7,18,.99));text-align:center}.trait-ledger:after{content:"";position:absolute;left:18%;right:18%;bottom:0;height:2px;background:var(--c);box-shadow:0 0 18px var(--c)}.trait-ledger .card-icon{width:56px;height:56px;margin:0 auto 12px;font-size:30px;color:var(--c);text-shadow:0 0 20px var(--c);border-radius:50%;border:1px dashed var(--c)}.trait-ledger .count{right:12px;top:10px;color:var(--c)}
    .augment-ledger{min-height:126px;padding:15px 16px 14px 72px;border-radius:8px 24px 8px 24px;border:1px solid color-mix(in srgb,var(--c) 34%,transparent);background:linear-gradient(125deg,color-mix(in srgb,var(--c) 15%,rgba(11,17,38,.98)) 0 42%,rgba(5,8,20,.98) 42%)}.augment-ledger .card-icon{position:absolute;left:15px;top:17px;width:42px;height:72px;color:var(--c);font-size:28px;border-left:2px solid var(--c);border-right:1px solid color-mix(in srgb,var(--c) 45%,transparent);transform:skewY(-9deg)}.augment-ledger .count{right:12px;top:10px;color:var(--c)}.augment-ledger .weapon-link{display:block;margin-top:9px;color:var(--c);font-size:9px;font-weight:900;letter-spacing:.08em}
    .nebula-ledger{min-height:110px;padding:14px 15px;border:1px solid color-mix(in srgb,var(--c) 36%,transparent);background:conic-gradient(from 210deg at 14% 85%,color-mix(in srgb,var(--c) 22%,transparent),rgba(7,11,27,.98) 33%);clip-path:polygon(9% 0,100% 0,100% 78%,89% 100%,0 100%,0 18%)}.nebula-ledger .card-icon{width:36px;height:36px;color:var(--c);font-size:24px;margin-bottom:12px}.nebula-ledger .count{right:12px;top:10px;color:var(--c)}.ledger-empty{padding:15px;border:1px dashed rgba(255,255,255,.1);border-radius:14px;color:#71809d;font-size:11px}#ledgerCloseBtn{align-self:center;width:min(320px,80%);margin:0 0 18px}
    @media(max-width:760px){#abilityLedgerBtn{top:auto;bottom:168px;width:44px;height:94px;border-radius:0 14px 14px 0}.ledger-shell{height:94vh;border-radius:20px}.ledger-head{padding:17px 18px 13px}.ledger-head h2{font-size:22px}.ledger-summary{grid-template-columns:repeat(3,1fr);padding:9px 12px}.ledger-stat.hero{grid-column:span 3}.ledger-body{padding:14px 12px 22px}.ledger-grid.weapon-grid,.ledger-grid.passive-grid,.ledger-grid.trait-grid,.ledger-grid.augment-grid,.ledger-grid.nebula-grid{grid-template-columns:1fr 1fr}.trait-ledger,.augment-ledger{min-height:130px}}
    @media(max-width:480px){.ledger-grid.weapon-grid,.ledger-grid.passive-grid,.ledger-grid.trait-grid,.ledger-grid.augment-grid,.ledger-grid.nebula-grid{grid-template-columns:1fr}.ledger-summary{grid-template-columns:1fr 1fr}.ledger-stat.hero{grid-column:span 2}}
  `;document.head.appendChild(style);

  function acquiredCount(){
    return Object.values(state.weaponStacks||{}).filter(v=>v>0).length+Object.values(state.passives||{}).filter(v=>v>0).length+Object.values(state.bossTraits||{}).filter(Boolean).length+Object.values(state.weaponAugments||{}).filter(Boolean).length+Object.values(state.nebulaBoosts||{}).filter(v=>v>0).length;
  }
  function updateButton(){button.querySelector('b').textContent=l('open');button.querySelector('i').textContent=acquiredCount();pauseButton.textContent=l('title');}
  function section(title,color,cls,cards){return `<section class="ledger-section" style="--section-color:${color}"><div class="ledger-section-title"><h3>${title}</h3><span>${cards.length}</span></div>${cards.length?`<div class="ledger-grid ${cls}">${cards.join('')}</div>`:`<div class="ledger-empty">${l('none')}</div>`}</section>`;}
  function weaponCards(){return Object.entries(state.weaponStacks||{}).filter(([,v])=>v>0).map(([key,v])=>{const w=WEAPONS[key],t=weaponText(key),effect=stackEffectText(key,v),c=w?.color||'#8fe9ff';return `<article class="ledger-card weapon-ledger" style="--c:${c}"><div class="card-icon"><span>${w?.icon||'◇'}</span></div><span class="count">${l('stack')} ${v}</span><h4>${t.name}</h4><p>${effect.name} · ${effect.desc}</p><div class="weapon-pips">${Array.from({length:6},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('')}</div></article>`;});}
  function passiveCards(){return Object.entries(state.passives||{}).filter(([,v])=>v>0).map(([key,v])=>{const p=PASSIVES[key],t=passiveText(key),max=p?.max||v,c=p?.color||'#9deeff';return `<article class="ledger-card passive-ledger" style="--c:${c}"><div class="card-icon">${p?.icon||'•'}</div><span class="count">×${v}</span><h4>${t.name}</h4><p>${t.desc}</p><div class="meter"><i style="width:${Math.min(100,v/max*100)}%"></i></div></article>`;});}
  function traitCards(){return Object.entries(state.bossTraits||{}).filter(([,v])=>v).map(([key])=>{const m=traitMeta[key]||{icon:'✦',color:'#ffd98f',ko:[key,''],en:[key,'']},t=metaText(m);return `<article class="ledger-card trait-ledger" style="--c:${m.color}"><div class="card-icon">${m.icon}</div><span class="count">${l('active')}</span><h4>${t[0]}</h4><p>${t[1]}</p></article>`;});}
  function augmentCards(){return Object.entries(state.weaponAugments||{}).filter(([,v])=>v).map(([key])=>{const m=augmentMeta[key]||{icon:'✦',color:'#aeeeff',ko:[key,''],en:[key,'']},t=metaText(m),wt=WEAPONS[key]?weaponText(key).name:key;return `<article class="ledger-card augment-ledger" style="--c:${m.color}"><div class="card-icon">${m.icon}</div><span class="count">${l('active')}</span><h4>${t[0]}</h4><p>${t[1]}</p><span class="weapon-link">${wt}</span></article>`;});}
  function nebulaCards(){return Object.entries(state.nebulaBoosts||{}).filter(([,v])=>v>0).map(([key,v])=>{const m=nebulaMeta[key],t=metaText(m);return `<article class="ledger-card nebula-ledger" style="--c:${m.color}"><div class="card-icon">${m.icon}</div><span class="count">×${v}</span><h4>${t[0]}</h4><p>${t[1]}</p></article>`;});}
  function pct(v){return `${Math.round(v*100)}%`;}
  function renderLedger(){
    updateButton();document.querySelector('#ledgerKicker').textContent=l('summary');document.querySelector('#ledgerTitle').textContent=l('title');document.querySelector('#ledgerSubtitle').textContent=l('subtitle');document.querySelector('#ledgerCloseBtn span').textContent=l('close');
    const dm=damageMult(),hm=hasteMult(),ms=player.speed*(1+stat('speed')*.07),mr=magnetRange(),cc=.05+stat('crit')*.05,dr=damageReduction();
    document.querySelector('#ledgerSummary').innerHTML=`<div class="ledger-stat hero"><small>${l('summary')}</small><b>LV.${state.level} · ${state.kills} KILLS</b></div><div class="ledger-stat"><small>${l('damage')}</small><b>×${dm.toFixed(2)}</b></div><div class="ledger-stat"><small>${l('haste')}</small><b>${pct(hm)}</b></div><div class="ledger-stat"><small>${l('speed')}</small><b>${Math.round(ms)}</b></div><div class="ledger-stat"><small>${l('magnet')}</small><b>${Math.round(mr)}</b></div><div class="ledger-stat"><small>${l('crit')}</small><b>${pct(cc)}</b></div><div class="ledger-stat"><small>${l('reduction')}</small><b>${pct(dr)}</b></div>`;
    document.querySelector('#ledgerBody').innerHTML=section(l('weapons'),'#79e6ff','weapon-grid',weaponCards())+section(l('passives'),'#ffcb70','passive-grid',passiveCards())+section(l('traits'),'#e7b0ff','trait-grid',traitCards())+section(l('augments'),'#ff75ad','augment-grid',augmentCards())+section(l('nebula'),'#77f0d6','nebula-grid',nebulaCards());
  }
  let returnMode='playing';
  function openLedger(){if(!['playing','paused'].includes(state.mode))return;returnMode=state.mode;if(returnMode==='paused')ui.pauseScreen.classList.add('hidden');state.mode='abilityView';ui.touch.classList.add('hidden');renderLedger();overlay.classList.remove('hidden');}
  function closeLedger(){if(state.mode!=='abilityView')return;overlay.classList.add('hidden');state.mode=returnMode;if(returnMode==='paused')ui.pauseScreen.classList.remove('hidden');else if(compact())ui.touch.classList.remove('hidden');updateHUD();}
  button.onclick=openLedger;pauseButton.onclick=openLedger;document.querySelector('#ledgerCloseX').onclick=closeLedger;document.querySelector('#ledgerCloseBtn').onclick=closeLedger;
  window.addEventListener('keydown',e=>{if((e.code==='Tab'||e.code==='KeyI')&&!e.repeat){e.preventDefault();if(state.mode==='abilityView')closeLedger();else openLedger();}});

  const baseRenderLoadout=renderLoadout;renderLoadout=function renderLoadoutAndLedgerCount(){baseRenderLoadout();updateButton();};
  const baseApplyLanguage=applyLanguage;applyLanguage=function applyLanguageAndLedger(){baseApplyLanguage();updateButton();if(state.mode==='abilityView')renderLedger();};
  const baseTogglePause=togglePause;togglePause=function ledgerSafePause(force){if(state.mode==='abilityView')return;return baseTogglePause(force);};
  const baseMenu=showMainMenu;showMainMenu=function ledgerCloseOnMenu(){overlay.classList.add('hidden');button.classList.add('hidden');return baseMenu();};
  const baseReset=resetGame;resetGame=function ledgerReset(){baseReset();button.classList.remove('hidden');updateButton();};
  const baseEnd=endGame;endGame=function ledgerCloseOnEnd(){overlay.classList.add('hidden');button.classList.add('hidden');return baseEnd();};

  const baseUpdateEnemies=updateEnemies;
  updateEnemies=function updateEnemiesWithVerifiedTimeLock(dt){
    const locked=[];
    for(const e of state.entities.enemies){
      if(!e.dead&&(e.timeLock||0)>0){e.timeLock=Math.max(0,e.timeLock-dt);locked.push([e,e.speed]);e.speed*=e.type==='boss'?.26:e.type==='mini'?.12:.025;}
    }
    baseUpdateEnemies(dt);
    for(const [e,speed] of locked)e.speed=speed;
  };

  const baseSpawnEnemy=spawnEnemy;
  spawnEnemy=function spawnBalancedElite(kind='normal'){
    const e=baseSpawnEnemy(kind);if(!e||e._earlyBossBalanced)return e;
    if(e.type==='boss'||e.type==='mini'){
      const t=state.time||0,isBoss=e.type==='boss';
      const hpStart=isBoss?.58:.76,hpEnd=isBoss?.94:.98,hpT=clamp((t-110)/420,0,1),hpFactor=lerp(hpStart,hpEnd,hpT);
      const damageStart=isBoss?.68:.82,damageT=clamp((t-110)/360,0,1),damageFactor=lerp(damageStart,1,damageT);
      e.hp*=hpFactor;e.maxHp=e.hp;e.damage*=damageFactor;e.speed*=lerp(isBoss?.88:.94,1,clamp((t-110)/300,0,1));
      e.skillCd+=(isBoss?1.25:.65)*(1-hpT);e.burstCd+=(isBoss?1.45:.75)*(1-hpT);e.pulseCd+=(isBoss?1.2:0)*(1-hpT);e._earlyBossBalanced=true;
    }
    return e;
  };
  if(typeof bossSkill==='function'){
    const baseBossSkill=bossSkill;
    bossSkill=function softenedEarlyBossSkills(enemy,dt){
      const startP=state.entities.enemyProjectiles.length,startT=state.entities.telegraphs.length;
      const early=clamp((state.time-110)/360,0,1),rate=enemy.type==='boss'?lerp(.72,1,early):lerp(.86,1,early);
      baseBossSkill(enemy,dt*rate);
      const damageFactor=enemy.type==='boss'?lerp(.72,1,early):lerp(.86,1,early);
      for(let i=startP;i<state.entities.enemyProjectiles.length;i++)state.entities.enemyProjectiles[i].damage*=damageFactor;
      for(let i=startT;i<state.entities.telegraphs.length;i++)if(Number.isFinite(state.entities.telegraphs[i].damage))state.entities.telegraphs[i].damage*=damageFactor;
    };
  }

  function drawTraitSignatures(x,y,t){
    const traits=state.bossTraits||{};ctx.save();ctx.translate(x,y);
    if(traits.eclipse){ctx.save();ctx.rotate(-t*.00016);ctx.globalAlpha=.35;ctx.fillStyle='#ff76bd';ctx.shadowBlur=22;ctx.shadowColor='#ff4f9a';ctx.beginPath();ctx.arc(-8,0,34,-1.35,1.35);ctx.arc(4,0,27,1.35,-1.35,true);ctx.fill();ctx.restore();}
    if(traits.chrono){ctx.save();ctx.rotate(t*.00021);ctx.strokeStyle='rgba(143,255,224,.62)';ctx.lineWidth=1.4;for(let i=0;i<12;i++){const a=i/12*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*45,Math.sin(a)*45);ctx.lineTo(Math.cos(a)*(i%3===0?54:50),Math.sin(a)*(i%3===0?54:50));ctx.stroke();}ctx.restore();}
    if(traits.aegis){ctx.save();ctx.rotate(-t*.00011);ctx.strokeStyle='rgba(131,255,209,.55)';ctx.setLineDash([8,6]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,60,0,TAU);ctx.stroke();ctx.restore();}
    if(traits.stellar){ctx.save();ctx.translate(0,-56);ctx.rotate(Math.sin(t*.001)*.08);ctx.fillStyle='#ffe49a';ctx.shadowBlur=17;ctx.shadowColor='#ffe49a';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*10-5,5);ctx.lineTo(i*10,-8-Math.abs(i)*3);ctx.lineTo(i*10+5,5);ctx.closePath();ctx.fill();}ctx.restore();}
    if(traits.singularity){const a=t*.00037;ctx.save();ctx.translate(Math.cos(a)*67,Math.sin(a)*29);ctx.fillStyle='#05020d';ctx.strokeStyle='#a98cff';ctx.lineWidth=2;ctx.shadowBlur=18;ctx.shadowColor='#a98cff';ctx.beginPath();ctx.arc(0,0,7,0,TAU);ctx.fill();ctx.stroke();ctx.restore();}
    if(traits.harvest){for(let i=0;i<4;i++){const a=-t*.00029+i*TAU/4,rr=51+(i%2)*7;ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr*.58);ctx.rotate(a);ctx.fillStyle=i%2?'#ff9a9a':'#ff6f96';ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(0,0,4,1.7,.4,0,TAU);ctx.fill();ctx.restore();}}
    ctx.restore();
  }
  function drawAugmentSignatures(x,y,t){
    const aug=state.weaponAugments||{},keys=Object.keys(aug).filter(k=>aug[k]);if(!keys.length)return;
    const glyph={core:'✷',blade:'╱',ember:'✦',bulwark:'◇',gravity:'●',comet:'⟐',prism:'✧',chrono:'⌛',arc:'☾'};
    const color={core:'#eafcff',blade:'#7ce8ff',ember:'#ff7b9e',bulwark:'#74f2a7',gravity:'#9e79ff',comet:'#b5f5ff',prism:'#c2a7ff',chrono:'#8fffe0',arc:'#69ffe0'};
    ctx.save();ctx.translate(x,y);for(let i=0;i<keys.length;i++){const key=keys[i],a=t*(.00012+(i%3)*.000035)+i*TAU/keys.length,rr=72+(i%2)*11;ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr*.62);ctx.rotate(-a*(i%2?1:-1));ctx.font=`700 ${key==='chrono'?11:14}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color[key]||'#fff';ctx.shadowBlur=12;ctx.shadowColor=ctx.fillStyle;ctx.fillText(glyph[key]||'✦',0,0);ctx.restore();}ctx.restore();
  }
  const baseDrawPlayer=drawPlayer;drawPlayer=function drawPlayerWithAbilitySignatures(){baseDrawPlayer();const t=performance.now();drawTraitSignatures(vw/2,vh/2,t);drawAugmentSignatures(vw/2,vh/2,t);};

  updateButton();button.classList.toggle('hidden',state.mode==='menu'||state.mode==='gameover');
})();