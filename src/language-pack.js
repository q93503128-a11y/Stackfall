const STACKFALL_SUPPORTED_LANGUAGES=['ko','en','ja','zh-CN','es','fr'];
try{
  const saved=JSON.parse(localStorage.getItem('stackfall.settings')||'{}');
  if(STACKFALL_SUPPORTED_LANGUAGES.includes(saved.language))GAME_SETTINGS.language=saved.language;
  GAME_SETTINGS.damageNumbers=typeof saved.damageNumbers==='boolean'?saved.damageNumbers:true;
  GAME_SETTINGS.screenShake=typeof saved.screenShake==='boolean'?saved.screenShake:true;
}catch{GAME_SETTINGS.damageNumbers=true;GAME_SETTINGS.screenShake=true;}

Object.assign(TEXT.ko,{'choice.basic':'기본 무기','choice.new':'신규','choice.upgrade':'중첩 강화','choice.current':'현재','choice.next':'선택 후','choice.attackRole':'공격 장비','choice.growthRole':'성장 패시브','settings.damageNumbers':'피해량 표시','settings.screenShake':'화면 흔들림'});
Object.assign(TEXT.en,{'choice.basic':'BASIC WEAPON','choice.new':'NEW','choice.upgrade':'STACK UPGRADE','choice.current':'CURRENT','choice.next':'AFTER','choice.attackRole':'ATTACK GEAR','choice.growthRole':'GROWTH PASSIVE','settings.damageNumbers':'DAMAGE NUMBERS','settings.screenShake':'SCREEN SHAKE'});
Object.assign(TEXT.ja,{'choice.basic':'基本武器','choice.new':'新規','choice.upgrade':'重ね強化','choice.current':'現在','choice.next':'選択後','choice.attackRole':'攻撃装備','choice.growthRole':'成長パッシブ','settings.damageNumbers':'ダメージ表示','settings.screenShake':'画面振動'});
TEXT['zh-CN']={
  'menu.startEquipment':'初始装备','menu.start':'开始运行','menu.settings':'设置','hud.core':'核心','hud.threat':'威胁','hud.chain':'连击',
  'choice.kicker':'系统重构','choice.title':'升级','choice.prompt':'选择一项','choice.equipment':'装备','choice.passive':'被动','choice.basic':'基础武器','choice.stack':'叠加','choice.owned':'持有','choice.new':'新装备','choice.upgrade':'叠加强化','choice.current':'当前','choice.next':'选择后','choice.attackRole':'攻击装备','choice.growthRole':'成长被动',
  'banner.resonance':'共鸣','banner.stack':'叠加效果','pause.title':'暂停','pause.resume':'继续','pause.restart':'重新开始','pause.menu':'主菜单','pause.settings':'设置',
  'gameover.title':'运行结束','gameover.time':'生存时间','gameover.kills':'击杀','gameover.combo':'最高连击','gameover.level':'到达等级','gameover.retry':'再试一次','gameover.menu':'主菜单',
  'settings.title':'设置','settings.language':'语言','settings.master':'全部声音','settings.combat':'战斗音效','settings.ui':'界面音效','settings.ambient':'宇宙环境音','settings.damageNumbers':'伤害数字','settings.screenShake':'画面震动','settings.close':'关闭',
  'boss.warning':'警告','boss.approaching':'首领接近','boss.rift':'检测到裂隙','boss.eclipse':'日蚀君主','boss.seraph':'星云炽天使','boss.mini':'裂隙骑士','empty':'空'
};
TEXT.es={
  'menu.startEquipment':'EQUIPO INICIAL','menu.start':'INICIAR','menu.settings':'AJUSTES','hud.core':'NÚCLEO','hud.threat':'AMENAZA','hud.chain':'CADENA',
  'choice.kicker':'REESCRITURA DEL SISTEMA','choice.title':'SUBIR NIVEL','choice.prompt':'Elige uno','choice.equipment':'EQUIPO','choice.passive':'PASIVA','choice.basic':'ARMA BÁSICA','choice.stack':'ACUMULACIÓN','choice.owned':'POSEÍDO','choice.new':'NUEVO','choice.upgrade':'MEJORA','choice.current':'ACTUAL','choice.next':'DESPUÉS','choice.attackRole':'EQUIPO DE ATAQUE','choice.growthRole':'PASIVA DE CRECIMIENTO',
  'banner.resonance':'RESONANCIA','banner.stack':'EFECTO DE ACUMULACIÓN','pause.title':'PAUSA','pause.resume':'CONTINUAR','pause.restart':'REINICIAR PARTIDA','pause.menu':'MENÚ PRINCIPAL','pause.settings':'AJUSTES',
  'gameover.title':'FIN DE PARTIDA','gameover.time':'SUPERVIVENCIA','gameover.kills':'BAJAS','gameover.combo':'CADENA MÁXIMA','gameover.level':'NIVEL','gameover.retry':'REINTENTAR','gameover.menu':'MENÚ PRINCIPAL',
  'settings.title':'AJUSTES','settings.language':'IDIOMA','settings.master':'SONIDO GENERAL','settings.combat':'EFECTOS DE COMBATE','settings.ui':'EFECTOS DE UI','settings.ambient':'AMBIENTE ESPACIAL','settings.damageNumbers':'NÚMEROS DE DAÑO','settings.screenShake':'VIBRACIÓN DE PANTALLA','settings.close':'CERRAR',
  'boss.warning':'ALERTA','boss.approaching':'JEFE ACERCÁNDOSE','boss.rift':'GRIETA DETECTADA','boss.eclipse':'Señor del Eclipse','boss.seraph':'Serafín de la Nebulosa','boss.mini':'Caballero de la Grieta','empty':'VACÍO'
};
TEXT.fr={
  'menu.startEquipment':'ÉQUIPEMENT INITIAL','menu.start':'DÉMARRER','menu.settings':'PARAMÈTRES','hud.core':'NOYAU','hud.threat':'MENACE','hud.chain':'CHAÎNE',
  'choice.kicker':'RÉÉCRITURE DU SYSTÈME','choice.title':'NIVEAU SUPÉRIEUR','choice.prompt':'Choisissez-en un','choice.equipment':'ÉQUIPEMENT','choice.passive':'PASSIF','choice.basic':'ARME DE BASE','choice.stack':'CUMUL','choice.owned':'POSSÉDÉ','choice.new':'NOUVEAU','choice.upgrade':'AMÉLIORATION','choice.current':'ACTUEL','choice.next':'APRÈS','choice.attackRole':'ÉQUIPEMENT D’ATTAQUE','choice.growthRole':'PASSIF DE CROISSANCE',
  'banner.resonance':'RÉSONANCE','banner.stack':'EFFET DE CUMUL','pause.title':'PAUSE','pause.resume':'REPRENDRE','pause.restart':'RECOMMENCER','pause.menu':'MENU PRINCIPAL','pause.settings':'PARAMÈTRES',
  'gameover.title':'FIN DE PARTIE','gameover.time':'SURVIE','gameover.kills':'ÉLIMINATIONS','gameover.combo':'CHAÎNE MAX','gameover.level':'NIVEAU','gameover.retry':'RÉESSAYER','gameover.menu':'MENU PRINCIPAL',
  'settings.title':'PARAMÈTRES','settings.language':'LANGUE','settings.master':'SON GÉNÉRAL','settings.combat':'EFFETS DE COMBAT','settings.ui':'EFFETS UI','settings.ambient':'AMBIANCE SPATIALE','settings.damageNumbers':'CHIFFRES DE DÉGÂTS','settings.screenShake':'SECOUSSE D’ÉCRAN','settings.close':'FERMER',
  'boss.warning':'ALERTE','boss.approaching':'BOSS EN APPROCHE','boss.rift':'FAILLE DÉTECTÉE','boss.eclipse':'Seigneur de l’Éclipse','boss.seraph':'Séraphin de la Nébuleuse','boss.mini':'Chevalier de la Faille','empty':'VIDE'
};

