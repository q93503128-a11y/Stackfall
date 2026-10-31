import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const director=read('src/enemy-director-v1.js');
const core=read('src/core.js');
const interfaceSource=read('src/interface.js');
const systems=read('src/systems.js');
const base=read('src/systems-base.js');
const bosses=read('src/bosses.js');
const weapons=read('src/weapons.js');
const render=read('src/render.js');
const targeting=read('src/targeting-motion-refinement.js');
const constellation=read('src/last-constellation-production-v1.js');
const rewards=read('src/reward-refinement.js');
const allRuntimeSource=fs.readdirSync('src').filter(name=>name.endsWith('.js')).map(name=>read('src/'+name)).join('\n');
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
expect('player damage dispatch has one canonical owner with captured-base interceptor semantics',bosses.includes('const STACKFALL_PLAYER_DAMAGE_INTERCEPTORS=[]')&&bosses.includes('function registerPlayerDamageInterceptor(name,handler)')&&bosses.includes('function hurtPlayerCore(amount,source)')&&bosses.includes('function hurtPlayer(amount,source){return runPlayerDamageInterceptor'));
expect('player damage feature layers register interceptors instead of replacing hurtPlayer',!allRuntimeSource.includes('hurtPlayer=function')&&allRuntimeSource.includes("registerPlayerDamageInterceptor('dev-invincibility'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('achievement-hit-tracking'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('reward-bulwark'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('awakening-bastion'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('global-hit-invulnerability'"));
expect('weapon update dispatch has one canonical owner with captured-base interceptor semantics',weapons.includes('const STACKFALL_WEAPON_UPDATE_INTERCEPTORS=[]')&&weapons.includes('function registerWeaponUpdateInterceptor(name,handler)')&&weapons.includes('function updateWeaponsCore(dt)')&&weapons.includes('function updateWeapons(dt){return runWeaponUpdateInterceptor'));
expect('weapon update feature layers register interceptors instead of replacing updateWeapons',!allRuntimeSource.includes('updateWeapons=function')&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('reward-traits'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('multiplicity-orbits'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('awakening-first-set'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('awakening-second-set'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('awakening-third-set'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('echo-blade-cooldown'"));

expect('resetGame dispatch has one canonical owner with captured-base interceptor semantics',core.includes('const STACKFALL_RESET_GAME_INTERCEPTORS=[]')&&core.includes('function registerResetGameInterceptor(name,handler)')&&core.includes('function resetGameCore()')&&core.includes('function resetGame(...args){return runResetGameInterceptor'));
expect('resetGame feature layers register interceptors instead of replacing resetGame',!replaces(allRuntimeSource,'resetGame')&&(allRuntimeSource.match(/registerResetGameInterceptor\('/g)||[]).length===13&&allRuntimeSource.includes("registerResetGameInterceptor('stage-runtime.js:stageAwareReset'")&&allRuntimeSource.includes("registerResetGameInterceptor('weapon-awakening.js:awakeningReset'")&&allRuntimeSource.includes("registerResetGameInterceptor('apex-run-clock.js:resetGameWithRunClock'"));
expect('endGame dispatch has one canonical owner with captured-base interceptor semantics',interfaceSource.includes('const STACKFALL_END_GAME_INTERCEPTORS=[]')&&interfaceSource.includes('function registerEndGameInterceptor(name,handler)')&&interfaceSource.includes('function endGameCore()')&&interfaceSource.includes('function endGame(...args){return runEndGameInterceptor'));
expect('endGame feature layers register interceptors instead of replacing endGame',!replaces(allRuntimeSource,'endGame')&&(allRuntimeSource.match(/registerEndGameInterceptor\('/g)||[]).length===8&&allRuntimeSource.includes("registerEndGameInterceptor('weapon-awakening.js:awakeningEnd'")&&allRuntimeSource.includes("registerEndGameInterceptor('run-damage-stats.js:endGameWithDamageStats'")&&allRuntimeSource.includes("registerEndGameInterceptor('apex-run-clock.js:endGameWithRunTime'"));
expect('showMainMenu dispatch has one canonical owner with captured-base interceptor semantics',interfaceSource.includes('const STACKFALL_SHOW_MAIN_MENU_INTERCEPTORS=[]')&&interfaceSource.includes('function registerShowMainMenuInterceptor(name,handler)')&&interfaceSource.includes('function showMainMenuCore()')&&interfaceSource.includes('function showMainMenu(...args){return runShowMainMenuInterceptor'));
expect('showMainMenu feature layers register interceptors instead of replacing showMainMenu',!replaces(allRuntimeSource,'showMainMenu')&&(allRuntimeSource.match(/registerShowMainMenuInterceptor\('/g)||[]).length===11&&allRuntimeSource.includes("registerShowMainMenuInterceptor('reward-refinement.js:showMainMenuInterceptor'")&&allRuntimeSource.includes("registerShowMainMenuInterceptor('weapon-awakening.js:awakeningMenu'")&&allRuntimeSource.includes("registerShowMainMenuInterceptor('achievement-profile-entry-v2.js:achievementHubMainMenu'"));

let failures=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failures++;}
console.log(`Checked ${checks.length} runtime ownership contracts; failures=${failures}`);
if(failures)process.exit(1);
