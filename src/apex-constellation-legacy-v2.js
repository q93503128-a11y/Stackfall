(function(){
  'use strict';

  if(window.stackfallConstellationLegacy==='v2')return;
  window.stackfallConstellationLegacy='v2';

  const MAX_STACKS=3;
  const PROFILES=Object.freeze({
    1:Object.freeze({nodes:6,strikes:3,radius:270,preview:.22,gap:.58,loopGap:.32,halfWidth:8,damageMult:1.00}),
    2:Object.freeze({nodes:8,strikes:4,radius:310,preview:.20,gap:.54,loopGap:.28,halfWidth:10,damageMult:1.45}),
    3:Object.freeze({nodes:10,strikes:5,radius:350,preview:.18,gap:.50,loopGap:.24,halfWidth:12,damageMult:1.90})
  });

  const profileFor=value=>PROFILES[Math.max(1,Math.min(MAX_STACKS,Math.floor(Number(value)||1)))];

  function buildPattern(stack,profile,serial){
    const points=[],count=profile.nodes,base=(state.time||0)*.11+serial*.73;
    for(let i=0;i<count;i++){
      const a=base+i/count*TAU;
      const inner=(i+serial)%3===1;
      const r=profile.radius*(inner?.66:1)*(1+Math.sin((i+1)*(serial+2)*1.17)*.055);
      points.push({x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r*.72});
    }
    const edges=[],seen=new Set(),jump=stack===1?2:stack===2?3:4;
    const push=(a,b)=>{
      if(a===b)return;
      const lo=Math.min(a,b),hi=Math.max(a,b),key=lo+':'+hi;
      if(seen.has(key))return;seen.add(key);edges.push([lo,hi]);
    };
    for(let i=0;i<count;i++){
      push(i,(i+1)%count);
      push(i,(i+jump)%count);
      if(stack>=2&&i%2===0)push(i,(i+Math.floor(count/2))%count);
    }
    return{points,edges};
  }

  function startNetwork(stack,profile){
    const serial=(state.apexConstellationSerial||0)+1;state.apexConstellationSerial=serial;
    const pattern=buildPattern(stack,profile,serial);
    state.apexLegacyConstellation={
      stack,serial,phase:'preview',phaseTimer:profile.preview,previewTick:0,
      strikesLeft:profile.strikes,points:pattern.points,edges:pattern.edges
    };
    shockwave(player.x,player.y,'#b7c9ff',170+stack*25,.42,3.3+stack*.4);
    state.camera.shake=Math.max(state.camera.shake,5+stack*1.2);
  }

  function reconfigure(network,profile){
    network.serial=(state.apexConstellationSerial||0)+1;state.apexConstellationSerial=network.serial;
    const pattern=buildPattern(network.stack,profile,network.serial);
    network.points=pattern.points;network.edges=pattern.edges;
    network.phase='preview';network.phaseTimer=profile.preview;network.previewTick=0;
    shockwave(player.x,player.y,'#879be0',116+network.stack*18,.24,1.5+network.stack*.2);
  }

  function previewNetwork(network,dt){
    network.previewTick-=dt;if(network.previewTick>0)return;
    const stressed=typeof stackfallPerformanceStressed==='function'&&stackfallPerformanceStressed();
    network.previewTick=stressed?.12:.075;
    for(const [a,b] of network.edges){
      const p=network.points[a],q=network.points[b];
      spawnBeamEffect(p.x,p.y,q.x,q.y,.095,'#879be0',1.05+network.stack*.18);
    }
    if(!stressed){
      for(const p of network.points){
        spawnParticle(p.x+rand(-3,3),p.y+rand(-3,3),'#dce6ff',1,18,2.4+network.stack*.22);
      }
    }
  }

  function enemyOnAnyEdge(enemy,network,halfWidth){
    for(const [a,b] of network.edges){
      const p=network.points[a],q=network.points[b];
      if(segmentDistance(enemy.x,enemy.y,p.x,p.y,q.x,q.y)<=enemy.r+halfWidth)return true;
    }
    return false;
  }

  function projectileOnAnyEdge(projectile,network,halfWidth){
    for(const [a,b] of network.edges){
      const p=network.points[a],q=network.points[b];
      if(segmentDistance(projectile.x,projectile.y,p.x,p.y,q.x,q.y)<=projectile.r+halfWidth)return true;
    }
    return false;
  }

  function strikeNetwork(network,profile){
    const stack=network.stack,damage=(24+state.level*1.10)*profile.damageMult;
    for(const [a,b] of network.edges){
      const p=network.points[a],q=network.points[b];
      spawnBeamEffect(p.x,p.y,q.x,q.y,.20,'#879be0',profile.halfWidth*1.85);
      spawnBeamEffect(p.x,p.y,q.x,q.y,.13,'#f4f7ff',Math.max(2.2,profile.halfWidth*.42));
    }
    for(const enemy of state.entities.enemies||[]){
      if(!enemy||enemy.dead||!enemyOnAnyEdge(enemy,network,profile.halfWidth))continue;
      dealDamage(enemy,damage,{color:'#f0f4ff',source:'apex-constellation-lattice',canCrit:false});
      spawnParticle(enemy.x,enemy.y,'#eef3ff',4+stack*2,88+stack*18,2.8+stack*.3);
      shockwave(enemy.x,enemy.y,'#b7c9ff',35+stack*5,.13,1.7+stack*.2);
    }
    for(const projectile of state.entities.enemyProjectiles||[]){
      if(projectile?.life>0&&projectileOnAnyEdge(projectile,network,profile.halfWidth+3))projectile.life=0;
    }
    for(const p of network.points)shockwave(p.x,p.y,'#dce6ff',28+stack*4,.14,1.8+stack*.2);
    state.camera.shake=Math.max(state.camera.shake,9+stack*2.2);
    state.hitStop=Math.max(state.hitStop,.024+stack*.008);
    state.flash=Math.max(state.flash,.12+stack*.025);
    if(typeof audio?.tone==='function'){
      audio.tone(185+stack*24,.09,'square',.024,-70);
      audio.tone(760+stack*90,.08,'sine',.012,-260);
    }
    network.strikesLeft--;
    network.phase='gap';network.phaseTimer=profile.gap;
  }

  function collapseNetwork(network,profile){
    const stack=network.stack,damage=(38+state.level*1.35)*profile.damageMult,radius=profile.radius*1.08;
    areaDamage(player.x,player.y,radius,damage,'#dce6ff','apex-constellation-collapse',{shake:false});
    for(const projectile of state.entities.enemyProjectiles||[]){
      if(!projectile||projectile.life<=0)continue;
      if(Math.hypot(projectile.x-player.x,projectile.y-player.y)<=radius+(projectile.r||0))projectile.life=0;
    }
    shockwave(player.x,player.y,'#f4f7ff',radius*.78,.38,4.5+stack*.6);
    shockwave(player.x,player.y,'#879be0',radius*1.08,.52,2.7+stack*.4);
    spawnParticle(player.x,player.y,'#eef3ff',12+stack*6,180+stack*25,3.4+stack*.4);
    state.camera.shake=Math.max(state.camera.shake,14+stack*2.5);
    state.hitStop=Math.max(state.hitStop,.045+stack*.01);
    state.flash=Math.max(state.flash,.22+stack*.03);
    network.phase='loop';network.phaseTimer=profile.loopGap;network.previewTick=0;
  }

  updateConstellationLegacy=function updateContinuousConstellationLegacy(stack,dt){
    stack=Math.max(0,Math.min(MAX_STACKS,Math.floor(Number(stack)||0)));
    if(!stack){state.apexLegacyConstellation=null;return;}
    const profile=profileFor(stack);
    let network=state.apexLegacyConstellation;
    if(!network){startNetwork(stack,profile);network=state.apexLegacyConstellation;}
    if(!network)return;
    if(network.stack!==stack){state.apexLegacyConstellation=null;startNetwork(stack,profile);network=state.apexLegacyConstellation;}

    network.phaseTimer-=dt;
    if(network.phase==='preview'){
      previewNetwork(network,dt);
      if(network.phaseTimer<=0)strikeNetwork(network,profile);
      return;
    }
    if(network.phase==='gap'&&network.phaseTimer<=0){
      if(network.strikesLeft<=0)collapseNetwork(network,profile);
      else reconfigure(network,profile);
      return;
    }
    if(network.phase==='loop'&&network.phaseTimer<=0)startNetwork(stack,profile);
  };

  if(typeof resetBossSystems==='function'){
    const baseResetBossSystems=resetBossSystems;
    resetBossSystems=function resetBossSystemsWithConstellationLegacy(){
      const result=baseResetBossSystems(...arguments);
      state.apexLegacyConstellation=null;state.apexConstellationSerial=0;
      return result;
    };
  }

  if(typeof applyApexReward==='function'){
    const baseApplyApexReward=applyApexReward;
    applyApexReward=function applyApexRewardWithSkyLattice(form){
      const result=baseApplyApexReward(form);
      if(form==='lastconstellation'){
        state.apexLegacyConstellation=null;state.apexBoonTimers.constellation=0;
        if(ui?.resonanceDesc)ui.resonanceDesc.textContent='무명의 천구: 전장에 성좌를 끊임없이 새기고 재배열하며 연결선으로 적을 반복 절단하고 적 탄환을 지운다.';
      }
      return result;
    };
  }

  if(typeof window.openApexRewardSelection==='function'){
    const baseOpenApexRewardSelection=window.openApexRewardSelection;
    window.openApexRewardSelection=function openApexRewardSelectionWithSkyLattice(form){
      const result=baseOpenApexRewardSelection(form);
      if(form==='lastconstellation'){
        const card=document.querySelector('#apexRewardCards')?.children?.[0],desc=card?.querySelector('p');
        if(desc){
          const before=Math.max(0,Math.min(MAX_STACKS,Math.floor(Number(state.apexBoons?.lastconstellation)||0)));
          const after=Math.min(MAX_STACKS,before+1);
          desc.textContent=before>=MAX_STACKS
            ?'무명의 천구: 상시 성좌 생성 → 연결선 일제 절단 → 재배열 반복 → 천구 붕괴 후 즉시 재생성 · 적 탄환 삭제 · 유산 최대 3/3'
            :`무명의 천구: 상시 성좌 생성 → 연결선 일제 절단 → 재배열 반복 → 천구 붕괴 후 즉시 재생성 · 적 탄환 삭제 · 유산 ${after}/3중첩`;
        }
      }
      return result;
    };
  }

  const ledger=document.querySelector('#abilityLedgerScreen');
  if(ledger)ledger.addEventListener('click',event=>{
    const card=event.target.closest('.ledger-card[data-apex-key="lastconstellation"]');
    if(!card)return;
    setTimeout(()=>{
      const detail=ledger.querySelector('.ledger-detail-layer:not(.hidden) .ledger-detail-card p');
      if(detail)detail.textContent='무명의 천구: 넓은 전장에 성좌 노드를 상시 유지한다. 연결선이 일제히 점화되어 적을 절단하고 적 탄환을 지운 뒤 별자리가 즉시 재구성되며, 한 주기가 끝나면 천구 전체가 붕괴하고 곧바로 새로운 성좌가 생성된다.';
    },0);
  });
})();