Object.assign(TEXT['zh-CN'],{
  'gameover.damage.title':'伤害分析','gameover.damage.total':'总伤害','gameover.damage.average':'平均 DPS','gameover.damage.peak':'最高区间 DPS','gameover.damage.breakdown':'装备伤害','gameover.damage.trend':'伤害走势','gameover.damage.other':'其他效果','gameover.damage.mvp':'MVP','gameover.damage.empty':'暂无伤害记录'
});
Object.assign(TEXT.es,{
  'gameover.damage.title':'ANÁLISIS DE DAÑO','gameover.damage.total':'DAÑO TOTAL','gameover.damage.average':'DPS MEDIO','gameover.damage.peak':'PICO DE DPS','gameover.damage.breakdown':'DAÑO POR EQUIPO','gameover.damage.trend':'TENDENCIA DE DAÑO','gameover.damage.other':'OTROS EFECTOS','gameover.damage.mvp':'MVP','gameover.damage.empty':'SIN DAÑO REGISTRADO'
});
Object.assign(TEXT.fr,{
  'gameover.damage.title':'ANALYSE DES DÉGÂTS','gameover.damage.total':'DÉGÂTS TOTAUX','gameover.damage.average':'DPS MOYEN','gameover.damage.peak':'PIC DE DPS','gameover.damage.breakdown':'DÉGÂTS PAR ÉQUIPEMENT','gameover.damage.trend':'ÉVOLUTION DES DÉGÂTS','gameover.damage.other':'AUTRES EFFETS','gameover.damage.mvp':'MVP','gameover.damage.empty':'AUCUN DÉGÂT ENREGISTRÉ'
});

Object.assign(TEXT.ko,{
  'menu.endless':'ENDLESS','menu.stageMap':'은하 지도','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'은하 작전 지도','stageMap.planned':'잠김','stageMap.available':'출격 가능','stageMap.cleared':'클리어','stageMap.locked':'잠김','stageMap.time':'예상 작전 시간','stageMap.threat':'위협도','stageMap.gimmicks':'기믹','stageMap.weapons':'무기','stageMap.events':'이벤트','stageMap.boss':'보스','stageMap.launch':'출격','stageMap.building':'출격 불가','stageMap.hint':'노드를 선택하면 해당 작전의 정보가 표시됩니다.'
});
Object.assign(TEXT.en,{
  'menu.endless':'ENDLESS','menu.stageMap':'GALAXY MAP','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'GALACTIC OPERATIONS','stageMap.planned':'LOCKED','stageMap.available':'AVAILABLE','stageMap.cleared':'CLEARED','stageMap.locked':'LOCKED','stageMap.time':'EST. OPERATION','stageMap.threat':'THREAT','stageMap.gimmicks':'GIMMICKS','stageMap.weapons':'WEAPONS','stageMap.events':'EVENTS','stageMap.boss':'BOSS','stageMap.launch':'DEPLOY','stageMap.building':'UNAVAILABLE','stageMap.hint':'Select a node to inspect the operation.'
});
Object.assign(TEXT.ja,{
  'menu.endless':'ENDLESS','menu.stageMap':'銀河マップ','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'銀河作戦マップ','stageMap.planned':'ロック','stageMap.available':'出撃可能','stageMap.cleared':'クリア','stageMap.locked':'ロック','stageMap.time':'予想作戦時間','stageMap.threat':'脅威度','stageMap.gimmicks':'ギミック','stageMap.weapons':'武器','stageMap.events':'イベント','stageMap.boss':'ボス','stageMap.launch':'出撃','stageMap.building':'出撃不可','stageMap.hint':'ノードを選ぶと作戦情報を確認できます。'
});
Object.assign(TEXT['zh-CN'],{
  'menu.endless':'ENDLESS','menu.stageMap':'银河地图','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'银河作战地图','stageMap.planned':'已锁定','stageMap.available':'可出击','stageMap.cleared':'已通关','stageMap.locked':'已锁定','stageMap.time':'预计作战时间','stageMap.threat':'威胁度','stageMap.gimmicks':'机制','stageMap.weapons':'武器','stageMap.events':'事件','stageMap.boss':'首领','stageMap.launch':'出击','stageMap.building':'无法出击','stageMap.hint':'选择节点以查看作战信息。'
});
Object.assign(TEXT.es,{
  'menu.endless':'ENDLESS','menu.stageMap':'MAPA GALÁCTICO','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'OPERACIONES GALÁCTICAS','stageMap.planned':'BLOQUEADO','stageMap.available':'DISPONIBLE','stageMap.cleared':'SUPERADO','stageMap.locked':'BLOQUEADO','stageMap.time':'DURACIÓN EST.','stageMap.threat':'AMENAZA','stageMap.gimmicks':'MECÁNICAS','stageMap.weapons':'ARMAS','stageMap.events':'EVENTOS','stageMap.boss':'JEFE','stageMap.launch':'DESPLEGAR','stageMap.building':'NO DISPONIBLE','stageMap.hint':'Selecciona un nodo para ver la operación.'
});
Object.assign(TEXT.fr,{
  'menu.endless':'ENDLESS','menu.stageMap':'CARTE GALACTIQUE','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'OPÉRATIONS GALACTIQUES','stageMap.planned':'VERROUILLÉ','stageMap.available':'DISPONIBLE','stageMap.cleared':'TERMINÉ','stageMap.locked':'VERROUILLÉ','stageMap.time':'DURÉE EST.','stageMap.threat':'MENACE','stageMap.gimmicks':'MÉCANIQUES','stageMap.weapons':'ARMES','stageMap.events':'ÉVÉNEMENTS','stageMap.boss':'BOSS','stageMap.launch':'DÉPLOYER','stageMap.building':'INDISPONIBLE','stageMap.hint':'Sélectionnez un nœud pour afficher l’opération.'
});

