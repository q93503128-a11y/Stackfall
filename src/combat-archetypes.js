(function(){
  const lang=()=>GAME_SETTINGS?.language||'ko';
  const bossNames={
    eclipse:{ko:'일식의 군주',en:'Lord of Eclipse',ja:'日蝕の君主','zh-CN':'日蚀君主',es:'Señor del Eclipse',fr:'Seigneur de l’Éclipse'},
    seraph:{ko:'성운의 세라프',en:'Nebula Seraph',ja:'星雲のセラフ','zh-CN':'星云炽天使',es:'Serafín Nebular',fr:'Séraphin Nébulaire'},
    pulsar:{ko:'맥동성의 심장',en:'Heart of the Pulsar',ja:'パルサーの心臓','zh-CN':'脉冲星之心',es:'Corazón del Púlsar',fr:'Cœur du Pulsar'},
    leviathan:{ko:'성간의 레비아탄',en:'Interstellar Leviathan',ja:'星間のレヴィアタン','zh-CN':'星际利维坦',es:'Leviatán Interestelar',fr:'Léviathan Interstellaire'},
    archivist:{ko:'무한 기록자',en:'Infinite Archivist',ja:'無限の記録者','zh-CN':'无限记录者',es:'Archivista Infinito',fr:'Archiviste Infini'}
  };
  const miniNames={
    knight:{ko:'균열의 기사',en:'Rift Knight',ja:'亀裂の騎士','zh-CN':'裂隙骑士',es:'Caballero de la Grieta',fr:'Chevalier de la Faille'},
    warden:{ko:'초신성 감시자',en:'Nova Warden',ja:'新星の監視者','zh-CN':'新星监视者',es:'Guardián de Nova',fr:'Gardien de Nova'},
    executioner:{ko:'궤도 집행자',en:'Orbital Executioner',ja:'軌道の執行者','zh-CN':'轨道执行者',es:'Ejecutor Orbital',fr:'Exécuteur Orbital'},
    colossus:{ko:'결정 거상',en:'Crystal Colossus',ja:'結晶の巨像','zh-CN':'水晶巨像',es:'Coloso de Cristal',fr:'Colosse de Cristal'}
  };
  const voidNames={
    maw:{ko:'심연의 포식체',en:'Abyssal Devourer',ja:'深淵の捕食体','zh-CN':'深渊吞噬体',es:'Devorador Abisal',fr:'Dévoreur Abyssal'},
    oracle:{ko:'공허의 예언자',en:'Void Oracle',ja:'虚空の預言者','zh-CN':'虚空先知',es:'Oráculo del Vacío',fr:'Oracle du Néant'},
    weaver:{ko:'무광의 직조자',en:'Lightless Weaver',ja:'無光の織り手','zh-CN':'无光织者',es:'Tejedor Sin Luz',fr:'Tisseur Sans Lumière'}
  };
  const localName=(table,key)=>(table[key]?.[lang()]||table[key]?.en||key);
  const choose=a=>a[Math.floor(Math.random()*a.length)];

  function massResistance(e){
    const radius=Math.max(10,e?.r||10);
    let resistance=clamp(22/radius,.22,1);
    if(e?.type==='tank')resistance*=.78;
    if(e?.type==='mini')resistance*=.52;
    if(e?.type==='boss')resistance*=.30;
    return clamp(resistance,.10,1);
  }
  window.enemyControlResistance=massResistance;

  const updateEnemiesMassBase=updateEnemies;
  updateEnemies=function updateEnemiesWithMass(dt){
    const corrections=[];
    for(const e of state.entities.enemies){
      if(e.dead)continue;
      let cx=0,cy=0;
      const resistance=massResistance(e);
      if(resistance<.999){
        for(const w of state.entities.wells){
          const wx=w.x-e.x,wy=w.y-e.y,wd=Math.hypot(wx,wy)||1;
          if(wd<w.r){const force=(1-wd/w.r)*w.strength*(1-resistance);cx+=wx/wd*force*dt;cy+=wy/wd*force*dt;}
        }
      }
      corrections.push([e,cx,cy]);
    }
    updateEnemiesMassBase(dt);
    for(const [e,cx,cy] of corrections)if(!e.dead){e.x-=cx;e.y-=cy;}
  };

  const hurtMassBase=hurtPlayer;
  hurtPlayer=function hurtPlayerWithMass(amount,source){
    const track=source&&state.entities.enemies.includes(source),x=track?source.x:0,y=track?source.y:0;
    hurtMassBase(amount,source);
    if(track&&!source.dead){const r=massResistance(source);source.x=x+(source.x-x)*r;source.y=y+(source.y-y)*r;}
  };

  function applyGeneralArchetype(e){
    if(!e||e._randomArchetype)return;
    e._randomArchetype=true;
    if(e.type==='boss'){
      e.bossForm=choose(['eclipse','seraph','pulsar','leviathan','archivist']);
      const form=e.bossForm;
      if(form==='seraph'){e.variant='seraph';e.hp*=.90;e.speed*=1.10;e.damage*=.92;e.color='#91ffe7';}
      else if(form==='pulsar'){e.variant='eclipse';e.hp*=1.08;e.speed*=.92;e.damage*=1.02;e.color='#67b7ff';}
      else if(form==='leviathan'){e.variant='eclipse';e.hp*=1.22;e.speed*=.76;e.damage*=1.12;e.r*=1.13;e.color='#ff9b68';}
      else if(form==='archivist'){e.variant='seraph';e.hp*=.97;e.speed*=.88;e.damage*=.96;e.color='#d7b0ff';}
      else {e.variant='eclipse';e.color='#ff72cb';}
      e.maxHp=e.hp;e.name=localName(bossNames,form);
    }else if(e.type==='mini'){
      e.miniForm=choose(['knight','warden','executioner','colossus']);
      const form=e.miniForm;
      if(form==='warden'){e.hp*=.92;e.speed*=1.10;e.damage*=.94;e.color='#70e5ff';}
      else if(form==='executioner'){e.hp*=.86;e.speed*=1.18;e.damage*=1.06;e.color='#ff7db6';}
      else if(form==='colossus'){e.hp*=1.30;e.speed*=.74;e.damage*=1.12;e.r*=1.16;e.color='#ffd07b';}
      else e.color='#d4a6ff';
      e.maxHp=e.hp;e.name=localName(miniNames,form);
    }
  }
  const spawnArchetypeBase=spawnEnemy;
  spawnEnemy=function spawnRandomArchetype(kind='normal'){
    const e=spawnArchetypeBase(kind);
    if(e&&(e.type==='boss'||e.type==='mini')){
      applyGeneralArchetype(e);
      showBossNotice(e.name,e.type==='boss'?'BOSS APPROACHING':'RIFT DETECTED');
    }
    return e;
  };

  function ensureVoidForm(e){
    if(!e||e.voidForm)return;
    e.voidForm=choose(['maw','oracle','weaver']);
    e.name=localName(voidNames,e.voidForm);
    if(e.voidForm==='oracle'){e.hp*=.90;e.speed*=1.08;e.damage*=.92;e.color='#c58aff';e.r*=.92;}
    else if(e.voidForm==='weaver'){e.hp*=1.08;e.speed*=.88;e.damage*=1.03;e.color='#7446c8';e.r*=1.07;}
    else {e.color='#9b5cff';}
    e.maxHp=e.hp;e.skillCd=2.8;e.burstCd=5.6;e.pulseCd=8.4;
  }

  function fireFan(e,count,spread,speed,damage,color){
    const base=Math.atan2(player.y-e.y,player.x-e.x);
    for(let i=0;i<count;i++)spawnEnemyProjectile(e.x,e.y,base+(i-(count-1)/2)*spread,speed,damage,color,5.5,6);
  }
  function fireRing(e,count,speed,damage,color,offset=0){for(let i=0;i<count;i++)spawnEnemyProjectile(e.x,e.y,i/count*TAU+offset,speed,damage,color,5.2,6.4);}
  function addCircle(x,y,r,damage,color,life=1.1){state.entities.telegraphs.push({type:'circle',x,y,r,life,max:life,damage,color});}

  function customMiniSkill(e,dt){
    e.skillCd-=dt;e.burstCd-=dt;
    const damage=Math.max(4,e.damage*.50);
    if(e.miniForm==='warden'){
      if(e.skillCd<=0){e.skillCd=3.5;fireRing(e,8,142,damage,'#72e9ff',e.phase*.12);}
      if(e.burstCd<=0){e.burstCd=6.8;addCircle(player.x,player.y,72,Math.max(6,e.damage*.68),'#72e9ff',1.2);}
    }else if(e.miniForm==='executioner'){
      if(e.skillCd<=0){e.skillCd=2.65;fireFan(e,3,.18,225,damage,'#ff7db6');}
      if(e.burstCd<=0){e.burstCd=5.8;const a=Math.atan2(player.y-e.y,player.x-e.x);e.dash=.48;e.dashX=Math.cos(a)*390;e.dashY=Math.sin(a)*390;state.entities.telegraphs.push({type:'line',x:e.x,y:e.y,a,length:290,width:24,life:.48,max:.48,color:'#ff9bc9'});}
    }else if(e.miniForm==='colossus'){
      if(e.skillCd<=0){e.skillCd=4.1;fireRing(e,10,112,damage*1.08,'#ffd07b',e.phase*.05);}
      if(e.burstCd<=0){e.burstCd=7.4;addCircle(e.x,e.y,132,Math.max(7,e.damage*.72),'#ffb75e',1.35);}
    }else{
      if(e.skillCd<=0){e.skillCd=3.4;fireRing(e,7,145,damage,'#c79cff',e.phase*.15);}
      if(e.burstCd<=0){e.burstCd=6.4;const a=Math.atan2(player.y-e.y,player.x-e.x);e.dash=.55;e.dashX=Math.cos(a)*360;e.dashY=Math.sin(a)*360;state.entities.telegraphs.push({type:'line',x:e.x,y:e.y,a,length:260,width:26,life:.55,max:.55,color:'#e7c4ff'});}
    }
  }

  function customBossSkill(e,dt){
    e.skillCd-=dt;e.burstCd-=dt;e.pulseCd-=dt;
    const damage=Math.max(5,e.damage*.48),form=e.bossForm;
    if(form==='seraph'){
      if(e.skillCd<=0){e.skillCd=2.45;fireFan(e,7,.145,205,damage,'#9fffea');}
      if(e.burstCd<=0){e.burstCd=5.0;fireRing(e,18,165,damage*.88,'#b8fff0',e.phase*.18);}
      if(e.pulseCd<=0){e.pulseCd=8.4;for(let i=0;i<3;i++){const a=i/3*TAU;addCircle(player.x+Math.cos(a)*92,player.y+Math.sin(a)*92,70,damage*1.35,'#8fffe0',1.25);}}
    }else if(form==='pulsar'){
      if(e.skillCd<=0){e.skillCd=2.8;fireRing(e,12,125,damage,'#69bfff',e.phase*.25);setTimeout(()=>{if(state.mode==='playing'&&!e.dead)fireRing(e,12,190,damage*.82,'#b5e8ff',e.phase*.25+.13);},180);}
      if(e.burstCd<=0){e.burstCd=6.1;addCircle(player.x,player.y,104,damage*1.5,'#5ea8ff',1.28);}
      if(e.pulseCd<=0){e.pulseCd=8.8;fireFan(e,5,.11,270,damage*1.04,'#d1efff');}
    }else if(form==='leviathan'){
      if(e.skillCd<=0){e.skillCd=3.3;fireFan(e,3,.13,170,damage*1.25,'#ffad73');}
      if(e.burstCd<=0){e.burstCd=6.3;const a=Math.atan2(player.y-e.y,player.x-e.x);e.dash=.72;e.dashX=Math.cos(a)*320;e.dashY=Math.sin(a)*320;state.entities.telegraphs.push({type:'line',x:e.x,y:e.y,a,length:370,width:42,life:.72,max:.72,color:'#ffc18f'});}
      if(e.pulseCd<=0){e.pulseCd=9.1;fireRing(e,10,104,damage*1.12,'#ff895f',e.phase*.11);}
    }else if(form==='archivist'){
      if(e.skillCd<=0){e.skillCd=2.5;for(let arm=0;arm<3;arm++)for(let i=0;i<4;i++){const a=e.phase*.18+arm*TAU/3+i*.15;spawnEnemyProjectile(e.x,e.y,a,140+i*22,damage*.86,'#d7b0ff',5,6.5);}}
      if(e.burstCd<=0){e.burstCd=6.8;const a=Math.random()*TAU;e.x=player.x+Math.cos(a)*460;e.y=player.y+Math.sin(a)*460;shockwave(e.x,e.y,'#d7b0ff',82,.38,3);}
      if(e.pulseCd<=0){e.pulseCd=8.6;for(let i=0;i<4;i++){const a=i/4*TAU+e.phase*.1;addCircle(player.x+Math.cos(a)*120,player.y+Math.sin(a)*120,62,damage*1.25,'#c89cff',1.2);}}
    }else{
      if(e.skillCd<=0){e.skillCd=2.9;fireFan(e,5,.12,210,damage,'#ff72cb');}
      if(e.burstCd<=0){e.burstCd=5.6;fireRing(e,14,150,damage*.92,'#c78cff',e.phase*.2);}
      if(e.pulseCd<=0){e.pulseCd=8.2;addCircle(player.x+rand(-45,45),player.y+rand(-45,45),100,damage*1.45,'#ff72cb',1.15);}
    }
  }

  function customVoidSkill(e,dt){
    ensureVoidForm(e);e.skillCd-=dt;e.burstCd-=dt;e.pulseCd-=dt;
    const damage=Math.max(5,e.damage*.46),form=e.voidForm;
    if(form==='oracle'){
      if(e.skillCd<=0){e.skillCd=2.35;for(let arm=0;arm<3;arm++)for(let i=0;i<3;i++)spawnEnemyProjectile(e.x,e.y,e.phase*.2+arm*TAU/3+i*.12,155+i*25,damage*.82,'#d5a2ff',5,6.5);}
      if(e.burstCd<=0){e.burstCd=5.9;const a=Math.random()*TAU;e.x=player.x+Math.cos(a)*430;e.y=player.y+Math.sin(a)*430;shockwave(e.x,e.y,'#c58aff',98,.42,3);}
      if(e.pulseCd<=0){e.pulseCd=8.1;for(let i=0;i<5;i++){const a=i/5*TAU;addCircle(player.x+Math.cos(a)*115,player.y+Math.sin(a)*115,56,damage*1.22,'#b86cff',1.18);}}
    }else if(form==='weaver'){
      if(e.skillCd<=0){e.skillCd=2.7;fireFan(e,6,.13,190,damage,'#8152d2');}
      if(e.burstCd<=0){e.burstCd=5.5;for(let i=0;i<16;i++)spawnEnemyProjectile(e.x,e.y,i/16*TAU+e.phase*.13,i%2?185:112,damage*.85,i%2?'#bd8cff':'#6330ae',5,6.5);}
      if(e.pulseCd<=0){e.pulseCd=8.7;for(let i=0;i<3;i++)addCircle(player.x+rand(-120,120),player.y+rand(-120,120),82,damage*1.35,'#7036bf',1.3);}
    }else{
      if(e.skillCd<=0){e.skillCd=2.8;fireFan(e,5,.17,188,damage,'#bb82ff');}
      if(e.burstCd<=0){e.burstCd=5.7;fireRing(e,12,132,damage*.90,'#8b55df',e.phase*.17);}
      if(e.pulseCd<=0){e.pulseCd=8.8;for(let i=0;i<3;i++){const a=i/3*TAU+e.phase*.1,rr=i?95:0;addCircle(player.x+Math.cos(a)*rr,player.y+Math.sin(a)*rr,72,damage*1.30,'#8a4dff',1.25);}}
    }
  }

  const bossSkillRandomBase=bossSkill;
  bossSkill=function randomizedBossSkill(enemy,dt){
    if(enemy?.eventKind==='void'){customVoidSkill(enemy,dt);return;}
    if(enemy?.type==='boss'&&enemy.bossForm){customBossSkill(enemy,dt);return;}
    if(enemy?.type==='mini'&&enemy.miniForm){customMiniSkill(enemy,dt);return;}
    bossSkillRandomBase(enemy,dt);
  };

  const bossNameBase=typeof bossDisplayName==='function'?bossDisplayName:e=>e?.name||'';
  bossDisplayName=function dynamicBossName(e){
    if(e?.eventKind==='void'){ensureVoidForm(e);return localName(voidNames,e.voidForm);}
    if(e?.type==='boss'&&e.bossForm)return localName(bossNames,e.bossForm);
    if(e?.type==='mini'&&e.miniForm)return localName(miniNames,e.miniForm);
    return bossNameBase(e);
  };

  window.ensureVoidBossForm=ensureVoidForm;
  window.bossArchetypeName=(e)=>bossDisplayName(e);
})();