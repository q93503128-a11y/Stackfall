if(!WEAPONS.core){
  WEAPONS.core={
    name:'코어 펄스',icon:'✷',color:'#eafcff',role:'기본 무기',desc:'가까운 적을 자동 추적하는 기본 광자 무기.',
    starter:false,basic:true,resonance:{}
  };
}
WEAPON_TEXT.core={
  ko:['코어 펄스','기본 무기','가까운 적을 자동 추적하는 기본 광자 무기.'],
  en:['Core Pulse','Basic Weapon','An automatic photon weapon that tracks the nearest enemy.'],
  ja:['コアパルス','基本武器','最も近い敵を自動追尾する基本光子武器。'],
  'zh-CN':['核心脉冲','基础武器','自动追踪最近敌人的基础光子武器。'],
  es:['Pulso del Núcleo','Arma básica','Arma fotónica básica que rastrea automáticamente al enemigo más cercano.'],
  fr:['Impulsion du Noyau','Arme de base','Arme photonique de base qui suit automatiquement l’ennemi le plus proche.']
};
if(!WEAPONS.arc){
  WEAPONS.arc={
    name:'성운 부메랑',icon:'☾',color:'#69ffe0',role:'공격 / 곡선',
    desc:'표적을 크게 휘어 베고 선회한 뒤 플레이어에게 귀환하는 성운 칼날.',starter:true,resonance:{}
  };
}
WEAPON_TEXT.arc={
  ko:['성운 부메랑','공격 / 곡선','표적을 크게 휘어 베고 선회한 뒤 플레이어에게 귀환하는 성운 칼날.'],
  en:['Nebula Boomerang','Attack / Curved','A nebula blade that curves through its target, turns, and returns to the player.'],
  ja:['星雲ブーメラン','攻撃 / 曲線','標的を大きく回り込んで斬り、旋回してプレイヤーへ戻る星雲の刃。'],
  'zh-CN':['星云回旋刃','攻击 / 曲线','大幅绕向目标斩击，转向后返回玩家身边的星云刀刃。'],
  es:['Bumerán de Nébula','Ataque / Curvo','Una hoja nebular que rodea al objetivo, gira y regresa al jugador.'],
  fr:['Boomerang Nébulaire','Attaque / Courbe','Une lame nébulaire qui contourne sa cible, vire puis revient vers le joueur.']
};
WEAPONS.comet.icon='⟐';
state.entities.beams=state.entities.beams||[];
player.bulwarkCd=0;player.arcCd=player.arcCd||0;
for(const[key,weapon]of Object.entries(WEAPONS)){weapon.key=key;weapon.stackEffects=STACK_EFFECTS[key]||[];}
for(const[key,passive]of Object.entries(PASSIVES))passive.key=key;
const runtimeDamageBase=damageMult;
damageMult=function damageWithApexGrowth(){return runtimeDamageBase()*(1+(state.apexBoons?.starforge||0)*.08);};
damageReduction=function damageReductionWithStacks(){const armor=stat('armor')*.075,bulwark=weaponCount('bulwark')*.034+(weaponCount('bulwark')>=5?.05:0),constellation=(state.apexBoons?.lastconstellation||0)*.02;return clamp(armor+bulwark+constellation,0,.78);};
hasteMult=function hasteWithChronoAndNebula(){const chrono=weaponCount('chrono'),chronoBonus=chrono>=6?.18:chrono>=3?.08:0,nebula=(state.nebulaBoosts?.haste||0)*.08,apex=(state.apexBoons?.chronophage||0)*.025;return Math.max(.15,1-stat('haste')*.10-chronoBonus-nebula-apex);};

