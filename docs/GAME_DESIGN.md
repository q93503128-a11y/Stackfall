# STACKFALL 게임 정보 및 개발 규칙

마지막 동기화: 2026-09-22

이 문서는 STACKFALL의 실제 게임 규칙, 밸런스 기준, 소유권과 회귀 방지 조건을 정리한 공식 기준 문서다. `README.md`, 이 문서, `WIKI.md`를 함께 관리한다. 현재 코드와 충돌하는 과거 문서·채팅 요약·주석은 기준으로 사용하지 않는다.

---

## 1. 게임 정의

> 여섯 개의 일반 장비 슬롯과 별도 기본 무기를 중첩해 공격 방식과 화면 구성이 실제로 변하는 우주 생존 액션 게임.

### 핵심 규칙

- 일반 장비 슬롯: 6칸
- 기본 무기: `코어 펄스`, 일반 슬롯과 별도
- 일반 장비: 14종
- 장비 중첩: 1~6
- 패시브: 슬롯 제한 없음
- 치명타 확률 상한: 100%
- 레벨당 기본 피해 증가: 1.1%
- 초월체: 실제 게임 시간 10분 간격
- 일시정지·능력 장부·선택·보상 중에는 게임 시간과 초월체 예정 시간이 진행되지 않음

```text
레벨 요구 경험치
= 10 + 3.8 × level + 1.35 × level^1.34
```

---

## 2. 스탯 계산

같은 이름의 스탯은 중첩 수를 합산한다. 같은 패시브를 중첩마다 복리로 다시 곱하지 않는다. 서로 다른 피해 계층은 기본적으로 곱한다.

```text
출력 증폭 2중첩
= 1 + 0.10 × 2
= ×1.20
```

레벨, 출력 증폭, 거성 사냥꾼, 성운 강화, 초월체 유산, 공허 각인, 연쇄 피해와 저체력 과출력은 서로 다른 계층이다.

---

## 3. 패시브

게임 안 설명은 기능과 실제 효과만 짧게 표시한다. 내부 계산식, 개발 이력, 소유 모듈과 “첫 중첩은 약하다” 같은 설계 메모를 선택 카드에 넣지 않는다. 확률 설명은 `%`로 통일한다.

| 키 | 이름 | 중첩 효과 |
|---|---|---|
| magnet | 자석 코어 | 결정 흡수 범위 +34, 결정 흡인 속도 증가 |
| echo | 에코 비콘 | 발사·설치형 장비 복제 확률 +7.5% |
| power | 출력 증폭 | 모든 피해 +10% |
| haste | 가속 회로 | 장비 발동 주기 -7% |
| vitality | 재생 장갑 | 최대 체력 +28, 즉시 체력 46 회복 |
| speed | 벡터 부스터 | 이동 속도 +9% |
| crit | 취약점 해석 | 치명타 확률 +6% |
| chain | 연쇄 과부하 | 연쇄 유지시간과 연쇄 피해 증가 |
| greed | 개척 계약 | 적 체력 +10%, 경험치 획득량 +30% |
| armor | 충격 흡수재 | 받는 피해 -7.5% |
| chainDrive | 연쇄 추진기 | 12연쇄마다 장비 주기 추가 단축 |
| chainBurst | 연쇄 폭심 | 20연쇄마다 중심 폭발 |
| chainRecovery | 연쇄 회수 | 30연쇄마다 최대 체력 비례 회복 |
| chainField | 전리품 공명 | 현재 연쇄에 따라 결정 흡수 범위 증가 |
| eliteHunter | 거성 사냥꾼 | 중간보스·보스 피해 +15% |
| pierce | 관통 렌즈 | 투사체 관통 +1 |
| regen | 자가 복원 | 초당 체력 1 회복 |
| wisdom | 성운 통찰 | 경험치 획득량 +10% |
| overdrive | 임계 과출력 | 플레이어 체력 45% 미만일 때 피해 +14% |
| projectileSize | 광자 팽창 | 투사체·광선·공격 판정 크기 +10% |
| projectileSpeed | 광자 가속 | 투사체 속도 +10%, 공전 장비 회전 속도 증가 |
| range | 심우주 조준기 | 무기 기본 조준·비행 사거리 +10% |
| multiplicity | 다중 투영 코어 | 지원되는 공격체 +1, 원본 표적 공유, 최대 2중첩 |

### 자석 코어

```text
흡수 반경 = 74 + 자석 코어 중첩 × 34 + 성운 자석 강화
흡인 속도 계수 = 1 + 자석 코어 중첩 × 0.22 + 이벤트 강화
```

흡인 반경만 늘고 결정이 천천히 따라오는 상태로 되돌리지 않는다.

### 에코 비콘

- 중첩 0: 복제 확률 0%
- 1중첩부터: `min(60%, 중첩 × 7.5%)`
- 첫 복제: 원본보다 약 64~91ms 지연
- 고중첩 추가 복제: 약 90~120ms 추가 지연
- 8중첩: 매 5번째 발동 보장

