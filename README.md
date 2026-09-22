# STACKFALL

장비를 중첩해 공격 방식과 우주 전장을 변화시키며 버티는 웹 생존 액션 게임입니다.

- 저장소: `q93503128-a11y/Stackfall`
- 배포: `https://stackfall.pages.dev`
- 실행 환경: 정적 HTML/CSS/JavaScript
- 기본 화면: Canvas 2D
- 대량 아군 투사체·전투 파티클: PixiJS WebGL
- WebGL 초기화나 CDN 로드에 실패하면 Canvas 2D로 자동 복귀

## 실행

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## 공식 문서

현재 규칙은 아래 세 문서를 함께 기준으로 사용합니다.

1. `README.md`
2. `docs/GAME_DESIGN.md`
3. `docs/WIKI.md`

게임 규칙·밸런스·UI·렌더링·성능 구조를 변경하면 세 문서를 같은 작업에서 동기화합니다. 과거 채팅 요약, 인수인계 문서나 오래된 주석보다 현재 `main` 코드와 공식 문서를 우선합니다.

## 핵심 규칙

- 일반 장비 슬롯: 6칸
- 기본 무기 `코어 펄스`: 일반 슬롯과 별도
- 일반 장비: 14종
- 장비 중첩: 1~6
- 패시브: 슬롯 제한 없음
- 치명타 확률 상한: 100%
- 레벨당 기본 피해 증가: 1.1%
- 같은 이름의 스탯은 합연산
- 이름이 다른 피해 계수는 곱연산
- 초월체: 실제 게임 시간 10분 간격
- 일시정지·능력 장부·선택·보상 중에는 게임 시간과 초월체 예정 시간이 진행되지 않음

## 주요 패시브

- 자석 코어: 결정 흡수 범위 +34, 중첩당 결정 흡인 속도 증가
- 에코 비콘: 발사·설치형 장비 복제 확률 +7.5%
- 출력 증폭: 모든 피해 +10%
- 가속 회로: 장비 발동 주기 -7%
- 재생 장갑: 최대 체력 +28, 즉시 체력 46 회복
- 항성 생명핵: 최대 체력 +12%
- 자가 복원: 초당 체력 1 회복
- 벡터 부스터: 이동 속도 +9%
- 취약점 해석: 치명타 확률 +6%
- 개척 계약: 적 체력 +10%, 경험치 획득량 +30%
- 성운 통찰: 경험치 획득량 +10%
- 거성 사냥꾼: 중간보스·보스 피해 +15%
- 심우주 조준기: 무기 기본 조준·비행 사거리 +10%

게임 안 카드 설명은 플레이에 필요한 기능과 실제 효과만 짧게 표시합니다. 내부 계산식, 소유 모듈, 성장곡선 설명과 개발 이력은 게임 안에 노출하지 않습니다. 확률 표기는 `%`로 통일합니다.

## 장비

- 코어 펄스
- 펄스 블레이드
- 별빛 캐스터
- 성광 장벽
- 중력 우물
- 혜성 창
- 성좌 프리즘
- 시간 고리
- 성운 부메랑
- 이온 사슬
- 초신성 코일
- 유성 드론
- 성간 레일
- 은하 나선
- 반사 성좌

서로 다른 지속 보호막 효과를 동시에 보유하면 보호막 최대치는 각 효과의 최대치 기여량을 합산합니다. 같은 효과의 반복 중첩은 해당 효과의 성장식으로 계산되며, 보호막 충전 때문에 이미 쌓인 보호막이 줄어들지는 않습니다.

코어 펄스는 기본 발동 주기가 0.76초로 빨라졌고 기본 피해·중첩 피해·탄속·탄 크기가 함께 강화되었습니다. 유성 드론은 사격 주기와 개별 탄 피해가 크게 상승하며, 4중첩부터 집중 2연사, 6중첩부터 5회마다 8발 집중 탄막을 사용합니다. 유성 낙하 특수효과는 사거리 안에서 현재 체력이 가장 높은 적을 표식 대상으로 삼습니다.

