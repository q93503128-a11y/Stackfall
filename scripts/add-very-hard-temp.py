from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, got {count}: {old[:140]!r}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')


# Register Very Hard as an achievement-granted permanent feature.
replace_once(
    'src/meta-progression.js',
    "    hard:Object.freeze({ko:'어려움 난이도',en:'Hard Difficulty'}),",
    "    hard:Object.freeze({ko:'어려움 난이도',en:'Hard Difficulty'}),\n    'very-hard':Object.freeze({ko:'매우 어려움 난이도',en:'Very Hard Difficulty',ja:'非常に難しい難易度','zh-CN':'非常困难',es:'Dificultad muy difícil',fr:'Difficulté très difficile'}),",
)

# Hard: modest post-upgrade bump. Very Hard: mostly HP/damage, limited speed inflation.
replace_once(
    'src/difficulty-augment-expansion.js',
    "    hard:Object.freeze({key:'hard',enemyHp:1.32,enemyDamage:1.30,enemySpeed:1.12,rangedChance:1.28,rewardMultiplier:1.30})",
    "    hard:Object.freeze({key:'hard',enemyHp:1.42,enemyDamage:1.36,enemySpeed:1.14,rangedChance:1.35,rewardMultiplier:1.40}),\n    'very-hard':Object.freeze({key:'very-hard',enemyHp:1.80,enemyDamage:1.60,enemySpeed:1.20,rangedChance:1.55,rewardMultiplier:1.70})",
)
replace_once(
    'src/difficulty-augment-expansion.js',
    "  state.selectedDifficulty=profiles[state.selectedDifficulty]?state.selectedDifficulty:profiles[saved]?saved:'normal';if(state.selectedDifficulty==='hard'&&window.stackfallIsFeatureUnlocked?.('hard')===false)state.selectedDifficulty='normal';",
    "  const difficultyFeatureKey=key=>key==='hard'?'hard':key==='very-hard'?'very-hard':null;\n  const difficultyUnlocked=key=>{const feature=difficultyFeatureKey(key);return !feature||window.stackfallIsFeatureUnlocked?.(feature)!==false;};\n  state.selectedDifficulty=profiles[state.selectedDifficulty]?state.selectedDifficulty:profiles[saved]?saved:'normal';if(!difficultyUnlocked(state.selectedDifficulty))state.selectedDifficulty='normal';",
)

copy_replacements = {
    "ko:{title:'난이도',easy:['쉬움','적 체력·피해 감소 · 성진 -15%'],normal:['보통','기준 난이도 · 성진 100%'],hard:['어려움','더 강하고 빠른 적 · 성진 +30%']}": "ko:{title:'난이도',easy:['쉬움','적 체력·피해 감소 · 성진 -15%'],normal:['보통','기준 난이도 · 성진 100%'],hard:['어려움','강화된 적 · 성진 +40%'],'very-hard':['매우 어려움','고강도 적 강화 · 성진 +70%']}",
    "en:{title:'DIFFICULTY',easy:['EASY','Lower enemy health and damage · Stardust -15%'],normal:['NORMAL','Baseline difficulty · Stardust 100%'],hard:['HARD','Stronger and faster enemies · Stardust +30%']}": "en:{title:'DIFFICULTY',easy:['EASY','Lower enemy health and damage · Stardust -15%'],normal:['NORMAL','Baseline difficulty · Stardust 100%'],hard:['HARD','Stronger enemies · Stardust +40%'],'very-hard':['VERY HARD','High-pressure enemies · Stardust +70%']}",
    "ja:{title:'難易度',easy:['簡単','敵が弱化 · スターダスト -15%'],normal:['普通','基準難易度 · スターダスト 100%'],hard:['難しい','敵が強化 · スターダスト +30%']}": "ja:{title:'難易度',easy:['簡単','敵が弱化 · スターダスト -15%'],normal:['普通','基準難易度 · スターダスト 100%'],hard:['難しい','敵が強化 · スターダスト +40%'],'very-hard':['非常に難しい','敵が大幅強化 · スターダスト +70%']}",
    "'zh-CN':{title:'难度',easy:['简单','敌人较弱 · 星尘 -15%'],normal:['普通','标准难度 · 星尘 100%'],hard:['困难','敌人更强更快 · 星尘 +30%']}": "'zh-CN':{title:'难度',easy:['简单','敌人较弱 · 星尘 -15%'],normal:['普通','标准难度 · 星尘 100%'],hard:['困难','敌人强化 · 星尘 +40%'],'very-hard':['非常困难','敌人大幅强化 · 星尘 +70%']}",
    "es:{title:'DIFICULTAD',easy:['FÁCIL','Enemigos más débiles · Polvo estelar -15%'],normal:['NORMAL','Dificultad base · Polvo estelar 100%'],hard:['DIFÍCIL','Enemigos más fuertes · Polvo estelar +30%']}": "es:{title:'DIFICULTAD',easy:['FÁCIL','Enemigos más débiles · Polvo estelar -15%'],normal:['NORMAL','Dificultad base · Polvo estelar 100%'],hard:['DIFÍCIL','Enemigos reforzados · Polvo estelar +40%'],'very-hard':['MUY DIFÍCIL','Enemigos muy reforzados · Polvo estelar +70%']}",
    "fr:{title:'DIFFICULTÉ',easy:['FACILE','Ennemis affaiblis · Poussière -15 %'],normal:['NORMAL','Difficulté de base · Poussière 100 %'],hard:['DIFFICILE','Ennemis renforcés · Poussière +30 %']}": "fr:{title:'DIFFICULTÉ',easy:['FACILE','Ennemis affaiblis · Poussière -15 %'],normal:['NORMAL','Difficulté de base · Poussière 100 %'],hard:['DIFFICILE','Ennemis renforcés · Poussière +40 %'],'very-hard':['TRÈS DIFFICILE','Ennemis fortement renforcés · Poussière +70 %']}",
}
for old, new in copy_replacements.items():
    replace_once('src/difficulty-augment-expansion.js', old, new)