Object.assign(TEXT.ko,{
  'stage01.enemy.shardling':'파편 포식체','stage01.enemy.dart':'균열 추적체','stage01.enemy.bombardier':'잔해 포격체','stage01.enemy.bulwark':'붕괴 보루','stage01.boss':'붕괴의 전초 수호자','stage01.boss.warning':'최종 수호자 접근',
  'stage01.event.warning':'붕괴 경보','stage01.event.fixed':'고정 작전 사건','stage01.event.collapse':'붕괴 파동','stage01.event.rush':'파편 급류','stage01.event.bombardment':'잔해 포격','stage01.event.wardenLine':'전초 수호대',
  'stage01.objective.next':'보스 출현까지','stage01.objective.boss':'최종 목표 · 전초 수호자 격파',
  'stageClear.kicker':'OPERATION COMPLETE','stageClear.title':'스테이지 클리어','stageClear.time':'작전 시간','stageClear.kills':'처치','stageClear.unlock':'신규 무기 해금','stageClear.rewardDone':'이미 획득한 작전 보상입니다.','stageClear.map':'은하 지도로','stageClear.menu':'메인 메뉴'
});
Object.assign(TEXT.en,{
  'stage01.enemy.shardling':'Shard Feeder','stage01.enemy.dart':'Rift Dart','stage01.enemy.bombardier':'Debris Bombardier','stage01.enemy.bulwark':'Collapse Bulwark','stage01.boss':'Collapse Frontier Warden','stage01.boss.warning':'FINAL WARDEN APPROACHING',
  'stage01.event.warning':'COLLAPSE WARNING','stage01.event.fixed':'FIXED OPERATION EVENT','stage01.event.collapse':'Collapse Pulse','stage01.event.rush':'Shard Rush','stage01.event.bombardment':'Debris Bombardment','stage01.event.wardenLine':'Frontier Guard Line',
  'stage01.objective.next':'BOSS IN','stage01.objective.boss':'FINAL OBJECTIVE · DEFEAT THE WARDEN',
  'stageClear.kicker':'OPERATION COMPLETE','stageClear.title':'STAGE CLEAR','stageClear.time':'OPERATION TIME','stageClear.kills':'KILLS','stageClear.unlock':'NEW WEAPON UNLOCKED','stageClear.rewardDone':'Operation reward already acquired.','stageClear.map':'GALAXY MAP','stageClear.menu':'MAIN MENU'
});
Object.assign(TEXT.ja,{
  'stage01.enemy.shardling':'破片捕食体','stage01.enemy.dart':'亀裂追跡体','stage01.enemy.bombardier':'残骸砲撃体','stage01.enemy.bulwark':'崩壊防塁','stage01.boss':'崩壊前線の守護者','stage01.boss.warning':'最終守護者接近',
  'stage01.event.warning':'崩壊警報','stage01.event.fixed':'固定作戦イベント','stage01.event.collapse':'崩壊波動','stage01.event.rush':'破片急流','stage01.event.bombardment':'残骸砲撃','stage01.event.wardenLine':'前線守備隊',
  'stage01.objective.next':'ボス出現まで','stage01.objective.boss':'最終目標・守護者を撃破',
  'stageClear.kicker':'OPERATION COMPLETE','stageClear.title':'ステージクリア','stageClear.time':'作戦時間','stageClear.kills':'撃破','stageClear.unlock':'新武器解放','stageClear.rewardDone':'作戦報酬は取得済みです。','stageClear.map':'銀河マップへ','stageClear.menu':'メインメニュー'
});
Object.assign(TEXT['zh-CN'],{
  'stage01.enemy.shardling':'碎片吞噬体','stage01.enemy.dart':'裂隙追踪体','stage01.enemy.bombardier':'残骸炮击体','stage01.enemy.bulwark':'崩塌壁垒','stage01.boss':'崩塌前线守卫','stage01.boss.warning':'最终守卫接近',
  'stage01.event.warning':'崩塌警报','stage01.event.fixed':'固定作战事件','stage01.event.collapse':'崩塌脉冲','stage01.event.rush':'碎片洪流','stage01.event.bombardment':'残骸炮击','stage01.event.wardenLine':'前线守卫队',
  'stage01.objective.next':'首领出现倒计时','stage01.objective.boss':'最终目标 · 击败前线守卫',
  'stageClear.kicker':'OPERATION COMPLETE','stageClear.title':'关卡完成','stageClear.time':'作战时间','stageClear.kills':'击杀','stageClear.unlock':'新武器已解锁','stageClear.rewardDone':'作战奖励已获得。','stageClear.map':'返回银河地图','stageClear.menu':'主菜单'
});
Object.assign(TEXT.es,{
  'stage01.enemy.shardling':'Devorador de Fragmentos','stage01.enemy.dart':'Rastreador de Grieta','stage01.enemy.bombardier':'Bombardero de Escombros','stage01.enemy.bulwark':'Baluarte de Colapso','stage01.boss':'Guardián de la Frontera','stage01.boss.warning':'GUARDIÁN FINAL ACERCÁNDOSE',
  'stage01.event.warning':'ALERTA DE COLAPSO','stage01.event.fixed':'EVENTO FIJO','stage01.event.collapse':'Pulso de Colapso','stage01.event.rush':'Oleada de Fragmentos','stage01.event.bombardment':'Bombardeo de Escombros','stage01.event.wardenLine':'Línea de Guardia',
  'stage01.objective.next':'JEFE EN','stage01.objective.boss':'OBJETIVO FINAL · DERROTA AL GUARDIÁN',
  'stageClear.kicker':'OPERATION COMPLETE','stageClear.title':'ETAPA SUPERADA','stageClear.time':'TIEMPO','stageClear.kills':'BAJAS','stageClear.unlock':'NUEVA ARMA DESBLOQUEADA','stageClear.rewardDone':'Recompensa ya obtenida.','stageClear.map':'MAPA GALÁCTICO','stageClear.menu':'MENÚ PRINCIPAL'
});
Object.assign(TEXT.fr,{
  'stage01.enemy.shardling':'Dévoreur d’Éclats','stage01.enemy.dart':'Traqueur de Faille','stage01.enemy.bombardier':'Bombardier de Débris','stage01.enemy.bulwark':'Rempart d’Effondrement','stage01.boss':'Gardien de la Frontière','stage01.boss.warning':'GARDIEN FINAL EN APPROCHE',
  'stage01.event.warning':'ALERTE D’EFFONDREMENT','stage01.event.fixed':'ÉVÉNEMENT FIXE','stage01.event.collapse':'Onde d’Effondrement','stage01.event.rush':'Ruée d’Éclats','stage01.event.bombardment':'Bombardement de Débris','stage01.event.wardenLine':'Ligne de Garde',
  'stage01.objective.next':'BOSS DANS','stage01.objective.boss':'OBJECTIF FINAL · VAINCRE LE GARDIEN',
  'stageClear.kicker':'OPERATION COMPLETE','stageClear.title':'STAGE TERMINÉ','stageClear.time':'DURÉE','stageClear.kills':'ÉLIMINATIONS','stageClear.unlock':'NOUVELLE ARME DÉBLOQUÉE','stageClear.rewardDone':'Récompense déjà obtenue.','stageClear.map':'CARTE GALACTIQUE','stageClear.menu':'MENU PRINCIPAL'
});

