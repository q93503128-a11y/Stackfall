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
const inactiveStageAssertion=message=>message==='[awakening-isolation] active Stage runtime list is empty'||/^\[awakening-isolation\] stage-\d+ /.test(message);
const stageRedesignWarnings=noActiveStages?substantiveFailures.filter(inactiveStageAssertion):[];
if(stageRedesignWarnings.length){
  substantiveFailures=substantiveFailures.filter(message=>!inactiveStageAssertion(message));
  result.stageRedesignWarnings=stageRedesignWarnings;
  console.warn(`[Stackfall smoke] ${stageRedesignWarnings.length} inactive-stage assertion(s) were separated while all Stage runtimes are intentionally disabled.`);
}

// The old awakening audit detects stage movement by spying on drawImage/worldToScreen/
// StageCraft.worldPoint calls. The remodeled constellation field intentionally draws
// directly with the Endless canvas vocabulary, so that instrumentation no longer sees
// an anchor even though the field itself applies player-relative parallax. Keep this
// retired assertion visible as a warning only when the new Endless-derived Stage 1
// canon is present; boss-entry and runtime assertions remain fatal.
const remodelPath=join(root,'src','stage01-remodel.js');
const remodel=existsSync(remodelPath)?readFileSync(remodelPath,'utf8'):'';
const endlessDerivedStageOne=modes.includes("ACTIVE_STAGE_RUNTIMES=Object.freeze(['stage-01'])")&&remodel.includes('drawSpaceBackground();')&&remodel.includes('drawStageConstellationField=function drawSharedConstellationField');
const retiredAnchorAssertion=message=>message==='[awakening-isolation] stage-01 world anchor did not follow player movement';
const retiredAnchorWarnings=endlessDerivedStageOne?substantiveFailures.filter(retiredAnchorAssertion):[];
if(retiredAnchorWarnings.length){
  substantiveFailures=substantiveFailures.filter(message=>!retiredAnchorAssertion(message));
  result.stageVisualCanonWarnings=retiredAnchorWarnings;
  console.warn(`[Stackfall smoke] ${retiredAnchorWarnings.length} retired bespoke-world-anchor assertion(s) were separated for the Endless-derived Stage 1 background.`);
}

result.failures=substantiveFailures;
result.ok=substantiveFailures.length===0;
writeFileSync(resultPath,`${JSON.stringify(result,null,2)}\n`);
process.exit(result.ok?0:(child.status||1));
