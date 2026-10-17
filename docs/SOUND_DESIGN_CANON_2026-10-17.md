# Stackfall sound design canon — 2026-10-17

## Runtime ownership

Stackfall music is authored and rendered by the Web Audio music engine in `src/runtime-config.js`. Runtime BGM must not depend on third-party hosted MP3/OGG files or a second HTMLAudio router.

## Musical identity

Normal play has exactly four score identities:

1. `endless` — neutral deep-space expedition.
2. `constellation1` — Shardway / cyan-violet forward motion.
3. `constellation2` — Abyssal Bloom / magenta-teal organic syncopation.
4. `constellation3` — Silent Array / teal-amber machine pulse.

World events use stingers, sound effects, and texture changes. They do not replace these four normal scores with an unrelated fifth song.

Every Apex owns a distinct score. Current canonical scenes are `apex-warden`, `apex-chronophage`, `apex-starforge`, and `apex-lastconstellation`. A new Apex must receive its own musical scene rather than inheriting a generic boss loop.

All score identities may transform a small Stackfall interval motif. The motif is a branding device, not a melody to copy verbatim into every cue. Change rhythm, register, harmony, fragmentation, orchestration, and density to fit the encounter.

## Adaptive rules

- Apex music begins during anticipation/entry, before the entity becomes fully actionable.
- Apex phase changes increase arrangement density; they do not simply raise volume.
- Music remains below combat transients. Apex signatures and defeat stingers may briefly duck the music bus.
- SFX with gameplay meaning (warnings, impacts, phase changes, signature attacks) take priority over decorative ambience.
- Stage clear uses a short authored stinger rather than an unrelated full victory track.

## Stage 1 Apex

Orbit Warden is the first Apex, not a regular boss. It uses detached orbital anchors and the `Orbit Dominion` set-piece: rotating anchor beams temporarily redefine safe movement space. Its complexity stays below late Apex encounters, but its silhouette, entry, score, and battlefield authority must clearly belong to the Apex class.

## Research basis

The direction follows established game-audio practice: memorable themes/motifs create musical identity; variation and fragmentation extend a theme across contexts; adaptive music should manipulate melody/harmony/rhythm/form rather than treating implementation as a playlist switch; boss anticipation should begin musically before the event; and nonlinear mixes require level/spectral priority so critical SFX remain readable.

References:
- GDC 2020, Winifred Phillips — *From Assassin's Creed to The Dark Eye: The Importance of Themes*.
- GDC 2010, Clint Bajakian — *Adaptive Music: The Secret Lies Within Music Itself*.
- GDC 2016, Paul Lipson / Robert Ridihalgh — *Precognitive Interactive Music: Yes You Can!*.
- Game Developer — *An Examination of Leitmotifs and Their Use to Shape Narrative in UNDERTALE*.
- PC Gamer — *The making of Undertale*.
- Game Developer Magazine — *Managing the Nonlinear Mix*.
