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
  document.body.appendChild(script);
})();