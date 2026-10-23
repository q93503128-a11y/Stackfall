from pathlib import Path

path=Path('scripts/polish-contract-check.mjs')
text=path.read_text(encoding='utf-8')
old="  ['apex chronophage scars force present-position movement',bosses.includes('scarCd')&&bosses.includes('addCircle(x,y,r,chase.damage')&&read('src/boss-patterns.js').includes('addCircle(now.x,now.y')],"
new="  ['apex chronophage scars force present-position movement',bosses.includes('scarCd')&&bosses.includes('chronophageScar(x,y,r,chase.damage')&&read('src/boss-patterns.js').includes('chronophageScar(now.x,now.y')&&read('src/boss-patterns.js').includes(\"'temporal-shear'\")],"
if old not in text:
    raise SystemExit('polish contract migration anchor missing')
path.write_text(text.replace(old,new,1),encoding='utf-8')
