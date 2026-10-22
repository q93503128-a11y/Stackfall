import fs from 'node:fs';

function replaceOnce(path, oldText, newText) {
  const text=fs.readFileSync(path,'utf8');
  const first=text.indexOf(oldText);
  if(first<0)throw new Error(`${path}: patch target not found`);
  if(text.indexOf(oldText,first+oldText.length)>=0)throw new Error(`${path}: patch target not unique`);
  fs.writeFileSync(path,text.slice(0,first)+newText+text.slice(first+oldText.length));
}

replaceOnce('src/performance-guard.js',
  "  const projectileSpawnBuffer=[],projectileCollisionBuffer=[],projectileTrailBuffer=[],wellHitBuffer=[];\n",
  "  const projectileSpawnBuffer=[],projectileCollisionBuffer=[],projectileTrailBuffer=[],wellHitBuffer=[];\n  const PROJECTILE_TRAIL_SOURCE_SET=new Set(['ember','echo-star','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter']);\n");

replaceOnce('src/performance-guard.js',
  "      const source=String(p.source||'');p.source=source;const cometTrail=source.includes('comet'),trailSource=cometTrail||['ember','echo-star','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter'].includes(source);",
  "      const source=String(p.source||'');p.source=source;const cometTrail=source.includes('comet'),trailSource=cometTrail||PROJECTILE_TRAIL_SOURCE_SET.has(source);");

replaceOnce('src/performance-guard.js',
  "      if(p.life>0&&p.trailTick<=0&&trailSource&&state.entities.particles.length<particleCap&&!heavyFrame&&GAME_SETTINGS.hideProjectiles!==true){p.trailTick=compactDevice()?.09:cometTrail?.052:.075;state.entities.particles.push({x:p.x-p.vx*.018,y:p.y-p.vy*.018,vx:rand(-10,10),vy:rand(-10,10),life:cometTrail?.26:.16,max:cometTrail?.26:.16,size:cometTrail?rand(1.8,3.2):rand(.9,2),color:p.color||COLORS.white,star:true});}",
  "      if(p.life>0&&p.trailTick<=0&&trailSource&&state.entities.particles.length<particleCap&&!heavyFrame&&GAME_SETTINGS.hideProjectiles!==true){p.trailTick=compactDevice()?.09:cometTrail?.052:.075;const trailLife=cometTrail?.26:.16;state.entities.particles.push(acquireParticleObject(p.x-p.vx*.018,p.y-p.vy*.018,rand(-10,10),rand(-10,10),trailLife,trailLife,cometTrail?rand(1.8,3.2):rand(.9,2),p.color||COLORS.white,true));}");

const perfPath='scripts/performance-audit-contract.mjs';
let perf=fs.readFileSync(perfPath,'utf8');
const marker=" ['player projectile hot loop uses a stable trail-source Set and squared lifetime culling',runtimeSystems.includes('const PROJECTILE_TRAIL_SOURCES=new Set(')&&runtimeSystems.includes('PROJECTILE_TRAIL_SOURCES.has(p.source)')&&runtimeSystems.includes('((p.x-player.x)**2+(p.y-player.y)**2)<4410000')&&!runtimeSystems.includes(\"['ember','echo-star','comet','echo-comet','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter'].includes(p.source)\")&&!runtimeSystems.includes('Math.hypot(p.x-player.x,p.y-player.y)<2100')],\n";
if(!perf.includes(marker))throw new Error('performance contract marker not found');
perf=perf.replace(marker,marker+" ['spatial projectile runtime reuses pooled trail particles and a stable trail-source Set',guard.includes('const PROJECTILE_TRAIL_SOURCE_SET=new Set(')&&guard.includes('PROJECTILE_TRAIL_SOURCE_SET.has(source)')&&guard.includes('state.entities.particles.push(acquireParticleObject(')&&!guard.includes(\"trailSource=cometTrail||['ember','echo-star','core','core-echo','star-spark','wave','meteor-drone','echo-drone','drone-burst','spiral-bolt','echo-spiral','mirror-return','mirror-counter'].includes(source)\")],\n");
fs.writeFileSync(perfPath,perf);
