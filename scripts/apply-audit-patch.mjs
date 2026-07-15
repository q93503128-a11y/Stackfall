import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,unlinkSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(process.cwd());
const read=path=>readFileSync(resolve(root,path),'utf8');
const write=(path,content)=>writeFileSync(resolve(root,path),content);
function replaceOnce(path,from,to){
  const current=read(path);
  if(current.includes(to))return;
  if(!current.includes(from))throw new Error(`${path}: expected text not found: ${from.slice(0,120)}`);
  write(path,current.replace(from,to));
}

const fingerprintModule=`import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ownPath=fileURLToPath(import.meta.url);
export const BUILD_INFO_PATH='src/build-info.js';
function sha256(buffer){return createHash('sha256').update(buffer).digest('hex');}
function localAssets(index){
  const paths=['index.html'];
  for(const match of index.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
    const value=match[1].split(/[?#]/,1)[0];
    if(!value||value===BUILD_INFO_PATH||/^(?:https?:|data:|\/\/)/i.test(value))continue;
    if(!paths.includes(value))paths.push(value);
  }
  return paths.sort();
}
export function computeBuildFingerprint(projectRoot){
  const index=readFileSync(resolve(projectRoot,'index.html'),'utf8');
  const assets=localAssets(index);
  const manifest=assets.map(path=>{
    const bytes=readFileSync(resolve(projectRoot,path));
    return \`${'${path}'}\\0${'${sha256(bytes)}'}\\n\`;
  }).join('');
  return {sha:\`sha256-${'${sha256(Buffer.from(manifest))}'}\`,assets};
}
export function writeBuildInfo(projectRoot){
  const info=computeBuildFingerprint(projectRoot);
  const body=\`window.STACKFALL_BUILD_SHA=${'${JSON.stringify(info.sha)}'};\\nwindow.STACKFALL_BUILD_ASSETS=${'${JSON.stringify(info.assets)}'};\\n\`;
  writeFileSync(resolve(projectRoot,BUILD_INFO_PATH),body);
  return info;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(ownPath)){
  const projectRoot=resolve(dirname(ownPath),'..');
  const info=writeBuildInfo(projectRoot);
  console.log(JSON.stringify(info));
}
`;
write('scripts/build-fingerprint.mjs',fingerprintModule);

replaceOnce('index.html','  <script src="src/bootstrap.js"></script>','  <script src="src/build-info.js"></script>\n  <script src="src/bootstrap.js"></script>');

{
  const path='src/dark-cosmic-polish.js';
  let text=read(path);
  const start=text.indexOf('\n  function drawTankBody(e){');
  const end=text.indexOf('\n  drawTraitSignatures=',start);
  if(start>=0&&end>start)text=text.slice(0,start)+text.slice(end);
  else if(!text.includes('drawTraitSignatures='))throw new Error(`${path}: dead renderer block markers missing`);
  write(path,text);
}

