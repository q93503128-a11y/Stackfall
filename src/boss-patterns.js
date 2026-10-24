function rawLine(x1,y1,x2,y2,width,damage,color,life=.9,impactStyle=null){if(state.entities.telegraphs.length>=entityCap('telegraphs'))state.entities.telegraphs.shift();const environment=state.stageEnvironmentTelegraphContext||null,scale=environment?window.stackfallStageEnvironmentCombatScale?.(environment):null;if(scale){damage*=scale.damage;life*=scale.warning;}state.entities.telegraphs.push({type:'line',x:x1,y:y1,a:Math.atan2(y2-y1,x2-x1),length:Math.hypot(x2-x1,y2-y1),width,life,max:life,damage,color,impactStyle:environment?'stage-env-line':impactStyle,environmentFamily:environment?.family||null,environmentVariant:environment?.variant||null,environmentStageId:environment?.stageId||null,environmentAmbient:!!environment?.ambient});}
function predictedPlayer(distance=130){let x=0,y=0;if(state.input.keys.has('KeyA')||state.input.keys.has('ArrowLeft'))x--;if(state.input.keys.has('KeyD')||state.input.keys.has('ArrowRight'))x++;if(state.input.keys.has('KeyW')||state.input.keys.has('ArrowUp'))y--;if(state.input.keys.has('KeyS')||state.input.keys.has('ArrowDown'))y++;x+=state.input.touchX||0;y+=state.input.touchY||0;const d=Math.hypot(x,y)||1;return{x:player.x+x/d*distance,y:player.y+y/d*distance};}
function nearbyTwin(e){return e.twinGroup?state.entities.enemies.find(other=>other!==e&&!other.dead&&other.twinGroup===e.twinGroup):null;}
function placeMines(e,count,color,damage){const base=Math.atan2(player.y-e.y,player.x-e.x);for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*.25,dist=90+i*48;spawnEnemyProjectile(e.x+Math.cos(a)*dist,e.y+Math.sin(a)*dist,0,0,damage,color,7,4.2,'mine');}}
function webAroundPlayer(count,radius,damage,color){const pts=[];for(let i=0;i<count;i++){const a=i/count*TAU+.25,rr=radius*(i%2?1:.72);pts.push({x:player.x+Math.cos(a)*rr,y:player.y+Math.sin(a)*rr});}for(let i=0;i<count;i++)rawLine(pts[i].x,pts[i].y,pts[(i+2)%count].x,pts[(i+2)%count].y,18,damage,color,1.15);}

function bossLater(e,delayMs,action){scheduleWeaponAction(delayMs,()=>{if(!e||e.dead||!state.entities.enemies.includes(e)||['gameover','stageVictory','stageComplete'].includes(state.mode))return;action();});}

