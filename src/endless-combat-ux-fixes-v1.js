(()=>{
  'use strict';
  if(window.stackfallEndlessCombatUxV1)return;

  const RANGED_LIVE_CAP={desktop:5,compact:4};
  const RANGED_SPAWN_GAP=1.8;
  const RANGED_KILL_COOLDOWN=3.2;
  const OMEGA_FLARE_DAMAGE_SCALE=.42;
  let lastRangedSpawnAt=-Infinity;
  let rangedBlockedUntil=0;

  const runClock=()=>Math.max(0,Number(state.runTime ?? state.time)||0);
  const isCompact=()=>typeof compactDevice==='function'?compactDevice():innerWidth<760;
  const isEndless=()=>typeof window.stackfallIsEndlessRun==='function'?window.stackfallIsEndlessRun():true;
  const ordinaryRanged=e=>!!(e&&!e.dead&&e.type==='ranged'&&(e.kind==='normal'||!e.kind)&&!e.eventKind&&!e.stageEncounter);
  const liveRangedCount=()=>state.entities.enemies.reduce((count,e)=>count+(ordinaryRanged(e)?1:0),0);
  const rangedCap=()=>isCompact()?RANGED_LIVE_CAP.compact:RANGED_LIVE_CAP.desktop;

  function convertRangedToGrunt(enemy){
    if(!enemy||enemy.type!=='ranged')return enemy;
    const cfg=enemyConfig('grunt'),t=runClock(),threat=1+Math.floor(t/60),speedScale=1+Math.min(.55,t/1500)+Math.min(.20,Math.max(0,threat-1)*.012);
    enemy.type='grunt';enemy.name=cfg.name;enemy.r=cfg.r;enemy.hp=enemy.maxHp=cfg.hp;enemy.speed=cfg.speed*speedScale;enemy.damage=cfg.damage;enemy.color=cfg.color;enemy.xp=cfg.xp;enemy.rangedCd=999;
    return enemy;
  }

  const baseSpawnEnemy=spawnEnemy;
  spawnEnemy=function spawnEnemyWithRangedBreathingRoom(kind='normal'){
    const enemy=baseSpawnEnemy(...arguments);
    if(!enemy||kind!=='normal'||!isEndless()||state.mapEventActive||enemy.type!=='ranged')return enemy;
    const now=runClock(),blocked=now<rangedBlockedUntil||now-lastRangedSpawnAt<RANGED_SPAWN_GAP||liveRangedCount()>rangedCap();
    if(blocked)return convertRangedToGrunt(enemy);
    lastRangedSpawnAt=now;return enemy;
  };

  const baseKillEnemy=killEnemy;
  killEnemy=function killEnemyWithRangedRespawnDelay(enemy,opts={}){
    const wasAlive=!!(enemy&&!enemy.dead),wasRanged=ordinaryRanged(enemy),result=baseKillEnemy(enemy,opts);
    if(wasAlive&&wasRanged&&enemy?.dead&&isEndless())rangedBlockedUntil=Math.max(rangedBlockedUntil,runClock()+RANGED_KILL_COOLDOWN);
    return result;
  };

  const baseResetGame=resetGame;
  resetGame=function resetGameWithRangedBreathingRoom(){lastRangedSpawnAt=-Infinity;rangedBlockedUntil=0;return baseResetGame(...arguments);};

  function eventGuideFrame(){
    const landscape=vw>=vh;
    if(landscape){
      const side=clamp(vw*.24,190,320),top=clamp(vh*.24,100,170),bottomGap=clamp(vh*.34,150,240);
      return{left:side,right:vw-side,top,bottom:vh-bottomGap};
    }
    const side=clamp(vw*.18,76,112),top=clamp(vh*.16,90,132),bottomGap=isCompact()?210:176;
    return{left:side,right:vw-side,top,bottom:vh-bottomGap};
  }
  function eventGuidePoint(dx,dy){
    const cx=vw/2,cy=vh/2,{left,right,top,bottom}=eventGuideFrame();let scale=Infinity;
    if(dx>0)scale=Math.min(scale,(right-cx)/dx);else if(dx<0)scale=Math.min(scale,(left-cx)/dx);
    if(dy>0)scale=Math.min(scale,(bottom-cy)/dy);else if(dy<0)scale=Math.min(scale,(top-cy)/dy);
    if(!Number.isFinite(scale)||scale<=0)scale=1;return{x:cx+dx*scale,y:cy+dy*scale};
  }
  function eventGuideMeta(type){
    const ko=(GAME_SETTINGS?.language||'ko')==='ko';
    const rows={
      void:['#b36bff','◉',ko?'공허':'VOID'],crash:['#ff9a62','⌁',ko?'우주선':'SHIP'],distress:['#7ce8ff','✚',ko?'구조':'SOS'],meteor:['#ffd06f','◆',ko?'광맥':'ORE'],predator:['#d47dff','✺',ko?'포식':'FEED'],relay:['#70e7ef','⌁',ko?'중계':'RELAY'],storm:['#9fb4ff','◌',ko?'폭풍':'EYE'],vault:['#75eaff','◇',ko?'보관소':'VAULT']
    };
    const [color,icon,short]=rows[type]||rows.vault;return{color,icon,short};
  }
  function drawCloserEventGuide(marker){
    if(!marker||marker.consumed)return;const p=worldToScreen(marker.x,marker.y),dx=p.x-vw/2,dy=p.y-vh/2,a=Math.atan2(dy,dx),edge=eventGuidePoint(dx,dy),m=eventGuideMeta(marker.type),pulse=1+Math.sin(performance.now()/210)*.08;
    ctx.save();ctx.translate(edge.x,edge.y);ctx.rotate(a);ctx.scale(pulse,pulse);ctx.fillStyle=m.color;ctx.shadowBlur=30;ctx.shadowColor=m.color;ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(-13,-12);ctx.lineTo(-6,0);ctx.lineTo(-13,12);ctx.closePath();ctx.fill();ctx.restore();
    ctx.save();ctx.font='900 11px "IBM Plex Sans KR",sans-serif';ctx.textAlign=edge.x<vw/2?'left':'right';ctx.textBaseline='middle';const label=`${m.icon} ${m.short} · ${Math.round(Math.hypot(marker.x-player.x,marker.y-player.y))}`;const w=ctx.measureText(label).width+20,x=edge.x+(edge.x<vw/2?31:-31);ctx.fillStyle='rgba(4,7,19,.92)';ctx.beginPath();ctx.roundRect(edge.x<vw/2?x-9:x-w+9,edge.y-12,w,24,9);ctx.fill();ctx.fillStyle=m.color;ctx.shadowBlur=12;ctx.shadowColor=m.color;ctx.fillText(label,x,edge.y);ctx.restore();
  }

  const baseDrawMapEvents=typeof drawMapEvents==='function'?drawMapEvents:null;
  if(baseDrawMapEvents){
    drawMapEvents=function drawMapEventsWithCloserGuide(){
      if(state.mapEventActive)return baseDrawMapEvents();
      const original=state.entities.mapEvents||[];if(!original.length)return baseDrawMapEvents();
      const frame=eventGuideFrame(),inside=[],outside=[];
      for(const marker of original){if(!marker||marker.consumed)continue;const p=worldToScreen(marker.x,marker.y),on=p.x>frame.left&&p.x<frame.right&&p.y>frame.top&&p.y<frame.bottom;(on?inside:outside).push(marker);}
      state.entities.mapEvents=inside;try{baseDrawMapEvents();}finally{state.entities.mapEvents=original;}
      for(const marker of outside)drawCloserEventGuide(marker);
    };
    window.drawMapEvents=drawMapEvents;
  }

  const baseApexVariantAttack=typeof apexVariantAttack==='function'?apexVariantAttack:null;
  if(baseApexVariantAttack){
    apexVariantAttack=function apexVariantAttackWithFairOmegaFlare(enemy,phase){
      const isOmega=(enemy?.apexForm||enemy?.eliteForm)==='starforge';if(!isOmega)return baseApexVariantAttack(...arguments);
      const before=new Set(state.entities.telegraphs||[]),result=baseApexVariantAttack(...arguments);
      for(const telegraph of state.entities.telegraphs||[])if(!before.has(telegraph)&&telegraph?.impactStyle==='apex-id:forge-flare')telegraph.damage=Math.max(0,(Number(telegraph.damage)||0)*OMEGA_FLARE_DAMAGE_SCALE);
      return result;
    };
  }

  const COPY_REPLACEMENTS=Object.freeze([
    ['미니어처 항성 · 추적 광선 · 방사형 관통탄 · 붕괴 폭발','동력핵 융합 · 상시 연소 · 충전 후 전방위 지속 광선'],
    ['살아 있는 성좌망 · 지속 절단 · 적 탄환 삭제 · 노드 포격','무명의 천구 · 성좌 재구성 · 동시 절단 · 적 탄환 삭제 · 천구 붕괴'],
    ['미니어처 항성: 공전 항성이 추적 광선·방사탄·붕괴 폭발을 반복한다.','동력핵 융합: 항성핵을 융합해 상시 연소하며, 주기적으로 충전 후 전방위 지속 광선을 발사한다.'],
    ['살아 있는 성좌망: 공격선을 연결해 적을 절단하고 적 탄환을 지운다.','무명의 천구: 성좌를 계속 재구성해 연결선을 동시에 절단하고 적 탄환을 지운 뒤 천구 붕괴를 반복한다.'],
    ['미니어처 항성','동력핵 융합'],['살아 있는 성좌망','무명의 천구']
  ]);
  function replacePlayerText(root){
    if(!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){let next=node.nodeValue||'';for(const[from,to]of COPY_REPLACEMENTS)if(next.includes(from))next=next.split(from).join(to);if(next!==node.nodeValue)node.nodeValue=next;}
  }
  function rewardLabel(item){
    const ko=(GAME_SETTINGS?.language||'ko')==='ko';
    if(item.type==='unlock_weapon'){const name=typeof weaponText==='function'?weaponText(item.key)?.name:WEAPONS?.[item.key]?.name;return ko?`${name||item.key} 해금`:`Unlock ${name||item.key}`;}
    if(item.type==='unlock_feature'){const name=window.stackfallFeatureName?.(item.key)||item.key;return ko?`${name} 해금`:`Unlock ${name}`;}
    if(item.type==='currency'){const name=item.key==='coreShard'?(ko?'코어 조각':'Core Shard'):(ko?'성진':'Stardust');return`${name} +${Math.max(1,Math.floor(Number(item.amount)||1)).toLocaleString()}`;}
    return ko?'보상':'Reward';
  }
  function patchAchievementRewards(){
    const rows=window.stackfallEndlessProgression?.achievements||[],cards=[...document.querySelectorAll('#achievementScreen .achievement-row')],ko=(GAME_SETTINGS?.language||'ko')==='ko';
    cards.forEach((card,index)=>{const row=rows[index],small=card.querySelector('.achievement-copy>small');if(!row||!small)return;const next=`${ko?'보상':'Reward'} · ${(row.rewards||[]).map(rewardLabel).join(' · ')}`;if(small.textContent!==next)small.textContent=next;});
  }
  function patchPlayerCopy(){
    for(const selector of['#abilityLedgerScreen','#apexRewardScreen','#resonanceBanner'])replacePlayerText(document.querySelector(selector));
    patchAchievementRewards();
  }
  let copyPatchQueued=false;
  function queueCopyPatch(){if(copyPatchQueued)return;copyPatchQueued=true;queueMicrotask(()=>{copyPatchQueued=false;patchPlayerCopy();});}
  for(const selector of['#achievementScreen','#abilityLedgerScreen','#apexRewardScreen','#resonanceBanner']){const root=document.querySelector(selector);if(root)new MutationObserver(queueCopyPatch).observe(root,{subtree:true,childList:true,characterData:true});}

  const baseApplyLanguage=applyLanguage;
  applyLanguage=function applyLanguageWithPlayerCopyFix(){const result=baseApplyLanguage(...arguments);queueCopyPatch();return result;};
  const baseOpenApexRewardSelection=window.openApexRewardSelection;
  if(typeof baseOpenApexRewardSelection==='function')window.openApexRewardSelection=function openApexRewardWithCurrentCopy(){const result=baseOpenApexRewardSelection(...arguments);queueCopyPatch();return result;};
  const baseApplyApexReward=typeof applyApexReward==='function'?applyApexReward:null;
  if(baseApplyApexReward)applyApexReward=function applyApexRewardWithCurrentCopy(form){const result=baseApplyApexReward(...arguments);if(form==='starforge')ui.resonanceDesc.textContent='동력핵 융합: 항성핵을 융합해 상시 연소하며, 주기적으로 충전 후 전방위 지속 광선을 발사한다.';else if(form==='lastconstellation')ui.resonanceDesc.textContent='무명의 천구: 성좌를 계속 재구성해 연결선을 동시에 절단하고 적 탄환을 지운 뒤 천구 붕괴를 반복한다.';return result;};

  const FORBIDDEN_PLAYER_COPY=Object.freeze(['개발 로그','개발자 문구','디버그 문구','내부 구현','작업 메모','임시 문구','테스트용 문구','TMI','developer log','debug prose','implementation note','internal id']);
  window.stackfallPlayerFacingCopyAudit=()=>{
    const roots=['#menu','#settingsScreen','#profileScreen','#achievementScreen','#abilityLedgerScreen','#bossRewardScreen','#apexRewardScreen','#gameOverScreen','#stageCompleteScreen','#resonanceBanner'].map(selector=>document.querySelector(selector)).filter(Boolean),text=roots.map(root=>root.textContent||'').join('\n').toLowerCase();
    return FORBIDDEN_PLAYER_COPY.filter(token=>text.includes(token.toLowerCase()));
  };
  window.stackfallEventGuideFrameV2=eventGuideFrame;
  window.stackfallEventGuidePointV2=eventGuidePoint;
  window.stackfallEndlessCombatUxV1=Object.freeze({rangedSpawnGap:RANGED_SPAWN_GAP,rangedKillCooldown:RANGED_KILL_COOLDOWN,rangedCapDesktop:RANGED_LIVE_CAP.desktop,rangedCapCompact:RANGED_LIVE_CAP.compact,omegaFlareDamageScale:OMEGA_FLARE_DAMAGE_SCALE});
  patchPlayerCopy();
})();