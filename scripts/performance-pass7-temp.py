from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

entities_path = Path('src/render-entities.js')
entities = entities_path.read_text(encoding='utf-8').replace('\r\n', '\n')

entities = replace_once(
    entities,
    "const EFFECT_TEXT_FONT_CACHE=new Map();",
    "const EFFECT_TEXT_FONT_CACHE=new Map();\nconst PROJECTILE_COLOR_VALIDITY_CACHE=new Map(),PROJECTILE_COLOR_VALIDITY_CACHE_LIMIT=96;",
    'projectile color cache declaration',
)

entities = replace_once(
    entities,
    "function projectileColor(p,fallback=COLORS.white){if(typeof p.color!=='string'||!CSS.supports('color',p.color))p.color=fallback;return p.color;}",
    "function projectileColor(p,fallback=COLORS.white){const raw=typeof p.color==='string'?p.color:null;if(raw===null){p.color=fallback;return p.color;}let valid=PROJECTILE_COLOR_VALIDITY_CACHE.get(raw);if(valid===undefined){valid=CSS.supports('color',raw);if(PROJECTILE_COLOR_VALIDITY_CACHE.size>=PROJECTILE_COLOR_VALIDITY_CACHE_LIMIT)PROJECTILE_COLOR_VALIDITY_CACHE.delete(PROJECTILE_COLOR_VALIDITY_CACHE.keys().next().value);PROJECTILE_COLOR_VALIDITY_CACHE.set(raw,valid);}if(!valid)p.color=fallback;return p.color;}",
    'projectile color validation',
)

old_enemy_projectiles = """function drawEnemyProjectiles(){
  const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,list=state.entities.enemyProjectiles||[],crowded=list.length>90;
  for(const p of list){
    if(!p||p.life<=0)continue;const sx=p.x-player.x+vw/2,sy=p.y-player.y+vh/2;if(sx<-56||sx>vw+56||sy<-56||sy>vh+56)continue;
    const angle=Math.atan2(p.vy||0,p.vx||0),kind=String(p.visual||'orb'),color=projectileColor(p,'#ff6c91');
    ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.rotate(angle);ctx.shadowBlur=tier===0&&!crowded?7:0;ctx.shadowColor=color;drawEnemyProjectileShape(p,kind,tier);ctx.restore();
  }
}"""
new_enemy_projectiles = """function drawEnemyProjectiles(){
  const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,list=state.entities.enemyProjectiles||[],crowded=list.length>90;
  for(const p of list){
    if(!p||p.life<=0)continue;const sx=p.x-player.x+vw/2,sy=p.y-player.y+vh/2;if(sx<-56||sx>vw+56||sy<-56||sy>vh+56)continue;
    const angle=Number.isFinite(p.heading)?p.heading:Math.atan2(p.vy||0,p.vx||0),kind=String(p.visual||'orb'),color=projectileColor(p,'#ff6c91');
    ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.rotate(angle);ctx.shadowBlur=tier===0&&!crowded?7:0;ctx.shadowColor=color;drawEnemyProjectileShape(p,kind,tier);ctx.restore();
  }
}"""
entities = replace_once(entities, old_enemy_projectiles, new_enemy_projectiles, 'enemy projectile heading reuse')

