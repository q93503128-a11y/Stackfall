from pathlib import Path
import re


def replace_function(text: str, name: str, replacement: str) -> str:
    marker = f"function {name}("
    start = text.find(marker)
    if start < 0:
        raise SystemExit(f"function not found: {name}")
    brace = text.find('{', start)
    if brace < 0:
        raise SystemExit(f"function brace not found: {name}")
    depth = 0
    quote = None
    escaped = False
    i = brace
    while i < len(text):
        ch = text[i]
        if quote:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                quote = None
        else:
            if ch in "'\"`":
                quote = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return text[:start] + replacement.strip() + text[i + 1:]
        i += 1
    raise SystemExit(f"unterminated function: {name}")


# ---------------------------------------------------------------------------
# Boss patterns: real movement pressure and distinct attack grammar.
# ---------------------------------------------------------------------------
patterns_path = Path('src/boss-patterns.js')
patterns = patterns_path.read_text(encoding='utf-8')

boss_anti_idle = r'''function bossAntiIdleSkill(e,dt){
  if(!e||e.dead||e.type!=='boss'||e.kind!=='apex')return;
  e.antiIdleSampleCd=(e.antiIdleSampleCd||0)-dt;e.antiIdleCd=(e.antiIdleCd??3.4)-dt;
  if(e.antiIdleSampleCd<=0){e.antiIdleSampleCd=.24;const lx=Number.isFinite(e.antiIdlePlayerX)?e.antiIdlePlayerX:player.x,ly=Number.isFinite(e.antiIdlePlayerY)?e.antiIdlePlayerY:player.y,moved=Math.hypot(player.x-lx,player.y-ly);e.antiIdleStill=moved<7?(e.antiIdleStill||0)+.24:Math.max(0,(e.antiIdleStill||0)-.72);e.antiIdlePlayerX=player.x;e.antiIdlePlayerY=player.y;}
  if((e.antiIdleStill||0)<1.20||e.antiIdleCd>0)return;
  e.antiIdleStill=.25;e.antiIdleCd=3.05;const d=Math.max(4,e.damage*.30),x=player.x,y=player.y,form=e.apexForm||e.eliteForm;
  if(form==='chronophage'){
    addCircle(x,y,58,d*1.08,'#79ffe1',.72);addCircle(x,y,92,d*.72,'#c6fff4',1.02);
  }else if(form==='starforge'){
    addCircle(x,y,68,d*1.12,'#ff7135',.76);const aim=Math.atan2(y-e.y,x-e.x);for(let i=-3;i<=3;i++)spawnEnemyProjectile(e.x,e.y,aim+i*.105,215+Math.abs(i)*8,d*.56,i%2?'#ffd26f':'#ff9d42',5.4,6,'forge');
  }else if(form==='lastconstellation'){
    const sx=184,sy=112;rawLine(x-sx,y-sy,x+sx,y+sy,18,d,'#d8e2ff',.88,'constellation-link');rawLine(x-sx,y+sy,x+sx,y-sy,18,d*.88,'#879be0',1.02,'constellation-link');
  }else addCircle(x,y,52,d,e.color||'#ff72cb',1.08);
}'''
patterns = replace_function(patterns, 'bossAntiIdleSkill', boss_anti_idle)

chrono_signature = r'''function chronophageSignature(e,d,arena,phase){
  const history=e.apexPlayerHistory||[],now={x:player.x,y:player.y},p1=history[Math.max(0,history.length-(3+phase))]||now,p2=history[Math.max(0,history.length-(7+phase))]||p1,p3=history[Math.max(0,history.length-(10+phase))]||p2;
  // Present position always owns a real delayed rupture, so an idle player cannot null the pattern.
  addCircle(now.x,now.y,48+phase*5,d*1.00,'#d9fff8',.72);
  addCircle(p1.x,p1.y,42+phase*4,d*.70,'#79ffe1',.90);
  addCircle(p2.x,p2.y,50+phase*4,d*.58,'#9fffea',1.08);
  const dx=now.x-p2.x,dy=now.y-p2.y,len=Math.hypot(dx,dy);
  if(len>42){const nx=-dy/len,ny=dx/len,half=Math.min(170,92+phase*18);rawLine(now.x-nx*half,now.y-ny*half,now.x+nx*half,now.y+ny*half,14+phase,d*.66,'#bffdf3',1.00,'temporal-shear');}
  else addCircle(now.x,now.y,82+phase*6,d*.62,'#bffdf3',1.12);
  if(phase>=3){bossLater(e,330,()=>addCircle(player.x,player.y,44+phase*4,d*.72,'#ecfffb',.66));}
  if(phase===4){bossLater(e,620,()=>{const q={x:player.x,y:player.y};addCircle(q.x,q.y,60,d*.82,'#79ffe1',.64);addCircle(p3.x,p3.y,68,d*.52,'#c6fff4',.84);});}
}'''
patterns = replace_function(patterns, 'chronophageSignature', chrono_signature)

starforge_signature = r'''function starforgeSignature(e,d,arena,phase){
  const target=predictedPlayer(42+phase*16),primary=62+phase*6;
  addCircle(target.x,target.y,primary,d*1.10,'#ff7135',.78);
  const satellites=3+phase;
  for(let i=0;i<satellites;i++){const a=i/satellites*TAU+e.phase*.04,rr=92+phase*8+(i%2)*26;addCircle(target.x+Math.cos(a)*rr,target.y+Math.sin(a)*rr,38+phase*3,d*.58,i%2?'#ffd26f':'#ff9d42',.92+i*.055);}
  bossLater(e,430,()=>{if(e.dead)return;const aim=Math.atan2(player.y-e.y,player.x-e.x),count=7+phase*2;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.085;spawnEnemyProjectile(e.x,e.y,aim+off,195+phase*13,d*.52,i%2?'#fff1b0':'#ff9d42',5.4,6,'forge');}});
}'''
patterns = replace_function(patterns, 'starforgeSignature', starforge_signature)

