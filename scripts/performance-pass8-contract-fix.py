from pathlib import Path

path=Path('scripts/void-boss-contract.mjs')
text=path.read_text(encoding='utf-8').replace('\r\n','\n')
old='[\'paradox still creates a real twin\',systems.includes("[\'mirror\',\'paradox\'].includes(enemy.eliteForm)")&&systems.includes(\'twinSide=-1\')&&systems.includes(\'twinSide:1\')],'
new='[\'paradox still creates a real twin\',systems.includes("const ELITE_SPAWN_KINDS=new Set([\'mini\',\'boss\',\'void\',\'apex\']),ELITE_TWIN_FORMS=new Set([\'mirror\',\'paradox\'])")&&systems.includes(\'ELITE_TWIN_FORMS.has(enemy.eliteForm)\')&&systems.includes(\'twinSide=-1\')&&systems.includes(\'twinSide:1\')],'
count=text.count(old)
if count!=1:
    raise SystemExit(f'void twin contract: expected 1 match, found {count}')
path.write_text(text.replace(old,new,1),encoding='utf-8')
