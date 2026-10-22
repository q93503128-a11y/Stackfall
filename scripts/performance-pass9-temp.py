from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

# systems-base: pooled fixed-shape transient effects + pooled split/fragment descriptors.
systems_path = Path('src/systems-base.js')
systems = systems_path.read_text(encoding='utf-8').replace('\r\n', '\n')

old_effects = "function addText(x,y,text,color='#fff',size=13){if(state.entities.texts.length>=entityCap('texts'))state.entities.texts.shift();state.entities.texts.push({x,y,text,color,size,life:.72,max:.72,vy:-35});}\nfunction shockwave(x,y,color,maxR=100,life=.35,width=3){if(state.entities.shockwaves.length>=entityCap('shockwaves'))state.entities.shockwaves.shift();state.entities.shockwaves.push({x,y,r:6,maxR,life,max:life,color,width});}"
new_effects = "const STACKFALL_EFFECT_TEXT_POOL_MARK=Symbol('stackfallEffectTextPool'),EFFECT_TEXT_POOL=[],EFFECT_TEXT_POOL_LIMIT=128;\nfunction acquireTextEffect(x,y,text,color,size){const effect=EFFECT_TEXT_POOL.pop()||{[STACKFALL_EFFECT_TEXT_POOL_MARK]:true,x:0,y:0,text:'',color:'#fff',size:13,life:0,max:0,vy:0};effect.x=x;effect.y=y;effect.text=text;effect.color=color;effect.size=size;effect.life=.72;effect.max=.72;effect.vy=-35;return effect;}\nfunction recycleTextEffect(effect){if(effect?.[STACKFALL_EFFECT_TEXT_POOL_MARK]===true&&EFFECT_TEXT_POOL.length<EFFECT_TEXT_POOL_LIMIT)EFFECT_TEXT_POOL.push(effect);}\nconst STACKFALL_SHOCKWAVE_POOL_MARK=Symbol('stackfallShockwavePool'),SHOCKWAVE_POOL=[],SHOCKWAVE_POOL_LIMIT=144;\nfunction acquireShockwaveEffect(x,y,color,maxR,life,width){const effect=SHOCKWAVE_POOL.pop()||{[STACKFALL_SHOCKWAVE_POOL_MARK]:true,x:0,y:0,r:6,maxR:100,life:0,max:0,color:'#fff',width:3};effect.x=x;effect.y=y;effect.r=6;effect.maxR=maxR;effect.life=life;effect.max=life;effect.color=color;effect.width=width;return effect;}\nfunction recycleShockwaveEffect(effect){if(effect?.[STACKFALL_SHOCKWAVE_POOL_MARK]===true&&SHOCKWAVE_POOL.length<SHOCKWAVE_POOL_LIMIT)SHOCKWAVE_POOL.push(effect);}\nfunction addText(x,y,text,color='#fff',size=13){if(state.entities.texts.length>=entityCap('texts'))recycleTextEffect(state.entities.texts.shift());state.entities.texts.push(acquireTextEffect(x,y,text,color,size));}\nfunction shockwave(x,y,color,maxR=100,life=.35,width=3){if(state.entities.shockwaves.length>=entityCap('shockwaves'))recycleShockwaveEffect(state.entities.shockwaves.shift());state.entities.shockwaves.push(acquireShockwaveEffect(x,y,color,maxR,life,width));}"
systems = replace_once(systems, old_effects, new_effects, 'text and shockwave pools')

