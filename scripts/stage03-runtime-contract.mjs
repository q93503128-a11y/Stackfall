import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),catalog=read('src/stage-catalog.js'),runtime=read('src/stage03-runtime.js'),shared=read('src/stage-runtime.js'),bosses=read('src/bosses.js'),entities=read('src/render-entities.js'),elite=read('src/elite-renderers.js'),realm=read('src/realm-backgrounds.js'),lang=read('src/language-pack.js');
const checks=[
 ['Stage 3 exists after Stage 2 in the first constellation',catalog.includes("id:'stage-03'")&&catalog.includes("constellationId:'constellation-01'")&&catalog.includes("requirements:{previous:'stage-02'}")],
 ['Stage 3 boss arrives at exactly ten minutes',catalog.includes("boss:{id:'prism-reliquary',spawnAt:600")&&catalog.includes("at:600,kind:'boss',variant:'prism-reliquary'")],
 ['Stage 3 introduces one new Glasswing common enemy',catalog.includes("{id:'glass-wing',type:'fast',unlockAt:140}")&&runtime.includes("'glass-wing':{type:'fast'")],
 ['Stage 3 owns refraction and prism-rain incidents',['refraction-lattice','prism-rain','deep-refraction'].every(token=>catalog.includes(token)&&runtime.includes(token))],
 ['Stage 3 is a registered adapter with no shared wrapper overrides',runtime.includes("stackfallRegisterStageRuntime('stage-03'")&&!runtime.includes('updateSpawning=function')&&!runtime.includes('resetGame=function')],
 ['Stage 3 has a dedicated glass-necropolis environment',runtime.includes("theme:'stage-03'")&&realm.includes('function drawStage03Background')&&realm.includes("theme==='stage-03'")],
 ['Glasswing has a dedicated common-enemy silhouette',entities.includes("v==='glass-wing'")&&entities.includes("r*1.28")],
 ['Refracted Reliquary has a dedicated boss silhouette',elite.includes("f==='prism-reliquary'")&&elite.includes('for(let i=0;i<6;i++)')],
 ['Stage 3 boss uses the shared stage dispatcher',bosses.includes("enemy.kind==='stage-boss'&&typeof window.updateStageBossSkill==='function'")&&shared.includes('window.updateStageBossSkill=function')&&runtime.includes("eventVariant:'stage03-reliquary'")],
 ['Stage 3 boss has multi-phase lattice pressure and Glasswing summons',runtime.includes('hp<.30?3:hp<.64?2:1')&&runtime.includes("api.spawnBurst('glass-wing'")&&runtime.includes('rawLine(p.x-dx*half')],
 ['Stage 3 unlocks Constellation Prism and first-clear currency',catalog.includes("rewards:[{type:'weapon',key:'prism'}")&&catalog.includes("key:'stardust',amount:220")&&catalog.includes("key:'coreShard',amount:1,firstClearOnly:true")],
 ['Stage 3 adapter is loaded after Stage 2',index.indexOf('src/stage02-runtime.js')<index.indexOf('src/stage03-runtime.js')],
 ['all supported languages include Stage 3 combat copy',(lang.match(/'stage03\.enemy\.glassWing'/g)||[]).length>=6&&(lang.match(/'stage03\.objective\.boss'/g)||[]).length>=6]
];
let failed=0;for(const[name,ok]of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)failed++;}console.log(`Checked ${checks.length} Stage 3 contracts; failures=${failed}`);if(failed)process.exit(1);