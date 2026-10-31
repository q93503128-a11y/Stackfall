from pathlib import Path


def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing replacement anchor: {label}")
    return text.replace(old, new, 1)


# README: current runtime truth first; Stage material remains preserved but dormant.
p = Path("README.md")
s = p.read_text()
s = must_replace(
    s,
    """### Run modes and finite stages

`ENDLESS` remains the default infinite mode with random world events, the full enemy family pool, and the 600-second (10-minute) Apex cadence. Finite stages use their own catalog timelines and do not inherit the Endless encounter director.

Stage 1 now starts at **5 minutes**, and the campaign rises to **15 minutes at Stage 18**. Fixed incidents and the recurring stage gimmick are compressed with the new operation length rather than being cut off. Reaching the listed time only spawns the final boss; the operation ends only when that boss is defeated.
""",
    """### Current runtime mode and preserved Stage source

As of **2026-10-31**, production gameplay is **Endless-only**. `src/run-modes.js` keeps `ACTIVE_STAGE_RUNTIMES=[]`, `STACKFALL_STAGE_MODE_ENABLED=false`, `stackfallHasStageRuntime()=>false`, and normalizes runtime selection back to Endless. Endless keeps the full enemy-family mixing rules and the 600-second (10-minute) Apex cadence.

Active random world events are exactly **Nebula Vault / 성운 보관소 (`vault`)**, **Crashed Starship / 추락한 우주선 (`crash`)**, and **Void Rift / 공허 균열 (`void`)**. The former field-event experiments `distress / meteor / predator / relay / storm` are retired from active Endless runtime; compatibility cleanup may still recognize those IDs only to discard stale state.

The Stage 1–18 tables and production notes below are **preserved authored source, not a currently playable runtime path**. Their files remain in the repository so the work is not lost, but Stage gameplay must not be described as active until the Stage gate is deliberately reopened and revalidated.

In the preserved authored design, Stage 1 starts at **5 minutes** and the campaign rises to **15 minutes at Stage 18**. Reaching the listed time spawns the final boss; authored Stage completion remains boss-death gated.
""",
    "README runtime section",
)
s = must_replace(
    s,
    "#### Post-roster weapon expansion\n\nStage 11/13/15/17 now unlock four fully implemented equipment families.",
    "#### Preserved post-roster Stage unlock plan\n\nThe following Stage-clear unlock timing is dormant while Stage runtime is sealed. The equipment implementations remain in source, but these Stage-clear routes are not currently active.\n\nStage 11/13/15/17 are authored to unlock four fully implemented equipment families.",
    "README post-roster section",
)
s = must_replace(
    s,
    "#### Galaxy map\n\nStages are grouped into constellation pages.",
    "#### Galaxy map / Stage preview\n\nThe galaxy map currently represents preserved Stage planning/preview data: Stage status is gated to `planned`, and runtime selection does not activate a Stage run. The authored map groups stages into constellation pages.",
    "README galaxy status",
)
p.write_text(s)


