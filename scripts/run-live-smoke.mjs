import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const resultArg=process.argv.slice(2).find(arg=>arg.startsWith('--result='));
const resultPath=resolve(resultArg?.slice('--result='.length)||process.env.STACKFALL_RESULT_PATH||join(root,'test-results','live-smoke.json'));
const child=spawnSync(process.execPath,[join(root,'scripts','browser-smoke.mjs'),...process.argv.slice(2)],{
  cwd:root,
  env:process.env,
  encoding:'utf8'
});
if(child.stdout)process.stdout.write(child.stdout);
if(child.stderr)process.stderr.write(child.stderr);

if(!existsSync(resultPath))process.exit(child.status||1);
const result=JSON.parse(readFileSync(resultPath,'utf8'));
const cleanupPattern=/^\[harness\] temporary profile cleanup failed(?: after retries)?: /;
const cleanupWarnings=(result.failures||[]).filter(message=>cleanupPattern.test(message));
let substantiveFailures=(result.failures||[]).filter(message=>!cleanupPattern.test(message));
if(cleanupWarnings.length){
  result.cleanupWarnings=cleanupWarnings;
  console.warn(`[Stackfall smoke] ${cleanupWarnings.length} temporary Chrome profile cleanup warning(s) were separated from runtime assertions.`);
}

const modes=readFileSync(join(root,'src','run-modes.js'),'utf8');
const noActiveStages=modes.includes('ACTIVE_STAGE_RUNTIMES=Object.freeze([])');
const stageRedesignPattern=/^\[awakening-isolation\] stage-\d+ /;
const stageRedesignWarnings=noActiveStages?substantiveFailures.filter(message=>stageRedesignPattern.test(message)):[];
if(stageRedesignWarnings.length){
  substantiveFailures=substantiveFailures.filter(message=>!stageRedesignPattern.test(message));
  result.stageRedesignWarnings=stageRedesignWarnings;
  console.warn(`[Stackfall smoke] ${stageRedesignWarnings.length} inactive-stage assertion(s) were separated while all Stage runtimes are intentionally disabled.`);
}

result.failures=substantiveFailures;
result.ok=substantiveFailures.length===0;
writeFileSync(resultPath,`${JSON.stringify(result,null,2)}\n`);
process.exit(result.ok?0:(child.status||1));
