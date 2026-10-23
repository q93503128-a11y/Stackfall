from pathlib import Path


def migrate(path_name, old, new, label):
    path=Path(path_name)
    text=path.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'{label} migration anchor missing')
    path.write_text(text.replace(old,new,1),encoding='utf-8')


migrate(
    'scripts/polish-contract-check.mjs',
    "  ['apex chronophage scars force present-position movement',bosses.includes('scarCd')&&bosses.includes('addCircle(x,y,r,chase.damage')&&read('src/boss-patterns.js').includes('addCircle(now.x,now.y')],",
    "  ['apex chronophage scars force present-position movement',bosses.includes('scarCd')&&bosses.includes('chronophageScar(x,y,r,chase.damage')&&read('src/boss-patterns.js').includes('chronophageScar(now.x,now.y')&&read('src/boss-patterns.js').includes(\"'temporal-shear'\")],",
    'polish contract',
)

migrate(
    'scripts/endgame-balance-contract.mjs',
    "expect('apex chronophage forces movement with delayed scars',bosses.includes('scarCd')&&bosses.includes('addCircle(x,y,r,chase.damage')&&read('src/boss-patterns.js').includes('addCircle(now.x,now.y'));",
    "expect('apex chronophage forces movement with delayed scars',bosses.includes('scarCd')&&bosses.includes('chronophageScar(x,y,r,chase.damage')&&read('src/boss-patterns.js').includes('chronophageScar(now.x,now.y')&&read('src/boss-patterns.js').includes(\"'temporal-shear'\"));",
    'endgame balance contract',
)
