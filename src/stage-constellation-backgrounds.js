(()=>{
  const familyForOrder=order=>order<=6?1:order<=12?2:3;
  const orderFromTheme=theme=>{
    const match=String(theme||'').match(/^stage-(\d{2})$/);
    return match?Math.max(1,Math.min(18,Number(match[1])||1)):null;
  };
  const paletteForFamily=family=>{
    if(family===2)return{wash:'rgba(105,33,128,.105)',glow:'rgba(66,214,187,.055)',primary:'rgba(210,133,255,.30)',secondary:'rgba(111,232,207,.24)'};
    if(family===3)return{wash:'rgba(16,93,112,.095)',glow:'rgba(223,173,81,.045)',primary:'rgba(106,226,238,.26)',secondary:'rgba(229,184,100,.23)'};
    return{wash:'rgba(54,70,172,.10)',glow:'rgba(72,211,255,.055)',primary:'rgba(145,170,255,.29)',secondary:'rgba(99,224,255,.25)'};
  };

  function drawConstellationBackdrop(order){
    drawSpaceBackground();
    const family=familyForOrder(Math.max(1,Number(order)||1)),palette=paletteForFamily(family),size=Math.max(vw,vh);
    ctx.save();
    const wash=ctx.createLinearGradient(0,0,vw,vh);wash.addColorStop(0,palette.wash);wash.addColorStop(.62,'rgba(0,0,0,0)');wash.addColorStop(1,palette.glow);ctx.fillStyle=wash;ctx.fillRect(0,0,vw,vh);
    const ambient=ctx.createRadialGradient(vw*.48,vh*.46,0,vw*.48,vh*.46,size*.72);ambient.addColorStop(0,palette.glow);ambient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ambient;ctx.fillRect(0,0,vw,vh);
    ctx.restore();
  }

  function drawConstellationField(theme){
    const order=orderFromTheme(theme);if(!order)return;
    const family=familyForOrder(order),palette=paletteForFamily(family),t=performance.now()/1000,px=player.x||0,py=player.y||0;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(family===1){
      ctx.lineWidth=1.35;
      for(let i=0;i<13;i++){
        const x=wrap(117+i*173-px*.12,2100)-100,y=wrap(83+i*109-py*.10,1450)-80,a=-.42+(i%5)*.17+t*.004*(i%2?1:-1),len=18+(i%4)*10;
        ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=.26+(i%3)*.035;ctx.strokeStyle=i%3===0?palette.secondary:palette.primary;ctx.beginPath();ctx.moveTo(-len*.72,-2);ctx.lineTo(-len*.12,-6);ctx.lineTo(len*.78,0);ctx.lineTo(-len*.08,6);ctx.closePath();ctx.stroke();ctx.restore();
      }
      ctx.globalAlpha=.13;ctx.strokeStyle=palette.secondary;ctx.setLineDash([18,15]);for(let i=0;i<3;i++){const x=wrap(430+i*690-px*.035,2300)-260,y=wrap(250+i*350-py*.025,1500)-170;ctx.beginPath();ctx.ellipse(x,y,150+i*32,56+i*11,.18+i*.17,.18,Math.PI*1.72);ctx.stroke();}ctx.setLineDash([]);
    }else if(family===2){
      for(let i=0;i<9;i++){
        const x=wrap(130+i*241-px*.09,2200)-120,y=wrap(70+i*157-py*.075,1500)-100,r=24+(i%4)*11;
        ctx.globalAlpha=.12+(i%3)*.025;ctx.strokeStyle=i%2?palette.primary:palette.secondary;ctx.lineWidth=1.35;ctx.beginPath();ctx.ellipse(x,y,r*1.7,r*.55,(i*.41+t*.006)%TAU,0,TAU);ctx.stroke();
        ctx.globalAlpha=.16;ctx.fillStyle=i%2?palette.secondary:palette.primary;ctx.beginPath();ctx.arc(x+Math.cos(i)*r*.7,y+Math.sin(i)*r*.35,1.8+(i%3),0,TAU);ctx.fill();
      }
      ctx.globalAlpha=.10;ctx.strokeStyle=palette.primary;ctx.lineWidth=2;for(let lane=0;lane<3;lane++){const y=vh*(.25+lane*.24)+Math.sin(t*.13+lane)*18;ctx.beginPath();ctx.moveTo(-80,y);ctx.bezierCurveTo(vw*.26,y-95,vw*.66,y+90,vw+90,y-18);ctx.stroke();}
    }else{
      ctx.lineWidth=1;for(let i=0;i<10;i++){
        const x=wrap(95+i*223-px*.10,2100)-100,y=wrap(65+i*137-py*.085,1420)-80,w=22+(i%3)*11,h=13+(i%2)*7;
        ctx.globalAlpha=.13+(i%3)*.025;ctx.strokeStyle=i%3===0?palette.secondary:palette.primary;ctx.strokeRect(x-w,y-h,w*2,h*2);ctx.beginPath();ctx.moveTo(x-w-30,y);ctx.lineTo(x-w,y);ctx.moveTo(x+w,y);ctx.lineTo(x+w+30,y);ctx.stroke();
        ctx.globalAlpha=.24;ctx.fillStyle=i%3===0?palette.secondary:palette.primary;ctx.beginPath();ctx.arc(x,y,2.2,0,TAU);ctx.fill();
      }
      const scan=wrap(t*23-py*.16,vh+180)-90;ctx.globalAlpha=.07;ctx.fillStyle=palette.primary;ctx.fillRect(0,scan,vw,1.5);
    }
    ctx.restore();
  }

  window.STACKFALL_CONSTELLATION_VISUALS=Object.freeze({familyForOrder,paletteForFamily});
  window.stackfallDrawConstellationBackdrop=drawConstellationBackdrop;
  window.stackfallDrawStageConstellationField=drawConstellationField;
  drawStageWorldBackdrop=drawConstellationBackdrop;
  drawStageConstellationField=drawConstellationField;
})();
