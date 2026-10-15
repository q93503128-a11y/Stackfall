// Runtime-facing names for the 2026-10-15 stage world reboot.
// Boss ids remain compatibility ids until each stage receives its production rebuild.
(()=>{
  if(window.__stackfallWorldRebootMetadataApplied)return;
  window.__stackfallWorldRebootMetadataApplied=true;
  const constellationNames={
    'constellation-01':{ko:'잔해항로',en:'Wreckway'},
    'constellation-02':{ko:'심연정원',en:'Abyss Garden'},
    'constellation-03':{ko:'침묵회선',en:'Silent Circuit'}
  };
  const stageNames={
    'stage-01':{ko:'폐쇄선',en:'Lockline'},
    'stage-02':{ko:'이온 해구',en:'Ion Trench'},
    'stage-03':{ko:'유리별 묘지',en:'Glassstar Graveyard'},
    'stage-04':{ko:'영시 철로',en:'Zero-Hour Rail'},
    'stage-05':{ko:'쌍극 폭풍',en:'Dipole Storm'},
    'stage-06':{ko:'종착역',en:'Terminus'},
    'stage-07':{ko:'뿌리수로',en:'Root Channel'},
    'stage-08':{ko:'혈관협곡',en:'Vascular Gorge'},
    'stage-09':{ko:'종자층',en:'Seedbed'},
    'stage-10':{ko:'검은 못',en:'Black Pool'},
    'stage-11':{ko:'갑각능선',en:'Carapace Ridge'},
    'stage-12':{ko:'모체',en:'Mother'},
    'stage-13':{ko:'청취탑',en:'Listening Spire'},
    'stage-14':{ko:'무음실',en:'Anechoic Chamber'},
    'stage-15':{ko:'분기선',en:'Branchline'},
    'stage-16':{ko:'사각지대',en:'Blind Zone'},
    'stage-17':{ko:'봉인금고',en:'Seal Vault'},
    'stage-18':{ko:'원점',en:'Origin'}
  };
  const stageOneDescription={
    ko:'꺼진 항법 비콘 사이로 세 갈래 수송 회랑이 교차한다. 멈춘 줄 알았던 차단 설비가 아직 움직인다.',
    en:'Three transport corridors cross between dead navigation beacons. The lockline machinery is not as dormant as it looks.'
  };
  if(Array.isArray(window.STACKFALL_CONSTELLATIONS)){
    const rows=window.STACKFALL_CONSTELLATIONS.map(row=>Object.freeze({...row,title:Object.freeze({...row.title,...(constellationNames[row.id]||{})})}));
    window.STACKFALL_CONSTELLATIONS=Object.freeze(rows);
    window.stackfallConstellationById=id=>rows.find(row=>row.id===id)||null;
  }
  if(Array.isArray(window.STACKFALL_STAGE_CATALOG)){
    const rows=window.STACKFALL_STAGE_CATALOG.map(row=>{
      const title=stageNames[row.id];
      if(!title)return row;
      const patch={...row,title:Object.freeze({...row.title,...title})};
      if(row.id==='stage-01'){
        patch.description=Object.freeze(stageOneDescription);
        patch.boss=Object.freeze({...row.boss,name:Object.freeze({ko:'K-03 폐쇄기',en:'Lockframe K-03'})});
      }
      return Object.freeze(patch);
    });
    window.STACKFALL_STAGE_CATALOG=Object.freeze(rows);
    window.stackfallStageById=id=>rows.find(row=>row.id===id)||null;
  }
})();
