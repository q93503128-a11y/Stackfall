(()=>{
  const registry=new Map();
  const publicSources=Object.create(null);
  let activeStageId=null,activeKey=null,fadeSerial=0,victoryLockStageId=null;

  const enabled=()=>GAME_SETTINGS?.audio?.master!==false&&GAME_SETTINGS?.audio?.ambient!==false;
  const volume=(entry,key)=>clamp(Number(GAME_SETTINGS?.audio?.volume?.master??.9),0,1)*clamp(Number(GAME_SETTINGS?.audio?.volume?.ambient??.58),0,1)*(entry.baseVolume[key]??.34);
  const safePlay=element=>{const result=element?.play?.();if(result?.catch)result.catch(()=>{});};
  const makeTrack=(src,loop)=>{const element=new Audio();element.src=src;element.preload='none';element.loop=loop;element.crossOrigin='anonymous';return element;};

  function pauseEntry(entry,reset=true,except=null){
    if(!entry)return;
    for(const[key,track]of Object.entries(entry.tracks)){
      if(key===except)continue;
      track.pause();
      if(reset)track.currentTime=0;
      track.volume=0;
    }
  }
  function stopAll(){
    ++fadeSerial;activeStageId=null;activeKey=null;victoryLockStageId=null;
    for(const entry of registry.values())pauseEntry(entry,true);
  }
  function switchTo(stageId,key,immediate=false){
    const entry=registry.get(stageId),next=entry?.tracks?.[key];
    if(!entry||!next||!enabled()){stopAll();return;}
    if(activeStageId===stageId&&activeKey===key&&!next.paused){next.volume=volume(entry,key);return;}
    const previousEntry=registry.get(activeStageId),previous=previousEntry?.tracks?.[activeKey]||null,serial=++fadeSerial;
    activeStageId=stageId;activeKey=key;
    for(const other of registry.values())if(other!==entry)pauseEntry(other,true);
    if(key!=='victory'&&next.ended)next.currentTime=0;
    const target=volume(entry,key);next.volume=immediate?target:0;safePlay(next);
    if(immediate){pauseEntry(entry,true,key);return;}
    const started=performance.now(),duration=460,from=previous&&!previous.paused?previous.volume:0;
    const step=now=>{
      if(serial!==fadeSerial)return;
      const p=clamp((now-started)/duration,0,1);next.volume=target*p;
      if(previous&&previous!==next)previous.volume=from*(1-p);
      if(p<1)requestAnimationFrame(step);
      else if(previous&&previous!==next){previous.pause();if(previous!==previousEntry?.tracks?.victory)previous.currentTime=0;}
    };
    requestAnimationFrame(step);
  }
  function playVictory(stageId){
    const entry=registry.get(stageId);if(!entry||!enabled()){stopAll();return;}
    victoryLockStageId=stageId;++fadeSerial;
    for(const other of registry.values())pauseEntry(other,true,other===entry?'victory':null);
    activeStageId=stageId;activeKey='victory';const track=entry.tracks.victory;track.pause();track.currentTime=0;track.volume=volume(entry,'victory');safePlay(track);
  }
  function sync(){
    if(!enabled()){stopAll();return;}
    const stageId=window.stackfallIsStageRun?.()===true?state.runSelection?.stageId:null,entry=registry.get(stageId);
    if(!stageId||!entry||!['playing','cinematic','stageVictory'].includes(state.mode)){stopAll();return;}
    if(victoryLockStageId===stageId&&state.mode==='stageVictory'){
      entry.tracks.victory.volume=volume(entry,'victory');return;
    }
    if(victoryLockStageId===stageId)victoryLockStageId=null;
    const bossLive=!!state.stageRun?.bossSpawned&&!state.stageRun?.completed;
    switchTo(stageId,bossLive?'boss':'ambient');
  }
  function register(stageId,sources,options={}){
    const id=String(stageId||'');if(!id||!sources?.ambient||!sources?.boss||!sources?.victory)throw new Error('Invalid stage audio registration: '+id);
    if(registry.has(id))return registry.get(id).controller;
    const baseVolume=Object.freeze({ambient:.34,boss:.31,victory:.42,...options.baseVolume});
    const entry={id,sources:Object.freeze({...sources}),baseVolume,tracks:{ambient:makeTrack(sources.ambient,true),boss:makeTrack(sources.boss,true),victory:makeTrack(sources.victory,false)},controller:null};
    entry.controller=Object.freeze({
      playAmbient:()=>{victoryLockStageId=null;switchTo(id,'ambient');},
      playBoss:()=>{victoryLockStageId=null;switchTo(id,'boss');},
      playVictory:()=>playVictory(id),
      sync,
      stop:()=>{if(activeStageId===id)stopAll();else pauseEntry(entry,true);},
      sources:entry.sources
    });
    registry.set(id,entry);publicSources[id]=entry.sources;return entry.controller;
  }

  window.STACKFALL_STAGE_AUDIO_SOURCES=publicSources;
  window.stackfallRegisterStageAudio=register;
  window.stackfallStageAudioSync=sync;
  window.stackfallStageAudioStop=stopAll;
  const previousSyncAmbient=typeof audio.syncAmbient==='function'?audio.syncAmbient.bind(audio):null;
  audio.syncAmbient=function syncAmbientWithStageRouter(){previousSyncAmbient?.();sync();};
  const timer=setInterval(sync,650);
  window.addEventListener('pagehide',()=>{clearInterval(timer);stopAll();},{once:true});
})();
