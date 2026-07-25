const DEFAULT_SETTINGS = {
  language: 'ko',
  audio: { master: true, combat: true, ui: true, ambient: true, volume:{master:.90,combat:.92,ui:.82,ambient:.58} },
  damageNumbers:true,
  screenShake:true
};

function loadGameSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('stackfall.settings') || '{}');
    const language=['ko','en','ja','zh-CN','es','fr'].includes(saved.language)?saved.language:DEFAULT_SETTINGS.language;
    return {
      language,
      audio:{...DEFAULT_SETTINGS.audio,...(saved.audio||{}),volume:{...DEFAULT_SETTINGS.audio.volume,...(saved.audio?.volume||{})}},
      damageNumbers:saved.damageNumbers!==false,
      screenShake:saved.screenShake!==false
    };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }
}

const GAME_SETTINGS = loadGameSettings();
function saveGameSettings() {localStorage.setItem('stackfall.settings', JSON.stringify(GAME_SETTINGS));}

const TEXT = {
  ko: {
    'menu.startEquipment':'시작 장비','menu.start':'RUN START','menu.settings':'설정','hud.core':'CORE','hud.threat':'위협','hud.chain':'연쇄','choice.kicker':'시스템 재구성','choice.title':'레벨 업','choice.prompt':'하나를 선택하세요','choice.equipment':'장비','choice.passive':'패시브','choice.stack':'중첩','choice.owned':'보유','banner.resonance':'공명','banner.stack':'중첩 효과','pause.title':'일시정지','pause.resume':'계속하기','pause.restart':'게임 다시 시작','pause.menu':'메인 메뉴','pause.settings':'설정','gameover.title':'게임 오버','gameover.time':'생존 시간','gameover.kills':'처치','gameover.combo':'최대 연쇄','gameover.level':'도달 레벨','gameover.retry':'다시 시작','gameover.menu':'메인 메뉴','settings.title':'설정','settings.language':'언어','settings.master':'전체 소리','settings.combat':'전투 효과음','settings.ui':'UI 효과음','settings.ambient':'우주 배경음','settings.close':'닫기','boss.warning':'경고','boss.approaching':'보스 접근','boss.rift':'균열 감지','boss.eclipse':'일식의 군주','boss.seraph':'성운의 세라프','boss.mini':'균열의 기사','empty':'비어 있음'
  },
  en: {
    'menu.startEquipment':'STARTING EQUIPMENT','menu.start':'RUN START','menu.settings':'SETTINGS','hud.core':'CORE','hud.threat':'THREAT','hud.chain':'CHAIN','choice.kicker':'SYSTEM REWRITE','choice.title':'LEVEL UP','choice.prompt':'Choose one','choice.equipment':'EQUIPMENT','choice.passive':'PASSIVE','choice.stack':'STACK','choice.owned':'OWNED','banner.resonance':'RESONANCE','banner.stack':'STACK EFFECT','pause.title':'PAUSED','pause.resume':'RESUME','pause.restart':'RESTART GAME','pause.menu':'MAIN MENU','pause.settings':'SETTINGS','gameover.title':'GAME OVER','gameover.time':'SURVIVAL','gameover.kills':'KILLS','gameover.combo':'MAX CHAIN','gameover.level':'LEVEL','gameover.retry':'RETRY','gameover.menu':'MAIN MENU','settings.title':'SETTINGS','settings.language':'LANGUAGE','settings.master':'MASTER AUDIO','settings.combat':'COMBAT SFX','settings.ui':'UI SFX','settings.ambient':'SPACE AMBIENCE','settings.close':'CLOSE','boss.warning':'WARNING','boss.approaching':'BOSS APPROACHING','boss.rift':'RIFT DETECTED','boss.eclipse':'Lord of Eclipse','boss.seraph':'Nebula Seraph','boss.mini':'Rift Knight','empty':'EMPTY'
  },
  ja: {
    'menu.startEquipment':'開始装備','menu.start':'RUN START','menu.settings':'設定','hud.core':'CORE','hud.threat':'脅威','hud.chain':'連鎖','choice.kicker':'システム再構成','choice.title':'レベルアップ','choice.prompt':'1つ選択','choice.equipment':'装備','choice.passive':'パッシブ','choice.stack':'重複','choice.owned':'所持','banner.resonance':'共鳴','banner.stack':'重複効果','pause.title':'一時停止','pause.resume':'続ける','pause.restart':'ゲームをやり直す','pause.menu':'メインメニュー','pause.settings':'設定','gameover.title':'ゲームオーバー','gameover.time':'生存時間','gameover.kills':'撃破','gameover.combo':'最大連鎖','gameover.level':'到達レベル','gameover.retry':'再挑戦','gameover.menu':'メインメニュー','settings.title':'設定','settings.language':'言語','settings.master':'全サウンド','settings.combat':'戦闘効果音','settings.ui':'UI効果音','settings.ambient':'宇宙環境音','settings.close':'閉じる','boss.warning':'警告','boss.approaching':'ボス接近','boss.rift':'亀裂検知','boss.eclipse':'蝕の君主','boss.seraph':'星雲のセラフ','boss.mini':'亀裂の騎士','empty':'空き'
  }
};

