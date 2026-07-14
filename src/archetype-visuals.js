(function(){
  const backgroundBase=drawBackground;
  function drawVoidRealm(){
    const t=performance.now()/1000;
    const g=ctx.createRadialGradient(vw*.48,vh*.44,20,vw*.48,vh*.44,Math.max(vw,vh)*.78);
    g.addColorStop(0,'#1a0731');g.addColorStop(.28,'#0d061e');g.addColorStop(.67,'#03040d');g.addColorStop(1,'#000106');ctx.fillStyle=g;ctx.fillRect(-80,-80,vw+160,vh+160);
    const boss=state.entities.enemies.find(e=>!e.dead&&e.eventKind==='void');const form=boss?.voidForm||'maw';
    ctx.save();ctx.translate(vw*.73,vh*.30);ctx.rotate(t*.035);for(let ring=0;ring<6;ring++){ctx.strokeStyle=`rgba(${form==='oracle'?'205,151,255':'133,70,215'},${.23-ring*.025})`;ctx.lineWidth=1.2+ring*.25;ctx.setLineDash([18+ring*5,9+ring*3]);ctx.beginPath();ctx.ellipse(0,0,120+ring*47,32+ring*13,ring*.26+t*(ring%2?.025:-.018),0,TAU);ctx.stroke();}ctx.restore();
    ctx.setLineDash([]);
    for(let i=0;i<150;i++){const seed=i*91.731,x=((seed*37+player.x*.015*(i%3+1))%(vw+120))-60,y=((seed*17+player.y*.012*(i%4+1))%(vh+120))-60,tw=.25+.5*Math.sin(t*(.5+(i%5)*.1)+i);ctx.fillStyle=i%11===0?`rgba(190,120,255,${.35+tw*.35})`:`rgba(116,100,190,${.14+tw*.20})`;ctx.beginPath();ctx.arc(x,y,i%11===0?1.7:1,0,TAU);ctx.fill();}
    ctx.save();ctx.translate(vw*.18,vh*.72);ctx.rotate(-t*.05);ctx.strokeStyle='rgba(119,63,199,.25)';ctx.lineWidth=3;for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(0,0);let x=0,y=0;for(let j=0;j<5;j++){x+=45+Math.sin(i+j)*20;y+=(i-3.5)*8+Math.cos(j*2+i)*22;ctx.lineTo(x,y);}ctx.stroke();ctx.rotate(TAU/8);}ctx.restore();
    const fog=ctx.createLinearGradient(0,0,0,vh);fog.addColorStop(0,'rgba(90,35,150,.10)');fog.addColorStop(.5,'rgba(0,0,0,0)');fog.addColorStop(1,'rgba(55,17,95,.18)');ctx.fillStyle=fog;ctx.fillRect(0,0,vw,vh);
  }
  drawBackground=function dimensionalBackground(){if(state.mapEventActive?.type==='void')drawVoidRealm();else backgroundBase();};

  function drawVariantOverlay(e,p,t){
    if(e.eventKind==='void')window.ensureVoidBossForm?.(e);
    const form=e.eventKind==='void'?e.voidForm:(e.type==='boss'?e.bossForm:e.miniForm);if(!form)return;
    ctx.save();ctx.translate(p.x,p.y);ctx.shadowBlur=18;ctx.shadowColor=e.color;ctx.strokeStyle=e.color;ctx.fillStyle=e.color;ctx.lineWidth=2;
    if(form==='pulsar'){for(let i=0;i<3;i++){ctx.globalAlpha=.55-i*.12;ctx.beginPath();ctx.arc(0,0,e.r*(1.1+i*.24)+Math.sin(t*3+i)*5,0,TAU);ctx.stroke();}for(let i=0;i<4;i++){const a=t*.55+i*TAU/4;ctx.beginPath();ctx.arc(Math.cos(a)*e.r*1.3,Math.sin(a)*e.r*1.3,3,0,TAU);ctx.fill();}}
    else if(form==='leviathan'){ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x));for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(-e.r*.4,side*e.r*.28);ctx.quadraticCurveTo(e.r*.6,side*e.r*1.05,e.r*1.55,side*e.r*.45);ctx.lineTo(e.r*.75,side*e.r*.12);ctx.stroke();}}
    else if(form==='archivist'||form==='oracle'){for(let i=0;i<6;i++){const a=(i/6)*TAU+(i%2?1:-1)*t*.22,rr=e.r*(1.15+(i%2)*.35);ctx.save();ctx.translate(Math.cos(a)*rr,Math.sin(a)*rr);ctx.rotate(-a);ctx.strokeRect(-5,-7,10,14);ctx.restore();}}
    else if(form==='warden'){ctx.rotate(t*.32);for(let i=0;i<8;i++){ctx.rotate(TAU/8);ctx.beginPath();ctx.moveTo(e.r*.65,-3);ctx.lineTo(e.r*1.28,0);ctx.lineTo(e.r*.65,3);ctx.stroke();}}
    else if(form==='executioner'){ctx.rotate(Math.atan2(player.y-e.y,player.x-e.x));ctx.beginPath();ctx.moveTo(-e.r*.9,-e.r*.75);ctx.lineTo(e.r*1.35,0);ctx.lineTo(-e.r*.9,e.r*.75);ctx.stroke();}
    else if(form==='colossus'){for(let i=0;i<6;i++){const a=i/6*TAU;ctx.save();ctx.rotate(a);ctx.strokeRect(e.r*.62,-6,e.r*.72,12);ctx.restore();}}
    else if(form==='weaver'){for(let i=0;i<8;i++){const a=i/8*TAU-t*.18;ctx.beginPath();ctx.moveTo(Math.cos(a)*e.r*.7,Math.sin(a)*e.r*.7);ctx.bezierCurveTo(Math.cos(a+.5)*e.r*1.2,Math.sin(a+.5)*e.r*1.2,Math.cos(a-.3)*e.r*1.5,Math.sin(a-.3)*e.r*1.5,Math.cos(a+.2)*e.r*1.8,Math.sin(a+.2)*e.r*1.8);ctx.stroke();}}
    ctx.restore();
  }

  const enemiesDrawBase=drawEnemies;
  drawEnemies=function uprightEnemyBars(){
    const fillRect=ctx.fillRect;
    ctx.fillRect=function(x,y,w,h){if(h===4&&y<0&&w>12)return;return fillRect.call(ctx,x,y,w,h);};
    try{enemiesDrawBase();}finally{ctx.fillRect=fillRect;}
    const t=performance.now()/1000;
    for(const e of state.entities.enemies){
      if(e.dead)continue;const p=worldToScreen(e.x,e.y);if(p.x<-140||p.x>vw+140||p.y<-140||p.y>vh+140)continue;
      drawVariantOverlay(e,p,t);
      if(e.type==='boss'||e.type==='mini'||e.hp<e.maxHp){const width=clamp(e.r*2.15,28,e.type==='boss'?132:92),y=p.y-e.r*1.28-17;ctx.save();ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(p.x-width/2,y,width,5);ctx.fillStyle=e.color;ctx.shadowBlur=7;ctx.shadowColor=e.color;ctx.fillRect(p.x-width/2,y,width*clamp(e.hp/e.maxHp,0,1),5);ctx.restore();}
    }
  };

  const playerDrawBase=drawPlayer;
  drawPlayer=function staticPlayerCore(){
    playerDrawBase();
    const x=vw/2,y=vh/2;ctx.save();ctx.translate(x,y);const mask=ctx.createRadialGradient(0,0,2,0,0,19);mask.addColorStop(0,'#ffffff');mask.addColorStop(.27,'#c5f5ff');mask.addColorStop(.62,'#758eff');mask.addColorStop(.86,'#29266d');mask.addColorStop(1,'rgba(5,8,25,.92)');ctx.fillStyle=mask;ctx.shadowBlur=23;ctx.shadowColor=player.hitPulse?COLORS.red:COLORS.cyan;ctx.beginPath();ctx.arc(0,0,18,0,TAU);ctx.fill();ctx.fillStyle='#eefcff';drawStarPath(6,7.2,14,-Math.PI/2);ctx.fill();ctx.fillStyle='#071027';drawStarPath(4,3,6,Math.PI/4);ctx.fill();ctx.restore();
  };
})();