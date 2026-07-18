from pathlib import Path


def replace_once(path, old, new, label):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


path = Path('src/build-audit-ui.js')
text = path.read_text(encoding='utf-8')
old = """  function safeEdge(dx,dy,bottomGap=154){const cx=vw/2,cy=vh/2,left=76,right=vw-76,top=82,bottom=vh-bottomGap,values=[];if(dx>0)values.push((right-cx)/dx);else if(dx<0)values.push((left-cx)/dx);if(dy>0)values.push((bottom-cy)/dy);else if(dy<0)values.push((top-cy)/dy);const s=Math.min(...values.filter(v=>v>0));return{x:cx+dx*s,y:cy+dy*s};}
  function drawRangedOverlay(){for(const e of state.entities.enemies){if(e.dead||e.type!=='ranged')continue;const p=worldToScreen(e.x,e.y);if(p.x<-50||p.x>vw+50||p.y<-50||p.y>vh+50)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x));ctx.strokeStyle=e.eventKind==='crash'?'#ffd078':'#75eaff';ctx.fillStyle='rgba(6,20,34,.92)';ctx.lineWidth=2;ctx.shadowBlur=14;ctx.shadowColor=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(e.r,0);ctx.lineTo(e.r*.22,-e.r*.72);ctx.lineTo(-e.r*.76,-e.r*.44);ctx.lineTo(-e.r*.76,e.r*.44);ctx.lineTo(e.r*.22,e.r*.72);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(e.r*.20,-2,e.r*.92,4);ctx.beginPath();ctx.arc(-e.r*.12,0,3,0,TAU);ctx.fill();ctx.restore();}}
  const baseDrawEnemies=drawEnemies;drawEnemies=function auditedEnemyDraw(){baseDrawEnemies();drawRangedOverlay();};"""
new = """  let guidanceEliteArrows=0,guidanceEventArrows=0;
  function safeEdge(dx,dy,bottomGap=154){const cx=vw/2,cy=vh/2,left=76,right=vw-76,top=82,bottom=vh-bottomGap,values=[];if(dx>0)values.push((right-cx)/dx);else if(dx<0)values.push((left-cx)/dx);if(dy>0)values.push((bottom-cy)/dy);else if(dy<0)values.push((top-cy)/dy);const positive=values.filter(v=>v>0),s=positive.length?Math.min(...positive):1;return{x:cx+dx*s,y:cy+dy*s};}
  function drawRangedOverlay(){for(const e of state.entities.enemies){if(e.dead||e.type!=='ranged')continue;const p=worldToScreen(e.x,e.y);if(p.x<-50||p.x>vw+50||p.y<-50||p.y>vh+50)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x));ctx.strokeStyle=e.eventKind==='crash'?'#ffd078':'#75eaff';ctx.fillStyle='rgba(6,20,34,.92)';ctx.lineWidth=2;ctx.shadowBlur=14;ctx.shadowColor=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(e.r,0);ctx.lineTo(e.r*.22,-e.r*.72);ctx.lineTo(-e.r*.76,-e.r*.44);ctx.lineTo(-e.r*.76,e.r*.44);ctx.lineTo(e.r*.22,e.r*.72);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(e.r*.20,-2,e.r*.92,4);ctx.beginPath();ctx.arc(-e.r*.12,0,3,0,TAU);ctx.fill();ctx.restore();}}
  function eliteGuidanceMeta(e){const korean=GAME_SETTINGS.language==='ko',apex=e.kind==='apex',voidBoss=e.kind==='void'||e.eventKind==='void',mini=e.type==='mini';return{label:apex?(korean?'초월체':'APEX'):voidBoss?(korean?'공허 보스':'VOID BOSS'):mini?(korean?'중간보스':'MINI-BOSS'):(korean?'보스':'BOSS'),icon:apex?'✦':voidBoss?'◉':mini?'◇':'◆',color:apex?'#fff0a8':voidBoss?'#c38cff':mini?'#8fdcff':'#ff78bd'};}
  function drawEliteEdgeArrows(){guidanceEliteArrows=0;const bottomGap=compactDevice()?180:154,left=76,right=vw-76,top=82,bottom=vh-bottomGap;let ordinal=0;for(const e of state.entities.enemies){if(!e||e.dead||!['mini','boss'].includes(e.type))continue;const p=worldToScreen(e.x,e.y),visible=p.x>left&&p.x<right&&p.y>top&&p.y<bottom;if(visible)continue;const dx=p.x-vw/2,dy=p.y-vh/2,a=Math.atan2(dy,dx),edge=safeEdge(dx,dy,bottomGap),lane=((ordinal++%3)-1)*22;edge.x=clamp(edge.x-Math.sin(a)*lane,left,right);edge.y=clamp(edge.y+Math.cos(a)*lane,top,bottom);const m=eliteGuidanceMeta(e),distance=Math.round(Math.hypot(e.x-player.x,e.y-player.y));ctx.save();ctx.translate(edge.x,edge.y);ctx.rotate(a);ctx.fillStyle=m.color;ctx.shadowBlur=22;ctx.shadowColor=m.color;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(-11,-11);ctx.lineTo(-5,0);ctx.lineTo(-11,11);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-4,-4);ctx.lineTo(-1,0);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();ctx.save();ctx.font='900 10px \"IBM Plex Sans KR\",sans-serif';ctx.textAlign=edge.x<vw/2?'left':'right';ctx.textBaseline='middle';const label=`${m.icon} ${m.label} · ${distance}`,x=edge.x+(edge.x<vw/2?28:-28),w=Math.min(170,ctx.measureText(label).width+18);ctx.fillStyle='rgba(4,7,19,.90)';ctx.beginPath();ctx.roundRect(edge.x<vw/2?x-8:x-w+8,edge.y-11,w,22,8);ctx.fill();ctx.fillStyle=m.color;ctx.fillText(label,x,edge.y,w-10);ctx.restore();guidanceEliteArrows++;}}
  const baseDrawEnemies=drawEnemies;drawEnemies=function auditedEnemyDraw(){baseDrawEnemies();drawRangedOverlay();drawEliteEdgeArrows();};"""
