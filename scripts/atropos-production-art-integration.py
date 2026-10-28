from pathlib import Path
import re


def replace_once(text, old, new, label):
    if text.count(old) != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, got {text.count(old)}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label, flags=0):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, got {n}')
    return out

# Loader: production art data must exist before the runtime prototype creates its atlas image.
p = Path('src/atropos-visual-v5.js')
s = p.read_text()
s = replace_once(
    s,
    "  document.body.appendChild(script);\n})();",
    "  const artData=document.createElement('script');\n  artData.src='src/atropos-production-art-data.js';\n  artData.dataset.atroposProductionArt='raster-v1';\n  artData.addEventListener('load',()=>document.body.appendChild(script),{once:true});\n  artData.addEventListener('error',()=>{window.stackfallAtroposPrototypeAttackState='production-art-load-failed';},{once:true});\n  document.body.appendChild(artData);\n})();",
    'production art loader gate'
)
p.write_text(s)

# Core renderer: replace hand-authored SVG sprites with the approved raster atlas.
p = Path('src/atropos-world-devourer-prototype.js')
s = p.read_text()
s = replace_once(s, "const VERSION='atropos-world-devourer-colossal-pass-v5';", "const VERSION='atropos-world-devourer-production-raster-v1';", 'visual version')
old_art = """  const art={head:new Image(),body:[new Image(),new Image(),new Image()],tail:new Image()};
  art.head.decoding=art.tail.decoding='async';for(const img of art.body)img.decoding='async';
  art.head.src='assets/atropos-head.svg';
  art.body[0].src='assets/atropos-segment.svg';art.body[1].src='assets/atropos-segment-b.svg';art.body[2].src='assets/atropos-segment-c.svg';
  art.tail.src='assets/atropos-tail.svg';
"""
new_art = """  const production=window.stackfallAtroposProductionArt;
  if(!production?.src)throw new Error('Atropos production raster atlas missing');
  const atlas=new Image();atlas.decoding='async';atlas.src=production.src;
  const ART_FRAMES={
    headClosed:{x:16,y:16,w:408,h:300},
    headOpen:{x:440,y:16,w:375,h:315},
    neckA:{x:831,y:16,w:339,h:270},
    neckB:{x:1186,y:16,w:339,h:276},
    bodyA:{x:1541,y:16,w:402,h:291},
    bodyB:{x:16,y:347,w:363,h:285},
    bodyC:{x:395,y:347,w:372,h:297},
    bodyD:{x:783,y:347,w:393,h:273},
    rear:{x:1192,y:347,w:390,h:234},
    tail:{x:16,y:660,w:531,h:318}
  };
  production.frames=ART_FRAMES;production.image=atlas;
  production.drawScreen=function drawAtroposProductionFrame(key,x,y,a,w,h,alpha=1,options={}){
    const frame=ART_FRAMES[key];if(!frame||!atlas.complete||atlas.naturalWidth<2||alpha<=.005)return false;
    const flip=options.flip===true,scaleX=Number.isFinite(options.scaleX)?options.scaleX:1,scaleY=Number.isFinite(options.scaleY)?options.scaleY:1;
    ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.scale(scaleX,scaleY);if(flip)ctx.scale(1,-1);
    if(options.composite)ctx.globalCompositeOperation=options.composite;if(options.filter)ctx.filter=options.filter;
    ctx.globalAlpha=alpha;ctx.drawImage(atlas,frame.x,frame.y,frame.w,frame.h,-w*.5,-h*.5,w,h);ctx.restore();return true;
  };
"""
s = replace_once(s, old_art, new_art, 'svg art initialization')

