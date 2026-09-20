const DAMAGE_BUCKET_SECONDS=15;
const DAMAGE_OTHER_KEY='other';

function freshRunDamageStats(){
  return{total:0,byWeapon:Object.create(null),timeline:[],bucketSeconds:DAMAGE_BUCKET_SECONDS};
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
}

function runDamageSnapshot(){
  const stats=state.runDamage||freshRunDamageStats(),totalSeconds=Math.max(0,Number(state.time)||0),bucketSeconds=stats.bucketSeconds||DAMAGE_BUCKET_SECONDS,bucketCount=Math.max(1,stats.timeline.length,Math.ceil(totalSeconds/bucketSeconds));
  const timeline=Array.from({length:bucketCount},(_,index)=>{
    const start=index*bucketSeconds,available=Math.max(0,totalSeconds-start),duration=Math.max(1,Math.min(bucketSeconds,available||1)),damage=Number(stats.timeline[index])||0;
    return{start,end:Math.min(totalSeconds,(index+1)*bucketSeconds),damage,dps:damage/duration};
  });
  return{total:Number(stats.total)||0,averageDps:(Number(stats.total)||0)/Math.max(1,totalSeconds),peakDps:timeline.reduce((peak,entry)=>Math.max(peak,entry.dps),0),byWeapon:{...stats.byWeapon},timeline,bucketSeconds,totalSeconds};
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

function renderDamageBars(snapshot){
  const root=document.querySelector('#resultDamageBars');
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

function renderDamageTrend(snapshot){
  const svg=document.querySelector('#damageTrendChart'),startLabel=document.querySelector('#damageTrendStart'),endLabel=document.querySelector('#damageTrendEnd');
  if(!svg)return;
  svg.replaceChildren();svg.setAttribute('aria-label',tr('gameover.damage.trend'));
  if(startLabel)startLabel.textContent='00:00';if(endLabel)endLabel.textContent=formatTime(snapshot.totalSeconds);
  const width=600,height=160,left=8,right=8,top=8,bottom=8,plotWidth=width-left-right,plotHeight=height-top-bottom,baseline=height-bottom,maxDps=Math.max(1,...snapshot.timeline.map(entry=>entry.dps));
  for(let i=0;i<4;i++){const y=top+plotHeight*i/3;svg.appendChild(damageSvgNode('line',{x1:left,y1:y,x2:width-right,y2:y,class:'damage-trend-grid'}));}
  const samples=snapshot.timeline.map((entry,index)=>{
    const x=snapshot.timeline.length===1?left+plotWidth/2:left+plotWidth*index/(snapshot.timeline.length-1),y=top+plotHeight*(1-entry.dps/maxDps);
    return{x,y,dps:entry.dps};
  });
  let linePoints=samples;
  if(samples.length===1)linePoints=[{...samples[0],x:left},{...samples[0],x:width-right}];
  const linePath=linePoints.map((point,index)=>(index?'L':'M')+point.x.toFixed(2)+' '+point.y.toFixed(2)).join(' ');
  const areaPath='M '+left+' '+baseline+' '+linePoints.map(point=>'L '+point.x.toFixed(2)+' '+point.y.toFixed(2)).join(' ')+' L '+(width-right)+' '+baseline+' Z';
  svg.appendChild(damageSvgNode('path',{d:areaPath,class:'damage-trend-area'}));
  svg.appendChild(damageSvgNode('path',{d:linePath,class:'damage-trend-line'}));
  if(samples.length<=24)for(const point of samples)svg.appendChild(damageSvgNode('circle',{cx:point.x,cy:point.y,r:2.8,class:'damage-trend-point'}));
}

function renderRunDamageResults(){
  const snapshot=runDamageSnapshot(),total=document.querySelector('#resultDamageTotal'),average=document.querySelector('#resultDamageDps'),peak=document.querySelector('#resultPeakDps');
  if(total)total.textContent=formatDamageValue(snapshot.total);if(average)average.textContent=formatDamageValue(snapshot.averageDps);if(peak)peak.textContent=formatDamageValue(snapshot.peakDps);
  renderDamageBars(snapshot);renderDamageTrend(snapshot);
}

resetRunDamageStats();
const damageStatsResetBase=resetGame;
resetGame=function resetGameWithDamageStats(){resetRunDamageStats();return damageStatsResetBase();};
const damageStatsEndBase=endGame;
endGame=function endGameWithDamageStats(){const result=damageStatsEndBase();renderRunDamageResults();return result;};
window.stackfallDamageStats={snapshot:runDamageSnapshot,sourceKey:damageSourceWeaponKey};
