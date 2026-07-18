from pathlib import Path

root = Path(__file__).resolve().parents[1]

def replace_once(path, old, new, label):
    text = path.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')

build = root / 'src/build-audit-ui.js'
old_draw = "  const baseDrawEnemies=drawEnemies;drawEnemies=function auditedEnemyDraw(){baseDrawEnemies();drawRangedOverlay();};"
new_draw = """  function safeEdge(dx,dy,bottomGap=154){const cx=vw/2,cy=vh/2,left=76,right=vw-76,top=82,bottom=vh-bottomGap,values=[];if(dx>0)values.push((right-cx)/dx);else if(dx<0)values.push((left-cx)/dx);if(dy>0)values.push((bottom-cy)/dy);else if(dy<0)values.push((top-cy)/dy);const s=Math.min(...values.filter(v=>v>0));return{x:cx+dx*s,y:cy+dy*s};}
  function drawRangedOverlay(){for(const e of state.entities.enemies){if(e.dead||e.type!=='ranged')continue;const p=worldToScreen(e.x,e.y);if(p.x<-50||p.x>vw+50||p.y<-50||p.y>vh+50)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x));ctx.strokeStyle=e.eventKind==='crash'?'#ffd078':'#75eaff';ctx.fillStyle='rgba(6,20,34,.92)';ctx.lineWidth=2;ctx.shadowBlur=14;ctx.shadowColor=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(e.r,0);ctx.lineTo(e.r*.22,-e.r*.72);ctx.lineTo(-e.r*.76,-e.r*.44);ctx.lineTo(-e.r*.76,e.r*.44);ctx.lineTo(e.r*.22,e.r*.72);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(e.r*.20,-2,e.r*.92,4);ctx.beginPath();ctx.arc(-e.r*.12,0,3,0,TAU);ctx.fill();ctx.restore();}}
  const baseDrawEnemies=drawEnemies;drawEnemies=function auditedEnemyDraw(){baseDrawEnemies();drawRangedOverlay();};"""
replace_once(build, old_draw, new_draw, 'restore non-elite enemy helpers')

contract = root / 'scripts/community-feedback-contract.mjs'
elite_check = "expect('elite labels removed from battlefield',!read('src/build-audit-ui.js').includes('drawEliteMarkers')&&!performance.includes('drawEliteEdgeIndicator')&&read('src/combat-balance-refinement.js').includes('bossHudType'));"
helper_check = "expect('ranged overlay and map edge helper remain defined',read('src/build-audit-ui.js').includes('function drawRangedOverlay()')&&read('src/build-audit-ui.js').includes('function safeEdge('));"
replace_once(contract, elite_check, elite_check + '\n' + helper_check, 'add helper ownership contract')

smoke = root / 'scripts/browser-smoke.mjs'
old_cleanup = """  if(browser&&!browser.killed){browser.kill();await Promise.race([new Promise(done=>browser.once('exit',done)),sleep(3000)]);}
  const tempRoot=resolve(tmpdir())+sep,target=resolve(profile);if(target.startsWith(tempRoot)){try{rmSync(target,{recursive:true,force:true,maxRetries:5,retryDelay:200});}catch(error){failures.push(`[harness] temporary profile cleanup failed: ${error.message}`);}}"""
new_cleanup = """  if(browser&&browser.exitCode===null){browser.kill('SIGTERM');await Promise.race([new Promise(done=>browser.once('exit',done)),sleep(3000)]);if(browser.exitCode===null){browser.kill('SIGKILL');await Promise.race([new Promise(done=>browser.once('exit',done)),sleep(1200)]);}}
  const tempRoot=resolve(tmpdir())+sep,target=resolve(profile);if(target.startsWith(tempRoot)){let cleanupError=null;for(let attempt=0;attempt<8;attempt++){try{rmSync(target,{recursive:true,force:true,maxRetries:3,retryDelay:160});cleanupError=null;break;}catch(error){cleanupError=error;await sleep(180*(attempt+1));}}if(cleanupError&&existsSync(target))failures.push(`[harness] temporary profile cleanup failed after retries: ${cleanupError.message}`);}"""
replace_once(smoke, old_cleanup, new_cleanup, 'stabilize browser profile cleanup')

print('Applied validated browser follow-up fixes.')
