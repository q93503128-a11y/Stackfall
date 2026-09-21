import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),meta=read('src/meta-progression.js'),upgrade=read('src/meta-upgrades.js'),feature=read('src/feature-pack.js'),iface=read('src/interface.js'),progression=read('src/progression-expansion.js'),stage=read('src/stage-catalog.js'),runtime=read('src/stage-runtime.js'),styles=read('styles.css'),lang=read('src/language-pack.js');
const checks=[
 ['meta save stores two currencies and upgrade levels',meta.includes("currencies:{stardust:0,coreShard:0}")&&meta.includes('upgrades:{}')&&meta.includes('stackfallSetUpgradeLevel')],
 ['main hub exposes local profile and core development',index.includes('id="hubProfile"')&&index.includes('id="upgradeHubBtn"')&&index.includes('id="upgradeScreen"')],
 ['upgrade screen centers a player-core canvas with floating nodes',index.includes('id="upgradeCoreCanvas"')&&index.includes('id="upgradeNodes"')&&styles.includes('.upgrade-node{position:absolute')&&upgrade.includes('function drawCore(')],
 ['fresh non-basic equipment capacity is four slots',upgrade.includes('return 4+fifth+sixth')],
 ['slot V and VI are permanent unlock upgrades',upgrade.includes("id:'slot5'")&&upgrade.includes("id:'slot6'")&&upgrade.includes("requires:'slot5'")],
 ['feature-pack HUD renders only unlocked non-basic slots',feature.includes("const limit=window.stackfallEquipmentSlotLimit?.()||4")&&feature.includes('for(let i=0;i<limit;i++)')],
 ['feature-pack level-up pool respects slot limit',feature.includes("slots=state.weaponSlots.length,limit=window.stackfallEquipmentSlotLimit?.()||4")&&feature.includes('slots<limit')],
 ['base and stable fallback pools also respect slot limit',iface.includes('stackfallEquipmentSlotLimit')&&progression.includes('stackfallEquipmentSlotLimit')&&!iface.includes('slots<6')&&!progression.includes('slots<6')],
 ['basic core remains visually separate from non-basic capacity',feature.includes("sf2SlotMarkup('core',true)")&&feature.includes("'<div class="slot-divider"")],
 ['permanent upgrades affect damage haste health magnet and armor',upgrade.includes('metaUpgradeDamageMult')&&upgrade.includes('metaUpgradeHasteMult')&&upgrade.includes('metaUpgradeResetGame')&&upgrade.includes('metaUpgradeMagnetRange')&&upgrade.includes('metaUpgradeDamageReduction')],
 ['Stardust gain upgrade affects resource income',upgrade.includes('stackfallCurrencyMultiplier')&&upgrade.includes("level('salvage')*.08")],
 ['Stage 1 grants repeat Stardust and first-clear Core Shard',stage.includes("{type:'currency',key:'stardust',amount:140}")&&stage.includes("{type:'currency',key:'coreShard',amount:1,firstClearOnly:true}")],
 ['stage result displays recovered currencies',runtime.includes('result.currency?.stardust')&&runtime.includes('result.currency?.coreShard')],
 ['failed or Endless runs award Stardust and record lifetime runs',upgrade.includes('function runStardustReward')&&upgrade.includes('stackfallRecordRun?.(kills)')],
 ['Apex and Void kills feed long-term currencies without twin double rewards',upgrade.includes("kind==='apex'")&&upgrade.includes("kind==='void'&&isRewardTwin")&&upgrade.includes("grantRunCurrency('coreShard',1)")&&upgrade.includes('twinGroup')],
 ['game-over screen exposes recovered currency result',index.includes('id="resultCurrencyReward"')&&styles.includes('.result-currency-reward')],
 ['all supported languages include upgrade and currency labels',(lang.match(/'upgrade\.title'/g)||[]).length>=6&&(lang.match(/'currency\.stardust'/g)||[]).length>=6]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} meta upgrade contracts; failures=${failed}`);if(failed)process.exit(1);