new_draw = r'''  function drawSprite(frameKey,p,w,h,alpha=1,glow=0,flip=false,scaleX=1,scaleY=1){
    if(!atlas.complete||atlas.naturalWidth<2||alpha<=.005)return;
    const depthScale=lerp(.88,1.12,(p.depth+1)*.5),W=w*depthScale,H=h*depthScale;
    if(glow>0)production.drawScreen(frameKey,p.sx,p.sy,p.a,W,H,alpha*glow,{flip,scaleX,scaleY,composite:'screen'});
    production.drawScreen(frameKey,p.sx,p.sy,p.a,W,H,alpha,{flip,scaleX,scaleY});
  }
  function productionPlateKey(i,total){
    if(i===1)return'neckA';if(i===2)return'neckB';if(i>=total-3)return'rear';
    return['bodyA','bodyB','bodyC','bodyD'][Math.abs(i-3)%4];
  }
  function drawSerpentLayer(manifest,layer){
    if(manifest<=.001)return;
    const e=serpentEnemy();if(!e)return;
    const serpent=ensureSerpent(e);if(!serpent?.points?.length)return;
    const pts=serpent.points;drawSpine(pts,manifest,layer);
    for(let i=pts.length-1;i>=0;i--){
      const p=pts[i],weight=layerWeights(p.depth)[layer];if(weight<=.01)continue;
      const foregroundFade=layer==='front'?.88:1,alpha=manifest*weight*foregroundFade;
      if(i===0){const jaw=window.stackfallAtroposMawJawScale,scaleX=Number(jaw?.x)||1,scaleY=Number(jaw?.y)||1,open=!!jaw;drawSprite(open?'headOpen':'headClosed',p,510*p.scaleUnit,278*p.scaleUnit,.99*alpha,.055,false,scaleX,scaleY);continue;}
      if(i===pts.length-1){drawSprite('tail',p,370*p.taper*p.scaleUnit,188*p.taper*p.scaleUnit,.94*alpha,.018);continue;}
      const plateSlot=i<=2||i>=pts.length-3||i%3===1;if(!plateSlot)continue;
      const key=productionPlateKey(i,pts.length),neck=i<=2,nearTail=i>=pts.length-3;
      const W=(neck?270:nearTail?245:255)*p.taper*p.scaleUnit,H=(neck?188:nearTail?142:166)*p.taper*p.scaleUnit;
      drawSprite(key,p,W,H,.88*alpha,layer==='front'?.018:.008,i%7===3);
    }
  }
'''
s = sub_once(s, r"  function drawSprite\(img,p,w,h,alpha=1,glow=0,flip=false,scaleX=1,scaleY=1\)\{.*?\n  \}\n  function drawSerpentLayer\(manifest,layer\)\{.*?\n  \}\n", new_draw, 'production sprite renderer', re.S)

s = sub_once(
    s,
    r"assets:\{head:art\.head\.complete&&art\.head\.naturalWidth>1,body:art\.body\.every\(img=>img\.complete&&img\.naturalWidth>1\),bodyVariants:art\.body\.map\(img=>img\.complete&&img\.naturalWidth>1\),tail:art\.tail\.complete&&art\.tail\.naturalWidth>1\}",
    "assets:{head:atlas.complete&&atlas.naturalWidth>1,body:atlas.complete&&atlas.naturalWidth>1,bodyVariants:['neckA','neckB','bodyA','bodyB','bodyC','bodyD','rear'].map(()=>atlas.complete&&atlas.naturalWidth>1),tail:atlas.complete&&atlas.naturalWidth>1,atlas:atlas.complete&&atlas.naturalWidth>1,production:true,source:production.version}",
    'production art diagnostics'
)
p.write_text(s)

# Past Trajectory: use the same atlas instead of separate SVG images.
p = Path('src/atropos-world-devourer-attack-past.js')
s = p.read_text()
s = sub_once(s, r"  const ghostArt=\{head:new Image\(\),body:\[new Image\(\),new Image\(\),new Image\(\)\],tail:new Image\(\)\};\n  for\(const img of \[ghostArt\.head,\.\.\.ghostArt\.body,ghostArt\.tail\]\)img\.decoding='async';\n  ghostArt\.head\.src='assets/atropos-head\.svg';\n  ghostArt\.body\[0\]\.src='assets/atropos-segment\.svg';\n  ghostArt\.body\[1\]\.src='assets/atropos-segment-b\.svg';\n  ghostArt\.body\[2\]\.src='assets/atropos-segment-c\.svg';\n  ghostArt\.tail\.src='assets/atropos-tail\.svg';\n", "  const productionArt=()=>window.stackfallAtroposProductionArt;\n", 'past svg assets', re.S)
new_ghost_sprite = r'''  function drawGhostSprite(frameKey,v,w,h,alpha,flip=false){
    const art=productionArt();if(!art?.drawScreen||alpha<=.005)return;
    art.drawScreen(frameKey,v.x,v.y,v.a,w,h,alpha,{flip,composite:'screen',filter:'grayscale(1) brightness(1.85) sepia(.08) hue-rotate(145deg) saturate(.55)'});
  }
'''
s = sub_once(s, r"  function drawGhostSprite\(img,v,w,h,alpha,flip=false\)\{.*?\n  \}\n", new_ghost_sprite, 'past atlas sprite', re.S)
s = s.replace("drawGhostSprite(ghostArt.head,v,440*sc,215*sc,alpha)", "drawGhostSprite('headClosed',v,455*sc,230*sc,alpha)")
s = s.replace("drawGhostSprite(ghostArt.tail,v,280*sc,96*sc,alpha*.90)", "drawGhostSprite('tail',v,310*sc,145*sc,alpha*.90)")
s = s.replace("drawGhostSprite(ghostArt.body[i%ghostArt.body.length],v,255*sc,108*sc,alpha*.92,i%5===3);", "drawGhostSprite(['bodyA','bodyB','bodyC','bodyD'][i%4],v,270*sc,148*sc,alpha*.92,i%5===3);")
if 'ghostArt.' in s or 'atropos-head.svg' in s or 'atropos-segment' in s:
    raise SystemExit('past trajectory still references legacy SVG art')
