# Stackfall Refactor / Ownership Audit — 2026-10-17

## Scope

This pass follows the current production-review rule: inspect the actual implementation first, avoid adding content for its own sake, and prioritize cases where existing gameplay is weakened by unclear ownership, duplicate overrides, state/visual mismatches, or inconsistent presentation.

Current visual canon remains `docs/STAGE_VISUAL_CANON_2026-10-16.md`: Endless is the normal-space visual baseline; authored stages vary at constellation level rather than using bespoke story backdrops.

---

## A. Source-ownership result

| Target | Previous problem | Final decision / owner |
|---|---|---|
| Authored runtime loading | Stage 1 had a bespoke nested patch-loader chain | `src/run-modes.js` owns one shared runtime manifest and loads common stage services before active stage scripts |
| Constellation backgrounds | Stage 1 itself replaced global stage-background functions | `src/stage-constellation-backgrounds.js` owns constellation tint/decorations and derives the base from Endless `drawSpaceBackground()` |
| Stage audio | Stage 1 wrapped `audio.syncAmbient` and owned a private timer/fader | `src/stage-audio.js` owns one registry/router for authored-stage ambient/boss/victory music |
| Stage 1 final presentation | Multiple Stage 1 files replaced `production.drawWorld` / boss presentation | `src/stage01-polish.js` is the final Stage 1 presentation/hazard owner; `stage01-world.js` remains removed |
| Elite encounters | Stage 1 globally wrapped `stackfallSpawnEliteForm` | Global remap removed; authored encounters now retain the native Endless elite forms chosen by the stage runtime |
| Final-boss projectiles | Stage-local strings were accidentally passed as projectile visual IDs and fell back to generic orbs | Stage 1 maps attacks to the existing canonical projectile families (`constellation`, `rune`, `needle`, `ranged-bolt`, `debris`) |
| Galaxy planned-node state | `planned` nodes still emitted a purple stellar glow | `stage-runtime.css` makes unavailable/planned nodes grayscale, low-luminance, and non-pulsing |
| Shared ringed planet | Screen-space planet used wrapped player offsets and periodically jumped | Shared background service keeps the distant planet at a stable screen anchor while retaining subtle nebula/star parallax |
| Build/deployment fingerprint | Dynamic runtime assets were only partly represented | Build fingerprint now includes the shared stage runtime CSS, shared background/audio modules, and active Stage 1 runtime layers |

---

## B. User-reported defects and resolution

### 1. Unavailable Stage 02-06 nodes looked active

**Cause:** runtime-gated stages resolve to `planned`, while the existing late CSS rule intentionally kept `planned` stars luminous.

**Resolution:** `stage-runtime.css` gives `planned` nodes the same unavailable-state hierarchy as locked content: grayscale, reduced brightness/opacity, no stellar pulse, subdued number badge. The currently playable node remains the clear luminous focal point.

### 2. Endless/base-space ringed planet followed the player and occasionally jumped

**Cause:** the planet used `wrap(player.x * .005, 90)` / `wrap(player.y * .003, 55)`, so its offset discontinuously reset at the modulo boundary.

**Resolution:** the planet is now a fixed deep-background landmark at a stable screen anchor. Endless remains the visual source of truth; nebula/stars still retain their low-rate parallax so movement is not flattened.

### 3. Stage 1 final boss resembled the player

**Cause:** the old Orbit Warden was a compact circular core surrounded by clean concentric orbit rings/satellites, too close to the player's core-centered silhouette.

**Resolution:** `src/stage01-polish.js` now owns a larger non-circular boss silhouette: dark asymmetric armour blades, offset counter-blades, crown/keel fins, partial magenta/cyan rails, a void-diamond center, and phase-dependent satellites/arc segments. The center is deliberately not a white/blue circular player core.

### 4. Stage 1 boss attacks/projectiles looked unlike native Stackfall elites

**Cause:** Stage 1 passed strings such as `stage01-warden-ring` as the projectile `visual` parameter. Those values were not renderer families, so the renderer fell back to the generic orb path. Stage 1 also globally remapped native elite forms.

**Resolution:** Stage 1 attacks now use existing enemy projectile families and the global elite remap is removed. The boss keeps its own attack choreography, but its visible projectile grammar comes from the same renderer vocabulary as Endless bosses/Apex encounters.

---

## C. Refactor completed

1. Centralized authored-runtime loading in `src/run-modes.js`.
2. Added shared constellation background module and made Endless normal space its base.
3. Added shared authored-stage audio router.
4. Removed the redundant `src/stage01-world.js` layer.
5. Removed Stage 1's global `stackfallSpawnEliteForm` remap.
6. Reduced Stage 1 presentation ownership to the base remodel plus one final polish owner.
7. Added canonical projectile-family routing for Stage 1 enemy/boss attacks.
8. Rebuilt Orbit Warden so its silhouette is clearly boss-scale and non-player-like.
9. Stabilized the shared ringed planet in both Endless and stage-derived normal space.
10. Added explicit dim styling for runtime-unavailable/planned stage nodes.
11. Expanded runtime/boss contracts to enforce the new ownership model.
12. Expanded the build fingerprint to include all shared dynamic stage assets.

---

## D. Remaining non-blocking legacy debt

The generic `stage-runtime.js` still contains historical Stage-1 arena helper code that predates the current production-based boss intro. Current Stage 1 presentation explicitly does not use that arena as a visual identity or confinement system, and the active runtime bypasses the old clamp. This is maintenance debt rather than a current player-visible defect; removing it should be done together with the future generic boss-spawn policy instead of risking a broad runtime regression during this visual/refactor pass.

Historical Stage 1 reboot/rework/evidence documents also remain in the repository. They do not execute at runtime; a later documentation-only archive pass can reduce source-of-truth noise.

---

## Gate before Stage 2 bulk work

The requested gate is now:

- Endless-derived shared background ownership exists.
- Stage audio has one shared router.
- unavailable map nodes have an explicit subordinate visual state.
- the ringed planet no longer wraps/jumps with player coordinates.
- Stage 1 no longer globally remaps native Endless elite forms.
- Orbit Warden is visually distinct from the player and uses canonical hostile projectile renderer families.
- Stage 1 final presentation has one final owner.
- syntax/contracts/live browser deployment checks must remain green on the final main commit.
