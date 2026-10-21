import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const fail=[];
const expect=(name,ok)=>{if(!ok)fail.push(name);};

const bosses=read('src/bosses.js');
const mapEvents=read('src/map-event-expansion.js');
const catalog=read('src/stage-catalog.js');
const meta=read('src/meta-progression.js');
const settings=read('src/settings.js');
const progression=read('src/progression-expansion.js');
const prism=read('src/community-feedback-refinement.js');
const targeting=read('src/targeting-motion-refinement.js');
const guidance=read('src/combat-guidance-refinement.js');
const endgame=read('src/endgame-balance-expansion.js');
const systemsBase=read('src/systems-base.js');
const bossCatalog=read('src/boss-catalog.js');
const core=read('src/core.js');
const entities=read('src/render-entities.js');
const awakening=read('src/weapon-awakening-effects-a1-a7.js');
const gpu=read('src/gpu-renderer.js');
const damage=read('src/run-damage-stats.js');
const runtimeControls=read('src/runtime-controls.js');
const difficulty=read('src/difficulty-augment-expansion.js');
const stageRuntime=read('src/stage-runtime.js');
const rewards=read('src/reward-refinement.js');
const design=read('docs/GAME_DESIGN.md');
const wiki=read('docs/WIKI.md');

expect('player hit invulnerability remains 0.5 seconds',bosses.includes('player.invuln=.5')&&!bosses.includes('player.invuln=.9'));
expect('Apex cadence is ten minutes of game time',bossCatalog.includes('APEX_INTERVAL_SECONDS=600')&&core.includes('nextApexAt:600')&&core.includes('state.nextApexAt=600'));
expect('boss chain damage is registered once at the common damage sink',systemsBase.includes('registerStackfallBossChainDamage(enemy,inflicted,opts)')&&!endgame.includes('registerStackfallBossChainDamage(enemy,Math.min(hpBefore'));
expect('initial weapon pool remains four weapons',meta.includes("INITIAL_WEAPONS=Object.freeze(['blade','ember','bulwark','gravity'])"));
expect('auto level choice is saved in settings',settings.includes('GAME_SETTINGS.autoLevelChoice=saved.autoLevelChoice===true')&&settings.includes("updateDisplaySetting('autoLevelChoice'"));
expect('auto level choice immediately accepts first generated choice',progression.includes('GAME_SETTINGS.autoLevelChoice===true')&&progression.includes('selectChoice(choices[0])'));

