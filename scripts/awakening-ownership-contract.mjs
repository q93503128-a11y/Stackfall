import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(path,'utf8');
const index=read('index.html');
const scripts=[...index.matchAll(/<script[^>]+src="(src\/[^"?]+)(?:[^"\s]*)"/g)].map(match=>match[1]);
assert.equal(scripts.at(-1),'src/canonical-weapon-visuals.js','canonical must be the actual last runtime script');
const keys=['core','blade','ember','bulwark','gravity','comet','arc','prism','chrono','ion','nova','drone','rail','spiral','mirror','vacuum','mine','missile','gate'];
const effects=['a1-a7','a8-a13','a14-a19'].map(group=>read(`src/weapon-awakening-effects-${group}.js`));
for(const key of keys)assert(effects.some(source=>source.includes(`awake('${key}')`)),`${key}: explicit signature/visual gate required`);
assert(read('src/weapon-awakening.js').includes('stackfallIsWeaponAwakened=key=>!!state.awakenedWeapons?.[key]'));
assert(!/stackfall(?:Add|Draw)CometWindup|COMET_WINDUP_MS/.test(read('src/combat-guidance-refinement.js')));
assert(!/stackfallCometWindupDelayMs|stackfallAddCometWindup/.test(read('src/endgame-balance-expansion.js')));
assert(effects[0].includes("player.awCometCycle%4!==0")&&effects[0].includes('scheduleWeaponAction(340'));
const dev=read('src/dev-tools.js');
assert(dev.includes('clearPendingCombatActions();'));
assert(dev.includes('id="devWeaponSlots"')&&dev.includes('assignSlot:assignDevSlot')&&dev.includes('setSlotAwakening:setDevSlotAwakening'),'DEV must expose per-slot loadout and awakening controls');
assert(dev.includes('stackfall.devInfiniteCurrency')&&dev.includes('stackfallSpendCurrency=cost=>window.stackfallDevInfiniteCurrency===true?true'),'DEV infinite currency must bypass spend only inside developer mode');
assert(dev.includes("params.get('dev')==='1'")&&!dev.includes("localStorage.getItem('stackfall.devMode')"),'DEV UI must require the explicit current URL query');
const metaProgression=read('src/meta-progression.js');assert(metaProgression.includes("DEV_PROFILE=new URLSearchParams(location.search).get('dev')==='1")&&!metaProgression.includes("localStorage.getItem('stackfall.devMode')"),'developer save profile must not leak onto the normal URL');
for(const group of ['First','Second','Third'])assert(dev.includes(`stackfallResetAwakening${group}SetCombat`));
assert(effects[2].includes("baseSpawnGatePulseSet(net);if(!awake('gate')||!net||!Array.isArray(net.pulses))return"));
assert(!read('src/difficulty-augment-expansion.js').includes('__stackfallAugmentAware'),'no late DOM-ready duplicate augment wrapper');
assert(effects[1].includes('function fallingStarFleetDrones')&&effects[2].includes('function genesisGalaxyFire'));
assert(read('src/systems.js').includes('function updateWells(dt){return updateWellBodies(dt);}'));
assert(read('src/performance-guard.js').includes('updateWellBodies=function spatialWellUpdate'));
assert(!/updateWells\s*=/.test(read('src/performance-guard.js')),'optimizer must preserve reward wrapper');
for(const token of ['syncEmergencySprites','stackfallCanUseSimplifiedGpuFrame','stackfallDrawCometWindups'])
  assert(!read('src/gpu-renderer.js').includes(token),`dead/destructive GPU path: ${token}`);
assert(!/stackfallResolutionScale\s*=\s*\.(?:30|55)/.test(read('src/performance-guard.js')));
assert(!read('src/render-entities.js').includes("orbitWeaponRaster('prism'"));
assert(!read('src/endgame-balance-expansion.js').includes('if(bladeN&&extra){'));
const renderEntities=read('src/render-entities.js');
assert(renderEntities.includes("quadraticCurveTo(0,-p.r*1.05,p.r*1.15,0)")&&!renderEntities.includes('function boomerangMoonPhase(p)'),'BASE boomerang must retain the authored non-lunar curved blade silhouette');
assert(effects[0].includes('function drawMoonBoomerang(p)')&&effects[0].includes('p.awMoonPhase'),'A7 awakening must own the lunar phase transformation');

