import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const combat=read('src/combat-integrity-v1.js');
const pressure=read('src/endless-pressure-rewards-v1.js');
const body=read('src/boss-body-parts.js');
const crash=read('src/map-event-expansion.js');
const index=read('index.html');
const awakeningA1A7=read('src/weapon-awakening-effects-a1-a7.js');

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
  ['combat integrity loads before awakening effect wrappers',index.indexOf('src/weapon-awakening.js')<index.indexOf('src/combat-integrity-v1.js')&&index.indexOf('src/combat-integrity-v1.js')<index.indexOf('src/weapon-awakening-effects-a1-a7.js')&&!body.includes('loadRuntimeIntegrityLayers')],
  ['arc awakening remains the final boomerang update owner',/const baseUpdateBoomerangs=updateBoomerangs/.test(awakeningA1A7)&&/updateBoomerangs=function lunarReturnUpdate/.test(awakeningA1A7)],
  ['endless pressure loads after multipart target ownership',index.indexOf('src/endless-pressure-rewards-v1.js')>index.indexOf('src/boss-body-parts.js')],
  ['desktop enemy ceiling is raised but bounded',/DESKTOP_ENEMY_CAP=168/.test(pressure)&&/DESKTOP_NORMAL_TARGET_CAP=156/.test(pressure)],
  ['compact enemy cap remains on canonical base path',/kind==='enemies'.*!compactDevice\(\)/.test(pressure)&&/return baseEntityCap\(kind\)/.test(pressure)],
  ['late pressure remains time gated',/time<900/.test(pressure)&&/time<1200/.test(pressure)],
  ['dreadnought keeps normal boss reward suppression',/eventVariant:'dreadnought'/.test(crash)&&/noEliteReward:true/.test(crash)],
  ['dreadnought grants one fixed core shard after successful salvage transition',/stackfallGrantCurrency\?\.\('coreShard',1\)/.test(pressure)&&/state\.mode==='worldEvent'/.test(pressure)],
  ['dreadnought reward stays idempotent across nested runtime wrappers',/completionReady&&!event\.__dreadnoughtBonusGranted&&state\.mapEventActive!==event/.test(pressure)&&/event\.__dreadnoughtBonusGranted=true;\s*grantDreadnoughtBonus\(\)/.test(pressure)],
  ['dreadnought salvage grants all three displayed rewards',/function openSalvage\(takeAll=false\)/.test(crash)&&/const takeAllAction=/.test(crash)&&/openSalvage\(ev\.dreadnought===true\)/.test(crash)],
  ['dreadnought salvage keeps canonical cards and one collect-all CTA',/world-event-card world-event-display/.test(crash)&&/world-event-collect-all\{position:relative;/.test(crash)&&/openCards\(tx\('salvage'\),prompt,cards,'DREADNOUGHT SALVAGE','crash',null,takeAllAction\)/.test(crash)],
  ['dreadnought display cards are non-interactive',/world-event-card\.world-event-display\{cursor:default;pointer-events:none\}/.test(crash)],
  ['dreadnought preview hides empty choice timer',/world-event-timer:empty\{display:none\}/.test(crash)],
  ['late desktop pressure continues above the old 124 target',/DESKTOP_NORMAL_TARGET_CAP=156/.test(pressure)&&/\(time-1200\)\/150/.test(pressure)],
];

let failed=0;
for(const[name,ok]of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed){console.error(`Combat integrity contract failed: ${failed}/${checks.length}`);process.exit(1);}
console.log(`Combat integrity contract passed: ${checks.length}/${checks.length}`);
