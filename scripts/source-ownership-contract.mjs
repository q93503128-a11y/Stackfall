import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const progression=read('src/progression-expansion.js');
const rewards=read('src/reward-refinement.js');
const events=read('src/map-event-expansion.js');
const endgame=read('src/endgame-balance-expansion.js');
const difficulty=read('src/difficulty-augment-expansion.js');
const ledger=read('src/ability-ledger-audit.js');
const core=read('src/core.js');
const design=read('docs/GAME_DESIGN.md');
const wiki=read('docs/WIKI.md');
const validate=read('.github/workflows/validate.yml');

const checks=[];
const expect=(name,condition)=>checks.push([name,Boolean(condition)]);

expect('canonical vitality values',progression.includes('VITALITY_MAX_HP=28,VITALITY_INSTANT_HEAL=46')&&core.includes('최대 체력 +28, 즉시 체력 46 회복'));
expect('canonical stellar life value',progression.includes('STELLAR_LIFE_MULT=1.12')&&events.includes('최대 체력 +12%'));
expect('reward paths use canonical health helpers',rewards.includes("if(key==='vitality')applyStackfallVitalityGrowth(1)")&&rewards.includes("if(key==='stellarLife')applyStackfallStellarLifeGrowth(1)"));
expect('event paths use canonical health helpers',events.includes("if(key==='vitality')applyStackfallVitalityGrowth(1)")&&events.includes("if(key==='stellarLife')applyStackfallStellarLifeGrowth(1)"));
expect('no late health reconciliation patch',!endgame.includes('reconcileRecoveryGrowth')&&!endgame.includes('regenBonusTimer'));
expect('regen has one continuous owner',progression.includes("player.hp=Math.min(player.maxHp,player.hp+n*dt)")&&ledger.includes("const regen=stat('regen'),")&&!endgame.includes("passiveStacks('regen')"));
expect('hard profile has one canonical owner',difficulty.includes("hard:Object.freeze({key:'hard',enemyHp:1.32,enemyDamage:1.30,enemySpeed:1.12,rangedChance:1.28})")&&!endgame.includes('window.stackfallDifficultyConfig=function refinedDifficultyConfig'));
expect('prism uses accepted lower tuning',endgame.includes("stage===2?(prismN>=6?3.65:prismN>=5?3.45:3.25)")&&design.includes('5중첩 ×3.45')&&design.includes('6중첩 ×3.65'));
expect('ledger pause rule documented',design.includes('능력 탭을 열면 게임이 일시정지')&&wiki.includes('능력 장부를 열면 게임이 일시정지'));
expect('all contracts are wired into CI',['polish-contract-check.mjs','apex-encounter-contract.mjs','endgame-balance-contract.mjs','realm-specials-contract.mjs','source-ownership-contract.mjs'].every(name=>validate.includes(name)));

let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
console.log(`Checked ${checks.length} source ownership contracts; failures=${failed}`);
if(failed)process.exit(1);