Object.assign(TEXT.ko,{
  'menu.endless':'엔드리스','menu.stageMap':'은하 작전','menu.chooseMode':'어떤 항로로 출격할지 선택하세요.','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'고유한 공간과 보스를 가진 유한 작전을 진행합니다.','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'모든 적과 이벤트가 뒤섞이는 끝없는 항해에 도전합니다.',
  'stageMap.gameTime':'게임 시간','stageMap.unlockable':'해금 가능','stageMap.weaponProgress':'무기','stageMap.minutes':'{n}분','stageMap.none':'없음','stageMap.launch':'출격 준비',
  'sortie.title':'출격 준비','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'은하 작전','sortie.endlessMode':'엔드리스','sortie.endlessTitle':'끝없는 항해','sortie.endlessDesc':'정해진 종료 없이 모든 적군과 월드 이벤트, 초월체가 이어지는 무한 생존 항해.','sortie.time':'게임 시간','sortie.difficulty':'난이도','sortie.minutes':'{n}분','sortie.noLimit':'무제한','sortie.back':'뒤로','sortie.launch':'출격','sortie.difficulty.easy':'쉬움','sortie.difficulty.normal':'보통','sortie.difficulty.hard':'어려움',
  'stageClear.targetDown':'수호자 붕괴','stageClear.operationComplete':'작전 완료'
});
Object.assign(TEXT.en,{
  'menu.endless':'ENDLESS','menu.stageMap':'GALACTIC OPERATIONS','menu.chooseMode':'Choose your route.','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'Enter finite operations with distinct regions and bosses.','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'Survive an endless route where every enemy and event can appear.',
  'stageMap.gameTime':'GAME TIME','stageMap.unlockable':'UNLOCKABLE','stageMap.weaponProgress':'WEAPON','stageMap.minutes':'{n} min','stageMap.none':'NONE','stageMap.launch':'PREPARE SORTIE',
  'sortie.title':'SORTIE PREPARATION','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'GALACTIC OPERATION','sortie.endlessMode':'ENDLESS','sortie.endlessTitle':'Endless Voyage','sortie.endlessDesc':'An unlimited survival route with the full enemy roster, world events, and recurring Apex threats.','sortie.time':'GAME TIME','sortie.difficulty':'DIFFICULTY','sortie.minutes':'{n} min','sortie.noLimit':'UNLIMITED','sortie.back':'BACK','sortie.launch':'LAUNCH','sortie.difficulty.easy':'EASY','sortie.difficulty.normal':'NORMAL','sortie.difficulty.hard':'HARD',
  'stageClear.targetDown':'WARDEN COLLAPSED','stageClear.operationComplete':'OPERATION COMPLETE'
});
Object.assign(TEXT.ja,{
  'menu.endless':'エンドレス','menu.stageMap':'銀河作戦','menu.chooseMode':'出撃する航路を選択してください。','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'固有の空間とボスを持つ有限作戦へ出撃します。','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'すべての敵とイベントが混ざる終わりなき航路に挑みます。',
  'stageMap.gameTime':'ゲーム時間','stageMap.unlockable':'解放可能','stageMap.weaponProgress':'武器','stageMap.minutes':'{n}分','stageMap.none':'なし','stageMap.launch':'出撃準備',
  'sortie.title':'出撃準備','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'銀河作戦','sortie.endlessMode':'エンドレス','sortie.endlessTitle':'終わりなき航海','sortie.endlessDesc':'全敵勢力・ワールドイベント・超越体が続く無制限サバイバル航路。','sortie.time':'ゲーム時間','sortie.difficulty':'難易度','sortie.minutes':'{n}分','sortie.noLimit':'無制限','sortie.back':'戻る','sortie.launch':'出撃','sortie.difficulty.easy':'簡単','sortie.difficulty.normal':'普通','sortie.difficulty.hard':'難しい',
  'stageClear.targetDown':'守護者崩壊','stageClear.operationComplete':'作戦完了'
});
Object.assign(TEXT['zh-CN'],{
  'menu.endless':'无尽模式','menu.stageMap':'银河作战','menu.chooseMode':'选择要出击的航路。','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'进入拥有独特区域与首领的有限作战。','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'挑战所有敌人与事件都会出现的无尽航路。',
  'stageMap.gameTime':'游戏时间','stageMap.unlockable':'可解锁','stageMap.weaponProgress':'武器','stageMap.minutes':'{n}分钟','stageMap.none':'无','stageMap.launch':'出击准备',
  'sortie.title':'出击准备','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'银河作战','sortie.endlessMode':'无尽模式','sortie.endlessTitle':'无尽航行','sortie.endlessDesc':'所有敌人、世界事件与超越体持续出现的无限生存航路。','sortie.time':'游戏时间','sortie.difficulty':'难度','sortie.minutes':'{n}分钟','sortie.noLimit':'无限','sortie.back':'返回','sortie.launch':'出击','sortie.difficulty.easy':'简单','sortie.difficulty.normal':'普通','sortie.difficulty.hard':'困难',
  'stageClear.targetDown':'守卫崩解','stageClear.operationComplete':'作战完成'
});
Object.assign(TEXT.es,{
  'menu.endless':'ENDLESS','menu.stageMap':'OPERACIONES GALÁCTICAS','menu.chooseMode':'Elige tu ruta de salida.','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'Entra en operaciones finitas con regiones y jefes propios.','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'Sobrevive una ruta infinita con todos los enemigos y eventos.',
  'stageMap.gameTime':'TIEMPO DE JUEGO','stageMap.unlockable':'DESBLOQUEABLE','stageMap.weaponProgress':'ARMA','stageMap.minutes':'{n} min','stageMap.none':'NINGUNO','stageMap.launch':'PREPARAR SALIDA',
  'sortie.title':'PREPARAR SALIDA','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'OPERACIÓN GALÁCTICA','sortie.endlessMode':'ENDLESS','sortie.endlessTitle':'Viaje Infinito','sortie.endlessDesc':'Ruta de supervivencia ilimitada con todos los enemigos, eventos y amenazas Apex.','sortie.time':'TIEMPO DE JUEGO','sortie.difficulty':'DIFICULTAD','sortie.minutes':'{n} min','sortie.noLimit':'ILIMITADO','sortie.back':'VOLVER','sortie.launch':'SALIR','sortie.difficulty.easy':'FÁCIL','sortie.difficulty.normal':'NORMAL','sortie.difficulty.hard':'DIFÍCIL',
  'stageClear.targetDown':'GUARDIÁN COLAPSADO','stageClear.operationComplete':'OPERACIÓN COMPLETA'
});
Object.assign(TEXT.fr,{
  'menu.endless':'ENDLESS','menu.stageMap':'OPÉRATIONS GALACTIQUES','menu.chooseMode':'Choisissez votre route de sortie.','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'Lancez des opérations finies avec des zones et des boss distincts.','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'Survivez à une route infinie mêlant tous les ennemis et événements.',
  'stageMap.gameTime':'TEMPS DE JEU','stageMap.unlockable':'À DÉBLOQUER','stageMap.weaponProgress':'ARME','stageMap.minutes':'{n} min','stageMap.none':'AUCUN','stageMap.launch':'PRÉPARER LA SORTIE',
  'sortie.title':'PRÉPARATION','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'OPÉRATION GALACTIQUE','sortie.endlessMode':'ENDLESS','sortie.endlessTitle':'Voyage Sans Fin','sortie.endlessDesc':'Route de survie illimitée avec tous les ennemis, événements et menaces Apex.','sortie.time':'TEMPS DE JEU','sortie.difficulty':'DIFFICULTÉ','sortie.minutes':'{n} min','sortie.noLimit':'ILLIMITÉ','sortie.back':'RETOUR','sortie.launch':'LANCER','sortie.difficulty.easy':'FACILE','sortie.difficulty.normal':'NORMAL','sortie.difficulty.hard':'DIFFICILE',
  'stageClear.targetDown':'GARDIEN EFFONDRÉ','stageClear.operationComplete':'OPÉRATION TERMINÉE'
});

