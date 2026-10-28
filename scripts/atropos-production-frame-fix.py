from pathlib import Path
p=Path('src/atropos-world-devourer-prototype.js')
s=p.read_text()
old="""  const ART_FRAMES={
    headClosed:{x:16,y:16,w:408,h:300},
    headOpen:{x:440,y:16,w:375,h:315},
    neckA:{x:831,y:16,w:339,h:270},
    neckB:{x:1186,y:16,w:339,h:276},
    bodyA:{x:1541,y:16,w:402,h:291},
    bodyB:{x:16,y:347,w:363,h:285},
    bodyC:{x:395,y:347,w:372,h:297},
    bodyD:{x:783,y:347,w:393,h:273},
    rear:{x:1192,y:347,w:390,h:234},
    tail:{x:16,y:660,w:531,h:318}
  };"""
new="""  const ART_FRAMES={
    headClosed:{x:7,y:7,w:204,h:152},
    headOpen:{x:219,y:9,w:189,h:157},
    neckA:{x:415,y:9,w:170,h:135},
    neckB:{x:592,y:9,w:168,h:136},
    bodyA:{x:770,y:10,w:199,h:142},
    bodyB:{x:7,y:175,w:182,h:139},
    bodyC:{x:197,y:175,w:187,h:146},
    bodyD:{x:391,y:174,w:198,h:135},
    rear:{x:595,y:175,w:195,h:115},
    tail:{x:7,y:329,w:265,h:159}
  };"""
if s.count(old)!=1: raise SystemExit('ART_FRAMES block not found exactly once')
s=s.replace(old,new,1)
s=s.replace('final-art vector plates','production raster plates',1)
s=s.replace('these assets are the first final-art pass.','these assets are the approved production raster pass.',1)
p.write_text(s)
