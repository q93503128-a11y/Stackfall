import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),map=read('src/stage-map.js'),modes=read('src/run-modes.js'),meta=read('src/meta-progression.js'),styles=read('styles.css'),lang=read('src/language-pack.js');
const checks=[
 ['main menu exposes stage and Endless as mode choices',index.includes('id="startBtn"')&&index.includes('data-i18n="menu.endless"')&&index.includes('id="stageMapBtn"')&&index.includes('data-i18n="menu.stageMap"')&&index.includes('class="menu-panel hub-panel"')],
 ['main menu no longer owns starter selection',!index.slice(index.indexOf('id="menu"'),index.indexOf('id="galaxyMapScreen"')).includes('id="starterOptions"')],
 ['galaxy screen separates map and detail panel',index.includes('id="galaxyMapCanvas"')&&index.includes('class="galaxy-detail glass"')&&index.includes('id="galaxyStageNodes"')],
 ['stage nodes are rendered from the catalog',map.includes('window.STACKFALL_STAGE_CATALOG||[]')&&map.includes('window.stackfallStageById?.(id)')],
 ['stage nodes use luminous stellar points with separate number badges',map.includes('class="galaxy-node-star"')&&styles.includes('galaxyStellarPulse')&&styles.includes('.galaxy-node-star:before')&&styles.includes('.galaxy-node-star:after')&&styles.includes('clip-path:none')&&styles.includes('.galaxy-stage-node>small')],
 ['constellation connections remain catalog-order driven',map.includes("line.setAttribute('x1'")&&map.includes("line.setAttribute('x2'")&&styles.includes('.galaxy-path')],
 ['node status comes from persistent progression',map.includes('window.stackfallStageStatus?.(stage)')&&meta.includes('function stageStatus(stage)')],
 ['detail panel only exposes game time threat unlockable and boss',index.includes('id="galaxyStageTime"')&&index.includes('id="galaxyStageThreat"')&&index.includes('id="galaxyStageUnlocks"')&&index.includes('id="galaxyStageBoss"')&&!index.includes('id="galaxyStageGimmicks"')&&!index.includes('id="galaxyStageEvents"')],
 ['game time is derived from boss arrival and unlock progress from rewards',map.includes('stage.boss?.spawnAt')&&map.includes('unlockText(stage)')&&map.includes("reward.type==='weapon'")],
 ['available or cleared stages can prepare a sortie',map.includes("const playable=resolvedStatus==='available'||resolvedStatus==='cleared'")&&catalog.includes("status:'available'")],
 ['stage launch routes through sortie preparation instead of immediate reset',map.includes("openStackfallSortiePrep?.('stage',stage.id")],
 ['Endless remains default outside the stage map',modes.includes("return{mode:MODES.ENDLESS,stageId:null}")],
 ['desktop galaxy layout has map plus detail columns',styles.includes('grid-template-columns:minmax(0,1fr) minmax(300px,360px)')],
 ['mobile galaxy layout stacks map and detail',styles.includes('@media(max-width:900px)')&&styles.includes('grid-template-columns:1fr;grid-template-rows:minmax(330px,1fr) auto')],
 ['all supported languages receive new stage detail labels',(lang.match(/'stageMap\.gameTime'/g)||[]).length>=6&&(lang.match(/'stageMap\.unlockable'/g)||[]).length>=6]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} stage map contracts; failures=${failed}`);if(failed)process.exit(1);
