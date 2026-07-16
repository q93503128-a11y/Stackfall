from pathlib import Path


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def replace_exact(path, old, new, label):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match in {path}, got {count}')
    write(path, text.replace(old, new, 1))


def append_once(path, marker, block):
    text = read(path)
    if marker in text:
        return
    write(path, text.rstrip() + '\n\n' + block.strip() + '\n')


replace_exact(
    'index.html',
    '  <script src="src/reward-refinement.js"></script>\n  <script src="src/combat-balance-refinement.js"></script>',
    '  <script src="src/reward-refinement.js"></script>\n  <script src="src/difficulty-augment-expansion.js"></script>\n  <script src="src/combat-balance-refinement.js"></script>',
    'load difficulty and augment module',
)

replace_exact(
    'src/systems-base.js',
    'rangedChance=clamp((t-35)/520,0,.19)',
    'rangedChance=clamp((t-55)/650,0,.13)*(window.stackfallDifficultyConfig?.().rangedChance||1)',
    'reduce ranged enemy share',
)

replace_exact('src/weapons.js', 'function fireBoomerang(target,stacks,echoed=false){', 'function fireBoomerang(target,stacks,echoed=false,origin=null,ricochet=false){', 'boomerang signature')
replace_exact(
    'src/weapons.js',
    'const shots=stacks>=6?3:stacks>=2?2:1,start={x:player.x,y:player.y},base=',
    'const shots=ricochet?1:stacks>=6?3:stacks>=2?2:1,start=origin&&Number.isFinite(origin.x)&&Number.isFinite(origin.y)?{x:origin.x,y:origin.y}:{x:player.x,y:player.y},base=',
    'boomerang ricochet origin',
)
replace_exact(
    'src/weapons.js',
    'damage:(14+stacks*4.1)*(echoed?.66:1),returnDamageMult:',
    'damage:(14+stacks*4.1)*(echoed?.66:1)*(ricochet?.72:1),returnDamageMult:',
    'boomerang ricochet damage',
)
replace_exact('src/weapons.js', 'stacks,dead:false,returnLife:0});', 'stacks,dead:false,returnLife:0,ricochet:!!ricochet});', 'boomerang ricochet flag')
replace_exact('src/weapons.js', 'range=150+ionN*22', 'range=190+ionN*26', 'ion chain distance')

replace_exact(
    'src/systems.js',
    "dealDamage(e,p.damage,{color:p.color,source:'arc'});",
    "dealDamage(e,p.damage,{color:p.color,source:p.ricochet?'arc-ricochet':'arc'});",
    'outbound ricochet source',
)
replace_exact(
    'src/systems.js',
    "dealDamage(e,p.damage*(p.returnDamageMult||1),{color:p.color,source:'arc-return'});",
    "dealDamage(e,p.damage*(p.returnDamageMult||1),{color:p.color,source:p.ricochet?'arc-ricochet-return':'arc-return'});",
    'return ricochet source',
)

replace_exact(
    'src/map-event-expansion.js',
    "scheduleUiAction(2900,()=>ui.resonance.classList.add('hidden'))",
    "scheduleUiAction(4900,()=>ui.resonance.classList.add('hidden'))",
    'random reward notice duration',
)
replace_exact(
    'src/reward-refinement.js',
    "scheduleUiAction(2800,()=>ui.resonance.classList.add('hidden'))",
    "scheduleUiAction(4800,()=>ui.resonance.classList.add('hidden'))",
    'miniboss reward notice duration',
)

