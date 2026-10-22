from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected 1 patch target, found {count}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

realm = 'src/realm-backgrounds.js'
entities = 'src/render-entities.js'
contract = 'scripts/performance-audit-contract.mjs'

replace_once(
    realm,
    "const SPACE_NEBULA_PALETTES=[['rgba(63,77,202,.14)','rgba(31,20,93,0)'],['rgba(183,54,184,.10)','rgba(72,16,91,0)'],['rgba(20,143,174,.11)','rgba(6,44,73,0)'],['rgba(87,49,162,.10)','rgba(24,11,70,0)']];",
    "const SPACE_NEBULA_PALETTES=[['rgba(63,77,202,.14)','rgba(31,20,93,0)'],['rgba(183,54,184,.10)','rgba(72,16,91,0)'],['rgba(20,143,174,.11)','rgba(6,44,73,0)'],['rgba(87,49,162,.10)','rgba(24,11,70,0)']];\nconst DEFAULT_STAR_PALETTE=['#f6f8ff','#8fe9ff','#cdbfff'],VOID_STAR_PALETTE=['#c7b3ff','#875ce0','#5a3297'],VOID_GRAVE_STAR_PALETTE=['#d4d5ff','#706da5','#49456f'],VOID_PARADOX_STAR_PALETTE=['#f2d8ff','#8ccfff','#754bb6'],CHRONO_STAR_PALETTE=['#eaffff','#79ffe1','#3c8292'],FORGE_STAR_PALETTE=['#fff2c8','#ffb04e','#aa3b22'],CONSTELLATION_STAR_PALETTE=['#ffffff','#c4d1ff','#7d91df'],STAGE_ROUTE_STAR_PALETTE=['#f8fbff','#9adfff','#9e9fff'],STAGE_BLOOM_STAR_PALETTE=['#fff7ff','#d7a5ff','#8be0c5'],STAGE_ARRAY_STAR_PALETTE=['#efffff','#79e4ee','#d8b36e'];"
)

replace_once(
    realm,
    "function drawStars(palette=['#f6f8ff','#8fe9ff','#cdbfff'],density=1){\n  const now=performance.now(),tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,tierStride=tier===2?3:tier===1?2:1,densityStride=Math.max(1,Math.round(1/Math.max(.08,density))),stride=Math.max(tierStride,densityStride),colors=Array.isArray(palette)?palette:['#f6f8ff','#8fe9ff','#cdbfff'],key=`${colors.slice(0,3).join('|')}|${stride}`;",
    "function drawStars(palette=DEFAULT_STAR_PALETTE,density=1){\n  const now=performance.now(),tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,tierStride=tier===2?3:tier===1?2:1,densityStride=Math.max(1,Math.round(1/Math.max(.08,density))),stride=Math.max(tierStride,densityStride),colors=Array.isArray(palette)?palette:DEFAULT_STAR_PALETTE,key=`${colors[0]}|${colors[1]}|${colors[2]}|${stride}`;"
)

replacements = {
    "drawStars(form==='grave'?['#d4d5ff','#706da5','#49456f']:form==='paradox'?['#f2d8ff','#8ccfff','#754bb6']:['#c7b3ff','#875ce0','#5a3297'],.82)": "drawStars(form==='grave'?VOID_GRAVE_STAR_PALETTE:form==='paradox'?VOID_PARADOX_STAR_PALETTE:VOID_STAR_PALETTE,.82)",
    "drawStars(['#eaffff','#79ffe1','#3c8292'],.72)": "drawStars(CHRONO_STAR_PALETTE,.72)",
    "drawStars(['#fff2c8','#ffb04e','#aa3b22'],.55)": "drawStars(FORGE_STAR_PALETTE,.55)",
    "drawStars(['#ffffff','#c4d1ff','#7d91df'],1)": "drawStars(CONSTELLATION_STAR_PALETTE,1)",
    "drawStars(['#f8fbff','#9adfff','#9e9fff'],.58)": "drawStars(STAGE_ROUTE_STAR_PALETTE,.58)",
    "drawStars(['#fff7ff','#d7a5ff','#8be0c5'],.50)": "drawStars(STAGE_BLOOM_STAR_PALETTE,.50)",
    "drawStars(['#efffff','#79e4ee','#d8b36e'],.46)": "drawStars(STAGE_ARRAY_STAR_PALETTE,.46)",
}
for old, new in replacements.items():
    replace_once(realm, old, new)

