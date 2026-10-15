# Stage 1 rework note

Stage 1 is being used as the production vertical slice for the 18-stage rebuild.

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

Implementation is isolated to `src/stage01-rework-v2.js` and late-bound so Stage 2+ behavior remains untouched.
