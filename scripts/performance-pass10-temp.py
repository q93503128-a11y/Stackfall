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

# systems-base.js: ownership-safe standard beam pool. Special beams with extra fields remain raw objects.
path = 'src/systems-base.js'
text = read(path)
old = "function shockwave(x,y,color,maxR=100,life=.35,width=3){if(state.entities.shockwaves.length>=entityCap('shockwaves'))recycleShockwaveEffect(state.entities.shockwaves.shift());state.entities.shockwaves.push(acquireShockwaveEffect(x,y,color,maxR,life,width));}\nfunction dealDamage(enemy,amount,opts={})"
new = "function shockwave(x,y,color,maxR=100,life=.35,width=3){if(state.entities.shockwaves.length>=entityCap('shockwaves'))recycleShockwaveEffect(state.entities.shockwaves.shift());state.entities.shockwaves.push(acquireShockwaveEffect(x,y,color,maxR,life,width));}\nconst STACKFALL_BEAM_POOL_MARK=Symbol('stackfallBeamPool'),BEAM_EFFECT_POOL=[],BEAM_EFFECT_POOL_LIMIT=192;\nfunction acquireBeamEffect(x1,y1,x2,y2,life,color,width){const effect=BEAM_EFFECT_POOL.pop()||{[STACKFALL_BEAM_POOL_MARK]:true,x1:0,y1:0,x2:0,y2:0,life:0,max:0,color:'#fff',width:1};effect.x1=x1;effect.y1=y1;effect.x2=x2;effect.y2=y2;effect.life=life;effect.max=life;effect.color=color;effect.width=width;return effect;}\nfunction recycleBeamEffect(effect){if(effect?.[STACKFALL_BEAM_POOL_MARK]===true&&BEAM_EFFECT_POOL.length<BEAM_EFFECT_POOL_LIMIT)BEAM_EFFECT_POOL.push(effect);}\nfunction spawnBeamEffect(x1,y1,x2,y2,life,color,width){const beams=state.entities.beams;if(beams.length>=entityCap('beams'))recycleBeamEffect(beams.shift());const effect=acquireBeamEffect(x1,y1,x2,y2,life,color,width);beams.push(effect);return effect;}\nfunction trimBeamEffects(beams,max){if(beams.length<=max)return;const remove=beams.length-max;for(let i=0;i<remove;i++)recycleBeamEffect(beams[i]);beams.splice(0,remove);}\nfunction clearBeamEffects(beams=state.entities.beams){if(!beams)return;for(let i=0;i<beams.length;i++)recycleBeamEffect(beams[i]);beams.length=0;}\nfunction dealDamage(enemy,amount,opts={})"
text = replace_once(text, old, new, 'systems-base beam pool insertion')
write(path, text)

# systems.js: recycle owned beams on expiry and cap trimming.
path = 'src/systems.js'
text = read(path)
text = replace_once(text, "compactInPlace(beams,keepBeamEffect);", "compactInPlace(beams,keepBeamEffect,recycleBeamEffect);", 'systems beam recycle')
text = replace_once(text, "trimOldest(state.entities.telegraphs,entityCap('telegraphs'));trimOldest(beams,entityCap('beams'));", "trimOldest(state.entities.telegraphs,entityCap('telegraphs'));trimBeamEffects(beams,entityCap('beams'));", 'systems beam cap recycle')
write(path, text)

# performance-guard.js: retain default copy semantics, but allow explicit caller-owned output buffers.
path = 'src/performance-guard.js'
text = read(path)
old = """  function nearestIndexedEnemies(x,y,count,excluded=null,maxRange=Infinity){
    if(!grid.size)rebuildEnemyGrid();
    nearestQueryX=x;nearestQueryY=y;nearestQueryCount=Math.max(0,Math.floor(count));nearestQueryLimit=Number.isFinite(maxRange)?maxRange*maxRange:Infinity;nearestQueryExcluded=excluded;
    nearestEnemyBuffer.length=0;nearestDistanceBuffer.length=0;
    if(Number.isFinite(maxRange))forEachNearbyEnemy(x,y,maxRange,considerNearestEnemy);else for(const enemy of enemyIndex.values())considerNearestEnemy(enemy);
    return nearestEnemyBuffer.slice();
  }"""
