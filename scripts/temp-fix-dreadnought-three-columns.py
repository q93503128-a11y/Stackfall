from pathlib import Path

path=Path('src/map-event-expansion.js')
text=path.read_text(encoding='utf-8')
old="    .world-event-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;position:relative;z-index:2}\n"
new=old+"    .world-event-cards.collect-all{grid-template-columns:repeat(3,minmax(0,1fr))}\n"
if old not in text:
    raise SystemExit('missing world-event-cards css anchor')
text=text.replace(old,new,1)
old2="const preview=typeof footerAction==='function';for(const c of cards){"
new2="const preview=typeof footerAction==='function';root.classList.toggle('collect-all',preview);for(const c of cards){"
if old2 not in text:
    raise SystemExit('missing preview anchor')
text=text.replace(old2,new2,1)
old3="@media(max-width:720px){.world-event-shell{padding:18px 14px}.world-event-cards{grid-template-columns:1fr;max-height:66vh;overflow:auto}"
new3="@media(max-width:720px){.world-event-shell{padding:18px 14px}.world-event-cards,.world-event-cards.collect-all{grid-template-columns:1fr;max-height:66vh;overflow:auto}"
if old3 not in text:
    raise SystemExit('missing mobile grid anchor')
text=text.replace(old3,new3,1)
path.write_text(text,encoding='utf-8')
