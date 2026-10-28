from pathlib import Path
p=Path('src/atropos-world-devourer-attack-world.js')
s=p.read_text()
needle="""  function drawGiantHead(a,q){
    const art=productionArt();if(!art?.drawScreen)return;const enter=q<.48?ease(q/.48):q<.80?1:1-smooth((q-.80)/.20),x=lerp(a.headOutside.x,a.biteCenter.x,enter),y=lerp(a.headOutside.y,a.biteCenter.y,enter),p=worldToScreen(x,y),baseW=clamp(Math.min(vw,vh)*1.10,880,1240),baseH=baseW*.54,snap=Math.max(0,1-Math.abs(q-.62)/.16),sy=1-.28*snap;
    art.drawScreen('headOpen',p.x,p.y,a.rot,baseW,baseH,.98,{flip:a.flip,scaleY:sy});if(snap>.04)strokeBoundary(a,'#e5fbff',.78*snap,8);
  }

"""
restore="""  function drawGiantHead(a,q){
    const art=productionArt();if(!art?.drawScreen)return;const enter=q<.48?ease(q/.48):q<.80?1:1-smooth((q-.80)/.20),x=lerp(a.headOutside.x,a.biteCenter.x,enter),y=lerp(a.headOutside.y,a.biteCenter.y,enter),p=worldToScreen(x,y),baseW=clamp(Math.min(vw,vh)*1.10,880,1240),baseH=baseW*.54,snap=Math.max(0,1-Math.abs(q-.62)/.16),sy=1-.28*snap;
    art.drawScreen('headOpen',p.x,p.y,a.rot,baseW,baseH,.98,{flip:a.flip,scaleY:sy});if(snap>.04)strokeBoundary(a,'#e5fbff',.78*snap,8);
  }
  function drawScarCracks(a,alpha){const pts=boundaryPoints(a);ctx.save();ctx.strokeStyle='#a8e5f6';ctx.lineWidth=2;ctx.globalAlpha=alpha;for(let i=1;i<pts.length-1;i+=3){const p=pts[i],seed=i+a.serial*5,steps=3;let x=p.x,y=p.y;ctx.beginPath();let sp=worldToScreen(x,y);ctx.moveTo(sp.x,sp.y);for(let k=0;k<steps;k++){const advance=35+seeded(seed+k*7,a.serial)*60,side=(seeded(seed+k*11,a.serial)-.5)*70;x+=a.outX*advance+a.perpX*side;y+=a.outY*advance+a.perpY*side;sp=worldToScreen(x,y);ctx.lineTo(sp.x,sp.y);}ctx.stroke();}ctx.restore();}
  function drawWorld(){
    const e=serpentEnemy(),s=serpentOf(e),a=s?.worldDevourPrototype;if(!a)return;const st=stage(a),poly=polygonPoints(a);
    if(st==='warn'){const q=smooth((a.age-WORLD.withdraw)/WORLD.warn);fillWorldPolygon(poly,'#ff3048',.07+.11*q,'#ff7184',.48+.30*q,4);strokeBoundary(a,'#ff9aaa',.58+.30*q,4);if(q>.22)drawSuction(a,clamp((q-.22)/.78,0,1));}
    else if(st==='bite'){const q=clamp((a.age-WORLD.warnEnd)/WORLD.bite,0,1);if(q<.16)fillWorldPolygon(poly,'#ff3048',.08*(1-q/.16),'#ff7184',.42*(1-q/.16),3);drawSuction(a,1-q*.35);drawGiantHead(a,q);}
    else if(st==='scar'){const q=clamp((a.age-WORLD.biteEnd)/WORLD.scar,0,1);fillWorldPolygon(poly,'#000107',.82*(1-.22*q),'#79b7ce',.56*(1-q*.32),4);strokeBoundary(a,'#bcefff',.34*(1-q*.62),7);drawScarCracks(a,.72*(1-q*.46));}
    else if(st==='recover'){const q=clamp((a.age-WORLD.scarEnd)/WORLD.recover,0,1);fillWorldPolygon(poly,'#000107',.46*(1-q),'#79b7ce',.24*(1-q),3);strokeBoundary(a,'#a9e4f4',.16*(1-q),5);drawScarCracks(a,.26*(1-q));}
  }

"""
if s.count(needle)!=1: raise SystemExit('drawGiantHead insertion point not found exactly once')
s=s.replace(needle,restore,1)
p.write_text(s)
# trigger restore
