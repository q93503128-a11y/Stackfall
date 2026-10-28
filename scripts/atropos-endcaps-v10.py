from pathlib import Path
p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text();old=s

# Taper tail all the way to a point.
s=s.replace("    const base=tailT<.10?lerp(78,70,tailT/.10):tailT<.62?lerp(70,46,(tailT-.10)/.52):lerp(46,5,(tailT-.62)/.38);",
            "    const base=tailT<.10?lerp(78,70,tailT/.10):tailT<.62?lerp(70,46,(tailT-.10)/.52):lerp(46,.5,(tailT-.62)/.38);")

start=s.index('  function traceBodyPolygon(run,scale=1){')
end=s.index('\n  function drawBodySkin',start)
block='''  function traceBodyPolygon(run,scale=1){
    ctx.beginPath();
    for(let k=0;k<run.length;k++){
      const {p,i}=run[k],isHead=k===0,isTail=k===run.length-1,half=(isTail?0:bodyHalfWidth(p,i,1))*scale,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),phase=(p.tailT||0)*Math.PI*2,j=(Math.sin(phase*5.3)+Math.sin(phase*11.7))*1.15*scale,lead=isHead?-58*p.scaleUnit:isTail?34*p.scaleUnit:0,x=p.sx+nx*half+tx*(j+lead),y=p.sy+ny*half+ty*(j+lead);
      if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    for(let k=run.length-1;k>=0;k--){
      const {p,i}=run[k],isHead=k===0,isTail=k===run.length-1,half=(isTail?0:bodyHalfWidth(p,i,-1))*scale,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),phase=(p.tailT||0)*Math.PI*2,j=(Math.cos(phase*4.9)+Math.sin(phase*9.1))*1.05*scale,lead=isHead?-58*p.scaleUnit:isTail?34*p.scaleUnit:0;
      ctx.lineTo(p.sx-nx*half+tx*(j+lead),p.sy-ny*half+ty*(j+lead));
    }
    ctx.closePath();
  }'''
s=s[:start]+block+s[end:]
s=s.replace("renderMode:'canvas-textured-historysync-v9'", "renderMode:'canvas-textured-endcaps-v10'")
assert s!=old and 'isTail?0' in s and 'endcaps-v10' in s
p.write_text(s)
