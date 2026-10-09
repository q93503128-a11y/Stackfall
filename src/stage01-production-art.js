// Stage 1 raster surfaces and articulated poses. Gameplay geometry remains
// simulation-owned; this module never changes progression or another Stage.
const FRONTIER_ART=Object.freeze(Object.fromEntries(['warden-chest','warden-clamp','warden-salvage','warden-core','bulkhead','girder','deck','gate'].map(key=>{const image=new Image();image.src=`assets/stage1/${key}.webp`;image.decoding='async';return[key,image];})));
function frontierSprite(key,x,y,w,h,g=ctx){const image=FRONTIER_ART[key];if(!image?.complete||!image.naturalWidth)return false;g.drawImage(image,x,y,w,h);return true;}
function frontierEase(t){t=clamp(t,0,1);return t*t*(3-2*t);}
function frontierKick(age,start,amount){const t=age-start;return t<0?0:amount*Math.sin(t*19)*Math.exp(-t*6);}
function stageOneArtPose(e){
  const now=state.time||0,age=Math.max(0,now-(e.stageActionAt??-10)),open=e.stageGateCoreOpen?frontierEase((now-(e.stageGateOpenedAt??-10))/.9):0;
  const parts=[[0,-34-open*17,82,53,0],[-88-open*22,38,28,57,-.04],[88+open*22,42,27,57,.04],[0,22+open*7,24,37,0]];
  const charge=frontierEase(age/.9),settle=1-frontierEase((age-1.7)/1.1);
  if(e.stageAction==='salvage'){parts[1][1]-=30*charge*settle;parts[1][0]-=10*charge*settle;parts[1][4]-=.22*charge*settle;parts[0][1]+=frontierKick(age,.9,7);}
  if(e.stageAction==='bulkhead'){const grip=charge*(1-frontierEase((age-2.2)/.8));parts[1][0]+=13*grip;parts[2][0]-=13*grip;parts[1][1]-=14*grip;parts[2][1]-=14*grip;parts[0][1]+=frontierKick(age,1.42,5);}
  if(e.stageAction==='ram'){const fold=frontierEase(age/1.15)*(1-frontierEase((age-1.9)/.7));parts[1][0]+=17*fold;parts[2][0]-=17*fold;parts[1][1]-=24*fold;parts[2][1]-=24*fold;parts[0][1]+=8*fold+frontierKick(age,1.87,6);}
  if(e.stageAction==='girder'){const pull=charge*(1-frontierEase((age-1.7)/.7));parts[2][1]-=29*pull;parts[2][4]-=.38*pull;parts[0][0]+=frontierKick(age,1.65,5);}
  if(e.stageEntryProgress!=null){const q=1-frontierEase((e.stageEntryProgress-.18)/.76);parts[1][0]-=q*60;parts[2][0]+=q*60;parts[1][1]-=q*35;parts[2][1]-=q*35;parts[0][1]-=q*20;}
  if(e.stageDefeatAge!=null){const q=frontierEase(e.stageDefeatAge/1.45);parts[1][0]-=q*34;parts[1][1]+=q*60;parts[1][4]-=q*.5;parts[2][0]+=q*42;parts[2][1]+=q*74;parts[2][4]+=q*.62;parts[0][1]+=q*12;}
  return parts;
}
window.stackfallStageOneArtPose=stageOneArtPose;
window.stackfallStageOneArtInfo=()=>({loaded:Object.entries(FRONTIER_ART).filter(([,image])=>image.complete&&image.naturalWidth).map(([key])=>key),textureCount:8});

function drawFrontierHardware(o){
  const key=o.kind==='bulkhead'?'bulkhead':o.kind==='girder'?'girder':'deck',p=worldToScreen(o.x,o.y),target=worldToScreen(o.toX??o.x,o.toY??o.y),warn=o.age<o.warn;
  if(Math.max(Math.abs(p.x-vw/2),Math.abs(target.x-vw/2))>vw/2+650&&Math.max(Math.abs(p.y-vh/2),Math.abs(target.y-vh/2))>vh/2+650)return;
  ctx.save();ctx.shadowBlur=0;
  if(warn){ctx.save();ctx.translate(target.x,target.y);ctx.rotate(o.angle||0);ctx.fillStyle='#dfa75f';ctx.globalAlpha=.09;ctx.fillRect(-o.hw,-o.hh,o.hw*2,o.hh*2);ctx.strokeStyle='#d5ae75';ctx.globalAlpha=.65;ctx.lineWidth=1.2;ctx.setLineDash([8,7]);ctx.strokeRect(-o.hw-3,-o.hh-3,o.hw*2+6,o.hh*2+6);ctx.setLineDash([]);ctx.restore();
    if(o.kind==='girder'){const pivot=worldToScreen(o.pivotX,o.pivotY);ctx.save();ctx.translate(pivot.x,pivot.y);ctx.globalAlpha=.35;ctx.strokeStyle='#d5ae75';ctx.setLineDash([9,9]);ctx.beginPath();ctx.arc(0,0,o.length+o.hh,o.angle,o.angle+o.sweep);ctx.stroke();ctx.restore();}
    if(o.kind==='bulkhead'){ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle='#d5ae75';ctx.setLineDash([8,9]);const a=worldToScreen(o.fromX,o.toY);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.restore();}
  }
  if(o.kind==='bulkhead'&&o.passageShift&&o.age<o.warn+o.travel+.95){const destination=worldToScreen(o.toX+o.passageShift,o.toY);ctx.save();ctx.globalAlpha=.38;ctx.strokeStyle='#dfa75f';ctx.setLineDash([6,8]);ctx.strokeRect(destination.x-o.hw,destination.y-o.hh,o.hw*2,o.hh*2);ctx.beginPath();ctx.moveTo(target.x,target.y);ctx.lineTo(destination.x,destination.y);ctx.stroke();ctx.restore();}
  ctx.save();ctx.translate(p.x+5,p.y+13);ctx.rotate(o.a||0);ctx.globalAlpha=.38;ctx.fillStyle='#000';ctx.fillRect(-o.hw,-o.hh,o.hw*2,o.hh*2);ctx.restore();
  ctx.translate(p.x,p.y-(o.height||0));ctx.rotate(o.a||0);frontierSprite(key,-o.hw,-o.hh,o.hw*2,o.hh*2);
  if(o.impactAt!=null){const t=o.age-o.impactAt;if(t<.23){ctx.globalAlpha=(1-t/.23)*.3;ctx.fillStyle='#f0c38b';ctx.fillRect(-o.hw,-o.hh,o.hw*2,3);}}
  ctx.restore();
}
