import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={Math,window:{},Image:class{},state:{time:10},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),player:{x:0,y:0,r:12},setTimeout:fn=>{fn();return 0;},segmentDistance:(x,y,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-ax-dx*t,y-ay-dy*t);}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/stage-physical-objects.js','utf8')+fs.readFileSync('src/stage01-production-art.js','utf8'),context);
const runtime=fs.readFileSync('src/stage-runtime.js','utf8'),start=runtime.indexOf('  function stageOneBodyShapes(e)'),end=runtime.indexOf('  window.stackfallStageBodyShapes=',start);
assert(start>=0&&end>start);vm.runInContext(runtime.slice(start,end)+';window.stackfallStageBodyShapes=stageOneBodyShapes;',context);
const e={x:80,y:-60,eventKind:'stage-01',stageBodyScale:1,stageBodyAngle:0,stageAction:'',stageGateCoreOpen:false};
let shapes=context.stageOneBodyShapes(e);assert.equal(shapes.length,6);
for(const s of shapes){assert(s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert(context.stageShapeCircleHit(s,s.x,s.y,1),'visible mass owns its center');assert(context.stageShapeSegmentHit(s,s.x-300,s.y,s.x+300,s.y,2),'fast shot hits each authored mass');}
assert(!context.enemyCircleOverlap(e,e.x,e.y+75,2),'lower central opening is empty');
const arm=shapes[1],old={x:arm.x,y:arm.y};e.stageAction='salvage';e.stageActionAt=9.45;shapes=context.stageOneBodyShapes(e);assert(Math.hypot(shapes[1].x-old.x,shapes[1].y-old.y)>10,'hoisted arm moves actual weapon geometry');assert(context.enemyCircleOverlap(e,shapes[1].x,shapes[1].y,2));
e.stageBodyAngle=Math.PI/2;shapes=context.stageOneBodyShapes(e);assert(context.enemySegmentOverlap(e,shapes[2].x-500,shapes[2].y,shapes[2].x+500,shapes[2].y,3),'rotated arm receives swept projectile');
e.stageAction='';e.stageBodyAngle=0;e.stageGateCoreOpen=true;e.stageGateOpenedAt=8;shapes=context.stageOneBodyShapes(e);assert(shapes[1].x<old.x-15,'opened armor changes physical silhouette');assert(context.enemyCircleOverlap(e,shapes[3].x,shapes[3].y,2),'exposed reactor receives weapons');
const manifest=JSON.parse(fs.readFileSync('assets/stage1/manifest.json','utf8')),index=fs.readFileSync('index.html','utf8');assert.equal(manifest.length,8);assert(manifest.reduce((sum,r)=>sum+r.size[0]*r.size[1]*4,0)<8*1024*1024);
for(const r of manifest){const path='assets/stage1/'+r.name+'.webp';assert(fs.statSync(path).size===r.bytes);assert(index.includes('href="'+path+'"'),'texture participates in preload and build fingerprint');}
console.log('PASS Stage 1 production art: six actual masses, articulated and rotated swept hits, empty lower gap, exposed reactor, eight bounded fingerprinted textures');
