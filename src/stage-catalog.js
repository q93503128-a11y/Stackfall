(()=>{
  const freeze=value=>Object.freeze(value);
  const createStage=definition=>freeze({
    id:String(definition.id),
    order:Number(definition.order),
    status:definition.status||'planned',
    title:freeze({...definition.title}),
    description:freeze({...definition.description}),
    estimatedMinutes:Number(definition.estimatedMinutes),
    threat:Number(definition.threat),
    node:freeze({...definition.node}),
    requirements:freeze({...definition.requirements}),
    discoveries:freeze({
      gimmicks:freeze([...(definition.discoveries?.gimmicks||[])]),
      weapons:freeze([...(definition.discoveries?.weapons||[])]),
      events:freeze([...(definition.discoveries?.events||[])])
    }),
    enemySet:freeze([...(definition.enemySet||[])]),
    fixedEvents:freeze([...(definition.fixedEvents||[])]),
    boss:definition.boss?freeze({...definition.boss}):null,
    rewards:freeze([...(definition.rewards||[])]),
    challenges:freeze([...(definition.challenges||[])])
  });
  const catalog=freeze([
    createStage({
      id:'stage-01',
      order:1,
      status:'planned',
      title:{ko:'STAGE 1',en:'STAGE 1'},
      description:{ko:'첫 유한 작전. 고유 적군·기믹·고정 이벤트·보스 구성은 STAGE 1 구현 단계에서 확정한다.',en:'The first finite operation. Its enemy set, gimmicks, fixed events and boss are finalized with the Stage 1 implementation.'},
      estimatedMinutes:10,
      threat:1,
      node:{x:.18,y:.54},
      requirements:{previous:null},
      discoveries:{gimmicks:[],weapons:[],events:[]},
      enemySet:[],
      fixedEvents:[],
      boss:null,
      rewards:[],
      challenges:[]
    })
  ]);
  window.STACKFALL_STAGE_SCHEMA_VERSION=1;
  window.STACKFALL_STAGE_CATALOG=catalog;
  window.stackfallStageById=id=>catalog.find(stage=>stage.id===id)||null;
})();
