import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/boss-catalog.js'),patterns=read('src/boss-patterns.js'),systems=read('src/systems-base.js'),renderers=read('src/elite-renderers.js'),events=read('src/map-event-expansion.js'),realm=read('src/realm-backgrounds.js');
const checks=[
 ['void pool exposes all five bosses',catalog.includes("void:['maw','oracle','weaver','grave','paradox']")],
 ['boss bags use Fisher-Yates rather than random sort',catalog.includes('function shuffledBossPool')&&catalog.includes('Math.floor(Math.random()*(i+1))')&&!catalog.includes("bag=[...pool].sort(()=>Math.random()-.5)")],
 ['bag refills avoid immediate repeats across resets',catalog.includes('state.lastBossForms=state.lastBossForms||{}')&&catalog.includes('bag[bag.length-1]===lastForm')&&catalog.includes('state.lastBossForms[kind]=form')],
 ['five void patterns remain distinct',['maw','oracle','weaver','grave','paradox'].every(form=>patterns.includes(`f==='${form}'`))],
 ['paradox still creates a real twin',systems.includes("['mirror','paradox'].includes(enemy.eliteForm)")&&systems.includes('twinSide=-1')&&systems.includes('twinSide:1')],
 ['oracle and paradox no longer reuse another boss silhouette',renderers.includes("f==='oracle'")&&renderers.includes("f==='paradox'")&&!renderers.includes("f==='archivist'||f==='oracle'")&&!renderers.includes("f==='mirror'||f==='paradox'")],
 ['maw and weaver use different silhouette geometry',renderers.includes("f==='maw'")&&renderers.includes("ctx.ellipse(0,0,e.r*1.18,e.r*.78")&&renderers.includes("f==='weaver'")&&renderers.includes('for(let i=0;i<8;i++){const a=i/8*TAU')],
 ['oracle and paradox projectiles have distinct visual families',catalog.includes("if(form==='oracle')return'rune'")&&catalog.includes("if(form==='paradox')return'mirror'")],
 ['void event publishes selected boss form',events.includes('state.mapEventActive.bossForm=boss.eliteForm||null')],
 ['void realm reacts to all five boss forms',realm.includes('function voidBossForm')&&['maw','oracle','weaver','grave','paradox'].every(form=>realm.includes(`form==='${form}'`))]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} void boss contracts; failures=${failed}`);if(failed)process.exit(1);
