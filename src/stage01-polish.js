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
  const r=82,phase=Math.max(1,Number(enemy.stagePhase)||1),clock=state.time||0,t=clock*(enemy.stage01OrbitDir||1),hit=Number(enemy.hit)||0,pulse=.88+.12*Math.sin(clock*2.4),breath=1+Math.sin(clock*1.35)*.018;
  const main=hit?'#f7dcff':'#cf5ce1',cyan=hit?'#eaffff':'#75e1ef',edge=hit?'#e6dcff':'#9a70e8';
  const armour=ctx.createLinearGradient(-r*1.55,-r*.92,r*1.55,r*.92);armour.addColorStop(0,'#090716');armour.addColorStop(.42,'#17102d');armour.addColorStop(.68,'#25113b');armour.addColorStop(1,'#0a0817');
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.rotate(Math.sin(clock*.52)*.035);ctx.scale(breath,breath);

  // Broken orbital rails read as machinery rather than a player shield.
  ctx.save();ctx.rotate(t*.055-.24);ctx.strokeStyle=hit?'rgba(247,220,255,.84)':'rgba(207,92,225,.64)';ctx.shadowBlur=phase>=2?12:8;ctx.shadowColor='#cf5ce1';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,r*1.54,-2.70,-.28);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*1.54,.44,2.66);ctx.stroke();ctx.restore();
  if(phase>=2){ctx.save();ctx.rotate(-t*.038+.36);ctx.setLineDash([10,9]);ctx.strokeStyle=phase===3?'rgba(117,225,239,.74)':'rgba(154,112,232,.64)';ctx.shadowBlur=10;ctx.shadowColor=phase===3?'#75e1ef':'#9a70e8';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,0,r*1.84,-1.16,.34);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*1.84,1.90,3.38);ctx.stroke();ctx.setLineDash([]);ctx.restore();}

  // Broad asymmetric armour blades carry the visual mass. Hit flash stays on
  // the luminous edges so the silhouette does not wash into a white pinwheel.
  const blade=(side,upper)=>{
    ctx.save();ctx.scale(side,upper);ctx.fillStyle=armour;ctx.strokeStyle=upper>0?edge:main;ctx.shadowBlur=hit?13:5;ctx.shadowColor=upper>0?edge:main;ctx.lineWidth=2.8;
    ctx.beginPath();ctx.moveTo(r*.12,-r*.10);ctx.lineTo(r*.64,-r*.58);ctx.lineTo(r*1.46,-r*.76);ctx.lineTo(r*1.76,-r*.36);ctx.lineTo(r*1.36,-r*.12);ctx.lineTo(r*.70,-r*.04);ctx.lineTo(r*.34,r*.20);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.shadowBlur=7;ctx.globalAlpha=.78;ctx.strokeStyle=cyan;ctx.lineWidth=1.55;ctx.beginPath();ctx.moveTo(r*.50,-r*.36);ctx.lineTo(r*1.30,-r*.55);ctx.lineTo(r*1.54,-r*.34);ctx.stroke();ctx.globalAlpha=.33;ctx.beginPath();ctx.moveTo(r*.68,-r*.16);ctx.lineTo(r*1.28,-r*.26);ctx.stroke();ctx.restore();
  };
  blade(1,1);blade(-1,-1);

  // Counter-blades keep the machine asymmetric and give it a second depth plane.
  ctx.save();ctx.rotate(.20+Math.sin(clock*.72)*.018);ctx.fillStyle=armour;ctx.strokeStyle=main;ctx.shadowBlur=hit?11:4;ctx.shadowColor=main;ctx.lineWidth=2.35;
  ctx.beginPath();ctx.moveTo(-r*.18,-r*.12);ctx.lineTo(-r*.72,-r*.84);ctx.lineTo(-r*1.18,-r*.98);ctx.lineTo(-r*.96,-r*.42);ctx.lineTo(-r*.44,r*.02);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(r*.18,r*.12);ctx.lineTo(r*.72,r*.84);ctx.lineTo(r*1.18,r*.98);ctx.lineTo(r*.96,r*.42);ctx.lineTo(r*.44,-r*.02);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();

  // Crown / keel fins communicate orientation without a player-like arrow.
  ctx.fillStyle='#120b25';ctx.strokeStyle=cyan;ctx.shadowBlur=7;ctx.shadowColor=cyan;ctx.lineWidth=1.95;
  ctx.beginPath();ctx.moveTo(-r*.18,-r*.42);ctx.lineTo(0,-r*1.18);ctx.lineTo(r*.22,-r*.48);ctx.lineTo(r*.08,-r*.24);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-r*.10,r*.34);ctx.lineTo(r*.16,r*1.03);ctx.lineTo(r*.34,r*.40);ctx.lineTo(r*.10,r*.18);ctx.closePath();ctx.fill();ctx.stroke();

  // Later phases visibly unfold extra energy vanes instead of only adding bullets.
  if(phase>=2){
    ctx.save();ctx.rotate(-.16+Math.sin(clock*.9)*.025);ctx.shadowBlur=11;ctx.shadowColor=cyan;ctx.strokeStyle=phase===3?'rgba(126,238,255,.88)':'rgba(126,224,240,.70)';ctx.fillStyle=phase===3?'rgba(117,225,239,.12)':'rgba(154,112,232,.09)';ctx.lineWidth=1.7;
    for(const side of[-1,1]){ctx.save();ctx.scale(side,1);ctx.beginPath();ctx.moveTo(r*.76,-r*.18);ctx.lineTo(r*1.42,-r*.08);ctx.lineTo(r*1.78,r*.20);ctx.lineTo(r*1.14,r*.10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    ctx.restore();
  }
  if(phase===3){
    ctx.save();ctx.rotate(t*.10);ctx.strokeStyle='rgba(117,225,239,.78)';ctx.shadowBlur=13;ctx.shadowColor='#75e1ef';ctx.lineWidth=2;for(let i=0;i<6;i++){const a=i*TAU/6+.12;ctx.beginPath();ctx.arc(0,0,r*2.10,a,a+.28);ctx.stroke();ctx.beginPath();ctx.moveTo(Math.cos(a+.14)*r*1.88,Math.sin(a+.14)*r*1.88);ctx.lineTo(Math.cos(a+.14)*r*2.22,Math.sin(a+.14)*r*2.22);ctx.stroke();}ctx.restore();
  }

  // Void diamond core: dark center, layered energy spine, no circular player core.
  ctx.shadowBlur=0;ctx.save();ctx.rotate(Math.PI/4+t*.012);ctx.fillStyle='#05040d';ctx.strokeStyle=main;ctx.shadowBlur=hit?16:7;ctx.shadowColor=main;ctx.lineWidth=3.2;ctx.fillRect(-r*.34,-r*.34,r*.68,r*.68);ctx.strokeRect(-r*.34,-r*.34,r*.68,r*.68);ctx.restore();
  ctx.save();ctx.rotate(-Math.PI/4);ctx.fillStyle='#211039';ctx.strokeStyle=edge;ctx.lineWidth=1.7;ctx.fillRect(-r*.20,-r*.20,r*.40,r*.40);ctx.strokeRect(-r*.20,-r*.20,r*.40,r*.40);ctx.restore();
  const coreGlow=ctx.createLinearGradient(0,-r*.34,0,r*.34);coreGlow.addColorStop(0,'rgba(117,225,239,0)');coreGlow.addColorStop(.25,cyan);coreGlow.addColorStop(.50,'#f4fbff');coreGlow.addColorStop(.75,cyan);coreGlow.addColorStop(1,'rgba(117,225,239,0)');ctx.fillStyle=coreGlow;ctx.shadowBlur=16;ctx.shadowColor=cyan;ctx.globalAlpha=.92;ctx.fillRect(-r*.060,-r*.34*pulse,r*.12,r*.68*pulse);ctx.globalAlpha=1;ctx.shadowBlur=0;

  const satelliteCount=phase+1,orbitR=r*(phase===3?1.94:1.80);
  for(let i=0;i<satelliteCount;i++){
    const a=t*(.46+phase*.035)+i/satelliteCount*TAU,x=Math.cos(a)*orbitR,y=Math.sin(a)*orbitR*.72;
    ctx.save();ctx.globalAlpha=.23;ctx.strokeStyle=i%2?edge:cyan;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x*.76,y*.76);ctx.lineTo(x,y);ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/4);ctx.fillStyle=i%2?edge:cyan;ctx.shadowBlur=phase===3?13:9;ctx.shadowColor=i%2?edge:cyan;ctx.globalAlpha=.96;ctx.fillRect(-4.8,-4.8,9.6,9.6);ctx.globalAlpha=.46;ctx.strokeStyle='#effcff';ctx.lineWidth=1;ctx.strokeRect(-7.5,-7.5,15,15);ctx.restore();
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
      drawEntry(_transition,p){
      const ease=p*p*(3-2*p),reveal=clamp(p/.18,0,1),fake={stagePhase:p>.70?2:1,stage01OrbitDir:1,hit:0};
      ctx.save();ctx.translate(vw*.5,lerp(vh*.22,vh*.39,ease));ctx.globalAlpha=reveal;ctx.rotate((1-ease)*-.52);const scale=lerp(.30,compactDevice()?.70:1.02,ease);ctx.scale(scale,scale);
      ctx.save();ctx.globalAlpha=(1-ease)*.58;ctx.strokeStyle='#7de8ff';ctx.shadowBlur=14;ctx.shadowColor='#7de8ff';ctx.lineWidth=1.5;for(let i=0;i<8;i++){const a=i/8*TAU+(1-ease)*.4;ctx.beginPath();ctx.moveTo(Math.cos(a)*54,Math.sin(a)*54);ctx.lineTo(Math.cos(a)*(118+90*(1-ease)),Math.sin(a)*(118+90*(1-ease)));ctx.stroke();}ctx.restore();
      drawOrbitWarden(fake);ctx.restore();
    },
    drawBody(enemy){drawOrbitWarden(enemy);},
      defeat(enemy){enemy.color='#9a55d6';baseProduction?.defeat?.(enemy);}
    });
    const bossProfile=Object.freeze({...runtime.bossProfile,r:82,hitRadius:88,contactRadius:54,color:'#9a55d6',spawnShockwave:175});
    window.stackfallStageRuntimeRegistry.set(STAGE_ID,Object.freeze({...runtime,hazard:polishedRouteSweep,bossProfile,production}));
  }
})();
