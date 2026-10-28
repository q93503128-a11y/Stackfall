from pathlib import Path
import re

PROTO = Path('src/atropos-world-devourer-prototype.js')
s = PROTO.read_text()
old = s
s = s.replace('  const SAMPLE_SPACING=118;', '  const SAMPLE_SPACING=96;')

head_start = s.index('  function headWorldPosition(e,serpent,t){')
head_end = s.index('\n\n  function seedHistory', head_start)
head_block = '''  function idleOffset(serpent,t=serpent.motionTime){
    const phase=Number(serpent.phaseBase)||0,a=(Number(t)||0)*.118+phase;
    const rx=clamp(vw*.34,520,700),ry=clamp(vh*.225,200,290),drift=clamp(Math.min(vw,vh)*.08,55,90);
    return{
      x:Math.cos(a)*rx+Math.sin(a*.47+.4)*drift,
      y:Math.sin(a*1.65)*ry+Math.sin(a*.73+1.2)*62,
      orbitA:a
    };
  }
  window.stackfallAtroposIdleOffset=idleOffset;
  function headWorldPosition(e,serpent,t){
    const o=idleOffset(serpent,t);
    return{x:serpent.anchorX+o.x,y:serpent.anchorY+o.y,orbitA:o.orbitA};
  }'''
s = s[:head_start] + head_block + s[head_end:]

s = s.replace("    const taperAt=t=>t<.16?lerp(1.28,1.20,t/.16):t<.68?lerp(1.20,.92,(t-.16)/.52):lerp(.92,.18,(t-.68)/.32);",
              "    const taperAt=t=>t<.12?lerp(1.18,1.12,t/.12):t<.68?lerp(1.12,.88,(t-.12)/.56):lerp(.88,.10,(t-.68)/.32);")
s = s.replace("      part.r=(i===0?104:i===points.length-1?34:78)*q.taper*q.scaleUnit;",
              "      part.r=(i===0?80:i===points.length-1?26:60)*q.taper*q.scaleUnit;")

body_start = s.index('  function bodyHalfWidth(p,i,side=1){')
body_end = s.index('\n  function layerRuns', body_start)
body_block = '''  function bodyHalfWidth(p,i,side=1){
    const tailT=clamp(Number.isFinite(p.tailT)?p.tailT:i/Math.max(1,PART_KEYS.length-1),0,1);
    const base=tailT<.10?lerp(108,94,tailT/.10):tailT<.62?lerp(94,72,(tailT-.10)/.52):lerp(72,7,(tailT-.62)/.38);
    const jag=1+.042*Math.sin(tailT*23+side*.83)+.017*Math.sin(tailT*61+side*2.27);
    return base*p.scaleUnit*jag;
  }'''
s = s[:body_start] + body_block + s[body_end:]

runs_start = s.index('  function layerRuns(points,layer){')
runs_end = s.index('\n  function traceBodyPolygon', runs_start)
runs_block = '''  function layerRuns(points,layer){
    const runs=[];let run=[];const headDepth=points[0]?.depth||0;
    for(let i=0;i<points.length;i++){
      const p=points[i],depth=i<8?headDepth:p.depth,weight=layerWeights(depth)[layer];
      if(weight>.018)run.push({p,i,weight});
      else if(run.length){if(run.length>1)runs.push(run);run=[];}
    }
    if(run.length>1)runs.push(run);return runs;
  }'''
s = s[:runs_start] + runs_block + s[runs_end:]

