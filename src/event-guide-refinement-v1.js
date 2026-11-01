(()=>{
  'use strict';

  const base=window.drawMapEvents;
  if(typeof base!=='function'||base.__stackfallEventGuideRefinementV1)return;
  const PULL_TOWARD_PLAYER=.12;

  function guideFrame(){
    const landscape=vw>=vh;
    if(landscape){
      const side=clamp(vw*.14,118,148),top=clamp(vh*.18,64,90),bottomGap=clamp(vh*.29,108,156);
      return{left:side,right:vw-side,top,bottom:vh-bottomGap};
    }
    const side=82,top=82,bottomGap=typeof compactDevice==='function'&&compactDevice()?190:160;
    return{left:side,right:vw-side,top,bottom:vh-bottomGap};
  }
  function edgePoint(dx,dy){
    const cx=vw/2,cy=vh/2,{left,right,top,bottom}=guideFrame();
    let scale=Infinity;
    if(dx>0)scale=Math.min(scale,(right-cx)/dx);else if(dx<0)scale=Math.min(scale,(left-cx)/dx);
    if(dy>0)scale=Math.min(scale,(bottom-cy)/dy);else if(dy<0)scale=Math.min(scale,(top-cy)/dy);
    if(!Number.isFinite(scale)||scale<=0)scale=1;
    return{x:cx+dx*scale,y:cy+dy*scale};
  }
  function offscreenShift(){
    if(state.mapEventActive||typeof worldToScreen!=='function')return null;
    const marker=(state.entities.mapEvents||[]).find(item=>item&&!item.consumed);
    if(!marker)return null;
    const p=worldToScreen(marker.x,marker.y),frame=guideFrame();
    if(p.x>frame.left&&p.x<frame.right&&p.y>frame.top&&p.y<frame.bottom)return null;
    const cx=vw/2,cy=vh/2,edge=edgePoint(p.x-cx,p.y-cy);
    return{x:(cx-edge.x)*PULL_TOWARD_PLAYER,y:(cy-edge.y)*PULL_TOWARD_PLAYER};
  }

  const refined=function stackfallCloserEventGuide(){
    const shift=offscreenShift();
    if(!shift)return base();
    ctx.save();
    try{ctx.translate(shift.x,shift.y);return base();}
    finally{ctx.restore();}
  };
  refined.__stackfallEventGuideRefinementV1=true;
  window.drawMapEvents=refined;
  window.stackfallEventGuidePullTowardPlayer=PULL_TOWARD_PLAYER;
})();
