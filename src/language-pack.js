const STACKFALL_SUPPORTED_LANGUAGES=['ko','en','ja','zh-CN','es','fr'];
try{
  const saved=JSON.parse(localStorage.getItem('stackfall.settings')||'{}');
  if(STACKFALL_SUPPORTED_LANGUAGES.includes(saved.language))GAME_SETTINGS.language=saved.language;
  GAME_SETTINGS.damageNumbers=typeof saved.damageNumbers==='boolean'?saved.damageNumbers:true;
  GAME_SETTINGS.screenShake=typeof saved.screenShake==='boolean'?saved.screenShake:true;
}catch{GAME_SETTINGS.damageNumbers=true;GAME_SETTINGS.screenShake=true;}

Object.assign(TEXT.ko,{'choice.basic':'기본 무기','settings.damageNumbers':'피해량 표시','settings.screenShake':'화면 흔들림'});
Object.assign(TEXT.en,{'choice.basic':'BASIC WEAPON','settings.damageNumbers':'DAMAGE NUMBERS','settings.screenShake':'SCREEN SHAKE'});
Object.assign(TEXT.ja,{'choice.basic':'基本武器','settings.damageNumbers':'ダメージ表示','settings.screenShake':'画面振動'});
TEXT['zh-CN']={
  'menu.startEquipment':'初始装备','menu.start':'开始运行','menu.settings':'设置','hud.core':'核心','hud.threat':'威胁','hud.chain':'连击',
  'choice.kicker':'系统重构','choice.title':'升级','choice.prompt':'选择一项','choice.equipment':'装备','choice.passive':'被动','choice.basic':'基础武器','choice.stack':'叠加','choice.owned':'持有',
  'banner.resonance':'共鸣','banner.stack':'叠加效果','pause.title':'暂停','pause.resume':'继续','pause.restart':'重新开始','pause.menu':'主菜单','pause.settings':'设置',
  'gameover.title':'运行结束','gameover.time':'生存时间','gameover.kills':'击杀','gameover.combo':'最高连击','gameover.level':'到达等级','gameover.retry':'再试一次','gameover.menu':'主菜单',
  'settings.title':'设置','settings.language':'语言','settings.master':'全部声音','settings.combat':'战斗音效','settings.ui':'界面音效','settings.ambient':'宇宙环境音','settings.damageNumbers':'伤害数字','settings.screenShake':'画面震动','settings.close':'关闭',
  'boss.warning':'警告','boss.approaching':'首领接近','boss.rift':'检测到裂隙','boss.eclipse':'日蚀君主','boss.seraph':'星云炽天使','boss.mini':'裂隙骑士','empty':'空'
};
TEXT.es={
  'menu.startEquipment':'EQUIPO INICIAL','menu.start':'INICIAR','menu.settings':'AJUSTES','hud.core':'NÚCLEO','hud.threat':'AMENAZA','hud.chain':'CADENA',
  'choice.kicker':'REESCRITURA DEL SISTEMA','choice.title':'SUBIR NIVEL','choice.prompt':'Elige uno','choice.equipment':'EQUIPO','choice.passive':'PASIVA','choice.basic':'ARMA BÁSICA','choice.stack':'ACUMULACIÓN','choice.owned':'POSEÍDO',
  'banner.resonance':'RESONANCIA','banner.stack':'EFECTO DE ACUMULACIÓN','pause.title':'PAUSA','pause.resume':'CONTINUAR','pause.restart':'REINICIAR PARTIDA','pause.menu':'MENÚ PRINCIPAL','pause.settings':'AJUSTES',
  'gameover.title':'FIN DE PARTIDA','gameover.time':'SUPERVIVENCIA','gameover.kills':'BAJAS','gameover.combo':'CADENA MÁXIMA','gameover.level':'NIVEL','gameover.retry':'REINTENTAR','gameover.menu':'MENÚ PRINCIPAL',
  'settings.title':'AJUSTES','settings.language':'IDIOMA','settings.master':'SONIDO GENERAL','settings.combat':'EFECTOS DE COMBATE','settings.ui':'EFECTOS DE UI','settings.ambient':'AMBIENTE ESPACIAL','settings.damageNumbers':'NÚMEROS DE DAÑO','settings.screenShake':'VIBRACIÓN DE PANTALLA','settings.close':'CERRAR',
  'boss.warning':'ALERTA','boss.approaching':'JEFE ACERCÁNDOSE','boss.rift':'GRIETA DETECTADA','boss.eclipse':'Señor del Eclipse','boss.seraph':'Serafín de la Nebulosa','boss.mini':'Caballero de la Grieta','empty':'VACÍO'
};
TEXT.fr={
  'menu.startEquipment':'ÉQUIPEMENT INITIAL','menu.start':'DÉMARRER','menu.settings':'PARAMÈTRES','hud.core':'NOYAU','hud.threat':'MENACE','hud.chain':'CHAÎNE',
  'choice.kicker':'RÉÉCRITURE DU SYSTÈME','choice.title':'NIVEAU SUPÉRIEUR','choice.prompt':'Choisissez-en un','choice.equipment':'ÉQUIPEMENT','choice.passive':'PASSIF','choice.basic':'ARME DE BASE','choice.stack':'CUMUL','choice.owned':'POSSÉDÉ',
  'banner.resonance':'RÉSONANCE','banner.stack':'EFFET DE CUMUL','pause.title':'PAUSE','pause.resume':'REPRENDRE','pause.restart':'RECOMMENCER','pause.menu':'MENU PRINCIPAL','pause.settings':'PARAMÈTRES',
  'gameover.title':'FIN DE PARTIE','gameover.time':'SURVIE','gameover.kills':'ÉLIMINATIONS','gameover.combo':'CHAÎNE MAX','gameover.level':'NIVEAU','gameover.retry':'RÉESSAYER','gameover.menu':'MENU PRINCIPAL',
  'settings.title':'PARAMÈTRES','settings.language':'LANGUE','settings.master':'SON GÉNÉRAL','settings.combat':'EFFETS DE COMBAT','settings.ui':'EFFETS UI','settings.ambient':'AMBIANCE SPATIALE','settings.damageNumbers':'CHIFFRES DE DÉGÂTS','settings.screenShake':'SECOUSSE D’ÉCRAN','settings.close':'FERMER',
  'boss.warning':'ALERTE','boss.approaching':'BOSS EN APPROCHE','boss.rift':'FAILLE DÉTECTÉE','boss.eclipse':'Seigneur de l’Éclipse','boss.seraph':'Séraphin de la Nébuleuse','boss.mini':'Chevalier de la Faille','empty':'VIDE'
};