const WEAPON_TEXT = {
  blade:{ko:['펄스 블레이드','공격 / 근접','초승달형 광자 칼날이 궤도를 돌며 적을 절단한다.'],en:['Pulse Blade','Attack / Melee','Crescent photon blades orbit and cut nearby enemies.'],ja:['パルスブレード','攻撃 / 近接','三日月型の光子刃が周回して敵を切り裂く。']},
  ember:{ko:['별빛 캐스터','공격 / 탄막','플레이어가 직접 발사하는 빠른 별빛 탄환 무기다.'],en:['Starlight Caster','Attack / Barrage','Rapid star projectiles are fired directly from the core.'],ja:['スターライトキャスター','攻撃 / 弾幕','コアから高速の星弾を直接発射する。']},
  bulwark:{ko:['불워크 드론','방어 / 반격','방어 위성이 피해를 줄이고 보호막과 반격을 제공한다.'],en:['Bulwark Drone','Defense / Counter','Defense satellites reduce damage and provide shields and counters.'],ja:['ブルワークドローン','防御 / 反撃','防御衛星が被害を抑え、シールドと反撃を与える。']},
  gravity:{ko:['중력 우물','제어 / 집속','공간을 찌그러뜨려 적을 한곳에 모으는 설치형 장비다.'],en:['Gravity Well','Control / Grouping','Deploys warped space that drags enemies into one point.'],ja:['重力井戸','制御 / 集束','歪んだ空間を設置し、敵を一点へ引き寄せる。']},
  comet:{ko:['혜성 창','공격 / 관통','긴 결정창이 혜성의 꼬리를 끌며 적을 꿰뚫는다.'],en:['Comet Lance','Attack / Pierce','A long crystal lance tears through enemies with a comet tail.'],ja:['コメットランス','攻撃 / 貫通','長い結晶槍が彗星の尾を引いて敵を貫く。']},
  prism:{ko:['성좌 프리즘','소환 / 집속 광선','새 표적을 조준한 뒤 쓰러질 때까지 모든 프리즘이 함께 집속한다.'],en:['Constellation Prism','Summon / Focus Beam','After acquiring a target, every prism focuses it until it falls whenever possible.'],ja:['星座プリズム','召喚 / 集束光線','標的を捕捉した後、倒れるまで全プリズムが集中攻撃する。']},
  chrono:{ko:['시간 고리','제어 / 지원','주변 시간을 늦추고 일정 중첩부터 시간 파동을 방출한다.'],en:['Chrono Ring','Control / Support','Slows nearby time and later emits temporal shockwaves.'],ja:['クロノリング','制御 / 支援','周囲の時間を遅らせ、重複すると時間波を放つ。']}
};

const PASSIVE_TEXT = {
  magnet:{ko:['자석 코어','결정 흡수 범위 +34, 끌어오는 속도 증가.'],en:['Magnet Core','Pickup range +34 and faster attraction.'],ja:['マグネットコア','回収範囲+34、吸引速度上昇。']},echo:{ko:['에코 비콘','발사·설치형 장비 복제 확률 +7.5%'],en:['Echo Beacon','Repeat chance for fired and deployed equipment +7.5%'],ja:['エコービーコン','発射・設置型装備の複製確率 +7.5%']},power:{ko:['출력 증폭','모든 피해 +10%'],en:['Power Amplifier','All damage +10%'],ja:['出力増幅','全ダメージ +10%']},haste:{ko:['가속 회로','장비 발동 주기 -7%'],en:['Acceleration Circuit','Equipment interval -7%'],ja:['加速回路','装備発動間隔 -7%']},vitality:{ko:['재생 장갑','최대 체력 +28, 즉시 체력 46 회복'],en:['Regenerative Plating','Max health +28 and restore 46 health'],ja:['再生装甲','最大HP +28、体力46回復']},speed:{ko:['벡터 부스터','이동 속도 +9%'],en:['Vector Booster','Move speed +9%'],ja:['ベクトルブースター','移動速度 +9%']},crit:{ko:['취약점 해석','치명타 확률 +6%'],en:['Weakness Analysis','Critical chance +6%'],ja:['弱点解析','クリティカル率 +6%']},chain:{ko:['연쇄 과부하','연쇄 유지시간과 연쇄 피해 증가.'],en:['Chain Overload','Increases chain duration and chain damage.'],ja:['チェイン過負荷','連鎖維持時間と連鎖ダメージ増加。']},greed:{ko:['개척 계약','적 체력 +10%, 경험치 획득량 +30%'],en:['Frontier Contract','Enemy health +10%, experience gained +30%'],ja:['開拓契約','敵HP +10%、経験値獲得量 +30%']},armor:{ko:['충격 흡수재','받는 피해 -7.5%'],en:['Impact Absorber','Damage taken -7.5%'],ja:['衝撃吸収材','被ダメージ -7.5%']}
};