### 연쇄

- 연쇄 과부하: 유지시간과 피해 증가
- 연쇄 추진기: 12연쇄 단위 주기 단축
- 연쇄 폭심: 20연쇄 단위 중심 폭발
- 연쇄 회수: 30연쇄 단위 최대 체력 비례 회복
- 전리품 공명: 현재 연쇄에 따른 흡수 반경 증가
- 보스·초월체 누적 피해도 연쇄를 진행함

연쇄 회수는 `curvedStackPower(recovery,.80,1.08,1.16)`을 사용하며 회복 비율은 다음과 같다.

```text
min(30%, 2.5% + 중첩 곡선 × 1.8% + 연쇄 보너스)
```

---

## 4. 무기와 표적 선택

### 기본 사거리

| 키 | 이름 | 기본 사거리 | 역할 |
|---|---|---:|---|
| core | 코어 펄스 | 500 | 강화된 고속 자동 추적 기본 무기 |
| blade | 펄스 블레이드 | 190 | 근접 공전 지속 피해 |
| ember | 별빛 캐스터 | 560 | 중거리 다발 탄환 |
| bulwark | 성광 장벽 | 150 | 방어와 보호막 |
| gravity | 중력 우물 | 430 | 집속과 범위 제어 |
| comet | 혜성 창 | 760 | 장거리 고관통 |
| prism | 성좌 프리즘 | 520 | 고정 단일 표적 집속 |
| chrono | 시간 고리 | 250 | 감속과 장비 가속 |
| arc | 성운 부메랑 | 570 | 가장 먼 적 왕복 타격 |
| ion | 이온 사슬 | 450 | 다중 적 연쇄 피해 |
| nova | 초신성 코일 | 245 | 중심 파동·표적 집속 |
| drone | 유성 드론 | 540 | 고화력 편대 집중 사격 |
| rail | 성간 레일 | 920 | 초장거리 평행 관통 광선 |
| spiral | 은하 나선 | 500 | 한 표적 집중 나선 탄막 |
| mirror | 반사 성좌 | 350 | 적 탄환 제거와 반격 |

### 보호막 최대치 규칙

서로 다른 지속 보호막 효과를 동시에 보유하면 각 효과의 보호막 최대치 기여량을 **합산**한다. 같은 효과를 여러 번 중첩한 경우에는 그 효과 자체의 중첩 성장식을 먼저 계산한 뒤, 다른 보호막 효과와 더한다. 보호막 충전 효과는 현재 보호막을 낮추지 않는다.

### 집중 표적 원칙

한 번의 발동에서 생성되는 여러 투사체·드론·나선·평행 광선은 원칙적으로 하나의 표적을 공유한다. `다중 투영 코어`의 추가 공격체도 원본 표적을 사용한다.

기본 화력 기준:

- 코어 펄스: 기본 발동 주기 `0.76 × 공격 주기 배율`, 피해 `11 + 중첩 × 2.5`, 탄속 520
- 유성 드론: 피해 `12 + 중첩 × 3.6`, 중첩에 따라 발동 주기가 `1.34`에서 추가 단축
- 유성 드론 4중첩 이상은 집중 2연사, 6중첩은 5회마다 8발 집중 탄막
- 유성 낙하 특수효과의 표식 대상은 사거리 안 현재 체력이 가장 높은 적

예외:

- 이온 사슬은 적 사이를 잇는 연쇄 공격을 유지
- 펄스 블레이드는 공전 충돌체
- 중력 우물은 여러 위치에 설치되는 제어 장비
- 부메랑은 같은 표적을 향하되 좌우 곡선 사용
- 평행·교차 광선은 같은 표적을 여러 선으로 가름

### 수동 조준

- 설정 기본값: 꺼짐
- 켜짐: 마우스 포인터에 가장 가까운 사거리 내 적 선택
- 꺼짐: 무기별 자동 조준 규칙 사용
- 성운 부메랑 자동 조준: 사거리 내 가장 먼 적
- 성좌 프리즘: 이미 확보한 공유 락을 포인터 이동만으로 바꾸지 않음
- 저장 키: `stackfall.settings.manualAim`

### 성좌 프리즘

모든 프리즘은 `player.prismSharedLock` 하나를 공유한다.

| 중첩 | 효과 |
|---:|---|
| 1 | 프리즘 1개, 새 표적 조준 1초, 기본 출력 ×1 |
| 2 | 프리즘 2개가 같은 표적 집속 |
| 3 | 집속 단계 ×1 → ×1.85 → ×3.70 |
| 4 | 전환 시간 0.68초, 1.78초 |
| 5 | 최대 출력 ×4.10 |
| 6 | 프리즘 3개, 최대 출력 ×4.45, 최종 전환 1.55초 |

표적 규칙:

- 최초 탐색은 무기 자동 조준 또는 수동 조준 결과 사용
- 표적이 살아 있으면 가급적 사망할 때까지 유지
- 사거리 경계를 벗어나도 2.25초 동안 락 유지
- 장거리 이탈 또는 사망 시 새 표적 탐색
- 새 표적 획득 시 1초 동안 얇은 충전선만 표시
- 충전 중 피해 없음
- 새 표적 획득 시 집속 열 초기화
- 에코 광선과 추가 프리즘도 같은 락 사용

좌표 규칙:

- 공격 판정·광선 시작점·프리즘 외형 모두 `prismPositions(prismBodyCount())` 사용
- 렌더 전용 별도 각도·반경 계산을 만들지 않음
- 일반 집속 광선의 굵기는 시각 표현
- `과열 성선`은 보이는 굵기와 실제 판정 폭 일치

과열 성선:

- 최대 출력에서 교차 광선 발생
- 광선 피해: `16 + 프리즘 중첩 × 4.2`
- 표적 중심 추가 집중 피해

### 성운 부메랑

- 자동 조준은 사거리 내 가장 먼 적
- 여러 칼날은 같은 표적을 향해 다른 곡선 사용
- 5중첩부터 출발·귀환 경로에 지속 피해
- 경로 피해: `2.8 + 중첩 × 1.0`

---

## 5. 맵 이벤트

- 성운 보관소
- 추락한 우주선
- 공허 균열

공통 규칙:

- 이벤트 종료 후 최소 58초 간격
- 같은 종류 연속 등장 금지
- 이벤트 표식은 46초 뒤 소멸하고 재예약
- 우주선 전투 기본 제한 82초, 게임 시간에 따라 최대 124초까지 증가
- 공허 보스 제한 108초
- 초월체 예정 시각이 가까우면 신규 이벤트 연기

성운 보관소 예외:

- 보스·중간보스가 살아 있어도 표식 생성 가능
- 보스·중간보스가 살아 있어도 접촉 획득 가능
- 보관소 선택 화면에서는 전투와 게임 시간 정지
- 우주선·공허 균열은 정예 전투와 겹쳐 시작하지 않음

추락한 우주선 규칙:

- 이벤트 시작 시점의 게임 시간으로 방어 함대 체력·화력, 3개 웨이브의 수량과 제한시간을 계산
- 시간이 흐를수록 각 웨이브의 적 수가 계속 증가하며 함대 전투력은 최대 3.25배 계수까지 증가
- 세 번째 우주선 이벤트마다 `격리함 파멸자` 기함 출현
- 기함 이벤트 격리 반경: 데스크톱 610, 모바일 395
- 기함 패턴: 조준 탄막, 단기 유도 미사일, 3열 예고 레이저, 인터셉터 증원
- 세 웨이브와 기함을 모두 격파한 뒤 잔해 보상 개방

자동 무작위 중첩 규칙:

- 중간보스, 우주선 잔해, 공허 보상의 무작위 무기·패시브는 현재 중첩이 1 이상이고 최대 미만인 항목만 후보로 사용
- 후보가 없으면 신규 항목을 0→1로 열지 않고 보호막 또는 선체 강화로 대체
- 플레이어가 직접 고르는 일반 레벨업 획득은 별도 규칙으로 유지

---

## 6. 초월체

### 등장·성장

- 실제 게임 시간 10분·20분·30분마다 등장
- 선택·보상·맵 이벤트보다 우선
- 전용 봉쇄장 사용
- 넉백·중력 흡입·시간 정지·이동 봉쇄 면역
- 체력 75%·50%·25%와 전투 시간 조건으로 최대 4페이즈
- 플레이어 레벨·무기·패시브 성장량을 읽지 않음

```text
첫 초월체 체력 = 고유 체력 × 7.60
첫 초월체 피해 = 고유 피해 × 2.15
기본 스킬 주기 = 기존 주기 × 0.52
```

두 번째 이후는 등장 횟수 기준 누적 복리 강화다.

```text
체력 단계 배율 = 2.40, 2.74, 3.08, 3.42 ...
피해 단계 배율 = 1.58, 1.73, 1.88, 2.03 ...
```

### 시간포식자 추적광

- 시작 각도: 플레이어 방향에서 좌우 약 `0.92 + phase × 0.07` 라디안 이격
- 준비 시간: 0.9초
- 준비 중 회전 속도: 초당 약 0.48라디안
- 활성 중 회전 속도: 초당 약 `0.72 + phase × 0.055` 라디안
- 플레이어 위치로 즉시 스냅하지 않음
- 제한된 회전 속도로 전장을 휩쓸며 따라감
- 피해 판정과 광선 렌더 갱신을 별도 타이머로 처리

### 다른 고유 세트피스

- 종말 항성: 중앙 조석 용광핵, 약한 중력, 탄환륜·운석, 종료 붕괴
- 마지막 성좌: 회전 2~3방향 휩쓸기, 임시 성좌 전령
- 시간포식자: 시간 잔상·절단·추적광 동시 진행

### 초월체 유산