old_spawn = "function spawnPlayerProjectile(data){const source=data||{},next=window.stackfallProjectilePool?.pop?.()||{};for(const key in next)delete next[key];Object.assign(next,source);const photon=state.nebulaExtras?.photon||0,speed=(1+photon*.12)*(1+stat('projectileSpeed')*.10),size=(1+photon*.08)*(1+stat('projectileSize')*.10);"
new_spawn = "const STACKFALL_PROJECTILE_DESCRIPTOR_MARK=Symbol('stackfallProjectileDescriptor'),PROJECTILE_SPAWN_DESCRIPTOR_POOL=[],PROJECTILE_SPAWN_DESCRIPTOR_POOL_LIMIT=160;\nfunction acquireProjectileSpawnDescriptor(x,y,vx,vy,r,life,maxRange,damage,color,source){const descriptor=PROJECTILE_SPAWN_DESCRIPTOR_POOL.pop()||Object.defineProperty({x:0,y:0,vx:0,vy:0,r:0,life:0,maxRange:0,damage:0,color:'#fff',pierce:0,source:''},STACKFALL_PROJECTILE_DESCRIPTOR_MARK,{value:true});descriptor.x=x;descriptor.y=y;descriptor.vx=vx;descriptor.vy=vy;descriptor.r=r;descriptor.life=life;descriptor.maxRange=maxRange;descriptor.damage=damage;descriptor.color=color;descriptor.pierce=0;descriptor.source=source;return descriptor;}\nfunction recycleProjectileSpawnDescriptor(descriptor){if(descriptor?.[STACKFALL_PROJECTILE_DESCRIPTOR_MARK]===true&&PROJECTILE_SPAWN_DESCRIPTOR_POOL.length<PROJECTILE_SPAWN_DESCRIPTOR_POOL_LIMIT)PROJECTILE_SPAWN_DESCRIPTOR_POOL.push(descriptor);}\nfunction spawnPlayerProjectile(data){const source=data||{},next=window.stackfallProjectilePool?.pop?.()||{};for(const key in next)delete next[key];Object.assign(next,source);const photon=state.nebulaExtras?.photon||0,speed=(1+photon*.12)*(1+stat('projectileSpeed')*.10),size=(1+photon*.08)*(1+stat('projectileSize')*.10);"
systems = replace_once(systems, old_spawn, new_spawn, 'projectile descriptor pool')
systems_path.write_text(systems, encoding='utf-8')