constellation_signature = r'''function localConstellationPoints(cx,cy,count,radius,phase=0){const points=[];for(let i=0;i<count;i++){const a=i/count*TAU+phase,rr=radius*(i%2?1:.84);points.push({x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr});}return points;}
function constellationCage(e,d,arena,phase,life=1.02){
  const cx=player.x,cy=player.y,count=6+phase,radius=Math.min(arena.r*.42,142+phase*14),points=localConstellationPoints(cx,cy,count,radius,e.phase*.025),jump=phase>=3?2:1;
  for(let i=0;i<count;i++){if(i===count-1)continue;const a=points[i],b=points[(i+jump)%count];rawLine(a.x,a.y,b.x,b.y,11+phase,d*.54,i%2?'#9fb2ef':'#d8e2ff',life+i*.018,'constellation-link');}
  const a=points[0],b=points[Math.floor(count/2)],c=points[1],q=points[(1+Math.floor(count/2))%count];rawLine(a.x,a.y,b.x,b.y,16+phase,d*.92,'#ffffff',life*.88,'constellation-link');rawLine(c.x,c.y,q.x,q.y,14+phase,d*.72,'#879be0',life*1.04,'constellation-link');
  return points;
}
function constellationNodeVolley(e,d,arena,phase){
  const target={x:player.x,y:player.y},points=localConstellationPoints(target.x,target.y,5+phase,Math.min(arena.r*.46,180+phase*12),-e.phase*.02);
  for(let i=0;i<points.length;i++){const point=points[i],aim=Math.atan2(target.y-point.y,target.x-point.x);for(const off of[-.065,.065])spawnEnemyProjectile(point.x,point.y,aim+off,168+phase*18,d*.56,i%2?'#f0f4ff':'#9fb2ef',4.2,6,'constellation');}
}
function constellationSignature(e,d,arena,phase){
  constellationCage(e,d,arena,phase,1.06);bossLater(e,430,()=>{if(!e.dead)constellationNodeVolley(e,d*.92,arena,phase);});if(phase>=2)teleportConstellation(e,phase,.56);
}'''
patterns = replace_function(patterns, 'constellationSignature', constellation_signature)
# Insert the helper functions before the replacement function. replace_function replaced only constellationSignature;
# prepend helpers immediately before it.
needle = 'function constellationSignature(e,d,arena,phase){\n  constellationCage'
if 'function localConstellationPoints' not in patterns:
    raise SystemExit('constellation helpers were not inserted')

apex_skill = r'''function apexBossSkill(e,dt){
  e.apexElapsed=(e.apexElapsed||0)+dt;rememberApexPlayer(e,dt);
  const health=e.hp/Math.max(1,e.maxHp),healthPhase=health<.25?4:health<.50?3:health<.75?2:1,timePhase=e.apexElapsed>=240?4:e.apexElapsed>=180?3:e.apexElapsed>=105?2:1,phase=Math.max(healthPhase,timePhase),terminal=phase===4&&e.apexElapsed>=240,k=terminal?.42:[1,.86,.72,.58][phase-1];
  e.apexPhase=phase;e.timeLock=0;if((e.attackLockUntil||0)>state.time)return;
  e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;e.signatureCd=(e.signatureCd??5.8)-dt/k;
  const d=Math.max(7,e.damage*.40),f=e.eliteForm,arena=state.apexArena||{x:player.x,y:player.y,r:460};
  if(e.signatureCd<=0){e.signatureCd=Math.max(5.4,8.8-phase*.82);if(f==='chronophage')chronophageSignature(e,d,arena,phase);else if(f==='starforge')starforgeSignature(e,d,arena,phase);else constellationSignature(e,d,arena,phase);}
  e.apexFrenzyCd=(e.apexFrenzyCd??1.35)-dt;
  if(terminal&&e.apexFrenzyCd<=0){e.apexFrenzyCd=.95;if(f==='chronophage')addCircle(player.x,player.y,48,d*.78,'#d9fff8',.58);else if(f==='starforge'){addCircle(player.x,player.y,52,d*.82,'#ff7135',.60);const aim=Math.atan2(player.y-e.y,player.x-e.x);for(let i=-3;i<=3;i++)spawnEnemyProjectile(e.x,e.y,aim+i*.10,225,d*.48,'#ffd26f',5.2,5.5,'forge');}else constellationNodeVolley(e,d*.82,arena,phase);}
  if(f==='chronophage'){
    if(e.skillCd<=0){e.skillCd=phase>=3?2.0:2.65;const h=e.apexPlayerHistory||[],past=h[Math.max(0,h.length-(5+phase))]||{x:player.x,y:player.y};addCircle(player.x,player.y,44+phase*4,d*.92,'#d9fff8',.68);addCircle(past.x,past.y,50+phase*4,d*.62,'#79ffe1',.94);}
    if(e.burstCd<=0){e.burstCd=phase>=3?4.65:5.8;chronophageSignature(e,d*.88,arena,phase);}
    if(e.pulseCd<=0){e.pulseCd=phase>=3?6.4:7.9;const h=e.apexPlayerHistory||[],marks=[{x:player.x,y:player.y},h[Math.max(0,h.length-4)],h[Math.max(0,h.length-8)]].filter(Boolean);marks.forEach((p,i)=>addCircle(p.x,p.y,38+phase*4+i*8,d*(.84-i*.12),'#bffdf3',.62+i*.17));}
  }else if(f==='starforge'){
    if(e.skillCd<=0){e.skillCd=phase>=3?2.05:2.75;starforgeSignature(e,d*.86,arena,phase);}
    if(e.burstCd<=0){e.burstCd=phase>=3?4.35:5.55;const p=predictedPlayer(38+phase*12),horizontal=(e.forgePressAxis=(e.forgePressAxis||0)+1)%2===0,spacing=Math.max(68,98-phase*6);for(let i=-2;i<=2;i++){const x=p.x+(horizontal?i*spacing:0),y=p.y+(horizontal?0:i*spacing),center=i===0;addCircle(x,y,46+phase*4,d*(center?1.04:.60),center?'#ff7135':'#ffd26f',.72+Math.abs(i)*.075);}}
    if(e.pulseCd<=0){e.pulseCd=phase>=3?6.1:7.6;const aim=Math.atan2(player.y-e.y,player.x-e.x),count=9+phase*2;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.082;spawnEnemyProjectile(e.x,e.y,aim+off,185+phase*15,d*.60,i%2?'#fff1b0':'#ff9d42',5.5,6,'forge');}addCircle(player.x,player.y,54+phase*4,d*.78,'#ff8a42',.84);}
  }else{
    if(e.skillCd<=0){e.skillCd=phase>=3?1.9:2.55;constellationNodeVolley(e,d,arena,phase);}
    if(e.burstCd<=0){e.burstCd=phase>=3?4.4:5.75;constellationCage(e,d,arena,phase,.94);teleportConstellation(e,1,.52);}
    if(e.pulseCd<=0){e.pulseCd=phase>=3?5.9:7.5;constellationSignature(e,d*.86,arena,phase);}
  }
}'''
patterns = replace_function(patterns, 'apexBossSkill', apex_skill)
patterns_path.write_text(patterns, encoding='utf-8')

