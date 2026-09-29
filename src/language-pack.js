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
  'menu.endless':'ENDLESS','menu.stageMap':'은하 지도','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'은하 작전 지도','stageMap.planned':'잠김','stageMap.available':'출격 가능','stageMap.cleared':'클리어','stageMap.locked':'잠김','stageMap.time':'예상 작전 시간','stageMap.threat':'위협도','stageMap.gimmicks':'기믹','stageMap.weapons':'무기','stageMap.events':'이벤트','stageMap.boss':'초월체','stageMap.launch':'출격','stageMap.building':'출격 불가','stageMap.hint':'노드를 선택하면 해당 작전의 정보가 표시됩니다.'
});
Object.assign(TEXT.en,{
  'menu.endless':'ENDLESS','menu.stageMap':'GALAXY MAP','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'GALACTIC OPERATIONS','stageMap.planned':'LOCKED','stageMap.available':'AVAILABLE','stageMap.cleared':'CLEARED','stageMap.locked':'LOCKED','stageMap.time':'EST. OPERATION','stageMap.threat':'THREAT','stageMap.gimmicks':'GIMMICKS','stageMap.weapons':'WEAPONS','stageMap.events':'EVENTS','stageMap.boss':'APEX','stageMap.launch':'DEPLOY','stageMap.building':'UNAVAILABLE','stageMap.hint':'Select a node to inspect the operation.'
});
Object.assign(TEXT.ja,{
  'menu.endless':'ENDLESS','menu.stageMap':'銀河マップ','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'銀河作戦マップ','stageMap.planned':'ロック','stageMap.available':'出撃可能','stageMap.cleared':'クリア','stageMap.locked':'ロック','stageMap.time':'予想作戦時間','stageMap.threat':'脅威度','stageMap.gimmicks':'ギミック','stageMap.weapons':'武器','stageMap.events':'イベント','stageMap.boss':'超越体','stageMap.launch':'出撃','stageMap.building':'出撃不可','stageMap.hint':'ノードを選ぶと作戦情報を確認できます。'
});
Object.assign(TEXT['zh-CN'],{
  'menu.endless':'ENDLESS','menu.stageMap':'银河地图','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'银河作战地图','stageMap.planned':'已锁定','stageMap.available':'可出击','stageMap.cleared':'已通关','stageMap.locked':'已锁定','stageMap.time':'预计作战时间','stageMap.threat':'威胁度','stageMap.gimmicks':'机制','stageMap.weapons':'武器','stageMap.events':'事件','stageMap.boss':'超越体','stageMap.launch':'出击','stageMap.building':'无法出击','stageMap.hint':'选择节点以查看作战信息。'
});
Object.assign(TEXT.es,{
  'menu.endless':'ENDLESS','menu.stageMap':'MAPA GALÁCTICO','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'OPERACIONES GALÁCTICAS','stageMap.planned':'BLOQUEADO','stageMap.available':'DISPONIBLE','stageMap.cleared':'SUPERADO','stageMap.locked':'BLOQUEADO','stageMap.time':'DURACIÓN EST.','stageMap.threat':'AMENAZA','stageMap.gimmicks':'MECÁNICAS','stageMap.weapons':'ARMAS','stageMap.events':'EVENTOS','stageMap.boss':'ÁPICE','stageMap.launch':'DESPLEGAR','stageMap.building':'NO DISPONIBLE','stageMap.hint':'Selecciona un nodo para ver la operación.'
});
Object.assign(TEXT.fr,{
  'menu.endless':'ENDLESS','menu.stageMap':'CARTE GALACTIQUE','stageMap.kicker':'GALACTIC OPERATIONS','stageMap.title':'OPÉRATIONS GALACTIQUES','stageMap.planned':'VERROUILLÉ','stageMap.available':'DISPONIBLE','stageMap.cleared':'TERMINÉ','stageMap.locked':'VERROUILLÉ','stageMap.time':'DURÉE EST.','stageMap.threat':'MENACE','stageMap.gimmicks':'MÉCANIQUES','stageMap.weapons':'ARMES','stageMap.events':'ÉVÉNEMENTS','stageMap.boss':'APEX','stageMap.launch':'DÉPLOYER','stageMap.building':'INDISPONIBLE','stageMap.hint':'Sélectionnez un nœud pour afficher l’opération.'
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
  'profile.localSave':'이 진행도는 현재 기기에 저장됩니다.','profile.progress':'스테이지 진행도','profile.stageClears':'누적 스테이지 클리어','profile.runs':'총 출격','profile.kills':'누적 처치','profile.slots':'장비 슬롯','profile.weapons':'해금 장비','profile.eliteKills':'보스급 처치','profile.combatRecord':'전투 기록','profile.stageRecord':'스테이지 클리어 기록','profile.expand':'세부 보기','profile.minibossKills':'중간보스','profile.bossKills':'보스','profile.apexKills':'초월체','profile.voidBossKills':'균열 보스','profile.shipBossKills':'우주선 보스','profile.growthLevels':'코어 성장 레벨','profile.growthNodes':'성장 노드','profile.rename':'닉네임 변경','profile.save':'저장'
});
Object.assign(TEXT.en,{
  'profile.localSave':'Progress is currently stored on this device.','profile.progress':'STAGE PROGRESS','profile.stageClears':'TOTAL STAGE CLEARS','profile.runs':'TOTAL RUNS','profile.kills':'TOTAL KILLS','profile.slots':'EQUIPMENT SLOTS','profile.weapons':'UNLOCKED EQUIPMENT','profile.eliteKills':'ELITE DEFEATS','profile.combatRecord':'COMBAT RECORD','profile.stageRecord':'STAGE CLEAR RECORD','profile.expand':'DETAILS','profile.minibossKills':'MINI-BOSSES','profile.bossKills':'BOSSES','profile.apexKills':'APEXES','profile.voidBossKills':'RIFT BOSSES','profile.shipBossKills':'SHIP BOSSES','profile.growthLevels':'CORE GROWTH LEVELS','profile.growthNodes':'GROWTH NODES','profile.rename':'RENAME','profile.save':'SAVE'
});
Object.assign(TEXT.ja,{
  'profile.localSave':'進行状況は現在この端末に保存されます。','profile.progress':'ステージ進行','profile.stageClears':'累計ステージクリア','profile.runs':'総出撃','profile.kills':'累計撃破','profile.slots':'装備スロット','profile.weapons':'解放装備','profile.eliteKills':'ボス級撃破','profile.combatRecord':'戦闘記録','profile.stageRecord':'ステージクリア記録','profile.expand':'詳細','profile.minibossKills':'中ボス','profile.bossKills':'ボス','profile.apexKills':'超越体','profile.voidBossKills':'亀裂ボス','profile.shipBossKills':'宇宙船ボス','profile.growthLevels':'コア成長レベル','profile.growthNodes':'成長ノード','profile.rename':'名前変更','profile.save':'保存'
});
Object.assign(TEXT['zh-CN'],{
  'profile.localSave':'当前进度保存在此设备上。','profile.progress':'关卡进度','profile.stageClears':'累计关卡通关','profile.runs':'总出击','profile.kills':'累计击杀','profile.slots':'装备槽','profile.weapons':'已解锁装备','profile.eliteKills':'首领级击杀','profile.combatRecord':'战斗记录','profile.stageRecord':'关卡通关记录','profile.expand':'详情','profile.minibossKills':'中型首领','profile.bossKills':'首领','profile.apexKills':'超越体','profile.voidBossKills':'裂隙首领','profile.shipBossKills':'飞船首领','profile.growthLevels':'核心成长等级','profile.growthNodes':'成长节点','profile.rename':'修改昵称','profile.save':'保存'
});
Object.assign(TEXT.es,{
  'profile.localSave':'El progreso se guarda actualmente en este dispositivo.','profile.progress':'PROGRESO DE ETAPAS','profile.stageClears':'ETAPAS COMPLETADAS','profile.runs':'PARTIDAS','profile.kills':'BAJAS TOTALES','profile.slots':'RANURAS','profile.weapons':'EQUIPO DESBLOQUEADO','profile.eliteKills':'ÉLITES DERROTADOS','profile.combatRecord':'REGISTRO DE COMBATE','profile.stageRecord':'REGISTRO DE ETAPAS','profile.expand':'DETALLES','profile.minibossKills':'MINIJEFES','profile.bossKills':'JEFES','profile.apexKills':'ÁPICES','profile.voidBossKills':'JEFES DE GRIETA','profile.shipBossKills':'JEFES NAVE','profile.growthLevels':'NIVELES DE NÚCLEO','profile.growthNodes':'NODOS DE CRECIMIENTO','profile.rename':'CAMBIAR NOMBRE','profile.save':'GUARDAR'
});
Object.assign(TEXT.fr,{
  'profile.localSave':'La progression est actuellement enregistrée sur cet appareil.','profile.progress':'PROGRESSION DES STAGES','profile.stageClears':'STAGES TERMINÉS','profile.runs':'SORTIES','profile.kills':'ÉLIMINATIONS','profile.slots':'EMPLACEMENTS','profile.weapons':'ÉQUIPEMENT DÉBLOQUÉ','profile.eliteKills':'ÉLITES VAINCUS','profile.combatRecord':'DOSSIER DE COMBAT','profile.stageRecord':'HISTORIQUE DES STAGES','profile.expand':'DÉTAILS','profile.minibossKills':'MINI-BOSS','profile.bossKills':'BOSS','profile.apexKills':'APEX','profile.voidBossKills':'BOSS DE FAILLE','profile.shipBossKills':'BOSS VAISSEAU','profile.growthLevels':'NIVEAUX DU NOYAU','profile.growthNodes':'NŒUDS DE CROISSANCE','profile.rename':'RENOMMER','profile.save':'ENREGISTRER'
});