### 집중 표적 규칙

탄환·드론·나선·평행 광선처럼 한 번에 여러 공격체가 발생하는 무기는 원칙적으로 같은 표적에 화력을 집중합니다. `다중 투영 코어`로 추가된 공격체도 원본 표적을 공유합니다.

예외는 다음과 같습니다.

- 이온 사슬: 적 사이를 이어가는 연쇄 공격 정체성을 유지
- 펄스 블레이드: 플레이어 주변을 도는 공전 충돌체
- 중력 우물: 여러 위치에 설치되는 전장 제어 장비
- 성운 부메랑: 같은 적을 향하되 좌우 곡선 경로를 사용
- 교차·평행 광선: 같은 적을 여러 선으로 가름

### 성운 부메랑

자동 조준은 사거리 안에서 플레이어에게 가장 먼 적을 선택합니다. 여러 칼날은 같은 적을 향해 서로 다른 곡선으로 출발하고 귀환합니다. 5중첩 경로 피해는 왕복 궤도에 실제 피해 판정을 남깁니다.

### 성좌 프리즘

성좌 프리즘은 모든 프리즘이 하나의 공유 표적을 집속합니다.

- 새 표적 획득 후 1초 조준선 표시
- 조준이 끝난 뒤 피해 시작
- 표적이 살아 있는 동안 가급적 변경하지 않음
- 잠시 사거리 경계를 벗어나도 2.25초 동안 락 유지
- 표적 사망 또는 장거리 이탈 시에만 새 표적 탐색
- 새 표적을 잡으면 집속 열 초기화
- 에코 광선과 다중 투영 프리즘도 같은 락 공유
- 공전 표시 좌표와 실제 광선 발사 좌표는 `prismPositions()` 한 소스를 사용

집속 배율:

```text
기본 출력        ×1.00
1단계 증폭       ×1.85
3중첩 최대 출력 ×3.70
5중첩 최대 출력 ×4.10
6중첩 최대 출력 ×4.45
```

6중첩에서는 프리즘 3개를 사용합니다. `과열 성선`은 집속 광선이 주변 적에게 굴절 도약하게 합니다.


## 무기 각성

각성은 **6중첩 무기 + 각성 코어 1개**를 조건으로 하는 최종 변형입니다. 조건을 만족한 상태에서 레벨업하면 일반 선택지 전에 붉은 월식 테마의 각성 화면이 열립니다. 원하는 각성을 선택하면 코어 1개를 소비하고, **각성하지 않는다**를 고르면 코어를 보존한 채 원래 일반 레벨업 선택지로 돌아갑니다.

각성 후에도 기존 중첩 효과와 보스 보상 특수능력은 유지됩니다. 각성은 단순 피해 증가가 아니라 무기의 실루엣, 발동 템포, 전용 연출이 모두 달라지는 형태로 설계합니다.

첫 확정 7종: 항성핵 / 월식 검륜 / 성운 성창기 / 천궁 성채 / 쌍성 붕괴 / 종언 혜성창 / 월상 회귀

두 번째 확정 6종: 성좌 왕관 / 영겁 시계 / 천뢰 회로 / 극초신성 / 낙성 함대 / 종언 레일포

세 번째 확정 6종: 창세 은하 / 천경 성역 / 흑성 연화 / 위상 성궤 / 성멸 포대 / 초공간 대관문

공통 각성 런타임은 6중첩/각성 코어 조건 검사, 붉은 월식 선택창, 거부 후 일반 레벨업 복귀, 코어 소비와 각성 상태 표시까지 연결되어 있습니다. 자동 레벨업을 사용해도 각성은 자동 확정되지 않습니다. 각성 코어의 실제 획득처와 19종 전용 전투 효과/렌더링은 후속 구현 단계에서 연결합니다.

