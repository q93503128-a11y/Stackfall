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
expect('Apex cadence remains eight minutes of game time',bossCatalog.includes('APEX_INTERVAL_SECONDS=480')&&core.includes('nextApexAt:480')&&core.includes('state.nextApexAt=480'));
expect('boss chain damage is registered once at the common damage sink',systemsBase.includes('registerStackfallBossChainDamage(enemy,inflicted,opts)')&&!endgame.includes('registerStackfallBossChainDamage(enemy,Math.min(hpBefore'));
expect('initial weapon pool remains four weapons',meta.includes("INITIAL_WEAPONS=Object.freeze(['blade','ember','bulwark','gravity'])"));
expect('auto level choice is saved in settings',settings.includes('GAME_SETTINGS.autoLevelChoice=saved.autoLevelChoice===true')&&settings.includes("updateDisplaySetting('autoLevelChoice'"));
expect('auto level choice immediately accepts first generated choice',progression.includes('GAME_SETTINGS.autoLevelChoice===true')&&progression.includes('selectChoice(choices[0])'));

expect('stage catalog carries discoveries and challenges',catalog.includes('discoveries:freeze')&&catalog.includes('challenges:freezeRows')&&catalog.includes("id:'stage-01'")&&catalog.includes("id:'stage-18'"));
expect('stage events remain fixed authored milestones',catalog.includes('fixedEvents:')&&catalog.includes("id:'final-boss'")&&catalog.includes("kind:'hazard'"));
expect('crashed ship marker is consumed before encounter and cleared on entry',mapEvents.includes('marker.consumed=true;state.entities.mapEvents.length=0')&&mapEvents.includes('function startCrash(){hideOverlay();state.entities.mapEvents.length=0'));
expect('world-event choices do not auto-timeout',mapEvents.includes('function armChoiceClock(')&&(mapEvents.match(/armChoiceClock\(/g)||[]).length===1);
expect('Endless event cadence stays shortened and varied',mapEvents.includes("INTERVALS={vault:[54,74],crash:[82,112],void:[132,178]}")&&mapEvents.includes("FIRST={vault:38,crash:68,void:104}"));
expect('Endless mixes authored stage enemy families by elapsed time without stage unlock gates',stageRuntime.includes("thresholds:{route:75,bloom:240,array:420}")&&stageRuntime.includes("unlockGated:false")&&stageRuntime.includes("enemy.endlessFamily=ref.family")&&!stageRuntime.includes("stackfallStageStatus?.(ref")&&design.includes('75초부터 파손 항로(route), 240초부터 심연 개화(bloom), 420초부터 침묵 중계망(array)')&&wiki.includes('75초부터 route, 240초부터 bloom, 420초부터 array'));
expect('event detection is announced and upgrade notices remain readable',mapEvents.includes("showBossNotice(m.name,tx('eventDetected'))")&&mapEvents.includes('showTimedResonance(4900)'));
expect('crashed ship pressure scales with elapsed time',mapEvents.includes('strength:1+Math.min(2.25,elapsed/430)')&&mapEvents.includes('isDreadnoughtCrashEvent'));
expect('map events announce detection and keep offscreen guidance',mapEvents.includes("showBossNotice(m.name,tx('eventDetected'))")&&mapEvents.includes('edgePoint(dx,dy)'));
expect('Void Rift exposes five boss forms',bosses.includes("BOSS_POOLS={")&&bosses.includes("void:['maw','oracle','weaver','grave','paradox']"));

expect('Prism keeps 1 second non-damaging acquisition line',prism.includes('PRISM_ACQUISITION_SECONDS=1.0')&&prism.includes('syncPrismAimBeams')&&prism.includes('if(lock.windup>0)')&&prism.includes('return;}'));
expect('Prism flashes when attack begins rather than blinking during aim',prism.includes('beginPrismAttack')&&prism.includes('lock.attackFlash=.22')&&prism.includes('prismAttackStartOrbitFlash'));

expect('normal Bulwark uses segmented armor instead of a single hex',targeting.includes('plateCount=bulwarkN>=5?8:bulwarkN>=3?7:6')&&targeting.includes('for(let i=0;i<plateCount;i++'));
expect('normal Comet Lance visibly winds up before high-speed launch',guidance.includes('COMET_WINDUP_MS=190')&&guidance.includes('stackfallDrawCometWindups')&&guidance.includes('scheduleWeaponAction(COMET_WINDUP_MS'));
expect('Comet Multiplicity shares the same windup instead of firing ahead',endgame.includes('stackfallCometWindupDelayMs')&&endgame.includes('stackfallAddCometWindup'));
expect('WebGL mode preserves visible Comet windup',gpu.includes('stackfallDrawCometWindups'));
expect('normal Boomerang changes lunar phase outbound and return',entities.includes('function boomerangMoonPhase')&&entities.includes("p?.stage==='return'")&&entities.includes('drawMoonDisc'));
expect('awakened Lunar Return also changes phase on return',awakening.includes("p.stage==='return'")&&awakening.includes('p.awMoonPhase=1-.86*clamp(p.returnLife/1.15,0,1)'));

expect('damage results include timeline series and per-series toggles',damage.includes('damageTrend')&&damage.includes('damageTrendHidden'));
expect('runtime keeps explicit x1 and x2 combat speed control',runtimeControls.includes("speed.textContent=state.gameSpeed===2?'×2':'×1'")&&runtimeControls.includes('stackfallGameSpeed'));
expect('difficulty continues to scale Stardust rewards but not unlock currency',difficulty.includes("rewardMultiplier:.85")&&difficulty.includes("rewardMultiplier:1.30")&&design.includes('무기 해금과 Core Shard는 난이도 배율로 줄이거나 늘리지 않는다'));
expect('unused awakening cores cash out at run end',design.includes('남은 코어는 런 종료 시 **1개당 기본 Stardust 40**')||design.includes('1개당 기본 Stardust 40'));
expect('shield capacity remains additive across independent sources',rewards.includes("registerShieldCapacitySource('trait-aegis'")&&rewards.includes("registerShieldCapacitySource('augment-bulwark'")&&design.includes('보호막 최대치 기여량을 **합산**'));
expect('expanded Apex arena remains 540 desktop and 350 compact',endgame.includes("state.apexArena.r=compactDevice()?350:540"));
expect('canonical design says eight-minute Apex cadence and not ten-minute cadence',design.includes('실제 게임 시간 8분(480초) 간격')&&!design.includes('초월체: 실제 게임 시간 10분 간격')&&!design.includes('10분·20분·30분'));
expect('recovered requirements are canonicalized in design',design.includes('기본 무기 시각·발동 계약')&&design.includes('공통 피격 무적시간은 **0.5초**'));

if(fail.length){
  console.error('Legacy Stackfall chat requirements failed:');
  for(const name of fail)console.error(' - '+name);
  process.exit(1);
}
console.log('Legacy Stackfall chat requirements passed.');
