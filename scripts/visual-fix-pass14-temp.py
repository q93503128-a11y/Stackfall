from pathlib import Path

# 1) Mobile menu + modal layering CSS fixes found from live screenshots.
styles_path=Path('styles.css')
styles=styles_path.read_text(encoding='utf-8')
marker='/* Pass 14 live visual QA responsive fixes */'
if marker not in styles:
    styles += '''\n\n/* Pass 14 live visual QA responsive fixes */\n#choiceScreen{z-index:76}\n@media(pointer:coarse),(max-width:760px){\n  #menu{justify-content:flex-start;overflow-x:hidden;overflow-y:auto;padding-top:max(132px,calc(env(safe-area-inset-top) + 122px));padding-bottom:max(24px,env(safe-area-inset-bottom))}\n  .brand-wrap{width:100%;max-width:100%;flex:0 0 auto}\n  #title{max-width:100%;font-size:clamp(48px,15.2vw,68px);line-height:.86;letter-spacing:-.045em;white-space:nowrap}\n  .tagline{margin-top:13px;font-size:10px;letter-spacing:.13em}\n  .menu-panel{flex:0 0 auto}\n}\n@media(max-width:430px){\n  #menu{padding-left:14px;padding-right:14px;padding-top:max(126px,calc(env(safe-area-inset-top) + 116px));gap:18px}\n  #title{font-size:clamp(46px,14.8vw,60px)}\n  .hub-profile{max-width:calc(100vw - 76px)}\n}\n'''
styles_path.write_text(styles,encoding='utf-8')

# 2) Choice screen owns modal priority; stale boss notices cannot cover choices.
interface_path=Path('src/interface.js')
interface=interface_path.read_text(encoding='utf-8')
old="function openChoices(){if(typeof closeAbilityLedger==='function')closeAbilityLedger(true);const choices=rollChoices(3);"
new="function openChoices(){if(typeof closeAbilityLedger==='function')closeAbilityLedger(true);ui.bossNotice?.classList.add('hidden');const choices=rollChoices(3);"
if old not in interface and new not in interface:
    raise SystemExit('openChoices anchor missing')
interface=interface.replace(old,new,1)
old="function showBossNotice(name,kicker){ui.bossNotice.classList.remove('frontier-notice');"
new="function showBossNotice(name,kicker){if(state.mode==='choice')return;ui.bossNotice.classList.remove('frontier-notice');"
if old not in interface and new not in interface:
    raise SystemExit('showBossNotice anchor missing')
interface=interface.replace(old,new,1)
interface_path.write_text(interface,encoding='utf-8')

# 3) Replace the cramped vertical mobile ability tab with a compact horizontal pill.
ledger_path=Path('src/ability-ledger-audit.js')
ledger=ledger_path.read_text(encoding='utf-8')
old="@media(max-width:760px){#abilityLedgerBtn{top:auto;bottom:168px;width:46px;height:104px}#abilityLedgerScreen"
new="@media(max-width:760px){#abilityLedgerBtn{left:max(10px,env(safe-area-inset-left));top:auto;bottom:max(156px,calc(env(safe-area-inset-bottom) + 144px));width:84px;height:36px;transform:none;flex-direction:row;gap:5px;padding:0 8px;border-left:1px solid rgba(135,220,255,.28);border-radius:12px}#abilityLedgerBtn b{writing-mode:horizontal-tb;font-size:9px;letter-spacing:.04em;white-space:nowrap}#abilityLedgerBtn em{display:none}#abilityLedgerBtn i{min-width:18px;padding:2px 4px}#abilityLedgerScreen"
if old not in ledger and new not in ledger:
    raise SystemExit('mobile ledger anchor missing')
ledger=ledger.replace(old,new,1)
ledger_path.write_text(ledger,encoding='utf-8')

# 4) Persistent regression contract.
contract_path=Path('scripts/community-feedback-contract.mjs')
contract=contract_path.read_text(encoding='utf-8')
needle="expect('readable compact choice cards',progression.includes('choice-body')&&progression.includes('choice-copy')&&progression.includes('choice-status')&&styles.includes('grid-template-columns:72px minmax(0,1fr)')&&styles.includes('min-height:218px')&&!styles.includes('min-height:302px'));\n"
check="expect('live visual QA keeps mobile branding modal priority and ability access readable',styles.includes('Pass 14 live visual QA responsive fixes')&&styles.includes('#choiceScreen{z-index:76}')&&styles.includes('padding-top:max(132px,calc(env(safe-area-inset-top) + 122px))')&&styles.includes('#title{max-width:100%;font-size:clamp(48px,15.2vw,68px)')&&abilityLedger.includes('writing-mode:horizontal-tb')&&abilityLedger.includes('width:84px;height:36px;transform:none;flex-direction:row')&&interfaceJs.includes("ui.bossNotice?.classList.add('hidden')")&&interfaceJs.includes("function showBossNotice(name,kicker){if(state.mode==='choice')return;"));\n"
if check not in contract:
    if needle not in contract:
        raise SystemExit('community contract anchor missing')
    contract=contract.replace(needle,needle+check,1)
contract_path.write_text(contract,encoding='utf-8')
