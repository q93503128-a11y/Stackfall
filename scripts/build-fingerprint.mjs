import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ownPath=fileURLToPath(import.meta.url);
export const BUILD_INFO_PATH='src/build-info.js';
export const REQUIRED_PUBLIC_ASSETS=['googlea1b39620fd8849c7.html'];
export const DYNAMIC_PUBLIC_ASSETS=[
  'stage-runtime.css','src/stage-constellation-backgrounds.js','src/stage-audio.js','src/stage01-remodel.js','src/stage01-polish.js','src/endless-progression.js','src/dev-tools-endless.js',
  'src/apex-constellation-legacy-v2.js','src/apex-entry-camera-v1.js','src/apex-entry-cleanup-v1.js','src/apex-identity-combat-v1.js','src/apex-reward-balance-v1.js','src/apex-starforge-legacy-v2.js',
  'src/atropos-combat-escalation-v1.js','src/atropos-hud-cleanup-v1.js','src/atropos-phase-production-v1.js','src/atropos-production-polish-v2.js','src/atropos-time-shear-v1.js',
  'src/omega-combat-v1.js','src/omega-production-v1.js'
];
const TEXT_ASSET_PATTERN=/\.(?:css|html|js|json|svg|webmanifest)$/i;
const CONTRACTS=['polish-contract-check.mjs','meta-upgrade-contract.mjs','level-choice-contract.mjs','stage-catalog-contract.mjs','stage-geometry-contract.mjs','stage-craft-contract.mjs','sortie-prep-contract.mjs','boss-identity-contract.mjs','stage-map-contract.mjs','run-mode-contract.mjs','canonical-state-contract.mjs','field-pickup-contract.mjs','runtime-ownership-contract.mjs','void-boss-contract.mjs','apex-encounter-contract.mjs','endgame-balance-contract.mjs','realm-specials-contract.mjs','community-feedback-contract.mjs','damage-results-contract.mjs','dev-tools-contract.mjs','performance-audit-contract.mjs','legacy-chat-requirements-contract.mjs','awakening-first-set-contract.mjs','awakening-second-set-contract.mjs','awakening-final-set-contract.mjs'];
const OWNERSHIP_GROUPS=['health','regen-runtime','regen-docs','hard','prism','targeting','docs','ci'];
function sha256(buffer){return createHash('sha256').update(buffer).digest('hex');}
function localAssets(index,projectRoot){
  const paths=['index.html',...REQUIRED_PUBLIC_ASSETS];
  for(const match of index.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
    const value=match[1].split(/[?#]/,1)[0];
    if(!value||value===BUILD_INFO_PATH||/^(?:https?:|data:)/i.test(value)||value.startsWith('//'))continue;
    if(existsSync(resolve(projectRoot,value))&&!paths.includes(value))paths.push(value);
  }
  for(const path of DYNAMIC_PUBLIC_ASSETS)if(existsSync(resolve(projectRoot,path))&&!paths.includes(path))paths.push(path);
  return paths.sort();
}
function sourceJavaScriptFiles(projectRoot){
  const root=resolve(projectRoot,'src'),out=[];
  const walk=dir=>{for(const entry of readdirSync(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())walk(path);else if(entry.isFile()&&entry.name.endsWith('.js'))out.push(path);}};
  walk(root);return out.sort();
}
export function validateBuildSources(projectRoot){
  for(const file of sourceJavaScriptFiles(projectRoot))execFileSync(process.execPath,['--check',file],{cwd:projectRoot,stdio:'inherit'});
  for(const contract of CONTRACTS)execFileSync(process.execPath,[resolve(projectRoot,'scripts',contract)],{cwd:projectRoot,stdio:'inherit'});
  for(const group of OWNERSHIP_GROUPS)execFileSync(process.execPath,[resolve(projectRoot,'scripts','source-ownership-contract.mjs')],{cwd:projectRoot,stdio:'inherit',env:{...process.env,OWNERSHIP_GROUP:group}});
}
export function computeBuildFingerprint(projectRoot){
  const index=readFileSync(resolve(projectRoot,'index.html'),'utf8');
  const assets=localAssets(index,projectRoot);
  const manifest=assets.map(path=>{
    const source=readFileSync(resolve(projectRoot,path));
    const bytes=TEXT_ASSET_PATTERN.test(path)?Buffer.from(source.toString('utf8').replace(/\r\n?/g,'\n')):source;
    return `${path}\0${sha256(bytes)}\n`;
  }).join('');
  return {sha:`sha256-${sha256(Buffer.from(manifest))}`,assets};
}
export function writeBuildInfo(projectRoot){
  const info=computeBuildFingerprint(projectRoot),target=resolve(projectRoot,BUILD_INFO_PATH);
  const existing=existsSync(target)?readFileSync(target,'utf8'):'';
  const tail=existing.replace(/^window\.STACKFALL_BUILD_SHA=.*\nwindow\.STACKFALL_BUILD_ASSETS=.*\n?/,'');
  const header=`window.STACKFALL_BUILD_SHA=${JSON.stringify(info.sha)};\nwindow.STACKFALL_BUILD_ASSETS=${JSON.stringify(info.assets)};\n`;
  writeFileSync(target,header+tail);
  return info;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(ownPath)){
  const projectRoot=resolve(dirname(ownPath),'..');
  validateBuildSources(projectRoot);
  const info=writeBuildInfo(projectRoot);
  console.log(JSON.stringify(info));
}