new = """  function nearestIndexedEnemies(x,y,count,excluded=null,maxRange=Infinity,out=null){
    if(!grid.size)rebuildEnemyGrid();
    nearestQueryX=x;nearestQueryY=y;nearestQueryCount=Math.max(0,Math.floor(count));nearestQueryLimit=Number.isFinite(maxRange)?maxRange*maxRange:Infinity;nearestQueryExcluded=excluded;
    nearestEnemyBuffer.length=0;nearestDistanceBuffer.length=0;
    if(Number.isFinite(maxRange))forEachNearbyEnemy(x,y,maxRange,considerNearestEnemy);else for(const enemy of enemyIndex.values())considerNearestEnemy(enemy);
    if(Array.isArray(out)){out.length=nearestEnemyBuffer.length;for(let i=0;i<nearestEnemyBuffer.length;i++)out[i]=nearestEnemyBuffer[i];return out;}
    return nearestEnemyBuffer.slice();
  }"""
text = replace_once(text, old, new, 'guard nearest output buffer')
write(path, text)

# weapons.js: stable small buffers + standard beam helper.
path = 'src/weapons.js'
text = read(path)
old = "const PRISM_POSITION_BUFFER=Array.from({length:5},()=>({x:0,y:0,a:0})),PRISM_POSITION_VIEWS=Array.from({length:6},(_,count)=>PRISM_POSITION_BUFFER.slice(0,count)),PRISM_USED_TARGETS=new Set(),VACUUM_NEARBY_BUFFER=[],MINE_NEARBY_BUFFER=[],WIRE_NEARBY_BUFFER=[];"
new = "const PRISM_POSITION_BUFFER=Array.from({length:5},()=>({x:0,y:0,a:0})),PRISM_POSITION_VIEWS=Array.from({length:6},(_,count)=>PRISM_POSITION_BUFFER.slice(0,count)),PRISM_USED_TARGETS=new Set(),VACUUM_NEARBY_BUFFER=[],MINE_NEARBY_BUFFER=[],WIRE_NEARBY_BUFFER=[],DRONE_POSITION_BUFFER=Array.from({length:3},()=>({x:0,y:0,a:0})),DRONE_POSITION_VIEWS=Array.from({length:4},(_,count)=>DRONE_POSITION_BUFFER.slice(0,count)),DRONE_TARGET_BUFFER=[],MIRROR_TARGET_BUFFER=[],MIRV_TARGET_BUFFER=[],NEAREST_ENEMY_DISTANCE_BUFFER=[],MIRV_EXCLUDED_TARGETS=new Set();"
text = replace_once(text, old, new, 'weapons buffer constants')
old = "function meteorDronePositions(stacks){const count=stacks>=6?3:stacks>=2?2:1,orbit=orbitRadiusFor('drone'),points=[];for(let i=0;i<count;i++){const a=player.angle*.68+i*TAU/count;points.push({x:player.x+Math.cos(a)*orbit,y:player.y+Math.sin(a)*orbit,a});}return points;}"
new = "function meteorDronePositions(stacks){const count=stacks>=6?3:stacks>=2?2:1,orbit=orbitRadiusFor('drone');for(let i=0;i<count;i++){const point=DRONE_POSITION_BUFFER[i],a=player.angle*.68+i*TAU/count;point.x=player.x+Math.cos(a)*orbit;point.y=player.y+Math.sin(a)*orbit;point.a=a;}return DRONE_POSITION_VIEWS[count];}"
text = replace_once(text, old, new, 'drone position buffer')
old = "function nearestEnemies(x,y,count,excluded=null,maxRange=Infinity){if(typeof performanceNearestEnemies==='function')return performanceNearestEnemies(x,y,count,excluded,maxRange);const limit=Number.isFinite(maxRange)?maxRange*maxRange:Infinity,out=[];for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||excluded?.has(enemy.id))continue;const distance=(enemy.x-x)**2+(enemy.y-y)**2;if(distance>limit)continue;let index=out.length;while(index>0&&out[index-1].distance>distance)index--;out.splice(index,0,{enemy,distance});if(out.length>count)out.pop();}return out.map(entry=>entry.enemy);}"
new = "function nearestEnemies(x,y,count,excluded=null,maxRange=Infinity,resultOut=null){if(typeof performanceNearestEnemies==='function')return performanceNearestEnemies(x,y,count,excluded,maxRange,resultOut);const limit=Number.isFinite(maxRange)?maxRange*maxRange:Infinity,out=Array.isArray(resultOut)?resultOut:[],distances=NEAREST_ENEMY_DISTANCE_BUFFER;out.length=0;distances.length=0;for(const enemy of state.entities.enemies){if(!enemy||enemy.dead||excluded?.has(enemy.id))continue;const distance=(enemy.x-x)**2+(enemy.y-y)**2;if(distance>limit)continue;let index=out.length;while(index>0&&distances[index-1]>distance)index--;out.splice(index,0,enemy);distances.splice(index,0,distance);if(out.length>count){out.pop();distances.pop();}}return out;}"
text = replace_once(text, old, new, 'nearest enemies caller buffer')
replacements = [
("targets=nearestEnemies(player.x,player.y,positions.length*2,null,weaponRange('drone'))", "targets=nearestEnemies(player.x,player.y,positions.length*2,null,weaponRange('drone'),DRONE_TARGET_BUFFER)", 'drone target buffer'),
("const targets=nearestEnemies(player.x,player.y,mirrorN>=6?6:3,null,weaponRange('mirror'));", "const targets=nearestEnemies(player.x,player.y,mirrorN>=6?6:3,null,weaponRange('mirror'),MIRROR_TARGET_BUFFER);", 'mirror target buffer'),
("const candidates=nearestEnemies(m.x,m.y,5,new Set([target?.id]),260),sideTargets=[candidates[0]||target,candidates[1]||target];for(let i=0;i<2;i++){const t=sideTargets[i];", "MIRV_EXCLUDED_TARGETS.clear();if(target?.id!=null)MIRV_EXCLUDED_TARGETS.add(target.id);const candidates=nearestEnemies(m.x,m.y,5,MIRV_EXCLUDED_TARGETS,260,MIRV_TARGET_BUFFER);for(let i=0;i<2;i++){const t=candidates[i]||target;", 'mirv target buffers'),
("state.entities.beams.push({x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,life:stressed?.13:.11,max:stressed?.13:.11,color,width});", "spawnBeamEffect(pos.x,pos.y,target.x,target.y,stressed?.13:.11,color,width);", 'prism focus beam'),
("state.entities.beams.push({x1,y1,x2,y2,life:.20,max:.20,color:'#fff6d7',width:3.1*size});", "spawnBeamEffect(x1,y1,x2,y2,.20,'#fff6d7',3.1*size);", 'prism overheat beam'),
("state.entities.beams.push({x1:pos.x,y1:pos.y,x2:target.x,y2:target.y,life:.16,max:.16,color:echoed?COLORS.pink:'#f2d5ff',width:(3.2+prismN*.18)*size});", "spawnBeamEffect(pos.x,pos.y,target.x,target.y,.16,echoed?COLORS.pink:'#f2d5ff',(3.2+prismN*.18)*size);", 'prism echo beam'),
("state.entities.beams.push({x1:from.x,y1:from.y,x2:target.x,y2:target.y,life:.18,max:.18,color,width:beamWidth+(i===0?1.1:0)});", "spawnBeamEffect(from.x,from.y,target.x,target.y,.18,color,beamWidth+(i===0?1.1:0));", 'ion beam'),
("function applyRailBeam(x1,y1,x2,y2,width,damage,color,source,eliteBonus=1){state.entities.beams.push({x1,y1,x2,y2,life:.20,max:.20,color,width});", "function applyRailBeam(x1,y1,x2,y2,width,damage,color,source,eliteBonus=1){spawnBeamEffect(x1,y1,x2,y2,.20,color,width);", 'rail beam'),
("state.entities.beams.push({x1:b.x,y1:b.y,x2:target.x,y2:target.y,life:.12,max:.12,color:'#dce2ff',width:2.1*size});", "spawnBeamEffect(b.x,b.y,target.x,target.y,.12,'#dce2ff',2.1*size);", 'gate exit beam'),
]
for old, new, label in replacements:
    text = replace_once(text, old, new, label)