replace_exact(
    'src/reward-refinement.js',
    "    arc:{icon:'☾',color:'#69ffe0',name:{ko:'귀환 파편',en:'Return Shards'},desc:{ko:'귀환 중 적중 시 세 갈래 성운 파편 방출.',en:'Return hits release three nebula shards.'}}\n  };",
    """    arc:{icon:'☾',color:'#69ffe0',name:{ko:'포식 궤도',en:'Predatory Orbit'},desc:{ko:'귀환 타격이 파편을 방출하고, 부메랑으로 처치하면 무작위 적에게 추가 도약.',en:'Return hits release shards, and boomerang kills leap to a random enemy.'}},
    ion:{icon:'⌁',color:'#72f2ff',name:{ko:'초전도 성좌망',en:'Superconductive Constellation'},desc:{ko:'첫 사슬 뒤에 약한 두 번째 사슬망이 즉시 전개.',en:'A weaker second chain network unfolds after the first cast.'}},
    nova:{icon:'✹',color:'#ffbd69',name:{ko:'역행 초신성',en:'Reversing Supernova'},desc:{ko:'외곽 폭발 뒤 중심으로 적을 당기는 지연 붕괴파.',en:'A delayed collapse wave pulls enemies inward after the outer blast.'}},
    drone:{icon:'⌁',color:'#8fffd0',name:{ko:'낙성 표식',en:'Falling-Star Mark'},desc:{ko:'편대가 가장 강한 표적에 지연 유성 타격을 호출.',en:'The squad calls a delayed meteor strike on the strongest target.'}},
    rail:{icon:'━',color:'#b7e7ff',name:{ko:'궤도 파쇄',en:'Orbital Fracture'},desc:{ko:'주포 궤도 위 세 지점이 잠시 뒤 연쇄 폭발.',en:'Three points along the rail path detonate in sequence.'}},
    spiral:{icon:'◎',color:'#e3a7ff',name:{ko:'역나선 은하',en:'Counter-Spiral Galaxy'},desc:{ko:'본 나선 뒤 반대 회전의 추적 나선이 한 차례 더 생성.',en:'A counter-rotating homing spiral follows the main galaxy.'}},
    mirror:{icon:'◇',color:'#9fffe7',name:{ko:'쌍면 반사',en:'Twin-Face Reflection'},desc:{ko:'반사한 적 탄환마다 추가 반사광 두 갈래를 방출.',en:'Every reflected enemy shot emits two additional counter rays.'}}
  };
  window.stackfallWeaponAugmentDefs=augmentDefs;""",
    'complete augment catalog',
)

