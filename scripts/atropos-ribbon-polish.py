from pathlib import Path
import re

p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text()
old=s

# Build a stylized head cache from the approved raster so the focal art matches the flatter game rendering.
needle="""  production.frames=ART_FRAMES;production.image=atlas;\n  production.drawScreen=function drawAtroposProductionFrame"""
insert="""  production.frames=ART_FRAMES;production.image=atlas;\n  const processedHeads={};\n  function prepareProcessedHead(key){\n    const f=ART_FRAMES[key];if(!f||!atlas.complete||atlas.naturalWidth<2)return;\n    try{\n      const c=document.createElement('canvas');c.width=f.w;c.height=f.h;const g=c.getContext('2d',{willReadFrequently:true});\n      g.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w,f.h);const img=g.getImageData(0,0,f.w,f.h),d=img.data;\n      for(let i=0;i<d.length;i+=4){\n        if(d[i+3]<8)continue;const r0=d[i],g0=d[i+1],b0=d[i+2],l=.299*r0+.587*g0+.114*b0,crack=clamp((b0-r0-18)/125,0,1);\n        let r=l+(r0-l)*.46,gc=l+(g0-l)*.46,b=l+(b0-l)*.52;\n        r=r*.66+7+crack*12;gc=gc*.69+9+crack*22;b=b*.76+16+crack*40;\n        const q=18;d[i]=clamp(Math.round(r/q)*q,0,255);d[i+1]=clamp(Math.round(gc/q)*q,0,255);d[i+2]=clamp(Math.round(b/q)*q,0,255);\n      }\n      g.putImageData(img,0,0);processedHeads[key]=c;\n    }catch{}\n  }\n  function prepareProcessedHeads(){prepareProcessedHead('headClosed');prepareProcessedHead('headOpen');}\n  if(atlas.complete&&atlas.naturalWidth>1)prepareProcessedHeads();else atlas.addEventListener('load',prepareProcessedHeads,{once:true});\n  production.drawScreen=function drawAtroposProductionFrame"""
assert needle in s, 'atlas hook not found'
s=s.replace(needle,insert,1)

# Use the continuously evaluated head every frame while keeping the compact distance history for long-body coverage.
s=s.replace("    const p=headWorldPosition(e,serpent,serpent.motionTime),last=serpent.last;", "    const p=headWorldPosition(e,serpent,serpent.motionTime),last=serpent.last;serpent.liveHead=p;",1)

build=r'''  function buildSerpentPose(e){
    const serpent=ensureSerpent(e);if(!serpent)return null;
    advanceSerpent(e,serpent);
    PERF.poseBuilds++;PERF.maxHistoryLength=Math.max(PERF.maxHistoryLength,serpent.history.length);
    const scaleUnit=motionScale(),points=[],distances=[];
    for(let i=0;i<PART_KEYS.length;i++){const tailT=i/(PART_KEYS.length-1);distances.push(i*SAMPLE_SPACING*scaleUnit*(1+tailT*.025));}
    const history=serpent.history,live=serpent.liveHead,stored=history[history.length-1],useLive=!!(live&&stored&&Math.hypot(live.x-stored.x,live.y-stored.y)>.001);
    if(useLive)history.push(live);
    const samples=sampleHistoryDistances(history,distances);
    const taperAt=t=>t<.16?lerp(1.28,1.20,t/.16):t<.68?lerp(1.20,.92,(t-.16)/.52):lerp(.92,.18,(t-.68)/.32);
    const totalDistance=distances[distances.length-1],renderDistances=[];
    for(let d=0;d<totalDistance;d+=RENDER_SPACING*scaleUnit)renderDistances.push(d);
    renderDistances.push(totalDistance);
    const renderSamples=sampleHistoryDistances(history,renderDistances),renderPoints=[];
    if(useLive)history.pop();
    for(let i=0;i<PART_KEYS.length;i++){
      const tailT=i/(PART_KEYS.length-1),q=samples[i],screen=worldToScreen(q.x,q.y),depth=Math.sin((q.orbitA||0)+.35);
      points.push({...q,sx:screen.x,sy:screen.y,key:PART_KEYS[i],index:i,tailT,depth,taper:taperAt(tailT),scaleUnit});
    }
    for(let i=0;i<renderSamples.length;i++){
      const tailT=i/Math.max(1,renderSamples.length-1),q=renderSamples[i],screen=worldToScreen(q.x,q.y),depth=Math.sin((q.orbitA||0)+.35);
      renderPoints.push({...q,sx:screen.x,sy:screen.y,index:i,tailT,depth,taper:taperAt(tailT),scaleUnit});
    }
    for(let i=0;i<renderPoints.length;i++){
      const a=renderPoints[Math.max(0,i-2)],b=renderPoints[Math.min(renderPoints.length-1,i+2)];
      renderPoints[i].a=Math.atan2(b.sy-a.sy,b.sx-a.sx);
    }
    serpent.points=points;serpent.renderPoints=renderPoints;
    e.x=serpent.anchorX;e.y=serpent.anchorY;
    for(let i=0;i<points.length;i++){
      const part=e.bodyParts?.[i];if(!part)continue;
      const q=points[i];part.dx=q.x-e.x;part.dy=q.y-e.y;
      part.r=(i===0?104:i===points.length-1?34:78)*q.taper*q.scaleUnit;
      part.active=true;part.visible=true;part.dead=false;
    }
    if(typeof refreshBossBodyParts==='function')refreshBossBodyParts(e);
    return serpent;
  }
'''
s,n=re.subn(r'  function buildSerpentPose\(e\)\{.*?\n  \}\n\n  function layerWeights', build+'\n  function layerWeights', s, count=1, flags=re.S)
assert n==1, 'buildSerpentPose replacement failed'

