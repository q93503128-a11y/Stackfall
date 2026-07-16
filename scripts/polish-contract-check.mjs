import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const checks=[
  ['ledger pauses',read('src/ability-ledger-audit.js').includes("resumeAfterLedger=!wasPaused;state.mode='paused'")],
  ['copy chance starts at zero',read('src/weapons.js').includes('Math.min(.60,n*.075)')],
  ['nova suppresses routine shake',read('src/weapons.js').includes("source,{shake:false}")],
  ['damage numbers are deterministic',read('src/systems-base.js').includes('damageNumbers!==false&&(!stressed||crit||elite)')],
  ['enemy shots face velocity',read('src/bosses.js').includes('Math.atan2(p.vy,p.vx)+Math.PI/2')],
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
['site manifest',read('index.html').includes('site.webmanifest')]
];
const failed=checks.filter(([,ok])=>!ok);for(const [name,ok]of checks)console.log(ok?'PASS':'FAIL',name);if(failed.length)process.exit(1);
