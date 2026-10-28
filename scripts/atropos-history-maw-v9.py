from pathlib import Path

# Prototype fixes: less enclosing idle path, canonical history reseed, head edge feather.
p=Path('src/atropos-world-devourer-prototype.js');s=p.read_text();old=s
s=s.replace("    const rx=clamp(vw*.54,760,900),ry=clamp(vh*.30,280,360),wave=Math.sin(a*2.18+.55)*46;",
            "    const rx=clamp(vw*.54,760,900),ry=clamp(vh*.22,190,260),wave=Math.sin(a*2.18+.55)*42;")
s=s.replace("      y:-80+Math.sin(a)*ry+Math.cos(a)*wave*.62,", "      y:-120+Math.sin(a)*ry+Math.cos(a)*wave*.56,")

# Feather the crop edge of processed head frames to eliminate rectangular raster borders in extreme rotations.
needle="""        const q=18;d[i]=clamp(Math.round(r/q)*q,0,255);d[i+1]=clamp(Math.round(gc/q)*q,0,255);d[i+2]=clamp(Math.round(b/q)*q,0,255);"""
repl="""        const q=18,n=i>>2,x=n%f.w,y=Math.floor(n/f.w),edge=Math.min(x,y,f.w-1-x,f.h-1-y),edgeFade=smooth(clamp(edge/8,0,1));\n        d[i]=clamp(Math.round(r/q)*q,0,255);d[i+1]=clamp(Math.round(gc/q)*q,0,255);d[i+2]=clamp(Math.round(b/q)*q,0,255);d[i+3]=Math.round(d[i+3]*edgeFade);"""
assert needle in s
s=s.replace(needle,repl,1)

# Expose canonical reseed. This discards the entrance wrap history without moving the head.
marker='  function ensureSerpent(e){'
insert='''  function reseedIdleHistory(serpent,anchorX=serpent.anchorX,anchorY=serpent.anchorY){
    if(!serpent)return false;serpent.anchorX=anchorX;serpent.anchorY=anchorY;const now=Number(serpent.motionTime)||0,history=[];
    for(let i=HISTORY_LIMIT-1;i>=0;i--){const o=idleOffset(serpent,now-i*.024);history.push({x:anchorX+o.x,y:anchorY+o.y,orbitA:o.orbitA});}
    serpent.history=history;serpent.last=history[history.length-1];serpent.liveHead=serpent.last;serpent.lastReal=performance.now()*.001;return true;
  }
  window.stackfallAtroposReseedIdleHistory=reseedIdleHistory;

'''
if 'function reseedIdleHistory(' not in s:s=s.replace(marker,insert+marker,1)
s=s.replace("renderMode:'canvas-textured-entrysync-v8'", "renderMode:'canvas-textured-historysync-v9'")
assert s!=old and 'stackfallAtroposReseedIdleHistory' in s
p.write_text(s)

# Entry: reseed body history on completion, preserving the final canonical head position.
p=Path('src/atropos-world-devourer-entry.js');s=p.read_text();old=s
needle="""onComplete:()=>{consumeRemainder();const e=serpentEnemy(),s=serpentOf(e);if(s){s.entryActive=false;s.entryGrace=.55;s.anchorX=ENTRY.centerX;s.anchorY=ENTRY.centerY;s.lastReal=performance.now()*.001;}state.pendingApexForm=null;"""
repl="""onComplete:()=>{consumeRemainder();const e=serpentEnemy(),s=serpentOf(e);if(s){s.entryActive=false;s.entryGrace=.55;s.anchorX=ENTRY.centerX;s.anchorY=ENTRY.centerY;if(typeof window.stackfallAtroposReseedIdleHistory==='function')window.stackfallAtroposReseedIdleHistory(s,ENTRY.centerX,ENTRY.centerY);else s.lastReal=performance.now()*.001;}state.pendingApexForm=null;"""
assert needle in s
s=s.replace(needle,repl,1)
p.write_text(s)

# Maw: compute extension from the target distance so the head cannot overshoot the locked target.
p=Path('src/atropos-world-devourer-attack-maw.js');s=p.read_text();old=s
start=s.index('  function frontPose(a){')
end=s.index('\n  function rebuildFrontHistory',start)
block='''  function frontPose(a){
    let bend=0,approach=0;const n=a.age;
    if(n<MAW.aim){const q=smooth(n/MAW.aim);bend=.85*q;approach=0;}
    else if(n<MAW.warnEnd){bend=.85;approach=0;}
    else if(n<MAW.suctionEnd){const q=(n-MAW.warnEnd)/MAW.suction;bend=.90;approach=.46*smooth(q);}
    else if(n<MAW.biteEnd){const q=(n-MAW.suctionEnd)/MAW.bite;bend=.92;approach=lerp(.46,.98,ease(q));}
    else{const q=smooth((n-MAW.biteEnd)/MAW.recover);bend=.92*(1-q);approach=.98*(1-q);}
    const headBase=a.base[0],turnHead=a.delta*bend,hdx=headBase.x-a.pivot.x,hdy=headBase.y-a.pivot.y,hc=Math.cos(turnHead),hs=Math.sin(turnHead),rotHead={x:a.pivot.x+hdx*hc-hdy*hs,y:a.pivot.y+hdx*hs+hdy*hc},dirX=Math.cos(a.targetAngle),dirY=Math.sin(a.targetAngle);
    const needed=clamp((a.targetX-rotHead.x)*dirX+(a.targetY-rotHead.y)*dirY,0,250),extend=needed*approach;
    const out=a.base.map(p=>({...p}));
    for(let i=0;i<a.pivotIndex;i++){
      const w=(a.pivotIndex-i)/a.pivotIndex,turn=a.delta*bend*(.45+.55*w),dx=a.base[i].x-a.pivot.x,dy=a.base[i].y-a.pivot.y,c=Math.cos(turn),ss=Math.sin(turn);
      out[i].x=a.pivot.x+dx*c-dy*ss+dirX*extend*w;
      out[i].y=a.pivot.y+dx*ss+dy*c+dirY*extend*w;
    }
    return out;
  }'''
s=s[:start]+block+s[end:]
assert s!=old and 'needed=clamp' in s
p.write_text(s)
