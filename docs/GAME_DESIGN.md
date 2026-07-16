# STACKFALL 게임 정보 및 개발 규칙

마지막 동기화: 2026-07-16

이 문서는 STACKFALL의 게임 정보, 실제 수치, 렌더링 구조, 회귀 방지 규칙과 QA 기준을 한곳에 모은 공식 기준 문서다. `README.md`와 이 문서만 공식 문서로 사용한다.

---

## 1. 문서 운영

공식 문서는 세 개다.

1. `README.md`
2. `docs/GAME_DESIGN.md`
3. `docs/WIKI.md`

코드 변경이 게임 규칙, 밸런스, UI, 렌더러, 성능 구조에 영향을 주면 같은 대화에서 두 파일을 갱신한다. 반영할 변화가 없으면 문서를 억지로 수정하지 않는다.

과거 문서, 채팅 요약, 오래된 주석보다 현재 `main` 코드와 이 문서를 우선한다. 서로 다르면 실제 로딩 순서에서 마지막 함수 대입을 확인하고 문서를 수정한다.

---

## 2. 게임 정의

> 여섯 개의 일반 장비 슬롯과 별도 기본 무기를 중첩해 공격 방식과 화면 구성이 실제로 변하는 우주 생존 액션 게임.

### 핵심 규칙

- 일반 장비 슬롯: 6칸
- 기본 무기: `코어 펄스`, 일반 슬롯과 별도
- 일반 장비: 14종
- 장비 중첩: 1~6
- 패시브: 슬롯 제한 없음
- 치명타 확률 상한: 100%
- 레벨당 기본 피해 증가: 1.1%
- 연쇄 피해: 하드 캡 없음, 로그형 소프트 캡
- 초월체 등장: 런 진행 10분 간격, 모든 선택·보상·맵 이벤트·일시정지보다 우선

### 성장 경험치

```text
레벨 요구 경험치
= 10 + 3.8 × level + 1.35 × level^1.34
```

---

## 3. 스탯 계산 원칙

### 같은 이름의 스탯

같은 이름의 스탯은 중첩 수를 합산해 하나의 계수를 만든다.

```text
출력 증폭 2중첩
= 1 + 0.10 × 2
= ×1.20
```

같은 패시브를 중첩마다 다시 곱하는 복리 계산은 사용하지 않는다.

### 다른 이름의 계수

이름이 다른 피해 계수는 기본적으로 서로 곱한다.

```text
출력 증폭 1중첩 + 거성 사냥꾼 1중첩
= 1.10 × 1.15
= 보스 대상 ×1.265
```

레벨, 출력 증폭, 거성 사냥꾼, 성운 강화, 초월체 유산, 공허 각인, 연쇄 피해, 저체력 과출력은 서로 다른 계층이다.

---

## 4. 패시브

게임 안 설명은 기능과 중첩당 실제 수치를 짧게 표시한다. 최대 중첩, 내부 하드 캡, 계산식 같은 TMI는 선택지에 표시하지 않는다.

확률 설명은 모두 `%`로 통일한다. `%p` 표기는 사용하지 않는다.

| 키 | 이름 | 중첩당 효과 |
|---|---|---|
| magnet | 자석 코어 | 결정 흡수 범위 +34 |
| echo | 에코 비콘 | 발사·설치형 장비 복제 확률 +7.5% |
| power | 출력 증폭 | 모든 피해 +10% |
| haste | 가속 회로 | 장비 발동 주기 -10% |
| vitality | 재생 장갑 | 최대 체력 +20, 즉시 체력 30 회복 |
| speed | 벡터 부스터 | 이동속도 +9% |
| crit | 취약점 해석 | 치명타 확률 +6% |
| chain | 연쇄 과부하 | 유지시간 +7%, 연쇄 피해 효율 증가 |
| greed | 개척 계약 | 적 체력 +10%, 경험치 획득량 +30% |
| armor | 충격 흡수재 | 받는 피해 -7.5% |
| chainDrive | 연쇄 추진기 | 12연쇄마다 장비 주기 추가 단축 |
| chainBurst | 연쇄 폭심 | 20연쇄마다 플레이어 중심 폭발 |
| chainRecovery | 연쇄 회수 | 30연쇄마다 최대 체력 비례 회복 |
| chainField | 전리품 공명 | 현재 연쇄에 따라 결정 흡수 범위 증가 |
| eliteHunter | 거성 사냥꾼 | 중간보스·보스 피해 +15% |
| pierce | 관통 렌즈 | 투사체 관통 +1 |
| regen | 자가 복원 | 4초마다 체력 2.5 회복 |
| wisdom | 성운 통찰 | 경험치 획득량 +10% |
| overdrive | 임계 과출력 | 체력 45% 미만일 때 피해 +14% |
| projectileSize | 광자 팽창 | 투사체·광선·공격 판정 크기 +10% |
| projectileSpeed | 광자 가속 | 투사체와 공전 장비 속도 +10% |
| range | 심우주 조준기 | 무기 기본 조준·비행 사거리 +10% |

### 경험치 패시브

```text
경험치 배율
= 1
+ 개척 계약 중첩 × 0.30
+ 성운 통찰 중첩 × 0.10
```

