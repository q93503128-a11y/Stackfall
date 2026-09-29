# Stackfall 현재 정본 정밀 감사 — 2026-09-28

감사 기준 `main` HEAD: `140c749c4afc5af4c811a96ed47eb0e9631612db`

이 문서는 2026-09-28 현재 `main`의 코드와 `docs/GAME_DESIGN.md`를 서로 대조한 현재 상태 감사다. 날짜가 붙은 이전 AUDIT 문서와 `awakening-audit-results.json`은 역사적 스냅샷이며 현재 수치·fingerprint의 정본이 아니다.

## 1. 문서 권한

1. `docs/GAME_DESIGN.md`: 현재 설계·구현 계약의 정본.
2. `docs/WIKI.md`: 플레이어용 파생 문서. 새 규칙을 독립 정의하지 않는다.
3. 이 문서: 현재 코드와 정본 문서의 정합성 감사.
4. `AWAKENING_RENDER_AUDIT.md`, `awakening-audit-results.json`: 과거 검사 기록.

승인된 무기·각성·스테이지 디자인은 버그 수정 과정에서 임의 재디자인하지 않는다.

## 2. 런 내부 자원과 영구 재화

### 각성 코어

- `state.awakeningCores`는 **런 내부 임시 자원**이다.
- 영구 저장소 `meta-progression.js`의 통화 키는 `stardust`, `coreShard` 두 종류뿐이다.
- 각성 코어는 Core Development/프로필 지갑에 저장하거나 표시하지 않는다.
- 전투 HUD와 각성 선택 UI에서는 현재 런의 보유량을 표시한다.
- 6중첩 무기 각성 확정 시 1개를 소비한다.
- 런 종료 시 남은 코어는 코어 1개당 기본 Stardust 40으로 환전하고 현재 Stardust 획득 배율을 적용한다.
- 사망, 스테이지 클리어, 메인 메뉴 이탈뿐 아니라 **일시정지 중 게임 다시 시작**에서도 환전하도록 2026-09-28에 누락 경로를 수정했다.
- 스테이지 최종보스는 처치 직후 런이 끝나므로 각성 코어를 지급하지 않는다.

### 영구 재화

- Stardust: 일반 영구 성장 및 슬롯/돌파 비용의 주 재화.
- Core Shard: 영구 재화. 현재 성장 노드의 중간/최종 돌파와 장착 슬롯 V·VI에 집중해 사용한다.
- 각성 코어와 Core Shard는 이름이 비슷해도 생명주기와 저장 범위가 완전히 다르다.

## 3. 피해 분석

- 게임 오버와 스테이지 승리 모두 동일한 피해 분석을 표시한다.
- 총 피해량, 평균 DPS, 최고 구간 DPS, 무기별 피해 비중, 시간별 DPS 추이를 제공한다.
- 시간 추이는 기존 15초 버킷에서 **60초(1분) 버킷**으로 변경했다.
- 전체 및 각 무기 시계열을 개별 토글할 수 있다.
- 마지막 1분 미만 구간은 실제 존재한 시간으로 DPS를 계산한다.

## 4. DEV 경계

- DEV UI와 개발 저장 프로필은 **현재 URL에 `?dev=1`이 명시된 경우에만** 활성화한다.
- 과거 `localStorage stackfall.devMode`에 의한 일반 주소 DEV 누출은 제거했다.
- 일반 저장: `stackfall.meta.v1`
- 개발 저장: `stackfall.meta.dev.v1`
- DEV 패널은 CORE 및 S1~S6 슬롯별 무기/중첩/각성 설정, 스테이지 직접 시작, 보스 이동, 회복, 각성 코어 지급, 개발 프로필용 영구 재화 무한을 제공한다.
- DEV 전환 시 예약 공격과 각성 부산물을 정리하는 기존 격리 규칙을 유지한다.

## 5. 무기·각성 정본

현재 각성 키는 `core, blade, ember, bulwark, gravity, comet, arc, prism, chrono, ion, nova, drone, rail, spiral, mirror, vacuum, mine, missile, gate`의 19종이다.