replace_exact(
    'src/ability-ledger-audit.js',
    "const augmentMeta={core:['✷','#eafcff','항성 연사'],blade:['◒','#7ce8ff','공간 절개'],ember:['✦','#ff7b9e','연쇄 성화'],bulwark:['◈','#74f2a7','반사 장벽'],gravity:['◉','#9e79ff','종말 붕괴'],comet:['⟐','#b5f5ff','혜성 편대'],prism:['✧','#c2a7ff','과열 성선'],chrono:['◎','#8fffe0','시간 파쇄'],arc:['☾','#69ffe0','귀환 파편']};",
    "const augmentMeta={core:['✷','#eafcff','항성 연사'],blade:['◒','#7ce8ff','공간 절개'],ember:['✦','#ff7b9e','연쇄 성화'],bulwark:['◈','#74f2a7','반사 장벽'],gravity:['◉','#9e79ff','종말 붕괴'],comet:['⟐','#b5f5ff','혜성 편대'],prism:['✧','#c2a7ff','과열 성선'],chrono:['◎','#8fffe0','시간 파쇄'],arc:['☾','#69ffe0','포식 궤도'],ion:['⌁','#72f2ff','초전도 성좌망'],nova:['✹','#ffbd69','역행 초신성'],drone:['⌁','#8fffd0','낙성 표식'],rail:['━','#b7e7ff','궤도 파쇄'],spiral:['◎','#e3a7ff','역나선 은하'],mirror:['◇','#9fffe7','쌍면 반사']};",
    'augment ledger metadata',
)
replace_exact('src/ability-ledger-audit.js', 'let ledgerOpen=false,openedFromPause=false,resumeAfterLedger=false;', 'let ledgerOpen=false,openedFromPause=false,openedFromChoice=false,resumeAfterLedger=false;', 'choice ledger state')
replace_exact(
    'src/ability-ledger-audit.js',
    "function syncVisibility(){if(ledgerOpen&&!['playing','paused'].includes(state.mode)){hideLedger();openedFromPause=false;}const settingsOpen=!document.querySelector('#settingsScreen')?.classList.contains('hidden'),visible=['playing','paused'].includes(state.mode)&&!settingsOpen&&!ui.hud.classList.contains('hidden');button.classList.toggle('hidden',!visible);pauseButton.classList.toggle('hidden',state.mode!=='paused'||settingsOpen);}",
    "function syncVisibility(){if(ledgerOpen&&!['playing','paused','choice'].includes(state.mode)){hideLedger();openedFromPause=false;openedFromChoice=false;}const settingsOpen=!document.querySelector('#settingsScreen')?.classList.contains('hidden'),visible=['playing','paused','choice'].includes(state.mode)&&!settingsOpen&&!ui.hud.classList.contains('hidden');button.classList.toggle('hidden',!visible);pauseButton.classList.toggle('hidden',state.mode!=='paused'||settingsOpen);}",
    'choice ledger visibility',
)
replace_exact(
    'src/ability-ledger-audit.js',
    "if(!['playing','paused'].includes(state.mode)||!document.querySelector('#settingsScreen')?.classList.contains('hidden'))return;",
    "if(!['playing','paused','choice'].includes(state.mode)||!document.querySelector('#settingsScreen')?.classList.contains('hidden'))return;",
    'allow ledger from choices',
)
replace_exact(
    'src/ability-ledger-audit.js',
    "const wasPaused=state.mode==='paused';renderLedger();ledgerOpen=true;openedFromPause=wasPaused;resumeAfterLedger=!wasPaused;state.mode='paused';",
    "const originMode=state.mode,wasPaused=originMode==='paused',wasChoice=originMode==='choice';renderLedger();ledgerOpen=true;openedFromPause=wasPaused;openedFromChoice=wasChoice;resumeAfterLedger=originMode==='playing';if(wasChoice)ui.choice.classList.add('hidden');state.mode='paused';",
    'pause choice behind ledger',
)
replace_exact(
    'src/ability-ledger-audit.js',
    "hideLedger();if(openedFromPause)ui.pauseScreen.classList.remove('hidden');openedFromPause=false;",
    "hideLedger();if(openedFromPause)ui.pauseScreen.classList.remove('hidden');if(openedFromChoice)ui.choice.classList.remove('hidden');openedFromPause=false;openedFromChoice=false;",
    'restore choice on ledger error',
)
replace_exact(
    'src/ability-ledger-audit.js',
    "function closeLedger(force=false){const restorePause=openedFromPause&&state.mode==='paused',resume=resumeAfterLedger;hideLedger();openedFromPause=false;resumeAfterLedger=false;if(!force){if(restorePause)ui.pauseScreen.classList.remove('hidden');else{if(resume&&state.mode==='paused')state.mode='playing';if(state.mode==='playing'&&compact())ui.touch.classList.remove('hidden');}updateHUD();}syncVisibility();}",
    "function closeLedger(force=false){const restorePause=openedFromPause&&state.mode==='paused',restoreChoice=openedFromChoice&&state.mode==='paused',resume=resumeAfterLedger;hideLedger();openedFromPause=false;openedFromChoice=false;resumeAfterLedger=false;if(!force){if(restorePause)ui.pauseScreen.classList.remove('hidden');else if(restoreChoice){state.mode='choice';ui.choice.classList.remove('hidden');}else{if(resume&&state.mode==='paused')state.mode='playing';if(state.mode==='playing'&&compact())ui.touch.classList.remove('hidden');}updateHUD();}syncVisibility();}",
    'restore choice after ledger',
)
replace_exact(
    'src/ability-ledger-audit.js',
    "window.resetAbilityLedger=()=>{hideLedger();openedFromPause=false;resumeAfterLedger=false;queueMicrotask(updateButton);};",
    "window.resetAbilityLedger=()=>{hideLedger();openedFromPause=false;openedFromChoice=false;resumeAfterLedger=false;queueMicrotask(updateButton);};",
    'reset choice ledger state',
)

