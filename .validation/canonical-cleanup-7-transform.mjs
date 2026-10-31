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
  const open=text.indexOf('{',start),close=findMatchingBrace(text,open),body=text.slice(open+1,close);text=text.slice(0,start)+builder(body)+text.slice(close+1);write(path,text);
}

function rewriteWrapper({path,baseDecl,assignPrefix,registration,baseName,bodyReplacements=[]}){
  let text=read(path);const start=text.indexOf(baseDecl);expect(start>=0,`${path}: missing base decl ${baseDecl}`);expect(text.indexOf(baseDecl,start+1)<0,`${path}: duplicate base decl ${baseDecl}`);
  const assign=text.indexOf(assignPrefix,start+baseDecl.length);expect(assign>=0,`${path}: missing assignment ${assignPrefix}`);
  const open=text.indexOf('{',assign),close=findMatchingBrace(text,open);expect(text[close+1]===';',`${path}: wrapper does not end with semicolon`);
  let body=text.slice(open+1,close);
  for(const [from,to] of bodyReplacements){expect(body.includes(from),`${path}: body missing ${from}`);body=body.replace(from,to);}
  body=body.split(`${baseName}(`).join('next(');
  text=text.slice(0,start)+`${registration}${body}});`+text.slice(close+2);write(path,text);
}

