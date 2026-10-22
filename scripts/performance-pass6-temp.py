from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected 1 patch target, found {count}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

realm = Path('src/realm-backgrounds.js')
contract = Path('scripts/performance-audit-contract.mjs')

replace_once(
    realm,
    """function drawCachedBackdrop(key,painter){
  const width=Math.max(1,Math.ceil(vw)),height=Math.max(1,Math.ceil(vh)),cacheKey=`${key}:${width}x${height}`;let surface=STATIC_BACKDROP_CACHE.get(cacheKey);
  if(!surface){
    surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):document.createElement('canvas');surface.width=width;surface.height=height;const surfaceCtx=surface.getContext('2d',{alpha:false});painter(surfaceCtx);
    if(STATIC_BACKDROP_CACHE.size>=2)STATIC_BACKDROP_CACHE.delete(STATIC_BACKDROP_CACHE.keys().next().value);STATIC_BACKDROP_CACHE.set(cacheKey,surface);
  }
  ctx.drawImage(surface,0,0,width,height,0,0,vw,vh);
}""",
    """function drawCachedBackdrop(key,painter,payload){
  const width=Math.max(1,Math.ceil(vw)),height=Math.max(1,Math.ceil(vh)),cacheKey=`${key}:${width}x${height}`;let surface=STATIC_BACKDROP_CACHE.get(cacheKey);
  if(!surface){
    surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):document.createElement('canvas');surface.width=width;surface.height=height;const surfaceCtx=surface.getContext('2d',{alpha:false});painter(surfaceCtx,payload);
    if(STATIC_BACKDROP_CACHE.size>=2)STATIC_BACKDROP_CACHE.delete(STATIC_BACKDROP_CACHE.keys().next().value);STATIC_BACKDROP_CACHE.set(cacheKey,surface);
  }
  ctx.drawImage(surface,0,0,width,height,0,0,vw,vh);
}"""
)

replace_once(
    realm,
    """function backgroundSprite(key,width,height,painter){
  const w=Math.max(1,Math.ceil(width)),h=Math.max(1,Math.ceil(height)),cacheKey=`${key}:${w}x${h}`;let surface=BACKGROUND_SPRITE_CACHE.get(cacheKey);if(surface)return surface;
  surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');surface.width=w;surface.height=h;const g=surface.getContext('2d',{alpha:true});g.clearRect(0,0,w,h);painter(g,w,h);
  if(BACKGROUND_SPRITE_CACHE.size>=24)BACKGROUND_SPRITE_CACHE.delete(BACKGROUND_SPRITE_CACHE.keys().next().value);BACKGROUND_SPRITE_CACHE.set(cacheKey,surface);return surface;
}
function drawCachedOverlay(key,painter){
  const width=Math.max(1,Math.ceil(vw)),height=Math.max(1,Math.ceil(vh)),surface=backgroundSprite(`overlay:${key}`,width,height,(g)=>painter(g));ctx.drawImage(surface,0,0,width,height,0,0,vw,vh);
}""",
    """function backgroundSprite(key,width,height,painter,payload){
  const w=Math.max(1,Math.ceil(width)),h=Math.max(1,Math.ceil(height)),cacheKey=`${key}:${w}x${h}`;let surface=BACKGROUND_SPRITE_CACHE.get(cacheKey);if(surface)return surface;
  surface=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w,h):document.createElement('canvas');surface.width=w;surface.height=h;const g=surface.getContext('2d',{alpha:true});g.clearRect(0,0,w,h);painter(g,w,h,payload);
  if(BACKGROUND_SPRITE_CACHE.size>=24)BACKGROUND_SPRITE_CACHE.delete(BACKGROUND_SPRITE_CACHE.keys().next().value);BACKGROUND_SPRITE_CACHE.set(cacheKey,surface);return surface;
}
function drawCachedOverlay(key,painter){
  const width=Math.max(1,Math.ceil(vw)),height=Math.max(1,Math.ceil(vh)),surface=backgroundSprite(`overlay:${key}`,width,height,painter);ctx.drawImage(surface,0,0,width,height,0,0,vw,vh);
}"""
)

