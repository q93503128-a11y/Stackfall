(function(){
  'use strict';

  if(window.stackfallStarforgeLegacy==='v2')return;
  window.stackfallStarforgeLegacy='v2';

  const MAX_STACKS=3;
  const PROFILES=Object.freeze({
    1:Object.freeze({cooldown:13.5,charge:.48,rays:8,range:1020,halfWidth:16,damageMult:1.00}),
    2:Object.freeze({cooldown:11.5,charge:.50,rays:10,range:1120,halfWidth:19,damageMult:1.45}),
    3:Object.freeze({cooldown:9.5,charge:.52,rays:12,range:1240,halfWidth:22,damageMult:1.90})
  });

  const stacks=()=>Math.max(0,Math.min(MAX_STACKS,Math.floor(Number(state.apexBoons?.starforge)||0)));
  const profileFor=value=>PROFILES[Math.max(1,Math.min(MAX_STACKS,Math.floor(Number(value)||1)))];

  function ensureCoreState(stack){
    const current=state.apexForgeCoreState;
    if(current&&current.stack===stack)return current;
    state.apexForgeCoreState={stack,timer:1.35,charging:false,auraTick:0,pulseTick:0,chargeTick:0};
    return state.apexForgeCoreState;
  }

  function clearLegacyStars(){
    if(Array.isArray(state.apexLegacyStars))state.apexLegacyStars.length=0;
  }

  function emitCoreAura(core,stack,dt){
    const stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
    core.auraTick-=dt;core.pulseTick-=dt;
    if(core.auraTick<=0){
      core.auraTick=stressed?.075:.045;
      const count=stressed?1:2;
      for(let i=0;i<count;i++){
        const a=Math.random()*TAU,r=rand(8,24+stack*4),speed=rand(24,62)+stack*8;
        spawnParticle(player.x+Math.cos(a)*r,player.y+Math.sin(a)*r,i%2?'#ffb04e':'#fff1b0',1,speed,rand(2.6,4.8)+stack*.35);
      }
    }
    if(core.pulseTick<=0){
      core.pulseTick=.72;
      shockwave(player.x,player.y,stack>=3?'#fff3c4':'#ffb04e',58+stack*10,.26,1.35+stack*.22);
    }
  }

  function beginCharge(core,profile,stack){
    if(core.charging)return;
    core.charging=true;core.chargeTick=0;
    state.camera.shake=Math.max(state.camera.shake,5.5+stack*1.2);
    shockwave(player.x,player.y,'#ffb04e',88+stack*12,profile.charge,2.2+stack*.25);
    if(typeof audio?.tone==='function'){
      audio.tone(94+stack*12,profile.charge,'sawtooth',.022,170+stack*35);
      audio.tone(310+stack*45,profile.charge*.72,'sine',.012,220);
    }
  }

  function updateChargeVisual(core,stack,dt){
    core.chargeTick-=dt;
    if(core.chargeTick>0)return;
    core.chargeTick=.07;
    const stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
    const count=stressed?3:6;
    for(let i=0;i<count;i++){
      const a=Math.random()*TAU,r=rand(52,92+stack*8);
      const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;
      spawnBeamEffect(x,y,player.x,player.y,.08,i%2?'#ffb04e':'#fff4d4',1.2+stack*.18);
    }
  }

  function fireRadialCoreBurst(stack,profile){
    const hitIds=new Set(),baseAngle=(state.time||0)*.17,damage=(38+state.level*1.45)*profile.damageMult;
    const outerWidth=profile.halfWidth*2.35,innerWidth=Math.max(3,profile.halfWidth*.42);
    for(let i=0;i<profile.rays;i++){
      const angle=baseAngle+i/profile.rays*TAU,ux=Math.cos(angle),uy=Math.sin(angle);
      const x1=player.x+ux*18,y1=player.y+uy*18,x2=player.x+ux*profile.range,y2=player.y+uy*profile.range;
      spawnBeamEffect(x1,y1,x2,y2,.19,'#ff9a36',outerWidth);
      spawnBeamEffect(x1,y1,x2,y2,.14,'#fff7dc',innerWidth);
      for(const enemy of state.entities.enemies||[]){
        if(!enemy||enemy.dead||hitIds.has(enemy.id))continue;
        if(segmentDistance(enemy.x,enemy.y,x1,y1,x2,y2)<=enemy.r+profile.halfWidth){
          hitIds.add(enemy.id);
          dealDamage(enemy,damage,{color:'#fff0a8',source:'apex-forge-core-ray',canCrit:false});
          spawnParticle(enemy.x,enemy.y,'#fff4d4',stack>=3?7:5,110+stack*18,3.4+stack*.35);
          shockwave(enemy.x,enemy.y,'#ffb04e',42+stack*6,.16,2.2+stack*.25);
        }
      }
    }

    areaDamage(player.x,player.y,72+stack*10,damage*.46,'#fff0a8','apex-forge-core-flash',{shake:false});
    shockwave(player.x,player.y,'#fff7dc',185+stack*28,.44,5.2+stack*.7);
    shockwave(player.x,player.y,'#ff8d2e',285+stack*34,.58,3.2+stack*.45);
    state.camera.shake=Math.max(state.camera.shake,18+stack*3);
    state.hitStop=Math.max(state.hitStop,.055+stack*.012);
    state.flash=Math.max(state.flash,.30+stack*.035);
    if(typeof audio?.tone==='function'){
      audio.tone(46,.24,'sawtooth',.052,-16);
      audio.tone(128+stack*14,.16,'square',.032,-52);
      audio.tone(720+stack*70,.11,'sine',.018,-240);
    }
  }

  updateStarforgeLegacy=function updateStarforgeCoreLegacy(stack,dt){
    stack=Math.max(0,Math.min(MAX_STACKS,Math.floor(Number(stack)||0)));
    clearLegacyStars();
    if(!stack){state.apexForgeCoreState=null;return;}

    const profile=profileFor(stack),core=ensureCoreState(stack);
    emitCoreAura(core,stack,dt);
    core.timer-=dt;

    if(core.timer<=profile.charge)beginCharge(core,profile,stack);
    if(core.charging)updateChargeVisual(core,stack,dt);
    if(core.timer>0)return;

    fireRadialCoreBurst(stack,profile);
    core.timer=profile.cooldown;
    core.charging=false;
    core.chargeTick=0;
    state.apexBoonTimers.forge=profile.cooldown;
  };

  // The old miniature-star legacy used kills to shorten its summon timer and trigger combo blasts.
  // Suppress only that obsolete Starforge branch while preserving any unrelated kill hooks.
  if(typeof handleAnyEnemyKill==='function'){
    const baseHandleAnyEnemyKill=handleAnyEnemyKill;
    handleAnyEnemyKill=function handleAnyEnemyKillWithoutMiniatureStar(enemy){
      const owned=state.apexBoons?.starforge||0;
      if(!owned)return baseHandleAnyEnemyKill(enemy);
      state.apexBoons.starforge=0;
      try{return baseHandleAnyEnemyKill(enemy);}finally{state.apexBoons.starforge=owned;}
    };
  }

  if(typeof resetBossSystems==='function'){
    const baseResetBossSystems=resetBossSystems;
    resetBossSystems=function resetBossSystemsWithForgeCore(){
      const result=baseResetBossSystems(...arguments);
      state.apexForgeCoreState=null;
      clearLegacyStars();
      return result;
    };
  }

  if(typeof applyApexReward==='function'){
    const baseApplyApexReward=applyApexReward;
    applyApexReward=function applyApexRewardWithForgeCore(form){
      const result=baseApplyApexReward(form);
      if(form==='starforge'){
        state.apexForgeCoreState=null;
        clearLegacyStars();
        if(ui?.resonanceDesc)ui.resonanceDesc.textContent='동력핵 융합: 항성 동력핵이 플레이어를 과열시키고 주기적으로 전방위 레이저를 방출한다.';
      }
      return result;
    };
  }

  if(typeof window.openApexRewardSelection==='function'){
    const baseOpenApexRewardSelection=window.openApexRewardSelection;
    window.openApexRewardSelection=function openApexRewardSelectionWithForgeCore(form){
      const result=baseOpenApexRewardSelection(form);
      if(form==='starforge'){
        const card=document.querySelector('#apexRewardCards')?.children?.[0],desc=card?.querySelector('p');
        if(desc){
          const before=Math.max(0,Math.min(MAX_STACKS,Math.floor(Number(state.apexBoons?.starforge)||0)));
          const after=Math.min(MAX_STACKS,before+1);
          desc.textContent=before>=MAX_STACKS
            ?'동력핵 융합: 상시 과열 광휘 · 주기적 전방위 레이저 일제사격 · 유산 최대 3/3'
            :`동력핵 융합: 상시 과열 광휘 · 주기적 전방위 레이저 일제사격 · 유산 ${after}/3중첩`;
        }
      }
      return result;
    };
  }

  const ledger=document.querySelector('#abilityLedgerScreen');
  if(ledger)ledger.addEventListener('click',event=>{
    const card=event.target.closest('.ledger-card[data-apex-key="starforge"]');
    if(!card)return;
    setTimeout(()=>{
      const detail=ledger.querySelector('.ledger-detail-layer:not(.hidden) .ledger-detail-card p');
      if(detail)detail.textContent='동력핵 융합: 플레이어가 항성 동력핵을 흡수해 지속적으로 이글거리며, 일정 주기마다 강력한 전방위 레이저를 동시에 방출한다.';
    },0);
  });
})();