if old not in text:
    raise SystemExit('build audit guidance owner: source block not found')
text = text.replace(old, new, 1)
marker = '\n  renderLoadout();updateHUD();'
tracker = """
  const baseAuditedDrawMapEvents=drawMapEvents;drawMapEvents=function trackedMapEventGuidance(){guidanceEventArrows=0;if(!state.mapEventActive){const bottomGap=compactDevice()?180:154,left=76,right=vw-76,top=82,bottom=vh-bottomGap;for(const marker of state.entities.mapEvents||[]){if(marker?.consumed)continue;const p=worldToScreen(marker.x,marker.y);if(!(p.x>left&&p.x<right&&p.y>top&&p.y<bottom))guidanceEventArrows++;}}return baseAuditedDrawMapEvents();};
  window.stackfallGuidanceDiagnostics=()=>({eliteArrows:guidanceEliteArrows,eventArrows:guidanceEventArrows});
"""
if marker not in text:
    raise SystemExit('guidance diagnostics insertion marker missing')
path.write_text(text.replace(marker, tracker + marker, 1), encoding='utf-8')

replace_once(
    'README.md',
    '- Random upgrade notices remain visible two seconds longer. Elite and mini-boss labels are not drawn over the battlefield; their category and name are shown only in the top boss HUD.',
    '- Random upgrade notices remain visible two seconds longer. Elite and mini-boss labels are not drawn over enemy bodies; the top boss HUD shows their category and name, while off-screen bosses retain compact direction arrows with category and distance.',
    'README guidance rule',
)
replace_once(
    'docs/GAME_DESIGN.md',
    '- 정예 및 중간보스의 이름·종류·체력은 상단 보스 HUD에서만 표시한다. 적 개체 위나 화면 가장자리에 별도 테두리·이름표·MINI 표식을 그리지 않는다.',
    '- 정예 및 중간보스의 이름·종류·체력은 상단 보스 HUD에 표시한다. 적 개체 위에는 별도 테두리·이름표·MINI 문구를 그리지 않지만, 화면 밖에 있을 때는 종류·거리와 방향 화살표를 반드시 표시한다. 맵 이벤트의 화면 밖 방향 화살표도 같은 필수 안내 계층으로 유지한다.',
    'game design guidance rule',
)
replace_once(
    'docs/WIKI.md',
    '- 정예와 중간보스의 종류·이름·체력은 화면 위쪽 보스 HUD에 표시됩니다. 적 위에는 별도 이름표나 `중간보스` 문구를 띄우지 않습니다.',
    '- 정예와 중간보스의 종류·이름·체력은 화면 위쪽 보스 HUD에 표시됩니다. 적 위에는 별도 이름표나 `중간보스` 문구를 띄우지 않지만, 화면 밖에 있으면 종류·거리와 방향 화살표가 나타납니다. 우주선·공허 균열·성운 보관소 같은 맵 이벤트도 화면 밖 방향 화살표가 유지됩니다.',
    'wiki guidance rule',
)