# GAME_DESIGN: current runtime canon + explicitly dormant Stage design.
p = Path("docs/GAME_DESIGN.md")
s = p.read_text()
s = must_replace(
    s,
    "- **현재 설계·구현 계약의 최종 정본은 이 문서(`docs/GAME_DESIGN.md`)다.** 코드와 충돌하면 실제 `main` 코드를 먼저 조사하고, 의도된 변경인지 확인한 뒤 이 문서를 함께 갱신한다.",
    "- **현재 설계·구현 계약의 최종 정본은 이 문서(`docs/GAME_DESIGN.md`)다.** 코드와 충돌하면 현재 canonical development branch의 실제 소스를 먼저 조사하고, 의도된 변경인지 확인한 뒤 이 문서를 함께 갱신한다.",
    "GAME_DESIGN branch authority",
)
s = must_replace(
    s,
    "- 현재 코드/문서 정합성 조사 결과는 `docs/CANONICAL_AUDIT_2026-09-28.md`에 기록한다.",
    "- 날짜가 붙은 `CANONICAL_AUDIT_*`, `RUNTIME_ARCHITECTURE_AUDIT_*` 등은 해당 시점의 역사적 스냅샷이다. 현재 상태 판정에는 이 문서와 실제 canonical source/contract를 우선한다.",
    "GAME_DESIGN audit hierarchy",
)
s = must_replace(
    s,
    "마지막 동기화: 2026-10-02\n\n이 문서는 STACKFALL의 실제 게임 규칙, 밸런스 기준, 소유권과 회귀 방지 조건을 정리한 공식 기준 문서다.",
    "마지막 동기화: 2026-10-31\n\n### 현재 런타임 상태 — 2026-10-31\n\n- **활성 플레이 런타임은 Endless 하나다.** `ACTIVE_STAGE_RUNTIMES=[]`, `STACKFALL_STAGE_MODE_ENABLED=false`, `stackfallHasStageRuntime()=>false`, `stackfallIsStageRun()=>false`가 현재 불변조건이다.\n- **활성 Endless 월드 이벤트는 정확히 3종**: `vault / crash / void`. `distress / meteor / predator / relay / storm`은 active Endless에서 폐기되었으며 stale-state 정리용 식별자 또는 봉인된 Stage authored source에만 남을 수 있다.\n- **Void Rift 보스 풀은 5종**: `maw / oracle / weaver / grave / paradox`.\n- 아래의 Stage 1–18 설계, Stage 보스, Stage 이벤트 플랜, Stage-clear unlock 표는 삭제하지 않은 **보존 authored design**이다. Stage gate가 다시 열리기 전까지 현재 플레이 가능 기능처럼 해석하지 않는다.\n\n이 문서는 STACKFALL의 실제 게임 규칙, 밸런스 기준, 소유권과 회귀 방지 조건을 정리한 공식 기준 문서다.",
    "GAME_DESIGN sync status",
)
s = must_replace(
    s,
    "## Run modes and finite stages (2026-09-22)\n\n- `endless` remains non-finite, keeps random world events, exposes the full enemy family pool, and keeps the 600-second (10-minute) Apex cadence.\n- Endless의 일반 적 스폰은 기본 4종만 반복하지 않는다. **75초부터 파손 항로(route), 240초부터 심연 개화(bloom), 420초부터 침묵 중계망(array)**의 Stage 일반 적 변형이 시간 경과에 따라 기존 풀에 섞인다. 이 혼합은 Stage 클리어/해금 상태와 무관하며, 스테이지 전용 보스·환경 기믹·전장 구조물까지 가져오는 규칙은 아니다.\n- `stage` is a separate finite operation mode. The **random** Endless event scheduler and Apex scheduling are suppressed, but curated world-event instances can be authored directly into each Stage.",
    "## Run modes and preserved finite-Stage design (authored 2026-09-22; runtime sealed 2026-10-31)\n\n- `endless` is the only active run runtime. It remains non-finite, keeps the canonical three random world events, exposes the full enemy family pool, and keeps the 600-second (10-minute) Apex cadence.\n- Endless의 일반 적 스폰은 기본 4종만 반복하지 않는다. **75초부터 파손 항로(route), 240초부터 심연 개화(bloom), 420초부터 침묵 중계망(array)**의 Stage 일반 적 변형이 시간 경과에 따라 기존 풀에 섞인다. 이 혼합은 Stage 클리어/해금 상태와 무관하며, 스테이지 전용 보스·환경 기믹·전장 구조물까지 가져오는 규칙은 아니다.\n- `stage` 관련 아래 규칙은 보존된 authored finite-operation 설계다. 현재 Stage runtime은 봉인되어 실행되지 않는다. 보존 설계상 random Endless scheduler/Apex scheduling은 억제하고 curated world-event instances를 Stage에 직접 배치한다.",
    "GAME_DESIGN run mode section",
)
s = must_replace(
    s,
    "**이벤트와 초월체 분리:** 월드 이벤트 자체에서는 Apex를 소환하지 않는다. 추락 우주선 누적 조우처럼 이벤트 고유 강적/보스는 유지할 수 있지만 Apex 등장은 Stage 최종전 또는 Endless 10분 주기 같은 Apex 계층에서만 처리한다. 성운 보관소·우주선·공허 균열·폭풍 등 이벤트의 세계관/시각 컨셉은 향후 Stage/Endless Apex의 모티프로 재사용할 수 있다.",
    "**이벤트와 초월체 분리:** 활성 Endless 월드 이벤트 자체에서는 Apex를 소환하지 않는다. 추락 우주선 누적 조우처럼 이벤트 고유 강적/보스는 유지할 수 있지만 Apex 등장은 현재 Endless 10분 주기의 Apex 계층에서 처리한다. 활성 이벤트 모티프는 성운 보관소·추락 우주선·공허 균열 3종이다. 폐기된 `distress / meteor / predator / relay / storm` 컨셉은 봉인된 Stage authored source나 역사 기록에 남을 수 있으나 active Endless 이벤트로 복구하지 않는다.",
    "GAME_DESIGN event/Apex split",
)
s = must_replace(
    s,
    "- 신규 5종은 조난 신호, 유성 광맥, 포식성 성운, 중계기 복구, 항성 폭풍의 눈이다. 현상금 신호와 중력 난파장은 추가하지 않는다.",
    "- **활성 이벤트 패밀리는 정확히 3종**: 성운 보관소(`vault`), 추락한 우주선(`crash`), 공허 균열(`void`). 조난 신호(`distress`), 유성 광맥(`meteor`), 포식성 성운(`predator`), 중계기 복구(`relay`), 항성 폭풍의 눈(`storm`)은 active Endless에서 폐기되었다. 현상금 신호와 중력 난파장도 활성 스케줄에 없다.",
    "GAME_DESIGN event cadence",
)
s = must_replace(
    s,
    "### Campaign system unlocks\n\n- **Stage 1**: Core Development / 코어 성장.",
    "### Preserved Campaign system unlock plan\n\n> 현재 Stage runtime은 봉인되어 있으므로 아래 Stage-clear 해금 조건은 **보존된 authored progression plan**이다. 현재 플레이에서 Stage 클리어로 발생하는 해금 경로로 취급하지 않는다.\n\n- **Stage 1**: Core Development / 코어 성장.",
    "GAME_DESIGN campaign unlock status",
)
s = must_replace(
    s,
    "- Stage 모드는 계속 `randomWorldEvents:false`라 Endless의 무작위 스케줄러는 돌지 않는다. 대신 같은 8종 이벤트 런타임을 **작가 배치형 Stage 이벤트**로 사용한다. 첫 등장은 **S1 성운 보관소 → S3 추락한 우주선 → S4 조난 신호 → S6 유성 광맥 → S8 포식성 성운 → S10 공허 균열 → S12 중계기 복구 → S14 항성 폭풍의 눈** 순서로 간격을 두고 소개한다. 이미 등장한 이벤트는 이후 Stage에서 반복되며 한 Stage에 여러 이벤트가 들어갈 수 있고, 후반으로 갈수록 횟수가 늘어난다. Stage 이벤트 표식은 최종보스/외부 정예 이벤트와 겹치지 않게 생성한다. 기존 Stage 서브보스가 남아 있더라도 표식은 먼저 나타날 수 있고, 표식이 존재하는 동안 다음 Stage 서브보스 조우를 보류한다. 작가 배치형 표식은 150초 유지되어 현재 전투를 정리한 뒤 진입할 수 있다.",
    "- 봉인된 Stage authored source에는 `randomWorldEvents:false`와 과거 8-family 작가 배치 계획이 보존되어 있다. 이 플랜은 현재 실행되지 않으며, active Endless에서 폐기된 `distress / meteor / predator / relay / storm`을 재활성화하는 근거가 아니다. Stage gate를 향후 다시 열 경우 해당 5종은 현재 3-event canon에 맞춰 재검토한 뒤 명시적으로 승인·구현·검증해야 한다.",
    "GAME_DESIGN dormant Stage event plan",
)
p.write_text(s)