# ---------------------------------------------------------------------------
# Boss set pieces, phase transitions, fixed Omega movement and defeat identity.
# ---------------------------------------------------------------------------
bosses_path = Path('src/bosses.js')
bosses = bosses_path.read_text(encoding='utf-8')

phase_transition = r'''function apexPhaseTransition(e,phase){
  const form=e.apexForm||e.eliteForm,arena=state.apexArena||{x:player.x,y:player.y,r:460},d=Math.max(9,e.damage*(.27+phase*.025)),color=form==='chronophage'?'#79ffe1':form==='starforge'?'#ffb04e':'#b7c9ff';
  e.attackLockUntil=Math.max(e.attackLockUntil||0,(state.time||0)+.38);e.contactSafeUntil=Math.max(e.contactSafeUntil||0,(state.time||0)+.48);state.camera.shake=Math.max(state.camera.shake,7+phase*2);state.flash=Math.max(state.flash,.08+phase*.025);shockwave(e.x,e.y,color,115+phase*42,.44+phase*.05,3+phase);showBossNotice(bossName(form)+' · PHASE '+phase,'APEX THREAT');
  if(form==='chronophage'){chronophageSignature(e,d,arena,phase);if(phase>=2&&!e.chronoPursuit)startChronoPursuit(e,phase,d*.86);}
  else if(form==='starforge'){starforgeSignature(e,d,arena,phase);if(phase>=2&&!e.forgeTidalCore)startForgeTidalCore(e,phase,d*.82);if(phase===4){bossLater(e,420,()=>{if(e.dead)return;for(let i=-2;i<=2;i++)addCircle(player.x+i*82,player.y,48,d*(i===0?.92:.54),i%2?'#fff1b0':'#ff9d42',.68+Math.abs(i)*.06);});}}
  else{constellationSignature(e,d,arena,phase);if(phase>=2)summonConstellationHeralds(e,phase);}
}'''
bosses = replace_function(bosses, 'apexPhaseTransition', phase_transition)

variant_attack = r'''function apexVariantAttack(e,phase){
  const form=e.apexForm||e.eliteForm,arena=state.apexArena||{x:player.x,y:player.y,r:460},d=Math.max(8,e.damage*(.25+phase*.022));
  if(form==='chronophage')chronophageSignature(e,d*.92,arena,phase);
  else if(form==='starforge'){const p=predictedPlayer(36+phase*12),horizontal=(e.forgePressAxis=(e.forgePressAxis||0)+1)%2===0,spacing=Math.max(68,96-phase*5);for(let i=-2;i<=2;i++)addCircle(p.x+(horizontal?i*spacing:0),p.y+(horizontal?0:i*spacing),44+phase*4,d*(i===0?.98:.56),i%2?'#ffd26f':'#ff7135',.70+Math.abs(i)*.07);}
  else{constellationCage(e,d,arena,phase,.90);bossLater(e,360,()=>{if(!e.dead)constellationNodeVolley(e,d*.74,arena,phase);});if(phase>=2)teleportConstellation(e,phase,.50);}
}'''
bosses = replace_function(bosses, 'apexVariantAttack', variant_attack)

start_chrono = r'''function startChronoPursuit(e,phase,d){e.chronoPursuit={life:3.2+phase*.46,warmup:.52,scarCd:.10,damage:d*(.62+phase*.06),phase,sequence:0};shockwave(e.x,e.y,'#79ffe1',92+phase*12,.34,2.6);}'''
update_chrono = r'''function updateChronoPursuit(e,dt){const chase=e.chronoPursuit;if(!chase)return;if(chase.life<=0){e.chronoPursuit=null;return;}chase.life-=dt;chase.warmup-=dt;chase.scarCd-=dt;if(chase.warmup>0){if(Math.random()<dt*5)spawnParticle(player.x+rand(-26,26),player.y+rand(-26,26),'#79ffe1',1,24,2);return;}if(chase.scarCd>0)return;chase.scarCd=Math.max(.24,.42-chase.phase*.035);chase.sequence++;const x=player.x,y=player.y,r=34+chase.phase*4;addCircle(x,y,r,chase.damage,'#d9fff8',.54+chase.phase*.025);if(chase.phase>=3&&chase.sequence%3===0)addCircle(x,y,r+34,chase.damage*.58,'#79ffe1',.78);if(chase.phase===4&&chase.sequence%4===0){const a=(chase.sequence%2?1:-1)*Math.PI*.25,ox=Math.cos(a)*72,oy=Math.sin(a)*72;addCircle(x+ox,y+oy,38,chase.damage*.48,'#bffdf3',.68);addCircle(x-ox,y-oy,38,chase.damage*.48,'#bffdf3',.68);}}'''
bosses = replace_function(bosses, 'startChronoPursuit', start_chrono)
bosses = replace_function(bosses, 'updateChronoPursuit', update_chrono)

