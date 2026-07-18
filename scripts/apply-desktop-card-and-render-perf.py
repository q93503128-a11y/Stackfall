from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

# Level-up cards: separate metadata from stack numbers and enlarge desktop layout.
progression = root / 'src/progression-expansion.js'
text = progression.read_text(encoding='utf-8')
old = "el.innerHTML=`<span class=\"type\">${type}</span><span class=\"choice-status\">${status}</span><span class=\"stack-info\"><small>${tr('choice.current')}</small><b>${current}</b><i>→</i><small>${tr('choice.next')}</small><strong>${current+1}</strong></span>"
new = "el.innerHTML=`<span class=\"choice-meta\"><span class=\"type\">${type}</span><span class=\"choice-status\">${status}</span></span><span class=\"stack-info\"><small>${tr('choice.current')}</small><b>${current}</b><i>→</i><small>${tr('choice.next')}</small><strong>${current+1}</strong></span>"
if old not in text:
    raise SystemExit('choice card metadata markup not found')
progression.write_text(text.replace(old, new, 1), encoding='utf-8')

styles = root / 'styles.css'
css = styles.read_text(encoding='utf-8')
addition = "\n.choice-card .choice-meta{display:flex;align-items:center;gap:6px;max-width:calc(100% - 150px);min-width:0}.choice-card .choice-meta .type,.choice-card .choice-meta .choice-status{margin-left:0;white-space:nowrap}@media(pointer:fine) and (min-width:1000px){#choiceScreen{padding-inline:clamp(30px,4vw,78px)}.choice-cards{width:min(1180px,92vw);gap:18px}.choice-card{min-height:302px;padding:22px 22px 24px}.choice-card .choice-meta{max-width:calc(100% - 158px);min-height:28px}.choice-card .stack-info{right:18px;top:16px;padding:8px 10px;gap:6px}.choice-card .stack-info b,.choice-card .stack-info strong{font-size:22px}.choice-card .big-icon{width:76px;height:76px;margin:26px 0 18px;font-size:37px}.choice-card h3{font-size:24px}.choice-card p{font-size:13px;line-height:1.62}}\n"
if '.choice-card .choice-meta{' in css:
    raise SystemExit('choice metadata CSS already exists')
styles.write_text(css + addition, encoding='utf-8')

# Canonical Canvas fallback: simple bullet silhouette and culled low-cost gems.
render = root / 'src/render-entities.js'
text = render.read_text(encoding='utf-8')
pattern = re.compile(r"function drawEnemyProjectiles\(\)\{.*?\n\}\nfunction drawGems\(\)\{.*?\}\nfunction drawBeamEffects\(\)\{", re.S)
replacement = """function drawEnemyProjectiles(){
  const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,list=state.entities.enemyProjectiles||[],crowded=list.length>90;
  for(const p of list){
    if(!p||p.life<=0)continue;const s=worldToScreen(p.x,p.y);if(s.x<-48||s.x>vw+48||s.y<-48||s.y>vh+48)continue;
    const r=Math.max(2.4,Math.min(13,p.r||4)),angle=Math.atan2(p.vy||0,p.vx||0),color=projectileColor(p,'#ff6c91');
    ctx.save();ctx.translate(Math.round(s.x),Math.round(s.y));ctx.rotate(angle);ctx.fillStyle=color;ctx.strokeStyle='rgba(255,238,244,.72)';ctx.lineWidth=1;ctx.shadowBlur=tier===0&&!crowded?7:0;ctx.shadowColor=color;ctx.beginPath();ctx.moveTo(r*1.75,0);ctx.quadraticCurveTo(r*.25,-r*.62,-r*.92,0);ctx.quadraticCurveTo(r*.25,r*.62,r*1.75,0);ctx.closePath();ctx.fill();if(tier===0&&!crowded)ctx.stroke();ctx.fillStyle='rgba(255,255,255,.82)';ctx.beginPath();ctx.ellipse(r*.72,-r*.12,Math.max(1,r*.28),Math.max(.7,r*.15),0,0,TAU);ctx.fill();ctx.restore();
  }
}
function drawGems(){const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,list=state.entities.gems||[],crowded=list.length>64,now=performance.now()*.004;for(const g of list){if(!g||g.life<=0)continue;const p=worldToScreen(g.x,g.y);if(p.x<-32||p.x>vw+32||p.y<-32||p.y>vh+32)continue;const pulse=.92+.08*Math.sin((g.pulse||0)*2+now),r=Math.max(2,(g.r||4)*pulse);ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));ctx.rotate((g.pulse||0)*.3);ctx.fillStyle='#72e69a';ctx.strokeStyle='#dfffe9';ctx.lineWidth=1.1;ctx.shadowBlur=tier===0&&!crowded?7:0;ctx.shadowColor='#72e69a';ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();if(tier===0&&!crowded)ctx.stroke();ctx.fillStyle='rgba(255,255,255,.86)';ctx.beginPath();ctx.arc(-r*.18,-r*.2,Math.max(.8,r*.2),0,TAU);ctx.fill();ctx.restore();}}
function drawBeamEffects(){"""
text2, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'canonical render replacement count={count}')
render.write_text(text2, encoding='utf-8')