# WIKI: player-facing availability must match the sealed runtime.
p = Path("docs/WIKI.md")
s = p.read_text()
s = must_replace(
    s,
    "마지막 동기화: 2026-07-20\n\n이 문서는 플레이 방법과 무기·이벤트·보스를 설명한다.",
    "마지막 동기화: 2026-10-31\n\n> **현재 플레이 가능 런타임:** Endless만 활성화되어 있다. Stage 1–18의 맵·보스·해금 설계는 저장소에 보존되어 있지만 Stage runtime은 봉인 상태이며 현재 플레이 경로가 아니다. Endless의 무작위 월드 이벤트는 성운 보관소 / 추락한 우주선 / 공허 균열 3종만 활성화된다.\n\n이 문서는 플레이 방법과 무기·이벤트·보스를 설명한다.",
    "WIKI availability",
)
s = must_replace(
    s,
    """## Run modes

- `endless`: infinite mode with one randomly selected eligible world-event signal at a time, all enemy families, and recurring Apex encounters. 기본 적에 더해 75초부터 route, 240초부터 bloom, 420초부터 array 계열의 Stage 일반 적 변형이 순차적으로 섞이며, Stage 해금 여부와는 무관하다.
- `stage`: finite operations with authored enemy pools, milestone incidents, recurring environmental gimmicks, stage minibosses, and a stage final boss.
- 최종보스 등장 시간은 Stage 1의 **5:00**에서 Stage 18의 **15:00**까지 증가한다. 시간에 도달하면 보스가 등장할 뿐이며, 실제 클리어는 보스를 처치해야 한다.
""",
    """## Run modes

- `endless`: **현재 유일하게 활성화된 런타임**. 한 번에 하나의 eligible world-event signal, 전체 적 계열 혼합, 10분 주기 Apex를 사용한다. 기본 적에 더해 75초부터 route, 240초부터 bloom, 420초부터 array 계열의 Stage 일반 적 변형이 순차적으로 섞이며 Stage 해금 여부와는 무관하다.
- 활성 무작위 월드 이벤트는 **성운 보관소(`vault`) / 추락한 우주선(`crash`) / 공허 균열(`void`)** 3종이다. 과거의 조난 신호·유성 광맥·포식성 성운·중계기 복구·항성 폭풍의 눈은 active Endless에서 폐기되었다.
- `stage`: authored finite-operation source는 보존되어 있으나 **현재 runtime은 봉인**되어 있다. 아래 Stage 표·보스·환경·해금 설명은 보존 설계 참고용이며 현재 플레이 가능한 모드 설명이 아니다.
- 보존 설계상 최종보스 등장 시간은 Stage 1의 **5:00**에서 Stage 18의 **15:00**까지 증가하고, 실제 클리어는 보스 처치로 확정된다.
""",
    "WIKI run modes",
)
s = must_replace(
    s,
    "### Galaxy map\n\nThe galaxy map is divided into constellation pages.",
    "### Galaxy map / sealed Stage preview\n\nThe galaxy map currently represents preserved Stage planning/preview data; Stage runtime selection remains disabled. The authored map is divided into constellation pages.",
    "WIKI galaxy status",
)
s = must_replace(
    s,
    "### Stage content identity\n\nStage environments are authored as distinct places rather than Endless background recolors.",
    "### Preserved Stage content identity\n\nThe following Stage identity rules describe preserved authored source, not an active Stage runtime. Stage environments are authored as distinct places rather than Endless background recolors.",
    "WIKI Stage identity status",
)
p.write_text(s)


