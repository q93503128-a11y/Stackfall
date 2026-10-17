# Stackfall Refactor / Ownership Audit — 2026-10-17

## Scope

This pass follows the current production-review rule: inspect the actual implementation first, do not add content for its own sake, and prioritize cases where existing gameplay is weakened by unclear ownership, duplicate overrides, state/visual mismatches, or inconsistent presentation.

This is a refactor audit, not a redesign pass. The user-reported visual issues are recorded here, but boss art/pattern redesign and map/background visual fixes are intentionally separated from the structural cleanup.

Current visual canon remains `docs/STAGE_VISUAL_CANON_2026-10-16.md`: Endless is the normal-space visual baseline; authored stages vary at constellation level rather than using bespoke story backdrops.

---

## A. Confirmed source-ownership findings

| Target | Current implementation | Problem | Decision | Priority |
|---|---|---|---|---|
| Stage 1 dynamic loading | `src/run-modes.js` previously had bespoke nested loaders for `stage01-remodel.js -> stage01-polish.js -> stage01-world.js` | Loader logic encoded one stage and one patch chain directly, making later stages harder to add and source ownership unclear | **Integrate** into one runtime-script manifest / sequential loader | P0 |
| Stage 1 world rendering | `stage01-polish.js` defined `production.drawWorld`, then `stage01-world.js` replaced it again | Two files owned the same final method; the second file existed only to undo part of the first | **Delete** redundant world override and make final polish layer own the method | P0 |
| Stage 1 runtime mutation | `stage01-remodel.js` registers/rewrites Stage 1 behavior; `stage01-polish.js` mutates the same registry entry again | Still a two-layer runtime definition; acceptable temporarily, but not a scalable final pattern | **Refactor later** into one canonical Stage 1 runtime module after behavior stabilizes | P1 |
| Stage 1 audio | `stage01-remodel.js` wraps `audio.syncAmbient` and owns its own interval/fades | Stage-specific global wrapper will become fragile when Stage 2+ add music | **Integrate** into shared stage-audio routing before multiple stages are active | P1 |
| Elite encounter routing | Stage 1 wraps `window.stackfallSpawnEliteForm` | Global monkey patch changes behavior outside the stage system and relies on load order | Move authored encounter-form selection into `stage-runtime.js`/runtime definition | P1 |
| Stage boss clamp | Stage 1 wraps `window.stackfallClampStageBossToArena` | Another stage-specific global patch; future stage exceptions can stack | Move clamp policy into runtime/production metadata | P1 |
| Constellation render functions | Stage 1 assigns global `drawStageWorldBackdrop` and `drawStageConstellationField` | Constellation-level functionality is not Stage-1-specific and should not live in a single stage implementation | Move to a shared constellation-background module before Stage 2 | P1 |
| Stage map CSS | `styles.css` contains an older `.galaxy-stage-node` block and a later replacement block | Later rules effectively supersede much of the earlier styling; increases maintenance ambiguity | Consolidate when map-state fix is implemented | P2 |
| Historical Stage 1 docs/evidence | Multiple older Stage 1 reboot/rework/evidence files coexist with the current visual canon | Runtime is unaffected, but source-of-truth reading is noisy | Keep only when clearly marked historical, otherwise archive/remove after documentation audit | P2 |

---

## B. User-reported issues confirmed by implementation

### 1. Unavailable stage nodes can still look active

`src/run-modes.js` forces authored stages without active runtimes to status `planned`. In `styles.css`, `locked` nodes are grayscale/dimmed, while `planned` nodes retain a purple glow. Therefore Stage 02-06 can visually read as active stars even though they cannot be launched.

**Classification:** existing-state communication failure, not new content.

**Next fix:** define one explicit visual hierarchy for `available`, `cleared`, `locked`, and `planned`; unavailable nodes must be visibly subordinate to the current playable node.

### 2. Endless background planet can jump / follow movement

`src/realm-backgrounds.js::drawSpaceBackground()` positions the large ringed planet using player coordinates with wrapped offsets:

