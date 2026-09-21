(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-03',{
    theme:'stage-03',objectiveKey:'stage03.objective.boss',fixedEventKey:'stage03.event.fixed',initialSpawnTimer:.62,spawnRadius:710,spawnRadiusMin:55,spawnRadiusMax:140,burstRadiusMin:630,burstRadiusMax:820,startingVariants:['shardling','dart','nebula-wisp'],
    variants:{
      shardling:{type:'grunt',color:'#8797ff',hp:1.08,speed:1.06,damage:1.00,r:.94,xp:1.06,name:'stage01.enemy.shardling'},
      dart:{type:'fast',color:'#8ee7ff',hp:.94,speed:1.20,damage:1.02,r:1.00,xp:1.10,name:'stage01.enemy.dart'},
      'nebula-wisp':{type:'ranged',color:'#e98dff',hp:.88,speed:1.10,damage:1.00,r:.94,xp:1.20,name:'stage02.enemy.wisp',rangedMin:.70,rangedMax:1.16},
      'glass-wing':{type:'fast',color:'#baf7ff',hp:.92,speed:1.28,damage:1.04,r:.96,xp:1.20,name:'stage03.enemy.glassWing'},
      bombardier:{type:'ranged',color:'#c79dff',hp:1.20,speed:.96,damage:1.06,r:1.06,xp:1.22,name:'stage01.enemy.bombardier',rangedMin:.68,rangedMax:1.12},
      bulwark:{type:'tank',color:'#7888b8',hp:1.58,speed:.85,damage:1.12,r:1.12,xp:1.40,name:'stage01.enemy.bulwark'}
    },
    poolAt(time){if(time<140)return[['shardling',.35],['dart',.35],['nebula-wisp',.30]];if(time<320)return[['shardling',.24],['dart',.22],['nebula-wisp',.24],['glass-wing',.30]];if(time<440)return[['shardling',.18],['dart',.18],['nebula-wisp',.20],['glass-wing',.27],['bombardier',.17]];return[['shardling',.14],['dart',.17],['nebula-wisp',.18],['glass-wing',.25],['bombardier',.15],['bulwark',.11]];},
    spawnProfile(time){return{cap:time>=440?56:time>=300?48:40,rate:Math.max(.46,1.16-time*.00118),count:time>=440?2:time>=260&&Math.random()<.46?2:1};},
    waveLabel(event){return event.variant==='glass-wing'?tr('stage03.event.swarm'):tr('stage03.event.procession');},
    hazard(event,api){
      const variant=event.variant,damage=10+Math.min(12,state.level*.32);
      if(variant==='prism-rain'){
        showBossNotice(tr('stage03.event.rain'),tr('stage03.event.warning'));
        for(let wave=0;wave<4;wave++)scheduleWeaponAction(wave*410,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(85+wave*28):{x:player.x,y:player.y};for(let i=0;i<5;i++){const a=i/5*TAU+wave*.42,r=62+i%2*34;addCircle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,38+wave*4,damage*(.62+wave*.08),i%2?'#d79cff':'#9cecff',.82+wave*.05);}});
        return;
      }
      const deep=variant==='deep-refraction';showBossNotice(deep?tr('stage03.event.deep'):tr('stage03.event.refraction'),tr('stage03.event.warning'));const waves=deep?5:3;
      for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(deep?380:500),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(105+wave*26):{x:player.x,y:player.y},base=.32+wave*(deep?.24:.18),half=350,gap=deep?48:64;for(const offset of[0,Math.PI/2]){const a=base+offset,dx=Math.cos(a),dy=Math.sin(a);rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,deep?22:17,damage*(deep?1.02:.84),offset?'#f0a7ff':'#9cecff',.90+wave*.05,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,deep?22:17,damage*(deep?1.02:.84),offset?'#f0a7ff':'#9cecff',.90+wave*.05,'boss-line');}if(deep&&wave===waves-1)addCircle(p.x,p.y,74,damage*.82,'#ffffff',.88);});
    },
    bossProfile:{form:'prism-reliquary',eventVariant:'stage03-reliquary',nameKey:'stage03.boss',warningKey:'stage03.boss.warning',r:70,hp:1.72,speed:.78,damage:1.14,color:'#c9b3ff',xp:2.1,skillCd:1.45,burstCd:4.0,pulseCd:6.2,spawnRadius:670,spawnShockwave:220},
    bossSkill(e,dt,api){
      if(!e||e.dead)return;const hp=e.hp/Math.max(1,e.maxHp),phase=hp<.30?3:hp<.64?2:1,k=[1,.80,.63][phase-1],damage=Math.max(6,e.damage*.43);e.stagePhase=phase;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;
      if(e.skillCd<=0){e.skillCd=2.15;const aim=Math.atan2(player.y-e.y,player.x-e.x),shots=7+phase*3;for(let i=0;i<shots;i++){const fan=(i-(shots-1)/2)*(.085-phase*.006);spawnEnemyProjectile(e.x,e.y,aim+fan,220+phase*18,damage*.60,i%2?'#d79cff':'#a8f4ff',4.6,5,'needle');}}
      if(e.burstCd<=0){e.burstCd=4.7;const p=typeof predictedPlayer==='function'?predictedPlayer(130+phase*32):{x:player.x,y:player.y},axes=phase===3?3:2,half=300+phase*24,gap=Math.max(42,68-phase*7);for(let i=0;i<axes;i++){const a=e.phase*.06+i/axes*Math.PI+.22,dx=Math.cos(a),dy=Math.sin(a);rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,18+phase*2,damage*.96,i%2?'#ef9fff':'#a4efff',.96+i*.06,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,18+phase*2,damage*.96,i%2?'#ef9fff':'#a4efff',.96+i*.06,'boss-line');}}
      if(e.pulseCd<=0){e.pulseCd=6.9-phase*.48;if(typeof fireRingWithGaps==='function'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,20+phase*5,160+phase*15,damage*.70,'#d8c7ff',e.phase*.10,aim,.26-phase*.02,4.8);}else fireRing(e,18+phase*4,160+phase*15,damage*.68,'#d8c7ff',e.phase*.10,4.8);if(phase>=2)api.spawnBurst('glass-wing',phase===3?4:2);}
    }
  });
})();