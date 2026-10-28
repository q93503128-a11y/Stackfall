from pathlib import Path
import re


def sub_once(text, pattern, repl, label, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 match, got {n}')
    return out

p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text()
s=s.replace("const VERSION='atropos-world-devourer-colossal-pass-v2';","const VERSION='atropos-world-devourer-colossal-pass-v3';",1)
new_spine=r'''  function drawSpine(points,manifest,layer){
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(let i=points.length-1;i>0;i--){
      const p=points[i],q=points[i-1],weight=(layerWeights(p.depth)[layer]+layerWeights(q.depth)[layer])*.5;
      if(weight<=.01)continue;
      const tailT=i/(points.length-1),width=274*lerp(1,.46,tailT)*p.scaleUnit,solid=clamp(weight*1.65,0,1);
      ctx.globalAlpha=manifest*solid*.96;ctx.strokeStyle='#33415f';ctx.lineWidth=width+13;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
      ctx.globalAlpha=manifest*solid;ctx.strokeStyle='#050914';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
      ctx.globalAlpha=manifest*solid*.82;ctx.strokeStyle='#0d1730';ctx.lineWidth=width*.76;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
      ctx.globalAlpha=manifest*solid*.42;ctx.strokeStyle='#172341';ctx.lineWidth=width*.45;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
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
s=sub_once(s,r"  function drawSpine\(points,manifest,layer\)\{.*?\n  \}\n  function drawSprite",new_spine+'  function drawSprite','draw spine',re.S)
new_layer=r'''  function drawSerpentLayer(manifest,layer){
    if(manifest<=.001)return;
    const e=serpentEnemy();if(!e)return;
    const serpent=ensureSerpent(e);if(!serpent?.points?.length)return;
    const pts=serpent.points;drawSpine(pts,manifest,layer);
    for(let i=pts.length-1;i>=0;i--){
      const p=pts[i],weight=layerWeights(p.depth)[layer];if(weight<=.01)continue;
      const foregroundFade=layer==='front'?.88:1,alpha=manifest*weight*foregroundFade;
      if(i===0){const jaw=window.stackfallAtroposMawJawScale,scaleX=Number(jaw?.x)||1,scaleY=Number(jaw?.y)||1;drawSprite(art.head,p,420*p.scaleUnit,235*p.scaleUnit,.98*alpha,.07,false,scaleX,scaleY);continue;}
      if(i===pts.length-1){drawSprite(art.tail,p,330*p.taper*p.scaleUnit,122*p.taper*p.scaleUnit,.90*alpha,.025);continue;}
      const plateSlot=i<=6?i%2===1:i%3===1;if(!plateSlot)continue;
      const bodyArt=art.body[(i*5+Math.floor(i/2))%art.body.length],neckBoost=i<=5?lerp(1.12,1.02,(i-1)/4):1,bodyGlow=layer==='front'?.025:.012;
      drawSprite(bodyArt,p,284*p.taper*neckBoost*p.scaleUnit,126*p.taper*neckBoost*p.scaleUnit,.55*alpha,bodyGlow,i%6===3);
    }
  }
'''
s=sub_once(s,r"  function drawSerpentLayer\(manifest,layer\)\{.*?\n  \}\n\n  const baseEnsure",new_layer+'\n  const baseEnsure','draw layer',re.S)
p.write_text(s)

p=Path('src/atropos-world-devourer-entry.js')
s=p.read_text()
s=s.replace("const rx=clamp(vw*.43,620,800)*(1+.055*Math.sin(a*1.7+.6)),ry=clamp(vh*.39,325,455)*(1+.050*Math.cos(a*2.1-.2));","const rx=clamp(vw*.38,560,720)*(1+.050*Math.sin(a*1.7+.6)),ry=clamp(vh*.34,285,385)*(1+.045*Math.cos(a*2.1-.2));",1)
s=s.replace("const rx=clamp(vw*.43,620,800),ry=clamp(vh*.39,325,455);","const rx=clamp(vw*.38,560,720),ry=clamp(vh*.34,285,385);",1)
s=s.replace("const t=(q-.13)/.73,a=start+t*TAU,p=loopPoint(a);return{x:p.x,y:p.y,a};","const t=smooth((q-.13)/.73),a=start+t*TAU,p=loopPoint(a);return{x:p.x,y:p.y,a};",1)
s=s.replace("ENTRY.startAngle=-2.55+(((state.apexCount||0)&1)?.10:-.10);","ENTRY.startAngle=-2.30+(((state.apexCount||0)&1)?.08:-.08);",1)
p.write_text(s)
