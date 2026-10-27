// Atropos art pass v8 — layered arena illustration + embedded fracture surfaces.
// The colossus is a distant world-scale entity, not a player-centered Canvas construction.
(()=>{
  function bootAtroposArt(){
    const VERSION='atropos-art-v8';
    const arenaArt=new Image();
    arenaArt.decoding='async';
    arenaArt.src=window.STACKFALL_ATROPOS_ARENA_ART||'';
    const fractureArt=new Image();
    const fractureSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 190"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efffff"/><stop offset=".24" stop-color="#9ff2ea"/><stop offset=".55" stop-color="#638bab"/><stop offset="1" stop-color="#32355d"/></linearGradient><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="q"/><feMerge><feMergeNode in="q"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M15 96C30 35 82 8 145 17c56 8 98 44 102 88-17 38-57 70-110 73-58 3-104-27-122-82Z" fill="#08131f" stroke="#31485f" stroke-width="8"/><path d="M33 94c17-45 56-65 107-60 43 4 76 27 87 60-15 29-46 52-88 57-48 4-88-16-106-57Z" fill="url(#g)" opacity=".84" filter="url(#b)"/><path d="M51 78c34-28 68-35 108-31-27 13-48 31-62 55-16 24-29 32-50 31-9-18-8-39 4-55Z" fill="#f4ffff" opacity=".30"/><path d="M176 48c28 14 45 31 51 50-17-7-35-7-53-1-17 6-31 15-44 27 7-33 20-58 46-76Z" fill="#8e8fda" opacity=".28"/></svg>`;
    fractureArt.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(fractureSvg);
  
    const pose={
      'west-blade':{x:.255,y:.385,rot:-.22,scale:.88},
      'crown-anchor':{x:.415,y:.235,rot:.16,scale:.76},
      'rift-core':{x:.585,y:.345,rot:-.08,scale:.96},
      'keel-anchor':{x:.665,y:.565,rot:.24,scale:.82},
      'east-blade':{x:.805,y:.425,rot:-.30,scale:.90}
    };
  
    function partOf(e,key){return typeof atroposPart==='function'?atroposPart(e,key):e?.bodyParts?.find(p=>p.key===key);}
    function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}
    function artManifest(){
      const tr=state.realmTransition;
      if(tr?.to==='apex-chrono')return smooth(clamp((tr.elapsed/Math.max(.001,tr.duration)-.24)/.46,0,1));
      const e=state.entities.enemies?.find(enemy=>!enemy.dead&&enemy.apexForm==='chronophage');
      return e?clamp((e.atroposReborn?.introAge||0)/.64,0,1):0;
    }
    function chronoSceneActive(){return state.realmTheme==='apex-chrono'||state.apexActiveId&&state.entities.enemies?.some(e=>!e.dead&&e.id===state.apexActiveId&&e.apexForm==='chronophage')||state.pendingApexForm==='chronophage'||state.realmTransition?.to==='apex-chrono';}
  
    const baseEnsure=ensureRebornAtropos;
    ensureRebornAtropos=function ensureAtroposArtAnchor(e){
      const wasReady=!!e?.atroposReborn;
      const ok=baseEnsure(e);if(!ok)return false;
      const r=e.atroposReborn;
      if(!r.artAnchorV8){
        r.anchorX=player.x+Math.min(330,vw*.20);
        r.anchorY=player.y-Math.min(340,vh*.36);
        e.x=r.anchorX;e.y=r.anchorY;r.artAnchorV8=true;
        refreshBossBodyParts(e);
      }
      if(!wasReady&&r.introAge<.02)r.slashCd=Math.max(r.slashCd,3.8);
      return true;
    };
  
    const basePose=updateAtroposPose;
    updateAtroposPose=function updateAtroposArtPose(e){
      const result=basePose(e);if(!e?.atroposReborn||e.apexForm!=='chronophage')return result;
      const slash=e.atroposReborn.slash;
      let align=0,open=0;
      if(slash){
        const a=slash.age;
        align=a<.78?smooth(a/.78):a<1.46?1:1-smooth((a-1.46)/.74);
        if(a>=1.16&&a<1.58)open=Math.sin(Math.PI*clamp((a-1.16)/.42,0,1));
      }
      const driftX=(e.atroposReborn.anchorX-player.x)*.035,driftY=(e.atroposReborn.anchorY-(player.y-vh*.36))*.025;
      for(const [key,p] of Object.entries(pose)){
        const part=partOf(e,key);if(!part)continue;
        let sx=vw*p.x+driftX,sy=vh*p.y+driftY;
        const side=key==='west-blade'||key==='crown-anchor'?-1:1;
        sx+=side*(18+16*(key.includes('blade')?1:0))*align+side*18*open;
        sy+=(key==='crown-anchor'?-18:key==='keel-anchor'?20:8)*align;
        part.dx=player.x+sx-vw/2-e.x;
        part.dy=player.y+sy-vh/2-e.y;
      }
      refreshBossBodyParts(e);return result;
    };
  
    function drawArenaIllustration(manifest){
      if(!arenaArt.complete||arenaArt.naturalWidth<2||manifest<=.001)return;
      const e=state.entities.enemies?.find(enemy=>!enemy.dead&&enemy.apexForm==='chronophage');
      const r=e?.atroposReborn;
      const ox=clamp(((r?.anchorX??player.x)-player.x)*.045,-34,34);
      const oy=clamp(((r?.anchorY??player.y)-(player.y-vh*.36))*.025,-18,18);
      const breathe=1.035+Math.sin((state.time||0)*.10)*.0025;
      const dw=vw*breathe,dh=vh*breathe,x=(vw-dw)*.5+ox,y=(vh-dh)*.5+oy;
      ctx.save();ctx.globalAlpha=.88*manifest;ctx.drawImage(arenaArt,x,y,dw,dh);
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.09*manifest;ctx.fillStyle='#07142a';ctx.fillRect(0,0,vw,vh);
      ctx.restore();
    }
  
    const baseBackground=drawBackground;
    drawBackground=function drawBackgroundWithAtroposArt(){
      const result=baseBackground();
      if(chronoSceneActive())drawArenaIllustration(artManifest());
      return result;
    };
  
    function drawFracture(e,key){
      const part=partOf(e,key),cfg=pose[key];if(!part||!cfg||!fractureArt.complete)return;
      const p=atroposScreenPoint(part.x,part.y),hit=typeof atroposPartHitPulse==='function'?atroposPartHitPulse(e,key):0;
      const active=part.active!==false,manifest=artManifest(),base=Math.max(82,part.r*1.55)*cfg.scale;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(cfg.rot+(key==='rift-core'?-.04:0));
      const wobble=1+Math.sin((state.time||0)*.38+(part.r||0))*.012;
      ctx.scale(wobble,wobble);ctx.globalAlpha=manifest*(active?.76:.28);
      if(hit){ctx.shadowColor='#eaffff';ctx.shadowBlur=22;ctx.globalAlpha=Math.min(1,ctx.globalAlpha+.42*hit);}
      ctx.drawImage(fractureArt,-base,-base*.73,base*2,base*1.46);
      ctx.shadowBlur=0;ctx.restore();
    }
  
    drawAtroposWorldBody=function drawAtroposArtSurfaces(e){
      if(!ensureRebornAtropos(e))return;updateAtroposPose(e);
      for(const key of['west-blade','crown-anchor','rift-core','keel-anchor','east-blade'])drawFracture(e,key);
    };
  
    if(typeof updateRealmTransition==='function'&&typeof updateAtroposEntryControl==='function'){
      const baseTransition=updateRealmTransition;
      updateRealmTransition=function updateRealmTransitionWithAtroposControl(dt){
        if(state.realmTransition?.to==='apex-chrono')updateAtroposEntryControl(dt||0);
        const result=baseTransition(dt);
        if(state.realmTransition?.to==='apex-chrono')updateAtroposEntryControl(0);
        return result;
      };
    }
  
    if(typeof baseDrawRealmCinematicOverlayAtropos==='function'){
      drawRealmCinematicOverlay=function drawAtroposArtCinematicOverlay(){
        const result=baseDrawRealmCinematicOverlayAtropos();
        const tr=state.realmTransition;if(tr?.to==='apex-chrono'){
          const q=clamp(tr.elapsed/Math.max(.001,tr.duration),0,1),quiet=1-smooth(clamp((q-.08)/.40,0,1));
          ctx.save();ctx.globalAlpha=.15*quiet;ctx.fillStyle='#00030a';ctx.fillRect(0,0,vw,vh);ctx.restore();
        }
        return result;
      };
    }
  
    window.stackfallAtroposVisualVersion=VERSION;
    window.stackfallAtroposArtDiagnostics=()=>({version:VERSION,arenaReady:arenaArt.complete&&arenaArt.naturalWidth>1,fractureReady:fractureArt.complete&&fractureArt.naturalWidth>1,scene:chronoSceneActive(),clock:window.stackfallApexClockDiagnostics?.()||null});
  }
  if(window.STACKFALL_ATROPOS_ARENA_ART){bootAtroposArt();return;}
  const prior=document.querySelector('script[data-atropos-art-data]');
  if(prior){prior.addEventListener('load',bootAtroposArt,{once:true});return;}
  const data=document.createElement('script');data.src='src/atropos-art-data.js';data.dataset.atroposArtData='1';data.onload=bootAtroposArt;data.onerror=()=>console.error('[Stackfall] failed to load Atropos art data');document.body.appendChild(data);
})();
