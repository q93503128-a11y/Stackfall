const STACKFALL_SUPPORTED_LANGUAGES=['ko','en','ja','zh-CN','es','fr'];
try{
  const saved=JSON.parse(localStorage.getItem('stackfall.settings')||'{}');
  if(STACKFALL_SUPPORTED_LANGUAGES.includes(saved.language))GAME_SETTINGS.language=saved.language;
  GAME_SETTINGS.damageNumbers=typeof saved.damageNumbers==='boolean'?saved.damageNumbers:true;
}catch{GAME_SETTINGS.damageNumbers=true;}

Object.assign(TEXT.ko,{'choice.basic':'기본 무기','settings.damageNumbers':'피해량 표시'});
Object.assign(TEXT.en,{'choice.basic':'BASIC WEAPON','settings.damageNumbers':'DAMAGE NUMBERS'});
Object.assign(TEXT.ja,{'choice.basic':'基本武器','settings.damageNumbers':'ダメージ表示'});
TEXT['zh-CN']={
  'menu.startEquipment':'初始装备','menu.start':'开始运行','menu.settings':'设置','hud.core':'核心','hud.threat':'威胁','hud.chain':'连击',
  'choice.kicker':'系统重构','choice.title':'升级','choice.prompt':'选择一项','choice.equipment':'装备','choice.passive':'被动','choice.basic':'基础武器','choice.stack':'叠加','choice.owned':'持有',
  'banner.resonance':'共鸣','banner.stack':'叠加效果','pause.title':'暂停','pause.resume':'继续','pause.restart':'重新开始','pause.menu':'主菜单','pause.settings':'设置',
  'gameover.title':'运行结束','gameover.time':'生存时间','gameover.kills':'击杀','gameover.combo':'最高连击','gameover.level':'到达等级','gameover.retry':'再试一次','gameover.menu':'主菜单',
  'settings.title':'设置','settings.language':'语言','settings.master':'全部声音','settings.combat':'战斗音效','settings.ui':'界面音效','settings.ambient':'宇宙环境音','settings.damageNumbers':'伤害数字','settings.close':'关闭',
  'boss.warning':'警告','boss.approaching':'首领接近','boss.rift':'检测到裂隙','boss.eclipse':'日蚀君主','boss.seraph':'星云炽天使','boss.mini':'裂隙骑士','empty':'空'
};
TEXT.es={
  'menu.startEquipment':'EQUIPO INICIAL','menu.start':'INICIAR','menu.settings':'AJUSTES','hud.core':'NÚCLEO','hud.threat':'AMENAZA','hud.chain':'CADENA',
  'choice.kicker':'REESCRITURA DEL SISTEMA','choice.title':'SUBIR NIVEL','choice.prompt':'Elige uno','choice.equipment':'EQUIPO','choice.passive':'PASIVA','choice.basic':'ARMA BÁSICA','choice.stack':'ACUMULACIÓN','choice.owned':'POSEÍDO',
  'banner.resonance':'RESONANCIA','banner.stack':'EFECTO DE ACUMULACIÓN','pause.title':'PAUSA','pause.resume':'CONTINUAR','pause.restart':'REINICIAR PARTIDA','pause.menu':'MENÚ PRINCIPAL','pause.settings':'AJUSTES',
  'gameover.title':'FIN DE PARTIDA','gameover.time':'SUPERVIVENCIA','gameover.kills':'BAJAS','gameover.combo':'CADENA MÁXIMA','gameover.level':'NIVEL','gameover.retry':'REINTENTAR','gameover.menu':'MENÚ PRINCIPAL',
  'settings.title':'AJUSTES','settings.language':'IDIOMA','settings.master':'SONIDO GENERAL','settings.combat':'EFECTOS DE COMBATE','settings.ui':'EFECTOS DE UI','settings.ambient':'AMBIENTE ESPACIAL','settings.damageNumbers':'NÚMEROS DE DAÑO','settings.close':'CERRAR',
  'boss.warning':'ALERTA','boss.approaching':'JEFE ACERCÁNDOSE','boss.rift':'GRIETA DETECTADA','boss.eclipse':'Señor del Eclipse','boss.seraph':'Serafín de la Nebulosa','boss.mini':'Caballero de la Grieta','empty':'VACÍO'
};
TEXT.fr={
  'menu.startEquipment':'ÉQUIPEMENT INITIAL','menu.start':'DÉMARRER','menu.settings':'PARAMÈTRES','hud.core':'NOYAU','hud.threat':'MENACE','hud.chain':'CHAÎNE',
  'choice.kicker':'RÉÉCRITURE DU SYSTÈME','choice.title':'NIVEAU SUPÉRIEUR','choice.prompt':'Choisissez-en un','choice.equipment':'ÉQUIPEMENT','choice.passive':'PASSIF','choice.basic':'ARME DE BASE','choice.stack':'CUMUL','choice.owned':'POSSÉDÉ',
  'banner.resonance':'RÉSONANCE','banner.stack':'EFFET DE CUMUL','pause.title':'PAUSE','pause.resume':'REPRENDRE','pause.restart':'RECOMMENCER','pause.menu':'MENU PRINCIPAL','pause.settings':'PARAMÈTRES',
  'gameover.title':'FIN DE PARTIE','gameover.time':'SURVIE','gameover.kills':'ÉLIMINATIONS','gameover.combo':'CHAÎNE MAX','gameover.level':'NIVEAU','gameover.retry':'RÉESSAYER','gameover.menu':'MENU PRINCIPAL',
  'settings.title':'PARAMÈTRES','settings.language':'LANGUE','settings.master':'SON GÉNÉRAL','settings.combat':'EFFETS DE COMBAT','settings.ui':'EFFETS UI','settings.ambient':'AMBIANCE SPATIALE','settings.damageNumbers':'CHIFFRES DE DÉGÂTS','settings.close':'FERMER',
  'boss.warning':'ALERTE','boss.approaching':'BOSS EN APPROCHE','boss.rift':'FAILLE DÉTECTÉE','boss.eclipse':'Seigneur de l’Éclipse','boss.seraph':'Séraphin de la Nébuleuse','boss.mini':'Chevalier de la Faille','empty':'VIDE'
};

