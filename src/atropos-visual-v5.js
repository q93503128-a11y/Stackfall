// Branch-only loader for the world-devourer Atropos prototype.
(()=>{
  if(typeof BOSS_NAMES==='object'&&BOSS_NAMES?.chronophage){
    BOSS_NAMES.chronophage.ko='세계포식자 아트로포스';
    BOSS_NAMES.chronophage.en='Atropos, World Devourer';
  }
  if(document.querySelector('script[data-atropos-world-devourer]'))return;
  const script=document.createElement('script');
  script.src='src/atropos-world-devourer-prototype.js';
  script.dataset.atroposWorldDevourer='1';
  script.addEventListener('load',()=>{
    if(typeof apexBossSkill==='function'){
      const baseApexBossSkill=apexBossSkill;
      apexBossSkill=function worldDevourerAttackGate(e,dt){
        if((e?.apexForm||e?.eliteForm)==='chronophage'&&e?.atroposReborn?.worldDevourer){
          if(typeof window.stackfallUpdateWorldDevourerCombat==='function')return window.stackfallUpdateWorldDevourerCombat(e,dt);
          if(typeof window.stackfallUpdateWorldDevourerCrossing==='function')return window.stackfallUpdateWorldDevourerCrossing(e,dt);
          e.apexElapsed=(e.apexElapsed||0)+dt;const health=e.hp/Math.max(1,e.maxHp);e.apexPhase=health<.25?4:health<.50?3:health<.75?2:1;e.timeLock=0;
          if(e.atroposReborn){e.atroposReborn.slash=null;e.atroposReborn.slashCd=1e9;}return;
        }
        return baseApexBossSkill(e,dt);
      };
    }
    if(typeof drawAtroposSpaceCut==='function'){
      const baseSpaceCut=drawAtroposSpaceCut;
      drawAtroposSpaceCut=function worldDevourerLegacySpaceCutGate(e){if(e?.apexForm==='chronophage'&&e?.atroposReborn?.worldDevourer)return;return baseSpaceCut(e);};
    }

    const damageScript=document.createElement('script');
    damageScript.src='src/atropos-world-devourer-damage.js';
    damageScript.dataset.atroposWorldDevourerDamage='boss-scaled';
    damageScript.addEventListener('load',()=>{
      const attackScript=document.createElement('script');
      attackScript.src='src/atropos-world-devourer-attack-crossing.js';
      attackScript.dataset.atroposWorldDevourerAttack='giant-crossing-tail-sever';
      attackScript.addEventListener('load',()=>{
        const mawScript=document.createElement('script');
        mawScript.src='src/atropos-world-devourer-attack-maw.js';
        mawScript.dataset.atroposWorldDevourerAttack='void-maw';
        mawScript.addEventListener('load',()=>{
          const ringScript=document.createElement('script');
          ringScript.src='src/atropos-world-devourer-attack-ring.js';
          ringScript.dataset.atroposWorldDevourerAttack='devourer-ring';
          ringScript.addEventListener('load',()=>{
            const pastScript=document.createElement('script');
            pastScript.src='src/atropos-world-devourer-attack-past.js';
            pastScript.dataset.atroposWorldDevourerAttack='past-trajectory';
            pastScript.addEventListener('load',()=>{
              const worldScript=document.createElement('script');
              worldScript.src='src/atropos-world-devourer-attack-world.js';
              worldScript.dataset.atroposWorldDevourerAttack='world-devour';
              worldScript.addEventListener('load',()=>{
                const directorScript=document.createElement('script');
                directorScript.src='src/atropos-world-devourer-director.js';
                directorScript.dataset.atroposWorldDevourerDirector='phase-aware';
                document.body.appendChild(directorScript);
                window.stackfallAtroposPrototypeAttackState='director-loading';
              });
              document.body.appendChild(worldScript);
              window.stackfallAtroposPrototypeAttackState='world-devour-loading';
            });
            document.body.appendChild(pastScript);
            window.stackfallAtroposPrototypeAttackState='past-trajectory-loading';
          });
          document.body.appendChild(ringScript);
          window.stackfallAtroposPrototypeAttackState='devourer-ring-loading';
        });
        document.body.appendChild(mawScript);
        window.stackfallAtroposPrototypeAttackState='void-maw-loading';
      });
      document.body.appendChild(attackScript);
      window.stackfallAtroposPrototypeAttackState='crossing-tail-loading';
    });
    document.body.appendChild(damageScript);
    window.stackfallAtroposPrototypeAttackState='damage-model-loading';
  });
  document.body.appendChild(script);
})();