// Execute the canonical closure with a recording Canvas, rather than trusting
// descriptive diagnostics or looking only for a sourceFamily string.
const calls=[];
function recordingContext(record=false){
  return new Proxy({},{get:(_target,key)=>key==='drawImage'?((surface,...args)=>{if(record)calls.push({surface,args});}):
    key==='createLinearGradient'||key==='createRadialGradient'?(()=>({addColorStop(){}})):(()=>{}),set:()=>true});
}
class Surface{constructor(width,height){this.width=width;this.height=height;}getContext(){return recordingContext();}}
const state={entities:{projectiles:[]},weaponStacks:{},awakenedWeapons:{}};
let delegates=0;
const context={state,player:{x:0,y:0,angle:0,r:12,shield:0},vw:800,vh:600,ctx:recordingContext(true),OffscreenCanvas:Surface,
  GAME_SETTINGS:{},TAU:Math.PI*2,COLORS:{pink:'#ff88aa'},performance:{now:()=>1000},
  clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),weaponCount:key=>state.weaponStacks[key]||0,stat:()=>0,shieldCapacity:()=>100,
  weaponSizeMultiplier:()=>1,orbitRadiusFor:()=>60,drawBoomerangs(){},drawProjectiles:null,drawDefenseBarrier:null,drawGravityLens:null,
  drawEquippedOrbits(){delegates++;}};
context.window=context;
context.stackfallIsWeaponAwakened=key=>!!state.awakenedWeapons[key];
vm.runInNewContext(read('src/canonical-weapon-visuals.js'),context);
const families={
  core:['core','core-echo','core-nova','core-ricochet','core-multiplicity'],
  ember:['ember','echo-star','ember-multiplicity','star-spark','apex-forge-star'],
  comet:['comet','echo-comet','comet-afterimage','comet-multiplicity'],
  'blade-wave':['wave','blade-shear','blade-wave'],
  shard:['barrier-lance','echo-reflect','comet-fragment','singularity-shard','mirror-return','mirror-counter','mirror-twin-reflect','mirror-multiplicity'],
  drone:['meteor-drone','echo-drone','drone-burst','drone-multiplicity'],
  spiral:['spiral-bolt','echo-spiral','spiral-counter','spiral-multiplicity'],gate:['gate-crossfeed']
};
const rasterSizes={core:[176,80],ember:[260,112],comet:[280,112],'blade-wave':[184,104],shard:[150,72],drone:[178,78],spiral:[132,72],gate:[164,84]};
function render(projectile){calls.length=0;state.entities.projectiles=[{x:0,y:0,r:5,vx:100,vy:0,life:1,...projectile}];context.drawProjectiles();assert.equal(calls.length,1);return calls[0];}
for(const [family,sources]of Object.entries(families))for(const source of sources){
  const draw=render({source});assert.deepEqual([draw.surface.width,draw.surface.height],rasterSizes[family],`${source}: wrong raster family`);
  assert.equal(context.stackfallCanonicalWeaponVisualDiagnostics().unknownProjectileSources.length,0,source);
}
const before=render({source:'ember'});state.awakenedWeapons.ember=true;const after=render({source:'ember'});
assert.equal(before.surface,after.surface,'existing ordinary Ember changed raster when owner awakened');
assert.deepEqual(before.args,after.args,'ordinary Ember changed dimensions when owner awakened');
const child=render({source:'ember',awakeningChild:true});assert.notEqual(child.surface,before.surface);
const copied=render({source:'gate-crossfeed',playerVisual:'ember',awakeningChild:true});assert.equal(copied.surface,child.surface);assert.deepEqual(copied.args,child.args);
state.weaponStacks.blade=6;state.awakenedWeapons.blade=false;calls.length=0;context.drawEquippedOrbits(400,300,1000);assert.equal(calls.length,3,'six stacks must draw BASE blades');
state.awakenedWeapons.blade=true;calls.length=0;context.drawEquippedOrbits(400,300,1000);assert.equal(calls.length,0,'canonical must delegate awakened blades');assert.equal(delegates,2);
console.log(`Awakening ownership: 19 explicit gates, ${Object.values(families).flat().length} source routes, provenance and base/awake delegation PASS`);
