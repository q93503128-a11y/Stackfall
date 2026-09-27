import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),source=read('src/weapon-awakening-effects-a14-a19.js'),design=read('docs/GAME_DESIGN.md');
const fail=[],expect=(name,ok)=>{if(!ok)fail.push(name);};

expect('A14-A19 runtime loads after A8-A13',index.includes('src/weapon-awakening-effects-a14-a19.js')&&index.indexOf('src/weapon-awakening-effects-a14-a19.js')>index.indexOf('src/weapon-awakening-effects-a8-a13.js'));

expect('Genesis Galaxy moves awakened spiral origins onto galaxy-arm nodes',source.includes('function spawnSpiralBody')&&source.includes('ox=player.x+Math.cos(galaxyAngle)*orbit')&&source.includes('oy=player.y+Math.sin(galaxyAngle)*orbit')&&source.includes('awGenesis:true'));
expect('Genesis Galaxy counts only non-echo original casts',source.includes("if(!awake('spiral')||echoed)return")&&source.includes('player.awSpiralCycle%4===0')&&source.includes('triggerGenesisGalaxy'));
expect('Counter-Spiral Galaxy works before and after awakening without recursive signature count',source.includes("if(!echoed&&state.weaponAugments?.spiral)fireCounterSpiral")&&source.includes("source:'spiral-counter'")&&source.includes('fireAwakenedSpiral(n,echoed,false)'));

expect('Mirror Sanctuary charges at most six shared faces from original casts and reflected shots',source.includes('player.awMirrorFaces=[null,null,null,null,null,null]')&&source.includes('chargeMirrorFace')&&source.includes('for(const snap of reflected)chargeMirrorFace(snap.a)'));
expect('Perfect Reflection waits 0.18 seconds and clears shared charge',source.includes('scheduleWeaponAction(180')&&source.includes("kind:'mirror-sanctuary'")&&source.includes('player.awMirrorFaces=[null,null,null,null,null,null]'));
expect('Twin-Face Reflection is restored before and after awakening',source.includes('function mirrorTwinRays')&&source.includes("'#dffdf7','mirror-twin-reflect',1")&&source.includes('if(state.weaponAugments?.mirror)for(const snap of reflected)'));
expect('Perfect Reflection caps augment shield gain',source.includes('beforeShield=Number(player.shield)||0')&&source.includes('beforeShield+Math.min(22,profile.gain*5)'));

expect('Black-Star Lotus creates a bounded 0.85 second residual field',source.includes('life:.85,max:.85')&&source.includes('while(lotusFields.length>3)')&&source.includes('closeLotus'));
const lotusBlock=source.slice(source.indexOf('// A16 — Black-Star Lotus.'),source.indexOf('// A17 — Phase Starrail.'));
expect('Black-Star Lotus preserves Devouring Pollen scaling exactly once',lotusBlock.includes('1+absorbed*.06')&&lotusBlock.includes('1+absorbed*.025')&&!lotusBlock.includes('1+field.absorbed*.06'));
expect('Black-Star Lotus preserves the base forced-bloom power exactly once',lotusBlock.includes('r:radius*(forced?.78:1),damage,life:.85')&&!lotusBlock.includes('damage:damage*(forced?.70:1)'));
expect('Lotus fields do not directly plant or force-bloom seeds',lotusBlock.includes('lotusFields.push({id:state.nextId++,x:seed.x,y:seed.y,n,r:radius')&&!lotusBlock.includes('plantVacuumSeed(')&&!lotusBlock.includes('beginVacuumBloom('));
expect('Black-Star Lotus uses existing vacuum damage family',source.includes("source:'vacuum-bloom'")||source.includes("'vacuum-bloom'"));

expect('Phase Starrail records one node per deployment and excludes phantom nodes',source.includes('function recordStarrailNode')&&source.includes('for(const m of newMines){if(!m||m.phantom)continue')&&source.includes('player.awMineDeployCycle%5===0'));
expect('Phase Starrail keeps at most six recent nodes',source.includes('while(starrailNodes.length>6)starrailNodes.shift()'));
expect('Phase Starrail detonates one representative real mine per traversed node',source.includes('for(const id of node.mineIds)')&&source.includes('if(d2<best){best=d2;mine=candidate;}')&&source.includes('if(mine)detonatePhaseMine(mine,.82)'));

expect('Starbreaker Arsenal counts only original non-echo salvos and triggers every third',source.includes("if(!awake('missile')||echoed)return baseFireInterstellarMissiles(n,echoed)")&&source.includes('player.awMissileCycle%3===0'));
expect('Starbreaker surround uses one priority target and synchronized group signal',source.includes('target=strongestPostRosterEnemy')&&source.includes('awGroup:group')&&source.includes('stat.ready>=required')&&source.includes('other.awSignalTimer=.15'));
expect('Starbreaker requires at least three gathered missiles when the salvo has three or more',source.includes('required=Math.min(3,stat.count)'));
expect('MIRV remains available only after surround missiles begin their dive',source.includes("m.awStage==='hold'")&&source.includes("m.awStage='dive'")&&source.includes("if(state.weaponAugments?.missile&&d<118)splitMirvMissile(m,target)"));
expect('Multiplicity fills the same surround group rather than advancing the signature cycle',source.includes('total=native+extra')&&source.includes('multiplicity:i>=native')&&source.includes('awSlotCount:total'));

expect('Hypergate Cathedral counts network circuit completions and resets at three',source.includes('net.awGrandCharge=(net.awGrandCharge||0)+1')&&source.includes('if(net.awGrandCharge<3)return')&&source.includes('net.awGrandCharge=0'));
expect('Hypergate excludes echo networks and has a shared short completion lock',source.includes('if(!awake(\'gate\')||!net||net.echoed||net.awGrandPending)return')&&source.includes('<.12'));
expect('Hypergate Multiplicity pulses cannot accelerate Grand Transfer',source.includes('pulse.awGrandEligible=index<native')&&source.includes('pulse?.awGrandEligible!==false'));
expect('Grand Transfer rewires 2 3 and 4 gate networks without creating gates',source.includes('if(gates.length===2)')&&source.includes('else if(gates.length===3)')&&source.includes("applyRailBeam(gates[0].x,gates[0].y,gates[2].x,gates[2].y")&&!source.includes('triggerGrandTransfer(net){deployOrbitalGate'));

expect('A1-A19 implementation state is canonicalized in design',design.includes('A1~A19')&&design.includes('A14 창세 은하')&&design.includes('A19 초공간 대관문'));

for(const name of fail)console.error('FAIL',name);
console.log('Awakening A14-A19 contract failures='+fail.length);
if(fail.length)process.exit(1);