palette_marker = "const DEFAULT_STAR_PALETTE=['#f6f8ff','#8fe9ff','#cdbfff'],VOID_STAR_PALETTE=['#c7b3ff','#875ce0','#5a3297'],VOID_GRAVE_STAR_PALETTE=['#d4d5ff','#706da5','#49456f'],VOID_PARADOX_STAR_PALETTE=['#f2d8ff','#8ccfff','#754bb6'],CHRONO_STAR_PALETTE=['#eaffff','#79ffe1','#3c8292'],FORGE_STAR_PALETTE=['#fff2c8','#ffb04e','#aa3b22'],CONSTELLATION_STAR_PALETTE=['#ffffff','#c4d1ff','#7d91df'],STAGE_ROUTE_STAR_PALETTE=['#f8fbff','#9adfff','#9e9fff'],STAGE_BLOOM_STAR_PALETTE=['#fff7ff','#d7a5ff','#8be0c5'],STAGE_ARRAY_STAR_PALETTE=['#efffff','#79e4ee','#d8b36e'];"
paint_helpers = r"""
const EMPTY_DASH=[],SIGN_PAIR=[-1,1],SPACE_LANDMARK_DASH=[8,6],VOID_ORACLE_DASHES=[[20,12],[26,15],[32,18],[38,21]],VOID_BASE_DASHES=[[18,9],[23,12],[28,15],[33,18],[38,21],[43,24]],CHRONO_RING_DASHES=[[24,15],[31,19],[38,23],[45,27]],STAGE_TWO_ARTERY_DASH=[34,24];
function paintSpaceNebulaSprite(g,w,h,index){const palette=SPACE_NEBULA_PALETTES[index]||SPACE_NEBULA_PALETTES[0],c=w/2,grad=g.createRadialGradient(c,c,0,c,c,c);grad.addColorStop(0,palette[0]);grad.addColorStop(1,palette[1]);g.fillStyle=grad;g.fillRect(0,0,w,h);}
function paintSpacePlanetSprite(g,w,h){const c=w/2,grad=g.createRadialGradient(c*.66,c*.65,2,c,c,c);grad.addColorStop(0,'rgba(171,188,255,.18)');grad.addColorStop(.48,'rgba(68,73,145,.10)');grad.addColorStop(1,'rgba(6,8,24,0)');g.fillStyle=grad;g.fillRect(0,0,w,h);}
function paintForgeRaySprite(g,w,h){const grad=g.createLinearGradient(7,0,w,0);grad.addColorStop(0,'rgba(255,225,125,.42)');grad.addColorStop(.3,'rgba(255,94,32,.19)');grad.addColorStop(1,'rgba(255,50,20,0)');g.fillStyle=grad;g.beginPath();g.moveTo(0,2);g.lineTo(w,h/2);g.lineTo(0,h-2);g.closePath();g.fill();}
function paintSpaceBackdrop(surfaceCtx){const base=surfaceCtx.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#02040d');base.addColorStop(.45,'#080c20');base.addColorStop(1,'#01030a');surfaceCtx.fillStyle=base;surfaceCtx.fillRect(0,0,vw,vh);const ambient=surfaceCtx.createRadialGradient(vw*.5,vh*.47,0,vw*.5,vh*.47,Math.max(vw,vh)*.78);ambient.addColorStop(0,'rgba(45,60,145,.25)');ambient.addColorStop(.45,'rgba(19,25,68,.10)');ambient.addColorStop(1,'rgba(0,0,0,0)');surfaceCtx.fillStyle=ambient;surfaceCtx.fillRect(0,0,vw,vh);}
function paintVoidBackdrop(g,center){const base=g.createRadialGradient(vw*.48,vh*.44,20,vw*.48,vh*.44,Math.max(vw,vh)*.78);base.addColorStop(0,center);base.addColorStop(.32,'#0d061e');base.addColorStop(.70,'#03040d');base.addColorStop(1,'#000106');g.fillStyle=base;g.fillRect(0,0,vw,vh);}
function paintChronoBackdrop(g){const base=g.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#020b12');base.addColorStop(.48,'#06262a');base.addColorStop(1,'#010408');g.fillStyle=base;g.fillRect(0,0,vw,vh);}
function paintForgeBackdrop(g){const base=g.createRadialGradient(vw*.5,vh*.44,12,vw*.5,vh*.44,Math.max(vw,vh)*.78);base.addColorStop(0,'#7a2706');base.addColorStop(.18,'#351006');base.addColorStop(.58,'#0b0505');base.addColorStop(1,'#010205');g.fillStyle=base;g.fillRect(0,0,vw,vh);}
function paintConstellationBackdrop(g){const base=g.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#01030a');base.addColorStop(.46,'#08122b');base.addColorStop(1,'#02030c');g.fillStyle=base;g.fillRect(0,0,vw,vh);}
"""
replace_once(realm, palette_marker, palette_marker + paint_helpers)

