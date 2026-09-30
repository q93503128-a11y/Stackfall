(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-04',{
    theme:'stage-04',objectiveKey:'stage04.objective.boss',fixedEventKey:'stage04.event.fixed',initialSpawnTimer:.58,spawnRadius:720,spawnRadiusMin:60,spawnRadiusMax:145,burstRadiusMin:640,burstRadiusMax:830,startingVariants:['dart','nebula-wisp','glass-wing'],
    variants:{
      dart:{type:'fast',color:'#83e8ff',hp:.98,speed:1.22,damage:1.04,r:1.00,xp:1.10,name:'stage01.enemy.dart'},
      'nebula-wisp':{type:'ranged',color:'#cf93ff',hp:.92,speed:1.11,damage:1.04,r:.95,xp:1.20,name:'stage02.enemy.wisp',rangedMin:.68,rangedMax:1.12},
      'glass-wing':{type:'fast',color:'#c9fbff',hp:.98,speed:1.30,damage:1.07,r:.98,xp:1.22,name:'stage03.enemy.glassWing'},
      'phase-drifter':{type:'ranged',color:'#8fffe0',hp:1.02,speed:1.12,damage:1.08,r:1.02,xp:1.28,name:'stage04.enemy.phaseDrifter',rangedMin:.62,rangedMax:1.02},
      bombardier:{type:'ranged',color:'#a99dff',hp:1.24,speed:.98,damage:1.09,r:1.07,xp:1.24,name:'stage01.enemy.bombardier',rangedMin:.66,rangedMax:1.08},
      bulwark:{type:'tank',color:'#71869b',hp:1.64,speed:.86,damage:1.14,r:1.13,xp:1.42,name:'stage01.enemy.bulwark'}
    },
    poolAt(time){
      if(time<115)return[['dart',.38],['nebula-wisp',.32],['glass-wing',.30]];
      if(time<300)return[['dart',.22],['nebula-wisp',.22],['glass-wing',.25],['phase-drifter',.31]];
      if(time<430)return[['dart',.17],['nebula-wisp',.18],['glass-wing',.22],['phase-drifter',.27],['bombardier',.16]];
      return[['dart',.14],['nebula-wisp',.16],['glass-wing',.20],['phase-drifter',.25],['bombardier',.14],['bulwark',.11]];
    },
    spawnProfile(time){return{cap:time>=430?58:time>=280?50:42,rate:Math.max(.43,1.10-time*.00112),count:time>=430?2:time>=250&&Math.random()<.50?2:1};},
    waveLabel(event){return event.variant==='phase-drifter'?tr('stage04.event.procession'):tr('stage04.event.echoFlight');},
    hazard(event,api){
      const damage=11+Math.min(13,state.level*.34);
      if(event.variant==='stasis-burst'){
        showBossNotice(tr('stage04.event.stasis'),tr('stage04.event.warning'));
        for(let wave=0;wave<4;wave++)scheduleWeaponAction(wave*460,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(90+wave*26):{x:player.x,y:player.y},r=72+wave*32;addCircle(p.x,p.y,r,damage*(.58+wave*.10),wave%2?'#86ffe1':'#9ab7ff',.84+wave*.05);});
        return;
      }
      const deep=event.variant==='zero-hour-lattice',waves=deep?5:3;
      showBossNotice(deep?tr('stage04.event.zeroHour'):tr('stage04.event.secondHand'),tr('stage04.event.warning'));
      for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(deep?360:500),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(110+wave*30):{x:player.x,y:player.y},axes=deep?3:2,base=.18+wave*(deep?.31:.24),half=deep?390:350,gap=deep?46:62;for(let i=0;i<axes;i++){const a=base+i/axes*Math.PI,dx=Math.cos(a),dy=Math.sin(a);rawLine(p.x-dx*half,p.y-dy*half,p.x-dx*gap,p.y-dy*gap,deep?22:18,damage*(deep?1.02:.86),i%2?'#9ab7ff':'#8fffe0',.91+wave*.05,'boss-line');rawLine(p.x+dx*gap,p.y+dy*gap,p.x+dx*half,p.y+dy*half,deep?22:18,damage*(deep?1.02:.86),i%2?'#9ab7ff':'#8fffe0',.91+wave*.05,'boss-line');}});
    },
    bossProfile:{form:'zero-hour-regulator',eventVariant:'stage04-regulator',nameKey:'stage04.boss',warningKey:'stage04.boss.warning',r:72,hp:1.92,speed:.76,damage:1.18,color:'#8fffe0',xp:2.25,skillCd:1.35,burstCd:3.8,pulseCd:5.9,spawnRadius:680,spawnShockwave:230},
    bossSkill:null
  });
})();