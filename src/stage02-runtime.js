(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-02',{
    theme:'stage-02',objectiveKey:'stage02.objective.boss',fixedEventKey:'stage02.event.fixed',initialSpawnTimer:.68,spawnRadius:700,spawnRadiusMin:55,spawnRadiusMax:135,burstRadiusMin:620,burstRadiusMax:800,startingVariants:['shardling','dart','dart'],
    variants:{
      shardling:{type:'grunt',color:'#7a8dff',hp:1.02,speed:1.04,damage:.96,r:.94,xp:1.04,name:'stage01.enemy.shardling'},
      dart:{type:'fast',color:'#8ee7ff',hp:.90,speed:1.18,damage:.98,r:1.00,xp:1.08,name:'stage01.enemy.dart'},
      'nebula-wisp':{type:'ranged',color:'#ff89d7',hp:.82,speed:1.08,damage:.94,r:.92,xp:1.18,name:'stage02.enemy.wisp',rangedMin:.72,rangedMax:1.20},
      bombardier:{type:'ranged',color:'#b58cff',hp:1.16,speed:.94,damage:1.02,r:1.06,xp:1.20,name:'stage01.enemy.bombardier',rangedMin:.72,rangedMax:1.20},
      bulwark:{type:'tank',color:'#7380b8',hp:1.52,speed:.84,damage:1.08,r:1.10,xp:1.38,name:'stage01.enemy.bulwark'}
    },
    poolAt(time){if(time<120)return[['shardling',.58],['dart',.42]];if(time<240)return[['shardling',.40],['dart',.30],['nebula-wisp',.30]];if(time<420)return[['shardling',.29],['dart',.25],['nebula-wisp',.28],['bombardier',.18]];return[['shardling',.22],['dart',.22],['nebula-wisp',.26],['bombardier',.18],['bulwark',.12]];},
    spawnProfile(time){return{cap:time>=420?52:time>=240?44:38,rate:Math.max(.50,1.24-time*.00125),count:time>=420?2:time>=270&&Math.random()<.40?2:1};},
    waveLabel(event){return event.variant==='nebula-wisp'?tr('stage02.event.bloom'):tr('stage01.event.bombardment');},
    hazard(event,api){
      const deep=event.variant==='deep-shear';showBossNotice(deep?tr('stage02.event.deep'):tr('stage02.event.shear'),tr('stage02.event.warning'));const waves=deep?4:3,damage=9+Math.min(11,state.level*.30);
      for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(deep?500:610),()=>{
        if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(82+wave*24):{x:player.x,y:player.y},a=(wave%2?-.48:.36)+(deep?wave*.14:wave*.09),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,half=410,offsets=deep?[-104,104]:[wave===1?58:-34],width=deep?24:19;
        for(const offset of offsets){const cx=p.x+nx*offset,cy=p.y+ny*offset;rawLine(cx-dx*half,cy-dy*half,cx+dx*half,cy+dy*half,width,damage*(deep?.86:.78),deep?'#ff7bd5':'#78e5ff',1.08+wave*.06,'ion-shear');}
      });
    },
    bossProfile:{form:'nebula-heart',eventVariant:'stage02-heart',nameKey:'stage02.boss',warningKey:'stage02.boss.warning',r:64,hitRadius:92,contactRadius:64,hp:1.52,speed:.82,damage:1.08,color:'#ff8fd8',xp:1.95,skillCd:1.55,burstCd:4.4,pulseCd:6.7,spawnRadius:660,spawnShockwave:205},
    bossSkill:null
  });
})();