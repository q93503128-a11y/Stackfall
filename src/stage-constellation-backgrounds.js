(()=>{
  const familyForOrder=order=>order<=6?1:order<=12?2:3;
  const orderFromTheme=theme=>{
    const match=String(theme||'').match(/^stage-(\d{2})$/);
    return match?Math.max(1,Math.min(18,Number(match[1])||1)):null;
  };
  const paletteForFamily=family=>{
    if(family===2)return{wash:'rgba(145,40,170,.225)',glow:'rgba(47,221,193,.105)',edge:'rgba(217,73,192,.085)',primary:'rgba(222,137,255,.36)',secondary:'rgba(105,239,211,.31)'};
    if(family===3)return{wash:'rgba(16,116,135,.205)',glow:'rgba(235,174,72,.090)',edge:'rgba(49,178,188,.080)',primary:'rgba(105,231,241,.34)',secondary:'rgba(236,190,101,.30)'};
    return{wash:'rgba(66,78,216,.235)',glow:'rgba(73,219,255,.105)',edge:'rgba(125,90,255,.095)',primary:'rgba(151,178,255,.37)',secondary:'rgba(98,230,255,.32)'};
  };

  function drawStableSpaceBase({landmarks=true}={}){
    const tier=typeof stackfallPerformanceTier==='function'?stackfallPerformanceTier():0;
    drawCachedBackdrop('space',surfaceCtx=>{const base=surfaceCtx.createLinearGradient(0,0,vw,vh);base.addColorStop(0,'#02040d');base.addColorStop(.45,'#080c20');base.addColorStop(1,'#01030a');surfaceCtx.fillStyle=base;surfaceCtx.fillRect(0,0,vw,vh);const ambient=surfaceCtx.createRadialGradient(vw*.5,vh*.47,0,vw*.5,vh*.47,Math.max(vw,vh)*.78);ambient.addColorStop(0,'rgba(45,60,145,.25)');ambient.addColorStop(.45,'rgba(19,25,68,.10)');ambient.addColorStop(1,'rgba(0,0,0,0)');surfaceCtx.fillStyle=ambient;surfaceCtx.fillRect(0,0,vw,vh);});
    const nebulaStride=tier===2?3:tier===1?2:1;
    for(let index=0;index<NEBULAE.length;index+=nebulaStride){const n=NEBULAE[index],px=wrap(n.x-player.x*.016,1900)-260,py=wrap(n.y-player.y*.012,1350)-210,sprite=spaceNebulaSprite(n.c);ctx.save();ctx.translate(px,py);ctx.rotate(n.rot);ctx.scale(1.55,.72);ctx.drawImage(sprite,-n.r,-n.r,n.r*2,n.r*2);ctx.restore();}
    if(tier<2){
      ctx.save();ctx.translate(vw*.83,vh*.18);ctx.rotate(-.22);const planetR=Math.min(vw,vh)*.11,planet=spacePlanetSprite();ctx.drawImage(planet,-planetR,-planetR,planetR*2,planetR*2);ctx.strokeStyle='rgba(130,160,255,.09)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,planetR*1.72,planetR*.29,0,0,TAU);ctx.stroke();ctx.restore();
      if(landmarks&&typeof drawSpaceLandmarks==='function')drawSpaceLandmarks();
    }
    drawStars(undefined,tier===2?.30:tier===1?.58:1);
  }

  // Endless keeps its normal landmark layer. Authored stages use the same deep-space
  // base but replace those screen/parallax landmarks with stage-owned world anchors.
  drawSpaceBackground=function drawStableSpaceBackground(){drawStableSpaceBase({landmarks:true});};

  function drawConstellationBackdrop(order){
    drawStableSpaceBase({landmarks:false});
    const family=familyForOrder(Math.max(1,Number(order)||1)),palette=paletteForFamily(family),size=Math.max(vw,vh);
    ctx.save();
    // Constellation identity must read at a glance, not only in isolated color sampling.
    // Keep the Endless renderer as the structural base, then apply a stronger family tint.
    const wash=ctx.createLinearGradient(0,0,vw,vh);wash.addColorStop(0,palette.wash);wash.addColorStop(.48,palette.edge);wash.addColorStop(.76,'rgba(0,0,0,0)');wash.addColorStop(1,palette.glow);ctx.fillStyle=wash;ctx.fillRect(0,0,vw,vh);
    ctx.globalCompositeOperation='screen';
    const ambient=ctx.createRadialGradient(vw*.46,vh*.44,0,vw*.46,vh*.44,size*.74);ambient.addColorStop(0,palette.glow);ambient.addColorStop(.46,palette.edge);ambient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ambient;ctx.fillRect(0,0,vw,vh);
    ctx.globalCompositeOperation='source-over';
    ctx.restore();
  }

  const fract=value=>value-Math.floor(value);
  const fieldHash=(x,y,salt=0)=>fract(Math.sin(x*127.1+y*311.7+salt*74.7)*43758.5453123);
  const fieldPoint=(wx,wy)=>typeof worldToScreen==='function'?worldToScreen(wx,wy):{x:vw*.5+wx-(player.x||0),y:vh*.5+wy-(player.y||0)};
  function forVisibleFieldCells(cellW,cellH,rangeX,rangeY,drawCell){
    const px=Number(player.x)||0,py=Number(player.y)||0,cx=Math.floor(px/cellW),cy=Math.floor(py/cellH),margin=220;
    for(let gy=-rangeY;gy<=rangeY;gy++)for(let gx=-rangeX;gx<=rangeX;gx++){
      const ix=cx+gx,iy=cy+gy,jx=(fieldHash(ix,iy,1)-.5)*cellW*.46,jy=(fieldHash(ix,iy,2)-.5)*cellH*.46;
      const wx=(ix+.5)*cellW+jx,wy=(iy+.5)*cellH+jy,p=fieldPoint(wx,wy);
      if(p.x<-margin||p.x>vw+margin||p.y<-margin||p.y>vh+margin)continue;
      drawCell({ix,iy,wx,wy,p,h0:fieldHash(ix,iy,3),h1:fieldHash(ix,iy,4),h2:fieldHash(ix,iy,5)});
    }
  }

  function drawConstellationField(theme){
    const order=orderFromTheme(theme);if(!order)return;
    const family=familyForOrder(order),palette=paletteForFamily(family),t=performance.now()/1000;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(family===1){
      ctx.lineWidth=1.35;
      forVisibleFieldCells(410,320,3,3,({p,h0,h1,h2})=>{
        const a=-.52+h0*1.04+t*.002*(h1>.5?1:-1),len=18+h1*28;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.globalAlpha=.20+h2*.11;ctx.strokeStyle=h0>.68?palette.secondary:palette.primary;ctx.beginPath();ctx.moveTo(-len*.72,-2);ctx.lineTo(-len*.12,-6);ctx.lineTo(len*.78,0);ctx.lineTo(-len*.08,6);ctx.closePath();ctx.stroke();ctx.restore();
        if(h2>.76){ctx.save();ctx.translate(p.x,p.y);ctx.rotate((h0-.5)*.7);ctx.globalAlpha=.10;ctx.strokeStyle=palette.secondary;ctx.setLineDash([18,15]);ctx.beginPath();ctx.ellipse(0,0,82+h1*70,30+h0*25,0,.18,Math.PI*1.72);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
      });
    }else if(family===2){
      forVisibleFieldCells(470,360,3,3,({p,h0,h1,h2})=>{
        const r=24+h0*34;ctx.globalAlpha=.10+h1*.08;ctx.strokeStyle=h0>.5?palette.primary:palette.secondary;ctx.lineWidth=1.35;ctx.beginPath();ctx.ellipse(p.x,p.y,r*1.7,r*.55,h2*TAU+t*.003*(h1>.5?1:-1),0,TAU);ctx.stroke();
        ctx.globalAlpha=.15;ctx.fillStyle=h0>.5?palette.secondary:palette.primary;ctx.beginPath();ctx.arc(p.x+(h1-.5)*r,p.y+(h2-.5)*r*.6,1.8+h0*2.2,0,TAU);ctx.fill();
        if(h2>.82){ctx.globalAlpha=.075;ctx.strokeStyle=palette.primary;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(p.x-180,p.y+45);ctx.bezierCurveTo(p.x-70,p.y-70,p.x+80,p.y+72,p.x+190,p.y-25);ctx.stroke();}
      });
    }else{
      ctx.lineWidth=1;
      forVisibleFieldCells(430,340,3,3,({p,h0,h1,h2})=>{
        const w=22+h0*22,h=13+h1*14;ctx.globalAlpha=.11+h2*.08;ctx.strokeStyle=h0>.7?palette.secondary:palette.primary;ctx.strokeRect(p.x-w,p.y-h,w*2,h*2);ctx.beginPath();ctx.moveTo(p.x-w-30,p.y);ctx.lineTo(p.x-w,p.y);ctx.moveTo(p.x+w,p.y);ctx.lineTo(p.x+w+30,p.y);ctx.stroke();
        ctx.globalAlpha=.22;ctx.fillStyle=h0>.7?palette.secondary:palette.primary;ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,TAU);ctx.fill();
        if(h2>.84){ctx.globalAlpha=.07;ctx.fillStyle=palette.primary;ctx.fillRect(p.x-170,p.y+h+26,340,1.5);}
      });
    }
    ctx.restore();
  }

  window.STACKFALL_CONSTELLATION_VISUALS=Object.freeze({familyForOrder,paletteForFamily});
  window.stackfallDrawConstellationBackdrop=drawConstellationBackdrop;
  window.stackfallDrawStageConstellationField=drawConstellationField;
  drawStageWorldBackdrop=drawConstellationBackdrop;
  drawStageConstellationField=drawConstellationField;
})();