WEAPONS.core={name:'코어 펄스',icon:'✷',color:'#eafcff',role:'기본 무기',desc:'코어에서 자동 발사되는 기본 광자탄.',starter:false,resonance:{}};
WEAPONS.arc={name:'성운 부메랑',icon:'☾',color:'#69ffe0',role:'공격 / 곡선',desc:'부드러운 곡선을 그리며 적을 베고 되돌아오는 성운 칼날.',starter:true,resonance:{}};

const EXTRA_WEAPON_TEXT={
  core:{
    ko:['코어 펄스','기본 무기','코어에서 자동 발사되는 기본 광자탄.'],en:['Core Pulse','Basic Weapon','The core automatically fires photon bolts.'],ja:['コアパルス','基本武器','コアから自動発射される光子弾。'],
    'zh-CN':['核心脉冲','基础武器','核心自动发射光子弹。'],es:['Pulso del Núcleo','Arma básica','El núcleo dispara automáticamente rayos de fotones.'],fr:['Impulsion du Noyau','Arme de base','Le noyau tire automatiquement des projectiles photoniques.']},
  arc:{
    ko:['성운 부메랑','공격 / 곡선','부드러운 곡선을 그리며 적을 베고 되돌아오는 성운 칼날.'],en:['Nebula Boomerang','Attack / Curved','A nebula blade sweeps through a smooth curve and returns.'],ja:['星雲ブーメラン','攻撃 / 曲線','滑らかな曲線を描いて敵を斬り、戻ってくる星雲刃。'],
    'zh-CN':['星云回旋刃','攻击 / 曲线','星云刀刃沿平滑曲线切过敌人并返回。'],es:['Bumerán de Nebulosa','Ataque / Curvo','Una hoja de nebulosa recorre una curva suave y regresa.'],fr:['Boomerang Nébulaire','Attaque / Courbe','Une lame nébulaire suit une courbe fluide puis revient.']}
};
Object.assign(WEAPON_TEXT,EXTRA_WEAPON_TEXT);

