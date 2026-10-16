import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);
const catalog=read('src/boss-catalog.js'),patterns=read('src/boss-patterns.js'),renderers=read('src/elite-renderers.js'),bosses=read('src/bosses.js'),stage=read('src/stage-runtime.js'),stageOne=read('src/stage01-visual-reboot.js'),modes=read('src/run-modes.js'),index=read('index.html');
const regular=['eclipse','seraph','pulsar','leviathan','archivist','heliarch','tempest','nullengine'];
const mini=['knight','warden','executioner','colossus','harvester','mirror'];
const voids=['maw','oracle','weaver','grave','paradox'];
const explicit=(source,form)=>source.includes("f==='"+form+"'");
const retiredStageAdapters=Array.from({length:17},(_,i)=>'src/stage'+String(i+2).padStart(2,'0')+'-runtime.js');
const retiredStageOneLayers=['src/stage01-production-art.js','src/stage01-rework-v2.js','src/stage01-rework-v3.js','src/stage01-rework-v4.js','src/stage01-rework-v5.js','src/stage01-rework-v6.js','src/stage-environment-visuals.js'];
const rejectedStageTokens=['STAGE_APEX_MOTION','STAGE_APEX_UNIQUE_TECHNIQUES','STAGE_APEX_TERTIARY_TECHNIQUES','stageBossSignature(','stageBossUniqueTechnique(','stageBossTertiaryTechnique(','updateStageBossCombat('];
const checks=[
 ['catalog keeps distinct regular miniboss void and apex pools',catalog.includes("boss:['eclipse','seraph','pulsar','leviathan','archivist','heliarch','tempest','nullengine']")&&catalog.includes("mini:['knight','warden','executioner','colossus','harvester','mirror']")&&catalog.includes("void:['maw','oracle','weaver','grave','paradox']")],
 ['every regular boss has an explicit pattern branch',regular.every(form=>explicit(patterns,form))],
 ['every regular boss has an explicit silhouette branch',regular.every(form=>explicit(renderers,form))],
 ['every miniboss has an explicit pattern branch including Knight',mini.every(form=>explicit(patterns,form))],
 ['every miniboss has an explicit silhouette branch',mini.every(form=>explicit(renderers,form))],
 ['every Void Rift boss has an explicit pattern branch',voids.every(form=>explicit(patterns,form))],
 ['every Void Rift boss has an explicit silhouette branch',voids.every(form=>explicit(renderers,form))],
 ['Apex forms have separate signature attacks',['chronophageSignature','starforgeSignature','constellationSignature'].every(name=>patterns.includes('function '+name))],
 ['Apex forms have separate set-piece behavior',['startChronoPursuit','startForgeTidalCore','startConstellationSweep'].every(name=>bosses.includes('function '+name)&&bosses.includes(name+'(e,phase,d)'))],
 ['Apex forms have separate silhouette renderers',['drawChronophageApex','drawStarforgeApex','drawLastConstellationApex'].every(name=>renderers.includes('function '+name))],
 ['Stage 1 final boss owns the reboot silhouette and combat route',stageOne.includes('function drawStageOneBoss')&&stageOne.includes("e?.kind==='stage-boss'&&e.eventKind==='stage-01'")&&stageOne.includes('window.updateStageBossSkill=function stageOneBossSkill')&&stage.includes("form:'closure'")&&stage.includes("eventVariant:'stage01-closure'")],
 ['Stage 1 final boss uses authored two-phase motion with full attack lifecycle',stageOne.includes("nextPhase=ratio<=.52?2:1")&&['brace','compress','charge','dash','impact','recover'].every(mode=>stageOne.includes("'"+mode+"'"))&&stageOne.includes('function advanceRam')&&stageOne.includes('function stageOneShapes')],
 ['rejected Stage 2-18 runtime adapters stay removed',retiredStageAdapters.every(path=>!exists(path))],
 ['rejected layered Stage 1 production files stay removed',retiredStageOneLayers.every(path=>!exists(path))],
 ['HTML no longer loads rejected stage production layers',retiredStageAdapters.concat(retiredStageOneLayers).every(path=>!index.includes(path))],
 ['run-mode gate exposes only the approved Stage 1 runtime',modes.includes("ACTIVE_STAGE_RUNTIMES=Object.freeze(['stage-01'])")&&modes.includes("stage&&!hasStageRuntime(stage.id)?'planned':baseStatus(stage)")],
 ['discarded per-stage generic boss rotations are absent',rejectedStageTokens.every(token=>!stage.includes(token))&&stage.includes('bossSkill:null')],
 ['Stage runtime has no shared circular barrage helper calls',!stage.includes('fireRing(')&&!stage.includes('fireRingWithGaps(')],
 ['Stage 1 reboot owns visible movement directly',stageOne.includes('e.x=lerp(r.originX,r.targetX,t)')&&stageOne.includes('e.y=lerp(r.originY,r.targetY,t)')&&stageOne.includes('window.stackfallClampStageBossToArena=')],
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} boss identity contracts; failures=${failed}`);if(failed)process.exit(1);
