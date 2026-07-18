import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const write=(path,text)=>fs.writeFileSync(path,text);
const changed=[];

function replaceExact(path,before,after,label){
  const text=read(path);
  if(!text.includes(before))throw new Error(`${label}: expected source not found in ${path}`);
  const next=text.replace(before,after);
  if(next===text)throw new Error(`${label}: replacement made no change in ${path}`);
  write(path,next);changed.push(`${path}: ${label}`);
}

function replaceRegex(path,pattern,after,label){
  const text=read(path),matches=text.match(pattern);
  if(!matches)throw new Error(`${label}: expected pattern not found in ${path}`);
  const next=text.replace(pattern,after);
  if(next===text)throw new Error(`${label}: replacement made no change in ${path}`);
  write(path,next);changed.push(`${path}: ${label}`);
}

function assertText(path,needle,label){if(!read(path).includes(needle))throw new Error(`${label}: missing in ${path}`);}
function assertAbsent(path,needle,label){if(read(path).includes(needle))throw new Error(`${label}: forbidden text remains in ${path}`);}

// Canonical player-health ownership: progression-expansion owns all stack growth and regen.
replaceExact('src/core.js',"vitality:{name:'재생 장갑',icon:'+',color:'#74f2a7',desc:'최대 체력 +24, 즉시 체력 36 회복',max:10}","vitality:{name:'재생 장갑',icon:'+',color:'#74f2a7',desc:'최대 체력 +28, 즉시 체력 46 회복',max:10}",'update vitality catalog');
replaceRegex('src/reward-refinement.js',/  function applyMiniRewardPassive\(key\)\{\n    state\.passives\[key\]=stat\(key\)\+1;\n    if\(key==='vitality'\)\{player\.maxHp\+=24;player\.hp=Math\.min\(player\.maxHp,player\.hp\+36\);\}\n    if\(key==='stellarLife'\)\{const ratio=player\.hp\/Math\.max\(1,player\.maxHp\);player\.maxHp=Math\.max\(player\.maxHp\+1,Math\.round\(player\.maxHp\*1\.10\)\);player\.hp=Math\.max\(1,Math\.round\(player\.maxHp\*ratio\)\);\}\n  \}/,"  function applyMiniRewardPassive(key){\n    state.passives[key]=stat(key)+1;\n    if(key==='vitality')applyStackfallVitalityGrowth(1);\n    if(key==='stellarLife')applyStackfallStellarLifeGrowth(1);\n  }",'route boss rewards through canonical health helpers');
replaceRegex('src/endgame-balance-expansion.js',/  function reconcileRecoveryGrowth\(\)\{[\s\S]*?\n  \}\n\n  const baseUpdatePlayer=updatePlayer;\n  updatePlayer=function endgameRecoveryPlayer\(dt\)\{[\s\S]*?\n\n  const weaponSources=/,"  const baseUpdatePlayer=updatePlayer;\n  updatePlayer=function endgameBarrierPlayer(dt){baseUpdatePlayer(dt);if(state.weaponAugments?.bulwark){const n=Math.max(1,weaponCount('bulwark'));player.augmentBarrierTimer=(player.augmentBarrierTimer??7.5)-dt;if(player.augmentBarrierTimer<=0){player.augmentBarrierTimer=Math.max(4.6,7.8-n*.42);player.shield=Math.min(62+n*7,player.shield+4+n*1.35);shockwave(player.x,player.y,'#9dffe2',72+n*3,.24,1.7);}}};\n\n  const weaponSources=",'remove duplicate late health and regen patch');
replaceExact('src/ability-ledger-audit.js',"const regen=stat('regen')*.625,projSpeed=","const regen=stat('regen'),projSpeed=",'show actual per-second regeneration');

// Prism remains at the accepted lower tuning; Hard becomes a single, stronger canonical profile.
replaceExact('src/difficulty-augment-expansion.js',"hard:Object.freeze({key:'hard',enemyHp:1.18,enemyDamage:1.18,enemySpeed:1.06,rangedChance:1.18})","hard:Object.freeze({key:'hard',enemyHp:1.32,enemyDamage:1.30,enemySpeed:1.12,rangedChance:1.28})",'raise canonical hard profile');
replaceExact('src/endgame-balance-expansion.js',"hardLate=hard?(minutes*.009+Math.pow(minutes,1.08)*.0025):0","hardLate=hard?(minutes*.014+Math.pow(minutes,1.08)*.0040):0",'raise hard late damage growth');
replaceExact('src/endgame-balance-expansion.js',"hardLate=hard?(minutes*.004+Math.pow(minutes,1.06)*.0015):0","hardLate=hard?(minutes*.0065+Math.pow(minutes,1.06)*.0022):0",'raise hard late speed growth');
replaceRegex('src/endgame-balance-expansion.js',/\n  const previousDifficultyConfig=window\.stackfallDifficultyConfig;window\.stackfallDifficultyConfig=function refinedDifficultyConfig\(\)\{[^\n]+\};/,"",'remove final difficulty override');

// Player-facing documentation.
replaceExact('README.md','성좌 프리즘은 한 표적을 계속 조준할수록 `×1 → ×1.9 → 최대 출력` 순으로 강해지는 지속 집속 광선입니다. 5중첩 최대 출력은 ×4.35, 6중첩은 프리즘 3개와 ×4.6 최대 출력을 사용합니다.','성좌 프리즘은 한 표적을 계속 조준할수록 `×1 → ×1.65 → 최대 출력` 순으로 강해지는 지속 집속 광선입니다. 최대 출력은 5중첩 ×3.45, 6중첩 ×3.65이며 6중첩에서는 프리즘 3개를 사용합니다.','sync Prism README');
replaceExact('README.md','- 에코 비콘: 발사·설치형 장비 복제 확률 +7.5%','- 에코 비콘: 발사·설치형 장비 복제 확률 +7.5%\n- 재생 장갑: 최대 체력 +28, 즉시 체력 46 회복\n- 항성 생명핵: 최대 체력 +12%\n- 자가 복원: 초당 체력 1 회복','document health and regen values');
replaceExact('README.md','- 초월체: 실제 게임 시간 8분 간격이며 선택·보상·이벤트·일시정지보다 우선 등장','- 초월체: 실제 게임 시간 8분 간격이며 선택·보상·이벤트보다 우선 등장\n- 일시정지·능력 장부·선택·보상 중에는 실제 게임 시간과 초월체 예정 시간이 진행되지 않음','clarify paused game-time rule');

replaceExact('docs/GAME_DESIGN.md','| vitality | 재생 장갑 | 최대 체력 +24, 즉시 체력 36 회복 |','| vitality | 재생 장갑 | 최대 체력 +28, 즉시 체력 46 회복 |','sync vitality design value');
replaceExact('docs/GAME_DESIGN.md','| regen | 자가 복원 | 4초마다 체력 2.5 회복 |','| regen | 자가 복원 | 초당 체력 1 회복 |','sync regen design value');
replaceExact('docs/GAME_DESIGN.md','| 3 | 0.88초 유지 시 ×1.9, 2.18초 유지 시 ×4.1 |','| 3 | 집속 단계가 ×1 → ×1.65 → ×3.25로 상승 |','sync Prism stage description');
replaceExact('docs/GAME_DESIGN.md','| 5 | 최대 출력 ×4.35, 광선 굵기 증가 |','| 5 | 최대 출력 ×3.45, 광선 굵기 증가 |','sync Prism 5 stack');
replaceExact('docs/GAME_DESIGN.md','| 6 | 프리즘 3개, 최대 출력 ×4.6, 최종 집속 1.55초 |','| 6 | 프리즘 3개, 최대 출력 ×3.65 |','sync Prism 6 stack');
replaceExact('docs/GAME_DESIGN.md','- 능력 탭이 게임 시간을 멈추게 하지 않음','- 능력 탭을 열면 게임이 일시정지되고 닫을 때 이전 상태로 정확히 복귀함','fix ledger regression rule');
replaceExact('docs/GAME_DESIGN.md','- 능력 탭은 게임을 일시정지하지 않음','- 능력 탭을 열면 게임이 일시정지됨','fix ledger interface rule');
replaceExact('docs/GAME_DESIGN.md','- 5중첩 ×4.35\n- 6중첩 ×4.6','- 5중첩 ×3.45\n- 6중첩 ×3.65','sync Prism QA values');
replaceExact('docs/GAME_DESIGN.md','src/bootstrap.js\nsrc/core.js','src/build-info.js\nsrc/bootstrap.js\nsrc/core.js','add build-info to load order');
replaceExact('docs/GAME_DESIGN.md','src/reward-refinement.js\nsrc/combat-balance-refinement.js','src/reward-refinement.js\nsrc/difficulty-augment-expansion.js\nsrc/combat-balance-refinement.js','add difficulty module to load order');
replaceExact('docs/GAME_DESIGN.md','src/build-audit-ui.js\nsrc/gpu-renderer.js\n```','src/build-audit-ui.js\nsrc/gpu-renderer.js\nsrc/endgame-balance-expansion.js\n```','add endgame module to load order');
replaceExact('docs/GAME_DESIGN.md','- 프리즘 기본 수치·집속·lock·배율: `src/weapons.js`, 보상 정의·강화 적용: `src/reward-refinement.js`','- 프리즘 생성·lock 기반 구조: `src/weapons.js`, 최종 집속 피해·배율: `src/endgame-balance-expansion.js`, 보상 정의: `src/reward-refinement.js`','sync Prism ownership docs');
replaceExact('docs/GAME_DESIGN.md','- 장면별 BGM과 무기별 공격음: `src/runtime-config.js`, 장면 동기화 호출: `src/render.js`','- 최대 체력 패시브와 초당 재생: `src/progression-expansion.js`; 레벨업·이벤트·보스 보상은 공용 helper만 호출\n- 난이도 기본 profile: `src/difficulty-augment-expansion.js`; 어려움 후반 시간 성장: `src/endgame-balance-expansion.js`\n- 장면별 BGM과 무기별 공격음: `src/runtime-config.js`, 장면 동기화 호출: `src/render.js`','document canonical owners');

replaceExact('docs/WIKI.md','- 재생 장갑은 중첩당 최대 체력 +24와 즉시 회복 36, 비율형 최대 체력 패시브는 중첩당 +10%로 상향한다.','- 재생 장갑은 중첩당 최대 체력 +28과 즉시 회복 46, 항성 생명핵은 중첩당 최대 체력 +12%입니다. 자가 복원은 중첩당 초당 체력 1을 회복합니다.','sync Wiki health and regen');
replaceExact('docs/WIKI.md','- **어려움**: 적 체력·피해·속도와 원거리 적 비중이 증가합니다.','- **어려움**: 적 체력 1.32배, 피해 1.30배, 속도 1.12배, 원거리 적 등장 비중 1.28배를 기준으로 시작하며 4분 이후 피해와 속도 압박이 추가로 증가합니다.','document Hard values');

// Regression contracts follow the intended ownership instead of checking for duplicate implementations.
replaceExact('scripts/apex-encounter-contract.mjs',"endgame.includes(\"hardLate=hard?(minutes*.009+Math.pow(minutes,1.08)*.0025):0\")&&endgame.includes(\"hardLate=hard?(minutes*.004+Math.pow(minutes,1.06)*.0015):0\")","endgame.includes(\"hardLate=hard?(minutes*.014+Math.pow(minutes,1.08)*.0040):0\")&&endgame.includes(\"hardLate=hard?(minutes*.0065+Math.pow(minutes,1.06)*.0022):0\")",'sync apex Hard growth contract');
replaceExact('scripts/endgame-balance-contract.mjs',"const expansion=read('src/endgame-balance-expansion.js');","const expansion=read('src/endgame-balance-expansion.js');\nconst difficulty=read('src/difficulty-augment-expansion.js');",'load difficulty in endgame contract');
replaceExact('scripts/endgame-balance-contract.mjs',"expect('hard difficulty increased',expansion.includes('enemyHp:1.25')&&expansion.includes('enemyDamage:1.25'));","expect('hard difficulty increased',difficulty.includes('enemyHp:1.32')&&difficulty.includes('enemyDamage:1.30')&&difficulty.includes('enemySpeed:1.12')&&difficulty.includes('rangedChance:1.28'));\nexpect('difficulty has one canonical owner',!expansion.includes('window.stackfallDifficultyConfig=function refinedDifficultyConfig'));",'sync canonical Hard contract');
replaceExact('scripts/realm-specials-contract.mjs',"expect('max health passive buffs',core.includes('최대 체력 +24, 즉시 체력 36 회복')&&progression.includes('player.maxHp+=24')&&progression.includes('player.maxHp*1.10')&&reward.includes('player.maxHp+=24')&&reward.includes('player.maxHp*1.10'));","expect('max health passive buffs',core.includes('최대 체력 +28, 즉시 체력 46 회복')&&progression.includes('VITALITY_MAX_HP=28,VITALITY_INSTANT_HEAL=46')&&progression.includes('STELLAR_LIFE_MULT=1.12')&&reward.includes(\"if(key==='vitality')applyStackfallVitalityGrowth(1)\")&&reward.includes(\"if(key==='stellarLife')applyStackfallStellarLifeGrowth(1)\"));",'sync health ownership contract');

replaceRegex('.github/workflows/validate.yml',/      - name: Check gameplay polish contracts\n        run: node scripts\/polish-contract-check\.mjs\n?$/,"      - name: Check gameplay contracts\n        shell: bash\n        run: |\n          set -euo pipefail\n          node scripts/polish-contract-check.mjs\n          node scripts/apex-encounter-contract.mjs\n          node scripts/endgame-balance-contract.mjs\n          node scripts/realm-specials-contract.mjs\n          node scripts/source-ownership-contract.mjs\n",'wire all contracts into CI');

// Final ownership assertions before this migration commits anything.
assertText('src/progression-expansion.js','VITALITY_MAX_HP=28,VITALITY_INSTANT_HEAL=46','canonical vitality');
assertText('src/progression-expansion.js','STELLAR_LIFE_MULT=1.12','canonical stellar life');
assertText('src/progression-expansion.js',"player.hp=Math.min(player.maxHp,player.hp+n*dt)",'continuous regen');
assertText('src/endgame-balance-expansion.js','stage===2?(prismN>=6?3.65:prismN>=5?3.45:3.25)','lower Prism tuning');
assertText('src/difficulty-augment-expansion.js','enemyHp:1.32,enemyDamage:1.30,enemySpeed:1.12,rangedChance:1.28','canonical Hard profile');
assertAbsent('src/endgame-balance-expansion.js','reconcileRecoveryGrowth','duplicate health reconciliation');
assertAbsent('src/endgame-balance-expansion.js','regenBonusTimer','duplicate regen timer');
assertAbsent('src/endgame-balance-expansion.js','window.stackfallDifficultyConfig=function refinedDifficultyConfig','duplicate difficulty owner');
assertAbsent('docs/GAME_DESIGN.md','능력 탭은 게임을 일시정지하지 않음','outdated ledger wording');
assertAbsent('docs/GAME_DESIGN.md','5중첩 ×4.35','outdated Prism QA');
assertAbsent('docs/WIKI.md','최대 체력 +24와 즉시 회복 36','outdated Wiki health values');

// Remove the one-time migration mechanism itself. Runtime source contains no migration/hotfix layer.
for(const path of ['scripts/one-time-balance-source-sync.mjs','.github/workflows/one-time-balance-source-sync.yml'])if(fs.existsSync(path)){fs.unlinkSync(path);changed.push(`${path}: removed one-time migration`);}

console.log(changed.join('\n'));
