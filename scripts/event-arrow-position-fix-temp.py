from pathlib import Path

map_path = Path('src/map-event-expansion.js')
map_src = map_path.read_text(encoding='utf-8')
old_distance = 'd=rand(520,700)'
new_distance = 'd=rand(720,930)'
if old_distance not in map_src:
    raise SystemExit('event spawn distance anchor missing')
map_path.write_text(map_src.replace(old_distance, new_distance, 1), encoding='utf-8')

render_path = Path('src/dark-cosmic-polish.js')
render_src = render_path.read_text(encoding='utf-8')
old_edge = "a=Math.atan2(dy,dx),margin=58,scale=Math.min((vw/2-margin)/Math.max(1,Math.abs(dx)),(vh/2-margin)/Math.max(1,Math.abs(dy))),x=cx+dx*scale,y=cy+dy*scale"
new_edge = "a=Math.atan2(dy,dx),phoneLandscape=vh<=520&&vw>vh,leftMargin=76,rightMargin=76,topMargin=68,bottomMargin=phoneLandscape?100:76,sx=dx>=0?(vw/2-rightMargin)/Math.max(1,Math.abs(dx)):(vw/2-leftMargin)/Math.max(1,Math.abs(dx)),sy=dy>=0?(vh/2-bottomMargin)/Math.max(1,Math.abs(dy)):(vh/2-topMargin)/Math.max(1,Math.abs(dy)),scale=Math.min(sx,sy),x=cx+dx*scale,y=cy+dy*scale"
if old_edge not in render_src:
    raise SystemExit('event arrow edge anchor missing')
render_src = render_src.replace(old_edge, new_edge, 1)
old_label = "const w=46,lx=clamp(x-w/2,5,vw-w-5),ly=clamp(y+15,5,vh-23);"
new_label = "const w=46,lx=clamp(x-w/2,5,vw-w-5),bottomEdge=dy>0&&sy<=sx,ly=clamp(bottomEdge?y-33:y+15,5,vh-23);"
if old_label not in render_src:
    raise SystemExit('event arrow label anchor missing')
render_path.write_text(render_src.replace(old_label, new_label, 1), encoding='utf-8')

contract_path = Path('scripts/community-feedback-contract.mjs')
contract_src = contract_path.read_text(encoding='utf-8')
old_name = 'mobile landscape keeps desktop composition and nearby event guidance'
new_name = 'mobile landscape keeps desktop composition and visible event guidance'
if old_name not in contract_src:
    raise SystemExit('mobile landscape contract name anchor missing')
contract_src = contract_src.replace(old_name, new_name, 1)
old_contract_distance = "read('src/map-event-expansion.js').includes('d=rand(520,700)')"
new_contract_distance = "read('src/map-event-expansion.js').includes('d=rand(720,930)')"
if old_contract_distance not in contract_src:
    raise SystemExit('mobile landscape distance contract anchor missing')
contract_src = contract_src.replace(old_contract_distance, new_contract_distance, 1)
old_guide_anchor = "&&read('src/map-event-expansion.js').includes('function eventGuideFrame()')"
new_guide_anchor = "&&darkCosmic.includes('bottomMargin=phoneLandscape?100:76')&&darkCosmic.includes('bottomEdge=dy>0&&sy<=sx')&&read('src/map-event-expansion.js').includes('function eventGuideFrame()')"
if old_guide_anchor not in contract_src:
    raise SystemExit('mobile landscape guidance contract anchor missing')
contract_path.write_text(contract_src.replace(old_guide_anchor, new_guide_anchor, 1), encoding='utf-8')
