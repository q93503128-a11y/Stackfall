import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),source=read('src/weapon-awakening-effects-a1-a7.js'),design=read('docs/GAME_DESIGN.md');
const fail=[],expect=(name,ok)=>{if(!ok)fail.push(name);};

expect('A1-A7 runtime loads after awakening selection and before A8-A13',index.includes('src/weapon-awakening-effects-a1-a7.js')&&index.indexOf('src/weapon-awakening-effects-a1-a7.js')>index.indexOf('src/weapon-awakening.js')&&index.indexOf('src/weapon-awakening-effects-a1-a7.js')<index.indexOf('src/weapon-awakening-effects-a8-a13.js'));

expect('Stellar Core replaces every awakened Core Pulse with one central lance and three satellite lances',source.includes("if(!awake('core'))return baseSpawnCoreShot")&&source.includes("playerVisual:echoed?'echo-stellar-core-lance':'stellar-core-lance'")&&source.includes("playerVisual:echoed?'echo-stellar-core-node':'stellar-core-node'")&&source.includes('for(let i=0;i<3;i++')&&!source.includes('awCoreCycle%4'));
expect('Eclipse Blades has no periodic gathering signature',!source.includes('triggerEclipseCut')&&!source.includes('fireEclipseBladeWaves')&&!source.includes('awBladeWindup')&&!source.includes("kind:'blade-align'"));
expect('Eclipse Blades uses five native blades and a continuous slow-fast-slow orbit cycle',source.includes('function bladeOrbitSpeedMultiplier')&&source.includes('return .68+wave*1.62')&&source.includes('nativeCount=5')&&source.includes('stackfallAwakenedBladeOrbitSpeedMultiplier'));

expect('Nebula Starcaster tracks consecutive hits on one target',source.includes('awEmberTargetId:null')&&source.includes('targetId!==player.awEmberTargetId')&&source.includes('player.awEmberHits=0'));
expect('Nebula Starcaster signature charge accepts only original caster hits',source.includes("awake('ember')&&wasAlive&&source==='ember'")&&!source.includes("['ember','echo-star','ember-multiplicity'].includes(source)"));
expect('Nebula Starcaster signature damage is guarded against recursive charge',source.includes('emberSignatureGuard=true')&&source.includes('!emberSignatureGuard'));
expect('Nebula Starcaster awakening replaces ordinary fire with red meteor volleys',source.includes('function awakenedRedMeteorCaster')&&source.includes("playerVisual:'ember-awakened'")&&source.includes("color:core?'#fff0f2':'#ff3b5d'")&&source.includes('awEmberMeteorVolley%4===0'));

expect('Celestial Bastion counterwave is tied to a real shield break',source.includes('beforeShield>0&&player.shield<=0')&&source.includes("'barrier-lance',{shake:false}"));
expect('Celestial Bastion gains an active fortress lance volley while awakened',source.includes('function fireBastionVolley')&&source.includes("playerVisual:'bulwark-awakened'")&&source.includes('awBulwarkVolleyCd')&&source.includes("source:'barrier-lance'"));
expect('Binary Collapse excludes Multiplicity wells from the paired signature',source.includes("filter(w=>w&&!w.multiplicity)")&&source.includes('w.awBinaryMerged=true'));
expect('Binary Collapse visibly orbits then converges its pair before final collapse',source.includes('awBinaryMergeX')&&source.includes('awBinaryOrbitR')&&source.includes("if(life>.92)")&&source.includes("(state.time||0)*1.35")&&source.includes('Math.hypot(pair[0].x-pair[1].x'));
expect('Final Comet Lance counts only non-echo original casts',source.includes("if(!awake('comet')||echoed||!target)return")&&source.includes('player.awCometCycle%4!==0')&&source.includes('scheduleWeaponAction(340')&&source.includes('pierce:999')&&source.includes('awakeningChild:true'));
expect('Lunar Return has a bounded lunar orbit and one return ripple',source.includes("p.stage='lunarOrbit'")&&source.includes('p.awOrbitDuration=.48')&&source.includes('!p.awMoonRippleDone'));

expect('A1-A7 implementation state is canonicalized in design',design.includes('A1~A19')&&design.includes('A3. Starlight Caster')&&design.includes('A7. Nebula Boomerang'));

for(const name of fail)console.error('FAIL',name);
console.log('Awakening A1-A7 contract failures='+fail.length);
if(fail.length)process.exit(1);