- 시간 탈취: 적·탄환 감속, 장비 과가속, 시간 파쇄 피해
- 미니어처 항성: 공전 항성 추적광·방사탄·최종 붕괴
- 살아 있는 성좌망: 연결선 절단, 적 탄환 제거, 노드 집중 포격, 최종 폭발
- 마지막 성좌 유산은 보호막 충전형이 아님

---

## 7. UI

- 능력 장부를 열면 게임 일시정지
- 닫으면 열기 전 플레이·일시정지·레벨 선택 상태 복귀
- 선택 카드 숫자 1·2·3·4 지원
- 이벤트 선택은 자동 제한시간 없음
- 초월체 HUD는 현재 P1~P4 표시
- 카드 설명은 짧은 플레이 효과만 표시
- 상세 장부는 실제 계산값을 읽고 전투 계산을 재정의하지 않음

---

## 8. 렌더링과 성능

화면 계층:

```text
배경 Canvas
→ PixiJS 아군 투사체·장식 효과
→ 전경 Canvas 적·보스·위험·광선
→ HTML UI
```

WebGL 실패·컨텍스트 손실·CDN 실패 시 Canvas 폴백으로 복귀한다.

### 지속 광선 객체 제한

이전 렉 원인은 추적광·성좌 휩쓸기·성좌망이 매 브라우저 프레임마다 여러 개의 짧은 광선 객체를 생성한 것이었다.

수정 규칙:

- 공격 판정 틱과 시각 광선 생성 틱 분리
- 추적광 시각 갱신: 일반 약 0.040초, 부하 상태 약 0.070초
- 성좌 휩쓸기: 일반 약 0.045초, 부하 상태 약 0.075초
- 성좌망: 일반 약 0.050초, 부하 상태 약 0.085초
- 장식 파티클 생성률 축소
- 프리즘도 피해 틱과 시각 틱 분리
- 시각 빈도 감소가 피해량·피해 주기에 영향을 주지 않음
- 매 투사체가 전체 적 배열을 훑지 않고 공간 격자 근접 후보만 충돌 검사
- 중력 우물과 범위 피해도 같은 근접 후보 순회 사용
- 공간 격자 버킷과 충돌 후보 배열을 재사용하고 다중 표적 정렬의 후보별 객체 생성을 없애 프레임별 임시 할당 감소

성능 보호 단계는 잘린 게임 `dt`가 아니라 실제 브라우저 프레임 간격으로 지연을 측정한다. 측정 프레임 지연이 누적된 경우 배경 장식 밀도·효과 밀도·화면에 그리는 아군 이펙트 수를 줄이고 Pixi 시각 갱신을 40FPS, 심각 단계에서는 24FPS로 제한한다. 높은 개체 밀도가 이미 확인된 프레임에서는 전체면 합성 정체를 기다리지 않고 긴급 렌더 경로를 선제 적용한다. WebGL이 없는 Canvas 폴백은 실제 프레임 지연이 약 0.9초 연속 관측되면 내부 해상도를 30%로 축소한다. WebGL에서는 Canvas 전체면 합성을 일시 정지하고 마지막 배경 위에 적·적탄·플레이어·광선·위험 예고를 간소화한 실루엣으로 계속 표시하며, 화면 밖 보스와 보관소·우주선·공허 이벤트의 가장자리 안내는 최대 16개의 사전 할당 화살표로 유지한다. 안정 상태가 충분히 이어져야 원래 렌더러로 복구한다. 적·투사체·적탄·위험 예고의 논리 상한은 성능 단계와 무관하게 유지하고, 분열·파편·부메랑·중력 우물을 삭제하거나 경로 피해 주기를 늦추지 않는다. 정상 단계와 심각 단계의 생성 공격체 수와 누적 피해량은 결정적 브라우저 fixture로 비교하며, 심각 단계의 화면 밖 안내 보존도 별도 브라우저 fixture로 검사한다.

브라우저 부하 기준의 p95 `50.5ms`, 50ms 이상 프레임 비율 `8%`, 최대 `100ms`는 성능 급락을 탐지하는 회귀 상한이다. 통과 자체를 60FPS 또는 원활한 플레이의 보장으로 해석하지 않으며 평균 프레임 시간과 추정 FPS를 함께 보고한다.

---

## 9. 소유권

- 투사체 이동·유도: `systems.js`
- 초월체·적 투사체·지속 광선: `bosses.js`
- 성장·연쇄: `progression-expansion.js`
- 맵 이벤트 본체: `map-event-expansion.js`
- 수동 조준·자석 흡인·보관소 정예 예외: `targeting-motion-refinement.js`
- 다중 투영·프리즘 공유 락·부메랑 후반 동작: `endgame-balance-expansion.js`
- 능력 상세와 화면 밖 안내: `build-audit-ui.js`
- 성능 보호와 캐시 렌더: `performance-guard.js`
- GPU 폴백: `gpu-renderer.js`

UI 모듈은 `damageMult`, `hasteMult`, 연쇄 계산을 재정의하지 않는다.

---

## 10. 회귀 방지

