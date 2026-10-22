from pathlib import Path

path = Path('scripts/performance-audit-contract.mjs')
text = path.read_text(encoding='utf-8')
old = "runtimeSystems.includes('trimBeamEffects(beams,entityCap('beams'))')"
new = 'runtimeSystems.includes("trimBeamEffects(beams,entityCap(\'beams\'))")'
count = text.count(old)
if count != 1:
    raise SystemExit(f'performance pass 10 contract quote fix: expected 1 match, found {count}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
