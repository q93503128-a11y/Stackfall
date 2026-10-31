import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const write=(path,text)=>fs.writeFileSync(path,text);
const expect=(ok,message)=>{if(!ok)throw new Error(message);};

function findMatchingBrace(text,open){
  let depth=0,quote=null,lineComment=false,blockComment=false,escape=false;
  for(let i=open;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(lineComment){if(ch==='\n')lineComment=false;continue;}
    if(blockComment){if(ch==='*'&&next==='/'){blockComment=false;i++;}continue;}
    if(quote){if(escape){escape=false;continue;}if(ch==='\\'){escape=true;continue;}if(ch===quote)quote=null;continue;}
    if(ch==='/'&&next==='/'){lineComment=true;i++;continue;}
    if(ch==='/'&&next==='*'){blockComment=true;i++;continue;}
    if(ch==='\''||ch==='"'||ch==='`'){quote=ch;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'){depth--;if(depth===0)return i;}
  }
  throw new Error('unmatched brace');
}

function rewriteCanonical(path,signature,builder){
  let text=read(path);const start=text.indexOf(signature);expect(start>=0,`${path}: missing ${signature}`);expect(text.indexOf(signature,start+1)<0,`${path}: duplicate ${signature}`);
  const open=text.indexOf('{',start);const close=findMatchingBrace(text,open);const body=text.slice(open+1,close);text=text.slice(0,start)+builder(body)+text.slice(close+1);write(path,text);
}

function rewriteWrapper({path,baseDecl,assignPrefix,registration,baseName,bodyReplacements=[]}){
  let text=read(path);const start=text.indexOf(baseDecl);expect(start>=0,`${path}: missing base decl ${baseDecl}`);expect(text.indexOf(baseDecl,start+1)<0,`${path}: duplicate base decl ${baseDecl}`);
  const assign=text.indexOf(assignPrefix,start+baseDecl.length);expect(assign>=0,`${path}: missing assignment ${assignPrefix}`);
  const open=text.indexOf('{',assign);const close=findMatchingBrace(text,open);expect(text[close+1]===';',`${path}: wrapper does not end with semicolon`);
  let body=text.slice(open+1,close);
  for(const [from,to] of bodyReplacements){expect(body.includes(from),`${path}: body missing ${from}`);body=body.replace(from,to);}
  body=body.split(`${baseName}(`).join('next(');
  const replacement=`${registration}${body}});`;
  text=text.slice(0,start)+replacement+text.slice(close+2);write(path,text);
}

rewriteCanonical('src/bosses.js','function hurtPlayer(amount,source){',body=>`const STACKFALL_PLAYER_DAMAGE_INTERCEPTORS=[];\nfunction registerPlayerDamageInterceptor(name,handler){if(typeof handler!=='function')return null;const entry={name:String(name||('player-damage-'+STACKFALL_PLAYER_DAMAGE_INTERCEPTORS.length)),handler};STACKFALL_PLAYER_DAMAGE_INTERCEPTORS.push(entry);return entry;}\nfunction runPlayerDamageInterceptor(index,amount,source){if(index<0)return hurtPlayerCore(amount,source);const entry=STACKFALL_PLAYER_DAMAGE_INTERCEPTORS[index],next=(nextAmount=amount,nextSource=source)=>runPlayerDamageInterceptor(index-1,nextAmount,nextSource);return entry.handler(next,amount,source);}\nfunction hurtPlayerCore(amount,source){${body}}\nfunction hurtPlayer(amount,source){return runPlayerDamageInterceptor(STACKFALL_PLAYER_DAMAGE_INTERCEPTORS.length-1,amount,source);}`);

rewriteCanonical('src/weapons.js','function updateWeapons(dt){',body=>`const STACKFALL_WEAPON_UPDATE_INTERCEPTORS=[];\nfunction registerWeaponUpdateInterceptor(name,handler){if(typeof handler!=='function')return null;const entry={name:String(name||('weapon-update-'+STACKFALL_WEAPON_UPDATE_INTERCEPTORS.length)),handler};STACKFALL_WEAPON_UPDATE_INTERCEPTORS.push(entry);return entry;}\nfunction runWeaponUpdateInterceptor(index,dt){if(index<0)return updateWeaponsCore(dt);const entry=STACKFALL_WEAPON_UPDATE_INTERCEPTORS[index],next=(nextDt=dt)=>runWeaponUpdateInterceptor(index-1,nextDt);return entry.handler(next,dt);}\nfunction updateWeaponsCore(dt){${body}}\nfunction updateWeapons(dt){return runWeaponUpdateInterceptor(STACKFALL_WEAPON_UPDATE_INTERCEPTORS.length-1,dt);}`);

const hurtWrappers=[
  {path:'src/dev-tools.js',baseDecl:'const baseDevHurtPlayer=hurtPlayer;',assignPrefix:"hurtPlayer=function developerInvincibility(amount,source='contact'){",registration:"registerPlayerDamageInterceptor('dev-invincibility',function developerInvincibility(next,amount,source='contact'){",baseName:'baseDevHurtPlayer'},
  {path:'src/endless-progression-v2.js',baseDecl:'const baseHurtPlayer=hurtPlayer;',assignPrefix:'hurtPlayer=function achievementHurtPlayer(){',registration:"registerPlayerDamageInterceptor('achievement-hit-tracking',function achievementHurtPlayer(next,...args){",baseName:'baseHurtPlayer',bodyReplacements:[['baseHurtPlayer(...arguments)','next(...args)']]},
  {path:'src/reward-refinement.js',baseDecl:'const rrHurt=hurtPlayer;',assignPrefix:'hurtPlayer=function(amount,source){',registration:"registerPlayerDamageInterceptor('reward-bulwark',function rewardBulwarkHurt(next,amount,source){",baseName:'rrHurt'},
  {path:'src/endgame-balance-expansion.js',baseDecl:'const baseHurtPlayerForGrace=hurtPlayer;',assignPrefix:"hurtPlayer=function shorterHitInvulnerability(amount,source='contact'){",registration:"registerPlayerDamageInterceptor('endgame-hit-grace',function shorterHitInvulnerability(next,amount,source='contact'){",baseName:'baseHurtPlayerForGrace'},
  {path:'src/weapon-awakening-effects-a1-a7.js',baseDecl:'const baseHurtPlayer=hurtPlayer;',assignPrefix:"hurtPlayer=function celestialBastionHurt(amount,source='contact'){",registration:"registerPlayerDamageInterceptor('awakening-bastion',function celestialBastionHurt(next,amount,source='contact'){",baseName:'baseHurtPlayer'},
  {path:'src/player-hit-invulnerability-v2.js',baseDecl:'const base=hurtPlayer;',assignPrefix:'hurtPlayer=function shortenedPlayerHitInvulnerability(amount,source){',registration:"registerPlayerDamageInterceptor('global-hit-invulnerability',function shortenedPlayerHitInvulnerability(next,amount,source){",baseName:'base'}
];
for(const config of hurtWrappers)rewriteWrapper(config);

const weaponWrappers=[
  {path:'src/reward-refinement.js',baseDecl:'const rrUpdateWeapons=updateWeapons;',assignPrefix:'updateWeapons=function(dt){',registration:"registerWeaponUpdateInterceptor('reward-traits',function rewardTraitWeaponUpdate(next,dt){",baseName:'rrUpdateWeapons'},
  {path:'src/endgame-balance-expansion.js',baseDecl:'const baseUpdateWeapons=updateWeapons;',assignPrefix:'updateWeapons=function multiplicityOrbitWeapons(dt){',registration:"registerWeaponUpdateInterceptor('multiplicity-orbits',function multiplicityOrbitWeapons(next,dt){",baseName:'baseUpdateWeapons'},
  {path:'src/weapon-awakening-effects-a1-a7.js',baseDecl:'const baseUpdateWeapons=updateWeapons;',assignPrefix:'updateWeapons=function awakenedFirstSetWeapons(dt){',registration:"registerWeaponUpdateInterceptor('awakening-first-set',function awakenedFirstSetWeapons(next,dt){",baseName:'baseUpdateWeapons'},
  {path:'src/weapon-awakening-effects-a8-a13.js',baseDecl:'const baseUpdateWeapons=updateWeapons;',assignPrefix:'updateWeapons=function awakeningSecondSetWeapons(dt){',registration:"registerWeaponUpdateInterceptor('awakening-second-set',function awakeningSecondSetWeapons(next,dt){",baseName:'baseUpdateWeapons'},
  {path:'src/weapon-awakening-effects-a14-a19.js',baseDecl:'const baseUpdateWeapons=updateWeapons;',assignPrefix:'updateWeapons=function awakeningThirdSetWeapons(dt){',registration:"registerWeaponUpdateInterceptor('awakening-third-set',function awakeningThirdSetWeapons(next,dt){",baseName:'baseUpdateWeapons'},
  {path:'src/combat-balance-refinement.js',baseDecl:'const echoUpdateBase=updateWeapons;',assignPrefix:'updateWeapons=function echoBladeUpdate(dt){',registration:"registerWeaponUpdateInterceptor('echo-blade-cooldown',function echoBladeUpdate(next,dt){",baseName:'echoUpdateBase'}
];
for(const config of weaponWrappers)rewriteWrapper(config);

let contract=read('scripts/runtime-ownership-contract.mjs');
const anchor="expect('enemy update feature layers register interceptors instead of replacing updateEnemies',!allRuntimeSource.includes('updateEnemies=function')&&allRuntimeSource.includes(\"registerEnemyUpdateInterceptor('combat-guidance'\")&&allRuntimeSource.includes(\"registerEnemyUpdateInterceptor('last-constellation-production'\"));";
expect(contract.includes(anchor),'runtime ownership contract anchor missing');
const extra=`\nexpect('player damage dispatch has one canonical owner with captured-base interceptor semantics',bosses.includes('const STACKFALL_PLAYER_DAMAGE_INTERCEPTORS=[]')&&bosses.includes('function registerPlayerDamageInterceptor(name,handler)')&&bosses.includes('function hurtPlayerCore(amount,source)')&&bosses.includes('function hurtPlayer(amount,source){return runPlayerDamageInterceptor'));
expect('player damage feature layers register interceptors instead of replacing hurtPlayer',!allRuntimeSource.includes('hurtPlayer=function')&&allRuntimeSource.includes("registerPlayerDamageInterceptor('dev-invincibility'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('achievement-hit-tracking'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('reward-bulwark'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('awakening-bastion'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('global-hit-invulnerability'"));
expect('weapon update dispatch has one canonical owner with captured-base interceptor semantics',weapons.includes('const STACKFALL_WEAPON_UPDATE_INTERCEPTORS=[]')&&weapons.includes('function registerWeaponUpdateInterceptor(name,handler)')&&weapons.includes('function updateWeaponsCore(dt)')&&weapons.includes('function updateWeapons(dt){return runWeaponUpdateInterceptor'));
expect('weapon update feature layers register interceptors instead of replacing updateWeapons',!allRuntimeSource.includes('updateWeapons=function')&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('reward-traits'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('multiplicity-orbits'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('awakening-first-set'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('awakening-second-set'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('awakening-third-set'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('echo-blade-cooldown'"));`;
contract=contract.replace(anchor,anchor+extra);
if(!contract.includes("const weapons=read('src/weapons.js');")){
  const readAnchor="const bosses=read('src/bosses.js');";expect(contract.includes(readAnchor),'contract read anchor missing');contract=contract.replace(readAnchor,readAnchor+"\nconst weapons=read('src/weapons.js');");
}
write('scripts/runtime-ownership-contract.mjs',contract);

const changed=['src/bosses.js','src/weapons.js',...new Set([...hurtWrappers.map(x=>x.path),...weaponWrappers.map(x=>x.path)]),'scripts/runtime-ownership-contract.mjs'];
for(const path of changed){const text=read(path);expect(!/\bhurtPlayer\s*=\s*function\b/.test(text),`${path}: hurtPlayer replacement remains`);expect(!/\bupdateWeapons\s*=\s*function\b/.test(text),`${path}: updateWeapons replacement remains`);}
console.log(JSON.stringify({changed},null,2));
