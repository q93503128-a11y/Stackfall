WEAPONS.comet.icon='⟐';
state.entities.beams=state.entities.beams||[];
player.bulwarkCd=0;
for(const[key,weapon]of Object.entries(WEAPONS)){weapon.key=key;weapon.stackEffects=STACK_EFFECTS[key]||[];}
for(const[key,passive]of Object.entries(PASSIVES))passive.key=key;
const runtimeDamageBase=damageMult;
damageMult=function damageWithApexGrowth(){return runtimeDamageBase()*(1+(state.apexBoons?.starforge||0)*.08);};
damageReduction=function damageReductionWithStacks(){const armor=stat('armor')*.075,bulwark=weaponCount('bulwark')*.034+(weaponCount('bulwark')>=5?.05:0),constellation=(state.apexBoons?.lastconstellation||0)*.02;return clamp(armor+bulwark+constellation,0,.78);};
hasteMult=function hasteWithChronoAndNebula(){const chrono=weaponCount('chrono'),chronoBonus=chrono>=6?.18:chrono>=3?.08:0,nebula=(state.nebulaBoosts?.haste||0)*.08,apex=(state.apexBoons?.chronophage||0)*.025;return Math.max(.15,1-stat('haste')*.10-chronoBonus-nebula-apex);};

function audioVolume(channel){
  const volumes=GAME_SETTINGS.audio?.volume||{};
  const master=Math.max(0,Math.min(1,Number(volumes.master??.90)));
  const own=Math.max(0,Math.min(1,Number(volumes[channel]??(channel==='ambient'?.58:.86))));
  return master*own;
}
const rawAudioInit=audio.init.bind(audio);
audio.ambientNodes=[];audio.ambientMaster=null;audio.outputNode=null;audio.echoInput=null;audio.lastHitAt=0;
audio.ensureOutput=function ensureCosmicOutput(){
  if(this.outputNode)return;
  const output=this.ctx.createGain(),compressor=this.ctx.createDynamicsCompressor();
  compressor.threshold.value=-10;compressor.knee.value=16;compressor.ratio.value=7;compressor.attack.value=.004;compressor.release.value=.24;
  output.gain.value=.96;output.connect(compressor).connect(this.ctx.destination);
  const echoInput=this.ctx.createGain(),delay=this.ctx.createDelay(.5),feedback=this.ctx.createGain(),filter=this.ctx.createBiquadFilter(),wet=this.ctx.createGain();
  delay.delayTime.value=.115;feedback.gain.value=.13;filter.type='lowpass';filter.frequency.value=2350;wet.gain.value=.18;
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
  const scaled=volume*audioVolume(channel)*3.10;
  o.type=type;o.detune.value=rand(-5,5);o.frequency.setValueAtTime(Math.max(30,freq),t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+duration);
  filter.type=type==='square'||type==='sawtooth'?'lowpass':'bandpass';filter.frequency.value=Math.max(180,Math.min(6200,freq*2.7));filter.Q.value=type==='sine'?1.1:.65;
  g.gain.setValueAtTime(Math.max(.0001,scaled),t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  if(panner){panner.pan.value=clamp(pan+rand(-.12,.12),-1,1);o.connect(filter).connect(g).connect(panner);panner.connect(this.outputNode);panner.connect(this.echoInput);}
  else{o.connect(filter).connect(g);g.connect(this.outputNode);g.connect(this.echoInput);}
  o.start(t);o.stop(t+duration+.02);
};
audio.tone=function(freq,duration=.06,type='sine',volume=.025,slide=0){this.playChannel('combat',freq,duration,type,volume,slide);};
audio.hit=function(strong=false){
  const now=performance.now();if(!strong&&now-this.lastHitAt<22)return;this.lastHitAt=now;
  this.playChannel('combat',strong?108:172,strong?.13:.055,strong?'sawtooth':'triangle',strong?.048:.020,strong?-54:-72,strong?.18:0);
  if(strong)this.playChannel('combat',720,.075,'sine',.012,-280,-.18);
};
audio.hurt=function(){this.playChannel('combat',82,.22,'sawtooth',.052,-42,-.16);this.playChannel('combat',250,.13,'triangle',.018,-155,.18);};
audio.pickup=function(){this.playChannel('ui',720,.065,'sine',.020,265,rand(-.28,.28));};
audio.level=function(){[392,587,880,1175].forEach((f,i)=>setTimeout(()=>this.playChannel('ui',f,.18,'triangle',.032,145,(i-1.5)*.12),i*72));};
audio.resonance=function(){[146,219,329,493,739].forEach((f,i)=>setTimeout(()=>this.playChannel('ui',f,.28,i<2?'sawtooth':'triangle',.030,185,(i-2)*.1),i*58));};
audio.boss=function(){[66,92,138].forEach((f,i)=>setTimeout(()=>this.playChannel('combat',f,.58,'sawtooth',.043,80,(i-1)*.18),i*125));};
audio.stopAmbient=function(){
  for(const node of this.ambientNodes){try{node.stop?.();}catch{}try{node.disconnect?.();}catch{}}
  this.ambientNodes=[];this.ambientMaster=null;
};
audio.syncAmbient=function(){
  if(!this.ctx||!this.allowed('ambient')){this.stopAmbient();return;}
  this.ensureOutput();
  const target=.060*audioVolume('ambient');
  if(this.ambientMaster){this.ambientMaster.gain.setTargetAtTime(target,this.ctx.currentTime,.12);return;}
  const t=this.ctx.currentTime,master=this.ctx.createGain(),air=this.ctx.createBiquadFilter();
  master.gain.value=target;air.type='lowpass';air.frequency.value=1250;air.Q.value=.42;master.connect(air).connect(this.outputNode);
  const freqs=[43,65.4,98,147];this.ambientNodes=[master,air];
  for(let i=0;i<freqs.length;i++){
    const o=this.ctx.createOscillator(),g=this.ctx.createGain(),p=typeof this.ctx.createStereoPanner==='function'?this.ctx.createStereoPanner():null,lfo=this.ctx.createOscillator(),lfoGain=this.ctx.createGain();
    o.type=i===0?'sine':i===3?'sine':'triangle';o.frequency.value=freqs[i];o.detune.value=i%2?-5:4;
    g.gain.value=[.60,.18,.10,.035][i];lfo.type='sine';lfo.frequency.value=.025+i*.011;lfoGain.gain.value=4+i*1.4;lfo.connect(lfoGain).connect(o.detune);
    if(p){p.pan.value=(i-1.5)*.26;o.connect(g).connect(p).connect(master);this.ambientNodes.push(p);}else o.connect(g).connect(master);
    o.start(t);lfo.start(t);this.ambientNodes.push(o,g,lfo,lfoGain);
  }
  const length=Math.max(1,Math.floor(this.ctx.sampleRate*3)),buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate),data=buffer.getChannelData(0);
  let last=0;for(let i=0;i<length;i++){last=last*.985+(Math.random()*2-1)*.015;data[i]=last;}
  const noise=this.ctx.createBufferSource(),noiseFilter=this.ctx.createBiquadFilter(),noiseGain=this.ctx.createGain();
  noise.buffer=buffer;noise.loop=true;noiseFilter.type='bandpass';noiseFilter.frequency.value=540;noiseFilter.Q.value=.55;noiseGain.gain.value=.055;
  noise.connect(noiseFilter).connect(noiseGain).connect(master);noise.start(t);this.ambientNodes.push(noise,noiseFilter,noiseGain);this.ambientMaster=master;
};
const baseResetGame=resetGame;resetGame=function resetConfiguredGame(){player.bulwarkCd=0;player.emberVolley=0;baseResetGame();player.bulwarkCd=0;player.emberVolley=0;audio.syncAmbient();};