start_forge = r'''function startForgeTidalCore(e,phase,d){e.forgeTidalCore={x:e.x,y:e.y,life:4.2+phase*.48,max:4.2+phase*.48,pulse:.45,meteor:.62,damage:d,phase};shockwave(e.x,e.y,'#ffb04e',138+phase*18,.52,4);}'''
update_forge = r'''function updateForgeTidalCore(e,dt){const core=e.forgeTidalCore;if(!core)return;if(core.life<=0){areaDamage(core.x,core.y,165+core.phase*18,core.damage*1.18,'#fff0a8','apex-forge-core');shockwave(core.x,core.y,'#fff0a8',245+core.phase*22,.58,5);e.forgeTidalCore=null;return;}core.x=e.x;core.y=e.y;core.life-=dt;const dx=core.x-player.x,dy=core.y-player.y,d=Math.hypot(dx,dy)||1,pull=(24+core.phase*7)*(1-clamp(d/480,0,1));player.x+=dx/d*pull*dt;player.y+=dy/d*pull*dt;core.pulse-=dt;core.meteor-=dt;if(core.pulse<=0){core.pulse=.44;shockwave(core.x,core.y,'#ff9d42',86+core.phase*13,.25,1.9);const synthetic={x:core.x,y:core.y,eliteForm:'starforge'};fireRing(synthetic,10+core.phase*2,110+core.phase*10,core.damage*.34,'#ffd26f',e.phase*.08,4.6);if(d<82+core.phase*8&&player.invuln<=0)hurtPlayer(core.damage*.78,e);}if(core.meteor<=0){core.meteor=Math.max(.50,.92-core.phase*.075);addCircle(player.x,player.y,42+core.phase*4,core.damage*.70,'#ff7135',.66);if(core.phase>=3){const side=(core.meteorSerial=(core.meteorSerial||0)+1)%2?1:-1;addCircle(player.x+side*82,player.y,36+core.phase*3,core.damage*.48,'#ffd26f',.78);}}if(Math.random()<dt*8)spawnParticle(core.x+rand(-34,34),core.y+rand(-28,28),'#fff0a8',1,46,3.6);}'''
bosses = replace_function(bosses, 'startForgeTidalCore', start_forge)
bosses = replace_function(bosses, 'updateForgeTidalCore', update_forge)

start_constellation = r'''function startConstellationSweep(e,phase,d){e.constellationSweep={life:3.0+phase*.32,warmup:.54,cageCd:.08,damage:d*(.66+phase*.055),phase,cycle:0};shockwave(e.x,e.y,'#dce6ff',100+phase*12,.36,3);}'''
update_constellation = r'''function updateConstellationSweep(e,dt){const sweep=e.constellationSweep;if(!sweep)return;if(sweep.life<=0){e.constellationSweep=null;return;}sweep.life-=dt;sweep.warmup-=dt;sweep.cageCd-=dt;if(sweep.warmup>0)return;if(sweep.cageCd>0)return;sweep.cageCd=Math.max(.62,.92-sweep.phase*.055);sweep.cycle++;const arena=state.apexArena||{x:player.x,y:player.y,r:480};constellationCage(e,sweep.damage,arena,sweep.phase,.72);if(sweep.cycle%2===0)bossLater(e,260,()=>{if(!e.dead)constellationNodeVolley(e,sweep.damage*.62,arena,sweep.phase);});}'''
bosses = replace_function(bosses, 'startConstellationSweep', start_constellation)
bosses = replace_function(bosses, 'updateConstellationSweep', update_constellation)

motion = r'''function apexMotionVelocity(e){
  const out=APEX_MOTION_BUFFER,arena=state.apexArena;if(!arena){out.x=0;out.y=0;return out;}const form=e.apexForm||e.eliteForm,dx=arena.x-e.x,dy=arena.y-e.y,centerD=Math.hypot(dx,dy)||1;
  if(form==='starforge'){out.x=0;out.y=0;return out;}
  if(form==='chronophage'){const a=e.phase*.065+(e.id%7)*.31,rr=arena.r*.28,targetX=arena.x+Math.cos(a)*rr,targetY=arena.y+Math.sin(a)*rr*.58,tx=targetX-e.x,ty=targetY-e.y,d=Math.hypot(tx,ty)||1;out.x=tx/d*e.speed*.94;out.y=ty/d*e.speed*.94;return out;}
  const desired=arena.r*.46,radial=(centerD-desired)*1.8,tangent=e.speed*(e.apexPhase>=3?1.48:e.apexPhase===2?1.35:1.08);out.x=dx/centerD*radial+(-dy/centerD)*tangent;out.y=dy/centerD*radial+(dx/centerD)*tangent;return out;
}'''
bosses = replace_function(bosses, 'apexMotionVelocity', motion)

finish = r'''function finishApexEncounter(enemy){if(!enemy||state.apexExitPending)return;state.apexExitPending=true;const form=enemy.apexForm||enemy.eliteForm||'chronophage';state.apexActiveId=null;state.pendingApexForm=null;clearEnemyProjectiles();state.entities.telegraphs.length=0;clearBeamEffects();state.apexArena=null;const subtitle=form==='chronophage'?'TEMPORAL COHERENCE LOST':form==='starforge'?'FURNACE MASS COLLAPSED':'CONSTELLATION LINKS SEVERED';startRealmTransition('space',{duration:2.65,owner:'apex-exit',title:GAME_SETTINGS.language==='ko'?'초월체 격파':'APEX VANQUISHED',subtitle,apex:true,form,onComplete:()=>{stabilizeRealmTheme('space');state.apexExitPending=false;if(typeof openApexRewardSelection==='function')openApexRewardSelection(form);else applyApexReward(form);}});}'''
bosses = replace_function(bosses, 'finishApexEncounter', finish)
bosses_path.write_text(bosses, encoding='utf-8')

# ---------------------------------------------------------------------------
# Apex silhouettes: remove clock face / rectangular furnace / black eye.
# ---------------------------------------------------------------------------
elite_path = Path('src/elite-renderers.js')
elite = elite_path.read_text(encoding='utf-8')

