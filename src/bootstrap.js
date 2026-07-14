const DEFAULT_SETTINGS = {
  language: 'ko',
  audio: { master: true, combat: true, ui: true, ambient: true }
};

function loadGameSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('stackfall.settings') || '{}');
    return {
      language: ['ko','en','ja'].includes(saved.language) ? saved.language : DEFAULT_SETTINGS.language,
      audio: { ...DEFAULT_SETTINGS.audio, ...(saved.audio || {}) }
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

const GAME_SETTINGS = loadGameSettings();
function saveGameSettings() {
  localStorage.setItem('stackfall.settings', JSON.stringify(GAME_SETTINGS));
}

const TEXT = {
  ko: {
    'menu.startEquipment':'시작 장비','menu.start':'RUN START','menu.settings':'설정',
    'hud.core':'CORE','hud.threat':'위협','hud.chain':'연쇄',
    'choice.kicker':'시스템 재구성','choice.title':'레벨 업','choice.prompt':'하나를 선택하세요',
    'choice.equipment':'장비','choice.passive':'패시브','choice.stack':'중첩','choice.owned':'보유',
    'banner.resonance':'공명','banner.stack':'중첩 효과',
    'pause.title':'일시정지','pause.resume':'계속하기','pause.restart':'런 다시 시작','pause.menu':'메인 메뉴','pause.settings':'설정',
    'gameover.title':'런 종료','gameover.time':'생존 시간','gameover.kills':'처치','gameover.combo':'최대 연쇄','gameover.level':'도달 레벨','gameover.retry':'다시 시작','gameover.menu':'메인 메뉴',
    'settings.title':'설정','settings.language':'언어','settings.master':'전체 소리','settings.combat':'전투 효과음','settings.ui':'UI 효과음','settings.ambient':'우주 배경음','settings.close':'닫기',
    'boss.warning':'경고','boss.approaching':'보스 접근','boss.rift':'균열 감지',
    'boss.eclipse':'일식의 군주','boss.seraph':'성운의 세라프','boss.mini':'균열의 기사',
    'empty':'비어 있음'
  },
  en: {
    'menu.startEquipment':'STARTING EQUIPMENT','menu.start':'RUN START','menu.settings':'SETTINGS',
    'hud.core':'CORE','hud.threat':'THREAT','hud.chain':'CHAIN',
    'choice.kicker':'SYSTEM REWRITE','choice.title':'LEVEL UP','choice.prompt':'Choose one',
    'choice.equipment':'EQUIPMENT','choice.passive':'PASSIVE','choice.stack':'STACK','choice.owned':'OWNED',
    'banner.resonance':'RESONANCE','banner.stack':'STACK EFFECT',
    'pause.title':'PAUSED','pause.resume':'RESUME','pause.restart':'RESTART RUN','pause.menu':'MAIN MENU','pause.settings':'SETTINGS',
    'gameover.title':'RUN OVER','gameover.time':'SURVIVAL','gameover.kills':'KILLS','gameover.combo':'MAX CHAIN','gameover.level':'LEVEL','gameover.retry':'RETRY','gameover.menu':'MAIN MENU',
    'settings.title':'SETTINGS','settings.language':'LANGUAGE','settings.master':'MASTER AUDIO','settings.combat':'COMBAT SFX','settings.ui':'UI SFX','settings.ambient':'SPACE AMBIENCE','settings.close':'CLOSE',
    'boss.warning':'WARNING','boss.approaching':'BOSS APPROACHING','boss.rift':'RIFT DETECTED',
    'boss.eclipse':'Lord of Eclipse','boss.seraph':'Nebula Seraph','boss.mini':'Rift Knight',
    'empty':'EMPTY'
  },
  ja: {
    'menu.startEquipment':'開始装備','menu.start':'RUN START','menu.settings':'設定',
    'hud.core':'CORE','hud.threat':'脅威','hud.chain':'連鎖',
    'choice.kicker':'システム再構成','choice.title':'レベルアップ','choice.prompt':'1つ選択',
    'choice.equipment':'装備','choice.passive':'パッシブ','choice.stack':'重複','choice.owned':'所持',
    'banner.resonance':'共鳴','banner.stack':'重複効果',
    'pause.title':'一時停止','pause.resume':'続ける','pause.restart':'ランをやり直す','pause.menu':'メインメニュー','pause.settings':'設定',
    'gameover.title':'ラン終了','gameover.time':'生存時間','gameover.kills':'撃破','gameover.combo':'最大連鎖','gameover.level':'到達レベル','gameover.retry':'再挑戦','gameover.menu':'メインメニュー',
    'settings.title':'設定','settings.language':'言語','settings.master':'全サウンド','settings.combat':'戦闘効果音','settings.ui':'UI効果音','settings.ambient':'宇宙環境音','settings.close':'閉じる',
    'boss.warning':'警告','boss.approaching':'ボス接近','boss.rift':'亀裂検知',
    'boss.eclipse':'蝕の君主','boss.seraph':'星雲のセラフ','boss.mini':'亀裂の騎士',
    'empty':'空き'
  }
};

const WEAPON_TEXT = {
  blade:{ko:['펄스 블레이드','공격 / 근접','초승달형 광자 칼날이 궤도를 돌며 적을 절단한다.'],en:['Pulse Blade','Attack / Melee','Crescent photon blades orbit and cut nearby enemies.'],ja:['パルスブレード','攻撃 / 近接','三日月型の光子刃が周回して敵を切り裂く。']},
  ember:{ko:['별빛 캐스터','공격 / 탄막','플레이어가 직접 발사하는 빠른 별빛 탄환 무기다.'],en:['Starlight Caster','Attack / Barrage','Rapid star projectiles are fired directly from the core.'],ja:['スターライトキャスター','攻撃 / 弾幕','コアから高速の星弾を直接発射する。']},
  bulwark:{ko:['불워크 드론','방어 / 반격','방어 위성이 피해를 줄이고 보호막과 반격을 제공한다.'],en:['Bulwark Drone','Defense / Counter','Defense satellites reduce damage and provide shields and counters.'],ja:['ブルワークドローン','防御 / 反撃','防御衛星が被害を抑え、シールドと反撃を与える。']},
  gravity:{ko:['중력 우물','제어 / 집속','공간을 찌그러뜨려 적을 한곳에 모으는 설치형 장비다.'],en:['Gravity Well','Control / Grouping','Deploys warped space that drags enemies into one point.'],ja:['重力井戸','制御 / 集束','歪んだ空間を設置し、敵を一点へ引き寄せる。']},
  comet:{ko:['혜성 창','공격 / 관통','긴 결정창이 혜성의 꼬리를 끌며 적을 꿰뚫는다.'],en:['Comet Lance','Attack / Pierce','A long crystal lance tears through enemies with a comet tail.'],ja:['コメットランス','攻撃 / 貫通','長い結晶槍が彗星の尾を引いて敵を貫く。']},
  prism:{ko:['성좌 프리즘','소환 / 광선','공전 위성이 투사체가 아닌 즉발 광선으로 여러 적을 연결한다.'],en:['Constellation Prism','Summon / Beam','Orbiting satellites link enemies with instant beams instead of projectiles.'],ja:['星座プリズム','召喚 / 光線','周回衛星が弾ではなく即時光線で複数の敵を結ぶ。']},
  chrono:{ko:['시간 고리','제어 / 지원','주변 시간을 늦추고 일정 중첩부터 시간 파동을 방출한다.'],en:['Chrono Ring','Control / Support','Slows nearby time and later emits temporal shockwaves.'],ja:['クロノリング','制御 / 支援','周囲の時間を遅らせ、重複すると時間波を放つ。']}
};

const PASSIVE_TEXT = {
  magnet:{ko:['자석 코어','결정 흡수 범위 +28'],en:['Magnet Core','Pickup range +28'],ja:['マグネットコア','回収範囲 +28']},
  echo:{ko:['에코 비콘','장비 발동 복제 확률 증가'],en:['Echo Beacon','Chance to duplicate equipment activations'],ja:['エコービーコン','装備発動の複製確率が上昇']},
  power:{ko:['출력 증폭','모든 피해 +12%'],en:['Power Amplifier','All damage +12%'],ja:['出力増幅','全ダメージ +12%']},
  haste:{ko:['가속 회로','공격 주기 8% 단축'],en:['Acceleration Circuit','Attack interval -8%'],ja:['加速回路','攻撃間隔 -8%']},
  vitality:{ko:['재생 장갑','최대 체력 +15, 즉시 회복'],en:['Regenerative Plating','Max HP +15 and heal'],ja:['再生装甲','最大HP +15、即時回復']},
  speed:{ko:['벡터 부스터','이동 속도 +7%'],en:['Vector Booster','Move speed +7%'],ja:['ベクトルブースター','移動速度 +7%']},
  crit:{ko:['취약점 해석','치명타 확률 +5%'],en:['Weakness Analysis','Critical chance +5%'],ja:['弱点解析','クリティカル率 +5%']},
  chain:{ko:['연쇄 과부하','처치 연쇄 유지시간 +15%'],en:['Chain Overload','Chain duration +15%'],ja:['チェイン過負荷','連鎖維持時間 +15%']},
  greed:{ko:['개척 계약','적 체력 +8%, 경험치 +18%'],en:['Frontier Contract','Enemy HP +8%, XP +18%'],ja:['開拓契約','敵HP +8%、経験値 +18%']},
  armor:{ko:['충격 흡수재','받는 피해 -6%'],en:['Impact Absorber','Damage taken -6%'],ja:['衝撃吸収材','被ダメージ -6%']}
};

const STACK_EFFECTS = {
  blade:[['월광 기동','광자 칼날 1개가 기본 궤도를 돈다.'],['쌍월 궤도','반대편에 두 번째 칼날이 생성된다.'],['가속 궤도','회전 속도와 공격 범위가 증가한다.'],['성흔 파동','적중 시 관통 절단파가 발사된다.'],['삼월식','세 번째 칼날이 추가되어 빈틈이 줄어든다.'],['천체 분쇄기','궤도가 확대되고 연속 처치 시 별빛 폭발이 일어난다.']],
  ember:[['첫 별','가장 가까운 적에게 별빛 탄환을 발사한다.'],['쌍성 사격','한 번에 두 발을 발사한다.'],['성핵 관통','별빛 탄환이 적 하나를 추가로 관통한다.'],['성운 분열','적중한 탄환이 세 갈래 별가루로 분열한다.'],['삼중 성렬','한 번에 세 발을 넓게 발사한다.'],['초신성 탄두','주기적으로 거대한 관통 초신성탄을 발사한다.']],
  bulwark:[['방어 위성','받는 피해가 감소하고 위성 하나가 공전한다.'],['연결 장갑','최대 체력과 피해 감소가 더 증가한다.'],['재충전 장갑','일정 시간마다 소량의 보호막을 회복한다.'],['보복 방벽','피격 시 주변 적에게 충격파를 방출한다.'],['요새 핵','보호막 최대치와 재충전량이 증가한다.'],['이동 요새','주기적으로 강한 완전 방어막을 충전한다.']],
  gravity:[['특이점 씨앗','주기적으로 작은 중력 우물을 만든다.'],['조석 고정','흡입 범위와 힘이 증가한다.'],['장수 특이점','우물의 지속시간이 늘어난다.'],['붕괴핵','사건의 지평선 내부에 지속 피해가 생긴다.'],['압축 붕괴','중심 피해와 흡입력이 크게 증가한다.'],['쌍둥이 특이점','서로 교차하는 두 개의 우물을 생성한다.']],
  comet:[['결정창','긴 혜성 창 한 발이 적을 관통한다.'],['이중 궤적','혜성 창이 나란히 두 발 발사된다.'],['심층 관통','창이 더 커지고 추가 적을 관통한다.'],['혜성 파편','관통할 때마다 얼음별 파편을 뿌린다.'],['잔광 궤도','비행 경로에 짧게 남는 피해 장판을 만든다.'],['대충돌','창이 소멸할 때 거대한 광역 폭발을 일으킨다.']],
  prism:[['단일 프리즘','위성 하나가 가장 가까운 적에게 즉발 광선을 쏜다.'],['쌍둥이 프리즘','공전 위성이 두 개로 증가한다.'],['연쇄 굴절','광선이 두 번째 적에게 꺾여 이어진다.'],['성좌 연결','위성 사이 연결선이 닿는 적에게 피해를 준다.'],['다중 초점','각 위성이 한 번에 더 많은 적을 조준한다.'],['천구 의식','세 개의 위성이 고속 연쇄 광선을 발사한다.']],
  chrono:[['느린 시간','주변 적의 이동 속도를 감소시킨다.'],['느린 궤도','감속 범위가 넓어진다.'],['시간 가속','플레이어의 장비 발동 주기가 조금 빨라진다.'],['시간 파동','주기적으로 범위 피해를 주는 시간 파동을 방출한다.'],['찰나 정지','시간 파동에 맞은 일반 적이 잠시 크게 느려진다.'],['영원의 원환','범위와 감속이 극대화되고 전체 장비 주기가 더 빨라진다.']]
};

const STACK_EFFECTS_EN = {
  blade:['Moonlit Orbit','Twin Moons','Accelerated Orbit','Scar Wave','Triple Eclipse','Celestial Grinder'],ember:['First Star','Binary Shot','Core Pierce','Nebula Split','Triple Salvo','Supernova Warhead'],bulwark:['Defense Satellite','Linked Plating','Recharge Plating','Retaliation Wall','Fortress Core','Mobile Fortress'],gravity:['Singularity Seed','Tidal Lock','Long-Lived Singularity','Collapse Core','Compressed Collapse','Twin Singularities'],comet:['Crystal Lance','Double Trail','Deep Pierce','Comet Fragments','Afterglow Path','Great Impact'],prism:['Single Prism','Twin Prisms','Chain Refraction','Constellation Link','Multi Focus','Celestial Rite'],chrono:['Slow Time','Wide Orbit','Temporal Acceleration','Time Wave','Momentary Stop','Eternal Ring']
};
const STACK_EFFECTS_JA = {
  blade:['月光軌道','双月軌道','加速軌道','星痕波','三月蝕','天体粉砕機'],ember:['一番星','双星射撃','星核貫通','星雲分裂','三連星列','超新星弾頭'],bulwark:['防御衛星','連結装甲','再充填装甲','報復障壁','要塞核','移動要塞'],gravity:['特異点の種','潮汐固定','長寿命特異点','崩壊核','圧縮崩壊','双子特異点'],comet:['結晶槍','二重軌跡','深層貫通','彗星破片','残光軌道','大衝突'],prism:['単一プリズム','双子プリズム','連鎖屈折','星座連結','多重焦点','天球儀式'],chrono:['遅い時間','遅い軌道','時間加速','時間波','刹那停止','永遠の環']
};
const STACK_DESC_EN = {
  blade:['One photon blade orbits the core.','A second blade appears opposite the first.','Orbit speed and attack radius increase.','Hits launch a piercing slash wave.','A third blade closes the remaining gaps.','The orbit expands and chained kills trigger stellar bursts.'],ember:['Fires a starlight projectile at the nearest enemy.','Fires two projectiles at once.','Projectiles pierce one additional enemy.','Hits split into three star sparks.','Fires a wide three-shot salvo.','Periodically fires a giant piercing supernova round.'],bulwark:['A defense satellite reduces incoming damage.','Max HP and damage reduction increase further.','Regenerates a small shield over time.','Taking damage releases a counter shockwave.','Shield capacity and recharge amount increase.','Periodically charges a powerful fortress shield.'],gravity:['Periodically creates a small gravity well.','Pull radius and force increase.','Gravity wells last longer.','Enemies near the event horizon take damage over time.','Core damage and pull strength increase greatly.','Creates two crossing singularities.'],comet:['A long comet lance pierces enemies.','Fires two comet lances side by side.','The lance grows and pierces more targets.','Each penetration scatters icy star fragments.','The flight path leaves a short-lived damaging trail.','The lance detonates in a huge area when it expires.'],prism:['One satellite fires an instant beam at the nearest enemy.','A second orbiting satellite is added.','The beam refracts into a second enemy.','Constellation links between satellites damage enemies.','Each satellite focuses on more targets.','Three satellites unleash rapid chained beams.'],chrono:['Slows enemies around the player.','The slowing field becomes wider.','Equipment activation speed increases slightly.','Periodically releases a damaging time wave.','Normal enemies struck by the wave are heavily slowed.','Range and slow reach their peak and all equipment speeds up further.']
};
const STACK_DESC_JA = {
  blade:['光子刃1枚がコアを周回する。','反対側に2枚目の刃が出現する。','回転速度と攻撃範囲が増加する。','命中時に貫通する斬撃波を放つ。','3枚目の刃が加わり隙が減る。','軌道が拡大し、連続撃破で星光爆発が起きる。'],ember:['最も近い敵へ星弾を発射する。','同時に2発を発射する。','星弾が追加で1体を貫通する。','命中時に3方向の星屑へ分裂する。','広い3連射を行う。','定期的に巨大な貫通超新星弾を発射する。'],bulwark:['防御衛星が被ダメージを減らす。','最大HPとダメージ軽減がさらに増える。','時間経過で少量のシールドを回復する。','被弾時に反撃衝撃波を放つ。','シールド容量と回復量が増える。','定期的に強力な要塞シールドを充填する。'],gravity:['定期的に小さな重力井戸を作る。','吸引範囲と力が増える。','重力井戸の持続時間が延びる。','事象の地平線内の敵に継続ダメージを与える。','中心ダメージと吸引力が大きく増える。','交差する2つの特異点を生成する。'],comet:['長い彗星槍が敵を貫く。','彗星槍を並べて2本発射する。','槍が大きくなり、より多くの敵を貫通する。','貫通するたび氷星の破片を撒く。','飛行経路に短時間残るダメージ軌道を作る。','消滅時に巨大な範囲爆発を起こす。'],prism:['衛星1機が最も近い敵へ即時光線を放つ。','周回衛星が2機になる。','光線が2体目の敵へ屈折する。','衛星間の星座線が敵にダメージを与える。','各衛星がより多くの敵を狙う。','3機の衛星が高速連鎖光線を放つ。'],chrono:['周囲の敵を減速させる。','減速フィールドが広がる。','装備の発動速度が少し上がる。','定期的にダメージを与える時間波を放つ。','時間波を受けた通常敵が大きく減速する。','範囲と減速が最大化し、全装備がさらに加速する。']
};

function tr(key) { return TEXT[GAME_SETTINGS.language]?.[key] || TEXT.ko[key] || key; }
function weaponText(key) { const row=WEAPON_TEXT[key]?.[GAME_SETTINGS.language]||WEAPON_TEXT[key]?.ko;return row?{name:row[0],role:row[1],desc:row[2]}:{name:key,role:'',desc:''}; }
function passiveText(key) { const row=PASSIVE_TEXT[key]?.[GAME_SETTINGS.language]||PASSIVE_TEXT[key]?.ko;return row?{name:row[0],desc:row[1]}:{name:key,desc:''}; }
function stackEffectText(key,stack) {
  const ko=STACK_EFFECTS[key]?.[stack-1]||['',''];
  if(GAME_SETTINGS.language==='en')return{name:STACK_EFFECTS_EN[key]?.[stack-1]||ko[0],desc:STACK_DESC_EN[key]?.[stack-1]||ko[1]};
  if(GAME_SETTINGS.language==='ja')return{name:STACK_EFFECTS_JA[key]?.[stack-1]||ko[0],desc:STACK_DESC_JA[key]?.[stack-1]||ko[1]};
  return{name:ko[0],desc:ko[1]};
}
function bossDisplayName(enemy) {
  if(!enemy)return'';
  if(enemy.type==='mini')return tr('boss.mini');
  if(enemy.variant==='seraph')return tr('boss.seraph');
  if(enemy.type==='boss')return tr('boss.eclipse');
  return enemy.name||'';
}
