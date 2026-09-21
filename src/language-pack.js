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
  'menu.endless':'ENDLESS','menu.stageMap':'은하 지도','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'은하 작전 지도','stageMap.planned':'계획 중','stageMap.available':'출격 가능','stageMap.cleared':'클리어','stageMap.locked':'잠김','stageMap.time':'예상 작전 시간','stageMap.threat':'위협도','stageMap.gimmicks':'기믹','stageMap.weapons':'무기','stageMap.events':'이벤트','stageMap.boss':'보스','stageMap.launch':'출격','stageMap.building':'STAGE BUILDING','stageMap.hint':'노드를 선택하면 해당 작전의 정보가 표시됩니다.'
});
Object.assign(TEXT.en,{
  'menu.endless':'ENDLESS','menu.stageMap':'GALAXY MAP','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'GALACTIC OPERATIONS','stageMap.planned':'PLANNED','stageMap.available':'AVAILABLE','stageMap.cleared':'CLEARED','stageMap.locked':'LOCKED','stageMap.time':'EST. OPERATION','stageMap.threat':'THREAT','stageMap.gimmicks':'GIMMICKS','stageMap.weapons':'WEAPONS','stageMap.events':'EVENTS','stageMap.boss':'BOSS','stageMap.launch':'DEPLOY','stageMap.building':'STAGE BUILDING','stageMap.hint':'Select a node to inspect the operation.'
});
Object.assign(TEXT.ja,{
  'menu.endless':'ENDLESS','menu.stageMap':'銀河マップ','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'銀河作戦マップ','stageMap.planned':'計画中','stageMap.available':'出撃可能','stageMap.cleared':'クリア','stageMap.locked':'ロック','stageMap.time':'予想作戦時間','stageMap.threat':'脅威度','stageMap.gimmicks':'ギミック','stageMap.weapons':'武器','stageMap.events':'イベント','stageMap.boss':'ボス','stageMap.launch':'出撃','stageMap.building':'STAGE BUILDING','stageMap.hint':'ノードを選ぶと作戦情報を確認できます。'
});
Object.assign(TEXT['zh-CN'],{
  'menu.endless':'ENDLESS','menu.stageMap':'银河地图','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'银河作战地图','stageMap.planned':'规划中','stageMap.available':'可出击','stageMap.cleared':'已通关','stageMap.locked':'已锁定','stageMap.time':'预计作战时间','stageMap.threat':'威胁度','stageMap.gimmicks':'机制','stageMap.weapons':'武器','stageMap.events':'事件','stageMap.boss':'首领','stageMap.launch':'出击','stageMap.building':'STAGE BUILDING','stageMap.hint':'选择节点以查看作战信息。'
});
Object.assign(TEXT.es,{
  'menu.endless':'ENDLESS','menu.stageMap':'MAPA GALÁCTICO','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'OPERACIONES GALÁCTICAS','stageMap.planned':'PLANEADO','stageMap.available':'DISPONIBLE','stageMap.cleared':'SUPERADO','stageMap.locked':'BLOQUEADO','stageMap.time':'DURACIÓN EST.','stageMap.threat':'AMENAZA','stageMap.gimmicks':'MECÁNICAS','stageMap.weapons':'ARMAS','stageMap.events':'EVENTOS','stageMap.boss':'JEFE','stageMap.launch':'DESPLEGAR','stageMap.building':'STAGE BUILDING','stageMap.hint':'Selecciona un nodo para ver la operación.'
});
Object.assign(TEXT.fr,{
  'menu.endless':'ENDLESS','menu.stageMap':'CARTE GALACTIQUE','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'OPÉRATIONS GALACTIQUES','stageMap.planned':'PLANIFIÉ','stageMap.available':'DISPONIBLE','stageMap.cleared':'TERMINÉ','stageMap.locked':'VERROUILLÉ','stageMap.time':'DURÉE EST.','stageMap.threat':'MENACE','stageMap.gimmicks':'MÉCANIQUES','stageMap.weapons':'ARMES','stageMap.events':'ÉVÉNEMENTS','stageMap.boss':'BOSS','stageMap.launch':'DÉPLOYER','stageMap.building':'STAGE BUILDING','stageMap.hint':'Sélectionnez un nœud pour afficher l’opération.'
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
  'menu.chooseMode':'어떤 항로로 출격할지 선택하세요.','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'고유한 공간과 보스를 가진 유한 작전을 진행합니다.','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'모든 적과 이벤트가 뒤섞이는 끝없는 항해에 도전합니다.',
  'stageMap.gameTime':'게임 시간','stageMap.unlockable':'해금 가능','stageMap.weaponProgress':'무기','stageMap.minutes':'{n}분','stageMap.none':'없음','stageMap.launch':'출격 준비',
  'sortie.title':'출격 준비','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'은하 작전','sortie.endlessMode':'엔드리스','sortie.endlessTitle':'끝없는 항해','sortie.endlessDesc':'정해진 종료 없이 모든 적군과 월드 이벤트, 초월체가 이어지는 무한 생존 항해.','sortie.time':'게임 시간','sortie.difficulty':'난이도','sortie.minutes':'{n}분','sortie.noLimit':'무제한','sortie.back':'뒤로','sortie.launch':'출격','sortie.difficulty.easy':'쉬움','sortie.difficulty.normal':'보통','sortie.difficulty.hard':'어려움',
  'stageClear.targetDown':'수호자 붕괴','stageClear.operationComplete':'작전 완료'
});
Object.assign(TEXT.en,{
  'menu.chooseMode':'Choose your route.','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'Enter finite operations with distinct regions and bosses.','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'Survive an endless route where every enemy and event can appear.',
  'stageMap.gameTime':'GAME TIME','stageMap.unlockable':'UNLOCKABLE','stageMap.weaponProgress':'WEAPON','stageMap.minutes':'{n} min','stageMap.none':'NONE','stageMap.launch':'PREPARE SORTIE',
  'sortie.title':'SORTIE PREPARATION','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'GALACTIC OPERATION','sortie.endlessMode':'ENDLESS','sortie.endlessTitle':'Endless Voyage','sortie.endlessDesc':'An unlimited survival route with the full enemy roster, world events, and recurring Apex threats.','sortie.time':'GAME TIME','sortie.difficulty':'DIFFICULTY','sortie.minutes':'{n} min','sortie.noLimit':'UNLIMITED','sortie.back':'BACK','sortie.launch':'LAUNCH','sortie.difficulty.easy':'EASY','sortie.difficulty.normal':'NORMAL','sortie.difficulty.hard':'HARD',
  'stageClear.targetDown':'WARDEN COLLAPSED','stageClear.operationComplete':'OPERATION COMPLETE'
});
Object.assign(TEXT.ja,{
  'menu.chooseMode':'出撃する航路を選択してください。','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'固有の空間とボスを持つ有限作戦へ出撃します。','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'すべての敵とイベントが混ざる終わりなき航路に挑みます。',
  'stageMap.gameTime':'ゲーム時間','stageMap.unlockable':'解放可能','stageMap.weaponProgress':'武器','stageMap.minutes':'{n}分','stageMap.none':'なし','stageMap.launch':'出撃準備',
  'sortie.title':'出撃準備','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'銀河作戦','sortie.endlessMode':'エンドレス','sortie.endlessTitle':'終わりなき航海','sortie.endlessDesc':'全敵勢力・ワールドイベント・超越体が続く無制限サバイバル航路。','sortie.time':'ゲーム時間','sortie.difficulty':'難易度','sortie.minutes':'{n}分','sortie.noLimit':'無制限','sortie.back':'戻る','sortie.launch':'出撃','sortie.difficulty.easy':'簡単','sortie.difficulty.normal':'普通','sortie.difficulty.hard':'難しい',
  'stageClear.targetDown':'守護者崩壊','stageClear.operationComplete':'作戦完了'
});
Object.assign(TEXT['zh-CN'],{
  'menu.chooseMode':'选择要出击的航路。','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'进入拥有独特区域与首领的有限作战。','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'挑战所有敌人与事件都会出现的无尽航路。',
  'stageMap.gameTime':'游戏时间','stageMap.unlockable':'可解锁','stageMap.weaponProgress':'武器','stageMap.minutes':'{n}分钟','stageMap.none':'无','stageMap.launch':'出击准备',
  'sortie.title':'出击准备','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'银河作战','sortie.endlessMode':'无尽模式','sortie.endlessTitle':'无尽航行','sortie.endlessDesc':'所有敌人、世界事件与超越体持续出现的无限生存航路。','sortie.time':'游戏时间','sortie.difficulty':'难度','sortie.minutes':'{n}分钟','sortie.noLimit':'无限','sortie.back':'返回','sortie.launch':'出击','sortie.difficulty.easy':'简单','sortie.difficulty.normal':'普通','sortie.difficulty.hard':'困难',
  'stageClear.targetDown':'守卫崩解','stageClear.operationComplete':'作战完成'
});
Object.assign(TEXT.es,{
  'menu.chooseMode':'Elige tu ruta de salida.','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'Entra en operaciones finitas con regiones y jefes propios.','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'Sobrevive una ruta infinita con todos los enemigos y eventos.',
  'stageMap.gameTime':'TIEMPO DE JUEGO','stageMap.unlockable':'DESBLOQUEABLE','stageMap.weaponProgress':'ARMA','stageMap.minutes':'{n} min','stageMap.none':'NINGUNO','stageMap.launch':'PREPARAR SALIDA',
  'sortie.title':'PREPARAR SALIDA','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'OPERACIÓN GALÁCTICA','sortie.endlessMode':'ENDLESS','sortie.endlessTitle':'Viaje Infinito','sortie.endlessDesc':'Ruta de supervivencia ilimitada con todos los enemigos, eventos y amenazas Apex.','sortie.time':'TIEMPO DE JUEGO','sortie.difficulty':'DIFICULTAD','sortie.minutes':'{n} min','sortie.noLimit':'ILIMITADO','sortie.back':'VOLVER','sortie.launch':'SALIR','sortie.difficulty.easy':'FÁCIL','sortie.difficulty.normal':'NORMAL','sortie.difficulty.hard':'DIFÍCIL',
  'stageClear.targetDown':'GUARDIÁN COLAPSADO','stageClear.operationComplete':'OPERACIÓN COMPLETA'
});
Object.assign(TEXT.fr,{
  'menu.chooseMode':'Choisissez votre route de sortie.','menu.stageKicker':'GALACTIC OPERATIONS','menu.stageDesc':'Lancez des opérations finies avec des zones et des boss distincts.','menu.endlessKicker':'ENDLESS EXPEDITION','menu.endlessDesc':'Survivez à une route infinie mêlant tous les ennemis et événements.',
  'stageMap.gameTime':'TEMPS DE JEU','stageMap.unlockable':'À DÉBLOQUER','stageMap.weaponProgress':'ARME','stageMap.minutes':'{n} min','stageMap.none':'AUCUN','stageMap.launch':'PRÉPARER LA SORTIE',
  'sortie.title':'PRÉPARATION','sortie.kicker.stage':'GALACTIC OPERATION','sortie.kicker.endless':'ENDLESS EXPEDITION','sortie.stageMode':'OPÉRATION GALACTIQUE','sortie.endlessMode':'ENDLESS','sortie.endlessTitle':'Voyage Sans Fin','sortie.endlessDesc':'Route de survie illimitée avec tous les ennemis, événements et menaces Apex.','sortie.time':'TEMPS DE JEU','sortie.difficulty':'DIFFICULTÉ','sortie.minutes':'{n} min','sortie.noLimit':'ILLIMITÉ','sortie.back':'RETOUR','sortie.launch':'LANCER','sortie.difficulty.easy':'FACILE','sortie.difficulty.normal':'NORMAL','sortie.difficulty.hard':'DIFFICILE',
  'stageClear.targetDown':'GARDIEN EFFONDRÉ','stageClear.operationComplete':'OPÉRATION TERMINÉE'
});

