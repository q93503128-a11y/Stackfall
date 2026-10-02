# STACKFALL

장비를 중첩해 공격 방식과 우주 전장을 변화시키며 버티는 웹 생존 액션 게임입니다.

- 저장소: `q93503128-a11y/Stackfall`
- 배포: `https://stackfall.pages.dev`
- 실행 환경: 정적 HTML/CSS/JavaScript
- 기본 화면: Canvas 2D
- 적 탄환·장식 전투 파티클·후처리: PixiJS WebGL
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
- 일반 장비: 18종
- 장비 중첩: 1~6
- 패시브: 슬롯 제한 없음
- 치명타 확률 상한: 100%
- 레벨당 기본 피해 증가: 1.1%
- 같은 이름의 스탯은 합연산
- 이름이 다른 피해 계수는 곱연산
- 초월체: 실제 게임 시간 8분 간격
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

공통 각성 런타임은 6중첩/각성 코어 조건 검사, 붉은 월식 선택창, 거부 후 일반 레벨업 복귀, 코어 소비와 각성 상태 표시까지 연결되어 있습니다. 자동 레벨업을 사용해도 각성은 자동 확정되지 않습니다. **각성 코어는 보스 전투에서 얻습니다.** 무한모드 일반 보스·공허 보스·기함급 보스와 스테이지 중간보스는 1개, 초월체는 2개를 지급합니다. 스테이지 최종보스는 처치와 동시에 런이 종료되므로 지급하지 않으며, 남은 각성 코어는 런 종료 시 1개당 기본 Stardust 40으로 환전됩니다. **A1~A19 전 무기의 실제 전투 메커닉과 전용 렌더링 1차 구현이 완료되었습니다.** 마지막 6종에는 창세 은하의 4회 주기 수축 은하, 천경 성역의 6면 완전 반사, 흑성 연화의 잔류 연화/폐화, 위상 성궤의 실제 이동 경로 주행, 성멸 포대의 집결→동시 돌입, 초공간 대관문의 공유 회로 대전송이 연결되어 있습니다.

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

초월체는 실제 게임 시간 8분·16분·24분마다 등장하며 전용 봉쇄장을 사용합니다. 넉백·중력 흡입·시간 정지·이동 봉쇄에 면역입니다.

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

### Canvas와 WebGL의 소유권

단일 게임 Canvas가 배경, 적·보스·플레이어, 모든 플레이어 투사체와 광선, 공전 장비, 각성 실루엣, 월드 구조와 안내를 그립니다. PixiJS는 적 탄환, 장식 파티클, 후처리를 맡습니다. WebGL 로드·초기화·컨텍스트 복구에 실패하면 게임 Canvas가 이 효과도 그립니다.

화면 계층은 `단일 게임 Canvas → PixiJS 보조 효과 → HTML UI`입니다. 플레이어 무기 외형은 양쪽 경로에서 같은 Canvas 렌더러를 사용합니다.

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
- 측정된 프레임 지연에 따른 장식 파티클 예산과 Pixi 갱신 빈도 조절

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
- 잘린 게임 진행 시간이 아닌 실제 브라우저 프레임 간격으로 렉을 감지하고, **2배속에서도 렌더 프레임당 한 번만 측정**해 시뮬레이션 다중 업데이트 때문에 부하가 낮게 측정되지 않도록 함
- 고해상도 노트북의 fill-rate 폭증을 막기 위해 **화면 면적 130만 px 이상에서는 내부 해상도를 90%로 낮추고 Canvas/WebGL DPR 상한을 1.15**로 제한
- 스테이지의 동시 일반 적은 Stage 번호·진행도·현재 성능 단계에 따른 spawn budget으로 제한하고, 후반 난이도를 무제한 개체 수 증가에 의존하지 않음
- 정상 데스크톱의 이론상 동시 일반 적 상단은 Stage 1 약 42체 → Stage 18 약 67체이며, authored cap이 더 낮으면 그 값을 우선함. 콤팩트 화면은 약 34체 → 53체, 성능 Tier 1/2는 다시 약 92%/80%로 축소
- 별 레이어와 이동 표식의 월드 좌표 패럴랙스를 강화해 배경이 화면에 고정된 한 장처럼 보이지 않게 함
- 성능 보호 단계는 적·투사체·적탄·위험 예고 같은 논리 엔티티의 상한을 바꾸지 않으며, 투사체 분열·파편·부메랑·혜성 경로 피해·중력 우물을 삭제하거나 피해 주기를 늦추지 않는다.
- 심각한 지연 중에는 Pixi 시각 갱신을 최대 24FPS로 제한하고 장식 입자 예산을 줄입니다. 플레이어 무기·각성 실루엣과 화면 밖 안내는 원래 Canvas 렌더러로 계속 그립니다. 부하 때문에 추가로 해상도를 낮추거나 화면을 단순 실루엣으로 교체하지 않습니다.

