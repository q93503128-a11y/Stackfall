# Stage 1 rework note

Stage 1 is being used as the production vertical slice for the 18-stage rebuild.

Current runtime presentation:

- Stage: `폐쇄선 / Lockline`
- Stage 1 apex display name: `K-03 폐쇄기 / Lockframe K-03`
- Legacy ids such as `collapse-warden` and `warden-*` remain compatibility-only implementation ids and are not visual/world canon.

Current rework goals:

- Remove the route-proximity frame spike caused by repeatedly drawing large route SVG surfaces near the player.
- Replace the single solid road with a sparse multi-corridor transport-control environment: a primary navigation corridor, damaged cargo corridor, closed service corridor, sparse junctions, gates and beacons.
- Treat the corridor as a navigation/traffic-control system in space, not as an asphalt-like literal road.
- Rebuild the Stage 1 apex combat around distinct player decisions rather than recolored geometric attacks.
- Preserve the improved body anticipation, recoil and physical impact language from the first production-art pass.
- Deliver story only through environment, damage states, transitions and boss behavior; do not add explanatory lore text.

Stage 1 v2 combat grammar:

1. Lane closure: two of three traffic lanes are sealed and the player reads the remaining route.
2. Cargo tow: heavy cargo/debris is pulled across the bay with staggered timing.
3. Moving compression: vertical gate slabs close with an offset moving passage.
4. Switchyard reroute: rotating infrastructure arms invalidate the current route and force a side change.
5. Committed ram: long readable wind-up, projected charge lane, mass acceleration, impact and recoil.

Phase 2 changes the traffic-control rules instead of only increasing speed. The switchyard attack enters the sequence, safe lanes become less accommodating, cargo paths cross more aggressively, and the arena opens slightly as the damaged lockline loses control.

## Browser audit result

Focused Stage 1 v2 desktop GPU and mobile Canvas audits passed with zero runtime errors.

Route-proximity draw samples after the corridor rebuild:

- Desktop GPU, near primary corridor: p50 about 0.4 ms, p95 about 1.4 ms, observed max about 8.1 ms.
- Desktop GPU, between corridors: p95 about 2.5 ms.
- Mobile Canvas, near primary corridor: p50 about 0.3 ms, p95 about 0.8 ms, observed max about 3.3 ms.
- Mobile Canvas, between corridors: p95 about 0.8 ms.
- Authored Stage 1 corridor sprite budget during the focused sample stayed at 4 desktop / 3 mobile draws.

These are focused Stage 1 background draw samples, not whole-run FPS guarantees.

Implementation is isolated to `src/stage01-rework-v2.js`; rebooted runtime names are applied by `src/stage-world-reboot-metadata.js`. Stage 2+ combat behavior remains untouched until its own rebuild pass.