function replaceUniqueLine(text,needle,replacement,label){
  const lines=text.split('\n'),matches=[];for(let i=0;i<lines.length;i++)if(lines[i].includes(needle))matches.push(i);
  expect(matches.length===1,`${label}: expected one line containing ${needle}, found ${matches.length}`);lines[matches[0]]=replacement;return lines.join('\n');
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

let mapEvents=read('src/map-event-expansion.js');
const oldCadence="  const INTERVALS={vault:[155,215],distress:[175,245],crash:[205,285],meteor:[185,255],predator:[220,305],relay:[235,325],storm:[255,350],void:[285,390]},FIRST={vault:42,distress:78,crash:118,meteor:154,predator:192,relay:232,storm:274,void:320},EVENT_GAP=58,TYPE_GAP={vault:145,distress:165,crash:195,meteor:175,predator:210,relay:225,storm:240,void:270};";
expect(mapEvents.includes(oldCadence),'map-event stale eight-family cadence row missing');
mapEvents=mapEvents.replace(oldCadence,"  const INTERVALS={vault:[155,215],crash:[205,285],void:[285,390]},FIRST={vault:42,crash:118,void:320},EVENT_GAP=58,TYPE_GAP={vault:145,crash:195,void:270};");write('src/map-event-expansion.js',mapEvents);

let legacy=read('scripts/legacy-chat-requirements-contract.mjs');
legacy=replaceUniqueLine(legacy,"expect('Endless event cadence covers eight varied event families",`expect('Endless event cadence uses exactly the canonical three world-event families with a shared anti-stack gap',mapEvents.includes("EVENT_CLOCK_KEYS=Object.freeze(['vault','crash','void'])")&&mapEvents.includes("INTERVALS={vault:[155,215],crash:[205,285],void:[285,390]}")&&mapEvents.includes("FIRST={vault:42,crash:118,void:320}")&&mapEvents.includes('EVENT_GAP=58')&&mapEvents.includes('state.eventGlobalCooldown=Math.max(state.eventGlobalCooldown||0,EVENT_GAP)')&&mapEvents.includes('eligible[Math.floor(Math.random()*eligible.length)]'));`,'legacy event cadence');
legacy=replaceUniqueLine(legacy,"expect('five added Endless events have distinct playable mechanics",`expect('discarded Endless event mechanics stay out of the active runtime',!['startDistress','updateMeteor','startPredator','updateRelay','startStorm'].some(name=>mapEvents.includes('function '+name))&&mapEvents.includes("EVENT_CLOCK_KEYS=Object.freeze(['vault','crash','void'])"));`,'legacy discarded event mechanics');
write('scripts/legacy-chat-requirements-contract.mjs',legacy);

let awakening=read('scripts/awakening-runtime-checks.mjs');
const oldStageAudit="  const stages=[],activeStages=[...(window.STACKFALL_ACTIVE_STAGE_RUNTIMES||['stage-01'])];\n  check(activeStages.length>0,'active Stage runtime list is empty');\n  for(const theme of activeStages){";
const newStageAudit="  const stages=[],activeStages=[...(window.STACKFALL_ACTIVE_STAGE_RUNTIMES||[])];\n  if(activeStages.length===0){\n    check(window.STACKFALL_STAGE_MODE_ENABLED===false&&window.stackfallHasStageRuntime?.()===false,'sealed Stage runtime state is inconsistent');\n  }\n  for(const theme of activeStages){";
expect(awakening.includes(oldStageAudit),'awakening Stage assertion block missing');awakening=awakening.replace(oldStageAudit,newStageAudit);write('scripts/awakening-runtime-checks.mjs',awakening);

let apexBrowser=read('scripts/apex-foundation-browser.mjs');
const multipartNeedle="      const partFixture=await probe(`(()=>{const result=stackfallDeveloperTest.defineMultipartFixture";
expect(apexBrowser.includes(multipartNeedle),'Apex multipart fixture start missing');apexBrowser=apexBrowser.replace(multipartNeedle,"      await probe(\"state.mode='paused'\");\n      const partFixture=await probe(`(()=>{const result=stackfallDeveloperTest.defineMultipartFixture");
const screenshotNeedle="      await capture(page,join(screenshotDir,'apex-foundation-debug-parts.png')).then(path=>scenario.screenshots.push(path));";
expect(apexBrowser.includes(screenshotNeedle),'Apex multipart fixture end missing');apexBrowser=apexBrowser.replace(screenshotNeedle,"      await probe(\"state.mode='playing'\");");write('scripts/apex-foundation-browser.mjs',apexBrowser);

let contract=read('scripts/runtime-ownership-contract.mjs');
if(!contract.includes("const weapons=read('src/weapons.js');")){
  const readAnchor="const bosses=read('src/bosses.js');";expect(contract.includes(readAnchor),'contract read anchor missing');contract=contract.replace(readAnchor,readAnchor+"\nconst weapons=read('src/weapons.js');");
}
if(!contract.includes("const allRuntimeSource=fs.readdirSync('src')")){
  const aggregateAnchor="const rewards=read('src/reward-refinement.js');";expect(contract.includes(aggregateAnchor),'contract aggregate anchor missing');contract=contract.replace(aggregateAnchor,aggregateAnchor+"\nconst allRuntimeSource=fs.readdirSync('src').filter(name=>name.endsWith('.js')).map(name=>read('src/'+name)).join('\\n');");
}
const insertAfter="expect('Apex reward UI is prepared before the blocking mode is committed',rewards.indexOf('cards.replaceChildren(fragment)')<rewards.indexOf(\"state.mode='apexReward'\")&&rewards.indexOf('confirm.onclick=claim')<rewards.indexOf(\"state.mode='apexReward'\"));";
expect(contract.includes(insertAfter),'runtime ownership contract insertion anchor missing');
const extra=`\nexpect('player damage dispatch has one canonical owner with captured-base interceptor semantics',bosses.includes('const STACKFALL_PLAYER_DAMAGE_INTERCEPTORS=[]')&&bosses.includes('function registerPlayerDamageInterceptor(name,handler)')&&bosses.includes('function hurtPlayerCore(amount,source)')&&bosses.includes('function hurtPlayer(amount,source){return runPlayerDamageInterceptor'));
expect('player damage feature layers register interceptors instead of replacing hurtPlayer',!allRuntimeSource.includes('hurtPlayer=function')&&allRuntimeSource.includes("registerPlayerDamageInterceptor('dev-invincibility'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('achievement-hit-tracking'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('reward-bulwark'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('awakening-bastion'")&&allRuntimeSource.includes("registerPlayerDamageInterceptor('global-hit-invulnerability'"));
expect('weapon update dispatch has one canonical owner with captured-base interceptor semantics',weapons.includes('const STACKFALL_WEAPON_UPDATE_INTERCEPTORS=[]')&&weapons.includes('function registerWeaponUpdateInterceptor(name,handler)')&&weapons.includes('function updateWeaponsCore(dt)')&&weapons.includes('function updateWeapons(dt){return runWeaponUpdateInterceptor'));
expect('weapon update feature layers register interceptors instead of replacing updateWeapons',!allRuntimeSource.includes('updateWeapons=function')&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('reward-traits'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('multiplicity-orbits'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('awakening-first-set'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('awakening-second-set'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('awakening-third-set'")&&allRuntimeSource.includes("registerWeaponUpdateInterceptor('echo-blade-cooldown'"));`;
contract=contract.replace(insertAfter,insertAfter+extra);write('scripts/runtime-ownership-contract.mjs',contract);

const changed=['src/bosses.js','src/weapons.js','src/map-event-expansion.js',...new Set([...hurtWrappers.map(x=>x.path),...weaponWrappers.map(x=>x.path)]),'scripts/runtime-ownership-contract.mjs','scripts/legacy-chat-requirements-contract.mjs','scripts/awakening-runtime-checks.mjs','scripts/apex-foundation-browser.mjs'];
for(const path of changed.filter(path=>path.endsWith('.js'))){const text=read(path);expect(!/\bhurtPlayer\s*=\s*function\b/.test(text),`${path}: hurtPlayer replacement remains`);expect(!/\bupdateWeapons\s*=\s*function\b/.test(text),`${path}: updateWeapons replacement remains`);}
console.log(JSON.stringify({changed},null,2));