- 런타임 hotfix·override·source-sync 파일을 추가하지 않는다.
- 실제 소유 모듈을 직접 수정한다.
- 다중 투영 추가 공격체를 임의의 다른 표적으로 분산하지 않는다.
- 이온 사슬의 연쇄 공격은 유지한다.
- 부메랑 자동 표적은 사거리 내 가장 먼 적이다.
- 프리즘은 공유 락 하나를 사용하고 표적 생존 중 임의 전환하지 않는다.
- 프리즘 새 표적 1초 선딜을 제거하지 않는다.
- 프리즘 표시 위치와 실제 발사 위치를 다른 계산으로 분리하지 않는다.
- 초월체 추적광을 플레이어 방향으로 즉시 스냅하지 않는다.
- 지속 광선을 매 브라우저 프레임 객체 생성 방식으로 되돌리지 않는다.
- 초월체에 플레이어 성장량 보정을 다시 연결하지 않는다.
- 마지막 성좌 유산을 단순 보호막 충전으로 되돌리지 않는다.
- 성운 보관소를 정예 존재만으로 차단하지 않는다.
- 개발 TMI를 선택 카드 설명에 다시 넣지 않는다.
- 배포 지문 생성 전에 JavaScript 문법·영구 계약·소유권 검사를 실행한다.

## Run modes and finite stages (2026-09-22)

- `endless` remains non-finite, keeps random world events, exposes the full enemy family pool, and keeps the 600-second Apex cadence.
- `stage` is a separate finite operation mode. Random world events and Apex scheduling are suppressed during stage runs.
- Stage clear is **boss-death gated**, never timer gated. Reaching the authored duration spawns the final boss; the run continues until the player dies or that boss is defeated.
- Every authored stage has two layers of stage pressure:
  - **fixed incidents**: milestone waves/hazards placed at authored times;
  - **persistent gimmick loop**: begins early, repeatedly cycles the stage's own hazard family, periodically injects one of that stage's themed fixed-wave enemy families, and accelerates as boss time approaches.
- Long stages also continue increasing spawn cap, spawn rate, and late-run simultaneous spawn pressure. They must not plateau at the old 600-second balance point.
- A new stage does not require a new common enemy. Environmental rules, enemy combinations, and timing can carry identity when that is stronger than adding filler enemies.
- Constellation finales are longer than their openers and deliberately recombine the constellation's established enemy/hazard language.

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

### Constellation identities

- **Shardway / 파편의 항로 (Stage 1–6)**: collapsed route infrastructure, shard hosts, ion shear, refraction, time distortion, magnetar pressure, then route convergence.
- **Abyssal Bloom / 심연의 개화 (Stage 7–12)**: living stellar growth, spores, roots, sap vessels, seed spirals, reflection petals, husk pressure, then full biological convergence.
- **Silent Array / 침묵 중계망 (Stage 13–18)**: dead relay megastructures, broken carriers, static, packet storms, sensor blind zones, sealed protocols, then network-wide silence collapse.
- The complete current 14-item normal weapon roster is permanently unlockable by Stage 10. Stage 11+ uses Stardust/Core Shards until a genuinely new weapon is authored.

### Planned post-Stage-10 weapons

These four weapons are approved design targets but are **not implemented yet**. They expand the normal equipment roster from 14 to 18 when implemented. They must use the existing six-stack equipment model and the existing one-time boss-reward weapon-augment model. An augment is a separate run reward: it does not consume a stack, does not stack with itself, and must add a new behavior rather than merely repeating the 2/4/6 resonance.

#### 15. Vacuum Bloom / 진공 개화
- Planned unlock: **Stage 11 — Seedhusk Bastion**. Stage 12 remains a constellation-finale Core Shard reward.
- Role: kill-chain area control / delayed collapse.
- Core rule: kills periodically plant a vacuum seed at the defeated enemy. Other deaths inside its feeding radius charge it. A full seed pulls enemies inward and then collapses.
- Performance rule: seeds have a hard active cap; one death can feed each eligible seed only once; bloom cascades must use bounded propagation rather than recursive unbounded spawning.
- Stack 1 — **Vacuum Seed**: every 6 qualifying kills plants a seed. Radius 165, lifetime 7 s, active cap 3. Three nearby deaths fully charge it. Full collapse deals 38 base area damage after a short pull; expiration produces a 65% weak collapse.
- Stack 2 — **Deep Roots**: planting threshold 5 kills, radius 180, pull strength +22%, active cap 4.
- Stack 3 — **Predatory Bloom**: elite/miniboss deaths count as 2 charges; collapse damage +22% and begins with a brief stronger inward snap.
- Stack 4 — **Cross-Pollination**: a full bloom gives +2 charge to other seeds within 270 and increases their remaining lifetime by 1.2 s. This can accelerate a chain but cannot immediately retrigger the source bloom.
- Stack 5 — **Overgrowth**: planting threshold 4 kills, active cap 5. A seed reaching 5 total charges becomes overcharged and emits a second 45% implosion 0.32 s after the first.
- Stack 6 — **Vacuum Garden**: an overcharged collapse forces up to two nearby incomplete seeds to bloom in sequence at 70% power. The forced blooms cannot themselves force more blooms.
- Weapon augment — **Devouring Pollen / 포식 꽃가루**: the pull phase absorbs up to 8 ordinary enemy projectiles. Each absorbed projectile increases that bloom's final damage by 6% and radius by 2.5%, up to the cap. Apex/unerasable projectiles are never deleted by this effect.
- Identity boundary: this is not another Gravity Well. Gravity Well is periodically cast crowd control; Vacuum Bloom is a kill-fed delayed chain reaction that gets stronger when the player shapes where enemies die.

