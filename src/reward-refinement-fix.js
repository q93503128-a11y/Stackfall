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
killEnemy=function killEnemyWithoutDuplicateApexReward(enemy,opts={}){
  const before=state.rewardQueue?.length||0,isApex=enemy?.kind==='apex';
  const result=rewardFixKill(enemy,opts);
  if(isApex&&state.rewardQueue?.length>before)state.rewardQueue.splice(before);
  return result;
};
const rewardFixEnd=endGame;
endGame=function endGameWithoutPendingRewards(){state.rewardQueue=[];return rewardFixEnd();};
