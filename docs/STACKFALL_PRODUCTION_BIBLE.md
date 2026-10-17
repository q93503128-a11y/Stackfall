# STACKFALL PRODUCTION BIBLE

2026-10-09 · Stage 1 vertical slice. Quality standard, not a Stage 1 cloning template.
Gameplay timing, balance, unlocks, rewards, encounter cadence and victory ownership remain canonical in GAME_DESIGN/WIKI/runtime. Stage 2–18 production redesign is gated on the user's Stage 1 playtest approval.

## Research and limits


Sources were inspected on 2026-10-09. The interpretations below are our design deductions, not claims made by their developers. Static screenshots establish composition, not timing; trailer observation is qualitative, not frame-measured. No source assets or recognizable enemy designs are copied into the game.

| Reference / evidence | Visual | Motion principle to adapt | Pattern principle | Space / gimmick principle |
| --- | --- | --- | --- | --- |
| [Undertale official battle images](https://undertale.com/about/) · reference-undertale.png | Huge value contrast; enemy attack imagery shares its character; extremely quiet background | Character pose must introduce action; rhythm matters more than detail count | Each enemy uses different bullet imagery/rules. Design each attack as a different player decision, then develop it | Battle boundary itself communicates the rule. Our changing passage must visibly match collision |
| [Cuphead official Cagney image](https://studiomdhr.com/press-kits/) · reference-cuphead.png | Saturated large enemy separated from subdued painted forest; outline is subordinate to recognizable filled silhouette | Broad pose changes, compression and extension should communicate intent. This is a proposed adaptation, not a measured animation analysis | Boss identity determines attack vocabulary; escalation changes behavior and anatomy | Platforms belong to the environment and structure movement; reuse our actual route hardware in combat |
| [Furi developer page](https://www.thegamebakers.com/furi/) / [developer-published Steam gallery and trailer](https://store.steampowered.com/app/423230/Furi/) · reference-furi.png | Bright threats against restrained fractured arena; broad empty floor gives trajectories room | Readable pause → committed burst → recovery; no elastic continuous tracking | Alternating close and distant pressure asks different positioning questions | Fractured terrain and attack rhythm share an arena; reserve a readable corridor, avoid constant overlapping incidents |
| [Hades official page](https://www.supergiantgames.com/games/hades/) / [developer-published combat gallery](https://store.steampowered.com/app/1145360/Hades/) · reference-hades.png | Solid shaded pillars and floor; combat accents are much brighter than scenery; details nest inside large shapes | Body participation and short local impact, not a screen-filling flash | Positioning around meaningful architecture makes the same attack change with context | Pillars have a spatial role. Our wrecks block paths, then release a route, rather than float beside the player |

## A. VISUAL BIBLE

- Explain form with lit planes, overlapping masses, occlusion and material. Never black fill + colored outline + glow as a universal style.
- Metal: broad cool reflected planes, narrow worn highlights, dark recesses, irregular paint wear. Ceramic: matte ochre armor caps. Reactor: contained amber interior emission. Later crystal/organic/void stages need distinct material solutions.
- Large/medium/small detail hierarchy: about 70/25/5 attention. A boss must read at 160px and as a black silhouette. Tiny bolts enrich surfaces; isolated tiny boxes do not enrich space.
- World hardware is fixed at world coordinates. Only distant nebula/stars/remote facilities may parallax. Large route strips, attached supports, torn decks and sparse wrecks leave ample open flight space.
- Warnings are low-opacity hatched/dashed prediction. Active threat is solid hardware with visible depth and shadow. No glowing warning converted into a generic beam.
- Use packaged transparent raster parts for production surfaces. Simulation geometry is a separate authority for hit/contact/sweep. Four sprites and two shaded shoulder connectors use six shared polygon poses. Every rendered part follows its simulation pose; no cosmetic stretch beyond its physical bounds.
- GPU and Canvas draw the same authored surfaces. Cache assets once; cull world pieces; do not replace art with debug polygons under load.

## B. MOTION BIBLE

- Every important action has readable preparation, a committed release and visible recovery. Durations and curves depend on material/action, not a copied six-phase curve.
- Heavy clamp: pistons draw inward, short cubic acceleration, contact pause, damped recoil, slow release. Salvage arm: hoist, aim lock, staggered throw, kickback, wreck settles. Ram: reverse weight shift, locked bearing, burst, overshoot/brake, arm lag. Girder: shoulder wind-back, accelerate through arc, recoil at end, return.
- Core phase opens the body: armor and arms separate; exposed reactor and expanded route are actual structural changes.
- Use bounded local debris, timed sound and 35–55ms hit-stop on major contact. Respect existing reduced effects/shake settings. The impacting object must remain visible. No full-screen flash as the primary effect.
- Simulation owns articulated poses. Per-frame movement uses dt; no X/Y-specific player pursuit and no shared soft-leash regression.

## C. BOSS PATTERN BIBLE

Each action specification must identify its player decision, preparation, spatial promise, committed damage interval and recovery. Different color/direction/count is not a new major pattern.

Stage 1: Collapse Warden is a damaged quarantine tug, once a route maintenance machine now enforcing a failed lockdown. Wedge chest, asymmetric hydraulic arms and an insulated reactor are one coherent machine. Its hardware matches the route.

| Action | Required decision | Tell / rhythm | Development |
| --- | --- | --- | --- |
| Salvage cast | Move away from locked landing sites, then choose a route around solid wreckage | Arm hoists; three staggered heavy throws; each settles | Phase 2 reuses wreckage as route pressure; bounded hold prevents permanent blockage |
| Bulkhead exchange | Cross the central passage before the gates redirect it; follow the changing exit | Both arms tension; doors accelerate, slam and hold, then retract | Phase 2 shifts the passage once; no stationary safe-hole solution |
| Breach ram | Bait bearing, move sideways after the direction locks; use recovery to approach | Chest leans back, arms fold; body commits to a straight thrust and brakes | Alternates rail anchor after recovery; no continuous tracking during launch |
| Girder reclaim (phase 2) | Choose inside hinge or outside reach; avoid the swept front | Broken arm winds back and sweeps a real support | Builds on the support/deck spatial language learned in the route |

Director keeps attacks separate and leaves breathing space. Opening is teachable, later patterns demand applying the same structural rules. Preserve 300s final entry, encounter reward ownership and existing damage scaling.

## D. STAGE GIMMICK BIBLE

- Environment must alter traversable space, not merely spawn a periodic damage circle. Introduction → variation → combination → boss reuse.
- Stage 1 route failure: at 45s an attached deck section tears free and settles into a temporary physical barricade. Later incidents use two offset pieces with the same bounded occupation and a connected bypass. The same deck, supports and shutter hardware reappear in the Warden battle.
- Readable chronology: launch checkpoint → power wakes after 45s → fractures after 135s → lockdown after 220s → remote gate approaches after 260s → quiet approach 280–300s → quarantine arena → breach opens route.
- Landmarks and deck incident origins are world anchored. Actual hazards retain bounded lifetime and existing six-object physical cap. Never trail the player with near-field decoration.
- Entrance assembles the guardian chest and hydraulic arms inside the sealed route. Defeat shuts reactor, drops arms and retracts quarantine doors, showing an open exit before result ownership records clear.
- Stage 1–5 normal production budget; 6 Shardway finale larger; 7–11 normal; 12 Abyssal Bloom finale larger; 13–17 normal; 18 highest finale budget. These are future principles only; no Stage 2–18 redesign in this change.

## Acceptance