성능 보호는 장식 효과 예산과 시각 갱신 빈도를 조절합니다. 결정적 브라우저 계약은 정상 단계와 심각 단계에서 생성된 공격체 수와 누적 피해량이 같은지 함께 비교합니다.

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

`ENDLESS` remains the default infinite mode with random world events, the full enemy family pool, and the 480-second (8-minute) Apex cadence. Finite stages use their own catalog timelines and do not inherit the Endless encounter director.

Stage 1 now starts at **5 minutes**, and the campaign rises to **15 minutes at Stage 18**. Fixed incidents and the recurring stage gimmick are compressed with the new operation length rather than being cut off. Reaching the listed time only spawns the final boss; the operation ends only when that boss is defeated.

| Stage | 작전 | 최종보스 등장 |
|---|---|---:|
| 01 | 붕괴 전초구역 | 5:00 |
| 02 | 이온 성운 해구 | 5:30 |
| 03 | 유리별 묘역 | 6:00 |
| 04 | 정지궤도 회랑 | 6:30 |
| 05 | 자기극 폭풍대 | 7:00 |
| 06 | 파편 성좌핵 | 7:30 |
| 07 | 검은 꽃밭 | 8:00 |
| 08 | 흑수액 협곡 | 8:30 |
| 09 | 나선 종자층 | 9:00 |
| 10 | 반사 화관 성소 | 9:30 |
| 11 | 종자 갑각층 | 10:00 |
| 12 | 심연 개화핵 | 10:30 |
| 13 | 무응답 중계소 | 11:00 |
| 14 | 잡음 협로 | 11:30 |
| 15 | 패킷 폭풍대 | 12:00 |
| 16 | 블라인드 섹터 | 13:00 |
| 17 | 암호 묘역 | 14:00 |
| 18 | 침묵 배열핵 | 15:00 |

일반 스테이지는 진행도 약 46%에 중간보스가 한 번 등장합니다. 성좌 최종 스테이지인 **6/12/18**은 약 32%와 62%에 두 번 등장합니다. 일반 스테이지 최종보스는 무한모드 일반 보스급을 기준으로 하는 **스테이지 보스**, 6/12/18의 최종보스는 한 단계 강화된 **성좌 보스**입니다. 둘 다 **초월체(Apex)와는 별도 등급**이며 초월체가 최상위 위협으로 유지됩니다.

스테이지 일반 적은 진행도와 Stage 번호에 따라 증가하지만 동시 개체 수에 성능 인식형 상한을 둡니다. 후반 난이도는 적 조합·기믹·중간보스·보스 패턴으로도 상승하며, 예전처럼 단순히 80대 이상의 일반 적을 계속 쌓는 구조를 피합니다.

난이도는 Stardust 보상에도 연결됩니다. **쉬움 ×0.85 / 보통 ×1.00 / 어려움 ×1.30**이며, 무기 해금과 Core Shard는 이 배율의 영향을 받지 않습니다.

런 종료 시 남은 각성 코어는 **1개당 기본 Stardust 40**으로 환전되며 해당 런의 Stardust 획득 배율이 적용됩니다. 사망, 스테이지 클리어, 중도 종료에서 모두 처리되고 결과 화면에 `CORE ×N → ✦ 지급량`이 표시됩니다.

결과 화면의 딜 추이는 전체 DPS 외에 **무기별 15초 구간 DPS**도 표시합니다. 전체 및 각 무기의 그래프는 각각 켜고 끌 수 있습니다.

