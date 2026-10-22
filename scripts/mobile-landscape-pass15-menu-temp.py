from pathlib import Path

p=Path('feature-pack.css')
s=p.read_text(encoding='utf-8')
if 'Pass 15 landscape hub final override' in s:
    raise SystemExit('landscape hub final override already present')
s += r'''

/* Pass 15 landscape hub final override: feature-pack loads after styles.css. */
@media (pointer:coarse) and (orientation:landscape){
  #menu .hub-panel{
    grid-template-columns:repeat(12,minmax(0,1fr))!important;
    grid-template-rows:repeat(2,minmax(0,1fr))!important;
    width:min(1040px,92vw)!important;
    max-width:none!important;
    height:min(224px,60vh)!important;
    padding:10px!important;
    gap:8px!important;
  }
  #menu #startBtn{grid-column:1/8!important;grid-row:1/3!important;min-height:0!important;height:auto!important;padding:17px 21px!important;border-radius:18px!important}
  #menu #startBtn .hub-mode-kicker{margin-bottom:8px!important;font-size:8px!important}
  #menu #startBtn strong{font-size:36px!important}
  #menu #startBtn p{display:block!important;width:76%!important;margin-top:7px!important;font-size:9px!important;line-height:1.4!important}
  #menu #startBtn>i{right:20px!important;bottom:14px!important;font-size:58px!important}
  #menu #upgradeHubBtn{grid-column:8/13!important;grid-row:1!important;min-height:0!important;height:auto!important;padding:12px 15px!important;border-radius:14px!important}
  #menu #upgradeHubBtn strong{font-size:22px!important}
  #menu #upgradeHubBtn p{display:block!important;width:82%!important;margin-top:5px!important;font-size:8px!important;line-height:1.35!important}
  #menu #achievementHubBtn{grid-column:8/11!important;grid-row:2!important;min-height:0!important;height:auto!important;padding:11px 12px!important;border-radius:14px!important}
  #menu #achievementHubBtn strong{font-size:19px!important}
  #menu #achievementHubBtn p{display:none!important}
  #menu #stageMapBtn{grid-column:11/13!important;grid-row:2!important;min-height:0!important;height:auto!important;padding:11px 10px!important;border-radius:14px!important}
  #menu #stageMapBtn strong{font-size:17px!important}
  #menu #stageMapBtn p{display:none!important}
}
'''
p.write_text(s,encoding='utf-8')

p=Path('scripts/community-feedback-contract.mjs')
s=p.read_text(encoding='utf-8')
old="read('src/ability-ledger-audit.js').includes('orientation:landscape){#abilityLedgerBtn')&&styles.includes('Pass 15 visual follow-up'));"
new="read('src/ability-ledger-audit.js').includes('orientation:landscape){#abilityLedgerBtn')&&styles.includes('Pass 15 visual follow-up')&&read('feature-pack.css').includes('Pass 15 landscape hub final override'));"
if old not in s:
    raise SystemExit('pass15 final contract anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
