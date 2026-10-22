from pathlib import Path

# 1) Bring world events closer and keep guidance arrows comfortably inside the landscape viewport.
p=Path('src/map-event-expansion.js')
s=p.read_text(encoding='utf-8')
old="if(state.mapEventActive||state.entities.mapEvents.length)return false;const a=Math.random()*TAU,d=rand(720,930),m=meta(type),authored=options.authored===true,life=authored?150:LIMITS.marker;"
new="if(state.mapEventActive||state.entities.mapEvents.length)return false;const a=Math.random()*TAU,d=rand(520,700),m=meta(type),authored=options.authored===true,life=authored?150:LIMITS.marker;"
if old not in s: raise SystemExit('event spawn distance anchor missing')
s=s.replace(old,new,1)
old="function edgePoint(dx,dy){const cx=vw/2,cy=vh/2,left=72,right=vw-72,top=78,bottom=vh-(compact()?178:150);let scale=Infinity;"
new="function eventGuideFrame(){const landscape=vw>=vh;if(landscape){const side=clamp(vw*.085,82,108),top=clamp(vh*.18,64,90),bottomGap=clamp(vh*.29,108,156);return{left:side,right:vw-side,top,bottom:vh-bottomGap};}const side=82,top=82,bottomGap=compact()?190:160;return{left:side,right:vw-side,top,bottom:vh-bottomGap};}\n  function edgePoint(dx,dy){const cx=vw/2,cy=vh/2,{left,right,top,bottom}=eventGuideFrame();let scale=Infinity;"
if old not in s: raise SystemExit('event edge anchor missing')
s=s.replace(old,new,1)
old="const p=worldToScreen(marker.x,marker.y),m=meta(marker.type),on=p.x>72&&p.x<vw-72&&p.y>78&&p.y<vh-(compact()?178:150);"
new="const p=worldToScreen(marker.x,marker.y),m=meta(marker.type),frame=eventGuideFrame(),on=p.x>frame.left&&p.x<frame.right&&p.y>frame.top&&p.y<frame.bottom;"
if old not in s: raise SystemExit('event onscreen bounds anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# 2) Treat touch portrait as unsupported and keep touch landscape close to desktop proportions.
p=Path('styles.css')
s=p.read_text(encoding='utf-8')
needle='@media(pointer:coarse),(max-width:760px)'
count=s.count(needle)
if count < 2: raise SystemExit(f'expected at least 2 coarse mobile media blocks, found {count}')
s=s.replace(needle,'@media (pointer:coarse) and (orientation:portrait), (max-width:760px) and (orientation:portrait)')
append=r'''

/* Pass 15: mobile uses the desktop composition in landscape. Portrait is rotation-only. */
@media (pointer:coarse) and (orientation:portrait){
  #app::after{
    content:"가로 화면으로 돌려주세요\A STACKFALL 모바일 플레이는 가로 화면에 맞춰져 있습니다.";
    white-space:pre-line;
    position:absolute;
    inset:0;
    z-index:220;
    display:grid;
    place-items:center;
    padding:32px;
    text-align:center;
    color:#f5f8ff;
    font-size:15px;
    font-weight:800;
    line-height:1.8;
    letter-spacing:.02em;
    background:radial-gradient(circle at 50% 42%,rgba(70,83,166,.28),rgba(3,6,16,.985) 64%);
    border:1px solid rgba(124,232,255,.12);
    pointer-events:auto;
  }
}
@media (pointer:coarse) and (orientation:landscape){
  #menu{justify-content:center;overflow:hidden;padding:clamp(14px,2.5vw,28px);gap:clamp(12px,2.8vh,24px)}
  #menu .brand-wrap{width:auto;max-width:min(86vw,960px);flex:0 0 auto}
  #title{font-size:clamp(54px,10.2vw,104px);line-height:.80;white-space:nowrap}
  #menu .hub-panel{width:min(1040px,92vw);padding:14px;gap:10px}
  #menu #startBtn{min-height:210px;padding:24px 28px}
  #menu #startBtn strong{font-size:clamp(40px,5vw,58px)}
  #menu #upgradeHubBtn,#menu #achievementHubBtn,#menu #stageMapBtn{min-height:96px;padding:16px 18px}
  .touch-controls:not(.hidden){display:block}
  .joystick{left:max(16px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom));width:96px;height:96px;background:rgba(10,14,26,.25)}
  .joystick:before{inset:23px}
  #stick{width:44px;height:44px}
  .passive-list{display:none!important}
  .weapon-slots{bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%) scale(.78);transform-origin:bottom center}
  .top-left{top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));width:min(300px,35vw);transform:scale(.86);transform-origin:top left}
  .top-center{top:max(8px,env(safe-area-inset-top));transform:translateX(-50%) scale(.86);transform-origin:top center}
  .icon-btn{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));width:38px;height:38px}
  .combo-box{top:62px;right:12px;transform:scale(.82);transform-origin:top right}
  .boss-bar{top:64px;width:min(470px,55vw);transform:translateX(-50%) scale(.88);transform-origin:top center}
  .choice-cards{width:min(980px,94vw);grid-template-columns:repeat(3,1fr);max-height:none;overflow:visible;padding:0}
  .choice-card{min-height:196px;padding:15px}
  .choice-card .choice-body{display:grid;grid-template-columns:58px minmax(0,1fr);gap:11px;margin-top:16px}
  .choice-card .big-icon{position:static;width:58px;height:58px;margin:0;font-size:29px}
  .choice-card .choice-meta{max-width:calc(100% - 118px);margin-left:20px}
  .choice-card h3{margin-top:0;font-size:18px}
  .choice-card p{font-size:10px;line-height:1.45}
  .choice-head{margin-bottom:12px}.choice-head h2{font-size:30px}
}
'''
if 'Pass 15: mobile uses the desktop composition in landscape' in s: raise SystemExit('pass 15 css already present')
s+=append
p.write_text(s,encoding='utf-8')

# 3) Regression contract: ensure mobile policy and event guidance don't drift back.
p=Path('scripts/community-feedback-contract.mjs')
s=p.read_text(encoding='utf-8')
anchor="expect('live visual QA keeps mobile branding modal priority and ability access readable'"
pos=s.find(anchor)
if pos<0: raise SystemExit('community visual QA contract anchor missing')
line_end=s.find('\n',pos)
check="expect('mobile landscape keeps desktop composition and nearby event guidance',styles.includes('Pass 15: mobile uses the desktop composition in landscape')&&styles.includes('(pointer:coarse) and (orientation:landscape)')&&styles.includes('가로 화면으로 돌려주세요')&&read('src/map-event-expansion.js').includes('d=rand(520,700)')&&read('src/map-event-expansion.js').includes('function eventGuideFrame()')&&read('src/map-event-expansion.js').includes('frame=eventGuideFrame()'));\n"
s=s[:line_end+1]+check+s[line_end+1:]
p.write_text(s,encoding='utf-8')
