from pathlib import Path
p=Path('scripts/tmp-answer-combat-integrate-v2.py')
s=p.read_text(encoding='utf-8')
old="extra='''  ['combat uses 75/30 three-phase thresholds"
new="extra=''',\n  ['combat uses 75/30 three-phase thresholds"
if s.count(old)!=1:
    raise SystemExit(f'contract insertion anchor count={s.count(old)}')
p.write_text(s.replace(old,new,1),encoding='utf-8')
