import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync('src/stage-catalog.js','utf8'),sandbox={window:{}};vm.runInNewContext(source,sandbox);
const stages=[...(sandbox.window.STACKFALL_STAGE_CATALOG||[])],pages=[...(sandbox.window.STACKFALL_CONSTELLATIONS||[])],fail=[];
const assert=(condition,message)=>{if(!condition)fail.push(message);};
assert(stages.length>0,'stage catalog is empty');assert(pages.length>0,'constellation catalog is empty');
const stageIds=new Set(),orders=new Set(),pageIds=new Set(),pageOrders=new Set(),rewardWeapons=new Set();
for(const page of pages){assert(!pageIds.has(page.id),'duplicate constellation id '+page.id);assert(!pageOrders.has(page.order),'duplicate constellation order '+page.order);pageIds.add(page.id);pageOrders.add(page.order);}
for(let i=0;i<pages.length;i++)assert(pages[i].order===i+1,'constellation orders must be sequential');
for(let i=0;i<stages.length;i++){
  const stage=stages[i],expected=i+1;assert(stage.order===expected,'stage order gap at '+stage.id);assert(stage.id==='stage-'+String(expected).padStart(2,'0'),'stage id/order mismatch '+stage.id);assert(!stageIds.has(stage.id),'duplicate stage id '+stage.id);assert(!orders.has(stage.order),'duplicate stage order '+stage.order);stageIds.add(stage.id);orders.add(stage.order);
  assert(pageIds.has(stage.constellationId),'unknown constellation '+stage.constellationId+' for '+stage.id);assert(Number.isFinite(stage.node?.x)&&stage.node.x>0&&stage.node.x<1&&Number.isFinite(stage.node?.y)&&stage.node.y>0&&stage.node.y<1,'invalid node '+stage.id);
  const expectedPrevious=i?stages[i-1].id:null;assert((stage.requirements?.previous??null)===expectedPrevious,'broken progression predecessor '+stage.id);
  const events=[...(stage.fixedEvents||[])].sort((a,b)=>a.at-b.at),bossEvents=events.filter(event=>event.kind==='boss');assert(bossEvents.length===1,'stage must have one boss event '+stage.id);assert(stage.boss&&stage.boss.spawnAt===stage.durationSeconds,'boss arrival must equal duration '+stage.id);assert(bossEvents[0]?.at===stage.boss?.spawnAt,'boss event time mismatch '+stage.id);
  for(let j=1;j<events.length;j++)assert(events[j].at>events[j-1].at,'event times must be strictly increasing '+stage.id);
  for(const reward of stage.rewards||[])if(reward.type==='weapon'){assert(!rewardWeapons.has(reward.key),'duplicate weapon unlock '+reward.key);rewardWeapons.add(reward.key);}
}
for(const page of pages){const owned=stages.filter(stage=>stage.constellationId===page.id),coords=new Set();assert(owned.length>0,'constellation has no stages '+page.id);for(const stage of owned){const key=stage.node.x.toFixed(4)+','+stage.node.y.toFixed(4);assert(!coords.has(key),'duplicate node coordinate '+stage.id);coords.add(key);}}
for(const message of fail)console.error('FAIL',message);console.log(`Checked ${stages.length} stages across ${pages.length} constellations; failures=${fail.length}`);if(fail.length)process.exit(1);