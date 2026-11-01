from pathlib import Path

path=Path('src/map-event-expansion.js')
text=path.read_text(encoding='utf-8')
repls=[
('.world-event-card,.world-event-preview-card{min-height:228px;', '.world-event-card{min-height:228px;'),
('.world-event-card:before,.world-event-preview-card:before{content:"";', '.world-event-card:before{content:"";'),
('.world-event-card:after,.world-event-preview-card:after{content:"";', '.world-event-card:after{content:"";'),
('.world-event-card>*,.world-event-preview-card>*{position:relative}', '.world-event-card>*{position:relative}'),
('.world-event-card span,.world-event-preview-card span{display:grid;', '.world-event-card span{display:grid;'),
('.world-event-card b,.world-event-preview-card b{display:block;', '.world-event-card b{display:block;'),
('.world-event-card p,.world-event-preview-card p{margin:0;', '.world-event-card p{margin:0;'),
('    .world-event-preview{cursor:default;pointer-events:none}\n', ''),
('    .world-event-collect-all{grid-column:1/-1;min-height:64px;', '    .world-event-card.world-event-display{cursor:default;pointer-events:none}\n    .world-event-collect-all{position:relative;grid-column:1/-1;min-height:64px;'),
('    .world-event-preview-card{cursor:default}\n', ''),
('#worldEventScreen[data-event-type="crash"] .world-event-card,#worldEventScreen[data-event-type="crash"] .world-event-preview-card{border-radius:5px;', '#worldEventScreen[data-event-type="crash"] .world-event-card{border-radius:5px;'),
('@media(max-width:720px){.world-event-shell{padding:18px 14px}.world-event-cards{grid-template-columns:1fr;max-height:66vh;overflow:auto}.world-event-card,.world-event-preview-card{min-height:145px;padding:16px}.world-event-card span,.world-event-preview-card span{width:48px;', '@media(max-width:720px){.world-event-shell{padding:18px 14px}.world-event-cards{grid-template-columns:1fr;max-height:66vh;overflow:auto}.world-event-card{min-height:145px;padding:16px}.world-event-card span{width:48px;'),
("el.className=preview?'world-event-preview-card':'world-event-card';", "el.className=preview?'world-event-card world-event-display':'world-event-card';"),
]
for old,new in repls:
    if old not in text:
        raise SystemExit(f'missing map-event anchor: {old}')
    text=text.replace(old,new,1)
path.write_text(text,encoding='utf-8')

contract=Path('scripts/combat-integrity-contract.mjs')
c=contract.read_text(encoding='utf-8')
old="  ['dreadnought salvage uses a dedicated collect-all CTA',/world-event-collect-all/.test(crash)&&/world-event-preview-card/.test(crash)&&/openCards\\(tx\\('salvage'\\),prompt,cards,'DREADNOUGHT SALVAGE','crash',null,takeAllAction\\)/.test(crash)],\n  ['dreadnought preview hides empty choice timer',/world-event-timer:empty\\{display:none\\}/.test(crash)],\n"
new="  ['dreadnought salvage keeps canonical cards and one collect-all CTA',/world-event-card world-event-display/.test(crash)&&/world-event-collect-all\\{position:relative;/.test(crash)&&/openCards\\(tx\\('salvage'\\),prompt,cards,'DREADNOUGHT SALVAGE','crash',null,takeAllAction\\)/.test(crash)],\n  ['dreadnought display cards are non-interactive',/world-event-card\\.world-event-display\\{cursor:default;pointer-events:none\\}/.test(crash)],\n  ['dreadnought preview hides empty choice timer',/world-event-timer:empty\\{display:none\\}/.test(crash)],\n"
if old not in c:
    raise SystemExit('missing combat contract anchor')
c=c.replace(old,new,1)
contract.write_text(c,encoding='utf-8')
