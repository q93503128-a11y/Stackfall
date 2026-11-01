import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const combat=read('src/combat-integrity-v1.js');
const pressure=read('src/endless-pressure-rewards-v1.js');
const body=read('src/boss-body-parts.js');
const crash=read('src/map-event-expansion.js');

const checks=[
  ['multipart surface resolver exposed',/stackfallResolveWeaponTargetSurface=resolveSurface/.test(combat)],
  ['manual targeting resolves active multipart surfaces',/manualSurfaceTarget/.test(combat)&&/activeParts\(owner\)/.test(combat)],
  ['arc farthest targeting uses surfaces',/key==='arc'\)return farthestSurfaceTarget/.test(combat)],
  ['rail boss priority uses target surfaces',/nearestBossSurfaceInRailRange/.test(combat)&&/integrityBossPriorityRailgun/.test(combat)],
  ['missile target list uses target surfaces',/integrityPostRosterTargetList/.test(combat)&&/resolveSurface\(owner,player\.x,player\.y,range\)/.test(combat)],
  ['orbital gate install uses target surfaces',/integrityGateInstallTarget/.test(combat)],
  ['boomerang firing no longer FIFO-trims active attacks',/integrityBoomerang/.test(combat)&&!combat.includes('trimOldest(state.entities.curves')],
  ['boomerang update no longer FIFO-trims active attacks',/integrityBoomerangLifecycle/.test(combat)&&/compactInPlace\(curves,keepLiveBoomerang\);/.test(combat)],
  ['duplicate kill side effects are blocked',/if\(!enemy\|\|enemy\.dead\)return;\s*return baseKillEnemy/.test(combat)],
  ['runtime layers load after multipart owner',body.indexOf("src/combat-integrity-v1.js")>body.indexOf('stackfallSharedEnemyScalePulseDisabled')&&body.indexOf("src/endless-pressure-rewards-v1.js")>body.indexOf("src/combat-integrity-v1.js")],
  ['desktop enemy ceiling is raised but bounded',/DESKTOP_ENEMY_CAP=136/.test(pressure)&&/DESKTOP_NORMAL_TARGET_CAP=124/.test(pressure)],
  ['compact enemy cap remains on canonical base path',/kind==='enemies'.*!compactDevice\(\)/.test(pressure)&&/return baseEntityCap\(kind\)/.test(pressure)],
  ['late pressure remains time gated',/time<900/.test(pressure)&&/time<1200/.test(pressure)],
  ['dreadnought keeps normal boss reward suppression',/eventVariant:'dreadnought'/.test(crash)&&/noEliteReward:true/.test(crash)],
  ['dreadnought grants one fixed core shard after successful salvage transition',/stackfallGrantCurrency\?\.\('coreShard',1\)/.test(pressure)&&/state\.mode==='worldEvent'/.test(pressure)],
  ['dreadnought reward stays idempotent across nested runtime wrappers',/completionReady&&!event\.__dreadnoughtBonusGranted&&state\.mapEventActive!==event/.test(pressure)&&/event\.__dreadnoughtBonusGranted=true;\s*grantDreadnoughtBonus\(\)/.test(pressure)],
];

let failed=0;
for(const[name,ok]of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed){console.error(`Combat integrity contract failed: ${failed}/${checks.length}`);process.exit(1);}
console.log(`Combat integrity contract passed: ${checks.length}/${checks.length}`);
