from pathlib import Path

# Event guidance: keep arrows well inside touch-landscape edges so labels never hide under controls.
p=Path('src/map-event-expansion.js')
s=p.read_text(encoding='utf-8')
old="const side=clamp(vw*.085,82,108),top=clamp(vh*.18,64,90),bottomGap=clamp(vh*.29,108,156);"
new="const side=clamp(vw*.14,118,148),top=clamp(vh*.18,64,90),bottomGap=clamp(vh*.29,108,156);"
if old not in s: raise SystemExit('landscape event frame anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# Ability ledger: touch landscape gets a compact horizontal pill instead of the desktop vertical rail.
p=Path('src/ability-ledger-audit.js')
s=p.read_text(encoding='utf-8')
anchor='@media(max-width:480px){.ledger-grid{grid-template-columns:1fr}}'
extra='''@media(pointer:coarse) and (orientation:landscape){#abilityLedgerBtn{left:max(12px,env(safe-area-inset-left));top:92px;bottom:auto;width:84px;height:34px;transform:none;flex-direction:row;gap:5px;padding:0 8px;border-left:1px solid rgba(135,220,255,.28);border-radius:11px;background:linear-gradient(90deg,rgba(15,28,63,.92),rgba(5,9,24,.96))}#abilityLedgerBtn b{writing-mode:horizontal-tb;font-size:9px;letter-spacing:.04em;white-space:nowrap}#abilityLedgerBtn em{display:none}#abilityLedgerBtn i{min-width:18px;padding:2px 4px}}'''
if anchor not in s: raise SystemExit('ability mobile media anchor missing')
if 'orientation:landscape){#abilityLedgerBtn' in s: raise SystemExit('ability landscape rule already present')
s=s.replace(anchor,anchor+extra,1)
p.write_text(s,encoding='utf-8')

# Mobile landscape composition: force the desktop hub grid into a compact height and fit 4 level choices in one row.
p=Path('styles.css')
s=p.read_text(encoding='utf-8')
if 'Pass 15 visual follow-up' in s: raise SystemExit('follow-up css already present')
s+=r'''

/* Pass 15 visual follow-up: compact desktop composition for phone landscape. */
@media (pointer:coarse) and (orientation:landscape){
  #menu{justify-content:center;gap:6px;padding:8px 14px;overflow:hidden}
  #menu .brand-wrap{transform:scale(.76);transform-origin:center;margin:-10px 0 -5px}
  #menu .menu-subtitle{margin-top:8px;font-size:10px}
  #menu .hub-panel{grid-template-columns:repeat(12,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));width:min(1040px,92vw);height:min(224px,60vh);padding:10px;gap:8px}
  #menu #startBtn{grid-column:1/8!important;grid-row:1/3!important;min-height:0;height:auto;padding:17px 21px;border-radius:18px}
  #menu #startBtn .hub-mode-kicker{margin-bottom:8px;font-size:8px}
  #menu #startBtn strong{font-size:36px}
  #menu #startBtn p{width:76%;margin-top:7px;font-size:9px;line-height:1.4}
  #menu #startBtn>i{right:20px;bottom:14px;font-size:58px}
  #menu #upgradeHubBtn{grid-column:8/13!important;grid-row:1!important;min-height:0;height:auto;padding:12px 15px;border-radius:14px}
  #menu #upgradeHubBtn strong{font-size:22px}
  #menu #upgradeHubBtn p{margin-top:5px;font-size:8px;line-height:1.35}
  #menu #achievementHubBtn{grid-column:8/11!important;grid-row:2!important;min-height:0;height:auto;padding:11px 12px;border-radius:14px}
  #menu #achievementHubBtn strong{font-size:19px}
  #menu #achievementHubBtn p{display:none}
  #menu #stageMapBtn{grid-column:11/13!important;grid-row:2!important;min-height:0;height:auto;padding:11px 10px;border-radius:14px}
  #menu #stageMapBtn strong{font-size:17px}
  #menu #stageMapBtn p{display:none}
  #menu .hub-mode-kicker{font-size:7px!important;margin-bottom:5px!important}

  #choiceScreen{padding:7px 10px;grid-template-rows:auto minmax(0,1fr);align-content:center;overflow:hidden}
  #choiceScreen .choice-head{margin-bottom:5px}
  #choiceScreen .choice-head p{margin-bottom:2px;font-size:7px}
  #choiceScreen .choice-head h2{font-size:24px}
  #choiceScreen .choice-head span{margin-top:3px;font-size:8px}
  #choiceScreen .choice-cards{width:96vw;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;max-height:calc(100vh - 62px);overflow:visible;padding:0}
  #choiceScreen .choice-card{min-height:0;height:min(286px,74vh);padding:10px;border-radius:14px;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin}
  #choiceScreen .choice-card .choice-meta{max-width:66%;margin-left:0;gap:4px;min-height:18px}
  #choiceScreen .choice-card .type,#choiceScreen .choice-card .choice-status{padding:3px 5px;font-size:7px}
  #choiceScreen .choice-card .stack-info{right:7px;top:7px;transform:scale(.72);transform-origin:top right}
  #choiceScreen .choice-card .choice-body{display:grid;grid-template-columns:46px minmax(0,1fr);gap:8px;margin-top:10px;align-items:start}
  #choiceScreen .choice-card .big-icon{position:static;width:46px;height:46px;margin:0;border-radius:13px;font-size:24px}
  #choiceScreen .choice-card .role-tag{max-width:100%;margin-bottom:4px;padding:2px 5px;font-size:7px}
  #choiceScreen .choice-card h3{margin:0 0 4px;font-size:15px;line-height:1.15}
  #choiceScreen .choice-card p{font-size:8.5px;line-height:1.35}
  #choiceScreen .choice-card .resonance-preview{margin-top:7px;padding-top:6px;font-size:8px;line-height:1.35}
}
'''
p.write_text(s,encoding='utf-8')

# Lock the new landscape treatment into the existing regression contract.
p=Path('scripts/community-feedback-contract.mjs')
s=p.read_text(encoding='utf-8')
old="read('src/map-event-expansion.js').includes('function eventGuideFrame()')&&read('src/map-event-expansion.js').includes('frame=eventGuideFrame()'));"
new="read('src/map-event-expansion.js').includes('function eventGuideFrame()')&&read('src/map-event-expansion.js').includes('frame=eventGuideFrame()')&&read('src/map-event-expansion.js').includes('vw*.14,118,148')&&read('src/ability-ledger-audit.js').includes('orientation:landscape){#abilityLedgerBtn')&&styles.includes('Pass 15 visual follow-up'));"
if old not in s: raise SystemExit('pass 15 contract anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