chrono_draw = r'''function drawChronophageApex(e,t,enraged){
  // Apex rework: temporal fracture anatomy — deliberately no clock face, hands or gear motif.
  const r=e.r,phase=e.apexPhase||1,pulse=.92+.08*Math.sin(t*.41);ctx.save();ctx.rotate(-.10+Math.sin(t*.13)*.045);ctx.lineJoin='round';
  for(let ghost=2;ghost>=1;ghost--){ctx.save();ctx.globalAlpha=.10+(2-ghost)*.07;ctx.translate(-ghost*r*.12+Math.sin(t*.9+ghost)*r*.04,ghost*r*.05);ctx.strokeStyle=ghost===1?'#79ffe1':'#9fb2ff';ctx.lineWidth=2;for(let i=0;i<5;i++){const a=-1.9+i*.86+(i%2?.16:-.09),rr=r*(.58+i*.10);ctx.save();ctx.rotate(a);ctx.translate(rr,0);ctx.rotate((i%2?1:-1)*.38);ctx.beginPath();ctx.moveTo(-r*.30,-r*.17);ctx.lineTo(r*.24,-r*.28);ctx.lineTo(r*.42,r*.03);ctx.lineTo(-r*.12,r*.24);ctx.closePath();ctx.stroke();ctx.restore();}ctx.restore();}
  const shell=ctx.createLinearGradient(-r,-r,r,r);shell.addColorStop(0,'#07171a');shell.addColorStop(.48,'#12363b');shell.addColorStop(1,'#04090d');ctx.fillStyle=shell;ctx.strokeStyle=e.hit?'#fff':'#79ffe1';ctx.lineWidth=3.2+phase*.35;
  const plates=[[-.82,-.42,-.16,-.78,.08,-.25,-.34,.02],[-.28,-.78,.42,-.60,.30,-.08,-.06,-.22],[.18,-.20,.76,-.46,.88,.06,.22,.22],[.06,.26,.68,.20,.44,.76,-.14,.62],[-.68,.06,-.14,.18,-.24,.76,-.82,.52],[-.92,-.20,-.46,-.40,-.26,.02,-.76,.18]];
  for(let i=0;i<plates.length;i++){const p=plates[i],lag=Math.sin(t*(.42+i*.06)+i*1.7)*r*(.018+phase*.004);ctx.save();ctx.translate((i%2?lag:-lag),i%3===0?-lag*.5:lag*.35);ctx.beginPath();ctx.moveTo(p[0]*r,p[1]*r);ctx.lineTo(p[2]*r,p[3]*r);ctx.lineTo(p[4]*r,p[5]*r);ctx.lineTo(p[6]*r,p[7]*r);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  ctx.shadowBlur=22;ctx.shadowColor='#bffdf3';ctx.fillStyle='#02080a';ctx.strokeStyle='#dffff9';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(-r*.16,-r*.52);ctx.lineTo(r*.06,-r*.22);ctx.lineTo(-r*.03,-r*.06);ctx.lineTo(r*.13,r*.14);ctx.lineTo(-r*.10,r*.54);ctx.lineTo(-r*.30,r*.18);ctx.lineTo(-r*.19,-r*.08);ctx.lineTo(-r*.34,-r*.28);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(223,255,249,.72)';ctx.lineWidth=1.5;for(let i=0;i<3+phase;i++){const y=(-.34+i*(.68/Math.max(1,2+phase)))*r,shift=Math.sin(t*.7+i)*r*.08;ctx.beginPath();ctx.moveTo(-r*.66+shift,y);ctx.lineTo(-r*.22+shift*.3,y+r*.05);ctx.moveTo(r*.20-shift*.2,y-r*.03);ctx.lineTo(r*.70-shift,y+r*.04);ctx.stroke();}
  ctx.globalAlpha=.55+.25*pulse;ctx.fillStyle='#ecfffb';ctx.beginPath();ctx.moveTo(-r*.09,-r*.18);ctx.lineTo(r*.13,-r*.03);ctx.lineTo(-r*.02,r*.22);ctx.lineTo(-r*.20,r*.02);ctx.closePath();ctx.fill();ctx.restore();
}'''
elite = replace_function(elite, 'drawChronophageApex', chrono_draw)

