GAME_SETTINGS.audio=GAME_SETTINGS.audio||{};
GAME_SETTINGS.audio.volume={master:.90,combat:.92,ui:.82,ambient:.58,...(GAME_SETTINGS.audio.volume||{})};
try{
  const saved=JSON.parse(localStorage.getItem('stackfall.settings')||'{}');
  GAME_SETTINGS.hideProjectiles=saved.hideProjectiles===true;
  GAME_SETTINGS.sparkles=saved.sparkles!==false;
  GAME_SETTINGS.manualAim=saved.manualAim===true;
  GAME_SETTINGS.autoLevelChoice=saved.autoLevelChoice===true;
}catch{
  GAME_SETTINGS.hideProjectiles=false;
  GAME_SETTINGS.sparkles=true;
  GAME_SETTINGS.manualAim=false;
  GAME_SETTINGS.autoLevelChoice=false;
}

const settingsUi = {
  screen: document.querySelector('#settingsScreen'),
  menuButton: document.querySelector('#menuSettingsBtn'),
  pauseButton: document.querySelector('#pauseSettingsBtn'),
  closeX: document.querySelector('#settingsCloseX'),
  closeButton: document.querySelector('#settingsCloseBtn'),
  language: document.querySelector('#languageSelect'),
  master: document.querySelector('#soundMaster'),
  combat: document.querySelector('#soundCombat'),
  ui: document.querySelector('#soundUi'),
  ambient: document.querySelector('#soundAmbient'),
  volumeMaster: document.querySelector('#volumeMaster'),
  volumeCombat: document.querySelector('#volumeCombat'),
  volumeUi: document.querySelector('#volumeUi'),
  volumeAmbient: document.querySelector('#volumeAmbient'),
  damageNumbers: document.querySelector('#damageNumbers'),
  autoLevelChoice: document.querySelector('#autoLevelChoice'),
  hideProjectiles: document.querySelector('#hideProjectiles'),
  sparkles: document.querySelector('#sparkles'),
  screenShake: document.querySelector('#screenShake')
};

const volumeKeys={volumeMaster:'master',volumeCombat:'combat',volumeUi:'ui',volumeAmbient:'ambient'};
function clampVolume(v){return Math.max(0,Math.min(1,Number(v)||0));}
function ensureSettingTexts(){
  const rows={
    ko:{masterVolume:'전체 음량',combatVolume:'전투 음량',uiVolume:'UI 음량',ambientVolume:'배경음 음량',damageNumbers:'피해량 표시',autoLevelChoice:'레벨업 자동 선택',hideProjectiles:'아군 투사체 숨기기',sparkles:'반짝임 효과',screenShake:'화면 흔들림'},
    en:{masterVolume:'Master volume',combatVolume:'Combat volume',uiVolume:'UI volume',ambientVolume:'Ambient volume',damageNumbers:'Damage numbers',autoLevelChoice:'Auto-select level ups',hideProjectiles:'Hide allied projectiles',sparkles:'Sparkle effects',screenShake:'Screen shake'},
    ja:{masterVolume:'全体音量',combatVolume:'戦闘音量',uiVolume:'UI音量',ambientVolume:'環境音量',damageNumbers:'ダメージ表示',autoLevelChoice:'レベルアップ自動選択',hideProjectiles:'味方の弾を非表示',sparkles:'きらめき効果',screenShake:'画面振動'},
    'zh-CN':{masterVolume:'总音量',combatVolume:'战斗音量',uiVolume:'界面音量',ambientVolume:'环境音量',damageNumbers:'伤害数字',autoLevelChoice:'升级自动选择',hideProjectiles:'隐藏友方弹幕',sparkles:'闪光效果',screenShake:'屏幕震动'},
    es:{masterVolume:'Volumen general',combatVolume:'Volumen de combate',uiVolume:'Volumen de interfaz',ambientVolume:'Volumen ambiental',damageNumbers:'Números de daño',autoLevelChoice:'Selección automática al subir de nivel',hideProjectiles:'Ocultar proyectiles aliados',sparkles:'Efectos de brillo',screenShake:'Sacudida de pantalla'},
    fr:{masterVolume:'Volume général',combatVolume:'Volume de combat',uiVolume:'Volume interface',ambientVolume:'Volume d’ambiance',damageNumbers:'Dégâts affichés',autoLevelChoice:'Sélection auto au niveau supérieur',hideProjectiles:'Masquer les projectiles alliés',sparkles:'Effets scintillants',screenShake:'Secousse d’écran'}
  };
  for(const [code,row] of Object.entries(rows)){if(!TEXT[code])continue;for(const [key,value] of Object.entries(row))TEXT[code][`settings.${key}`]=value;}
}
ensureSettingTexts();

function applyLanguage() {
  document.documentElement.lang=GAME_SETTINGS.language;
  for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=tr(el.dataset.i18n);
  settingsUi.language.value=GAME_SETTINGS.language;
  renderStarterOptions();
  renderLoadout();
  updateHUD();
}

