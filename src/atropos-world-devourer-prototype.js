// Atropos World Devourer — world-anchored serpent with continuous body, stable depth layers and production raster plates.
// The combat branch remains a prototype until visual review and player approval; these assets are the approved production raster pass.
(()=>{
  const VERSION='atropos-world-devourer-production-raster-v1';
  const BODY_COUNT=19;
  const SAMPLE_SPACING=96;
  const RENDER_SPACING=26;
  const HISTORY_LIMIT=900;
  const PART_KEYS=['head',...Array.from({length:BODY_COUNT},(_,i)=>`body-${String(i+1).padStart(2,'0')}`),'tail'];
  const PERF={poseBuilds:0,historySegmentsVisited:0,maxHistoryLength:0};

  const production=window.stackfallAtroposProductionArt;
  if(!production?.src)throw new Error('Atropos production raster atlas missing');
  const atlas=new Image();atlas.decoding='async';atlas.src=production.src;
  const ART_FRAMES={
  headClosed:{x:5,y:6,w:153,h:113},
  headOpen:{x:164,y:6,w:142,h:119},
  neckA:{x:311,y:6,w:128,h:102},
  neckB:{x:444,y:7,w:126,h:102},
  bodyA:{x:577,y:7,w:150,h:107},
  bodyB:{x:5,y:131,w:137,h:105},
  bodyC:{x:148,y:131,w:140,h:110},
  bodyD:{x:293,y:131,w:149,h:101},
  rear:{x:446,y:131,w:146,h:87},
  tail:{x:5,y:247,w:199,h:120}
};  production.frames=ART_FRAMES;production.image=atlas;
  const processedHeads={};
  function prepareProcessedHead(key){
    const f=ART_FRAMES[key];if(!f||!atlas.complete||atlas.naturalWidth<2)return;
    try{
      const c=document.createElement('canvas');c.width=f.w;c.height=f.h;const g=c.getContext('2d',{willReadFrequently:true});
      g.drawImage(atlas,f.x,f.y,f.w,f.h,0,0,f.w,f.h);const img=g.getImageData(0,0,f.w,f.h),d=img.data;
      for(let i=0;i<d.length;i+=4){
        if(d[i+3]<8)continue;const r0=d[i],g0=d[i+1],b0=d[i+2],l=.299*r0+.587*g0+.114*b0,crack=clamp((b0-r0-18)/125,0,1);
        let r=l+(r0-l)*.46,gc=l+(g0-l)*.46,b=l+(b0-l)*.52;
        r=r*.66+7+crack*12;gc=gc*.69+9+crack*22;b=b*.76+16+crack*40;
        const q=18;d[i]=clamp(Math.round(r/q)*q,0,255);d[i+1]=clamp(Math.round(gc/q)*q,0,255);d[i+2]=clamp(Math.round(b/q)*q,0,255);
      }
      g.putImageData(img,0,0);processedHeads[key]=c;
    }catch{}
  }
  function prepareProcessedHeads(){prepareProcessedHead('headClosed');prepareProcessedHead('headOpen');}
  if(atlas.complete&&atlas.naturalWidth>1)prepareProcessedHeads();else atlas.addEventListener('load',prepareProcessedHeads,{once:true});
  production.drawScreen=function drawAtroposProductionFrame(key,x,y,a,w,h,alpha=1,options={}){
    const frame=ART_FRAMES[key];if(!frame||!atlas.complete||atlas.naturalWidth<2||alpha<=.005)return false;
    const flip=options.flip===true,scaleX=Number.isFinite(options.scaleX)?options.scaleX:1,scaleY=Number.isFinite(options.scaleY)?options.scaleY:1;
    ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.scale(scaleX,scaleY);if(flip)ctx.scale(1,-1);
    if(options.composite)ctx.globalCompositeOperation=options.composite;if(options.filter)ctx.filter=options.filter;
    ctx.globalAlpha=alpha;ctx.drawImage(atlas,frame.x,frame.y,frame.w,frame.h,-w*.5,-h*.5,w,h);ctx.restore();return true;
  };

  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const smoothRange=(a,b,x)=>smooth((x-a)/Math.max(.0001,b-a));
  const entryTransition=()=>{const tr=state.realmTransition;return tr?.owner==='apex-entry'&&tr?.to==='apex-chrono'&&tr?.form==='chronophage'?tr:null;};
  const chronoSceneActive=()=>state.realmTheme==='apex-chrono'||state.pendingApexForm==='chronophage'||state.realmTransition?.to==='apex-chrono'||!!state.entities.enemies?.some(e=>!e.dead&&e.apexForm==='chronophage');
  const serpentEnemy=()=>state.entities.enemies?.find(e=>!e.dead&&e.apexForm==='chronophage')||null;

  function artManifest(){
    const tr=entryTransition();
    if(tr){const p=tr.elapsed/Math.max(.001,tr.duration);return smooth(clamp((p-.43)/.09,0,1));}
    return serpentEnemy()?1:0;
  }

  function motionScale(){return clamp(Math.min(vw,vh)/900,.92,1.20);}
  function idleOffset(serpent,t=serpent.motionTime){
    const phase=Number(serpent.phaseBase)||0,a=(Number(t)||0)*.118+phase;
    const rx=clamp(vw*.34,520,700),ry=clamp(vh*.225,200,290),drift=clamp(Math.min(vw,vh)*.08,55,90);
    return{
      x:Math.cos(a)*rx+Math.sin(a*.47+.4)*drift,
      y:Math.sin(a*1.65)*ry+Math.sin(a*.73+1.2)*62,
      orbitA:a
    };
  }
  window.stackfallAtroposIdleOffset=idleOffset;
  function headWorldPosition(e,serpent,t){
    const o=idleOffset(serpent,t);
    return{x:serpent.anchorX+o.x,y:serpent.anchorY+o.y,orbitA:o.orbitA};
  }

  function seedHistory(e,serpent){
    serpent.history.length=0;
    const now=serpent.motionTime;
    for(let i=HISTORY_LIMIT-1;i>=0;i--){
      const p=headWorldPosition(e,serpent,now-i*.018);
      serpent.history.push(p);
    }
    serpent.last=serpent.history[serpent.history.length-1];
  }

  function ensureSerpent(e){
    if(!e||e.apexForm!=='chronophage')return null;
    const r=e.atroposReborn||(e.atroposReborn={});
    let serpent=r.worldDevourer;
    if(!serpent)serpent=r.worldDevourer={history:[],points:[],last:null,initialized:false};
    if(!serpent.initialized){
      const arena=state.apexArena;
      serpent.anchorX=Number.isFinite(arena?.x)?arena.x:(Number.isFinite(e.x)?e.x:player.x);
      serpent.anchorY=Number.isFinite(arena?.y)?arena.y:(Number.isFinite(e.y)?e.y:player.y);
      serpent.phaseBase=(e.id||0)*.173+.4;
      serpent.motionTime=0;
      serpent.lastReal=performance.now()*.001;
      const definitions=PART_KEYS.map((key,i)=>({key,label:key.toUpperCase(),dx:0,dy:0,r:i===0?98:i===PART_KEYS.length-1?42:76,active:true,visible:true}));
      if(typeof defineBossBodyParts==='function')defineBossBodyParts(e,definitions);
      seedHistory(e,serpent);
      serpent.initialized=true;
      e.contactSafeUntil=1e12;
    }
    return serpent;
  }

  function advanceSerpent(e,serpent){
    const now=performance.now()*.001;
    const realDt=clamp(now-(serpent.lastReal||now),0,.05);
    serpent.lastReal=now;
    const speed=state.mode==='playing'&&typeof window.stackfallGameSpeed==='function'?clamp(window.stackfallGameSpeed(),1,4):1;
    serpent.motionTime+=realDt*speed;
    const follow=1-Math.exp(-.30*realDt);
    serpent.anchorX+=((Number(player.x)||0)-serpent.anchorX)*follow;
    serpent.anchorY+=((Number(player.y)||0)-serpent.anchorY)*follow;
    const p=headWorldPosition(e,serpent,serpent.motionTime),last=serpent.last;serpent.liveHead=p;
    if(!last||Math.hypot(p.x-last.x,p.y-last.y)>=3.2){
      serpent.history.push(p);serpent.last=p;
      if(serpent.history.length>HISTORY_LIMIT)serpent.history.splice(0,serpent.history.length-HISTORY_LIMIT);
    }
  }

  function sampleHistoryDistances(history,distances){
    const out=new Array(distances.length);
    if(!history.length){for(let i=0;i<out.length;i++)out[i]={x:player.x,y:player.y,a:0,orbitA:0};return out;}
    let newer=history[history.length-1],walked=0,target=0;
    for(let i=history.length-2;i>=0&&target<distances.length;i--){
      const older=history[i],dx=newer.x-older.x,dy=newer.y-older.y,len=Math.hypot(dx,dy);PERF.historySegmentsVisited++;
      if(len>0){
        const end=walked+len;
        while(target<distances.length&&distances[target]<=end){
          const q=clamp((Math.max(0,distances[target])-walked)/len,0,1);
          out[target++]={x:newer.x-dx*q,y:newer.y-dy*q,a:Math.atan2(dy,dx),orbitA:lerp(newer.orbitA,older.orbitA,q)};
        }
        walked=end;
      }
      newer=older;
    }
    const fallbackA=history.length>1?Math.atan2(history[1].y-history[0].y,history[1].x-history[0].x):0,fallback=history[0];
    while(target<out.length)out[target++]={x:fallback.x,y:fallback.y,a:fallbackA,orbitA:fallback.orbitA||0};
    return out;
  }

  function buildSerpentPose(e){
    const serpent=ensureSerpent(e);if(!serpent)return null;
    advanceSerpent(e,serpent);
    PERF.poseBuilds++;PERF.maxHistoryLength=Math.max(PERF.maxHistoryLength,serpent.history.length);
    const scaleUnit=motionScale(),points=[],distances=[];
    for(let i=0;i<PART_KEYS.length;i++){const tailT=i/(PART_KEYS.length-1);distances.push(i*SAMPLE_SPACING*scaleUnit*(1+tailT*.025));}
    const history=serpent.history,live=serpent.liveHead,stored=history[history.length-1],useLive=!!(live&&stored&&Math.hypot(live.x-stored.x,live.y-stored.y)>.001);
    if(useLive)history.push(live);
    const samples=sampleHistoryDistances(history,distances);
    const taperAt=t=>t<.12?lerp(1.18,1.12,t/.12):t<.68?lerp(1.12,.88,(t-.12)/.56):lerp(.88,.10,(t-.68)/.32);
    const totalDistance=distances[distances.length-1],renderDistances=[];
    for(let d=0;d<totalDistance;d+=RENDER_SPACING*scaleUnit)renderDistances.push(d);
    renderDistances.push(totalDistance);
    const renderSamples=sampleHistoryDistances(history,renderDistances),renderPoints=[];
    if(useLive)history.pop();
    for(let i=0;i<PART_KEYS.length;i++){
      const tailT=i/(PART_KEYS.length-1),q=samples[i],screen=worldToScreen(q.x,q.y),depth=Math.sin((q.orbitA||0)+.35);
      points.push({...q,sx:screen.x,sy:screen.y,key:PART_KEYS[i],index:i,tailT,depth,taper:taperAt(tailT),scaleUnit});
    }
    for(let i=0;i<renderSamples.length;i++){
      const tailT=i/Math.max(1,renderSamples.length-1),q=renderSamples[i],screen=worldToScreen(q.x,q.y),depth=Math.sin((q.orbitA||0)+.35);
      renderPoints.push({...q,sx:screen.x,sy:screen.y,index:i,tailT,depth,taper:taperAt(tailT),scaleUnit});
    }
    for(let i=0;i<renderPoints.length;i++){
      const a=renderPoints[Math.max(0,i-2)],b=renderPoints[Math.min(renderPoints.length-1,i+2)];
      renderPoints[i].a=Math.atan2(b.sy-a.sy,b.sx-a.sx);
    }
    serpent.points=points;serpent.renderPoints=renderPoints;
    e.x=serpent.anchorX;e.y=serpent.anchorY;
    for(let i=0;i<points.length;i++){
      const part=e.bodyParts?.[i];if(!part)continue;
      const q=points[i];part.dx=q.x-e.x;part.dy=q.y-e.y;
      part.r=(i===0?80:i===points.length-1?26:60)*q.taper*q.scaleUnit;
      part.active=true;part.visible=true;part.dead=false;
    }
    if(typeof refreshBossBodyParts==='function')refreshBossBodyParts(e);
    return serpent;
  }

  function layerWeights(depth){
    const front=smoothRange(.16,.70,depth),back=smoothRange(.16,.70,-depth),mid=clamp(1-front-back,0,1);
    return{front,mid,back};
  }
  function bodyHalfWidth(p,i,side=1){
    const tailT=clamp(Number.isFinite(p.tailT)?p.tailT:i/Math.max(1,PART_KEYS.length-1),0,1);
    const base=tailT<.10?lerp(108,94,tailT/.10):tailT<.62?lerp(94,72,(tailT-.10)/.52):lerp(72,7,(tailT-.62)/.38);
    const jag=1+.042*Math.sin(tailT*23+side*.83)+.017*Math.sin(tailT*61+side*2.27);
    return base*p.scaleUnit*jag;
  }
  function layerRuns(points,layer){
    const runs=[];let run=[];const headDepth=points[0]?.depth||0;
    for(let i=0;i<points.length;i++){
      const p=points[i],depth=i<8?headDepth:p.depth,weight=layerWeights(depth)[layer];
      if(weight>.018)run.push({p,i,weight});
      else if(run.length){if(run.length>1)runs.push(run);run=[];}
    }
    if(run.length>1)runs.push(run);return runs;
  }
  function traceBodyPolygon(run,scale=1){
    ctx.beginPath();
    for(let k=0;k<run.length;k++){
      const {p,i}=run[k],half=bodyHalfWidth(p,i,1)*scale,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),phase=(p.tailT||0)*Math.PI*2,j=(Math.sin(phase*5.3)+Math.sin(phase*11.7))*1.15*scale,x=p.sx+nx*half+tx*j,y=p.sy+ny*half+ty*j;
      if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    for(let k=run.length-1;k>=0;k--){
      const {p,i}=run[k],half=bodyHalfWidth(p,i,-1)*scale,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),phase=(p.tailT||0)*Math.PI*2,j=(Math.cos(phase*4.9)+Math.sin(phase*9.1))*1.05*scale;
      ctx.lineTo(p.sx-nx*half+tx*j,p.sy-ny*half+ty*j);
    }
    ctx.closePath();
  }
  function drawCarapaceSurface(run,manifest,solid){
    if(run.length<5)return;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    ctx.beginPath();
    for(let k=0;k<run.length;k++){
      const {p,i}=run[k],half=bodyHalfWidth(p,i,1)*.62,nx=-Math.sin(p.a),ny=Math.cos(p.a),x=p.sx+nx*half,y=p.sy+ny*half;
      if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.globalAlpha=manifest*solid*.20;ctx.strokeStyle='#31405a';ctx.lineWidth=7;ctx.stroke();
    const step=Math.max(7,Math.floor(run.length/9));
    for(let k=step;k<run.length-step;k+=step){
      const {p,i,weight}=run[k],flip=((Math.floor((p.tailT||0)*73))&1)?1:-1,half=bodyHalfWidth(p,i,1)*.76,nx=-Math.sin(p.a),ny=Math.cos(p.a),tx=Math.cos(p.a),ty=Math.sin(p.a),diag=12*p.scaleUnit*flip;
      const ax=p.sx+nx*half-tx*diag,ay=p.sy+ny*half-ty*diag,bx=p.sx-nx*half+tx*diag,by=p.sy-ny*half+ty*diag;
      ctx.globalAlpha=manifest*weight*.31;ctx.strokeStyle='#050812';ctx.lineWidth=Math.max(4,5*p.scaleUnit);ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
      ctx.globalAlpha=manifest*weight*.17;ctx.strokeStyle='#5d6f8d';ctx.lineWidth=Math.max(1,1.3*p.scaleUnit);ctx.beginPath();ctx.moveTo(ax+tx*2,ay+ty*2);ctx.lineTo(bx+tx*2,by+ty*2);ctx.stroke();
      if((k/step)%2<1.1){
        const side=flip,crackHalf=half*.34,cx=p.sx+nx*crackHalf*side,cy=p.sy+ny*crackHalf*side;
        ctx.globalAlpha=manifest*weight*.20;ctx.strokeStyle='#9ed7e6';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx-tx*10*p.scaleUnit,cy-ty*10*p.scaleUnit);ctx.lineTo(cx+nx*8*side,cy+ny*8*side);ctx.lineTo(cx+tx*16*p.scaleUnit,cy+ty*16*p.scaleUnit);ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawSpine(points,manifest,layer){
    const runs=layerRuns(points,layer);if(!runs.length)return;
    ctx.save();ctx.lineJoin='round';ctx.lineCap='butt';
    for(const run of runs){
      const avg=run.reduce((sum,e)=>sum+e.weight,0)/run.length,solid=clamp(avg*1.72,.14,1);
      traceBodyPolygon(run,1.055);ctx.globalAlpha=manifest*solid*.84;ctx.fillStyle='#273249';ctx.fill();
      traceBodyPolygon(run,1);ctx.globalAlpha=manifest*solid;ctx.fillStyle='#030610';ctx.fill();
      traceBodyPolygon(run,.965);ctx.globalAlpha=manifest*solid*.72;ctx.fillStyle='#0a1020';ctx.fill();
      traceBodyPolygon(run,1.01);ctx.globalAlpha=manifest*solid*.20;ctx.strokeStyle='#62718b';ctx.lineWidth=2.2;ctx.stroke();
      drawCarapaceSurface(run,manifest,solid);
    }
    ctx.restore();
  }
  function drawSprite(frameKey,p,w,h,alpha=1,glow=0,flip=false,scaleX=1,scaleY=1){
    if(!atlas.complete||atlas.naturalWidth<2||alpha<=.005)return;
    const depthScale=lerp(.88,1.12,(p.depth+1)*.5),W=w*depthScale,H=h*depthScale,processed=processedHeads[frameKey];
    if(processed){
      ctx.save();ctx.translate(p.sx,p.sy);ctx.rotate(p.a||0);ctx.scale(scaleX,scaleY);if(flip)ctx.scale(1,-1);ctx.imageSmoothingEnabled=true;
      if(glow>0){ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha*glow;ctx.filter='blur(.7px)';ctx.drawImage(processed,-W*.5,-H*.5,W,H);}
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=alpha;ctx.filter='contrast(.96) saturate(.84)';ctx.drawImage(processed,-W*.5,-H*.5,W,H);ctx.restore();return;
    }
    if(glow>0)production.drawScreen(frameKey,p.sx,p.sy,p.a,W,H,alpha*glow,{flip,scaleX,scaleY,composite:'screen',filter:'saturate(.62) contrast(.90) brightness(.74)'});
    production.drawScreen(frameKey,p.sx,p.sy,p.a,W,H,alpha,{flip,scaleX,scaleY,filter:'saturate(.62) contrast(.90) brightness(.74)'});
  }
  function drawSerpentLayer(manifest,layer){
    if(manifest<=.001)return;
    const e=serpentEnemy();if(!e)return;
    const serpent=ensureSerpent(e);if(!serpent?.points?.length)return;
    const pts=serpent.renderPoints?.length?serpent.renderPoints:serpent.points;
    drawSpine(pts,manifest,layer);
    const head=pts[0];if(!head)return;
    const weight=layerWeights(head.depth)[layer];if(weight<=.01)return;
    const foregroundFade=layer==='front'?.86:1,alpha=manifest*weight*foregroundFade;
    const jaw=window.stackfallAtroposMawJawScale,scaleX=Number(jaw?.x)||1,scaleY=Number(jaw?.y)||1,open=!!jaw;
    drawSprite(open?'headOpen':'headClosed',head,410*head.scaleUnit,228*head.scaleUnit,.94*alpha,.028,false,scaleX,scaleY);
  }

  const baseEnsure=ensureRebornAtropos;
  ensureRebornAtropos=function ensureWorldDevourer(e){
    if(!e||e.apexForm!=='chronophage')return baseEnsure(e);
    if(!e.atroposReborn){const ok=baseEnsure(e);if(!ok)return false;}
    ensureSerpent(e);return true;
  };
  const basePose=updateAtroposPose;
  updateAtroposPose=function updateWorldDevourerPose(e){if(e?.apexForm==='chronophage'&&e?.atroposReborn?.worldDevourer)return e.atroposReborn.worldDevourer;return basePose(e);};

  const baseBackground=drawBackground;
  drawBackground=function drawBackgroundWithWorldDevourer(){
    const tr=entryTransition();
    if(tr){
      const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),blend=smooth(clamp((p-.50)/.36,0,1));
      drawTheme(normalizedRealmTheme(tr.from));if(blend>0){ctx.save();ctx.globalAlpha=blend;drawTheme(normalizedRealmTheme(tr.to));ctx.restore();}
      const e=serpentEnemy();if(e)buildSerpentPose(e);drawSerpentLayer(artManifest(),'back');return;
    }
    const result=baseBackground();if(chronoSceneActive()){const e=serpentEnemy();if(e)buildSerpentPose(e);drawSerpentLayer(artManifest(),'back');}return result;
  };

  drawAtroposWorldBody=function drawWorldDevourerTargets(e){return ensureRebornAtropos(e);};
  const baseDrawEnemies=drawEnemies;
  drawEnemies=function drawEnemiesWithoutWorldDevourerOwner(){
    const list=state.entities.enemies||[],e=list.find(enemy=>!enemy?.dead&&enemy.apexForm==='chronophage');
    if(!e)return baseDrawEnemies();const index=list.indexOf(e);if(index<0)return baseDrawEnemies();
    list.splice(index,1);try{baseDrawEnemies();}finally{list.splice(Math.min(index,list.length),0,e);}
    drawAtroposWorldBody(e);drawSerpentLayer(artManifest(),'mid');
  };
  const baseDrawPlayer=drawPlayer;
  drawPlayer=function drawPlayerWithWorldDevourerForeground(){baseDrawPlayer();if(chronoSceneActive())drawSerpentLayer(artManifest(),'front');};

  const baseCinematicOverlay=drawRealmCinematicOverlay;
  drawRealmCinematicOverlay=function drawWorldDevourerEntryOverlay(){
    const tr=entryTransition();if(!tr)return baseCinematicOverlay();
    const p=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),restore=smooth(clamp((p-.82)/.15,0,1));
    ctx.save();ctx.globalCompositeOperation='saturation';ctx.globalAlpha=1-restore;ctx.fillStyle='#777';ctx.fillRect(0,0,vw,vh);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=(1-restore)*.20;ctx.fillStyle='#02050a';ctx.fillRect(0,0,vw,vh);ctx.restore();
    const fadeIn=smooth(clamp((p-.08)/.13,0,1)),fadeOut=1-smooth(clamp((p-.76)/.16,0,1)),alpha=fadeIn*fadeOut;if(alpha<=.002)return;
    const w=Math.min(560,vw*.72),h=94,x=(vw-w)*.5,y=vh*.48-h*.5;
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='rgba(6,9,16,.80)';ctx.strokeStyle='rgba(220,230,242,.20)';ctx.lineWidth=1;ctx.beginPath();if(typeof ctx.roundRect==='function')ctx.roundRect(x,y,w,h,12);else ctx.rect(x,y,w,h);ctx.fill();ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(210,218,228,.66)';ctx.font='800 11px IBM Plex Sans KR, sans-serif';ctx.fillText(GAME_SETTINGS?.language==='ko'?'초월체':'APEX',vw*.5,y+25);ctx.fillStyle='#f2f5f8';ctx.font=`900 ${Math.min(32,Math.max(20,vw*.033))}px Black Han Sans, sans-serif`;ctx.fillText(tr.title||bossName(tr.form),vw*.5,y+59,w-28);ctx.restore();
  };

  window.stackfallAtroposVisualVersion=VERSION;
  window.stackfallAtroposArtDiagnostics=()=>{const e=serpentEnemy(),serpent=e?.atroposReborn?.worldDevourer;return{version:VERSION,assets:{head:atlas.complete&&atlas.naturalWidth>1,body:atlas.complete&&atlas.naturalWidth>1,bodyVariants:['neckA','neckB','bodyA','bodyB','bodyC','bodyD','rear'].map(()=>atlas.complete&&atlas.naturalWidth>1),tail:atlas.complete&&atlas.naturalWidth>1,atlas:atlas.complete&&atlas.naturalWidth>1,production:true,source:production.version},scene:chronoSceneActive(),anchor:serpent?{x:Math.round(serpent.anchorX),y:Math.round(serpent.anchorY)}:null,renderMode:'canvas-serpent-scurve-v4',renderSamples:serpent?.renderPoints?.length||0,segments:serpent?.points?.map(p=>({key:p.key,x:Math.round(p.x),y:Math.round(p.y),sx:Math.round(p.sx),sy:Math.round(p.sy),angle:+p.a.toFixed(2),depth:+p.depth.toFixed(2)}))||[],entry:entryTransition()?{form:state.realmTransition.form,elapsed:state.realmTransition.elapsed,duration:state.realmTransition.duration}:null,performance:{poseBuilds:PERF.poseBuilds,historySegmentsVisited:PERF.historySegmentsVisited,maxHistoryLength:PERF.maxHistoryLength,historyLimit:HISTORY_LIMIT},clock:window.stackfallApexClockDiagnostics?.()||null};};
})();