# Runtime hot path: reuse cached offscreen sprites instead of rebuilding Canvas paths every frame.
perf = root / 'src/performance-guard.js'
text = perf.read_text(encoding='utf-8')
old_decl = "const projectileSpriteCache=new Map();\n  const enemySpriteCache=new Map();"
if old_decl not in text:
    raise SystemExit('sprite cache declaration not found')
text = text.replace(old_decl, old_decl + "\n  const gemSpriteCache=new Map();", 1)
old_branch = """    }else if(kind==='star'||kind==='enemy'){
      g.fillStyle=kind==='enemy'?color:'#ffffff';g.strokeStyle=color;g.lineWidth=kind==='enemy'?2:0;
      const points=kind==='enemy'?5:4,outer=radius*1.42,inner=radius*.42;g.beginPath();for(let i=0;i<points*2;i++){const a=i*Math.PI/points,r=i%2?inner:outer,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();if(kind==='enemy')g.stroke();
    }else{"""
new_branch = """    }else if(kind==='enemy'){
      g.fillStyle=color;g.strokeStyle='rgba(255,238,244,.72)';g.lineWidth=1.2;g.beginPath();g.moveTo(cx+radius*1.75,cy);g.quadraticCurveTo(cx+radius*.25,cy-radius*.62,cx-radius*.92,cy);g.quadraticCurveTo(cx+radius*.25,cy+radius*.62,cx+radius*1.75,cy);g.closePath();g.fill();g.stroke();g.fillStyle='rgba(255,255,255,.84)';g.beginPath();g.ellipse(cx+radius*.72,cy-radius*.12,Math.max(1,radius*.28),Math.max(.7,radius*.15),0,0,TAU);g.fill();
    }else if(kind==='star'){
      g.fillStyle='#ffffff';const points=4,outer=radius*1.42,inner=radius*.42;g.beginPath();for(let i=0;i<points*2;i++){const a=i*Math.PI/points,r=i%2?inner:outer,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();
    }else{"""
if old_branch not in text:
    raise SystemExit('cached enemy projectile sprite branch not found')
text = text.replace(old_branch, new_branch, 1)
text = text.replace("const trail=kind==='comet'?82:kind==='star'?42:enemy?32:28", "const trail=kind==='comet'?82:kind==='star'?42:enemy?14:28", 1)
text = text.replace("g.shadowColor=color;g.shadowBlur=kind==='comet'?28:enemy?16:18;", "g.shadowColor=color;g.shadowBlur=kind==='comet'?28:enemy?7:18;", 1)
text = text.replace("const entry=projectileSprite(p,enemy),angle=enemy?(p.phase||0):Math.atan2(p.vy||0,p.vx||0);", "const entry=projectileSprite(p,enemy),angle=Math.atan2(p.vy||0,p.vx||0);", 1)
old_override = "drawEnemyProjectiles=function styledEnemyProjectiles(){return fullDrawEnemyProjectiles();};"
new_override = "drawEnemyProjectiles=function cachedEnemyProjectiles(){drawCachedProjectiles(state.entities.enemyProjectiles,true);};"
if old_override not in text:
    raise SystemExit('enemy projectile renderer override not found')