surf_start = s.index('  function drawCarapaceSurface(run,manifest,solid){')
surf_end = s.index('\n  function drawSpine', surf_start)
surf_block = '''  function drawCarapaceSurface(run,manifest,solid){
    if(run.length<5)return;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    ctx.beginPath();
    for(let k=0;k<run.length;k++){
      const {p,i}=run[k],half=bodyHalfWidth(p,i,1)*.62,nx=-Math.sin(p.a),ny=Math.cos(p.a),x=p.sx+nx*half,y=p.sy+ny*half;
      if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.globalAlpha=manifest*solid*.20;ctx.strokeStyle='#31405a';ctx.lineWidth=7;ctx.stroke();
    const step=Math.max(7,Math.floor(run.length/9));
    for(let k=step;k<run.length-step;k+=step){
      const {p,i,weight}=run[k],flip=((Math.floor((p.tailT||0)*73))&1)?1:-1,half=bodyHalfWidth(p,i,1)*.76,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),diag=12*p.scaleUnit*flip;
      const ax=p.sx+nx*half-tx*diag,ay=p.sy+ny*half-ty*diag,bx=p.sx-nx*half+tx*diag,by=p.sy-ny*half+ty*diag;
      ctx.globalAlpha=manifest*weight*.31;ctx.strokeStyle='#050812';ctx.lineWidth=Math.max(4,5*p.scaleUnit);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
      ctx.globalAlpha=manifest*weight*.17;ctx.strokeStyle='#5d6f8d';ctx.lineWidth=Math.max(1,1.3*p.scaleUnit);ctx.beginPath();ctx.moveTo(ax+tx*2,ay+ty*2);ctx.lineTo(bx+tx*2,by+ty*2);ctx.stroke();
      if((k/step)%2<1.1){
        const side=flip,crackHalf=half*.34,cx=p.sx+nx*crackHalf*side,cy=p.sy+ny*crackHalf*side;
        ctx.globalAlpha=manifest*weight*.20;ctx.strokeStyle='#9ed7e6';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx-tx*10*p.scaleUnit,cy-ty*10*p.scaleUnit);ctx.lineTo(cx+nx*8*side,cy+ny*8*side);ctx.lineTo(cx+tx*16*p.scaleUnit,cy+ty*16*p.scaleUnit);ctx.stroke();
      }
    }
    ctx.restore();
  }'''
s = s[:surf_start] + surf_block + s[surf_end:]

spine_start = s.index('  function drawSpine(points,manifest,layer){')
spine_end = s.index('\n  function drawSprite', spine_start)
spine_block = '''  function drawSpine(points,manifest,layer){
    const runs=layerRuns(points,layer);if(!runs.length)return;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='butt';
    for(const run of runs){
      const avg=run.reduce((sum,e)=>sum+e.weight,0)/run.length,solid=clamp(avg*1.72,.14,1);
      traceBodyPolygon(run,1.055);ctx.globalAlpha=manifest*solid*.84;ctx.fillStyle='#273249';ctx.fill();
      traceBodyPolygon(run,1);ctx.globalAlpha=manifest*solid;ctx.fillStyle='#030610';ctx.fill();
      traceBodyPolygon(run,.965);ctx.globalAlpha=manifest*solid*.72;ctx.fillStyle='#0a1020';ctx.fill();
      traceBodyPolygon(run,1.01);ctx.globalAlpha=manifest*solid*.20;ctx.strokeStyle='#62718b';ctx.lineWidth=2.2;ctx.stroke();
      drawCarapaceSurface(run,manifest,solid);
    }
    ctx.restore();
  }'''
s = s[:spine_start] + spine_block + s[spine_end:]

s = s.replace("    drawSprite(open?'headOpen':'headClosed',head,548*head.scaleUnit,296*head.scaleUnit,.94*alpha,.035,false,scaleX,scaleY);",
              "    drawSprite(open?'headOpen':'headClosed',head,410*head.scaleUnit,228*head.scaleUnit,.94*alpha,.028,false,scaleX,scaleY);")
s = s.replace("renderMode:'canvas-ribbon-resample-v3-livehead-carapace'", "renderMode:'canvas-serpent-scurve-v4'")
assert s != old
assert 'stackfallAtroposIdleOffset' in s and 'SAMPLE_SPACING=96' in s
assert '410*head.scaleUnit,228*head.scaleUnit' in s
PROTO.write_text(s)

# All attack modules must use the same idle transform or they snap after a forced pattern.
def replace_orbit(path, arg):
    p=Path(path);t=p.read_text();marker=f'  function orbitOffset({arg})' ; start=t.index(marker); nxt=t.index('\n  function ', start+len(marker))
    repl=f'''  function orbitOffset({arg}){{\n    if(typeof window.stackfallAtroposIdleOffset==='function')return window.stackfallAtroposIdleOffset({arg},Number({arg}.motionTime)||0);\n    return{{x:0,y:0,orbitA:Number({arg}.phaseBase)||0}};\n  }}'''
    t=t[:start]+repl+t[nxt:]
    p.write_text(t)

replace_orbit('src/atropos-world-devourer-attack-crossing.js','serpent')
replace_orbit('src/atropos-world-devourer-attack-maw.js','serpent')
replace_orbit('src/atropos-world-devourer-attack-ring.js','serpent')
replace_orbit('src/atropos-world-devourer-attack-past.js','s')
replace_orbit('src/atropos-world-devourer-attack-world.js','s')
