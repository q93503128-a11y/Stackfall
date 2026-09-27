# Stackfall 각성·렌더링 정합성 감사 (2026-09-27)

시작 remote main: `2ec3adc5ae422a0fd29b7d676ee05495f397549c`.
대상은 기존 main이며 수동 조준 재설계와 신규 디자인은 포함하지 않았다. 종료 커밋은 이 보고서를 포함한 main 커밋 이력에서 확인할 수 있다.

## 확인한 문제와 수정

- canonical 파일의 `awake`는 다른 IIFE의 지역 함수에 접근할 수 없었다. `typeof` 방어로 오류 없이 항상 기본 분기를 선택해 A2/A4/A5의 각성 외형이 가려졌다. 명시적 `state.awakenedWeapons`를 읽는 공용 판정에 연결했다.
- 판정을 복구하면 일반 Ember 탄까지 소유자의 현재 각성 상태를 따라 변할 잠재 문제가 있었다. 래스터와 치수는 탄 자체의 `awakeningChild`로 결정한다. 기존 일반 탄의 각성 전후 이미지 객체·크기 동일성을 검사했다.
- 후속 정정에서 기본 부메랑의 외향/귀환 월상 변화가 기존 승인 디자인임을 재확인했다. 기본은 초승달→차오름→귀환 중 기울기를 유지하고, A7은 여기에 추가 대형 순환 궤도와 귀환 파문을 더한다. 기본 경로의 시작/정점/귀환 Canvas 원호 명령이 서로 달라지는지 검사한다.
- 다중 투영 블레이드의 표시 반경(및 각성의 회전 속도)이 타격 좌표와 달랐다. 기본/각성 모두 기존 타격 궤도에 맞췄고 외형은 유지했다.
- 프리즘 좌표 버퍼는 3개였지만 다중 투영으로 최대 5개를 요청해 예외가 났다. 5개 객체와 길이별 view를 사전 할당한다. 1→3→5→2→5 전환과 view 재사용을 검사했다.
- `PLAYER_RASTER_CACHE` 선언이 빠져 플레이어 렌더에 ReferenceError가 발생했다. 캐시를 정의했다.
- `blade-shear`, `barrier-lance`, `echo-reflect`, `apex-forge-star`가 generic 경로로 빠졌다. 각각 blade-wave, shard, shard, ember 계열에 연결했다.
- gate-crossfeed가 원본 계열은 넘겨도 각성 탄의 provenance는 버렸다. 존재하는 `awakeningChild`/`awGenesis`만 복제하며 기본 탄에는 새 각성 필드를 만들지 않는다.
- DEV 기본 전환에 이전 예약 공격·일반 형식의 각성 부산물·적 timeLock이 남을 수 있었다. DEV 표본 전환에서 예약 공격과 전투 시각 배열, 각성 초기화 3개 훅을 함께 정리한다. Clear entities도 예약 공격을 취소한다.
- spatial `updateWells`가 reward 래퍼를 덮어 중력 증폭 소멸 폭발과 특이점 탄환 왜곡을 지웠다. 최적화 대상을 `updateWellBodies`로 분리하고 외부 래퍼를 보존했다. 실제 만료/속도 변화를 검사했다.
- 이온·미러는 초기 증폭과 최종 증폭이 중복 실행됐다. 드론·나선은 DOMContentLoaded compatibility 래퍼가 최종 구현에 증폭을 다시 붙였다. 최종 각성 모듈 안의 독립 증폭만 남겼다. 이온 1중첩은 본체 2회+보조망 2회, 미러는 반사당 보조 광선 2개, 드론 표식 1회, 나선 보조탄 20개를 검사한다. 기본 6중첩의 이온 105ms 재시전 등 원래 성장 효과는 유지했다.
- A4가 보호막을 보유했다는 이유만으로 피해 0에도 반응했다. HP/보호막의 실제 감소를 조건으로 사용한다.
- 심각 부하 모드는 Canvas 렌더를 멈추고 generic GPU 실루엣으로 교체하거나 Canvas 배율을 .30으로 내렸다. 경로를 삭제하고 모든 플레이어 무기/광선/캐릭터/각성은 같은 Canvas 소유자를 유지한다. Tier 2 effects 분기도 각성 효과를 위임한다.
- GPU 준비 진단은 비활성 플레이어 스프라이트 풀을 조건으로 삼았다. 실제 WebGL·canvas·ticker 상태로 판정한다. 모바일 resize에서는 오래된 compact cache 대신 현재 뷰포트로 Canvas와 동일한 DPR을 계산한다.