replace_once(
    'src/difficulty-augment-expansion.js',
    '.difficulty-options{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}',
    '.difficulty-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}',
)
replace_once(
    'src/difficulty-augment-expansion.js',
    '@media(max-width:680px){.difficulty-picker{grid-template-columns:1fr}.difficulty-copy{min-width:0}.difficulty-options{gap:5px}.difficulty-option{min-height:42px}}',
    '@media(max-width:680px){.difficulty-picker{grid-template-columns:1fr}.difficulty-copy{min-width:0}.difficulty-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.difficulty-option{min-height:42px}}',
)
replace_once(
    'src/difficulty-augment-expansion.js',
    "    const text=difficultyText(),root=document.querySelector('#difficultyOptions'),current=profiles[state.selectedDifficulty]?state.selectedDifficulty:'normal',colors={easy:'#74f2a7',normal:'#7ce8ff',hard:'#ff7b8d'};",
    "    const text=difficultyText(),root=document.querySelector('#difficultyOptions'),current=profiles[state.selectedDifficulty]?state.selectedDifficulty:'normal',colors={easy:'#74f2a7',normal:'#7ce8ff',hard:'#ff7b8d','very-hard':'#c58cff'};",
)
replace_once(
    'src/difficulty-augment-expansion.js',
    "    for(const key of['easy','normal','hard']){const button=document.createElement('button'),locked=key==='hard'&&window.stackfallIsFeatureUnlocked?.('hard')===false;button.type='button';",
    "    for(const key of['easy','normal','hard','very-hard']){const button=document.createElement('button'),featureKey=difficultyFeatureKey(key),locked=!!featureKey&&!difficultyUnlocked(key);button.type='button';",
)
replace_once(
    'src/difficulty-augment-expansion.js',
    "button.innerHTML=`<strong>${text[key][0]}</strong><small>${locked?(window.stackfallFeatureAchievementCondition?.('hard')||'Achievement required'):text[key][1]}</small>`;",
    "button.innerHTML=`<strong>${text[key][0]}</strong><small>${locked?((featureKey&&window.stackfallFeatureAchievementCondition?.(featureKey))||'Achievement required'):text[key][1]}</small>`;",
)