```text
적 체력 배율
= 기본 시간 성장 × (1 + 개척 계약 중첩 × 0.10)
```

### 에코 비콘

기본 복제 확률:

```text
중첩이 0이면 0%, 1중첩부터 min(60%, 중첩 × 7.5%)
```

- 원본 공격과 복제 공격은 동시에 발생하지 않는다.
- 첫 복제는 원본보다 약 64~91ms 늦게 발동한다.
- 고중첩 추가 복제는 첫 복제보다 약 90~120ms 늦게 발동한다.
- 8중첩은 매 5번째 발동을 보장한다.
- 복제 공격은 분홍색 계열로 표시한다.
- 복제된 중력 우물도 분홍색 강착 원반으로 구분한다.

### 연쇄

- 연쇄 과부하: 5연쇄 단위 피해 증가
- 피해 증가는 로그형 소프트 캡
- 연쇄 유지시간: 중첩당 +7%
- 연쇄 추진기: 12연쇄마다 장비 주기 단축
- 연쇄 폭심: 20연쇄마다 중심 폭발
- 연쇄 회수: 30연쇄마다 최대 체력 비례 회복
- 전리품 공명: 연쇄에 따라 자석 범위 증가
- 낮은 중첩에서는 효율과 최대 효과가 모두 낮다.

---

## 5. 무기

### 무기 사거리

| 키 | 이름 | 기본 사거리 | 역할 |
|---|---|---:|---|
| core | 코어 펄스 | 500 | 자동 추적 기본 무기 |
| blade | 펄스 블레이드 | 190 | 근접 지속 피해 |
| ember | 별빛 캐스터 | 560 | 중거리 다발 탄환 |
| bulwark | 성광 장벽 | 150 | 방어와 보호막 |
| gravity | 중력 우물 | 430 | 집속과 범위 제어 |
| comet | 혜성 창 | 760 | 장거리 고관통 |
| prism | 성좌 프리즘 | 520 | 단일 표적 집속 광선 |
| chrono | 시간 고리 | 250 | 감속과 장비 가속 |
| arc | 성운 부메랑 | 570 | 출발·귀환 타격 |
| ion | 이온 사슬 | 450 | 즉발 연쇄 피해 |
| nova | 초신성 코일 | 245 | 플레이어 중심 파동 |
| drone | 유성 드론 | 540 | 다중 표적 분산 사격 |
| rail | 성간 레일 | 920 | 초장거리 관통 광선 |
| spiral | 은하 나선 | 500 | 넓은 나선 탄막 |
| mirror | 반사 성좌 | 350 | 적 탄환 제거와 반격 |

`심우주 조준기`는 위 기본 사거리에 중첩당 10%를 곱한다. 유한 사거리 투사체는 최대 비행 거리를 넘으면 제거한다.

### 성좌 프리즘

현재 프리즘은 화면 끝까지 쏘는 즉발 관통 레이저가 아니라, 표적을 계속 추적하는 지속 집속 광선이다.

| 중첩 | 효과 |
|---:|---|
| 1 | 프리즘 1개, 기본 출력 ×1 |
| 2 | 프리즘 2개가 서로 다른 표적 조준 |
| 3 | 0.88초 유지 시 ×1.9, 2.18초 유지 시 ×4.1 |
| 4 | 전환 시간이 0.68초와 1.78초로 단축 |
| 5 | 최대 출력 ×4.35, 광선 굵기 증가 |
| 6 | 프리즘 3개, 최대 출력 ×4.6, 최종 집속 1.55초 |

- 표적 사망 또는 사거리 이탈 시 해당 프리즘의 집속 열 초기화
- 에코 비콘 복제는 순간 집속 광선을 발사
- 보스 특수효과 `과열 성선`은 최대 출력에서만 발동
- 과열 성선은 표적 중심 교차 광선과 소형 용광 폭발 생성
- 부하 상태에서는 시각 광선 생성 빈도만 낮추고 피해 주기는 유지

### 성운 부메랑

- 자연스러운 곡선으로 표적을 타격한 뒤 바로 귀환
- 2중첩: 두 경로
- 3중첩: 곡선 폭과 판정 증가
- 4중첩: 귀환 피해 ×1.38
- 5중첩: 왕복 경로 지속 피해
- 6중첩: 세 경로
- 적을 타격하면 즉시 귀환 단계로 전환

---

## 6. 적과 정예

### 일반 적

- 공허 유체: 기본 근접 추적
- 추적 혜성: 빠른 돌진형
- 성간 보루: 높은 체력의 중장갑
- 성운 포격체: 거리를 유지하는 원거리 적

### 중장갑 외형 고정 규칙

일반 주황 중장갑 적 `성간 보루`는 아래 형태를 유지한다.

- 불규칙한 12방향 장갑 외곽
- 세 개의 회전 장갑판
- 밝은 용융 코어
- 방향성을 가진 검은 눈 또는 포구
- 중첩 육각형이나 로벅스 아이콘처럼 보이는 형태 금지

우주선 이벤트 중장갑 적은 파손된 공성선 실루엣, 측면 핀, 전방 포구를 사용한다.

### 정예 등장

- 순환: 중간보스 → 중간보스 → 보스
- 기존 정예가 살아 있어도 다음 정예 시간이 오면 추가 등장
- 동시 정예 4명부터 다음 등장을 잠시 연기
- 초월체 직전에는 일반 정예 신규 등장 중단