- 모바일 스크린샷에서 속도 버튼이 HP 수치를 덮는 것을 확인했다. 좁은 화면 HUD 폭에 두 제어 버튼의 공간을 확보했다.

A6 기본 발사는 시작 main에서도 즉시 실행됐다. 이번 감사에서 기본의 선딜을 새로 제거했다고 주장하지 않는다. 옛 windup bridge/계약/문서 잔재를 정리하고, 비에코 원본 4회마다 A6 특수 추가창만 220ms 후 발사하는 것을 실제 브라우저에서 219ms/221ms 경계로 검증했다. A15의 원본 시전 6회 충전도 기획대로 보존했다.

## 삭제한 코드

- canonical이 완전히 대체한 과거 플레이어 투사체 painter 및 raster, 회전 Ember 별, 구형 중력 raster와 저비용 중력 painter.
- render-space/targeting의 구형 방벽 painter/raster, 기존 orbit의 shadowed 프리즘 painter, endgame의 가려진 추가 블레이드 painter 및 이를 숨기던 임시 stack 변경.
- GPU 플레이어 generic 투사체/광선 풀·텍스처·동기화, emergency 단순 적/플레이어/위험/안내 풀, 전경 숨김 및 관련 compatibility 연결.
- 호출되지 않는 fixed screen-space Stage 01~18 painter. 공유 월드 구조와 배경 캐시는 유지했다.
- 중복/덮어써진 초기 ion/drone/rail/spiral/mirror 증폭 래퍼와 DOM-ready 보정.
- 존재하지 않는 resizeForegroundCanvas/Comet windup 연결, 읽지 않는 awMissileSignaturePending/awOriginalTargetId/awDiveTime 및 spiral phase 인수.

기본과 각성 양쪽에서 사용되는 painter는 삭제하지 않았다. 예를 들어 A7은 일반 곡선은 원래 painter에 위임하고 각성 곡선만 별도로 그린다. A8/A12 및 A14~A19의 기본 entity renderer도 실제 BASE 분기에서 살아 있으므로 유지한다.

## 실제 소유권

아래 화살표는 **최초 정의 → 로드 순서에 따른 래퍼 → 최종 소유자**다. 최종 래퍼가 저장한 이전 함수를 호출할 때만 체인이 실행된다. A1/A2/A3는 각각 a1-a7/a8-a13/a14-a19 모듈을 뜻한다.

