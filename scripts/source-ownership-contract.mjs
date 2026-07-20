import fs from 'node:fs';
import path from 'node:path';

const read=file=>fs.readFileSync(file,'utf8');
const progression=read('src/progression-expansion.js');
const rewards=read('src/reward-refinement.js');
const events=read('src/map-event-expansion.js');
const targeting=read('src/targeting-motion-refinement.js');
const endgame=read('src/endgame-balance-expansion.js');
const difficulty=read('src/difficulty-augment-expansion.js');
const ledger=read('src/ability-ledger-audit.js');
const core=read('src/core.js');
const bootstrap=read('src/bootstrap.js');
const weapons=read('src/weapons.js');
const auditUi=read('src/build-audit-ui.js');
const browserSmoke=read('scripts/browser-smoke.mjs');
const readme=read('README.md');
const design=read('docs/GAME_DESIGN.md');
const wiki=read('docs/WIKI.md');
const validate=read('.github/workflows/validate.yml');
const index=read('index.html');
const catalog=read('src/boss-catalog.js');
const bosses=read('src/bosses.js');
const selected=process.env.OWNERSHIP_GROUP||'all';

function javascriptSources(root='src'){
  const out=[];
  const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(entry.isFile()&&entry.name.endsWith('.js'))out.push({file:file.replaceAll('\\','/'),text:read(file)});}};
  walk(root);return out;
}
const forbiddenBalanceAssignments=javascriptSources().filter(({file,text})=>file!=='src/progression-expansion.js'&&(/\b(?:damageMult|hasteMult)\s*=\s*function\b/.test(text)||/window\.(?:chainDamageBonus|chainDurationMultiplier|weaponCycleMultiplier)\s*=/.test(text)));

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

expect('prism','prism final tuning has one runtime owner',endgame.includes("prismN>=6?4.45:prismN>=5?4.10:3.70")&&endgame.includes('stage===1?1.85:1')&&endgame.includes('damage=16+prismN*4.2'));
expect('prism','prism uses one sticky shared lock',endgame.includes('player.prismSharedLock')&&endgame.includes('lock.targetId?enemyById(lock.targetId):null')&&endgame.includes('inside||lock.lostTime<1.5'));
expect('prism','prism acquisition windup is canonical',endgame.includes('lock.windup=.5')&&endgame.includes('if(lock.windup>0)')&&bootstrap.includes('새 표적을 0.5초 조준'));
expect('prism','prism visuals share firing positions',endgame.includes('prismPositions(prismBodyCount(prismN))')&&endgame.includes('synchronizedOrbitVisuals'));
expect('prism','prism runtime resets with every new run',core.includes('prismSharedLock:null')&&core.includes('player.prismSharedLock=null'));
expect('prism','prism player text is synchronized',core.includes('표적을 조준한 뒤 쓰러질 때까지')&&bootstrap.includes('최대 출력 ×4.45')&&auditUi.includes("['새 표적 선딜','0.5초']")&&design.includes('표적이 살아 있으면 가급적 사망할 때까지 유지')&&wiki.includes('가급적 쓰러질 때까지 유지'));
expect('prism','obsolete prism switching and values removed',!bootstrap.includes('더 가까운 적이 들어오면')&&!design.includes('더 가까운 적이 들어오면 모든 프리즘')&&!bootstrap.includes('최대 출력 ×3.45')&&!bootstrap.includes('최대 출력 ×3.65')&&!auditUi.includes("n>=6?'3.65'"));
expect('prism','old lower smoke values are not source truth',browserSmoke.includes('stressed.prism')||browserSmoke.includes('prism'));

expect('targeting','manual aim and farthest boomerang owner',targeting.includes('id="manualAim"')&&targeting.includes("if(key==='arc')return farthestWeaponTarget")&&targeting.includes('cursorD2'));
expect('targeting','magnet attraction speed owner',targeting.includes('pullSpeed=1+magnetStacks*.22')&&core.includes('끌어오는 속도 증가')&&bootstrap.includes('끌어오는 속도 증가'));
expect('targeting','vault elite exception owner',targeting.includes('vaultDuringEliteEncounters')&&targeting.includes("enemy.type='vault-elite'")&&wiki.includes('보스나 중간보스가 살아 있어도'));
expect('targeting','multiplicity focuses the original target',endgame.includes('추가 공격체는 원본과 같은 적을 노린다')&&!endgame.includes('const multiplicityTargets=')&&weapons.includes('function fireIonChain'));
expect('targeting','late focused wrappers preserve augment owners',difficulty.includes('function triggerDroneAugment')&&difficulty.includes('function triggerSpiralAugment')&&difficulty.includes('__stackfallAugmentAware'));

expect('docs','concise chain copy stays player facing',core.includes('연쇄 유지시간과 연쇄 피해 증가')&&bootstrap.includes('연쇄 유지시간과 연쇄 피해 증가')&&progression.includes("desc:'30연쇄마다 최대 체력 비례 회복.'")&&!core.includes('1중첩 효과는 낮지만')&&!bootstrap.includes('A modest first stack'));
expect('docs','chain recovery buff is documented',progression.includes('Math.min(.30,.025+power*.018')&&readme.includes('최대 체력의 30%')&&design.includes('min(30%'));
expect('docs','ledger pause rule documented',design.includes('능력 장부를 열면 게임 일시정지')&&wiki.includes('능력 장부를 열면 게임이 일시정지'));
expect('docs','apex ignores build and uses appearance escalation',design.includes('플레이어 레벨·무기·패시브 성장량을 읽지 않음')&&wiki.includes('등장 횟수만으로 누적 복리 강화')&&!catalog.includes('apexPlayerGrowthScale'));
expect('docs','apex legacies remain active and shield free',design.includes('보호막 충전형이 아님')&&wiki.includes('보호막 충전형 유산이 아니다')&&bosses.includes('function updateConstellationLegacy')&&!rewards.includes('보호막 36'));
expect('docs','continuous beam performance fix documented',readme.includes('지속 광선 렉 수정')&&design.includes('지속 광선 객체 제한')&&bosses.includes('beam.visual=stressed?.070:.040'));
expect('docs','combat multiplier assignments have one owner',forbiddenBalanceAssignments.length===0);
expect('docs','audit UI does not redefine combat balance',!auditUi.includes('hasteMult=function')&&!auditUi.includes('damageMult=function')&&!auditUi.includes('window.chainDamageBonus=')&&!auditUi.includes('window.chainDurationMultiplier='));

expect('ci','all contracts are wired into CI',['polish-contract-check.mjs','apex-encounter-contract.mjs','endgame-balance-contract.mjs','realm-specials-contract.mjs','source-ownership-contract.mjs'].every(name=>validate.includes(name)));
expect('ci','validation workflow is permanent',validate.includes('contents: read')&&!validate.includes('one-time canonical source migration'));
expect('ci','no runtime balance hotfix module',!index.includes('balance-hotfix')&&!index.includes('source-sync')&&!index.includes('override.js'));
expect('ci','temporary migration files are removed',!fs.existsSync('scripts/one-time-balance-source-sync.mjs')&&!fs.existsSync('.github/workflows/one-time-balance-source-sync.yml'));

if(forbiddenBalanceAssignments.length)console.error('Unexpected combat multiplier owners:',forbiddenBalanceAssignments.map(entry=>entry.file).join(', '));
let failed=0;
for(const [group,name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} [${group}] ${name}`);if(!ok)failed++;}
console.log(`Checked ${checks.length} ownership contracts in ${selected}; failures=${failed}`);
if(failed)process.exit(1);
