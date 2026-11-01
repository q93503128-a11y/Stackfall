from pathlib import Path

root=Path('.')
path=root/'src/boss-patterns.js'
text=path.read_text(encoding='utf-8')
needle="""function voidVolleyFrom(e,x,y,target,count,spread,speed,damage,color,r=5.2){
  const base=Math.atan2(target.y-y,target.x-x),visual=enemyProjectileVisualFor(e,'fan');
  for(let i=0;i<count;i++)spawnEnemyProjectile(x,y,base+(i-(count-1)/2)*spread,speed,damage,color,r,6,visual);
}
"""
insert=needle+"""function voidGuideLine(x1,y1,x2,y2,width,color,life=.76){
  if(state.entities.telegraphs.length>=entityCap('telegraphs'))state.entities.telegraphs.shift();
  state.entities.telegraphs.push({type:'line',x:x1,y:y1,a:Math.atan2(y2-y1,x2-x1),length:Math.hypot(x2-x1,y2-y1),width,life,max:life,damage:0,color,impactStyle:'void-guide',phase:Math.random()*TAU,cosmetic:true});
}
function voidGuideCircle(x,y,r,color,life=.74){
  if(state.entities.telegraphs.length>=entityCap('telegraphs'))state.entities.telegraphs.shift();
  state.entities.telegraphs.push({type:'circle',x,y,r,life,max:life,damage:0,color,impactStyle:'void-guide',phase:Math.random()*TAU,cosmetic:true});
}
"""
if needle not in text: raise SystemExit('voidVolleyFrom anchor missing')
text=text.replace(needle,insert,1)
text=text.replace("rawLine(e.x+nx*58,e.y+ny*58,e.x+nx*58+Math.cos(angle)*length,e.y+ny*58+Math.sin(angle)*length,10,0,'#e8ceff',.76,'void-maw-edge');","voidGuideLine(e.x+nx*58,e.y+ny*58,e.x+nx*58+Math.cos(angle)*length,e.y+ny*58+Math.sin(angle)*length,10,'#e8ceff',.76);")
text=text.replace("rawLine(e.x-nx*58,e.y-ny*58,e.x-nx*58+Math.cos(angle)*length,e.y-ny*58+Math.sin(angle)*length,10,0,'#e8ceff',.76,'void-maw-edge');","voidGuideLine(e.x-nx*58,e.y-ny*58,e.x-nx*58+Math.cos(angle)*length,e.y-ny*58+Math.sin(angle)*length,10,'#e8ceff',.76);")
text=text.replace("addCircle(destination.x,destination.y,e.r+32,0,'#d69cff',.74);","voidGuideCircle(destination.x,destination.y,e.r+32,'#d69cff',.74);")
path.write_text(text,encoding='utf-8')

contract=root/'scripts/void-boss-contract.mjs'
c=contract.read_text(encoding='utf-8')
anchor=" ['maw devour healing is capped and tied to hunger',patterns.includes('Math.min(.035,eaten*.0035)')&&patterns.includes('e.mawLastDevoured=eaten')],\n"
extra=anchor+" ['cosmetic Void guides cannot damage or trigger ordinary attack impacts',patterns.includes('function voidGuideLine')&&patterns.includes('function voidGuideCircle')&&patterns.includes(\"impactStyle:'void-guide'\")&&patterns.includes('cosmetic:true')&&!patterns.includes(\"'void-maw-edge'\")],\n"
if anchor not in c: raise SystemExit('contract anchor missing')
c=c.replace(anchor,extra,1)
contract.write_text(c,encoding='utf-8')

for relative in ['README.md','docs/GAME_DESIGN.md','docs/WIKI.md']:
    p=root/relative
    doc=p.read_text(encoding='utf-8').rstrip()+'\n'
    p.write_text(doc,encoding='utf-8')

print('Void Rift telegraph semantics and EOF formatting polished')