# systems.js: keep the fallback path allocation-light too.
runtime_path = Path('src/systems.js')
runtime = runtime_path.read_text(encoding='utf-8').replace('\r\n', '\n')
runtime = replace_once(
    runtime,
    "const PROJECTILE_TRAIL_SOURCES=new Set(['ember','echo-star','comet','echo-comet','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter']);\nfunction updateProjectiles(dt){\n  const spawned=[],collisionCandidates=[];",
    "const PROJECTILE_TRAIL_SOURCES=new Set(['ember','echo-star','comet','echo-comet','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter']);\nconst PROJECTILE_SPAWN_FALLBACK_BUFFER=[],PROJECTILE_COLLISION_FALLBACK_BUFFER=[];\nfunction updateProjectiles(dt){\n  const spawned=PROJECTILE_SPAWN_FALLBACK_BUFFER,collisionCandidates=PROJECTILE_COLLISION_FALLBACK_BUFFER;spawned.length=0;collisionCandidates.length=0;",
    'fallback projectile buffers',
)
runtime = replace_once(
    runtime,
    "    if(p.life>0&&p.trailTick<=0&&PROJECTILE_TRAIL_SOURCES.has(p.source)){p.trailTick=compactDevice()?.055:p.source.includes('comet')?.024:.045;if(state.entities.particles.length<entityCap('particles')&&GAME_SETTINGS.hideProjectiles!==true)state.entities.particles.push({x:p.x-p.vx*.018,y:p.y-p.vy*.018,vx:rand(-12,12),vy:rand(-12,12),life:p.source.includes('comet')?.42:.25,max:p.source.includes('comet')?.42:.25,size:p.source.includes('comet')?rand(2,5):rand(1.2,3.2),color:p.color||COLORS.white,star:true});}",
    "    if(p.life>0&&p.trailTick<=0&&PROJECTILE_TRAIL_SOURCES.has(p.source)){const cometTrail=p.source.includes('comet'),trailLife=cometTrail?.42:.25;p.trailTick=compactDevice()?.055:cometTrail?.024:.045;if(state.entities.particles.length<entityCap('particles')&&GAME_SETTINGS.hideProjectiles!==true)state.entities.particles.push(acquireParticleObject(p.x-p.vx*.018,p.y-p.vy*.018,rand(-12,12),rand(-12,12),trailLife,trailLife,cometTrail?rand(2,5):rand(1.2,3.2),p.color||COLORS.white,true));}",
    'fallback projectile trail particles',
)
runtime = replace_once(
    runtime,
    "        if(p.split)for(let i=0;i<3;i++){const a=Math.atan2(p.vy,p.vx)+(i-1)*.58;spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*350,vy:Math.sin(a)*350,r:3.2,life:.62,maxRange:210,damage:p.damage*.34,color:'#ffb3d0',pierce:0,source:'star-spark'});}\n        if(p.fragment)for(let i=0;i<4;i++){const a=i/4*TAU+Math.atan2(p.vy,p.vx);spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*285,vy:Math.sin(a)*285,r:3.5,life:.65,maxRange:190,damage:p.damage*.25,color:'#d9fbff',pierce:0,source:'comet-fragment'});}",
    "        if(p.split){const splitAngle=Math.atan2(p.vy,p.vx);for(let i=0;i<3;i++){const a=splitAngle+(i-1)*.58;spawned.push(acquireProjectileSpawnDescriptor(p.x,p.y,Math.cos(a)*350,Math.sin(a)*350,3.2,.62,210,p.damage*.34,'#ffb3d0','star-spark'));}}\n        if(p.fragment){const fragmentAngle=Math.atan2(p.vy,p.vx);for(let i=0;i<4;i++){const a=i/4*TAU+fragmentAngle;spawned.push(acquireProjectileSpawnDescriptor(p.x,p.y,Math.cos(a)*285,Math.sin(a)*285,3.5,.65,190,p.damage*.25,'#d9fbff','comet-fragment'));}}",
    'fallback split fragment descriptors',
)
runtime = replace_once(
    runtime,
    "  for(const p of spawned)spawnPlayerProjectile(p);compactInPlace(state.entities.projectiles,p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&((p.x-player.x)**2+(p.y-player.y)**2)<4410000);trimOldest(state.entities.projectiles,entityCap('playerProjectiles'));",
    "  for(const p of spawned){spawnPlayerProjectile(p);recycleProjectileSpawnDescriptor(p);}spawned.length=0;compactInPlace(state.entities.projectiles,p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&((p.x-player.x)**2+(p.y-player.y)**2)<4410000);trimOldest(state.entities.projectiles,entityCap('playerProjectiles'));",
    'fallback descriptor recycle',
)
runtime = replace_once(runtime, "  compactInPlace(texts,keepTextEffect);", "  compactInPlace(texts,keepTextEffect,recycleTextEffect);", 'text effect recycle')
runtime = replace_once(runtime, "  compactInPlace(shockwaves,keepShockwaveEffect);", "  compactInPlace(shockwaves,keepShockwaveEffect,recycleShockwaveEffect);", 'shockwave effect recycle')
runtime_path.write_text(runtime, encoding='utf-8')