Object.assign(TEXT.ko,{
  'profile.local':'LOCAL PILOT','profile.name':'개척자','profile.clears':'클리어',
  'menu.upgradeKicker':'CORE DEVELOPMENT','menu.upgrade':'코어 성장','menu.upgradeDesc':'재화를 사용해 영구 능력과 장착 슬롯을 확장합니다.',
  'currency.stardust':'성진','currency.coreShard':'코어 조각','currency.earned':'획득 재화',
  'upgrade.kicker':'CORE DEVELOPMENT','upgrade.title':'코어 성장','upgrade.subtitle':'중앙 코어를 중심으로 영구 성장을 확장합니다.','upgrade.level':'레벨','upgrade.buy':'업그레이드','upgrade.maxed':'최대 레벨','upgrade.insufficient':'재화가 부족합니다.','upgrade.requires':'선행 업그레이드 필요 · {n}',
  'upgrade.vitality.name':'생명 코어','upgrade.vitality.desc':'코어 외피를 강화해 모든 런의 최대 체력을 높인다.','upgrade.vitality.effect':'영구 최대 체력 +{n}%',
  'upgrade.output.name':'출력 증폭기','upgrade.output.desc':'기본 출력 회로를 증폭해 모든 공격 피해를 높인다.','upgrade.output.effect':'영구 피해 +{n}%',
  'upgrade.cycle.name':'가속 동기화','upgrade.cycle.desc':'무기 발동 회로의 지연을 줄여 공격 주기를 단축한다.','upgrade.cycle.effect':'영구 공격 주기 -{n}%',
  'upgrade.magnet.name':'회수 자장','upgrade.magnet.desc':'결정과 경험치를 끌어당기는 기본 자장을 확장한다.','upgrade.magnet.effect':'영구 흡수 반경 +{n}',
  'upgrade.salvage.name':'성진 회수기','upgrade.salvage.desc':'작전 종료와 엘리트 격파에서 회수하는 성진의 양을 늘린다.','upgrade.salvage.effect':'성진 획득량 +{n}%',
  'upgrade.armor.name':'충격 격자','upgrade.armor.desc':'코어 프레임의 충격 분산율을 높여 받는 피해를 줄인다.','upgrade.armor.effect':'영구 피해 감소 +{n}%',
  'upgrade.slot5.name':'장착 슬롯 V','upgrade.slot5.desc':'기본 무기를 제외한 장비 슬롯을 4칸에서 5칸으로 확장한다.','upgrade.slot5.effect':'장비 슬롯 5칸 해금',
  'upgrade.slot6.name':'장착 슬롯 VI','upgrade.slot6.desc':'장비 슬롯을 최종 6칸으로 확장한다.','upgrade.slot6.effect':'장비 슬롯 6칸 해금'
});
Object.assign(TEXT.en,{
  'profile.local':'LOCAL PILOT','profile.name':'Pioneer','profile.clears':'CLEARS',
  'menu.upgradeKicker':'CORE DEVELOPMENT','menu.upgrade':'CORE DEVELOPMENT','menu.upgradeDesc':'Spend recovered resources on permanent stats and equipment slots.',
  'currency.stardust':'STARDUST','currency.coreShard':'CORE SHARD','currency.earned':'RECOVERED',
  'upgrade.kicker':'CORE DEVELOPMENT','upgrade.title':'CORE DEVELOPMENT','upgrade.subtitle':'Expand permanent growth around the central core.','upgrade.level':'LEVEL','upgrade.buy':'UPGRADE','upgrade.maxed':'MAX LEVEL','upgrade.insufficient':'Insufficient resources.','upgrade.requires':'Requires · {n}',
  'upgrade.vitality.name':'Vital Core','upgrade.vitality.desc':'Reinforce the core shell to increase maximum health in every run.','upgrade.vitality.effect':'Permanent max HP +{n}%',
  'upgrade.output.name':'Output Amplifier','upgrade.output.desc':'Amplify the base power circuit to increase all outgoing damage.','upgrade.output.effect':'Permanent damage +{n}%',
  'upgrade.cycle.name':'Cycle Sync','upgrade.cycle.desc':'Reduce weapon-system delay and shorten attack cycles.','upgrade.cycle.effect':'Permanent attack cycle -{n}%',
  'upgrade.magnet.name':'Recovery Field','upgrade.magnet.desc':'Expand the core field that draws experience and crystals inward.','upgrade.magnet.effect':'Permanent pickup radius +{n}',
  'upgrade.salvage.name':'Stardust Reclaimer','upgrade.salvage.desc':'Recover more Stardust from completed runs and elite kills.','upgrade.salvage.effect':'Stardust gain +{n}%',
  'upgrade.armor.name':'Impact Lattice','upgrade.armor.desc':'Improve shock dispersion across the core frame.','upgrade.armor.effect':'Permanent damage reduction +{n}%',
  'upgrade.slot5.name':'Equipment Slot V','upgrade.slot5.desc':'Expand non-basic equipment capacity from four slots to five.','upgrade.slot5.effect':'Unlock 5 equipment slots',
  'upgrade.slot6.name':'Equipment Slot VI','upgrade.slot6.desc':'Expand non-basic equipment capacity to the final six slots.','upgrade.slot6.effect':'Unlock 6 equipment slots'
});
Object.assign(TEXT.ja,{
  'profile.local':'LOCAL PILOT','profile.name':'開拓者','profile.clears':'クリア',
  'menu.upgradeKicker':'CORE DEVELOPMENT','menu.upgrade':'コア成長','menu.upgradeDesc':'資源を使って恒久能力と装備スロットを拡張します。',
  'currency.stardust':'星塵','currency.coreShard':'コア欠片','currency.earned':'獲得資源',
  'upgrade.kicker':'CORE DEVELOPMENT','upgrade.title':'コア成長','upgrade.subtitle':'中央コアを中心に恒久成長を拡張します。','upgrade.level':'レベル','upgrade.buy':'強化','upgrade.maxed':'最大レベル','upgrade.insufficient':'資源が不足しています。','upgrade.requires':'前提強化 · {n}',
  'upgrade.vitality.name':'生命コア','upgrade.vitality.desc':'コア外殻を強化し、全ランの最大体力を増加。','upgrade.vitality.effect':'恒久最大体力 +{n}%',
  'upgrade.output.name':'出力増幅器','upgrade.output.desc':'基礎出力回路を増幅し、全攻撃のダメージを増加。','upgrade.output.effect':'恒久ダメージ +{n}%',
  'upgrade.cycle.name':'加速同期','upgrade.cycle.desc':'武器システムの遅延を減らし攻撃周期を短縮。','upgrade.cycle.effect':'恒久攻撃周期 -{n}%',
  'upgrade.magnet.name':'回収磁場','upgrade.magnet.desc':'経験値と結晶を引き寄せる磁場を拡張。','upgrade.magnet.effect':'恒久吸収半径 +{n}',
  'upgrade.salvage.name':'星塵回収器','upgrade.salvage.desc':'作戦終了とエリート撃破で得る星塵を増加。','upgrade.salvage.effect':'星塵獲得量 +{n}%',
  'upgrade.armor.name':'衝撃格子','upgrade.armor.desc':'コアフレームの衝撃分散性能を強化。','upgrade.armor.effect':'恒久被ダメージ軽減 +{n}%',
  'upgrade.slot5.name':'装備スロット V','upgrade.slot5.desc':'基本武器を除く装備枠を4から5へ拡張。','upgrade.slot5.effect':'装備スロット5枠解放',
  'upgrade.slot6.name':'装備スロット VI','upgrade.slot6.desc':'装備枠を最終6枠へ拡張。','upgrade.slot6.effect':'装備スロット6枠解放'
});
Object.assign(TEXT['zh-CN'],{
  'profile.local':'LOCAL PILOT','profile.name':'开拓者','profile.clears':'通关',
  'menu.upgradeKicker':'CORE DEVELOPMENT','menu.upgrade':'核心成长','menu.upgradeDesc':'使用资源强化永久能力并扩展装备槽。',
  'currency.stardust':'星尘','currency.coreShard':'核心碎片','currency.earned':'获得资源',
  'upgrade.kicker':'CORE DEVELOPMENT','upgrade.title':'核心成长','upgrade.subtitle':'围绕中央核心扩展永久成长。','upgrade.level':'等级','upgrade.buy':'升级','upgrade.maxed':'已满级','upgrade.insufficient':'资源不足。','upgrade.requires':'需要前置升级 · {n}',
  'upgrade.vitality.name':'生命核心','upgrade.vitality.desc':'强化核心外壳，提高每次作战的最大生命。','upgrade.vitality.effect':'永久最大生命 +{n}%',
  'upgrade.output.name':'输出增幅器','upgrade.output.desc':'增强基础输出回路，提高所有攻击伤害。','upgrade.output.effect':'永久伤害 +{n}%',
  'upgrade.cycle.name':'加速同步','upgrade.cycle.desc':'降低武器系统延迟，缩短攻击周期。','upgrade.cycle.effect':'永久攻击周期 -{n}%',
  'upgrade.magnet.name':'回收磁场','upgrade.magnet.desc':'扩大吸引经验与结晶的基础磁场。','upgrade.magnet.effect':'永久拾取半径 +{n}',
  'upgrade.salvage.name':'星尘回收器','upgrade.salvage.desc':'提高作战结束和精英击杀获得的星尘。','upgrade.salvage.effect':'星尘获取 +{n}%',
  'upgrade.armor.name':'冲击晶格','upgrade.armor.desc':'提高核心框架的冲击分散能力。','upgrade.armor.effect':'永久减伤 +{n}%',
  'upgrade.slot5.name':'装备槽 V','upgrade.slot5.desc':'将基础武器之外的装备槽从4扩展至5。','upgrade.slot5.effect':'解锁5个装备槽',
  'upgrade.slot6.name':'装备槽 VI','upgrade.slot6.desc':'将装备槽最终扩展至6。','upgrade.slot6.effect':'解锁6个装备槽'
});
Object.assign(TEXT.es,{
  'profile.local':'LOCAL PILOT','profile.name':'Pionero','profile.clears':'COMPLETADAS',
  'menu.upgradeKicker':'CORE DEVELOPMENT','menu.upgrade':'DESARROLLO DEL NÚCLEO','menu.upgradeDesc':'Usa recursos para mejorar estadísticas permanentes y ranuras.',
  'currency.stardust':'POLVO ESTELAR','currency.coreShard':'FRAGMENTO DE NÚCLEO','currency.earned':'RECURSOS',
  'upgrade.kicker':'CORE DEVELOPMENT','upgrade.title':'DESARROLLO DEL NÚCLEO','upgrade.subtitle':'Expande el crecimiento permanente alrededor del núcleo.','upgrade.level':'NIVEL','upgrade.buy':'MEJORAR','upgrade.maxed':'NIVEL MÁX.','upgrade.insufficient':'Recursos insuficientes.','upgrade.requires':'Requiere · {n}',
  'upgrade.vitality.name':'Núcleo Vital','upgrade.vitality.desc':'Refuerza el núcleo para aumentar la vida máxima en cada partida.','upgrade.vitality.effect':'Vida máxima permanente +{n}%',
  'upgrade.output.name':'Amplificador','upgrade.output.desc':'Aumenta la potencia base de todos los ataques.','upgrade.output.effect':'Daño permanente +{n}%',
  'upgrade.cycle.name':'Sincronía','upgrade.cycle.desc':'Reduce el retraso de los sistemas de armas.','upgrade.cycle.effect':'Ciclo de ataque permanente -{n}%',
  'upgrade.magnet.name':'Campo de Recuperación','upgrade.magnet.desc':'Amplía el campo que atrae experiencia y cristales.','upgrade.magnet.effect':'Radio de recogida permanente +{n}',
  'upgrade.salvage.name':'Recolector Estelar','upgrade.salvage.desc':'Recupera más polvo estelar al terminar partidas y vencer élites.','upgrade.salvage.effect':'Ganancia de polvo estelar +{n}%',
  'upgrade.armor.name':'Malla de Impacto','upgrade.armor.desc':'Mejora la dispersión de impactos del armazón.','upgrade.armor.effect':'Reducción de daño permanente +{n}%',
  'upgrade.slot5.name':'Ranura V','upgrade.slot5.desc':'Amplía de cuatro a cinco las ranuras de equipo no básico.','upgrade.slot5.effect':'Desbloquea 5 ranuras',
  'upgrade.slot6.name':'Ranura VI','upgrade.slot6.desc':'Amplía el equipo no básico hasta seis ranuras.','upgrade.slot6.effect':'Desbloquea 6 ranuras'
});
Object.assign(TEXT.fr,{
  'profile.local':'LOCAL PILOT','profile.name':'Pionnier','profile.clears':'TERMINÉES',
  'menu.upgradeKicker':'CORE DEVELOPMENT','menu.upgrade':'DÉVELOPPEMENT DU CŒUR','menu.upgradeDesc':'Dépensez des ressources pour les bonus permanents et les emplacements.',
  'currency.stardust':'POUSSIÈRE D’ÉTOILE','currency.coreShard':'FRAGMENT DE CŒUR','currency.earned':'RESSOURCES',
  'upgrade.kicker':'CORE DEVELOPMENT','upgrade.title':'DÉVELOPPEMENT DU CŒUR','upgrade.subtitle':'Développez la progression permanente autour du cœur central.','upgrade.level':'NIVEAU','upgrade.buy':'AMÉLIORER','upgrade.maxed':'NIVEAU MAX','upgrade.insufficient':'Ressources insuffisantes.','upgrade.requires':'Requiert · {n}',
  'upgrade.vitality.name':'Cœur Vital','upgrade.vitality.desc':'Renforce la coque du cœur et augmente la vie maximale de chaque partie.','upgrade.vitality.effect':'PV max permanents +{n}%',
  'upgrade.output.name':'Amplificateur','upgrade.output.desc':'Amplifie la puissance de base de toutes les attaques.','upgrade.output.effect':'Dégâts permanents +{n}%',
  'upgrade.cycle.name':'Synchronisation','upgrade.cycle.desc':'Réduit le délai des systèmes d’armes.','upgrade.cycle.effect':'Cycle d’attaque permanent -{n}%',
  'upgrade.magnet.name':'Champ de Récupération','upgrade.magnet.desc':'Étend le champ qui attire expérience et cristaux.','upgrade.magnet.effect':'Rayon de collecte permanent +{n}',
  'upgrade.salvage.name':'Récupérateur Stellaire','upgrade.salvage.desc':'Récupère plus de poussière après les parties et les élites.','upgrade.salvage.effect':'Gain de poussière +{n}%',
  'upgrade.armor.name':'Treillis d’Impact','upgrade.armor.desc':'Améliore la dispersion des chocs du châssis.','upgrade.armor.effect':'Réduction permanente des dégâts +{n}%',
  'upgrade.slot5.name':'Emplacement V','upgrade.slot5.desc':'Passe de quatre à cinq emplacements d’équipement hors arme de base.','upgrade.slot5.effect':'Débloque 5 emplacements',
  'upgrade.slot6.name':'Emplacement VI','upgrade.slot6.desc':'Étend l’équipement hors arme de base à six emplacements.','upgrade.slot6.effect':'Débloque 6 emplacements'
});

