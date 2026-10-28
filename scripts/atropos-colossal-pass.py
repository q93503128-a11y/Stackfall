from pathlib import Path
import re


def sub_once(text, pattern, repl, label, flags=0):
    new, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'{label}: expected 1 replacement, got {n}')
    return new

p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text()
s=s.replace("const VERSION='atropos-world-devourer-final-art-pass-v1';","const VERSION='atropos-world-devourer-colossal-pass-v2';",1)
s=s.replace('const BODY_COUNT=15;','const BODY_COUNT=19;',1)
s=s.replace('const SAMPLE_SPACING=64;','const SAMPLE_SPACING=78;',1)
s=s.replace("function motionScale(){return clamp(Math.min(vw,vh)/900,.88,1.16);}","function motionScale(){return clamp(Math.min(vw,vh)/900,.92,1.20);}",1)
s=s.replace("const rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);","const rx=clamp(vw*.43,650,820),ry=clamp(vh*.40,330,450);",1)
s=s.replace("const definitions=PART_KEYS.map((key,i)=>({key,label:key.toUpperCase(),dx:0,dy:0,r:i===0?92:i===PART_KEYS.length-1?36:58,active:true,visible:true}));","const definitions=PART_KEYS.map((key,i)=>({key,label:key.toUpperCase(),dx:0,dy:0,r:i===0?98:i===PART_KEYS.length-1?42:76,active:true,visible:true}));",1)
s=s.replace("const taper=i===0?1.22:i===PART_KEYS.length-1?.38:lerp(1.08,.62,tailT);","const taper=i===0?1.14:i===PART_KEYS.length-1?.48:(tailT<.24?lerp(1.20,1.08,tailT/.24):lerp(1.08,.62,(tailT-.24)/.76));",1)
s=s.replace("part.r=(i===0?82:i===points.length-1?34:55)*p.taper*p.scaleUnit;","part.r=(i===0?94:i===points.length-1?40:72)*p.taper*p.scaleUnit;",1)

new_spine=r'''  function drawSpine(points,manifest,layer){
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(let i=points.length-1;i>0;i--){
      const p=points[i],q=points[i-1],weight=(layerWeights(p.depth)[layer]+layerWeights(q.depth)[layer])*.5;
      if(weight<=.01)continue;
      const tailT=i/(points.length-1),width=292*lerp(1,.44,tailT)*p.scaleUnit;
      ctx.globalAlpha=manifest*weight*.78;ctx.strokeStyle='#34415f';ctx.lineWidth=width+12;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
      ctx.globalAlpha=manifest*weight*.98;ctx.strokeStyle='#050915';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
      ctx.globalAlpha=manifest*weight*.28;ctx.strokeStyle='#111a34';ctx.lineWidth=width*.70;ctx.beginPath();ctx.moveTo(p.sx,p.sy);ctx.lineTo(q.sx,q.sy);ctx.stroke();
    }
    for(let i=3;i<points.length-2;i+=4){
      const p=points[i],weight=layerWeights(p.depth)[layer];if(weight<=.03)continue;
      const tailT=i/(points.length-1),half=92*lerp(1,.50,tailT)*p.scaleUnit,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a);
      ctx.globalAlpha=manifest*weight*.30;ctx.strokeStyle='#9fd8ea';ctx.lineWidth=Math.max(2,3.6*p.scaleUnit);ctx.beginPath();ctx.moveTo(p.sx+nx*half,p.sy+ny*half);ctx.lineTo(p.sx+tx*10,p.sy+ty*10);ctx.lineTo(p.sx-nx*half*.72+tx*18,p.sy-ny*half*.72+ty*18);ctx.stroke();
    }
    ctx.restore();
  }
'''
s=sub_once(s,r"  function drawSpine\(points,manifest,layer\)\{.*?\n  \}\n  function drawSprite",new_spine+'  function drawSprite','drawSpine',re.S)

new_layer=r'''  function drawSerpentLayer(manifest,layer){
    if(manifest<=.001)return;
    const e=serpentEnemy();if(!e)return;
    const serpent=ensureSerpent(e);if(!serpent?.points?.length)return;
    const pts=serpent.points;drawSpine(pts,manifest,layer);
    for(let i=pts.length-1;i>=0;i--){
      const p=pts[i],weight=layerWeights(p.depth)[layer];if(weight<=.01)continue;
      const foregroundFade=layer==='front'?.88:1,alpha=manifest*weight*foregroundFade;
      if(i===0){const jaw=window.stackfallAtroposMawJawScale,scaleX=Number(jaw?.x)||1,scaleY=Number(jaw?.y)||1;drawSprite(art.head,p,420*p.scaleUnit,235*p.scaleUnit,.98*alpha,.07,false,scaleX,scaleY);continue;}
      if(i===pts.length-1){drawSprite(art.tail,p,340*p.taper*p.scaleUnit,132*p.taper*p.scaleUnit,.92*alpha,.03);continue;}
      if(i>=8&&i%4===0)continue;
      const bodyArt=art.body[(i*7+Math.floor(i/3))%art.body.length],neckBoost=i<=5?lerp(1.16,1.02,(i-1)/4):1,bodyGlow=layer==='front'?.035:.018;
      drawSprite(bodyArt,p,320*p.taper*neckBoost*p.scaleUnit,150*p.taper*neckBoost*p.scaleUnit,.72*alpha,bodyGlow,i%5===3);
    }
  }
'''
s=sub_once(s,r"  function drawSerpentLayer\(manifest,layer\)\{.*?\n  \}\n\n  const baseEnsure",new_layer+'\n  const baseEnsure','drawSerpentLayer',re.S)
p.write_text(s)

p=Path('src/atropos-world-devourer-entry.js')
s=p.read_text()
s=s.replace("const rx=clamp(vw*.32,520,640),ry=clamp(vh*.30,250,330);","const rx=clamp(vw*.43,650,820),ry=clamp(vh*.40,330,450);",1)
s=s.replace("const rx=clamp(vw*.34,470,650)*(1+.065*Math.sin(a*1.7+.6)),ry=clamp(vh*.30,255,345)*(1+.055*Math.cos(a*2.1-.2));","const rx=clamp(vw*.43,620,800)*(1+.055*Math.sin(a*1.7+.6)),ry=clamp(vh*.39,325,455)*(1+.050*Math.cos(a*2.1-.2));",1)
s=s.replace("const rx=clamp(vw*.34,470,650),ry=clamp(vh*.30,255,345);","const rx=clamp(vw*.43,620,800),ry=clamp(vh*.39,325,455);",1)
s=s.replace('step=4,count=430','step=4,count=520',1)
s=s.replace('if(s.history.length>1500)s.history.splice(0,s.history.length-1500);','if(s.history.length>900)s.history.splice(0,s.history.length-900);',1)
p.write_text(s)

p=Path('src/atropos-world-devourer-attack-past.js')
s=p.read_text()
s=s.replace('SEGMENTS=17,SPACING=64','SEGMENTS=21,SPACING=78',1)
p.write_text(s)