Stage identities remain the existing Shardway, Abyssal Bloom, and Silent Array themes. Their fixed incidents remain milestone set pieces inside the recurring environmental loop. `src/meta-progression.js` persists clears, per-stage clear counts, best times, weapon unlocks, Stardust, Core Shards, lifetime stats, and permanent upgrade levels.

Stage gimmicks now use a separate environmental visual language instead of boss-style circle/beam telegraphs: **Shardway** uses broken route rails and braces, **Abyssal Bloom** uses roots/petals/living bulkheads, and **Silent Array** uses relay circuits/scan sectors/data shutters. Their warnings also use a compact environment notice instead of the boss warning banner.

The **in-combat stage fields** also carry those identities independently of Endless: Shardway adds broken route lanes/hub rings, Abyssal Bloom adds world-anchored roots and growth structures, and Silent Array adds relay grids/nodes/scanning lines. Individual stages vary angle, density, and layout while preserving their constellation family.

The galaxy map follows the same identity split. Shardway uses straight route links and angular nodes, Abyssal Bloom uses curved organic branches and petal-like nodes, while Silent Array uses right-angle circuit paths and relay nodes. Background patterns change with the page rather than only recoloring one template.

#### Post-roster weapon expansion

Stage 11/13/15/17 now unlock four fully implemented equipment families. Vacuum Bloom is a kill-fed delayed collapse network; Phase Minefield turns the player's movement trail into armed territory; Interstellar Missile Pods use visible left/right side ejection, delayed ignition, curved homing, terminal burn, and a full-damage main MIRV warhead; Orbital Gate installs a stationary world-space gate network at enemy lines or the cast-time player position. The event-only Projection Core / 다중 투영 코어 adds primary attack bodies without recursively multiplying child payloads: extra seeds, mines, main missiles, or gate pulses. MIRV children, phantom mines, forced blooms, and gate-crossfeed copies never multiply themselves.

#### Galaxy map

Stages are grouped into constellation pages. Only the active constellation is drawn at once; finishing the final stage of a constellation unlocks access to the next constellation page when that page is added to the catalog. Connections are driven by explicit predecessor links rather than cross-page catalog order.

The main menu is a mode hub: `GALACTIC OPERATIONS`, `ENDLESS`, and `CORE DEVELOPMENT`. The upper-left local pilot card is now interactive and opens detailed local-save stats: clears, runs, kills, equipment capacity, unlocked weapons, Stage 1 best time, and currencies. Core Development keeps the **same shared player-core renderer used in combat** centered inside an orbital upgrade field with floating nodes and is viewport-contained on normal desktop screens; compact/mobile layouts may scroll. Future skins therefore only need to change the shared player renderer to update both combat and the growth preview. Skins themselves are intentionally deferred. Starter weapon and difficulty selection still live in the shared sortie screen. Galaxy-map stage nodes use luminous stellar points with separate number badges.


2026-09 정합성 감사의 함수 소유권, 수정 내역과 검증 범위는 [감사 보고서](docs/AWAKENING_RENDER_AUDIT.md)를 참고하세요.


### Stage 1 production remake — 2026-10-01

붕괴 전초구역은 연속 항로와 지터링된 검문 구조, 시간에 따른 전력 복귀·파열·관문 접근을 사용한다. 낙하 데크와 비대칭 역 U자 전초 수호자는 실제 물체이며, 외장과 공격/접촉 판정이 같은 회전 사각형을 공유한다. 열린 중앙 공간에는 판정이 없다. 잔해 회수 포격·엇갈린 셔터·파손 거더·가속 돌파를 순차 실행하며 48%에서 장갑이 열리고 하역장이 15% 확장된다. 격파는 핵 소등과 관문 해제로 끝난다. 탐험 frontier / 최종전 warden 음악을 구분한다. 5:00 등장, 적·사건·보상·해금은 기존 기획을 유지한다. 개발 보스 버튼은 4:55부터 정상 등장씬으로 진행하며 과거 사건을 재실행하지 않는다.

