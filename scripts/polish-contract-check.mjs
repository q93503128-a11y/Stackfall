import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const checks=[
  ['ledger pauses',read('src/ability-ledger-audit.js').includes("resumeAfterLedger=originMode==='playing'")&&read('src/ability-ledger-audit.js').includes("state.mode='paused'")],
  ['copy chance starts at zero',read('src/weapons.js').includes('Math.min(.60,n*.075)')],
  ['nova suppresses routine shake',read('src/weapons.js').includes("source,{shake:false}")],
  ['damage numbers are deterministic',read('src/systems-base.js').includes('damageNumbers!==false&&(!stressed||crit||elite)')],
  ['enemy shots face velocity',read('src/bosses.js').includes('p.phase=p.heading')&&!read('src/bosses.js').includes('p.phase=Math.atan2(p.vy,p.vx)+Math.PI/2')],
  ['apex terminal frenzy',read('src/boss-patterns.js').includes('e.apexElapsed>=240')],
  ['singularity distortion',read('src/reward-refinement.js').includes("kind==='trait-singularity'")],
  ['random upgrade notice',read('src/map-event-expansion.js').includes('showUpgradeNotice')],
  ['thumbnail metadata',read('index.html').includes('summ.png')],
['apex bundle reward screen',read('src/reward-refinement.js').includes('id="apexRewardConfirmBtn"')],
['apex bundle confirm',read('src/reward-refinement.js').includes("confirm.querySelector('span').textContent='모두 받기'")],
['apex passive stacks',read('src/reward-refinement.js').includes('planApexPassiveRewards(3)')],
['apex body reconstruction',read('src/reward-refinement.js').includes('Math.round(player.maxHp*1.12)')],
['bulwark attached spikes',read('src/render-space.js').includes('const spikes=bulwarkN>=6?18:bulwarkN>=5?15:12')],
['no detached bulwark orbit',!read('src/render-entities.js').includes("orbitRadiusFor('bulwark')")],
['browser favicon',read('index.html').includes('favicon.svg?v=3')],
['site manifest',read('index.html').includes('site.webmanifest')],
['difficulty selector module',read('index.html').includes('difficulty-augment-expansion.js')&&read('src/difficulty-augment-expansion.js').includes("normal:Object.freeze({key:'normal'")],
['level choice ledger access',read('src/ability-ledger-audit.js').includes("['playing','paused','choice']")&&read('src/ability-ledger-audit.js').includes('restoreChoice')],
['reduced ranged spawn chance',read('src/systems-base.js').includes('clamp((t-55)/650,0,.13)')],
['ion chain distance buff',read('src/weapons.js').includes('range=190+ionN*26')],
['random reward notice extended',read('src/map-event-expansion.js').includes('scheduleUiAction(4900')&&read('src/reward-refinement.js').includes('scheduleUiAction(4800')],
['all weapon augment definitions',read('src/reward-refinement.js').includes('window.stackfallWeaponAugmentDefs=Object.freeze(augmentDefs)')&&['ion','nova','drone','rail','spiral','mirror'].every(key=>read('src/reward-refinement.js').includes(`${key}:{icon:`))],
['arc ricochet source tags',read('src/systems.js').includes("p.ricochet?'arc-ricochet':'arc'")],
['elite labels live only in top HUD',!read('src/build-audit-ui.js').includes('drawEliteMarkers')&&!read('src/performance-guard.js').includes('drawEliteEdgeIndicator')&&read('src/combat-balance-refinement.js').includes('bossHudType')],
['enemy shot swept collision',read('src/bosses.js').includes('relativeProjectileSweepHitsPlayer')],
['enemy shot visual families',read('src/boss-catalog.js').includes('enemyProjectileVisualFor')&&read('src/render-entities.js').includes("kind==='constellation'")&&read('src/render-entities.js').includes("kind==='void'")],
['enemy shots use cached bullet renderer',read('src/performance-guard.js').includes('cachedEnemyProjectiles')&&read('src/performance-guard.js').includes('drawCachedProjectiles(state.entities.enemyProjectiles,true)')&&!read('src/performance-guard.js').includes('styledEnemyProjectiles')]
];
const failed=checks.filter(([,ok])=>!ok);for(const [name,ok]of checks)console.log(ok?'PASS':'FAIL',name);if(failed.length)process.exit(1);
