(function(){
  const lang=()=>GAME_SETTINGS?.language||'ko';
  const labels={
    ko:{shortcut:'단축키 I / Tab',maxHp:'최대 체력',regen:'초당 체력 재생',cdr:'주기 감소',xp:'경험치 획득',projSpeed:'투사체 속도',projSize:'투사체 크기',pierce:'추가 관통',elite:'정예 피해',shield:'보호막 재충전',chainTime:'연쇄 유지',chainDamage:'연쇄 피해',orbit:'공전 속도'},
    en:{shortcut:'Shortcut I / Tab',maxHp:'Max Health',regen:'Health Regen / s',cdr:'Cooldown Reduction',xp:'Experience Gain',projSpeed:'Projectile Speed',projSize:'Projectile Size',pierce:'Extra Pierce',elite:'Elite Damage',shield:'Shield Recharge',chainTime:'Chain Duration',chainDamage:'Chain Damage',orbit:'Orbit Speed'},
    ja:{shortcut:'ショートカット I / Tab',maxHp:'最大HP',regen:'毎秒HP回復',cdr:'周期短縮',xp:'経験値獲得',projSpeed:'投射物速度',projSize:'投射物サイズ',pierce:'追加貫通',elite:'精鋭ダメージ',shield:'シールド再充填',chainTime:'連鎖維持',chainDamage:'連鎖ダメージ',orbit:'周回速度'},
    'zh-CN':{shortcut:'快捷键 I / Tab',maxHp:'最大生命',regen:'每秒生命恢复',cdr:'周期缩减',xp:'经验获取',projSpeed:'投射物速度',projSize:'投射物大小',pierce:'额外贯穿',elite:'精英伤害',shield:'护盾充能',chainTime:'连锁持续',chainDamage:'连锁伤害',orbit:'环绕速度'},
    es:{shortcut:'Atajo I / Tab',maxHp:'Vida máxima',regen:'Regeneración / s',cdr:'Reducción de ciclo',xp:'Experiencia',projSpeed:'Velocidad de proyectil',projSize:'Tamaño de proyectil',pierce:'Perforación extra',elite:'Daño a élites',shield:'Recarga de escudo',chainTime:'Duración de cadena',chainDamage:'Daño de cadena',orbit:'Velocidad orbital'},
    fr:{shortcut:'Raccourci I / Tab',maxHp:'PV max',regen:'Régénération / s',cdr:'Réduction de cycle',xp:'Gain d’expérience',projSpeed:'Vitesse des projectiles',projSize:'Taille des projectiles',pierce:'Pénétration bonus',elite:'Dégâts aux élites',shield:'Recharge du bouclier',chainTime:'Durée de chaîne',chainDamage:'Dégâts de chaîne',orbit:'Vitesse orbitale'}
  };
  const l=k=>(labels[lang()]||labels.en)[k]||k;

  const ledgerButton=document.querySelector('#abilityLedgerBtn');
  if(ledgerButton){ledgerButton.title=l('shortcut');if(!ledgerButton.querySelector('.ledger-hotkey')){const hot=document.createElement('em');hot.className='ledger-hotkey';hot.textContent='I / TAB';ledgerButton.appendChild(hot);}}
  const ledgerStyle=document.createElement('style');ledgerStyle.textContent=`#abilityLedgerBtn .ledger-hotkey{font-style:normal;font-size:7px;letter-spacing:.04em;color:#91ecff;opacity:.86}#abilityLedgerScreen .ledger-summary{grid-template-columns:repeat(auto-fit,minmax(118px,1fr))}.ledger-stat.extended-common-stat{background:linear-gradient(145deg,rgba(70,118,180,.10),rgba(255,255,255,.025));border-color:rgba(123,206,255,.11)}@media(max-width:760px){#abilityLedgerBtn .ledger-hotkey{font-size:6px}}`;document.head.appendChild(ledgerStyle);

  function pct(v){return `${Math.round(v*100)}%`;}
  function shieldText(){const eventStacks=(state.salvageBarrierStacks||0)+(state.nebulaExtras?.ward||0);if(eventStacks>0){const interval=Math.max(4.8,9-eventStacks*.45),gain=8+eventStacks*2;return `+${gain} / ${interval.toFixed(1)}s`;}const b=weaponCount('bulwark');if(b>=3)return `+${b>=5?10:6} / ${b>=5?6.2:9.0}s`;return '—';}
  function appendCommonStats(){
    const summary=document.querySelector('#ledgerSummary');if(!summary||document.querySelector('#abilityLedgerScreen')?.classList.contains('hidden')||summary.querySelector('.extended-common-stat'))return;
    const projectileSpeed=(1+stat('projectileSpeed')*.10)*(1+(state.nebulaExtras?.photon||0)*.08)-1;
    const projectileSize=(1+stat('projectileSize')*.08)*(1+(state.nebulaExtras?.photon||0)*.06)-1;
    const chainDuration=(1+stat('chain')*.25)*(1+(state.nebulaExtras?.chain||0)*.20)-1;
    const chainDamage=Math.min(10,Math.floor((state.combo||0)/5))*.03;
    const items=[
      [l('maxHp'),Math.round(player.maxHp)],
      [l('regen'),(stat('regen')*.3).toFixed(1)],
      [l('cdr'),pct(Math.max(0,1-hasteMult()))],
      [l('xp'),pct(Math.max(0,xpMult()-1))],
      [l('projSpeed'),pct(projectileSpeed)],
      [l('projSize'),pct(projectileSize)],
      [l('pierce'),`+${stat('pierce')}`],
      [l('elite'),pct(stat('eliteHunter')*.08)],
      [l('shield'),shieldText()],
      [l('chainTime'),pct(chainDuration)],
      [l('chainDamage'),pct(chainDamage)],
      [l('orbit'),pct(stat('projectileSpeed')*.08)]
    ];
    for(const [name,value] of items){const card=document.createElement('div');card.className='ledger-stat extended-common-stat';card.innerHTML=`<small>${name}</small><b>${value}</b>`;summary.appendChild(card);}
    const subtitle=document.querySelector('#ledgerSubtitle');if(subtitle&&!subtitle.dataset.hotkey){subtitle.dataset.hotkey='1';subtitle.textContent=`${subtitle.textContent} · ${l('shortcut')}`;}
  }
  const ledgerScreen=document.querySelector('#abilityLedgerScreen');
  if(ledgerScreen){new MutationObserver(()=>{if(!ledgerScreen.classList.contains('hidden'))setTimeout(appendCommonStats,0);}).observe(ledgerScreen,{attributes:true,attributeFilter:['class']});const summary=document.querySelector('#ledgerSummary');if(summary)new MutationObserver(()=>appendCommonStats()).observe(summary,{childList:true});}

  applyLanguage();
})();