forge_draw = r'''function drawStarforgeApex(e,t,enraged){
  // Apex rework: Omega is a huge anchored ruptured stellar mass, not a rectangular machine.
  const r=e.r,phase=e.apexPhase||1,pulse=.90+.10*Math.sin(t*.36);ctx.save();ctx.rotate(Math.sin(t*.055)*.018);ctx.lineJoin='round';
  const aura=ctx.createRadialGradient(0,0,r*.12,0,0,r*1.28);aura.addColorStop(0,'rgba(255,247,197,.36)');aura.addColorStop(.38,'rgba(255,118,45,.18)');aura.addColorStop(1,'rgba(82,10,0,0)');ctx.fillStyle=aura;ctx.fillRect(-r*1.35,-r*1.35,r*2.7,r*2.7);
  const core=ctx.createRadialGradient(-r*.05,-r*.06,2,0,0,r*.53);core.addColorStop(0,'#ffffff');core.addColorStop(.20,'#fff2a6');core.addColorStop(.56,'#ff9d36');core.addColorStop(1,'#6b1005');ctx.fillStyle=core;ctx.shadowBlur=30;ctx.shadowColor='#ff8a2f';ctx.beginPath();ctx.ellipse(0,0,r*.48*pulse,r*.58*pulse,-.08,0,TAU);ctx.fill();ctx.shadowBlur=0;
  const plates=[[-1.12,-.66,-.38,-.88,-.12,-.48,-.52,-.12],[-.22,-.98,.58,-.78,.72,-.30,.16,-.36],[.48,-.50,1.20,-.58,1.34,.02,.62,.16],[.56,.18,1.18,.34,.88,.86,.18,.68],[-.08,.48,.44,.78,-.20,1.02,-.58,.62],[-.66,.18,-.20,.56,-.74,.92,-1.20,.42],[-1.30,-.22,-.66,-.46,-.52,.02,-1.14,.22]];
  for(let i=0;i<plates.length;i++){const p=plates[i],hot=(i+phase)%3===0,shift=(phase-1)*r*.018*(i%2?1:-1);ctx.save();ctx.translate(shift,shift*.35);ctx.fillStyle=hot?'#521207':'#1b0906';ctx.strokeStyle=e.hit?'#fff':hot?'#ffd77e':'#ff7b35';ctx.lineWidth=hot?4.2:3.2;ctx.beginPath();ctx.moveTo(p[0]*r,p[1]*r);ctx.lineTo(p[2]*r,p[3]*r);ctx.lineTo(p[4]*r,p[5]*r);ctx.lineTo(p[6]*r,p[7]*r);ctx.closePath();ctx.fill();ctx.stroke();if(hot){ctx.globalAlpha=.55;ctx.strokeStyle='#fff1b0';ctx.beginPath();ctx.moveTo((p[0]+p[2])*.5*r,(p[1]+p[3])*.5*r);ctx.lineTo((p[4]+p[6])*.5*r,(p[5]+p[7])*.5*r);ctx.stroke();}ctx.restore();}
  ctx.fillStyle='#fff7cf';ctx.globalAlpha=.82;for(let i=0;i<4+phase;i++){const a=-1.3+i*(2.6/(3+phase)),len=r*(.70+(i%2)*.22);ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(r*.35,-r*.035);ctx.lineTo(len,0);ctx.lineTo(r*.35,r*.035);ctx.closePath();ctx.fill();ctx.restore();}ctx.globalAlpha=1;ctx.restore();
}'''
elite = replace_function(elite, 'drawStarforgeApex', forge_draw)

const_draw = r'''function drawLastConstellationApex(e,t,enraged){
  // Apex rework: nameless shard anatomy — no central eye/oval body.
  const r=e.r,phase=e.apexPhase||1,count=enraged?10:8,pts=[];ctx.save();ctx.rotate(Math.sin(t*.08)*.035);
  const coreGrad=ctx.createLinearGradient(0,-r*.95,0,r*.95);coreGrad.addColorStop(0,'#eaf0ff');coreGrad.addColorStop(.28,'#8fa6e8');coreGrad.addColorStop(.62,'#1b2346');coreGrad.addColorStop(1,'#050714');ctx.fillStyle=coreGrad;ctx.strokeStyle=e.hit?'#fff':'#b7c9ff';ctx.lineWidth=2.8;ctx.beginPath();ctx.moveTo(-r*.12,-r*.96);ctx.lineTo(r*.30,-r*.52);ctx.lineTo(r*.12,-r*.12);ctx.lineTo(r*.40,r*.42);ctx.lineTo(-r*.02,r*.96);ctx.lineTo(-r*.34,r*.40);ctx.lineTo(-r*.18,.02);ctx.lineTo(-r*.42,-r*.44);ctx.closePath();ctx.fill();ctx.stroke();
  const layout=[[-1.18,-.62,.34],[-.72,-1.18,.27],[.12,-1.38,.31],[.92,-.98,.26],[1.32,-.18,.35],[1.02,.78,.25],[.28,1.28,.32],[-.58,1.16,.26],[-1.24,.56,.34],[-1.46,-.06,.23]];
  for(let i=0;i<count;i++){const [ax,ay,s]=layout[i],drift=Math.sin(t*(.22+i*.014)+i*1.7)*r*.055,x=ax*r+drift,y=ay*r-drift*.36;pts.push({x,y});ctx.save();ctx.translate(x,y);ctx.rotate((i%2?1:-1)*t*.045+i*.62);ctx.fillStyle=i%3===0?'#eef3ff':'#6276bc';ctx.strokeStyle='#cbd6ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-r*s);ctx.lineTo(r*s*.42,-r*s*.12);ctx.lineTo(r*s*.18,r*s);ctx.lineTo(-r*s*.36,r*s*.26);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  const linkAlpha=.045+phase*.018+(enraged?.08:0);ctx.globalAlpha=linkAlpha;ctx.strokeStyle='#dce6ff';ctx.lineWidth=1.3;for(let i=0;i<pts.length;i++){if(i%3===2)continue;const a=pts[i],b=pts[(i+3)%pts.length];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle='#ffffff';ctx.shadowBlur=20;ctx.shadowColor='#b7c9ff';ctx.beginPath();ctx.moveTo(-r*.08,-r*.20);ctx.lineTo(r*.18,-r*.05);ctx.lineTo(r*.04,r*.22);ctx.lineTo(-r*.18,r*.04);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.restore();
}'''
elite = replace_function(elite, 'drawLastConstellationApex', const_draw)
elite_path.write_text(elite, encoding='utf-8')

