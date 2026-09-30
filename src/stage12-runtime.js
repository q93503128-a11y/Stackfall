(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-12',{
    theme:'stage-12',objectiveKey:'stage12.objective.boss',fixedEventKey:'stage12.event.fixed',initialSpawnTimer:.38,spawnRadius:765,spawnRadiusMin:78,spawnRadiusMax:175,burstRadiusMin:685,burstRadiusMax:890,startingVariants:['abyss-spore','rootlance','spiral-pod','husk-warden'],
    variants:{
      'abyss-spore':{type:'ranged',color:'#ad73e4',hp:1.29,speed:1.12,damage:1.28,r:1.05,xp:1.42,name:'stage07.enemy.abyssSpore',rangedMin:.45,rangedMax:.79},
      rootlance:{type:'fast',color:'#f39bb9',hp:1.24,speed:1.46,damage:1.29,r:1.00,xp:1.40,name:'stage08.enemy.rootlance'},
      'spiral-pod':{type:'ranged',color:'#ca97ff',hp:1.33,speed:1.09,damage:1.29,r:1.07,xp:1.46,name:'stage09.enemy.spiralPod',rangedMin:.44,rangedMax:.78},
      'husk-warden':{type:'tank',color:'#dfa968',hp:1.98,speed:.91,damage:1.33,r:1.14,xp:1.60,name:'stage11.enemy.huskWarden'},
      'conduit-leech':{type:'tank',color:'#6abeb2',hp:1.80,speed:1.01,damage:1.30,r:1.06,xp:1.52,name:'stage05.enemy.conduitLeech'}
    },
    poolAt(time){if(time<180)return[['abyss-spore',.25],['rootlance',.27],['spiral-pod',.27],['husk-warden',.21]];if(time<300)return[['abyss-spore',.22],['rootlance',.24],['spiral-pod',.27],['husk-warden',.27]];return[['abyss-spore',.20],['rootlance',.22],['spiral-pod',.25],['husk-warden',.25],['conduit-leech',.08]];},
    spawnProfile(time){return{cap:time>=420?74:time>=280?66:56,rate:Math.max(.30,.80-time*.00086),count:time>=380?2:time>=180&&Math.random()<.70?2:1};},
    waveLabel(event){return event.variant==='abyss-spore'?tr('stage12.event.sporeConvergence'):tr('stage12.event.huskConvergence');},
    hazard(event,api){const damage=19+Math.min(21,state.level*.42),variant=event.variant;
      if(variant==='vascular-spiral'){showBossNotice(tr('stage12.event.spiral'),tr('stage12.event.warning'));for(let wave=0;wave<5;wave++)scheduleWeaponAction(wave*320,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(130+wave*28):{x:player.x,y:player.y},arms=4,half=395,gap=54,rot=wave*.36;for(let i=0;i<arms;i++){const a=rot+i/arms*TAU,dx=Math.cos(a),dy=Math.sin(a),color=i%2?'#ca97ff':'#77d5c0';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,21,damage*.88,color,.82+wave*.04,'boss-line');}});return;}
      const final=variant==='abyssal-overgrowth',waves=final?7:4;showBossNotice(final?tr('stage12.event.overgrowth'):tr('stage12.event.cross'),tr('stage12.event.warning'));for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(final?280:410),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(155+wave*30):{x:player.x,y:player.y},axes=final?5:3,half=final?450:390,gap=final?36:58,rot=.16+wave*(final?.25:.18);for(let i=0;i<axes;i++){const a=rot+i/axes*Math.PI,dx=Math.cos(a),dy=Math.sin(a),color=i%3===0?'#f29ab8':i%3===1?'#ca96ff':'#79d5c1';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,final?25:20,damage*(final?1.05:.87),color,.80+wave*.035,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,final?25:20,damage*(final?1.05:.87),color,.80+wave*.035,'boss-line');}if(final&&wave%2===0)addCircle(p.x,p.y,54+wave*6,damage*.70,'#f5dfed',.76);});
    },
    bossProfile:{form:'abyssal-bloomheart',eventVariant:'stage12-bloomheart',nameKey:'stage12.boss',warningKey:'stage12.boss.warning',r:90,hp:4.05,speed:.61,damage:1.50,color:'#d99cff',xp:3.7,skillCd:.88,burstCd:2.62,pulseCd:4.20,spawnRadius:730,spawnShockwave:315},
    bossSkill:null
  });
})();