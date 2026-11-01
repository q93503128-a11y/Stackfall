from pathlib import Path

# 1) Make runtime ownership deterministic: combat integrity must install before
# the awakening effect wrappers, so Lunar Return remains the final boomerang
# update owner. Endless pressure can load after multipart targeting.
index = Path('index.html')
text = index.read_text(encoding='utf-8')
old = '  <script src="src/weapon-awakening.js"></script>\n  <script src="src/weapon-awakening-effects-a1-a7.js"></script>'
new = '  <script src="src/weapon-awakening.js"></script>\n  <script src="src/combat-integrity-v1.js"></script>\n  <script src="src/weapon-awakening-effects-a1-a7.js"></script>'
if old not in text:
    raise SystemExit('awakening load-order anchor not found')
text = text.replace(old, new, 1)
old = '  <script src="src/boss-body-parts.js"></script>\n  <script src="src/apex-run-clock.js"></script>'
new = '  <script src="src/boss-body-parts.js"></script>\n  <script src="src/endless-pressure-rewards-v1.js"></script>\n  <script src="src/apex-run-clock.js"></script>'
if old not in text:
    raise SystemExit('multipart/endless load-order anchor not found')
text = text.replace(old, new, 1)
index.write_text(text, encoding='utf-8')

body = Path('src/boss-body-parts.js')
text = body.read_text(encoding='utf-8')
old = '''// Runtime integrity layers load after multipart targeting owns the final target proxy semantics.
(function loadRuntimeIntegrityLayers(){
  if(document.querySelector('script[data-combat-integrity-v1]'))return;
  const combat=document.createElement('script');combat.src='src/combat-integrity-v1.js';combat.async=false;combat.dataset.combatIntegrityV1='1';
  combat.onload=()=>{if(document.querySelector('script[data-endless-pressure-rewards-v1]'))return;const pressure=document.createElement('script');pressure.src='src/endless-pressure-rewards-v1.js';pressure.async=false;pressure.dataset.endlessPressureRewardsV1='1';document.body.appendChild(pressure);};
  document.body.appendChild(combat);
})();

'''
if old not in text:
    raise SystemExit('dynamic runtime integrity loader not found')
text = text.replace(old, '', 1)
body.write_text(text, encoding='utf-8')

# 2) Dreadnought reward screen: preview cards are not choices. Give them their
# own class so choice hotkey decoration cannot attach, and hide the empty timer.
crash = Path('src/map-event-expansion.js')
text = crash.read_text(encoding='utf-8')
replacements = [
    ('.world-event-card{min-height:228px;', '.world-event-card,.world-event-preview-card{min-height:228px;'),
    ('.world-event-card:before{content:"";', '.world-event-card:before,.world-event-preview-card:before{content:"";'),
    ('.world-event-card:after{content:"";', '.world-event-card:after,.world-event-preview-card:after{content:"";'),
    ('.world-event-card>*{position:relative}', '.world-event-card>*,.world-event-preview-card>*{position:relative}'),
    ('.world-event-card span{display:grid;', '.world-event-card span,.world-event-preview-card span{display:grid;'),
    ('.world-event-card b{display:block;', '.world-event-card b,.world-event-preview-card b{display:block;'),
    ('.world-event-card p{margin:0;', '.world-event-card p,.world-event-preview-card p{margin:0;'),
    ('.world-event-timer{display:inline-flex;', '.world-event-preview-card{cursor:default}\n    .world-event-timer:empty{display:none}\n    .world-event-timer{display:inline-flex;'),
    ('#worldEventScreen[data-event-type="crash"] .world-event-card{border-radius:5px;', '#worldEventScreen[data-event-type="crash"] .world-event-card,#worldEventScreen[data-event-type="crash"] .world-event-preview-card{border-radius:5px;'),
    ('@media(max-width:720px){.world-event-shell{padding:18px 14px}.world-event-cards{grid-template-columns:1fr;max-height:66vh;overflow:auto}.world-event-card{min-height:145px;padding:16px}.world-event-card span{width:48px;', '@media(max-width:720px){.world-event-shell{padding:18px 14px}.world-event-cards{grid-template-columns:1fr;max-height:66vh;overflow:auto}.world-event-card,.world-event-preview-card{min-height:145px;padding:16px}.world-event-card span,.world-event-preview-card span{width:48px;'),
    ("el.className=preview?'world-event-card world-event-preview':'world-event-card';", "el.className=preview?'world-event-preview-card':'world-event-card';"),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f'map-event anchor not found: {old}')
    text = text.replace(old, new, 1)
crash.write_text(text, encoding='utf-8')

# 3) Strengthen the regression contract around ownership/load order and the UI.
contract = Path('scripts/combat-integrity-contract.mjs')
text = contract.read_text(encoding='utf-8')
text = text.replace("const crash=read('src/map-event-expansion.js');\n", "const crash=read('src/map-event-expansion.js');\nconst index=read('index.html');\nconst awakeningA1A7=read('src/weapon-awakening-effects-a1-a7.js');\n", 1)
old = "  ['runtime layers load after multipart owner',body.indexOf(\"src/combat-integrity-v1.js\")>body.indexOf('stackfallSharedEnemyScalePulseDisabled')&&body.indexOf(\"src/endless-pressure-rewards-v1.js\")>body.indexOf(\"src/combat-integrity-v1.js\")],\n"
new = "  ['combat integrity loads before awakening effect wrappers',index.indexOf('src/weapon-awakening.js')<index.indexOf('src/combat-integrity-v1.js')&&index.indexOf('src/combat-integrity-v1.js')<index.indexOf('src/weapon-awakening-effects-a1-a7.js')&&!body.includes('loadRuntimeIntegrityLayers')],\n  ['arc awakening remains the final boomerang update owner',/const baseUpdateBoomerangs=updateBoomerangs/.test(awakeningA1A7)&&/updateBoomerangs=function lunarReturnUpdate/.test(awakeningA1A7)],\n  ['endless pressure loads after multipart target ownership',index.indexOf('src/endless-pressure-rewards-v1.js')>index.indexOf('src/boss-body-parts.js')],\n"
if old not in text:
    raise SystemExit('old runtime ownership contract not found')
text = text.replace(old, new, 1)
old = "  ['dreadnought salvage uses a dedicated collect-all CTA',/world-event-collect-all/.test(crash)&&/world-event-preview/.test(crash)&&/openCards\\(tx\\('salvage'\\),prompt,cards,'DREADNOUGHT SALVAGE','crash',null,takeAllAction\\)/.test(crash)],\n"
new = "  ['dreadnought salvage uses a dedicated collect-all CTA',/world-event-collect-all/.test(crash)&&/world-event-preview-card/.test(crash)&&/openCards\\(tx\\('salvage'\\),prompt,cards,'DREADNOUGHT SALVAGE','crash',null,takeAllAction\\)/.test(crash)],\n  ['dreadnought preview hides empty choice timer',/world-event-timer:empty\\{display:none\\}/.test(crash)],\n"
if old not in text:
    raise SystemExit('Dreadnought CTA contract anchor not found')
text = text.replace(old, new, 1)
contract.write_text(text, encoding='utf-8')
