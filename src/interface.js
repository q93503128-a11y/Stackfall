function renderStarterOptions() {
  ui.starterOptions.innerHTML='';
  for(const [key,w] of Object.entries(WEAPONS)){
    const el=document.createElement('button');
    el.type='button';
    el.className='starter-option'+(key===state.selectedStarter?' selected':'');
    el.style.setProperty('--starter-color',w.color);
    el.style.setProperty('--starter-glow',hexToRgba(w.color,.16));
    el.setAttribute('role','radio');
    el.setAttribute('aria-checked',key===state.selectedStarter?'true':'false');
    el.title=`${w.name} · ${w.role}`;
    el.innerHTML=`<span class="starter-icon">${w.icon}</span><span class="starter-label">${w.name}</span>`;
    el.onclick=()=>selectStarter(key);
    ui.starterOptions.appendChild(el);
  }
  const selected=WEAPONS[state.selectedStarter] || WEAPONS.blade;
  ui.starterName.textContent=selected.name;
  ui.starterDesc.textContent=selected.desc;
}

function selectStarter(key){
  if(!WEAPONS[key])return;
  state.selectedStarter=key;
  renderStarterOptions();
}

function openChoices() {
  state.mode='choice';audio.level();ui.choice.classList.remove('hidden');
  ui.choiceTitle.textContent=`레벨 ${state.level}`;ui.choiceKicker.textContent='SYSTEM OVERRIDE';
  const choices=rollChoices(3);ui.choiceCards.innerHTML='';
  choices.forEach(c=>{
    const el=document.createElement('button');el.className='choice-card';
    el.style.setProperty('--card-accent',c.color);el.style.setProperty('--card-glow',hexToRgba(c.color,.22));
    const next=c.kind==='weapon'?nextResonance(c.key):null;
    const stackText=c.kind==='weapon'?`중첩 ${weaponCount(c.key)} → ${weaponCount(c.key)+1}`:`보유 ${stat(c.key)} → ${stat(c.key)+1}`;
    el.innerHTML=`
      <span class="type">${c.kind==='weapon'?'EQUIPMENT':'PASSIVE'}</span>
      <span class="stack-info">${stackText}</span>
      <div class="big-icon">${c.icon}</div>
      <h3>${c.name}</h3><p>${c.desc}</p>
      ${next?`<div class="resonance-preview"><b>${next.at}중첩 공명</b> · ${next.name}</div>`:''}`;
    el.onclick=()=>selectChoice(c);ui.choiceCards.appendChild(el);
  });
}

function rollChoices(n) {
  const pool=[];
  for(const [key,w] of Object.entries(WEAPONS)){
    const count=weaponCount(key),has=count>0,slots=state.weaponSlots.length;
    if(count<6&&(has||slots<6))pool.push({kind:'weapon',key,...w,weight:has?1.34:1});
  }
  for(const [key,p] of Object.entries(PASSIVES)){
    if(stat(key)<p.max) pool.push({kind:'passive',key,...p,weight:key==='magnet'||key==='echo'?1.3:1.18});
  }
  const out=[];
  while(out.length<n&&pool.length){
    let total=pool.reduce((s,p)=>s+p.weight,0),r=Math.random()*total,idx=0;
    for(;idx<pool.length;idx++){r-=pool[idx].weight;if(r<=0)break;}
    out.push(pool.splice(Math.min(idx,pool.length-1),1)[0]);
  }
  return out;
}

function selectChoice(c) {
  if(c.kind==='weapon'){
    const before=weaponCount(c.key);state.weaponStacks[c.key]=before+1;
    if(before===0)state.weaponSlots.push(c.key);
    const after=before+1;if([2,4,6].includes(after))showResonance(c.key,after);
    if(c.key==='bulwark'){player.maxHp+=8;player.hp=Math.min(player.maxHp,player.hp+8);}
  }else{
    state.passives[c.key]=stat(c.key)+1;
    if(c.key==='vitality'){player.maxHp+=15;player.hp=Math.min(player.maxHp,player.hp+22);}
  }
  ui.choice.classList.add('hidden');state.mode='playing';renderLoadout();updateHUD();
}

