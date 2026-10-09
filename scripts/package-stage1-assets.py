"""Package inspected ImageGen atlases. Crops are measured nonoverlapping component
slots, then alpha-trimmed. No redesign, recoloring or background synthesis."""
from pathlib import Path
from PIL import Image
import json
import argparse

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-dir', type=Path, required=True)
SOURCE = parser.parse_args().source_dir
OUT = ROOT / 'assets' / 'stage1'
OUT.mkdir(parents=True, exist_ok=True)
ATLAS = [
    ('exec-caae6797-348d-4e41-b7a7-f44006333eee.png', [
        ('warden-chest', (0, 0, 864, 566)),
        ('warden-clamp', (875, 0, 1254, 647)),
        ('warden-salvage', (100, 566, 520, 1254)),
        ('warden-core', (755, 647, 1160, 1254)),
    ]),
    ('exec-e2645ba6-d4ad-4f23-851a-cd6834286451.png', [
        ('bulkhead', (0, 0, 1536, 275)),
        ('girder', (0, 282, 1536, 482)),
        ('deck', (0, 485, 1536, 702)),
        ('gate', (0, 706, 1536, 1024)),
    ]),
]
manifest = []
for filename, slots in ATLAS:
    atlas = Image.open(SOURCE / filename).convert('RGBA')
    for name, slot in slots:
        part = atlas.crop(slot)
        bounds = part.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
        assert bounds, name
        part = part.crop(bounds)
        # Downsample to a bounded production texture; retain aspect and true alpha.
        part.thumbnail((768, 640), Image.Resampling.LANCZOS)
        path = OUT / (name + '.webp')
        part.save(path, 'WEBP', quality=91, method=6)
        manifest.append(dict(name=name, source=filename, slot=slot, alphaBounds=bounds,
                             size=part.size, bytes=path.stat().st_size))
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps(manifest, indent=2))
