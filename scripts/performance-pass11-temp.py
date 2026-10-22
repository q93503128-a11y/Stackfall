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

# systems-base.js: recycle pooled transient effects on cap eviction and full run reset.
path = 'src/systems-base.js'
text = read(path)
old = "function recycleShockwaveEffect(effect){if(effect?.[STACKFALL_SHOCKWAVE_POOL_MARK]===true&&SHOCKWAVE_POOL.length<SHOCKWAVE_POOL_LIMIT)SHOCKWAVE_POOL.push(effect);}\nfunction addText(x,y,text,color='#fff',size=13)"
new = "function recycleShockwaveEffect(effect){if(effect?.[STACKFALL_SHOCKWAVE_POOL_MARK]===true&&SHOCKWAVE_POOL.length<SHOCKWAVE_POOL_LIMIT)SHOCKWAVE_POOL.push(effect);}\nfunction trimPooledEffects(list,max,recycle){if(list.length<=max)return;const remove=list.length-max;for(let i=0;i<remove;i++)recycle?.(list[i]);list.splice(0,remove);}\nfunction addText(x,y,text,color='#fff',size=13)"
text = replace_once(text, old, new, 'systems-base trim pooled helper')
old = "function clearBeamEffects(beams=state.entities.beams){if(!beams)return;for(let i=0;i<beams.length;i++)recycleBeamEffect(beams[i]);beams.length=0;}\nfunction dealDamage(enemy,amount,opts={})"
new = "function clearBeamEffects(beams=state.entities.beams){if(!beams)return;for(let i=0;i<beams.length;i++)recycleBeamEffect(beams[i]);beams.length=0;}\nfunction releaseRunTransientEffects(){const entities=state.entities||{},particles=entities.particles||[],texts=entities.texts||[],shockwaves=entities.shockwaves||[],beams=entities.beams||[],projectiles=entities.projectiles||[];for(let i=0;i<particles.length;i++)recycleParticleObject(particles[i]);for(let i=0;i<texts.length;i++)recycleTextEffect(texts[i]);for(let i=0;i<shockwaves.length;i++)recycleShockwaveEffect(shockwaves[i]);particles.length=0;texts.length=0;shockwaves.length=0;clearBeamEffects(beams);const projectilePool=window.stackfallProjectilePool;if(Array.isArray(projectilePool)){for(let i=0;i<projectiles.length&&projectilePool.length<320;i++){const projectile=projectiles[i];if(!projectile)continue;projectile.hitIds?.clear?.();projectilePool.push(projectile);}}projectiles.length=0;}\nfunction dealDamage(enemy,amount,opts={})"
text = replace_once(text, old, new, 'systems-base reset recycler')
write(path, text)

# systems.js: cap trimming must return owned pooled effects before removing them.
path = 'src/systems.js'
text = read(path)
old = "trimOldest(particles,entityCap('particles'));trimOldest(texts,entityCap('texts'));trimOldest(shockwaves,entityCap('shockwaves'));trimOldest(state.entities.telegraphs,entityCap('telegraphs'));trimBeamEffects(beams,entityCap('beams'));state.camera.shake=Math.max(0,state.camera.shake-dt*36);"
new = "trimPooledEffects(particles,entityCap('particles'),recycleParticleObject);trimPooledEffects(texts,entityCap('texts'),recycleTextEffect);trimPooledEffects(shockwaves,entityCap('shockwaves'),recycleShockwaveEffect);trimOldest(state.entities.telegraphs,entityCap('telegraphs'));trimBeamEffects(beams,entityCap('beams'));state.camera.shake=Math.max(0,state.camera.shake-dt*36);"
text = replace_once(text, old, new, 'systems pooled cap trim')
write(path, text)

# performance-guard.js: adaptive cap pass must also preserve pool reuse.
path = 'src/performance-guard.js'
text = read(path)
old = "baseUpdateEffects(dt);trimOldest(state.entities.particles,entityCap('particles'));trimOldest(state.entities.shockwaves,entityCap('shockwaves'));trimOldest(state.entities.beams,entityCap('beams'));"
new = "baseUpdateEffects(dt);trimPooledEffects(state.entities.particles,entityCap('particles'),recycleParticleObject);trimPooledEffects(state.entities.shockwaves,entityCap('shockwaves'),recycleShockwaveEffect);trimBeamEffects(state.entities.beams,entityCap('beams'));"
text = replace_once(text, old, new, 'guard pooled cap trim')
write(path, text)

