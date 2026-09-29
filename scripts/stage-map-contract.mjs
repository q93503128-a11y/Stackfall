import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),map=read('src/stage-map.js'),modes=read('src/run-modes.js'),meta=read('src/meta-progression.js'),styles=read('styles.css'),lang=read('src/language-pack.js');
const checks=[
 ['main menu exposes stage and Endless as mode choices',index.includes('id="startBtn"')&&index.includes('id="stageMapBtn"')&&index.includes('class="menu-panel hub-panel"')],
 ['galaxy screen separates map and detail panel',index.includes('id="galaxyMapCanvas"')&&index.includes('class="galaxy-detail glass"')&&index.includes('id="galaxyStageNodes"')],
 ['constellation page controls exist',index.includes('id="galaxyConstellationPrev"')&&index.includes('id="galaxyConstellationNext"')&&index.includes('id="galaxyConstellationName"')&&index.includes('id="galaxyConstellationPage"')],
 ['catalog owns constellation membership',catalog.includes('constellationId:String(definition.constellationId)')&&catalog.includes('window.STACKFALL_CONSTELLATIONS=constellations')],
 ['map renders only stages from the active constellation',map.includes('const stagesFor=id=>')&&map.includes('function visibleStages()')&&map.includes('stage.constellationId===id')],
 ['later constellation pages remain inaccessible until their first stage unlocks',map.includes('function constellationAccessible(page)')&&map.includes("status==='available'||status==='cleared'")&&catalog.includes("id:'constellation-02'")&&catalog.includes("requirements:{previous:'stage-06'}")&&catalog.includes("id:'constellation-03'")&&catalog.includes("requirements:{previous:'stage-12'}")],
 ['connections use explicit predecessor links inside the current page',map.includes('stage.requirements?.previous')&&map.includes('ids.has(previous.id)')],
 ['stage nodes use luminous stellar points with separate number badges',map.includes('class="galaxy-node-star"')&&styles.includes('galaxyStellarPulse')&&styles.includes('.galaxy-stage-node>small')],
 ['node status comes from persistent progression',map.includes('window.stackfallStageStatus?.(stage)')&&meta.includes('function stageStatus(stage)')],
 ['detail panel exposes game time threat unlockable and boss',index.includes('id="galaxyStageTime"')&&index.includes('id="galaxyStageThreat"')&&index.includes('id="galaxyStageUnlocks"')&&index.includes('id="galaxyStageBoss"')],
 ['locked stage nodes stay simple grey without chain or padlock overlays',!map.includes('galaxy-node-lock')&&!map.includes("status==='locked'?'🔒")&&!styles.includes('.galaxy-node-lock')],
 ['locked Endless and Core Development cards own crossed-chain center-lock overlays',index.includes('class="hub-chain-lock"')&&index.includes('chain chain-a')&&index.includes('chain chain-b')&&styles.includes('.hub-chain-lock .chain-a')&&styles.includes('.hub-chain-lock>b:before')],
 ['unlock rewards render one reward per row with explicit counts',map.includes('function renderUnlocks')&&map.includes('galaxy-unlock-row')&&styles.includes('.galaxy-unlock-row')],
 ['available or cleared stages can prepare a sortie',map.includes("const playable=resolvedStatus==='available'||resolvedStatus==='cleared'")&&catalog.includes("status:'available'")],
 ['stage launch routes through sortie preparation',map.includes("openStackfallSortiePrep?.('stage',stage.id")],
 ['Endless remains default outside the stage map',modes.includes("return{mode:MODES.ENDLESS,stageId:null}")],
 ['constellation controls are map overlays and remain responsive',styles.includes('.galaxy-constellation-bar')&&styles.includes('grid-template-columns:38px minmax(0,1fr) auto 38px')],
 ['constellation pages own visibly distinct route bloom and array map backgrounds',styles.includes('[data-constellation-theme="route"]')&&styles.includes('[data-constellation-theme="bloom"]')&&styles.includes('[data-constellation-theme="array"]')&&styles.includes('.galaxy-path-bloom')&&styles.includes('.galaxy-path-array')],
 ['later constellation node layouts do not reuse the Shardway zigzag template',catalog.includes("id:'stage-08'")&&catalog.includes('node:{x:.32,y:.72}')&&catalog.includes("id:'stage-12'")&&catalog.includes('node:{x:.35,y:.30}')&&catalog.includes("id:'stage-14'")&&catalog.includes('node:{x:.16,y:.32}')&&catalog.includes("id:'stage-18'")&&catalog.includes('node:{x:.86,y:.34}')],
 ['all supported languages retain stage detail labels',(lang.match(/'stageMap\.gameTime'/g)||[]).length>=6&&(lang.match(/'stageMap\.unlockable'/g)||[]).length>=6]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} stage map contracts; failures=${failed}`);if(failed)process.exit(1);