replace_once(
    realm,
    """function spaceNebulaSprite(index){const palette=SPACE_NEBULA_PALETTES[index]||SPACE_NEBULA_PALETTES[0];return backgroundSprite(`space-nebula:${index}`,256,256,(g,w,h)=>{const c=w/2,grad=g.createRadialGradient(c,c,0,c,c,c);grad.addColorStop(0,palette[0]);grad.addColorStop(1,palette[1]);g.fillStyle=grad;g.fillRect(0,0,w,h);});}
function spacePlanetSprite(){return backgroundSprite('space-planet',256,256,(g,w,h)=>{const c=w/2,grad=g.createRadialGradient(c*.66,c*.65,2,c,c,c);grad.addColorStop(0,'rgba(171,188,255,.18)');grad.addColorStop(.48,'rgba(68,73,145,.10)');grad.addColorStop(1,'rgba(6,8,24,0)');g.fillStyle=grad;g.fillRect(0,0,w,h);});}
function forgeRaySprite(length){const width=Math.max(24,Math.ceil(length-88));return backgroundSprite('forge-ray',width,18,(g,w,h)=>{const grad=g.createLinearGradient(7,0,w,0);grad.addColorStop(0,'rgba(255,225,125,.42)');grad.addColorStop(.3,'rgba(255,94,32,.19)');grad.addColorStop(1,'rgba(255,50,20,0)');g.fillStyle=grad;g.beginPath();g.moveTo(0,2);g.lineTo(w,h/2);g.lineTo(0,h-2);g.closePath();g.fill();});}""",
    """function spaceNebulaSprite(index){return backgroundSprite(`space-nebula:${index}`,256,256,paintSpaceNebulaSprite,index);}
function spacePlanetSprite(){return backgroundSprite('space-planet',256,256,paintSpacePlanetSprite);}
function forgeRaySprite(length){const width=Math.max(24,Math.ceil(length-88));return backgroundSprite('forge-ray',width,18,paintForgeRaySprite);}"""
)

replace_once(
    realm,
    """function drawSpaceBackground(){const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;drawCachedBackdrop('space',surfaceCtx=>{const base=surfaceCtx.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#02040d');base.addColorStop(.45,'#080c20');base.addColorStop(1,'#01030a');surfaceCtx.fillStyle=base;surfaceCtx.fillRect(0,0,vw,vh);const ambient=surfaceCtx.createRadialGradient(vw*.5,vh*.47,0,vw*.5,vh*.47,Math.max(vw,vh)*.78);ambient.addColorStop(0,'rgba(45,60,145,.25)');ambient.addColorStop(.45,'rgba(19,25,68,.10)');ambient.addColorStop(1,'rgba(0,0,0,0)');surfaceCtx.fillStyle=ambient;surfaceCtx.fillRect(0,0,vw,vh);});""",
    """function drawSpaceBackground(){const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;drawCachedBackdrop('space',paintSpaceBackdrop);"""
)

replace_once(realm,"""drawCachedBackdrop('void-'+(form||'base'),g=>{const base=g.createRadialGradient(vw*.48,vh*.44,20,vw*.48,vh*.44,Math.max(vw,vh)*.78);base.addColorStop(0,center);base.addColorStop(.32,'#0d061e');base.addColorStop(.70,'#03040d');base.addColorStop(1,'#000106');g.fillStyle=base;g.fillRect(0,0,vw,vh);});""","""drawCachedBackdrop('void-'+(form||'base'),paintVoidBackdrop,center);""")
replace_once(realm,"""drawCachedBackdrop('apex-chrono',g=>{const base=g.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#020b12');base.addColorStop(.48,'#06262a');base.addColorStop(1,'#010408');g.fillStyle=base;g.fillRect(0,0,vw,vh);});""","""drawCachedBackdrop('apex-chrono',paintChronoBackdrop);""")
replace_once(realm,"""drawCachedBackdrop('apex-forge',g=>{const base=g.createRadialGradient(vw*.5,vh*.44,12,vw*.5,vh*.44,Math.max(vw,vh)*.78);base.addColorStop(0,'#7a2706');base.addColorStop(.18,'#351006');base.addColorStop(.58,'#0b0505');base.addColorStop(1,'#010205');g.fillStyle=base;g.fillRect(0,0,vw,vh);});""","""drawCachedBackdrop('apex-forge',paintForgeBackdrop);""")
replace_once(realm,"""drawCachedBackdrop('apex-constellation',g=>{const base=g.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#01030a');base.addColorStop(.46,'#08122b');base.addColorStop(1,'#02030c');g.fillStyle=base;g.fillRect(0,0,vw,vh);});""","""drawCachedBackdrop('apex-constellation',paintConstellationBackdrop);""")

