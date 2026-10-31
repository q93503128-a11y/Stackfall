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
const core=read('src/core.js');
const bossCatalog=read('src/boss-catalog.js');
const runClock=read('src/apex-run-clock.js');
const rewardBalance=read('src/apex-reward-balance-v1.js');
const starforgeLegacy=read('src/apex-starforge-legacy-v2.js');
const constellationLegacy=read('src/apex-constellation-legacy-v2.js');
const index=read('index.html');
const bossParts=read('src/boss-body-parts.js');
const patterns=read('src/boss-patterns.js');
const identityCombat=read('src/apex-identity-combat-v1.js');
const omegaProduction=read('src/omega-production-v1.js');
const omegaCombat=read('src/omega-combat-v1.js');
const atroposPhase=read('src/atropos-phase-production-v1.js');
const atroposEscalation=read('src/atropos-combat-escalation-v1.js');
const atroposPolish=read('src/atropos-production-polish-v2.js');
const constellationReset=read('src/last-constellation-reset-v1.js');
const buildFingerprint=read('scripts/build-fingerprint.mjs');
const buildInfo=read('src/build-info.js');
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
expect('Apex progression timing is canonical and wrapper-free',core.includes('function progressionTime()')&&core.includes('state.runTime=0')&&bosses.includes('progressionTime()>=(state.nextApexAt||APEX_INTERVAL_SECONDS)')&&!['resetGame','spawnEnemy','updateSpawning','updateMapEvents','updateHUD','endGame','updateApexSystems'].some(name=>replaces(runClock,name))&&!runClock.includes('withProgressionClock'));
expect('Apex reward lifecycle uses explicit services instead of replacement chains',bossCatalog.includes('stackfallApexRewardBalance?.reset?.()')&&bosses.includes('balance?.applyLegacy')&&rewards.includes('balance?.applyCoreStack')&&rewardBalance.includes('window.stackfallApexRewardBalance=Object.freeze')&&!replaces(rewardBalance,'resetBossSystems')&&!replaces(rewardBalance,'applyApexReward')&&!rewardBalance.includes('Object.defineProperty(player')&&!replaces(starforgeLegacy,'resetBossSystems')&&!replaces(starforgeLegacy,'applyApexReward')&&!starforgeLegacy.includes('window.openApexRewardSelection=function')&&!replaces(constellationLegacy,'resetBossSystems')&&!replaces(constellationLegacy,'applyApexReward')&&!constellationLegacy.includes('window.openApexRewardSelection=function'));
expect('Apex identity reward extensions are explicit services',starforgeLegacy.includes('window.stackfallStarforgeLegacyV2=Object.freeze')&&constellationLegacy.includes('window.stackfallConstellationLegacyV2=Object.freeze')&&bosses.includes('apexRewardIdentityService(form)?.afterReward?.(form)'));
expect('Apex combat form dispatch has one canonical owner',patterns.includes('function registerApexCombatService(form,patch=null)')&&patterns.includes('function apexCombatService(target)')&&patterns.includes("if(typeof service?.skill==='function')return service.skill(e,dt)")&&bosses.includes("if(typeof service?.director==='function')return service.director(e,dt)")&&bosses.includes("apexCombatService(e)?.motion?.(e,out)===true"));
const apexCombatLayerFiles=[runClock,identityCombat,omegaProduction,omegaCombat,atroposPhase,atroposEscalation,atroposPolish,constellationReset,constellation];
expect('Apex production layers do not replace canonical skill/director/motion owners',!apexCombatLayerFiles.some(text=>replaces(text,'apexBossSkill')||replaces(text,'apexPhaseDirector')||replaces(text,'apexMotionVelocity')));
expect('Chronophage combat stages are explicit service slots',runClock.includes("registerApexCombatService('chronophage')")&&identityCombat.includes("registerApexCombatService('chronophage').identity=updateClockworkIdentity")&&atroposPhase.includes('atroposPhaseService.phaseBefore=')&&atroposPhase.includes('atroposPhaseService.phaseAfter=')&&atroposEscalation.includes('atroposCombatService.escalationBefore=')&&atroposEscalation.includes('atroposCombatService.escalationAfter=')&&atroposPolish.includes('atroposPolishService.polishBefore=')&&atroposPolish.includes('atroposPolishService.polishAfter='));
expect('Omega and Last Constellation suppress legacy combat through services',omegaProduction.includes('omegaCombatService.skill=')&&omegaCombat.includes('registerApexCombatService(FORM).combat=updateOmegaCombat')&&constellationReset.includes('lastConstellationCombatService.skill=phaseOnly')&&constellation.includes('registerApexCombatService(FORM).motion='));
expect('Chronophage entry and multipart hit reactions use explicit hooks',bosses.includes('encounterService?.beforeEnemies?.(dt)===false')&&runClock.includes('ATROPOS_COMBAT_SERVICE.beforeEnemies=')&&bossParts.includes('onBodyPartHit?.(target,owner,amount,options)')&&!replaces(runClock,'updateEnemies')&&!replaces(runClock,'dealDamage'));


