import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),map=read('src/stage-map.js'),modes=read('src/run-modes.js'),meta=read('src/meta-progression.js'),styles=read('styles.css'),lang=read('src/language-pack.js');
const checks=[
 ['main menu exposes Endless and galaxy map separately',index.includes('id="startBtn"')&&index.includes('data-i18n="menu.endless"')&&index.includes('id="stageMapBtn"')&&index.includes('data-i18n="menu.stageMap"')],
 ['galaxy screen separates map and detail panel',index.includes('id="galaxyMapCanvas"')&&index.includes('class="galaxy-detail glass"')&&index.includes('id="galaxyStageNodes"')],
 ['stage map script loads after interface',index.indexOf('src/interface.js')<index.indexOf('src/stage-map.js')],
 ['stage nodes are rendered from the catalog',map.includes('window.STACKFALL_STAGE_CATALOG||[]')&&map.includes('window.stackfallStageById?.(id)')],
 ['node status comes from persistent progression',map.includes('window.stackfallStageStatus?.(stage)')&&meta.includes('function stageStatus(stage)')],
 ['available or cleared stages can launch',map.includes("const playable=resolvedStatus==='available'||resolvedStatus==='cleared'")&&catalog.includes("status:'available'")],
 ['launch path selects stage before reset',map.includes("window.stackfallSetRunSelection?.('stage',stage.id)")&&map.includes('closeMap();audio.init();resetGame()')],
 ['Endless remains default outside the stage map',modes.includes("return{mode:MODES.ENDLESS,stageId:null}")],
 ['desktop galaxy layout has map plus detail columns',styles.includes('grid-template-columns:minmax(0,1fr) minmax(300px,360px)')],
 ['mobile galaxy layout stacks map and detail',styles.includes('@media(max-width:900px)')&&styles.includes('grid-template-columns:1fr;grid-template-rows:minmax(330px,1fr) auto')],
 ['all supported languages receive stage map labels',["TEXT.ko","TEXT.en","TEXT.ja","TEXT['zh-CN']","TEXT.es","TEXT.fr"].every(token=>lang.includes(token))&&(lang.match(/'stageMap\.title'/g)||[]).length>=6]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} stage map contracts; failures=${failed}`);if(failed)process.exit(1);
