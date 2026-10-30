import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const progression=read('src/endless-progression-v2.js');
const modes=read('src/run-modes.js');
const index=read('index.html');

const checks=[];
const expect=(name,condition)=>checks.push([name,Boolean(condition)]);
const achievementDefs=[...progression.matchAll(/achievement\('([^']+)'/g)].map(match=>match[1]);

expect('redesigned progression is the only Endless progression loader',modes.includes("ENDLESS_PROGRESSION_SCRIPTS=Object.freeze(['src/endless-progression-v2.js'])")&&!modes.includes("['src/endless-progression.js']"));
expect('exactly forty production achievements are defined',achievementDefs.length===40&&new Set(achievementDefs).size===40);
expect('achievement UI stays inside profile',progression.includes("#profileScreen .profile-modal")&&progression.includes('profileAchievementDetails')&&!progression.includes('achievementHubBtn')&&!progression.includes('achievementScreen'));
expect('no player-facing category taxonomy or filters',!progression.includes('achievement-toolbar')&&!progression.includes('achievement-filter')&&!progression.includes('원정 6')&&!progression.includes('전투 4')&&!progression.includes('category:'));
expect('no future stage achievements are shipped',!progression.includes('stage-06')&&!progression.includes('stage-12')&&!progression.includes('stage-18')&&!progression.includes('STAGE 6')&&!progression.includes('STAGE 12')&&!progression.includes('STAGE 18'));
expect('existing weapon unlock progression remains represented', ['comet','prism','chrono','arc','ion','nova','drone','rail','spiral','mirror','vacuum','mine','missile','gate'].every(key=>progression.includes(`weapon('${key}')`)));
expect('existing feature unlock progression remains represented', ['special-ability','awakening','hard','very-hard','choice-4','start-level-3','core-development-iii','multiplicity-protocol'].every(key=>progression.includes(`feature('${key}')`)));
expect('survival milestone shard faucet is removed',progression.includes('claimSurvivalMilestones:()=>0')&&progression.includes('survivalMilestones:[]')&&!progression.includes('SURVIVAL_MILESTONES'));
expect('late achievements use bounded progression rewards',progression.includes("achievement('boss-no-hit'")&&progression.includes("achievement('apex-trinity'")&&progression.includes("achievement('very-hard-15m'")&&progression.includes('shard(2)'));
expect('all three Apex identities are tracked',progression.includes("['chronophage','starforge','lastconstellation']")&&progression.includes('apexForms'));
expect('Apex legacy and core cap achievements are tracked',progression.includes("achievement('legacy-max'")&&progression.includes("achievement('core-max'")&&progression.includes('maxApexLegacyStack')&&progression.includes('maxApexCoreStack'));
expect('skill achievements are tracked from gameplay',progression.includes("achievement('boss-no-hit'")&&progression.includes("achievement('boss-fast-15'")&&progression.includes("achievement('kill-burst-100'"));
expect('normal player UI contains no development commentary',!progression.includes('developer log')&&!progression.includes('debug')&&!progression.includes('implementation')&&!progression.includes('TMI')&&!progression.includes('내부'));
expect('main menu markup has no achievement card',!index.includes('id="achievementHubBtn"'));

let failures=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failures++;}
console.log(`Checked ${checks.length} achievement redesign contracts; failures=${failures}`);
if(failures)process.exit(1);