### 정예 표시

표시는 성능 렌더러보다 나중에 적용되어야 한다.

- 중간보스: 청록색 `◇ 중간보스`
- 일반 보스: 분홍색 `◆ 보스`
- 공허 보스: 보라색 `◉ 공허 보스`
- 초월체: 금색 `✦ 초월체`

화면 안에서는 개체 위 원형 표식과 이름을 표시한다. 화면 밖에서는 방향 화살표, 종류, 거리를 표시한다. 아래쪽 화살표는 무기 HUD 위 안전 영역에 배치한다.

### 정예 체력

- 중간보스: 기존 체력 유지
- 일반 보스: 이전 최종 체력 ×0.88
- 공허 보스: 이전 최종 체력 ×0.92
- 초월체: 일반 보스보다 훨씬 높은 체력·피해·스킬 빈도

### 보상

- 중간보스: 보유 장비 +1 또는 일반 패시브 +1
- 일반 보스: 특수 패시브 또는 보유 무기 특수효과
- 공허 보스: 공허 전용 보상
- 초월체: 고유 유산

---

## 7. 맵 이벤트

- 성운 보관소
- 추락한 우주선
- 공허 균열

규칙:

- 모든 이벤트 종료 후 최소 58초 간격
- 같은 종류 연속 등장 금지
- 보상 선택 완료 시점부터 다음 주기 계산
- 이벤트 활성 중 진입 표식 배열 비움
- 우주선 이벤트 진입 즉시 표식 소비
- 우주선 전투 중 입장 포탈 재표시 금지
- 우주선 이벤트 적은 일반 맵 동급 적보다 강함

---

## 8. 설정

- 언어
- 전체·전투·UI·배경음 켜기·끄기
- 채널별 음량
- 피해량 표시
- 아군 투사체 숨기기
- 반짝임 효과
- 화면 흔들림

### 아군 투사체 숨기기

최후 수단 성능 옵션이다.

- 아군 탄환, 광선, 부메랑 곡선, 전투 파티클 렌더링 숨김 또는 최소화
- 실제 공격, 충돌, 피해 계산 유지
- 적 투사체 유지
- 보스 장판과 위험 예고 유지

### 반짝임 효과

기본값은 켜짐이다.

끄면:

- 장식용 전투 파티클 생성 중단
- 현재 남은 파티클 제거
- 화면 전체 섬광 제거
- 배경 별의 점멸과 십자 반짝임 제거
- 아군 투사체의 긴 광원 꼬리와 과도한 광택 축소
- 중장갑 적과 일부 장식의 그림자 광원 축소

끄더라도 다음은 유지한다.

- 적 투사체
- 공격 예고선
- 보스 장판
- 정예 종류 표시
- 이벤트 방향 표시
- 피해 판정

설정은 `localStorage`의 `stackfall.settings`에 저장한다.

채널별 음량과 on/off 규칙은 그대로 유지한다. 현재 최종 출력 gain은 `2.76`이고 threshold `-20dB`, knee `22dB`, ratio `4.5:1`, attack `0.004s`, release `0.34s` 컴프레서를 거친다. 직전 커밋의 gain `3.24`와 `1.24배` wrapper보다 실제 pre-compressor 합성 출력은 낮으므로 “직전 빌드 대비 +6dB”라고 쓰지 않는다. 공격 가독성은 무기 profile과 고역 보조음으로 확보하고 피크·동시발음 뭉침은 컴프레서와 rate limit으로 제어한다.

### 배경음과 효과음

- 일반 전투, 맵 이벤트, 초월체 전투는 각각 다른 저역 드론·펄스 간격·필터를 사용한다.
- 이벤트 활성화 또는 공허 테마에서는 이벤트 BGM, 초월체 대기·전투·전용 렐름에서는 초월체 BGM이 우선한다.
- 장면 판정은 메인 루프에서 0.35초마다 동기화하며 같은 장면의 오디오 노드를 중복 생성하지 않는다.
- 레벨업은 저역 하강 음계와 low-pass 필터를 사용해 물속으로 잠기는 듯한 인상을 준다.
- 공격은 15개 무기 계열별 profile을 사용한다. 높은 대역을 보강하되 중력은 저역, 레일·이온·혜성·초신성은 보조 고조파를 더해 역할을 구분한다.
- 성능 가드가 명중음을 제한할 때도 공격 `source`를 보존해 무기별 profile이 사라지지 않아야 한다.
- smoke는 상수가 아니라 `audio.outputNode.gain.value`와 compressor node의 실제 threshold·ratio를 읽는다.
- master OFF에서는 새 출력 node를 만들지 않고, ambient OFF·장면 전환·reset 반복 후 interval은 하나 이하, ambient node 배열은 현재 장면 한 세트만 남아야 한다.
- headless 검사는 routing·gain·profile·timer·node 수명만 검증하며 주관적 음색을 청취했다고 간주하지 않는다.

---

## 9. 렌더링 구조

### 기본 원칙

게임을 새로 만드는 것이 아니라 기존 게임 상태와 규칙을 유지하고 렌더링 계층만 교체한다.

유지되는 것:

- `state.entities`
- 무기 로직
- 충돌 판정
- 적 AI
- 보상
- 레벨업
- 입력
- 저장 설정
- HTML UI

### PixiJS WebGL 전투 레이어

`src/gpu-renderer.js`가 PixiJS `8.19.0`을 비동기로 불러온다.

WebGL 담당:

- 아군 투사체
- 장식용 전투 파티클
- 텍스처 재사용
- GPU 스프라이트 위치·회전·크기 갱신

최종 화면 계층:

```text
배경·월드 Canvas #game (z=0)
→ PixiJS 아군 projectile/particle #gpuCombatLayer (z=1)
→ 위험·적·플레이어 Canvas #combatForeground (z=2)
→ HTML UI (z>=10)
```

`combatForeground`는 `pointer-events: none`이며 메인 Canvas와 같은 좌표, CSS 크기, DPR, resize 상태를 사용한다. 메뉴 전환이나 재시작으로 Canvas를 다시 만들지 않는다.

렌더러 상태:

- `loading`: PixiJS 스크립트 로드 전
- `warming-up`: PixiJS와 GPU 캔버스는 준비 중이나 Canvas 투사체를 아직 끄지 않은 상태
- `active`: ticker, 첫 GPU 프레임, 실제 투사체 sprite 표시까지 확인되어 아군 투사체를 PixiJS가 담당하는 상태
- `failed`: PixiJS 로드나 초기화 실패
- `context-lost`: WebGL context loss 발생
- `canvas-fallback`: 실행 중 검증 실패로 Canvas 2D 투사체 렌더러를 유지하는 상태

Canvas 2D의 아군 투사체 렌더링은 다음 조건이 모두 확인된 뒤에만 중단한다.

1. PixiJS 라이브러리 로드 성공
2. GPU 렌더러와 투명 GPU canvas 생성 성공
3. GPU canvas가 DOM에 삽입되고 CSS 크기와 내부 해상도가 0이 아님
4. Pixi ticker가 실제 실행됨
5. 최초 GPU 프레임이 실행됨
6. 아군 투사체가 존재할 때 최소 1개 이상의 sprite가 visible 상태임

`아군 투사체 숨기기`가 켜진 상태에서는 visible sprite가 0개인 것이 정상이다. 이 설정 때문에 GPU warm-up이 실패로 처리되어서는 안 된다.

배경 Canvas 2D 담당:

- 배경
- 중력 우물
- 비위험 아군 효과

전경 Canvas 2D 담당:

- 적과 보스
- 적 투사체
- 위험 예고
- 플레이어
- 광선과 중요 특수효과
- UI

### 공유 화면 흔들림

- `src/render.js`가 매 렌더 프레임 `shakeX`, `shakeY`를 정확히 한 번 계산한다.
- 배경 Canvas, Pixi stage, 전경 Canvas가 같은 값을 사용한다.
- 개별 렌더러가 별도 난수를 만들지 않는다.
- 화면 흔들림 설정을 끄거나 메뉴로 돌아가면 두 값은 즉시 0이다.

### 안정성 우선 폴백

다음 상황에서는 게임을 중단하지 않고 Canvas 2D로 자동 복귀한다.

- PixiJS CDN 로드 실패
- PixiJS 초기화 예외
- WebGL 미지원
- 실제 렌더러가 WebGL이 아님
- WebGL 컨텍스트 손실
- GPU 프레임 갱신 중 예외
- 투사체가 존재하는데 제한 시간 안에 visible sprite가 확인되지 않음

외부 렌더러가 실패해도 게임 로직은 계속 진행되어야 한다. Canvas 렌더러를 삭제하지 않고 폴백으로 유지한다.

컨텍스트 손실 때 GPU Canvas를 숨기고 Canvas 아군 투사체를 즉시 복구한다. 컨텍스트 복구 때 sprite를 안전한 공용 텍스처로 잠시 분리하고 기존 사용자 텍스처를 `destroy(true)`로 파괴한 뒤 세 텍스처를 새로 연결한다. sprite pool은 재사용하며 Pixi app, Canvas, ticker와 context listener를 다시 만들거나 중복 등록하지 않는다.

`window.stackfallRendererInfo()`는 콘솔 진단용으로만 사용한다. 반환 정보에는 renderer status, fallback 여부, PixiJS 버전, 계층, DPR, 공유 shake, 컨텍스트 손실·복구 횟수, ticker 등록 상태와 frame 수, 각 Canvas 크기, projectile/particle sprite pool과 visible 수가 포함된다.

`window.stackfallRuntimeDiagnostics()`는 현재 런 세대, 렌더 프레임, 예약 공격 수, 개체 배열 수량, 정제 통계와 반복 오류를 반환한다. 렌더 단계 오류는 단계별·메시지별로 누적하며 같은 오류를 매 프레임 콘솔에 반복 출력하지 않는다.

### 기존 상시 최적화

- 숫자형 공간 해시 격자
- 투사체와 중력 우물의 인접 셀 충돌
- 유한 사거리 표적 탐색의 인접 셀 사용
- 적 ID→객체 색인
- 가까운 N개 표적만 유지하는 부분 삽입 선택
- 투사체 객체 풀
- 경험치 결정 병합
- 화면 밖 개체 렌더링 생략
- 일반 적과 투사체의 Canvas 캐시 스프라이트
- 배열 제자리 압축
- 저우선 파편 우선 폐기