최근 정본 교정:
- 기본 성운 부메랑: 곡선형 에너지 부메랑. **달 형태가 아니다.**
- A7 월상 회귀: 달 실루엣과 월상 변화는 각성 전용.
- 기본 혜성 창: 즉시 발사.
- A6 종언 혜성창: 비에코 원본 4회마다 약 340ms 동안 거대 창 실체화·압축 후 초고속 전장 관통.
- A5 쌍성 붕괴: 두 우물이 실제 좌표상 접근한 뒤 합체 붕괴.
- A13 종언 레일포: 약 400ms 조립, 긴 레일 프레임과 강한 장거리 사격 실루엣.
- A14 창세 은하: 직선 유도탄처럼 수렴하지 않고 접선 출발과 다구간 나선팔을 유지.
- A15 천경 성역: 완전 반사 시 짧은 광선이 아니라 전장을 길게 가르는 굵은 6방향 광선.

과거 `legacy-chat-requirements-contract.mjs`가 A6=220ms와 기본 부메랑 달 형태를 여전히 강제하고 있던 것을 발견해 현재 정본으로 교정했다.

## 6. Stage 1~18 및 밸런스 조사

### Stage 1

초반 원거리 과밀을 완화했다.
- Bombardier 해금 및 고정 집중 웨이브를 175초로 지연.
- 해당 고정 웨이브 수를 3으로 축소.
- 초반 authored time 360까지 일반 스폰 풀은 Shardling/Dart 중심.
- 기본 생성 상한과 빈도도 완화했다.

### 전체 압박 곡선

각 Stage runtime의 원시 `spawnProfile`은 후반으로 갈수록 cap 증가/rate 감소 구조지만, 실제 런타임은 공통 `stageSpawnBudget()`가 다시 제한한다.

- 성능 tier와 compact 환경에 따라 상한을 낮춘다.
- 일반 동시 생성 count는 최대 2로 제한한다.
- 후반 Stage의 원시 cap 80대 값이 그대로 동시 적 수가 되는 구조가 아니다.
- 기존 구조는 Stage 6/12/18만 진행도 32%/62%에 중간보스 2회, 나머지는 46% 중간보스 1회였고 일반 보스는 전혀 없었다. 고정 이벤트 역시 대부분 wave 2회 + hazard 3회 + 최종보스의 동일한 큰 박자를 공유해 체감 단조로움의 원인이 됐다.
- 2026-09-29 후속 패스에서 별자리별 공용 중간보스/일반보스 풀과 Stage별 진행도 스케줄을 도입했다. Stage 1~2는 1+1, Stage 6은 3+2, Stage 12는 3+3, Stage 18은 4+3까지 증가한다. 동시 서브보스 전투 상한은 Route 2 / Bloom 3 / Array 4이며, 상한에 닿기 전에는 이전 보스가 살아 있어도 다음 예정 보스가 진입한다.
- 새 서브보스는 Route/Bloom/Array별 추가 공격 문법을 사용한다. 후속 교정에서 보스 수 증가의 목적이 성장량 증가에도 있다는 점을 반영해 각성 코어/XP 제한을 제거했다. 모든 Stage 중간보스/일반보스는 정상 성장 보상을 제공하며, 쌍둥이 보스만 기존 한 전투 1회 보상 규칙을 유지한다.
- 동시 서브보스 상한은 Route 2 / Bloom 3 / Array 4다. 이전 전투가 남아 있어도 다음 예정 전투가 들어올 수 있어 Stage에서도 다중 보스 혼전이 발생한다.
- Stage 최종 초월체에는 기존 line/circle 시그니처 외에 실제 렌더·판정을 가진 블래스터, 촉수형 공격, 균열 분출 manifested technique를 추가했다.
- 성좌 최종 Stage 보스는 일반 Stage 보스보다 HP +18%, 피해 +6%, 주요 주기 약간 단축.

