// Run progression pauses for the entire Apex lifecycle. The simulation clock
// (state.time) keeps ticking for attacks, animation, movement and cooldowns.
function isApexProgressionClockPaused(){
  return!!(state.apexActiveId||state.pendingApexForm||state.apexExitPending||
    ['apexReward'].includes(state.mode)||
    ['apex-entry','apex-exit'].includes(state.realmTransition?.owner)||
    !document.querySelector('#apexRewardScreen')?.classList.contains('hidden'));
}
function runProgressionTime(){return Math.max(0,Number(state.runTime)||0);}
function withProgressionClock(action){const simulationTime=state.time;state.time=runProgressionTime();try{return action();}finally{state.time=simulationTime;}}
window.stackfallApexClockDiagnostics=()=>({runTime:runProgressionTime(),simulationTime:Math.max(0,Number(state.time)||0),paused:isApexProgressionClockPaused(),active:!!state.apexActiveId,pending:!!state.pendingApexForm,exit:!!state.apexExitPending,reward:state.mode==='apexReward'});
const apexClockResetBase=resetGame;
resetGame=function resetGameWithRunClock(){state.runTime=0;return apexClockResetBase();};
const apexClockSpawnBase=spawnEnemy;
spawnEnemy=function spawnEnemyAtRunProgression(){return withProgressionClock(()=>apexClockSpawnBase(...arguments));};
const apexClockSpawningBase=updateSpawning;
updateSpawning=function updateSpawningAtRunProgression(dt){return withProgressionClock(()=>apexClockSpawningBase(dt));};
const apexClockMapEventsBase=window.updateMapEvents;
if(typeof apexClockMapEventsBase==='function')window.updateMapEvents=updateMapEvents=function updateMapEventsAtRunProgression(dt){return withProgressionClock(()=>apexClockMapEventsBase(dt));};
const apexClockUpdateHudBase=updateHUD;
updateHUD=function updateHudWithRunClock(){const result=apexClockUpdateHudBase();const seconds=Math.floor(runProgressionTime()),minutes=Math.floor(seconds/60),remainder=seconds%60;if(ui.timer)ui.timer.textContent=`${String(minutes).padStart(2,'0')}:${String(remainder).padStart(2,'0')}`;state.threat=1+Math.floor(seconds/60);if(ui.threat)ui.threat.textContent=`${tr('hud.threat')} ${state.threat}`;return result;};
const apexClockEndGameBase=endGame;
endGame=function endGameWithRunTime(){const result=apexClockEndGameBase();if(ui.resultTime)ui.resultTime.textContent=formatTime(runProgressionTime());return result;};
const apexClockUpdateApexBase=updateApexSystems;
updateApexSystems=function updateApexAtProgressionTime(dt=0,priorityOnly=false){if(state.apexActiveId||state.apexExitPending||String(state.realmTransition?.to||'').startsWith('apex-'))return apexClockUpdateApexBase(dt,priorityOnly);return withProgressionClock(()=>apexClockUpdateApexBase(dt,priorityOnly));};