### 최후 수단 부하 대응

화질 하락은 기본 해결책이 아니다.

- 프레임 경고 상태에서는 개체 예산과 파티클만 완만하게 제한
- 심각한 지연이 지속될 때만 일부 배경·효과 단순화
- 심한 지연이 1.8초 이상 이어질 때만 Canvas 내부 해상도 80%
- 안정 상태가 7초 이어지면 원복
- 데스크톱 DPR 상한 1.75
- 모바일 DPR 상한 1.35

---

## 10. 스크립트 로딩과 회귀 방지

현재 프로젝트는 여러 파일이 같은 전역 함수를 다시 대입한다. 파일 이름만 보고 판단하지 말고 `index.html`의 실제 순서를 확인한다.

최종 전체 로딩 순서:

```text
src/bootstrap.js
src/core.js
src/language-pack.js
src/boss-catalog.js
src/systems-base.js
src/runtime-config.js
src/weapons.js
src/boss-patterns.js
src/bosses.js
src/systems.js
src/interface.js
src/settings.js
src/realm-backgrounds.js
src/render-space.js
src/elite-renderers.js
src/render-entities.js
src/feature-pack.js
src/reward-refinement.js
src/combat-balance-refinement.js
src/progression-expansion.js
src/map-event-expansion.js
src/targeting-motion-refinement.js
src/combat-guidance-refinement.js
src/ability-ledger-audit.js
src/render.js
src/dark-cosmic-polish.js
src/performance-guard.js
src/build-audit-ui.js
src/gpu-renderer.js
```

이 순서의 의미:

1. `dark-cosmic-polish.js`
   - 우주 비주얼, 블랙홀과 맵 이벤트 형상 정의
   - 항상 후속 script에 덮어써지던 별도 `drawEnemiesRefined()`·로컬 `drawTankBody()` 구현은 삭제
2. `performance-guard.js`
   - 공간 격자, 캐시 렌더러, 개체 예산 적용
3. `build-audit-ui.js`
   - 정예 표시, 원거리 적 오버레이, 최종 능력 UI 적용
4. `gpu-renderer.js`
   - WebGL 아군 투사체·파티클 계층
   - 전경 Canvas 연결과 Canvas 폴백
   - 반짝임 설정 최종 적용

`build-audit-ui.js`를 `performance-guard.js`보다 먼저 로드하면 성능 렌더러가 `drawEnemies`를 다시 덮어써서 정예 표시가 사라진다. 이 순서를 바꾸지 않는다.

현재 정리된 기능별 최종 소유 모듈:

- 설정과 localStorage: `src/settings.js`, 기본 로드 `src/bootstrap.js`
- 무기 발사와 에코 복제: `src/weapons.js`, 조준 보정: `src/combat-guidance-refinement.js`
- 프리즘 기본 수치·집속·lock·배율: `src/weapons.js`, 보상 정의·강화 적용: `src/reward-refinement.js`
- 부메랑 생성: `src/weapons.js`, 이동·충돌·귀환: `src/systems.js`, 표시: `src/render-entities.js`
- 투사체 유도, 투사체 기본 갱신, 빔 수명: `src/systems.js`
- 적 이동, 원거리 적 사격, 시간 정지 이동: `src/bosses.js`
- 빔, 중력 우물, 플레이어, 기본 개체 렌더링: `src/render-entities.js`
- 장비 공전 외형과 중력 렌즈: `src/render-entities.js`
- 일반·이벤트 중장갑 공용 형상 helper와 Canvas 폴백 적 렌더: `src/render-entities.js`
- 최종 캐시 적 렌더 진입점: `src/performance-guard.js`
- 원거리 적 오버레이와 정예·화면 밖 표시: `src/build-audit-ui.js`
- 맵 이벤트 형상: `src/dark-cosmic-polish.js`, 최종 이벤트 표시 래퍼: `src/build-audit-ui.js`
- 보상 중복 방지, 중간보스 보상, 특수 강화: `src/reward-refinement.js`
- 제자리 배열 압축과 런 세대 기반 예약기: `src/systems-base.js`, 각 배열 갱신 소유 시스템
- 공간 인덱스, 적 ID 조회, 가까운 표적 선택, sprite/cache, 부하 예산: `src/performance-guard.js`
- 단일 RAF, 공유 shake, 반복 오류 진단: `src/render.js`
- 장면별 BGM과 무기별 공격음: `src/runtime-config.js`, 장면 동기화 호출: `src/render.js`
- PixiJS/WebGL 아군 투사체, 전투 파티클과 texture 수명: `src/gpu-renderer.js`

### 예약 공격 안전성