Object.assign(TEXT.ko,{
  'profile.localSave':'이 진행도는 현재 기기에 저장됩니다.','profile.runs':'총 출격','profile.kills':'누적 처치','profile.slots':'장비 슬롯','profile.weapons':'해금 무기','profile.bestStage1':'Stage 1 최고 기록'
});
Object.assign(TEXT.en,{
  'profile.localSave':'Progress is currently stored on this device.','profile.runs':'TOTAL RUNS','profile.kills':'TOTAL KILLS','profile.slots':'EQUIPMENT SLOTS','profile.weapons':'UNLOCKED WEAPONS','profile.bestStage1':'STAGE 1 BEST'
});
Object.assign(TEXT.ja,{
  'profile.localSave':'進行状況は現在この端末に保存されます。','profile.runs':'総出撃','profile.kills':'累計撃破','profile.slots':'装備スロット','profile.weapons':'解放武器','profile.bestStage1':'STAGE 1 ベスト'
});
Object.assign(TEXT['zh-CN'],{
  'profile.localSave':'当前进度保存在此设备上。','profile.runs':'总出击','profile.kills':'累计击杀','profile.slots':'装备槽','profile.weapons':'已解锁武器','profile.bestStage1':'STAGE 1 最佳记录'
});
Object.assign(TEXT.es,{
  'profile.localSave':'El progreso se guarda actualmente en este dispositivo.','profile.runs':'PARTIDAS','profile.kills':'BAJAS TOTALES','profile.slots':'RANURAS','profile.weapons':'ARMAS DESBLOQUEADAS','profile.bestStage1':'MEJOR STAGE 1'
});
Object.assign(TEXT.fr,{
  'profile.localSave':'La progression est actuellement enregistrée sur cet appareil.','profile.runs':'SORTIES','profile.kills':'ÉLIMINATIONS','profile.slots':'EMPLACEMENTS','profile.weapons':'ARMES DÉBLOQUÉES','profile.bestStage1':'MEILLEUR STAGE 1'
});