replacements = {
    "ctx.setLineDash([8,6])": "ctx.setLineDash(SPACE_LANDMARK_DASH)",
    "ctx.setLineDash([20+ring*6,12+ring*3])": "ctx.setLineDash(VOID_ORACLE_DASHES[ring])",
    "ctx.setLineDash([18+ring*5,9+ring*3])": "ctx.setLineDash(VOID_BASE_DASHES[ring])",
    "ctx.setLineDash([24+ring*7,15+ring*4])": "ctx.setLineDash(CHRONO_RING_DASHES[ring])",
    "ctx.setLineDash([34,24])": "ctx.setLineDash(STAGE_TWO_ARTERY_DASH)",
}
for old, new in replacements.items():
    replace_once(realm, old, new)

text = realm.read_text(encoding='utf-8')
ctx_empty_count = text.count("ctx.setLineDash([])")
g_empty_count = text.count("g.setLineDash([])")
if ctx_empty_count < 4 or g_empty_count < 4:
    raise RuntimeError(f'unexpected empty dash counts ctx={ctx_empty_count} g={g_empty_count}')
text = text.replace("ctx.setLineDash([])", "ctx.setLineDash(EMPTY_DASH)")
text = text.replace("g.setLineDash([])", "g.setLineDash(EMPTY_DASH)")
side_count = text.count("for(const side of[-1,1])")
if side_count < 3:
    raise RuntimeError(f'unexpected sign-pair loop count {side_count}')
text = text.replace("for(const side of[-1,1])", "for(const side of SIGN_PAIR)")
realm.write_text(text, encoding='utf-8')

stage2_palette_marker = """const STAGE_TWO_NEBULA_PALETTES=[
  ['rgba(75,219,255,.30)','rgba(58,126,255,.12)','rgba(12,25,74,0)'],
  ['rgba(255,101,205,.26)','rgba(155,76,220,.13)','rgba(45,12,76,0)'],
  ['rgba(139,112,255,.25)','rgba(70,191,255,.12)','rgba(15,22,75,0)'],
  ['rgba(227,108,255,.20)','rgba(80,232,233,.12)','rgba(27,16,78,0)']
];"""
stage2_helpers = r"""
const STAGE_TWO_FOREGROUND_CLOUDS=[{x:-210,y:-75,i:1,s:2.1},{x:370,y:245,i:2,s:1.9}];
function paintStageTwoNebulaSprite(g,w,h,index){
  const palette=STAGE_TWO_NEBULA_PALETTES[index%STAGE_TWO_NEBULA_PALETTES.length],cx=w*.48,cy=h*.51,outer=w*.48,grad=g.createRadialGradient(cx-w*.08,cy-h*.06,3,cx,cy,outer);
  grad.addColorStop(0,palette[0]);grad.addColorStop(.38,palette[1]);grad.addColorStop(1,palette[2]);g.fillStyle=grad;g.fillRect(0,0,w,h);
  g.globalCompositeOperation='lighter';g.globalAlpha=.16;g.strokeStyle=index%2?'rgba(255,190,239,.52)':'rgba(157,243,255,.52)';g.lineWidth=9;
  for(let i=0;i<3;i++){g.beginPath();g.moveTo(w*.18,h*(.28+i*.19));g.bezierCurveTo(w*.38,h*(.12+i*.24),w*.62,h*(.68-i*.10),w*.84,h*(.34+i*.13));g.stroke();}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
}
"""
replace_once(realm, stage2_palette_marker, stage2_palette_marker + stage2_helpers)

