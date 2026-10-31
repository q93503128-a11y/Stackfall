(function(){
  'use strict';

  if(window.stackfallStarforgeLegacy==='v2')return;
  window.stackfallStarforgeLegacy='v2';

  const MAX_STACKS=3;
  const PROFILES=Object.freeze({
    1:Object.freeze({cooldown:13.5,charge:.48,rays:8,range:1020,halfWidth:16,duration:.90,hits:5,damageMult:1.00}),
    2:Object.freeze({cooldown:11.5,charge:.50,rays:10,range:1120,halfWidth:19,duration:1.02,hits:6,damageMult:1.55}),
    3:Object.freeze({cooldown:9.5,charge:.52,rays:12,range:1240,halfWidth:22,duration:1.14,hits:7,damageMult:2.15})
  });

  const stacks=()=>Math.max(0,Math.min(MAX_STACKS,Math.floor(Number(state.apexBoons?.starforge)||0)));
  const profileFor=value=>PROFILES[Math.max(1,Math.min(MAX_STACKS,Math.floor(Number(value)||1)))];

  function ensureCoreState(stack){
    const current=state.apexForgeCoreState;
    if(current&&current.stack===stack)return current;
    state.apexForgeCoreState={stack,timer:1.35,charging:false,auraTick:0,pulseTick:0,chargeTick:0,burst:null};
    return state.apexForgeCoreState;
  }

  function clearLegacyStars(){
    if(Array.isArray(state.apexLegacyStars))state.apexLegacyStars.length=0;
  }

  function drawForgeCoreAura(stack){
    if(!stack||state.mode==='menu')return;
    const x=vw/2,y=vh/2,t=performance.now(),pulse=.5+.5*Math.sin(t*.010+stack*.7),r=43+stack*9+pulse*7;
    ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';
    const glow=ctx.createRadialGradient(0,0,6,0,0,r*1.42);
    glow.addColorStop(0,'rgba(255,255,238,.78)');
    glow.addColorStop(.24,'rgba(255,221,132,.44)');
    glow.addColorStop(.58,'rgba(255,139,46,.20)');
    glow.addColorStop(1,'rgba(255,92,20,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r*1.42,0,TAU);ctx.fill();
    ctx.globalAlpha=.48+.18*pulse;ctx.strokeStyle=stack>=3?'#fff3c4':'#ffb04e';ctx.lineWidth=2.2+stack*.45;ctx.shadowBlur=18+stack*5;ctx.shadowColor='#ff8d2e';
    ctx.beginPath();ctx.arc(0,0,r*.88,0,TAU);ctx.stroke();
    for(let i=0;i<6+stack*2;i++){
      const a=i/(6+stack*2)*TAU+t*.0012*(i%2?1:-1),inner=r*.72,outer=r*(1.00+(i%3)*.07);
      ctx.globalAlpha=.22+.18*((i+stack)%2);ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();
    }
    ctx.restore();
  }

  if(typeof drawPlayer==='function'){
    const baseDrawPlayerForgeLegacy=drawPlayer;
    drawPlayer=function drawPlayerWithForgeCoreAura(){
      const stack=stacks();
      if(stack)drawForgeCoreAura(stack);
      return baseDrawPlayerForgeLegacy();
    };
  }

  function emitCoreAura(core,stack,dt){
    const stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
    core.auraTick-=dt;core.pulseTick-=dt;
    if(core.auraTick<=0){
      core.auraTick=stressed?.060:.032;
      const count=stressed?2:3;
      for(let i=0;i<count;i++){
        const a=Math.random()*TAU,r=rand(7,32+stack*5),speed=rand(38,88)+stack*10;
        spawnParticle(player.x+Math.cos(a)*r,player.y+Math.sin(a)*r,i%3===0?'#ffffff':i%2?'#ffb04e':'#fff1b0',1,speed,rand(3.4,6.2)+stack*.45);
      }
    }
    if(core.pulseTick<=0){
      core.pulseTick=.48;
      const radius=76+stack*14;
      shockwave(player.x,player.y,stack>=3?'#fff3c4':'#ffb04e',radius,.28,1.8+stack*.28);
      if(!stressed){
        for(let i=0;i<3+stack;i++){
          const a=Math.random()*TAU,len=rand(36,68)+stack*5;
          spawnBeamEffect(player.x,player.y,player.x+Math.cos(a)*len,player.y+Math.sin(a)*len,.10,i%2?'#ffb04e':'#fff4d4',1.4+stack*.18);
        }
      }
    }
  }

  function beginCharge(core,profile,stack){
    if(core.charging||core.burst)return;
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

  function startRadialCoreBurst(core,stack,profile){
    const baseAngle=(state.time||0)*.17;
    core.burst={elapsed:0,baseAngle,tickTimer:0,visualTimer:0,hitsDone:0};
    core.charging=false;core.chargeTick=0;
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

  function beamEndpoints(profile,burst,index){
    const angle=burst.baseAngle+index/profile.rays*TAU,ux=Math.cos(angle),uy=Math.sin(angle);
    return{x1:player.x+ux*18,y1:player.y+uy*18,x2:player.x+ux*profile.range,y2:player.y+uy*profile.range};
  }

  function renderSustainedBeams(core,stack,profile,dt){
    const burst=core.burst;if(!burst)return;
    burst.visualTimer-=dt;
    if(burst.visualTimer>0)return;
    const stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
    burst.visualTimer=stressed?.080:.050;
    const outerWidth=profile.halfWidth*2.35,innerWidth=Math.max(3,profile.halfWidth*.42);
    for(let i=0;i<profile.rays;i++){
      const beam=beamEndpoints(profile,burst,i);
      spawnBeamEffect(beam.x1,beam.y1,beam.x2,beam.y2,stressed?.11:.085,'#ff9a36',outerWidth);
      spawnBeamEffect(beam.x1,beam.y1,beam.x2,beam.y2,stressed?.09:.070,'#fff7dc',innerWidth);
    }
  }

  function applySustainedBeamTick(core,stack,profile){
    const burst=core.burst;if(!burst)return;
    const hitIds=new Set(),damage=(11+state.level*.42)*profile.damageMult;
    for(let i=0;i<profile.rays;i++){
      const beam=beamEndpoints(profile,burst,i);
      for(const enemy of state.entities.enemies||[]){
        if(!enemy||enemy.dead||hitIds.has(enemy.id))continue;
        if(segmentDistance(enemy.x,enemy.y,beam.x1,beam.y1,beam.x2,beam.y2)<=enemy.r+profile.halfWidth){
          hitIds.add(enemy.id);
          dealDamage(enemy,damage,{color:'#fff0a8',source:'apex-forge-core-ray',canCrit:false});
          spawnParticle(enemy.x,enemy.y,'#fff4d4',stack>=3?5:3,92+stack*16,3.0+stack*.3);
          shockwave(enemy.x,enemy.y,'#ffb04e',36+stack*5,.13,1.8+stack*.22);
        }
      }
    }
    burst.hitsDone++;
    if(burst.hitsDone===1||burst.hitsDone===profile.hits){
      state.camera.shake=Math.max(state.camera.shake,10+stack*2);
      state.flash=Math.max(state.flash,.20+stack*.02);
      if(typeof audio?.tone==='function')audio.tone(150+burst.hitsDone*18,.065,'square',.020,-70);
    }
  }

  function updateSustainedBurst(core,stack,profile,dt){
    const burst=core.burst;if(!burst)return false;
    burst.elapsed+=dt;burst.tickTimer-=dt;
    renderSustainedBeams(core,stack,profile,dt);
    const tickInterval=profile.duration/profile.hits;
    while(burst.hitsDone<profile.hits&&burst.tickTimer<=0){
      applySustainedBeamTick(core,stack,profile);
      burst.tickTimer+=tickInterval;
    }
    if(burst.elapsed<profile.duration)return true;
    areaDamage(player.x,player.y,72+stack*10,(11+state.level*.42)*profile.damageMult*.55,'#fff0a8','apex-forge-core-flash',{shake:false});
    shockwave(player.x,player.y,'#fff7dc',132+stack*18,.30,3.2+stack*.45);
    core.burst=null;
    core.timer=Math.max(.5,profile.cooldown-profile.duration);
    state.apexBoonTimers.forge=core.timer;
    return false;
  }

  updateStarforgeLegacy=function updateStarforgeCoreLegacy(stack,dt){
    stack=Math.max(0,Math.min(MAX_STACKS,Math.floor(Number(stack)||0)));
    clearLegacyStars();
    if(!stack){state.apexForgeCoreState=null;return;}

    const profile=profileFor(stack),core=ensureCoreState(stack);
    emitCoreAura(core,stack,dt);
    if(core.burst){updateSustainedBurst(core,stack,profile,dt);return;}
    core.timer-=dt;

    if(core.timer<=profile.charge)beginCharge(core,profile,stack);
    if(core.charging)updateChargeVisual(core,stack,dt);
    if(core.timer>0)return;

    startRadialCoreBurst(core,stack,profile);
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

  function resetStarforgeLegacy(){state.apexForgeCoreState=null;clearLegacyStars();}
  function applyStarforgeRewardIdentity(form){
    if(form!=='starforge')return null;
    resetStarforgeLegacy();
    return '동력핵 융합: 항성 동력핵이 플레이어를 과열시키고 주기적으로 지속형 전방위 레이저를 방출한다.';
  }
  function starforgeRewardPreview(form){
    if(form!=='starforge')return null;
    const before=stacks(),after=Math.min(MAX_STACKS,before+1),profile=profileFor(after||1);
    return before>=MAX_STACKS
      ?'동력핵 융합: 상시 과열 광휘 · 지속형 전방위 레이저 7연타 · 유산 최대 3/3'
      :`동력핵 융합: 상시 과열 광휘 · 지속형 전방위 레이저 ${profile.hits}연타 · 유산 ${after}/3중첩`;
  }
  window.stackfallStarforgeLegacyV2=Object.freeze({reset:resetStarforgeLegacy,afterReward:applyStarforgeRewardIdentity,rewardPreview:starforgeRewardPreview});

  const ledger=document.querySelector('#abilityLedgerScreen');
  if(ledger)ledger.addEventListener('click',event=>{
    const card=event.target.closest('.ledger-card[data-apex-key="starforge"]');
    if(!card)return;
    setTimeout(()=>{
      const detail=ledger.querySelector('.ledger-detail-layer:not(.hidden) .ledger-detail-card p');
      if(detail)detail.textContent='동력핵 융합: 플레이어가 항성 동력핵을 흡수해 강하게 이글거리며, 일정 주기마다 지속형 전방위 레이저를 방출해 여러 차례 연속 타격한다.';
    },0);
  });
})();