#### 16. Phase Minefield / 위상 기뢰군
- Planned unlock: **Stage 13 — Dead Relay**.
- Role: movement-path offense / territorial control.
- Core rule: moving through the battlefield leaves phase mines along the player's recent route. Remaining mobile creates better coverage, but a stationary player still receives a slower fallback deployment so the weapon never becomes dead.
- Placement rule: deploy after roughly 90 px of travel or 1.65 s, whichever happens first. Mines arm after 0.35 s, last 9 s, and are bounded by an active cap.
- Stack 1 — **Phase Mine**: 26 base damage, 74 blast radius, 48 trigger radius, active cap 6.
- Stack 2 — **Split Wake**: successive mines alternate 30 px to the left and right of the movement path, widening the trail. Active cap 8 and blast radius +8.
- Stack 3 — **Chain Fuse**: a mine explosion primes the nearest armed mine within 190 px to detonate after 0.12 s at 65% damage. Each mine may be chain-triggered once.
- Stack 4 — **Phase Tripwire**: consecutive armed mines within 210 px form a faint link. An enemy crossing that link takes a small cutting hit with an individual-link cooldown; mine explosions remain the main damage source.
- Stack 5 — **Dense Lattice**: travel requirement falls to 72 px, lifetime becomes 10.5 s, active cap 11, and chain-fuse search range rises to 230 px.
- Stack 6 — **Constellation Minefield**: every third deployment creates a compact three-mine triangular lattice instead of one mine. Its links are stronger, and if one triangle mine detonates the other two sequence-fire at 72% power. Triangle sequence detonations cannot recursively create another triangle chain.
- Weapon augment — **Afterimage Mine / 잔상 기뢰**: when a normal mine detonates, one weaker phantom mine is projected near the predicted position of the strongest nearby living enemy. The phantom arms almost immediately, lasts 2.4 s, deals 58% damage, and cannot create another phantom.
- Identity boundary: this weapon rewards deliberate movement and route drawing. It must not become a passive circular aura around the player.

#### 17. Interstellar Missile Pods / 성간 미사일 포드
- Planned unlock: **Stage 15 — Packet Stormfront**.
- Role: homing salvo / elite pressure / splash.
- Targeting: prefer a boss or miniboss in range; otherwise prefer a high-health target among the nearest viable enemies. Multi-missile salvos avoid obvious overkill by distributing across up to the allowed target count.
- **Mandatory launch-motion contract**: missiles do not originate from the player center and immediately home. A visible left and right launch pod is positioned beside the player. Each missile first ejects outward from its own side for about 0.12–0.18 s, then ignites, accelerates, and curves toward its target. Turning is smooth with retained momentum; no instant heading snap. Left and right missiles use visibly different approach arcs before converging.
- Stack 1 — **Twin Launch**: one missile from each side, 2 total. 2.35 s base cycle, 19 damage per missile, 60 explosion radius, 760 acquisition range.
- Stack 2 — **Dual Rack**: two missiles per side, 4 total, fired with an 0.08 s stagger. Individual missile damage is reduced slightly so the resonance is strong without exactly doubling total output.
- Stack 3 — **Reacquisition**: if a locked target dies before impact, the missile may acquire one new target in range. Explosion radius +10 and missile turn authority increases after ignition.
- Stack 4 — **Vector Lock**: salvos may split across two targets and use mild target-leading rather than pure pursuit. Elite targets still receive priority.
- Stack 5 — **Terminal Burn**: after 0.45 s of powered flight, surviving missiles enter a faster terminal phase, gain 18% impact damage, and leave a shorter brighter engine trail.
- Stack 6 — **Full Salvo**: three missiles per side, 6 total, launched as three left-right pairs over roughly 0.28 s. The salvo may distribute over three targets; against one boss all six can converge from alternating arcs.
- Weapon augment — **MIRV Constellation / 다탄두 성좌**: shortly before impact, each missile separates into one **main warhead plus two side warheads**. The main warhead keeps **100% of the original missile's impact and explosion damage**; taking the augment never reduces single-target damage. Each side warhead deals 34% of the parent missile's base impact/explosion damage. If secondary enemies exist they may peel toward those enemies; otherwise both may reconverge on the original target. Against one target the full split therefore reaches up to 168% of the unaugmented missile's damage, before ordinary global modifiers. Side warheads cannot split again.
- Audio/visual rule: ignition must have a distinct delayed thrust cue after the side-ejection beat. Exhaust is a short luminous trail, not screen-filling smoke.
- Identity boundary: Meteor Drones are persistent orbiting shooters; these missiles are discrete, readable salvos with side-launch choreography and curved homing flight.