function syncRange(input,key){
  if(!input)return;
  const value=Math.round(clampVolume(GAME_SETTINGS.audio.volume[key])*100);
  input.value=String(value);
  const output=input.parentElement?.querySelector('output');if(output)output.value=`${value}%`;
}
function syncSettingsControls() {
  settingsUi.language.value=GAME_SETTINGS.language;
  settingsUi.master.checked=GAME_SETTINGS.audio.master!==false;
  settingsUi.combat.checked=GAME_SETTINGS.audio.combat!==false;
  settingsUi.ui.checked=GAME_SETTINGS.audio.ui!==false;
  settingsUi.ambient.checked=GAME_SETTINGS.audio.ambient!==false;
  for(const [id,key] of Object.entries(volumeKeys))syncRange(settingsUi[id],key);
  settingsUi.damageNumbers.checked=GAME_SETTINGS.damageNumbers!==false;
  settingsUi.autoLevelChoice.checked=GAME_SETTINGS.autoLevelChoice===true;
  settingsUi.hideProjectiles.checked=GAME_SETTINGS.hideProjectiles===true;
  settingsUi.sparkles.checked=GAME_SETTINGS.sparkles!==false;
  settingsUi.screenShake.checked=GAME_SETTINGS.screenShake!==false;
}

let settingsReturnFocus=null;
function openSettings(){settingsReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;if(typeof closeAbilityLedger==='function')closeAbilityLedger(true);syncSettingsControls();settingsUi.screen.classList.remove('hidden');settingsUi.closeX.focus();if(typeof syncAbilityLedgerVisibility==='function')syncAbilityLedgerVisibility();try{audio.init();}catch{}}
function closeSettings(){settingsUi.screen.classList.add('hidden');if(typeof syncAbilityLedgerVisibility==='function')syncAbilityLedgerVisibility();if(settingsReturnFocus?.isConnected)settingsReturnFocus.focus();settingsReturnFocus=null;}

function updateAudioSetting(key,value){GAME_SETTINGS.audio[key]=value;saveGameSettings();if(key==='master'||key==='ambient')audio.syncAmbient();if(key==='ui'&&value)audio.pickup();}
function updateAudioVolume(key,input){
  const value=clampVolume(Number(input.value)/100);GAME_SETTINGS.audio.volume[key]=value;saveGameSettings();
  const output=input.parentElement?.querySelector('output');if(output)output.value=`${Math.round(value*100)}%`;
  audio.syncAmbient();if(key==='ui'&&value>0)audio.pickup();
}
function updateDisplaySetting(key,value){
  GAME_SETTINGS[key]=value;
  saveGameSettings();
  if(key==='screenShake'&&!value)state.camera.shake=0;
  if(key==='sparkles'&&!value){state.flash=0;if(state.entities?.particles)state.entities.particles.length=0;}
  if(GAME_SETTINGS.audio.ui)audio.pickup();
}

settingsUi.menuButton.addEventListener('click',openSettings);
settingsUi.pauseButton.addEventListener('click',openSettings);
settingsUi.closeX.addEventListener('click',closeSettings);
settingsUi.closeButton.addEventListener('click',closeSettings);
settingsUi.screen.addEventListener('pointerdown',e=>{if(e.target===settingsUi.screen)closeSettings();});
settingsUi.language.addEventListener('change',()=>{GAME_SETTINGS.language=settingsUi.language.value;saveGameSettings();applyLanguage();audio.pickup();});
settingsUi.master.addEventListener('change',()=>updateAudioSetting('master',settingsUi.master.checked));
settingsUi.combat.addEventListener('change',()=>updateAudioSetting('combat',settingsUi.combat.checked));
settingsUi.ui.addEventListener('change',()=>updateAudioSetting('ui',settingsUi.ui.checked));
settingsUi.ambient.addEventListener('change',()=>updateAudioSetting('ambient',settingsUi.ambient.checked));
for(const [id,key] of Object.entries(volumeKeys))settingsUi[id]?.addEventListener('input',()=>updateAudioVolume(key,settingsUi[id]));
settingsUi.damageNumbers.addEventListener('change',()=>updateDisplaySetting('damageNumbers',settingsUi.damageNumbers.checked));
settingsUi.autoLevelChoice.addEventListener('change',()=>updateDisplaySetting('autoLevelChoice',settingsUi.autoLevelChoice.checked));
settingsUi.hideProjectiles.addEventListener('change',()=>updateDisplaySetting('hideProjectiles',settingsUi.hideProjectiles.checked));
settingsUi.sparkles.addEventListener('change',()=>updateDisplaySetting('sparkles',settingsUi.sparkles.checked));
settingsUi.screenShake.addEventListener('change',()=>updateDisplaySetting('screenShake',settingsUi.screenShake.checked));
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!settingsUi.screen.classList.contains('hidden')){e.preventDefault();e.stopImmediatePropagation();closeSettings();}},true);

applyLanguage();
syncSettingsControls();
saveGameSettings();
