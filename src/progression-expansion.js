(function(){
  // Stack wording uses additive increments so later passives and boss augments remain accurate.
  STACK_EFFECTS.core=[
    ['초기 점화','기본 광자탄 자동 발사.'],['쌍발 코어','발사 개수 +1.'],['코어 관통','투사체 관통 +1.'],
    ['펄스 폭발','명중 지점의 소형 범위 폭발.'],['삼중 코어','발사 개수 +1.'],['항성 펄스','6회마다 대형 관통 광자탄 발사.']
  ];
  STACK_EFFECTS.ember=[
    ['첫 별','폭발성 별빛 탄환 발사.'],['쌍성 사격','발사 개수 +1.'],['성핵 관통','투사체 관통 +1.'],
    ['성운 분열','명중 시 별가루 3개 분열.'],['삼중 성렬','발사 개수 +1.'],['초신성 탄두','7회마다 대형 관통 초신성탄 발사.']
  ];
  STACK_EFFECTS.comet=[
    ['결정 장창','관통 혜성 창 발사.'],['이중 궤적','발사 개수 +1.'],['심층 관통','창 크기와 관통 횟수 증가.'],
    ['혜성 파편','관통 지점의 파편 4개 방출.'],['잔광 궤도','비행 경로의 짧은 지속 피해.'],['대충돌','소멸 지점의 대형 범위 폭발.']
  ];
  STACK_EFFECTS.arc=[
    ['성운 비행','곡선 왕복 칼날 발사.'],['쌍곡선','발사 개수 +1.'],['광폭 선회','근거리 곡률과 칼날 크기 증가.'],
    ['귀환 절단','직선 귀환과 두 번째 타격.'],['잔광 띠','왕복 경로의 짧은 지속 피해.'],['삼중 나선','발사 개수 +1.']
  ];
  STACK_EFFECTS.blade=[
    ['월광 기동','지속형 광자 칼날 공전.'],['쌍월 궤도','칼날 개수 +1.'],['가속 궤도','공전 속도와 공격 반경 증가.'],
    ['성흔 파동','적중 지점의 관통 절단파 발사.'],['삼월식','칼날 개수 +1.'],['천체 분쇄기','연쇄 처치 6회마다 별빛 폭발.']
  ];
  STACK_EFFECTS.prism=[
    ['단일 프리즘','공전 프리즘과 관통 광선.'],['쌍둥이 프리즘','프리즘 개수 +1.'],['광폭 굴절','광선 폭과 경로 판정 증가.'],
    ['성좌 연결','프리즘 사이 연결 광선의 접촉 피해.'],['다중 초점','프리즘당 광선 개수 +1.'],['천구 의식','프리즘 개수 +1.']
  ];
  STACK_EFFECTS.gravity=[
    ['특이점 씨앗','중력 우물 주기적 생성.'],['조석 고정','흡입 반경과 흡입력 증가.'],['장수 특이점','중력 우물 지속시간 증가.'],
    ['붕괴핵','중심부 지속 피해.'],['압축 붕괴','중심 피해와 흡입력 추가 증가.'],['쌍둥이 특이점','우물 개수 +1.']
  ];

  const NEW_PASSIVES={
    chainDrive:{name:'연쇄 추진기',icon:'»',color:'#7ce8ff',desc:'연쇄 10 이상일 때 공격 주기 -4%',max:6},
    chainBurst:{name:'연쇄 폭심',icon:'✹',color:'#ff7b9e',desc:'연쇄 15회마다 광역 폭발 피해 +5',max:6},
    chainRecovery:{name:'연쇄 회수',icon:'✚',color:'#74f2a7',desc:'연쇄 20회마다 최대 체력 1.5% 회복',max:5},
    chainField:{name:'전리품 공명',icon:'⊙',color:'#ffcc5c',desc:'연쇄 1회당 자석 범위 +0.5, 최대 40회',max:6},
    eliteHunter:{name:'거성 사냥꾼',icon:'♜',color:'#e6b2ff',desc:'중간보스와 보스 피해 +8%',max:6},
    pierce:{name:'관통 렌즈',icon:'⇢',color:'#b5f5ff',desc:'투사체 관통 +1',max:4},
    regen:{name:'자가 복원',icon:'♻',color:'#88f0ad',desc:'5초마다 체력 1.5 회복',max:6},
    wisdom:{name:'성운 통찰',icon:'✧',color:'#bba6ff',desc:'경험치 획득량 +7%',max:8},
    overdrive:{name:'임계 과출력',icon:'▲',color:'#ff806f',desc:'체력 45% 미만일 때 피해 +10%',max:5},
    projectileSize:{name:'광자 팽창',icon:'◉',color:'#8fe9ff',desc:'플레이어 투사체 크기 +8%',max:6}
  };
  Object.assign(PASSIVES,NEW_PASSIVES);

  const PT={
    chainDrive:{ko:['연쇄 추진기','연쇄 10 이상일 때 공격 주기 -4%'],en:['Chain Thruster','Attack interval -4% while chain is 10 or higher'],ja:['連鎖推進器','連鎖10以上で攻撃間隔-4%'],'zh-CN':['连锁推进器','连击达到10时攻击间隔-4%'],es:['Propulsor de Cadena','Intervalo de ataque -4% con cadena 10 o más'],fr:['Propulseur de Chaîne','Intervalle d’attaque -4 % avec une chaîne de 10 ou plus']},
    chainBurst:{ko:['연쇄 폭심','연쇄 15회마다 광역 폭발 피해 +5'],en:['Chain Detonation','Area-blast damage +5 every 15 chain'],ja:['連鎖爆心','連鎖15ごとに範囲爆発ダメージ+5'],'zh-CN':['连锁爆心','每15连击范围爆炸伤害+5'],es:['Detonación Encadenada','Daño de explosión de área +5 cada 15 de cadena'],fr:['Détonation en Chaîne','Dégâts d’explosion de zone +5 tous les 15 enchaînements']},
    chainRecovery:{ko:['연쇄 회수','연쇄 20회마다 최대 체력 1.5% 회복'],en:['Chain Recovery','Restores 1.5% max health every 20 chain'],ja:['連鎖回収','連鎖20ごとに最大HPの1.5%回復'],'zh-CN':['连锁回收','每20连击恢复1.5%最大生命值'],es:['Recuperación en Cadena','Cura 1.5% de la vida máxima cada 20 de cadena'],fr:['Récupération en Chaîne','Restaure 1,5 % des PV max tous les 20 enchaînements']},
    chainField:{ko:['전리품 공명','연쇄 1회당 자석 범위 +0.5, 최대 40회'],en:['Loot Resonance','Pickup radius +0.5 per current chain, up to 40'],ja:['戦利品共鳴','現在の連鎖1ごとに回収範囲+0.5、最大40'],'zh-CN':['战利品共鸣','当前每1连击拾取范围+0.5，最多40'],es:['Resonancia de Botín','Radio de recogida +0.5 por cadena actual, hasta 40'],fr:['Résonance du Butin','Portée de collecte +0,5 par chaîne actuelle, jusqu’à 40']},
    eliteHunter:{ko:['거성 사냥꾼','중간보스와 보스 피해 +8%'],en:['Giant Hunter','Damage to mini-bosses and bosses +8%'],ja:['巨星狩り','中ボスとボスへのダメージ+8%'],'zh-CN':['巨星猎手','对中型首领和首领伤害+8%'],es:['Cazador de Colosos','Daño a minijefes y jefes +8%'],fr:['Chasseur de Colosses','Dégâts aux mini-boss et boss +8 %']},
    pierce:{ko:['관통 렌즈','투사체 관통 +1'],en:['Piercing Lens','Projectile pierce +1'],ja:['貫通レンズ','投射物貫通+1'],'zh-CN':['贯穿透镜','投射物贯穿+1'],es:['Lente Perforante','Perforación de proyectiles +1'],fr:['Lentille Perforante','Pénétration des projectiles +1']},
    regen:{ko:['자가 복원','5초마다 체력 1.5 회복'],en:['Self Repair','Restores 1.5 health every 5 seconds'],ja:['自己修復','5秒ごとに体力1.5回復'],'zh-CN':['自我修复','每5秒恢复1.5生命值'],es:['Autorreparación','Recupera 1.5 de salud cada 5 segundos'],fr:['Autoréparation','Restaure 1,5 PV toutes les 5 secondes']},
    wisdom:{ko:['성운 통찰','경험치 획득량 +7%'],en:['Nebula Insight','Experience gained +7%'],ja:['星雲の洞察','経験値獲得量+7%'],'zh-CN':['星云洞察','经验获取量+7%'],es:['Visión Nebular','Experiencia obtenida +7%'],fr:['Intuition Nébulaire','Expérience gagnée +7 %']},
    overdrive:{ko:['임계 과출력','체력 45% 미만일 때 피해 +10%'],en:['Critical Overdrive','Damage +10% below 45% health'],ja:['臨界過出力','体力45%未満でダメージ+10%'],'zh-CN':['临界过载','生命低于45%时伤害+10%'],es:['Sobrecarga Crítica','Daño +10% por debajo de 45% de salud'],fr:['Surcharge Critique','Dégâts +10 % sous 45 % de vie']},
    projectileSize:{ko:['광자 팽창','플레이어 투사체 크기 +8%'],en:['Photon Expansion','Player projectile size +8%'],ja:['光子膨張','プレイヤー投射物サイズ+8%'],'zh-CN':['光子膨胀','玩家投射物尺寸+8%'],es:['Expansión Fotónica','Tamaño de proyectiles del jugador +8%'],fr:['Expansion Photonique','Taille des projectiles du joueur +8 %']}
  };
  Object.assign(PASSIVE_TEXT,PT);

  const baseHaste=hasteMult;
  hasteMult=function(){
    const chainBoost=(state.combo||0)>=10?Math.min(.24,stat('chainDrive')*.04):0;
    return Math.max(.24,baseHaste()*(1-chainBoost));
  };
  const baseMagnet=magnetRange;
  magnetRange=function(){return baseMagnet()+Math.min(40,state.combo||0)*stat('chainField')*.5;};
  const baseXp=xpMult;
  xpMult=function(){return baseXp()*(1+stat('wisdom')*.07);};
  const baseDamage=damageMult;
  damageMult=function(){return baseDamage()*(player.hp/player.maxHp<.45?1+stat('overdrive')*.10:1);};

  const baseProjectile=spawnPlayerProjectile;
  spawnPlayerProjectile=function(data){
    const next={...data};
    next.pierce=(Number.isFinite(next.pierce)?next.pierce:0)+stat('pierce');
    next.r=(Number.isFinite(next.r)?next.r:4)*(1+stat('projectileSize')*.08);
    return baseProjectile(next);
  };

  const baseDeal=dealDamage;
  dealDamage=function(enemy,amount,opts={}){
    if(enemy&&(enemy.type==='mini'||enemy.type==='boss'))amount*=1+stat('eliteHunter')*.08;
    return baseDeal(enemy,amount,opts);
  };

  const baseUpdatePlayer=updatePlayer;
  updatePlayer=function(dt){
    baseUpdatePlayer(dt);
    const n=stat('regen');
    if(!n)return;
    player.regenTimer=(player.regenTimer||5)-dt;
    if(player.regenTimer<=0){player.regenTimer+=5;player.hp=Math.min(player.maxHp,player.hp+n*1.5);}
  };

  let chainEffectGuard=false;
  const baseKill=killEnemy;
  killEnemy=function(enemy,opts={}){
    baseKill(enemy,opts);
    if(chainEffectGuard||!enemy)return;
    const chain=state.combo||0,burst=stat('chainBurst'),recovery=stat('chainRecovery');
    if(burst&&chain>0&&chain%15===0){
      chainEffectGuard=true;
      areaDamage(enemy.x,enemy.y,78+burst*8,10+burst*5+state.level*.35,'#ff7b9e');
      chainEffectGuard=false;
    }
    if(recovery&&chain>0&&chain%20===0){
      player.hp=Math.min(player.maxHp,player.hp+player.maxHp*(.015*recovery));
      shockwave(player.x,player.y,'#74f2a7',80,.28,2);
    }
  };

  // Encounter structure: mini-boss, mini-boss, boss. No overlap until late-game formations unlock.
  updateSpawning=function(dt){
    state.spawnTimer-=dt;
    let rate;if(state.time<25)rate=1.55;else if(state.time<65)rate=1.28-(state.time-25)*.008;else rate=Math.max(.23,.96-(state.time-65)*.0042);
    if(state.spawnTimer<=0){state.spawnTimer=rate;const count=1+Math.floor(state.time/135);for(let i=0;i<count;i++)spawnEnemy('normal');}

    const elites=state.entities.enemies.filter(e=>!e.dead&&(e.type==='mini'||e.type==='boss'));
    if(elites.length){state.encounterWasActive=true;return;}
    if(state.encounterWasActive){
      state.encounterWasActive=false;
      state.encounterTimer=Math.max(24,32-Math.min(8,state.time/120));
      return;
    }
    state.encounterTimer=(state.encounterTimer??42)-dt;
    if(state.encounterTimer>0)return;

    const step=(state.encounterStep||0)%3;
    if(step<2){
      const count=state.time>=300?2:1;
      for(let i=0;i<count;i++)spawnEnemy('mini');
    }else{
      spawnEnemy('boss');
      const escorts=state.time>=720?2:state.time>=420?1:0;
      for(let i=0;i<escorts;i++)spawnEnemy('mini');
    }
    state.encounterStep=(step+1)%3;
    state.encounterWasActive=true;
    state.encounterTimer=Infinity;
  };

  const baseReset=resetGame;
  resetGame=function(){
    baseReset();
    state.encounterStep=0;state.encounterTimer=42;state.encounterWasActive=false;
    player.regenTimer=5;
  };

  applyLanguage();renderStarterOptions();renderLoadout();updateHUD();
})();