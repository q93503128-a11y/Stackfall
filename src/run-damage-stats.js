const DAMAGE_BUCKET_SECONDS=60;
const DAMAGE_OTHER_KEY='other';

function freshRunDamageStats(){
  return{total:0,byWeapon:Object.create(null),timeline:[],timelineByWeapon:Object.create(null),bucketSeconds:DAMAGE_BUCKET_SECONDS};
}

function resetRunDamageStats(){
  state.runDamage=freshRunDamageStats();
}

function canAttributeDamageTo(key){
  return key==='core'||weaponCount(key)>0;
}

function damageSourceWeaponKey(source){
  const value=String(source||'').toLowerCase();
  if(!value)return DAMAGE_OTHER_KEY;
  if(value==='nova-chain-burst'||value==='stellar-crown'||value==='singularity-shard'||value==='apex-core-awakening'||value.startsWith('trait-')||value.startsWith('apex-'))return DAMAGE_OTHER_KEY;
  const owned=(key,matched)=>matched&&canAttributeDamageTo(key)?key:null;
  return owned('blade',value==='wave'||value.includes('blade'))
    ||owned('ember',value==='star-spark'||value==='echo-star'||value==='ember'||value.startsWith('ember-'))
    ||owned('bulwark',value.includes('bulwark')||value.includes('barrier')||value.includes('aegis')||value.includes('fortress'))
    ||owned('gravity',value==='well'||value.includes('gravity'))
    ||owned('comet',value.includes('comet'))
    ||owned('prism',value.includes('prism'))
    ||owned('chrono',value.includes('chrono'))
    ||owned('arc',value.includes('arc'))
    ||owned('ion',value.includes('ion'))
    ||owned('nova',value.includes('nova'))
    ||owned('drone',value.includes('drone'))
    ||owned('rail',value.includes('rail'))
    ||owned('spiral',value.includes('spiral'))
    ||owned('mirror',value.includes('mirror')||value.includes('reflect'))
    ||owned('vacuum',value.includes('vacuum')||value.includes('bloom'))
    ||owned('mine',value.includes('phase-mine')||value.includes('phase-wire')||value.includes('phantom-mine'))
    ||owned('missile',value.includes('missile')||value.includes('mirv'))
    ||owned('gate',value.startsWith('gate-')||value.includes('orbital-gate'))
    ||owned('core',value==='core'||value.startsWith('core-'))
    ||DAMAGE_OTHER_KEY;
}

function registerRunDamage(amount,source){
  const damage=Number(amount);
  if(!Number.isFinite(damage)||damage<=0||state.mode==='menu'||state.mode==='gameover')return;
  if(!state.runDamage)resetRunDamageStats();
  const stats=state.runDamage,key=damageSourceWeaponKey(source),bucketSeconds=stats.bucketSeconds||DAMAGE_BUCKET_SECONDS,sampleTime=Math.max(0,(Number(state.time)||0)-1e-6),bucket=Math.max(0,Math.floor(sampleTime/bucketSeconds));
  stats.total+=damage;
  stats.byWeapon[key]=(stats.byWeapon[key]||0)+damage;
  stats.timeline[bucket]=(stats.timeline[bucket]||0)+damage;
  const weaponTimeline=stats.timelineByWeapon[key]||(stats.timelineByWeapon[key]=[]);
  weaponTimeline[bucket]=(weaponTimeline[bucket]||0)+damage;
}

function runDamageSnapshot(){
  const stats=state.runDamage||freshRunDamageStats(),totalSeconds=Math.max(0,Number(state.time)||0),bucketSeconds=stats.bucketSeconds||DAMAGE_BUCKET_SECONDS,bucketCount=Math.max(1,stats.timeline.length,Math.ceil(totalSeconds/bucketSeconds));
  const timeline=Array.from({length:bucketCount},(_,index)=>{
    const start=index*bucketSeconds,available=Math.max(0,totalSeconds-start),duration=Math.max(1,Math.min(bucketSeconds,available||1)),damage=Number(stats.timeline[index])||0;
    return{start,end:Math.min(totalSeconds,(index+1)*bucketSeconds),damage,dps:damage/duration};
  });
  const byWeaponTimeline={};
  for(const key of Object.keys(stats.timelineByWeapon||{})){
    const source=stats.timelineByWeapon[key]||[];
    byWeaponTimeline[key]=timeline.map((entry,index)=>({start:entry.start,end:entry.end,damage:Number(source[index])||0,dps:(Number(source[index])||0)/Math.max(1,entry.end-entry.start||1)}));
  }
  return{total:Number(stats.total)||0,averageDps:(Number(stats.total)||0)/Math.max(1,totalSeconds),peakDps:timeline.reduce((peak,entry)=>Math.max(peak,entry.dps),0),byWeapon:{...stats.byWeapon},timeline,byWeaponTimeline,bucketSeconds,totalSeconds};
}

