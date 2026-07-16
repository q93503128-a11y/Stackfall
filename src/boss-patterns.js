function rawLine(x1,y1,x2,y2,width,damage,color,life=.9,impactStyle=null){if(state.entities.telegraphs.length>=entityCap('telegraphs'))state.entities.telegraphs.shift();state.entities.telegraphs.push({type:'line',x:x1,y:y1,a:Math.atan2(y2-y1,x2-x1),length:Math.hypot(x2-x1,y2-y1),width,life,max:life,damage,color,impactStyle});}
function predictedPlayer(distance=130){let x=0,y=0;if(state.input.keys.has('KeyA')||state.input.keys.has('ArrowLeft'))x--;if(state.input.keys.has('KeyD')||state.input.keys.has('ArrowRight'))x++;if(state.input.keys.has('KeyW')||state.input.keys.has('ArrowUp'))y--;if(state.input.keys.has('KeyS')||state.input.keys.has('ArrowDown'))y++;x+=state.input.touchX||0;y+=state.input.touchY||0;const d=Math.hypot(x,y)||1;return{x:player.x+x/d*distance,y:player.y+y/d*distance};}
function nearbyTwin(e){return e.twinGroup?state.entities.enemies.find(other=>other!==e&&!other.dead&&other.twinGroup===e.twinGroup):null;}
function placeMines(e,count,color,damage){const base=Math.atan2(player.y-e.y,player.x-e.x);for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*.25,dist=90+i*48;spawnEnemyProjectile(e.x+Math.cos(a)*dist,e.y+Math.sin(a)*dist,0,0,damage,color,7,4.2);}}
function webAroundPlayer(count,radius,damage,color){const pts=[];for(let i=0;i<count;i++){const a=i/count*TAU+.25,rr=radius*(i%2?1:.72);pts.push({x:player.x+Math.cos(a)*rr,y:player.y+Math.sin(a)*rr});}for(let i=0;i<count;i++)rawLine(pts[i].x,pts[i].y,pts[(i+2)%count].x,pts[(i+2)%count].y,18,damage,color,1.15);}

function miniSkill(e,dt){e.skillCd-=dt;e.burstCd-=dt;const d=Math.max(4,e.damage*.5),f=e.eliteForm;
  if(f==='warden'){
    if(e.skillCd<=0){e.skillCd=3.8;fireRing(e,10,122,d*.86,'#72e9ff',e.phase*.09);e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.025);shockwave(e.x,e.y,'#a8f5ff',92,.38,3);}
    if(e.burstCd<=0){e.burstCd=7.1;for(let i=0;i<4;i++){const a=i/4*TAU+e.phase*.08;addCircle(player.x+Math.cos(a)*95,player.y+Math.sin(a)*95,56,d*.95,'#72e9ff',1.15);}}
  }else if(f==='executioner'){
    if(e.skillCd<=0){e.skillCd=2.55;fireFan(e,3,.15,245,d,'#ff7db6');}
    if(e.burstCd<=0){e.burstCd=6.2;const a=Math.atan2(player.y-e.y,player.x-e.x);e.dash=.55;e.dashX=Math.cos(a)*440;e.dashY=Math.sin(a)*440;addLine(e,a,380,32,d*1.18,'#ff9bc9',.65);}
  }else if(f==='colossus'){
    if(e.skillCd<=0){e.skillCd=4.4;addCircle(e.x,e.y,145,d*1.22,'#ffb75e',1.3);fireRing(e,8,92,d*.8,'#ffd07b',e.phase*.04,7);}
    if(e.burstCd<=0){e.burstCd=7.8;for(let i=0;i<3;i++)addCircle(player.x+rand(-105,105),player.y+rand(-105,105),72,d,'#ffd07b',1.4);}
  }else if(f==='harvester'){
    if(e.skillCd<=0){e.skillCd=3.2;for(let i=-2;i<=2;i++){const a=Math.atan2(player.y-e.y,player.x-e.x)+i*.22;addLine(e,a,330,17,d*.82,'#ff9c7d',.78);}}
    if(e.burstCd<=0){e.burstCd=6.6;const prey=state.entities.enemies.find(m=>m!==e&&!m.dead&&m.type!=='mini'&&m.type!=='boss'&&Math.hypot(m.x-e.x,m.y-e.y)<300);if(prey){prey.dead=true;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.07);shockwave(prey.x,prey.y,'#ff9c7d',90,.36,3);}else fireFan(e,5,.18,185,d,'#ffb08f');}
  }else if(f==='mirror'){
    const side=e.twinSide||1;if(e.skillCd<=0){e.skillCd=2.8;for(let i=0;i<5;i++)spawnEnemyProjectile(e.x,e.y,Math.atan2(player.y-e.y,player.x-e.x)+side*(i-2)*.16,190+i*12,d,side>0?'#e0d7ff':'#9d82ff',5,6);}
    if(e.burstCd<=0){e.burstCd=6.4;const twin=nearbyTwin(e);if(twin){const x=e.x,y=e.y;e.x=twin.x;e.y=twin.y;twin.x=x;twin.y=y;shockwave(e.x,e.y,e.color,78,.32,2.5);shockwave(twin.x,twin.y,twin.color,78,.32,2.5);}else{const a=Math.random()*TAU;e.x=player.x+Math.cos(a)*380;e.y=player.y+Math.sin(a)*380;}}
  }else{
    if(e.skillCd<=0){e.skillCd=3.25;fireRing(e,7,145,d,'#c79cff',e.phase*.15);}
    if(e.burstCd<=0){e.burstCd=6.6;const a=Math.atan2(player.y-e.y,player.x-e.x);e.dash=.58;e.dashX=Math.cos(a)*380;e.dashY=Math.sin(a)*380;addLine(e,a,300,27,d*.85,'#e7c4ff',.62);}
  }
}