replaceOnce('README.md',
'전체 음향은 채널별 설정값을 유지한 채 최종 출력단에서 이전 빌드 대비 약 2배(+6dB)로 증폭합니다. 피크는 출력 컴프레서가 제어합니다.',
'최종 출력 gain은 `2.76`이며 채널 곡선·개별 profile·에코 send를 거친 신호를 threshold `-20dB`, ratio `4.5:1`, knee `22dB`의 컴프레서로 제한합니다. 직전 커밋에는 출력 gain `3.24`와 추가 `1.24배` wrapper가 함께 있었으므로 현재 값을 “직전 빌드 대비 +6dB”라고 표현하지 않습니다. 현재 설계는 단순 증폭보다 공격음의 고역 가독성, 무기별 음색 분리와 피크 억제를 우선합니다.');
replaceOnce('README.md',
'배경음은 일반 전투, 맵 이벤트, 초월체 전투의 세 장면으로 나뉘며 전투 상태가 바뀌면 자동 전환됩니다. 레벨업 효과음은 높은 상승음 대신 저역으로 가라앉는 음형을 사용합니다. 공격음은 높은 대역을 보강하고 코어·칼날·중력·레일 등 15개 무기 계열마다 주파수, 파형, 길이와 피치 이동을 다르게 사용합니다.',
'배경음은 일반 전투, 맵 이벤트, 초월체 전투의 세 장면으로 나뉘며 전투 상태가 바뀌면 자동 전환됩니다. 같은 장면을 반복 동기화해도 ambient interval은 하나만 유지하고, 장면 변경·비활성화 시 이전 node와 timer를 정리합니다. 레벨업 효과음은 높은 상승음 대신 220Hz에서 82.41Hz로 내려가는 저역 음형, low-pass와 41.2Hz sub tone을 사용합니다. 공격음은 높은 대역을 보강하고 코어·칼날·중력·레일 등 15개 무기 계열마다 주파수, 파형, 길이와 피치 이동을 다르게 사용합니다.');
replaceOnce('README.md',
'- 중장갑 공용 외형: `render-entities.js`',
'- 일반·이벤트 중장갑 공용 형상 helper와 Canvas 폴백 적 렌더: `render-entities.js`\n- 최종 캐시 적 렌더 진입점: `performance-guard.js`\n- 원거리 적 오버레이와 정예·화면 밖 표시: `build-audit-ui.js`\n- 맵 이벤트 형상: `dark-cosmic-polish.js`, 최종 이벤트 표시 래퍼: `build-audit-ui.js`');
replaceOnce('README.md',
'배포본은 `node scripts/browser-smoke.mjs --url=https://stackfall.pages.dev --result=test-results/live-smoke.json`으로 같은 정책을 적용해 확인합니다.',
'`node scripts/build-fingerprint.mjs`는 `index.html`과 실제 로드되는 로컬 CSS·JavaScript의 SHA-256 지문을 `src/build-info.js`에 기록합니다. 브라우저 smoke는 로컬에서 다시 계산한 지문과 페이지가 노출한 `window.STACKFALL_BUILD_SHA`를 비교하므로, 로컬 Git HEAD만 최신이고 Cloudflare Pages가 이전 자산을 제공하는 경우 실패합니다. 배포본은 `node scripts/browser-smoke.mjs --url=https://stackfall.pages.dev --result=test-results/live-smoke.json`으로 확인합니다.');

