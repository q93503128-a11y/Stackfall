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
    onStart(api){clearStagePhysicalObjects();api.run.nebula={pressure:0,depth:0,arterial:0,heartbeat:0};},
    hazard(event,api){
      const deep=event.variant==='deep-shear';showBossNotice(deep?tr('stage02.event.deep'):tr('stage02.event.shear'),tr('stage02.event.warning'));const waves=deep?4:3,damage=9+Math.min(11,state.level*.30),origin={x:player.x,y:player.y};
      for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(deep?500:610),()=>{
        if(!api.isActive()||api.run.bossIntroPending||api.run.bossSpawned)return;const a=(wave%2?-.48:.36)+(deep?wave*.14:wave*.09),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,cx=origin.x+nx*(wave-1)*44,cy=origin.y+ny*(wave-1)*44;
        addStagePhysicalObject({kind:'ion-front',x:cx-nx*135,y:cy-ny*135,fromX:cx-nx*135,fromY:cy-ny*135,toX:cx+nx*135,toY:cy+ny*135,hw:compactDevice()?250:410,hh:deep?17:13,angle:a,a,warn:1.08,travel:.88,hold:0,damage:damage*(deep?.86:.78)*stackfallStageEnvironmentCombatScale({order:2,progress:api.progress}).damage,deep});
      });
    },
    bossProfile:{form:'nebula-heart',eventVariant:'stage02-heart',nameKey:'stage02.boss',warningKey:'stage02.boss.warning',r:64,hitRadius:92,contactRadius:64,hp:1.52,speed:.82,damage:1.08,color:'#ff8fd8',xp:1.95,skillCd:1.55,burstCd:4.4,pulseCd:6.7,spawnRadius:660,spawnShockwave:205},
    bossSkill:null
  });
})();