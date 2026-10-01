import fs from 'node:fs';
import vm from 'node:vm';

const catalogContext={window:{}};
vm.runInNewContext(fs.readFileSync('src/stage-catalog.js','utf8'),catalogContext);
export const stageCatalog=catalogContext.window.STACKFALL_STAGE_CATALOG;
export const stageDefinition=order=>stageCatalog.find(stage=>stage.order===order);

// Exercise the authored adapter, including delayed hazard geometry. These checks
// survive a branch becoming the default branch without requiring dead strings.
export function stageHazardsWork(order,expected){
  const stage=stageDefinition(order),id=stage.id;
  let adapter,draws=0;
  const draw=(...values)=>{if(values.some(value=>typeof value==='number'&&!Number.isFinite(value)))throw new Error(`${id}: non-finite geometry`);draws++;};
  const context={window:{stackfallRegisterStageRuntime:(key,value)=>{if(key===id)adapter=value;}},state:{level:6,time:100},player:{x:37,y:23},TAU:Math.PI*2,Math,
    tr:key=>key,showBossNotice:()=>{},scheduleWeaponAction:(delay,fn)=>fn(),predictedPlayer:()=>({x:37,y:23}),rawLine:draw,addCircle:draw,spawnEnemyProjectile:draw,fireRing:draw,fireRingWithGaps:draw,
    addStagePhysicalObject:o=>draw(...Object.values(o)),compactDevice:()=>false,stackfallStageEnvironmentCombatScale:()=>({damage:1}),rand:(a,b)=>(a+b)/2,choose:values=>values[0],clamp:(n,a,b)=>Math.min(b,Math.max(a,n))};
  vm.runInNewContext(fs.readFileSync(`src/stage${String(order).padStart(2,'0')}-runtime.js`,'utf8'),context);
  return expected.every(variant=>{
    const event=stage.fixedEvents.find(e=>e.kind==='hazard'&&e.variant===variant);
    if(!event||typeof adapter?.hazard!=='function')return false;
    draws=0;adapter.hazard(event,{run:{bossIntroPending:false,bossSpawned:false},progress:.5,isActive:()=>true,spawnBurst:draw});return draws>0;
  });
}

export function stageWorldRenderer(order,source){
  return stageDefinition(order)?.id===`stage-${String(order).padStart(2,'0')}`&&
    source.includes('function drawStageWorldBackdrop(order)')&&source.includes('function drawStageConstellationField')&&
    source.includes("family=order<=6?'route':order<=12?'bloom':'array'")&&
    source.includes('ox=wrap(-(player.x||0)+drift,tw)')&&source.includes('oy=wrap(-(player.y||0),th)');
}
