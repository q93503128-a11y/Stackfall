from pathlib import Path


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)


def replace_all(text, old, new, label, expected_min=1):
    count = text.count(old)
    if count < expected_min:
        raise SystemExit(f'{label}: expected at least {expected_min} matches, found {count}')
    return text.replace(old, new)

# systems-base.js: ownership-safe hostile projectile pool. Reuse starts by deleting every
# enumerable runtime field so homing/awakening metadata can never leak to a later shot.
path = 'src/systems-base.js'
text = read(path)
old = "function spawnEnemyProjectile(x,y,a,speed,damage,color='#ff6ccf',r=6,life=5,visual=null){\n  if(state.entities.enemyProjectiles.length>=entityCap('enemyProjectiles'))state.entities.enemyProjectiles.shift();\n  const environment=state.stageEnvironmentTelegraphContext||null,envScale=environment?window.stackfallStageEnvironmentCombatScale?.(environment):null;if(envScale){speed*=envScale.speed;damage*=envScale.damage;}\n  const heading=Number.isFinite(a)?a:0,velocity=Number.isFinite(speed)?speed:0;\n  const projectile={x,y,prevX:x,prevY:y,vx:Math.cos(heading)*velocity,vy:Math.sin(heading)*velocity,damage,color,r,life,maxLife:life,heading,phase:heading,age:0,visual:visual||inferEnemyProjectileVisual(color,velocity,r),visualSeed:Math.random()*TAU};\n  state.entities.enemyProjectiles.push(projectile);return projectile;\n}"
new = "const STACKFALL_ENEMY_PROJECTILE_POOL_MARK=Symbol('stackfallEnemyProjectilePool'),ENEMY_PROJECTILE_OBJECT_POOL=[],ENEMY_PROJECTILE_OBJECT_POOL_LIMIT=448;\nfunction acquireEnemyProjectileObject(){const projectile=ENEMY_PROJECTILE_OBJECT_POOL.pop()||Object.defineProperty({},STACKFALL_ENEMY_PROJECTILE_POOL_MARK,{value:true});for(const key in projectile)delete projectile[key];return projectile;}\nfunction recycleEnemyProjectileObject(projectile){if(projectile?.[STACKFALL_ENEMY_PROJECTILE_POOL_MARK]===true&&ENEMY_PROJECTILE_OBJECT_POOL.length<ENEMY_PROJECTILE_OBJECT_POOL_LIMIT)ENEMY_PROJECTILE_OBJECT_POOL.push(projectile);}\nfunction trimEnemyProjectiles(list,max){if(list.length<=max)return;const remove=list.length-max;for(let i=0;i<remove;i++)recycleEnemyProjectileObject(list[i]);list.splice(0,remove);}\nfunction clearEnemyProjectiles(list=state.entities.enemyProjectiles){if(!list)return;for(let i=0;i<list.length;i++)recycleEnemyProjectileObject(list[i]);list.length=0;}\nfunction spawnEnemyProjectile(x,y,a,speed,damage,color='#ff6ccf',r=6,life=5,visual=null){\n  if(state.entities.enemyProjectiles.length>=entityCap('enemyProjectiles'))recycleEnemyProjectileObject(state.entities.enemyProjectiles.shift());\n  const environment=state.stageEnvironmentTelegraphContext||null,envScale=environment?window.stackfallStageEnvironmentCombatScale?.(environment):null;if(envScale){speed*=envScale.speed;damage*=envScale.damage;}\n  const heading=Number.isFinite(a)?a:0,velocity=Number.isFinite(speed)?speed:0,projectile=acquireEnemyProjectileObject();\n  projectile.x=x;projectile.y=y;projectile.prevX=x;projectile.prevY=y;projectile.vx=Math.cos(heading)*velocity;projectile.vy=Math.sin(heading)*velocity;projectile.damage=damage;projectile.color=color;projectile.r=r;projectile.life=life;projectile.maxLife=life;projectile.heading=heading;projectile.phase=heading;projectile.age=0;projectile.visual=visual||inferEnemyProjectileVisual(color,velocity,r);projectile.visualSeed=Math.random()*TAU;\n  state.entities.enemyProjectiles.push(projectile);return projectile;\n}"
text = replace_once(text, old, new, 'hostile projectile pool')
old = "function releaseRunTransientEffects(){const entities=state.entities||{},particles=entities.particles||[],texts=entities.texts||[],shockwaves=entities.shockwaves||[],beams=entities.beams||[],projectiles=entities.projectiles||[];for(let i=0;i<particles.length;i++)recycleParticleObject(particles[i]);for(let i=0;i<texts.length;i++)recycleTextEffect(texts[i]);for(let i=0;i<shockwaves.length;i++)recycleShockwaveEffect(shockwaves[i]);particles.length=0;texts.length=0;shockwaves.length=0;clearBeamEffects(beams);const projectilePool=window.stackfallProjectilePool;if(Array.isArray(projectilePool)){for(let i=0;i<projectiles.length&&projectilePool.length<320;i++){const projectile=projectiles[i];if(!projectile)continue;projectile.hitIds?.clear?.();projectilePool.push(projectile);}}projectiles.length=0;}"
new = "function releaseRunTransientEffects(){const entities=state.entities||{},particles=entities.particles||[],texts=entities.texts||[],shockwaves=entities.shockwaves||[],beams=entities.beams||[],projectiles=entities.projectiles||[],enemyProjectiles=entities.enemyProjectiles||[];for(let i=0;i<particles.length;i++)recycleParticleObject(particles[i]);for(let i=0;i<texts.length;i++)recycleTextEffect(texts[i]);for(let i=0;i<shockwaves.length;i++)recycleShockwaveEffect(shockwaves[i]);particles.length=0;texts.length=0;shockwaves.length=0;clearBeamEffects(beams);clearEnemyProjectiles(enemyProjectiles);const projectilePool=window.stackfallProjectilePool;if(Array.isArray(projectilePool)){for(let i=0;i<projectiles.length&&projectilePool.length<320;i++){const projectile=projectiles[i];if(!projectile)continue;projectile.hitIds?.clear?.();projectilePool.push(projectile);}}projectiles.length=0;}"
text = replace_once(text, old, new, 'run reset hostile projectile release')
write(path, text)