write(path, text)

# bosses.js: route standard high-frequency beams through the safe pool; preserve fracture beam with extra metadata.
path = 'src/bosses.js'
text = read(path)
replacements = [
("state.entities.beams.push({x1:e.x,y1:e.y,x2,y2,life:.075,max:.075,color:active?'#e4fffb':'#79ffe1',width});", "spawnBeamEffect(e.x,e.y,x2,y2,.075,active?'#e4fffb':'#79ffe1',width);", 'chrono pursuit beam'),
("if(draw)state.entities.beams.push({x1:e.x,y1:e.y,x2,y2,life:.075,max:.075,color:i%2?'#879be0':'#f0f4ff',width});", "if(draw)spawnBeamEffect(e.x,e.y,x2,y2,.075,i%2?'#879be0':'#f0f4ff',width);", 'constellation sweep beam'),
("if(state.entities.beams.length>=entityCap('beams'))state.entities.beams.shift();state.entities.beams.push({x1:t.x,y1:t.y,x2,y2,life:nullGrid?.28:.22,max:nullGrid?.28:.22,color:t.color,width});", "spawnBeamEffect(t.x,t.y,x2,y2,nullGrid?.28:.22,t.color,width);", 'telegraph impact beam'),
("state.entities.beams.push({x1:t.x,y1:t.y,x2,y2,life:.14,max:.14,color:t.color,width:Math.max(1.2,t.width*.24)});", "spawnBeamEffect(t.x,t.y,x2,y2,.14,t.color,Math.max(1.2,t.width*.24));", 'cosmetic telegraph beam'),
("state.entities.beams?.splice(0);", "clearBeamEffects();", 'apex field beam clear'),
("state.entities.beams.push({x1:e.x,y1:e.y,x2:cx,y2:cy,life:1.15+i*.012,max:1.15+i*.012,color,width:e.type==='boss'?5:2});", "spawnBeamEffect(e.x,e.y,cx,cy,1.15+i*.012,color,e.type==='boss'?5:2);", 'apex clear starforge beam'),
("state.entities.beams.push({x1:e.x,y1:e.y,x2:cx+Math.cos(i)*180,y2:cy+Math.sin(i)*180,life:.9,max:.9,color,width:1.5});", "spawnBeamEffect(e.x,e.y,cx+Math.cos(i)*180,cy+Math.sin(i)*180,.9,color,1.5);", 'apex clear constellation beam'),
("state.entities.beams.push({x1:star.x,y1:star.y,x2:target.x,y2:target.y,life:.10,max:.10,color:'#ffcf6a',width:3.2+star.stacks*.35});", "spawnBeamEffect(star.x,star.y,target.x,target.y,.10,'#ffcf6a',3.2+star.stacks*.35);", 'starforge legacy beam'),
("state.entities.beams.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,life:.075,max:.075,color:i%2?'#dce6ff':'#879be0',width:2.2+stacks*.22});", "spawnBeamEffect(a.x,a.y,b.x,b.y,.075,i%2?'#dce6ff':'#879be0',2.2+stacks*.22);", 'constellation legacy lattice beam'),
("state.entities.beams.push({x1:p.x,y1:p.y,x2:target.x,y2:target.y,life:.13,max:.13,color:'#f0f4ff',width:3+stacks*.22});", "spawnBeamEffect(p.x,p.y,target.x,target.y,.13,'#f0f4ff',3+stacks*.22);", 'constellation legacy attack beam'),
("state.entities.beams.length=0;state.apexArena=null;", "clearBeamEffects();state.apexArena=null;", 'apex finish beam clear'),
]
for old, new, label in replacements:
    text = replace_once(text, old, new, label)
