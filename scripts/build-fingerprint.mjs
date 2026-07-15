import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ownPath=fileURLToPath(import.meta.url);
export const BUILD_INFO_PATH='src/build-info.js';
function sha256(buffer){return createHash('sha256').update(buffer).digest('hex');}
function localAssets(index){
  const paths=['index.html'];
  for(const match of index.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
    const value=match[1].split(/[?#]/,1)[0];
    if(!value||value===BUILD_INFO_PATH||/^(?:https?:|data:)/i.test(value)||value.startsWith('//'))continue;
    if(!paths.includes(value))paths.push(value);
  }
  return paths.sort();
}
export function computeBuildFingerprint(projectRoot){
  const index=readFileSync(resolve(projectRoot,'index.html'),'utf8');
  const assets=localAssets(index);
  const manifest=assets.map(path=>{
    const bytes=readFileSync(resolve(projectRoot,path));
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
  const info=writeBuildInfo(projectRoot);
  console.log(JSON.stringify(info));
}
