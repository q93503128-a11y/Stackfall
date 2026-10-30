import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const progression=read('src/endless-progression-v2.js');
const entry=read('src/achievement-profile-entry-v2.js');
const cardUi=read('src/achievement-card-ui-rollback-v2.js');
const modes=read('src/run-modes.js');
const index=read('index.html');

const checks=[];
const expect=(name,condition)=>checks.push([name,Boolean(condition)]);
const achievementDefs=[...progression.matchAll(/achievement\('([^']+)'/g)].map(match=>match[1]);
const canonicalLoaders=['src/endless-progression-v2.js','src/achievement-profile-entry-v2.js','src/achievement-card-ui-rollback-v2.js'];
const loaderPositions=canonicalLoaders.map(src=>modes.indexOf(`'${src}'`));

expect('redesigned progression, achievement entry, and card rollback load in canonical order',loaderPositions.every(position=>position>=0)&&loaderPositions.every((position,index)=>index===0||position>loaderPositions[index-1])&&!modes.includes("'src/endless-progression.js'"));
expect('exactly forty production achievements are defined',achievementDefs.length===40&&new Set(achievementDefs).size===40);
expect('standalone achievement hub button and screen are restored',entry.includes("entry.id='achievementHubBtn'")&&entry.includes("screen.id='achievementScreen'")&&entry.includes('openAchievements'));
expect('profile shows achievement count only',entry.includes("profileValue.textContent=`${complete} / ${total}`")&&entry.includes('removeProfileAchievementList')&&entry.includes('#profileAchievementDetails{display:none!important}'));
expect('achievement button keeps original hub slot',!entry.includes('#menu #stageMapBtn{grid-column:8/13')&&entry.includes("insertAdjacentElement('afterend',entry)"));
expect('achievement screen uses the pre-ledger two-column card grid',cardUi.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important')&&cardUi.includes('border-radius:14px!important')&&cardUi.includes('background:rgba(5,9,24,.58)!important')&&cardUi.includes('achievement-row:before{content:none!important'));
expect('card rollback does not touch hub card positions or profile structure',!cardUi.includes('#menu #achievementHubBtn')&&!cardUi.includes('#menu #stageMapBtn')&&!cardUi.includes('#hubProfile')&&!cardUi.includes('#profileScreen'));
expect('no player-facing category taxonomy or filters',!entry.includes('achievement-filter')&&!entry.includes('achievement-toolbar')&&!entry.includes('category:')&&!entry.includes('원정 6')&&!entry.includes('전투 4'));
expect('no future stage achievements are shipped',!progression.includes('stage-06')&&!progression.includes('stage-12')&&!progression.includes('stage-18')&&!progression.includes('STAGE 6')&&!progression.includes('STAGE 12')&&!progression.includes('STAGE 18'));
expect('existing weapon unlock progression remains represented',['comet','prism','chrono','arc','ion','nova','drone','rail','spiral','mirror','vacuum','mine','missile','gate'].every(key=>progression.includes(`weapon('${key}')`)));
expect('existing feature unlock progression remains represented',['special-ability','awakening','hard','very-hard','choice-4','start-level-3','core-development-iii','multiplicity-protocol'].every(key=>progression.includes(`feature('${key}')`)));
expect('survival milestone shard faucet is removed',progression.includes('claimSurvivalMilestones:()=>0')&&progression.includes('survivalMilestones:[]')&&!progression.includes('const SURVIVAL_MILESTONES=')&&!progression.includes("stackfallGrantCurrency?.('coreShard',claimed.length)"));
expect('late achievements use bounded progression rewards',progression.includes("achievement('boss-no-hit'")&&progression.includes("achievement('apex-trinity'")&&progression.includes("achievement('very-hard-15m'")&&progression.includes('shard(2)'));
expect('all three Apex identities are tracked',progression.includes("['chronophage','starforge','lastconstellation']")&&progression.includes('apexForms'));
expect('Apex legacy and core cap achievements are tracked',progression.includes("achievement('legacy-max'")&&progression.includes("achievement('core-max'")&&progression.includes('maxApexLegacyStack')&&progression.includes('maxApexCoreStack'));
expect('skill achievements are tracked from gameplay',progression.includes("achievement('boss-no-hit'")&&progression.includes("achievement('boss-fast-15'")&&progression.includes("achievement('kill-burst-100'"));
expect('normal player UI contains no development commentary',![progression,entry,cardUi].some(source=>source.includes('developer log')||source.includes('debug prose')||source.includes('implementation commentary')||source.includes('TMI')||source.includes('내부 문구')));
expect('achievement button is runtime-created, not hardcoded into main markup',!index.includes('id="achievementHubBtn"'));

let failures=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failures++;}
console.log(`Checked ${checks.length} achievement redesign contracts; failures=${failures}`);
if(failures)process.exit(1);
