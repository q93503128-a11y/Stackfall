(function(){
  function aimedOffsets(count,step,key){
    if(count<=1)return[0];
    player[key]=(player[key]||-1)*-1;
    const side=player[key],out=[0];
    for(let i=1;out.length<count;i++){
      out.push(step*i*side);
      if(out.length<count)out.push(-step*i*side);
    }
    return out;
  }

  spawnCoreShot=function centeredCoreVolley(target,echoed=false){
    if(!target)return;
    const stacks=Math.max(1,weaponCount('core'));
    if(!echoed)player.coreVolley=(player.coreVolley||0)+1;
    const superShot=stacks>=6&&!echoed&&player.coreVolley%6===0;
    const shots=stacks>=5?3:stacks>=2?2:1;
    const base=Math.atan2(target.y-player.y,target.x-player.x);
    player.coreCd=Math.max(.42,1.08-(stacks-1)*.085)*hasteMult();
    const offsets=aimedOffsets(shots,shots>=3?.15:.12,'coreSpreadSide');
    for(const offset of offsets){
      const a=base+offset;
      spawnPlayerProjectile({
        x:player.x,y:player.y,vx:Math.cos(a)*(superShot?610:475),vy:Math.sin(a)*(superShot?610:475),
        r:superShot?9.5:4.4+stacks*.18,life:superShot?1.9:1.48,damage:(8.5+stacks*2.05)*(echoed?.68:1)*(superShot?2.15:1),
        color:echoed?COLORS.pink:'#d7f8ff',pierce:superShot?5:stacks>=3?1:0,source:echoed?'core-echo':'core'
      });
    }
  };

  fireEmber=function centeredEmberVolley(target,emberN,echoed=false){
    if(!target)return;
    player.emberVolley=(player.emberVolley||0)+1;
    const base=Math.atan2(target.y-player.y,target.x-player.x);
    const shots=emberN>=5?3:emberN>=2?2:1;
    const superShot=emberN>=6&&player.emberVolley%7===0;
    const offsets=aimedOffsets(shots,shots===3?.18:.15,'emberSpreadSide');
    for(const offset of offsets){
      const a=base+offset+rand(-.009,.009);
      spawnPlayerProjectile({
        x:player.x,y:player.y,vx:Math.cos(a)*(superShot?620:525),vy:Math.sin(a)*(superShot?620:525),
        r:superShot?13:6,life:1.6,damage:(14+emberN*4)*(echoed?.72:1),
        color:echoed?COLORS.pink:'#ff789b',pierce:superShot?8:emberN>=3?1:0,
        source:echoed?'echo-star':'ember',split:emberN>=4
      });
    }
  };

  fireComet=function centeredCometVolley(target,cometN,echoed=false){
    if(!target)return;
    const base=Math.atan2(target.y-player.y,target.x-player.x);
    const shots=cometN>=2?2:1;
    const offsets=aimedOffsets(shots,.105,'cometSpreadSide');
    for(const offset of offsets){
      const a=base+offset;
      spawnPlayerProjectile({
        x:player.x,y:player.y,vx:Math.cos(a)*(620+cometN*7),vy:Math.sin(a)*(620+cometN*7),
        r:9+cometN*1.05,life:1.9,damage:(25+cometN*6.5)*(echoed?.68:1),
        color:echoed?COLORS.pink:COLORS.comet,pierce:2+Math.floor(cometN/2)+(cometN>=3?2:0),
        source:echoed?'echo-comet':'comet',fragment:cometN>=4,trailDamage:cometN>=5,explode:cometN>=6,trailDamageCd:0
      });
    }
  };

  function leashEnemies(){
    for(const e of state.entities.enemies){
      if(e.dead)continue;
      const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;
      const elite=e.type==='boss'||e.type==='mini';
      const limit=elite?1450:1750;
      if(d<=limit)continue;
      const a=Math.atan2(dy,dx)+rand(-.13,.13);
      const radius=elite?rand(650,760):rand(790,940);
      e.x=player.x+Math.cos(a)*radius;e.y=player.y+Math.sin(a)*radius;
      e.dash=0;e.dashX=0;e.dashY=0;
      if(elite)shockwave(e.x,e.y,e.color,74,.26,2);
    }
  }
  const baseUpdateEnemies=updateEnemies;
  updateEnemies=function updateEnemiesWithLeash(dt){leashEnemies();baseUpdateEnemies(dt);};

  function drawOffscreenEliteIndicators(){
    const elites=state.entities.enemies.filter(e=>!e.dead&&(e.type==='boss'||e.type==='mini')).slice(0,3);
    let lane=0;
    for(const e of elites){
      const p=worldToScreen(e.x,e.y),margin=72;
      if(p.x>=margin&&p.x<=vw-margin&&p.y>=margin&&p.y<=vh-margin)continue;
      const cx=vw/2,cy=vh/2,dx=p.x-cx,dy=p.y-cy,a=Math.atan2(dy,dx);
      const sx=(vw/2-margin)/Math.max(1,Math.abs(dx)),sy=(vh/2-margin)/Math.max(1,Math.abs(dy)),scale=Math.min(sx,sy);
      const x=cx+dx*scale,y=cy+dy*scale+lane*22;lane++;
      ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=e.color;ctx.shadowBlur=18;ctx.shadowColor=e.color;
      ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-10,-9);ctx.lineTo(-5,0);ctx.lineTo(-10,9);ctx.closePath();ctx.fill();ctx.restore();
      ctx.save();ctx.font='700 11px "IBM Plex Sans KR",sans-serif';ctx.textAlign=x<cx?'left':'right';ctx.textBaseline='middle';ctx.fillStyle='#eef5ff';ctx.shadowBlur=8;ctx.shadowColor=e.color;
      const distance=Math.round(Math.hypot(e.x-player.x,e.y-player.y));
      ctx.fillText(`${bossDisplayName(e)} · ${distance}`,x+(x<cx?20:-20),y);ctx.restore();
    }
  }
  const baseDrawEnemies=drawEnemies;
  drawEnemies=function drawEnemiesWithGuidance(){baseDrawEnemies();drawOffscreenEliteIndicators();};

  if(PASSIVES.chain)PASSIVES.chain.desc='처치 연쇄 유지시간 +25%';
  if(PASSIVES.chainDrive)PASSIVES.chainDrive.desc='연쇄 10 이상일 때 공격 주기 -6%';
  if(PASSIVES.chainBurst)PASSIVES.chainBurst.desc='연쇄 15회마다 연쇄 수와 중첩에 비례한 대형 폭발';
  if(PASSIVES.chainRecovery)PASSIVES.chainRecovery.desc='연쇄 20회마다 최대 체력 2.5% 회복';
  if(PASSIVES.chainField)PASSIVES.chainField.desc='연쇄 1회당 자석 범위 +1, 최대 50회';

  const chainTexts={
    ko:{chain:['연쇄 과부하','처치 연쇄 유지시간 +25%'],chainDrive:['연쇄 추진기','연쇄 10 이상일 때 공격 주기 -6%'],chainBurst:['연쇄 폭심','연쇄 15회마다 연쇄 수와 중첩에 비례한 대형 폭발'],chainRecovery:['연쇄 회수','연쇄 20회마다 최대 체력 2.5% 회복'],chainField:['전리품 공명','연쇄 1회당 자석 범위 +1, 최대 50회']},
    en:{chain:['Chain Overload','Kill-chain duration +25%'],chainDrive:['Chain Thruster','Attack interval -6% while chain is 10 or higher'],chainBurst:['Chain Detonation','A large blast every 15 chain, scaling with chain and stacks'],chainRecovery:['Chain Recovery','Restores 2.5% max health every 20 chain'],chainField:['Loot Resonance','Pickup radius +1 per current chain, up to 50']},
    ja:{chain:['連鎖過負荷','撃破連鎖の維持時間+25%'],chainDrive:['連鎖推進器','連鎖10以上で攻撃間隔-6%'],chainBurst:['連鎖爆心','連鎖15ごとに連鎖数と重複に比例する大爆発'],chainRecovery:['連鎖回収','連鎖20ごとに最大HPの2.5%回復'],chainField:['戦利品共鳴','現在の連鎖1ごとに回収範囲+1、最大50']},
    'zh-CN':{chain:['连锁过载','击杀连锁持续时间+25%'],chainDrive:['连锁推进器','连击达到10时攻击间隔-6%'],chainBurst:['连锁爆心','每15连击触发随连击数和叠加提升的大爆炸'],chainRecovery:['连锁回收','每20连击恢复2.5%最大生命值'],chainField:['战利品共鸣','当前每1连击拾取范围+1，最多50']},
    es:{chain:['Sobrecarga de Cadena','Duración de cadena de bajas +25%'],chainDrive:['Propulsor de Cadena','Intervalo de ataque -6% con cadena 10 o más'],chainBurst:['Detonación Encadenada','Gran explosión cada 15 de cadena, escalada por cadena y acumulaciones'],chainRecovery:['Recuperación en Cadena','Cura 2.5% de la vida máxima cada 20 de cadena'],chainField:['Resonancia de Botín','Radio de recogida +1 por cadena actual, hasta 50']},
    fr:{chain:['Surcharge de Chaîne','Durée de chaîne d’éliminations +25 %'],chainDrive:['Propulseur de Chaîne','Intervalle d’attaque -6 % avec une chaîne de 10 ou plus'],chainBurst:['Détonation en Chaîne','Grande explosion tous les 15 enchaînements, selon la chaîne et les cumuls'],chainRecovery:['Récupération en Chaîne','Restaure 2,5 % des PV max tous les 20 enchaînements'],chainField:['Résonance du Butin','Portée de collecte +1 par chaîne actuelle, jusqu’à 50']}
  };
  for(const [language,entries] of Object.entries(chainTexts))for(const [key,value] of Object.entries(entries)){
    PASSIVE_TEXT[key]=PASSIVE_TEXT[key]||{};PASSIVE_TEXT[key][language]=value;
  }

  const hasteBeforeChainBuff=hasteMult;
  hasteMult=function buffedChainHaste(){
    const current=hasteBeforeChainBuff(),n=stat('chainDrive');
    if(!n||(state.combo||0)<10)return current;
    const old=Math.min(.24,n*.04),desired=Math.min(.36,n*.06);
    return Math.max(.18,current/Math.max(.01,1-old)*(1-desired));
  };

  const magnetBeforeChainBuff=magnetRange;
  magnetRange=function buffedChainMagnet(){
    const current=magnetBeforeChainBuff();
    const n=stat('chainField'),combo=state.combo||0;
    if(!n)return current;
    const old=Math.min(40,combo)*n*.5,desired=Math.min(50,combo)*n;
    return current-old+desired;
  };

  let chainBurstGuard=false;
  const killBeforeChainBuff=killEnemy;
  killEnemy=function killEnemyWithBuffedChains(enemy,opts={}){
    killBeforeChainBuff(enemy,opts);
    state.comboTimer=2.15*(1+stat('chain')*.25);
    if(chainBurstGuard||!enemy)return;
    const combo=state.combo||0,burst=stat('chainBurst'),recovery=stat('chainRecovery');
    if(burst&&combo>0&&combo%15===0){
      chainBurstGuard=true;
      const damage=combo*(1.55+burst*.38)+burst*11+state.level*.45;
      const radius=96+burst*10+Math.min(120,combo*1.25);
      areaDamage(enemy.x,enemy.y,radius,damage,'#ff6e9f');
      chainBurstGuard=false;
    }
    if(recovery&&combo>0&&combo%20===0){
      player.hp=Math.min(player.maxHp,player.hp+player.maxHp*(.01*recovery));
      shockwave(player.x,player.y,'#8affba',92,.32,2.5);
    }
  };

  applyLanguage();renderLoadout();updateHUD();
})();