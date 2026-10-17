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

  function softenShockwaves(from,{radius=180,life=.44,width=3}={}){
    const list=state.entities.shockwaves||[];
    for(let i=Math.max(0,from);i<list.length;i++){
      const wave=list[i];if(!wave)continue;
      wave.maxR=Math.min(Number(wave.maxR)||radius,radius);wave.life=Math.min(Number(wave.life)||life,life);wave.max=Math.min(Number(wave.max)||life,life);wave.width=Math.min(Number(wave.width)||width,width);
    }
  }

  function drawOrbitWarden(enemy){
    const r=64,phase=Math.max(1,Number(enemy.stagePhase)||1),t=(state.time||0)*(enemy.stage01OrbitDir||1),hit=Number(enemy.hit)||0;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';

    // Preserve the original Stackfall eclipse language: a compact dark-purple
    // core, clean magenta orbital loops, then only a few cyan route satellites.
    ctx.save();ctx.rotate(t*.18);
    ctx.strokeStyle=hit?'rgba(255,255,255,.95)':'rgba(220,82,214,.78)';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.ellipse(0,0,r*1.62,r*.55,.16,0,TAU);ctx.stroke();
    ctx.rotate(-.88);ctx.globalAlpha=.72;ctx.beginPath();ctx.ellipse(0,0,r*1.43,r*.46,-.08,0,TAU);ctx.stroke();ctx.restore();

    if(phase>=2){
      ctx.save();ctx.rotate(-t*.10+.34);ctx.strokeStyle=phase===3?'rgba(105,224,242,.62)':'rgba(175,137,244,.52)';ctx.lineWidth=1.35;ctx.setLineDash([9,11]);ctx.beginPath();ctx.arc(0,0,r*(phase===3?1.90:1.78),-.22,Math.PI*1.47);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }

    const satelliteCount=phase+1,orbitR=r*(phase===3?1.82:1.72);
    for(let i=0;i<satelliteCount;i++){
      const a=t*(.52+phase*.04)+i/satelliteCount*TAU,x=Math.cos(a)*orbitR,y=Math.sin(a)*orbitR*.72;
      ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/4);ctx.fillStyle=i%2?'#aa8ce9':'#79dce9';ctx.globalAlpha=.88;ctx.fillRect(-4,-4,8,8);ctx.globalAlpha=.34;ctx.strokeStyle='#eafcff';ctx.lineWidth=1;ctx.strokeRect(-6,-6,12,12);ctx.restore();
    }

    if(phase===3){
      ctx.save();ctx.rotate(t*.13);ctx.strokeStyle='rgba(111,224,239,.42)';ctx.lineWidth=1.4;
      for(let i=0;i<4;i++){const a=i*Math.PI/2+.18;ctx.beginPath();ctx.arc(0,0,r*2.02,a,a+.34);ctx.stroke();}
      ctx.restore();
    }

    const glow=ctx.createRadialGradient(-r*.18,-r*.22,r*.06,0,0,r*1.22);glow.addColorStop(0,hit?'rgba(255,255,255,.38)':'rgba(205,111,255,.30)');glow.addColorStop(.58,'rgba(120,47,183,.11)');glow.addColorStop(1,'rgba(80,25,120,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r*1.22,0,TAU);ctx.fill();
    const sphere=ctx.createRadialGradient(-r*.28,-r*.30,r*.08,-r*.02,-r*.02,r);sphere.addColorStop(0,hit?'#ffffff':'#d180ff');sphere.addColorStop(.24,hit?'#eadfff':'#a64de3');sphere.addColorStop(.67,'#5d178a');sphere.addColorStop(1,'#160d25');ctx.fillStyle=sphere;ctx.beginPath();ctx.arc(0,0,r*.72,0,TAU);ctx.fill();
    ctx.strokeStyle=hit?'#ffffff':'rgba(226,133,255,.78)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,r*.72,0,TAU);ctx.stroke();
    ctx.fillStyle='rgba(255,236,255,.70)';ctx.beginPath();ctx.arc(-r*.18,-r*.20,r*.07,0,TAU);ctx.fill();
    ctx.restore();
  }

  const baseConstellationField=drawStageConstellationField;
  drawStageConstellationField=function polishedStageConstellationField(theme){baseConstellationField(theme);if(theme===STAGE_ID)drawRouteSweepWarning();};

  const runtime=window.stackfallStageRuntimeRegistry?.get(STAGE_ID);
  if(runtime){
    const baseProduction=runtime.production;
    const production=Object.freeze({...baseProduction,
      // The base galaxy is already composited by realm-backgrounds. Stage 1's
      // production layer owns only world-space constellation decoration/telegraphs.
      drawWorld(){drawStageConstellationField(STAGE_ID);},
      worldStatic:()=>false,
      initialize(enemy){
        const start=state.entities.shockwaves?.length||0;baseProduction?.initialize?.(enemy);softenShockwaves(start,{radius:165,life:.42,width:3});
        enemy.color='#9a55d6';enemy.r=64;enemy.visualR=64;enemy.hitRadius=68;enemy.contactRadius=42;
      },
      combat(enemy,dt){
        const before=enemy.stagePhase,start=state.entities.shockwaves?.length||0;baseProduction?.combat?.(enemy,dt);
        if(enemy.stagePhase!==before)softenShockwaves(start,{radius:185,life:.40,width:2.5});
      },
      drawBody(enemy){drawOrbitWarden(enemy);},
      defeat(enemy){enemy.color='#9a55d6';baseProduction?.defeat?.(enemy);}
    });
    const bossProfile=Object.freeze({...runtime.bossProfile,r:64,hitRadius:68,contactRadius:42,color:'#9a55d6',spawnShockwave:150});
    window.stackfallStageRuntimeRegistry.set(STAGE_ID,Object.freeze({...runtime,hazard:polishedRouteSweep,bossProfile,production}));
  }
})();
