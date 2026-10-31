# Stackfall Documentation Index

This index prevents old design and audit files from silently becoming runtime authority again.

## Status meanings

- **CURRENT** — describes the active product/runtime and is maintained as a current source of truth.
- **REFERENCE** — useful domain/design documentation, but verify against `CURRENT_STATE.md` and current source before changing runtime behavior.
- **HISTORICAL** — point-in-time audit or superseded design snapshot. Never restore behavior solely because it appears here.
- **DORMANT** — design/source material for a system that is intentionally not active in the current runtime.

## Precedence

`executing source + passing contracts` → `CURRENT_STATE.md` → `REFERENCE` docs → `HISTORICAL/DORMANT` docs.

## Registry

| Document | Status | Role |
| --- | --- | --- |
| `CURRENT_STATE.md` | **CURRENT** | Short active-runtime canon and architecture/design invariants. |
| `GAME_DESIGN.md` | **REFERENCE** | Long-form design and implementation contract; still contains dormant Stage-era material and is being synchronized incrementally. |
| `WIKI.md` | **REFERENCE** | Player-facing reference; only current where it agrees with active runtime/current state. |
| `SOUND_DESIGN_CANON_2026-10-17.md` | **REFERENCE** | Sound-domain direction; verify scene/runtime details against `runtime-config.js`. |
| `DEPLOYMENT_AUDIT.md` | **REFERENCE** | Deployment fingerprint/verification note. |
| `RUNTIME_ARCHITECTURE_AUDIT_2026-10-31.md` | **HISTORICAL** | Source-level architecture audit taken during the 2026-10-31 cleanup. |
| `REFACTOR_AUDIT_2026-10-17.md` | **HISTORICAL** | Earlier ownership/refactor snapshot. |
| `APEX_REWORK_2026-10-23.md` | **HISTORICAL** | Apex redesign snapshot; current Apex source supersedes stale details. |
| `CANONICAL_AUDIT_2026-09-28.md` | **HISTORICAL** | Earlier canonical audit; not current runtime authority. |
| `AWAKENING_RENDER_AUDIT.md` | **HISTORICAL** | Earlier awakening/render audit snapshot. |
| `STACKFALL_PRODUCTION_BIBLE.md` | **DORMANT** | Stage-production reference while Stage gameplay is sealed. |
| `STAGE_VISUAL_CANON_2026-10-16.md` | **DORMANT** | Stage visual direction for future Stage work; not active runtime status. |

`awakening-audit-results.json` is audit evidence, not a design authority.