# Live CI contract: lock docs to the actual Stage seal and three-event runtime.
p = Path("scripts/legacy-chat-requirements-contract.mjs")
s = p.read_text()
s = must_replace(
    s,
    "const runtimeControls=read('src/runtime-controls.js');",
    "const runtimeControls=read('src/runtime-controls.js');\nconst runModes=read('src/run-modes.js');\nconst readme=read('README.md');",
    "legacy contract doc reads",
)
anchor = "expect('Void Rift exposes five boss forms',bossCatalog.includes(\"BOSS_POOLS={\")&&bossCatalog.includes(\"void:['maw','oracle','weaver','grave','paradox']\"));"
addition = """expect('canonical documentation states that Stage runtime is sealed',runModes.includes('const ACTIVE_STAGE_RUNTIMES=Object.freeze([])')&&runModes.includes('window.STACKFALL_STAGE_MODE_ENABLED=false')&&readme.includes('production gameplay is **Endless-only**')&&design.includes('**활성 플레이 런타임은 Endless 하나다.**')&&wiki.includes('**현재 유일하게 활성화된 런타임**'));
expect('canonical documentation exposes only the three active Endless event families',readme.includes('Active random world events are exactly')&&design.includes('**활성 이벤트 패밀리는 정확히 3종**')&&wiki.includes('활성 무작위 월드 이벤트는 **성운 보관소(`vault`) / 추락한 우주선(`crash`) / 공허 균열(`void`)** 3종')&&design.includes('active Endless에서 폐기되었다'));
"""
s = must_replace(s, anchor, anchor + "\n" + addition, "legacy doc regressions")
s = must_replace(
    s,
    "expect('campaign stages use authored event plans instead of Endless random scheduling',stageRuntime.includes('STAGE_WORLD_EVENT_PLAN')&&stageRuntime.includes(\"1:Object.freeze([{at:.34,type:'vault'}\")&&stageRuntime.includes(\"3:Object.freeze([{at:.20,type:'vault'},{at:.50,type:'crash'}\")&&stageRuntime.includes(\"6:Object.freeze([{at:.14,type:'meteor'}\")&&stageRuntime.includes(\"10:Object.freeze([{at:.13,type:'void'}\")&&stageRuntime.includes(\"14:Object.freeze([{at:.10,type:'storm'}\")&&!stageRuntime.includes('stageAwareMapEvents'));",
    "expect('sealed Stage source preserves authored event plans without activating Stage runtime',runModes.includes('const ACTIVE_STAGE_RUNTIMES=Object.freeze([])')&&stageRuntime.includes('STAGE_WORLD_EVENT_PLAN')&&stageRuntime.includes(\"1:Object.freeze([{at:.34,type:'vault'}\")&&stageRuntime.includes(\"3:Object.freeze([{at:.20,type:'vault'},{at:.50,type:'crash'}\")&&stageRuntime.includes(\"6:Object.freeze([{at:.14,type:'meteor'}\")&&stageRuntime.includes(\"10:Object.freeze([{at:.13,type:'void'}\")&&stageRuntime.includes(\"14:Object.freeze([{at:.10,type:'storm'}\")&&!stageRuntime.includes('stageAwareMapEvents'));",
    "legacy dormant Stage plan contract",
)
p.write_text(s)