# ---------------------------------------------------------------------------
# Apex entrance/exit sigils.
# ---------------------------------------------------------------------------
dark_path = Path('src/dark-cosmic-polish.js')
dark = dark_path.read_text(encoding='utf-8')
apex_sigil = r'''function drawApexSigil(form,x,y,t,p,color){
    ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.shadowBlur=30;ctx.shadowColor=color;
    if(form==='chronophage'){
      for(let i=0;i<7;i++){const a=-2.25+i*.72,rr=52+(i%3)*28,lag=Math.sin(t*(.7+i*.08)+i)*16;ctx.save();ctx.rotate(a);ctx.translate(rr+lag,0);ctx.rotate((i%2?1:-1)*(.34+t*.05));ctx.globalAlpha=.45+(i%3)*.16;ctx.lineWidth=i%3===0?4:2;ctx.beginPath();ctx.moveTo(-32,-12);ctx.lineTo(18,-24);ctx.lineTo(38,3);ctx.lineTo(-8,25);ctx.closePath();ctx.stroke();ctx.restore();}
      ctx.globalAlpha=.9;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,-72);ctx.lineTo(10,-28);ctx.lineTo(-6,-8);ctx.lineTo(18,18);ctx.lineTo(-12,72);ctx.stroke();
    }else if(form==='starforge'){
      const g=ctx.createRadialGradient(0,0,5,0,0,96);g.addColorStop(0,'#fff');g.addColorStop(.22,'#fff0a6');g.addColorStop(.58,'#ff7933');g.addColorStop(1,'rgba(255,54,15,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,92,108,0,0,TAU);ctx.fill();for(let i=0;i<6;i++){ctx.save();ctx.rotate(i/6*TAU+(i%2?.12:-.08));ctx.translate(68+(i%2)*12,0);ctx.fillStyle='#240b06';ctx.strokeStyle=i%2?'#ff8a3c':'#ffd77e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-26,-34);ctx.lineTo(58,-22);ctx.lineTo(76,4);ctx.lineTo(44,32);ctx.lineTo(-30,20);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}
    else{
      ctx.lineWidth=2.2;const pts=[];for(let i=0;i<9;i++){const a=i/9*TAU-t*.035,rr=i%2?92:122,pt={x:Math.cos(a)*rr,y:Math.sin(a)*rr};pts.push(pt);ctx.save();ctx.translate(pt.x,pt.y);ctx.rotate(a+t*.08);ctx.fillRect(-4,-13,8,26);ctx.restore();}ctx.globalAlpha=.34;for(let i=0;i<pts.length;i++){if(i%3===2)continue;const a=pts[i],b=pts[(i+3)%pts.length];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(-10,-78);ctx.lineTo(24,-38);ctx.lineTo(8,-4);ctx.lineTo(30,42);ctx.lineTo(-6,82);ctx.lineTo(-28,30);ctx.lineTo(-14,-12);ctx.lineTo(-34,-46);ctx.closePath();ctx.stroke();}
    ctx.restore();
  }'''
dark = replace_function(dark, 'drawApexSigil', apex_sigil)
# Exit transition should use the defeated form color and collapse label.
dark = dark.replace("const p=clamp(tr.elapsed/tr.duration,0,1),fade=Math.sin(Math.PI*p),reveal=clamp((p-.22)/.45,0,1),color=transitionColor(tr.to),x=vw/2,y=vh*.42,t=tr.elapsed;", "const p=clamp(tr.elapsed/tr.duration,0,1),fade=Math.sin(Math.PI*p),exit=tr.owner==='apex-exit',reveal=exit?1-clamp((p-.12)/.72,0,1):clamp((p-.22)/.45,0,1),color=tr.form==='chronophage'?'#79ffe1':tr.form==='starforge'?'#ffb04e':tr.form==='lastconstellation'?'#b7c9ff':transitionColor(tr.to),x=vw/2,y=vh*.42,t=tr.elapsed;")
dark = dark.replace("ctx.fillText('— APEX ENTITY DESCENT —',vw/2,vh*.65+30);", "ctx.fillText(exit?'— APEX ENTITY COLLAPSE —':'— APEX ENTITY DESCENT —',vw/2,vh*.65+30);")
dark_path.write_text(dark, encoding='utf-8')

# ---------------------------------------------------------------------------
# Arena presentation.
# ---------------------------------------------------------------------------
space_path = Path('src/render-space.js')
space = space_path.read_text(encoding='utf-8')
arena_draw = r'''function drawApexArena(){const arena=state.apexArena;if(!arena||(!state.apexActiveId&&!state.pendingApexForm&&!String(state.realmTransition?.to||'').startsWith('apex-')))return;const p=worldToScreen(arena.x,arena.y),r=arena.r,t=performance.now()/1000,form=arena.form,color=form==='chronophage'?'#79ffe1':form==='starforge'?'#ff9a42':'#b7c9ff';ctx.save();ctx.fillStyle='rgba(0,0,5,.48)';ctx.beginPath();ctx.rect(-40,-40,vw+80,vh+80);ctx.arc(p.x,p.y,r,0,TAU,true);ctx.fill('evenodd');ctx.translate(p.x,p.y);ctx.shadowBlur=18;ctx.shadowColor=color;ctx.strokeStyle=color;
  if(form==='chronophage'){const pts=[];for(let i=0;i<15;i++){const a=i/15*TAU+t*(i%2?.004:-.003),rr=r+(i%3-1)*13;pts.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr});}ctx.globalAlpha=.58;ctx.lineWidth=2.2;for(let i=0;i<pts.length-1;i++){if(i%4===2)continue;ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[i+1].x,pts[i+1].y);ctx.stroke();}ctx.globalAlpha=.22;for(let i=0;i<5;i++){const a=i/5*TAU+t*.012;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r-42),Math.sin(a)*(r-42));ctx.lineTo(Math.cos(a+.18)*(r+18),Math.sin(a+.18)*(r+18));ctx.stroke();}}
  else if(form==='starforge'){ctx.globalAlpha=.66;ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<10;i++){const a=i/10*TAU-Math.PI/2,rr=i%2?r-12:r+7,x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();for(let i=0;i<6;i++){const a=i/6*TAU+.18,inner=r-34,outer=r+22;ctx.globalAlpha=.28+(i%2)*.16;ctx.lineWidth=i%2?6:3;ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a+.055)*outer,Math.sin(a+.055)*outer);ctx.stroke();}}
  else{const pts=[];for(let i=0;i<11;i++){const a=i/11*TAU+t*(i%2?.006:-.004),rr=r+(i%3-1)*11;pts.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr});}ctx.globalAlpha=.42;ctx.lineWidth=1.5;for(let i=0;i<pts.length;i++){if(i%3===1)continue;const a=pts[i],b=pts[(i+3)%pts.length];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}for(const pt of pts){ctx.fillStyle='#eef3ff';ctx.beginPath();ctx.arc(pt.x,pt.y,3,0,TAU);ctx.fill();}}
  ctx.setLineDash([]);ctx.restore();}'''
space = replace_function(space, 'drawApexArena', arena_draw)
space_path.write_text(space, encoding='utf-8')

