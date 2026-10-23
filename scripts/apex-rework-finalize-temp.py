from pathlib import Path


def replace_between(text: str, start: str, end: str, replacement: str) -> str:
    a=text.find(start)
    if a<0:
        raise SystemExit(f'start marker missing: {start}')
    b=text.find(end,a)
    if b<0:
        raise SystemExit(f'end marker missing: {end}')
    return text[:a]+replacement.rstrip()+"\n\n"+text[b:]

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

# Official README: sync cadence and replace the rejected shared-beam Apex grammar.
readme_path=Path('README.md')
readme=readme_path.read_text(encoding='utf-8')
readme=readme.replace('- 초월체: 실제 게임 시간 8분 간격','- 초월체: 실제 게임 시간 10분 간격')
readme=readme.replace('초월체는 실제 게임 시간 8분·16분·24분마다 등장하며','초월체는 실제 게임 시간 10분·20분·30분마다 등장하며')
readme=readme.replace('480-second (8-minute) Apex cadence','600-second (10-minute) Apex cadence')
readme=replace_between(readme,'### 시간포식자 추적광','### 초월체 유산',"""### 초월체 전투 문법 리워크

대표 시그니처 주기 동안 플레이어가 가만히 있으면 실제 공격에 맞아야 한다. 대신 예고를 읽고 이동하면 피할 수 있는 탈출 방향을 남긴다. 화려하지만 안전한 장식 탄막이나 세 초월체가 공유하는 지속 추적광을 핵심 패턴으로 사용하지 않는다.

- **시간포식자 아트로포스**: 시계판·바늘·톱니 대신 서로 다른 시간에 걸린 비대칭 파편체다. 현재 위치와 최근 위치에 지연 시간 흉터를 남기고, 플레이어가 실제로 이동했을 때만 그 이동축을 짧은 시간 절단으로 재생한다. 같은 자리에 서 있으면 현재 위치 흉터가 반복해서 겹친다.
- **종말 항성 오메가**: 전장 중심에 고정된 초거대 파열 항성체다. 본체는 이동하지 않고 예측 핵낙하, 플레이어 위치를 통과하는 용광로 압착열, 방사 포화와 조석 용광핵으로 이동을 강제한다.
- **무명의 마지막 성좌**: 중앙 눈을 제거한 각진 핵체와 분리된 천체 파편으로 구성한다. 연결선은 상시 장식이 아니라 공격 순간에만 드러나며, 플레이어 스냅샷을 가로지르는 국지 성좌 우리와 노드 집중사격 뒤 재배치한다.

페이즈는 단순 탄속·탄수 증가만 하지 않고 앞에서 배운 회피 규칙 위에 새 압박을 하나씩 겹친다.""")
readme=replace_between(readme,'### 2026-07 지속 광선 렉 수정','- 투사체·중력 우물·범위 피해의 충돌 후보',"""### 2026-10 초월체 전투 문법 리워크와 광선 성능 규칙

과거에는 초월체 추적광·성좌 휩쓸기·성좌망이 매 브라우저 프레임마다 짧은 `beam` 객체를 만들었고, 이를 시각 틱 제한으로 완화했다. 현재 3종 초월체의 핵심 공격에서는 공용 지속 추적광과 회전 휩쓸기를 제거했다.

- 시간포식자는 지연 시간 흉터와 짧은 경로 절단을 사용
- 오메가는 위치 고정형 충돌 지대·탄막·조석 용광핵을 사용
- 마지막 성좌는 국지 성좌 연결선과 노드 사격을 사용하며 연결선이 고유 공격 언어임
- 표준 전투 광선은 고정 스키마의 bounded pool을 재사용
- Stage 전용 특수 메타데이터 광선은 표준 풀과 분리
- 초월체 보상인 살아 있는 성좌망의 시각 갱신 제한은 유지하지만 보스 3종의 공용 공격 문법으로 재사용하지 않음
- 프리즘 시각 광선 역시 피해 틱과 분리""")
readme=readme.replace('- 초월체·적 투사체·지속 광선 판정: `bosses.js`','- 초월체 패턴·세트피스·적 투사체 판정: `bosses.js`')
readme_path.write_text(readme,encoding='utf-8')

