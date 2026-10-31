(function(){
  'use strict';

  const APEX_LEGACY_MAX_STACKS=3;
  const APEX_CORE_MAX_STACKS=3;
  const APEX_CORE_PER_STACK=1.10;
  const CHRONO_PROFILES=Object.freeze({
    1:Object.freeze({cooldown:20.0,duration:4.5,enemyScale:.45,projectileScale:.29,radius:236,damageMult:1.00}),
    2:Object.freeze({cooldown:17.0,duration:5.8,enemyScale:.38,projectileScale:.24,radius:270,damageMult:1.25}),
    3:Object.freeze({cooldown:14.0,duration:7.0,enemyScale:.32,projectileScale:.20,radius:305,damageMult:1.50})
  });

  function coreStacks(){return Math.max(0,Math.min(APEX_CORE_MAX_STACKS,Math.floor(Number(state.apexCoreStacks)||0)));}
  function coreMultiplier(){return Math.pow(APEX_CORE_PER_STACK,coreStacks());}
  function legacyStacks(form){return Math.max(0,Math.min(APEX_LEGACY_MAX_STACKS,Math.floor(Number(state.apexBoons?.[form])||0)));}
  function chronoProfile(stacks=legacyStacks('chronophage')){return CHRONO_PROFILES[Math.max(1,Math.min(APEX_LEGACY_MAX_STACKS,stacks))];}
  window.stackfallApexCoreStacks=coreStacks;
  window.stackfallApexCoreMultiplier=coreMultiplier;
  window.stackfallApexLegacyMaxStacks=APEX_LEGACY_MAX_STACKS;

  state.apexCoreStacks=coreStacks();
  function resetApexRewardBalance(){state.apexCoreStacks=0;state.apexChronoClockVisual=null;}

  // Transcendence Core: multiplicative +10% to scalable core stats.
  // Damage and attack cycle are owned by canonical progression; hard caps remain authoritative.
  if(typeof damageReduction==='function'){
    const baseDamageReductionApexCore=damageReduction;
    damageReduction=function apexCoreDamageReduction(){
      const base=clamp(baseDamageReductionApexCore(),0,.76);
      return clamp(1-(1-base)/coreMultiplier(),0,.76);
    };
  }
  if(typeof weaponRange==='function'){
    const baseWeaponRangeApexCore=weaponRange;
    weaponRange=function apexCoreWeaponRange(key){return baseWeaponRangeApexCore(key)*coreMultiplier();};
  }
  if(typeof weaponSizeMultiplier==='function'){
    const baseWeaponSizeApexCore=weaponSizeMultiplier;
    weaponSizeMultiplier=function apexCoreWeaponSize(){return baseWeaponSizeApexCore()*coreMultiplier();};
  }
  if(typeof xpMult==='function'){
    const baseXpMultApexCore=xpMult;
    xpMult=function apexCoreXpMult(){return baseXpMultApexCore()*coreMultiplier();};
  }
  if(typeof magnetRange==='function'){
    const baseMagnetRangeApexCore=magnetRange;
    magnetRange=function apexCoreMagnetRange(){return baseMagnetRangeApexCore()*coreMultiplier();};
  }
  if(typeof shieldCapacity==='function'){
    const baseShieldCapacityApexCore=shieldCapacity;
    shieldCapacity=function apexCoreShieldCapacity(fallbackCap=0){return baseShieldCapacityApexCore(fallbackCap)*coreMultiplier();};
  }
  if(typeof rechargeShield==='function'){
    const baseRechargeShieldApexCore=rechargeShield;
    rechargeShield=function apexCoreRechargeShield(amount,fallbackCap=0){return baseRechargeShieldApexCore(amount*coreMultiplier(),fallbackCap);};
  }
  if(typeof updatePlayer==='function'){
    const baseUpdatePlayerApexCore=updatePlayer;
    updatePlayer=function apexCoreMovementSpeed(dt){
      const baseSpeed=player.speed,mult=coreMultiplier();
      player.speed=baseSpeed*mult;
      try{return baseUpdatePlayerApexCore(dt);}finally{player.speed=baseSpeed;}
    };
  }

  function applyCoreStack(){
    const before=coreStacks();
    if(before>=APEX_CORE_MAX_STACKS)return false;
    state.apexCoreStacks=before+1;
    const hpBefore=Math.max(1,Number(player.maxHp)||1);
    player.maxHp=Math.max(hpBefore+1,Math.round(hpBefore*APEX_CORE_PER_STACK));
    player.hp=player.maxHp;
    return true;
  }

  function corePreview(){
    const before=coreStacks(),after=Math.min(APEX_CORE_MAX_STACKS,before+1);
    return before>=APEX_CORE_MAX_STACKS
      ?'핵심 능력치 강화 최대 3/3 · 완전 회복 · 모든 장비 즉시 재점화 · 전장 붕괴파'
      :`핵심 능력치 ×1.10 (곱연산) · ${after}/3중첩 · 완전 회복 · 모든 장비 즉시 재점화 · 전장 붕괴파`;
  }
  function legacyPreview(form,fallback=''){
    const identity=form==='starforge'?window.stackfallStarforgeLegacyV2:form==='lastconstellation'?window.stackfallConstellationLegacyV2:null;
    const custom=identity?.rewardPreview?.(form);if(custom)return custom;
    const before=legacyStacks(form),after=Math.min(APEX_LEGACY_MAX_STACKS,before+1);
    return `${fallback}${before>=APEX_LEGACY_MAX_STACKS?' · 유산 최대 3/3':` · 유산 ${after}/3중첩`}`;
  }
  function applyLegacy(form){
    state.apexBoons=state.apexBoons||{};
    const stack=Math.min(APEX_LEGACY_MAX_STACKS,legacyStacks(form)+1);state.apexBoons[form]=stack;
    if(form==='chronophage'){state.apexBoonTimers.chrono=0;state.apexChronoActiveUntil=0;state.apexChronoClockVisual=null;}
    else if(form==='starforge')state.apexBoonTimers.forge=0;
    else{state.apexBoonTimers.constellation=0;state.apexLegacyConstellation=null;}
    return stack;
  }
  window.stackfallApexRewardBalance=Object.freeze({maxLegacyStacks:APEX_LEGACY_MAX_STACKS,maxCoreStacks:APEX_CORE_MAX_STACKS,reset:resetApexRewardBalance,coreStacks,coreMultiplier,legacyStacks,corePreview,legacyPreview,applyCoreStack,applyLegacy});

  function drawChronoClockEffect(stacks,dt){
    const profile=chronoProfile(stacks),stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
    const clock=state.apexChronoClockVisual||(state.apexChronoClockVisual={angle:Math.random()*TAU,handTick:0,tickTick:0,ringTick:0});
    clock.angle+=dt*(6.0+stacks*1.25);clock.handTick-=dt;clock.tickTick-=dt;clock.ringTick-=dt;
    const radius=82+stacks*15,handInterval=stressed?.075:.045;
    if(clock.handTick<=0){
      clock.handTick=handInterval;
      const hands=[{a:clock.angle,len:radius*.92,w:2.5},{a:-clock.angle*.63+1.4,len:radius*.67,w:2.0}];
      if(stacks>=3)hands.push({a:clock.angle*1.72-2.1,len:radius*.48,w:1.5});
      for(const hand of hands){const ca=Math.cos(hand.a),sa=Math.sin(hand.a),tail=hand.len*.11;spawnBeamEffect(player.x-ca*tail,player.y-sa*tail,player.x+ca*hand.len,player.y+sa*hand.len,.09,'#bffdf3',hand.w);}
      if(!stressed)spawnParticle(player.x+rand(-radius*.22,radius*.22),player.y+rand(-radius*.22,radius*.22),stacks>=3?'#ffffff':'#79ffe1',1,28,2.1);
    }
    if(clock.tickTick<=0){
      clock.tickTick=stressed?.22:.15;
      const count=stressed?8:12,spin=clock.angle*.12;
      for(let i=0;i<count;i++){
        const a=i/count*TAU+spin,ca=Math.cos(a),sa=Math.sin(a),inner=radius-8,outer=radius+5;
        spawnBeamEffect(player.x+ca*inner,player.y+sa*inner,player.x+ca*outer,player.y+sa*outer,.12,i%3===0?'#f0fffb':'#79ffe1',i%3===0?2.0:1.15);
      }
      if(stacks>=2){
        const innerRadius=radius*.70,innerCount=stressed?4:8,reverse=-clock.angle*.10;
        for(let i=0;i<innerCount;i++){
          const a=i/innerCount*TAU+reverse,ca=Math.cos(a),sa=Math.sin(a);
          spawnBeamEffect(player.x+ca*(innerRadius-5),player.y+sa*(innerRadius-5),player.x+ca*(innerRadius+4),player.y+sa*(innerRadius+4),.11,'#a2f7e9',1.0);
        }
      }
    }
    if(clock.ringTick<=0){clock.ringTick=.30;shockwave(player.x,player.y,'#79ffe1',radius+20,.30,1.35+stacks*.25);}
    return profile;
  }

  updateChronophageLegacy=function updateThreeTierChronophageLegacy(stacks,dt){
    stacks=Math.max(0,Math.min(APEX_LEGACY_MAX_STACKS,Math.floor(Number(stacks)||0)));
    if(!stacks){state.apexChronoClockVisual=null;return;}
    const profile=chronoProfile(stacks);
    state.apexBoonTimers.chrono-=dt;
    if(state.apexBoonTimers.chrono<=0){
      state.apexBoonTimers.chrono=profile.cooldown;
      state.apexChronoActiveUntil=(state.time||0)+profile.duration;
      state.apexChronoPulseCd=0;
      state.apexChronoClockVisual={angle:Math.random()*TAU,handTick:0,tickTick:0,ringTick:0};
      shockwave(player.x,player.y,'#79ffe1',profile.radius+58,.58,4.2);
    }
    if((state.time||0)<(state.apexChronoActiveUntil||0)){
      accelerateWeaponCooldowns(dt,stacks);
      drawChronoClockEffect(stacks,dt);
      state.apexChronoPulseCd-=dt;
      if(state.apexChronoPulseCd<=0){
        state.apexChronoPulseCd=.42;
        const damage=(8+state.level*.72)*profile.damageMult;
        areaDamage(player.x,player.y,profile.radius,damage,'#79ffe1','apex-chrono-theft',{shake:false});
        shockwave(player.x,player.y,'#bffdf3',profile.radius*.72,.18,1.2);
      }
    }else state.apexChronoClockVisual=null;
  };
  window.stackfallEnemyTimeScale=()=>{
    const stacks=legacyStacks('chronophage');
    return stacks&&(state.time||0)<(state.apexChronoActiveUntil||0)?chronoProfile(stacks).enemyScale:1;
  };
  window.stackfallEnemyProjectileTimeScale=()=>{
    const stacks=legacyStacks('chronophage');
    return stacks&&(state.time||0)<(state.apexChronoActiveUntil||0)?chronoProfile(stacks).projectileScale:1;
  };
})();
