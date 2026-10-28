// Branch-only loader for the simplified Atropos prototype.
(()=>{
  if(typeof BOSS_NAMES==='object'&&BOSS_NAMES?.chronophage){
    BOSS_NAMES.chronophage.ko='세계포식자 아트로포스';
    BOSS_NAMES.chronophage.en='Atropos, World Devourer';
  }
  if(document.querySelector('script[data-atropos-simple]'))return;

  const load=(src,tag)=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=src;s.dataset.atroposSimple=tag||src;
    s.onload=()=>resolve(s);s.onerror=()=>reject(new Error(`Atropos script load failed: ${src}`));document.body.appendChild(s);
  });

  (async()=>{
    try{
      await load('src/atropos-world-devourer-prototype.js','core');
      if(typeof updateAtroposEntryControl==='function')updateAtroposEntryControl=function disableLegacyAtroposEntryControl(){return false;};
      if(typeof drawAtroposSpaceCut==='function'){
        const base=drawAtroposSpaceCut;
        drawAtroposSpaceCut=function simpleAtroposSpaceCutGate(e){if(e?.apexForm==='chronophage'&&e?.atroposReborn?.worldDevourer)return;return base(e);};
      }
      await load('src/atropos-world-devourer-damage.js','damage');
      await load('src/atropos-world-devourer-attack-crossing.js','charge');
      await load('src/atropos-world-devourer-attack-maw.js','devour');
      await load('src/atropos-world-devourer-attack-ring.js','tail');
      await load('src/atropos-world-devourer-attack-past.js','compat');
      await load('src/atropos-world-devourer-attack-world.js','world-bite');
      await load('src/atropos-world-devourer-director.js','director');
      await load('src/atropos-world-devourer-entry.js','entry');

      if(typeof apexBossSkill==='function'){
        const baseApexBossSkill=apexBossSkill;
        apexBossSkill=function simpleAtroposSkillGate(e,dt){
          if((e?.apexForm||e?.eliteForm)==='chronophage'&&typeof window.stackfallUpdateAtroposSimpleBoss==='function')return window.stackfallUpdateAtroposSimpleBoss(e,dt);
          return baseApexBossSkill(e,dt);
        };
      }
      window.stackfallAtroposPrototypeAttackState='simple-four-pattern-v1';
    }catch(err){
      console.error(err);window.stackfallAtroposPrototypeAttackState='simple-load-failed';
    }
  })();
})();
