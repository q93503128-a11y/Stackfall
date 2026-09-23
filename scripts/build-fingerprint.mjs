import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ownPath=fileURLToPath(import.meta.url);
export const BUILD_INFO_PATH='src/build-info.js';
export const REQUIRED_PUBLIC_ASSETS=['googlea1b39620fd8849c7.html'];
const TEXT_ASSET_PATTERN=/\.(?:css|html|js|json|svg|webmanifest)$/i;
const CONTRACTS=['polish-contract-check.mjs','meta-upgrade-contract.mjs','level-choice-contract.mjs','stage-catalog-contract.mjs','stage01-runtime-contract.mjs','stage02-runtime-contract.mjs','stage03-runtime-contract.mjs','stage04-runtime-contract.mjs','stage05-runtime-contract.mjs','stage06-runtime-contract.mjs','stage07-runtime-contract.mjs','stage08-runtime-contract.mjs','stage09-runtime-contract.mjs','stage10-runtime-contract.mjs','stage11-runtime-contract.mjs','stage12-runtime-contract.mjs','stage13-runtime-contract.mjs','stage14-runtime-contract.mjs','stage15-runtime-contract.mjs','stage16-runtime-contract.mjs','stage17-runtime-contract.mjs','stage18-runtime-contract.mjs','sortie-prep-contract.mjs','boss-identity-contract.mjs','stage-map-contract.mjs','run-mode-contract.mjs','void-boss-contract.mjs','apex-encounter-contract.mjs','endgame-balance-contract.mjs','realm-specials-contract.mjs','community-feedback-contract.mjs','stage-balance-performance-contract.mjs','damage-results-contract.mjs','legacy-chat-requirements-contract.mjs','awakening-first-set-contract.mjs','awakening-second-set-contract.mjs','awakening-final-set-contract.mjs'];
const OWNERSHIP_GROUPS=['health','regen-runtime','regen-docs','hard','prism','targeting','docs','ci'];
function sha256(buffer){return createHash('sha256').update(buffer).digest('hex');}
function localAssets(index){
  const paths=['index.html',...REQUIRED_PUBLIC_ASSETS];
  for(const match of index.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
    const value=match[1].split(/[?#]/,1)[0];
    if(!value||value===BUILD_INFO_PATH||/^(?:https?:|data:)/i.test(value)||value.startsWith('//'))continue;
    if(!paths.includes(value))paths.push(value);
  }
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
  const assets=localAssets(index);
  const manifest=assets.map(path=>{
    const source=readFileSync(resolve(projectRoot,path));
    const bytes=TEXT_ASSET_PATTERN.test(path)?Buffer.from(source.toString('utf8').replace(/\r\n?/g,'\n')):source;
    return `${path}\0${sha256(bytes)}\n`;
  }).join('');
  return {sha:`sha256-${sha256(Buffer.from(manifest))}`,assets};
}
export function writeBuildInfo(projectRoot){
  const info=computeBuildFingerprint(projectRoot);
  const body=`window.STACKFALL_BUILD_SHA=${JSON.stringify(info.sha)};\nwindow.STACKFALL_BUILD_ASSETS=${JSON.stringify(info.assets)};\n`;
  writeFileSync(resolve(projectRoot,BUILD_INFO_PATH),body);
  return info;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(ownPath)){
  const projectRoot=resolve(dirname(ownPath),'..');
  validateBuildSources(projectRoot);
  const info=writeBuildInfo(projectRoot);
  console.log(JSON.stringify(info));
}
