from pathlib import Path

crash = Path('src/map-event-expansion.js')
text = crash.read_text(encoding='utf-8')

css_anchor = "    .world-event-timer{display:inline-flex;align-items:center;justify-content:center;min-width:82px;height:28px;margin-top:12px;padding:0 12px;border:1px solid rgba(159,220,255,.26);border-radius:99px;background:rgba(3,8,22,.74);color:#dff8ff;font-size:11px;font-weight:900;letter-spacing:.12em}\n"
css_insert = "    .world-event-preview{cursor:default;pointer-events:none}\n    .world-event-collect-all{grid-column:1/-1;min-height:64px;border:1px solid rgba(255,184,112,.62);border-radius:10px;background:linear-gradient(135deg,rgba(121,49,27,.98),rgba(57,22,18,.99));color:#fff3df;font-size:15px;font-weight:1000;letter-spacing:.14em;cursor:pointer;box-shadow:0 18px 46px rgba(0,0,0,.42),inset 0 1px rgba(255,255,255,.08);transition:transform .16s,border-color .16s,box-shadow .16s}\n    .world-event-collect-all:hover{transform:translateY(-2px);border-color:#ffd39a;box-shadow:0 22px 54px rgba(0,0,0,.50),0 0 28px rgba(255,137,74,.18)}.world-event-collect-all:disabled{cursor:default;opacity:.72;transform:none}\n" + css_anchor
if css_anchor not in text:
    raise SystemExit('world event timer CSS anchor not found')
text = text.replace(css_anchor, css_insert, 1)

old_open = "  function openCards(title,prompt,cards,kicker='SIGNAL',eventType='signal',timeoutAction=null){closeAbilityLedger?.(true);state.mode='worldEvent';ui.touch.classList.add('hidden');overlay.dataset.eventType=eventType;overlay.classList.remove('hidden');$('#worldEventKicker').textContent=kicker;$('#worldEventTitle').textContent=title;$('#worldEventPrompt').textContent=prompt;const root=$('#worldEventCards');root.innerHTML='';let locked=false;const choose=c=>{if(locked||state.mode!=='worldEvent')return;locked=true;for(const button of root.querySelectorAll('button'))button.disabled=true;hideOverlay();c.action();};for(const c of cards){const el=document.createElement('button');el.className='world-event-card';el.style.setProperty('--event-color',c.color);el.innerHTML=`<span>${c.icon}</span><b>${c.name}</b><p>${c.desc}</p>`;el.onclick=()=>choose(c);root.appendChild(el);}clearChoiceClock();}\n"
new_open = "  function openCards(title,prompt,cards,kicker='SIGNAL',eventType='signal',timeoutAction=null,footerAction=null){closeAbilityLedger?.(true);state.mode='worldEvent';ui.touch.classList.add('hidden');overlay.dataset.eventType=eventType;overlay.classList.remove('hidden');$('#worldEventKicker').textContent=kicker;$('#worldEventTitle').textContent=title;$('#worldEventPrompt').textContent=prompt;const root=$('#worldEventCards');root.innerHTML='';let locked=false;const choose=c=>{if(locked||state.mode!=='worldEvent')return;locked=true;for(const button of root.querySelectorAll('button'))button.disabled=true;hideOverlay();c.action();};const preview=typeof footerAction==='function';for(const c of cards){const el=document.createElement(preview?'div':'button');el.className=preview?'world-event-card world-event-preview':'world-event-card';el.style.setProperty('--event-color',c.color);el.innerHTML=`<span>${c.icon}</span><b>${c.name}</b><p>${c.desc}</p>`;if(!preview)el.onclick=()=>choose(c);root.appendChild(el);}if(preview){const collect=document.createElement('button');collect.className='world-event-collect-all';collect.textContent=lang()==='ko'?'모두 받기':'COLLECT ALL';collect.onclick=()=>choose({action:footerAction});root.appendChild(collect);}clearChoiceClock();}\n"
if old_open not in text:
    raise SystemExit('openCards canonical block not found')
text = text.replace(old_open, new_open, 1)

old_take_all = """    if(takeAll){
      let granted=false;
      const takeAllAction=()=>{if(granted)return;granted=true;for(const reward of rewards)reward.grant();finishChoice('crash');};
      const cards=rewards.map(reward=>card(reward.icon,reward.name,reward.desc,reward.color,takeAllAction));
      const prompt=lang()==='ko'?'기함 격파 보상 · 표시된 3개 전부 획득 (아무 카드나 눌러 회수)':'Dreadnought salvage · collect all 3 shown rewards (press any card)';
      openCards(tx('salvage'),prompt,cards,'DREADNOUGHT SALVAGE','crash',takeAllAction);return;
    }
"""
new_take_all = """    if(takeAll){
      let granted=false;
      const takeAllAction=()=>{if(granted)return;granted=true;for(const reward of rewards)reward.grant();finishChoice('crash');};
      const cards=rewards.map(reward=>card(reward.icon,reward.name,reward.desc,reward.color,()=>{}));
      const prompt=lang()==='ko'?'기함 격파 보상 · 표시된 회수품 3개를 전부 획득합니다':'Dreadnought salvage · all 3 shown rewards are yours';
      openCards(tx('salvage'),prompt,cards,'DREADNOUGHT SALVAGE','crash',null,takeAllAction);return;
    }
"""
if old_take_all not in text:
    raise SystemExit('Dreadnought take-all salvage block not found')
text = text.replace(old_take_all, new_take_all, 1)
crash.write_text(text, encoding='utf-8')

pressure = Path('src/endless-pressure-rewards-v1.js')
text = pressure.read_text(encoding='utf-8')
old_prompt = "if(prompt)prompt.textContent=GAME_SETTINGS.language==='ko'?`기함 격파 보너스: 코어 조각 +${granted} · 표시된 회수품 3개 전부 획득`:`Dreadnought bonus: Core Shard +${granted} · Collect all 3 shown salvage rewards`;"
new_prompt = "if(prompt)prompt.textContent=GAME_SETTINGS.language==='ko'?`기함 격파 보너스: 코어 조각 +${granted} · 아래 모두 받기로 회수품 3개 획득`:`Dreadnought bonus: Core Shard +${granted} · Use COLLECT ALL for the 3 salvage rewards`;"
if old_prompt not in text:
    raise SystemExit('Dreadnought bonus prompt not found')
text = text.replace(old_prompt, new_prompt, 1)
pressure.write_text(text, encoding='utf-8')

contract = Path('scripts/combat-integrity-contract.mjs')
text = contract.read_text(encoding='utf-8')
needle = "  ['dreadnought salvage grants all three displayed rewards',/function openSalvage\\(takeAll=false\\)/.test(crash)&&/const takeAllAction=/.test(crash)&&/openSalvage\\(ev\\.dreadnought===true\\)/.test(crash)],\n"
if needle not in text:
    raise SystemExit('Dreadnought salvage contract anchor not found')
addition = needle + "  ['dreadnought salvage uses a dedicated collect-all CTA',/world-event-collect-all/.test(crash)&&/world-event-preview/.test(crash)&&/openCards\\(tx\\('salvage'\\),prompt,cards,'DREADNOUGHT SALVAGE','crash',null,takeAllAction\\)/.test(crash)],\n"
text = text.replace(needle, addition, 1)
contract.write_text(text, encoding='utf-8')
