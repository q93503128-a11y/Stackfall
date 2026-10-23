from pathlib import Path

replacements={
    "bosses.includes('addCircle(x,y,r,chase.damage')":"bosses.includes('chronophageScar(x,y,r,chase.damage')",
    "patterns.includes('addCircle(now.x,now.y')":"patterns.includes('chronophageScar(now.x,now.y')",
    "read('src/boss-patterns.js').includes('addCircle(now.x,now.y')":"read('src/boss-patterns.js').includes('chronophageScar(now.x,now.y')",
}
changed=[]
for path in sorted(Path('scripts').glob('*.mjs')):
    text=path.read_text(encoding='utf-8')
    next_text=text
    for old,new in replacements.items():
        next_text=next_text.replace(old,new)
    if next_text!=text:
        path.write_text(next_text,encoding='utf-8')
        changed.append(str(path))
if not changed:
    raise SystemExit('no stale Chronophage contract references found')
print('migrated stale Chronophage contract references:', ', '.join(changed))
