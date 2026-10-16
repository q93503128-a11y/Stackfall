(()=>{
  'use strict';
  if(window.__stackfallStage01AudioPolishLoaded)return;
  window.__stackfallStage01AudioPolishLoaded=true;
  if(typeof audio==='undefined'||typeof MUSIC_SCENES==='undefined')return;

  const STAGE_ID='stage-01';
  const baseStageAttack=typeof audio.stageAttack==='function'?audio.stageAttack.bind(audio):null;
  const baseBeginVictory=window.stackfallBeginStageVictory;

  // Stage 1 exploration is intentionally sparse: low route hums with occasional high navigation tones.
  Object.assign(MUSIC_SCENES.frontier,{
    bed:[27.5,41.2,55,82.41],
    roots:[55,49,41.2,61.74,46.25,55,36.71,65.41],
    lead:[220,196,164.81,246.94,185,146.83,220,174.61],
    pulseMs:1680,
    filter:1320,
    noise:165,
    drive:.54,
    leadType:'triangle',
    leadEvery:3,
    leadLength:.72
  });

  // The boss scene keeps the same harmonic identity but compresses the pulse and adds a harder low register.
  Object.assign(MUSIC_SCENES.warden,{
    bed:[24.5,36.71,49,73.42],
    roots:[49,61.74,55,41.2,46.25,65.41,36.71,55],
    lead:[196,246.94,220,164.81,185,261.63,146.83,220],
    pulseMs:610,
    filter:2140,
    noise:520,
    drive:1.06,
    leadType:'triangle',
    leadEvery:2,
    leadLength:.42
  });

  const played=new Map();
  const allow=(attack,gap=110)=>{const now=performance.now(),last=played.get(attack)||0;if(now-last<gap)return false;played.set(attack,now);return true;};
  const tone=(f,d,type,v,slide=0,pan=0,opts={})=>audio.playChannel('combat',f,d,type,v,slide,pan,opts);
  const after=(ms,fn)=>typeof scheduleUiAction==='function'?scheduleUiAction(ms,fn):setTimeout(fn,ms);

  function closureImpact(strength=1){
    if(typeof audio.enemyImpact==='function')audio.enemyImpact(1.12*strength);
    tone(68,.28,'square',.028*strength,-31,-.08,{filterHz:560,echo:false});
    tone(430,.075,'triangle',.012*strength,-240,.18,{filterHz:2500});
  }

  audio.stageAttack=function stage01ClosureAttack(stageId,attack){
    if(stageId!==STAGE_ID)return baseStageAttack?.(stageId,attack);
    const gap=attack.includes('impact')||attack.includes('contact')?85:125;
    if(!allow(attack,gap))return;
    switch(attack){
      case'intro':
        tone(49,1.18,'sawtooth',.046,25,-.16,{filterHz:720});
        tone(98,.66,'triangle',.020,-18,.18,{filterHz:1500});
        after(420,()=>tone(146.83,.46,'sine',.014,-46,.05,{filterHz:1850}));
        break;
      case'route-closing':
        tone(73.42,.64,'sine',.028,-21,-.24,{filterHz:620});
        tone(293.66,.30,'triangle',.012,-120,.24,{filterHz:1800});
        break;
      case'route-contact':
        closureImpact(.78);
        break;
      case'route-release':
        tone(110,.42,'triangle',.017,155,-.12,{filterHz:1900});
        tone(329.63,.26,'sine',.010,90,.18,{filterHz:2800});
        break;
      case'closure-brace':
        tone(82.41,.34,'sine',.026,-10,-.16,{filterHz:600});
        tone(164.81,.25,'triangle',.011,-34,.16,{filterHz:1350});
        break;
      case'closure-charge':
        tone(98,.31,'sawtooth',.027,178,-.22,{filterHz:1300});
        tone(196,.24,'triangle',.012,220,.20,{filterHz:2600});
        break;
      case'closure-release':
        tone(330,.085,'square',.018,-170,-.18,{filterHz:1900,echo:false});
        tone(61.74,.30,'sine',.030,26,.12,{filterHz:520});
        break;
      case'closure-impact':
        closureImpact(1.28);
        break;
      case'shutter-prepare':
        tone(220,.32,'triangle',.016,-76,-.18,{filterHz:1600});
        tone(110,.38,'sine',.018,-18,.18,{filterHz:720});
        break;
      case'shutter-open':
        tone(185,.31,'triangle',.018,118,-.22,{filterHz:1900});
        tone(370,.24,'sine',.010,74,.18,{filterHz:3100});
        break;
      case'shutter-snap':
        tone(65.41,.28,'square',.034,-26,0,{filterHz:600,echo:false});
        tone(587.33,.075,'triangle',.014,-315,.24,{filterHz:3000});
        after(55,()=>tone(98,.17,'sawtooth',.018,-31,-.20,{filterHz:820}));
        break;
      case'orbit-wind':
        tone(146.83,.42,'sine',.019,115,-.26,{filterHz:1450});
        tone(293.66,.32,'triangle',.010,175,.24,{filterHz:2700});
        break;
      case'orbit-sweep':
        tone(196,.26,'sawtooth',.020,-52,-.28,{filterHz:1750});
        after(120,()=>tone(246.94,.22,'triangle',.014,-82,.05,{filterHz:2200}));
        after(245,()=>tone(329.63,.18,'triangle',.012,-105,.28,{filterHz:2600}));
        break;
      case'breakline-brace':
        tone(55,.46,'sine',.032,18,-.14,{filterHz:510});
        tone(110,.34,'sawtooth',.018,42,.14,{filterHz:880});
        break;
      case'breakline-release':
        tone(293.66,.095,'square',.019,-145,-.24,{filterHz:1850,echo:false});
        tone(73.42,.28,'sine',.028,32,.12,{filterHz:570});
        break;
      case'breakline-return':
        tone(246.94,.10,'square',.018,-110,.24,{filterHz:1650,echo:false});
        tone(61.74,.31,'sawtooth',.028,54,-.10,{filterHz:720});
        break;
      case'breakline-impact':
        closureImpact(1.46);
        tone(146.83,.48,'sawtooth',.022,-78,.16,{filterHz:980});
        break;
      case'phase-break':
        tone(55,.86,'sawtooth',.040,110,-.18,{filterHz:1050});
        tone(220,.58,'triangle',.020,180,.18,{filterHz:2500});
        after(270,()=>tone(73.42,.58,'sine',.028,-21,0,{filterHz:620}));
        break;
      case'defeat':
        tone(73.42,1.65,'sawtooth',.034,-38,-.12,{filterHz:520});
        tone(293.66,1.12,'triangle',.014,-146,.22,{filterHz:1550});
        after(360,()=>tone(49,.92,'sine',.024,-18,0,{filterHz:330,echo:false}));
        break;
      // Old prototype aliases remain harmless while the compatibility shim is still loaded.
      case'ram-impact':
      case'debris-impact':
      case'shutter-slam':
        closureImpact(1);
        break;
      case'shutter-warn':
      case'debris-warn':
        tone(196,.22,'triangle',.014,-78,0,{filterHz:1500});
        break;
      case'phase-open':
        tone(110,.62,'sawtooth',.032,180,-.10,{filterHz:1400});
        break;
      default:
        baseStageAttack?.(stageId,attack);
    }
  };

  if(typeof baseBeginVictory==='function'){
    window.stackfallBeginStageVictory=function stage01AudioVictory(enemy){
      if(enemy?.eventKind===STAGE_ID)audio.stageAttack(STAGE_ID,'defeat');
      return baseBeginVictory(enemy);
    };
  }

  audio.soundProfiles={...(audio.soundProfiles||{}),stage01:{exploration:'frontier-closure',boss:'warden-closure',events:['route-closing','route-contact','route-release','closure-brace','closure-charge','closure-release','closure-impact','shutter-prepare','shutter-open','shutter-snap','orbit-wind','orbit-sweep','breakline-brace','breakline-release','breakline-return','breakline-impact','phase-break','defeat']}};
  window.stackfallStage01AudioDiagnostics=()=>({loaded:true,exploration:MUSIC_SCENES.frontier,boss:MUSIC_SCENES.warden,events:audio.soundProfiles.stage01.events.slice()});

  if(audio.ctx)audio.syncAmbient(true);
})();