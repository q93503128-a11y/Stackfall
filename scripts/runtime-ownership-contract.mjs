import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const director=read('src/enemy-director-v1.js');
const systems=read('src/systems.js');
const base=read('src/systems-base.js');
const bosses=read('src/bosses.js');
const render=read('src/render.js');
const targeting=read('src/targeting-motion-refinement.js');
const constellation=read('src/last-constellation-production-v1.js');
const rewards=read('src/reward-refinement.js');
const index=read('index.html');
const bossParts=read('src/boss-body-parts.js');
const constellationReset=read('src/last-constellation-reset-v1.js');
const buildFingerprint=read('scripts/build-fingerprint.mjs');
const checks=[];
const expect=(name,ok)=>checks.push([name,Boolean(ok)]);
const replaces=(text,name)=>new RegExp(`\\b${name}\\s*=\\s*function\\b`).test(text);

expect('Enemy Director exposes a service instead of replacing core update/death functions',director.includes('window.stackfallEnemyDirectorV1=service')&&!['updateSpawning','updateEnemies','killEnemy'].some(name=>replaces(director,name)));
expect('canonical spawning owns Director delegation',systems.includes('function updateSpawning(dt)')&&systems.includes('stackfallEnemyDirectorV1?.updateSpawning?.(dt)===true')&&!replaces(render,'updateSpawning'));
expect('canonical enemy update owns Director movement/action integration',bosses.includes('function updateEnemies(dt)')&&bosses.includes('enemyDirector?.movementSpeed')&&bosses.includes('enemyDirector?.suppressGenericRanged?.(e)')&&bosses.includes('stackfallEnemyDirectorV1?.updateActions?.(dt)'));
expect('canonical enemy death dispatch notifies Director explicitly',base.includes('function killEnemy(enemy,opts={})')&&base.includes('stackfallEnemyDirectorV1?.onEnemyKilled?.(enemy,opts)'));
expect('magnet attraction has one canonical update owner in systems',systems.includes('function updateGems(dt)')&&!replaces(targeting,'updateGems'));
expect('Last Constellation no longer mutates global killEnemy during node damage',constellation.includes('deferKill:true')&&constellation.includes('killEnemy(owner,options)')&&!constellation.includes('suppressIntermediateConstellationKill')&&!constellation.includes('realKill=killEnemy'));
expect('Apex reward UI is prepared before the blocking mode is committed',rewards.indexOf('cards.replaceChildren(fragment)')<rewards.indexOf("state.mode='apexReward'")&&rewards.indexOf('confirm.onclick=claim')<rewards.indexOf("state.mode='apexReward'"));

const apexStaticOrder=[
  'src/apex-run-clock.js',
  'src/atropos-visual-v5.js',
  'src/last-constellation-production-v1.js',
  'src/last-constellation-reset-v1.js',
  'src/player-hit-invulnerability-v2.js',
  'src/last-constellation-presentation-v3.js',
  'src/last-constellation-hit-routing-v1.js',
  'src/last-constellation-combat-v2.js'
];
const apexStaticPositions=apexStaticOrder.map(src=>index.indexOf(`src=\"${src}\"`));
expect('Last Constellation production chain is statically ordered after the canonical Apex clock',apexStaticPositions.every(position=>position>=0)&&apexStaticPositions.every((position,i)=>i===0||position>apexStaticPositions[i-1]));
expect('boss-body-parts no longer owns Apex script loading',!bossParts.includes("createElement('script')")&&!bossParts.includes('data-atropos-visual-v5')&&!bossParts.includes('data-last-constellation-production-v1'));
expect('Last Constellation production/reset files no longer inject follow-up scripts',!constellation.includes("createElement('script')")&&!constellation.includes('loadReset')&&!constellationReset.includes("createElement('script')")&&!constellationReset.includes('loadApexRewardBalance'));
expect('static Last Constellation assets are not mislabeled as dynamic build assets',!['atropos-visual-v5.js','last-constellation-production-v1.js','last-constellation-reset-v1.js','player-hit-invulnerability-v2.js','last-constellation-presentation-v3.js','last-constellation-hit-routing-v1.js','last-constellation-combat-v2.js'].some(name=>buildFingerprint.includes(`'src/${name}'`)));

let failures=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failures++;}
console.log(`Checked ${checks.length} runtime ownership contracts; failures=${failures}`);
if(failures)process.exit(1);