function miniSkill(e,dt){
  e.skillCd-=dt;e.burstCd-=dt;const d=Math.max(4,e.damage*.5),f=e.eliteForm;
  if(f==='knight'){
    if(e.skillCd<=0){
      e.skillCd=3.15;const p=predictedPlayer(95),base=Math.atan2(p.y-e.y,p.x-e.x),length=Math.max(300,Math.hypot(p.x-e.x,p.y-e.y)+95);
      for(const off of[-.17,0,.17])addLine(e,base+off,length,17,d*.76,'#c79cff',.72);
      bossLater(e,520,()=>{fireFan(e,3,.11,250,d*.84,'#e7c4ff',5.2);});
    }
    if(e.burstCd<=0){
      e.burstCd=6.4;const p=predictedPlayer(145),a=Math.atan2(p.y-e.y,p.x-e.x),length=Math.hypot(p.x-e.x,p.y-e.y)+145;
      addLine(e,a,length,31,d*1.12,'#f0d7ff',.78);
      bossLater(e,560,()=>{const aim=Math.atan2(p.y-e.y,p.x-e.x);e.dash=.48;e.dashX=Math.cos(aim)*455;e.dashY=Math.sin(aim)*455;});
    }
  }else if(f==='warden'){
    if(e.skillCd<=0){
      e.skillCd=4.25;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.025);shockwave(e.x,e.y,'#a8f5ff',100,.40,3);
      const base=e.phase*.07;for(let i=0;i<6;i++){const a=base+i*TAU/6;addCircle(e.x+Math.cos(a)*108,e.y+Math.sin(a)*108,42,d*.72,'#72e9ff',1.05+i*.035);}
    }
    if(e.burstCd<=0){
      e.burstCd=7.5;const p=predictedPlayer(80);
      addCircle(p.x,p.y,54,d*.72,'#d4fbff',.82);
      bossLater(e,260,()=>addCircle(p.x,p.y,92,d*.88,'#91efff',.88));
      bossLater(e,520,()=>addCircle(p.x,p.y,132,d*1.05,'#72e9ff',.94));
    }
  }else if(f==='executioner'){
    if(e.skillCd<=0){
      e.skillCd=2.75;const p=predictedPlayer(125),span=210;
      rawLine(p.x-span,p.y-span,p.x+span,p.y+span,18,d*.88,'#ff7db6',.72,'boss-line');
      rawLine(p.x+span,p.y-span,p.x-span,p.y+span,18,d*.88,'#ffb0d0',.82,'boss-line');
    }
    if(e.burstCd<=0){
      e.burstCd=6.15;const p=predictedPlayer(165),a=Math.atan2(p.y-e.y,p.x-e.x),nx=-Math.sin(a),ny=Math.cos(a);
      addLine(e,a,Math.hypot(p.x-e.x,p.y-e.y)+190,32,d*1.18,'#ff9bc9',.68);
      bossLater(e,500,()=>{e.dash=.52;e.dashX=Math.cos(a)*500;e.dashY=Math.sin(a)*500;for(const off of[-72,0,72])rawLine(p.x+nx*off-Math.cos(a)*185,p.y+ny*off-Math.sin(a)*185,p.x+nx*off+Math.cos(a)*185,p.y+ny*off+Math.sin(a)*185,14,d*.72,'#ff7db6',.68,'boss-line');});
    }
  }else if(f==='colossus'){
    if(e.skillCd<=0){
      e.skillCd=4.65;addCircle(e.x,e.y,148,d*1.22,'#ffb75e',1.18);const base=e.phase*.035;
      for(let i=0;i<6;i++){const a=base+i*TAU/6;rawLine(e.x+Math.cos(a)*52,e.y+Math.sin(a)*52,e.x+Math.cos(a)*310,e.y+Math.sin(a)*310,24,d*.72,'#ffd07b',1.06+i*.025,'boss-line');}
    }
    if(e.burstCd<=0){
      e.burstCd=8.0;const p=predictedPlayer(115);
      for(let i=0;i<4;i++){const a=i*2.399+e.phase*.04,rr=36+i*54;bossLater(e,i*170,()=>addCircle(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr,70+i*4,d*(.78+i*.08),'#ffcb72',1.02));}
    }
  }else if(f==='harvester'){
    if(e.skillCd<=0){
      e.skillCd=3.35;const p=predictedPlayer(110),a=Math.atan2(p.y-e.y,p.x-e.x),nx=-Math.sin(a),ny=Math.cos(a),far=245;
      rawLine(e.x,e.y,p.x+nx*92,p.y+ny*92,20,d*.88,'#ff9c7d',.78,'boss-line');
      rawLine(e.x,e.y,p.x-nx*92,p.y-ny*92,20,d*.88,'#ffc0a8',.92,'boss-line');
      rawLine(p.x-nx*far,p.y-ny*far,p.x+nx*far,p.y+ny*far,15,d*.66,'#ff815f',1.06,'boss-line');
    }
    if(e.burstCd<=0){
      e.burstCd=6.7;const prey=state.entities.enemies.find(m=>m!==e&&!m.dead&&m.type!=='mini'&&m.type!=='boss'&&Math.hypot(m.x-e.x,m.y-e.y)<330);
      if(prey){
        const hx=prey.x,hy=prey.y;prey.dead=true;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.075);shockwave(hx,hy,'#ff9c7d',96,.40,3);
        bossLater(e,260,()=>{for(let i=0;i<7;i++){const a=i*TAU/7+e.phase*.05;spawnEnemyProjectile(hx,hy,a,175+i*5,d*.72,'#ffb08f',5.4,6,'needle');}});
      }else{
        const p=predictedPlayer(145);for(let i=0;i<3;i++)addCircle(p.x+rand(-90,90),p.y+rand(-90,90),54,d*.88,'#ff9c7d',.95+i*.16);
      }
    }
  }else if(f==='mirror'){
    const side=e.twinSide||1,twin=nearbyTwin(e);
    if(e.skillCd<=0){
      e.skillCd=2.9;
      if(side<0){
        const base=Math.atan2(player.y-e.y,player.x-e.x);for(let i=-3;i<=3;i++)spawnEnemyProjectile(e.x,e.y,base+i*.13,190+Math.abs(i)*12,d*.78,'#e0d7ff',5,6,'mirror');
      }else{
        const p=predictedPlayer(135),span=205;rawLine(p.x-span,p.y-76,p.x+span,p.y+76,16,d*.78,'#9d82ff',.82,'boss-line');rawLine(p.x-span,p.y+76,p.x+span,p.y-76,16,d*.78,'#c8b9ff',.96,'boss-line');
      }
    }
    if(e.burstCd<=0){
      e.burstCd=6.8;
      if(side<0&&twin){
        rawLine(e.x,e.y,twin.x,twin.y,24,d*1.05,'#efe8ff',.92,'boss-line');const ax=e.x,ay=e.y,bx=twin.x,by=twin.y;
        bossLater(e,690,()=>{if(twin.dead)return;e.x=bx;e.y=by;twin.x=ax;twin.y=ay;shockwave(e.x,e.y,'#e0d7ff',84,.34,2.6);shockwave(twin.x,twin.y,'#9d82ff',84,.34,2.6);});
      }else if(!twin){
        const a=Math.random()*TAU,oldX=e.x,oldY=e.y;e.x=player.x+Math.cos(a)*390;e.y=player.y+Math.sin(a)*390;rawLine(oldX,oldY,e.x,e.y,12,d*.62,'#b6a2ff',.55,'boss-line');
      }
    }
  }else{
    if(e.skillCd<=0)e.skillCd=4.0;if(e.burstCd<=0)e.burstCd=7.0;
  }
}

