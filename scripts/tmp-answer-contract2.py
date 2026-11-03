from pathlib import Path
p=Path('scripts/void-apex-answer-contract.mjs')
s=p.read_text()
old="combat.includes(\"ctx.strokeStyle='#000000'\")&&combat.includes('lineDashOffset=-flow')"
new="combat.includes(\"ctx.strokeStyle='#000000'\")&&combat.includes('flowT=performance.now()*.00020')&&combat.includes('quadraticCurveTo')&&!combat.includes('lineDashOffset=-flow')"
if old not in s:
    raise SystemExit('old split-flow contract anchor missing')
s=s.replace(old,new,1)
p.write_text(s)
print('migrated split-flow contract to irregular void wisps')
