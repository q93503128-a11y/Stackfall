(function(){
  const locale=()=>GAME_SETTINGS?.language||'ko';

  // Final audited stack descriptions. These match the live formulas below.
  Object.assign(STACK_EFFECTS,{
    core:[['초기 점화','기본 광자탄 총 1발 자동 발사.'],['쌍발 코어','기본 광자탄 총 2발 동시 발사.'],['코어 관통','각 광자탄이 적 1명을 추가 관통.'],['펄스 폭발','명중 지점에 소형 범위 폭발 발생.'],['삼중 코어','기본 광자탄 총 3발 동시 발사.'],['항성 펄스','6번째 발동마다 대형 고속 관통탄 발사.']],
    ember:[['첫 별','폭발성 별빛 탄환 총 1발 발사.'],['쌍성 사격','폭발성 별빛 탄환 총 2발 동시 발사.'],['성핵 관통','각 탄환이 적 1명을 추가 관통.'],['성운 분열','명중할 때 별가루 탄환 3개로 분열.'],['삼중 성렬','폭발성 별빛 탄환 총 3발 동시 발사.'],['초신성 탄두','7번째 발동마다 대형 고속 관통탄 발사.']],
    comet:[['결정 장창','관통 혜성 창 총 1개 발사.'],['이중 궤적','관통 혜성 창 총 2개 동시 발사.'],['심층 관통','창 크기와 관통 횟수 증가.'],['혜성 파편','적중할 때 파편 4개 방출.'],['잔광 궤도','비행 경로에 짧은 지속 피해 생성.'],['대충돌','창이 사라질 때 대형 범위 폭발.']],
    arc:[['성운 비행','곡선으로 적을 지나 선회한 뒤 귀환하는 칼날 총 1개.'],['쌍곡선','서로 반대 방향으로 휘는 칼날 총 2개.'],['심층 곡률','곡률과 칼날 판정이 크게 증가해 근거리 적도 넓게 우회.'],['귀환 가속','귀환 속도 증가, 귀환 타격 피해 38% 증가.'],['잔광 띠','왕복 경로에 짧은 지속 피해 생성.'],['삼중 나선','서로 다른 곡선의 칼날 총 3개.']],
    blade:[['월광 기동','지속형 광자 칼날 총 1개 공전.'],['쌍월 궤도','지속형 광자 칼날 총 2개 공전.'],['가속 궤도','공전 속도와 공격 반경 증가.'],['성흔 파동','칼날 적중 지점에서 관통 절단파 발사.'],['삼월식','지속형 광자 칼날 총 3개 공전.'],['천체 분쇄기','칼날 처치 연쇄 6회마다 별빛 폭발.']],
    prism:[['단일 프리즘','공전 프리즘 총 1개와 관통 광선 1줄.'],['쌍둥이 프리즘','공전 프리즘 총 2개.'],['광폭 굴절','광선 폭과 경로 판정 증가.'],['성좌 연결','프리즘 사이 연결선에 접촉 피해.'],['다중 초점','각 프리즘의 관통 광선 총 2줄.'],['천구 의식','공전 프리즘 총 3개.']],
    bulwark:[['성광 피막','최대 체력 +8, 기본 피해 감소 획득.'],['겹빛 장벽','최대 체력과 피해 감소 추가 증가.'],['재충전 장벽','9초마다 보호막 6 충전.'],['보복 장막','피격 시 주변 충격파 발생.'],['요새 장막','보호막 최대 30, 6.2초마다 10 충전.'],['천체 성벽','8초마다 추가 보호막 24 충전.']],
    gravity:[['특이점 씨앗','중력 우물 총 1개 주기적 생성.'],['조석 고정','흡입 반경 135 → 185, 흡입력 증가.'],['장수 특이점','지속시간 2.7초 → 3.55초.'],['붕괴핵','중심부에 0.3초 간격 지속 피해.'],['압축 붕괴','중심 피해와 흡입력 추가 증가.'],['쌍둥이 특이점','중력 우물 총 2개 동시 생성.']],
    chrono:[['느린 시간','주변 적 이동속도 감소.'],['느린 궤도','감속 범위와 감속률 증가.'],['시간 가속','모든 장비 발동 주기 8% 추가 단축.'],['시간 파동','주기적인 범위 피해 파동.'],['찰나 정지','파동에 맞은 일반 적을 잠시 강하게 감속.'],['영원의 원환','장비 발동 주기 단축이 18%로 강화.']]
  });

  // Chain Thruster now grows through more stacks and one stack can no longer reach extreme cooldown reduction.
  if(PASSIVES.chainDrive){PASSIVES.chainDrive.max=12;PASSIVES.chainDrive.desc='연쇄 10회마다 소폭 가속. 최대 12중첩, 연쇄 200회까지만 계산.';}
  if(PASSIVE_TEXT.chainDrive){
    PASSIVE_TEXT.chainDrive.ko=['연쇄 추진기','연쇄 10회마다 장비 주기 소폭 단축. 연쇄 200회까지만 계산하며 최대 12중첩.'];
    PASSIVE_TEXT.chainDrive.en=['Chain Thruster','Slight cooldown reduction every 10 chain. Counts up to 200 chain and supports 12 stacks.'];
  }
  if(PASSIVE_TEXT.echo){
    PASSIVE_TEXT.echo.ko=['에코 비콘','설치·발사 공격 복제 확률 1중첩 18.6% → 8중첩 71.8%. 8중첩은 5회마다 확정 복제.'];
    PASSIVE_TEXT.echo.en=['Echo Beacon','Repeat chance rises from 18.6% at stack 1 to 71.8% at stack 8. Stack 8 guarantees every fifth activation.'];
    PASSIVES.echo.desc=PASSIVE_TEXT.echo.ko[1];
  }
  if(PASSIVE_TEXT.magnet){PASSIVE_TEXT.magnet.ko=['자석 코어','중첩마다 결정 흡수 반경 +34. 패시브 최대 10중첩, 최종 반경 자체에는 별도 상한 없음.'];PASSIVES.magnet.desc=PASSIVE_TEXT.magnet.ko[1];}

  function chainDriveBonus(stacks=stat('chainDrive'),combo=state.combo||0){
    const tiers=Math.min(20,Math.floor(Math.max(0,combo)/10));
    return Math.min(.42,tiers*(.002+Math.max(0,stacks)*.0015));
  }
  window.chainDriveBonus=chainDriveBonus;
  function hasteWithoutChainDrive(){
    const chrono=weaponCount('chrono'),chronoBonus=chrono>=6?.18:chrono>=3?.08:0,nebula=(state.nebulaBoosts?.haste||0)*.08,apex=(state.apexBoons?.chronophage||0)*.025;
    const local=Math.max(.15,1-stat('haste')*.10-chronoBonus-nebula-apex);
    return Math.max(.12,local*(1-(state.voidImprintStacks||0)*.06));
  }
  hasteMult=function auditedHasteMultiplier(){return Math.max(.14,hasteWithoutChainDrive()*(1-chainDriveBonus()));};

  // Stack 3 is a real curvature upgrade; stack 4 strengthens the return hit rather than merely enabling return.
  sf2FireArc=function auditedArcFire(target,stacks,echoed=false){
    target=target&&!target.dead?target:nearestEnemy(player.x,player.y);if(!target)return;
    const shots=stacks>=6?3:stacks>=2?2:1,start={x:player.x,y:player.y},baseAngle=Math.atan2(target.y-start.y,target.x-start.x);
    player.arcSide=(player.arcSide||-1)*-1;
    for(let i=0;i<shots;i++){
      const spreadIndex=i-(shots-1)/2,side=shots===1?player.arcSide:(spreadIndex===0?player.arcSide:Math.sign(spreadIndex)),targetOffset=spreadIndex*(34+stacks*4),perp={x:-Math.sin(baseAngle),y:Math.cos(baseAngle)};
      const targetPoint={x:target.x+perp.x*targetOffset,y:target.y+perp.y*targetOffset},dirAngle=Math.atan2(targetPoint.y-start.y,targetPoint.x-start.x),dir={x:Math.cos(dirAngle),y:Math.sin(dirAngle)},normal={x:-dir.y,y:dir.x};
      const distance=Math.hypot(targetPoint.x-start.x,targetPoint.y-start.y),curveAmp=clamp(165+distance*.22+(stacks>=3?78:0),165,365)*side,passDistance=clamp(105+distance*.24,120,230);
      const passPoint={x:targetPoint.x+dir.x*passDistance,y:targetPoint.y+dir.y*passDistance},turnPoint={x:passPoint.x-dir.x*(34+stacks*3)+normal.x*curveAmp*.62,y:passPoint.y-dir.y*(34+stacks*3)+normal.y*curveAmp*.62};
      const c1={x:start.x+dir.x*Math.max(70,distance*.24)+normal.x*curveAmp,y:start.y+dir.y*Math.max(70,distance*.24)+normal.y*curveAmp},c2={x:targetPoint.x-dir.x*Math.max(45,distance*.18)+normal.x*curveAmp*.48,y:targetPoint.y-dir.y*Math.max(45,distance*.18)+normal.y*curveAmp*.48};
      state.entities.curves.push({stage:'approach',stageTime:0,stageDuration:clamp(.58+distance/1150,.64,1.08),targetId:target.id,start:{...start},targetPoint,passPoint,turnPoint,c1,c2,x:start.x,y:start.y,lastX:start.x,lastY:start.y,hitIds:new Set(),r:10+stacks*1.15+(stacks>=3?2.5:0),damage:(18+stacks*5.1)*(echoed?.68:1),returnDamageMult:stacks>=4?1.38:1,returnSpeedBonus:stacks>=4?150:0,color:echoed?COLORS.pink:'#69ffe0',trailDamage:stacks>=5,trailCd:0,history:[],stacks,dead:false,returnLife:0});
    }
    if(state.entities.curves.length>36)state.entities.curves.splice(0,state.entities.curves.length-36);
  };

  const style=document.createElement('style');style.textContent=`
    .passive-list{max-height:min(278px,36vh)!important;overflow-y:auto!important;overflow-x:hidden!important;pointer-events:auto!important;overscroll-behavior:contain;padding-right:5px!important;scrollbar-width:thin;scrollbar-color:rgba(124,232,255,.55) rgba(255,255,255,.04)}
    .passive-list::-webkit-scrollbar{width:6px}.passive-list::-webkit-scrollbar-track{background:rgba(255,255,255,.035);border-radius:9px}.passive-list::-webkit-scrollbar-thumb{background:linear-gradient(#7ce8ff,#9e79ff);border-radius:9px}
    .ledger-card[data-weapon-key],.ledger-card[data-passive-key]{cursor:pointer;transition:transform .15s,border-color .15s,filter .15s}.ledger-card[data-weapon-key]:hover,.ledger-card[data-passive-key]:hover{transform:translateY(-3px);filter:brightness(1.12);border-color:var(--c)}
    .ledger-card[data-weapon-key]:after,.ledger-card[data-passive-key]:after{content:'상세';position:absolute;right:11px;bottom:9px;padding:2px 6px;border-radius:7px;background:rgba(255,255,255,.07);color:#d8e9ff;font-size:7px;font-weight:800;letter-spacing:.08em}
    .ledger-actions{display:flex;align-items:center;gap:8px}.ledger-limit-btn{height:38px;padding:0 12px;border:1px solid rgba(124,232,255,.25);border-radius:12px;background:rgba(20,40,76,.72);color:#bfefff;font-size:9px;font-weight:800;cursor:pointer}
    .ledger-detail-layer{position:absolute;inset:0;z-index:8;display:grid;place-items:center;padding:22px;background:rgba(0,2,10,.76);backdrop-filter:blur(9px)}.ledger-detail-layer.hidden{display:none}
    .ledger-detail-card{width:min(760px,94vw);max-height:min(790px,88vh);overflow:auto;border:1px solid color-mix(in srgb,var(--detail-color) 42%,rgba(255,255,255,.1));border-radius:24px;background:linear-gradient(155deg,color-mix(in srgb,var(--detail-color) 12%,#10172e),#040713 72%);box-shadow:0 30px 90px rgba(0,0,0,.65);padding:22px;color:#f7fbff;scrollbar-width:thin}
    .ledger-detail-head{display:grid;grid-template-columns:58px 1fr 38px;gap:14px;align-items:center;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.09)}.ledger-detail-icon{width:58px;height:58px;border-radius:17px;display:grid;place-items:center;background:color-mix(in srgb,var(--detail-color) 18%,transparent);color:var(--detail-color);font-size:29px;text-shadow:0 0 20px var(--detail-color)}.ledger-detail-head h3{margin:0;font-size:22px}.ledger-detail-head p{margin:4px 0 0;color:#93a5c7;font-size:10px}.ledger-detail-close{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:#070b18;color:#fff;font-size:22px;cursor:pointer}
    .ledger-live-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:15px 0}.ledger-live-stat{padding:10px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07)}.ledger-live-stat small{display:block;color:#8294b8;font-size:8px}.ledger-live-stat b{display:block;margin-top:4px;font-size:13px}
    .stack-audit-list{display:grid;gap:7px}.stack-audit-row{display:grid;grid-template-columns:38px 1fr;gap:10px;padding:10px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);opacity:.48}.stack-audit-row.unlocked{opacity:1;border-color:color-mix(in srgb,var(--detail-color) 27%,rgba(255,255,255,.07))}.stack-audit-row.current{background:color-mix(in srgb,var(--detail-color) 15%,rgba(255,255,255,.02));box-shadow:inset 3px 0 0 var(--detail-color)}.stack-audit-row>strong{color:var(--detail-color);font-size:13px}.stack-audit-row b{display:block;font-size:11px}.stack-audit-row span{display:block;margin-top:3px;color:#92a1bf;font-size:9px;line-height:1.45}.ledger-detail-note{margin-top:14px;padding:11px 13px;border-radius:12px;background:rgba(124,232,255,.055);color:#a9badd;font-size:9px;line-height:1.6}
    @media(max-width:760px){.ledger-detail-card{padding:15px}.ledger-detail-head{grid-template-columns:48px 1fr 34px}.ledger-detail-icon{width:48px;height:48px}.ledger-limit-btn{padding:0 8px}.passive-list{display:none!important}}
  `;document.head.appendChild(style);

  const ledgerScreen=document.querySelector('#abilityLedgerScreen'),ledgerBody=document.querySelector('#ledgerBody'),ledgerHead=document.querySelector('.ledger-head');
  if(!ledgerScreen||!ledgerBody||!ledgerHead)return;
  const closeX=document.querySelector('#ledgerCloseX'),actions=document.createElement('div');actions.className='ledger-actions';
  const limitsBtn=document.createElement('button');limitsBtn.type='button';limitsBtn.className='ledger-limit-btn';limitsBtn.textContent='상한 정보';
  if(closeX){ledgerHead.insertBefore(actions,closeX);actions.append(limitsBtn);actions.append(closeX);}
  const detail=document.createElement('div');detail.className='ledger-detail-layer hidden';detail.innerHTML='<article class="ledger-detail-card" style="--detail-color:#7ce8ff"><header class="ledger-detail-head"><div class="ledger-detail-icon">✦</div><div><h3></h3><p></p></div><button class="ledger-detail-close" type="button">×</button></header><div class="ledger-detail-content"></div></article>';ledgerScreen.appendChild(detail);
  const detailCard=detail.querySelector('.ledger-detail-card'),detailIcon=detail.querySelector('.ledger-detail-icon'),detailTitle=detail.querySelector('h3'),detailSub=detail.querySelector('p'),detailContent=detail.querySelector('.ledger-detail-content');
  function closeDetail(){detail.classList.add('hidden');}
  detail.querySelector('.ledger-detail-close').onclick=closeDetail;detail.addEventListener('pointerdown',e=>{if(e.target===detail)closeDetail();});

  const fmt=v=>Number.isFinite(v)?(Math.abs(v)>=100?Math.round(v):Number(v).toFixed(2).replace(/\.00$/,'')):'—';
  function weaponLiveStats(key,n){
    const haste=hasteMult(),stats=[];
    if(key==='core')stats.push(['발사 주기',`${fmt(Math.max(.42,1.08-(n-1)*.085)*haste)}초`],['동시 발사',n>=5?3:n>=2?2:1],['기본 관통',n>=3?'+1':'0']);
    else if(key==='ember')stats.push(['발사 주기',`${fmt((.74-Math.min(.32,n*.04))*haste)}초`],['동시 발사',n>=5?3:n>=2?2:1],['기본 관통',n>=3?'+1':'0']);
    else if(key==='comet')stats.push(['발사 주기',`${fmt((1.72-Math.min(.5,n*.065))*haste)}초`],['동시 발사',n>=2?2:1],['관통',2+Math.floor(n/2)+(n>=3?2:0)]);
    else if(key==='blade')stats.push(['칼날 수',n>=5?3:n>=2?2:1],['공전 반경',n>=6?116:n>=3?91:80],['판정 주기',`${fmt(.105*haste)}초`]);
    else if(key==='prism')stats.push(['프리즘 수',n>=6?3:n>=2?2:1],['프리즘당 광선',n>=5?2:1],['발사 주기',`${fmt((1.34-Math.min(.52,n*.062))*haste)}초`]);
    else if(key==='gravity')stats.push(['생성 주기',`${fmt((5.8-Math.min(2.45,n*.34))*haste)}초`],['우물 수',n>=6?2:1],['흡입 반경',n>=2?185:135],['지속시간',`${n>=4?4.10:n>=3?3.55:2.70}초`]);
    else if(key==='bulwark')stats.push(['장벽 피해 감소',`${Math.round((n*.034+(n>=5?.05:0))*100)}%`],['재충전',n>=5?'10 / 6.2초':n>=3?'6 / 9초':'없음'],['천체 성벽',n>=6?'24 / 8초':'잠김']);
    else if(key==='chrono'){const slow=Math.max(.28,1-(.10+n*.07));stats.push(['감속 반경',145+n*18],['이동속도 배율',`×${fmt(slow)}`],['장비 가속',n>=6?'18%':n>=3?'8%':'0%'],['시간 파동',n>=4?`${fmt((4.8-Math.min(1.55,n*.22))*haste)}초`:'잠김']);}
    else if(key==='arc')stats.push(['발사 주기',`${fmt((1.92-Math.min(.58,n*.075))*haste)}초`],['칼날 수',n>=6?3:n>=2?2:1],['곡률 강화',n>=3?'활성':'기본'],['귀환 피해',n>=4?'×1.38':'×1.00']);
    return stats;
  }
  function openWeaponDetail(key){
    const w=WEAPONS[key];if(!w)return;const text=weaponText(key),n=weaponCount(key),rows=STACK_EFFECTS[key]||[];detailCard.style.setProperty('--detail-color',w.color);detailIcon.textContent=w.icon;detailTitle.textContent=text.name;detailSub.textContent=`현재 ${n}중첩 · 장비 최대 6중첩`;
    const live=weaponLiveStats(key,n).map(([name,value])=>`<div class="ledger-live-stat"><small>${name}</small><b>${value}</b></div>`).join('');
    const stackRows=rows.map((row,i)=>`<div class="stack-audit-row ${n>=i+1?'unlocked':''} ${n===i+1?'current':''}"><strong>${i+1}</strong><div><b>${row[0]}</b><span>${row[1]}</span></div></div>`).join('');
    detailContent.innerHTML=`<div class="ledger-live-stats">${live}</div><div class="stack-audit-list">${stackRows}</div><div class="ledger-detail-note">중첩 설명과 실제 발사 수·주기·판정 공식을 대조한 값이다. 주기 표시는 현재 가속 회로, 시간 고리, 성운 보정, 연쇄 추진기를 모두 반영한다.</div>`;detail.classList.remove('hidden');
  }
  function openPassiveDetail(key){
    const p=PASSIVES[key],text=passiveText(key),n=stat(key);if(!p)return;detailCard.style.setProperty('--detail-color',p.color);detailIcon.textContent=p.icon;detailTitle.textContent=text.name;detailSub.textContent=`현재 ${n} / 최대 ${p.max}중첩`;
    let html='';
    if(key==='echo'){
      const rows=Array.from({length:p.max},(_,i)=>{const s=i+1,chance=Math.min(.72,.11+s*.076),blade=Math.min(.42,.07+s*.045);return`<div class="stack-audit-row ${n>=s?'unlocked':''} ${n===s?'current':''}"><strong>${s}</strong><div><b>발사·설치 복제 ${Math.round(chance*1000)/10}%</b><span>지속형 칼날 잔상 ${Math.round(blade*1000)/10}%${s>=8?' · 5번째 발동마다 확정 복제':''}</span></div></div>`;}).join('');html=`<div class="stack-audit-list">${rows}</div><div class="ledger-detail-note">중력 우물도 에코 비콘으로 복제된다. 복제 우물은 붉은 강착 원반으로 표시되고 피해는 원본의 55%다. 복제 확률 상한은 72%다.</div>`;
    }else if(key==='chainDrive'){
      const rows=Array.from({length:p.max},(_,i)=>{const s=i+1,maxBonus=chainDriveBonus(s,200);return`<div class="stack-audit-row ${n>=s?'unlocked':''} ${n===s?'current':''}"><strong>${s}</strong><div><b>연쇄 200 기준 최대 ${Math.round(maxBonus*1000)/10}% 단축</b><span>연쇄 10회마다 완만하게 증가하며 200회 이후 추가 증가 없음.</span></div></div>`;}).join('');html=`<div class="ledger-live-stats"><div class="ledger-live-stat"><small>현재 연쇄 보너스</small><b>${Math.round(chainDriveBonus()*1000)/10}%</b></div><div class="ledger-live-stat"><small>전체 주기 하한</small><b>×0.14</b></div></div><div class="stack-audit-list">${rows}</div>`;
    }else if(key==='magnet'){
      html=`<div class="ledger-live-stats"><div class="ledger-live-stat"><small>현재 흡수 반경</small><b>${Math.round(magnetRange())}</b></div><div class="ledger-live-stat"><small>중첩당 증가</small><b>+34</b></div><div class="ledger-live-stat"><small>패시브 최대</small><b>${p.max}</b></div></div><div class="ledger-detail-note">자석 반경 자체에는 전역 상한이 없다. 다만 자석 코어는 ${p.max}중첩까지이며, 성운 보관소의 중력 보정은 별도로 +45씩 더해진다.</div>`;
    }else html=`<div class="ledger-live-stats"><div class="ledger-live-stat"><small>현재 중첩</small><b>${n}</b></div><div class="ledger-live-stat"><small>최대 중첩</small><b>${p.max}</b></div></div><div class="ledger-detail-note">${text.desc}</div>`;
    detailContent.innerHTML=html;detail.classList.remove('hidden');
  }
  function openLimits(){
    detailCard.style.setProperty('--detail-color','#9fdcff');detailIcon.textContent='⌁';detailTitle.textContent='전역 상한 정보';detailSub.textContent='무한 증가와 하드 캡을 구분한 실제 적용값';
    const rows=[['장비 중첩','각 장비 최대 6중첩'],['공격 주기','최소 배율 ×0.14 · 최대 86% 단축'],['치명타 확률','최대 68%'],['피해 감소','최대 78%'],['에코 비콘','일반 발동 최대 72% · 8중첩 5회마다 확정'],['연쇄 피해','최대 +48%'],['연쇄 추진기','연쇄 200회까지만 계산 · 최대 12중첩'],['자석 반경','전역 하드 캡 없음 · 각 획득원의 중첩 한도만 적용'],['투사체 크기·속도','전역 하드 캡 없음 · 패시브와 성운 획득 한도 적용']];
    detailContent.innerHTML=`<div class="stack-audit-list">${rows.map(([a,b],i)=>`<div class="stack-audit-row unlocked"><strong>${i+1}</strong><div><b>${a}</b><span>${b}</span></div></div>`).join('')}</div>`;detail.classList.remove('hidden');
  }
  limitsBtn.onclick=openLimits;

  function annotateLedger(){
    const sections=ledgerBody.querySelectorAll('.ledger-section');
    const weaponCards=sections[0]?.querySelectorAll('.ledger-card')||[];
    for(const card of weaponCards){const title=card.querySelector('h4')?.textContent;for(const [key,count] of Object.entries(state.weaponStacks||{})){if(count>0&&weaponText(key).name===title){card.dataset.weaponKey=key;card.tabIndex=0;card.setAttribute('role','button');break;}}}
    const passiveCards=sections[1]?.querySelectorAll('.ledger-card')||[];
    for(const card of passiveCards){const title=card.querySelector('h4')?.textContent;for(const [key,count] of Object.entries(state.passives||{})){if(count>0&&passiveText(key).name===title){card.dataset.passiveKey=key;card.tabIndex=0;card.setAttribute('role','button');break;}}}
  }
  new MutationObserver(annotateLedger).observe(ledgerBody,{childList:true,subtree:true});
  ledgerBody.addEventListener('click',e=>{const card=e.target.closest('.ledger-card');if(card?.dataset.weaponKey)openWeaponDetail(card.dataset.weaponKey);else if(card?.dataset.passiveKey)openPassiveDetail(card.dataset.passiveKey);});
  ledgerBody.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const card=e.target.closest('.ledger-card');if(!card)return;e.preventDefault();if(card.dataset.weaponKey)openWeaponDetail(card.dataset.weaponKey);else if(card.dataset.passiveKey)openPassiveDetail(card.dataset.passiveKey);});
  annotateLedger();renderLoadout();updateHUD();
})();