function normalBossSkill(e,dt){
  const k=skillScale(e);e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;const d=Math.max(5,e.damage*.48),f=e.eliteForm;
  if(f==='eclipse'){
    if(e.skillCd<=0){
      e.skillCd=3.25;e.eclipseSweep=(e.eclipseSweep||0)+1;const p=predictedPlayer(80),angle=e.eclipseSweep*.42;
      for(let i=0;i<4;i++){const a=angle+i*TAU/4,nx=-Math.sin(a),ny=Math.cos(a),cx=p.x+nx*(i%2?62:-62),cy=p.y+ny*(i%2?62:-62);rawLine(cx-Math.cos(a)*320,cy-Math.sin(a)*320,cx+Math.cos(a)*320,cy+Math.sin(a)*320,20,d*.86,'#ff72cb',.92+i*.06,'boss-line');}
    }
    if(e.burstCd<=0){
      e.burstCd=6.4;const p=predictedPlayer(125);addCircle(p.x,p.y,124,d*1.28,'#6f215f',1.34);bossLater(e,310,()=>addCircle(p.x,p.y,62,d*.82,'#ff9bd4',.84));
    }
    if(e.pulseCd<=0){
      e.pulseCd=9.1;const gap=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,22,145,d*.76,'#9e52c9',-e.phase*.14,gap,.30,5.2);
    }
  }else if(f==='seraph'){
    if(e.skillCd<=0){
      e.skillCd=2.65;const aim=Math.atan2(player.y-e.y,player.x-e.x),nx=-Math.sin(aim),ny=Math.cos(aim);
      for(const side of[-1,1]){const x=e.x+nx*side*42,y=e.y+ny*side*42;for(let i=-2;i<=2;i++)spawnEnemyProjectile(x,y,aim+i*.105,230+Math.abs(i)*8,d*.78,side<0?'#9fffea':'#d7fff5',5.2,6,'storm');}
    }
    if(e.burstCd<=0){
      e.burstCd=6.7;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.045);shockwave(e.x,e.y,'#c9fff4',170,.58,5);
      for(let i=0;i<5;i++){const a=i*TAU/5+e.phase*.05;addCircle(e.x+Math.cos(a)*138,e.y+Math.sin(a)*138,48,d*.72,'#9fffea',1.10+i*.04);}
    }
    if(e.pulseCd<=0){e.pulseCd=9.5;summonMinions(e,2,'fast');bossLater(e,320,()=>fireRing(e,10,118,d*.62,'#b8fff0',e.phase*.12,5.5));}
  }else if(f==='pulsar'){
    if(e.skillCd<=0){
      e.skillCd=3.45;const p={x:player.x,y:player.y};addCircle(p.x,p.y,62,d*.64,'#d1efff',.68);bossLater(e,180,()=>addCircle(p.x,p.y,118,d*.82,'#69bfff',.82));bossLater(e,380,()=>addCircle(p.x,p.y,182,d*1.02,'#4f96e9',.96));
    }
    if(e.burstCd<=0){
      e.burstCd=6.55;e.pulsarBeat=(e.pulsarBeat||0)+1;const off=e.pulsarBeat*.31;fireRing(e,12,105,d*.82,'#5ea8ff',off,6.2);bossLater(e,300,()=>fireRing(e,16,205,d*.60,'#b5e8ff',-off*.8,4.6));
    }
    if(e.pulseCd<=0){
      e.pulseCd=9.0;const p=predictedPlayer(170);for(let i=0;i<4;i++){const a=i*TAU/4+e.phase*.06;addCircle(p.x+Math.cos(a)*112,p.y+Math.sin(a)*112,50,d*.94,'#79c8ff',.88+i*.12);}
    }
  }else if(f==='leviathan'){
    if(e.skillCd<=0){
      e.skillCd=3.8;const p=predictedPlayer(165),a=Math.atan2(p.y-e.y,p.x-e.x),length=Math.hypot(p.x-e.x,p.y-e.y)+260,ox=e.x,oy=e.y;
      addLine(e,a,length,54,d*1.38,'#ffc18f',.92);
      bossLater(e,680,()=>{e.dash=.82;e.dashX=Math.cos(a)*420;e.dashY=Math.sin(a)*420;for(let i=1;i<=5;i++)addCircle(ox+Math.cos(a)*i*78,oy+Math.sin(a)*i*78,34+i*2,d*.66,'#ff895f',.72+i*.08);});
    }
    if(e.burstCd<=0){
      e.burstCd=7.0;const base=Math.atan2(player.y-e.y,player.x-e.x)+Math.PI;for(let i=0;i<7;i++){const a=base+(i-3)*.24,dist=86+i*38;spawnEnemyProjectile(e.x+Math.cos(a)*dist,e.y+Math.sin(a)*dist,0,0,d*.66,'#ff895f',8,4.6,'mine');}
    }
    if(e.pulseCd<=0){e.pulseCd=9.6;fireFan(e,3,.18,168,d*1.22,'#ffad73',8.4);}
  }else if(f==='archivist'){
    e.archiveSampleCd=(e.archiveSampleCd||0)-dt;if(e.archiveSampleCd<=0){e.archiveSampleCd=.72;e.archiveTrail=e.archiveTrail||[];e.archiveTrail.push({x:player.x,y:player.y});if(e.archiveTrail.length>6)e.archiveTrail.shift();}
    if(e.skillCd<=0){
      e.skillCd=3.0;const p=predictedPlayer(115),span=270;rawLine(p.x-span,p.y,p.x+span,p.y,18,d*.88,'#d7b0ff',.92,'boss-line');rawLine(p.x,p.y-span,p.x,p.y+span,18,d*.88,'#ad82e0',1.08,'boss-line');
    }
    if(e.burstCd<=0){
      e.burstCd=6.65;const record=e.archiveTrail?.[0]||{x:player.x,y:player.y},oldX=e.x,oldY=e.y;e.x=record.x+Math.cos(e.phase*.17)*210;e.y=record.y+Math.sin(e.phase*.17)*210;shockwave(oldX,oldY,'#805bbd',74,.30,2);shockwave(e.x,e.y,'#d7b0ff',94,.42,3);rawLine(oldX,oldY,record.x,record.y,18,d*.78,'#9e74ca',.74,'boss-line');
    }
    if(e.pulseCd<=0){
      e.pulseCd=9.2;const p=e.archiveTrail?.at(-2)||{x:player.x,y:player.y},points=[];for(let i=0;i<6;i++){const a=i*TAU/6+e.phase*.04;points.push({x:p.x+Math.cos(a)*138,y:p.y+Math.sin(a)*138});}
      for(let i=0;i<6;i++)rawLine(points[i].x,points[i].y,points[(i+2)%6].x,points[(i+2)%6].y,15,d*.74,'#c89cff',1.08+i*.035,'boss-line');
    }
  }else if(f==='heliarch'){
    if(e.skillCd<=0){
      e.skillCd=3.2;e.heliarchSweep=(e.heliarchSweep||0)+1;const spokes=10,safe=e.heliarchSweep%spokes,base=e.heliarchSweep*.19;
      for(let i=0;i<spokes;i++){if(i===safe||i===(safe+1)%spokes)continue;const a=base+i*TAU/spokes;addLine(e,a,570,18,d*.88,i%2?'#ffe89b':'#ffd66f',.98+i*.025);}
    }
    if(e.burstCd<=0){
      e.burstCd=6.25;const p=predictedPlayer(70);for(let i=0;i<6;i++){const a=i*2.399+e.phase*.03,rr=35+i*36;bossLater(e,i*120,()=>addCircle(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr,54+i*2,d*(.78+i*.055),'#ffbf5c',.92));}
    }
    if(e.pulseCd<=0){e.pulseCd=9.2;const gap=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,24,165,d*.72,'#fff0a8',e.phase*.18,gap,.24,5.4);}
  }else if(f==='tempest'){
    if(e.skillCd<=0){
      e.skillCd=2.55;const points=[],start={x:e.x,y:e.y};for(let i=0;i<3;i++){const a=Math.random()*TAU,r=290+i*55;points.push({x:player.x+Math.cos(a)*r,y:player.y+Math.sin(a)*r});}
      let previous=start;points.forEach((point,index)=>{rawLine(previous.x,previous.y,point.x,point.y,14,d*.66,'#76d9ff',.54+index*.10,'boss-line');previous=point;bossLater(e,180+index*170,()=>{e.x=point.x;e.y=point.y;shockwave(e.x,e.y,'#a9eaff',72,.26,2);});});
      bossLater(e,760,()=>fireFan(e,6,.10,275,d*.88,'#d5f5ff',4.8));
    }
    if(e.burstCd<=0){
      e.burstCd=5.7;const trail=[predictedPlayer(0),predictedPlayer(90),predictedPlayer(185),predictedPlayer(280)];for(let i=0;i<trail.length;i++)addCircle(trail[i].x+rand(-35,35),trail[i].y+rand(-35,35),48+i*2,d*(.82+i*.06),'#76d9ff',.70+i*.16);
    }
    if(e.pulseCd<=0){
      e.pulseCd=8.25;for(let i=0;i<9;i++){const a=i*TAU/9+e.phase*.12,p=spawnEnemyProjectile(e.x,e.y,a,185,d*.56,'#b8f5ff',4.6,6,'storm');p.homingTurn=1.15;p.homingUntil=1.1;}
    }
  }else if(f==='nullengine'){
    if(e.skillCd<=0){
      e.skillCd=3.55;let converted=0;for(const p of state.entities.projectiles){if(converted>=12)break;if(Math.hypot(p.x-e.x,p.y-e.y)<305){p.life=0;const a=Math.atan2(player.y-e.y,player.x-e.x)+rand(-.28,.28);spawnEnemyProjectile(e.x,e.y,a,192,d*.68,'#a9b4d8',5.5,6,'rune');converted++;}}shockwave(e.x,e.y,'#a9b4d8',305,.54,4);
      if(!converted)addCircle(e.x,e.y,132,d*.74,'#6d789d',.92);
    }
    if(e.burstCd<=0){
      e.burstCd=6.45;e.nullGridCycle=(e.nullGridCycle||0)+1;const horizontal=e.nullGridCycle%2===0,lanes=7,safe=(e.nullGridCycle*2)%lanes,spacing=82,span=405;
      for(let i=0;i<lanes;i++){if(i===safe)continue;const off=(i-(lanes-1)/2)*spacing;if(horizontal)rawLine(player.x-span,player.y+off,player.x+span,player.y+off,14,d*.80,'#eaf1ff',1.16,'null-grid');else rawLine(player.x+off,player.y-span,player.x+off,player.y+span,14,d*.80,'#8799c9',1.16,'null-grid');}
    }
    if(e.pulseCd<=0){e.pulseCd=9.15;fireRing(e,14,108,d*.78,'#6d789d',e.phase*.10,7.2);}
  }else{
    if(e.skillCd<=0)e.skillCd=4.0;if(e.burstCd<=0)e.burstCd=7.0;if(e.pulseCd<=0)e.pulseCd=10.0;
  }
}

