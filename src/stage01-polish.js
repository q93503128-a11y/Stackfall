(()=>{
  const STAGE_ID='stage-01';
  const stageOneActive=()=>window.stackfallIsStageRun?.()===true&&state.stageRun?.stage?.id===STAGE_ID;
  const localText=(ko,en)=>GAME_SETTINGS.language==='ko'?ko:en;

  function spawnSweepProjectile(x,y,angle,speed,damage,r,life){
    return spawnEnemyProjectile(x,y,angle,speed,damage,'#91d9f2',r,life,'stage01-route-sweep');
  }

  function polishedRouteSweep(_event,api){
    const run=api?.run;if(!run||run.bossSpawned||!stageOneActive())return;
    if(state.mapEventActive||state.entities.enemies.some(enemy=>enemy&&!enemy.dead&&enemy.stageEncounter===true))return;
    const now=state.time||0;if(now-(Number(run.stage01LastSweep)||-999)<36)return;run.stage01LastSweep=now;
    const scale=window.stackfallStageEnvironmentCombatScale?.({order:1,progress:api.progress})||{damage:.72,speed:.9,warning:1.1};
    const seq=run.stage01SweepCount=(run.stage01SweepCount||0)+1,horizontal=seq%2===1,dir=seq%4<2?1:-1,compact=compactDevice();
    const spacing=compact?55:66,laneCount=compact?8:10,gapIndex=Math.max(1,Math.min(laneCount-2,Math.floor(laneCount/2)+([-1,1,0][seq%3]||0))),anchorX=player.x,anchorY=player.y,travel=Math.max(vw,vh)*.66+170,warning=Math.max(.68,.82*scale.warning);
    run.stage01SweepVisual={horizontal,dir,spacing,laneCount,gapIndex,anchorX,anchorY,travel,startAt:now,endAt:now+warning};
    addText(anchorX,anchorY-86,localText('항로 파편대 접근','ROUTE SHARD SWEEP'),'#aee9f5',13);
    shockwave(anchorX,anchorY,'#6ebfd4',72,warning,1.3);
    scheduleWeaponAction(warning*1000,()=>{
      if(!stageOneActive()||state.stageRun?.bossSpawned)return;
      const speed=350*scale.speed,damage=6.2*scale.damage,life=travel*2/speed+1.1,angle=horizontal?(dir>0?0:Math.PI):(dir>0?Math.PI/2:-Math.PI/2);
      for(let i=0;i<laneCount;i++){
        if(Math.abs(i-gapIndex)<=1)continue;
        const offset=(i-(laneCount-1)/2)*spacing,jitter=(i%2?1:-1)*6;
        const x=horizontal?anchorX-dir*travel:anchorX+offset+jitter,y=horizontal?anchorY+offset+jitter:anchorY-dir*travel;
        spawnSweepProjectile(x,y,angle,speed,damage,compact?6.5:7.5,life);
      }
      state.camera.shake=Math.max(state.camera.shake,3.5);audio.stageAttack?.(STAGE_ID,'route-sweep');
    });
  }

  function drawRouteSweepWarning(){
    const run=state.stageRun,warning=run?.stage01SweepVisual,now=state.time||0;if(!warning||now>warning.endAt||!stageOneActive())return;
    const duration=Math.max(.01,warning.endAt-warning.startAt),progress=clamp((now-warning.startAt)/duration,0,1),pulse=.72+.28*Math.sin(progress*Math.PI*4),halfGap=warning.spacing*1.55,halfSpan=warning.travel*.80;
    const line=(a,b)=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash([8,12]);ctx.lineDashOffset=-progress*34;ctx.strokeStyle=`rgba(123,216,235,${(.30+.18*pulse).toFixed(3)})`;ctx.lineWidth=1.15;
    let a1,a2,b1,b2;
    if(warning.horizontal){
      a1=worldToScreen(warning.anchorX-halfSpan,warning.anchorY-halfGap);a2=worldToScreen(warning.anchorX+halfSpan,warning.anchorY-halfGap);b1=worldToScreen(warning.anchorX-halfSpan,warning.anchorY+halfGap);b2=worldToScreen(warning.anchorX+halfSpan,warning.anchorY+halfGap);
    }else{
      a1=worldToScreen(warning.anchorX-halfGap,warning.anchorY-halfSpan);a2=worldToScreen(warning.anchorX-halfGap,warning.anchorY+halfSpan);b1=worldToScreen(warning.anchorX+halfGap,warning.anchorY-halfSpan);b2=worldToScreen(warning.anchorX+halfGap,warning.anchorY+halfSpan);
    }
    line(a1,a2);line(b1,b2);ctx.setLineDash([]);
    ctx.fillStyle=`rgba(70,187,207,${(.025+.025*pulse).toFixed(3)})`;ctx.beginPath();ctx.moveTo(a1.x,a1.y);ctx.lineTo(a2.x,a2.y);ctx.lineTo(b2.x,b2.y);ctx.lineTo(b1.x,b1.y);ctx.closePath();ctx.fill();
    const sourceDistance=warning.travel*.58;
    for(let i=0;i<warning.laneCount;i++){
      if(Math.abs(i-warning.gapIndex)<=1)continue;
      const offset=(i-(warning.laneCount-1)/2)*warning.spacing;
      const wx=warning.horizontal?warning.anchorX-warning.dir*sourceDistance:warning.anchorX+offset;
      const wy=warning.horizontal?warning.anchorY+offset:warning.anchorY-warning.dir*sourceDistance;
      const p=worldToScreen(wx,wy),angle=warning.horizontal?(warning.dir>0?0:Math.PI):(warning.dir>0?Math.PI/2:-Math.PI/2),s=5.5+2*pulse;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.globalAlpha=.38+.20*pulse;ctx.strokeStyle='#a4e4ef';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-s,-s*.72);ctx.lineTo(s,0);ctx.lineTo(-s,s*.72);ctx.stroke();ctx.restore();
    }
    ctx.restore();
  }

  const baseConstellationField=drawStageConstellationField;
  drawStageConstellationField=function polishedStageConstellationField(theme){baseConstellationField(theme);if(theme===STAGE_ID)drawRouteSweepWarning();};

  const runtime=window.stackfallStageRuntimeRegistry?.get(STAGE_ID);
  if(runtime){
    const baseProduction=runtime.production;
    const production=Object.freeze({...baseProduction,
      initialize(enemy){
        baseProduction?.initialize?.(enemy);enemy.color='#9a55d6';enemy.r=78;enemy.visualR=78;enemy.hitRadius=80;enemy.contactRadius=50;
      },
      drawBody(enemy){
        const prior=enemy.color;enemy.color=enemy.hit?'#ffffff':'#9a55d6';ctx.save();ctx.scale(.94,.94);baseProduction?.drawBody?.(enemy);ctx.restore();enemy.color=prior;
      },
      defeat(enemy){enemy.color='#9a55d6';baseProduction?.defeat?.(enemy);}
    });
    const bossProfile=Object.freeze({...runtime.bossProfile,r:78,hitRadius:80,contactRadius:50,color:'#9a55d6',spawnShockwave:176});
    window.stackfallStageRuntimeRegistry.set(STAGE_ID,Object.freeze({...runtime,hazard:polishedRouteSweep,bossProfile,production}));
  }
})();