# Very Hard unlock: survive 15 minutes on Hard. Also make every achievement evaluable mid-run.
replace_once(
    'src/endless-progression.js',
    "    Object.freeze({id:'lifetime-kills-1000',weapon:'vacuum',kind:'lifetimeKills',value:1000,test:(run,meta)=>(meta.lifetime?.kills||0)>=1000}),",
    "    Object.freeze({id:'lifetime-kills-1000',weapon:'vacuum',kind:'lifetimeKills',value:1000,test:(run,meta)=>(meta.lifetime?.kills||0)+(run.kills||0)>=1000}),",
)
replace_once(
    'src/endless-progression.js',
    "    Object.freeze({id:'feature-hard',feature:'hard',kind:'apex',value:1,test:(run,meta)=>(meta.bossRecords?.apex||0)>=1}),",
    "    Object.freeze({id:'feature-hard',feature:'hard',kind:'apex',value:1,test:(run,meta)=>(meta.bossRecords?.apex||0)>=1}),\n    Object.freeze({id:'feature-very-hard',feature:'very-hard',kind:'hardSurvive',value:15,test:(run)=>run.difficulty==='hard'&&run.time>=900}),",
)
replace_once(
    'src/endless-progression.js',
    '        bestSurvival:sanitizeNumber(saved.bestSurvival),\n        bestLevel:',
    '        bestSurvival:sanitizeNumber(saved.bestSurvival),\n        bestHardSurvival:sanitizeNumber(saved.bestHardSurvival),\n        bestLevel:',
)
replace_once(
    'src/endless-progression.js',
    '      return{version:2,completed:[],weaponUnlocks:[],featureUnlocks:[],survivalMilestones:[],bestSurvival:0,bestLevel:1,bestCombo:0,bestRunKills:0};',
    '      return{version:2,completed:[],weaponUnlocks:[],featureUnlocks:[],survivalMilestones:[],bestSurvival:0,bestHardSurvival:0,bestLevel:1,bestCombo:0,bestRunKills:0};',
)

for old, new in {
    "ko:{survive:n=>`무한모드 ${n}분 생존`,": "ko:{survive:n=>`무한모드 ${n}분 생존`,hardSurvive:n=>`어려움 난이도에서 ${n}분 생존`,",
    "en:{survive:n=>`Survive ${n}m in Endless`,": "en:{survive:n=>`Survive ${n}m in Endless`,hardSurvive:n=>`Survive ${n}m on Hard`,",
    "ja:{survive:n=>`エンドレスで${n}分生存`,": "ja:{survive:n=>`エンドレスで${n}分生存`,hardSurvive:n=>`難しい難易度で${n}分生存`,",
    "'zh-CN':{survive:n=>`无尽模式生存${n}分钟`,": "'zh-CN':{survive:n=>`无尽模式生存${n}分钟`,hardSurvive:n=>`困难难度生存${n}分钟`,",
    "es:{survive:n=>`Sobrevive ${n} min. en Infinito`,": "es:{survive:n=>`Sobrevive ${n} min. en Infinito`,hardSurvive:n=>`Sobrevive ${n} min. en Difícil`,",
    "fr:{survive:n=>`Survivez ${n} min en Sans fin`,": "fr:{survive:n=>`Survivez ${n} min en Sans fin`,hardSurvive:n=>`Survivez ${n} min en Difficile`,",
}.items():
    replace_once('src/endless-progression.js', old, new)

for old, new in {
    "ko:{stage:'스테이지 모드는 추후 업데이트됩니다.',": "ko:{achievementToast:'업적 달성',stage:'스테이지 모드는 추후 업데이트됩니다.',",
    "en:{stage:'Stage mode will return in a future update.',": "en:{achievementToast:'ACHIEVEMENT COMPLETE',stage:'Stage mode will return in a future update.',",
    "ja:{stage:'ステージモードは今後のアップデートで追加されます。',": "ja:{achievementToast:'実績達成',stage:'ステージモードは今後のアップデートで追加されます。',",
    "'zh-CN':{stage:'关卡模式将在后续更新中开放。',": "'zh-CN':{achievementToast:'成就完成',stage:'关卡模式将在后续更新中开放。',",
    "es:{stage:'El modo Etapas volverá en una futura actualización.',": "es:{achievementToast:'LOGRO COMPLETADO',stage:'El modo Etapas volverá en una futura actualización.',",
    "fr:{stage:'Le mode Étapes reviendra dans une prochaine mise à jour.',": "fr:{achievementToast:'SUCCÈS DÉBLOQUÉ',stage:'Le mode Étapes reviendra dans une prochaine mise à jour.',",
}.items():
    replace_once('src/endless-progression.js', old, new)

