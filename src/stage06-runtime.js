(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-06',{
    theme:'stage-06',objectiveKey:'stage06.objective.boss',fixedEventKey:'stage06.event.fixed',initialSpawnTimer:.50,spawnRadius:735,spawnRadiusMin:65,spawnRadiusMax:155,burstRadiusMin:650,burstRadiusMax:850,startingVariants:['shardling','glass-wing','phase-drifter','conduit-leech'],
    variants:{
      shardling:{type:'grunt',color:'#8090ff',hp:1.12,speed:1.08,damage:1.08,r:.95,xp:1.08,name:'stage01.enemy.shardling'},
      'glass-wing':{type:'fast',color:'#d8ffff',hp:1.06,speed:1.34,damage:1.12,r:.98,xp:1.26,name:'stage03.enemy.glassWing'},
      'phase-drifter':{type:'ranged',color:'#9affea',hp:1.10,speed:1.15,damage:1.13,r:1.02,xp:1.32,name:'stage04.enemy.phaseDrifter',rangedMin:.58,rangedMax:.96},
      'conduit-leech':{type:'tank',color:'#7af8ff',hp:1.50,speed:.96,damage:1.16,r:1.04,xp:1.40,name:'stage05.enemy.conduitLeech'},
      bombardier:{type:'ranged',color:'#c4a0ff',hp:1.32,speed:1.02,damage:1.15,r:1.08,xp:1.28,name:'stage01.enemy.bombardier',rangedMin:.60,rangedMax:.98},
      bulwark:{type:'tank',color:'#7b86b6',hp:1.72,speed:.88,damage:1.18,r:1.14,xp:1.45,name:'stage01.enemy.bulwark'}
    },
    poolAt(time){
      if(time<180)return[['shardling',.20],['glass-wing',.28],['phase-drifter',.26],['conduit-leech',.26]];
      if(time<360)return[['shardling',.15],['glass-wing',.23],['phase-drifter',.23],['conduit-leech',.24],['bombardier',.15]];
      return[['shardling',.11],['glass-wing',.21],['phase-drifter',.22],['conduit-leech',.23],['bombardier',.13],['bulwark',.10]];
    },
    spawnProfile(time){return{cap:time>=420?62:time>=260?54:46,rate:Math.max(.38,1.00-time*.00104),count:time>=400?2:time>=220&&Math.random()<.58?2:1};},
    waveLabel(event){return event.variant==='bulwark'?tr('stage06.event.frontierEcho'):tr('stage06.event.magnetarEcho');},
    hazard(event,api){
      const damage=13+Math.min(15,state.level*.36),variant=event.variant;
      if(variant==='timefold-grid'){
        showBossNotice(tr('stage06.event.timefold'),tr('stage06.event.warning'));
        for(let wave=0;wave<4;wave++)scheduleWeaponAction(wave*410,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(115+wave*30):{x:player.x,y:player.y},axes=2+(wave%2),half=365,gap=56,base=.20+wave*.31;for(let i=0;i<axes;i++){const a=base+i/axes*Math.PI,dx=Math.cos(a),dy=Math.sin(a),color=i%2?'#9fffe7':'#a6b2ff';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,19,damage*.82,color,.90+wave*.04,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,19,damage*.82,color,.90+wave*.04,'boss-line');}});
        return;
      }
      const final=variant==='route-collapse',waves=final?6:3;
      showBossNotice(final?tr('stage06.event.collapse'):tr('stage06.event.cross'),tr('stage06.event.warning'));
      for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(final?320:500),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(120+wave*26):{x:player.x,y:player.y},base=.18+wave*(final?.29:.22),half=final?420:360,gap=final?42:62,axes=final?3:2;for(let i=0;i<axes;i++){const a=base+i/axes*Math.PI,dx=Math.cos(a),dy=Math.sin(a),color=i%3===0?'#84f7ff':i%3===1?'#d0a5ff':'#ffcf82';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,final?24:18,damage*(final?1.04:.86),color,.88+wave*.04,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,final?24:18,damage*(final?1.04:.86),color,.88+wave*.04,'boss-line');}if(final&&wave%2===0)addCircle(p.x,p.y,58+wave*6,damage*.70,'#eefcff',.82);});
    },
    bossProfile:{form:'shardway-nexus',eventVariant:'stage06-nexus',nameKey:'stage06.boss',warningKey:'stage06.boss.warning',r:78,hp:2.42,speed:.72,damage:1.27,color:'#c8d7ff',xp:2.65,skillCd:1.18,burstCd:3.35,pulseCd:5.25,spawnRadius:700,spawnShockwave:255},
    bossSkill:null
  });
})();