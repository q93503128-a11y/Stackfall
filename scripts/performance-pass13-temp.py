from pathlib import Path
import re

interface_path=Path('src/interface.js')
text=interface_path.read_text(encoding='utf-8')
match=re.search(r'function updateHUD\(\)\{.*?\}\nfunction formatTime',text,re.S)
if not match:
    raise SystemExit('updateHUD block not found')
old=match.group(0)
new="""const HUD_ELITE_GROUPS=new Map(),HUD_ELITE_RECORDS=[],HUD_ELITES=[];let HUD_TIMER_SECOND=-1,HUD_TIMER_TEXT='';
function setHudText(el,value){const next=String(value);if(el.textContent!==next)el.textContent=next;}
function setHudStyle(el,property,value){if(el.style[property]!==value)el.style[property]=value;}
function setHudClass(el,name,enabled){if(el.classList.contains(name)!==enabled)el.classList.toggle(name,enabled);}
function hudEliteRank(e){return e.kind==='stage-boss'||e.bossCategory==='apex'||e.kind==='apex'?0:e.type==='boss'?1:2;}
function hudEliteCompare(a,b){return hudEliteRank(a.enemy)-hudEliteRank(b.enemy);}
function hudTimerText(){const second=Math.max(0,Math.floor(state.time||0));if(second!==HUD_TIMER_SECOND){HUD_TIMER_SECOND=second;const m=Math.floor(second/60),s=second%60;HUD_TIMER_TEXT=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}return HUD_TIMER_TEXT;}
function updateHUD(){
  setHudStyle(ui.hpBar,'width',`${clamp(player.hp/player.maxHp*100,0,100)}%`);setHudText(ui.hpText,`${Math.ceil(player.hp)} / ${player.maxHp}${player.shield?` +${Math.ceil(player.shield)}`:''}`);setHudStyle(ui.xpBar,'width',`${clamp(state.xp/state.xpNeed*100,0,100)}%`);setHudText(ui.level,state.level);setHudText(ui.timer,hudTimerText());state.threat=1+Math.floor(state.time/60);setHudText(ui.threat,`${tr('hud.threat')} ${state.threat}`);setHudText(ui.comboText,state.combo);setHudClass(ui.comboBox,'active',state.combo>2);const duration=2.15*(typeof chainDurationMultiplier==='function'?chainDurationMultiplier():1+stat('chain')*.07);setHudStyle(ui.comboBar,'transform',`scaleX(${clamp(state.comboTimer/duration,0,1)})`);
  const groups=HUD_ELITE_GROUPS,elites=HUD_ELITES;groups.clear();elites.length=0;let recordCount=0;
  for(const enemy of state.entities.enemies){if(enemy.dead||(enemy.type!=='boss'&&enemy.type!=='mini'))continue;const key=enemy.twinGroup||enemy;let entry=groups.get(key);if(entry){entry.hp+=Math.max(0,enemy.hp||0);entry.maxHp+=Math.max(1,enemy.maxHp||1);continue;}entry=HUD_ELITE_RECORDS[recordCount];if(!entry)entry=HUD_ELITE_RECORDS[recordCount]={enemy:null,hp:0,maxHp:0};recordCount++;entry.enemy=enemy;entry.hp=Math.max(0,enemy.hp||0);entry.maxHp=Math.max(1,enemy.maxHp||1);groups.set(key,entry);elites.push(entry);}
  if(elites.length>1)elites.sort(hudEliteCompare);const primary=elites[0];
  if(primary){const boss=primary.enemy;setHudClass(ui.bossBar,'hidden',false);setHudClass(ui.bossBar,'mini',boss.type==='mini');setHudText(ui.bossName,bossDisplayName(boss));setHudStyle(ui.bossHpBar,'width',`${clamp(primary.hp/primary.maxHp*100,0,100)}%`);if(ui.bossExtras){let markup='';for(let i=1;i<elites.length;i++){const entry=elites[i],e=entry.enemy,apex=e.kind==='stage-boss'||e.kind==='apex'||e.bossCategory==='apex',pct=clamp(entry.hp/entry.maxHp*100,0,100);markup+=`<div class=\"boss-bar-extra${e.type==='mini'?' mini':''}${apex?' apex':''}\"><span>${bossDisplayName(e)}</span><div><i style=\"width:${pct}%\"></i></div></div>`;}if(ui.bossExtras.innerHTML!==markup)ui.bossExtras.innerHTML=markup;}}
  else{setHudClass(ui.bossBar,'hidden',true);if(ui.bossExtras&&ui.bossExtras.childElementCount)ui.bossExtras.replaceChildren();}
}
function formatTime"""
text=text[:match.start()]+new+text[match.end():]
interface_path.write_text(text,encoding='utf-8')

contract_path=Path('scripts/performance-audit-contract.mjs')
contract=contract_path.read_text(encoding='utf-8')
needle="const devTools=read('src/dev-tools-endless.js');\n"
if needle not in contract:
    raise SystemExit('contract import anchor missing')
contract=contract.replace(needle,needle+"const interfaceUi=read('src/interface.js');\n",1)
anchor="const checks=[\n"
if anchor not in contract:
    raise SystemExit('contract checks anchor missing')
check=" ['HUD refresh reuses elite aggregation storage and guards unchanged DOM writes',interfaceUi.includes('const HUD_ELITE_GROUPS=new Map(),HUD_ELITE_RECORDS=[],HUD_ELITES=[]')&&interfaceUi.includes('groups.clear();elites.length=0')&&interfaceUi.includes('elites.sort(hudEliteCompare)')&&interfaceUi.includes('if(el.textContent!==next)el.textContent=next')&&interfaceUi.includes('if(el.style[property]!==value)el.style[property]=value')&&interfaceUi.includes('if(elites.length>1)elites.sort(hudEliteCompare)')&&!interfaceUi.includes('const eliteGroups=new Map()')&&!interfaceUi.includes('elites.slice(1).map(')],\n"
contract=contract.replace(anchor,anchor+check,1)
contract_path.write_text(contract,encoding='utf-8')
