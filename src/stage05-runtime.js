(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-05',{
    theme:'stage-05',objectiveKey:'stage05.objective.boss',fixedEventKey:'stage05.event.fixed',initialSpawnTimer:.54,spawnRadius:730,spawnRadiusMin:65,spawnRadiusMax:150,burstRadiusMin:650,burstRadiusMax:840,startingVariants:['dart','nebula-wisp','phase-drifter'],
    variants:{
      dart:{type:'fast',color:'#8cecff',hp:1.02,speed:1.23,damage:1.06,r:1.00,xp:1.12,name:'stage01.enemy.dart'},
      'nebula-wisp':{type:'ranged',color:'#d593ff',hp:.96,speed:1.12,damage:1.06,r:.95,xp:1.22,name:'stage02.enemy.wisp',rangedMin:.64,rangedMax:1.08},
      'phase-drifter':{type:'ranged',color:'#91ffe3',hp:1.06,speed:1.13,damage:1.10,r:1.02,xp:1.30,name:'stage04.enemy.phaseDrifter',rangedMin:.60,rangedMax:.98},
      'conduit-leech':{type:'tank',color:'#79f7ff',hp:1.46,speed:.94,damage:1.12,r:1.04,xp:1.38,name:'stage05.enemy.conduitLeech'},
      bombardier:{type:'ranged',color:'#be9cff',hp:1.28,speed:1.00,damage:1.12,r:1.07,xp:1.26,name:'stage01.enemy.bombardier',rangedMin:.62,rangedMax:1.02},
      'glass-wing':{type:'fast',color:'#d7ffff',hp:1.02,speed:1.32,damage:1.10,r:.98,xp:1.24,name:'stage03.enemy.glassWing'}
    },
    poolAt(time){
      if(time<130)return[['dart',.34],['nebula-wisp',.34],['phase-drifter',.32]];
      if(time<330)return[['dart',.20],['nebula-wisp',.20],['phase-drifter',.27],['conduit-leech',.33]];
      if(time<450)return[['dart',.15],['nebula-wisp',.17],['phase-drifter',.24],['conduit-leech',.28],['bombardier',.16]];
      return[['dart',.13],['nebula-wisp',.15],['phase-drifter',.22],['conduit-leech',.25],['bombardier',.13],['glass-wing',.12]];
    },
    spawnProfile(time){return{cap:time>=450?60:time>=300?52:44,rate:Math.max(.40,1.05-time*.00108),count:time>=430?2:time>=235&&Math.random()<.54?2:1};},
    waveLabel(event){return event.variant==='conduit-leech'?tr('stage05.event.breach'):tr('stage05.event.chargedFlight');},
    hazard(event,api){
      const damage=12+Math.min(14,state.level*.35),variant=event.variant;
      if(variant==='pole-reversal'){
        showBossNotice(tr('stage05.event.reversal'),tr('stage05.event.warning'));
        for(let wave=0;wave<4;wave++)scheduleWeaponAction(wave*430,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(95+wave*30):{x:player.x,y:player.y},radius=68+wave*24;addCircle(p.x,p.y,radius,damage*(.60+wave*.10),wave%2?'#8efcff':'#c4a2ff',.84+wave*.05);const a=.45+wave*.54,dx=Math.cos(a),dy=Math.sin(a),half=285,gap=58;rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,18,damage*.76,'#8efcff',.93,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,18,damage*.76,'#c4a2ff',.93,'boss-line');});
        return;
      }
      const collapse=variant==='magnetar-collapse',waves=collapse?6:3;
      showBossNotice(collapse?tr('stage05.event.collapse'):tr('stage05.event.arc'),tr('stage05.event.warning'));
      for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(collapse?330:500),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(118+wave*25):{x:player.x,y:player.y},base=-.72+wave*(collapse?.37:.28),half=collapse?410:355,gap=collapse?44:64,lanes=collapse?3:2;for(let lane=0;lane<lanes;lane++){const a=base+(lane-(lanes-1)/2)*.28,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,offset=(lane-(lanes-1)/2)*(collapse?52:64),cx=p.x+nx*offset,cy=p.y+ny*offset;rawLine(cx-dx*half,cy-dy*half,cx-dx*gap,cy-dy*gap,collapse?23:18,damage*(collapse?1.03:.86),lane%2?'#9ba8ff':'#78f7ff',.90+wave*.04,'boss-line');rawLine(cx+dx*gap,cy+dy*gap,cx+dx*half,cy+dy*half,collapse?23:18,damage*(collapse?1.03:.86),lane%2?'#9ba8ff':'#78f7ff',.90+wave*.04,'boss-line');}if(collapse&&wave%2===1)addCircle(p.x,p.y,52+wave*5,damage*.68,'#e6ffff',.80);});
    },
    bossProfile:{form:'dipole-crown',eventVariant:'stage05-crown',nameKey:'stage05.boss',warningKey:'stage05.boss.warning',r:74,hp:2.14,speed:.74,damage:1.22,color:'#79f7ff',xp:2.4,skillCd:1.25,burstCd:3.55,pulseCd:5.55,spawnRadius:690,spawnShockwave:240},
    bossSkill(e,dt,api){
      if(!e||e.dead)return;const hp=e.hp/Math.max(1,e.maxHp),phase=hp<.27?3:hp<.60?2:1,k=[1,.76,.58][phase-1],damage=Math.max(7,e.damage*.45);e.stagePhase=phase;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;
      if(e.skillCd<=0){e.skillCd=1.95;const aim=Math.atan2(player.y-e.y,player.x-e.x),shots=9+phase*3;for(let i=0;i<shots;i++){const fan=(i-(shots-1)/2)*(.074-phase*.004);spawnEnemyProjectile(e.x,e.y,aim+fan,225+phase*22,damage*.62,i%2?'#79f7ff':'#b9a8ff',4.8,5,'storm');}}
      if(e.burstCd<=0){e.burstCd=4.2;const p=typeof predictedPlayer==='function'?predictedPlayer(150+phase*36):{x:player.x,y:player.y},axes=phase===3?4:phase===2?3:2,half=345+phase*26,gap=Math.max(38,64-phase*7),base=e.phase*.05+.24;for(let i=0;i<axes;i++){const a=base+i/axes*Math.PI,dx=Math.cos(a),dy=Math.sin(a),color=i%2?'#b5a3ff':'#7ff8ff';rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,20+phase*2,damage*.98,color,.92+i*.04,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,20+phase*2,damage*.98,color,.92+i*.04,'boss-line');}}
      if(e.pulseCd<=0){e.pulseCd=6.15-phase*.44;if(typeof fireRingWithGaps==='function'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,24+phase*5,165+phase*16,damage*.73,'#b8fff8',e.phase*.085,aim,.24-phase*.018,4.7);}else fireRing(e,22+phase*4,165+phase*16,damage*.70,'#b8fff8',e.phase*.085,4.7);if(phase>=2)api.spawnBurst('conduit-leech',phase===3?4:2);}
    }
  });
})();