expect('stage catalog carries discoveries and challenges',catalog.includes('discoveries:freeze')&&catalog.includes('challenges:freezeRows')&&catalog.includes("id:'stage-01'")&&catalog.includes("id:'stage-18'"));
expect('stage events remain fixed authored milestones',catalog.includes('fixedEvents:')&&catalog.includes("id:'final-boss'")&&catalog.includes("kind:'hazard'"));
expect('crashed ship marker is consumed before encounter and cleared on entry',mapEvents.includes('marker.consumed=true;state.entities.mapEvents.length=0')&&mapEvents.includes('function startCrash(){hideOverlay();state.entities.mapEvents.length=0'));
expect('world-event choices do not auto-timeout',mapEvents.includes('function armChoiceClock(')&&(mapEvents.match(/armChoiceClock\(/g)||[]).length===1);
expect('Endless event cadence covers eight varied event families with a shared anti-stack gap',mapEvents.includes("EVENT_CLOCK_KEYS=['vault','crash','void','distress','meteor','predator','relay','storm']")&&mapEvents.includes("FIRST={vault:42,distress:78,crash:118,meteor:154,predator:192,relay:232,storm:274,void:320}")&&mapEvents.includes('EVENT_GAP=58')&&mapEvents.includes('state.eventGlobalCooldown=Math.max(state.eventGlobalCooldown||0,EVENT_GAP)')&&mapEvents.includes('eligible[Math.floor(Math.random()*eligible.length)]'));
expect('Endless mixes authored stage enemy families by elapsed time without stage unlock gates',stageRuntime.includes("thresholds:{route:75,bloom:240,array:420}")&&stageRuntime.includes("unlockGated:false")&&stageRuntime.includes("enemy.endlessFamily=ref.family")&&!stageRuntime.includes("stackfallStageStatus?.(ref")&&design.includes('75초부터 파손 항로(route), 240초부터 심연 개화(bloom), 420초부터 침묵 중계망(array)')&&wiki.includes('75초부터 route, 240초부터 bloom, 420초부터 array'));
expect('event detection is announced and upgrade notices remain readable',mapEvents.includes("showBossNotice(m.name,tx('eventDetected'))")&&mapEvents.includes('showTimedResonance(4900)'));
expect('crashed ship pressure scales with elapsed time',mapEvents.includes('strength:1+Math.min(2.25,elapsed/430)')&&mapEvents.includes('isDreadnoughtCrashEvent'));
expect('map events announce detection and keep offscreen guidance',mapEvents.includes("showBossNotice(m.name,tx('eventDetected'))")&&mapEvents.includes('edgePoint(dx,dy)'));
expect('five added Endless events have distinct playable mechanics',['startDistress','updateMeteor','startPredator','updateRelay','startStorm'].every(name=>mapEvents.includes('function '+name))&&mapEvents.includes("type==='predator'")&&mapEvents.includes("type==='relay'")&&mapEvents.includes("type==='storm'"));
expect('campaign stages use authored event plans instead of Endless random scheduling',stageRuntime.includes('STAGE_WORLD_EVENT_PLAN')&&stageRuntime.includes("1:Object.freeze([{at:.34,type:'vault'}")&&stageRuntime.includes("3:Object.freeze([{at:.20,type:'vault'},{at:.50,type:'crash'}")&&stageRuntime.includes("6:Object.freeze([{at:.14,type:'meteor'}")&&stageRuntime.includes("10:Object.freeze([{at:.13,type:'void'}")&&stageRuntime.includes("14:Object.freeze([{at:.10,type:'storm'}")&&!stageRuntime.includes('stageAwareMapEvents'));
expect('final stage boss death has callback and frame-level victory fallbacks',stageRuntime.includes('function ensureStageVictory')&&stageRuntime.includes('if(!boss||boss.dead)ensureStageVictory')&&stageRuntime.includes('window.stackfallEnsureStageVictory=ensureStageVictory')&&read('src/render.js').includes("runRuntimeStage('ensureStageVictory',stackfallEnsureStageVictory)"));
expect('excluded bounty and gravity-wreck events are not scheduled',!mapEvents.includes("'bounty'")&&!mapEvents.includes("'gravity-wreck'"));
expect('Void Rift exposes five boss forms',bossCatalog.includes("BOSS_POOLS={")&&bossCatalog.includes("void:['maw','oracle','weaver','grave','paradox']"));

expect('Prism keeps 1 second non-damaging acquisition line',prism.includes('PRISM_ACQUISITION_SECONDS=1.0')&&prism.includes('syncPrismAimBeams')&&prism.includes('if(lock.windup>0)')&&prism.includes('return;}'));
expect('Prism flashes when attack begins rather than blinking during aim',prism.includes('beginPrismAttack')&&prism.includes('lock.attackFlash=.22')&&prism.includes('prismAttackStartOrbitFlash'));

expect('normal Bulwark uses segmented armor instead of a single hex',read('src/canonical-weapon-visuals.js').includes('barrierSegmentPath')&&read('src/canonical-weapon-visuals.js').includes('canonicalDefenseBarrier'));
expect('developer slot editor can explicitly refresh live slot state',read('src/dev-tools.js').includes('id="devRefreshSlots"')&&read('src/dev-tools.js').includes('const refreshDevPanel=')&&read('src/dev-tools.js').includes('data-slot-refresh'));
expect('developer panel uses Tab toggle and keeps special reward launcher',read('src/dev-tools.js').includes("event.code!=='Tab'")&&read('src/dev-tools.js').includes('event.stopImmediatePropagation()')&&read('src/dev-tools.js').includes('id="devReward"')&&read('src/dev-tools.js').includes('function openSpecialReward()')&&read('src/dev-tools.js').includes('window.updateRewardQueue?.()'));
expect('developer Tab has priority over the normal ability ledger capture handler',read('src/dev-tools.js').includes('togglePanel:toggleDevPanel')&&read('src/render.js').includes("const devTab=e.code==='Tab'")&&read('src/render.js').includes('window.stackfallDeveloperTest.togglePanel()'));
expect('developer panel exposes invincibility level-up lock and all-stage completion',read('src/dev-tools.js').includes('id="devInvincible"')&&read('src/dev-tools.js').includes('id="devNoLevel"')&&read('src/dev-tools.js').includes('id="devClearStages"')&&read('src/dev-tools.js').includes('function completeAllStages()'));
expect('local profile nickname and permanent-record details are persistent',read('src/meta-progression.js').includes('stackfallSetProfileName=setProfileName')&&read('src/meta-progression.js').includes('stackfallRecordBossDefeat=recordBossDefeat')&&read('src/meta-upgrades.js').includes('function saveProfileName()')&&read('index.html').includes('id="profileNameInput"')&&read('index.html').includes('id="profileDetailStageClears"')&&read('index.html').includes('id="profileStageClearGrid"')&&!read('index.html').includes('profileDetailBest'));
expect('normal Comet Lance fires immediately',guidance.includes('fireComet=function rangedCometVolley')&&!guidance.includes('COMET_WINDUP_MS')&&!guidance.includes('stackfallAddCometWindup'));
expect('Comet Multiplicity has no awakening windup',!endgame.includes('stackfallCometWindupDelayMs')&&!endgame.includes('stackfallAddCometWindup')&&endgame.includes('multiplicityComet'));
expect('Final Comet owns the sole charge path',!gpu.includes('stackfallDrawCometWindups')&&awakening.includes("kind:'comet-charge'")&&awakening.includes('scheduleWeaponAction(340')&&awakening.includes('pierce:999'));
expect('normal Boomerang retains its non-lunar curved energy blade',!entities.includes('boomerangMoonPhase')&&!entities.includes('drawMoonDisc')&&entities.includes('quadraticCurveTo(0,-p.r*1.05,p.r*1.15,0)'));
expect('awakened Lunar Return owns the lunar phase transformation',awakening.includes('function drawMoonBoomerang(p)')&&awakening.includes("p.stage='return'")&&awakening.includes('p.awMoonPhase=1-.86*clamp(p.returnLife/1.15,0,1)'));

expect('damage results include timeline series and per-series toggles',damage.includes('damageTrend')&&damage.includes('damageTrendHidden'));
expect('runtime keeps explicit x1 and x2 combat speed control',runtimeControls.includes("speed.textContent=state.gameSpeed===2?'×2':'×1'")&&runtimeControls.includes('stackfallGameSpeed'));
expect('difficulty continues to scale Stardust rewards but not unlock currency',difficulty.includes("rewardMultiplier:.85")&&difficulty.includes("rewardMultiplier:1.40")&&difficulty.includes("rewardMultiplier:1.70")&&design.includes('무기 해금과 Core Shard는 난이도 배율로 줄이거나 늘리지 않는다'));
expect('unused awakening cores cash out at run end',design.includes('남은 코어는 런 종료 시 **1개당 기본 Stardust 40**')||design.includes('1개당 기본 Stardust 40'));
expect('shield capacity remains additive across independent sources',rewards.includes("registerShieldCapacitySource('trait-aegis'")&&rewards.includes("registerShieldCapacitySource('augment-bulwark'")&&design.includes('보호막 최대치 기여량을 **합산**'));
expect('expanded Apex arena remains 540 desktop and 350 compact',endgame.includes("state.apexArena.r=compactDevice()?350:540"));
expect('canonical design says ten-minute Apex cadence',design.includes('실제 게임 시간 10분(600초) 간격')&&design.includes('10분·20분·30분'));
expect('recovered requirements are canonicalized in design',design.includes('기본 무기 시각·발동 계약')&&design.includes('공통 피격 무적시간은 **0.5초**'));

if(fail.length){
  console.error('Legacy Stackfall chat requirements failed:');
  for(const name of fail)console.error(' - '+name);
  process.exit(1);
}
console.log('Legacy Stackfall chat requirements passed.');
