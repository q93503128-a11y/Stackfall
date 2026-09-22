import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),source=read('src/weapon-awakening-effects-a1-a7.js'),design=read('docs/GAME_DESIGN.md');
const fail=[],expect=(name,ok)=>{if(!ok)fail.push(name);};

expect('A1-A7 runtime loads after awakening selection and before A8-A13',index.includes('src/weapon-awakening-effects-a1-a7.js')&&index.indexOf('src/weapon-awakening-effects-a1-a7.js')>index.indexOf('src/weapon-awakening.js')&&index.indexOf('src/weapon-awakening-effects-a1-a7.js')<index.indexOf('src/weapon-awakening-effects-a8-a13.js'));

expect('Stellar Core signature counts only original non-echo casts',source.includes("if(!awake('core')||echoed||!target)return")&&source.includes('player.awCoreCycle%4!==0')&&source.includes('awakeningChild:true'));
expect('Eclipse Blades uses a bounded align windup before its cut',source.includes("kind:'blade-align'")&&source.includes('player.awBladeWindup=.24')&&source.includes('triggerEclipseCut()'));

expect('Nebula Starcaster tracks consecutive hits on one target',source.includes('awEmberTargetId:null')&&source.includes('targetId!==player.awEmberTargetId')&&source.includes('player.awEmberHits=0'));
expect('Nebula Starcaster signature charge accepts only original caster hits',source.includes("awake('ember')&&wasAlive&&source==='ember'")&&!source.includes("['ember','echo-star','ember-multiplicity'].includes(source)"));
expect('Nebula Starcaster signature damage is guarded against recursive charge',source.includes('emberSignatureGuard=true')&&source.includes('!emberSignatureGuard'));

expect('Celestial Bastion counterwave is tied to a real shield break',source.includes('beforeShield>0&&player.shield<=0')&&source.includes("source:'barrier-lance'"));
expect('Binary Collapse excludes Multiplicity wells from the paired signature',source.includes("filter(w=>w&&!w.multiplicity)")&&source.includes('w.awBinaryMerged=true'));
expect('Final Comet Lance counts only non-echo original casts',source.includes("if(!awake('comet')||echoed||!target)return")&&source.includes('player.awCometCycle%4!==0')&&source.includes('awakeningChild:true'));
expect('Lunar Return has a bounded lunar orbit and one return ripple',source.includes("p.stage='lunarOrbit'")&&source.includes('p.awOrbitDuration=.48')&&source.includes('!p.awMoonRippleDone'));

expect('A1-A7 implementation state is canonicalized in design',design.includes('A1~A19')&&design.includes('A3. Starlight Caster')&&design.includes('A7. Nebula Boomerang'));

for(const name of fail)console.error('FAIL',name);
console.log('Awakening A1-A7 contract failures='+fail.length);
if(fail.length)process.exit(1);
