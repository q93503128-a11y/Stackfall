(()=>{
  const freeze=value=>Object.freeze(value);
  const freezeRows=rows=>freeze((rows||[]).map(row=>freeze({...row})));
  const createConstellation=definition=>freeze({id:String(definition.id),order:Number(definition.order),title:freeze({...definition.title}),description:freeze({...definition.description})});
  const createStage=definition=>freeze({
    id:String(definition.id),order:Number(definition.order),constellationId:String(definition.constellationId),status:definition.status||'planned',
    title:freeze({...definition.title}),description:freeze({...definition.description}),durationSeconds:Number(definition.durationSeconds||definition.estimatedMinutes*60),estimatedMinutes:Number(definition.estimatedMinutes),threat:Number(definition.threat),node:freeze({...definition.node}),requirements:freeze({...definition.requirements}),
    discoveries:freeze({gimmicks:freeze([...(definition.discoveries?.gimmicks||[])]),weapons:freeze([...(definition.discoveries?.weapons||[])]),events:freeze([...(definition.discoveries?.events||[])])}),
    enemySet:freezeRows(definition.enemySet),fixedEvents:freezeRows(definition.fixedEvents),boss:definition.boss?freeze({...definition.boss}):null,rewards:freezeRows(definition.rewards),challenges:freezeRows(definition.challenges)
  });
  const constellations=freeze([
    createConstellation({id:'constellation-01',order:1,title:{ko:'파편의 항로',en:'Shardway'},description:{ko:'붕괴한 전초선에서 유리별 묘역까지 이어지는 첫 항로.',en:'The first route, from the collapsed frontier to the Glassstar Necropolis.'}})
  ]);
  const catalog=freeze([
    createStage({
      id:'stage-01',order:1,constellationId:'constellation-01',status:'available',title:{ko:'붕괴 전초구역',en:'Collapse Frontier'},description:{ko:'부서진 항로의 최전선. 파편 군집이 시간에 따라 새로운 전투 개체를 투입하며, 정해진 붕괴 파동을 버틴 뒤 전초 수호자를 격파해야 한다.',en:'A broken frontier route. New fragment hosts enter the battle on a fixed timeline; survive the collapse pulses and defeat the frontier warden.'},durationSeconds:600,estimatedMinutes:10,threat:1,node:{x:.18,y:.54},requirements:{previous:null},
      discoveries:{gimmicks:['collapse-pulse'],weapons:['comet'],events:['shard-rush','bombardment','warden-line']},
      enemySet:[{id:'shardling',type:'grunt',unlockAt:0},{id:'dart',type:'fast',unlockAt:90},{id:'bombardier',type:'ranged',unlockAt:210},{id:'bulwark',type:'tank',unlockAt:330}],
      fixedEvents:[{id:'shard-rush',at:90,kind:'wave',variant:'dart',count:7},{id:'bombardment',at:210,kind:'wave',variant:'bombardier',count:5},{id:'collapse-pulse-a',at:300,kind:'hazard',variant:'collapse-pulse'},{id:'warden-line',at:420,kind:'wave',variant:'bulwark',count:4},{id:'collapse-pulse-b',at:500,kind:'hazard',variant:'collapse-pulse'},{id:'final-boss',at:600,kind:'boss',variant:'collapse-warden'}],
      boss:{id:'collapse-warden',spawnAt:600,name:{ko:'붕괴의 전초 수호자',en:'Collapse Frontier Warden'}},rewards:[{type:'weapon',key:'comet'},{type:'currency',key:'stardust',amount:140},{type:'currency',key:'coreShard',amount:1,firstClearOnly:true}],challenges:[{id:'clear',type:'clear'}]
    }),
    createStage({
      id:'stage-02',order:2,constellationId:'constellation-01',status:'available',title:{ko:'이온 성운 해구',en:'Ion Nebula Trench'},description:{ko:'전리된 성운이 항로를 집어삼킨 구역. 기존 파편 개체 사이로 성운 유영체가 나타나며, 주기적으로 전장을 가르는 이온 전단을 버틴 뒤 성운의 심장을 파괴해야 한다.',en:'An ionized nebula has swallowed the route. Familiar fragment hosts mix with new nebula wisps; survive repeated ion shears and destroy the Nebula Heart.'},durationSeconds:600,estimatedMinutes:10,threat:2,node:{x:.34,y:.38},requirements:{previous:'stage-01'},
      discoveries:{gimmicks:['ion-shear'],weapons:['arc'],events:['wisp-bloom','ion-storm','deep-shear']},
      enemySet:[{id:'shardling',type:'grunt',unlockAt:0},{id:'dart',type:'fast',unlockAt:0},{id:'nebula-wisp',type:'ranged',unlockAt:120},{id:'bombardier',type:'ranged',unlockAt:240},{id:'bulwark',type:'tank',unlockAt:420}],
      fixedEvents:[{id:'ion-shear-a',at:120,kind:'hazard',variant:'ion-shear'},{id:'wisp-bloom',at:220,kind:'wave',variant:'nebula-wisp',count:7},{id:'ion-shear-b',at:330,kind:'hazard',variant:'ion-shear'},{id:'bombardment',at:450,kind:'wave',variant:'bombardier',count:6},{id:'deep-shear',at:530,kind:'hazard',variant:'deep-shear'},{id:'final-boss',at:600,kind:'boss',variant:'nebula-heart'}],
      boss:{id:'nebula-heart',spawnAt:600,name:{ko:'성운의 심장',en:'Nebula Heart'}},rewards:[{type:'weapon',key:'arc'},{type:'currency',key:'stardust',amount:180},{type:'currency',key:'coreShard',amount:1,firstClearOnly:true}],challenges:[{id:'clear',type:'clear'}]
    }),
    createStage({
      id:'stage-03',order:3,constellationId:'constellation-01',status:'available',title:{ko:'유리별 묘역',en:'Glassstar Necropolis'},description:{ko:'결정화된 별의 잔해가 거대한 묘비처럼 떠도는 항로. 유리날개 군집과 굴절 격자를 돌파하고 묘역 중심의 굴절 성물함을 파괴해야 한다.',en:'Crystallized stellar remains drift like vast grave markers. Break through glasswing swarms and refraction lattices, then destroy the Refracted Reliquary at the center.'},durationSeconds:600,estimatedMinutes:10,threat:3,node:{x:.53,y:.61},requirements:{previous:'stage-02'},
      discoveries:{gimmicks:['refraction-lattice'],weapons:['prism'],events:['glasswing-swarm','prism-rain','deep-refraction']},
      enemySet:[{id:'shardling',type:'grunt',unlockAt:0},{id:'dart',type:'fast',unlockAt:0},{id:'nebula-wisp',type:'ranged',unlockAt:0},{id:'glass-wing',type:'fast',unlockAt:140},{id:'bombardier',type:'ranged',unlockAt:320},{id:'bulwark',type:'tank',unlockAt:440}],
      fixedEvents:[{id:'glasswing-swarm',at:140,kind:'wave',variant:'glass-wing',count:8},{id:'refraction-lattice-a',at:260,kind:'hazard',variant:'refraction-lattice'},{id:'wisp-procession',at:380,kind:'wave',variant:'nebula-wisp',count:8},{id:'prism-rain',at:490,kind:'hazard',variant:'prism-rain'},{id:'deep-refraction',at:555,kind:'hazard',variant:'deep-refraction'},{id:'final-boss',at:600,kind:'boss',variant:'prism-reliquary'}],
      boss:{id:'prism-reliquary',spawnAt:600,name:{ko:'굴절 성물함',en:'Refracted Reliquary'}},rewards:[{type:'weapon',key:'prism'},{type:'currency',key:'stardust',amount:220},{type:'currency',key:'coreShard',amount:1,firstClearOnly:true}],challenges:[{id:'clear',type:'clear'}]
    })
  ]);
  window.STACKFALL_STAGE_SCHEMA_VERSION=3;window.STACKFALL_CONSTELLATIONS=constellations;window.STACKFALL_STAGE_CATALOG=catalog;window.stackfallStageById=id=>catalog.find(stage=>stage.id===id)||null;window.stackfallConstellationById=id=>constellations.find(page=>page.id===id)||null;
})();