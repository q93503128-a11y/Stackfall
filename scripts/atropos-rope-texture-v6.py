from pathlib import Path

p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text();old=s

# Make the idle path visible on spawn and still long enough not to backtrack inside the body history.
start=s.index('  function idleOffset(serpent,t=serpent.motionTime){')
end=s.index('\n  window.stackfallAtroposIdleOffset=idleOffset;', start)
idle='''  function idleOffset(serpent,t=serpent.motionTime){
    const phase=Number(serpent.phaseBase)||0,a=(Number(t)||0)*.17+phase;
    const rx=clamp(vw*.54,760,900),ry=clamp(vh*.46,380,520),wave=Math.sin(a*2.18+.55)*54;
    return{
      x:80+Math.cos(a)*rx-Math.sin(a)*wave,
      y:-40+Math.sin(a)*ry+Math.cos(a)*wave*.66,
      orbitA:a
    };
  }'''
s=s[:start]+idle+s[end:]
s=s.replace("      serpent.phaseBase=(e.id||0)*.173+.4;", "      serpent.phaseBase=.72;")

# Build one continuous raster skin strip from the approved atlas. The body renderer samples this strip as narrow slices.
old_loader="""  function prepareProcessedHeads(){prepareProcessedHead('headClosed');prepareProcessedHead('headOpen');}\n  if(atlas.complete&&atlas.naturalWidth>1)prepareProcessedHeads();else atlas.addEventListener('load',prepareProcessedHeads,{once:true});"""
new_loader="""  function prepareProcessedHeads(){prepareProcessedHead('headClosed');prepareProcessedHead('headOpen');}\n  let bodySkin=null;\n  function prepareBodySkin(){\n    try{\n      const keys=['neckA','bodyA','bodyB','bodyC','bodyD','rear'],c=document.createElement('canvas');c.width=960;c.height=128;const g=c.getContext('2d');\n      g.fillStyle='#030610';g.fillRect(0,0,c.width,c.height);g.globalAlpha=.86;g.filter='saturate(.62) brightness(.72) contrast(1.08)';\n      const slot=188,step=154;\n      for(let i=0;i<keys.length;i++){const f=ART_FRAMES[keys[i]],x=i*step-18;if(f)g.drawImage(atlas,f.x,f.y,f.w,f.h,x,-4,slot,136);}\n      g.filter='none';g.globalAlpha=.28;g.fillStyle='#07101f';g.fillRect(0,0,c.width,c.height);\n      bodySkin=c;\n    }catch{bodySkin=null;}\n  }\n  function prepareProductionRaster(){prepareProcessedHeads();prepareBodySkin();}\n  if(atlas.complete&&atlas.naturalWidth>1)prepareProductionRaster();else atlas.addEventListener('load',prepareProductionRaster,{once:true});"""
assert old_loader in s
s=s.replace(old_loader,new_loader,1)

# Insert a Canvas2D rope-style texture sampler before the procedural surface details.
marker='  function drawCarapaceSurface(run,manifest,solid){'
rope='''  function drawBodySkin(run,manifest,solid){
    if(!bodySkin||run.length<3)return;
    ctx.save();traceBodyPolygon(run,1);ctx.clip();ctx.globalAlpha=manifest*solid*.76;ctx.filter='saturate(.72) contrast(1.04) brightness(.82)';
    const stride=3,sw=26,maxX=Math.max(1,bodySkin.width-sw);
    for(let k=0;k<run.length-1;k+=stride){
      const cur=run[k],next=run[Math.min(run.length-1,k+stride)],p=cur.p,q=next.p,len=Math.max(12,Math.hypot(q.sx-p.sx,q.sy-p.sy)+10),half=bodyHalfWidth(p,cur.i,1)*.98,sx=Math.floor((p.tailT||0)*maxX);
      ctx.save();ctx.translate(p.sx,p.sy);ctx.rotate(p.a||0);ctx.drawImage(bodySkin,sx,0,sw,bodySkin.height,-len*.56,-half,len*1.12,half*2);ctx.restore();
    }
    ctx.restore();
  }
'''
if 'function drawBodySkin(run,manifest,solid)' not in s:s=s.replace(marker,rope+marker,1)

# Tone down the graphic seam layer now that the raster skin provides the surface information.
s=s.replace("      ctx.globalAlpha=manifest*weight*.31;ctx.strokeStyle='#050812';ctx.lineWidth=Math.max(4,5*p.scaleUnit);",
            "      ctx.globalAlpha=manifest*weight*.22;ctx.strokeStyle='#050812';ctx.lineWidth=Math.max(3,4*p.scaleUnit);")
s=s.replace("      ctx.globalAlpha=manifest*weight*.17;ctx.strokeStyle='#5d6f8d';",
            "      ctx.globalAlpha=manifest*weight*.12;ctx.strokeStyle='#5d6f8d';")
s=s.replace("        ctx.globalAlpha=manifest*weight*.20;ctx.strokeStyle='#9ed7e6';",
            "        ctx.globalAlpha=manifest*weight*.16;ctx.strokeStyle='#9ed7e6';")

# Add the warped skin between the base silhouette and sparse carapace seams.
needle="      traceBodyPolygon(run,1.01);ctx.globalAlpha=manifest*solid*.20;ctx.strokeStyle='#62718b';ctx.lineWidth=2.2;ctx.stroke();\n      drawCarapaceSurface(run,manifest,solid);"
replacement="      traceBodyPolygon(run,1.01);ctx.globalAlpha=manifest*solid*.20;ctx.strokeStyle='#62718b';ctx.lineWidth=2.2;ctx.stroke();\n      drawBodySkin(run,manifest,solid);\n      drawCarapaceSurface(run,manifest,solid);"
assert needle in s
s=s.replace(needle,replacement,1)

s=s.replace("renderMode:'canvas-serpent-nonbacktrack-v5'", "renderMode:'canvas-textured-meshrope-v6'")
assert s!=old
assert 'drawBodySkin' in s and 'canvas-textured-meshrope-v6' in s and 'serpent.phaseBase=.72' in s
p.write_text(s)
