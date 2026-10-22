from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

systems_path = Path('src/systems-base.js')
systems = systems_path.read_text(encoding='utf-8').replace('\r\n', '\n')

systems = replace_once(
    systems,
    "function updatePendingActions(dt){\n  const pending=state.pendingActions;if(!pending?.length||state.mode!=='playing')return;\n  const currentRun=state.runSerial,due=[],initial=pending.length;let write=0;",
    "const PENDING_ACTION_DUE=[];\nfunction updatePendingActions(dt){\n  const pending=state.pendingActions;if(!pending?.length||state.mode!=='playing')return;\n  const currentRun=state.runSerial,due=PENDING_ACTION_DUE,initial=pending.length;due.length=0;let write=0;",
    'pending action due buffer',
)

old_enemy_config = "function enemyConfig(type){const t=state.time||0,threat=1+Math.floor(t/60),baseScale=enemyHpMult(),configs={grunt:{r:13,hp:22,speed:50,damage:6,color:'#7769ff',xp:3,name:'공허 유체'},fast:{r:11,hp:17,speed:82,damage:5,color:'#ff4f9a',xp:3,name:'추적 혜성'},ranged:{r:15,hp:34,speed:45,damage:7,color:'#ff6f7d',xp:5,name:'성운 포격체'},tank:{r:22,hp:82,speed:31,damage:10,color:'#ff9f43',xp:8,name:'성간 보루'},mini:{r:34,hp:420,speed:43,damage:14,color:'#d85cff',xp:42,name:'균열의 기사'},boss:{r:58,hp:1850,speed:30,damage:18,color:'#ff536f',xp:160,name:'일식의 군주'}},c=configs[type]||configs.grunt,tier=type==='mini'?1+t/820:type==='boss'?1+t/700:1,damageScale=1+Math.min(.45,t/1500)+Math.max(0,threat-1)*.015;return{...c,hp:c.hp*baseScale*tier,damage:c.damage*damageScale};}"
new_enemy_config = "const ENEMY_BASE_CONFIGS={grunt:{r:13,hp:22,speed:50,damage:6,color:'#7769ff',xp:3,name:'공허 유체'},fast:{r:11,hp:17,speed:82,damage:5,color:'#ff4f9a',xp:3,name:'추적 혜성'},ranged:{r:15,hp:34,speed:45,damage:7,color:'#ff6f7d',xp:5,name:'성운 포격체'},tank:{r:22,hp:82,speed:31,damage:10,color:'#ff9f43',xp:8,name:'성간 보루'},mini:{r:34,hp:420,speed:43,damage:14,color:'#d85cff',xp:42,name:'균열의 기사'},boss:{r:58,hp:1850,speed:30,damage:18,color:'#ff536f',xp:160,name:'일식의 군주'}};\nconst ELITE_SPAWN_KINDS=new Set(['mini','boss','void','apex']),ELITE_TWIN_FORMS=new Set(['mirror','paradox']);\nfunction enemyConfig(type){const t=state.time||0,threat=1+Math.floor(t/60),baseScale=enemyHpMult(),c=ENEMY_BASE_CONFIGS[type]||ENEMY_BASE_CONFIGS.grunt,tier=type==='mini'?1+t/820:type==='boss'?1+t/700:1,damageScale=1+Math.min(.45,t/1500)+Math.max(0,threat-1)*.015;return{...c,hp:c.hp*baseScale*tier,damage:c.damage*damageScale};}"
systems = replace_once(systems, old_enemy_config, new_enemy_config, 'enemy base config table')

systems = replace_once(
    systems,
    "const elite=['mini','boss','void','apex'].includes(kind),cap=entityCap('enemies'),normalCap=Math.max(24,cap-7);",
    "const elite=ELITE_SPAWN_KINDS.has(kind),cap=entityCap('enemies'),normalCap=Math.max(24,cap-7);",
    'enemy room elite set',
)

systems = replace_once(
    systems,
    "if(!enemy||!['mirror','paradox'].includes(enemy.eliteForm))return null;",
    "if(!enemy||!ELITE_TWIN_FORMS.has(enemy.eliteForm))return null;",
    'elite twin form set',
)

systems = replace_once(
    systems,
    "if(!makeEnemyRoom(kind))return null;const a=Math.random()*TAU,radius=Math.min(Math.max(vw,vh)*.52,690)+rand(50,150),eliteKind=['mini','boss','void','apex'].includes(kind)?kind:null;let type;",
    "if(!makeEnemyRoom(kind))return null;const a=Math.random()*TAU,radius=Math.min(Math.max(vw,vh)*.52,690)+rand(50,150),eliteKind=ELITE_SPAWN_KINDS.has(kind)?kind:null;let type;",
    'spawn enemy elite set',
)