function voidBossSkill(e,dt){const k=skillScale(e);e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;const d=Math.max(5,e.damage*.47),f=e.eliteForm;
  if(f==='maw'){
    if(e.skillCd<=0){e.skillCd=3.0;let eaten=0;for(const p of state.entities.projectiles){if(eaten>=14)break;if(Math.hypot(p.x-e.x,p.y-e.y)<340){p.life=0;eaten++;}}if(eaten)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*Math.min(.08,eaten*.004));const dx=e.x-player.x,dy=e.y-player.y,dist=Math.hypot(dx,dy)||1;player.x+=dx/dist*Math.min(28,dist*.06);player.y+=dy/dist*Math.min(28,dist*.06);shockwave(e.x,e.y,'#9b5cff',340,.6,5);}
    if(e.burstCd<=0){e.burstCd=5.7;fireFan(e,9,.16,245,d*1.05,'#bb82ff',7);}
    if(e.pulseCd<=0){e.pulseCd=8.6;addCircle(e.x,e.y,185,d*1.34,'#713dd0',1.35);}
  }else if(f==='oracle'){
    if(e.skillCd<=0){e.skillCd=2.75;const p=predictedPlayer(190);for(let i=0;i<5;i++){const a=i/5*TAU;addCircle(p.x+Math.cos(a)*90,p.y+Math.sin(a)*90,48,d,'#d6a8ff',.88+i*.1);}}
    if(e.burstCd<=0){e.burstCd=6.0;const p=predictedPlayer(230);rawLine(e.x,e.y,p.x,p.y,34,d*1.28,'#c58aff',1.15);}
    if(e.pulseCd<=0){e.pulseCd=8.8;fireRing(e,18,132,d*.78,'#a86df0',-e.phase*.2);}
  }else if(f==='weaver'){
    if(e.skillCd<=0){e.skillCd=3.15;webAroundPlayer(7,190,d*.92,'#8d5ddb');}
    if(e.burstCd<=0){e.burstCd=6.1;for(let arm=0;arm<5;arm++)for(let i=0;i<3;i++)spawnEnemyProjectile(e.x,e.y,arm*TAU/5+e.phase*.18+i*.13,120+i*38,d*.72,'#7446c8',5,6.5);}
    if(e.pulseCd<=0){e.pulseCd=9.0;addCircle(player.x,player.y,88,d*1.25,'#8a56d2',1.15);}
  }else if(f==='grave'){
    if(e.skillCd<=0){e.skillCd=3.8;summonMinions(e,5,'tank');}
    if(e.burstCd<=0){e.burstCd=6.7;for(let i=0;i<4;i++){const a=i/4*TAU;addCircle(player.x+Math.cos(a)*125,player.y+Math.sin(a)*125,70,d,'#6960ad',1.25);}}
    if(e.pulseCd<=0){e.pulseCd=9.2;fireRing(e,14,92,d*.92,'#8c82ce',e.phase*.1,7);}
  }else if(f==='paradox'){
    const side=e.twinSide||1;if(e.skillCd<=0){e.skillCd=2.55;if(side<0)fireRing(e,15,155,d*.75,'#d69cff',e.phase*.24);else{const p=predictedPlayer(175);for(let i=-2;i<=2;i++)rawLine(p.x+i*58,p.y-250,p.x-i*58,p.y+250,15,d*.78,'#8d6bce',.92);}}
    if(e.burstCd<=0){e.burstCd=5.9;const twin=nearbyTwin(e);if(twin){const mx=(e.x+twin.x)/2,my=(e.y+twin.y)/2;addCircle(mx,my,135,d*1.18,'#e7c3ff',1.12);fireFan(e,5,side*.15,205,d*.82,side<0?'#d69cff':'#8d6bce');}}
    if(e.pulseCd<=0){e.pulseCd=8.4;const twin=nearbyTwin(e);if(twin)rawLine(e.x,e.y,twin.x,twin.y,28,d*1.12,'#e7c3ff',1.0);}
  }else{
    if(e.skillCd<=0){e.skillCd=2.9;const dx=e.x-player.x,dy=e.y-player.y,dist=Math.hypot(dx,dy)||1;player.x+=dx/dist*Math.min(18,dist*.04);player.y+=dy/dist*Math.min(18,dist*.04);fireFan(e,5,.17,188,d,'#bb82ff');}
    if(e.burstCd<=0){e.burstCd=5.9;fireRing(e,12,126,d*.88,'#713dd0',e.phase*.18);}
    if(e.pulseCd<=0){e.pulseCd=8.8;for(let i=0;i<3;i++){const a=i/3*TAU+e.phase*.1,r=i?95:0;addCircle(player.x+Math.cos(a)*r,player.y+Math.sin(a)*r,72,d*1.25,'#8a4dff',1.25);}}
  }
}