replace_once(
    'src/endless-progression.js',
    "  function snapshotRun(){return{time:Math.max(0,Number(state.time)||0),kills:Math.max(0,Math.floor(Number(state.kills)||0)),level:Math.max(1,Math.floor(Number(state.level)||1)),maxCombo:Math.max(0,Math.floor(Number(state.maxCombo)||0))};}",
    "  function snapshotRun(){return{time:Math.max(0,Number(state.time)||0),kills:Math.max(0,Math.floor(Number(state.kills)||0)),level:Math.max(1,Math.floor(Number(state.level)||1)),maxCombo:Math.max(0,Math.floor(Number(state.maxCombo)||0)),difficulty:String(state.selectedDifficulty||'normal')};}",
)
replace_once(
    'src/endless-progression.js',
    '    progress.bestSurvival=Math.max(progress.bestSurvival,run.time);\n    progress.bestLevel=',
    "    progress.bestSurvival=Math.max(progress.bestSurvival,run.time);\n    if(run.difficulty==='hard')progress.bestHardSurvival=Math.max(progress.bestHardSurvival||0,run.time);\n    progress.bestLevel=",
)
replace_once(
    'src/endless-progression.js',
    '  function evaluateAchievements(run){\n    const meta=window.stackfallMeta||{},newUnlocks=[];rememberRunBest(run);',
    '  function evaluateAchievements(run){\n    const meta=window.stackfallMeta||{},newUnlocks=[];let changed=false;rememberRunBest(run);',
)
replace_once(
    'src/endless-progression.js',
    '      progress.completed.push(row.id);\n      if(row.weapon){',
    '      progress.completed.push(row.id);changed=true;\n      if(row.weapon){',
)
replace_once(
    'src/endless-progression.js',
    '    saveProgress();return newUnlocks;\n  }',
    '    if(changed)saveProgress();return newUnlocks;\n  }',
)
replace_once(
    'src/endless-progression.js',
    "      if(row.kind==='survive')return Math.floor(progress.bestSurvival/60);\n      if(row.kind==='level')",
    "      if(row.kind==='survive')return Math.floor(progress.bestSurvival/60);\n      if(row.kind==='hardSurvive')return Math.floor((progress.bestHardSurvival||0)/60);\n      if(row.kind==='level')",
)
replace_once(
    'src/endless-progression.js',
    "      if(row.kind==='lifetimeKills')return Math.floor(meta.lifetime?.kills||0);",
    "      if(row.kind==='lifetimeKills')return Math.floor(meta.lifetime?.kills||0)+(isEndless()&&state.mode==='playing'?Math.max(0,Math.floor(Number(state.kills)||0)):0);",
)

toast_code = """  function ensureAchievementToastRoot(){
    let root=document.querySelector('#achievementToastStack');if(root)return root;
    root=document.createElement('div');root.id='achievementToastStack';root.className='achievement-toast-stack';root.setAttribute('aria-live','polite');root.setAttribute('aria-atomic','false');document.querySelector('#app')?.appendChild(root);return root;
  }
  function showAchievementToasts(rows=[]){
    if(!rows.length)return;const root=ensureAchievementToastRoot();
    for(const row of rows){
      const reward=rewardInfo(row),toast=document.createElement('div');toast.className='achievement-toast';toast.innerHTML=`<i>${reward.icon}</i><div><span>${uiText().achievementToast}</span><strong>${reward.name}</strong><small>${conditionText(row)}</small></div>`;root.appendChild(toast);
      requestAnimationFrame(()=>toast.classList.add('show'));setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),240);},3200);
      while(root.children.length>3)root.firstElementChild?.remove();
    }
    try{audio.pickup();}catch{}
  }
"""
replace_once(
    'src/endless-progression.js',
    '  function renderAchievementUnlocks(rows=[]){\n',
    toast_code + '  function renderAchievementUnlocks(rows=[]){\n',
)

