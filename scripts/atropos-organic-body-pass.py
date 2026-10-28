from pathlib import Path
import re


def sub_once(text, pattern, repl, label, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 match, got {n}')
    return out

p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text()
s=s.replace("const VERSION='atropos-world-devourer-colossal-pass-v4';","const VERSION='atropos-world-devourer-colossal-pass-v5';",1)
s=s.replace("return smooth(clamp((p-.46)/.10,0,1));","return smooth(clamp((p-.43)/.09,0,1));",1)
new_spine=r'''  function bodyHalfWidth(p,i,side=1){
    const tailT=i/Math.max(1,PART_KEYS.length-1),neck=tailT<.24?lerp(132,119,tailT/.24):lerp(119,58,(tailT-.24)/.76),jag=1+.065*Math.sin(i*1.71+side*.83)+.035*Math.sin(i*.61+side*2.27);
    return neck*p.scaleUnit*jag;
  }
  function layerRuns(points,layer){
    const runs=[];let run=[];
    for(let i=0;i<points.length;i++){
      const p=points[i],weight=layerWeights(p.depth)[layer];
      if(weight>.025)run.push({p,i,weight});
      else if(run.length){if(run.length>1)runs.push(run);run=[];}
    }
    if(run.length>1)runs.push(run);return runs;
  }
  function traceBodyPolygon(run,scale=1){
    ctx.beginPath();
    for(let k=0;k<run.length;k++){
      const {p,i}=run[k],half=bodyHalfWidth(p,i,1)*scale,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),j=(Math.sin(i*2.43)+Math.sin(i*.91))*2.2*scale,x=p.sx+nx*half+tx*j,y=p.sy+ny*half+ty*j;
      if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    for(let k=run.length-1;k>=0;k--){
      const {p,i}=run[k],half=bodyHalfWidth(p,i,-1)*scale,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),j=(Math.cos(i*2.17)+Math.sin(i*.73))*2.1*scale;
      ctx.lineTo(p.sx-nx*half+tx*j,p.sy-ny*half+ty*j);
    }
    ctx.closePath();
  }
  function drawSpine(points,manifest,layer){
    const runs=layerRuns(points,layer);if(!runs.length)return;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='butt';
    for(const run of runs){
      const avg=run.reduce((sum,e)=>sum+e.weight,0)/run.length,solid=clamp(avg*1.72,.14,1);
      traceBodyPolygon(run,1.07);ctx.globalAlpha=manifest*solid*.96;ctx.fillStyle='#394663';ctx.fill();
      traceBodyPolygon(run,1);ctx.globalAlpha=manifest*solid;ctx.fillStyle='#030711';ctx.fill();
      traceBodyPolygon(run,.82);ctx.globalAlpha=manifest*solid*.92;ctx.fillStyle='#0b142a';ctx.fill();
      traceBodyPolygon(run,.55);ctx.globalAlpha=manifest*solid*.74;ctx.fillStyle='#172440';ctx.fill();
      traceBodyPolygon(run,1.01);ctx.globalAlpha=manifest*solid*.26;ctx.strokeStyle='#70819f';ctx.lineWidth=3;ctx.stroke();
    }
    for(let i=2;i<points.length-2;i+=3){
      const p=points[i],weight=layerWeights(p.depth)[layer];if(weight<=.06)continue;
      const half=bodyHalfWidth(p,i,1)*.58,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),flip=(i&1)?1:-1;
      ctx.globalAlpha=manifest*weight*.30;ctx.strokeStyle=i%6===2?'#c3effa':'#82b7c8';ctx.lineWidth=Math.max(2,3.1*p.scaleUnit);ctx.beginPath();ctx.moveTo(p.sx+nx*half*flip,p.sy+ny*half*flip);ctx.lineTo(p.sx+tx*16,p.sy+ty*16);ctx.lineTo(p.sx-nx*half*.44*flip+tx*34,p.sy-ny*half*.44*flip+ty*34);ctx.stroke();
    }
    ctx.restore();
  }
'''
s=sub_once(s,r"  function drawSpine\(points,manifest,layer\)\{.*?\n  \}\n  function drawSprite",new_spine+'  function drawSprite','organic body renderer',re.S)
old="""      const plateSlot=i<=6?i%2===1:i%3===1;if(!plateSlot)continue;
      const bodyArt=art.body[(i*5+Math.floor(i/2))%art.body.length],neckBoost=i<=5?lerp(1.12,1.02,(i-1)/4):1,bodyGlow=layer==='front'?.025:.012;
      drawSprite(bodyArt,p,284*p.taper*neckBoost*p.scaleUnit,126*p.taper*neckBoost*p.scaleUnit,.55*alpha,bodyGlow,i%6===3);"""
new="""      const plateSlot=i<=5?i%2===1:i%4===1;if(!plateSlot)continue;
      const bodyArt=art.body[(i*5+Math.floor(i/2))%art.body.length],neckBoost=i<=5?lerp(1.10,1.01,(i-1)/4):1,bodyGlow=layer==='front'?.022:.010;
      drawSprite(bodyArt,p,238*p.taper*neckBoost*p.scaleUnit,108*p.taper*neckBoost*p.scaleUnit,.64*alpha,bodyGlow,i%7===3);"""
if old not in s: raise SystemExit('plate block missing')
s=s.replace(old,new,1)
s=s.replace("drawSprite(art.head,p,420*p.scaleUnit,235*p.scaleUnit,.98*alpha,.07,false,scaleX,scaleY)","drawSprite(art.head,p,470*p.scaleUnit,250*p.scaleUnit,.98*alpha,.07,false,scaleX,scaleY)",1)
p.write_text(s)
