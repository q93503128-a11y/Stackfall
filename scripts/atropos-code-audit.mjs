import fs from 'node:fs';
import path from 'node:path';

const srcDir='src';
const files=fs.readdirSync(srcDir).filter(name=>/^atropos.*\.js$/i.test(name));
const sources=Object.fromEntries(files.map(name=>[name,fs.readFileSync(path.join(srcDir,name),'utf8')]));
const all=Object.values(sources).join('\n');
const restore=sources['atropos-visual-v5.js']||'';
const escalation=sources['atropos-combat-escalation-v1.js']||'';
const damage=sources['atropos-world-devourer-damage.js']||'';
const guidance=fs.readFileSync(path.join(srcDir,'build-audit-ui.js'),'utf8');
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

check(escalation.includes("stackfallAtroposCombatEscalation='v1'"),'Atropos combat escalation module is missing');
check(escalation.includes('const cutCounts=[0,1,2,3,4]'),'Space Cut chain count does not escalate P1→P4');
check(escalation.includes('const volleyCooldown=[0,4.85,4.10,3.45,3.05]'),'Space Cut volley cooldown does not shorten by phase');
check(escalation.includes('const stillThreshold=[0,1.20,.92,.62,0]'),'Anti-idle trigger window does not tighten through P4');
check(escalation.includes("if(phase<4&&(e.antiIdleStill||0)<stillThreshold[phase])return"),'P4 anti-idle does not ignore player movement');
check(escalation.includes('durationMs:3000')&&escalation.includes('tr.duration=3.0'),'P4 time stop is not fixed at three seconds');
check(escalation.includes('e.atroposP4TimeStopActive')&&escalation.includes('r.spaceCutVolley=null'),'P4 time stop does not suppress active Space Cut chains');
check(escalation.includes('base-elapsed*18.5'),'P4 clock does not visibly reverse during time stop');
check(escalation.includes('p4Distorted:phase===4&&!!e.atroposP4TimeStopDone'),'P4 post-stop Space Cuts are not marked for distorted timing/direction');
check(escalation.includes('historyPoint(e,5)')&&escalation.includes('historyPoint(e,9)'),'P4 post-stop cuts do not retarget historical player positions');

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
  combatEscalation:{spaceCutChains:[1,2,3,4],volleyCooldowns:[4.85,4.10,3.45,3.05],antiIdleStillThresholds:[1.20,.92,.62,0],p4TimeStopSeconds:3,postStopDistortion:true},
  guidance:{eliteArrowPolicy:'visual-bounds'},
  damage:{playerMaxHpReferences:false,globalHurtPlayerOverride:false},
  status:failures.length?'FAIL':'PASS',
  failures
};
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exit(1);
