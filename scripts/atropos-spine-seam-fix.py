from pathlib import Path
import re


def sub_once(text, pattern, repl, label, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 match, got {n}')
    return out

p = Path('src/atropos-world-devourer-prototype.js')
s = p.read_text()
s = s.replace("const VERSION='atropos-world-devourer-colossal-pass-v3';", "const VERSION='atropos-world-devourer-colossal-pass-v4';", 1)
s = s.replace("return smooth(clamp((p-.495)/.12,0,1));", "return smooth(clamp((p-.46)/.10,0,1));", 1)

new_spine = r'''  function drawSpine(points,manifest,layer){
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const passes=[
      {scale:1,extra:13,color:'#33415f',alpha:.96},
      {scale:1,extra:0,color:'#050914',alpha:1},
      {scale:.76,extra:0,color:'#0d1730',alpha:.82},
      {scale:.45,extra:0,color:'#172341',alpha:.42}
    ];
    for(const pass of passes){
      for(let i=points.length-1;i>0;i--){
        const p=points[i],q=points[i-1],weight=(layerWeights(p.depth)[layer]+layerWeights(q.depth)[layer])*.5;
        if(weight<=.01)continue;
        const tailT=i/(points.length-1),base=274*lerp(1,.46,tailT)*p.scaleUnit,solid=clamp(weight*1.65,0,1);
        ctx.globalAlpha=manifest*solid*pass.alpha;ctx.strokeStyle=pass.color;ctx.lineWidth=base*pass.scale+pass.extra;
        ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
      }
    }
    const edge=[];
    for(let i=1;i<points.length-1;i++){
      const p=points[i],tailT=i/(points.length-1),half=126*lerp(1,.45,tailT)*p.scaleUnit,nx=-Math.sin(p.a),ny=Math.cos(p.a),weight=layerWeights(p.depth)[layer];
      edge.push({p,half,nx,ny,weight});
    }
    for(const side of [-1,1]){
      let open=false;ctx.beginPath();
      for(const e of edge){if(e.weight<=.05){open=false;continue;}const x=e.p.sx+e.nx*e.half*side,y=e.p.sy+e.ny*e.half*side;if(!open){ctx.moveTo(x,y);open=true;}else ctx.lineTo(x,y);}
      ctx.globalAlpha=manifest*.22;ctx.strokeStyle='#7083a6';ctx.lineWidth=3;ctx.stroke();
    }
    for(let i=3;i<points.length-2;i+=4){
      const p=points[i],weight=layerWeights(p.depth)[layer];if(weight<=.04)continue;
      const tailT=i/(points.length-1),half=78*lerp(1,.50,tailT)*p.scaleUnit,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a);
      ctx.globalAlpha=manifest*weight*.34;ctx.strokeStyle='#a8ddec';ctx.lineWidth=Math.max(2,3.2*p.scaleUnit);ctx.beginPath();ctx.moveTo(p.sx+nx*half,p.sy+ny*half);ctx.lineTo(p.sx+tx*8,p.sy+ty*8);ctx.lineTo(p.sx-nx*half*.64+tx*15,p.sy-ny*half*.64+ty*15);ctx.stroke();
    }
    ctx.restore();
  }
'''
s = sub_once(s, r"  function drawSpine\(points,manifest,layer\)\{.*?\n  \}\n  function drawSprite", new_spine + '  function drawSprite', 'drawSpine', re.S)
p.write_text(s)
