(()=>{
  'use strict';

  const style=document.createElement('style');
  style.dataset.stackfallAchievementCardRollback='v2';
  style.textContent=`
    body #achievementScreen.achievement-screen{
      z-index:52!important;
      padding:18px!important;
      background:rgba(2,4,13,.82)!important;
      backdrop-filter:blur(14px)!important;
    }
    body #achievementScreen .achievement-modal{
      width:min(1040px,95vw)!important;
      max-height:92vh!important;
      display:grid!important;
      grid-template-rows:auto minmax(0,1fr)!important;
      padding:24px!important;
      border-radius:24px!important;
      overflow:hidden!important;
      background:linear-gradient(145deg,rgba(25,34,71,.76),rgba(6,10,25,.84)),radial-gradient(circle at 20% 0%,rgba(124,232,255,.08),transparent 36%)!important;
      border:1px solid rgba(164,185,255,.16)!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 34px rgba(90,110,255,.035),0 24px 70px rgba(0,0,0,.48)!important;
    }
    body #achievementScreen .achievement-heading{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) 210px 44px!important;
      gap:18px!important;
      align-items:center!important;
      padding:0 0 18px!important;
      border-bottom:1px solid rgba(255,255,255,.08)!important;
      background:none!important;
    }
    body #achievementScreen .achievement-heading>div:first-child>span{
      color:#8fffc8!important;
      font-size:9px!important;
      font-weight:900!important;
      letter-spacing:.20em!important;
    }
    body #achievementScreen .achievement-heading h2{
      margin:4px 0 0!important;
      font:38px/1 "Black Han Sans",sans-serif!important;
      letter-spacing:normal!important;
    }
    body #achievementScreen .achievement-heading p{
      max-width:none!important;
      margin:7px 0 0!important;
      color:#8c9abd!important;
      font-size:10px!important;
      line-height:normal!important;
    }
    body #achievementScreen .achievement-heading>button{
      width:44px!important;
      height:44px!important;
      border:1px solid rgba(255,255,255,.12)!important;
      border-radius:13px!important;
      background:rgba(7,11,29,.82)!important;
      color:#fff!important;
      font-size:25px!important;
      cursor:pointer!important;
    }
    body #achievementScreen .achievement-total{display:grid!important;gap:7px!important}
    body #achievementScreen .achievement-total>b{text-align:right!important;color:#dffdf2!important;font-size:12px!important;letter-spacing:normal!important}
    body #achievementScreen .achievement-total>i{height:6px!important;border-radius:99px!important;background:rgba(255,255,255,.07)!important;overflow:hidden!important}
    body #achievementScreen .achievement-total>i>span{display:block!important;height:100%!important;border-radius:inherit!important;background:linear-gradient(90deg,#74f2a7,#7ce8ff)!important;box-shadow:0 0 12px rgba(116,242,167,.28)!important}
    body #achievementScreen .achievement-body{
      min-height:0!important;
      overflow:auto!important;
      padding:18px 4px 4px!important;
      scrollbar-width:auto!important;
      scrollbar-color:auto!important;
    }
    body #achievementScreen .achievement-grid,
    body #achievementScreen .achievement-grid-single{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:8px!important;
    }
    body #achievementScreen .achievement-row{
      position:relative!important;
      display:grid!important;
      grid-template-columns:36px minmax(0,1fr) auto!important;
      gap:10px!important;
      align-items:center!important;
      min-height:88px!important;
      margin:0!important;
      padding:12px!important;
      border:1px solid rgba(255,255,255,.075)!important;
      border-radius:14px!important;
      background:rgba(5,9,24,.58)!important;
      opacity:.78!important;
    }
    body #achievementScreen .achievement-row:last-child{border-bottom:1px solid rgba(255,255,255,.075)!important}
    body #achievementScreen .achievement-row:before{content:none!important;display:none!important}
    body #achievementScreen .achievement-row:hover{background:rgba(5,9,24,.68)!important}
    body #achievementScreen .achievement-row.complete{
      border-color:rgba(116,242,167,.20)!important;
      background:linear-gradient(135deg,rgba(18,53,46,.42),rgba(6,11,27,.64))!important;
      opacity:1!important;
    }
    body #achievementScreen .achievement-reward-icon{
      display:grid!important;
      place-items:center!important;
      width:34px!important;
      height:34px!important;
      border:1px solid rgba(255,255,255,.10)!important;
      border-radius:10px!important;
      background:rgba(255,255,255,.04)!important;
      color:inherit!important;
      font-size:14px!important;
      transform:none!important;
    }
    body #achievementScreen .achievement-row.complete .achievement-reward-icon{
      border-color:rgba(116,242,167,.28)!important;
      color:#9affc5!important;
      background:rgba(116,242,167,.08)!important;
    }
    body #achievementScreen .achievement-copy{min-width:0!important}
    body #achievementScreen .achievement-copy>strong{
      display:block!important;
      margin-top:3px!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
      white-space:nowrap!important;
      color:#f1f7ff!important;
      font-size:12px!important;
      font-weight:800!important;
      letter-spacing:normal!important;
    }
    body #achievementScreen .achievement-copy>p{
      margin:5px 0 0!important;
      color:#9ba8c6!important;
      font-size:9px!important;
      line-height:normal!important;
    }
    body #achievementScreen .achievement-copy>small{
      display:block!important;
      margin-top:6px!important;
      color:#7385a9!important;
      font-size:8px!important;
      line-height:1.35!important;
    }
    body #achievementScreen .achievement-row.complete .achievement-copy>small{color:#83bfa1!important}
    body #achievementScreen .achievement-status{min-width:0!important;text-align:right!important}
    body #achievementScreen .achievement-status>b{display:block!important;color:#8795b5!important;font-size:8px!important;letter-spacing:normal!important}
    body #achievementScreen .achievement-status>small{
      display:block!important;
      min-width:0!important;
      margin-top:5px!important;
      padding:0!important;
      border:0!important;
      border-radius:0!important;
      background:none!important;
      color:#b6c3df!important;
      font-size:9px!important;
      font-weight:900!important;
    }
    body #achievementScreen .achievement-row.complete .achievement-status>b{color:#8fffc1!important}
    body #achievementScreen .achievement-row.complete .achievement-status>small{border:0!important;background:none!important;color:#b6c3df!important}
    @media(max-width:760px){
      body #achievementScreen .achievement-modal{width:min(1040px,95vw)!important;padding:16px!important}
      body #achievementScreen .achievement-heading{grid-template-columns:1fr 40px!important;gap:11px!important;padding:0 0 18px!important}
      body #achievementScreen .achievement-total{grid-column:1/-1!important;grid-row:2!important}
      body #achievementScreen .achievement-total>b{text-align:left!important}
      body #achievementScreen .achievement-heading>button{grid-column:2!important;grid-row:1!important;width:40px!important;height:40px!important}
      body #achievementScreen .achievement-body{padding:14px 4px 4px!important}
      body #achievementScreen .achievement-grid,
      body #achievementScreen .achievement-grid-single{grid-template-columns:1fr!important}
      body #achievementScreen .achievement-row{grid-template-columns:36px minmax(0,1fr) auto!important;gap:10px!important;min-height:80px!important;padding:12px!important}
      body #achievementScreen .achievement-reward-icon{width:34px!important;height:34px!important}
    }
  `;
  document.head.appendChild(style);
})();
