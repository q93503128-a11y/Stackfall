# STACKFALL 플레이어 위키

마지막 동기화: 2026-07-20

이 문서는 플레이 방법과 무기·이벤트·보스를 설명한다. 세부 계산과 개발 규칙은 `GAME_DESIGN.md`, 실행·검사 방법은 루트 `README.md`를 우선한다.

## 1. 기본 목표

적을 쓰러뜨려 경험치 결정을 모으고 레벨업 때 무기 또는 패시브를 골라 가능한 오래 생존한다. 기본 무기 **코어 펄스**는 일반 장비 6칸과 별도로 항상 장착된다. 같은 무기는 최대 6중첩이며 중첩에 따라 발사 수, 관통, 범위와 특수효과가 달라진다.

## 2. 조작

- 이동: `WASD` 또는 방향키
- 일시정지: `Esc`
- 능력 장부: `Tab` 또는 `I`
- 모바일: 화면 왼쪽 조이스틱
- 선택 카드: 숫자 `1`·`2`·`3`·`4`

공격은 기본적으로 자동이다.

### 수동 조준

설정에서 `수동 조준`을 켜면 마우스 포인터 근처의 사거리 내 적을 우선 공격한다. 끄면 무기마다 정해진 자동 조준 규칙을 사용한다.

성좌 프리즘은 이미 한 적을 집속 중이라면 마우스를 움직였다는 이유만으로 표적을 바꾸지 않는다. 성운 부메랑은 수동 조준을 끈 상태에서 사거리 안 가장 먼 적을 선택한다.

## 3. 주요 무기

| 무기 | 화면에서 보이는 모습 | 역할 |
|---|---|---|
| 코어 펄스 | 청백색 마름모 펄스 | 빠르고 강한 자동 추적 기본탄 |
| 별빛 캐스터 | 붉은 폭발 문양과 회전 고리 | 빠른 집중 연사 |
| 혜성 창 | 긴 결정 장창과 다중 광미 | 장거리 고관통 |
| 펄스 블레이드 | 플레이어 주변 초승달 칼날 | 근접 지속 절단 |
| 중력 우물 | 검은 중심과 강착 원반 | 적 집속과 범위 제어 |
| 성좌 프리즘 | 공전 결정에서 한 적에게 모이는 광선 | 단일 표적 지속 집속 |
| 성운 부메랑 | 좌우 곡선으로 왕복하는 칼날 | 먼 적 왕복 타격 |
| 이온 사슬 | 적과 적을 잇는 전기 사슬 | 여러 적 연쇄 공격 |
| 유성 드론 | 플레이어 주위 편대 | 고화력 집중 연사와 유성 낙하 |
| 성간 레일 | 여러 평행 직선 광선 | 같은 표적 장거리 관통 |
| 은하 나선 | 회전하며 모이는 탄막 | 한 표적 집중 나선탄 |

### 여러 공격체의 표적

한 번에 탄환·드론·나선·광선이 여러 개 나와도 대부분 같은 적을 노린다. `다중 투영 코어`로 추가된 공격체 역시 원본과 같은 표적을 공격한다.

이온 사슬만은 여러 적을 이어 공격하는 고유 구조를 그대로 유지한다. 부메랑은 같은 적을 향하되 좌우 경로가 다르고, 레일 광선은 같은 적을 여러 평행선으로 가른다.

코어 펄스는 더 빠른 주기와 크게 오른 기본·중첩 피해를 사용한다. 유성 드론은 개별 탄과 발사 주기가 모두 강화되며, 4중첩부터 2연사, 6중첩부터 주기적인 8발 집중 탄막을 발사한다. 유성 낙하 표식은 사거리 안에서 현재 체력이 가장 높은 적을 우선한다.

### 성좌 프리즘

성좌 프리즘은 새 적을 발견하면 먼저 **1초 동안 얇은 조준선**을 표시한다. 조준이 끝난 뒤 모든 프리즘이 동시에 피해를 주기 시작한다.

