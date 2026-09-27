import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const settings=read('src/settings.js'),feature=read('src/feature-pack.js'),progression=read('src/progression-expansion.js'),meta=read('src/meta-progression.js'),catalog=read('src/stage-catalog.js'),index=read('index.html');
const checks=[
 ['auto level choice setting persists',settings.includes("GAME_SETTINGS.autoLevelChoice=saved.autoLevelChoice===true")&&settings.includes("updateDisplaySetting('autoLevelChoice',settingsUi.autoLevelChoice.checked)")],
 ['final stable choice owner honors auto selection before showing overlay',progression.includes("state.mode='choice';if(GAME_SETTINGS.autoLevelChoice===true){window.stackfallShowAutoChoice?.(choices[0]);selectChoice(choices[0]);return;}")],
 ['auto selection still uses normal safe choice application',progression.includes('selectChoice=function selectChoiceStable')&&progression.includes('applyChoiceSafely(c)')&&progression.includes('finishChoiceSafely()')],
 ['feature-pack random pool rejects locked weapons',feature.includes("w.starter===false||(window.stackfallIsWeaponUnlocked&&!window.stackfallIsWeaponUnlocked(key))")],
 ['stable normalizer rejects injected locked weapon choices',progression.includes("c.kind==='weapon'&&window.stackfallIsWeaponUnlocked&&!window.stackfallIsWeaponUnlocked(c.key)")],
 ['stable fallback pool rejects locked weapons',progression.includes("w.starter===false||(window.stackfallIsWeaponUnlocked&&!window.stackfallIsWeaponUnlocked(key))")],
 ['fresh profile still exposes exactly four starter weapons',meta.includes("INITIAL_WEAPONS=Object.freeze(['blade','ember','bulwark','gravity'])")],
 ['saved unlocks are rebuilt from valid cleared-stage rewards',meta.includes('function canonicalClearedStages(value)')&&meta.includes('function progressionUnlockedWeapons(clearedStages)')&&meta.includes("if(reward.type==='weapon'&&WEAPONS[reward.key])unlocked.add(reward.key)")&&!meta.includes('...sanitizeList(saved.unlockedWeapons)')],
 ['Nebula Boomerang is only granted by Stage 2 progression',catalog.includes("id:'stage-02'")&&catalog.includes("rewards:[{type:'weapon',key:'arc'}")&&!catalog.slice(catalog.indexOf("id:'stage-01'"),catalog.indexOf("id:'stage-02'")).includes("key:'arc'")],
 ['repeat Core Shard cadence belongs only to Stage 1',meta.includes("if(stageId==='stage-01'&&repeatClearCount>0&&repeatClearCount%3===0)")],
 ['choice pool still obeys unlocked equipment capacity',feature.includes("limit=window.stackfallEquipmentSlotLimit?.()||4")&&progression.includes("limit=window.stackfallEquipmentSlotLimit?.()||4")],
 ['level-choice owners load after settings and progression remains final owner',index.indexOf('src/settings.js')<index.indexOf('src/progression-expansion.js')&&index.indexOf('src/feature-pack.js')<index.indexOf('src/progression-expansion.js')]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} level-choice contracts; failures=${failed}`);if(failed)process.exit(1);
