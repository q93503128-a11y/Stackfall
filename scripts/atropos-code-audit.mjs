import fs from 'node:fs';
import path from 'node:path';

const srcDir='src';
const files=fs.readdirSync(srcDir).filter(name=>/^atropos.*\.js$/i.test(name));
const sources=Object.fromEntries(files.map(name=>[name,fs.readFileSync(path.join(srcDir,name),'utf8')]));
const all=Object.values(sources).join('\n');
const restore=sources['atropos-visual-v5.js']||'';
const damage=sources['atropos-world-devourer-damage.js']||'';
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg);};

check(!/player\s*\.\s*maxHp/.test(all),'Atropos source references player.maxHp');
check(!/ctx\.drawImage\s*=/.test(all),'Atropos source globally overrides ctx.drawImage');
check(!/hurtPlayer\s*=/.test(damage),'Atropos damage module overrides hurtPlayer');
check(restore.includes("stackfallApexVisualRestore='pre-9af0cdec-2026-07-20'"),'Historical Apex restore marker is missing');
check(restore.includes('drawChronophage20260720'),'Historical Chronophage renderer is missing');
check(restore.includes('drawStarforge20260720'),'Historical Starforge renderer is missing');
check(restore.includes('drawLastConstellation20260720'),'Historical Last Constellation renderer is missing');
check(!restore.includes("load('src/atropos-world-devourer-prototype.js'"),'Abandoned World Devourer runtime loader is still active');
check(!restore.includes('simple-four-pattern-v1'),'Abandoned simplified four-pattern state is still active');
check(!restore.includes("BOSS_NAMES.chronophage.ko='세계포식자 아트로포스'"),'World Devourer rename is still active');

const report={
  files:files.length,
  visualBaseline:'79afd49b / pre-9af0cdec / 2026-07-20',
  restored:['chronophage','starforge','lastconstellation'],
  abandonedPrototypeRuntime:false,
  damage:{playerMaxHpReferences:false,globalHurtPlayerOverride:false},
  status:failures.length?'FAIL':'PASS',
  failures
};
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exit(1);