- 표적이 살아 있으면 가급적 쓰러질 때까지 유지
- 잠깐 사거리 경계를 벗어나도 바로 다른 적으로 바꾸지 않음
- 표적이 죽거나 멀리 이탈하면 새 표적 탐색
- 새 표적을 잡으면 집속 단계 초기화
- 에코 광선과 추가 프리즘도 같은 표적 사용
- 화면에 보이는 프리즘 위치와 실제 광선 시작점이 일치

집속 단계는 `×1 → ×1.85 → 최대 출력` 순서다.

- 3중첩 최대 출력: ×3.70
- 5중첩 최대 출력: ×4.10
- 6중첩 최대 출력: ×4.45, 프리즘 3개

보스 특수효과 **과열 성선**은 집속 광선이 주변 적에게 굴절 도약하게 한다.

### 성운 부메랑

자동 조준은 사거리 안에서 가장 먼 적을 선택한다. 여러 칼날은 같은 적을 향해 서로 다른 곡선으로 날아갔다 돌아온다. 고중첩의 잔광 경로는 실제 지속 피해를 준다.


## 4. 무기 각성

각성은 6중첩 무기의 최종 변형이다. **6중첩 무기 + 각성 코어 1개**가 있을 때 레벨업하면 일반 선택지 대신 먼저 붉은 월식 테마의 각성 선택창이 열린다.

- 각성할 무기를 고르면 각성 코어 1개를 소비하고 해당 레벨업은 각성으로 사용한다.
- **각성하지 않는다**를 고르면 코어를 소비하지 않고 원래 일반 레벨업 선택지로 돌아간다.
- 자동 선택 기능이 있어도 각성은 자동 확정하지 않는다.
- 기존 1~6중첩과 보스 보상 특수능력은 각성 후에도 그대로 유지된다.
- 각성의 핵심은 수치가 아니라 **실루엣 변화 + 발동 리듬 변화 + 전용 시그니처 연출**이다.

현재 확정된 첫 7종은 다음과 같다.

- **코어 펄스 → 항성핵**: 플레이어 중심핵 자체가 다층 항성 구조로 변하고 보조핵 3개가 주기적으로 동시 사격한다.
- **펄스 블레이드 → 월식 검륜**: 검은 초승달형 장검들이 정렬 후 거대한 월식 절단륜을 만든다.
- **별빛 캐스터 → 성운 성창기**: 성창형 탄체와 양옆 발사 결정이 생기고 연속 적중 후 굵은 성광 관통탄을 발사한다.
- **성광 장벽 → 천궁 성채**: 여러 성광 성채 파츠가 몸을 두르고 피격 방향으로 전개된다. 보호막 파괴 시 성채 파츠가 흩어지며 반격파가 터진다.
- **중력 우물 → 쌍성 붕괴**: 청색/주홍 특이점 한 쌍이 마지막에 나선 합체해 거대한 붕괴를 일으킨다.
- **혜성 창 → 종언 혜성창**: 거대한 창이 플레이어 앞에 잠시 떠서 빛을 압축한 뒤 갑자기 초고속으로 전장을 관통한다.
- **성운 부메랑 → 월상 회귀**: 완전한 초승달 외형으로 바뀌고, 외향·순환·귀환 과정에서 초승달→반달→보름달로 차오르며 보름달 귀환 절단을 남긴다.

## 5. 패시브와 연쇄

### 자석 코어

자석 코어는 결정 흡수 범위만 늘리지 않는다. 중첩할수록 범위 안에 들어온 경험치 결정이 플레이어에게 더 빠르게 끌려온다.

### 연쇄 계열

게임 안 설명은 다음처럼 짧게 표시된다.

- 연쇄 과부하: 연쇄 유지시간과 연쇄 피해 증가
- 연쇄 추진기: 12연쇄마다 장비 발동 주기 추가 단축
- 연쇄 폭심: 20연쇄마다 플레이어 중심 폭발
- 연쇄 회수: 30연쇄마다 최대 체력 비례 회복
- 전리품 공명: 현재 연쇄에 따라 결정 흡수 범위 증가

연쇄 회수의 회복량은 이전보다 높아졌다. 보스와 초월체에게 계속 피해를 주면 잡몹이 없어도 누적 피해가 연쇄를 진행한다.