- 전투 지연 공격은 `scheduleWeaponAction()`에 게임 시간 기준 남은 시간을 저장한다.
- 일시정지 중에는 남은 시간이 감소하지 않는다.
- choice, bossReward, worldEvent에서는 전투 callback과 남은 시간이 진행되지 않는다.
- reset, 메뉴, 게임 오버, cinematic 진입 때 남은 전투 예약을 비운다.
- 한 update에서 만료된 callback마다 실행 직전 `runSerial`과 `state.mode === 'playing'`을 다시 확인한다.
- 앞 callback이 런 세대나 mode를 바꾸면 같은 due batch의 나머지 callback은 실행하지 않는다.
- callback 안에서 추가한 예약은 현재 순회와 분리해 다음 update부터 실행한다.
- callback 하나의 예외는 runtime stage 진단에 기록하고 나머지 게임 루프를 중단하지 않는다.
- UI 표시 지연은 `scheduleUiAction()` 한곳에서 관리하며 런 세대를 확인한다.
- 보상 대기열은 retry timeout 없이 메인 루프에서 갱신한다.

이번 정리에서 삭제된 구식 파일:

- `src/projectile-overrides.js`
- `src/visual-overrides.js`
- `src/feature-hotfix.js`
- `src/reward-refinement-fix.js`
- `src/boomerang-return-fix.js`

### 회귀 금지 목록

- 일반 주황 중장갑 적을 중첩 육각형으로 되돌리지 않음
- 중간보스·보스·공허 보스·초월체 종류 표시 삭제 금지
- 우주선 이벤트 진입 표식 재생성 금지
- 능력 탭이 게임 시간을 멈추게 하지 않음
- 새 무기 쿨다운 HUD가 멈추지 않음
- 패시브 선택지에 오래된 수치 복원 금지
- `%p` 표기 복원 금지
- 성좌 프리즘을 옛 화면 관통 즉발 레이저로 되돌리지 않음
- 새 `fix`, `hotfix`, `override` 파일을 무분별하게 추가하지 않음
- 패치 내역이나 내부 캡 TMI를 게임 화면에 넣지 않음

---

## 11. 인터페이스

- `I` 또는 `Tab`: 능력 탭 열기·닫기
- 능력 탭은 게임을 일시정지하지 않음
- 레벨업·보스 보상·게임 오버가 능력 탭보다 우선
- 패시브 목록은 데스크톱에서 세로 스크롤
- 현재 장비·패시브 카드를 눌러 상세 효과 확인
- 하단 이벤트·정예 안내는 무기 HUD와 겹치지 않음

---

## 12. QA 체크리스트

### 시작과 기본 진행

- 시작 장비 선택 14종 확인
- 코어 펄스 별도 슬롯 확인
- 레벨업 선택지 3개 확인
- 선택지 설명과 실제 수치 일치
- `%p` 문자열이 게임 화면에 없는지 확인

### 설정

- 반짝임 켜기·끄기 즉시 반영
- 반짝임 끄기 후 장식 파티클과 화면 섬광 제거
- 반짝임을 꺼도 적 탄환·장판·예고선 유지
- 아군 투사체 숨기기 켜기·끄기
- 설정 새로고침 후 유지

### 에코 비콘

- 원본과 복제 탄환이 완전히 겹치지 않음
- 중력 우물 복제에 짧은 지연 적용
- 광선·드론·레일·나선 복제 지연 적용
- 분홍색 복제 표시 유지
- 재시작 전 예약된 복제가 새 런에서 발동하지 않음

### 적 표시

- 일반 주황 중장갑 적이 불규칙 장갑체로 표시
- 우주선 중장갑 적이 공성선으로 표시
- 중간보스·보스 종류 표시 유지
- 공허 보스·초월체 색상 구분
- 화면 밖 방향 화살표와 거리 표시
- 아래쪽 표시가 무기 HUD에 가리지 않음

### 성좌 프리즘

- 1·2·3개 프리즘 수 확인
- 집속 단계 전환 시간 확인
- 표적 사망 시 열 초기화
- 사거리 이탈 시 열 초기화
- 5중첩 ×4.35
- 6중첩 ×4.6
- 과열 성선은 최대 출력에서만 발동

### WebGL 폴백

- 정상 환경에서 `document.documentElement.dataset.stackfallRenderer`가 `pixi-webgl`
- PixiJS 스크립트 차단 시 Canvas 2D로 계속 플레이 가능
- WebGL 컨텍스트 손실 시 Canvas 투사체가 다시 표시
- GPU 레이어가 메뉴와 HTML UI 입력을 막지 않음
- 적 투사체와 보스 예고는 Canvas에서 계속 표시

### 장시간 성능

- 초반 2분
- 적 50마리 이상
- 아군 투사체 100개 이상
- 프리즘·광선 다수
- 중력 우물 다수
- 부메랑 다수
- 10분 이상 플레이
- 메모리 사용량 급증 여부
- 긴 가비지 컬렉션 정지 여부
- 모바일 뷰포트

### 정적 검사

수정한 모든 JavaScript 파일에 대해:

```bash
node --check <file>
```

브라우저 콘솔의 최초 오류를 우선 해결하고, 오류를 후속 파일로 덮어 숨기지 않는다.

### 자동 브라우저 검사

로컬 서버를 `127.0.0.1:8000`에서 실행한 뒤 Chrome CDP 하네스를 사용한다.

```bash
node scripts/browser-smoke.mjs
```

이 검사는 데스크톱·모바일 DPR, GPU 표시 옵션, 공유 shake, Prism 배율, invalid 우물·효과, due batch 세대 안전성, pause·선택·보상·이벤트 정지, 재시작 5회, 보상 이중 클릭, 게임 시간 쿨다운, BGM·무기음 routing, 실제 output gain·compressor 값, ambient timer·node 중복, WebGL context loss/restore 3회, 텍스처 파괴 수, Pixi CDN 차단 Canvas 폴백, 중복 Canvas·ticker·listener, 배포 자산 SHA-256 지문과 런타임 진단을 확인한다.

