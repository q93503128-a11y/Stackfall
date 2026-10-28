from pathlib import Path

# Prototype: expose angle-form idle offset so entry and combat share one exact path contract.
p=Path('src/atropos-world-devourer-prototype.js');s=p.read_text();old=s
start=s.index('  function idleOffset(serpent,t=serpent.motionTime){')
end=s.index('\n  window.stackfallAtroposIdleOffset=idleOffset;', start)
block='''  function idleOffsetAtAngle(a){
    const rx=clamp(vw*.54,760,900),ry=clamp(vh*.30,280,360),wave=Math.sin(a*2.18+.55)*46;
    return{
      x:80+Math.cos(a)*rx-Math.sin(a)*wave,
      y:-80+Math.sin(a)*ry+Math.cos(a)*wave*.62,
      orbitA:a
    };
  }
  function idleOffset(serpent,t=serpent.motionTime){
    const phase=Number(serpent.phaseBase)||0,a=(Number(t)||0)*.11+phase;
    return idleOffsetAtAngle(a);
  }'''
s=s[:start]+block+s[end:]
s=s.replace('  window.stackfallAtroposIdleOffset=idleOffset;', "  window.stackfallAtroposIdleOffset=idleOffset;\n  window.stackfallAtroposIdleOffsetAtAngle=idleOffsetAtAngle;\n  window.stackfallAtroposIdleAngularSpeed=.11;",1)
# Dedicated tail raster looked like a detached wing in bends; continuous taper is the tail.
s=s.replace("    if(tail&&layer==='mid')drawSprite('tail',tail,175*tail.scaleUnit,76*tail.scaleUnit,.82*manifest,.008,false,1,1);\n",'')
s=s.replace("renderMode:'canvas-textured-continuous-v7'", "renderMode:'canvas-textured-entrysync-v8'")
assert s!=old and 'stackfallAtroposIdleOffsetAtAngle' in s
p.write_text(s)

# Entry: remove its private old orbit model and land on the exact new idle path.
p=Path('src/atropos-world-devourer-entry.js');s=p.read_text();old=s
start=s.index('  function orbitOffsetAt(a){')
end=s.index('\n  function loopPoint', start)
block='''  function orbitOffsetAt(a){
    if(typeof window.stackfallAtroposIdleOffsetAtAngle==='function')return window.stackfallAtroposIdleOffsetAtAngle(a);
    return{x:Math.cos(a)*760,y:Math.sin(a)*300,orbitA:a};
  }
  const idleAngularSpeed=()=>Number(window.stackfallAtroposIdleAngularSpeed)||.11;'''
s=s[:start]+block+s[end:]
# Finish entry at an on-screen point on the canonical idle loop. Add TAU to keep orbitA progression forward.
s=s.replace("    const t=smooth((q-.86)/.14),a0=start+TAU,a1=a0+.62,p0=loopPoint(a0),off=orbitOffsetAt(a1),p2={x:ENTRY.centerX+off.x,y:ENTRY.centerY+off.y};",
            "    const t=smooth((q-.86)/.14),a0=start+TAU,a1=1.62+TAU,p0=loopPoint(a0),off=orbitOffsetAt(a1),p2={x:ENTRY.centerX+off.x,y:ENTRY.centerY+off.y};")
s=s.replace("s.motionTime=(pose.a-(Number(s.phaseBase)||0))/.165;", "s.motionTime=(pose.a-(Number(s.phaseBase)||0))/idleAngularSpeed();")
# replace second occurrence too
s=s.replace("s.motionTime=(pose.a-phase)/.165;", "s.motionTime=(pose.a-phase)/idleAngularSpeed();")
assert s!=old and s.count('/.165')==0
p.write_text(s)
