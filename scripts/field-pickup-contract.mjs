import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const core=read('src/core.js');
const base=read('src/systems-base.js');
const systems=read('src/systems.js');
const pickups=read('src/field-pickups.js');
const targeting=read('src/targeting-motion-refinement.js');
const render=read('src/render.js');
const index=read('index.html');
const dev=read('src/dev-tools.js');
const checks=[];
const expect=(name,ok)=>checks.push([name,Boolean(ok)]);

expect('field pickups have a dedicated entity collection',core.includes('gems:[],fieldPickups:[]'));
expect('experience gems use explicit active state instead of a 35 second lifetime',base.includes('function experienceGemActive(g)')&&base.includes('active:true,forceCollect:forced')&&!base.includes('life:35')&&!systems.includes('g.life=Number.isFinite(g.life)?g.life-dt'));
expect('XP compression preserves value while separating forced and normal magnet cohorts',base.includes('compressExperienceGroup(forced,forcedKeep,out)')&&base.includes('compressExperienceGroup(normal,normalBudget,out)')&&base.includes("normal.length?cap-1:cap"));
expect('canonical gem update owns normal and forced attraction',systems.includes('function updateGems(dt)')&&systems.includes("pullSpeed=1+magnetStacks*.22+eventMagnet*.10")&&systems.includes('g.forceCollect===true')&&!targeting.includes('updateGems=function'));
expect('suction magnet is a physical one-shot pickup separate from Magnet Core',pickups.includes("suctionMagnet:Object.freeze({kind:'suctionMagnet',name:'흡입 자석'")&&pickups.includes("spawnFieldPickup('suctionMagnet'")&&pickups.includes('updateFieldPickups(dt)')&&pickups.includes('activateSuctionMagnet()')&&pickups.includes('gem.forceCollect=true'));
expect('suction magnet only snapshots gems that already exist',pickups.indexOf('for(const gem of state.entities.gems)')<pickups.indexOf('runtime.collected++')&&base.includes("(g.forceCollect===true)!==forced"));
expect('suction magnet drops only from minibosses and regular bosses',pickups.includes('SUCTION_MAGNET_MINI_DROP_CHANCE=.50')&&pickups.includes("isMini=enemy.type==='mini'")&&pickups.includes("isRegularBoss=enemy.type==='boss'&&enemy.kind==='boss'&&!enemy.eventKind")&&!pickups.includes('SUCTION_MAGNET_DROP_CHANCE=.0025'));
expect('field pickups update and draw from the canonical runtime',render.includes("runRuntimeStage('updateFieldPickups',updateFieldPickups,dt)")&&render.includes("runDrawStage('drawFieldPickups',drawFieldPickups)"));
expect('field pickup runtime loads directly after canonical systems',index.indexOf('src/field-pickups.js')>index.indexOf('src/systems.js')&&index.indexOf('src/field-pickups.js')<index.indexOf('src/interface.js'));
expect('developer tools can spawn a suction magnet for real browser QA',dev.includes('spawnSuctionMagnet')&&dev.includes("spawnFieldPickup('suctionMagnet'"));

let failures=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failures++;}
console.log(`Checked ${checks.length} field pickup contracts; failures=${failures}`);
if(failures)process.exit(1);