replace_exact(
    'src/performance-guard.js',
    """  function drawEliteEdgeIndicator(px,py,e){
    const cx=vw/2,cy=vh/2,dx=px-cx,dy=py-cy,margin=72,bottom=vh-150,scales=[];
    if(dx>0)scales.push((vw-margin-cx)/dx);else if(dx<0)scales.push((margin-cx)/dx);if(dy>0)scales.push((bottom-cy)/dy);else if(dy<0)scales.push((margin-cy)/dy);
    const scale=Math.min(...scales.filter(v=>v>0)),x=cx+dx*scale,y=cy+dy*scale,a=Math.atan2(dy,dx);ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=e.kind==='apex'?'#fff0a8':e.kind==='void'||e.eventKind==='void'?'#c38cff':e.type==='boss'?'#ff78bd':'#8fdcff';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-7);ctx.lineTo(-5,0);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.restore();
  }""",
    """  function drawEliteEdgeIndicator(px,py,e){
    const cx=vw/2,cy=vh/2,dx=px-cx,dy=py-cy,margin=82,bottom=vh-154,scales=[];
    if(dx>0)scales.push((vw-margin-cx)/dx);else if(dx<0)scales.push((margin-cx)/dx);if(dy>0)scales.push((bottom-cy)/dy);else if(dy<0)scales.push((margin-cy)/dy);
    const scale=Math.min(...scales.filter(v=>v>0)),x=cx+dx*scale,y=cy+dy*scale,a=Math.atan2(dy,dx),color=e.kind==='apex'?'#fff0a8':e.kind==='void'||e.eventKind==='void'?'#c38cff':e.type==='boss'?'#ff78bd':'#8fdcff',tag=e.kind==='apex'?'APEX':e.type==='boss'?'BOSS':'MINI',name=bossDisplayName(e);
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.shadowBlur=22;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(-11,-10);ctx.lineTo(-5,0);ctx.lineTo(-11,10);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-4,-4);ctx.lineTo(-1,0);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();
    ctx.save();ctx.font='800 9px IBM Plex Sans KR,sans-serif';const label=`${tag} · ${name}`,w=Math.min(176,Math.max(74,ctx.measureText(label).width+18)),lx=clamp(x-w/2,8,vw-w-8),ly=clamp(y+16,8,vh-28);ctx.fillStyle='rgba(3,7,19,.88)';ctx.fillRect(lx,ly,w,20);ctx.fillStyle=color;ctx.fillRect(lx,ly,3,20);ctx.fillStyle='#f4f8ff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,lx+w/2,ly+10,w-10);ctx.restore();
  }""",
    'elite edge labels',
)

replace_exact(
    'src/dark-cosmic-polish.js',
    "else{const cx=vw/2,cy=vh/2,dx=p.x-cx,dy=p.y-cy,a=Math.atan2(dy,dx),margin=46,scale=Math.min((vw/2-margin)/Math.max(1,Math.abs(dx)),(vh/2-margin)/Math.max(1,Math.abs(dy))),x=cx+dx*scale,y=cy+dy*scale;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=colors[marker.type]||'#fff';ctx.shadowBlur=18;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-10,-9);ctx.lineTo(-5,0);ctx.lineTo(-10,9);ctx.closePath();ctx.fill();ctx.restore();}",
    "else{const cx=vw/2,cy=vh/2,dx=p.x-cx,dy=p.y-cy,a=Math.atan2(dy,dx),margin=58,scale=Math.min((vw/2-margin)/Math.max(1,Math.abs(dx)),(vh/2-margin)/Math.max(1,Math.abs(dy))),x=cx+dx*scale,y=cy+dy*scale,color=colors[marker.type]||'#fff',short=marker.type==='void'?'VOID':marker.type==='crash'?'SHIP':'VAULT';ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=color;ctx.shadowBlur=24;ctx.shadowColor=color;ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(-12,-11);ctx.lineTo(-5,0);ctx.lineTo(-12,11);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-4,-4);ctx.lineTo(-1,0);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();ctx.save();ctx.font='900 8px IBM Plex Sans KR,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';const w=46,lx=clamp(x-w/2,5,vw-w-5),ly=clamp(y+15,5,vh-23);ctx.fillStyle='rgba(2,7,18,.86)';ctx.fillRect(lx,ly,w,18);ctx.fillStyle=color;ctx.fillText(short,lx+w/2,ly+9);ctx.restore();}",
    'event edge arrows',
)

