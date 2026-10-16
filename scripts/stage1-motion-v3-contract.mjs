import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(process.cwd());
const read=path=>readFileSync(resolve(root,path),'utf8');
const fail=message=>{throw new Error(`[stage1-motion-v3] ${message}`);};
const has=(source,token,label)=>{if(!source.includes(token))fail(`${label}: missing ${token}`);};

const motion=read('src/stage01-rework-v3.js');
const modes=read('src/run-modes.js');
const build=read('scripts/build-fingerprint.mjs');

for(const token of [
  "lockline-v3-motion",
  "ram-lock",
  "ram-compress",
  "ram-pullback",
  "ram-ignite",
  "ram-commit",
  "ram-recoil",
  "ram-recover",
  "stackfallStageOneMotionV3",
  "drawRamRailTelegraph",
  "drawImpactConsequences"
])has(motion,token,'motion presentation');

has(modes,"src/stage01-rework-v3.js",'runtime loader');
has(modes,"data-stage01-rework-v3",'runtime loader');
has(build,"src/stage01-rework-v3.js",'build fingerprint');
has(build,"stage1-motion-v3-contract.mjs",'contract registry');

console.log('stage1 motion v3 contract: PASS');
