import fs from 'node:fs';

function replaceOnce(path, oldText, newText) {
  const text=fs.readFileSync(path,'utf8');
  const first=text.indexOf(oldText);
  if(first<0)throw new Error(`${path}: patch target not found`);
  if(text.indexOf(oldText,first+oldText.length)>=0)throw new Error(`${path}: patch target not unique`);
  fs.writeFileSync(path,text.slice(0,first)+newText+text.slice(first+oldText.length));
}

const oldSpawnParticle=`function spawnParticle(x,y,color,count=6,speed=120,size=3){const room=Math.max(0,entityCap('particles')-state.entities.particles.length),actual=Math.min(count,room);for(let i=0;i<actual;i++){const a=Math.random()*TAU,s=rand(speed*.35,speed);state.entities.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.22,.62),max:.62,size:rand(size*.5,size),color,star:Math.random()<.28});}}`;
const newSpawnParticle=`const STACKFALL_PARTICLE_POOL_MARK=Symbol('stackfallParticlePool'),PARTICLE_OBJECT_POOL=[],PARTICLE_OBJECT_POOL_LIMIT=520;\nfunction acquireParticleObject(x,y,vx,vy,life,max,size,color,star){const p=PARTICLE_OBJECT_POOL.pop()||{[STACKFALL_PARTICLE_POOL_MARK]:true,x:0,y:0,vx:0,vy:0,life:0,max:0,size:0,color:'#fff',star:false};p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.life=life;p.max=max;p.size=size;p.color=color;p.star=star;return p;}\nfunction recycleParticleObject(p){if(p?.[STACKFALL_PARTICLE_POOL_MARK]===true&&PARTICLE_OBJECT_POOL.length<PARTICLE_OBJECT_POOL_LIMIT)PARTICLE_OBJECT_POOL.push(p);}\nfunction spawnParticle(x,y,color,count=6,speed=120,size=3){const room=Math.max(0,entityCap('particles')-state.entities.particles.length),actual=Math.min(count,room);for(let i=0;i<actual;i++){const a=Math.random()*TAU,s=rand(speed*.35,speed),life=rand(.22,.62);state.entities.particles.push(acquireParticleObject(x,y,Math.cos(a)*s,Math.sin(a)*s,life,.62,rand(size*.5,size),color,Math.random()<.28));}}`;
replaceOnce('src/systems-base.js',oldSpawnParticle,newSpawnParticle);

replaceOnce('src/systems.js',
`function updateProjectiles(dt){\n  const spawned=[],collisionCandidates=[];`,
`const PROJECTILE_TRAIL_SOURCES=new Set(['ember','echo-star','comet','echo-comet','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter']);\nfunction updateProjectiles(dt){\n  const spawned=[],collisionCandidates=[];`);

replaceOnce('src/systems.js',
`if(p.life>0&&p.trailTick<=0&&['ember','echo-star','comet','echo-comet','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter'].includes(p.source)){`,
`if(p.life>0&&p.trailTick<=0&&PROJECTILE_TRAIL_SOURCES.has(p.source)){`);

replaceOnce('src/systems.js',
`compactInPlace(state.entities.projectiles,p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.hypot(p.x-player.x,p.y-player.y)<2100);`,
`compactInPlace(state.entities.projectiles,p=>p&&p.life>0&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&((p.x-player.x)**2+(p.y-player.y)**2)<4410000);`);

replaceOnce('src/systems.js',
`  compactInPlace(particles,keepParticleEffect);`,
`  compactInPlace(particles,keepParticleEffect,recycleParticleObject);`);

const perfPath='scripts/performance-audit-contract.mjs';
let perf=fs.readFileSync(perfPath,'utf8');
const marker=` ['gem magnet update avoids sqrt until a gem enters magnet range',runtimeSystems.includes('const dx=player.x-g.x,dy=player.y-g.y,d2=dx*dx+dy*dy')&&runtimeSystems.includes('if(d2<range2){const d=Math.sqrt(d2)||1')],\n`;
if(!perf.includes(marker))throw new Error('performance contract marker not found');
perf=perf.replace(marker,marker+
` ['spawnParticle reuses only its own standard particle objects through a bounded pool',systems.includes("const STACKFALL_PARTICLE_POOL_MARK=Symbol('stackfallParticlePool'),PARTICLE_OBJECT_POOL=[],PARTICLE_OBJECT_POOL_LIMIT=520")&&systems.includes('state.entities.particles.push(acquireParticleObject(')&&runtimeSystems.includes('compactInPlace(particles,keepParticleEffect,recycleParticleObject)')],\n`+
` ['player projectile hot loop uses a stable trail-source Set and squared lifetime culling',runtimeSystems.includes('const PROJECTILE_TRAIL_SOURCES=new Set(')&&runtimeSystems.includes('PROJECTILE_TRAIL_SOURCES.has(p.source)')&&runtimeSystems.includes('((p.x-player.x)**2+(p.y-player.y)**2)<4410000')&&!runtimeSystems.includes("['ember','echo-star','comet','echo-comet','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter'].includes(p.source)")&&!runtimeSystems.includes('Math.hypot(p.x-player.x,p.y-player.y)<2100')],\n`);
fs.writeFileSync(perfPath,perf);