function damageLocale(){
  const language=GAME_SETTINGS.language||'ko';
  return language==='zh-CN'?'zh-CN':language;
}

function formatDamageValue(value,compact=true){
  const number=Math.max(0,Number(value)||0);
  try{return new Intl.NumberFormat(damageLocale(),compact?{notation:'compact',maximumFractionDigits:1}:{maximumFractionDigits:0}).format(number);}
  catch{return Math.round(number).toLocaleString();}
}

function damageWeaponName(key){
  if(key===DAMAGE_OTHER_KEY)return tr('gameover.damage.other');
  return typeof weaponText==='function'&&WEAPONS[key]?weaponText(key).name:(WEAPONS[key]?.name||key);
}

function damageResultTarget(scope='gameover'){
  const stage=scope==='stage';
  return{
    scope:stage?'stage':'gameover',
    total:document.querySelector(stage?'#stageDamageTotal':'#resultDamageTotal'),
    average:document.querySelector(stage?'#stageDamageDps':'#resultDamageDps'),
    peak:document.querySelector(stage?'#stagePeakDps':'#resultPeakDps'),
    bars:document.querySelector(stage?'#stageDamageBars':'#resultDamageBars'),
    trend:document.querySelector(stage?'#stageDamageTrendChart':'#damageTrendChart'),
    trendStart:document.querySelector(stage?'#stageDamageTrendStart':'#damageTrendStart'),
    trendEnd:document.querySelector(stage?'#stageDamageTrendEnd':'#damageTrendEnd'),
    toggleId:stage?'stageDamageTrendToggles':'damageTrendToggles'
  };
}
function renderDamageBars(snapshot,target=damageResultTarget()){
  const root=target.bars;
  if(!root)return;
  root.replaceChildren();
  const ranked=Object.entries(snapshot.byWeapon).filter(([,damage])=>Number(damage)>0).sort((a,b)=>b[1]-a[1]);
  if(!ranked.length){
    const empty=document.createElement('div');empty.className='damage-empty';empty.textContent=tr('gameover.damage.empty');root.appendChild(empty);return;
  }
  const mvp=ranked.find(([key])=>key!==DAMAGE_OTHER_KEY)?.[0]||null,total=Math.max(1,snapshot.total);
  for(const[key,damage]of ranked){
    const share=damage/total*100,row=document.createElement('div'),head=document.createElement('div'),name=document.createElement('div'),dot=document.createElement('i'),label=document.createElement('span'),value=document.createElement('b'),percent=document.createElement('span'),track=document.createElement('div'),fill=document.createElement('div'),color=WEAPONS[key]?.color||'#8b96b8';
    row.className='damage-row';row.style.setProperty('--damage-color',color);row.setAttribute('aria-label',damageWeaponName(key)+' '+formatDamageValue(damage,false)+' '+share.toFixed(1)+'%');
    head.className='damage-row-head';name.className='damage-row-name';label.textContent=damageWeaponName(key);name.append(dot,label);
    if(key===mvp){const badge=document.createElement('em');badge.className='damage-mvp';badge.textContent=tr('gameover.damage.mvp');name.appendChild(badge);}
    value.className='damage-row-value';value.textContent=formatDamageValue(damage);percent.className='damage-row-share';percent.textContent=share.toFixed(1)+'%';
    track.className='damage-bar-track';fill.className='damage-bar-fill';fill.style.width=share.toFixed(3)+'%';track.appendChild(fill);
    head.append(name,value,percent);row.append(head,track);root.appendChild(row);
  }
}

function damageSvgNode(name,attrs={}){
  const node=document.createElementNS('http://www.w3.org/2000/svg',name);
  for(const[key,value]of Object.entries(attrs))node.setAttribute(key,String(value));
  return node;
}

const damageTrendHidden=new Set();
let lastDamageTrendSnapshot=null;

