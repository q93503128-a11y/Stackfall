import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/boss-catalog.js'),patterns=read('src/boss-patterns.js'),systems=read('src/systems-base.js'),renderers=read('src/elite-renderers.js'),events=read('src/map-event-expansion.js'),realm=read('src/realm-backgrounds.js'),design=read('docs/GAME_DESIGN.md'),wiki=read('docs/WIKI.md'),readme=read('README.md');
const voidStart=patterns.indexOf('function voidBossSkill(e,dt){'),voidEnd=patterns.indexOf('function fireRingWithGaps(',voidStart),voidRuntime=patterns.slice(voidStart,voidEnd);
const checks=[
 ['void pool exposes all five bosses',catalog.includes("void:['maw','oracle','weaver','grave','paradox']")],
 ['boss bags use Fisher-Yates rather than random sort',catalog.includes('function shuffledBossPool')&&catalog.includes('Math.floor(Math.random()*(i+1))')&&!catalog.includes("bag=[...pool].sort(()=>Math.random()-.5)")],
 ['bag refills avoid immediate repeats across resets',catalog.includes('state.lastBossForms=state.lastBossForms||{}')&&catalog.includes('bag[bag.length-1]===lastForm')&&catalog.includes('state.lastBossForms[kind]=form')],
 ['five void patterns remain distinct',['maw','oracle','weaver','grave','paradox'].every(form=>patterns.includes(`f==='${form}'`))],
 ['void combat owns five dedicated movement questions',['voidMawHunger','voidOracleOmen','voidWeaverLoom','voidGraveMarkers','voidParadoxCrossfire'].every(name=>patterns.includes(`function ${name}`))],
 ['maw hunger is telegraphed and never directly rewrites player position',patterns.includes("'void-maw-hunger'")&&!voidRuntime.includes('player.x+=')&&!voidRuntime.includes('player.y+=')&&!voidRuntime.includes('player.x=')&&!voidRuntime.includes('player.y=')],
 ['maw devour healing is capped and tied to hunger',patterns.includes('Math.min(.035,eaten*.0035)')&&patterns.includes('e.mawLastDevoured=eaten')],
 ['cosmetic Void guides cannot damage or trigger ordinary attack impacts',patterns.includes('function voidGuideLine')&&patterns.includes('function voidGuideCircle')&&patterns.includes("impactStyle:'void-guide'")&&patterns.includes('cosmetic:true')&&!patterns.includes("'void-maw-edge'")],
 ['oracle owns prediction sequence and intentional safe-gap ring',patterns.includes('e.oracleOmenStep=')&&patterns.includes('voidOracleGapRing')&&patterns.includes('fireRingWithGaps(e,20,138')],
 ['weaver owns rotating loom corridors',patterns.includes('e.weaverLoomStep=')&&patterns.includes('voidLanePair(target.x,target.y,angle,335,offset')&&patterns.includes("'void-weaver-thread'")],
 ['grave uses bounded sentinels instead of five-tank spam',patterns.includes('Math.max(0,3-live)')&&patterns.includes('Math.min(2,room)')&&!voidRuntime.includes("summonMinions(e,5,'tank')")],
 ['grave owns deterministic territory markers and corridor walls',patterns.includes('e.graveMarkerStep=')&&patterns.includes("'void-grave-wall'")],
 ['paradox twin coordinator owns synchronized crossfire swap and frame',patterns.includes('if(twin&&side>0)return')&&patterns.includes('voidParadoxCrossfire(e,twin,d)')&&patterns.includes('voidParadoxSwap(e,twin,d)')&&patterns.includes('voidParadoxFrame(e,twin,d)')],
 ['paradox survivor has deterministic solo fallback',patterns.includes('function voidParadoxSolo')&&patterns.includes('angle=step*2.399')],
 ['paradox still creates a real twin',systems.includes("const ELITE_SPAWN_KINDS=new Set(['mini','boss','void','apex']),ELITE_TWIN_FORMS=new Set(['mirror','paradox'])")&&systems.includes('ELITE_TWIN_FORMS.has(enemy.eliteForm)')&&systems.includes('twinSide=-1')&&systems.includes('twinSide:1')],
 ['oracle and paradox no longer reuse another boss silhouette',renderers.includes("f==='oracle'")&&renderers.includes("f==='paradox'")&&!renderers.includes("f==='archivist'||f==='oracle'")&&!renderers.includes("f==='mirror'||f==='paradox'")],
 ['maw and weaver use different silhouette geometry',renderers.includes("f==='maw'")&&renderers.includes("ctx.ellipse(0,0,e.r*1.18,e.r*.78")&&renderers.includes("f==='weaver'")&&renderers.includes('for(let i=0;i<8;i++){const a=i/8*TAU')],
 ['oracle and paradox projectiles have distinct visual families',catalog.includes("if(form==='oracle')return'rune'")&&catalog.includes("if(form==='paradox')return'mirror'")],
 ['void event publishes selected boss form',events.includes('state.mapEventActive.bossForm=boss.eliteForm||null')],
 ['void realm reacts to all five boss forms',realm.includes('function voidBossForm')&&['maw','oracle','weaver','grave','paradox'].every(form=>realm.includes(`form==='${form}'`))],
 ['canonical docs describe the five combat identities',[readme,design,wiki].every(doc=>doc.includes('HUNGER / PROPHECY / LOOM / GRAVE / PARADOX'))]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} void boss contracts; failures=${failed}`);if(failed)process.exit(1);