const WEX={
  blade:{'zh-CN':['脉冲刃','攻击 / 近战','新月光子刃环绕核心切割附近敌人。'],es:['Hoja de Pulso','Ataque / Cuerpo a cuerpo','Hojas fotónicas en forma de luna orbitan y cortan enemigos cercanos.'],fr:['Lame à Impulsion','Attaque / Mêlée','Des lames photoniques en croissant orbitent et tranchent les ennemis proches.']},
  ember:{'zh-CN':['星光施放器','攻击 / 弹幕','从核心直接快速发射会爆裂的星光弹。'],es:['Lanzador Estelar','Ataque / Salva','Dispara rápidamente proyectiles estelares explosivos desde el núcleo.'],fr:['Lanceur Stellaire','Attaque / Rafale','Tire rapidement des projectiles stellaires explosifs depuis le noyau.']},
  bulwark:{'zh-CN':['壁垒无人机','防御 / 反击','防御卫星降低伤害并提供护盾与反击。'],es:['Dron Baluarte','Defensa / Contraataque','Satélites defensivos reducen el daño y aportan escudos y contraataques.'],fr:['Drone Rempart','Défense / Riposte','Des satellites défensifs réduisent les dégâts et fournissent boucliers et ripostes.']},
  gravity:{'zh-CN':['重力井','控制 / 聚集','部署扭曲空间，将敌人拉向一点。'],es:['Pozo Gravitatorio','Control / Agrupación','Despliega espacio deformado que atrae enemigos a un punto.'],fr:['Puits Gravitationnel','Contrôle / Regroupement','Déploie un espace déformé qui attire les ennemis vers un point.']},
  comet:{'zh-CN':['彗星长枪','攻击 / 贯穿','长水晶枪拖着彗尾贯穿敌人。'],es:['Lanza Cometa','Ataque / Perforación','Una larga lanza de cristal atraviesa enemigos con una cola de cometa.'],fr:['Lance Cométaire','Attaque / Perforation','Une longue lance de cristal traverse les ennemis avec une traînée cométaire.']},
  prism:{'zh-CN':['星座棱镜','召唤 / 光束','环绕卫星发射贯穿整条路径的即时光束。'],es:['Prisma de Constelación','Invocación / Rayo','Satélites orbitales disparan rayos instantáneos que atraviesan toda la trayectoria.'],fr:['Prisme de Constellation','Invocation / Rayon','Des satellites orbitaux tirent des rayons instantanés sur toute leur trajectoire.']},
  chrono:{'zh-CN':['时间环','控制 / 支援','减慢附近时间，并在高叠加时释放时间波。'],es:['Anillo Temporal','Control / Apoyo','Ralentiza el tiempo cercano y luego emite ondas temporales.'],fr:['Anneau Temporel','Contrôle / Soutien','Ralentit le temps proche puis émet des ondes temporelles.']}
};
for(const [key,langs] of Object.entries(WEX))Object.assign(WEAPON_TEXT[key],langs);

