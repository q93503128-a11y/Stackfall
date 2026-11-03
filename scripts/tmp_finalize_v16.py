from pathlib import Path
import base64, hashlib, re, struct

EXPECTED_SHA='113ff9e75bfca3776588511334ea40d4a44f3d5ac98737a9f171e85da9094515'
chunks=[Path(f'assets/answer/.v16/chunk{i}.txt').read_text() for i in range(6)]
text=''.join(chunks).strip()
assert len(text)==41332, ('text_len',len(text))
data=base64.b64decode(text,validate=True)
assert len(data)==30998, ('byte_len',len(data))
assert hashlib.sha256(data).hexdigest()==EXPECTED_SHA, hashlib.sha256(data).hexdigest()
assert data[:4]==b'RIFF' and data[8:12]==b'WEBP'
assert struct.unpack('<I',data[4:8])[0]+8==len(data)
Path('assets/answer/answer_body_v16.b64').write_text(text)
print('APPROVED_BODY_OK',len(data),EXPECTED_SHA)

src=Path('src/void-apex-answer-v1.js')
s=src.read_text()
assert "STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v15'" in s
s=s.replace("STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v15'","STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v16'",1)
loader="""

  // V16 visual lock: approved near-black cosmic body and its current natural fissures are baked together.
  // Until phase-specific art is available, P1-P4 intentionally share this exact raster.
  const ANSWER_BODY_B64_URL='assets/answer/answer_body_v16.b64';
  const answerBodyImage=new Image();
  let answerBodyReady=false,answerBodyFailed=false;
  answerBodyImage.decoding='async';
  answerBodyImage.addEventListener('load',()=>{answerBodyReady=true;answerBodyFailed=false;syncDevStatus();});
  answerBodyImage.addEventListener('error',()=>{answerBodyReady=false;answerBodyFailed=true;syncDevStatus();console.error('[Stackfall] Answer body asset failed to decode',ANSWER_BODY_B64_URL);});
  (async()=>{try{const response=await fetch(ANSWER_BODY_B64_URL,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const b64=(await response.text()).trim();answerBodyImage.src=`data:image/webp;base64,${b64}`;}catch(error){answerBodyReady=false;answerBodyFailed=true;syncDevStatus();console.error('[Stackfall] Answer body payload failed to load',error);}})();
"""
s,n=re.subn(r"\n\s*// V14 visual lock:.*?answerBodyImage\.src=ANSWER_BODY_SRC;\n",loader,s,count=1,flags=re.S)
assert n==1, 'legacy body loader not found'
s,n=re.subn(r"\n\s*const FISSURES=\[.*?\n\s*const PHASE_CRACK_COUNT=\[3,6,9,13\];\n","\n",s,count=1,flags=re.S)
assert n==1, 'legacy fissure data not found'
s,n=re.subn(r"\n\s*function strokeScreenFissure\(.*?\n\s*function drawAnswerBoss\(\)","\n  function drawAnswerBoss()",s,count=1,flags=re.S)
assert n==1, 'legacy fissure renderer not found'
old="const ratio=888/263,w=Math.max(width*1.14,height*2.05),h=w/ratio;"
assert old in s
s=s.replace(old,"const ratio=960/280,w=Math.max(width*1.14,height*2.05),h=w/ratio;",1)
olddraw="ctx.save();ctx.globalAlpha=.94;ctx.globalCompositeOperation='source-over';ctx.filter='brightness(.56) saturate(.62) contrast(1.04)';ctx.shadowColor='rgba(188,204,255,.09)';ctx.shadowBlur=10;ctx.drawImage(answerBodyImage,37,67,888,263,frame.x,frame.y,frame.w,frame.h);ctx.restore();"
assert olddraw in s
s=s.replace(olddraw,"ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.shadowColor='rgba(188,204,255,.08)';ctx.shadowBlur=8;ctx.drawImage(answerBodyImage,0,0,960,280,frame.x,frame.y,frame.w,frame.h);ctx.restore();",1)
assert 'drawAnswerFissures(frame,phase);' in s
s=s.replace('    drawAnswerFissures(frame,phase);\n','',1)
s=s.replace('asset:{src:ANSWER_BODY_SRC,ready:answerBodyReady,failed:answerBodyFailed,','asset:{src:ANSWER_BODY_B64_URL,ready:answerBodyReady,failed:answerBodyFailed,')
s=s.replace("visualRevision:'v10'","visualRevision:'v16'")
assert 'ANSWER_BODY_SRC' not in s
assert 'const FISSURES=' not in s
assert 'drawAnswerFissures' not in s
assert 'strokeScreenFissure' not in s
src.write_text(s)

contract=Path('scripts/void-apex-answer-contract.mjs')
c=contract.read_text()
c,n=re.subn(r"const bodyDataMatch=.*?const parsesAsJavaScript=", "const bodyAssetText=read('assets/answer/answer_body_v16.b64').trim();\nconst bodyAssetBytes=Buffer.from(bodyAssetText,'base64');\nconst bodyAssetHash=createHash('sha256').update(bodyAssetBytes).digest('hex');\nconst bodyAssetExact=bodyAssetText.length===41332\n  &&bodyAssetBytes.length===30998\n  &&bodyAssetHash==='113ff9e75bfca3776588511334ea40d4a44f3d5ac98737a9f171e85da9094515'\n  &&bodyAssetBytes.subarray(0,4).toString('ascii')==='RIFF'\n  &&bodyAssetBytes.subarray(8,12).toString('ascii')==='WEBP'\n  &&bodyAssetBytes.readUInt32LE(4)+8===bodyAssetBytes.length;\nconst parsesAsJavaScript=",c,count=1,flags=re.S)
assert n==1
c,n=re.subn(r"\['Answer V15 preserves the approved q55 raster while integrating it into the game palette'.*?\],", "['Answer V16 uses only the approved baked dark-cosmic raster',answer.includes(\"STACKFALL_VOID_APEX_ANSWER_VISUAL_REVISION='v16'\")&&answer.includes(\"const ANSWER_BODY_B64_URL='assets/answer/answer_body_v16.b64'\")&&answer.includes('ctx.drawImage(answerBodyImage,0,0,960,280,frame.x,frame.y,frame.w,frame.h)')&&!answer.includes('ANSWER_BODY_SRC')],",c,count=1)
assert n==1
c=c.replace("['embedded q55 raster bytes are exact and container-complete',bodyAssetExact],","['approved V16 raster payload is exact and container-complete',bodyAssetExact],")
c,n=re.subn(r"\['body framing keeps the upper and side extent unknown while reserving more player space'.*?\],", "['body framing keeps the upper and side extent unknown while reserving player space',answer.includes('const ratio=960/280')&&answer.includes('visibleDepth=Math.max(245,Math.min(330,height*.34))')&&answer.includes('y:visibleDepth-h')],",c,count=1)
assert n==1
c,n=re.subn(r"\['body is phase-invariant and only screen-space fissures escalate across P1-P4'.*?\],", "['temporary P1-P4 share one baked body with no legacy procedural fissures',!answer.includes('const FISSURES=')&&!answer.includes('drawAnswerFissures')&&!answer.includes('strokeScreenFissure')],",c,count=1)
assert n==1
contract.write_text(c)

fp=Path('scripts/build-fingerprint.mjs')
f=fp.read_text()
if "'assets/answer/answer_body_v16.b64'" not in f:
    f=f.replace("'src/void-apex-answer-v1.js',","'src/void-apex-answer-v1.js',\n  'assets/answer/answer_body_v16.b64',",1)
fp.write_text(f)
print('PATCH_READY')
