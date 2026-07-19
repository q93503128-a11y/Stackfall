const APEX_INTERVAL_SECONDS=480;
const BOSS_NAMES={
  eclipse:{ko:'일식의 군주',en:'Lord of Eclipse'},seraph:{ko:'성운의 세라프',en:'Nebula Seraph'},pulsar:{ko:'맥동성의 심장',en:'Heart of the Pulsar'},leviathan:{ko:'성간의 레비아탄',en:'Interstellar Leviathan'},archivist:{ko:'무한 기록자',en:'Infinite Archivist'},heliarch:{ko:'태양관의 군주',en:'Heliarch'},tempest:{ko:'성뢰의 여왕',en:'Queen of Astral Storms'},nullengine:{ko:'무효기관 제로',en:'Null Engine Zero'},
  knight:{ko:'균열의 기사',en:'Rift Knight'},warden:{ko:'초신성 감시자',en:'Nova Warden'},executioner:{ko:'궤도 집행자',en:'Orbital Executioner'},colossus:{ko:'결정 거상',en:'Crystal Colossus'},harvester:{ko:'성운 수확자',en:'Nebula Harvester'},mirror:{ko:'쌍성의 거울',en:'Twin-Star Mirror'},
  maw:{ko:'심연의 포식체',en:'Abyssal Devourer'},oracle:{ko:'공허의 예언자',en:'Void Oracle'},weaver:{ko:'무광의 직조자',en:'Lightless Weaver'},grave:{ko:'별무덤의 군주',en:'Lord of the Star Grave'},paradox:{ko:'역설의 쌍둥이',en:'Paradox Twins'},
  chronophage:{ko:'시간포식자 아트로포스',en:'Atropos, Chronophage'},starforge:{ko:'종말 항성 오메가',en:'Omega, the Last Starforge'},lastconstellation:{ko:'무명의 마지막 성좌',en:'The Nameless Last Constellation'}
};
Object.assign(TEXT.ko,{'pause.restart':'게임 다시 시작','gameover.title':'게임 오버'});Object.assign(TEXT.en,{'pause.restart':'RESTART GAME','gameover.title':'GAME OVER'});Object.assign(TEXT.ja,{'pause.restart':'ゲームをやり直す','gameover.title':'ゲームオーバー'});if(TEXT['zh-CN'])Object.assign(TEXT['zh-CN'],{'gameover.title':'游戏结束'});
const bossLang=()=>GAME_SETTINGS?.language||'ko';
const bossName=id=>BOSS_NAMES[id]?.[bossLang()]||BOSS_NAMES[id]?.en||id;
bossDisplayName=function(enemy){if(!enemy)return'';let name=enemy.eliteForm?bossName(enemy.eliteForm):(enemy.name||'');if(enemy.twinGroup)name+=enemy.twinSide<0?' α':' β';return name;};
const BOSS_POOLS={boss:['eclipse','seraph','pulsar','leviathan','archivist','heliarch','tempest','nullengine'],mini:['knight','warden','executioner','colossus','harvester','mirror'],void:['maw','oracle','weaver','grave','paradox'],apex:['chronophage','starforge','lastconstellation']};
const BOSS_STATS={
  eclipse:{color:'#ff72cb',hp:1,speed:1,damage:1,r:1},seraph:{color:'#91ffe7',hp:.90,speed:1.10,damage:.92,r:.96},pulsar:{color:'#67b7ff',hp:1.08,speed:.92,damage:1.02,r:1.04},leviathan:{color:'#ff9b68',hp:1.22,speed:.76,damage:1.12,r:1.13},archivist:{color:'#d7b0ff',hp:.97,speed:.88,damage:.96,r:1.02},heliarch:{color:'#ffd66f',hp:1.05,speed:.94,damage:1.06,r:1.06},tempest:{color:'#76d9ff',hp:.94,speed:1.14,damage:.98,r:.96},nullengine:{color:'#a9b4d8',hp:1.16,speed:.82,damage:1.08,r:1.10},
  knight:{color:'#d4a6ff',hp:1,speed:1,damage:1,r:1},warden:{color:'#70e5ff',hp:.92,speed:1.10,damage:.94,r:.96},executioner:{color:'#ff7db6',hp:.86,speed:1.18,damage:1.06,r:.92},colossus:{color:'#ffd07b',hp:1.30,speed:.74,damage:1.12,r:1.16},harvester:{color:'#ff9c7d',hp:1.04,speed:.96,damage:1.08,r:1.05},mirror:{color:'#b6a2ff',hp:1.02,speed:1.07,damage:.99,r:.96},
  maw:{color:'#9b5cff',hp:1,speed:.94,damage:.96,r:1.10},oracle:{color:'#c58aff',hp:.90,speed:1.08,damage:.92,r:.92},weaver:{color:'#7446c8',hp:1.08,speed:.88,damage:1.03,r:1.07},grave:{color:'#6960ad',hp:1.20,speed:.76,damage:1.08,r:1.16},paradox:{color:'#d69cff',hp:1.04,speed:1.07,damage:1.02,r:.96},
  chronophage:{color:'#79ffe1',hp:2.22,speed:.92,damage:1.34,r:1.58,theme:'apex-chrono'},starforge:{color:'#ffb04e',hp:2.48,speed:.80,damage:1.46,r:1.96,theme:'apex-forge'},lastconstellation:{color:'#b7c9ff',hp:2.34,speed:.86,damage:1.40,r:.84,theme:'apex-constellation'}
};
function bossBag(kind){state.bossBags=state.bossBags||{};const pool=BOSS_POOLS[kind]||BOSS_POOLS.boss;let bag=state.bossBags[kind];if(!bag?.length){bag=[...pool].sort(()=>Math.random()-.5);state.bossBags[kind]=bag;}return bag.pop();}
function resetBossSystems(){state.bossBags={};state.nextApexAt=APEX_INTERVAL_SECONDS;state.apexCount=0;state.apexActiveId=null;state.pendingApexForm=null;state.apexArena=null;state.apexExitPending=false;state.apexBoons={};state.apexBoonTimers={chrono:24,forge:18,constellation:12};}
function apexPlayerGrowthScale(){const level=Math.max(1,Number(state.level)||1),weaponTotal=Object.values(state.weaponStacks||{}).reduce((sum,value)=>sum+(Number(value)||0),0),passiveTotal=Object.values(state.passives||{}).reduce((sum,value)=>sum+(Number(value)||0),0),score=Math.max(0,level-18)*.035+Math.max(0,weaponTotal-10)*.055+Math.max(0,passiveTotal-7)*.035;return clamp(1+score,1,3.2);}
window.stackfallApexPlayerGrowthScale=apexPlayerGrowthScale;
function configureElite(enemy,kind){
  const category=kind==='mini'?'mini':kind==='void'?'void':kind==='apex'?'apex':'boss',form=category==='apex'&&state.pendingApexForm?state.pendingApexForm:bossBag(category),s=BOSS_STATS[form],t=state.time||0;
  enemy.eliteCategory=category;enemy.eliteForm=form;enemy.name=bossName(form);enemy.color=s.color;enemy.r*=s.r;enemy.hp*=s.hp;enemy.speed*=s.speed;enemy.damage*=s.damage;
  if(category==='void')enemy.eventKind='void';
  if(category==='apex'){
    const cycle=Math.max(0,t/APEX_INTERVAL_SECONDS-1),growth=apexPlayerGrowthScale(),hpScale=1+cycle*.78,damageScale=1+cycle*.36,speedScale=1+cycle*.065,cooldownScale=1/(1+cycle*.12),growthDamage=1+(growth-1)*.50,growthSpeed=1+(growth-1)*.06,growthCooldown=1+(growth-1)*.12;
    enemy.eventKind='apex';enemy.apexForm=form;enemy.controlImmune=true;enemy.knockbackImmune=true;enemy.timeLock=0;enemy.xp*=4.0+cycle*.65;enemy.apexPhase=1;enemy.apexGrowthScale=growth;enemy.apexPhaseEntered=0;enemy.signatureCd=4.8;enemy.apexVariantCd=3.8;
    enemy.hp*=hpScale*4.80*growth;enemy.damage*=damageScale*1.85*growthDamage;enemy.speed*=speedScale*1.12*growthSpeed;enemy.skillCd*=cooldownScale*.62/growthCooldown;enemy.burstCd*=cooldownScale*.62/growthCooldown;enemy.pulseCd*=cooldownScale*.62/growthCooldown;
  }else{
    const isBoss=enemy.type==='boss',f=clamp((t-110)/520,0,1);enemy.hp*=lerp(isBoss?.56:.74,isBoss?.95:.99,f);enemy.damage*=lerp(isBoss?.66:.80,.98,clamp((t-110)/440,0,1));enemy.speed*=lerp(isBoss?.88:.94,1,clamp((t-110)/360,0,1));enemy.skillCd+=(isBoss?1.25:.65)*(1-f);enemy.burstCd+=(isBoss?1.45:.8)*(1-f);
    if(category!=='mini'){enemy.hp*=2;enemy.damage*=1.75;enemy.skillCd*=.82;enemy.burstCd*=.82;enemy.pulseCd*=.82;}
    if(category==='boss')enemy.hp*=.88;
    else if(category==='void')enemy.hp*=.92;
  }
  enemy.maxHp=enemy.hp;
}
function enemyControlFactor(e){if(e?.kind==='apex'||e?.controlImmune)return 0;const radius=Math.max(10,e?.r||10);let f=clamp(22/radius,.18,1);if(e?.type==='tank')f*=.78;if(e?.type==='mini')f*=.52;if(e?.type==='boss')f*=.28;return clamp(f,.08,1);}
function enemyProjectileVisualFor(e,pattern='ring'){
  const form=e?.apexForm||e?.eliteForm||'',event=String(e?.eventKind||'');
  if(form==='chronophage')return'chrono';
  if(form==='starforge')return'forge';
  if(form==='lastconstellation')return'constellation';
  if(event.includes('void')||['maw','oracle','weaver','grave','paradox'].includes(form))return'void';
  if(['mirror','paradox'].includes(form))return'mirror';
  if(['heliarch','colossus'].includes(form))return'sun';
  if(['tempest','warden','seraph'].includes(form))return'storm';
  if(['archivist','nullengine'].includes(form))return'rune';
  if(['leviathan','executioner','harvester'].includes(form))return'needle';
  if(e?.type==='ranged')return event==='crash'?'forge':'ranged-bolt';
  return pattern==='fan'?'needle':'orb';
}
function fireFan(e,count,spread,speed,damage,color,r=5.5){const base=Math.atan2(player.y-e.y,player.x-e.x),visual=enemyProjectileVisualFor(e,'fan');for(let i=0;i<count;i++)spawnEnemyProjectile(e.x,e.y,base+(i-(count-1)/2)*spread,speed,damage,color,r,6,visual);}
function fireRing(e,count,speed,damage,color,offset=0,r=5.2){const visual=enemyProjectileVisualFor(e,'ring');for(let i=0;i<count;i++)spawnEnemyProjectile(e.x,e.y,i/count*TAU+offset,speed,damage,color,r,6.4,visual);}
function addCircle(x,y,r,damage,color,life=1.1){if(state.entities.telegraphs.length>=entityCap('telegraphs'))state.entities.telegraphs.shift();state.entities.telegraphs.push({type:'circle',x,y,r,life,max:life,damage,color,impactStyle:'boss-circle',phase:Math.random()*TAU});}
function addLine(e,a,length,width,damage,color,life=.8){if(state.entities.telegraphs.length>=entityCap('telegraphs'))state.entities.telegraphs.shift();state.entities.telegraphs.push({type:'line',x:e.x,y:e.y,a,length,width,life,max:life,damage,color,impactStyle:'boss-line',phase:Math.random()*TAU});}
function summonMinions(e,count=4,kind='grunt'){for(let i=0;i<count;i++){const m=spawnEnemy('normal');if(!m)continue;m.type=kind;m.x=e.x+Math.cos(i/count*TAU)*rand(100,170);m.y=e.y+Math.sin(i/count*TAU)*rand(100,170);m.hp*=1.18;m.maxHp=m.hp;m.damage*=1.06;m.color=e.color;m.eventKind=e.eventKind==='void'?'void-minion':m.eventKind;}}
function skillScale(e){return e.kind==='apex'&&e.hp/e.maxHp<.55?.72:1;}