| 함수 | 정의 및 래퍼 순서 | 기본/각성 처리 |
|---|---|---|
| drawProjectiles | render-entities 선언 → canonicalPlayerProjectileVisuals | 단일 canonical, 개별 탄 provenance로 래스터 선택 |
| drawEquippedOrbits | render-entities(드론) → endgame synchronizedOrbitVisuals → community prismAttackStartOrbitFlash → A1 eclipseBladeVisuals → A2 awakenedCrownFleetOrbits → canonicalEquippedOrbits | BASE blade는 canonical, A2 blade는 A1; BASE prism/drone는 기존 체인, 각성은 A2 |
| drawDefenseBarrier | render-space 선언 → canonicalDefenseBarrier | 명시적 각성으로 같은 armor 계열 분기 |
| drawGravityLens | render-entities 선언 → canonicalGravityBlackHole | 동일 black hole, 각성 binary cue 추가 |
| drawBoomerangs | render-entities → A1 lunarReturnVisuals | BASE도 왕복 월상 변화; 각성 entity는 추가 순환·강조 월상·귀환 파문을 별도 painter로 처리 |
| drawAlliedEffects | render-entities → GPU hybridAlliedEffectDraw → A1 → A2 → A3 awakeningThirdSetEffects | GPU는 장식 입자만 분리, 각성 outer wrapper는 유지 |
| drawPostRosterWeaponEntities | render-entities → A3 awakenedThirdPostRosterVisuals | 일반 배열은 위임, 각성 entity는 A3 |
| drawPlayer | render-entities → targeting drawPlayerWithManualAim → A1 firstSetPlayerVisuals | 기존 core + gated Ember caster; crystal core 내부도 A1 stellarCoreVisual 래퍼 |
| drawWells | render-entities drawWells | 무기 우물은 canonical lens, trait 우물은 전용 분기 |
| drawEffects | render-entities → performance optimizedEffects | Tier 2도 drawAlliedEffects 호출. GPU foreground는 캡처한 drawForegroundEffects만 별도 실행 |
| updateWeapons | weapons → reward → combat-balance echoBladeUpdate → endgame multiplicityOrbitWeapons → A1 → A2 → A3 awakeningThirdSetWeapons | 기본/증폭 실행을 유지하며 각성만 explicit gate |
| updateProjectiles | systems → performance spatialProjectileUpdate(대체) | 최종 spatial owner, 계열 damage/provenance 유지 |
| updateBoomerangs | systems → endgame continuousBoomerangs(대체) → A1 lunarReturnUpdate | 일반은 endgame, lunar entity는 A1 |
| updateWells | systems delegate → reward → A1 binaryCollapseUpdate | delegate 내부 updateWellBodies만 performance가 교체 |
| dealDamage | systems-base → feature-pack → reward → endgame → community → A1 → A2 awakeningSecondSetDamage | 증폭/통계/각성 노드의 순서 유지 |
| hurtPlayer | bosses → reward → endgame shorterHitInvulnerability → A1 celestialBastionHurt | 기본 피해/증폭 후 실제 손실에만 A4 반응 |

브라우저에서 위 16개 함수의 실제 `name`도 수집했다. 함수 전체를 대체하는 경로와 일부 기능을 위임하는 경로를 구분하지 않으면 우물 회귀처럼 기능이 빠질 위험이 있다. A8/A12 렌더 래퍼는 BASE 그림을 건너뛰기 위해 잠시 stack을 바꾸고 finally로 복원하는 기존 방식이 남아 있다. 이것은 살아 있는 BASE renderer의 조건부 선택이며, 전역 상태를 읽는 후속 래퍼 추가 시 주의가 필요하다. 전역 함수 재할당 자체를 이번 감사에서 모듈 아키텍처로 재설계하지 않았다.

### index.html 실제 순서

```text
01. src/build-info.js
02. src/bootstrap.js
03. src/core.js
04. src/stage-catalog.js
05. src/run-modes.js
06. src/language-pack.js
07. src/boss-catalog.js
08. src/systems-base.js
09. src/runtime-config.js
10. src/weapons.js
11. src/meta-progression.js
12. src/boss-patterns.js
13. src/bosses.js
14. src/systems.js
15. src/interface.js
16. src/stage-map.js
17. src/settings.js
18. src/runtime-controls.js
19. src/realm-backgrounds.js
20. src/render-space.js
21. src/elite-renderers.js
22. src/render-entities.js
23. src/feature-pack.js
24. src/reward-refinement.js
25. src/difficulty-augment-expansion.js
26. src/combat-balance-refinement.js
27. src/progression-expansion.js
28. src/map-event-expansion.js
29. src/targeting-motion-refinement.js
30. src/combat-guidance-refinement.js
31. src/ability-ledger-audit.js
32. src/run-damage-stats.js
33. src/render.js
34. src/sortie-prep.js
35. src/stage-runtime.js
36. src/stage02-runtime.js
37. src/stage03-runtime.js
38. src/stage04-runtime.js
39. src/stage05-runtime.js
40. src/stage06-runtime.js
41. src/stage07-runtime.js
42. src/stage08-runtime.js
43. src/stage09-runtime.js
44. src/stage10-runtime.js
45. src/stage11-runtime.js
46. src/stage12-runtime.js
47. src/stage13-runtime.js
48. src/stage14-runtime.js
49. src/stage15-runtime.js
50. src/stage16-runtime.js
51. src/stage17-runtime.js
52. src/stage18-runtime.js
53. src/stage-environment-visuals.js
54. src/dark-cosmic-polish.js
55. src/performance-guard.js
56. src/build-audit-ui.js
57. src/gpu-renderer.js
58. src/endgame-balance-expansion.js
59. src/community-feedback-refinement.js
60. src/meta-upgrades.js
61. src/weapon-awakening.js
62. src/weapon-awakening-effects-a1-a7.js
63. src/weapon-awakening-effects-a8-a13.js
64. src/weapon-awakening-effects-a14-a19.js
65. src/dev-tools.js
66. src/canonical-weapon-visuals.js
```

