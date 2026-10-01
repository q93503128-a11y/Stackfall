import {stageDefinition,stageHazardsWork,stageWorldRenderer} from './stage-contract-fixture.mjs';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage02-runtime.js'),shared=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),space=read('src/render-space.js'),environment=read('src/stage-environment-visuals.js'),iface=read('src/interface.js'),audioCfg=read('src/runtime-config.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 2 owns recurring stage gimmick cadence',catalog.includes("gimmick:{")&&shared.includes('updateAmbientGimmick(run,def)')],
 ['Stage 2 exists and unlocks after Stage 1',catalog.includes("id:'stage-02'")&&catalog.includes("requirements:{previous:'stage-01'}")],
 ['Stage 2 boss follows the authored 5.5-minute operation',catalog.includes("boss:{id:'nebula-heart',spawnAt:330")&&catalog.includes("at:330,kind:'boss',variant:'nebula-heart'")],
 ['Stage 2 both shear variants create finite moving objects',stageHazardsWork(2,['ion-shear','deep-shear'])],
 ['Stage 2 introduces Nebula Wisp while reusing the established roster',catalog.includes("{id:'nebula-wisp',type:'ranged'")&&['shardling','dart','bombardier','bulwark'].every(id=>catalog.includes("id:'"+id+"'"))],
 ['Stage 2 owns its fixed incident timeline',[65,120,185,250,295,330].every(n=>catalog.includes('at:'+n))],
 ['Stage 2 is a registered adapter with no wrapper chain',runtime.includes("stackfallRegisterStageRuntime('stage-02'")&&!runtime.includes('updateSpawning=function')&&!runtime.includes('resetGame=function')&&!runtime.includes('window.updateMapEvents=function')],
 ['Stage 2 retains its own stage realm',runtime.includes("theme:'stage-02'")&&stageWorldRenderer(2,realm)&&space.includes('/^stage-\\d{2}$/')],
 ['Stage 2 background bypasses rectangular repeated stage tiles',realm.includes('function drawStageTwoNebulaField')&&realm.includes('function stageWorldHash')&&realm.includes("if(order===2){drawStageTwoNebulaField(tier);return;}")],
 ['Stage 2 nebula anchors are jittered and overlapping instead of row-column aligned',realm.includes("(jx-.5)*cell*.92")&&realm.includes("(jy-.5)*cell*.92")&&realm.includes('quadraticCurveTo(mx,my,x2,y2)')],
 ['Stage 2 suppresses generic route marker noise over the nebula field',realm.includes("stageTwo=theme==='stage-02'")&&realm.includes("stageTwo?(tier===2?4:tier===1?6:8)")],
 ['Stage 2 ion shear owns flowing warning and impact visuals',environment.includes('function drawStageTwoIonShear')&&environment.includes("t.environmentStageId==='stage-02'")&&entities.includes("style==='ion-shear'")],
 ['Stage 2 hazard uses full flowing current bands rather than the old split-line template',runtime.includes("event.variant==='deep-shear'")&&runtime.includes("kind:'ion-front'")&&read('src/stage-physical-objects.js').includes("o.kind==='ion-front'")&&!runtime.includes('cx-dx*gap')],
 ['Nebula Wisp has a dedicated common-enemy silhouette',entities.includes("v==='nebula-wisp'")],
 ['Nebula Heart has a dedicated living-organism silhouette',elite.includes("f==='nebula-heart'")&&elite.includes('stageNebulaInhaleUntil')&&elite.includes('stageNebulaDischargeAngle')&&!elite.includes("ctx.ellipse(r*.62,0,r*.78,r*.30")],
 ['Nebula Heart hit envelope follows the visible body without inflating contact damage',runtime.includes("r:64,hitRadius:92,contactRadius:64")&&shared.includes("r:profile.hitRadius??profile.r")&&shared.includes("visualR:profile.r")&&shared.includes("contactR:profile.contactRadius??profile.r")&&elite.includes("r=Number.isFinite(e.visualR)?e.visualR:e.r")&&bosses.includes("Number.isFinite(e.contactR)?e.contactR:e.r")],
 ['Nebula Heart uses the shared stage-boss dispatcher',bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&shared.includes('window.updateStageBossSkill=function')&&runtime.includes("eventVariant:'stage02-heart'")],
 ['Nebula Heart uses drifting current motion instead of a perfect elliptical orbit',shared.includes("'stage-02':(e,p)=>{const dx=p.x-e.x")&&shared.includes('stageNebulaFlowDir')&&!shared.includes("'stage-02':(e,p)=>stageBossOrbit")],
 ['Nebula Heart attacks are authored as lobe discharge inhale-exhale and cross-current globules',shared.includes('function stageTwoLobeDischarge')&&shared.includes('function stageTwoInhaleExhale')&&shared.includes('function stageTwoCrossCurrent')&&shared.includes("'ion-globule'")],
 ['Nebula Heart uses one sequential director so authored attacks do not pile up independently',shared.includes("if(id==='stage-02'){")&&shared.includes('stageTwoAttackCd')&&shared.includes('slot=cycle%3')],
 ['Stage 2 has a dedicated nebula-coalescence final entrance',shared.includes('function beginStageTwoBossIntro')&&shared.includes("owner:'stage-02-boss-entry'")&&space.includes("tr.owner==='stage-02-boss-entry'")],
 ['Stage 2 defeat drains the split organism and clears the trench',shared.includes('function beginStageTwoVictory')&&shared.includes('function drawStageTwoVictory')&&elite.includes('stageNebulaDissolve')&&realm.includes('n.discharged')],
 ['Stage 2 unlocks Nebula Boomerang and progression currency',catalog.includes("rewards:[{type:'weapon',key:'arc'}")&&catalog.includes("key:'stardust',amount:180")],
 ['leaving a run clears stale Apex state and keeps the menu silent',iface.includes('state.apexActiveId=null')&&iface.includes('audio.stopAmbient?.()')&&audioCfg.includes("if(['menu','gameover','stageComplete'].includes(state.mode))return null")&&audioCfg.includes('if(!scene){this.stopAmbient();return;}')],
 ['Stage 2 environment evolves and restores late preview state',shared.includes('function updateStageTwoNebula')&&shared.includes('n.pressure=clamp')&&shared.includes('n.heartbeat=clamp')&&shared.includes("if(run.stage.id==='stage-02')updateStageTwoNebula(run)")],
 ['Stage 2 keeps authored liquid projectiles in the final GPU path',read('src/gpu-renderer.js').includes("if(p?.visual==='ion-globule')continue")&&read('src/gpu-renderer.js').includes('AUTHORED_HOSTILE_BUFFER')],
 ['Stage 2 phase cancels pending discharges',shared.includes('e.stageTwoActionToken===token')&&shared.includes('stageTwoActionToken=(e.stageTwoActionToken||0)+1')],
 ['Stage 2 owns exploration and heart music',audioCfg.includes('trench:{bed:')&&audioCfg.includes('heart:{bed:')&&audioCfg.includes("'stage-02':'heart'")],
 ['Stage 2 adapter loads after the shared stage runtime',index.indexOf('src/stage-runtime.js')<index.indexOf('src/stage02-runtime.js')],
 ['all supported languages include Stage 2 combat copy',(lang.match(/'stage02\.enemy\.wisp'/g)||[]).length>=6&&(lang.match(/'stage02\.objective\.boss'/g)||[]).length>=6]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 2 contracts; failures=${failed}`);if(failed)process.exit(1);
