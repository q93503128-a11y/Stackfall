(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-08',{
    theme:'stage-08',objectiveKey:'stage08.objective.boss',fixedEventKey:'stage08.event.fixed',initialSpawnTimer:.46,spawnRadius:745,spawnRadiusMin:70,spawnRadiusMax:165,burstRadiusMin:665,burstRadiusMax:870,startingVariants:['glass-wing','abyss-spore','glass-wing'],
    variants:{
      'glass-wing':{type:'fast',color:'#c7f7ff',hp:1.10,speed:1.36,damage:1.15,r:.98,xp:1.27,name:'stage03.enemy.glassWing'},
      'abyss-spore':{type:'ranged',color:'#b474ef',hp:1.21,speed:1.09,damage:1.19,r:1.05,xp:1.38,name:'stage07.enemy.abyssSpore',rangedMin:.52,rangedMax:.88},
      rootlance:{type:'fast',color:'#ff7fa8',hp:1.16,speed:1.42,damage:1.20,r:1.00,xp:1.36,name:'stage08.enemy.rootlance'},
      'phase-drifter':{type:'ranged',color:'#83dbc9',hp:1.14,speed:1.16,damage:1.18,r:1.02,xp:1.34,name:'stage04.enemy.phaseDrifter',rangedMin:.54,rangedMax:.92},
      'conduit-leech':{type:'tank',color:'#6fc4b9',hp:1.62,speed:.98,damage:1.21,r:1.06,xp:1.44,name:'stage05.enemy.conduitLeech'}
    },
    poolAt(time){
      if(time<135)return[['glass-wing',.48],['abyss-spore',.52]];
      if(time<300)return[['glass-wing',.22],['abyss-spore',.33],['rootlance',.45]];
      if(time<430)return[['glass-wing',.17],['abyss-spore',.28],['rootlance',.34],['phase-drifter',.21]];
      return[['glass-wing',.15],['abyss-spore',.25],['rootlance',.31],['phase-drifter',.18],['conduit-leech',.11]];
    },
    spawnProfile(time){return{cap:time>=430?66:time>=290?58:48,rate:Math.max(.34,.92-time*.00096),count:time>=410?2:time>=205&&Math.random()<.62?2:1};},
    waveLabel(event){return event.variant==='rootlance'?tr('stage08.event.migration'):tr('stage08.event.convoy');},
    hazard(event,api){
      const damage=15+Math.min(17,state.level*.38),variant=event.variant;
      if(variant==='sap-geyser'){
        showBossNotice(tr('stage08.event.geyser'),tr('stage08.event.warning'));
        for(let wave=0;wave<5;wave++)scheduleWeaponAction(wave*390,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(100+wave*24):{x:player.x,y:player.y};for(let i=0;i<5;i++){const a=i/5*TAU+wave*.31,r=58+(i%2)*72;addCircle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,38+wave*4,damage*(.56+wave*.075),i%2?'#ff779f':'#8bd8bf',.80+wave*.04);}});
        return;
      }
      const rupture=variant==='arterial-rupture',waves=rupture?6:4;
      showBossNotice(rupture?tr('stage08.event.rupture'):tr('stage08.event.rail'),tr('stage08.event.warning'));
      for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(rupture?315:440),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(135+wave*28):{x:player.x,y:player.y},lanes=rupture?4:3,half=rupture?430:375,gap=rupture?42:60,base=-.35+wave*(rupture?.27:.21);for(let lane=0;lane<lanes;lane++){const a=base+(lane-(lanes-1)/2)*.18,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,offset=(lane-(lanes-1)/2)*(rupture?56:64),cx=p.x+nx*offset,cy=p.y+ny*offset,color=lane%2?'#ff779f':'#82d7c0';rawLine(cx-dx*half,cy-dy*half,cx-dx*gap,cy-dy*gap,rupture?24:19,damage*(rupture?1.04:.86),color,.87+wave*.04,'boss-line');rawLine(cx+dx*gap,cy+dy*gap,cx+dx*half,cy+dy*half,rupture?24:19,damage*(rupture?1.04:.86),color,.87+wave*.04,'boss-line');}if(rupture&&wave%2===0)addCircle(p.x,p.y,50+wave*7,damage*.68,'#f6d7e3',.78);});
    },
    bossProfile:{form:'abyssal-rootcrown',eventVariant:'stage08-rootcrown',nameKey:'stage08.boss',warningKey:'stage08.boss.warning',r:82,hp:2.86,speed:.68,damage:1.34,color:'#ff7fa8',xp:2.95,skillCd:1.06,burstCd:3.10,pulseCd:4.90,spawnRadius:710,spawnShockwave:275},
    bossSkill:null
  });
})();