# bosses.js: normal lifetime/cap removal and Apex clears return owned shots to the pool.
path = 'src/bosses.js'
text = read(path)
old = "compactInPlace(state.entities.enemyProjectiles,keepLiveEnemyProjectile);trimOldest(state.entities.enemyProjectiles,entityCap('enemyProjectiles'));"
new = "compactInPlace(state.entities.enemyProjectiles,keepLiveEnemyProjectile,recycleEnemyProjectileObject);trimEnemyProjectiles(state.entities.enemyProjectiles,entityCap('enemyProjectiles'));"
text = replace_once(text, old, new, 'boss hostile projectile recycle')
text = replace_all(text, 'state.entities.enemyProjectiles.length=0;', 'clearEnemyProjectiles();', 'boss hostile projectile clears', 2)
write(path, text)

# Event/stage/dev cleanup paths should not drop owned hostile objects.
for path, minimum in [
    ('src/map-event-expansion.js', 1),
    ('src/runtime-controls.js', 1),
    ('src/stage01-remodel.js', 2),
]:
    text = read(path)
    text = replace_all(text, 'state.entities.enemyProjectiles.length=0;', 'clearEnemyProjectiles();', f'{path} hostile clears', minimum)
    write(path, text)

# stage-runtime.js has both direct clears and generic keyed clear loops.
path = 'src/stage-runtime.js'
text = read(path)
text = replace_all(text, 'state.entities.enemyProjectiles.length=0;', 'clearEnemyProjectiles();', 'stage direct hostile clears', 2)
old = "for(const key of['enemyProjectiles','telegraphs','beams','wells'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;"
new = "clearEnemyProjectiles();for(const key of['telegraphs','beams','wells'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;"
text = replace_all(text, old, new, 'stage intro hostile keyed clears', 1)
old = "for(const key of['enemyProjectiles','telegraphs','beams','wells','guidedMissiles','gateNetworks','texts'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;"
new = "clearEnemyProjectiles();for(const key of['telegraphs','beams','wells','guidedMissiles','gateNetworks','texts'])if(Array.isArray(state.entities[key]))state.entities[key].length=0;"
text = replace_all(text, old, new, 'stage victory hostile keyed clears', 1)
write(path, text)

# Developer encounter reset keeps its behavior but recycles hostile shots.
path = 'src/dev-tools-endless.js'
text = read(path)
old = "const list=state.entities?.[key];if(Array.isArray(list))list.length=0;"
new = "const list=state.entities?.[key];if(Array.isArray(list)){if(key==='enemyProjectiles')clearEnemyProjectiles(list);else list.length=0;}"
text = replace_once(text, old, new, 'dev encounter hostile recycle')
write(path, text)

