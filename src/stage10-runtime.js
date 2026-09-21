(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-10',{
    theme:'stage-10',objectiveKey:'stage10.objective.boss',fixedEventKey:'stage10.event.fixed',initialSpawnTimer:.42,spawnRadius:755,spawnRadiusMin:74,spawnRadiusMax:170,burstRadiusMin:675,burstRadiusMax:880,startingVariants:['rootlance','spiral-pod','abyss-spore'],
    variants:{
      rootlance:{type:'fast',color:'#f9a1c0',hp:1.20,speed:1.44,damage:1.24,r:1.00,xp:1.38,name:'stage08.enemy.rootlance'},
      'spiral-pod':{type:'ranged',color:'#d4a6ff',hp:1.28,speed:1.07,damage:1.24,r:1.07,xp:1.43,name:'stage09.enemy.spiralPod',rangedMin:.48,rangedMax:.82},
      'abyss-spore':{type:'ranged',color:'#b07ae8',hp:1.25,speed:1.10,damage:1.23,r:1.05,xp:1.40,name:'stage07.enemy.abyssSpore',rangedMin:.49,rangedMax:.84},
      'phase-drifter':{type:'ranged',color:'#91e7db',hp:1.18,speed:1.17,damage:1.21,r:1.02,xp:1.36,name:'stage04.enemy.phaseDrifter',rangedMin:.52,rangedMax:.88},
      'conduit-leech':{type:'tank',color:'#73c8be',hp:1.70,speed:1.00,damage:1.25,r:1.06,xp:1.48,name:'stage05.enemy.conduitLeech'}
    },
    poolAt(time){if(time<170)return[['rootlance',.37],['spiral-pod',.34],['abyss-spore',.29]];if(time<300)return[['rootlance',.30],['spiral-pod',.34],['abyss-spore',.24],['phase-drifter',.12]];if(time<430)return[['rootlance',.26],['spiral-pod',.31],['abyss-spore',.22],['phase-drifter',.21]];return[['rootlance',.23],['spiral-pod',.29],['abyss-spore',.20],['phase-drifter',.18],['conduit-leech',.10]];},
    spawnProfile(time){return{cap:time>=430?70:time>=290?62:52,rate:Math.max(.32,.86-time*.00090),count:time>=400?2:time>=195&&Math.random()<.66?2:1};},
    waveLabel(event){return event.variant==='rootlance'?tr('stage10.event.petalProcession'):tr('stage10.event.podProcession');},
    hazard(event,api){const damage=17+Math.min(19,state.level*.40),variant=event.variant;
      if(variant==='echo-bloom'){showBossNotice(tr('stage10.event.echo'),tr('stage10.event.warning'));for(let wave=0;wave<5;wave++)scheduleWeaponAction(wave*350,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(120+wave*28):{x:player.x,y:player.y},r=65+wave*24;addCircle(p.x,p.y,r,damage*(.58+wave*.07),wave%2?'#f5b5ff':'#8fe7d7',.76+wave*.04);addCircle(p.x+Math.cos(wave*.9)*110,p.y+Math.sin(wave*.9)*110,42+wave*3,damage*.54,'#f8d5ff',.80);});return;}
      const cage=variant==='reflection-cage',waves=cage?6:4;showBossNotice(cage?tr('stage10.event.cage'):tr('stage10.event.petal'),tr('stage10.event.warning'));for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(cage?300:430),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(145+wave*30):{x:player.x,y:player.y},axes=cage?4:3,half=cage?430:375,gap=cage?40:58,rot=.20+wave*(cage?.28:.20);for(let i=0;i<axes;i++){const a=rot+i/axes*Math.PI,dx=Math.cos(a),dy=Math.sin(a),color=i%2?'#f5b4ff':'#8fe7d7';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,cage?24:19,damage*(cage?1.03:.86),color,.84+wave*.04,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,cage?24:19,damage*(cage?1.03:.86),color,.84+wave*.04,'boss-line');}});
    },
    bossProfile:{form:'mirrorpetal-halo',eventVariant:'stage10-halo',nameKey:'stage10.boss',warningKey:'stage10.boss.warning',r:84,hp:3.34,speed:.66,damage:1.40,color:'#f2b6ff',xp:3.25,skillCd:.98,burstCd:2.90,pulseCd:4.60,spawnRadius:720,spawnShockwave:290},
    bossSkill(e,dt,api){if(!e||e.dead)return;const hp=e.hp/Math.max(1,e.maxHp),phase=hp<.21?3:hp<.52?2:1,k=[1,.69,.49][phase-1],damage=Math.max(9,e.damage*.50);e.stagePhase=phase;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;
      if(e.skillCd<=0){e.skillCd=1.58;const aim=Math.atan2(player.y-e.y,player.x-e.x),shots=12+phase*5;for(let i=0;i<shots;i++){const fan=(i-(shots-1)/2)*(.054-phase*.002);spawnEnemyProjectile(e.x,e.y,aim+fan,232+phase*24,damage*.64,i%2?'#f4b3ff':'#8ee6d6',5.1,5,'mirror');}}
      if(e.burstCd<=0){e.burstCd=3.42;const p=typeof predictedPlayer==='function'?predictedPlayer(175+phase*42):{x:player.x,y:player.y},axes=phase===3?5:phase===2?4:3,half=390+phase*30,gap=Math.max(32,58-phase*7),rot=e.phase*.038+.18;for(let i=0;i<axes;i++){const a=rot+i/axes*Math.PI,dx=Math.cos(a),dy=Math.sin(a),color=i%2?'#f3afff':'#8de6d6';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,21+phase*2,damage*.99,color,.84+i*.03,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,21+phase*2,damage*.99,color,.84+i*.03,'boss-line');}}
      if(e.pulseCd<=0){e.pulseCd=5.10-phase*.37;if(typeof fireRingWithGaps==='function'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,31+phase*6,170+phase*19,damage*.76,'#f1d4ff',e.phase*.064,aim,.19-phase*.013,4.7);}else fireRing(e,28+phase*5,170+phase*19,damage*.72,'#f1d4ff',e.phase*.064,4.7);api.spawnBurst(phase===3?'spiral-pod':'rootlance',phase===3?5:3);}
    }
  });
})();