function damageTrendColor(key){
  if(key==='total')return'#7ce8ff';
  if(key===DAMAGE_OTHER_KEY)return'#8b96b8';
  return WEAPONS[key]?.color||'#b9c4df';
}
function ensureDamageTrendControls(snapshot,target=damageResultTarget()){
  const svg=target.trend;if(!svg)return;
  let root=document.querySelector('#'+target.toggleId);
  if(!root){root=document.createElement('div');root.id=target.toggleId;root.className='damage-trend-toggles';svg.before(root);}
  root.replaceChildren();
  const rows=[['total',tr('gameover.damage.total')],...Object.entries(snapshot.byWeapon).filter(([,damage])=>Number(damage)>0).sort((a,b)=>b[1]-a[1]).map(([key])=>[key,damageWeaponName(key)])];
  for(const[key,label]of rows){
    const button=document.createElement('button'),dot=document.createElement('i'),text=document.createElement('span'),visible=!damageTrendHidden.has(key);
    button.type='button';button.className='damage-trend-toggle'+(visible?'':' off');button.style.setProperty('--trend-color',damageTrendColor(key));button.dataset.trendKey=key;button.setAttribute('aria-pressed',visible?'true':'false');button.title=visible?'그래프 숨기기':'그래프 표시';
    text.textContent=label;button.append(dot,text);button.addEventListener('click',()=>{if(damageTrendHidden.has(key))damageTrendHidden.delete(key);else damageTrendHidden.add(key);button.classList.toggle('off',damageTrendHidden.has(key));button.setAttribute('aria-pressed',damageTrendHidden.has(key)?'false':'true');renderDamageTrend(lastDamageTrendSnapshot||snapshot,false,target.scope);});
    root.appendChild(button);
  }
}
function damageTrendSamples(timeline,maxDps,left,plotWidth,top,plotHeight){
  return timeline.map((entry,index)=>({x:timeline.length===1?left+plotWidth/2:left+plotWidth*index/(timeline.length-1),y:top+plotHeight*(1-entry.dps/maxDps),dps:entry.dps}));
}
function damageTrendPath(samples,left,right){
  let points=samples;if(samples.length===1)points=[{...samples[0],x:left},{...samples[0],x:right}];
  return{points,line:points.map((point,index)=>(index?'L':'M')+point.x.toFixed(2)+' '+point.y.toFixed(2)).join(' ')};
}
function renderDamageTrend(snapshot,rebuildControls=true,scope='gameover'){
  if(!snapshot)return;lastDamageTrendSnapshot=snapshot;
  const target=damageResultTarget(scope),svg=target.trend,startLabel=target.trendStart,endLabel=target.trendEnd;
  if(!svg)return;if(rebuildControls)ensureDamageTrendControls(snapshot,target);
  svg.replaceChildren();svg.setAttribute('aria-label',tr('gameover.damage.trend'));
  if(startLabel)startLabel.textContent='00:00';if(endLabel)endLabel.textContent=formatTime(snapshot.totalSeconds);
  const width=600,height=160,left=8,right=8,top=8,bottom=8,plotWidth=width-left-right,plotHeight=height-top-bottom,baseline=height-bottom;
  const series=[{key:'total',timeline:snapshot.timeline},...Object.keys(snapshot.byWeaponTimeline||{}).map(key=>({key,timeline:snapshot.byWeaponTimeline[key]}))].filter(row=>!damageTrendHidden.has(row.key));
  const maxDps=Math.max(1,...series.flatMap(row=>row.timeline.map(entry=>entry.dps)));
  for(let i=0;i<4;i++){const y=top+plotHeight*i/3;svg.appendChild(damageSvgNode('line',{x1:left,y1:y,x2:width-right,y2:y,class:'damage-trend-grid'}));}
  for(const row of series){
    const samples=damageTrendSamples(row.timeline,maxDps,left,plotWidth,top,plotHeight),path=damageTrendPath(samples,left,width-right);
    if(row.key==='total'){
      const areaPath='M '+left+' '+baseline+' '+path.points.map(point=>'L '+point.x.toFixed(2)+' '+point.y.toFixed(2)).join(' ')+' L '+(width-right)+' '+baseline+' Z';
      svg.appendChild(damageSvgNode('path',{d:areaPath,class:'damage-trend-area'}));
      svg.appendChild(damageSvgNode('path',{d:path.line,class:'damage-trend-line'}));
      if(samples.length<=24)for(const point of samples)svg.appendChild(damageSvgNode('circle',{cx:point.x,cy:point.y,r:2.6,class:'damage-trend-point'}));
    }else{
      svg.appendChild(damageSvgNode('path',{d:path.line,class:'damage-trend-series',stroke:damageTrendColor(row.key),'data-trend-key':row.key}));
    }
  }
}
function renderRunDamageResults(scope='gameover'){
  const snapshot=runDamageSnapshot(),target=damageResultTarget(scope);
  if(target.total)target.total.textContent=formatDamageValue(snapshot.total);if(target.average)target.average.textContent=formatDamageValue(snapshot.averageDps);if(target.peak)target.peak.textContent=formatDamageValue(snapshot.peakDps);
  damageTrendHidden.clear();renderDamageBars(snapshot,target);renderDamageTrend(snapshot,true,target.scope);
}

resetRunDamageStats();
registerResetGameInterceptor('run-damage-stats.js:resetGameWithDamageStats',function resetGameWithDamageStats(next,...args){resetRunDamageStats();return next();});
registerEndGameInterceptor('run-damage-stats.js:endGameWithDamageStats',function endGameWithDamageStats(next,...args){const result=next();renderRunDamageResults('gameover');return result;});
window.stackfallRenderRunDamageResults=scope=>renderRunDamageResults(scope);
window.stackfallDamageStats={snapshot:runDamageSnapshot,sourceKey:damageSourceWeaponKey};
