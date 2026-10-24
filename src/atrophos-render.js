// Cached, code-native planes match Stackfall's restrained cosmic geometry.
// No raster copy of the Penpot study and no per-frame gradients/Path2D creation.
const ATROPHOS_PLANES=[
  ['upper','#18243c',[[290,125],[460,77],[672,157],[812,305],[681,426],[463,329]]],
  ['upper','#293b59',[[75,206],[183,102],[431,81],[563,193],[422,278],[221,244]]],
  ['upper','#3a4e6d',[[76,206],[206,139],[420,112],[562,193],[444,215],[270,174]]],
  ['upper','#1c2c46',[[220,244],[418,278],[562,193],[451,309],[363,341]]],
  ['upper','#32435f',[[678,157],[797,178],[862,260],[812,305],[757,225]]],
  ['upper','#23334e',[[460,175],[640,173],[754,270],[681,426],[614,289]]],
  ['head','#2b3c57',[[580,71],[605,11],[653,42],[675,20],[709,85],[694,159],[652,194],[603,146]]],
  ['head','#41516b',[[580,71],[605,11],[625,65],[603,146]]],
  ['head','#090f20',[[625,65],[659,57],[687,99],[674,157],[652,175],[624,124]]],
  ['left','#223450',[[220,220],[354,233],[268,330],[48,403],[-70,427],[55,309]]],
  ['left','#354a68',[[220,220],[55,309],[-70,427],[101,332],[300,269]]],
  ['left','#15253e',[[101,332],[268,330],[48,403],[-70,427]]],
  ['right','#21324e',[[797,178],[883,232],[1050,483],[918,437],[814,302]]],
  ['right','#344864',[[883,232],[1050,483],[941,352],[841,236]]],
  ['waist','#16233b',[[470,361],[621,337],[790,387],[894,552],[714,504],[571,449]]],
  ['waist','#2b3c56',[[470,361],[621,337],[790,387],[687,395],[571,403]]],
  ['waist','#1f304a',[[571,403],[687,395],[894,552],[714,504]]]
].map(([part,color,points])=>{const path=new Path2D();points.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));path.closePath();return{part,color,path};});
function atrophosEntity(){for(const e of state.entities.enemies)if(!e.dead&&isAtrophos(e))return e;return null;}
function atrophosPresentation(){return isAtrophos(atrophosEntity())||state.realmTransition?.form==='chronophage';}
function atrophosSmooth(q){q=clamp(q,0,1);return q*q*(3-2*q);}
function paintAtrophosDepth(g,w=vw,h=vh){g.fillStyle='#050815';g.fillRect(0,0,w,h);const v=g.createRadialGradient(w*.54,h*.45,0,w*.54,h*.45,Math.max(w,h)*.7);v.addColorStop(0,'#101a34');v.addColorStop(1,'#030610');g.fillStyle=v;g.fillRect(0,0,w,h);}
function drawAtrophosBackdrop(){
  const e=atrophosEntity(),tr=state.realmTransition,exit=tr?.form==='chronophage'&&tr.owner==='apex-exit',intro=tr?.form==='chronophage'&&!exit,a=e?.atrophos||(exit?tr.atrophos:null),p=tr?clamp(tr.elapsed/tr.duration,0,1):1;
  drawCachedBackdrop('atrophos-depth',paintAtrophosDepth);
  let upper=1,lower=1,arms=1,shift=0,arm=0,waist=0;
  if(intro){lower=atrophosSmooth((p-.14)/.2);upper=atrophosSmooth((p-.35)/.22);arms=upper;shift=p<.62?(1-atrophosSmooth((p-.45)/.17))*35:atrophosSmooth((p-.73)/.2)*25;}
  if(exit){lower=1-atrophosSmooth((p-.18)/.28);upper=1-atrophosSmooth((p-.37)/.31);arms=1-atrophosSmooth((p-.61)/.29);shift=p*92;}
  if(!intro&&!exit&&!a){drawStars(CHRONO_STAR_PALETTE,.45);return;}
  if(a&&!exit){const age=a.clock-a.upperStart;arm=age<.28?lerp(0,-.38,atrophosSmooth(age/.28)):age<.65?lerp(-.38,.32,atrophosSmooth((age-.28)/.37)):age<.96?.32:lerp(.32,0,atrophosSmooth((age-.96)/.6));const lag=a.clock-a.waistStart;waist=(1-atrophosSmooth((lag-.5)/1.5))*(a.waistMode==='record'?.25:1);shift=18+Math.sin(a.clock*.45)*5;}
  const mobile=vw<600,sx=vw/1000*(mobile?1.55:1.23),sy=vh/600*(mobile?.62:.93),ox=vw*(mobile?-.35:-.15),oy=vh*(mobile?.16:.095);
  ctx.save();ctx.translate(ox-player.x*.008,oy-player.y*.006);ctx.scale(sx,sy);
  for(const plane of ATROPHOS_PLANES){ctx.save();const part=plane.part;
    ctx.globalAlpha=.78*(part==='waist'?lower:part==='left'||part==='right'?arms:upper);
    if(part==='waist'){ctx.translate(shift+waist*45,18+waist*12);}
    else{ctx.translate(-shift*.35,0);if(part==='left'){ctx.translate(250,230);ctx.rotate(arm);ctx.translate(-250,-230);}if(part==='right'){ctx.translate(810,240);ctx.rotate(-arm*.35);ctx.translate(-810,-240);}}
    ctx.fillStyle=plane.color;ctx.fill(plane.path);ctx.restore();
  }
  if(a&&atrophosPending(a)){ctx.strokeStyle='rgba(206,156,102,.58)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(567,337);ctx.lineTo(631,350);ctx.lineTo(685,370);ctx.stroke();}
  if(intro&&p<.3){ctx.strokeStyle='rgba(132,150,187,.22)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(330,280);ctx.lineTo(390,272);ctx.moveTo(370,300);ctx.lineTo(430,292);ctx.stroke();}
  ctx.restore();
  // The existing star field passes IN FRONT of the body, establishing depth.
  drawStars(CHRONO_STAR_PALETTE,.62);
}
function drawAtrophosWrist(e){
  // Called at the entity's existing translated coordinate. Every visible face
  // uses the exact points of the union collider; the inner face receives aim.
  ctx.save();ctx.shadowBlur=0;ctx.lineJoin='round';ctx.lineWidth=1.8;
  for(let side=0;side<3;side++){const shape=e.stageBodyShapes?.[side];if(!shape)continue;ctx.beginPath();shape.points.forEach((p,i)=>i?ctx.lineTo(p.x-e.x,p.y-e.y):ctx.moveTo(p.x-e.x,p.y-e.y));ctx.closePath();ctx.fillStyle=e.hit?'#dfeaf4':side===2?'#7788a4':side?'#34435f':'#273650';ctx.fill();ctx.strokeStyle=side===2?'#d8dfea':'#788ca9';ctx.stroke();}
  ctx.strokeStyle=e.hit?'#fff':'#d3dce8';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-8,-22);ctx.lineTo(-12,-5);ctx.lineTo(-8,24);ctx.moveTo(8,-22);ctx.lineTo(12,-5);ctx.lineTo(8,24);ctx.stroke();
  // A short projected forearm recedes from the wrist; no target reticle/orb.
  ctx.globalAlpha=.17;ctx.fillStyle='#7282a4';ctx.beginPath();ctx.moveTo(-30,-29);ctx.lineTo(-48,-93);ctx.lineTo(-24,-105);ctx.lineTo(22,-29);ctx.closePath();ctx.fill();ctx.restore();
}
function drawAtrophosThreats(e){
  const a=e.atrophos;if(!a)return;
  for(const t of a.threats){const p=worldToScreen(t.x,t.y),active=t.age>=t.warning&&t.age<t.warning+t.active,spent=t.age>=t.warning+t.active,q=clamp(t.age/t.warning,0,1),fade=spent?1-clamp((t.age-t.warning-t.active)/t.recovery,0,1):1;
    ctx.save();ctx.translate(p.x,p.y);ctx.shadowBlur=0;ctx.lineJoin='round';ctx.lineCap='round';ctx.globalAlpha=fade;
    // Dark backing preserves shape boundaries under six-slot friendly VFX.
    ctx.strokeStyle='#02050e';ctx.lineWidth=active?7:5;
    if(t.kind==='cut'){ctx.rotate(t.angle);const half=t.length*.5,edge=t.width*.5;
      ctx.beginPath();ctx.moveTo(-half,0);ctx.lineTo(-half*.5,-edge);ctx.lineTo(half*.5,-edge);ctx.lineTo(half,0);ctx.lineTo(half*.5,edge);ctx.lineTo(-half*.5,edge);ctx.closePath();ctx.fillStyle=active?'#02040b':'rgba(2,4,11,.34)';ctx.fill();ctx.stroke();
      ctx.strokeStyle=spent?'#53617e':active?'#ffe1a3':q>.72?'#edbb7a':'#a67a57';ctx.lineWidth=active?2.6:1.7;ctx.stroke();
      if(!spent){ctx.beginPath();ctx.moveTo(-half*.38,-edge-4*(1-q));ctx.lineTo(-half*.34,-edge);ctx.moveTo(half*.34,edge);ctx.lineTo(half*.38,edge+4*(1-q));ctx.stroke();}
    }else{
      ctx.beginPath();t.points.forEach((v,i)=>i?ctx.lineTo(v.x-t.x,v.y-t.y):ctx.moveTo(v.x-t.x,v.y-t.y));ctx.closePath();ctx.fillStyle=active?'rgba(2,4,11,.85)':'rgba(2,4,11,.18)';ctx.fill();ctx.stroke();ctx.strokeStyle=spent?'#53617e':active?'#ffe1a3':q>.72?'#edbb7a':'#a67a57';ctx.lineWidth=active?2.8:1.8;ctx.stroke();
      if(!spent){const r=t.r*(1.22-.2*q);ctx.lineWidth=2;for(let i=0;i<4;i++){const ang=i/4*TAU+t.angle,c=Math.cos(ang),s=Math.sin(ang);ctx.beginPath();ctx.moveTo(c*r-s*7,s*r+c*7);ctx.lineTo(c*(r-9),s*(r-9));ctx.lineTo(c*r+s*7,s*r-c*7);ctx.stroke();}}
    }ctx.restore();
  }
}
function drawAtrophosCombatOverlay(){
  const e=atrophosEntity(),tr=state.realmTransition;if(e?.atrophos){drawAtrophosThreats(e);const p=worldToScreen(e.x,e.y);ctx.save();ctx.translate(p.x,p.y);drawAtrophosWrist(e);ctx.restore();}
  else if(tr?.form==='chronophage'&&tr.owner==='apex-exit'&&tr.atrophos){const a=tr.atrophos,p=worldToScreen(tr.atrophosX,tr.atrophosY),q=clamp(tr.elapsed/tr.duration,0,1);ctx.save();ctx.globalAlpha=1-atrophosSmooth(q/.24);ctx.translate(p.x,p.y);ctx.strokeStyle='#a2b0cc';ctx.lineWidth=2;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(side*(9+q*30),-22);ctx.lineTo(side*(30+q*48),0);ctx.lineTo(side*(9+q*30),25);ctx.stroke();}ctx.restore();if(q<.78){ctx.save();ctx.globalAlpha=(1-q/.78)*.35;ctx.strokeStyle='#596781';for(const t of a.threats){const s=worldToScreen(t.x,t.y);ctx.beginPath();ctx.moveTo(s.x-28,s.y-4);ctx.lineTo(s.x+28,s.y+4);ctx.stroke();}ctx.restore();}}
  drawPlayer();
}
function drawAtrophosCinematic(){/* The body itself is the entrance/defeat; no sigil, radial rays or title flash. */}