전투 HUD에는 **×1 / ×2 게임 속도 전환**이 있으며, 2배속은 프레임당 전투 업데이트를 두 번 수행합니다. 레벨업 자동 선택이 켜져 있으면 자동으로 선택된 장비/패시브와 중첩 변화도 순차 알림으로 표시됩니다.

## 수동 조준

설정에 `수동 조준` 토글이 있습니다.

- 기본값: 꺼짐
- 켜짐: 마우스 포인터에 가장 가까운 사거리 내 적을 자동 공격 표적으로 선택
- 꺼짐: 무기별 자동 조준 규칙 사용
- 성운 부메랑의 자동 조준은 가장 먼 적
- 성좌 프리즘은 이미 확보한 공유 락을 유지하므로 포인터 이동만으로 계속 표적이 바뀌지 않음
- 현재 설정은 `stackfall.settings`에 저장

## 에코 비콘

중첩 0일 때 복제 확률은 0%입니다. 1중첩부터 중첩당 7.5%, 무작위 확률 상한은 60%이며 8중첩에서는 매 5번째 발동을 보장합니다.

원본과 복제 공격이 완전히 겹치지 않도록 첫 복제는 약 64~91ms 뒤 발동합니다. 고중첩 추가 복제는 첫 복제보다 다시 약 90~120ms 늦게 발동합니다. 복제 공격은 분홍색 계열로 구분합니다.

## 연쇄

게임 안 설명은 아래처럼 짧게 유지합니다.

- 연쇄 과부하: 연쇄 유지시간과 연쇄 피해 증가
- 연쇄 추진기: 12연쇄마다 장비 발동 주기 추가 단축
- 연쇄 폭심: 20연쇄마다 플레이어 중심 폭발
- 연쇄 회수: 30연쇄마다 최대 체력 비례 회복
- 전리품 공명: 현재 연쇄에 따라 결정 흡수 범위 증가

연쇄 회수는 이전보다 기본 회복량과 중첩 성장량을 높였으며 한 번의 발동으로 최대 체력의 30%를 넘지 않습니다. 보스와 초월체에게 누적 피해를 주어도 연쇄가 진행되므로 잡몹이 없는 전투에서도 작동합니다.

## 설정

- 언어
- 음향 채널별 켜기·끄기
- 음향 채널별 음량
- 피해량 표시
- 아군 투사체 숨기기
- 반짝임 효과
- 화면 흔들림
- 수동 조준

`반짝임 효과`를 끄면 장식용 파티클, 화면 섬광, 별의 점멸과 긴 광원 꼬리를 줄입니다. 적 투사체, 보스 장판과 공격 예고처럼 생존에 필요한 표시는 유지합니다.

## 맵 이벤트

- 성운 보관소
- 추락한 우주선
- 공허 균열

공통 규칙:

- 표식은 46초 뒤 소멸하고 해당 이벤트를 다시 예약
- 선택 화면에서 전투와 게임 시간이 멈추므로 자동 선택 제한시간 없음
- 같은 종류 이벤트 연속 등장 금지
- 이벤트 종료 후 최소 간격 적용
- 초월체 예정 시각이 가까우면 신규 이벤트 연기

성운 보관소는 보스나 중간보스가 살아 있어도 표식이 생성되고 접촉해 획득할 수 있습니다. 보관소 선택 중에는 전투가 정지됩니다. 추락한 우주선과 공허 균열은 기존처럼 정예 전투와 겹쳐 시작하지 않습니다.

추락한 우주선 방어 함대는 이벤트가 발생한 게임 시간에 따라 체력·화력, 각 웨이브의 등장 수와 제한시간이 함께 증가합니다. 세 번째 우주선 이벤트마다 더 넓은 격리 구역에 `격리함 파멸자`가 출현해 총알, 유도 미사일, 예고 레이저와 인터셉터 증원을 사용합니다. 세 웨이브와 기함을 모두 격파해야 잔해를 회수할 수 있습니다.

