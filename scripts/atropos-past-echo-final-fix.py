from pathlib import Path

p=Path('src/atropos-world-devourer-attack-past.js')
s=p.read_text()
repls={
"const orbitOffset(s){":None,
}
s=s.replace("function orbitOffset(s){const a=(+s.motionTime||0)*.165+(+s.phaseBase||0),rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);return{x:Math.cos(a)*rx+Math.sin(a*2.07)*38,y:Math.sin(a*.96)*ry+Math.sin(a*2.41+1.1)*28};}","function orbitOffset(s){const a=(+s.motionTime||0)*.165+(+s.phaseBase||0),rx=clamp(vw*.43,650,820),ry=clamp(vh*.40,330,450);return{x:Math.cos(a)*rx+Math.sin(a*2.07)*38,y:Math.sin(a*.96)*ry+Math.sin(a*2.41+1.1)*28};}",1)
s=s.replace("ctx.globalAlpha=.075;ctx.fillStyle='rgba(145,203,222,.68)';ctx.strokeStyle='rgba(218,246,255,.50)'", "ctx.globalAlpha=.22;ctx.fillStyle='rgba(145,203,222,.82)';ctx.strokeStyle='rgba(218,246,255,.66)'",1)
s=s.replace("ctx.globalAlpha=.16;ctx.stroke();", "ctx.globalAlpha=.34;ctx.stroke();",1)
s=s.replace("ctx.globalAlpha=.16;ctx.strokeStyle='rgba(226,249,255,.72)'", "ctx.globalAlpha=.30;ctx.strokeStyle='rgba(226,249,255,.82)'",1)
s=s.replace("const v=p[i],sc=lerp(1,.46,v.tailT),alpha=.42*(1-v.tailT*.24);", "const v=p[i],sc=lerp(1,.52,v.tailT),alpha=.72*(1-v.tailT*.18);",1)
s=s.replace("drawGhostSprite(ghostArt.head,v,330*sc,165*sc,alpha)", "drawGhostSprite(ghostArt.head,v,440*sc,215*sc,alpha)",1)
s=s.replace("drawGhostSprite(ghostArt.tail,v,190*sc,62*sc,alpha*.88)", "drawGhostSprite(ghostArt.tail,v,280*sc,96*sc,alpha*.90)",1)
s=s.replace("if(i>=4&&i%2===0)continue;", "if(i>=7&&i%3===0)continue;",1)
s=s.replace("drawGhostSprite(ghostArt.body[i%ghostArt.body.length],v,178*sc,66*sc,alpha*.88,i%4===3);", "drawGhostSprite(ghostArt.body[i%ghostArt.body.length],v,255*sc,108*sc,alpha*.92,i%5===3);",1)
checks=["rx=clamp(vw*.43,650,820)","ctx.globalAlpha=.22","alpha=.72","440*sc","255*sc"]
for c in checks:
    if c not in s: raise SystemExit(f'missing expected patch: {c}')
p.write_text(s)