실제 Chromium GPU·Canvas·390×844 모바일에서 등장, 4종 동작, 48% 전환, 격파/보상 결과, 고속 탄환의 외장 적중과 중앙 공백을 검사한다. `scripts/stage-production-browser.mjs --stage=1`의 이미지·JSON은 로컬 `test-results/production-stage-01`에 생성된다.


### Stage 2 production remake — 2026-10-01

이온 성운 해구는 압력 증가·심층 진입·동맥류·먼 심실 맥박으로 진행된다. 전단 경고 뒤 실제 이온막이 흐르며 hard arena는 없다. 비대칭 심장은 0.75초 유맥 점등 후 방전, 흡기 후 방향 분출, 횡류의 대형 액적을 순차 사용한다. 68%에서 심실 분리, 32%에서 편심맥/역류로 바뀌며 예약 동작은 취소된다. 같은 심장이 응집 등장하고 격파 때 찢어져 해구가 맑아진다. 330초와 기존 보상·적·사건, visualR64 / hitRadius92 / contactR64를 유지한다. GPU도 전용 액적 외형을 보존한다. 음악은 탐험 trench / 전투 heart를 사용한다.


Stage 3 production 정본: 유리별 묘역은 불규칙 수직 묘표가 시간에 따라 노출·균열되는 공간이다. 굴절 성물함은 길쭉한 결정 석관이며 독립 묘표 사이를 관성 이동한다. 52%에서 뚜껑이 분리된다. 결정 강하, 굴절 분열, 뚜껑 절단을 실제 다각형 이동과 swept 판정으로 구현한다. 3.4초 부상 등장과 3.9초 층별 박리·침강 격파가 동일 몸체를 사용한다. 360초와 유리날개·기존 조우·보상은 유지한다. 탐험 necropolis / 전투 reliquary 오리지널 음악 장면. 세부 검증과 중복 비교는 STAGE_PRODUCTION_REMAKE.md 참조.


Stage 4 production 정본: 정지궤도 회랑의 단절 시간 철로와 거대한 고정 톱니가 제동·역방향 틱·시간 해방을 표현한다. 영점 조율기는 비대칭 수평 이스케이프먼트와 긴 추를 가진다. 수평 제동 후 P3 과거 자취를 연속 역행하며 68/30% 구조 전환을 갖는다. 실제 진자추, 정지했다 재개하는 톱니, 과거 자취의 역행 인장이 공격한다. 3.5초 철로 맞물림 등장, 4.1초 구동축 정지·추 낙하·회랑 정방향 복구. 390초/시차 방랑체/조난 사건/보상 유지. stasis→escapement 음악과 건조한 기계 틱.


Stage 5 production 정본: 거대 비선형 자속 띠·철가루 정렬·드문 대형 도체로 자기극 폭풍을 구성한다. 쌍극 왕관은 두 극이 연결된 비대칭 S자 자성체이며 도체 사이 인력·척력 반동으로 움직인다. 58% 코일 연결 파열·극 높이 분리. 실제 철편을 끌어 모아 다시 반발시키고, 불규칙 유도 플라즈마와 예고 후 극성 밀림·역행 철편을 사용한다. 밀림은 보이는 자속 내부에서 제한 속도이며 좌표 순간 보정이 없다. 3.6초 정렬 등장, 4.0초 탈자·극 분리·철가루 낙하로 폭풍을 마무리한다. 420초·도체 기생체·기존 조우/사건·보상 유지. magnetar→dipole 음악과 저음 유도 전류 효과음.

### Stage 1~18 production 정본 — 2026-10-02

각 Stage는 기존 시간·적 능력/해금·조우·사건·보상을 유지하며 배경/몸체/이동/기믹/공격/등장/페이즈/격파를 다시 제작했다. 전투와 등장·격파는 동일 외장을 사용한다. S3~18은 해당 stageXX-runtime.js의 production 정의가 소유하고 S1~2는 전용 공용 디렉터를 사용한다. 큰 비정형 몸체와 실물 공격은 렌더와 실제 다각형/OBB 판정을 공유한다. S2의 visual64/hit92/contact64는 보존한다.

