from pathlib import Path

pressure = Path('src/endless-pressure-rewards-v1.js')
text = pressure.read_text(encoding='utf-8')
old = 'const DESKTOP_ENEMY_CAP=136,DESKTOP_NORMAL_TARGET_CAP=124;'
if old not in text:
    raise SystemExit('pressure cap constants not found')
text = text.replace(old, 'const DESKTOP_ENEMY_CAP=168,DESKTOP_NORMAL_TARGET_CAP=156;', 1)
old = 'else extra=12+Math.floor((time-1200)/180)*4;'
if old not in text:
    raise SystemExit('pressure growth formula not found')
text = text.replace(old, 'else extra=12+Math.floor((time-1200)/150)*4;', 1)
old = "if(prompt)prompt.textContent=GAME_SETTINGS.language==='ko'?`기함 격파 보너스: 코어 조각 +${granted} · 하나를 선택하세요`:`Dreadnought bonus: Core Shard +${granted} · Choose one`;"
if old not in text:
    raise SystemExit('Dreadnought bonus prompt not found')
text = text.replace(old, "if(prompt)prompt.textContent=GAME_SETTINGS.language==='ko'?`기함 격파 보너스: 코어 조각 +${granted} · 표시된 회수품 3개 전부 획득`:`Dreadnought bonus: Core Shard +${granted} · Collect all 3 shown salvage rewards`;", 1)
pressure.write_text(text, encoding='utf-8')

crash = Path('src/map-event-expansion.js')
text = crash.read_text(encoding='utf-8')
old = """  function openSalvage(){const cards=[card('◆',tx('passive'),tx('passiveDesc'),'#c8a8ff',()=>{const entries=grantRandomPassives(2);showUpgradeNotice('우주선 회수',entries);finishChoice('crash');}),card('✦',tx('weapon'),tx('weaponDesc'),'#89eaff',()=>{const weapon=grantRandomWeapon(2),entries=[weapon||grantWeaponFallback()];showUpgradeNotice('무기 공명',entries);finishChoice('crash');}),card('✚',tx('hull'),tx('hullDesc'),'#ff9eaf',()=>{state.salvageHullStacks++;maxHealth(1.12,true);finishChoice('crash');}),card('⬢',tx('barrier'),tx('barrierDesc'),'#79f6d1',()=>{state.salvageBarrierStacks++;state.salvageBarrierTimer=0;const profile=eventBarrierProfile();rechargeShield(14,profile.cap);finishChoice('crash');})].sort(()=>Math.random()-.5).slice(0,3);openCards(tx('salvage'),tx('choose'),cards,'STARSHIP SALVAGE','crash',()=>cards[0]?.action());}
"""
if old not in text:
    raise SystemExit('openSalvage canonical block not found')
new = """  function openSalvage(takeAll=false){
    const rewards=[
      {icon:'◆',name:tx('passive'),desc:tx('passiveDesc'),color:'#c8a8ff',grant:()=>{const entries=grantRandomPassives(2);showUpgradeNotice('우주선 회수',entries);}},
      {icon:'✦',name:tx('weapon'),desc:tx('weaponDesc'),color:'#89eaff',grant:()=>{const weapon=grantRandomWeapon(2),entries=[weapon||grantWeaponFallback()];showUpgradeNotice('무기 공명',entries);}},
      {icon:'✚',name:tx('hull'),desc:tx('hullDesc'),color:'#ff9eaf',grant:()=>{state.salvageHullStacks++;maxHealth(1.12,true);}},
      {icon:'⬢',name:tx('barrier'),desc:tx('barrierDesc'),color:'#79f6d1',grant:()=>{state.salvageBarrierStacks++;state.salvageBarrierTimer=0;const profile=eventBarrierProfile();rechargeShield(14,profile.cap);}}
    ].sort(()=>Math.random()-.5).slice(0,3);
    if(takeAll){
      let granted=false;
      const takeAllAction=()=>{if(granted)return;granted=true;for(const reward of rewards)reward.grant();finishChoice('crash');};
      const cards=rewards.map(reward=>card(reward.icon,reward.name,reward.desc,reward.color,takeAllAction));
      const prompt=lang()==='ko'?'기함 격파 보상 · 표시된 3개 전부 획득 (아무 카드나 눌러 회수)':'Dreadnought salvage · collect all 3 shown rewards (press any card)';
      openCards(tx('salvage'),prompt,cards,'DREADNOUGHT SALVAGE','crash',takeAllAction);return;
    }
    const cards=rewards.map(reward=>card(reward.icon,reward.name,reward.desc,reward.color,()=>{reward.grant();finishChoice('crash');}));
    openCards(tx('salvage'),tx('choose'),cards,'STARSHIP SALVAGE','crash',()=>cards[0]?.action());
  }
"""
text = text.replace(old, new, 1)
old = "state.mapEventActive=null;state.entities.mapEvents.length=0;combatTimer.classList.add('hidden');openSalvage();return;"
if old not in text:
    raise SystemExit('Crash salvage transition not found')
