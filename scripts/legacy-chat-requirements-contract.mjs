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
const design=read('docs/GAME_DESIGN.md');

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
expect('recovered requirements are canonicalized in design',design.includes('기본 무기 시각·발동 계약')&&design.includes('공통 피격 무적시간은 **0.5초**'));

if(fail.length){
  console.error('Legacy Stackfall chat requirements failed:');
  for(const name of fail)console.error(' - '+name);
  process.exit(1);
}
console.log('Legacy Stackfall chat requirements passed.');
