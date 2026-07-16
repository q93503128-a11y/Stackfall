(function(){
  const isCompact=()=>matchMedia('(pointer:coarse)').matches||innerWidth<760;

  function drawVaultGate(p,t){
    ctx.save();ctx.translate(p.x,p.y);const pulse=.88+.12*Math.sin(t*1.7);ctx.shadowBlur=18;ctx.shadowColor='#75eaff';
    const aura=ctx.createRadialGradient(0,0,12,0,0,84);aura.addColorStop(0,'rgba(117,234,255,.20)');aura.addColorStop(.58,'rgba(43,119,180,.08)');aura.addColorStop(1,'rgba(20,62,120,0)');ctx.fillStyle=aura;ctx.fillRect(-88,-88,176,176);
    ctx.save();ctx.rotate(t*.045);ctx.strokeStyle='rgba(137,255,244,.34)';ctx.lineWidth=1.3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(0,0,65,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    ctx.fillStyle='rgba(3,15,31,.96)';ctx.strokeStyle='#75eaff';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-42,-50);ctx.lineTo(42,-50);ctx.lineTo(52,-38);ctx.lineTo(52,44);ctx.lineTo(38,56);ctx.lineTo(-38,56);ctx.lineTo(-52,44);ctx.lineTo(-52,-38);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(10,39,62,.96)';for(const side of[-1,1]){ctx.fillRect(side*31-8,-36,16,76);ctx.strokeStyle='rgba(190,251,255,.62)';for(let row=0;row<4;row++){ctx.strokeRect(side*31-6,-31+row*18,12,11);}}
    ctx.fillStyle='rgba(1,8,20,.98)';ctx.strokeStyle='#c5fbff';ctx.lineWidth=1.8;ctx.beginPath();ctx.roundRect(-20,-35,40,74,5);ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(117,234,255,'+(.55+.28*pulse)+')';ctx.lineWidth=2;for(let row=0;row<3;row++){ctx.beginPath();ctx.moveTo(-12,-21+row*20);ctx.lineTo(12,-21+row*20);ctx.stroke();}
    ctx.fillStyle='#eaffff';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(8,0);ctx.lineTo(0,8);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();
    for(let i=0;i<6;i++){const a=i*TAU/6-t*.11,rr=69+(i%2)*5;ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(-a);ctx.fillStyle=i%2?'#86dfff':'#d7ffff';ctx.fillRect(-4,-2,8,4);ctx.restore();}ctx.restore();
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
      else{const cx=vw/2,cy=vh/2,dx=p.x-cx,dy=p.y-cy,a=Math.atan2(dy,dx),margin=58,scale=Math.min((vw/2-margin)/Math.max(1,Math.abs(dx)),(vh/2-margin)/Math.max(1,Math.abs(dy))),x=cx+dx*scale,y=cy+dy*scale,color=colors[marker.type]||'#fff',short=marker.type==='void'?'VOID':marker.type==='crash'?'SHIP':'VAULT';ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=color;ctx.shadowBlur=24;ctx.shadowColor=color;ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(-12,-11);ctx.lineTo(-5,0);ctx.lineTo(-12,11);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-4,-4);ctx.lineTo(-1,0);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();ctx.save();ctx.font='900 8px IBM Plex Sans KR,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';const w=46,lx=clamp(x-w/2,5,vw-w-5),ly=clamp(y+15,5,vh-23);ctx.fillStyle='rgba(2,7,18,.86)';ctx.fillRect(lx,ly,w,18);ctx.fillStyle=color;ctx.fillText(short,lx+w/2,ly+9);ctx.restore();}
    }
    const ev=state.mapEventActive;if(ev?.type==='crash'&&ev.arena)drawCrashArena(ev,t);
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
    const apex=options.apex??String(target||'').startsWith('apex-'),tagged={...options,apex,owner:options.owner||(apex?'apex':null)};
    const serial=baseStartRealmTransition(target,tagged);if(apex)audio.apexIntro?.(tagged.form);return serial;
  };
  const baseDrawRealmCinematicOverlay=drawRealmCinematicOverlay;
  function drawApexSigil(form,x,y,t,p,color){
    ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.shadowBlur=30;ctx.shadowColor=color;
    if(form==='chronophage'){for(let ring=0;ring<4;ring++){ctx.save();ctx.rotate((ring%2?1:-1)*t*(.48+ring*.09));ctx.lineWidth=2.4-ring*.35;ctx.setLineDash([12+ring*3,7]);ctx.beginPath();ctx.arc(0,0,58+ring*23,0,TAU);ctx.stroke();ctx.restore();}ctx.setLineDash([]);for(let i=0;i<12;i++){const a=i/12*TAU;ctx.beginPath();ctx.moveTo(Math.cos(a)*45,Math.sin(a)*45);ctx.lineTo(Math.cos(a)*78,Math.sin(a)*78);ctx.stroke();}}
    else if(form==='starforge'){const g=ctx.createRadialGradient(0,0,5,0,0,108);g.addColorStop(0,'#fff');g.addColorStop(.20,'#ffd36f');g.addColorStop(.57,'rgba(255,102,35,.72)');g.addColorStop(1,'rgba(255,45,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,108*(.92+.08*Math.sin(t*4)),0,TAU);ctx.fill();ctx.fillStyle='#020107';ctx.beginPath();ctx.arc(0,0,35,0,TAU);ctx.fill();for(let i=0;i<20;i++){ctx.save();ctx.rotate(i/20*TAU+t*.08);ctx.globalAlpha=.24+(i%4)*.12;ctx.fillStyle=color;ctx.fillRect(55,-1.5,105+Math.sin(t*3+i)*18,3);ctx.restore();}}
    else{const pts=[];for(let i=0;i<9;i++){const a=i/9*TAU-t*.08,rr=i%3===0?112:i%2?78:92;pts.push({x:Math.cos(a)*rr,y:Math.sin(a)*rr});}ctx.lineWidth=1.7;ctx.beginPath();for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+3) % pts.length];ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}ctx.stroke();for(const pt of pts){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(pt.x,pt.y,3.8,0,TAU);ctx.fill();}}
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