smoke_path = 'scripts/browser-smoke.mjs'
smoke = read(smoke_path)
needle = '\n  const malformed=await malformedChecks(page);'
if smoke.count(needle) != 1:
    raise SystemExit(f'browser smoke insertion point count: {smoke.count(needle)}')
block = r'''
  const gameplayPolish=await evaluate(page,`(()=>{
    resetGame();state.spawnTimer=9999;state.encounterTimer=9999;openChoices();const choiceBefore={mode:state.mode,hidden:ui.choice.classList.contains('hidden')};toggleAbilityLedger();const ledgerFromChoice={open:isAbilityLedgerOpen(),mode:state.mode,choiceHidden:ui.choice.classList.contains('hidden')};closeAbilityLedger();const choiceAfter={mode:state.mode,hidden:ui.choice.classList.contains('hidden')};
    const profiles=window.stackfallDifficultyProfiles,selected=state.selectedDifficulty,missingAugments=Object.keys(WEAPONS).filter(key=>!window.stackfallWeaponAugmentDefs?.[key]);
    state.entities.enemies.length=0;state.entities.curves.length=0;state.weaponStacks.arc=1;state.weaponAugments.arc=true;const victim={id:state.nextId++,type:'grunt',kind:'normal',x:80,y:0,r:12,hp:1,maxHp:1,speed:0,damage:0,color:'#fff',xp:0,dead:false,hit:0},target={id:state.nextId++,type:'grunt',kind:'normal',x:190,y:20,r:12,hp:100,maxHp:100,speed:0,damage:0,color:'#fff',xp:0,dead:false,hit:0};state.entities.enemies.push(victim,target);const beforeCurves=state.entities.curves.length;killEnemy(victim,{source:'arc'});const arcRicochet=state.entities.curves.length>beforeCurves&&state.entities.curves.some(curve=>curve.ricochet);
    state.selectedDifficulty='normal';const normal=enemyConfig('grunt');state.selectedDifficulty='easy';const easy=enemyConfig('grunt');state.selectedDifficulty='hard';const hard=enemyConfig('grunt');state.selectedDifficulty=selected;resetGame();
    return{choiceBefore,ledgerFromChoice,choiceAfter,profiles,missingAugments,arcRicochet,hp:{easy:easy.hp,normal:normal.hp,hard:hard.hp},difficultyButtons:document.querySelectorAll('.difficulty-option').length};
  })()`);scenario.observations.gameplayPolish=gameplayPolish;check(gameplayPolish.choiceBefore.mode==='choice'&&!gameplayPolish.choiceBefore.hidden&&gameplayPolish.ledgerFromChoice.open&&gameplayPolish.ledgerFromChoice.mode==='paused'&&gameplayPolish.ledgerFromChoice.choiceHidden&&gameplayPolish.choiceAfter.mode==='choice'&&!gameplayPolish.choiceAfter.hidden,'ability ledger did not pause and restore level-up choice',page.name);check(gameplayPolish.difficultyButtons===3&&gameplayPolish.hp.easy<gameplayPolish.hp.normal&&gameplayPolish.hp.normal<gameplayPolish.hp.hard,'difficulty profiles or selector are invalid',page.name);check(gameplayPolish.missingAugments.length===0,`weapon augment coverage missing: ${gameplayPolish.missingAugments.join(', ')}`,page.name);check(gameplayPolish.arcRicochet,'arc kill ricochet augment did not create a boomerang',page.name);
'''
write(smoke_path, smoke.replace(needle, block + needle, 1))