replace_once(
    'src/endless-progression.js',
    "  function refreshLegacyLockCopy(){\n    const hardButton=document.querySelector('.difficulty-option[data-difficulty=\"hard\"]');\n    if(hardButton?.disabled){\n      const small=hardButton.querySelector('small'),condition=featureAchievementCondition('hard');\n      if(small&&condition&&small.textContent!==condition)small.textContent=condition;\n    }",
    "  function refreshLegacyLockCopy(){\n    for(const key of['hard','very-hard']){\n      const button=document.querySelector(`.difficulty-option[data-difficulty=\"${key}\"]`);\n      if(button?.disabled){const small=button.querySelector('small'),condition=featureAchievementCondition(key);if(small&&condition&&small.textContent!==condition)small.textContent=condition;}\n    }",
)

replace_once(
    'src/endless-progression.js',
    '    .endless-achievement-unlocks i{font-style:normal;color:#dffcff}\n    .achievement-screen{',
    '    .endless-achievement-unlocks i{font-style:normal;color:#dffcff}\n    .achievement-toast-stack{position:fixed;right:18px;top:76px;z-index:48;display:grid;gap:8px;width:min(330px,calc(100vw - 28px));pointer-events:none}.achievement-toast{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:center;padding:11px 12px;border:1px solid rgba(143,255,224,.25);border-radius:13px;background:linear-gradient(135deg,rgba(12,34,42,.94),rgba(6,10,25,.94));box-shadow:0 10px 28px rgba(0,0,0,.26),0 0 20px rgba(116,242,167,.08);opacity:0;transform:translateX(20px);transition:opacity .2s ease,transform .2s ease}.achievement-toast.show{opacity:1;transform:translateX(0)}.achievement-toast>i{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(143,255,224,.22);border-radius:10px;background:rgba(116,242,167,.07);color:#dcfff1;font-style:normal;font-size:16px}.achievement-toast>div{min-width:0}.achievement-toast span{display:block;color:#8fffc8;font-size:8px;font-weight:900;letter-spacing:.13em}.achievement-toast strong{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f4fffb;font-size:12px}.achievement-toast small{display:block;margin-top:3px;color:#9eacc6;font-size:8px}.achievement-screen{',
)
replace_once(
    'src/endless-progression.js',
    '    @media(max-width:760px){.achievement-modal{',
    '    @media(max-width:760px){.achievement-toast-stack{right:50%;top:70px;transform:translateX(50%);width:min(320px,calc(100vw - 20px))}.achievement-toast{transform:translateY(-10px)}.achievement-toast.show{transform:translateY(0)}.achievement-modal{',
)

live_wrapper = """  let liveAchievementPoll=0;
  const baseAchievementUpdatePlayer=updatePlayer;
  updatePlayer=function endlessAchievementUpdatePlayer(dt){
    baseAchievementUpdatePlayer(dt);if(state.mode!=='playing'||!isEndless())return;liveAchievementPoll-=dt;if(liveAchievementPoll>0)return;liveAchievementPoll=.4;
    const unlocked=evaluateAchievements(snapshotRun());if(!unlocked.length)return;showAchievementToasts(unlocked);renderAchievementUi();window.renderStackfallMetaUi?.();
  };

"""
replace_once(
    'src/endless-progression.js',
    '  const baseEndGame=endGame;\n',
    live_wrapper + '  const baseEndGame=endGame;\n',
)

replace_once(
    'src/endless-progression.js',
    'window.stackfallEndlessProgression=Object.freeze({storageKey:STORAGE_KEY,progress,achievements:ALL_ACHIEVEMENTS,weaponAchievements:ACHIEVEMENTS,featureAchievements:FEATURE_ACHIEVEMENTS,survivalMilestones:SURVIVAL_MILESTONES,conditionText,featureAchievementCondition,evaluateAchievements,claimSurvivalMilestones,renderStarterOptions:finalRenderStarterOptions,applyStageSeal,renderAchievements:renderAchievementUi,openAchievements});',
    'window.stackfallEndlessProgression=Object.freeze({storageKey:STORAGE_KEY,progress,achievements:ALL_ACHIEVEMENTS,weaponAchievements:ACHIEVEMENTS,featureAchievements:FEATURE_ACHIEVEMENTS,survivalMilestones:SURVIVAL_MILESTONES,conditionText,featureAchievementCondition,evaluateAchievements,claimSurvivalMilestones,renderStarterOptions:finalRenderStarterOptions,applyStageSeal,renderAchievements:renderAchievementUi,openAchievements,showAchievementToasts});',
)
