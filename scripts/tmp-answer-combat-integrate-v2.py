from pathlib import Path


def read(p): return Path(p).read_text(encoding='utf-8')
def write(p,s): Path(p).write_text(s,encoding='utf-8')
def once(s,old,new,label):
    count=s.count(old)
    if count!=1: raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    return s.replace(old,new,1)

# Combat source
p='src/void-apex-answer-combat-v1.js'; s=read(p)
s=once(s,"const APEX_HP_MULT=.85*7.60;      // 6.46: global Apex HP nerf, mirrored here for the prototype boss.\n  const APEX_DAMAGE_MULT=.85*2.15;  // 1.8275: global Apex damage nerf.","const APEX_HP_MULT=6.46;      // Ordinary Apex common HP multiplier after the approved ~15% nerf.\n  const APEX_DAMAGE_MULT=1.83; // Ordinary Apex common damage multiplier after the approved ~15% nerf.",'combat multipliers')
s=once(s,"else if(family==='drone'){if(c.age>=c.warn&&c.age<c.warn+c.active){c.shot-=dt;if(c.shot<=0){c.shot=.48;const a=Math.atan2(player.y-c.y,player.x-c.x),p={key:'drone-shot',family:'bolt',age:0,hit:false,x:c.x,y:c.y,vx:Math.cos(a)*340,vy:Math.sin(a)*340,r:5,life:2.6};runtime.clones.push(p);}}return c.age<c.warn+c.active+c.fade;}","else if(family==='drone'){if(c.age>=c.warn&&c.age<c.warn+c.active){c.shot-=dt;if(c.shot<=0){c.shot=.48;const a=Math.atan2(player.y-c.y,player.x-c.x),p=spawnEnemyProjectile(c.x,c.y,a,340,bossDamage()*DAMAGE.drone,'#050507',5,2.6,'needle');p.answerClone=true;}}return c.age<c.warn+c.active+c.fade;}",'drone hostile projectile')
write(p,s)