old_compress = """function compressExperience(){
  const gems=state.entities.gems,cap=entityCap('gems');if(!gems||gems.length<=cap)return;if(cap<=0){gems.length=0;return;}
  const ranked=gems.filter(Boolean).sort((a,b)=>((a.x-player.x)**2+(a.y-player.y)**2)-((b.x-player.x)**2+(b.y-player.y)**2)),keep=ranked.slice(0,cap),overflow=ranked.slice(cap);
  for(const far of overflow){
    if(!keep.length)break;let anchor=keep[0],best=Infinity;
    for(const near of keep){const dx=near.x-far.x,dy=near.y-far.y,d2=dx*dx+dy*dy;if(d2<best){best=d2;anchor=near;}}
    const amount=Math.max(0,Number(far.value)||0);anchor.value=(Number(anchor.value)||0)+amount;anchor.compressedValue=(anchor.compressedValue||0)+amount;anchor.r=experienceGemRadius(anchor.value,Math.max(Number(anchor.r)||4,Number(far.r)||4));anchor.life=Math.max(Number(anchor.life)||0,Number(far.life)||0,35);anchor.pulse=(anchor.pulse||0)+.55;
  }
  gems.length=0;gems.push(...keep);
}"""
new_compress = """function compressExperience(){
  const gems=state.entities.gems,cap=entityCap('gems');if(!gems||gems.length<=cap)return;if(cap<=0){gems.length=0;return;}
  const ranked=EXPERIENCE_ANCHORS;ranked.length=0;for(let i=0;i<gems.length;i++){const gem=gems[i];if(gem)ranked.push(gem);}ranked.sort((a,b)=>((a.x-player.x)**2+(a.y-player.y)**2)-((b.x-player.x)**2+(b.y-player.y)**2));
  const keepCount=Math.min(cap,ranked.length);
  if(keepCount>0)for(let farIndex=keepCount;farIndex<ranked.length;farIndex++){
    const far=ranked[farIndex];let anchor=ranked[0],best=Infinity;
    for(let nearIndex=0;nearIndex<keepCount;nearIndex++){const near=ranked[nearIndex],dx=near.x-far.x,dy=near.y-far.y,d2=dx*dx+dy*dy;if(d2<best){best=d2;anchor=near;}}
    const amount=Math.max(0,Number(far.value)||0);anchor.value=(Number(anchor.value)||0)+amount;anchor.compressedValue=(anchor.compressedValue||0)+amount;anchor.r=experienceGemRadius(anchor.value,Math.max(Number(anchor.r)||4,Number(far.r)||4));anchor.life=Math.max(Number(anchor.life)||0,Number(far.life)||0,35);anchor.pulse=(anchor.pulse||0)+.55;
  }
  gems.length=keepCount;for(let i=0;i<keepCount;i++)gems[i]=ranked[i];ranked.length=0;
}"""
systems = replace_once(systems, old_compress, new_compress, 'experience compression buffer reuse')

systems_path.write_text(systems, encoding='utf-8')

audit_path = Path('scripts/performance-audit-contract.mjs')
audit = audit_path.read_text(encoding='utf-8').replace('\r\n', '\n')
needle = " ['Canvas projectile and gem hot loops cache color validation reuse simulated heading and avoid gem screen-point allocations',entities.includes('const PROJECTILE_COLOR_VALIDITY_CACHE=new Map(),PROJECTILE_COLOR_VALIDITY_CACHE_LIMIT=96')&&entities.includes('PROJECTILE_COLOR_VALIDITY_CACHE.get(raw)')&&entities.includes('Number.isFinite(p.heading)?p.heading:Math.atan2')&&entities.includes('const sx=g.x-player.x+vw/2,sy=g.y-player.y+vh/2')&&!entities.includes('const p=worldToScreen(g.x,g.y)')&&!entities.includes(\"typeof p.color!=='string'||!CSS.supports('color',p.color)\")],"
addition = needle + "\n ['spawn and overflow GC paths reuse pending-action and experience buffers plus static enemy tables',systems.includes('const PENDING_ACTION_DUE=[]')&&systems.includes('due=PENDING_ACTION_DUE,initial=pending.length;due.length=0')&&systems.includes('const ENEMY_BASE_CONFIGS=')&&systems.includes(\"const ELITE_SPAWN_KINDS=new Set(['mini','boss','void','apex'])\")&&systems.includes('ELITE_SPAWN_KINDS.has(kind)')&&systems.includes('const ranked=EXPERIENCE_ANCHORS;ranked.length=0')&&systems.includes('const keepCount=Math.min(cap,ranked.length)')&&!systems.includes('const currentRun=state.runSerial,due=[],initial=pending.length')&&!systems.includes('configs={grunt:')&&!systems.includes('gems.filter(Boolean).sort(')&&!systems.includes('ranked.slice(0,cap)')&&!systems.includes('gems.push(...keep)')],"
audit = replace_once(audit, needle, addition, 'performance audit pass 8 insertion')
audit_path.write_text(audit, encoding='utf-8')
