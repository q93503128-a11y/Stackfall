# Stackfall Runtime Architecture Audit — 2026-10-31

> **Status: HISTORICAL AUDIT / EVIDENCE.** This records findings from a specific cleanup pass. Current runtime authority is `CURRENT_STATE.md` plus executing source/contracts.


## Scope

This audit was performed while implementing the Suction Magnet field pickup, preserving unclaimed XP, and repairing the Apex defeat lifecycle on top of `feature/enemy-director-v1` (`a432b8d3819ec2a2bf85d866ffa5b91652f1a0df`).

The comparison is source-level. Stackfall is compared primarily with browser/Canvas survivor implementations where ownership and update-loop structure are directly comparable.

Reference codebases inspected:

- `TheyCallMeHenry/Qwen-Survivors` — modular browser survivor, reference tree around `f2277cd5a9eeec57b16ca3cde09799148ece7f65`.
- `ricardo-foundry/canvas-vampire-survivors` — Canvas survivor, reference tree around `e616704889e57efc9c1f49098786a95c364008d3`.
- `Amrendra-gupta/VOID-SURVIVORS` — simpler browser survivor, reference commit `1e53cf9280ac073eddb1b7ab4da104c13d6c2952`.
- Vampire Survivors itself was used only as a player-facing behavior reference; its proprietary production source was not treated as available source code.

## Executive finding

Stackfall's main architectural problem is not its number of files and not its fixed-timestep loop. The largest risk is runtime ownership ambiguity caused by late global function replacement.

Historically, multiple scripts could capture an earlier global function and replace it later. Correct behavior therefore depended on load order. The affected paths included enemy updates, spawning, damage/death dispatch, Apex phase logic, targeting, rendering, and reward entry.

The immediate repair in this pass is deliberately incremental rather than a full module-system rewrite:

- Experience Gems now have a canonical persistent lifecycle instead of a timed lifetime.
- Field pickups have a dedicated owner (`src/field-pickups.js`).
- Enemy Director integrates through explicit service hooks instead of replacing `updateSpawning`, `updateEnemies`, and `killEnemy`.
- Last Constellation no longer temporarily replaces global `killEnemy` while routing node damage.
- Apex reward entry is prepared before the game commits to `apexReward` mode.
- Runtime ownership contracts were added so the repaired boundaries cannot silently regress to late wrappers.

## Comparison matrix

| Area | Stackfall before this pass | Qwen-Survivors | canvas-vampire-survivors | VOID-SURVIVORS | Decision |
| --- | --- | --- | --- | --- | --- |
| Main loop | Fixed-step simulation, but many late scripts can replace functions called by it | Dedicated `Loop` and `Game` owners | Main orchestrator calls explicit domain update methods | Mostly monolithic update code | Keep Stackfall fixed-step loop; reduce mutable global call targets |
| State ownership | Large shared runtime state plus load-order-dependent behavior | `Game` owns major runtime systems | Explicit arrays/systems owned by main game object | Global/monolithic state | Incrementally introduce explicit subsystem owners; no full rewrite yet |
| XP lifecycle | Gem object had ~35 s TTL even though value compression existed | Dedicated pickup owner/pool | Explicit EXP orb lifecycle | EXP orbs persist without a timed despawn | Preserve Stackfall's value-conserving compression; remove XP TTL |
| Field pickups | No clean general owner for the requested one-shot magnet | Dedicated `Pickups` domain | Separate item/entity paths | Simple entity objects | Adopt dedicated Stackfall field-pickup service |
| Enemy director | Feature script replaced core update/death functions | Explicit game/entity ownership | Explicit update/spawn calls | Logic centralized in monolith | Director becomes a service invoked by canonical owners |
| Damage/death | Several layers could wrap `dealDamage`/`killEnemy`; Last Constellation temporarily swapped global `killEnemy` | Direct domain methods | Entity/game-owned damage paths | Direct monolithic path | One death dispatch path; special bosses request behavior through options/hooks |
| Boss lifecycle | Rich content but fragmented across dynamically loaded production/refinement scripts | Simpler, clearer ownership | Simpler boss entity ownership | Simpler boss logic | Preserve Stackfall content, repair lifecycle boundaries incrementally |
| Rendering | Strong layered renderer/Pixi integration, but some late renderer replacements | Explicit renderer calls from Game | Explicit entity render functions | Direct drawing | Keep renderer; stop introducing new late replacements |
| Diagnostics | Extensive runtime diagnostics and browser QA | Good performance instrumentation in loop | Basic/moderate | Minimal | Stackfall is stronger here; keep and expand |
| Failure containment | One exception or stale wrapper could leave mode/lifecycle half-entered | Cleaner module boundaries | Fewer late mutations | Simplicity limits surface area | Make state transitions atomic and regression-tested |

## Where Stackfall is already better

### XP value conservation

A fixed pickup pool that overwrites an active slot is simple but can lose value unless explicitly merged. Stackfall already had the more valuable concept: when entity pressure is high, Experience Gem objects can be compressed while preserving aggregate XP value. This pass keeps that model and removes the unrelated timed value loss.

### Diagnostics and regression tooling