## A1~A19 결과

PASS는 다음 재현 범위에서 누출이 관찰되지 않았음을 뜻한다. 각 무기를 독립 BASE 1/BASE 6/AWAKE 6으로 구성해 signature 트리거, 추가 동작/FX/entity metadata, 이름과 실제 draw 호출을 검사했다. BASE 6+증폭+다중 투영 2, AWAKE 6+같은 조합도 실행했다. 각성 직후 예약 공격이 남은 상태에서 BASE 1/6으로 바꿔 2초간 예약 큐를 진행하고 각성 배열·player aw 상태·metadata·큐가 초기 상태인지 검사했다.

visual PASS는 명시적 gate 추적, 실제 래스터 경로 검사 및 고정 시점 Canvas 표본의 BASE/각성 구별을 합친 결과다. 모든 애니메이션 프레임을 승인 이미지와 비교한 골든 픽셀 검사가 아니다.

| ID / 무기 | BASE leakage | visual leakage | transient contamination | 각성 positive trigger |
|---|---|---|---|---|
| A1 core | PASS | PASS | PASS | 4회 항성 일제사격 |
| A2 blade | PASS | PASS | PASS | 블레이드 정렬 |
| A3 ember | PASS | PASS | PASS | 12타 성광 |
| A4 bulwark | PASS | PASS | PASS | 실제 피격 방벽 |
| A5 gravity | PASS | PASS | PASS | 쌍성 합병 |
| A6 comet | PASS | PASS | PASS | 4회 특수창 충전 |
| A7 arc | PASS | PASS | PASS | lunar 곡선 |
| A8 prism | PASS | PASS | PASS | 프리즘 왕관 |
| A9 chrono | PASS | PASS | PASS | 시간 봉쇄 |
| A10 ion | PASS | PASS | PASS | 이온 회로 |
| A11 nova | PASS | PASS | PASS | 3회 초신성 |
| A12 drone | PASS | PASS | PASS | 5회 함대 |
| A13 rail | PASS | PASS | PASS | 4회 종점 레일 |
| A14 spiral | PASS | PASS | PASS | 4회 창세 |
| A15 mirror | PASS | PASS | PASS | 6면 성역 |
| A16 vacuum | PASS | PASS | PASS | 연꽃 필드 |
| A17 mine | PASS | PASS | PASS | 5회 성궤 |
| A18 missile | PASS | PASS | PASS | 3회 포위 |
| A19 gate | PASS | PASS | PASS | 관문 충전 |

## 렌더·스테이지·DEV 검증