function fireRingWithGaps(e,count,speed,damage,color,offset=0,gapAngle=0,gapWidth=.24,r=5.4){const visual=enemyProjectileVisualFor(e,'ring');for(let i=0;i<count;i++){const a=i/count*TAU+offset,d=Math.abs(Math.atan2(Math.sin(a-gapAngle),Math.cos(a-gapAngle)));if(d<gapWidth||Math.abs(d-Math.PI)<gapWidth*.72)continue;spawnEnemyProjectile(e.x,e.y,a,speed,damage,color,r,7,visual);}}
function apexArenaPoints(count,radius,phase=0){const arena=state.apexArena||{x:player.x,y:player.y,r:radius};return Array.from({length:count},(_,i)=>{const a=i/count*TAU+phase;return{x:arena.x+Math.cos(a)*Math.min(radius,arena.r*.78),y:arena.y+Math.sin(a)*Math.min(radius,arena.r*.78)};});}
function constellationTeleportDestination(e,step=0){const arena=state.apexArena;if(!arena)return null;let best=null,bestDistance=-1;for(let i=0;i<8;i++){const a=(e.phase*.19+step*2.399+i*TAU/8)%TAU,x=arena.x+Math.cos(a)*arena.r*.48,y=arena.y+Math.sin(a)*arena.r*.36,d=Math.hypot(x-player.x,y-player.y);if(d>bestDistance){bestDistance=d;best={x,y};}if(d>player.r+e.r+150)return{x,y};}return best;}
function teleportConstellation(e,step=0,delay=.66){const destination=constellationTeleportDestination(e,step);if(!destination||e.teleportQueued)return;e.teleportQueued=true;e.attackLockUntil=Math.max(e.attackLockUntil||0,state.time+delay+.44);state.entities.telegraphs.push({type:'circle',x:destination.x,y:destination.y,r:e.r+38,life:delay,max:delay,damage:0,color:'#dce6ff',impactStyle:'teleport-arrival',cosmetic:true});scheduleWeaponAction(delay*1000,()=>{e.teleportQueued=false;if(e.dead||state.mode!=='playing')return;const oldX=e.x,oldY=e.y;e.x=destination.x;e.y=destination.y;e.dash=0;e.contactSafeUntil=state.time+.48;e.attackLockUntil=Math.max(e.attackLockUntil||0,state.time+.42);state.entities.beams.push({x1:oldX,y1:oldY,x2:e.x,y2:e.y,life:.38,max:.38,color:'#dce6ff',width:2.2});shockwave(oldX,oldY,'#7f91ca',72,.28,2);shockwave(e.x,e.y,'#e7edff',102,.42,3);});}
function rememberApexPlayer(e,dt){e.apexHistoryCd=(e.apexHistoryCd||0)-dt;if(e.apexHistoryCd>0)return;e.apexHistoryCd=.30;e.apexPlayerHistory=e.apexPlayerHistory||[];e.apexPlayerHistory.push({x:player.x,y:player.y});if(e.apexPlayerHistory.length>14)e.apexPlayerHistory.shift();}
function bossAntiIdleSkill(e,dt){
  if(!e||e.dead||e.type!=='boss'||e.kind!=='apex'||isAtrophos(e))return;
  e.antiIdleSampleCd=(e.antiIdleSampleCd||0)-dt;e.antiIdleCd=(e.antiIdleCd??3.4)-dt;
  if(e.antiIdleSampleCd<=0){e.antiIdleSampleCd=.24;const lx=Number.isFinite(e.antiIdlePlayerX)?e.antiIdlePlayerX:player.x,ly=Number.isFinite(e.antiIdlePlayerY)?e.antiIdlePlayerY:player.y,moved=Math.hypot(player.x-lx,player.y-ly);e.antiIdleStill=moved<7?(e.antiIdleStill||0)+.24:Math.max(0,(e.antiIdleStill||0)-.72);e.antiIdlePlayerX=player.x;e.antiIdlePlayerY=player.y;}
  if((e.antiIdleStill||0)<1.20||e.antiIdleCd>0)return;
  e.antiIdleStill=.25;e.antiIdleCd=3.05;const d=Math.max(4,e.damage*.30),x=player.x,y=player.y,form=e.apexForm||e.eliteForm;
  if(form==='starforge'){
    addCircle(x,y,68,d*1.12,'#ff7135',.76);const aim=Math.atan2(y-e.y,x-e.x);for(let i=-2;i<=2;i++)spawnEnemyProjectile(e.x,e.y,aim+i*.115,215+Math.abs(i)*8,d*.56,i%2?'#ffd26f':'#ff9d42',5.4,4.2,'forge');
  }else if(form==='lastconstellation'){
    const sx=184,sy=112;rawLine(x-sx,y-sy,x+sx,y+sy,18,d,'#d8e2ff',.88,'constellation-link');rawLine(x-sx,y+sy,x+sx,y-sy,18,d*.88,'#879be0',1.02,'constellation-link');
  }else addCircle(x,y,52,d,e.color||'#ff72cb',1.08);
}
function chronophageSignature(e,d,arena,phase){return atrophosDelayedCut(e,d,arena,phase);}