#### 18. Orbital Gate / 궤도 문
- Planned unlock: **Stage 17 — Cipher Graveyard**. Stage 18 remains a constellation-finale Core Shard reward.
- Role: stationary spatial network / installed lane control.
- **Installation rule**: gates never follow the player after deployment. A network is anchored to world coordinates for its full lifetime, so the player can fight inside it, leave it behind, or drag enemies back through it.
- Placement alternates between two deployment modes so both offensive and defensive placement happen naturally:
  - **Assault placement**: center the next network on the strongest viable enemy or the densest nearby enemy cluster.
  - **Bastion placement**: center the next network on the player's position at cast time.
  - If the preferred assault target disappears before placement resolves, fall back to the cast-time player position. No gate snaps to a moving target after being installed.
- Base deployment cadence: 6.4 s; base network lifetime: 9.0 s; one ordinary network active at a time. Re-deploying replaces the oldest ordinary network only after the new network finishes its short opening animation.
- Core rule: energy pulses travel between stationary gates, disappear into one entrance, reappear from the next exit, and continue through the network. The gates do not orbit or translate after installation.
- Stack 1 — **Gate Pair**: two opposite gates around the installation center, roughly 155 px apart from center. One pulse makes 3 transfers before dissipating. Each traversed route damages enemies it crosses.
- Stack 2 — **Triangulation**: three gates form a triangle. The pulse circulates A→B→C and gains +1 transfer.
- Stack 3 — **Counter Pulse**: a second pulse enters the same fixed network halfway through the cycle, creating staggered lane coverage without occupying exactly the same segment.
- Stack 4 — **Cross Gate**: four gates form a fixed quadrilateral. Completing a full circuit briefly opens one diagonal cross-link for a stronger cutting pass. The network orientation is chosen at deployment and does not rotate afterward.
- Stack 5 — **Relay Acceleration**: transfer delay -18%, network lifetime +1.5 s, and each exit emits a short low-damage ray toward the nearest enemy inside 240 px.
- Stack 6 — **Closed Circuit**: two full-strength pulses circulate in opposite directions. Every completed circuit produces a restrained compression burst at the installed network center; circuit bursts share one cooldown so simultaneous pulses cannot double-trigger it.
- Weapon augment — **Photon Crossfeed / 광자 교차전송**: a non-gate allied projectile passing close to a gate may be copied once from the next gate toward a living enemy at 55% damage. Copied projectiles are marked so they cannot re-enter the gate-copy system. Each gate has a short copy cooldown to prevent projectile-count explosions.
- Identity boundary: Orbital Gate is an **installed arena tool**, not another orbiting weapon. Its tactical cost is positional: a badly placed network can be left behind, while a well-placed network can dominate a boss or choke point for its full lifetime.

#### Projectile-count compatibility — Multiplicity Core / 다중 투영 코어
- The current runtime does not yet expose a projectile-count passive. When the previously planned **Multiplicity Core / 다중 투영 코어** is restored, it is an event-only passive with **maximum 2 stacks**.
- Each stack grants **+1 real attack body** to compatible equipment. "Attack body" is interpreted by weapon identity instead of blindly cloning every sub-projectile.
- Extra projected attack bodies follow the weapon's existing target/placement intent. They must not randomly scatter to unrelated targets merely because Multiplicity is present.
- Submunitions, reflected shots, chained hits, recursive copies, augment-generated children, and other secondary payloads are **not** independently multiplied unless explicitly stated below. This prevents exponential projectile growth.
- Global projectile-size, range, projectile-speed, pierce, damage, and haste modifiers continue to affect whichever physical component normally supports them.

**Vacuum Bloom**
- Attack body = **vacuum seed**.
- Each Multiplicity stack creates one additional full-function seed when a planting trigger occurs, offset around the same death location so the seeds do not perfectly overlap.
- All seeds have normal damage, pull, lifetime, and overcharge rules.
- Balance brake: one qualifying enemy death may feed **only one** eligible seed, chosen by nearest valid seed. One death therefore cannot charge three projected seeds at once.
- Stack-6 forced-bloom propagation and Devouring Pollen projectile absorption are evaluated per seed, but a forced bloom still cannot recursively force another forced bloom.

**Phase Minefield**
- Attack body = **mine placement**.
- Each Multiplicity stack adds one additional mine to a normal deployment, placed on a parallel offset to the same movement trail. Projected mines use full normal mine damage.
- At Stack 6, the native three-mine constellation remains the weapon's resonance structure; Multiplicity does **not** clone the entire triangle into 6 or 9 mines. Instead each Multiplicity stack adds one satellite mine outside the triangle.
- Chain Fuse may include projected/satellite mines, but every mine still has the one-chain-trigger limit.
- Afterimage Mine is an augment-generated child and is never multiplied by Multiplicity.

