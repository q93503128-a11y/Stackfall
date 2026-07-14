(function(){
  const sf3Lang=()=>GAME_SETTINGS.language||'ko';

  // Clear, effect-matching descriptions.
  const descriptions={
    ko:{
      core:['코어 펄스','기본 무기','가까운 적을 자동 추적하는 기본 광자 무기.'],
      blade:['펄스 블레이드','공격 / 근접','플레이어 주변을 회전하며 적을 절단하는 지속형 광자 칼날.'],
      ember:['별빛 캐스터','공격 / 탄막','가까운 적에게 폭발성 별빛 탄환을 연사하는 성광 발사기.'],
      bulwark:['성광 장벽','방어 / 보호막','받는 피해 감소와 보호막 충전에 특화된 방어 장벽.'],
      gravity:['중력 우물','제어 / 집속','가까운 적 무리를 한 지점으로 끌어당기는 공간 왜곡 장치.'],
      comet:['혜성 창','공격 / 관통','가까운 적을 향해 긴 광미와 함께 관통하는 결정 장창.'],
      prism:['성좌 프리즘','소환 / 광선','가까운 적 방향으로 긴 관통 광선을 발사하는 공전 성좌 장치.'],
      chrono:['시간 고리','제어 / 지원','주변 적의 이동을 늦추는 시간 제어 장치.'],
      arc:['성운 부메랑','공격 / 곡선','적을 향해 크게 휘어 날아간 뒤 직선으로 귀환하는 성운 칼날.']
    },
    en:{
      core:['Core Pulse','Basic Weapon','An automatic photon weapon that targets the nearest enemy.'],
      blade:['Pulse Blade','Attack / Melee','Persistent photon blades orbiting the player and cutting nearby enemies.'],
      ember:['Starlight Caster','Attack / Barrage','A stellar launcher firing explosive starlight rounds at the nearest enemy.'],
      bulwark:['Astral Barrier','Defense / Shield','A defensive barrier focused on damage reduction and shield recovery.'],
      gravity:['Gravity Well','Control / Grouping','A spatial distortion pulling nearby enemies into one point.'],
      comet:['Comet Lance','Attack / Pierce','A crystal lance piercing the nearest enemy with a long comet trail.'],
      prism:['Constellation Prism','Summon / Beam','Orbiting prisms firing long piercing beams toward the nearest enemy.'],
      chrono:['Chrono Ring','Control / Support','A time-control field slowing nearby enemies.'],
      arc:['Nebula Boomerang','Attack / Curved','A nebula blade curving past its target before returning in a straight line.']
    }
  };
  for(const [lang,rows] of Object.entries(descriptions))for(const [key,row] of Object.entries(rows))if(WEAPON_TEXT[key])WEAPON_TEXT[key][lang]=row;

  // Make projectile-count wording explicit: every number is the total count, not an added amount.
  STACK_EFFECTS.core=[
    ['초기 점화','기본 광자탄 총 1발 자동 발사.'],['쌍발 코어','기본 광자탄 총 2발 동시 발사.'],['코어 관통','각 광자탄의 추가 적 1명 관통.'],
    ['펄스 폭발','광자탄 명중 지점의 소형 범위 폭발.'],['삼중 코어','기본 광자탄 총 3발 동시 발사.'],['항성 펄스','6회마다 대형 관통 광자탄 발사.']
  ];
  STACK_EFFECTS.ember=[
    ['첫 별','폭발성 별빛 탄환 총 1발 발사.'],['쌍성 사격','폭발성 별빛 탄환 총 2발 동시 발사.'],['성핵 관통','각 탄환의 추가 적 1명 관통.'],
    ['성운 분열','명중 탄환의 별가루 3개 분열.'],['삼중 성렬','폭발성 별빛 탄환 총 3발 동시 발사.'],['초신성 탄두','7회마다 대형 관통 초신성탄 발사.']
  ];
  STACK_EFFECTS.comet=[
    ['결정 장창','관통 혜성 창 총 1개 발사.'],['이중 궤적','관통 혜성 창 총 2개 동시 발사.'],['심층 관통','창 크기와 관통 횟수 증가.'],
    ['혜성 파편','관통 지점의 파편 4개 방출.'],['잔광 궤도','비행 경로의 짧은 지속 피해.'],['대충돌','소멸 지점의 대형 범위 폭발.']
  ];
  STACK_EFFECTS.arc=[
    ['성운 비행','곡선 왕복 칼날 총 1개 발사.'],['쌍곡선','반대 방향으로 휘는 칼날 총 2개 동시 발사.'],['광폭 선회','근거리에서도 크게 휘는 곡률과 칼날 크기 증가.'],
    ['귀환 절단','적을 지나친 뒤 선회하고 직선 귀환하며 두 번째 타격.'],['잔광 띠','왕복 경로의 짧은 지속 피해.'],['삼중 나선','서로 다른 곡선의 칼날 총 3개 동시 발사.']
  ];
  STACK_EFFECTS.blade=[
    ['월광 기동','지속형 광자 칼날 총 1개 공전.'],['쌍월 궤도','지속형 광자 칼날 총 2개 공전.'],['가속 궤도','공전 속도와 공격 반경 증가.'],
    ['성흔 파동','적중 지점의 관통 절단파 발사.'],['삼월식','지속형 광자 칼날 총 3개 공전.'],['천체 분쇄기','연쇄 처치 6회마다 별빛 폭발.']
  ];
  STACK_EFFECTS.prism=[
    ['단일 프리즘','공전 프리즘 총 1개와 관통 광선 1줄.'],['쌍둥이 프리즘','공전 프리즘 총 2개.'],['광폭 굴절','광선 폭과 경로 판정 증가.'],
    ['성좌 연결','프리즘 사이 연결 광선의 접촉 피해.'],['다중 초점','각 프리즘의 관통 광선 총 2줄.'],['천구 의식','공전 프리즘 총 3개.']
  ];
  STACK_EFFECTS.bulwark=[
    ['성광 피막','최대 체력 증가와 기본 피해 감소.'],['겹빛 장벽','피해 감소율 추가 증가.'],['재충전 장벽','일정 시간마다 보호막 6 충전.'],
    ['보복 장막','피격 시 주변 충격파.'],['요새 장막','보호막 최대치 30과 충전량 10.'],['천체 성벽','추가 보호막 24의 주기적 충전.']
  ];
  STACK_EFFECTS.gravity=[
    ['특이점 씨앗','중력 우물 총 1개 주기적 생성.'],['조석 고정','흡입 반경과 흡입력 증가.'],['장수 특이점','중력 우물 지속시간 증가.'],
    ['붕괴핵','중심부 지속 피해.'],['압축 붕괴','중심 피해와 흡입력 추가 증가.'],['쌍둥이 특이점','중력 우물 총 2개 동시 생성.']
  ];
  STACK_EFFECTS.chrono=[
    ['느린 시간','주변 적 이동속도 감소.'],['느린 궤도','감속 범위 증가.'],['시간 가속','모든 장비 발동 주기 추가 단축.'],
    ['시간 파동','주기적인 범위 피해 파동.'],['찰나 정지','파동 적중 일반 적의 강한 일시 감속.'],['영원의 원환','감속 범위와 장비 가속 효과 최대화.']
  ];

  if(PASSIVE_TEXT.echo){
    PASSIVE_TEXT.echo.ko=['에코 비콘','발사·설치형 장비 발동의 확률적 1회 복제. 지속형 칼날은 잔상 타격.'];
    PASSIVE_TEXT.echo.en=['Echo Beacon','Chance to repeat firing and deployed attacks once. Persistent blades gain echo strikes.'];
  }
  if(PASSIVE_TEXT.chain){
    PASSIVE_TEXT.chain.ko=['연쇄 과부하','처치 연쇄 유지시간 +15%. 연쇄 5회마다 피해 +3%, 최대 +30%.'];
    PASSIVE_TEXT.chain.en=['Chain Overload','Chain duration +15%. Every 5 chain grants +3% damage, up to +30%.'];
  }

  // Dynamic boomerang: target-shaped outbound curve, overshoot, a visible turn, then a straight return.
  function sf3Cubic(a,b,c,d,t){const u=1-t;return{x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};}
  function sf3Quad(a,b,c,t){const u=1-t;return{x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};}
  function sf3Ease(t){return t*t*(3-2*t);}
  function sf3EnemyById(id){return state.entities.enemies.find(e=>e.id===id&&!e.dead)||null;}

  sf2FireArc=function sf3FireArc(target,stacks,echoed=false){
    target=target&&!target.dead?target:nearestEnemy(player.x,player.y);if(!target)return;
    const shots=stacks>=6?3:stacks>=2?2:1;
    const start={x:player.x,y:player.y};
    const baseAngle=Math.atan2(target.y-start.y,target.x-start.x);
    const baseDistance=Math.hypot(target.x-start.x,target.y-start.y);
    player.arcSide=(player.arcSide||-1)*-1;
    for(let i=0;i<shots;i++){
      const spreadIndex=i-(shots-1)/2;
      const side=shots===1?player.arcSide:(spreadIndex===0?player.arcSide:Math.sign(spreadIndex));
      const targetOffset=spreadIndex*(34+stacks*4);
      const perp={x:-Math.sin(baseAngle),y:Math.cos(baseAngle)};
      const targetPoint={x:target.x+perp.x*targetOffset,y:target.y+perp.y*targetOffset};
      const dirAngle=Math.atan2(targetPoint.y-start.y,targetPoint.x-start.x),dir={x:Math.cos(dirAngle),y:Math.sin(dirAngle)},normal={x:-dir.y,y:dir.x};
      const distance=Math.hypot(targetPoint.x-start.x,targetPoint.y-start.y);
      const curveAmp=clamp(185+distance*.24+(stacks>=3?34:0),185,330)*side;
      const passDistance=clamp(105+distance*.24,120,230);
      const passPoint={x:targetPoint.x+dir.x*passDistance,y:targetPoint.y+dir.y*passDistance};
      const turnPoint={x:passPoint.x-dir.x*(34+stacks*3)+normal.x*curveAmp*.62,y:passPoint.y-dir.y*(34+stacks*3)+normal.y*curveAmp*.62};
      const c1={x:start.x+dir.x*Math.max(70,distance*.24)+normal.x*curveAmp,y:start.y+dir.y*Math.max(70,distance*.24)+normal.y*curveAmp};
      const c2={x:targetPoint.x-dir.x*Math.max(45,distance*.18)+normal.x*curveAmp*.48,y:targetPoint.y-dir.y*Math.max(45,distance*.18)+normal.y*curveAmp*.48};
      state.entities.curves.push({
        stage:'approach',stageTime:0,stageDuration:clamp(.58+distance/1150,.64,1.08),targetId:target.id,
        start:{...start},targetPoint,passPoint,turnPoint,c1,c2,x:start.x,y:start.y,lastX:start.x,lastY:start.y,
        hitIds:new Set(),r:10+stacks*1.15,damage:(18+stacks*5.1)*(echoed?.68:1),color:echoed?COLORS.pink:'#69ffe0',
        trailDamage:stacks>=5,trailCd:0,history:[],stacks,dead:false,returnLife:0
      });
    }
  };

  sf2UpdateCurves=function sf3UpdateCurves(dt){
    for(const p of state.entities.curves){
      if(p.dead)continue;p.stageTime+=dt;p.lastX=p.x;p.lastY=p.y;
      if(p.stage==='approach'){
        const live=sf3EnemyById(p.targetId);
        if(live){p.targetPoint.x=lerp(p.targetPoint.x,live.x,.10);p.targetPoint.y=lerp(p.targetPoint.y,live.y,.10);}
        const t=sf3Ease(clamp(p.stageTime/p.stageDuration,0,1));
        const pos=sf3Cubic(p.start,p.c1,p.c2,p.targetPoint,t);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){
          const angle=Math.atan2(p.targetPoint.y-p.start.y,p.targetPoint.x-p.start.x),dir={x:Math.cos(angle),y:Math.sin(angle)};
          const passDistance=Math.hypot(p.passPoint.x-p.targetPoint.x,p.passPoint.y-p.targetPoint.y);
          p.passPoint={x:p.targetPoint.x+dir.x*passDistance,y:p.targetPoint.y+dir.y*passDistance};
          p.stage='pass';p.stageTime=0;p.stageDuration=.20+Math.min(.09,p.stacks*.01);p.passStart={...p.targetPoint};
          p.passControl={x:lerp(p.targetPoint.x,p.passPoint.x,.54),y:lerp(p.targetPoint.y,p.passPoint.y,.54)};
        }
      }else if(p.stage==='pass'){
        const t=sf3Ease(clamp(p.stageTime/p.stageDuration,0,1)),pos=sf3Quad(p.passStart,p.passControl,p.passPoint,t);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){
          const outward=Math.atan2(p.passPoint.y-p.passStart.y,p.passPoint.x-p.passStart.x),dir={x:Math.cos(outward),y:Math.sin(outward)},normal={x:-dir.y,y:dir.x};
          const side=Math.sign((p.turnPoint.x-p.passPoint.x)*normal.x+(p.turnPoint.y-p.passPoint.y)*normal.y)||1;
          p.turnPoint={x:p.passPoint.x-dir.x*(48+p.stacks*4)+normal.x*side*(128+p.stacks*13),y:p.passPoint.y-dir.y*(48+p.stacks*4)+normal.y*side*(128+p.stacks*13)};
          p.turnControl={x:p.passPoint.x+dir.x*62+normal.x*side*(94+p.stacks*9),y:p.passPoint.y+dir.y*62+normal.y*side*(94+p.stacks*9)};
          p.stage='turn';p.stageTime=0;p.stageDuration=.27+Math.min(.08,p.stacks*.012);p.turnStart={...p.passPoint};
        }
      }else if(p.stage==='turn'){
        const t=sf3Ease(clamp(p.stageTime/p.stageDuration,0,1)),pos=sf3Quad(p.turnStart,p.turnControl,p.turnPoint,t);p.x=pos.x;p.y=pos.y;
        if(p.stageTime>=p.stageDuration){p.stage='return';p.stageTime=0;p.returnLife=0;p.hitIds.clear();p.history.length=0;}
      }else{
        p.returnLife+=dt;const dx=player.x-p.x,dy=player.y-p.y,d=Math.hypot(dx,dy)||1,speed=690+p.stacks*34;
        p.x+=dx/d*Math.min(d,speed*dt);p.y+=dy/d*Math.min(d,speed*dt);
        if(d<player.r+13||p.returnLife>1.8)p.dead=true;
      }
      p.history.push({x:p.x,y:p.y});if(p.history.length>30)p.history.shift();p.trailCd-=dt;
      if(p.trailDamage&&p.trailCd<=0){p.trailCd=.11;state.entities.shockwaves.push({x:p.x,y:p.y,r:3,maxR:24+p.stacks*2,life:.20,max:.20,color:'rgba(105,255,224,.46)',width:1.2});
        for(const e of state.entities.enemies)if(!e.dead&&(e.x-p.x)**2+(e.y-p.y)**2<(e.r+22+p.stacks*2)**2)dealDamage(e,2.2+p.stacks*.85,{color:p.color,source:'arc-trail',canCrit:false});}
      for(const e of state.entities.enemies){
        if(e.dead||p.hitIds.has(e.id))continue;
        if((e.x-p.x)**2+(e.y-p.y)**2<(e.r+p.r)**2){p.hitIds.add(e.id);dealDamage(e,p.damage,{color:p.color,source:p.stage==='return'?'arc-return':'arc'});shockwave(p.x,p.y,p.color,36+p.stacks*3,.20,2);}
      }
      if(Math.random()<.72)state.entities.particles.push({x:p.x,y:p.y,vx:rand(-18,18),vy:rand(-18,18),life:.28,max:.28,size:rand(1.4,3.4),color:p.color,star:true});
    }
    state.entities.curves=state.entities.curves.filter(p=>!p.dead);
  };

  // Echo Beacon: exactly one extra activation, visible delay, no stale-target or pause-time activation.
  function sf3RunWhenPlaying(fn,attempt=0){
    if(state.mode==='playing'){fn();return;}
    if(['paused','choice','bossReward'].includes(state.mode)&&attempt<100)setTimeout(()=>sf3RunWhenPlaying(fn,attempt+1),50);
  }
  echoTrigger=function sf3EchoTrigger(fn){
    const n=stat('echo');if(!n)return false;
    state.echoCycle=(state.echoCycle||0)+1;
    const chance=Math.min(.72,.11+n*.076),guaranteed=n>=8&&state.echoCycle%5===0;
    if(!(guaranteed||Math.random()<chance))return false;
    state.echoProcCount=(state.echoProcCount||0)+1;
    shockwave(player.x,player.y,COLORS.pink,58,.20,1.5);
    setTimeout(()=>sf3RunWhenPlaying(fn),65);
    return true;
  };
  const sf3Core=spawnCoreShot;spawnCoreShot=function(target,echoed=false){return sf3Core(target&&!target.dead?target:nearestEnemy(player.x,player.y),echoed);};
  const sf3Ember=fireEmber;fireEmber=function(target,n,echoed=false){return sf3Ember(target&&!target.dead?target:nearestEnemy(player.x,player.y),n,echoed);};
  const sf3Comet=fireComet;fireComet=function(target,n,echoed=false){return sf3Comet(target&&!target.dead?target:nearestEnemy(player.x,player.y),n,echoed);};

  // Persistent blade echo with a global internal cooldown so it cannot multiply every frame.
  const sf3DealBase=dealDamage;let sf3EchoGuard=false;
  dealDamage=function sf3DealDamage(enemy,amount,opts={}){
    sf3DealBase(enemy,amount,opts);
    if(sf3EchoGuard||!enemy||enemy.dead||state.mode!=='playing'||opts.source!=='blade'||!stat('echo')||(player.echoBladeCd||0)>0)return;
    const n=stat('echo'),chance=Math.min(.42,.07+n*.045);if(Math.random()>=chance)return;
    player.echoBladeCd=.42;const targetId=enemy.id;
    setTimeout(()=>sf3RunWhenPlaying(()=>{const target=sf3EnemyById(targetId);if(!target)return;sf3EchoGuard=true;sf3DealBase(target,amount*.62,{color:COLORS.pink,source:'echo-blade',canCrit:false});sf3EchoGuard=false;}),55);
  };
  const sf3UpdateWeaponsBase=updateWeapons;
  updateWeapons=function sf3UpdateWeapons(dt){player.echoBladeCd=Math.max(0,(player.echoBladeCd||0)-dt);sf3UpdateWeaponsBase(dt);};

  // Chain now has a concrete benefit, shown directly in HUD.
  function sf3ChainDamageBonus(){return Math.min(.30,Math.floor((state.combo||0)/5)*.03);}
  const sf3DamageBase=damageMult;damageMult=function sf3DamageMult(){return sf3DamageBase()*(1+sf3ChainDamageBonus());};
  let comboBonusEl=document.querySelector('#comboBonusText');
  if(!comboBonusEl){comboBonusEl=document.createElement('small');comboBonusEl.id='comboBonusText';ui.comboBox.appendChild(comboBonusEl);}
  const sf3HudBase=updateHUD;
  updateHUD=function sf3UpdateHud(){
    sf3HudBase();const bonus=Math.round(sf3ChainDamageBonus()*100);
    comboBonusEl.textContent=bonus>0?`+${bonus}% ${sf3Lang()==='ko'?'피해':'DMG'}`:'';
    sf3RenderBossBars();
  };

  // No cooldown sweep on always-active equipment.
  const sf3CooldownBase=sf2CooldownInfo;
  sf2CooldownInfo=function sf3CooldownInfo(key){if(key==='blade')return{ratio:0,remaining:0};return sf3CooldownBase(key);};

  // More readable pickup field, visually distinct from the hexagonal barrier.
  drawMagnetField=function sf3DrawMagnetField(){
    const x=vw/2,y=vh/2,r=magnetRange(),stacks=stat('magnet'),t=performance.now();
    const rgb=stacks>0?'255,204,92':'104,220,255';ctx.save();
    const fill=ctx.createRadialGradient(x,y,player.r+10,x,y,r);fill.addColorStop(0,`rgba(${rgb},.055)`);fill.addColorStop(.68,`rgba(${rgb},.025)`);fill.addColorStop(1,`rgba(${rgb},.008)`);
    ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.shadowBlur=12;ctx.shadowColor=`rgba(${rgb},.55)`;
    ctx.setLineDash([5,9]);ctx.lineDashOffset=-(t/70)%14;ctx.lineWidth=1.65;ctx.strokeStyle=`rgba(${rgb},${stacks>0?.58:.38})`;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
    ctx.setLineDash([1,13]);ctx.lineDashOffset=(t/90)%14;ctx.lineWidth=1;ctx.strokeStyle=`rgba(${rgb},${stacks>0?.33:.23})`;ctx.beginPath();ctx.arc(x,y,r-8,0,TAU);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<6;i++){const a=t/1450+i*TAU/6,rr=r;ctx.fillStyle=`rgba(${rgb},${stacks>0?.88:.62})`;ctx.beginPath();ctx.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr,stacks>0?2.4:1.8,0,TAU);ctx.fill();}
    ctx.restore();
  };

  // Softer early curve, preserving endless late scaling.
  const sf3EnemyConfigBase=enemyConfig;
  enemyConfig=function sf3EnemyConfig(type){
    const c=sf3EnemyConfigBase(type),progress=clamp(state.time/150,0,1);
    const elite=type==='mini'||type==='boss';
    c.hp*=elite?lerp(.82,.93,progress):lerp(.84,.96,progress);
    c.damage*=elite?lerp(.86,.96,progress):lerp(.82,.96,progress);
    c.speed*=elite?lerp(.93,1,progress):lerp(.90,1,progress);
    return c;
  };
  updateSpawning=function sf3UpdateSpawning(dt){
    state.spawnTimer-=dt;state.miniBossTimer-=dt;state.bossTimer-=dt;
    let rate;if(state.time<25)rate=1.55;else if(state.time<65)rate=1.28-(state.time-25)*.008;else rate=Math.max(.23,.96-(state.time-65)*.0042);
    if(state.spawnTimer<=0){state.spawnTimer=rate;const count=1+Math.floor(state.time/135);for(let i=0;i<count;i++)spawnEnemy('normal');}
    const activeBoss=state.entities.enemies.some(e=>!e.dead&&e.type==='boss'),activeMini=state.entities.enemies.some(e=>!e.dead&&e.type==='mini');
    if(state.miniBossTimer<=0&&!activeBoss&&!activeMini){state.miniBossTimer=62;spawnEnemy('mini');}
    if(state.bossTimer<=0&&!activeBoss&&!activeMini){state.bossTimer=132;spawnEnemy('boss');}
  };
  const sf3ResetBase=resetGame;
  resetGame=function sf3ResetGame(){sf3ResetBase();state.miniBossTimer=45;state.bossTimer=105;state.echoProcCount=0;player.echoBladeCd=0;};
  const sf3HurtBase=hurtPlayer;
  hurtPlayer=function sf3HurtPlayer(amount,source){
    if(source&&state.entities.enemyProjectiles.includes(source))amount*=.90;
    else if(source?.type==='circle')amount*=.86;
    return sf3HurtBase(amount,source);
  };

  // Up to three simultaneous boss/mini-boss bars.
  ui.bossBar.style.display='none';
  const multi=document.createElement('div');multi.id='multiBossBars';document.querySelector('#hud').appendChild(multi);
  function sf3RenderBossBars(){
    const bosses=state.entities.enemies.filter(e=>!e.dead&&(e.type==='boss'||e.type==='mini')).slice(0,3);
    multi.innerHTML=bosses.map((b,i)=>`<div class="multi-boss-row ${b.type==='mini'?'mini':''}"><span>${bossDisplayName(b)}</span><div><i style="width:${clamp(b.hp/b.maxHp*100,0,100)}%"></i></div></div>`).join('');
    multi.classList.toggle('hidden',bosses.length===0);
  }

  const style=document.createElement('style');style.textContent=`
    #comboBonusText{display:block;margin-top:2px;color:#ffd77f;font-size:8px;font-weight:800;letter-spacing:.04em;min-height:10px}
    #multiBossBars{position:absolute;top:76px;left:50%;transform:translateX(-50%);width:min(540px,54vw);display:grid;gap:6px;pointer-events:none}
    #multiBossBars.hidden{display:none}.multi-boss-row{text-align:center;filter:drop-shadow(0 7px 16px rgba(0,0,0,.5))}.multi-boss-row span{display:block;margin-bottom:3px;color:#ffd5ef;font-size:10px;font-weight:800;letter-spacing:.12em;text-shadow:0 0 12px rgba(255,97,176,.45)}
    .multi-boss-row>div{height:7px;border:1px solid rgba(255,255,255,.16);border-radius:99px;background:rgba(4,5,14,.78);overflow:hidden}.multi-boss-row i{display:block;height:100%;background:linear-gradient(90deg,#9e79ff,#ff61b0,#ffb4df);box-shadow:0 0 13px rgba(255,97,176,.5);transition:width .14s}.multi-boss-row.mini span{color:#e3d6ff}.multi-boss-row.mini i{background:linear-gradient(90deg,#665cff,#c6a4ff)}
    @media(max-width:720px){#multiBossBars{top:72px;width:min(480px,70vw)}.multi-boss-row span{font-size:8px}}
  `;document.head.appendChild(style);

  renderStarterOptions();renderLoadout();updateHUD();
})();