const STACK_EFFECTS = {
  blade:[['월광 기동','광자 칼날 1개가 기본 궤도를 돈다.'],['쌍월 궤도','반대편에 두 번째 칼날이 생성된다.'],['가속 궤도','회전 속도와 공격 범위가 증가한다.'],['성흔 파동','적중 시 관통 절단파가 발사된다.'],['삼월식','세 번째 칼날이 추가되어 빈틈이 줄어든다.'],['천체 분쇄기','궤도가 확대되고 연속 처치 시 별빛 폭발이 일어난다.']],
  ember:[['첫 별','가장 가까운 적에게 별빛 탄환을 발사한다.'],['쌍성 사격','한 번에 두 발을 발사한다.'],['성핵 관통','별빛 탄환이 적 하나를 추가로 관통한다.'],['성운 분열','적중한 탄환이 세 갈래 별가루로 분열한다.'],['삼중 성렬','한 번에 세 발을 넓게 발사한다.'],['초신성 탄두','주기적으로 거대한 관통 초신성탄을 발사한다.']],
  bulwark:[['방어 위성','받는 피해가 감소하고 위성 하나가 공전한다.'],['연결 장갑','최대 체력과 피해 감소가 더 증가한다.'],['재충전 장갑','일정 시간마다 소량의 보호막을 회복한다.'],['보복 방벽','피격 시 주변 적에게 충격파를 방출한다.'],['요새 핵','보호막 최대치와 재충전량이 증가한다.'],['이동 요새','주기적으로 강한 완전 방어막을 충전한다.']],
  gravity:[['특이점 씨앗','주기적으로 작은 중력 우물을 만든다.'],['조석 고정','흡입 범위와 힘이 증가한다.'],['장수 특이점','우물의 지속시간이 늘어난다.'],['붕괴핵','사건의 지평선 내부에 지속 피해가 생긴다.'],['압축 붕괴','중심 피해와 흡입력이 크게 증가한다.'],['쌍둥이 특이점','서로 교차하는 두 개의 우물을 생성한다.']],
  comet:[['결정창','긴 혜성 창 한 발이 적을 관통한다.'],['이중 궤적','혜성 창이 나란히 두 발 발사된다.'],['심층 관통','창이 더 커지고 추가 적을 관통한다.'],['혜성 파편','관통할 때마다 얼음별 파편을 뿌린다.'],['잔광 궤도','비행 경로에 짧게 남는 피해 지대를 만든다.'],['대충돌','혜성 창이 사라질 때 대형 폭발을 일으킨다.']],
  prism:[['점화 광선','새 표적을 0.5초 조준한 뒤 집속 광선을 발사한다.'],['쌍둥이 프리즘','프리즘 2개가 같은 표적을 함께 집속한다.'],['용광 단계','0.88초 유지 시 ×1.85, 2.18초 유지 시 최대 출력 ×3.70.'],['과열 결정','집속 전환 시간이 0.68초와 1.78초로 단축된다.'],['항성 초점','최대 출력 ×4.10.'],['천구 소각','프리즘 3개, 최대 출력 ×4.45와 1.55초 최종 집속.']],
  chrono:[['느린 시간','주변 적의 이동 속도를 낮춘다.'],['느린 궤도','감속 범위와 효과가 증가한다.'],['시간 가속','플레이어의 모든 무기 주기가 짧아진다.'],['시간 파동','주기적으로 주변 적에게 시간 피해를 준다.'],['찰나 정지','파동에 맞은 적의 시간을 잠시 정지시킨다.'],['영원의 원환','범위와 감속이 크게 증가하고 무기 주기가 더 빨라진다.']]
};

const STACK_EFFECTS_EN={};const STACK_EFFECTS_JA={};const STACK_DESC_EN={};const STACK_DESC_JA={};
function tr(key){const table=TEXT[GAME_SETTINGS.language]||TEXT.en;return table[key]||TEXT.en?.[key]||TEXT.ko?.[key]||key;}
function localizedRow(table,key){return table?.[key]?.[GAME_SETTINGS.language]||table?.[key]?.en||table?.[key]?.ko;}
function weaponText(key){const row=localizedRow(WEAPON_TEXT,key);return{name:row?.[0]||WEAPONS[key]?.name||key,role:row?.[1]||WEAPONS[key]?.role||'',desc:row?.[2]||WEAPONS[key]?.desc||''};}
function passiveText(key){const row=localizedRow(PASSIVE_TEXT,key);return{name:row?.[0]||PASSIVES[key]?.name||key,desc:row?.[1]||PASSIVES[key]?.desc||''};}
function stackEffectText(key,stack){const row=STACK_EFFECTS[key]?.[Math.max(0,Math.min(5,stack-1))]||['',''];return{name:row[0],desc:row[1]};}