(()=>{
  const STAGE_ID='stage-01';
  const STAGE_AUDIO_SOURCES=Object.freeze({
    ambient:'https://raw.githubusercontent.com/S-H-GAMELINKS/termfront/master/data/audio/sector.mp3',
    boss:'https://raw.githubusercontent.com/jarlah/dungeon-haskell/master/assets/music/boss.ogg',
    victory:'https://raw.githubusercontent.com/S-H-GAMELINKS/termfront/master/data/audio/victory.mp3'
  });

  const constellationForOrder=order=>order<=6?1:order<=12?2:3;
  const stageOrderFromTheme=theme=>{
    const match=String(theme||'').match(/^stage-(\d{2})$/);
    return match?Math.max(1,Math.min(18,Number(match[1])||1)):null;
  };

  function constellationPalette(family){
    if(family===2)return{wash:'rgba(105,33,128,.105)',glow:'rgba(66,214,187,.055)',primary:'rgba(210,133,255,.30)',secondary:'rgba(111,232,207,.24)'};
    if(family===3)return{wash:'rgba(16,93,112,.095)',glow:'rgba(223,173,81,.045)',primary:'rgba(106,226,238,.26)',secondary:'rgba(229,184,100,.23)'};
    return{wash:'rgba(54,70,172,.10)',glow:'rgba(72,211,255,.055)',primary:'rgba(145,170,255,.29)',secondary:'rgba(99,224,255,.25)'};
  }

  // Endless is the visual source of truth. Authored stages only tint and decorate
  // that same space renderer at constellation granularity; no stage-local world art.
  drawStageWorldBackdrop=function drawConstellationStageBackdrop(order){
    drawSpaceBackground();
    const family=constellationForOrder(Math.max(1,Number(order)||1)),palette=constellationPalette(family),size=Math.max(vw,vh);
    ctx.save();
    const wash=ctx.createLinearGradient(0,0,vw,vh);wash.addColorStop(0,palette.wash);wash.addColorStop(.62,'rgba(0,0,0,0)');wash.addColorStop(1,palette.glow);ctx.fillStyle=wash;ctx.fillRect(0,0,vw,vh);
    const ambient=ctx.createRadialGradient(vw*.48,vh*.46,0,vw*.48,vh*.46,size*.72);ambient.addColorStop(0,palette.glow);ambient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ambient;ctx.fillRect(0,0,vw,vh);ctx.restore();
  };

  drawStageConstellationField=function drawSharedConstellationField(theme){
    const order=stageOrderFromTheme(theme);if(!order)return;
    const family=constellationForOrder(order),palette=constellationPalette(family),t=performance.now()/1000,px=player.x||0,py=player.y||0;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(family===1){
      // Broken route shards and incomplete orbital guides: shared by stages 1-6.
      ctx.lineWidth=1.35;
      for(let i=0;i<13;i++){
        const x=wrap(117+i*173-px*.12,2100)-100,y=wrap(83+i*109-py*.10,1450)-80,a=-.42+(i%5)*.17+t*.004*(i%2?1:-1),len=18+(i%4)*10;
        ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=.26+(i%3)*.035;ctx.strokeStyle=i%3===0?palette.secondary:palette.primary;ctx.beginPath();ctx.moveTo(-len*.72,-2);ctx.lineTo(-len*.12,-6);ctx.lineTo(len*.78,0);ctx.lineTo(-len*.08,6);ctx.closePath();ctx.stroke();ctx.restore();
      }
      ctx.globalAlpha=.13;ctx.strokeStyle=palette.secondary;ctx.setLineDash([18,15]);for(let i=0;i<3;i++){const x=wrap(430+i*690-px*.035,2300)-260,y=wrap(250+i*350-py*.025,1500)-170;ctx.beginPath();ctx.ellipse(x,y,150+i*32,56+i*11,.18+i*.17,.18,Math.PI*1.72);ctx.stroke();}ctx.setLineDash([]);
    }else if(family===2){
      // Soft stellar growth and drifting spores: shared by stages 7-12.
      for(let i=0;i<9;i++){
        const x=wrap(130+i*241-px*.09,2200)-120,y=wrap(70+i*157-py*.075,1500)-100,r=24+(i%4)*11;
        ctx.globalAlpha=.12+(i%3)*.025;ctx.strokeStyle=i%2?palette.primary:palette.secondary;ctx.lineWidth=1.35;ctx.beginPath();ctx.ellipse(x,y,r*1.7,r*.55,(i*.41+t*.006)%TAU,0,TAU);ctx.stroke();
        ctx.globalAlpha=.16;ctx.fillStyle=i%2?palette.secondary:palette.primary;ctx.beginPath();ctx.arc(x+Math.cos(i)*r*.7,y+Math.sin(i)*r*.35,1.8+(i%3),0,TAU);ctx.fill();
      }
      ctx.globalAlpha=.10;ctx.strokeStyle=palette.primary;ctx.lineWidth=2;for(let lane=0;lane<3;lane++){const y=vh*(.25+lane*.24)+Math.sin(t*.13+lane)*18;ctx.beginPath();ctx.moveTo(-80,y);ctx.bezierCurveTo(vw*.26,y-95,vw*.66,y+90,vw+90,y-18);ctx.stroke();}
    }else{
      // Sparse relay geometry and scanning nodes: shared by stages 13-18.
      ctx.lineWidth=1;for(let i=0;i<10;i++){
        const x=wrap(95+i*223-px*.10,2100)-100,y=wrap(65+i*137-py*.085,1420)-80,w=22+(i%3)*11,h=13+(i%2)*7;
        ctx.globalAlpha=.13+(i%3)*.025;ctx.strokeStyle=i%3===0?palette.secondary:palette.primary;ctx.strokeRect(x-w,y-h,w*2,h*2);ctx.beginPath();ctx.moveTo(x-w-30,y);ctx.lineTo(x-w,y);ctx.moveTo(x+w,y);ctx.lineTo(x+w+30,y);ctx.stroke();
        ctx.globalAlpha=.24;ctx.fillStyle=i%3===0?palette.secondary:palette.primary;ctx.beginPath();ctx.arc(x,y,2.2,0,TAU);ctx.fill();
      }
      const scan=wrap(t*23-py*.16,vh+180)-90;ctx.globalAlpha=.07;ctx.fillStyle=palette.primary;ctx.fillRect(0,scan,vw,1.5);
    }
    ctx.restore();
  };

  const stageAudio=(()=>{
    const make=(src,loop)=>{const element=new Audio();element.src=src;element.preload='none';element.loop=loop;element.crossOrigin='anonymous';return element;};
    const tracks={ambient:make(STAGE_AUDIO_SOURCES.ambient,true),boss:make(STAGE_AUDIO_SOURCES.boss,true),victory:make(STAGE_AUDIO_SOURCES.victory,false)};
    const baseVolume={ambient:.34,boss:.31,victory:.42};
    let active=null,fadeSerial=0,victoryLock=false;
    const enabled=()=>GAME_SETTINGS?.audio?.master!==false&&GAME_SETTINGS?.audio?.ambient!==false;
    const volume=key=>clamp(Number(GAME_SETTINGS?.audio?.volume?.master??.9),0,1)*clamp(Number(GAME_SETTINGS?.audio?.volume?.ambient??.58),0,1)*baseVolume[key];
    const safePlay=element=>{const result=element.play();if(result?.catch)result.catch(()=>{});};
    const pauseAll=except=>{for(const[key,track]of Object.entries(tracks))if(key!==except){track.pause();if(key!=='victory')track.currentTime=0;}};
    function switchTo(key,immediate=false){
      if(!tracks[key]||!enabled()){stop();return;}if(active===key&&!tracks[key].paused){tracks[key].volume=volume(key);return;}
      const next=tracks[key],previous=active?tracks[active]:null,serial=++fadeSerial;active=key;if(key!=='victory'&&next.ended)next.currentTime=0;next.volume=immediate?volume(key):0;safePlay(next);
      if(immediate){pauseAll(key);return;}
      const started=performance.now(),duration=460,from=previous&&!previous.paused?previous.volume:0,target=volume(key);
      const step=now=>{if(serial!==fadeSerial)return;const p=clamp((now-started)/duration,0,1);next.volume=target*p;if(previous&&previous!==next)previous.volume=from*(1-p);if(p<1)requestAnimationFrame(step);else if(previous&&previous!==next){previous.pause();if(previous!==tracks.victory)previous.currentTime=0;}};requestAnimationFrame(step);
    }
    function stop(){active=null;victoryLock=false;++fadeSerial;for(const track of Object.values(tracks)){track.pause();track.currentTime=0;}}
    function sync(){
      if(!enabled()){stop();return;}const stageOne=window.stackfallIsStageRun?.()===true&&state.runSelection?.stageId===STAGE_ID;
      if(!stageOne||!['playing','cinematic','stageVictory'].includes(state.mode)){stop();return;}
      if(victoryLock&&state.mode==='stageVictory'){tracks.victory.volume=volume('victory');return;}
      const run=state.stageRun,bossLive=!!run?.bossSpawned&&!run?.completed;
      switchTo(bossLive?'boss':'ambient');
    }
    function victory(){victoryLock=true;++fadeSerial;for(const[key,track]of Object.entries(tracks)){track.pause();track.currentTime=0;if(key!=='victory')track.volume=0;}active='victory';tracks.victory.volume=volume('victory');safePlay(tracks.victory);}
    const timer=setInterval(sync,650);window.addEventListener('pagehide',()=>{clearInterval(timer);stop();},{once:true});
    return{playAmbient:()=>{victoryLock=false;switchTo('ambient');},playBoss:()=>{victoryLock=false;switchTo('boss');},playVictory:victory,sync,stop,sources:STAGE_AUDIO_SOURCES};
  })();
  window.STACKFALL_STAGE_AUDIO_SOURCES=STAGE_AUDIO_SOURCES;
  window.stackfallStageOneAudio=stageAudio;
  const previousSyncAmbient=typeof audio.syncAmbient==='function'?audio.syncAmbient.bind(audio):null;
  audio.syncAmbient=function syncAmbientWithStageMusic(){previousSyncAmbient?.();stageAudio.sync();};

  const currentStage=window.stackfallStageById?.(STAGE_ID);
  if(currentStage){
    const stageOne=Object.freeze({...currentStage,
      title:Object.freeze({ko:'외곽 항로',en:'Outer Route'}),
      description:Object.freeze({ko:'첫 번째 전투 구간. 기본 개체에서 빠른 개체·원거리 개체·중장갑 개체가 순차적으로 합류하며 마지막에 궤도 감시자가 등장한다.',en:'The first combat route. Fast, ranged, and armored enemies join the base wave in sequence before the Orbit Warden arrives.'}),
      boss:Object.freeze({...currentStage.boss,id:'orbit-warden',name:Object.freeze({ko:'궤도 감시자',en:'Orbit Warden'})})
    });
    const previousLookup=window.stackfallStageById,updated=Object.freeze((window.STACKFALL_STAGE_CATALOG||[]).map(stage=>stage.id===STAGE_ID?stageOne:stage));
    window.STACKFALL_STAGE_CATALOG=updated;window.stackfallStageById=id=>String(id)===STAGE_ID?stageOne:previousLookup(id);
  }

  const base=window.stackfallStageRuntimeRegistry?.get(STAGE_ID);
  if(base){
    const production=Object.freeze({
      entryDuration:2.45,victoryDuration:2.95,subtitle:'ORBITAL CONTACT',
      shapes:()=>[],environment:()=>{},
      initialize(enemy){enemy.stageProduction=true;enemy.eliteForm='eclipse';enemy.variant='eclipse';enemy.stagePhase=1;state.stageBossArena=null;stageAudio.playBoss();},
      combat(enemy,dt){const kind=enemy.kind;enemy.kind='boss';try{if(typeof normalBossSkill==='function')normalBossSkill(enemy,dt);if(typeof bossAntiIdleSkill==='function')bossAntiIdleSkill(enemy,dt);}finally{enemy.kind=kind;}},
      drawBody(enemy){
        const kind=enemy.kind;enemy.kind='boss';try{drawEliteShape(enemy);}finally{enemy.kind=kind;}
        const r=Number(enemy.visualR)||Number(enemy.r)||88,t=Number(enemy.phase)||0;ctx.save();ctx.rotate(-t*.026);ctx.strokeStyle=enemy.hit?'#fff':'rgba(116,224,255,.72)';ctx.lineWidth=2;ctx.setLineDash([10,9]);ctx.beginPath();ctx.arc(0,0,r*1.46,.20,Math.PI*1.45);ctx.stroke();ctx.rotate(t*.058+.72);ctx.strokeStyle=enemy.hit?'#fff':'rgba(157,135,255,.60)';ctx.beginPath();ctx.arc(0,0,r*1.67,.06,Math.PI*1.18);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<3;i++){const a=t*.045+i*TAU/3,rr=r*1.55;ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(a+Math.PI/4);ctx.fillStyle=i===0?'#dffbff':'#9aa7ff';ctx.fillRect(-4,-4,8,8);ctx.restore();}ctx.restore();
      },
      defeat(){stageAudio.playVictory();},
      drawVictory(v){const p=worldToScreen(v.x,v.y),body=v.body,fade=1-clamp((v.elapsed-2.10)/.72,0,1);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=fade;body.phase=(body.phase||0)+.018;this.drawBody(body);ctx.restore();if(v.elapsed>.55){ctx.save();ctx.globalAlpha=clamp((v.elapsed-.55)/.45,0,1)*fade;ctx.textAlign='center';ctx.fillStyle='#eff8ff';ctx.font='900 24px "IBM Plex Sans KR",sans-serif';ctx.fillText(v.elapsed<1.55?tr('stageClear.targetDown'):tr('stageClear.operationComplete'),vw*.5,vh*.22);ctx.restore();}}
    });
    const previousStart=base.onStart;
    window.stackfallStageRuntimeRegistry.set(STAGE_ID,Object.freeze({...base,
      theme:STAGE_ID,
      onStart(api){previousStart?.(api);state.stageBossArena=null;stageAudio.playAmbient();},
      bossProfile:Object.freeze({form:'eclipse',eventVariant:'stage01-orbit-warden',nameKey:'stage01.boss',warningKey:'stage01.boss.warning',r:90,hitRadius:92,contactRadius:56,hp:1.18,speed:.96,damage:.92,color:'#8ca4ff',xp:1.8,skillCd:2.15,burstCd:5.0,pulseCd:7.4,spawnRadius:620,spawnShockwave:190}),
      production
    }));
  }

  const previousClamp=window.stackfallClampStageBossToArena;
  window.stackfallClampStageBossToArena=function remodeledStageBossClamp(enemy){if(enemy?.eventKind===STAGE_ID)return;return previousClamp?.(enemy);};
  document.querySelector('#startBtn')?.addEventListener('click',()=>setTimeout(()=>stageAudio.sync(),0));
  window.renderStackfallGalaxyMap?.();
})();
