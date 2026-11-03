from pathlib import Path
p=Path('scripts/tmp-answer-combat-integrate-v2.py')
s=p.read_text(encoding='utf-8')
old="else if(family==='drone')"
count=s.count(old)
if count!=2:
    raise SystemExit(f'expected two drone matcher occurrences, found {count}')
s=s.replace(old,"if(family==='drone')")
p.write_text(s,encoding='utf-8')
