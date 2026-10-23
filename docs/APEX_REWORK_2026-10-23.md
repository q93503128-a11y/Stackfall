# Stackfall Apex Rework — 2026-10-23

## Goal
Current Apex encounters must stop sharing one generic warning-beam grammar. Each of the three current Apex entities needs a distinct silhouette, attack-reading language, movement rule, phase escalation, entrance and defeat identity.

The primary combat test is simple: a player who stands still through a representative Apex cycle must be hit. Visual spectacle that does not create a real movement decision is decoration, not a main attack.

## Shared combat rules
- **Idle threat:** every signature cycle contains at least one attack that intersects the player's current or recent position. No signature may become harmless because historical positions collapse to one point.
- **Readable response:** attacks should ask for a clear response: keep moving, cross a gap, leave a marked point, move perpendicular to a pressure row, or escape a local cage.
- **No generic beam default:** long warning lines are not the universal Apex telegraph. Lines are reserved for the Last Constellation's connection grammar or short spatial cuts where conceptually justified.
- **Phase layering:** later phases add a new decision on top of learned rules rather than only increasing projectile count or speed.
- **Body telegraph:** silhouette motion, opening plates, fragment displacement, node lighting and arena response should announce attacks before generic HUD effects do.
- **Spectacle is secondary:** particles, flashes and decorative projectiles cannot substitute for collision pressure.

## Atropos, Chronophage
### Visual identity
A time-damaged entity, not a clock.
- No clock face, hands, numerals, gear teeth or circular timepiece silhouette.
- The body is an asymmetric collection of fractured plates that occupy slightly different temporal offsets.
- Ghost fragments lag behind or appear slightly ahead of the main shell.
- The central cavity is a torn absence rather than a dial or eye.
- Arena boundary is an irregular broken fracture seam, not a ring of clock ticks.

### Movement
Atropos remains mobile and drifts around an offset orbit. Motion should feel discontinuous through visual lag rather than literal teleport spam.

### Attack grammar
1. **Temporal Scar Chase** — repeatedly marks the player's current position; each mark ruptures after a short delay. Standing still stacks danger on one point. Moving creates a readable trail to outrun.
2. **Deferred Memory** — marks current and recent positions with staggered circular ruptures. If recent positions collapse together, the present-position rupture still guarantees idle pressure.
3. **Shear Echo** — when the player has actually moved, short cuts form across the traveled vector; when movement is negligible, the attack falls back to a compact present-position rupture instead of a zero-length line.
4. **Terminal Compression** — phase 4 shortens mark spacing and overlaps old/new scars, forcing route changes without becoming an unreadable full-screen laser field.

### Phase escalation
- P1: present/recent position marks.
- P2: continuous scar chase added.
- P3: movement-path shear added.
- P4: compressed timing and overlapping delayed memories.

## Omega, the Last Starforge
### Visual identity
A huge stationary stellar catastrophe.
- Permanently anchored during the encounter.
- Significantly larger than normal bosses and the other Apex bodies.
- Irregular ruptured shell plates surround a white-hot internal furnace.
- The body should read as a massive celestial/industrial organism, not a rectangular machine or simple sun icon.
- Surface plates separate and expose hotter internal layers as phases rise.

### Movement
**None.** Omega does not chase, strafe or orbit. Its positional dominance comes from scale and arena control.

### Attack grammar
1. **Core Fall** — a primary impact zone locks onto the player's current/predicted position with secondary impacts around it. Standing still is always caught by the primary crater.
2. **Furnace Press** — a row or column of staggered impact zones crosses the player's position. The answer is perpendicular movement; the middle zone prevents idle safety.
3. **Corona Salvo** — a body-facing projectile fan combines with a targeted impact so simply sitting between radial bullets is not a solution.
4. **Tidal Furnace** — a persistent furnace field pulls toward Omega while adding periodic radial pressure and targeted impacts. It is the set-piece attack rather than a shared tracking beam.

### Phase escalation
- P1: Core Fall + Corona Salvo.
- P2: Tidal Furnace enters.
- P3: Furnace Press rows become denser and overlap with targeted impacts.
- P4: shorter intervals and alternating press axes; no movement is added to Omega itself.

## The Nameless Last Constellation
### Visual identity
A celestial body pretending to be one creature.
- Remove the black eye/oval centerpiece.
- Use a narrow angular central shard/body with detached asymmetric celestial fragments around it.
- Connection lines are mostly absent while idle and become visible when the entity attacks or reconfigures.
- The complete shape should only become legible in flashes, as though the constellation is temporarily remembering its own anatomy.

### Movement
Fast orbital displacement and authored teleports remain part of its identity.

### Attack grammar
1. **Local Constellation Cage** — nodes form around the player's snapshot and connect into a local cage. At least one connection crosses the snapshot so standing still fails.
2. **Node Volley** — detached nodes fire converging volleys toward the captured position. Movement after the telegraph is the answer.
3. **Reconfiguration** — the body relocates after a lattice attack, changing attack origin rather than merely drawing another arena-wide beam.
4. **Collapse Network** — later phases add more nodes and a second crossing connection, but retain visible gaps and readable timing.

Connection lines are allowed here because they are the entity's actual anatomy/attack language, not a generic warning laser reused by all Apexes.

## Entrance / phase / defeat direction
- **Atropos:** fragments arrive out of temporal order, then briefly agree on one body. Defeat reverses this: fragments desynchronize and fail to meet again.
- **Omega:** large shell masses close around a furnace during entrance. Each phase exposes more core. Defeat is a furnace collapse/implosion, not a generic fade.
- **Nameless:** isolated fragments appear first; connections flash only once the form is nearly complete. Defeat severs the network and leaves fragments drifting apart.

## Validation gates
- Spawn each Apex through developer controls.
- Test phases 1–4 separately.
- For each signature/set-piece, perform an **idle test**: do not move and confirm the attack can hit.
- Perform a **readability test**: move according to the intended response and confirm a reliable escape exists.
- Confirm Omega remains positionally fixed throughout the encounter.
- Confirm Atropos has no clock/gear/hand visual motifs.
- Confirm Nameless has no central eye/oval body.
- Capture screenshots of entrance, normal body, phase transition and dense-combat state for each Apex.
- Run JS syntax, Apex contract, full Validate Stackfall and live Chrome smoke after implementation.