중간보스 자동 보상, 우주선 잔해와 공허의 무작위 무기·패시브 중첩은 이미 1중첩 이상 보유한 항목만 강화합니다. 강화 가능한 보유 항목이 없을 때는 신규 항목을 0→1로 열지 않고 보호막 또는 선체 강화로 대체합니다. 레벨업처럼 플레이어가 직접 고르는 획득 선택지는 이 제한을 받지 않습니다.

## 초월체

초월체는 실제 게임 시간 10분·20분·30분마다 등장하며 전용 봉쇄장을 사용합니다. 넉백·중력 흡입·시간 정지·이동 봉쇄에 면역입니다.

초월체 능력치는 플레이어 레벨·무기 중첩·패시브 중첩을 읽지 않습니다. 첫 등장부터 고정 초고스펙을 사용하고 이후 등장 횟수마다 체력·피해·패턴 압력을 누적 복리로 강화합니다.

### 시간포식자 추적광

추적광은 플레이어에게 바로 꽂히지 않습니다.

- 플레이어 방향에서 약 0.92라디안 이상 비껴난 각도로 시작
- 0.9초 준비 단계
- 제한된 회전 속도로 플레이어를 따라 휩씀
- 피해 판정 주기와 광선 화면 갱신 주기를 분리

### 다른 고유 세트피스

- 종말 항성: 중앙 조석 용광핵, 약한 중력, 탄환륜·운석, 종료 붕괴
- 마지막 성좌: 회전 다중 휩쓸기와 임시 성좌 전령
- 시간포식자: 시간 잔상·시곗바늘 절단과 지속 추적광

### 초월체 유산

- 시간 탈취: 적·탄환 감속, 장비 과가속, 시간 파쇄 피해
- 미니어처 항성: 공전 항성 추적광·방사탄·최종 붕괴
- 살아 있는 성좌망: 연결선 절단, 적 탄환 제거, 노드 집중 포격, 최종 폭발

마지막 성좌 유산은 보호막 충전 효과가 아닙니다. 초월체 보상에는 단순 보호막 36을 사용하지 않습니다.

## 전투 가독성

- 경험치 결정: 녹색 육각 결정과 십자 표식
- 적 투사체: 위험색 외곽선과 진행 방향 실루엣
- 화면 밖 정예: 방향·종류·거리 표시
- 펄스 블레이드: 실제 충돌 위치와 같은 고정 공전 반경
- 플레이어: 이동 방향 표시
- 마지막 성좌 순간이동: 도착 지점 선예고와 0.48초 접촉 피해 유예

## 렌더링과 성능

게임 규칙·충돌·AI·보상은 JavaScript 상태 배열을 사용하고 렌더링만 분리합니다.

### PixiJS WebGL

- 대량 아군 투사체
- 장식용 전투 파티클
- 무기 계열별 텍스처 배칭

### 배경 Canvas 2D

- 배경과 성운
- 중력 우물과 비위험 아군 특수효과

### 전경 Canvas 2D

- 적과 보스
- 적 투사체
- 위험 예고
- 플레이어
- 광선과 중요 전경 효과
- UI와 안내

화면 계층은 `배경 Canvas → PixiJS 아군 효과 → 전경 Canvas → HTML UI` 순서입니다. WebGL 로드·초기화·컨텍스트 복구에 실패하면 Canvas 2D 폴백으로 복귀합니다.

기존 최적화:

- 공간 해시 충돌 검사
- 유한 사거리 인접 셀 탐색
- 적 ID 색인
- 투사체 객체 풀링
- 경험치 결정 병합
- 화면 밖 렌더 생략
- 캐시된 Canvas 스프라이트
- 효과 배열 제자리 압축
- 런 세대와 게임 시간 기반 예약 공격
- 측정된 심각한 프레임 지연이 지속될 때만 해상도 축소

### 2026-07 지속 광선 렉 수정

