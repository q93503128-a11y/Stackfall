from pathlib import Path

p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text();old=s

# Idle composition: keep head/front body visible at spawn while retaining a broad, slow arc.
s=s.replace("    const phase=Number(serpent.phaseBase)||0,a=(Number(t)||0)*.17+phase;\n    const rx=clamp(vw*.54,760,900),ry=clamp(vh*.46,380,520),wave=Math.sin(a*2.18+.55)*54;",
            "    const phase=Number(serpent.phaseBase)||0,a=(Number(t)||0)*.11+phase;\n    const rx=clamp(vw*.54,760,900),ry=clamp(vh*.30,280,360),wave=Math.sin(a*2.18+.55)*46;")
s=s.replace("      y:-40+Math.sin(a)*ry+Math.cos(a)*wave*.66,", "      y:-80+Math.sin(a)*ry+Math.cos(a)*wave*.62,")
s=s.replace("      serpent.phaseBase=.72;", "      serpent.phaseBase=1.15;")
s=s.replace("      const p=headWorldPosition(e,serpent,now-i*.018);", "      const p=headWorldPosition(e,serpent,now-i*.024);")

# Narrow the creature slightly so it reads as a serpent rather than a road.
s=s.replace("    const base=tailT<.10?lerp(94,84,tailT/.10):tailT<.62?lerp(84,56,(tailT-.10)/.52):lerp(56,6,(tailT-.62)/.38);",
            "    const base=tailT<.10?lerp(78,70,tailT/.10):tailT<.62?lerp(70,46,(tailT-.10)/.52):lerp(46,5,(tailT-.62)/.38);")
s=s.replace("      part.r=(i===0?80:i===points.length-1?26:60)*q.taper*q.scaleUnit;",
            "      part.r=(i===0?72:i===points.length-1?22:50)*q.taper*q.scaleUnit;")

# Mid layer is now one continuous organism. Front is an overlay only; back no longer cuts the silhouette.
start=s.index('  function layerRuns(points,layer){')
end=s.index('\n  function traceBodyPolygon', start)
block='''  function layerRuns(points,layer){
    if(layer==='mid')return[points.map((p,i)=>({p,i,weight:1}))];
    if(layer==='back')return[];
    const runs=[];let run=[];const headDepth=points[0]?.depth||0;
    for(let i=0;i<points.length;i++){
      const p=points[i],depth=i<8?headDepth:p.depth,weight=layerWeights(depth).front;
      if(weight>.18)run.push({p,i,weight});
      else if(run.length){if(run.length>1)runs.push(run);run=[];}
    }
    if(run.length>1)runs.push(run);return runs;
  }'''
s=s[:start]+block+s[end:]

# Render front overlay more lightly, but keep the mid body fully opaque and continuous.
s=s.replace("  function drawSpine(points,manifest,layer){\n    const runs=layerRuns(points,layer);if(!runs.length)return;",
            "  function drawSpine(points,manifest,layer){\n    const runs=layerRuns(points,layer);if(!runs.length)return;\n    const layerAlpha=layer==='front'?.76:1;")
s=s.replace("      const avg=run.reduce((sum,e)=>sum+e.weight,0)/run.length,solid=clamp(avg*1.72,.14,1);",
            "      const avg=run.reduce((sum,e)=>sum+e.weight,0)/run.length,solid=clamp(avg*1.72,.14,1)*layerAlpha;")

# Replace depth-gated head logic: always draw the actual head with the continuous mid body; front pass only overlays when needed.
start=s.index('  function drawSerpentLayer(manifest,layer){')
end=s.index('\n\n  const baseEnsure', start)
block='''  function drawSerpentLayer(manifest,layer){
    if(manifest<=.001||layer==='back')return;
    const e=serpentEnemy();if(!e)return;
    const serpent=ensureSerpent(e);if(!serpent?.points?.length)return;
    const pts=serpent.renderPoints?.length?serpent.renderPoints:serpent.points;
    drawSpine(pts,manifest,layer);
    const head=pts[0],tail=pts[pts.length-1];if(!head)return;
    const headFront=layerWeights(head.depth).front,headAlpha=layer==='mid'?manifest:manifest*headFront*.74;
    if(headAlpha>.01){
      const jaw=window.stackfallAtroposMawJawScale,scaleX=Number(jaw?.x)||1,scaleY=Number(jaw?.y)||1,open=!!jaw;
      drawSprite(open?'headOpen':'headClosed',head,382*head.scaleUnit,216*head.scaleUnit,.96*headAlpha,.024,false,scaleX,scaleY);
    }
    if(tail&&layer==='mid')drawSprite('tail',tail,175*tail.scaleUnit,76*tail.scaleUnit,.82*manifest,.008,false,1,1);
  }'''
s=s[:start]+block+s[end:]

s=s.replace("renderMode:'canvas-textured-meshrope-v6'", "renderMode:'canvas-textured-continuous-v7'")
assert s!=old
assert "if(layer==='mid')return[points.map" in s
assert "layer==='back')return" in s
assert "drawSprite('tail'" in s
p.write_text(s)