# Visual shell V17, 3 phases, static body, integration APIs and DEV pattern controls
p='src/void-apex-answer-v1.js'; s=read(p)
s=once(s,"window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v16';","window.STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v17';",'revision')
s=once(s,"const phaseRatio=phase=>phase===1?1:phase===2?.76:phase===3?.51:.26;","const phaseRatio=phase=>phase===1?1:phase===2?.74:.29;",'phase ratios')
s=once(s,"""  function setPhase(phase){
    if(!preview.active)return false;
    preview.phase=Math.max(1,Math.min(4,Math.floor(Number(phase)||1)));
    preview.hpRatio=phaseRatio(preview.phase);preview.defeating=false;preview.defeatAge=0;syncBossHud();
    state.camera.shake=Math.max(Number(state.camera.shake)||0,1.2+preview.phase*.55);
    return true;
  }
""","""  function setPhase(phase,preserveHp=false){
    if(!preview.active)return false;
    preview.phase=Math.max(1,Math.min(3,Math.floor(Number(phase)||1)));
    if(!preserveHp)preview.hpRatio=phaseRatio(preview.phase);preview.defeating=false;preview.defeatAge=0;syncBossHud();
    state.camera.shake=Math.max(Number(state.camera.shake)||0,1.2+preview.phase*.55);
    return true;
  }
  function setHpRatio(ratio){if(!preview.active)return false;preview.hpRatio=clamp01(ratio);syncBossHud();return true;}
""",'phase setter')
s=once(s,"// Until phase-specific art is available, P1-P4 intentionally share this exact raster.","// Until phase-specific art is available, P1-P3 intentionally share this exact raster; phase growth is rendered as additional fissures.",'body comment')
s=once(s,"""    const phase=Math.max(1,Math.min(4,preview.phase)),death=preview.defeating?clamp01(preview.defeatAge/3.15):0,base=answerFrame();
    const t=performance.now()*.001,bob=Math.sin(t*.34)*1.25,drift=Math.sin(t*.17)*.75,frame={...base,x:base.x+drift,y:base.y+bob};
""","""    const phase=Math.max(1,Math.min(3,preview.phase)),death=preview.defeating?clamp01(preview.defeatAge/3.15):0,base=answerFrame();
    // The body is an immeasurably large fixed presence. Only its internal cosmos/fissures animate in the combat layer.
    const frame=base;
""",'static body')
s=once(s,"""    grid.append(
      button('응답 시안 시작','devAnswerStart',()=>activate(),true),
      button('P1 · 봉쇄','devAnswerP1',()=>setPhase(1)),button('P2 · 노출','devAnswerP2',()=>setPhase(2)),
      button('P3 · 증폭','devAnswerP3',()=>setPhase(3)),button('P4 · 응답','devAnswerP4',()=>setPhase(4)),
      button('격파 연출','devAnswerDefeat',()=>startDefeat()),button('시안 종료','devAnswerStop',()=>stop(),true),
      button('입장 위협 25%','devAnswerThreat25',()=>setThreat(25)),button('입장 위협 50%','devAnswerThreat50',()=>setThreat(50)),
      button('입장 위협 75%','devAnswerThreat75',()=>setThreat(75)),button('입장 위협 100%','devAnswerThreat100',()=>setThreat(100))
    );
""","""    const forcePhase=phase=>window.stackfallAnswerCombatForcePhase?.(phase)??setPhase(phase);
    const forcePattern=kind=>window.stackfallAnswerCombatForcePattern?.(kind)??false;
    grid.append(
      button('응답 시안 시작','devAnswerStart',()=>activate(),true),
      button('P1 · 봉쇄','devAnswerP1',()=>forcePhase(1)),button('P2 · 노출','devAnswerP2',()=>forcePhase(2)),button('P3 · 증폭','devAnswerP3',()=>forcePhase(3)),
      button('가시 강제','devAnswerSpike',()=>forcePattern('spike')),button('공간 양단 강제','devAnswerSplit',()=>forcePattern('split')),
      button('순백 빔 강제','devAnswerBeam',()=>forcePattern('beam')),button('진짜/가짜 가시 강제','devAnswerRow',()=>forcePattern('row')),button('기술 복제 강제','devAnswerClone',()=>forcePattern('clone')),
      button('격파 연출','devAnswerDefeat',()=>window.stackfallAnswerCombatDefeat?.()??startDefeat()),button('시안 종료','devAnswerStop',()=>stop(),true),
      button('입장 위협 25%','devAnswerThreat25',()=>setThreat(25)),button('입장 위협 50%','devAnswerThreat50',()=>setThreat(50)),
      button('입장 위협 75%','devAnswerThreat75',()=>setThreat(75)),button('입장 위협 100%','devAnswerThreat100',()=>setThreat(100))
    );
""",'dev controls')
s=once(s,"  installDevControls();setTimeout(installDevControls,0);setTimeout(installDevControls,250);setTimeout(installDevControls,1000);\n  window.stackfallVoidApexAnswerDiagnostics=()=>({","  window.stackfallSetAnswerPrototypePhase=setPhase;\n  window.stackfallSetAnswerPrototypeHpRatio=setHpRatio;\n  window.stackfallDefeatAnswerPrototype=startDefeat;\n  window.stackfallStopAnswerPrototype=stop;\n  installDevControls();setTimeout(installDevControls,0);setTimeout(installDevControls,250);setTimeout(installDevControls,1000);\n  window.stackfallVoidApexAnswerDiagnostics=()=>({",'visual APIs')
s=s.replace("visualRevision:'v16'","visualRevision:'v17'")
write(p,s)

# Dynamic loader
p='src/build-info.js'; s=read(p)
s=once(s,"""  const loadVoidApexAnswer=()=>{
    if(window.stackfallVoidApexAnswer==='v1'||document.querySelector('script[data-void-apex-answer-v1]'))return;
    const answerScript=document.createElement('script');answerScript.src='src/void-apex-answer-v1.js';answerScript.dataset.voidApexAnswerV1='1';document.body.appendChild(answerScript);
  };
""","""  const loadVoidApexAnswerCombat=()=>{
    if(window.stackfallVoidApexAnswerCombat==='v1'||document.querySelector('script[data-void-apex-answer-combat-v1]'))return;
    if(window.stackfallVoidApexAnswer!=='v1'){setTimeout(loadVoidApexAnswerCombat,35);return;}
    const combatScript=document.createElement('script');combatScript.src='src/void-apex-answer-combat-v1.js';combatScript.dataset.voidApexAnswerCombatV1='1';document.body.appendChild(combatScript);
  };
  const loadVoidApexAnswer=()=>{
    if(window.stackfallVoidApexAnswer==='v1'||document.querySelector('script[data-void-apex-answer-v1]')){loadVoidApexAnswerCombat();return;}
    const answerScript=document.createElement('script');answerScript.src='src/void-apex-answer-v1.js';answerScript.dataset.voidApexAnswerV1='1';answerScript.onload=loadVoidApexAnswerCombat;document.body.appendChild(answerScript);
  };
""",'loader')
s=once(s,"  setTimeout(loadVoidApexAnswer,0);","  setTimeout(loadVoidApexAnswer,0);\n  setTimeout(loadVoidApexAnswerCombat,35);",'combat loader timeout')
write(p,s)

