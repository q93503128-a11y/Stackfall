(function(){
  const lang=()=>GAME_SETTINGS.language||'ko';
  const pick=(row)=>row?.[lang()]||row?.en||row?.ko||'';

  Object.assign(TEXT.ko,{
    'pause.restart':'게임 다시 시작','reward.title':'보스 보상','reward.prompt':'하나를 선택하세요',
    'reward.passive':'특수 패시브','reward.augment':'무기 특수효과'
  });
  Object.assign(TEXT.en,{'pause.restart':'RESTART GAME','reward.title':'BOSS REWARD','reward.prompt':'Choose one','reward.passive':'ELITE PASSIVE','reward.augment':'WEAPON EFFECT'});
  Object.assign(TEXT.ja,{'pause.restart':'ゲームを再開','reward.title':'ボス報酬','reward.prompt':'1つ選択','reward.passive':'特殊パッシブ','reward.augment':'武器特殊効果'});
  if(TEXT['zh-CN'])Object.assign(TEXT['zh-CN'],{'pause.restart':'重新开始游戏','reward.title':'首领奖励','reward.prompt':'选择一项','reward.passive':'特殊被动','reward.augment':'武器特效'});
  if(TEXT.es)Object.assign(TEXT.es,{'pause.restart':'REINICIAR JUEGO','reward.title':'RECOMPENSA DEL JEFE','reward.prompt':'Elige uno','reward.passive':'PASIVA ESPECIAL','reward.augment':'EFECTO DE ARMA'});
  if(TEXT.fr)Object.assign(TEXT.fr,{'pause.restart':'RECOMMENCER LA PARTIE','reward.title':'RÉCOMPENSE DU BOSS','reward.prompt':'Choisissez-en une','reward.passive':'PASSIF SPÉCIAL','reward.augment':'EFFET D’ARME'});

  const koDescriptions={
    core:['코어 펄스','기본 무기','가까운 적을 자동 추적하는 기본 광자 무기.'],
    blade:['펄스 블레이드','공격 / 근접','근거리 궤도를 회전하며 적을 절단하는 광자 칼날.'],
    ember:['별빛 캐스터','공격 / 탄막','가까운 적에게 폭발성 별빛 탄환을 연사하는 성광 발사기.'],
    bulwark:['성광 장벽','방어 / 보호막','피해 흡수와 보호막 충전에 특화된 성광 장벽.'],
    gravity:['중력 우물','제어 / 집속','가까운 적을 한 지점으로 끌어당기는 공간 왜곡 장치.'],
    comet:['혜성 창','공격 / 관통','긴 광미와 함께 적을 관통하는 결정 장창.'],
    chrono:['시간 고리','제어 / 지원','주변 적의 움직임을 늦추는 시간 제어 장치.'],
    arc:['성운 부메랑','공격 / 곡선','부드러운 곡선으로 왕복하며 적을 두 차례 베는 성운 칼날.']
  };
  for(const [key,row] of Object.entries(koDescriptions))if(WEAPON_TEXT[key])WEAPON_TEXT[key].ko=row;
  Object.assign(WEAPONS.bulwark,{name:'성광 장벽',icon:'◈',role:'방어 / 보호막',desc:koDescriptions.bulwark[2]});
  STACK_EFFECTS.bulwark=[
    ['성광 피막','받는 피해를 줄이는 기본 성광 장벽.'],
    ['겹빛 장벽','최대 체력과 피해 감소가 증가하는 이중 장벽.'],
    ['재충전 장벽','일정 시간마다 보호막을 회복하는 재충전 장벽.'],
    ['보복 파동','피격 시 주변 적을 밀어내는 반격 파동.'],
    ['요새 장막','보호막 용량과 재충전량이 증가하는 요새 장막.'],
    ['천체 성벽','주기적으로 강력한 보호막을 충전하는 천체 성벽.']
  ];
  STACK_EFFECTS_EN.bulwark=['Radiant Film','Layered Barrier','Recharge Barrier','Retaliation Wave','Fortress Veil','Celestial Wall'];
  STACK_DESC_EN.bulwark=['A radiant barrier that reduces incoming damage.','A layered barrier with increased maximum health and damage reduction.','A recharging barrier that restores shield over time.','Taking damage releases a repelling counter wave.','A fortress veil with greater shield capacity and recharge.','A celestial wall that periodically charges a powerful shield.'];
  STACK_EFFECTS_JA.bulwark=['星光皮膜','重光障壁','再充填障壁','報復波動','要塞帳幕','天体城壁'];
  STACK_DESC_JA.bulwark=['被ダメージを軽減する基本星光障壁。','最大HPと軽減率が増える二重障壁。','一定時間ごとにシールドを回復する障壁。','被弾時に周囲を押し返す反撃波。','シールド容量と充填量が増える要塞帳幕。','定期的に強力なシールドを充填する天体城壁。'];
  if(WEAPON_TEXT.bulwark){
    WEAPON_TEXT.bulwark.en=['Astral Barrier','Defense / Shield','A radiant barrier specialized in damage absorption and shield recovery.'];
    WEAPON_TEXT.bulwark.ja=['星光障壁','防御 / シールド','被害吸収とシールド充填に特化した星光障壁。'];
    WEAPON_TEXT.bulwark['zh-CN']=['星光屏障','防御 / 护盾','专注于吸收伤害与补充护盾的星光屏障。'];
    WEAPON_TEXT.bulwark.es=['Barrera Astral','Defensa / Escudo','Barrera radiante especializada en absorber daño y recargar escudo.'];
    WEAPON_TEXT.bulwark.fr=['Barrière Astrale','Défense / Bouclier','Barrière lumineuse spécialisée dans l’absorption et la recharge du bouclier.'];
  }

  const rrOldToggle=togglePause;
  togglePause=function(force){if(['bossReward','apexReward'].includes(state.mode))return;return rrOldToggle(force);};

  createGravityWells=function(gravN,echoed=false){
    audio.weapon?.('gravity',echoed);const target=nearestEnemy(player.x,player.y),count=gravN>=6?2:1;
    const base=target?Math.atan2(target.y-player.y,target.x-player.x):player.angle;
    const targetDistance=target?Math.hypot(target.x-player.x,target.y-player.y):150,size=weaponSizeMultiplier();
    for(let i=0;i<count;i++){
      const a=base+(i-(count-1)/2)*.42+(echoed?.2:0),d=clamp(targetDistance*.78,110,205),duration=(gravN>=3?3.55:2.7)+(gravN>=4?.55:0);
      state.entities.wells.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:(gravN>=2?185:135)*size,life:duration,max:duration,
        strength:(gravN>=2?430:280)+(gravN>=5?120:0),damage:gravN>=4?(9+gravN*2.2+(gravN>=5?7:0))*(echoed?.55:1):0,tick:0,color:echoed?COLORS.pink:COLORS.violet,
        rewardBurst:!!state.weaponAugments?.gravity,attackSizeScaled:true,echoed:!!echoed});
    }
    trimOldest(state.entities.wells,12);
  };

  const rewardScreen=document.createElement('section');
  rewardScreen.id='bossRewardScreen';rewardScreen.className='overlay hidden';
  rewardScreen.innerHTML='<div class="reward-shell"><div class="choice-head"><p id="rewardKicker"></p><h2 id="rewardTitle"></h2><span id="rewardPrompt"></span></div><div id="rewardCards" class="reward-cards"></div></div>';
  document.querySelector('#app').appendChild(rewardScreen);
  const rewardStyle=document.createElement('style');rewardStyle.textContent=`
    #bossRewardScreen{z-index:65;background:radial-gradient(circle at 50% 42%,rgba(83,65,174,.42),rgba(2,4,13,.94));backdrop-filter:blur(10px)}
    .reward-shell{width:min(1260px,97vw)}.reward-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .reward-card{min-height:250px;text-align:left;color:#f6f8ff;border-radius:21px;padding:19px;cursor:pointer;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.14);background:linear-gradient(145deg,rgba(28,34,72,.98),rgba(7,10,27,.99));box-shadow:0 22px 58px rgba(0,0,0,.42);transition:.18s}
    .reward-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 0%,var(--reward-glow),transparent 48%)}.reward-card:hover{transform:translateY(-6px);border-color:var(--reward-color)}
    .reward-card>*{position:relative}.reward-card .reward-type{font-size:9px;font-weight:900;letter-spacing:.14em;color:var(--reward-color)}.reward-card .reward-icon{font-size:44px;margin:27px 0 20px;color:var(--reward-color);text-shadow:0 0 24px var(--reward-color)}
    .reward-card h3{font-size:21px;margin:0 0 8px}.reward-card p{margin:0;color:#abb5d3;font-size:12px;line-height:1.65}
    @media(max-width:1040px){.reward-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:720px){.reward-cards{grid-template-columns:1fr;max-height:65vh;overflow:auto}.reward-card{min-height:155px}.reward-card .reward-icon{margin:14px 0;font-size:34px}}
  `;document.head.appendChild(rewardStyle);
  const rewardThemeStyle=document.createElement('style');rewardThemeStyle.textContent=`
    .reward-shell{position:relative;padding:28px;border:1px solid rgba(210,222,255,.18);clip-path:polygon(0 18px,18px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 18px) 100%,18px 100%,0 calc(100% - 18px));background:radial-gradient(circle at 50% 0%,rgba(135,116,255,.15),transparent 42%),linear-gradient(155deg,rgba(14,19,48,.97),rgba(3,5,16,.99));box-shadow:0 38px 120px rgba(0,0,0,.68),inset 0 0 90px rgba(120,130,255,.06)}
    .reward-shell:before{content:"";position:absolute;inset:12px;border:1px solid rgba(255,255,255,.05);pointer-events:none}.reward-card{border-radius:6px;clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px));box-shadow:inset 3px 0 0 var(--reward-color),0 22px 58px rgba(0,0,0,.46)}
    #apexRewardScreen{z-index:70;background:radial-gradient(circle at 50% 38%,rgba(255,211,105,.18),rgba(1,2,9,.98) 68%);backdrop-filter:blur(12px)}.apex-reward-shell{width:min(1120px,96vw);padding:30px;position:relative;border:1px solid rgba(255,234,169,.28);clip-path:polygon(50% 0,100% 12%,96% 100%,4% 100%,0 12%);background:radial-gradient(circle at 50% 0%,rgba(255,205,105,.14),transparent 40%),linear-gradient(155deg,rgba(25,20,43,.98),rgba(3,4,13,.99));box-shadow:0 40px 130px rgba(0,0,0,.74),inset 0 0 110px rgba(255,194,82,.06)}.apex-reward-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.apex-reward-card{min-height:255px;padding:22px;text-align:left;color:#fff;border:1px solid color-mix(in srgb,var(--apex-color) 48%,rgba(255,255,255,.08));background:linear-gradient(150deg,color-mix(in srgb,var(--apex-color) 12%,#151124),#050611 72%);clip-path:polygon(50% 0,100% 18%,93% 100%,7% 100%,0 18%);cursor:pointer;transition:.18s}.apex-reward-card:hover{transform:translateY(-6px);box-shadow:0 0 38px color-mix(in srgb,var(--apex-color) 20%,transparent)}.apex-reward-card span{font-size:42px;color:var(--apex-color);text-shadow:0 0 25px var(--apex-color)}.apex-reward-card h3{font-size:20px;margin:25px 0 9px}.apex-reward-card p{color:#aeb6d1;font-size:12px;line-height:1.65}@media(max-width:720px){.apex-reward-shell{padding:19px 13px}.apex-reward-cards{grid-template-columns:1fr;max-height:66vh;overflow:auto}.apex-reward-card{min-height:145px}}
  `;document.head.appendChild(rewardThemeStyle);
  const apexBundleStyle=document.createElement('style');apexBundleStyle.textContent=`.apex-reward-card{cursor:default;box-shadow:inset 0 0 36px color-mix(in srgb,var(--apex-color) 7%,transparent)}.apex-reward-card:hover{transform:none;box-shadow:inset 0 0 36px color-mix(in srgb,var(--apex-color) 7%,transparent)}.apex-reward-confirm{display:block;width:min(360px,82%);margin:24px auto 0}.apex-reward-confirm:disabled{opacity:.55;cursor:default}@media(max-width:720px){.apex-reward-cards{max-height:58vh}.apex-reward-confirm{margin-top:14px}}`;document.head.appendChild(apexBundleStyle);
  const apexRewardScreen=document.createElement('section');apexRewardScreen.id='apexRewardScreen';apexRewardScreen.className='overlay hidden';apexRewardScreen.innerHTML='<div class="apex-reward-shell"><div class="choice-head"><p>APEX LEGACY PACKAGE</p><h2 id="apexRewardTitle">초월체 전리품 확인</h2><span id="apexRewardPrompt">아래 보상은 모두 지급됩니다. 내용을 확인한 뒤 수령하세요.</span></div><div id="apexRewardCards" class="apex-reward-cards"></div><button id="apexRewardConfirmBtn" class="primary-btn apex-reward-confirm" type="button"><span>모두 받기</span></button></div>';document.querySelector('#app').appendChild(apexRewardScreen);

  const traitDefs={
    stellar:{icon:'✹',color:'#ffe49a',name:{ko:'항성 왕관',en:'Stellar Crown'},desc:{ko:'주기적으로 가까운 적들을 관통하는 별빛 광선.',en:'Periodically pierces nearby enemies with stellar rays.'}},
    aegis:{icon:'⬢',color:'#83ffd1',name:{ko:'공허의 가호',en:'Void Aegis'},desc:{ko:'주기적인 대형 보호막 충전.',en:'Periodically charges a powerful shield.'}},
    singularity:{icon:'◉',color:'#a98cff',name:{ko:'특이점 혈맥',en:'Singularity Vein'},desc:{ko:'15처치마다 탄환과 적의 시간을 늦추고 붕괴 파편을 방출하는 특이점 생성.',en:'Every 15 kills creates a singularity that slows shots and enemies, then bursts into collapse shards.'}},
    eclipse:{icon:'◒',color:'#ff76bd',name:{ko:'일식 동력로',en:'Eclipse Reactor'},desc:{ko:'상시 피해 +20%. 체력 50% 미만부터 추가 피해가 증가해 체력 30% 이하에서 총 최대 +50%.',en:'Permanent damage +20%. Bonus damage rises below 50% health and reaches a maximum total of +50% at or below 30% health.'}},
    chrono:{icon:'◎',color:'#8fffe0',name:{ko:'찰나의 꽃',en:'Chrono Bloom'},desc:{ko:'주기적으로 주변 적의 시간을 정지시키는 파동.',en:'Periodically releases a wave that halts nearby enemies.'}},
    harvest:{icon:'✦',color:'#ff9a9a',name:{ko:'별의 수확',en:'Star Harvest'},desc:{ko:'처치 시 체력 회복, 정예 처치 시 대량 회복.',en:'Restores health on kills and greatly on elite kills.'}}
  };
  const augmentDefs={
    core:{icon:'✷',color:'#eafcff',name:{ko:'항성 연사',en:'Stellar Volley'},desc:{ko:'일정 발사마다 방사형 광자탄 난사.',en:'Every few activations releases a radial photon volley.'}},
    blade:{icon:'◒',color:'#7ce8ff',name:{ko:'공간 절개',en:'Space Rend'},desc:{ko:'칼날 적중 시 짧은 간격으로 절단 폭발.',en:'Blade hits periodically create a cutting burst.'}},
    ember:{icon:'✦',color:'#ff7b9e',name:{ko:'연쇄 성화',en:'Chain Starfire'},desc:{ko:'별빛 폭발이 가까운 적 하나에게 추가 전이.',en:'Starlight explosions jump to one nearby enemy.'}},
    bulwark:{icon:'◈',color:'#74f2a7',name:{ko:'반사 장벽',en:'Reflective Barrier'},desc:{ko:'피격 시 주변으로 반격 광자탄 방출.',en:'Taking damage releases countering photon bolts.'}},
    gravity:{icon:'◉',color:'#9e79ff',name:{ko:'종말 붕괴',en:'Terminal Collapse'},desc:{ko:'중력 우물 소멸 시 강력한 붕괴 폭발.',en:'Gravity wells detonate when they expire.'}},
    comet:{icon:'⟐',color:'#b5f5ff',name:{ko:'혜성의 잔상',en:'Comet Afterimage'},desc:{ko:'혜성 창 발사 시 약한 추격 창 추가 발사.',en:'Comet lances launch a weaker trailing lance.'}},
    prism:{icon:'✧',color:'#c2a7ff',name:{ko:'과열 성선',en:'Overheat Starline'},desc:{ko:'최대 집속 시 표적 중심의 교차 광선 두 줄과 용광 폭발.',en:'At maximum focus, emits two crossing beams and a furnace burst from the target.'}},
    chrono:{icon:'◎',color:'#8fffe0',name:{ko:'시간 파쇄',en:'Time Fracture'},desc:{ko:'시간 파동에 걸린 적 처치 시 파쇄 폭발.',en:'Enemies killed while time-locked shatter in an explosion.'}},
    arc:{icon:'☾',color:'#69ffe0',name:{ko:'포식 궤도',en:'Predatory Orbit'},desc:{ko:'귀환 타격이 파편을 방출하고, 부메랑으로 처치하면 무작위 적에게 추가 도약.',en:'Return hits release shards, and boomerang kills leap to a random enemy.'}},
    ion:{icon:'⌁',color:'#72f2ff',name:{ko:'초전도 성좌망',en:'Superconductive Constellation'},desc:{ko:'첫 사슬 뒤에 약한 두 번째 사슬망이 즉시 전개.',en:'A weaker second chain network unfolds after the first cast.'}},
    nova:{icon:'✹',color:'#ffbd69',name:{ko:'역행 초신성',en:'Reversing Supernova'},desc:{ko:'외곽 폭발 뒤 중심으로 적을 당기는 지연 붕괴파.',en:'A delayed collapse wave pulls enemies inward after the outer blast.'}},
    drone:{icon:'⌁',color:'#8fffd0',name:{ko:'낙성 표식',en:'Falling-Star Mark'},desc:{ko:'편대가 가장 강한 표적에 지연 유성 타격을 호출.',en:'The squad calls a delayed meteor strike on the strongest target.'}},
    rail:{icon:'━',color:'#b7e7ff',name:{ko:'궤도 파쇄',en:'Orbital Fracture'},desc:{ko:'주포 궤도 위 세 지점이 잠시 뒤 연쇄 폭발.',en:'Three points along the rail path detonate in sequence.'}},
    spiral:{icon:'◎',color:'#e3a7ff',name:{ko:'역나선 은하',en:'Counter-Spiral Galaxy'},desc:{ko:'본 나선 뒤 반대 회전의 추적 나선이 한 차례 더 생성.',en:'A counter-rotating homing spiral follows the main galaxy.'}},
    mirror:{icon:'◇',color:'#9fffe7',name:{ko:'쌍면 반사',en:'Twin-Face Reflection'},desc:{ko:'반사한 적 탄환마다 추가 반사광 두 갈래를 방출.',en:'Every reflected enemy shot emits two additional counter rays.'}}
  };
  window.stackfallWeaponAugmentDefs=augmentDefs;


  const ECLIPSE_BASE_DAMAGE=.20,ECLIPSE_LOW_HEALTH_DAMAGE=.30,ECLIPSE_SURGE_START=.50,ECLIPSE_THRESHOLD=.30;
  function eclipseDamageBonus(){if(!state.bossTraits?.eclipse)return 0;const ratio=clamp(player.hp/Math.max(1,player.maxHp),0,1),surge=clamp((ECLIPSE_SURGE_START-ratio)/(ECLIPSE_SURGE_START-ECLIPSE_THRESHOLD),0,1);return ECLIPSE_BASE_DAMAGE+ECLIPSE_LOW_HEALTH_DAMAGE*surge;}
  window.stackfallEclipseDamageBonus=eclipseDamageBonus;

  const weaponSpecialDefs={
    overcharge:{icon:'▲',color:'#ff8aa8',max:5,name:{ko:'과충전 회로',en:'Overcharge Circuit'},desc:{ko:'이 무기의 피해가 중첩당 12% 증가.',en:'This weapon deals 12% more damage per stack.'}},
    cycle:{icon:'»',color:'#7ce8ff',max:5,name:{ko:'주기 재편',en:'Cycle Refit'},desc:{ko:'이 무기의 공격 주기가 중첩당 7% 단축.',en:'This weapon attacks 7% faster per stack.'}},
    elite:{icon:'◆',color:'#ffd071',max:4,name:{ko:'정예 파쇄',en:'Elite Breaker'},desc:{ko:'이 무기가 중간보스·보스·초월체에게 주는 피해가 중첩당 15% 증가.',en:'This weapon deals 15% more damage per stack to minibosses, bosses and apex enemies.'}},
    opening:{icon:'✧',color:'#bca8ff',max:4,name:{ko:'초동 폭압',en:'Opening Pressure'},desc:{ko:'체력 80% 이상인 적에게 이 무기가 주는 피해가 중첩당 18% 증가.',en:'This weapon deals 18% more damage per stack to enemies above 80% health.'}},
    recycle:{icon:'↻',color:'#89f0c8',max:4,name:{ko:'회수 루프',en:'Recycle Loop'},desc:{ko:'이 무기로 처치할 때 다음 공격 대기시간이 중첩당 0.22초 감소.',en:'Kills with this weapon reduce its next attack wait by 0.22 seconds per stack.'}}
  };
  window.stackfallWeaponSpecialDefs=weaponSpecialDefs;
  const weaponCooldownProps={core:['coreCd'],blade:['bladeTick'],ember:['emberCd'],bulwark:['bulwarkCd','fortressCd'],gravity:['wellCd'],comet:['cometCd'],prism:['prismCd'],chrono:['chronoCd'],arc:['arcCd'],ion:['ionCd'],nova:['novaCd'],drone:['droneCd'],rail:['railCd'],spiral:['spiralCd'],mirror:['mirrorCd']};
  function weaponSpecialStack(key,branch){return Math.max(0,Number(state.weaponSpecialStacks?.[key]?.[branch])||0);}
  function weaponCycleMultiplier(key){return Math.max(.45,1-weaponSpecialStack(key,'cycle')*.07);}
  window.weaponCycleMultiplier=weaponCycleMultiplier;window.stackfallWeaponSpecialStack=weaponSpecialStack;
  function weaponSourceKey(source){const s=String(source||'').toLowerCase();if(!s)return null;if(s.includes('core'))return'core';if(s.includes('blade')||s==='wave')return'blade';if(s.includes('ember')||s.includes('echo-star')||s.includes('star-spark'))return'ember';if(s.includes('bulwark')||s.includes('barrier-lance'))return'bulwark';if(s.includes('gravity')||s==='well')return'gravity';if(s.includes('comet'))return'comet';if(s.includes('prism'))return'prism';if(s.includes('chrono'))return'chrono';if(s.startsWith('arc')||s.includes('boomerang'))return'arc';if(s.includes('ion'))return'ion';if(s.includes('nova'))return'nova';if(s.includes('drone')||s.includes('meteor'))return'drone';if(s.includes('rail'))return'rail';if(s.includes('spiral'))return'spiral';if(s.includes('mirror')||s.includes('reflect'))return'mirror';return null;}
  window.stackfallWeaponSourceKey=weaponSourceKey;
  function weaponSpecialEffectText(branch,stack,language=lang()){const n=Math.max(0,Number(stack)||0),ko=language==='ko';if(branch==='overcharge')return ko?`이 무기 피해 +${n*12}%`:`This weapon damage +${n*12}%`;if(branch==='cycle')return ko?`이 무기 공격 주기 ${n*7}% 단축`:`This weapon attack interval -${n*7}%`;if(branch==='elite')return ko?`정예 대상 피해 +${n*15}%`:`Elite target damage +${n*15}%`;if(branch==='opening')return ko?`체력 80% 이상 대상 피해 +${n*18}%`:`Damage to targets above 80% health +${n*18}%`;if(branch==='recycle')return ko?`처치 시 다음 공격 대기시간 ${(n*.22).toFixed(2)}초 감소`:`Kills reduce the next attack wait by ${(n*.22).toFixed(2)}s`;return'';}
  window.stackfallWeaponSpecialEffectText=weaponSpecialEffectText;
  function weaponSpecialDamageMultiplier(key,enemy){if(!key)return 1;let mult=1+weaponSpecialStack(key,'overcharge')*.12;const elite=enemy&&(enemy.type==='mini'||enemy.type==='boss'||enemy.kind==='apex');if(elite)mult*=1+weaponSpecialStack(key,'elite')*.15;if(enemy&&enemy.maxHp>0&&enemy.hp/enemy.maxHp>=.80)mult*=1+weaponSpecialStack(key,'opening')*.18;return mult;}
  function adjustWeaponCooldown(key,seconds){if(!key||seconds<=0)return;for(const prop of weaponCooldownProps[key]||[])if(Number.isFinite(player[prop]))player[prop]=Math.max(0,player[prop]-seconds);if(key==='prism')for(const lock of player.prismLocks||[])if(Number.isFinite(lock?.tick))lock.tick=Math.min(lock.tick,Math.max(0,lock.tick-seconds));}
  function accelerateWeaponCycles(dt){for(const key of Object.keys(state.weaponSpecialStacks||{})){const mult=weaponCycleMultiplier(key);if(mult>=.999)continue;adjustWeaponCooldown(key,dt*(1/mult-1));}}
  function applyWeaponRecycle(key){const stacks=weaponSpecialStack(key,'recycle');if(stacks)adjustWeaponCooldown(key,stacks*.22);}
  function ownedWeaponKeys(){const keys=['core'];for(const key of Object.keys(state.weaponStacks||{}))if(weaponCount(key)>0&&!keys.includes(key))keys.push(key);return keys.filter(key=>key==='core'||WEAPONS[key]);}

  state.bossTraits=state.bossTraits||{};state.weaponAugments=state.weaponAugments||{};state.weaponSpecialStacks=state.weaponSpecialStacks||{};state.rewardQueue=state.rewardQueue||[];let rewardChoiceLocked=false,pendingApexBundle=null;
  const rrReset=resetGame;resetGame=function(){rrReset();state.bossTraits={};state.weaponAugments={};state.weaponSpecialStacks={};state.rewardQueue=[];state.rewardTimers={stellar:6,aegis:8,chrono:7};state.rewardKills=0;rewardChoiceLocked=false;player.strongBladeBurstReadyAt=0;rewardScreen.classList.add('hidden');apexRewardScreen.classList.add('hidden');};
  const rrShowMenu=showMainMenu;showMainMenu=function(){rewardScreen.classList.add('hidden');apexRewardScreen.classList.add('hidden');state.rewardQueue=[];rewardChoiceLocked=false;player.strongBladeBurstReadyAt=0;return rrShowMenu();};
  const rrEnd=endGame;endGame=function(){rewardScreen.classList.add('hidden');apexRewardScreen.classList.add('hidden');state.rewardQueue=[];return rrEnd();};

  function rewardOptionPool(){
    const pool=[];for(const [key,d]of Object.entries(traitDefs))if(!state.bossTraits[key])pool.push({kind:'trait',key,...d});
    for(const key of ownedWeaponKeys()){if(augmentDefs[key]&&!state.weaponAugments[key])pool.push({kind:'augment',key,...augmentDefs[key]});for(const[branch,d]of Object.entries(weaponSpecialDefs)){const current=weaponSpecialStack(key,branch);if(current<d.max)pool.push({kind:'weaponSpecial',key,branch,current,next:current+1,...d});}}return pool;
  }
  function chooseRewards(){
    const pool=rewardOptionPool(),traits=pool.filter(x=>x.kind==='trait').sort(()=>Math.random()-.5),weapons=pool.filter(x=>x.kind!=='trait').sort(()=>Math.random()-.5),out=[];while(out.length<3&&weapons.length)out.push(weapons.pop());if(out.length<4&&traits.length)out.push(traits.pop());const rest=[...weapons,...traits].sort(()=>Math.random()-.5);while(out.length<4&&rest.length)out.push(rest.pop());return out;
  }
  function tryOpenReward(){
    if(!state.rewardQueue.length)return;
    if(state.mode!=='playing')return;
    const choices=chooseRewards();if(!choices.length){state.rewardQueue.shift();return;}
    if(typeof closeAbilityLedger==='function')closeAbilityLedger(true);
    rewardChoiceLocked=false;state.mode='bossReward';ui.touch.classList.add('hidden');rewardScreen.classList.remove('hidden');
    document.querySelector('#rewardKicker').textContent=tr('boss.warning');document.querySelector('#rewardTitle').textContent=tr('reward.title');document.querySelector('#rewardPrompt').textContent=tr('reward.prompt');
    const cards=document.querySelector('#rewardCards');cards.innerHTML='';
    for(const option of choices){const card=document.createElement('button'),special=option.kind==='weaponSpecial',weaponName=special?(option.key==='core'?(lang()==='ko'?'코어 펄스':'Core Pulse'):weaponText(option.key).name):'';card.className='reward-card';if(option.kind==='trait')card.dataset.traitKey=option.key;else if(special){card.dataset.specialWeapon=option.key;card.dataset.specialBranch=option.branch;}else card.dataset.augmentKey=option.key;card.style.setProperty('--reward-color',option.color);card.style.setProperty('--reward-glow',hexToRgba(option.color,.22));const title=special?`${weaponName} · ${pick(option.name)}`:pick(option.name),desc=special?`${pick(option.desc)} ${weaponSpecialEffectText(option.branch,option.next)}`:pick(option.desc);
      card.innerHTML=`<span class="reward-type">${tr(option.kind==='trait'?'reward.passive':'reward.augment')}</span><div class="reward-icon">${option.icon}</div><h3>${title}</h3><p>${desc}</p>`;
      card.onclick=()=>{if(rewardChoiceLocked||state.mode!=='bossReward')return;rewardChoiceLocked=true;for(const button of cards.querySelectorAll('button'))button.disabled=true;if(option.kind==='trait')state.bossTraits[option.key]=true;else if(special){const row=state.weaponSpecialStacks[option.key]||(state.weaponSpecialStacks[option.key]={});row[option.branch]=Math.min(option.max,(row[option.branch]||0)+1);}else state.weaponAugments[option.key]=true;state.rewardQueue.shift();rewardScreen.classList.add('hidden');state.mode='playing';if(matchMedia('(pointer:coarse)').matches||innerWidth<760)ui.touch.classList.remove('hidden');audio.resonance();renderLoadout();updateHUD();};cards.appendChild(card);}
  }
  window.updateRewardQueue=tryOpenReward;
  function planApexPassiveRewards(total=3){const planned={},entries=[];for(let i=0;i<total;i++){const eligible=Object.keys(PASSIVES).filter(key=>(planned[key]??stat(key))<PASSIVES[key].max);if(!eligible.length)break;const fresh=eligible.filter(key=>!entries.some(entry=>entry.key===key)),pool=fresh.length?fresh:eligible,key=pool[Math.floor(Math.random()*pool.length)],before=planned[key]??stat(key),after=before+1;planned[key]=after;const existing=entries.find(entry=>entry.key===key);if(existing)existing.after=after;else entries.push({key,before,after});}return entries;}
  function applyApexPassivePlan(entries){for(const entry of entries)while(stat(entry.key)<entry.after)applyMiniRewardPassive(entry.key);}
  function apexLegacyPreview(form){if(form==='chronophage')return'시간 정지 유산 · 가속 회로 +2중첩';if(form==='starforge')return'항성 폭발 유산 · 출력 증폭 +2중첩 · 광자 팽창 +1중첩';return'성좌 방벽 유산 · 충격 흡수재 +1중첩 · 최대 체력 강화';}
  window.openApexRewardSelection=function(form){if(state.mode==='gameover'||state.mode==='menu')return;closeAbilityLedger?.(true);const colors={chronophage:'#79ffe1',starforge:'#ffb04e',lastconstellation:'#b7c9ff'},color=colors[form]||'#fff2a6',cards=document.querySelector('#apexRewardCards'),confirm=document.querySelector('#apexRewardConfirmBtn'),passives=planApexPassiveRewards(3);pendingApexBundle={form,passives,claimed:false};state.mode='apexReward';ui.touch.classList.add('hidden');apexRewardScreen.style.setProperty('--apex-color',color);document.querySelector('#apexRewardTitle').textContent=bossName(form)+' 전리품';document.querySelector('#apexRewardPrompt').textContent='세 보상이 모두 지급됩니다. 내용을 충분히 확인한 뒤 모두 받기를 누르세요.';cards.innerHTML='';const passiveDesc=passives.length?passives.map(entry=>`${passiveText(entry.key).name} ${entry.before}→${entry.after}중첩`).join(' · '):'모든 패시브가 최대치여서 최대 체력 +8%로 전환됩니다.';const rewards=[{icon:'✶',name:'고유 유산 계승',desc:apexLegacyPreview(form)},{icon:'◆',name:'패시브 공명',desc:passiveDesc},{icon:'⬢',name:'성체 재구축',desc:'최대 체력 +12% · 완전 회복 · 보호막 36'}];for(const reward of rewards){const card=document.createElement('article');card.className='apex-reward-card';card.style.setProperty('--apex-color',color);card.innerHTML='<span>'+reward.icon+'</span><h3>'+reward.name+'</h3><p>'+reward.desc+'</p>';cards.appendChild(card);}confirm.disabled=false;confirm.querySelector('span').textContent='모두 받기';confirm.onclick=()=>{const bundle=pendingApexBundle;if(!bundle||bundle.claimed||state.mode!=='apexReward')return;bundle.claimed=true;confirm.disabled=true;applyApexReward(bundle.form);if(bundle.passives.length)applyApexPassivePlan(bundle.passives);else{const before=player.maxHp;player.maxHp=Math.max(before+1,Math.round(before*1.08));player.hp+=player.maxHp-before;}player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.12));player.hp=player.maxHp;player.shield=Math.max(player.shield,36);pendingApexBundle=null;apexRewardScreen.classList.add('hidden');state.mode='playing';if(matchMedia('(pointer:coarse)').matches||innerWidth<760)ui.touch.classList.remove('hidden');audio.resonance();renderLoadout();updateHUD();};apexRewardScreen.classList.remove('hidden');};

  function applyMiniRewardPassive(key){
    state.passives[key]=stat(key)+1;
    if(key==='vitality'){player.maxHp+=24;player.hp=Math.min(player.maxHp,player.hp+36);}
    if(key==='stellarLife'){const ratio=player.hp/Math.max(1,player.maxHp);player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.10));player.hp=Math.max(1,Math.round(player.maxHp*ratio));}
  }
  function grantMinibossReward(){
    const weapons=Object.keys(state.weaponStacks||{}).filter(key=>weaponCount(key)>0&&weaponCount(key)<6),passives=Object.keys(PASSIVES).filter(key=>stat(key)<PASSIVES[key].max);
    const useWeapon=weapons.length&&(!passives.length||Math.random()<.45);
    let title='정예 전리품',desc='';
    if(useWeapon){const key=weapons[Math.floor(Math.random()*weapons.length)],next=weaponCount(key)+1;state.weaponStacks[key]=next;if(key!=='core'&&!state.weaponSlots.includes(key))state.weaponSlots.push(key);title=weaponText(key).name;desc=stackEffectText(key,next)?.desc||'장비 중첩 증가.';}
    else if(passives.length){const key=passives[Math.floor(Math.random()*passives.length)];applyMiniRewardPassive(key);title=passiveText(key).name;desc=passiveText(key).desc;}
    else{player.shield=Math.max(player.shield,18);desc='보호막 충전.';}
    const kicker=document.querySelector('#resonanceKicker');if(kicker)kicker.textContent='중간보스 자동 보상';ui.resonanceTitle.textContent=title;ui.resonanceDesc.textContent=desc;ui.resonance.classList.remove('hidden');scheduleUiAction(4800,()=>ui.resonance.classList.add('hidden'));audio.pickup();renderLoadout();updateHUD();
  }

  const rrKill=killEnemy;killEnemy=function(enemy,opts={}){
    const wasAlive=enemy&&!enemy.dead,elite=enemy&&(enemy.type==='boss'||enemy.type==='mini'),x=enemy?.x||0,y=enemy?.y||0,locked=enemy?.timeLock>0,before=state.rewardQueue?.length||0,weaponKey=weaponSourceKey(opts.source);
    rrKill(enemy,opts);if(wasAlive&&enemy?.dead&&weaponKey)applyWeaponRecycle(weaponKey);
    if(state.bossTraits.harvest){const heal=elite?Math.ceil(player.maxHp*.25):1;player.hp=Math.min(player.maxHp,player.hp+heal);}
    if(state.bossTraits.singularity){state.rewardKills=(state.rewardKills||0)+1;if(state.rewardKills%15===0)state.entities.wells.push({x,y,r:138,life:3.4,max:3.4,strength:760,damage:22,tick:0,color:'#e65cff',kind:'trait-singularity',traitCollapse:true,distortionCd:0});}
    if(state.weaponAugments.chrono&&locked)areaDamage(x,y,72,16+weaponCount('chrono')*3,COLORS.chrono,'chrono-burst');
    if(elite){const suppress=enemy?.kind==='apex'||enemy?.eventKind==='void'||enemy?.noEliteReward===true;if(suppress||enemy?.type==='mini')state.rewardQueue.splice(before);else if((state.rewardQueue?.length||0)===before)state.rewardQueue.push(enemy.type);if(!suppress&&enemy?.type==='mini')grantMinibossReward();}
  };

  const rrUpdateWeapons=updateWeapons;updateWeapons=function(dt){
    rrUpdateWeapons(dt);if(state.mode!=='playing')return;accelerateWeaponCycles(dt);
    state.rewardTimers=state.rewardTimers||{stellar:6,aegis:8,chrono:7};
    if(state.bossTraits.stellar){state.rewardTimers.stellar-=dt;if(state.rewardTimers.stellar<=0){state.rewardTimers.stellar=7.5;const targets=nearestEnemies(player.x,player.y,6);for(const e of targets){dealDamage(e,32+state.level*1.5,{color:'#ffe49a',source:'stellar-crown'});state.entities.beams.push({x1:player.x,y1:player.y,x2:e.x,y2:e.y,life:.22,max:.22,color:'#ffe49a',width:2.6});}}}
    if(state.bossTraits.aegis){state.rewardTimers.aegis-=dt;if(state.rewardTimers.aegis<=0){state.rewardTimers.aegis=10;player.shield=Math.min(60,player.shield+18);shockwave(player.x,player.y,'#83ffd1',120,.42,4);}}
    if(state.bossTraits.chrono){state.rewardTimers.chrono-=dt;if(state.rewardTimers.chrono<=0){state.rewardTimers.chrono=9;shockwave(player.x,player.y,'#8fffe0',220,.55,4);for(const e of state.entities.enemies)if(!e.dead&&e.kind!=='apex'&&Math.hypot(e.x-player.x,e.y-player.y)<220)e.timeLock=Math.max(e.timeLock||0,e.type==='boss'?.55:1.35);}}
  };

  const rrDeal=dealDamage;let chainGuard=false,bladeGuard=false,augmentBurstGuard=false;
  dealDamage=function(enemy,amount,opts={}){
    const wasAlive=enemy&&!enemy.dead,source=opts.source||'',locked=enemy?.timeLock>0,x=enemy?.x||0,y=enemy?.y||0,weaponKey=weaponSourceKey(source);amount*=1+eclipseDamageBonus();amount*=weaponSpecialDamageMultiplier(weaponKey,enemy);rrDeal(enemy,amount,opts);
    if(!wasAlive||augmentBurstGuard)return;
    const gameTime=state.time||0;
    if(state.weaponAugments.blade&&source==='blade'&&!bladeGuard&&gameTime>=(player.strongBladeBurstReadyAt||0)){player.strongBladeBurstReadyAt=gameTime+.43;bladeGuard=true;augmentBurstGuard=true;areaDamage(x,y,88*weaponSizeMultiplier(),18+weaponCount('blade')*4.5,COLORS.cyan,'blade-burst');augmentBurstGuard=false;bladeGuard=false;}
    if(state.weaponAugments.ember&&(source==='ember'||source==='echo-star')&&!chainGuard){const targets=nearestEnemies(x,y,4,new Set([enemy.id])).slice(0,2);chainGuard=true;for(const [i,target]of targets.entries()){rrDeal(target,amount*(i?.30:.42),{color:'#ff9aba',source:'ember-strong-chain',canCrit:false});state.entities.beams.push({x1:x,y1:y,x2:target.x,y2:target.y,life:.17,max:.17,color:'#ff9aba',width:2.1*weaponSizeMultiplier()});}chainGuard=false;}
    if(state.weaponAugments.arc&&source==='arc-return'){for(let i=-2;i<=2;i++){const target=nearestEnemy(x,y);if(!target)break;const a=Math.atan2(target.y-y,target.x-x)+i*.24;spawnPlayerProjectile({x,y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:4.2,life:.82,damage:amount*.31,color:'#c8fff1',pierce:1,source:'arc-strong-shard'});}}
    if(state.weaponAugments.chrono&&locked&&enemy.dead){augmentBurstGuard=true;areaDamage(x,y,118*weaponSizeMultiplier(),24+weaponCount('chrono')*4.2,COLORS.chrono,'chrono-burst');augmentBurstGuard=false;}
  };

  const rrHurt=hurtPlayer;hurtPlayer=function(amount,source){rrHurt(amount,source);if(!state.weaponAugments?.bulwark||state.mode==='gameover')return;const n=Math.max(1,weaponCount('bulwark'));player.shield=Math.min(58+n*8,player.shield+5+n*1.5);for(let i=0;i<4;i++){const a=i*TAU/4+Math.PI/4;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*455,vy:Math.sin(a)*455,r:5.2,life:1.0,damage:18+n*4,color:'#b5ffe5',pierce:2,source:'barrier-lance'});}};
  const rrSpawnCore=spawnCoreShot;spawnCoreShot=function(target,echoed=false){
    rrSpawnCore(target,echoed);
    if(state.weaponAugments.core&&!echoed&&player.coreVolley%5===0){
      for(let i=0;i<10;i++){const a=i*TAU/10;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:4.2,life:.9,damage:10+weaponCount('core')*2.2,color:'#eafcff',pierce:1,source:'core-nova'});}
      shockwave(player.x,player.y,'#eafcff',105,.32,3);
    }
  };

  const rrUpdateWells=updateWells;updateWells=function(dt){
    const gravityExpiring=state.entities.wells.filter(w=>w.rewardBurst&&!w.strongRewardBurstDone&&w.life<=dt+.035),singularityExpiring=state.entities.wells.filter(w=>w.traitCollapse&&!w.traitCollapseDone&&w.life<=dt+.035),singularities=state.entities.wells.filter(w=>w.kind==='trait-singularity'&&w.life>0);
    for(const w of singularities){w.distortionCd=(w.distortionCd??0)-dt;const radius=w.r*1.08;for(const p of state.entities.enemyProjectiles){if(!p||p.life<=0)continue;if((p.x-w.x)**2+(p.y-w.y)**2<radius*radius){const slow=Math.pow(.18,dt);p.vx*=slow;p.vy*=slow;}}for(const e of state.entities.enemies)if(!e.dead&&e.kind!=='apex'&&(e.x-w.x)**2+(e.y-w.y)**2<(w.r*.86+e.r)**2)e.timeLock=Math.max(e.timeLock||0,.18);if(w.distortionCd<=0){w.distortionCd=.62;shockwave(w.x,w.y,'#ef9cff',w.r*.74,.26,1.4);}}
    rrUpdateWells(dt);
    for(const w of gravityExpiring){w.strongRewardBurstDone=true;areaDamage(w.x,w.y,195*weaponSizeMultiplier(),34+weaponCount('gravity')*7,COLORS.violet,'gravity-collapse');shockwave(w.x,w.y,'#e8d9ff',245*weaponSizeMultiplier(),.58,5);}
    for(const w of singularityExpiring){w.traitCollapseDone=true;for(const p of state.entities.enemyProjectiles)if((p.x-w.x)**2+(p.y-w.y)**2<(w.r*1.25)**2)p.life=0;areaDamage(w.x,w.y,w.r*1.08,34+state.level*.9,'#e65cff','trait-singularity-collapse');for(let i=0;i<8;i++){const a=i*TAU/8;spawnPlayerProjectile({x:w.x,y:w.y,vx:Math.cos(a)*390,vy:Math.sin(a)*390,r:4.8,life:.9,maxRange:330,damage:13+state.level*.45,color:'#f2b1ff',pierce:1,source:'singularity-shard'});}}
  };

  applyLanguage();renderStarterOptions();renderLoadout();
})();
