(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-14',{
    theme:'stage-14',objectiveKey:'stage14.objective.boss',fixedEventKey:'stage14.event.fixed',initialSpawnTimer:.35,spawnRadius:775,spawnRadiusMin:82,spawnRadiusMax:180,burstRadiusMin:695,burstRadiusMax:905,startingVariants:['relay-mite','relay-mite','jammer-kite'],
    variants:{
      'relay-mite':{type:'fast',color:'#6ce6f2',hp:1.32,speed:1.50,damage:1.33,r:.98,xp:1.45,name:'stage13.enemy.relayMite'},
      'jammer-kite':{type:'ranged',color:'#ef8de1',hp:1.34,speed:1.16,damage:1.34,r:1.05,xp:1.49,name:'stage14.enemy.jammerKite',rangedMin:.42,rangedMax:.75},
      'phase-drifter':{type:'ranged',color:'#8adecf',hp:1.27,speed:1.20,damage:1.31,r:1.03,xp:1.42,name:'stage04.enemy.phaseDrifter',rangedMin:.43,rangedMax:.77},
      'conduit-leech':{type:'tank',color:'#71c5b9',hp:1.86,speed:1.02,damage:1.35,r:1.07,xp:1.56,name:'stage05.enemy.conduitLeech'}
    },
    poolAt(time){if(time<150)return[['relay-mite',.62],['jammer-kite',.38]];if(time<330)return[['relay-mite',.38],['jammer-kite',.39],['phase-drifter',.23]];return[['relay-mite',.30],['jammer-kite',.34],['phase-drifter',.22],['conduit-leech',.14]];},
    spawnProfile(time){return{cap:time>=430?78:time>=290?70:60,rate:Math.max(.285,.76-time*.00080),count:time>=370?2:time>=175&&Math.random()<.73?2:1};},
    waveLabel(event){return event.variant==='jammer-kite'?tr('stage14.event.jammerFlight'):tr('stage14.event.relaySwarm');},
    hazard(event,api){const damage=21+Math.min(23,state.level*.44),variant=event.variant;
      if(variant==='carrier-break'){showBossNotice(tr('stage14.event.carrierBreak'),tr('stage14.event.warning'));for(let wave=0;wave<5;wave++)scheduleWeaponAction(wave*325,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(130+wave*26):{x:player.x,y:player.y},offset=(wave-2)*54;rawLine(p.x-430,p.y+offset,p.x-58,p.y+offset,22,damage*.91,'#ef8de1',.82+wave*.04,'boss-line');rawLine(p.x+58,p.y+offset,p.x+430,p.y+offset,22,damage*.91,'#72e6f2',.82+wave*.04,'boss-line');});return;}
      const white=variant==='whiteout-lanes',waves=white?7:4;showBossNotice(white?tr('stage14.event.whiteout'):tr('stage14.event.noiseGrid'),tr('stage14.event.warning'));for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(white?285:420),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(155+wave*30):{x:player.x,y:player.y},half=white?500:430,step=white?72:96,rows=white?5:3,cols=white?4:3,safeRow=(wave+1)%rows,safeCol=(wave*2+1)%cols;for(let row=0;row<rows;row++){if(row===safeRow)continue;const off=(row-(rows-1)/2)*step;rawLine(p.x-half,p.y+off,p.x+half,p.y+off,white?23:19,damage*(white?1.03:.84),row%2?'#ef8de1':'#72e6f2',.84+wave*.025,'boss-line');}for(let col=0;col<cols;col++){if(col===safeCol)continue;const off=(col-(cols-1)/2)*step;rawLine(p.x+off,p.y-half,p.x+off,p.y+half,white?21:18,damage*(white?.98:.80),col%2?'#72e6f2':'#ef8de1',.88+wave*.022,'boss-line');}});},
    bossProfile:{form:'noise-harvester',eventVariant:'stage14-harvester',nameKey:'stage14.boss',warningKey:'stage14.boss.warning',r:93,hp:4.52,speed:.59,damage:1.56,color:'#ed8edf',xp:4.0,skillCd:.83,burstCd:2.50,pulseCd:3.92,spawnRadius:740,spawnShockwave:326},
    bossSkill:null
  });
})();