p.write_text(s)

# World Devour: giant bite head also comes from the approved open-maw atlas frame.
p = Path('src/atropos-world-devourer-attack-world.js')
s = p.read_text()
s = replace_once(s, "  const headArt=new Image();headArt.decoding='async';headArt.src='assets/atropos-head.svg';\n", "  const productionArt=()=>window.stackfallAtroposProductionArt;\n", 'world svg head')
new_world_head = r'''  function drawGiantHead(a,q){
    const art=productionArt();if(!art?.drawScreen)return;const enter=q<.48?ease(q/.48):q<.80?1:1-smooth((q-.80)/.20),x=lerp(a.headOutside.x,a.biteCenter.x,enter),y=lerp(a.headOutside.y,a.biteCenter.y,enter),p=worldToScreen(x,y),baseW=clamp(Math.min(vw,vh)*1.10,880,1240),baseH=baseW*.54,snap=Math.max(0,1-Math.abs(q-.62)/.16),sy=1-.28*snap;
    art.drawScreen('headOpen',p.x,p.y,a.rot,baseW,baseH,.98,{flip:a.flip,scaleY:sy});if(snap>.04)strokeBoundary(a,'#e5fbff',.78*snap,8);
  }
'''
s = sub_once(s, r"  function drawGiantHead\(a,q\)\{.*?\n  \}\n", new_world_head, 'world atlas head', re.S)
if 'headArt' in s or 'atropos-head.svg' in s:
    raise SystemExit('world devour still references legacy SVG head')
p.write_text(s)

# The audit now rejects any regression back to the hand-authored SVG runtime assets.
p = Path('scripts/atropos-code-audit.mjs')
s = p.read_text()
needle = "requireCheck(!maw.includes('baseDrawImage')&&maw.includes('updateJawScale'),'Void Maw still uses the global image interception path');\n"
insert = needle + "requireCheck(loader.includes('atropos-production-art-data.js'),'Production raster atlas is not loaded before the World Devourer runtime');\nrequireCheck(!/assets\\/atropos-(?:head|body|segment|tail)[^'\\\"]*\\.svg/.test(all),'World Devourer runtime still references legacy SVG art assets');\nrequireCheck(proto.includes('atropos-world-devourer-production-raster-v1')&&proto.includes('ART_FRAMES'),'Production raster atlas renderer is not active');\n"
s = replace_once(s, needle, insert, 'production audit assertions')
s = replace_once(s, "canvas:{globalDrawImageOverride:false},status:", "canvas:{globalDrawImageOverride:false},art:{productionRaster:true,legacySvgRuntimeReferences:false},status:", 'production audit report')
p.write_text(s)

# Runtime visual audit must explicitly prove the production atlas loaded.
p = Path('scripts/atropos-visual-audit.mjs')
s = p.read_text()
s = replace_once(s, "  await waitFor(`(()=>{const a=window.stackfallAtroposArtDiagnostics?.().assets;return !!(a?.head&&a?.body&&a?.tail);})()`,15000);", "  await waitFor(`(()=>{const d=window.stackfallAtroposArtDiagnostics?.(),a=d?.assets;return !!(a?.head&&a?.body&&a?.tail&&a?.atlas&&a?.production&&a?.source==='atropos-production-raster-v1');})()`,15000);", 'visual audit production wait')
p.write_text(s)
