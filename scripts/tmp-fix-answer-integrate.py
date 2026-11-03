from pathlib import Path
p=Path('scripts/tmp-answer-combat-integrate.py')
lines=p.read_text(encoding='utf-8').splitlines()
idx=None
for i,line in enumerate(lines):
    if line.startswith('s=replace_once(s,"[\'build fingerprint tracks the prototype source'):
        idx=i
        break
if idx is None:
    raise SystemExit('target integration line not found')
line=lines[idx]
needle=']")'
pos=line.rfind(needle)
if pos<0:
    raise SystemExit('malformed suffix not found')
lines[idx]=line[:pos+2]+",'contract combat checks')"
p.write_text('\n'.join(lines)+'\n',encoding='utf-8')