function normalBossSkill(e,dt){const k=skillScale(e);e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;const d=Math.max(5,e.damage*.48),f=e.eliteForm;
  if(f==='eclipse'){
    if(e.skillCd<=0){e.skillCd=3.0;for(let i=0;i<4;i++)addLine(e,e.phase*.12+i*TAU/4,500,24,d,'#ff72cb',.9);}
    if(e.burstCd<=0){e.burstCd=6.0;const p=predictedPlayer(90);addCircle(p.x,p.y,112,d*1.35,'#9b3c8b',1.45);addCircle(player.x,player.y,56,d*.72,'#ff72cb',.82);}
    if(e.pulseCd<=0){e.pulseCd=9.0;fireRing(e,16,138,d*.82,'#9e52c9',-e.phase*.18);}
  }else if(f==='seraph'){
    if(e.skillCd<=0){e.skillCd=2.5;fireFan(e,7,.135,220,d,'#9fffea');}
    if(e.burstCd<=0){e.burstCd=6.2;e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.045);shockwave(e.x,e.y,'#c9fff4',155,.55,5);for(let i=0;i<6;i++)spawnEnemyProjectile(e.x,e.y,i/6*TAU,115,d*.72,'#b8fff0',6,8);}
    if(e.pulseCd<=0){e.pulseCd=9.2;summonMinions(e,2,'fast');}
  }else if(f==='pulsar'){
    if(e.skillCd<=0){e.skillCd=3.35;for(let ring=0;ring<3;ring++)addCircle(player.x,player.y,70+ring*70,d*(.68+ring*.18),'#69bfff',.72+ring*.35);}
    if(e.burstCd<=0){e.burstCd=6.4;fireRing(e,14,118,d*.82,'#5ea8ff',e.phase*.24);fireRing(e,14,190,d*.66,'#b5e8ff',-e.phase*.18);}
    if(e.pulseCd<=0){e.pulseCd=9.0;const p=predictedPlayer(160);addCircle(p.x,p.y,95,d*1.45,'#d1efff',1.22);}
  }else if(f==='leviathan'){
    if(e.skillCd<=0){e.skillCd=3.6;const a=Math.atan2(player.y-e.y,player.x-e.x);e.dash=.82;e.dashX=Math.cos(a)*360;e.dashY=Math.sin(a)*360;addLine(e,a,540,50,d*1.42,'#ffc18f',.85);for(let i=1;i<=5;i++){const x=e.x+Math.cos(a)*i*72,y=e.y+Math.sin(a)*i*72;state.entities.telegraphs.push({type:'circle',x,y,r:34,life:1.2+i*.08,max:1.2+i*.08,damage:d*.72,color:'#ff895f'});}}
    if(e.burstCd<=0){e.burstCd=6.8;placeMines(e,6,'#ff895f',d*.72);}
    if(e.pulseCd<=0){e.pulseCd=9.4;fireFan(e,3,.20,150,d*1.16,'#ffad73',8);}
  }else if(f==='archivist'){
    if(e.skillCd<=0){e.skillCd=2.9;const p=predictedPlayer(120);rawLine(p.x-260,p.y,p.x+260,p.y,20,d,'#d7b0ff',1.0);rawLine(p.x,p.y-260,p.x,p.y+260,20,d,'#d7b0ff',1.0);}
    if(e.burstCd<=0){e.burstCd=6.5;const old={x:e.x,y:e.y},a=Math.random()*TAU;e.x=player.x+Math.cos(a)*430;e.y=player.y+Math.sin(a)*430;shockwave(old.x,old.y,'#805bbd',72,.3,2);shockwave(e.x,e.y,'#d7b0ff',92,.4,3);}
    if(e.pulseCd<=0){e.pulseCd=9.1;for(let i=0;i<6;i++){const a=i/6*TAU+e.phase*.1;addCircle(player.x+Math.cos(a)*130,player.y+Math.sin(a)*130,55,d*.95,'#c89cff',1.15);}}
  }else if(f==='heliarch'){
    if(e.skillCd<=0){e.skillCd=3.1;for(let i=0;i<8;i++)addLine(e,e.phase*.08+i*TAU/8,560,18,d*.92,'#ffe89b',.95);}
    if(e.burstCd<=0){e.burstCd=6.0;for(let i=0;i<6;i++){const p=predictedPlayer(40+i*28);addCircle(p.x+rand(-130,130),p.y+rand(-130,130),58,d*1.08,'#ffbf5c',1.05+i*.08);}}
    if(e.pulseCd<=0){e.pulseCd=9.0;fireRing(e,20,158,d*.78,'#ffd66f',e.phase*.22);}
  }else if(f==='tempest'){
    if(e.skillCd<=0){e.skillCd=2.35;const old={x:e.x,y:e.y},a=Math.random()*TAU;e.x=player.x+Math.cos(a)*rand(300,430);e.y=player.y+Math.sin(a)*rand(300,430);rawLine(old.x,old.y,e.x,e.y,16,d*.78,'#76d9ff',.55);fireFan(e,5,.11,265,d,'#a9eaff');}
    if(e.burstCd<=0){e.burstCd=5.5;const pts=[predictedPlayer(0),predictedPlayer(105),predictedPlayer(205)];for(const p of pts)addCircle(p.x+rand(-45,45),p.y+rand(-45,45),54,d*1.08,'#76d9ff',.86);}
    if(e.pulseCd<=0){e.pulseCd=8.1;fireRing(e,18,210,d*.62,'#d5f5ff',-e.phase*.3,4.5);}
  }else if(f==='nullengine'){
    if(e.skillCd<=0){e.skillCd=3.4;let converted=0;for(const p of state.entities.projectiles){if(converted>=10)break;if(Math.hypot(p.x-e.x,p.y-e.y)<290){p.life=0;const a=Math.atan2(player.y-e.y,player.x-e.x)+rand(-.35,.35);spawnEnemyProjectile(e.x,e.y,a,190,d*.72,'#a9b4d8',5.5,6);converted++;}}shockwave(e.x,e.y,'#a9b4d8',290,.52,4);}
    if(e.burstCd<=0){
      e.burstCd=6.2;
      const spacing=96,span=390,lineWidth=14,warning=1.22;
      for(let i=-2;i<=2;i++){
        rawLine(player.x-span,player.y+i*spacing,player.x+span,player.y+i*spacing,lineWidth,d*.82,'#eaf1ff',warning,'null-grid');
        rawLine(player.x+i*spacing,player.y-span,player.x+i*spacing,player.y+span,lineWidth,d*.82,'#8799c9',warning,'null-grid');
      }
      shockwave(player.x,player.y,'#b9c9ef',235,.48,2.5);state.flash=Math.max(state.flash,.08);
    }
    if(e.pulseCd<=0){e.pulseCd=9.0;fireRing(e,12,105,d*.82,'#6d789d',e.phase*.12,7);}
  }else{
    if(e.skillCd<=0){e.skillCd=2.9;fireFan(e,5,.12,210,d,'#ff72cb');}
    if(e.burstCd<=0){e.burstCd=5.6;fireRing(e,14,150,d*.92,'#c78cff',e.phase*.2);}
    if(e.pulseCd<=0){e.pulseCd=8.2;addCircle(player.x+rand(-45,45),player.y+rand(-45,45),105,d*1.55,'#ff72cb',1.15);}
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

function fireRingWithGaps(e,count,speed,damage,color,offset=0,gapAngle=0,gapWidth=.24,r=5.4){for(let i=0;i<count;i++){const a=i/count*TAU+offset,d=Math.abs(Math.atan2(Math.sin(a-gapAngle),Math.cos(a-gapAngle)));if(d<gapWidth||Math.abs(d-Math.PI)<gapWidth*.72)continue;spawnEnemyProjectile(e.x,e.y,a,speed,damage,color,r,7);}}
function apexArenaPoints(count,radius,phase=0){const arena=state.apexArena||{x:player.x,y:player.y,r:radius};return Array.from({length:count},(_,i)=>{const a=i/count*TAU+phase;return{x:arena.x+Math.cos(a)*Math.min(radius,arena.r*.78),y:arena.y+Math.sin(a)*Math.min(radius,arena.r*.78)};});}
function teleportConstellation(e,step=0){const arena=state.apexArena;if(!arena)return;const a=(e.phase*.19+step*2.399)%(TAU),oldX=e.x,oldY=e.y;e.x=arena.x+Math.cos(a)*arena.r*.48;e.y=arena.y+Math.sin(a)*arena.r*.36;state.entities.beams.push({x1:oldX,y1:oldY,x2:e.x,y2:e.y,life:.32,max:.32,color:'#dce6ff',width:2.2});shockwave(oldX,oldY,'#7f91ca',72,.28,2);shockwave(e.x,e.y,'#e7edff',92,.38,3);}
function apexBossSkill(e,dt){
  e.apexElapsed=(e.apexElapsed||0)+dt;const escalation=clamp((e.apexElapsed-150)/90,0,1),terminal=e.apexElapsed>=240,healthEnraged=e.hp/e.maxHp<.55,enraged=healthEnraged||e.apexElapsed>=180,k=terminal?.34:enraged?lerp(.62,.44,escalation):1;e.apexPhase=terminal?4:enraged?2:1;e.timeLock=0;e.skillCd-=dt/k;e.burstCd-=dt/k;e.pulseCd-=dt/k;const d=Math.max(7,e.damage*.44),f=e.eliteForm,arena=state.apexArena||{x:player.x,y:player.y,r:460};e.apexFrenzyCd=(e.apexFrenzyCd??1.2)-dt;if(terminal&&e.apexFrenzyCd<=0){e.apexFrenzyCd=.82;if(f==='chronophage'){const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,18,235,d*.68,'#d9fff8',e.phase*.27,aim,.28,4.4);}else if(f==='starforge'){for(let i=0;i<4;i++){const a=i*TAU/4+e.phase*.09;addCircle(player.x+Math.cos(a)*105,player.y+Math.sin(a)*105,42,d*.72,'#ff8a42',.66+i*.045);}}else{for(let i=0;i<10;i++){const a=i*TAU/10+e.phase*.31;spawnEnemyProjectile(e.x,e.y,a,170+(i%2)*55,d*.62,i%2?'#ffffff':'#9fb2ef',4.2,6);}}}
  if(f==='chronophage'){
    if(e.skillCd<=0){e.skillCd=enraged?1.85:2.55;const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,enraged?30:24,enraged?190:160,d,'#79ffe1',e.phase*.16,aim,.22,5.3);fireRingWithGaps(e,enraged?24:18,enraged?145:125,d*.78,'#c6fff4',-e.phase*.12,aim+Math.PI/2,.28,4.5);}
    if(e.burstCd<=0){e.burstCd=enraged?4.5:5.8;const hands=enraged?8:6,base=e.phase*.06;for(let i=0;i<hands;i++)addLine(e,base+i*TAU/hands,arena.r*1.16,enraged?32:25,d*1.22,i%2?'#79ffe1':'#d9fff8',.72+i*.075);}
    if(e.pulseCd<=0){e.pulseCd=enraged?6.6:8.2;const a=Math.atan2(player.y-arena.y,player.x-arena.x),nx=-Math.sin(a),ny=Math.cos(a);for(const side of[-1,1])for(const band of[82,166])rawLine(arena.x+nx*band*side-Math.cos(a)*arena.r,arena.y+ny*band*side-Math.sin(a)*arena.r,arena.x+nx*band*side+Math.cos(a)*arena.r,arena.y+ny*band*side+Math.sin(a)*arena.r,enraged?25:19,d*1.05,'#8fffe0',1.05+band*.001);scheduleWeaponAction(520,()=>{if(e.dead)return;fireRingWithGaps(e,enraged?26:20,215,d*.72,'#e4fffb',-e.phase*.19,a,.32,4.4);});}
  }else if(f==='starforge'){
    if(e.skillCd<=0){e.skillCd=enraged?2.0:2.75;const spokes=enraged?12:9,base=e.phase*.055;for(let i=0;i<spokes;i++)addLine(e,base+i*TAU/spokes,arena.r*1.22,enraged?31:24,d*1.12,i%3===0?'#fff1b0':'#ff9d42',.92+i*.025);}
    if(e.burstCd<=0){e.burstCd=enraged?4.35:5.6;const aim=Math.atan2(player.y-e.y,player.x-e.x);fireRingWithGaps(e,enraged?34:28,enraged?210:180,d,'#ffd26f',e.phase*.21,aim,.30,6.2);for(let i=0;i<(enraged?7:5);i++){const a=i/(enraged?7:5)*TAU+e.phase*.08,x=arena.x+Math.cos(a)*arena.r*.63,y=arena.y+Math.sin(a)*arena.r*.63;addCircle(x,y,enraged?76:66,d*1.28,'#ff7135',1.0+i*.065);}}
    if(e.pulseCd<=0){e.pulseCd=enraged?6.1:7.8;const points=apexArenaPoints(enraged?8:6,arena.r*.73,e.phase*.045);for(let i=0;i<points.length;i++){const p=points[i],op=points[(i+Math.floor(points.length/2))%points.length];rawLine(p.x,p.y,op.x,op.y,enraged?29:22,d*1.38,i%2?'#ffb04e':'#fff0a8',1.18+i*.04);}shockwave(e.x,e.y,'#ffb04e',arena.r*.42,.65,7);}
  }else{
    if(e.skillCd<=0){e.skillCd=enraged?1.75:2.45;const arms=enraged?7:5;for(let arm=0;arm<arms;arm++)for(let i=0;i<4;i++){const a=arm*TAU/arms+e.phase*.17+i*.115;spawnEnemyProjectile(e.x,e.y,a,120+i*46+(enraged?22:0),d*.80,i%2?'#f0f4ff':'#9fb2ef',4.6+i*.35,7);}}
    if(e.burstCd<=0){e.burstCd=enraged?4.4:5.9;const pts=apexArenaPoints(enraged?8:7,arena.r*.48,-Math.PI/2+e.phase*.025),jump=enraged?3:2;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+jump)%pts.length];rawLine(a.x,a.y,b.x,b.y,enraged?23:18,d*1.22,i%2?'#d8e2ff':'#8fa6e8',.96+i*.045);}teleportConstellation(e,1);}
    if(e.pulseCd<=0){e.pulseCd=enraged?6.2:8.0;teleportConstellation(e,2);const half=enraged?185:155,gap=enraged?70:82,x=player.x,y=player.y;rawLine(x-half,y-half,x-gap,y-half,20,d*1.28,'#d8e2ff',1.02);rawLine(x+gap,y-half,x+half,y-half,20,d*1.28,'#d8e2ff',1.02);rawLine(x-half,y+half,x-gap,y+half,20,d*1.28,'#879be0',1.02);rawLine(x+gap,y+half,x+half,y+half,20,d*1.28,'#879be0',1.02);rawLine(x-half,y-half,x-half,y+half,20,d*1.28,'#aebfff',1.12);rawLine(x+half,y-half,x+half,y+half,20,d*1.28,'#aebfff',1.12);}
  }
}