replaceOnce('docs/GAME_DESIGN.md',
'채널별 음량과 on/off 규칙은 그대로 유지한다. 최종 오디오 출력단은 이전 빌드 대비 2배(+6dB) 증폭하고, 피크는 기존 컴프레서에서 제어한다.',
'채널별 음량과 on/off 규칙은 그대로 유지한다. 현재 최종 출력 gain은 `2.76`이고 threshold `-20dB`, knee `22dB`, ratio `4.5:1`, attack `0.004s`, release `0.34s` 컴프레서를 거친다. 직전 커밋의 gain `3.24`와 `1.24배` wrapper보다 실제 pre-compressor 합성 출력은 낮으므로 “직전 빌드 대비 +6dB”라고 쓰지 않는다. 공격 가독성은 무기 profile과 고역 보조음으로 확보하고 피크·동시발음 뭉침은 컴프레서와 rate limit으로 제어한다.');
replaceOnce('docs/GAME_DESIGN.md',
'- 성능 가드가 명중음을 제한할 때도 공격 `source`를 보존해 무기별 profile이 사라지지 않아야 한다.',
'- 성능 가드가 명중음을 제한할 때도 공격 `source`를 보존해 무기별 profile이 사라지지 않아야 한다.\n- smoke는 상수가 아니라 `audio.outputNode.gain.value`와 compressor node의 실제 threshold·ratio를 읽는다.\n- master OFF에서는 새 출력 node를 만들지 않고, ambient OFF·장면 전환·reset 반복 후 interval은 하나 이하, ambient node 배열은 현재 장면 한 세트만 남아야 한다.\n- headless 검사는 routing·gain·profile·timer·node 수명만 검증하며 주관적 음색을 청취했다고 간주하지 않는다.');
replaceOnce('docs/GAME_DESIGN.md',
'1. `dark-cosmic-polish.js`\n   - 우주 비주얼, 블랙홀, 이벤트, 기본 적 외형 정의',
'1. `dark-cosmic-polish.js`\n   - 우주 비주얼, 블랙홀과 맵 이벤트 형상 정의\n   - 항상 후속 script에 덮어써지던 별도 `drawEnemiesRefined()`·로컬 `drawTankBody()` 구현은 삭제');
replaceOnce('docs/GAME_DESIGN.md',
'- 일반·이벤트 중장갑 공용 외형: `src/render-entities.js`\n- 정예와 이벤트 표시: `src/build-audit-ui.js`',
'- 일반·이벤트 중장갑 공용 형상 helper와 Canvas 폴백 적 렌더: `src/render-entities.js`\n- 최종 캐시 적 렌더 진입점: `src/performance-guard.js`\n- 원거리 적 오버레이와 정예·화면 밖 표시: `src/build-audit-ui.js`\n- 맵 이벤트 형상: `src/dark-cosmic-polish.js`, 최종 이벤트 표시 래퍼: `src/build-audit-ui.js`');
replaceOnce('docs/GAME_DESIGN.md',
'이 검사는 데스크톱·모바일 DPR, GPU 표시 옵션, 공유 shake, Prism 배율, invalid 우물·효과, due batch 세대 안전성, pause·선택·보상·이벤트 정지, 재시작 5회, 보상 이중 클릭, 게임 시간 쿨다운, BGM·무기음 routing, WebGL context loss/restore 3회, 텍스처 파괴 수, Pixi CDN 차단 Canvas 폴백, 중복 Canvas·ticker·listener와 런타임 진단을 확인한다.',
'이 검사는 데스크톱·모바일 DPR, GPU 표시 옵션, 공유 shake, Prism 배율, invalid 우물·효과, due batch 세대 안전성, pause·선택·보상·이벤트 정지, 재시작 5회, 보상 이중 클릭, 게임 시간 쿨다운, BGM·무기음 routing, 실제 output gain·compressor 값, ambient timer·node 중복, WebGL context loss/restore 3회, 텍스처 파괴 수, Pixi CDN 차단 Canvas 폴백, 중복 Canvas·ticker·listener, 배포 자산 SHA-256 지문과 런타임 진단을 확인한다.');
replaceOnce('docs/GAME_DESIGN.md',
'배포본 검사는 `--url=https://stackfall.pages.dev --result=test-results/live-smoke.json`을 함께 사용한다. 테스트 수치는 게임 화면이 아니라 하네스 JSON 출력에만 기록한다.',
'`node scripts/build-fingerprint.mjs`는 `index.html`과 페이지가 실제 로드하는 로컬 CSS·JavaScript(자기 자신인 `src/build-info.js` 제외)의 SHA-256 지문을 생성한다. smoke는 로컬에서 재계산한 지문과 페이지의 `window.STACKFALL_BUILD_SHA`를 비교하고 URL에 cache-bust query를 붙인다. 이는 Git commit SHA를 정적 파일에 수동 복사하는 방식이 아니며, 배포 자산이 현재 checkout과 동일한지를 검증한다. 배포본 검사는 `--url=https://stackfall.pages.dev --result=test-results/live-smoke.json`을 함께 사용한다. 테스트 수치는 게임 화면이 아니라 하네스 JSON 출력에만 기록한다.');

