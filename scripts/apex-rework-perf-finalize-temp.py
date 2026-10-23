from pathlib import Path

path=Path('scripts/performance-audit-contract.mjs')
src=path.read_text(encoding='utf-8')
old='&&bosses.includes("stageBossAttack:\'fracture\'")],'
new="&&!systems.includes('effect.stageBossAttack=')],"
if old not in src:
    raise SystemExit('performance special-beam existence anchor missing')
src=src.replace(old,new,1)
path.write_text(src,encoding='utf-8')
print('apex performance contract finalizer applied')