Object.assign(TEXT.ko,{
  'stage06.boss':'파편 항로의 중추','stage06.boss.warning':'첫 별자리의 모든 이상 현상이 수렴합니다','stage06.event.frontierEcho':'전초 잔향','stage06.event.magnetarEcho':'자기폭풍 잔향','stage06.event.cross':'수렴 교차선','stage06.event.timefold':'시간 접힘 격자','stage06.event.collapse':'항로 붕괴','stage06.event.warning':'성좌핵이 여러 항로를 한 점으로 접습니다','stage06.event.fixed':'고정 사건','stage06.objective.boss':'파편 항로의 중추를 파괴하라'
});
Object.assign(TEXT.en,{
  'stage06.boss':'Shardway Nexus','stage06.boss.warning':'EVERY ANOMALY OF THE FIRST CONSTELLATION CONVERGES','stage06.event.frontierEcho':'FRONTIER ECHO','stage06.event.magnetarEcho':'MAGNETAR ECHO','stage06.event.cross':'CONVERGENCE CROSS','stage06.event.timefold':'TIMEFOLD GRID','stage06.event.collapse':'ROUTE COLLAPSE','stage06.event.warning':'THE NEXUS FOLDS MULTIPLE ROUTES INTO ONE POINT','stage06.event.fixed':'FIXED EVENT','stage06.objective.boss':'DESTROY THE SHARDWAY NEXUS'
});
Object.assign(TEXT.ja,{
  'stage06.boss':'破片航路の中枢','stage06.boss.warning':'第一星座の異常現象がすべて収束します','stage06.event.frontierEcho':'前線残響','stage06.event.magnetarEcho':'磁気嵐残響','stage06.event.cross':'収束交差線','stage06.event.timefold':'時間折畳格子','stage06.event.collapse':'航路崩壊','stage06.event.warning':'星座核が複数の航路を一点へ折り畳みます','stage06.event.fixed':'固定イベント','stage06.objective.boss':'破片航路の中枢を破壊せよ'
});
Object.assign(TEXT['zh-CN'],{
  'stage06.boss':'碎片航路中枢','stage06.boss.warning':'第一星座的所有异常正在汇聚','stage06.event.frontierEcho':'前线回响','stage06.event.magnetarEcho':'磁暴回响','stage06.event.cross':'汇聚交叉线','stage06.event.timefold':'时间折叠晶格','stage06.event.collapse':'航路崩塌','stage06.event.warning':'星座核心正在把多条航路折叠到一点','stage06.event.fixed':'固定事件','stage06.objective.boss':'摧毁碎片航路中枢'
});
Object.assign(TEXT.es,{
  'stage06.boss':'Nexo de Shardway','stage06.boss.warning':'TODAS LAS ANOMALÍAS DE LA PRIMERA CONSTELACIÓN CONVERGEN','stage06.event.frontierEcho':'ECO DE FRONTERA','stage06.event.magnetarEcho':'ECO MAGNETAR','stage06.event.cross':'CRUCE DE CONVERGENCIA','stage06.event.timefold':'RETÍCULA TEMPORAL','stage06.event.collapse':'COLAPSO DE RUTA','stage06.event.warning':'EL NEXO PLIEGA VARIAS RUTAS EN UN SOLO PUNTO','stage06.event.fixed':'EVENTO FIJO','stage06.objective.boss':'DESTRUYE EL NEXO DE SHARDWAY'
});
Object.assign(TEXT.fr,{
  'stage06.boss':'Nexus de Shardway','stage06.boss.warning':'TOUTES LES ANOMALIES DE LA PREMIÈRE CONSTELLATION CONVERGENT','stage06.event.frontierEcho':'ÉCHO DE FRONTIÈRE','stage06.event.magnetarEcho':'ÉCHO MAGNÉTAR','stage06.event.cross':'CROIX DE CONVERGENCE','stage06.event.timefold':'RÉSEAU TEMPOREL','stage06.event.collapse':'EFFONDREMENT DE ROUTE','stage06.event.warning':'LE NEXUS REPLIE PLUSIEURS ROUTES EN UN POINT','stage06.event.fixed':'ÉVÉNEMENT FIXE','stage06.objective.boss':'DÉTRUISEZ LE NEXUS DE SHARDWAY'
});
Object.assign(TEXT.ko,{
  'stage09.enemy.spiralPod':'나선 포낭','stage09.boss':'나선 배양핵','stage09.boss.warning':'종자층의 배양핵이 개방됩니다','stage09.event.podBloom':'포낭 개화','stage09.event.rootCrossing':'뿌리창 교차군','stage09.event.helix':'나선 절단','stage09.event.orbit':'종자 공전','stage09.event.vortex':'개화 소용돌이','stage09.event.warning':'종자층이 전장을 나선으로 접습니다','stage09.event.fixed':'고정 사건','stage09.objective.boss':'나선 배양핵을 파괴하라',
  'stage10.boss':'반사 화관','stage10.boss.warning':'성소의 반사 화관이 펼쳐집니다','stage10.event.petalProcession':'꽃잎 행렬','stage10.event.podProcession':'포낭 행렬','stage10.event.petal':'반사 꽃잎','stage10.event.echo':'잔상 개화','stage10.event.cage':'반사 감옥','stage10.event.warning':'반사면이 공격선을 복제합니다','stage10.event.fixed':'고정 사건','stage10.objective.boss':'반사 화관을 무너뜨려라',
  'stage11.enemy.huskWarden':'종각 수호체','stage11.boss':'종자고 수문장','stage11.boss.warning':'최심부 종자고가 봉쇄됩니다','stage11.event.wardenColumn':'수호체 종대','stage11.event.podColumn':'포낭 종대','stage11.event.crush':'갑각 압착','stage11.event.mortar':'종자 포격','stage11.event.bulkhead':'생체 격벽','stage11.event.warning':'종자 갑각이 안전 지대를 압축합니다','stage11.event.fixed':'고정 사건','stage11.objective.boss':'종자고 수문장을 격파하라',
  'stage12.boss':'심연 개화핵','stage12.boss.warning':'두 번째 별자리의 생체핵이 직접 개화합니다','stage12.event.sporeConvergence':'포자 수렴','stage12.event.huskConvergence':'갑각 수렴','stage12.event.cross':'개화핵 교차선','stage12.event.spiral':'맥관 나선','stage12.event.overgrowth':'심연 과증식','stage12.event.warning':'모든 생체 항로가 중심핵으로 수렴합니다','stage12.event.fixed':'고정 사건','stage12.objective.boss':'심연 개화핵을 파괴하라'
});
Object.assign(TEXT.en,{
  'stage09.enemy.spiralPod':'Spiral Pod','stage09.boss':'Helix Nursery','stage09.boss.warning':'THE SEEDBED NURSERY OPENS','stage09.event.podBloom':'POD BLOOM','stage09.event.rootCrossing':'ROOTLANCE CROSSING','stage09.event.helix':'HELIX SWEEP','stage09.event.orbit':'SEED ORBIT','stage09.event.vortex':'BLOOM VORTEX','stage09.event.warning':'THE SEEDBED IS FOLDING THE FIELD INTO A SPIRAL','stage09.event.fixed':'FIXED EVENT','stage09.objective.boss':'DESTROY THE HELIX NURSERY',
  'stage10.boss':'Mirrorpetal Halo','stage10.boss.warning':'THE SANCTUM\'S MIRROR HALO UNFOLDS','stage10.event.petalProcession':'PETAL PROCESSION','stage10.event.podProcession':'POD PROCESSION','stage10.event.petal':'MIRROR PETAL','stage10.event.echo':'ECHO BLOOM','stage10.event.cage':'REFLECTION CAGE','stage10.event.warning':'REFLECTIVE SURFACES ARE COPYING ATTACK LANES','stage10.event.fixed':'FIXED EVENT','stage10.objective.boss':'BREAK THE MIRRORPETAL HALO',
  'stage11.enemy.huskWarden':'Husk Warden','stage11.boss':'Seedvault Custodian','stage11.boss.warning':'THE INNER SEEDVAULT SEALS','stage11.event.wardenColumn':'WARDEN COLUMN','stage11.event.podColumn':'POD COLUMN','stage11.event.crush':'HUSK CRUSH','stage11.event.mortar':'SEED MORTAR','stage11.event.bulkhead':'LIVING BULKHEAD','stage11.event.warning':'SEED HUSKS ARE COMPRESSING THE SAFE SPACE','stage11.event.fixed':'FIXED EVENT','stage11.objective.boss':'DEFEAT THE SEEDVAULT CUSTODIAN',
  'stage12.boss':'Abyssal Bloomheart','stage12.boss.warning':'THE LIVING CORE OF THE SECOND CONSTELLATION BLOOMS','stage12.event.sporeConvergence':'SPORE CONVERGENCE','stage12.event.huskConvergence':'HUSK CONVERGENCE','stage12.event.cross':'BLOOMHEART CROSS','stage12.event.spiral':'VASCULAR SPIRAL','stage12.event.overgrowth':'ABYSSAL OVERGROWTH','stage12.event.warning':'EVERY LIVING ROUTE CONVERGES ON THE CORE','stage12.event.fixed':'FIXED EVENT','stage12.objective.boss':'DESTROY THE ABYSSAL BLOOMHEART'
});
Object.assign(TEXT.ja,{
  'stage09.enemy.spiralPod':'螺旋莢','stage09.boss':'螺旋培養核','stage09.boss.warning':'種子層の培養核が開きます','stage09.event.podBloom':'莢の開花','stage09.event.rootCrossing':'根槍交差群','stage09.event.helix':'螺旋断ち','stage09.event.orbit':'種子公転','stage09.event.vortex':'開花渦','stage09.event.warning':'種子層が戦場を螺旋状に折り畳みます','stage09.event.fixed':'固定イベント','stage09.objective.boss':'螺旋培養核を破壊せよ',
  'stage10.boss':'反射花冠','stage10.boss.warning':'聖域の反射花冠が展開します','stage10.event.petalProcession':'花弁行列','stage10.event.podProcession':'莢行列','stage10.event.petal':'反射花弁','stage10.event.echo':'残像開花','stage10.event.cage':'反射檻','stage10.event.warning':'反射面が攻撃線を複製します','stage10.event.fixed':'固定イベント','stage10.objective.boss':'反射花冠を崩せ',
  'stage11.enemy.huskWarden':'種殻守護体','stage11.boss':'種子庫番人','stage11.boss.warning':'最深部の種子庫が封鎖されます','stage11.event.wardenColumn':'守護体縦隊','stage11.event.podColumn':'莢縦隊','stage11.event.crush':'殻圧縮','stage11.event.mortar':'種子砲撃','stage11.event.bulkhead':'生体隔壁','stage11.event.warning':'種子殻が安全地帯を圧縮します','stage11.event.fixed':'固定イベント','stage11.objective.boss':'種子庫番人を倒せ',
  'stage12.boss':'深淵開花核','stage12.boss.warning':'第二星座の生体核が直接開花します','stage12.event.sporeConvergence':'胞子収束','stage12.event.huskConvergence':'殻収束','stage12.event.cross':'開花核交差線','stage12.event.spiral':'脈管螺旋','stage12.event.overgrowth':'深淵過成長','stage12.event.warning':'すべての生体航路が中心核へ収束します','stage12.event.fixed':'固定イベント','stage12.objective.boss':'深淵開花核を破壊せよ'
});
Object.assign(TEXT['zh-CN'],{
  'stage09.enemy.spiralPod':'螺旋荚体','stage09.boss':'螺旋培育核','stage09.boss.warning':'种层培育核正在开启','stage09.event.podBloom':'荚体绽放','stage09.event.rootCrossing':'根枪交叉群','stage09.event.helix':'螺旋切割','stage09.event.orbit':'种子公转','stage09.event.vortex':'绽放涡旋','stage09.event.warning':'种层正在把战场折叠成螺旋','stage09.event.fixed':'固定事件','stage09.objective.boss':'摧毁螺旋培育核',
  'stage10.boss':'反射花冠','stage10.boss.warning':'圣所反射花冠正在展开','stage10.event.petalProcession':'花瓣行列','stage10.event.podProcession':'荚体行列','stage10.event.petal':'反射花瓣','stage10.event.echo':'残像绽放','stage10.event.cage':'反射牢笼','stage10.event.warning':'反射面正在复制攻击线','stage10.event.fixed':'固定事件','stage10.objective.boss':'击碎反射花冠',
  'stage11.enemy.huskWarden':'种壳守卫','stage11.boss':'种库守门者','stage11.boss.warning':'最深层种库正在封锁','stage11.event.wardenColumn':'守卫纵队','stage11.event.podColumn':'荚体纵队','stage11.event.crush':'种壳挤压','stage11.event.mortar':'种子炮击','stage11.event.bulkhead':'活体隔壁','stage11.event.warning':'种壳正在压缩安全区域','stage11.event.fixed':'固定事件','stage11.objective.boss':'击败种库守门者',
  'stage12.boss':'深渊绽放心核','stage12.boss.warning':'第二星座的活体核心正在直接绽放','stage12.event.sporeConvergence':'孢子汇聚','stage12.event.huskConvergence':'种壳汇聚','stage12.event.cross':'绽放心核交叉线','stage12.event.spiral':'脉管螺旋','stage12.event.overgrowth':'深渊过生长','stage12.event.warning':'所有活体航路都在向核心汇聚','stage12.event.fixed':'固定事件','stage12.objective.boss':'摧毁深渊绽放心核'
});
Object.assign(TEXT.es,{
  'stage09.enemy.spiralPod':'Vaina Espiral','stage09.boss':'Vivero Hélice','stage09.boss.warning':'SE ABRE EL VIVERO DEL SEMILLERO','stage09.event.podBloom':'FLORACIÓN DE VAINAS','stage09.event.rootCrossing':'CRUCE DE LANZAS RAÍZ','stage09.event.helix':'BARRIDO HÉLICE','stage09.event.orbit':'ÓRBITA DE SEMILLAS','stage09.event.vortex':'VÓRTICE DE FLORACIÓN','stage09.event.warning':'EL SEMILLERO PLIEGA EL CAMPO EN ESPIRAL','stage09.event.fixed':'EVENTO FIJO','stage09.objective.boss':'DESTRUYE EL VIVERO HÉLICE',
  'stage10.boss':'Halo Pétalo Espejo','stage10.boss.warning':'SE DESPLIEGA EL HALO ESPEJO DEL SANTUARIO','stage10.event.petalProcession':'PROCESIÓN DE PÉTALOS','stage10.event.podProcession':'PROCESIÓN DE VAINAS','stage10.event.petal':'PÉTALO ESPEJO','stage10.event.echo':'FLORACIÓN ECO','stage10.event.cage':'JAULA DE REFLEJOS','stage10.event.warning':'LAS SUPERFICIES REFLECTANTES DUPLICAN LAS LÍNEAS DE ATAQUE','stage10.event.fixed':'EVENTO FIJO','stage10.objective.boss':'ROMPE EL HALO PÉTALO ESPEJO',
  'stage11.enemy.huskWarden':'Guardián de Cáscara','stage11.boss':'Custodio de la Cámara de Semillas','stage11.boss.warning':'SE SELLA LA CÁMARA INTERNA DE SEMILLAS','stage11.event.wardenColumn':'COLUMNA DE GUARDIANES','stage11.event.podColumn':'COLUMNA DE VAINAS','stage11.event.crush':'COMPRESIÓN DE CÁSCARA','stage11.event.mortar':'MORTERO DE SEMILLAS','stage11.event.bulkhead':'MAMPARO VIVIENTE','stage11.event.warning':'LAS CÁSCARAS COMPRIMEN EL ESPACIO SEGURO','stage11.event.fixed':'EVENTO FIJO','stage11.objective.boss':'DERROTA AL CUSTODIO DE LA CÁMARA',
  'stage12.boss':'Corazón Floral Abisal','stage12.boss.warning':'EL NÚCLEO VIVO DE LA SEGUNDA CONSTELACIÓN FLORECE','stage12.event.sporeConvergence':'CONVERGENCIA DE ESPORAS','stage12.event.huskConvergence':'CONVERGENCIA DE CÁSCARAS','stage12.event.cross':'CRUCE DEL CORAZÓN FLORAL','stage12.event.spiral':'ESPIRAL VASCULAR','stage12.event.overgrowth':'SOBRECRECIMIENTO ABISAL','stage12.event.warning':'TODAS LAS RUTAS VIVAS CONVERGEN EN EL NÚCLEO','stage12.event.fixed':'EVENTO FIJO','stage12.objective.boss':'DESTRUYE EL CORAZÓN FLORAL ABISAL'
});
Object.assign(TEXT.fr,{
  'stage09.enemy.spiralPod':'Gousse Spirale','stage09.boss':'Pépinière Hélicoïdale','stage09.boss.warning':'LA PÉPINIÈRE DU SEMIS S’OUVRE','stage09.event.podBloom':'FLORAISON DES GOUSSES','stage09.event.rootCrossing':'CROISEMENT DE LANCES-RACINES','stage09.event.helix':'BALAYAGE HÉLICOÏDAL','stage09.event.orbit':'ORBITE DES GRAINES','stage09.event.vortex':'VORTEX DE FLORAISON','stage09.event.warning':'LE SEMIS REPLIE LE CHAMP EN SPIRALE','stage09.event.fixed':'ÉVÉNEMENT FIXE','stage09.objective.boss':'DÉTRUISEZ LA PÉPINIÈRE HÉLICOÏDALE',
  'stage10.boss':'Halo Pétale-Miroir','stage10.boss.warning':'LE HALO MIROIR DU SANCTUAIRE SE DÉPLOIE','stage10.event.petalProcession':'PROCESSION DE PÉTALES','stage10.event.podProcession':'PROCESSION DE GOUSSES','stage10.event.petal':'PÉTALE MIROIR','stage10.event.echo':'FLORAISON ÉCHO','stage10.event.cage':'CAGE DE REFLETS','stage10.event.warning':'LES SURFACES RÉFLÉCHISSANTES DUPLIQUENT LES LIGNES D’ATTAQUE','stage10.event.fixed':'ÉVÉNEMENT FIXE','stage10.objective.boss':'BRISEZ LE HALO PÉTALE-MIROIR',
  'stage11.enemy.huskWarden':'Gardien de Cosse','stage11.boss':'Custode du Coffre à Graines','stage11.boss.warning':'LE COFFRE INTÉRIEUR SE SCELLE','stage11.event.wardenColumn':'COLONNE DE GARDIENS','stage11.event.podColumn':'COLONNE DE GOUSSES','stage11.event.crush':'ÉCRASEMENT DE COSSE','stage11.event.mortar':'MORTIER DE GRAINES','stage11.event.bulkhead':'CLOISON VIVANTE','stage11.event.warning':'LES COSSES COMPRIMENT L’ESPACE SÛR','stage11.event.fixed':'ÉVÉNEMENT FIXE','stage11.objective.boss':'ABATTEZ LE CUSTODE DU COFFRE',
  'stage12.boss':'Cœur de Floraison Abyssale','stage12.boss.warning':'LE CŒUR VIVANT DE LA DEUXIÈME CONSTELLATION FLEURIT','stage12.event.sporeConvergence':'CONVERGENCE DE SPORES','stage12.event.huskConvergence':'CONVERGENCE DE COSSES','stage12.event.cross':'CROIX DU CŒUR FLORAL','stage12.event.spiral':'SPIRALE VASCULAIRE','stage12.event.overgrowth':'PROLIFÉRATION ABYSSALE','stage12.event.warning':'TOUTES LES ROUTES VIVANTES CONVERGENT VERS LE CŒUR','stage12.event.fixed':'ÉVÉNEMENT FIXE','stage12.objective.boss':'DÉTRUISEZ LE CŒUR DE FLORAISON ABYSSALE'
});


