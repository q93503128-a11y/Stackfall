# Stackfall Current Runtime State

**Status: CURRENT RUNTIME CANON**
**Snapshot date: 2026-10-31**

This file is the short, current-state entry point for Stackfall. When an older design document, audit, comment, or test disagrees with the executing production source, investigate the current source first and update the stale document or contract rather than restoring old behavior by default.

## Authority order

1. Executing production source and passing runtime/contracts.
2. `docs/CURRENT_STATE.md` for the current product/runtime snapshot.
3. Domain documents that `docs/INDEX.md` marks as `REFERENCE`.
4. Date-stamped audits and superseded design snapshots marked `HISTORICAL`.

A historical document is evidence of an earlier decision, not permission to re-enable an old system.

## Active game mode

- **Endless is the only active gameplay mode.**
- Stage source, catalog data, map UI, and production references remain in the repository, but **Stage gameplay is currently sealed** and has no active runtime selection.
- Endless is non-finite, uses all enabled enemy families, and schedules an Apex encounter every 600 seconds of game time.

## Endless world events

The active random world-event set is **exactly three events**:

1. **성운 보관소 / Nebula Vault**
2. **추락한 우주선 / Crashed Starship**
3. **공허 균열 / Void Rift**

The retired field-event experiment (`distress`, `meteor`, `predator`, `relay`, `storm`) is not part of the active Endless event owner and must not be reintroduced by a compatibility layer, old document, or regression test.

Current first-event clocks are Vault 42 s, Crash 118 s, and Void Rift 320 s. Events use independent recurrence clocks plus a shared 58 s anti-stack gap, and the same event type cannot immediately repeat.

### Crashed Starship

- Runs its own event waves and scaling.
- Every third Crash sequence can use the dedicated **Quarantine Dreadnought / 격리함 파멸자** encounter.
- The Dreadnought owns a dedicated combat controller. It is not a skin over a shared regular-boss attack table.

### Void Rift

- Enters a dedicated Void realm and uses a 108 s boss timer.
- Current boss pool: `maw`, `oracle`, `weaver`, `grave`, `paradox`.
- Selection uses a shuffled bag. Every form is consumed before the bag refills, and refill logic avoids an immediate repeat of the previous form.
- The current five Void bosses are an interim tier and require a later combat/animation identity pass; they must not be flattened into a generic boss pattern table.
- **Planned, not implemented:** Void Rift will later receive a separate Apex-class boss encounter/tier. Do not implement it until its design is explicitly defined.

## Boss-domain design invariant

Boss domains may share low-level combat primitives such as projectile creation, telegraph geometry, collision helpers, delayed actions, and common damage plumbing.

They **must not** share one high-level attack rotation/table that makes encounter families behave as renamed variants of the same boss. High-level movement, animation telegraphs, phase sequencing, cooldown logic, and signature attacks belong to the encounter domain or individual boss.

Current domains are:

- Regular bosses
- Minibosses
- Void Rift bosses
- Crashed Starship / Dreadnought
- Apex encounters

The current regular and Void implementations still have some similar `skillCd / burstCd / pulseCd` skeletons. Treat that as debt to remove during their combat redesign, not as the desired architecture.

## Boss pools

- Regular: `eclipse`, `seraph`, `pulsar`, `leviathan`, `archivist`, `heliarch`, `tempest`, `nullengine`
- Miniboss: `knight`, `warden`, `executioner`, `colossus`, `harvester`, `mirror`
- Void Rift: `maw`, `oracle`, `weaver`, `grave`, `paradox`
- Apex: `chronophage` (Atropos), `starforge` (Omega), `lastconstellation` (The Nameless Last Constellation)

## Experience and field pickups

### Experience Gems

- Unclaimed XP value does not expire with time.
- Gem object count may be compressed under pressure, but aggregate unclaimed XP value must be conserved.

### 자석 코어 / Magnet Core

- Persistent passive.
- Increases ordinary experience-gem attraction range/speed.

### 흡입 자석 / Suction Magnet

- Separate physical one-shot field pickup.
- On collection, only Experience Gems that already exist at that moment are marked for forced attraction.
- Those gems visibly travel to the player and use the normal XP collection pipeline.
- Gems created after activation are unaffected.
- Current drops: **50% from minibosses, 100% from regular bosses**.
- Ordinary enemies do not drop it.
- Event bosses and Apex encounters are not routed through the generic field-pickup drop rule; encounter-specific reward/drop behavior must be authored in their own completion flow.

## Runtime ownership direction

The main architectural cleanup target is **late global function replacement**. New work must not add another `*-fix.js`, `*-refinement.js`, or load-order patch whose primary purpose is to replace a canonical global after the fact.

Preferred direction:

- one canonical owner for state-changing paths;
- explicit service/hook calls for optional systems;
- atomic mode transitions;
- dynamic loading only where it represents a real optional subsystem, not a hidden override chain;
- regression contracts for ownership boundaries that have already been cleaned.

Already cleaned boundaries include Experience Gem lifetime/value conservation, field-pickup ownership, Enemy Director core integration, Last Constellation final death routing, and the canonical three-event Endless owner.

## Documentation rule

Read `docs/INDEX.md` before treating a large historical document as current product truth. Date-stamped audits are snapshots. `GAME_DESIGN.md` and `WIKI.md` contain useful long-form design/reference material but are being synchronized incrementally and must not override this current-state snapshot or executing source when they conflict.
