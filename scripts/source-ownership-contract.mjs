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

const checks=[];
const expect=(name,condition)=>checks.push([name,Boolean(condition)]);

expect('canonical vitality values',progression.includes('VITALITY_MAX_HP=28,VITALITY_INSTANT_HEAL=46')&&core.includes('최대 체력 +28, 즉시 체력 46 회복'));
expect('canonical stellar life value',progression.includes('STELLAR_LIFE_MULT=1.12')&&events.includes('최대 체력 +12%'));
expect('reward paths use canonical health helpers',rewards.includes("if(key==='vitality')applyStackfallVitalityGrowth(1)")&&rewards.includes("if(key==='stellarLife')applyStackfallStellarLifeGrowth(1)"));
expect('event paths use canonical health helpers',events.includes("if(key==='vitality')applyStackfallVitalityGrowth(1)")&&events.includes("if(key==='stellarLife')applyStackfallStellarLifeGrowth(1)"));
expect('no late health reconciliation patch',!endgame.includes('reconcileRecoveryGrowth')&&!endgame.includes('regenBonusTimer'));
expect('regen has one continuous owner',progression.includes("player.hp=Math.min(player.maxHp,player.hp+n*dt)")&&ledger.includes("const regen=stat('regen'),")&&!endgame.includes("passiveStacks('regen')"));
expect('regen documentation matches runtime',readme.includes('자가 복원: 초당 체력 1 회복')&&design.includes('| regen | 자가 복원 | 초당 체력 1 회복 |')&&wiki.includes('자가 복원은 중첩당 초당 체력 1'));
expect('hard profile has one canonical owner',difficulty.includes("hard:Object.freeze({key:'hard',enemyHp:1.32,enemyDamage:1.30,enemySpeed:1.12,rangedChance:1.28})")&&!endgame.includes('window.stackfallDifficultyConfig=function refinedDifficultyConfig'));
expect('hard profile documentation matches runtime',wiki.includes('적 체력 1.32배, 피해 1.30배, 속도 1.12배, 원거리 적 등장 비중 1.28배'));
expect('prism uses accepted lower tuning',endgame.includes("stage===2?(prismN>=6?3.65:prismN>=5?3.45:3.25)")&&design.includes('5중첩 ×3.45')&&design.includes('6중첩 ×3.65'));
expect('obsolete values are absent',!core.includes('최대 체력 +24, 즉시 체력 36 회복')&&!design.includes('4초마다 체력 2.5 회복')&&!design.includes('5중첩 ×4.35')&&!difficulty.includes('enemyHp:1.18,enemyDamage:1.18'));
expect('ledger pause rule documented',design.includes('능력 탭을 열면 게임이 일시정지')&&wiki.includes('능력 장부를 열면 게임이 일시정지'));
expect('all contracts are wired into CI',['polish-contract-check.mjs','apex-encounter-contract.mjs','endgame-balance-contract.mjs','realm-specials-contract.mjs','source-ownership-contract.mjs'].every(name=>validate.includes(name)));
expect('validation workflow is permanent',validate.includes('contents: read')&&!validate.includes('one-time canonical source migration'));
expect('no runtime balance hotfix module',!index.includes('balance-hotfix')&&!index.includes('source-sync')&&!index.includes('override.js'));
expect('temporary migration files are removed',!fs.existsSync('scripts/one-time-balance-source-sync.mjs')&&!fs.existsSync('.github/workflows/one-time-balance-source-sync.yml'));

let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
console.log(`Checked ${checks.length} canonical balance ownership contracts; failures=${failed}`);
if(failed)process.exit(1);