코드상 압박 증가는 급격한 단일 점프보다 점진적으로 구성되어 있다. 다만 **플레이어의 실제 성장 속도·무기 운·난이도 선택까지 포함한 공정성은 정적 코드만으로 확정할 수 없으며 실플레이 표본이 필요하다.**

### 후반 기믹

Stage 13~18은 동일한 방사선 패턴의 숫자 변경으로 끝나지 않도록 다음 기하로 분리했다.
- 13: 중계 스캔 레인 + 안전 채널
- 14: 잡음 격자 + 안전 행/열
- 15: 방향 전환 평행 패킷 채널
- 16: 회전 블라인드 스윕 팬
- 17: 단계적으로 좁아지는 프로토콜 사각 봉쇄
- 18: 수축 다각형 침묵 봉쇄

## 7. 스테이지 배경

Stage 1~18 배경 구조는 미구현이 아니었다.
- 1~6: route / 파편의 항로
- 7~12: bloom / 심연의 개화
- 13~18: array / 침묵 중계망

정적 별/그라디언트는 캐시할 수 있지만 월드 구조는 플레이어 좌표에 따라 이동한다. 최근 문제는 주요 구조물까지 희미한 field alpha를 상속해 실제 화면에서 거의 보이지 않던 것이었고, 주요 랜드마크 가시성을 별도로 복구했다.

## 8. Core Development

- 영구 성장 지갑은 Stardust + Core Shard 두 종류만 표시한다.
- vitality/output/salvage: 최대 8레벨.
- cycle/magnet/armor: 최대 6레벨.
- 슬롯 V/VI: 각각 1회 영구 해금.
- 일반 레벨은 주로 Stardust를 소비한다.
- Core Shard는 중간/최종 돌파와 슬롯 해금에 사용한다.
- 상세 UI는 현재 누적 효과 / 다음 누적 효과 / 이번 순증가량을 동시에 표시한다.
- 중국어 언어 코드가 실제 `zh-CN`인데 `zh`를 검사해 한국어 라벨로 fallback하던 오류를 이번 감사에서 수정했다.

## 9. 코드 구조 조사

### 분산된 무기 레지스트리

무기 정의가 한 파일에 모여 있지 않다.
- `core.js`: 초기 7종 장비 정의.
- `runtime-config.js`: core 및 후속 12종을 조건부 추가.
- 일부 후단 파일이 속성까지 보정한다.

현재 동작 자체를 깨는 오류는 확인하지 않았지만, 이름/아이콘/기본값이 파일 간 드리프트할 위험이 있다. 향후 구조 정리 시 **동작·디자인 변경 없이 단일 정본 데이터 테이블로 합치는 작업**을 별도 마이그레이션으로 다루는 것이 안전하다.

### 전역 함수 래퍼 체인

정적 스캔에서 핵심 함수 재할당 래퍼가 여러 계층에 남아 있다. 특히 reward/endgame/community/performance/awakening 모듈이 `updateWeapons`, `dealDamage`, `updateWells`, `draw*`, `endGame`, `resetGame` 등을 순차 래핑한다.

이는 현재 Stackfall의 가장 큰 회귀 위험 중 하나다.
- 후단 래퍼가 이전 함수를 호출하지 않으면 기능이 조용히 사라질 수 있다.
- 최적화가 상위 보상/각성 래퍼를 덮어쓸 수 있다.
- 각성 BASE/AWAKE 소유권을 잘못 읽으면 기본 디자인에 각성 디자인이 누출될 수 있다.

따라서 대규모 구조 변경 전까지는 기존 소유권 계약과 load order를 유지하고, 래퍼를 새로 추가하기보다 기존 최종 소유자 안에서 수정하는 것을 우선한다.

### 현재 중요 load order

후단 핵심 순서:
`meta-upgrades.js → weapon-awakening.js → A1-A7 → A8-A13 → A14-A19 → dev-tools.js → canonical-weapon-visuals.js`

`canonical-weapon-visuals.js`가 현재 마지막 runtime script이며 기본 투사체·방벽·중력·공전 무기 일부의 최종 시각 소유권을 가진다.

