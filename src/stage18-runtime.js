(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-18',{
    theme:'stage-18',objectiveKey:'stage18.objective.boss',fixedEventKey:'stage18.event.fixed',initialSpawnTimer:.31,spawnRadius:795,spawnRadiusMin:90,spawnRadiusMax:196,burstRadiusMin:715,burstRadiusMax:925,startingVariants:['relay-mite','jammer-kite','packet-lancer','cipher-warden'],
    variants:{
      'relay-mite':{type:'fast',color:'#62dae5',hp:1.41,speed:1.54,damage:1.41,r:.98,xp:1.52,name:'stage13.enemy.relayMite'},
      'jammer-kite':{type:'ranged',color:'#cd82cc',hp:1.44,speed:1.20,damage:1.42,r:1.05,xp:1.56,name:'stage14.enemy.jammerKite',rangedMin:.38,rangedMax:.71},
      'packet-lancer':{type:'fast',color:'#849aff',hp:1.40,speed:1.63,damage:1.44,r:1.00,xp:1.58,name:'stage15.enemy.packetLancer'},
      'cipher-warden':{type:'tank',color:'#dfb96f',hp:2.13,speed:.94,damage:1.47,r:1.15,xp:1.70,name:'stage17.enemy.cipherWarden'},
      'phase-drifter':{type:'ranged',color:'#75cbc4',hp:1.36,speed:1.23,damage:1.40,r:1.03,xp:1.50,name:'stage04.enemy.phaseDrifter',rangedMin:.38,rangedMax:.70}
    },
    poolAt(time){if(time<180)return[['relay-mite',.24],['jammer-kite',.24],['packet-lancer',.27],['cipher-warden',.25]];if(time<320)return[['relay-mite',.21],['jammer-kite',.23],['packet-lancer',.25],['cipher-warden',.26],['phase-drifter',.05]];return[['relay-mite',.19],['jammer-kite',.22],['packet-lancer',.24],['cipher-warden',.27],['phase-drifter',.08]];},
    spawnProfile(time){return{cap:time>=420?86:time>=280?78:68,rate:Math.max(.265,.68-time*.00072),count:time>=330?2:time>=155&&Math.random()<.77?2:1};},
    waveLabel(event){return event.variant==='relay-mite'?tr('stage18.event.relayConvergence'):tr('stage18.event.cipherConvergence');},
    hazard(event,api){const damage=25+Math.min(27,state.level*.48),variant=event.variant;
      if(variant==='blind-grid'){showBossNotice(tr('stage18.event.blindGrid'),tr('stage18.event.warning'));for(let wave=0;wave<6;wave++)scheduleWeaponAction(wave*290,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(145+wave*29):{x:player.x,y:player.y},offset=(wave-2.5)*58;rawLine(p.x-460,p.y+offset,p.x-50,p.y+offset,23,damage*.94,wave%2?'#70e7ef':'#c79cff',.78+wave*.035,'boss-line');rawLine(p.x+50,p.y+offset,p.x+460,p.y+offset,23,damage*.94,wave%2?'#70e7ef':'#c79cff',.78+wave*.035,'boss-line');rawLine(p.x+offset,p.y-460,p.x+offset,p.y-50,21,damage*.89,'#e6c276',.82,'boss-line');rawLine(p.x+offset,p.y+50,p.x+offset,p.y+460,21,damage*.89,'#e6c276',.82,'boss-line');});return;}
      const collapse=variant==='silence-collapse',waves=collapse?8:5;showBossNotice(collapse?tr('stage18.event.silenceCollapse'):tr('stage18.event.multiplexCross'),tr('stage18.event.warning'));for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(collapse?265:390),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(175+wave*34):{x:player.x,y:player.y};if(!collapse){const a=wave%2?.58:-.58,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,half=460;for(const off of[-92,0,92])rawLine(p.x-dx*half+nx*off,p.y-dy*half+ny*off,p.x+dx*half+nx*off,p.y+dy*half+ny*off,22,damage*.90,off===0?'#e6c276':'#70e7ef',.82+wave*.025,'boss-line');return;}const sides=wave>=5?8:6,r=Math.max(88,365-wave*34),rot=.18+wave*.17;for(let i=0;i<sides;i++){const a1=rot+i*TAU/sides,a2=rot+(i+1)*TAU/sides,color=i%3===0?'#e6c276':i%3===1?'#70e7ef':'#c79cff';rawLine(p.x+Math.cos(a1)*r,p.y+Math.sin(a1)*r,p.x+Math.cos(a2)*r,p.y+Math.sin(a2)*r,27,damage*1.08,color,.80+wave*.025,'boss-line');}if(wave===waves-1)addCircle(p.x,p.y,54,damage*.68,'#effcff',.72);});},
    bossProfile:{form:'silence-mainframe',eventVariant:'stage18-mainframe',nameKey:'stage18.boss',warningKey:'stage18.boss.warning',r:103,hp:5.70,speed:.54,damage:1.72,color:'#c79cff',xp:4.8,skillCd:.70,burstCd:2.20,pulseCd:3.42,spawnRadius:760,spawnShockwave:360},
    bossSkill:null
  });
})();