- 기록 Canvas에서 canonical을 실제 실행하여 34개 projectile source 경로의 래스터 크기와 generic 미진입을 검사했다. 추가로 브라우저의 증폭/각성 조합에서 생성된 source들의 unknown 진단은 0이었다. 모든 미래/외부 source를 자동으로 증명하는 것은 아니다.
- WebGL 정상, CDN 차단 Canvas 폴백, 컨텍스트 손실/복구 3회, desktop 1920×1080 / mobile 390×844 DPR 2 resize를 검사했다. 캔버스/텍스처/ticker 누적 및 런타임 오류가 없었다.
- 장식 끄기와 심각 부하에서도 canonical 투사체 draw 호출과 화면 밖 안내를 유지했다. 사용자 설정의 투사체 숨기기는 별도로 유지한다.
- 부하에 의한 .30/.55 배율이나 generic 플레이어 교체 경로는 제거됐다. 기존 화면 면적 130만 px 이상의 정상 .90 배율/DPR cap은 변경하지 않았다.
- Stage 1~6 route, 7~12 bloom, 13~18 array 구분을 유지했다. 각 스테이지를 DEV로 실행하고 플레이어 (37,23) 이동에 대한 타일 draw 좌표의 역이동을 실제 Canvas 명령으로 검사했다. 18개 Boss now도 모두 실제 stage-boss를 생성했다.
- 선택/전체 1중첩·6중첩·각성, cores 99, Heal, Clear entities, Endless를 검사했다. DEV는 별도 저장 프로필을 사용한다.

## 검사 및 재현

이 저장소에는 package.json과 npm lockfile이 없다. 설치할 npm 의존성이나 npm run build가 없으므로 기존 빌드 엔트리 `node scripts/build-fingerprint.mjs`를 사용한다. 새 패키지 구성은 만들지 않았다.

```powershell
python -m http.server 8000 --bind 127.0.0.1
node scripts/build-fingerprint.mjs
node scripts/browser-smoke.mjs --soak-ms=120000 --result=test-results/final-audit.json
```

빌드는 src JavaScript 66개의 문법, 기존 37개 계약 엔트리, 소유권 8개 그룹을 실행한다. stage-balance-performance는 새 awakening-ownership 계약을 import한다. scripts의 .mjs 문법도 별도 검사했다. 기존 계약의 오래된 파일 위치/10분 Apex/기본 Comet 선딜/fixed Stage renderer 요구를 현재 정본에 맞춰 갱신했다. Stage hazard는 문자열 존재 대신 실제 adapter를 실행해 기하 명령 발생과 유한 좌표를 확인하며, 새 적의 등장 시점은 현재 catalog의 정확한 값으로 검사한다. 부하 하네스의 profiling wrapper가 dt를 버리던 오류도 고쳤다.

빌드 fingerprint는 index의 실제 local asset manifest와 LF 정규화 내용으로 계산했고, 브라우저가 제공한 값과 비교했다. 검증 결과 요약은 함께 저장한 `awakening-audit-results.json`에 있다. 전체 원본 로그/스크린샷은 로컬 ignored test-results에 남는다.

최종 자산 fingerprint: `sha256-33b31d335e91e52718c3cd538c30f97dbfe40aedc03686aa84c8ee2309e6a978`. 로컬 제공 값과 일치했다.

최종 120초 부하: 7194 프레임, 평균 59.96 FPS, p95 16.80ms, 최대 22.10ms, 50ms 이상 비율 0.00%. 런타임 오류 0건, 검사 실패/생략 0건. 의도적으로 차단한 Pixi CDN 경고만 허용했다. 컨텍스트 복구 3회 후 live textures 3개, ticker/context listener 등록 각 1회였다. 힙 변화 2.73 MiB는 이 짧은 구간의 측정값이며 장기 누수 부재의 증거로 사용하지 않는다.

## 남는 시각 확인 범위

19행×3열 Canvas 갤러리와 desktop/mobile 스크린샷을 확인했다. 갤러리는 signature 시작 순간의 표본이며 탄이 플레이어와 겹치거나 짧은 FX가 이미 진행된 항목이 있다. 초승달/armor/black hole 등 정체성과 각성 구분은 확인했으나, 19개 모든 무기의 전체 애니메이션과 모든 조합·보스·실기기에서 시각적으로 완벽하다고 판정하지 않는다. 실제 장시간 플레이, 저사양/모바일 기기, 고주사율, 복합 각성 시 화면 가독성, 모든 stage 구조의 전 구간 이동은 추가 수동 QA 범위다. 로컬 부하 수치는 해당 PC/Chrome/fixture의 결과이며 일반적인 FPS 보장이 아니다. 원격 배포 완료 및 CDN 자산 전파는 Git push 확인과 별개다.
