from pathlib import Path

p=Path('src/atropos-world-devourer-attack-past.js')
text=p.read_text()

needle="  const copyPose=pts=>(pts||[]).map(p=>({x:+p.x||0,y:+p.y||0,orbitA:+p.orbitA||0,depth:+p.depth||0}));\n"
insert=needle+"  const ghostArt={head:new Image(),body:[new Image(),new Image(),new Image()],tail:new Image()};\n  for(const img of [ghostArt.head,...ghostArt.body,ghostArt.tail])img.decoding='async';\n  ghostArt.head.src='assets/atropos-head.svg';\n  ghostArt.body[0].src='assets/atropos-segment.svg';\n  ghostArt.body[1].src='assets/atropos-segment-b.svg';\n  ghostArt.body[2].src='assets/atropos-segment-c.svg';\n  ghostArt.tail.src='assets/atropos-tail.svg';\n"
if 'const ghostArt=' not in text:
    if text.count(needle)!=1: raise SystemExit('copyPose anchor mismatch')
    text=text.replace(needle,insert,1)

start=text.index('  function drawGhostPlate(')
end=text.index('  function drawPast()',start)
replacement="""  function drawGhostSprite(img,v,w,h,alpha,flip=false){
    if(!img?.complete||img.naturalWidth<2||alpha<=.005)return;
    ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.a);if(flip)ctx.scale(1,-1);
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;ctx.filter='grayscale(1) brightness(1.85) sepia(.08) hue-rotate(145deg) saturate(.55)';
    ctx.drawImage(img,-w*.5,-h*.5,w,h);ctx.restore();
  }
  function drawGhost(a,q){
    const p=ghostPose(a,q).map(v=>({...v,...worldToScreen(v.x,v.y)}));if(p.length<2)return;
    const headHalf=Math.max(54,Math.min(vw,vh)*.060),tailHalf=19,left=[],right=[];
    for(let i=0;i<p.length;i++){
      const v=p[i],half=lerp(headHalf,tailHalf,v.tailT),nx=-Math.sin(v.a),ny=Math.cos(v.a);
      left.push({x:v.x+nx*half,y:v.y+ny*half});right.push({x:v.x-nx*half,y:v.y-ny*half});
    }
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineJoin='round';
    ctx.globalAlpha=.075;ctx.fillStyle='rgba(145,203,222,.68)';ctx.strokeStyle='rgba(218,246,255,.50)';ctx.lineWidth=1.8;
    ctx.beginPath();ctx.moveTo(left[0].x,left[0].y);for(let i=1;i<left.length;i++)ctx.lineTo(left[i].x,left[i].y);for(let i=right.length-1;i>=0;i--)ctx.lineTo(right[i].x,right[i].y);ctx.closePath();ctx.fill();
    ctx.globalAlpha=.16;ctx.stroke();
    ctx.globalAlpha=.16;ctx.strokeStyle='rgba(226,249,255,.72)';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);ctx.stroke();ctx.restore();
    for(let i=p.length-1;i>=0;i--){
      const v=p[i],sc=lerp(1,.46,v.tailT),alpha=.42*(1-v.tailT*.24);
      if(i===0){drawGhostSprite(ghostArt.head,v,330*sc,165*sc,alpha);continue;}
      if(i===p.length-1){drawGhostSprite(ghostArt.tail,v,190*sc,62*sc,alpha*.88);continue;}
      if(i>=4&&i%2===0)continue;
      drawGhostSprite(ghostArt.body[i%ghostArt.body.length],v,178*sc,66*sc,alpha*.88,i%4===3);
    }
  }
"""
text=text[:start]+replacement+text[end:]
if 'drawGhostPlate' in text: raise SystemExit('polygon plate ghost still present')
if "ghostArt.head.src='assets/atropos-head.svg'" not in text: raise SystemExit('Atropos head art missing')
p.write_text(text)
