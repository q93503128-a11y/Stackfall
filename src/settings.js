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
  damageNumbers: document.querySelector('#damageNumbers'),
  screenShake: document.querySelector('#screenShake')
};

function applyLanguage() {
  document.documentElement.lang=GAME_SETTINGS.language;
  for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=tr(el.dataset.i18n);
  settingsUi.language.value=GAME_SETTINGS.language;
  renderStarterOptions();
  renderLoadout();
  updateHUD();
}

function syncSettingsControls() {
  settingsUi.language.value=GAME_SETTINGS.language;
  settingsUi.master.checked=GAME_SETTINGS.audio.master;
  settingsUi.combat.checked=GAME_SETTINGS.audio.combat;
  settingsUi.ui.checked=GAME_SETTINGS.audio.ui;
  settingsUi.ambient.checked=GAME_SETTINGS.audio.ambient;
  settingsUi.damageNumbers.checked=GAME_SETTINGS.damageNumbers!==false;
  settingsUi.screenShake.checked=GAME_SETTINGS.screenShake!==false;
}

function openSettings(){syncSettingsControls();settingsUi.screen.classList.remove('hidden');try{audio.init();}catch{}}
function closeSettings(){settingsUi.screen.classList.add('hidden');}

function updateAudioSetting(key,value){GAME_SETTINGS.audio[key]=value;saveGameSettings();if(key==='master'||key==='ambient')audio.syncAmbient();if(key==='ui'&&value)audio.pickup();}
function updateDisplaySetting(key,value){GAME_SETTINGS[key]=value;saveGameSettings();if(key==='screenShake'&&!value)state.camera.shake=0;if(GAME_SETTINGS.audio.ui)audio.pickup();}

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
settingsUi.damageNumbers.addEventListener('change',()=>updateDisplaySetting('damageNumbers',settingsUi.damageNumbers.checked));
settingsUi.screenShake.addEventListener('change',()=>updateDisplaySetting('screenShake',settingsUi.screenShake.checked));
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!settingsUi.screen.classList.contains('hidden')){e.preventDefault();e.stopImmediatePropagation();closeSettings();}},true);

applyLanguage();
syncSettingsControls();