function starforgeSignature(e,d,arena,phase){
  const target=predictedPlayer(42+phase*16),primary=62+phase*6;
  addCircle(target.x,target.y,primary,d*1.10,'#ff7135',.78);
  const satellites=Math.min(5,2+phase);
  for(let i=0;i<satellites;i++){const a=i/satellites*TAU+e.phase*.04,rr=92+phase*8+(i%2)*26;addCircle(target.x+Math.cos(a)*rr,target.y+Math.sin(a)*rr,38+phase*3,d*.58,i%2?'#ffd26f':'#ff9d42',.92+i*.055);}
  bossLater(e,430,()=>{if(e.dead)return;const aim=Math.atan2(player.y-e.y,player.x-e.x),count=5+phase;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.10;spawnEnemyProjectile(e.x,e.y,aim+off,195+phase*13,d*.52,i%2?'#fff1b0':'#ff9d42',5.4,4.2,'forge');}});
}
function localConstellationPoints(cx,cy,count,radius,phase=0){const points=[];for(let i=0;i<count;i++){const a=i/count*TAU+phase,rr=radius*(i%2?1:.84);points.push({x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr});}return points;}
function constellationCage(e,d,arena,phase,life=1.02){
  const cx=player.x,cy=player.y,count=6+phase,radius=Math.min(arena.r*.42,142+phase*14),points=localConstellationPoints(cx,cy,count,radius,e.phase*.025),jump=phase>=3?2:1;
  for(let i=0;i<count;i++){if(i===count-1)continue;const a=points[i],b=points[(i+jump)%count];rawLine(a.x,a.y,b.x,b.y,11+phase,d*.54,i%2?'#9fb2ef':'#d8e2ff',life+i*.018,'constellation-link');}
  const centerCut=e.phase*.031,ux=Math.cos(centerCut),uy=Math.sin(centerCut),half=radius*1.08;rawLine(cx-ux*half,cy-uy*half,cx+ux*half,cy+uy*half,16+phase,d*.92,'#ffffff',life*.88,'constellation-link');if(phase>=3){const px=-uy,py=ux;rawLine(cx-px*half*.92,cy-py*half*.92,cx+px*half*.92,cy+py*half*.92,13+phase,d*.66,'#879be0',life*1.04,'constellation-link');}
  return points;
}
function constellationNodeVolley(e,d,arena,phase){
  const target={x:player.x,y:player.y},points=localConstellationPoints(target.x,target.y,5+phase,Math.min(arena.r*.46,180+phase*12),-e.phase*.02);
  for(let i=0;i<points.length;i++){const point=points[i],aim=Math.atan2(target.y-point.y,target.x-point.x);for(const off of[-.065,.065])spawnEnemyProjectile(point.x,point.y,aim+off,168+phase*18,d*.56,i%2?'#f0f4ff':'#9fb2ef',4.2,6,'constellation');}
}
function constellationSignature(e,d,arena,phase){
  constellationCage(e,d,arena,phase,1.06);bossLater(e,430,()=>{if(!e.dead)constellationNodeVolley(e,d*.92,arena,phase);});if(phase>=2)teleportConstellation(e,phase,.56);
}
function apexBossSkill(e,dt){
  if(isAtrophos(e))return updateAtrophos(e,dt);
  e.apexElapsed=(e.apexElapsed||0)+dt;rememberApexPlayer(e,dt);
  const health=e.hp/Math.max(1,e.maxHp),healthPhase=health<.25?4:health<.50?3:health<.75?2:1,timePhase=e.apexElapsed>=240?4:e.apexElapsed>=180?3:e.apexElapsed>=105?2:1,phase=Math.max(healthPhase,timePhase),terminal=phase===4&&e.apexElapsed>=240,k=terminal?.42:[1,.86,.72,.58][phase-1];
  e.apexPhase=phase;e.timeLock=0;if((e.attackLockUntil||0)>state.time)return;
  e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;e.signatureCd=(e.signatureCd??5.8)-dt/k;
  const d=Math.max(7,e.damage*.40),f=e.eliteForm,arena=state.apexArena||{x:player.x,y:player.y,r:460};
  if(e.signatureCd<=0){e.signatureCd=Math.max(5.4,8.8-phase*.82);if(f==='starforge')starforgeSignature(e,d,arena,phase);else constellationSignature(e,d,arena,phase);}
  e.apexFrenzyCd=(e.apexFrenzyCd??1.35)-dt;
  if(terminal&&e.apexFrenzyCd<=0){e.apexFrenzyCd=.95;if(f==='starforge'){addCircle(player.x,player.y,52,d*.82,'#ff7135',.60);const aim=Math.atan2(player.y-e.y,player.x-e.x);for(let i=-2;i<=2;i++)spawnEnemyProjectile(e.x,e.y,aim+i*.115,225,d*.48,'#ffd26f',5.2,4.0,'forge');}else constellationNodeVolley(e,d*.82,arena,phase);}
  if(f==='starforge'){
    if(e.skillCd<=0){e.skillCd=phase>=3?2.05:2.75;starforgeSignature(e,d*.86,arena,phase);}
    if(e.burstCd<=0){e.burstCd=phase>=3?4.35:5.55;const p=predictedPlayer(38+phase*12),horizontal=(e.forgePressAxis=(e.forgePressAxis||0)+1)%2===0,spacing=Math.max(68,98-phase*6);for(let i=-1;i<=1;i++){const x=p.x+(horizontal?i*spacing*1.12:0),y=p.y+(horizontal?0:i*spacing*1.12),center=i===0;addCircle(x,y,50+phase*4,d*(center?1.04:.64),center?'#ff7135':'#ffd26f',.72+Math.abs(i)*.09);}}
    if(e.pulseCd<=0){e.pulseCd=phase>=3?6.1:7.6;const aim=Math.atan2(player.y-e.y,player.x-e.x),count=7+phase;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.095;spawnEnemyProjectile(e.x,e.y,aim+off,185+phase*15,d*.60,i%2?'#fff1b0':'#ff9d42',5.5,4.2,'forge');}addCircle(player.x,player.y,54+phase*4,d*.78,'#ff8a42',.84);}
  }else{
    if(e.skillCd<=0){e.skillCd=phase>=3?1.9:2.55;constellationNodeVolley(e,d,arena,phase);}
    if(e.burstCd<=0){e.burstCd=phase>=3?4.4:5.75;constellationCage(e,d,arena,phase,.94);teleportConstellation(e,1,.52);}
    if(e.pulseCd<=0){e.pulseCd=phase>=3?5.9:7.5;constellationSignature(e,d*.86,arena,phase);}
  }
}