const PEX={
  magnet:{'zh-CN':['磁力核心','拾取范围 +28'],es:['Núcleo Magnético','Alcance de recogida +28'],fr:['Noyau Magnétique','Portée de collecte +28']},
  echo:{'zh-CN':['回声信标','提高装备触发复制概率'],es:['Baliza de Eco','Probabilidad de duplicar activaciones'],fr:['Balise d’Écho','Chance de dupliquer les activations']},
  power:{'zh-CN':['功率增幅器','全部伤害 +12%'],es:['Amplificador de Potencia','Todo el daño +12%'],fr:['Amplificateur de Puissance','Tous les dégâts +12%']},
  haste:{'zh-CN':['加速回路','攻击间隔 -8%'],es:['Circuito de Aceleración','Intervalo de ataque -8%'],fr:['Circuit d’Accélération','Intervalle d’attaque -8%']},
  vitality:{'zh-CN':['再生装甲','最大生命 +15并恢复'],es:['Blindaje Regenerativo','Vida máxima +15 y cura'],fr:['Blindage Régénérant','PV max +15 et soin']},
  speed:{'zh-CN':['矢量推进器','移动速度 +7%'],es:['Propulsor Vectorial','Velocidad de movimiento +7%'],fr:['Propulseur Vectoriel','Vitesse de déplacement +7%']},
  crit:{'zh-CN':['弱点解析','暴击率 +5%'],es:['Análisis de Debilidad','Probabilidad crítica +5%'],fr:['Analyse de Faiblesse','Chance critique +5%']},
  chain:{'zh-CN':['连锁过载','连击持续时间 +15%'],es:['Sobrecarga de Cadena','Duración de cadena +15%'],fr:['Surcharge de Chaîne','Durée de chaîne +15%']},
  greed:{'zh-CN':['开拓契约','敌人生命 +8%，经验 +18%'],es:['Contrato de Frontera','Vida enemiga +8%, XP +18%'],fr:['Contrat de Frontière','PV ennemis +8 %, XP +18 %']},
  armor:{'zh-CN':['冲击吸收器','受到伤害 -6%'],es:['Absorbedor de Impacto','Daño recibido -6%'],fr:['Absorbeur d’Impact','Dégâts reçus -6%']}
};
for(const [key,langs] of Object.entries(PEX))Object.assign(PASSIVE_TEXT[key],langs);

STACK_EFFECTS.core=[['초기 점화','기본 광자탄 한 발을 자동 발사한다.'],['쌍발 코어','기본 광자탄을 두 발 발사한다.'],['코어 관통','광자탄이 적 하나를 추가로 관통한다.'],['펄스 폭발','명중 시 작은 광자 폭발을 일으킨다.'],['삼중 코어','기본 광자탄을 세 발 발사한다.'],['항성 펄스','주기적으로 크고 강한 관통탄을 발사한다.']];
STACK_EFFECTS.arc=[['곡선 비행','성운 칼날 하나가 부드러운 곡선을 따라 날아간다.'],['쌍곡선','서로 반대 방향으로 휘는 칼날 두 개를 발사한다.'],['넓은 궤도','칼날 크기와 곡선 폭, 피해가 증가한다.'],['귀환 궤도','칼날이 되돌아오며 적을 다시 공격한다.'],['오로라 흔적','비행 경로가 잠시 피해를 주는 빛띠로 남는다.'],['성운 나선','세 개의 칼날이 넓은 나선 궤도를 그린다.']];
Object.assign(STACK_EFFECTS_EN,{core:['Ignition','Twin Core','Core Pierce','Pulse Burst','Triple Core','Stellar Pulse'],arc:['Curved Flight','Twin Curves','Wide Orbit','Return Orbit','Aurora Trace','Nebula Spiral']});
Object.assign(STACK_DESC_EN,{core:['Automatically fires one photon bolt.','Fires two basic photon bolts.','Bolts pierce one additional enemy.','Hits create a small photon burst.','Fires three basic photon bolts.','Periodically fires a large powerful piercing bolt.'],arc:['One nebula blade follows a smooth curve.','Fires two blades bending in opposite directions.','Blade size, curve width and damage increase.','The blade returns and can strike enemies again.','Its path remains briefly as a damaging aurora ribbon.','Three blades carve a wide spiral path.']});
Object.assign(STACK_EFFECTS_JA,{core:['初期点火','双発コア','コア貫通','パルス爆発','三連コア','恒星パルス'],arc:['曲線飛行','双曲線','広域軌道','帰還軌道','オーロラ痕跡','星雲螺旋']});
Object.assign(STACK_DESC_JA,{core:['基本光子弾を1発自動発射する。','基本光子弾を2発発射する。','光子弾が追加で1体を貫通する。','命中時に小さな光子爆発を起こす。','基本光子弾を3発発射する。','定期的に大きく強力な貫通弾を放つ。'],arc:['星雲刃1枚が滑らかな曲線を飛ぶ。','逆方向へ曲がる刃を2枚放つ。','刃の大きさ、曲線幅、ダメージが増える。','刃が戻り、敵を再び攻撃できる。','飛行経路が短時間ダメージを与える光帯になる。','3枚の刃が広い螺旋軌道を描く。']});