Object.assign(TEXT.ko,{
  'stage05.enemy.conduitLeech':'도체 기생체','stage05.boss':'쌍극 왕관','stage05.boss.warning':'자기폭풍 중심핵이 극성을 고정합니다','stage05.event.breach':'도체 균열','stage05.event.chargedFlight':'대전 비행단','stage05.event.arc':'자기선 방전','stage05.event.reversal':'극성 반전','stage05.event.collapse':'자기폭풍 붕괴','stage05.event.warning':'고에너지 자기장이 전장을 가릅니다','stage05.event.fixed':'고정 사건','stage05.objective.boss':'쌍극 왕관을 파괴하라'
});
Object.assign(TEXT.en,{
  'stage05.enemy.conduitLeech':'Conduit Leech','stage05.boss':'Dipole Crown','stage05.boss.warning':'THE MAGNETAR CORE LOCKS ITS POLARITY','stage05.event.breach':'CONDUIT BREACH','stage05.event.chargedFlight':'CHARGED FLIGHT','stage05.event.arc':'MAGNETIC ARC','stage05.event.reversal':'POLARITY REVERSAL','stage05.event.collapse':'MAGNETAR COLLAPSE','stage05.event.warning':'HIGH-ENERGY FIELD LINES CUT THE BATTLEFIELD','stage05.event.fixed':'FIXED EVENT','stage05.objective.boss':'DESTROY THE DIPOLE CROWN'
});
Object.assign(TEXT.ja,{
  'stage05.enemy.conduitLeech':'導体寄生体','stage05.boss':'双極冠','stage05.boss.warning':'マグネター中枢が極性を固定します','stage05.event.breach':'導体亀裂','stage05.event.chargedFlight':'帯電飛行隊','stage05.event.arc':'磁力線放電','stage05.event.reversal':'極性反転','stage05.event.collapse':'マグネター崩壊','stage05.event.warning':'高エネルギー磁場が戦場を切り裂きます','stage05.event.fixed':'固定イベント','stage05.objective.boss':'双極冠を破壊せよ'
});
Object.assign(TEXT['zh-CN'],{
  'stage05.enemy.conduitLeech':'导体寄生体','stage05.boss':'双极王冠','stage05.boss.warning':'磁星核心正在锁定极性','stage05.event.breach':'导体裂口','stage05.event.chargedFlight':'带电飞行队','stage05.event.arc':'磁力线放电','stage05.event.reversal':'极性反转','stage05.event.collapse':'磁星崩塌','stage05.event.warning':'高能磁场正在切割战场','stage05.event.fixed':'固定事件','stage05.objective.boss':'摧毁双极王冠'
});
Object.assign(TEXT.es,{
  'stage05.enemy.conduitLeech':'Sanguijuela Conductora','stage05.boss':'Corona Dipolar','stage05.boss.warning':'EL NÚCLEO MAGNETAR FIJA SU POLARIDAD','stage05.event.breach':'BRECHA CONDUCTORA','stage05.event.chargedFlight':'VUELO CARGADO','stage05.event.arc':'ARCO MAGNÉTICO','stage05.event.reversal':'INVERSIÓN DE POLARIDAD','stage05.event.collapse':'COLAPSO MAGNETAR','stage05.event.warning':'LAS LÍNEAS MAGNÉTICAS CORTAN EL CAMPO','stage05.event.fixed':'EVENTO FIJO','stage05.objective.boss':'DESTRUYE LA CORONA DIPOLAR'
});
Object.assign(TEXT.fr,{
  'stage05.enemy.conduitLeech':'Sangsue Conductrice','stage05.boss':'Couronne Dipolaire','stage05.boss.warning':'LE CŒUR DU MAGNÉTAR VERROUILLE SA POLARITÉ','stage05.event.breach':'BRÈCHE CONDUCTRICE','stage05.event.chargedFlight':'VOL CHARGÉ','stage05.event.arc':'ARC MAGNÉTIQUE','stage05.event.reversal':'INVERSION DE POLARITÉ','stage05.event.collapse':'EFFONDREMENT MAGNÉTAR','stage05.event.warning':'LES LIGNES MAGNÉTIQUES TRANCHENT LE CHAMP','stage05.event.fixed':'ÉVÉNEMENT FIXE','stage05.objective.boss':'DÉTRUISEZ LA COURONNE DIPOLAIRE'
});


Object.assign(TEXT.ko,{
  'stage04.enemy.phaseDrifter':'시차 방랑체','stage04.boss':'영점 조율기','stage04.boss.warning':'회랑의 시간이 영점에 고정됩니다','stage04.event.procession':'시차 행렬','stage04.event.echoFlight':'잔향 비행단','stage04.event.secondHand':'초침 절단','stage04.event.stasis':'정지 파동','stage04.event.zeroHour':'영점 격자','stage04.event.warning':'시간축이 전장을 절단합니다','stage04.event.fixed':'고정 사건','stage04.objective.boss':'영점 조율기를 파괴하라'
});
Object.assign(TEXT.en,{
  'stage04.enemy.phaseDrifter':'Phase Drifter','stage04.boss':'Zero-Hour Regulator','stage04.boss.warning':'THE CORRIDOR LOCKS TO ZERO HOUR','stage04.event.procession':'PHASE PROCESSION','stage04.event.echoFlight':'ECHO FLIGHT','stage04.event.secondHand':'SECOND-HAND CUT','stage04.event.stasis':'STASIS PULSE','stage04.event.zeroHour':'ZERO-HOUR LATTICE','stage04.event.warning':'THE TIME AXIS IS CUTTING THE FIELD','stage04.event.fixed':'FIXED EVENT','stage04.objective.boss':'DESTROY THE ZERO-HOUR REGULATOR'
});
Object.assign(TEXT.ja,{
  'stage04.enemy.phaseDrifter':'位相漂流体','stage04.boss':'零時調律機','stage04.boss.warning':'回廊の時間が零時に固定されます','stage04.event.procession':'位相行列','stage04.event.echoFlight':'残響飛行隊','stage04.event.secondHand':'秒針断ち','stage04.event.stasis':'静止波動','stage04.event.zeroHour':'零時格子','stage04.event.warning':'時間軸が戦場を切断します','stage04.event.fixed':'固定イベント','stage04.objective.boss':'零時調律機を破壊せよ'
});
Object.assign(TEXT['zh-CN'],{
  'stage04.enemy.phaseDrifter':'时差漂流体','stage04.boss':'零时调律器','stage04.boss.warning':'回廊时间正在锁定为零时','stage04.event.procession':'相位行列','stage04.event.echoFlight':'回响飞行队','stage04.event.secondHand':'秒针切割','stage04.event.stasis':'停滞脉冲','stage04.event.zeroHour':'零时晶格','stage04.event.warning':'时间轴正在切割战场','stage04.event.fixed':'固定事件','stage04.objective.boss':'摧毁零时调律器'
});
Object.assign(TEXT.es,{
  'stage04.enemy.phaseDrifter':'Errante de Fase','stage04.boss':'Regulador de Hora Cero','stage04.boss.warning':'EL CORREDOR SE FIJA EN HORA CERO','stage04.event.procession':'PROCESIÓN DE FASE','stage04.event.echoFlight':'VUELO DE ECO','stage04.event.secondHand':'CORTE DEL SEGUNDERO','stage04.event.stasis':'PULSO DE ESTASIS','stage04.event.zeroHour':'RETÍCULA DE HORA CERO','stage04.event.warning':'EL EJE TEMPORAL CORTA EL CAMPO','stage04.event.fixed':'EVENTO FIJO','stage04.objective.boss':'DESTRUYE EL REGULADOR DE HORA CERO'
});
Object.assign(TEXT.fr,{
  'stage04.enemy.phaseDrifter':'Dériveur de Phase','stage04.boss':'Régulateur Zéro-Heure','stage04.boss.warning':'LE CORRIDOR SE VERROUILLE À ZÉRO HEURE','stage04.event.procession':'PROCESSION DE PHASE','stage04.event.echoFlight':'VOL D’ÉCHO','stage04.event.secondHand':'COUPE DE SECONDE','stage04.event.stasis':'IMPULSION DE STASE','stage04.event.zeroHour':'RÉSEAU ZÉRO-HEURE','stage04.event.warning':'L’AXE TEMPOREL TRANCHE LE CHAMP','stage04.event.fixed':'ÉVÉNEMENT FIXE','stage04.objective.boss':'DÉTRUISEZ LE RÉGULATEUR ZÉRO-HEURE'
});