replace_once(
    realm,
    """function stageTwoNebulaSprite(index){
  const palette=STAGE_TWO_NEBULA_PALETTES[index%STAGE_TWO_NEBULA_PALETTES.length];
  return backgroundSprite('stage02-nebula:'+index,384,384,(g,w,h)=>{
    const cx=w*.48,cy=h*.51,outer=w*.48,grad=g.createRadialGradient(cx-w*.08,cy-h*.06,3,cx,cy,outer);
    grad.addColorStop(0,palette[0]);grad.addColorStop(.38,palette[1]);grad.addColorStop(1,palette[2]);g.fillStyle=grad;g.fillRect(0,0,w,h);
    g.globalCompositeOperation='lighter';g.globalAlpha=.16;g.strokeStyle=index%2?'rgba(255,190,239,.52)':'rgba(157,243,255,.52)';g.lineWidth=9;
    for(let i=0;i<3;i++){g.beginPath();g.moveTo(w*.18,h*(.28+i*.19));g.bezierCurveTo(w*.38,h*(.12+i*.24),w*.62,h*(.68-i*.10),w*.84,h*(.34+i*.13));g.stroke();}
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
  });
}""",
    """function stageTwoNebulaSprite(index){
  return backgroundSprite('stage02-nebula:'+index,384,384,paintStageTwoNebulaSprite,index);
}"""
)
replace_once(realm,"""ctx.save();ctx.globalCompositeOperation='lighter';for(const cloud of[{x:-210,y:-75,i:1,s:2.1},{x:370,y:245,i:2,s:1.9}]){""","""ctx.save();ctx.globalCompositeOperation='lighter';for(const cloud of STAGE_TWO_FOREGROUND_CLOUDS){""")

text = contract.read_text(encoding='utf-8')
marker = " ['offscreen beams shockwaves text and allied particles are culled before Canvas draw work',entities.includes('beamMargin=Math.max(80')&&entities.includes('Math.max(a.x,b.x)<-beamMargin')&&entities.includes('sx+r<-24')&&entities.includes('sx<-140||sx>vw+140')&&entities.includes('sx<-24-size||sx>vw+24+size')]\n"
if text.count(marker) != 1:
    raise RuntimeError('performance contract insertion marker not unique')
additions = """ ['cached background hot paths reuse static painters instead of allocating frame closures',realm.includes('function drawCachedBackdrop(key,painter,payload)')&&realm.includes('function backgroundSprite(key,width,height,painter,payload)')&&realm.includes(\"drawCachedBackdrop('space',paintSpaceBackdrop)\")&&realm.includes(\"drawCachedBackdrop('void-'+(form||'base'),paintVoidBackdrop,center)\")&&realm.includes(\"drawCachedBackdrop('apex-chrono',paintChronoBackdrop)\")&&realm.includes(\"backgroundSprite(`space-nebula:${index}`,256,256,paintSpaceNebulaSprite,index)\")&&!realm.includes(\"drawCachedBackdrop('space',surfaceCtx=>\")&&!realm.includes(\"backgroundSprite(`space-nebula:${index}`,256,256,(g,w,h)=>\")],
 ['render dash and small traversal collections reuse stable constants',realm.includes('const EMPTY_DASH=[],SIGN_PAIR=[-1,1],SPACE_LANDMARK_DASH=[8,6]')&&realm.includes('VOID_ORACLE_DASHES[ring]')&&realm.includes('VOID_BASE_DASHES[ring]')&&realm.includes('CHRONO_RING_DASHES[ring]')&&realm.includes('ctx.setLineDash(EMPTY_DASH)')&&!realm.includes('ctx.setLineDash([])')&&!realm.includes('for(const side of[-1,1])')],
 ['stage two cached nebula path avoids per-frame sprite painter and foreground cloud allocation',realm.includes('const STAGE_TWO_FOREGROUND_CLOUDS=')&&realm.includes('for(const cloud of STAGE_TWO_FOREGROUND_CLOUDS)')&&realm.includes(\"backgroundSprite('stage02-nebula:'+index,384,384,paintStageTwoNebulaSprite,index)\")&&!realm.includes(\"for(const cloud of[{x:-210,y:-75,i:1,s:2.1},{x:370,y:245,i:2,s:1.9}])\")],
"""
contract.write_text(text.replace(marker, additions + marker, 1), encoding='utf-8')

print('performance pass 6 patch applied')