contract = Path('scripts/community-feedback-contract.mjs')
c = contract.read_text(encoding='utf-8')
old_const = "const core=read('src/core.js'),systems=read('src/systems.js'),runtime=read('src/runtime-config.js'),render=read('src/render-entities.js'),performance=read('src/performance-guard.js'),background=read('src/realm-backgrounds.js'),bosses=read('src/bosses.js'),patterns=read('src/boss-patterns.js'),progression=read('src/progression-expansion.js'),styles=read('styles.css'),wiki=read('docs/WIKI.md'),validate=read('.github/workflows/validate.yml');"
new_const = "const core=read('src/core.js'),systems=read('src/systems.js'),runtime=read('src/runtime-config.js'),render=read('src/render-entities.js'),performance=read('src/performance-guard.js'),buildAudit=read('src/build-audit-ui.js'),renderLoop=read('src/render.js'),gpu=read('src/gpu-renderer.js'),background=read('src/realm-backgrounds.js'),bosses=read('src/bosses.js'),patterns=read('src/boss-patterns.js'),progression=read('src/progression-expansion.js'),styles=read('styles.css'),wiki=read('docs/WIKI.md'),validate=read('.github/workflows/validate.yml');"
if old_const not in c:
    raise SystemExit('community contract source list missing')
c = c.replace(old_const, new_const, 1)
old_elite = "expect('elite labels removed from battlefield',!read('src/build-audit-ui.js').includes('drawEliteMarkers')&&!performance.includes('drawEliteEdgeIndicator')&&read('src/combat-balance-refinement.js').includes('bossHudType'));"
new_elite = "expect('elite body labels removed but off-screen arrows retained',!buildAudit.includes('drawEliteMarkers')&&!performance.includes('drawEliteEdgeIndicator')&&buildAudit.includes('drawEliteEdgeArrows')&&buildAudit.includes('stackfallGuidanceDiagnostics')&&read('src/combat-balance-refinement.js').includes('bossHudType'));"
if old_elite not in c:
    raise SystemExit('community elite contract missing')
c = c.replace(old_elite, new_elite, 1)
old_helper = "expect('ranged overlay and map edge helper remain defined',read('src/build-audit-ui.js').includes('function drawRangedOverlay()')&&read('src/build-audit-ui.js').includes('function safeEdge('));"
new_helper = "expect('ranged overlay and map edge helper remain defined',buildAudit.includes('function drawRangedOverlay()')&&buildAudit.includes('function safeEdge('));\nexpect('map event arrows remain on canvas and GPU paths',buildAudit.includes('drawMapEvents=function auditedEventIndicators')&&buildAudit.includes('guidanceEventArrows')&&renderLoop.includes(\"runDrawStage('drawMapEvents'\")&&gpu.includes(\"runDrawStage('drawMapEventsForeground'\"));"
if old_helper not in c:
    raise SystemExit('community helper contract missing')
contract.write_text(c.replace(old_helper, new_helper, 1), encoding='utf-8')

replace_once(
    'scripts/polish-contract-check.mjs',
    "['elite labels live only in top HUD',!read('src/build-audit-ui.js').includes('drawEliteMarkers')&&!read('src/performance-guard.js').includes('drawEliteEdgeIndicator')&&read('src/combat-balance-refinement.js').includes('bossHudType')],",
    "['elite body labels removed and off-screen arrows retained',!read('src/build-audit-ui.js').includes('drawEliteMarkers')&&!read('src/performance-guard.js').includes('drawEliteEdgeIndicator')&&read('src/build-audit-ui.js').includes('drawEliteEdgeArrows')&&read('src/combat-balance-refinement.js').includes('bossHudType')],",
    'polish guidance contract',
)

smoke = Path('scripts/browser-smoke.mjs')
s = smoke.read_text(encoding='utf-8')
hook = "  const eventApex=await evaluate(page,`(()=>{"
insert = """  const guidance=await evaluate(page,`(()=>{resetGame();state.spawnTimer=9999;const elite=spawnEnemy('mini');elite.x=player.x+vw*2;elite.y=player.y;state.entities.mapEvents=[{type:'vault',x:player.x-vw*2,y:player.y,consumed:false}];draw();return window.stackfallGuidanceDiagnostics?.()||null;})()`);scenario.observations.guidance=guidance;check(guidance?.eliteArrows>=1&&guidance?.eventArrows>=1,`off-screen guidance missing: ${JSON.stringify(guidance)}`,page.name);

"""
if hook not in s:
    raise SystemExit('browser guidance hook missing')
smoke.write_text(s.replace(hook, insert + hook, 1), encoding='utf-8')

print('Restored off-screen boss and map-event guidance.')