# Fingerprint
p='scripts/build-fingerprint.mjs'; s=read(p)
s=once(s,"'src/combat-integrity-v1.js','src/endless-pressure-rewards-v1.js','src/void-apex-answer-v1.js'","'src/combat-integrity-v1.js','src/endless-pressure-rewards-v1.js','src/void-apex-answer-v1.js','src/void-apex-answer-combat-v1.js'",'fingerprint')
write(p,s)

# Apex global common stat nerf
p='src/boss-catalog.js'; s=read(p)
s=once(s,"enemy.hp*=7.60*escalation.hp;enemy.damage*=2.15*escalation.damage;","enemy.hp*=6.46*escalation.hp;enemy.damage*=1.83*escalation.damage;",'apex nerf')
write(p,s)

p='scripts/apex-encounter-contract.mjs'; s=read(p)
s=once(s,"['first apex has extreme fixed base strength',catalog.includes('enemy.hp*=7.60*escalation.hp')&&catalog.includes('enemy.damage*=2.15*escalation.damage')&&catalog.includes('enemy.skillCd*=.52/escalation.pattern')],","['first apex uses the approved fifteen-percent-lower common HP and damage base',catalog.includes('enemy.hp*=6.46*escalation.hp')&&catalog.includes('enemy.damage*=1.83*escalation.damage')&&catalog.includes('enemy.skillCd*=.52/escalation.pattern')],",'apex contract')
write(p,s)
p='scripts/endgame-balance-contract.mjs'; s=read(p)
s=once(s,"catalog.includes('enemy.hp*=7.60*escalation.hp')&&catalog.includes('enemy.damage*=2.15*escalation.damage')","catalog.includes('enemy.hp*=6.46*escalation.hp')&&catalog.includes('enemy.damage*=1.83*escalation.damage')",'endgame contract')
write(p,s)

# Canonical docs
p='docs/WIKI.md'; s=read(p); s=s.replace('첫 초월체: 고유 체력에 추가 7.6배, 고유 피해에 추가 2.15배','첫 초월체: 고유 체력에 추가 6.46배, 고유 피해에 추가 1.83배'); write(p,s)
p='docs/GAME_DESIGN.md'; s=read(p); s=s.replace('첫 초월체 체력 = 고유 체력 × 7.60','첫 초월체 체력 = 고유 체력 × 6.46').replace('첫 초월체 피해 = 고유 피해 × 2.15','첫 초월체 피해 = 고유 피해 × 1.83'); write(p,s)