function nextResonance(key){
  const n=weaponCount(key);
  for(const at of [2,4,6])if(n<at)return{at,name:WEAPONS[key].resonance[at][0]};
  return null;
}
function showResonance(key,at){
  const [name,desc]=WEAPONS[key].resonance[at];
  ui.resonanceTitle.textContent=`${WEAPONS[key].name} · ${name}`;ui.resonanceDesc.textContent=desc;
  ui.resonance.classList.remove('hidden');ui.resonance.style.animation='none';void ui.resonance.offsetWidth;ui.resonance.style.animation='';
  setTimeout(()=>ui.resonance.classList.add('hidden'),2400);state.flash=.28;state.camera.shake+=8;audio.resonance();
}
function showBossNotice(name,kicker){
  ui.bossNoticeKicker.textContent=kicker;ui.bossNoticeName.textContent=name;
  ui.bossNotice.classList.remove('hidden');ui.bossNotice.style.animation='none';void ui.bossNotice.offsetWidth;ui.bossNotice.style.animation='';
  setTimeout(()=>ui.bossNotice.classList.add('hidden'),2600);
}

function renderLoadout(){
  ui.slots.innerHTML='';
  for(let i=0;i<6;i++){
    const key=state.weaponSlots[i],el=document.createElement('div');
    el.className='weapon-slot'+(!key?' empty':'')+(key&&weaponCount(key)>=2?' resonant':'');
    if(key){const w=WEAPONS[key];el.style.setProperty('--slot-color',hexToRgba(w.color,.18));el.innerHTML=`<div class="icon">${w.icon}</div><div class="name">${w.name}</div><b class="stack">${weaponCount(key)}</b>`;}
    else el.innerHTML='<div class="icon">+</div><div class="name">EMPTY</div>';
    ui.slots.appendChild(el);
  }
  ui.passives.innerHTML=Object.entries(state.passives)
    .map(([k,v])=>`<div class="passive-row"><span><i style="color:${PASSIVES[k].color}">${PASSIVES[k].icon}</i>${PASSIVES[k].name}</span><b>×${v}</b></div>`).join('');
}

function updateHUD(){
  ui.hpBar.style.width=`${clamp(player.hp/player.maxHp*100,0,100)}%`;
  ui.hpText.textContent=`${Math.ceil(player.hp)} / ${player.maxHp}${player.shield?` +${Math.ceil(player.shield)}`:''}`;
  ui.xpBar.style.width=`${clamp(state.xp/state.xpNeed*100,0,100)}%`;ui.level.textContent=state.level;
  ui.timer.textContent=formatTime(state.time);state.threat=1+Math.floor(state.time/45);ui.threat.textContent=`THREAT ${state.threat}`;
  ui.comboText.textContent=state.combo;ui.comboBox.classList.toggle('active',state.combo>2);
  ui.comboBar.style.transform=`scaleX(${clamp(state.comboTimer/(2.15*(1+stat('chain')*.15)),0,1)})`;
  const boss=state.entities.enemies.find(e=>!e.dead&&(e.type==='boss'||e.type==='mini'));
  if(boss){
    ui.bossBar.classList.remove('hidden');ui.bossBar.classList.toggle('mini',boss.type==='mini');
    ui.bossName.textContent=boss.name;ui.bossHpBar.style.width=`${clamp(boss.hp/boss.maxHp*100,0,100)}%`;
  }else ui.bossBar.classList.add('hidden');
}

function formatTime(t){const m=Math.floor(t/60),s=Math.floor(t%60);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function hexToRgba(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;}

function endGame(){
  state.mode='gameover';ui.gameOver.classList.remove('hidden');ui.touch.classList.add('hidden');
  ui.resultTime.textContent=formatTime(state.time);ui.resultKills.textContent=state.kills;ui.resultCombo.textContent=state.maxCombo;ui.resultLevel.textContent=state.level;state.camera.shake=18;
}
function togglePause(force){
  if(state.mode==='choice'||state.mode==='gameover'||state.mode==='menu')return;
  const pause=force??state.mode==='playing';state.mode=pause?'paused':'playing';ui.pauseScreen.classList.toggle('hidden',!pause);
}
function showMainMenu(){
  state.mode='menu';state.input.keys.clear();state.input.touchX=state.input.touchY=0;
  Object.values(state.entities).forEach(a=>a.length=0);
  ui.hud.classList.add('hidden');ui.touch.classList.add('hidden');ui.choice.classList.add('hidden');ui.pauseScreen.classList.add('hidden');
  ui.gameOver.classList.add('hidden');ui.resonance.classList.add('hidden');ui.bossNotice.classList.add('hidden');ui.bossBar.classList.add('hidden');
  ui.menu.classList.remove('hidden');ui.menu.classList.add('active');renderStarterOptions();
}
renderStarterOptions();
