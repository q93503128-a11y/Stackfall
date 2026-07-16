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
  ['thumbnail metadata',read('index.html').includes('summ.png')]
];
const failed=checks.filter(([,ok])=>!ok);for(const [name,ok]of checks)console.log(ok?'PASS':'FAIL',name);if(failed.length)process.exit(1);