write(path, text)

# performance contract: pin ownership-safe pooling and caller-buffer semantics.
path = 'scripts/performance-audit-contract.mjs'
text = read(path)
insert = """ ['standard combat beams reuse an ownership-safe bounded pool without absorbing special metadata beams',systems.includes(\"const STACKFALL_BEAM_POOL_MARK=Symbol('stackfallBeamPool'),BEAM_EFFECT_POOL=[],BEAM_EFFECT_POOL_LIMIT=192\")&&systems.includes('function spawnBeamEffect(x1,y1,x2,y2,life,color,width)')&&systems.includes('function clearBeamEffects(beams=state.entities.beams)')&&runtimeSystems.includes('compactInPlace(beams,keepBeamEffect,recycleBeamEffect)')&&runtimeSystems.includes('trimBeamEffects(beams,entityCap(\'beams\'))')&&weapons.includes('spawnBeamEffect(pos.x,pos.y,target.x,target.y,stressed?.13:.11,color,width)')&&bosses.includes("spawnBeamEffect(e.x,e.y,x2,y2,.075,active?'#e4fffb':'#79ffe1',width)")&&bosses.includes("stageBossAttack:'fracture'")],
 ['nearest multi-target and drone hot paths support caller-owned reusable buffers',guard.includes('function nearestIndexedEnemies(x,y,count,excluded=null,maxRange=Infinity,out=null)')&&guard.includes('if(Array.isArray(out)){out.length=nearestEnemyBuffer.length')&&weapons.includes('DRONE_POSITION_BUFFER=Array.from({length:3}')&&weapons.includes('DRONE_TARGET_BUFFER=[]')&&weapons.includes('MIRROR_TARGET_BUFFER=[]')&&weapons.includes('MIRV_TARGET_BUFFER=[]')&&weapons.includes("performanceNearestEnemies(x,y,count,excluded,maxRange,resultOut)")&&weapons.includes("weaponRange('drone'),DRONE_TARGET_BUFFER")&&weapons.includes("weaponRange('mirror'),MIRROR_TARGET_BUFFER")&&weapons.includes('MIRV_EXCLUDED_TARGETS,260,MIRV_TARGET_BUFFER')&&!weapons.includes('new Set([target?.id])')],
"""
needle = "\n];\n\nlet failed=0;"
if needle not in text:
    raise SystemExit('performance contract closing marker missing')
text = text.replace(needle, '\n' + insert + '];\n\nlet failed=0;', 1)
write(path, text)
