import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const events=read('src/map-event-expansion.js');
const controls=read('src/runtime-controls.js');
const targeting=read('src/targeting-motion-refinement.js');
const darkCosmic=read('src/dark-cosmic-polish.js');
const auditUi=read('src/build-audit-ui.js');
const modes=read('src/run-modes.js');
const pickups=read('src/field-pickups.js');
const bosses=read('src/boss-catalog.js');
const current=read('docs/CURRENT_STATE.md');
const docsIndex=read('docs/INDEX.md');
const retired=['distress','meteor','predator','relay','storm'];
const checks=[];
const expect=(name,ok)=>checks.push([name,Boolean(ok)]);

expect('Endless event owner exposes exactly Vault Crash and Void',events.includes("EVENT_CLOCK_KEYS=Object.freeze(['vault','crash','void'])")&&events.includes("FIRST={vault:42,crash:118,void:320}"));
expect('retired field-event experiment is absent from active event source',retired.every(name=>!events.includes(name))&&!events.includes('drawActiveFieldEvent'));
expect('runtime controls no longer wrap map-event update draw or authored spawn',!controls.includes('installCanonicalWorldEvents')&&!controls.includes('__canonicalThree')&&!controls.includes('baseUpdateMapEvents')&&!controls.includes('baseDrawMapEvents'));
expect('event guide behavior is canonical rather than a late script',events.includes('EVENT_GUIDE_PULL_TOWARD_PLAYER=.12')&&!fs.existsSync('src/event-guide-refinement-v1.js')&&!modes.includes('event-guide-refinement-v1.js'));
expect('map event renderer has one runtime owner',events.includes("eventArrowOwner:'canonical'")&&!darkCosmic.includes('drawMapEvents=function')&&!auditUi.includes('drawMapEvents=function'));
expect('Vault elite overlap is owned by canonical event runtime',events.includes('function vaultDueDuringElite()')&&events.includes("if(eliteActive){if(vaultDueDuringElite())spawnMarker('vault');}")&&!targeting.includes('vaultDuringEliteEncounters'));
expect('Endless system loader contains only Enemy Director',modes.includes("const ENDLESS_SYSTEM_SCRIPTS=Object.freeze(['src/enemy-director-v1.js'])"));
expect('Stage gameplay remains sealed',modes.includes('const ACTIVE_STAGE_RUNTIMES=Object.freeze([])')&&modes.includes('window.STACKFALL_STAGE_MODE_ENABLED=false')&&modes.includes('window.stackfallHasStageRuntime=()=>false'));
expect('Suction Magnet drops from miniboss and regular boss only',pickups.includes('SUCTION_MAGNET_MINI_DROP_CHANCE=.50')&&pickups.includes("isMini=enemy.type==='mini'")&&pickups.includes("isRegularBoss=enemy.type==='boss'&&enemy.kind==='boss'&&!enemy.eventKind")&&!pickups.includes('SUCTION_MAGNET_DROP_CHANCE=.0025'));
expect('boss pools remain explicit by encounter domain',bosses.includes("boss:['eclipse','seraph','pulsar','leviathan','archivist','heliarch','tempest','nullengine']")&&bosses.includes("void:['maw','oracle','weaver','grave','paradox']")&&bosses.includes("apex:['chronophage','starforge','lastconstellation']"));
expect('current-state document identifies itself as runtime authority',current.includes('Status: CURRENT RUNTIME CANON')&&current.includes('성운 보관소')&&current.includes('추락한 우주선')&&current.includes('공허 균열')&&current.includes('Stage gameplay is currently sealed'));
expect('documentation index defines precedence and historical status',docsIndex.includes('CURRENT_STATE.md')&&docsIndex.includes('HISTORICAL')&&docsIndex.includes('REFERENCE'));

let failures=0;
for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failures++;}
console.log(`Checked ${checks.length} canonical-state contracts; failures=${failures}`);
if(failures)process.exit(1);