Object.assign(TEXT.ko,{
  'stage08.enemy.rootlance':'뿌리창 유영체','stage08.boss':'심연 수관','stage08.boss.warning':'협곡의 주수관이 개방됩니다','stage08.event.migration':'뿌리창 이동군','stage08.event.convoy':'포자 수송군','stage08.event.geyser':'수액 분출','stage08.event.rail':'맥관 절단선','stage08.event.rupture':'동맥 파열','stage08.event.warning':'살아 있는 수액관이 전장을 절단합니다','stage08.event.fixed':'고정 사건','stage08.objective.boss':'심연 수관을 파괴하라'
});
Object.assign(TEXT.en,{
  'stage08.enemy.rootlance':'Rootlance','stage08.boss':'Abyssal Rootcrown','stage08.boss.warning':'THE RAVINE\'S PRIMARY VESSEL OPENS','stage08.event.migration':'ROOTLANCE MIGRATION','stage08.event.convoy':'SPORE CONVOY','stage08.event.geyser':'SAP GEYSER','stage08.event.rail':'VASCULAR RAIL','stage08.event.rupture':'ARTERIAL RUPTURE','stage08.event.warning':'LIVING VESSELS ARE CUTTING THE BATTLEFIELD','stage08.event.fixed':'FIXED EVENT','stage08.objective.boss':'DESTROY THE ABYSSAL ROOTCROWN'
});
Object.assign(TEXT.ja,{
  'stage08.enemy.rootlance':'根槍遊泳体','stage08.boss':'深淵根冠','stage08.boss.warning':'峡谷の主導管が開きます','stage08.event.migration':'根槍移動群','stage08.event.convoy':'胞子輸送群','stage08.event.geyser':'樹液噴出','stage08.event.rail':'脈管切断線','stage08.event.rupture':'動脈破裂','stage08.event.warning':'生きた導管が戦場を切り裂きます','stage08.event.fixed':'固定イベント','stage08.objective.boss':'深淵根冠を破壊せよ'
});
Object.assign(TEXT['zh-CN'],{
  'stage08.enemy.rootlance':'根枪游体','stage08.boss':'深渊根冠','stage08.boss.warning':'峡谷主导管正在开启','stage08.event.migration':'根枪迁徙群','stage08.event.convoy':'孢子运输群','stage08.event.geyser':'树液喷涌','stage08.event.rail':'脉管切割线','stage08.event.rupture':'动脉破裂','stage08.event.warning':'活体导管正在切割战场','stage08.event.fixed':'固定事件','stage08.objective.boss':'摧毁深渊根冠'
});
Object.assign(TEXT.es,{
  'stage08.enemy.rootlance':'Lanza Raíz','stage08.boss':'Corona Raíz Abisal','stage08.boss.warning':'SE ABRE EL VASO PRINCIPAL DEL BARRANCO','stage08.event.migration':'MIGRACIÓN DE LANZAS RAÍZ','stage08.event.convoy':'CONVOY DE ESPORAS','stage08.event.geyser':'GÉISER DE SAVIA','stage08.event.rail':'RIEL VASCULAR','stage08.event.rupture':'RUPTURA ARTERIAL','stage08.event.warning':'LOS VASOS VIVOS CORTAN EL CAMPO','stage08.event.fixed':'EVENTO FIJO','stage08.objective.boss':'DESTRUYE LA CORONA RAÍZ ABISAL'
});
Object.assign(TEXT.fr,{
  'stage08.enemy.rootlance':'Lance-Racine','stage08.boss':'Couronne-Racine Abyssale','stage08.boss.warning':'LE VAISSEAU PRINCIPAL DU RAVIN S’OUVRE','stage08.event.migration':'MIGRATION DE LANCES-RACINES','stage08.event.convoy':'CONVOI DE SPORES','stage08.event.geyser':'GEYSER DE SÈVE','stage08.event.rail':'RAIL VASCULAIRE','stage08.event.rupture':'RUPTURE ARTÉRIELLE','stage08.event.warning':'LES VAISSEAUX VIVANTS TRANCHENT LE CHAMP','stage08.event.fixed':'ÉVÉNEMENT FIXE','stage08.objective.boss':'DÉTRUISEZ LA COURONNE-RACINE ABYSSALE'
});


