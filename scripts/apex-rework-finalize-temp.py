from pathlib import Path

patterns_path=Path('src/boss-patterns.js')
patterns=patterns_path.read_text(encoding='utf-8')
old="const a=points[0],b=points[Math.floor(count/2)],c=points[1],q=points[(1+Math.floor(count/2))%count];rawLine(a.x,a.y,b.x,b.y,16+phase,d*.92,'#ffffff',life*.88,'constellation-link');rawLine(c.x,c.y,q.x,q.y,14+phase,d*.72,'#879be0',life*1.04,'constellation-link');"
new="const centerCut=e.phase*.031,ux=Math.cos(centerCut),uy=Math.sin(centerCut),half=radius*1.08;rawLine(cx-ux*half,cy-uy*half,cx+ux*half,cy+uy*half,16+phase,d*.92,'#ffffff',life*.88,'constellation-link');if(phase>=3){const px=-uy,py=ux;rawLine(cx-px*half*.92,cy-py*half*.92,cx+px*half*.92,cy+py*half*.92,13+phase,d*.66,'#879be0',life*1.04,'constellation-link');}"
if old not in patterns:
    raise SystemExit('constellation center cut anchor missing')
patterns=patterns.replace(old,new,1)
patterns_path.write_text(patterns,encoding='utf-8')

contract_path=Path('scripts/apex-encounter-contract.mjs')
contract=contract_path.read_text(encoding='utf-8')
anchor=" ['local constellation cage set piece replaces rotating sweep',bosses.includes('function startConstellationSweep')&&bosses.includes('function updateConstellationSweep')&&bosses.includes('constellationCage(e,sweep.damage')&&!bosses.includes('sweep.angle+=dt')],"
replacement=anchor+"\n ['constellation cage always crosses the captured player position',patterns.includes('const centerCut=e.phase*.031')&&patterns.includes('cx-ux*half')&&patterns.includes('cx+ux*half')],"
if anchor not in contract:
    raise SystemExit('apex cage contract anchor missing')
contract=contract.replace(anchor,replacement,1)
contract_path.write_text(contract,encoding='utf-8')

def replace_legacy_contract(path,name_a,old_a,new_a,name_b,old_b,new_b):
    src=path.read_text(encoding='utf-8')
    if old_a not in src:
        raise SystemExit(f'{name_a} anchor missing')
    src=src.replace(old_a,new_a,1)
    if old_b not in src:
        raise SystemExit(f'{name_b} anchor missing')
    src=src.replace(old_b,new_b,1)
    path.write_text(src,encoding='utf-8')

replace_legacy_contract(
    Path('scripts/polish-contract-check.mjs'),
    'polish tracking',
    "  ['apex tracking beam sweeps from an offset',bosses.includes('aim+side*(.92+phase*.07)')&&bosses.includes('angleToward(beam.angle,target,turnRate*dt)')],",
    "  ['apex chronophage scars force present-position movement',bosses.includes('scarCd')&&bosses.includes('addCircle(x,y,r,chase.damage')&&read('src/boss-patterns.js').includes('addCircle(now.x,now.y')],",
    'polish beams',
    "  ['continuous apex beams are visually throttled',bosses.includes('beam.visual=stressed?.070:.040')&&bosses.includes('sweep.visual=stressed?.075:.045')&&bosses.includes('network.visual=stressed?.085:.050')],",
    "  ['apex set pieces reject shared continuous beams',!bosses.includes('beam.visual=stressed?.070:.040')&&!bosses.includes('sweep.visual=stressed?.075:.045')&&bosses.includes('network.visual=stressed?.085:.050')],"
)

replace_legacy_contract(
    Path('scripts/endgame-balance-contract.mjs'),
    'endgame tracking',
    "expect('apex tracking beam starts offset and turns gradually',bosses.includes('aim+side*(.92+phase*.07)')&&bosses.includes(\"turnRate=beam.warmup>0?.48:.72\")&&bosses.includes('angleToward(beam.angle,target,turnRate*dt)'));",
    "expect('apex chronophage forces movement with delayed scars',bosses.includes('scarCd')&&bosses.includes('addCircle(x,y,r,chase.damage')&&read('src/boss-patterns.js').includes('addCircle(now.x,now.y'));",
    'endgame beams',
    "expect('continuous apex beams are visually throttled',bosses.includes('beam.visual=stressed?.070:.040')&&bosses.includes('sweep.visual=stressed?.075:.045')&&bosses.includes('network.visual=stressed?.085:.050'));",
    "expect('apex set pieces avoid shared continuous beams',!bosses.includes('beam.visual=stressed?.070:.040')&&!bosses.includes('sweep.visual=stressed?.075:.045')&&bosses.includes('network.visual=stressed?.085:.050'));"
)

perf_path=Path('scripts/performance-audit-contract.mjs')
perf=perf_path.read_text(encoding='utf-8')
old_perf=" ['standard combat beams reuse an ownership-safe bounded pool without absorbing special metadata beams',systems.includes(\"const STACKFALL_BEAM_POOL_MARK=Symbol('stackfallBeamPool'),BEAM_EFFECT_POOL=[],BEAM_EFFECT_POOL_LIMIT=192\")&&systems.includes('function spawnBeamEffect(x1,y1,x2,y2,life,color,width)')&&systems.includes('function clearBeamEffects(beams=state.entities.beams)')&&runtimeSystems.includes('compactInPlace(beams,keepBeamEffect,recycleBeamEffect)')&&runtimeSystems.includes(\"trimBeamEffects(beams,entityCap('beams'))\")&&weapons.includes('spawnBeamEffect(pos.x,pos.y,target.x,target.y,stressed?.13:.11,color,width)')&&bosses.includes(\"spawnBeamEffect(e.x,e.y,x2,y2,.075,active?'#e4fffb':'#79ffe1',width)\")&&bosses.includes(\"stageBossAttack:'fracture'\")],"
new_perf=" ['standard combat beams reuse an ownership-safe bounded fixed-schema pool while stage special metadata beams remain separate',systems.includes(\"const STACKFALL_BEAM_POOL_MARK=Symbol('stackfallBeamPool'),BEAM_EFFECT_POOL=[],BEAM_EFFECT_POOL_LIMIT=192\")&&systems.includes('function spawnBeamEffect(x1,y1,x2,y2,life,color,width)')&&systems.includes('function clearBeamEffects(beams=state.entities.beams)')&&systems.includes('effect.x1=x1;effect.y1=y1;effect.x2=x2;effect.y2=y2;effect.life=life;effect.max=life;effect.color=color;effect.width=width')&&runtimeSystems.includes('compactInPlace(beams,keepBeamEffect,recycleBeamEffect)')&&runtimeSystems.includes(\"trimBeamEffects(beams,entityCap('beams'))\")&&weapons.includes('spawnBeamEffect(pos.x,pos.y,target.x,target.y,stressed?.13:.11,color,width)')&&bosses.includes(\"stageBossAttack:'fracture'\")],"
if old_perf not in perf:
    raise SystemExit('legacy beam pool performance contract missing')
perf=perf.replace(old_perf,new_perf,1)
perf_path.write_text(perf,encoding='utf-8')
print('apex rework finalizer applied')
