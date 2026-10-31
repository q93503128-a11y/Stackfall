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

let failures=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failures++;}
console.log(`Checked ${checks.length} runtime ownership contracts; failures=${failures}`);
if(failures)process.exit(1);
