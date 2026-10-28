from pathlib import Path

p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text();old=s

# Remove the stray pre-declaration assignment left by the previous patch.
s=s.replace('  window.stackfallAtroposIdleOffset=idleOffset;\n  function idleOffset', '  function idleOffset', 1)

start=s.index('  function idleOffset(serpent,t=serpent.motionTime){')
end=s.index('\n  window.stackfallAtroposIdleOffset=idleOffset;', start)
idle='''  function idleOffset(serpent,t=serpent.motionTime){
    const phase=Number(serpent.phaseBase)||0,a=(Number(t)||0)*.145+phase;
    const rx=clamp(vw*.62,900,1120),ry=clamp(vh*.52,500,660),wave=Math.sin(a*2.35+.6)*72;
    return{
      x:Math.cos(a)*rx-Math.sin(a)*wave,
      y:Math.sin(a)*ry+Math.cos(a)*wave*.68,
      orbitA:a
    };
  }'''
s=s[:start]+idle+s[end:]

# Visual-only corner smoothing. Collision points remain unchanged.
marker='  function buildSerpentPose(e){'
insert='''  function smoothRenderSamples(samples){
    if(!samples||samples.length<3)return samples||[];
    const out=[samples[0]];
    for(let i=0;i<samples.length-1;i++){
      const a=samples[i],b=samples[i+1];
      out.push({x:lerp(a.x,b.x,.25),y:lerp(a.y,b.y,.25),orbitA:lerp(a.orbitA,b.orbitA,.25)});
      out.push({x:lerp(a.x,b.x,.75),y:lerp(a.y,b.y,.75),orbitA:lerp(a.orbitA,b.orbitA,.75)});
    }
    out.push(samples[samples.length-1]);
    return out;
  }

'''
if 'function smoothRenderSamples(samples)' not in s:s=s.replace(marker,insert+marker,1)
s=s.replace('    const renderSamples=sampleHistoryDistances(history,renderDistances),renderPoints=[];',
            '    const rawRenderSamples=sampleHistoryDistances(history,renderDistances),renderSamples=smoothRenderSamples(rawRenderSamples),renderPoints=[];')

# Narrow the body another step and keep the neck compatible with the head height.
old_body="""    const base=tailT<.10?lerp(108,94,tailT/.10):tailT<.62?lerp(94,72,(tailT-.10)/.52):lerp(72,7,(tailT-.62)/.38);\n    const jag=1+.042*Math.sin(tailT*23+side*.83)+.017*Math.sin(tailT*61+side*2.27);"""
new_body="""    const base=tailT<.10?lerp(94,84,tailT/.10):tailT<.62?lerp(84,56,(tailT-.10)/.52):lerp(56,6,(tailT-.62)/.38);\n    const jag=1+.050*Math.sin(tailT*21+side*.83)+.020*Math.sin(tailT*57+side*2.27);"""
assert old_body in s
s=s.replace(old_body,new_body,1)

# Remove the full-length inner stripe that made the body read as a road/ribbon.
stripe="      traceBodyPolygon(run,.965);ctx.globalAlpha=manifest*solid*.72;ctx.fillStyle='#0a1020';ctx.fill();\n"
assert stripe in s
s=s.replace(stripe,'',1)

s=s.replace("    drawSprite(open?'headOpen':'headClosed',head,410*head.scaleUnit,228*head.scaleUnit,.94*alpha,.028,false,scaleX,scaleY);",
            "    drawSprite(open?'headOpen':'headClosed',head,382*head.scaleUnit,216*head.scaleUnit,.94*alpha,.024,false,scaleX,scaleY);")
s=s.replace("renderMode:'canvas-serpent-scurve-v4'", "renderMode:'canvas-serpent-nonbacktrack-v5'")

assert s!=old
assert 'smoothRenderSamples' in s and 'nonbacktrack-v5' in s
assert s.count('window.stackfallAtroposIdleOffset=idleOffset;')==1
p.write_text(s)