재생 장갑은 중첩당 최대 체력 +28과 즉시 회복 46을 제공한다. 항성 생명핵은 중첩당 최대 체력 +12%다. **자가 복원은 중첩당 초당 체력 1**을 회복한다.

성광 장벽, 반사 성좌, 방벽 성운, 자동 방벽 발생기처럼 서로 다른 지속 보호막 효과를 함께 보유하면 보호막 최대치는 각 효과의 최대치를 합산해 증가한다. 같은 보호막 효과의 반복 획득은 해당 효과의 중첩 성장식으로 계산한다.

## 6. 맵 이벤트

### 성운 보관소

청록색 각형 기록 보관소다. 세 개의 봉인 기록 중 하나를 복원해 피해, 속도, 체력, 자석, 투사체, 방벽 또는 연쇄 능력을 강화한다.

**보스나 중간보스가 살아 있어도 성운 보관소 표식은 나타나고 획득할 수 있다.** 보관소에 접촉해 선택 화면을 열면 전투와 게임 시간이 멈춘다.

### 추락한 우주선

원형 격리 전장에서 방어 함대를 처리한다. 기본 제한시간은 82초이며, 게임 시간이 길어질수록 함대가 강해지고 세 웨이브의 적 수와 제한시간도 증가한다. 보스·중간보스 전투와 겹쳐 새로 시작하지 않는다.

세 번째 우주선 이벤트마다 더 넓은 격리 구역에 거대 기함 **격리함 파멸자**가 나타난다. 기함은 조준 총알, 유도 미사일, 예고 레이저와 인터셉터 증원을 사용한다. 모든 웨이브와 기함을 격파해야 잔해 보상을 얻는다.

중간보스·우주선 잔해·공허의 자동 무작위 중첩은 이미 보유한 무기와 패시브만 강화한다. 강화 가능한 보유 항목이 없으면 보호막 또는 선체 강화로 바뀌며, 미보유 항목이 자동으로 0중첩에서 1중첩이 되지 않는다. 직접 선택하는 레벨업 획득은 그대로 새 장비를 열 수 있다.

### 공허 균열

진입하면 공허 전용 보스를 108초 안에 쓰러뜨려야 한다. 실패하면 실공간으로 방출된다. 일반 정예 전투와 겹쳐 새로 시작하지 않는다.

이벤트 표식을 46초 동안 무시하면 신호가 사라지고 나중에 다시 나타난다.

## 7. 초월체

초월체는 실제 게임 시간 10분마다 등장한다. 일시정지·능력 장부·선택·보상 중에는 게임 시간과 초월체 예정 시간이 진행되지 않는다.

초월체 능력치는 플레이어 레벨·무기·패시브 중첩을 읽지 않는다. 플레이어가 강해진 만큼 강한 상태로 싸울 수 있다. 대신 초월체는 첫 등장부터 매우 강하며 **등장 횟수만으로 누적 복리 강화**된다.

- 첫 초월체: 고유 체력에 추가 7.6배, 고유 피해에 추가 2.15배
- 두 번째: 직전보다 체력 약 2.4배, 피해 약 1.58배 추가
- 세 번째: 직전보다 체력 약 2.74배, 피해 약 1.73배 추가
- 이후: 매번 더 큰 배율과 패턴 압력 누적

### 시간포식자 아트로포스

시간포식자의 추적광은 플레이어 위치에 즉시 꽂히는 레이저가 아니다. 플레이어 방향에서 옆으로 비껴난 곳에서 시작해 0.9초 동안 준비한 뒤 제한된 회전 속도로 전장을 쓸며 따라온다. 광선보다 빠르게 반대 방향으로 움직이면 추적을 따돌릴 수 있다.

시간 잔상, 시곗바늘 절단과 시간 격자는 추적광이 유지되는 동안에도 함께 발생할 수 있다.

### 종말 항성 오메가

봉쇄장 중앙에 조석 용광핵을 유지한다. 용광핵은 플레이어를 약하게 끌어당기고 탄환륜과 운석을 만들며, 종료할 때 크게 폭발한다.

