import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),meta=read('src/meta-progression.js'),upgrade=read('src/meta-upgrades.js'),entities=read('src/render-entities.js'),feature=read('src/feature-pack.js'),iface=read('src/interface.js'),progression=read('src/progression-expansion.js'),stage=read('src/stage-catalog.js'),runtime=read('src/stage-runtime.js'),styles=read('styles.css'),lang=read('src/language-pack.js');
const checks=[
 ['meta save stores two currencies upgrade levels and stage clear counts',meta.includes("currencies:{stardust:0,coreShard:0}")&&meta.includes('upgrades:{}')&&meta.includes('stageClearCounts')&&meta.includes('stackfallSetUpgradeLevel')],
 ['main hub exposes clickable local profile and core development',index.includes('<button id="hubProfile"')&&index.includes('id="profileScreen"')&&index.includes('id="upgradeHubBtn"')&&index.includes('id="upgradeScreen"')],
 ['profile detail exposes clears runs kills slots weapons best time and currencies',['profileDetailClears','profileDetailRuns','profileDetailKills','profileDetailSlots','profileDetailWeapons','profileDetailBest','profileDetailStardust','profileDetailCoreShard'].every(id=>index.includes('id="'+id+'"'))&&upgrade.includes("profileEntry?.addEventListener('click',openProfile)")],
 ['upgrade screen centers the exact shared in-game player renderer with floating nodes',index.includes('id="upgradeCoreCanvas"')&&index.includes('id="upgradeNodes"')&&styles.includes('.upgrade-node{position:absolute')&&upgrade.includes('stackfallDrawPlayerCorePreview')&&entities.includes('function drawPlayerCrystalCoreModel')&&entities.includes('window.stackfallDrawPlayerCorePreview')],
 ['fresh non-basic equipment capacity is four slots',upgrade.includes('return 4+fifth+sixth')],
 ['slot V and VI are permanent unlock upgrades',upgrade.includes("id:'slot5'")&&upgrade.includes("id:'slot6'")&&upgrade.includes("requires:'slot5'")],
 ['feature-pack HUD renders only unlocked non-basic slots',feature.includes("const limit=window.stackfallEquipmentSlotLimit?.()||4")&&feature.includes('for(let i=0;i<limit;i++)')],
 ['feature-pack level-up pool respects slot limit',feature.includes("slots=state.weaponSlots.length,limit=window.stackfallEquipmentSlotLimit?.()||4")&&feature.includes('slots<limit')],
 ['base and stable fallback pools also respect slot limit',iface.includes('stackfallEquipmentSlotLimit')&&progression.includes('stackfallEquipmentSlotLimit')&&!iface.includes('slots<6')&&!progression.includes('slots<6')],
 ['basic core remains visually separate from non-basic capacity',feature.includes("sf2SlotMarkup('core',true)")&&feature.includes("'<div class="slot-divider"")],
 ['permanent upgrades affect damage haste health magnet and armor',upgrade.includes('metaUpgradeDamageMult')&&upgrade.includes('metaUpgradeHasteMult')&&upgrade.includes('metaUpgradeResetGame')&&upgrade.includes('metaUpgradeMagnetRange')&&upgrade.includes('metaUpgradeDamageReduction')],
 ['Stardust gain upgrade affects resource income',upgrade.includes('stackfallCurrencyMultiplier')&&upgrade.includes("level('salvage')*.08")],
 ['Stage 1 grants repeat Stardust and first-clear Core Shard',stage.includes("{type:'currency',key:'stardust',amount:140}")&&stage.includes("{type:'currency',key:'coreShard',amount:1,firstClearOnly:true}")],
 ['Core Shards remain repeatably earnable every third repeat stage clear',meta.includes('const repeatClearCount=Math.max(0,clearCount-1)')&&meta.includes('repeatClearCount%3===0')&&meta.includes("meta.currencies.coreShard=currency('coreShard')+1")],
 ['stage result displays recovered currencies',runtime.includes('result.currency?.stardust')&&runtime.includes('result.currency?.coreShard')],
 ['failed or Endless runs award Stardust and record lifetime runs',upgrade.includes('function runStardustReward')&&upgrade.includes('stackfallRecordRun?.(kills)')],
 ['Apex and Void kills feed long-term currencies without twin double rewards',upgrade.includes("kind==='apex'")&&upgrade.includes("kind==='void'&&isRewardTwin")&&upgrade.includes("grantRunCurrency('coreShard',1)")&&upgrade.includes('twinGroup')],
 ['game-over screen exposes recovered currency result',index.includes('id="resultCurrencyReward"')&&styles.includes('.result-currency-reward')],
 ['desktop upgrade screen is viewport-contained while compact layouts may scroll',styles.includes('.upgrade-screen{position:absolute')&&styles.includes('overflow:hidden')&&styles.includes('height:calc(100dvh - 36px)')&&styles.includes('@media(max-width:900px){.upgrade-screen{padding:12px;overflow:auto}'))],
 ['profile emblem avoids the old crosshair construction',styles.includes('.profile-emblem-large')&&styles.includes('rotate(-18deg)')&&!styles.includes('.hub-profile-core:before{width:2px;height:56px}')],
 ['all supported languages include upgrade currency and profile labels',(lang.match(/'upgrade\.title'/g)||[]).length>=6&&(lang.match(/'currency\.stardust'/g)||[]).length>=6&&(lang.match(/'profile\.localSave'/g)||[]).length>=6]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} meta upgrade contracts; failures=${failed}`);if(failed)process.exit(1);
