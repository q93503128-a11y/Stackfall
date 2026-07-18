import fs from 'node:fs';

const renderPath='src/render-entities.js';
const contractPath='scripts/community-feedback-contract.mjs';
const orbitOwner=`function drawEquippedOrbits(x,y,t){const size=weaponSizeMultiplier(),level=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0,bladeN=weaponCount('blade');if(bladeN){const count=bladeN>=5?3:bladeN>=2?2:1,orbit=orbitRadiusFor('blade');for(let i=0;i<count;i++){const a=player.angle+i*TAU/count,bx=x+Math.cos(a)*orbit,by=y+Math.sin(a)*orbit;ctx.save();ctx.translate(bx,by);ctx.rotate(a+Math.PI/2);ctx.scale(size,size);ctx.shadowBlur=level===2?0:bladeN>=6?28:18;ctx.shadowColor=COLORS.cyan;const blade=ctx.createLinearGradient(-17,-28,16,24);blade.addColorStop(0,'rgba(255,255,255,.98)');blade.addColorStop(.42,'#a7f5ff');blade.addColorStop(.75,'#668cff');blade.addColorStop(1,'rgba(60,76,190,.05)');ctx.fillStyle=blade;ctx.beginPath();ctx.moveTo(-5,-29);ctx.bezierCurveTo(18,-14,16,13,-2,28);ctx.bezierCurveTo(4,10,1,-9,-5,-29);ctx.fill();ctx.restore();}}const prismN=weaponCount('prism');if(prismN){const count=prismN>=6?3:prismN>=2?2:1;for(const p of prismPositions(count)){const s=worldToScreen(p.x,p.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-p.a+t*.00057);ctx.scale(size,size);ctx.fillStyle='#d2c3ff';ctx.shadowBlur=level===2?0:15;ctx.shadowColor='#c2a7ff';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.restore();}if(prismN>=4){const pts=prismPositions(count).map(p=>worldToScreen(p.x,p.y));ctx.strokeStyle='rgba(194,167,255,.25)';ctx.lineWidth=1.2;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(pts.length>2)ctx.closePath();ctx.stroke();}}const droneN=weaponCount('drone');if(droneN){for(const pos of meteorDronePositions(droneN)){const s=worldToScreen(pos.x,pos.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(pos.a+Math.PI/2);ctx.fillStyle='#0b2630';ctx.strokeStyle='#baffea';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,6);ctx.lineTo(0,3);ctx.lineTo(-8,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}}`;

let render=fs.readFileSync(renderPath,'utf8');
const anchor='function drawPlayerCrystalCore(x,y,t,growth){';
const definitions=(render.match(/function drawEquippedOrbits\(/g)||[]).length;
if(definitions===0){
  if(!render.includes(anchor))throw new Error('drawPlayerCrystalCore anchor not found');
  render=render.replace(anchor,`${orbitOwner}\n${anchor}`);
}else if(definitions!==1){
  throw new Error(`Expected at most one drawEquippedOrbits owner, found ${definitions}`);
}
fs.writeFileSync(renderPath,render);

let contract=fs.readFileSync(contractPath,'utf8');
const oldCheck="expect('single render owners',render.match(/function drawPlayer\\(/g)?.length===1&&render.match(/function drawWells\\(/g)?.length===1);";
const newCheck="expect('single render owners',render.match(/function drawPlayer\\(/g)?.length===1&&render.match(/function drawWells\\(/g)?.length===1&&render.match(/function drawEquippedOrbits\\(/g)?.length===1);";
if(contract.includes(oldCheck))contract=contract.replace(oldCheck,newCheck);
else if(!contract.includes(newCheck))throw new Error('single render owner contract anchor not found');
fs.writeFileSync(contractPath,contract);

const finalRender=fs.readFileSync(renderPath,'utf8');
if((finalRender.match(/function drawEquippedOrbits\(/g)||[]).length!==1)throw new Error('drawEquippedOrbits owner was not restored exactly once');
console.log('Restored the canonical equipped-orbit renderer owner.');