# core.js: return reusable run-local transient objects before the generic entity clear.
path = 'src/core.js'
text = read(path)
old = "state.weaponSlots=[starter];state.weaponStacks={[starter]:1};state.passives={};Object.values(state.entities).forEach(a=>Array.isArray(a)&&a.splice(0));player.x=player.y=0;"
new = "state.weaponSlots=[starter];state.weaponStacks={[starter]:1};state.passives={};if(typeof releaseRunTransientEffects==='function')releaseRunTransientEffects();Object.values(state.entities).forEach(a=>Array.isArray(a)&&a.splice(0));player.x=player.y=0;"
text = replace_once(text, old, new, 'core run transient release')
write(path, text)

# map-event-expansion.js: event abort/cleanup should recycle owned beam objects.
path = 'src/map-event-expansion.js'
text = read(path)
old = "state.entities.enemyProjectiles.length=0;state.entities.telegraphs.length=0;state.entities.beams?.splice(0);state.bossActiveId=null;"
new = "state.entities.enemyProjectiles.length=0;state.entities.telegraphs.length=0;clearBeamEffects();state.bossActiveId=null;"
text = replace_once(text, old, new, 'event beam recycler')
write(path, text)

# performance contract: pin the recycling paths.
path = 'scripts/performance-audit-contract.mjs'
text = read(path)
text = replace_once(text, "const entities=read('src/render-entities.js');\n", "const entities=read('src/render-entities.js');\nconst core=read('src/core.js');\nconst events=read('src/map-event-expansion.js');\n", 'performance contract sources')
anchor = " ['nearest multi-target and drone hot paths support caller-owned reusable buffers',guard.includes('function nearestIndexedEnemies(x,y,count,excluded=null,maxRange=Infinity,out=null)')&&guard.includes('if(Array.isArray(out)){out.length=nearestEnemyBuffer.length')&&weapons.includes('DRONE_POSITION_BUFFER=Array.from({length:3}')&&weapons.includes('DRONE_TARGET_BUFFER=[]')&&weapons.includes('MIRROR_TARGET_BUFFER=[]')&&weapons.includes('MIRV_TARGET_BUFFER=[]')&&weapons.includes(\"performanceNearestEnemies(x,y,count,excluded,maxRange,resultOut)\")&&weapons.includes(\"weaponRange('drone'),DRONE_TARGET_BUFFER\")&&weapons.includes(\"weaponRange('mirror'),MIRROR_TARGET_BUFFER\")&&weapons.includes('MIRV_EXCLUDED_TARGETS,260,MIRV_TARGET_BUFFER')&&!weapons.includes('new Set([target?.id])')],\n"
insert = anchor + " ['pooled effect cap trimming recycles evicted objects instead of dropping them',systems.includes('function trimPooledEffects(list,max,recycle)')&&runtimeSystems.includes(\"trimPooledEffects(particles,entityCap('particles'),recycleParticleObject)\")&&runtimeSystems.includes(\"trimPooledEffects(texts,entityCap('texts'),recycleTextEffect)\")&&runtimeSystems.includes(\"trimPooledEffects(shockwaves,entityCap('shockwaves'),recycleShockwaveEffect)\")&&guard.includes(\"trimPooledEffects(state.entities.particles,entityCap('particles'),recycleParticleObject)\")&&guard.includes(\"trimBeamEffects(state.entities.beams,entityCap('beams'))\")&&!guard.includes(\"trimOldest(state.entities.beams,entityCap('beams'))\")],\n ['run reset returns reusable transient effects and active player projectiles to bounded pools',systems.includes('function releaseRunTransientEffects()')&&systems.includes('projectile.hitIds?.clear?.()')&&systems.includes('projectilePool.length<320')&&core.includes(\"typeof releaseRunTransientEffects==='function'\")],\n ['event combat cleanup recycles owned beams instead of dropping the array',events.includes('clearBeamEffects();state.bossActiveId=null')&&!events.includes('state.entities.beams?.splice(0);state.bossActiveId=null')],\n"
text = replace_once(text, anchor, insert, 'performance contract pass 11 checks')
write(path, text)