Object.assign(TEXT.ko,{
  'stage07.enemy.abyssSpore':'심연 포자체','stage07.boss':'밤꽃 모체','stage07.boss.warning':'살아 있는 성운의 중심 꽃이 개방됩니다','stage07.event.sporeTide':'포자 범람','stage07.event.rootProcession':'뿌리 행렬','stage07.event.rootCage':'뿌리 감옥','stage07.event.sporeRain':'포자 낙하','stage07.event.blackBloom':'검은 개화','stage07.event.warning':'살아 있는 뿌리가 안전 지대를 조입니다','stage07.event.fixed':'고정 사건','stage07.objective.boss':'밤꽃 모체를 제거하라'
});
Object.assign(TEXT.en,{
  'stage07.enemy.abyssSpore':'Abyss Spore','stage07.boss':'Nightbloom Matriarch','stage07.boss.warning':'THE HEART-FLOWER OF THE LIVING NEBULA OPENS','stage07.event.sporeTide':'SPORE TIDE','stage07.event.rootProcession':'ROOT PROCESSION','stage07.event.rootCage':'ROOT CAGE','stage07.event.sporeRain':'SPORE RAIN','stage07.event.blackBloom':'BLACK BLOOM','stage07.event.warning':'LIVING ROOTS ARE CLOSING THE SAFE LANES','stage07.event.fixed':'FIXED EVENT','stage07.objective.boss':'ELIMINATE THE NIGHTBLOOM MATRIARCH'
});
Object.assign(TEXT.ja,{
  'stage07.enemy.abyssSpore':'深淵胞子体','stage07.boss':'夜花母体','stage07.boss.warning':'生きた星雲の中枢花が開きます','stage07.event.sporeTide':'胞子潮','stage07.event.rootProcession':'根の行列','stage07.event.rootCage':'根の檻','stage07.event.sporeRain':'胞子降下','stage07.event.blackBloom':'黒の開花','stage07.event.warning':'生きた根が安全地帯を締め付けます','stage07.event.fixed':'固定イベント','stage07.objective.boss':'夜花母体を排除せよ'
});
Object.assign(TEXT['zh-CN'],{
  'stage07.enemy.abyssSpore':'深渊孢子体','stage07.boss':'夜花母体','stage07.boss.warning':'活体星云的核心花正在开放','stage07.event.sporeTide':'孢子潮','stage07.event.rootProcession':'根须行列','stage07.event.rootCage':'根须牢笼','stage07.event.sporeRain':'孢子降落','stage07.event.blackBloom':'黑色绽放','stage07.event.warning':'活体根须正在压缩安全区域','stage07.event.fixed':'固定事件','stage07.objective.boss':'消灭夜花母体'
});
Object.assign(TEXT.es,{
  'stage07.enemy.abyssSpore':'Espora Abisal','stage07.boss':'Matriarca Noctiflora','stage07.boss.warning':'SE ABRE LA FLOR CENTRAL DE LA NÉBULA VIVA','stage07.event.sporeTide':'MAREA DE ESPORAS','stage07.event.rootProcession':'PROCESIÓN DE RAÍCES','stage07.event.rootCage':'JAULA DE RAÍCES','stage07.event.sporeRain':'LLUVIA DE ESPORAS','stage07.event.blackBloom':'FLORACIÓN NEGRA','stage07.event.warning':'LAS RAÍCES VIVAS CIERRAN LAS ZONAS SEGURAS','stage07.event.fixed':'EVENTO FIJO','stage07.objective.boss':'ELIMINA A LA MATRIARCA NOCTIFLORA'
});
Object.assign(TEXT.fr,{
  'stage07.enemy.abyssSpore':'Spore Abyssale','stage07.boss':'Matriarche Noctiflore','stage07.boss.warning':'LA FLEUR-CŒUR DE LA NÉBULEUSE VIVANTE S’OUVRE','stage07.event.sporeTide':'MARÉE DE SPORES','stage07.event.rootProcession':'PROCESSION DE RACINES','stage07.event.rootCage':'CAGE DE RACINES','stage07.event.sporeRain':'PLUIE DE SPORES','stage07.event.blackBloom':'FLORAISON NOIRE','stage07.event.warning':'LES RACINES VIVANTES REFERMENT LES ZONES SÛRES','stage07.event.fixed':'ÉVÉNEMENT FIXE','stage07.objective.boss':'ÉLIMINEZ LA MATRIARCHE NOCTIFLORE'
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



const STACKFALL_SIGNAL_STAGE_TEXT={
  'stage13.enemy.relayMite':'Relay Mite','stage13.boss':'Deadband Overseer','stage13.boss.warning':'THE DEAD RELAY OVERSEER COMES ONLINE','stage13.event.relaySwarm':'RELAY SWARM','stage13.event.phaseProcession':'PHASE PROCESSION','stage13.event.carrierScan':'CARRIER SCAN','stage13.event.staticFall':'STATIC FALL','stage13.event.deadbandLock':'DEADBAND LOCK','stage13.event.warning':'BROKEN CARRIERS ARE SCANNING THE SAFE SPACE','stage13.event.fixed':'FIXED EVENT','stage13.objective.boss':'DEFEAT THE DEADBAND OVERSEER',
  'stage14.enemy.jammerKite':'Jammer Kite','stage14.boss':'Noise Harvester','stage14.boss.warning':'THE NARROWS NOISE HARVESTER DRAWS IN THE SIGNAL','stage14.event.jammerFlight':'JAMMER FLIGHT','stage14.event.relaySwarm':'RELAY SWARM','stage14.event.noiseGrid':'NOISE GRID','stage14.event.carrierBreak':'CARRIER BREAK','stage14.event.whiteout':'SIGNAL WHITEOUT','stage14.event.warning':'STATIC LAYERS ARE CUTTING THE MOVEMENT LANES','stage14.event.fixed':'FIXED EVENT','stage14.objective.boss':'DESTROY THE NOISE HARVESTER',
  'stage15.enemy.packetLancer':'Packet Lancer','stage15.boss':'Multiplex Engine','stage15.boss.warning':'THE MULTIPLEX TRANSMISSION ENGINE STARTS','stage15.event.packetCharge':'PACKET CHARGE','stage15.event.jammerProcession':'JAMMER PROCESSION','stage15.event.multiplex':'MULTIPLEX LANES','stage15.event.burstSwitch':'BURST SWITCH','stage15.event.checksum':'CHECKSUM STORM','stage15.event.warning':'TRANSMISSION CHANNELS ARE REWIRING THE FIELD','stage15.event.fixed':'FIXED EVENT','stage15.objective.boss':'SHUT DOWN THE MULTIPLEX ENGINE',
  'stage16.boss':'Null Beacon','stage16.boss.warning':'THE BLIND SECTOR BEACON ERASES EVERY RESPONSE','stage16.event.packetProcession':'PACKET PROCESSION','stage16.event.jammerColumn':'JAMMER COLUMN','stage16.event.deadZone':'DEAD ZONE','stage16.event.blindCross':'BLIND CROSS','stage16.event.nullSweep':'NULL SWEEP','stage16.event.warning':'SENSOR GAPS ARE SWALLOWING THE FIELD','stage16.event.fixed':'FIXED EVENT','stage16.objective.boss':'DESTROY THE NULL BEACON',
  'stage17.enemy.cipherWarden':'Cipher Warden','stage17.boss':'Protocol Custodian','stage17.boss.warning':'THE DISCARDED PROTOCOL CUSTODIAN BEGINS LOCKDOWN','stage17.event.wardenLock':'WARDEN LOCK','stage17.event.packetColumn':'PACKET COLUMN','stage17.event.parityMortar':'PARITY MORTAR','stage17.event.cipherWalls':'CIPHER WALLS','stage17.event.protocolSeal':'PROTOCOL SEAL','stage17.event.warning':'SEALED RULES ARE LOCKING THE SAFE SPACE','stage17.event.fixed':'FIXED EVENT','stage17.objective.boss':'DEFEAT THE PROTOCOL CUSTODIAN',
  'stage18.boss':'Silence Mainframe','stage18.boss.warning':'THE THIRD CONSTELLATIONS CENTRAL ARRAY COMES ONLINE','stage18.event.relayConvergence':'RELAY CONVERGENCE','stage18.event.cipherConvergence':'CIPHER CONVERGENCE','stage18.event.multiplexCross':'MULTIPLEX CROSS','stage18.event.blindGrid':'BLIND GRID','stage18.event.silenceCollapse':'SILENCE COLLAPSE','stage18.event.warning':'THE ENTIRE DEAD RELAY NETWORK CONVERGES ON THE CORE','stage18.event.fixed':'FIXED EVENT','stage18.objective.boss':'DESTROY THE SILENCE MAINFRAME'
};
Object.assign(TEXT.en,STACKFALL_SIGNAL_STAGE_TEXT);
for(const locale of['ja','zh-CN','es','fr'])Object.assign(TEXT[locale],STACKFALL_SIGNAL_STAGE_TEXT);
Object.assign(TEXT.ko,{
  'stage13.enemy.relayMite':'중계 기생체','stage13.boss':'무응답 감시자','stage13.boss.warning':'죽은 중계소의 감시자가 기동합니다','stage13.event.relaySwarm':'중계 군집','stage13.event.phaseProcession':'위상 행렬','stage13.event.carrierScan':'반송파 스캔','stage13.event.staticFall':'정적 낙하','stage13.event.deadbandLock':'무응답 봉쇄','stage13.event.warning':'끊어진 반송파가 안전 지대를 스캔합니다','stage13.event.fixed':'고정 사건','stage13.objective.boss':'무응답 감시자를 격파하라',
  'stage14.enemy.jammerKite':'재머 비행체','stage14.boss':'잡음 수확기','stage14.boss.warning':'협로의 잡음 수확기가 신호를 끌어모읍니다','stage14.event.jammerFlight':'재머 비행','stage14.event.relaySwarm':'중계 군집','stage14.event.noiseGrid':'잡음 격자','stage14.event.carrierBreak':'반송파 붕괴','stage14.event.whiteout':'신호 백색화','stage14.event.warning':'잡음층이 이동 경로를 잘라냅니다','stage14.event.fixed':'고정 사건','stage14.objective.boss':'잡음 수확기를 파괴하라',
  'stage15.enemy.packetLancer':'패킷 창기병','stage15.boss':'다중송신 기관','stage15.boss.warning':'다중 채널 송신 기관이 가동됩니다','stage15.event.packetCharge':'패킷 돌진','stage15.event.jammerProcession':'재머 행렬','stage15.event.multiplex':'다중 채널선','stage15.event.burstSwitch':'버스트 전환','stage15.event.checksum':'체크섬 폭풍','stage15.event.warning':'송신 채널이 전장을 빠르게 재배선합니다','stage15.event.fixed':'고정 사건','stage15.objective.boss':'다중송신 기관을 정지시켜라',
  'stage16.boss':'널 비콘','stage16.boss.warning':'블라인드 섹터의 비콘이 모든 응답을 지웁니다','stage16.event.packetProcession':'패킷 행렬','stage16.event.jammerColumn':'재머 종대','stage16.event.deadZone':'무응답 지대','stage16.event.blindCross':'블라인드 교차선','stage16.event.nullSweep':'널 스윕','stage16.event.warning':'센서 공백이 전장을 삼킵니다','stage16.event.fixed':'고정 사건','stage16.objective.boss':'널 비콘을 파괴하라',
  'stage17.enemy.cipherWarden':'암호 수호체','stage17.boss':'프로토콜 수문장','stage17.boss.warning':'폐기 프로토콜의 수문장이 봉쇄를 시작합니다','stage17.event.wardenLock':'수호체 봉쇄','stage17.event.packetColumn':'패킷 종대','stage17.event.parityMortar':'패리티 포격','stage17.event.cipherWalls':'암호 장벽','stage17.event.protocolSeal':'프로토콜 봉인','stage17.event.warning':'봉인된 규칙이 안전 지대를 잠급니다','stage17.event.fixed':'고정 사건','stage17.objective.boss':'프로토콜 수문장을 격파하라',
  'stage18.boss':'침묵 메인프레임','stage18.boss.warning':'세 번째 별자리의 중심 배열이 기동합니다','stage18.event.relayConvergence':'중계 수렴','stage18.event.cipherConvergence':'암호 수렴','stage18.event.multiplexCross':'다중송신 교차선','stage18.event.blindGrid':'블라인드 격자','stage18.event.silenceCollapse':'침묵 붕괴','stage18.event.warning':'죽은 중계망 전체가 중심핵으로 수렴합니다','stage18.event.fixed':'고정 사건','stage18.objective.boss':'침묵 메인프레임을 파괴하라'
});
Object.assign(TEXT.ja,{'stage13.enemy.relayMite':'中継寄生体','stage13.boss':'デッドバンド監視機','stage13.objective.boss':'デッドバンド監視機を倒せ','stage14.enemy.jammerKite':'妨害飛行体','stage14.boss':'ノイズ収穫機','stage14.objective.boss':'ノイズ収穫機を破壊せよ','stage15.enemy.packetLancer':'パケット槍騎','stage15.boss':'多重送信機関','stage15.objective.boss':'多重送信機関を停止せよ','stage16.boss':'ヌルビーコン','stage16.objective.boss':'ヌルビーコンを破壊せよ','stage17.enemy.cipherWarden':'暗号守護体','stage17.boss':'プロトコル番人','stage17.objective.boss':'プロトコル番人を倒せ','stage18.boss':'沈黙メインフレーム','stage18.objective.boss':'沈黙メインフレームを破壊せよ'});
Object.assign(TEXT['zh-CN'],{'stage13.enemy.relayMite':'中继寄生体','stage13.boss':'死区监视者','stage13.objective.boss':'击败死区监视者','stage14.enemy.jammerKite':'干扰飞行体','stage14.boss':'噪声收割机','stage14.objective.boss':'摧毁噪声收割机','stage15.enemy.packetLancer':'数据枪骑','stage15.boss':'多路传输引擎','stage15.objective.boss':'关闭多路传输引擎','stage16.boss':'空值信标','stage16.objective.boss':'摧毁空值信标','stage17.enemy.cipherWarden':'密码守卫','stage17.boss':'协议守门者','stage17.objective.boss':'击败协议守门者','stage18.boss':'静默主机','stage18.objective.boss':'摧毁静默主机'});
Object.assign(TEXT.es,{'stage13.enemy.relayMite':'Ácaro de Relé','stage13.boss':'Supervisor de Banda Muerta','stage13.objective.boss':'DERROTA AL SUPERVISOR DE BANDA MUERTA','stage14.enemy.jammerKite':'Cometa Inhibidora','stage14.boss':'Cosechador de Ruido','stage14.objective.boss':'DESTRUYE EL COSECHADOR DE RUIDO','stage15.enemy.packetLancer':'Lancero de Paquetes','stage15.boss':'Motor Múltiplex','stage15.objective.boss':'DETÉN EL MOTOR MÚLTIPLEX','stage16.boss':'Baliza Nula','stage16.objective.boss':'DESTRUYE LA BALIZA NULA','stage17.enemy.cipherWarden':'Guardián de Cifrado','stage17.boss':'Custodio de Protocolo','stage17.objective.boss':'DERROTA AL CUSTODIO DE PROTOCOLO','stage18.boss':'Mainframe del Silencio','stage18.objective.boss':'DESTRUYE EL MAINFRAME DEL SILENCIO'});
Object.assign(TEXT.fr,{'stage13.enemy.relayMite':'Acarien Relais','stage13.boss':'Superviseur de Bande Morte','stage13.objective.boss':'VAINCRE LE SUPERVISEUR DE BANDE MORTE','stage14.enemy.jammerKite':'Cerf-volant Brouilleur','stage14.boss':'Moissonneur de Bruit','stage14.objective.boss':'DÉTRUIRE LE MOISSONNEUR DE BRUIT','stage15.enemy.packetLancer':'Lancier de Paquets','stage15.boss':'Moteur Multiplex','stage15.objective.boss':'ARRÊTER LE MOTEUR MULTIPLEX','stage16.boss':'Balise Nulle','stage16.objective.boss':'DÉTRUIRE LA BALISE NULLE','stage17.enemy.cipherWarden':'Gardien du Chiffrement','stage17.boss':'Custode du Protocole','stage17.objective.boss':'VAINCRE LE CUSTODE DU PROTOCOLE','stage18.boss':'Mainframe du Silence','stage18.objective.boss':'DÉTRUIRE LE MAINFRAME DU SILENCE'});

