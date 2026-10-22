import fs from 'node:fs';

function replaceOnce(path, oldText, newText) {
  const text=fs.readFileSync(path,'utf8');
  const first=text.indexOf(oldText);
  if(first<0)throw new Error(`${path}: patch target not found`);
  if(text.indexOf(oldText,first+oldText.length)>=0)throw new Error(`${path}: patch target not unique`);
  fs.writeFileSync(path,text.slice(0,first)+newText+text.slice(first+oldText.length));
}

replaceOnce(
  'src/render-entities.js',
  'function drawEnemies(){for(const e of state.entities.enemies){const p=worldToScreen(e.x,e.y);',
  'function drawEnemies(){for(const e of state.entities.enemies){const p=setRenderScreenPoint(RENDER_SCREEN_A,e.x,e.y);'
);

replaceOnce(
  'src/render-entities.js',
  "    if(!['mini','boss'].includes(e.type)&&e.hp<e.maxHp){",
  "    if(e.type!=='mini'&&e.type!=='boss'&&e.hp<e.maxHp){"
);

replaceOnce(
  'src/realm-backgrounds.js',
  "  ctx.save();ctx.lineCap='round';\n  for(let i=0;i<limit;i++){",
  "  ctx.save();ctx.lineCap='round';\n  const vx=player.moveVX||0,vy=player.moveVY||0,d=move||1,nx=vx/d,ny=vy/d;\n  for(let i=0;i<limit;i++){"
);

replaceOnce(
  'src/realm-backgrounds.js',
  "    const vx=player.moveVX||0,vy=player.moveVY||0,d=Math.hypot(vx,vy)||1,nx=vx/d,ny=vy/d,len=m.len*(.72+moving*.75);",
  "    const len=m.len*(.72+moving*.75);"
);

const contractPath='scripts/performance-audit-contract.mjs';
let contract=fs.readFileSync(contractPath,'utf8');
const marker=" ['offscreen beams shockwaves text and allied particles are culled before Canvas draw work',entities.includes('beamMargin=Math.max(80')&&entities.includes('Math.max(a.x,b.x)<-beamMargin')&&entities.includes('sx+r<-24')&&entities.includes('sx<-140||sx>vw+140')&&entities.includes('sx<-24-size||sx>vw+24+size')]\n";
if(!contract.includes(marker))throw new Error('performance contract insertion marker not found');
const additions=" ['enemy draw hot loop reuses screen scratch and avoids transient boss type array',entities.includes('const p=setRenderScreenPoint(RENDER_SCREEN_A,e.x,e.y)')&&!entities.includes('const p=worldToScreen(e.x,e.y)')&&entities.includes(\"if(e.type!=='mini'&&e.type!=='boss'&&e.hp<e.maxHp)\")&&!entities.includes(\"!['mini','boss'].includes(e.type)\")],\n ['traversal parallax normalizes movement once per frame instead of once per marker',realm.includes('const vx=player.moveVX||0,vy=player.moveVY||0,d=move||1,nx=vx/d,ny=vy/d;')&&realm.includes('const len=m.len*(.72+moving*.75);')&&!realm.includes('const vx=player.moveVX||0,vy=player.moveVY||0,d=Math.hypot(vx,vy)||1,nx=vx/d,ny=vy/d,len=m.len*(.72+moving*.75);')],\n";
contract=contract.replace(marker,additions+marker);
fs.writeFileSync(contractPath,contract);
