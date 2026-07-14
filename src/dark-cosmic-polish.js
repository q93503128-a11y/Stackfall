(function(){
  const isCompact=()=>matchMedia('(pointer:coarse)').matches||innerWidth<760;

  // Louder output and a slower, darker ambient score.
  const previousEnsureOutput=audio.ensureOutput.bind(audio);
  audio.ensureOutput=function ensureHeavierOutput(){
    previousEnsureOutput();
    if(this.outputNode)this.outputNode.gain.value=1.62;
    const compressor=this.fxNodes?.[0];
    if(compressor?.threshold){compressor.threshold.value=-20;compressor.knee.value=22;compressor.ratio.value=4.5;compressor.attack.value=.004;compressor.release.value=.34;}
  };
  const previousPlayChannel=audio.playChannel.bind(audio);
  audio.playChannel=function playLouderChannel(channel,freq,duration,type,volume,slide,pan){
    return previousPlayChannel(channel,freq,duration,type,(Number(volume)||.025)*1.24,slide,pan);
  };
  audio.startAmbientSequence=function startDarkAmbientSequence(){
    if(this.ambientTimer||!this.ctx||!this.allowed('ambient'))return;
    const roots=[41.20,38.89,46.25,34.65,41.20,30.87,36.71,43.65];
    const pulse=()=>{
      if(!this.ctx||!this.allowed('ambient'))return;
      const step=this.ambientStep++,root=roots[step%roots.length],pan=Math.sin(step*.61)*.34;
      this.playChannel('ambient',root,2.65,'sine',.017,root*.035,pan);
      this.playChannel('ambient',root*1.5,1.95,'triangle',.008,-root*.08,-pan*.55);
      if(step%4===1)this.playChannel('ambient',root*2.25,1.25,'sine',.005,-root*.18,pan*.25);
      if(step%8===6)this.playChannel('ambient',root*.5,3.1,'sine',.020,4,0);
    };
    pulse();this.ambientTimer=setInterval(pulse,1780);
  };
  audio.syncAmbient=function syncDarkAmbient(){
    if(!this.ctx||!this.allowed('ambient')){this.stopAmbient();return;}
    this.ensureOutput();
    const target=.185*audioVolume('ambient');
    if(this.ambientMaster){this.ambientMaster.gain.setTargetAtTime(target,this.ctx.currentTime,.16);this.startAmbientSequence();return;}
    const t=this.ctx.currentTime,master=this.ctx.createGain(),lowpass=this.ctx.createBiquadFilter();
    master.gain.value=target;lowpass.type='lowpass';lowpass.frequency.value=980;lowpass.Q.value=.55;master.connect(lowpass).connect(this.outputNode);
    const freqs=[27.5,41.2,55,82.4];this.ambientNodes=[master,lowpass];
    for(let i=0;i<freqs.length;i++){
      const o=this.ctx.createOscillator(),g=this.ctx.createGain(),p=typeof this.ctx.createStereoPanner==='function'?this.ctx.createStereoPanner():null,lfo=this.ctx.createOscillator(),lfoGain=this.ctx.createGain();
      o.type=i<2?'sine':'triangle';o.frequency.value=freqs[i];o.detune.value=i%2?-7:5;g.gain.value=[.78,.29,.12,.035][i];
      lfo.type='sine';lfo.frequency.value=.013+i*.007;lfoGain.gain.value=3.5+i*1.2;lfo.connect(lfoGain).connect(o.detune);
      if(p){p.pan.value=(i-1.5)*.20;o.connect(g).connect(p).connect(master);this.ambientNodes.push(p);}else o.connect(g).connect(master);
      o.start(t);lfo.start(t);this.ambientNodes.push(o,g,lfo,lfoGain);
    }
    const length=Math.max(1,Math.floor(this.ctx.sampleRate*4)),buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate),data=buffer.getChannelData(0);
    let last=0;for(let i=0;i<length;i++){last=last*.993+(Math.random()*2-1)*.007;data[i]=last;}
    const noise=this.ctx.createBufferSource(),noiseFilter=this.ctx.createBiquadFilter(),noiseGain=this.ctx.createGain();
    noise.buffer=buffer;noise.loop=true;noiseFilter.type='bandpass';noiseFilter.frequency.value=285;noiseFilter.Q.value=.72;noiseGain.gain.value=.095;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);noise.start(t);this.ambientNodes.push(noise,noiseFilter,noiseGain);this.ambientMaster=master;this.startAmbientSequence();
  };
  audio.apexIntro=function apexIntro(form){
    const root=form==='starforge'?46:form==='chronophage'?39:43;
    this.playChannel('combat',root,1.35,'sawtooth',.082,16,0);
    setTimeout(()=>this.playChannel('combat',root*1.5,.92,'triangle',.055,-12,-.24),420);
    setTimeout(()=>this.playChannel('combat',root*3,.68,'sine',.030,-root,.24),920);
    setTimeout(()=>this.enemyImpact?.(1.65),1650);
  };

  // Mark copied wells so the visual language matches other Echo Beacon copies.
  const baseCreateGravityWells=createGravityWells;
  createGravityWells=function createVisibleEchoWells(stacks,echoed=false){
    const before=state.entities.wells.length,result=baseCreateGravityWells(stacks,echoed);
    for(let i=before;i<state.entities.wells.length;i++)state.entities.wells[i].echoed=!!echoed;
    if(state.entities.wells.length>12)state.entities.wells.splice(0,state.entities.wells.length-12);
    return result;
  };

  function accretionPoint(rx,ry,a){return{x:Math.cos(a)*rx,y:Math.sin(a)*ry};}
  function drawAccretionSegments(rx,ry,phase,front,echoed,alpha){
    const count=18;
    for(let i=0;i<count;i++){
      const a=phase+i*TAU/count,visible=front?Math.sin(a)>=0:Math.sin(a)<0;if(!visible)continue;
      const len=.09+(i%3)*.018,p1=accretionPoint(rx,ry,a-len),p2=accretionPoint(rx,ry,a+len);
      ctx.globalAlpha=alpha*(.28+(i%4)*.12);ctx.strokeStyle=echoed?(i%3===0?'#ffffff':i%2?'#ff5f86':'#ff9b5c'):(i%3===0?'#ffffff':i%2?'#ffb45e':'#6bbdff');
      ctx.lineWidth=1.2+(i%3)*.55;ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.quadraticCurveTo(Math.cos(a)*rx*1.04,Math.sin(a)*ry*1.04,p2.x,p2.y);ctx.stroke();
    }
  }
  drawGravityLens=function drawRotatingAccretionDisk(w,p,alpha,t){
    const echoed=!!w.echoed||w.color===COLORS.pink,visual=Math.min(132,55+w.r*.29),horizon=Math.min(25,11+w.r*.057),rx=visual*.72,ry=Math.max(9,visual*.155),tilt=-.17,phase=t*1.72+(w.x+w.y)*.0007;
    const hot=echoed?'#ff547d':'#ff9b4b',cold=echoed?'#ff9ec2':'#72c9ff';
    ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=alpha;
    const halo=ctx.createRadialGradient(0,0,horizon*.72,0,0,visual);halo.addColorStop(0,'rgba(0,0,0,.99)');halo.addColorStop(.18,echoed?'rgba(88,4,35,.42)':'rgba(31,20,56,.52)');halo.addColorStop(.48,echoed?'rgba(255,32,100,.12)':'rgba(80,82,170,.14)');halo.addColorStop(1,'rgba(30,50,110,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,visual,0,TAU);ctx.fill();
    ctx.save();ctx.rotate(tilt);ctx.shadowBlur=25;ctx.shadowColor=hot;ctx.globalAlpha=alpha*.36;ctx.strokeStyle=hot;ctx.lineWidth=Math.max(7,visual*.09);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,Math.PI,TAU);ctx.stroke();drawAccretionSegments(rx,ry,phase,false,echoed,alpha);ctx.restore();
    ctx.save();ctx.globalAlpha=alpha*.40;ctx.strokeStyle=cold;ctx.lineWidth=1.35;ctx.shadowBlur=13;ctx.shadowColor=cold;ctx.beginPath();ctx.arc(0,0,horizon*1.68,.18,Math.PI-.18);ctx.stroke();ctx.beginPath();ctx.arc(0,0,horizon*1.68,Math.PI+.18,TAU-.18);ctx.stroke();ctx.restore();
    ctx.save();ctx.shadowBlur=30;ctx.shadowColor='#eef7ff';ctx.strokeStyle='rgba(239,247,255,.84)';ctx.lineWidth=2.1;ctx.beginPath();ctx.arc(0,0,horizon*1.22,0,TAU);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,horizon,0,TAU);ctx.fill();ctx.restore();
    ctx.save();ctx.rotate(tilt);ctx.shadowBlur=27;ctx.shadowColor=hot;ctx.globalAlpha=alpha*.88;const disk=ctx.createLinearGradient(-rx,0,rx,0);disk.addColorStop(0,'rgba(80,145,255,.08)');disk.addColorStop(.22,cold);disk.addColorStop(.43,'#fff6d7');disk.addColorStop(.58,hot);disk.addColorStop(1,'rgba(255,70,34,0)');ctx.strokeStyle=disk;ctx.lineWidth=Math.max(7,visual*.095);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI);ctx.stroke();drawAccretionSegments(rx,ry,phase,true,echoed,alpha);ctx.restore();
    if(echoed){ctx.globalAlpha=alpha*.55;ctx.strokeStyle='#ff4f87';ctx.lineWidth=1.2;ctx.setLineDash([3,7]);ctx.lineDashOffset=-t*18;ctx.beginPath();ctx.arc(0,0,horizon*1.92,0,TAU);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
  };
  drawWells=function drawPolishedWells(){const t=performance.now()/1000;for(const w of state.entities.wells){if(!w||!Number.isFinite(w.x)||!Number.isFinite(w.y))continue;const p=worldToScreen(w.x,w.y),alpha=clamp(Math.min(w.life,.35)/.35,0,1);if(w.kind==='trait-singularity')drawTraitSingularity(w,p,alpha,t);else drawGravityLens(w,p,alpha,t);}};

  function drawVaultGate(p,t){
    ctx.save();ctx.translate(p.x,p.y);const pulse=.84+.16*Math.sin(t*2.4);ctx.shadowBlur=28;ctx.shadowColor='#75eaff';
    const aura=ctx.createRadialGradient(0,0,8,0,0,70);aura.addColorStop(0,'rgba(150,255,255,.30)');aura.addColorStop(.48,'rgba(55,177,255,.12)');aura.addColorStop(1,'rgba(25,100,255,0)');ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,70,0,TAU);ctx.fill();
    for(let ring=0;ring<2;ring++){ctx.save();ctx.rotate((ring?-.16:.11)*t);ctx.strokeStyle=ring?'rgba(126,184,255,.48)':'rgba(137,255,244,.76)';ctx.lineWidth=2-ring*.4;ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,r=44-ring*10,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2;ctx.fillStyle=i%2?'#8fefff':'#d7ffff';ctx.beginPath();ctx.arc(Math.cos(a)*(44-ring*10),Math.sin(a)*(44-ring*10),2.2,0,TAU);ctx.fill();}ctx.restore();}
    ctx.fillStyle='rgba(2,12,30,.94)';ctx.strokeStyle='#b7fbff';ctx.lineWidth=2.2;ctx.beginPath();ctx.roundRect(-19,-29,38,58,9);ctx.fill();ctx.stroke();ctx.fillStyle=`rgba(117,234,255,${.42+.25*pulse})`;ctx.fillRect(-4,-22,8,44);ctx.strokeStyle='rgba(255,255,255,.78)';ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(0,16);ctx.stroke();ctx.restore();
  }
  function drawCrashBeacon(p,t){
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.18);ctx.shadowBlur=24;ctx.shadowColor='#ff8657';
    const pulse=1+.05*Math.sin(t*5);ctx.scale(pulse,pulse);ctx.fillStyle='rgba(25,13,18,.94)';ctx.strokeStyle='#ff9c69';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(-43,8);ctx.lineTo(-18,-12);ctx.lineTo(12,-16);ctx.lineTo(42,-3);ctx.lineTo(20,8);ctx.lineTo(4,24);ctx.lineTo(-20,18);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffd19c';ctx.beginPath();ctx.moveTo(8,-10);ctx.lineTo(28,-2);ctx.lineTo(7,5);ctx.closePath();ctx.fill();ctx.fillStyle='#ff5d52';ctx.beginPath();ctx.moveTo(-34,5);ctx.lineTo(-56,0);ctx.lineTo(-40,12);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,198,130,.78)';ctx.setLineDash([6,6]);ctx.lineDashOffset=-t*18;ctx.beginPath();ctx.arc(0,1,55,0,TAU);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<5;i++){const a=t*1.8+i*1.7;ctx.fillStyle=i%2?'#ffcf87':'#ff6d63';ctx.fillRect(Math.cos(a)*47-1,Math.sin(a)*30-1,3,3);}ctx.restore();
  }
  function drawVoidGate(p,t){
    ctx.save();ctx.translate(p.x,p.y);ctx.shadowBlur=28;ctx.shadowColor='#b36bff';for(let ring=0;ring<3;ring++){ctx.save();ctx.rotate((ring%2?1:-1)*t*(.22+ring*.06));ctx.scale(1.35,.68);ctx.strokeStyle=`rgba(200,150,255,${.72-ring*.15})`;ctx.lineWidth=2.4-ring*.4;ctx.beginPath();ctx.ellipse(0,0,27+ring*10,27+ring*10,0,0,TAU);ctx.stroke();ctx.restore();}ctx.fillStyle='#030008';ctx.beginPath();ctx.ellipse(0,0,25,12,-.12,0,TAU);ctx.fill();ctx.restore();
  }
  function drawCrashArena(ev,t){
    const p=worldToScreen(ev.arena.x,ev.arena.y),r=ev.arena.r;ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle='rgba(255,119,82,.62)';ctx.shadowBlur=17;ctx.shadowColor='#ff754f';ctx.lineWidth=2.6;ctx.setLineDash([22,10]);ctx.lineDashOffset=-t*38;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<8;i++){const a=i/8*TAU;ctx.save();ctx.rotate(a);ctx.translate(r,0);ctx.fillStyle=i%2?'rgba(255,190,92,.86)':'rgba(255,87,74,.84)';ctx.beginPath();ctx.moveTo(-17,-5);ctx.lineTo(13,-5);ctx.lineTo(20,0);ctx.lineTo(13,5);ctx.lineTo(-17,5);ctx.closePath();ctx.fill();ctx.restore();}
    ctx.save();ctx.translate(0,-r+30);ctx.scale(.8,.8);drawCrashBeacon({x:0,y:0},t);ctx.restore();ctx.restore();
  }
  drawMapEvents=function drawPolishedMapEvents(){
    const t=performance.now()/1000,colors={vault:'#75eaff',crash:'#ff9a62',void:'#b36bff'};
    for(const marker of state.entities.mapEvents||[]){
      const p=worldToScreen(marker.x,marker.y),on=p.x>72&&p.x<vw-72&&p.y>72&&p.y<vh-72;
      if(on){if(marker.type==='vault')drawVaultGate(p,t);else if(marker.type==='crash')drawCrashBeacon(p,t);else drawVoidGate(p,t);}
      else{const cx=vw/2,cy=vh/2,dx=p.x-cx,dy=p.y-cy,a=Math.atan2(dy,dx),margin=46,scale=Math.min((vw/2-margin)/Math.max(1,Math.abs(dx)),(vh/2-margin)/Math.max(1,Math.abs(dy))),x=cx+dx*scale,y=cy+dy*scale;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=colors[marker.type]||'#fff';ctx.shadowBlur=18;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-10,-9);ctx.lineTo(-5,0);ctx.lineTo(-10,9);ctx.closePath();ctx.fill();ctx.restore();}
    }
    const ev=state.mapEventActive;if(ev?.type==='crash'&&ev.arena)drawCrashArena(ev,t);
  };

  function drawTankBody(e){
    if(e.eventKind==='crash'){
      ctx.save();ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x));ctx.fillStyle=e.hit?'#fff':'#2a1620';ctx.strokeStyle=e.hit?'#fff':'#ff9a62';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(e.r*1.18,0);ctx.lineTo(e.r*.45,-e.r*.72);ctx.lineTo(-e.r*.72,-e.r*.58);ctx.lineTo(-e.r*1.12,0);ctx.lineTo(-e.r*.72,e.r*.58);ctx.lineTo(e.r*.45,e.r*.72);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ffd08f';ctx.fillRect(e.r*.06,-e.r*.18,e.r*.55,e.r*.36);ctx.strokeStyle='#ff5f52';ctx.beginPath();ctx.moveTo(-e.r*.55,-e.r*.34);ctx.lineTo(-e.r*.92,-e.r*.7);ctx.moveTo(-e.r*.55,e.r*.34);ctx.lineTo(-e.r*.92,e.r*.7);ctx.stroke();ctx.restore();return;
    }
    ctx.save();ctx.rotate(e.phase*.035);const r=e.r;ctx.fillStyle=e.hit?'#fff':'rgba(34,18,17,.96)';ctx.strokeStyle=e.hit?'#fff':'#ff9f43';ctx.lineWidth=2.7;ctx.beginPath();for(let i=0;i<12;i++){const a=i/12*TAU,rr=r*(i%2?.82:1.08)*(1+Math.sin(i*3.7)*.05),x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();
    for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*TAU/3+e.phase*.012);ctx.fillStyle=i%2?'#a94d26':'#d86c2f';ctx.beginPath();ctx.moveTo(r*.22,-r*.18);ctx.lineTo(r*.92,-r*.42);ctx.lineTo(r*.72,r*.05);ctx.lineTo(r*.22,r*.18);ctx.closePath();ctx.fill();ctx.restore();}
    const core=ctx.createRadialGradient(-r*.12,-r*.18,1,0,0,r*.42);core.addColorStop(0,'#fff0be');core.addColorStop(.28,'#ffb84e');core.addColorStop(1,'#50160f');ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,r*.40,0,TAU);ctx.fill();ctx.fillStyle='#17080a';ctx.beginPath();ctx.moveTo(-r*.17,-r*.08);ctx.lineTo(r*.23,0);ctx.lineTo(-r*.17,r*.08);ctx.closePath();ctx.fill();ctx.restore();
  }
  drawEnemies=function drawEnemiesRefined(){
    for(const e of state.entities.enemies){
      const p=worldToScreen(e.x,e.y);if(p.x<-180||p.x>vw+180||p.y<-180||p.y>vh+180)continue;ctx.save();ctx.translate(p.x,p.y);const pulse=1+Math.sin(e.phase)*.05;ctx.scale(pulse,pulse);ctx.shadowBlur=e.kind==='apex'?58:e.type==='boss'?44:e.type==='mini'?30:13;ctx.shadowColor=e.color;ctx.strokeStyle=e.hit?'#fff':e.color;ctx.fillStyle=e.hit?'#fff':e.color;
      if(e.type==='boss'||e.type==='mini')drawEliteShape(e);
      else if(e.type==='fast'){ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x));const tail=ctx.createLinearGradient(-e.r*3,0,e.r,0);tail.addColorStop(0,'rgba(255,79,154,0)');tail.addColorStop(1,'rgba(255,79,154,.55)');ctx.fillStyle=tail;ctx.beginPath();ctx.moveTo(-e.r*3,-3);ctx.lineTo(e.r*.2,-5);ctx.lineTo(e.r*.2,5);ctx.lineTo(-e.r*3,3);ctx.fill();ctx.fillStyle=e.hit?'#fff':e.color;ctx.beginPath();ctx.moveTo(e.r*1.55,0);ctx.lineTo(-e.r*.75,e.r*.78);ctx.lineTo(-e.r*.22,0);ctx.lineTo(-e.r*.75,-e.r*.78);ctx.closePath();ctx.fill();}
      else if(e.type==='tank')drawTankBody(e);
      else{const orb=ctx.createRadialGradient(-e.r*.3,-e.r*.35,1,0,0,e.r);orb.addColorStop(0,'#c7c0ff');orb.addColorStop(.45,e.color);orb.addColorStop(1,'#2b216b');ctx.fillStyle=orb;ctx.beginPath();ctx.arc(0,0,e.r,0,TAU);ctx.fill();ctx.globalAlpha=.44;ctx.strokeStyle='#c4d2ff';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,e.r*1.38,e.r*.42,e.phase*.08,0,TAU);ctx.stroke();for(let i=0;i<3;i++){const a=e.phase*.4+i*TAU/3;ctx.fillStyle='#a6b8ff';ctx.beginPath();ctx.arc(Math.cos(a)*e.r*1.22,Math.sin(a)*e.r*.52,1.7,0,TAU);ctx.fill();}}
      ctx.globalAlpha=1;ctx.shadowBlur=0;if(!['boss','mini'].includes(e.type)){ctx.fillStyle='rgba(2,4,15,.72)';ctx.beginPath();ctx.arc(0,0,Math.max(3,e.r*.20),0,TAU);ctx.fill();}ctx.restore();
      if(e.type==='mini'||e.type==='boss'||e.hp<e.maxHp){const width=clamp(e.r*2.15,28,e.kind==='apex'?170:e.type==='boss'?132:92),y=p.y-e.r*1.28-17;ctx.save();ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(p.x-width/2,y,width,5);ctx.fillStyle=e.color;ctx.shadowBlur=7;ctx.shadowColor=e.color;ctx.fillRect(p.x-width/2,y,width*clamp(e.hp/e.maxHp,0,1),5);ctx.restore();}
    }
  };

  drawTraitSignatures=function drawRefinedTraitSignatures(x,y,t){
    const traits=state.bossTraits||{},augments=state.weaponAugments||{};ctx.save();ctx.translate(x,y);
    if(traits.stellar){ctx.save();ctx.translate(0,-43);const bob=Math.sin(t*.0031)*1.8;ctx.translate(0,bob);ctx.shadowBlur=22;ctx.shadowColor='#ffe184';ctx.strokeStyle='rgba(255,230,145,.75)';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,8,21,6,0,0,TAU);ctx.stroke();const grad=ctx.createLinearGradient(0,-22,0,10);grad.addColorStop(0,'#ffffff');grad.addColorStop(.35,'#ffe79a');grad.addColorStop(1,'#ff9e45');ctx.fillStyle=grad;for(let i=-2;i<=2;i++){const h=i===0?22:Math.abs(i)===1?16:11,px=i*8;ctx.beginPath();ctx.moveTo(px-4,8);ctx.lineTo(px,-h);ctx.lineTo(px+4,8);ctx.closePath();ctx.fill();}ctx.fillStyle='#fff7ce';ctx.rotate(Math.PI/4);ctx.fillRect(-3.5,-3.5,7,7);ctx.rotate(-Math.PI/4);for(let i=0;i<3;i++){const a=t*.0012+i*TAU/3;ctx.fillStyle='#fff2a6';ctx.beginPath();ctx.arc(Math.cos(a)*27,5+Math.sin(a)*8,1.6,0,TAU);ctx.fill();}ctx.restore();}
    if(traits.aegis){ctx.save();ctx.rotate(-t*.00022);ctx.strokeStyle='rgba(131,255,209,.58)';ctx.lineWidth=2;ctx.setLineDash([9,8]);ctx.beginPath();ctx.arc(0,0,47,0,TAU);ctx.stroke();ctx.restore();}
    if(traits.singularity){const a=t*.00047+1.2,px=Math.cos(a)*51,py=Math.sin(a)*23;ctx.save();ctx.translate(px,py);ctx.fillStyle='#f0a2ff';ctx.shadowBlur=16;ctx.shadowColor='#e65cff';drawStarPath(6,2.5,7,a);ctx.fill();ctx.restore();}
    if(traits.eclipse){ctx.save();ctx.rotate(t*.00013);ctx.strokeStyle='#ff76bd';ctx.lineWidth=4;ctx.shadowBlur=15;ctx.shadowColor='#ff76bd';ctx.beginPath();ctx.arc(0,0,55,-1.0,1.0);ctx.stroke();ctx.restore();}
    if(traits.chrono){ctx.save();ctx.rotate(t*.00036);ctx.strokeStyle='#8fffe0';ctx.lineWidth=1.4;for(let i=0;i<12;i++){const a=i/12*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*48,Math.sin(a)*48);ctx.lineTo(Math.cos(a)*55,Math.sin(a)*55);ctx.stroke();}ctx.restore();}
    if(traits.harvest){ctx.save();ctx.rotate(-t*.00029);for(let i=0;i<5;i++){const a=i/5*TAU;ctx.fillStyle=i%2?'#ff9a9a':'#ffd1c9';ctx.beginPath();ctx.ellipse(Math.cos(a)*59,Math.sin(a)*31,3,7,a,0,TAU);ctx.fill();}ctx.restore();}
    const keys=Object.keys(augments).filter(k=>augments[k]);if(keys.length){ctx.save();ctx.rotate(t*.00018);for(const [i,key]of keys.entries()){const a=i/keys.length*TAU,rr=66+(i%2)*7,color=WEAPONS[key]?.color||'#fff';ctx.fillStyle=color;ctx.shadowBlur=8;ctx.shadowColor=color;ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,2.2,0,TAU);ctx.fill();}ctx.restore();}ctx.restore();
  };

  const baseStartRealmTransition=startRealmTransition;
  startRealmTransition=function startTaggedRealmTransition(target,options={}){
    baseStartRealmTransition(target,options);if(state.realmTransition){state.realmTransition.apex=!!options.apex;state.realmTransition.form=options.form||null;state.realmTransition.subtitle=options.subtitle||state.realmTransition.subtitle;}
    if(options.apex)audio.apexIntro?.(options.form);
  };
  beginApexEncounter=function beginCinematicApexEncounter(){
    if(state.apexActiveId||state.pendingApexForm||state.realmTransition)return false;
    const form=bossBag('apex'),subtitles={chronophage:'TIME HAS BEGUN TO FEED',starforge:'A DEAD SUN IGNITES',lastconstellation:'THE SKY REMEMBERS ITS LAST NAME'};state.pendingApexForm=form;clearFieldForApex();const title=bossName(form);
    startRealmTransition(apexTheme(form),{duration:4.25,title,subtitle:subtitles[form],apex:true,form,onMidpoint:()=>{const e=spawnEnemy('apex');if(e){e.eliteForm=form;e.name=title;const s=BOSS_STATS[form];e.color=s.color;e.apexForm=form;state.apexActiveId=e.id;state.apexCount++;state.nextApexAt=(state.apexCount+1)*APEX_INTERVAL_SECONDS;state.camera.shake=16;state.flash=.28;}},onComplete:()=>{state.pendingApexForm=null;}});return true;
  };
  const baseDrawRealmCinematicOverlay=drawRealmCinematicOverlay;
  function drawApexSigil(form,x,y,t,p,color){
    ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.shadowBlur=30;ctx.shadowColor=color;
    if(form==='chronophage'){for(let ring=0;ring<4;ring++){ctx.save();ctx.rotate((ring%2?1:-1)*t*(.48+ring*.09));ctx.lineWidth=2.4-ring*.35;ctx.setLineDash([12+ring*3,7]);ctx.beginPath();ctx.arc(0,0,58+ring*23,0,TAU);ctx.stroke();ctx.restore();}ctx.setLineDash([]);for(let i=0;i<12;i++){const a=i/12*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*45,Math.sin(a)*45);ctx.lineTo(Math.cos(a)*78,Math.sin(a)*78);ctx.stroke();}}
    else if(form==='starforge'){const g=ctx.createRadialGradient(0,0,5,0,0,108);g.addColorStop(0,'#fff');g.addColorStop(.20,'#ffd36f');g.addColorStop(.57,'rgba(255,102,35,.72)');g.addColorStop(1,'rgba(255,45,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,108*(.92+.08*Math.sin(t*4)),0,TAU);ctx.fill();ctx.fillStyle='#020107';ctx.beginPath();ctx.arc(0,0,35,0,TAU);ctx.fill();for(let i=0;i<20;i++){ctx.save();ctx.rotate(i/20*TAU+t*.08);ctx.globalAlpha=.24+(i%4)*.12;ctx.fillStyle=color;ctx.fillRect(55,-1.5,105+Math.sin(t*3+i)*18,3);ctx.restore();}}
    else{const pts=[];for(let i=0;i<9;i++){const a=i/9*TAU-t*.08,rr=i%3===0?112:i%2?78:92;pts.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr});}ctx.lineWidth=1.7;ctx.beginPath();for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+3)%pts.length];ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}ctx.stroke();for(const pt of pts){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(pt.x,pt.y,3.8,0,TAU);ctx.fill();}}
    ctx.restore();
  }
  drawRealmCinematicOverlay=function drawDistinctApexOverlay(){
    const tr=state.realmTransition;if(!tr?.apex)return baseDrawRealmCinematicOverlay();
    const p=clamp(tr.elapsed/tr.duration,0,1),fade=Math.sin(Math.PI*p),reveal=clamp((p-.22)/.45,0,1),color=transitionColor(tr.to),x=vw/2,y=vh*.42,t=tr.elapsed;
    ctx.save();ctx.fillStyle=`rgba(0,0,7,${.38+.38*fade})`;ctx.fillRect(0,0,vw,vh);ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,0,vw,Math.max(22,vh*.09));ctx.fillRect(0,vh-Math.max(22,vh*.09),vw,Math.max(22,vh*.09));
    ctx.translate(x,y);ctx.globalAlpha=fade*.42;ctx.strokeStyle=color;ctx.lineWidth=1.2;for(let i=0;i<48;i++){const a=i/48*TAU+Math.sin(i*9.17)*.05,r1=220*(1-reveal)+35,r2=Math.max(vw,vh)*(.48+.32*reveal);ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke();}ctx.restore();
    ctx.save();ctx.globalAlpha=fade*reveal;drawApexSigil(tr.form,x,y,t,p,color);ctx.restore();
    if(p>.45){const q=clamp((p-.45)/.23,0,1);ctx.save();ctx.globalAlpha=fade*q;ctx.textAlign='center';ctx.shadowBlur=36;ctx.shadowColor=color;ctx.fillStyle='#fff';ctx.font=`900 ${Math.min(58,vw*.058)}px Black Han Sans, sans-serif`;ctx.fillText(tr.title,vw/2,vh*.65);ctx.shadowBlur=0;ctx.fillStyle=color;ctx.font='900 11px IBM Plex Sans KR, sans-serif';ctx.letterSpacing='0.18em';ctx.fillText('— APEX ENTITY DESCENT —',vw/2,vh*.65+30);ctx.fillStyle='rgba(220,230,255,.76)';ctx.font='700 10px IBM Plex Sans KR, sans-serif';ctx.fillText(tr.subtitle,vw/2,vh*.65+50);ctx.restore();}
  };

  if(audio.ctx)audio.syncAmbient();
})();
