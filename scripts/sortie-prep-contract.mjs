import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),sortie=read('src/sortie-prep.js'),render=read('src/render.js'),map=read('src/stage-map.js'),difficulty=read('src/difficulty-augment-expansion.js'),iface=read('src/interface.js'),styles=read('styles.css'),lang=read('src/language-pack.js');
const checks=[
 ['sortie preparation screen owns starter controls',index.includes('id="sortiePrepScreen"')&&index.includes('id="starterOptions"')&&index.includes('id="sortieDifficultyMount"')],
 ['main menu no longer contains starter controls',!index.slice(index.indexOf('id="menu"'),index.indexOf('id="galaxyMapScreen"')).includes('id="starterOptions"')],
 ['difficulty picker mounts into sortie preparation',difficulty.includes("document.querySelector('#sortieDifficultyMount')")&&difficulty.includes('difficultyMount.appendChild(picker)')],
 ['Endless menu choice opens sortie preparation',render.includes("openStackfallSortiePrep?.('endless'")],
 ['stage map opens the same sortie preparation flow',map.includes("openStackfallSortiePrep?.('stage',stage.id")],
 ['Escape closes sortie preparation before the galaxy map behind it',map.includes("const sortieOpen=!document.querySelector('#sortiePrepScreen')?.classList.contains('hidden')")&&map.includes("&&!sortieOpen")&&sortie.includes("event.code==='Escape'")],
 ['sortie selection sets run mode before launch',sortie.includes('stackfallSetRunSelection?.(mode,stageId)')&&sortie.indexOf('stackfallSetRunSelection?.(mode,stageId)')<sortie.indexOf('audio.init();resetGame()')],
 ['launch closes overlays and then starts the selected run',sortie.includes("screen.classList.add('hidden');window.closeStackfallGalaxyMap?.();audio.init();resetGame()")],
 ['starter renderer still filters locked weapons',iface.includes('stackfallIsWeaponUnlocked')],
 ['sortie screen has desktop and compact layouts',styles.includes('.sortie-prep-modal')&&styles.includes('@media(max-width:760px)')&&styles.includes('.sortie-loadout .starter-options')],
 ['all languages include sortie preparation copy',(lang.match(/'sortie\.title'/g)||[]).length>=6&&(lang.match(/'sortie\.launch'/g)||[]).length>=6]
];
let failed=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} sortie preparation contracts; failures=${failed}`);if(failed)process.exit(1);
