from pathlib import Path

path=Path('src/map-event-expansion.js')
text=path.read_text(encoding='utf-8')
old="    .world-event-collect-all{position:relative;grid-column:1/-1;min-height:64px;"
new="    .world-event-collect-all{position:relative;grid-column:1/-1;min-height:64px;display:flex;align-items:center;justify-content:center;gap:10px;"
if old not in text:
    raise SystemExit('missing collect-all style anchor')
text=text.replace(old,new,1)
old2="    .world-event-collect-all:hover{transform:translateY(-2px);"
new2="    .world-event-collect-all .choice-shortcut{position:static;flex:0 0 25px}\n    .world-event-collect-all:hover{transform:translateY(-2px);"
if old2 not in text:
    raise SystemExit('missing collect-all hover anchor')
text=text.replace(old2,new2,1)
path.write_text(text,encoding='utf-8')