렉의 직접 원인은 초월체 추적광·성좌 휩쓸기·살아 있는 성좌망이 매 브라우저 프레임마다 여러 개의 짧은 `beam` 객체를 생성한 구조였습니다.

수정 후:

- 공격 판정 틱은 기존 주기 유지
- 시각 광선 객체 생성은 일반 상태 약 20~25FPS로 제한
- 성능 보호 상태에서는 더 낮은 빈도로 제한
- 성좌망·추적광·휩쓸기 각각 별도 시각 타이머 사용
- 장식 파티클 생성률 축소
- 프리즘 시각 광선 역시 피해 틱과 분리
- 투사체·중력 우물·범위 피해의 충돌 후보를 공간 격자에서만 조회
- 공간 격자 버킷과 충돌 후보 배열을 재사용하고 다중 표적 정렬의 후보별 객체 생성을 없애 전투 중 임시 할당을 줄임
- 잘린 게임 진행 시간이 아닌 실제 브라우저 프레임 간격으로 렉을 감지하고, 높은 개체 밀도에서는 합성 정체가 커지기 전에 긴급 렌더 경로를 선제 적용
- 성능 보호 단계는 적·투사체·적탄·위험 예고 같은 논리 엔티티의 상한을 바꾸지 않으며, 투사체 분열·파편·부메랑·혜성 경로 피해·중력 우물을 삭제하거나 피해 주기를 늦추지 않는다.
- 심각한 지연 중에는 Pixi 시각 갱신을 최대 24FPS로 제한하고 화면에 동시에 그리는 아군 투사체·장식 입자 수를 줄인다. Canvas 폴백은 내부 해상도도 낮추고, WebGL에서는 마지막 배경을 유지한 채 적·적탄·플레이어·위험 예고를 간소화한 실루엣으로 전환한다. 이 긴급 경로에서도 화면 밖 보스와 보관소·우주선·공허 이벤트의 가장자리 안내는 고정 스프라이트 풀로 유지한다. 게임 로직·충돌·피해 틱은 계속 매 게임 프레임 처리한다.

따라서 성능 보호는 표시 개수·시각 갱신 빈도·장식 효과와 렌더 해상도만 조절합니다. 결정적 브라우저 계약은 정상 단계와 심각 단계에서 생성된 공격체 수와 누적 피해량이 같은지 함께 비교합니다.

## 로딩 순서

최종 렌더링 관련 순서는 아래를 유지합니다.

```text
dark-cosmic-polish.js
performance-guard.js
build-audit-ui.js
gpu-renderer.js
endgame-balance-expansion.js
```

주요 소유 모듈:

- 일반 투사체 이동·유도: `systems.js`
- 초월체·적 투사체·지속 광선 판정: `bosses.js`
- 성장·연쇄 계산: `progression-expansion.js`
- 맵 이벤트 본체: `map-event-expansion.js`
- 수동 조준·자석 흡인·보관소 정예 예외: `targeting-motion-refinement.js`
- 최종 다중 투영·프리즘 락·부메랑 후반 동작: `endgame-balance-expansion.js`
- 능력 상세와 화면 밖 안내: `build-audit-ui.js`
- GPU 폴백과 스프라이트 풀: `gpu-renderer.js`

런타임 hotfix·override·source-sync 파일을 새로 추가하지 않습니다. 실제 소유 모듈을 직접 수정합니다.

## 검사

```bash
node scripts/build-fingerprint.mjs
node scripts/browser-smoke.mjs
node scripts/browser-smoke.mjs --soak-ms=120000
node scripts/browser-smoke.mjs --url=https://stackfall.pages.dev --result=test-results/live-smoke.json
```

`build-fingerprint.mjs`는 실제 로드되는 JavaScript 문법과 영구 계약·소유권 검사를 먼저 실행하고 로컬 자산 SHA-256 지문을 `src/build-info.js`에 기록합니다. 브라우저 smoke는 페이지의 `window.STACKFALL_BUILD_SHA`와 로컬 계산값을 비교해 이전 배포 자산이 제공되는 경우에도 실패합니다.

