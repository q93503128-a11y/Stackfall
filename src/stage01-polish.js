(()=>{
  const STAGE_ID='stage-01';
  const stageOneActive=()=>window.stackfallIsStageRun?.()===true&&state.stageRun?.stage?.id===STAGE_ID;
  const localText=(ko,en)=>GAME_SETTINGS.language==='ko'?ko:en;

  function spawnSweepProjectile(x,y,angle,speed,damage,r,life){
    return spawnEnemyProjectile(x,y,angle,speed,damage,'#91d9f2',r,life,'debris');
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
    const r=82,phase=Math.max(1,Number(enemy.stagePhase)||1),t=(state.time||0)*(enemy.stage01OrbitDir||1),hit=Number(enemy.hit)||0,pulse=.88+.12*Math.sin((state.time||0)*2.4);
    const main=hit?'#ffffff':'#cf5ce1',cyan=hit?'#ffffff':'#75e1ef',edge=hit?'#ffffff':'#9a70e8';
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';

    // Rear rails: partial arcs only. The silhouette remains a machine/crest,
    // not the player's concentric circular core.
    ctx.save();ctx.rotate(t*.055-.24);ctx.strokeStyle='rgba(207,92,225,.52)';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,r*1.54,-2.70,-.28);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*1.54,.44,2.66);ctx.stroke();ctx.restore();
    if(phase>=2){ctx.save();ctx.rotate(-t*.038+.36);ctx.setLineDash([10,9]);ctx.strokeStyle=phase===3?'rgba(117,225,239,.55)':'rgba(154,112,232,.48)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*1.84,-1.16,.34);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*1.84,1.90,3.38);ctx.stroke();ctx.setLineDash([]);ctx.restore();}

    // Broad asymmetric armour blades give the boss a long, unmistakable silhouette.
    const blade=(side,upper)=>{
      ctx.save();ctx.scale(side,upper);ctx.fillStyle=hit?'#ffffff':'#100b22';ctx.strokeStyle=upper>0?edge:main;ctx.lineWidth=2.6;
      ctx.beginPath();ctx.moveTo(r*.12,-r*.10);ctx.lineTo(r*.64,-r*.58);ctx.lineTo(r*1.46,-r*.76);ctx.lineTo(r*1.76,-r*.36);ctx.lineTo(r*1.36,-r*.12);ctx.lineTo(r*.70,-r*.04);ctx.lineTo(r*.34,r*.20);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.globalAlpha=.58;ctx.strokeStyle=cyan;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(r*.54,-r*.37);ctx.lineTo(r*1.34,-r*.54);ctx.lineTo(r*1.53,-r*.34);ctx.stroke();ctx.restore();
    };
    blade(1,1);blade(-1,-1);

    // Counter-blades are shorter and offset, preventing mirror symmetry from
    // collapsing back into a player-like round icon.
    ctx.save();ctx.rotate(.20);ctx.fillStyle=hit?'#fff':'#17102d';ctx.strokeStyle=main;ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(-r*.18,-r*.12);ctx.lineTo(-r*.72,-r*.84);ctx.lineTo(-r*1.18,-r*.98);ctx.lineTo(-r*.96,-r*.42);ctx.lineTo(-r*.44,r*.02);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(r*.18,r*.12);ctx.lineTo(r*.72,r*.84);ctx.lineTo(r*1.18,r*.98);ctx.lineTo(r*.96,r*.42);ctx.lineTo(r*.44,-r*.02);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();

    // Crown / keel fins communicate orientation without using the player's arrow.
    ctx.fillStyle=hit?'#fff':'#17102d';ctx.strokeStyle=cyan;ctx.lineWidth=1.8;
    ctx.beginPath();ctx.moveTo(-r*.18,-r*.42);ctx.lineTo(0,-r*1.18);ctx.lineTo(r*.22,-r*.48);ctx.lineTo(r*.08,-r*.24);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-r*.10,r*.34);ctx.lineTo(r*.16,r*1.03);ctx.lineTo(r*.34,r*.40);ctx.lineTo(r*.10,r*.18);ctx.closePath();ctx.fill();ctx.stroke();

    // Void diamond core: deliberately non-circular and dark at the center.
    ctx.save();ctx.rotate(Math.PI/4+t*.012);ctx.fillStyle='#05040d';ctx.strokeStyle=main;ctx.lineWidth=3;ctx.fillRect(-r*.34,-r*.34,r*.68,r*.68);ctx.strokeRect(-r*.34,-r*.34,r*.68,r*.68);ctx.restore();
    ctx.save();ctx.rotate(-Math.PI/4);ctx.fillStyle=hit?'#fff':'#1e0d35';ctx.strokeStyle=edge;ctx.lineWidth=1.5;ctx.fillRect(-r*.20,-r*.20,r*.40,r*.40);ctx.strokeRect(-r*.20,-r*.20,r*.40,r*.40);ctx.restore();
    ctx.fillStyle=cyan;ctx.globalAlpha=.84;ctx.fillRect(-r*.055,-r*.30*pulse,r*.11,r*.60*pulse);ctx.globalAlpha=1;

    const satelliteCount=phase+1,orbitR=r*(phase===3?1.92:1.78);
    for(let i=0;i<satelliteCount;i++){
      const a=t*(.46+phase*.035)+i/satelliteCount*TAU,x=Math.cos(a)*orbitR,y=Math.sin(a)*orbitR*.72;
      ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/4);ctx.fillStyle=i%2?edge:cyan;ctx.globalAlpha=.90;ctx.fillRect(-4.5,-4.5,9,9);ctx.globalAlpha=.34;ctx.strokeStyle='#effcff';ctx.lineWidth=1;ctx.strokeRect(-7,-7,14,14);ctx.restore();
    }
    if(phase===3){
      ctx.save();ctx.rotate(t*.10);ctx.strokeStyle='rgba(117,225,239,.48)';ctx.lineWidth=1.5;for(let i=0;i<4;i++){const a=i*Math.PI/2+.14;ctx.beginPath();ctx.arc(0,0,r*2.08,a,a+.30);ctx.stroke();}ctx.restore();
    }
    ctx.restore();
  }

  const runtime=window.stackfallStageRuntimeRegistry?.get(STAGE_ID);
  if(runtime){
    const baseProduction=runtime.production;
    const production=Object.freeze({...baseProduction,
      // Shared constellation service owns the base field. This production layer
      // owns only Stage 1 telegraphs and the final-boss presentation.
      drawWorld(){window.stackfallDrawStageConstellationField?.(STAGE_ID);drawRouteSweepWarning();},
      worldStatic:()=>false,
      initialize(enemy){
        const start=state.entities.shockwaves?.length||0;baseProduction?.initialize?.(enemy);softenShockwaves(start,{radius:165,life:.42,width:3});
        enemy.color='#9a55d6';enemy.r=82;enemy.visualR=82;enemy.hitRadius=88;enemy.contactRadius=54;
      },
      combat(enemy,dt){
        const before=enemy.stagePhase,start=state.entities.shockwaves?.length||0;baseProduction?.combat?.(enemy,dt);
        if(enemy.stagePhase!==before)softenShockwaves(start,{radius:185,life:.40,width:2.5});
      },
      drawBody(enemy){drawOrbitWarden(enemy);},
      defeat(enemy){enemy.color='#9a55d6';baseProduction?.defeat?.(enemy);}
    });
    const bossProfile=Object.freeze({...runtime.bossProfile,r:82,hitRadius:88,contactRadius:54,color:'#9a55d6',spawnShockwave:175});
    window.stackfallStageRuntimeRegistry.set(STAGE_ID,Object.freeze({...runtime,hazard:polishedRouteSweep,bossProfile,production}));
  }
})();