const apexStaticOrder=[
  'src/apex-run-clock.js',
  'src/atropos-visual-v5.js',
  'src/last-constellation-production-v1.js',
  'src/last-constellation-reset-v1.js',
  'src/player-hit-invulnerability-v2.js',
  'src/last-constellation-presentation-v3.js',
  'src/last-constellation-hit-routing-v1.js',
  'src/last-constellation-combat-v2.js',
  'src/apex-reward-balance-v1.js',
  'src/apex-entry-cleanup-v1.js',
  'src/apex-entry-camera-v1.js',
  'src/apex-identity-combat-v1.js',
  'src/omega-production-v1.js',
  'src/omega-combat-v1.js',
  'src/atropos-phase-production-v1.js',
  'src/atropos-time-shear-v1.js',
  'src/atropos-combat-escalation-v1.js',
  'src/atropos-production-polish-v2.js',
  'src/atropos-hud-cleanup-v1.js',
  'src/apex-starforge-legacy-v2.js',
  'src/apex-constellation-legacy-v2.js'
];
const apexStaticPositions=apexStaticOrder.map(src=>index.indexOf(`src=\"${src}\"`));
expect('Apex production chain is statically ordered after the canonical Apex clock',apexStaticPositions.every(position=>position>=0)&&apexStaticPositions.every((position,i)=>i===0||position>apexStaticPositions[i-1]));
expect('boss-body-parts no longer owns Apex script loading',!bossParts.includes("createElement('script')")&&!bossParts.includes('data-atropos-visual-v5')&&!bossParts.includes('data-last-constellation-production-v1'));
expect('Last Constellation production/reset files no longer inject follow-up scripts',!constellation.includes("createElement('script')")&&!constellation.includes('loadReset')&&!constellationReset.includes("createElement('script')")&&!constellationReset.includes('loadApexRewardBalance'));
expect('static Last Constellation assets are not mislabeled as dynamic build assets',!['atropos-visual-v5.js','last-constellation-production-v1.js','last-constellation-reset-v1.js','player-hit-invulnerability-v2.js','last-constellation-presentation-v3.js','last-constellation-hit-routing-v1.js','last-constellation-combat-v2.js'].some(name=>buildFingerprint.includes(`'src/${name}'`)));
expect('build-info is pure generated metadata with no runtime bootstrap',buildInfo.split('\n').filter(Boolean).length===2&&buildInfo.startsWith('window.STACKFALL_BUILD_SHA=')&&buildInfo.includes('\nwindow.STACKFALL_BUILD_ASSETS=')&&!buildInfo.includes('addEventListener')&&!buildInfo.includes("createElement('script')"));
expect('Apex production assets are no longer classified as dynamic build assets',!['apex-reward-balance-v1.js','apex-entry-cleanup-v1.js','apex-entry-camera-v1.js','apex-identity-combat-v1.js','omega-production-v1.js','omega-combat-v1.js','atropos-phase-production-v1.js','atropos-time-shear-v1.js','atropos-combat-escalation-v1.js','atropos-production-polish-v2.js','atropos-hud-cleanup-v1.js','apex-starforge-legacy-v2.js','apex-constellation-legacy-v2.js'].some(name=>buildFingerprint.includes(`'src/${name}'`)));

let failures=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failures++;}
console.log(`Checked ${checks.length} runtime ownership contracts; failures=${failures}`);
if(failures)process.exit(1);