**Interstellar Missile Pods**
- Attack body = **main missile**.
- Each Multiplicity stack adds one additional full-damage main missile to the salvo: base salvo counts become 2→3→4 at Stack 1 with Multiplicity 0→1→2, and 6→7→8 at Stack 6.
- Extra missiles alternate launch sides so the side-pod choreography remains balanced. They use the same outward-ejection → ignition → curved-homing motion as native missiles.
- Extra missiles inherit the salvo's existing target assignment. Multiplicity must not create unrelated random targeting; if the base salvo is converging on one boss, projected missiles converge on that boss as well.
- MIRV applies to every **main missile**, including a Multiplicity-created main missile. Its main warhead still preserves 100% parent damage and its two side warheads each add 34%.
- MIRV side warheads are secondary payloads and are never themselves multiplied.

**Orbital Gate**
- Attack body = **routed network pulse**, not a gate and not an entire extra gate network.
- Multiplicity never creates more gates and never creates another installation.
- Each Multiplicity stack adds one additional full-strength pulse into the currently installed network, phase-offset from the other pulses. Thus gate geometry and installation count stay readable while throughput rises.
- At Stack 6, the native Closed Circuit provides 2 pulses; Multiplicity raises this to 3 or 4 pulses, not 4/6/8 gates.
- All pulses share the same central circuit-burst cooldown.
- Photon Crossfeed copies are secondary payloads and are never multiplied by Multiplicity. A projectile already tagged as a gate copy or Multiplicity projection cannot recursively create more projected/crossfed copies.

**Compatibility principle**
- Multiplicity increases the number of **primary meaningful attack bodies** without multiplying every child effect.
- This keeps the passive strong on unusual weapons while avoiding exponential combinations such as missile × MIRV × gate-copy × Multiplicity or bloom × forced-bloom recursion.
- Static contracts should explicitly test these recursion barriers when the four weapons and Multiplicity are implemented.

#### Planned unlock cadence
| Stage | Planned first-clear weapon reward | Why |
|---|---|---|
| 11 | Vacuum Bloom / 진공 개화 | Fits the seed/husk death-chain ecology and immediately starts the post-Stage-10 roster expansion. |
| 12 | — | Keep the constellation finale focused on Core Shards rather than stacking another weapon reward. |
| 13 | Phase Minefield / 위상 기뢰군 | Dead Relay introduces route control and makes movement through the relay field mechanically meaningful. |
| 14 | — | Currency/Core progression break. |
| 15 | Interstellar Missile Pods / 성간 미사일 포드 | Packet Stormfront is the best technological fit for visible side-mounted guided salvos. |
| 16 | — | Currency/Core progression break. |
| 17 | Orbital Gate / 궤도 문 | Late Silent Array reward with the highest spatial/network complexity. |
| 18 | — | Preserve the third constellation finale as a Core Shard payoff. |

Implementation rule: do not add these reward keys to `src/stage-catalog.js` until the matching weapon definitions, stack text, combat runtime, render/audio treatment, augment definition, unlock migration, and regression contracts exist in the same atomic change. The current implemented reward catalog must remain internally valid until then.

### Galaxy map

- The main menu is a mode-selection hub. `GALACTIC OPERATIONS` opens the galaxy map, `ENDLESS` opens sortie preparation, and `CORE DEVELOPMENT` opens persistent upgrades; none starts combat accidentally. The upper-left local-pilot card is clickable and exposes detailed local-save stats without implying online-account sync.
- `src/stage-map.js` renders nodes from `STACKFALL_STAGE_CATALOG` and resolves availability/clear state through persistent meta progression.
- Stage 1 is launchable while its status is `available` or `cleared`. Future `planned` or progression-locked stages remain inspectable but cannot launch.
- The map and operation details are separated: luminous stellar points with separate number badges and constellation links stay on the map, while the detail panel carries game time, threat, unlock progress, boss, and launch state. Internal gimmick/event counts are not exposed as stage-detail stats.
- Starter weapon and difficulty selection are shared by Stage and Endless in the sortie-preparation screen immediately before launch. Desktop keeps map and details side by side; compact/mobile layouts stack the detail sheet below the map.

### Stage enemy and boss identity rules

- Stage backgrounds are not palette swaps of Endless. Each stage owns a recognizable spatial concept, major silhouettes/landmarks, and environmental composition; Stage 1 uses a ruined defense gate, severed route lanes, wreckage, and a fractured frontier body.
- Normal enemies may be reused between stages. A new stage does **not** require an entirely new trash roster; new common enemies should be introduced periodically and then may join later pools where appropriate.
- Every named miniboss, boss, Void Rift boss, and stage final boss must have both a dedicated silhouette branch and a dedicated combat-pattern branch.
- Apex encounters require a stronger identity layer: unique signature attacks, set-piece behavior, silhouette, arena behavior, and legacy/reward impact rather than stat or projectile-color swaps.

