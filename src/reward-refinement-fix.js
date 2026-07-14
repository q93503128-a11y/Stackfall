STACK_EFFECTS.bulwark=[
  ['성광 피막','받는 피해를 줄이는 기본 성광 장벽.'],
  ['겹빛 장벽','최대 체력과 피해 감소가 증가하는 이중 장벽.'],
  ['재충전 장벽','일정 시간마다 보호막을 회복하는 재충전 장벽.'],
  ['보복 파동','피격 시 주변 적을 밀어내는 반격 파동.'],
  ['요새 장막','보호막 용량과 재충전량이 증가하는 요새 장막.'],
  ['천체 성벽','주기적으로 강력한 보호막을 충전하는 천체 성벽.']
];
if(STACK_EFFECTS_EN)STACK_EFFECTS_EN.bulwark=['Radiant Film','Layered Barrier','Recharge Barrier','Retaliation Wave','Fortress Veil','Celestial Wall'];
if(STACK_DESC_EN)STACK_DESC_EN.bulwark=['A radiant barrier that reduces incoming damage.','A layered barrier with increased maximum health and damage reduction.','A recharging barrier that restores shield over time.','Taking damage releases a repelling counter wave.','A fortress veil with greater shield capacity and recharge.','A celestial wall that periodically charges a powerful shield.'];
if(STACK_EFFECTS_JA)STACK_EFFECTS_JA.bulwark=['星光皮膜','重光障壁','再充填障壁','報復波動','要塞帳幕','天体城壁'];
if(STACK_DESC_JA)STACK_DESC_JA.bulwark=['被ダメージを軽減する基本星光障壁。','最大HPと軽減率が増える二重障壁。','一定時間ごとにシールドを回復する障壁。','被弾時に周囲を押し返す反撃波。','シールド容量と充填量が増える要塞帳幕。','定期的に強力なシールドを充填する天体城壁。'];

const rewardFixKill=killEnemy;
killEnemy=function killEnemyWithoutDuplicateSpecialReward(enemy,opts={}){
  const before=state.rewardQueue?.length||0,wellsBefore=state.entities.wells.length,result=rewardFixKill(enemy,opts);
  const suppress=enemy?.kind==='apex'||enemy?.eventKind==='void'||enemy?.noEliteReward===true;
  if(suppress&&state.rewardQueue?.length>before)state.rewardQueue.splice(before);
  if(state.bossTraits?.singularity&&state.entities.wells.length>wellsBefore&&(state.rewardKills||0)%18===0){const well=state.entities.wells[state.entities.wells.length-1];if(well){well.kind='trait-singularity';well.color='#e65cff';well.r=118;well.strength=720;well.damage=Math.max(18,well.damage||0);well.max=well.life=Math.max(2.2,well.life||0);}}
  return result;
};
const rewardFixEnd=endGame;
endGame=function endGameWithoutPendingRewards(){state.rewardQueue=[];return rewardFixEnd();};

