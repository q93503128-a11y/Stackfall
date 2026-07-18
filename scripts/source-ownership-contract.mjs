import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const progression=read('src/progression-expansion.js');
const rewards=read('src/reward-refinement.js');
const events=read('src/map-event-expansion.js');
const endgame=read('src/endgame-balance-expansion.js');
const difficulty=read('src/difficulty-augment-expansion.js');
const ledger=read('src/ability-ledger-audit.js');
const core=read('src/core.js');
const readme=read('README.md');
const design=read('docs/GAME_DESIGN.md');
const wiki=read('docs/WIKI.md');
const validate=read('.github/workflows/validate.yml');
const index=read('index.html');
const selected=process.env.OWNERSHIP_GROUP||'all';

const checks=[];
const expect=(group,name,condition)=>{if(selected==='all'||selected===group)checks.push([group,name,Boolean(condition)]);};

expect('health','canonical vitality values',progression.includes('VITALITY_MAX_HP=28,VITALITY_INSTANT_HEAL=46')&&core.includes('최대 체력 +28, 즉시 체력 46 회복'));
expect('health','canonical stellar life value',progression.includes('STELLAR_LIFE_MULT=1.12')&&events.includes('최대 체력 +12%'));
expect('health','reward paths use canonical health helpers',rewards.includes("if(key==='vitality')applyStackfallVitalityGrowth(1)")&&rewards.includes("if(key==='stellarLife')applyStackfallStellarLifeGrowth(1)"));
expect('health','event paths use canonical health helpers',events.includes("if(key==='vitality')applyStackfallVitalityGrowth(1)")&&events.includes("if(key==='stellarLife')applyStackfallStellarLifeGrowth(1)"));
expect('health','no late health reconciliation patch',!endgame.includes('reconcileRecoveryGrowth')&&!endgame.includes('regenBonusTimer'));

expect('regen-runtime','regen has one continuous execution owner',progression.includes("player.hp=Math.min(player.maxHp,player.hp+n*dt)")&&ledger.includes("const regen=stat('regen'),")&&!endgame.includes('endgameRecoveryPlayer')&&!endgame.includes('regenBonusTimer'));
expect('regen-docs','regen documentation matches runtime',readme.includes('자가 복원: 초당 체력 1 회복')&&design.includes('| regen | 자가 복원 | 초당 체력 1 회복 |')&&wiki.includes('자가 복원은 중첩당 초당 체력 1'));

expect('hard','hard profile has one canonical owner',difficulty.includes("hard:Object.freeze({key:'hard',enemyHp:1.32,enemyDamage:1.30,enemySpeed:1.12,rangedChance:1.28})")&&!endgame.includes('window.stackfallDifficultyConfig=function refinedDifficultyConfig'));
expect('hard','hard profile documentation matches runtime',wiki.includes('적 체력 1.32배, 피해 1.30배, 속도 1.12배, 원거리 적 등장 비중 1.28배'));

expect('prism','prism uses accepted lower tuning',endgame.includes("stage===2?(prismN>=6?3.65:prismN>=5?3.45:3.25)")&&design.includes('5중첩 ×3.45')&&design.includes('6중첩 ×3.65'));

expect('docs','obsolete values are absent',!core.includes('최대 체력 +24, 즉시 체력 36 회복')&&!design.includes('4초마다 체력 2.5 회복')&&!design.includes('5중첩 ×4.35')&&!difficulty.includes('enemyHp:1.18,enemyDamage:1.18'));
expect('docs','ledger pause rule documented',design.includes('능력 탭을 열면 게임이 일시정지')&&wiki.includes('능력 장부를 열면 게임이 일시정지'));

expect('ci','all contracts are wired into CI',['polish-contract-check.mjs','apex-encounter-contract.mjs','endgame-balance-contract.mjs','realm-specials-contract.mjs','source-ownership-contract.mjs'].every(name=>validate.includes(name)));
expect('ci','validation workflow is permanent',validate.includes('contents: read')&&!validate.includes('one-time canonical source migration'));
expect('ci','no runtime balance hotfix module',!index.includes('balance-hotfix')&&!index.includes('source-sync')&&!index.includes('override.js'));
expect('ci','temporary migration files are removed',!fs.existsSync('scripts/one-time-balance-source-sync.mjs')&&!fs.existsSync('.github/workflows/one-time-balance-source-sync.yml'));

let failed=0;
for(const [group,name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} [${group}] ${name}`);if(!ok)failed++;}
console.log(`Checked ${checks.length} ownership contracts in ${selected}; failures=${failed}`);
if(failed)process.exit(1);