replace_once(
    realm,
    "  ctx.save();ctx.lineCap='round';\n  const vx=player.moveVX||0,vy=player.moveVY||0,d=move||1,nx=vx/d,ny=vy/d;",
    "  ctx.save();ctx.lineCap='round';\n  const vx=player.moveVX||0,vy=player.moveVY||0,d=move||1,nx=vx/d,ny=vy/d,special=stageOne||stageTwo,alphaBase=stageOne?.42:stageTwo?.30:.72,alphaMotion=stageOne?.38:stageTwo?.28:.65,strokeAlpha=stageOne?.20+moving*.12:stageTwo?.16+moving*.10:.28+moving*.22;\n  ctx.strokeStyle=`rgba(${palette},${strokeAlpha})`;"
)
replace_once(
    realm,
    "    const special=stageOne||stageTwo;ctx.globalAlpha=m.a*(stageOne?.42:stageTwo?.30:.72)*(1+moving*(stageOne?.38:stageTwo?.28:.65));ctx.strokeStyle=`rgba(${palette},${stageOne?.20+moving*.12:stageTwo?.16+moving*.10:.28+moving*.22})`;ctx.lineWidth=special?(m.layer?.9:.6):(m.layer?1.15:.75);",
    "    ctx.globalAlpha=m.a*alphaBase*(1+moving*alphaMotion);ctx.lineWidth=special?(m.layer?.9:.6):(m.layer?1.15:.75);"
)
replace_once(
    realm,
    "now=performance.now()*.001;ctx.save();ctx.lineCap='round';for(let i=0;i<count;i++)",
    "now=performance.now()*.001,strokeStyle=`rgba(${color},${.34+.28*intensity})`;ctx.save();ctx.lineCap='round';ctx.strokeStyle=strokeStyle;for(let i=0;i<count;i++)"
)
replace_once(
    realm,
    "ctx.globalAlpha=(.05+(i%4)*.022)*intensity;ctx.strokeStyle=`rgba(${color},${.34+.28*intensity})`;ctx.lineWidth=.7+(i%3)*.35;",
    "ctx.globalAlpha=(.05+(i%4)*.022)*intensity;ctx.lineWidth=.7+(i%3)*.35;"
)

replace_once(
    entities,
    "const RENDER_SCREEN_A={x:0,y:0},RENDER_SCREEN_B={x:0,y:0};",
    "const RENDER_SCREEN_A={x:0,y:0},RENDER_SCREEN_B={x:0,y:0};\nconst EFFECT_TEXT_FONT_CACHE=new Map();\nfunction effectTextFont(size){let font=EFFECT_TEXT_FONT_CACHE.get(size);if(font)return font;font=`800 ${size}px IBM Plex Sans KR`;if(EFFECT_TEXT_FONT_CACHE.size>=24)EFFECT_TEXT_FONT_CACHE.delete(EFFECT_TEXT_FONT_CACHE.keys().next().value);EFFECT_TEXT_FONT_CACHE.set(size,font);return font;}"
)
replace_once(
    entities,
    "ctx.font=`800 ${t.size}px IBM Plex Sans KR`;ctx.fillText(t.text,sx,sy);",
    "ctx.font=effectTextFont(t.size);ctx.fillText(t.text,sx,sy);"
)

p = Path(contract)
text = p.read_text(encoding='utf-8')
marker = " ['offscreen beams shockwaves text and allied particles are culled before Canvas draw work',entities.includes('beamMargin=Math.max(80')&&entities.includes('Math.max(a.x,b.x)<-beamMargin')&&entities.includes('sx+r<-24')&&entities.includes('sx<-140||sx>vw+140')&&entities.includes('sx<-24-size||sx>vw+24+size')]\n"
if text.count(marker) != 1:
    raise RuntimeError('performance contract insertion marker not unique')
additions = """ ['star rendering reuses stable palette arrays and avoids per-frame palette slice allocation',realm.includes("const DEFAULT_STAR_PALETTE=['#f6f8ff','#8fe9ff','#cdbfff']")&&realm.includes('function drawStars(palette=DEFAULT_STAR_PALETTE')&&realm.includes('colors=Array.isArray(palette)?palette:DEFAULT_STAR_PALETTE')&&!realm.includes('colors.slice(0,3)')&&realm.includes('drawStars(CHRONO_STAR_PALETTE,.72)')&&realm.includes('drawStars(STAGE_ROUTE_STAR_PALETTE,.58)')],
 ['background streak hot loops assign invariant stroke styles once per frame',realm.includes('strokeAlpha=stageOne?.20+moving*.12:stageTwo?.16+moving*.10:.28+moving*.22')&&realm.includes('ctx.strokeStyle=`rgba(${palette},${strokeAlpha})`;')&&realm.includes('strokeStyle=`rgba(${color},${.34+.28*intensity})`')&&!realm.includes('ctx.globalAlpha=(.05+(i%4)*.022)*intensity;ctx.strokeStyle=`rgba(${color},${.34+.28*intensity})`')),
 ['combat text rendering reuses bounded font strings across visible frames',entities.includes('const EFFECT_TEXT_FONT_CACHE=new Map()')&&entities.includes('EFFECT_TEXT_FONT_CACHE.size>=24')&&entities.includes('ctx.font=effectTextFont(t.size)')&&!entities.includes('ctx.font=`800 ${t.size}px IBM Plex Sans KR`')),
"""
p.write_text(text.replace(marker, additions + marker, 1), encoding='utf-8')

print('performance pass 5 patch applied')
