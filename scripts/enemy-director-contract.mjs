import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const director=read('src/enemy-director-v1.js');
const guide=read('src/event-guide-refinement-v1.js');
const modes=read('src/run-modes.js');
const systems=read('src/systems.js');
const bosses=read('src/bosses.js');
const base=read('src/systems-base.js');
const checks=[];
const expect=(name,ok)=>checks.push([name,Boolean(ok)]);

expect('Enemy Director and event guide refinements load in final Endless runtime order',modes.includes("const ENDLESS_SYSTEM_SCRIPTS=Object.freeze(['src/enemy-director-v1.js','src/event-guide-refinement-v1.js'])")&&modes.indexOf('ENDLESS_PROGRESSION_SCRIPTS')<modes.indexOf('ENDLESS_SYSTEM_SCRIPTS'));
expect('time-segmented density replaces pure random background spawning',director.includes("id:'opening'")&&director.includes("id:'skirmish'")&&director.includes("id:'formation'")&&director.includes("id:'crossfire'")&&director.includes("id:'siege'")&&director.includes("id:'deep-space'")&&director.includes("id:'overrun'")&&director.includes('lateProfile(t)'));
expect('role composition is soft rather than a fixed ranged population cap',director.includes('desired=Math.max(.75,profile.target*weight)')&&director.includes('current>desired*1.45?.42:1')&&!director.includes('rangedAlive>=')&&!director.includes('MAX_RANGED')&&!director.includes('artilleryCap'));
expect('ranged pressure uses attack slots instead of enemy-count caps',director.includes('rangedSlots')&&director.includes('slotState.active>=profile.rangedSlots')&&director.includes('directorShotWindup'));
expect('ranged attacks require on-screen readable engagement',director.includes('onScreenForAttack(e)')&&director.includes('d<270||d>620')&&director.includes('beginArtilleryWindup(e)')&&director.includes("shockwave(e.x,e.y,'#76e6ff'"));
expect('killing a ranged enemy creates refill breathing room',director.includes("artillery:2.6")&&director.includes('nextRoleAllowed[role]')&&director.includes('function onEnemyKilled(enemy)')&&base.includes('stackfallEnemyDirectorV1?.onEnemyKilled?.(enemy,opts)'));
expect('charger role telegraphs before a committed dash',director.includes("directorRole==='charger'")&&director.includes('directorChargeWindup')&&director.includes("shockwave(e.x,e.y,'#ff7daf'")&&director.includes('e.dash=.34'));
expect('canonical spawning preserves Apex/world-event boundaries before director delegation',systems.includes("updateApexSystems==='function'&&updateApexSystems(dt)")&&systems.includes("worldEventBlocksSpawning==='function'&&worldEventBlocksSpawning()")&&systems.includes('stackfallEnemyDirectorV1?.updateSpawning?.(dt)===true')&&director.includes("updateEncounterDirector==='function')updateEncounterDirector(dt)"));
expect('regular boss pressure is deliberately reduced without disabling the horde',director.includes("boss?.76:1")&&director.includes("firstBoss?.45:1")&&director.includes('profile.boss)rt.pulseRemaining=0'));
expect('director exposes non-UI inspection data for real playtest diagnosis',director.includes('window.stackfallEnemyDirectorSnapshot')&&director.includes('window.stackfallEnemyDirectorVersion'));
expect('director integrates through explicit service hooks instead of replacing core functions',director.includes('window.stackfallEnemyDirectorV1=service')&&director.includes('movementSpeed:directorMovementSpeed')&&director.includes('suppressGenericRanged')&&director.includes('updateActions:updateDirectorActions')&&!/\b(?:updateSpawning|updateEnemies|killEnemy)\s*=\s*function/.test(director)&&bosses.includes('stackfallEnemyDirectorV1?.updateActions?.(dt)')&&bosses.includes('enemyDirector?.movementSpeed')&&bosses.includes('enemyDirector?.suppressGenericRanged?.(e)'));
expect('offscreen event guide is pulled modestly toward the player without moving active events',guide.includes("const PULL_TOWARD_PLAYER=.12")&&guide.includes('if(state.mapEventActive')&&guide.includes('ctx.translate(shift.x,shift.y)')&&guide.includes('window.drawMapEvents=refined'));

let failures=0;
for(const[name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failures++;}
console.log(`Checked ${checks.length} Enemy Director contracts; failures=${failures}`);
if(failures)process.exit(1);