예상하지 않은 `console.warn`, `console.error`, `Runtime.exceptionThrown`, network failure와 HTTP 4xx/5xx는 실패다. CDN 차단 시나리오의 정확한 Pixi 경고와 차단 URL만 allowlist한다. 정상 GPU와 `WEBGL_lose_context`는 기본 필수이며 `STACKFALL_ALLOW_GPU_SKIP=1`, `STACKFALL_ALLOW_CONTEXT_SKIP=1`을 명시한 경우에만 사유·renderer 상태·브라우저 인자를 담아 skip할 수 있다. 결과 JSON은 커밋하지 않는 `test-results/stackfall-smoke.json`에 기록하고 assertion 하나라도 실패하면 non-zero로 종료한다.

고밀도 soak는 적 100명(정예 4명), 아군·적 투사체 각 200개, 파티클 200개와 15종 6중첩 장비로 시작한다. 로컬 기본 실행은 p95 50.5ms 이하, 50ms 이상 frame 비율 8% 미만, 최대 frame 100ms 미만의 절대 예산을 강제한다. GitHub hosted headless Chrome처럼 frame cadence가 불안정한 환경에서는 `STACKFALL_SOAK_STRICT=0`으로 절대 예산만 명시적 skip 처리할 수 있지만, 2분 실행·샘플 수·런타임 오류·sprite pool·Canvas·ticker·실제 p95·p99·max·50ms 이상 비율 기록은 그대로 필수다.

```bash
node scripts/browser-smoke.mjs --soak-ms=120000
```

`node scripts/build-fingerprint.mjs`는 `index.html`과 페이지가 실제 로드하는 로컬 CSS·JavaScript(자기 자신인 `src/build-info.js` 제외)의 SHA-256 지문을 생성한다. smoke는 로컬에서 재계산한 지문과 페이지의 `window.STACKFALL_BUILD_SHA`를 비교하고 URL에 cache-bust query를 붙인다. 이는 Git commit SHA를 정적 파일에 수동 복사하는 방식이 아니며, 배포 자산이 현재 checkout과 동일한지를 검증한다. 배포본 검사는 `--url=https://stackfall.pages.dev --result=test-results/live-smoke.json`을 함께 사용한다. 테스트 수치는 게임 화면이 아니라 하네스 JSON 출력에만 기록한다.
---

## 16. 2026-07-16 전투 시각·이벤트·초월체 규칙

### 투사체 시각 언어

| 계열 | 고정 실루엣 | 구분 원칙 |
|---|---|---|
| 코어 펄스 | 청백색 마름모와 십자 광선 | 기본탄은 단정하고 짧은 광미를 사용 |
| 별빛 캐스터 | 적색 6방 폭발 문양, 빈 중심핵, 점화 고리 | 코어 탄환의 색상 교체 형태를 금지 |
| 혜성 창 | 긴 축, 결정 창날, 세 겹 광미 | 둥근 혜성 구체로 축약하지 않음 |
| 파편·반격 | 짧고 각진 결정 조각 | 작은 범용 원형 탄환과 구분 |

PixiJS WebGL은 `generic`, `core`, `ember`, `comet`, `shard` 텍스처를 따로 생성한다. WebGL 컨텍스트 복구 시 모든 무기 텍스처를 안전 텍스처로 분리한 뒤 파괴·재생성하며 `created - destroyed = live`가 항상 성립해야 한다. Canvas 2D 폴백도 동일한 실루엣을 그린다.

### 맵 이벤트 생명주기

- 표식 제한: 46초. 미접촉 표식은 제거하고 같은 종류를 38~62초 범위로 다시 예약한다.
- 선택 제한: 22초. 성운 보관소·전리품은 첫 안전 선택을 자동 적용하고, 공허 균열 진입 선택은 자동 이탈한다.
- 추락한 우주선: 82초 제한. 시간 초과 시 이벤트 적·적 탄환·예고를 보상 없이 제거하고 95~130초 뒤 재예약한다.
- 공허 균열: 108초 제한. 시간 초과 시 공허 적·탄막·예고를 제거하고 실공간으로 긴급 복귀한 뒤 재예약한다.
- 실패·취소·초월체 난입은 `mapEventActive`, 표식, 전용 적, 적 탄환, 위험 예고, 전투 타이머를 한꺼번에 정리해야 한다.

### 초월체 절대 우선순위

- `apexClock`은 메뉴와 게임 오버를 제외한 런의 모든 상태에서 진행한다.
- 등장 시각이 되면 레벨 선택과 보스 보상은 첫 유효 선택을 안전하게 확정한다.
- 성운 보관소, 우주선, 공허 균열, 일시정지, 설정, 능력 장부, 일반 차원 전환은 즉시 닫거나 취소한다.
- 기존 적·아군 탄환·적 탄환·위험 예고·중력 우물을 정리한 뒤 초월체 전용 시네마틱을 시작한다.
- 초월체는 `enemyControlFactor = 0`이며 중력 흡입, 넉백, 시간 고정, 이동 봉쇄를 받지 않는다.
- 플레이어와 초월체는 전용 봉쇄장 바깥으로 나갈 수 없다.

