(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-09',{
    theme:'stage-09',objectiveKey:'stage09.objective.boss',fixedEventKey:'stage09.event.fixed',initialSpawnTimer:.44,spawnRadius:750,spawnRadiusMin:72,spawnRadiusMax:168,burstRadiusMin:670,burstRadiusMax:875,startingVariants:['abyss-spore','rootlance','abyss-spore'],
    variants:{
      'abyss-spore':{type:'ranged',color:'#aa72e8',hp:1.23,speed:1.10,damage:1.21,r:1.05,xp:1.39,name:'stage07.enemy.abyssSpore',rangedMin:.50,rangedMax:.86},
      rootlance:{type:'fast',color:'#ff7ca8',hp:1.18,speed:1.43,damage:1.22,r:1.00,xp:1.37,name:'stage08.enemy.rootlance'},
      'spiral-pod':{type:'ranged',color:'#d59cff',hp:1.26,speed:1.06,damage:1.22,r:1.07,xp:1.42,name:'stage09.enemy.spiralPod',rangedMin:.50,rangedMax:.84},
      'glass-wing':{type:'fast',color:'#c7f7ff',hp:1.12,speed:1.37,damage:1.17,r:.98,xp:1.28,name:'stage03.enemy.glassWing'},
      'conduit-leech':{type:'tank',color:'#6bc5b8',hp:1.66,speed:.99,damage:1.23,r:1.06,xp:1.46,name:'stage05.enemy.conduitLeech'}
    },
    poolAt(time){if(time<125)return[['abyss-spore',.54],['rootlance',.46]];if(time<310)return[['abyss-spore',.25],['rootlance',.30],['spiral-pod',.45]];if(time<440)return[['abyss-spore',.22],['rootlance',.25],['spiral-pod',.36],['glass-wing',.17]];return[['abyss-spore',.20],['rootlance',.24],['spiral-pod',.33],['glass-wing',.14],['conduit-leech',.09]];},
    spawnProfile(time){return{cap:time>=440?68:time>=300?60:50,rate:Math.max(.33,.89-time*.00092),count:time>=420?2:time>=200&&Math.random()<.64?2:1};},
    waveLabel(event){return event.variant==='spiral-pod'?tr('stage09.event.podBloom'):tr('stage09.event.rootCrossing');},
    hazard(event,api){
      const damage=16+Math.min(18,state.level*.39),variant=event.variant;
      if(variant==='seed-orbit'){
        showBossNotice(tr('stage09.event.orbit'),tr('stage09.event.warning'));
        for(let wave=0;wave<5;wave++)scheduleWeaponAction(wave*360,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(110+wave*25):{x:player.x,y:player.y};for(let i=0;i<6;i++){const a=i/6*TAU+wave*.52,r=78+(wave%2)*28;addCircle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,34+wave*3,damage*(.54+wave*.07),i%2?'#d59cff':'#79dbc5',.78+wave*.04);}});
        return;
      }
      const vortex=variant==='bloom-vortex',waves=vortex?6:4;showBossNotice(vortex?tr('stage09.event.vortex'):tr('stage09.event.helix'),tr('stage09.event.warning'));
      for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(vortex?300:420),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(140+wave*28):{x:player.x,y:player.y},arms=vortex?4:3,half=vortex?425:370,gap=vortex?42:60,base=wave*(vortex?.33:.25);for(let i=0;i<arms;i++){const a=base+i/arms*TAU,dx=Math.cos(a),dy=Math.sin(a),color=i%2?'#d59cff':'#7de0c7';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,vortex?24:19,damage*(vortex?1.04:.86),color,.85+wave*.04,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,vortex?24:19,damage*(vortex?1.04:.86),color,.85+wave*.04,'boss-line');}});
    },
    bossProfile:{form:'helix-nursery',eventVariant:'stage09-nursery',nameKey:'stage09.boss',warningKey:'stage09.boss.warning',r:83,hp:3.08,speed:.67,damage:1.37,color:'#d59cff',xp:3.1,skillCd:1.02,burstCd:3.00,pulseCd:4.75,spawnRadius:715,spawnShockwave:282},
    bossSkill(e,dt,api){if(!e||e.dead)return;const hp=e.hp/Math.max(1,e.maxHp),phase=hp<.22?3:hp<.54?2:1,k=[1,.70,.50][phase-1],damage=Math.max(9,e.damage*.49);e.stagePhase=phase;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;
      if(e.skillCd<=0){e.skillCd=1.64;const aim=Math.atan2(player.y-e.y,player.x-e.x),shots=12+phase*4;for(let i=0;i<shots;i++){const fan=(i-(shots-1)/2)*(.057-phase*.002);spawnEnemyProjectile(e.x,e.y,aim+fan,230+phase*23,damage*.63,i%2?'#d59cff':'#79dcc6',5.1,5,'spiral');}}
      if(e.burstCd<=0){e.burstCd=3.52;const p=typeof predictedPlayer==='function'?predictedPlayer(170+phase*42):{x:player.x,y:player.y},arms=phase===3?5:phase===2?4:3,half=380+phase*30,gap=Math.max(34,60-phase*7),rot=e.phase*.040;for(let i=0;i<arms;i++){const a=rot+i/arms*TAU,dx=Math.cos(a),dy=Math.sin(a),color=i%2?'#d99cff':'#7cdfc7';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,20+phase*2,damage*.98,color,.86+i*.03,'boss-line');}}
      if(e.pulseCd<=0){e.pulseCd=5.25-phase*.38;if(typeof fireRingWithGaps==='function'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,30+phase*6,168+phase*18,damage*.75,'#e4c3ff',e.phase*.068,aim,.20-phase*.014,4.7);}else fireRing(e,27+phase*5,168+phase*18,damage*.71,'#e4c3ff',e.phase*.068,4.7);api.spawnBurst('spiral-pod',phase===3?5:3);}
    }
  });
})();