# Runtime sanitizer is an exceptional path, but invalid owned shots should still be returned.
path = 'src/render.js'
text = read(path)
old = "const finiteXY=e=>e&&Number.isFinite(e.x)&&Number.isFinite(e.y),sanitize=(key,keep)=>{const removed=compactInPlace(state.entities[key],keep);if(removed){runtimeSanitizeDiagnostics.removed[key]=(runtimeSanitizeDiagnostics.removed[key]||0)+removed;runtimeSanitizeDiagnostics.totalRemoved+=removed;}};"
new = "const finiteXY=e=>e&&Number.isFinite(e.x)&&Number.isFinite(e.y),sanitize=(key,keep,onDiscard=null)=>{const removed=compactInPlace(state.entities[key],keep,onDiscard);if(removed){runtimeSanitizeDiagnostics.removed[key]=(runtimeSanitizeDiagnostics.removed[key]||0)+removed;runtimeSanitizeDiagnostics.totalRemoved+=removed;}};"
text = replace_once(text, old, new, 'sanitizer discard callback')
old = "sanitize('enemyProjectiles',p=>finiteXY(p)&&Number.isFinite(p.life));"
new = "sanitize('enemyProjectiles',p=>finiteXY(p)&&Number.isFinite(p.life),recycleEnemyProjectileObject);"
text = replace_once(text, old, new, 'sanitizer hostile recycle')
write(path, text)

# Pin the ownership/reset behavior in the performance regression contract.
path = 'scripts/performance-audit-contract.mjs'
text = read(path)
old = "const entities=read('src/render-entities.js');\nconst core=read('src/core.js');\nconst events=read('src/map-event-expansion.js');\n"
new = "const entities=read('src/render-entities.js');\nconst core=read('src/core.js');\nconst events=read('src/map-event-expansion.js');\nconst stageRuntime=read('src/stage-runtime.js');\nconst stageOne=read('src/stage01-remodel.js');\nconst controls=read('src/runtime-controls.js');\nconst devTools=read('src/dev-tools-endless.js');\n"
text = replace_once(text, old, new, 'performance contract pass12 sources')
anchor = " ['event combat cleanup recycles owned beams instead of dropping the array',events.includes('clearBeamEffects();state.bossActiveId=null')&&!events.includes('state.entities.beams?.splice(0);state.bossActiveId=null')],\n"
insert = anchor + " ['hostile projectile pool resets every enumerable runtime field before reuse',systems.includes(\"const STACKFALL_ENEMY_PROJECTILE_POOL_MARK=Symbol('stackfallEnemyProjectilePool'),ENEMY_PROJECTILE_OBJECT_POOL=[],ENEMY_PROJECTILE_OBJECT_POOL_LIMIT=448\")&&systems.includes('for(const key in projectile)delete projectile[key]')&&systems.includes('projectile=acquireEnemyProjectileObject()')&&systems.includes('recycleEnemyProjectileObject(state.entities.enemyProjectiles.shift())')],\n ['hostile projectile lifetime and cap eviction return owned objects to the bounded pool',bosses.includes('compactInPlace(state.entities.enemyProjectiles,keepLiveEnemyProjectile,recycleEnemyProjectileObject)')&&bosses.includes(\"trimEnemyProjectiles(state.entities.enemyProjectiles,entityCap('enemyProjectiles'))\")&&!bosses.includes(\"trimOldest(state.entities.enemyProjectiles,entityCap('enemyProjectiles'))\")],\n ['hostile projectile reset paths recycle objects instead of dropping arrays',systems.includes('clearEnemyProjectiles(enemyProjectiles)')&&bosses.includes('clearEnemyProjectiles();')&&events.includes('clearEnemyProjectiles();')&&stageRuntime.includes('clearEnemyProjectiles();')&&stageOne.includes('clearEnemyProjectiles();')&&controls.includes('clearEnemyProjectiles();')&&devTools.includes(\"if(key==='enemyProjectiles')clearEnemyProjectiles(list)\")&&!bosses.includes('state.entities.enemyProjectiles.length=0;')&&!events.includes('state.entities.enemyProjectiles.length=0;')&&!stageOne.includes('state.entities.enemyProjectiles.length=0;')&&!controls.includes('state.entities.enemyProjectiles.length=0;')],\n ['runtime sanitizer returns invalid owned hostile projectiles to their pool',render.includes('sanitize=(key,keep,onDiscard=null)')&&render.includes(\"sanitize('enemyProjectiles',p=>finiteXY(p)&&Number.isFinite(p.life),recycleEnemyProjectileObject)\")],\n"
text = replace_once(text, anchor, insert, 'performance contract pass12 checks')
write(path, text)