### 초월체별 전투 정체성

| 초월체 | 크기·이동 | 등장 연출 | 전투 패턴 |
|---|---|---|---|
| 시간포식자 아트로포스 | 대형 비대칭 시계 파편체, 봉쇄장 타원 궤도 이동 | 시간판이 조각나고 서로 반대 방향으로 재배열 | 안전 틈이 있는 역회전 탄환륜, 시곗바늘 절단선, 평행 시간 절단 |
| 종말 항성 오메가 | 초대형 고정 용광로, 상단 중앙 고정 | 전장의 에너지가 육각 용광로로 응축되어 점화 | 회전 용광선, 안전 틈 탄환륜, 외곽 노드 폭발, 전장 관통 화염선 |
| 무명의 마지막 성좌 | 작은 각형 본체, 고속 공전·순간이동 | 별빛이 꺼진 뒤 화면 전체에 이름 없는 성좌가 새겨짐 | 다중 나선, 거대 별자리 격자, 순간이동, 사각 탄막 상자 |

공허 균열은 보라색 타원 고리와 균열 중심을 사용한다. 초월체 전장은 청록 시간판, 주황 육각 용광로, 청백 별자리 격자로 분리하며 공허 배경의 색·형태를 재사용하지 않는다.

## 후속 전투 가독성 및 장기전 규칙

### 초월체 장기전
- 0~179초: 기본 패턴 단계
- 180~239초: 시간 압박 단계. 체력 조건과 무관하게 강화 패턴 주기가 빨라집닄.
- 240초 이후: 종말 난사 단계. 각 초월체가 전용 보조 탄막을 0.82초 주기로 추가합니다.

### 일상 효과 제한
초신성 코일 같은 반복 기본 공격은 전체 화면 섬광을 만들지 않습니다. 약한 피격은 엧고 작은 흔들림만 사용하고, 큰 피격·보스 충돌·전환 연출에만 강한 섬광과 흔들림을 허용합니다.

### 장벽 시각 규칙
성광 장벽은 방어막 자체를 항상 표시할 수 있지만 공격적인 가시·외곽 장치는 4중첩 보복 피해 또는 반사 특수효과처럼 실제 반격 기능이 있을 때만 표시합니다.

### 보상 가독성
중간보스 보상은 자동 지급입니다. 무작위 중첩 상승은 항목명과 이전→이후 값을 반드시 토스트로 알립니다. 일반 보스, 성운 보관소, 우주선, 공허, 초월체 보상 화면은 서로 다른 형태·재질·색 언어를 사용합니다.

---

## 17. 초월체 일괄 보상·반사가시·사이트 아이콘

- 초월체 보상은 선택이 아니라 고유 유산, 무작위 패시브 총 3중첩, 성체 재구축을 모두 확인하고 `모두 받기`로 수령한다.
- 패시브는 가능한 한 서로 다른 항목을 먼저 강화하며 모두 최대치면 최대 체력 +8%로 대체한다.
- 성체 재구축은 최대 체력 +12%, 완전 회복, 보호막 최소 36을 제공한다.
- 성광 장벽 가시는 방어막에 붙으며 4중첩 12개, 5중첩 15개, 6중첩 18개다. 별도 공전 장식은 사용하지 않는다.
- `summ.png`는 SNS 공유 카드이고 브라우저 탭 아이콘은 `favicon.svg?v=3`와 `site.webmanifest`가 담당한다.

---

## 18. 적 투사체 판독성과 충돌

- 모든 이동형 적 탄환의 정면은 `atan2(vy, vx)`와 일치한다. 시각 회전을 속도에 다시 적용하거나 90도를 더하지 않는다.
- 잡몹 포격체는 직사 볼트, 조준 부채꼴은 창형 탄, 방사형 패턴은 구체·문양형 탄, 정지 공격은 지뢰형으로 구분한다.
- 초월체는 시간 결정, 항성 화염탄, 성좌 파편을 각각 사용하며 공허 보스는 초승달형 공허탄을 사용한다.
- 충돌은 투사체와 플레이어의 이전→현재 상대 이동 선분에 대한 연속 충돌 판정으로 처리한다. 정지 플레이어도 동일하게 판정한다.
- 고부하에서는 그림자와 광미만 줄이고 투사체 실루엣과 충돌 반경은 바꾸지 않는다.

## 18. Difficulty, reward readability, and augment identity

Normal is the canonical tuning target. Its enemy health is 92% of the previous reference curve; Easy and Hard apply explicit health, damage, speed, and ranged-enemy modifiers around Normal. The difficulty selection is made on the main screen and persists locally.

All 15 weapon families have one boss-reward augment with a weapon-specific behavior. The six late arsenal families use a second ion network, a reversing nova implosion, a marked meteor strike, delayed rail-path fractures, a counter-rotating spiral, and twin reflected rays. Nebula Boomerang's augment also launches a real curved ricochet from a defeated enemy toward a random nearby target.

The ability ledger is a non-destructive inspection layer during level-up selection: opening it hides but does not reroll or consume the pending cards. Closing it restores the exact choice state.
