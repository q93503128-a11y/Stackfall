(function(){
  Object.assign(STACK_EFFECTS,{
    core:[['초기 점화','기본 광자탄 1발 자동 발사.'],['쌍발 코어','광자탄 2발 동시 발사.'],['코어 관통','각 광자탄이 적 1명을 추가 관통.'],['펄스 폭발','명중 지점에 소형 범위 폭발.'],['삼중 코어','광자탄 3발 동시 발사.'],['항성 펄스','주기적으로 대형 관통 광자탄 발사.']],
    ember:[['첫 별','별빛 탄환 1발 발사.'],['쌍성 사격','별빛 탄환 2발 동시 발사.'],['성핵 관통','각 탄환이 적 1명을 추가 관통.'],['성운 분열','적중 시 별가루 3개로 분열.'],['삼중 성렬','별빛 탄환 3발 동시 발사.'],['초신성 탄두','주기적으로 대형 관통 초신성탄 발사.']],
    comet:[['결정 장창','장거리 관통 혜성 창 1개 발사.'],['이중 궤적','혜성 창 2개 동시 발사.'],['심층 관통','창 크기와 관통 횟수 증가.'],['혜성 파편','적중 시 파편 4개 방출.'],['잔광 궤도','비행 경로에 지속 피해.'],['대충돌','소멸 지점에 대형 폭발.']],
    arc:[['성운 비행','사거리 안 가장 먼 적을 타격하고 귀환한다.'],['쌍곡선','같은 표적을 향하는 칼날 2개.'],['광폭 곡선','곡선 폭과 칼날 판정 증가.'],['귀환 절단','귀환 타격 피해 ×1.38.'],['잔광 띠','왕복 경로에 지속 피해.'],['삼중 나선','같은 표적을 향하는 칼날 3개.']],
    blade:[['월광 기동','광자 칼날 1개 공전.'],['쌍월 궤도','광자 칼날 2개 공전.'],['가속 궤도','공전 속도와 공격 반경 증가.'],['성흔 파동','적중 지점에서 관통 절단파 발사.'],['삼월식','광자 칼날 3개 공전.'],['천체 분쇄기','연쇄 처치마다 별빛 폭발.']],
    bulwark:[['성광 피막','최대 체력과 피해 감소 증가.'],['겹빛 장벽','피해 감소율 추가 증가.'],['재충전 장벽','일정 시간마다 보호막 6 충전.'],['보복 장막','피격 시 주변 충격파.'],['요새 장막','보호막 용량과 충전량 증가.'],['천체 성벽','강한 보호막을 주기적으로 충전.']],
    gravity:[['특이점 씨앗','중력 우물 1개 생성.'],['조석 고정','흡입 반경과 흡입력 증가.'],['장수 특이점','지속시간 증가.'],['붕괴핵','중심부 지속 피해.'],['압축 붕괴','중심 피해와 흡입력 추가 증가.'],['쌍둥이 특이점','중력 우물 2개 동시 생성.']],
    prism:[['점화 광선','새 표적을 0.5초 조준한 뒤 집속한다.'],['쌍둥이 프리즘','프리즘 2개가 같은 표적을 집속한다.'],['용광 단계','0.88초 유지 시 ×1.85, 최대 출력 ×3.70.'],['과열 결정','집속 전환 시간이 단축된다.'],['항성 초점','최대 출력 ×4.10.'],['천구 소각','프리즘 3개, 최대 출력 ×4.45.']],
    chrono:[['느린 시간','주변 적 이동속도 감소.'],['느린 궤도','감속 범위 증가.'],['시간 가속','장비 발동 주기 추가 단축.'],['시간 파동','주기적인 범위 피해 파동.'],['찰나 정지','파동 적중 적을 강하게 감속.'],['영원의 원환','감속 범위와 장비 가속 강화.']],
    ion:[['첫 방전','적 사이를 잇는 이온 사슬.'],['연결 확장','연결 대상 +1.'],['고전압','연결 거리와 피해 증가.'],['분기 방전','첫 대상에서 두 갈래로 분기.'],['잔류 전하','마지막 대상 주변 폭발.'],['쌍중 낙뢰','짧은 간격으로 2회 방전.']],
    nova:[['항성 점화','플레이어 중심 초신성 파동.'],['팽창권','파동 반경 증가.'],['잔광 파동','잠시 뒤 내부에 두 번째 파동.'],['충격 전선','적을 바깥으로 밀어냄.'],['과열 코일','반경과 발동 속도 증가.'],['이중 초신성','더 넓은 후속 폭발.']],
    drone:[['단일 편대','유성 드론 1기 집중 사격.'],['쌍기 편대','드론 2기가 같은 표적을 사격.'],['관통 탄두','드론 탄환 관통 +1.'],['교차 사격','각 드론이 탄환 2발 발사.'],['고속 궤도','발사 속도 증가.'],['삼중 편대','드론 3기가 같은 표적을 사격.']],
    rail:[['초고속 관통','장거리 레일 광선 1줄.'],['과충전 총신','광선 굵기와 피해 증가.'],['잔광 재점화','약한 후속 광선 발사.'],['쌍열 레일','같은 표적을 가르는 평행 광선 2줄.'],['거성 파쇄','정예 추가 피해 ×1.32.'],['교차 종말선','표적을 가로지르는 교차 광선.']],
    spiral:[['나선 씨앗','나선 탄막 1갈래.'],['쌍팔 나선','같은 표적을 향하는 나선 2갈래.'],['중력 유도','탄환이 적을 완만하게 추적.'],['삼중 은하팔','같은 표적을 향하는 나선 3갈래.'],['관통 성운','탄환 수와 관통 증가.'],['사중 은하팔','같은 표적을 향하는 나선 4갈래.']],
    mirror:[['반사막','주변 적 탄환을 아군 광탄으로 반사.'],['확장 거울','반사 범위와 처리 수 증가.'],['관통 반사','반사 광탄 관통 +1.'],['역광 포화','반사할 탄환이 적어도 반격탄 발사.'],['보호 환원','발동 시 보호막 충전.'],['완전 반사','넓은 반사장과 중심 반격 파동.']]
  });
  for(const[key,weapon]of Object.entries(WEAPONS))weapon.stackEffects=STACK_EFFECTS[key]||weapon.stackEffects||[];

  const displayedChainDriveBonus=()=>Math.max(0,1-(typeof weaponCycleMultiplier==='function'?weaponCycleMultiplier():1));
  const detailStyle=document.createElement('style');
  detailStyle.textContent=`
    .passive-list{max-height:min(278px,36vh)!important;overflow-y:auto!important;overflow-x:hidden!important;pointer-events:auto!important;overscroll-behavior:contain;padding-right:5px!important;scrollbar-width:thin}
    .ledger-card[data-weapon-key],.ledger-card[data-passive-key]{cursor:pointer;position:relative}
    .ledger-card[data-weapon-key]:after,.ledger-card[data-passive-key]:after{content:'상세';position:absolute;right:11px;bottom:9px;padding:2px 6px;border-radius:7px;background:rgba(255,255,255,.07);color:#d8e9ff;font-size:7px;font-weight:800}
    .ledger-detail-layer{position:absolute;inset:0;z-index:8;display:grid;place-items:center;padding:22px;background:rgba(0,2,10,.78)}
    .ledger-detail-layer.hidden{display:none}.ledger-detail-card{width:min(760px,94vw);max-height:min(790px,88vh);overflow:auto;border:1px solid rgba(255,255,255,.14);border-radius:24px;background:linear-gradient(155deg,#111a35,#040713 72%);box-shadow:0 30px 90px rgba(0,0,0,.65);padding:22px;color:#f7fbff}
    .ledger-detail-head{display:grid;grid-template-columns:58px 1fr 38px;gap:14px;align-items:center;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.09)}
    .ledger-detail-icon{width:58px;height:58px;border-radius:17px;display:grid;place-items:center;background:rgba(255,255,255,.08);color:var(--detail-color);font-size:29px;text-shadow:0 0 20px var(--detail-color)}
    .ledger-detail-head h3{margin:0;font-size:22px}.ledger-detail-head p{margin:4px 0 0;color:#93a5c7;font-size:10px}.ledger-detail-close{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:#070b18;color:#fff;font-size:22px}
    .ledger-live-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:8px;margin:15px 0}.ledger-live-stat{padding:10px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07)}.ledger-live-stat small{display:block;color:#8294b8;font-size:8px}.ledger-live-stat b{display:block;margin-top:4px;font-size:13px}
    .stack-audit-list{display:grid;gap:7px}.stack-audit-row{display:grid;grid-template-columns:38px 1fr;gap:10px;padding:10px 12px;border-radius:13px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);opacity:.48}.stack-audit-row.unlocked{opacity:1}.stack-audit-row.current{background:rgba(124,232,255,.10);box-shadow:inset 3px 0 0 var(--detail-color)}.stack-audit-row>strong{color:var(--detail-color)}.stack-audit-row b{display:block;font-size:11px}.stack-audit-row span{display:block;margin-top:3px;color:#92a1bf;font-size:9px;line-height:1.45}
    @media(max-width:760px){.ledger-detail-card{padding:15px}.passive-list{display:none!important}}
  `;
  document.head.appendChild(detailStyle);

  const ledgerScreen=document.querySelector('#abilityLedgerScreen'),ledgerBody=document.querySelector('#ledgerBody');
  if(ledgerScreen&&ledgerBody){
    const detail=document.createElement('div');detail.className='ledger-detail-layer hidden';detail.innerHTML='<article class="ledger-detail-card" style="--detail-color:#7ce8ff"><header class="ledger-detail-head"><div class="ledger-detail-icon">✦</div><div><h3></h3><p></p></div><button class="ledger-detail-close" type="button">×</button></header><div class="ledger-detail-content"></div></article>';ledgerScreen.appendChild(detail);
    const card=detail.querySelector('.ledger-detail-card'),icon=detail.querySelector('.ledger-detail-icon'),title=detail.querySelector('h3'),sub=detail.querySelector('p'),content=detail.querySelector('.ledger-detail-content'),fmt=value=>Number.isFinite(value)?(Math.abs(value)>=100?Math.round(value):Number(value).toFixed(2).replace(/\.00$/,'')):'—';
    const close=()=>detail.classList.add('hidden');detail.querySelector('.ledger-detail-close').onclick=close;detail.addEventListener('pointerdown',event=>{if(event.target===detail)close();});
    function weaponStats(key,n){
      const h=hasteMult(),size=weaponSizeMultiplier(),out=[['사거리',Math.round(weaponRange(key))]];
      if(key==='core')out.push(['발사 주기',`${fmt(Math.max(.48,1.12-(n-1)*.075)*h)}초`],['추가 광자탄',stat('multiplicity')]);
      else if(key==='ember')out.push(['발사 주기',`${fmt((.82-Math.min(.28,n*.04))*h)}초`],['동시 발사',n>=5?3:n>=2?2:1]);
      else if(key==='comet')out.push(['발사 주기',`${fmt((1.92-Math.min(.46,n*.06))*h)}초`],['관통',2+Math.floor(n/2)+(n>=3?1:0)]);
      else if(key==='blade')out.push(['칼날 수',(n>=5?3:n>=2?2:1)+stat('multiplicity')],['판정 크기',`×${fmt(size)}`]);
      else if(key==='prism')out.push(['프리즘 수',(n>=6?3:n>=2?2:1)+stat('multiplicity')],['표적','현재 표적 사망까지 유지'],['새 표적 선딜','0.5초'],['집속 단계','×1 → ×1.85 → ×'+(n>=6?'4.45':n>=5?'4.10':'3.70')]);
      else if(key==='gravity')out.push(['생성 주기',`${fmt((6.1-Math.min(2.2,n*.32))*h)}초`],['우물 수',(n>=6?2:1)+stat('multiplicity')]);
      else if(key==='chrono')out.push(['감속 반경',Math.round((145+n*18)*size)]);
      else if(key==='arc')out.push(['자동 표적','사거리 내 가장 먼 적'],['칼날 수',n>=6?3:n>=2?2:1],['귀환 피해',n>=4?'×1.38':'×1.00']);
      else if(key==='ion')out.push(['발동 주기',`${fmt((2.35-Math.min(.62,n*.07))*h)}초`],['연결 수',2+(n>=2?1:0)+(n>=5?1:0)]);
      else if(key==='nova')out.push(['발동 주기',`${fmt((4.9-Math.min(1.25,n*.16))*h)}초`]);
      else if(key==='drone')out.push(['드론 수',(n>=6?3:n>=2?2:1)+stat('multiplicity')],['표적','편대 전체 공유']);
      else if(key==='rail')out.push(['발동 주기',`${fmt((4.15-Math.min(.92,n*.13))*h)}초`],['추가 평행선',stat('multiplicity')]);
      else if(key==='spiral')out.push(['발동 주기',`${fmt((3.05-Math.min(.82,n*.11))*h)}초`],['집중 갈래',(n>=6?4:n>=4?3:n>=2?2:1)+stat('multiplicity')]);
      else if(key==='mirror')out.push(['발동 주기',`${fmt((5.35-Math.min(1.35,n*.18))*h)}초`]);
      return out;
    }
    function openWeapon(key){const weapon=WEAPONS[key];if(!weapon)return;const text=weaponText(key),n=weaponCount(key),rows=STACK_EFFECTS[key]||[];card.style.setProperty('--detail-color',weapon.color);icon.textContent=weapon.icon;title.textContent=text.name;sub.textContent=`현재 ${n}중첩`;content.innerHTML=`<div class="ledger-live-stats">${weaponStats(key,n).map(([label,value])=>`<div class="ledger-live-stat"><small>${label}</small><b>${value}</b></div>`).join('')}</div><div class="stack-audit-list">${rows.map((row,index)=>`<div class="stack-audit-row ${n>=index+1?'unlocked':''} ${n===index+1?'current':''}"><strong>${index+1}</strong><div><b>${row[0]}</b><span>${row[1]}</span></div></div>`).join('')}</div>`;detail.classList.remove('hidden');}
    function openPassive(key){const passive=PASSIVES[key],text=passiveText(key),n=stat(key);if(!passive)return;card.style.setProperty('--detail-color',passive.color);icon.textContent=passive.icon;title.textContent=text.name;sub.textContent=`현재 ${n}중첩`;const extras=[];if(key==='echo')extras.push(['현재 복제 확률',`${Math.round(Math.min(.60,n*.075)*1000)/10}%`]);if(key==='chainDrive')extras.push(['현재 주기 단축',`${Math.round(displayedChainDriveBonus()*1000)/10}%`]);if(key==='magnet'){extras.push(['현재 흡수 반경',Math.round(magnetRange())],['추가 흡인 속도',`+${n*22}%`]);}if(key==='range')extras.push(['현재 사거리 증가',`+${n*10}%`]);extras.push(['중첩 효과',text.desc]);content.innerHTML=`<div class="ledger-live-stats">${extras.map(([label,value])=>`<div class="ledger-live-stat"><small>${label}</small><b>${value}</b></div>`).join('')}</div>`;detail.classList.remove('hidden');}
    function annotate(){const summary=document.querySelector('#ledgerSummary');if(!summary)return;for(const statEl of summary.querySelectorAll('.ledger-stat')){const label=statEl.querySelector('small')?.textContent;if(label==='정예 피해'||label==='Elite damage')statEl.querySelector('b').textContent=`${Math.round(stat('eliteHunter')*.15*100)}%`;}let rangeEl=summary.querySelector('[data-range-stat]');if(!rangeEl){rangeEl=document.createElement('div');rangeEl.className='ledger-stat';rangeEl.dataset.rangeStat='1';summary.appendChild(rangeEl);}rangeEl.innerHTML=`<small>${GAME_SETTINGS.language==='ko'?'무기 사거리':'Weapon range'}</small><b>+${stat('range')*10}%</b>`;}
    ledgerScreen.addEventListener('stackfall:ledger-rendered',annotate);ledgerBody.addEventListener('click',event=>{const item=event.target.closest('.ledger-card');if(item?.dataset.weaponKey)openWeapon(item.dataset.weaponKey);else if(item?.dataset.passiveKey)openPassive(item.dataset.passiveKey);});annotate();
  }

  let guidanceEliteArrows=0,guidanceEventArrows=0;
  function safeEdge(dx,dy,bottomGap=154){const cx=vw/2,cy=vh/2,left=76,right=vw-76,top=82,bottom=vh-bottomGap,values=[];if(dx>0)values.push((right-cx)/dx);else if(dx<0)values.push((left-cx)/dx);if(dy>0)values.push((bottom-cy)/dy);else if(dy<0)values.push((top-cy)/dy);const positive=values.filter(value=>value>0),scale=positive.length?Math.min(...positive):1;return{x:cx+dx*scale,y:cy+dy*scale};}
  function drawRangedOverlay(){for(const enemy of state.entities.enemies){if(enemy.dead||enemy.type!=='ranged')continue;const p=worldToScreen(enemy.x,enemy.y);if(p.x<-50||p.x>vw+50||p.y<-50||p.y>vh+50)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(player.y-enemy.y,player.x-enemy.x));ctx.strokeStyle=enemy.eventKind==='crash'?'#ffd078':'#75eaff';ctx.fillStyle='rgba(6,20,34,.92)';ctx.lineWidth=2;ctx.shadowBlur=14;ctx.shadowColor=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(enemy.r,0);ctx.lineTo(enemy.r*.22,-enemy.r*.72);ctx.lineTo(-enemy.r*.76,-enemy.r*.44);ctx.lineTo(-enemy.r*.76,enemy.r*.44);ctx.lineTo(enemy.r*.22,enemy.r*.72);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(enemy.r*.20,-2,enemy.r*.92,4);ctx.restore();}}
  function eliteGuidanceMeta(enemy){const korean=GAME_SETTINGS.language==='ko',apex=enemy.kind==='apex',voidBoss=enemy.kind==='void'||enemy.eventKind==='void',mini=enemy.type==='mini';return{label:apex?(korean?'초월체':'APEX'):voidBoss?(korean?'공허 보스':'VOID BOSS'):mini?(korean?'중간보스':'MINI-BOSS'):(korean?'보스':'BOSS'),icon:apex?'✦':voidBoss?'◉':mini?'◇':'◆',color:apex?'#fff0a8':voidBoss?'#c38cff':mini?'#8fdcff':'#ff78bd'};}
  function drawEdgeArrow(edge,angle,meta,label){ctx.save();ctx.translate(edge.x,edge.y);ctx.rotate(angle);ctx.fillStyle=meta.color;ctx.shadowBlur=22;ctx.shadowColor=meta.color;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(-11,-11);ctx.lineTo(-5,0);ctx.lineTo(-11,11);ctx.closePath();ctx.fill();ctx.restore();ctx.save();ctx.font='900 10px "IBM Plex Sans KR",sans-serif';ctx.textAlign=edge.x<vw/2?'left':'right';ctx.textBaseline='middle';const x=edge.x+(edge.x<vw/2?28:-28),width=Math.min(180,ctx.measureText(label).width+18);ctx.fillStyle='rgba(4,7,19,.90)';ctx.beginPath();ctx.roundRect(edge.x<vw/2?x-8:x-width+8,edge.y-11,width,22,8);ctx.fill();ctx.fillStyle=meta.color;ctx.fillText(label,x,edge.y,width-10);ctx.restore();}
  function drawEliteEdgeArrows(){guidanceEliteArrows=0;const bottomGap=compactDevice()?180:154,left=76,right=vw-76,top=82,bottom=vh-bottomGap;let ordinal=0;for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||!['mini','boss'].includes(enemy.type))continue;const p=worldToScreen(enemy.x,enemy.y);if(p.x>left&&p.x<right&&p.y>top&&p.y<bottom)continue;const dx=p.x-vw/2,dy=p.y-vh/2,angle=Math.atan2(dy,dx),edge=safeEdge(dx,dy,bottomGap),lane=((ordinal++%3)-1)*22;edge.x=clamp(edge.x-Math.sin(angle)*lane,left,right);edge.y=clamp(edge.y+Math.cos(angle)*lane,top,bottom);const meta=eliteGuidanceMeta(enemy),distance=Math.round(Math.hypot(enemy.x-player.x,enemy.y-player.y));drawEdgeArrow(edge,angle,meta,`${meta.icon} ${meta.label} · ${distance}`);guidanceEliteArrows++;}}
  const baseDrawEnemies=drawEnemies;drawEnemies=function auditedEnemyDraw(){baseDrawEnemies();drawRangedOverlay();drawEliteEdgeArrows();};

  function eventMeta(type){return type==='crash'?{label:'우주선',icon:'⌁',color:'#ff9a62'}:type==='void'?{label:'공허 균열',icon:'◉',color:'#b36bff'}:{label:'성운 보관소',icon:'◇',color:'#75eaff'};}
  function drawMapEventEdgeArrows(){guidanceEventArrows=0;if(state.mapEventActive)return;const bottomGap=compactDevice()?180:154,left=76,right=vw-76,top=82,bottom=vh-bottomGap;for(const marker of state.entities.mapEvents||[]){if(!marker||marker.consumed)continue;const p=worldToScreen(marker.x,marker.y);if(p.x>left&&p.x<right&&p.y>top&&p.y<bottom)continue;const dx=p.x-vw/2,dy=p.y-vh/2,angle=Math.atan2(dy,dx),edge=safeEdge(dx,dy,bottomGap),meta=eventMeta(marker.type),distance=Math.round(Math.hypot(marker.x-player.x,marker.y-player.y));drawEdgeArrow(edge,angle,meta,`${meta.icon} ${meta.label} · ${distance}`);guidanceEventArrows++;}}
  const baseDrawMapEvents=drawMapEvents,baseOwnsEventArrows=baseDrawMapEvents.name==='drawPolishedMapEvents';drawMapEvents=function auditedEventIndicators(){baseDrawMapEvents();if(typeof drawApexArena==='function')drawApexArena();if(baseOwnsEventArrows)guidanceEventArrows=0;else drawMapEventEdgeArrows();};
  window.stackfallGuidanceDiagnostics=()=>({eliteArrows:guidanceEliteArrows,eventArrows:guidanceEventArrows});

  renderLoadout();updateHUD();
})();
