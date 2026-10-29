import fs from 'node:fs';
import path from 'node:path';

const srcDir='src';
const files=fs.readdirSync(srcDir).filter(name=>/^atropos.*\.js$/i.test(name));
const sources=Object.fromEntries(files.map(name=>[name,fs.readFileSync(path.join(srcDir,name),'utf8')]));
const all=Object.values(sources).join('\n');
const restore=sources['atropos-visual-v5.js']||'';
const phase=sources['atropos-phase-production-v1.js']||'';
const escalation=sources['atropos-combat-escalation-v1.js']||'';
const polish=sources['atropos-production-polish-v2.js']||'';
const hud=sources['atropos-hud-cleanup-v1.js']||'';
const damage=sources['atropos-world-devourer-damage.js']||'';
const guidance=fs.readFileSync(path.join(srcDir,'build-audit-ui.js'),'utf8');
const entryCamera=fs.readFileSync(path.join(srcDir,'apex-entry-camera-v1.js'),'utf8');
const catalog=fs.readFileSync(path.join(srcDir,'boss-catalog.js'),'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg);};

check(!/player\s*\.\s*maxHp/.test(all),'Atropos source references player.maxHp');
check(!/ctx\.drawImage\s*=/.test(all),'Atropos source globally overrides ctx.drawImage');
check(!/hurtPlayer\s*=/.test(damage),'Atropos damage module overrides hurtPlayer');
check(restore.includes("stackfallApexVisualRestore='pre-9af0cdec-2026-07-20'"),'Historical Apex restore marker is missing');
check(restore.includes('drawChronophage20260720'),'Historical Chronophage renderer is missing');
check(restore.includes('drawStarforge20260720'),'Historical Starforge renderer is missing');
check(restore.includes('drawLastConstellation20260720'),'Historical Last Constellation renderer is missing');
check(restore.includes('baseDrawEnemiesAtropos'),'Chronophage historical renderer does not bypass the Reborn sentinel draw wrapper');
check(restore.includes('drawAtroposSpaceCut'),'Chronophage restore does not preserve the canonical space-cut effect');
check(restore.includes('stackfallApexVisualRestoreDiagnostics'),'Chronophage live-position/render diagnostics are missing');
check(!restore.includes("load('src/atropos-world-devourer-prototype.js'"),'Abandoned World Devourer runtime loader is still active');
check(!restore.includes('simple-four-pattern-v1'),'Abandoned simplified four-pattern state is still active');
check(!restore.includes("BOSS_NAMES.chronophage.ko='세계포식자 아트로포스'"),'World Devourer rename is still active');
check(catalog.includes("chronophage:{ko:'시간포식자 아트로포스'"),'Chronophage Korean name is not 시간포식자 아트로포스');

check(!phase.includes('fireTemporalEcho')&&!phase.includes('fireSplitTimeline')&&!phase.includes('fireCausalityReversal'),'Removed hidden Atropos history patterns are still present');
check(!phase.includes('showBossNotice(')&&!phase.includes('PHASE_NAMES'),'Atropos phase progression still announces explicit phase text');
check(phase.includes("attackGrammar:['space-cut','anti-idle-scar'"),'Phase diagnostics do not expose the simplified four-mechanic grammar');

check(escalation.includes("stackfallAtroposCombatEscalation='v1'"),'Atropos combat escalation module is missing');
check(escalation.includes('const cutCounts=[0,1,2,3,4]'),'Space Cut chain count does not escalate P1→P4');
check(escalation.includes('const volleyCooldown=[0,4.85,4.10,3.45,3.05]'),'Space Cut volley cooldown does not shorten by phase');
check(escalation.includes('const stillThreshold=[0,1.20,.92,.62,0]'),'Anti-idle trigger window does not tighten through P4');
check(escalation.includes("if(phase<4&&(e.antiIdleStill||0)<stillThreshold[phase])return"),'P4 anti-idle does not ignore player movement');
check(escalation.includes('CLOCK_STEPS=12')&&escalation.includes('const handStepSeconds=[0,0,2.0,1.0,.50]'),'Clock hand is not a twelve-step P2/P3/P4 mechanic');
check(escalation.includes('hand.burstSteps>=3')&&escalation.includes('hand.offTimer=2.0'),'P4 broken clock does not pause after three reverse steps');
check(escalation.includes('const fieldCooldown=[0,0,0,3.0,1.65]'),'P3/P4 time-field cooldowns are not production values');
check(escalation.includes('function spawnTimeField')&&escalation.includes('function drawTimeFields'),'Time-field mechanic or clock-face rendering is missing');
check(escalation.includes('function updateArenaBoundary')&&escalation.includes('function drawArenaBoundary'),'Chronophage soft arena boundary is missing');
check(escalation.includes('durationMs:3000')&&escalation.includes('tr.duration=3.0'),'P4 time stop is not fixed at three seconds');
check(escalation.includes('e.atroposP4TimeStopActive')&&escalation.includes('r.spaceCutVolley=null'),'P4 time stop does not suppress active Space Cut chains');
check(escalation.includes('base-elapsed*18.5'),'P4 clock does not visibly reverse during time stop');
check(escalation.includes('p4Distorted:phase===4&&!!e.atroposP4TimeStopDone'),'P4 post-stop Space Cuts are not marked for distorted timing/direction');
check(escalation.includes('historyPoint(e,5)')&&escalation.includes('historyPoint(e,9)'),'P4 post-stop cuts do not retarget historical player positions');

check(polish.includes("stackfallAtroposProductionPolish='v2'"),'Atropos production polish v2 is missing');
check(polish.includes('DESKTOP_ARENA=663')&&polish.includes('COMPACT_ARENA=440'),'Atropos arena is not enlarged by roughly thirty percent');
check(polish.includes('e.x=r.anchorX;e.y=r.anchorY;e.speed=0'),'Atropos world anchor is not hard-locked');
check(polish.includes("ctx.globalCompositeOperation='color'"),'P4 time stop does not apply grayscale/desaturation presentation');
check(polish.includes("return 70.5+(t-3)*70"),'P4 reverse clock does not maintain high-speed spin after the time stop');
check(polish.includes("['12',-Math.PI/2]")&&polish.includes('for(let i=0;i<60;i++)'),'Time-field face does not contain explicit clock numerals/minute marks');

check(entryCamera.includes("stackfallApexEntryCamera='v1'"),'Apex entry camera module is missing');
check(entryCamera.includes("tr?.owner==='apex-entry'")&&entryCamera.includes('function panMix'),'Apex entry camera is not bound to the entry cinematic');
check(entryCamera.includes('e.contactSafeUntil')&&entryCamera.includes('2.25'),'Apex entry does not provide post-reveal contact safety');
check(entryCamera.includes('player.x=camera.camX;player.y=camera.camY')&&entryCamera.includes('player.x=realX;player.y=realY'),'Apex entry camera does not restore the real player position after rendering');

check(hud.includes("kind.textContent=GAME_SETTINGS.language==='ko'?'초월체':'APEX'"),'Atropos HUD does not hide explicit P-number labels');
check(guidance.includes('function eliteGuideVisualRadius'),'Elite/Apex guidance does not use visual bounds');
check(guidance.includes('function eliteBodyVisibleOnScreen'),'Elite/Apex guidance does not test visible body intersection');
check(guidance.includes('window.stackfallGuidanceShouldShowEliteArrow=shouldShowEliteGuide'),'Elite/Apex guidance visibility policy is not inspectable');
check(guidance.includes("eliteArrowPolicy:'visual-bounds'"),'Guidance diagnostics do not report the visual-bounds policy');

const report={
  files:files.length,
  visualBaseline:'79afd49b / pre-9af0cdec / 2026-07-20',
  restored:['chronophage','starforge','lastconstellation'],
  chronophageRenderPath:'live entity -> pre-Reborn drawEnemies -> restored drawEliteShape',
  sentinelLeakBlocked:true,
  canonicalSpaceCutPreserved:true,
  abandonedPrototypeRuntime:false,
  attackGrammar:['space-cut','anti-idle-scar','clock-hand','time-field'],
  combatEscalation:{spaceCutChains:[1,2,3,4],volleyCooldowns:[4.85,4.10,3.45,3.05],antiIdleStillThresholds:[1.20,.92,.62,0],clockHandStepSeconds:{p2:2,p3:1,p4:.5},p4ClockBurst:{steps:3,offSeconds:2,direction:'reverse'},timeFieldCooldowns:{p3:3,p4:1.65},p4TimeStopSeconds:3,postStopDistortion:true},
  productionPolish:{fixedBoss:true,arenaRadius:{desktop:663,compact:440},p4GrayStop:true,p4PersistentReverseSpin:true,timeFieldClockFace:true},
  apexEntryCamera:{cinematicPan:true,safeContactSeconds:2.25},
  guidance:{eliteArrowPolicy:'visual-bounds'},
  explicitPhaseHud:false,
  damage:{playerMaxHpReferences:false,globalHurtPlayerOverride:false},
  status:failures.length?'FAIL':'PASS',
  failures
};
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exit(1);