const strongCometBase=fireComet;
fireComet=function fireCometWithFormation(target,n,echoed=false){strongCometBase(target,n,echoed);if(!state.weaponAugments?.comet||!target||echoed)return;const delays=[135,230];delays.forEach((delay,index)=>setTimeout(()=>{if(state.mode!=='playing')return;const live=target&&!target.dead?target:nearestEnemy(player.x,player.y);if(!live)return;const base=Math.atan2(live.y-player.y,live.x-player.x),offset=(index?1:-1)*.105,a=base+offset;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*(590+index*35),vy:Math.sin(a)*(590+index*35),r:7.4+n*.35,life:1.7,damage:(23+n*4.8)*(index?.72:.84),color:index?'#b7eaff':'#efffff',pierce:2+Math.floor(n/2),source:'comet-afterimage',fragment:n>=4,trailDamage:n>=5,explode:n>=6});},delay));};
const strongPrismBase=firePrism;
firePrism=function firePrismWithCrossLattice(n,echoed=false){strongPrismBase(n,echoed);if(!state.weaponAugments?.prism||echoed)return;const target=nearestEnemy(player.x,player.y);if(!target)return;for(const offset of [-Math.PI/4,Math.PI/4]){const a=Math.atan2(target.y-player.y,target.x-player.x)+offset,len=Math.hypot(vw,vh)*.72,x1=target.x-Math.cos(a)*len,y1=target.y-Math.sin(a)*len,x2=target.x+Math.cos(a)*len,y2=target.y+Math.sin(a)*len;state.entities.beams.push({x1,y1,x2,y2,life:.22,max:.22,color:'#f0eaff',width:3.1});for(const e of state.entities.enemies)if(!e.dead&&segmentDistance(e.x,e.y,x1,y1,x2,y2)<e.r+7)dealDamage(e,13+n*3.1,{color:'#f0eaff',source:'prism-lattice',canCrit:false});}};
const strongWellsBase=updateWells;
updateWells=function updateWellsWithTerminalCollapse(dt){const expiring=state.entities.wells.filter(w=>w.rewardBurst&&!w.strongRewardBurstDone&&w.life<=dt+.035);strongWellsBase(dt);for(const w of expiring){w.strongRewardBurstDone=true;areaDamage(w.x,w.y,195,34+weaponCount('gravity')*7,COLORS.violet);shockwave(w.x,w.y,'#e8d9ff',245,.58,5);}};
const strongHurtBase=hurtPlayer;
hurtPlayer=function hurtPlayerWithFortifiedReflection(amount,source){strongHurtBase(amount,source);if(!state.weaponAugments?.bulwark||state.mode==='gameover')return;const n=Math.max(1,weaponCount('bulwark'));player.shield=Math.min(58+n*8,player.shield+5+n*1.5);for(let i=0;i<4;i++){const a=i*TAU/4+Math.PI/4;spawnPlayerProjectile({x:player.x,y:player.y,vx:Math.cos(a)*455,vy:Math.sin(a)*455,r:5.2,life:1.0,damage:18+n*4,color:'#b5ffe5',pierce:2,source:'barrier-lance'});}};
const strongDealBase=dealDamage;let augmentBurstGuard=false;
dealDamage=function dealDamageWithEmpoweredAugments(enemy,amount,opts={}){const wasAlive=enemy&&!enemy.dead,locked=enemy?.timeLock>0,source=opts.source||'',x=enemy?.x||0,y=enemy?.y||0;strongDealBase(enemy,amount,opts);if(!wasAlive||augmentBurstGuard)return;const now=performance.now();if(state.weaponAugments?.blade&&source==='blade'&&now-(player.strongBladeBurstAt||0)>430){player.strongBladeBurstAt=now;augmentBurstGuard=true;areaDamage(x,y,88,18+weaponCount('blade')*4.5,COLORS.cyan);augmentBurstGuard=false;}if(state.weaponAugments?.ember&&(source==='ember'||source==='echo-star')){const targets=nearestEnemies(x,y,4,new Set([enemy.id])).slice(0,2);for(const [i,target] of targets.entries()){strongDealBase(target,amount*(i?.30:.42),{color:'#ffb0d0',source:'ember-strong-chain',canCrit:false});state.entities.beams.push({x1:x,y1:y,x2:target.x,y2:target.y,life:.17,max:.17,color:'#ff9aba',width:2.1});}}if(state.weaponAugments?.arc&&source==='arc-return'){for(let i=-2;i<=2;i++){const target=nearestEnemy(x,y);if(!target)break;const a=Math.atan2(target.y-y,target.x-x)+i*.24;spawnPlayerProjectile({x,y,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:4.2,life:.82,damage:amount*.31,color:'#c8fff1',pierce:1,source:'arc-strong-shard'});}}if(state.weaponAugments?.chrono&&locked&&enemy.dead){augmentBurstGuard=true;areaDamage(x,y,118,24+weaponCount('chrono')*4.2,COLORS.chrono);augmentBurstGuard=false;}};