## 10. 이번 감사에서 실제 발견·수정한 찐빠

1. Awakening Core를 Core Development 영구 지갑에 잘못 노출한 최근 변경.
2. 피해 추이 15초 단위가 현재 요구와 맞지 않음 → 1분 단위.
3. 중국어 Core Development 상세 라벨 언어 코드 불일치(`zh` vs `zh-CN`).
4. 일시정지 → 게임 다시 시작 경로에서 남은 Awakening Core가 Stardust로 환전되지 않고 0이 되던 문제.
5. legacy 회귀 계약이 현재 정본과 반대로 A6 220ms / 기본 부메랑 lunar painter를 요구하던 문제.
6. 과거 감사 문서와 JSON이 현재 정본처럼 읽힐 수 있던 문서 권한 혼선.

## 11. 정적 검증과 한계

확인:
- 현재 runtime JS의 변경 파일은 문법 파싱 가능한 상태로 확인했다.
- Stage 1~18 runtime의 spawn pool/profile 및 공통 spawn budget을 직접 읽어 구조를 대조했다.
- 44개 `scripts/*.mjs`에서 최근 정본과 충돌하는 15초 damage bucket, 220ms Final Comet, persistent DEV, Core Development Awakening Core, 기본 lunar boomerang 잔재를 정적 검색했고 발견한 legacy 계약을 교정했다.
- Awakening Core 영구 저장 금지와 환전 경로를 meta contract에 추가했다.

아직 이 감사 이후 실제 브라우저 전체 플레이를 재실행한 것은 아니다. 따라서 다음은 별도 수동 QA가 필요하다.
- 현재 배포본의 픽셀/애니메이션 전수 비교.
- 모든 각성 조합과 고밀도 전투의 장시간 시각 QA.
- 실제 모바일/저사양 장기 성능.
- Stage 1~18의 플레이 체감 난이도와 성장 속도.
- 수동 조준 기능. 구현 코드는 존재하지만 이전 실플레이에서 고장 보고가 있었고 현재 작업 범위에서는 의도적으로 손대지 않았다.

## 12. 다음 작업 우선순위

1. 최신 배포 fingerprint 확인 후 desktop/mobile 실플레이 캡처.
2. BASE 1중첩 / BASE 6중첩 / AWAKE 6중첩의 19무기 시각 비교.
3. Stage 1 초반 3분 생존성과 Stage 6/12/18 성좌 종착 난이도 표본 수집.
4. Stage 13~18 기믹이 실제 화면에서도 서로 즉시 구분되는지 확인.
5. 별도 작업으로 수동 조준 재현 및 수정.
6. 안정화 뒤에만 무기 레지스트리/전역 래퍼 구조 단순화를 검토한다.


## 13. 감사 종료 상태

- 정본 교정 후 배포 fingerprint 대상 자산 **72개**를 다시 해시했다.
- fingerprint 대상 runtime JavaScript **65개**를 소스 파싱 검사했고 오류가 없었다. fingerprint에서 의도적으로 제외되는 `src/build-info.js`도 별도로 파싱했다.
- 최신 계산 fingerprint: `sha256-de4ad680ead841b55f8dd679610b721420baef5c34346f34ee24f4cb4c820fcd`
- `GAME_DESIGN.md` / `WIKI.md`에서 피해 분석의 구 15초 계약과 Core Development의 Awakening Core 영구 지갑 표현이 제거된 것을 재확인했다.
- legacy 계약은 Final Comet 340ms 및 기본 non-lunar Boomerang 기준으로 정정했다.
- 현재 환경에서는 GitHub 저장소를 로컬 clone하여 실제 Node/browser 테스트를 재실행할 네트워크 경로가 없었으므로, **이번 종료 검증은 원격 소스 정적 감사·문법·계약 문자열·fingerprint 재계산 범위**다. 과거 2026-09-27 브라우저 soak 수치를 현재 결과처럼 재사용하지 않는다.