| Stage | 공간 / 랜드마크 | 기믹 / 진행 변화 | 몸체 / 이동 | 대표 공격 | 페이즈 / 격파 |
| --- | --- | --- | --- | --- | --- |
| 1 | 연속 파손 항로, 불규칙 검문소와 인양 잔해 | 전력 복귀→항로판 하강→봉쇄 준비→먼 관문 접근 | 비대칭 역 U 관문, 상단 레일 추적과 하중 가속·제동 | 잔해 3개 사출 / 연결 통로 셔터 / 거더 휘두르기 / 본체 돌파 | 48% 장갑 파열·통로 15% 확장 / 핵 소등·관문 주저앉음·이온 출구 |
| 2 | 중첩 성운·연속 굴곡 양안·먼 심실 | 압력→심층→동맥 가속→맥박 / 실제 이온막 횡류 | 비대칭 두 심실·불규칙 유맥 / 관성 해류 표류 | 점등 후 순차 방전 / 흡기·분출 / 횡류 액적 | 68% 심실 분리·32% 편심맥 / 배액·해구 투명화 |
| 3 | 불규칙 수직 묘표·각인 성묘·결정층 | 노출→각인 점등→균열→석관 부상 / 실제 결정 강하 | 길쭉한 비대칭 다각 석관 / 독립 묘표 사이 관성 제동 | 결정 강하 / 굴절 분열 / 뚜껑 절단 | 52% 뚜껑 분리 / 층별 박리·침강·각인 소등 |
| 4 | 단절 시간 철로·정지 이스케이프먼트 | 제동→역틱→시간 복구 / 정지·재개 톱니 | 비대칭 수평 기구와 추 / 수평 왕복 제동·과거 경로 역행 | 실제 진자추 / 멎는 톱니 / 과거 인장 역행 | 68/30% 추·고정추 분리 / 축 정지·추 낙하·시간 해방 |
| 5 | 비선형 무한 자속 띠·철가루·드문 거대 도체 | 정렬→유도 증가→극점 반전→탈자 / 실제 철편 인양·반발 | 비대칭 S자 두 극 / 인력·척력 반동 | 철편 회수→반발 산탄 / 가지친 유도 플라즈마 / 제한 속도의 극성 밀림 | 58% 코일 파열·극 분리·전도 / 탈자·극 표류·철가루 낙하 |
| 6 | 무한 환승 그래프·드문 교차점 | 점등→전환판 오작동→출구 수렴 | 비대칭 3층 E자 데크 / 독립 정박 제동 | 수송체 합류·전환판 접힘·도로판 이탈·중층 전환 | 70% 상층 상승·35% 중층 분리 / 데크 이탈·항로 해제 |
| 7 | 큰 비정형 수관·가지·매달린 포낭 | 착생→수관→포낭→호흡 | 비대칭 측면 꽃 / 뿌리 붙잡아 몸 끌기 | 뿌리 엮기·찢긴 포자막·꽃받침 포식 접힘 | 48% 포낭 파열·기관 노출 / 처짐·장력 해제·수관 건조 |
| 8 | 세 깊이의 연속 생체 협곡 단면 | 수액→밸브→맥동→막 수축 | 등쪽 혈관·세 늑막·주근 / 막 사이 혈류 미끄러짐 | 굴곡 주근·점성 수액 역류·혈관 다리 | 67% 늑막 개방·30% 유로 분리 / 배액·주근 풀림·양 막 개방 |
| 9 | 거대 종자 퇴적물·비정형 발아 군집 | 배양→발아→검은 접합부 전조 | 꼬인 세로 종피·세 배양낭 / 축방향 압축 보행 | 두 종자 쌍 교차·발아추·주축 구름 | 50% 종피 분리 / 비틀림 해제·종자 낙하·작은 검은 반사 |
| 10 | 비스듬한 흑경 판·clipped 내부 반사 | 도금→어긋남→접합부 개방 | 접힌 유리 외투·짧은 갈고리 / 고정 거울축 관성 이동 | 반사점 꽃잎 회전·역재생 잔상·본체 관통 비행 | 70% 경첩 개방·32% 갈고리 분리 / 실물 파편→늦은 반사 붕괴·봉합 |
| 11 | 연속 비정형 갑각 능선·겹친 단면 | 결합→내부 압력→방어층 폐쇄 | 가로로 긴 5겹 종피·두 받침 다리 / 옆걸음·제동 | 굵은 종자 곡선 투척·종피 압착·실제 다리 발구름 | 55% 종피 이탈·긴 내부 조직 / 다리 꺾임·갑각 침하·순차 종피 낙하 |
| 12 | 거대 배양 분지·두꺼운 공급 조직 | 결합→압력→전층 수축·분절 주머니 출구 변경 | 두 비대칭 보호 종피·태아형 심체 / 외부 활강→근육 추진 | 실제 외피 절단·배양 조직 폭풍·바닥 연동·본체 돌파 | 72% 외피 개방·34% 몸체 풀림 / 조직 처짐·공급망 건조·중계 하드웨어 노출 |
| 13 | 접힌 거대 수신판·도파관·케이블 | 죽은 면→반송파→재전송→대기 | 높은 편측 수신판·꺾인 지지대·균형추 / 축별 듣기·횡이동·제동 | 빗살판 스캔·절연체 낙하·3구간 저장/전달 | 57% 판 개방·축 변경 / 수신판 수납·확인등 소등 |
| 14 | 찢어진 큰 흡음 시트·주름 단면 | 위상 엇갈림→응결→포화→상쇄 공백 | 긴 흡입 홈·길이 다른 세 배플 / 협로 미끄러짐·서로 다른 진동 | 잔류 셀 성장·두 위상 상쇄·3회 정지 포일 | 66% 배플 분리·31% 전단 풀림 / 배플 시간차 정지·처짐 |
| 15 | 큰 3채널 케이블 다발·접속부 | 큐 적층→전송 가속→분리 | 비스듬한 저장 띠·편측 송신단·3포트 / 채널 반동·제동 | 독립 곡선 전송·같은 패킷 2반쪽 분기·3포트 압출 | 49% 포트 분리 / 역방향 큐 비움·포트 폐쇄·저장 띠 처짐 |
| 16 | 무광 탐지 단면·차폐 구조·빛 틈 | 소실→면 어긋남→차폐 팽창 | 비스듬한 쐐기 비콘·편측 후드·렌즈 / 긴 대기→예고 재고정 | 넓은 광학 면 회전·빈 절개 판·전체 몸체 이동 | 70% 후드 개방·29% 렌즈 분리 / 렌즈 침하·기둥 꺾임·차폐 해제 |
| 17 | 거대한 각인 금고·황동 래치 통로 | 규칙 각인→래치 접속→봉쇄→대기 | 비대칭 금고 머리·긴 편측 키·왕복 톱 / 두 잠금점 | 곡선 키 블록·최근 이동 방향 봉쇄/반대 출구·몸체 톱 | 54% 보호판 이탈 / 확인등 소등·키 해제·톱 분리 |
| 18 | 거대 기록 장·접힌 주소 층·잃은 행 | 주소 수렴→누락→축 불일치→정적 | 편측 기록 장·비스듬한 등뼈·off-center 실행실 / 기준점 수렴 | 두 L 지형 중심/축 재작성·세 주소 재배정·실행실 압출·장 박리 | 74% 실행실 노출·36% 기록 장 이탈 / 6.2초 시간차 장치 해제·열린 항로 |

개발 보스 진입은 정확히 5초 뒤 정상 등장 트리거를 사용하며 이전 사건/적을 몰아서 실행하지 않는다. x2는 60Hz 물리 스텝 두 번, 고속 공격은 swept/segment, 독립 위험 물체는 최대 6개다. GPU·Canvas·모바일·성능 단계에서 저마다의 authored 외장을 유지한다. 탐험/최종전별 오리지널 WebAudio 장면과 효과음을 사용하고 런 종료 시 음악을 정지한다. 음질/재미는 실제 청취·실플레이로 별도 평가한다.

설계와 검증, 9개 비교 축 및 세부 음악/등장/전장 목록은 [Stage production ledger](docs/STAGE_PRODUCTION_REMAKE.md)에 기록한다. `node scripts/stage-production-browser.mjs --stage=N`은 실제 세 렌더 경로의 이미지/JSON을 test-results/production-stage-NN에 저장한다.
