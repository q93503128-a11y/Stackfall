// Stage 1 / 폐쇄선 production art.
// Runtime ids retain the old "warden-*" compatibility keys until the Stage 1
// combat migration is complete, but every surface below belongs to the reboot.
const STAGE1_ART_KEYS=['warden-chest','warden-clamp','warden-salvage','warden-core','bulkhead','girder','deck','gate'];

function stageOneSvg(key){
  const defs=`<defs>
    <linearGradient id="steel" x1="0" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#77838a"/><stop offset=".18" stop-color="#3a474e"/><stop offset=".55" stop-color="#202a31"/><stop offset=".82" stop-color="#10181e"/><stop offset="1" stop-color="#080e13"/></linearGradient>
    <linearGradient id="steel2" x1="0" y1="0" x2="1" y2=".2"><stop offset="0" stop-color="#151e24"/><stop offset=".28" stop-color="#4e5a60"/><stop offset=".52" stop-color="#1e282e"/><stop offset="1" stop-color="#090f14"/></linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aab1ad"/><stop offset=".18" stop-color="#5d686a"/><stop offset="1" stop-color="#151b1e"/></linearGradient>
    <linearGradient id="paint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b56b2d"/><stop offset=".35" stop-color="#744221"/><stop offset=".7" stop-color="#3c291d"/><stop offset="1" stop-color="#1a1915"/></linearGradient>
    <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#31565c"/><stop offset=".45" stop-color="#bcebf1"/><stop offset=".62" stop-color="#5db5bd"/><stop offset="1" stop-color="#17383c"/></linearGradient>
    <radialGradient id="core"><stop offset="0" stop-color="#efffff"/><stop offset=".18" stop-color="#9de8e9"/><stop offset=".52" stop-color="#347d82"/><stop offset=".78" stop-color="#14373c"/><stop offset="1" stop-color="#071316"/></radialGradient>
    <pattern id="rib" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#172127"/><rect width="9" height="28" fill="#232e34"/><rect x="10" width="2" height="28" fill="#0a1014"/></pattern>
    <pattern id="hazard" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><rect width="17" height="34" fill="#b66d2c"/><rect x="17" width="17" height="34" fill="#161719"/></pattern>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".72"/></filter>
    <filter id="grit" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence baseFrequency=".7" numOctaves="2" seed="17" result="n"/><feColorMatrix in="n" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .22 0" result="noise"/><feBlend in="SourceGraphic" in2="noise" mode="multiply"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>`;
  const bolts=(xs,ys)=>xs.map(x=>ys.map(y=>`<circle cx="${x}" cy="${y}" r="3.6" fill="#a2aaa8"/><circle cx="${x+1}" cy="${y+1}" r="1.4" fill="#293236"/>`).join('')).join('');
  const shell=(body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 256" preserveAspectRatio="none">${defs}${body}</svg>`;
  if(key==='deck')return shell(`
    <g filter="url(#shadow)"><rect x="4" y="30" width="504" height="196" rx="13" fill="#070d11"/>
    <rect x="12" y="38" width="488" height="180" rx="9" fill="url(#steel)"/>
    <rect x="26" y="54" width="460" height="148" rx="4" fill="url(#rib)" opacity=".82"/>
    <rect x="26" y="91" width="460" height="74" fill="#111b20"/>
    <rect x="26" y="98" width="460" height="4" fill="#7a8583" opacity=".55"/><rect x="26" y="154" width="460" height="3" fill="#05090b"/>
    <path d="M42 128H470" stroke="#d48b3d" stroke-width="5" stroke-dasharray="54 24" opacity=".72"/>
    <rect x="26" y="54" width="42" height="148" fill="url(#hazard)" opacity=".42"/><rect x="444" y="54" width="42" height="148" fill="url(#hazard)" opacity=".32"/>
    <path d="M92 64H421M91 190H422" stroke="#aeb5b2" stroke-width="2" opacity=".22"/>
    <g fill="#0a1014">${[118,170,222,274,326,378].map(x=>`<rect x="${x}" y="61" width="23" height="14" rx="2"/><rect x="${x}" y="181" width="23" height="14" rx="2"/>`).join('')}</g>
    ${bolts([78,434],[60,196])}</g>`);
  if(key==='girder')return shell(`
    <g filter="url(#shadow)"><path d="M8 94L504 48V164L8 210Z" fill="#090f13"/>
    <path d="M14 98L498 56V154L14 202Z" fill="url(#steel2)"/>
    <path d="M24 112L486 72M24 187L486 137" stroke="url(#edge)" stroke-width="13"/>
    ${[55,125,195,265,335,405,475].map((x,i)=>`<path d="M${x} ${i%2?106:178}L${x+42} ${i%2?172:92}" stroke="#303b40" stroke-width="12"/><circle cx="${x+21}" cy="135" r="5" fill="#8d9693"/>`).join('')}
    <path d="M18 101L492 60" stroke="#c5cbc7" stroke-width="2" opacity=".3"/></g>`);
  if(key==='bulkhead')return shell(`
    <g filter="url(#shadow)"><path d="M20 24H466L500 58V211L466 236H20L6 218V42Z" fill="#070b0e"/>
    <path d="M28 34H455L488 64V201L455 225H28L17 211V48Z" fill="url(#steel)"/>
    <path d="M60 52H193L218 76V185L190 208H60Z" fill="#121b20"/><path d="M452 52H319L294 76V185L322 208H452Z" fill="#11191e"/>
    <path d="M215 43H297V217H215Z" fill="url(#rib)"/><rect x="229" y="52" width="54" height="156" fill="#0b1115"/>
    <rect x="40" y="39" width="38" height="181" fill="url(#hazard)" opacity=".78"/><rect x="434" y="39" width="38" height="181" fill="url(#hazard)" opacity=".48"/>
    <path d="M82 72H185M82 188H185M327 72H430M327 188H430" stroke="#85908f" stroke-width="3" opacity=".45"/>
    <g fill="#8cc9c8">${[90,121,152].map(x=>`<rect x="${x}" y="82" width="18" height="5" rx="2"/>`).join('')}</g>
    ${bolts([34,205,307,478],[50,205])}</g>`);
  if(key==='gate')return shell(`
    <g filter="url(#shadow)"><path d="M8 232V37L52 13H151L181 43H331L363 13H462L504 37V232H414V84H98V232Z" fill="#05090c"/>
    <path d="M18 228V43L58 24H144L171 55H341L370 24H455L494 43V228H430V75H82V228Z" fill="url(#steel)"/>
    <path d="M82 75H430V106H82Z" fill="#10181d"/><rect x="102" y="82" width="308" height="10" fill="url(#hazard)" opacity=".62"/>
    <path d="M101 108V228H146V108M366 108V228H411V108" fill="url(#steel2)"/>
    <path d="M147 108H365V228H147Z" fill="#02070a"/>
    <path d="M159 120H353" stroke="#123035" stroke-width="7" opacity=".68"/>
    <g fill="#80cbd0"><rect x="46" y="54" width="12" height="24" rx="4"/><rect x="454" y="54" width="12" height="24" rx="4"/></g>
    <g fill="#be6b31">${[122,178,334,390].map(x=>`<rect x="${x}" y="35" width="24" height="7" rx="2"/>`).join('')}</g>
    ${bolts([36,76,436,476],[64,202])}</g>`);
  if(key==='warden-chest')return shell(`
    <g filter="url(#shadow)"><path d="M30 102L82 43L187 20L378 31L475 86L495 154L446 210L298 235L121 219L43 177Z" fill="#070b0e"/>
    <path d="M42 105L89 54L191 31L370 42L461 92L480 151L436 198L296 221L129 207L56 169Z" fill="url(#steel)"/>
    <path d="M78 116L126 75L214 57L376 66L437 105L450 151L413 176L291 194L151 183L93 156Z" fill="#111a1f"/>
    <path d="M112 101L191 75L322 80L391 105L375 151L297 168L183 158L125 142Z" fill="url(#steel2)"/>
    <path d="M188 83L315 88L341 113L322 153L211 153L171 132Z" fill="#080f13"/>
    <rect x="219" y="94" width="84" height="48" rx="5" fill="url(#rib)"/><path d="M247 91V145" stroke="#97a6a2" stroke-width="3" opacity=".35"/>
    <path d="M65 132L93 111V171L61 158Z" fill="url(#paint)"/><path d="M415 99L462 119V154L415 177Z" fill="#2c3436"/>
    <path d="M120 177L395 187" stroke="#05080a" stroke-width="10"/><path d="M136 180L371 189" stroke="#8e9691" stroke-width="2" opacity=".22"/>
    ${bolts([96,145,351,416],[92,174])}</g>`);
  if(key==='warden-clamp')return shell(`
    <g filter="url(#shadow)"><path d="M96 12H349L478 74L501 129L451 171L369 171L304 237H81L23 194L13 112Z" fill="#070b0d"/>
    <path d="M104 25H340L463 82L484 123L441 157H357L294 221H89L39 186L28 114Z" fill="url(#steel)"/>
    <path d="M65 96H279L333 127L276 153H57L42 126Z" fill="#11191d"/><path d="M75 106H265L294 126L263 142H72Z" fill="url(#rib)"/>
    <path d="M306 51H401L454 85L421 110H327L285 84Z" fill="url(#paint)"/>
    <path d="M325 171L281 217H165L201 174Z" fill="#070c10"/>
    <rect x="107" y="52" width="118" height="18" rx="8" fill="#0b1013"/><rect x="119" y="57" width="92" height="8" rx="4" fill="url(#cyan)"/>
    <circle cx="353" cy="86" r="20" fill="#0b1114"/><circle cx="353" cy="86" r="12" fill="#7a8583"/>
    ${bolts([52,94,423,466],[111,146])}</g>`);
  if(key==='warden-salvage')return shell(`
    <g filter="url(#shadow)"><path d="M53 28H377L474 74L497 150L441 218H110L26 170L16 83Z" fill="#060a0d"/>
    <path d="M65 40H365L459 84L481 145L431 203H116L42 163L31 91Z" fill="url(#steel2)"/>
    <circle cx="260" cy="123" r="77" fill="#080e12"/><circle cx="260" cy="123" r="62" fill="#263138"/><circle cx="260" cy="123" r="48" fill="url(#steel)"/>
    <circle cx="260" cy="123" r="30" fill="#0a1013"/><circle cx="260" cy="123" r="12" fill="#9aa39f"/>
    <path d="M260 59V187M196 123H324" stroke="#0a1013" stroke-width="9" opacity=".8"/>
    <path d="M344 84H432L460 105V146L425 165H344Z" fill="url(#paint)"/>
    <path d="M74 75H157V166H74Z" fill="url(#rib)"/><path d="M96 61V181" stroke="#a6b0ac" stroke-width="3" opacity=".28"/>
    <path d="M260 123C351 122 382 171 456 184" fill="none" stroke="#070b0d" stroke-width="11"/><path d="M260 123C351 122 382 171 456 184" fill="none" stroke="#7b8480" stroke-width="3"/>
    ${bolts([51,82,431,463],[75,179])}</g>`);
  if(key==='warden-core')return shell(`
    <g filter="url(#shadow)"><path d="M75 26H386L474 86V183L402 232H99L32 174V79Z" fill="#050a0d"/>
    <path d="M87 41H374L458 94V173L393 216H108L49 164V88Z" fill="url(#steel)"/>
    <path d="M128 64H342L409 103V160L351 196H139L91 155V104Z" fill="#091215"/>
    <ellipse cx="253" cy="129" rx="111" ry="73" fill="url(#core)" opacity=".94"/>
    <ellipse cx="253" cy="129" rx="72" ry="47" fill="#0a2226"/><ellipse cx="253" cy="129" rx="42" ry="28" fill="#b7f1ef"/>
    <path d="M119 75L151 105M387 83L351 109M121 185L153 158M388 178L351 151" stroke="#869491" stroke-width="14"/>
    <rect x="100" y="112" width="31" height="34" fill="url(#hazard)" opacity=".7"/><rect x="377" y="112" width="31" height="34" fill="url(#hazard)" opacity=".45"/>
    ${bolts([83,426],[86,178])}</g>`);
  return shell(`<rect width="512" height="256" fill="#222"/>`);
}
const FRONTIER_ART=Object.freeze(Object.fromEntries(STAGE1_ART_KEYS.map(key=>{
  const image=new Image();
  image.decoding='async';
  image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(stageOneSvg(key));
  return[key,image];
})));

function frontierSprite(key,x,y,w,h,g=ctx){
  const image=FRONTIER_ART[key];
  if(!image?.complete||!image.naturalWidth)return false;
  g.drawImage(image,x,y,w,h);
  return true;
}
function frontierEase(t){t=clamp(t,0,1);return t*t*(3-2*t);}
function frontierKick(age,start,amount){const t=age-start;return t<0?0:amount*Math.sin(t*18)*Math.exp(-t*5.3);}

function stageOneArtPose(e){
  const now=state.time||0,age=Math.max(0,now-(e.stageActionAt??-10));
  const open=e.stageGateCoreOpen?frontierEase((now-(e.stageGateOpenedAt??-10))/.82):0;
  // Compatibility geometry, redesigned as a low rail-bound enforcement machine:
  // carriage, left clamp, right winch, exposed power unit.
  const parts=[
    [0,-18-open*14,94,46,-.015],
    [-106-open*24,31,32,58,-.13-open*.04],
    [101+open*22,22,31,51,.11+open*.05],
    [12,31+open*9,25,31,.02]
  ];
  const wind=frontierEase(age/.78),release=1-frontierEase((age-1.55)/.92);
  if(e.stageAction==='salvage'){
    const q=wind*release;
    parts[2][0]-=9*q;parts[2][1]-=35*q;parts[2][4]+=.34*q;
    parts[1][1]+=13*q;parts[1][4]-=.10*q;
    parts[0][0]-=6*q;parts[0][1]+=frontierKick(age,.78,5);
  }
  if(e.stageAction==='bulkhead'){
    const q=frontierEase(age/.72)*(1-frontierEase((age-2.08)/.78));
    parts[1][0]+=22*q;parts[2][0]-=25*q;parts[1][1]-=17*q;parts[2][1]-=13*q;
    parts[1][4]+=.16*q;parts[2][4]-=.14*q;parts[0][1]+=frontierKick(age,1.28,6);
  }
  if(e.stageAction==='ram'){
    const load=frontierEase(age/.92)*(1-frontierEase((age-1.78)/.58));
    parts[0][1]+=11*load;parts[1][0]+=23*load;parts[2][0]-=19*load;
    parts[1][1]-=28*load;parts[2][1]-=24*load;parts[1][4]+=.22*load;parts[2][4]-=.18*load;
    parts[0][1]+=frontierKick(age,1.72,8);
  }
  if(e.stageAction==='girder'){
    const q=frontierEase(age/.84)*(1-frontierEase((age-1.62)/.72));
    parts[1][0]-=9*q;parts[2][1]-=37*q;parts[2][4]-=.46*q;parts[0][0]+=frontierKick(age,1.52,6);
  }
  if(e.stageEntryProgress!=null){
    const q=1-frontierEase((e.stageEntryProgress-.12)/.82);
    parts[0][1]-=32*q;parts[1][0]-=76*q;parts[2][0]+=85*q;parts[1][1]-=42*q;parts[2][1]-=28*q;
  }
  if(e.stageDefeatAge!=null){
    const q=frontierEase(e.stageDefeatAge/1.35);
    parts[1][0]-=54*q;parts[1][1]+=72*q;parts[1][4]-=.62*q;
    parts[2][0]+=66*q;parts[2][1]+=61*q;parts[2][4]+=.74*q;
    parts[3][1]+=24*q;parts[0][1]+=15*q;
  }
  return parts;
}
window.stackfallStageOneArtPose=stageOneArtPose;
window.stackfallStageOneArtInfo=()=>({
  loaded:Object.entries(FRONTIER_ART).filter(([,image])=>image.complete&&image.naturalWidth).map(([key])=>key),
  textureCount:8,
  source:'procedural-lockline-v2'
});

function drawFrontierHardware(o){
  const key=o.kind==='bulkhead'?'bulkhead':o.kind==='girder'?'girder':'deck';
  const p=worldToScreen(o.x,o.y),target=worldToScreen(o.toX??o.x,o.toY??o.y),warn=o.age<o.warn;
  if(Math.max(Math.abs(p.x-vw/2),Math.abs(target.x-vw/2))>vw/2+650&&Math.max(Math.abs(p.y-vh/2),Math.abs(target.y-vh/2))>vh/2+650)return;
  ctx.save();ctx.shadowBlur=0;
  if(warn){
    // Telegraphs are restrained floor projections; the attack is the filled hardware.
    ctx.save();ctx.translate(target.x,target.y);ctx.rotate(o.angle||0);
    ctx.fillStyle='rgba(213,132,57,.10)';ctx.fillRect(-o.hw,-o.hh,o.hw*2,o.hh*2);
    ctx.strokeStyle='rgba(245,188,111,.64)';ctx.lineWidth=1.4;ctx.setLineDash([10,8]);
    ctx.strokeRect(-o.hw-3,-o.hh-3,o.hw*2+6,o.hh*2+6);ctx.setLineDash([]);ctx.restore();
    if(o.kind==='girder'){
      const pivot=worldToScreen(o.pivotX,o.pivotY);ctx.save();ctx.translate(pivot.x,pivot.y);
      ctx.globalAlpha=.28;ctx.strokeStyle='#efbd79';ctx.setLineDash([10,10]);ctx.lineWidth=1.3;
      ctx.beginPath();ctx.arc(0,0,o.length+o.hh,o.angle,o.angle+o.sweep);ctx.stroke();ctx.restore();
    }
    if(o.kind==='bulkhead'){
      ctx.save();ctx.globalAlpha=.24;ctx.strokeStyle='#efbd79';ctx.setLineDash([10,9]);ctx.lineWidth=1.2;
      const a=worldToScreen(o.fromX,o.toY);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.restore();
    }
  }
  if(o.kind==='bulkhead'&&o.passageShift&&o.age<o.warn+o.travel+.95){
    const destination=worldToScreen(o.toX+o.passageShift,o.toY);ctx.save();
    ctx.globalAlpha=.26;ctx.strokeStyle='#f0bb73';ctx.setLineDash([7,9]);ctx.lineWidth=1.2;
    ctx.strokeRect(destination.x-o.hw,destination.y-o.hh,o.hw*2,o.hh*2);
    ctx.beginPath();ctx.moveTo(target.x,target.y);ctx.lineTo(destination.x,destination.y);ctx.stroke();ctx.restore();
  }
  // Contact shadow makes heavy structures sit in the world rather than float.
  ctx.save();ctx.translate(p.x+7,p.y+14);ctx.rotate(o.a||0);ctx.globalAlpha=.44;ctx.fillStyle='#000';
  ctx.fillRect(-o.hw,-o.hh,o.hw*2,o.hh*2);ctx.restore();
  ctx.translate(p.x,p.y-(o.height||0));ctx.rotate(o.a||0);
  frontierSprite(key,-o.hw,-o.hh,o.hw*2,o.hh*2);
  if(o.impactAt!=null){
    const t=o.age-o.impactAt;
    if(t<.25){
      ctx.globalAlpha=(1-t/.25)*.34;ctx.fillStyle='#f3c88e';
      ctx.fillRect(-o.hw,-o.hh,o.hw*2,Math.max(3,o.hh*.09));
      ctx.globalAlpha=(1-t/.25)*.18;ctx.fillStyle='#fff1d5';
      ctx.fillRect(-o.hw*.72,-o.hh+3,o.hw*1.44,2);
    }
  }
  ctx.restore();
}
