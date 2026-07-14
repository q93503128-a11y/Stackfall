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
const rawAudioInit=audio.init.bind(audio);audio.ambientNodes=[];audio.ambientMaster=null;
audio.init=function initAudioWithSettings(){rawAudioInit();this.syncAmbient();};
audio.allowed=function allowed(channel){return GAME_SETTINGS.audio.master!==false&&GAME_SETTINGS.audio[channel]!==false&&audioVolume(channel)>.001;};
audio.playChannel=function playChannel(channel,freq,duration=.06,type='sine',volume=.025,slide=0){if(!this.allowed(channel))return;rawAudioInit();const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain(),scaled=volume*audioVolume(channel)*1.55;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+duration);g.gain.setValueAtTime(Math.max(.0001,scaled),t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(this.ctx.destination);o.start(t);o.stop(t+duration);};
audio.hit=function(strong=false){this.playChannel('combat',strong?120:180,strong?.11:.05,'square',strong?.045:.018,-70);};
audio.hurt=function(){this.playChannel('combat',90,.18,'sawtooth',.045,-45);};
audio.pickup=function(){this.playChannel('ui',680,.05,'sine',.018,220);};
audio.level=function(){[420,620,910].forEach((f,i)=>setTimeout(()=>this.playChannel('ui',f,.14,'triangle',.03,120),i*70));};
audio.resonance=function(){[180,260,390,580].forEach((f,i)=>setTimeout(()=>this.playChannel('ui',f,.22,'sawtooth',.025,200),i*55));};
audio.boss=function(){[90,120,180].forEach((f,i)=>setTimeout(()=>this.playChannel('combat',f,.48,'sawtooth',.035,90),i*120));};
audio.stopAmbient=function(){for(const node of this.ambientNodes){try{node.stop?.();}catch{}try{node.disconnect?.();}catch{}}this.ambientNodes=[];this.ambientMaster=null;};
audio.syncAmbient=function(){
  if(!this.ctx||!this.allowed('ambient')){this.stopAmbient();return;}
  const target=.030*audioVolume('ambient');
  if(this.ambientMaster){this.ambientMaster.gain.setTargetAtTime(target,this.ctx.currentTime,.08);return;}
  const master=this.ctx.createGain();master.gain.value=target;master.connect(this.ctx.destination);this.ambientMaster=master;
  const freqs=[43,65.4,98];for(let i=0;i<freqs.length;i++){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=i===0?'sine':'triangle';o.frequency.value=freqs[i];g.gain.value=i===0?.72:.20;o.connect(g).connect(master);o.start();this.ambientNodes.push(o,g);}this.ambientNodes.push(master);
};
const baseResetGame=resetGame;resetGame=function resetConfiguredGame(){player.bulwarkCd=0;player.emberVolley=0;baseResetGame();player.bulwarkCd=0;player.emberVolley=0;audio.syncAmbient();};