from pathlib import Path

path=Path('scripts/performance-audit-contract.mjs')
text=path.read_text(encoding='utf-8').replace('\r\n','\n')
old="\n ['fixed-shape combat effects and split descriptors use bounded ownership-safe pools'"
new="\n, ['fixed-shape combat effects and split descriptors use bounded ownership-safe pools'"
count=text.count(old)
if count!=1:
    raise SystemExit(f'pass 9 contract separator: expected 1 match, found {count}')
path.write_text(text.replace(old,new,1),encoding='utf-8')