function audioVolume(channel){
  const volumes=GAME_SETTINGS.audio?.volume||{};
  const shape=value=>{const v=Math.max(0,Math.min(1,Number(value)||0));return v<=0?0:Math.pow(v,.58);};
  return shape(volumes.master??.90)*shape(volumes[channel]??(channel==='ambient'?.58:.86));
}
const rawAudioInit=audio.init.bind(audio);
audio.ambientNodes=[];audio.ambientMaster=null;audio.ambientTimer=null;audio.ambientStep=0;audio.outputNode=null;audio.echoInput=null;audio.lastHitAt=0;audio.lastEnemyImpactAt=0;
audio.ensureOutput=function ensureCosmicOutput(){
  if(this.outputNode)return;
  const output=this.ctx.createGain(),compressor=this.ctx.createDynamicsCompressor();
  compressor.threshold.value=-18;compressor.knee.value=20;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.28;
  output.gain.value=1.38;output.connect(compressor).connect(this.ctx.destination);
  const echoInput=this.ctx.createGain(),delay=this.ctx.createDelay(.6),feedback=this.ctx.createGain(),filter=this.ctx.createBiquadFilter(),wet=this.ctx.createGain();
  delay.delayTime.value=.145;feedback.gain.value=.16;filter.type='lowpass';filter.frequency.value=2700;wet.gain.value=.24;
  echoInput.connect(delay);delay.connect(filter);filter.connect(wet).connect(output);filter.connect(feedback).connect(delay);
  this.outputNode=output;this.echoInput=echoInput;this.fxNodes=[compressor,delay,feedback,filter,wet];
};
audio.init=function initAudioWithSettings(){
  rawAudioInit();
  if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
  this.ensureOutput();
  this.syncAmbient();
};
audio.allowed=function allowed(channel){return GAME_SETTINGS.audio.master!==false&&GAME_SETTINGS.audio[channel]!==false&&audioVolume(channel)>.001;};
audio.playChannel=function playCosmicChannel(channel,freq,duration=.06,type='sine',volume=.025,slide=0,pan=0){
  if(!this.allowed(channel))return;
  rawAudioInit();this.ensureOutput();
  const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();
  const panner=typeof this.ctx.createStereoPanner==='function'?this.ctx.createStereoPanner():null;
  const scaled=volume*audioVolume(channel)*5.65;
  o.type=type;o.detune.value=rand(-5,5);o.frequency.setValueAtTime(Math.max(30,freq),t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+duration);
  filter.type=type==='square'||type==='sawtooth'?'lowpass':'bandpass';filter.frequency.value=Math.max(150,Math.min(6800,freq*3.1));filter.Q.value=type==='sine'?.75:.58;
  g.gain.setValueAtTime(Math.max(.0001,scaled),t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  if(panner){panner.pan.value=clamp(pan+rand(-.10,.10),-1,1);o.connect(filter).connect(g).connect(panner);panner.connect(this.outputNode);panner.connect(this.echoInput);}
  else{o.connect(filter).connect(g);g.connect(this.outputNode);g.connect(this.echoInput);}
  o.start(t);o.stop(t+duration+.03);
};
audio.tone=function(freq,duration=.06,type='sine',volume=.025,slide=0){this.playChannel('combat',freq,duration,type,volume,slide);};
audio.hit=function(strong=false){
  const now=performance.now();if(!strong&&now-this.lastHitAt<22)return;this.lastHitAt=now;
  this.playChannel('combat',strong?96:168,strong?.15:.06,strong?'sawtooth':'triangle',strong?.060:.025,strong?-46:-76,strong?.18:0);
  if(strong)this.playChannel('combat',760,.09,'sine',.017,-330,-.18);
};
audio.enemyImpact=function enemyImpact(strength=1){
  const now=performance.now();if(now-this.lastEnemyImpactAt<85)return;this.lastEnemyImpactAt=now;
  const s=clamp(strength,.6,1.8);this.playChannel('combat',54,.34,'sawtooth',.070*s,-18,-.18);
  this.playChannel('combat',108,.18,'square',.038*s,-62,.18);this.playChannel('combat',640,.08,'triangle',.015*s,-350,0);
};
audio.hurt=function(){this.playChannel('combat',72,.24,'sawtooth',.068,-35,-.16);this.playChannel('combat',270,.15,'triangle',.024,-170,.18);};
audio.pickup=function(){this.playChannel('ui',760,.075,'sine',.026,310,rand(-.28,.28));};
audio.level=function(){
  this.playChannel('ui',52,.72,'sine',.080,28,0);this.playChannel('ui',78,.52,'triangle',.052,42,-.20);
  const notes=[110,165,247,370,554];notes.forEach((f,i)=>setTimeout(()=>{this.playChannel('ui',f,.34+i*.025,i<2?'triangle':'sine',.043,95+i*20,(i-2)*.11);if(i===4)this.playChannel('ui',f*2,.48,'sine',.020,-180,.18);},i*105));
};
audio.resonance=function(){[118,177,266,399,598,897].forEach((f,i)=>setTimeout(()=>this.playChannel('ui',f,.34,i<2?'sawtooth':'triangle',.040,190,(i-2.5)*.1),i*68));};
audio.boss=function(){[52,78,117,175].forEach((f,i)=>setTimeout(()=>this.playChannel('combat',f,.68,'sawtooth',.057,72,(i-1.5)*.16),i*135));};
audio.stopAmbient=function(){
  if(this.ambientTimer){clearInterval(this.ambientTimer);this.ambientTimer=null;}
  for(const node of this.ambientNodes){try{node.stop?.();}catch{}try{node.disconnect?.();}catch{}}
  this.ambientNodes=[];this.ambientMaster=null;this.ambientStep=0;
};
audio.startAmbientSequence=function startAmbientSequence(){
  if(this.ambientTimer||!this.ctx||!this.allowed('ambient'))return;
  const notes=[55,65.4,82.4,98,73.4,110,82.4,130.8,98,146.8,110,164.8];
  const pulse=()=>{
    if(!this.ctx||!this.allowed('ambient'))return;
    const step=this.ambientStep++,f=notes[step%notes.length],pan=Math.sin(step*.83)*.46;
    this.playChannel('ambient',f,1.45,'triangle',.026,f*.08,pan);
    if(step%3===0)this.playChannel('ambient',f*2,.88,'sine',.013,-f*.18,-pan*.6);
    if(step%6===5)this.playChannel('ambient',f*3,.62,'sine',.009,90,pan*.35);
  };
  pulse();this.ambientTimer=setInterval(pulse,1050);
};
audio.syncAmbient=function(){
  if(!this.ctx||!this.allowed('ambient')){this.stopAmbient();return;}
  this.ensureOutput();
  const target=.135*audioVolume('ambient');
  if(this.ambientMaster){this.ambientMaster.gain.setTargetAtTime(target,this.ctx.currentTime,.12);this.startAmbientSequence();return;}
  const t=this.ctx.currentTime,master=this.ctx.createGain(),air=this.ctx.createBiquadFilter();
  master.gain.value=target;air.type='lowpass';air.frequency.value=1550;air.Q.value=.38;master.connect(air).connect(this.outputNode);
  const freqs=[43,65.4,98,147];this.ambientNodes=[master,air];
  for(let i=0;i<freqs.length;i++){
    const o=this.ctx.createOscillator(),g=this.ctx.createGain(),p=typeof this.ctx.createStereoPanner==='function'?this.ctx.createStereoPanner():null,lfo=this.ctx.createOscillator(),lfoGain=this.ctx.createGain();
    o.type=i===0?'sine':i===3?'sine':'triangle';o.frequency.value=freqs[i];o.detune.value=i%2?-5:4;
    g.gain.value=[.72,.24,.14,.055][i];lfo.type='sine';lfo.frequency.value=.025+i*.011;lfoGain.gain.value=4+i*1.4;lfo.connect(lfoGain).connect(o.detune);
    if(p){p.pan.value=(i-1.5)*.26;o.connect(g).connect(p).connect(master);this.ambientNodes.push(p);}else o.connect(g).connect(master);
    o.start(t);lfo.start(t);this.ambientNodes.push(o,g,lfo,lfoGain);
  }
  const length=Math.max(1,Math.floor(this.ctx.sampleRate*3)),buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate),data=buffer.getChannelData(0);
  let last=0;for(let i=0;i<length;i++){last=last*.985+(Math.random()*2-1)*.015;data[i]=last;}
  const noise=this.ctx.createBufferSource(),noiseFilter=this.ctx.createBiquadFilter(),noiseGain=this.ctx.createGain();
  noise.buffer=buffer;noise.loop=true;noiseFilter.type='bandpass';noiseFilter.frequency.value=620;noiseFilter.Q.value=.50;noiseGain.gain.value=.075;
  noise.connect(noiseFilter).connect(noiseGain).connect(master);noise.start(t);this.ambientNodes.push(noise,noiseFilter,noiseGain);this.ambientMaster=master;this.startAmbientSequence();
};
const baseResetGame=resetGame;resetGame=function resetConfiguredGame(){player.bulwarkCd=0;player.emberVolley=0;player.arcCd=0;baseResetGame();player.bulwarkCd=0;player.emberVolley=0;player.arcCd=0;audio.syncAmbient();};
