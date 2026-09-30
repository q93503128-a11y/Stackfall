import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/boss-catalog.js'),patterns=read('src/boss-patterns.js'),renderers=read('src/elite-renderers.js'),bosses=read('src/bosses.js'),stage=read('src/stage-runtime.js'),stage2=read('src/stage02-runtime.js');
const regular=['eclipse','seraph','pulsar','leviathan','archivist','heliarch','tempest','nullengine'];
const mini=['knight','warden','executioner','colossus','harvester','mirror'];
const voids=['maw','oracle','weaver','grave','paradox'];
const explicit=(source,form)=>source.includes("f==='"+form+"'");
const stageIds=Array.from({length:18},(_,i)=>'stage-'+String(i+1).padStart(2,'0'));
const adapterSources=Array.from({length:17},(_,i)=>read('src/stage'+String(i+2).padStart(2,'0')+'-runtime.js'));
const phaseBlock=stage.slice(stage.indexOf('const STAGE_APEX_PHASE_CUTS'),stage.indexOf('function stageBossPhase'));
const motionBlock=stage.slice(stage.indexOf('const STAGE_APEX_MOTION'),stage.indexOf('const STAGE_APEX_TERTIARY_TECHNIQUES'));
const tertiaryBlock=stage.slice(stage.indexOf('const STAGE_APEX_TERTIARY_TECHNIQUES'),stage.indexOf('function stageBossTertiaryTechnique'));
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
  ['Stage 1 final boss owns a unique silhouette and combat route',renderers.includes("f==='collapse-warden'")&&bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&stage.includes('window.updateStageBossSkill=function')&&stage.includes("form:'collapse-warden'")],
 ['Stage 1 final boss uses authored two-phase movement and tertiary pressure',stage.includes("'stage-01':[.48]")&&motionBlock.includes("'stage-01'")&&tertiaryBlock.includes("'stage-01'")&&stage.includes('bossSkill:null')],
  ['Stage 2 final boss owns a unique silhouette and combat route',renderers.includes("f==='nebula-heart'")&&bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&stage.includes('window.updateStageBossSkill=function')&&stage2.includes("form:'nebula-heart'")],
 ['Stage 2 final boss has its own heart-orbit and arterial-lobe behavior',stage2.includes('bossSkill:null')&&phaseBlock.includes("'stage-02':[.68,.32]")&&motionBlock.includes("'stage-02'")&&tertiaryBlock.includes("'stage-02'")],
  ['all 18 stage bosses receive distinct authored signature pattern branches',stage.includes('function stageBossSignature(e,api)')&&Array.from({length:18},(_,i)=>stage.includes("id==='stage-"+String(i+1).padStart(2,'0')+"'")).every(Boolean)],
 ['all 18 Stage Apex own phase motion and tertiary layers',stageIds.every(id=>phaseBlock.includes("'"+id+"'")&&motionBlock.includes("'"+id+"'")&&tertiaryBlock.includes("'"+id+"'"))],
 ['legacy per-stage generic boss rotations are disabled',stage.includes('bossSkill:null')&&adapterSources.every(source=>source.includes('bossSkill:null'))&&stage.includes('updateStageBossCombat(enemy,dt,api)')&&!stage.includes('result=def.bossSkill')],
 ['Stage Apex runtime has no shared circular barrage helper calls',!stage.includes('fireRing(')&&!stage.includes('fireRingWithGaps(')],
 ['Stage Apex authored movement reaches enemy integration',bosses.includes("e.kind==='stage-boss'&&Number.isFinite(e.stageMotionX)")&&bosses.includes('vx=e.stageMotionX*motionScale')],
 ['S12 shell and S18 core phase flags remain renderer-coupled',stage.includes('e.stageShellOpen=e.stagePhase>=2')&&stage.includes('e.stageCoreExposed=e.stagePhase>=2')&&renderers.includes('stageShellOpen')&&renderers.includes('stageCoreExposed')],
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} boss identity contracts; failures=${failed}`);if(failed)process.exit(1);
