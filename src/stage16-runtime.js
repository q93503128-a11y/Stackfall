(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-16',{
    theme:'stage-16',objectiveKey:'stage16.objective.boss',fixedEventKey:'stage16.event.fixed',initialSpawnTimer:.33,spawnRadius:785,spawnRadiusMin:86,spawnRadiusMax:188,burstRadiusMin:705,burstRadiusMax:915,startingVariants:['packet-lancer','jammer-kite','relay-mite'],
    variants:{
      'packet-lancer':{type:'fast',color:'#899fff',hp:1.34,speed:1.60,damage:1.40,r:1.00,xp:1.54,name:'stage15.enemy.packetLancer'},
      'jammer-kite':{type:'ranged',color:'#d988d2',hp:1.39,speed:1.18,damage:1.38,r:1.05,xp:1.52,name:'stage14.enemy.jammerKite',rangedMin:.40,rangedMax:.73},
      'relay-mite':{type:'fast',color:'#67dfe9',hp:1.36,speed:1.52,damage:1.37,r:.98,xp:1.48,name:'stage13.enemy.relayMite'},
      'phase-drifter':{type:'ranged',color:'#79cfca',hp:1.32,speed:1.22,damage:1.35,r:1.03,xp:1.46,name:'stage04.enemy.phaseDrifter',rangedMin:.41,rangedMax:.75},
      'conduit-leech':{type:'tank',color:'#68b9b0',hp:1.95,speed:1.03,damage:1.39,r:1.07,xp:1.60,name:'stage05.enemy.conduitLeech'}
    },
    poolAt(time){if(time<170)return[['packet-lancer',.40],['jammer-kite',.32],['relay-mite',.28]];if(time<330)return[['packet-lancer',.33],['jammer-kite',.29],['relay-mite',.23],['phase-drifter',.15]];return[['packet-lancer',.30],['jammer-kite',.26],['relay-mite',.21],['phase-drifter',.14],['conduit-leech',.09]];},
    spawnProfile(time){return{cap:time>=430?82:time>=290?74:64,rate:Math.max(.275,.72-time*.00076),count:time>=350?2:time>=165&&Math.random()<.75?2:1};},
    waveLabel(event){return event.variant==='packet-lancer'?tr('stage16.event.packetProcession'):tr('stage16.event.jammerColumn');},
    hazard(event,api){const damage=23+Math.min(25,state.level*.46),variant=event.variant;
      if(variant==='dead-zone'){showBossNotice(tr('stage16.event.deadZone'),tr('stage16.event.warning'));for(let wave=0;wave<5;wave++)scheduleWeaponAction(wave*325,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(125+wave*27):{x:player.x,y:player.y};for(let i=0;i<6;i++){const a=i/6*TAU+wave*.35,r=78+(i%2)*82;addCircle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,38+wave*3,damage*(.57+wave*.07),i%2?'#6578b8':'#6fdbe1',.77+wave*.04);}});return;}
      const sweep=variant==='null-sweep',waves=sweep?7:4;showBossNotice(sweep?tr('stage16.event.nullSweep'):tr('stage16.event.blindCross'),tr('stage16.event.warning'));for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(sweep?275:405),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(165+wave*32):{x:player.x,y:player.y},base=-1.18+wave*(sweep?.34:.48),half=sweep?520:450,arms=sweep?3:2;for(let arm=0;arm<arms;arm++){const a=base+(arm-(arms-1)/2)*(sweep?.19:Math.PI/2),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,off=(arm-(arms-1)/2)*(sweep?72:0);rawLine(p.x-dx*half+nx*off,p.y-dy*half+ny*off,p.x+dx*half+nx*off,p.y+dy*half+ny*off,sweep?28:22,damage*(sweep?1.06:.88),arm%2?'#667bc0':'#70dbe3',.80+wave*.03,'boss-line');}});},
    bossProfile:{form:'null-beacon',eventVariant:'stage16-beacon',nameKey:'stage16.boss',warningKey:'stage16.boss.warning',r:97,hp:5.05,speed:.57,damage:1.62,color:'#6b88b8',xp:4.3,skillCd:.77,burstCd:2.36,pulseCd:3.68,spawnRadius:750,spawnShockwave:340},
    bossSkill:null
  });
})();