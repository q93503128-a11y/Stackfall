# Stackfall Refactor / Ownership Audit — 2026-10-17

## Current result

This cleanup removes the remaining Stage-specific compatibility debt that was provably unreachable under the active production runtime. It does not mass-delete active refinement/expansion modules merely because their filenames are historical.

### Canonical ownership

- `src/stage-catalog.js` now contains the actual Stage 1 Outer Route metadata, events, gimmick, and Orbit Warden identity. Stage 1 no longer rewrites the catalog or `stackfallStageById` at runtime.
- `src/stage-runtime.js` is generic stage orchestration. Historical Stage 1 arena/clamp/intro/victory code and inactive Stage 2 bespoke intro/victory state branches were removed.
- `src/stage01-remodel.js` registers Stage 1 directly. It no longer patches an obsolete embedded Stage 1 runtime and no longer overrides the removed arena clamp.
- `src/stage01-polish.js` remains the deliberate final Stage 1 presentation/hazard layer; it does not replace the stage catalog or global elite spawning.
- `src/stage-constellation-backgrounds.js` remains the constellation background owner, derived from Endless normal space.
- `src/stage-audio.js` remains the authored-stage audio router.

### Removed stale artifacts

Discarded Stage 1 reboot/rework/vertical-slice documents and their old capture bundle were removed. Their history remains available in Git and they no longer compete with the current visual canon.

### Intentionally retained

Files such as `combat-balance-refinement.js`, `community-feedback-refinement.js`, `reward-refinement.js`, `endgame-balance-expansion.js`, and similar modules are still active runtime code and/or covered by explicit contracts. Deleting them by filename would be unsafe. Future cleanup should migrate them domain-by-domain only when equivalent canonical ownership is established and validated.

### Second cleanup pass

The Stage 1 source-of-truth split, generic-runtime Stage 1/2 compatibility branches, obsolete arena/clamp ownership, discarded Stage 1 design documents, and obsolete Stage 1 evidence captures were removed in the second cleanup pass. Temporary cleanup workflows were also removed after producing the canonical commit.

### Stage background movement regression

A visual regression exposed by real Stage 1 movement was corrected after the cleanup. Authored stages no longer reuse the Endless decorative landmark layer that can read as screen-following during camera movement. Constellation decorations are now deterministic world-space anchors transformed through `worldToScreen`, while Endless keeps its own normal landmark layer. The previously demoted Stage world-anchor browser assertion was restored as a fatal smoke-test gate so this class of regression cannot silently pass again.

### Gate

Before Stage 2 implementation, syntax checks, all repository contracts, the build fingerprint, and live browser verification must remain green. No new Stage-specific compatibility branch should be added to the generic stage runtime when a stage-owned production hook can express the behavior instead.