text = text.replace(old, "state.mapEventActive=null;state.entities.mapEvents.length=0;combatTimer.classList.add('hidden');openSalvage(ev.dreadnought===true);return;", 1)
crash.write_text(text, encoding='utf-8')

contract = Path('scripts/combat-integrity-contract.mjs')
text = contract.read_text(encoding='utf-8')
old = "/DESKTOP_ENEMY_CAP=136/.test(pressure)&&/DESKTOP_NORMAL_TARGET_CAP=124/.test(pressure)"
if old not in text:
    raise SystemExit('contract cap assertion not found')
text = text.replace(old, "/DESKTOP_ENEMY_CAP=168/.test(pressure)&&/DESKTOP_NORMAL_TARGET_CAP=156/.test(pressure)", 1)
needle = "  ['dreadnought reward stays idempotent across nested runtime wrappers',/completionReady&&!event\\.__dreadnoughtBonusGranted&&state\\.mapEventActive!==event/.test(pressure)&&/event\\.__dreadnoughtBonusGranted=true;\\s*grantDreadnoughtBonus\\(\\)/.test(pressure)],\n"
if needle not in text:
    raise SystemExit('contract insertion point not found')
addition = needle + "  ['dreadnought salvage grants all three displayed rewards',/function openSalvage\\(takeAll=false\\)/.test(crash)&&/const takeAllAction=/.test(crash)&&/openSalvage\\(ev\\.dreadnought===true\\)/.test(crash)],\n  ['late desktop pressure continues above the old 124 target',/DESKTOP_NORMAL_TARGET_CAP=156/.test(pressure)&&/\\(time-1200\\)\\/150/.test(pressure)],\n"
text = text.replace(needle, addition, 1)
contract.write_text(text, encoding='utf-8')

replacements = {
    'README.md': [
        ('일반 적 목표가 최대 124체까지 올라가며, 전체 적 안전 하드캡은 136체다.', '일반 적 목표가 최대 156체까지 올라가며, 전체 적 안전 하드캡은 168체다.'),
        ('기존 Salvage 3택1에 더해 성공 격파 시 영구 **Core Shard 1개**를 확정 지급한다.', '성공 격파 시 표시되는 Salvage 3개를 전부 획득하고, 영구 **Core Shard 1개**도 확정 지급한다.')
    ],
    'docs/GAME_DESIGN.md': [
        ('최종 일반 적 목표 상한은 124, 전체 적 안전 hard cap은 136이다.', '최종 일반 적 목표 상한은 156, 전체 적 안전 hard cap은 168이다.'),
        ('기존 Salvage 3택1 + 영구 Core Shard 1개를 지급한다.', '무작위로 표시된 Salvage 3개를 전부 지급하고 + 영구 Core Shard 1개를 지급한다.')
    ],
    'docs/WIKI.md': [
        ('장기 목표는 일반 적 최대 124체, 전체 안전 상한은 136체이며 모바일/콤팩트 기기는 기존 상한을 유지한다.', '장기 목표는 일반 적 최대 156체, 전체 안전 상한은 168체이며 모바일/콤팩트 기기는 기존 상한을 유지한다.'),
        ('**기존 우주선 Salvage 선택 + Core Shard 1개**를 추가로 받는다.', '**표시되는 우주선 Salvage 3개 전부 + Core Shard 1개**를 받는다.')
    ]
}
for name, pairs in replacements.items():
    path = Path(name)
    content = path.read_text(encoding='utf-8')
    for old_text, new_text in pairs:
        if old_text not in content:
            raise SystemExit(f'doc text not found in {name}: {old_text}')
        content = content.replace(old_text, new_text, 1)
    path.write_text(content, encoding='utf-8')
