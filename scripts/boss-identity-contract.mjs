import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);
const catalog=read('src/boss-catalog.js'),patterns=read('src/boss-patterns.js'),renderers=read('src/elite-renderers.js'),bosses=read('src/bosses.js'),stage=read('src/stage-runtime.js'),remodel=read('src/stage01-remodel.js'),polish=read('src/stage01-polish.js'),modes=read('src/run-modes.js'),index=read('index.html');
const regular=['eclipse','seraph','pulsar','leviathan','archivist','heliarch','tempest','nullengine'];
const mini=['knight','warden','executioner','colossus','harvester','mirror'];
const voids=['maw','oracle','weaver','grave','paradox'];
const explicit=(source,form)=>source.includes("f==='"+form+"'");
const retiredStageAdapters=Array.from({length:17},(_,i)=>'src/stage'+String(i+2).padStart(2,'0')+'-runtime.js');
const retiredStageOneLayers=['src/stage01-production-art.js','src/stage01-rework-v2.js','src/stage01-rework-v3.js','src/stage01-rework-v4.js','src/stage01-rework-v5.js','src/stage01-rework-v6.js','src/stage-environment-visuals.js'];
const removedStageOne=['src/stage01-complete.js','src/stage01-closure-art.js','src/stage01-audio-polish.js','src/stage01-visual-reboot.js','src/stage-world-reboot-metadata.js'];
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
 ['Apex forms have separate set-piece behavior',read('src/atrophos-combat.js').includes('function atrophosCycle')&&['startForgeTidalCore','startConstellationSweep'].every(name=>bosses.includes('function '+name)&&bosses.includes(name+'(e,phase,d)'))],
 ['Apex forms have separate silhouette renderers',['drawChronophageApex','drawStarforgeApex','drawLastConstellationApex'].every(name=>renderers.includes('function '+name))],
 ['discarded Stage 1 implementation and metadata stay absent',removedStageOne.every(path=>!exists(path))],
 ['Stage 1 alone is active after the redesign reset',modes.includes("ACTIVE_STAGE_RUNTIMES=Object.freeze(['stage-01'])")&&modes.includes("stage&&!hasStageRuntime(stage.id)?'planned':baseStatus(stage)")],
 ['Stage 1 final boss owns a distinct Stackfall-style silhouette',remodel.includes("form:'orbit-warden'")&&remodel.includes('enemy.eliteForm=null')&&polish.includes('function drawOrbitWarden(enemy)')&&polish.includes('drawBody(enemy){drawOrbitWarden(enemy);}')&&!remodel.includes("form:'closure'")&&!remodel.includes('stage01-closure')],
 ['Stage 1 final target is explicitly Apex-class with a battlefield set piece',stage.includes("bossCategory:stage.boss?.rank==='apex'?'apex':'boss'")&&remodel.includes('function startOrbitDominion')&&remodel.includes('function updateOrbitDominion')&&remodel.includes("music:'apex-warden'")&&polish.includes('Detached orbital anchors')],
 ['Stage 1 attacks use canonical enemy projectile visual families',remodel.includes("return'constellation'")&&remodel.includes("return'rune'")&&remodel.includes("return'needle'")&&remodel.includes("return'ranged-bolt'")&&polish.includes("'debris'")],
 ['Stage 1 does not globally remap native Endless elite forms',!remodel.includes('stackfallSpawnEliteForm=')&&!remodel.includes('__stage01Remodel')],
 ['run-mode loader has no discarded Stage 1 hooks',!modes.includes('stage01-closure')&&!modes.includes('stage-world-reboot-metadata')],
 ['rejected Stage 2-18 runtime adapters stay removed',retiredStageAdapters.every(path=>!exists(path))],
 ['rejected layered Stage 1 production files stay removed',retiredStageOneLayers.every(path=>!exists(path))],
 ['HTML no longer loads rejected stage production layers',retiredStageAdapters.concat(retiredStageOneLayers,removedStageOne).every(path=>!index.includes(path))],
 ['discarded per-stage generic boss rotations are absent',rejectedStageTokens.every(token=>!stage.includes(token))&&remodel.includes('bossSkill:null')&&!stage.includes('stageOneArena(')&&!stage.includes('beginStageOneBossIntro(')&&!stage.includes('beginStageTwoBossIntro(')],
 ['Stage runtime has no shared circular barrage helper calls',!stage.includes('fireRing(')&&!stage.includes('fireRingWithGaps(')]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} boss identity contracts; failures=${failed}`);if(failed)process.exit(1);