Object.assign(TEXT.ko,{
  'stage03.enemy.glassWing':'유리날개','stage03.boss':'굴절 성물함','stage03.boss.warning':'묘역 중심 결정체가 개방됩니다','stage03.event.refraction':'굴절 격자','stage03.event.deep':'심층 굴절','stage03.event.rain':'프리즘 낙하','stage03.event.swarm':'유리날개 군집','stage03.event.procession':'성운 장송열','stage03.event.warning':'결정 격자가 전장을 접습니다','stage03.event.fixed':'고정 사건','stage03.objective.boss':'굴절 성물함을 파괴하라'
});
Object.assign(TEXT.en,{
  'stage03.enemy.glassWing':'Glasswing','stage03.boss':'Refracted Reliquary','stage03.boss.warning':'THE NECROPOLIS CORE OPENS','stage03.event.refraction':'REFRACTION LATTICE','stage03.event.deep':'DEEP REFRACTION','stage03.event.rain':'PRISM RAIN','stage03.event.swarm':'GLASSWING SWARM','stage03.event.procession':'NEBULA PROCESSION','stage03.event.warning':'CRYSTAL LATTICES ARE FOLDING THE FIELD','stage03.event.fixed':'FIXED EVENT','stage03.objective.boss':'DESTROY THE REFRACTED RELIQUARY'
});
Object.assign(TEXT.ja,{
  'stage03.enemy.glassWing':'グラスウィング','stage03.boss':'屈折の聖櫃','stage03.boss.warning':'墓域の中枢結晶が開きます','stage03.event.refraction':'屈折格子','stage03.event.deep':'深層屈折','stage03.event.rain':'プリズム降下','stage03.event.swarm':'グラスウィング群','stage03.event.procession':'星雲葬列','stage03.event.warning':'結晶格子が戦場を折り畳みます','stage03.event.fixed':'固定イベント','stage03.objective.boss':'屈折の聖櫃を破壊せよ'
});
Object.assign(TEXT['zh-CN'],{
  'stage03.enemy.glassWing':'玻璃翼','stage03.boss':'折射圣匣','stage03.boss.warning':'墓域核心晶体正在开启','stage03.event.refraction':'折射晶格','stage03.event.deep':'深层折射','stage03.event.rain':'棱镜坠落','stage03.event.swarm':'玻璃翼群','stage03.event.procession':'星云送葬列','stage03.event.warning':'晶格正在折叠战场','stage03.event.fixed':'固定事件','stage03.objective.boss':'摧毁折射圣匣'
});
Object.assign(TEXT.es,{
  'stage03.enemy.glassWing':'Ala de Vidrio','stage03.boss':'Relicario Refractado','stage03.boss.warning':'EL NÚCLEO DE LA NECRÓPOLIS SE ABRE','stage03.event.refraction':'RETÍCULA DE REFRACCIÓN','stage03.event.deep':'REFRACCIÓN PROFUNDA','stage03.event.rain':'LLUVIA PRISMÁTICA','stage03.event.swarm':'ENJAMBRE DE ALAS DE VIDRIO','stage03.event.procession':'PROCESIÓN NEBULAR','stage03.event.warning':'LAS RETÍCULAS CRISTALINAS PLIEGAN EL CAMPO','stage03.event.fixed':'EVENTO FIJO','stage03.objective.boss':'DESTRUYE EL RELICARIO REFRACTADO'
});
Object.assign(TEXT.fr,{
  'stage03.enemy.glassWing':'Aile de Verre','stage03.boss':'Reliquaire Réfracté','stage03.boss.warning':'LE CŒUR DE LA NÉCROPOLE S’OUVRE','stage03.event.refraction':'RÉSEAU DE RÉFRACTION','stage03.event.deep':'RÉFRACTION PROFONDE','stage03.event.rain':'PLUIE PRISMATIQUE','stage03.event.swarm':'ESSAIM D’AILES DE VERRE','stage03.event.procession':'PROCESSION NÉBULAIRE','stage03.event.warning':'LES RÉSEAUX CRISTALLINS REPLIENT LE CHAMP','stage03.event.fixed':'ÉVÉNEMENT FIXE','stage03.objective.boss':'DÉTRUISEZ LE RELIQUAIRE RÉFRACTÉ'
});


Object.assign(TEXT.ko,{
  'stage02.enemy.wisp':'성운 유영체','stage02.boss':'성운의 심장','stage02.boss.warning':'성운 중심핵이 각성합니다',
  'stage02.event.shear':'이온 전단','stage02.event.deep':'심층 전단','stage02.event.warning':'전리 흐름이 전장을 절단합니다','stage02.event.bloom':'유영체 군집','stage02.event.fixed':'고정 사건',
  'stage02.objective.boss':'성운의 심장을 파괴하라'
});
Object.assign(TEXT.en,{
  'stage02.enemy.wisp':'Nebula Wisp','stage02.boss':'Nebula Heart','stage02.boss.warning':'THE NEBULA CORE AWAKENS',
  'stage02.event.shear':'ION SHEAR','stage02.event.deep':'DEEP SHEAR','stage02.event.warning':'IONIZED CURRENTS ARE CUTTING THE FIELD','stage02.event.bloom':'WISP BLOOM','stage02.event.fixed':'FIXED EVENT',
  'stage02.objective.boss':'DESTROY THE NEBULA HEART'
});
Object.assign(TEXT.ja,{
  'stage02.enemy.wisp':'星雲遊泳体','stage02.boss':'星雲の心臓','stage02.boss.warning':'星雲中枢核が覚醒します',
  'stage02.event.shear':'イオン剪断','stage02.event.deep':'深層剪断','stage02.event.warning':'電離流が戦場を切り裂きます','stage02.event.bloom':'遊泳体群','stage02.event.fixed':'固定イベント',
  'stage02.objective.boss':'星雲の心臓を破壊せよ'
});
Object.assign(TEXT['zh-CN'],{
  'stage02.enemy.wisp':'星云游体','stage02.boss':'星云之心','stage02.boss.warning':'星云核心正在苏醒',
  'stage02.event.shear':'离子切变','stage02.event.deep':'深层切变','stage02.event.warning':'电离流正在切割战场','stage02.event.bloom':'游体群落','stage02.event.fixed':'固定事件',
  'stage02.objective.boss':'摧毁星云之心'
});
Object.assign(TEXT.es,{
  'stage02.enemy.wisp':'Espectro Nebular','stage02.boss':'Corazón de Nébula','stage02.boss.warning':'EL NÚCLEO NEBULAR DESPIERTA',
  'stage02.event.shear':'CIZALLA IÓNICA','stage02.event.deep':'CIZALLA PROFUNDA','stage02.event.warning':'LAS CORRIENTES IONIZADAS CORTAN EL CAMPO','stage02.event.bloom':'FLORACIÓN DE ESPECTROS','stage02.event.fixed':'EVENTO FIJO',
  'stage02.objective.boss':'DESTRUYE EL CORAZÓN DE NÉBULA'
});
Object.assign(TEXT.fr,{
  'stage02.enemy.wisp':'Spectre Nébulaire','stage02.boss':'Cœur de Nébuleuse','stage02.boss.warning':'LE CŒUR NÉBULAIRE S’ÉVEILLE',
  'stage02.event.shear':'CISAILLEMENT IONIQUE','stage02.event.deep':'CISAILLEMENT PROFOND','stage02.event.warning':'LES COURANTS IONISÉS TRANCHENT LE CHAMP','stage02.event.bloom':'ESSAIM NÉBULAIRE','stage02.event.fixed':'ÉVÉNEMENT FIXE',
  'stage02.objective.boss':'DÉTRUISEZ LE CŒUR DE NÉBULEUSE'
});

