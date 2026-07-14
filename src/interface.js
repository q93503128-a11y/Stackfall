function renderStarterOptions() {
  ui.starterOptions.innerHTML='';
  for(const [key,w] of Object.entries(WEAPONS)){
    const text=weaponText(key),el=document.createElement('button');
    el.type='button';el.className='starter-option'+(key===state.selectedStarter?' selected':'');
    el.style.setProperty('--starter-color',w.color);el.style.setProperty('--starter-glow',hexToRgba(w.color,.16));
    el.setAttribute('role','radio');el.setAttribute('aria-checked',key===state.selectedStarter?'true':'false');
    el.title=`${text.name} · ${text.role}`;el.innerHTML=`<span class="starter-icon">${w.icon}</span><span class="starter-label">${text.name}</span>`;
    el.onclick=()=>selectStarter(key);ui.starterOptions.appendChild(el);
  }
  const key=WEAPONS[state.selectedStarter]?state.selectedStarter:'blade',selected=weaponText(key);
  ui.starterName.textContent=selected.name;ui.starterDesc.textContent=selected.desc;
}
function selectStarter(key){if(!WEAPONS[key])return;state.selectedStarter=key;renderStarterOptions();}

function openChoices(){
  state.mode='choice';audio.level();ui.choice.classList.remove('hidden');ui.choiceTitle.textContent=`${tr('choice.title')} ${state.level}`;ui.choiceKicker.textContent=tr('choice.kicker');
  const choices=rollChoices(3);ui.choiceCards.innerHTML='';
  choices.forEach(c=>{const el=document.createElement('button');el.className='choice-card';el.style.setProperty('--card-accent',c.color);el.style.setProperty('--card-glow',hexToRgba(c.color,.22));
    const isWeapon=c.kind==='weapon',text=isWeapon?weaponText(c.key):passiveText(c.key),current=isWeapon?weaponCount(c.key):stat(c.key),next=isWeapon?stackEffectText(c.key,current+1):null,stackLabel=isWeapon?tr('choice.stack'):tr('choice.owned');
    el.innerHTML=`<span class="type">${isWeapon?tr('choice.equipment'):tr('choice.passive')}</span><span class="stack-info">${stackLabel} ${current} → ${current+1}</span><div class="big-icon">${c.icon}</div><h3>${text.name}</h3><p>${text.desc}</p>${next?`<div class="resonance-preview"><b>${current+1} · ${next.name}</b><span>${next.desc}</span></div>`:''}`;
    el.onclick=()=>selectChoice(c);ui.choiceCards.appendChild(el);
  });
}
function rollChoices(n){
  const pool=[];for(const [key,w] of Object.entries(WEAPONS)){const count=weaponCount(key),has=count>0,slots=state.weaponSlots.length;if(count<6&&(has||slots<6))pool.push({kind:'weapon',key,...w,weight:has?1.34:1});}
  for(const [key,p] of Object.entries(PASSIVES))if(stat(key)<p.max)pool.push({kind:'passive',key,...p,weight:key==='magnet'||key==='echo'?1.3:1.18});
  const out=[];while(out.length<n&&pool.length){let total=pool.reduce((s,p)=>s+p.weight,0),r=Math.random()*total,idx=0;for(;idx<pool.length;idx++){r-=pool[idx].weight;if(r<=0)break;}out.push(pool.splice(Math.min(idx,pool.length-1),1)[0]);}return out;
}
function selectChoice(c){
  if(c.kind==='weapon'){
    const before=weaponCount(c.key),after=before+1;state.weaponStacks[c.key]=after;if(before===0)state.weaponSlots.push(c.key);showStackEffect(c.key,after);
    if(c.key==='bulwark'){player.maxHp+=8;player.hp=Math.min(player.maxHp,player.hp+8);}
  }else{
    state.passives[c.key]=stat(c.key)+1;
    if(c.key==='vitality'){player.maxHp+=15;player.hp=Math.min(player.maxHp,player.hp+22);}
    if(c.key==='stellarLife'){const ratio=player.hp/Math.max(1,player.maxHp);player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.08));player.hp=Math.max(1,Math.min(player.maxHp,Math.round(player.maxHp*ratio)));}
  }
  ui.choice.classList.add('hidden');state.mode='playing';renderLoadout();updateHUD();
}
function showStackEffect(key,stack){const text=weaponText(key),effect=stackEffectText(key,stack),resonance=[2,4,6].includes(stack),kicker=document.querySelector('#resonanceKicker');if(kicker)kicker.textContent=resonance?tr('banner.resonance'):tr('banner.stack');ui.resonanceTitle.textContent=`${text.name} · ${effect.name}`;ui.resonanceDesc.textContent=effect.desc;ui.resonance.classList.remove('hidden');ui.resonance.style.animation='none';void ui.resonance.offsetWidth;ui.resonance.style.animation='';setTimeout(()=>ui.resonance.classList.add('hidden'),resonance?2400:1900);state.flash=resonance?.28:.12;state.camera.shake+=resonance?8:3;if(resonance)audio.resonance();else audio.pickup();}
function showBossNotice(name,kicker){const localizedKicker=kicker==='BOSS APPROACHING'?tr('boss.approaching'):kicker==='RIFT DETECTED'?tr('boss.rift'):kicker;ui.bossNoticeKicker.textContent=localizedKicker;ui.bossNoticeName.textContent=name;ui.bossNotice.classList.remove('hidden');ui.bossNotice.style.animation='none';void ui.bossNotice.offsetWidth;ui.bossNotice.style.animation='';setTimeout(()=>ui.bossNotice.classList.add('hidden'),kicker==='APEX THREAT'?3600:2600);}
function renderLoadout(){ui.slots.innerHTML='';for(let i=0;i<6;i++){const key=state.weaponSlots[i],el=document.createElement('div');el.className='weapon-slot'+(!key?' empty':'')+(key&&weaponCount(key)>=2?' resonant':'');if(key){const w=WEAPONS[key],text=weaponText(key);el.style.setProperty('--slot-color',hexToRgba(w.color,.18));el.title=stackEffectText(key,weaponCount(key)).desc;el.innerHTML=`<div class="icon">${w.icon}</div><div class="name">${text.name}</div><b class="stack">${weaponCount(key)}</b>`;}else el.innerHTML=`<div class="icon">+</div><div class="name">${tr('empty')}</div>`;ui.slots.appendChild(el);}ui.passives.innerHTML=Object.entries(state.passives).map(([k,v])=>{const text=passiveText(k),p=PASSIVES[k];return `<div class="passive-row"><span><i style="color:${p.color}">${p.icon}</i>${text.name}</span><b>×${v}</b></div>`;}).join('');}
function updateHUD(){ui.hpBar.style.width=`${clamp(player.hp/player.maxHp*100,0,100)}%`;ui.hpText.textContent=`${Math.ceil(player.hp)} / ${player.maxHp}${player.shield?` +${Math.ceil(player.shield)}`:''}`;ui.xpBar.style.width=`${clamp(state.xp/state.xpNeed*100,0,100)}%`;ui.level.textContent=state.level;ui.timer.textContent=formatTime(state.time);state.threat=1+Math.floor(state.time/45);ui.threat.textContent=`${tr('hud.threat')} ${state.threat}`;ui.comboText.textContent=state.combo;ui.comboBox.classList.toggle('active',state.combo>2);ui.comboBar.style.transform=`scaleX(${clamp(state.comboTimer/(2.15*(1+stat('chain')*.25)),0,1)})`;const boss=state.entities.enemies.find(e=>!e.dead&&(e.type==='boss'||e.type==='mini'));if(boss){ui.bossBar.classList.remove('hidden');ui.bossBar.classList.toggle('mini',boss.type==='mini');ui.bossName.textContent=bossDisplayName(boss);ui.bossHpBar.style.width=`${clamp(boss.hp/boss.maxHp*100,0,100)}%`;}else ui.bossBar.classList.add('hidden');}
function formatTime(t){const m=Math.floor(t/60),s=Math.floor(t%60);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function hexToRgba(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;}
function endGame(){state.mode='gameover';ui.gameOver.classList.remove('hidden');ui.touch.classList.add('hidden');ui.resultTime.textContent=formatTime(state.time);ui.resultKills.textContent=state.kills;ui.resultCombo.textContent=state.maxCombo;ui.resultLevel.textContent=state.level;state.camera.shake=18;}
function togglePause(force){if(['choice','gameover','menu','cinematic','worldEvent','bossReward','abilityView'].includes(state.mode))return;const pause=force??state.mode==='playing';state.mode=pause?'paused':'playing';ui.pauseScreen.classList.toggle('hidden',!pause);}
function showMainMenu(){state.mode='menu';state.input.keys.clear();state.input.touchX=state.input.touchY=0;Object.values(state.entities).forEach(a=>Array.isArray(a)&&a.splice(0));state.camera.shake=0;state.camera.x=0;state.camera.y=0;state.flash=0;state.hitStop=0;state.globalPulse=0;player.hitPulse=0;player.invuln=0;if(typeof resetRealmState==='function')resetRealmState();if(typeof closeMapEventOverlays==='function')closeMapEventOverlays();if(typeof closeAbilityLedger==='function')closeAbilityLedger(true);ui.hud.classList.add('hidden');ui.touch.classList.add('hidden');ui.choice.classList.add('hidden');ui.pauseScreen.classList.add('hidden');ui.gameOver.classList.add('hidden');ui.resonance.classList.add('hidden');ui.bossNotice.classList.add('hidden');ui.bossBar.classList.add('hidden');ui.menu.classList.remove('hidden');ui.menu.classList.add('active');renderStarterOptions();}
renderStarterOptions();
