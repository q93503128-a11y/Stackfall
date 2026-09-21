(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-07',{
    theme:'stage-07',objectiveKey:'stage07.objective.boss',fixedEventKey:'stage07.event.fixed',initialSpawnTimer:.48,spawnRadius:740,spawnRadiusMin:70,spawnRadiusMax:160,burstRadiusMin:660,burstRadiusMax:860,startingVariants:['glass-wing','phase-drifter','glass-wing'],
    variants:{
      'glass-wing':{type:'fast',color:'#c8faff',hp:1.08,speed:1.35,damage:1.13,r:.98,xp:1.26,name:'stage03.enemy.glassWing'},
      'phase-drifter':{type:'ranged',color:'#91f6da',hp:1.12,speed:1.15,damage:1.15,r:1.02,xp:1.33,name:'stage04.enemy.phaseDrifter',rangedMin:.56,rangedMax:.94},
      'abyss-spore':{type:'ranged',color:'#b878ff',hp:1.18,speed:1.08,damage:1.17,r:1.05,xp:1.36,name:'stage07.enemy.abyssSpore',rangedMin:.54,rangedMax:.90},
      'conduit-leech':{type:'tank',color:'#70d8cf',hp:1.56,speed:.97,damage:1.18,r:1.05,xp:1.42,name:'stage05.enemy.conduitLeech'},
      bombardier:{type:'ranged',color:'#c29bff',hp:1.34,speed:1.02,damage:1.18,r:1.08,xp:1.30,name:'stage01.enemy.bombardier',rangedMin:.58,rangedMax:.96}
    },
    poolAt(time){
      if(time<120)return[['glass-wing',.46],['phase-drifter',.54]];
      if(time<300)return[['glass-wing',.25],['phase-drifter',.28],['abyss-spore',.47]];
      if(time<430)return[['glass-wing',.20],['phase-drifter',.23],['abyss-spore',.39],['conduit-leech',.18]];
      return[['glass-wing',.18],['phase-drifter',.20],['abyss-spore',.34],['conduit-leech',.17],['bombardier',.11]];
    },
    spawnProfile(time){return{cap:time>=430?64:time>=280?56:46,rate:Math.max(.36,.96-time*.0010),count:time>=410?2:time>=210&&Math.random()<.60?2:1};},
    waveLabel(event){return event.variant==='abyss-spore'?tr('stage07.event.sporeTide'):tr('stage07.event.rootProcession');},
    hazard(event,api){
      const damage=14+Math.min(16,state.level*.37),variant=event.variant;
      if(variant==='spore-rain'){
        showBossNotice(tr('stage07.event.sporeRain'),tr('stage07.event.warning'));
        for(let wave=0;wave<5;wave++)scheduleWeaponAction(wave*380,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(90+wave*24):{x:player.x,y:player.y};for(let i=0;i<6;i++){const a=i/6*TAU+wave*.43,r=66+(i%3)*36;addCircle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,34+wave*4,damage*(.54+wave*.07),i%2?'#be78ff':'#75e0c8',.78+wave*.04);}});
        return;
      }
      const bloom=variant==='black-bloom',waves=bloom?6:3;
      showBossNotice(bloom?tr('stage07.event.blackBloom'):tr('stage07.event.rootCage'),tr('stage07.event.warning'));
      for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(bloom?330:500),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(125+wave*26):{x:player.x,y:player.y},sides=bloom?4:3,half=bloom?390:340,gap=bloom?48:66,rot=.18+wave*(bloom?.24:.16);for(let i=0;i<sides;i++){const a=rot+i/sides*TAU,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,offset=(i%2?1:-1)*(bloom?26:18);rawLine(p.x-dx*half+nx*offset,p.y-dy*half+ny*offset,p.x-dx*gap+nx*offset,p.y-dy*gap+ny*offset,bloom?22:18,damage*(bloom?1.00:.84),i%2?'#b878ff':'#70e0c9',.88+wave*.04,'boss-line');rawLine(p.x+dx*gap+nx*offset,p.y+dy*gap+ny*offset,p.x+dx*half+nx*offset,p.y+dy*half+ny*offset,bloom?22:18,damage*(bloom?1.00:.84),i%2?'#b878ff':'#70e0c9',.88+wave*.04,'boss-line');}if(bloom&&wave%2===1)addCircle(p.x,p.y,48+wave*7,damage*.66,'#e8d7ff',.80);});
    },
    bossProfile:{form:'nightbloom-matriarch',eventVariant:'stage07-matriarch',nameKey:'stage07.boss',warningKey:'stage07.boss.warning',r:80,hp:2.62,speed:.70,damage:1.30,color:'#b878ff',xp:2.8,skillCd:1.12,burstCd:3.25,pulseCd:5.05,spawnRadius:705,spawnShockwave:265},
    bossSkill(e,dt,api){
      if(!e||e.dead)return;const hp=e.hp/Math.max(1,e.maxHp),phase=hp<.24?3:hp<.57?2:1,k=[1,.73,.54][phase-1],damage=Math.max(8,e.damage*.47);e.stagePhase=phase;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;
      if(e.skillCd<=0){e.skillCd=1.76;const aim=Math.atan2(player.y-e.y,player.x-e.x),petals=10+phase*4;for(let i=0;i<petals;i++){const a=aim+(i-(petals-1)/2)*(.064-phase*.003);spawnEnemyProjectile(e.x,e.y,a,220+phase*21,damage*.62,i%3===0?'#79dfc8':'#bd79ff',5.0,5,'void');}}
      if(e.burstCd<=0){e.burstCd=3.82;const p=typeof predictedPlayer==='function'?predictedPlayer(160+phase*38):{x:player.x,y:player.y},roots=phase===3?5:phase===2?4:3,half=350+phase*28,gap=Math.max(38,64-phase*7),rot=e.phase*.045+.15;for(let i=0;i<roots;i++){const a=rot+i/roots*TAU,dx=Math.cos(a),dy=Math.sin(a),color=i%2?'#b878ff':'#78e2cb';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,20+phase*2,damage*.97,color,.90+i*.035,'boss-line');}}
      if(e.pulseCd<=0){e.pulseCd=5.72-phase*.40;if(typeof fireRingWithGaps==='function'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,26+phase*6,162+phase*17,damage*.74,'#d7a8ff',e.phase*.076,aim,.22-phase*.016,4.7);}else fireRing(e,24+phase*5,162+phase*17,damage*.70,'#d7a8ff',e.phase*.076,4.7);api.spawnBurst('abyss-spore',phase===3?5:phase===2?3:2);}
    }
  });
})();