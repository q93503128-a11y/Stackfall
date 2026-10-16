import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);
const catalog=read('src/boss-catalog.js'),patterns=read('src/boss-patterns.js'),renderers=read('src/elite-renderers.js'),bosses=read('src/bosses.js'),stage=read('src/stage-runtime.js'),stageOne=read('src/stage01-complete.js'),stageOneArt=read('src/stage01-closure-art.js'),stageOneShim=read('src/stage01-visual-reboot.js'),modes=read('src/run-modes.js'),index=read('index.html');
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
 ['Stage 1 final boss owns the final silhouette and combat route',stageOneArt.includes('function drawBossArt')&&stageOneArt.includes("e?.kind==='stage-boss'&&e.eventKind===STAGE_ID")&&stageOne.includes('window.updateStageBossSkill=function stageOneCompleteBossSkill')&&stage.includes("form:'closure'")&&stage.includes("eventVariant:'stage01-closure'")],
 ['Stage 1 final boss uses authored two-phase motion with full attack lifecycle',stageOne.includes('ratio<=.55')&&['brace','fold','charge','dash','impact','recover'].every(mode=>stageOne.includes("'"+mode+"'"))&&['ram','shutter','orbit','breakline'].every(type=>stageOne.includes("'"+type+"'"))&&stageOne.includes('function updateBossIdle')&&stageOne.includes('function updateMorph')],
 ['rejected Stage 2-18 runtime adapters stay removed',retiredStageAdapters.every(path=>!exists(path))],
 ['rejected layered Stage 1 production files stay removed',retiredStageOneLayers.every(path=>!exists(path))],
 ['HTML no longer loads rejected stage production layers',retiredStageAdapters.concat(retiredStageOneLayers).every(path=>!index.includes(path))],
 ['run-mode gate exposes only the approved Stage 1 runtime',modes.includes("ACTIVE_STAGE_RUNTIMES=Object.freeze(['stage-01'])")&&modes.includes("stage&&!hasStageRuntime(stage.id)?'planned':baseStatus(stage)")],
 ['discarded per-stage generic boss rotations are absent',rejectedStageTokens.every(token=>!stage.includes(token))&&stage.includes('bossSkill:null')],
 ['Stage runtime has no shared circular barrage helper calls',!stage.includes('fireRing(')&&!stage.includes('fireRingWithGaps(')],
 ['Stage 1 final runtime owns visible movement directly',stageOne.includes('e.x=lerp(a.originX,a.targetX,t)')&&stageOne.includes('e.y=lerp(a.originY,a.targetY,t)')&&stageOne.includes('function updateBossIdle')&&stageOneArt.includes('window.stackfallStageBodyShapes=')],
 ['Stage 1 reboot shim cannot restore discarded frontier art',stageOneShim.includes("style:'compatibility-shim'")&&stageOneShim.includes('discardedFrontierArt:false')&&!stageOneShim.includes('frontierSprite')&&!stageOneShim.includes('FRONTIER_ART')],
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} boss identity contracts; failures=${failed}`);if(failed)process.exit(1);
