from pathlib import Path
p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text();old=s
needle="      drawSprite(open?'headOpen':'headClosed',head,382*head.scaleUnit,216*head.scaleUnit,.96*headAlpha,.024,false,scaleX,scaleY);"
repl="      drawSprite('headClosed',head,382*head.scaleUnit,216*head.scaleUnit,.96*headAlpha,.024,false,scaleX,scaleY);"
assert needle in s
s=s.replace(needle,repl,1)
s=s.replace("renderMode:'canvas-textured-endcaps-v10'", "renderMode:'canvas-textured-mawhead-v11'")
assert s!=old
p.write_text(s)