# performance-guard: optimize the actual runtime split/fragment hot path.
guard_path = Path('src/performance-guard.js')
guard = guard_path.read_text(encoding='utf-8').replace('\r\n', '\n')
guard = replace_once(
    guard,
    "          if(p.split&&(p.splitCount||0)<2){p.splitCount=(p.splitCount||0)+1;for(let i=0;i<3;i++){const a=Math.atan2(p.vy,p.vx)+(i-1)*.58;spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*350,vy:Math.sin(a)*350,r:3.1,life:.58,maxRange:210,damage:p.damage*.30,color:'#ffb3d0',pierce:0,source:'star-spark'});}}\n          if(p.fragment&&(p.fragmentCount||0)<2){p.fragmentCount=(p.fragmentCount||0)+1;for(let i=0;i<4;i++){const a=i/4*TAU+Math.atan2(p.vy,p.vx);spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*285,vy:Math.sin(a)*285,r:3.4,life:.60,maxRange:190,damage:p.damage*.22,color:'#d9fbff',pierce:0,source:'comet-fragment'});}}",
    "          if(p.split&&(p.splitCount||0)<2){p.splitCount=(p.splitCount||0)+1;const splitAngle=Math.atan2(p.vy,p.vx);for(let i=0;i<3;i++){const a=splitAngle+(i-1)*.58;spawned.push(acquireProjectileSpawnDescriptor(p.x,p.y,Math.cos(a)*350,Math.sin(a)*350,3.1,.58,210,p.damage*.30,'#ffb3d0','star-spark'));}}\n          if(p.fragment&&(p.fragmentCount||0)<2){p.fragmentCount=(p.fragmentCount||0)+1;const fragmentAngle=Math.atan2(p.vy,p.vx);for(let i=0;i<4;i++){const a=i/4*TAU+fragmentAngle;spawned.push(acquireProjectileSpawnDescriptor(p.x,p.y,Math.cos(a)*285,Math.sin(a)*285,3.4,.60,190,p.damage*.22,'#d9fbff','comet-fragment'));}}",
    'runtime split fragment descriptors',
)
guard = replace_once(
    guard,
    "    for(const projectile of spawned)spawnPlayerProjectile(projectile);\n    compactInPlace(state.entities.projectiles,keepLiveProjectile,recycleProjectile);",
    "    for(const projectile of spawned){spawnPlayerProjectile(projectile);recycleProjectileSpawnDescriptor(projectile);}spawned.length=0;\n    compactInPlace(state.entities.projectiles,keepLiveProjectile,recycleProjectile);",
    'runtime descriptor recycle',
)
guard_path.write_text(guard, encoding='utf-8')

# Add regression contracts without coupling to incidental formatting.
audit_path = Path('scripts/performance-audit-contract.mjs')
audit = audit_path.read_text(encoding='utf-8').replace('\r\n', '\n')
marker = "];\n\nlet failed=0;"
if marker not in audit:
    raise SystemExit('performance audit insertion marker missing')
check = " ['fixed-shape combat effects and split descriptors use bounded ownership-safe pools',systems.includes(\"const STACKFALL_EFFECT_TEXT_POOL_MARK=Symbol('stackfallEffectTextPool')\")&&systems.includes(\"const STACKFALL_SHOCKWAVE_POOL_MARK=Symbol('stackfallShockwavePool')\")&&systems.includes(\"const STACKFALL_PROJECTILE_DESCRIPTOR_MARK=Symbol('stackfallProjectileDescriptor')\")&&runtimeSystems.includes('compactInPlace(texts,keepTextEffect,recycleTextEffect)')&&runtimeSystems.includes('compactInPlace(shockwaves,keepShockwaveEffect,recycleShockwaveEffect)')&&runtimeSystems.includes('const PROJECTILE_SPAWN_FALLBACK_BUFFER=[],PROJECTILE_COLLISION_FALLBACK_BUFFER=[]')&&runtimeSystems.includes('state.entities.particles.push(acquireParticleObject(')&&guard.includes('spawned.push(acquireProjectileSpawnDescriptor(')&&guard.includes('for(const projectile of spawned){spawnPlayerProjectile(projectile);recycleProjectileSpawnDescriptor(projectile);}')&&guard.includes('const splitAngle=Math.atan2(p.vy,p.vx)')&&guard.includes('const fragmentAngle=Math.atan2(p.vy,p.vx)')&&!guard.includes(\"spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*350\")&&!guard.includes(\"spawned.push({x:p.x,y:p.y,vx:Math.cos(a)*285\")],\n"
audit = audit.replace(marker, check + marker, 1)
audit_path.write_text(audit, encoding='utf-8')