- X uses `wrap(player.x * .005, 90)`
- Y uses `wrap(player.y * .003, 55)`

This makes the screen-space planet move with the player and periodically discontinuously reset when the wrapped value crosses its modulus. The reported occasional jump is therefore supported by the current code.

**Classification:** shared background motion bug affecting Endless and stage backgrounds derived from Endless.

**Next fix:** choose one explicit semantic for the planet — fixed deep-space screen anchor or continuous low-rate parallax — and remove modulo discontinuities.

### 3. Stage 1 final boss silhouette is too close to the player language

The current final `drawOrbitWarden()` is dominated by a compact spherical core plus clean orbit rings and small satellites. The player also uses a compact circular/core-centered silhouette. The user's visual comparison is therefore consistent with the renderer structure.

The current stage boss is not yet derived from a formal shared boss/apex visual grammar; it is a stage-specific renderer layered over the Stage 1 runtime.

**Classification:** visual identity / hierarchy problem. Do not solve during the structural refactor.

**Next fix:** compare the final boss directly against native Endless regular-boss and Apex renderers, then redesign its silhouette while preserving Stage 1 skill identity.

### 4. Stage 1 projectile/pattern language is stage-local

`stage01-remodel.js` creates its own aimed fans, radial bursts, satellite volleys, lock beams, and cyan/purple projectile styling. Mechanically valid, but it was authored locally instead of through a shared visual/pattern vocabulary derived from existing Endless bosses/Apexes.

**Classification:** consistency problem, not a missing mechanic.

**Next fix:** after refactor, inventory existing Endless boss/Apex projectile/telegraph primitives and reuse them where appropriate; keep unique Stage 1 pattern logic only where it adds gameplay identity.

---

## C. Refactor completed in this pass

1. Added `STACKFALL_STAGE_RUNTIME_SCRIPTS` manifest in `src/run-modes.js`.
2. Replaced Stage-1-specific nested loader functions with a generic sequential authored-runtime loader.
3. Removed the third Stage 1 runtime patch layer (`src/stage01-world.js`).
4. Made `src/stage01-polish.js` the single owner of Stage 1's final `production.drawWorld()` behavior.
5. Updated build fingerprint dynamic assets to match the two-file runtime stack.
6. Updated run-mode contracts to enforce the centralized manifest and absence of the redundant world override.

No gameplay balance, boss design, map node visual state, or Endless background movement was intentionally changed in this pass.

---

## D. Next refactor order

### P0 — structural safety before more content

1. Verify the new runtime loader and final Stage 1 world owner through syntax/contracts/browser smoke/live deployment.
2. Add explicit source-ownership rules for authored-stage globals so future stages cannot silently wrap the same function.
3. Extract constellation background ownership out of Stage 1 into a shared module.

### P1 — shared systems before Stage 2

1. Shared stage-audio router instead of per-stage `audio.syncAmbient` wrappers.
2. Runtime-owned encounter form policy instead of wrapping `stackfallSpawnEliteForm`.
3. Runtime-owned boss movement/clamp policy instead of wrapping `stackfallClampStageBossToArena`.
4. Consolidate duplicated/superseded galaxy-map CSS during the status-state visual fix.

### P1 — then address the reported visible defects

1. Fix planned/locked node hierarchy.
2. Fix the ringed background planet's discontinuous movement in Endless/base space.
3. Rebuild Orbit Warden silhouette and projectile language by direct comparison with existing Endless regular bosses and Apexes.

### P2 — documentation/source cleanup

Audit old Stage 1 reboot/rework/evidence documents against the current canon. Historical evidence may remain only when its status is unambiguous; discarded designs must not read as current production truth.

---

## Stop conditions

Do not proceed to bulk Stage 2-18 implementation until:

- Stage 1 has one understandable runtime ownership chain.
- shared background behavior is stable in Endless first.
- map state communicates availability correctly.
- Stage 1 boss/projectile visuals are demonstrably distinct from the player and consistent with native Stackfall boss/Apex language.
- CI and live browser smoke remain green after refactoring.