# ---------------------------------------------------------------------------
# Canonical stats: Omega explicitly fixed and much larger; Nameless body readable.
# ---------------------------------------------------------------------------
catalog_path = Path('src/boss-catalog.js')
catalog = catalog_path.read_text(encoding='utf-8')
old_stats = "chronophage:{color:'#79ffe1',hp:2.22,speed:.92,damage:1.34,r:1.58,theme:'apex-chrono'},starforge:{color:'#ffb04e',hp:2.48,speed:.80,damage:1.46,r:1.96,theme:'apex-forge'},lastconstellation:{color:'#b7c9ff',hp:2.34,speed:.86,damage:1.40,r:.84,theme:'apex-constellation'}"
new_stats = "chronophage:{color:'#79ffe1',hp:2.22,speed:.92,damage:1.34,r:1.62,theme:'apex-chrono'},starforge:{color:'#ffb04e',hp:2.48,speed:0,damage:1.46,r:2.28,theme:'apex-forge'},lastconstellation:{color:'#b7c9ff',hp:2.34,speed:.86,damage:1.40,r:1.08,theme:'apex-constellation'}"
if old_stats not in catalog: raise SystemExit('apex stat block not found')
catalog = catalog.replace(old_stats,new_stats,1)
catalog_path.write_text(catalog, encoding='utf-8')

# ---------------------------------------------------------------------------
# Player wiki: remove obsolete tracking-laser description.
# ---------------------------------------------------------------------------
wiki_path=Path('docs/WIKI.md')
wiki=wiki_path.read_text(encoding='utf-8')
old="시간포식자의 추적광은 플레이어 위치에 즉시 꽂히는 레이저가 아니다. 플레이어 방향에서 옆으로 비껴난 곳에서 시작해 0.9초 동안 준비한 뒤 제한된 회전 속도로 전장을 쓸며 따라온다. 광선보다 빠르게 반대 방향으로 움직이면 추적을 따돌릴 수 있다."
new="시간포식자는 시계나 추적 레이저 대신 플레이어의 현재·최근 위치에 **시간 흉터**를 남긴다. 흉터는 잠시 뒤 파열하므로 같은 자리에 머무르면 연속으로 맞고, 계속 이동하면서 겹치는 흉터 경로를 피해야 한다. 이동했던 경로는 이후 짧은 시간 절단선으로 되살아날 수 있다."
if old in wiki: wiki=wiki.replace(old,new,1)
wiki_path.write_text(wiki, encoding='utf-8')

# ---------------------------------------------------------------------------
# Contracts: assert the new identity instead of preserving rejected beam grammar.
# ---------------------------------------------------------------------------
apex_contract_path=Path('scripts/apex-encounter-contract.mjs')
apex_contract=apex_contract_path.read_text(encoding='utf-8')
apex_contract=apex_contract.replace(" ['tracking beam begins away from player',bosses.includes('aim+side*(.92+phase*.07)')&&bosses.includes('warmup:.90')],\n ['tracking beam visibly follows instead of snapping',bosses.includes(\"turnRate=beam.warmup>0?.48:.72\")&&bosses.includes('angleToward(beam.angle,target,turnRate*dt)')],\n ['tracking beam render is throttled',bosses.includes('beam.visual-=dt')&&bosses.includes('beam.visual=stressed?.070:.040')],", " ['chronophage scar chase forces present-position movement',bosses.includes('scarCd')&&bosses.includes('addCircle(x,y,r,chase.damage')&&patterns.includes('addCircle(now.x,now.y')],\n ['omega is fixed and oversized',catalog.includes(\"starforge:{color:'#ffb04e',hp:2.48,speed:0\")&&catalog.includes('r:2.28')&&bosses.includes(\"if(form==='starforge'){out.x=0;out.y=0;return out;}\")],\n ['apex silhouettes reject clock eye and rectangular-machine shortcuts',eliteRenderers.includes('temporal fracture anatomy')&&eliteRenderers.includes('huge anchored ruptured stellar mass')&&eliteRenderers.includes('no central eye/oval body')],")
apex_contract=apex_contract.replace(" ['live rotating sweep set piece',bosses.includes('function startConstellationSweep')&&bosses.includes('function updateConstellationSweep')&&bosses.includes('sweep.angle+=dt')],\n ['sweep and constellation network render are throttled',bosses.includes('sweep.visual=stressed?.075:.045')&&bosses.includes('network.visual=stressed?.085:.050')],", " ['local constellation cage set piece replaces rotating sweep',bosses.includes('function startConstellationSweep')&&bosses.includes('function updateConstellationSweep')&&bosses.includes('constellationCage(e,sweep.damage')&&!bosses.includes('sweep.angle+=dt')],\n ['constellation legacy network render remains throttled',bosses.includes('network.visual=stressed?.085:.050')],")
apex_contract_path.write_text(apex_contract, encoding='utf-8')

community_path=Path('scripts/community-feedback-contract.mjs')
community=community_path.read_text(encoding='utf-8')
community=community.replace("expect('apex tracking beam sweeps instead of snapping',bosses.includes('aim+side*(.92+phase*.07)')&&bosses.includes('angleToward(beam.angle,target,turnRate*dt)')&&wiki.includes('즉시 꽂히는 레이저가 아니다'));", "expect('apex chronophage uses delayed time scars instead of a shared tracking beam',bosses.includes('scarCd')&&bosses.includes('addCircle(x,y,r,chase.damage')&&wiki.includes('시간 흉터'));" )
community=community.replace("expect('continuous beam object churn is bounded',bosses.includes('beam.visual=stressed?.070:.040')&&bosses.includes('sweep.visual=stressed?.075:.045')&&bosses.includes('network.visual=stressed?.085:.050'));", "expect('apex set pieces avoid continuous generic beam churn',!bosses.includes('beam.visual=stressed?.070:.040')&&!bosses.includes('sweep.visual=stressed?.075:.045')&&bosses.includes('network.visual=stressed?.085:.050'));" )
community_path.write_text(community, encoding='utf-8')

print('apex rework patch applied')