# Answer contract updates
p='scripts/void-apex-answer-contract.mjs'; s=read(p)
s=once(s,"const answer=read('src/void-apex-answer-v1.js');","const answer=read('src/void-apex-answer-v1.js');\nconst combat=read('src/void-apex-answer-combat-v1.js');",'contract combat read')
s=once(s,"const parsesAsJavaScript=(()=>{try{new Function(answer);return true;}catch{return false;}})();","const parsesAsJavaScript=(()=>{try{new Function(answer);new Function(combat);return true;}catch{return false;}})();",'contract parse')
s=s.replace("['Answer V16 uses only the approved baked dark-cosmic raster',answer.includes(\"STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v16'\")","['Answer V17 preserves the approved baked dark-cosmic raster',answer.includes(\"STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v17'\")")
s=s.replace("['approved V16 raster payload is exact and container-complete'","['approved V16 raster payload remains exact and container-complete'")
s=once(s,"['temporary P1-P4 share one baked body with no legacy procedural fissures',!answer.includes('const FISSURES=')&&!answer.includes('drawAnswerFissures')&&!answer.includes('strokeScreenFissure')],","['P1-P3 share one baked body with no legacy procedural fissure owner in the visual shell',!answer.includes('const FISSURES=')&&!answer.includes('drawAnswerFissures')&&!answer.includes('strokeScreenFissure')&&answer.includes('Math.min(3')&&!answer.includes(\"button('P4 · 응답'\")],",'contract body phases')
s=once(s,"['boss motion remains restrained',answer.includes('bob=Math.sin(t*.34)*1.25')&&answer.includes('drift=Math.sin(t*.17)*.75')],","['body remains fixed while combat layer owns internal-cosmos and fissure motion',answer.includes('const frame=base')&&!answer.includes('bob=Math.sin')&&!answer.includes('drift=Math.sin')&&combat.includes('function drawCosmicMotion()')&&combat.includes('function drawPhaseFissures()')],",'contract body motion')
s=once(s,"['four visual phases are exposed in dev controls',answer.includes(\"button('P1 · 봉쇄'\")&&answer.includes(\"button('P2 · 노출'\")&&answer.includes(\"button('P3 · 증폭'\")&&answer.includes(\"button('P4 · 응답'\")&&answer.includes('Math.min(4')],","['exactly three visual/combat phases are exposed in dev controls',answer.includes(\"button('P1 · 봉쇄'\")&&answer.includes(\"button('P2 · 노출'\")&&answer.includes(\"button('P3 · 증폭'\")&&!answer.includes(\"button('P4 · 응답'\")&&answer.includes('Math.min(3')],",'contract dev phases')
s=once(s,"['dynamic loader includes the prototype',buildInfo.includes('src/void-apex-answer-v1.js')&&buildInfo.includes('data-void-apex-answer-v1')],","['dynamic loader includes visual shell then combat module',buildInfo.includes('src/void-apex-answer-v1.js')&&buildInfo.includes('data-void-apex-answer-v1')&&buildInfo.includes('src/void-apex-answer-combat-v1.js')&&buildInfo.includes('data-void-apex-answer-combat-v1')&&buildInfo.includes('answerScript.onload=loadVoidApexAnswerCombat')],",'contract loader')
s=once(s,"['build fingerprint tracks the prototype source and contract without a mutable binary body asset',fingerprint.includes(\"'src/void-apex-answer-v1.js'\")&&fingerprint.includes(\"'void-apex-answer-contract.mjs'\")&&!fingerprint.includes(\"'assets/answer/answer_body_base.webp'\")]","['build fingerprint tracks both prototype sources and contract without a mutable binary body asset',fingerprint.includes(\"'src/void-apex-answer-v1.js'\")&&fingerprint.includes(\"'src/void-apex-answer-combat-v1.js'\")&&fingerprint.includes(\"'void-apex-answer-contract.mjs'\")&&!fingerprint.includes(\"'assets/answer/answer_body_base.webp'\")]",'contract fingerprint')
extra='''  ['combat uses 75/30 three-phase thresholds and never player max-HP percentage damage',combat.includes('PHASE_2_HP=.75,PHASE_3_HP=.30')&&combat.includes('ANSWER_HP_FORM=2.63,ANSWER_DAMAGE_FORM=1.51')&&combat.includes('hurtPlayer(Math.max(1,bossDamage()*mult)')&&!combat.includes('player.maxHp*')&&!combat.includes('player.maxHp *')],
  ['targeted black spikes escalate one two three with locked warning',combat.includes('const count=runtime.phase')&&combat.includes('warn:1.4')&&combat.includes('TIMING={spike:5.8')&&combat.includes('offsets=count===1?[0]:count===2?[-105,105]:[-150,0,150]')],
  ['space split has long warning one-shot cut damage non-damaging barrier and flowing black matter',combat.includes("kind==='split'")&&combat.includes('warn:3.4,active:4.0,fade:.8')&&combat.includes('if(!m.impact&&m.age>=m.warn)')&&combat.includes('applySplitCollision(m)')&&combat.includes("ctx.strokeStyle='#000000'")&&combat.includes('lineDashOffset=-flow')],
  ['P2 adds pure-white center beam and readable true-fake spike row',combat.includes("kind==='beam'&&runtime.phase>=2")&&combat.includes("ctx.fillStyle='#ffffff'")&&combat.includes("kind==='row'&&runtime.phase>=2")&&combat.includes('const count=runtime.phase>=3?5:4')&&combat.includes('while(fake.length<2)')],
  ['P3 clones combat-impacting equipment every three seconds including hostile gravity and time-control',combat.includes('clone:3')&&combat.includes("gravity:'well'")&&combat.includes("chrono:'slow'")&&combat.includes("keys.length===1)return keys[0]")&&combat.includes("alt.length&&Math.random()<.78?alt:keys")],
  ['clone damage is normalized to Answer damage and drone children use canonical hostile projectiles',combat.includes('bossDamage()*DAMAGE.drone')&&combat.includes('spawnEnemyProjectile(c.x,c.y,a,340')&&!combat.includes('runtime.clones.push(p)')],
  ['major-pattern director prevents simultaneous majors and avoids immediate same-major repetition',combat.includes('if(runtime.major||runtime.transition||runtime.defeating)return false')&&combat.includes('const alternate=due.filter(k=>k!==runtime.lastMajor)')&&combat.includes('cloneCritical()')],
  ['developer controls can force every approved pattern for playtest',answer.includes("forcePattern('spike')")&&answer.includes("forcePattern('split')")&&answer.includes("forcePattern('beam')")&&answer.includes("forcePattern('row')")&&answer.includes("forcePattern('clone')")],
'''
s=once(s,'];\nlet failed=0;',extra+'];\nlet failed=0;','contract combat checks')
write(p,s)