text = text.replace(old_override, new_override, 1)
block = """  function drawCachedProjectiles(list,enemy=false){
    for(let i=0;i<list.length;i++){
      const p=list[i];if(!p||p.life<=0)continue;
      const sx=p.x-player.x+vw/2,sy=p.y-player.y+vh/2;if(sx<-120||sx>vw+120||sy<-120||sy>vh+120)continue;
      const entry=projectileSprite(p,enemy),angle=Math.atan2(p.vy||0,p.vx||0);drawSpriteRotated(entry,roundPixel(sx),roundPixel(sy),angle);
    }
  }
"""
gem_code = """
  function gemSprite(radius){const key=Math.max(2,Math.min(18,Math.round(radius*2)/2));let entry=gemSpriteCache.get(key);if(entry)return entry;const pad=12,size=Math.ceil((key+pad)*2),surface=makeSurface(size,size),g=surface.getContext('2d'),c=size/2;g.translate(c,c);g.shadowColor='#72e69a';g.shadowBlur=7;g.fillStyle='#72e69a';g.strokeStyle='#dfffe9';g.lineWidth=1.1;g.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,x=Math.cos(a)*key,y=Math.sin(a)*key;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();g.stroke();g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.86)';g.beginPath();g.arc(-key*.18,-key*.2,Math.max(.8,key*.2),0,TAU);g.fill();entry={surface,anchorX:c,anchorY:c};gemSpriteCache.set(key,entry);trimCache(gemSpriteCache,32);return entry;}
  drawGems=function cachedGemRenderer(){const list=state.entities.gems||[];for(let i=0;i<list.length;i++){const gem=list[i];if(!gem||gem.life<=0)continue;const sx=gem.x-player.x+vw/2,sy=gem.y-player.y+vh/2;if(sx<-32||sx>vw+32||sy<-32||sy>vh+32)continue;const entry=gemSprite(gem.r||4);ctx.drawImage(entry.surface,roundPixel(sx-entry.anchorX),roundPixel(sy-entry.anchorY));}};
"""
if block not in text:
    raise SystemExit('cached projectile renderer block not found')
text = text.replace(block, block + gem_code, 1)
perf.write_text(text, encoding='utf-8')

# Motion streaks keep direction feedback but scale down when the performance guard is active.
background = root / 'src/realm-backgrounds.js'
text = background.read_text(encoding='utf-8')
old_motion = "function drawMotionStreaks(theme='space'){const intensity=clamp(player.moveIntensity||0,0,1);if(intensity<.06)return;const vx=player.moveVX||0,vy=player.moveVY||0,speed=Math.hypot(vx,vy)||1,nx=vx/speed,ny=vy/speed,color=theme==='apex-forge'?'255,166,74':theme==='void'?'183,130,255':theme==='apex-chrono'?'121,255,225':'150,211,255',now=performance.now()*.001;ctx.save();ctx.lineCap='round';for(let i=0;i<22;i++){"
new_motion = "function drawMotionStreaks(theme='space'){const intensity=clamp(player.moveIntensity||0,0,1);if(intensity<.06)return;const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,count=tier===2?6:tier===1?10:16,vx=player.moveVX||0,vy=player.moveVY||0,speed=Math.hypot(vx,vy)||1,nx=vx/speed,ny=vy/speed,color=theme==='apex-forge'?'255,166,74':theme==='void'?'183,130,255':theme==='apex-chrono'?'121,255,225':'150,211,255',now=performance.now()*.001;ctx.save();ctx.lineCap='round';for(let i=0;i<count;i++){"
if old_motion not in text:
    raise SystemExit('motion streak loop not found')
background.write_text(text.replace(old_motion, new_motion, 1), encoding='utf-8')

# Permanent static regression checks.
contract = root / 'scripts/community-feedback-contract.mjs'
text = contract.read_text(encoding='utf-8')
old_imports = "const core=read('src/core.js'),systems=read('src/systems.js'),runtime=read('src/runtime-config.js'),render=read('src/render-entities.js'),background=read('src/realm-backgrounds.js')"
if old_imports not in text:
    raise SystemExit('community contract imports not found')
text = text.replace(old_imports, "const core=read('src/core.js'),systems=read('src/systems.js'),runtime=read('src/runtime-config.js'),render=read('src/render-entities.js'),performance=read('src/performance-guard.js'),background=read('src/realm-backgrounds.js')", 1)
old_check = "expect('pickup and enemy projectile silhouettes differ',render.includes(\"shadowColor='#8dff9a'\")&&render.includes(\"fillStyle='#ff315f'\")&&render.includes('drawPlayerFacingIndicator'));"
new_checks = "expect('pickup and enemy projectile silhouettes differ',render.includes(\"fillStyle='#72e69a'\")&&render.includes(\"projectileColor(p,'#ff6c91')\")&&render.includes('drawPlayerFacingIndicator'));\nexpect('enemy bullets use cached lean sprites',performance.includes('cachedEnemyProjectiles')&&performance.includes('drawCachedProjectiles(state.entities.enemyProjectiles,true)')&&!performance.includes('styledEnemyProjectiles'));\nexpect('gems are culled and cached',performance.includes('cachedGemRenderer')&&render.includes(\"if(p.x<-32||p.x>vw+32||p.y<-32||p.y>vh+32)continue\"));"
if old_check not in text:
    raise SystemExit('community projectile contract not found')
contract.write_text(text.replace(old_check, new_checks, 1), encoding='utf-8')

print('Applied desktop card layout and Canvas hot-path optimizations.')