old_gems = """function drawGems(){const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,list=state.entities.gems||[],crowded=list.length>64,now=performance.now()*.004;for(const g of list){if(!g||g.life<=0)continue;const p=worldToScreen(g.x,g.y);if(p.x<-32||p.x>vw+32||p.y<-32||p.y>vh+32)continue;const pulse=.92+.08*Math.sin((g.pulse||0)*2+now),r=Math.max(2,(g.r||4)*pulse);ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));ctx.rotate((g.pulse||0)*.3);ctx.fillStyle='#72e69a';ctx.strokeStyle='#dfffe9';ctx.lineWidth=1.1;ctx.shadowBlur=tier===0&&!crowded?7:0;ctx.shadowColor='#72e69a';ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();if(tier===0&&!crowded)ctx.stroke();ctx.fillStyle='rgba(255,255,255,.86)';ctx.beginPath();ctx.arc(-r*.18,-r*.2,Math.max(.8,r*.2),0,TAU);ctx.fill();ctx.restore();}}"""
new_gems = """function drawGems(){const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,list=state.entities.gems||[],crowded=list.length>64,now=performance.now()*.004;for(const g of list){if(!g||g.life<=0)continue;const sx=g.x-player.x+vw/2,sy=g.y-player.y+vh/2;if(sx<-32||sx>vw+32||sy<-32||sy>vh+32)continue;const pulse=.92+.08*Math.sin((g.pulse||0)*2+now),r=Math.max(2,(g.r||4)*pulse);ctx.save();ctx.translate(Math.round(sx),Math.round(sy));ctx.rotate((g.pulse||0)*.3);ctx.fillStyle='#72e69a';ctx.strokeStyle='#dfffe9';ctx.lineWidth=1.1;ctx.shadowBlur=tier===0&&!crowded?7:0;ctx.shadowColor='#72e69a';ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();if(tier===0&&!crowded)ctx.stroke();ctx.fillStyle='rgba(255,255,255,.86)';ctx.beginPath();ctx.arc(-r*.18,-r*.2,Math.max(.8,r*.2),0,TAU);ctx.fill();ctx.restore();}}"""
entities = replace_once(entities, old_gems, new_gems, 'gem screen coordinate allocation')

entities = replace_once(
    entities,
    "function drawAlliedEffects(){for(const p of state.entities.particles){",
    "function drawAlliedEffects(){ctx.shadowBlur=9;for(const p of state.entities.particles){",
    'allied particle invariant shadow blur',
)
entities = replace_once(
    entities,
    "ctx.fillStyle=p.color;ctx.shadowBlur=9;ctx.shadowColor=p.color;",
    "ctx.fillStyle=p.color;ctx.shadowColor=p.color;",
    'allied particle repeated shadow blur assignment',
)

entities_path.write_text(entities, encoding='utf-8')

audit_path = Path('scripts/performance-audit-contract.mjs')
audit = audit_path.read_text(encoding='utf-8').replace('\r\n', '\n')
needle = " ['offscreen beams shockwaves text and allied particles are culled before Canvas draw work',entities.includes('beamMargin=Math.max(80')&&entities.includes('Math.max(a.x,b.x)<-beamMargin')&&entities.includes('sx+r<-24')&&entities.includes('sx<-140||sx>vw+140')&&entities.includes('sx<-24-size||sx>vw+24+size')]"
addition = " ['Canvas projectile and gem hot loops cache color validation reuse simulated heading and avoid gem screen-point allocations',entities.includes('const PROJECTILE_COLOR_VALIDITY_CACHE=new Map(),PROJECTILE_COLOR_VALIDITY_CACHE_LIMIT=96')&&entities.includes('PROJECTILE_COLOR_VALIDITY_CACHE.get(raw)')&&entities.includes('Number.isFinite(p.heading)?p.heading:Math.atan2')&&entities.includes('const sx=g.x-player.x+vw/2,sy=g.y-player.y+vh/2')&&!entities.includes('const p=worldToScreen(g.x,g.y)')&&!entities.includes(\"typeof p.color!=='string'||!CSS.supports('color',p.color)\")],\n" + needle
audit = replace_once(audit, needle, addition, 'performance audit insertion')
audit_path.write_text(audit, encoding='utf-8')

community_path = Path('scripts/community-feedback-contract.mjs')
community = community_path.read_text(encoding='utf-8').replace('\r\n', '\n')
community = replace_once(
    community,
    "expect('gems are culled and cached',performance.includes('cachedGemRenderer')&&render.includes('if(p.x<-32||p.x>vw+32||p.y<-32||p.y>vh+32)continue'));",
    "expect('gems are culled and cached',performance.includes('cachedGemRenderer')&&render.includes('if(sx<-32||sx>vw+32||sy<-32||sy>vh+32)continue'));",
    'community gem culling contract',
)
community_path.write_text(community, encoding='utf-8')