# Canonical game design: current three-Apex grammar and performance ownership.
design_path=Path('docs/GAME_DESIGN.md')
design=design_path.read_text(encoding='utf-8')
design=replace_between(design,'### 시간포식자 추적광','### 초월체 유산',"""### 초월체 공격 문법

공통 기준은 **실제 이동 결정을 만드는 공격**이다. 대표 시그니처 주기 동안 가만히 있으면 최소 한 공격은 현재 위치와 교차해야 한다. 반대로 예고를 읽고 올바른 방향으로 이동하면 빠져나갈 수 있어야 한다. 공용 장거리 경고선·지속 추적광을 세 보스의 기본 문법으로 돌려 쓰지 않는다.

- **시간포식자 아트로포스**: 시계판·시곗바늘·톱니를 금지한다. 몸은 시간 오프셋이 어긋난 비대칭 파편과 균열로 구성한다. 현재 위치 지연 파열 → 최근 위치 기억 파열 → 실제 이동축이 존재할 때만 짧은 전단 절단을 겹친다. 이동축이 거의 없으면 0길이 선 대신 현재 위치 파열로 대체한다.
- **종말 항성 오메가**: 이동 속도 0의 고정형 초거대 보스다. 예측 핵낙하의 중심 충돌, 플레이어 위치를 포함하는 가로/세로 용광로 압착열, 전방 코로나 포화, 중앙 조석 용광핵을 사용한다. 페이즈가 올라도 본체 이동을 추가하지 않는다.
- **무명의 마지막 성좌**: 중앙 눈/타원을 금지한다. 각진 핵체와 비대칭 분리 천체로 구성하며 연결선은 공격·재구성 때만 강하게 드러난다. 성좌 우리는 캡처한 플레이어 위치를 반드시 가로지르는 중심 절단을 포함하고, 노드 사격과 예고된 재배치로 이어진다.
- **페이즈**: P1에서 각자의 기본 회피 규칙을 가르치고, P2~P4는 그 규칙을 유지한 채 지연·압착축·노드 수·중첩 타이밍을 하나씩 추가한다. 단순 탄속/탄수 증가만으로 페이즈를 구분하지 않는다.
- **연출**: 등장·페이즈·격파도 동일한 공용 폭발을 쓰지 않는다. 아트로포스는 파편 시간 불일치, 오메가는 외피 개방과 용광핵 붕괴, 무명은 연결망 형성/절단을 사용한다.

세 초월체의 이동은 시간포식자 소형 궤도 이동 / 오메가 완전 고정 / 마지막 성좌 외곽 선회·예고 순간이동으로 분리한다.""")
design=replace_between(design,'### 지속 광선 객체 제한','- 장식 파티클 생성률 축소',"""### 초월체 광선·세트피스 성능 규칙

과거 공용 추적광과 회전 성좌 휩쓸기는 매 프레임 짧은 광선 객체를 만들던 성능 문제 때문에 시각 틱을 제한했다. 현재 초월체 리워크에서는 그 두 공용 지속 광선을 보스 핵심 공격에서 제거한다.

- 시간포식자 시간 흉터는 원형 지연 판정과 필요한 순간의 짧은 절단선만 생성
- 오메가는 고정형 충돌 지대·투사체·조석 용광핵을 사용하고 지속 추적광을 만들지 않음
- 마지막 성좌 연결선은 고유 국지 우리/성좌 공격에만 사용하고 전체 전장 회전빔으로 되돌리지 않음
- 표준 전투 `beam`은 고정 스키마 bounded pool을 재사용
- Stage 보스의 `stageBossAttack` 같은 특수 메타데이터 광선은 표준 풀에 흡수하지 않음
- 살아 있는 성좌망 유산의 시각 갱신은 일반 약 0.050초, 부하 상태 약 0.085초 제한을 유지
- 프리즘은 피해 틱과 시각 틱 분리를 유지""")
design=design.replace('- 초월체·적 투사체·지속 광선: `bosses.js`','- 초월체 패턴·세트피스·적 투사체: `bosses.js`')
design=design.replace('- 초월체 추적광을 플레이어 방향으로 즉시 스냅하지 않는다.','- 시간포식자를 시계판·시곗바늘·톱니 또는 공용 지속 추적광 문법으로 되돌리지 않는다.\n- 종말 항성 오메가에 전투 중 본체 이동을 다시 추가하지 않는다.\n- 무명의 마지막 성좌에 중앙 눈/타원 본체나 공용 회전 휩쓸기를 다시 추가하지 않는다.')
design=design.replace('- 지속 광선을 매 브라우저 프레임 객체 생성 방식으로 되돌리지 않는다.','- 표준 광선 풀과 Stage 특수 메타데이터 광선의 소유권 경계를 무너뜨리지 않는다.')
design_path.write_text(design,encoding='utf-8')

# Ownership contract now validates the current Apex grammar rather than a removed tracking beam implementation.
ownership_path=Path('scripts/source-ownership-contract.mjs')
ownership=ownership_path.read_text(encoding='utf-8')
old_ownership="expect('docs','continuous beam performance fix documented',readme.includes('지속 광선 렉 수정')&&design.includes('지속 광선 객체 제한')&&bosses.includes('beam.visual=stressed?.070:.040'));"
new_ownership="expect('docs','apex rework documentation matches current non-shared-beam grammar',readme.includes('초월체 전투 문법 리워크')&&design.includes('초월체 공격 문법')&&design.includes('대표 시그니처 주기 동안 가만히 있으면')&&design.includes('오메가 완전 고정')&&!design.includes('### 시간포식자 추적광')&&!bosses.includes('beam.visual=stressed?.070:.040')&&bosses.includes('constellationCage'));"
if old_ownership not in ownership:
    raise SystemExit('legacy docs beam ownership contract missing')
ownership=ownership.replace(old_ownership,new_ownership,1)
ownership_path.write_text(ownership,encoding='utf-8')

print('apex rework finalizer applied')
