from pathlib import Path
import re


def ensure_replace(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if old in text:
        text = text.replace(old, new)
        p.write_text(text, encoding='utf-8')
        return
    if new not in text:
        raise SystemExit(f'{path}: neither old nor new text found: {old!r}')


ensure_replace(
    'src/reward-refinement.js',
    '상시 피해 +12%. 체력 50% 미만에서 최대 +28% 추가 증가(총 최대 +40%).',
    '상시 피해 +20%. 체력 30% 이하에서 최대 +30% 추가 증가(총 최대 +50%).',
)
ensure_replace(
    'src/reward-refinement.js',
    'Permanent damage +12%. Below 50% health, gains up to +28% more (maximum total +40%).',
    'Permanent damage +20%. At or below 30% health, gains up to +30% more (maximum total +50%).',
)
ensure_replace(
    'src/reward-refinement.js',
    'const ECLIPSE_BASE_DAMAGE=.12,ECLIPSE_LOW_HEALTH_DAMAGE=.28,ECLIPSE_THRESHOLD=.50;',
    'const ECLIPSE_BASE_DAMAGE=.20,ECLIPSE_LOW_HEALTH_DAMAGE=.30,ECLIPSE_THRESHOLD=.30;',
)
ensure_replace(
    'src/ability-ledger-audit.js',
    '상시 피해 +12%. 체력 50% 미만에서 최대 +28% 추가 증가(총 최대 +40%).',
    '상시 피해 +20%. 체력 30% 이하에서 최대 +30% 추가 증가(총 최대 +50%).',
)

ensure_replace(
    'src/core.js',
    "vitality:{name:'재생 장갑',icon:'+',color:'#74f2a7',desc:'최대 체력 +20, 즉시 체력 30 회복',max:10}",
    "vitality:{name:'재생 장갑',icon:'+',color:'#74f2a7',desc:'최대 체력 +24, 즉시 체력 36 회복',max:10}",
)
ensure_replace(
    'src/progression-expansion.js',
    "if(c.key==='vitality'){player.maxHp+=20;player.hp=Math.min(player.maxHp,player.hp+30);}",
    "if(c.key==='vitality'){player.maxHp+=24;player.hp=Math.min(player.maxHp,player.hp+36);}",
)
ensure_replace(
    'src/reward-refinement.js',
    "if(key==='vitality'){player.maxHp+=20;player.hp=Math.min(player.maxHp,player.hp+30);}",
    "if(key==='vitality'){player.maxHp+=24;player.hp=Math.min(player.maxHp,player.hp+36);}",
)
ensure_replace(
    'src/progression-expansion.js',
    "if(c.key==='stellarLife'){const ratio=player.hp/Math.max(1,player.maxHp);player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.08));player.hp=Math.max(1,Math.min(player.maxHp,Math.round(player.maxHp*ratio)));}",
    "if(c.key==='stellarLife'){const ratio=player.hp/Math.max(1,player.maxHp);player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.10));player.hp=Math.max(1,Math.min(player.maxHp,Math.round(player.maxHp*ratio)));}",
)
ensure_replace(
    'src/reward-refinement.js',
    "if(key==='stellarLife'){const ratio=player.hp/Math.max(1,player.maxHp);player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.08));player.hp=Math.max(1,Math.round(player.maxHp*ratio));}",
    "if(key==='stellarLife'){const ratio=player.hp/Math.max(1,player.maxHp);player.maxHp=Math.max(player.maxHp+1,Math.round(player.maxHp*1.10));player.hp=Math.max(1,Math.round(player.maxHp*ratio));}",
)

for p in Path('src').glob('*.js'):
    text = p.read_text(encoding='utf-8')
    if 'stellarLife' not in text:
        continue
    changed = re.sub(
        r"(stellarLife\s*:\s*\{.{0,900}?)(최대 체력 \+)8%",
        r"\g<1>\g<2>10%",
        text,
        count=1,
        flags=re.S,
    )
    changed = re.sub(
        r"(stellarLife\s*:\s*\{.{0,1200}?)(Maximum health \+)8%",
        r"\g<1>\g<2>10%",
        changed,
        count=1,
        flags=re.S | re.I,
    )
    if changed != text:
        p.write_text(changed, encoding='utf-8')

perf = Path('src/performance-guard.js')
text = perf.read_text(encoding='utf-8')
old_tier = """  function pressureTier(){
    const value=pressureScore(),compact=compactDevice();
    return value>(compact?190:285)?2:value>(compact?135:210)?1:0;
  }
  function tier(){return Math.max(performanceTier,pressureTier());}
"""
new_tier = """  function pressureTier(){
    const value=pressureScore(),compact=compactDevice();
    return value>(compact?190:285)?2:value>(compact?135:210)?1:0;
  }
  function tier(){return performanceTier;}
"""
if old_tier in text:
    text = text.replace(old_tier, new_tier)
elif new_tier not in text:
    raise SystemExit('performance tier ownership block not found')

old_observer = """  function syncResolution(dt){
    const shouldDrop=performanceTier===2&&frameMs>29;
    if(shouldDrop){
      resolutionDropTime+=dt;resolutionRecoverTime=0;
      if(resolutionDropTime>1.8)applyEmergencyResolution(true);
    }else if(emergencyResolution){
      resolutionDropTime=0;
      if(frameMs<18&&slowDebt<4)resolutionRecoverTime+=dt;else resolutionRecoverTime=0;
      if(resolutionRecoverTime>7){applyEmergencyResolution(false);resolutionRecoverTime=0;}
    }else{
      resolutionDropTime=0;resolutionRecoverTime=0;
    }
  }
  function observeFrame(dt){
    const ms=clamp((Number(dt)||.0167)*1000,4,50);
    frameMs=frameMs*.92+ms*.08;
    if(frameMs>27)slowDebt=Math.min(140,slowDebt+2.2);
    else if(frameMs>21)slowDebt=Math.min(140,slowDebt+.65);
    else slowDebt=Math.max(0,slowDebt-1.4);
    performanceTier=frameMs>33||slowDebt>82?2:frameMs>23.5||slowDebt>28?1:0;
    syncResolution(dt);
  }
"""
new_observer = """  function syncResolution(dt){
    const shouldDrop=performanceTier===2&&frameMs>38&&slowDebt>=5.5;
    if(shouldDrop){
      resolutionDropTime+=dt;resolutionRecoverTime=0;
      if(resolutionDropTime>2.5)applyEmergencyResolution(true);
    }else if(emergencyResolution){
      resolutionDropTime=0;
      if(frameMs<23&&slowDebt<.7)resolutionRecoverTime+=dt;else resolutionRecoverTime=0;
      if(resolutionRecoverTime>5){applyEmergencyResolution(false);resolutionRecoverTime=0;}
    }else{
      resolutionDropTime=0;resolutionRecoverTime=0;
    }
  }
  function observeFrame(dt){
    const seconds=clamp(Number(dt)||.0167,.004,.25),ms=seconds*1000;
    frameMs=frameMs*.94+ms*.06;
    if(frameMs>42)slowDebt=Math.min(12,slowDebt+seconds*2.4);
    else if(frameMs>31)slowDebt=Math.min(12,slowDebt+seconds);
    else if(frameMs<24)slowDebt=Math.max(0,slowDebt-seconds*1.8);
    else slowDebt=Math.max(0,slowDebt-seconds*.45);
    performanceTier=slowDebt>=5.5?2:slowDebt>=2?1:0;
    syncResolution(seconds);
  }
"""
if old_observer in text:
    text = text.replace(old_observer, new_observer)
elif new_observer not in text:
    raise SystemExit('performance observation block not found')

diag_old = 'window.stackfallPerformanceTier=()=>tier();'
diag_new = "window.stackfallPerformanceTier=()=>tier();\n  window.stackfallPerformanceDiagnostics=()=>({tier:tier(),measuredTier:performanceTier,pressureTier:pressureTier(),frameMs,slowDebt,emergencyResolution});"
if diag_new not in text:
    if diag_old not in text:
        raise SystemExit('performance diagnostics anchor not found')
    text = text.replace(diag_old, diag_new)
perf.write_text(text, encoding='utf-8')

contract = Path('scripts/realm-specials-contract.mjs')
text = contract.read_text(encoding='utf-8')
ensure_pairs = [
    (
        "expect('eclipse exact description',reward.includes('상시 피해 +12%. 체력 50% 미만에서 최대 +28% 추가 증가(총 최대 +40%).')&&ledger.includes('총 최대 +40%'));",
        "expect('eclipse exact description',reward.includes('상시 피해 +20%. 체력 30% 이하에서 최대 +30% 추가 증가(총 최대 +50%).')&&ledger.includes('총 최대 +50%'));",
    ),
    (
        "expect('eclipse real damage function',reward.includes('ECLIPSE_BASE_DAMAGE=.12')&&reward.includes('ECLIPSE_LOW_HEALTH_DAMAGE=.28')&&reward.includes('amount*=1+eclipseDamageBonus()'));",
        "expect('eclipse real damage function',reward.includes('ECLIPSE_BASE_DAMAGE=.20')&&reward.includes('ECLIPSE_LOW_HEALTH_DAMAGE=.30')&&reward.includes('ECLIPSE_THRESHOLD=.30')&&reward.includes('amount*=1+eclipseDamageBonus()'));",
    ),
]
for old, new in ensure_pairs:
    if old in text:
        text = text.replace(old, new)
    elif new not in text:
        raise SystemExit(f'contract text missing: {old}')
anchor = "expect('canonical background only',!perf.includes('drawBackground=function optimizedBackground')&&!perf.includes('function themeVisual(theme)'));"
extra = "expect('quality reduction requires measured lag',perf.includes('function tier(){return performanceTier;}')&&perf.includes('slowDebt>=5.5?2:slowDebt>=2?1:0')&&perf.includes('frameMs>38&&slowDebt>=5.5'));"
if extra not in text:
    if anchor not in text:
        raise SystemExit('contract anchor not found')
    text = text.replace(anchor, anchor + '\n' + extra)
contract.write_text(text, encoding='utf-8')

ensure_replace(
    'README.md',
    '상시 피해 +12%이며, 체력 50% 미만에서 최대 +28%가 추가되어 총 최대 +40%까지 증가한다.',
    '상시 피해 +20%이며, 체력 30% 이하에서 최대 +30%가 추가되어 총 최대 +50%까지 증가한다.',
)
ensure_replace(
    'docs/WIKI.md',
    '상시 피해 +12%를 제공하며 체력이 50% 아래로 내려가면 추가 피해가 점차 증가해 총 최대 +40%가 됩니다.',
    '상시 피해 +20%를 제공하며 체력이 30% 이하로 내려가면 추가 피해가 점차 증가해 총 최대 +50%가 됩니다.',
)

note = (
    '\n- 재생 장갑은 중첩당 최대 체력 +24와 즉시 회복 36, 비율형 최대 체력 패시브는 중첩당 +10%로 상향한다.\n'
    '- 성능 보호 단계는 개체 수만으로 화질을 낮추지 않는다. 측정 프레임 지연이 누적된 경우에만 효과 밀도·개체 상한을 줄이며, 해상도 축소는 심각한 지연이 추가로 2.5초 이상 지속될 때만 허용한다.\n'
)
for path in ('README.md', 'docs/WIKI.md', 'docs/GAME_DESIGN.md'):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if '성능 보호 단계는 개체 수만으로 화질을 낮추지 않는다.' not in text:
        p.write_text(text.rstrip() + note, encoding='utf-8')

reward = Path('src/reward-refinement.js').read_text(encoding='utf-8')
core = Path('src/core.js').read_text(encoding='utf-8')
progression = Path('src/progression-expansion.js').read_text(encoding='utf-8')
perf_text = perf.read_text(encoding='utf-8')
assert 'ECLIPSE_BASE_DAMAGE=.20' in reward and 'ECLIPSE_THRESHOLD=.30' in reward
assert '최대 체력 +24, 즉시 체력 36 회복' in core
assert 'player.maxHp*1.10' in progression
assert 'function tier(){return performanceTier;}' in perf_text
assert 'frameMs>38&&slowDebt>=5.5' in perf_text
