(()=>{
  const freeze=value=>Object.freeze(value);
  const freezeRows=rows=>freeze((rows||[]).map(row=>freeze({...row})));
  const createStage=definition=>freeze({
    id:String(definition.id),
    order:Number(definition.order),
    status:definition.status||'planned',
    title:freeze({...definition.title}),
    description:freeze({...definition.description}),
    durationSeconds:Number(definition.durationSeconds||definition.estimatedMinutes*60),
    estimatedMinutes:Number(definition.estimatedMinutes),
    threat:Number(definition.threat),
    node:freeze({...definition.node}),
    requirements:freeze({...definition.requirements}),
    discoveries:freeze({
      gimmicks:freeze([...(definition.discoveries?.gimmicks||[])]),
      weapons:freeze([...(definition.discoveries?.weapons||[])]),
      events:freeze([...(definition.discoveries?.events||[])])
    }),
    enemySet:freezeRows(definition.enemySet),
    fixedEvents:freezeRows(definition.fixedEvents),
    boss:definition.boss?freeze({...definition.boss}):null,
    rewards:freezeRows(definition.rewards),
    challenges:freezeRows(definition.challenges)
  });
  const catalog=freeze([
    createStage({
      id:'stage-01',
      order:1,
      status:'available',
      title:{ko:'붕괴 전초구역',en:'Collapse Frontier'},
      description:{ko:'부서진 항로의 최전선. 파편 군집이 시간에 따라 새로운 전투 개체를 투입하며, 정해진 붕괴 파동을 버틴 뒤 전초 수호자를 격파해야 한다.',en:'A broken frontier route. New fragment hosts enter the battle on a fixed timeline; survive the collapse pulses and defeat the frontier warden.'},
      durationSeconds:600,
      estimatedMinutes:10,
      threat:1,
      node:{x:.18,y:.54},
      requirements:{previous:null},
      discoveries:{gimmicks:['collapse-pulse'],weapons:['comet'],events:['shard-rush','bombardment','warden-line']},
      enemySet:[
        {id:'shardling',type:'grunt',unlockAt:0},
        {id:'dart',type:'fast',unlockAt:90},
        {id:'bombardier',type:'ranged',unlockAt:210},
        {id:'bulwark',type:'tank',unlockAt:330}
      ],
      fixedEvents:[
        {id:'shard-rush',at:90,kind:'wave',variant:'dart',count:7},
        {id:'bombardment',at:210,kind:'wave',variant:'bombardier',count:5},
        {id:'collapse-pulse-a',at:300,kind:'hazard',variant:'collapse-pulse'},
        {id:'warden-line',at:420,kind:'wave',variant:'bulwark',count:4},
        {id:'collapse-pulse-b',at:500,kind:'hazard',variant:'collapse-pulse'},
        {id:'final-boss',at:600,kind:'boss',variant:'collapse-warden'}
      ],
      boss:{id:'collapse-warden',spawnAt:600,name:{ko:'붕괴의 전초 수호자',en:'Collapse Frontier Warden'}},
      rewards:[{type:'weapon',key:'comet'},{type:'currency',key:'stardust',amount:140},{type:'currency',key:'coreShard',amount:1,firstClearOnly:true}],
      challenges:[{id:'clear',type:'clear'}]
    })
  ]);
  window.STACKFALL_STAGE_SCHEMA_VERSION=2;
  window.STACKFALL_STAGE_CATALOG=catalog;
  window.stackfallStageById=id=>catalog.find(stage=>stage.id===id)||null;
})();
