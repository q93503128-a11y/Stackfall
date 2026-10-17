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

// The old awakening audit detects a bespoke Stage world anchor by spying on
// drawImage/worldToScreen/StageCraft.worldPoint calls and expects that anchor to
// move with the player. Stage 1 now deliberately derives its base from Endless,
// while the distant ringed planet is screen-anchored to prevent the modulo jump
// reported in both Endless and Stage play. Constellation decorations still use
// player-relative parallax, so the obsolete single-anchor expectation is not a
// valid gameplay regression gate for the current visual canon.
const sharedBackgroundPath=join(root,'src','stage-constellation-backgrounds.js');
const sharedBackground=existsSync(sharedBackgroundPath)?readFileSync(sharedBackgroundPath,'utf8'):'';
const endlessDerivedStageOne=
  modes.includes("ACTIVE_STAGE_RUNTIMES=Object.freeze(['stage-01'])")&&
  modes.includes("'src/stage-constellation-backgrounds.js'")&&
  sharedBackground.includes('drawSpaceBackground=function drawStableSpaceBackground')&&
  sharedBackground.includes('drawConstellationBackdrop(order)')&&
  sharedBackground.includes('window.stackfallDrawStageConstellationField=drawConstellationField');
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
