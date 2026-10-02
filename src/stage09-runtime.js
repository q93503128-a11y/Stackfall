(()=>{
  if(typeof window.stackfallRegisterStageRuntime!=='function')return;
  // The nursery is a twisted column, rather than a core with orbiting petals.
  function nurseryCyst(size=1){const pts=[];for(let i=0;i<24;i++){const a=i/24*TAU,y=Math.sin(a)*45,x=Math.cos(a)*(23+6*Math.sin(a));pts.push([size*(x+Math.sin(y*.055)*6),size*y]);}return pts;}
  const CYST=nurseryCyst(),GERM=[[-27,108],[-58,46],[-46,-28],[-18,-104],[7,-142],[19,-69],[54,-23],[44,46],[18,103]];
  function nurseryRoll(e,time=state.time){if(!e.roll)return 0;const t=clamp((time-e.roll.start-e.roll.warn)/e.roll.travel,0,1);return e.roll.sign*Math.sin(t*Math.PI)*1.05;}
  function nurseryShapes(e,time=state.time){
    const open=e.stagePhase>=2?clamp((time-(e.phaseAt??time))/1.35,0,1):0,compress=1-.10*Math.sin(time*1.1),body={...e,bodyAngle:(e.bodyAngle||0)+nurseryRoll(e,time)},parts=[];
    for(const side of[-1,1]){const outer=[],inner=[];for(let i=0;i<=20;i++){const u=i/20,y=(-156+u*310)*compress,center=Math.sin(u*TAU*1.15)*32,width=15+Math.pow(Math.sin(u*Math.PI),.72)*(side<0?76:65);outer.push([center+side*(width+open*34),y]);inner.push([center+side*(11+open*35),y+side*8]);}parts.push(StageCraft.polygon(body,[...outer,...inner.reverse()],side<0?0:1));}
    for(let i=0;i<3;i++){const y=-102+i*98,x=Math.sin((i+.2)*2.3)*26;parts.push(StageCraft.polygon(body,nurseryCyst(i===1?.68:.50).map(([rx,ry])=>[rx+x,ry+y*compress]),i+2));}
    if(open>0)parts.push(StageCraft.polygon(body,[[-12,-128],[12,-76],[-4,-19],[21,44],[5,120],[-14,55],[-24,-7],[-8,-72]],5));
    return e.stageBodyShapes=parts;
  }
  function nurseryPaint(shape,e,dry=false){const g=ctx.createLinearGradient(-80,-150,95,160);g.addColorStop(0,dry?'#7a7156':'#bab78c');g.addColorStop(.24,'#355051');g.addColorStop(.50,shape.part===5?'#100d22':'#5d5072');g.addColorStop(.76,dry?'#433e43':'#819977');g.addColorStop(1,'#182934');StageCraft.paint(shape,e,shape.part===5?'#716480':'#bfc6a6',g);ctx.save();ctx.beginPath();shape.points.forEach((p,i)=>i?ctx.lineTo(p.x-e.x,p.y-e.y):ctx.moveTo(p.x-e.x,p.y-e.y));ctx.closePath();ctx.clip();ctx.strokeStyle='#d2c59f';ctx.globalAlpha=.35;ctx.lineWidth=4;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-110,-166+i*67);ctx.bezierCurveTo(-52,-105+i*67,57,-189+i*67,104,-122+i*67);ctx.stroke();}ctx.restore();}
  function nurseryBody(e){for(const s of nurseryShapes(e))nurseryPaint(s,e);}
  function nurseryEnvironment(run){const env=StageCraft.env(run);env.culture=clamp((state.time-60)/150,0,1);env.germination=clamp((state.time-225)/145,0,1);env.darkJoin=clamp((state.time-410)/110,0,1);env.quiet=state.time>=510&&!run.bossSpawned;return env;}
  function nurserySky(){drawCachedBackdrop('seedbed-depth',g=>{const shade=g.createLinearGradient(0,0,vw,vh);shade.addColorStop(0,'#081925');shade.addColorStop(.45,'#182a31');shade.addColorStop(.8,'#2d263a');shade.addColorStop(1,'#151821');g.fillStyle=shade;g.fillRect(0,0,vw,vh);});drawStars(['#9dbaa4','#9885a8'],.12);}
  function nurseryWorld(){
    const env=state.stageRun?.productionEnvironment||{},f=.81,cx=Math.floor(player.x*f/2100),cy=Math.floor(player.y*f/2050);
    for(let iy=cy-1;iy<=cy+1;iy++)for(let ix=cx-1;ix<=cx+1;ix++){
      const seed=Math.sin(ix*31.71+iy*73.3),wx=ix*2100+Math.sin(ix*19.3+iy*29.7)*580,wy=iy*2050+Math.cos(ix*13.7+iy*43.3)*540,p=StageCraft.worldPoint(wx,wy,f);
      if(p.x<-1100||p.x>vw+1100||p.y<-1300||p.y>vh+1300)continue;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(seed*.55);ctx.scale(4.8+Math.abs(seed)*1.3,4.2);ctx.globalAlpha=.22;
      const reef=[],back=[];for(let i=0;i<=28;i++){const u=i/28,y=-150+u*300,center=Math.sin(u*Math.PI*1.4)*31,w=9+Math.pow(Math.sin(u*Math.PI),.64)*(71+11*Math.sin(u*TAU*3+seed));reef.push([center-w,y]);back.push([center+w,y]);}nurseryPaint(StageCraft.polygon({x:0,y:0},[...reef,...back.reverse()],0),{x:0,y:0},env.cleared);for(let stratum=0;stratum<3;stratum++){ctx.save();ctx.translate(-22+stratum*25,-57+stratum*72);ctx.rotate((stratum-1)*.35+seed*.17);ctx.scale(1.18,.85);nurseryPaint(StageCraft.polygon({x:0,y:0},CYST,2),{x:0,y:0},env.cleared);ctx.restore();}
      ctx.globalAlpha=.25+(env.culture||0)*.12;
      for(let i=0;i<5;i++){ctx.save();ctx.translate(-65+Math.sin(i*2.6+seed)*60,-110+i*52);ctx.rotate(seed+i*.7);ctx.scale(.50,.64+(env.germination||0)*.4);nurseryPaint(StageCraft.polygon({x:0,y:0},CYST,2),{x:0,y:0});ctx.restore();}
      // A small opaque seam is only a precursor; the first full void event stays in S10.
      if((env.darkJoin||0)>0&&!env.cleared){ctx.globalAlpha=(env.darkJoin||0)*.50;ctx.fillStyle='#080a14';ctx.beginPath();ctx.moveTo(-7,-12);ctx.quadraticCurveTo(19,6,9,42);ctx.quadraticCurveTo(-8,19,-7,-12);ctx.fill();}
      ctx.restore();
    }
    const ax=Math.floor(player.x*.94/930),ay=Math.floor(player.y*.94/870);for(let y=ay-1;y<=ay+1;y++)for(let x=ax-1;x<=ax+1;x++){const p=StageCraft.worldPoint(x*930+Math.sin(x*43+y*71)*295,y*870+Math.cos(x*61+y*29)*280,.94);if(p.x<-190||p.x>vw+190||p.y<-190||p.y>vh+190)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(x*11+y*31)*.75);ctx.globalAlpha=.15+(env.germination||0)*.10;for(let seed=0;seed<3;seed++){ctx.save();ctx.translate(-48+seed*40,Math.sin(seed*2+x)*31);ctx.rotate(seed*.7);ctx.scale(1.18,1.35);nurseryPaint(StageCraft.polygon({x:0,y:0},CYST,2),{x:0,y:0},env.cleared);ctx.restore();}ctx.restore();}
    if(!state.stageRun?.bossSpawned&&(env.presence||0)>0){const p=StageCraft.worldPoint(-200,-190,.95);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=(env.presence||0)*.34;nurseryBody({x:0,y:0,stagePhase:1,bodyScale:compactDevice()?.60:1});ctx.restore();}
  }
  function nurserySeedPath(from,to,sign,t){return{x:lerp(from.x,to.x,t)+sign*Math.sin(t*TAU)*58,y:lerp(from.y,to.y,t)};}
  function nurserySeed(from,to,sign,warn,damage,ownerId=null){
    const o=StageCraft.hazard({kind:'crossing-culture-seed',ownerId,from,to,vertices:CYST,warn,travel:1.85,damage,color:'#d0caaa',fill:'#526356'});if(!o)return o;
    o.warning={kind:'polygon',points:StageCraft.hull(Array.from({length:17},(_,i)=>StageCraft.polygon(nurserySeedPath(from,to,sign,i/16),nurseryCyst(1.10)).points).flat())};
    o.update=function(){const t=clamp((this.age-this.warn)/this.travel,0,1),p=nurserySeedPath(from,to,sign,t);this.x=p.x;this.y=p.y;this.points=StageCraft.polygon(p,CYST).points;this.active=this.age>=this.warn&&t<1;};
    o.sweepShapes=dt=>[.75,.5,.25].map(k=>StageCraft.polygon(nurserySeedPath(from,to,sign,clamp((o.age-dt*k-o.warn)/o.travel,0,1)),CYST));
    const draw=o.draw;o.draw=function(){draw.call(this);if(!this.active)return;ctx.save();ctx.translate(vw/2-player.x,vh/2-player.y);nurseryPaint({...this,part:2},{x:0,y:0});ctx.restore();};return o;
  }
  function nurseryGerm(point,warn,damage,ownerId=null){return StageCraft.hazard({kind:'corkscrew-germination',ownerId,from:{x:point.x,y:point.y+220},to:{x:point.x,y:point.y-95},vertices:GERM,warn,travel:1.25,hold:.35,damage,color:'#d5c9a0',fill:'#465b53',curve:26,drawExtra:o=>{ctx.save();ctx.beginPath();o.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();ctx.strokeStyle='#baaeb0';ctx.lineWidth=13;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(o.x-75,o.y-107+i*48);ctx.bezierCurveTo(o.x-18,o.y-150+i*48,o.x+14,o.y-49+i*48,o.x+74,o.y-103+i*48);ctx.stroke();}ctx.restore();}});}
  function nurseryIncident(event,api){const d=13+api.progress*9;if(event.variant==='seed-orbit'){for(let i=0;i<4;i++){const sign=i%2?1:-1;nurserySeed({x:player.x+sign*140,y:player.y-245},{x:player.x-sign*80,y:player.y+245},sign,1.2+Math.floor(i/2)*.48,d);}}else for(let i=0;i<(event.variant==='bloom-vortex'?3:2);i++)nurseryGerm({x:player.x+(i-1)*145,y:player.y+15},1.2+i*.4,d);}
  function nurseryTurn(e){
    e.roll={start:state.time,warn:1.2,travel:1.8,sign:e.stagePhase===2?-1:1,x:e.x,y:e.y};e.contactSafeUntil=state.time+1.2;
    for(let part=0;part<2;part++){const o={kind:'polygon',attackKind:'nursery-body-turnover',ownerId:e.id,x:e.x,y:e.y,hw:1,hh:1,warn:1.2,travel:1.8,hold:.15,damage:e.damage*.45,points:[]};
      o.update=function(){this.x=e.x;this.y=e.y;this.points=nurseryShapes(e)[part].points;this.active=this.age>=this.warn&&this.age<this.warn+this.travel;};
      o.sweepShapes=dt=>[.75,.5,.25].map(k=>nurseryShapes({...e},state.time-dt*k)[part]);
      o.draw=function(){if(this.age>=this.warn)return;const roll=e.roll,span=compactDevice()?85:170,points=[];for(let i=0;i<=12;i++){const t=i/12,body={...e,x:roll.x+roll.sign*span*t,y:roll.y+45*Math.sin(t*Math.PI)};points.push(...nurseryShapes(body,roll.start+roll.warn+t*roll.travel)[part].points);}ctx.save();ctx.translate(vw/2-player.x,vh/2-player.y);ctx.setLineDash([9,7]);StageCraft.paint({kind:'polygon',points:StageCraft.hull(points)},{x:0,y:0},'#dec8aa','#595048',.22);ctx.restore();};o.update();addStagePhysicalObject(o);
    }
  }
  function nurseryCombat(e,dt,api){
    const phase=StageCraft.phase(e,[.50],api),now=state.time;let targetX,targetY,speed;
    if(e.roll){const t=clamp((now-e.roll.start-e.roll.warn)/e.roll.travel,0,1);targetX=e.roll.x+e.roll.sign*(compactDevice()?85:170)*t;targetY=e.roll.y+45*Math.sin(t*Math.PI);speed=180;if(now>e.roll.start+e.roll.warn+e.roll.travel)e.roll=null;}
    else{const step=Math.floor((now-api.run.stage.boss.spawnAt)/(phase===2?4.8:6.3)),anchors=[[-170,0],[75,48],[160,-24]],a=anchors[step%3];targetX=e.home.x+a[0]*(compactDevice()?.28:1);targetY=e.home.y+a[1];speed=48+72*Math.max(0,Math.sin(now*1.1));}
    StageCraft.move(e,targetX,targetY,dt,speed,2.7);e.bodyAngle=lerp(e.bodyAngle||0,Math.sin(now*.18)*.18,dt*2);nurseryShapes(e);
    e.attackCd-=dt;if(e.attackCd>0)return;e.attackCd=phase===2?4.4:5.2;e.actionToken++;const slot=(e.cycle=(e.cycle||0)+1)%3;e.stageAction=['culture-double-helix','axial-germination','pod-turnover'][slot];
    if(slot===0){for(let i=0;i<4;i++){const sign=(i%2?1:-1)*(phase===2?-1:1);nurserySeed({x:e.x+sign*65,y:e.y-80},{x:player.x-sign*90,y:player.y+220},sign,1.2+Math.floor(i/2)*.55,e.damage*.39,e.id);}}
    else if(slot===1){for(let i=0;i<2;i++)nurseryGerm({x:player.x+(i?105:-105),y:player.y+15},1.25+i*.5,e.damage*.42,e.id);}
    else nurseryTurn(e);audio.stageAttack?.(e.eventKind,e.stageAction);
  }
  function nurseryEntry(tr,p){const q=StageCraft.entryBody({},p),k=p*p*(3-2*p);ctx.save();ctx.translate(q.screen.x,q.screen.y+(1-k)*235);ctx.rotate((1-k)*.52);ctx.globalAlpha=.24+.76*k;nurseryBody({...q,x:0,y:0});ctx.restore();if(p<.85){ctx.save();ctx.translate(q.screen.x,q.screen.y+110);ctx.globalAlpha=(1-p)*.4;for(const side of[-1,1]){ctx.save();ctx.translate(side*p*210,0);ctx.rotate(side*p*.65);ctx.scale(1.8,1.1);nurseryPaint(StageCraft.polygon({x:0,y:0},GERM,side<0?0:1),{x:0,y:0},true);ctx.restore();}ctx.restore();}}
  function nurseryVictory(v){const t=v.elapsed,p=worldToScreen(v.x,v.y),body={...v.body,x:0,y:0,roll:null},parts=nurseryShapes(body);ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=1-clamp((t-3.3)/1.4,0,1);for(const s of parts){ctx.save();if(s.part<2){const side=s.part?1:-1;ctx.translate(side*t*28,t*t*10);ctx.rotate(side*t*.28);}else if(s.part<5)ctx.translate((s.part-3)*t*16,t*t*24);nurseryPaint(s,body,true);ctx.restore();}if(t>2.5){ctx.globalAlpha=Math.sin(clamp((t-2.5)/2.2,0,1)*Math.PI)*.6;ctx.fillStyle='#050811';ctx.beginPath();ctx.moveTo(-7,-9);ctx.quadraticCurveTo(21,10,9,53);ctx.lineTo(-7,24);ctx.closePath();ctx.fill();}ctx.restore();}
  window.stackfallRegisterStageRuntime('stage-09',{
    theme:'stage-09',objectiveKey:'stage09.objective.boss',fixedEventKey:'stage09.event.fixed',initialSpawnTimer:.44,spawnRadius:750,spawnRadiusMin:72,spawnRadiusMax:168,burstRadiusMin:670,burstRadiusMax:875,startingVariants:['abyss-spore','rootlance','abyss-spore'],
    variants:{
      'abyss-spore':{type:'ranged',color:'#aa72e8',hp:1.23,speed:1.10,damage:1.21,r:1.05,xp:1.39,name:'stage07.enemy.abyssSpore',rangedMin:.50,rangedMax:.86},
      rootlance:{type:'fast',color:'#ff7ca8',hp:1.18,speed:1.43,damage:1.22,r:1.00,xp:1.37,name:'stage08.enemy.rootlance'},
      'spiral-pod':{type:'ranged',color:'#d59cff',hp:1.26,speed:1.06,damage:1.22,r:1.07,xp:1.42,name:'stage09.enemy.spiralPod',rangedMin:.50,rangedMax:.84},
      'glass-wing':{type:'fast',color:'#c7f7ff',hp:1.12,speed:1.37,damage:1.17,r:.98,xp:1.28,name:'stage03.enemy.glassWing'},
      'conduit-leech':{type:'tank',color:'#6bc5b8',hp:1.66,speed:.99,damage:1.23,r:1.06,xp:1.46,name:'stage05.enemy.conduitLeech'}
    },
    poolAt(time){if(time<125)return[['abyss-spore',.54],['rootlance',.46]];if(time<310)return[['abyss-spore',.25],['rootlance',.30],['spiral-pod',.45]];if(time<440)return[['abyss-spore',.22],['rootlance',.25],['spiral-pod',.36],['glass-wing',.17]];return[['abyss-spore',.20],['rootlance',.24],['spiral-pod',.33],['glass-wing',.14],['conduit-leech',.09]];},
    spawnProfile(time){return{cap:time>=440?68:time>=300?60:50,rate:Math.max(.33,.89-time*.00092),count:time>=420?2:time>=200&&Math.random()<.64?2:1};},
    waveLabel(event){return event.variant==='spiral-pod'?tr('stage09.event.podBloom'):tr('stage09.event.rootCrossing');},
    hazard(event,api){nurseryIncident(event,api);},
    production:{desktopTop:190,actions:['culture-double-helix','axial-germination','pod-turnover'],mobileScale:.60,voice:{root:185,type:'triangle',duration:.47,sweep:-74,filter:2100,overtone:1.498},music:'nursery',explorationMusic:'seedbed',subtitle:'종피 안쪽에서 빛이 어긋난다 · SOMETHING GROWS BETWEEN THE SEAMS',entryDuration:4.0,victoryDuration:4.7,environment:nurseryEnvironment,initialize:(e,api)=>StageCraft.initialize(e,api),shapes:nurseryShapes,drawBody:nurseryBody,drawWorld:nurseryWorld,drawBase:nurserySky,drawEntry:nurseryEntry,drawVictory:nurseryVictory,combat:nurseryCombat,phase:e=>{e.roll=null;},defeat:e=>audio.stageAttack?.(e.eventKind,'defeat')},
    bossProfile:{form:'helix-nursery',eventVariant:'stage09-nursery',nameKey:'stage09.boss',warningKey:'stage09.boss.warning',r:83,hp:3.08,speed:.67,damage:1.37,color:'#d59cff',xp:3.1,skillCd:1.02,burstCd:3.00,pulseCd:4.75,spawnRadius:715,spawnShockwave:282},
    bossSkill:null
  });
})();
