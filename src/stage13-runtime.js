(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-13',{
    theme:'stage-13',objectiveKey:'stage13.objective.boss',fixedEventKey:'stage13.event.fixed',initialSpawnTimer:.36,spawnRadius:770,spawnRadiusMin:80,spawnRadiusMax:178,burstRadiusMin:690,burstRadiusMax:900,startingVariants:['relay-mite','relay-mite','phase-drifter'],
    variants:{
      'relay-mite':{type:'fast',color:'#6de8f4',hp:1.30,speed:1.48,damage:1.31,r:.98,xp:1.44,name:'stage13.enemy.relayMite'},
      'phase-drifter':{type:'ranged',color:'#8be0d6',hp:1.24,speed:1.19,damage:1.29,r:1.03,xp:1.40,name:'stage04.enemy.phaseDrifter',rangedMin:.44,rangedMax:.78},
      'nebula-wisp':{type:'ranged',color:'#d38cff',hp:1.21,speed:1.13,damage:1.28,r:.96,xp:1.38,name:'stage02.enemy.wisp',rangedMin:.45,rangedMax:.80},
      'conduit-leech':{type:'tank',color:'#70c8bd',hp:1.82,speed:1.02,damage:1.32,r:1.07,xp:1.54,name:'stage05.enemy.conduitLeech'}
    },
    poolAt(time){if(time<180)return[['relay-mite',.64],['phase-drifter',.36]];if(time<360)return[['relay-mite',.42],['phase-drifter',.30],['nebula-wisp',.28]];return[['relay-mite',.34],['phase-drifter',.26],['nebula-wisp',.23],['conduit-leech',.17]];},
    spawnProfile(time){return{cap:time>=430?76:time>=290?68:58,rate:Math.max(.29,.78-time*.00082),count:time>=380?2:time>=180&&Math.random()<.72?2:1};},
    waveLabel(event){return event.variant==='relay-mite'?tr('stage13.event.relaySwarm'):tr('stage13.event.phaseProcession');},
    hazard(event,api){const damage=20+Math.min(22,state.level*.43),variant=event.variant;
      if(variant==='static-fall'){showBossNotice(tr('stage13.event.staticFall'),tr('stage13.event.warning'));for(let wave=0;wave<5;wave++)scheduleWeaponAction(wave*330,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(120+wave*28):{x:player.x,y:player.y};for(let i=0;i<7;i++){const a=i/7*TAU+wave*.47,r=62+(i%3)*45;addCircle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,31+wave*3,damage*(.54+wave*.07),i%2?'#7de8f2':'#9c8dff',.78+wave*.035);}});return;}
      const lock=variant==='deadband-lock',waves=lock?7:4;showBossNotice(lock?tr('stage13.event.deadbandLock'):tr('stage13.event.carrierScan'),tr('stage13.event.warning'));for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(lock?285:430),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(150+wave*31):{x:player.x,y:player.y},a=-.72+wave*(lock?.31:.42),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,half=lock?500:440,spacing=lock?58:82,count=lock?5:3,safe=(wave+2)%count;for(let lane=0;lane<count;lane++){if(lane===safe)continue;const off=(lane-(count-1)/2)*spacing,color=lane%2?'#7de8f2':'#8e8cff',x=p.x+nx*off,y=p.y+ny*off;rawLine(x-dx*half,y-dy*half,x+dx*half,y+dy*half,lock?24:20,damage*(lock?1.04:.86),color,.86+wave*.03,'boss-line');}if(lock){const gate=100-wave*7;rawLine(p.x-nx*half,p.y-ny*half,p.x-nx*gate,p.y-ny*gate,18,damage*.72,'#d9fbff',.72,'boss-line');rawLine(p.x+nx*gate,p.y+ny*gate,p.x+nx*half,p.y+ny*half,18,damage*.72,'#d9fbff',.72,'boss-line');}});},
    bossProfile:{form:'deadband-overseer',eventVariant:'stage13-overseer',nameKey:'stage13.boss',warningKey:'stage13.boss.warning',r:91,hp:4.28,speed:.60,damage:1.53,color:'#6fe7f2',xp:3.85,skillCd:.86,burstCd:2.58,pulseCd:4.05,spawnRadius:735,spawnShockwave:320},
    bossSkill:null
  });
})();