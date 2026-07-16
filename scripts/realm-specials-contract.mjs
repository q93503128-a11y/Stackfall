import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(path,'utf8');
const checks=[];
const expect=(name,condition)=>checks.push([name,Boolean(condition)]);
const reward=read('src/reward-refinement.js');
const realm=read('src/render-space.js');
const dark=read('src/dark-cosmic-polish.js');
const perf=read('src/performance-guard.js');
const bosses=read('src/bosses.js');
const catalog=read('src/boss-catalog.js');
const events=read('src/map-event-expansion.js');
const endgame=read('src/endgame-balance-expansion.js');
const ledger=read('src/ability-ledger-audit.js');
const core=read('src/core.js');
const progression=read('src/progression-expansion.js');

expect('eclipse exact description',reward.includes('체력 50% 미만부터 추가 피해가 증가해 체력 30% 이하에서 총 최대 +50%')&&ledger.includes('30% 이하에서 총 최대 +50%'));
expect('eclipse real damage function',reward.includes('ECLIPSE_BASE_DAMAGE=.20')&&reward.includes('ECLIPSE_LOW_HEALTH_DAMAGE=.30')&&reward.includes('ECLIPSE_SURGE_START=.50')&&reward.includes('ECLIPSE_THRESHOLD=.30')&&reward.includes('(ECLIPSE_SURGE_START-ratio)/(ECLIPSE_SURGE_START-ECLIPSE_THRESHOLD)')&&reward.includes('amount*=1+eclipseDamageBonus()'));
expect('max health passive buffs',core.includes('최대 체력 +24, 즉시 체력 36 회복')&&progression.includes('player.maxHp+=24')&&progression.includes('player.maxHp*1.10')&&reward.includes('player.maxHp+=24')&&reward.includes('player.maxHp*1.10'));
expect('five real weapon special branches',['overcharge','cycle','elite','opening','recycle'].every(key=>reward.includes(`${key}:{`)));
expect('owned weapons gate reward pool',reward.includes('for(const key of ownedWeaponKeys())')&&reward.includes('if(weaponCount(key)>0'));
expect('four boss reward choices',reward.includes('while(out.length<4')&&endgame.includes('.slice(0,4)'));
expect('specials have actual damage/cycle/recycle logic',reward.includes('weaponSpecialDamageMultiplier')&&reward.includes('accelerateWeaponCycles')&&reward.includes('applyWeaponRecycle'));
expect('stable realm serial ownership',realm.includes('realmTransitionSerial')&&realm.includes('state.realmTransition!==tr')&&realm.includes('owner:options.owner||null'));
expect('realm cancel helper',realm.includes('function cancelRealmTransition')&&realm.includes('window.cancelRealmTransition'));
expect('no duplicate apex encounter override',!dark.includes('beginApexEncounter=function beginCinematicApexEncounter'));
expect('canonical background only',!perf.includes('drawBackground=function optimizedBackground')&&!perf.includes('function themeVisual(theme)'));
expect('quality reduction requires measured lag',perf.includes('function tier(){return performanceTier;}')&&perf.includes('slowDebt>=5.5?2:slowDebt>=2?1:0')&&perf.includes('frameMs>38&&slowDebt>=5.5'));
expect('void owned transitions',events.includes("owner:'void-entry'")&&events.includes("owner:'void-exit'")&&events.includes("owner:'void-abort'"));
expect('apex owned transitions',bosses.includes("owner:'apex-entry'")&&bosses.includes("owner:'apex-exit'")&&bosses.includes('state.apexArena=apexArena'));
expect('uncapped late damage growth',endgame.includes('Math.pow(minutes,1.14)')&&!endgame.includes('Math.min(.58'));
expect('uncapped late speed growth',endgame.includes('Math.pow(minutes,1.10)')&&!endgame.includes('Math.min(.38'));
expect('no logarithmic enemy growth',![endgame,catalog,bosses].some(text=>/Math\.log/.test(text)));
expect('uncapped apex speed and reciprocal cooldown',catalog.includes('speedScale=1+cycle*.05')&&catalog.includes('cooldownScale=1/(1+cycle*.09)'));
expect('uncapped ranged projectile pressure',bosses.includes('225+threat*7')&&bosses.includes('1.75/(1+Math.max(0,threat-1)*.055)'));

const prefix=realm.slice(0,realm.indexOf('function transitionColor'));
const context={
  window:{},state:{mode:'playing',realmTheme:'space',realmTransition:null,hitStop:0,camera:{shake:0}},
  ui:{touch:{classList:{add(){},remove(){}}}},clearPendingCombatActions(){},
  matchMedia(){return{matches:false}},innerWidth:1280,TAU:Math.PI*2,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),Math
};
vm.createContext(context);vm.runInContext(prefix,context);
let midpoint=0;
context.startRealmTransition('void',{owner:'void-entry',duration:1,onMidpoint(){midpoint++;context.startRealmTransition('space',{owner:'replacement',duration:1});}});
context.updateRealmTransition(.5);
expect('midpoint replacement survives',midpoint===1&&context.state.realmTransition?.owner==='replacement'&&context.state.realmTheme==='space');
context.updateRealmTransition(1.1);
expect('replacement completes to stable space',context.state.realmTransition===null&&context.state.realmTheme==='space'&&context.state.mode==='playing');
context.startRealmTransition('apex-forge',{owner:'apex-entry',apex:true,form:'starforge',duration:1});
expect('apex transition keeps ownership',context.state.realmTransition?.owner==='apex-entry'&&context.state.realmTransition?.apex===true&&context.state.realmTransition?.form==='starforge');
context.cancelRealmTransition('space');
expect('cancel restores space',context.state.realmTransition===null&&context.state.realmTheme==='space');

let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
console.log(`Checked ${checks.length} contracts; failures=${failed}`);
if(failed)process.exit(1);
