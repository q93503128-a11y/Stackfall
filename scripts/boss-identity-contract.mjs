import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=read('src/boss-catalog.js'),patterns=read('src/boss-patterns.js'),renderers=read('src/elite-renderers.js'),bosses=read('src/bosses.js'),stage=read('src/stage-runtime.js'),stage2=read('src/stage02-runtime.js');
const regular=['eclipse','seraph','pulsar','leviathan','archivist','heliarch','tempest','nullengine'];
const mini=['knight','warden','executioner','colossus','harvester','mirror'];
const voids=['maw','oracle','weaver','grave','paradox'];
const explicit=(source,form)=>source.includes("f==='"+form+"'");
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
 ['Stage 1 final boss has multi-phase behavior',stage.includes('hp<.34?3:hp<.68?2:1')&&stage.includes('phase>=2')&&stage.includes("phase===3?'bombardier':'dart'")],
  ['Stage 2 final boss owns a unique silhouette and combat route',renderers.includes("f==='nebula-heart'")&&bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&stage.includes('window.updateStageBossSkill=function')&&stage2.includes("form:'nebula-heart'")],
 ['Stage 2 final boss has its own multi-phase shear/wisp behavior',stage2.includes('hp<.32?3:hp<.66?2:1')&&stage2.includes("spawnBurst('nebula-wisp'")&&stage2.includes("rawLine(p.x-dx*half")],
  ['all 18 stage bosses receive distinct authored signature pattern branches',stage.includes('function stageBossSignature(e,api)')&&Array.from({length:18},(_,i)=>stage.includes("id==='stage-"+String(i+1).padStart(2,'0')+"'")).every(Boolean)],
 ['stage boss signatures add separate route bloom and array set-pieces',stage.includes('function updateStageBossSignatureLayer')&&stage.includes("id==='stage-06'")&&stage.includes("id==='stage-12'")&&stage.includes("id==='stage-13'")&&stage.includes("id==='stage-18'")&&stage.includes('stageSignatureCd')],
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} boss identity contracts; failures=${failed}`);if(failed)process.exit(1);