# Surface detail follows the ribbon itself: contiguous seams and a longitudinal ridge, never detached body sprites.
needle="""  function drawSpine(points,manifest,layer){\n"""
surface=r'''  function drawCarapaceSurface(run,manifest,solid){
    if(run.length<5)return;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    ctx.beginPath();for(let k=0;k<run.length;k++){const p=run[k].p;if(k===0)ctx.moveTo(p.sx,p.sy);else ctx.lineTo(p.sx,p.sy);}
    ctx.globalAlpha=manifest*solid*.18;ctx.strokeStyle='#53627f';ctx.lineWidth=9;ctx.stroke();
    ctx.globalAlpha=manifest*solid*.28;ctx.strokeStyle='#10182c';ctx.lineWidth=4;ctx.stroke();
    const step=Math.max(6,Math.floor(run.length/7));
    for(let k=step;k<run.length-step;k+=step){
      const {p,i,weight}=run[k],flip=((Math.floor((p.tailT||0)*100))&1)?1:-1,half=bodyHalfWidth(p,i,1)*.78,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),diag=18*p.scaleUnit*flip;
      const ax=p.sx+nx*half-tx*diag,ay=p.sy+ny*half-ty*diag,bx=p.sx-nx*half+tx*diag,by=p.sy-ny*half+ty*diag;
      ctx.globalAlpha=manifest*weight*.34;ctx.strokeStyle='#030610';ctx.lineWidth=Math.max(5,7*p.scaleUnit);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
      ctx.globalAlpha=manifest*weight*.22;ctx.strokeStyle='#60708f';ctx.lineWidth=Math.max(1,1.6*p.scaleUnit);ctx.beginPath();ctx.moveTo(ax+tx*2,ay+ty*2);ctx.lineTo(bx+tx*2,by+ty*2);ctx.stroke();
    }
    ctx.restore();
  }
  function drawSpine(points,manifest,layer){
'''
assert needle in s, 'drawSpine hook missing'
s=s.replace(needle,surface,1)

needle="""      traceBodyPolygon(run,1.01);ctx.globalAlpha=manifest*solid*.26;ctx.strokeStyle='#70819f';ctx.lineWidth=3;ctx.stroke();\n    }\n"""
replace="""      traceBodyPolygon(run,1.01);ctx.globalAlpha=manifest*solid*.26;ctx.strokeStyle='#70819f';ctx.lineWidth=3;ctx.stroke();\n      drawCarapaceSurface(run,manifest,solid);\n    }\n"""
assert needle in s, 'carapace call hook missing'
s=s.replace(needle,replace,1)

# Draw the head from the processed cache when ready; fall back to the atlas during first-frame loading.
draw=r'''  function drawSprite(frameKey,p,w,h,alpha=1,glow=0,flip=false,scaleX=1,scaleY=1){
    if(!atlas.complete||atlas.naturalWidth<2||alpha<=.005)return;
    const depthScale=lerp(.88,1.12,(p.depth+1)*.5),W=w*depthScale,H=h*depthScale,processed=processedHeads[frameKey];
    if(processed){
      ctx.save();ctx.translate(p.sx,p.sy);ctx.rotate(p.a||0);ctx.scale(scaleX,scaleY);if(flip)ctx.scale(1,-1);ctx.imageSmoothingEnabled=true;
      if(glow>0){ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha*glow;ctx.filter='blur(.7px)';ctx.drawImage(processed,-W*.5,-H*.5,W,H);}
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=alpha;ctx.filter='contrast(.96) saturate(.84)';ctx.drawImage(processed,-W*.5,-H*.5,W,H);ctx.restore();return;
    }
    if(glow>0)production.drawScreen(frameKey,p.sx,p.sy,p.a,W,H,alpha*glow,{flip,scaleX,scaleY,composite:'screen',filter:'saturate(.62) contrast(.90) brightness(.74)'});
    production.drawScreen(frameKey,p.sx,p.sy,p.a,W,H,alpha,{flip,scaleX,scaleY,filter:'saturate(.62) contrast(.90) brightness(.74)'});
  }
'''
s,n=re.subn(r'  function drawSprite\(frameKey,p,w,h,alpha=1,glow=0,flip=false,scaleX=1,scaleY=1\)\{.*?\n  \}\n  function drawSerpentLayer', draw+'  function drawSerpentLayer', s, count=1, flags=re.S)
assert n==1, 'drawSprite replacement failed'

s=s.replace("renderMode:'canvas-ribbon-resample-v2'", "renderMode:'canvas-ribbon-resample-v3-livehead-carapace'")
assert s!=old
assert 'serpent.liveHead=p' in s
assert 'drawCarapaceSurface' in s
assert 'processedHeads' in s
p.write_text(s)
