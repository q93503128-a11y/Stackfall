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
    ['성광 피막','받는 피해를 줄이고 보호막을 천천히 충전한다.'],
    ['겹빛 장벽','최대 체력과 피해 감소, 보호막 충전이 강화된다.'],
    ['재충전 장벽','보호막 용량과 충전량이 증가한다.'],
    ['보복 파동','피격 시 주변 적을 밀어내는 반격 파동.'],
    ['요새 장막','보호막 용량과 충전이 크게 강화된다.'],
    ['천체 성벽','보호막 충전이 빨라지고 강한 추가 충전이 생긴다.']
  ];
  STACK_EFFECTS_EN.bulwark=['Radiant Film','Layered Barrier','Recharge Barrier','Retaliation Wave','Fortress Veil','Celestial Wall'];
  STACK_DESC_EN.bulwark=['Reduces incoming damage and slowly restores shield.','Improves max health, damage reduction, and shield recharge.','Increases shield capacity and recharge amount.','Taking damage releases a repelling counter wave.','Greatly improves shield capacity and recharge.','Recharges faster and gains a strong extra shield charge.'];
  STACK_EFFECTS_JA.bulwark=['星光皮膜','重光障壁','再充填障壁','報復波動','要塞帳幕','天体城壁'];
  STACK_DESC_JA.bulwark=['被ダメージを軽減し、シールドをゆっくり回復する。','最大HP・軽減率・シールド回復が強化される。','シールド容量と回復量が増える。','被弾時に周囲を押し返す反撃波。','シールド容量と回復が大きく強化される。','回復が速くなり、強力な追加充填が発生する。'];
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
    .reward-card{min-height:208px;text-align:left;color:#f6f8ff;border-radius:21px;padding:19px;cursor:pointer;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.14);background:linear-gradient(145deg,rgba(28,34,72,.98),rgba(7,10,27,.99));box-shadow:0 22px 58px rgba(0,0,0,.42);transition:.18s}
    .reward-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 0%,var(--reward-glow),transparent 48%)}.reward-card:hover{transform:translateY(-6px);border-color:var(--reward-color)}
    .reward-card>*{position:relative}.reward-card .reward-type{font-size:9px;font-weight:900;letter-spacing:.14em;color:var(--reward-color)}.reward-card .reward-once{position:absolute;right:14px;top:13px;padding:4px 7px;border:1px solid color-mix(in srgb,var(--reward-color) 42%,transparent);background:rgba(3,6,18,.72);color:#dce8ff;font-size:8px;font-weight:900;letter-spacing:.06em}.reward-card .reward-icon{font-size:38px;margin:20px 0 13px;color:var(--reward-color);text-shadow:0 0 24px var(--reward-color)}
    .reward-card h3{font-size:21px;margin:0 0 8px}.reward-card p{margin:0;color:#abb5d3;font-size:12px;line-height:1.65}
    @media(max-width:1040px){.reward-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:720px){.reward-cards{grid-template-columns:1fr;max-height:65vh;overflow:auto}.reward-card{min-height:155px}.reward-card .reward-icon{margin:14px 0;font-size:34px}}
  `;document.head.appendChild(rewardStyle);
  const rewardThemeStyle=document.createElement('style');rewardThemeStyle.textContent=`
    .reward-shell{position:relative;padding:28px;border:1px solid rgba(210,222,255,.18);clip-path:polygon(0 18px,18px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 18px),calc(100% - 18px) 100%,18px 100%,0 calc(100% - 18px));background:radial-gradient(circle at 50% 0%,rgba(135,116,255,.15),transparent 42%),linear-gradient(155deg,rgba(14,19,48,.97),rgba(3,5,16,.99));box-shadow:0 38px 120px rgba(0,0,0,.68),inset 0 0 90px rgba(120,130,255,.06)}
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
    core:{icon:'✷',color:'#eafcff',name:{ko:'항성 연사',en:'Stellar Volley'},desc:{ko:'4번째 발사마다 전방위 광자탄을 방출하고, 코어 적중 누적 시 다른 적에게 굴절 펄스가 도약한다.',en:'Every fourth volley fires photons in all directions, while repeated core hits ricochet a refracted pulse to another enemy.'}},
    blade:{icon:'◒',color:'#7ce8ff',name:{ko:'공간 절개',en:'Space Rend'},desc:{ko:'칼날 적중 지점에 짧은 재사용 대기시간의 절개 폭발이 생기며, 적중 누적 시 관통 절단파를 발사한다.',en:'Blade hits create cooldown-limited rending bursts, and repeated hits release a piercing shear wave.'}},
    ember:{icon:'✦',color:'#ff7b9e',name:{ko:'연쇄 성화',en:'Chain Starfire'},desc:{ko:'별빛 탄환이 주변 적 둘에게 불꽃을 전이하고, 같은 적을 반복 타격하면 잔광 연소가 세 차례 이어진다.',en:'Starlight jumps fire to two nearby enemies, while repeated hits ignite three delayed afterburn ticks.'}},
    bulwark:{icon:'◈',color:'#74f2a7',name:{ko:'반사 장벽',en:'Reflective Barrier'},desc:{ko:'피격 시 반격 창을 발사하고 보호막을 추가 충전한다.',en:'Taking damage fires counter lances and restores additional shield.'}},
    gravity:{icon:'◉',color:'#9e79ff',name:{ko:'종말 붕괴',en:'Terminal Collapse'},desc:{ko:'모든 중력 우물이 사라질 때 넓은 붕괴 폭발을 일으켜 끌어모은 적을 한꺼번에 타격한다.',en:'Every gravity well detonates in a wide terminal collapse when it expires.'}},
    comet:{icon:'⟐',color:'#b5f5ff',name:{ko:'혜성 편대',en:'Comet Squadron'},desc:{ko:'혜성 창 발사 뒤 서로 다른 각도에서 추적하는 잔상 창 두 개가 시간차로 합류한다.',en:'Two delayed homing afterimage lances converge from different angles after every comet cast.'}},
    prism:{icon:'✧',color:'#c2a7ff',name:{ko:'과열 성선',en:'Overheat Starline'},desc:{ko:'집속 광선이 주변 적에게 굴절 도약한다.',en:'Focused beams ricochet to nearby enemies.'}},
    chrono:{icon:'◎',color:'#8fffe0',name:{ko:'시간 파쇄',en:'Time Fracture'},desc:{ko:'시간 봉쇄 중인 적은 추가 피해를 받고, 그 상태에서 처치되면 주변을 휩쓰는 파쇄 폭발을 일으킨다.',en:'Time-locked enemies take extra damage and shatter in an area explosion when killed.'}},
    arc:{icon:'☾',color:'#69ffe0',name:{ko:'포식 궤도',en:'Predatory Orbit'},desc:{ko:'귀환 타격이 관통 파편을 흩뿌리고, 부메랑으로 처치하면 살아 있는 다른 적에게 새 부메랑이 도약한다.',en:'Return hits scatter piercing shards, and boomerang kills launch a new boomerang toward another living enemy.'}},
    ion:{icon:'⌁',color:'#72f2ff',name:{ko:'초전도 성좌망',en:'Superconductive Constellation'},desc:{ko:'첫 이온 사슬이 끝난 직후 약한 두 번째 사슬망이 전개되어 별도의 적 무리를 다시 연결한다.',en:'A weaker second ion network unfolds immediately after the first chain to reconnect another group.'}},
    nova:{icon:'✹',color:'#ffbd69',name:{ko:'역행 초신성',en:'Reversing Supernova'},desc:{ko:'가까운 표적 위치에 지연 붕괴점을 만들고 적을 중심으로 끌어당긴 뒤 압축 폭발을 일으킨다.',en:'Creates a delayed collapse at a nearby target, pulls enemies inward, then detonates the compressed group.'}},
    drone:{icon:'⌁',color:'#8fffd0',name:{ko:'낙성 표식',en:'Falling-Star Mark'},desc:{ko:'편대가 사격할 때 가장 체력이 높은 적에게 표식을 남기고 잠시 뒤 유성 폭격을 호출한다.',en:'Each squad attack marks the strongest enemy and calls a delayed meteor strike.'}},
    rail:{icon:'━',color:'#b7e7ff',name:{ko:'궤도 파쇄',en:'Orbital Fracture'},desc:{ko:'주포가 지나간 경로의 세 지점이 순서대로 폭발해 광선 뒤에 연쇄 파쇄 지대를 만든다.',en:'Three points along the rail path detonate in sequence, leaving a chain of fractures behind the beam.'}},
    spiral:{icon:'◎',color:'#e3a7ff',name:{ko:'역나선 은하',en:'Counter-Spiral Galaxy'},desc:{ko:'본 나선 뒤 반대 회전의 추적 나선이 한 차례 더 생성되고, 나선 적중 누적 시 중력 매듭이 폭발한다.',en:'A counter-rotating homing spiral follows the main galaxy, while repeated spiral hits detonate gravity knots.'}},
    mirror:{icon:'◇',color:'#9fffe7',name:{ko:'쌍면 반사',en:'Twin-Face Reflection'},desc:{ko:'반사한 적 탄환마다 두 갈래 반사광을 추가 발사하고, 반사 공격이 적중할 때마다 보호막을 충전한다.',en:'Every reflected shot emits two extra counter rays, and reflection hits recharge shield.'}},
    vacuum:{icon:'✺',color:'#d58cff',name:{ko:'포식 꽃가루',en:'Devouring Pollen'},desc:{ko:'개화 직전 일반 적 탄환을 최대 8발 흡수한다. 탄환마다 최종 폭발 피해 +6%, 반경 +2.5%.',en:'Before blooming, absorbs up to 8 ordinary enemy shots. Each absorbed shot adds 6% final damage and 2.5% radius.'}},
    mine:{icon:'◆',color:'#74e8ff',name:{ko:'잔상 기뢰',en:'Afterimage Mine'},desc:{ko:'일반 기뢰 폭발 시 근처 강적의 예상 위치에 58% 위력의 짧은 유령 기뢰를 투영한다.',en:'Normal mine explosions project a short-lived phantom mine at a nearby priority target for 58% power.'}},
    missile:{icon:'➤',color:'#ffb66e',name:{ko:'다탄두 성좌',en:'MIRV Constellation'},desc:{ko:'각 본체가 충돌 직전 주탄두 100% 피해를 유지한 채 34% 보조 탄두 2개를 추가 분리한다.',en:'Each missile keeps its 100% main-warhead damage and adds two 34% side warheads shortly before impact.'}},
    gate:{icon:'⬡',color:'#a9b7ff',name:{ko:'광자 교차전송',en:'Photon Crossfeed'},desc:{ko:'관문 근처를 지난 아군 투사체를 다음 관문에서 55% 위력으로 1회 복제한다. 복제품은 재복제되지 않는다.',en:'An allied projectile passing a gate can be copied once from the next gate at 55% damage; copies cannot recurse.'}}
  };
  window.stackfallWeaponAugmentDefs=Object.freeze(augmentDefs);

  const ECLIPSE_BASE_DAMAGE=.20,ECLIPSE_LOW_HEALTH_DAMAGE=.30,ECLIPSE_SURGE_START=.50,ECLIPSE_THRESHOLD=.30;
  function eclipseDamageBonus(){if(!state.bossTraits?.eclipse)return 0;const ratio=clamp(player.hp/Math.max(1,player.maxHp),0,1),surge=clamp((ECLIPSE_SURGE_START-ratio)/(ECLIPSE_SURGE_START-ECLIPSE_THRESHOLD),0,1);return ECLIPSE_BASE_DAMAGE+ECLIPSE_LOW_HEALTH_DAMAGE*surge;}
  window.stackfallEclipseDamageBonus=eclipseDamageBonus;
  function ownedWeaponKeys(){const keys=['core'];for(const key of Object.keys(state.weaponStacks||{}))if(weaponCount(key)>0&&!keys.includes(key))keys.push(key);return keys.filter(key=>key==='core'||WEAPONS[key]);}

  state.bossTraits=state.bossTraits||{};state.weaponAugments=state.weaponAugments||{};state.rewardQueue=state.rewardQueue||[];let rewardChoiceLocked=false,pendingApexBundle=null;
  const AEGIS_SHIELD_PROFILE=Object.freeze({cap:60,gain:18,interval:10});
  registerShieldCapacitySource('trait-aegis',()=>state.bossTraits?.aegis?AEGIS_SHIELD_PROFILE.cap:0);
  registerShieldCapacitySource('augment-bulwark',()=>state.weaponAugments?.bulwark?bulwarkAugmentShieldProfile(weaponCount('bulwark')).cap:0);
  registerShieldCapacitySource('augment-mirror',()=>state.weaponAugments?.mirror?mirrorAugmentShieldProfile(weaponCount('mirror')).cap:0);
  const rrReset=resetGame;resetGame=function(){rrReset();state.bossTraits={};state.weaponAugments={};state.rewardQueue=[];state.rewardTimers={stellar:6,aegis:8,chrono:7};state.rewardKills=0;rewardChoiceLocked=false;player.strongBladeBurstReadyAt=0;player.reflectBarrierRechargeReadyAt=0;rewardScreen.classList.add('hidden');apexRewardScreen.classList.add('hidden');};
  const rrShowMenu=showMainMenu;showMainMenu=function(){rewardScreen.classList.add('hidden');apexRewardScreen.classList.add('hidden');state.rewardQueue=[];rewardChoiceLocked=false;player.strongBladeBurstReadyAt=0;player.reflectBarrierRechargeReadyAt=0;return rrShowMenu();};
  const rrEnd=endGame;endGame=function(){rewardScreen.classList.add('hidden');apexRewardScreen.classList.add('hidden');state.rewardQueue=[];return rrEnd();};

  function rewardOptionPool(){
    const pool=[];for(const [key,d]of Object.entries(traitDefs))if(!state.bossTraits[key])pool.push({kind:'trait',key,...d});
    for(const key of ownedWeaponKeys())if(augmentDefs[key]&&!state.weaponAugments[key])pool.push({kind:'augment',key,...augmentDefs[key]});return pool;
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
    for(const option of choices){const card=document.createElement('button'),augment=option.kind==='augment',weaponName=augment?(option.key==='core'?(lang()==='ko'?'코어 펄스':'Core Pulse'):weaponText(option.key).name):'';card.className='reward-card';if(option.kind==='trait')card.dataset.traitKey=option.key;else card.dataset.augmentKey=option.key;card.style.setProperty('--reward-color',option.color);card.style.setProperty('--reward-glow',hexToRgba(option.color,.22));const title=augment?`${weaponName} · ${pick(option.name)}`:pick(option.name),desc=pick(option.desc);
      card.innerHTML=`<span class="reward-type">${tr(option.kind==='trait'?'reward.passive':'reward.augment')}</span>${augment?'<span class="reward-once">1회 한정 · 중첩 없음</span>':''}<div class="reward-icon">${option.icon}</div><h3>${title}</h3><p>${desc}</p>`;
      card.onclick=()=>{if(rewardChoiceLocked||state.mode!=='bossReward')return;rewardChoiceLocked=true;for(const button of cards.querySelectorAll('button'))button.disabled=true;if(option.kind==='trait')state.bossTraits[option.key]=true;else state.weaponAugments[option.key]=true;state.rewardQueue.shift();rewardScreen.classList.add('hidden');state.mode='playing';if(typeof compactDevice==='function'?compactDevice():innerWidth<760)ui.touch.classList.remove('hidden');audio.resonance();renderLoadout();updateHUD();};cards.appendChild(card);}
  }
  window.updateRewardQueue=tryOpenReward;
  function planApexPassiveRewards(total=3){const planned={},entries=[];for(let i=0;i<total;i++){const eligible=Object.keys(PASSIVES).filter(key=>stat(key)>0&&(planned[key]??stat(key))<PASSIVES[key].max);if(!eligible.length)break;const fresh=eligible.filter(key=>!entries.some(entry=>entry.key===key)),pool=fresh.length?fresh:eligible,key=pool[Math.floor(Math.random()*pool.length)],before=planned[key]??stat(key),after=before+1;planned[key]=after;const existing=entries.find(entry=>entry.key===key);if(existing)existing.after=after;else entries.push({key,before,after});}return entries;}
  function applyApexPassivePlan(entries){for(const entry of entries)while(stat(entry.key)<entry.after)applyMiniRewardPassive(entry.key);}
  function apexLegacyPreview(form){if(form==='chronophage')return'시간 탈취 · 적과 탄환 둔화 · 모든 장비 과가속 · 시간 파쇄';if(form==='starforge')return'미니어처 항성 · 추적 광선 · 방사형 관통탄 · 붕괴 폭발';return'살아 있는 성좌망 · 지속 절단 · 적 탄환 삭제 · 노드 포격';}
  function resetApexEquipmentCooldowns(){for(const key of['coreCd','emberCd','wellCd','fortressCd','cometCd','prismCd','chronoCd','arcCd','ionCd','novaCd','droneCd','railCd','spiralCd','mirrorCd'])if(Number.isFinite(player[key]))player[key]=Math.min(0,player[key]);}
  window.openApexRewardSelection=function(form){if(state.mode==='gameover'||state.mode==='menu')return;closeAbilityLedger?.(true);const colors={chronophage:'#79ffe1',starforge:'#ffb04e',lastconstellation:'#b7c9ff'},color=colors[form]||'#fff2a6',cards=document.querySelector('#apexRewardCards'),confirm=document.querySelector('#apexRewardConfirmBtn'),passives=planApexPassiveRewards(3);pendingApexBundle={form,passives,claimed:false};state.mode='apexReward';ui.touch.classList.add('hidden');apexRewardScreen.style.setProperty('--apex-color',color);document.querySelector('#apexRewardTitle').textContent=bossName(form)+' 전리품';document.querySelector('#apexRewardPrompt').textContent='세 보상이 모두 지급됩니다. 내용을 충분히 확인한 뒤 모두 받기를 누르세요.';cards.innerHTML='';const passiveDesc=passives.length?passives.map(entry=>`${passiveText(entry.key).name} ${entry.before}→${entry.after}중첩`).join(' · '):'모든 패시브가 최대치여서 최대 체력 +8%로 전환됩니다.';const rewards=[{icon:'✶',name:'고유 유산 계승',desc:apexLegacyPreview(form)},{icon:'◆',name:'패시브 공명',desc:passiveDesc},{icon:'✹',name:'초월 동력핵',desc:'최대 체력 +8% · 완전 회복 · 모든 장비 즉시 재점화 · 전장 붕괴파'}];for(const reward of rewards){const card=document.createElement('article');card.className='apex-reward-card';card.style.setProperty('--apex-color',color);card.innerHTML='<span>'+reward.icon+'</span><h3>'+reward.name+'</h3><p>'+reward.desc+'</p>';cards.appendChild(card);}confirm.disabled=false;confirm.querySelector('span').textContent='모두 받기';confirm.onclick=()=>{const bundle=pendingApexBundle;if(!bundle||bundle.claimed||state.mode!=='apexReward')return;bundle.claimed=true;confirm.disabled=true;applyApexReward(bundle.form);if(bundle.passives.length)applyApexPassivePlan(bundle.passives);else{const before=player.maxHp;player.maxHp=Math.max(before+1,Math.round(before*1.08));player.hp+=player.maxHp-before;}player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.08));player.hp=player.maxHp;resetApexEquipmentCooldowns();areaDamage(player.x,player.y,300,58+state.level*2.4,color,'apex-core-awakening');shockwave(player.x,player.y,'#fff4c7',380,.78,7);pendingApexBundle=null;apexRewardScreen.classList.add('hidden');state.mode='playing';if(typeof compactDevice==='function'?compactDevice():innerWidth<760)ui.touch.classList.remove('hidden');audio.resonance();renderLoadout();updateHUD();};apexRewardScreen.classList.remove('hidden');};

  function applyMiniRewardPassive(key){
    state.passives[key]=stat(key)+1;
    if(key==='vitality')applyStackfallVitalityGrowth(1);
    if(key==='stellarLife')applyStackfallStellarLifeGrowth(1);
  }
  function grantEliteGrowthReward(kickerText='중간보스 자동 보상'){
    const weapons=Object.keys(state.weaponStacks||{}).filter(key=>weaponCount(key)>0&&weaponCount(key)<6),passives=Object.keys(PASSIVES).filter(key=>stat(key)>0&&stat(key)<PASSIVES[key].max);
    const useWeapon=weapons.length&&(!passives.length||Math.random()<.45);
    let title='정예 전리품',desc='';
    if(useWeapon){const key=weapons[Math.floor(Math.random()*weapons.length)],next=weaponCount(key)+1;state.weaponStacks[key]=next;if(key!=='core'&&!state.weaponSlots.includes(key))state.weaponSlots.push(key);title=weaponText(key).name;desc=stackEffectText(key,next)?.desc||'장비 중첩 증가.';}
    else if(passives.length){const key=passives[Math.floor(Math.random()*passives.length)];applyMiniRewardPassive(key);title=passiveText(key).name;desc=passiveText(key).desc;}
    else{rechargeShield(18,18);desc='보호막 충전.';}
    const kicker=document.querySelector('#resonanceKicker');if(kicker)kicker.textContent=kickerText;ui.resonanceTitle.textContent=title;ui.resonanceDesc.textContent=desc;showTimedResonance(5200);audio.pickup();renderLoadout();updateHUD();
  }

  const rrKill=killEnemy;killEnemy=function(enemy,opts={}){
    const wasAlive=enemy&&!enemy.dead,elite=enemy&&(enemy.type==='boss'||enemy.type==='mini'),x=enemy?.x||0,y=enemy?.y||0,locked=enemy?.timeLock>0,before=state.rewardQueue?.length||0;
    rrKill(enemy,opts);window.stackfallPostRosterOnKill?.(enemy,opts);
    if(state.bossTraits.harvest){const heal=elite?Math.ceil(player.maxHp*.25):1;player.hp=Math.min(player.maxHp,player.hp+heal);}
    if(state.bossTraits.singularity){state.rewardKills=(state.rewardKills||0)+1;if(state.rewardKills%15===0)state.entities.wells.push({x,y,r:138,life:3.4,max:3.4,strength:760,damage:22,tick:0,color:'#e65cff',kind:'trait-singularity',traitCollapse:true,distortionCd:0});}
    if(state.weaponAugments.chrono&&locked)areaDamage(x,y,72,16+weaponCount('chrono')*3,COLORS.chrono,'chrono-burst');
    if(elite){
      const suppress=enemy?.kind==='apex'||enemy?.bossCategory==='apex'||enemy?.eventKind==='void'||enemy?.noEliteReward===true,specialUnlocked=window.stackfallIsFeatureUnlocked?.('special-ability')===true;
      if(suppress){state.rewardQueue.splice(before);}
      else if(enemy?.type==='mini'){state.rewardQueue.splice(before);grantEliteGrowthReward('중간보스 성장 보상');}
      else if(!specialUnlocked){state.rewardQueue.splice(before);grantEliteGrowthReward('보스 성장 보상');}
      else if((state.rewardQueue?.length||0)===before)state.rewardQueue.push(enemy.type);
    }
  };

  const rrUpdateWeapons=updateWeapons;updateWeapons=function(dt){
    rrUpdateWeapons(dt);if(state.mode!=='playing')return;
    state.rewardTimers=state.rewardTimers||{stellar:6,aegis:8,chrono:7};
    if(state.bossTraits.stellar){state.rewardTimers.stellar-=dt;if(state.rewardTimers.stellar<=0){state.rewardTimers.stellar=7.5;const targets=nearestEnemies(player.x,player.y,6);for(const e of targets){dealDamage(e,32+state.level*1.5,{color:'#ffe49a',source:'stellar-crown'});state.entities.beams.push({x1:player.x,y1:player.y,x2:e.x,y2:e.y,life:.22,max:.22,color:'#ffe49a',width:2.6});}}}
    if(state.bossTraits.aegis){state.rewardTimers.aegis-=dt;if(state.rewardTimers.aegis<=0){state.rewardTimers.aegis=AEGIS_SHIELD_PROFILE.interval;if(rechargeShield(AEGIS_SHIELD_PROFILE.gain,AEGIS_SHIELD_PROFILE.cap)>0)shockwave(player.x,player.y,'#83ffd1',120,.42,4);}}
    if(state.bossTraits.chrono){state.rewardTimers.chrono-=dt;if(state.rewardTimers.chrono<=0){state.rewardTimers.chrono=9;shockwave(player.x,player.y,'#8fffe0',220,.55,4);for(const e of state.entities.enemies)if(!e.dead&&e.kind!=='apex'&&Math.hypot(e.x-player.x,e.y-player.y)<220)e.timeLock=Math.max(e.timeLock||0,e.type==='boss'?.55:1.35);}}
  };

  const rrDeal=dealDamage;let chainGuard=false,bladeGuard=false,augmentBurstGuard=false;
  dealDamage=function(enemy,amount,opts={}){
    const wasAlive=enemy&&!enemy.dead,source=opts.source||'',locked=enemy?.timeLock>0,x=enemy?.x||0,y=enemy?.y||0;amount*=1+eclipseDamageBonus();rrDeal(enemy,amount,opts);
    if(!wasAlive||augmentBurstGuard)return;
    const gameTime=state.time||0;
    if(state.weaponAugments.blade&&source==='blade'&&!bladeGuard&&gameTime>=(player.strongBladeBurstReadyAt||0)){player.strongBladeBurstReadyAt=gameTime+.43;bladeGuard=true;augmentBurstGuard=true;areaDamage(x,y,88*weaponSizeMultiplier(),18+weaponCount('blade')*4.5,COLORS.cyan,'blade-burst');augmentBurstGuard=false;bladeGuard=false;}
    if(state.weaponAugments.ember&&(source==='ember'||source==='echo-star')&&!chainGuard){const targets=nearestEnemies(x,y,4,new Set([enemy.id])).slice(0,2);chainGuard=true;for(const [i,target]of targets.entries()){rrDeal(target,amount*(i?.30:.42),{color:'#ff9aba',source:'ember-strong-chain',canCrit:false});state.entities.beams.push({x1:x,y1:y,x2:target.x,y2:target.y,life:.17,max:.17,color:'#ff9aba',width:2.1*weaponSizeMultiplier()});}chainGuard=false;}
    if(state.weaponAugments.arc&&source==='arc-return'){for(let i=-2;i<=2;i++){const target=nearestEnemy(x,y);if(!target)break;const a=Math.atan2(target.y-y,target.x-x)+i*.24;spawnPlayerProjectile({x,y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:4.2,life:.82,damage:amount*.31,color:'#c8fff1',pierce:1,source:'arc-strong-shard'});}}
    if(state.weaponAugments.chrono&&locked&&enemy.dead){augmentBurstGuard=true;areaDamage(x,y,118*weaponSizeMultiplier(),24+weaponCount('chrono')*4.2,COLORS.chrono,'chrono-burst');augmentBurstGuard=false;}
  };

  const rrHurt=hurtPlayer;hurtPlayer=function(amount,source){
    rrHurt(amount,source);if(!state.weaponAugments?.bulwark||state.mode==='gameover')return;
    const n=Math.max(1,weaponCount('bulwark')),now=state.time||0;
    if(now>=(player.reflectBarrierRechargeReadyAt||0)){player.reflectBarrierRechargeReadyAt=now+3;const profile=bulwarkAugmentShieldProfile(n);if(rechargeShield(profile.hitGain,profile.cap)>0)shockwave(player.x,player.y,'#b5ffe5',64+n*2,.22,1.5);}
    for(let i=0;i<4;i++){const a=i*TAU/4+Math.PI/4;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*455,vy:Math.sin(a)*455,r:5.2,life:1.0,damage:18+n*4,color:'#b5ffe5',pierce:2,source:'barrier-lance'});}
  };
  const rrSpawnCore=spawnCoreShot;spawnCoreShot=function(target,echoed=false){
    rrSpawnCore(target,echoed);
    if(state.weaponAugments.core&&!echoed&&player.coreVolley%5===0){
      for(let i=0;i<10;i++){const a=i*TAU/10;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:4.2,life:.9,damage:10+weaponCount('core')*2.2,color:'#eafcff',pierce:1,source:'core-nova'});}
      shockwave(player.x,player.y,'#eafcff',105,.32,3);
    }
  };

  const rrUpdateWells=updateWells,rrGravityExpiring=[],rrSingularityExpiring=[];updateWells=function(dt){
    rrGravityExpiring.length=0;rrSingularityExpiring.length=0;
    for(const w of state.entities.wells){if(!w)continue;if(w.rewardBurst&&!w.strongRewardBurstDone&&w.life<=dt+.035)rrGravityExpiring.push(w);if(w.traitCollapse&&!w.traitCollapseDone&&w.life<=dt+.035)rrSingularityExpiring.push(w);if(w.kind!=='trait-singularity'||w.life<=0)continue;w.distortionCd=(w.distortionCd??0)-dt;const radius=w.r*1.08,radius2=radius*radius;for(const p of state.entities.enemyProjectiles){if(!p||p.life<=0)continue;const dx=p.x-w.x,dy=p.y-w.y;if(dx*dx+dy*dy<radius2){const slow=Math.pow(.18,dt);p.vx*=slow;p.vy*=slow;}}for(const e of state.entities.enemies)if(!e.dead&&e.kind!=='apex'&&(e.x-w.x)**2+(e.y-w.y)**2<(w.r*.86+e.r)**2)e.timeLock=Math.max(e.timeLock||0,.18);if(w.distortionCd<=0){w.distortionCd=.62;shockwave(w.x,w.y,'#ef9cff',w.r*.74,.26,1.4);}}
    rrUpdateWells(dt);
    for(const w of rrGravityExpiring){w.strongRewardBurstDone=true;areaDamage(w.x,w.y,195*weaponSizeMultiplier(),34+weaponCount('gravity')*7,COLORS.violet,'gravity-collapse');shockwave(w.x,w.y,'#e8d9ff',245*weaponSizeMultiplier(),.58,5);}
    for(const w of rrSingularityExpiring){w.traitCollapseDone=true;for(const p of state.entities.enemyProjectiles)if((p.x-w.x)**2+(p.y-w.y)**2<(w.r*1.25)**2)p.life=0;areaDamage(w.x,w.y,w.r*1.08,34+state.level*.9,'#e65cff','trait-singularity-collapse');for(let i=0;i<8;i++){const a=i*TAU/8;spawnPlayerProjectile({x:w.x,y:w.y,vx:Math.cos(a)*390,vy:Math.sin(a)*390,r:4.8,life:.9,maxRange:330,damage:13+state.level*.45,color:'#f2b1ff',pierce:1,source:'singularity-shard'});}}
  };

  applyLanguage();renderStarterOptions();renderLoadout();
})();