Stackfall has unusually strong browser-side diagnostics for a small browser game: runtime error collection, renderer diagnostics, performance instrumentation, developer spawn/control paths, build fingerprints, source-ownership contracts, and browser smoke scenarios. The problem was that several important tests bypassed the exact contested lifecycle. The Last Constellation test now destroys its real 4→3→3→1 node sequence and performs the final lethal hit through the real damage path.

### Boss content depth

The production Apex implementations are substantially richer than the simple boss implementations in the small public survivor repositories inspected. A wholesale rewrite to mimic those repos would reduce content capability. The correct lesson from them is ownership clarity, not boss simplification.

## Main debt found

### 1. Late global replacement

The highest-risk historical pattern is:

```js
const baseFoo = foo;
foo = function (...) {
  // additional behavior
  return baseFoo(...);
};
```

This is not always intrinsically wrong, but Stackfall accumulated enough layers that the effective owner became "whichever implementation loaded last". It also made a caller holding an older captured function behave differently from a caller resolving the current function.

The most dangerous concrete example was Last Constellation node damage temporarily replacing global `killEnemy`, restoring it in `finally`, and later calling a previously captured kill function for the final owner death. At the same time, Enemy Director could also replace `killEnemy` for refill bookkeeping. Those responsibilities should never compete for ownership of the same global function.

### 2. Dynamic load graph is part of production architecture

`index.html` alone is not the complete load graph. `build-info.js`, `run-modes.js`, boss production/reset scripts, and related runtime loaders inject additional scripts. Any architecture audit must distinguish:

- file exists in repository;
- file is statically referenced;
- file is dynamically loaded;
- file actually owns the final runtime function.

A build-fingerprint defect was also found during this pass: regenerating the first build-info values must not delete the Apex loader body appended to `src/build-info.js`. The build writer now preserves that suffix and validation explicitly checks it survives.

### 3. Half-committed UI modes

A modal state must not become authoritative before the UI required to leave that state is ready. Apex reward setup now prepares/validates the reward surface before committing the mode transition, reducing the possibility of a visually frozen run caused by entering `apexReward` without a usable overlay.

## Changes adopted now

### Experience Gems

Invariant:

> Unclaimed XP value does not disappear during a run.

Gem object count may be compressed for performance, but total unclaimed value must remain conserved. Timed `life: 35` semantics are removed from XP gems rather than replaced with an infinite fake lifetime.

### Suction Magnet (`흡입 자석`)

`자석 코어` remains the normal passive pickup-range/speed upgrade.

`흡입 자석` is a separate field pickup. On collection it marks the Experience Gems that exist at that moment for forced attraction. They travel to the player and enter the normal XP collection path; XP is not granted instantly. Gems created afterward are not retroactively affected.

The field pickup has its own update/render/drop owner rather than being hidden inside the gem list.

### Enemy Director

The Enemy Director keeps its current gameplay intent—time-segmented density, roles, ranged attack slots, charger telegraphs, boss breathing room, refill delays—but no longer owns the core update/death functions by replacement. Canonical systems invoke director hooks explicitly.

### Last Constellation death routing

Intermediate node damage uses a canonical damage option that defers owner death while node accounting is performed. Final shared-health death resolves the current canonical `killEnemy` once. The damage routine no longer swaps the global kill function during combat.

### Runtime ownership contracts

Static contracts now guard the repaired ownership boundaries and field-pickup/XP invariants. Browser QA covers persistent XP, Suction Magnet behavior, and the real Last Constellation lethal path.

## Adopt later

- Continue moving dynamic feature behavior behind explicit subsystem APIs instead of wrappers.
- Consolidate Apex production loading so each form has an obvious gameplay owner and presentation owner.
- Introduce an explicit event/observer surface for cross-cutting analytics/achievements where several systems currently want post-death notification.
- Gradually reduce global mutable symbols, but only behind regression-tested boundaries. A single large ESM migration is not justified while the game is actively changing.
- Split remaining oversized canonical files by domain when a clear ownership boundary exists; do not split merely to reduce line count.

## Do not adopt

- Do not copy the fixed-pool overwrite semantics of simpler survivor implementations if it can discard XP value.
- Do not replace Stackfall's richer Apex implementations with the much simpler bosses in public reference repos.
- Do not perform a full ESM/class rewrite solely for architectural aesthetics.
- Do not move back toward a single monolithic `script.js`; VOID-SURVIVORS is useful as a simplicity reference, not as a scaling target.
- Do not add another `*-fix.js` whose only purpose is to load later and replace a canonical global function.

## Validation performed for this pass

The final runtime validation exercised:

- full repository static/contracts validation through `scripts/build-fingerprint.mjs`;
- build-info loader preservation after fingerprint generation;
- browser QA for XP persistence/value conservation;
- browser QA for Suction Magnet snapshot attraction and normal collection;
- Last Constellation real node progression through all 11 nodes;
- x10 final lethal projectile through the production damage path;
- Apex exit cinematic state;
- visible Apex reward state;
- reward confirmation and run-timer resumption;
- runtime error diagnostics (zero errors in the successful scenario).

A separate aggregate Apex QA attempt exposed a race in an older Chronophage multipart test fixture: the production runtime can rebuild `bodyParts` between fixture setup and a later assertion. That is a test-harness race, not the reported Last Constellation freeze. The focused production Last Constellation lifecycle test passes.