replace_exact(
    'scripts/polish-contract-check.mjs',
    "['site manifest',read('index.html').includes('site.webmanifest')]",
    """['site manifest',read('index.html').includes('site.webmanifest')],
['difficulty selector module',read('index.html').includes('difficulty-augment-expansion.js')&&read('src/difficulty-augment-expansion.js').includes(\"normal:Object.freeze({key:'normal'\")],
['level choice ledger access',read('src/ability-ledger-audit.js').includes(\"['playing','paused','choice']\")&&read('src/ability-ledger-audit.js').includes('restoreChoice')],
['reduced ranged spawn chance',read('src/systems-base.js').includes('clamp((t-55)/650,0,.13)')],
['ion chain distance buff',read('src/weapons.js').includes('range=190+ionN*26')],
['random reward notice extended',read('src/map-event-expansion.js').includes('scheduleUiAction(4900')&&read('src/reward-refinement.js').includes('scheduleUiAction(4800')],
['all weapon augment definitions',read('src/reward-refinement.js').includes('window.stackfallWeaponAugmentDefs=augmentDefs')&&['ion','nova','drone','rail','spiral','mirror'].every(key=>read('src/reward-refinement.js').includes(`${key}:{icon:`))],
['arc ricochet source tags',read('src/systems.js').includes(\"p.ricochet?'arc-ricochet':'arc'\")],
['solid elite name indicators',read('src/performance-guard.js').includes(\"tag=e.kind==='apex'?'APEX':e.type==='boss'?'BOSS':'MINI'\")]""",
    'gameplay contract coverage',
)

append_once('README.md', '## Difficulty and weapon augment audit', '''
## Difficulty and weapon augment audit

- The main menu offers Easy, Normal, and Hard. Normal is the reference balance; the current reference enemy health curve is reduced by 8% before difficulty modifiers.
- Ranged enemies begin appearing later and their normal-mode share is capped below the previous value.
- Every weapon, including Ion Chain, Nova Pulse, Meteor Drones, Rail, Galactic Spiral, and Reflector, has a dedicated boss-reward augment. Nebula Boomerang kills can leap from the defeated target to a random nearby enemy.
- The ability ledger can be opened while a level-up choice is waiting. Combat remains paused and the same choice cards are restored on close.
- Random upgrade notices remain visible two seconds longer, and off-screen event/elite indicators use stronger arrows plus compact solid nameplates.
''')

append_once('docs/GAME_DESIGN.md', '## 18. Difficulty, reward readability, and augment identity', '''
## 18. Difficulty, reward readability, and augment identity

Normal is the canonical tuning target. Its enemy health is 92% of the previous reference curve; Easy and Hard apply explicit health, damage, speed, and ranged-enemy modifiers around Normal. The difficulty selection is made on the main screen and persists locally.

All 15 weapon families have one boss-reward augment with a weapon-specific behavior. The six late arsenal families use a second ion network, a reversing nova implosion, a marked meteor strike, delayed rail-path fractures, a counter-rotating spiral, and twin reflected rays. Nebula Boomerang's augment also launches a real curved ricochet from a defeated enemy toward a random nearby target.

The ability ledger is a non-destructive inspection layer during level-up selection: opening it hides but does not reroll or consume the pending cards. Closing it restores the exact choice state.
''')

append_once('docs/WIKI.md', '## 난이도와 무기 특수효과', '''
## 난이도와 무기 특수효과

- **쉬움**: 적 체력·피해·속도가 낮고 원거리 적 비중도 줄어듭니다.
- **보통**: 모든 밸런스 설명의 기준 난이도입니다.
- **어려움**: 적 체력·피해·속도와 원거리 적 비중이 증가합니다.

모든 무기에는 보스 보상으로 얻는 고유 특수효과가 하나씩 존재합니다. 성운 부메랑의 **포식 궤도**는 부메랑으로 적을 처치하면 그 위치에서 무작위 주변 적을 향해 추가 부메랑을 튕깁니다. 이온 사슬은 기본 연결 거리가 늘었고, **초전도 성좌망**을 얻으면 약한 두 번째 사슬망이 이어집니다.

레벨업 선택 화면에서도 `I` 또는 `Tab`으로 능력창을 열 수 있습니다. 능력창을 닫으면 이전의 세 선택지가 그대로 복원됩니다.
''')

print('Applied difficulty, augment, ledger, readability, and balance expansion.')