### 무명의 마지막 성좌

별자리 격자, 사각 감금선과 순간이동을 사용한다. 회전하는 다중 휩쓸기와 일정 시간이 지나면 사라지는 약화 성좌 전령도 소환한다.

## 8. 초월체 유산

초월체를 쓰러뜨리면 고유 유산, 일반 패시브 총 3중첩, 초월 동력핵을 모두 받는다. 초월 동력핵은 최대 체력 +8%, 완전 회복, 모든 장비 즉시 재점화와 대형 붕괴파를 제공한다.

### 시간 탈취

일정 시간 일반 적과 적 탄환을 크게 늦추고 모든 장비의 남은 재사용 시간을 빠르게 줄인다. 활성 중에는 주변에 시간 파쇄 피해를 준다.

### 미니어처 항성

플레이어 주변을 도는 임시 항성이 한 적에게 추적 광선을 쏘고 방사형 관통탄을 발사한다. 수명이 끝나면 넓게 폭발한다.

### 살아 있는 성좌망

성좌 노드가 공격선을 연결해 적을 자르고 적 탄환을 지운다. 각 노드는 같은 우선 표적에 성광을 집중하고 지속시간이 끝나면 전체가 폭발한다. **보호막 충전형 유산이 아니다.**

## 9. 능력 장부와 설정

`I` 또는 `Tab`으로 능력 장부를 열면 게임이 일시정지된다. 닫으면 열기 전의 플레이·일시정지·레벨 선택 상태로 돌아간다.

장부의 상세 화면은 실제 현재 수치를 표시한다.

- 자석 코어: 현재 흡수 반경과 추가 흡인 속도
- 성좌 프리즘: 공유 표적, 1초 선딜과 현재 최대 배율
- 성운 부메랑: 가장 먼 적 자동 조준
- 연쇄 추진기: 현재 주기 단축

설정에서는 언어, 소리, 피해량, 아군 투사체, 반짝임, 화면 흔들림과 수동 조준을 조절할 수 있다.

## 10. 난이도

- **쉬움**: 적 체력·피해·속도와 원거리 적 비중 감소
- **보통**: 기준 밸런스
- **어려움**: 적 체력 1.32배, 피해 1.30배, 속도 1.12배, 원거리 적 등장 비중 1.28배. 4분 이후 피해와 속도 압박 추가

## 11. 전투가 잘 보이게 바뀐 부분

- 녹색 육각 결정은 경험치
- 적 탄환은 진행 방향을 향하는 별도 실루엣
- 화면 밖 정예와 맵 이벤트는 방향·종류·거리 표시
- 펄스 블레이드는 실제 충돌 판정과 같은 고정 궤도
- 플레이어 앞 흰색 표시가 이동 방향 안내
- 마지막 성좌 순간이동은 도착 지점을 먼저 예고하고 도착 후 0.48초 동안 접촉 피해 없음
- 초월체 지속 광선은 공격 판정은 유지하면서 화면 갱신 빈도를 제한해 장시간 전투 렉을 줄임
- 실제 프레임 지연이 지속될 때 배경 장식과 렌더 해상도를 줄이고, 심각 단계에서는 적·적탄·플레이어·위험 예고를 간소화한 WebGL 실루엣으로 전환하지만 화면 밖 보스·맵 이벤트 화살표와 실제 투사체·분열·파편·부메랑·중력 우물·피해 주기는 줄이지 않음

반짝임 효과를 꺼도 적 탄환과 위험 예고는 남는다. 성능이 불안정한 기기에서는 반짝임과 아군 투사체 표시를 줄여도 보스 위험 표시는 유지된다.

## Run modes

- `endless`: infinite mode with random world events, all enemy families, and recurring Apex encounters.
- `stage`: finite operations with authored enemy pools, milestone incidents, recurring environmental gimmicks, and a stage final boss.
- Stage time is no longer universally ten minutes. The final boss appears at the authored time below, and killing it is still required for the clear.
- Each stage's existing hazard family now repeats throughout the run on its own cadence. The cadence speeds up toward the finale and periodically adds a themed enemy surge, so the map identity remains active between fixed incidents instead of appearing only a few times.

