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
  togglePause=function(force){if(state.mode==='bossReward')return;return rrOldToggle(force);};

  createGravityWells=function(gravN,echoed=false){
    const target=nearestEnemy(player.x,player.y),count=gravN>=6?2:1;
    const base=target?Math.atan2(target.y-player.y,target.x-player.x):player.angle;
    const targetDistance=target?Math.hypot(target.x-player.x,target.y-player.y):150,size=weaponSizeMultiplier();
    for(let i=0;i<count;i++){
      const a=base+(i-(count-1)/2)*.42+(echoed?.2:0),d=clamp(targetDistance*.78,110,205),duration=(gravN>=3?3.55:2.7)+(gravN>=4?.55:0);
      state.entities.wells.push({x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:(gravN>=2?185:135)*size,life:duration,max:duration,
        strength:(gravN>=2?430:280)+(gravN>=5?120:0),damage:gravN>=4?(9+gravN*2.2+(gravN>=5?7:0))*(echoed?.55:1):0,tick:0,color:echoed?COLORS.pink:COLORS.violet,
        rewardBurst:!!state.weaponAugments?.gravity,attackSizeScaled:true});
    }
  };

  drawEquippedOrbitsClean=function(x,y,t){
    const bladeN=weaponCount('blade');
    if(bladeN){const count=bladeN>=5?3:bladeN>=2?2:1,orbit=bladeN>=6?116:bladeN>=3?91:80;for(let i=0;i<count;i++){const a=player.angle+i*TAU/count;sf2DrawBladeBody(x+Math.cos(a)*orbit,y+Math.sin(a)*orbit,a,bladeN);}}
    const prismN=weaponCount('prism');
    if(prismN){const count=prismN>=6?3:prismN>=2?2:1;for(const p of prismPositions(count)){const s=worldToScreen(p.x,p.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-p.a+t/1300);ctx.shadowBlur=16;ctx.shadowColor='#c2a7ff';
      const g=ctx.createLinearGradient(0,-10,0,10);g.addColorStop(0,'#fff');g.addColorStop(.5,'#d2c3ff');g.addColorStop(1,'#6e63d8');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.restore();}
      if(prismN>=4){const pts=prismPositions(count).map(p=>worldToScreen(p.x,p.y));ctx.strokeStyle='rgba(194,167,255,.25)';ctx.lineWidth=1.2;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(pts.length>2)ctx.closePath();ctx.stroke();}}
  };

  const rewardScreen=document.createElement('section');
  rewardScreen.id='bossRewardScreen';rewardScreen.className='overlay hidden';
  rewardScreen.innerHTML='<div class="reward-shell"><div class="choice-head"><p id="rewardKicker"></p><h2 id="rewardTitle"></h2><span id="rewardPrompt"></span></div><div id="rewardCards" class="reward-cards"></div></div>';
  document.querySelector('#app').appendChild(rewardScreen);
  const rewardStyle=document.createElement('style');rewardStyle.textContent=`
    #bossRewardScreen{z-index:65;background:radial-gradient(circle at 50% 42%,rgba(83,65,174,.42),rgba(2,4,13,.94));backdrop-filter:blur(10px)}
    .reward-shell{width:min(1060px,96vw)}.reward-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
    .reward-card{min-height:250px;text-align:left;color:#f6f8ff;border-radius:21px;padding:19px;cursor:pointer;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.14);background:linear-gradient(145deg,rgba(28,34,72,.98),rgba(7,10,27,.99));box-shadow:0 22px 58px rgba(0,0,0,.42);transition:.18s}
    .reward-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 0%,var(--reward-glow),transparent 48%)}.reward-card:hover{transform:translateY(-6px);border-color:var(--reward-color)}
    .reward-card>*{position:relative}.reward-card .reward-type{font-size:9px;font-weight:900;letter-spacing:.14em;color:var(--reward-color)}.reward-card .reward-icon{font-size:44px;margin:27px 0 20px;color:var(--reward-color);text-shadow:0 0 24px var(--reward-color)}
    .reward-card h3{font-size:21px;margin:0 0 8px}.reward-card p{margin:0;color:#abb5d3;font-size:12px;line-height:1.65}
    @media(max-width:720px){.reward-cards{grid-template-columns:1fr;max-height:65vh;overflow:auto}.reward-card{min-height:155px}.reward-card .reward-icon{margin:14px 0;font-size:34px}}
  `;document.head.appendChild(rewardStyle);

  const traitDefs={
    stellar:{icon:'✹',color:'#ffe49a',name:{ko:'항성 왕관',en:'Stellar Crown'},desc:{ko:'주기적으로 가까운 적들을 관통하는 별빛 광선.',en:'Periodically pierces nearby enemies with stellar rays.'}},
    aegis:{icon:'⬢',color:'#83ffd1',name:{ko:'공허의 가호',en:'Void Aegis'},desc:{ko:'주기적인 대형 보호막 충전.',en:'Periodically charges a powerful shield.'}},
    singularity:{icon:'◉',color:'#a98cff',name:{ko:'특이점 혈맥',en:'Singularity Vein'},desc:{ko:'일정 처치마다 적을 빨아들이는 소형 특이점 생성.',en:'Creates a small singularity after a number of kills.'}},
    eclipse:{icon:'◒',color:'#ff76bd',name:{ko:'일식 동력로',en:'Eclipse Reactor'},desc:{ko:'상시 피해 증가와 낮은 체력에서의 추가 증폭.',en:'Permanent damage gain with an extra low-health surge.'}},
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
    arc:{icon:'☾',color:'#69ffe0',name:{ko:'귀환 파편',en:'Return Shards'},desc:{ko:'귀환 중 적중 시 세 갈래 성운 파편 방출.',en:'Return hits release three nebula shards.'}}
  };

  state.bossTraits=state.bossTraits||{};state.weaponAugments=state.weaponAugments||{};state.rewardQueue=state.rewardQueue||[];
  const rrReset=resetGame;resetGame=function(){rrReset();state.bossTraits={};state.weaponAugments={};state.rewardQueue=[];state.rewardTimers={stellar:6,aegis:8,chrono:7};state.rewardKills=0;rewardScreen.classList.add('hidden');};
  const rrShowMenu=showMainMenu;showMainMenu=function(){rewardScreen.classList.add('hidden');state.rewardQueue=[];return rrShowMenu();};
  const rrEnd=endGame;endGame=function(){rewardScreen.classList.add('hidden');state.rewardQueue=[];return rrEnd();};

  function rewardOptionPool(){
    const pool=[];
    for(const [key,d] of Object.entries(traitDefs))if(!state.bossTraits[key])pool.push({kind:'trait',key,...d});
    for(const key of Object.keys(state.weaponStacks))if(weaponCount(key)>0&&augmentDefs[key]&&!state.weaponAugments[key])pool.push({kind:'augment',key,...augmentDefs[key]});
    return pool;
  }
  function chooseRewards(){
    const pool=rewardOptionPool(),traits=pool.filter(x=>x.kind==='trait'),augments=pool.filter(x=>x.kind==='augment'),out=[];
    if(traits.length)out.push(traits.splice(Math.floor(Math.random()*traits.length),1)[0]);
    if(augments.length)out.push(augments.splice(Math.floor(Math.random()*augments.length),1)[0]);
    const rest=[...traits,...augments].sort(()=>Math.random()-.5);while(out.length<3&&rest.length)out.push(rest.pop());return out;
  }
  function tryOpenReward(){
    if(!state.rewardQueue.length)return;
    if(state.mode!=='playing')return;
    const choices=chooseRewards();if(!choices.length){state.rewardQueue.shift();return;}
    if(typeof closeAbilityLedger==='function')closeAbilityLedger(true);
    state.mode='bossReward';ui.touch.classList.add('hidden');rewardScreen.classList.remove('hidden');
    document.querySelector('#rewardKicker').textContent=tr('boss.warning');document.querySelector('#rewardTitle').textContent=tr('reward.title');document.querySelector('#rewardPrompt').textContent=tr('reward.prompt');
    const cards=document.querySelector('#rewardCards');cards.innerHTML='';
    for(const option of choices){const card=document.createElement('button');card.className='reward-card';card.dataset[option.kind==='trait'?'traitKey':'augmentKey']=option.key;card.style.setProperty('--reward-color',option.color);card.style.setProperty('--reward-glow',hexToRgba(option.color,.22));
      card.innerHTML=`<span class="reward-type">${tr(option.kind==='trait'?'reward.passive':'reward.augment')}</span><div class="reward-icon">${option.icon}</div><h3>${pick(option.name)}</h3><p>${pick(option.desc)}</p>`;
      card.onclick=()=>{if(option.kind==='trait')state.bossTraits[option.key]=true;else state.weaponAugments[option.key]=true;state.rewardQueue.shift();rewardScreen.classList.add('hidden');state.mode='playing';if(matchMedia('(pointer:coarse)').matches||innerWidth<760)ui.touch.classList.remove('hidden');audio.resonance();};cards.appendChild(card);}
  }
  window.updateRewardQueue=tryOpenReward;

  function applyMiniRewardPassive(key){
    state.passives[key]=stat(key)+1;
    if(key==='vitality'){player.maxHp+=20;player.hp=Math.min(player.maxHp,player.hp+30);}
    if(key==='stellarLife'){const ratio=player.hp/Math.max(1,player.maxHp);player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.08));player.hp=Math.max(1,Math.round(player.maxHp*ratio));}
  }
  function grantMinibossReward(){
    const weapons=Object.keys(state.weaponStacks||{}).filter(key=>weaponCount(key)>0&&weaponCount(key)<6),passives=Object.keys(PASSIVES).filter(key=>stat(key)<PASSIVES[key].max);
    const useWeapon=weapons.length&&(!passives.length||Math.random()<.45);
    let title='정예 전리품',desc='';
    if(useWeapon){const key=weapons[Math.floor(Math.random()*weapons.length)],next=weaponCount(key)+1;state.weaponStacks[key]=next;if(key!=='core'&&!state.weaponSlots.includes(key))state.weaponSlots.push(key);title=weaponText(key).name;desc=stackEffectText(key,next)?.desc||'장비 중첩 증가.';}
    else if(passives.length){const key=passives[Math.floor(Math.random()*passives.length)];applyMiniRewardPassive(key);title=passiveText(key).name;desc=passiveText(key).desc;}
    else{player.shield=Math.max(player.shield,18);desc='보호막 충전.';}
    const kicker=document.querySelector('#resonanceKicker');if(kicker)kicker.textContent='중간보스 전리품';ui.resonanceTitle.textContent=title;ui.resonanceDesc.textContent=desc;ui.resonance.classList.remove('hidden');scheduleUiAction(1900,()=>ui.resonance.classList.add('hidden'));audio.pickup();renderLoadout();updateHUD();
  }

  const rrKill=killEnemy;killEnemy=function(enemy,opts={}){
    const elite=enemy&&(enemy.type==='boss'||enemy.type==='mini'),x=enemy?.x||0,y=enemy?.y||0,locked=enemy?.timeLock>0,before=state.rewardQueue?.length||0,wellsBefore=state.entities.wells.length;
    rrKill(enemy,opts);
    if(state.bossTraits.harvest){const heal=elite?Math.ceil(player.maxHp*.25):1;player.hp=Math.min(player.maxHp,player.hp+heal);}
    if(state.bossTraits.singularity){state.rewardKills=(state.rewardKills||0)+1;if(state.rewardKills%18===0)state.entities.wells.push({x,y,r:145,life:2.6,max:2.6,strength:390,damage:12,tick:0,color:'#9e79ff'});}
    if(state.weaponAugments.chrono&&locked)areaDamage(x,y,72,16+weaponCount('chrono')*3,COLORS.chrono);
    if(state.bossTraits?.singularity&&state.entities.wells.length>wellsBefore&&(state.rewardKills||0)%18===0){const well=state.entities.wells[state.entities.wells.length-1];if(well){well.kind='trait-singularity';well.color='#e65cff';well.r=118;well.strength=720;well.damage=Math.max(18,well.damage||0);well.max=well.life=Math.max(2.2,well.life||0);}}
    if(elite){const suppress=enemy?.kind==='apex'||enemy?.eventKind==='void'||enemy?.noEliteReward===true;if(suppress||enemy?.type==='mini')state.rewardQueue.splice(before);else if((state.rewardQueue?.length||0)===before)state.rewardQueue.push(enemy.type);if(!suppress&&enemy?.type==='mini')grantMinibossReward();}
  };

  const rrDamageMult=damageMult;damageMult=function(){let v=rrDamageMult();if(state.bossTraits.eclipse)v*=player.hp/player.maxHp<.5?1.52:1.18;return v;};
  const rrUpdateWeapons=updateWeapons;updateWeapons=function(dt){
    rrUpdateWeapons(dt);if(state.mode!=='playing')return;
    state.rewardTimers=state.rewardTimers||{stellar:6,aegis:8,chrono:7};
    if(state.bossTraits.stellar){state.rewardTimers.stellar-=dt;if(state.rewardTimers.stellar<=0){state.rewardTimers.stellar=7.5;const targets=nearestEnemies(player.x,player.y,6);for(const e of targets){dealDamage(e,32+state.level*1.5,{color:'#ffe49a',source:'stellar-crown'});state.entities.beams.push({x1:player.x,y1:player.y,x2:e.x,y2:e.y,life:.22,max:.22,color:'#ffe49a',width:2.6});}}}
    if(state.bossTraits.aegis){state.rewardTimers.aegis-=dt;if(state.rewardTimers.aegis<=0){state.rewardTimers.aegis=10;player.shield=Math.min(60,player.shield+18);shockwave(player.x,player.y,'#83ffd1',120,.42,4);}}
    if(state.bossTraits.chrono){state.rewardTimers.chrono-=dt;if(state.rewardTimers.chrono<=0){state.rewardTimers.chrono=9;shockwave(player.x,player.y,'#8fffe0',220,.55,4);for(const e of state.entities.enemies)if(!e.dead&&Math.hypot(e.x-player.x,e.y-player.y)<220)e.timeLock=Math.max(e.timeLock||0,e.type==='boss'?.55:1.35);}}
  };

  const rrDeal=dealDamage;let chainGuard=false,bladeGuard=false,augmentBurstGuard=false;
  dealDamage=function(enemy,amount,opts={}){
    const wasAlive=enemy&&!enemy.dead,source=opts.source||'',locked=enemy?.timeLock>0,x=enemy?.x||0,y=enemy?.y||0;rrDeal(enemy,amount,opts);
    if(!wasAlive||augmentBurstGuard)return;
    const now=performance.now();
    if(state.weaponAugments.blade&&source==='blade'&&!bladeGuard&&now-(player.strongBladeBurstAt||0)>430){player.strongBladeBurstAt=now;bladeGuard=true;augmentBurstGuard=true;areaDamage(x,y,88*weaponSizeMultiplier(),18+weaponCount('blade')*4.5,COLORS.cyan);augmentBurstGuard=false;bladeGuard=false;}
    if(state.weaponAugments.ember&&(source==='ember'||source==='echo-star')&&!chainGuard){const targets=nearestEnemies(x,y,4,new Set([enemy.id])).slice(0,2);chainGuard=true;for(const [i,target]of targets.entries()){rrDeal(target,amount*(i?.30:.42),{color:'#ff9aba',source:'ember-strong-chain',canCrit:false});state.entities.beams.push({x1:x,y1:y,x2:target.x,y2:target.y,life:.17,max:.17,color:'#ff9aba',width:2.1*weaponSizeMultiplier()});}chainGuard=false;}
    if(state.weaponAugments.arc&&source==='arc-return'){for(let i=-2;i<=2;i++){const target=nearestEnemy(x,y);if(!target)break;const a=Math.atan2(target.y-y,target.x-x)+i*.24;spawnPlayerProjectile({x,y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:4.2,life:.82,damage:amount*.31,color:'#c8fff1',pierce:1,source:'arc-strong-shard'});}}
    if(state.weaponAugments.chrono&&locked&&enemy.dead){augmentBurstGuard=true;areaDamage(x,y,118*weaponSizeMultiplier(),24+weaponCount('chrono')*4.2,COLORS.chrono);augmentBurstGuard=false;}
  };

  const rrHurt=hurtPlayer;hurtPlayer=function(amount,source){rrHurt(amount,source);if(!state.weaponAugments?.bulwark||state.mode==='gameover')return;const n=Math.max(1,weaponCount('bulwark'));player.shield=Math.min(58+n*8,player.shield+5+n*1.5);for(let i=0;i<4;i++){const a=i*TAU/4+Math.PI/4;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*455,vy:Math.sin(a)*455,r:5.2,life:1.0,damage:18+n*4,color:'#b5ffe5',pierce:2,source:'barrier-lance'});}};
  const rrSpawnCore=spawnCoreShot;spawnCoreShot=function(target,echoed=false){
    rrSpawnCore(target,echoed);
    if(state.weaponAugments.core&&!echoed&&player.coreVolley%5===0){
      for(let i=0;i<10;i++){const a=i*TAU/10;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*420,vy:Math.sin(a)*420,r:4.2,life:.9,damage:10+weaponCount('core')*2.2,color:'#eafcff',pierce:1,source:'core-nova'});}
      shockwave(player.x,player.y,'#eafcff',105,.32,3);
    }
  };

  const rrUpdateWells=updateWells;updateWells=function(dt){const expiring=state.entities.wells.filter(w=>w.rewardBurst&&!w.strongRewardBurstDone&&w.life<=dt+.035);rrUpdateWells(dt);for(const w of expiring){w.strongRewardBurstDone=true;areaDamage(w.x,w.y,195*weaponSizeMultiplier(),34+weaponCount('gravity')*7,COLORS.violet);shockwave(w.x,w.y,'#e8d9ff',245*weaponSizeMultiplier(),.58,5);}};

  applyLanguage();renderStarterOptions();renderLoadout();
})();