const EXTRA_STACK={
  'zh-CN':{
    core:[['初始点火','自动发射一枚基础光子弹。'],['双发核心','发射两枚基础光子弹。'],['核心贯穿','光子弹额外贯穿一个敌人。'],['脉冲爆裂','命中时产生小型光子爆炸。'],['三重核心','发射三枚基础光子弹。'],['恒星脉冲','周期性发射大型强力贯穿弹。']],
    blade:[['月光轨道','一把光子刃环绕核心。'],['双月轨道','对面出现第二把刀刃。'],['加速轨道','旋转速度与攻击半径增加。'],['星痕波','命中时发射贯穿斩波。'],['三月蚀','加入第三把刀刃。'],['天体粉碎机','轨道扩大，连杀触发星爆。']],
    ember:[['第一颗星','向最近敌人发射爆裂星弹。'],['双星射击','同时发射两发。'],['星核贯穿','额外贯穿一个敌人。'],['星云分裂','命中后分裂为星屑。'],['三重星列','发射宽幅三连弹。'],['超新星弹头','周期性发射巨型贯穿弹。']],
    bulwark:[['防御卫星','降低受到的伤害。'],['连接装甲','生命与减伤进一步增加。'],['充能装甲','随时间恢复少量护盾。'],['反击壁垒','受击时释放反击冲击波。'],['堡垒核心','提高护盾容量与恢复量。'],['移动堡垒','周期性充能强力护盾。']],
    gravity:[['奇点种子','周期性生成小型重力井。'],['潮汐锁定','吸引范围与力量增加。'],['长寿奇点','重力井持续更久。'],['坍缩核心','中心区域持续造成伤害。'],['压缩坍缩','中心伤害与吸力大幅增加。'],['双生奇点','生成两个交叉奇点。']],
    comet:[['水晶长枪','一把长彗星枪贯穿敌人。'],['双重轨迹','并排发射两把长枪。'],['深层贯穿','枪体变大并贯穿更多目标。'],['彗星碎片','贯穿时散射冰星碎片。'],['余辉轨道','路径留下短暂伤害带。'],['大碰撞','消失时产生巨大爆炸。']],
    prism:[['单棱镜','卫星发射贯穿整条路径的光束。'],['双生棱镜','增加第二颗卫星。'],['宽幅折射','光束变宽，命中更多敌人。'],['星座连接','卫星连线也造成伤害。'],['多重焦点','每颗卫星发射两条光束。'],['天球仪式','三颗卫星高速发射光束。']],
    chrono:[['缓慢时间','减慢附近敌人。'],['宽广轨道','减速范围扩大。'],['时间加速','装备触发速度略微提高。'],['时间波','周期性释放伤害波。'],['瞬间静止','普通敌人被大幅减速。'],['永恒圆环','范围和减速达到最大。']],
    arc:[['曲线飞行','一把星云刃沿平滑曲线飞行。'],['双曲线','发射两把反向弯曲的刀刃。'],['宽广轨道','刀刃尺寸、曲线与伤害增加。'],['回归轨道','刀刃返回并再次攻击。'],['极光轨迹','路径留下短暂伤害光带。'],['星云螺旋','三把刀刃划出宽广螺旋。']]
  },
  es:{
    core:[['Ignición','Dispara un rayo fotónico básico.'],['Núcleo Doble','Dispara dos rayos.'],['Perforación','Los rayos perforan un enemigo extra.'],['Explosión de Pulso','Los impactos causan una pequeña explosión.'],['Núcleo Triple','Dispara tres rayos.'],['Pulso Estelar','Dispara periódicamente un gran rayo perforante.']],
    blade:[['Órbita Lunar','Una hoja orbita el núcleo.'],['Lunas Gemelas','Aparece una segunda hoja.'],['Órbita Acelerada','Aumentan velocidad y radio.'],['Onda de Cicatriz','Los golpes lanzan una onda perforante.'],['Eclipse Triple','Se añade una tercera hoja.'],['Triturador Celestial','La órbita crece y las cadenas causan explosiones.']],
    ember:[['Primera Estrella','Dispara una estrella explosiva.'],['Disparo Binario','Dispara dos proyectiles.'],['Perforación Estelar','Perfora un enemigo adicional.'],['División de Nebulosa','Los impactos se dividen en chispas.'],['Salva Triple','Dispara una salva ancha de tres.'],['Ojiva Supernova','Dispara una enorme bala perforante.']],
    bulwark:[['Satélite Defensivo','Reduce el daño recibido.'],['Blindaje Enlazado','Aumentan vida y reducción.'],['Blindaje Recargable','Regenera escudo con el tiempo.'],['Muro de Represalia','Recibir daño libera una onda.'],['Núcleo Fortaleza','Aumenta capacidad y recarga.'],['Fortaleza Móvil','Carga un escudo potente.']],
    gravity:[['Semilla Singular','Crea pozos gravitatorios.'],['Bloqueo Mareal','Aumentan alcance y fuerza.'],['Singularidad Longeva','Los pozos duran más.'],['Núcleo de Colapso','El centro causa daño continuo.'],['Colapso Comprimido','Aumentan mucho daño y atracción.'],['Singularidades Gemelas','Crea dos singularidades cruzadas.']],
    comet:[['Lanza de Cristal','Una lanza cometa perfora enemigos.'],['Trayectoria Doble','Dispara dos lanzas.'],['Perforación Profunda','Crece y perfora más objetivos.'],['Fragmentos de Cometa','Esparce fragmentos al perforar.'],['Rastro Residual','Deja una senda dañina.'],['Gran Impacto','Explota en un área enorme.']],
    prism:[['Prisma Único','Un satélite dispara un rayo hasta el borde.'],['Prismas Gemelos','Añade un segundo satélite.'],['Rayo Ancho','El rayo se ensancha.'],['Enlace de Constelación','Los enlaces también dañan.'],['Foco Múltiple','Cada satélite dispara dos rayos.'],['Rito Celestial','Tres satélites disparan rápidamente.']],
    chrono:[['Tiempo Lento','Ralentiza enemigos cercanos.'],['Órbita Amplia','Amplía el campo.'],['Aceleración Temporal','Acelera ligeramente el equipo.'],['Onda Temporal','Libera ondas dañinas.'],['Parada Instantánea','Ralentiza mucho a enemigos normales.'],['Anillo Eterno','Máximo alcance y ralentización.']],
    arc:[['Vuelo Curvo','Una hoja sigue una curva suave.'],['Curvas Gemelas','Dispara dos hojas opuestas.'],['Órbita Amplia','Aumentan tamaño, curva y daño.'],['Órbita de Retorno','La hoja vuelve y golpea otra vez.'],['Rastro de Aurora','Deja una cinta dañina.'],['Espiral Nebular','Tres hojas forman una gran espiral.']]
  },
  fr:{
    core:[['Allumage','Tire un projectile photonique.'],['Noyau Double','Tire deux projectiles.'],['Perforation','Traverse un ennemi supplémentaire.'],['Explosion d’Impulsion','Les impacts provoquent une petite explosion.'],['Noyau Triple','Tire trois projectiles.'],['Impulsion Stellaire','Tire périodiquement un puissant projectile perforant.']],
    blade:[['Orbite Lunaire','Une lame orbite autour du noyau.'],['Lunes Jumelles','Une seconde lame apparaît.'],['Orbite Accélérée','Vitesse et rayon augmentent.'],['Onde de Cicatrice','Les coups lancent une onde perforante.'],['Triple Éclipse','Une troisième lame est ajoutée.'],['Broyeur Céleste','L’orbite grandit et les chaînes déclenchent des explosions.']],
    ember:[['Première Étoile','Tire une étoile explosive.'],['Tir Binaire','Tire deux projectiles.'],['Perforation Stellaire','Traverse un ennemi de plus.'],['Division Nébulaire','Les impacts se divisent en étincelles.'],['Salve Triple','Tire une large salve de trois.'],['Ogive Supernova','Tire un énorme projectile perforant.']],
    bulwark:[['Satellite Défensif','Réduit les dégâts reçus.'],['Blindage Lié','Augmente PV et réduction.'],['Blindage Rechargeable','Régénère un bouclier.'],['Mur de Riposte','Être touché libère une onde.'],['Noyau Forteresse','Augmente capacité et recharge.'],['Forteresse Mobile','Charge un puissant bouclier.']],
    gravity:[['Graine Singulière','Crée périodiquement un puits.'],['Verrouillage de Marée','Augmente portée et force.'],['Singularité Durable','Les puits durent plus longtemps.'],['Noyau d’Effondrement','Le centre inflige des dégâts continus.'],['Effondrement Comprimé','Augmente fortement dégâts et attraction.'],['Singularités Jumelles','Crée deux singularités croisées.']],
    comet:[['Lance de Cristal','Une lance cométaire traverse les ennemis.'],['Double Trajectoire','Tire deux lances.'],['Perforation Profonde','Grandit et traverse plus de cibles.'],['Fragments de Comète','Disperse des fragments à chaque traversée.'],['Traînée Résiduelle','Laisse une piste dommageable.'],['Grand Impact','Explose dans une immense zone.']],
    prism:[['Prisme Unique','Un satellite tire un rayon jusqu’au bord.'],['Prismes Jumeaux','Ajoute un second satellite.'],['Rayon Large','Le rayon devient plus large.'],['Lien de Constellation','Les liens infligent aussi des dégâts.'],['Foyer Multiple','Chaque satellite tire deux rayons.'],['Rite Céleste','Trois satellites tirent rapidement.']],
    chrono:[['Temps Lent','Ralentit les ennemis proches.'],['Orbite Large','Élargit le champ.'],['Accélération Temporelle','Accélère légèrement les équipements.'],['Onde Temporelle','Libère des ondes dommageables.'],['Arrêt Instantané','Ralentit fortement les ennemis normaux.'],['Anneau Éternel','Portée et ralentissement maximaux.']],
    arc:[['Vol Courbe','Une lame suit une courbe fluide.'],['Courbes Jumelles','Tire deux lames opposées.'],['Orbite Large','Augmente taille, courbe et dégâts.'],['Orbite de Retour','La lame revient et frappe à nouveau.'],['Trace d’Aurore','Laisse un ruban dommageable.'],['Spirale Nébulaire','Trois lames dessinent une large spirale.']]
  }
};
const baseStackEffectTextExtra=stackEffectText;
stackEffectText=function localizedStackEffect(key,stack){
  const row=EXTRA_STACK[GAME_SETTINGS.language]?.[key]?.[stack-1];
  if(row)return{name:row[0],desc:row[1]};
  return baseStackEffectTextExtra(key,stack);
};