부하 검사의 p95 `50.5ms`, 50ms 이상 프레임 비율 `8%`, 최대 `100ms` 기준은 급격한 회귀를 막는 상한이며 60FPS 보장 기준이 아닙니다. 결과에는 평균 프레임 시간과 그 값으로 계산한 추정 FPS를 함께 기록합니다.

### Run modes and finite stages

`ENDLESS` remains the default infinite mode with random world events, the full enemy family pool, and the 600-second Apex cadence. Finite stages use their own catalog timelines and do not inherit the Endless encounter director.

Finite stages are **not** all ten-minute boss rushes. Each stage has an authored duration, fixed milestone incidents, and a persistent stage gimmick loop. The gimmick loop begins early, repeatedly cycles that stage's environmental hazard family, periodically injects a themed enemy surge, and accelerates toward the final boss. Reaching the listed time only spawns the boss; the operation ends only when that boss is defeated.

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

Constellation 1 ramps from a 10-minute opener to a 15-minute finale. Constellation 2 resets its opening tempo and grows to 20 minutes. Constellation 3 starts at 15 minutes and reaches a 25-minute finale. This keeps early operations replayable while allowing later stages to develop a Vampire-Survivors-style long-form pressure curve instead of repeating one fixed 600-second template.

Stage identities remain the existing Shardway, Abyssal Bloom, and Silent Array themes. Their fixed incidents now act as milestone set pieces inside the recurring environmental loop rather than being the only time the stage gimmick appears. Enemy pressure also continues to rise across longer stages instead of plateauing at the old ten-minute tuning.

`src/meta-progression.js` persists clears, per-stage clear counts, best times, weapon unlocks, Stardust, Core Shards, lifetime stats, and permanent upgrade levels. Fresh saves begin with four starter weapons. The basic Core weapon is separate from equipment capacity. The normal equipment roster now expands from 14 to 18 through post-Stage-10 rewards: Stage 11 unlocks Vacuum Bloom, Stage 13 Phase Minefield, Stage 15 Interstellar Missile Pods, and Stage 17 Orbital Gate. Stages 12/14/16/18 retain currency/Core-Shard emphasis.

#### Post-roster weapon expansion

Stage 11/13/15/17 now unlock four fully implemented equipment families. Vacuum Bloom is a kill-fed delayed collapse network; Phase Minefield turns the player's movement trail into armed territory; Interstellar Missile Pods use visible left/right side ejection, delayed ignition, curved homing, terminal burn, and a full-damage main MIRV warhead; Orbital Gate installs a stationary world-space gate network at enemy lines or the cast-time player position. The event-only Projection Core / 다중 투영 코어 adds primary attack bodies without recursively multiplying child payloads: extra seeds, mines, main missiles, or gate pulses. MIRV children, phantom mines, forced blooms, and gate-crossfeed copies never multiply themselves.

#### Galaxy map

Stages are grouped into constellation pages. Only the active constellation is drawn at once; finishing the final stage of a constellation unlocks access to the next constellation page when that page is added to the catalog. Connections are driven by explicit predecessor links rather than cross-page catalog order.

The main menu is a mode hub: `GALACTIC OPERATIONS`, `ENDLESS`, and `CORE DEVELOPMENT`. The upper-left local pilot card is now interactive and opens detailed local-save stats: clears, runs, kills, equipment capacity, unlocked weapons, Stage 1 best time, and currencies. Core Development keeps the **same shared player-core renderer used in combat** centered inside an orbital upgrade field with floating nodes and is viewport-contained on normal desktop screens; compact/mobile layouts may scroll. Future skins therefore only need to change the shared player renderer to update both combat and the growth preview. Skins themselves are intentionally deferred. Starter weapon and difficulty selection still live in the shared sortie screen. Galaxy-map stage nodes use luminous stellar points with separate number badges.