{
  const path='scripts/browser-smoke.mjs';
  let text=read(path);
  if(!text.includes("from './build-fingerprint.mjs'"))text=text.replace("import {fileURLToPath} from 'node:url';", "import {fileURLToPath} from 'node:url';\nimport {computeBuildFingerprint} from './build-fingerprint.mjs';");
  const oldUrl="const gameUrl=argValue('url')||process.env.STACKFALL_URL||'http://127.0.0.1:8000/';";
  const newUrl="const requestedGameUrl=argValue('url')||process.env.STACKFALL_URL||'http://127.0.0.1:8000/';\nconst runType=/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/i.test(new URL(requestedGameUrl).hostname)?'local':'live';\nconst expectedBuildSha=computeBuildFingerprint(root).sha;\nconst targetUrl=new URL(requestedGameUrl);targetUrl.searchParams.set('build-check',expectedBuildSha);\nconst gameUrl=targetUrl.href;";
  if(text.includes(oldUrl))text=text.replace(oldUrl,newUrl);
  else if(!text.includes('const expectedBuildSha='))throw new Error(`${path}: URL declaration not found`);
  text=text.replace("let browser=null,debugPort=0,chromeVersion='unknown';","let browser=null,debugPort=0,chromeVersion='unknown',deployedBuildSha=null;");
  const oldResult="const result={ok:failures.length===0,startedAt,endedAt:new Date().toISOString(),url:gameUrl,runType:/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/i.test(new URL(gameUrl).hostname)?'local':'live',commit:commitSha(),chromeVersion";
  const newResult="const result={ok:failures.length===0,startedAt,endedAt:new Date().toISOString(),url:requestedGameUrl,checkedUrl:gameUrl,runType,commit:commitSha(),expectedBuildSha,deployedBuildSha,chromeVersion";
  if(text.includes(oldResult))text=text.replace(oldResult,newResult);
  else if(!text.includes('expectedBuildSha,deployedBuildSha'))throw new Error(`${path}: result object marker not found`);
  const mainMarker="async function mainScenario(page,scenario){\n  await evaluate(page,\"GAME_SETTINGS.audio.master=false;resetGame();const target=state.entities.enemies[0];target.x=player.x+180;target.y=player.y;target.speed=0;player.coreCd=0\");";
  const mainReplacement="async function mainScenario(page,scenario){\n  deployedBuildSha=await evaluate(page,\"window.STACKFALL_BUILD_SHA||document.querySelector('meta[name=\\\"stackfall-build\\\"]')?.content||null\");scenario.observations.build={expected:expectedBuildSha,deployed:deployedBuildSha};check(deployedBuildSha===expectedBuildSha,`deployed build mismatch: expected ${expectedBuildSha}, got ${deployedBuildSha}`,page.name);\n  await evaluate(page,\"GAME_SETTINGS.audio.master=false;resetGame();const target=state.entities.enemies[0];target.x=player.x+180;target.y=player.y;target.speed=0;player.coreCd=0\");";
  if(text.includes(mainMarker))text=text.replace(mainMarker,mainReplacement);
  else if(!text.includes('scenario.observations.build='))throw new Error(`${path}: main scenario marker not found`);
  const audioStart=text.indexOf('  const audioProfiles=await evaluate(page,`(()=>{');
  const fixtureStart=text.indexOf('\n  const fixture=await prepareStress(page);',audioStart);
  if(audioStart<0||fixtureStart<0)throw new Error(`${path}: audio test block not found`);
  const audioBlock=`  const audioProfiles=await evaluate(page,\`(()=>{\n    const saved={master:GAME_SETTINGS.audio.master,combat:GAME_SETTINGS.audio.combat,ui:GAME_SETTINGS.audio.ui,ambient:GAME_SETTINGS.audio.ambient,mode:state.mode,active:state.mapEventActive,apex:state.apexActiveId,pending:state.pendingApexForm,theme:state.realmTheme};\n    GAME_SETTINGS.audio.master=true;GAME_SETTINGS.audio.combat=true;GAME_SETTINGS.audio.ui=true;GAME_SETTINGS.audio.ambient=false;audio.init();\n    const output=audio.outputNode,compressor=audio.fxNodes?.[0],outputBeforeOff=output;\n    const actual={outputGain:output?.gain?.value??null,compressorThreshold:compressor?.threshold?.value??null,compressorRatio:compressor?.ratio?.value??null,compressorKnee:compressor?.knee?.value??null};\n    state.mode='playing';state.mapEventActive=null;state.apexActiveId=null;state.pendingApexForm=null;state.realmTheme='space';const combat=audio.musicSceneForState();\n    state.mapEventActive={type:'crash'};const event=audio.musicSceneForState();state.mapEventActive=null;state.realmTheme='void';const voidScene=audio.musicSceneForState();state.realmTheme='space';state.pendingApexForm='starforge';const apexPending=audio.musicSceneForState();state.pendingApexForm=null;state.apexActiveId=999;const apexActive=audio.musicSceneForState();state.apexActiveId=null;state.realmTheme='apex-forge';const apexRealm=audio.musicSceneForState();state.realmTheme='space';\n    const weapon=audio.weapon;let routed=null;audio.weapon=key=>{routed=key;};audio.hit(true,'rail-beam');audio.weapon=weapon;const unknown=audio.weaponKey('unclassified-source');\n    const levelSource=audio.level.toString(),levelDescending=levelSource.includes('220,174.61,138.59,103.83,82.41')&&levelSource.includes(\"filterType:'lowpass'\")&&levelSource.includes('41.2');\n    GAME_SETTINGS.audio.master=false;audio.playChannel('combat',440,.05,'sine',.01,0);const masterOffKeptOutput=audio.outputNode===outputBeforeOff;\n    GAME_SETTINGS.audio.master=true;GAME_SETTINGS.audio.ambient=true;audio.syncAmbient(true);const timer=audio.ambientTimer,nodes=audio.ambientNodes.length,scene=audio.musicScene;for(let i=0;i<20;i++)audio.syncAmbient();const sameScene={timerStable:audio.ambientTimer===timer,nodeStable:audio.ambientNodes.length===nodes,scene:audio.musicScene,nodes:audio.ambientNodes.length};\n    for(let i=0;i<10;i++){state.mapEventActive={type:'crash'};audio.syncAmbient(true);state.mapEventActive=null;audio.syncAmbient(true);state.pendingApexForm='starforge';audio.syncAmbient(true);state.pendingApexForm=null;audio.syncAmbient(true);}const cycled={timerActive:!!audio.ambientTimer,nodes:audio.ambientNodes.length,scene:audio.musicScene};\n    GAME_SETTINGS.audio.ambient=false;audio.syncAmbient();const ambientOff={timerActive:!!audio.ambientTimer,nodes:audio.ambientNodes.length};\n    Object.assign(GAME_SETTINGS.audio,{master:saved.master,combat:saved.combat,ui:saved.ui,ambient:saved.ambient});Object.assign(state,{mode:saved.mode,mapEventActive:saved.active,apexActiveId:saved.apex,pendingApexForm:saved.pending,realmTheme:saved.theme});if(!saved.master||!saved.ambient)audio.stopAmbient();else audio.syncAmbient(true);\n    return{combat,event,voidScene,apexPending,apexActive,apexRealm,routed,unknown,profiles:audio.soundProfiles,actual,levelDescending,masterOffKeptOutput,sameScene,cycled,ambientOff,initialScene:scene};\n  })()\`);scenario.observations.audio=audioProfiles;\n  check(audioProfiles.combat==='combat'&&audioProfiles.event==='event'&&audioProfiles.voidScene==='event'&&audioProfiles.apexPending==='apex'&&audioProfiles.apexActive==='apex'&&audioProfiles.apexRealm==='apex','scene-aware BGM routing is incomplete',page.name);\n  check(audioProfiles.routed==='rail'&&audioProfiles.profiles.weapons.length===15&&audioProfiles.profiles.level==='submerged-descending'&&audioProfiles.levelDescending,'weapon/level sound profiles are incomplete',page.name);\n  check(Number.isFinite(audioProfiles.actual.outputGain)&&Math.abs(audioProfiles.actual.outputGain-2.76)<1e-9,\`actual output gain mismatch: ${'${audioProfiles.actual.outputGain}'}\`,page.name);\n  check(audioProfiles.actual.compressorThreshold===-20&&audioProfiles.actual.compressorRatio===4.5&&audioProfiles.actual.compressorKnee===22,'compressor runtime settings mismatch',page.name);\n  check(audioProfiles.masterOffKeptOutput,'master OFF created or replaced the output node',page.name);\n  check(audioProfiles.sameScene.timerStable&&audioProfiles.sameScene.nodeStable,'same-scene sync duplicated ambient timer/nodes',page.name);\n  check(audioProfiles.cycled.timerActive&&audioProfiles.cycled.nodes===audioProfiles.sameScene.nodes,'scene cycling leaked ambient nodes/timers',page.name);\n  check(!audioProfiles.ambientOff.timerActive&&audioProfiles.ambientOff.nodes===0,'ambient OFF did not clear nodes/timer',page.name);\n  check(audioProfiles.unknown==='core','unknown attack source fallback changed unexpectedly',page.name);`;
  text=text.slice(0,audioStart)+audioBlock+text.slice(fixtureStart);
  const oldSoak="canvasCount:document.querySelectorAll('canvas').length,pending:state.pendingActions.length};})()`);";
  const newSoak="canvasCount:document.querySelectorAll('canvas').length,pending:state.pendingActions.length,audio:{scene:audio.musicScene,ambientNodes:audio.ambientNodes?.length||0,ambientTimerActive:!!audio.ambientTimer,outputGain:audio.outputNode?.gain?.value??null,compressorThreshold:audio.fxNodes?.[0]?.threshold?.value??null}};})()`);";
  if(text.includes(oldSoak))text=text.replace(oldSoak,newSoak);
  else if(!text.includes('ambientTimerActive:!!audio.ambientTimer'))throw new Error(`${path}: soak payload marker not found`);
  write(path,text);
}

const {writeBuildInfo}=await import('./build-fingerprint.mjs');
const info=writeBuildInfo(root);
console.log(`build fingerprint ${info.sha} (${info.assets.length} assets)`);

for(const path of ['scripts/apply-audit-patch.mjs','.github/workflows/stackfall-maintenance.yml']){
  const target=resolve(root,path);if(existsSync(target))unlinkSync(target);
}