| Stage | 작전 | 최종보스 등장 |
|---|---|---:|
| 01 | 붕괴 전초구역 | 10분 |
| 02 | 이온 성운 해구 | 11분 |
| 03 | 유리별 묘역 | 12분 |
| 04 | 정지궤도 회랑 | 13분 |
| 05 | 자기극 폭풍대 | 14분 |
| 06 | 파편 성좌핵 | 15분 |
| 07 | 검은 꽃밭 | 12분 |
| 08 | 흑수액 협곡 | 13분 |
| 09 | 나선 종자층 | 14분 |
| 10 | 반사 화관 성소 | 15분 |
| 11 | 종자 갑각층 | 17분 |
| 12 | 심연 개화핵 | 20분 |
| 13 | 무응답 중계소 | 15분 |
| 14 | 잡음 협로 | 16분 |
| 15 | 패킷 폭풍대 | 18분 |
| 16 | 블라인드 섹터 | 20분 |
| 17 | 암호 묘역 | 22분 |
| 18 | 침묵 배열핵 | 25분 |

The three current constellations remain **Shardway**, **Abyssal Bloom**, and **Silent Array**. Their existing enemies, boss identities, backgrounds, weapon rewards, and progression chain are retained. The original 14-weapon roster is fully unlockable by Stage 10, then expands to 18: Stage 11 unlocks Vacuum Bloom, Stage 13 Phase Minefield, Stage 15 Interstellar Missile Pods, and Stage 17 Orbital Gate. Stages 12/14/16/18 retain currency/Core-Shard rewards.

### Post-roster weapons

- **Vacuum Bloom / 진공 개화**: kill-fed seeds consume nearby deaths, pull enemies inward, and chain-collapse. Its Devouring Pollen augment absorbs ordinary enemy shots before the bloom and increases the final blast.
- **Phase Minefield / 위상 기뢰군**: lays mines from movement distance or fallback time, supports chain fuses and tripwires, and gains a triangular constellation deployment at six stacks. Afterimage Mine projects a weaker phantom mine near a priority target.
- **Interstellar Missile Pods / 성간 미사일 포드**: visible side pods eject missiles outward first, then ignite and curve toward priority targets. MIRV keeps the main warhead at 100% parent damage and adds two 34% side warheads.
- **Orbital Gate / 궤도 문**: stationary installed gate networks alternate between enemy-side and cast-time-player-side placement. Pulses route through fixed gates; Photon Crossfeed can copy an allied projectile once from the next gate at 55% damage.
- **Projection Core / 다중 투영 코어** compatibility is bounded: it adds primary seeds, mines, main missiles, or routed gate pulses. Secondary MIRV warheads, phantom mines, forced blooms, and gate copies do not recursively multiply.

### Galaxy map

The galaxy map is divided into constellation pages. Only one constellation is displayed at a time; after a constellation is completed, the next constellation page becomes reachable when its first stage is unlocked.

The main menu is a mode hub rather than a direct loadout/start screen. `GALACTIC OPERATIONS` opens the galaxy map, `ENDLESS` opens sortie preparation, and `CORE DEVELOPMENT` opens the permanent upgrade field. The upper-left local-pilot card is clickable and shows a detailed local-save panel with clears, runs, kills, equipment slots, unlocked weapons, best Stage 1 time, Stardust, and Core Shards; it is not an online account. The upgrade field keeps the exact shared in-game player-core renderer centered with floating orbital nodes and fits within one normal desktop viewport; compact/mobile layouts may scroll. Future skins can therefore propagate through the shared renderer automatically. Skins are otherwise deferred.

### Stage content identity

Stage environments are authored as distinct places rather than Endless background recolors. Ordinary enemies may be reused across stages; new common enemies are introduced only when useful and can enter later pools. Named minibosses/bosses require dedicated silhouettes and attack branches. Apex threats additionally require distinct signature attacks, set pieces, arena behavior, and persistent identity effects.

