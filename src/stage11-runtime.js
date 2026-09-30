(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  window.stackfallRegisterStageRuntime('stage-11',{
    theme:'stage-11',objectiveKey:'stage11.objective.boss',fixedEventKey:'stage11.event.fixed',initialSpawnTimer:.40,spawnRadius:760,spawnRadiusMin:76,spawnRadiusMax:172,burstRadiusMin:680,burstRadiusMax:885,startingVariants:['rootlance','spiral-pod','rootlance'],
    variants:{
      rootlance:{type:'fast',color:'#ef9ab7',hp:1.22,speed:1.45,damage:1.26,r:1.00,xp:1.39,name:'stage08.enemy.rootlance'},
      'spiral-pod':{type:'ranged',color:'#c99cff',hp:1.30,speed:1.08,damage:1.26,r:1.07,xp:1.44,name:'stage09.enemy.spiralPod',rangedMin:.46,rangedMax:.80},
      'husk-warden':{type:'tank',color:'#e1b06c',hp:1.92,speed:.90,damage:1.30,r:1.14,xp:1.58,name:'stage11.enemy.huskWarden'},
      'abyss-spore':{type:'ranged',color:'#aa72e0',hp:1.27,speed:1.11,damage:1.25,r:1.05,xp:1.41,name:'stage07.enemy.abyssSpore',rangedMin:.47,rangedMax:.82},
      'conduit-leech':{type:'tank',color:'#6fc1b5',hp:1.74,speed:1.00,damage:1.27,r:1.06,xp:1.50,name:'stage05.enemy.conduitLeech'}
    },
    poolAt(time){if(time<130)return[['rootlance',.50],['spiral-pod',.50]];if(time<300)return[['rootlance',.25],['spiral-pod',.32],['husk-warden',.43]];if(time<440)return[['rootlance',.20],['spiral-pod',.29],['husk-warden',.34],['abyss-spore',.17]];return[['rootlance',.18],['spiral-pod',.27],['husk-warden',.31],['abyss-spore',.15],['conduit-leech',.09]];},
    spawnProfile(time){return{cap:time>=440?72:time>=300?64:54,rate:Math.max(.31,.83-time*.00088),count:time>=390?2:time>=190&&Math.random()<.68?2:1};},
    waveLabel(event){return event.variant==='husk-warden'?tr('stage11.event.wardenColumn'):tr('stage11.event.podColumn');},
    hazard(event,api){const damage=18+Math.min(20,state.level*.41),variant=event.variant;
      if(variant==='seed-mortar'){showBossNotice(tr('stage11.event.mortar'),tr('stage11.event.warning'));for(let wave=0;wave<5;wave++)scheduleWeaponAction(wave*340,()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(105+wave*25):{x:player.x,y:player.y};for(let i=0;i<7;i++){const a=i/7*TAU+wave*.40,r=58+(i%3)*44;addCircle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,36+wave*3,damage*(.56+wave*.075),i%2?'#e6b66d':'#c993ff',.76+wave*.04);}});return;}
      const bulk=variant==='living-bulkhead',waves=bulk?6:4;showBossNotice(bulk?tr('stage11.event.bulkhead'):tr('stage11.event.crush'),tr('stage11.event.warning'));for(let wave=0;wave<waves;wave++)scheduleWeaponAction(wave*(bulk?290:420),()=>{if(!api.isActive())return;const p=typeof predictedPlayer==='function'?predictedPlayer(150+wave*30):{x:player.x,y:player.y},half=bulk?440:380,gap=Math.max(38,64-wave*3),offset=(wave-(waves-1)/2)*(bulk?34:42);rawLine(p.x-half,p.y+offset,p.x-gap,p.y+offset,bulk?25:20,damage*(bulk?1.04:.87),'#e6b56c',.83+wave*.04,'boss-line');rawLine(p.x+gap,p.y+offset,p.x+half,p.y+offset,bulk?25:20,damage*(bulk?1.04:.87),'#c995ff',.83+wave*.04,'boss-line');if(bulk){rawLine(p.x+offset,p.y-half,p.x+offset,p.y-gap,22,damage*.92,'#8fd8c6',.87,'boss-line');rawLine(p.x+offset,p.y+gap,p.x+offset,p.y+half,22,damage*.92,'#8fd8c6',.87,'boss-line');}});
    },
    bossProfile:{form:'seedvault-custodian',eventVariant:'stage11-custodian',nameKey:'stage11.boss',warningKey:'stage11.boss.warning',r:86,hp:3.62,speed:.63,damage:1.44,color:'#e4b36c',xp:3.4,skillCd:.94,burstCd:2.80,pulseCd:4.45,spawnRadius:725,spawnShockwave:300},
    bossSkill:null
  });
})();